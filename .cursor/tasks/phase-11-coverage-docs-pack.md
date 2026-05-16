# Phase 11 — Coverage, README, pack smoke, checklist

## Goals
- **Coverage / thresholds** match **[`vitest.config.ts`](../../vitest.config.ts)** on measured **`src/**`** (see [project-plan §11](project-plan.md)); every **exported** symbol hit by ≥1 test.
- **README** covers [project-plan.md §13](project-plan.md).
- **`npm pack`** install smoke in a **temp** consumer project.
- **`graphify update .`** if **`graphify-out/`** exists (workspace rule).

## Files to touch
- `README.md`, `vitest.config.ts` / `vitest.postbuild.config.ts`, CI config if any
- Fill gaps in unit, integration, and **post-build** tests until gates pass

## Tests to add / pass
- All of **§11** green; coverage report artifact

## Exit criteria
- [project-plan.md §15](project-plan.md) checklist **all checked** by reviewer or agent sign-off.
- Package tarball installs and **import** works in temp project.
