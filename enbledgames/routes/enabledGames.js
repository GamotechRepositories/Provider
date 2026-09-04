import { Router } from "express";
import { getOperatorEnabledGames } from "../controllers/enabledGamesController.js";

const router = Router();

router.get("/operators/:operatorId/enabled-games", getOperatorEnabledGames);

export default router;
