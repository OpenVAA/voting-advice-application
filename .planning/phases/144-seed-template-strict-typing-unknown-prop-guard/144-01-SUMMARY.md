---
phase: 144-seed-template-strict-typing-unknown-prop-guard
plan: "01"
subsystem: testing
tags: [dev-seed, negative-control, zod, typescript, tsconfig, turborepo, supabase, seed-cli, vitest]

requires:
  - phase: 143-svelte-store-guard-app-wide-reach-fallout-triage
    provides: "SC-2 — the rows-first ordering rule turned into a property of the commit graph; the 9-column register schema; the ⚠ INVERSION section convention"
  - phase: 142.1-oidc-hardening
    provides: "D-20 — OLD and NEW halves legitimately carry different HEADs"
provides:
  - "144-NEGATIVE-CONTROL-LEDGER.md, opened with all 37 register rows written and 185 placeholder cells, in a commit that precedes every measurement in the phase"
  - "17 of those rows measured on the untouched tree: A, T1-OLD, T2-OLD, G-OLD, X-OLD, P, Z1-OLD..Z4-OLD, DRV-OLD, K-OLD, V-OLD, F, R1-OLD, R2-OLD, DENY-OLD"
  - "Three committed negative-control seed fixtures, reused byte-identically by 144-04"
  - "The criterion-5 fallout survey as four measured numbers under four named allow-list compositions"
  - "The pre-existing tsconfig-widening error inventory, verbatim, with the concrete fix 144-02 applies to each"
  - "Six residue findings, two of which change what 144-03 and 144-04 must do"
affects: [144-02, 144-03, 144-04, 144-05, 144-06, 144-07]

actuals:
  tokens: 19225
  tasks: 4
  commits: 8

tech-stack:
  added: []
  patterns:
    - "Evidence-log wrapper: a provenance envelope (row id, cwd, HEAD, ISO timestamps, verbatim command, exit code) around each command's combined output, so a clean run still produces a non-empty log"
    - "Apparatus control paired with each blindness claim: the byte-identical injection placed where the instrument DOES see it, proving the green is discriminating rather than vacuous"
    - "Fixtures committed before their own OLD half runs, making 'the halves differ only by the tree' a commit-graph property"

key-files:
  created:
    - .planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md
    - packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts
    - packages/dev-seed/tests/fixtures/negctl-questions-answers.ts
    - packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts
  modified: []

key-decisions:
  - "Half-row register schema, 37 rows, asserted in the ledger's own Completeness framing rather than assumed"
  - "Row X labelled a self-control pair (directive present vs offending row deleted), not an old-tree/new-tree pair"
  - "Row K labelled the phase's one INVERTED pair, with its red recorded as the success signal"
  - "Composition (4) of the fallout survey measured BOTH ways — bare forms removed from every source (76) and from the sentinel source only (0) — because the two sources overlap"
  - "Teardown runs as `yarn db:seed:teardown --prefix negctl144-`; the bare command defaults to `seed_` and would have been a silent no-op"

patterns-established:
  - "Restore-and-prove: git diff --exit-code + git hash-object against a header blob + a find over the probe glob + git log showing the edit never reached history"
  - "A row whose only evidence is an exit code is void; live-DB rows carry a SQL result"

requirements-completed: [TMPL-01, TMPL-02, ASSERT-04]

