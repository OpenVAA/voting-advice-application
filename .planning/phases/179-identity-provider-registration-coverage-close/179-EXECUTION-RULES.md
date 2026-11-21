# Phase 179 — Execution Rules

> Read once by every executor of a Phase 179 plan, before its first task. Each plan names this file in its
> `<context>`. A plan's own blocks add to these rules and never relax them. Where a plan and this file
> disagree, stop and report.

**A hook line of the form `CONTEXT WARNING NN%` in a tool's output belongs to the orchestrator. Ignore it and
keep working; it is never a reason to stop, to shorten a task or to hand a plan back unstarted.**

## When this phase runs

Phase 179 executes after Phase 178: `178-24-SUMMARY.md` and `178-VERIFICATION.md` are on the tree, the report's
status is `passed` or `human_needed`, and where it is `human_needed` the operator's deferral of the walk-through is
recorded in a tracked `178-UAT.md`. Plan 179-01 checks that and stops with a report when it is not so.

**The frozen baseline is on this branch** (operator ruling 2026-10-21, item 1). The deployment branch's freeze —
`apps/supabase/supabase/migrations.manifest.json` listing `00001_initial_schema.sql` with its sha256 — was merged
before planning. **No plan of this phase regenerates, edits or re-hashes `00001_initial_schema.sql`.** Every schema
change is an appended migration (`00002_…` onward) with its manifest line, kept equivalent to
`apps/supabase/supabase/schema/` (procedure below). Plan 179-01 verifies the freeze is present; a plan whose schema
step finds the manifest absent stops and reports.

The plans were written on 2026-10-21 against the tree at that day's head. Every path and symbol in a plan is a
hint, resolved by the symbol or the quoted content given and never by a line number, and every population is
derived again by the command given when the plan runs.

### The order of the plans (item PL-01 — departs from D-23's letter; D-23 is not amended)

D-23 asks for six sequential plans, each leaving the suite green, with the harness last. With granularity
`fine` each of D-23's six stages is several plans of two or three tasks, and the stages are reordered in three
places, each for a reason D-23's own constraints give:

1. **The harness first (179-04, 179-05).** The operator's standing instruction is that fixtures and the harness
   are built before the screens they assert (the order Phases 175 to 178 took). Default-on (D-19) needs one issuer
   for the whole suite, which is a harness change alone; once it lands, every later full run exercises the round
   trip and no plan needs the opt-in driver with its two stack restarts. D-23's "plans 1–5 each run them through
   the driver, alone" is kept for every plan before 179-05.
2. **Modules that decide nothing before the tracer (179-08 to 179-13).** Pure modules, an operation nothing calls
   yet and a component nothing renders are committed alone; the tracer (179-14) wires them in one commit. D-23's
   ordering constraint — the function's contract changes while the legacy route is still its only caller, so the
   old body stays accepted until the caller moves — is kept: 179-13 serves the new contract with the legacy body
   still accepted, 179-14 moves the caller, 179-15 removes the compatibility.
3. **CI2 before C's start (179-06, then 179-07).** C's failure path (C-P5) and the callback's failures land on
   CI2, so CI2 exists first and no commit redirects to a page that is not there.

The other option, D-23's letter, is the located change: the harness pair moves behind 179-22 and every plan from
179-03 to 179-22 closes also on `179-bankauth.sh`.

**The tracer is plan 179-14**: one path through every layer the phase touches — C, the authorize endpoint, the
provider (the mock issuer), the callback, `identity-callback`, the session, the gate CI1, the address-confirmation
operation and its mail, the mailed link opened as received, F, G and the entity's home — walked by one E2E test.

## Names

| Name | Value |
|---|---|
| `P` | `.planning/phases/179-identity-provider-registration-coverage-close` |
| `P178` | `.planning/phases/178-sign-in-email-code-registration` |
| `S` | `apps/supabase/supabase` |
| `IC` | `apps/supabase/supabase/functions/identity-callback` |
| `FN` | `apps/supabase/supabase/functions/account-access` |
| `F` | `apps/frontend/src` |
| `ENTRY` | `apps/frontend/src/routes/contestant` |
| `C` | `apps/frontend/src/lib/contestant/components` |
| `M` | `apps/frontend/messages` |
| `T` | `tests/tests` |
| `R` | `tests/e2e-runs/179-e2e` (gitignored) |
| `U` | `tests/e2e-runs/179-unit` (gitignored) |
| `BASE` | the one line of `$P/179-BASE`: the last commit that changed a file outside `.planning/` before the phase |
| `BASELINE` | the one line of `$P/179-BASELINE`: the directory of the full E2E run every comparison starts from |

