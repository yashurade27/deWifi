import mongoose, { Document, Schema, Types } from "mongoose";

// WiFi Monitoring status tracking
export interface IWifiMonitoring {
  lastPingAt: Date | null;
  isOnline: boolean;
  uptimePercent: number;
  totalDowntime: number;    // in minutes
  lastDownAt: Date | null;
  pingHistory: Array<{
    timestamp: Date;
    isOnline: boolean;
    latencyMs: number;
  }>;
}

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
  wifiPassword: string;     // encrypted WiFi password
  securityType: "WPA2" | "WPA3" | "WEP" | "Open";
  tag: "Home" | "Cafe" | "Office" | "Library" | "CoWorking";
  // Payment setup
  paymentSetup: {
    razorpayAccountId: string;
    upiId: string;
    bankAccountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    isVerified: boolean;
  };
  // Monitoring
  monitoring: IWifiMonitoring;
  currentUsers: number;
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
    wifiPassword: { type: String, default: "" },  // encrypted
    securityType: { 
      type: String, 
      enum: ["WPA2", "WPA3", "WEP", "Open"], 
      default: "WPA2" 
    },
    tag: {
      type: String,
      enum: ["Home", "Cafe", "Office", "Library", "CoWorking"],
      default: "Home",
      index: true,
    },
    // Payment setup for owner earnings
    paymentSetup: {
      razorpayAccountId: { type: String, default: "" },
      upiId:             { type: String, default: "" },
      bankAccountNumber: { type: String, default: "" },
      ifscCode:          { type: String, default: "" },
      accountHolderName: { type: String, default: "" },
      isVerified:        { type: Boolean, default: false },
    },
    // WiFi Monitoring
    monitoring: {
      lastPingAt:    { type: Date, default: null },
      isOnline:      { type: Boolean, default: true },
      uptimePercent: { type: Number, default: 100 },
      totalDowntime: { type: Number, default: 0 },
      lastDownAt:    { type: Date, default: null },
      pingHistory:   [{
        timestamp: { type: Date },
        isOnline:  { type: Boolean },
        latencyMs: { type: Number },
      }],
    },
    currentUsers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 2dsphere index for future geo-queries
WifiSpotSchema.index({ lat: 1, lng: 1 });

export default mongoose.model<IWifiSpot>("WifiSpot", WifiSpotSchema);
