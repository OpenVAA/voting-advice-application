---
created: 2026-10-07T12:53:29.000Z
title: send-email/jwtSegment.ts is imported by nothing but its own test
area: apps/supabase - Edge Functions
severity: minor
source: Phase 174 (174-07-SUMMARY.md § Observations for the operator; filed by 174-10)
files:
  - apps/supabase/supabase/functions/send-email/jwtSegment.ts
  - apps/supabase/supabase/functions/send-email/jwtSegment.test.ts
  - scripts/assert-edge-env-defaults.mjs
  - .claude/skills/database/SKILL.md
---

## Problem

`decodeJwtSegment()` has no caller in the functions tree: `git grep -n -F "jwtSegment" -- apps/supabase scripts` lists one line, the import in `jwtSegment.test.ts`. No `index.ts` decodes a token itself; `send-email` verifies its caller through `auth.getUser()` and `user_can`.

The module had a second copy in `invite-candidate/`, which was deleted with that function. Its deletion was outside what that plan was allowed to remove ("comments and the one test"), so the remaining copy was left in place, and the database skill says that no `index.ts` imports it.

Dead code in a deployment unit is deployed with the function, and its test keeps a base64url decoder green that nothing relies on. One smaller leftover in the same area: the "NO OPT-OUT" paragraph of `scripts/assert-edge-env-defaults.mjs` names a constant `NOT_DUPLICATED` that the file does not declare (`git grep -n -F "NOT_DUPLICATED" -- scripts` lists that one line).

## Solution

- Delete `jwtSegment.ts` and `jwtSegment.test.ts`, and the paragraph of `.claude/skills/database/SKILL.md` (Service Patterns § 8) that describes the decoder, unless a function is about to decode a token itself, in which case leave both and note the caller here.
- Reword the `NOT_DUPLICATED` sentence of the gate's docblock to what the file declares (`DUPLICATED_MODULES` holds `envConfig.ts` alone).
- After the deletion, `yarn workspace @openvaa/supabase test:unit` loses that file's tests and `yarn assert:edge-env-defaults` still exits 0 (check 3 concerns modules that have a test beside them).

## Resolution (Phase 180, 2026-11-13)

Done, measured on `feat/entity-signup-multi-grant`:

- `send-email/jwtSegment.ts` (`decodeJwtSegment`) and `send-email/jwtSegment.test.ts` are deleted, not moved:
  plan 180-02's commit 3, `be96905d7` ("refactor(180-02): delete the unused JWT segment decoder"), which also
  rewrote the database skill's Service Patterns § 8 so it no longer describes the decoder. No function was about to
  decode a token itself. `git grep -n -e jwtSegment -e decodeJwtSegment -- apps scripts packages` now finds nothing.
- The guard's undeclared-constant sentence is gone: the copy-drift check (Check 2 and `DUPLICATED_MODULES`) left
  `scripts/assert-edge-env-defaults.mjs` in plan 180-02's commit 4, `3fcd9ff36`, when `envConfig.ts` moved to
  `functions/_shared/` and had one copy; the "NO OPT-OUT" paragraph stays, without its sentence naming
  `NOT_DUPLICATED` (the commit's diff removes the line "(`NOT_DUPLICATED` and the `*.test.ts` rule in check 2)"). `git grep -n -e NOT_DUPLICATED
  -e DUPLICATED_MODULES -- scripts` finds nothing. `yarn assert:edge-env-defaults` prints
  `checks live: 2 of 2 (env-default; vitest-reachability)` and exits 0.
- The measured vitest delta of `yarn workspace @openvaa/supabase test:unit` at the deletion: 27 files / 1176 tests
  before, 26 / 1170 after commit 3 (the decoder's test file, -1 file, -6 tests).
