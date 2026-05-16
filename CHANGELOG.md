# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/vahidkaargar/customized-api-client/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/vahidkaargar/customized-api-client/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/vahidkaargar/customized-api-client/releases/tag/v0.2.2
