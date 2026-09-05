import crypto from "crypto";
import Session from "../models/Session.js";

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function formatSession(session) {
  return {
    sessionToken: session.sessionToken,
    operatorId: session.operatorId,
    playerId: session.playerId,
    gameCode: session.gameCode,
    currency: session.currency,
    language: session.language,
    timezone: session.timezone,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  };
}

export async function createSession({
  operatorId,
  playerId,
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
    gameCode,
    currency,
    language,
    timezone,
    status: "ACTIVE",
    expiresAt,
  });

  return formatSession(session);
}

export async function validateSession(sessionToken) {
  if (!sessionToken) {
    return { valid: false, status: 401, message: "sessionToken is required" };
  }

  const session = await Session.findOne({ sessionToken });

  if (!session) {
    return { valid: false, status: 401, message: "Invalid session token" };
  }

  if (session.status !== "ACTIVE") {
    return {
      valid: false,
      status: 403,
      message: `Session is ${session.status}`,
    };
  }

  if (session.expiresAt <= new Date()) {
    await Session.deleteOne({ _id: session._id });
    return { valid: false, status: 401, message: "Session expired" };
  }

  return { valid: true, session: formatSession(session) };
}

export async function revokeSession(sessionToken) {
  const session = await Session.findOneAndUpdate(
    { sessionToken },
    { status: "REVOKED" },
    { new: true }
  );

  return Boolean(session);
}
