---
phase: 165-results-navigation-redraw
plan: 08
subsystem: documentation
tags: [requirements, traceability, milestone-counters, claude-md, agent-skills, view-transitions, sveltekit-load, todos]

# Dependency graph
requires:
  - phase: 165-07
    provides: "The phase gate at 9536af4e7 — nine gates green at one head, full default E2E suite 171/0/0/0/0, visual 4/4 baselines matched — which is the evidence RNAV-01..06 are registered against"
  - phase: 165-01
    provides: "165-NEGATIVE-CONTROL.md, the evidence document this plan appends the residue section to"
  - phase: 165-02
    provides: "viewTransition.ts, layout.tracking.test.ts and the drawer host — the two file pointers D-24 names and the mechanisms the skill domain describes"
provides:
  - "RNAV-01..06 registered in .planning/REQUIREMENTS.md with six traceability rows, a rollup row, and both counters recounted from the table rows to 110"
  - "The milestone counters corrected in the same commit — STATE.md's milestone line re-derived to 30 phases / 279 plans / 278 complete, ROADMAP.md's progress header to 30 phases / 110 requirements"
  - "A third `results-redraw` domain in the spike-findings skill, carrying the two durable invariants plus the drawer-host and node-identity rules"
  - "Spikes 031-034 recorded as processed, which is what silences the unpackaged-spikes warning on every discuss/plan run"
  - "CLAUDE.md § Results Navigation Invariants — the two invariants in the operator's words, in the house never-bullet format, pointing at the two implementing files"
  - "The 2026-06-15 view-transition-flicker todo closed WITH A NAMED RESIDUE and moved to completed/"
  - "165-NEGATIVE-CONTROL.md § Residue accepted by this phase — all five accepted costs in one place"
affects: [milestone-close, gsd-verify-work-165, gsd-ship, future-results-work, future-view-transition-work]

# Actuals (#2632)
actuals:
  tokens: 10228        # chars/4 over the realized diff: `git diff b289279c5..HEAD | grep -E '^\+' | grep -v '^+++' | wc -c` -> 40914 chars
  tasks: 3
  commits: 4           # MEASURED: git rev-list --count b289279c5..HEAD (3 task commits + this plan's metadata commit)
plan_head_before: b289279c5beedc68e7405cc28a1aafbbb7652eff

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Counter recount discipline: scope the count to the target table's own rows and record the command beside the number, because the naive `grep -c '^| [A-Z]'` over REQUIREMENTS.md returns 120 rather than 110 — it matches rows in several tables"
    - "Coupled-document edits land in ONE commit and the coupling is asserted from the commit's own captured file list, not from a pipeline that can swallow a failing `git show`"

key-files:
  created:
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md
    - .planning/ROADMAP.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md
    - CLAUDE.md
    - .planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md
    - .planning/todos/completed/2026-06-15-fix-view-transition-flicker-in-results-section.md

key-decisions:
  - "RNAV-04 is worded to D-08's ruling (the innermost PAGE renders the list), not to the ROADMAP criterion's sentence (the entity-tab level renders it), with the divergence reconciled inside the requirement's own text so a reader comparing the two documents finds the reconciliation instead of a contradiction"
  - "Every RNAV entry carries its negative-control evidence AND its stated bound — including the three criteria the evidence document says it does not fully discharge (D-03's residue, criterion 4 having no negative control, the never-taken VT skip path)"
  - "Both traceability counters recounted from the table rows with a scoped awk command recorded in the file and in the commit message; the naive count was measured wrong (120) and that wrongness is written down"
  - "STATE.md's three milestone figures re-derived from disk rather than adjusted by one, and the two non-plan summaries on disk (142-W1, 161-02.1) explicitly excluded from the plan count in the line itself"
  - "The CLAUDE.md invariant subsection landed BESIDE the two analog invariant subsections (§ Important Implementation Notes) rather than under § Frontend (SvelteKit) where D-24 said to put it, because that is where the analogs actually live; § Frontend gained a pointer line so D-24's stated location still reaches the rule"
  - "The folded todo is closed WITH a named residue, not marked done: symptom 1 (scroll) is closed outright as RNAV-02 with its evidence cited; symptom 2 (in-drawer tab flicker) is handed to the parked element-scoped-VT deferred idea"

