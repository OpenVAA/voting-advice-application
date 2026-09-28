---
phase: 145-default-seed-template-repair
plan: "02"
subsystem: testing
tags: [anon-rls, supabase, postgrest, vitest, dev-seed, github-actions, negative-control, tracer]

# Dependency graph
requires:
  - phase: 145-default-seed-template-repair
    provides: "145-01 — the 30-row negative-control ledger with P1-RED / U1-RED / U2 / CI1 pre-written, the named root cause (anon_select_candidates is three clauses, PUBLISHABLE_TABLES satisfies one), the D4-CTRL-PRE accounts role differential proving an anon credential really is anon, and the § Sequencing hazard ordering rule"
  - phase: 144-seed-template-strict-typing-unknown-prop-guard
    provides: "packages/dev-seed tsconfig including tests/**, so new test code is typechecked"
provides:
  - "makeAnonClient() — the first client in the repository that reads the seeded database as `anon`, i.e. across the RLS boundary the voter app crosses"
  - "A standing regression guard: a second `it` in the existing integration `describe` asserting anon-visible candidate AND organization nomination counts through get_nominations(), fronted by an `accounts` role differential that makes a mis-keyed credential turn the guard red instead of green-forever"
  - "Test 28 / Test 29 in tests/templates/default.test.ts — the fast pure-I/O early-warning tier, no database required"
  - "SUPABASE_ANON_KEY exported in the dev-seed-integration CI job with a `test -n` guard that names the wiring failure at the export step"
  - "Ledger rows P1-RED and U1-RED measured RED, U2 measured GREEN (must-NOT-fire), CI1 recorded as a source assertion with its runner half named unobserved"
  - "The phase's central pair, first half: the guard observed FAILING against the unfixed template"
affects: [145-04, 145-05, 145-08]

actuals:
  tokens: 7732
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Role-differential guard-of-the-guard: an anon assertion carries, in the same `it` and before its own subject, a control asserting the credential's identity (accounts: anon 0 / service_role >0) — so the check cannot reproduce the blindness class it closes"
    - "Absent-key boundary: `?? 0` then `toBeGreaterThan(0)`, never `>= 0`, because an RLS-invisible entity type presents as a MISSING key rather than a zero count"
    - "Second `it` in the same `describe` rather than a new test file, because vitest parallelises across files and the assertion depends on rows the sibling `it` writes"
    - "CI credential export guarded by `test -n` with an explicit `::error::` string, converting a silent fallback-to-demo-key into a named wiring failure"

key-files:
  created: []
  modified:
    - packages/dev-seed/tests/integration/default-template.integration.test.ts
    - packages/dev-seed/tests/templates/default.test.ts
    - .github/workflows/main.yaml
    - .planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "Test 29 resolves e2e/base through BUILT_IN_TEMPLATES['e2e/base'] rather than by a direct module import, so it asserts about whatever module the CLI actually serves for that key"
  - "Assertion labels are carried as vitest's second `expect(value, message)` argument, not as comments, so the failing label appears in the run log verbatim and the ledger can cite it"
  - "Two of the plan's automated verify sub-checks were mis-calibrated against their own baselines and were corrected rather than satisfied — no product byte was changed to make a check pass"
  - "The default.test.ts contract docstring's behaviour count was updated 27 -> 29 as part of the same task, since the file's own header is a maintained claim about itself"

patterns-established:
  - "Guard-of-the-guard for role-scoped assertions: an assertion whose value is a credential must assert that credential's identity first"
  - "Per-row blob-identity proof in the ledger: each measured row cites `git hash-object` of the file under test equalling the recording commit's blob, so 'the run was on this tree' is checkable rather than asserted"

requirements-completed: [TMPL-03]

