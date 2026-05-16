# Axios rules — `@vahidkaargar/customized-api-client`

## Hierarchy of truth (read first)

If anything here disagrees with the canonical runbook, **the runbook wins**.

1. **[`../tasks/project-plan.md`](../tasks/project-plan.md)** — full API contract, §7 `retryAllowed`, headers pipeline, tests, phases.
2. **[`../../AGENTS.md`](../../AGENTS.md)** and **[`../../.cursorrules`](../../.cursorrules)** — package-wide naming and constraints.
3. **This file** — Axios-specific behavior only; **do not** duplicate the full §7 retry table (link it to avoid drift).

---

## Purpose

Use **one Axios instance per `createApiClient`** so interceptors, headers, retries, and error normalization stay consistent with [project-plan §4](../tasks/project-plan.md).

---

## 1. Single `AxiosInstance`

- **Exactly one** `axios.create(...)` per client instance.
- **`validateStatus: () => true`** so the stack maps status codes to typed results instead of Axios throwing on 4xx/5xx ([project-plan §6](../tasks/project-plan.md)).
- **Default `Accept`:** `application/vnd.api+json` on all requests.
- **`Content-Type`:** `application/vnd.api+json` only for methods that send a JSON body (POST, PATCH, PUT as applicable); do not imply a body on GET/HEAD ([project-plan §4](../tasks/project-plan.md)).

---

## 2. Idempotency (`Idempotency-Key`)

- Required on **POST, PATCH, PUT, DELETE** — never on GET/HEAD ([project-plan §0](../tasks/project-plan.md)).
- Default generator: **ULID**; configurable via `generateIdempotencyKey`.
- **Max length 64**; validate before send.
- **Never** log key values (redact like auth) ([project-plan §8](../tasks/project-plan.md)).

---

## 3. Concurrency (`If-Match`)

- When using numeric resource versions: **`If-Match: "v=<n>"`** ([project-plan §0](../tasks/project-plan.md)).
- Use the package **`formatIfMatch` / version helpers** when present; raw ETag strings are allowed only if the server uses weak/opaque ETags and the contract documents it.

---

## 4. Retries

Implement **`retryAllowed(method, ctx)`** and execution in **`src/retry/`** exactly as in **[project-plan §7](../tasks/project-plan.md)** — including:

- GET/HEAD: network failures, selected 5xx, 429 with Retry-After, etc.
- Mutations: same **`Idempotency-Key`** and **same serialized body** on retry; **`409` + `IDEMPOTENCY_REQUEST_IN_PROGRESS`** bounded retry; **`409` + `IDEMPOTENCY_KEY_REUSED`** must **not** loop blindly.
- **412 / 428** and auth/validation failures are **not** blind transient retries.

Read **`Idempotent-Replayed`** on responses; do not rely on a third-party retry library as the source of truth unless it matches §7.

---

## 5. Response and error surface

- Map responses to the discriminated **`ClientResult`** / success kinds in [project-plan §5](../tasks/project-plan.md).
- **Default verb methods throw `ApiClientError`** on failure HTTP.
- **Also expose `safe*` / `requestSafe`** returning a **`Result`/`ClientResult`** union with **the same normalization path** as the throwing API ([project-plan §A, §2](../tasks/project-plan.md)).
- **Do not** mandate “never throw” for the whole public API — that contradicts the canonical default.

---

## 6. HTTP status and “precedence”

- The client receives **one** HTTP status per response. Classify UX and guards from **that status** and **`errors[].code`** ([AGENTS.md](../../AGENTS.md)).
- Server-side status precedence chains are **documentation for API authors**, not something the client recomputes ([project-plan §0](../tasks/project-plan.md)).

---

## 7. Security and logging

- Redact **`Authorization`** and **idempotency keys** from logs, serialized errors, and `toJSON` ([`src/security/redact.ts`](../../src/security/redact.ts) per layout in project-plan).
- Log only safe metadata: method, path/url pattern, status, timing — never payloads with secrets.

---

## 8. Query serialization

- JSON:API bracket notation: `filter[...]`, `fields[type]`, `page[number]`, `page[size]`, `page[cursor]`, `include`, `sort`.
- Implement **`buildJsonApiQuery`** and page builders in **`src/helpers/query.ts`** as specified in project-plan; optional `qs` / `encodeValuesOnly` must match **`query-builder.test.ts`** when it exists.

---

## References

- [Axios documentation](https://axios-http.com/docs/intro)
- [JSON:API 1.1](https://jsonapi.org/format/)
- [Idempotency-Key draft](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header)
