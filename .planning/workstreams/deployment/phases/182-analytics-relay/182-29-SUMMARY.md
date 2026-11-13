---
phase: 182-analytics-relay
plan: 29
subsystem: testing
tags: [closing-record, relay-12, evidence, privacy, analytics]
status: complete

requires:
  - phase: 182-28
    provides: evidence/28-full-suite.txt (548 of 548), evidence/28-consent-free-final.txt (7 of 7) and evidence/28-window.txt, on cb8da595b
  - phase: 182-31
    provides: evidence/31-red-free-mode.txt and evidence/31-red-default-mode.txt, on 7d35eef74
  - phase: 182-24
    provides: the keepalive page-leave test in the proxy form (0e343a40d) and the deferred items the record carries
  - phase: 182-23
    provides: evidence/23-green-cutover.txt and evidence/23-keepalive-control.txt
  - phase: 182-11
    provides: evidence/11-red-unchanged.txt
provides:
  - evidence/29-closing-record.md (the RELAY-12 red-and-green table, the unreviewed and unobserved items, the open questions and follow-ups, the hand-overs)
affects: [phase-182 verification, 181, 188, 189, the v2.16 session]

estimate:
  tokens: 40000
  tasks: 1
actuals:
  tokens: 3840      # chars/4: 15360 chars of evidence/29-closing-record.md; no code changed
  tasks: 1
  commits: 1        # MEASURED: git rev-list --count 05af6b6b5..HEAD at SUMMARY write (the record commit)
plan_head_before: 05af6b6b5f08b69f47aa414bf4694509ba975d9e
plan_head_after: f404082c3bc4420947ef33ead38e96349449dbb4

tech-stack:
  added: []
  patterns:
    - "A closing record compares each evidence file it names with the current attempt of its slot (cmp -s against the pointer's file) before it is written"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/29-closing-record.md
  modified: []

key-decisions:
  - "All eight follow-ups (182-R1 to 182-R6, X-1, X-2) are recorded as unanswered by the operator: no box is ticked and no NOTE is written in the follow-ups file, and 182-CONTEXT.md records the planned answers as amendments the operator has not ruled on"
  - "The operator's standing stack-window words of 2026-10-19 are recorded as answering the window checkpoints, not as a choice among the options of X-2"
  - "The keepalive line says the page-leave test reads the relay's answer through the recording proxy (0e343a40d) and that keepalive necessity was not measured; the 23-keepalive-control run is described as having measured nothing about a send surviving page close"

requirements-completed: []   # left to phase verification, as instructed

duration: about 12 min (06:05Z to 06:18Z UTC on 2026-10-20)
completed: 2026-10-20
---

# Phase 182 Plan 29: The closing record Summary

**The phase has one closing record, `evidence/29-closing-record.md`. It names a red and a green artefact for each of the four RELAY-12 privacy properties, and each of those six run records is a byte copy of the current attempt of its slot. It also lists, item by item, what no machine checked and no person has yet looked at, the open legal questions, the eight follow-ups (all unanswered by the operator), and what is left to phases 181, 188, 189 and the v2.16 session.** The plan ran no gate, no stack command and no E2E run.

## What the record holds

1. **Header.**
   - `FULL_RUN_DIR` and `FULL_RUN_HEAD` are copied from the current attempt of slot `28-full`: `tests/e2e-runs/182-28-full-20261020T055034Z.cb8da595b414` and `cb8da595b…`.
   - `FULL_RUN_COUNTS` holds 548 / 548 / 0 / 0 / 0 / 0, and `CONSENT_FREE_RUN_DIR` is also set.
   - `UNLOAD_FORM=direct form` is the value plan 182-23 recorded. The extra key `UNLOAD_FORM_IN_TREE` says that the test in the tree is in the proxy form as of `0e343a40d`.
   - A line says that `cb8da595b`, `7d35eef74` and `0e343a40d` are identical outside `.planning`. This was checked again here with `git diff --quiet`.
2. **RELAY-12 table.** It has four rows, each on one line, with the property's words and the `evidence/` paths of its red and green artefacts. The red failure reason is quoted.
   - Below the table, a line names the green runs of the two consent-mode properties on `0e343a40d` (`24-default-standalone`, `24-consent-free`).
   - Two more lines name the other seen-red controls: the D-13 pgTAP assertion and the environment-template test.
   - The record says that every run in the table used a database the wrapper reset. This was checked here against each run directory's `provenance.txt`.
