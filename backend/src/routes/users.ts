import { Router } from "express";
import { deleteAccount } from "../controllers/users";

const router = Router();

router.post("/delete-account", deleteAccount);

export default router;
