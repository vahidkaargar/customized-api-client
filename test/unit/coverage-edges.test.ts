import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { JsonApiDocument } from '../../src/types/jsonapi.ts';
import {
  ApiClientError,
  applyTransformKeys,
  createApiClient,
  etagFromResponseHeaders,
  flattenAxiosHeaders,
  formatIfMatch,
  normalizeAxiosResponse,
  normalizeHttpUrl,
  parseJsonApiDocument,
  parseJsonApiErrorBody,
  parseMultiStatusBody,
  pollAsyncResult,
  resolveAcceptedLocation,
  resolveAcceptLanguage,
  parsePaginationKind,
  parseRetryAfterSeconds,
  retryAllowed,
  dispatchWithRetry,
  truncateForLog,
} from '../../src/index.ts';
import { server } from '../setup-msw.ts';

describe('coverage edge cases', () => {
  it('normalize rejects unsupported 2xx', () => {
    const res = {
      status: 203,
      data: {},
      headers: {},
      config: {},
    } as AxiosResponse<unknown>;
    expect(() => normalizeAxiosResponse(res, { requestUrl: 'https://h/x' })).toThrow(ApiClientError);
  });

  it('flattenAxiosHeaders: Headers API', () => {
    const h = new Headers();
    h.set('ETag', 'W/"v=1"');
    expect(flattenAxiosHeaders(h).etag).toBe('W/"v=1"');
  });

  it('resolveAcceptedLocation without header uses requestUrl', () => {
    expect(resolveAcceptedLocation({}, 'https://base/original')).toBe('https://base/original');
  });

  it('resolveAcceptedLocation keeps loc when URL parser fails', () => {
    expect(resolveAcceptedLocation({ location: '::not-a-url' }, 'https://base/r')).toBe(
      'https://base/::not-a-url',
    );
  });

  it('parseJsonApiDocument throws on bad input', () => {
    expect(() => parseJsonApiDocument(null)).toThrow();
    expect(() => parseJsonApiDocument({})).toThrow();
  });

  it('parseMultiStatusBody wraps unknown array items', () => {
    const items = parseMultiStatusBody([1, { x: 1 }]);
    expect(items.length).toBeGreaterThan(0);
  });

  it('etagFromResponseHeaders', () => {
    expect(etagFromResponseHeaders({ etag: 'W/"v=2"' })).toBe('W/"v=2"');
  });

  it('formatIfMatch rejects invalid version', () => {
    expect(() => formatIfMatch(-1)).toThrow();
  });

  it('normalizeHttpUrl passthrough', () => {
    expect(normalizeHttpUrl('http://a')).toBe('http://a');
  });

  it('parseJsonApiErrorBody JSON null object', () => {
    const e = parseJsonApiErrorBody(400, 'null', {}, 'GET');
    expect(e.primaryCode).toBe('INVALID_ERROR_DOCUMENT');
  });

  it('parseJsonApiErrorBody object non-conforming', () => {
    const e = parseJsonApiErrorBody(500, { foo: 1 }, {}, 'GET');
    expect(e.primaryCode).toBe('MISSING_ERRORS_ARRAY');
  });

  it('applyTransformKeys maps primary array data', () => {
    const doc = {
      data: [
        { type: 'w', id: '1', attributes: { my_field: 1 } },
        { type: 'w', id: '2', attributes: { b_c: 2 } },
      ],
    } as JsonApiDocument;
    const o = applyTransformKeys(doc, 'camelCase-attributes-meta');
    const arr = o.data as unknown as readonly { attributes: Record<string, unknown> }[];
    expect(arr.length).toBe(2);
    const first = arr[0];
    const second = arr[1];
    if (!first || !second) throw new Error('expected two resources');
    expect(first.attributes.myField).toBe(1);
    expect(second.attributes.bC).toBe(2);
  });

  it('applyTransformKeys handles data null with meta', () => {
    const doc = { data: null, meta: { foo_bar: 1 } } as JsonApiDocument;
    const o = applyTransformKeys(doc, 'camelCase-attributes-meta');
    expect(o.meta && 'fooBar' in (o.meta as object)).toBe(true);
  });

  it('resolveAcceptLanguage async provider', async () => {
    await expect(resolveAcceptLanguage(() => Promise.resolve('en-US'))).resolves.toBe('en-US');
  });

  it('pollAsyncResult exhausts attempts', async () => {
    server.use(
      http.get('http://localhost/api/v1/loop', () =>
        HttpResponse.json(
          {},
          { status: 202, headers: { Location: 'http://localhost/api/v1/loop' } },
        ),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await expect(
      pollAsyncResult(
        client,
        {
          kind: 'accepted',
          status: 202,
          location: 'http://localhost/api/v1/loop',
          headers: {
            idempotentReplayed: false,
            retryAfterSeconds: undefined,
            etag: undefined,
            contentLanguage: undefined,
          },
        },
        { maxAttempts: 3, delayMs: 1 },
      ),
    ).rejects.toThrow('max attempts');
  });

  it('parsePaginationKind unknown', () => {
    expect(parsePaginationKind({}, {}).kind).toBe('unknown');
  });

  it('parseRetryAfterSeconds invalid date', () => {
    expect(parseRetryAfterSeconds('not-a-date')).toBeUndefined();
  });

  it('retryAllowed 409 without known code', () => {
    expect(
      retryAllowed({ method: 'POST', status: 409, primaryErrorCode: 'OTHER', isNetworkError: false }),
    ).toBe(false);
  });

  it('truncateForLog handles circular refs', () => {
    const o: { self?: unknown } = {};
    o.self = o;
    expect(truncateForLog(o, 100)).toBe('[Unserializable]');
  });

  it('dispatchWithRetry retries network errors on GET', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const netErr = Object.assign(new Error('Network'), {
      isAxiosError: true,
      response: undefined,
    });
    const req = vi.spyOn(instance, 'request');
    req.mockRejectedValueOnce(netErr).mockResolvedValueOnce({
      status: 200,
      data: {},
      headers: {},
      config: {},
    });

    const res = await dispatchWithRetry(
      instance,
      { method: 'GET', url: '/x' },
      { retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 } },
    );
    expect(res.status).toBe(200);
    expect(req).toHaveBeenCalledTimes(2);
  });
});
