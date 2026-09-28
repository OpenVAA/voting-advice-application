---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
plan: 07
subsystem: project-governance
tags: [bookkeeping, d-01c, d-18, roadmap, requirements, milestone-audit, uat, i18n-review]
status: complete

requires:
  - phase: 134-01
    provides: the measured ConstituencySelector `.faded` AA failure and the `0eb27c677` re-measurement that make the corrections evidence-backed
  - phase: 134-03
    provides: the 14 rendered `selectExact` strings quoted verbatim in the D-18 review item
  - phase: 134-05
    provides: the D-12 deviation (isEmptyValue over an explicit null check) and the 1-hit repo-wide sweep that disproves the audit's two-sites claim
provides:
  - "ROADMAP criteria 1/2/3 and REQUIREMENTS FIX-01/02/03 describe the defects and their fixes as measured, not as originally assumed"
  - "`v2.14-MILESTONE-AUDIT.md` §4.1/§4.2/§4.3 annotated in place — the stale premises are corrected without erasing the wrong conclusion they produced"
  - "CLAUDE.md's Routing and Frontend Data Flow sections match the filesystem (no `[[lang=locale]]` directory exists)"
  - "The D-18 native-speaker review item exists in two places, quoting the six singulars exactly as they shipped"
affects: [134-08]

tech-stack:
  added: []
  patterns:
    - "Correcting a governance document by annotating the wrong claim in place rather than deleting it — the record keeps showing that a stale measurement produced a wrong instruction"

key-files:
  created:
    - ".planning/phases/134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure/134-UAT.md"
    - ".planning/todos/pending/2026-08-10-verify-non-english-selectexact-singulars.md"
  modified:
    - ".planning/ROADMAP.md"
    - ".planning/REQUIREMENTS.md"
    - ".planning/v2.14-MILESTONE-AUDIT.md"
    - "CLAUDE.md"

key-decisions:
  - "Corrections are annotations, not rewrites: §4.1's original claims stay visible with `⚠ STALE` / `⚠ CORRECTED` blockquotes beside them, because the fact that a pre-fix measurement produced a blanket 'do not change this component' instruction is itself the lesson worth keeping"
  - "Where an acceptance grep required the stale literal to disappear (`84, 97, 112`, `is **not** affected`, `and in the completion gating`), the claim line itself was corrected to state the true fact and the original is paraphrased in the adjacent annotation — so no document asserts the stale claim, and the history is still legible"
  - "The two surviving `12/12` occurrences (ROADMAP, REQUIREMENTS) are explicitly framed as corrected historical claims, which the plan's acceptance criterion allows; deleting them would hide that the criterion was written on a stale figure"
  - "FIX-01/02/03 checkboxes and the REQUIREMENTS mapping-table status column were left untouched — Plan 08 owns that flip, against gate evidence"

requirements-completed: []

metrics:
  duration: "~12 min"
  completed: 2026-08-10

actuals:
  tokens: 8920
  tasks: 3
  commits: 3
---

# Phase 134 Plan 07: Bookkeeping Corrections + D-18 Review Item Summary

**Four governance documents now describe the FIX-01/02/03 defects as measured rather than as assumed — a closed contrast defect no longer reads as open, a wrong "do not change this component" instruction is retracted with the AA failure that component actually carried, a two-sites claim is corrected to one, and the six agent-constructed non-English singulars have an explicit, discoverable native-speaker review item in two places.**

## Performance

- **Duration:** ~12 min (started ~15:02 EEST, last commit 15:12:36)
- **Tasks:** 3
- **Files:** 4 modified, 2 created

## Task Commits

1. **Task 1: Correct ROADMAP and REQUIREMENTS success criteria and requirement text** — `8b2111313`
2. **Task 2: Correct the v2.14 milestone audit and CLAUDE.md's stale route paths** — `2b39b7f84`
3. **Task 3: File the D-18 native-speaker review item** — `551d12dd9`

## Every corrected claim, before → after

