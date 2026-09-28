---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
plan: 06
subsystem: testing
tags: [waiver-discharge, record-integrity, cardinal-rule, e2e, governance, one-way-door]
status: complete

requires:
  - phase: 138-03
    provides: '138-DIAGNOSIS.md § Named root cause — criterion 1, the ordering defect'
  - phase: 138-04
    provides: '138-NEGATIVE-CONTROL.md — criterion 2, the pre-fix-fails/post-fix-passes pair'
  - phase: 138-05
    provides: '138-DETERMINISM-LEDGER.md — criterion 3 (16/16) and the F-3 retry-posture statement'
provides:
  - '.planning/v2.14-CARDINAL-RULE-WAIVER.md § Discharged — the waiver closed unrenewed, four conditions answered, three evidence documents cited, both operator sentences carried verbatim'
  - 'The cardinal E2E rule back in force with no standing exception anywhere in the project'
  - 'A forbidden-artefact audit measured for this phase (0 matches) rather than inherited from research'
  - 'tests/README.md:133 corrected — the stale quarantine claim that would have tripped criterion 4 grep audit'
  - 'The F-2 config/runbook concurrency contradiction filed as a live open item, deliberately not absorbed'
  - 'The excursion open item reframed and kept live: attributed by operator judgment, unlocalised, falsifiable'
affects:
  - 'Every later v2.15 phase — a "suite green" claim is now unqualified by any recorded exception'
  - '/gsd-ship and milestone close — no waiver to disclose at v2.15 close'
  - 'A future docs pass — F-2 is filed and waiting in STATE.md open items'

actuals:
  tokens: 11500
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - 'Append the discharge, never substitute it: the record of why a waiver was taken is as valuable as the record of its end, so the original text is retained byte-intact under a status line that stops a reader mistaking the original framing for current state'
    - 'Make record edits idempotent by marker detection rather than by line position, so an interrupted discharge is repeated rather than repaired and never yields a second discharge block'
    - 'Audit the record with the same grep the criterion will be audited with — a live document falsely asserting a forbidden artefact trips a grep-based audit exactly as a real one does'
    - 'File the adjacent contradiction, do not absorb it: a diagnosis phase whose shape note forbids padding records the finding with both file:line references instead of quietly fixing it'
    - 'Carry the operator judgment as a judgment: record the attribution, its reasoning, and the observation that would falsify it — and do not let it close the item'

key-files:
  created:
    - '.planning/phases/138-.../138-06-SUMMARY.md'
  modified:
    - '.planning/v2.14-CARDINAL-RULE-WAIVER.md'
    - '.planning/STATE.md'
    - '.planning/MILESTONES.md'
    - '.planning/PROJECT.md'
    - '.planning/REQUIREMENTS.md'
    - '.planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/deferred-items.md'
    - 'tests/README.md'

key-decisions:
  - 'Discharge selected by the operator at a blocking one-way checkpoint; the executor presented the four criteria and the honest limits in the same view and did not select'
  - "The operator's weakest-criterion sentence is carried into the discharge verbatim, so a later reader inherits the caveat rather than discovering it"
  - 'The excursion attribution is recorded as a JUDGMENT with its falsifier, and explicitly does not close the open item'
  - 'F-1 corrected (in scope — it would trip criterion 4); F-2 filed, not fixed (out of scope — a separate concern from discharging a waiver)'
  - 'Archived v2.14 records left byte-intact; only the deferred item’s own status line changed'
  - 'The discharge is gated on a full-suite green taken at the moment of discharge, asserted on executed and did-not-run counts rather than on exit status alone'

patterns-established:
  - 'One-way-door discharge: evidence table + honest-limits list presented together, operator decides, decision sentence travels into the permanent record verbatim'
  - 'Marker-detected idempotent doc edits, verified by re-running every edit and asserting a no-op'

requirements-completed: [INTEG-03]

duration: ~37 min active (7h 04m wall, incl. the blocking checkpoint)
completed: 2026-08-14
---

