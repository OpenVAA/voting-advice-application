# Phase 178 — Execution Rules

> Read once by every executor of a Phase 178 plan, before its first task. Each plan names this file in its
> `<context>`. A plan's own blocks add to these rules and never relax them. Where a plan and this file
> disagree, stop and report.

**A hook line of the form `CONTEXT WARNING NN%` in a tool's output belongs to the orchestrator. Ignore it and
keep working; it is never a reason to stop, to shorten a task or to hand a plan back unstarted.**

## When this phase runs

Phase 178 executes only after **Phase 177 is complete and verified**: its closing summary and its verification
report are on the tree, and its closing full E2E run is this phase's baseline. Plan 178-01 checks that and stops
with a report when it is not so. The plans were written on 2026-10-11, begun at head `f9ec1e613` and finished
while Phase 177's third plan was being executed — **before Phase 177 was complete**: about twenty-five files are
edited by both phases (`178-RESEARCH.md` § *Phase 177 overlap*). Every
path and symbol in a plan is therefore a hint, resolved by the symbol or the quoted content given and never by a
line number, and every population is derived again by the command given when the plan runs.

**Phase 177.1** (invitations: a required `p_confirm_entity`, an optional `p_nominations`) is not discussed, and
whether it runs before or after this phase is not decided. These plans are written against
`public.create_invitations (p_project_id uuid, p_invitations jsonb)` — the signature on the tree on the planning
day. No plan calls that function directly: every invitation of an E2E spec is seeded through the
`invitationFlow` fixture steps `seedEmailInvitation`, `seedCodeInvitation` and `seedProjectInvitation`, for an
entity that has **no nomination**, so seeding makes nothing public under either form. Plan 178-01 records which
signature is on the tree. **When 177.1 is on the tree, the one located change is the confirmation argument the
fixture's seeding steps then take** — one argument at each call of those steps in the specs and setups of plans
178-14, 178-16, 178-17, 178-19, 178-21 and 178-22 — and the same parameter at each `create_invitations` call a
new pgTAP section of plans 178-05 and 178-06 makes.

Four orders meet in this phase and are reconciled once, here:

1. **D-23's two fixed orderings are kept**: a server addition lands before the screen that calls it (the schema,
   the recovery operation and its mail are plans 178-04 to 178-07, ahead of every screen), and a removal lands
   only after its replacement works.
2. **The dataset, the fixtures and the semantic steps are built before the screens they assert** (178-03,
   178-12) — the operator's standing instruction, the order Phases 175, 176 and 177 took. **This departs from
   D-23's letter**, which puts the E2E work in its fifth stage; D-23 is not amended. Each screen's spec is then
   written first, in that screen's own plan, and seen red before the screen is built.
3. **Tracer first, after the dataset and the fixtures.** The tracer is plan 178-14 — one path through every layer:
   a link asked for on the sign-in screen, the "email sent" screen, the mailed link opened as received, the
   set-password gate, the terms, the entity's home. Plans 178-08 to 178-13 before it add only what no page links
   to, and plan 178-15 after it adds two more routes nothing links to. **It pulls D-23's fourth stage (the gate) ahead of its second (A and C)**; item PL-01.
4. **Two couplings from the research are binding.** (a) The sign-in screen lands beside the unchanged login page
   (178-13), every helper that drives the sign-in form is re-pointed and the suite is shown green, and only then
   does the login page lose its form (178-18, Task 1 before Task 2). (b) The callback's line that sends a user
   without a password to the legacy set-password page is deleted only in the commit that adds the set-password
   gate (178-14, Task 2).

D-23's "one migration regeneration" is read as one generated migration **file**: every commit that edits
`apps/supabase/supabase/schema/` regenerates it in the same commit, because `yarn assert:schema-migration-parity`
refuses a commit that does not. Item PL-02.

## Names

| Name | Value |
|---|---|
| `P` | `.planning/phases/178-sign-in-email-code-registration` |
| `P177` | `.planning/phases/177-define-nominations` |
| `P176` | `.planning/phases/176-contestant-home-task-state-nominations-view` |
| `P174` | `.planning/phases/174-invitations-grants-defined-in-advance` |
| `S` | `apps/supabase/supabase` |
| `FN` | `apps/supabase/supabase/functions/account-access` |
| `F` | `apps/frontend/src` |
| `ENTRY` | `apps/frontend/src/routes/contestant` |
| `C` | `apps/frontend/src/lib/contestant/components` |
| `M` | `apps/frontend/messages` |
| `T` | `tests/tests` |
| `R` | `tests/e2e-runs/178-e2e` (gitignored) |
| `U` | `tests/e2e-runs/178-unit` (gitignored) |
| `BASE` | the one line of `$P/178-BASE`: the last commit that changed a file outside `.planning/` before the phase |
| `BASELINE` | the one line of `$P/178-BASELINE`: the directory of the full E2E run every comparison starts from |

Both files are written and committed by plan 178-01 from the tree as it stands then. **No plan states a count, an
ordinal, a head or a run directory of the planning day as a target**: each is read from those two files, from a
run's own records or from a command. The number of a new pgTAP file is the next free one when its plan runs.

## Names this phase introduces

Fixed by the context or the UI contract: the routes `login/email`, `register/email`, `register/sign-in` and
`email-sent`; the six component names; the key `password_set`; the test ids and the message keys of
`178-UI-SPEC.md` § *Locator Contract* and § *Copywriting Contract*. Chosen by the planner, and binding on every
plan once written here:

