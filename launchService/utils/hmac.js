import crypto from "crypto";

export function buildSignaturePayload({ timestamp, method, path, rawBody }) {
  return `${timestamp}\n${method.toUpperCase()}\n${path}\n${rawBody}`;
}

export function generateHmacSignature(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyHmacSignature(secret, payload, signature) {
  if (!signature) return false;

  const expected = generateHmacSignature(secret, payload);
  const received = signature.trim().toLowerCase();

  if (expected.length !== received.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}

export function isTimestampValid(timestamp, toleranceSeconds = 300) {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) <= toleranceSeconds;
}
