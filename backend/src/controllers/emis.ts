import { Response } from "express";
import { z } from "zod";
import prisma from "../services/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { getOrCreateUser } from "../services/userService";

const emiSchema = z.object({
    title: z.string().min(1),
    monthlyAmount: z.number().positive(),
    totalMonths: z.number().int().positive(),
    paidMonths: z.number().int().nonnegative().default(0),
    startDate: z.string().pipe(z.coerce.date()),
    isDone: z.boolean().default(false),
});

export const getEmis = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const emis = await (prisma as any).emi.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });
        res.json(emis);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch EMIs" });
    }
};

export const createEmi = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const data = emiSchema.parse(req.body);

        if (data.paidMonths >= data.totalMonths) {
            data.isDone = true;
        }
        
        const emi = await (prisma as any).emi.create({
            data: {
                ...data,
                userId: user.id,
            },
        });
        res.status(201).json(emi);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }
        res.status(500).json({ error: "Failed to create EMI" });
    }
};

export const updateEmi = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = await getOrCreateUser(req.clerkUserId!);
        const data = emiSchema.partial().parse(req.body);

        // Fetch existing to handle auto-completion
        const existing = await (prisma as any).emi.findUnique({
            where: { id, userId: user.id }
        });

        if (!existing) {
            res.status(404).json({ error: "EMI not found" });
            return;
        }

        const newPaidMonths = data.paidMonths !== undefined ? data.paidMonths : existing.paidMonths;
        const totalMonths = data.totalMonths !== undefined ? data.totalMonths : existing.totalMonths;

        // If paidMonths increased, create a transaction
        if (data.paidMonths !== undefined && data.paidMonths > existing.paidMonths) {
            const increment = data.paidMonths - existing.paidMonths;
            for (let i = 0; i < increment; i++) {
                const installmentNum = existing.paidMonths + i + 1;
                await (prisma as any).transaction.create({
                    data: {
                        userId: user.id,
                        title: `EMI Payment: ${existing.title}`,
                        amount: existing.monthlyAmount,
                        type: "EXPENSE",
                        category: "Bills",
                        date: new Date(),
                        notes: `EMI:${existing.id} | Installment ${installmentNum}/${totalMonths}`,
                    }
                });
            }
        }

        if (newPaidMonths >= totalMonths) {
            data.isDone = true;
        } else {
            data.isDone = false;
        }

        const emi = await (prisma as any).emi.update({
            where: { id, userId: user.id },
            data,
        });
        res.json(emi);
    } catch (error) {
        res.status(500).json({ error: "Failed to update EMI" });
    }
};

export const deleteEmi = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = await getOrCreateUser(req.clerkUserId!);
        await (prisma as any).emi.delete({
            where: { id, userId: user.id },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete EMI" });
    }
};
