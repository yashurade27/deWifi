import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function protect(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  const token = header.split(" ")[1];
  if (!token) { res.status(401).json({ message: "Token missing." }); return; }
  try {
    const secret  = String(JWT_SECRET);
    const decoded = jwt.verify(token, secret) as unknown as { id: string; role?: string };
    req.userId   = decoded.id;
    req.userRole = decoded.role ?? "";
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired." });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ message: "Forbidden." });
      return;
    }
    next();
  };
}
