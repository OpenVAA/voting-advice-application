# Phase 178 — the orchestrator's standing dispatch rules

Every executor of plans 178-01 to 178-24 reads this file whole, beside its own `178-NN-PLAN.md` and
`178-EXECUTION-RULES.md`. Where this file and a plan disagree, stop and report.

## The checkout

- Working tree: `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`, a linked git
  worktree on branch `feat/entity-signup-multi-grant`. Run every command from it; never `cd` to
  another checkout. Each plan is alone in its wave.
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
- Required order at the end: write `178-NN-SUMMARY.md`, commit it by pathspec, and only then send
  the final message.

## Reading — keep it inside a budget

An executor of plan 176-10 used most of its context on the reading before it had edited a file, and
handed the plan back unfinished. Read what the work needs, not everything that exists.

- **Whole:** this file, your `178-NN-PLAN.md`, and `178-EXECUTION-RULES.md`.
- **Summaries before yours: only their sections for later plans**, found by heading
  (`grep -n "^#" 178-NN-SUMMARY.md`, then read that section), plus the whole of any summary your plan
  names as a dependency in `depends_on` or that a dispatch names. Do not read the other summaries
  whole.
- **`178-CONTEXT.md`, `178-UI-SPEC.md`, `178-RESEARCH.md`, `178-PATTERNS.md`, `178-VALIDATION.md`:
  only the decisions, sections and rows your plan cites**, found by their ids or headings with
  `grep -n`. Never read these files whole; each is 900 to 1,300 lines.
- `178-BASELINE-FACTS.md` (written by plan 178-01), its section on the operator's rulings as read. The
  operator's round for this phase is section H of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`,
  named by `178-OPERATOR-ROUND`, read by the operator on 2026-10-11: H1 (J1) is answered (b) and the
  plans build (b); H38 (PL-29) is answered (a) by name; every other item of section H and all thirty
  proposals of `178-UI-SPEC.md` are untouched and stand at their ★.
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
  `tests/scripts/e2e-run.sh`, is judged by `178-verdict.mjs control … --red`, and counts only when
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


## What changed on the tree after the plans were written (2026-10-11)

- **Phase 177 is complete.** Its report was verified `human_needed` with no gap; the operator accepted
  its thirteen human-verification items on 2026-10-12 and the report's status is `passed` (frontmatter
  `operator_acceptance`). Its closing full run is `tests/e2e-runs/177-e2e/177-21-final` (444 of 444 in
  116 projects, code head `f71107820`). That head differs from the base commit by two lines of two docs
  pages, so plan 178-01 makes a baseline run of its own, as its Task 1 lays out.
- **The local Supabase stack is shared with another worktree.** `voting-advice-application-infra` has
  the same project id and ports. A session there is told to stay off this stack, which is read from
  its notes and not observed. When a driver's in-flight check or its preflight shows a run or a server
  that is not yours, do not reset over it: stop and report.
- **Phase 177.1 is not on the tree.** `create_invitations` has the two-argument signature the plans
  were written against.
- **The reading of section H was applied by quick task `261011-ujg`** (commits `7babaf8f5`,
  `7f8b893fa`, `d2c890bf7`): plans 178-01, 178-04, 178-14, 178-24, `178-EXECUTION-RULES.md` and
  `178-VALIDATION.md` state J1 (b). `178-RESEARCH.md` § J1, `178-PATTERNS.md`, `178-CONTEXT.md` and
  the UI contract's `BasicUserData` row still describe the (a) form; the plans and the rules are the
  later reading and win. The reading command plan 178-01 writes takes exactly a ticked (b) on H1 as
  applied and halts on every other state of it.
- **The verify blocks of plans 178-01, 178-04 and 178-14 that the quick task rewrote were parsed, not
  run.** A real defect in one is handled as "Tests and evidence" says: run its intent by a correct
  command, record both exit statuses, report it.
- **Under J1 (b) `passwordSet` is required on `BasicUserData`.** The type check will name typed
  fixtures outside plan 178-04's `files_modified` (`gates.test.ts`, `layout.server.test.ts`,
  `contestantContext.svelte.test.ts` hold such objects today); 178-04 Task 3 step 5 covers them.
- **A standing unhandled error older than this phase**: `TypeError: Cannot read properties of
  undefined (reading 'map')` in `Input.svelte` appears once in the dev-server log of every full run.
  It is filed as a todo and is not this phase's finding.

## After 178-01 (for every later plan)

- **Baseline:** `$(cat $P/178-BASELINE)` is `tests/e2e-runs/178-e2e/178-01-baseline` — 444 passed in 116
  projects, 0 failed, flaky, skipped or did not run.
- **Seventeen gate rows.** `178-verdict.mjs gates` without `--rows` expects seventeen; a full set
  includes `stack`, which needs the stack up.
- **The `stack` row is red by design between a tree change and the restart that serves it**: from the
  commit that adds `'request-recovery'` to `contract.ts` (178-06) until the restart of 178-07, and for
  `[auth]` keys between the edit and the restart of 178-20. Plans 178-04 and 178-06 close on the
  database rows, which do not include `stack`.
- **For 178-06:** every stack-probe run sends one `request-recovery` for the default project with a
  fresh `r178-probe-stack-recovery-<epoch>@test.openvaa.local` address and reads `EQUAL` only on 200
  with exactly `{"accepted":true}` and a quoted `'request-recovery'` literal in `contract.ts`. The
  probe's cleanup deletes auth users only: either the recovery function leaves no throttle row for an
  unknown address, or the probe gains that cleanup in the plan that adds the function.
- **For 178-20:** the probe has `config_value <table> <key>` and `compared <what> <running> <tree>`;
  the `otp_expiry` row is two lines beside the password-length row.
- **`control --full`** takes `--same-projects-as` and `--except` as `e2e` does and only with `--full`;
  every dirty path must be covered by a `--dirty-only`; `--full` beside `--project` or `--setup` is a
  usage error.
- **`178-bankauth.sh <label-stem>`** runs only the stack probe after its restore, not the Phase 170
  redirect allow-list probe; plan 178-24 runs that probe itself if it wants it.
- **Reading a run's progress:** `LC_ALL=C grep -a -o -E '\[[0-9]+/[0-9]+\]' <run>/stdout.log | tail -1`
  (`tr` fails on the log with "Illegal byte sequence").
- **Power:** one full run takes about 13 minutes and about 13 battery points when the host is unplugged.
- The fourteen gate rows copied from Phase 177 have not been run through the new driver, and
  `178-bankauth.sh` has not been run at all; the first plan that does either is the first observation.

## After 178-02 (the first probe)

Read `178-02-SUMMARY.md` § for later plans and `178-PROBE-FINDINGS.md` for the row your plan rests on.
In short:

- **`P7: difference` — assumption A9 did not hold.** Password sign-in answers 400 `invalid_credentials`
  in all three cases, but the timings do not overlap (medians about 6 ms for no account, 13 ms for an
  account with no password, 65 ms for a wrong password; loopback, nine attempts a case). Plan 178-23's
  conditional fourth residual applies. No test or text may claim the sign-in screen's timing is uniform
  (178-13).
- **`P4: held`, first branch**: no `refreshSession()` in `_setPassword` and no full page load (178-14,
  178-19). The comment in `_setPassword` of `supabaseDataWriter.ts` that says `updateUser` rotates the
  access token is contradicted by the probe; the first plan to touch that comment brings it in line.
