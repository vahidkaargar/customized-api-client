import { describe, expect, it } from 'vitest';
import {
  assertValidIdempotencyKey,
  defaultIdempotencyKey,
  isMutationMethod,
} from '../../src/index.ts';

describe('idempotency helpers', () => {
  it('default key looks like ULID (26 Crockford)', () => {
    const k = defaultIdempotencyKey();
    expect(k).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(k.length).toBeLessThanOrEqual(64);
  });

  it('rejects empty key', () => {
    expect(() => { assertValidIdempotencyKey(''); }).toThrow();
    expect(() => { assertValidIdempotencyKey('   '); }).toThrow();
  });

  it('rejects key over 64 chars', () => {
    expect(() => { assertValidIdempotencyKey('a'.repeat(65)); }).toThrow();
    expect(() => { assertValidIdempotencyKey('a'.repeat(64)); }).not.toThrow();
  });

  it('mutation methods', () => {
    expect(isMutationMethod('post')).toBe(true);
    expect(isMutationMethod('GET')).toBe(false);
    expect(isMutationMethod('head')).toBe(false);
  });
});
