import { describe, expect, it, vi } from 'vitest';
import { createIdempotencyIntent } from '../../src/idempotency/intent.ts';

describe('createIdempotencyIntent', () => {
  it('uses defaultIdempotencyKey when options omitted', () => {
    const intent = createIdempotencyIntent();
    const key = intent.begin();
    expect(key).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('begin mints and stores active key', () => {
    const gen = vi.fn()
      .mockReturnValueOnce('KEY_A')
      .mockReturnValueOnce('KEY_B');
    const intent = createIdempotencyIntent({ generateKey: gen });

    expect(intent.activeKey).toBeNull();
    expect(intent.hasActiveIntent()).toBe(false);

    expect(intent.begin()).toBe('KEY_A');
    expect(intent.activeKey).toBe('KEY_A');
    expect(intent.hasActiveIntent()).toBe(true);
    expect(gen).toHaveBeenCalledTimes(1);
  });

  it('keyFor reuse returns same key without prior begin', () => {
    const gen = vi.fn().mockReturnValue('KEY_REUSE');
    const intent = createIdempotencyIntent({ generateKey: gen });

    expect(intent.keyFor('reuse')).toBe('KEY_REUSE');
    expect(intent.keyFor('reuse')).toBe('KEY_REUSE');
    expect(gen).toHaveBeenCalledTimes(1);
  });

  it('keyFor rotate replaces active key', () => {
    const gen = vi.fn()
      .mockReturnValueOnce('KEY_1')
      .mockReturnValueOnce('KEY_2');
    const intent = createIdempotencyIntent({ generateKey: gen });

    expect(intent.keyFor('reuse')).toBe('KEY_1');
    expect(intent.keyFor('rotate')).toBe('KEY_2');
    expect(intent.activeKey).toBe('KEY_2');
  });

  it('complete and abandon clear active intent', () => {
    const gen = vi.fn().mockReturnValue('KEY_X');
    const intent = createIdempotencyIntent({ generateKey: gen });

    intent.begin();
    intent.complete();
    expect(intent.hasActiveIntent()).toBe(false);

    intent.begin();
    intent.abandon();
    expect(intent.activeKey).toBeNull();
  });
});
