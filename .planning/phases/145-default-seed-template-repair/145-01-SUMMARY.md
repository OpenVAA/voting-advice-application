---
phase: 145-default-seed-template-repair
plan: "01"
subsystem: testing
tags: [negative-control, rls, supabase, postgrest, dev-seed, vitest, evidence-ledger]

# Dependency graph
requires:
  - phase: 144-seed-template-strict-typing-unknown-prop-guard
    provides: "144-NEGATIVE-CONTROL-LEDGER.md — the header field set, the rows-first ordering rule, the restoration blob-hash table, and the stance that an unexecuted row carries no outcome"
  - phase: 143-lint-gate-repair
    provides: "143-NEGATIVE-CONTROL-LEDGER.md — 144's own template; the § Completeness self-assertion shape"
provides:
  - "145-NEGATIVE-CONTROL-LEDGER.md with all 30 register rows written and committed before the phase's first measurement existed"
  - "The blindness half (B1-OLD): the existing, unmodified dev-seed suite measured GREEN (48/48 files, 552/552 tests, exit 0) with its live-Supabase block forced to execute, over a dataset the voter app's anon client cannot read"
  - "The four criterion-3 diagnostic rows (D1-ANON-PRE, D2-SVC-PRE, D3-COL-PRE, D4-CTRL-PRE) — a same-session role differential on one RPC call"
  - "A named root cause resting on measured column state and a proven-anon credential, not on the roadmap's three (disproved) guesses"
  - "A nine-path git hash-object restoration table at HEAD 7e26bfd98 that every later injection in this phase asserts against"
  - "The § Sequencing hazard record: yarn test:unit re-seeds the live DB with no post-test teardown, and the order 145-01 used to work around it"
affects: [145-02, 145-03, 145-04, 145-05, 145-06, 145-07, 145-08]

actuals:
  tokens: 7812
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Ledger-first plan ordering: plan 01 writes zero product bytes so the blind half is measurable on the untouched tree"
    - "Same-session role-differential RPC probe (anon vs service_role on one call) as the diagnostic that localises a failure to the RLS boundary"
    - "Guard-of-the-guard: an independent role control (accounts 0/1) measured pre-fix so a mis-keyed anon probe cannot pass vacuously"

key-files:
  created:
    - .planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md
  modified: []

key-decisions:
  - "The placeholder word for an unrun measurement cell is the single lower-case word `pending`, named in the ledger header so the register's stance is explicit and the count is greppable"
  - "The restoration table covers nine tracked paths (the seven RESEARCH § Pattern 3 names plus nominations-override.ts and tests/playwright.config.ts), because 145-03 and 145-07 edit those two"
  - "B1-OLD's claim was re-confirmed against the dataset the suite itself wrote (diag-B1-postrun-1.json), not only against the pre-run dataset, so the green and the anon-unreadability describe the same database state"
  - "T1 is counted outside the eight § Completeness classes and named as such, so the class arithmetic closes at 30 without inventing a class"

patterns-established:
  - "Register rows are pre-written in full and only their last five cells are filled by later plans, making the placeholder count a running assertion (150 at creation, 130 after Task 2, 120 at plan close)"
  - "Diagnostic payloads live outside the repository under ${TMPDIR}/gsd-145/ and no key material is ever written into a tracked file"

requirements-completed: [TMPL-03, TMPL-04]

