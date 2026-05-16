import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient, pollAsyncResult } from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('202 accepted poll', () => {
  it('follows Location until 200', async () => {
    let p1Hits = 0;
    server.use(
      http.post('http://localhost/api/v1/jobs', () =>
        HttpResponse.json({}, { status: 202, headers: { Location: 'http://localhost/api/v1/jobs/p1' } }),
      ),
      http.get('http://localhost/api/v1/jobs/p1', () => {
        p1Hits += 1;
        if (p1Hits === 1) {
          return HttpResponse.json({}, { status: 202, headers: { Location: '/api/v1/jobs/p2' } });
        }
        return HttpResponse.json({ data: { type: 'jobs', id: 'done' } }, { status: 200 });
      }),
      http.get('http://localhost/api/v1/jobs/p2', () =>
        HttpResponse.json({ data: { type: 'jobs', id: 'done' } }, { status: 200 }),
      ),
    );

    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const first = await client.post('/jobs', {});
    if (first.kind !== 'accepted') throw new Error('expected accepted');
    const done = await pollAsyncResult(client, first, { maxAttempts: 5, delayMs: 1 });
    expect(done.kind).toBe('jsonapi-success');
  });
});