coverage:
  - id: D1
    description: "A standing regression guard that crosses the RLS boundary the voter app crosses: a second `it` in the existing integration `describe` calling get_nominations() through an anon client and requiring non-zero candidate AND organization counts"
    requirement: "TMPL-03"
    verification:
      - kind: integration
        ref: "packages/dev-seed/tests/integration/default-template.integration.test.ts#the seeded dataset is readable by the ANON client — the voter app path (TMPL-03)"
        status: fail
    human_judgment: false
    rationale: "status: fail is the DESIGNED outcome of this plan — see § Polarity. The guard is proven to catch by being observed red against the unfixed template; 145-04 lands the fix and records P1-GREEN."
  - id: D2
    description: "The guard cannot pass vacuously: an `accounts` role differential (anon 0 rows, service_role >=1 row) runs first inside the same `it`, so a service-role key in SUPABASE_ANON_KEY turns the guard red rather than green-forever"
    requirement: "TMPL-03"
    verification:
      - kind: integration
        ref: "${TMPDIR}/gsd-145/vt-P1-RED-1.log — execution reached the later candidate assertion at :521, so both role controls were evaluated and held; 0 failure-reporting lines match '(role control)'"
        status: pass
    human_judgment: false
  - id: D3
    description: "The fast pure-I/O early-warning tier: Test 28 asserts every row candidatesOverride emits carries terms_of_use_accepted at the literal e2e/base uses, with no database"
    requirement: "TMPL-03"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/default.test.ts#Test 28: every emitted candidate row carries terms_of_use_accepted (anon-RLS precondition)"
        status: fail
    human_judgment: false
    rationale: "status: fail is the designed U1-RED half. Observed 'expected undefined to be 2025-01-01T00:00:00.000Z' — the override emits no such key. 145-04 turns it green as U1-GREEN."
  - id: D4
    description: "Test 29 pins both templates to one terms_of_use_accepted literal while leaving e2e/base's two deliberate omissions (ca-aa-hidden, ca-aa-unregistered) intact — a must-NOT-fire row"
    requirement: "TMPL-03"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/default.test.ts#Test 29: e2e/base candidate rows use the same terms_of_use_accepted literal (cross-template consistency)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The dev-seed-integration CI job exports SUPABASE_ANON_KEY from `supabase status -o env`, guarded by `test -n` with the error string 'ANON_KEY missing from supabase status', with no paths-filter added and no credential echoed to stdout"
    requirement: "TMPL-03"
    verification:
      - kind: other
        ref: ".github/workflows/main.yaml:227,230,233 — extraction, guard, $GITHUB_ENV append; 0 paths-filter occurrences inside the dev-seed-integration job block"
        status: pass
    human_judgment: true
    rationale: "SOURCE half only. The RUNNER half is unobserved: CI triggers on push/PR to main and this branch is far ahead of a stale origin/main. Ledger row CI1 and § Residue record it as deferred to this branch's first pull request. A grep is not a run."
  - id: D6
    description: "Ledger rows P1-RED, U1-RED, U2 and CI1 filled from runs executed in this plan, dropping the whole-register placeholder count from 120 to 100"
    requirement: "TMPL-03"
    verification:
      - kind: other
        ref: "Task 3 <automated> verify — 0 placeholders across the four rows, 100 register-wide, P1-RED cites the failing label verbatim, CI1 cites 'deferred', § Residue names the discharging event"
        status: pass
    human_judgment: false

# Metrics
duration: 9 min
completed: 2026-08-24
status: complete
---

# Phase 145 Plan 02: The Anon-Client Tracer, Observed Red Summary

**The first check in this repository that reads the seeded database as `anon` — a second `it` in the existing integration `describe` calling `get_nominations()` through a genuinely-anon client, fronted by an `accounts` role differential that makes the credential's own identity an assertion — observed FAILING against the unfixed template with `anon-visible candidate nominations: expected 0 to be greater than 0`, both role controls green in the same run.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-08-24T13:19:17Z
- **Completed:** 2026-08-24T13:28:32Z
- **Tasks:** 3
- **Files modified:** 4 (3 instrument/CI, 1 ledger); **0** under `packages/dev-seed/src`

## ⚠ This plan deliberately leaves the suite RED

`yarn workspace @openvaa/dev-seed test:unit` exits **1** at the close of this plan, and that is the
deliverable. The milestone's standing acceptance rule requires a guard to be **observed failing**
against the unfixed template before it can be claimed to guard; `145-04` lands the one-column fix and
records the GREEN halves. Two tests are red by design — the anon integration guard (`P1-RED`) and the
pure-I/O `Test 28` (`U1-RED`). Nothing else in the 48-file suite is red.

