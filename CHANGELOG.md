# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- New `safeGetByUrl()` and `safePatchWithVersion()` instance methods to complete the safe* parity across all verbs
- Optional `signal?: AbortSignal` on `RequestCallOptions` for request cancellation (no new dependencies)
- Comprehensive test coverage for all mutation HTTP methods (DELETE, PUT, PATCH idempotency headers on wire)
- Test coverage for retry policy on HEAD, DELETE, PUT, and PATCH methods
- Test coverage for retry-after header edge cases (undefined, empty string)
- Test coverage for `formatIfMatch()` with boundary values (version 0, NaN, Infinity)
- Test coverage for form error grouping with empty errors array
- Test coverage for 207 multi-status with top-level array format
- Test coverage for config wiring (`defaultHeaders`, custom `generateIdempotencyKey`, `timeout`)
- Test coverage for `Idempotent-Replayed: 'True'` (capital T) header normalization
- MIT LICENSE file for legal clarity

### Changed

- Consolidated duplicate `Retry-After` header parsing: removed private `parseRetryAfterHeader()` in `src/parse/errors.ts`, now uses shared `parseRetryAfterSeconds()` from `src/retry/retry-after.ts`
- Updated `.github/workflows/publish-npm.yml` to include `npm audit --omit=dev --audit-level=moderate` for prod dependency verification parity with CI
- Updated README Publishing section to document exact gate sequence parity between publish and CI workflows

### Fixed

- Removed misleading claim in README about publish workflow gates — now accurately states full test and audit sequence

## [0.2.2] - 2026-05-16

**Initial stable release** with full JSON:API v1.1 client support, idempotency, concurrency, retry policy, safe* dual API.

---

[Unreleased]: https://github.com/vahidkaargar/customized-api-client/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/vahidkaargar/customized-api-client/releases/tag/v0.2.2
