export function buildLaunchUrl({ operator, game, playerId }) {
  const baseUrl = process.env.GAME_LAUNCH_BASE_URL;
  if (!baseUrl) {
    throw new Error("GAME_LAUNCH_BASE_URL is not configured");
  }

  const url = new URL(`${baseUrl.replace(/\/$/, "")}/${game.slug}`);
  url.searchParams.set("operatorId", operator.operatorId);
  url.searchParams.set("playerId", playerId);
  url.searchParams.set("gameCode", game.code);
  url.searchParams.set("currency", operator.currency);
  url.searchParams.set("lang", operator.language);

  return url.toString();
}
