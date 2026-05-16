import { describe, expect, it } from 'vitest';
import { parseRetryAfterSeconds } from '../../src/index.ts';

describe('parseRetryAfterSeconds', () => {
  it('parses integer seconds', () => {
    expect(parseRetryAfterSeconds('120')).toBe(120);
  });

  it('parses HTTP-date', () => {
    const future = new Date(Date.now() + 5000).toUTCString();
    const s = parseRetryAfterSeconds(future);
    expect(s).toBeDefined();
    expect(s).toBeGreaterThanOrEqual(0);
  });

  it('returns undefined for undefined input', () => {
    expect(parseRetryAfterSeconds(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(parseRetryAfterSeconds('')).toBeUndefined();
  });
});
