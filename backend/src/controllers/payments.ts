import { Request, Response } from "express";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import prisma from "../services/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Initialize Cashfree
const cashfree = new Cashfree(
    process.env.CASHFREE_ENV === "PROD"
        ? CFEnvironment.PRODUCTION
        : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID!,
    process.env.CASHFREE_SECRET_KEY!
);

export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            res.status(400).json({ error: "Invalid amount" });
            return;
        }

        if (!req.clerkUserId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: req.clerkUserId },
        });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const orderId = `order_${Date.now()}_${user.id.substring(0, 8)}`;

        const request = {
            order_amount: amount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: user.id,
                customer_phone: "9999999999", // Placeholder
                customer_email: "customer@example.com", // Placeholder
            },
            order_meta: {
                notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
            },
        };

        const response = await cashfree.PGCreateOrder(request);
        const data = response.data;

        // Save pending order to DB
        await prisma.order.create({
            data: {
                orderId: data.order_id!,
                paymentSessionId: data.payment_session_id!,
                amount: amount,
                userId: user.id,
                status: "PENDING",
            },
        });

        res.json({
            order_id: data.order_id,
            payment_session_id: data.payment_session_id,
        });
    } catch (error: any) {
        console.error("Cashfree Create Order Error:", error?.response?.data || error?.message);
        res.status(500).json({ error: "Failed to create payment order" });
    }
}

export async function webhook(req: Request, res: Response): Promise<void> {
    try {
        // Cashfree usually sends data in req.body.data
        const { data } = req.body;

        if (!data || !data.order || !data.payment) {
            console.warn("[Webhook] Invalid payload structure or missing data");
            res.json({ status: "received", message: "ignored_invalid_payload" });
            return;
        }

        const orderId = data.order.order_id;
        const paymentStatus = data.payment.payment_status;

        console.log(`[Webhook] Order: ${orderId}, Status: ${paymentStatus}`);

        if (paymentStatus === "SUCCESS") {
            const order = await prisma.order.findUnique({
                where: { orderId },
            });

            if (order && order.status !== "PAID") {
                await prisma.$transaction([
                    prisma.order.update({
                        where: { id: order.id },
                        data: { status: "PAID" },
                    }),
                    prisma.user.update({
                        where: { id: order.userId },
                        data: { isPro: true },
                    }),
                ]);
                console.log(`[Success] User ${order.userId} upgraded to PRO`);
            }
        } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
            // Only update if order exists
            const order = await prisma.order.findUnique({ where: { orderId } });
            if (order) {
                await prisma.order.update({
                    where: { orderId },
                    data: { status: paymentStatus },
                });
            }
        }

        res.json({ status: "received" });
    } catch (error: any) {
        console.error("Webhook Error:", error?.message);
        res.status(500).json({ error: "Webhook processing failed" });
    }
}

export async function getPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        if (!req.clerkUserId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: req.clerkUserId },
            select: { isPro: true },
        });
        res.json({ isPro: user?.isPro || false });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch status" });
    }
}