patterns-established:
  - "Requirement registration that reopens a closed milestone couples REQUIREMENTS.md, STATE.md and ROADMAP.md into one commit, and the coupling is verified by searching the commit's own captured file list"
  - "A skill domain's reference file states the invariants in the operator's exact words first, then the mechanism behind each, then what else the phase learned, then the residue — so the durable part is not buried under the incidental part"
  - "A folded todo resolves as `## Closed with a named residue`, stating both symptoms, which is closed and by what evidence, and where the residue is recorded"

requirements-completed: [RNAV-01, RNAV-02, RNAV-03, RNAV-04, RNAV-05, RNAV-06]

coverage:
  - id: D1
    description: "RNAV-01..06 registered in REQUIREMENTS.md with six entries, six traceability rows and a rollup row; the coverage line, the rollup Total and the traceability row count all read 110 from an independent recount"
    requirement: "RNAV-01"
    verification:
      - kind: other
        ref: "E=$(grep -oE '\\*\\*RNAV-0[1-6]\\*\\*' .planning/REQUIREMENTS.md | sort -u | wc -l) -> 6; T=$(grep -oE '^\\| RNAV-0[1-6] \\|' ... | sort -u | wc -l) -> 6"
        status: pass
      - kind: other
        ref: "coverage line 110 == rollup Total 110 == scoped awk row count 110; `sort | uniq -d` over row ids empty"
        status: pass
    human_judgment: false
  - id: D2
    description: "The three coupled documents (REQUIREMENTS.md, STATE.md, ROADMAP.md) landed in ONE commit, so the counters cannot disagree between two commits"
    requirement: "RNAV-01"
    verification:
      - kind: other
        ref: "C=$(git show --name-only --format= cfa15cfc1); grep -q REQUIREMENTS.md && grep -q STATE.md && grep -q ROADMAP.md -> exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The findings skill carries a third `results-redraw` domain with both invariants, spikes 031-034 recorded as processed, and the skill description and CLAUDE.md routing entry agreeing"
    requirement: "RNAV-03"
    verification:
      - kind: other
        ref: "test -f references/results-redraw.md && grep -qi modal && grep -qi tracked && grep -ci 'two domains' SKILL.md == 0 && grep -ci 'two domains' CLAUDE.md == 0 -> exit 0"
        status: pass
      - kind: other
        ref: "for n in 031 032 033 034: grep -q $n SKILL.md -> all present; commit file list contains nothing under sources/ (count 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "CLAUDE.md states both invariants in the operator's words, in the house never-bullet format, naming viewTransition.ts and layout.tracking.test.ts"
    requirement: "RNAV-01"
    verification:
      - kind: other
        ref: "grep -qF viewTransition.ts && grep -qF layout.tracking.test.ts && grep -qiE 'never run with names' && grep -qiE 'not read the url tracked' -> exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The folded todo closed with a named residue and moved to completed/, and all five accepted residues recorded together in 165-NEGATIVE-CONTROL.md § Residue accepted by this phase"
    verification:
      - kind: other
        ref: "grep -qF '## Residue accepted by this phase' && sed -n '/## Residue.../,$p' | grep -cE '^- ' -> 5 (>= 5); grep -ci residue on the todo -> 5; pending/ copy absent"
        status: pass
    human_judgment: false
  - id: D6
    description: "The documentation edits leave the repository format gate green"
    verification:
      - kind: other
        ref: "yarn format:check -> exit 0, 0 lines matching 'Code style issues found' (status read from the command, not through a pipe)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The RNAV wording is faithful to what the phase actually achieved and does not round any of the six stated non-discharges up to done"
    verification: []
    human_judgment: true
    rationale: "Whether a requirement's prose over-claims against its evidence is a reading judgement, not a grep. The six bounds carried forward verbatim (the live ~235-256 ms pointer interception, the title() throw escaping the boundary, the never-taken VT skip path, criterion 4 having no negative control, the visual gate seeing no open drawer, and 0/16 bounding the accordion flake at <=19.4% rather than zero) need a human to confirm they survived into the registration intact."

# Metrics
duration: 19 min
completed: 2026-09-23
status: complete
---

