import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt.js";

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;  // Changed from req.headers

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        const decoded = verifyToken(token);
        (req as any).user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};