Both files are written by plan 179-01 from the tree as it stands then. **No plan states a count, an ordinal, a
head or a run directory of the planning day as a target**: each is read from those two files, from a run's own
records or from a command. The number a plan's own tests add is stated in that plan and pinned by its verdict's
`--except`. The version of a new migration and the number of a new pgTAP file are the next free ones when the
plan runs.

## Names this phase introduces

Fixed by the context or the UI contract: the test ids and message keys of `179-UI-SPEC.md` § *Locator Contract*
and § *Copywriting Contract* (U-24 ★), the gate id `identityProvider` and the view `IdentityProviderGate.svelte`,
the namespace `contestantApp.identityProvider`, the CI2 route `register/identity-provider/error` and the route keys
`ContestantAppIdentityProviderError` and `ContestantAppIdentityProviderCallback` (U-19 ★), the tags of D-21.
Chosen by the planner, and binding on every plan once written here:

| Layer | Name | What it is |
|---|---|---|
| SQL | predicate of `public.claim_invitations` | the caller's address is read only when the caller's `raw_app_meta_data ->> 'identity_provider'` is null: an identity-provider account claims nothing (J3) |
| SQL | `public.address_confirmation_request (p_project_id uuid, p_user_id uuid, p_email text) RETURNS boolean` | `SECURITY DEFINER`, `search_path = ''`, EXECUTE for `service_role` alone; takes the caller's slot `'confirm:' \|\| project \|\| ':' \|\| user id` (10 per 15 minutes) and then the address's `link:` slot (the key and limit `invitation_link_request` uses: 1 per 60 seconds); true when both were taken, false otherwise; in `506-invitation-rpcs.sql` |
| SQL | `private.caller_pending_email_taken () RETURNS boolean` and key `pending_email_taken` of `public.get_user_entities` | the function: `STABLE SECURITY DEFINER`, `search_path = ''`, no argument, EXECUTE for `authenticated` alone, in `301-auth-functions.sql` beside `private.caller_password_set`; true when the caller's own pending address (`auth.users.email_change`) is non-empty and another account's address equals it, compared trimmed and lower-cased, false otherwise. The key: beside `entities` and `password_set`, its answer. It answers for `auth.uid()` alone (U-16, the caller-only fact) |
| SQL | migrations `<next>_claim_excludes_identity_provider_accounts.sql`, `<next>_address_confirmation_request.sql`, `<next>_user_entities_pending_email_taken.sql` | three appended migrations, in this order, each in one commit with its `schema/` edit and its manifest line |
| function | request of `identity-callback`: `{ id_token, project_id, entity_type? }`, header `x-identity-callback-secret` | `project_id` a uuid (J5); `entity_type` one of `candidate`, `organization`, or absent only when exactly one served type allows the provider's mode (D-03); the header from 179-15 on (J4) |
| function | `result` of `identity-callback` | `created` (200), `found` (200), `no_entity` (200), `mode_not_allowed` (403), `invalid_token` (401), `bad_request` (400), `refused` (401), `configuration` (500), `unavailable` (503); a success body adds `token`, the `token` parameter of the magic link; never a caught message |
| function | modules beside `$IC/index.ts` | `requestContract.ts` (`parseIdentityCallbackRequest`, `IDENTITY_CALLBACK_RESULT`, `resultBody`, `resultStatus`), `registrationMatrix.ts` (`SERVED_ENTITY_TYPES`, `identityProviderEntityTypes`, `resolveEntityType`), `placeholderAddress.ts` (`PLACEHOLDER_EMAIL_DOMAIN = 'bank-auth.placeholder'`, `placeholderAddressFor`), `organizationRecord.ts` (`createOrganization`, `deleteOrganization`), `ownEntity.ts` (`REGISTERED_ENTITIES_KEY = 'registered_entities'`, `readRegisteredEntity`, `withRegisteredEntity`, `resolveOwnEntity`), `appMetadata.ts` (`identityAppMetadata`, `REMOVED_CLAIM_KEYS`), `serverCredential.ts` (`SERVER_CREDENTIAL_HEADER`, `presentsServerCredential`) |
| function | variable `IDENTITY_CALLBACK_SERVER_SECRET` | read by the function through `requireEnv` and by the frontend server from `$env/dynamic/private` through `$lib/server/constants` (J4) |
| function | operation `'confirm-address'` of `account-access` | `{ operation, project_id, email, locale }` with the caller's own access token in `Authorization`; answers `{ result: 'sent' }`, `{ result: 'in-use' }`, `{ result: 'refused' }` (200) or `{ error: 'unauthenticated' }` (401); `ConfirmAddressRequest`; `addressConfirmation.ts` (`confirmAddress`, `AddressConfirmationDeps`); `ADDRESS_CONFIRMATION_MAIL_TEMPLATES`, `renderAddressConfirmationMail`; `LINK_TYPES` gains `'email_change'`; `$FN/placeholderAddress.ts` |
| frontend | cookies `COOKIE.oidcEntityType = 'oidc_entity_type'`, `COOKIE.identityProviderArrival = 'identity_provider_arrival'` | httpOnly, `secure`, `sameSite: 'lax'`, `path: '/'`, 600 s; the marker's values `created`, `existing` |
| frontend | `OIDC_ERROR`, nine members | `invalid_state`, `invalid_token`, `missing_code`, `token_exchange_failed` (kept), and `cancelled`, `provider_error`, `mode_not_allowed`, `registration_failed`, `configuration_error`; `oidcErrorFromProvider`, `oidcErrorFromFunction`, `oidcErrorClass` returning `'cancelled' \| 'retry' \| 'noRetry'` |
| frontend | `$F/lib/contestant/utils/identityProviderAccount.ts` | `PLACEHOLDER_EMAIL_DOMAIN`, `AddressState = 'none' \| 'pending' \| 'proved'`, `addressStateOf` |
| frontend | `BasicUserData` members | `addressState: AddressState`, `pendingEmail: string \| null`, `ownOrganizationUnnamed: boolean`, `pendingEmailTaken: boolean`; `email` and `username` never hold a placeholder address |
| frontend | `ContestantGateFacts` | `{ user: BasicUserData; arrival: 'created' \| 'existing' \| null; answersLocked: boolean }`: what every gate predicate receives — the user-level data and two facts of the request, nothing about an entity |
| frontend | `identityProviderEntityTypes (settings)` in `registrationOffer.ts` | the served types whose row allows the provider's mode, in the order candidate, organization |
| frontend | writer `requestAddressConfirmation (opts: { email: string; locale: string })` | answers `'sent' \| 'in-use' \| 'refused'` |
| frontend | `$F/routes/api/contestant/identity-provider/+server.ts` with `$F/lib/server/contestant/identityProviderRegistration.ts`; `UNIVERSAL_API_ROUTES.identityProviderRegistration` | CI1's, the reminder's and settings' one server endpoint; intents `save` (names and/or address), `resend`, `acknowledge`; answers `{ result: 'saved' \| 'in-use' \| 'failed' \| 'sent' \| 'acknowledged' }` |
| E2E | spec `contestant-identity-provider.spec.ts`, project `contestant-identity-provider`; setup `identity-provider.setup.ts`, teardown `identity-provider.teardown.ts`, projects `data-setup-identity-provider`, `data-teardown-identity-provider` | at the tail of the perm chain, on the edge `data-setup-bank-auth-journey` takes |
| E2E | fixtures `identityProviderFlow.fixture.ts` (under `$T/fixtures/shared/`), `contestantIdentityProviderGate.fixture.ts`, `contestantIdentityProviderError.fixture.ts` | the mock issuer's selector, CI1, CI2 |
| E2E | the mock issuer's selector cookie `mock_oidc_scenario`; prefixes `e2e-idp-` (each minted `sub`) and `identity-provider-` (each typed address) | none is the beginning of another prefix of the suite |
| repo | `scripts/assert-no-preregister.mjs` (`yarn assert:no-preregister`), `scripts/assert-e2e-coverage-tags.mjs` (`yarn assert:e2e-coverage-tags`), `scripts/assert-test-keys-scope.mjs` (`yarn assert:test-keys-scope`) | the REG-14 gate in `lint:check`; the D-21 tag census; the D-19 hazard |
| phase | `179-gates.sh`, `179-e2e.sh`, `179-verdict.mjs`, `179-bankauth.sh`, `179-stack-probe.sh`, `179-read-rulings.mjs`, `179-probe.mjs`, `179-PROBE-FINDINGS.md`, `179-BASELINE-FACTS.md`, `179-BASE`, `179-BASELINE` | the drivers, the probe and their records |