# Phase 165 Plan 08: Registration, Invariants and Residue Summary

**RNAV-01..06 registered with both traceability counters recounted from the table rows to 110 and the milestone counters re-derived in the same commit; a third `results-redraw` domain in the findings skill that also silences the unpackaged-spikes warning; the two durable invariants stated in CLAUDE.md; and the folded todo closed with a named residue beside all five accepted costs.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-23T21:54:23+03:00 (first tool call)
- **Completed:** 2026-09-23T22:13:00+03:00 (approx., SUMMARY commit)
- **Tasks:** 3 of 3
- **Files modified:** 9 (7 distinct paths plus the todo's pending→completed move)

## Accomplishments

- **Six requirements registered and every counter the registration disturbed corrected in the same commit.** New `### Results Navigation (Phase 165)` section, six traceability rows, a rollup row, both counters recounted to **110**, and STATE.md + ROADMAP.md re-derived alongside — the hard coupling D-22 names, discharged atomically.
- **The naive count was measured wrong and the wrongness written down.** `grep -c '^| [A-Z]'` returns **120** on this file because it matches rows in several tables; the scoped `awk` over the traceability table's own data rows returns **110**, cross-checked against the rollup `Count` column summing independently to 110 and a duplicate scan returning nothing. The command sits in the file beside the number.
- **RNAV-04's divergence reconciled inside the requirement, not left as a contradiction.** The ROADMAP criterion says the entity-tab level renders the list; D-08 supersedes it — the innermost *page* does. The entry says so, so a later reader finds the reconciliation rather than concluding the criterion is unmet.
- **A third skill domain that carries the invariants AND silences the warning.** `references/results-redraw.md` states both invariants in the operator's terms with the mechanism behind each, plus the overlay exemption, the host-plus-context-bridge, the last-defined-value payload and the node-identity assertion. Spikes 031-034 appended to `<metadata>` § Processed Spikes — the edit that actually stops the unpackaged-spikes warning firing on every discuss/plan run.
- **The two invariants where every agent reads them.** `CLAUDE.md` § *Results Navigation Invariants*, in the house never-bullet format beside the two existing Svelte invariant subsections, naming `viewTransition.ts` and `layout.tracking.test.ts`.
- **The folded todo closed honestly.** Symptom 1 (scroll lost after drawer close) closed outright as RNAV-02 with its spec and its negative control cited; symptom 2 (in-drawer tab flicker) **not** closed, handed to the parked element-scoped-VT deferred idea and recorded as such.
- **All five accepted residues in one place**, with a preamble saying explicitly that the section does not replace § 16 or § 18f — those are limits of the *evidence*, these are choices about the *product*.

## What the phase achieved, as registered

The figures RNAV-01..06 are registered against, from `165-07`'s gate at `9536af4e7`:

| Gate | Result |
|---|---|
| Full default E2E suite (cardinal rule) | **171 expected / 0 unexpected / 0 flaky / 0 skipped / 0 did-not-run** |
| Nine gates at one head | all green, `Cached: 0` on every forced turbo row |
| Visual regression, pinned amd64 container | **4/4 baselines matched, 0 re-captured** |

## Task Commits

1. **Task 1: Register RNAV-01..06 and correct every counter the registration disturbs** — `cfa15cfc1` (docs)
2. **Task 2: Add the results-redraw domain to the findings skill** — `00766a5ae` (docs)
3. **Task 3: State the two invariants in CLAUDE.md, close the folded todo, record the residue** — `2534a8c30` (docs)

**Plan metadata:** see the final `docs(165-08): complete …` commit.

## Files Created/Modified

- `.claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md` **(new)** — the third domain: both invariants with their mechanisms, the overlay exemption, the drawer-host rules, the node-identity assertion technique, the route-shape finding, the scroll asymmetry, what to avoid, the residue, and the four spikes it came from.
- `.planning/REQUIREMENTS.md` — new `### Results Navigation (Phase 165)` section (RNAV-01..06), six traceability rows, rollup row, coverage line and rollup Total recounted to 110 with a dated recount parenthetical carrying the scoped command, and the § Traceability roadmap pointer updated to name Phase 165 as an addendum.
- `.planning/STATE.md` — milestone line re-derived (30 phases, 29 complete, 279 plans, 278 complete) with the derivation commands recorded inline; `Total Plans in Phase` 8 → 9.
- `.planning/ROADMAP.md` — § Progress header re-derived (30 phases, 110/110 requirements, 162.1 added to the decimal enumeration it had been omitted from), with a dated recount note.
- `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` — `description:` "two domains" → three; a § Feature Areas row; four § Production Landing Map rows; spikes 031-034 in § Processed Spikes.
- `CLAUDE.md` — new § *Results Navigation Invariants (View Transitions + the `(located)` load)*; a pointer line in § *Frontend (SvelteKit)*; § *Skill Routing* enumeration "two domains" → three with the new domain described.
- `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` — `## Residue accepted by this phase` appended (five bullets + the format-debt note).
- `.planning/todos/completed/2026-06-15-fix-view-transition-flicker-in-results-section.md` — moved from `pending/` and closed with a named residue.
- `.planning/WINDOWS.md` — one deviation entry (282), recorded and immediately marked fixed; `open_count` unchanged at 248.

## Decisions Made

1. **RNAV wording is per-criterion, one-to-one, with evidence and bounds inside each entry.** D-22 left per-criterion vs per-mechanism to the executor's discretion. Per-criterion keeps the mapping onto the six ROADMAP criteria trivially checkable, and each entry names the negative-control section that discharges it *and* what that section explicitly does not discharge.
2. **Both counters recounted, never incremented; the command recorded.** The file documents two past incidents of getting this wrong, and the naive count really is wrong here (120 vs 110). The recount, its cross-checks and its command are all in the file.
3. **STATE.md re-derived from disk rather than adjusted.** The prose line said "29 phases … 100% complete, 270/270 plans". Re-derivation gave 30 / 279 / 278. The front-matter `progress:` block already held those five numbers — it was **verified to agree**, not assumed to, and the line says so.
4. **Two non-plan summaries excluded from the plan count, in writing.** `142-W1-SUMMARY.md` (a wave summary) and `161-02.1-SUMMARY.md` (a summary with no plan file) make the SUMMARY file count 280 while completed plans is 278. Stated in STATE.md so the next recount does not "correct" it back.
5. **The CLAUDE.md subsection placed beside its analogs, with a pointer where D-24 said to look.** See *Deviations* below.
6. **Nothing added under the skill's `sources/` directory.** Phase 160 de-duplicated that on measurement; `.planning/spikes/` is canonical and the skill says so. Asserted from the commit's own file list (0 matches).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The CLAUDE.md placement D-24 specifies does not exist where it says it does**

- **Found during:** Task 3
- **Issue:** D-24 and `165-PATTERNS.md` § E3 both say the new invariant subsection goes "under `CLAUDE.md` § *Frontend (SvelteKit)*", and E3 describes § *Context Destructuring Rule (Svelte 5)* as a `### <Title>` under that section. It is not: both analog subsections (§ *Context Destructuring Rule*, § *Svelte Warning-Accepted Format*) sit under § *Important Implementation Notes*. The plan's acceptance criterion ("under its frontend section") and its done-clause ("beside the two invariant subsections it belongs with") therefore pointed at two different places.
- **Fix:** The done-clause wins — the subsection landed beside its two analogs, inheriting their format exactly. § *Frontend (SvelteKit)* gained a short pointer line naming both invariants and forwarding to the subsection, so a reader who goes where D-24 sent them still arrives at the rule.
- **Files modified:** `CLAUDE.md`
- **Verification:** Both invariant phrases and both file pointers present (`grep -qF viewTransition.ts`, `grep -qF layout.tracking.test.ts`, `grep -qiE 'never run with names'`, `grep -qiE 'not read the url tracked'` — all exit 0); `yarn format:check` exit 0.
- **Committed in:** `2534a8c30` (Task 3 commit), and filed as WINDOWS 282 so the next editor of either section knows the placement was a decision rather than drift.

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** None on scope. The deviation resolves a contradiction internal to the plan's own source documents; both readings of the acceptance criterion are now satisfiable.

## Issues Encountered

- **A Python heredoc anchor did not match on the first attempt** when editing SKILL.md's Production Landing Map (the table's last row is column-padded and my literal carried different trailing whitespace). The script asserted before writing, so nothing was half-applied; it was reworked to match by line prefix instead. No file was left in an intermediate state.
- **`git mv` of the todo produces a deletion in the commit's diff.** The post-commit deletion check flagged `.planning/todos/pending/2026-06-15-…` as deleted. That is the intentional `pending/` → `completed/` move required by this tree's todo convention, and the added path is present in the same commit.

