import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('AbortSignal cancellation', () => {
  it('aborts request mid-flight and throws', async () => {
    server.use(
      http.get('http://localhost/api/v1/slow', async () => {
        // 5 second delay
        await new Promise((r) => {
          setTimeout(r, 5000);
        });
        return HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 });
      }),
    );

    const controller = new AbortController();
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });

    // Abort after 50ms
    setTimeout(() => {
      controller.abort();
    }, 50);

    await expect(
      client.get('/slow', { signal: controller.signal }),
    ).rejects.toThrow();
  });

  it('safe variant rethrows non-ApiClientError on abort', async () => {
    server.use(
      http.get('http://localhost/api/v1/slow2', async () => {
        await new Promise((r) => {
          setTimeout(r, 5000);
        });
        return HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 });
      }),
    );

    const controller = new AbortController();
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });

    setTimeout(() => {
      controller.abort();
    }, 50);

    // AbortError is not ApiClientError, so safe* rethrows it
    await expect(
      client.safeGet('/slow2', { signal: controller.signal }),
    ).rejects.toThrow();
  });
});