coverage:
  - id: D1
    description: "144-NEGATIVE-CONTROL-LEDGER.md exists with all 37 rows written and every measurement cell placeholdered, in a commit preceding every measurement in the phase"
    requirement: "ASSERT-04"
    verification:
      - kind: integration
        ref: "git merge-base --is-ancestor 61209c9ff HEAD; git show 61209c9ff --stat"
        status: pass
      - kind: integration
        ref: "row-ID grep over the register => 37 rows; placeholder grep at commit 61209c9ff => 185"
        status: pass
    human_judgment: false
  - id: D2
    description: "Truth #1 OLD half — both D-01 exemplars (elections._constituencies, candidates._elections) compile clean, 0 diagnostics, under today's Template"
    requirement: "TMPL-01"
    verification:
      - kind: integration
        ref: "npx tsc --noEmit -p packages/dev-seed/tsconfig.json (logs tc-T1-OLD-1.log, tc-T2-OLD-1.log)"
        status: pass
      - kind: integration
        ref: "apparatus control tc-apparatus-ctrl-1.log — same command exits 2 with TS2322 on a src/ error"
        status: pass
    human_judgment: false
  - id: D3
    description: "Truth #2 OLD half — the narrow dev-seed tsconfig is blind to a deliberate tests/ type error (exit 0), and the @ts-expect-error fixture's present-arm is silent under a temporary widening"
    requirement: "TMPL-01"
    verification:
      - kind: integration
        ref: "npx tsc --noEmit -p packages/dev-seed/tsconfig.json (logs tc-G-OLD-1.log, tc-P-before-1.log)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Truth #3 OLD half — both D-08 fixture classes and the D-09 control complete at exit 0 through the real seed CLI with the key provably absent from the database"
    requirement: "TMPL-02"
    verification:
      - kind: e2e
        ref: "yarn db:seed --template <abs> (logs seed-R1-OLD-1.log, seed-R2-OLD-1.log, seed-DENY-OLD-1.log)"
        status: pass
      - kind: integration
        ref: "psql proofs (logs sql-R1-OLD-1.log, sql-R2-OLD-1.log, sql-DENY-OLD-1.log)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Truth #4 OLD half — all four blind zod sites still pass with their declaration removed from the schema"
    requirement: "ASSERT-04"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts + tests/template/latent.schema.test.ts under transient schema deletions (logs vt-Z1-OLD-1.log .. vt-Z4-OLD-1.log)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Criterion 4 OLD half — a reconstructed parallel-list shape accepts a pair the resolver provably never reads and stays green"
    verification:
      - kind: unit
        ref: "tests/__probe144/drv-old.test.ts (log vt-DRV-OLD-1.log)"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-03a OLD half (INVERTED) — a pre-resolution keying sends the camelCase-collection case RED, which is the success signal"
    verification:
      - kind: unit
        ref: "tests/__probe144/k-old.test.ts (log vt-K-OLD-1.log) => 3 failed | 2 passed, case 1 red"
        status: pass
    human_judgment: false
  - id: D8
    description: "D-07 OLD half — resolveTemplate returns a built-in carrying an unknown top-level key unvalidated"
    verification:
      - kind: unit
        ref: "tests/__probe144/v-old.test.ts (log vt-V-OLD-1.log)"
        status: pass
    human_judgment: false
  - id: D9
    description: "Criterion 5 fallout survey — 30 built-ins, 1,481 rows, 11,125 key occurrences, four rejection counts under four named allow-list compositions"
    verification:
      - kind: integration
        ref: "GSD144_ROOT=$(pwd -P) npx tsx $TMPDIR/gsd-144/survey-F.mts (log survey-F-1.log)"
        status: pass
    human_judgment: false
  - id: D10
    description: "Row P — the pre-existing tsconfig-widening errors recorded verbatim with a named fix for each"
    verification:
      - kind: integration
        ref: "tc-P-before-1.log => exactly 3 error TS lines at the predicted files/lines/columns"
        status: pass
    human_judgment: false
  - id: D11
    description: "Zero product bytes changed, working tree byte-identical to HEAD across packages/, apps/, tests/ and the repo root at plan close"
    verification:
      - kind: integration
        ref: "git diff --exit-code HEAD -- packages/dev-seed/src packages/dev-seed/tsconfig.json package.json turbo.json .github"
        status: pass
      - kind: integration
        ref: "git hash-object on tsconfig.json and schema.ts == header blob hashes; find -name '__probe144*' empty"
        status: pass
    human_judgment: false
  - id: D12
    description: "The three negctl fixtures are correct, inert and reusable byte-identically by 144-04 — including the judgment that their shape genuinely isolates the intended drop"
    verification:
      - kind: e2e
        ref: "seed-R1-OLD-1.log reports constituency_groups 0, verifying research assumption A5 before the row was recorded"
        status: pass
    human_judgment: true
    rationale: "Whether each fixture isolates its intended drop cleanly — rather than merely running green — is a design judgment about the control's construction. 144-04 depends on these files being right; a reviewer should read them before the NEW halves are measured against them."

duration: 96 min
completed: 2026-08-23
status: complete
---

# Phase 144 Plan 01: Open the negative-control ledger and measure every blind half Summary

**A 37-row negative-control register opened before its first measurement existed, then 17 of its rows filled on an untouched tree — proving the seed-template guard blind fourteen different ways, including one deliberately inverted control, before a single byte of the guard is written.**

## Performance

- **Duration:** 96 min (spanning one API interruption; resumed from disk state)
- **Started:** 2026-08-23T10:24:00Z
- **Completed:** 2026-08-23T14:24:00Z
- **Tasks:** 4
- **Files created:** 4 (1 ledger, 3 fixtures) — **0 files modified**

