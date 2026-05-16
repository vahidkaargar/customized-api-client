import type { JsonApiDocument } from '../types/jsonapi.ts';

export function parseJsonApiDocument(payload: unknown): JsonApiDocument {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError('JSON:API document must be an object');
  }
  const o = payload as Record<string, unknown>;
  if (!('data' in o)) {
    throw new TypeError('JSON:API document must include "data"');
  }
  return payload as JsonApiDocument;
}
