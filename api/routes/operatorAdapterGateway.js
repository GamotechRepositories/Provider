import { Router } from "express";
import axios from "axios";

const router = Router();

const OPERATOR_ADAPTER_SERVICE_URL =
  process.env.OPERATOR_ADAPTER_SERVICE_URL || "http://localhost:3005";

async function proxyToOperatorAdapter(req, res, path, method) {
  try {
    const config = {
      method,
      url: `${OPERATOR_ADAPTER_SERVICE_URL}/api/v1${path}`,
      headers: {
        "content-type": req.headers["content-type"],
        "x-game-server-key": req.headers["x-game-server-key"],
        authorization: req.headers.authorization,
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
      message: "Operator adapter service unavailable",
    });
  }
}

router.get("/integrations", (req, res) =>
  proxyToOperatorAdapter(req, res, "/integrations", "get")
);

router.get("/integrations/:operatorId", (req, res) =>
  proxyToOperatorAdapter(req, res, `/integrations/${req.params.operatorId}`, "get")
);

router.post("/integrations", (req, res) =>
  proxyToOperatorAdapter(req, res, "/integrations", "post")
);

router.put("/integrations/:operatorId", (req, res) =>
  proxyToOperatorAdapter(req, res, `/integrations/${req.params.operatorId}`, "put")
);

router.patch("/integrations/:operatorId/status", (req, res) =>
  proxyToOperatorAdapter(
    req,
    res,
    `/integrations/${req.params.operatorId}/status`,
    "patch"
  )
);

router.delete("/integrations/:operatorId", (req, res) =>
  proxyToOperatorAdapter(req, res, `/integrations/${req.params.operatorId}`, "delete")
);

router.get("/adapters/player-profile", (req, res) =>
  proxyToOperatorAdapter(req, res, "/adapters/player-profile", "get")
);

router.post("/adapters/player-profile", (req, res) =>
  proxyToOperatorAdapter(req, res, "/adapters/player-profile", "post")
);

router.get("/adapters/balance", (req, res) =>
  proxyToOperatorAdapter(req, res, "/adapters/balance", "get")
);

router.post("/adapters/balance", (req, res) =>
  proxyToOperatorAdapter(req, res, "/adapters/balance", "post")
);

router.post("/adapters/debit", (req, res) =>
  proxyToOperatorAdapter(req, res, "/adapters/debit", "post")
);

router.post("/adapters/credit", (req, res) =>
  proxyToOperatorAdapter(req, res, "/adapters/credit", "post")
);

export default router;
