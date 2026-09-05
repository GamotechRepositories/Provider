import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    operatorId: { type: String, required: true },
    playerId: { type: String, required: true },
    gameCode: { type: String, required: true },
    currency: { type: String, required: true },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED"],
      default: "ACTIVE",
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
