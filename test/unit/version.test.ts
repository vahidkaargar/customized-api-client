import { describe, expect, it } from 'vitest';
import { readResourceVersion } from '../../src/index.ts';

describe('readResourceVersion', () => {
  it('prefers meta.version', () => {
    expect(
      readResourceVersion(
        { type: 't', id: '1', meta: { version: 4 } },
        'W/"v=99"',
      ),
    ).toBe(4);
  });

  it('falls back to ETag', () => {
    expect(readResourceVersion({ type: 't', id: '1' }, 'W/"v=12"')).toBe(12);
  });

  it('string coercion for meta.version', () => {
    expect(
      readResourceVersion({ type: 't', id: '1', meta: { version: '7' } }, undefined),
    ).toBe(7);
  });

  it('undefined when absent', () => {
    expect(readResourceVersion({ type: 't', id: '1' }, undefined)).toBeUndefined();
  });
});
