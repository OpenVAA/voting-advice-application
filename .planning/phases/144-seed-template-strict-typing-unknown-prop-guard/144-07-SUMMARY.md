---
phase: 144-seed-template-strict-typing-unknown-prop-guard
plan: "07"
subsystem: testing
tags: [dev-seed, playwright, e2e, turbo, typescript, zod, negative-control, ledger, record-correction]

requires:
  - phase: 144-01
    provides: the 37-row ledger opened before the first measurement, all 17 OLD halves, the fallout survey (row F) and the pre-existing error inventory (row P)
  - phase: 144-02
    provides: the four-source derived allow-list, the per-collection row types, the widened dev-seed tsconfig, rows T1-NEW/T2-NEW
  - phase: 144-03
    provides: linkJoinTables iterating LINK_SENTINELS through planLinks, the derivation spec, rows DRV-NEW and L
  - phase: 144-04
    provides: Pass 0 assertKnownRowProps, the deny-list, rows R1-NEW/R2-NEW/K-NEW/DENY-NEW/NC, and the measured EPC boundary table
  - phase: 144-05
    provides: .strict() on TemplateSchema and perEntityFragment, built-in validation, rows Z1-NEW..Z4-NEW/V-NEW/AF/NA, the 4+3+3 corpus census, record target R-6
  - phase: 144-06
    provides: turbo run typecheck chained into root lint:check and CI, rows G-NEW and X-NEW
provides:
  - Seven gates green at ONE HEAD (47ee50054) with the full Playwright suite last at 135 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run
  - Ledger rows C (restore proof, both probe glob forms) and Z (closing revert reproducing row A) — register placeholder count now 0 across all 37 rows
  - The criterion-5 fallout table shipped EMPTY WITH DISCHARGE, sourced from both row F and row NC, with the three would-be-fallout classes and their dispositions
  - "## Final counts — every number this phase states anywhere, derived once"
  - "## Completeness — the 14x2+9=37 arithmetic asserted against the register's measured row count"
  - "## Record targets — R-1..R-6, each with its measured location and what makes the correction true"
  - Six record corrections applied IN PLACE (ROADMAP, REQUIREMENTS x2, the fake-guard sweep audit, the 2026-05-31 todo, R-6 verified)
  - Evidence clauses for TMPL-01, TMPL-02 and ASSERT-04, and the three checkbox flips taken AFTER the gates
  - Six standing residue todos, each carrying a measurement; the 2026-05-23 fan-out todo left open and annotated
affects: [145-default-seed-template-repair, milestone-v2.15-close, gsd-ship]

actuals:
  tokens: 118000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "An empty result ships as a DISCHARGE — counts, verbatim command and HEAD — never as a blank section, because a blank section cannot be distinguished from a survey nobody ran"
    - "Every count is derived ONCE in the ledger's ## Final counts and cited by every downstream artifact; no document re-derives a number for itself"
    - "A void measurement is disclosed with its root cause and its log preserved, never deleted"
    - "A record correction names the commit or measurement that makes it true, and cites a commit by hash AND real subject when the subject does not mention the file it changed"
    - "A plan criterion that rests on a misreading is REPORTED, not obeyed — obeying it would corrupt the artifact"

key-files:
  created:
    - .planning/todos/pending/2026-08-23-package-tests-outside-tsconfig-include.md
    - .planning/todos/pending/2026-08-23-dev-seed-lint-script-covers-only-src.md
    - .planning/todos/pending/2026-08-23-column-map-organization-id-collision.md
    - .planning/todos/pending/2026-08-23-bulk-upsert-rpc-interpolates-column-identifiers.md
    - .planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md
    - .planning/todos/pending/2026-08-23-build-gate-cache-replay-is-not-a-measurement.md
    - .planning/todos/completed/2026-05-31-edit-the-seed-utility-to-use-strict-typing-for-the-templates.md
  modified:
    - .planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/audits/2026-08-11-fake-guard-sweep.md
    - .planning/todos/pending/2026-05-23-remove-automatic-sentinel-fan-out-from-dev-seed-pipeline.md
    - .planning/WINDOWS.md

key-decisions:
  - "Gate 4 was re-taken under TURBO_FORCE because the verbatim `yarn build` returned 14/14 CACHED — a replayed exit code is a claim about a previous tree, and the ledger's own rule 3 forbids recording it as a measurement. The cached run is preserved as disclosure rather than deleted."
  - "The two void gate-7 attempts are disclosed with root causes and their logs kept. Neither is a phase-144 code defect and neither is a Pass 0 false positive; no test was retried to green and none was annotated as flaky."
  - "The plan's requirement that the REQUIREMENTS rollup row's `plan count` read 7 was REPORTED rather than obeyed: that column's header is `| Phase | Requirements | Count |` and it counts requirements. Phase 144 has three, so 3 is correct and was left alone."
  - "The retired template identifier was removed from the ROADMAP entirely (the acceptance grep requires zero occurrences) and its full citation — including the commit subject that contains the name — moved to the ledger's § Record targets, so the stale name survives exactly once, in the record explaining why it is stale."
  - "The `git status --porcelain` assertion is stated against the verbatim output — one untracked line, the gsd-tools session lock — and the lock is NAMED rather than filtered silently."

