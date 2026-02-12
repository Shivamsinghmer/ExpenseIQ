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
        if (!authHeader?.startsWith("Bearer ")) {
            console.warn(`[Auth] No token for ${req.path}`);
            res.status(401).json({ error: "Missing or invalid authorization header" });
            return;
        }

        const token = authHeader.split(" ")[1];
        try {
            const payload = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY!,
            });
            console.log(`[Auth] Verified: ${payload.sub} for ${req.path}`);
            req.clerkUserId = payload.sub;
            next();
        } catch (verifyError: any) {
            console.error(`[Auth] Failed for ${req.path}:`, verifyError.message);
            res.status(401).json({ error: "Invalid or expired token" });
            return;
        }
    } catch (error: any) {
        console.error(`[Auth] Error in middleware:`, error.message);
        res.status(500).json({ error: "Authentication error" });
    }
}
