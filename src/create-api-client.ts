import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from 'axios';
import type { ApiClientConfig, BaseUrlMode } from './types/config.ts';
import { DEFAULT_TIMEOUT_MS } from './types/config.ts';
import { applyJsonApiHeaders } from './headers/jsonapi-headers.ts';
import { resolveAuthorizationHeader } from './headers/auth.ts';
import { resolveAcceptLanguage } from './headers/locale.ts';
import {
  assertValidIdempotencyKey,
  defaultIdempotencyKey,
  isMutationMethod,
} from './headers/idempotency.ts';
import { formatIfMatch } from './headers/if-match.ts';
import { resolveResourcePath } from './headers/resolve-url.ts';
import { dispatchWithRetry } from './retry/execute-with-retry.ts';
import { normalizeAxiosResponse } from './http/normalize-response.ts';
import type { ClientSuccess } from './types/results.ts';
import type { Result } from './types/results.ts';
import { ApiClientError } from './types/api-client-error.ts';
import { flattenAxiosHeaders } from './http/header-utils.ts';
import { parseDeprecationHeaders } from './helpers/deprecation.ts';

export interface RequestCallOptions {
  readonly idempotencyKey?: string;
  readonly ifMatchVersion?: number;
  readonly signal?: AbortSignal;
}

