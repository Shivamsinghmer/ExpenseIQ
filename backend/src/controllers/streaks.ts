import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { getOrCreateUser } from "../services/userService";
import { getStreakStats, getLeaderboard } from "../services/streakService";

export const getStreak = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const stats = await getStreakStats(user.id);
        res.json(stats);
    } catch (error: any) {
        console.error("Get streak error:", error);
        res.status(500).json({ error: error.message || "Failed to fetch streak stats" });
    }
};

export const leaderboard = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const timeframe = (req.query.timeframe as string) || "all-time";
        const stats = await getLeaderboard(timeframe);
        res.json(stats);
    } catch (error: any) {
        console.error("Get leaderboard error:", error);
        res.status(500).json({ error: error.message || "Failed to fetch leaderboard" });
    }
};
