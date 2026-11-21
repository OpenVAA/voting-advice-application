# Phase 170: Contestant App Rename — Symbols & Routes - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning (two interpretations await operator confirmation — see *Open for operator confirmation*)

**Source of decisions:** `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 170* (and § *Cross-phase
picture*, § *Additional notes*) — a shared checkbox document covering Phases 170–179 that the
operator filled in one pass (committed as `e4813bf65`). Its rule: an unticked decision accepts the
`★ RECOMMENDED` option; a ticked box overrules the ★; `**EDIT:**`/`**NOTE:**` free text beats every
box. In Phase 170's 21 decisions (the baseline decision 170-0.1 plus A 13 · B 2 · C 5) the operator
ticked **one box, an overrule of the ★**, and wrote **no EDIT or NOTE text inside the section**:

1. **170-A5 → (b): the auth pair moves to the neutral `api/auth/{callback,logout}`, the duplicate
   logout handler is merged, and only `preregister` moves to `api/contestant/`** — instead of the ★
   "move all three to `api/contestant/…` and change nothing else". See D-06. This is the one
   behaviour change the operator accepted knowingly inside a phase whose criterion 4 is "nothing
   else changed".

One free-text note at the end of the document bears on this phase's route tree:

2. **Additional note 1: "Change the whole preregister route to register and an eg id-provider
   subroute within it for that."** Interpreted here as the **final** route layout, delivered by
   Phases 178–179, **not** as a Phase 170 change. See *Deferred / handed over* for the reasoning.
   **This is an interpretation the operator should confirm.**

Every other decision takes its ★ option as written, except where the ★ text assumed 170-A5(a).
Those places are rewritten **and flagged inline as "reconciled with the 170-A5 overrule"**. The full
list is under *Reconciliations* at the end of `<decisions>`.

Overrules and notes in other phases were checked for an effect on this phase; three touch it and
none changes a decision (see `<cross_phase>`): 171's settings living inside the existing root as
`contestantApp.entityTypes` / `contestantApp.registrationModes`, 175-B5/177-B5's
`access.nominationsLocked`, and 174's general grant spec.

X1, X2 and X3 were left untouched, so each takes ★ (a). **X3 (a)** means `REQUIREMENTS.md`,
`ROADMAP.md` and `PROJECT.md` are amended to the chosen options in one docs commit before this phase
is planned. That amendment may be in flight while this file is written, so this file cites
requirement ids and states the chosen decision itself; where wording in those files disagrees with a
D-entry below, the D-entry is the decision.

<domain>
## Phase Boundary

The candidate app becomes the Contestant app everywhere in the code and in its URLs, with its
behaviour unchanged, so that every later phase of v2.16 builds on the new names. Fixed by
`.planning/ROADMAP.md` § *Phase 170*. Requirements: **NAME-01** (every `candidateApp`-type symbol —
identifiers, contexts, route constants, message namespaces, test fixtures — renamed, before feature
work) and **NAME-02** (routes move from `candidate/` to `contestant/`, including the API routes, the
Edge Function redirect targets, the auth redirect allowlist and the docs), with **E2E-03** as the
closing criterion. Depends on nothing; it is the first phase of v2.16 and starts from the v2.15 tree.

**The line the rename follows.** A name that says *which app* is renamed. A name that says *which
entity type* is not: the `candidates` table, `ENTITY_TYPE.Candidate`, `CandidateCard`,
`identity-callback/candidateRecord.ts`, and everything voter-side that says `candidate`. `candidate`
in any case occurs 8123 times in 921 files; 436 files hold an app-level name. A blind
`s/candidate/contestant/` is not an option — the rename runs from an explicit pattern list (D-15).

**Success criteria (roadmap), as they read with the decisions below:**

1. Every page route of the app is served under `contestant/` — sign-in, registration, the protected
   pages — and no `candidate/` URL of the app resolves any longer. **The auth callback and logout
   are served under the neutral `api/auth/`, not under `contestant/` (D-06, overrule);** the
   pre-registration API route is served under `api/contestant/`.
2. Every link that leaves the system arrives on the new routes: the sign-in, password-reset and
   invitation emails, the identity-provider return and the Edge Function redirects target the new
   URLs, and the auth redirect allowlist admits the new callback URL and no `candidate/` URL.
3. No `candidateApp`-type name is left for later work to build on: a repository search for the old
   app-level identifiers, contexts, route constants, message namespaces and test fixtures finds none
   outside the planning record (and the two named exemptions of D-09, D-10), and the docs site
   describes the `contestant/` routes.
4. Nothing else changed: every user-facing text and behaviour is as it was, and the full E2E suite,
   the unit suites, the type and lint checks and the production build are green on the renamed tree
   (E2E-03). **The single accepted exception is the logout-handler merge of D-06.**

**Standing rules inherited from `.planning/ROADMAP.md` § v2.16:**

- **Cardinal E2E rule.** No failing E2E test, no exemptions, no "known flaky"; a "did not run" counts
  as a failure. E2E-03 is a closing criterion of every phase.
- **Seven locales.** Every user-facing string ships in `da, en, et, fi, fr, lb, sv`. This phase
  changes message *keys* and never message *values* (fact 20, D-19).
- **WCAG 2.1 AA + axe.** Every new or changed screen is reached by the axe scan. This phase adds no
  visual surface (roadmap UI hint); the existing scan must keep running under its renamed project
  and spec (D-08, D-12).
- **"User"/"entity" means candidates and organizations** unless a criterion names one.
- **Nothing is deployed.** The schema, the settings shape, the routes and the renamed symbols change
  in place: no redirect from an old URL, no stored-row migration, no alias for an old key.

**Not in this phase:** any new screen or flow; the app's shown name (Phase 171); the user-data RPC's
name or shape (Phase 173); the `invite-candidate` function's name or fate (Phase 174); a working
landing page for the invitation link (Phases 174, 178); restructuring `preregister/` into `register/`
(Phases 178–179, see *Deferred*); a hygiene rewrite of comments the rename merely passes through
(D-21).

</domain>

<decisions>
## Implementation Decisions

Decision IDs map one-to-one onto the discussion document's Phase 170 IDs, given in parentheses.
21 decisions → D-01..D-21. Every decision below is locked; the planner does not re-open them. Only
the chosen option is stated; the non-chosen options are dead.

### 0 — Factual baseline

- **D-01 (170-0.1):** Accept all 21 facts of table 170-0 as the phase's factual baseline; they are
  restated in `<factual_baseline>`. Facts 7, 10, 15, 18, 19 and 21 are not in the roadmap and each
  adds work or a ruling. Counts are a `git grep` snapshot at HEAD `df0cec944` with `.planning/`
  excluded; per the standing content-anchor rule the planner and executor re-derive every population
  at run time and never bend code to a count.

### A — Where the rename stops

- **D-02 (170-A1):** **`$candidate` → `$contestant`, `lib/candidate/` → `lib/contestant/`**, and
  `lib/dynamic-components/navigation/candidate/` → `…/navigation/contestant/` with `CandidateNav` →
  `ContestantNav`. The alias stays an alias (declared in `apps/frontend/svelte.config.js`); the
  "three aliases" rule in `CLAUDE.md` keeps its count and changes one name. All three directories
  hold app chrome (password, terms of use, logout, navigation), nothing specific to the candidate
  entity. About 26 + 3 file moves and 33 alias imports.
- **D-03 (170-A2):** **Rename the whole context:** `getCandidateContext` → `getContestantContext`,
  `initCandidateContext` → `initContestantContext`, every `CandidateContext*` type →
  `ContestantContext*`, the directory `lib/contexts/candidate/` → `lib/contexts/contestant/` and its
  seven files, the local variable `candCtx` → `contestantCtx` (161 occurrences in 18 files), and the
  two browser-storage keys `'candidateContext-preselectedElectionIds'` and
  `'candidateContext-isPreregistered'` → `'contestantContext-…'`. Nothing is deployed, so a stored
  value under an old key is not migrated.
- **D-04 (170-A3):** **Rename the file and the types now:** `candidateUserDataState.svelte.ts` →
  `contestantUserDataState.svelte.ts`, `CandidateUserData`/`candidateUserData` →
  `ContestantUserData`/`contestantUserData`. **Leave the members that name the entity (`.candidate`)
  for Phase 173**, which reshapes the state to serve any served type (GEN-02). The rename rides in
  the context commit.
- **D-05 (170-A4):** **Route constants spelled in full:** the 21 `CandApp*` keys in `ROUTE` →
  `ContestantApp*`, `CANDIDATE` → `CONTESTANT` (value `'/contestant'`), `CANDIDATE_PROT` →
  `CONTESTANT_PROT`, `isCandidateRoute` → `isContestantRoute`, and the gate row in `appGates.ts`
  `name: 'Candidate App'` → `name: 'Contestant App'` (with `CANDIDATE_GATE` → `CONTESTANT_GATE`).
  No abbreviation. **Reconciled with the 170-A5 overrule:** the two auth-endpoint keys are *not*
  `ContestantAppAuthCallback` / `ContestantAppAuthLogout`; see D-06. `ContestantAppPreregisterIdentityProviderCallback`
  keeps pointing at `/api/oidc/callback`, which carries no app name and does not move. The legacy
  trees' keys become `ContestantAppRegister`, `ContestantAppSetPassword`, `ContestantAppPreregister*`.
- **D-06 (170-A5) ⚠ — OPERATOR OVERRULE of the ★ (ticked (b)): neutral auth endpoints, one logout
  handler, `preregister` under `api/contestant/`.** Concretely:
  - **Callback:** `routes/api/candidate/auth/callback/+server.ts` → `routes/api/auth/callback/+server.ts`.
    A pure move; its body changes only by the renamed route keys it redirects to.
  - **Logout:** one handler survives, at `routes/api/auth/logout/+server.ts`; the directory
    `routes/api/candidate/auth/` is gone. The two handlers differ today (spot-checked on the tree):
    | | `api/auth/logout` (older) | `api/candidate/auth/logout` (live) |
    |---|---|---|
    | Call | `locals.supabase.auth.signOut()` (default scope) | `locals.supabase.auth.signOut({ scope: 'local' })` |
    | Response | `{ ok: true, type: 'success' }` (`DataApiActionResult`) | `{ success: true }` |
    | Docstring | "An API route for logging out candidates." | explains the httpOnly-cookie reason and the local scope |
    | Reached from | `UNIVERSAL_API_ROUTES.logout` in `UniversalDataWriter.logout` — which `SupabaseDataWriter.logout` overrides, so no live caller is known | `ROUTE.CandAppAuthLogout` in `SupabaseDataWriter._logout`, used by both the contestant and the admin app; the body is not read |
    The option text says "merge" and does not say which behaviour survives. **Chosen here, as the
    reading that changes the least: the live handler's sign-out survives (`scope: 'local'`, with its
    docstring), and the response is the `DataApiActionResult` shape `{ ok: true, type: 'success' }`**,
    which is what `UniversalDataWriter.logout` reads (`clientResult.type === 'success'`) and which the
    live caller ignores. Net behaviour change: none for the app's own sign-out; the response body of
    the surviving route changes shape; a default-scope sign-out no longer exists at any route.
    Research confirms the "no live caller" claim for the older handler before the plan relies on it.
    **Flagged for operator confirmation** (see *Open for operator confirmation*).
  - **Route keys** (reconciled with the 170-A5 overrule): the comment above `CandAppAuthCallback` in
    `route.ts` says the keys "keep the candidate naming because their paths do". With neutral paths
    the keys become neutral: **`AuthCallback`** (`${API_ROOT}/auth/callback`) and **`AuthLogout`**
    (`${API_ROOT}/auth/logout`), and that comment is rewritten to describe what is now true.
    `UNIVERSAL_API_ROUTES.logout` already holds the same path; whether the two definitions collapse
    into one is the planner's call (*Claude's Discretion*).
  - **`preregister`:** `routes/api/candidate/preregister/` (handler and
    `preregisterUpstreamStatus.test.ts`) → `routes/api/contestant/preregister/`;
    `UNIVERSAL_API_ROUTES.preregister` → `${API_ROOT}/contestant/preregister`.
  - **Allowlist** (reconciled with the 170-A5 overrule): `additional_redirect_urls` in
    `apps/supabase/supabase/config.toml` becomes `"http://localhost:5173/api/auth/callback"` and
    `"http://localhost:5173/*/api/auth/callback"` (the `https://127.0.0.1:3000` entry is untouched),
    and the comment block above it that quotes `/fi/api/candidate/auth/callback` and its rejected
    variants is rewritten to the new path. Not "one segment changes", as the ★ said: a segment is
    removed.
  - **Literals that follow:** `supabaseDataWriter.test.ts` (pins `'/api/candidate/auth/logout'`),
    `route.test.ts`, `appGates.test.ts`, `tests/tests/utils/supabaseAdminClient.ts` (two
    `redirectTo` strings), `tests/tests/fixtures/shared/emailBucket.fixture.ts` (`toCallbackUrl`'s
    default and its TSDoc), and the docs pages that quote the callback or logout path
    (`developers-guide/backend/{authentication,email}`, `developers-guide/deployment` — the
    "allow `<frontend origin>/api/candidate/auth/callback`" instruction — and the app section's
    `registration`, `login-and-password-reset`, `pre-registration-and-invitation` pages).
  - **Commit shape:** the logout merge is its own commit, separate from every mechanical rename
    commit, with a unit test for the surviving handler, so criterion 4's single exception is one
    reviewable diff (reconciled with the 170-A5 overrule; see D-16, D-19).
  - *Reversible:* yes, one commit, plus the allowlist line and a stack restart.
