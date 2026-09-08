import mongoose from "mongoose";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const transportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["API", "RABBITMQ", "KAFKA"],
      required: true,
    },
    api: {
      baseUrl: String,
      timeoutMs: { type: Number, default: 10000 },
    },
    rabbitmq: {
      url: String,
      exchange: String,
      queue: String,
      routingKey: String,
      durable: { type: Boolean, default: true },
      prefetch: { type: Number, default: 1 },
    },
    kafka: {
      brokers: [String],
      topic: String,
      clientId: String,
      groupId: String,
      acks: { type: String, default: "all" },
      partition: Number,
    },
  },
  { _id: false }
);

const authSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["NONE", "API_KEY", "BEARER", "BASIC", "HMAC", "CUSTOM"],
      default: "NONE",
    },
    apiKey: {
      header: { type: String, default: "X-API-Key" },
      secretRef: String,
    },
    bearer: {
      tokenRef: String,
    },
    basic: {
      usernameRef: String,
      passwordRef: String,
    },
    hmac: {
      apiKeyHeader: { type: String, default: "X-API-Key" },
      timestampHeader: { type: String, default: "X-Timestamp" },
      signatureHeader: { type: String, default: "X-Signature" },
      secretRef: String,
      algorithm: { type: String, default: "sha256" },
    },
    custom: {
      headers: {
        type: Map,
        of: String,
        default: undefined,
      },
    },
  },
  { _id: false }
);

const operationSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    method: { type: String, enum: HTTP_METHODS, default: "POST" },
    path: String,
    contentType: { type: String, default: "application/json" },
    requestMapping: mongoose.Schema.Types.Mixed,
    responseMapping: mongoose.Schema.Types.Mixed,
    timeoutMs: { type: Number, default: 10000 },
    transport: transportSchema,
  },
  { _id: false }
);

const capabilitiesSchema = new mongoose.Schema(
  {
    supportsPlayerProfile: { type: Boolean, default: false },
    supportsBalance: { type: Boolean, default: false },
    supportsDebit: { type: Boolean, default: false },
    supportsCredit: { type: Boolean, default: false },
    asyncCredit: { type: Boolean, default: false },
    idempotentDebit: { type: Boolean, default: false },
    idempotentCredit: { type: Boolean, default: false },
  },
  { _id: false }
);

const operatorIntegrationSchema = new mongoose.Schema(
  {
    operatorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    adapter: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
      default: "INACTIVE",
    },
    environment: {
      type: String,
      enum: ["SANDBOX", "PRODUCTION"],
      default: "SANDBOX",
    },
    transport: {
      type: transportSchema,
      required: true,
    },
    auth: {
      type: authSchema,
      default: () => ({ type: "NONE" }),
    },
    operations: {
      playerProfile: operationSchema,
      balance: operationSchema,
      debit: operationSchema,
      credit: operationSchema,
    },
    capabilities: {
      type: capabilitiesSchema,
      default: () => ({}),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("OperatorIntegration", operatorIntegrationSchema);