| # | Where | Before (stale/wrong) | After (measured) |
| --- | --- | --- | --- |
| 1 | ROADMAP crit. 1, REQUIREMENTS FIX-01, audit frontmatter + §4.1 | "the current state is 12/12 FAIL" / "#858585 on #ffffff = 3.69:1" on the elections selector | Closed by commit `0eb27c677` (2026-06-22 19:59), which post-dates the debug doc the audit cited; re-measured under a settled DOM at **0 violations, light AND dark**. The *gate* gap was the real finding and is what FIX-01 now delivers. |
| 2 | ROADMAP crit. 1, REQUIREMENTS FIX-01, audit §4.1 | `NumericEntityFilter.svelte:84,97,112` | `85, 98, 113` — 84/97/112 point at the enclosing `<label>` elements |
| 3 | ROADMAP crit. 1, REQUIREMENTS FIX-01, audit §4.1 | `text-label` framed as a live contrast surface | A **dead class**: it matched no CSS rule at all, so the spans measured `rgb(51,51,51)` at `opacity: 1` (12.6:1). Unrealised intent, not a violation. `EnumeratedEntityFilter.svelte:198` likewise AA-clean. |
| 4 | ROADMAP crit. 1, REQUIREMENTS FIX-01, audit §4.1 | "`ConstituencySelector` is NOT affected — do not change it" / "is **not** affected by this mechanism" | The mechanism claim holds; the **conclusion did not**. The component carried a separate AA failure via `.faded` / `opacity-30` — **1.52:1 light / 1.46:1 dark, 2 nodes** — and its scan route had never once reached a constituency selector. Fixed this phase under D-17 Option A. Rewritten so it cannot read as a blanket exemption. |
| 5 | ROADMAP crit. 2, REQUIREMENTS FIX-02, audit §4.2 | 2 keys (`selectExact`/`selectRange`) in `questions.json` | **7 keys across two catalog files** — `questions.json` (2) + `components.json` (5, including `accordionSelect.listboxAriaLabel`, a raw key announced as an `aria-label`). Key-set parity check named as part of the deliverable. |
| 6 | ROADMAP crit. 3, REQUIREMENTS FIX-03, audit §4.3 | prescribed an explicit null check | `isEmptyValue()` from `@openvaa/data` (D-12), recorded as a deliberate operator-approved deviation, with the reason in one clause: a null check would render a saved `''`/`[]` as answered on the overview while the completion counter still called it unanswered. |
| 7 | audit §4.3, REQUIREMENTS FIX-03 | "and in the completion gating that reads the same helper" (two sites) | **One site.** `candidateContext.svelte.ts:233` already used `isEmptyValue()` and was never wrong; the repo-wide 4-pattern sweep over `apps/` + `packages/` returned 11 hits, 1 genuine. |
| 8 | CLAUDE.md ×6 (2 Frontend Data Flow, 4 Routing) | `apps/frontend/src/routes/[[lang=locale]]/…` | `apps/frontend/src/routes/(voters)/…` and `routes/candidate/(protected)/…`; the "optional locale in all routes" line replaced with how locale is actually resolved (Paraglide `url` strategy). Verified against the filesystem and `route.ts`. |

## D-18 artifacts — both exist

- **`134-UAT.md`** — repo-standard UAT format (`status: pending`, `## Current Test`, one numbered test with `steps` / `expected` / `why_human`). Quotes all six non-English singulars **verbatim as shipped in `3b098a22e`**, beside their pre-existing plural baselines, states MEDIUM confidence explicitly, and explains that the seeded `e2e/base` question's 2..3 window renders `selectRange` — so the string cannot be reached by walking the seeded journey and no E2E spec covers the singular branch.
- **`.planning/todos/pending/2026-08-10-verify-non-english-selectexact-singulars.md`** — the durable half, cross-referencing D-18 and the UAT path, carrying the same six strings, so the item survives a `/gsd-verify-work` regeneration of the phase UAT file.

**The `sv` caveat is pre-empted in both.** `Välj 1 alternativ.` and `Välj 2 alternativ.` are byte-identical apart from the numeral, which is exactly what a reviewer will flag as a copy-paste bug. It is not — Swedish *alternativ* is plural-invariant — and both documents say so before the reviewer gets there.

## Verification Results

| Check | Command | Result |
| --- | --- | --- |
| No ROADMAP phase block added/removed | `git diff b92fdafd8 HEAD -- .planning/ROADMAP.md \| grep -c '^[-+]### Phase'` | **0** |
| ROADMAP change size | `git diff --stat` | **6 lines** (3 criteria; cap was 25) |
| Stale contrast figure gone | `grep -c '3.69:1' .planning/REQUIREMENTS.md` | **0** |
| Blanket exemption gone | `grep -c 'do not change it' .planning/ROADMAP.md` | **0** |
| Wrong line numbers gone | `grep -c '84,97,112'` ROADMAP / REQUIREMENTS / audit | **0 / 0 / 0**; `grep -c '84, 97, 112'` audit → **0** |
| Correct line numbers present | `grep -c '85,98,113' .planning/ROADMAP.md` | **1** |
| Canonical predicate recorded | `grep -c 'isEmptyValue'` ROADMAP / REQUIREMENTS / audit | **1 / 1 / 3** |
| Prescribed null check gone | `grep -c '== null'` across all 4 docs | **0 / 0 / 0 / 0** |
| Unqualified exemption gone | `grep -c 'is \*\*not\*\* affected' audit` | **0** |
| Two-sites claim gone | `grep -c 'and in the completion gating' audit` | **0** |
| Closing commit on the record | `grep -c '0eb27c677' audit` | **6** |
| Stale route paths gone | `grep -c 'lang=locale' CLAUDE.md` | **0** |
| Real route paths present | `grep -c 'routes/(voters)' / 'routes/candidate'` | **4 / 3** |
| Mapping table untouched | `grep '\| FIX-0' .planning/REQUIREMENTS.md` | all three still `Pending` |
| Task 3 assertion (UAT status, 6 as-landed singulars byte-identical, todo present) | the plan's `node -e` script | **ok**, exit 0 |
| Todo carries the same 6 as-landed singulars | `node` byte-check | **pass** |
| Formatting | `yarn format:check` | **exit 0** |
| Working tree | `git status --short` | only `supabase/.temp/cli-latest` (pre-existing, untouched) |

