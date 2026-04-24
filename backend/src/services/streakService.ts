import prisma from "./prisma";

/**
 * Updates the user's streak based on their daily activity.
 * Should be called whenever a user records a transaction.
 */
export const updateStreak = async (userId: string) => {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                currentStreak: true,
                longestStreak: true,
                lastActiveDate: true,
            },
        });

        if (!user) return null;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const lastActiveDate = (user as any).lastActiveDate ? new Date((user as any).lastActiveDate) : null;
        const lastActive = lastActiveDate 
            ? new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate())
            : null;

        // If the user already recorded something today, don't change the streak.
        if (lastActive && lastActive.getTime() === today.getTime()) {
            return null;
        }

        let newStreak = 1;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // If the last activity was yesterday, increment the streak.
        if (lastActive && lastActive.getTime() === yesterday.getTime()) {
            newStreak = (user as any).currentStreak + 1;
        }

        await (prisma as any).user.update({
            where: { id: userId },
            data: {
                currentStreak: newStreak,
                longestStreak: Math.max((user as any).longestStreak, newStreak),
                lastActiveDate: now,
            },
        });

        // Check for milestone
        const MILESTONES = [
            { id: 1, days: 3, label: "Beginner", emoji: "🌱", color: "#94a3b8" },
            { id: 2, days: 7, label: "1 Week", emoji: "⚡", color: "#4ade80" },
            { id: 3, days: 14, label: "2 Weeks", emoji: "🍃", color: "#22c55e" },
            { id: 4, days: 30, label: "1 Month", emoji: "🏆", color: "#16a34a" },
            { id: 5, days: 60, label: "2 Months", emoji: "🎯", color: "#facc15" },
            { id: 6, days: 90, label: "3 Months", emoji: "🚀", color: "#fbbf24" },
            { id: 7, days: 180, label: "Half Year", emoji: "💎", color: "#3b82f6" },
            { id: 8, days: 250, label: "Master", emoji: "🏅", color: "#2563eb" },
            { id: 9, days: 365, label: "1 Year", emoji: "👑", color: "#f59e0b" },
        ];

        const reachedMilestone = MILESTONES.find(m => m.days === newStreak);
        return reachedMilestone || null;
    } catch (error) {
        console.error("Failed to update streak:", error);
        return null;
    }
};

/**
 * Gets streak-related statistics for the user.
 */
export const getStreakStats = async (userId: string) => {
    const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: {
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
        },
    });

    if (!user) throw new Error("User not found");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get distinct days with transactions in the current month
    const activityThisMonth = await prisma.transaction.findMany({
        where: {
            userId,
            date: {
                gte: startOfMonth,
            },
        },
        select: {
            date: true,
        },
    });

    const activeDates = Array.from(new Set(activityThisMonth.map(t => t.date.toISOString().split('T')[0])));

    // Check if the streak is still valid (last active today or yesterday)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastActiveDate = (user as any).lastActiveDate ? new Date((user as any).lastActiveDate) : null;
    const lastActive = lastActiveDate 
        ? new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate())
        : null;

    const isStillValid = lastActive && (lastActive.getTime() === today.getTime() || lastActive.getTime() === yesterday.getTime());
    const currentStreak = isStillValid ? (user as any).currentStreak : 0;

    // Calculate percentile
    const totalUsers = await (prisma as any).user.count({ 
        where: { longestStreak: { gt: 0 } } 
    });
    
    const usersWithHigherStreak = await (prisma as any).user.count({
        where: { longestStreak: { gt: (user as any).longestStreak } }
    });

    // Percentile: (1 - (higher_count / total)) * 100
    // Example: 100 users, 1 better than me. Rank 2. (1 - 1/100) = 0.99. Top 1% (roughly).
    // Let's use Top % specifically: (higher_count + 1) / total * 100
    const topPercentile = totalUsers > 0 
        ? Math.max(1, Math.ceil(((usersWithHigherStreak + 1) / totalUsers) * 100))
        : 100;

    return {
        currentStreak,
        longestStreak: (user as any).longestStreak,
        activeDaysThisMonth: activeDates.length,
        activeDates,
        daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
        lastActiveDate: (user as any).lastActiveDate,
        percentile: topPercentile,
    };
};

/**
 * Gets the top users for the leaderboard.
 * timeframe: 'all-time' | 'weekly' | 'monthly'
 */
export const getLeaderboard = async (timeframe: string = "all-time") => {
    try {
        const now = new Date();
        let startDate: Date | null = null;

        if (timeframe === "weekly") {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeframe === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
        }

        const where: any = {
            longestStreak: { gt: 0 }
        };

        if (startDate) {
            where.lastActiveDate = {
                gte: startDate
            };
        }

        const topLongest = await (prisma as any).user.findMany({
            where,
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                longestStreak: true,
                currentStreak: true,
            },
            orderBy: {
                longestStreak: "desc",
            },
            take: 50,
        });

        return {
            longest: topLongest,
        };
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        throw error;
    }
};
