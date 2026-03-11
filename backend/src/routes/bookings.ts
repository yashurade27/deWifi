import { Router, Response } from "express";
import Booking from "../models/Booking";
import WifiSpot from "../models/WifiSpot";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(protect);

// ─── POST /api/bookings - Record an on-chain booking ───────────────────────
// The frontend calls the smart contract first, then posts the tx details here
// so the backend can track the booking in MongoDB for search/display purposes.
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const { wifiSpotId, durationHours, startTime, txHash, tokenId } = req.body;

    if (!wifiSpotId || !durationHours || !txHash || tokenId === undefined) {
      res.status(400).json({
        success: false,
        message: "WiFi spot ID, duration, txHash, and tokenId are required.",
      });
      return;
    }

    const spot = await WifiSpot.findById(wifiSpotId);
    if (!spot) {
      res.status(404).json({ success: false, message: "WiFi spot not found." });
      return;
    }

    const bookingStartTime = startTime ? new Date(startTime) : new Date();
    const bookingEndTime = new Date(bookingStartTime.getTime() + durationHours * 60 * 60 * 1000);

    const subtotal = spot.pricePerHour * durationHours;
    const platformFee = Math.round(subtotal * 0.02 * 100) / 100;
    const ownerEarnings = subtotal - platformFee;

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
      totalAmount: subtotal,
      status: "confirmed",
      paymentStatus: "paid",
      txHash,
      tokenId,
    });

    // Increment current users count on the spot
    await WifiSpot.findByIdAndUpdate(booking.wifiSpot, {
      $inc: { currentUsers: 1 },
    });

    // Generate access token & OTP for captive portal
    booking.generateAccessToken();
    await booking.save();

    res.status(201).json({
      success: true,
      booking: {
        id: (booking as any)._id,
        accessToken: booking.accessToken,
        accessTokenOTP: booking.accessTokenOTP,
        txHash,
        tokenId,
        spot: { id: spot._id, name: spot.name, address: spot.address },
        durationHours,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
      },
    });
  } catch (err) {
    console.error("[POST /bookings]", err);
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

    res.json({ success: true, bookings });
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

// ─── GET /api/bookings/:id - Get booking details ──────────────────────────
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

    res.json({ success: true, booking });
  } catch (err) {
    console.error("[GET /bookings/:id]", err);
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
// Note: Actual refund happens on-chain via AccessManager.cancelSession()
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
    booking.paymentStatus = "refunded";
    await booking.save();

    await WifiSpot.findByIdAndUpdate(booking.wifiSpot, {
      $inc: { currentUsers: -1 },
    });

    res.json({
      success: true,
      message: "Booking cancelled. Refund processed on-chain via smart contract.",
    });
  } catch (err) {
    console.error("[POST /bookings/:id/cancel]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

export default router;