# Phase 138 Plan 06: Record-Integrity Audit and the Waiver Discharge Summary

**The project's only recorded exception to its cardinal E2E rule is discharged unrenewed — on a named root cause, a negative-control pair and 16 consecutive full-suite runs — with the excursion's amplifier explicitly still open and the v2.14 archive intact.**

## Performance

- **Duration:** ~37 min of active work (7h 04m wall clock, of which ~6h 30m was the blocking one-way checkpoint awaiting the operator)
- **Tasks:** 3 of 3
- **Commits:** 2 (`7f1a004f9`, `ce5189de2`)
- **Longest single step:** the discharge-moment full-suite gate, 11.1 min

## What was done

### Task 1 — Record-integrity audit (`7f1a004f9`)

**(a) The forbidden-artefact audit, measured for this phase rather than inherited.**

```
grep -rnE 'test\.(skip|fixme|only)\(|describe\.(skip|only)\b' tests/tests --include='*.ts'
→ 0 matches
```

| Pattern | Research baseline (2026-08-13) | This phase (2026-08-14) |
|---|---|---|
| `test.skip(` / `test.fixme(` / `test.only(` | 0 | **0** |
| quarantined-suite annotations in code | 0 | **0** |
| any `.skip(` / `.only(` / `.fixme(` under `tests/tests` | 0 | **0** |
| `retries` in `tests/playwright.config.ts` | 1 — `process.env.CI ? 3 : 0` | **1, unchanged (F-3)** |

The audit was re-run after the discharge edits and after the gate run: still 0. `git status --porcelain tests/ apps/` is empty — no instrumentation was left behind by any plan in this phase.

**(b) F-1 — the stale quarantine claim, corrected.** `tests/README.md:133` asserted two things that were both false in the tree: that the `perm-per-app-notifications` projects and spec were quarantined by a skipped-suite annotation, and that a matching re-enable marker existed inline in `playwright.config.ts`. Verified independently rather than taken on trust — the spec opens with an ordinary `test.describe('perm-per-app-notifications', …)` at `tests/tests/specs/perm/perm-per-app-notifications.spec.ts:18`, and the config wires the projects live inside the perm chain at `tests/playwright.config.ts:777-793`, with `data-setup-perm-missing-nominations` chaining off them. The claim had been stale since it was written in `fe289a9e2`.

This was in scope precisely because **criterion 4's audit is a grep**: a live document asserting a quarantine trips such an audit exactly as a real annotation would, and leaving it would have made the discharge arguable. The rewritten line describes the current state and carries the Phase-138 correction note. `grep -c 'describe.skip' tests/README.md` → 0; `grep -c 're-enable perm-per-app-notifications' tests/README.md` → 0.

**(c) F-2 — the contradiction filed, not absorbed.** `tests/README.md:124` (the ASCII project DAG) and `:135` state that the voter permutation family runs *in parallel* with the base/journey families and that its first setup has no upstream dependency. The config says the opposite: `tests/playwright.config.ts:514-517` declares `dependencies: ['voter-journey', 'candidate-journey']` on `data-setup-perm-1e1cg1co`, and the docblocks at `:57-64` and `:501-512` explain why that serialisation is load-bearing (shared `app_settings` singleton plus mutually-destructive preclears). Research's recommendation to file rather than absorb was adopted: correcting concurrency documentation is a separate concern from discharging a waiver, and the ROADMAP shape note forbids padding a diagnosis phase. A row was added to `.planning/STATE.md` open items naming both sites; `tests/README.md:124`/`:135` are byte-unchanged, and `git diff --numstat tests/README.md` shows 1 added / 1 removed — the quarantine line only.

**(d) The archived-versus-live boundary, stated before any waiver edit.** Criterion 4 governs *this phase's closure language*, not the v2.14 archive. Archived milestone records stating that DEF-135-04 stayed OPEN at v2.14 close are historical fact. Editing them so the past agrees with the present would itself be a record-integrity failure and would destroy the ability to audit what was known when. Only live records describing present intent were changed.

