---
phase: 165-results-navigation-redraw
plan: 01
subsystem: infra
tags: [git-branching, evidence-document, negative-control, sveltekit, ssr, routing, measurement]

# Dependency graph
requires:
  - phase: spikes 031-034 (branch spike/results-redraw)
    provides: the redraw lab, the four validated fixes in prototype form, the forensic probes, and the reproduction rig this phase deliberately does not merge
provides:
  - "The work branch `feat/165-results-navigation-redraw`, cut off `integration/ship-12-squash` @ 4d023c587 and descended from no spike commit"
  - "This phase's eight PLAN files plus CONTEXT / RESEARCH / PATTERNS / VALIDATION / DISCUSSION-POINTS / DISCUSSION-LOG, transported onto the work branch"
  - "The four spike record directories 031-034, MANIFEST.md and CONVENTIONS.md under .planning/spikes/, each README carrying its reproduction-rig note (D-21)"
  - "165-NEGATIVE-CONTROL.md — the phase's single evidence document, opened with the environment stamp, the anchor-drift table, the six-step discipline, the two-sided scaffolding populations, the D-02 rig note, the D-09 emitter verdict and the measured cold-/results verdict"
  - "RNAV-06 true by construction on the work branch, with the command that showed it"
  - "A measured verdict for open question 4 (the cold-/results dev-server hazard): NOT REPRODUCED, with the limits of that absence stated"
  - "A measured verdict for D-09's cross-type shape: no current emitter produces it, so 165-04 enumerates four shapes, not five"
affects: [165-02, 165-03, 165-04, 165-06, 165-07, 165-08]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 16912           # chars/4 over the files this plan AUTHORED (67,648 chars)
  tokens_full_diff: 162499 # chars/4 over the ENTIRE realized diff (649,997 chars). The gap is the
                           # wholesale document transport — ~7,600 lines byte-copied by one
                           # `git checkout spike/results-redraw -- …`, authored in earlier plans and
                           # costing this plan nothing to produce. Both figures are recorded so the
                           # calibration signal is the authored number and the inflation is visible
                           # rather than hidden. Estimate was 22,500.
  tasks: 3
  commits: 5            # MEASURED: git rev-list --count 4d023c587..HEAD. 3 task commits
                        # (8fe1b952a, 179559587, ec60b2777) + the SUMMARY commit (6af2af46b)
                        # + the STATE/ROADMAP commit (b3f6e6234). A re-measure AFTER this line
                        # was written returns 6, because writing the measured number is itself
                        # a commit; that increment is the fixed point, not drift.
plan_head_before: 4d023c5875bcc616fe0c8ecca212655b452a89c0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Evidence-document form inherited from 164-NEGATIVE-CONTROL.md (D-17): stamp → 2a database state → 2b anchor drift → 3 six-step discipline → numbered findings"
    - "Two-sided population measurement: zero on the work branch WITH a positive control, non-zero on the unmerged spike branch read via `git grep <ref>` / `git ls-tree <ref>` without checking it out"
    - "Every recorded number carries the command that produced it and the git ref it was taken against"

key-files:
  created:
    - .planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md
  modified:
    - .planning/ROADMAP.md
    - .planning/STATE.md
    - .gitignore
    - .planning/spikes/031-results-nav-flicker-forensics/README.md
    - .planning/spikes/032-results-redraw-hardened-fixes/README.md
    - .planning/spikes/033-layout-shaped-results-routes/README.md
    - .planning/spikes/034-global-drawer-host/README.md