- **`P2-TYPE: interchangeable`**: the service accepts a sign-in token presented as `recovery`. The
  reset page's load must not read "arrived with `type=recovery`" as "asked for a recovery" (178-19).
- **A superseded and a spent token are refused alike**, 403 `otp_expired` (178-06, 178-10).
- **For 178-20:** the probe's cleanup deletes every `r178-probe-` user at the end of every run, so the
  `p5pre` account that must survive to the `p5` run needs an address outside that prefix or a cleanup
  that spares it; writing `p5` and `p6` makes plan 178-02's Task 1 verify (`p5` exits 2) stop holding.
- **The probe refuses** while any `started` without `ended` exists under `tests/e2e-runs/` and while
  anything listens on the E2E port. Run it between E2E runs.

## After 178-03 (the dataset)

- **Predecessor label for the next full run:** `178-03-close` (444 tests, 116 projects, head
  `89588f806`). The first five of the fourteen gate rows copied from Phase 177 (typecheck, lint, unit,
  build, format) have now run through the new driver, green.
- **"Unanswered by the operator" is no longer true of any item.** The plans' sentences that call a J or
  PL item unanswered were written before the reading of 2026-10-11. In a summary write "read by the
  operator on 2026-10-11 and standing at its recommended option" (J1: answered (b); PL-29: answered
  (a)), not "unanswered".
- **For 178-05, check before the matrix is enforced on the server:** three perm datasets serve
  organizations but state `organization: []` — `perm-organization-editing`, `perm-no-nomination` and
  `perm-contestant-nominations`. Once the condition lands, an open organization invitation in those
  projects reads as absent. The callers of the seeding steps and of `inviteByEmail` are
  `invitationFlow.fixture.ts`, `invitation-contract.spec.ts`, `invitation-landing.spec.ts`,
  `contestant-journey.spec.ts` and `perm-localisation-positive.spec.ts`; which entity type each
  invites, and how those datasets' editors are registered, has not been read.
- **For 178-12 and the spec plans:** the fixture's `DEDICATED_ROWS` still maps `candidate` and
  `organization` to the two invitation rows; the five new external-id constants
  (`test-e2e-base-or-registration`, `-ca-registration`, `-ca-recovery`, `-ca-scan-open`,
  `-ca-scan-used`) are read by nothing yet, so the seeding steps need a way to name a reserved row.
- **An address prefix a plan adds goes into `INVITATION_ADDRESS_PREFIXES`.** `password-recovery-` and
  `passwordless-session-` differ only at the ninth character: a cleanup matching on `password` alone
  would take both.
- `tests/README.md` § the `e2e/base` dataset already states the widened matrix and the five rows
  (178-23 need not).

## After 178-04 (the password fact)

- **No full run was made by 178-04** (its ruling 4). The predecessor label is still `178-03-close`, and
  `178-05-close` is the first full run over this schema and adapter: every signed-in load of both apps
  now makes one more `get_user_entities` read and is rejected when it fails. A wall of `loginFailed`
  sign-outs, or Admin pages with no user, in that run points at 178-04 first.
- **`private.caller_password_set ()` answers null where no caller is signed in**, and the adapter
  throws on null. `passwordSet` is always a boolean on what the writer returns.
- **A `private` function defined after the blanket grant in `301-auth-functions.sql`** needs its own
  `REVOKE … FROM PUBLIC, anon, authenticated` and `GRANT`.
- **A catalog assertion on a function that may not exist yet** reads `pg_proc` by schema and name and
  compares with a literal; naming it as a `regprocedure` or calling it raises, and the file errors
  instead of failing.
- **Any test that runs the real writer over a stubbed client** answers
  `rpc('get_user_entities', { p_project_id })` by name with `{ entities: [], password_set: <boolean> }`.
- **For 178-14:** eight test files hold a user object without `passwordSet` and will read `undefined`
  once a gate or view reads it from page data — six untyped `USER` literals in the
  `*.tracking.test.ts` files under `routes/contestant/(protected)/`, `gateFocus.svelte.test.ts` and
  `termsOfUseLayout.svelte.test.ts`. The protected layout's load now makes two `get_user_entities`
  reads for an ungated user. The `_setPassword` comment states probe row P4's finding for a Node
  client; if the tracer shows a browser client rotating the token, that is the sentence to correct.
- **For 178-18:** the public configuration answers four values and `supabaseDataProvider.ts` still
  copies three; its comment and its *Limitation* paragraph are out of date.
- **For 178-23, documentation now out of date:** `.claude/skills/database/SKILL.md` (the public
  configuration's "exactly" three members, § 9 on `get_user_entities`, the pgTAP counts — now 2328
  assertions), `schema-reference.md` (rows for `contestant_app_public_config`, `get_user_entities`,
  `private.user_password_set` now in file 301, and no row for `private.caller_password_set`),
  `rls-policy-map.md` ("the three values as stored"), and the `apps/docs` pages
  `backend/authentication`, `contestant-app/entity-selection` and `configuration/app-settings`.
- **A reset the plan's own steps lay out on an uncommitted tree** (the driver refuses one) may be run
  directly, after the driver's in-flight check made by a bash script of your own and a look at the
  E2E port. That is the one exception to "only through the gate driver".
- **Wait for a gate set's `exit` marker before touching the tree**, and put every shell loop in a
  script run with `bash` (zsh does not word-split an unquoted variable).
- A Vite server of an unrelated repository listens on `[::1]:5173`. Leave it alone; this suite's port
  is 5273.
- Timings: six database rows 45 s, seven closing rows about 3.5 min, a full pgTAP run under 10 s,
  `yarn db:reset` about 30 s.

## After 178-05 (the matrix on the server)

- **Predecessor label for the next full run:** `178-05-close` (444 tests, 116 projects, head
  `9c0f92616`). It was the first full run over 178-04's read and found nothing of 178-04's.
- **Any plan seeding a candidate or organization invitation:** the project's stored matrix must allow
  the row's mode for that type. Otherwise the code check answers `unknown`, the link request's witness
  reads `not-sent` and the claim is empty. Project-scope, faction and alliance rows are never judged.
- **A project that stores no matrix honours no candidate or organization invitation** (D-05 as
  written): `seed.sql`'s default project stores `{}`, and a project made by a bare
  `INSERT INTO public.projects` has no settings row. A pgTAP file with projects of its own writes a
  matrix in its setup; the `UPDATE app_settings` near the top of file 39 is the form (178-06, 178-20).
- **For 178-06:** if `recovery_link_request` reads open invitations for the address,
  `private.invitation_mode_allowed (i)` is the conjunct to ask. New `private` functions in `506` need
  their own `REVOKE … FROM PUBLIC, anon, authenticated`.
- **Red pgTAP over a function that does not exist yet:** read the catalogue by name, or run over a NULL
  stub created in the local database and dropped again
  (`tests/e2e-runs/178-unit/178-05-pgtap-red.sh` is the form); the stub is never in a tree file.
- **For 178-12 and 178-17:** the settings read is per call and nothing is cached, so a spec that
  switches a mode off is answered under the new matrix at once.
- **For 178-16 and 178-18:** `listedRegistrationModes` stays a reading of
  `getEffectiveRegistrationModes`, which a truth table now pins to the server's rule.
- **The three perm datasets with `organization: []` seed no invitation**; their editors are registered
  by `forceRegisterUser`. Nothing to change there.