### Task 2 — The one-way door (checkpoint, operator decision)

Presented as a four-row criteria table with one evidence document and one strongest fact each, alongside eight honest limits in the same view. **Selected: discharge unrenewed.** The executor did not select the outcome.

The operator additionally recorded a judgment about the unlocalised excursion, explicitly as a judgment and not a finding, with the requirement that it must not close the open item.

### Task 3 — The discharge (`ce5189de2`)

**The discharge-moment gate, taken first.** `yarn db:reset` → fresh dev server on `FRONTEND_PORT=5273` → `FRONTEND_PORT=5273 yarn test:e2e`:

```
exit 0 — 135 passed (11.1m)
stats: expected 135, unexpected 0, flaky 0, skipped 0
```

135 executed / 135 passed / 0 failed / 0 flaky / 0 did-not-run, asserted from the JSON reporter's per-test outcomes rather than from exit status alone, and preflight-confirmed (the Phase-137 preflight aborts the run before any spec body otherwise). The gate ran **before** the discharge edits were applied; had it been red, nothing would have been written.

**The six live-record edits**, each idempotent by marker detection and each verified to be a no-op on a second run:

| File | Change | Diff |
|---|---|---|
| `.planning/v2.14-CARDINAL-RULE-WAIVER.md` | status line near the top + one appended `## Discharged` section | **+151 / −0** |
| `.planning/STATE.md` | DEF-135-04 row: waived → discharged, phase + mechanism + three evidence documents named; row kept | +1 / −1 |
| `.planning/MILESTONES.md` | forward reference appended to the v2.14 known-overrides bullet; original sentences unchanged | +1 / −1 |
| `.planning/PROJECT.md` | the two live-intent sites (`:20` milestone framing, `:107` current state); `:36`, the v2.14 historical record, untouched | +2 / −2 |
| `.planning/REQUIREMENTS.md` | INTEG-01/02/03 checked with evidence references; INTEG-03 traceability row Pending → Complete | +4 / −4 |
| `deferred-items.md` § DEF-135-04 | **status line only** | +1 / −1 |

**The `## Discharged` section** answers each of the four attached conditions in its own paragraph, cites the three evidence documents by path one per criterion with each one's strongest fact, carries both operator sentences verbatim, states the archived-records boundary explicitly, and closes with the single sentence that the cardinal E2E rule is back in force unwaived with no standing exception.

## Acceptance criteria — verified

| Criterion | Result |
|---|---|
| `grep -c '^## Discharged'` on the waiver | **1** — and 1 after re-running every edit |
| Three evidence documents cited | `138-DIAGNOSIS` ×4, `138-NEGATIVE-CONTROL` ×1, `138-DETERMINISM-LEDGER` ×2 |
| Waiver original text intact | `git diff --numstat` → **151 added, 0 removed** — no condition or rationale sentence deleted, none re-scoped |
| Exactly one waiver document | `ls .planning/*WAIVER*.md \| wc -l` → **1**; no successor waiver created |
| INTEG-01/02/03 satisfied | `grep -cE '^- \[x\] \*\*INTEG-0[123]\*\*'` → **3** |
| Archived records untouched | `git diff --quiet .planning/milestones/v2.14-REQUIREMENTS.md CLAUDE.md` → **exit 0** |
| Deferred item bounded to its status line | +1 / −1 (limit: ≤2 added, ≤1 removed) |
| No non-reproduction closure language | `grep -niE 'could not reproduce\|unable to reproduce\|stopped happening\|did not recur'` on the waiver → **no match** |
| ROADMAP not hand-edited | `git status --porcelain .planning/ROADMAP.md` → empty |
| Full suite green at discharge | exit 0, 135/135/0/0/0 |
| `.planning/milestones` untouched by task 1 | empty `git status --porcelain` at task-1 commit time |

## Qualifications carried into the discharge

These are in the discharge record itself, not only here — the point of writing them there is that a later reader inherits them rather than discovering them.

