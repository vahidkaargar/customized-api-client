export interface OffsetPagination {
  readonly kind: 'offset';
  readonly page: number;
  readonly totalPages?: number;
  readonly total?: number;
}

export interface CursorPagination {
  readonly kind: 'cursor';
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

export interface UnknownPagination { readonly kind: 'unknown' }

export function parsePaginationKind(
  meta: Readonly<Record<string, unknown>> | undefined,
  links: Readonly<Record<string, string | null | undefined>> | undefined,
): OffsetPagination | CursorPagination | UnknownPagination {
  const m = meta ?? {};
  const linksNext = typeof links?.next === 'string' ? links.next : undefined;

  if (linksNext) {
    const fromCursor =
      extractQueryParam(linksNext, 'page[cursor]') ??
      extractQueryParam(linksNext, 'page%5Bcursor%5D');
    if (fromCursor) {
      return { kind: 'cursor', hasMore: true, nextCursor: fromCursor };
    }

    const legacy = parseLegacyOffsetFromUrl(linksNext);
    if (legacy) return legacy;
  }

  const lastPage = num(m.last_page);
  const current = num(m.current_page) ?? num(m.page);
  const total = num(m.total);
  const hasMore = bool(m.has_more);

  if (lastPage !== undefined || current !== undefined || total !== undefined) {
    return {
      kind: 'offset',
      page: current ?? 1,
      totalPages: lastPage,
      total,
    };
  }

  if (hasMore !== undefined) {
    return {
      kind: 'cursor',
      hasMore,
      nextCursor: typeof m.next_cursor === 'string' ? m.next_cursor : undefined,
    };
  }

  return { kind: 'unknown' };
}

export function getNextPageUrl(
  links: Readonly<Record<string, string | null | undefined>> | undefined,
): string | undefined {
  const n = links?.next;
  return typeof n === 'string' ? n : undefined;
}

function parseLegacyOffsetFromUrl(url: string): OffsetPagination | undefined {
  try {
    const u = new URL(url, 'http://local.test');
    const hasPerPage = u.searchParams.has('per_page');
    const pagePlain = u.searchParams.get('page');
    const pageBracket = u.searchParams.get('page[number]');
    if (!hasPerPage && !pagePlain && !pageBracket) return undefined;
    const pageNum = num(pagePlain) ?? num(pageBracket) ?? 1;
    return { kind: 'offset', page: pageNum, totalPages: undefined, total: undefined };
  } catch {
    return undefined;
  }
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && /^-?\d+$/.test(v)) return Number.parseInt(v, 10);
  return undefined;
}

function bool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  return undefined;
}

function extractQueryParam(url: string, key: string): string | null {
  try {
    const u = new URL(url, 'http://local.test');
    return u.searchParams.get(key) ?? u.searchParams.get(key.replace(/\[/g, '').replace(/\]/g, ''));
  } catch {
    return null;
  }
}
