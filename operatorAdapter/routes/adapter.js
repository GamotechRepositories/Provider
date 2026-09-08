import { Router } from "express";
import {
  getPlayerProfileHandler,
  getBalanceHandler,
  debitHandler,
  creditHandler,
} from "../controllers/adapterController.js";

const router = Router();

router.get("/adapters/:operatorId/player-profile", getPlayerProfileHandler);
router.post("/adapters/:operatorId/player-profile", getPlayerProfileHandler);

router.get("/adapters/:operatorId/balance", getBalanceHandler);
router.post("/adapters/:operatorId/balance", getBalanceHandler);

router.post("/adapters/:operatorId/debit", debitHandler);
router.post("/adapters/:operatorId/credit", creditHandler);

export default router;
