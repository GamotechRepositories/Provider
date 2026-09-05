import { Router } from "express";
import axios from "axios";

const router = Router();

const SESSION_SERVICE_URL =
  process.env.SESSION_SERVICE_URL;

router.post("/sessions/validate", async (req, res) => {
  try {
    const { data, status } = await axios.post(
      `${SESSION_SERVICE_URL}/api/v1/sessions/validate`,
      req.body,
      {
        headers: {
          authorization: req.headers.authorization,
          "content-type": req.headers["content-type"],
        },
        validateStatus: () => true,
      }
    );

    return res.status(status).json(data);
  } catch {
    return res.status(502).json({
      success: false,
      message: "Session service unavailable",
    });
  }
});

export default router;
