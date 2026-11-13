---
status: resolved
trigger: "perm-contestant-nominations 'follow: after a first save the home, the nominations view and the questions follow without a full page load' failed once in 179-01-baseline-r3 at expectSameDocument (expected true, received false)"
created: 2026-10-21
updated: 2026-10-21
---

## Current Focus

hypothesis: CONFIRMED - the press of contestant-home-continue (an SSR-rendered <a href>) landed before SvelteKit's start() reached _start_router(), so no router click listener existed and the browser followed the link itself, loading a new document
bug_class: Heisenbug (timing: hydration of a cold dev-server document vs. the first press)
test: full default suite on the committed fix (head 320bd265b)
expecting: every test passed, 0 failed / flaky / did not run, not void
blocker: none - the stack was restarted (`yarn db:stop` + `yarn db:start`, by the orchestrator under the standing stack authorisation) and its edge runtime runs again
next_action: none - 179-01-baseline-r5, the full default suite on head 85cebaded (tree-equal to 320bd265b outside .planning/), is green and is the full-suite evidence for this fix

reasoning_checkpoint:
  hypothesis: "followMainAction presses the home's main action, an <a href> in the server-rendered page, as soon as data-next-step is present; for an entity with no nomination that attribute is server-rendered, so the press can land before SvelteKit has started its router, and the browser then follows the link natively and loads a new document, which drops the window mark expectSameDocument reads"
  confirming_evidence:
    - "kept trace: click at 17.660, the first document still fetching root-layout-graph modules at 17.678, a direct text/html request for the link's href at 17.684, no __data.json before it"
    - "probe-unfixed A1 (root layout held 4 s): document request for /nominations/elections, sameDocument=false, failed at contestantNominationEditor.fixture.ts:1102 exactly as in the incident"
    - "probe-unfixed A2 (same hold, wait for the focus reset first): no document request, sameDocument=true, passed"
  falsification_test: "if A1 had passed under the hold, or A2 had failed, the press-before-router mechanism would be wrong"
  fix_rationale: "the step's precondition is a running router; the root layout's post-navigation focus reset lands only after _start_router has run, so waiting for it before the press removes the window in which the browser handles the click; the product's pre-hydration behaviour (a plain link that works without JavaScript) is correct and is not changed"
  blind_spots: "the wait reads focus, so a caller that moves focus on the page before the press would make the step fail loudly; every current caller presses after expectations only, or right after a navigation, and the project run exercises all of them"
  candidate_causes:
    - "code (test): press before hydration in followMainAction - CONFIRMED"
    - "code (app): intended hard navigation via beforeNavigate/updated - eliminated (always false in dev)"
    - "config: data-sveltekit-reload on the link - eliminated"
    - "environment: dev-server module loading slower than the test's SSR-only waits on a loaded host - contributing condition, not a separate cause"
  and_gate: "yes: the failure needs (a) a step with no hydration wait whose preceding waits are all satisfied by SSR markup AND (b) a host on which hydration takes longer than those waits; (b) is not a defect and is outside the test's control, so the fix removes (a)"

## Symptoms

expected: after markDocument on the contestant home, following the main action reaches the nominations view in the same document
actual: expectSameDocument returned false at contestantNominationEditor.fixture.ts:1102
errors: "expected true, received false" (expectSameDocument)
reproduction: intermittent; once in run tests/e2e-runs/179-e2e/179-01-baseline-r3 (505 passed, 1 failed, 42 did not run); never in other kept runs
started: first observed 2026-10-21 on head a41102abd

## Eliminated

- hypothesis: the app's own hard navigation (root +layout.svelte beforeNavigate sets location.href when `updated.current`)
  evidence: SvelteKit 2.70.3 create_updated_store returns check: async () => false under __SVELTEKIT_DEV__ (client/utils.js); the suite runs against the Vite dev server, and pollInterval is 5 min against a document 0.8 s old. The hook is also registered only from onMount, i.e. after hydration
  timestamp: 2026-10-21
- hypothesis: data-sveltekit-reload / target on the main action
  evidence: git grep finds data-sveltekit-reload only in LanguageSelection.svelte; Button renders a plain <a href> for the main action
  timestamp: 2026-10-21
- hypothesis: a server redirect produced the second document
  evidence: trace: the second document request is GET .../nominations/elections, 200 text/html, i.e. the link's own href; no 3xx in the chain
  timestamp: 2026-10-21

## Evidence

