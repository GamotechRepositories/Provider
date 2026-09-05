import "dotenv/config";
import express from "express";
import cors from "cors";
import launchGateway from "./routes/launchGateway.js";
import enabledGamesGateway from "./routes/enabledGamesGateway.js";
import sessionGateway from "./routes/sessionGateway.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);

app.get("/", (_req, res) => {
  res.json({ success: true, message: "API Gateway is running" });
});

app.use("/api/v1", launchGateway);
app.use("/api/v1", enabledGamesGateway);
app.use("/api/v1", sessionGateway);

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