patterns-established:
  - "Gate ordering: db:reset belongs AFTER the unit gate and immediately before the E2E gate, because `yarn test:unit` itself repopulates the live local database"
  - "Forced-cache discipline extends to `build`, not just `lint` and `typecheck`"

requirements-completed: [TMPL-01, TMPL-02, ASSERT-04]

coverage:
  - id: D1
    description: "Seven gates green at one HEAD, E2E last, under db:reset and exactly one fresh dev server started and stopped by this plan"
    requirement: "TMPL-01"
    verification:
      - kind: e2e
        ref: "yarn test:e2e — 135 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run (gate-e2e-1.log)"
        status: pass
      - kind: integration
        ref: "yarn test:unit — 25/25 turbo tasks, 171 files, 1788 tests (gate-unit-1.log)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check / yarn format:check / TURBO_FORCE=true yarn build / yarn workspace @openvaa/frontend check / TURBO_FORCE=true npx turbo run typecheck — all exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Rows C and Z complete; the 37-row register carries zero placeholders, zero borrowed observations and zero cache replays"
    verification:
      - kind: other
        ref: "grep -cE '<37-row anchored pattern>' 144-NEGATIVE-CONTROL-LEDGER.md -> 37; placeholder/cited/replaying counts over those rows -> 0/0/0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The criterion-5 fallout table ships empty WITH discharge — 30 templates / 1,481 rows / 11,125 key occurrences / 0 unknown keys, from both row F and row NC, plus the three would-be-fallout classes with dispositions"
    requirement: "TMPL-02"
    verification:
      - kind: other
        ref: "144-NEGATIVE-CONTROL-LEDGER.md § Fallout table (criterion 5 / D-10) — both source rows named, both commands verbatim"
        status: pass
    human_judgment: false
  - id: D4
    description: "Six record targets corrected in place, each naming the commit or measurement that makes it true; 4aeae0ace cited by hash and real subject"
    verification:
      - kind: other
        ref: "Task 3 <verify> block — roadmap subject present, retired name 0, audit stale figure 0, todo retired, R-1..R-6 in § Record targets"
        status: pass
    human_judgment: false
  - id: D5
    description: "Evidence clauses for TMPL-01 / TMPL-02 / ASSERT-04 in the ASSERT-08/09 house shape, with the checkboxes flipped only after the gates ran"
    requirement: "ASSERT-04"
    verification:
      - kind: other
        ref: "grep for '^- \\[x\\] \\*\\*(TMPL-01|TMPL-02|ASSERT-04)\\*\\*' with NEGATIVE-CONTROL-LEDGER named -> 3; ASSERT-04 stale 'the six' -> 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "The answersByExternalId permission fix turns a previously-silent field drop into a hard seed failure — the phase's intent, but a change in how a malformed template behaves at seed time"
    verification: []
    human_judgment: true
    rationale: "144-04 coverage D10 already routed this to a human (broken-windows entry 53). This plan recorded it prominently in the ledger's residue table and in TMPL-02's evidence clause as a behavioural change rather than a footnote, but the contract question — is a hard failure the intended behaviour for a field that used to be dropped silently — is still the operator's to confirm."
  - id: D7
    description: "The new named type-check CI step blocks a merge"
    verification: []
    human_judgment: true
    rationale: "Asserted present, ordered and locally green by 144-06, but no GitHub Actions run has executed it. Only a real CI run proves the gate blocks. Standing as broken-windows entry 55; this plan cannot discharge it locally."

duration: 79 min
completed: 2026-08-23
status: complete
---

# Phase 144 Plan 07: Phase Close Summary

**Seven gates green at one HEAD with the full Playwright suite last at 135/0/0/0/0, the 37-row register closed at zero placeholders, criterion 5's zero shipped as a discharge rather than a blank section, and six stale records corrected in place with the commit or measurement that makes each true.**

## Performance

- **Duration:** 79 min
- **Started:** 2026-08-23T16:46:00Z
- **Completed:** 2026-08-23T18:05:00Z
- **Tasks:** 3
- **Files modified:** 13 (6 modified, 7 created)

## Accomplishments

