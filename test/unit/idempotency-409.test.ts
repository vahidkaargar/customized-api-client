import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { dispatchWithRetry } from '../../src/index.ts';

describe('idempotency 409 behaviors via retry gate', () => {
  it('does not retry KEY_REUSED', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const req = vi.spyOn(instance, 'request');
    req.mockResolvedValue({
      status: 409,
      data: { errors: [{ code: 'IDEMPOTENCY_KEY_REUSED' }] },
      headers: {},
      config: {},
    });

    const res = await dispatchWithRetry(
      instance,
      { method: 'POST', url: '/x', data: {} },
      { retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 } },
    );
    expect(res.status).toBe(409);
    expect(req).toHaveBeenCalledTimes(1);
  });

  it('retries IN_PROGRESS', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const req = vi.spyOn(instance, 'request');
    req
      .mockResolvedValueOnce({
        status: 409,
        data: { errors: [{ code: 'IDEMPOTENCY_REQUEST_IN_PROGRESS' }] },
        headers: {},
        config: {},
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { data: { type: 't', id: '1' } },
        headers: {},
        config: {},
      });

    const res = await dispatchWithRetry(
      instance,
      { method: 'POST', url: '/x', data: {} },
      { retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 5, jitterRatio: 0 } },
    );
    expect(res.status).toBe(200);
    expect(req).toHaveBeenCalledTimes(2);
  });

  it('does not retry POST 500', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const req = vi.spyOn(instance, 'request');
    req.mockResolvedValue({
      status: 500,
      data: { errors: [{ code: 'INTERNAL_ERROR' }] },
      headers: {},
      config: {},
    });

    const res = await dispatchWithRetry(
      instance,
      { method: 'POST', url: '/x', data: {} },
      { retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 } },
    );
    expect(res.status).toBe(500);
    expect(req).toHaveBeenCalledTimes(1);
  });
});
