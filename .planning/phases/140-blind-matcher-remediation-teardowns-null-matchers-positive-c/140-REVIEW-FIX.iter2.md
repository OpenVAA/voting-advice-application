---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
fixed_at: 2026-08-15T20:20:00Z
review_path: .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-REVIEW.md
iteration: 1
findings_in_scope: 14
fixed: 14
skipped: 0
status: all_fixed
---

# Phase 140: Code Review Fix Report

**Fixed at:** 2026-08-15T20:20:00Z
**Source review:** `.planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 14 (`fix_scope: all` — 2 Critical, 8 Warning, 4 Info)
- Fixed: 14
- Skipped: 0
- One finding (WR-08) has a secondary sub-item that was NOT fixed — see **Deferred / Partial-Fix Follow-ups** below.

**Static verification performed (no live Supabase / dev server available in this session):**
- `cd tests && npx tsc -p tsconfig.json --noEmit` — clean, after every commit.
- `npx eslint <touched files>` (root config; also `packages/dev-seed`'s and `apps/frontend`'s own `eslint --flag v10_config_lookup_from_file` scripts against the touched files) — clean (one pre-existing, unmodified `func-style` violation in `setupFromTemplate.ts:284` predates this phase entirely — confirmed byte-identical at `036d21201`, left untouched).
- `npx playwright test --list -c tests/playwright.config.ts` (default suite): **143 tests in 94 files** — matches REVIEW.md's own recorded baseline, confirming the new prefix-uniqueness guard, the retries:0 additions, and the comment-stripped soft-assertion-budget guard do not change test discovery.
- `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --list --project=bank-auth-journey`: still **3 tests in 3 files**, no added dependencies — confirms A4 ("stands alone") is intact after CR-01.
- `cd packages/dev-seed && yarn test:unit`: **444/444 passed** — matches REVIEW.md's baseline.
- `cd apps/frontend && yarn vitest run src/lib/api/utils/auth`: **59/59 passed** (includes the two WR-08-touched spec files: 22/22).
- **E2E full-suite gate is OWED, not run.** Per the fixer's operating constraints, the live 6-worker/local-Supabase full suite (and the `PLAYWRIGHT_BANK_AUTH=1` 3× determinism gate for `bank-auth-journey`) was **not** executed in this session — it requires a running dev server on `:5173` plus a clean local Supabase, neither of which is guaranteed here. **This E2E gate must run before Phase 140 is considered closed**, especially to empirically confirm CR-01's fix (the dedicated `e2e-bankauth-notloc-` namespace) actually removes the race under real concurrent scheduling, and that the WR-01/WR-02 changes don't destabilize anything.

## Fixed Issues

### CR-01: `e2e-perm-notloc-` owned by two unordered teardown projects (race)

**Files modified:** `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts` (new), `packages/dev-seed/src/templates/index.ts`, `tests/playwright.config.ts`, `tests/tests/setup/candidate/bank-auth-journey.setup.ts`, `tests/tests/setup/candidate/bank-auth-journey.teardown.ts`
**Commit:** `abe1fabb0`
**Applied fix:** Neither of the review's two suggested options was applied as literally written, because both had a hidden defect once the actual pipeline mechanics were traced:
- **Option A (re-namespace via a runtime `externalIdPrefix` override)** is unsafe as specified: `ctx.ts` resolves `externalIdPrefix` once from the TEMPLATE object, but the template's own nested FK references (e.g. `constituency_groups: [{ external_id: \`${P}cg-1\` }]`) are pre-baked literal strings, NOT re-derived from the override. Passing a different prefix into `setupFromTemplate` while reusing the template verbatim would prefix top-level rows with the new value while every nested FK reference still pointed at the OLD `e2e-perm-notloc-*` strings — an orphaned-reference seed corruption, not a namespace fix.
- **Option B (add `dependencies: ['perm-not-located-2e2cg']`)** would break a load-bearing, documented operational procedure: `tests/IDURA-TEST-RUNBOOK.md` Step B-3 runs `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey` in isolation (no perm chain) as the 3× determinism gate. Adding that dependency edge would force the ENTIRE upstream perm chain (8 chains + both journeys) to run first even for that isolated invocation.

Applied instead: a **dedicated dev-seed template** (`perm-bankauth-notloc`, own `e2e-bankauth-notloc-` prefix) — the exact pattern already used by every other "distinct externalIdPrefix … for parallel safety" entry in `templates/index.ts` (e.g. `perm-access-disable`, `perm-question-video`). This makes the collision impossible by construction — no dependency edge needed, A4 ("stands alone") stays fully intact, and the runbook's isolated gate is unaffected (verified: `--project=bank-auth-journey` still lists exactly 3 tests, 3 files, no new deps pulled in). Dropped the `extraTeardownPrefix: ['test-', 'e2e-perm-']` pre-clear from the setup, per the review's own note that it wiped namespaces the project doesn't own. Also added a **prefix-uniqueness config guard** (mirrors the existing ORPHAN-PROBE / SOFT-ASSERTION-BUDGET guards) that scans every `*.teardown.ts` file's `const PREFIX = '...'` and throws at config-load time on any future duplicate or substring overlap.

### CR-02: `assertTeardown.ts` docblock claims two structurally-impossible catches

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`
**Commit:** `20f86566e`
**Applied fix:** Moved "a table dropped from `ALLOWED_TEARDOWN_TABLES`" out of WHAT IT CATCHES into WHAT IT DOES NOT CATCH, with the mechanism spelled out (the probe iterates the same shared constant, by design — both sides go blind together). Deliberately did NOT implement the review's "close the hole" alternative (an independent `PROBE_TABLES` list): `packages/dev-seed/src/cli/teardown.ts:65-67` already documents, from this SAME phase, that a second hand-maintained copy under `tests/` was explicitly rejected as "exactly the duplicated-fact drift this phase exists to close" — introducing one now would directly contradict that recorded decision. Corrected the `:7-8` claim from "every `*.teardown.ts` project routes through this function" to the accurate 27-of-28 count.

### WR-01: Positive controls use non-retrying `.count()`

**Files modified:** `tests/tests/specs/perm/perm-hide-category-tags.spec.ts`, `tests/tests/specs/perm/perm-hide-election-tags.spec.ts`
**Commit:** `476c0be3a`
**Applied fix:** Applied verbatim per the review's Fix snippet — replaced `const count = await locator.count(); expect(count, msg).toBeGreaterThan(0)` with `await expect(locator, msg).not.toHaveCount(0)` in both files. Regains auto-retry; the diagnostic message is preserved (locator assertions accept a message argument too).

### WR-02: Teardown accounting is not retry-stable (CI vs local)

**Files modified:** `tests/playwright.config.ts`
**Commit:** `7bf204d0f`
**Applied fix:** Added `retries: 0` to all 28 `data-teardown-*` projects, each with a reason comment. For `data-teardown-candidate-journey` (which performs no delete — CR-02) the comment was written to reflect that accurately rather than reuse the generic "F3 accounting" reason verbatim, so the docblock doesn't itself become a new instance of the class of overclaim CR-02/WR-03 flagged.

### WR-03: Matcher's catches are conditional on `rowsBefore > 0` (~1/26 sites)

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`
**Commit:** `090ef98b5`
**Applied fix:** Split WHAT IT CATCHES into an unconditional class (over-deletion — holds regardless of `rowsBefore`) and a conditional class (no-opping `bulk_delete`, scoping bugs — require `rowsBefore > 0`, which the measurement found rare), matching the review's suggested restructuring.

### WR-04 + IN-01: Soft-assertion budget counts inside comments; guard/header wording conflict

**Files modified:** `tests/playwright.config.ts`
**Commit:** `64541fff7`
**Applied fix:** Bundled these two because they're the same code region and the fixes compose cleanly. Stripped block/line comments before counting `expect.soft(` occurrences (regex from the review's Fix snippet), so the guard's own remediation instruction can no longer trip itself. Reworded the divergence message to "record the reason in that spec's header (prose only — do not restate the number; the header deliberately does not)", reconciling it with `voter-journey.spec.ts`'s existing header convention (IN-01). Verified: the guard still passes with the file's true count of 136 after stripping comments — no occurrences currently live inside a comment, so no budget-number change was needed.

