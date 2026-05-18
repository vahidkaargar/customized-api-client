import type { InternalAxiosRequestConfig } from 'axios';

const JSON_API = 'application/vnd.api+json';

export function applyJsonApiHeaders(
  config: InternalAxiosRequestConfig,
  method: string,
): InternalAxiosRequestConfig {
  const m = method.toUpperCase();
  const headers = { ...(config.headers as Record<string, string> | undefined) };
  headers.Accept = headers.Accept ?? JSON_API;
  if (shouldSetJsonApiContentType(m, config)) {
    headers['Content-Type'] = headers['Content-Type'] ?? JSON_API;
  }
  return { ...config, headers } as InternalAxiosRequestConfig;
}

function shouldSetJsonApiContentType(
  method: string,
  config: InternalAxiosRequestConfig,
): boolean {
  if (!['POST', 'PATCH', 'PUT'].includes(method)) return false;
  const data: unknown = config.data;
  if (data === undefined || data === null) return false;
  return isJsonApiSerializableBody(data);
}

function isJsonApiSerializableBody(data: unknown): boolean {
  if (typeof data !== 'object') return false;
  if (Array.isArray(data)) return true;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && data instanceof Blob) return false;
  if (data instanceof ArrayBuffer) return false;
  if (ArrayBuffer.isView(data)) return false;
  if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) return false;
  if (data instanceof Date) return false;
  if (typeof ReadableStream !== 'undefined' && data instanceof ReadableStream) return false;
  const proto = Object.getPrototypeOf(data) as object | null;
  return proto === Object.prototype || proto === null;
}
