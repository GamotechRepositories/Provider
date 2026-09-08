import { executeOperatorOperation } from "../services/adapterExecutor.js";

async function runOperation(req, res, operationName, requiredFields = []) {
  const { operatorId } = req.params;
  const input = { ...req.query, ...req.body };

  for (const field of requiredFields) {
    if (!input[field]) {
      return res.status(400).json({
        success: false,
        message: `${field} is required`,
      });
    }
  }

  try {
    const result = await executeOperatorOperation(operatorId, operationName, input);

    if (!result.valid) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        operatorResponse: result.operatorResponse ?? undefined,
      });
    }

    return res.status(result.status).json({
      success: true,
      message: result.async ? "Operation queued" : "Operation completed",
      transport: result.transport,
      async: result.async,
      data: result.data,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to execute operator operation",
    });
  }
}

export function getPlayerProfileHandler(req, res) {
  return runOperation(req, res, "playerProfile", ["playerId"]);
}

export function getBalanceHandler(req, res) {
  return runOperation(req, res, "balance", ["playerId"]);
}

export function debitHandler(req, res) {
  return runOperation(req, res, "debit", ["playerId", "amount", "transactionId"]);
}

export function creditHandler(req, res) {
  return runOperation(req, res, "credit", ["playerId", "amount", "transactionId"]);
}
