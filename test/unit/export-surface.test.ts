import { describe, expect, it } from 'vitest';
import * as api from '../../src/index.ts';

const RUNTIME_EXPORTS: (keyof typeof api)[] = [
  'PACKAGE_VERSION',
  'createApiClient',
  'ApiClientError',
  'isApiClientError',
  'isAuthenticationError',
  'isForbiddenError',
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
  'formatIfMatch',
  'resolveAcceptLanguage',
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
});
