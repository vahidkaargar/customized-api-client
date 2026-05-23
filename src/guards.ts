import { ApiClientError } from './types/api-client-error.ts';
import { retryAllowed } from './retry/policy.ts';

export function hasErrorCode(error: unknown, code: string): boolean {
  if (!(error instanceof ApiClientError)) return false;
  return error.errors.some((e) => e.code === code);
}

export function isApiClientErrorWithCode(error: unknown, code: string): error is ApiClientError {
  return hasErrorCode(error, code);
}

export function isAuthenticationError(e: unknown): boolean {
  return isApiErr(e, 401);
}

export function isForbiddenError(e: unknown): boolean {
  return isApiErr(e, 403);
}

/** True for any HTTP 428. Prefer code-specific helpers when branching on `errors[].code`. */
export function isPreconditionRequiredError(e: unknown): boolean {
  return isApiErr(e, 428);
}

export function isIdempotencyKeyRequiredError(e: unknown): boolean {
  return isApiErrWithCode(e, 428, 'IDEMPOTENCY_KEY_REQUIRED');
}

export function isIfMatchRequiredError(e: unknown): boolean {
  return isApiErrWithCode(e, 428, 'IF_MATCH_REQUIRED');
}

export function isMfaVerificationRequiredError(e: unknown): boolean {
  return isApiErrWithCode(e, 428, 'MFA_VERIFICATION_REQUIRED');
}

export function isPreconditionFailedError(e: unknown): boolean {
  return isApiErr(e, 412);
}

export function isValidationError(e: unknown): boolean {
  return isApiErr(e, 422);
}

export function isConflictError(e: unknown): boolean {
  return isApiErr(e, 409);
}

/** HTTP **409** + primary `errors[].code === 'IDEMPOTENCY_KEY_REUSED'`. */
export function isIdempotencyKeyReusedError(e: unknown): boolean {
  return isApiErrWithCode(e, 409, 'IDEMPOTENCY_KEY_REUSED');
}

/** HTTP **409** + primary `errors[].code === 'IDEMPOTENCY_REQUEST_IN_PROGRESS'`. */
export function isIdempotencyInProgressError(e: unknown): boolean {
  return isApiErrWithCode(e, 409, 'IDEMPOTENCY_REQUEST_IN_PROGRESS');
}

export function isPayloadTooLargeError(e: unknown): boolean {
  return isApiErr(e, 413);
}

export function isRetryablePerPolicy(
  e: unknown,
  policy?: Readonly<{ retryMutationsOnServerError?: boolean }>,
): boolean {
  if (!(e instanceof ApiClientError)) return false;
  return retryAllowed({
    method: e.requestMethod ?? 'GET',
    status: e.status,
    primaryErrorCode: e.primaryCode,
    isNetworkError: false,
    retryMutationsOnServerError: policy?.retryMutationsOnServerError,
  });
}

function isApiErr(e: unknown, status: number): boolean {
  return e instanceof ApiClientError && e.status === status;
}

function isApiErrWithCode(e: unknown, status: number, code: string): boolean {
  return isApiErr(e, status) && hasErrorCode(e, code);
}
