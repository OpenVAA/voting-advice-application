---
phase: 157-adapter-boundary-typing
plan: 09
subsystem: frontend data-adapter boundary / candidate auth UI
tags: [audit, spike, auth, supabase, withauth, disposition]
status: complete
requires: []
provides:
  - "157-AUTH-SHIM-DISPOSITION.md — the five-class per-file disposition table for `currentPassword` and `authToken`"
  - "The three-item Supabase `current_password` spike verdicts, measured against the live local stack"
  - "The candidate-settings branch dossier (decision cell PENDING OPERATOR)"
affects:
  - "157-10 — reads the branch verdict first; the two branches touch disjoint file sets"
  - "157-11 — no task may say 'remove authToken' without a row in the disposition table"
tech-stack:
  added: []
  patterns:
    - "Close a codemod criterion with TWO greps when one identifier is not a substring of the other"
    - "Binary-string inspection of a pinned CLI to prove a config key does not exist, rather than grepping only the project's own config file"
    - "Throwaway-user probe with in-script teardown + post-hoc DB assertion, to measure live auth-server behaviour without touching seeded accounts"
key-files:
  created:
    - .planning/phases/157-adapter-boundary-typing/157-AUTH-SHIM-DISPOSITION.md
  modified: []
decisions:
  - "The `authToken` reach is 106 lines across 21 files in five classes — not the CONTEXT's ~14 sites across 10 files."
  - "There are TWO genuine admin-token files, not one: `condenseArguments.ts` AND `generateQuestionInfo.ts` are structurally identical and both MUST NOT be swept."
  - "`FetchOptions.authToken` in `universalAdapter.ts` builds a real `Authorization: Bearer` header and gates the disk cache; class 5, MUST NOT be swept."
  - "Criterion 4's close condition is two greps: `grep -rin 'withauth'` → 0 AND `grep -rn 'WithOptionalAuth'` → 0. The hit sets are disjoint."
  - "Spike item 1 PASS, items 2 and 3 FAIL. The plan's own rule therefore selects branch (a), delete the field. Recorded as PENDING OPERATOR, not taken."
  - "Branch-independent: `error.changePassword` must stop claiming the current password was checked, in all seven locale catalogs."
metrics:
  duration: ~35 min
  completed: 2026-08-30
actuals:
  tokens: 21000
  tasks: 2
  commits: 1
---

# Phase 157 Plan 09: `currentPassword` / `authToken` disposition + `current_password` spike Summary

Discharged D-F1's binding operator NOTES with a five-class, 21-file disposition table and measured the
Supabase `current_password` gate against the live local stack — item 1 passed, items 2 and 3 failed, so the
plan's own rule selects branch (a), recorded but not taken.

## What was built

One phase-directory document, `.planning/phases/157-adapter-boundary-typing/157-AUTH-SHIM-DISPOSITION.md`
(561 lines), carrying:

1. **The four greps with numeric results**, and a written argument for why greps 3 and 4 are both required.
2. **A per-file `authToken` disposition table**, five classes plus a documentation class and the bridge case.
3. **A per-file `currentPassword` disposition table** (23 lines / 9 files, including two in `tests/`).
4. **The `WithAuth` / `WithOptionalAuth` disposition summary**.
5. **The three-item spike**, each with its command, real output and verdict.
6. **The branch dossier**, with the decision cell explicitly left pending the operator.

No source file was modified. This is an audit and a spike.

## The reach, measured

| Grep | Result |
|------|--------|
| `grep -rn 'currentPassword' apps packages tests` | 23 lines / 9 files |
| `grep -rn 'authToken' apps packages tests` | 106 lines / 21 files |
| `grep -rin 'withauth' apps packages tests` | 41 lines / 6 files |
| `grep -rn 'WithOptionalAuth' apps packages tests` | 18 lines / 2 files |

`authToken` by class: **29** shim uses (class 1, 11 files) · **9** type/JSDoc (class 2) · **32** tests
(class 3) · **14** genuine admin tokens (class 4, MUST NOT SWEEP) · **7** genuine `Bearer` mechanism
(class 5, MUST NOT SWEEP) · **1** stale doc · **14** bridge (`universalDataWriter`). Sums to 106.

**Three findings that correct the CONTEXT:**

- **Five `routes/` files are absent from the CONTEXT entirely** — 12 additional call sites. A sweep scoped
  to the CONTEXT's list leaves them behind and breaks the build.
