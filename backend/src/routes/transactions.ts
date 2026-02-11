import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getSummary,
} from "../controllers/transactions";

const router = Router();

router.use(requireAuth as any);

router.get("/summary", getSummary as any);
router.get("/", getTransactions as any);
router.get("/:id", getTransaction as any);
router.post("/", createTransaction as any);
router.put("/:id", updateTransaction as any);
router.delete("/:id", deleteTransaction as any);

export default router;
