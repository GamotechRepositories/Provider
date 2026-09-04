import { Router } from "express";
import axios from "axios";
const router = Router();
const LAUNCH_SERVICE_URL =
  process.env.LAUNCH_SERVICE_URL;

async function proxyToLaunchService(req, res, servicePath) {
  try {
    const { data, status } = await axios.post(
      `${LAUNCH_SERVICE_URL}${servicePath}`,
      req.rawBody ?? JSON.stringify(req.body),
      {
        headers: {
          "content-type": req.headers["content-type"],
          "x-api-key": req.headers["x-api-key"],
          "x-timestamp": req.headers["x-timestamp"],
          "x-signature": req.headers["x-signature"],
        },
        transformRequest: [(body) => body],
        validateStatus: () => true,
      }
    );

    return res.status(status).json(data);
  } catch {
    return res.status(502).json({
      success: false,
      message: "Launch service unavailable",
    });
  }
}

router.post("/launch", (req, res) => proxyToLaunchService(req, res, "/launch"));

router.post("/validate-operator", (req, res) =>
  proxyToLaunchService(req, res, "/validate-operator")
);

export default router;
