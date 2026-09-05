export function buildLaunchUrl({ game, sessionToken }) {
  if (!game.launchUrl) {
    throw new Error(`launchUrl not configured for game: ${game.code}`);
  }

  if (!sessionToken) {
    throw new Error("sessionToken is required to build launch URL");
  }

  const url = new URL(game.launchUrl);
  url.searchParams.set("sessionToken", sessionToken);

  return url.toString();
}
