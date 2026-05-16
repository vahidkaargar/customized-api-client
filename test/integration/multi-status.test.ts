import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('207 multi-status', () => {
  it('normalizes bulk body with items property', async () => {
    server.use(
      http.post('http://localhost/api/v1/bulk', () =>
        HttpResponse.json(
          {
            items: [
              { httpStatus: 201, body: { data: { type: 'w', id: '1' } } },
              { httpStatus: 422, body: { errors: [{ code: 'X' }] } },
            ],
          },
          { status: 207 },
        ),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const res = await client.post('/bulk', {});
    expect(res.kind).toBe('multi-status');
    if (res.kind === 'multi-status') {
      expect(res.items).toHaveLength(2);
      expect(res.items[0]?.httpStatus).toBe(201);
    }
  });

  it('normalizes bulk body as top-level array', async () => {
    server.use(
      http.post('http://localhost/api/v1/bulk2', () =>
        HttpResponse.json(
          [
            { httpStatus: 200, body: { data: { type: 'w', id: '1' } } },
            { httpStatus: 409, body: { errors: [{ code: 'CONFLICT' }] } },
          ],
          { status: 207 },
        ),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const res = await client.post('/bulk2', {});
    expect(res.kind).toBe('multi-status');
    if (res.kind === 'multi-status') {
      expect(res.items).toHaveLength(2);
      expect(res.items[0]?.httpStatus).toBe(200);
      expect(res.items[1]?.httpStatus).toBe(409);
    }
  });
});