### WR-05: `setupFromTemplate.ts`'s 3 pre-clear/cleanup deletes are unasserted

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`, `tests/tests/setup/shared/setupFromTemplate.ts`
**Commit:** `b3796a07c`
**Applied fix:** Chose the review's "narrow the claim" option over "route the pre-clear through the helper too" — routing untested cross-namespace pre-clears through a NEW hard assertion carries real regression risk (exactly the kind of subtle interaction CR-01 already surfaced) for a phase whose own cardinal rule forbids introducing flakiness. Corrected the RATIONALE paragraph's "covered by construction" claim to scope explicitly to a `*.teardown.ts` project's OWN delete, and added a one-line pointer comment at each of the three unasserted call sites (`:189`, `:196`, `:279` in `setupFromTemplate.ts`) referencing `.planning/WINDOWS.md` and this docblock.

### WR-06: `countRowsByPrefix` forwards the prefix into LIKE unescaped

**Files modified:** `tests/tests/utils/supabaseAdminClient.ts`
**Commits:** `4a727e800`, `167b6e8b3` (lint follow-up)
**Applied fix:** Added the guard from the review's Fix snippet — throws before querying if `prefix` contains `%`, `_`, or `*`. None of the current 27 prefixes are affected (all plain hyphenated strings). A follow-up commit satisfied the workspace's `quotes` eslint rule on the new error message (auto-fixed via `eslint --fix`, verified the diff was a mechanical quote-style change only).

### WR-07: Probe runs before `runTeardown`'s mass-delete guard

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`
**Commit:** `883bf7655`
**Applied fix:** Mirrored `runTeardown`'s `T-58-07-02` length guard at the top of `runTeardownAsserted`, per the review's Fix snippet, so a sub-2-character prefix is refused before either `countRowsByPrefix` call runs.

