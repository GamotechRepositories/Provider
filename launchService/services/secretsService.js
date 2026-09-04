import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { fetchOperator } from "./operatorRepository.js";

const secretsCache = new Map();

function extractSecretValue(raw) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed.apiSecret ?? parsed.secret ?? parsed.value ?? raw;
  } catch {
    return raw;
  }
}

async function fetchSecretFromAws(apiSecretPath) {
  if (secretsCache.has(apiSecretPath)) {
    return secretsCache.get(apiSecretPath);
  }

  const region = process.env.AWS_REGION || "ap-south-1";
  const client = new SecretsManagerClient({ region });

  const { SecretString, SecretBinary } = await client.send(
    new GetSecretValueCommand({ SecretId: apiSecretPath })
  );

  const raw = SecretString ?? Buffer.from(SecretBinary).toString("utf-8");
  const secret = extractSecretValue(raw);

  if (!secret) {
    throw new Error(`Secret not found at path: ${apiSecretPath}`);
  }

  secretsCache.set(apiSecretPath, secret);
  return secret;
}

async function resolveApiSecretPath(operatorId, operatorRecord) {
  const operator = operatorRecord ?? (await fetchOperator(operatorId));

  if (!operator?.apiSecretPath) {
    throw new Error(`apiSecretPath not found for operator: ${operatorId}`);
  }

  return operator.apiSecretPath;
}

export async function getOperatorSecret(operatorId, operatorRecord) {
  const apiSecretPath = await resolveApiSecretPath(operatorId, operatorRecord);
  return fetchSecretFromAws(apiSecretPath);
}
