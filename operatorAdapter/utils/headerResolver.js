import { resolveSecret } from "../services/secretsService.js";

async function resolveScalarHeaderValue(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value !== "string") {
    return "";
  }

  if (value.startsWith("env:") || value.includes("/")) {
    return resolveSecret(value);
  }

  return value;
}

async function resolveHeaderEntryValue(entry) {
  if (entry === null || entry === undefined) return "";

  if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
    return resolveScalarHeaderValue(entry);
  }

  if (typeof entry !== "object" || Array.isArray(entry)) {
    return "";
  }

  if (entry.valueRef) {
    const resolved = await resolveSecret(entry.valueRef);
    return `${entry.prefix ?? ""}${resolved}${entry.suffix ?? ""}`;
  }

  if (entry.value !== undefined) {
    const resolved = await resolveScalarHeaderValue(entry.value);
    return `${entry.prefix ?? ""}${resolved}${entry.suffix ?? ""}`;
  }

  return "";
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeHeaderConfig(headerConfig) {
  if (headerConfig instanceof Map) {
    return Object.fromEntries(headerConfig.entries());
  }

  return headerConfig;
}

export async function buildConfiguredHeaders(headerConfig) {
  if (!headerConfig) return {};

  const headers = {};
  headerConfig = normalizeHeaderConfig(headerConfig);

  if (Array.isArray(headerConfig)) {
    for (const item of headerConfig) {
      if (!isPlainObject(item)) continue;

      if (item.name) {
        const resolved = await resolveHeaderEntryValue(item);
        if (resolved !== "") {
          headers[item.name] = resolved;
        }
        continue;
      }

      for (const [key, value] of Object.entries(item)) {
        const resolved = await resolveHeaderEntryValue(value);
        if (resolved !== "") {
          headers[key] = resolved;
        }
      }
    }

    return headers;
  }

  if (isPlainObject(headerConfig)) {
    for (const [key, value] of Object.entries(headerConfig)) {
      const resolved = await resolveHeaderEntryValue(value);
      if (resolved !== "") {
        headers[key] = resolved;
      }
    }
  }

  return headers;
}