- timestamp: 2026-10-21
  checked: kept trace 179-01-baseline-r3/kept-failure/trace.zip (actions + network, wall clock)
  found: goto(load) 16.874-17.258; markDocument 17.500; expectTaskList 17.538-17.656 (3 ms per assertion: SSR state); data-next-step 17.658-17.659; click 17.660; the first document still requested root-layout-graph modules at 17.678 (SurveyButton.svelte, survey/SurveyButton.type.ts); GET .../nominations/elections text/html at 17.684 (24 ms after the click); no __data.json request and no hover preload before it
  implication: OBSERVED: the press produced a document request directly. INFERRED from the import graph (appContext.svelte.ts -> survey/popup -> SurveyPopup.svelte -> survey/index.ts -> SurveyButton.svelte): node 0 (root layout) had not finished loading, so _hydrate had not resolved and _start_router had not run
- timestamp: 2026-10-21
  checked: SvelteKit client.js start()/initialize()/_start_router()
  found: start() awaits _hydrate (loads every node module) and only then calls _start_router(), which adds the container click listener; initialize() runs afterNavigate(enter) callbacks in the same microtask chain just before; the root layout's afterNavigate schedules the focus reset (focusNavigationTarget) in a requestAnimationFrame
  implication: before _start_router a click on an SSR <a> is the browser's own navigation; once the focus reset has landed on [data-focus-on-nav] ?? h1, _start_router has run
- timestamp: 2026-10-21
  checked: +page.svelte of the entity home
  found: "An entity with no nomination is known on the server, so its page waits for nothing": for the unnominated candidate data-task-state="ready" and data-next-step="nomination" are in the SSR markup, so expectTaskList and followMainAction's data-next-step wait both pass before hydration
  implication: followMainAction has no wait that implies hydration for an unnominated entity; for a nominated one data-task-state goes ready only after client question lists load (test at :2142 is not exposed for that reason)
- timestamp: 2026-10-21
  checked: population, `git grep -n "navigation inside the application" -- tests/tests/fixtures` + callers by `git grep -n -E '\.(followMainAction|followNominationTask|clickHomeProfileEntry|clickHomePreviewEntry|pressEdit|pressButton|continueFromElections|continueFromConstituencies)\(' -- tests` and a back-walk scan to the previous navigation
  found: document-identity assertions (markDocument/expectSameDocument) only in contestant-nominations.spec.ts :2142 and :2397; steps that press an SSR <a> and claim an in-app navigation: followMainAction, followNominationTask (home), clickHomeProfileEntry, clickHomePreviewEntry (home), pressEdit, pressButton (nominations view); callers only in contestant-nominations.spec.ts and perm-no-nomination.spec.ts. continueFromElections/continueFromConstituencies press a <button onclick> after toBeEnabled on a dataRoot-derived ready flag (client-only), not an SSR link
  implication: one call site fails on the race (:2403); the others pass either way because nothing after them distinguishes the two navigations, but their documented contract (a navigation inside the application) is not guaranteed
- timestamp: 2026-10-21
  checked: hypothesis test in isolation, run tests/e2e-runs/179-debug/probe-unfixed (wrapper, --project perm-contestant-nominations, --no-db-reset, head a41102abd, tree dirty only in the spec carrying the appended probe; probe kept as 179-debug/probe-block.ts.txt and probe-unfixed.contestant-nominations.spec.ts.kept). Each probe test holds every request for /src/routes/+layout.svelte until 4 s after the first, then runs the failing test's steps
  found: exit 1, not void, 452 total / 451 passed / 1 failed / 0 flaky / 0 did not run. A1 (followMainAction as committed): "PROBE A1: holdOverBeforeStep=false documentRequestsAfterLoad=[/contestant/candidate/<id>/nominations/elections] sameDocument=false", failed at contestantNominationEditor.fixture.ts:1102 "the document shown is the one that was marked" (expected true, received false) - the incident's exact failure. A2 (poll until [data-focus-on-nav] ?? h1 holds focus, then the same followMainAction): "holdOverBeforeStep=true documentRequestsAfterLoad=[] sameDocument=true", passed
  implication: CONFIRMED (observed): a press of the main action before the home hydrates is a full document load; after the focus reset it is a client navigation. The kept A1 trace is 179-debug/probe-unfixed/kept-failure/
