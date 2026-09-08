import crypto from "crypto";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsCache = new Map();

function extractSecretValue(raw) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return (
      parsed.apiSecret ??
      parsed.secret ??
      parsed.token ??
      parsed.password ??
      parsed.value ??
      raw
    );
  } catch {
    return raw;
  }
}

async function fetchSecretFromAws(secretRef) {
  if (secretsCache.has(secretRef)) {
    return secretsCache.get(secretRef);
  }

  const region = process.env.AWS_REGION || "ap-south-1";
  const client = new SecretsManagerClient({ region });

  const { SecretString, SecretBinary } = await client.send(
    new GetSecretValueCommand({ SecretId: secretRef })
  );

  const raw = SecretString ?? Buffer.from(SecretBinary).toString("utf-8");
  const secret = extractSecretValue(raw);

  if (!secret) {
    throw new Error(`Secret not found at path: ${secretRef}`);
  }

  secretsCache.set(secretRef, secret);
  return secret;
}

export async function resolveSecret(secretRef) {
  if (!secretRef) return null;

  if (secretRef.startsWith("env:")) {
    const value = process.env[secretRef.slice(4)];
    if (!value) {
      throw new Error(`Environment secret not configured: ${secretRef}`);
    }
    return value;
  }

  return fetchSecretFromAws(secretRef);
}

export function buildHmacSignature(secret, payload, algorithm = "sha256") {
  return crypto.createHmac(algorithm, secret).update(payload).digest("hex");
}
