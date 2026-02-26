import { Router, Request, Response } from "express";
import WifiSpot from "../models/WifiSpot";

const router = Router();

// ─── GET /api/spots ────────────────────────────────────────────────────────
// Query params: city, tag, maxPrice, minSpeed, active, search, page, limit, sort
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      city,
      tag,
      maxPrice,
      minSpeed,
      active,
      search,
      page = "1",
      limit = "50",
      sort = "-createdAt",
    } = req.query as Record<string, string>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isApproved: true };

    if (city)     filter.city    = { $regex: new RegExp(`^${city}$`, "i") };
    if (tag)      filter.tag     = tag;
    if (active)   filter.isActive = active === "true";
    if (maxPrice) filter.pricePerHour = { $lte: Number(maxPrice) };
    if (minSpeed) filter.speedMbps    = { $gte: Number(minSpeed) };
    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { city:    { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [spots, total] = await Promise.all([
      WifiSpot.find(filter)
        .select("-ssid -wifiPassword -paymentSetup")  // never expose credentials in list view
        .sort(sort as string)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WifiSpot.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      spots,
    });
  } catch (err) {
    console.error("[GET /spots]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/spots/:id ────────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const spot = await WifiSpot.findById(req.params.id)
      .select("-ssid -wifiPassword -paymentSetup")
      .lean();

    if (!spot) {
      res.status(404).json({ success: false, message: "Spot not found." });
      return;
    }

    res.json({ success: true, spot });
  } catch (err) {
    console.error("[GET /spots/:id]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/spots/:id/health ─────────────────────────────────────────────
// Public endpoint — any user can check the live health of a WiFi spot.
// Returns:
//   freshness: "verified" (pinged < 15 min ago) | "stale" (15 min – 2 hr) | "unknown" (no ping data)
//   recommendation: human-readable advice for the user
router.get("/:id/health", async (req: Request, res: Response) => {
  try {
    const spot = await WifiSpot.findById(req.params.id)
      .select("name isActive monitoring speedMbps currentUsers maxUsers")
      .lean();

    if (!spot) {
      res.status(404).json({ success: false, message: "Spot not found." });
      return;
    }

    const m = spot.monitoring;
    const now = new Date();

    // Determine freshness of the last ping
    let freshness: "verified" | "stale" | "unknown" = "unknown";
    let freshnessLabel = "No ping data yet";
    let minutesAgo: number | null = null;

    if (m?.lastPingAt) {
      minutesAgo = Math.round((now.getTime() - new Date(m.lastPingAt).getTime()) / 60000);
      if (minutesAgo <= 15) {
        freshness = "verified";
        freshnessLabel = minutesAgo < 1 ? "Verified just now" : `Verified ${minutesAgo} min ago`;
      } else if (minutesAgo <= 120) {
        freshness = "stale";
        freshnessLabel = minutesAgo < 60
          ? `Last checked ${minutesAgo} min ago — may have changed`
          : `Last checked ${Math.round(minutesAgo / 60)} hr ago — may have changed`;
      } else {
        freshness = "unknown";
        freshnessLabel = minutesAgo < 1440
          ? `Last checked ${Math.round(minutesAgo / 60)} hr ago — status unverified`
          : "Not checked in over 24 hrs — status unverified";
      }
    }

    // Pull latency from the last ping entry
    const pingHistory = m?.pingHistory ?? [];
    const lastPing = pingHistory.length > 0 ? pingHistory[pingHistory.length - 1] : null;
    const latencyMs: number | null = lastPing ? lastPing.latencyMs : null;

    // Recent 24-hour snapshot (last 20 pings for a quick trend)
    const recentHistory = pingHistory.slice(-20).map((p) => ({
      timestamp: p.timestamp,
      isOnline: p.isOnline,
      latencyMs: p.latencyMs,
    }));

    // Build a user-facing recommendation
    let recommendation = "";
    if (!spot.isActive) {
      recommendation = "This spot is marked offline by the owner — avoid booking.";
    } else if (freshness === "verified" && m?.isOnline) {
      if (latencyMs !== null && latencyMs > 0) {
        recommendation = latencyMs < 50
          ? "Excellent connection — low latency, great for video calls & streaming."
          : latencyMs < 150
          ? "Good connection — suitable for most browsing and work tasks."
          : "Moderate latency — basic browsing should work, heavy streaming may lag.";
      } else {
        recommendation = "WiFi is online and recently verified. Should work well.";
      }
    } else if (freshness === "stale") {
      recommendation = "Status is a bit old. The owner's device may not have checked in recently — proceed with caution.";
    } else {
      recommendation = "No recent health data. Contact the owner or check in person before booking.";
    }

    res.json({
      success: true,
      health: {
        spotId: spot._id,
        spotName: spot.name,
        isActive: spot.isActive,
        isOnline: m?.isOnline ?? true,
        uptimePercent: m?.uptimePercent ?? 100,
        lastPingAt: m?.lastPingAt ?? null,
        latencyMs,
        freshness,
        freshnessLabel,
        minutesAgoChecked: minutesAgo,
        currentUsers: spot.currentUsers,
        maxUsers: spot.maxUsers,
        recentHistory,
        recommendation,
      },
    });
  } catch (err) {
    console.error("[GET /spots/:id/health]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

export default router;
