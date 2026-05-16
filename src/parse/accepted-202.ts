import { flattenAxiosHeaders, getHeader } from '../http/header-utils.ts';
import type { HeadersLike } from '../http/header-utils.ts';

/**
 * Resolve absolute Location for 202 per project-plan (relative to response URL when needed).
 */
export function resolveAcceptedLocation(headers: HeadersLike, requestUrl: string): string {
  const flat = flattenAxiosHeaders(headers);
  const loc = getHeader(flat, 'location');
  if (!loc) return requestUrl;
  try {
    return new URL(loc, requestUrl).href;
  } catch {
    return loc;
  }
}
