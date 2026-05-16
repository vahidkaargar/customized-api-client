# Phase 02 — Types, parse, results union

## Goals
- Implement **`types/jsonapi.ts`**, **`types/config.ts`**, **`types/results.ts`** (discriminated **`ClientResult` / success kinds**).
- Implement **`ApiClientError`** + **`isApiClientError`**.
- Parsers: **`parse/success.ts`**, **`parse/errors.ts`**, **`parse/bulk-207.ts`**, **`parse/accepted-202.ts`** (minimal shapes for §5 / §6).

## Files to touch
- `src/types/*`, `src/parse/*` (no axios wiring yet except types if needed)

## Tests to add / pass
- `parse-success.test.ts`
- `parse-errors.test.ts`
- `results-kinds.test.ts` (**baseline**: at least **200/201** + one error path; complete all kinds in Phase 06)

## Exit criteria
- **`ApiClientError`** carries `status`, `errors[]`, `primaryCode`, header fields, `retryAfterSeconds` where applicable.
- Invalid JSON and empty **401/403** handled per [project-plan.md §5](project-plan.md).
