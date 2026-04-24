import prisma from "./prisma";
import { User } from "@prisma/client";
import { clerkClient } from "@clerk/express";

export async function getOrCreateUser(clerkUserId: string) {
    let user = await (prisma as any).user.findUnique({ where: { clerkUserId } });

    // Fetch latest info from Clerk to keep name/avatar in sync
    let clerkUser: any = null;
    try {
        clerkUser = await clerkClient.users.getUser(clerkUserId);
    } catch (e) {
        console.error("Failed to fetch user from Clerk:", e);
    }

    const name = clerkUser ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "User" : "User";
    const avatarUrl = clerkUser?.imageUrl || null;

    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(now.getDate() + 2);

    if (!user) {
        user = await (prisma as any).user.create({
            data: {
                clerkUserId,
                name,
                avatarUrl,
                trialStartDate: now,
                trialEndDate: trialEndDate,
                isPro: false
            }
        });
        console.log(`User created with trial until ${trialEndDate.toISOString()}`);
    } else {
        // Sync name and avatar even for existing users
        user = await (prisma as any).user.update({
            where: { id: user.id },
            data: {
                name,
                avatarUrl,
                ...( (!user.trialEndDate && !user.isPro) ? {
                    trialStartDate: now,
                    trialEndDate: trialEndDate
                } : {})
            }
        });
    }
    return user;
}

export type AccessStatus = "trial" | "pro" | "expired";

export function checkUserAccess(user: User): AccessStatus {
    if (user.isPro) {
        return "pro";
    }

    // Check if trial is active
    // If trialEndDate is null (legacy users), we might want to default to expired or give them a trial.
    // Given the prompt "When a new user registers... start a 2-day free trial", legacy users might be expired or grandfathered.
    // For safety, if trialEndDate is missing, and not pro, assume expired or give a grace period. 
    // But since schema has it nullable, and we just added it, strictly speaking they are expired if they don't have it set.
    // However, I'll stick to the logic: if trialEndDate exists and is in future -> trial. Else expired.

    if (user.trialEndDate && new Date() < user.trialEndDate) {
        return "trial";
    }

    return "expired";
}

export async function updateUserCurrency(clerkUserId: string, currencyCode: string, currencySymbol: string) {
    // Ensure the user exists in our DB first
    await getOrCreateUser(clerkUserId);
    
    return await prisma.user.update({
        where: { clerkUserId },
        data: {
            currencyCode,
            currencySymbol
        }
    });
}
