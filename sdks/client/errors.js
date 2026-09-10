export class ProviderSDKError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = "ProviderSDKError";
    this.status = status ?? null;
    this.code = code ?? null;
    this.data = data ?? null;
  }
}
