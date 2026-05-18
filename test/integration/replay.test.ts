import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('Idempotent-Replayed', () => {
  it('same key and body yields equal document and onIdempotencyReplay', async () => {
    const onIdempotencyReplay = vi.fn();
    const doc = { data: { type: 'widgets', id: '99', attributes: { n: 1 } } };
    let call = 0;
    server.use(
      http.post('http://localhost/api/v1/widgets', () => {
        call += 1;
        return HttpResponse.json(doc, {
          status: 200,
          headers: call > 1 ? { 'Idempotent-Replayed': 'true' } : {},
        });
      }),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      onIdempotencyReplay,
    });
    const body = { data: { type: 'widgets', attributes: { n: 1 } } };
    const r1 = await client.post('/widgets', body, { idempotencyKey: 'fixed-key-01' });
    const r2 = await client.post('/widgets', body, { idempotencyKey: 'fixed-key-01' });

    expect(r1.kind).toBe('jsonapi-success');
    expect(r2.kind).toBe('jsonapi-success');
    if (r1.kind === 'jsonapi-success' && r2.kind === 'jsonapi-success') {
      expect(r2.document).toEqual(r1.document);
      expect(r2.headers.idempotentReplayed).toBe(true);
    }
    expect(onIdempotencyReplay).toHaveBeenCalled();
  });
});
