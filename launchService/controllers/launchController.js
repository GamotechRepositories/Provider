import { validateOperator } from "../services/operatorService.js";
import { createSession } from "../services/sessionRepository.js";
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

  let sessionData;
  try {
    sessionData = await createSession({
      operatorId: operator.operatorId,
      playerId,
      gameCode: game.code,
      currency: operator.currency,
      language: operator.language,
      timezone: operator.timezone,
      sessionTimeout: operator.sessionTimeout,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create session",
    });
  }

  const { sessionToken, expiresAt } = sessionData;
  const launchUrl = buildLaunchUrl({
    operator,
    game,
    playerId,
    sessionToken,
  });

  return res.status(200).json({
    success: true,
    message: "Launch successful",
    sessionToken,
    expiresAt,
    launchUrl,
    launch: {
      operatorId: operator.operatorId,
      operatorName: operator.name,
      playerId,
      gameCode: game.code,
      gameName: game.name,
      sessionToken,
      expiresAt,
      launchUrl,
      sessionTimeout: operator.sessionTimeout,
      currency: operator.currency,
      timezone: operator.timezone,
      language: operator.language,
    },
  });
}
