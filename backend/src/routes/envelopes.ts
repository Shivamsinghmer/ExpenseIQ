import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getEnvelopes, createEnvelope, updateEnvelope, deleteEnvelope } from "../controllers/envelopes";

const router = Router();

router.use(requireAuth as any);

router.get("/", getEnvelopes as any);
router.post("/", createEnvelope as any);
router.put("/:id", updateEnvelope as any);
router.delete("/:id", deleteEnvelope as any);

export default router;
