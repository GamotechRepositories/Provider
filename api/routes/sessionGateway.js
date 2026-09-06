import { Router } from "express";
import axios from "axios";

const router = Router();

const SESSION_SERVICE_URL =
  process.env.SESSION_SERVICE_URL || "http://localhost:3004";

async function proxyToSessionService(req, res, path, method = "get") {
  try {
    const config = {
      method,
      url: `${SESSION_SERVICE_URL}/api/v1${path}`,
      headers: {
        authorization: req.headers.authorization,
        "content-type": req.headers["content-type"],
      },
      validateStatus: () => true,
    };

    if (method === "get") {
      config.params = req.query;
    } else {
      config.data = req.body;
    }

    const { data, status } = await axios(config);
    return res.status(status).json(data);
  } catch {
    return res.status(502).json({
      success: false,
      message: "Session service unavailable",
    });
  }
}

router.post("/sessions/validate", (req, res) =>
  proxyToSessionService(req, res, "/sessions/validate", "post")
);

router.post("/sessions/events", (req, res) =>
  proxyToSessionService(req, res, "/sessions/events", "post")
);

router.get("/sessions/track", (req, res) =>
  proxyToSessionService(req, res, "/sessions/track", "get")
);

export default router;
