import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends Request {
  userId?: number;
}

export function signUserToken(userId: number) {
  const secret = config.botToken || "dev-secret";
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "NO_TOKEN" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const secret = config.botToken || "dev-secret";
    const decoded = jwt.verify(token, secret) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== config.adminToken) {
    return res.status(401).json({ error: "ADMIN_UNAUTHORIZED" });
  }
  next();
}

