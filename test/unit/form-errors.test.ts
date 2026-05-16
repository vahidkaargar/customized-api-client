import { describe, expect, it } from 'vitest';
import { groupValidationErrorsByPointer } from '../../src/index.ts';

describe('groupValidationErrorsByPointer', () => {
  it('groups by JSON pointer', () => {
    const g = groupValidationErrorsByPointer([
      { code: 'A', detail: 'one', source: { pointer: '/data/attributes/name' } },
      { code: 'B', detail: 'two', source: { pointer: '/data/attributes/name' } },
      { code: 'C', title: 'no pointer' },
    ]);
    expect(g['/data/attributes/name']?.length).toBe(2);
    expect(g['/']?.[0]).toContain('no pointer');
  });

  it('returns empty object for empty array', () => {
    const g = groupValidationErrorsByPointer([]);
    expect(g).toEqual({});
  });
});
