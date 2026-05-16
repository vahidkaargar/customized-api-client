import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/index.ts';
import type { JsonApiResourceObject } from '../../src/types/jsonapi.ts';
import { server } from '../setup-msw.ts';

describe('transformResponseKeys on client', () => {
  it('camelCases attributes in jsonapi-success', async () => {
    server.use(
      http.get('http://localhost/api/v1/w/1', () =>
        HttpResponse.json(
          { data: { type: 'widgets', id: '1', attributes: { my_field: 'a' } } },
          { status: 200 },
        ),
      ),
    );

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      transformResponseKeys: 'camelCase-attributes-meta',
    });
    const res = await client.get('/w/1');
    expect(res.kind).toBe('jsonapi-success');
    if (res.kind === 'jsonapi-success') {
      const d = res.document.data;
      if (!d || Array.isArray(d)) throw new Error('expected single resource');
      const resource = d as JsonApiResourceObject;
      const attrs = resource.attributes as { myField?: string } | undefined;
      expect(attrs?.myField).toBe('a');
    }
  });
});
