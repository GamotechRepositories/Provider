import { mapRequest } from "./requestMapper.js";

function interpolateValue(value, context) {
  if (typeof value !== "string") return value;

  return value.replace(/\{(\w+)\}/g, (_, key) => {
    if (context[key] !== undefined && context[key] !== null) {
      return context[key];
    }
    return `{${key}}`;
  });
}

function interpolateObject(value, context) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => interpolateObject(item, context));
  }

  if (typeof value !== "object") {
    return interpolateValue(value, context);
  }

  const result = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    result[key] = interpolateObject(nestedValue, context);
  }
  return result;
}

export function buildOperationPayload(input = {}, operation = {}, context = {}) {
  const payloadConfig = operation.payload;
  const mapping = payloadConfig?.mapping ?? operation.requestMapping;
  const ctx = { ...context, ...input };

  if (!payloadConfig && !operation.requestMapping) {
    return input;
  }

  let payload = {};

  if (payloadConfig?.static) {
    payload = { ...payloadConfig.static };
  }

  if (payloadConfig?.template) {
    payload = {
      ...payload,
      ...interpolateObject(payloadConfig.template, ctx),
    };
  }

  const mapped = mapRequest(input, mapping);
  payload = { ...payload, ...mapped };

  if (!payloadConfig?.template && !payloadConfig?.static && mapping) {
    return mapped;
  }

  return payload;
}
