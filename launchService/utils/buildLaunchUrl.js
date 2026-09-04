export function buildLaunchUrl({ operator, game, playerId }) {
  const baseUrl = (
    process.env.GAME_LAUNCH_BASE_URL || "https://provider-v2of.onrender.com"
  ).replace(/\/$/, "");

  const params = new URLSearchParams({
    operatorId: operator.operatorId,
    playerId,
    gameCode: game.code,
    currency: operator.currency,
    language: operator.language,
    timezone: operator.timezone,
  });

  return `${baseUrl}/launch?${params.toString()}`;
}
