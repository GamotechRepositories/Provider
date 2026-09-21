import crypto from "crypto";
import mongoose from "mongoose";
import Session from "../models/Session.js";
import SessionEvent from "../models/SessionEvent.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ─── External response formatters (sessionToken only, no internal IDs) ───

function formatPublicSession(session) {
  return {
    sessionToken: session.sessionToken,
    operatorId: session.operatorId,
    playerId: session.playerId,
    playerUsername: session.playerUsername,
    gameCode: session.gameCode,
    currency: session.currency,
    language: session.language,
    timezone: session.timezone,
    status: session.status,
    gameContext: {
      tableId: session.gameContext?.tableId ?? null,
      currentRoundId: session.gameContext?.currentRoundId ?? null,
    },
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  };
}

function formatPublicEvent(sessionEvent) {
  return {
    event: sessionEvent.event,
    payload: sessionEvent.payload,
    createdAt: sessionEvent.createdAt.toISOString(),
  };
}

// ─── Internal/admin response formatters (sessionId exposed) ───

function formatInternalSession(session) {
  return {
    sessionId: session._id.toString(),
    sessionToken: session.sessionToken,
    operatorId: session.operatorId,
    playerId: session.playerId,
    playerUsername: session.playerUsername,
    gameCode: session.gameCode,
    currency: session.currency,
    language: session.language,
    timezone: session.timezone,
    status: session.status,
    gameContext: {
      tableId: session.gameContext?.tableId ?? null,
      currentRoundId: session.gameContext?.currentRoundId ?? null,
    },
    lastEventId: session.lastEventId?.toString() ?? null,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  };
}

function formatInternalEvent(sessionEvent) {
  return {
    eventId: sessionEvent._id.toString(),
    sessionId: sessionEvent.sessionId.toString(),
    event: sessionEvent.event,
    payload: sessionEvent.payload,
    createdAt: sessionEvent.createdAt.toISOString(),
  };
}

// ─── External boundary: resolve sessionToken → sessionId ───

async function resolveSessionToken(sessionToken) {
  if (!sessionToken) {
    return { valid: false, status: 401, message: "sessionToken is required" };
  }

  const session = await Session.findOne({ sessionToken });

  if (!session) {
    return { valid: false, status: 404, message: "Session not found" };
  }

  return {
    valid: true,
    session,
    sessionId: session._id,
  };
}

// ─── Internal: all DB ops use sessionId ───

async function findActiveSessionById(sessionId) {
  const session = await Session.findById(sessionId);

  if (!session) {
    return { valid: false, status: 404, message: "Session not found" };
  }

  if (session.status !== "ACTIVE") {
    return {
      valid: false,
      status: 403,
      message: `Session is ${session.status}`,
    };
  }

  if (session.expiresAt <= new Date()) {
    await SessionEvent.deleteMany({ sessionId: session._id });
    await Session.deleteOne({ _id: session._id });
    return { valid: false, status: 401, message: "Session expired" };
  }

  return { valid: true, session };
}

async function loadEventsBySessionId(sessionId) {
  return SessionEvent.find({ sessionId }).sort({ createdAt: 1 });
}

function buildEventPayload({ payload = {}, tableId, roundId }) {
  const eventPayload = { ...payload };
  if (tableId) eventPayload.tableId = tableId;
  if (roundId) eventPayload.roundId = roundId;
  return eventPayload;
}

function applyGameContextUpdate(session, event, payload) {
  if (!session.gameContext) {
    session.gameContext = { tableId: null, currentRoundId: null };
  }

  if (payload.tableId) session.gameContext.tableId = payload.tableId;
  if (payload.roundId) session.gameContext.currentRoundId = payload.roundId;

  if (event === "SESSION_ENDED") {
    session.status = "ENDED";
  }
}

async function appendSessionEvent(sessionId, event, payload) {
  const sessionResult = await findActiveSessionById(sessionId);
  if (!sessionResult.valid) return sessionResult;

  const session = sessionResult.session;

  const sessionEvent = await SessionEvent.create({
    sessionId,
    event,
    payload,
  });

  applyGameContextUpdate(session, event, payload);
  session.lastEventId = sessionEvent._id;
  await session.save();

  return {
    valid: true,
    session,
    sessionEvent,
  };
}

// ─── Public API (external: sessionToken in) ───

export async function createSession({
  operatorId,
  playerId,
  playerUsername,
  gameCode,
  currency,
  language,
  timezone,
  sessionTimeout = 3600,
}) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + sessionTimeout * 1000);

  const session = await Session.create({
    sessionToken,
    operatorId,
    playerId,
    playerUsername,
    gameCode,
    currency,
    language,
    timezone,
    status: "ACTIVE",
    gameContext: {
      tableId: null,
      currentRoundId: null,
    },
    expiresAt,
  });

  return formatPublicSession(session);
}

export async function validateSession(sessionToken) {
  const resolved = await resolveSessionToken(sessionToken);
  if (!resolved.valid) return resolved;

  const result = await findActiveSessionById(resolved.sessionId);
  if (!result.valid) return result;

  return { valid: true, session: formatPublicSession(result.session) };
}

export async function recordSessionEvent({
  sessionToken,
  event,
  tableId,
  roundId,
  payload = {},
}) {
  if (!event) {
    return { valid: false, status: 400, message: "event is required" };
  }

  const resolved = await resolveSessionToken(sessionToken);
  if (!resolved.valid) return resolved;

  const eventPayload = buildEventPayload({ payload, tableId, roundId });
  const result = await appendSessionEvent(resolved.sessionId, event, eventPayload);

  if (!result.valid) return result;

  return {
    valid: true,
    session: formatPublicSession(result.session),
    event: formatPublicEvent(result.sessionEvent),
  };
}

export async function getSessionTrack(sessionToken) {
  const resolved = await resolveSessionToken(sessionToken);
  if (!resolved.valid) return resolved;

  const events = await loadEventsBySessionId(resolved.sessionId);

  return {
    valid: true,
    session: formatInternalSession(resolved.session),
    events: events.map(formatInternalEvent),
  };
}

function parsePagination(page, limit) {
  const pageNum = Math.max(DEFAULT_PAGE, parseInt(page, 10) || DEFAULT_PAGE);
  const limitNum = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT)
  );

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
}

function buildSessionListQuery({
  operatorId,
  playerId,
  gameCode,
  status,
  from,
  to,
}) {
  const query = {};

  if (operatorId) query.operatorId = operatorId;
  if (playerId) query.playerId = playerId;
  if (gameCode) query.gameCode = gameCode;
  if (status) query.status = status;

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  return query;
}

export async function listSessions(filters = {}) {
  const { page, limit, skip } = parsePagination(filters.page, filters.limit);
  const query = buildSessionListQuery(filters);

  const [sessions, total] = await Promise.all([
    Session.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Session.countDocuments(query),
  ]);

  return {
    valid: true,
    sessions: sessions.map(formatInternalSession),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function getSessionById(sessionId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return { valid: false, status: 400, message: "Invalid sessionId" };
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    return { valid: false, status: 404, message: "Session not found" };
  }

  const events = await loadEventsBySessionId(session._id);

  return {
    valid: true,
    session: formatInternalSession(session),
    events: events.map(formatInternalEvent),
  };
}

export async function revokeSession(sessionToken) {
  const resolved = await resolveSessionToken(sessionToken);
  if (!resolved.valid) return false;

  const session = await Session.findByIdAndUpdate(
    resolved.sessionId,
    { status: "REVOKED" },
    { new: true }
  );

  return Boolean(session);
}
