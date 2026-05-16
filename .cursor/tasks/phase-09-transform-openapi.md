# Phase 09 — `transformResponseKeys` & OpenAPI codegen

## Goals
- **`transformResponseKeys`**: **`none`** vs **`camelCase-attributes-meta`** on **copies** only; default **`none`**.
- **`package.json` script**: `openapi-typescript` → **`src/generated/openapi.ts`** using **`OPENAPI_PATH`** (default **`openapi/v1.yaml`** or documented monorepo path).
- **Commit** generated file **or** CI fails — per §A.

## Files to touch
- Response normalization path (Phase 06) + **`transform-keys`** helper
- `src/generated/openapi.ts` (generated), `src/index.ts` re-exports of **selected** types only

## Tests to add / pass
- `transform-keys.test.ts`
- Smoke test: **import** one generated symbol **or** assert file exists when spec present (`OPENAPI_PATH`)

## Exit criteria
- **`generated/openapi.ts` is never hand-edited**; changes only via codegen script.
