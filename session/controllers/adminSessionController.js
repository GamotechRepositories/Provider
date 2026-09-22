import {
  getSessionTrack,
  listSessions,
  getSessionById,
} from "../services/sessionService.js";
import {
  getStatsByOperator,
  getStatsByGame,
  listEventsByOperator,
  listEventsByGame,
} from "../services/sessionAnalyticsService.js";

function sendServiceResult(res, result) {
  if (!result.valid) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }

  const body = { success: true };

  if (result.filters) body.filters = result.filters;
  if (result.summary) body.summary = result.summary;
  if (result.byPlayer) body.byPlayer = result.byPlayer;
  if (result.events) body.events = result.events;
  if (result.pagination) body.pagination = result.pagination;

  return res.status(200).json(body);
}

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

export async function getStatsByOperatorHandler(req, res) {
  const { operatorId, gameCode, from, to } = req.query;

  try {
    const result = await getStatsByOperator({ operatorId, gameCode, from, to });
    return sendServiceResult(res, result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch operator session stats",
    });
  }
}

export async function getStatsByGameHandler(req, res) {
  const { gameCode, operatorId, from, to } = req.query;

  try {
    const result = await getStatsByGame({ gameCode, operatorId, from, to });
    return sendServiceResult(res, result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch game session stats",
    });
  }
}

export async function listEventsByOperatorHandler(req, res) {
  const { operatorId, gameCode, from, to, page, limit, result } = req.query;

  try {
    const data = await listEventsByOperator({
      operatorId,
      gameCode,
      from,
      to,
      page,
      limit,
      result,
    });
    return sendServiceResult(res, data);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to list operator round events",
    });
  }
}

export async function listEventsByGameHandler(req, res) {
  const { gameCode, operatorId, from, to, page, limit, result } = req.query;

  try {
    const data = await listEventsByGame({
      gameCode,
      operatorId,
      from,
      to,
      page,
      limit,
      result,
    });
    return sendServiceResult(res, data);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to list game round events",
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
