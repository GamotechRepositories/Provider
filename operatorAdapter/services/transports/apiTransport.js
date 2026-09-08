import axios from "axios";
import { joinUrl, resolvePath } from "../../utils/pathResolver.js";
import { buildAuthHeaders } from "../authService.js";

export async function executeApiOperation({
  integration,
  operation,
  transport,
  payload,
  pathParams,
}) {
  const baseUrl = transport.api.baseUrl;
  const resolvedPath = resolvePath(operation.path, pathParams);
  const url = joinUrl(baseUrl, resolvedPath);
  const method = (operation.method || "POST").toLowerCase();
  const timeout = operation.timeoutMs ?? transport.api.timeoutMs ?? 10000;

  const body =
    method === "get" || method === "delete" ? undefined : payload ?? {};
  const authHeaders = await buildAuthHeaders(integration.auth, {
    method: operation.method || "POST",
    path: resolvedPath,
    body,
  });

  const { data, status } = await axios({
    method,
    url,
    params: method === "get" ? payload : undefined,
    data: body,
    headers: {
      "Content-Type": operation.contentType || "application/json",
      ...authHeaders,
    },
    timeout,
    validateStatus: () => true,
  });

  if (status >= 400) {
    return {
      ok: false,
      status,
      message:
        data?.message ||
        data?.error ||
        `Operator API returned ${status}`,
      data,
    };
  }

  return { ok: true, status, data };
}
