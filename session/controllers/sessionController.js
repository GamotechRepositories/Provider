import { createSession, validateSession } from "../services/sessionService.js";

export async function createSessionHandler(req, res) {
  const {
    operatorId,
    playerId,
    gameCode,
    currency,
    language,
    timezone,
    sessionTimeout,
  } = req.body;

  if (!operatorId || !playerId || !gameCode || !currency) {
    return res.status(400).json({
      success: false,
      message: "operatorId, playerId, gameCode, and currency are required",
    });
  }

  try {
    const session = await createSession({
      operatorId,
      playerId,
      gameCode,
      currency,
      language,
      timezone,
      sessionTimeout,
    });

    return res.status(201).json({
      success: true,
      message: "Session created",
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      session,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create session",
    });
  }
}

export async function validateSessionHandler(req, res) {
  const sessionToken =
    req.body.sessionToken ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  try {
    const result = await validateSession(sessionToken);

    if (!result.valid) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session valid",
      session: {
        operatorId: result.session.operatorId,
        playerId: result.session.playerId,
        gameCode: result.session.gameCode,
        currency: result.session.currency,
        language: result.session.language,
        timezone: result.session.timezone,
        expiresAt: result.session.expiresAt,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to validate session",
    });
  }
}
