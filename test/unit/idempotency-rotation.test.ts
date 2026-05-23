import { describe, expect, it } from 'vitest';
import { ApiClientError } from '../../src/index.ts';
import { idempotencyRotationForRetry } from '../../src/idempotency/rotation.ts';

describe('idempotencyRotationForRetry', () => {
  it('reuses for non-ApiClientError failures', () => {
    expect(idempotencyRotationForRetry(new Error('network'))).toBe('reuse');
  });

  it('maps idempotency 409 codes', () => {
    expect(idempotencyRotationForRetry(new ApiClientError(
      409,
      [{ code: 'IDEMPOTENCY_REQUEST_IN_PROGRESS' }],
      'IDEMPOTENCY_REQUEST_IN_PROGRESS',
    ))).toBe('reuse');
    expect(idempotencyRotationForRetry(new ApiClientError(
      409,
      [{ code: 'IDEMPOTENCY_KEY_REUSED' }],
      'IDEMPOTENCY_KEY_REUSED',
    ))).toBe('rotate');
  });

  it('rotates on validation errors', () => {
    expect(idempotencyRotationForRetry(new ApiClientError(422, [{ code: 'VALIDATION' }]))).toBe('rotate');
  });

  it('reuses for other ApiClientError statuses', () => {
    expect(idempotencyRotationForRetry(new ApiClientError(429, [{ code: 'RATE_LIMITED' }]))).toBe('reuse');
    expect(idempotencyRotationForRetry(new ApiClientError(401, [{ code: 'AUTH' }]))).toBe('reuse');
  });
});
