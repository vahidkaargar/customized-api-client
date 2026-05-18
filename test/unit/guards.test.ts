import { describe, expect, it } from 'vitest';
import { ApiClientError } from '../../src/index.ts';
import {
  isAuthenticationError,
  isConflictError,
  isForbiddenError,
  isPayloadTooLargeError,
  isPreconditionFailedError,
  isPreconditionRequiredError,
  isRetryablePerPolicy,
  isValidationError,
} from '../../src/index.ts';

describe('guards', () => {
  it('isAuthenticationError', () => {
    expect(isAuthenticationError(new ApiClientError(401, [{ code: 'X' }]))).toBe(true);
    expect(isAuthenticationError(new ApiClientError(403, [{ code: 'X' }]))).toBe(false);
  });

  it('isForbiddenError', () => {
    expect(isForbiddenError(new ApiClientError(403, [{ code: 'X' }]))).toBe(true);
  });

  it('isPreconditionRequiredError', () => {
    expect(isPreconditionRequiredError(new ApiClientError(428, [{ code: 'X' }]))).toBe(true);
  });

  it('isPreconditionFailedError', () => {
    expect(isPreconditionFailedError(new ApiClientError(412, [{ code: 'X' }]))).toBe(true);
  });

  it('isValidationError', () => {
    expect(isValidationError(new ApiClientError(422, [{ code: 'X' }]))).toBe(true);
  });

  it('isConflictError', () => {
    expect(isConflictError(new ApiClientError(409, [{ code: 'X' }]))).toBe(true);
  });

  it('isPayloadTooLargeError', () => {
    expect(isPayloadTooLargeError(new ApiClientError(413, [{ code: 'X' }]))).toBe(true);
  });

  it('isRetryablePerPolicy', () => {
    expect(
      isRetryablePerPolicy(new ApiClientError(500, [{ code: 'X' }], 'X', {}, undefined, 'GET')),
    ).toBe(true);
    expect(
      isRetryablePerPolicy(new ApiClientError(500, [{ code: 'X' }], 'X', {}, undefined, 'POST')),
    ).toBe(false);
    expect(
      isRetryablePerPolicy(new ApiClientError(500, [{ code: 'X' }], 'X', {}, undefined, 'POST'), {
        retryMutationsOnServerError: true,
      }),
    ).toBe(true);
    expect(isRetryablePerPolicy(new ApiClientError(401, [{ code: 'X' }]))).toBe(false);
    expect(
      isRetryablePerPolicy(new ApiClientError(401, [{ code: 'X' }]), {
        retryMutationsOnServerError: true,
      }),
    ).toBe(false);
  });
});
