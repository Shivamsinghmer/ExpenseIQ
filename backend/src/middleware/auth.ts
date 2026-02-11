import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/express";

export interface AuthenticatedRequest extends Request {
    userId?: string;
    clerkUserId?: string;
}

export async function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Missing or invalid authorization header" });
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            const payload = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY!,
            });
            req.clerkUserId = payload.sub;
            next();
        } catch (verifyError) {
            console.error("Token verification failed:", verifyError);
            res.status(401).json({ error: "Invalid or expired token" });
            return;
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ error: "Authentication error" });
    }
}
