import { Router, Response } from "express";
import WifiSpot from "../models/WifiSpot";
import User from "../models/User";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(protect);

// ─── GET /api/owner/spots - Get all spots owned by the user ────────────────
router.get("/spots", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const spots = await WifiSpot.find({ owner: req.userId })
      .sort("-createdAt")
      .lean();

    res.json({ success: true, spots });
  } catch (err) {
    console.error("[GET /owner/spots]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/owner/spots/:id - Get single spot owned by user ──────────────
router.get("/spots/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const spot = await WifiSpot.findOne({ 
      _id: String(req.params.id), 
      owner: req.userId 
    }).lean();

    if (!spot) {
      res.status(404).json({ success: false, message: "Spot not found." });
      return;
    }

    res.json({ success: true, spot });
  } catch (err) {
    console.error("[GET /owner/spots/:id]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/owner/spots - Create a new WiFi spot ────────────────────────
router.post("/spots", async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    if (user.role !== "owner") {
      res.status(403).json({ success: false, message: "Only WiFi owners can create spots." });
      return;
    }

    const {
      name,
      description,
      lat,
      lng,
      address,
      city,
      state,
      pricePerHour,
      speedMbps,
      maxUsers,
      amenities,
      availableFrom,
      availableTo,
      ssid,
      wifiPassword,
      securityType,
      tag,
      images,
      paymentSetup,
    } = req.body;

    // Validate required fields
    if (!name || !lat || !lng || !address || !city || !state || !pricePerHour) {
      res.status(400).json({ 
        success: false, 
        message: "Name, location, address, city, state, and price are required." 
      });
      return;
    }

    if (!ssid || !wifiPassword) {
      res.status(400).json({ 
        success: false, 
        message: "WiFi SSID and password are required." 
      });
      return;
    }

    const spot = await WifiSpot.create({
      owner: user._id,
      ownerName: user.name,
      ownerAvatar: "",
      name,
      description: description || "",
      lat,
      lng,
      address,
      city,
      state,
      pricePerHour,
      speedMbps: speedMbps || 0,
      maxUsers: maxUsers || 5,
      amenities: amenities || [],
      availableFrom: availableFrom || "00:00",
      availableTo: availableTo || "23:59",
      ssid,
      wifiPassword,
      securityType: securityType || "WPA2",
      tag: tag || "Home",
      images: images || [],
      paymentSetup: paymentSetup || {},
      isActive: true,
      isApproved: true,  // Auto-approve for now
      monitoring: {
        lastPingAt: new Date(),
        isOnline: true,
        uptimePercent: 100,
        totalDowntime: 0,
        lastDownAt: null,
        pingHistory: [],
      },
    });

    // Don't expose password in response
    const spotResponse = spot.toObject();
    delete (spotResponse as any).wifiPassword;

    res.status(201).json({ success: true, spot: spotResponse });
  } catch (err) {
    console.error("[POST /owner/spots]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── PUT /api/owner/spots/:id - Update a WiFi spot ─────────────────────────
router.put("/spots/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const spot = await WifiSpot.findOne({ 
      _id: String(req.params.id), 
      owner: req.userId 
    });

    if (!spot) {
      res.status(404).json({ success: false, message: "Spot not found." });
      return;
    }

    const allowedFields = [
      "name", "description", "lat", "lng", "address", "city", "state",
      "pricePerHour", "speedMbps", "maxUsers", "amenities", "availableFrom",
      "availableTo", "ssid", "wifiPassword", "securityType", "tag", "images",
      "paymentSetup", "isActive", "blockchainSpotId"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (spot as any)[field] = req.body[field];
      }
    }

    await spot.save();

    // Don't expose password in response
    const spotResponse = spot.toObject();
    delete (spotResponse as any).wifiPassword;

    res.json({ success: true, spot: spotResponse });
  } catch (err) {
    console.error("[PUT /owner/spots/:id]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── DELETE /api/owner/spots/:id - Delete a WiFi spot ──────────────────────
router.delete("/spots/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const result = await WifiSpot.deleteOne({ 
      _id: String(req.params.id), 
      owner: req.userId 
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: "Spot not found." });
      return;
    }

    res.json({ success: true, message: "Spot deleted successfully." });
  } catch (err) {
    console.error("[DELETE /owner/spots/:id]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── PATCH /api/owner/spots/:id/blockchain - Set blockchainSpotId after on-chain registration ─
router.patch("/spots/:id/blockchain", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const { blockchainSpotId } = req.body;
    if (blockchainSpotId === undefined || blockchainSpotId === null || Number(blockchainSpotId) < 0) {
      res.status(400).json({ success: false, message: "blockchainSpotId must be a non-negative integer." });
      return;
    }

    const spot = await WifiSpot.findOneAndUpdate(
      { _id: String(req.params.id), owner: req.userId },
      { blockchainSpotId: Number(blockchainSpotId) },
      { new: true }
    );

    if (!spot) {
      res.status(404).json({ success: false, message: "Spot not found." });
      return;
    }

    res.json({ success: true, blockchainSpotId: spot.blockchainSpotId });
  } catch (err) {
    console.error("[PATCH /owner/spots/:id/blockchain]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/owner/spots/:id/toggle - Toggle spot active status ─────────
router.post("/spots/:id/toggle", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const spot = await WifiSpot.findOne({ 
      _id: String(req.params.id), 
      owner: req.userId 
    });

    if (!spot) {
      res.status(404).json({ success: false, message: "Spot not found." });
      return;
    }

    spot.isActive = !spot.isActive;
    await spot.save();

    res.json({ 
      success: true, 
      isActive: spot.isActive,
      message: spot.isActive ? "Spot activated." : "Spot deactivated."
    });
  } catch (err) {
    console.error("[POST /owner/spots/:id/toggle]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/owner/stats - Get owner dashboard stats ─────────────────────
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const spots = await WifiSpot.find({ owner: req.userId }).lean();
    
    const totalSpots = spots.length;
    const activeSpots = spots.filter(s => s.isActive).length;
    const onlineSpots = spots.filter(s => s.monitoring?.isOnline).length;
    const avgRating = spots.length > 0 
      ? spots.reduce((sum, s) => sum + (s.rating || 0), 0) / spots.length 
      : 0;
    const avgUptime = spots.length > 0
      ? spots.reduce((sum, s) => sum + (s.monitoring?.uptimePercent || 100), 0) / spots.length
      : 100;

    res.json({
      success: true,
      stats: {
        totalSpots,
        activeSpots,
        onlineSpots,
        avgRating: Math.round(avgRating * 10) / 10,
        avgUptime: Math.round(avgUptime * 10) / 10,
      },
    });
  } catch (err) {
    console.error("[GET /owner/stats]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/owner/spots/:id/ping - Update WiFi monitoring status ───────
router.post("/spots/:id/ping", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const { isOnline, latencyMs } = req.body;
    
    const spot = await WifiSpot.findOne({ 
      _id: String(req.params.id), 
      owner: req.userId 
    });

    if (!spot) {
      res.status(404).json({ success: false, message: "Spot not found." });
      return;
    }

    const now = new Date();
    const wasOnline = spot.monitoring.isOnline;
    
    // Update monitoring status
    spot.monitoring.lastPingAt = now;
    spot.monitoring.isOnline = isOnline;
    
    // Track downtime
    if (wasOnline && !isOnline) {
      spot.monitoring.lastDownAt = now;
    } else if (!wasOnline && isOnline && spot.monitoring.lastDownAt) {
      const downtimeMinutes = Math.round(
        (now.getTime() - new Date(spot.monitoring.lastDownAt).getTime()) / 60000
      );
      spot.monitoring.totalDowntime += downtimeMinutes;
    }
    
    // Update ping history (keep last 100 entries)
    spot.monitoring.pingHistory.push({
      timestamp: now,
      isOnline,
      latencyMs: latencyMs || 0,
    });
    if (spot.monitoring.pingHistory.length > 100) {
      spot.monitoring.pingHistory = spot.monitoring.pingHistory.slice(-100);
    }
    
    // Calculate uptime percentage (based on last 24 hours of pings)
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentPings = spot.monitoring.pingHistory.filter(
      p => new Date(p.timestamp) >= last24h
    );
    if (recentPings.length > 0) {
      const onlinePings = recentPings.filter(p => p.isOnline).length;
      spot.monitoring.uptimePercent = Math.round((onlinePings / recentPings.length) * 100);
    }

    await spot.save();

    res.json({ 
      success: true, 
      monitoring: {
        isOnline: spot.monitoring.isOnline,
        uptimePercent: spot.monitoring.uptimePercent,
        lastPingAt: spot.monitoring.lastPingAt,
      }
    });
  } catch (err) {
    console.error("[POST /owner/spots/:id/ping]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

export default router;
