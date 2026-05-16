import { describe, expect, it } from 'vitest';
import { getNextPageUrl, parsePaginationKind } from '../../src/index.ts';

describe('pagination parse', () => {
  it('offset from meta', () => {
    const k = parsePaginationKind(
      { current_page: 2, last_page: 5, total: 40 },
      {},
    );
    expect(k.kind).toBe('offset');
    if (k.kind === 'offset') expect(k.page).toBe(2);
  });

  it('cursor from meta', () => {
    const k = parsePaginationKind({ has_more: true, next_cursor: 'abc' }, {});
    expect(k.kind).toBe('cursor');
    if (k.kind === 'cursor') expect(k.nextCursor).toBe('abc');
  });

  it('legacy page/per_page in links.next', () => {
    const k = parsePaginationKind(
      {},
      { next: 'https://api.test/items?page=3&per_page=20' },
    );
    expect(k.kind).toBe('offset');
    if (k.kind === 'offset') expect(k.page).toBe(3);
  });

  it('page[cursor] in links.next', () => {
    const k = parsePaginationKind(
      {},
      { next: 'https://api.test/items?page%5Bcursor%5D=xyz&page%5Bsize%5D=10' },
    );
    expect(k.kind).toBe('cursor');
    if (k.kind === 'cursor') expect(k.nextCursor).toBe('xyz');
  });
});

describe('getNextPageUrl', () => {
  it('returns next or undefined', () => {
    expect(getNextPageUrl({ next: '/n' })).toBe('/n');
    expect(getNextPageUrl({})).toBeUndefined();
  });
});