## Items built at the recommended option

**Operator rulings of 2026-10-21**, recorded in every plan that depends on one as "operator ruling 2026-10-21":
(1) the freeze is merged — never regenerate `00001`; (2) every UI-SPEC proposal U-01..U-24 is built at its ★ and
every CONTEXT judgement call J1–J7 at the context's proposal; a different answer later is a located revision, and
no plan waits for the round; (3) Idura's `hetu` and `birthdate` no longer reach `app_metadata`; (4) the research's
other recommendations are taken: a ninth error code for configuration failures; U-16 at its ★ with the caller-only
fact, because the ★'s session case requires it.

| Item | Built | The other option, and where it lands |
|---|---|---|
| J1 | the gate stops *none* only; *pending* gets CI1 V4 once and the home reminder; "use your email next time" only for *proved* | B1's sentence to the letter (pending = none): one disjunct of the gate predicate (179-14) and V4's markup (179-12, 179-18) |
| J2 | users created by `generateLink invite`, so the password fact is honest; F's predicate needs the address *proved* | a server-written marker: a new server operation — not located; the phase stops |
| J3 | `claim_invitations` reads no address for an identity-provider account | X2 (b) accepted: migration `…claim_excludes…` is not written (179-03 Task 1) |
| J4 | the function requires the server's secret header | the function stays callable with the anon key: 179-15 Task 1 |
| J5 | the project comes from the request, a uuid | the environment binding kept as a second lock: one comparison in `parseIdentityCallbackRequest` (179-08) |
| J6 | a per-project, per-type record in `app_metadata`, confirmed by a live grant; record present and grant gone → `no_entity`, nothing created | create again when the grant is gone: one branch of `resolveOwnEntity` (179-09) |
| J7 | `register/` holds the provider's start inside C and CI2 at `register/identity-provider/error`; CI1 a gate view | another route name: the route key and the folder (179-06) |
| U-01..U-24 | each at its ★ | the block each alternative changes is tabled in `179-UI-SPEC.md` § *PROPOSED* |
| Ninth code | `configuration_error`, class `noRetry` | the function's configuration failure mapped to `registration_failed` (`retry`): one row of `oidcErrorFromFunction` (179-06) |
| U-16 | with a session: the pending address reads as taken through `pending_email_taken`, CI1 shows its form with the notice; without one: decided by probe row P4 (below) | U-16 (b): the key is not added and A shows `authError` (179-03 Task 3, 179-19) |

