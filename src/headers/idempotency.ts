import { ulid } from 'ulid';

export const IDEMPOTENCY_MAX_LENGTH = 64;

export function defaultIdempotencyKey(): string {
  return ulid();
}

export function assertValidIdempotencyKey(key: string): void {
  if (!key || key.trim().length === 0) {
    throw new Error('Idempotency-Key must be non-empty');
  }
  if (key.length > IDEMPOTENCY_MAX_LENGTH) {
    throw new Error(`Idempotency-Key exceeds ${String(IDEMPOTENCY_MAX_LENGTH)} characters`);
  }
}

export function isMutationMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PATCH' || m === 'PUT' || m === 'DELETE';
}