- **For 178-23, more documentation now out of date:** the Publishers' Guide `app-settings` page's
  sentence "An invitation created by an administrator works whatever is set here: an invitation is not
  a registration mode" (false for candidate and organization invitations); the database skill's § 10
  and pgTAP counts (45 files, 2394 assertions, file 39 `plan (293)`); `schema-reference.md` has no
  rows for the three new functions; the `apps/docs` pages `backend/authentication`,
  `backend/edge-functions` and `contestant-app/pre-registration-and-invitation`.

## After 178-06 (the recovery request and its mail)

- **No full run was made by 178-06.** The predecessor label is still `178-05-close`; `178-07-close` is
  the first full run over this schema and these templates.
- **For 178-07, calling the function:** `rpc('recovery_link_request', { p_project_id, p_email })` as
  the service role; generated type `Returns: Json`. The answer is null or `{ email, mail }` with `mail`
  exactly `'recovery'` or `'sign-in'`; `email` is trimmed and lower-cased and is the address to mail.
  A non-null answer has taken the `link:` slot: send exactly one mail of that kind, or call
  `invitation_link_release(p_project_id, p_email)` with no code. The `sign-in` arm's address has an
  open invitation and may have no account yet, so it needs what `request-link` does for a first-time
  invitee; `recovery` is always an existing, confirmed account.
- **For 178-07, the texts:** `renderRecoveryMail(locale, link)` returns `{ subject, text, html }`; the
  locale type is still `SignInMailLocale`; `RECOVERY_LINK_EMAIL_SUBJECT` in `invitationConstants.ts`
  equals the English subject. The reworded sign-in sentence is in the tree and not served until the
  restart.
- **`contract.ts` is untouched by 178-06.** The `stack` row turns red with 178-07's own commit that
  adds `'request-recovery'`, not before. The stack probe needs no throttle cleanup:
  `recovery_link_request` returns null before the slot is asked for when the address has neither a
  grant holder's account nor an open, allowed invitation (asserted at the database; inferred for the
  probe until 178-07 serves the operation).
- **A SECURITY DEFINER function added to `public` for the service role alone** (178-20, if
  `send_email_hook` is one) goes by name into the third census of `07-rpc-security.test.sql` section
  8c, or the service role's EXECUTE is revoked. A function named `invitation_…` also moves two
  expectations of file 39's Section 21.
- **`contestantApp.login.forgotPassword` is read by `mailTemplates.test.ts`** from all seven
  catalogues: each recovery mail must hold that label once in its text and once in its html. A plan
  that rewords, moves or removes the key (178-13, 178-18, 178-23) changes the mail in the same commit
  or re-points the test.
- **For 178-19:** a mail's body can be asserted only after the stack restart.
- **The `lint` and `typecheck` gate rows do not read `apps/supabase/supabase/functions`** (no `lint`
  script and no `tsconfig.json` under `apps/supabase`; Phase 180 owns that). A plan that edits a
  function file runs `eslint` on its files and type-checks them ad hoc, and records both statuses.
- **pgTAP now:** 45 files, 2431 assertions; file 39 `plan (329)`, file 07 `plan (40)`.
- **For 178-23, more documentation now out of date:** the database skill (§ 10 names six helpers and
  nothing of the recovery request or the shared slot; § 4 describes two censuses, now three; Service
  Patterns § 1; the counts), `schema-reference.md` (no rows for `recovery_link_request` and
  `private.email_holds_grant_in_project`), `rls-policy-map.md`, the `apps/docs` pages
  `backend/authentication` and `backend/edge-functions`, and `apps/supabase/README.md`.
- **Met in the catalogues and not changed** (not this phase's to fix unless a plan touches the key):
  Estonian `login.forgotPassword` uses *salasõna* formally while `common.password` uses *parool*;
  Swedish `common.login` and `login.title` read "Registrera dig"; French and Luxembourgish
  `login.haveRegistrationCode` are in English.

## After 178-07 (the recovery operation)

- **Predecessor label for the next full run:** `178-07-close` (444 tests, 116 projects, head
  `503a24fd9`). It was the first full run over 178-06 and over the function, and found nothing.
- **Correction to "After 178-01": a function's source is served without a restart on this host.**
  `config.toml` sets the edge runtime's policy to `per_worker`, which reloads a function when a file
  changes; the `stack` row's function line read EQUAL before 178-07's restart. Whether `[auth]` keys
  and the functions' environment behave the same is not tested: 178-20 reads the stack probe before
  its restart to learn it, and assumes they need one.
- **Never print the tail of a `yarn db:start` log**: its last lines are the stack's API keys (the
  CLI's fixed local demo keys). Read the `.exit` marker and `docker ps`.
- **A permitted restart** is `yarn db:stop` then `yarn db:start`, after the in-flight check; it touches
  the `openvaa-local` containers only. Only a plan whose steps lay one out makes it.
- **The wire (178-08):** `{ operation: 'request-recovery', project_id, email, locale?, witness? }` →
  200 `{"accepted":true}` for every well-formed body; 400 `{"error":"bad-request"}` for no `email`, a
  malformed one, or a `locale` that is not a string.
- **The mail (178-10, 178-12, 178-19):** the recovery link is
  `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=recovery`. A recovery request for an
  address with only an open invitation is sent the **sign-in** mail (`type=magiclink`): a spec expects
  that subject there. The witness and the slot work as for a link request.
- **Any plan that edits `account-access/index.ts`:** `flowConformance.test.ts` pins counts of
  `p_project_id`, `generateLink(`, `EdgeRuntime.waitUntil(`, `ACCEPTED_BODY` and `linkIssueDeps(`; a
  third answer-before-work operation joins `LINK_OPERATIONS` in the test. Anything that builds a
  `LinkIssueDeps` supplies `recoveryEligibility` and `mintRecoveryToken`; a caller of
  `buildSignInLink` passes `type`.
- **One test file of the functions:**
  `yarn workspace @openvaa/supabase test:unit account-access/flowConformance` (with `--` nothing is
  filtered).
- **The probe's `fn` row** can be run again without a restart and leaves nothing behind; its cleanup
  deletes every invitation whose address begins `r178-probe-`. `p5` and `p6` are still null.
- **For 178-23, more documentation now out of date:** the database skill's Service Patterns § 1 (three
  operations and one mint), the `apps/docs` pages `backend/edge-functions` and
  `backend/authentication`, `apps/supabase/README.md`. The sentence on function source in
  `178-EXECUTION-RULES.md` and `178-RESEARCH.md` § Pitfall 9 is a planning record and stays.

## After 178-08 (what nothing renders yet)

- **No full run was made by 178-08.** The predecessor label is still `178-07-close`.
- **The list of modes (178-10, 178-13 to 178-19):**
  `import { listedRegistrationModes, signInLinkOffered } from '$lib/contestant/utils/registrationOffer'`.
  Both take the settings object — `contestantCtx.appSettings` read inside a tracking scope, or the
  settings a server load loaded. The answer is a `ReadonlyArray<RegistrationMode>` in the order
  `identity_provider`, `email`, `code`; empty means nothing offers registration. `signInLinkOffered`
  does not read the answers lock.
