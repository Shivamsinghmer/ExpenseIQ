import { Response } from "express";
import { z } from "zod";
import prisma from "../services/prisma";
import { getAIResponse } from "../services/gemini";
import { AuthenticatedRequest } from "../middleware/auth";

const questionSchema = z.object({
    question: z.string().min(1, "Question is required").max(500),
});

// Helper to get or create user
async function getOrCreateUser(clerkUserId: string) {
    let user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) {
        user = await prisma.user.create({ data: { clerkUserId } });
    }
    return user;
}

// Parse intent from question to determine date filters
function parseIntent(question: string): { startDate?: Date; endDate?: Date; type?: string } {
    const now = new Date();
    const lower = question.toLowerCase();
    const result: { startDate?: Date; endDate?: Date; type?: string } = {};

    // Detect transaction type
    if (lower.includes("expense") || lower.includes("spent") || lower.includes("spending")) {
        result.type = "EXPENSE";
    } else if (lower.includes("income") || lower.includes("earned") || lower.includes("earning")) {
        result.type = "INCOME";
    }

    // Detect time periods
    const months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december",
    ];

    for (let i = 0; i < months.length; i++) {
        if (lower.includes(months[i])) {
            const year = now.getFullYear();
            result.startDate = new Date(year, i, 1);
            result.endDate = new Date(year, i + 1, 0, 23, 59, 59);
            return result;
        }
    }

    if (lower.includes("last month")) {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        result.startDate = lastMonth;
        result.endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (lower.includes("this month")) {
        result.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        result.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (lower.includes("this year") || lower.includes("this annual")) {
        result.startDate = new Date(now.getFullYear(), 0, 1);
        result.endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (lower.includes("last year")) {
        result.startDate = new Date(now.getFullYear() - 1, 0, 1);
        result.endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else if (lower.includes("today")) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        result.startDate = start;
        result.endDate = end;
    } else if (lower.includes("this week")) {
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        result.startDate = start;
        result.endDate = now;
    } else if (lower.includes("last 3 months") || lower.includes("last three months")) {
        result.startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        result.endDate = now;
    } else if (lower.includes("last 6 months") || lower.includes("last six months")) {
        result.startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        result.endDate = now;
    }

    return result;
}

interface TransactionWithTags {
    title: string;
    amount: number;
    type: string;
    date: Date;
    notes: string | null;
    tags: { name: string }[];
}

interface TagWithTransactions {
    name: string;
    transactions: { amount: number; type: string }[];
}

// POST AI question
export async function askQuestion(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = await getOrCreateUser(req.clerkUserId!);
        const { question } = questionSchema.parse(req.body);

        // Parse intent from the question
        const intent = parseIntent(question);

        // Build query filters
        const where: Record<string, any> = { userId: user.id };
        if (intent.type) where.type = intent.type;
        if (intent.startDate || intent.endDate) {
            where.date = {} as Record<string, Date>;
            if (intent.startDate) where.date.gte = intent.startDate;
            if (intent.endDate) where.date.lte = intent.endDate;
        }

        // Fetch relevant financial data
        const [transactions, tags, incomeAgg, expenseAgg] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: { tags: true },
                orderBy: { date: "desc" },
                take: 100,
            }),
            prisma.tag.findMany({
                where: { userId: user.id },
                include: {
                    transactions: {
                        where,
                        select: { amount: true, type: true },
                    },
                },
            }),
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
        ]);

        // Structure data for Gemini
        const financialData = {
            summary: {
                totalIncome: incomeAgg._sum.amount || 0,
                totalExpense: expenseAgg._sum.amount || 0,
                balance: (incomeAgg._sum.amount || 0) - (expenseAgg._sum.amount || 0),
                incomeTransactionCount: incomeAgg._count,
                expenseTransactionCount: expenseAgg._count,
            },
            dateRange: {
                from: intent.startDate?.toISOString() || "all time",
                to: intent.endDate?.toISOString() || "now",
            },
            transactions: (transactions as TransactionWithTags[]).map((t: TransactionWithTags) => ({
                title: t.title,
                amount: t.amount,
                type: t.type,
                date: t.date.toISOString().split("T")[0],
                tags: t.tags.map((tag: { name: string }) => tag.name),
                notes: t.notes,
            })),
            tagBreakdown: (tags as TagWithTransactions[]).map((tag: TagWithTransactions) => ({
                name: tag.name,
                totalAmount: tag.transactions.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0),
                transactionCount: tag.transactions.length,
                incomeAmount: tag.transactions
                    .filter((t: { amount: number; type: string }) => t.type === "INCOME")
                    .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0),
                expenseAmount: tag.transactions
                    .filter((t: { amount: number; type: string }) => t.type === "EXPENSE")
                    .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0),
            })),
        };

        // Get AI response
        const aiResponse = await getAIResponse(question, financialData);

        res.json({
            question,
            answer: aiResponse,
            dataContext: {
                transactionCount: transactions.length,
                dateRange: financialData.dateRange,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }
        console.error("AI question error:", error);
        res.status(500).json({ error: "Failed to process question" });
    }
}