- **The full E2E suite ran and passed** — the measurement four earlier plans deferred and one of them mis-assigned. Root-caused and fixed a gate-ordering defect that had produced a red suite, without changing a byte of source.
- **The register is closed**: rows `C` and `Z` written, placeholder count 0 across all 37 rows, zero borrowed observations, zero cache replays.
- **Criterion 5's zero ships as a discharge** carrying its counts, its verbatim commands and both source HEADs, plus three would-be-fallout classes with dispositions so the section has content.
- **Every count derived once** in `## Final counts` and cited — never re-derived — by the ROADMAP, REQUIREMENTS, the audit and the retired todo.
- **Six records corrected in place**, and one plan criterion **reported rather than obeyed** because obeying it would have corrupted a table.
- **Six standing todos filed**, each carrying a measurement rather than a description; two of them are defects this plan's own gates found.

## The single closing HEAD

**`47ee50054`**, recorded once before gate 1 and asserted unchanged after gate 7 and after row `Z`. No source file was edited and no commit was made between gate 1 and row `Z`. The three commits below are documentation only, and `.planning/` is in `.prettierignore`, so no gate can be invalidated by them.

## The seven gates

| # | Gate | Command, verbatim | Exit | Counts | Log |
|---|---|---|---|---|---|
| 1 | unit | `yarn test:unit` | **0** | 25/25 tasks · 11 workspaces · 171 files · **1,788** tests · 0 failed. `dev-seed` 525, `frontend` 814, `data` 244. All 11 `test:unit` tasks forced (`cache: false`); the 10 cached tasks are all `build` | `gate-unit-1.log` |
| 2 | lint | `TURBO_FORCE=true yarn lint:check` | **0** | 0 errors · 20 pre-existing warnings · **33** forced verdict lines · **0** replays. Full chain, not a short-circuit — all four links visible | `gate-lint-1.log` |
| 3 | format | `yarn format:check` | **0** | 0 unformatted files | `gate-format-1.log` |
| 4 | build | `TURBO_FORCE=true yarn build` | **0** | 14/14 · `0 cached, 14 total` · 14 forced verdicts | `gate-build-1.log` |
| 5 | frontend typecheck | `yarn workspace @openvaa/frontend check` | **0** | 2,684 files · 0 errors · 0 warnings | `gate-svelte-check-1.log` |
| 6 | repo typecheck | `TURBO_FORCE=true npx turbo run typecheck` | **0** | 22/22 · `0 cached, 22 total` · `grep -c 'error TS'` → 0 | `gate-typecheck-1.log` |
| 7 | **E2E, last** | `yarn test:e2e` | **0** | **135 passed · 0 failed · 0 flaky · 0 skipped** — and **0 did not run** | `gate-e2e-1.log` |

All logs resolve under `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-144/`.

**Gate 7's preconditions, both discharged and both read from the run's own output rather than assumed.** `yarn db:reset` exited 0 immediately before the run, leaving `elections=0 · questions=0 · nominations=0 · candidates=1 · projects=1` and 2 storage buckets — the single candidate is `apps/supabase/supabase/seed.sql:96`'s bootstrap row, not residue. Exactly one dev server (pid 19340, `[::1]:5173`), started by this plan and confirmed gone after. The preflight verdict is in the log verbatim: `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)`.

## Gate 4 — disclosed rather than quietly upgraded

The plan's verbatim command is `yarn build`. It was run first and exited 0 — at **`Cached: 14 cached, 14 total`**, every task a cache replay. `turbo.json` gives `build` no `"cache": false`, exactly like `lint` and `typecheck`; D-06b anticipated that hazard for those two and named the `--force` trap, but **no plan in this phase forces `build`**. Under the ledger's own rule 3 a replayed exit code is a claim about a *previous* tree, so the gate was re-taken forced. The cached run is preserved at `gate-build-1-cached.log`. Filed as residue RES-16.

## Gate 7 — one red, root-caused, and it was mine

**Attempt 1 came back `8 failed · 79 did not run · 48 passed`, exit 1.** Under CLAUDE.md's cardinal rule that is a hard stop, and it was treated as one.

**Root cause, measured rather than guessed.** I ran `yarn db:reset` *before gate 1* — and **gate 1 itself repopulates the live local database**. `packages/dev-seed/tests/integration/default-template.integration.test.ts` calls `runTeardown` at **line 191 only, inside `beforeAll`**: it is a pre-test cleanup with no post-test counterpart. It ran in gate 1 (7,808 ms) and left the whole `default` template behind — `elections=1 · question_categories=4 · questions=26 · candidates=328 · nominations=377`, all on the `seed_` prefix that is `templates/default.ts:39`'s `externalIdPrefix`. `grep -c 'seed_cand_' apps/supabase/supabase/seed.sql` → **0**, so `seed.sql` is not the source.

