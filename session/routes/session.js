import { Router } from "express";
import {
  createSessionHandler,
  validateSessionHandler,
  sessionEventHandler,
} from "../controllers/sessionController.js";

const router = Router();

router.post("/sessions", createSessionHandler);
router.post("/sessions/validate", validateSessionHandler);
router.post("/sessions/events", sessionEventHandler);

export default router;
