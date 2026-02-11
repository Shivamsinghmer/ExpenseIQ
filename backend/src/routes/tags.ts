import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
    getTags,
    getTag,
    createTag,
    updateTag,
    deleteTag,
} from "../controllers/tags";

const router = Router();

router.use(requireAuth as any);

router.get("/", getTags as any);
router.get("/:id", getTag as any);
router.post("/", createTag as any);
router.put("/:id", updateTag as any);
router.delete("/:id", deleteTag as any);

export default router;
