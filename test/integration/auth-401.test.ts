import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('401 + onUnauthorized', () => {
  it('invokes onUnauthorized and does not retry', async () => {
    const onUnauthorized = vi.fn();
    let n = 0;
    server.use(
      http.get('http://localhost/api/v1/secret', () => {
        n += 1;
        return HttpResponse.json({ errors: [{ code: 'UNAUTHENTICATED' }] }, { status: 401 });
      }),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      onUnauthorized,
      retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 },
    });
    await expect(client.get('/secret')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalled();
    expect(n).toBe(1);
  });
});
