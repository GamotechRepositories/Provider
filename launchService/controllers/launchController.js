import { validateOperator } from "../services/operatorService.js";
import { buildLaunchUrl } from "../services/launchUrlService.js";
import { requireJson, getValidationInput } from "./helpers.js";

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

  let launchUrl;
  try {
    launchUrl = buildLaunchUrl({ operator, game, playerId });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to generate launch URL",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Launch successful",
    launch: {
      launchUrl,
      operatorId: operator.operatorId,
      operatorName: operator.name,
      playerId,
      gameCode: game.code,
      gameName: game.name,
      sessionTimeout: operator.sessionTimeout,
      currency: operator.currency,
      timezone: operator.timezone,
      language: operator.language,
    },
  });
}
