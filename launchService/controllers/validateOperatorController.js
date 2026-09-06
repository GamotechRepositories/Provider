import { validateOperator } from "../services/operatorService.js";
import { requireJson, getValidationInput } from "./helpers.js";

const VALIDATE_PATH = "/api/v1/validate-operator";

export async function validateOperatorHandler(req, res) {
  if (!requireJson(req, res)) return;

  const result = await validateOperator(getValidationInput(req, VALIDATE_PATH));

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
    playerUsername: result.playerUsername,
    game: result.game,
  });
}
