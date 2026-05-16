import type { InternalAxiosRequestConfig } from 'axios';

const JSON_API = 'application/vnd.api+json';

export function applyJsonApiHeaders(
  config: InternalAxiosRequestConfig,
  method: string,
): InternalAxiosRequestConfig {
  const m = method.toUpperCase();
  const headers = { ...(config.headers as Record<string, string> | undefined) };
  headers.Accept = headers.Accept ?? JSON_API;
  if (hasJsonBody(m, config)) {
    headers['Content-Type'] = headers['Content-Type'] ?? JSON_API;
  }
  return { ...config, headers } as InternalAxiosRequestConfig;
}

function hasJsonBody(method: string, config: InternalAxiosRequestConfig): boolean {
  if (!['POST', 'PATCH', 'PUT'].includes(method)) return false;
  return config.data !== undefined && config.data !== null;
}
