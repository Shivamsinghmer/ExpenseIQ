import { Router } from "express";
import { parseSMS } from "../controllers/smsController";

const router = Router();

router.post("/parse", parseSMS);

export default router;
