---
phase: 153-build-tooling-config-correctness
plan: 09
subsystem: infra
tags: [negative-control, ledger, phase-close, e2e, cardinal-rule, skill-drift, requirements, windows-ledger, operator-ruling]

requires:
  - phase: 153-01
    provides: "`153-NC-ROW-1-CFG-01.md` — Row 1, and the census-bearing guard shape (`N scanned, M invocations, K violations`) every later guard in this phase copied"
  - phase: 153-03
    provides: "`153-NC-ROW-6-CFG-02.md` — Row 6, the standing CI negative control and its explicitly-stated unobserved half"
  - phase: 153-04
    provides: "`153-NC-ROW-3-CFG-03.md` — Row 3, the row that declines to manufacture a BLINDNESS half and says why"
  - phase: 153-05
    provides: "`153-NC-ROW-2-CFG-08.md` — Rows 2 and 2b, and the precedent of leaving a requirement Pending with its unmet clause named"
  - phase: 153-06
    provides: "`153-NC-ROW-4-CFG-06.md` — Row 4, and the first sighting of the loose-artefact-predicate defect"
  - phase: 153-08
    provides: "`153-NC-ROW-5-CFG-05.md` — Row 5, the skill-drift refutation and the D9-accepted exit-1 state"
  - phase: 153-10
    provides: "`assert:env-pair-registry` — link 11 of the `lint:check` chain, and the lesson that a gate examining nothing also reports green"
  - phase: 153-11
    provides: "the re-measured REVIEW-HYG-01/-02 dispositions, WINDOWS 120/122/129 → fixed, and WINDOWS 181"
provides:
  - "`.planning/phases/153-build-tooling-config-correctness/153-NEGATIVE-CONTROL.md` — the assembled phase evidence ledger: six verbatim rows plus Row 2b, a complete 8-requirement trace, four flagged planner assumptions, and a `## Ledger status` enumerating four boundaries"
  - "the phase-close gate record: five compile-time gates green at one HEAD (all three cacheable ones re-run `--force`), all 11 `lint:check` links asserted by name, and a full E2E run at 150/150"
affects: [153-verification, 160-agent-docs-skills-refresh, 163-01, v2.15-ship]

actuals:
  tokens: 36949
  tasks: 3
  commits: 6
  # measured, not rounded: chars/4 over the realized diff (147,799 chars, 3 files).
  # Plan estimate was 35,000 -- a 5.6% overshoot. Most of the ledger's bulk is
  # sliced verbatim from existing fragments, so the authored share is far smaller
  # than the 2,184 line count suggests.
  # The commit count is self-referential and is stated at its settled value: 5 had
  # landed when it was measured, and the 6th is the commit that records this number.
  # Two of the six are corrections of this plan's own falsified claims -- kept as
  # separate commits rather than amended away, because the corrections are evidence.

tech-stack:
  added: []
  patterns:
    - "Assemble an evidence ledger by line-range SLICE, then prove the slice: all six fragments were checked for contiguous byte-exact reproduction, not spot-checked by eye"
    - "A cached green examines nothing on the run that reports it — re-run every cacheable gate with `--force` before calling it a phase gate"
    - "Assert a chain by NAME, not by count: `lint:check` grew 8 → 11 this phase, so a count assertion could not distinguish 'all links ran' from 'three replaced three'"
    - "Decode suite results from the report payload, never the console tail — and corroborate them (retries setting, per-test tally, total-vs-baseline) so the number is a measurement rather than a restatement"
    - "When your own claim fails its own test, correct it in place and keep the correction visible; the falsification is the more useful record"

key-files:
  created:
    - .planning/phases/153-build-tooling-config-correctness/153-NEGATIVE-CONTROL.md
    - .planning/phases/153-build-tooling-config-correctness/153-09-SUMMARY.md
  modified: []

key-decisions:
  - "E2E disposition RAN, per operator ruling D1 — and actually run: 150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run, decoded from the HTML report's embedded zip payload, preflight confirmed against this checkout's absolute path."
  - "NOTHING marked. No `requirements mark-complete` call was made. Six CFG ids were already Complete on their owning plans' evidence; CFG-05, CFG-08, HYG-01 and HYG-02 stay Pending with their unmet clauses named. Marking any of the four would have been a false record."
  - "The boundaries are FOUR, not the two this plan's body anticipated, and the CFG-02 framing in the body is wrong: the binding WAS observed by 153-02 against real runtimes; what is unobserved is the negative-control job's first CI run (WINDOWS 179)."
  - "`audit-skill-drift.sh` exit 1 with exactly `filters` and `matching` is the D9-ACCEPTED state owned by Phase 160 — recorded as an attributed boundary, not scored as a Phase 153 regression, and not silenced."
  - "A prediction written into the ledger at close was falsified by its own measurement and corrected in place rather than deleted (the loose `tsbuildinfo` predicate filters PATHS, not CONTENTS)."