- **D-07 (170-A6) ⚠:** **Rename every app-level stored key:** `access.candidateApp` →
  `access.contestantApp`, `notifications.candidateApp` → `notifications.contestantApp`, the root
  `candidateApp` (holding `questions.{hideVideo,hideHero}`) → `contestantApp`,
  `StaticSettings.dataAdapter.supportsCandidateApp` → `supportsContestantApp`, and in the
  customization column `candidateAppFAQ` → `contestantAppFAQ`, `candPoster`/`candPosterDark` →
  `contestantPoster`/`contestantPosterDark`. Changed in the same plan: `DynamicSettings` and
  `StoredSettingsSchema`, `storedCustomization.schema.ts`, the dev-seed templates that state the keys
  (`e2e/base.ts`, `e2e/perm/shared.ts`, five perm templates), the exact top-level key list pinned in
  `base-app-settings.test.ts`, and both docs settings tables. No stored row is migrated
  (`seed.sql` writes `'{}'`; `106-app-settings.sql` names none of the keys beyond one comment).
- **D-08 (170-A7):** **Rename the message keys in full:** the 17 namespaces `candidateApp.<page>` →
  `contestantApp.<page>` — 119 file moves across 7 locales, the top-level key inside each file, and
  the 17 entries in `apps/frontend/project.inlang/settings.json` — and the four `dynamic.json` groups
  `candidateAppBasicInfo`, `candidateAppName`, `candidateAppNotAccessible`, `candidateAppPrivacy` →
  `contestantApp…` in every locale. Update the 181 `t('candidateApp.…')` call sites, regenerate
  `lib/types/generated/translationKey.ts`, and update the two standing gates of fact 10:
  `scripts/assert-i18n-catalog-namespaces.mjs` (`label`/`prefix` `contestantApp.`, the required key
  `contestantApp.questions.editAnswer`, floor unchanged) and `scripts/assert-a11y-scan-wiring.mjs`
  (project name and spec file per D-12). Values are never edited (D-19 proves it).
