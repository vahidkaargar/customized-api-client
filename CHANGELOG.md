# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-05-21

### Added

- `locale` on `ApiClientConfig` — `getLocale`, `defaultLocale` (omit `Accept-Language` when resolved locale matches), `onLocaleMismatch` (`'warn'` or callback)
- Locale helpers: `normalizeLocaleCode`, `parseContentLanguage`, `localesMatch`, `acceptLanguageForRequest`, `resolveRequestLocale`, `readResponseContentLanguage`, `notifyLocaleMismatch`
- Optional `Content-Language` mismatch reporting (primary subtag comparison; does not change consumer locale)
- README: **Locale (Accept-Language / Content-Language)** section

### Changed

- `getAcceptLanguage` is deprecated in favor of `locale.getLocale` (still supported)

## [0.3.0] - 2026-05-18

### Added

- `hasErrorCode`, `isApiClientErrorWithCode`, `isIdempotencyKeyRequiredError`, `isIfMatchRequiredError`, `isMfaVerificationRequiredError` — disambiguate HTTP **428** by `errors[].code`
- `postFormData` on `ApiClient` for multipart uploads
- `ClientSuccessWithDocument<T>` and optional verb generics for typed JSON:API documents
- README: multipart / FormData upload recipe

### Fixed

- `applyJsonApiHeaders` no longer sets JSON:API `Content-Type` for `FormData`, binary bodies, and other non-JSON payloads

## [0.2.4] - 2026-05-18

### Added

- `retry.retryMutationsOnServerError` — opt-in automatic retries for **HTTP 5xx** on POST/PUT/PATCH/DELETE (same request config, so same `Idempotency-Key` and body); `Retry-After` honored the same as for reads
- `isRetryablePerPolicy(error, { retryMutationsOnServerError })` optional second argument so UI hints match client retry settings

### Fixed

- CI: markdownlint **MD024** scoped to sibling headings only so Keep a Changelog’s repeated `### Added` / `### Changed` blocks stay valid

## [0.2.3] - 2026-05-16

### Added

- `safeGetByUrl()` and `safePatchWithVersion()` for full `safe*` parity with throwing verbs
- Optional `signal?: AbortSignal` on `RequestCallOptions` for request cancellation
- Root `LICENSE` (MIT) and `CHANGELOG.md`
- Expanded tests: mutation idempotency on wire, retry policy for HEAD/PUT/PATCH/DELETE, config wiring, 207 array bodies, and related edge cases

### Changed

- README reorganized for application developers: quick start, decision tables, recipes, collapsible helper sections
- Deduplicated `Retry-After` parsing via shared `parseRetryAfterSeconds()`
- Publish workflow runs production `npm audit` (parity with CI)

### Fixed

- README no longer lists `signal` as a client-level config option (it is per-request only)

## [0.2.2] - 2026-05-16

**Initial stable release** with full JSON:API v1.1 client support, idempotency, concurrency, retry policy, safe* dual API.

---

[Unreleased]: https://github.com/vahidkaargar/customized-api-client/compare/v0.2.4...HEAD
[0.2.4]: https://github.com/vahidkaargar/customized-api-client/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/vahidkaargar/customized-api-client/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/vahidkaargar/customized-api-client/releases/tag/v0.2.2
