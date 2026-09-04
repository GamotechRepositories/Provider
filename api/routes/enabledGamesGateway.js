import { Router } from "express";
import axios from "axios";

const router = Router();

const ENABLED_GAMES_SERVICE_URL =
  process.env.ENABLED_GAMES_SERVICE_URL || "http://localhost:3002";

router.get("/enabled-games", async (req, res) => {
  const { operatorId } = req.query;

  if (!operatorId) {
    return res.status(400).json({
      success: false,
      message: "operatorId query parameter is required",
    });
  }

  try {
    const { data, status } = await axios.get(
      `${ENABLED_GAMES_SERVICE_URL}/api/v1/enabled-games`,
      {
        params: { operatorId },
        validateStatus: () => true,
      }
    );

    return res.status(status).json(data);
  } catch {
    return res.status(502).json({
      success: false,
      message: "Enabled games service unavailable",
    });
  }
});

export default router;
