import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { getCorsOptions } from "./config/cors.js";
import operatorIntegrationRouter from "./routes/operatorIntegration.js";
import adapterRouter from "./routes/adapter.js";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors(getCorsOptions()));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Operator Adapter service is running" });
});

app.use("/api/v1", operatorIntegrationRouter);
app.use("/api/v1", adapterRouter);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Operator Adapter service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });
