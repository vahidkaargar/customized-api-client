import type { JsonApiDocument } from '../types/jsonapi.ts';
import type { TransformResponseKeysMode } from '../types/config.ts';

/** Shallow camelCase keys for `attributes` and `meta` only — copies document where needed. */
export function applyTransformKeys(
  doc: JsonApiDocument,
  mode: TransformResponseKeysMode,
): JsonApiDocument {
  if (mode === 'none') return doc;

  const data = doc.data;
  const mapResource = (r: object): object => {
    const o = { ...r } as Record<string, unknown>;
    if (o.attributes && typeof o.attributes === 'object') {
      o.attributes = camelKeys(o.attributes as Record<string, unknown>);
    }
    if (o.meta && typeof o.meta === 'object') {
      o.meta = camelKeys(o.meta as Record<string, unknown>);
    }
    return o;
  };

  if (data === null) {
    return {
      ...doc,
      meta: doc.meta ? camelKeys(doc.meta) : doc.meta,
    };
  }

  if (Array.isArray(data)) {
    return {
      ...doc,
      data: data.map((r) => mapResource(r as object)) as JsonApiDocument['data'],
      meta: doc.meta ? camelKeys(doc.meta) : doc.meta,
    };
  }

  return {
    ...doc,
    data: mapResource(data) as JsonApiDocument['data'],
    /* v8 ignore next -- document meta absent on single-resource responses */
    meta: doc.meta ? camelKeys(doc.meta) : doc.meta,
  };
}

function camelKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toCamelCase(k)] = v;
  }
  return out;
}

function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