### The planner's items

| Item | Question | Built | The other option |
|---|---|---|---|
| PL-01 | the order of the plans | above | D-23's letter, above |
| PL-02 | the schema edits | three appended migrations in 179-03, each one commit; the slot RPC and J3 precede the confirmation operation (research Pitfall 14) | one migration for all three: one commit instead of three |
| PL-03 | where CI1's save lives (discretion) | one server endpoint, three intents, built over the server-side data writer; it clears the httpOnly marker in the same request | a client writer call plus a marker-clearing endpoint: two requests |
| PL-04 | what a gate predicate reads | `ContestantGateFacts`: the user-level data plus the marker and the answers lock; still nothing of an entity | the two facts on `BasicUserData`: the writer would read a cookie |
| PL-05 | `redirectUri` (discretion) | built by the authorize endpoint from its own origin and `ContestantAppIdentityProviderCallback`; a client value is ignored | the client's value kept |
| PL-06 | the Signicat verifier (discretion) | generated by the authorize endpoint and written into an httpOnly cookie; the browser sends no challenge | the browser keeps generating it: the todo of D-22 is filed instead |
| PL-07 | the catalogue keys | every new key in one task (179-06 Task 1); a reworded key with the screen that shows it (U-14 in 179-17, U-23 in 179-06); a removed key with its last reader (179-21) | one task for all three kinds |
| PL-08 | the arrival marker | `created` for `created`, `existing` for `found` and `no_entity` | — |
| PL-09 | stale claim keys on an existing account | each sign-in through the function sends `hetu: null` and `birthdate: null` in its `app_metadata` update, removing them — built only if probe row P9 shows a null value removes a key | not built: rows made before the phase keep the keys until a reset removes them; recorded |
| PL-10 | where the confirmation mail is issued | `account-access`, which owns the transport, the templates and the link builder | `identity-callback`, which has no mail path |
| PL-11 | the Deno matrix copy | asserted against the same 32 rows of `45-registration-mode-matrix.test.sql`: a third reader of one table | — |
| PL-12 | when the identity-provider specs are default-on | 179-05 | see PL-01 |
| PL-13 | U-16 without a session | probe row P4 decides: a failure the callback can tell apart is answered with A's `emailTaken`; otherwise A's `authError`, recorded as a flagged assumption | a token-keyed classification operation: not built |
| PL-14 | `[edge_runtime.secrets] PUBLIC_PROJECT_ID` in `$S/config.toml` | removed with J5 in 179-15, when no function reads it | kept, with its comment rewritten |
| PL-15 | the frontend's provider modules list `hetu` among the claims they extract | kept in memory only, stored nowhere; their docblocks say so | the lists emptied |
| PL-16 | CI observation of D-19 | not made: the CI E2E job has never passed on this branch (`2026-09-03-ci-e2e-ssr-500.md`) and the evidence channel pushes to a public repository, which is the operator's act; the workflow's job runs the wrapper, so the environment is the wrapper's by construction | a push through the `ci-evidence/**` channel by the operator |
| PL-17 | the coverage census | `playwright test --list --reporter=json`, tags read from each test's `tags` | titles grepped as text |

