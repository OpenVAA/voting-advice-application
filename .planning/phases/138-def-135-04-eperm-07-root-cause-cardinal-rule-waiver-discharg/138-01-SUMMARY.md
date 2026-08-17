---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
plan: 01
subsystem: e2e-harness
tags: [forensics, playwright, view-transitions, evidence-retention, diagnosis]
status: complete

requires:
  - 'tests/tests/fixtures/voter/voter-journey.fixture.ts :: walkUntilQuestionsIntro'
  - 'tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts :: clickStart (bypass-tolerant)'
  - 'tests/tests/helpers/timeouts.ts :: TIMEOUTS (read-only — never edited)'
  - 'tests/tests/utils/testIds.ts :: voter.questions.{heading,termTrigger,answerOption,categoryStart,categoryIntro}'
  - 'tests/tests/support/preflight.ts :: FAILURE_HEADLINE (grepped, not parsed)'
  - 'playwright project data-setup-base (e2e/base dataset)'
provides:
  - 'tests/tests/specs/voter/eperm07-term-trigger.spec.ts :: the isolated LEAF hunt instrument (plans 02-05 drive it)'
  - 'playwright project eperm07-term-trigger :: named project, exact testMatch, dependencies data-setup-base'
  - 'tests/tests/fixtures/shared/forensicCapture.fixture.ts :: attachForensicCapture / flushForensicCapture / ForensicLog'
  - 'forensicCapture auto fixture on tests/tests/fixtures/voter/views.ts :: console + network capture for all 16 importing specs'
  - 'tests/scripts/e2e-run.sh :: single-run wrapper (plan 05 loops it)'
  - 'env knobs EPERM07_FORCE_BUDGET_MS / EPERM07_FORCE_CPU_RATE / EPERM07_NO_VT :: neutral by construction'
  - 'test annotation type eperm07-state :: the H1/H2/H3 tri-state, in results.json'
  - '138-DIAGNOSIS.md :: U-1 verdict + live hypothesis ledger (plans 02-03 update it)'
  - 'executed-count baseline 135 (was 134) :: every later v2.15 phase reconciles against this'
affects:
  - 'tests/playwright.config.ts :: voter-journey gains video retain-on-failure; new LEAF project'
  - 'all 16 spec files importing fixtures/voter/views :: auto forensic capture, no opt-in'
  - '.gitignore / .prettierignore / tests/eslint.config.mjs :: tests/e2e-runs/ excluded'

tech-stack:
  added: []
  patterns:
    - 'Structural neutrality for test-oracle knobs: read the forcing value from an env var whose DEFAULT is the production value, so the committed file is neutral by construction rather than by remembering to revert'
    - 'Record the discriminating state as a test annotation BEFORE the assertion, so a near-miss is data too — not only a failure'
    - 'Auto-registered capture fixture on a composition root: evidence retention that cannot be forgotten at the per-spec level'
    - 'Read the run posture (workers/retries) back OUT of results.json rather than restating it from config — auditable, not asserted'
    - 'An interrupted run wrapper must exit non-zero, never inherit the last command status, or a batch caller counts an abort as a green'

key-files:
  created:
    - '.planning/phases/138-.../138-DIAGNOSIS.md'
    - 'tests/tests/fixtures/shared/forensicCapture.fixture.ts'
    - 'tests/tests/specs/voter/eperm07-term-trigger.spec.ts'
    - 'tests/scripts/e2e-run.sh'
  modified:
    - 'tests/tests/fixtures/voter/views.ts'
    - 'tests/playwright.config.ts'
    - '.gitignore'
    - '.prettierignore'
    - 'tests/eslint.config.mjs'

decisions:
  - 'U-1 resolved UNRECOVERABLE after an 8-location search; all three hypotheses stay live'
  - 'The hunt spec ships permanently in the default suite (U-5), moving the executed-count baseline 134 -> 135'
  - 'auto: true fixture registration adopted as a NEW convention, with the 16-file blast radius stated as intended coverage'
  - 'video: retain-on-failure on voter-journey, video: on for the one-test hunt project (near-misses are cheap to keep there)'
  - 'The wrapper owns the dev server; no Playwright-managed frontend server entry was added (Phase-137 trust model preserved)'

metrics:
  duration: ~30 min
  completed: 2026-08-13
  tasks: 3
  commits: 4

actuals:
  tokens: 13440
  tasks: 3
  commits: 4
---

# Phase 138 Plan 01: Forensic Capture + Hunt Instrument Summary

Forensic capture (video, browser console, failed requests, dev-server log) is in force **before** any
hypothesis is tested, the isolated `eperm07-term-trigger` instrument runs the Base-1→2→3 walk in ~8 s
instead of 648 s with three neutral-by-construction forcing knobs, and U-1 is closed as an explicit
unrecoverable finding — with the instrument's first reading already showing H1's race window is real.

## What was built

