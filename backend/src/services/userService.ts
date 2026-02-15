import prisma from "./prisma";
import { User } from "@prisma/client";

export async function getOrCreateUser(clerkUserId: string) {
    let user = await prisma.user.findUnique({ where: { clerkUserId } });

    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(now.getDate() + 2);

    if (!user) {
        user = await prisma.user.create({
            data: {
                clerkUserId,
                trialStartDate: now,
                trialEndDate: trialEndDate,
                isPro: false
            }
        });
        console.log(`User created with trial until ${trialEndDate.toISOString()}`);
    } else if (!user.trialEndDate && !user.isPro) {
        // Backfill trial for existing users who missed it
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                trialStartDate: now,
                trialEndDate: trialEndDate
            }
        });
        console.log(`User ${user.id} backfilled with trial until ${trialEndDate.toISOString()}`);
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
