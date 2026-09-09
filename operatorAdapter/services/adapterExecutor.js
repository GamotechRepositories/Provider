import { getIntegrationByOperatorId } from "./operatorIntegrationService.js";
import { mapResponse } from "../utils/requestMapper.js";
import { buildOperationPayload } from "../utils/payloadBuilder.js";
import { executeApiOperation } from "./transports/apiTransport.js";
import { executeRabbitmqOperation } from "./transports/rabbitmqTransport.js";
import { executeKafkaOperation } from "./transports/kafkaTransport.js";

const OPERATION_CAPABILITY_MAP = {
  playerProfile: "supportsPlayerProfile",
  balance: "supportsBalance",
  debit: "supportsDebit",
  credit: "supportsCredit",
};

function resolveTransport(integration, operation) {
  return operation?.transport ?? integration.transport;
}

async function dispatchOperation({
  transport,
  integration,
  operation,
  operationName,
  payload,
  pathParams,
}) {
  switch (transport.type) {
    case "API":
      return executeApiOperation({
        integration,
        operation,
        transport,
        payload,
        pathParams,
      });
    case "RABBITMQ":
      return executeRabbitmqOperation({ transport, payload });
    case "KAFKA":
      return executeKafkaOperation({ transport, payload, operationName });
    default:
      return {
        ok: false,
        status: 400,
        message: `Unsupported transport type: ${transport.type}`,
      };
  }
}

export async function executeOperatorOperation(operatorId, operationName, input = {}) {
  const integration = await getIntegrationByOperatorId(operatorId);

  if (!integration) {
    return { valid: false, status: 404, message: "Integration not found" };
  }

  if (integration.status !== "ACTIVE") {
    return {
      valid: false,
      status: 403,
      message: `Integration is ${integration.status}`,
    };
  }

  const operation = integration.operations?.[operationName];

  if (!operation || operation.enabled === false) {
    return {
      valid: false,
      status: 404,
      message: `Operation ${operationName} is not configured or disabled`,
    };
  }

  const capabilityKey = OPERATION_CAPABILITY_MAP[operationName];
  if (capabilityKey && integration.capabilities?.[capabilityKey] === false) {
    return {
      valid: false,
      status: 403,
      message: `Operation ${operationName} is not supported for this operator`,
    };
  }

  const transport = resolveTransport(integration, operation);

  const pathParams = {
    operatorId,
    playerId: input.playerId,
    playerUsername: input.playerUsername,
    gameCode: input.gameCode,
    transactionId: input.transactionId,
  };

  const mappedPayload = buildOperationPayload(input, operation, pathParams);

  try {
    const result = await dispatchOperation({
      transport,
      integration,
      operation,
      operationName,
      payload: mappedPayload,
      pathParams,
    });

    if (!result.ok) {
      return {
        valid: false,
        status: result.status,
        message: result.message,
        operatorResponse: result.data ?? null,
      };
    }

    const mappedData = mapResponse(result.data, operation.responseMapping);

    return {
      valid: true,
      status: result.status,
      async: transport.type !== "API",
      transport: transport.type,
      data: mappedData,
    };
  } catch (error) {
    return {
      valid: false,
      status: 502,
      message: error.message || "Unable to execute operator operation",
    };
  }
}
