import { getEnabledGames } from "../services/enabledGamesService.js";

export async function getOperatorEnabledGames(req, res) {
  const { operatorId } = req.query;

  if (!operatorId) {
    return res.status(400).json({
      success: false,
      message: "operatorId query parameter is required",
    });
  }

  try {
    const result = await getEnabledGames(operatorId);

    if (!result.found) {
      return res.status(404).json({
        success: false,
        message: "Operator not found",
      });
    }

    return res.status(200).json({
      success: true,
      operatorId,
      operatorName: result.operator.name,
      count: result.enabledGames.length,
      enabledGames: result.enabledGames,
    });
  } catch {
    return res.status(502).json({
      success: false,
      message: "Unable to fetch enabled games",
    });
  }
}