### WR-08: Sibling null-blind `toBeDefined()`+`typeof` pairs remain

**Files modified:** `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts`, `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts`
**Commit:** `f78591513`
**Applied fix:** Collapsed each `toBeDefined()` + `typeof` (+ `.length`) pair into one non-blind `expect(value, msg).toEqual(expect.any(String))` / `expect.stringMatching(/.+/)` assertion, exactly per the review's Fix snippet. Verified both spec files still pass in full (`yarn vitest run` — 22/22). **See Deferred section below** for the sub-item this finding also named (the `try {} catch {}` swallow pattern in `token-endpoint.test.ts`) that was NOT addressed.

### IN-02: `assertTeardown.ts` duplicates measurement narrative that will drift

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`
**Commit:** `4237080a0`
**Applied fix:** Removed the restated raw figures (26 observations, 25/26, the `setupFromTemplate.ts:184-196` line citation) from the MATCHER section, replacing them with a pointer to `140-MEASUREMENT.md` § 4 / § Adjudication as the single source of truth, while keeping the conclusion and the decision-rule branch in-tree per the review's Fix guidance. Kept WR-03's qualitative "rare vs common" framing in WHAT IT CATCHES without repeating the now-removed line citation, so the two sections no longer duplicate each other's mechanism explanation.

### IN-03: `runTeardownAsserted` discards `storageRemoved`

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`
**Commit:** `af5830150`
**Applied fix:** Named the gap explicitly in three places: the ROLE line (clarifying "every ROW" vs. the discarded `storageRemoved`), a new WHAT IT DOES NOT CATCH bullet, and an inline comment at the destructuring call site. Did not attempt to build the storage-count probe the review's alternative fix would require (no such probe exists yet, and one would need its own design/verification pass) — this matches the review's own "or name the gap" fallback.

