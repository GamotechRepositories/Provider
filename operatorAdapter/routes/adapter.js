import { Router } from "express";
import {
  getPlayerProfileHandler,
  getBalanceHandler,
  debitHandler,
  creditHandler,
} from "../controllers/adapterController.js";

const router = Router();

router.get("/adapters/player-profile", getPlayerProfileHandler);
router.post("/adapters/player-profile", getPlayerProfileHandler);

router.get("/adapters/balance", getBalanceHandler);
router.post("/adapters/balance", getBalanceHandler);

router.post("/adapters/debit", debitHandler);
router.post("/adapters/credit", creditHandler);

export default router;
