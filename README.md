# `@vahidkaargar/customized-api-client`

TypeScript **Axios** client for **JSON:API v1.1** APIs. It targets backends that use `application/vnd.api+json`, **Bearer** auth, mandatory **`Idempotency-Key`** on mutations, optimistic concurrency via **`If-Match`**, explicit **retry** rules, and **normalized** success/error results so application code does not re-parse raw Axios responses.

**Requirements:** Node.js **≥ 20**. **ESM** and **CJS** builds are published (`import` / `require`).

---

## Table of contents

1. [Install](#install)
2. [Quick start](#quick-start)
3. [Configuration](#configuration)
4. [Base URL modes](#base-url-modes)
5. [Making requests](#making-requests)
6. [Success results (`ClientSuccess`)](#success-results-clientsuccess)
7. [Errors](#errors)
8. [Idempotency](#idempotency)
9. [Optimistic concurrency](#optimistic-concurrency)
10. [Retries](#retries)
11. [Pagination and query parameters](#pagination-and-query-parameters)
12. [Included resources](#included-resources)
13. [Async jobs (202) and polling](#async-jobs-202-and-polling)
14. [Bulk operations (207)](#bulk-operations-207)
15. [Response key transformation](#response-key-transformation)
16. [Guards and validation helpers](#guards-and-validation-helpers)
17. [Security and logging](#security-and-logging)
18. [Health checks](#health-checks)
19. [Typing your API](#typing-your-api)
20. [Advanced / low-level exports](#advanced--low-level-exports)
21. [API reference (exports)](#api-reference-exports)
22. [Development](#development-this-repository)
23. [Supply chain](#supply-chain)
24. [Publishing](#publishing-maintainers)

---

## Install

```bash
npm install @vahidkaargar/customized-api-client
```

```typescript
import { createApiClient } from '@vahidkaargar/customized-api-client';
```

---

## Quick start

```typescript
import {
  createApiClient,
  ApiClientError,
  getNextPageUrl,
  readResourceVersion,
} from '@vahidkaargar/customized-api-client';

const client = createApiClient({
  baseURL: 'https://api.example.com/api/v1',
  auth: {
    type: 'bearer',
    getToken: async () => sessionStorage.getItem('access_token'),
  },
});

try {
  const res = await client.get('/widgets');
  if (res.kind === 'jsonapi-success') {
    const doc = res.document;
    const next = getNextPageUrl(doc.links);
    // ...
  }
} catch (e) {
  if (e instanceof ApiClientError) {
    console.error(e.status, e.primaryCode, e.errors);
  }
  throw e;
}
```

---

## Configuration

Pass a single config object to `createApiClient`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | **required** | API origin; see [Base URL modes](#base-url-modes). |
| `baseUrlMode` | `'modeB' \| 'modeA'` | `'modeB'` | How relative paths are joined with `baseURL`. |
| `auth` | `AuthConfig` | — | Bearer token or partner secret provider. |
| `getAcceptLanguage` | `() => string \| null \| …` | — | Sets `Accept-Language` when returned value is non-empty. |
| `defaultHeaders` | `Record<string, string>` | — | Merged into every request (after JSON:API defaults). |
| `timeout` | `number` | `30000` | Axios timeout in ms. |
| `retry` | `RetryOptions` | see [Retries](#retries) | Bounded retry with backoff. |
| `generateIdempotencyKey` | `() => string` | ULID | Custom idempotency key factory for mutations. |
| `onIdempotencyReplay` | `(ctx) => void` | — | Called when response has `Idempotent-Replayed: true`. |
| `onUnauthorized` | `(error) => void \| Promise<void>` | — | Called when a response normalizes to **401**. |
| `onDeprecated` | `(info) => void` | — | Called when deprecation/sunset headers are present. |
| `transformResponseKeys` | `'none' \| 'camelCase-attributes-meta'` | `'none'` | Optional camelCase on `attributes` / `meta` only. |
| `maxBodyLogLength` | `number` | — | Documented cap for logging; use `truncateForLog` in app code. |

### Authentication

User and partner credentials both use **`Authorization: Bearer …`** (no extra partner headers).

```typescript
// User session token
auth: { type: 'bearer', getToken: () => getAccessToken() }

// Partner integration (same header shape)
auth: { type: 'partner-bearer', getSecret: () => process.env.PARTNER_SECRET }
```

If the provider returns `null` / `undefined`, no `Authorization` header is sent.

---

## Base URL modes

### Mode B (default)

`baseURL` **includes** `/api/v1`. Resource paths are short:

```typescript
createApiClient({ baseURL: 'https://api.example.com/api/v1' });
await client.get('/admin/teams'); // → https://api.example.com/api/v1/admin/teams
```

If a path accidentally repeats `/api/v1` while `baseURL` already ends with `/api/v1`, the client strips the duplicate segment.

### Mode A

`baseURL` is **origin only**; the client prefixes `/api/v1` for relative paths that do not already start with it:

```typescript
createApiClient({
  baseURL: 'https://api.example.com',
  baseUrlMode: 'modeA',
});
await client.get('/teams'); // → https://api.example.com/api/v1/teams
```

### Absolute URLs

`getByUrl(fullUrl)` and `request({ url: 'https://…' })` use the URL as-is (still through interceptors: auth, JSON:API headers, retries).

---

## Making requests

### Verb methods (throw on error)

| Method | HTTP | Notes |
|--------|------|--------|
| `get(path, opts?)` | GET | |
| `head(path, opts?)` | HEAD | Often `no-content` (204). |
| `post(path, data?, opts?)` | POST | Sends idempotency key. |
| `patch(path, data?, opts?)` | PATCH | Sends idempotency key. |
| `put(path, data?, opts?)` | PUT | Sends idempotency key. |
| `delete(path, opts?)` | DELETE | Sends idempotency key. |
| `patchWithVersion(path, data, version, opts?)` | PATCH | Sets `If-Match: "v=<version>"`. |
| `getByUrl(fullUrl, opts?)` | GET | Follow `links.next` or external URLs. |
| `request(axConfig, opts?)` | any | Escape hatch; merges `opts` with Axios config. |

Per-call options (`RequestCallOptions`):

```typescript
await client.post('/widgets', body, {
  idempotencyKey: 'my-stable-key', // max 64 chars
  ifMatchVersion: 3,
});
```

### Safe variants (no throw on `ApiClientError`)

Return `Result<ClientSuccess, ApiClientError>`: `{ ok: true, value }` or `{ ok: false, error }`.

- `safeGet`, `safeHead`, `safePost`, `safePatch`, `safePut`, `safeDelete`, `safeRequest`

```typescript
const r = await client.safeGet('/widgets');
if (!r.ok) {
  if (r.error.status === 404) return null;
  throw r.error;
}
const doc = r.value.kind === 'jsonapi-success' ? r.value.document : undefined;
```

Non-`ApiClientError` failures (e.g. programmer errors) still throw from `safe*`.

---

## Success results (`ClientSuccess`)

Every successful verb returns a **discriminated union** — narrow on `kind`:

### `jsonapi-success` (200 / 201)

```typescript
if (res.kind === 'jsonapi-success') {
  res.status; // 200 | 201
  res.document; // JsonApiDocument — data, included, links, meta
  res.headers.etag;
  res.headers.contentLanguage;
  res.headers.idempotentReplayed; // true if Idempotent-Replayed: true
}
```

### `no-content` (204)

```typescript
if (res.kind === 'no-content') {
  res.status; // 204
  res.headers;
}
```

### `accepted` (202)

```typescript
if (res.kind === 'accepted') {
  res.location; // absolute URL to poll (resolved from Location header)
  res.rawBody;  // optional server body
}
```

### `multi-status` (207)

```typescript
if (res.kind === 'multi-status') {
  for (const item of res.items) {
    item.httpStatus;
    item.body;
  }
}
```

### Normalized headers (all success kinds)

```typescript
res.headers.etag?: string;
res.headers.contentLanguage?: string;
res.headers.idempotentReplayed: boolean;
res.headers.retryAfterSeconds?: number;
```

---

## Errors

### Default: `ApiClientError`

HTTP **≥ 400** and malformed JSON:API error documents throw **`ApiClientError`** (extends `Error`).

```typescript
import { ApiClientError, isApiClientError } from '@vahidkaargar/customized-api-client';

try {
  await client.patch('/widgets/1', payload);
} catch (e) {
  if (e instanceof ApiClientError) {
    e.status;              // e.g. 422
    e.primaryCode;         // first errors[].code
    e.errors;              // JsonApiErrorObject[]
    e.retryAfterSeconds;   // from Retry-After when parseable
    e.requestMethod;       // e.g. 'PATCH'
    e.responseHeaders;     // redacted in toJSON()
    console.log(e.toJSON()); // safe for logs (secrets redacted)
  }
}
```

Empty or non-JSON error bodies get synthetic codes such as `EMPTY_ERROR_BODY`, `INVALID_JSON`, `MISSING_ERRORS_ARRAY`.

### Validation UX

```typescript
import {
  groupValidationErrorsByPointer,
  isValidationError,
} from '@vahidkaargar/customized-api-client';

if (isValidationError(err)) {
  const byPointer = groupValidationErrorsByPointer(err.errors);
  // { '/data/attributes/name': ['too short', ...], '/': ['...'] }
}
```

---

## Idempotency

- **POST, PATCH, PUT, DELETE** always send **`Idempotency-Key`** (default: **ULID** per request).
- Override per call: `opts.idempotencyKey` (non-empty, max **64** characters).
- Replace generator: `generateIdempotencyKey: () => myKey()`.
- On retry, the **same key and body** are reused.
- When the server replays a prior result, response header **`Idempotent-Replayed: true`** sets `headers.idempotentReplayed` and invokes **`onIdempotencyReplay`**:

```typescript
onIdempotencyReplay: ({ url, method }) => {
  metrics.increment('idempotency_replay');
},
```

**GET / HEAD** never send idempotency keys.

---

## Optimistic concurrency

Versioned resources should send **`If-Match: "v=<n>"`** when updating.

```typescript
// Convenience helper
await client.patchWithVersion('/widgets/42', body, 7);

// Or per call
await client.patch('/widgets/42', body, { ifMatchVersion: 7 });
```

Read version from a resource for the next update:

```typescript
import { readResourceVersion, etagFromResponseHeaders } from '@vahidkaargar/customized-api-client';

const res = await client.get('/widgets/42');
if (res.kind !== 'jsonapi-success' || !res.document.data || Array.isArray(res.document.data)) {
  throw new Error('expected single resource');
}
const resource = res.document.data;
const version = readResourceVersion(resource, res.headers.etag);
// Prefer meta.version (number or numeric string), else ETag v=n
```

Typical server responses: **428** (precondition required), **412** (conflict) — use [guards](#guards-and-validation-helpers); these are **not** auto-retried.

---

## Retries

Default `retry`:

| Field | Default |
|-------|---------|
| `maxAttempts` | `4` |
| `baseDelayMs` | `200` |
| `maxDelayMs` | `10000` |
| `jitterRatio` | `0.2` |

Honors **`Retry-After`** when present (seconds or HTTP-date).

### Policy summary

| Situation | Retried? |
|-----------|----------|
| Network error (no response) | Yes (all methods) |
| GET/HEAD **408, 429, 5xx** | Yes |
| GET/HEAD **401, 403, 412, 428, 4xx** validation | No |
| POST/PATCH/PUT/DELETE **5xx / 429** | **No** (same idempotency key would not help blind 5xx retry) |
| POST/PATCH/PUT/DELETE **409** `IDEMPOTENCY_REQUEST_IN_PROGRESS` | Yes |
| **409** `IDEMPOTENCY_KEY_REUSED` | No |
| **401 / 403 / 412 / 428 / 422** etc. | No |

Disable retries: `retry: { maxAttempts: 1 }`.

Inspect policy in tests or custom tooling: `retryAllowed({ method, status, primaryErrorCode, isNetworkError })`.

---

## Pagination and query parameters

### Following `links.next`

```typescript
import { getNextPageUrl, parsePaginationKind } from '@vahidkaargar/customized-api-client';

let res = await client.get('/widgets');
while (res.kind === 'jsonapi-success') {
  const kind = parsePaginationKind(res.document.meta, res.document.links);
  // kind: 'offset' | 'cursor' | 'unknown'

  const next = getNextPageUrl(res.document.links);
  if (!next) break;
  res = await client.getByUrl(next);
}
```

`parsePaginationKind` understands:

- JSON:API `page[number]`, `page[cursor]`, `page[size]` in `links.next`
- Legacy `page` / `per_page` in URLs
- `meta` fields: `current_page`, `last_page`, `has_more`, `next_cursor`, etc.

### Building query strings

```typescript
import {
  buildJsonApiQuery,
  buildOffsetPageParams,
  buildCursorPageParams,
  DEFAULT_PAGE_SIZE_CAP,
} from '@vahidkaargar/customized-api-client';

const params = {
  ...buildJsonApiQuery({
    filter: { status: 'active', owner_id: 1 },
    sort: ['-created_at', 'name'],
    fields: { widgets: ['name', 'status'] },
    include: ['owner', 'tags'],
  }),
  ...buildOffsetPageParams({ number: 2, size: 50 }),
};
// page[size] is capped at DEFAULT_PAGE_SIZE_CAP (100)

await client.request({
  method: 'GET',
  url: '/widgets',
  params,
});
```

```typescript
const cursorParams = buildCursorPageParams({ cursor: 'abc123', size: 25 });
```

---

## Included resources

```typescript
import { indexIncluded, resolveIncluded } from '@vahidkaargar/customized-api-client';

const res = await client.get('/widgets/1?include=owner');
if (res.kind !== 'jsonapi-success') return;

const idx = indexIncluded(res.document.included);
const ownerRef = { type: 'users', id: '9' };
const owner = resolveIncluded(ownerRef, idx);
```

---

## Async jobs (202) and polling

```typescript
import { pollAsyncResult } from '@vahidkaargar/customized-api-client';

const accepted = await client.post('/jobs', { data: { type: 'jobs', attributes: { … } } });
if (accepted.kind !== 'accepted') throw new Error('expected 202');

const done = await pollAsyncResult(client, accepted, {
  maxAttempts: 10,
  delayMs: 500,
});
// Polls GET on location until non-202 or max attempts (then throws)
```

`accepted.location` is absolute (resolved from `Location` relative to the request URL when needed).

---

## Bulk operations (207)

```typescript
const res = await client.post('/bulk/widgets', bulkPayload);
if (res.kind === 'multi-status') {
  for (const item of res.items) {
    if (item.httpStatus >= 400) {
      // item.body may be a JSON:API error document
    }
  }
}
```

---

## Response key transformation

Wire format uses **snake_case** in JSON:API `attributes` / `meta`. Opt in to shallow **camelCase** on responses only:

```typescript
const client = createApiClient({
  baseURL: 'https://api.example.com/api/v1',
  transformResponseKeys: 'camelCase-attributes-meta',
});

const res = await client.get('/widgets/1');
if (res.kind === 'jsonapi-success' && !Array.isArray(res.document.data) && res.document.data) {
  const attrs = res.document.data.attributes as { displayName?: string };
}
```

**Request bodies are not transformed** — send snake_case (or whatever your API expects).

---

## Guards and validation helpers

| Function | True when |
|----------|-----------|
| `isAuthenticationError` | `ApiClientError` status **401** |
| `isForbiddenError` | **403** |
| `isValidationError` | **422** |
| `isPreconditionRequiredError` | **428** |
| `isPreconditionFailedError` | **412** |
| `isConflictError` | **409** |
| `isPayloadTooLargeError` | **413** |
| `isRetryablePerPolicy` | Would retry per client policy (usually for UI hints, not for manual retry of failed calls) |

---

## Security and logging

- Tokens come only from your **`getToken` / `getSecret`** callbacks; the client does not store credentials.
- **`ApiClientError.toJSON()`** and **`redactHeaderRecord()`** redact `Authorization` and `Idempotency-Key`.
- **`truncateForLog(value, maxLen)`** safely stringifies values for logs (truncates, handles circular refs).
- Non-HTTPS `baseURL` outside **localhost** logs a **one-time** console warning.

```typescript
import { truncateForLog, redactHeaderRecord } from '@vahidkaargar/customized-api-client';

logger.info(truncateForLog(responseBody, 2_000));
```

---

## Health checks

```typescript
import { createHealthCheck } from '@vahidkaargar/customized-api-client';

const ping = createHealthCheck(client); // or pass ApiClientConfig to build a client internally
const ok = await ping(); // GET /health/live — true if no throw
```

---

## Typing your API

This package exports **JSON:API primitives** (`JsonApiDocument`, `ClientSuccess`, helpers)—not endpoint-specific types tied to one backend.

If you want OpenAPI-driven types:

1. Keep the spec in your **backend** repo or a dedicated **`@myorg/api-types`** package.
2. Run codegen there (for example [`openapi-typescript`](https://github.com/drwpow/openapi-typescript))—not in this client package.
3. Pass generated types at call sites via generics:

```typescript
import { createApiClient } from '@vahidkaargar/customized-api-client';
import type { operations } from '@myorg/api-types';

const client = createApiClient({ baseURL: 'https://api.example.com/api/v1', getToken: async () => token });

type MeResponse = operations['getMe']['responses'][200]['content']['application/vnd.api+json'];
const me = await client.get<MeResponse>('/me');
```

You do not need an OpenAPI spec to use this client—string paths and manual types work fine.

---

## Advanced / low-level exports

For custom pipelines, tests, or wrappers:

| Export | Purpose |
|--------|---------|
| `normalizeAxiosResponse` | Map raw Axios response → `ClientSuccess` / throw |
| `parseJsonApiDocument` / `parseJsonApiErrorBody` | Parse success/error payloads |
| `dispatchWithRetry` | Retry wrapper around an `AxiosInstance` |
| `applyJsonApiHeaders` | Content-Type / Accept for JSON:API |
| `resolveResourcePath` | Mode A/B path resolution |
| `flattenAxiosHeaders` / `getHeader` | Header normalization |
| `parseMultiStatusBody` / `resolveAcceptedLocation` | 207 / 202 helpers |
| `parseRetryAfterSeconds` | Retry-After parsing |
| `assertValidIdempotencyKey` / `defaultIdempotencyKey` | Idempotency utilities |

---

## API reference (exports)

### Client

- `createApiClient(config)` → `ApiClient`
- Types: `ApiClient`, `ApiClientConfig`, `RequestCallOptions`, `AuthConfig`, `RetryOptions`, …

### Results & errors

- `ClientSuccess`, `JsonApiSuccessBody`, `NoContentBody`, `AcceptedBody`, `MultiStatusBody`
- `Result`, `OkResult`, `ErrResult`
- `ApiClientError`, `isApiClientError`

### JSON:API types

- `JsonApiDocument`, `JsonApiResourceObject`, `JsonApiErrorObject`, …

### Helpers

- Pagination: `getNextPageUrl`, `parsePaginationKind`
- Query: `buildJsonApiQuery`, `buildOffsetPageParams`, `buildCursorPageParams`
- Included: `indexIncluded`, `resolveIncluded`
- Version: `readResourceVersion`, `etagFromResponseHeaders`
- Forms: `groupValidationErrorsByPointer`
- Deprecation: `parseDeprecationHeaders`, `DeprecationInfo`
- Transform: `applyTransformKeys`
- Poll: `pollAsyncResult`
- Health: `createHealthCheck`
- Security: `redactHeaderRecord`, `truncateForLog`

---

## Development (this repository)

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

CI uses **`node-version: '22.21'`** in **[`ci.yml`](.github/workflows/ci.yml)** plus global **npm** **`^11.5.1`**, pinned that way because bare **`22`** can resolve to **22.22.x** with a bundled npm regression that breaks **`npm install -g npm`** on GitHub-hosted runners ([runner-images discussion](https://github.com/actions/runner-images/issues/13883)).

---

## Supply chain

- **SECURITY policy:** Root [SECURITY.md](SECURITY.md) — supported versions and how to report issues privately.
- **Dependabot:** [`.github/dependabot.yml`](.github/dependabot.yml) requests weekly npm bumps; enable **Dependabot alerts** / **security updates** in repo settings when available.
- **CI audit:** **`npm audit --omit=dev --audit-level=moderate`** runs on every **`main`/PR** CI (production dependencies only).
- **Provenance:** The publish workflow ships **`npm publish --provenance`** when using [Trusted Publishers](https://docs.npmjs.com/trusted-publishers) (OIDC from GitHub Actions).

---

## Publishing (maintainers)

**Preferred:** [Trusted Publishers](https://docs.npmjs.com/trusted-publishers) (OIDC) — no long-lived **`NPM_TOKEN`** in GitHub Secrets for this workflow.

1. On [npmjs.com](https://www.npmjs.com/) → package **Access** / **Publishing** settings: enable **Trusted publishing** from **GitHub** for repository **`vahidkaargar/customized-api-client`**, selecting workflow **`.github/workflows/publish-npm.yml`** (exact filename as registered on npm).
2. Bump **`version`** in **`package.json`**, merge to **`main`**, then **Actions** → **Publish to npm** → **Run workflow** ( **`workflow_dispatch`** ).
3. **`publish-npm.yml`** exits early if **`package.json`** `version` is already on npm so you avoid a long failed run (**fail-fast before** tests and build).

Workflow permissions use **`contents: read`** and **`id-token: write`**; **[`publish-npm.yml`](.github/workflows/publish-npm.yml)** runs the same gates as **[`ci.yml`](.github/workflows/ci.yml)** (Node **`22.21`**, global **npm** **`^11.5.1`**) and then **`npm publish --provenance`**.

**Legacy (token publish):** If Trusted Publishing cannot be configured, restore a publish step env block with **`NODE_AUTH_TOKEN`** from a granular npm token (**Read and write** for this package; **Automation / bypass 2FA** if your npm account requires it for unattended publish). Prefer OIDC for supply-chain hygiene once enabled.

[`publishConfig.access`](package.json) on this scope is **`public`**.

---

## License

MIT
