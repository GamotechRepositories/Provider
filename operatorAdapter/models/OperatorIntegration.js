import mongoose from "mongoose";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const AUTH_TYPES = ["NONE", "API_KEY", "BEARER", "BASIC", "HMAC", "CUSTOM"];

const transportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["API", "RABBITMQ", "KAFKA"],
      required: true,
    },
    api: {
      baseUrl: String,
      timeoutMs: { type: Number, min: 100, max: 60000, default: 10000 },
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
      enum: AUTH_TYPES,
      default: "NONE",
    },
    headers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
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

const payloadSchema = new mongoose.Schema(
  {
    static: mongoose.Schema.Types.Mixed,
    mapping: mongoose.Schema.Types.Mixed,
    template: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const operationSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    method: { type: String, enum: HTTP_METHODS, default: "POST" },
    path: String,
    contentType: { type: String, default: "application/json" },
    auth: authSchema,
    headers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    payload: payloadSchema,
    requestMapping: mongoose.Schema.Types.Mixed,
    responseMapping: mongoose.Schema.Types.Mixed,
    timeoutMs: { type: Number, min: 100, max: 60000, default: 10000 },
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
      type: Map,
      of: operationSchema,
      default: () => ({}),
    },
    capabilities: {
      type: capabilitiesSchema,
      default: () => ({}),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    publishedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

operatorIntegrationSchema.index({ status: 1, environment: 1 });

export default mongoose.model("OperatorIntegration", operatorIntegrationSchema);
