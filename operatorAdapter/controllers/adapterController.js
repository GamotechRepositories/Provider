import { executeOperatorOperation } from "../services/adapterExecutor.js";
import { resolveWalletContext } from "../services/walletGuard.js";

async function runWalletOperation(req, res, operationName, requiredFields = []) {
  const { operatorId } = req.params;

  try {
    const context = await resolveWalletContext(req, operatorId);

    if (!context.valid) {
      return res.status(context.status).json({
        success: false,
        message: context.message,
      });
    }

    for (const field of requiredFields) {
      if (
        context.input[field] === undefined ||
        context.input[field] === null ||
        context.input[field] === ""
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    const result = await executeOperatorOperation(
      operatorId,
      operationName,
      context.input
    );

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
  return runWalletOperation(req, res, "playerProfile");
}

export function getBalanceHandler(req, res) {
  return runWalletOperation(req, res, "balance");
}

export function debitHandler(req, res) {
  return runWalletOperation(req, res, "debit", ["amount", "transactionId"]);
}

export function creditHandler(req, res) {
  return runWalletOperation(req, res, "credit", ["amount", "transactionId"]);
}