1. **Weakest criterion, operator's words, verbatim in the record:** criterion 1, because the reproduction was forced only against a 5×-shrunken oracle (400 ms against the production 2000 ms) and never at the production budget — sufficient nonetheless because criterion 2 carries the weight independently, the outcome inverting 5/5 → 0/5 across a single commit under a character-identical adversary, with the tri-state inverting alongside it.
2. **The mechanism is established; the amplifier is not.** The field occurrence needed ~36× the median window; this phase reached ~5.4× by CPU amplification and <2× by contention, and measured why neither lever goes further (~105 ms of the ~112 ms window is CPU-rate-independent).
3. **Fix tier was TEST-SIDE**, operator-selected at plan 04's D-06 checkpoint. No budget raised; no skip, quarantine, exclusive-run or per-suite retry annotation anywhere in `tests/`.
4. **The standing regression guard is a witness, not a trap, unless armed** — `eperm07-term-trigger` runs at the production budget and CPU rate 1 by default, and the pre-fix tree passed 0/97 at that budget.
5. **F-3 disclosed rather than left to be discovered:** `tests/playwright.config.ts:115` `retries: process.env.CI ? 3 : 0` is pre-existing, last modified by `9045a0a3d` on **2024-06-25** — over two years before this phase — untouched by it, and inert for every run cited as evidence because `CI` was absent from all of them.

## Open items after this plan

| Item | Status |
|---|---|
| **The unlocalised multi-second navigation excursion** | **OPEN.** Reframed from *"user-visible defect, cause unknown"* to *"attributed to a transient dev-server stall by operator judgment 2026-08-14, unlocalised, falsifiable"*. The attribution is a judgment, not a measurement; it is consistent with a candidate already named in `138-DIAGNOSIS.md`, and it implies the excursion is a development-environment artefact (the suite runs against the Vite dev server, which transforms modules on demand; a production build does not). Falsifier recorded: any recurrence of a multi-second excursion, in the suite or in production, is evidence against it. Plan 01's forensic capture is the instrument that would settle it with data. |
| **F-2 — runbook/config concurrency contradiction** | **OPEN**, filed in `.planning/STATE.md` open items with both file:line references and a note that it was deliberately not absorbed. Belongs to a docs pass. |

## Deviations from Plan

None — the plan executed as written. The two adjustments below are recorded because they were judgment calls inside the plan's own latitude, not departures from it:

- The plan's task-1 read list referred to `tests/README.md` line 129 as F-2's diagram site; the current file has that text at **line 124**. The filed open item cites `:124` and `:135`, the actual locations, rather than the plan's line numbers. `:135` — the prose parallelism claim the plan named as must-not-change — is byte-unchanged.
- The plan's task-3 read list referred to `.planning/STATE.md` § Open items; the live table is headed `## Deferred Items` (there are two such headings — the second is a v2.13 archive). Both the F-2 filing and the DEF-135-04 flip went into the **live** v2.14-close table, not the archive.

## Known Stubs

None. This plan added no code, no tests and no configuration; it edited records and corrected one documentation line.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change. The threat register's high-severity items for this plan (T-138-24 false assurance, T-138-25 archive tampering, T-138-26 waiver re-scoping) are each addressed by an asserted acceptance criterion above: the operator gate plus verbatim weakest-criterion sentence, the byte-unchanged archive assertion, and the zero-deletions assertion on the waiver.

## Self-Check: PASSED

Files verified present on disk:

- `FOUND: .planning/v2.14-CARDINAL-RULE-WAIVER.md` (with exactly one `## Discharged`)
- `FOUND: .planning/phases/138-.../138-06-SUMMARY.md`
- `FOUND: tests/README.md` (corrected line 133)

Commits verified in `git log`:

- `FOUND: 7f1a004f9` — docs(138-06): audit forbidden artefacts, fix stale quarantine claim (F-1), file config contradiction (F-2)
- `FOUND: ce5189de2` — docs(138-06): discharge the v2.14 cardinal-rule waiver unrenewed (INTEG-03)