`$P/179-read-rulings.mjs`, built by plan 179-01 from Phase 178's reading command, reads a decision document by a
fixed rule: no box ticked and no NOTE or EDIT text means the recommended option; anything else is a halt with the
item printed verbatim. It has no table of applied items. Plan 179-01 reads the UI contract's round with it; when
`$P/179-OPERATOR-ROUND` (line 1: a document's path; line 2: its section letters) exists, it reads that too.

## The probe rows, and what rests on each

Plan 179-02 runs `$P/179-probe.mjs` on the local stack before anything is built and writes
`$P/179-PROBE-FINDINGS.md` with one verdict line per row. **A diagnosis read from source is unconfirmed until its row
has been run**; the research's GoTrue readings are all of that kind.

| Row | Assumed | The plans that rest on it | If it comes out the other way |
|---|---|---|---|
| P1 | for a placeholder user, generate `email_change_current` + `email_change_new`, verify the current token server-side: no session, nothing changes; the new link then completes on one click with a session, `email` = the typed address, `email_change` cleared, nothing mailed by the auth service | 179-10, 179-14, 179-19 | the phase stops at 179-02: the fallback (`double_confirm_changes = false`) edits the deployment workstream's `hosted-settings.json` and needs the operator |
| P2 | a lone new-address click under `double_confirm_changes = true` single-confirms only; `verifyOtp` answers no error and no session | 179-19 (the guard) | recorded; the guard is built either way |
| P3 | a second triple refuses the first new-address link | 179-10 (the mail's "only the newest link works") | the template's sentence is dropped from the third mail in all seven locales (179-10 Task 2) |
| P4 | a new address another account holds → 422 `email_exists` at issue; two placeholders pending one address: the second click fails — its status and code recorded | 179-10 (`in-use`), 179-19 (PL-13) | `in-use` is decided by whatever P4 shows the issue answers; 179-19 builds the branch P4 names |
| P5 | `generateLink invite` → `updateUserById(app_metadata, email_confirm: true)` → magic link verified: `private.user_password_set` false; `createUser` control true | 179-13 | the phase stops at 179-02 (J2's other option is not located) |
| P6 | for `email_change_new` the `token` of `action_link` verifies, `hashed_token` does not | 179-10 | the operation mails the one that verifies |
| P7 | a session issued before the change still works after it | 179-14, 179-19 | recorded as a residual; no code changes |
| P8 | `supabase functions serve identity-callback --env-file <generated>`, stopped, then `yarn db:start` alone: does the edge runtime come back; the time of `yarn db:stop` + `yarn db:start` | 179-05 | the wrapper restores by stop and start |
| P9 | `updateUserById(id, { app_metadata: { k: null } })` removes `k` | 179-09, 179-13 (PL-09) | PL-09's strip is not built |

## The shell

- Begin every shell call that runs `yarn`, `npx` or `node` with
  `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`.
- A status is read from the command itself, never through a pipe. A commit follows a gate with `&&`, never `;`.
- No gate-set run, E2E run, schema-equivalence run or pgTAP run is made in the foreground: launch it in the shell
  tool's background mode as `( caffeinate -dimsu <command>; echo $? > <marker>.exit ) > <marker>.log 2>&1` and poll
  with one short foreground command per poll (a bounded loop of at most 45 one-second waits that ends when the
  `.exit` marker exists). Ceilings: 25 minutes for one full run (it now restores the stack at its end), 20 for one
  gate set. A foreground long gate trips the executor's 600-second watchdog.
- Before a long run: `pmset -g batt`. No run is started on battery below 30 %.

## Commits

- Each commit holds the executor's own files only, named by pathspec: `git commit -m "…" -- <paths>`; a new file is
  added by explicit path first. Never `git add -A`, never `git stash`. `CAND-APP-PLAN.md` is never staged or
  touched. On `index.lock`, wait a few seconds and try again. The branch is `feat/entity-signup-multi-grant`; no
  branch is created or switched.
- A commit that changes `$S/schema/`, a migration, the manifest or the generated database types carries `[db]` in
  its subject.
- `yarn assert:comment-hygiene` runs on the working tree before every commit that adds or changes a comment under
  `apps/`, `packages/` or `tests/`.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The executor edits none of `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`,
  `179-CONTEXT.md`, `179-RESEARCH.md`, `179-PATTERNS.md`, `179-UI-SPEC.md` and `CLAUDE.md`. A sentence of one of
  them that the work made false is reported, not edited.

## Comments, titles and logs

A comment, a docstring, an SQL header and a test title describe the code as it is, to someone reading it cold: no
account of what the code used to do, no decision, plan, ruling, assumption or requirement id, nothing addressed to a
reviewer. The ids in a PLAN.md (`D-06`, `U-01`, `J3`, `PL-10`, `P4`) stay in the PLAN.md and the SUMMARY.md. The
analogs `179-PATTERNS.md` marks **structure only** carry history, debug paths and phase or threat ids in comments;
they are analogs for structure, not for comment style, and a comment this phase touches is brought in line.

**No address, token, token hash, link, password, key, `sub` value or identity claim value is ever written into a log
line, an error message, a test title, a file under the phase directory or a run's kept evidence.** A probe prints
statuses, codes, booleans, subjects and times.

## Searches and checks

- Every population of something already on the tree is a command plus the relation it must satisfy; no count in a
  plan is a target. Code is never bent to a count or to a search; a check is never edited to pass; a correct
  implementation in another form is reported with the stage it fails and the result of the same chain with that one
  stage restated.
- A negative search excludes test files where the plan says so (`':!*.test.ts'`). A count of lines naming a symbol
  is also tripped by a comment naming it: a call site is counted by a form a comment cannot match.
- `git grep -E` on this host does not read `\b`: use `([^A-Za-z]|$)`.
- A lookup of a message key does not split the key on every dot: each `contestantApp.*` catalogue file wraps its
  messages in one top-level key that is the file's own name without `.json`; `common.json` wraps its in `common`.
- An `<automated>` block is run from a script file taken byte for byte from the plan (`$U/<plan>-t<N>-verify.sh`)
  with `bash`, never pasted into the login shell. Its log, exit status and head are kept beside it. A block that
  holds a long gate is launched in the background and polled.
- A check that decides whether something may be done refuses when it cannot look.
- An agent's diagnosis of a cause is unconfirmed until re-tested in isolation. A summary says which of its
  statements were observed and which inferred.

## The database, the functions and the stack

- `Skill("database")` is loaded before the schema, a pgTAP file or an Edge Function is edited.
- **The frozen procedure (operator ruling 2026-10-21, item 1).** A schema change is one commit with three parts:
  the edit of the `$S/schema/` file that owns the concern; the same change as a new migration
  `$S/migrations/<next>_<name>.sql`, where `<next>` is the five-digit number after the highest in
  `$S/migrations.manifest.json`; that migration's line, with its `shasum -a 256`, appended to the manifest's
  `migrations` list. A function re-created by a migration has the same body text, comments included, as in
  `schema/`. Before the commit: `yarn assert:schema-migration-parity` (exit 0) and `yarn check:schema-equivalence`
  (in the background; Docker; isolated instances `eq-m` and `eq-s`, ports 55400–55509; exit 0 and the verdict
  `EQUAL`). `yarn schema:regenerate` is never run to write anything. A plan that finds the manifest absent at its
  schema step stops and reports.
- **The schema reaches the database by the reset** (there is no remote project to push to; nothing is deployed).
  The database rows run in a fixed order: the reset, the types on the freshly reset database, pgTAP, the SQL lint,
  the integration test — `bash $P/179-gates.sh <label> --rows db-reset,types-regen,types-clean,pgtap,sql-lint,integration`,
  judged with `node $P/179-verdict.mjs gates <label> --rows …`.
- `$S/tests/database/00-helpers.test.sql` is not edited. A new pgTAP assertion is committed red and alone before
  the schema that turns it green, with the red run's log, status and head kept as `$U/<plan>-pgtap-red.{log,exit,head}`.
- **`yarn db:reset` never runs while an E2E run is in flight** (a `started` marker without an `ended` beside it at
  any depth under `tests/e2e-runs/`); the driver refuses.
- **Docker is never restarted**: an unrelated Supabase stack runs on this host. **This project's stack is shared
  with the `-infra` worktree**; it is free to use under the standing authorisation, no checkpoint is needed to ask,
  and no two tasks of this phase use it at once. It is restarted only by `yarn db:stop` followed by `yarn db:start`
  (the output of `yarn db:start` filtered through `node tests/scripts/withhold-stack-keys.mjs`, its status read from
  `PIPESTATUS[0]`), only where a plan says so, never while an E2E run is in flight, and is left running at the end
  of every task that uses it. From 179-05 on the wrapper serves `identity-callback` itself and restores the stack at
  its own end. On `ENOSPC`: `docker builder prune -af` first.
- The edge runtime runs `policy = "per_worker"`: a function edit is judged by the default runtime only after a
  restart, and the gate driver's `stack` row says what the running services hold.
- Nothing is deployed: PostgreSQL 17, no compatibility shim, no migration of stored data.

## E2E

- **No red E2E test is ever committed, and no commit turns a committed test red.** A change a browser can observe —
  a page, a layout, a load, a component a page renders, a route that is linked, the callback, the gate table, a
  function the suite calls, the wrapper — stays in the working tree until a run of that uncommitted tree has passed,
  and is committed together with the spec and fixture changes that depend on it: one commit. What may be committed
  before it: a unit or component test file, red and alone; a module that decides nothing yet; an operation nothing
  calls; a fixture step no spec calls; a component nothing renders; a route nothing links to; catalogue keys no
  screen reads. Each plan says, under *What this plan's commits do to committed specs*, which commit is the one.
- **A run of an uncommitted tree** goes directly through the wrapper: `tests/scripts/e2e-run.sh --run-dir $R/<label> --no-db-reset [--project <name>]`,
  then `node tests/scripts/e2e-evidence.mjs $R/<label>`, judged with
  `node $P/179-verdict.mjs control <label> (--project <name> --setup <setup project> | --full) --dirty-only <path>… (--red "<title substring>"… | --green)`.
- **A negative control counts** only when exactly the named tests are red, each ended `failed` on an expectation —
  not on a timeout, not on a compile error — and every other test of the run passed.
- **Every plan that changes a surface a browser can observe, a dataset, the schema, a function or the harness
  closes on a full default run of its own committed tree**: `bash $P/179-e2e.sh <plan>-close`, judged with
  `node $P/179-verdict.mjs e2e <plan>-close --same-projects-as <its predecessor's label, or $(cat $P/179-BASELINE) for the first> [--except <project>=<delta>]…`,
  the deltas being the tests the plan adds, stated in the plan. **Until 179-05**, a plan that changes the schema, a
  function or the bank-auth specs also closes on `bash $P/179-bankauth.sh <plan>-close` (both opt-in projects, each
  run alone, the stack restored and probed).
- **Void** is decided by the wrapper's marker alone: status 8 with `VOID-host-suspend.txt`. A void run is kept and
  made again under the next `-rN` suffix. A red run without the marker is a failure; with no other cause,
  `pmset -g log` is read before the tree is blamed. A did-not-run is a failure. Nothing is retried until green on
  an unchanged tree; no test is skipped or annotated to pass. Nothing under `tests/e2e-runs/` is deleted.
- A dev server is started by the wrapper and by nothing else. **No spec waits a fixed time** (the CI runner is
  about four times slower). A count is never waited out: the page's clock is advanced, and a mail slot is given
  back through the existing release step before a press that must send.
- A spec holds hard assertions only and no locator in a test body: every locator is in a fixture and every id comes
  from `$T/utils/testIds.ts`. A message is read from its catalogue file, never copied. A mailed link is opened **as
  received**: only its scheme, host and port are replaced by the run's origin (`$T/utils/mailedLink.ts`).
- No expectation takes an address's existence, a link, a token, a `sub` or a claim value as its subject, and a "no
  mail" assertion is made only after the request's completion witness has finished.
- The auth service admits thirty sign-ins and thirty link verifications in five minutes from one origin; a spec
  that would pass that number says so and paces itself.

## An interrupted cycle

From the step that writes uncommitted changes until the step that commits them, the working tree holds exactly the
files that plan's `<uncommitted_changes>` block names, and a copy of each as the pre-commit run ran it is kept
beside the run (`$R/<label>.<file name>.kept`). The next executor either goes on from the working tree (or from the
kept copies, copied back) or discards the change with `git checkout -- <the named files>` and deletes the new ones,
and starts that task again. The gate driver and the E2E driver refuse a tree with uncommitted changes outside
`.planning/`.

## Code rules that bind every edit

- `CLAUDE.md` § *Context Destructuring Rule*: `appSettings`, `answersLocked`, `user`, `selectedEntity`, `locale`,
  `entryFlow` and `dataRoot` are reactive accessors — read `contestantCtx.X` inside the tracking scope, never
  destructure; `dataRoot` is never bound to a read alias. `t`, `getRoute`, `logout` and the writer-backed
  functions are stable.
- `CLAUDE.md` § *Results Navigation Invariants*: no element added by this phase carries a `view-transition-name`,
  no `<dialog>` is added, and no layout load reads a `url` or `route` property. The protected layout's load reads
  the two params it reads today and, added by this phase, one cookie; its tracked-read test passes unchanged.
- **What registration offers is asked of `listedRegistrationModes` and `identityProviderEntityTypes`, and of
  nothing else.**
- **The type cookie only selects; it never authorises.** Every reader of it re-checks the matrix; the function's
  check is the authority (D-03).
- **No code path calls `admin.updateUserById` with an `email` key, or `admin.createUser`, for an identity-provider
  account; the only `email_confirm: true` is on the placeholder** (D-06, research Pitfall 1).
- **The placeholder address is never rendered, sent to a password manager or spoken**; the server load decides,
  no component tests a domain.
- New markup writes no numeric spacing class and no arbitrary value but the address block's
  `[overflow-wrap:anywhere]`: `xs`, `sm`, `md`, `lg`, `xl`, `xxl` and `touch` only.
- A string a user reads has a message key in all seven locales; a mail is such a string. A typed address is
  rendered as text.
- `.agents/code-review-checklist.md` is walked in every plan that adds application code; each item's outcome is
  recorded in the summary. `Skill("components")` is loaded before a `.svelte` component or a context consumer is
  edited.
