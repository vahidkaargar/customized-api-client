# Graph Report - customized-api-client  (2026-05-16)

## Corpus Check
- 98 files · ~63,421 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 523 nodes · 673 edges · 48 communities (38 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 19 edges
2. `Agent runbook: `@vahidkaargar/customized-api-client`` - 19 edges
3. `server` - 16 edges
4. `devDependencies` - 14 edges
5. ``@vahidkaargar/customized-api-client`` - 13 edges
6. `flattenAxiosHeaders()` - 12 edges
7. `Axios rules — `@vahidkaargar/customized-api-client`` - 12 edges
8. `scripts` - 11 edges
9. `normalizeAxiosResponse()` - 11 edges
10. `Axios skills — `@vahidkaargar/customized-api-client`` - 11 edges

## Surprising Connections (you probably didn't know these)
- `defaultIdempotencyKey()` --calls--> `ulid`  [INFERRED]
  src/headers/idempotency.ts → package.json
- `isRetryablePerPolicy()` --calls--> `retryAllowed()`  [EXTRACTED]
  src/guards.ts → src/retry/policy.ts
- `dispatchWithRetry()` --calls--> `parseRetryAfterSeconds()`  [EXTRACTED]
  src/retry/execute-with-retry.ts → src/retry/retry-after.ts
- `dispatchWithRetry()` --calls--> `flattenAxiosHeaders()`  [EXTRACTED]
  src/retry/execute-with-retry.ts → src/http/header-utils.ts
- `parseDeprecationHeaders()` --calls--> `flattenAxiosHeaders()`  [EXTRACTED]
  src/helpers/deprecation.ts → src/http/header-utils.ts

## Communities (48 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (39): ulid, resolveAuthorizationHeader(), assertValidIdempotencyKey(), defaultIdempotencyKey(), isMutationMethod(), formatIfMatch(), applyJsonApiHeaders(), hasJsonBody() (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (11): scripts, build, format, format:check, lint, openapi:generate, prepublishOnly, test (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (32): ValidationGroups, IncludedIndex, applyTransformKeys(), camelKeys(), toCamelCase(), coerceUnsigned(), etagFromResponseHeaders(), readResourceVersion() (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (31): dependencies, axios, description, devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-import (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (29): arrDoc, arrOut, bare, c, client, createSpy, d, defaultPage (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (23): 0. Hard constraints (read once), 10. OpenAPI codegen, 11. Tests — exhaustive inventory (all required), 12. Build & publish, 13. README (minimum), 14. Phased execution (task files), 15. Final acceptance checklist (binary), 16. Explicit non-goals (agent must not do) (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (8): RUNTIME_EXPORTS, g, k, warn, k, doc, client, p

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, declaration, declarationMap, esModuleInterop, exactOptionalPropertyTypes, isolatedModules (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (17): computeDelay(), DispatchOptions, dispatchWithRetry(), extractPrimaryCode(), isAxiosNetworkError(), sleep(), retryAllowed(), RetryPolicyContext (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.1
Nodes (18): 1. Create configurable Axios instance, 2. Authentication interceptor, 3. Response logging (safe metadata), 4. Idempotent mutation request, 5. PATCH with optimistic concurrency, 6. PUT and DELETE with keys, 7. JSON:API query builder, 8. Retry (pseudocode — use project’s `execute-with-retry`) (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (11): client, client, client, u, client, client, client, client (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (18): code:bash (npm install @vahidkaargar/customized-api-client), code:typescript (import { createApiClient } from '@vahidkaargar/customized-ap), code:bash (export OPENAPI_PATH=.cursor/api-documentations/openapi/v1.ya), code:bash (graphify update .), Development (no API keys required), Errors: try/catch vs `safe*`, Idempotency & concurrency, Install (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (3): attrs, client, resource

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (12): 1. Single `AxiosInstance`, 2. Idempotency (`Idempotency-Key`), 3. Concurrency (`If-Match`), 4. Retries, 5. Response and error surface, 6. HTTP status and “precedence”, 7. Security and logging, 8. Query serialization (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (11): arr, client, doc, e, h, instance, items, netErr (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.31
Nodes (8): bool(), CursorPagination, extractQueryParam(), num(), OffsetPagination, parseLegacyOffsetFromUrl(), parsePaginationKind(), UnknownPagination

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (8): After substantive code changes, Agents: `@vahidkaargar/customized-api-client`, Canonical instructions, Graphify CLI (terminal), Locked product decisions (do not reopen without explicit ask), MCP (project-local, workspace-relative), Naming & scope, What this package is

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (5): components, $defs, operations, paths, webhooks

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): mcpServers, workspace-files, args, command, type

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 04 — Security redaction, Tests to add / pass

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 06 — Axios instance, interceptors, normalize response, Tests to add / pass

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 08 — Helpers & DX, Tests to add / pass

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 11 — Coverage, README, pack smoke, checklist, Tests to add / pass

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (5): printWidth, semi, singleQuote, tabWidth, trailingComma

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 01 — Scaffold & tooling, Tests to add / pass

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 02 — Types, parse, results union, Tests to add / pass

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 03 — Headers & URL / baseURL pipeline, Tests to add / pass

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 05 — Retry policy & executor, Tests to add / pass

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 07 — `createApiClient` & dual API, Tests to add / pass

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 09 — `transformResponseKeys` & OpenAPI codegen, Tests to add / pass

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (5): Exit criteria, Files to touch, Goals, Phase 10 — Integration tests (MSW), Tests to add / pass

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (5): e, j, long, out, r

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (4): body, client, doc, onIdempotencyReplay

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (3): d, doc, o

### Community 35 - "Community 35"
Cohesion: 0.5
Nodes (3): instance, randomSpy, req

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (3): idx, inc, r

## Knowledge Gaps
- **288 isolated node(s):** `semi`, `singleQuote`, `trailingComma`, `printWidth`, `tabWidth` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `server` connect `Community 10` to `Community 33`, `Community 4`, `Community 38`, `Community 39`, `Community 12`, `Community 14`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `semi`, `singleQuote`, `trailingComma` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._