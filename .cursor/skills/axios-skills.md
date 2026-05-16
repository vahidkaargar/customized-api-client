# Axios skills — `@vahidkaargar/customized-api-client`

**These patterns supplement the canonical runbook [`../tasks/project-plan.md`](../tasks/project-plan.md). If anything conflicts, follow the runbook and [`.cursor/rules/axios-rules.md`](../rules/axios-rules.md).**

---

## 1. Create configurable Axios instance

One instance per `createApiClient`; centralized interceptors and defaults match [project-plan §4](../tasks/project-plan.md).

```typescript
import axios, { type AxiosInstance } from 'axios';

/** Matches `ApiClientConfig` in `src/types/config.ts` once implemented */
export function createAxiosInstance(config: {
  baseURL: string;
  timeout?: number;
}): AxiosInstance {
  return axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 30000,
    validateStatus: () => true,
    headers: {
      Accept: 'application/vnd.api+json',
    },
  });
}
```

Add **`Content-Type: application/vnd.api+json`** in the request path for body methods only (not shown on GET/HEAD).

---

## 2. Authentication interceptor

User **bearer** vs **partner-bearer** both emit **`Authorization: Bearer …`** ([project-plan §3](../tasks/project-plan.md)).

```typescript
instance.interceptors.request.use((requestConfig) => {
  // Resolve token/secret asynchronously in real client — pattern only
  const token = authProvider.getToken?.();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});
```

---

## 3. Response logging (safe metadata)

Log method, URL, status — **never** log `Authorization` or `Idempotency-Key`.

```typescript
instance.interceptors.response.use((response) => {
  logger.debug({
    method: response.config.method,
    url: response.config.url,
    status: response.status,
  });
  return response;
});
```

---

## 4. Idempotent mutation request

Mutations: **POST, PATCH, PUT, DELETE** require **`Idempotency-Key`**. Default key = **ULID** from `generateIdempotencyKey`; max length **64**; not logged.

```typescript
await axiosInstance.post('/widgets', jsonApiDocument, {
  headers: {
    'Idempotency-Key': idempotencyKey,
  },
});
```

---

## 5. PATCH with optimistic concurrency

Use **`If-Match: "v=<n>"`** when the API exposes numeric **version** ([project-plan §0](../tasks/project-plan.md)). Still send **`Idempotency-Key`** on mutations.

```typescript
await axiosInstance.patch(
  `/widgets/${id}`,
  jsonApiDocument,
  {
    headers: {
      'If-Match': '"v=7"',
      'Idempotency-Key': idempotencyKey,
    },
  },
);
```

When the server returns an opaque ETag instead, pass the quoted value your contract expects.

---

## 6. PUT and DELETE with keys

**PUT** and **DELETE** are mutations: **`Idempotency-Key`** always; **`If-Match`** when doing a versioned write/delete.

```typescript
await axiosInstance.delete(`/widgets/${id}`, {
  headers: {
    'If-Match': '"v=7"',
    'Idempotency-Key': idempotencyKey,
  },
});
```

---

## 7. JSON:API query builder

Bracket params per [project-plan §9 / helpers](../tasks/project-plan.md). Wire format stays **`snake_case`** in attributes; query keys follow JSON:API / OpenAPI.

```typescript
const params: Record<string, string | number | undefined> = {
  include: includeJoinOrUndefined,
  'page[number]': 1,
  'page[size]': 20,
};
```

Optional: `qs.stringify` with `encodeValuesOnly: true` — must match **`query-builder.test.ts`** when implemented.

---

## 8. Retry (pseudocode — use project’s `execute-with-retry`)

Do **not** treat the snippet below as a dependency choice. Implement **`retryAllowed`** and **`execute-with-retry`** per [project-plan §7](../tasks/project-plan.md); third-party **`axios-retry`** is optional and only if behavior matches §7 exactly.

```typescript
function shouldRetry(method: string, status: number | undefined, code?: string): boolean {
  // Delegate to src/retry/policy.ts — illustrative only
  if (method === 'get' && status === 503) return true;
  if (status === 429) return true;
  if (status === 409 && code === 'IDEMPOTENCY_REQUEST_IN_PROGRESS') return true;
  if (status === 409 && code === 'IDEMPOTENCY_KEY_REUSED') return false;
  if (status === 412 || status === 428) return false;
  return false;
}
```

Mutation retries must reuse the **same** **`Idempotency-Key`** and **same serialized body**.

---

## 9. Public API shapes (throw vs safe)

- **Throwing:** `await client.get(...)` → success result or **throws `ApiClientError`**.
- **Safe:** `const r = await client.safeGet(...)` → **`Result`/`ClientResult`**; **same** normalizer as throwing path ([project-plan §2, §A](../tasks/project-plan.md)).

Implement both so call sites can choose **try/catch** or exhaustive handling.

---

## References

- [Axios documentation](https://axios-http.com/docs/intro)
- [JSON:API 1.1](https://jsonapi.org/format/)
