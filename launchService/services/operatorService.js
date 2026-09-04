import {
  buildSignaturePayload,
  verifyHmacSignature,
  isTimestampValid,
} from "../utils/hmac.js";
import { fetchOperator } from "./operatorRepository.js";
import { fetchGameById } from "./gameRepository.js";
import { getOperatorSecret } from "./secretsService.js";

const TIMESTAMP_TOLERANCE = Number(process.env.TIMESTAMP_TOLERANCE_SECONDS || 300);

export async function validateOperator({
  operatorId,
  playerId,
  gameCode,
  currency,
  apiKey,
  timestamp,
  signature,
  method,
  path,
  rawBody,
}) {
  if (!operatorId || !playerId || !gameCode || !currency) {
    return {
      valid: false,
      status: 400,
      message: "operatorId, playerId, gameCode, and currency are required",
    };
  }

  if (!apiKey || !timestamp || !signature) {
    return {
      valid: false,
      status: 401,
      message: "X-API-Key, X-Timestamp, and X-Signature headers are required",
    };
  }

  if (!isTimestampValid(timestamp, TIMESTAMP_TOLERANCE)) {
    return {
      valid: false,
      status: 401,
      message: "X-Timestamp is invalid or expired",
    };
  }

  let operator;
  try {
    operator = await fetchOperator(operatorId);
  } catch {
    return {
      valid: false,
      status: 502,
      message: "Unable to reach operators API",
    };
  }

  if (!operator) {
    return { valid: false, status: 404, message: "Operator not found" };
  }

  if (operator.apiKey !== apiKey) {
    return { valid: false, status: 401, message: "Invalid X-API-Key" };
  }

  if (operator.status !== "ACTIVE") {
    return {
      valid: false,
      status: 403,
      message: `Operator is ${operator.status}`,
    };
  }

  if (operator.maintenanceMode) {
    return {
      valid: false,
      status: 503,
      message: "Operator is in maintenance mode",
    };
  }

  if (currency !== operator.currency) {
    return {
      valid: false,
      status: 400,
      message: `Currency must be ${operator.currency}`,
    };
  }

  let secret;
  try {
    secret = await getOperatorSecret(operatorId, operator);
  } catch {
    return {
      valid: false,
      status: 500,
      message: "Unable to retrieve operator secret",
    };
  }

  const payload = buildSignaturePayload({
    timestamp,
    method,
    path,
    rawBody,
  });

  if (!verifyHmacSignature(secret, payload, signature)) {
    return { valid: false, status: 401, message: "Invalid X-Signature" };
  }

  const enabledGame = operator.enabledGames?.find(
    (g) => g.code === gameCode || g.slug === gameCode
  );

  if (!enabledGame) {
    return {
      valid: false,
      status: 403,
      message: `Game ${gameCode} is not enabled for this operator`,
    };
  }

  let game;
  try {
    game = await fetchGameById(enabledGame._id);
  } catch {
    return {
      valid: false,
      status: 502,
      message: "Unable to reach games API",
    };
  }

  if (game.status !== "ACTIVE") {
    return {
      valid: false,
      status: 403,
      message: `Game is ${game.status}`,
    };
  }

  if (game.maintenanceMode) {
    return {
      valid: false,
      status: 503,
      message: "Game is in maintenance mode",
    };
  }

  if (!game.launchUrl) {
    return {
      valid: false,
      status: 500,
      message: "Game launchUrl is not configured",
    };
  }

  return {
    valid: true,
    operator: {
      operatorId: operator.operatorId,
      name: operator.name,
      slug: operator.slug,
      currency: operator.currency,
      timezone: operator.timezone,
      language: operator.language,
      enabledGames: operator.enabledGames,
      sessionTimeout: operator.sessionTimeout,
      isDemoEnabled: operator.isDemoEnabled,
    },
    game: {
      _id: game._id,
      name: game.name,
      slug: game.slug,
      code: game.code,
      launchUrl: game.launchUrl,
      demoUrl: game.demoUrl,
    },
    playerId,
  };
}