The failures are exactly what that predicts, and none of them looks like a seeding problem: `eperm07-term-trigger` read the category heading as `Economy & Taxation  7 questions` — a `default` category — where it expected the Base opinion category, and `voter-journey` found **2** constituency comboboxes where it expected **1**.

`git log d2ffc3904..HEAD` on that test shows only `3ab2ecc93`, a +24-line operation-budget addition. **The pre-test-only teardown shape is pre-existing and untouched by this phase.**

**Verdict: an apparatus defect in the gate ORDER, not a Pass 0 false positive and not a phase-144 code defect.** Fixed by re-ordering to gates 1-6 → `db:reset` → gate 7. **No source change, no commit, HEAD unchanged**, so gates 1-6 remained valid and were not re-run.

**Attempt 2 was void for a duller reason** — my own 10-minute harness timeout killed the runner at `[104/135]` with **0** failure blocks. Re-launched detached; it completed in 10.4 m.

Both void logs are **preserved**, following `144-05`'s precedent with its mis-injected `Z4-NEW` iteration 0. **No test was retried to green, none was annotated as flaky, and the recorded gate 7 is a single clean run of the whole suite — not a best-of.**

Filed as residue RES-15 and as a standing todo, because it will cost the next person the same full suite run.

## Row `C` — five assertions, each taken twice

Taken once before gate 1 and once after gate 7:

1. **`git status --porcelain`** prints exactly one line both times: `?? .planning/milestone.lock`, an untracked gsd-tools session lock for the run executing this plan. Named rather than filtered silently; excluding it the count is **0**.
2. **`git diff --exit-code HEAD`** → exit **0**.
3. **The probe `find`, in BOTH glob forms** — `-name '__probe144*'` → **0** and `-type d -name '__probe144'` → **0**. Both are run because a single glob can be blind to one of the two shapes this phase used, the gap Phase 143 found in its inherited pattern.
4. **Restoration blob hashes.** All nine header paths **moved**, and every move traces to a named commit via `git log d2ffc3904..HEAD -- <path>`: `tsconfig.json`←`7a6c34f35` · `supabaseAdminClient.ts`←`edf06ea8a`,`3ab2ecc93` · `pipeline.ts`←`4bd038701` · `writer.ts`←`58a6d3a48` · `template/schema.ts`←`7ca1a260d`,`5490b9b4b` · `template/types.ts`←`7ca1a260d` · `cli/resolve-template.ts`←`f0228e55e` · `package.json` and `.github/workflows/main.yaml`←`9beaac244`. ⚠ **Stated plainly:** the header table lists exactly the files the phase *intended* to edit, so it contains no did-not-intend-to-change path whose hash could be asserted equal. Nine moved, nine accounted for, zero unexplained — weaker than an equality, and said so. **One equality is available and is the sharper witness:** `schema.ts`'s closing blob `6e575e6712766ef83d121c786add73324394ff9c` is byte-identical to what `144-05` restored to after each of its four injections.
5. **`git diff --exit-code -- packages/dev-seed/tests/fixtures`** → exit **0**: the three `negctl-*.ts` fixtures that make each pair a pair are byte-unchanged.

## Row `Z` — reproduces row `A` on all four numbers

`TURBO_FORCE=true npx turbo run typecheck` after gate 7, at the same HEAD: `Tasks: 22 successful, 22 total` · `Cached: 0 cached, 22 total` · **22** forced verdict lines · `grep -c 'error TS'` → **0**. Both benign turbo WARNINGs that row `A` declared part of the target are present, one occurrence each. **The task count did not differ from row `A`'s 22** — `144-06` chained the repo typecheck into the *root* `lint:check` and added a CI step, neither of which adds a turbo task — so the row's "state which and why" clause says it has nothing to record rather than leaving the reader to infer it.

## The fallout table's discharge

| | Row `F` (`144-01`, pre-change) | Row `NC` (`144-04`, post-change) |
|---|---|---|
| HEAD | `f2cb118b4` | `28b1663aa` |
| Templates surveyed | **30** | **30** |
| Emitted rows | **1,481** | **1,481** |
| Key occurrences classified | **11,125** | **11,125** |
| **Unknown keys** | **0** | **0** |
| Command | `GSD144_ROOT="$(pwd -P)" npx tsx "${TMPDIR:-/tmp}/gsd-144/survey-F.mts"` | `yarn workspace @openvaa/dev-seed test:unit tests/assertKnownRowProps.builtins.test.ts` |

**The two rows agree exactly, on all four figures and every per-collection subtotal.** There is no disagreement to report, and the agreement is itself the statement: the corpus did not move under the change, so the zero is a property of the allow-list composition rather than of a shrinking survey. Re-confirmed at the closing HEAD by parsing `BUILT_IN_TEMPLATES` — **30** entries.

