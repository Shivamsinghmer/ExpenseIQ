import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getStreak, leaderboard } from "../controllers/streaks";

const router = Router();

router.get("/", requireAuth, getStreak);
router.get("/leaderboard", requireAuth, leaderboard);

export default router;
