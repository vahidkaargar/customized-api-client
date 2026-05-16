# Phase 04 — Security redaction

## Goals
- Strip / redact **`Authorization`** from **`ApiClientError`** serialization, **`toJSON`**, and any debug/error string paths.
- Optional: truncate request body logging via **`maxBodyLogLength`**.

## Files to touch
- `src/security/redact.ts`
- Wire hooks from **`ApiClientError`** (Phase 02) if not already

## Tests to add / pass
- `redact.test.ts`

## Exit criteria
- No bearer token appears in JSON-serialized errors or redacted logs in test assertions.
