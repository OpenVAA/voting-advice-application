---
phase: 137-e2e-preflight-integrity-assert-the-served-application
plan: 03
subsystem: testing
tags: [negative-control, playwright, preflight, e2e-integrity, evidence, vite, lsof]

# Dependency graph
requires:
  - phase: 137-01
    provides: "the committed preflight (tests/tests/support/preflight.ts + tests/global-setup.ts, wired at tests/playwright.config.ts:99) that run 2 exercises, and the measured carry-forward that the adversary must answer 2xx at / or it is caught by clause (a) and proves nothing"
provides:
  - "137-NEGATIVE-CONTROL.md — the durable two-run negative-control evidence discharging ROADMAP criteria 1, 2 and (locally) 3"
  - "a rebuildable adversary recipe (4 files + launch command) quoted verbatim, so the control reproduces on any machine without the scratch directory"
  - "the retired check reconstructed from its archived prose, with both readings implemented, quoted verbatim"
  - "the measured invocation matrix (4 shapes, all exit 1, zero spec output) and the --list exemption recorded as deliberate"
  - "the FOUND sibling-checkout adversary captured, with an honest account of what the retired check does and does not catch about it"
affects: [137-04-docs, 137-05-phase-gate, gsd-verify-phase for phase 137]

actuals:
  tokens: 61000
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "A negative control needs BOTH halves of BOTH runs — a single PASS or a single FAIL is not evidence; the indistinguishability (run 1) and the discrimination (run 2) are the findings"
    - "Build the adversary to defeat every subordinate clause, so the load-bearing clause is isolated as the only possible discriminator"
    - "Quote the throwaway artifacts verbatim into the committed evidence instead of committing them — reproducibility without harness contamination"

key-files:
  created:
    - .planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md
  modified: []

key-decisions:
  - "Captured the FOUND sibling-checkout adversary IN ADDITION to the staged one, and measured the retired check against it too — which revealed that the retired check catches the found adversary only because it happens to be containerised (lsof reports com.docke, not node). Recorded as a limit of the found adversary, not as a second blindness demonstration."
  - "The shadow-bind two-row scenario was NOT reproducible this session (single LISTEN row on :5173; localhost and 127.0.0.1 returned the same server). Recorded as unavailable and cited to RESEARCH QUAL-1 rather than fabricated or presented as this session's measurement."
  - "Corrected a carried-forward attribution: port 54321 is supabase_kong_openvaa-local (this repo's own Supabase project_id), not the sibling checkout's container as 137-01-SUMMARY.md states. lsof reports com.docke for every Docker-published port, which is what conflated them."

patterns-established:
  - "Evidence documents in the phase directory are outside the D-14 live-doc grep scope, so they are the correct place to quote retired wording verbatim — the live docs edited by plan 04 must not carry it, or criterion 4's grep hits the sentence describing the removal."

requirements-completed: [INTEG-04, INTEG-05]

coverage:
  - id: D1
    description: "The retired process-type check PASSES against BOTH a foreign server and this checkout's server — the indistinguishability, not a single pass, demonstrates its blindness"
    requirement: INTEG-04
    verification:
      - kind: integration
        ref: "retired-check.sh 5373 -> exit 0 'RESULT: PASS (node process + title matches)'; retired-check.sh 5273 -> exit 0, identical output modulo port and PID (137-NEGATIVE-CONTROL.md §4.3)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The committed preflight FAILS against the same foreign server and PASSES against this checkout's, same session, same machine"
    requirement: INTEG-04
    verification:
      - kind: integration
        ref: "FRONTEND_PORT=5373 npx playwright test ... -> exit 1 with the full D-09 block naming clause (b); FRONTEND_PORT=5273 -> exit 0 (137-NEGATIVE-CONTROL.md §5.1, §5.2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The suite PROCEEDS after the gate opens, not merely that the gate opened"
    requirement: INTEG-04
    verification:
      - kind: integration
        ref: "FRONTEND_PORT=5273 npx playwright test --project=cold-entry-dataroot -> exit 0, 'Running 4 tests using 2 workers', 4 passed (5.5s) with two real spec bodies (137-NEGATIVE-CONTROL.md §5.3)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The preflight fires on every invocation shape and no spec body executes in any failing run"
    requirement: INTEG-05
    verification:
      - kind: integration
        ref: "no-flags, --project, --grep, --shard=1/2 against :5373 -> all exit 1, all contain E2E PREFLIGHT FAILED, all report 0 'Running N test' lines and 0 spec titles (137-NEGATIVE-CONTROL.md §6)"
        status: pass
      - kind: integration
        ref: "cd tests && npx playwright test --list with BOTH staged servers down -> exit 0, 142 tests in 93 files, preflight not invoked (documented exemption, two justifications)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A reader on another machine can rebuild the adversary and the retired check from the evidence document alone"
    verification:
      - kind: other
        ref: "137-NEGATIVE-CONTROL.md §3 carries all four adversary files verbatim + the symlink/launch commands; §4.2 carries the retired-check script verbatim with archived provenance by file and line"
        status: pass
    human_judgment: false
  - id: D6
    description: "Neither the staged adversary nor the retired-check script is committed to the test harness"
    verification:
      - kind: other
        ref: "git status --porcelain at every task boundary showed no new or modified file under tests/ or apps/; the only committed file is the evidence document (commit 0eeec1de1, 1 file changed)"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-08-13