- **The flow module (178-10):** `$lib/contestant/entryFlow` — `secondsLeft(settledAt, Date.now())`;
  `await settledOrBounded(request)` resolves to nothing and never rejects, and `settledAt = Date.now()`
  is set after it; `askedAgainTooSoon(previous, next, now)` is asked before the held request is
  replaced; `wordingOf(request)` takes the whole request; `EntryHeldRequest` is the request plus
  `wording`, `settledAt` and `askedAgain`. The countdown's message is
  `t('contestantApp.emailSent.resendWait', { seconds })`, a plural message.
- **The writer (178-10, 178-19):** `requestPasswordRecovery({ email, locale })` resolves
  `{ type: 'success' }` and throws on a transport error or an unexpected answer.
- **`<Button type="submit" form="<form id>">`** type-checks; that the attribute reaches the element in
  a browser is first observed by the first screen that uses it.
- **The registry:** 53 new test ids, tabled in `178-08-SUMMARY.md`. `login.email`, `.submit` and
  `.errorMessage` are unchanged and uncommented; the plan that renders `data-status` adds the comment.
- **A new message namespace** needs one line in `apps/frontend/project.inlang/settings.json` and the
  pinned count in `translations.test.ts` (51 files per locale now). Each catalogue holds 749 keys.
- **Filtering unit tests:** `yarn workspace @openvaa/frontend test:unit src/lib/contestant` — no `--`.
  A verify block that has the `--` runs the whole suite (about 75 s) with the same verdict; that is
  not a defect to report again.
- **Swedish `common.login` reads "Registrera dig"**; the new Swedish sentences say *logga in*. A screen
  that shows that key beside them reads inconsistently. Not changed; the orchestrator puts it to the
  operator. Do not change `common.login` on your own.
- **For 178-23:** the native-speaker review todo takes the one line and the per-locale table under
  "The constructed strings" of `178-08-SUMMARY.md` (264 keys); the docs that list the writer's methods
  or the function's callers (`developers-guide/backend/authentication`) and the localization page, if
  it counts namespace files, are out of date.

## After 178-09 (the shared fields)

- **No full run was made by 178-09.** The predecessor label is still `178-07-close`.
- **From here on, read the section for later plans of each summary from 178-09 onwards whole** — they
  hold the props, ids and usage of the pieces your screen mounts. This file repeats only what binds
  every plan.
- **A field in error:** the page holds `let emailError = $state<string>()` and writes
  `bind:error={emailError}`; the field clears it on input; the form is `novalidate`.
  `checkValidity()` is `false` for an empty field too, so ask about emptiness first where the two
  messages differ. `data-testid` goes to the `<input>`, `errorTestId` to the alert.
- **`PasswordField` spreads no rest props** and its control's id is always `password-field`; use a
  function binding on `password` to react to an edit.
- **`ErrorMessage` logs every message it shows with `log.error`**; a spec that fails on console errors
  would meet it.
- **A plan that adds a component** stages its files before
  `yarn workspace @openvaa/docs generate:docs`, then reads the diff: one new page per component beside
  the listing.
- **For 178-21 and 178-22, to look at on rendered screens:** the hint is a `<p>` and sits 20 px from an
  error under it; `ErrorMessage inline` centres its text while labels and hints are `text-start`;
  `Button` with an `href` renders `<a role="button" tabindex="0">`, so the forgot-password link is
  announced as a button (app-wide markup of `Button`).
- **For 178-23:** the components skill's measured counts are behind — convention 1 says 105 and 105,
  the tree has 109 and 109; convention 3 says 62 and 67, the tree has 66 and 73. Re-measure when
  editing.

## After 178-10 (the selector, the email-sent pieces and the flow's state)

- **No full run was made by 178-10.** The predecessor label is still `178-07-close`. Read the section
  for later plans of `178-10-SUMMARY.md` whole: it holds how C, D1, D2 and E mount these pieces.
- **A status read through a pipe let a commit with twenty `svelte-check` errors through** (`f7212f546`,
  fixed by `ff7c4d150`). `cmd | tail -1` under `set -e` reads `tail`'s status. Write the output to a
  file, read the command's own status, then look at the file. This rule has no exception.
- **`entryFlow` is a reactive accessor of the contestant context**, replaced whole on every write:
  never destructure it. `sendEntryLink`, `resendEntryLink`, `holdEntryCode`, `clearEntryFlow` and the
  three writer forwards are stable. A screen calls `sendEntryLink`, never the two link forwards. Call
  `clearEntryFlow()` where a screen signs the user in (178-14, 178-19).
- **A check that slices the context "from `#reset`"** must start at the definition `#reset = (`; the
  file has named `sessionStorageState` since before this phase. A verify stage that misreads either is
  a defect of the stage: run its intent, record both statuses.
- **"Send again" in flight** reads "Loading…", is `aria-disabled` and `aria-busy`, stays a tab stop and
  has no spinner (`Button`'s `loading` would set the native `disabled`).
- **For 178-12:** the count reads `Date.now()` at construction, on a one-second interval and on
  `visibilitychange`; a page clock that only fast-forwards `Date` needs a tick or a
  `visibilitychange` after it. Still unmeasured: that 65 s from settlement outlasts the server's 60 s
  slot.
- **For 178-23:** `context-reactivity.md` § 1a and § 1b lack `entryFlow` and the seven new stable
  members; `SKILL.md`'s counts are behind by three more components; the Developers' Guide wherever it
  lists the contestant context's members.

## After 178-11 (the password setter)

- **Predecessor label for the next full run:** `178-11-close` (444 tests, 116 projects, head
  `49dadc2fe`). Read the section for later plans of `178-11-SUMMARY.md` whole before mounting the
  setter (178-14, 178-19): the page's handler calls `event.preventDefault()` itself; `validate()` has
  shown the error and moved focus when it returns `false`; `autocomplete`, `method` and `novalidate`
  are not props.
- **A page test that mounts the real setter** needs the `window.matchMedia` stub from the setter's own
  test file.
- **`setPassword` of the fixture still presses `set-password-submit`**: a page that keeps that id on its
  submit button keeps the step. `contestantPasswordSetter.expectFieldError('password' | 'confirmation')`
  asserts the error and the control's `aria-invalid`.
- **For 178-21 and 178-22, to look at on rendered screens:** the main button's label is the whole
  sentence "The password does not meet the requirements above." while the password is not valid (50
  characters in English, 54 in French) — whether a `variant="main"` button wraps at 320 px is the
  contract's N-2 and was not looked at; three left edges in the setter's form; a field's error is
  centred under a start-aligned label.
- **For 178-23:** the Developers' Guide page `contestant-app/password-validation` (the username
  sentence; Flow steps 2 and 3 do not know `validate()`); the components skill's `concatClass` count;
  six constructed `passwordNotValid` sentences for the native-speaker todo; the todo
  `2026-10-02-password-validator-username-never-passed.md` is closable.