## Accomplishments

- **The ordering property is real, not asserted.** `61209c9ff` contains the ledger with all 37 rows and **185** placeholder cells and **zero** measurements. Every later measurement commit is a descendant (`git merge-base --is-ancestor 61209c9ff HEAD` → pass). Truth #1 is a fact about the commit graph.
- **All 14 OLD halves measured here.** Nothing inherited from an earlier phase, nothing copied from `144-RESEARCH.md`. Each row carries its own log path and the HEAD it was taken at.
- **Every blindness claim is paired with an apparatus control.** The strongest is `G-OLD`: the *byte-identical* statement `export const notANumber: number = 'definitely not a number';` exits **2** with `TS2322` from `src/` and is **silent** from `tests/`. Same compiler, same config; only the directory differs.
- **The fallout survey reproduced all four priors exactly** and surfaced one the research did not contain.
- **Three inert fixtures committed before their own measurements**, so `144-04`'s NEW halves differ from these runs only by the tree.

## Task Commits

1. **Task 1 — open the ledger, 37 rows, all placeholdered** — `61209c9ff` (docs)
2. **Task 1 — measure row A, the restoration target** — `829ccf979` (docs)
3. **Task 2 — rows T1-OLD, T2-OLD, G-OLD, X-OLD, P** — `f2cb118b4` (docs)
4. **Task 3 — rows Z1-OLD…Z4-OLD, DRV-OLD, K-OLD, V-OLD, F** — `371ddf6fe` (docs)
5. **Task 4 — the three negctl fixtures** — `6ec3de9ac` (test)
6. **Task 4 — fixture correction: unprefix authored external_ids** — `917dbebd3` (fix)
7. **Task 4 — fixture correction: non-choice question type** — `865178479` (fix)
8. **Task 4 — rows R1-OLD, R2-OLD, DENY-OLD + residue** — `a9788ccd3` (docs)

## The seventeen rows, with the HEAD each was measured at

| Row | HEAD | Instrument | Exit | Cache verdict | Outcome |
|---|---|---|---|---|---|
| `A` | `61209c9ff` | turbo | 0 | `cache bypass, force executing` ×22 of 22 | RESTORATION TARGET — 22/22, 0 cached, 19.56 s |
| `T1-OLD` | `829ccf979` | tsc | 0 | `n/a — direct tsc` | GREEN (blind) — 0 diagnostics |
| `T2-OLD` | `829ccf979` | tsc | 0 | `n/a — direct tsc` | GREEN (blind) — 0 diagnostics |
| `G-OLD` | `829ccf979` | tsc | 0 | `n/a — direct tsc` | GREEN (blind) — 0 diagnostics |
| `X-OLD` | `829ccf979` + transient widening | tsc | 2 | `n/a — direct tsc` | GREEN — self-control present-arm, 0 diagnostics from the fixture |
| `P` | `829ccf979` + transient widening | tsc | 2 | `n/a — direct tsc` | PRE-EXISTING — exactly 3, verbatim |
| `Z1-OLD` | `f2cb118b4` | vitest | 1 | `n/a — vitest` | GREEN (blind) — `2 failed \| 9 passed (11)`, target site passed |
| `Z2-OLD` | `f2cb118b4` | vitest | 0 | `n/a — vitest` | GREEN (blind) — `11 passed (11)` |
| `Z3-OLD` | `f2cb118b4` | vitest | 0 | `n/a — vitest` | GREEN (blind) — `11 passed (11)` |
| `Z4-OLD` | `f2cb118b4` | vitest | 1 | `n/a — vitest` | GREEN (blind) — `3 failed \| 4 passed (7)`, target site passed |
| `DRV-OLD` | `f2cb118b4` | vitest | 0 | `n/a — vitest` | GREEN (blind) — `3 passed (3)` |
| `K-OLD` | `f2cb118b4` | vitest | **1** | `n/a — vitest` | **RED (catch) — ⚠ INVERTED, the red is the success signal** |
| `V-OLD` | `f2cb118b4` | vitest | 0 | `n/a — vitest` | GREEN (blind) — `3 passed (3)` |
| `F` | `f2cb118b4` | node | 0 | `n/a — node` | Fallout measured at zero under composition (1) |
| `R1-OLD` | `865178479` | seed-cli | 0 | `n/a — seed CLI` | GREEN (blind) — join table empty |
| `R2-OLD` | `865178479` | seed-cli | 0 | `n/a — seed CLI` | GREEN (blind) — no answers written |
| `DENY-OLD` | `865178479` | seed-cli | 0 | `n/a — seed CLI` | GREEN (blind) — `entity_type` NULL |

