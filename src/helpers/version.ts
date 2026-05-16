import type { JsonApiResourceObject } from '../types/jsonapi.ts';
import { flattenAxiosHeaders, getHeader } from '../http/header-utils.ts';

export function readResourceVersion(
  resource: JsonApiResourceObject,
  etagHeader?: string  ,
): number | undefined {
  const meta = resource.meta;
  const mv = meta?.version;
  const fromMeta = coerceUnsigned(mv);
  if (fromMeta !== undefined) return fromMeta;

  const etag = etagHeader;
  if (typeof etag === 'string') {
    const m = /v=(\d+)/i.exec(etag);
    if (m?.[1]) return Number.parseInt(m[1], 10);
  }
  return undefined;
}

function coerceUnsigned(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v;
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number.parseInt(v, 10);
  return undefined;
}

export function etagFromResponseHeaders(headerBag: unknown): string | undefined {
  const h = flattenAxiosHeaders(headerBag);
  return getHeader(h, 'etag');
}
