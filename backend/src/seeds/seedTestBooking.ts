import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/Booking";
import WifiSpot from "../models/WifiSpot";

dotenv.config();

async function createTestBooking() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to MongoDB");

    // Get a spot
    const spot = await WifiSpot.findOne({ isActive: true });
    if (!spot) {
      console.log("No active spot found");
      return;
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const booking = new Booking({
      user: spot.owner,
      wifiSpot: spot._id,
      owner: spot.owner,
      startTime: now,
      endTime: endTime,
      durationHours: 2,
      pricePerHour: spot.pricePerHour,
      subtotal: spot.pricePerHour * 2,
      platformFee: 2,
      ownerEarnings: spot.pricePerHour * 2 - 2,
      totalAmount: spot.pricePerHour * 2,
      status: "confirmed",
      paymentStatus: "paid",
      wifiCredentialsRevealed: true,
      maxDevices: 2,
    });

    booking.generateAccessToken();
    await booking.save();

    console.log("\n========================================");
    console.log("   TEST BOOKING CREATED SUCCESSFULLY   ");
    console.log("========================================");
    console.log(`Spot Name:     ${spot.name}`);
    console.log(`Spot ID:       ${spot._id}`);
    console.log(`Access Token:  ${booking.accessToken}`);
    console.log(`OTP Code:      ${booking.accessTokenOTP}`);
    console.log(`Max Devices:   ${booking.maxDevices}`);
    console.log(`Valid Until:   ${endTime.toLocaleString()}`);
    console.log("========================================");
    console.log(`\n🔗 Test Captive Portal at:`);
    console.log(`   http://localhost:5173/portal?spot=${spot._id}`);
    console.log("\n📝 Use the Access Token or OTP to authenticate!");
    console.log("========================================\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createTestBooking();
