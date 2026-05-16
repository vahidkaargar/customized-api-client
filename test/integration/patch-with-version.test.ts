import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('patchWithVersion', () => {
  it('sends If-Match and surfaces 412', async () => {
    let ifMatch: string | null = null;
    server.use(
      http.patch('http://localhost/api/v1/widgets/1', ({ request }) => {
        ifMatch = request.headers.get('If-Match');
        return HttpResponse.json({ errors: [{ code: 'STALE_VERSION' }] }, { status: 412 });
      }),
    );

    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await expect(client.patchWithVersion('/widgets/1', { data: {} }, 7)).rejects.toMatchObject({
      status: 412,
    });
    expect(ifMatch).toBe('"v=7"');
  });
});
