# Phase 07 — `createApiClient` & dual API

## Goals
- **`create-api-client.ts`**: **`get`**, **`head`**, **`post`**, **`patch`**, **`put`**, **`delete`**, **`request`**, **`getByUrl`**, **`patchWithVersion`** (names per [project-plan.md §2](project-plan.md)).
- **Throwing** methods + **`safe*`** / **`requestSafe`** **`Result`** API — **same normalization** path.
- Hooks: **`onUnauthorized`**, **`onIdempotencyReplay`**, **`onDeprecated`** wiring as applicable.

## Files to touch
- `src/create-api-client.ts`, `src/index.ts` exports

## Tests to add / pass
- `guards.test.ts`
- `safe-methods.test.ts`
- Unit tests for **`getByUrl`** URL handling if not fully covered in `url-mode.test.ts`

## Exit criteria
- Every **guard** exported and covered.
- **`safe*`** does not throw on **4xx**; returns **`Err`**.