## Accomplishments

- **The tracer runs end to end and fails on exactly the entity type the defect hides.** One path now
  goes CI credential export → `makeAnonClient()` → PostgREST → Postgres RLS → `get_nominations()` →
  assertion. Measured: `Test Files 1 failed / 47 passed (48) · Tests 1 failed / 552 passed (553)`,
  exit **1**, failure message `AssertionError: anon-visible candidate nominations: expected 0 to be
  greater than 0`.
- **The red has the declared shape, and that is what makes it evidence.** The `anon-visible
  organization nominations` assertion **passed** in the same block — organizations survive the role
  change and candidates vanish — which localises the failure to the `candidates` anon policy rather
  than to the RPC, the seeding or the credential. A blanket failure would have proved nothing.
- **The guard cannot pass vacuously, and that was measured rather than reasoned.** The two `accounts`
  role-control assertions are the first two in the `it` and the failure is at the later candidate
  assertion (`:521`), so execution necessarily evaluated and satisfied both; `0` failure-reporting
  lines in either run log match `(role control)`. Without this, a `SUPABASE_ANON_KEY` accidentally set
  to the service-role key — a copy-paste from the factory three functions above — would make every
  assertion below it pass forever without crossing the RLS boundary, reproducing inside the check the
  exact blindness class the check exists to end.
- **The fast tier catches the same defect with no database.** `Test 28` fails with `expected undefined
  to be '2025-01-01T00:00:00.000Z'` on the first of 327 emitted rows — the override emits no such key
  at all. It is an early-warning tier, not a substitute: it asserts what the template emits, never
  what `anon` can read.
- **`Test 29` pins both templates to one literal without depending on the fix,** and stays green
  because it filters to the rows carrying the key first — so `e2e/base`'s two deliberate omissions
  (`ca-aa-hidden`, `ca-aa-unregistered`, an in-repo negative control the RLS migration cites by name)
  survive rather than being "fixed" away.
- **CI now exports the credential the guard needs, guarded by name.** `ANON_KEY` is extracted with the
  same grep/cut shape the two existing variables use, `test -n "$ANON_KEY" || { echo "::error::ANON_KEY
  missing from supabase status"; exit 1; }` sits beside the two existing guards, and the value reaches
  `$GITHUB_ENV` only — never stdout, and no `set -x`. Without the guard, a future CLI that stops
  emitting `ANON_KEY` would yield an empty variable, the test would fall back to a demo key that does
  not authenticate against the runner's instance, and the build would go red **as if the seed template
  had regressed**.
- **Four ledger rows measured**, dropping the whole-register placeholder count from 120 to **100**
  (20 unmeasured rows × 5 cells), each row citing its own log path, its own HEAD, and a
  `git hash-object` blob-identity proof that the run was on the tree the commit records.

## Task Commits

1. **Task 1 (TRACER): the anon guard end to end, observed RED** — `2e5262d4a` (test)
2. **Task 2: the fast pure-I/O tier — Test 28 RED, Test 29 green** — `418eb1353` (test)
3. **Task 3: record P1-RED, U1-RED, U2 and CI1** — `3b8c25d37` (docs)

## Files Created/Modified

- `packages/dev-seed/tests/integration/default-template.integration.test.ts` — `makeAnonClient()`
  beneath `makeReadClient()`, and a second `it` in the existing `describe`
  (`the seeded dataset is readable by the ANON client — the voter app path (TMPL-03)`, `300_000`
  timeout) carrying the `accounts` role differential and the two nomination assertions. +100 lines.
- `packages/dev-seed/tests/templates/default.test.ts` — `Test 28` and `Test 29` at the end of the
  `candidatesOverride` describe, plus the header's behaviour count updated 27 → 29. +54/-1 lines.
- `.github/workflows/main.yaml` — `ANON_KEY` extraction, `test -n` guard and `SUPABASE_ANON_KEY`
  append in the `dev-seed-integration` job's `Export Supabase connection env` step, with the step's
  existing comment extended (not replaced) with the reason the guard is load-bearing. +18 lines.
