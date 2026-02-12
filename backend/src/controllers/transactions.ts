import { Response } from "express";
import { z } from "zod";
import prisma from "../services/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Validation schemas
const createTransactionSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    amount: z.number().positive("Amount must be positive"),
    type: z.enum(["INCOME", "EXPENSE"]),
    notes: z.string().max(500).optional(),
    date: z.string(),
    tagIds: z.array(z.string()).optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const querySchema = z.object({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    tagId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
});

// Helper to get or create user
async function getOrCreateUser(clerkUserId: string) {
    let user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) {
        user = await prisma.user.create({ data: { clerkUserId } });
    }
    return user;
}

// GET all transactions
export async function getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const query = querySchema.parse(req.query);

        const page = parseInt(query.page || "1");
        const limit = parseInt(query.limit || "20");
        const skip = (page - 1) * limit;

        const where: Record<string, any> = { userId: user.id };

        if (query.type) where.type = query.type;
        if (query.startDate || query.endDate) {
            where.date = {} as Record<string, Date>;
            if (query.startDate) where.date.gte = new Date(query.startDate);
            if (query.endDate) where.date.lte = new Date(query.endDate);
        }
        if (query.tagId) {
            where.tags = { some: { id: query.tagId } };
        }
        if (query.search) {
            where.title = { contains: query.search, mode: "insensitive" };
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: { tags: true },
                orderBy: { date: "desc" },
                skip,
                take: limit,
            }),
            prisma.transaction.count({ where }),
        ]);

        res.json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Invalid query parameters", details: error.issues });
            return;
        }
        console.error("Get transactions error:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
}

// GET single transaction
export async function getTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { id } = req.params;

        const transaction = await prisma.transaction.findFirst({
            where: { id, userId: user.id } as any,
            include: { tags: true },
        });

        if (!transaction) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        res.json(transaction);
    } catch (error) {
        console.error("Get transaction error:", error);
        res.status(500).json({ error: "Failed to fetch transaction" });
    }
}

// POST create transaction
export async function createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const data = createTransactionSchema.parse(req.body);

        const transaction = await prisma.transaction.create({
            data: {
                title: data.title,
                amount: data.amount,
                type: data.type,
                notes: data.notes,
                date: new Date(data.date),
                userId: user.id,
                tags: data.tagIds
                    ? { connect: data.tagIds.map((id: string) => ({ id })) }
                    : undefined,
            },
            include: { tags: true },
        });

        res.status(201).json(transaction);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }
        console.error("Create transaction error:", error);
        res.status(500).json({ error: "Failed to create transaction" });
    }
}

// PUT update transaction
export async function updateTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { id } = req.params;
        const data = updateTransactionSchema.parse(req.body);

        // Verify ownership
        const existing = await prisma.transaction.findFirst({
            where: { id, userId: user.id } as any,
        });

        if (!existing) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        const updateData: Record<string, any> = { ...data };
        if (data.date) updateData.date = new Date(data.date);

        if (data.tagIds) {
            updateData.tags = {
                set: data.tagIds.map((tagId: string) => ({ id: tagId })),
            };
            delete updateData.tagIds;
        }

        const transaction = await prisma.transaction.update({
            where: { id } as any,
            data: updateData,
            include: { tags: true },
        });

        res.json(transaction);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }
        console.error("Update transaction error:", error);
        res.status(500).json({ error: "Failed to update transaction" });
    }
}

// DELETE transaction
export async function deleteTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { id } = req.params;

        const existing = await prisma.transaction.findFirst({
            where: { id, userId: user.id } as any,
        });

        if (!existing) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        await prisma.transaction.delete({ where: { id } as any });
        res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Delete transaction error:", error);
        res.status(500).json({ error: "Failed to delete transaction" });
    }
}

// GET financial summary
export async function getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { startDate, endDate } = req.query;

        const where: Record<string, any> = { userId: user.id };
        if (startDate || endDate) {
            where.date = {} as Record<string, Date>;
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const [incomeAgg, expenseAgg, recentTransactions, tagBreakdown, allTx] = await Promise.all([
            prisma.transaction.aggregate({
                where: { ...where, type: "INCOME" },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.aggregate({
                where: { ...where, type: "EXPENSE" },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.findMany({
                where,
                include: { tags: true },
                orderBy: { date: "desc" },
                take: 5,
            }),
            prisma.tag.findMany({
                where: { userId: user.id },
                include: {
                    transactions: {
                        where: { ...where, type: "EXPENSE" },
                        select: { amount: true },
                    },
                },
            }),
            prisma.transaction.findMany({
                where,
                select: { date: true, amount: true, type: true },
                orderBy: { date: "asc" },
            }),
        ]);

        const totalIncome = incomeAgg._sum.amount || 0;
        const totalExpense = expenseAgg._sum.amount || 0;

        const chartData: { date: string; income: number; expense: number }[] = [];

        if (allTx.length > 0) {
            const start = new Date(startDate ? (startDate as string) : allTx[0].date);
            const end = new Date(endDate ? (endDate as string) : new Date());

            const current = new Date(start);
            current.setHours(0, 0, 0, 0);
            const last = new Date(end);
            last.setHours(0, 0, 0, 0);

            const txMap = new Map<string, { income: number; expense: number }>();
            allTx.forEach(t => {
                const d = t.date.toISOString().split("T")[0];
                if (!txMap.has(d)) txMap.set(d, { income: 0, expense: 0 });
                const entry = txMap.get(d)!;
                if (t.type === "INCOME") entry.income += t.amount;
                else entry.expense += t.amount;
            });

            while (current <= last) {
                const dateStr = current.toISOString().split("T")[0];
                const data = txMap.get(dateStr) || { income: 0, expense: 0 };
                chartData.push({
                    date: dateStr,
                    income: data.income,
                    expense: data.expense
                });
                current.setDate(current.getDate() + 1);
            }
        }

        res.json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            incomeCount: incomeAgg._count,
            expenseCount: expenseAgg._count,
            recentTransactions,
            tagBreakdown: tagBreakdown.map((tag: { id: string; name: string; color: string; transactions: { amount: number }[] }) => ({
                id: tag.id,
                name: tag.name,
                color: tag.color,
                totalSpent: tag.transactions.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0),
                count: tag.transactions.length,
            })),
            chartData,
        });
    } catch (error) {
        console.error("Get summary error:", error);
        res.status(500).json({ error: "Failed to fetch summary" });
    }
}
