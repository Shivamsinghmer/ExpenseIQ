import { Router } from "express";
import { createOrder, webhook, getPaymentStatus, verifyPayment } from "../controllers/payments";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Get subscription status
router.get("/status", requireAuth, (req, res) => getPaymentStatus(req as any, res));

// Verify payment - called by mobile app after success
router.post("/verify", requireAuth, (req, res) => verifyPayment(req as any, res));

// Create order - requires authentication
router.post("/create-order", requireAuth, (req, res) => createOrder(req as any, res));

// Webhook - called by Cashfree (no auth, but should verify signature)
router.post("/webhook", webhook);

export default router;
