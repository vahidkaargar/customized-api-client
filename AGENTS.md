# Agents: `@vahidkaargar/customized-api-client`

## What this package is
A strict TypeScript **Axios** client for **JSON:API v1.1** at **`/api/v1`**: **Bearer** auth (user + optional partner key), **mandatory `Idempotency-Key`** on mutations, **optimistic concurrency** (`If-Match` / `meta.version` / `ETag`), **retries** with an explicit policy, **normalized result kinds**, **helpers** (pagination, query DSL, `included`, form errors, health, deprecation), and **security redaction** on errors/logs.

## MCP (project-local, workspace-relative)
- Config: **`.cursor/mcp.json`** (committed). Uses Cursor interpolation: **`${workspaceFolder}`** is the opened project root; args are **relative to that root** (see [MCP docs — config interpolation](https://cursor.com/docs/mcp)).
- **`workspace-files`**: `@modelcontextprotocol/server-filesystem` with roots **`${workspaceFolder}`**, **`${workspaceFolder}/..`**, **`${workspaceFolder}/../..`** so tools can read this package, `packages/`, and the monorepo root (e.g. sibling **`openapi/v1.yaml`** when present). Restart Cursor or reload MCP after editing.
- For secrets, use **`${env:VAR}`** in `env` / headers — never commit tokens in this file.

## Canonical instructions
1. Follow **[`.cursor/tasks/project-plan.md`](.cursor/tasks/project-plan.md)** for repository layout, public API shape, pipeline order, exhaustive test inventory (§11), phased execution (§14), acceptance checklist (§15), and non-goals (§16). Execute **`phase-01` … `phase-11`** in [`.cursor/tasks/`](.cursor/tasks/) order unless explicitly replanned.
2. Follow **`.cursorrules`** in this directory for day-to-day coding constraints and naming.
3. **Cursor Axios helpers** ([`.cursor/rules/axios-rules.md`](.cursor/rules/axios-rules.md), [`.cursor/skills/axios-skills.md`](.cursor/skills/axios-skills.md)) must **match** the runbook—if they drift, update them to [`.cursor/tasks/project-plan.md`](.cursor/tasks/project-plan.md).

## Locked product decisions (do not reopen without explicit ask)
| Topic | Decision |
|--------|-----------|
| **OpenAPI** | Default bundled path in this package: **`.cursor/api-documentations/openapi/v1.yaml`**. Set **`OPENAPI_PATH`** to override (e.g. backend clone). **`npm run openapi:generate`** → **`src/generated/openapi.ts`**. **Never** hand-edit generated output. Prefer **committed generated types** or **CI failure** if spec absent for production. |
| **`baseURL`** | **Mode B** in README/examples: `baseURL` includes **`/api/v1`**, paths like `/admin/teams`. **Mode A** remains supported for same-origin non-v1 calls—document under `pathStyle` / [`.cursor/tasks/project-plan.md`](.cursor/tasks/project-plan.md) §3. |
| **Errors** | **Throw `ApiClientError`** by default on verb helpers. **Also** export **`safe*`** / `Result` variants. README: **try/catch first**, `safe*` second. |
| **Status “precedence”** | **Server-only** ordering when multiple checks could apply. **Client** classifies from **the single HTTP status** and **`errors[].code`** on that response; use precedence only in docs/tests that mock **one** status at a time. |
| **Pagination** | Send JSON:API **`page[number|size]`** and **`page[cursor|size]`** as per OpenAPI; **parse** from **`meta` + `links`**, tolerate **legacy `page` / `per_page`** in links, and support **following absolute `links.next`** (`getByUrl`). |
| **Version** | DB/versioned resources: **unsigned integer**; in JSON prefer **number**; **parse defensively** (number or numeric string). **`readResourceVersion`**: **`meta.version`** → **`ETag` `v=n`** → **`undefined`**. Not all resources are versioned. |
| **Partner auth** | Same as user: **`Authorization: Bearer …`** only (middleware uses **bearer token** lookup; no required `X-Partner-Id` in current integration path). |

## Naming & scope
- **Standard export names** only (`createApiClient`, `ApiClientError`, …)—no product or environment-specific tokens in **public** API or package code.
- **No UI framework** in v1; **no OAuth/PKCE** in-package—only token/secret hooks ([`project-plan.md` §16](.cursor/tasks/project-plan.md)).

## After substantive code changes
If the repo has **graphify** (`graphify-out/`), run **`graphify update .`** from this package root to refresh the knowledge graph (AST-only; no API key). Do **not** use `graphify .` or `/graphify` in the shell—the latter is a Cursor skill trigger only. Use **`graphify extract .`** only when semantic (LLM) extraction is needed and an API key is set.

## Graphify CLI (terminal)
| Command | Purpose |
|---------|---------|
| `graphify update .` | Refresh code graph (default after code changes) |
| `graphify query "…"` | Query existing `graphify-out/graph.json` (no API key) |

**Skip `graphify extract .`** unless the user provides an LLM API key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.).