- `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — rows `P1-RED`,
  `U1-RED`, `U2`, `CI1`; a `### Deferred` residue entry for the CI runner half; a second-observation
  paragraph under § Sequencing hazard.

**Run logs (outside the repository, never committed)** under
`/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-145/`: `seed-reset-145-02-1.log`
(exit 0, 752 rows across 14 tables), `vt-P1-RED-1.log`, `vt-U1-RED-1.log`.

## Measured Results

| Row | What was measured | Result |
|---|---|---|
| `P1-RED` | the new anon `it` against the pre-fix template, at `2e5262d4a` | exit **1** · 1 failed / 552 passed (553) · fails `anon-visible candidate nominations: expected 0 to be greater than 0` · both role controls green · organizations green |
| `U1-RED` | `Test 28` against the pre-fix override, at `418eb1353` | exit **1** · 2 failed / 553 passed (555) · `expected undefined to be '2025-01-01T00:00:00.000Z'` |
| `U2` | `Test 29`, same run | **PASSED** (0 ms) — must-NOT-fire, second half owned by `145-04` |
| `CI1` | the `ANON_KEY` export step, source read at `2e5262d4a` | 3 source facts confirmed (`:227` extraction, `:230` guard + error string, `:233` `$GITHUB_ENV` append); 0 `paths-filter` inside the job block · **runner half unobserved, deferred** |

Every polarity expectation in the plan's `<polarity>` section was met. No stop-the-line signal fired:
the failure was never the role control and never the organization assertion.

## Decisions Made

- **`Test 29` resolves `e2e/base` through `BUILT_IN_TEMPLATES['e2e/base']`** rather than importing
  `../../src/templates/e2e/base` directly. The plan offered either; the built-ins route asserts about
  whatever module the CLI actually serves for that key, so re-pointing the key is followed rather than
  silently bypassed. It stays pure I/O — templates are plain data, no Supabase import, no client, no
  RPC.
- **Assertion labels ride vitest's `expect(value, message)` second argument, not comments.** The
  ledger's `P1-RED` row has to cite the failing label *verbatim from the log*; a comment would name it
  in the source but leave the log naming only a line number.
- **The default.test.ts header count was corrected 27 → 29 in the same commit.** The docstring is a
  maintained claim the file makes about itself; leaving it stale while adding two tests would make the
  next reader distrust the rest of the header.
- **Two mis-calibrated verify sub-checks were corrected, not satisfied.** See Deviations. No product
  or instrument byte was changed to turn a check green — that would have inverted the whole point of
  a plan whose deliverable is a red.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 1's `paths-filter` verify sub-check is unsatisfiable against its own baseline**
- **Found during:** Task 1 (acceptance-criteria gate)
- **Issue:** The `<automated>` verify asserts
  `test "$(grep -c 'paths-filter' .github/workflows/main.yaml)" -le 1`. The file's count at
  `HEAD` **before this plan** is already **2**: a real `uses: dorny/paths-filter@v3` at `:112` in the
  unrelated `supabase-tests` job, and the word inside the `dev-seed-integration` job's own prose
  rationale at `:155` — the comment that *says there is deliberately no paths-filter here*. The
  sub-check therefore fails on the untouched file, and the only way to "satisfy" it would be to delete
  the sentence documenting the very property being asserted.
- **Fix:** Replaced with two strictly stronger checks measuring the criterion's stated intent ("no
  `paths-filter` was **added to the `dev-seed-integration` job**"): (a) `0` occurrences inside the
  `dev-seed-integration` job block, measured with an `awk` range over the job; (b) whole-file count
  unchanged from `git show HEAD:.github/workflows/main.yaml | grep -c 'paths-filter'` = 2. Both pass.
- **Files modified:** none — this is a correction to a verification command, not to the tree.
- **Verification:** `awk`-scoped count inside the job block = **0**; baseline = **2**, current = **2**.
- **Committed in:** n/a (no file change); recorded here and in `.planning/WINDOWS.md`.