### IN-04: `tests/e2e-runs/` holds 1.7 GB of untracked evidence

**Files modified:** none (verification only)
**Applied fix:** Confirmed `tests/e2e-runs/` IS already correctly covered by `.gitignore:44` (`git check-ignore -v` confirmed for `140-f3-measure`). Did NOT prune any run directories: all 15 present run dirs (`140-f3-ctl-run1a..2c`, `140-f3-measure`, `140-f3-smoke`, `140-f9-after`, `140-f9-after-b`, `140-f9-before`, `140-f9-green`, `140-f9-precondition`, `140-f9-restored`, `140-gate`) are actively cited by name as evidence in `140-03-PLAN.md`, `140-03-SUMMARY.md`, `140-04-PLAN.md`, `140-04-SUMMARY.md`, `140-05-PLAN.md`, `140-05-SUMMARY.md`, `140-06-PLAN.md`, `140-06-SUMMARY.md`, `140-MEASUREMENT.md`, and `140-NEGATIVE-CONTROL.md` — none qualify as "older than the ones cited." Per this fixer's explicit operating constraint, deleting a user's local evidence artifacts is out of scope regardless. No code or config change was needed since the `.gitignore` coverage was already correct.

## Deferred / Partial-Fix Follow-ups

### WR-08 (secondary sub-item): `try { await POST(event) } catch {}` swallow in `token-endpoint.test.ts`

**File:** `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:139-142` (and 4 sibling blocks in the same file)
**Reason not fixed:** The REVIEW.md finding names this pattern as "the same 'cannot-fail-for-the-stated-reason' family" as the primary matcher issue but supplies **no concrete Fix snippet** for it (the Fix section's only code example addresses the `toBeDefined()`/`typeof` collapse). The pattern is intentional and documented (`// Expected` comment): the mocked `fetch` is made to throw AFTER `capturedFetchBody` is populated, so the test can assert on the captured request body without the surrounding `POST()` call's post-fetch logic executing. Changing this needs its own investigation of what the "correct" assertion on the thrown error should be (assert on error type/message instead of swallowing it blindly?) — that requires understanding the mocked-fetch harness in more depth than a blind edit should risk, especially given this repo's cardinal E2E/test-integrity rule. Verified today's guard (`expect(capturedFetchBody).not.toBeNull()`) makes the pattern safe as shipped; all 10 tests in the file still pass. Recommend a human (or a follow-up phase) design the intended assertion before touching this.

## Notes for the Verifier / Human Reviewer

1. **E2E full-suite gate is owed** (see Static verification above) — run `yarn db:reset && yarn dev` (fresh dev server + clean DB) then `yarn test:e2e`, and separately the `PLAYWRIGHT_BANK_AUTH=1 --project=bank-auth-journey` 3× determinism gate per `tests/IDURA-TEST-RUNBOOK.md` Step B-3, before considering Phase 140 closed.
2. **CR-01's fix changes dataset ownership**, not just a prefix string — `bank-auth-journey.setup.ts` now seeds a NEW template (`perm-bankauth-notloc`) rather than reusing `perm-not-located-2e2cg`. The two templates are byte-for-byte structurally identical (same topology, same organizations/questions/nominations shape) except for the prefix constant, so the journey spec's assertions should be unaffected — but this is exactly the kind of change the owed E2E run should confirm empirically.
3. No finding's fix weakened, skipped, or made retry-dependent any assertion — WR-01 and WR-02 specifically *added* rigor (regained auto-retry; removed retry-masking) rather than removing it, per the project's cardinal E2E rule.

---

_Fixed: 2026-08-15T20:20:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
