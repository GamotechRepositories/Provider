import { Router } from "express";
import { validateOperator } from "../services/operatorService.js";

const router = Router();
const VALIDATE_PATH = "/api/v1/validate-operator";

router.post("/validate-operator", async (req, res) => {
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
    path: VALIDATE_PATH,
    rawBody: req.rawBody ?? JSON.stringify(req.body),
  });

  if (!result.valid) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Operator validated successfully",
    operator: result.operator,
    playerId: result.playerId,
    game: result.game,
  });
});

export default router;