- timestamp: 2026-10-21
  checked: positive control, run tests/e2e-runs/179-debug/probe-fixed (same probe, fixed fixtures and helper; files kept as 179-debug/probe-fixed.*.kept)
  found: exit 0, not void, 452 total / 452 passed / 0 failed / 0 flaky / 0 did not run. "PROBE A1: holdOverBeforeStep=false holdOverAfterStep=true documentRequestsAfterLoad=[] sameDocument=true" - the step began inside the hold and pressed only after it, as a client navigation; A2 unchanged (green). perm-no-nomination (clickHomeProfileEntry, clickHomePreviewEntry, pressButton callers) and every contestant-nominations caller passed with the new waits
  implication: the fixed step is immune to the deterministic pre-hydration condition that reproduces the incident
- timestamp: 2026-10-21
  checked: commit-candidate tree (the five fix files, probe removed, spec byte-equal to its committed copy), run tests/e2e-runs/179-debug/fix-project (--project perm-contestant-nominations; files kept as 179-debug/fix-project.*.kept)
  found: exit 0, not void, 450 total / 450 passed / 0 failed / 0 flaky / 0 did not run; recorded worktree status holds only the five files
  implication: committed as 320bd265b
- timestamp: 2026-10-21
  checked: full default run on 320bd265b, tests/e2e-runs/179-debug/fix-project-full
  found: VOID - wrapper exit 8, VOID-host-suspend.txt (heartbeat gap 204117 ms, 15:12:10Z to 15:15:36Z); kept, not diagnosed
  implication: no evidence either way; made again as fix-project-full-r2
