# Phase 05 — Retry policy & executor

## Goals
- Implement **`retryAllowed(method, ctx)`** per [project-plan.md §7](project-plan.md).
- Parse **`Retry-After`** (seconds + HTTP-date): `retry-after.ts`.
- **`execute-with-retry.ts`**: max attempts, jitter, **mutation** same idempotency key + body, **409 IN_PROGRESS** bounded retry, **KEY_REUSED** fail, **412/428** never transient.

## Files to touch
- `src/retry/policy.ts`, `retry-after.ts`, `execute-with-retry.ts`

## Tests to add / pass
- `retry-policy.test.ts`
- `retry-after.test.ts`
- `retry-integration.test.ts`
- `idempotency-409.test.ts`

## Exit criteria
- Deny-list statuses never retried blindly; GET/HEAD allow-list matches §7.
