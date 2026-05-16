# Phase 06 — Axios instance, interceptors, normalize response

## Goals
- **`axios-instance.ts`** + request/response interceptors applying Phase 03–05 behavior.
- **`normalizeResponse`**: map HTTP status → §5 discriminated union (complete **`results-kinds`** coverage).
- Integrate **retry executor** around transport.

## Files to touch
- `src/http/axios-instance.ts`, `request-interceptors.ts`, `response-interceptors.ts`
- Connect **`redact`** on error paths

## Tests to add / pass
- `results-kinds.test.ts` — **complete** **200/201**, **204**, **202**, **207**, error branches
- Expand `parse-*.test.ts` if interceptors reveal gaps

## Exit criteria
- Mock adapter or vitest HTTP can drive full status matrix in §6 without **`createApiClient`** yet (or minimal facade).
