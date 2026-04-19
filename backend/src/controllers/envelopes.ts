import { Response } from "express";
import { z } from "zod";
import prisma from "../services/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { getOrCreateUser } from "../services/userService";

const envelopeSchema = z.object({
    title: z.string().min(1),
    icon: z.string().optional(),
    budget: z.number().positive(),
    spent: z.number().nonnegative().default(0),
    startDate: z.string().pipe(z.coerce.date()),
    endDate: z.string().pipe(z.coerce.date()),
});

export const getEnvelopes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const envelopes = await prisma.budgetEnvelope.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });
        res.json(envelopes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch envelopes" });
    }
};

export const createEnvelope = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const data = envelopeSchema.parse(req.body);
        
        const envelope = await prisma.budgetEnvelope.create({
            data: {
                ...data,
                userId: user.id,
            },
        });
        res.status(201).json(envelope);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }
        res.status(500).json({ error: "Failed to create envelope" });
    }
};

export const updateEnvelope = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = await getOrCreateUser(req.clerkUserId!);
        const data = envelopeSchema.partial().parse(req.body);

        const envelope = await prisma.budgetEnvelope.update({
            where: { id, userId: user.id },
            data,
        });
        res.json(envelope);
    } catch (error) {
        res.status(500).json({ error: "Failed to update envelope" });
    }
};

export const deleteEnvelope = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = await getOrCreateUser(req.clerkUserId!);
        await prisma.budgetEnvelope.delete({
            where: { id, userId: user.id },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete envelope" });
    }
};
