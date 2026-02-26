import { Router, Response } from "express";
import Booking from "../models/Booking";
import WifiSpot from "../models/WifiSpot";
import { protect, AuthRequest } from "../middleware/auth";
import { createRazorpayOrder, verifyRazorpaySignature, createRefund } from "../utils/razorpay";
import { RAZORPAY_KEY_ID } from "../config";

const router = Router();

// All routes require authentication
router.use(protect);

// Platform fee percentage
const PLATFORM_FEE_PERCENT = 2;

// ─── GET /api/bookings/razorpay-key - Get Razorpay key for frontend ────────
router.get("/razorpay-key", async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true, key: RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("[GET /bookings/razorpay-key]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/bookings - Create a new booking ─────────────────────────────
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const { wifiSpotId, durationHours, startTime } = req.body;

    if (!wifiSpotId || !durationHours) {
      res.status(400).json({ 
        success: false, 
        message: "WiFi spot ID and duration are required." 
      });
      return;
    }

    const spot = await WifiSpot.findById(wifiSpotId);
    if (!spot) {
      res.status(404).json({ success: false, message: "WiFi spot not found." });
      return;
    }

    if (!spot.isActive || !spot.isApproved) {
      res.status(400).json({ success: false, message: "This WiFi spot is not available." });
      return;
    }

    if (!spot.monitoring.isOnline) {
      res.status(400).json({ success: false, message: "This WiFi spot is currently offline." });
      return;
    }

    // Check if spot has reached max users
    if (spot.currentUsers >= spot.maxUsers) {
      res.status(400).json({ success: false, message: "This WiFi spot is at full capacity." });
      return;
    }

    // Calculate pricing
    const subtotal = spot.pricePerHour * durationHours;
    const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT) / 100;
    const ownerEarnings = subtotal - platformFee;
    const totalAmount = subtotal;

    // Calculate times
    const bookingStartTime = startTime ? new Date(startTime) : new Date();
    const bookingEndTime = new Date(bookingStartTime.getTime() + durationHours * 60 * 60 * 1000);

    // Create Razorpay order (receipt must be <= 40 chars)
    const receipt = `bk_${Date.now()}_${String(req.userId).slice(-8)}`;
    const razorpayOrder = await createRazorpayOrder(totalAmount, receipt, {
      userId: String(req.userId),
      wifiSpotId: String(spot._id),
      durationHours: String(durationHours),
    });

    const booking = await Booking.create({
      user: req.userId,
      wifiSpot: spot._id,
      owner: spot.owner,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      durationHours,
      pricePerHour: spot.pricePerHour,
      subtotal,
      platformFee,
      ownerEarnings,
      totalAmount,
      status: "pending",
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(201).json({
      success: true,
      booking: {
        id: (booking as any)._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount, // Amount in paise
        currency: razorpayOrder.currency,
        spot: {
          id: spot._id,
          name: spot.name,
          address: spot.address,
        },
        durationHours,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        priceBreakdown: {
          pricePerHour: spot.pricePerHour,
          subtotal,
          platformFee,
          total: totalAmount,
        },
      },
    });
  } catch (err) {
    console.error("[POST /bookings]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/bookings/verify-payment - Verify payment and activate ───────
router.post("/verify-payment", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: "Missing payment details." });
      return;
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.userId,
    });

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    if (booking.paymentStatus === "paid") {
      res.status(400).json({ success: false, message: "Payment already verified." });
      return;
    }

    // Verify Razorpay signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      res.status(400).json({ success: false, message: "Invalid payment signature." });
      return;
    }

    // Payment verified, update booking
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.wifiCredentialsRevealed = true;
    
    // Generate captive portal access token
    booking.generateAccessToken();

    await booking.save();

    // Increment current users count on the spot
    await WifiSpot.findByIdAndUpdate(booking.wifiSpot, {
      $inc: { currentUsers: 1 },
    });

    // Fetch spot for WiFi credentials
    const spot = await WifiSpot.findById(booking.wifiSpot);

    res.json({
      success: true,
      message: "Payment verified successfully.",
      booking: {
        id: booking._id,
        status: booking.status,
        startTime: booking.startTime,
        endTime: booking.endTime,
        accessToken: booking.accessToken,
        accessTokenOTP: booking.accessTokenOTP,
        maxDevices: booking.maxDevices,
      },
      wifiCredentials: spot ? {
        ssid: spot.ssid,
        password: spot.wifiPassword,
        securityType: spot.securityType,
      } : null,
    });
  } catch (err) {
    console.error("[POST /bookings/verify-payment]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/bookings/my-bookings - Get user's bookings ───────────────────
router.get("/my-bookings", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const { status } = req.query;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { user: req.userId };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("wifiSpot", "name address ssid wifiPassword securityType monitoring")
      .sort("-createdAt")
      .lean();

    // Only reveal WiFi credentials for paid bookings
    const safeBookings = bookings.map(b => {
      const booking = { ...b };
      if (b.paymentStatus !== "paid" && b.wifiSpot) {
        (booking.wifiSpot as any).wifiPassword = undefined;
      }
      return booking;
    });

    res.json({ success: true, bookings: safeBookings });
  } catch (err) {
    console.error("[GET /bookings/my-bookings]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/bookings/active - Get active booking sessions ────────────────
router.get("/active", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const now = new Date();
    
    const activeBookings = await Booking.find({
      user: req.userId,
      status: { $in: ["confirmed", "active"] },
      paymentStatus: "paid",
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate("wifiSpot", "name address ssid wifiPassword securityType monitoring speedMbps")
      .lean();

    res.json({ success: true, bookings: activeBookings });
  } catch (err) {
    console.error("[GET /bookings/active]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/bookings/:id - Get booking details with credentials ─────────
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const booking = await Booking.findOne({
      _id: String(req.params.id),
      user: req.userId,
    })
      .populate("wifiSpot", "name address ssid wifiPassword securityType monitoring speedMbps images")
      .lean();

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    // Only reveal password if payment is confirmed
    if (booking.paymentStatus !== "paid" && booking.wifiSpot) {
      (booking.wifiSpot as any).wifiPassword = undefined;
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error("[GET /bookings/:id]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/bookings/:id/start - Start using WiFi ───────────────────────
router.post("/:id/start", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const booking = await Booking.findOne({
      _id: String(req.params.id),
      user: req.userId,
      paymentStatus: "paid",
    });

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    booking.status = "active";
    booking.usageStartedAt = new Date();
    await booking.save();

    res.json({ success: true, message: "WiFi session started." });
  } catch (err) {
    console.error("[POST /bookings/:id/start]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/bookings/:id/complete - End WiFi session ────────────────────
router.post("/:id/complete", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const booking = await Booking.findOne({
      _id: String(req.params.id),
      user: req.userId,
    });

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    booking.status = "completed";
    booking.usageEndedAt = new Date();
    await booking.save();

    // Decrement current users count
    await WifiSpot.findByIdAndUpdate(booking.wifiSpot, {
      $inc: { currentUsers: -1 },
    });

    res.json({ success: true, message: "WiFi session completed." });
  } catch (err) {
    console.error("[POST /bookings/:id/complete]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/bookings/:id/cancel - Cancel booking ────────────────────────
router.post("/:id/cancel", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const booking = await Booking.findOne({
      _id: String(req.params.id),
      user: req.userId,
    });

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    if (booking.status === "completed") {
      res.status(400).json({ success: false, message: "Cannot cancel a completed booking." });
      return;
    }

    booking.status = "cancelled";
    
    // Process refund if payment was made
    if (booking.paymentStatus === "paid" && booking.razorpayPaymentId) {
      try {
        await createRefund(booking.razorpayPaymentId);
        booking.paymentStatus = "refunded";
      } catch (refundError) {
        console.error("Refund failed:", refundError);
        // Save the cancellation but note the refund failed
        await booking.save();
        res.status(500).json({ 
          success: false, 
          message: "Booking cancelled but refund processing failed. Please contact support." 
        });
        return;
      }
    }
    
    await booking.save();

    // Decrement current users if booking was active
    if (booking.paymentStatus === "refunded") {
      await WifiSpot.findByIdAndUpdate(booking.wifiSpot, {
        $inc: { currentUsers: -1 },
      });
    }

    res.json({ 
      success: true, 
      message: booking.paymentStatus === "refunded" 
        ? "Booking cancelled and refund initiated." 
        : "Booking cancelled."
    });
  } catch (err) {
    console.error("[POST /bookings/:id/cancel]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

export default router;
