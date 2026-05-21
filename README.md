# `@vahidkaargar/customized-api-client`

TypeScript **Axios** client for **JSON:API v1.1** APIs — Bearer auth, mandatory mutation idempotency, optimistic concurrency, retries, and **typed success/error results** so you rarely touch raw Axios responses.

| | |
|---|---|
| **Node** | ≥ 20 |
| **Modules** | ESM + CJS |
| **Changelog** | [CHANGELOG.md](./CHANGELOG.md) |
| **License** | MIT |

---

## What you get

- **JSON:API headers** — `Content-Type` / `Accept: application/vnd.api+json` on requests
- **Normalized responses** — narrow on `res.kind` (`jsonapi-success`, `no-content`, `accepted`, `multi-status`)
- **Errors** — `ApiClientError` with `status`, `primaryCode`, `errors[]`, safe `toJSON()` for logs
- **Idempotency** — `Idempotency-Key` on POST/PATCH/PUT/DELETE (ULID by default)
- **Concurrency** — `If-Match: "v=<n>"` via `patchWithVersion` or `ifMatchVersion`
- **Retries** — explicit policy (safe GET/HEAD vs mutations); honors `Retry-After`; optional mutation **5xx** retries
- **Two ergonomics** — throwing verbs **or** `safe*` methods returning `{ ok, value \| error }`
- **Cancellation** — optional `AbortSignal` per request

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

**1. Create a client** (Mode B: `baseURL` already includes `/api/v1`):

```typescript
import { createApiClient, ApiClientError } from '@vahidkaargar/customized-api-client';

const client = createApiClient({
  baseURL: 'https://api.example.com/api/v1',
  auth: {
    type: 'bearer',
    getToken: async () => sessionStorage.getItem('access_token'),
  },
});
```

**2. Call the API** (default: throws `ApiClientError` on HTTP errors):

```typescript
try {
  const res = await client.get('/widgets');
  if (res.kind === 'jsonapi-success') {
    console.log(res.document.data);
  }
} catch (e) {
  if (e instanceof ApiClientError) {
    console.error(e.status, e.primaryCode, e.errors);
  }
  throw e;
}
```

