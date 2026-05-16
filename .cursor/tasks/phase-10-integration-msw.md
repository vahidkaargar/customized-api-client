# Phase 10 — Integration tests (MSW)

## Goals
- End-to-end HTTP behaviors with **MSW**: replay, preconditions, auth, multi-status, accepted+poll, **`links.next`**, **patch with version**.

## Files to touch
- `test/integration/*`, MSW setup shared helper if needed

## Tests to add / pass
- `replay.test.ts`
- `precondition.test.ts`
- `auth-401.test.ts`
- `multi-status.test.ts`
- `accepted-poll.test.ts`
- `follow-next-link.test.ts`
- `patch-with-version.test.ts`

## Exit criteria
- All integration files in [project-plan.md §11](project-plan.md) exist and pass together.
