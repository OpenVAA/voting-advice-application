---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
fixed_at: 2026-08-15T18:18:25Z
review_path: .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-REVIEW.md
iteration: 3
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 140: Code Review Fix Report (iteration 3 — RESTRICTED, final pass)

**Fixed at:** 2026-08-15T18:18:25Z
**Source review:** `140-REVIEW.md`
**Iteration:** 3

## THIS WAS A RESTRICTED PASS — NOT ALL 10 FINDINGS FROM 140-REVIEW.md

`140-REVIEW.md` iteration 3 reported 10 findings (1 critical, 4 warning, 5 info). Per an explicit,
deliberate user restriction, **only 3 of those 10 — the doc-truth findings WR-01, WR-02, and
IN-04 — were in scope for this pass.** This is the final `--auto` iteration; nothing written here
will be reviewed by anyone afterward, so the restriction was chosen specifically to avoid a third
compounding regression (the previous two fix passes, 26 commits total, each introduced a
regression caught only by the following review — there is no following review this time).

**CR-01, WR-03, and WR-04 were explicitly OUT OF SCOPE and were NOT touched.** IN-01, IN-02,
IN-03, and IN-05 were also not in scope and were not touched. Do not read this report as "Phase
140 code review is closed" — 7 of 10 findings remain genuinely open. See the Deferred section
below and `140-REVIEW.md`'s own Residual Risk section for what is still owed.

**Summary:**
- Findings in scope: 3 (WR-01, WR-02, IN-04)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: Stale line citation re-planted into `assertTeardown.ts`'s docblock

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`
**Commit:** `180b75efe`
**Applied fix:** Replaced the two remaining line-number citations into
`packages/dev-seed/src/cli/teardown.ts` (`:65-67` and `:126-132`, both stale after the IN-02
commit shifted line numbers) with symbol citations: `ALLOWED_TEARDOWN_TABLES`'s own docblock, and
`runTeardown` by name. This finishes what the original WR-01 fix (commit `9d1366c3a`) started and
does not simply renumber — renumbering would recreate the same trap on the file's next edit, which
is exactly how this citation went stale a second time in three iterations.

### WR-02: False "STANDS ALONE" summary comment on the bank-auth-journey block

**Files modified:** `tests/playwright.config.ts`, `tests/IDURA-TEST-RUNBOOK.md`, `tests/README.md`
**Commit:** `1eacbc453`
**Applied fix:**
- `tests/playwright.config.ts`: removed the false "OPT-IN (PLAYWRIGHT_BANK_AUTH) and STANDS ALONE
  — it pulls ONLY its own data-setup, NOT the perm serial chain" summary (disproved by `--list`:
  the block pulls 5 projects including `data-setup-base`) and replaced it with an accurate summary
  that states the `data-setup-base` dependency and its consequence (the base dataset is present
  while the journey walks).
- Adapted the fix beyond the REVIEW.md suggestion: the review's proposed replacement text says
  "See the spec's election-identity assertions: positional `.first()` selection is not safe under
  that" — but no such identity assertions exist in the current code (CR-01, which would add them,
  is explicitly deferred and NOT implemented in this pass). Writing that sentence verbatim would
  have introduced a NEW false claim, which is exactly the defect class this finding is about.
  Instead the new comment states the gap as a **known, unfixed limitation** ("KNOWN GAP … Not yet
  fixed here"), which is accurate against the actual code state.
- `tests/IDURA-TEST-RUNBOOK.md` Step B-3: added a note that the gate now seeds the base dataset
  first (via the `data-setup-base` edge) and that a green run does not rule out CR-01.
- `tests/README.md`: added the missing `bank-auth-journey` row to the opt-in projects table
  (previously only `bank-auth` was listed), noting its dependency chain and the same deferred gap.

### IN-04: Two residual doc defects in files this phase rewrote

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`,
`tests/tests/specs/perm/perm-hide-category-tags.spec.ts`,
`tests/tests/specs/perm/perm-hide-election-tags.spec.ts`
**Commit:** `e3d37315e`
**Applied fix:**
- `assertTeardown.ts`: the NOT-covered paragraph said "see WR-03 above" for the `rowsBefore > 0`
  conditionality, but that section actually appears ~40 lines *below* the pointer. Corrected the
  pointer to "see WHAT IT CATCHES ONLY WHEN `rowsBefore > 0` below".
