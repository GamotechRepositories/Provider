import "dotenv/config";
import express from "express";
import cors from "cors";
import enabledGamesRouter from "./routes/enabledGames.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Enabled games microservice is running" });
});

app.use("/api/v1", enabledGamesRouter);

app.listen(PORT, () => {
  console.log(`Enabled games service running on port ${PORT}`);
});
