import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('client config wiring', () => {
  it('defaultHeaders appear on the wire', async () => {
    let headerValue: string | null = null;
    server.use(
      http.get('http://localhost/api/v1/test', ({ request }) => {
        headerValue = request.headers.get('X-Custom-Header');
        return HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 });
      }),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      defaultHeaders: { 'X-Custom-Header': 'my-value' },
    });
    await client.get('/test');
    expect(headerValue).toBe('my-value');
  });

  it('custom generateIdempotencyKey is used', async () => {
    let idempotencyKey: string | null = null;
    server.use(
      http.post('http://localhost/api/v1/test', ({ request }) => {
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 201 });
      }),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      generateIdempotencyKey: () => 'custom-key-12345',
    });
    await client.post('/test', {});
    expect(idempotencyKey).toBe('custom-key-12345');
  });

  it('timeout rejects on slow response', async () => {
    server.use(
      http.get('http://localhost/api/v1/slow', async () => {
        await new Promise((r) => setTimeout(r, 1000)); // 1 second delay
        return HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 });
      }),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      timeout: 100, // 100ms — will timeout before 1s response
    });
    await expect(client.get('/slow')).rejects.toThrow();
  });
});
