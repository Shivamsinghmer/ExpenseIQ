import { Request, Response } from "express";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import prisma from "../services/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { getOrCreateUser } from "../services/userService";

// Initialize Cashfree
const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID!,
    process.env.CASHFREE_SECRET_KEY!,
    "2023-08-01"
);

export async function verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            res.status(400).json({ error: "Order ID is required" });
            return;
        }

        // Direct fetch for robust verification
        const response = await fetch(`https://sandbox.cashfree.com/pg/orders/${orderId}/payments`, {
            method: "GET",
            headers: {
                "x-api-version": "2023-08-01",
                "x-client-id": process.env.CASHFREE_APP_ID!,
                "x-client-secret": process.env.CASHFREE_SECRET_KEY!
            }
        });

        const payments: any = await response.json();

        if (!response.ok) {
            console.error("Cashfree Verify Error:", payments);
            throw new Error(`Verification failed: ${payments.message || "Unknown error"}`);
        }

        // check if any payment is successful
        const successPayment = Array.isArray(payments) ? payments.find((p: any) => p.payment_status === "SUCCESS") : null;

        if (successPayment) {
            const order = await prisma.order.findUnique({
                where: { orderId },
            });

            if (order && order.status !== "PAID") {
                // Calculate expiration date
                const amount = order.amount;
                let expiryDate = new Date();

                // If user is already pro and has an expiry date in the future, extend it
                const currentUser = await prisma.user.findUnique({ where: { id: order.userId } });
                if (currentUser?.isPro && currentUser?.proExpiresAt && currentUser.proExpiresAt > new Date()) {
                    expiryDate = new Date(currentUser.proExpiresAt);
                }

                if (amount === 50) {
                    expiryDate.setMonth(expiryDate.getMonth() + 1);
                } else if (amount === 500) {
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                } else {
                    expiryDate.setDate(expiryDate.getDate() + 30);
                }

                await prisma.$transaction([
                    prisma.order.update({
                        where: { id: order.id },
                        data: { status: "PAID" },
                    }),
                    prisma.user.update({
                        where: { id: order.userId },
                        data: {
                            isPro: true,
                            proExpiresAt: expiryDate,
                            subscriptionStartDate: new Date(),
                            subscriptionEndDate: expiryDate
                        },
                    }),
                ]);
            }
            res.json({ status: "SUCCESS" });
        } else {
            res.json({ status: "PENDING" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: "Verification failed" });
    }
}

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

        // Validate Environment Variables
        if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
            console.error("Cashfree credentials missing in environment variables");
            res.status(500).json({ error: "Server configuration error" });
            return;
        }

        if (!process.env.BACKEND_URL) {
            console.error("BACKEND_URL missing in environment variables");
            res.status(500).json({ error: "Server configuration error" });
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

        // Use a clearer placeholder or construct one from user ID
        const customerEmail = `user_${user.id}@expenseiq.app`;

        const request = {
            order_amount: amount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: user.id,
                customer_phone: "9999999999",
                customer_email: customerEmail,
            },
            order_meta: {
                notify_url: "https://www.google.com", // Temporary, localhost might be rejected
            },
            order_note: "Subscription Upgrade for User " + user.id,
        };

        console.log("Creating Cashfree Order:", JSON.stringify({ ...request, customer_details: { ...request.customer_details, customer_phone: "***" } }));

        try {
            // Fallback to direct API call if SDK fails (or just replace it)
            // Using fetch which is available in Node 18+
            try {
                const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-version": "2023-08-01",
                        "x-client-id": process.env.CASHFREE_APP_ID!,
                        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
                        "x-request-id": orderId
                    },
                    body: JSON.stringify(request)
                });

                const data: any = await response.json();

                if (!response.ok) {
                    throw { response: { data } };
                }

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
                return;
            } catch (fetchError: any) {
                console.error("Direct Fetch Error:", fetchError?.response?.data || fetchError);
                // Fallthrough to SDK error handling if needed, or just throw
                throw fetchError;
            }

            /* SDK Call - commented out for now to isolate issue
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
            */
        } catch (apiError: any) {
            console.error("Cashfree API Error:", apiError?.response?.data || apiError?.message);
            // Return the specific error from Cashfree if available
            const message = apiError?.response?.data?.message || "Payment initiation failed";
            // Check for specific error codes or messages
            if (apiError?.response?.data?.code === "authentication_failed") {
                console.error("Cashfree Authentication Failed. Check App ID and Secret Key.");
            }

            res.status(500).json({
                error: message,
                details: apiError?.response?.data
            });
            return;
        }

    } catch (error: any) {
        console.error("Create Order Internal Error:", error);
        res.status(500).json({ error: "Internal server error" });
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
                // Calculate expiration date
                const amount = order.amount;
                let expiryDate = new Date();

                // If user is already pro and has an expiry date in the future, extend it
                const currentUser = await prisma.user.findUnique({ where: { id: order.userId } });
                if (currentUser?.isPro && currentUser?.proExpiresAt && currentUser.proExpiresAt > new Date()) {
                    expiryDate = new Date(currentUser.proExpiresAt);
                }

                if (amount === 50) {
                    expiryDate.setMonth(expiryDate.getMonth() + 1);
                } else if (amount === 500) {
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                } else {
                    // Default fallback (maybe they used a different amount or discount)
                    // Assume monthly for safety or just 30 days
                    expiryDate.setDate(expiryDate.getDate() + 30);
                }

                await prisma.$transaction([
                    prisma.order.update({
                        where: { id: order.id },
                        data: { status: "PAID" },
                    }),
                    prisma.user.update({
                        where: { id: order.userId },
                        data: {
                            isPro: true,
                            proExpiresAt: expiryDate,
                            subscriptionStartDate: new Date(),
                            subscriptionEndDate: expiryDate
                        },
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

        const user = await getOrCreateUser(req.clerkUserId);

        res.json({
            isPro: user.isPro,
            proExpiresAt: user.proExpiresAt,
            trialStartDate: user.trialStartDate,
            trialEndDate: user.trialEndDate
        });
    } catch (error) {
        console.error("Get Payment Status Error:", error);
        res.status(500).json({ error: "Failed to fetch status" });
    }
}