status: complete
---

# Phase 153 Plan 09: Phase Close — Negative-Control Ledger, Phase Gate and the E2E Cardinal Rule Summary

Assembled the phase's six evidence fragments into one 2,184-line ledger with a complete
eight-requirement trace, ran the compile-time gate at a single HEAD with every cacheable gate forced
uncached, and discharged CLAUDE.md's E2E cardinal rule with a real full-suite run at **150/150, zero
failed, zero did-not-run** — while leaving four boundaries named and four requirements unmarked.

## E2E: RAN

Operator ruling **D1** pre-answered Task 3's checkpoint with the disposition `RAN`. The ruling
pre-authorises the *branch*, not the *result*, so the suite was actually run and the numbers below
are decoded from the **report payload**, not the console tail.

```
command:      yarn test:e2e
exit code:    0
wall:         621 s (10.3m)
preflight:    E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend
              (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)

report.stats, verbatim from tests/playwright-report/index.html → embedded base64 zip:
  total: 150   expected: 150   unexpected: 0   flaky: 0   skipped: 0   ok: true

in the cardinal rule's terms:
  passed: 150   failed: 0   skipped: 0   flaky: 0   did-not-run: 0
```

**Corroboration, because "150 passed" is exactly what a false record would also say:**

- **Per-test tally computed separately** from the payload's per-file reports: 150 tests seen,
  outcomes `{"expected": 150}`, **0 tests with more than one result**.
- **No retry could have masked a flake.** `tests/playwright.config.ts:216` is
  `retries: process.env.CI ? 3 : 0`; `CI` is unset locally, so retries were **0**. `flaky: 0` is a
  measurement here, not a configuration artefact.
- **`total` equals the 150-test baseline**, so nothing vanished at collection. A did-not-run would
  show as `skipped` (0) or as a shortfall in `total` (none).
- **One video artefact on a green run, fully accounted for**: it belongs to the
  `eperm07-term-trigger` hunt project, which sets `video: 'on'` by design
  (`tests/playwright.config.ts:425`); that test's outcome is `expected`. Not a failure residue.

**Run mechanics (house rule 9).** `yarn db:reset` (exit 0, 30 s) → port `:5173` verified free by
**both** `lsof -nP -iTCP:5173 -sTCP:LISTEN` and `docker ps | grep 5173`, with no stray `vite.js dev`
→ exactly **one** fresh dev server (pid 87189, listening `[::1]:5173`, ready in 7 s) → suite launched
in background and polled, never in foreground → dev server torn down. Free disk 155 GiB;
`tests/e2e-runs/` untouched.

## What was built

### Task 1 — the assembled ledger (`56b1dfe2a`, corrected in `de8080450`)

`153-NEGATIVE-CONTROL.md`, on the `141-NEGATIVE-CONTROL.md` model:

- **Row count declared before the first row** — six numbered rows plus Row 2b — with an index table
  naming each row's requirement, owning plan, fragment and shape.
- **Six rows lifted verbatim by line-range slice.** Rather than spot-checking three rows by eye as
  the plan asked, **all six** were checked for *contiguous byte-exact reproduction* inside the
  assembled file: 164 + 304 + 151 + 322 + 291 + 341 row lines plus each fragment's own environment
  block, all six `OK`. The single transformation is one heading demotion per fragment
  (`## Environment` → `### Environment as recorded by …`), disclosed in the ledger's own preamble so
  a reader diffing against a fragment knows what to expect.
- **All six fragments retained on disk** as raw provenance.
- **Per-row environments preserved.** The rows were taken at six different HEADs, by necessity — a
  BLINDNESS half stops being observable the moment its fix is committed — so each row carries its
  own environment block rather than being re-stated under one.
- **`## Requirement trace`**: all eight of REVIEW-CFG-01..08 → owning plan → a named executable
  command **or** a named recorded boundary in words → its row. **Zero empty cells.** REVIEW-CFG-07
  has no row (153-07 produced no fragment), and that cell says so and carries its two proof commands
  in full instead of being left blank.
- **`## Flagged planner assumptions`**: the three `unclassified` probe rows (CFG-04, -05, -07)
  verbatim as their owning plans wrote them; the **four-versus-three** count discrepancy against the
  planning brief recorded and deliberately not reconciled in either direction; the CFG-05 assumption
  marked as **partly superseded** by ruling D9; plus a fourth assumption added at close.
- **`## Ledger status`**: the green HEAD, the gate table with censuses, the E2E block, and **every**
  unfilled cell enumerated.

