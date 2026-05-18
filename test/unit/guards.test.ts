import { describe, expect, it } from 'vitest';
import { ApiClientError } from '../../src/index.ts';
import {
  hasErrorCode,
  isApiClientErrorWithCode,
  isAuthenticationError,
  isConflictError,
  isForbiddenError,
  isIdempotencyKeyRequiredError,
  isIfMatchRequiredError,
  isMfaVerificationRequiredError,
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
    expect(
      isPreconditionRequiredError(
        new ApiClientError(428, [{ code: 'IDEMPOTENCY_KEY_REQUIRED' }], 'IDEMPOTENCY_KEY_REQUIRED'),
      ),
    ).toBe(true);
    expect(isPreconditionRequiredError(new ApiClientError(422, [{ code: 'X' }]))).toBe(false);
  });

  it('hasErrorCode and isApiClientErrorWithCode', () => {
    const err = new ApiClientError(422, [{ code: 'A' }, { code: 'B' }], 'A');
    expect(hasErrorCode(err, 'B')).toBe(true);
    expect(hasErrorCode(err, 'Z')).toBe(false);
    expect(hasErrorCode(new Error('x'), 'A')).toBe(false);
    expect(isApiClientErrorWithCode(err, 'B')).toBe(true);
    if (isApiClientErrorWithCode(err, 'B')) {
      expect(err.status).toBe(422);
    }
  });

  it('428 code-specific guards', () => {
    const idem = new ApiClientError(
      428,
      [{ code: 'IDEMPOTENCY_KEY_REQUIRED' }],
      'IDEMPOTENCY_KEY_REQUIRED',
    );
    expect(isIdempotencyKeyRequiredError(idem)).toBe(true);
    expect(isIfMatchRequiredError(idem)).toBe(false);
    expect(isMfaVerificationRequiredError(idem)).toBe(false);
    expect(isPreconditionRequiredError(idem)).toBe(true);

    const ifMatch = new ApiClientError(428, [{ code: 'IF_MATCH_REQUIRED' }], 'IF_MATCH_REQUIRED');
    expect(isIfMatchRequiredError(ifMatch)).toBe(true);
    expect(isIdempotencyKeyRequiredError(ifMatch)).toBe(false);

    const mfa = new ApiClientError(
      428,
      [{ code: 'MFA_VERIFICATION_REQUIRED' }],
      'MFA_VERIFICATION_REQUIRED',
    );
    expect(isMfaVerificationRequiredError(mfa)).toBe(true);

    expect(isIdempotencyKeyRequiredError(new ApiClientError(422, [{ code: 'IDEMPOTENCY_KEY_REQUIRED' }]))).toBe(
      false,
    );
    expect(isIdempotencyKeyRequiredError(new ApiClientError(428, [{ code: 'OTHER' }]))).toBe(false);
    expect(isIdempotencyKeyRequiredError(new Error('x'))).toBe(false);
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
