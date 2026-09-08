import { buildHmacSignature, resolveSecret } from "./secretsService.js";

export async function buildAuthHeaders(auth = {}, { method, path, body } = {}) {
  const headers = {};

  if (!auth?.type || auth.type === "NONE") {
    return headers;
  }

  switch (auth.type) {
    case "API_KEY": {
      const secret = await resolveSecret(auth.apiKey?.secretRef);
      headers[auth.apiKey?.header || "X-API-Key"] = secret;
      break;
    }
    case "BEARER": {
      const token = await resolveSecret(auth.bearer?.tokenRef);
      headers.Authorization = `Bearer ${token}`;
      break;
    }
    case "BASIC": {
      const username = await resolveSecret(auth.basic?.usernameRef);
      const password = await resolveSecret(auth.basic?.passwordRef);
      headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
      break;
    }
    case "HMAC": {
      const secret = await resolveSecret(auth.hmac?.secretRef);
      const apiKeyHeader = auth.hmac?.apiKeyHeader || "X-API-Key";
      let apiKeyValue = null;

      if (auth.apiKey?.secretRef) {
        apiKeyValue = await resolveSecret(auth.apiKey.secretRef);
      }

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const rawBody = typeof body === "string" ? body : JSON.stringify(body ?? {});
      const payload = `${timestamp}\n${method.toUpperCase()}\n${path}\n${rawBody}`;
      const signature = buildHmacSignature(
        secret,
        payload,
        auth.hmac?.algorithm || "sha256"
      );

      if (apiKeyValue) {
        headers[auth.apiKey?.header || apiKeyHeader] = apiKeyValue;
      }
      headers[auth.hmac?.timestampHeader || "X-Timestamp"] = timestamp;
      headers[auth.hmac?.signatureHeader || "X-Signature"] = signature;
      break;
    }
    case "CUSTOM": {
      const customHeaders = auth.custom?.headers;
      if (customHeaders instanceof Map) {
        for (const [key, value] of customHeaders.entries()) {
          headers[key] = value;
        }
      } else if (customHeaders && typeof customHeaders === "object") {
        Object.assign(headers, customHeaders);
      }
      break;
    }
    default:
      break;
  }

  return headers;
}