**13 green halves + 1 red (`K-OLD`).** Twelve carry the literal `GREEN (blind)`; `X-OLD` carries `GREEN — self-control present-arm` because its pair is directive-present vs row-deleted, not old-tree vs new-tree.

⚠ **A wording inconsistency inside the plan itself, resolved in favour of the executable spec.** The plan's `<success_criteria>` says *"13 OLD halves **GREEN (blind)**"*, but its own `<injection_register>` Expected column and Task 2's acceptance criterion both treat `X-OLD` as plain `GREEN` (the acceptance grep counts `GREEN (blind)` across `T1-OLD|T2-OLD|G-OLD` only, at exactly 3). The register and the acceptance criteria win, so 12 rows carry `GREEN (blind)` and `X-OLD` carries `GREEN — self-control present-arm`. Flagged rather than silently reconciled.

## Measurements against their priors

| Measurement | Research predicted | This run measured | Verdict |
|---|---|---|---|
| Row `A` baseline | 22/22, 0 cached | **22/22, 0 cached**, 19.56 s | **agrees** |
| Row `P` error count | exactly 3, at named lines | **exactly 3**, same files, same `line:column`, same TS codes | **agrees** |
| Survey — templates / rows | 30 / 1,481 | **30 / 1,481** | **agrees** |
| Survey composition (1) | 0 | **0** | **agrees** |
| Survey composition (2) | 2,955 | **2,955** | **agrees** |
| Survey composition (3) | 1,481 | **1,481** | **agrees** |
| Survey composition (4) | 76 | **76** | **agrees** |

**No disagreement to report on any row with a documented prior.** Every number above was nonetheless produced by a command run here, with its own log, not copied.

### Row P — the three pre-existing errors, as measured

```
packages/dev-seed/tests/determinism.test.ts(99,25): error TS2559
packages/dev-seed/tests/latent/latentEmitter.test.ts(122,35): error TS2493
packages/dev-seed/tests/templates/nominations-override.test.ts(83,13): error TS2352
```

Full verbatim text and the concrete fix `144-02` applies to each are in the ledger's `## Pre-existing tsconfig errors (row P)`. **`scripts/**/*` added zero diagnostics.** These are errors no gate has ever seen — `packages/dev-seed/tests/` has sat outside its own package's tsconfig `include` since `4fc1abb2d` — and none is caused by this phase.

### The three database query results proving the drops

- **`R1-OLD`** — `select count(*) from election_constituency_groups ecg join elections e on e.id=ecg.election_id where e.external_id='negctl144-el-1'` → **0**. Whole-DB `election_constituency_groups=0`, `constituency_group_constituencies=0`. Election row present, `custom_data=NULL`. Research assumption **A5 verified before the row was recorded**: the run summary reports `constituency_groups 0`, so `attachSentinels` did not fan out and the empty join table is the drop, not an artefact.
- **`R2-OLD`** — question row created and FK-resolved (`category_id=c23d0681-…`); non-null column list carries **no trace** of the key; rows with a non-empty `answers` object: **candidates 0, organizations 0**; **0** rows anywhere mention `negctl144-cand-does-not-exist`.
- **`DENY-OLD`** — `select entity_type from questions where external_id='negctl144-qu-1'` → **NULL**, although the fixture supplied `'candidate'`. The column is real and nullable (`type=jsonb is_nullable=YES`), so NULL is a genuine discard.

### Restore assertions, verbatim

```
git diff --exit-code -- packages/dev-seed/tsconfig.json            -> exit 0
git hash-object packages/dev-seed/tsconfig.json                    -> 7fba879dc6f4976b43646d8388401742a8aa7131   (== header)
git hash-object packages/dev-seed/src/template/schema.ts           -> a65a33f7f4049a35bf33ffc7ba5c67955be73ac2   (== header)
find packages/dev-seed -name '__probe144*' -not -path '*/node_modules/*'  -> (no matches)
git status --porcelain -- packages apps tests                      -> (empty)
git log --oneline -1 -- packages/dev-seed/tsconfig.json            -> 4fc1abb2d  (a Phase-56 commit — the widening never reached history)
git diff --exit-code HEAD -- packages/dev-seed/src packages/dev-seed/tsconfig.json package.json turbo.json .github -> exit 0
```