| Layer | Name | What it is |
|---|---|---|
| SQL | `private.caller_password_set () RETURNS boolean` | whether the caller's own account has a password; no argument; `STABLE SECURITY DEFINER`, `search_path = ''`; executable by `authenticated` alone; in `$S/schema/301-auth-functions.sql` |
| SQL | `private.user_password_set (p_user_id uuid)` | unchanged, **moved** from `506-invitation-rpcs.sql` to `301-auth-functions.sql`; executable by no API role |
| SQL | key `password_set` of `public.get_user_entities` | beside `entities`; the function's signature, cardinality and security mode do not change |
| SQL | `private.registration_mode_allowed_in (p_settings jsonb, p_entity_type text, p_mode text) RETURNS boolean` | the matrix rule, `IMMUTABLE`, reads no table |
| SQL | `private.registration_mode_allowed (p_project_id uuid, p_entity_type text, p_mode text) RETURNS boolean` | reads the project's settings row and asks the rule; executable by no API role |
| SQL | `private.invitation_mode_allowed (p_invitation public.invitations) RETURNS boolean` | the condition, stated once: true for a row that is not judged, else the matrix's answer for the row's project, target type and mode; in `506-invitation-rpcs.sql` |
| SQL | `public.recovery_link_request (p_project_id uuid, p_email text) RETURNS jsonb` | `{"email": …, "mail": "recovery" \| "sign-in"}` or null; `SECURITY DEFINER`; executable by `service_role` alone; takes the address's `link:` slot |
| SQL | member `access.answersLocked` of `public.contestant_app_public_config` | the fourth value of the public configuration (J5) |
| SQL | `public.send_email_hook (event jsonb) RETURNS jsonb` | the no-op mail hook (J6); executable by `supabase_auth_admin` alone |
| pgTAP | `<next free>-registration-mode-matrix.test.sql` | the truth table of the matrix rule |
| dev-seed | `packages/dev-seed/tests/registrationModeMatrixParity.test.ts` | the same table against `isRegistrationModeAllowed` |
| function | operation `'request-recovery'`; `RequestRecoveryRequest`; `issueRecoveryLink`; `RECOVERY_MAIL_TEMPLATES`, `renderRecoveryMail`; `LinkType = 'magiclink' \| 'recovery'` | the recovery operation of `account-access` |
| writer | `requestPasswordRecovery (opts: RequestPasswordRecoveryOptions)`; `parsePasswordRecoveryRequest`; `BasicUserData.passwordSet: boolean`, filled on every call of `getBasicUserData`, which takes no argument | in `$F/lib/api/base/dataWriter.type.ts` and the Supabase adapter |
| frontend | gate id `'setPassword'`; `$F/lib/contestant/gates/SetPasswordGate.svelte` | the set-password gate, whose list takes `BasicUserData` |
| frontend | route keys `ContestantAppSignIn` (B), `ContestantAppRegisterEmail` (D1), `ContestantAppRegisterSignIn` (D2), `ContestantAppEmailSent` (E) | in `$F/lib/routes/route.ts` |
| frontend | `AppGate.entryRoutes` | the frozen list of route keys a signed-in caller is sent away from |
| frontend | `$F/lib/contestant/utils/registrationOffer.ts`: `listedRegistrationModes (appSettings)` | the one list A, C, the menu and the guard of `register/` read; takes the settings as its argument |
| frontend | `$F/lib/contestant/entryFlow/` — `entryFlow.ts`, `index.ts`: `EntryFlow`, `EntryLinkRequest`, `RESEND_WAIT_SECONDS` (65), `LINK_REQUEST_SETTLE_BOUND_MS` (10 000), `settledOrBounded`, `secondsLeft`, `askedAgainTooSoon` | the flow's pure module |
| frontend | context members `entryFlow` (reactive accessor), `holdEntryCode`, `sendEntryLink`, `resendEntryLink`, `clearEntryFlow`, `checkInvitationCode`, `requestSignInLink`, `requestPasswordRecovery` (stable functions) | on the contestant context |
| dev-seed | base-dataset rows `test-e2e-base-ca-registration`, `test-e2e-base-or-registration`, `test-e2e-base-ca-recovery`, `test-e2e-base-ca-scan-open`, `test-e2e-base-ca-scan-used` | reserved, unconfirmed, with no nomination, answer or editor |
| E2E | address prefixes `email-registration-`, `code-registration-`, `password-recovery-`, `entry-scan-`, `passwordless-session-` | one per spec or setup; none is the beginning of another |
| E2E | specs `contestant-email-registration.spec.ts`, `contestant-code-registration.spec.ts`, `contestant-password-recovery.spec.ts`, `contestant-entry-scan.spec.ts`, `contestant-entry-phone.spec.ts` under `$T/specs/contestant/` | each a project of the same name without `.spec.ts` |
| E2E | setup `passwordless-session.setup.ts` with its teardown under `$T/setup/contestant/`; projects `data-setup-passwordless-session`, `data-teardown-passwordless-session` | the stored session of a user with no password. The signed-out scan spec has no setup pair: it seeds its own codes in its hooks through the `invitationFlow` steps. The project `contestant-entry-phone` depends on `contestant-entry-scan` and uses that spec's two reserved candidates and its address prefix, one after the other |
| E2E | `$T/fixtures/contestant/contestantRegisterPage.fixture.ts`, `contestantEmailSentPage.fixture.ts`, `contestantSetPasswordGate.fixture.ts`, `contestant-registration.ts`; `$T/utils/entryAxeScan.ts` (`declareEntryScans`) | page objects, the composition root, the signed-out scan declarer |
| phase | `178-gates.sh`, `178-e2e.sh`, `178-verdict.mjs`, `178-bankauth.sh`, `178-stack-probe.sh`, `178-read-rulings.mjs`, `178-probe.mjs`, `178-PROBE-FINDINGS.md`, `178-BASELINE-FACTS.md` | the drivers, the probe and their records |

