# Phase 01 — Scaffold & tooling

## Goals
- Boot the package with **strict TypeScript**, **Vitest**, **ESLint**, **Prettier**, **`package.json` `exports`**, **`engines.node` ≥ 20**, and **no product-prefixed** package or export names.
- Establish a minimal **`src/index.ts`** (re-exports placeholder is OK).

## Files to touch
- `package.json`, `tsconfig.json`, `vitest.config.ts`, ESLint + Prettier config (repo convention)
- `src/index.ts` (barrel stub)
- `.gitignore` for `dist`, coverage, etc.

## Tests to add / pass
- Optional smoke: **single test** that imports `src/index.ts` or runs `vitest` with zero real tests (acceptable only until Phase 02 — prefer **one** `import` smoke test).

## Exit criteria
- `npm run test` (or equivalent) exits **0**.
- `npm run lint` / `npm run format:check` (if defined) pass.
- **`@vahidkaargar/customized-api-client`** name and **`exports`** map ready for later phases.