- **For 178-24's list for a person:** N-6 (which password managers pair a `display: none` user-name
  field; the visible-field fallback is located in `PasswordSetter.svelte` alone) and N-7 (each
  browser's password suggestion against the rule list). Neither was tried.

## After 178-12 (the fixtures and the semantic steps)

- **No full run was made by 178-12**; the predecessor label is still `178-11-close`. **No browser has
  run `contestantLoginPage.fixture.ts` or `contestantForgotPasswordPage.fixture.ts` since 178-12
  changed them** (type check, lint and unit only; one control of `invitation-contract`, 17 of 17). The
  next full run is their first: a red test in a login- or forgot-password-driven spec there points at
  178-12's commit `9ae4f8ae7` first.
- **Every new step's name and signature is in the section for later plans of `178-12-SUMMARY.md`.**
  Read it whole before writing a spec; a spec is written in those steps, and a step that is missing is
  added to the fixture, not worked around with a selector in the spec.
- **A flow has only the rows it names** (`createRegistrationTest({ addressPrefix, dedicatedRows })`): a
  step asked for the other kind throws. The option names at most one row per kind; two scan candidates
  (178-21) need a second flow or a widened option.
- **Seeding:** an invitation is honoured only for a mode the project's stored matrix allows for that
  entity type. Read the dataset's template before seeding.
- **The witness:** one link request per `witnessPageRequest` call; a press and a resend are two calls.
  A count of 0 for a request the page did make means the browser did not expose its body — the plan's
  fallback case, to report. "No mail" is
  `expectNoMailAfter(outcome, { address, noAccount: true })`, with `mails: 1` for an address already
  mailed.
- **E's clock:** `installClock()` before the navigation that leads to E (measured: installed after the
  count began it leaves the count at 65). `expectResendWaiting` needs `email-sent-countdown` to have an
  `id` and `email-sent-resend` to carry `aria-disabled` and `aria-describedby` on one element. Still
  unmeasured: 65 s from settlement against the server's 60 s slot.
- **For 178-13:** `goToPage()` of the login page object still opens `ContestantAppLogin` and waits for
  `login.email`; re-point it with B's key. `buildRoute` is typed by the application's route map.
- **For 178-19:** `fillEmailAndAdvance` still holds three literal ids and asserts
  `forgot-password-success`; `recoveryLinkToOpen` refuses a sign-in link, so the
  invited-address-without-account case reads `signInLinkToOpen`.
- **A verify stage that searches a fixture for `expect.soft` or `.catch(() => null)`** hits the header's
  rigidity line and exits 1; run its intent over the code with comments removed
  (`tests/e2e-runs/178-unit/178-12-t2-verify-intent-r2.sh` is the form), record both statuses.
- **A timing or count in a summary is one you measured**, read from a log. Leave out what you did not
  measure.
- **For 178-23:** `tests/README.md` does not mention `recoveryLinkToOpen`, `witnessPageRequest` or
  `createRegistrationTest`.

## After 178-13 (the sign-in screen B and the email-sent screen E)

- **Predecessor label for the next full run:** `178-13-close` (444 tests, 116 projects, head
  `63e976942`). It was the first run with a browser behind 178-12's page objects and found nothing.
  **No browser has rendered B or E yet**: their evidence is jsdom unit cases. The tracer (178-14) is
  the first observation; a failure there on B or E is as likely the screen's as the tracer's.
- Read the section for later plans of `178-13-SUMMARY.md` whole (178-14, 178-15, 178-16, 178-18).
- **Two rulings of the orchestrator, both put to the operator at the phase's close:**
  1. **The adapter-boundary lint allowlist** (`ADAPTER_BOUNDARY_ALLOWLIST` in
     `apps/frontend/eslint.config.mjs`) refuses `auth: locals.supabase.auth` in a file not listed. The
     entry 178-13 added for `login/email/+page.server.ts` stands. 178-15's D2 action takes the same
     form: one entry by path with its own comment, and a case in the guard's own test if that test
     enumerates entries. No shared server module is built by this phase. 178-18 strikes the old login
     action's entry with the action and rewords the comment on B's entry.
  2. **A refused sign-in posted without script does not keep the typed address**: the failure's data
     is the status alone, as plan 178-13's ruling 4 has it. The UI contract's sentence "The address
     stays in its field" holds for a hydrated page only. D2 follows the same rule.
- **Page tests with `use:enhance`:** `$app/forms` resolves to a stub whose `enhance` attaches nothing
  (`apps/frontend/src/lib/i18n/tests/__mocks__/app-forms.ts`); replace it as
  `login/email/page.svelte.test.ts` does to drive a submit. The submit handler is a function
  declaration typed `Parameters<SubmitFunction>[0]`. A page mounting `MainContent` needs the
  `matchMedia` stub and a layout context with `pageStyles.use`.
- **The login page has no `login.page` marker until 178-18**, so `expectEntryShown()` cannot anchor
  "ends on the login screen" yet.
- **For 178-21 and 178-22, to look at on rendered screens:** E with nothing held has no document title
  before it leaves; B after a no-script refusal has an empty address field; B's link line carries
  `mt-sm` alone between the main button and Return.
- **For 178-23:** wherever the docs list the Contestant App's routes or keys, the `$app/*` test stubs
  (five now) and the adapter-boundary allowlist.

## After 178-14 (the tracer)

- **Predecessor label for the next full run:** `178-14-close` (445 tests, 117 projects, head
  `3a9e37b49`). A comparison with a label before it needs `--except contestant-email-registration=1`.
- Read the section for later plans of `178-14-SUMMARY.md` whole.
- **A passwordless user now meets the set-password view on every protected page, before the terms.** A
  spec that brings a user in by a mailed link calls `contestantSetPasswordGate.expectShown()`,
  `.setPassword(pw)`, then `.expectGone()` or asserts the next view. The callback sends nobody to
  `register/password` any more.
- **Observed in a browser:** B and E render; `witnessPageRequest` works with the real function; a
  session is not refreshed after `updateUser` and serves every later load (probe row P4's browser
  half — the `_setPassword` comment stands); `<Button type="submit" form=…>` outside its form submits
  it. Not observed: whether a fill can land before hydration (N-1).
- **Assert the address in any "this view in place of that page" step**: an un-nominated entity's
  profile, questions and preview are never rendered, so "the page's container is absent" holds with no
  gate at all (178-21, 178-22).
- **`grantRowsOf(address)` throws for an address with no account**: read grants after the link request,
  not after seeding. A control whose failure is a thrown fixture error, not an expectation, does not
  count.
- **A spec that writes on a base-dataset row or reads the base settings** (178-17, 178-19, 178-21,
  178-22) names its project in `data-setup-perm-1e1cg1co`'s dependencies, with its comment.
- **A verify stage that searches a spec for `expect.soft`** hits the header's rigidity line, as in
  fixtures: run its intent over the code with comments removed, record both statuses.
- **For 178-16, still naming the legacy set-password page:** `route.ts`,
  `routes/contestant/+layout.svelte`, `register/+layout.server.ts` with its test,
  `register/+page.svelte` (its code flow still builds `ContestantAppSetPassword`),
  `perm-closed-project.spec.ts` and a comment in `contestant-a11y.spec.ts`. `passwordSetSuccesfully` is
  read by that page alone.
- **For 178-22:** the passwordless stored session will be the first stored session to meet the view; a
  first-time user with a project-scope grant and no password still has no browser case; the saving
  label, the failed-save sentence and its focus, the focus move when the gate is passed, and Log Out
  from the view are asserted in no browser.
- **For 178-23:** `developers-guide/backend/authentication` (the callback's arms, the gate, T-178-153,
  T-178-154), the pages `contestant-app/registration`, `login-and-password-reset`,
  `pre-registration-and-invitation`, `password-validation`, `tests/README.md` (the new project and the
  gate steps); the todo `2026-10-07-174-callback-keeps-signup-and-email-arms.md` is closable;
  `isContestantAppRootPath` in `tests/tests/utils/contestantEntityUrl.ts` is called only by its own
  unit test.
