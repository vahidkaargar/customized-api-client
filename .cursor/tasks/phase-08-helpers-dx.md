# Phase 08 — Helpers & DX

## Goals
- Helpers: **`query.ts`**, **`pagination.ts`**, **`included-index.ts`**, **`version.ts`**, **`form-errors.ts`**, **`health.ts`**, **`deprecation.ts`**.
- **`getNextPageUrl(links)`**; **`parsePaginationKind`** with **legacy `page`/`per_page`** in link URLs.
- **`poll-async.ts`**: integrate with **202** / Location if exported; otherwise keep internal + test via integration.

## Files to touch
- `src/helpers/*`, `src/poll-async.ts` (as needed)

## Tests to add / pass
- `query-builder.test.ts`
- `pagination-parse.test.ts`
- `pagination-links.test.ts`
- `included-index.test.ts`
- `version.test.ts`
- `form-errors.test.ts`
- `health.test.ts`
- `deprecation.test.ts`

## Exit criteria
- **`readResourceVersion`** precedence: **meta > ETag > undefined**; numeric string coercion.
- **`createHealthCheck`** hits **`…/health/live`**.
