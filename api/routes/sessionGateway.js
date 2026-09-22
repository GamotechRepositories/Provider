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
        "x-admin-key": req.headers["x-admin-key"],
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

router.get("/admin/sessions/stats/by-operator", (req, res) =>
  proxyToSessionService(req, res, "/admin/sessions/stats/by-operator", "get")
);

router.get("/admin/sessions/stats/by-game", (req, res) =>
  proxyToSessionService(req, res, "/admin/sessions/stats/by-game", "get")
);

router.get("/admin/sessions/events/by-operator", (req, res) =>
  proxyToSessionService(req, res, "/admin/sessions/events/by-operator", "get")
);

router.get("/admin/sessions/events/by-game", (req, res) =>
  proxyToSessionService(req, res, "/admin/sessions/events/by-game", "get")
);

router.get("/admin/sessions", (req, res) =>
  proxyToSessionService(req, res, "/admin/sessions", "get")
);

router.get("/admin/sessions/track", (req, res) =>
  proxyToSessionService(req, res, "/admin/sessions/track", "get")
);

router.get("/admin/sessions/:sessionId", (req, res) =>
  proxyToSessionService(req, res, `/admin/sessions/${req.params.sessionId}`, "get")
);

export default router;