- **For 178-24's list for a person:** the view with a password manager (N-6, N-7), and the access
  token's bytes after `updateUser` (no digest was compared in a browser).

## After 178-15 (the two code screens D1 and D2)

- **Predecessor label for the next full run:** `178-15-close` (445 tests, 117 projects, head
  `2ebf42846`). **No browser has opened D1 or D2**; 178-17's code spec is the first walk.
- Read the section for later plans of `178-15-SUMMARY.md` whole (178-16, 178-17, 178-18, 178-19).
- **A ruling of the orchestrator for 178-16, put to the operator at the phase's close: the registration
  guard binds D2's action too.** A layout or page load runs to render a page, not before a form
  action, so today a post to D2's action signs in a used code's claimant whether or not the code mode
  is offered, and while answers are locked. D-19's condition and D-05's "indistinguishable from an
  unknown code" are read as binding the action: the action asks
  `refuseUnlessRegistrationOffered(event, need)` (or the same decision it is built from) before it
  does anything, and answers a refusal as it answers a wrong password or an unknown code — the status
  alone. 178-16 first reads what the server's `code-sign-in` operation itself does for a project whose
  code mode is off and reports it; if the server already refuses, the action's check is the second
  line and is still built. Unit cases pin both: mode off, and answers locked.
- **A screen with a guard that leaves when the flow empties clears the flow after the navigation:**
  `await applyAction(result); if (result.type !== 'error') clearEntryFlow();`. The sign-in screen's
  order (clear, then apply) is right only for a screen with no such guard.
- **`import { claimAndRefresh } from '$lib/auth/sessionAdmission'`** — signature
  `claimAndRefresh({ context, logLabel })`. An entry point that gates on grants calls `admitSession`;
  one that only lands the user calls `claimAndRefresh`. The pair is not written a third time.
- **The allowlist** holds two entries outside its two groups (B's action and D2's). The guard's own
  test probes two real paths and does not enumerate entries.
- **A red-first run of a route that does not exist** needs stand-in files, or every failure is an
  import error and does not count. A `bash -c` whose script the harness cannot read may be refused:
  put multi-command reads in a script file.
- **For 178-21 and 178-22, to look at on rendered screens:** D2's long refusal sentence inside the form
  above the forgot-password link; D2's link line with `mt-sm` alone; D2's password field with no
  user-name field beside it (by design); neither screen has a document title for the moment before it
  leaves with nothing held.
- **For 178-23:** the todo `2026-10-07-174-the-claim-and-refresh-pair-exists-twice.md` is closable; the
  route and route-key lists (two more), the callback's description, `lib/auth`'s exports and the
  allowlist are out of date in the docs.

## After 178-16 (the mode selector C; the legacy register tree is gone)

- **Predecessor label for the next full run:** `178-16-close` (452 tests, 117 projects, head
  `eefc962ee`). A comparison with `178-15-close` needs
  `--except contestant-email-registration=2 --except perm-closed-project=4 --except perm-answers-locked=1`.
- Read the section for later plans of `178-16-SUMMARY.md` whole (178-17, 178-18, 178-21, 178-23).
- **The orchestrator accepts** that the answers-lock case lives in `perm-answers-locked.spec.ts` (5
  tests). In a closed project with answers locked the registration addresses are served until 178-18
  copies the fourth public-configuration value; once it does, the lock case for a closed project
  belongs in the closed-project spec.
- **The server's `code-sign-in` operation does not ask the mode matrix or the answers lock** (read from
  source): D2's form action, which asks `isRegistrationOffered({ fetch }, 'code')` first and answers
  400 with the status alone, is the only line. Not changed by this phase; put to the operator.
- **Guard API:** `refuseUnlessRegistrationOffered` and `isRegistrationOffered` from
  `$lib/server/contestant/registrationGuard`, `need` being `'any'` or `'code'`. A page load awaits the
  first; a form action asks the second first and answers its own refusal. **A new entry screen** adds
  its route key to the Contestant App's `entryRoutes` in `appGates.ts` and to the case "lists exactly
  the six screens" in `appGates.test.ts`; forgot-password and password-reset are deliberately not
  listed.
- **No browser has walked a code through C** (valid → D1, used → D2): that is 178-17's, and a failure
  there is as likely C's, D1's or D2's as the spec's. The signed-in bounce is walked for four of the
  six routes.
- **Markers on C:** `contestant-register` carries `data-modes`, `data-mode-selected` and
  `data-register-state`; `register-code-error` carries `data-reason`; `register-email-error` is told
  by its text after an emoji — use a containing match. The code check is a `check-code` request, which
  `witnessPageRequest` does not count; `expectNoPageRequest(page, action)` counts every request to
  `account-access`.
- **A test meant to be red on its own must not sit in a serial describe behind another red test**: it
  ends skipped and the control does not count.
- **A menu-text change is not found by a test-id search**: `contestant-journey.spec.ts` reads both menus
  by accessible names (`CONTESTANT_NAV_LOGGED_OUT`, `CONTESTANT_NAV_LOGGED_IN`).
- **Deleting a file the docs link to:** run `yarn workspace @openvaa/docs validate:links --check` before
  the commit. `generate:docs` exits 1 on such a finding before it formats and leaves about fifty pages
  rewritten unformatted; discard them, repair the link, run it again.
- **Correction:** `passwordSetSuccesfully` is read by `login/+page.svelte`. The deleted page was the
  only writer of `newUserEmail`, so that branch of the login page is unreachable (178-18).
- **For 178-21:** `declareEntryScans(entries)` from `tests/tests/utils/entryAxeScan.ts`; add
  `entryAxeScan.ts` to check 4a's list of the a11y wiring gate in the form of
  `contestantAxeScan.ts`'s entry.
- **For 178-23:** the docs pages `contestant-app/registration` (still describes the deleted page),
  `login-and-password-reset`, `pre-registration-and-invitation`, `backend/authentication`, wherever
  the app-gate table or the hook is described, `tests/README.md`, and the comment on the
  `contestant-email-registration` project in `tests/playwright.config.ts`; six message keys with no
  reader (`contestantApp.register.codePlaceholder`, `.goToLoginLabel`, `.loggedInWarning`,
  `.titleWithPreregistration`, `.wrongRegistrationCode`, `contestantApp.setPassword.registrationError`);
  `checkRegistrationKey` and `register` have no caller and `newUserEmail` no writer; the
  native-speaker todo takes `contestantApp.register.enterCode` in six locales and the capitalised
  `.code` in da, fr and sv.

## After 178-17 (the two registration specs)

- **Predecessor label for the next full run:** `178-17-close` (464 tests, 118 projects, head
  `928f792da`). A comparison with `178-16-close` needs
  `--except contestant-email-registration=6 --except contestant-code-registration=6`. The first browser
  walk of a code through C to D1 and D2 found no defect of the application.
- Read the section for later plans of `178-17-SUMMARY.md` whole: it names eighteen new steps
  (`readScreenShape`, `freshVisitor`, `seedUsedCode`, `holdClockStill`, `expectEndedOnEntry`,
  `signInScriptLoaded` and others).
- **The auth service's rate budget is close.** In a full run the host's address peaks at 22 password
  sign-ins in any five minutes against a limit of thirty, and makes 13 link verifications against
  thirty. A plan that adds password sign-ins or link verifications counts them first
  (`tests/e2e-runs/178-unit/178-17-auth-counts.sh` counts the auth log without printing a line of it)
  and reports the new peak. A 429 in a run is this, not a flake: reduce or spread the sign-ins (a
  stored session, a seeded user), never raise the limit and never retry.
