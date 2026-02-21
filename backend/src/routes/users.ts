import { Router } from "express";
import { deleteAccount, verifyCredentials } from "../controllers/users";

const router = Router();

router.post("/verify-credentials", verifyCredentials);
router.post("/delete-account", deleteAccount);

export default router;
