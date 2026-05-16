import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { dispatchWithRetry } from '../../src/index.ts';

describe('dispatchWithRetry', () => {
  it('returns last response when retries exhausted for non-retryable 400', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const req = vi.spyOn(instance, 'request');
    req.mockResolvedValue({ status: 400, data: {}, headers: {}, config: {} });

    const res = await dispatchWithRetry(
      instance,
      { method: 'GET', url: '/x' },
      { retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 } },
    );
    expect(res.status).toBe(400);
    expect(req).toHaveBeenCalledTimes(1);
  });

  it('retries on GET 500 up to maxAttempts', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const req = vi.spyOn(instance, 'request');
    req
      .mockResolvedValueOnce({ status: 500, data: {}, headers: {}, config: {} })
      .mockResolvedValueOnce({ status: 200, data: {}, headers: {}, config: {} });

    const res = await dispatchWithRetry(
      instance,
      { method: 'GET', url: '/x' },
      { retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 5, jitterRatio: 0 } },
    );
    expect(res.status).toBe(200);
    expect(req).toHaveBeenCalledTimes(2);
  });

  it('applies jitter when configured', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const req = vi.spyOn(instance, 'request');
    req
      .mockResolvedValueOnce({ status: 500, data: {}, headers: {}, config: {} })
      .mockResolvedValueOnce({ status: 200, data: {}, headers: {}, config: {} });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    await dispatchWithRetry(
      instance,
      { method: 'GET', url: '/x' },
      { retry: { maxAttempts: 4, baseDelayMs: 10, maxDelayMs: 100, jitterRatio: 0.2 } },
    );

    expect(req).toHaveBeenCalledTimes(2);
    randomSpy.mockRestore();
  });

  it('honors Retry-After header on GET 500', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const req = vi.spyOn(instance, 'request');
    req
      .mockResolvedValueOnce({
        status: 500,
        data: {},
        headers: { 'retry-after': '1' },
        config: {},
      })
      .mockResolvedValueOnce({ status: 200, data: {}, headers: {}, config: {} });

    const res = await dispatchWithRetry(
      instance,
      { method: 'GET', url: '/x' },
      { retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 5000, jitterRatio: 0 } },
    );
    expect(res.status).toBe(200);
    expect(req).toHaveBeenCalledTimes(2);
  });
});
