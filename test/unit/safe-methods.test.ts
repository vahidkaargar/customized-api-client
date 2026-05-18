import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('safe methods', () => {
  it('safeGet returns Err without throwing on 404', async () => {
    server.use(http.get('http://localhost/api/v1/m', () => HttpResponse.json({ errors: [] }, { status: 404 })));
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safeGet('/m');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.status).toBe(404);
  });

  it('safeGet ok mirrors get', async () => {
    server.use(
      http.get('http://localhost/api/v1/x', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const a = await client.get('/x');
    const b = await client.safeGet('/x');
    expect(b.ok).toBe(true);
    if (b.ok && a.kind === 'jsonapi-success' && b.value.kind === 'jsonapi-success') {
      expect(b.value.document).toEqual(a.document);
    }
  });

  it('safePost Err on 422', async () => {
    server.use(
      http.post('http://localhost/api/v1/y', () =>
        HttpResponse.json({ errors: [{ code: 'VALIDATION_ERROR' }] }, { status: 422 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safePost('/y', {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.status).toBe(422);
  });

  it('safeHead no-content', async () => {
    server.use(http.head('http://localhost/api/v1/h', () => new HttpResponse(null, { status: 204 })));
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safeHead('/h');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.kind).toBe('no-content');
  });

  it('safePut and safePatch mirror verbs', async () => {
    server.use(
      http.put('http://localhost/api/v1/u', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
      http.patch('http://localhost/api/v1/p', () =>
        HttpResponse.json({ data: { type: 't', id: '2' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const put = await client.safePut('/u', {});
    const patch = await client.safePatch('/p', {});
    expect(put.ok).toBe(true);
    expect(patch.ok).toBe(true);
  });

  it('safeRequest mirrors request', async () => {
    server.use(
      http.get('http://localhost/api/v1/r', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safeRequest({ method: 'GET', url: '/r' });
    expect(r.ok).toBe(true);
  });

  it('safeRequest with absolute url', async () => {
    server.use(
      http.get('http://other.host/abs', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safeRequest({ method: 'GET', url: 'http://other.host/abs' });
    expect(r.ok).toBe(true);
  });

  it('safeRequest defaults method GET and url /', async () => {
    server.use(
      http.get('http://localhost/api/v1/', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safeRequest({});
    expect(r.ok).toBe(true);
  });

  it('safeDelete Err on 403', async () => {
    server.use(
      http.delete('http://localhost/api/v1/d', () =>
        HttpResponse.json({ errors: [{ code: 'FORBIDDEN' }] }, { status: 403 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safeDelete('/d');
    expect(r.ok).toBe(false);
  });

  it('safeGetByUrl ok on 200', async () => {
    server.use(
      http.get('http://other.host/x', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safeGetByUrl('http://other.host/x');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.kind).toBe('jsonapi-success');
  });

  it('safePatchWithVersion ok on 200', async () => {
    server.use(
      http.patch('http://localhost/api/v1/p/1', ({ request }) => {
        const ifMatch = request.headers.get('If-Match');
        if (ifMatch === '"v=3"') {
          return HttpResponse.json({ data: { type: 'p', id: '1' } }, { status: 200 });
        }
        return HttpResponse.json({ errors: [{ code: 'STALE_VERSION' }] }, { status: 412 });
      }),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safePatchWithVersion('/p/1', {}, 3);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.kind).toBe('jsonapi-success');
  });

  it('safePatchWithVersion Err on 412', async () => {
    server.use(
      http.patch('http://localhost/api/v1/p/2', () =>
        HttpResponse.json({ errors: [{ code: 'STALE_VERSION' }] }, { status: 412 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const r = await client.safePatchWithVersion('/p/2', {}, 5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.status).toBe(412);
  });
});