- `perm-hide-category-tags.spec.ts:44` and `perm-hide-election-tags.spec.ts:44`: both cited
  `voterNavigation.ts:50-76` by line number, contrary to the cite-by-symbol rule WR-01 established
  in this same phase. Changed both to cite `advanceClick`'s docblock in `voterNavigation.ts` by
  symbol (verified: the "RESIDUAL EXPOSURE" paragraph the citation refers to lives in
  `advanceClick`'s docblock).

## Skipped Issues

None — all 3 in-scope findings were fixed cleanly with no rollback needed.

## Deferred — CR-01 (decided, not yet implemented)

> **Decision:** `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` **IS** a supported invocation. The bank-auth
> journey must therefore work correctly alongside the base dataset.
> **Chosen fix shape:** identity-based election selection — `submitElection()` must stop using
> `.first()` under `.order('sort_order')` and instead select the election explicitly by identity
> (external_id / label), so it targets `el-1` regardless of what else is seeded. The
> `dependencies: ['data-setup-base']` edge STAYS.
> **Consequence:** WR-03 remains a real finding and does not collapse to a doc fix.
> **Not implemented in iteration 3** — deliberately excluded from the final unreviewed fix pass;
> owed as follow-up work.

This decision is recorded here (per explicit instruction) so it is not lost. `submitElection()` /
`submitConstituency()` in `tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts`
still select positionally as of this commit. `tests/playwright.config.ts`'s bank-auth-journey
block comment (fixed under WR-02 above) now honestly states this as a known, unfixed gap rather
than a false "stands alone" claim — but the underlying selection logic itself was NOT touched in
this pass, per the explicit out-of-scope instruction ("Do not modify … `submitElection()`").

## Also carried forward, unchanged — the owed E2E gates (IN-05)

No suite run has happened since `036d21201`, across (now) 29 commits and three reviews. The
following gates remain owed exactly as documented in `140-REVIEW.md`'s Residual Risk section:

```bash
# Gate 1 — the blocking default suite. Must be cardinal-clean (no failures, no
# "did not run"). One FRESH dev server on :5173; no stale server stealing the port.
yarn db:reset
yarn dev                      # separate terminal, leave running
yarn test:e2e

# Gate 2 — the bank-auth 3x determinism gate (IDURA-TEST-RUNBOOK.md Step B-3).
# Terminal 1, per Step B-1/B-2:
yarn db:reset
source /tmp/eflow10b.env      # IdP env + scoped TLS bypass, derived from testKeys.ts
yarn dev                      # plus: supabase functions serve --no-verify-jwt (identity-callback)
# Terminal 2, run this THREE times, with `yarn db:reset` between runs:
source /tmp/eflow10b.env
PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey -c tests/playwright.config.ts

# Gate 3 — CR-01-specific. Re-run gate 2 once with a trace and confirm from the
# trace which election-selector option step 2 actually checked:
PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey --trace on -c tests/playwright.config.ts
npx playwright show-trace test-results/*/trace.zip
```

**A green bank-auth gate (Gate 2) will NOT discharge CR-01.** CR-01's predicted failure mode is a
*pass* on the wrong dataset — the journey silently preregisters into the base election rather than
its own, and step 6 of the spec asserts only that an auth/candidate/role cascade exists, with
nothing election-scoped. Only Gate 3 (trace inspection of the actually-selected option) can confirm
or refute CR-01 empirically; static review cannot.

Also still owed, per iteration 2's own list, to confirm during gate 2: that `perm-bankauth-notloc`
seeds and tears down cleanly against a real Supabase, that the 28 `retries: 0` additions do not
surface a latent teardown transient, and that removing the `preRegistration` reset from the
bank-auth teardown leaves no stale `true` visible to a subsequent run before `data-setup-base`
REPLACEs.

## Not addressed in this pass (explicitly out of scope)

- **CR-01** (wrong-election selection) — decision recorded above; fix shape chosen but not
  implemented. Excluded by explicit user instruction.
- **WR-03** (phase-1 co-scheduling of `data-setup-bank-auth-journey` with `voter-journey` /
  `performance` / `a11y-smoke` / `data-setup-candidate-journey` under the full-suite-plus-bank-auth
  invocation) — remains open; not a doc-truth finding, requires a behavioral/config decision tied
  to CR-01's resolution.
- **WR-04** (four unconverted Signicat `try/catch{}` swallow blocks in `token-endpoint.test.ts`) —
  a judgement call the user is reserving. Not touched.
- **IN-01** (`allowedTeardownTables.test.ts` should assert the intersection of
  `allowed_collections` and `delete_order`, not just `allowed_collections`) — not in scope.
- **IN-02** (teardown-prefix guard enumeration is scoped to `tests/tests/setup/**`, not
  `TESTS_DIR`) — not in scope.
- **IN-03** (`.rejects.toThrow()` without a matcher doesn't verify *which* thing threw) — not in
  scope.
- **IN-05** (owed E2E gates) — carried forward above, unchanged.

## Static verification performed this pass

- `npx tsc -p tests/tsconfig.json --noEmit` — clean, no errors in any modified file.
- `npx tsc -p packages/dev-seed/tsconfig.json --noEmit` — clean.
- `npx playwright test --list -c tests/playwright.config.ts` → **143 tests in 94 files** —
  unchanged from the baseline stated in `140-REVIEW.md` (this pass is comment/doc-only in every
  `.ts` file touched, so any drift here would have meant a broken change; there was none).
- `npx eslint` on all touched `.ts`/`.spec.ts` files: 15 pre-existing quote-style errors in
  `tests/playwright.config.ts` (lines 42-224, `Strings must use singlequote`), all outside the
  edited range (lines 420-437) and confirmed present in the file before this pass's commits;
  `assertTeardown.ts` and the two `perm-hide-*.spec.ts` files: no errors.
- No E2E suite was run (none guaranteed available in this environment; consistent with the
  constraint against running the full suite in this pass). See IN-05 above.
- Verification ran in the main checkout (`workflow.use_worktrees: false` in
  `.planning/config.json`) — no isolated worktree was used for this pass, so these numbers are
  reproducible directly from this checkout's current `HEAD`.

## Commits made this pass

- `180b75efe` — `fix(140): WR-01 cite runTeardown/ALLOWED_TEARDOWN_TABLES by symbol, not stale line numbers, in assertTeardown.ts`
- `e3d37315e` — `fix(140): IN-04 correct misplaced WR-03 pointer and cite advanceClick by symbol, not line`
- `1eacbc453` — `fix(140): WR-02 correct false STANDS ALONE claim on bank-auth-journey block, document data-setup-base edge in IDURA-TEST-RUNBOOK.md and tests/README.md`

None of the prior 26 `fix(140):` commits from iterations 1-2 were amended, rebased, or touched.
Unrelated modified/untracked files in the working tree (`.vscode/settings.json`,
`supabase/.temp/cli-latest`, other `140-REVIEW*.md` / `140-REVIEW-FIX*.md` artifacts) were left
untouched; every commit above lists explicit file paths, no `git commit -a` / `git add -A` was
used, and this `140-REVIEW-FIX.md` file itself was written but is NOT committed — the orchestrator
handles that.

---

_Fixed: 2026-08-15T18:18:25Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 3_
