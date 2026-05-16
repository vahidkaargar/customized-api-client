import { flattenAxiosHeaders } from '../http/header-utils.ts';
import type { DeprecationInfo } from '../types/config.ts';

export function parseDeprecationHeaders(headerBag: unknown): DeprecationInfo | null {
  const flat = flattenAxiosHeaders(headerBag);
  const dep = flat.deprecation;
  const sunset = flat.sunset;
  if (!dep && !sunset) return null;
  return {
    deprecation: dep,
    sunset,
    rawHeaders: flat,
  };
}
