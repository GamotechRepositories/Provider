import "dotenv/config";
import express from "express";
import cors from "cors";
import launchRouter from "./routes/launch.js";
import validateOperatorRouter from "./routes/validateOperator.js";

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
  res.json({ success: true, message: "Launch microservice is running" });
});

app.use("/api/v1", launchRouter);
app.use("/api/v1", validateOperatorRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