**3. Prefer no `try/catch` for expected errors?** Use `safe*` — see [Error handling](#error-handling).

---

## Guide for application developers

### Pick a base URL mode

| Mode | `baseURL` example | Path you pass | Result |
|------|-------------------|---------------|--------|
| **B** (default) | `https://api.example.com/api/v1` | `/widgets` | `…/api/v1/widgets` |
| **A** | `https://api.example.com` + `baseUrlMode: 'modeA'` | `/widgets` | `…/api/v1/widgets` |

Duplicate `/api/v1` in path + base is stripped automatically in Mode B.

**Absolute URLs:** `getByUrl(links.next)` or `request({ url: 'https://…' })` — still get auth, JSON:API headers, and retries.

### Pick error handling

| Style | When to use | Example |
|-------|-------------|---------|
| **Throwing** (`get`, `post`, …) | Happy path + rare errors; familiar Axios flow | `try { await client.get(…) } catch (e) { … }` |
| **Safe** (`safeGet`, `safePost`, …) | Branch on status without `try/catch` | `const r = await client.safeGet(…); if (!r.ok) …` |

Every throwing method has a `safe*` twin, including `safeGetByUrl` and `safePatchWithVersion`.

Non-`ApiClientError` failures (bugs, abort, network quirks) still **throw** from `safe*`.

### Per-request options

```typescript
const controller = new AbortController();

await client.patch('/widgets/42', body, {
  idempotencyKey: 'stable-key-for-this-action', // optional; max 64 chars
  ifMatchVersion: 7,                            // sets If-Match: "v=7"
  signal: controller.signal,                    // cancel with controller.abort()
});
```

---

## Recipes

Copy-paste patterns for everyday work.

### List resources and follow `links.next`

```typescript
import { getNextPageUrl } from '@vahidkaargar/customized-api-client';

let res = await client.get('/widgets');
while (res.kind === 'jsonapi-success') {
  // use res.document.data …
  const next = getNextPageUrl(res.document.links);
  if (!next) break;
  res = await client.getByUrl(next);
}
```

### Create (POST) with a stable idempotency key

```typescript
await client.post('/widgets', payload, {
  idempotencyKey: `create-widget-${userId}-${draftId}`,
});
```

### Update with optimistic locking

```typescript
import { readResourceVersion } from '@vahidkaargar/customized-api-client';

const current = await client.get('/widgets/42');
if (current.kind !== 'jsonapi-success' || Array.isArray(current.document.data)) {
  throw new Error('expected single resource');
}
const version = readResourceVersion(current.document.data, current.headers.etag);

await client.patchWithVersion('/widgets/42', payload, version);
// or: client.patch('/widgets/42', payload, { ifMatchVersion: version })
```

### Handle validation errors (422)

```typescript
import {
  groupValidationErrorsByPointer,
  isValidationError,
} from '@vahidkaargar/customized-api-client';

try {
  await client.post('/widgets', payload);
} catch (e) {
  if (e instanceof ApiClientError && isValidationError(e)) {
    const byField = groupValidationErrorsByPointer(e.errors);
    // { '/data/attributes/name': ['too short'], … }
  }
}
```

### Safe GET when 404 is normal

```typescript
const r = await client.safeGet('/widgets/unknown-id');
if (!r.ok && r.error.status === 404) return null;
if (!r.ok) throw r.error;
return r.value.kind === 'jsonapi-success' ? r.value.document : undefined;
```

### Cancel an in-flight request

```typescript
const controller = new AbortController();
const promise = client.get('/slow-report', { signal: controller.signal });
setTimeout(() => controller.abort(), 5_000);
await promise; // throws when aborted
```

### Non-JSON:API bodies (multipart)

For file uploads, send `FormData` — the client keeps `Accept: application/vnd.api+json`, omits JSON:API `Content-Type` (Axios sets the multipart boundary), and still sends `Idempotency-Key` on POST.

```typescript
const fd = new FormData();
fd.append('file', file, file.name);

await client.request({ method: 'POST', url: '/media', data: fd });
// or:
await client.postFormData('/media', fd);
```

### Poll an async job (202)

```typescript
import { pollAsyncResult } from '@vahidkaargar/customized-api-client';

const accepted = await client.post('/jobs', jobPayload);
if (accepted.kind !== 'accepted') throw new Error('expected 202');

const done = await pollAsyncResult(client, accepted, {
  maxAttempts: 10,
  delayMs: 500,
});
```

---

## Configuration

Client-level options for `createApiClient({ … })`:

| Option | Default | Description |
|--------|---------|-------------|
| `baseURL` | **required** | API origin — [base URL modes](#pick-a-base-url-mode) |
| `baseUrlMode` | `'modeB'` | `'modeB'` \| `'modeA'` |
| `auth` | — | `{ type: 'bearer', getToken }` or `{ type: 'partner-bearer', getSecret }` |
| `timeout` | `30000` | Axios timeout (ms) |
| `defaultHeaders` | — | Merged into every request |
| `retry` | see [Retries](#retries) | `maxAttempts`, backoff, jitter |
| `generateIdempotencyKey` | ULID | Factory for mutation keys |
| `locale` | — | `getLocale`, `defaultLocale`, `onLocaleMismatch` — see [Locale](#locale-accept-language--content-language) |
| `getAcceptLanguage` | — | **Deprecated** — use `locale.getLocale`; sets `Accept-Language` when non-empty |
| `onIdempotencyReplay` | — | Fired when `Idempotent-Replayed: true` |
| `onUnauthorized` | — | Fired on normalized **401** |
| `onDeprecated` | — | Deprecation / sunset headers |
| `transformResponseKeys` | `'none'` | `'camelCase-attributes-meta'` on response only |
| `maxBodyLogLength` | — | Hint for app logging; use `truncateForLog` |

### Authentication

User and partner credentials both use **`Authorization: Bearer …`**.

```typescript
auth: { type: 'bearer', getToken: () => getAccessToken() }
auth: { type: 'partner-bearer', getSecret: () => process.env.PARTNER_SECRET }
```

If `getToken` / `getSecret` returns `null` or `undefined`, no `Authorization` header is sent.

### Locale (Accept-Language / Content-Language)

Configure locale once on the client (e.g. for backends with `SetLocaleMiddleware`). This package only sets HTTP headers and optional mismatch reporting — not vue-i18n, `GET /locales`, or `GET /translations`.

```typescript
const client = createApiClient({
  baseURL: 'https://api.example.com/api/v1',
  locale: {
    getLocale: () => getStoredLocale(), // 'en' | 'fr' | 'fa'
    defaultLocale: 'en', // omit Accept-Language when UI locale is English (server default)
    onLocaleMismatch: import.meta.env.DEV ? 'warn' : undefined,
  },
});
```

| Behavior | Detail |
|----------|--------|
| **Accept-Language** | From `locale.getLocale()` on every request via this client |
| **Omit for default** | When resolved locale matches `defaultLocale` (primary subtag), header is not sent |
| **Content-Language** | Exposed on success as `res.headers.contentLanguage` |
| **Mismatch** | If response `Content-Language` differs from requested locale (base tag: `fr` vs `fr-FR` match), `'warn'` or your callback runs — UI locale is never changed |

Legacy `getAcceptLanguage` still works; `locale.getLocale` takes precedence when both are set.

---

## Making requests

### Throwing methods

| Method | HTTP | Notes |
|--------|------|--------|
| `get` / `head` | GET / HEAD | No idempotency key |
| `post` / `patch` / `put` / `delete` | … | Sends `Idempotency-Key` |
| `patchWithVersion(path, data, version)` | PATCH | Sets `If-Match` |
| `getByUrl(fullUrl)` | GET | Absolute URL (e.g. `links.next`) |
| `request(axConfig, opts?)` | any | Low-level escape hatch |

### Safe methods

`safeGet`, `safeHead`, `safePost`, `safePatch`, `safePut`, `safeDelete`, `safeRequest`, `safeGetByUrl`, `safePatchWithVersion`

```typescript
const r = await client.safePatchWithVersion('/widgets/1', body, 3);
if (r.ok) {
  console.log(r.value);
} else {
  console.log(r.error.status, r.error.primaryCode);
}
```

---

## Success results (`ClientSuccess`)

Narrow on `kind`:

| `kind` | Status | Main fields |
|--------|--------|-------------|
| `jsonapi-success` | 200, 201 | `document`, `headers` |
| `no-content` | 204 | `headers` |
| `accepted` | 202 | `location`, `rawBody?` |
| `multi-status` | 207 | `items[]` with `httpStatus`, `body` |

All success kinds expose `headers.etag`, `headers.contentLanguage`, `headers.idempotentReplayed`, and optional `headers.retryAfterSeconds`.

---

## Error handling

### `ApiClientError` (default on throwing methods)

HTTP **≥ 400** and malformed JSON:API error bodies throw **`ApiClientError`**.

| Field | Meaning |
|-------|---------|
| `status` | HTTP status |
| `primaryCode` | First `errors[].code` |
| `errors` | `JsonApiErrorObject[]` |
| `retryAfterSeconds` | From `Retry-After` when parseable |
| `requestMethod` | e.g. `'PATCH'` |
| `toJSON()` | Log-safe (secrets redacted) |

Synthetic codes when the body is missing or invalid: `EMPTY_ERROR_BODY`, `INVALID_JSON`, `MISSING_ERRORS_ARRAY`.

### Guards

| Helper | True when |
|--------|-----------|
| `isAuthenticationError` | 401 |
| `isForbiddenError` | 403 |
| `isValidationError` | 422 |
| `isPreconditionRequiredError` | any **428** |
| `isIdempotencyKeyRequiredError` | **428** + `IDEMPOTENCY_KEY_REQUIRED` |
| `isIfMatchRequiredError` | **428** + `IF_MATCH_REQUIRED` |
| `isMfaVerificationRequiredError` | **428** + `MFA_VERIFICATION_REQUIRED` |
| `hasErrorCode` / `isApiClientErrorWithCode` | matching `errors[].code` |
| `isPreconditionFailedError` | 412 |
| `isConflictError` | 409 |
| `isPayloadTooLargeError` | 413 |
| `isRetryablePerPolicy` | Would retry per client policy (UI hints); pass `{ retryMutationsOnServerError: true }` to match clients that opt into mutation **5xx** retries |

---

## Idempotency

- **POST, PATCH, PUT, DELETE** send **`Idempotency-Key`** (ULID per request by default).
- Retries reuse the **same key and body** within one client call (`dispatchWithRetry`).
- For **separate** `post`/`patch`/… invocations, pass the same `idempotencyKey` yourself if they represent the same user intent.
- Server replay → header `Idempotent-Replayed: true` → `headers.idempotentReplayed` + optional `onIdempotencyReplay`.
- **GET / HEAD** never send idempotency keys.

---

## Optimistic concurrency

Send **`If-Match: "v=<n>"`** when the resource is versioned:

```typescript
await client.patchWithVersion('/widgets/42', body, version);
```

Read version with `readResourceVersion(resource, etag)` — prefers `meta.version`, else ETag `v=n`.

**412** / **428** are not auto-retried.

---

## Retries

| Field | Default |
|-------|---------|
| `maxAttempts` | `4` |
| `baseDelayMs` | `200` |
| `maxDelayMs` | `10000` |
| `jitterRatio` | `0.2` |
| `retryMutationsOnServerError` | `false` |

| Situation | Retried? |
|-----------|----------|
| Network error (no response) | Yes |
| GET/HEAD **408, 429, 5xx** | Yes |
| GET/HEAD **401, 403, 412, 428**, validation 4xx | No |
| Mutations **5xx / 429** | No (set `retry: { retryMutationsOnServerError: true }` to retry **5xx** only; **429** stays off) |
| Mutation **409** `IDEMPOTENCY_REQUEST_IN_PROGRESS` | Yes |
| **409** `IDEMPOTENCY_KEY_REUSED` | No |

When `retryMutationsOnServerError` is **true**, POST/PUT/PATCH/DELETE responses with status **500–599** use the same backoff and `Retry-After` handling as reads, with the **same** request config (so the same `Idempotency-Key` and body). Use this when your server does **not** persist a replay body for **5xx** and allows the handler to run again for the same key.

Disable: `retry: { maxAttempts: 1 }`. Inspect logic: `retryAllowed({ … })` (include `retryMutationsOnServerError` when mirroring client config). For thrown errors: `isRetryablePerPolicy(err, { retryMutationsOnServerError: true })`.

---

## More helpers

### Pagination and query building

```typescript
import {
  buildJsonApiQuery,
  buildOffsetPageParams,
  buildCursorPageParams,
  parsePaginationKind,
} from '@vahidkaargar/customized-api-client';

const params = {
  ...buildJsonApiQuery({
    filter: { status: 'active' },
    sort: ['-created_at'],
    include: ['owner'],
  }),
  ...buildOffsetPageParams({ number: 2, size: 50 }),
};

await client.request({ method: 'GET', url: '/widgets', params });
```

### Included resources

```typescript
import { indexIncluded, resolveIncluded } from '@vahidkaargar/customized-api-client';

const idx = indexIncluded(res.document.included);
const owner = resolveIncluded({ type: 'users', id: '9' }, idx);
```

### Bulk 207

```typescript
const res = await client.post('/bulk/widgets', bulkPayload);
if (res.kind === 'multi-status') {
  for (const item of res.items) {
    if (item.httpStatus >= 400) { /* item.body may be errors */ }
  }
}
```

### Response camelCase (opt-in)

```typescript
createApiClient({
  baseURL: '…',
  transformResponseKeys: 'camelCase-attributes-meta',
});
// Request bodies are NOT transformed — send snake_case on the wire.
```

### Security and logging

- Tokens only from your `getToken` / `getSecret` callbacks.
- `redactHeaderRecord`, `truncateForLog`, `ApiClientError.toJSON()` redact secrets.
- Non-HTTPS `baseURL` (except localhost) logs a one-time warning.

### Health check

```typescript
import { createHealthCheck } from '@vahidkaargar/customized-api-client';

const ping = createHealthCheck(client);
const ok = await ping(); // GET /health/live
```

---

## Typing your API

This package ships **generic JSON:API types**, not endpoint-specific OpenAPI types.

1. Keep OpenAPI in your backend or `@myorg/api-types`.
2. Codegen there (e.g. `openapi-typescript`).
3. Use generics at call sites:

```typescript
import type { JsonApiDocument, JsonApiResourceObject } from '@vahidkaargar/customized-api-client';
import type { operations } from '@myorg/api-types';

type MeDoc = JsonApiDocument<JsonApiResourceObject>;
// Or from OpenAPI: operations['getMe']['responses'][200]['content']['application/vnd.api+json']

const res = await client.get<MeDoc>('/me');
if (res.kind === 'jsonapi-success') {
  const me = res.document.data; // document typed as MeDoc
}
```

The generic narrows `document` on **`jsonapi-success`**; `accepted`, `no-content`, and `multi-status` shapes are unchanged. String paths and manual types work without OpenAPI.

---

## Advanced exports

For custom wrappers, tests, or pipelines:

`normalizeAxiosResponse`, `parseJsonApiDocument`, `parseJsonApiErrorBody`, `dispatchWithRetry`, `applyJsonApiHeaders`, `resolveResourcePath`, `parseMultiStatusBody`, `parseRetryAfterSeconds`, `assertValidIdempotencyKey`, …

Full list: [`src/index.ts`](./src/index.ts).

---

## Table of contents (full reference)

1. [What you get](#what-you-get)
2. [Install](#install)
3. [Quick start](#quick-start)
4. [Guide for application developers](#guide-for-application-developers)
5. [Recipes](#recipes)
6. [Configuration](#configuration)
7. [Making requests](#making-requests)
8. [Success results](#success-results-clientsuccess)
9. [Error handling](#error-handling)
10. [Idempotency](#idempotency)
11. [Optimistic concurrency](#optimistic-concurrency)
12. [Retries](#retries)
13. [More helpers](#more-helpers)
14. [Typing your API](#typing-your-api)
15. [Advanced exports](#advanced-exports)
16. [Development](#development-this-repository)
17. [Supply chain](#supply-chain)
18. [Publishing](#publishing-maintainers)

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

CI uses **`node-version: '22.21'`** in [`ci.yml`](.github/workflows/ci.yml) plus global **npm** `^11.5.1`.

---

## Supply chain

- [SECURITY.md](SECURITY.md) — reporting vulnerabilities
- [`.github/dependabot.yml`](.github/dependabot.yml) — weekly dependency PRs
- CI runs **`npm audit --omit=dev --audit-level=moderate`** on production deps
- Publish uses **`npm publish --provenance`** (OIDC)

---

## Publishing (maintainers)

1. Bump **`version`** in **`package.json`** and update **[CHANGELOG.md](./CHANGELOG.md)**.
2. Merge to **`main`**, then **Actions → Publish to npm → Run workflow**.
3. Workflow fails fast if the version already exists on npm.

[`publish-npm.yml`](.github/workflows/publish-npm.yml) runs the same gates as [`ci.yml`](.github/workflows/ci.yml) (audit, typecheck, lint, coverage, build, post-build tests), then publishes with provenance.

---

## License

MIT — see [LICENSE](./LICENSE).
