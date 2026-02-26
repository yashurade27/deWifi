import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "";
const MONGO_URI = process.env.MONGO_URI || "";
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set in .env file");
  process.exit(1);
}

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set in .env file");
  process.exit(1);
}

export { JWT_SECRET, MONGO_URI, PORT, CLIENT_URL };
