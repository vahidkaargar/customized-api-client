import { DEFAULT_PAGE_SIZE_CAP } from '../types/config.ts';

export interface JsonApiQueryInput {
  readonly filter?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly sort?: readonly string[];
  readonly fields?: Readonly<Record<string, readonly string[]>>;
  readonly include?: readonly string[];
}

export function buildJsonApiQuery(input: JsonApiQueryInput): Record<string, string> {
  const params: Record<string, string> = {};
  if (input.filter) {
    for (const [k, v] of Object.entries(input.filter)) {
      if (v === undefined) continue;
      params[`filter[${k}]`] = String(v);
    }
  }
  if (input.sort?.length) {
    params.sort = input.sort.join(',');
  }
  if (input.fields) {
    for (const [type, fields] of Object.entries(input.fields)) {
      params[`fields[${type}]`] = fields.join(',');
    }
  }
  if (input.include?.length) {
    params.include = input.include.join(',');
  }
  return params;
}

export function buildOffsetPageParams(input: {
  readonly number: number;
  readonly size: number;
}): Record<string, string | number> {
  const size = Math.min(Math.max(1, input.size), DEFAULT_PAGE_SIZE_CAP);
  return {
    'page[number]': input.number,
    'page[size]': size,
  };
}

export function buildCursorPageParams(input: {
  readonly cursor: string;
  readonly size: number;
}): Record<string, string | number> {
  const size = Math.min(Math.max(1, input.size), DEFAULT_PAGE_SIZE_CAP);
  return {
    'page[cursor]': input.cursor,
    'page[size]': size,
  };
}
