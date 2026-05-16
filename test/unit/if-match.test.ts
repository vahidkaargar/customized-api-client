import { describe, expect, it } from 'vitest';
import { formatIfMatch } from '../../src/index.ts';

describe('formatIfMatch', () => {
  it('formats version as quoted weak tag style', () => {
    expect(formatIfMatch(3)).toBe('"v=3"');
  });
});
