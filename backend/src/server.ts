import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { JWT_SECRET, MONGO_URI, PORT, CLIENT_URL } from "./config";
import authRoutes from "./routes/auth";

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// Auth routes
app.use("/api/auth", authRoutes);

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