import { afterEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import { http, HttpResponse } from 'msw';
import {
  ApiClientError,
  applyTransformKeys,
  createApiClient,
  flattenAxiosHeaders,
  groupValidationErrorsByPointer,
  indexIncluded,
  isApiClientError,
  isRetryablePerPolicy,
  parseJsonApiErrorBody,
  parseMultiStatusBody,
  parsePaginationKind,
  pollAsyncResult,
  resolveAcceptedLocation,
  resolveAcceptLanguage,
  resolveAuthorizationHeader,
  retryAllowed,
  buildJsonApiQuery,
} from '../../src/index.ts';
import type { JsonApiDocument } from '../../src/index.ts';
import { server } from '../setup-msw.ts';
import * as retryModule from '../../src/retry/execute-with-retry.ts';

describe('coverage 100% gaps', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('readHeader array and request absolute URL', async () => {
    server.use(
      http.get('https://other.example/items/1', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const res = await client.request({
      method: 'GET',
      url: 'https://other.example/items/1',
    });
    expect(res.kind).toBe('jsonapi-success');

    server.use(
      http.post('http://localhost/api/v1/m', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    await client.request({
      method: 'POST',
      url: '/m',
      headers: { 'Idempotency-Key': ['from-array-key'] },
    });

    server.use(
      http.post('http://localhost/api/v1/opt-key', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
      http.get('http://localhost/api/v1/no-headers', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
      http.get('http://localhost/api/v1/implicit-get', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
      http.get('http://localhost/api/v1/', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
      http.post('http://localhost/api/v1/lc-key', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    await client.request(
      { method: 'POST', url: '/opt-key' },
      { idempotencyKey: 'opts-win' },
    );
    await client.request({ method: 'GET', url: '/no-headers', headers: undefined });
    await client.request({ url: '/implicit-get' });
    await client.request({ method: 'GET' });
    await client.request({
      method: 'POST',
      url: '/lc-key',
      headers: { 'idempotency-key': 'lower-key' },
    });
  });

  it('perform normalizes axios error with response', async () => {
    const err = new AxiosError('fail', undefined, undefined, undefined, {
      status: 404,
      data: { errors: [{ code: 'NOT_FOUND', detail: 'missing' }] },
      headers: {},
      config: { url: '/z', baseURL: 'http://localhost/api/v1' },
      statusText: 'Not Found',
    } as AxiosResponse);
    vi.spyOn(retryModule, 'dispatchWithRetry').mockRejectedValueOnce(err);

    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await expect(client.get('/z')).rejects.toMatchObject({ status: 404 });
  });

  it('perform axios-error path invokes onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    const err = new AxiosError('fail', undefined, undefined, undefined, {
      status: 401,
      data: { errors: [{ code: 'UNAUTHENTICATED' }] },
      headers: {},
      config: {},
      statusText: 'Unauthorized',
    } as AxiosResponse);
    vi.spyOn(retryModule, 'dispatchWithRetry').mockRejectedValueOnce(err);

    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      onUnauthorized,
    });
    await expect(client.get('/auth')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('perform rethrows non-axios errors', async () => {
    vi.spyOn(retryModule, 'dispatchWithRetry').mockRejectedValueOnce(new Error('plain'));
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    await expect(client.get('/plain')).rejects.toThrow('plain');
  });

  it('safe* rethrows non-ApiClientError', async () => {
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    vi.spyOn(client, 'get').mockRejectedValueOnce(new Error('not api'));
    await expect(client.safeGet('/x')).rejects.toThrow('not api');
  });

  it('buildRequestUrl fallback via invalid response config', async () => {
    vi.spyOn(retryModule, 'dispatchWithRetry').mockResolvedValueOnce({
      status: 200,
      data: { data: { type: 't', id: '1' } },
      headers: {},
      config: { url: 'relative', baseURL: '::invalid::' },
    } as AxiosResponse);
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const res = await client.get('/fallback-url');
    expect(res.kind).toBe('jsonapi-success');
  });

  it('response interceptor wraps non-Error rejections', async () => {
    let rejectHandler: ((err: unknown) => unknown) | undefined;
    const origCreate = axios.create.bind(axios);
    const createSpy = vi.spyOn(axios, 'create').mockImplementation((cfg) => {
      const instance = origCreate(cfg);
      const origUse = instance.interceptors.response.use.bind(instance.interceptors.response);
      vi.spyOn(instance.interceptors.response, 'use').mockImplementation((onFulfilled, onRejected) => {
        if (onRejected) {
          rejectHandler = (err: unknown) => onRejected(err);
        }
        return origUse(onFulfilled, onRejected);
      });
      return instance;
    });
    createApiClient({ baseURL: 'http://localhost/api/v1' });
    if (!rejectHandler) throw new Error('expected reject handler');
    await expect(rejectHandler('plain')).rejects.toBeInstanceOf(Error);
    await expect(rejectHandler('plain')).rejects.toThrow('plain');
    await expect(rejectHandler({ reason: 'obj' })).rejects.toThrow('[object Object]');
    createSpy.mockRestore();
  });

  it('warnInsecureBaseUrl skips invalid baseURL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    createApiClient({ baseURL: 'not-a-valid-url' });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('request interceptor sets Authorization and Accept-Language', async () => {
    let auth: string | null = null;
    let lang: string | null = null;
    server.use(
      http.get('http://localhost/api/v1/auth-lang', ({ request }) => {
        auth = request.headers.get('authorization');
        lang = request.headers.get('accept-language');
        return HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 });
      }),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      auth: { type: 'bearer', getToken: () => 'wire-tok' },
      getAcceptLanguage: () => 'de-DE',
    });
    await client.get('/auth-lang');
    expect(auth).toBe('Bearer wire-tok');
    expect(lang).toBe('de-DE');
  });
});

describe('coverage 100% helpers and parse', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolveAcceptedLocation catch returns raw loc', () => {
    expect(resolveAcceptedLocation({ location: '%' }, ':::not-base')).toBe('%');
  });

  it('parseMultiStatusBody wraps non-array object', () => {
    const items = parseMultiStatusBody({ foo: 1 });
    expect(items).toEqual([{ httpStatus: 500, body: { foo: 1 } }]);
  });

  it('parseMultiStatusBody ignores non-array items property', () => {
    const items = parseMultiStatusBody({ items: 'not-an-array' });
    expect(items).toEqual([{ httpStatus: 500, body: { items: 'not-an-array' } }]);
  });

  it('parseJsonApiErrorBody invalid Retry-After date string', () => {
    const e = parseJsonApiErrorBody(
      429,
      { errors: [{ code: 'RATE' }] },
      { 'retry-after': 'not-a-valid-date' },
      'GET',
    );
    expect(e.retryAfterSeconds).toBeUndefined();
  });

  it('parseJsonApiErrorBody numeric Retry-After', () => {
    const e = parseJsonApiErrorBody(
      429,
      { errors: [{ code: 'RATE' }] },
      { 'retry-after': '120' },
      'GET',
    );
    expect(e.retryAfterSeconds).toBe(120);
  });

  it('parsePaginationKind legacy URL catch and extractQueryParam catch', () => {
    expect(parsePaginationKind({}, { next: '::::' }).kind).toBe('unknown');
    expect(parsePaginationKind({}, { next: 'http://[::1' }).kind).toBe('unknown');
  });

  it('parsePaginationKind page[number] in links', () => {
    const k = parsePaginationKind(
      {},
      { next: 'https://api.test/items?page%5Bnumber%5D=2&per_page=10' },
    );
    expect(k.kind).toBe('offset');
    if (k.kind === 'offset') expect(k.page).toBe(2);
  });

  it('parsePaginationKind meta defaults and page field', () => {
    expect(parsePaginationKind(undefined, undefined).kind).toBe('unknown');
    const k = parsePaginationKind({ page: 4, last_page: 10 }, {});
    expect(k.kind).toBe('offset');
    if (k.kind === 'offset') expect(k.page).toBe(4);
    const c = parsePaginationKind({ has_more: true }, {});
    expect(c.kind).toBe('cursor');
    if (c.kind === 'cursor') expect(c.hasMore).toBe(true);
    const defaultPage = parsePaginationKind({ last_page: 3, total: 30 }, {});
    expect(defaultPage.kind).toBe('offset');
    if (defaultPage.kind === 'offset') expect(defaultPage.page).toBe(1);
    const legacyDefault = parsePaginationKind(
      {},
      { next: 'https://api.test/items?per_page=10' },
    );
    expect(legacyDefault.kind).toBe('offset');
    if (legacyDefault.kind === 'offset') expect(legacyDefault.page).toBe(1);
  });

  it('flattenAxiosHeaders skips empty header arrays', () => {
    expect(flattenAxiosHeaders(undefined)).toEqual({});
    expect(flattenAxiosHeaders({ 'X-Test': [] })).toEqual({});
    expect(flattenAxiosHeaders({ 'X-Ok': ['a', 'b'] })).toEqual({ 'x-ok': 'a' });
  });

  it('applyTransformKeys single resource without attributes/meta', () => {
    const doc = { data: { type: 'w', id: '1' } } as JsonApiDocument;
    const o = applyTransformKeys(doc, 'camelCase-attributes-meta');
    expect(o.data).toEqual({ type: 'w', id: '1' });
  });

  it('applyTransformKeys null data without meta', () => {
    const doc = { data: null } as JsonApiDocument;
    expect(applyTransformKeys(doc, 'camelCase-attributes-meta').data).toBeNull();
  });

  it('applyTransformKeys array without document meta', () => {
    const doc = {
      data: [{ type: 'w', id: '1', attributes: { a_b: 1 } }],
    } as JsonApiDocument;
    const o = applyTransformKeys(doc, 'camelCase-attributes-meta');
    const d = o.data as unknown as { attributes: { aB: number } }[];
    expect(d[0]?.attributes.aB).toBe(1);
  });

  it('applyTransformKeys array with document meta and single resource meta', () => {
    const arrDoc = {
      data: [{ type: 'w', id: '1', attributes: { x_y: 1 } }],
      meta: { doc_meta: 1 },
    } as JsonApiDocument;
    const arrOut = applyTransformKeys(arrDoc, 'camelCase-attributes-meta');
    expect('docMeta' in (arrOut.meta as object)).toBe(true);

    const single = {
      data: { type: 'w', id: '1', attributes: { a_b: 1 }, meta: { res_meta: 2 } },
    } as JsonApiDocument;
    const singleOut = applyTransformKeys(single, 'camelCase-attributes-meta');
    const d = singleOut.data as unknown as { meta: { resMeta: number } };
    expect(d.meta.resMeta).toBe(2);

    const bare = { data: { type: 'w', id: '1' } } as JsonApiDocument;
    expect(applyTransformKeys(bare, 'camelCase-attributes-meta').meta).toBeUndefined();
  });

  it('retryAllowed GET status buckets and undefined status', () => {
    expect(retryAllowed({ method: 'GET', isNetworkError: false })).toBe(false);
    expect(retryAllowed({ method: 'GET', status: 408, isNetworkError: false })).toBe(true);
    expect(retryAllowed({ method: 'GET', status: 502, isNetworkError: false })).toBe(true);
    expect(retryAllowed({ method: 'GET', status: 503, isNetworkError: false })).toBe(true);
    expect(retryAllowed({ method: 'GET', status: 504, isNetworkError: false })).toBe(true);
    expect(retryAllowed({ method: 'GET', status: 501, isNetworkError: false })).toBe(true);
    expect(retryAllowed({ method: 'GET', status: 404, isNetworkError: false })).toBe(false);
  });

  it('dispatchWithRetry throws when maxAttempts is 0', async () => {
    const instance = axios.create({ validateStatus: () => true });
    await expect(
      retryModule.dispatchWithRetry(
        instance,
        { method: 'GET', url: '/x' },
        { retry: { maxAttempts: 0 } },
      ),
    ).rejects.toThrow('exhausted without response');
  });

  it('dispatchWithRetry throws network error on last attempt', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const netErr = Object.assign(new Error('Network'), {
      isAxiosError: true,
      response: undefined,
    });
    vi.spyOn(instance, 'request').mockRejectedValue(netErr);
    await expect(
      retryModule.dispatchWithRetry(
        instance,
        { method: 'GET', url: '/x' },
        { retry: { maxAttempts: 1, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 } },
      ),
    ).rejects.toBe(netErr);
  });

  it('dispatchWithRetry defaults method to GET and retries POST network errors', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const netErr = Object.assign(new Error('Network'), {
      isAxiosError: true,
      response: undefined,
    });
    const req = vi.spyOn(instance, 'request');
    req
      .mockRejectedValueOnce(netErr)
      .mockRejectedValueOnce(netErr)
      .mockResolvedValueOnce({ status: 200, data: {}, headers: {}, config: {} });

    const res = await retryModule.dispatchWithRetry(
      instance,
      { url: '/x' },
      { retry: { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 5, jitterRatio: 0 } },
    );
    expect(res.status).toBe(200);
    expect(req).toHaveBeenCalledTimes(3);
  });

  it('dispatchWithRetry rejects non-object network errors', async () => {
    const instance = axios.create({ validateStatus: () => true });
    vi.spyOn(instance, 'request').mockRejectedValueOnce('fail');
    await expect(
      retryModule.dispatchWithRetry(
        instance,
        { method: 'GET', url: '/x' },
        { retry: { maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 } },
      ),
    ).rejects.toBe('fail');
  });

  it('dispatchWithRetry uses getPrimaryErrorCodeFromBody hook', async () => {
    const instance = axios.create({ validateStatus: () => true });
    const req = vi.spyOn(instance, 'request');
    req
      .mockResolvedValueOnce({
        status: 409,
        data: {},
        headers: {},
        config: { method: 'POST' },
      })
      .mockResolvedValueOnce({ status: 200, data: {}, headers: {}, config: {} });

    const res = await retryModule.dispatchWithRetry(
      instance,
      { method: 'POST', url: '/x' },
      {
        retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 5, jitterRatio: 0 },
        getPrimaryErrorCodeFromBody: () => 'IDEMPOTENCY_REQUEST_IN_PROGRESS',
      },
    );
    expect(res.status).toBe(200);
    expect(req).toHaveBeenCalledTimes(2);
  });

  it('guards isRetryablePerPolicy false for non-errors', () => {
    expect(isRetryablePerPolicy('x')).toBe(false);
    expect(
      isRetryablePerPolicy(new ApiClientError(500, [{ code: 'X' }], 'X', {}, undefined)),
    ).toBe(true);
  });

  it('ApiClientError message fallbacks and toJSON without headers', () => {
    const e1 = new ApiClientError(400, [{ title: 'T' }]);
    expect(e1.message).toContain('T');
    const e2 = new ApiClientError(400, [{ code: 'ONLY_CODE' }]);
    expect(e2.message).toContain('ONLY_CODE');
    const e3 = new ApiClientError(418, []);
    expect(e3.message).toContain('418');
    expect(e3.toJSON().responseHeaders).toBeUndefined();
    expect(isApiClientError(e3)).toBe(true);
    expect(isApiClientError({})).toBe(false);
  });

  it('resolveAcceptLanguage null provider value', async () => {
    expect(await resolveAcceptLanguage(() => null)).toBeUndefined();
  });

  it('resolveAuthorizationHeader partner null secret', async () => {
    expect(
      await resolveAuthorizationHeader({
        type: 'partner-bearer',
        getSecret: () => null,
      }),
    ).toBeUndefined();
  });

  it('indexIncluded undefined', () => {
    expect(indexIncluded(undefined).size).toBe(0);
  });

  it('groupValidationErrorsByPointer uses code fallback', () => {
    const g = groupValidationErrorsByPointer([{ code: 'ERR_ONLY' }]);
    expect(g['/']?.[0]).toBe('ERR_ONLY');
    const t = groupValidationErrorsByPointer([{ code: 'X', title: 'Title only' }]);
    expect(t['/']?.[0]).toBe('Title only');
    const d = groupValidationErrorsByPointer([{ code: 'X', detail: 'Detail wins' }]);
    expect(d['/']?.[0]).toBe('Detail wins');
  });

  it('buildJsonApiQuery skips undefined filter values', () => {
    const q = buildJsonApiQuery({ filter: { a: '1', b: undefined } });
    expect(q['filter[a]']).toBe('1');
    expect(q['filter[b]']).toBeUndefined();
  });

  it('pollAsyncResult uses default options', async () => {
    server.use(
      http.get('http://localhost/api/v1/def', () =>
        HttpResponse.json({ data: { type: 't', id: '1' } }, { status: 200 }),
      ),
    );
    const client = createApiClient({ baseURL: 'http://localhost/api/v1' });
    const done = await pollAsyncResult(client, {
      kind: 'accepted',
      status: 202,
      location: 'http://localhost/api/v1/def',
      headers: {
        idempotentReplayed: false,
        retryAfterSeconds: undefined,
        etag: undefined,
        contentLanguage: undefined,
      },
    });
    expect(done.kind).toBe('jsonapi-success');
  });

  it('normalizeHeaders idempotent-replayed True', async () => {
    const onIdempotencyReplay = vi.fn();
    server.use(
      http.get('http://localhost/api/v1/true-replay', () =>
        HttpResponse.json(
          { data: { type: 't', id: '1' } },
          { status: 200, headers: { 'Idempotent-Replayed': 'true' } },
        ),
      ),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      onIdempotencyReplay,
    });
    const res = await client.get('/true-replay');
    if (res.kind === 'jsonapi-success') {
      expect(res.headers.idempotentReplayed).toBe(true);
    }
    expect(onIdempotencyReplay).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/true-replay', method: 'get' }),
    );
  });
});
