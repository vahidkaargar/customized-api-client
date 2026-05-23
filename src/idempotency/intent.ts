import { defaultIdempotencyKey } from '../headers/idempotency.ts';

/** Whether the next mutation should keep or replace the active idempotency key. */
export type IdempotencyRotation = 'reuse' | 'rotate';

/** Caller-owned idempotency key lifecycle across separate client invocations. */
export interface IdempotencyIntent {
  readonly activeKey: string | null;
  hasActiveIntent: () => boolean;
  begin: () => string;
  keyFor: (rotation: IdempotencyRotation) => string;
  complete: () => void;
  abandon: () => void;
}

export interface CreateIdempotencyIntentOptions {
  readonly generateKey?: () => string;
}

/**
 * Track one user intent's idempotency key across multiple `client.post`/`patch`/… calls.
 *
 * Transport retries inside a single client call reuse the same key automatically; this helper
 * covers **separate** invocations (e.g. user clicks Retry after a network error).
 */
export function createIdempotencyIntent (
  options?: CreateIdempotencyIntentOptions,
): IdempotencyIntent {
  const generateKey = options?.generateKey ?? defaultIdempotencyKey;
  let activeKey: string | null = null;

  return {
    get activeKey () {
      return activeKey;
    },
    hasActiveIntent () {
      return activeKey !== null;
    },
    begin () {
      activeKey = generateKey();
      return activeKey;
    },
    keyFor (rotation: IdempotencyRotation) {
      if (rotation === 'rotate') {
        activeKey = generateKey();
        return activeKey;
      }
      if (activeKey === null) {
        activeKey = generateKey();
        return activeKey;
      }
      return activeKey;
    },
    complete () {
      activeKey = null;
    },
    abandon () {
      activeKey = null;
    },
  };
}

/**
 * @deprecated Prefer {@link createIdempotencyIntent}. Alias for app-layer naming compatibility.
 */
export const createMutationIdempotency = createIdempotencyIntent;
