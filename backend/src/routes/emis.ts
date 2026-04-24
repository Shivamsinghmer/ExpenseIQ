import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getEmis, createEmi, updateEmi, deleteEmi } from "../controllers/emis";

const router = Router();

router.use(requireAuth as any);

router.get("/", getEmis as any);
router.post("/", createEmi as any);
router.put("/:id", updateEmi as any);
router.delete("/:id", deleteEmi as any);

export default router;
