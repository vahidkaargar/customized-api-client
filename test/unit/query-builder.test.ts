import { describe, expect, it } from 'vitest';
import {
  buildCursorPageParams,
  buildJsonApiQuery,
  buildOffsetPageParams,
} from '../../src/index.ts';

describe('query builders', () => {
  it('buildJsonApiQuery', () => {
    const q = buildJsonApiQuery({
      filter: { status: 'open', n: 1 },
      sort: ['-created', 'name'],
      fields: { widgets: ['name'] },
      include: ['owner'],
    });
    expect(q['filter[status]']).toBe('open');
    expect(q.sort).toBe('-created,name');
    expect(q['fields[widgets]']).toBe('name');
    expect(q.include).toBe('owner');
  });

  it('caps page[size]', () => {
    const p = buildOffsetPageParams({ number: 1, size: 500 });
    expect(p['page[size]']).toBe(100);
  });

  it('cursor page', () => {
    const p = buildCursorPageParams({ cursor: 'z', size: 10 });
    expect(p['page[cursor]']).toBe('z');
    expect(p['page[size]']).toBe(10);
  });
});