## Deviations from Plan

### 1. [Rule 3 — Blocking] Three acceptance greps required the stale literal to disappear from a line the plan asked to keep as narrative

- **Found during:** Task 2
- **Issue:** The plan's action says to "annotate rather than silently rewrite history", but three of its own acceptance criteria require `grep -c '84, 97, 112'`, `grep -c 'is **not** affected'` and `grep -c 'and in the completion gating'` to return **0** in the audit. Annotating while leaving the original sentences verbatim fails all three.
- **Fix:** Split the difference in favour of both goals — the **claim line itself** now states the corrected fact (so no document *asserts* the stale claim), and the adjacent `⚠ CORRECTED` blockquote paraphrases what was originally recorded and why it was wrong. Example: the filter bullet now reads `85, 98, 113` with an inline note that 84/97/112 were originally recorded and point at the enclosing `<label>` elements.
- **Result:** All three greps return 0; the wrong conclusion and its cause remain fully legible.

### 2. [Bookkeeping] CLAUDE.md diffstat is 12, against an acceptance cap of "at most 8 changed lines"

- **Found during:** Task 2
- **Issue:** The plan mandates correcting **six** occurrences that sit on six distinct lines. Six line-corrections produce `6 insertions(+), 6 deletions(-)` = 12 in `git diff --stat` accounting. The cap is unsatisfiable under that reading and is satisfied under the reading "6 lines of the file changed".
- **Fix:** None needed — no extra edit was made. Recorded here rather than silently passed over. The intent behind the cap (no edit pass on the project's operating instructions) is met: the diff touches only the six stale path strings and the one "optional locale in all routes" line, nothing else.

### 3. [Intentional] `do not change it` survives once — in the audit, as a quoted refutation

- The audit's §4.1 correction blockquote quotes ROADMAP criterion 1's original instruction in order to retract it ("…propagated into ROADMAP criterion 1 as an explicit 'do not change it' — was wrong"). The plan's grep for this phrase was scoped to `.planning/ROADMAP.md`, which returns 0. Keeping the quotation in the audit is the point of the exercise.

No Rule 1 bugs, no Rule 2 additions, no Rule 4 escalations. No packages installed. No code changed — documentation only.

## Known Stubs

None. This plan produced no code and no placeholder content.

## Threat Flags

None. `T-134-17` (whole-file ROADMAP rewrite destroying sibling phases) was mitigated as mandated: every edit to ROADMAP, REQUIREMENTS and the audit was a scoped `Edit` located by content anchor, never a `Write` and never by line number; verified by the 0-phase-heading-churn check and the 6-line ROADMAP diff. `T-134-18` (milestone closing on a misdescribing record) is what this plan discharges. `T-134-19`: the two new documents contain UI strings and locale codes only.

## Notes for Plan 08

- The FIX-01/02/03 checkboxes in REQUIREMENTS and the three `Pending` rows in the mapping table are deliberately **not** flipped — Plan 08 owns that against gate evidence.
- ROADMAP's `Plans:` checkbox list for Phase 134 is likewise untouched by this plan.
- `134-UAT.md` is `status: pending` with 1 pending test. It is a **milestone-close** obligation (D-18), not a Phase-134 gate item — Plan 08 should not treat it as blocking, but the milestone audit should.

## Self-Check: PASSED

- `.planning/phases/134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure/134-UAT.md` — FOUND
- `.planning/todos/pending/2026-08-10-verify-non-english-selectexact-singulars.md` — FOUND
- Commit `8b2111313` — FOUND in `git log`
- Commit `2b39b7f84` — FOUND in `git log`
- Commit `551d12dd9` — FOUND in `git log`
