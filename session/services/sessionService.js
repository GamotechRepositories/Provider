import crypto from "crypto";

const sessions = new Map();

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function createSession({
  operatorId,
  playerId,
  gameCode,
  currency,
  language,
  timezone,
  sessionTimeout = 3600,
}) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + sessionTimeout * 1000).toISOString();

  const session = {
    sessionToken,
    operatorId,
    playerId,
    gameCode,
    currency,
    language,
    timezone,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  sessions.set(sessionToken, session);

  return session;
}

export function validateSession(sessionToken) {
  if (!sessionToken) {
    return { valid: false, status: 401, message: "sessionToken is required" };
  }

  const session = sessions.get(sessionToken);

  if (!session) {
    return { valid: false, status: 401, message: "Invalid session token" };
  }

  if (session.status !== "ACTIVE") {
    return { valid: false, status: 403, message: `Session is ${session.status}` };
  }

  if (new Date(session.expiresAt) <= new Date()) {
    sessions.delete(sessionToken);
    return { valid: false, status: 401, message: "Session expired" };
  }

  return { valid: true, session };
}

export function revokeSession(sessionToken) {
  const session = sessions.get(sessionToken);
  if (!session) return false;

  session.status = "REVOKED";
  sessions.set(sessionToken, session);
  return true;
}
