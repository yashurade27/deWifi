import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWifiSpot extends Document {
  owner: Types.ObjectId;
  ownerName: string;   // denormalized for fast reads
  ownerAvatar: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pricePerHour: number;
  speedMbps: number;
  maxUsers: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isApproved: boolean;
  amenities: string[];
  availableFrom: string;
  availableTo: string;
  images: string[];
  ssid: string;
  tag: "Home" | "Cafe" | "Office" | "Library" | "CoWorking";
  createdAt: Date;
  updatedAt: Date;
}

const WifiSpotSchema = new Schema<IWifiSpot>(
  {
    owner:        { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerName:    { type: String, required: true },
    ownerAvatar:  { type: String, default: "" },
    name:         { type: String, required: true, trim: true },
    description:  { type: String, default: "" },
    lat:          { type: Number, required: true },
    lng:          { type: Number, required: true },
    address:      { type: String, required: true },
    city:         { type: String, required: true, index: true },
    state:        { type: String, required: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    speedMbps:    { type: Number, default: 0 },
    maxUsers:     { type: Number, default: 1 },
    rating:       { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:  { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true, index: true },
    isApproved:   { type: Boolean, default: true },
    amenities:    [{ type: String }],
    availableFrom:{ type: String, default: "00:00" },
    availableTo:  { type: String, default: "23:59" },
    images:       [{ type: String }],
    ssid:         { type: String, default: "" },
    tag: {
      type: String,
      enum: ["Home", "Cafe", "Office", "Library", "CoWorking"],
      default: "Home",
      index: true,
    },
  },
  { timestamps: true }
);

// 2dsphere index for future geo-queries
WifiSpotSchema.index({ lat: 1, lng: 1 });

export default mongoose.model<IWifiSpot>("WifiSpot", WifiSpotSchema);
