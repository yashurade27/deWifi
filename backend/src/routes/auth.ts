import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { JWT_SECRET } from "../config";

const router = Router();
const JWT_EXPIRES_IN = "7d";

function signToken(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ─── POST /api/auth/signup ─────────────────────────────────────────────────
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ message: "All fields are required." });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const user = await User.create({ name, email, phone, password, role: role ?? "user" });
    const token = signToken(String(user._id));

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[signup]", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/auth/signin ─────────────────────────────────────────────────
router.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const token = signToken(String(user._id));

    res.status(200).json({
      message: "Signed in successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[signin]", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/auth/signout ────────────────────────────────────────────────
// JWT is stateless — signout is handled on the client by discarding the token.
// This endpoint exists as a courtesy confirmation.
router.post("/signout", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Signed out successfully." });
});

export default router;
