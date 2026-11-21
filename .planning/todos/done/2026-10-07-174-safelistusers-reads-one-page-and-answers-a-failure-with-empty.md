---
created: 2026-10-07T12:53:29.000Z
title: safeListUsers in the E2E admin client reads only the first page of users and answers a failed listing with "empty"
area: tests / E2E harness
severity: major
source: Phase 174 (174-03 measurement S14; 174-06-SUMMARY.md deviation 1 and § Observations for the operator; 174-09-SUMMARY.md; filed by 174-10)
files:
  - tests/tests/utils/supabaseAdminClient.ts
---

## Problem

`safeListUsers()` calls `auth.admin.listUsers()` with no page argument, so it reads the first page at the client's default page size, and on an error it warns and returns `[]`. Every helper built on it looks users up in that one list. It has eight call sites: the private `userIdForEmail` (behind the grant helpers), `revokeEntityGrant`, `setPassword`, `acceptTermsOfUse`, `getAuthUserByEmail`, `deleteBankAuthCandidateBySub`, `unregisterCandidate` and `deleteAllTestUsers`.

Two silent failure modes follow:

- **A user beyond the first page is not found.** A cleanup that "removes the user" then removes nobody and reports success, and a setup helper that needs the user fails later with a message about something else. The suite adds users while it runs; how many the stack holds at the suite's peak was not measured.
- **A failed listing reads as "no such user".** A negative assertion built on it ("no account was created") passes while the admin API is unreachable.

174-06 added a strict pager, `listAllUsers(caller)`, which reads every page and throws when a page fails, and built the invitation specs' negatives on it (`hasAuthUser`, `grantRowsForUser`, `countUsersByEmailPrefix`, `removeUsersByEmailPrefix`). The lenient helper was left for its existing callers. The second assertion of each test in `public-signup-closed.spec.ts` still rests on `getAuthUserByEmail`, so it is weaker than the `422` it follows.

## Solution

- Re-point the eight callers at `listAllUsers`, or at a by-address lookup that does not list at all, and delete `safeListUsers`.
- Decide per caller what a failed listing means: a cleanup may tolerate it with a warning, a lookup that feeds an assertion may not.
- The docblock cites a "GoTrue NULL column bug" as the reason for swallowing the error; check whether it still occurs on the pinned CLI before keeping any tolerance for it.

## Resolution

Closed 2026-10-08 by quick task `261008-g2-g4-g6-e2e-harness-fixes` (operator decision G6 (a)), commit `e4bea9dad`.

**What changed.** `safeListUsers` is deleted. Its callers, derived by grep and not taken from the count above, were the eight this todo names; all of them now go through `listAllUsers`, by way of one private by-address lookup, `findAuthUser(email, caller)`, which `hasAuthUser` and `grantRowsForUser` share. `listAllUsers` carries `app_metadata`, which `getAuthUserByEmail` returns. There is one call of `auth.admin.listUsers` left in `tests/` and it is the paged one.

**Decided per caller: none keeps a tolerance for a failed listing.**

| Caller | What a failed listing did | What it does now, and why |
| --- | --- | --- |
| `userIdForEmail` (behind `grantEntity`, `entityGrantCountForUser`), `setPassword`, `acceptTermsOfUse` | threw "no user found", naming the wrong cause | throws, naming the listing |
| `getAuthUserByEmail` | returned `undefined`, so "no account was created" passed | throws: it feeds assertions |
| `revokeEntityGrant` | returned as if the user had no grant | throws: `entity-selection.setup.ts` asserts a count of 0 right after it, and a grant left in place would be a later test's failure |
| `deleteBankAuthCandidateBySub`, `unregisterCandidate` | returned, having removed nobody (`unregisterCandidate` still deleted the address's invitations) | throw before anything is deleted. A teardown that cannot list the users fails by name; the leftover user it would have skipped is the next run's "already registered" |
| `deleteAllTestUsers` | deleted nobody and returned | throws before anything is deleted |

**The address comparison changed too.** The eight compared `u.email === email`; the shared lookup compares trimmed and lower-cased, as the strict readers already did. A grep over `tests/tests` found no literal address with an upper-case letter, and the closing run is green, so no call is known to resolve differently today.

**The "GoTrue NULL column bug".** No tolerance for it is kept. The listing did not fail once in the closing run (0 lines of either the old warning or the new error in its output), and no SQL under `apps/supabase/supabase/` outside the pgTAP helpers inserts into `auth.users`, which is the condition that bug is known for. Whether the pinned CLI would still fail on such a row was not tested.

**Verified.** `yarn lint:check`, `yarn format:check`, `yarn test:unit` at status 0 with the turbo cache bypassed, and the full default E2E run `tests/e2e-runs/261008-quick-g2-g4-g6`: 220 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 107 projects, every project at its total in the last full run before it (`174-e2e/174.1-02-close`).

**Not verified.** No test makes a listing fail or pushes a user past the first page, so the two failure modes are closed by reading the code, not by a red control. How many users the stack holds at the suite's peak is still unmeasured; at rest, before the run, it held 2. The bank-auth specs, the only callers of `deleteBankAuthCandidateBySub`, are opt-in and were not run.

**Found on the way.** The client's `setPassword` and `deleteAllTestUsers` have no caller anywhere in `tests/`; they were re-pointed and left in place.
