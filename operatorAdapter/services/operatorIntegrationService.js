import OperatorIntegration from "../models/OperatorIntegration.js";

const TRANSPORT_REQUIREMENTS = {
  API: (transport) => {
    if (!transport?.api?.baseUrl) {
      return "transport.api.baseUrl is required when transport.type is API";
    }
    return null;
  },
  RABBITMQ: (transport) => {
    if (!transport?.rabbitmq?.url) {
      return "transport.rabbitmq.url is required when transport.type is RABBITMQ";
    }
    return null;
  },
  KAFKA: (transport) => {
    if (!transport?.kafka?.brokers?.length) {
      return "transport.kafka.brokers is required when transport.type is KAFKA";
    }
    if (!transport?.kafka?.topic) {
      return "transport.kafka.topic is required when transport.type is KAFKA";
    }
    return null;
  },
};

function validateTransport(transport, label = "transport") {
  if (!transport?.type) {
    return `${label}.type is required (API, RABBITMQ, or KAFKA)`;
  }

  const validator = TRANSPORT_REQUIREMENTS[transport.type];
  if (!validator) {
    return `${label}.type must be API, RABBITMQ, or KAFKA`;
  }

  return validator(transport);
}

function validateOperation(operation, name, defaultTransport) {
  if (!operation) return null;

  const transport = operation.transport ?? defaultTransport;
  if (operation.enabled !== false && transport) {
    const error = validateTransport(transport, `operations.${name}.transport`);
    if (error) return error;
  }

  if (operation.enabled !== false && transport?.type === "API" && !operation.path) {
    return `operations.${name}.path is required for API-based operations`;
  }

  return null;
}

export function validateIntegrationPayload(payload, { partial = false } = {}) {
  if (!partial) {
    if (!payload.operatorId) return "operatorId is required";
    if (!payload.name) return "name is required";
    if (!payload.adapter) return "adapter is required";
    if (!payload.transport) return "transport is required";
  }

  if (payload.transport) {
    const transportError = validateTransport(payload.transport);
    if (transportError) return transportError;
  }

  if (payload.operations) {
    const defaultTransport = payload.transport;
    for (const opName of ["playerProfile", "balance", "debit", "credit"]) {
      const error = validateOperation(
        payload.operations[opName],
        opName,
        defaultTransport
      );
      if (error) return error;
    }
  }

  return null;
}

function formatIntegration(doc) {
  const integration = doc.toObject ? doc.toObject() : doc;
  return {
    ...integration,
    _id: integration._id?.toString(),
  };
}

export async function listIntegrations({ status, environment } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (environment) filter.environment = environment;

  const integrations = await OperatorIntegration.find(filter).sort({
    createdAt: -1,
  });

  return integrations.map(formatIntegration);
}

export async function getIntegrationByOperatorId(operatorId) {
  const integration = await OperatorIntegration.findOne({ operatorId });
  if (!integration) return null;
  return formatIntegration(integration);
}

export async function createIntegration(payload) {
  const validationError = validateIntegrationPayload(payload);
  if (validationError) {
    return { valid: false, status: 400, message: validationError };
  }

  const existing = await OperatorIntegration.findOne({
    operatorId: payload.operatorId,
  });

  if (existing) {
    return {
      valid: false,
      status: 409,
      message: `Integration already exists for operatorId: ${payload.operatorId}`,
    };
  }

  const integration = await OperatorIntegration.create(payload);
  return { valid: true, integration: formatIntegration(integration) };
}

export async function updateIntegration(operatorId, payload) {
  const integration = await OperatorIntegration.findOne({ operatorId });

  if (!integration) {
    return { valid: false, status: 404, message: "Integration not found" };
  }

  const merged = {
    operatorId: integration.operatorId,
    name: payload.name ?? integration.name,
    adapter: payload.adapter ?? integration.adapter,
    status: payload.status ?? integration.status,
    environment: payload.environment ?? integration.environment,
    transport: payload.transport ?? integration.transport,
    auth: payload.auth ?? integration.auth,
    operations: payload.operations ?? integration.operations,
    capabilities: payload.capabilities ?? integration.capabilities,
    metadata: payload.metadata ?? integration.metadata,
  };

  const validationError = validateIntegrationPayload(merged);
  if (validationError) {
    return { valid: false, status: 400, message: validationError };
  }

  Object.assign(integration, payload);
  await integration.save();

  return { valid: true, integration: formatIntegration(integration) };
}

export async function updateIntegrationStatus(operatorId, status) {
  if (!["ACTIVE", "INACTIVE", "MAINTENANCE"].includes(status)) {
    return {
      valid: false,
      status: 400,
      message: "status must be ACTIVE, INACTIVE, or MAINTENANCE",
    };
  }

  const integration = await OperatorIntegration.findOneAndUpdate(
    { operatorId },
    { status },
    { new: true }
  );

  if (!integration) {
    return { valid: false, status: 404, message: "Integration not found" };
  }

  return { valid: true, integration: formatIntegration(integration) };
}

export async function deleteIntegration(operatorId) {
  const integration = await OperatorIntegration.findOneAndDelete({ operatorId });

  if (!integration) {
    return { valid: false, status: 404, message: "Integration not found" };
  }

  return { valid: true };
}
