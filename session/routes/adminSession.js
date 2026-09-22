import { Router } from "express";
import { requireAdminKey } from "../middleware/adminAuth.js";
import {
  listSessionsHandler,
  getSessionTrackHandler,
  getSessionByIdHandler,
  getStatsByOperatorHandler,
  getStatsByGameHandler,
  listEventsByOperatorHandler,
  listEventsByGameHandler,
} from "../controllers/adminSessionController.js";

const router = Router();

router.use(requireAdminKey);

router.get("/sessions/stats/by-operator", getStatsByOperatorHandler);
router.get("/sessions/stats/by-game", getStatsByGameHandler);
router.get("/sessions/events/by-operator", listEventsByOperatorHandler);
router.get("/sessions/events/by-game", listEventsByGameHandler);
router.get("/sessions", listSessionsHandler);
router.get("/sessions/track", getSessionTrackHandler);
router.get("/sessions/:sessionId", getSessionByIdHandler);

export default router;
