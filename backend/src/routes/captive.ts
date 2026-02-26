import { Router, Request, Response } from "express";
import crypto from "crypto";
import { Types } from "mongoose";
import Booking from "../models/Booking";
import CaptiveSession from "../models/CaptiveSession";
import WifiSpot from "../models/WifiSpot";

const router = Router();

// Helper to cast string to ObjectId safely
const toObjectId = (id: string) => id as unknown as Types.ObjectId;

// ─────────────────────────────────────────────────────────────────────────────
// CAPTIVE PORTAL ROUTES
// These routes are PUBLIC (no JWT auth) - they work with access tokens instead
// ─────────────────────────────────────────────────────────────────────────────

// Helper to extract device info from request
function getDeviceInfo(req: Request) {
  const userAgent = req.headers["user-agent"] || "";
  const deviceId = req.headers["x-device-id"] as string || 
                   req.query.device_id as string ||
                   crypto.randomBytes(16).toString("hex");
  
  let deviceType = "unknown";
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    deviceType = /tablet|ipad/i.test(userAgent) ? "tablet" : "mobile";
  } else if (/windows|macintosh|linux/i.test(userAgent)) {
    deviceType = "laptop";
  }

  return {
    deviceId,
    deviceType,
    deviceName: userAgent.slice(0, 200),
    ipAddress: req.ip || req.socket.remoteAddress || "",
    macAddress: req.headers["x-mac-address"] as string || "",
  };
}