**Given content by the three priced counterfactuals**, each NOT deleted and each with its reason: the RPC relationship references (**2,955** occurrences, 9 pairs — deleting them breaks every foreign key in every seeded dataset), the 3 bare sentinel forms (**76** occurrences, 2 pairs — both read by `linkJoinTables`), and `project_id` under a literally-seeded deny-list (**1,481** — the RPC re-supplies it from its own parameter, so generators are correct to emit it). **D-10's DELETE default and its E2E-red exception never fired.**

## `## Final counts` — the phase's canonical numbers

37 rows · 14 pairs · 28 measured halves · 9 non-pair rows · **37 of 37 measured in-phase, 0 borrowed** · 12 blind-to-catch pairs + **1 self-control** (`X`) + **1 inverted** (`K`, whose OLD half is red and the red is the success signal) · 2 must-NOT-fire rows (`L`, `NC`) · **10** sentinel pairs · **10** source-(4) relationship refs · 4 allow-list sources (3 derived, 1 parity-tested) · 1 deny-list entry · ASSERT-04 corpus **4 blind + 3 already-failable + 3 unfailable-by-construction = 10** · fallout **0** · seven gates as tabulated above.

`## Completeness` shows `14 × 2 + 9 = 37` and asserts it against the register's *measured* row count using the same anchored pattern the plans' verify blocks use → **37**. Placeholder count **0**; borrowed-observation word **0**; cache-replay verdict **0**.

## The six record corrections

| | File | Measured location | Was | Now | What makes it true |
|---|---|---|---|---|---|
| **R-1** | `ROADMAP.md` § Phase 144 | crit 1 `:667` · crit 3 `:669` · crit 5 `:671` · Plans `:673` · entries `:677-683` | crit 1's exemplar not illegal; crit 3 said six; crit 5 named a template gone since Phase 93; `6/7 plans executed`, plan 07 unticked | re-scoped to `_constituencies` on `elections` + `_elections` on `candidates`, stating `questions._elections` stays legal **and that row `L` asserts it**; `4+3+3=10`; `default`/`e2e/base`/`e2e/perm/*` + the discharge; `7 plans, all 7 executed` | `4aeae0ace` by hash **and** real subject ``feat(data): promote `required` to first-class Question field + wire consumers``, plus the sentence on what it did here; `d783e81fc`; `144-05`'s census; the seven summaries on disk |
| **R-2** | `REQUIREMENTS.md` ASSERT-04 | `:57` | "the six" | "the **four** structurally-blind", with the whole `4+3+3` composition and the statement that six is wrong **twice over** | `144-05`'s by-measurement census; rows `Z1-NEW`…`Z4-NEW`, `AF` (on the pre-phase blob, so non-circular), `NA` |
| **R-3** | `REQUIREMENTS.md` status + rollup | `:149`, `:157`, `:158`; rollup `:179`, header `:169` | three rows `Pending` | three rows `Complete`, three evidence clauses in the house shape | the seven gates at one HEAD. ⚠ **Rollup row NOT changed — see the finding below** |
| **R-4** | fake-guard sweep audit | row `:46` · section `:665` · pointer `:95-97` | both said 6; pointer said "Phase 144, open" | both **amended in place** to 4 blind with the census table inserted beneath the section's own file list; status `Blind — REMEDIATED, Phase 144`; pointer closed | `144-05`'s census; rows `Z1-NEW`…`Z4-NEW`, `AF`, `NA`, `V-OLD`/`V-NEW` |
| **R-5** | 2026-05-31 todo | moved `pending/` → **`completed/`** | named `templates/baseV1.ts`; cited `supabaseAdminClient.ts:126` and `:365`; premise already false | all three corrected in place with each correction annotated, plus a retirement-corrections header and a how-it-was-satisfied section | `d783e81fc`; **line citations RE-MEASURED** — `bulkImport` at `:122`, `linkJoinTables` at `:380` in a 746-line file; `4aeae0ace` + row `L` |
| **R-6** | `cli/resolve-template.ts` doc comment | annotation `:19-29`, validating return `:75` | asserted validation ran for every template — **false at every HEAD** since the built-in branch was added | sentence retained and annotated with a ⚠ block naming when it became true and what was false before | **Landed by `144-05` in `f0228e55e`. VERIFIED here, not re-done:** `grep -cE '^\s*return builtIn;'` → 0, `grep -c 'validateTemplate(builtIn)'` → 1 |

## ⚠ A plan criterion reported rather than obeyed