status: complete
---

# Phase 137 Plan 03: Two-Run Negative Control Summary

**The retired "listener is a `node` process" check was measured passing against a foreign Vite server AND against this checkout's server with output differing only in port and PID, while the committed preflight failed the foreign one (exit 1, clause (b) named) and passed ours (exit 0, suite proceeded) — all four halves observed in one session and recorded verbatim in `137-NEGATIVE-CONTROL.md`.**

## Performance

- **Duration:** ~27 min wall clock
- **Tasks:** 3 of 3
- **Files modified:** 1 created, 0 modified (the harness was deliberately untouched)

## Accomplishments

- **Both halves of both runs, all observed.** Run 1a/1b: the retired check exits 0 against the staged adversary on :5373 and exits 0 against this checkout's server on :5273, with byte-identical verdict lines. Run 2a: the committed preflight exits 1 against :5373 with the complete D-09 block. Run 2b: exits 0 against :5273, and a real `--project=cold-entry-dataroot` run reports `4 passed (5.5s)` with two spec bodies executing.
- **The adversary was built to lose only to clause (b), and did.** It reproduces the `301 → /sv/` redirect shape (so clause (a) passes — `observed: HTTP 200 -> http://localhost:5373/sv/`) and serves a byte-identical `<title>Election Compass</title>` (so clause (c) passes). The failure names clause (b): the `/@fs` probe returned **403**. This is the cleanest available proof that clause (b) is load-bearing and (a)/(c) are not — and it independently justifies `preflight.ts`'s `=== 200` comparison, since the staged adversary returned 403 where the found one returned 404.
- **The invocation matrix is airtight.** No flags, `--project`, `--grep`, `--shard=1/2` — all four exit 1 against the adversary with `E2E PREFLIGHT FAILED` and **zero** `Running N test` lines and **zero** spec titles. `--list` still returns `142 tests in 93 files` with nothing serving at all, matching wave 1's baseline exactly.
- **The found adversary is captured and caught in 2 s**, printing `served module root: /opt/frontend` — the line that makes the failure self-explanatory without investigation.
- **Reproducible without the scratch directory.** All four adversary files, the symlink+launch commands, and the retired-check script are quoted verbatim in the evidence document. That is D-11 option B's entire rationale, so completeness there was treated as the deliverable.

## Task Commits

1. **Task 1 (stage the adversary + RUN 1)** — no repo artifact by design (`<files>none (scratch only)`); nothing to commit. Evidence captured to scratch and lifted into task 3's document.
2. **Task 2 (RUN 2 + invocation matrix)** — no repo artifact by design; same.
3. **Task 3 (`137-NEGATIVE-CONTROL.md`)** — `0eeec1de1` (docs), 648 lines.

The plan allocates exactly one committed artifact to this plan, so a single commit is the correct atomic granularity here rather than an omission.

## Files Created/Modified

- `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md` (648 lines) — eight sections: why the run existed, environment stamp, the adversary recipe, RUN 1 blindness, RUN 2 the catch, the invocation matrix, the found adversary, and a verdict mapping observations to ROADMAP criteria plus an explicit list of what is NOT discharged.

**No file under `tests/` or `apps/` was created or modified.** Verified at every task boundary.

## Decisions Made

