import { Router } from "express";
import { deleteAccount, verifyCredentials, updateCurrency } from "../controllers/users";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/verify-credentials", verifyCredentials);
router.post("/delete-account", deleteAccount);
router.put("/currency", requireAuth, updateCurrency);

export default router;
