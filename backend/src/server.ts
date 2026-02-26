import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { MONGO_URI, PORT, CLIENT_URL } from "./config";
import authRoutes from "./routes/auth";
import spotRoutes from "./routes/spots";
import ownerRoutes from "./routes/owner";
import bookingRoutes from "./routes/bookings";

const app = express();

// Allow the configured CLIENT_URL + any localhost port (handy when Vite picks a free port)
const allowedOrigins = [
  CLIENT_URL,
  /^http:\/\/localhost:\d+$/,
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / curl / Postman
      const ok = allowedOrigins.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
      cb(ok ? null : new Error("CORS blocked"), ok);
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/", (_req, res) => res.send("API running 🚀"));

// Routes
app.use("/api/auth",     authRoutes);
app.use("/api/spots",    spotRoutes);
app.use("/api/owner",    ownerRoutes);
app.use("/api/bookings", bookingRoutes);

// MongoDB connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error(err));