## What must NOT be read into this registration

Carried forward verbatim from `165-NEGATIVE-CONTROL.md` §§ 15, 16 and 18f, because a registration that implies more than its evidence supports is the failure this plan existed to avoid:

1. **The document View Transition still swallows pointer events on `<html>` for ~235-256 ms** (WINDOWS 278). The suite is green *with* it, on a 14-CPU host — not a proof of absence on a slower one.
2. **A second throw escapes the host's `<svelte:boundary>`** via the payload's `title()` getter, read in `DrawerHost.svelte`'s `aria-label` outside the boundary (WINDOWS 279 / `D-165-06-01`).
3. **The VT skip path has never been TAKEN** by any run in this phase. "It skips rather than fails" is asserted by construction only.
4. **Criterion 4 (the route split) has no negative control.** D-17 scoped its pairs to the four fixes; the split is structural.
5. **The visual gate cannot see the DrawerHost** — all four baselines screenshot a page with no overlay showing (WINDOWS 280 / `D-165-07-01`).
6. **0/16 bounds the accordion flake's residual rate at ≤19.4 %**, not at zero.

And on the phase's diff: **`165-07` fixed 11 pre-existing v2.15 format-debt files that Phase 165 never touched** (WINDOWS 281). The changed-file list of this phase is not a description of this phase's work.

