import type { JsonApiResourceLinkage, JsonApiResourceObject } from '../types/jsonapi.ts';

export type IncludedIndex = ReadonlyMap<string, JsonApiResourceObject>;

export function indexIncluded(
  included: readonly JsonApiResourceObject[] | undefined,
): IncludedIndex {
  const map = new Map<string, JsonApiResourceObject>();
  if (!included) return map;
  for (const r of included) {
    map.set(`${r.type}:${r.id}`, r);
  }
  return map;
}

export function resolveIncluded(
  ref: JsonApiResourceLinkage,
  index: IncludedIndex,
): JsonApiResourceObject | undefined {
  return index.get(`${ref.type}:${ref.id}`);
}
