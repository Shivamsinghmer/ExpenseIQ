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
        const emis = await prisma.eMI.findMany({
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
        
        const emi = await prisma.eMI.create({
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

        const emi = await prisma.eMI.update({
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
        await prisma.eMI.delete({
            where: { id, userId: user.id },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete EMI" });
    }
};