- **Test titles and fixture names use no screen letters** (`D1`, `D2` are decision ids of earlier
  phases on this tree). A verify stage that searches for a title with a screen letter is restated.
- **Each test makes its own state**; `seedUsedCode(target, { acceptTermsOfUse })` gives a used code
  with its claimant with no page.
- **An oracle is compared as data on a clock held still**: `freshVisitor()`, `holdClockStill()` before
  the navigation, the same steps per case, `shape(address)` and `toEqual` (178-19's recovery oracle
  follows this form). `expectMailCount` waits for a promised mail; `expectNoMailAfter` is the only
  "no mail".
- **For 178-18:** `expectEndedOnEntry()` rests on today's login page (the bare `ContestantAppLogin`
  address, `login-help-link` visible, no `login-notice`, no `login-errorMessage`) and is called twice
  by the email spec's reload test: keep `login-help-link` on the new screen or re-point the step in the
  held set, and add the root marker's assertion once `login.page` exists. `signInScriptLoaded()` waits
  for `login-request-link` to be enabled, so it works only where the link button is offered; the
  sign-in oracle calls it three times.
- **A `GET /verify` answered 303 in the auth log** is the function's own redirect question, not a
  spec's failed link.
- **For 178-23:** `tests/README.md` has no row for `contestant-code-registration` and none of the new
  steps; the comment on the `contestant-email-registration` project in `tests/playwright.config.ts`
  still describes the tracer alone.

## After 178-18 (the login screen is two links)

- **Predecessor label for the next full run:** `178-18-close` (469 tests, 118 projects, head
  `491f7bdde`). A comparison with `178-17-close` needs
  `--except contestant-email-registration=2 --except perm-closed-project=3`.
- Read the section for later plans of `178-18-SUMMARY.md` whole (178-19, 178-21, 178-22, 178-23).
- **The login page has no field.** `goToPage()` of the login page object opens the sign-in screen and
  waits for its frame and email control; `signInFromCold(email, password)` is for setups;
  `expectEndedOnEntry()` asserts the bare address, the root marker and the sign-in entry.
- **Wait for a logout to land before opening another address**: `clickWithDialog()` returns at the
  press, and the logout's own navigation can replace the step's. Call `expectEndedOnEntry()` first.
- **The sign-in's redirect carries `/en/` in the path; the tests' route builder omits the base
  locale's prefix.** Compare a landed address with the prefix removed.
- **A reserved row with no nomination has no profile, questions or preview page**: a deep link there
  ends on the entity's home. Settings and nominations are rendered.
- **A plan's stated project delta is derived from the tree at run time**: an inline `assertAxeScan`
  call is not a test. A verdict stage whose stated delta or `--dirty-only` list is wrong is restated,
  both statuses recorded, and the corrected `--except` values given in the hand-over.
- **The auth budget:** a full run peaks at 23 of 30 password sign-ins in five minutes.
  `tests/e2e-runs/178-unit/178-18-auth-peaks.sh <since> <until>` prints totals and the five-minute
  peak by origin. A plan that adds password sign-ins reports the new peak; at 27 or more it stops and
  reports before committing.
- **The a11y wiring gate already reads `entryAxeScan.ts`** (changed by 178-18 under the same
  prohibition and required import as `contestantAxeScan.ts`). For 178-21 the new scan spec is one more
  constant and list entry with the gate `declareEntryScans` from `'../../utils/entryAxeScan'`; the
  header's counts move with it. A gate is never relaxed to pass.
- **For 178-19:** the forgot-password link is on the sign-in screen and the used-code sign-in, not on
  the login screen; `password-reset/+page.svelte` still sends a user to `ContestantAppLogin` in two
  places; a refused or spent recovery link lands on the login screen with `authError`, which
  `expectNotice('authError')` asserts.
- **For 178-21 and 178-22, to look at on the rendered login screen:** the footer inside the actions
  section under the two secondary links (the UI contract's sketch lists it before the actions; built
  last because the same section says the footer stays as it is); the notice between the heading and
  the entries; one button alone where Register is absent; the "Or" divider between two full-width
  buttons; the voter-app link, a button that needs the page's script. The notice and locked states of
  the login screen have no entry in the contract's scan table; `?errorMessage=authError` reaches the
  notice with no setup.
- **Swedish `common.login`** is still shown by the menu item and by the sign-in screen's title and
  button. Not changed.
- **For 178-23:** keys with no reader — `contestantApp.login.haveRegistrationCode`,
  `contestantApp.setPassword.passwordSetSuccesfully`; `newUserEmail` has neither reader nor writer;
  docs out of date — the rest of `login-and-password-reset`, `configuration/app-settings` (four public
  values), the database skill's "three stored" and "three values", `tests/README.md` (closed-project
  paragraph, `registerAndStoreSession`, the new steps, the gate's list), the allowlist description,
  the `contestant-email-registration` comment in `playwright.config.ts`; the native-speaker todo takes
  Finnish `enterEmailAndPassword` and `answersLockedInfo` and Luxembourgish `answersLockedInfo`.

## After 178-19 (forgot-password and password-reset; FIX-01)

- **Predecessor label for the next full run:** `178-19-close-r2` (473 tests, 119 projects, head
  `5ad63f88d`). A comparison with `178-18-close` needs `--except contestant-password-recovery=4`.
- Read the section for later plans of `178-19-SUMMARY.md` whole.
- **Read a mailed link only after the request's witness reads `sent`**, for any fixed address: the
  mail catcher keeps earlier runs' mails, and "the newest mail" read too early is the previous run's
  spent link. This made `250e4215b` turn the journey red until `5ad63f88d`.
- **The auth budget is at 25 of 30** password sign-ins in five minutes (17 of 30 link verifications).
  About two sign-ins of room remain before the stop line at 27: 178-21 and 178-22 reach signed-in
  states through stored sessions or seeded users, not new password sign-ins, wherever the plan allows
  it, and report the new peak.
- **The reset page needs a session**: with none its server load redirects 303 to the login screen; with
  one it returns `{ email }` of the verified user only. The header of `contestant-a11y.spec.ts` that
  says `password-reset` needs no authentication is false (178-21).
- **`requestForgotPasswordEmail` and `resetPassword` are gone** from the writer, the adapter and every
  context.
- **For 178-23:** keys with no reader — `contestantApp.resetPassword.emailSentText`, `.error`,
  `.failed`; docs out of date — `backend/email` (`resetPasswordForEmail`),
  `contestant-app/login-and-password-reset` (`requestForgotPasswordEmail`), `frontend/contexts` (the
  `AuthContext` members); four todos named in `178-19-SUMMARY.md` are closable.

## After 178-20 (the auth configuration)

- **Predecessor label for the next full run:** `178-20-close-r2` (473 tests, 119 projects, head
  `6c22aa9a1`). `178-20-close` is a refused attempt with no run in it: never name it.
- **`[auth]` keys and hook tables are not served until a stack restart** (measured: a `db:reset` does
  not serve them). The function source is served without one. Whether the functions' environment needs
  a restart is untested.
- **The auth service requires eight characters** on a user's own `updateUser`, an administrator's
  `createUser` and the recovery page's update; accounts with an older shorter password still sign in.
  A fixture or seeded user with a password under eight characters is refused at creation.
