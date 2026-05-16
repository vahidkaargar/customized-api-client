import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('idempotency on wire', () => {
  it('POST sends Idempotency-Key; GET does not', async () => {
    let postKey = '';
    let getKey: string | null = null;

    server.use(
      http.post('http://localhost/api/v1/items', ({ request }) => {
        postKey = request.headers.get('Idempotency-Key') ?? '';
        return HttpResponse.json({ data: { type: 'items', id: '1' } }, { status: 201 });
      }),
      http.get('http://localhost/api/v1/items', ({ request }) => {
        getKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({ data: [] }, { status: 200 });
      }),
    );

    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await client.post('/items', { data: { x: 1 } });
    await client.get('/items');

    expect(postKey.length).toBeGreaterThan(0);
    expect(postKey.length).toBeLessThanOrEqual(64);
    expect(getKey).toBeNull();
  });
});
