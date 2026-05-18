import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { ApiClientError, createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('mutation 5xx retry (opt-in)', () => {
  it('reuses Idempotency-Key when retryMutationsOnServerError is true', async () => {
    const keys: string[] = [];
    let hit = 0;

    server.use(
      http.post('http://localhost/api/v1/widgets', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key') ?? '');
        hit += 1;
        if (hit === 1) {
          return HttpResponse.json({ errors: [{ title: 'temporary' }] }, { status: 500 });
        }
        return HttpResponse.json(
          { data: { type: 'widgets', id: '1', attributes: { n: 1 } } },
          { status: 201 },
        );
      }),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      retry: {
        maxAttempts: 4,
        baseDelayMs: 1,
        maxDelayMs: 20,
        jitterRatio: 0,
        retryMutationsOnServerError: true,
      },
    });

    const res = await client.post(
      '/widgets',
      { data: { type: 'widgets', attributes: { n: 1 } } },
      { idempotencyKey: 'stable-op-key-01' },
    );

    expect(res.kind).toBe('jsonapi-success');
    expect(hit).toBe(2);
    expect(keys).toEqual(['stable-op-key-01', 'stable-op-key-01']);
  });

  it('does not retry POST 500 when retryMutationsOnServerError is omitted', async () => {
    let hit = 0;

    server.use(
      http.post('http://localhost/api/v1/widgets', () => {
        hit += 1;
        return HttpResponse.json({ errors: [{ title: 'temporary' }] }, { status: 500 });
      }),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 20, jitterRatio: 0 },
    });

    await expect(
      client.post('/widgets', { data: { type: 'widgets', attributes: { n: 1 } } }),
    ).rejects.toBeInstanceOf(ApiClientError);

    expect(hit).toBe(1);
  });
});
