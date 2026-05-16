import { ApiClientError } from '../types/api-client-error.ts';
import type { JsonApiErrorDocument, JsonApiErrorObject } from '../types/jsonapi.ts';
import { parseRetryAfterSeconds } from '../retry/retry-after.ts';

export function parseJsonApiErrorBody(
  status: number,
  rawBody: unknown,
  headers: Readonly<Record<string, string>>,
  requestMethod?: string,
): ApiClientError {
  const retryAfterSeconds = parseRetryAfterSeconds(headers['retry-after']);

  if (rawBody === null || rawBody === undefined || rawBody === '') {
    return new ApiClientError(
      status,
      [{ detail: `HTTP ${String(status)}`, code: 'EMPTY_ERROR_BODY' }],
      'EMPTY_ERROR_BODY',
      headers,
      retryAfterSeconds,
      requestMethod,
    );
  }

  if (typeof rawBody === 'string') {
    try {
      const parsed: unknown = JSON.parse(rawBody);
      return parseFromObject(status, parsed, headers, retryAfterSeconds, requestMethod);
    } catch {
      return syntheticError(status, 'INVALID_JSON', 'Response body is not valid JSON', requestMethod);
    }
  }

  if (typeof rawBody === 'object') {
    return parseFromObject(status, rawBody, headers, retryAfterSeconds, requestMethod);
  }

  return syntheticError(
    status,
    'INVALID_ERROR_DOCUMENT',
    'Unknown error payload shape',
    requestMethod,
  );
}

function parseFromObject(
  status: number,
  body: unknown,
  headers: Readonly<Record<string, string>>,
  retryAfterSeconds: number | undefined,
  requestMethod?: string,
): ApiClientError {
  if (!body || typeof body !== 'object') {
    return syntheticError(
      status,
      'INVALID_ERROR_DOCUMENT',
      'Error payload must be an object',
      requestMethod,
    );
  }
  const doc = body as Partial<JsonApiErrorDocument>;
  const errors = doc.errors;
  if (!Array.isArray(errors) || errors.length === 0) {
    return syntheticError(
      status,
      'MISSING_ERRORS_ARRAY',
      'errors[] missing or empty',
      requestMethod,
    );
  }
  const list = errors as JsonApiErrorObject[];
  const primaryCode = list[0]?.code;
  return new ApiClientError(status, list, primaryCode, headers, retryAfterSeconds, requestMethod);
}

function syntheticError(
  status: number,
  code: string,
  detail: string,
  requestMethod?: string,
): ApiClientError {
  return new ApiClientError(status, [{ code, detail }], code, undefined, undefined, requestMethod);
}