key-decisions:
  - "Branch topology re-derived at run time: 21 behind / 12 ahead, merge-base e1f1944cf — CONTEXT's 18/4 and RESEARCH's 21/7 are both stale snapshots of a moving branch. Neither document was edited; D-01's standing instruction makes recorded figures advisory by construction."
  - "D-09 verdict: a current emitter DOES NOT produce the cross-type organizations/candidate/{id} shape. 165-04's route test enumerates four shapes, not five. The URL stays routable — D-09 forbids canonicalisation and D-10 keeps the params optional."
  - "Cold-/results dev-server hazard: NOT REPRODUCED on this tree across three cookie-less cold entries, including one that reached the results SSR. Recorded as an absence, not a fix; the todo stays pending."
  - "ROADMAP.md and STATE.md were re-applied hunk-by-hunk rather than wholesale-checked-out, because the base branch had moved STATE.md by 29/26 lines since the merge-base."
  - "STATE.md milestone counters deliberately left untouched — correcting them is D-22 and must land with the REQUIREMENTS.md edit in 165-08."

patterns-established:
  - "Positive control beside every absence assertion: `test -d apps/frontend/src/lib` (exit 0, 1637 files) is what makes the two `test -e … → 1` scaffolding checks non-vacuous"
  - "Exit statuses read directly from the command's own shell status, never through a pipe — applied to the forced build and to every cold-entry observation"
  - "A grep whose returned count disagrees with the plan's implied count is recorded in the anchor-drift table rather than silently reconciled"

requirements-completed: [RNAV-06]

