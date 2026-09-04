import { Router } from "express";
import { validateOperatorHandler } from "../controllers/validateOperatorController.js";

const router = Router();

router.post("/validate-operator", validateOperatorHandler);

export default router;
