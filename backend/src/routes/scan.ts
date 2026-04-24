import { Router } from "express";
import { scanReceipt } from "../controllers/scanController";

const router = Router();

router.post("/receipt", scanReceipt);

export default router;
