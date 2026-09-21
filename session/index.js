import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import sessionRouter from "./routes/session.js";
import adminSessionRouter from "./routes/adminSession.js";

const app = express();
const PORT = process.env.PORT || 3004;

if (!process.env.ADMIN_API_KEY) {
  console.warn(
    "WARNING: ADMIN_API_KEY is not set — admin session endpoints will return 503"
  );
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Session microservice is running" });
});

app.use("/api/v1", sessionRouter);
app.use("/api/v1/admin", adminSessionRouter);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Session service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });
