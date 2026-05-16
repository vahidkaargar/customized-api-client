import type { AxiosResponse } from 'axios';
import { parseJsonApiDocument } from '../parse/success.ts';
import { parseJsonApiErrorBody } from '../parse/errors.ts';
import { parseMultiStatusBody } from '../parse/bulk-207.ts';
import { resolveAcceptedLocation } from '../parse/accepted-202.ts';
import { ApiClientError } from '../types/api-client-error.ts';
import { flattenAxiosHeaders, getHeader } from './header-utils.ts';
import type { TransformResponseKeysMode } from '../types/config.ts';
import { applyTransformKeys } from '../helpers/transform-keys.ts';
import type { ClientSuccess, JsonApiSuccessBody, NormalizedResponseHeaders } from '../types/results.ts';
import type { JsonApiDocument } from '../types/jsonapi.ts';
import { parseRetryAfterSeconds } from '../retry/retry-after.ts';

export interface NormalizeOptions {
  readonly transformResponseKeys?: TransformResponseKeysMode;
  readonly requestUrl: string;
  readonly requestMethod?: string;
}

export function normalizeAxiosResponse(
  response: AxiosResponse<unknown>,
  options: NormalizeOptions,
): ClientSuccess {
  const status = response.status;
  const headers = flattenAxiosHeaders(response.headers);

  if (status >= 400) {
    throw parseJsonApiErrorBody(status, response.data, headers, options.requestMethod);
  }

  const normHeaders = normalizeHeaders(headers);

  if (status === 204) {
    return { kind: 'no-content', status: 204, headers: normHeaders };
  }

  if (status === 202) {
    const location = resolveAcceptedLocation(headers, options.requestUrl);
    return {
      kind: 'accepted',
      status: 202,
      location,
      rawBody: response.data,
      headers: normHeaders,
    };
  }

  if (status === 207) {
    return {
      kind: 'multi-status',
      status: 207,
      items: parseMultiStatusBody(response.data),
      headers: normHeaders,
    };
  }

  if (status === 200 || status === 201) {
    const doc = parseJsonApiDocument(response.data);
    const transformed = applyTransformResponse(
      doc,
      options.transformResponseKeys ?? 'none',
    );
    const body: JsonApiSuccessBody = {
      kind: 'jsonapi-success',
      status: status,
      headers: normHeaders,
      document: transformed,
    };
    return body;
  }

  throw new ApiClientError(
    status,
    [{ code: 'UNSUPPORTED_SUCCESS_STATUS', detail: String(status) }],
    'UNSUPPORTED_SUCCESS_STATUS',
    headers,
    parseRetryAfterSeconds(getHeader(headers, 'retry-after')),
    options.requestMethod,
  );
}

function normalizeHeaders(headers: Record<string, string>): NormalizedResponseHeaders {
  const idem = getHeader(headers, 'idempotent-replayed');
  return {
    etag: getHeader(headers, 'etag'),
    contentLanguage: getHeader(headers, 'content-language'),
    idempotentReplayed: idem === 'true' || idem === 'True',
    retryAfterSeconds: parseRetryAfterSeconds(getHeader(headers, 'retry-after')),
  };
}

function applyTransformResponse(
  doc: JsonApiDocument,
  mode: TransformResponseKeysMode,
): JsonApiDocument {
  if (mode === 'none') return doc;
  return applyTransformKeys(doc, mode);
}
