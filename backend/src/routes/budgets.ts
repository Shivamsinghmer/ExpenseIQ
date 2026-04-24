import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getBudgets, updateBudgets } from "../controllers/budgets";

const router = Router();

router.use(requireAuth);
router.get("/", getBudgets);
router.put("/", updateBudgets);

export default router;
