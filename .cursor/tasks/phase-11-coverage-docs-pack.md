# Phase 11 — Coverage, README, pack smoke, checklist

## Goals
- **Coverage ≥ 90%** statements in **`src/**`**, excluding **`generated/**`**.
- Every **exported** symbol hit by **≥1** test.
- **README** covers [project-plan.md §13](project-plan.md).
- **`npm pack`** install smoke in a **temp** consumer project.
- **`graphify update .`** if **`graphify-out/`** exists (workspace rule).

## Files to touch
- `README.md`, `vitest.config.ts` coverage thresholds, CI config if any
- Fill gaps in unit/integration tests until coverage passes

## Tests to add / pass
- All of **§11** green; coverage report artifact

## Exit criteria
- [project-plan.md §15](project-plan.md) checklist **all checked** by reviewer or agent sign-off.
- Package tarball installs and **import** works in temp project.