- **There are TWO genuine admin-token files, not one.** `generateQuestionInfo.ts` is structurally identical
  to the named `condenseArguments.ts` — same JSDoc, same destructure, same `authToken: string;` member,
  same four downstream threads, 7 lines each.
- **`FetchOptions.authToken` is a different type doing real work** — it becomes an `Authorization: Bearer`
  header and its presence disables the disk cache, asserted by a passing test.

## The spike, measured against the live local stack

| Item | Verdict | Evidence |
|------|---------|----------|
| 1 — `updateUser({ password, current_password })` typechecks at 2.99.3 | **PASS** | `tsc --noEmit --strict` exit **0**; negative control with a bogus field exits **2** with TS2353 |
| 2 — a `config.toml` key maps to the current-password gate at the pinned CLI | **FAIL** | `grep 'require_current_password'` → no match. CLI v2.83.0 binary emits exactly one `GOTRUE_SECURITY_UPDATE_PASSWORD_*` var: `…_REQUIRE_REAUTHENTICATION`, bound to `secure_password_change`. `strings \| grep -i current_password` → **no output at all** |
| 3 — with the gate off, does GoTrue reject / ignore / error? | **FAIL — it IGNORES it** | `PUT /auth/v1/user` with a deliberately wrong `current_password` → **HTTP 200**, password changed; new password signs in (200), original rejected (400 `invalid_credentials`). Reproduced through `supabase-js`: `error: null` |

Item 3 was measured, not inferred from item 1 — a type existing is not a server enforcing, and here the
server demonstrably does not enforce.

**Two supporting facts, both measured, neither in the CONTEXT:** `canSubmit` at
`settings/+page.svelte:42` never references `currentPassword`, so the form submits with the field blank;
and `error.changePassword` claims the check happened in **all seven** locale catalogs.

## Branch decision

**PENDING OPERATOR.** The plan's Task 3 is `checkpoint:decision` with `gate="blocking-human"`; the executor
recorded the evidence and the rule's output rather than taking the decision.

**The plan's rule — "if ANY of the three failed, take branch (a)" — selects (a), delete the field.** Two
items failed, and option (b) is not merely more expensive here but **not implementable in this
repository**: it needs a gate with no `config.toml` key (item 2), and without that gate the server ignores
the value (item 3). Passing `current_password` through would change nothing at runtime while leaving the
seven-locale claim standing.

**Branch-independent obligation, recorded:** `error.changePassword` must stop telling users their current
password was checked, in all seven catalogs, under either branch.

## Deviations from Plan

None — plan executed as written. Two line citations were corrected against the working tree before
committing (`candidate-a11y.spec.ts` comment at `:225` not `:229`; `WithAuth` definition at `:341` not
`:343`), which is measurement hygiene rather than a deviation.

## Verification results

| Check | Result |
|-------|--------|
| `test -f …/157-AUTH-SHIM-DISPOSITION.md` | exists |
| `git status --porcelain apps packages tests \| wc -l` | **0** |
| `grep -c 'Spike item'` | **6** |
| `grep -c 'BRANCH DECISION'` | **2** |
| `git status --porcelain` (whole tree) | only `.planning/` entries; all three scratch files deleted |
| Post-commit deletion check | no files deleted by the commit |

**Environment left clean.** No leaked auth user: `select count(*) from auth.users where email like
'spike157-09%'` → **0**; `auth.users` total **2**, both `seed.sql` fixtures created before the probe ran.
Database intact: candidates 328 (327 dev-seed + `seed.sql`'s "Test Candidate"), organizations 8, questions
26, app_settings 1. **pgTAP was NOT run**, so the database is not contaminated and needs no reseed.
`yarn db:types` and `yarn db:lint:sql` were not run. No source file changed, so `yarn lint:check` is
unaffected and remains exit 0.

## Known Stubs

The branch-decision cell in `157-AUTH-SHIM-DISPOSITION.md` § 6 is intentionally unfilled
(`☐ (a) … ☐ (b) … — awaiting operator`). This is the plan's `gate="blocking-human"` checkpoint, not an
incomplete implementation: `157-10` must not start until the operator fills that row. Resolved by the
orchestrator putting the decision dossier to the operator.

## Self-Check: PASSED

- `.planning/phases/157-adapter-boundary-typing/157-AUTH-SHIM-DISPOSITION.md` — FOUND
- commit `c42a5ef4a` — FOUND
