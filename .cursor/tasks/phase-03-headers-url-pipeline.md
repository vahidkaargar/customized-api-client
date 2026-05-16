# Phase 03 — Headers & URL / baseURL pipeline

## Goals
- JSON:API default **`Accept`/`Content-Type`** for body methods.
- **`Idempotency-Key`**: ULID default, override, max length **64**, **POST/PATCH/PUT/DELETE** only.
- **`If-Match`**: `formatIfMatch` → **`v=<n>`**.
- **`Accept-Language`** from config; **`Authorization: Bearer`** from **`bearer`** / **`partner-bearer`**.
- **Mode A vs Mode B `baseURL`**: no **`//`**, no double **`/api/v1`**.

## Files to touch
- `src/headers/jsonapi-headers.ts`, `idempotency.ts`, `if-match.ts`, `locale.ts`, `auth.ts`
- URL joining helper used later by axios (can live in `http/` or `headers/` — stay consistent)

## Tests to add / pass
- `jsonapi-headers.test.ts`
- `idempotency.test.ts`
- `if-match.test.ts`
- `locale.test.ts`
- `auth.test.ts`
- `url-mode.test.ts`

## Exit criteria
- GET/HEAD **never** send **`Idempotency-Key`**.
- Locked decisions in [project-plan.md §A](project-plan.md) respected for **Mode B** default semantics.
