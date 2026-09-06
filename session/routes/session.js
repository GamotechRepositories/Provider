import { Router } from "express";
import {
  createSessionHandler,
  validateSessionHandler,
  sessionEventHandler,
  getSessionTrackHandler,
} from "../controllers/sessionController.js";

const router = Router();

router.post("/sessions", createSessionHandler);
router.post("/sessions/validate", validateSessionHandler);
router.post("/sessions/events", sessionEventHandler);
router.get("/sessions/track", getSessionTrackHandler);

export default router;
