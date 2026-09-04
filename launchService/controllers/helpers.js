export function requireJson(req, res) {
  const contentType = req.headers["content-type"];
  if (!contentType?.includes("application/json")) {
    res.status(415).json({
      success: false,
      message: "Content-Type must be application/json",
    });
    return false;
  }
  return true;
}

export function getValidationInput(req, path) {
  const { operatorId, playerId, gameCode, currency } = req.body;

  return {
    operatorId,
    playerId,
    gameCode,
    currency,
    apiKey: req.headers["x-api-key"],
    timestamp: req.headers["x-timestamp"],
    signature: req.headers["x-signature"],
    method: "POST",
    path,
    rawBody: req.rawBody ?? JSON.stringify(req.body),
  };
}
