import { validateSession } from "./sessionRepository.js";

const WALLET_BODY_FIELDS = [
  "amount",
  "transactionId",
  "roundId",
  "tableId",
  "gameCode",
  "reference",
  "metadata",
];

function extractSessionToken(req) {
  return (
    req.body?.sessionToken ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
    req.query?.sessionToken
  );
}

function verifyGameServerKey(req) {
  const requiredKey = process.env.GAME_SERVER_API_KEY;

  if (!requiredKey) {
    return { valid: true };
  }

  const providedKey = req.headers["x-game-server-key"];

  if (!providedKey || providedKey !== requiredKey) {
    return {
      valid: false,
      status: 401,
      message: "Valid X-Game-Server-Key header is required for wallet operations",
    };
  }

  return { valid: true };
}

function pickWalletPayload(body = {}) {
  const payload = {};
  for (const field of WALLET_BODY_FIELDS) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }
  return payload;
}

export async function resolveWalletContext(req) {
  const serverAuth = verifyGameServerKey(req);
  if (!serverAuth.valid) {
    return serverAuth;
  }

  const sessionToken = extractSessionToken(req);
  const sessionResult = await validateSession(sessionToken);

  if (!sessionResult.valid) {
    return sessionResult;
  }

  const session = sessionResult.session;

  return {
    valid: true,
    operatorId: session.operatorId,
    session,
    input: {
      ...pickWalletPayload(req.body),
      playerId: session.playerId,
      playerUsername: session.playerUsername,
      gameCode: session.gameCode ?? req.body?.gameCode,
      currency: session.currency,
    },
  };
}
