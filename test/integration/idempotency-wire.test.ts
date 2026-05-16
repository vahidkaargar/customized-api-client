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

  it('PATCH, PUT, DELETE send Idempotency-Key', async () => {
    let patchKey = '';
    let putKey = '';
    let deleteKey = '';

    server.use(
      http.patch('http://localhost/api/v1/items/1', ({ request }) => {
        patchKey = request.headers.get('Idempotency-Key') ?? '';
        return HttpResponse.json({ data: { type: 'items', id: '1' } }, { status: 200 });
      }),
      http.put('http://localhost/api/v1/items/2', ({ request }) => {
        putKey = request.headers.get('Idempotency-Key') ?? '';
        return HttpResponse.json({ data: { type: 'items', id: '2' } }, { status: 200 });
      }),
      http.delete('http://localhost/api/v1/items/3', ({ request }) => {
        deleteKey = request.headers.get('Idempotency-Key') ?? '';
        return HttpResponse.json(null, { status: 204 });
      }),
    );

    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await client.patch('/items/1', { data: {} });
    await client.put('/items/2', { data: {} });
    await client.delete('/items/3');

    expect(patchKey.length).toBeGreaterThan(0);
    expect(patchKey.length).toBeLessThanOrEqual(64);
    expect(putKey.length).toBeGreaterThan(0);
    expect(putKey.length).toBeLessThanOrEqual(64);
    expect(deleteKey.length).toBeGreaterThan(0);
    expect(deleteKey.length).toBeLessThanOrEqual(64);
  });
});
