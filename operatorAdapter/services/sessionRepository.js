import axios from "axios";

const SESSION_SERVICE_URL =
  process.env.SESSION_SERVICE_URL || "http://localhost:3004";

export async function validateSession(sessionToken) {
  if (!sessionToken) {
    return { valid: false, status: 401, message: "sessionToken is required" };
  }

  try {
    const { data, status } = await axios.post(
      `${SESSION_SERVICE_URL}/api/v1/sessions/validate`,
      { sessionToken },
      { timeout: 10000, validateStatus: () => true }
    );

    if (!data?.success || !data.session) {
      return {
        valid: false,
        status: status === 404 ? 404 : status === 403 ? 403 : 401,
        message: data?.message || "Invalid session",
      };
    }

    return { valid: true, session: data.session };
  } catch {
    return {
      valid: false,
      status: 502,
      message: "Session service unavailable",
    };
  }
}
