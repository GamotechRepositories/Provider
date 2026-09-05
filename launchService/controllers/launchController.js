import { validateOperator } from "../services/operatorService.js";
import { requireJson, getValidationInput } from "./helpers.js";
import { buildLaunchUrl } from "../utils/buildLaunchUrl.js";

const LAUNCH_PATH = "/api/v1/launch";

export async function launch(req, res) {
  if (!requireJson(req, res)) return;

  const result = await validateOperator(getValidationInput(req, LAUNCH_PATH));

  if (!result.valid) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }

  const { operator, game, playerId } = result;
  const launchUrl = buildLaunchUrl({ operator, game, playerId });

  return res.status(200).json({
    success: true,
    message: "Launch successful",
    launchUrl,
    launch: {
      operatorId: operator.operatorId,
      operatorName: operator.name,
      playerId,
      gameCode: game.code,
      gameName: game.name,
      launchUrl,
      sessionTimeout: operator.sessionTimeout,
      currency: operator.currency,
      timezone: operator.timezone,
      language: operator.language,
    },
  });
}
