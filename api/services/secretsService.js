import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsCache = new Map();

function getLocalSecrets() {
  try {
    return JSON.parse(process.env.SECRETS_LOCAL || "{}");
  } catch {
    return {};
  }
}

function extractSecretValue(raw) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed.apiSecret ?? parsed.secret ?? parsed.value ?? raw;
  } catch {
    return raw;
  }
}

export async function getOperatorSecret(apiSecretPath) {
  if (!apiSecretPath) {
    throw new Error("apiSecretPath is required");
  }

  if (secretsCache.has(apiSecretPath)) {
    return secretsCache.get(apiSecretPath);
  }

  const localSecrets = getLocalSecrets();
  if (localSecrets[apiSecretPath]) {
    const secret = localSecrets[apiSecretPath];
    secretsCache.set(apiSecretPath, secret);
    return secret;
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
