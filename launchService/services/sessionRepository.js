import axios from "axios";

const SESSION_SERVICE_URL =
  process.env.SESSION_SERVICE_URL || "http://localhost:3004";

export async function createSession({
  operatorId,
  playerId,
  playerUsername,
  gameCode,
  currency,
  language,
  timezone,
  sessionTimeout,
}) {
  try {
    const { data, status } = await axios.post(
      `${SESSION_SERVICE_URL}/api/v1/sessions`,
      {
        operatorId,
        playerId,
        playerUsername,
        gameCode,
        currency,
        language,
        timezone,
        sessionTimeout,
      },
      {
        timeout: 10000,
        validateStatus: () => true,
      }
    );

    if (!data?.success || !data.sessionToken) {
      const message =
        typeof data === "string" || status === 502
          ? "Session service is down (502). Start the session microservice on the server."
          : data?.message || `Session service error (${status})`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      throw new Error(
        "Session service is unreachable. Check SESSION_SERVICE_URL is configured."
      );
    }

    throw error;
  }
}
