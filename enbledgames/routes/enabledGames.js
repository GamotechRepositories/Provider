import { Router } from "express";
import { getOperatorEnabledGames } from "../controllers/enabledGamesController.js";

const router = Router();

router.get("/enabled-games", getOperatorEnabledGames);

export default router;