- **Measured the retired check against the found adversary too, and reported the awkward result.** It FAILS there (exit 1) — but on process type, because that sibling happens to run in Docker and `lsof` reports `com.docke` rather than `node`. Run the same sibling on the host and the check goes silent. Recorded as a limit of the found adversary and as the reason the staged adversary is the load-bearing half, rather than quietly omitting a data point that complicates the narrative.
- **Did not fabricate the shadow-bind.** The plan asked for it "if Docker Desktop is still holding the IPv6 wildcard". Docker was holding it, but there was only ONE listener, so `localhost:5173` and `127.0.0.1:5173` returned the same server. The two-row state needs our own server bound to 5173 alongside the wildcard, which D-11 forbids staging. Recorded as unavailable this session, cited to RESEARCH QUAL-1, with the two substantive points (`strictPort` cannot catch it; macOS-only observation) stated without claiming they generalise.
- **Kept the `301` un-followed response in the evidence**, including its `Content-Length: 0`, because it is the concrete reason clause (a) must follow redirects: a content check reading the un-followed response has nothing to disagree with.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Factual correction] Port 54321 is this repo's own Supabase, not the sibling's container**

- **Found during:** Task 1 (precondition check — "Local Supabase is up")
- **Issue:** `137-01-SUMMARY.md` states that port 54321 is held by "the **sibling checkout's** Docker container, not this checkout's Supabase". Measured: `docker ps` shows `supabase_kong_openvaa-local`, and `apps/supabase/supabase/config.toml:5` declares `project_id = "openvaa-local"` — it is the Supabase stack for **this** repo's config. `lsof` reports `com.docke` (Docker Desktop's proxy) as the listener for every published container port, which is what made the two containers indistinguishable and produced the misattribution.
- **Fix:** Verified the stack healthy (`/rest/v1/` → 200) and proceeded; recorded the correction in `137-NEGATIVE-CONTROL.md` §2 as a callout so the confusion is not inherited again. Wave 1's conclusions are unaffected — its 54321 leg still exercised a genuinely non-Vite server and still failed correctly on clause (a).
- **Files modified:** none (evidence-document content only)
- **Verification:** `docker ps | grep 54321` → `supabase_kong_openvaa-local`; `grep '^project_id' apps/supabase/supabase/config.toml` → `openvaa-local`; `curl /rest/v1/` → 200.
- **Committed in:** `0eeec1de1`

**2. [Rule 3 - Blocking] Task 2's composite `<verify>` command could not be re-run after teardown**

- **Issue:** Task 2's `<automated>` verify chains run 2a and run 2b(i) into one command, but task 2's own action ends by tearing both staged servers down, and task 2's acceptance criteria then require `--list` to be checked with the servers down and both ports free. The two requirements cannot both hold for a single post-hoc re-run of that command.
- **Fix:** Executed each leg of the composite individually while the servers were live, and captured both to scratch logs (`run2a.log` → exit 1 with `E2E PREFLIGHT FAILED`; `run2b-cheap.log` → exit 0). The composite's semantics are fully discharged by those two captures. Nothing was weakened: both legs were run against real servers, and the exit codes are the ones the composite asserts.
- **Files modified:** none
- **Verification:** ANSI-stripped exit lines from the captures — `run2a.log: >>> exit=1`, `run2b-cheap.log: >>> exit=0`, `run2b-real.log: >>> exit=0`.

### Additions beyond the plan

**3. [Rule 2 - Missing critical evidence] The retired check was also run against the FOUND adversary**

- **Rationale:** The plan asked only for the found adversary's `lsof`/title capture. Running the retired check against it as well turned out to be load-bearing for honesty: without that measurement, a reader could reasonably assume the retired check is blind to every foreign server, which is false. It catches the containerised one on process type alone.
- **Result:** `exit 1`, `listener COMMAND = 'com.docke'`. Recorded in §7a with the explicit caveat that the catch is incidental to containerisation, not a property of the check.

---

**Total deviations:** 2 auto-fixed (1 × Rule 1, 1 × Rule 3) + 1 evidence addition (Rule 2)
**Impact on plan:** No scope creep, no acceptance criterion weakened. All three strengthen the evidence: two correct the record, one adds a data point that complicates — rather than flatters — the phase's own thesis.

## Issues Encountered

- **The shadow-bind pair was not reproducible** (see Decisions). The plan anticipated this possibility and required recording unavailability rather than fabricating; that is what was done.
- **`tee`-captured Playwright logs carry ANSI cursor-control escapes** (`\x1b[1A\x1b[2K`) that prefix the trailing `>>> exit=` marker, so a `^>>> exit=` anchored grep misses it. Stripped with `sed 's/\x1b\[[0-9;]*[A-Za-z]//g'` before extraction. Worth knowing for plan 05's full-suite capture.

## Known Stubs

None. Every run recorded in the evidence document was actually executed this session, and every quoted block is real stdout — no reconstructed or predicted output was used. Where research predictions and observations diverged (the found adversary's 404 vs the staged adversary's 403; the unavailable shadow-bind), the observation was recorded and the divergence named.