`144-07-PLAN.md` requires *"the Phase 144 rollup row's plan count is 7"*. **That rests on a misreading of the table.** The header at `REQUIREMENTS.md:169` is `| Phase | Requirements | Count |` — the third column counts the **requirements listed in column 2**, not plans. Every neighbouring row confirms it: Phase 141 lists 5 requirements and reads 5; Phase 143 lists 2 and reads 2 while having had 3 plans. Phase 144 lists TMPL-01, TMPL-02 and ASSERT-04 — **three requirements, so `3` is correct** and it was left alone.

Writing 7 there would have corrupted a column to satisfy a criterion. Per the phase-wide discipline that a disagreement is a finding rather than something to reconcile silently, it is recorded in the ledger's § Record targets under R-3 and here. The task's automated `<verify>` block does not test that cell, so nothing is left failing.

## Residue filed — six standing todos, each with a measurement

| Todo | The measurement |
|---|---|
| `2026-08-23-package-tests-outside-tsconfig-include.md` | **12** packages declare `typecheck` (agrees with RESEARCH B-15), **11** beyond dev-seed (agrees with RES-6) — but only **5** actually have a `tests/` dir and all five **explicitly `exclude`** it (**16** specs), while 3 more exclude co-located `src` specs (**53**). **69 spec files across 8 packages, by two mechanisms.** The "11 packages whose `tests/` sit outside their include" phrasing is imprecise: 6 of the 11 have no `tests/` dir at all |
| `2026-08-23-dev-seed-lint-script-covers-only-src.md` | `package.json:14` is `eslint … src/`. All **8** files this phase added under `tests/` measured at **0** mentions in the gate-2 lint log; 46 spec files unlinted in total |
| `2026-08-23-column-map-organization-id-collision.md` | `column-map.ts:17` and `:32` both → `organizationId`; `:82` is a last-wins reversal; `organization_id_nom` → **0** hits in `database.ts` and **0** in the SQL schema |
| `2026-08-23-bulk-upsert-rpc-interpolates-column-identifiers.md` | `501-bulk-operations.sql:170` appends `item_key` raw, no `quote_ident`; `format(...)` at `:195` uses `%I` for the table name only. Pass 0 narrows the reachable identifier set to a **derived closed set** — a real, partial benefit of TMPL-02 |
| `2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md` | **NEW, found by this plan's gate 7.** `runTeardown` at line 191 only, inside `beforeAll` |
| `2026-08-23-build-gate-cache-replay-is-not-a-measurement.md` | **NEW, found by this plan's gate 4.** `yarn build` → 14 cached/14; `TURBO_FORCE=true yarn build` → 0 cached/14 |

**The 2026-05-23 sentinel fan-out todo is left OPEN** and annotated with what `144-03` did change (the key set, now derived from one declaration, closing two latent defects with in-tree exploitation measured at 0) and what it deliberately did not (the fan-out **policy** — only **3** of the **10** declared pairs receive a default at all). A later reader must not mistake the key-set change for the fan-out removal.

## Findings collected from the six summaries

All collected in the ledger's § Residue with dispositions; there is no plan whose findings were dropped. The ones that reached the phase record as corrections:

- **`tsc` exits 2, not 1** — the plan text under-predicts by one across the whole phase. Corroborated independently by rows `X-OLD`, `P`, `T1-NEW`, `T2-NEW`, `X-NEW`, `G-NEW`. Recorded as 2 everywhere.
- **`144-RESEARCH.md:692`'s headline says "twelve" sentinel pairs** while its own table beneath enumerates ten. Reported for the fourth time; ten is what this ledger states and what every downstream artifact cites.
- **`144-05-SUMMARY.md`'s claim that "144-06 owns the E2E gate" is wrong.** `144-06` ran no Playwright and claimed nothing about it. **`144-07` owns it**, and § Gates is where it is discharged.
- **The EPC boundary moved.** `144-04`'s five-row table — not any plan's original premise — is what the residue and every claim about the type layer's reach are written from: `144-02`'s retyping of `buildMinimal.ts` made builder-internal rows a `TS2353`, so Pass 0's unique cover is **narrower** on the builder count and **wider** on `--template ./custom.ts` and the never-ran-`tsc` case.
- **`answersByExternalId` was permitted on every collection**, which would have made row `R2-NEW`'s control **structurally unable to fire** while the guard passed its own tests. Split into "stripped everywhere" vs "legal only where read" at a measured cost of **zero** across all 30 built-ins. ⚠ **Consequence, recorded as a behavioural change and not a footnote: a previously-silent field drop is now a hard seed failure.**

## Task Commits

1. **Task 1: seven gates at one HEAD, rows C and Z** — `19cc48f22` (docs)
2. **Task 2: complete the ledger — fallout discharge, final counts, completeness, residue** — `465521889` (docs)
3. **Task 3: six record corrections, evidence clauses, checkbox flips, residue todos** — `80f001f5a` (docs)

