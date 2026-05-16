# Release gates — parity with CI

Order matches **[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)** and should pass before tagging or publishing. CI runs on **Node.js 22** with global **npm** **`^11.5.1`** (install after `setup-node`; see workflow).

```bash
npm install -g npm@^11.5.1
npm ci
npm audit --omit=dev --audit-level=moderate
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npx vitest run --config vitest.postbuild.config.ts
```

Optional sanity: **`npm pack --dry-run`** (tarball lists **`dist/`** + **`README.md`** + **`package.json`** only).

## Why post-build Vitest is separate

[`vitest.config.ts`](../../vitest.config.ts) **excludes** **`test/postbuild/**`** from the default suite because those tests read **`dist/index.d.ts`** and must run **after** **`npm run build`**. [`vitest.postbuild.config.ts`](../../vitest.postbuild.config.ts) includes only **`test/postbuild/**/*.test.ts`**.

## Docs

Maintain alignment with **`README.md`** (**Development**, **Supply chain**, **Publishing**) and **`[SECURITY.md](../../SECURITY.md)`**.
