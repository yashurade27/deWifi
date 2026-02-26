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
        .select("-ssid")              // never expose credentials in list view
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
    const spot = await WifiSpot.findById(req.params.id).select("-ssid").lean();

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

export default router;