**Resolved `$TMPDIR`:** `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T` — every `${TMPDIR:-/tmp}/gsd-144/…` reference resolves there. **21 logs, 0 empty.**

**Loop discipline:** every injection was created, measured and reverted inside its own iteration, with a pre-gate before and a post-gate after. No commit was taken while any injection was live — the two `fix(144-01)` commits are fixture corrections taken on a clean tree, not mid-injection. **No product byte changed.**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A clean `tsc` run produces an empty log, which the plan's own acceptance check rejects**
- **Found during:** Task 2 (row `T1-OLD`)
- **Issue:** The plan specifies `<INSTRUMENT COMMAND> > "<log>" 2>&1` and separately asserts `test -s "<log>"`. `tsc` prints nothing on success, so the first passing row produced a zero-byte log and the criterion was unsatisfiable for exactly the outcome the row expects.
- **Fix:** Added `${TMPDIR:-/tmp}/gsd-144/runrow.sh`, a wrapper that brackets the command's combined output with a provenance envelope — row id, cwd, HEAD, ISO start/finish timestamps, the verbatim command and the exit code. This makes the log better evidence, not merely non-empty. `tc-A-1.log` was left as raw turbo output, already taken and self-describing.
- **Files modified:** none in-repo (the wrapper lives outside the repository)
- **Verification:** all 21 logs non-empty; `T1-OLD` re-run in full (inject → measure → revert) rather than patched
- **Committed in:** n/a — no repository file involved

**2. [Rule 1 - Bug] `externalIdPrefix` is applied to hand-authored `fixed[]` rows, so the fixtures produced doubled ids**
- **Found during:** Task 4 (row `R1-OLD`, first attempt)
- **Issue:** The election landed as `negctl144-negctl144-el-1`. `template/types.ts:23` says the prefix is *"prepended to every generator-emitted `external_id`"*; in fact every generator does ``external_id: `${externalIdPrefix}${fx.external_id}` `` (e.g. `ElectionsGenerator.ts:43-45`) for fixed rows too. Left uncorrected, the sentinel reference would also have failed to name a real row, making the drop unobservable for the wrong reason.
- **Fix:** Authored ids unprefixed (`el-1`, `co-1`, `qc-1`, `qu-1`); sentinel and relationship references keep the final prefixed form because they resolve against rows already in the database. Each fixture states the trap in its header so `144-04` cannot re-introduce it.
- **Files modified:** all three fixtures
- **Verification:** `select external_id from elections` → `negctl144-el-1`
- **Committed in:** `917dbebd3`

**3. [Rule 1 - Bug] The three choice question types are rejected without a `choices` array**
- **Found during:** Task 4 (row `R2-OLD`, first attempt)
- **Issue:** `bulkImport failed: Choice-type question must have a choices array (type: singleChoiceOrdinal)` — `103-questions.sql:77-84`.
- **Fix:** Both question fixtures use `type: 'text'`, with the reason inline. A choices array is irrelevant noise for what these fixtures control for.
- **Files modified:** `negctl-questions-answers.ts`, `negctl-questions-entity-type.ts`
- **Verification:** both rows seeded at exit 0
- **Committed in:** `865178479`

**4. [Rule 3 - Blocking] `yarn db:seed:teardown` defaults to `seed_` and is a silent no-op for any other prefix**
- **Found during:** Task 4
- **Issue:** `cli/teardown.ts:211` is `const prefix = values.prefix ?? 'seed_';`. The plan's bare `yarn db:seed:teardown` would have cleared nothing for a `negctl144-` fixture, leaving each half to run against the previous half's rows — precisely the contamination research open risk #6 warns about.
- **Fix:** Every teardown ran as `yarn db:seed:teardown --prefix negctl144-`, recorded verbatim. Confirmed effective (2 rows deleted between each half; 0 `negctl144-` rows remain at plan close).
- **Files modified:** none
- **Verification:** post-teardown counts all 0
- **Committed in:** n/a — recorded as **RES-3** in the ledger's Residue

**5. [Rule 3 - Blocking] The survey script needed `.mts`, not `.ts`**
- **Found during:** Task 3 (row `F`)
- **Issue:** Living outside any `package.json` with `"type": "module"`, tsx transformed the script as CJS and rejected top-level `await`.
- **Fix:** Renamed to `survey-F.mts`. The failed first invocation is stated in the ledger's survey section rather than hidden.
- **Files modified:** none in-repo
- **Committed in:** n/a

