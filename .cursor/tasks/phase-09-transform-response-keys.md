# Phase 09 — `transformResponseKeys` (response key transform)

> **Supersedes** the old OpenAPI-in-package work. **Do not** add **`openapi-typescript`**, **`src/generated/openapi.ts`**, or codegen exports — see **[`README.md`](../../README.md)** (“Typing your API”), **`project-plan.md` §10**, **[`../rules/package-scope-no-openapi.mdc`](../rules/package-scope-no-openapi.mdc)**.

## Goals

- **`transformResponseKeys`**: **`none`** vs **`camelCase-attributes-meta`** on **copies** only; default **`none`**.

## Files to touch

- Response normalization path (Phase 06) + **`transform-keys`** helper

## Tests to add / pass

- `transform-keys.test.ts`
- OpenAPI regression guards remain green: **`package-no-openapi.test.ts`**, **`test/postbuild/dist-no-openapi.test.ts`** (after **`npm run build`**).

## Exit criteria

- **`transformResponseKeys`** behaves per **`transform-keys.test.ts`** and does not mutate Axios response data in place unless explicitly documented.
- **No** coupling to generated OpenAPI types in **this** repo.
