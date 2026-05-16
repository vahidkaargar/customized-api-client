import { describe, expect, it } from 'vitest';
import { formatIfMatch } from '../../src/index.ts';

describe('formatIfMatch', () => {
  it('formats version as quoted weak tag style', () => {
    expect(formatIfMatch(3)).toBe('"v=3"');
  });

  it('formats version 0', () => {
    expect(formatIfMatch(0)).toBe('"v=0"');
  });

  it('rejects NaN', () => {
    expect(() => formatIfMatch(NaN)).toThrow();
  });

  it('rejects Infinity', () => {
    expect(() => formatIfMatch(Infinity)).toThrow();
  });

  it('rejects negative numbers', () => {
    expect(() => formatIfMatch(-1)).toThrow();
  });
});