### Task 2 — the compile-time phase gate at one HEAD

All five green at **`a332f46264da7dcf69a1e1fdc5693943b2469530`**:

| Gate | Result | Census | Wall |
|---|---|---|---|
| `yarn build` | green | 14/14 tasks | 1 s cached / **18.3 s forced** |
| `yarn lint:check` | green | all **11** links observed by name | 8 s |
| `yarn typecheck` | green | 22/22 tasks | 0 s cached / **14.7 s forced** |
| `yarn test:unit` | green | 25/25 tasks; frontend **54 files / 816 tests**; dev-seed **53 / 603** | 17 s / **24.5 s forced** |
| `yarn format:check` | green | "All matched files use Prettier code style!" | 10 s |

`build` and `typecheck` were **FULL TURBO cache hits** on the first pass. A cached green examines
nothing on the run that reports it, so all three cacheable gates were re-run `--force` with
`0 cached` and were green; those are the figures that carry the claim.

**All 11 `lint:check` links asserted by name**, not by count — the chain grew 8 → 11 during this
phase, so a count alone could not distinguish "all ran" from "three replaced three". Links 9, 10 and
11 (`assert:declared-binaries`, `assert:node-engine`, `assert:env-pair-registry`) are this phase's
additions and all three were observed producing output.

**Per-criterion one-liners, all re-run at close:** declared-binaries exit 0 (`16 workspaces, 20
invocations, 0 violations`) · both manifests spell `engines`, `engine` undefined in both ·
comment-filtered `__dirname` count in `apps/frontend/vitest.config.ts` = 0 · `.lintstagedrc.json`
free of `bash` (0) and of the fused `mjssvelte` alternative (0) · anchored artefact predicate 0 ·
no `1.0.0` in `packages/shared-config/README.md` · zero `.js` relative specifiers in TS.

## Deviations from Plan

### [Rule 2 — missing critical verification] All six rows proved verbatim, not three spot-checked

The plan asked to "spot-check three rows by diffing the fenced blocks". A spot-check of three cannot
establish the property for six, and the assembly was mechanical enough to prove outright, so a
contiguous-substring check was run over **all six** fragments instead. All six reproduce byte-exact.

### [Rule 2 — missing critical verification] Cacheable gates re-run `--force`

The plan's gate step did not distinguish a cached green from an executed one. `build` and `typecheck`
came back in 1 s and 0 s as `FULL TURBO` replays — greens that examined nothing on that run. Re-ran
all three cacheable gates with `--force` (`0 cached`). This is the phase's own house rule 2 applied
to its own gate.

### [Rule 1 — false claim corrected] A ledger prediction falsified by its own measurement

The Flagged-assumptions section, as first written, claimed this ledger would itself add a *second*
match to the loose `tsbuildinfo` predicate. Re-running the predicate after committing the ledger
returned **1**, not 2. `git ls-files | grep` filters tracked **paths**, not file **contents**, so a
document is caught only when the token is in its *filename*. Corrected in place and the correction
kept visible (`de8080450`) rather than deleted, because it narrows the hazard usefully: filename-
shaped scans bite only on filings *named* after a token; content-shaped scans bite whenever a filing
*mentions* one.

### [Corrected framing, per the orchestrator amendment] Not a deviation this executor chose

The plan body was written when the phase had nine plans; it has eleven. Ten summaries were read, not
eight. `153-03`'s pre-replan `node-version-file` scope is not described anywhere in the ledger. And
the body's phrase *"REVIEW-CFG-02's binding observation"* was **not** carried into the ledger,
because it is wrong — see boundary 1 below.

## The four boundaries — named, none ticked

1. **The CI-run boundary (WINDOWS 179, `open`).** The binding **was** observed by `153-02` against
   real runtimes via `nvm` — `yarn install` under Node v20.18.1 exits 1 naming the guard; v22.4.0 /
   v24.14.1 / v25.2.1 pass — and **REVIEW-CFG-02 is Complete** on that evidence. What is blocked is
   the **first CI run of the negative-control job `153-03` added**. `153-03` deliberately did not
   re-mark CFG-02 so the ledger could not imply otherwise; that was preserved, not undone.
2. **REVIEW-CFG-05 — Pending.** Unmet clause: *"observed running green against its script on a real
   workflow run"*. Unmet twice: no run exists, **and** `audit-skill-drift.sh` legitimately exits 1
   until Phase 160 (ruling D9).
3. **REVIEW-CFG-08 — Pending.** Clause two, *"so the gate starts from clean"*, is unmeetable from
   inside `153-05`. The pre-commit hook was **already red before this phase** — `apps/docs` aborts
   eslint with `ERR_INTERNAL_ASSERTION`, and `eslint --fix` would rewrite 27 of 44 `.mjs` leaving 366
   problems. Attribution measured per directory: `153-05` enlarged the population the hook sees; it
   did not create the defect.
