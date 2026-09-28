---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
fixed_at: 2026-08-15T21:55:00Z
review_path: .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-REVIEW.md
iteration: 2
findings_in_scope: 15
fixed: 14
skipped: 1
status: partial
---

# Phase 140: Code Review Fix Report (iteration 2)

**Fixed at:** 2026-08-15T21:55:00Z
**Source review:** `.planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-REVIEW.md`
**Iteration:** 2

**Summary:**
- Findings in scope: 15 (`fix_scope: all` — 1 Critical, 9 Warning, 5 Info)
- Fixed: 14 (13 commits — IN-03 was folded into the WR-09 commit since both touch the same
  line of the same file)
- Skipped/deferred: 1 (IN-05 — a process/infra action item, not a code fix; see **Deferred**)

**Status note:** marked `partial` rather than `all_fixed` only because IN-05 is a "run the E2E
gates" instruction, not something a static-only session can execute. Every finding that is a
code/doc change was fixed.

**Static verification performed this session (no live Supabase / dev server available):**
- `npx tsc -p tests/tsconfig.json --noEmit` — clean, after every commit touching `tests/`.
- `npx tsc -p packages/dev-seed/tsconfig.json --noEmit` — clean, after every commit touching
  `packages/dev-seed/`.
- `npx tsc -p apps/frontend/tsconfig.json --noEmit` — no new errors in the touched file
  (`token-endpoint.test.ts`).
- `npx eslint <touched files>` — clean, or (where the file already carried pre-existing
  violations — `tests/playwright.config.ts`'s `quotes` errors, `candidate-bank-auth-journey.spec.ts`'s
  `playwright/no-conditional-in-test` config error) confirmed byte-for-byte identical to the
  pre-edit baseline via `git stash` + re-run, i.e. not introduced by this session.
- `npx prettier --check` on every new/rewritten file (`teardown.ts`, `notLocated2e2cgShape.ts`,
  the two rewritten templates) — clean after one `--write` pass on `teardown.ts`.
- `npx playwright test --list -c tests/playwright.config.ts` (default suite) — **143 tests in 94
  files** after every commit that touched `tests/playwright.config.ts` or a setup/spec file —
  matches REVIEW.md's own recorded baseline; the new completeness check (WR-03), the
  `fs.existsSync` precondition (IN-01), and the alias under-count check (WR-05) do not misfire.
- `cd packages/dev-seed && yarn vitest run` — **445/445 passed** (444 baseline + 1 new test from
  WR-04), including the live-Supabase-touching `default-template.integration.test.ts`, which
  passed against whatever local Supabase instance this session's environment had running.
- `cd apps/frontend && npx vitest run src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` —
  **10/10 passed** (6 rewritten Idura tests + 4 unchanged Signicat tests), confirming
  `POST(event)` genuinely rejects under the mock-token fixture so the new
  `.rejects.toThrow()` assertions are not vacuous.
- A dedicated `tsx` script (scratchpad-only, not committed) imported both
  `permNotLocated2e2cgTemplate` and `permBankauthNotLocatedTemplate` post-refactor and confirmed
  they are structurally identical once each template's own `externalIdPrefix` is normalised out —
  proving the IN-04 factory extraction preserved the exact topology of both templates.
