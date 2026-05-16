import type { JsonApiErrorObject } from './jsonapi.ts';
import { redactHeaderRecord } from '../security/redact.ts';

export class ApiClientError extends Error {
  readonly name = 'ApiClientError';

  constructor(
    readonly status: number,
    readonly errors: readonly JsonApiErrorObject[],
    readonly primaryCode?: string,
    readonly responseHeaders?: Readonly<Record<string, string>>,
    readonly retryAfterSeconds?: number,
    readonly requestMethod?: string,
    options?: ErrorOptions,
  ) {
    super(ApiClientError.#messageFrom(errors, status), options);
  }

  static #messageFrom(errors: readonly JsonApiErrorObject[], status: number): string {
    const first = errors[0];
    const code = first?.code ?? '';
    const detail = first?.detail ?? first?.title ?? '';
    const base = detail || code || `HTTP ${String(status)}`;
    return `[ApiClientError ${String(status)}] ${base}`;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      status: this.status,
      errors: this.errors,
      primaryCode: this.primaryCode,
      retryAfterSeconds: this.retryAfterSeconds,
      requestMethod: this.requestMethod,
      responseHeaders: this.responseHeaders
        ? redactHeaderRecord({ ...this.responseHeaders })
        : undefined,
    };
  }
}

export function isApiClientError(value: unknown): value is ApiClientError {
  return value instanceof ApiClientError;
}