coverage:
  - id: D1
    description: "145-NEGATIVE-CONTROL-LEDGER.md opened with all 30 register rows written, 150 placeholder cells, a nine-path restoration blob-hash table, and a header carrying the resolved $TMPDIR, HEAD and machine — committed before any measurement in this phase existed"
    requirement: "TMPL-03"
    verification:
      - kind: other
        ref: "Task 1 <automated> verify — 30-row count, 150-placeholder row-scoped count, 9 restoration rows, 9 blob hashes, all named sections present, clean git status outside .planning"
        status: pass
      - kind: other
        ref: "git log --oneline: 6bd42c52d precedes 71f4104d9 and 0b45b6667 (commit-graph ordering property)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The four criterion-3 diagnostic rows measured in one session on the untouched tree, and the root cause named from them: anon get_nominations returns key set [alliance, organization] with the candidate key ABSENT while service_role returns candidate 327; 327/327 seeded candidates are published with a null terms_of_use_accepted; accounts discriminates 0 (anon) vs 1 (service_role)"
    requirement: "TMPL-03"
    verification:
      - kind: integration
        ref: "${TMPDIR}/gsd-145/diag-D1-anon-1.json · diag-D2-svc-1.json · diag-D3-col-1.json · diag-D4-ctrl-1.json — live PostgREST probes, curl exit 0, HTTP 200"
        status: pass
      - kind: other
        ref: "Task 2 <automated> verify — 0 placeholders across the four rows, 0 JWT-prefix matches in the ledger, § Root cause >= 8 lines citing D1-ANON-PRE and SECURITY INVOKER"
        status: pass
    human_judgment: false
  - id: D3
    description: "The blindness half measured: the existing, unmodified packages/dev-seed suite runs GREEN (exit 0, 48/48 files, 552/552 tests, 0 skipped) with DEV_SEED_INTEGRATION_REQUIRED=1 and the live-Supabase block executing, over a dataset whose candidates the anon client cannot read"
    requirement: "TMPL-03"
    verification:
      - kind: integration
        ref: "${TMPDIR}/gsd-145/vt-B1-OLD-1.log — 'Test Files 48 passed (48)', 'Tests 552 passed (552)', integration file executed in 10368ms, 0 skipped-file matches"
        status: pass
      - kind: integration
        ref: "${TMPDIR}/gsd-145/diag-B1-postrun-1.json — post-run role differential against the suite's own output: anon 50 rows / candidate absent, service_role 377 rows / candidate 327"
        status: pass
    human_judgment: false
  - id: D4
    description: "Zero product bytes and zero instrument bytes written: nothing under packages/, apps/, tests/, .github/ or the repo root changed; the only committed artifact is the ledger"
    verification:
      - kind: other
        ref: "git status --porcelain -- packages apps tests .github package.json turbo.json (empty, asserted after each of the three task commits) and git diff --name-only 7e26bfd98..HEAD -- . ':(exclude).planning/**' (empty)"
        status: pass
    human_judgment: false

# Metrics
duration: 16 min
completed: 2026-08-24
status: complete
---

# Phase 145 Plan 01: Negative-Control Ledger Opened and the Blind Halves Measured Summary

**A 30-row negative-control ledger opened before the phase's first measurement, then six of its rows filled on the untouched tree: the existing dev-seed suite measured GREEN over a dataset the voter app's anon client cannot read, and a same-session anon/service_role differential on `get_nominations()` (candidate key ABSENT vs candidate 327) that names the root cause at the RLS boundary.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-08-24T12:59:00Z
- **Completed:** 2026-08-24T13:15:00Z
- **Tasks:** 3
- **Files modified:** 1 created (`145-NEGATIVE-CONTROL-LEDGER.md`); 0 outside `.planning/`

## Accomplishments

- **The ledger exists with all 30 rows written before the first measurement**, and that ordering is a
  property of the commit graph: `6bd42c52d` (the ledger-opening commit) precedes `71f4104d9` and
  `0b45b6667`, and precedes `145-02` entirely. 30 rows × 5 unfilled cells = **150** placeholder
  occurrences at creation, falling to **130** after Task 2 and **120** at plan close — exactly the 24
  rows the seven later plans own.
- **The blindness half is now a measurement, not a story.** The existing, unmodified
  `packages/dev-seed` suite ran **exit 0 · 48/48 test files · 552/552 tests · 0 skipped**, with
  `DEV_SEED_INTEGRATION_REQUIRED=1` and `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` exported so the
  live-Supabase block executed (10368 ms) rather than skipping. Confirmed against the dataset the
  suite's own teardown-and-reseed produced: anon sees 50 nomination rows with the `candidate` key
  absent; service_role sees 377 with `candidate` 327.
- **The root cause is named from four same-session measurements** — the `PUBLISHABLE_TABLES`
  auto-default satisfies 1 of the `anon_select_candidates` policy's 3 clauses, and `get_nominations`
  being `SECURITY INVOKER` with a `COALESCE(...) IS NOT NULL` filter is why the failure presents as a
  missing tab rather than an empty list.
- **The guard-of-the-guard control was measured pre-fix**, so its invariance across the fix is a fact:
  `accounts` returns 0 rows to anon and 1 to service_role. Without it, every anon assertion `145-02`
  builds would be vacuous.
- **A nine-path `git hash-object` restoration table** was taken at HEAD `7e26bfd98`, giving every
  later injection in this phase a pre-change blob to assert against.

## Task Commits

1. **Task 1: Create the ledger with all 30 rows pre-written** — `6bd42c52d` (docs)
2. **Task 2: Measure the four criterion-3 diagnostic rows** — `71f4104d9` (docs)
3. **Task 3: Measure the blindness half** — `0b45b6667` (docs)

## Files Created/Modified

