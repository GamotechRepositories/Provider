import { fetchOperator } from "./operatorRepository.js";
import { fetchGameById } from "./gameRepository.js";

export async function getEnabledGames(operatorId) {
  const operator = await fetchOperator(operatorId);

  if (!operator) {
    return { found: false, operator: null, enabledGames: [] };
  }

  const enabledGameRefs = operator.enabledGames ?? [];

  const enabledGames = await Promise.all(
    enabledGameRefs.map(async (ref) => {
      try {
        const game = await fetchGameById(ref._id);
        return {
          _id: game._id,
          name: game.name,
          slug: game.slug,
          code: game.code,
          status: game.status,
          thumbnail: game.thumbnail,
          launchUrl: game.launchUrl,
          demoUrl: game.demoUrl,
          maintenanceMode: game.maintenanceMode,
        };
      } catch {
        return null;
      }
    })
  );

  return {
    found: true,
    operator: {
      operatorId: operator.operatorId,
      name: operator.name,
      slug: operator.slug,
    },
    enabledGames: enabledGames.filter(Boolean),
  };
}

export async function getEnabledGameByCode(operatorId, gameCode) {
  const { found, enabledGames } = await getEnabledGames(operatorId);

  if (!found) {
    return { found: false, game: null };
  }

  const game = enabledGames.find(
    (g) => g.code === gameCode || g.slug === gameCode
  );

  return { found: true, game: game ?? null };
}