coverage:
  - id: D1
    description: "The work branch `feat/165-results-navigation-redraw` exists, descends from `integration/ship-12-squash` and from no commit of `spike/results-redraw` (D-01, D-02; threat T-165-05)"
    requirement: RNAV-06
    verification:
      - kind: other
        ref: "git merge-base --is-ancestor integration/ship-12-squash HEAD (exit 0) && ! git merge-base --is-ancestor spike/results-redraw HEAD (exit 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "RNAV-06 / criterion 6 is true by construction on the work branch: no `lib/spike` importer, no SPIKE marker, no labMount( site, neither scaffolding directory — asserted with a positive control proving the scan reached real source"
    requirement: RNAV-06
    verification:
      - kind: other
        ref: "165-01 Task 1 <verify>: test -d apps/frontend/src/lib && test ! -e apps/frontend/src/lib/spike && test ! -e 'apps/frontend/src/routes/(voters)/(located)/results-layered'"
        status: pass
      - kind: other
        ref: "grep -rl 'lib/spike' apps/frontend/src --include='*.svelte' --include='*.ts' | wc -l → 0; grep -rn 'SPIKE' … → 0; grep -rn 'labMount(' … → 0; positive control find apps/frontend/src/lib -type f | wc -l → 1637"
        status: pass
    human_judgment: false
  - id: D3
    description: "The base branch builds green before any phase edit, under a forced (uncached) build"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn build — exit 0 read directly from $?; 14 successful / 14 total, 0 cached; 0 lines matching 'error TS|ERROR: command finished with error'"
        status: pass
    human_judgment: false
  - id: D4
    description: "165-NEGATIVE-CONTROL.md exists in 164's form, carries the six-step discipline verbatim, and every recorded population carries its command and its ref (D-17)"
    verification:
      - kind: other
        ref: "165-01 Task 2 <verify>: heading loop over '## 1. Why this run existed', '## 2. Environment', '### 2a.', '### 2b.', '## 3. The discipline every row followed' + literal 'never through a pipe', 'git hash-object', 'git status --porcelain'"
        status: pass
    human_judgment: false
  - id: D5
    description: "The D-02 reproduction-rig note lives in the evidence document and is echoed in all four spike READMEs (D-02, D-21)"
    verification:
      - kind: other
        ref: "165-01 Task 2 <verify>: for r in 031 032 033 034; do grep -qF 'spike/results-redraw' .planning/spikes/$r-*/README.md; done"
        status: pass
    human_judgment: false
  - id: D6
    description: "D-09's cross-type question has a verdict derived from the live emitters (EntityCard.svelte's effectiveAction, its subcard mapping, EntityInfo.svelte's parent-nomination link, DEFAULT_PARAMS) rather than from a planning document"
    verification:
      - kind: other
        ref: "grep -rn \"route: 'ResultEntity'\" apps/frontend/src → 3 lines (2 real emitters + 1 doc-comment example), each a matching plural/singular pair; grep -n 'DEFAULT_PARAMS' -A 8 apps/frontend/src/lib/routes/route.ts → ResultCandidate/ResultParty force the matching plural"
        status: pass
    human_judgment: false
  - id: D7
    description: "The cold-/results dev-server hazard has a measured verdict (NOT REPRODUCED) rather than an assumption, taken at a stated HEAD, naming the two out-of-scope files"
    verification:
      - kind: other
        ref: "165-01 Task 3 <verify>: grep for '### 2c. The cold-/results hazard, measured on this tree' + 'LIVE|NOT REPRODUCED' + 'hooks.server.ts' + empty `git diff --name-only integration/ship-12-squash...HEAD -- apps packages tests`"
        status: pass
    human_judgment: true
    rationale: "The verdict token and its acceptance clauses are machine-checked, but the verdict's MEANING is a judgement about a race condition. Three cookie-less cold entries on one machine, at one HEAD, against a default seed with no candidate session, did not fire an asynchronous auth-refresh race. That is an absence, not a proof of absence, and the document says so in terms. A human should confirm that reading before anyone treats the pending todo as resolved."
  - id: D8
    description: "This plan modified no file under apps/, packages/ or tests/"
    verification:
      - kind: other
        ref: "git diff --name-only integration/ship-12-squash...HEAD -- apps packages tests → no output, exit 0"
        status: pass
    human_judgment: false

# Metrics
duration: 19 min
completed: 2026-09-23
status: complete
---

# Phase 165 Plan 01: Branch, Transport and Baselines Summary

**The phase's work branch cut clean off `integration/ship-12-squash` with zero scaffolding on it by construction, its eight plans and four spike records transported across, and `165-NEGATIVE-CONTROL.md` opened with three measured findings — two-sided populations, the D-02 rig note, and two baseline verdicts (D-09: no cross-type emitter; cold-`/results`: NOT REPRODUCED).**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-23T07:27:00Z
- **Completed:** 2026-09-23T07:46:00Z
- **Tasks:** 3
- **Files modified:** 31 (7,976 insertions, 11 deletions — of which ~7,600 lines are the wholesale document transport)

## Accomplishments

- **`feat/165-results-navigation-redraw` exists at the ruled base and nowhere near the spike branch.** Base ref resolved to `4d023c5875bcc616fe0c8ecca212655b452a89c0` and recorded in the commit message as the pre-spike form every later re-apply reads against. Ancestry asserted in both directions — `integration/ship-12-squash` IS an ancestor (exit 0), `spike/results-redraw` is NOT (exit 1) — which is threat T-165-05's mitigation and the one failure in this plan that would not have surfaced until much later.
- **RNAV-06 / criterion 6 is true by construction on day one**, and the fact is recorded with the commands that showed it: 0 `lib/spike` importers, 0 `SPIKE` markers, 0 `labMount(` sites, both scaffolding directories absent — each absence paired with `test -d apps/frontend/src/lib` (exit 0) and `find apps/frontend/src/lib -type f | wc -l` → 1637, so none of the absences is vacuous.
- **The phase's paperwork is on the branch.** All eight PLAN files plus CONTEXT, RESEARCH, PATTERNS, VALIDATION, DISCUSSION-POINTS and DISCUSSION-LOG; and `.planning/spikes/` with the four 031–034 record directories, `MANIFEST.md` and `CONVENTIONS.md` that D-23 reads from in 165-08.
- **`165-NEGATIVE-CONTROL.md` is open** in 164's form: the bolded summary and header, § 1 quoting the six ROADMAP criteria verbatim, § 2 the environment stamp with its re-derivation commands, § 2a the database state, § 2b the anchor-drift table, § 2c the cold-entry measurement, § 3 the six-step discipline verbatim, § 4 the two-sided populations, § 5 the rig note and build baseline, § 6 the D-09 derivation.
- **Two baselines settled by measurement rather than assumption.** D-09: no current emitter produces the cross-type shape, so 165-04 enumerates four shapes and the drop is recorded. Open question 4: the cold-`/results` dev-server crash did not reproduce on this tree, stated as an absence under one specific entry on one HEAD and not as a fix.
- **The base branch builds green before any phase edit** — `TURBO_FORCE=true yarn build`, exit 0 read directly from `$?`, 14/14 tasks successful with `0 cached` proving the force took effect. Any later red is attributable to this phase's own edits.

## Task Commits

Each task was committed atomically:

1. **Task 1: Cut the branch and transport the phase documents (D-01, D-02)** — `8fe1b952a` (docs)
2. **Task 2: Open the evidence doc with populations, the rig note and the D-09 derivation (D-02, D-09, D-17, D-21)** — `179559587` (docs)
3. **Task 3: Measure the cold-/results dev-server hazard and record the verdict** — `ec60b2777` (docs)

**Plan metadata:** see the `docs(165-01): complete …` commit that carries this SUMMARY.

## Files Created/Modified

- `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` — **created.** The phase's single evidence document; 165-02, 165-04 and 165-06 append to it.
- `.planning/ROADMAP.md` — the Phase-165 checklist line, the phase-detail section with its six success criteria and eight-wave plan list, and the `| 165. Results Navigation Redraw | 0/8 | Not started |` Progress row, re-applied hunk-by-hunk.
- `.planning/STATE.md` — front-matter `current_phase: "165"`, `current_phase_name`, `status: executing`, `stopped_at`; plus the Current Position prose (`Phase:`, `Total Plans in Phase: 8`) and `Current focus`. Milestone counters deliberately untouched (D-22 → 165-08).
- `.planning/spikes/031-…/README.md`, `032-…`, `033-…`, `034-…` — one-line reproduction-rig note each (D-02, D-21). The 031 and 034 notes say the probes target the lab panel on `spike/results-redraw` and will not run against the shipped tree; the 033 note says its `results-layered/` tree is superseded by D-08 and never merged.
- `.gitignore` — one entry for the GSD per-session `.planning/milestone.lock` (see Deviations).
- `.planning/phases/165-results-navigation-redraw/**` and `.planning/spikes/**` — transported wholesale from `spike/results-redraw`, unmodified except for the four README notes.

## Decisions Made

- **Branch topology is what the tree says, not what the documents say.** `165-CONTEXT.md` D-01 records 18 behind / 4 ahead; `165-RESEARCH.md` records 21 behind / 7 ahead; `git rev-list --left-right --count integration/ship-12-squash...spike/results-redraw` returns **21 / 12** at merge-base `e1f1944cf8fe102e6725efac8ccef5cc3ea1c1ad`. Both documents are dated snapshots of a branch that has since gained eight planning commits. Neither was edited — D-01's standing instruction to re-derive at run time makes the recorded figures advisory by construction — and the measured pair is recorded in the commit message and in § 2b.
- **D-09: the cross-type shape has no emitter, so it is dropped from 165-04's enumerated set.** `EntityCard.svelte:107-115` computes `entityTab` and `entity` from the card's own unwrapped `type`; its subcard mapping at `:140-155` passes only `entity` and no `action`, so each subcard's own `EntityCard` re-derives the same matching pair and the parent list's plural never reaches the child's URL; `EntityInfo.svelte:74-81` is narrowed to `ENTITY_TYPE.Organization` by the `{#if}` above it; `DEFAULT_PARAMS` forces the matching plural for `ResultCandidate` and `ResultParty`. The URL stays routable — D-09 forbids canonicalisation and redirects, D-10 keeps the params optional — so the leaf `+page.ts` doc-comment describing it stays accurate.
- **The cold-`/results` verdict is NOT REPRODUCED, recorded as an absence.** Three cookie-less cold entries on `feat/165-results-navigation-redraw` @ `179559587`: one GET at `/results` (307 to the `(located)` session gate), the same with `-L` (200 at `/constituencies`), and — on a freshly restarted server — one GET at the parameterised URL following the `[[electionTab]]` canonicalisation to a 200 at `/results/{electionId}` with 419,747 bytes of results-route SSR. The process survived every time and the recorded error text never appeared. The document says in terms that this is an absence under one specific entry on one HEAD against an asynchronous race, not a proof of a fix; the todo is left pending.
- **`.planning/STATE.md` milestone counters left alone.** Correcting them is D-22 and must land in the same commit as the `REQUIREMENTS.md` edit, which is 165-08.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The branch switch had to dispose of live orchestration state; it was preserved rather than discarded**

- **Found during:** Task 1 (branch cut)
- **Issue:** The working tree carried four uncommitted `.planning/` changes when the plan started — `STATE.md`, `config.json` (`_auto_chain_active: true`), `state.json` (the Phase-165 registration) and the untracked `milestone.lock`. All four are GSD orchestration state written by the orchestrator minutes earlier. `git switch` cannot carry a modified tracked file whose content differs between branches, so the switch was blocked until they were disposed of; discarding them outright would have silently dropped the auto-chain flag and the phase registry for every later plan in the chain.
- **Fix:** Copied all three tracked files to the session scratch area, discarded them with `git checkout -- <three named files>` (never a blanket reset), cut the branch, then restored `config.json` and `state.json` byte-for-byte onto the new branch and re-applied `STATE.md`'s Phase-165 hunks by hand per the plan's step 5. Diffed the restored files against the base versions to confirm the only deltas were the orchestrator's own (`_auto_chain_active: false → true`; the `165 / pending` phase entry and the `next` block).
- **Files modified:** `.planning/config.json`, `.planning/state.json` (both added to Task 1's commit)
- **Verification:** `diff` against the base-branch versions before restoring showed exactly the expected deltas and nothing else; `git status --porcelain` empty after the commit.
- **Committed in:** `8fe1b952a` (Task 1 commit)

**2. [Rule 3 - Blocking] `.planning/milestone.lock` gitignored so the plan's clean-tree criterion could be met**

- **Found during:** Task 1 (pre-commit check)
- **Issue:** Task 1's acceptance criterion requires `git status --porcelain` to be empty after the commit. `.planning/milestone.lock` — a per-session GSD lock carrying a pid and a session id, live for the duration of this run — is untracked and ignored by nothing, so it kept the tree dirty. Committing it would put an ephemeral pid into project history; deleting it would break the running orchestrator's lock.
- **Fix:** Added `.planning/milestone.lock` to the root `.gitignore`, beside the existing `tests/.planning/` entry, with a comment naming it as machine-local runtime state. This is the treatment the task-commit protocol prescribes for generated/runtime output.
- **Files modified:** `.gitignore`
- **Verification:** `git status --porcelain` empty after the Task 1 commit and after every subsequent commit; `git diff --name-only integration/ship-12-squash...HEAD -- apps packages tests` still empty, so the change touched no product source.
- **Committed in:** `8fe1b952a` (Task 1 commit)

**3. [Rule 3 - Blocking] `yarn install` after the branch switch**

- **Found during:** Task 1 (build verification)
- **Issue:** `apps/frontend/package.json`, the root `package.json` and `yarn.lock` all differ between `spike/results-redraw` and the new base, so the installed tree was stale for the branch about to be built.
- **Fix:** Ran `yarn install` (resolution from the branch's own committed lockfile — no package was added, removed or upgraded). It completed in under a second with only the repository's two pre-existing peer-dependency warnings (`zod` vs `openai`, `playwright-core` vs `@axe-core/playwright`), neither introduced here.
- **Files modified:** none — `git status --porcelain` stayed clean, so the lockfile was already satisfied.
- **Verification:** `TURBO_FORCE=true yarn build` exit 0, 14/14 tasks, 0 cached.
- **Committed in:** n/a (no file changed)

### Recorded, not fixed

**4. [Anchor drift] `grep -rn "route: 'ResultEntity'" apps/frontend/src` returns three lines, not the one the plan implied**

Task 2's action says to confirm that `EntityCard.svelte` is "the only construction site". It is not: the scan returns `EntityInfo.svelte:76` (a real second emitter — the parent-nomination link), `EntityCard.svelte:110` (the one the plan names) and `EntityCard.svelte:224` (a usage example inside a doc comment, not code). The second real emitter is *also* a matching plural/singular pair, narrowed to `ENTITY_TYPE.Organization` by the `{#if}` at `:73`, so the D-09 verdict is unchanged. Per this repo's content-anchor rule the measurement was recorded in § 2b's anchor-drift table rather than reconciled to the plan's number — a later reader running the same grep must not read the third hit as something newly introduced. No code and no planning document was edited to match a count.

---

**Total deviations:** 3 auto-fixed (3 blocking), 1 anchor-drift recorded.
**Impact on plan:** No scope creep. Two of the three auto-fixes exist only to let the branch switch happen without destroying live orchestration state; the third is a dependency install off the branch's own lockfile. Nothing under `apps/`, `packages/` or `tests/` was touched — proven by an empty `git diff --name-only integration/ship-12-squash...HEAD -- apps packages tests`.

## Issues Encountered

- **The prescribed cold measurement stops short of the surface it is about.** A single cookie-less GET at `/results` returns 307 to the `(located)` session gate and never renders the results page, so an absence measured there could be an absence of the surface rather than of the defect. Resolved by taking two further observations — a redirect-following entry, and a freshly-restarted-server entry at the parameterised URL that reached a 200 at `/results/{electionId}` with 419,747 bytes of results-route SSR. All three are recorded in § 2c with their commands.
- **The local Supabase stack was already running** when the plan started (`yarn db:status` exit 0 before `yarn db:start`), so per the plan's step 5 it was left running. Recorded in § 2c's environment paragraph so a later reader does not attribute the state to this plan.
- **The base carries a single squashed migration** (`00001_initial_schema.sql`), not the four-file set `164-NEGATIVE-CONTROL.md`'s stamp records. Verified identical on both `integration/ship-12-squash` and `spike/results-redraw`, so it is a property of the base branch rather than drift; stated in § 2a so a future reader seeing four files knows the runs were on different trees.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **165-02 (wave 2, the tracer) is unblocked.** The branch exists, builds green under a forced build, and carries every document the tracer plan reads. 165-02 task 1 is the first task in the phase to touch `apps/frontend/src`.
- **Two baselines are settled and need not be re-derived.** 165-04 takes the four-shape enumeration from § 6 rather than five. Any executor whose dev server dies with `Cannot use cookies.set(...) after the response has been generated` reads § 2c and attributes it to the pending todo, not to a redraw regression.
- **Standing constraints carried forward.** `spike/results-redraw` is never merged (D-02) — its production changes are re-applied by hand. `STATE.md`'s milestone counters are still uncorrected on purpose; D-22 requires that correction to land with the `REQUIREMENTS.md` edit in 165-08, which is also where RNAV-01..06 are registered.
- **No blockers.**

## Self-Check: PASSED

- `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` — FOUND on disk.
- Commits `8fe1b952a`, `179559587`, `ec60b2777` — all FOUND in `git log`.
- Task 1 `<verify>` re-run at final HEAD — exit 0. Task 2 `<verify>` re-run — exit 0. Task 3 `<verify>` re-run — exit 0.
- Plan-level `<verification>` re-run — exit 0, including the empty `git diff --name-only integration/ship-12-squash...HEAD -- apps packages tests`.
- `commits: 3` is MEASURED: `git rev-list --count 4d023c5875bcc616fe0c8ecca212655b452a89c0..HEAD` → `3`.

---
*Phase: 165-results-navigation-redraw*
*Completed: 2026-09-23*
