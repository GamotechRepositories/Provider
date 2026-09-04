import "dotenv/config";
import express from "express";
import launchRouter from "./routes/launch.js";
import validateOperatorRouter from "./routes/validateOperator.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Launch microservice is running" });
});

app.use("/", launchRouter);
app.use("/", validateOperatorRouter);

app.listen(PORT, () => {
  console.log(`Launch service running on port ${PORT}`);
});