export interface ApiClient {
  readonly get: (path: string, opts?: RequestCallOptions) => Promise<ClientSuccess>;
  readonly head: (path: string, opts?: RequestCallOptions) => Promise<ClientSuccess>;
  readonly post: (path: string, data?: unknown, opts?: RequestCallOptions) => Promise<ClientSuccess>;
  readonly patch: (path: string, data?: unknown, opts?: RequestCallOptions) => Promise<ClientSuccess>;
  readonly put: (path: string, data?: unknown, opts?: RequestCallOptions) => Promise<ClientSuccess>;
  readonly delete: (path: string, opts?: RequestCallOptions) => Promise<ClientSuccess>;
  readonly request: (
    ax: AxiosRequestConfig,
    opts?: RequestCallOptions,
  ) => Promise<ClientSuccess>;
  readonly getByUrl: (fullUrl: string, opts?: RequestCallOptions) => Promise<ClientSuccess>;
  readonly patchWithVersion: (
    path: string,
    data: unknown,
    version: number,
    opts?: Omit<RequestCallOptions, 'ifMatchVersion'>,
  ) => Promise<ClientSuccess>;
  readonly safeGet: (
    path: string,
    opts?: RequestCallOptions,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
  readonly safePost: (
    path: string,
    data?: unknown,
    opts?: RequestCallOptions,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
  readonly safePatch: (
    path: string,
    data?: unknown,
    opts?: RequestCallOptions,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
  readonly safePut: (
    path: string,
    data?: unknown,
    opts?: RequestCallOptions,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
  readonly safeDelete: (
    path: string,
    opts?: RequestCallOptions,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
  readonly safeHead: (
    path: string,
    opts?: RequestCallOptions,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
  readonly safeRequest: (
    ax: AxiosRequestConfig,
    opts?: RequestCallOptions,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
  readonly safeGetByUrl: (
    fullUrl: string,
    opts?: RequestCallOptions,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
  readonly safePatchWithVersion: (
    path: string,
    data: unknown,
    version: number,
    opts?: Omit<RequestCallOptions, 'ifMatchVersion'>,
  ) => Promise<Result<ClientSuccess, ApiClientError>>;
}

function readHeader(ax: AxiosRequestConfig, name: string): string | undefined {
  const h = ax.headers as Record<string, string | string[] | undefined> | undefined;
  /* v8 ignore next -- axios always provides a headers object on configs we pass */
  if (!h) return undefined;
  const v = h[name] ?? h[name.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  /* v8 ignore next -- non-string header values are ignored */
  return typeof v === 'string' ? v : undefined;
}

function buildRequestUrl(cfg: AxiosRequestConfig, fallback: string): string {
  if (typeof cfg.url === 'string' && /^https?:\/\//i.test(cfg.url)) {
    return cfg.url;
  }
  const base = cfg.baseURL ?? '';
  const p = cfg.url ?? '';
  try {
    return new URL(p, base).href;
  } catch {
    return fallback;
  }
}

function warnInsecureBaseUrl(baseURL: string): void {
  try {
    const u = new URL(baseURL);
    if (u.protocol !== 'http:') return;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return;
    console.warn(
      '[@vahidkaargar/customized-api-client] baseURL uses HTTP outside localhost; prefer HTTPS in production.',
    );
  } catch {
    /* invalid URL — skip */
  }
}

async function safe(
  fn: () => Promise<ClientSuccess>,
): Promise<Result<ClientSuccess, ApiClientError>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (e) {
    if (e instanceof ApiClientError) {
      return { ok: false, error: e };
    }
    throw e;
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const mode: BaseUrlMode = config.baseUrlMode ?? 'modeB';
  const genKey = config.generateIdempotencyKey ?? defaultIdempotencyKey;
  warnInsecureBaseUrl(config.baseURL);

  const instance: AxiosInstance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
    validateStatus: () => true,
    headers: {
      Accept: 'application/vnd.api+json',
      ...config.defaultHeaders,
    },
  });

  instance.interceptors.request.use(async (req) => {
    /* v8 ignore next -- axios sets method on InternalAxiosRequestConfig */
    const method = (req.method ?? 'get').toUpperCase();
    const next = applyJsonApiHeaders(req, method);
    const authHeader = await resolveAuthorizationHeader(config.auth);
    if (authHeader) {
      (next.headers as Record<string, string>).Authorization = authHeader;
    }
    const lang = await resolveAcceptLanguage(config.getAcceptLanguage);
    if (lang) {
      (next.headers as Record<string, string>)['Accept-Language'] = lang;
    }
    if (isMutationMethod(method)) {
      const h = next.headers as Record<string, string | undefined>;
      const existing = h['Idempotency-Key'] ?? h['idempotency-key'];
      const key = typeof existing === 'string' && existing.length > 0 ? existing : genKey();
      assertValidIdempotencyKey(key);
      (next.headers as Record<string, string>)['Idempotency-Key'] = key;
    }
    return next;
  });

  instance.interceptors.response.use(
    (res) => {
      const flat = flattenAxiosHeaders(res.headers);
      if (flat['idempotent-replayed'] === 'true' && config.onIdempotencyReplay) {
        config.onIdempotencyReplay({
          /* v8 ignore start -- @preserve axios config url/method are strings */
          url: typeof res.config.url === 'string' ? res.config.url : undefined,
          method: typeof res.config.method === 'string' ? res.config.method : undefined,
          /* v8 ignore stop -- @preserve */
        });
      }
      const dep = parseDeprecationHeaders(res.headers);
      if (dep && config.onDeprecated) {
        config.onDeprecated(dep);
      }
      return res;
    },
    (err: unknown) =>
      Promise.reject(
        /* v8 ignore next -- axios rejects with Error; non-Error is defensive */
        err instanceof Error ? err : new Error(String(err)),
      ),
  );

  function resolvePath(path: string): string {
    return resolveResourcePath(config.baseURL, path, mode);
  }

  async function perform(
    method: string,
    url: string,
    options: RequestCallOptions & { readonly data?: unknown },
  ): Promise<ClientSuccess> {
    const headers: Record<string, string> = {};
    if (options.idempotencyKey !== undefined) {
      assertValidIdempotencyKey(options.idempotencyKey);
      headers['Idempotency-Key'] = options.idempotencyKey;
    }
    if (options.ifMatchVersion !== undefined) {
      headers['If-Match'] = formatIfMatch(options.ifMatchVersion);
    }

    const axConfig: AxiosRequestConfig = {
      method,
      url,
      data: options.data,
      headers: { ...headers },
      ...(options.signal && { signal: options.signal }),
    };

    try {
      const response = await dispatchWithRetry(instance, axConfig, {
        retry: config.retry,
      });
      try {
        return normalizeAxiosResponse(response, {
          transformResponseKeys: config.transformResponseKeys,
          requestUrl: buildRequestUrl(response.config, url),
          requestMethod: method.toUpperCase(),
        });
      } catch (e: unknown) {
        if (e instanceof ApiClientError && e.status === 401 && config.onUnauthorized) {
          await config.onUnauthorized(e);
        }
        throw e;
      }
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response) {
        const res = err.response as AxiosResponse<unknown>;
        try {
          return normalizeAxiosResponse(res, {
            transformResponseKeys: config.transformResponseKeys,
            requestUrl: buildRequestUrl(res.config, url),
            requestMethod: method.toUpperCase(),
          });
        } catch (e: unknown) {
          if (e instanceof ApiClientError && e.status === 401 && config.onUnauthorized) {
            await config.onUnauthorized(e);
          }
          throw e;
        }
      }
      throw err;
    }
  }

  const client: ApiClient = {
    async get(path: string, opts?: RequestCallOptions): Promise<ClientSuccess> {
      return perform('GET', resolvePath(path), opts ?? {});
    },
    async head(path: string, opts?: RequestCallOptions): Promise<ClientSuccess> {
      return perform('HEAD', resolvePath(path), opts ?? {});
    },
    async post(path: string, data?: unknown, opts?: RequestCallOptions): Promise<ClientSuccess> {
      return perform('POST', resolvePath(path), { ...opts, data });
    },
    async patch(path: string, data?: unknown, opts?: RequestCallOptions): Promise<ClientSuccess> {
      return perform('PATCH', resolvePath(path), { ...opts, data });
    },
    async put(path: string, data?: unknown, opts?: RequestCallOptions): Promise<ClientSuccess> {
      return perform('PUT', resolvePath(path), { ...opts, data });
    },
    async delete(path: string, opts?: RequestCallOptions): Promise<ClientSuccess> {
      return perform('DELETE', resolvePath(path), opts ?? {});
    },
    async request(ax: AxiosRequestConfig, opts?: RequestCallOptions): Promise<ClientSuccess> {
      /* v8 ignore next 2 -- @preserve method/url defaults match axios when omitted */
      const method = (ax.method ?? 'GET').toUpperCase();
      const rawUrl = ax.url ?? '/';
      const u =
        /* v8 ignore next -- @preserve axios types url as string; non-string is defensive */
        typeof rawUrl === 'string' && /^https?:\/\//i.test(rawUrl)
          ? rawUrl
          : resolvePath(rawUrl);
      return perform(method, u, {
        ...opts,
        data: ax.data,
        idempotencyKey: opts?.idempotencyKey ?? readHeader(ax, 'Idempotency-Key'),
      });
    },
    async getByUrl(fullUrl: string, opts?: RequestCallOptions): Promise<ClientSuccess> {
      return perform('GET', fullUrl, opts ?? {});
    },
    async patchWithVersion(
      path: string,
      data: unknown,
      version: number,
      opts?: Omit<RequestCallOptions, 'ifMatchVersion'>,
    ): Promise<ClientSuccess> {
      return perform('PATCH', resolvePath(path), {
        ...opts,
        data,
        ifMatchVersion: version,
      });
    },
    safeGet: (path, opts) => safe(() => client.get(path, opts)),
    safePost: (path, data, opts) => safe(() => client.post(path, data, opts)),
    safePatch: (path, data, opts) => safe(() => client.patch(path, data, opts)),
    safePut: (path, data, opts) => safe(() => client.put(path, data, opts)),
    safeDelete: (path, opts) => safe(() => client.delete(path, opts)),
    safeHead: (path, opts) => safe(() => client.head(path, opts)),
    safeRequest: (ax, opts) => safe(() => client.request(ax, opts)),
    safeGetByUrl: (url, opts) => safe(() => client.getByUrl(url, opts)),
    safePatchWithVersion: (path, data, version, opts) =>
      safe(() => client.patchWithVersion(path, data, version, opts)),
  };

  return client;
}
