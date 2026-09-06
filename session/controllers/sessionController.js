import {
  createSession,
  validateSession,
  recordSessionEvent,
  getSessionTrack,
} from "../services/sessionService.js";

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
      session: result.session,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to validate session",
    });
  }
}

export async function sessionEventHandler(req, res) {
  const sessionToken =
    req.body.sessionToken ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const { event, tableId, roundId, payload } = req.body;

  if (!event) {
    return res.status(400).json({
      success: false,
      message: "event is required",
    });
  }

  try {
    const result = await recordSessionEvent({
      sessionToken,
      event,
      tableId,
      roundId,
      payload,
    });

    if (!result.valid) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session updated",
      event: result.event,
      session: result.session,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update session",
    });
  }
}

export async function getSessionTrackHandler(req, res) {
  const sessionToken =
    req.query.sessionToken ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  try {
    const result = await getSessionTrack(sessionToken);

    if (!result.valid) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      session: result.session,
      events: result.events,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch session track",
    });
  }
}