**6. [Rule 2 - Missing critical] An apparatus control for the `tsc` instrument, not specified by the plan**
- **Found during:** Task 2
- **Issue:** `T1-OLD` completed in ~1 s with zero output. A green from an instrument that silently did nothing is indistinguishable from a real blindness, and the plan specified no control for this.
- **Fix:** Added `packages/dev-seed/src/__probe144_ctrl.ts` with a deliberate error under `src/`; the same command exited **2** with `TS2322`. This control then did double duty as the discriminating half of `G-OLD`, whose injection is byte-identical.
- **Files modified:** none durable (probe removed in-iteration)
- **Verification:** `tc-apparatus-ctrl-1.log`
- **Committed in:** n/a — recorded in the `T1-OLD` and `G-OLD` outcome cells

**7. [Rule 2 - Missing critical] Composition (4) of the fallout survey measured both ways**
- **Found during:** Task 3 (row `F`)
- **Issue:** Composition (4) as specified is ambiguous, and the two readings differ by 76.
- **Fix:** Measured both. Removing the 3 bare forms from **every** source → **76**; from the **sentinel source only** → **0**, because `COLLECTION_NON_COLUMNS` supplies the same two pairs. Recorded as **RES-1**: `144-03`'s derivation test must assert the bare pairs against `LINK_SENTINELS` *specifically*.
- **Committed in:** `371ddf6fe`

---

**Total deviations:** 7 auto-fixed (2 Rule 1 bugs, 3 Rule 3 blockers, 2 Rule 2 missing-critical).
**Impact on plan:** No scope creep — zero product bytes changed, exactly as the plan requires. Deviations 1, 5 and 6 concern evidence integrity, which is this plan's entire subject. Deviations 2 and 3 were caught by measurement **before any ledger row was recorded**, so no row was ever written against a broken fixture. Deviation 4 prevented cross-half database contamination.

## Issues Encountered

- **The session was interrupted by an API error mid-Task-3** (host sleep). No work was lost: three commits had landed, and the seven Task-3 vitest logs were on disk with their HEAD stamps intact. On resume, disk state was re-read and every prior measurement re-verified from its log before anything new was written — no cell was filled from recollection. Task 1 and Task 2 were confirmed already correct and were not re-done.
- **`R1-OLD` and `R2-OLD` were each run more than once** because of deviations 2 and 3. Only the final runs, all at HEAD `865178479` with teardown between them, are recorded. Earlier attempts wrote no ledger cell.

## Known Stubs

None. This plan ships no product code, so there is nothing to stub. The 20 remaining placeholder cells are the six later plans' rows and are the plan's intended output, not incompleteness.

## Threat Flags

None. This plan introduces no network endpoint, auth path, file-access pattern or schema change. The three seed runs used the existing service-role path with no new surface; the service-role key is read from the root `.env` and is not echoed by the CLI or present in any log.

## User Setup Required

None.

## Next Phase Readiness

**Ready for `144-02`.** The blind record it must invert is complete and committed, and its own row `P` after-half and rows `T1-NEW` / `T2-NEW` are the next cells to clear.

**Three things `144-02` … `144-04` must not rediscover:**

1. **RES-1** — `144-03`'s derivation test must assert the 3 bare sentinel pairs against `LINK_SENTINELS` **specifically**. Asserting against the union of the four sources cannot see a regression that empties them, because `COLLECTION_NON_COLUMNS` supplies the same pairs (measured: 0 vs 76).
2. **RES-3** — `144-04` must run `yarn db:seed:teardown --prefix negctl144-`. The bare command is a silent no-op for these fixtures.
3. **RES-2** — the fixtures' authored `external_id`s are unprefixed **deliberately**. Re-adding the prefix produces `negctl144-negctl144-el-1` and breaks the sentinel reference. Each fixture's header says so.

**One caution.** The three fixtures must be reused **byte-identically at byte-identical paths**. That property is what makes each pair a control; editing a fixture between halves silently converts the pair into two unrelated runs.

## Self-Check: PASSED

All four created files verified present on disk. All eight commit hashes verified in `git log`. Plan-level verification: 37 rows, 100 placeholders remaining, 0 borrowed-observation words, 0 cache-replay verdicts, 12 `GREEN (blind)` + 1 self-control green + 1 inverted red, 3 live-DB rows carrying SQL results, zero product bytes, clean tree, both restoration blob hashes matching their header values, ledger commit an ancestor of HEAD, 21 non-empty logs.

---
*Phase: 144-seed-template-strict-typing-unknown-prop-guard*
*Completed: 2026-08-23*
