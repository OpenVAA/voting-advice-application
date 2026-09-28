---
phase: 137-e2e-preflight-integrity-assert-the-served-application
plan: 04
subsystem: docs
tags: [documentation, e2e-integrity, preflight, FRONTEND_PORT, strictPort, runbook]

# Dependency graph
requires:
  - phase: 137-01
    provides: "the committed preflight (tests/tests/support/preflight.ts + tests/global-setup.ts, wired at tests/playwright.config.ts:99) and the D-09 failure block whose field names this plan quotes"
  - phase: 137-02
    provides: "the loadEnv wiring that makes a root-.env FRONTEND_PORT move the dev server, the verified shell-over-file precedence, and strictPort with its measured wildcard-shadow-bind limitation"
  - phase: 137-03
    provides: "the measured --list exemption and the established rule that retired wording belongs in the phase evidence doc, never in a live doc"
provides:
  - "CLAUDE.md § E2E preflight — the four-point summary developers read first, linking on to tests/README.md"
  - "tests/README.md § Preflight — the field-by-field failure walkthrough, both verbatim remedies, both working forms of the FRONTEND_PORT hatch, and the --list confirmation"
  - "tests/IDURA-TEST-RUNBOOK.md — the alternate-port instruction completed with the matching dev-server requirement and a preflight cross-reference"
  - "a re-measured criterion 4 result: the retired-wording grep still returns nothing over the three live docs after these edits"
affects: [137-05-phase-gate, gsd-verify-phase for phase 137, any developer or operator running the E2E suite]

actuals:
  tokens: 1800
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Describe a replaced check positively: when an acceptance criterion is a grep for retired wording, the sentence explaining the removal is itself the thing that fails the criterion"
    - "Document what shipped, not what was planned — the hatch wording was written against 137-02-SUMMARY.md's measured loadEnv behaviour rather than against the research-era finding it superseded"

key-files:
  created: []
  modified:
    - CLAUDE.md
    - tests/README.md
    - tests/IDURA-TEST-RUNBOOK.md

key-decisions:
  - "Wrote the failure walkthrough as a bulleted field list rather than a markdown table: prettier re-aligns table cells to the widest column, and every field description here is a full sentence, so a table would have produced a large formatting-only diff on the next `yarn format` run."
  - "Kept the strictPort claim split across both halves in both docs that carry it — closes same-address drift, does NOT close the wildcard shadow-bind — matching the wording already committed in the vite.config.ts comment (plan 02) so the docs and the code say the same thing."
  - "Stated the preflight's poll ceilings (30s local / 120s CI) in tests/README.md with the explicit note that the CI figure is a preserved budget rather than a figure derived from observed CI timings, mirroring the reasoning recorded in tests/global-setup.ts."
  - "Left the Idura runbook's existing `FRONTEND_PORT=5174` command untouched — after D-16 it is still correct as written; what it was missing was the matching dev-server requirement, which the new line supplies."

patterns-established:
  - "Live-doc edits in this phase quote the failure block's field names verbatim from tests/tests/support/preflight.ts (`reason`, `expected port`, `expected checkout`, `observed`, `listening process`), so a future rename of a field is greppable from the docs."

requirements-completed: [INTEG-06]

coverage:
  - id: D1
    description: "A developer reading CLAUDE.md learns the preflight runs automatically from global setup, aborts the run, cannot be skipped, and asserts the served application's own response proves this checkout"
    requirement: INTEG-06
    verification:
      - kind: other
        ref: "CLAUDE.md § 'E2E preflight (served-application gate)' between the E2E Hard Rule bullets and § Linting & Formatting; grep -ic preflight CLAUDE.md -> 5"
        status: pass
    human_judgment: false
  - id: D2
    description: "A developer reading tests/README.md can read a preflight failure message field by field and knows both remedies verbatim"
    requirement: INTEG-06
    verification:
      - kind: other
        ref: "tests/README.md § Preflight walks reason / expected port / expected checkout / observed / listening process (with the best-effort caveat) and carries the literal string FRONTEND_PORT=<port your server is actually on>"
        status: pass
    human_judgment: false
  - id: D3
    description: "All three live docs present the alternate-port hatch in the two forms that actually work after plan 02"
    requirement: INTEG-06
    verification:
      - kind: other
        ref: "positive grep, each file contains both 'preflight' and FRONTEND_PORT: CLAUDE.md 5/1, tests/README.md 5/3, tests/IDURA-TEST-RUNBOOK.md 1/2; each site names the root .env line and the single-command prefix"
        status: pass
    human_judgment: false
  - id: D4
    description: "The superseded research-era caveat about the variable reaching only Playwright appears in none of the three live docs"
    verification:
      - kind: other
        ref: "grep -rn -i 'only moves playwright|moves playwright but not|not the dev server' CLAUDE.md tests/README.md tests/IDURA-TEST-RUNBOOK.md -> 0 matches"
        status: pass
    human_judgment: false
  - id: D5
    description: "ROADMAP criterion 4: a case-insensitive grep for the retired process-type wording returns nothing over the three live docs after these edits, exactly as it did before them"
    requirement: INTEG-06
    verification:
      - kind: other
        ref: "grep -rn -i 'listener' and 'node process' over CLAUDE.md tests/README.md tests/IDURA-TEST-RUNBOOK.md -> 0 and 0, measured at baseline (before task 1) and again after task 3"
        status: pass
    human_judgment: false
  - id: D6
    description: "No collateral edit: no 127.0.0.1 reference normalised in the Idura runbook, no archived milestone record rewritten, formatting clean"
    verification:
      - kind: other
        ref: "git show HEAD:tests/IDURA-TEST-RUNBOOK.md | grep -c 127.0.0.1 -> 15, working copy -> 15; git status --porcelain -- .planning/milestones/ -> empty; yarn format:check -> exit 0"
        status: pass
    human_judgment: false

