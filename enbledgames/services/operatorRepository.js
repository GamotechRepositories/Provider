import axios from "axios";

const OPERATOR_BASE_URL =
  process.env.OPERATOR_BASE_URL || "https://gamotech-games.onrender.com/api/v1";

export async function fetchOperator(operatorId) {
  const { data } = await axios.get(`${OPERATOR_BASE_URL}/operators`, {
    params: { operatorId },
  });

  if (!data?.success || !Array.isArray(data.operators)) {
    throw new Error("Invalid response from operators API");
  }

  return data.operators.find((op) => op.operatorId === operatorId) ?? null;
}