// ─── GET /api/captive/detect/:spotId - Captive portal detection ────────────
// Standard captive portal detection endpoints redirect here
router.get("/detect/:spotId", async (req: Request, res: Response) => {
  try {
    const spotId = req.params.spotId as string;
    const spot = await WifiSpot.findById(spotId).select("name address");
    
    if (!spot) {
      res.status(404).json({ 
        success: false, 
        message: "WiFi spot not found",
        requiresAuth: true 
      });
      return;
    }

    // Check if device already has valid session
    const deviceInfo = getDeviceInfo(req);
    const sessionToken = req.headers["x-session-token"] as string || 
                         req.cookies?.captive_session;

    if (sessionToken) {
      const existingSession = await CaptiveSession.findOne({
        sessionToken,
        wifiSpot: toObjectId(spotId),
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (existingSession) {
        // Update last activity
        existingSession.lastActivityAt = new Date();
        await existingSession.save();

        res.json({
          success: true,
          authenticated: true,
          message: "Device already authenticated",
          expiresAt: existingSession.expiresAt,
        });
        return;
      }
    }

    // Device needs authentication
    res.json({
      success: true,
      authenticated: false,
      requiresAuth: true,
      spot: {
        id: spot._id,
        name: spot.name,
        address: spot.address,
      },
      message: "Authentication required to access WiFi",
    });
  } catch (err) {
    console.error("[GET /captive/detect]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── POST /api/captive/authenticate - Authenticate device with token ───────
router.post("/authenticate", async (req: Request, res: Response) => {
  try {
    const { spotId, accessToken, otp } = req.body;

    if (!spotId || (!accessToken && !otp)) {
      res.status(400).json({
        success: false,
        message: "Spot ID and access token or OTP are required",
      });
      return;
    }

    const spot = await WifiSpot.findById(spotId);
    if (!spot) {
      res.status(404).json({ success: false, message: "WiFi spot not found" });
      return;
    }

    // Find valid booking with matching token/OTP
    const now = new Date();
    const query: Record<string, unknown> = {
      wifiSpot: spotId,
      paymentStatus: "paid",
      status: { $in: ["confirmed", "active"] },
      startTime: { $lte: now },
      endTime: { $gt: now },
    };

    if (accessToken) {
      query.accessToken = accessToken.toUpperCase().trim();
    } else if (otp) {
      query.accessTokenOTP = otp.trim();
    }

    const booking = await Booking.findOne(query);

    if (!booking) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
        errorCode: "INVALID_TOKEN",
      });
      return;
    }

    // Check device limit
    const activeDevices = await CaptiveSession.countDocuments({
      booking: booking._id,
      isActive: true,
      expiresAt: { $gt: now },
    });

    if (activeDevices >= booking.maxDevices) {
      res.status(403).json({
        success: false,
        message: `Device limit reached (${booking.maxDevices} device${booking.maxDevices > 1 ? "s" : ""} allowed)`,
        errorCode: "DEVICE_LIMIT_REACHED",
        maxDevices: booking.maxDevices,
        activeDevices,
      });
      return;
    }

    // Create device session
    const deviceInfo = getDeviceInfo(req);
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Check if this device already has an active session for this spot
    const existingDeviceSession = await CaptiveSession.findOne({
      deviceId: deviceInfo.deviceId,
      wifiSpot: spotId,
      isActive: true,
    });

    if (existingDeviceSession) {
      // Reactivate existing session with new expiry
      existingDeviceSession.sessionToken = sessionToken;
      existingDeviceSession.expiresAt = booking.endTime;
      existingDeviceSession.lastActivityAt = now;
      existingDeviceSession.booking = booking._id;
      await existingDeviceSession.save();

      res.json({
        success: true,
        message: "Device re-authenticated successfully",
        sessionToken,
        expiresAt: booking.endTime,
        spot: {
          name: spot.name,
          address: spot.address,
        },
      });
      return;
    }

    // Create new session
    const session = await CaptiveSession.create({
      booking: booking._id,
      wifiSpot: spotId,
      user: booking.user,
      ...deviceInfo,
      sessionToken,
      expiresAt: booking.endTime,
    });

    // Update booking device count
    booking.activeDeviceCount = activeDevices + 1;
    if (booking.status === "confirmed") {
      booking.status = "active";
      booking.usageStartedAt = now;
    }
    await booking.save();

    res.json({
      success: true,
      message: "Device authenticated successfully",
      sessionToken,
      expiresAt: booking.endTime,
      spot: {
        name: spot.name,
        address: spot.address,
      },
      deviceInfo: {
        type: deviceInfo.deviceType,
        activeDevices: activeDevices + 1,
        maxDevices: booking.maxDevices,
      },
    });
  } catch (err) {
    console.error("[POST /captive/authenticate]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── POST /api/captive/validate - Validate ongoing session (heartbeat) ─────
router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { sessionToken, spotId } = req.body;

    if (!sessionToken) {
      res.status(401).json({
        success: false,
        authenticated: false,
        message: "No session token provided",
      });
      return;
    }

    const now = new Date();
    const session = await CaptiveSession.findOne({
      sessionToken,
      isActive: true,
    }).populate("booking");

    if (!session) {
      res.status(401).json({
        success: false,
        authenticated: false,
        message: "Invalid or expired session",
        errorCode: "SESSION_INVALID",
      });
      return;
    }

    // Check if session expired
    if (session.expiresAt < now) {
      session.isActive = false;
      await session.save();

      // Update booking device count
      await Booking.findByIdAndUpdate(session.booking, {
        $inc: { activeDeviceCount: -1 },
      });

      res.status(401).json({
        success: false,
        authenticated: false,
        message: "Session expired - booking time ended",
        errorCode: "SESSION_EXPIRED",
      });
      return;
    }

    // Check if booking is still valid
    const booking = await Booking.findById(session.booking);
    if (!booking || booking.status === "cancelled" || booking.status === "completed") {
      session.isActive = false;
      await session.save();

      res.status(401).json({
        success: false,
        authenticated: false,
        message: "Booking is no longer active",
        errorCode: "BOOKING_INVALID",
      });
      return;
    }

    // Session is valid - update last activity
    session.lastActivityAt = now;
    await session.save();

    const timeRemaining = Math.max(0, Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000));

    res.json({
      success: true,
      authenticated: true,
      timeRemaining,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error("[POST /captive/validate]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── POST /api/captive/disconnect - Disconnect device session ──────────────
router.post("/disconnect", async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      res.status(400).json({
        success: false,
        message: "Session token required",
      });
      return;
    }

    const session = await CaptiveSession.findOne({
      sessionToken,
      isActive: true,
    });

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found or already disconnected",
      });
      return;
    }

    session.isActive = false;
    await session.save();

    // Update booking device count
    await Booking.findByIdAndUpdate(session.booking, {
      $inc: { activeDeviceCount: -1 },
    });

    res.json({
      success: true,
      message: "Device disconnected successfully",
    });
  } catch (err) {
    console.error("[POST /captive/disconnect]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── GET /api/captive/status/:spotId - Get captive portal status ───────────
router.get("/status/:spotId", async (req: Request, res: Response) => {
  try {
    const spotId = req.params.spotId as string;
    const sessionToken = req.headers["x-session-token"] as string ||
                         req.query.session as string;

    const spot = await WifiSpot.findById(spotId).select("name address isActive monitoring");
    
    if (!spot) {
      res.status(404).json({ success: false, message: "WiFi spot not found" });
      return;
    }

    if (!spot.isActive || !spot.monitoring.isOnline) {
      res.json({
        success: true,
        spotOnline: false,
        message: "This WiFi spot is currently offline",
      });
      return;
    }

    // Check session if provided
    if (sessionToken) {
      const session = await CaptiveSession.findOne({
        sessionToken,
        wifiSpot: toObjectId(spotId),
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (session) {
        const timeRemaining = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
        res.json({
          success: true,
          authenticated: true,
          spotOnline: true,
          timeRemaining,
          expiresAt: session.expiresAt,
        });
        return;
      }
    }

    res.json({
      success: true,
      authenticated: false,
      spotOnline: true,
      spot: {
        id: spot._id,
        name: spot.name,
        address: spot.address,
      },
    });
  } catch (err) {
    console.error("[GET /captive/status]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── GET /api/captive/sessions/:bookingId - Get active sessions (protected) ─
// This endpoint requires the access token for security
router.get("/sessions/:bookingId", async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    const accessToken = req.headers["x-access-token"] as string || 
                        req.query.token as string;

    if (!accessToken) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    const booking = await Booking.findOne({
      _id: toObjectId(bookingId),
      accessToken: accessToken.toUpperCase(),
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found or invalid token",
      });
      return;
    }

    const sessions = await CaptiveSession.find({
      booking: toObjectId(bookingId),
      isActive: true,
    }).select("deviceType deviceName ipAddress authenticatedAt lastActivityAt");

    res.json({
      success: true,
      maxDevices: booking.maxDevices,
      activeDevices: sessions.length,
      sessions: sessions.map(s => ({
        deviceType: s.deviceType,
        deviceName: s.deviceName.slice(0, 50),
        authenticatedAt: s.authenticatedAt,
        lastActive: s.lastActivityAt,
      })),
    });
  } catch (err) {
    console.error("[GET /captive/sessions]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── POST /api/captive/revoke - Revoke a specific device session ───────────
router.post("/revoke", async (req: Request, res: Response) => {
  try {
    const { bookingId, deviceId, accessToken } = req.body;

    if (!bookingId || !accessToken) {
      res.status(400).json({
        success: false,
        message: "Booking ID and access token required",
      });
      return;
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      accessToken: accessToken.toUpperCase(),
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found or invalid token",
      });
      return;
    }

    // Revoke specific device or all devices
    const query: Record<string, unknown> = {
      booking: bookingId,
      isActive: true,
    };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const result = await CaptiveSession.updateMany(query, {
      $set: { isActive: false },
    });

    // Update booking device count
    booking.activeDeviceCount = Math.max(0, booking.activeDeviceCount - result.modifiedCount);
    await booking.save();

    res.json({
      success: true,
      message: `${result.modifiedCount} device(s) disconnected`,
      revokedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("[POST /captive/revoke]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── Cleanup expired sessions (can be called by cron job) ──────────────────
router.post("/cleanup", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // Find and deactivate expired sessions
    const expiredSessions = await CaptiveSession.find({
      isActive: true,
      expiresAt: { $lt: now },
    });

    // Update booking device counts
    const bookingUpdates: Map<string, number> = new Map();
    for (const session of expiredSessions) {
      const bookingId = session.booking.toString();
      bookingUpdates.set(bookingId, (bookingUpdates.get(bookingId) || 0) + 1);
    }

    for (const [bookingId, count] of bookingUpdates) {
      await Booking.findByIdAndUpdate(bookingId, {
        $inc: { activeDeviceCount: -count },
      });
    }

    // Deactivate sessions
    const result = await CaptiveSession.updateMany(
      { isActive: true, expiresAt: { $lt: now } },
      { $set: { isActive: false } }
    );

    // Also complete bookings that have ended
    await Booking.updateMany(
      {
        status: "active",
        endTime: { $lt: now },
      },
      {
        $set: { 
          status: "completed",
          usageEndedAt: now,
        },
      }
    );

    res.json({
      success: true,
      message: "Cleanup completed",
      sessionsDeactivated: result.modifiedCount,
    });
  } catch (err) {
    console.error("[POST /captive/cleanup]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
