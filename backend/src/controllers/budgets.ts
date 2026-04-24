import { Response } from "express";
import prisma from "../services/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

export const getBudgets = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkUserId = req.clerkUserId;
        if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

        const user = await prisma.user.findUnique({ where: { clerkUserId } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const budgets = await prisma.budget.findMany({
            where: { userId: user.id }
        });

        res.json(budgets);
    } catch (error) {
        console.error("Get budgets error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

export const updateBudgets = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const clerkUserId = req.clerkUserId;
        if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

        const user = await prisma.user.findUnique({ where: { clerkUserId } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const { budgets } = req.body as { budgets: { category: string, amount: number }[] };
        
        await prisma.$transaction(async (tx) => {
            await tx.budget.deleteMany({
                where: { userId: user.id }
            });
            if (budgets && budgets.length > 0) {
                await tx.budget.createMany({
                    data: budgets.map(b => ({
                        userId: user.id,
                        category: b.category,
                        amount: b.amount
                    }))
                });
            }
        });

        const newBudgets = await prisma.budget.findMany({ where: { userId: user.id } });
        res.json(newBudgets);
    } catch (error) {
        console.error("Update budgets error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
