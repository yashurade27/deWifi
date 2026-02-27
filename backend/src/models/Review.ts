import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReview extends Document {
  user: Types.ObjectId;
  wifiSpot: Types.ObjectId;
  booking: Types.ObjectId;
  
  // Ratings (1-5)
  overallRating: number;
  speedRating: number;
  reliabilityRating: number;
  valueRating: number;
  
  // Content
  title: string;
  comment: string;
  
  // Owner response
  ownerResponse: string | null;
  ownerRespondedAt: Date | null;
  
  // Metadata
  isVerified: boolean;  // True if user actually completed a booking
  isEdited: boolean;
  helpful: number;      // Count of "helpful" votes
  
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wifiSpot: { type: Schema.Types.ObjectId, ref: "WifiSpot", required: true, index: true },
    booking:  { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    
    overallRating:     { type: Number, required: true, min: 1, max: 5 },
    speedRating:       { type: Number, required: true, min: 1, max: 5 },
    reliabilityRating: { type: Number, required: true, min: 1, max: 5 },
    valueRating:       { type: Number, required: true, min: 1, max: 5 },
    
    title:   { type: String, default: "", maxlength: 100 },
    comment: { type: String, default: "", maxlength: 500 },
    
    ownerResponse:     { type: String, default: null },
    ownerRespondedAt:  { type: Date, default: null },
    
    isVerified: { type: Boolean, default: true },
    isEdited:   { type: Boolean, default: false },
    helpful:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure one review per booking
ReviewSchema.index({ booking: 1 }, { unique: true });
// Index for fetching reviews by spot
ReviewSchema.index({ wifiSpot: 1, createdAt: -1 });

export default mongoose.model<IReview>("Review", ReviewSchema);