- **The auth service sends no mail of its own** (the no-op mail hook). Nothing on the tree calls
  `inviteUserByEmail`, `signInWithOtp`, `resetPasswordForEmail`, `reauthenticate` or
  `updateUser({ email })`; a test that needs a mail gets it through the Edge Function.
- **The disk floor:** the driver refuses below 13.8 GiB free in the Docker VM. On a refusal, stop and
  report; the orchestrator puts the remedy to the operator. Never remove images, volumes or files
  yourself.
- **For 178-23:** the docs page `developers-guide/contestant-app/password-validation` still says the
  local stack enforces 6 characters; the database skill (§ 4 has no hook census, § 2 lists one hook,
  pgTAP counts — now 45 files, 2435 assertions, file 07 `plan (44)`); `schema-reference.md` has no row
  for `send_email_hook`; the docs pages `backend/authentication` and `backend/email`; the hosted
  dashboard's settings (minimum length 8, Email OTP expiration 3600, the Send Email hook — Postgres
  type, `public.send_email_hook` — sign-up off, confirmations on) go into the hosted-settings todo, and
  the `P6-OTP: distinguishes` measurement into the OTP-oracle todo.

## After 178-21 (the signed-out entry scans)

- **Predecessor label for the next full run:** `178-21-close-r2` (502 tests, 120 projects, head
  `7a413bb2f`, tree-equal to `9b7b74c9f` outside `.planning/`). `178-21-close` is void (clamshell sleep):
  never name it. A comparison with `178-20-close-r2` needs `--except contestant-entry-scan=29`.
- Read the section for later plans of `178-21-SUMMARY.md` whole (178-22, 178-23).
- **A `--red` verdict stage matches titles by substring**: an entry name that is a prefix of another
  makes the as-written stage read extra tests. Name entries so none is a prefix of another, or judge
  exact titles (`tests/e2e-runs/178-unit/178-21-control-intent.mjs` is the form); record both statuses.
- **For 178-22:** the phone spec depends on `contestant-entry-scan`, uses its two reserved candidates and
  `ENTRY_SCAN_ADDRESS_PREFIX` after it, and seeds its own codes (the scan spec's `afterAll` removes
  everything it made). Two flows, one row per kind each.
- **Menu steps:** `navMenu.expectItemLeadsTo(name, path)` and `expectNoItemLeadsTo(path)`; build the path
  with `buildRoute({ route, locale: 'en' })`.
- **The auth budget is still 25 of 30** password sign-ins in five minutes (37 in a full run), 18 link
  verifications. Stop line 27.
- **Host power:** a closed lid sleeps the host whatever `caffeinate` holds. On a void, look for
  `Clamshell Sleep` in `pmset -g log`, keep the directory and run again under the next label.
- **For 178-23:** `tests/README.md` (no row for `contestant-entry-scan`, nothing on the two menu steps),
  the wiring gate's counts ("eleven source files", "none of the nine"), the components skill's
  convention 6.

## After 178-22 (the passwordless session scans and the phone widths)

- **Predecessor label for the next full run:** `178-22-close` (530 tests, 123 projects, head
  `4fe87f913`). A comparison with `178-21-close-r2` needs
  `--except contestant-a11y-scan=6 --except contestant-entry-phone=20 --except data-setup-passwordless-session=1 --except data-teardown-passwordless-session=1`.
- Read the section for later plans of `178-22-SUMMARY.md` whole (178-23, 178-24).
- **A verify stage that searches a spec for a title built in a loop finds nothing**: read titles from
  `playwright test --list --no-deps --project <name>` (`178-22-t2-titles.sh` is the form); record both
  statuses.
- **The passwordless session** (`PASSWORDLESS_STORAGE_STATE`, user `TEST_PASSWORDLESS_EMAIL`, a
  project-scope `editor` grant, no entity, role null): a reader names `data-setup-passwordless-session`
  in its dependencies and never saves a password or signs out under it.
- **A new entry-flow screen** adds two tests to `contestant-entry-phone` (one per width).
- **The auth budget:** 25 of 30 password sign-ins in five minutes (37 in a full run), 20 link
  verifications. Stop line 27.
- **Ruling noted for the operator:** the plan's "both of its fields in error" for the set-password view
  cannot be shown (`validate()` reports one field at a time); the confirmation's error is the marker.
- **For 178-23:** `tests/README.md` (no rows for `contestant-entry-phone`, the passwordless setup and
  teardown; the three new steps), the components skill's convention 6, the `auth-setup` comment in
  `playwright.config.ts`.
- **For 178-24's list for a person:** the six other locales at 320 px, long text buttons wrapping inside
  the button, the identity-provider panel at phone width (not in the base dataset), a passwordless
  project-scope user passing the gate, whether a stored link session lasts a whole run.

## After 178-23 (the legacy removed, the docs in line)

- **Predecessor label for the next full run:** `178-23-close` (530 tests, 123 projects, head
  `397e2b0c3`), every project equal to `178-22-close`.
- Read the section for later plans of `178-23-SUMMARY.md` whole (178-24).
- **The pgTAP row needs `public.ecr.aws/supabase/pg_prove:3.36` in the Docker VM.** It is missing; 178-23's
  pull hung for 16 minutes with the registry reachable. **Resolved by the orchestrator on 2026-10-16:** a
  second pull from `public.ecr.aws` hung 15 minutes with no output; `supabase/pg_prove:3.36` was pulled from
  Docker Hub (digest `sha256:eda7c5e6…`, image id `637dc4f340fe`) and tagged
  `public.ecr.aws/supabase/pg_prove:3.36`, so the CLI finds it locally. Its identity with the ECR image is
  assumed (Supabase publishes the same tags to both), not compared. If `supabase test db` still tries to
  pull and hangs, 178-24 stops at that row and reports. Never prune, remove or restart to unstick it.
- **The database skill's pgTAP count is 178-20's run (2435)**: no pgTAP run was made on 178-23's tree.
- **A negative search excludes test files** (`':!*.test.ts'`): `registrationGuard.test.ts` sends
  `registrationKey=abc` deliberately. `registrationKey` also remains in Phase 179's pre-registration tree.
- **For the operator at the close:** the `CLAUDE.md` Auth bullet's clause on `claim_invitations` is false
  (a candidate or organization grant is written only under a mode the project allows); the proposed
  replacement is in `178-23-SUMMARY.md`. Not made — `CLAUDE.md` is out of the phase's scope.
- **For 178-24:** the seven filed todos `2026-10-16-178-…` are the list for a person (N-6, N-7, N-8, the
  keyboard and screen-reader walk, the six locales at 320 px, U-30, the 65-second margin).

## After 178-24 (the closing gate)

- **All 24 plans complete.** Closing run `178-24-final` (530 tests, 123 projects, head `062127cae`), 17 gate
  rows at 0 (`178-gates/178-24-final`, pgTAP 45 files / 2435 on the Docker Hub image), both bank-auth projects
  green, stack restored and re-seeded with the default template.
- **For the operator:** Task 2's baseline comparison as written fails on `perm-answers-locked` (5 vs 4): the
  plan's list of sums lacks 178-16's accepted move (+1). Restated with `--except perm-answers-locked=1` it
  passes. The operator decides whether that entry is right. The 24 open items are in `178-24-SUMMARY.md`
  § For the operator.
