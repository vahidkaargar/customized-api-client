import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('createApiClient verbs', () => {
  it('head, put, delete, request', async () => {
    server.use(
      http.head('http://localhost/api/v1/n', () => new HttpResponse(null, { status: 204 })),
      http.put('http://localhost/api/v1/n', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
      http.patch('http://localhost/api/v1/p', () =>
        HttpResponse.json({ data: { type: 't', id: '2' } }, { status: 200 }),
      ),
      http.delete('http://localhost/api/v1/n', () => new HttpResponse(null, { status: 204 })),
      http.get('http://localhost/api/v1/r', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );

    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });

    const h = await client.head('/n');
    expect(h.kind).toBe('no-content');

    const p = await client.put('/n', { data: { x: 1 } });
    expect(p.kind).toBe('jsonapi-success');

    const pPatch = await client.patch('/p', { data: {} });
    expect(pPatch.kind).toBe('jsonapi-success');

    const d = await client.delete('/n');
    expect(d.kind).toBe('no-content');

    const r = await client.request({ method: 'GET', url: '/r' });
    expect(r.kind).toBe('jsonapi-success');
  });

  it('getByUrl absolute URL', async () => {
    server.use(
      http.get('http://other.host/x', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const res = await client.getByUrl('http://other.host/x');
    expect(res.kind).toBe('jsonapi-success');
  });
});