- **D-09 (170-A8) ⚠:** **`get_candidate_user_data` keeps its name.** It is the first of two named
  exemptions in the search gate (D-18), with the line naming Phase 173 as the phase that removes it
  (173-A3 ★ deletes the function for entity-neutral names). No schema edit, no `db:reset`, no types
  regeneration in this phase on its account.
- **D-10 (170-A9) ⚠:** **`invite-candidate` keeps its name and directory; only its redirect target
  changes** (D-11). It is the second named exemption in the search gate, owned by Phase 174 (174-C5 ★
  deletes the function). The cross-function source-text test
  (`send-email/flowConformance.test.ts` reading `'../invite-candidate/callerAuthority.ts'`) and the
  three "byte-identical copies live in `invite-candidate/`" comments stay as they are.
- **D-11 (170-A10):** **The invitation redirect is renamed and left dangling:**
  `invite-candidate/index.ts` ``redirectTo = `${siteUrl}/candidate/complete-registration` `` →
  `/contestant/complete-registration`. No page exists at either path, today or after this phase; the
  docs sentence that says so is updated to the new path and keeps saying so. Recorded as an
  obligation on Phases 174 and 178 (`<cross_phase>`). Alongside it, the second Edge Function redirect
  of fact 14: `identity-callback/index.ts` ``redirectTo: `${redirectSiteUrl}/candidate` `` →
  `/contestant`.
- **D-12 (170-A11):** **Rename every app-level test name:** directories `fixtures/candidate/` →
  `fixtures/contestant/`, `setup/candidate/` → `setup/contestant/`, `specs/candidate/` →
  `specs/contestant/`; the fixture, setup and spec files themselves **including the three bank-auth
  specs** (`candidate-bank-auth*.spec.ts` → `contestant-bank-auth*.spec.ts`, with the `testMatch`
  regexes in `tests/playwright.config.ts`); `specs/a11y/candidate-a11y.spec.ts` →
  `contestant-a11y.spec.ts`; `utils/candidateJourneyConstants.ts` → `contestantJourneyConstants.ts`;
  the Playwright projects `candidate-journey` → `contestant-journey`, `candidate-a11y-scan` →
  `contestant-a11y-scan`, `cold-entry-dataroot-candidate` → `cold-entry-dataroot-contestant`; the tag
  `@cand-session` → `@contestant-session`; the 34 `data-testid="candidate-…"` values →
  `contestant-…` in the 8 source files and in `tests/tests/utils/testIds.ts`; and the two visual
  baselines (`candidate-preview-{desktop,mobile}.png` → `contestant-preview-…`) by `git mv`, without
  a pixel changing. The 184 hand-spelled `/candidate` URL literals in the suite move with the URLs
  (plan 2 of D-17), not with the test naming (plan 3). A test id that names the *entity* rather than
  the app (for example a voter-side candidate card) is not in the 34 and is not renamed; the planner
  derives the list from the app's 8 source files, not from the prefix alone.