4. **REVIEW-HYG-01 and -02 — both Pending**, re-measured by `153-11` and **independently
   re-confirmed here**:
   - HYG-01's line-break half is NOT MET by **64** (5 vendored + **59 in
     `apps/supabase/supabase/config.toml`**, a `toml` family no ruling covers — WINDOWS **181**).
     Re-confirmed mechanically: `toml` is absent from the shared classifier's `FAMILY_BY_EXT`
     (`ts, tsx, js, mjs, cjs, css, scss, html, svelte, sql, sh, bash, yaml, yml`), and `config.toml`
     is tracked under `apps/` — so the guard's `0 violation(s)` is **scope-limited, not absence**.
   - HYG-02 has **34** gated occurrences — re-derived here by running `hygiene-grep-report.sh`:
     `phase-ref` 15 + `decision-id-bare` 1 + `planning-path` 2 + `task-id` 16 = **34**, over a census
     of 2,658 tracked paths (2,431 greppable non-`.md`). 24 of the 34 were written after Phase 152
     closed, because `hygiene-grep-report.sh` **is wired into nothing** — independently confirmed:
     its three copies are referenced by no `package.json` script, workflow or lint chain.

**`requirements ready-ids` calls both HYG ids "ready". That is a frontmatter statement, not a
measurement.** Neither was marked.

## Requirement dispositions

**No `requirements mark-complete` call was made.** CFG-01, -02, -03, -04, -06 and -07 were already
`Complete`, marked by their owning plans on their own evidence; CFG-05 and CFG-08 are `Pending` with
their unmet clause preserved in the Status cell; HYG-01 and HYG-02 are `Pending`. Marking any of the
four would be a false record, and normalising an annotated Status cell to a bare `Pending` to force a
write through would delete the annotation carrying the finding.

## Skill-drift audit — D9-accepted, not a regression

`bash .claude/scripts/audit-skill-drift.sh` → **true exit 1**, census `Checked: 5  Drifted: 2
Skipped: 3`, with exactly `filters` and `matching` drifted — the D9-accepted post-`153-08` state,
owned by **Phase 160**. Both attributed to Phase 152's sweeps (`dce80642f`, `87e02f40b`) with 0
non-comment changed lines each.

**Hazard recorded:** `audit-skill-drift.sh | tail; echo $?` reports `0` — that is `tail`'s exit. The
exit was captured directly.

**Nothing silenced, asserted not promised:** all eight `targets:` blocks byte-identical to their
pre-task values; `.claude/skills/` still lists the same eight directories plus `BOUNDARIES.md`; the
script's `exit 1` still present; `git diff HEAD -- .claude/scripts/audit-skill-drift.sh` empty.

## Pre-existing red, explicitly NOT scored as a regression

`yarn db:lint:sql` is **pre-existing red and cannot be otherwise** — its failing half lints the live
database and reads no working-tree file. It was not run as a phase gate and is not counted against
this phase.

## Known Stubs

None. This plan wrote two `.planning/` documents and changed no source file, manifest, workflow or
config.

## Threat Flags

None. No file created or modified by this plan introduces network, auth, file-access or schema
surface; both outputs are Markdown under `.planning/`.

## Self-Check: PASSED

- `153-NEGATIVE-CONTROL.md` — FOUND (2,184 lines)
- `153-09-SUMMARY.md` — FOUND (this file)
- All six `153-NC-ROW-*.md` fragments — FOUND, none deleted
- Commit `56b1dfe2a` (ledger) — FOUND
- Commit `de8080450` (falsified-claim correction) — FOUND
- Task 1 automated verify — PASS (11 `## Row ` headings; all 8 REVIEW-CFG ids present; all six
  fragments on disk; the "not observed" statement present)
- Task 3 automated verify — PASS (`e2e disposition recorded: RAN`; exactly one disposition marker
  present — the RAN marker once, the deferral marker not present at all; `failed: 0`,
  `did-not-run: 0`, preflight present)

**A seventh sighting of the self-invalidating-scan class — caught in this very file, after the
verifier had already passed.** This Self-Check section was appended *after* Task 3's automated check
was run, and its first draft spelled the deferral marker out literally in order to report that the
marker was absent. That made the plan's own verifier — which asserts the summary records *exactly
one* of the two markers — see both, and fail. The check was re-run and the sentence reworded to name
the marker without spelling it. The lesson is narrow and worth keeping: **re-run a document's own
verifier as the last action before committing it, not as the last action before writing the rest of
it.** A verifier that passed against an earlier draft has told you nothing about the draft you are
actually committing.
