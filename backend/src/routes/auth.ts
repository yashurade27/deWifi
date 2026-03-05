import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { JWT_SECRET } from "../config";
import { protect, AuthRequest } from "../middleware/auth";

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
        profilePhoto: user.profilePhoto || "",
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
        profilePhoto: user.profilePhoto || "",
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

// ─── PUT /api/auth/profile ──────────────────────────────────────────────────
// Update user profile (name, email, phone, profilePhoto)
router.put("/profile", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, profilePhoto } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(409).json({ message: "This email is already in use." });
        return;
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto || "",
      },
    });
  } catch (err) {
    console.error("[profile update]", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PUT /api/auth/change-password ──────────────────────────────────────────
// Change user password
router.put("/change-password", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Current and new password are required." });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: "New password must be at least 8 characters." });
      return;
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ message: "Current password is incorrect." });
      return;
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("[change password]", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
