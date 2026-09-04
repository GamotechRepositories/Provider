import axios from "axios";

const GAMES_BASE_URL =
  process.env.GAMES_BASE_URL ||
  `${process.env.OPERATOR_BASE_URL || "https://gamotech-games.onrender.com/api/v1"}/games`;

export async function fetchGameById(gameId) {
  const { data } = await axios.get(`${GAMES_BASE_URL}/${gameId}`);

  if (!data?.success || !data.game) {
    throw new Error("Invalid response from games API");
  }

  return data.game;
}

export async function fetchGameByCode(gameCode) {
  const { data } = await axios.get(GAMES_BASE_URL);

  if (!data?.success || !Array.isArray(data.games)) {
    throw new Error("Invalid response from games API");
  }

  return (
    data.games.find(
      (game) => game.code === gameCode || game.slug === gameCode
    ) ?? null
  );
}
