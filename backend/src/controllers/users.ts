import { Response, Request } from "express";
import { z } from "zod";
import prisma from "../services/prisma";
import { clerkClient } from "@clerk/express";

const deleteAccountSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const verifyCredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

export async function verifyCredentials(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = verifyCredentialsSchema.parse(req.body);

        // 1. Find user in Clerk by email
        const usersResponse = await clerkClient.users.getUserList({
            emailAddress: [email],
        });

        // Handle both older v4 and newer v5 Clerk SDK return structures safely
        let clerkUser: any;
        if (usersResponse && typeof (usersResponse as any).data !== "undefined") {
            clerkUser = (usersResponse as any).data[0];
        } else if (Array.isArray(usersResponse) && usersResponse.length > 0) {
            clerkUser = usersResponse[0];
        }

        if (!clerkUser) {
            res.status(404).json({ error: "No account found associated with this email address." });
            return;
        }

        try {
            // 2. Verify password with Clerk
            const verifyResult = await clerkClient.users.verifyPassword({
                userId: clerkUser.id,
                password: password
            });

            if (!verifyResult || !verifyResult.verified) {
                res.status(401).json({ error: "Invalid password provided." });
                return;
            }
        } catch (authError: any) {
            console.error("Password verification error:", authError);
            res.status(401).json({ error: "Invalid password provided or authentication check failed." });
            return;
        }

        res.json({ success: true, message: "Credentials verified successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }

        console.error("Verify credentials error:", error);
        res.status(500).json({ error: "Failed to verify credentials due to an internal server error." });
    }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = deleteAccountSchema.parse(req.body);

        // 1. Find user in Clerk by email
        const usersResponse = await clerkClient.users.getUserList({
            emailAddress: [email],
        });

        // Handle both older v4 and newer v5 Clerk SDK return structures safely
        let clerkUser: any;
        if (usersResponse && typeof (usersResponse as any).data !== "undefined") {
            clerkUser = (usersResponse as any).data[0];
        } else if (Array.isArray(usersResponse) && usersResponse.length > 0) {
            clerkUser = usersResponse[0];
        }

        if (!clerkUser) {
            res.status(404).json({ error: "No account found associated with this email address." });
            return;
        }

        try {
            // 2. Verify password with Clerk
            const verifyResult = await clerkClient.users.verifyPassword({
                userId: clerkUser.id,
                password: password
            });

            if (!verifyResult || !verifyResult.verified) {
                res.status(401).json({ error: "Invalid password provided." });
                return;
            }
        } catch (authError: any) {
            console.error("Password verification error:", authError);
            res.status(401).json({ error: "Invalid password provided or authentication check failed." });
            return;
        }

        // 3. Delete from Clerk (this is important to fully delete their info)
        try {
            await clerkClient.users.deleteUser(clerkUser.id);
        } catch (clerkErr) {
            console.error("Failed to delete user on Clerk:", clerkErr);
            // It might already be deleted or we don't have enough permissions, but let's proceed to delete our DB record just in case
        }

        // 4. Delete from our database (via Prisma)
        // Prisma cascade will automatically delete their tags, transactions, and other relations
        await prisma.user.deleteMany({
            where: { clerkUserId: clerkUser.id }
        });

        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }

        console.error("Delete account error:", error);
        res.status(500).json({ error: "Failed to delete account due to an internal server error." });
    }
}
