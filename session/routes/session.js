import { Router } from "express";
import {
  createSessionHandler,
  validateSessionHandler,
} from "../controllers/sessionController.js";

const router = Router();

router.post("/sessions", createSessionHandler);
router.post("/sessions/validate", validateSessionHandler);

export default router;
