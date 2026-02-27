import { Router, Response } from "express";
import mongoose from "mongoose";
import Review from "../models/Review";
import Booking from "../models/Booking";
import WifiSpot from "../models/WifiSpot";
import { protect, AuthRequest, requireRole } from "../middleware/auth";

const router = Router();

// ─── POST /api/reviews ─────────────────────────────────────────────────────────
// Create a new review (user only, after completed/paid booking)
router.post("/", protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      bookingId,
      overallRating,
      speedRating,
      reliabilityRating,
      valueRating,
      title,
      comment,
    } = req.body;

    if (!bookingId || !overallRating) {
      res.status(400).json({ success: false, message: "bookingId and overallRating are required." });
      return;
    }

    // Validate ratings
    const ratings = [overallRating, speedRating, reliabilityRating, valueRating];
    for (const r of ratings) {
      if (r !== undefined && (r < 1 || r > 5)) {
        res.status(400).json({ success: false, message: "Ratings must be between 1 and 5." });
        return;
      }
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    // Verify user owns this booking
    if (booking.user.toString() !== userId) {
      res.status(403).json({ success: false, message: "You can only review your own bookings." });
      return;
    }

    // Check booking is completed/paid
    if (booking.paymentStatus !== "paid") {
      res.status(400).json({ success: false, message: "You can only review paid bookings." });
      return;
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      res.status(400).json({ success: false, message: "You've already reviewed this booking." });
      return;
    }

    // Create the review
    const review = await Review.create({
      user: userId,
      wifiSpot: booking.wifiSpot,
      booking: bookingId,
      overallRating,
      speedRating: speedRating || overallRating,
      reliabilityRating: reliabilityRating || overallRating,
      valueRating: valueRating || overallRating,
      title: title || "",
      comment: comment || "",
      isVerified: true,
    });

    // Update the spot's rating statistics
    await updateSpotRating(booking.wifiSpot.toString());

    res.status(201).json({ success: true, review });
  } catch (err) {
    console.error("[POST /reviews]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/reviews/spot/:spotId ─────────────────────────────────────────────
// Get all reviews for a spot (public)
router.get("/spot/:spotId", async (req, res) => {
  try {
    const { spotId } = req.params;
    const { page = "1", limit = "10" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const objectId = new mongoose.Types.ObjectId(spotId);

    const [reviews, total] = await Promise.all([
      Review.find({ wifiSpot: objectId })
        .populate("user", "name avatar")
        .sort("-createdAt")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments({ wifiSpot: objectId }),
    ]);

    // Calculate average ratings
    const aggregation = await Review.aggregate([
      { $match: { wifiSpot: objectId } },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: "$overallRating" },
          avgSpeed: { $avg: "$speedRating" },
          avgReliability: { $avg: "$reliabilityRating" },
          avgValue: { $avg: "$valueRating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = aggregation[0] || {
      avgOverall: 0,
      avgSpeed: 0,
      avgReliability: 0,
      avgValue: 0,
      count: 0,
    };

    res.json({
      success: true,
      reviews,
      stats: {
        averageRating: Math.round(stats.avgOverall * 10) / 10,
        averageSpeed: Math.round(stats.avgSpeed * 10) / 10,
        averageReliability: Math.round(stats.avgReliability * 10) / 10,
        averageValue: Math.round(stats.avgValue * 10) / 10,
        totalReviews: stats.count,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("[GET /reviews/spot/:spotId]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/reviews/booking/:bookingId ───────────────────────────────────────
// Check if a review exists for a booking (user only)
router.get("/booking/:bookingId", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      res.status(400).json({ success: false, message: "bookingId is required." });
      return;
    }

    const review = await Review.findOne({ booking: bookingId as string })
      .populate("user", "name avatar")
      .lean();

    res.json({
      success: true,
      hasReview: !!review,
      review: review || null,
    });
  } catch (err) {
    console.error("[GET /reviews/booking/:bookingId]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/reviews/my-reviews ───────────────────────────────────────────────
// Get current user's reviews
router.get("/my-reviews", protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const reviews = await Review.find({ user: userId as string })
      .populate("wifiSpot", "name address city")
      .sort("-createdAt")
      .lean();

    res.json({ success: true, reviews });
  } catch (err) {
    console.error("[GET /reviews/my-reviews]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── PUT /api/reviews/:id ──────────────────────────────────────────────────────
// Update own review
router.put("/:id", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { overallRating, speedRating, reliabilityRating, valueRating, title, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found." });
      return;
    }

    if (review.user.toString() !== userId) {
      res.status(403).json({ success: false, message: "You can only edit your own reviews." });
      return;
    }

    // Update fields
    if (overallRating) review.overallRating = overallRating;
    if (speedRating) review.speedRating = speedRating;
    if (reliabilityRating) review.reliabilityRating = reliabilityRating;
    if (valueRating) review.valueRating = valueRating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    review.isEdited = true;

    await review.save();

    // Update spot rating
    await updateSpotRating(review.wifiSpot.toString());

    res.json({ success: true, review });
  } catch (err) {
    console.error("[PUT /reviews/:id]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── DELETE /api/reviews/:id ───────────────────────────────────────────────────
// Delete own review
router.delete("/:id", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found." });
      return;
    }

    if (review.user.toString() !== userId) {
      res.status(403).json({ success: false, message: "You can only delete your own reviews." });
      return;
    }

    const spotId = review.wifiSpot.toString();
    await review.deleteOne();

    // Update spot rating
    await updateSpotRating(spotId);

    res.json({ success: true, message: "Review deleted." });
  } catch (err) {
    console.error("[DELETE /reviews/:id]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/reviews/:id/response ────────────────────────────────────────────
// Owner responds to a review
router.post("/:id/response", protect, requireRole("owner"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { response } = req.body;

    if (!response || response.trim().length === 0) {
      res.status(400).json({ success: false, message: "Response text is required." });
      return;
    }

    const review = await Review.findById(id).populate("wifiSpot", "owner");
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found." });
      return;
    }

    // Verify owner owns this spot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spot = review.wifiSpot as any;
    if (spot.owner.toString() !== userId) {
      res.status(403).json({ success: false, message: "You can only respond to reviews on your spots." });
      return;
    }

    review.ownerResponse = response.trim();
    review.ownerRespondedAt = new Date();
    await review.save();

    res.json({ success: true, review });
  } catch (err) {
    console.error("[POST /reviews/:id/response]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── Helper: Update spot's average rating ──────────────────────────────────────
async function updateSpotRating(spotId: string) {
  const objectId = new mongoose.Types.ObjectId(spotId);
  
  const aggregation = await Review.aggregate([
    { $match: { wifiSpot: objectId } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$overallRating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = aggregation[0] || { avgRating: 0, count: 0 };

  await WifiSpot.findByIdAndUpdate(spotId, {
    rating: Math.round(stats.avgRating * 10) / 10,
    reviewCount: stats.count,
  });
}

export default router;
