import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBooking extends Document {
  user: Types.ObjectId;
  wifiSpot: Types.ObjectId;
  owner: Types.ObjectId;
  
  // Timing
  startTime: Date;
  endTime: Date;
  durationHours: number;
  
  // Pricing
  pricePerHour: number;
  subtotal: number;
  platformFee: number;      // 2% of subtotal
  ownerEarnings: number;    // 98% of subtotal
  totalAmount: number;
  
  // Status
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  
  // Razorpay
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  
  // WiFi Access (revealed after payment)
  wifiCredentialsRevealed: boolean;
  
  // Tracking
  usageStartedAt: Date | null;
  usageEndedAt: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    user:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wifiSpot: { type: Schema.Types.ObjectId, ref: "WifiSpot", required: true, index: true },
    owner:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    
    startTime:     { type: Date, required: true },
    endTime:       { type: Date, required: true },
    durationHours: { type: Number, required: true, min: 1 },
    
    pricePerHour:  { type: Number, required: true },
    subtotal:      { type: Number, required: true },
    platformFee:   { type: Number, required: true },
    ownerEarnings: { type: Number, required: true },
    totalAmount:   { type: Number, required: true },
    
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    
    razorpayOrderId:   { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "", sparse: true },
    razorpaySignature: { type: String, default: "" },
    
    wifiCredentialsRevealed: { type: Boolean, default: false },
    
    usageStartedAt: { type: Date, default: null },
    usageEndedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for efficient queries
BookingSchema.index({ startTime: 1, endTime: 1 });
BookingSchema.index({ status: 1, paymentStatus: 1 });

export default mongoose.model<IBooking>("Booking", BookingSchema);
