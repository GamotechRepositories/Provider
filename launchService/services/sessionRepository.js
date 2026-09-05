import axios from "axios";

const SESSION_SERVICE_URL =
  process.env.SESSION_SERVICE_URL;

export async function createSession({
  operatorId,
  playerId,
  gameCode,
  currency,
  language,
  timezone,
  sessionTimeout,
}) {
  const { data } = await axios.post(`${SESSION_SERVICE_URL}/api/v1/sessions`, {
    operatorId,
    playerId,
    gameCode,
    currency,
    language,
    timezone,
    sessionTimeout,
  });

  if (!data?.success || !data.sessionToken) {
    throw new Error("Failed to create session");
  }

  return data;
}
