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
      enum: ["ACTIVE", "ENDED", "REVOKED"],
      default: "ACTIVE",
    },
    gameContext: {
      tableId: { type: String, default: null },
      currentRoundId: { type: String, default: null },
    },
    lastEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SessionEvent",
      default: null,
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