## Items built at the recommended option, each isolated

**The operator read this round on 2026-10-11** (`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, section H
and *Fill status*): J1 is ruled (b) and is built so; PL-29 (a) is the operator's explicit acceptance; every other
item, and each of the UI contract's thirty proposals, is untouched and stands at its recommended option. The
plans build the option marked **built**; the other
option is the located change named beside it. Plan 178-01 reads the operator's reply by one command (below) and
stops the phase when the document says anything else. No executor chooses. Where the UI contract — revised after the
research and then ruled on in its *Checker Sign-Off* — and the research disagree, **the UI contract's ★ is the
later reading and is the one built**; the rows that this decides are marked *(UI over research)*. **On item J1
the operator's ruling is later than all three**: `178-RESEARCH.md` § *J1* (the third bullet of its prescription),
`178-PATTERNS.md` (the gate's parameter type and the paragraph on `passwordSet`) and the UI contract's
shared-code row on `BasicUserData` describe the on-request form. None of them is edited, and where a plan and one
of them differ on this point the plan stands.

### The context's six review items, with the research's rulings inside them

| Item | Question | Built | The other option, and where it lands |
|---|---|---|---|
| J1 | Where "password set" rides (D-06) | (b) — ruled by the operator on 2026-10-11 (decision H1): a key on `get_user_entities` through the new zero-argument `private.caller_password_set`, filled on `BasicUserData` on every call of `getBasicUserData`, which takes no setting. Each Admin job poll and each Admin page load makes one more database round trip | (a), the planner's recommendation, not built: filled only when the protected layout asks for it, through an optional setting of `getBasicUserData` — plan 178-04 Task 3 and the load of plan 178-14 Task 2. (c) a dedicated RPC: plan 178-04 Tasks 1 and 2 |
| J2 | Identity-provider accounts (D-07) | (a) F is built on the stored password; `identity-callback` is not changed; the callback refuses the link types `signup` and `email` as it refuses `invite` | (b) a marker instead of the column: a new server operation — not a located change; the phase stops |
| J3a | The matrix on the server: which rows | open rows only; a claimed code keeps answering `used` | every row: one conjunct in each of three functions, plan 178-05 Task 2 |
| J3b | Faction and alliance targets | not judged, as project-scope promises are not | always refused: the `IN ('candidate','organization')` guard of the condition, plan 178-05 Task 2 |
| J3c | A disallowed row at the claim | absent from the answer (filtered in the `WHERE`) | reported as skipped with a new reason: the claim's loop and the frontend's closed enum, plans 178-05 and 178-04 |
| J3d | The base E2E dataset's organization row | widened to `['email', 'code']`, with its pins | left empty: plan 178-03 keeps the row, and plan 178-17's spec declares settings of its own in the permutation chain |
| J4 | The reading of Additional note 1 (D-19) | `register/` is the one tree, `register/identity-provider` reserved, `preregister/` not moved | a pure rename of `preregister/` here: a plan of its own before 178-23 |
| J5 | Answers locked | (a) A offers sign-in only with the locked sentence; `register/**` leads to A; the stored value joins the public configuration; the server contract is not conditioned | (b) registration stays open: one line of `listedRegistrationModes`, plan 178-08. (c) no public member: plan 178-04 Task 2 and plan 178-18's provider edit |
| J6 | The no-op mail hook | (a) adopted here, in its own task, after the probe row P6 | (b) left to Phase 179, or (c) not adopted: Task 2 of plan 178-20 goes, and row P6 with it |

### The UI contract's proposals

Each stands at its ★. The block each alternative changes is tabled in `178-UI-SPEC.md` § *PROPOSED — Operator to
Confirm* for U-01 to U-07 and U-29; for the others it is the plan named here.

| Item | Question | Built (★) | Lands in |
|---|---|---|---|
| U-01 | Where a screen's main button sits | (a) in the page's actions, tied to its form by `form` | 178-08 (`Button.type.ts`), every screen plan |
| U-02 | Whether a field's label is visible | (a) a visible label, no placeholder | 178-09, 178-11 |
| U-03 | What stays in memory while E is shown — **departs from D-02** | (a) the one request E can repeat, until reload, sign-in, sign-out or replacement *(UI over research, which clears on leaving E)* | 178-10 Task 3 |
| U-04 | When E opens | (a) on the request's settlement, whatever it was — **or ten seconds after it was made**, whichever is first (sign-off ruling 2) | 178-08 Task 3, 178-10 Task 3 |
| U-05 | Before the page's script has loaded — **departs from D-09, D-10, D-12** | (a) native `disabled` on the buttons that need the script | 178-13, 178-15, 178-16, 178-19 |
| U-06 | The main button on B, F and password-reset | (a) always pressable; `validate()` on the setter | 178-11, 178-13, 178-14, 178-19 |
| U-07 | The account's address on F and password-reset | (a) a field that is not rendered, and the address as text | 178-11, 178-14, 178-19 |
| U-08 | A where signing in is the only entry | (a) A is shown with its one entry | 178-18 |
| U-09 | The weight of A's two entries | (a) two filled buttons, sign-in first | 178-18 |
| U-10 | A after an unusable link and after a forced sign-out | (a) a sentence for each | 178-18 |
| U-11 | A deep link's target from A to B | (a) "Sign in with email" passes it on | 178-18 |
| U-12 | Where the locked sentence shows | (a) on A and on B | 178-13, 178-18 |
| U-13 | A correct password for a user with no profile | (a) the "nothing to edit" words on B and D2; the inconsistency filed | 178-13, 178-15, 178-23 |
| U-14 | The shape of C's options | (a) a white block per mode, its panel inside | 178-10 |
| U-15 | The provider's panel | (a) the intro's paragraph alone | 178-16 |
| U-16 | Whose words a field's error is in | (a) the app's; forms are `novalidate` | 178-09 |
| U-17 | D2's title and refusal | (a) its own title and sentence | 178-15 |
| U-18 | E's wording | (a) the operator's sentences, the address, "only the newest" | 178-10, 178-13 |
| U-19 | "Send again" — **departs from D-11** | (a) 65 seconds **from the settlement of the request** (sign-off ruling 1), a tab stop while unavailable | 178-10 |
| U-20 | A second request inside the count — **departs from D-11** | (a) one sentence decided by the tab's own clock; the threshold is the same 65-second constant (sign-off ruling 3) | 178-08, 178-10 |
| U-21 | A reload or direct visit of D1, D2 or E | (a) no notice, no frame | 178-13, 178-15 |
| U-22 | F's frame and its way out | (a) G's frame and G's plain Log Out button *(UI over research and the context's table, which name `LogoutButton`)* | 178-14 |
| U-23 | The menu, signed out | (a) one Register item | 178-16 |
| U-24 | The two mails | (a) the recovery mail in five parts; both say only the newest works | 178-06 |
| U-25 | A password the browser suggests | (a) `passwordrules` on the new-password field | 178-11 |
| U-26 | Accessibility scans — **departs from D-22** | (a) twenty entries in three places | 178-16, 178-18, 178-21, 178-22 |
| U-27 | Phone-width checks | (a) `en`, 320 and 390 px, every screen | 178-22 |
| U-28 | Markers and names | (a) the Locator Contract; B's route key is `ContestantAppSignIn` *(UI over research's `ContestantAppLoginEmail`)* | 178-08, 178-13 |
| U-29 | What "a registration mode is allowed" means — **departs from D-19 and REG-01** | (a) one list, the modes C can list; the function takes the settings as its argument (sign-off ruling 3) | 178-08, 178-16, 178-18 |
| U-30 | A mailed link a scanner opens first | (a) verified when opened; the confirmation page filed as a todo | 178-23 |

### The research's questions for the planner, the pattern map's items, and the planner's own

| Item | Question | Built | The other option, and where it lands |
|---|---|---|---|
| PL-01 | The order of the plans | dataset and fixtures before the screens; the gate (tracer) before A and C | D-23's letter: plan 178-12 moves behind 178-19, and 178-14 behind 178-18 |
| PL-02 | D-23's "one migration regeneration" | one generated file, regenerated in every schema commit (178-04, 178-05, 178-06, 178-20) | one commit for the whole schema block: plans 178-04 to 178-06 become one uncommitted set |
| PL-03 | Research question 9: where a visitor bounced from a protected URL lands | on A, which passes `redirectTo` to B (U-11) | on B: the unauthenticated redirect of the gate row, plan 178-18 |
| PL-04 | Research question 10: when the flow state is cleared | U-03 (a) | see U-03 |
| PL-05 | Research question 11: the resend margin | 65 seconds from settlement (U-19, ruling 1) | 60: the constant, plan 178-08 |
| PL-06 | Research question 12: a server load on `password-reset` | yes | the browser's `goto` stays: plan 178-19 Task 2 |
| PL-07 | Research question 13: the claim-and-refresh pair | extracted when D2's action is added | left twice: one step of plan 178-15 Task 2 |
| PL-08 | Pattern item 3: "the 07 census does not grow" | true for D-06; the census gains `recovery_link_request` (and `send_email_hook` under J6) | — a fact, not a choice; recorded so that the context's sentence is not read phase-wide |
| PL-09 | Pattern item 5: how F gets the address | the view reads `contestantCtx.user?.email`: the context derives `user` from `page.data.user`, and a gated load returns `{ gate, user }` | the layout passes `data.user` to the view: `+layout.svelte` and the `GATE_VIEWS` component type, plan 178-14 |
| PL-10 | Pattern item 8: "no mail" after a request a page made | the test adds a completion witness to the page's own request by intercepting it; the answer does not depend on a witness | a further witnessed request for the same address made after it, as the contract spec's last test does: one fixture step, plan 178-12 |
| PL-11 | Pattern item 9: the stored session of a user with no password | written once by a setup through a real mailed link, read-only for the run | each reading describe makes its own session through a link in a `beforeAll`: plan 178-22 |
| PL-12 | Pattern item 10: a dark twin for a signed-out scan | a sibling declarer, `declareEntryScans` | `declareScans` generalised: plan 178-12 Task 3 |
| PL-13 | The names of the recovery pieces (the context's discretion) | `request-recovery`, `recovery_link_request`, `requestPasswordRecovery`; `requestForgotPasswordEmail` does not survive as a name | any other name: plans 178-06, 178-07, 178-19 |
| PL-14 | Reserved rows for the new specs, and where a spec seeds and cleans — **the second half departs from D-21's letter** | five rows added to the base dataset, each spec with rows and an address prefix of its own; each new spec seeds its invitation and removes its user and invitations **in its own hooks** — before all, after each, after all — as the invitation landing spec does, and has no setup project and no teardown project of its own. D-21 says "each seeding its own invitation in a setup project" and "each has a teardown"; its purposes are kept — a seeded invitation before the test, nothing left behind, claimed rows included — and its letter is not. D-21 is not amended. The passwordless session of plan 178-22 is the one setup and teardown pair the phase adds | the contract spec's two rows shared: the specs join one serial project, plans 178-03 and 178-12. D-21's letter: a setup project and a teardown project for each of the email, code and recovery specs — two project entries and two files each, in plans 178-14, 178-17 and 178-19, and cleanup then runs once at the end instead of after each test |
| PL-15 | Where FIX-01's case lives | a spec of its own with a user of its own | a third test of the email spec: plan 178-19 Task 1 |
| PL-16 | Probe row P7 | measured at the auth service's password sign-in, **nine** attempts for each of the three cases, twenty-seven sign-ins — the local stack admits thirty password sign-ins in five minutes, a limit of its own beside its thirty link verifications, and the probe budgets each of the two separately at twenty-eight, never their sum — because B's action adds no step before that call | thirty each through B's action: one more row of the probe after plan 178-13 |
| PL-17 | The catalogue's keys (the UI contract: "one task owns every key") | the new keys in one task (178-08); a reworded key with the screen that shows it; a removed key with its last reader (178-23). The waves are serial, so no two plans edit a catalogue at once | one task for all: the rewordings and removals move into plan 178-08, which then closes on a full run |
| PL-18 | D-17 and J6 | one plan and one restart of the stack; J6 is Task 2 alone | two plans, two restarts |
| PL-19 | B and E before the tracer, D1 and D2 before C — **with two windows in which an entry route is reachable by a signed-in user** | committed as routes nothing links to (178-13, 178-15), walked for the first time by the tracer's test and by plan 178-17's code spec. Until plan 178-16 lands the gate table's list of entry routes, a signed-in user can open these routes and post their actions: **B and its sign-in action from plan 178-13's commit (three plans; T-178-79), and D1, D2 and D2's code sign-in action from plan 178-15's commits (one plan; T-178-155)**. In either a user can replace their own session by signing in again, which signing out and in does too; nothing links to any of them and nothing is deployed between the plans | built inside the tracer's one commit: plans 178-13 and 178-14 merge. To close both windows: the list of entry routes and the hook's use of it land before plan 178-13, naming route keys as each is added — the gate-table half of plan 178-16 moves ahead of 178-13 |
| PL-20 | A held change that reaches every stored session | shown green on a **full** run of the uncommitted tree (`control --full`) before it is committed | a one-project control and the plan's closing run: the verdict's `--full` form goes, plan 178-01 |
| PL-21 | Where D-21's organization spec ends | on the organization's home, which Phases 175 and 176 built | — |
| PL-22 | Phone-width checks (U-27) | a spec of their own, `contestant-entry-phone.spec.ts` | inside the scan specs: plan 178-22 |
| PL-23 | The order of the screen plans | D1 and D2 as routes nothing links to (178-15), then C (178-16), then the helpers and A (178-18) — so that no commit has a Register entry or a code check that leads nowhere, and the login page keeps its form until every helper has moved | A before C: plan 178-18 moves ahead of 178-16, and for one plan A's Register leads to the legacy code page |
| PL-24 | Where the guard of the registration pages lives (D-19: the layout load and the code guard "are rewritten for the new tree") | a module, `lib/server/contestant/registrationGuard.ts` (`refuseUnlessRegistrationOffered(event, need)`), asked by each registration page's own server load — because the UI contract lets no layout load this phase adds or changes read a `url` or `route` property, and a layout guard can tell the three pages apart only by the route. A departure from D-19's letter, not an amendment of it | D-19's letter: one `register/+layout.server.ts` that reads the route id, as the legacy one does — plan 178-16 Task 1, and the three page loads go |
| PL-25 | Where D-24's zero-hit searches stop ("outside `.planning/`") | outside `.planning/` and outside the spike-findings skill, whose reference and script list `newUserEmail` among the members a past codemod handled: a record of what a spike measured is not rewritten, and its hits are listed. `registrationKey` is in addition allowed below the pre-registration routes, their API route and `identity-callback`, which are Phase 179's (the context's own boundary) | D-24's letter: the two files of the skill are edited so that the search finds nothing — one step of plan 178-23 Task 2, and the exclusion leaves the searches of plans 178-23 and 178-24 |
| PL-26 | When the two opt-in bank-auth projects run (D-24 (i): "each run alone") | once, at the closing gate (178-24 Task 3), on the closing tree. Three plans change what they rest on — the gate (178-14), the entry routes and the hook (178-16), the auth configuration (178-20) — and none runs them: the driver needs a stack configuration of its own and two restarts. Neither spec opens the login screen or the selector | also at the close of plans 178-14, 178-16 and 178-20: one step and two restarts each, so that a break is met in the plan that made it |
| PL-27 | How D-18's second bound on a mailed link, its lifetime, is asserted ("both of which the planner asserts rather than assumes") | pinned and compared, not waited out: plan 178-02 records the configured `otp_expiry` beside row P1, which observes single use; plan 178-20 requires the key under `[auth.email]` in the auth-configuration gate with self-test cases and has the stack probe compare the running service with the file; plan 178-23 names it among a hosted project's settings. No task shows a link refused after that time | also observed: one more step of probe row p1 ages a minted link's row past the lifetime through the database and presents the token — plan 178-02 Task 1, with a verdict line of its own |
| PL-28 | D-05's "in status, body and timing" for a switched-off mode, at the code check — **departs from D-05's letter on timing** | status, body and side effects are built and asserted; timing is not built for the synchronous code check, which reads the project's settings row for an open, unexpired invitation and not for a code that names nothing — one primary-key read. Accepted and recorded (T-178-156): what it can tell is that a code its holder already has names an invitation whose mode is off; no deterministic test can assert a timing; the link request is unaffected, it answers before its work | the code check reads the settings row on every call, whatever the code, so both paths make the same reads — plan 178-05 Task 2 step 3, still without a timing assertion |
| PL-29 | What a session with no password may reach outside the Contestant App's protected layout (the roadmap: "before any other page"; D-03 accepts the data API only) | accepted by the operator on 2026-10-11 (decision H38 (a), put to the operator by name) and documented: the set-password gate is the Contestant App's. A passwordless link session whose grant gives it the admin role — a project-scope invitation claimed through a mailed link — reaches the Admin App's protected pages, its two form actions and its six job endpoints, which decide by a verified identity and the role. Stated in plan 178-14's threat register (T-178-153) and in the authentication page (178-23), on D-03's own reasoning: the session was obtained by proving the address and no authority depends on having a password | (b) the same gate in the Admin App: a plan of its own after 178-14 — the password fact read by the Admin protected layout's load and by the one decision its eight server entry points share, a set-password view that does not read the contestant context, their unit cases and one E2E case; about three tasks and one more full run. (c) handed to Phase 179, which already decides what an account without a chosen password is |

`$P/178-read-rulings.mjs`, built by plan 178-01 from Phase 177's reading command, reads a decision document by a
fixed rule: no box ticked and no NOTE text means the recommended option; exactly one box ticked on the
recommended option means the same; anything else — another box, two boxes, any NOTE or EDIT text, stray text —
is a halt with the item printed verbatim. One item is read otherwise, because the plans already build the
operator's ruling on it: H1 of the round document (item J1) reads `applied` when exactly its option (b) is ticked
and nothing else is said under it, and is a halt in every other state — untouched, or ticked on its ★, included.
No other item has an accepted second option. The orchestrator names the document that holds this phase's round in the
two-line file `$P/178-OPERATOR-ROUND` (line 1: the document's path; line 2: the letters of its sections). When
that file is absent, every item above stands at its built option under the operator's standing convention that an
unticked proposal means its recommended option — J1 excepted, which stands at (b) on the ruling recorded above —
and plan 178-01 records that sentence.

## The probe rows, and what rests on each

Plan 178-02 runs `$P/178-probe.mjs` on the local stack before anything is built and writes
`$P/178-PROBE-FINDINGS.md` with one verdict line per row. **A diagnosis read from source or reasoned from
structure is unconfirmed until its row has been run**; the research marks the token-family claim (P2) so.

| Row | Assumed | The plans that rest on it | If it comes out the other way |
|---|---|---|---|
| P1 | verifying a `recovery` token changes no stored password | 178-06, 178-07, 178-19 | the callback verifies every link as `magiclink` and reads `type` for the landing alone (178-19), and `recovery_link_request` answers `recovery` only for an account whose password is set (178-06) |
| P1-EXPIRY | nothing: the configured lifetime of a mailed link is read from the file and recorded, not observed | 178-20 (pins it in the gate and compares the running service), 178-23 (the hosted setting) | the gate of 178-20 fails when the file's value is not the recorded one, and the difference is settled there |
| P2 | a sign-in link and a recovery link stop each other | 178-06 (the shared slot), 178-10 and 178-06 (the texts) | nothing changes: the shared slot and "only the newest" are then merely cautious |
| P3 | the two-call recipe leaves an empty password; an `identity-callback`-shaped account stores one | 178-04, 178-12, 178-14, 178-22 | an empty hash cannot be made: the gate has nobody to meet it — the phase stops at 178-02 |
| P4 | after `updateUser({ password })` on a link session the next server read answers `password_set = true` with the session as it is | 178-14 (F passes by `invalidateAll()`) | F's handler calls `refreshSession()` through the writer before the rerun; if the session is unusable, F leaves by a full page load to the app root (178-14 Task 2, one branch) |
| P5 | the length setting binds `PUT /user` and an admin `createUser` with a password, and stops no sign-in with an older, shorter one | 178-20; 178-23 (what the docs say the length binds) | recorded; a fixture that would then fail to be created is corrected in 178-20 |
| P6 | under a no-op mail hook `generate_link` and `/verify` keep working and no auth-service mail is sent | 178-20 Task 2 | the hook is not adopted: Task 2 is reverted in its own working tree and J6 is filed |
| P7 | the password sign-in's timing does not tell an unknown address from a wrong password or an account with no password | 178-23 (the residual's wording in the docs) | recorded as a residual of the auth service, reachable with the anon key whatever a screen does |

## The shell

- Begin every shell call that runs `yarn`, `npx` or `node` with
  `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`.
- A status is read from the command itself, never through a pipe. A commit follows a gate with `&&`, never `;`.
- No gate-set run, E2E run or batch is made in the foreground: launch it in the shell tool's background mode as
  `( caffeinate -dimsu <command>; echo $? > <marker>.exit ) > <marker>.log 2>&1` and poll with one short
  foreground command per poll (a bounded loop of at most 45 one-second waits that ends when the `.exit` marker
  exists). Ceilings: 20 minutes for one run or one gate set. A foreground gate trips the executor's 600-second
  watchdog.
- Before a long run: `pmset -g batt`. No run is started on battery below 30 %.

## Commits

- Each commit holds the executor's own files only, named by pathspec: `git commit -m "…" -- <paths>`; a new file
  is added by explicit path first. Never `git add -A`, never `git stash`. `CAND-APP-PLAN.md` is never staged. On
  `index.lock`, wait a few seconds and try again. The branch is `feat/entity-signup-multi-grant`; no branch is
  created or switched.
- A commit that changes `$S/schema/`, the migration or the generated database types carries `[db]` in its
  subject and holds the regenerated migration (`yarn schema:regenerate`) and the regenerated types
  (`yarn db:types`).
- `yarn assert:comment-hygiene` runs on the working tree before every commit that adds or changes a comment
  under `apps/`, `packages/` or `tests/`.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The executor edits none of `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`,
  `178-CONTEXT.md`, `178-RESEARCH.md`, `178-PATTERNS.md`, `178-UI-SPEC.md` and `CLAUDE.md`. A sentence of one of
  them that the work made false is reported, not edited.

## Comments, titles and logs

A comment, a docstring, an SQL header and a test title describe the code as it is, to someone reading it cold: no
account of what the code used to do, no decision, plan, ruling, assumption or requirement id, nothing addressed to
a reviewer. The ids in a PLAN.md (`D-06`, `U-01`, `J3`, `PL-10`, `P4`) stay in the PLAN.md and the SUMMARY.md.
Several analog files carry history and plan ids today (`178-PATTERNS.md` marks them **structure only**); they are
analogs for structure, not for comment style, and a comment this phase touches is brought in line.

**No address, registration code, token, token hash, link or password is ever written into a log line, an error
message, a test title, a file under the phase directory or a run's kept evidence.** A probe prints statuses,
subjects and times.

## Searches and checks

- Every population of something already on the tree is a command plus the relation it must satisfy, and no such
  count written in a plan is a target. The number of tests a plan itself adds is stated and pinned. Code is never
  bent to a count or to a search; a check is never edited to pass; a correct implementation in another form is
  reported with the stage it fails and the result of the same chain with that one stage restated.
- A negative search over a directory excludes test files (`':!*.test.ts'`). A count of lines naming a symbol is
  also tripped by a comment naming it: a call site is counted by a form a comment cannot match.
- `git grep -E` on this host does not read `\b`: use `([^A-Za-z]|$)`.
- A lookup of a message key does not split the key on every dot: each `contestantApp.*` catalogue file wraps its
  messages in one top-level key that is the file's own name without `.json`; `common.json` wraps its in `common`.
- An `<automated>` block is run from a script file taken byte for byte from the plan (`$U/<plan>-t<N>-verify.sh`)
  and run with `bash`, never pasted into the login shell (zsh does not split an unquoted variable into words). Its
  log, exit status and head are kept beside it. A block that holds a long gate is launched in the background and
  polled; a block of searches and verdict readings may run in the foreground.
- A check that decides whether something may be done refuses when it cannot look: an in-flight search that fails
  is not an answer of "nothing in flight".
- An agent's diagnosis of a cause is unconfirmed until it has been re-tested in isolation. A summary says which
  of its statements were observed and which were inferred.

## The database, the function and the stack

- `Skill("database")` is loaded before the schema, a pgTAP file or the Edge Function is edited.
- The schema is edited in `$S/schema/*.sql`; `$S/migrations/00001_initial_schema.sql` and
  `packages/supabase-types/src/database.ts` are generated and never hand-edited. `$S/tests/database/00-helpers.test.sql`
  is not edited by this phase: a file that needs a registration-mode matrix writes it in its own setup.
- The order of the database rows is fixed: the reset, then the types on the freshly reset database, then pgTAP,
  then the SQL lint, then the integration test. They are run through the gate driver:
  `bash $P/178-gates.sh <label> --rows db-reset,types-regen,types-clean,pgtap,sql-lint`, judged with
  `node $P/178-verdict.mjs gates <label> --rows …`.
- A new pgTAP assertion is committed red and alone before the schema that turns it green, with the red run's log,
  exit status and head kept as `$U/<plan>-pgtap-red.{log,exit,head}`.
- **`yarn db:reset` never runs while an E2E run is in flight** (a `started` marker without an `ended` beside it
  at any depth under `tests/e2e-runs/`); the driver refuses.
- **Docker is never restarted**: a second, unrelated Supabase stack runs on this host. **This project's stack is
  restarted only by `yarn db:stop` followed by `yarn db:start`, only in the tasks that say so** (178-07, 178-20
  and the bank-auth driver's own restore), never while an E2E run is in flight. The auth configuration and the
  function's source are read when the stack starts, so a change to either is judged only after that restart, and
  the `stack` row of the gate driver says what the running services hold. On `ENOSPC`: `docker builder prune -af`
  first.
- Nothing is deployed: the schema targets PostgreSQL 17, with no compatibility shim and no migration of stored
  data. There is no remote project to push to; the schema reaches the local database by the reset.

## E2E

- **No red E2E test is ever committed.** A new test, a changed expectation of an existing spec and a fixture step
  whose signature changes stay in the working tree until a run of that uncommitted tree has shown them green. A
  new fixture step that no committed spec calls is committed first: it is no test of the suite.
- **No commit turns a committed E2E test red.** A change to the application that a browser can observe — a page,
  a layout, a load, a component a page renders, the callback, the gate table — stays in the working tree until a
  run of that uncommitted tree has passed, and is committed together with the spec and fixture changes that depend
  on it: one commit. What may be committed before it: a unit or component test file, red and alone; a module that
  decides nothing yet; a fixture step no spec calls; a state attribute nothing reads; a component nothing renders;
  a route nothing links to. Each plan says, under *What this plan's commits do to committed specs*, either why its
  commits are additive or which commit is the one. A test of another spec that the held change turns red in the
  pre-commit run is settled in the same uncommitted set before anything is committed. Where a plan says so
  (178-16, 178-18), the catalogue files of a held set may be committed as a commit of their own immediately
  before the rest, after that same green run and with nothing run between the two: a catalogue holds words that
  every spec reads from that same file.
- **A run of an uncommitted tree** goes directly through the wrapper, with nothing on the dev-server port:
  `tests/scripts/e2e-run.sh --run-dir $R/<label> --no-db-reset [--project <name>]`, then
  `node tests/scripts/e2e-evidence.mjs $R/<label>`. It is judged with
  `node $P/178-verdict.mjs control <label> (--project <name> --setup <setup project> | --full) --dirty-only <path>…`
  and `--red "<title substring>"…` or `--green [--were-red-in <label>]`.
- **A negative control counts** only when exactly the named tests are red, each ended `failed` on an expectation
  — not on a timeout, not on a compile error — and every other test of the run passed.
- **Every plan that changes a surface a browser can observe, a dataset, the function or the auth configuration
  closes on a full default run of its own committed tree**: `bash $P/178-e2e.sh <plan>-close`, judged at once
  with `node $P/178-verdict.mjs e2e <plan>-close --same-projects-as <its predecessor's label, or
  $(cat $P/178-BASELINE) for the first> …`. The chain of full runs is: `BASELINE` → `178-03-close` →
  `178-05-close` → `178-07-close` → `178-11-close` → `178-14-close` → `178-15-close` → `178-16-close` → `178-17-close` →
  `178-18-close` → `178-19-close` → `178-20-close` → `178-21-close` → `178-22-close` → `178-23-close` →
  `178-24-final`. Gate rows end before an E2E run starts. **The schema block is three consecutive plans and two
  full runs**: plans 178-04 and 178-06 close on the database rows with the writer's integration test, and the
  first full run over each is the next plan's (`178-05-close`, `178-07-close`); nothing is built between them.
- **Void** is decided by the wrapper's marker alone: status 8 with `VOID-host-suspend.txt`. A void run is kept
  and made again under the next `-rN` suffix. A red run without the marker is a failure; with no other cause,
  `pmset -g log` is read before the tree is blamed. A did-not-run is a failure. Nothing is retried until green on
  an unchanged tree; no test is skipped or annotated to pass. Nothing under `tests/e2e-runs/` is deleted.
- A dev server is started by the wrapper and by nothing else. **No spec waits a fixed time**: the CI runner is
  about four times slower than this host. A count is never waited out: the page's clock is advanced, and the
  server's one-mail-a-minute slot is given back through `releaseLinkSlot` before a press that must send.
- A spec holds hard assertions only and no locator in a test body: every locator is in a fixture and every id
  comes from `tests/tests/utils/testIds.ts`. A message is read from its catalogue file, never copied. A mailed
  link is opened **as received**: only its scheme, host and port are replaced by the run's origin.
- **No expectation takes an address's existence, a link, a token or a password as its subject**, and a "no mail"
  assertion is made only after the request's completion witness has finished.
- The auth service admits thirty sign-ins and thirty link verifications in five minutes from one address of
  origin. A spec or a probe that would pass that number says so and paces itself.

## An interrupted cycle

From the step that writes uncommitted changes until the step that commits them, the working tree holds exactly
the files that plan's `<uncommitted_changes>` block names, and a copy of each as the pre-commit run ran it is kept
beside the run (`$R/<label>.<file name>.kept`). The next executor either goes on from the working tree (or from
the kept copies, copied back) or discards the change with `git checkout -- <the named files>` and deletes the new
ones, and starts that task again. The gate driver and the E2E driver refuse a tree with uncommitted changes
outside `.planning/`; a plan calls neither while its changes are uncommitted.

## Code rules that bind every edit

- `CLAUDE.md` § *Context Destructuring Rule*: `appSettings`, `answersLocked`, `isAuthenticated`, `user`,
  `locale`, `entryFlow`, the task accessors and `dataRoot` are reactive accessors — read `contestantCtx.X` inside
  the tracking scope, never destructure; `dataRoot` is never bound to a read alias. `t`, `getRoute`, `logout`,
  `setPassword`, `checkInvitationCode`, `requestSignInLink`, `requestPasswordRecovery`, `holdEntryCode`,
  `sendEntryLink`, `resendEntryLink` and `clearEntryFlow` are stable and may be destructured.
- **The flow state is a private `$state` field of the context instance** — never a module-level binding, never
  `localStorage`, `sessionStorage`, a cookie, a search parameter or history state.
- **What registration offers is asked of `listedRegistrationModes` and of nothing else**: no page, layout, load or
  component writes the condition out.
- **Nothing a screen shows is read from the answer of a link request**, and no request to `account-access`
  carries a redirect target, a URL, a path or any text.
- A redirect target is a route key through `buildRoute`; a caller-supplied path passes `safeRedirectTarget`
  first and nothing else.
- `CLAUDE.md` § *Results Navigation Invariants*: no element added by this phase carries a
  `view-transition-name`, no `<dialog>` is added, and no layout load reads a `url` or `route` property. The
  protected layout's load reads the two params it reads today and nothing else.
- New markup writes no numeric spacing class and no arbitrary value: `xs`, `sm`, `md`, `lg`, `xl`, `xxl` and
  `touch` only (ruled 2026-10-10). The one arbitrary utility kept is the address block's
  `[overflow-wrap:anywhere]`, copied from `NothingToEdit.svelte`.
- A string a user reads has a message key in all seven locales; a mail is such a string. An address a user typed
  is rendered as text.
- `.agents/code-review-checklist.md` is walked in every plan that adds application code, and each item's outcome
  is recorded in the summary.
- `Skill("components")` is loaded before a `.svelte` component or a context consumer is edited.
