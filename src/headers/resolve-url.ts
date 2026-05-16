import type { BaseUrlMode } from '../types/config.ts';

/**
 * Path for axios `url` (combined with `baseURL`). No duplicate `/api/v1`, no `//`.
 */
export function resolveResourcePath(baseURL: string, path: string, mode: BaseUrlMode): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = baseURL.replace(/\/+$/, '');

  if (mode === 'modeB') {
    if (normalizedPath.startsWith('/api/v1/') && base.endsWith('/api/v1')) {
      const rest = normalizedPath.slice('/api/v1'.length);
      /* v8 ignore next -- rest is always non-empty when path starts with /api/v1/ */
      return rest.length > 0 ? rest : '/';
    }
    return normalizedPath;
  }

  return normalizedPath.startsWith('/api/v1') ? normalizedPath : `/api/v1${normalizedPath}`;
}

/**
 * Identity passthrough for absolute URLs used by `getByUrl`; reserved for future normalization.
 */
export function normalizeHttpUrl(fullUrl: string): string {
  return fullUrl;
}
