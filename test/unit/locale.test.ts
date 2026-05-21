import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acceptLanguageForRequest,
  createApiClient,
  localesMatch,
  normalizeAxiosResponse,
  normalizeLocaleCode,
  notifyLocaleMismatch,
  parseContentLanguage,
  readResponseContentLanguage,
  resolveAcceptLanguage,
  resolveLocaleProvider,
  resolveRequestLocale,
} from '../../src/index.ts';
import { server } from '../setup-msw.ts';
import type { AxiosResponse } from 'axios';

describe('locale helpers', () => {
  it('normalizeLocaleCode extracts primary subtag', () => {
    expect(normalizeLocaleCode('fr-FR')).toBe('fr');
    expect(normalizeLocaleCode('EN-us')).toBe('en');
    expect(normalizeLocaleCode('  de  ')).toBe('de');
    expect(normalizeLocaleCode('')).toBeUndefined();
    expect(normalizeLocaleCode('   ')).toBeUndefined();
  });

  it('parseContentLanguage takes first tag', () => {
    expect(parseContentLanguage('fr-CA, en;q=0.8')).toBe('fr-CA');
    expect(parseContentLanguage(undefined)).toBeUndefined();
    expect(parseContentLanguage(',fr')).toBeUndefined();
    expect(parseContentLanguage(';q=1')).toBeUndefined();
  });

  it('normalizeLocaleCode returns undefined for non-language tokens', () => {
    expect(normalizeLocaleCode('---')).toBeUndefined();
  });

  it('localesMatch compares base tags', () => {
    expect(localesMatch('de', 'de-DE')).toBe(true);
    expect(localesMatch('en', 'fr')).toBe(false);
    expect(localesMatch(undefined, 'en')).toBe(false);
  });

  it('acceptLanguageForRequest omits default locale', () => {
    expect(acceptLanguageForRequest('en', 'en')).toBeUndefined();
    expect(acceptLanguageForRequest('EN', 'en')).toBeUndefined();
    expect(acceptLanguageForRequest('fr', 'en')).toBe('fr');
    expect(acceptLanguageForRequest(undefined, 'en')).toBeUndefined();
  });

  it('resolveAcceptLanguage returns undefined when provider missing', async () => {
    expect(await resolveAcceptLanguage(undefined)).toBeUndefined();
    expect(await resolveAcceptLanguage(() => '')).toBeUndefined();
    expect(await resolveAcceptLanguage(() => '  fr  ')).toBe('fr');
  });

  it('readResponseContentLanguage reads flat headers', () => {
    expect(readResponseContentLanguage({ 'content-language': 'fr, en' })).toBe('fr');
  });

  it('resolveLocaleProvider prefers locale.getLocale', () => {
    const p = () => 'x';
    expect(resolveLocaleProvider(() => 'legacy', { getLocale: p })).toBe(p);
    expect(resolveLocaleProvider(() => 'legacy', undefined)).toBeTypeOf('function');
  });

  it('resolveRequestLocale prefers locale.getLocale', async () => {
    const v = await resolveRequestLocale(() => 'legacy', {
      getLocale: () => 'from-locale',
    });
    expect(v).toBe('from-locale');
  });

  it('notifyLocaleMismatch no-ops without handler or requested', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    notifyLocaleMismatch(undefined, { requested: 'en', resolved: 'fr' });
    notifyLocaleMismatch({ onLocaleMismatch: 'warn' }, { resolved: 'fr' });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('notifyLocaleMismatch warns or calls back', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const cb = vi.fn();
    notifyLocaleMismatch({ onLocaleMismatch: 'warn' }, {
      requested: 'en',
      resolved: 'fr',
    });
    expect(warn).toHaveBeenCalledOnce();
    notifyLocaleMismatch({ onLocaleMismatch: cb }, {
      requested: 'en',
      resolved: 'fr',
      url: '/x',
      method: 'get',
    });
    expect(cb).toHaveBeenCalledWith({
      requested: 'en',
      resolved: 'fr',
      url: '/x',
      method: 'get',
    });
    notifyLocaleMismatch({ onLocaleMismatch: cb }, {
      requested: 'de',
      resolved: 'de-DE',
    });
    expect(cb).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('surfaces Content-Language on success envelope', () => {
    const res = {
      status: 200,
      data: { data: { type: 'x', id: '1' } },
      headers: { 'content-language': 'fr-CA' },
      config: { url: '/x' },
    } as unknown as AxiosResponse<unknown>;
    const out = normalizeAxiosResponse(res, { requestUrl: 'https://h/x' });
    expect(out.kind).toBe('jsonapi-success');
    if (out.kind === 'jsonapi-success') {
      expect(out.headers.contentLanguage).toBe('fr-CA');
    }
  });
});

describe('locale client wiring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('locale.getLocale overrides deprecated getAcceptLanguage on wire', async () => {
    let lang: string | null = null;
    server.use(
      http.get('http://localhost/api/v1/locale-priority', ({ request }) => {
        lang = request.headers.get('accept-language');
        return HttpResponse.json({ data: { type: 't', id: '1' } });
      }),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      getAcceptLanguage: () => 'legacy',
      locale: { getLocale: () => 'fr' },
    });
    await client.get('/locale-priority');
    expect(lang).toBe('fr');
  });

  it('omits Accept-Language when locale matches defaultLocale', async () => {
    let lang: string | null = 'unset';
    server.use(
      http.get('http://localhost/api/v1/locale-omit', ({ request }) => {
        lang = request.headers.get('accept-language');
        return HttpResponse.json({ data: { type: 't', id: '1' } });
      }),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      locale: { getLocale: () => 'en', defaultLocale: 'en' },
    });
    await client.get('/locale-omit');
    expect(lang).toBeNull();
  });

  it('warns on Content-Language mismatch when default omitted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mismatches: unknown[] = [];
    server.use(
      http.get('http://localhost/api/v1/locale-mismatch', () =>
        HttpResponse.json(
          { data: { type: 't', id: '1' } },
          { headers: { 'Content-Language': 'fr' } },
        ),
      ),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      locale: {
        getLocale: () => 'en',
        defaultLocale: 'en',
        onLocaleMismatch: (ctx) => mismatches.push(ctx),
      },
    });
    await client.get('/locale-mismatch');
    expect(mismatches).toEqual([
      expect.objectContaining({ requested: 'en', resolved: 'fr' }),
    ]);
    warn.mockRestore();
  });

  it('does not report mismatch for matching base tags', async () => {
    const cb = vi.fn();
    server.use(
      http.get('http://localhost/api/v1/locale-match', () =>
        HttpResponse.json(
          { data: { type: 't', id: '1' } },
          { headers: { 'Content-Language': 'de-DE' } },
        ),
      ),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      locale: { getLocale: () => 'de', onLocaleMismatch: cb },
    });
    await client.get('/locale-match');
    expect(cb).not.toHaveBeenCalled();
  });

  it('reports mismatch on error response with Content-Language', async () => {
    const cb = vi.fn();
    server.use(
      http.get('http://localhost/api/v1/locale-err', () =>
        HttpResponse.json(
          { errors: [{ status: '404', title: 'Not Found' }] },
          { status: 404, headers: { 'Content-Language': 'fr' } },
        ),
      ),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      locale: { getLocale: () => 'en', onLocaleMismatch: cb },
    });
    await expect(client.get('/locale-err')).rejects.toThrow();
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ requested: 'en', resolved: 'fr' }),
    );
  });

  it('onLocaleMismatch warn for en vs fr', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    server.use(
      http.get('http://localhost/api/v1/locale-warn', () =>
        HttpResponse.json(
          { data: { type: 't', id: '1' } },
          { headers: { 'Content-Language': 'fr' } },
        ),
      ),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      locale: { getLocale: () => 'en', onLocaleMismatch: 'warn' },
    });
    await client.get('/locale-warn');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('legacy getAcceptLanguage still sets header', async () => {
    let lang: string | null = null;
    server.use(
      http.get('http://localhost/api/v1/locale-legacy', ({ request }) => {
        lang = request.headers.get('accept-language');
        return HttpResponse.json({ data: { type: 't', id: '1' } });
      }),
    );
    const client = createApiClient({
      baseURL: 'http://localhost/api/v1',
      getAcceptLanguage: () => 'de-DE',
    });
    await client.get('/locale-legacy');
    expect(lang).toBe('de-DE');
  });
});
