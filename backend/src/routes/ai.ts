import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth";
import { askQuestion } from "../controllers/ai";

const router = Router();

// Rate limit AI endpoint: 20 requests per minute per user
const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Too many AI requests. Please try again in a minute." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => req.clerkUserId || "anonymous",
    validate: false,
});

router.use(requireAuth as any);
router.use(aiRateLimiter);

router.post("/ask", askQuestion as any);

export default router;
