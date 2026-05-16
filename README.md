# `@vahidkaargar/customized-api-client`

TypeScript **Axios** client for JSON:API **v1.1** with mandatory **idempotency** on mutations, optimistic concurrency, normalized success/error shapes, retries, and optional **`transformResponseKeys`**.

---

## Install

```bash
npm install @vahidkaargar/customized-api-client
```

Requires **Node.js ≥ 20**.

---

## Quick start

```typescript
import { createApiClient } from '@vahidkaargar/customized-api-client';

const client = createApiClient({
  baseURL: 'https://api.example.com/api/v1',
  auth: { type: 'bearer', getToken: () => localStorage.getItem('token') },
});

const result = await client.get('/widgets');
```

### Mode B `baseURL` (default)

**Mode B** is the default: put the JSON:API prefix in `baseURL` (e.g. `https://host/api/v1`). Resource paths are then `/widgets`, `/admin/teams`, etc. The client avoids duplicate `/api/v1` and double slashes. **Mode A** (`baseUrlMode: 'modeA'`) uses an origin-only `baseURL` and prefixes `/api/v1` for relative paths. (This is the config name for the plan’s `pathStyle` / Mode A vs B.)

---

## Idempotency & concurrency

- **Mutations** (`POST`, `PATCH`, `PUT`, `DELETE`) automatically send an **`Idempotency-Key`** (ULID by default). Override per call with `opts.idempotencyKey` or replace generation via `generateIdempotencyKey`.
- Retries reuse the **same key and body** so the server can honor **`Idempotent-Replayed`**.
- **`patchWithVersion(path, data, version)`** (or `opts.ifMatchVersion`) sends **`If-Match: "v=<n>"`**.

---

## Pagination & links

Use **`getNextPageUrl(document.links)`** or your stored `links.next`, then **`client.getByUrl(nextUrl)`** to follow **absolute** or **relative** `next` URLs with the same interceptors and auth.

Outgoing page builders: **`buildOffsetPageParams`**, **`buildCursorPageParams`**, **`buildJsonApiQuery`**. **`page[size]`** is capped (default **100**).

---

## Locale

Set **`getAcceptLanguage`** on the config for **`Accept-Language`**. Success envelopes expose **`Content-Language`** on normalized headers where present.

---

## Errors: try/catch vs `safe*`

Verb methods **throw `ApiClientError`** on HTTP/API errors. Use **`safeGet`**, **`safeHead`**, **`safePost`**, **`safePatch`**, **`safePut`**, **`safeDelete`**, or **`safeRequest(ax, opts?)`** for a **`Result`** without throwing. **`client.request(ax, opts?)`** is the escape hatch (forwards `idempotencyKey` / `ifMatchVersion`).

Use **`groupValidationErrorsByPointer`**, **`isValidationError`**, and other **guards** from this package for branching.

---

## Security

Tokens via **`getToken` / `getSecret`** only; nothing is persisted by the client. **`Authorization`** and idempotency values are **redacted** in **`ApiClientError.toJSON()`** / **`redactHeaderRecord`**. Use **`truncateForLog(body, maxLen)`** before logging payloads; optional **`maxBodyLogLength`** on config documents the intended cap. Non-HTTPS `baseURL` outside localhost logs a **one-time console warning** in development.

---

## Retries

Configurable **`retry`** (defaults: **`maxAttempts: 4`**, `baseDelayMs: 200`, `maxDelayMs: 10000`, `jitterRatio: 0.2`). **GET/HEAD** may retry transient HTTP failures (5xx, 429, 408, etc.). **Mutations** retry only on **network errors** (same idempotency key + body) and **`409 IDEMPOTENCY_REQUEST_IN_PROGRESS`** — **not** on mutation **5xx**. **428/412**, **401/403**, and **409 KEY_REUSED** are never blind-retried.

---

## OpenAPI types (codegen)

Commit **`src/generated/openapi.ts`** is generated — **do not edit by hand**.

Bundled spec: **`openapi/v1.yaml`**. Regenerate types with:

```bash
npm run openapi:generate
```

Re-run after spec changes; override **`OPENAPI_PATH`** to another checkout if needed. Public types include **`paths`**, **`operations`**, **`components`** from the package entry.

---

## Scripts

| Script                 | Purpose              |
|------------------------|----------------------|
| `npm run build`        | ESM + CJS + types    |
| `npm test`             | Vitest               |
| `npm run test:coverage`| Coverage (**100%** thresholds on measured `src/**`) |
| `npm run openapi:generate` | Regenerate types |

---

## Development

```bash
npm run typecheck && npm run lint && npm run test:coverage && npm run build
```

---

## License

MIT
