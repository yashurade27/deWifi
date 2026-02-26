import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICaptiveSession extends Document {
  booking: Types.ObjectId;
  wifiSpot: Types.ObjectId;
  user: Types.ObjectId;
  
  // Device identification
  deviceId: string;         // MAC address or unique device identifier
  deviceType: string;       // mobile, laptop, tablet, etc.
  deviceName: string;       // User agent or device name
  ipAddress: string;        // IP assigned to device
  macAddress: string;       // MAC address if available
  
  // Session status
  isActive: boolean;
  authenticatedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  
  // Session token for maintaining auth state
  sessionToken: string;
  
  // Bandwidth/Usage tracking (optional for future)
  dataUsedMB: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const CaptiveSessionSchema = new Schema<ICaptiveSession>(
  {
    booking:  { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    wifiSpot: { type: Schema.Types.ObjectId, ref: "WifiSpot", required: true, index: true },
    user:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    
    deviceId:   { type: String, required: true },
    deviceType: { type: String, default: "unknown" },
    deviceName: { type: String, default: "" },
    ipAddress:  { type: String, default: "" },
    macAddress: { type: String, default: "" },
    
    isActive:        { type: Boolean, default: true, index: true },
    authenticatedAt: { type: Date, default: Date.now },
    lastActivityAt:  { type: Date, default: Date.now },
    expiresAt:       { type: Date, required: true, index: true },
    
    sessionToken: { type: String, required: true, unique: true },
    
    dataUsedMB: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
CaptiveSessionSchema.index({ booking: 1, isActive: 1 });
CaptiveSessionSchema.index({ wifiSpot: 1, isActive: 1 });
CaptiveSessionSchema.index({ sessionToken: 1, isActive: 1 });
CaptiveSessionSchema.index({ deviceId: 1, wifiSpot: 1 });

// Static method to clean expired sessions
CaptiveSessionSchema.statics.cleanExpiredSessions = async function () {
  const now = new Date();
  const result = await this.updateMany(
    { expiresAt: { $lt: now }, isActive: true },
    { $set: { isActive: false } }
  );
  return result.modifiedCount;
};

export default mongoose.model<ICaptiveSession>("CaptiveSession", CaptiveSessionSchema);
