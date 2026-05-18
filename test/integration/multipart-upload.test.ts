import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('multipart upload on wire', () => {
  function assertMultipartHeaders(request: Request): void {
    const contentType = request.headers.get('Content-Type');
    expect(!contentType?.includes('application/vnd.api+json')).toBe(true);
    expect(request.headers.get('Authorization')).toBe('Bearer t');
    const key = request.headers.get('Idempotency-Key') ?? '';
    expect(key.length).toBeGreaterThan(0);
    expect(key.length).toBeLessThanOrEqual(64);
    expect(request.headers.get('Accept')).toBe('application/vnd.api+json');
  }

  it('POST FormData via request() omits JSON Content-Type but sends auth and idempotency', async () => {
    server.use(
      http.post('http://localhost/api/v1/media', ({ request }) => {
        assertMultipartHeaders(request);
        return HttpResponse.json({ data: { type: 'media', id: '1' } }, { status: 201 });
      }),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      auth: { type: 'bearer', getToken: () => Promise.resolve('t') },
    });
    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'f.bin');
    await client.request({ method: 'POST', url: '/media', data: fd });
  });

  it('POST FormData via postFormData() omits JSON Content-Type but sends auth and idempotency', async () => {
    server.use(
      http.post('http://localhost/api/v1/media', ({ request }) => {
        assertMultipartHeaders(request);
        return HttpResponse.json({ data: { type: 'media', id: '2' } }, { status: 201 });
      }),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      auth: { type: 'bearer', getToken: () => Promise.resolve('t') },
    });
    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'f.bin');
    await client.postFormData('/media', fd);
  });
});
