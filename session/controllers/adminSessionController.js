import {
  getSessionTrack,
  listSessions,
  getSessionById,
} from "../services/sessionService.js";

export async function listSessionsHandler(req, res) {
  const { operatorId, playerId, gameCode, status, from, to, page, limit } =
    req.query;

  try {
    const result = await listSessions({
      operatorId,
      playerId,
      gameCode,
      status,
      from,
      to,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      sessions: result.sessions,
      pagination: result.pagination,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to list sessions",
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

export async function getSessionByIdHandler(req, res) {
  try {
    const result = await getSessionById(req.params.sessionId);

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
      message: "Unable to fetch session",
    });
  }
}