**Task 1 — `138-DIAGNOSIS.md` (U-1 verdict + hypothesis ledger).** An 8-location search for the
original DEF-135-04 run's error list: both Playwright artifact directories (overwritten 2026-08-13,
two days after the 2026-08-11 occurrence — `grep -c "voter-journey" index.html` → 0), all ten files
under the archived Phase-135 directory, `.planning/debug/`, `.planning/spikes/`, `git log -S`, a
`--diff-filter=A` sweep for any transient artifact ever added and removed, and shell history. Verdict:
**UNRECOVERABLE**, all three hypotheses remain live. The document states explicitly *why* inference is
forbidden — the deferred-item's single quoted error block is an excerpt selected by a human writer,
not Playwright's complete error list, so absence from the excerpt is not absence from the run. The
three-row ledger (H1/H2/H3, each with a `file:line` mechanism and a named discriminator) is the live
artifact plans 02–03 update.

**Task 2 — the tracer: one Base-2 → Base-3 hop wired through every layer.**
- `forensicCapture.fixture.ts` (D-11): `console` + `pageerror` + `requestfailed` capture, ISO-8601
  stamped, attached only when non-empty (a green 16-run batch would otherwise write ~4000 empty
  attachments). Registered `{ auto: true }` on `views.ts` — a new convention, documented as one, with
  the 16-file reach stated as the intended coverage that makes waiver condition 3 ("the next
  occurrence is data") hold without per-spec opt-in.
- `playwright.config.ts` (D-09): `video: 'retain-on-failure'` on `voter-journey`; a new
  `eperm07-term-trigger` LEAF project (`video: 'on'`, exact `testMatch`, `dependencies:
  ['data-setup-base']`), with the sibling non-collision sentence the file's LEAF entries all carry.
- `eperm07-term-trigger.spec.ts` (D-03): walks to Base-1 via `walkUntilQuestionsIntro` (which carries
  the data-consent guard), answers Base-1 and Base-2 in-app, reproduces the production URL-only settle
  **verbatim including its swallowed timeout** as an explicitly named docblock carve-out, records the
  tri-state as an `eperm07-state` annotation *before* the assertion, then asserts the trigger at the
  file-local budget. All three knobs default to production values.

**Task 3 — `tests/scripts/e2e-run.sh`.** One preflight-confirmed run → one complete evidence
directory. Neutralises `EPERM07_*` and `CI`; records provenance; `yarn db:reset`; a readiness *poll*
(REST + Storage + the `public-assets` bucket, service-role key sourced from the environment or `.env`,
never hardcoded); spawns and owns the dev server with output redirected to `devserver.log` (the only
available D-10 mechanism); per-run reporter isolation via `PLAYWRIGHT_JSON_OUTPUT_FILE` /
`PLAYWRIGHT_HTML_OUTPUT_DIR` with no config change; captures the preflight verdict by counting the
fixed headline; deterministic process-group teardown from a trap.

## Notable observation — the instrument's first reading

On both neutral runs (production budget, no throttle, transitions on), the `eperm07-state` annotation
read:

```json
{"pathname":"/questions/ecc52540-…","headingCount":1,
 "headingText":"… [qu-opin-base-2-likert4] Base opinion 2 — Likert 4.","triggerCount":0}
```

At the instant immediately after the production settle, **the URL had already advanced while the
rendered heading still read `Base opinion 2` and `triggerCount` was 0** — the exact tri-state row
RESEARCH §R2.4-C assigns to H1, excluding H2 (`headingCount` would be 0) and H3 (heading would read
Base opinion 3) *for that instant*. The assertion still passed, because the swap landed well inside
the 2000 ms budget.

This is **not** a reproduction and **not** a confirmation of H1. It establishes only that the
URL-before-DOM window H1 depends on is real, reachable and reliably observable at production settings
— so the remaining question is what widens it past 2000 ms in ~1 run in 8. Recorded in
`138-DIAGNOSIS.md` § First instrument readings; H1 stays `live`.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] An interrupted `e2e-run.sh` exited 0**
- **Found during:** Task 3, the interrupt acceptance test.
- **Issue:** `cleanup()` exited with `$?` at trap entry, which is routinely 0 mid-run. A caller
  looping the script (plan 05's batch) would have counted an aborted run as a green, making
  criterion 3's "16 **consecutive** runs" silently wrong — precisely the honesty the ROADMAP demands.
- **Fix:** split the traps; `INT`/`TERM` set a flag and `exit 130`, and `cleanup()` refuses to report
  0 for a flagged run. Documented in the header's exit-code table.
- **Commit:** `4710c5c3b`
- **Test-methodology note found alongside it:** a background job in a non-interactive shell inherits
  `SIG_IGN` for `SIGINT`, so the first two interrupt tests proved nothing (the run simply completed).
  Re-tested with `SIGTERM`: exit 130, no listener on 5273, `ended` written by the trap, and no `exit`
  file — so an abort is distinguishable from a completed run by artifact shape as well as status.

**2. [Rule 1 — Bug] `tests/e2e-runs/` broke `yarn lint:check`**
- **Found during:** the plan's own `<verification>` step, run with self-test artifacts on disk.
- **Issue:** each run directory holds a full Playwright HTML report; its bundled minified vendor JS
  was being linted, producing thousands of errors. `.gitignore` alone was not enough — anyone who ran
  the wrapper would have found the lint gate red.
- **Fix:** added `e2e-runs` to `tests/eslint.config.mjs` `ignores` and `tests/e2e-runs/` to
  `.prettierignore`, matching the existing `playwright*` treatment.
- **Commit:** `7fda19191`

### Plan-text adjustments (no functional change)

Two acceptance criteria are grep-based absence checks that the plan's own *action* text would have
broken, because the action asks for a comment that contains the grepped token:
- `grep -c "auto: true" views.ts` must be 1, but the mandated "no precedent" comment mentioned the
  literal string. Reworded to "an auto-registered fixture has NO precedent…" — meaning preserved,
  count now 1 (the registration site only).
- `grep -c "webServer" e2e-run.sh` must be 0, but the mandated rationale explains why adding one is
  forbidden. Reworded to "a Playwright-managed frontend server entry" — the prohibition is stated as
  clearly, and the grep is now an exact check.

### Citation correction

RESEARCH §R1.8 and the plan cite the cold-start-Vite elimination as `deferred-items.md:203-210`. In
the archived copy the passage is at **209-215** (same text, six lines lower). `138-DIAGNOSIS.md`
records the accurate range and flags the discrepancy.

## Verification

| Check | Result |
|---|---|
| `yarn typecheck:tests` | exit 0 |
| `npx eslint --flag v10_config_lookup_from_file tests` | exit 0 (2 pre-existing warnings in unrelated files, out of scope) |
| `--project=eperm07-term-trigger --reporter=line` | 3 passed (~8–11 s incl. setup + teardown) |
| `--project=voter-journey --reporter=line` | 4 passed (1.0 m) — video + auto-fixture did not perturb the journey |
| `--list --grep-invert @probe` | **135 tests in 89 files** (was 134 in 88) |
| `e2e-run.sh --run-dir … --project eperm07-term-trigger` | exit 0; all 9 artifacts non-empty; `exit`=0; `preflight-failures`=0 |
| cwd-independence | identical artifact set when invoked from `/` with an absolute `--run-dir` |
| interrupt safety | SIGTERM mid-Playwright → exit 130, no listener on 5273 |
| `env-posture.txt` | `observed_workers=6`, `observed_retries=0` — read back from `results.json`, proving `CI` was absent |
| `devserver.log` | contains `➜  Local:   http://localhost:5273/` — redirection captured the server's own output |
| forensic capture live | temporary `console.warn('forensic-probe-check')` produced a `console.log` attachment containing it; probe removed before commit |
| tri-state annotation | `eperm07-state` in `results.json`, parses as JSON with `pathname`, `headingCount`, `headingText`, `triggerCount` |
| neutrality | `grep -c "?? TIMEOUTS.element"` = 1; `git diff --stat tests/tests/helpers/timeouts.ts` empty |
| artifact hygiene | `git status --porcelain tests/e2e-runs` prints nothing after a run |
| `grep -c "translateQuestionTerms"` in the spec | 0 — the dead file is not instrumented |

## Measurements for later plans

- **Hunt-spec iteration cost:** ~8–11 s per invocation including `data-setup-base` and
  `data-teardown-base`; the hunt test alone is a few seconds. D-03's economics hold — dozens of
  forcing attempts are affordable.
- **Per-run artifact size (partial U-4 datapoint):** a **single-test** run directory is **5.4 MB**,
  of which 5.3 MB is the HTML report. A 135-test run's report will be far larger; plan 05 should
  measure run 1 before committing to the remaining 15 (Pitfall 6).
- **`requestfailed.log` is noisy in dev:** ~55 `net::ERR_ABORTED` lines per run from Vite module
  prefetches. Left unfiltered deliberately — a genuinely stalled or failed module fetch is exactly
  one of the things D-10/D-11 exist to make visible, and a filter risks discarding the signal.

## Known Stubs

None. Every artifact this plan promised is implemented and exercised. The one placeholder is
deliberate and specified by the plan: `138-DIAGNOSIS.md` § Named root cause contains the literal
`PENDING — plan 03 writes this section.`, so the document's shape is fixed from the start.

## Self-Check: PASSED

Files verified present:
- `FOUND: .planning/phases/138-.../138-DIAGNOSIS.md`
- `FOUND: tests/tests/fixtures/shared/forensicCapture.fixture.ts`
- `FOUND: tests/tests/specs/voter/eperm07-term-trigger.spec.ts`
- `FOUND: tests/scripts/e2e-run.sh` (executable)

Commits verified in `git log`:
- `FOUND: d48cff03e` docs(138-01): recover U-1
- `FOUND: 77e870d94` feat(138-01): forensic capture + hunt instrument
- `FOUND: 4710c5c3b` feat(138-01): single-run E2E wrapper
- `FOUND: 7fda19191` fix(138-01): exclude tests/e2e-runs from eslint and prettier
