import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createHealthCheck } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('createHealthCheck', () => {
  it('returns true on 200', async () => {
    server.use(
      http.get('http://localhost/api/v1/health/live', () =>
        HttpResponse.json({ data: { type: 'health', id: 'x' } }, { status: 200 }),
      ),
    );
    const check = createHealthCheck({ baseURL: 'http://localhost/api/v1' });
    await expect(check()).resolves.toBe(true);
  });

  it('returns false on error', async () => {
    const check = createHealthCheck({
      get: vi.fn().mockRejectedValue(new Error('network')),
    });
    await expect(check()).resolves.toBe(false);
  });
});