**2. [Rule 1 - Bug] Task 2's `createClient` verify sub-check is unsatisfiable against its own baseline**
- **Found during:** Task 2 (acceptance-criteria gate)
- **Issue:** The `<automated>` verify asserts
  `test "$(grep -c 'createClient' packages/dev-seed/tests/templates/default.test.ts)" -eq 0`. The
  file's count at `HEAD` before this plan is already **1** — its own contract docstring at `:13`,
  ``contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc `.`` The only string matching
  is the sentence **forbidding** the thing, so satisfying the check would mean deleting the contract.
- **Fix:** Replaced with (a) `grep -c 'createClient('` = **0** — zero call sites, which is the
  property the criterion means — and (b) the whole-file mention count unchanged from its `HEAD`
  baseline of 1. Both pass, and together they are stronger than the original: the original would pass
  for a file that deleted its contract statement and then called `createClient` via a variable.
- **Files modified:** none.
- **Verification:** `createClient(` call sites = **0**; mentions = **1** = baseline; the single hit is
  line 13, the docstring.
- **Committed in:** n/a (no file change); recorded here and in `.planning/WINDOWS.md`.

**3. [Rule 2 - Missing Critical] `vt-P1-RED-1.log` re-taken so the log carries its own exit code**
- **Found during:** Task 1 (observe-the-red step)
- **Issue:** The first run piped through `tee`, and the shell here is `zsh`, where `${PIPESTATUS[0]}`
  is not set — so the wrapper could not append the vitest exit code to the log. A ledger row whose
  exit-code cell cannot be re-derived from the log it cites is not evidence; `145-01`'s own header
  makes exactly this point about unresolvable log paths.
- **Fix:** Re-issued the identical command on the identical tree without a pipe, redirecting to the
  same log path and appending `EXIT=$?`. The dataset was still pre-fix (`packages/dev-seed/src`
  untouched throughout), so this is one measurement, not two joined across states — and the row
  asserts blob identity (`62b9f0ea…` = `2e5262d4a`'s blob) rather than assuming it.
- **Files modified:** none in the repository; `${TMPDIR}/gsd-145/vt-P1-RED-1.log` re-written.
- **Verification:** log now ends `EXIT=1`; both runs produced the same failure and the same counts.
- **Committed in:** n/a.

**4. [Rule 2 - Missing Critical] `default.test.ts` header behaviour count updated 27 → 29**
- **Found during:** Task 2
- **Issue:** The file's own docstring claims it "covers 27 behaviors". Adding `Test 28` and `Test 29`
  without touching it leaves a false claim in the header of a file whose whole value is being trusted
  about itself.
- **Fix:** Count updated to 29 and a fifth bullet added naming the anon-RLS precondition tier and its
  relationship to the live integration guard.
- **Files modified:** `packages/dev-seed/tests/templates/default.test.ts`
- **Verification:** `Tests 553 passed (555)` in `vt-U1-RED-1.log` — the file reports 29 tests.
- **Committed in:** `418eb1353`

---

**Total deviations:** 4 auto-fixed (2 verification-command bugs, 2 missing-critical).
**Impact on plan:** None widened scope. Deviations 1 and 2 correct checks, not code — and both
replacements are strictly stronger than the originals. Deviation 3 makes an already-taken measurement
citable. Deviation 4 is one docstring line inside a file the plan already owns. **No product byte was
changed to make any check pass**, which is the invariant that matters in a plan whose deliverable is a
red.

## Issues Encountered

- **`zsh` does not populate `PIPESTATUS`** (it uses `pipestatus`, lower-case, 1-indexed). Cost one
  re-run; handled as deviation 3. Worth remembering for later plans in this phase that tee gate logs.
- **The Supabase CLI is not on the bare `PATH` in a non-login shell**, as `145-01` recorded. Every
  invocation used `npx supabase` from `apps/supabase`, or the workspace `yarn db:*` scripts.

## Prohibitions — status

All eight of the plan's prohibitions hold, checked rather than asserted:

| Prohibition | Status |
|---|---|
| no new integration test file | `ls packages/dev-seed/tests/integration/` = **1** entry (pre-existing) |
| no edit to `permittedKeys.ts` or any row type | `git status --porcelain -- packages/dev-seed/src` empty; `terms_of_use_accepted` still appears there exactly once |
| no hard-coded constituency / election / nomination UUID | `0` matches for a quoted 8-4-4-4-12 hex literal in the guard's file |
| no hard-coded `external_id` literal in the guard | the guard resolves nothing — `rpc('get_nominations', {})`, the no-argument form |
| no routing anon work through `SupabaseAdminClient` | bare `createClient`; the operation budget passed unchanged in both runs |
| no service-role key as the anon credential | key reads `SUPABASE_ANON_KEY` with the published local demo **anon** fallback; the `accounts` control measured 0 rows, which a service-role key could not produce |
| no `paths-filter` on the `dev-seed-integration` job | `0` occurrences inside the job block |
| no package added for the role check | zero dependency changes; `package.json` untouched |

## Threat Flags

None. The three trust boundaries in the plan's `<threat_model>` are the ones this plan was built
around and each mitigation shipped: `T-145-02` (the role differential), `T-145-03` / `T-145-09` (the
published local demo anon key only — `0` matches for the JWT prefix `eyJhbGciOi` in the ledger, and no
hosted-project key anywhere), `T-145-07` (value to `$GITHUB_ENV` only, no `echo` to stdout, no
`set -x`), `T-145-08` (the `test -n` guard). No new network endpoint, auth path or schema change was
introduced.

## Known Stubs

None. Two tests are RED, which is the plan's designed output rather than a stub: both assert real
behaviour against a real database and a real template, both are recorded in the ledger with their
observed failure messages, and `145-04` turns both green. No `t.skip`, no `test.todo`, no unrun
`<verify>`.

## User Setup Required

None — no external service configuration required. Local Supabase was already running; the plan used
`yarn db:reset-with-data`, which rebuilds a disposable local dev database.

## Next Phase Readiness

- **`145-03` (the Playwright app-level probe, rows `A1-RED` / `A2-PRE`) is next**, and is unblocked —
  it needs the pre-fix dataset, which the tree still produces.
- **`145-04` inherits three obligations from this plan**, all recorded in the ledger: turn `P1-RED`
  into `P1-GREEN` and `U1-RED` into `U1-GREEN` on the fixed tree, and **re-observe `U2` GREEN** — a
  colour change on `U2` in either direction would mean `Test 29` is coupled to the fix rather than to
  the cross-template literal it exists to pin.
- **The pre-fix state remains available** — `packages/dev-seed/src` is byte-identical to
  `7e26bfd98` across this plan — but the § Sequencing hazard still applies: any plan needing a
  known-clean pre-fix dataset must run `yarn db:reset-with-data` first rather than assume the current
  state, because both suite runs here re-seeded through the integration test's `beforeAll`.
- **One deferred item is open and named:** `CI1`'s runner half, discharged by this branch's first pull
  request to `main`. It is in the ledger's `## Residue`, not only here.
- **No blockers.**

## Self-Check: PASSED

- All four modified files exist on disk.
- All three task commits found in `git log`: `2e5262d4a`, `418eb1353`, `3b8c25d37`.
- All three run logs exist and are non-empty under
  `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-145/`.
- All three tasks' `<automated>` verify commands re-run and PASSED (Tasks 1 and 2 with the two
  corrected sub-checks documented above; every other sub-check verbatim).
- Plan-level verification: the suite is red in the declared shape · `1` entry under
  `packages/dev-seed/tests/integration/` · `git status --porcelain -- packages/dev-seed/src` prints
  nothing · `main.yaml` exports the anon key with a named `test -n` guard and `0` `paths-filter` inside
  the job · 4 ledger rows measured, whole-register placeholder count **100** · `0` matches for the JWT
  prefix `eyJhbGciOi` in the ledger.
- `yarn workspace @openvaa/dev-seed typecheck` exit **0**; `prettier --check` clean on all four files.

---
*Phase: 145-default-seed-template-repair*
*Completed: 2026-08-24*
