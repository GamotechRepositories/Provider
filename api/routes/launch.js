import { Router } from "express";
import { validateOperator } from "../services/operatorService.js";

const router = Router();
const LAUNCH_PATH = "/api/v1/launch";

router.post("/launch", async (req, res) => {
  const contentType = req.headers["content-type"];
  if (!contentType?.includes("application/json")) {
    return res.status(415).json({
      success: false,
      message: "Content-Type must be application/json",
    });
  }

  const { operatorId, playerId, gameCode, currency } = req.body;

  const result = await validateOperator({
    operatorId,
    playerId,
    gameCode,
    currency,
    apiKey: req.headers["x-api-key"],
    timestamp: req.headers["x-timestamp"],
    signature: req.headers["x-signature"],
    method: req.method,
    path: LAUNCH_PATH,
    rawBody: req.rawBody ?? JSON.stringify(req.body),
  });

  if (!result.valid) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }

  const { operator, game, playerId: validatedPlayerId } = result;

  return res.status(200).json({
    success: true,
    message: "Launch successful",
    launch: {
      operatorId: operator.operatorId,
      operatorName: operator.name,
      playerId: validatedPlayerId,
      gameCode: game.code,
      gameName: game.name,
      sessionTimeout: operator.sessionTimeout,
      currency: operator.currency,
      timezone: operator.timezone,
      language: operator.language,
    },
  });
});

export default router;