- timestamp: 2026-10-21
  checked: second attempt, tests/e2e-runs/179-debug/fix-project-full-r2 (head 320bd265b, tree clean outside .planning/ and the operator's untracked file)
  found: wrapper exit 3 before any test ran - `yarn db:start` failed; `docker info` cannot connect to the daemon socket and no Docker process exists on the host. The host is on battery and entered Maintenance Sleep / DarkWake at 20:13 and 20:52 local (pmset -g log)
  implication: not a run of the suite. Docker is not started or restarted from here (execution rules); the full run waits for Docker to be up and the host awake
- timestamp: 2026-10-21
  checked: the phase's baseline full run on the fix, tests/e2e-runs/179-e2e/179-01-baseline-r4 (head 26faad8b1, tree-equal to 320bd265b outside .planning/; worktree status: only the operator's untracked file)
  found: wrapper exit 1, not void (no marker; no Sleep entry in the run window), 548 total / 95 passed / 11 failed / 0 flaky / 54 skipped / 388 did not run, 3.6 min. Every failure is in a project that calls an Edge Function (invitation-contract, invitation-landing, contestant-email-registration x2, contestant-code-registration, contestant-password-recovery x3, data-setup-passwordless-session, contestant-entry-scan entry-login, contestant-journey): the code check answered 503 `name resolution failed` (Kong's answer when its upstream is absent), inviteByEmail's link request answered 503, and six link witnesses read neither sent nor not-sent. perm-contestant-nominations and perm-no-nomination did not run (97 and 68 did-not-run)
  implication: OBSERVED: container supabase_edge_runtime_openvaa-local was Exited (255) through the whole run (StartedAt 13:35:21Z, FinishedAt 18:51:44Z, restart policy `no`; every other service of the stack Up since 18:51:46Z, restart policy `unless-stopped`); the run's db-start.log lists `Stopped services: [supabase_edge_runtime_openvaa-local supabase_pooler_openvaa-local]`, where 179-01-baseline-r3 and 179-debug/fix-project list only the pooler. INFERRED: the host restarted (powerd started 21:14:43 local), Docker came up at 18:51:44Z and marked the runtime exited, and `yarn db:start` on an already-running stack does not start a stopped edge runtime. Not evidence about the fix either way; the full-suite criterion is still NOT met
- timestamp: 2026-10-21
  checked: after the orchestrator's `yarn db:stop` + `yarn db:start` (every container of the stack Up, edge runtime included, before the run), the phase's baseline full run tests/e2e-runs/179-e2e/179-01-baseline-r5 (head 85cebaded, tree-equal to 320bd265b outside .planning/; worktree status: only the operator's untracked file; db-start.log lists only the pooler as stopped)
  found: wrapper exit 0, not void (no marker; no Sleep entry in the run window, 22:01:26-22:14:22 local, on battery 76 % to 65 %), 548 total / 548 passed / 0 failed / 0 flaky / 0 skipped / 0 did not run, 124 projects, 12.8 min; `179-verdict.mjs e2e 179-01-baseline-r5` PASS. perm-contestant-nominations 97/97 passed and perm-no-nomination 68/68 passed; the incident's test (contestant-nominations.spec.ts:2377 "follow: after a first save ...") ended `expected`, its one result `passed`
  implication: OBSERVED: the full-suite criterion is met on the committed fix: every caller of the six fixed steps ran and passed in a complete, green, non-void full default run

## Resolution

root_cause: test-side hydration race. contestantEntityHomePage.followMainAction pressed the home's main action, an <a href> in the server-rendered page, after waiting only for data-next-step, which for an entity with no nomination is server-rendered. On a cold dev-server load the press could land before SvelteKit's start() had loaded the root layout's module graph and called _start_router(), so no router click listener existed and the browser followed the link itself: a new document, which loses the window mark expectSameDocument reads. The product behaves correctly (a plain link works before hydration). Observed: the kept trace's timeline and the probe's A1/A2 outcomes. Inferred: that the router had not started at 17.660 in the incident run (from the import graph of the module still loading at 17.678); the probe reproduces the same failure under a held root layout.
fix: helper waitForNavigationFocusReset(page) in tests/tests/helpers/navigation.ts (exported from helpers/index.ts) - polls until [data-focus-on-nav] ?? h1 holds focus, the root layout's afterNavigate focus reset, which lands in a frame after _start_router. Called before the press in every step that presses a server-rendered link and documents the press as a navigation inside the application: followMainAction and followNominationTask (contestantEntityHomePage), clickHomeProfileEntry and clickHomePreviewEntry (contestantEntityPages), pressEdit and pressButton (contestantNominationsPage). Commit 320bd265b.
oracle_type: specified (the test's own expectSameDocument: the window mark survives every in-app navigation)
population: steps whose docstring says "navigation inside the application" (`git grep -n "navigation inside the application" -- tests/tests/fixtures`), each caller found by `git grep -n -E '\.(followMainAction|followNominationTask|clickHomeProfileEntry|clickHomePreviewEntry|pressEdit|pressButton|continueFromElections|continueFromConstituencies)\(' -- tests` and walked back to its previous navigation. Six steps press a server-rendered <a> with no wait that implies hydration (fixed); continueFromElections/continueFromConstituencies press a <button onclick> only after toBeEnabled on a client-only ready flag (not exposed, unchanged); navMenu.goHome/openNominations open the drawer through a toPass retry that itself requires hydration (not exposed, unchanged). Document-identity assertions: two tests (:2142, :2397); only :2397's first press was exposed. Callers: contestant-nominations.spec.ts and perm-no-nomination.spec.ts only.
verification:
  - negative control (hypothesis test, unfixed fixtures + probe): 179-debug/probe-unfixed - exit 1, 452 / 451 passed / 1 failed (PROBE A1, on the expectation at contestantNominationEditor.fixture.ts:1102) / 0 flaky / 0 did not run, not void
  - positive control (fixed fixtures + the same probe): 179-debug/probe-fixed - exit 0, 452 / 452 passed, not void; A1 began inside the hold, pressed after it, no document request
  - commit-candidate tree (fix only, no probe): 179-debug/fix-project - exit 0, 450 / 450 passed / 0 failed / 0 flaky / 0 did not run, not void; worktree dirty only in the five committed files
  - full default suite on 320bd265b: 179-debug/fix-project-full - VOID (exit 8, heartbeat gap 204117 ms), kept, not diagnosed; 179-debug/fix-project-full-r2 - exit 3 before any test (yarn db:start: Docker daemon not running); 179-e2e/179-01-baseline-r4 - exit 1, not void, 11 failed / 388 did not run, every failure in an Edge Function caller while the edge runtime container was stopped (the nominations projects did not run); after the stack's restart, 179-e2e/179-01-baseline-r5 (head 85cebaded, tree-equal to 320bd265b outside .planning/) - exit 0, not void, 548 / 548 passed / 0 failed / 0 flaky / 0 did not run; perm-contestant-nominations 97/97 and perm-no-nomination 68/68 passed - the full-suite criterion is met
files_changed: [tests/tests/helpers/navigation.ts, tests/tests/helpers/index.ts, tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts, tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts, tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts]
not_changed: the three spec-local copies of the same focus-reset wait (analytics-gpc.spec.ts, voter-prefs-tracking.spec.ts, voter-tracking-consent-free.spec.ts) could now import the helper; left as they are, outside this defect