## Known Stubs

None. This plan touches no product code; it edits planning documents, the agent skill and `CLAUDE.md` only.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema surface is introduced. The plan's own threat register (T-165-14 repudiation, T-165-15 tampering) is mitigated as written: every figure re-derived with a recorded command and never incremented, the three counters asserted equal before the commit, the three-file coupling asserted from the commit's captured file list, and the two enumerations (skill description / routing entry) asserted to agree.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 165 is complete**: 9 of 9 plans executed, all six requirements registered and traceable, the phase gate discharged at `9536af4e7`.
- **Ready for `/gsd-verify-work 165`.** The judgement item for the verifier is coverage entry `D7` — whether the RNAV prose over-claims against its evidence.
- **Blocker for ship, unchanged and not this plan's to move:** `PRESHIP-01` reads `Gaps Found` and `PRESHIP-02` is unticked and marked blocking ship. `.planning/WINDOWS.md` `open_count` is **248**, which blocks `/gsd-ship` while `workflow.windows_enforce` is on.
- **Merge note carried from the ROADMAP:** this branch must be merged onto `integration/ship-12-squash`, which was 21 behind / 7 ahead at research time and has been moving. The commit-mechanics note applies — this worktree has a local `core.hooksPath=/dev/null`, the main repo does not.

## Self-Check: PASSED

Claims verified against disk and git rather than asserted.

**Files claimed created — all present:**

- `FOUND: .claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md`
- `FOUND: .planning/phases/165-results-navigation-redraw/165-08-SUMMARY.md`
- `FOUND: .planning/todos/completed/2026-06-15-fix-view-transition-flicker-in-results-section.md`

**Commits claimed — all present in `git log --oneline --all`:** `cfa15cfc1`, `00766a5ae`, `2534a8c30`, plus this plan's metadata commit.

**Counters re-derived after the state updates, not copied forward:** phases 30 · PLAN files 279 · plans with a matching SUMMARY 279 · SUMMARY files 281 (the two non-plan summaries named above) · REQUIREMENTS.md coverage line 110 == rollup Total 110 == scoped traceability row count 110, duplicates 0.

**`requirements.mark-complete RNAV-01..06`:** `already_complete` ×6, `not_found: []`, **`table_unmatched: []`** — the failure mode REQUIREMENTS.md records against ASSERT-11 (a requirement with no traceability row) did not occur.

**Working tree clean at the final commit**, no untracked files.

---

*Phase: 165-results-navigation-redraw*
*Completed: 2026-09-23*