## Threat Flags

None. No source file, network endpoint, auth path or schema was touched. Against the plan's threat register: **T-137-12** (adversary spoofing) — bound loopback on :5373 only, torn down, port verified free; **T-137-13** (throwaway leaking into the harness) — `git status --porcelain` clean under `tests/` and `apps/` at every boundary, single-file commit; **T-137-14** (evidence not surviving) — committed with a full environment stamp; **T-137-15** (accepted, low) — the document contains a local username, PIDs and absolute paths, the same content the existing runbooks print, and no secrets or `process.env` values; **T-137-SC** — no package installs (the adversary symlinks the repo's existing `node_modules`).

## Verification Results

| Check | Result |
|---|---|
| Task 1 verify (`RUN1_BLINDNESS_CONFIRMED`) | pass — exit 0 / exit 0, adversary confirms `200 http://localhost:5373/sv/` |
| Adversary un-followed `GET /` | `301`, `location: /sv/`, `Content-Length: 0` |
| Titles byte-identical across :5373 and :5273 | `TITLES_BYTE_IDENTICAL: <title>Election Compass</title>` |
| RUN 2a — preflight vs adversary | exit **1**, full D-09 block, clause (b), 403 |
| RUN 2b(i) — preflight vs our server | exit **0**, no failure block |
| RUN 2b(ii) — `--project=cold-entry-dataroot` | exit **0**, `4 passed (5.5s)`, 2 spec bodies |
| Invocation matrix (4 shapes vs adversary) | all exit **1**, 0 spec-output lines each |
| `--list` with both servers down | exit 0, `Total: 142 tests in 93 files`, preflight not invoked |
| Task 3 verify (`EVIDENCE_OK`) | pass — 648 lines ≥ 120 |
| `npx prettier --check` on the document | clean |
| INTEG-06 live-doc grep (D-14 scope) | still returns nothing — criterion 4's grep unaffected |
| `git status --porcelain` under `tests/`/`apps/` | clean throughout |

## Server Cleanup

**Every server started during this plan has been killed.** Two were started: the staged adversary on :5373 (`node`, pid 78697) and this checkout's frontend dev server on :5273 (`yarn workspace @openvaa/frontend dev`, pids 78740/78783/78784). Both were terminated with `kill`, both background tasks exited on SIGTERM (143 and 144), and `lsof -nP -iTCP:5273 -sTCP:LISTEN` and `-iTCP:5373` both return nothing — verified after teardown and again after the final commit. The scratch adversary project's only footprint outside the scratch directory was a symlink to the repo's `node_modules`, which was never written through.

**The Docker container on :5173/:54321 was never stopped, restarted or reconfigured** — it was probed read-only over HTTP and inspected with `lsof`/`docker ps` only, and is still running.

## Self-Check: PASSED

- `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md` — FOUND (648 lines)
- Commit `0eeec1de1` — FOUND in `git log`, 1 file changed, 648 insertions, no deletions
- No modifications to `.planning/STATE.md` or `.planning/ROADMAP.md`
- No new or modified file under `tests/` or `apps/`
- No untracked files left behind

## Next Phase Readiness

- **Plan 04 (live docs)** — `137-NEGATIVE-CONTROL.md` §5.1 carries the rendered failure block verbatim; quote the two remedies from `tests/tests/support/preflight.ts:276-277`, not from memory. The D-14 separation is now load-bearing in both directions: the retired wording lives here, and must **not** appear in `CLAUDE.md` / `tests/README.md` / `tests/IDURA-TEST-RUNBOOK.md`. The grep was re-run this session and is still clean.
- **Plan 05 (phase gate)** — three concrete handles: (1) the ANSI-escape gotcha above will affect any `tee`-captured full-suite log; (2) `--project=cold-entry-dataroot` ran green against a fresh :5273 server with the existing DB state, so the base dataset setup/teardown chain is healthy; (3) criterion 3 is discharged **locally only** — the CI half is plan 05's observed run on both jobs, and §8 of the evidence document names that explicitly so the verifier does not read this plan as covering it.
- **For the phase verifier:** `137-NEGATIVE-CONTROL.md` §8 contains an explicit "what is NOT discharged" list (CI behaviour, full-suite green, non-macOS platforms, the `--list` guard's own failure path). Those are deliberate scope boundaries, not gaps.

---
*Phase: 137-e2e-preflight-integrity-assert-the-served-application*
*Completed: 2026-08-13*
