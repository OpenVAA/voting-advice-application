# Phase 176 — the orchestrator's standing dispatch rules

Every executor of plans 176-07 to 176-19 reads this file whole, beside its own `176-NN-PLAN.md` and
`176-EXECUTION-RULES.md`. Where this file and a plan disagree, stop and report.

## The checkout

- Working tree: `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`, a linked git
  worktree on branch `feat/entity-signup-multi-grant`. Run every command from it; never `cd` to
  another checkout. From plan 07 on each plan is alone in its wave.
- Commit by pathspec only, from a bash script or with quoted paths:
  `git add <paths> && git commit -m "…" -- <paths>`. An unquoted pathspec variable does not
  word-split in zsh, the host shell. Never `git add -A`, `git add .`, `git commit -a` or `git stash`.
  A commit follows a gate only on that gate's exit 0 (`&&`, never `;`). On `index.lock` wait a few
  seconds and retry.
- Normal commits: hooks are disabled in this worktree by a local `core.hooksPath` override; do not
  pass `--no-verify`. Each message ends with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `CAND-APP-PLAN.md` is the operator's untracked file and stays untracked.
- Nothing under `tests/e2e-runs/` is ever deleted, your own run markers included: write to a new
  name, never `rm` a marker.
- Executors edit none of `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `CLAUDE.md`.
- Required order at the end: write `176-NN-SUMMARY.md`, commit it by pathspec, and only then send
  the final message.

## Reading — keep it inside a budget

An executor of plan 176-10 used most of its context on the reading before it had edited a file, and
handed the plan back unfinished. Read what the work needs, not everything that exists.

- **Whole:** this file, your `176-NN-PLAN.md`, and `176-EXECUTION-RULES.md`.
- **Summaries before yours: only their sections for later plans**, found by heading
  (`grep -n "^#" 176-NN-SUMMARY.md`, then read that section), plus the whole of any summary your plan
  names as a dependency in `depends_on` or that a dispatch names. Do not read the other summaries
  whole.
- **`176-CONTEXT.md`, `176-UI-SPEC.md`, `176-RESEARCH.md`, `176-PATTERNS.md`, `176-VALIDATION.md`:
  only the decisions, sections and rows your plan cites**, found by their ids or headings with
  `grep -n`. Never read these files whole; each is 900 to 1,300 lines.
- `176-BASELINE-FACTS.md`, section "Operator rulings as read": C1 to C6 and D1 each stand at the
  recommended option.
- `CLAUDE.md` is already in your instructions. Read `.agents/code-review-checklist.md` when you reach
  the plan's checklist step, and a project skill's file (`components` with `context-reactivity.md`,
  `database`, `data`) only when your files fall under it.
- Source and test files: read the ones you change and the ones your plan's `<read_first>` names. For
  a large spec, read the tests you touch, found by title with `grep -n`, not the whole file.
- Before writing a spec step that depends on seeded data, read the part of the dataset's template
  that seeds it and name the field the step reads.
- **The "CONTEXT WARNING: Usage at NN%" hook line is not about you.** It is printed after tool
  calls from a file keyed by the orchestrator's session and reports the orchestrator's context, not
  yours; it does not move with your reading. Two executors of this phase read it as their own and
  handed a plan back with nothing done. Ignore it. Judge your room by what you have actually read
  and written: the reading above, kept to its budget, leaves ample room for a three-task plan. Hand
  back early only if you are truly running out — the model's own truncation warnings, not that hook
  — and then at a clean boundary, as "Stopping" below says.

## Tests and evidence

- Tests first, red before the change, where the plan lays that out. A red report counts when every
  failure is an expectation, not an import, compile or timeout failure.
- **No commit turns a committed E2E test red.** A browser-observable change is held in the working
  tree through a green run of the uncommitted tree, then committed together with the fixtures and
  specs that match it. A red control runs on an uncommitted tree directly through
  `tests/scripts/e2e-run.sh`, is judged by `176-verdict.mjs control … --red`, and counts only when
  exactly the named tests are red, each for its expectation. If interrupted, apply the plan's resume
  rule (`git checkout --` on the named files only) so that the tree left is clean and the committed
  suite green.
- **The E2E hard rule is cardinal.** A failed, flaky or did-not-run test in a full run is a failure
  to diagnose at its root cause and fix: never retried until green, never skipped, never annotated.
  An intermittent failure is a real defect in the test or the code. Exit status 8 with
  `VOID-host-suspend.txt` is the only void: keep the directory and run again under a new label. A
  red run on a test nothing in the plan can have touched: check `pmset -g log` for Sleep and
  DarkWake entries in the window before concluding anything, and report what was found either way.
- An axe finding or a width overflow on a surface this phase builds is a defect in the surface. Fix
  the surface; never exclude a rule, drop a scan or loosen a tolerance. A finding on a surface the
  phase did not change is reported with its evidence, not fixed.
- Every E2E run goes through the drivers and the wrapper, which start their own fresh server. Do
  not start a dev server, and do not trust a result from a server that was running while files were
  edited.
- The plan's acceptance criteria and verify commands are the contract. Populations are derived at
  run time. Code is never bent to a search, and a check is never edited to pass. Write each
  `<automated>` block to a script file taken byte for byte from the plan and run it with `bash`; a
  script that holds a long gate is launched in the background and polled. When a verify stage has a
  real defect, run its intent by a correct command of your own, record both exit statuses, and
  report it.
- Every exit status is read from the command itself, never through a pipe.
  `~/.nvm/versions/node/v24.21.0/bin` goes first on `PATH`. A secret-read hook blocks commands that
  name `.env`; do not work around it.
- `yarn assert:comment-hygiene` runs on the working tree, with new files staged, before every commit
  that touches a comment. Comments and test titles describe the code as it is: no history, and no
  decision, plan, proposal or assumption ids. Exported symbols and props get TSDoc. No page, layout
  or menu branches on the entity's type; per-type differences live in the descriptor.

## The stack and the host

- `yarn db:reset` runs only through the gate driver or the determinism batch, each after its
  in-flight check. Never restart Docker or the Supabase stack: this host runs a second, unrelated
  Supabase stack.
- **A refused disk guard stops the plan.** The drivers refuse below 13.8 GiB free in the Docker VM.
  Their own `docker builder prune -af` is the only remedy. Do not remove images, volumes or files,
  and do not restart anything: stop at a clean boundary and report the reading. Read and record the
  free space before each long run.
- Before any E2E run or long gate, `pmset -g batt`: no run is started on battery below 30%.
- pgTAP runs only through the gate driver, which resets first. On a database a full E2E run has
  touched, `39-invitations.test.sql` test 238 is red (it counts `private.invitation_link_witness`
  whole, and no teardown removes those rows). Met anywhere else, that is the known finding, not a
  regression.

## Stopping

On a real blocker, or when context is running short before the plan is finished, stop at a clean
commit boundary — clean tree, committed suite green — and report exactly what is done, what is not,
the task and step reached, and the state of the tree and the database. A clean partial hand-back is
better than a truncated one.

## The final message

Tasks done with their commits; each verify's exit status; the control and green-proof verdicts where
the plan has them; the gate rows; each full run's totals, its per-project comparison with its
predecessor and the Docker VM's free space before it; any void or red run and its cause; every axe
finding or overflow and what was done; deviations; anything not done or not verified; the database's
state; and `git status --short`.