metrics:
  duration: ~15m
  completed: 2026-08-13

status: complete
---

# Phase 137 Plan 04: Live-Doc Rewrite Summary

The E2E served-application preflight is now documented where developers and operators actually look — a four-point subsection in `CLAUDE.md`, a field-by-field failure walkthrough in `tests/README.md`, and one completing cross-reference in the Idura runbook — with the `FRONTEND_PORT` hatch described in the two forms that work after plan 02, and without reintroducing the retired wording ROADMAP criterion 4 greps for.

## What Was Built

**Task 1 — `CLAUDE.md` (commit `b0dc66d7b`).** A new `#### E2E preflight (served-application gate)` subsection sits between the E2E Hard Rule bullets and `### Linting & Formatting`. Placement is deliberate: the Hard Rule establishes that a failing E2E run is a cardinal failure, and the next thing a reader needs is the gate that fires before any test and might abort their run. It carries four points — the gate runs from Playwright's global setup, aborts with exit 1 before any spec body, and has no bypass flag or variable; what it asserts (the served application's own response must serve and echo back this working tree's absolute path via Vite's `/@fs` endpoint, not merely answer on the port); the two working forms of `FRONTEND_PORT`; and the `strictPort` consequence. Line 35's existing parenthetical gained `; preflight-checked`. The subsection ends by pointing at `tests/README.md` § Run.

**Task 2 — `tests/README.md` (commit `850634f15`).** A `### Preflight — every run proves it is driving this checkout` subsection inserted after the `## Run` command fence, where the `# Prereqs: … yarn dev` comment already sets up the question. It covers everything `CLAUDE.md` carries plus two things only this file gets:

- **How to read a failure**, walking the fields in the order the preflight prints them: `reason` (which clause failed, plus the probed URL and returned status for the load-bearing clause), `expected port`, `expected checkout`, `observed` (status, final URL after redirects, `<title>`, and the served module root — called out as the most diagnostic line because it names the wrong checkout outright), and `listening process` (best-effort `lsof`, omitted rather than fatal when unavailable).
- **Both remedies verbatim** as the message prints them, followed by a paragraph on the hatch: a root-`.env` line moves the dev server *and* Playwright and persists; a single-command prefix overrides the file for one run because the shell wins.

The `--list` block gained one sentence confirming it still works with no dev server, because `--list` stops before global setup. Without it a reader would assume the new gate broke a documented workflow.

**Task 3 — `tests/IDURA-TEST-RUNBOOK.md` (commit `195a9c790`).** One blockquote line after the `PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174` command block. It completes an instruction that was previously half an instruction — the suite was told which port to target, but nothing said the dev server had to be there too — and points at `tests/README.md`. The runbook's fifteen `127.0.0.1` references were left alone: they address Supabase, the mock OIDC issuer, and `config.toml [auth].site_url`, not the frontend under test, and the file's own line 134 already warns that the host string must match what you browse with.

## The Two Traps, and How They Were Handled

**The self-defeating grep.** ROADMAP criterion 4 requires that a grep for the retired process-type wording returns nothing across the three live docs. Baseline, measured before task 1: **zero matches** — the wording never lived in code or in any live doc, only in archived planning prose. So INTEG-06 was a pure ADD, and the only way to fail the criterion was for these edits to name the retired check while describing its replacement. All three edits describe the gate positively ("the preflight asserts the served application's own response…") and never name what it replaced; the history stays in `137-NEGATIVE-CONTROL.md` and the archive. Re-measured after task 3: still zero, both terms.

**The superseded caveat.** Research measured `FRONTEND_PORT` as half-wired and concluded the remedy was to export it in the shell for both commands. Plan 02's D-16 fixed the config instead, so that conclusion is now false, and writing it would teach a workaround for a bug that no longer exists while implying the config is still broken. It appears in none of the three docs; a grep gate over all three confirms it.

## Deviations from Plan

None — the plan executed as written. Two wording choices inside the plan's stated discretion are recorded under `key-decisions`: the failure walkthrough is a bulleted field list rather than a markdown table (prettier re-aligns table columns, which would have produced a formatting-only diff later), and the poll ceilings are stated in `tests/README.md` with the honest note that the CI figure preserves the budget CI's deleted wait loop already granted rather than being derived from observed CI timings.

## Verification

| Check | Result |
|---|---|
| Criterion 4 negative grep, case-insensitive, both retired terms, over the three live docs | 0 and 0 — unchanged from the pre-edit baseline |
| Superseded-caveat grep over the three live docs | 0 |
| Positive grep, `preflight` and `FRONTEND_PORT` per file | CLAUDE.md 5/1 · tests/README.md 5/3 · tests/IDURA-TEST-RUNBOOK.md 1/2 |
| Literal remedy string `FRONTEND_PORT=<port your server is actually on>` in `tests/README.md` | present |
| `tests/IDURA-TEST-RUNBOOK.md` `127.0.0.1` count, `HEAD` vs working copy | 15 vs 15 |
| `git status --porcelain -- .planning/milestones/` | empty |
| `yarn format:check` | exit 0 (run after each task) |

No servers were started for this plan and none are listening as a result; ports 5273/5373/5473/5475 were not bound.

## Known Stubs

None.

## Self-Check: PASSED

- `CLAUDE.md` — FOUND
- `tests/README.md` — FOUND
- `tests/IDURA-TEST-RUNBOOK.md` — FOUND
- commit `b0dc66d7b` — FOUND
- commit `850634f15` — FOUND
- commit `195a9c790` — FOUND
