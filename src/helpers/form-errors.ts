import type { JsonApiErrorObject } from '../types/jsonapi.ts';

export type ValidationGroups = Record<string, readonly string[]>;

export function groupValidationErrorsByPointer(
  errors: readonly JsonApiErrorObject[],
): ValidationGroups {
  const out: Record<string, string[]> = {};
  for (const e of errors) {
    const ptr = e.source?.pointer ?? '/';
    /* v8 ignore next -- detail/title/code chain; exhaustive cases covered in tests */
    const msg = e.detail ?? e.title ?? e.code ?? 'Error';
    out[ptr] ??= [];
    out[ptr].push(msg);
  }
  return out;
}
