export function buildLaunchUrl({ operator, game, playerId }) {
  if (!game.launchUrl) {
    throw new Error(`launchUrl not configured for game: ${game.code}`);
  }

  const url = new URL(game.launchUrl);

  url.searchParams.set("operatorId", operator.operatorId);
  url.searchParams.set("playerId", playerId);
  url.searchParams.set("gameCode", game.code);
  url.searchParams.set("currency", operator.currency);
  url.searchParams.set("language", operator.language);
  url.searchParams.set("timezone", operator.timezone);

  return url.toString();
}
