import { Response } from "express";
import { z } from "zod";
import prisma from "../services/prisma";
import { Prisma } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import { getOrCreateUser, checkUserAccess } from "../services/userService";
import { updateStreak } from "../services/streakService";

// Validation schemas
const createTransactionSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    amount: z.number().positive("Amount must be positive"),
    type: z.enum(["INCOME", "EXPENSE"]),
    notes: z.string().max(500).optional(),
    category: z.string().optional(),
    date: z.string(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const querySchema = z.object({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
});

// GET all transactions
export async function getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const query = querySchema.parse(req.query);

        const page = parseInt(query.page || "1");
        const limit = parseInt(query.limit || "20");
        const skip = (page - 1) * limit;

        const where: Prisma.TransactionWhereInput = { userId: user.id };

        if (query.type) where.type = query.type;
        if (query.startDate || query.endDate) {
            where.date = {};
            if (query.startDate) where.date.gte = new Date(query.startDate);
            if (query.endDate) where.date.lte = new Date(query.endDate);
        }
        if (query.search) {
            where.title = { contains: query.search, mode: "insensitive" };
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
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
        const id = req.params.id as string;

        const transaction = await prisma.transaction.findFirst({
            where: { id, userId: user.id },
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
        console.log(`[CreateTx] User ${user.id} (${user.clerkUserId}) initiating transaction`);

        const access = checkUserAccess(user);
        if (access === "expired") {
            console.warn(`[CreateTx] Trial expired for user ${user.id}`);
            res.status(403).json({
                message: "Trial expired. Please upgrade to Pro to use this feature."
            });
            return;
        }

        console.log(`[CreateTx] Payload:`, JSON.stringify(req.body));
        const data = createTransactionSchema.parse(req.body);

        const transaction = await prisma.transaction.create({
            data: {
                title: data.title,
                amount: data.amount,
                type: data.type as any,
                notes: data.notes,
                category: data.category || "Other",
                date: new Date(data.date),
                userId: user.id,
            } as any,
        });

        console.log(`[CreateTx] Success: Transaction ${transaction.id} created`);

        // Update streak on successful creation
        let newMilestone = null;
        try {
            newMilestone = await updateStreak(user.id);
            if (newMilestone) {
                console.log(`[CreateTx] Milestone reached: ${newMilestone.label}`);
            }
            console.log(`[CreateTx] Streak updated for user ${user.id}`);
        } catch (streakError) {
            console.error(`[CreateTx] Streak update failed (non-blocking):`, streakError);
        }

        res.status(201).json({
            ...transaction,
            newMilestone
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.warn(`[CreateTx] Validation failed:`, JSON.stringify(error.issues));
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

        const access = checkUserAccess(user);
        if (access === "expired") {
            res.status(403).json({
                message: "Trial expired. Please upgrade to Pro to use this feature."
            });
            return;
        }

        const id = req.params.id as string;
        const data = updateTransactionSchema.parse(req.body);

        // Verify ownership
        const existing = await prisma.transaction.findFirst({
            where: { id, userId: user.id },
        });

        if (!existing) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        const updateData: any = { ...data };
        if (data.date) updateData.date = new Date(data.date);

        const transaction = await prisma.transaction.update({
            where: { id },
            data: updateData,
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

        const access = checkUserAccess(user);
        if (access === "expired") {
            res.status(403).json({
                message: "Trial expired. Please upgrade to Pro to use this feature."
            });
            return;
        }

        const id = req.params.id as string;

        const existing = await prisma.transaction.findFirst({
            where: { id, userId: user.id },
        });

        if (!existing) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        await prisma.transaction.delete({ where: { id } });
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

        const queryFilter: any = { userId: user.id };
        if (startDate || endDate) {
            queryFilter.date = {};
            if (startDate) queryFilter.date.gte = new Date(startDate as string);
            if (endDate) queryFilter.date.lte = new Date(endDate as string);
        }

        const [incomeAgg, expenseAgg, recentTransactions, categoryData, allTx] = await Promise.all([
            prisma.transaction.aggregate({
                where: { ...queryFilter, type: "INCOME" },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.aggregate({
                where: { ...queryFilter, type: "EXPENSE" },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.findMany({
                where: queryFilter,
                orderBy: { date: "desc" },
                take: 5,
            }),
            // @ts-ignore - Bypass Prisma's circular reference TS bug on groupBy
            prisma.transaction.groupBy({
                by: ["category"],
                where: { ...queryFilter, type: "EXPENSE" } as any,
                _sum: { amount: true },
                _count: { _all: true },
            } as any),
            prisma.transaction.findMany({
                where: queryFilter,
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

            const txMap = new Map<string, { income: number; expense: number }>();
            allTx.forEach(t => {
                const d = t.date.toISOString().split("T")[0];
                if (!txMap.has(d)) txMap.set(d, { income: 0, expense: 0 });
                const entry = txMap.get(d)!;
                if (t.type === "INCOME") entry.income += t.amount;
                else entry.expense += t.amount;
            });

            if (allTx.length > 0 && allTx[0].date < start) {
                start.setTime(allTx[0].date.getTime());
            }

            const current = new Date(start);
            current.setUTCHours(0, 0, 0, 0);

            const last = new Date(end);
            last.setUTCHours(23, 59, 59, 999);

            while (current <= last) {
                const dateStr = current.toISOString().split("T")[0];
                const data = txMap.get(dateStr) || { income: 0, expense: 0 };
                chartData.push({
                    date: dateStr,
                    income: data.income,
                    expense: data.expense
                });
                current.setUTCDate(current.getUTCDate() + 1);
            }
        }

        res.json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            incomeCount: incomeAgg._count,
            expenseCount: expenseAgg._count,
            recentTransactions,
            categoryBreakdown: (categoryData as any[]).map((cat: any) => ({
                name: cat.category || "Other",
                totalSpent: cat._sum.amount || 0,
                count: cat._count._all || 0,
            })),
            chartData,
        });
    } catch (error) {
        console.error("Get summary error:", error);
        res.status(500).json({ error: "Failed to fetch summary" });
    }
}
// POST bulk create transactions
export async function bulkCreateTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { transactions } = req.body;

        if (!Array.isArray(transactions) || transactions.length === 0) {
            res.status(400).json({ error: "Transactions array is required" });
            return;
        }

        const access = checkUserAccess(user);
        if (access === "expired") {
            res.status(403).json({
                message: "Trial expired. Please upgrade to Pro to use this feature."
            });
            return;
        }

        const createdTransactions = await prisma.transaction.createMany({
            data: transactions.map((t: any) => ({
                title: t.merchant || t.title,
                amount: t.amount,
                type: t.type as any,
                category: t.category || "Other",
                date: new Date(t.date),
                userId: user.id,
                notes: t.notes || "",
            })),
        });

        // Update streak once for the batch
        let newMilestone = null;
        try {
            newMilestone = await updateStreak(user.id);
        } catch (error) {
            console.error("Streak update error in bulk create:", error);
        }

        res.status(201).json({
            success: true,
            count: createdTransactions.count,
            newMilestone
        });
    } catch (error) {
        console.error("Bulk create transactions error:", error);
        res.status(500).json({ error: "Failed to create transactions in bulk" });
    }
}
