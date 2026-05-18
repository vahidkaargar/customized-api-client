import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { retryAllowed } from './policy.ts';
import type { RetryOptions } from '../types/config.ts';
import { parseRetryAfterSeconds } from './retry-after.ts';
import { flattenAxiosHeaders } from '../http/header-utils.ts';

export interface DispatchOptions {
  readonly retry?: RetryOptions;
  readonly getPrimaryErrorCodeFromBody?: (body: unknown) => string | undefined;
}

const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_BASE_MS = 200;

export async function dispatchWithRetry<TData = unknown>(
  instance: AxiosInstance,
  config: AxiosRequestConfig,
  options: DispatchOptions,
): Promise<AxiosResponse<TData>> {
  const max = options.retry?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelay = options.retry?.baseDelayMs ?? DEFAULT_BASE_MS;
  const maxDelay = options.retry?.maxDelayMs ?? 10_000;
  const jitterRatio = options.retry?.jitterRatio ?? 0.2;

  let attempt = 0;
  let lastResponse: AxiosResponse<TData> | undefined;

  while (attempt < max) {
    try {
      const res = await instance.request<TData>(config as InternalAxiosRequestConfig);
      lastResponse = res;
      const status = res.status;
      const flat = flattenAxiosHeaders(res.headers);
      const primary =
        status >= 400
          ? extractPrimaryCode(res.data, options.getPrimaryErrorCodeFromBody)
          : undefined;
      const allowed = retryAllowed({
        method: String(config.method ?? 'GET'),
        status,
        primaryErrorCode: primary,
        isNetworkError: false,
        retryMutationsOnServerError: options.retry?.retryMutationsOnServerError,
      });
      if (allowed && attempt < max - 1) {
        const retryAfter = parseRetryAfterSeconds(flat['retry-after']);
        const delayMs = computeDelay(
          attempt,
          baseDelay,
          maxDelay,
          jitterRatio,
          retryAfter,
        );
        await sleep(delayMs);
        attempt += 1;
        continue;
      }
      return res;
    } catch (err: unknown) {
      const isNet = isAxiosNetworkError(err);
      const allowed = retryAllowed({
        method: String(config.method ?? 'GET'),
        isNetworkError: isNet,
        retryMutationsOnServerError: options.retry?.retryMutationsOnServerError,
      });
      if (!allowed || attempt >= max - 1) {
        throw err;
      }
      const delayMs = computeDelay(attempt, baseDelay, maxDelay, jitterRatio, undefined);
      await sleep(delayMs);
      attempt += 1;
    }
  }

  /* v8 ignore next 2 -- loop always returns or throws before attempt reaches max */
  if (lastResponse) return lastResponse;
  throw new Error('dispatchWithRetry: exhausted without response');
}

function extractPrimaryCode(
  body: unknown,
  fn?: (b: unknown) => string | undefined,
): string | undefined {
  if (fn) return fn(body);
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as { errors?: { code?: string }[] }).errors;
    if (Array.isArray(errors) && errors[0]?.code) {
      return errors[0].code;
    }
  }
  return undefined;
}

function isAxiosNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Partial<AxiosError>;
  return e.isAxiosError === true && !e.response;
}

function computeDelay(
  attempt: number,
  base: number,
  max: number,
  jitterRatio: number,
  retryAfterSec: number | undefined,
): number {
  let exp = Math.min(max, base * 2 ** attempt);
  if (retryAfterSec !== undefined) {
    exp = Math.min(max, Math.max(exp, retryAfterSec * 1000));
  }
  const jitter = exp * jitterRatio * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(exp + jitter));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
