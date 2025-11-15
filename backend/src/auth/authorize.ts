import type { Request, Response, NextFunction } from "express";

// Middleware to check if user has required role
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: "Forbidden - You do not have permission to perform this action" 
      });
    }

    next();
  };
};
