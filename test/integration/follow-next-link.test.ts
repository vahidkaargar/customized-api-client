import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('follow links.next via getByUrl', () => {
  it('fetches absolute next URL', async () => {
    server.use(
      http.get('http://localhost/api/v1/widgets', ({ request }) => {
        const u = new URL(request.url);
        if (u.searchParams.get('page[cursor]') === 'abc') {
          return HttpResponse.json({ data: [{ type: 'widgets', id: '1' }] }, { status: 200 });
        }
        return HttpResponse.json(
          {
            data: [],
            links: {
              next: 'http://localhost/api/v1/widgets?page%5Bcursor%5D=abc',
            },
          },
          { status: 200 },
        );
      }),
    );

    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const p1 = await client.get('/widgets');
    if (p1.kind !== 'jsonapi-success') throw new Error('expected success');
    const next = p1.document.links?.next;
    expect(typeof next).toBe('string');
    if (typeof next !== 'string') throw new Error('missing next');
    const p2 = await client.getByUrl(next);
    expect(p2.kind).toBe('jsonapi-success');
    if (p2.kind === 'jsonapi-success') {
      expect(Array.isArray(p2.document.data) ? p2.document.data.length : 0).toBe(1);
    }
  });
});
