import { describe, expect, it } from 'vitest';
import { indexIncluded, resolveIncluded } from '../../src/index.ts';

describe('included index', () => {
  it('indexes and resolves', () => {
    const inc = [
      { type: 'people', id: '1', attributes: { email: 'a@b.c' } },
    ] as const;
    const idx = indexIncluded(inc);
    const r = resolveIncluded({ type: 'people', id: '1' }, idx);
    expect(r?.attributes?.email).toBe('a@b.c');
  });

  it('missing ref', () => {
    const idx = indexIncluded([]);
    expect(resolveIncluded({ type: 'people', id: 'x' }, idx)).toBeUndefined();
  });
});