- **D-13 (170-A12):** **Docs site:** rewrite URL literals and identifiers; move
  `developers-guide/candidate-app/` → `developers-guide/contestant-app/` (5 pages) and regenerate the
  navigation and the route map; regenerate the component docs with `yarn generate:docs` so the pages
  under `frontend/components/generated/candidate/…` and `…/navigation/candidate/CandidateNav` follow
  the source move. **No redirect stub** for the old section URL. The five `+page.ts` files under
  `developers-guide/candidate-user-management/` that only `redirect(308, …)` have their targets
  re-pointed at the moved section; whether that directory (an already-redirecting legacy path named
  for the entity's user management, not for the app) is itself renamed is the planner's call —
  the gate of D-18 does not list it. **Reconciled with the 170-A5 overrule:** the auth endpoints are
  documented at `/api/auth/{callback,logout}`, including the deployment page's allowlist instruction.
- **D-14 (170-A13):** **The prose phrase "Candidate App" / "candidate app" → "Contestant App"** in
  comments, TSDoc, developer docs, `CLAUDE.md` and `.claude/skills`, in the same sweep (about 250
  occurrences: frontend `src` 84/50, docs 90/44, tests 38/14, packages 24/10, `apps/supabase` 11/7).
  **The publishers' guide's user-facing naming is left to Phase 171**, which decides what the app
  calls itself. Per D-21 this is a phrase substitution, not a comment rewrite.

### B — Mechanism

- **D-15 (170-B1) ⚠:** **A scripted text codemod driven by one explicit, ordered mapping table**
  (longest pattern first), run per plan, followed by a manual residue pass over the gate's output.
  The surface is text in six languages (TS, Svelte markup, JSON, SQL comments, Markdown, TOML), so
  only a text codemod covers it; the mapping table is the reviewable artefact. The script is a
  throwaway kept in the phase directory (`.planning/phases/170-…/`), **not** in `scripts/`. The table
  must encode the entity/app line of `<domain>` and the two exemptions (D-09, D-10) so a re-run never
  touches them.
- **D-16 (170-B2):** **Each move is two commits:** a pure `git mv` commit (every file at 100%
  similarity), then the content commit that makes the tree build. About 238 tracked paths carry an
  app-level name in the path. The pure-move commit does not build; its message says so and names the
  commit that completes it. **Reconciled with the 170-A5 overrule:** the logout endpoint cannot be a
  pure move, because a file already exists at the destination. `api/candidate/auth/callback` and
  `api/candidate/preregister` move by `git mv`; the logout merge is a third, separate content commit
  (D-06).

### C — Plan shape and gates

- **D-17 (170-C1) ⚠:** **Four plans, each closing green**, split by what the tests exercise:
  1. *Symbols, no URL change* — settings and customization keys (D-07), contexts (D-03, D-04), alias
     and directories (D-02), route-constant **names** with their values still `/candidate…` (D-05),
     message namespaces (D-08), the two scripts of fact 10.
  2. *URLs* — the page tree `routes/candidate/` → `routes/contestant/` (34 files, 20 directories,
     including the legacy `register/` and `preregister/` trees, moved as they are), the API tree per
     D-06, the four outbound-link sources and the allowlist (fact 14, D-11), with the tests' URL
     literals in the same plan. **Reconciled with the 170-A5 overrule:** this plan also carries the
     logout merge, the neutral route keys (`AuthCallback`, `AuthLogout`) and the unit test for the
     merged handler; the allowlist change loses a path segment rather than swapping one. The stack is
     restarted once after the allowlist changes (fact 21) and before this plan's E2E run.
  3. *Test naming* — fixtures, spec and setup directories, project names, tag, test ids, baselines
     (D-12).
  4. *Docs, agent docs, the search gate and the closing run* — D-13, D-14, `CLAUDE.md` and
     `.claude/skills` (fact 18), D-18, D-19, D-20.
  The suite is runnable at every plan boundary, so an E2E failure points at one plan.
- **D-18 (170-C2) ⚠:** **"A repository search finds none" is a standing script in `lint:check`**,
  `assert:no-candidate-app-names`, holding the pattern list and an explicit exemption list.
  - Patterns: `candidateApp`, `CandidateApp`, `CandApp`, `CandidateContext`, `candCtx`, `$candidate`,
    `isCandidateRoute`, `CandidateNav`; the path fragments `routes/candidate`, `lib/candidate`,
    `contexts/candidate`; and the URL literal `/candidate/` outside entity-typed routes.
    **Reconciled with the 170-A5 overrule:** `api/candidate` is a pattern with no exemption — neither
    the auth pair nor `preregister` leaves anything under it. Under the ★ the neutral
    `api/auth/logout` was a todo; here it is the surviving route and is not a finding.
  - Exemptions: `.planning/`, plus exactly one line each for `get_candidate_user_data` (D-09, removed
    by Phase 173) and `invite-candidate` (D-10, removed by Phase 174), each line naming its phase.
  - The planner extends the pattern list to whatever else the decisions above rename and the list
    omits (for example `candidateUserData`/`CandidateUserData`, `candidateContext-` storage keys,
    `candPoster`, `@cand-session`, the three Playwright project names, `candidateJourneyConstants`),
    provided each added pattern has zero entity-typed matches. The prose phrase of D-14 is gated only
    if a pattern for it can be anchored without catching entity prose.
  - The script follows the house pattern of the other `scripts/assert-*.mjs` gates, including a
    recorded negative control (a planted old name fails it).
- **D-19 (170-C3):** **Proving "nothing else changed": the gates, plus two identity checks.**
  (i) Every locale catalogue is flattened before and after and compared **value by value through the
  key mapping**, for all seven locales — proving no user-facing string changed, which no test asserts
  today. (ii) One opt-in visual-regression run against the moved baselines. **Reconciled with the
  170-A5 overrule:** criterion 4's "nothing else changed" has one named exception, the logout merge;
  it is proven by its own unit test and by the sign-out steps of the contestant and admin E2E specs,
  and the phase summary states it as a behaviour change rather than leaving it inside a rename diff.
- **D-20 (170-C4):** **The closing run:** unit suites, `yarn lint:check`, the production build, and
  one `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` run of the default
  suite, **plus the opt-in bank-auth projects** in the same or a second run — criterion 2 names the
  identity-provider return, the moved `api/contestant/preregister` route and the changed
  `identity-callback` redirect are exercised only there, and the default suite never follows them.
  Zero failed and zero did-not-run. Every gate is read by its own exit status, never through a pipe.
- **D-21 (170-C5):** **A rename-only edit does not open a comment for a hygiene rewrite.**
  `assert:comment-hygiene` must stay green; nothing more. A comment whose *meaning* the rename makes
  false is corrected (the `route.ts` comment in D-06 is the known case), because a comment must
  describe the code as it is; that is a correction of fact, not a hygiene sweep.

### Reconciliations with the 170-A5 overrule

| # | ★ text that assumed 170-A5(a) | Reconciled to | In |
|---|---|---|---|
| R1 | 170-A4 ★: every `CandApp*` key → `ContestantApp*` (so `ContestantAppAuthCallback`, `ContestantAppAuthLogout`) | The two auth keys become neutral `AuthCallback`, `AuthLogout`; the `route.ts` comment that justifies the app-named keys is rewritten | D-05, D-06 |
| R2 | 170-A5 ★ / fact 14: "the allowlist entry changes by one segment" | Entries become `…/api/auth/callback` and `…/*/api/auth/callback`; the comment block above them is rewritten | D-06 |
| R3 | 170-A5 ★: "the duplicate logout endpoint is filed as a todo" | No todo; the duplicate is merged in this phase, surviving at `api/auth/logout` with the live handler's `scope: 'local'` sign-out | D-06 |
| R4 | 170-B2 ★: every move is a pure `git mv` commit plus a content commit | True for the callback and `preregister`; the logout merge is a separate third commit because the destination file exists | D-16 |
| R5 | 170-C1 ★ plan 2: "the page and API route trees, the four outbound-link sources and the allowlist" as a pure URL move | Plan 2 also carries the logout merge, its unit test and the neutral route keys | D-17 |
| R6 | 170-C2 ★ patterns: "the URL literal `/candidate/` outside entity-typed routes" | `api/candidate` is added as a pattern with no exemption | D-18 |
| R7 | 170-C3 ★: the identity checks prove criterion 4 with no exception | One named exception (the logout merge), proven separately and stated in the summary | D-19 |
| R8 | 170-A12 ★ / criterion 3: "the docs describe the `contestant/` routes" | The docs describe the auth endpoints at the neutral `api/auth/…`, including the deployment page's allowlist instruction | D-13 |
| R9 | Roadmap criteria 1 and 2 and NAME-02 ("including the API routes"; criterion 1 names the auth callback under `contestant/`; criterion 2's allowlist "admits those") | Read as amended: page routes and `preregister` under `contestant/`; the auth pair under `api/auth/`; the allowlist admits the neutral callback and no `candidate/` URL. X3 (a) amends the wording | `<domain>` |

### Open for operator confirmation

Neither blocks planning; each is the reading that changes the least, and a different answer changes
a bounded part of plan 2.

1. **Which logout behaviour survives the merge (D-06).** Chosen: `signOut({ scope: 'local' })` with
   the `DataApiActionResult` response. The alternative is the older handler's default-scope sign-out.
2. **Additional note 1 is not a Phase 170 change** (*Deferred*). Chosen: `preregister/` moves to
   `contestant/preregister/` unchanged here, and the `register/…` restructuring lands in 178–179.

### Claude's Discretion

- The exact spelling of the two neutral route keys, if the planner finds a collision or a clearer
  parallel to the existing key set (`AuthCallback` / `AuthLogout` is the default).
- Whether `ROUTE.AuthLogout` and `UNIVERSAL_API_ROUTES.logout`, which now hold the same path, are
  collapsed into one definition.
- The codemod's implementation (language, structure), provided the mapping table is one reviewable
  file and the run is repeatable.
- The exact extra patterns in the search gate (D-18) beyond the listed ones.
- Whether `developers-guide/candidate-user-management/` is renamed (D-13).
- How the catalogue identity check of D-19 is recorded (a script in the phase directory with its
  output, by default).

</decisions>

<factual_baseline>
## Factual baseline (170-0, accepted under D-01; snapshot at HEAD `df0cec944`, `.planning/` excluded)

"occ/files" means occurrences / files. Anchors are symbols or content.

1. **`candidateApp`-type symbols, measured.** `candidateApp` 756/212: frontend `src` 490/51, message
   catalogues 148/127, `app-shared` 25/6, docs 20/9, dev-seed 21/10, `project.inlang` 17/1, tests
   15/5, one script 7/1. `CandApp` 193/55. `CandidateApp` 10/5 (`supportsCandidateApp` and the like).
   `candApp` and `candidate_app`: zero.
2. **The entity word dominates the tree.** `candidate` in any case: 8123 occurrences in 921 files;
   436 files hold at least one app-level name. The rename needs an explicit pattern list.
3. **Contexts.** `getCandidateContext` 63/33, `CandidateContext` 112/47, the local `candCtx` 161/18.
   `lib/contexts/candidate/` holds seven files, including `candidateUserDataState.svelte.ts`
   (`CandidateUserData`/`candidateUserData` 123/24). Two browser-storage keys carry the name:
   `'candidateContext-preselectedElectionIds'` and `'candidateContext-isPreregistered'`
   (`candidateContext.svelte.ts`, `sessionStorageState(…)`, `localStorageState(…)`).
4. **The `$candidate` alias and `lib/candidate/`.** Alias 33/23, declared in `svelte.config.js`
   (`$candidate: path.resolve('./src/lib/candidate')`). The directory holds 26 files: six component
   folders (`logoutButton`, `passwordField`, `passwordSetter`, `passwordValidator`,
   `preregisteredNotification`, `termsOfUse`) and four utils. A third app-level directory is not in
   the roadmap: `lib/dynamic-components/navigation/candidate/` (`CandidateNav` 27/12).
5. **Route constants.** `apps/frontend/src/lib/routes/route.ts` declares `CANDIDATE = '/candidate'`,
   `CANDIDATE_PROT`, `isCandidateRoute` and 21 `CandApp*` keys in `ROUTE`. Frontend source builds its
   URLs from these; literal `/candidate` fragments in non-test source are comments and import paths.
   `appGates.ts` carries the gate row `name: 'Candidate App'`, `isRoute: isCandidateRoute`, and the
   request hook reads that table by route id.
6. **Route trees.** Page tree: 34 files in 20 directories under `routes/candidate/`. API tree:
   `api/candidate/auth/callback`, `api/candidate/auth/logout`, `api/candidate/preregister` (plus its
   test). `CandAppPreregisterIdentityProviderCallback` points at `/api/oidc/callback`, which carries
   no app name and does not move.
7. **Not in the roadmap: the two auth endpoints are shared with the Admin app, and a second logout
   endpoint exists.** The `ROUTE` comment above `CandAppAuthCallback`: "The two auth endpoints sit
   under the generic API prefix rather than under the candidate app, so the admin app can address the
   same handlers." `routes/api/auth/logout/+server.ts` also exists, with the docstring "An API route
   for logging out candidates". *(Resolved by D-06; the two handlers' differences are tabulated there.)*
8. **"No `candidate/` URL of the app resolves any longer" holds by construction.** `src/routes/` holds
   `(voters)`, `admin`, `api`, `candidate` and no catch-all, so once the directory moves an old URL
   has no route and returns 404. Nothing is deployed, so no redirect is owed.
9. **Message namespaces.** 17 files `candidateApp.<page>.json` in each of 7 locales (119 files). Each
   file's top-level key is the namespace (`"candidateApp.common": {…}`). All 17 are listed by name in
   `project.inlang/settings.json`. 181 `t('candidateApp.…')` call sites over 16 sub-namespaces.
   `dynamic.json` holds four more app-level groups in every locale: `candidateAppBasicInfo`,
   `candidateAppName`, `candidateAppNotAccessible`, `candidateAppPrivacy` (38/13 in code).
   `lib/types/generated/translationKey.ts` is generated from the catalogues.
10. **Not in the roadmap: two standing gates hard-code the namespace.**
    `scripts/assert-i18n-catalog-namespaces.mjs` declares
    `{ label: 'candidateApp.*', prefix: 'candidateApp.', floor: 60 }` and requires the key
    `candidateApp.questions.editAnswer`; it runs in `lint:check` and in `test:e2e`.
    `scripts/assert-a11y-scan-wiring.mjs` pins the project name `candidate-a11y-scan` and the file
    `candidate-a11y.spec.ts`.
11. **Stored settings keys.** Three in `DynamicSettings` and `StoredSettingsSchema`:
    `access.candidateApp`, `notifications.candidateApp` and the root
    `candidateApp.questions.{hideVideo,hideHero}`. `StaticSettings` has
    `dataAdapter.supportsCandidateApp`. The customization column has `candidateAppFAQ` (20/8) and
    `candPoster`/`candPosterDark` (13/7). `106-app-settings.sql` names none of them (one comment says
    "candidate-app FAQ"), and `seed.sql` writes `'{}'`. dev-seed states the keys in `e2e/base.ts`,
    `e2e/perm/shared.ts` and five perm templates, and `base-app-settings.test.ts` pins `'candidateApp'`
    in an exact top-level key list.
12. **`get_candidate_user_data` RPC.** 51/15: `schema/503-entity-rpcs.sql` (signature
    `(uuid, public.entity_type)`), comments in `300` and `301`, the generated migration, pgTAP `21`
    and `36`, `packages/supabase-types` (`database.ts`, `database.overrides.ts`, `RPC-NULLABILITY.md`),
    `scripts/assert-project-scoped-queries.mjs`, `supabaseDataWriter.ts` and its test, one docs page,
    two skill files. It already serves both entity types through `p_entity_type`. Phase 173 reshapes it.
13. **`invite-candidate` Edge Function.** 73/32. The directory holds 10 files.
    `supabaseDataWriter.ts` calls `functions.invoke('invite-candidate', …)`.
    `send-email/flowConformance.test.ts` reads `'../invite-candidate/callerAuthority.ts'`, and three
    modules state that byte-identical copies live in `invite-candidate/`. `config.toml` has no
    `[functions.*]` block. Phase 174 replaces its mechanism.
14. **Four outbound-link sources, all found.** (i) `invite-candidate/index.ts`:
    ``redirectTo = `${siteUrl}/candidate/complete-registration` ``. (ii) `identity-callback/index.ts`:
    ``redirectTo: `${redirectSiteUrl}/candidate` ``. (iii) `supabaseDataWriter.ts`: `redirectTo` built
    from `buildRoute('CandAppAuthCallback')`. (iv) `config.toml`:
    `additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:5173/api/candidate/auth/callback", "http://localhost:5173/*/api/candidate/auth/callback"]`,
    with a comment block quoting the same path. No custom email template is configured (the
    `content_path` lines are commented out), so no template holds a URL.
15. **Not in the roadmap: the invitation redirect target has no page.** No route
    `candidate/complete-registration` exists, and the docs say so: "The frontend has no page at
    `/candidate/complete-registration`, the redirect target `invite-candidate` passes"
    (`apps/docs/…/candidate-app/pre-registration-and-invitation/+page.md`).
16. **Test fixtures.** 26 tracked files under `tests/` carry the name: 13 in `fixtures/candidate/`, 4
    in `setup/candidate/`, 3 specs in `specs/candidate/`, `specs/a11y/candidate-a11y.spec.ts`,
    `utils/candidateJourneyConstants.ts` and two visual baselines (`candidate-preview-desktop.png`,
    `candidate-preview-mobile.png`). Playwright project names: `candidate-journey`,
    `candidate-a11y-scan`, `cold-entry-dataroot-candidate`; tag `@cand-session`. The suite spells URLs
    by hand: literal `/candidate` fragments 184/38 against 21 uses of a `CandApp*` constant. Test ids:
    34 distinct `data-testid="candidate-…"` values in 8 source files, mirrored in
    `tests/tests/utils/testIds.ts`.
17. **Docs site.** `apps/docs`: literal `/candidate` fragments 93/25, identifiers 35/17, the prose
    phrase "Candidate App" 90/44. One section directory is named for the app:
    `developers-guide/candidate-app/` (5 pages). `developers-guide/candidate-user-management/` holds
    five `+page.ts` files that only `redirect(308, …)`. The pages under
    `frontend/components/generated/candidate/…` and `…/navigation/candidate/CandidateNav` are produced
    by `yarn generate:docs` and follow the source move.
18. **Not in the roadmap: the agent-facing docs name the old symbols.** `CLAUDE.md` cites
    `$candidate`, `getCandidateContext()`, `apps/frontend/src/routes/candidate/` and
    `apps/frontend/src/lib/candidate/` (§ Frontend, § Context Destructuring Rule). `.claude/skills` has
    path fragments in 8 files and identifiers in 3.
19. **The prose phrase is a separate population.** "Candidate App" / "candidate app" in comments,
    TSDoc and docs: frontend `src` 84/50, docs 90/44, tests 38/14, packages 24/10, `apps/supabase`
    11/7. Criterion 3 lists identifiers, not prose (→ D-14).
20. **Shown text.** The shown name today is `dynamic.candidateAppName` ("Election Compass for
    Candidates" in `en`). The rename changes message keys and never message values; Phase 171 changes
    the name.
21. **The allowlist change needs a stack restart.** `additional_redirect_urls` is read by the local
    auth service at `supabase start`, so the rename is not live until the stack restarts. This host
    runs a second, unrelated Supabase stack; restart only this project's stack.

**Spot-checked on this worktree while writing this file** (2026-10-05, for the D-06 reconciliation):
the API route tree under `apps/frontend/src/routes/api/` and the two logout handlers' bodies;
the `route.ts` comment and the `CandAppAuthCallback` / `CandAppAuthLogout` values;
`UNIVERSAL_API_ROUTES.logout` and `.preregister` in `lib/api/base/universalApiRoutes.ts`;
`SupabaseDataWriter._logout` and its `logout` override; `UniversalDataWriter.logout`'s read of
`clientResult.type`; the `additional_redirect_urls` line; both Edge Function `redirectTo` strings;
the `register/` and `preregister/` trees under `routes/candidate/`; `lint:check` and `test:e2e` in the
root `package.json`. All agree with the table. Nothing else was re-scouted.

</factual_baseline>

<research_open>
## Cannot be defined yet → resolved, research, or open

| Item from the section | Status |
|---|---|
| The final name of the RPC behind 170-A8 | **Resolved by the filled document for planning purposes:** 173-A3 ★ stands — entity-neutral `get_user_entities` and `get_entity_user_data`; `get_candidate_user_data` is deleted, not aliased. Phase 173 owns it; this phase only carries the exemption (D-09). |
| Whether `invite-candidate` survives, and under what name (170-A9) | **Resolved for planning purposes:** 174-C5 ★ stands — the function is deleted with its tests, the `_preregister` / `preregisterWithApiToken` contract and its docs. Phase 174 owns it; this phase only carries the exemption (D-10). The operator's overrule in 174 (a general grant spec per invitation) does not change this. |
| The page the invitation redirect should land on (170-A10) | **Open, owned by Phases 174 and 178.** The string dangles at `/contestant/complete-registration` after this phase (D-11). |
| Whether the visual baselines still match after the test-id rename (170-A11) | **Research / known only by running** the opt-in visual project (D-19). A test id is not rendered, so they should. Research must also settle *where* that run can happen: `tests/playwright.config.ts` records that the PNG baselines are Linux/x86_64 captures and reproduce only there, and this host is macOS. If the run cannot be made locally, the plan names the channel (for example `ci-evidence/**`) rather than dropping the check. |
| *(new, from D-06)* Whether the older `api/auth/logout` handler has any live caller | **Research.** Read on the tree: `SupabaseDataWriter.logout` overrides `UniversalDataWriter.logout`, the only reader of `UNIVERSAL_API_ROUTES.logout`. Confirm no other adapter or test path reaches it before the merge plan relies on it. |
| *(new, from D-06)* Which sign-out scope and response shape survive the merge | **Chosen in D-06, awaiting operator confirmation.** |

</research_open>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 170*, § *Cross-phase picture* (X1–X3, "Ordering and
  hand-overs"), § *Additional notes* — the filled decision document; the source of every D-entry.
- `.planning/ROADMAP.md` § *v2.16* (standing rules, sequencing logic) and § *Phase 170* (goal,
  criteria, "Discussion must settle").
- `.planning/REQUIREMENTS.md` — NAME-01, NAME-02, E2E-03, § Standing rules (wording being amended
  under X3 (a); the D-entries here are the decisions).
- `CAND-APP-PLAN.md` (repo root) — the nomenclature and the screens A–L later phases cite.

### Routes and the request path
- `apps/frontend/src/lib/routes/route.ts` — `CANDIDATE`, `CANDIDATE_PROT`, `isCandidateRoute`, the
  `ROUTE` table and the comment above `CandAppAuthCallback` (D-05, D-06).
- `apps/frontend/src/lib/routes/appGates.ts` and `apps/frontend/src/hooks.server.ts` — the gate row
  and its reader (D-05).
- `apps/frontend/src/lib/api/base/universalApiRoutes.ts` (`UNIVERSAL_API_ROUTES.logout`,
  `.preregister`) and `universalDataWriter.ts` (`logout`) (D-06).
- `apps/frontend/src/routes/api/auth/logout/+server.ts`,
  `apps/frontend/src/routes/api/candidate/auth/{callback,logout}/+server.ts`,
  `apps/frontend/src/routes/api/candidate/preregister/` (D-06).
- `apps/frontend/src/routes/candidate/` — the page tree, including `register/` and `preregister/`.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — `_logout`,
  `logout`, `_requestForgotPasswordEmail` (`buildRoute('CandAppAuthCallback')`),
  `functions.invoke('invite-candidate', …)`; and `supabaseDataWriter.test.ts`.

### Outbound links and the allowlist
- `apps/supabase/supabase/config.toml` — `additional_redirect_urls` and the comment block above it
  (D-06, fact 21).
- `apps/supabase/supabase/functions/invite-candidate/index.ts` and
  `apps/supabase/supabase/functions/identity-callback/index.ts` — the two `redirectTo` strings (D-11).

### Symbols, settings and messages
- `apps/frontend/svelte.config.js` — the `$candidate` alias (D-02).
- `apps/frontend/src/lib/contexts/candidate/` (`index.ts`, `candidateContext.svelte.ts`,
  `candidateUserDataState.svelte.ts`), `apps/frontend/src/lib/candidate/`,
  `apps/frontend/src/lib/dynamic-components/navigation/candidate/` (D-02, D-03, D-04).
- `packages/app-shared/src/settings/dynamicSettings.type.ts`, `staticSettings.ts`,
  `packages/app-shared/src/data/schemas/storedSettings.schema.ts`, `storedCustomization.schema.ts`;
  dev-seed `e2e/base.ts`, `e2e/perm/shared.ts`, the perm templates, `base-app-settings.test.ts` (D-07).
- `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/candidateApp.*.json` and `dynamic.json`,
  `apps/frontend/project.inlang/settings.json`, `lib/types/generated/translationKey.ts` (D-08).
- `scripts/assert-i18n-catalog-namespaces.mjs`, `scripts/assert-a11y-scan-wiring.mjs`; root
  `package.json` `lint:check`, `test:e2e` (D-08, D-18).

### Tests and docs
- `tests/playwright.config.ts` (project names, `testMatch` regexes, the visual-baseline platform
  note), `tests/tests/{fixtures,setup,specs}/candidate/`, `tests/tests/specs/a11y/candidate-a11y.spec.ts`,
  `tests/tests/utils/{testIds.ts,candidateJourneyConstants.ts,supabaseAdminClient.ts}`,
  `tests/tests/fixtures/shared/emailBucket.fixture.ts` (`toCallbackUrl`) (D-06, D-12).
- `apps/docs/src/routes/(content)/developers-guide/{candidate-app,candidate-user-management}/`, the
  `backend/{authentication,email}` and `deployment` pages, `apps/docs/package.json` `generate:docs` (D-13).
- `CLAUDE.md` (§ Frontend, § Context Destructuring Rule, § Skill Routing) and `.claude/skills/**`
  (fact 18, D-14).

### Standing project rules that bind this phase
- `CLAUDE.md` — E2E hard rule and preflight, comment hygiene, the context destructuring rule (the
  renamed accessor `getContestantContext()` inherits it unchanged).
- `.agents/code-review-checklist.md`.
- `tests/README.md` § Run — the wrapper-driven E2E run and how to read a preflight failure.
- Never read a gate's status through a pipe; content anchors, never line numbers; green typecheck
  and unit tests do not prove a file move — run the production build.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The `scripts/assert-*.mjs` family wired into `lint:check` — the pattern D-18's new gate follows.
- `tests/scripts/e2e-run.sh` — starts Supabase and one fresh dev server on the project the suite
  seeds; the only trusted E2E signal (D-20). The opt-in bank-auth projects are gated by
  `PLAYWRIGHT_BANK_AUTH`, the visual project by `PLAYWRIGHT_VISUAL`.
- `yarn generate:docs` — regenerates the component docs after the source move (D-13).
- The route builder (`buildRoute`, `ROUTE`): frontend source already names routes by key, so the
  frontend's URL move is mostly one constant (`CONTESTANT`). The suite spells URLs by hand (184
  literals) and is where the URL move costs edits.

### Established Patterns
- **Pure-move commit, then content commit** (D-16) — the reconstruction pattern
  `Skill("ship-review-stack")` documents; a pure-move commit is exempt from "builds".
- **Negative controls are recorded** (command, exit code) — applies to the new gate (D-18).
- **Generated files are regenerated, not edited:** `translationKey.ts`, Paraglide output under
  `src/lib/paraglide/**`, the docs' generated component pages and route map.

### Integration Points
- **The local auth service reads the allowlist at start** (fact 21). After plan 2 changes
  `config.toml`, the project's Supabase stack must be restarted before any auth redirect to the new
  callback is accepted. A second, unrelated Supabase stack runs on this host and must not be stopped.
- **The Admin app** signs out through the same data-writer `logout` and therefore the same endpoint
  (fact 7); the merged handler serves both apps (D-06).
- **The identity-provider return** (`/api/oidc/callback`) does not move; what moves is where the
  flow lands afterwards (`contestant/preregister/…`) and the `identity-callback` function's
  `redirectTo` (D-11).
- **Vite dev-server staleness:** after directory moves of this size, restart the dev server (and
  `yarn dev:clean` if needed) before trusting an E2E result.

</code_context>

<specifics>
## Specific Ideas

- The operator's one ticked box in this section came with the document's own risk statement,
  verbatim: 170-A5 (b) "merges two handlers that are not identical, so it is a behaviour change
  inside a phase whose criterion 4 is 'nothing else changed'." The operator accepted it; D-06, D-16
  and D-19 isolate it so it stays one reviewable, separately proven diff.
- The mapping table of the codemod is the reviewable artefact of the phase (D-15): the reviewer reads
  the table, not 436 files.
- Sequencing rule from the roadmap: "170 first, always" — nothing new is written against a name
  about to change. That is why D-07 takes the stored keys now rather than leaving them to 171.

</specifics>

<cross_phase>
## Cross-phase Notes

**Obligations this phase places on later phases**

- **170 → 171:** 171's new settings sit beside `access.contestantApp` and inside the `contestantApp`
  root, and its app-name keys replace `dynamic.contestantAppName`. Both rely on D-07 and D-08. The
  operator's overrule in 171 puts the new settings inside the existing root, as
  `contestantApp.entityTypes` and `contestantApp.registrationModes` — which makes D-07's rename of
  that root a hard precondition, not just a convenience.
- **170 → 173:** the gate script's `get_candidate_user_data` exemption line is Phase 173's to delete
  (D-09, D-18). With 173-B1 ★ (the selected entity as a route parameter,
  `contestant/(protected)/[entityType]/[entityId]/…`), every protected route constant and E2E URL
  moves a second time straight after this phase; 173-F1 ★ isolates that move as its own plan. D-04
  leaves the `.candidate` members of the user-data state for 173.
- **170 → 174:** the gate script's `invite-candidate` exemption line is Phase 174's to delete (D-10,
  D-18). The invitation redirect dangles at `/contestant/complete-registration` (D-11); 174 and 178
  give it a destination or remove its source.
- **170 → 178, 179:** the legacy `register/` and `preregister/` trees move to `contestant/` here,
  unchanged, and are deleted there (REG-14: 178-G1 ★ removes `register/` in 178; 179 removes
  `preregister/`). Their route constants are `ContestantAppRegister`, `ContestantAppSetPassword`,
  `ContestantAppPreregister*` in the meantime. Additional note 1 is handed over to these phases — see
  *Deferred*.
- **170 → 175, 177:** the nominations lock moves to the app setting `access.nominationsLocked`
  (operator overrules in 175-B5 and 177-B5); it sits beside `access.contestantApp`, so it too relies
  on D-07's key names. No work here.
- **170 → every phase:** the stack must be restarted once after the allowlist changes (fact 21), or
  auth redirects to the new callback are refused. And the D-18 gate runs in `lint:check`, so every
  later phase is held to the new names without a criterion of its own.
- **170 → every phase, from the D-06 overrule:** the auth callback and logout live at
  `api/auth/{callback,logout}` with keys `AuthCallback` / `AuthLogout`. Later sections of the
  discussion document cite them under today's names (for example 178 fact 5,
  `routes/api/candidate/auth/callback/+server.ts`, and FIX-01's work on the callback); their planners
  read those anchors as the neutral path.

**Obligations on this phase from elsewhere**

- **X3 (a):** the requirements, roadmap and project documents are amended to the chosen options
  before this phase is planned; this phase's planner verifies that criteria 1 and 2 and NAME-02 no
  longer contradict D-06 (R9) and reports it if they still do.
- **X1 (a):** the E2E base dataset stays candidate-only through this phase and 171; nothing here
  changes which entity types the suite serves.
- **Additional notes 2 and 3** (the entity's election/constituency selector logic with centralised
  predicates; a reusable EntityCard-based party and alliance selector) belong to Phase 177 and touch
  nothing here.

</cross_phase>

<deferred>
## Deferred / handed over

- **Additional note 1 — "Change the whole preregister route to register and an eg id-provider
  subroute within it for that" — handed over to Phases 178–179. INTERPRETATION; the operator should
  confirm.** Reasoning from this section's own decisions:
  - The section's cross-phase note, left as written, says the legacy `register/` and `preregister/`
    trees "move to `contestant/` here and are deleted there (REG-14)". No Phase 170 option
    restructures either tree; the only route decision the operator changed here is 170-A5, and the
    box ticked there says to move `preregister` to `api/contestant/` — by that name.
  - A legacy `register/` tree exists at the destination until Phase 178 removes it (178-G1 ★), and
    its `+layout.svelte` blocks the tree when answers are locked. Nesting the pre-registration flow
    under it in this phase would put that flow behind a layout it does not have today — a second
    behaviour change in a phase where exactly one was accepted.
  - The note describes where the screens of 178-A1 ★ already point: C at `register`, with
    `register/email` and `register/sign-in` beside it. An identity-provider subroute (for example
    `register/identity-provider`) is the same pattern, and it can exist only once 178 has freed the
    `register` path and 179 has replaced the `preregister/` flow.
  - **So in Phase 170:** `routes/candidate/preregister/` → `routes/contestant/preregister/` and
    `routes/api/candidate/preregister/` → `routes/api/contestant/preregister/`, both unchanged in
    structure. **In 178–179:** the final layout has no `preregister` route; the identity-provider
    flow lives under `contestant/register/<identity-provider subroute>`, and 179's planner decides
    whether the API route follows (`api/contestant/register/…`) when it replaces the handler. The
    `ContestantAppPreregister*` constants and the `contestantApp.preregister*` message keys this
    phase produces are short-lived by design.
  - If the operator instead wants the note applied in 170, the bounded change is in plan 2 of D-17:
    the page tree and the API route take the `register` name there, and the legacy `register/` tree
    needs a ruling on where it goes until 178.
- **The final name and shape of the user-data RPC** — Phase 173 (D-09).
- **The fate and name of `invite-candidate`, and a working invitation landing page** — Phases 174,
  178 (D-10, D-11).
- **The app's shown name and the publishers' guide's user-facing naming** — Phase 171 (D-14, fact 20).
- **The `.candidate` members of the user-data state and the context's hard-coded candidate scope** —
  Phases 173 and 175 (D-04).
- **A hygiene rewrite of comments that carry historical narrative or planning references** — out of
  scope here by D-21; not assigned to a phase.
- **A PKCE `code` in the auth callback (FIX-01)** — Phase 178; the callback moves here with its
  behaviour, defect included.

</deferred>

---

*Phase: 170-Contestant App Rename — Symbols & Routes*
*Context gathered: 2026-10-05*
