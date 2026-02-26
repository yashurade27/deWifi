/**
 * Seed script — inserts dummy WiFi spots + their owner users into MongoDB.
 * Run with:  npx ts-node --transpile-only src/seeds/seedSpots.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import User from "../models/User";
import WifiSpot from "../models/WifiSpot";

// ─── Owner definitions ────────────────────────────────────────────────────────
const owners = [
  { name: "Yash Urade",           email: "yash@dewifi.dev",     phone: "9000000001", avatar: "YU" },
  { name: "Samiksha Musale",      email: "samiksha@dewifi.dev", phone: "9000000002", avatar: "SM" },
  { name: "Vaidehi Narkhede",     email: "vaidehi@dewifi.dev",  phone: "9000000003", avatar: "VN" },
  { name: "Spandan Mali",         email: "spandan@dewifi.dev",  phone: "9000000004", avatar: "SP" },
  { name: "Rohit Deshpande",      email: "rohit@dewifi.dev",    phone: "9000000005", avatar: "RD" },
  { name: "Priya Joshi",          email: "priya@dewifi.dev",    phone: "9000000006", avatar: "PJ" },
  { name: "Arjun Mehta",          email: "arjun@dewifi.dev",    phone: "9000000007", avatar: "AM" },
  { name: "Neha Shah",            email: "neha@dewifi.dev",     phone: "9000000008", avatar: "NS" },
  { name: "Kunal Kapoor",         email: "kunal@dewifi.dev",    phone: "9000000009", avatar: "KK" },
  { name: "Aditya Rao",           email: "aditya@dewifi.dev",   phone: "9000000010", avatar: "AR" },
  { name: "Deepa Krishnamurthy",  email: "deepa@dewifi.dev",    phone: "9000000011", avatar: "DK" },
  { name: "Sravani Reddy",        email: "sravani@dewifi.dev",  phone: "9000000012", avatar: "SR" },
  { name: "Rajan Khanna",         email: "rajan@dewifi.dev",    phone: "9000000013", avatar: "RK" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("✅ Connected to MongoDB");

  // ── Upsert owners ─────────────────────────────────────────────────────────
  const hashedPw = await bcrypt.hash("Dewifi@123", 12);
  const ownerMap: Record<string, mongoose.Types.ObjectId> = {};

  for (const o of owners) {
    const user = await User.findOneAndUpdate(
      { email: o.email },
      {
        $setOnInsert: {
          name: o.name,
          email: o.email,
          phone: o.phone,
          password: hashedPw,
          role: "owner",
        },
      },
      { upsert: true, new: true }
    );
    ownerMap[o.avatar] = user._id as mongoose.Types.ObjectId;
    console.log(`  👤 Owner upserted: ${o.name}`);
  }

  // ── Spot definitions ────────────────────────────────────────────────────
  const spots = [
    // Pune
    {
      ownerAvatar: "YU", name: "Yash's Home Fibre",
      description: "Blazing-fast JioFiber connection in a quiet residential flat. Perfect for remote work or study sessions.",
      lat: 18.5204, lng: 73.8567,
      address: "12, Koregaon Park Lane 5, Pune", city: "Pune", state: "Maharashtra",
      pricePerHour: 35, speedMbps: 200, maxUsers: 3,
      rating: 4.8, reviewCount: 24, isActive: true,
      amenities: ["AC", "Parking", "Power Outlet", "Tea/Coffee"],
      availableFrom: "09:00", availableTo: "21:00",
      images: ["https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=600"],
      ssid: "Yash_Fibre_5G", tag: "Home",
    },
    {
      ownerAvatar: "SM", name: "Samiksha's Cafe Corner",
      description: "Cozy corner café with unlimited high-speed WiFi, great coffee and a productive vibe.",
      lat: 18.5286, lng: 73.8476,
      address: "FC Road, Deccan Gymkhana, Pune", city: "Pune", state: "Maharashtra",
      pricePerHour: 50, speedMbps: 100, maxUsers: 8,
      rating: 4.5, reviewCount: 61, isActive: true,
      amenities: ["AC", "Coffee", "Snacks", "Power Outlet", "Washroom"],
      availableFrom: "08:00", availableTo: "22:00",
      images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600"],
      ssid: "CafeCorner_Guest", tag: "Cafe",
    },
    {
      ownerAvatar: "VN", name: "TechHub CoWork Aundh",
      description: "Dedicated co-working desk with 300 Mbps connection, standing desks available.",
      lat: 18.5583, lng: 73.8077,
      address: "D-Wing, Rahul Tower, Aundh, Pune", city: "Pune", state: "Maharashtra",
      pricePerHour: 75, speedMbps: 300, maxUsers: 12,
      rating: 4.9, reviewCount: 112, isActive: true,
      amenities: ["AC", "Standing Desk", "Locker", "Printer", "Power Outlet", "Coffee"],
      availableFrom: "07:00", availableTo: "23:00",
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=600"],
      ssid: "TechHub_Pro", tag: "CoWorking",
    },
    {
      ownerAvatar: "SP", name: "Spandan's Study Den",
      description: "Silent study room in a residential building near COEP. Ideal for students who need no distractions.",
      lat: 18.5308, lng: 73.8473,
      address: "Near COEP, Shivajinagar, Pune", city: "Pune", state: "Maharashtra",
      pricePerHour: 25, speedMbps: 50, maxUsers: 2,
      rating: 4.3, reviewCount: 18, isActive: true,
      amenities: ["Fan", "Power Outlet", "Whiteboard"],
      availableFrom: "06:00", availableTo: "23:00",
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"],
      ssid: "SP_StudyZone", tag: "Home",
    },
    {
      ownerAvatar: "RD", name: "Hinjewadi IT Park Lounge",
      description: "Spacious lounge inside Phase 1 IT Park. Great for freelancers working near the tech corridor.",
      lat: 18.5912, lng: 73.7389,
      address: "Phase 1, Hinjewadi Rajiv Gandhi Infotech Park, Pune", city: "Pune", state: "Maharashtra",
      pricePerHour: 60, speedMbps: 250, maxUsers: 20,
      rating: 4.6, reviewCount: 87, isActive: true,
      amenities: ["AC", "Standing Desk", "Power Outlet", "Cafeteria Access"],
      availableFrom: "08:00", availableTo: "20:00",
      images: ["https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600"],
      ssid: "ITLounge_WiFi", tag: "Office",
    },
    {
      ownerAvatar: "PJ", name: "Viman Nagar Bookworm Café",
      description: "Reading café with fast WiFi, green tea and the smell of fresh books.",
      lat: 18.5679, lng: 73.9143,
      address: "North Main Road, Viman Nagar, Pune", city: "Pune", state: "Maharashtra",
      pricePerHour: 40, speedMbps: 80, maxUsers: 6,
      rating: 4.7, reviewCount: 45, isActive: false,
      amenities: ["AC", "Books", "Tea", "Power Outlet"],
      availableFrom: "10:00", availableTo: "20:00",
      images: ["https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600"],
      ssid: "Bookworm_Guest", tag: "Cafe",
    },
    // Mumbai
    {
      ownerAvatar: "AM", name: "BKC Business Lounge",
      description: "Premium lounge in the heart of Bandra Kurla Complex. Gigabit fibre, printer included.",
      lat: 19.0693, lng: 72.8680,
      address: "G Block, BKC, Bandra East, Mumbai", city: "Mumbai", state: "Maharashtra",
      pricePerHour: 100, speedMbps: 500, maxUsers: 15,
      rating: 4.9, reviewCount: 203, isActive: true,
      amenities: ["AC", "Printer", "Scanner", "Coffee", "Power Outlet", "Locker"],
      availableFrom: "07:00", availableTo: "22:00",
      images: ["https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600"],
      ssid: "BKC_Premium_5G", tag: "CoWorking",
    },
    {
      ownerAvatar: "NS", name: "Andheri Home Office",
      description: "Spare bedroom converted into a private office. Dedicated bandwidth, very private.",
      lat: 19.1197, lng: 72.8468,
      address: "Lokhandwala Complex, Andheri West, Mumbai", city: "Mumbai", state: "Maharashtra",
      pricePerHour: 55, speedMbps: 150, maxUsers: 2,
      rating: 4.4, reviewCount: 31, isActive: true,
      amenities: ["AC", "Power Outlet", "Snacks", "Dedicated Desk"],
      availableFrom: "09:00", availableTo: "21:00",
      images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"],
      ssid: "Neha_Office_WiFi", tag: "Home",
    },
    {
      ownerAvatar: "KK", name: "Carter Road Beachside WiFi",
      description: "Work while watching the sea! Outdoor setup near Carter Road promenade.",
      lat: 19.0568, lng: 72.8188,
      address: "Carter Road, Bandra West, Mumbai", city: "Mumbai", state: "Maharashtra",
      pricePerHour: 45, speedMbps: 75, maxUsers: 5,
      rating: 4.2, reviewCount: 56, isActive: true,
      amenities: ["Outdoor Seating", "Sea View", "Snacks Nearby"],
      availableFrom: "08:00", availableTo: "20:00",
      images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"],
      ssid: "CarterRoad_Open", tag: "Office",
    },
    // Bengaluru
    {
      ownerAvatar: "AR", name: "Koramangala Startup Nest",
      description: "Startup-ready desk in Koramangala 5th Block. Hot-desking community, great networking.",
      lat: 12.9352, lng: 77.6245,
      address: "5th Block, Koramangala, Bengaluru", city: "Bengaluru", state: "Karnataka",
      pricePerHour: 80, speedMbps: 400, maxUsers: 25,
      rating: 4.8, reviewCount: 167, isActive: true,
      amenities: ["AC", "Coffee", "Meeting Rooms", "Power Outlet", "Printer"],
      availableFrom: "07:00", availableTo: "24:00",
      images: ["https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600"],
      ssid: "StartupNest_Koram", tag: "CoWorking",
    },
    {
      ownerAvatar: "DK", name: "Indiranagar Library WiFi",
      description: "Quiet reading library with complimentary WiFi for members. ₹80/hr non-member access.",
      lat: 12.9784, lng: 77.6408,
      address: "100 Feet Road, Indiranagar, Bengaluru", city: "Bengaluru", state: "Karnataka",
      pricePerHour: 80, speedMbps: 100, maxUsers: 10,
      rating: 4.6, reviewCount: 89, isActive: true,
      amenities: ["AC", "Silent Zone", "Power Outlet", "Books"],
      availableFrom: "09:00", availableTo: "21:00",
      images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600"],
      ssid: "IndiraLib_WiFi", tag: "Library",
    },
    // Hyderabad
    {
      ownerAvatar: "SR", name: "HITEC City Rooftop Office",
      description: "Rooftop terrace with panoramic city views and a dedicated leased line. Executive experience.",
      lat: 17.4435, lng: 78.3772,
      address: "Cyber Towers, HITEC City, Hyderabad", city: "Hyderabad", state: "Telangana",
      pricePerHour: 90, speedMbps: 350, maxUsers: 8,
      rating: 4.7, reviewCount: 74, isActive: true,
      amenities: ["AC", "Rooftop View", "Coffee", "Power Outlet", "Meeting Room"],
      availableFrom: "08:00", availableTo: "22:00",
      images: ["https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600"],
      ssid: "HITEC_Roof_5G", tag: "Office",
    },
    // Delhi
    {
      ownerAvatar: "RK", name: "Connaught Place Café WiFi",
      description: "Heritage café at CP with strong WiFi. Great place to work between meetings in central Delhi.",
      lat: 28.6328, lng: 77.2194,
      address: "Block A, Connaught Place, New Delhi", city: "New Delhi", state: "Delhi",
      pricePerHour: 55, speedMbps: 120, maxUsers: 10,
      rating: 4.3, reviewCount: 98, isActive: true,
      amenities: ["AC", "Coffee", "Snacks", "Power Outlet"],
      availableFrom: "09:00", availableTo: "23:00",
      images: ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600"],
      ssid: "CP_CafeWiFi", tag: "Cafe",
    },
  ] as const;

  // ── Upsert spots (match by name) ────────────────────────────────────────
  for (const s of spots) {
    const { ownerAvatar, ...rest } = s;
    await WifiSpot.findOneAndUpdate(
      { name: rest.name },
      {
        $set: {
          ...rest,
          owner: ownerMap[ownerAvatar],
          ownerName: owners.find((o) => o.avatar === ownerAvatar)!.name,
          ownerAvatar,
        },
      },
      { upsert: true, new: true }
    );
    console.log(`  📶 Spot upserted: ${rest.name}`);
  }

  console.log("\n🎉 Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
