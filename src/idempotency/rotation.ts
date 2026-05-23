import {
  isIdempotencyInProgressError,
  isIdempotencyKeyReusedError,
  isValidationError,
} from '../guards.ts';
import { ApiClientError } from '../types/api-client-error.ts';
import type { IdempotencyRotation } from './intent.ts';

/**
 * Suggested rotation when reacting to an error before retrying the same user action.
 *
 * - Network / abort / no response → reuse
 * - `IDEMPOTENCY_REQUEST_IN_PROGRESS` → reuse (transport may already retry once)
 * - `IDEMPOTENCY_KEY_REUSED` or validation **422** → rotate
 * - Other `ApiClientError` → reuse when payload unchanged (caller may override)
 *
 * **412 If-Match** is not idempotency rotation — refresh version separately.
 */
export function idempotencyRotationForRetry (error: unknown): IdempotencyRotation {
  if (!(error instanceof ApiClientError)) {
    return 'reuse';
  }
  if (isIdempotencyInProgressError(error)) {
    return 'reuse';
  }
  if (isIdempotencyKeyReusedError(error)) {
    return 'rotate';
  }
  if (isValidationError(error)) {
    return 'rotate';
  }
  return 'reuse';
}
