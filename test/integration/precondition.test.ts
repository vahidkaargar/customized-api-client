import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('precondition statuses on client', () => {
  it('does not retry 428', async () => {
    let n = 0;
    server.use(
      http.get('http://localhost/api/v1/pre', () => {
        n += 1;
        return HttpResponse.json({ errors: [{ code: 'PRECONDITION_REQUIRED' }] }, { status: 428 });
      }),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 },
    });
    await expect(client.get('/pre')).rejects.toMatchObject({ status: 428 });
    expect(n).toBe(1);
  });

  it('does not retry 412', async () => {
    let n = 0;
    server.use(
      http.patch('http://localhost/api/v1/r/1', () => {
        n += 1;
        return HttpResponse.json({ errors: [{ code: 'STALE' }] }, { status: 412 });
      }),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 },
    });
    await expect(client.patchWithVersion('/r/1', {}, 1)).rejects.toMatchObject({ status: 412 });
    expect(n).toBe(1);
  });
});
