import { ApiClientError } from './types/api-client-error.ts';
import { retryAllowed } from './retry/policy.ts';

export function isAuthenticationError(e: unknown): boolean {
  return isApiErr(e, 401);
}

export function isForbiddenError(e: unknown): boolean {
  return isApiErr(e, 403);
}

export function isPreconditionRequiredError(e: unknown): boolean {
  return isApiErr(e, 428);
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

export function isPayloadTooLargeError(e: unknown): boolean {
  return isApiErr(e, 413);
}

export function isRetryablePerPolicy(e: unknown): boolean {
  if (!(e instanceof ApiClientError)) return false;
  return retryAllowed({
    method: e.requestMethod ?? 'GET',
    status: e.status,
    primaryErrorCode: e.primaryCode,
    isNetworkError: false,
  });
}

function isApiErr(e: unknown, status: number): boolean {
  return e instanceof ApiClientError && e.status === status;
}