- `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — the phase's
  evidence register: header (resolved `$TMPDIR`, HEAD, machine, protocol source, asserted corpus),
  § Why this ledger exists, § Precedent chain, § Restoration blob hashes (9 paths), § Injection
  register (30 rows), § Root cause named (criterion 3), § Residue with the § Sequencing hazard note,
  and the § Gates / § Final counts / § Completeness stubs.

**Run logs (outside the repository, never committed)** at
`/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-145/`:
`seed-reset-1.log`, `diag-D1-anon-1.json`, `diag-D2-svc-1.json`, `diag-D3-col-1.json`,
`diag-D4-ctrl-1.json`, `vt-B1-OLD-1.log`, plus the additional `diag-B1-postrun-1.json` (see
Deviations).

## Measured Results

| Row | What was measured | Result |
|---|---|---|
| `B1-OLD` | existing dev-seed suite, live block forced | exit **0** · 48/48 files · 552/552 tests · 0 skipped |
| `B2-OLD` | `get_nominations()` as service_role | `candidate` **327** (377 rows), identical before and after the suite run |
| `D1-ANON-PRE` | `get_nominations()` as anon | 50 rows · key set `["alliance","organization"]` · **`candidate` ABSENT** |
| `D2-SVC-PRE` | identical call as service_role, same session | 377 rows · `["alliance","candidate","organization"]` · candidate **327** |
| `D3-COL-PRE` | `candidates` column state | 327 `seed_` rows · `published=true` **327** · `terms_of_use_accepted IS NULL` **327** |
| `D4-CTRL-PRE` | `accounts` role differential | anon **0** rows · service_role **1** row |

Every polarity expectation in the plan's `<polarity>` section was met. No stop-the-line signal fired.

## Decisions Made

- **The placeholder word is `pending`, named in the ledger header.** The plan's acceptance criteria
  count it row-scoped, so naming it in the header makes the register's stance explicit rather than
  implicit in a grep.
- **The restoration table covers nine paths, not the seven RESEARCH § Pattern 3 lists as a minimum.**
  `packages/dev-seed/src/templates/defaults/nominations-override.ts` and `tests/playwright.config.ts`
  were added because `145-06` and `145-03` respectively edit them; a path a later plan edits with no
  pre-change blob cannot be restore-proven.
- **`T1` is counted outside the eight § Completeness classes** the plan enumerates, and said to be so
  in the ledger. The eight classes sum to 29; inventing a ninth class would have been a quieter
  choice than naming the one row that does not fit.
- **`B1-OLD` rests on a post-run confirmation, not only on the pre-run dataset.** The suite's own
  `beforeAll` tears down and re-seeds, so the dataset it ran green over is not the one the
  diagnostics measured. The extra probe makes "green over an anon-unreadable dataset" a claim about
  one database state rather than two.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added a post-run role-differential confirmation probe for `B1-OLD`**
- **Found during:** Task 3 (blindness-half measurement)
- **Issue:** `default-template.integration.test.ts` runs `runTeardown('seed_', …)` in its `beforeAll`
  and then re-writes the full default template. The dataset the suite runs green over is therefore
  **not** the dataset Task 2's diagnostics measured. As written, `B1-OLD`'s outcome cell would have
  joined a greenness measured on one database state to an anon-unreadability measured on another —
  the kind of cross-state join this ledger's own "measurement, never citation" rule exists to forbid.
- **Fix:** Issued one additional same-session probe immediately after the suite run — the identical
  anon and service_role `get_nominations()` calls against the suite's own output — saved to
  `${TMPDIR}/gsd-145/diag-B1-postrun-1.json`. It returned anon 50 rows / `candidate` absent and
  service_role 377 rows / `candidate` 327, i.e. the same differential. `B1-OLD`'s outcome cell and
  `B2-OLD`'s assertion cell both cite it.
- **Files modified:** the ledger only (`B1-OLD`, `B2-OLD`, § Sequencing hazard). No tracked file
  outside `.planning/`.
- **Verification:** Task 3's `<automated>` verify passed; `git status --porcelain -- packages apps
  tests .github package.json turbo.json` printed nothing.
- **Committed in:** `0b45b6667`

**2. [Rule 2 - Missing Critical] Restoration table widened from seven paths to nine**
- **Found during:** Task 1 (ledger creation)
- **Issue:** RESEARCH § Pattern 3 lists seven paths "at minimum", but the plan's own
  `<artifacts_this_phase_produces>` shows `145-06` editing
  `packages/dev-seed/src/templates/defaults/nominations-override.ts` and `145-03` editing
  `tests/playwright.config.ts`. Either would be un-restore-provable without a pre-change blob.
- **Fix:** Both paths added to the table with blob hashes taken at HEAD `7e26bfd98`. (The plan's Task
  1 action already named all nine; this records that the seven-path RESEARCH minimum was deliberately
  exceeded rather than mis-copied.)
- **Files modified:** the ledger only.
- **Verification:** the restoration-row count is asserted at exactly 9 by Task 1's `<automated>`
  verify.
- **Committed in:** `6bd42c52d`

---

**Total deviations:** 2 auto-fixed (2 missing-critical).
**Impact on plan:** Both strengthen the evidence rather than widen it. Neither wrote a byte outside
`.planning/`, neither added a register row, and neither changed the plan's acceptance criteria.
No scope creep.

## Issues Encountered

- **A `jq` reduction over `entity_type` initially failed with "Cannot use null (null) as object key",
  which could have been mistaken for null-typed rows in the payload.** It was a `from_entries`
  artefact of the reduction expression, not a property of the data: a direct count returned **0** rows
  with `entity_type == null` in both the anon and service_role payloads, and the distinct key sets are
  `["alliance","organization"]` and `["alliance","candidate","organization"]`. The null-row count is
  recorded in `D1-ANON-PRE`'s assertion cell precisely so a later reader does not have to re-derive
  that the absence is real rather than a mis-reduction — which is the failure mode the plan's
  `<polarity>` section warns about in its `candidate: 0` note.
- **The Supabase CLI is not on the bare `PATH` in a non-login shell**, as the HYGIENE-LOOP's standing
  constraint 8 states. Every invocation used `npx supabase` from `apps/supabase` or the workspace
  `yarn db:*` scripts. (The CLI also reports v2.83.0 with v2.115.0 available; not upgraded — an
  unrequested toolchain bump mid-measurement would invalidate the session.)

## Requirements Status — read this before marking anything complete

`TMPL-03` and `TMPL-04` are copied into `requirements-completed` verbatim from this plan's
`requirements:` frontmatter, per the SUMMARY contract. **Neither is satisfied yet.** The milestone's
standing acceptance rule (`REQUIREMENTS.md:7-13`) requires both halves — blindness *and* catch — and
this plan measured only the blindness half. The catch halves are owned by `145-02` (`P1-RED`,
`U1-RED`), `145-04` (`P1-GREEN`, `U1-GREEN`) and `145-05` (`P2-RED`, `P2-GREEN`). The shared-ID gate
correctly withholds both IDs from `REQUIREMENTS.md` until every declaring plan in this phase has a
SUMMARY.

## User Setup Required

None — no external service configuration required. Local Supabase was already running and was used
read-only apart from `yarn db:reset-with-data`, which rebuilds a disposable local dev database.

## Next Phase Readiness

- **`145-02` (the tracer) is unblocked and is the very next plan.** It owns `makeAnonClient()`, the
  second `it` in `default-template.integration.test.ts`, `Test 28` / `Test 29` in `default.test.ts`,
  and the `SUPABASE_ANON_KEY` CI export — plus register rows `P1-RED`, `U1-RED`, `U2` and `CI1`.
- **The pre-fix state is still measurable but is no longer pristine.** The `B1-OLD` suite run
  re-seeded the live database with the same pre-fix template, so `145-02`'s `P1-RED` half will
  observe the same defect — but any plan needing a known-clean pre-fix dataset should run
  `yarn db:reset-with-data` first rather than assume the current state, per § Sequencing hazard.
- **`145-02` must not commit its instrument before `P1-RED` is captured**, and must leave the tree
  clean outside `.planning/` at every task boundary — the restoration table at HEAD `7e26bfd98` is
  what it asserts against.
- **No blockers.** No stub was written, no test was skipped, and no `<verify>` went unrun.

## Self-Check: PASSED

- `145-NEGATIVE-CONTROL-LEDGER.md` exists on disk (31,247 bytes, 296 lines).
- All three task commits found in `git log`: `6bd42c52d`, `71f4104d9`, `0b45b6667`.
- All six run logs plus the extra confirmation probe exist and are non-empty under
  `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-145/`.
- All three tasks' `<automated>` verify commands re-run and PASSED.
- Plan-level verification: 30 register rows · 6 measured · 120 placeholder cells remaining (24 rows) ·
  `git diff --name-only 7e26bfd98..HEAD -- . ':(exclude).planning/**'` prints nothing · 0 matches for
  the JWT prefix `eyJhbGciOi` in the ledger.

---
*Phase: 145-default-seed-template-repair*
*Completed: 2026-08-24*