- **E2E full-suite gate is OWED, not run** (IN-05; see Deferred below).
- **The `PLAYWRIGHT_BANK_AUTH=1 --project=bank-auth-journey` 3× determinism gate is OWED, not
  run** (IN-05; see Deferred below). This is the gate that will empirically prove the CR-01 fix
  (the `data-setup-base` dependency edge + `base.setup`'s `'e2e-bankauth-'` sweep) actually closes
  the self-healing regression under real concurrent/serial scheduling.

## Fixed Issues

### CR-01: The new `e2e-bankauth-notloc-` namespace sat outside every existing sweep (regression from iteration 1's CR-01 fix)

**Files modified:** `tests/playwright.config.ts`, `tests/tests/setup/shared/base.setup.ts`,
`tests/tests/setup/candidate/bank-auth-journey.setup.ts`
**Commit:** `c592f3f96`
**Applied fix:** Applied the review's preferred remedy (Option 1), not the one-line alternative.
Gave `data-setup-bank-auth-journey` a `dependencies: ['data-setup-base']` edge (mirrors the
sibling `bank-auth` project's existing wiring) and added `'e2e-bankauth-'` to `base.setup.ts`'s
`extraTeardownPrefix` sweep. Rejected the alternative (`e2e-perm-bankauth-notloc-` rename) because
it would re-enter the `e2e-perm-` sweep and reintroduce a race with the perm chain's own
pre-clears under `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` — the exact class of race the original
CR-01 fix removed. Verified the `dependencies: ['data-setup-base']` edge preserves A4 (this
project still does NOT depend on the perm serial chain, only on `data-setup-base`, so the isolated
`--project=bank-auth-journey` 3× determinism gate is structurally unaffected — not empirically
re-verified this session, see IN-05).

### WR-01: Stale line citations planted by the WR-05 fix

**Files modified:** `tests/tests/setup/shared/assertTeardown.ts`
**Commit:** `9d1366c3a`
**Applied fix:** Replaced the four line-number citations (`:189`, `:196`, `:279` into
`setupFromTemplate.ts`; `:263` into `supabaseAdminClient.ts`) with symbol-based references
(`extraTeardownPrefix` pre-clear loop / template's step-1b pre-clear / `cleanup` closure;
`countRowsByPrefix`), which cannot go stale on an unrelated edit to the cited file.

### WR-02: LIKE-metacharacter guard rejected 3 characters on a rationale true for only 1

**Files modified:** `tests/tests/utils/supabaseAdminClient.ts`
**Commit:** `f529a0e81`
**Applied fix:** Narrowed `countRowsByPrefix`'s guard to reject only `*` (the character PostgREST's
`like` filter actually maps differently from `bulk_delete`'s raw SQL `LIKE`). `_` and `%` are no
longer rejected — both sides of the comparison treat them identically, so rejecting them only
turned an imprecise-but-correct delete into a probe that throws before the delete runs (since the
probe runs BEFORE the delete in `runTeardownAsserted`), which would make a prefix like dev-seed's
default `seed_` leak its entire dataset instead of being merely imprecise.

### WR-03: Prefix-uniqueness guard silently dropped unparseable declarations

**Files modified:** `tests/playwright.config.ts`
**Commit:** `091813da4`
**Applied fix:** Added a completeness check: any `*.teardown.ts` file that calls
`runTeardownAsserted(` but yields no parsed `const PREFIX` now throws a named error at
config-load time, instead of being silently excluded from the uniqueness/overlap scan. Widened the
parse regex to also accept `export const` / typed (`: string`) declarations while it was there.
Verified `npx playwright test --list` still reports 143/94 (the completeness check does not
misfire against the current 27 teardown files).

### WR-04: `ALLOWED_TEARDOWN_TABLES` coverage hole closed with prose only

**Files modified:** `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts` (new)
**Commit:** `2e83e9ca8`
**Applied fix:** Added a dev-seed unit test that parses `bulk_delete`'s
`allowed_collections text[] := ARRAY[...]` literal directly out of `00001_initial_schema.sql` and
asserts `ALLOWED_TEARDOWN_TABLES` equals that set minus `app_settings` — a checkable fact against
the schema, not a second hand-maintained table-name list under `tests/` (which the phase
explicitly rejected elsewhere as exactly the drift it exists to close). Test passes today; will
fail loudly if `bulk_delete`'s allowed-collections array is ever changed without updating the
exported constant.

### WR-05: Soft-assertion budget guard message inaccurate + alias under-count hole open

**Files modified:** `tests/playwright.config.ts`
**Commit:** `941c0da3a`
**Applied fix:** (1) Corrected the failure message — it claimed the count was taken "outside
comments/strings"; only comments are stripped, string literals are not. (2) Added a second check
that rejects a bare `expect.soft` reference not immediately called (an alias/destructure like
`const soft = expect.soft`), which the textual budget count cannot see and which silently
over-reports headroom — the direction that produced fake-guard finding F10 in the first place.
Did not address the third sub-issue (the line-comment-strip regex not handling a comment
immediately preceded by `:` with no space) — the review itself frames this as a residual, not a
required fix ("closed only for most positions, not all"); recorded here rather than silently
dropped.

### WR-06: `base.teardown.ts` claimed sole namespace ownership, disproved by `140-MEASUREMENT.md`

**Files modified:** `tests/tests/setup/shared/base.teardown.ts`
**Commit:** `0f5a96034`
**Applied fix:** Rewrote the docblock to state the actual mechanism: this teardown is the sole
*writer* of `test-e2e-base-`, not the sole *deleter* — all 19 perm setups' `extraTeardownPrefix:
['test-', 'e2e-perm-']` also delete into it (`'test-'` matches `test-e2e-base-%`). Safety comes
from Playwright's transitive `teardown:` deferral over the serial perm chain (confirmed by
`140-MEASUREMENT.md` § 5.2), not from namespace ownership.

### WR-07: Six `try { await POST(event) } catch {}` swallows still wrapped the subject of the test

**Files modified:** `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts`
**Commit:** `dacd6ba7d`
**Applied fix:** Replaced all six blocks in the Idura `private_key_jwt` describe block with
`await expect(POST(event), '...').rejects.toThrow();`, asserting the expected rejection instead of
discarding it. Left the four structurally-identical blocks in the Signicat describe block
untouched — they were not cited by this finding (the review's scope was specific to the six lines
in the Idura suite) and touching them is outside this finding's blast radius. Verified all 10 tests
in the file (6 changed + 4 unchanged) still pass, proving `POST` genuinely rejects under the mock
fixture so the new assertions are not vacuously true.

### WR-08: `bank-auth-journey.teardown.ts` wrote the shared `app_settings` singleton unordered relative to the perm chain

**Files modified:** `tests/tests/setup/candidate/bank-auth-journey.teardown.ts`,
`tests/tests/setup/candidate/bank-auth-journey.setup.ts`
**Commit:** `f633a1060`
**Applied fix:** Took the review's "preferably" option: removed step 3 (the
`updateAppSettings({ preRegistration: { enabled: false } })` write) entirely, rather than gating it
behind an env var. Every `setupFromTemplate` call already does a full authoritative REPLACE of
`app_settings.settings` before its own overlay, so the next setup to run (base, perm, or a re-run
of this project, which now always runs `data-setup-base` first per the CR-01 fix) unconditionally
resets `preRegistration` to that setup's own baseline — nothing needed restoring, and removing the
write is strictly safer than trying to order around it.

### WR-09: Journey selects the first election/constituency with no identity check

**Files modified:** `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts`
**Commit:** `5e08e0fb0`
**Applied fix:** Added an assertion that the election selector renders the seeded template's own
`[EL1]` election before `submitElection()` runs, so the walk cannot silently preregister into a
foreign election if the DB carries another dataset. Did not additionally set
`E2E_REQUIRE_FRESH_DB=true` (the review's "and/or" second option) — the `toContainText` assertion
alone is a strictly narrower, spec-local fix that doesn't change `setupFromTemplate`'s shared
precondition-probe behaviour for other consumers, and is sufficient to close the "the gate could
pass without exercising D-04" gap this finding raised.

### IN-01: Prefix-uniqueness guard lacked the sibling `fs.existsSync` precondition

**Files modified:** `tests/playwright.config.ts`
**Commit:** `bdb759575`
**Applied fix:** Added an `fs.existsSync(teardownDir)` precondition, mirroring the ORPHAN-PROBE
guard above it, throwing a named error if `tests/tests/setup` is ever absent/renamed instead of
dying on a raw `readdirSync` ENOENT.

### IN-02: WR-07's fix duplicated `runTeardown`'s 2-character invariant with no agreement check

**Files modified:** `packages/dev-seed/src/cli/teardown.ts`, `packages/dev-seed/src/index.ts`,
`tests/tests/setup/shared/assertTeardown.ts`
**Commit:** `b5d91844c`
**Applied fix:** Extracted the guard into an exported `assertTeardownPrefix(prefix, callerLabel)`
in dev-seed's `teardown.ts`. `runTeardown` and `runTeardownAsserted` both call the same
implementation now (with a caller-specific label baked into the thrown message), so there is one
copy of the invariant instead of two that could silently drift. Verified
`packages/dev-seed/tests/cli/teardown.test.ts` (25 tests, regex-matched against the guard message)
still passes unchanged.

### IN-03: Stale comment naming the old template

**Files modified:** `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts`
**Commit:** `5e08e0fb0` (folded into the WR-09 commit — same line, same file)
**Applied fix:** Updated the comment from `perm-not-located-2e2cg` to `perm-bankauth-notloc`.

### IN-04: `perm-bankauth-notloc.ts` was a 231-line verbatim clone that would drift from its source

**Files modified:** `packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts` (new),
`packages/dev-seed/src/templates/e2e/perm/perm-not-located-2e2cg.ts`,
`packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`
**Commit:** `80a37d38e`
**Applied fix:** Extracted the shared topology into `buildNotLocated2e2cgTemplate(prefix)`; both
templates are now a two-line call into the factory with their own disjoint prefix. Verified (a) a
script-level structural-equality check that the two generated templates are identical once each
one's own prefix is normalised out, and (b) all 445 dev-seed unit tests (including the
default-template integration test) still pass.

## Deferred

### IN-05: The E2E gates are still owed and CR-01's fix is unverified against a live DB

**File:** n/a (process)
**Reason for deferral:** This finding's own text is an instruction to run infrastructure this
fixer session does not have access to (`yarn db:reset && yarn dev` then `yarn test:e2e`, and
separately the `PLAYWRIGHT_BANK_AUTH=1 --project=bank-auth-journey` 3× determinism gate), not a
code change. Per this session's operating constraints ("Do NOT run the full E2E suite — no dev
server / clean Supabase is guaranteed in your context"), it is recorded here rather than attempted.
**Owed before Phase 140 closes:**
1. `yarn db:reset && yarn dev` then `yarn test:e2e` (full default suite) — must stay green,
   confirming none of this iteration's 13 commits (especially CR-01's new `dependencies` edge and
   `base.setup`'s widened sweep, and the 28 `retries: 0` sites from iteration 1's WR-02) surface a
   latent teardown transient.
2. `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey -c tests/playwright.config.ts`
   run 3× on a fresh dev server + clean DB per `IDURA-TEST-RUNBOOK.md` Step B-3 — this is the gate
   that empirically proves CR-01's regression fix (the `data-setup-base` dependency +
   `'e2e-bankauth-'` sweep) actually restores self-healing under real scheduling, and that A4
   ("stands alone") still holds with the new dependency edge.
3. Specifically worth checking during (1)/(2): that `perm-bankauth-notloc` seeds and tears down
   cleanly, that WR-09's new `toContainText('[EL1]')` assertion passes against the real rendered
   election-selector text, and that the WR-08 removal (no more explicit `preRegistration` reset in
   the teardown) does not leave a stale `true` value visible to a test that runs before the next
   `setupFromTemplate` REPLACE fires.

---

_Fixed: 2026-08-15T21:55:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
