import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getStreak } from "../controllers/streaks";

const router = Router();

router.get("/", requireAuth, getStreak);

export default router;
