import "dotenv/config";
import express from "express";
import cors from "cors";
import sessionRouter from "./routes/session.js";

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Session microservice is running" });
});

app.use("/api/v1", sessionRouter);

app.listen(PORT, () => {
  console.log(`Session service running on port ${PORT}`);
});