**Plan metadata:** see the final `docs(144-07)` commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Gate 7 red on a contaminated database; gate ordering corrected**

- **Found during:** Task 1, gate 7
- **Issue:** `yarn db:reset` was run before gate 1, but gate 1 (`yarn test:unit`) itself repopulates the live local database via a pre-test-only teardown. Gate 7 came back 8 failed / 79 did not run / 48 passed.
- **Fix:** Root-caused by measurement (DB row counts, the `seed_` prefix, `runTeardown`'s single call site, `seed.sql` ruled out by grep, `git log` showing the shape is pre-existing), then re-ordered to gates 1-6 → `db:reset` → gate 7. **No source change and no commit**, so HEAD did not move and gates 1-6 stayed valid.
- **Files modified:** none
- **Verification:** the re-run returned 135 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run at the identical HEAD
- **Committed in:** `19cc48f22` (the ledger's § Gates disclosure)

**2. [Rule 2 — Missing critical] Gate 4's verbatim form was a cache replay and was re-taken forced**

- **Found during:** Task 1, gate 4
- **Issue:** `yarn build` exited 0 at `14 cached, 14 total`. Under the ledger's own rule 3 a replayed exit code is a claim about a previous tree, not a measurement — the exact hazard D-06b names for `lint` and `typecheck`, but never anticipated for `build`.
- **Fix:** Re-taken as `TURBO_FORCE=true yarn build` (`0 cached, 14 total`, 14 forced verdicts). Cached run preserved as `gate-build-1-cached.log` rather than deleted.
- **Verification:** `grep -c 'replaying'` over the recorded log → 0
- **Committed in:** `19cc48f22`

**3. [Rule 1 — Bug] The plan's ROADMAP criterion-5 instruction and its own acceptance grep contradicted each other**

- **Found during:** Task 3, R-1
- **Issue:** The action says to name the commit that moved the retired template; that commit's subject *contains* the retired identifier, and the `<verify>` block requires **zero** occurrences of it in the ROADMAP section.
- **Fix:** The ROADMAP cites the commit by hash and date and describes what it did; the full verbatim subject moved to the ledger's § Record targets, where no grep forbids it — so the stale name survives exactly once, in the record explaining why it is stale. Stated as a deliberate placement in the ROADMAP text itself.
- **Verification:** `grep -c 'baseV1'` over the section → 0; the ledger carries the full citation
- **Committed in:** `80f001f5a`

**4. [Rule 4 — reported, not applied] The rollup row's "plan count" rests on a misreading**

- **Found during:** Task 3, R-3
- **Issue:** The plan requires the Phase 144 rollup row to read 7. The column header is `| Phase | Requirements | Count |` and the column counts requirements; neighbouring rows confirm it.
- **Decision:** **Not obeyed.** 3 is correct and was left alone; the finding is recorded in the ledger and here. This is an architectural/record-integrity call, so it is surfaced rather than auto-applied.
- **Committed in:** `80f001f5a`

**5. [Rule 3 — Blocking] `git status --porcelain` is never empty during this run**

- **Found during:** Task 1, row `C`
- **Issue:** An untracked `.planning/milestone.lock` — the gsd-tools session lock for the run executing this plan — makes the plan's literal `test -z "$(git status --porcelain)"` unsatisfiable.
- **Fix:** The assertion is stated against the **verbatim** output, with the single lock line quoted and named as a session artefact, and the derived count taken with that one path excluded. Prior plans in this phase set the precedent by scoping to `-- packages apps tests`; naming the path is stricter than scoping it away.
- **Committed in:** `19cc48f22`

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 missing-critical, 1 blocking) + 1 reported-not-applied.
**Impact on plan:** No scope change and no source bytes. Two are evidence-integrity corrections that make the record say what the machine said; one resolves a self-contradiction inside the plan's own criteria; one refuses a criterion that would have corrupted an artifact.

## Issues Encountered

- **`yarn db:reset` hit the known storage 502 wedge once** ("Error status 502: An invalid response was received from the upstream server"), exiting 1 with **no storage buckets created** — which would have broken the E2E suite silently. Resolved by restarting the storage and rest containers and re-running; the second run created both buckets. Bucket presence was verified by SQL before the gate rather than assumed.
- **The E2E suite exceeds a 10-minute foreground tool timeout** (10.4 m). Run detached and polled. Noted for future gate plans.
- **The suite's `[setupFromTemplate] Database is NOT fresh` advisory fires benignly** under `fullyParallel` perm setups as sibling datasets coexist. It also fired — meaningfully — during the contaminated attempt, which is precisely why it is easy to read past. Called out in the RES-15 todo as a candidate for promotion from warning to hard failure.

## Known Stubs

None. This plan ships **zero runtime bytes** — its entire surface is documentation plus the act of running the gates.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema change is introduced.

Threat-model dispositions this plan was asked to mitigate: **T-144-48** (Pass 0 false positive surfacing at gate 7) — the suite was run rather than argued away; the one red was root-caused to the gate order, and the fallout survey's zero holds at both HEADs. **T-144-49** (gate set across two HEADs) — HEAD recorded once, asserted unchanged after gate 7 and row `Z`; no fix required a commit, so no re-run was needed. **T-144-50** (cached green as a measured green) — gates 2, 4 and 6 forced; gate 4's cached run caught, disclosed and re-taken. **T-144-51** (empty fallout indistinguishable from an unrun survey) — counts, commands, both HEADs, both source rows and three would-be-fallout classes. **T-144-52** (stale corpus propagating) — both targets amended **in place**, greps at zero. **T-144-53** (premature checkbox) — flipped last, after the gates and after the clauses. **T-144-54** (probe surviving) — row `C`, both glob forms. **T-144-55** (correction that cannot say why it is true) — § Record targets, per target. **T-144-56** (stale server / dirty DB) — one fresh server started and stopped, `db:reset` immediately before, preflight read from the log. **T-144-57** (findings dropped) — all six summaries read, every finding tabled with a disposition. **T-144-SC** — no install performed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Phase 144 is complete.** TMPL-01, TMPL-02 and ASSERT-04 are satisfied with evidence clauses, and the ledger is closed at 37/37 rows with zero placeholders.

**What Phase 145 inherits.** It depends on Phase 144 (strict per-collection typing is the mechanism most likely to surface the constant-naming drift the `default.ts` breakage is suspected to rest on) and that mechanism now exists and is gated. Three things it should not rediscover:

1. **The gate order matters.** `yarn db:reset` belongs *after* the unit gate, immediately before the E2E gate. See the RES-15 todo.
2. **Force the build gate**, not just lint and typecheck. See the RES-16 todo.
3. **`questions._elections` is LEGAL** and row `L` asserts it. Anything that re-introduces it as an error contradicts a must-NOT-fire control.

**Open for a human, not for the next plan** — two broken-windows entries this plan could not discharge: whether turning a previously-silent field drop into a hard seed failure is the intended contract (entry 53), and whether the `accounts`/`projects` guarded-vs-authorable split is legible (entry 54). Plus entry 55: the new CI type-check step has never been executed by a real GitHub Actions run.

**Broken-windows ledger:** entry 51 (E2E not run in this phase) is now **fixed**; six new entries were appended for this plan's residue.

## Self-Check: PASSED

- **Created files:** all 7 verified present on disk with `[ -f ]` — the six `2026-08-23-*` todos in `.planning/todos/pending/` and the retired todo in `.planning/todos/completed/`.
- **Commits:** `19cc48f22`, `465521889`, `80f001f5a` all resolve in `git log --oneline --all`.
- **Logs:** all eight cited gate logs plus `tc-Z-1.log`, `row-C-1.log`, `gate-e2e-rootcause-1.log`, `gate-build-1-cached.log`, `gate-e2e-1-VOID-contaminated-db.log` and `gate-e2e-1-VOID-harness-timeout.log` exist and are non-empty under `${TMPDIR:-/tmp}/gsd-144/`.
- **All three tasks' `<verify>` blocks re-run at plan close: PASS.** Register 37 rows · placeholders 0 · borrowed-observation word 0 · cache-replay word 0 · seven gate blocks · all seven gate commands present · both probe glob forms named · four ledger headings present · both source rows named · `COLUMN_MAP` and `2026-05-23` named · ROADMAP carries `4aeae0ace`'s exact subject with 0 occurrences of the retired name, 0 `Plans: TBD`, 7 plan entries · three checkboxes ticked, each naming the ledger, ASSERT-04's stale word at 0 · audit stale figure at 0 · todo present in `completed/` and gone from `pending/` · the 2026-05-23 todo still open and naming `144-03` · six new residue todos collectively naming `COLUMN_MAP`, a lint-script scope, a tsconfig include and the RPC · `resolve-template.ts` still carrying the R-6 annotation · § Record targets naming R-1…R-6.
- **`git status --porcelain`** at plan close carries only the untracked gsd-tools session lock, which is not a plan artefact.
- **No source file changed after the gate HEAD** — every commit in this plan touches `.planning/` only, and `.planning/` is in `.prettierignore`, so no gate can be invalidated by them.

---
*Phase: 144-seed-template-strict-typing-unknown-prop-guard*
*Completed: 2026-08-23*
