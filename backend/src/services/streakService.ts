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

        if (!user) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const lastActiveDate = (user as any).lastActiveDate ? new Date((user as any).lastActiveDate) : null;
        const lastActive = lastActiveDate 
            ? new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate())
            : null;

        // If the user already recorded something today, don't change the streak.
        if (lastActive && lastActive.getTime() === today.getTime()) {
            return;
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
    } catch (error) {
        console.error("Failed to update streak:", error);
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

    return {
        currentStreak,
        longestStreak: (user as any).longestStreak,
        activeDaysThisMonth: activeDates.length,
        activeDates,
        daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
        lastActiveDate: (user as any).lastActiveDate,
    };
};
