import pkg from '../package.json' with { type: 'json' };

export const PACKAGE_VERSION = pkg.version;

export { createApiClient } from './create-api-client.ts';
export type { ApiClient, RequestCallOptions } from './create-api-client.ts';

export type {
  ApiClientConfig,
  AuthConfig,
  BaseUrlMode,
  DeprecationInfo,
  IdempotencyReplayContext,
  RetryOptions,
  TokenProvider,
  TransformResponseKeysMode,
} from './types/config.ts';
export { DEFAULT_PAGE_SIZE_CAP, DEFAULT_TIMEOUT_MS } from './types/config.ts';

export type {
  AcceptedBody,
  ClientSuccess,
  JsonApiSuccessBody,
  MultiStatusBody,
  MultiStatusItem,
  NoContentBody,
  NormalizedResponseHeaders,
} from './types/results.ts';
export type { ErrResult, OkResult, Result } from './types/results.ts';

export type {
  JsonApiDocument,
  JsonApiErrorDocument,
  JsonApiErrorObject,
  JsonApiPrimaryData,
  JsonApiResourceLinkage,
  JsonApiResourceObject,
} from './types/jsonapi.ts';

export { ApiClientError, isApiClientError } from './types/api-client-error.ts';

export {
  isAuthenticationError,
  isConflictError,
  isForbiddenError,
  isPayloadTooLargeError,
  isPreconditionFailedError,
  isPreconditionRequiredError,
  isRetryablePerPolicy,
  isValidationError,
} from './guards.ts';

export { redactHeaderRecord, truncateForLog } from './security/redact.ts';

export { applyJsonApiHeaders } from './headers/jsonapi-headers.ts';
export {
  assertValidIdempotencyKey,
  defaultIdempotencyKey,
  IDEMPOTENCY_MAX_LENGTH,
  isMutationMethod,
} from './headers/idempotency.ts';
export { formatIfMatch } from './headers/if-match.ts';
export { resolveAcceptLanguage } from './headers/locale.ts';
export { resolveAuthorizationHeader } from './headers/auth.ts';
export { resolveResourcePath, normalizeHttpUrl } from './headers/resolve-url.ts';

export { parseJsonApiDocument } from './parse/success.ts';
export { parseJsonApiErrorBody } from './parse/errors.ts';
export { parseMultiStatusBody } from './parse/bulk-207.ts';
export { resolveAcceptedLocation } from './parse/accepted-202.ts';
export {
  getNextPageUrl,
  parsePaginationKind,
} from './parse/pagination.ts';
export type {
  CursorPagination,
  OffsetPagination,
  UnknownPagination,
} from './parse/pagination.ts';

export { normalizeAxiosResponse } from './http/normalize-response.ts';
export { flattenAxiosHeaders, getHeader } from './http/header-utils.ts';

export { retryAllowed } from './retry/policy.ts';
export { parseRetryAfterSeconds } from './retry/retry-after.ts';
export { dispatchWithRetry } from './retry/execute-with-retry.ts';

export {
  buildCursorPageParams,
  buildJsonApiQuery,
  buildOffsetPageParams,
} from './helpers/query.ts';
export type { JsonApiQueryInput } from './helpers/query.ts';

export { indexIncluded, resolveIncluded } from './helpers/included-index.ts';
export type { IncludedIndex } from './helpers/included-index.ts';

export { etagFromResponseHeaders, readResourceVersion } from './helpers/version.ts';

export { groupValidationErrorsByPointer } from './helpers/form-errors.ts';
export type { ValidationGroups } from './helpers/form-errors.ts';

export { createHealthCheck } from './helpers/health.ts';

export { parseDeprecationHeaders } from './helpers/deprecation.ts';

export { applyTransformKeys } from './helpers/transform-keys.ts';

export { pollAsyncResult } from './poll-async.ts';
export type { PollOptions } from './poll-async.ts';

export type { paths, operations, components } from './generated/openapi.ts';