3. **Unchecked and unobserved.**
   - Six locale lines (`fi`, `sv`, `da`, `et`, `fr`, `lb`, derived from `project.inlang/settings.json`).
   - The A11 line and the focus-ring line.
   - The keepalive line: the proxy form; the test passed in the full run, as checked in that run's `results.json`; necessity not measured; the 23 control measured nothing about a send surviving page close without keepalive.
   - The two "Human check outstanding" lines, word for word.
4. **Open questions.**
   - The legal questions are open and are the deployer's to determine (B7). The record cites the D-12 note that the operator chose acceptance with an opt-out knowing it is weak.
   - Eight follow-up lines, each "unanswered by the operator", with what an overrule changes.
5. **Left to later phases.**
   - Phase 188: real PostHog capture and the id in a batch item (RELAY-04), and the WAF rate rule (RELAY-09).
   - Phase 189: the documentation, the event catalogue for deployers, the checklist, the env-variables page and the closure of the absorbed todo (DOCS-05).
   - Contact with phase 181: `STARTUP_CONTACT=already` and `SHUTDOWN_FORM=registerShutdownFlush`, with the rule for when 181-14 lands.
6. **Shared local database.** The last reset was in the 182-28 window, and the stack was stopped. The v2.16 instruction is copied word for word.
7. **Open items carried from `deferred-items.md`** (an added part, see deviations).
   - The h1 focus gap is still open in `(voters)/about`, `admin/login`, `(voters)/(located)/questions/category/[categoryId]` and `MaintenancePage.svelte`. Re-checked here: none of the four has `tabindex="-1"`.
   - The Check 4a gap in the a11y guard.
   - The "not set" wording, owned by phase 181.
   - Stale comments.
   - The texts left stale by the keepalive form change.
   - Two items that need no action.

## Verification

| Check | Result |
|-------|--------|
| Pre-write: six tracked records `cmp -s` equal to their pointers' files, no key written twice | all six SAME |
| Verify 1 (locale lines, A11, focus ring, files named), verbatim | exit 0 under `bash` and `zsh`, before and after the commit |
| Verify 2 (current attempts, `FULL_RUN_DIR`/`FULL_RUN_HEAD`), verbatim | exit 0 under `bash` and `zsh`, before and after the commit |
| Verify 3 (consent wording, 188/189, follow-up states, rows, keepalive, db-reset, human checks, `UNLOAD_FORM`), verbatim | exit 0 under `bash` and `zsh`, before and after the commit |
| The commit lists the one file | `f404082c3`: 1 file, 100 insertions |

The verify commands were extracted from the plan's `<automated>` blocks into scratch files unchanged. There were no HTML entities to decode.

## Deviations from Plan

1. **[Orchestrator requirement] A seventh part, "Open items carried from deferred-items.md".** The orchestrator asked that open deferred items be carried rather than dropped, the h1 focus gap among them. The part is placed after the six planned parts, so their order is unchanged.
2. **[Rule 2 - Correctness] Extra header key `UNLOAD_FORM_IN_TREE`.** The plan asks for `UNLOAD_FORM=` "as plan 182-23 recorded it", and the verify requires `direct form` or `route form`. Neither describes the test in the tree since `0e343a40d`. The extra key keeps the recorded value and says it is superseded, so the header does not mislead.
3. **[Orchestrator instruction] Keepalive wording.** The line follows the orchestrator's content requirement and the 182-24 note in `deferred-items.md`. It does not use the plan's "when the control was not evidence" branch literally. The control ran on a valid run directory, but its reading is void, so the line says what the control did not measure.
4. **[Orchestrator instruction] State not advanced.** No `state.advance-plan`, no `record-session`, no STATE.md edit, and no requirement ticked. ROADMAP progress for 182 was updated, as 182-28 did.

## Open operator items the record carries

- The six translations of the privacy strings, unreviewed by a speaker: `fi`, `sv`, `da`, `et`, `fr`, `lb`.
- The A11 event classification, unreviewed. This is the human check of 182-04 Task 1 (`evidence/04-event-catalogue.md`).
- The human check of 182-12 Task 2: `privacy.json` in all seven locales.
- The visibility of the focus ring on the opt-out checkbox, not yet observed by a person.
- The legal questions, which are the deployer's to determine:
  - consent for the page-view count and for events;
  - whether a pre-consent script pageview is "access";
  - whether acceptance with an opt-out is valid consent.
- Follow-ups 182-R1 to 182-R6, X-1 and X-2: all unanswered. It is also not recorded whether the X-1 note has been handed to the v2.16 session.
- The v2.16 session must run `yarn db:reset` before it uses the local stack.

## Known Stubs

None.

## Threat Flags

None. This plan changed no code.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/182-analytics-relay/evidence/29-closing-record.md`
- FOUND: commit `f404082c3` on HEAD
