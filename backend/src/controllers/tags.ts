import { Response } from "express";
import { z } from "zod";
import prisma from "../services/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Validation schemas
const createTagSchema = z.object({
    name: z.string().min(1, "Name is required").max(30),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"),
});

const updateTagSchema = createTagSchema.partial();

// Helper to get or create user
async function getOrCreateUser(clerkUserId: string) {
    let user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) {
        user = await prisma.user.create({ data: { clerkUserId } });
    }
    return user;
}

// GET all tags
export async function getTags(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);

        const tags = await prisma.tag.findMany({
            where: { userId: user.id },
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
            orderBy: { name: "asc" },
        });

        res.json(tags);
    } catch (error) {
        console.error("Get tags error:", error);
        res.status(500).json({ error: "Failed to fetch tags" });
    }
}

// GET single tag
export async function getTag(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { id } = req.params;

        const tag = await prisma.tag.findFirst({
            where: { id, userId: user.id } as any,
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
        });

        if (!tag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        res.json(tag);
    } catch (error) {
        console.error("Get tag error:", error);
        res.status(500).json({ error: "Failed to fetch tag" });
    }
}

// POST create tag
export async function createTag(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const data = createTagSchema.parse(req.body);

        // Check for duplicate name
        const existing = await prisma.tag.findFirst({
            where: { name: data.name, userId: user.id } as any,
        });

        if (existing) {
            res.status(409).json({ error: "Tag with this name already exists" });
            return;
        }

        const tag = await prisma.tag.create({
            data: {
                name: data.name,
                color: data.color,
                userId: user.id,
            },
        });

        res.status(201).json(tag);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }
        console.error("Create tag error:", error);
        res.status(500).json({ error: "Failed to create tag" });
    }
}

// PUT update tag
export async function updateTag(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { id } = req.params;
        const data = updateTagSchema.parse(req.body);

        const existing = await prisma.tag.findFirst({
            where: { id, userId: user.id } as any,
        });

        if (!existing) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        // Check for duplicate name if name is being updated
        if (data.name && data.name !== existing.name) {
            const duplicate = await prisma.tag.findFirst({
                where: { name: data.name, userId: user.id } as any,
            });
            if (duplicate) {
                res.status(409).json({ error: "Tag with this name already exists" });
                return;
            }
        }

        const tag = await prisma.tag.update({
            where: { id } as any,
            data,
        });

        res.json(tag);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }
        console.error("Update tag error:", error);
        res.status(500).json({ error: "Failed to update tag" });
    }
}

// DELETE tag
export async function deleteTag(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { id } = req.params;

        const existing = await prisma.tag.findFirst({
            where: { id, userId: user.id } as any,
        });

        if (!existing) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        await prisma.tag.delete({ where: { id } as any });
        res.json({ message: "Tag deleted successfully" });
    } catch (error) {
        console.error("Delete tag error:", error);
        res.status(500).json({ error: "Failed to delete tag" });
    }
}
