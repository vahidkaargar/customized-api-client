import { describe, expect, it } from 'vitest';
import * as api from '../../src/index.ts';

const RUNTIME_EXPORTS: (keyof typeof api)[] = [
  'PACKAGE_VERSION',
  'createApiClient',
  'ApiClientError',
  'isApiClientError',
  'hasErrorCode',
  'isApiClientErrorWithCode',
  'isAuthenticationError',
  'isForbiddenError',
  'isIdempotencyKeyRequiredError',
  'isIdempotencyKeyReusedError',
  'isIdempotencyInProgressError',
  'isIfMatchRequiredError',
  'isMfaVerificationRequiredError',
  'isPreconditionRequiredError',
  'isPreconditionFailedError',
  'isValidationError',
  'isConflictError',
  'isPayloadTooLargeError',
  'isRetryablePerPolicy',
  'redactHeaderRecord',
  'truncateForLog',
  'applyJsonApiHeaders',
  'assertValidIdempotencyKey',
  'defaultIdempotencyKey',
  'IDEMPOTENCY_MAX_LENGTH',
  'isMutationMethod',
  'createIdempotencyIntent',
  'createMutationIdempotency',
  'idempotencyRotationForRetry',
  'formatIfMatch',
  'acceptLanguageForRequest',
  'localesMatch',
  'normalizeLocaleCode',
  'notifyLocaleMismatch',
  'parseContentLanguage',
  'readResponseContentLanguage',
  'resolveAcceptLanguage',
  'resolveLocaleProvider',
  'resolveRequestLocale',
  'resolveAuthorizationHeader',
  'resolveResourcePath',
  'normalizeHttpUrl',
  'parseJsonApiDocument',
  'parseJsonApiErrorBody',
  'parseMultiStatusBody',
  'resolveAcceptedLocation',
  'getNextPageUrl',
  'parsePaginationKind',
  'normalizeAxiosResponse',
  'flattenAxiosHeaders',
  'getHeader',
  'retryAllowed',
  'parseRetryAfterSeconds',
  'dispatchWithRetry',
  'buildCursorPageParams',
  'buildJsonApiQuery',
  'buildOffsetPageParams',
  'indexIncluded',
  'resolveIncluded',
  'etagFromResponseHeaders',
  'readResourceVersion',
  'groupValidationErrorsByPointer',
  'createHealthCheck',
  'parseDeprecationHeaders',
  'applyTransformKeys',
  'pollAsyncResult',
  'DEFAULT_PAGE_SIZE_CAP',
  'DEFAULT_TIMEOUT_MS',
];

describe('public export surface', () => {
  it('runtime exports are defined', () => {
    for (const key of RUNTIME_EXPORTS) {
      expect(api[key]).toBeDefined();
    }
    expect(typeof api.createApiClient).toBe('function');
    expect(typeof api.PACKAGE_VERSION).toBe('string');
  });

  it('does not export OpenAPI codegen symbols', () => {
    expect('paths' in api).toBe(false);
    expect('operations' in api).toBe(false);
    expect('components' in api).toBe(false);
  });
});
