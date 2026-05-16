import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('deprecation headers', () => {
  it('invokes onDeprecated', async () => {
    const onDeprecated = vi.fn();
    server.use(
      http.get('http://localhost/api/v1/x', () =>
        HttpResponse.json(
          { data: { type: 't', id: '1' } },
          {
            status: 200,
            headers: {
              Deprecation: 'true',
              Sunset: 'Sat, 01 Jan 2030 00:00:00 GMT',
            },
          },
        ),
      ),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      onDeprecated,
    });
    await client.get('/x');
    expect(onDeprecated).toHaveBeenCalledTimes(1);
    expect(onDeprecated.mock.calls[0]?.[0]).toMatchObject({ deprecation: 'true' });
  });
});
