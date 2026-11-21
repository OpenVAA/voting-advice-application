# Phase 170: Contestant App Rename — Symbols & Routes - Research

**Researched:** 2026-10-05
**Domain:** Mass rename of an application's symbols, routes and stored keys across a Yarn 4 / Turborepo monorepo (SvelteKit 2 + Svelte 5 frontend, Supabase backend, Playwright E2E), with one accepted behaviour change (the logout-handler merge)
**Confidence:** HIGH for the measured surface and the gate commands; MEDIUM for the classification of names the decisions do not list (each is flagged)

**Measured at:** HEAD `c74eb65ae` (branch `feat/entity-signup-multi-grant`). The non-planning tree is byte-identical to `a9d956c75`, the HEAD the measurements started on (`git diff --name-only a9d956c75 HEAD -- . ':(exclude).planning'` prints nothing). Every count below is a snapshot; the command beside it is what the planner and the executor re-run. Line numbers are given only where the provenance rule requires a citation, and each sits beside a content anchor; plans cite the anchor.

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied verbatim from `170-CONTEXT.md` `<decisions>` and `<deferred>`. The only change is heading depth: the source's `### 0 — …`, `### A — …`, `### B — …`, `### C — …`, `### Reconciliations …` and `### Open for operator confirmation` headings are one level deeper here so they nest under *Locked Decisions*.

### Locked Decisions

Decision IDs map one-to-one onto the discussion document's Phase 170 IDs, given in parentheses.
21 decisions → D-01..D-21. Every decision below is locked; the planner does not re-open them. Only
the chosen option is stated; the non-chosen options are dead.

#### 0 — Factual baseline

- **D-01 (170-0.1):** Accept all 21 facts of table 170-0 as the phase's factual baseline; they are
  restated in `<factual_baseline>`. Facts 7, 10, 15, 18, 19 and 21 are not in the roadmap and each
  adds work or a ruling. Counts are a `git grep` snapshot at HEAD `df0cec944` with `.planning/`
  excluded; per the standing content-anchor rule the planner and executor re-derive every population
  at run time and never bend code to a count.

#### A — Where the rename stops

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

#### B — Mechanism

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

#### C — Plan shape and gates

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

#### Reconciliations with the 170-A5 overrule

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

#### Open for operator confirmation

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

### Deferred Ideas (OUT OF SCOPE)

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
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAME-01 | Every `candidateApp`-type symbol — identifiers, contexts, route constants, message namespaces, test fixtures — is renamed to `contestantApp`. This is done first, before feature work builds on the old names. | § *Measured inventory* (commands for every population); § *The gate pattern list* (13 listed patterns, 8 the decisions name as examples, 23 found by research, each classified and counted); § *The codemod* (ordered mapping, plan-scoped rules); § *Common Pitfalls* 1–9, 13, 16, 17 (the names and couplings the baseline omits). |
| NAME-02 | The app's routes move from `candidate/` to `contestant/`, including the app's own API route (`preregister`, to `api/contestant/`), the Edge Function redirect targets, the auth redirect allowlist and the docs. The auth callback and logout API routes, which the Admin app shares, move to the neutral `api/auth/{callback,logout}` instead, and the duplicate logout handler is merged into that one. (amended 2026-10-05, 170-A5 (b)) | § *Research-open (a)* (the logout merge, with the caller enumeration); § *Pitfalls* 4, 10, 11, 12 (path-keyed ESLint allowlist, the allowlist the suite never exercises, the stack restart, slashless URL forms); § *Code Examples* (the redirect-matcher probe, measured in both directions on the running stack). |
| E2E-03 (closing criterion) | The full E2E suite is green at the close of every phase. | § *Validation Architecture*; § *Research-open (b)* (the visual run on this host); § *Environment Availability* (Node floor, Docker headroom, the bank-auth runbook). |
</phase_requirements>

## Summary

The phase is a mechanical rename over text in six languages, with one accepted behaviour change. Every count in the CONTEXT baseline reproduces exactly on the tree (`candidateApp` 756/212, `CandApp` 193/55, `CandidateContext` 112/47, `candCtx` 161/18, `$candidate` 33/23, `CandidateNav` 27/12, the 34 + 4 + 26 + 3 + 7 + 119 + 26 path populations), so the baseline can be trusted as far as it goes. The target namespace is empty: `contestant` in any case occurs **zero** times in tracked files outside `.planning/`, and `AuthCallback` / `AuthLogout` occur zero times as words, so no mapping can collide with an existing name and a post-run count of `contestant` is itself a check.

What the baseline does not carry is where the planning risk sits. Measurement found a further set of couplings and names it omits, the load-bearing ones being: a **third** standing gate that names the route directory (`scripts/assert-no-session-in-loads.mjs`, by path segments no listed pattern matches); **four** browser-storage keys, not two; the `AppType` discriminant value `'candidate'`; a path-keyed ESLint allowlist with a guard test that lints a real moved file; a second `$candidate` alias declaration in `vitest.config.ts` and hard-coded generator paths in the docs scripts; nine of the 34 test ids living outside `testIds.ts` as raw strings; message *values* that contain "Candidate Application" (so the prose rule must never run over the catalogues); SQL comments that are byte-mirrored into the single migration under a parity gate; and the fact that **the E2E suite never exercises the redirect allowlist**, so a wrong `config.toml` edit passes every gate unless it is probed directly. The probe exists, costs nothing and was run on the live stack for this research in both directions.

The three research-open items resolve cleanly. (a) The older `api/auth/logout` handler has **no live caller**: its only reader is `UniversalDataWriter.logout`, which the only concrete writer overrides without calling `super`. Its `signOut()` is a **global** sign-out (the installed client's default), so the merge removes a global sign-out that nothing reached. (b) The visual check can be run **locally on this macOS/arm64 host** through `tests/scripts/visual-container.sh`: the pinned linux/amd64 image is present, and the last recorded run (2026-10-03) exited 0 with 7 expected / 0 unexpected. (c) The gate's pattern list is extended from 13 entries to a measured, classified table.

**Primary recommendation:** One Node `.mjs` codemod in the phase directory, driven by an ordered mapping table whose every rule carries a plan number and a path scope. Per plan: pure `git mv` commit → `--apply --plan N` → `yarn lint:fix` and `yarn format` (import order and line width change with the longer names) → regenerate the generated files → gates read by exit status. Build the D-18 gate script in plan 1 in report mode and wire it into `lint:check` in plan 4. Verify the allowlist with the `/auth/v1/verify` probe and `docker inspect`, never by the suite's colour.

### What each plan needs from this file

The file is long because the surface is. This is the reading order per plan of D-17.

| Plan | Read | Pitfalls | Open questions to settle first |
|---|---|---|---|
| Before any plan (Wave 0) | § *Standard Stack*, § *Architecture Patterns*, § *Environment Availability*, § *Validation Architecture* → *Wave 0 Gaps* | 15, 18 | 8 |
| 1 — symbols | § *Measured inventory*: route constants, the alias, contexts and storage, catalogues, settings keys | 1 (the i18n gate), 2, 3, 8, 9, 16, 17 | 1, 2, 4, 10, 11 |
| 2 — URLs | § *Research-open (a)*; inventory: paths that move, Supabase; § *Code Examples*: the probe, the merged handler | 1 (the no-session gate), 4, 5, 10, 11, 12, 14 | 9 |
| 3 — test naming | § *Research-open (b)*; inventory: tests | 1 (the a11y gate), 13 | 3, 5 |
| 4 — docs, gate, close | § *The gate pattern list*; Pattern 4; inventory: docs, agent docs, CI | 6, 7, 9 | 6, 7 |

## Where the amended wording and CONTEXT.md disagree

X3 landed as `db5db53a7` while this research ran. `REQUIREMENTS.md` and the roadmap section now agree with D-06 on the API routes. Five residual differences remain; **CONTEXT.md wins in each, and none is resolved here.**

| # | Amended text | CONTEXT.md | Note |
|---|---|---|---|
| W1 | Roadmap criterion 3: "finds none outside the planning record" | D-18: `.planning/` **plus two named exemptions** (`get_candidate_user_data`, `invite-candidate`) | The exemptions appear in the roadmap's *Discussion settled* paragraph but not in the criterion itself. A verifier reading only criterion 3 would count 51 + 73 occurrences as failures. |
| W2 | Roadmap criterion 2: "the identity-provider return … target `contestant/` URLs or the neutral `api/auth/callback`" | D-05: the identity-provider return is `/api/oidc/callback`, which "carries no app name and does not move" | The return URL itself is neither. What changes is where the flow lands afterwards and the `identity-callback` function's `redirectTo`. |
| W3 | Roadmap criterion 2: "Every link that leaves the system arrives on the new routes: the … invitation emails" | D-11: the invitation redirect "is renamed and left dangling"; no page exists at either path | Read literally the criterion cannot be met for the invitation link in this phase. D-11 hands it to Phases 174 and 178. |
| W4 | `REQUIREMENTS.md` traceability table: `E2E-03 \| Phase 179` | CONTEXT `<domain>`: E2E-03 is "the closing criterion" of this phase and of every phase | The table maps the requirement to the last phase only. |
| W5 | NAME-01: symbols are "renamed to `contestantApp`" | D-05: route keys become `ContestantApp*`, "No abbreviation"; the two auth keys become `AuthCallback` / `AuthLogout` | NAME-01 names one spelling; the decisions name several. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page routes `contestant/…` | Frontend Server (SSR) | Browser / Client | SvelteKit's filesystem router: the directory name *is* the URL. Moving `src/routes/candidate/` moves every page; nothing else declares them. |
| Route constants and app gates | Frontend Server (SSR) | Browser / Client | `$lib/routes` is imported by the request hook, by loads and by components; the hook decides gate membership from the route id through `APP_GATES`, never from a pathname. |
| Auth callback and logout endpoints | API / Backend (SvelteKit `+server.ts`) | — | They run on the server because only the request hook's Supabase client can write the httpOnly session cookies. |
| Redirect allowlist | Database / Storage (Supabase Auth service config) | — | `additional_redirect_urls` is read into the auth container's environment when the stack starts. It is service state, not code. |
| Outbound link targets | API / Backend (Edge Functions, `SupabaseDataWriter`) | — | Three code sites build a `redirectTo`; the auth service validates it against the allowlist. |
| Stored settings keys | API / Backend (zod schemas in `@openvaa/app-shared`) | Database / Storage (JSONB) | The column is schemaless JSONB; the strict zod schema is what gives a key its meaning, and it is where an old key is dropped. |
| Message namespaces | CDN / Static (compiled catalogues) | Browser / Client | Paraglide compiles the JSON catalogues into `src/lib/paraglide/**` at build and dev start; the `t()` wrapper looks a key up by its dotted string. |
| Browser-storage keys | Browser / Client | — | `sessionStorageState` / `localStorageState` literals in the context modules. |
| The "search finds none" gate | Build tooling (`scripts/assert-*.mjs` in `lint:check`) | — | A text scan of tracked files, in the house style of the other standing gates. |

## Research-open items, answered by measurement

### (a) The logout merge — which behaviour survives, and does the older handler have a live caller

**The older handler has no live caller.** Evidence, each line re-runnable:

| Reader or caller | What it is | Live? |
|---|---|---|
| `UNIVERSAL_API_ROUTES.logout` — declared once, `apps/frontend/src/lib/api/base/universalApiRoutes.ts` | `logout: \`${API_ROOT}/auth/logout\`` [VERIFIED: apps/frontend/src/lib/api/base/universalApiRoutes.ts:10-13] | — |
| `UniversalDataWriter.logout` | The **only** reader of `UNIVERSAL_API_ROUTES.logout`. It posts to the route and reads `clientResult.type === 'success'` [VERIFIED: apps/frontend/src/lib/api/base/universalDataWriter.ts:112-133] | **Dead at run time**, see next row |
| `SupabaseDataWriter.logout` | Overrides the base method: `async logout() { return this._logout(); }`, with no `super.logout()` anywhere in `apps/frontend/src` (`git grep -c 'super\.logout'` → no file) [VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:76-82] | Live; it never reaches the base method |
| `createDataWriter` | Constructs `new SupabaseDataWriter(…)` unconditionally; it is the only construction site outside tests [VERIFIED: apps/frontend/src/lib/api/dataWriter.ts:12-14] | Live |
| Subclasses of `UniversalDataWriter` | Exactly one: `SupabaseDataWriter` (`git grep -n 'extends .*UniversalDataWriter'`). `adapters/apiRoute/` holds a data provider and a feedback writer and no data writer; the server-side `local` adapter likewise | — |
| `ROUTE.CandAppAuthLogout` in `SupabaseDataWriter._logout` | `await fetch(ROUTE.CandAppAuthLogout, { method: 'POST' });` inside `if (typeof window !== 'undefined')`. **The response is discarded** [VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:64-74] | Live — the one caller of the newer handler |
| Callers of `dataWriter.logout()` | `authContext.svelte.ts` (`dw.logout()`), which the candidate context's own `logout` delegates to, and `routes/admin/(protected)/+layout.ts` (`handleError`). Both go through `SupabaseDataWriter` | Live; both apps |
| The path literal `/api/auth/logout` elsewhere | `route.test.ts` and `voterAppPath.test.ts` use it as a sample API path for `isApiRoute`; one docs page lists `auth/logout` among the server routes; `apps/frontend/eslint.config.mjs` allowlists the file | Not callers |
| `tests/` | `git grep -n 'auth/logout' -- tests` → nothing. No spec posts to either endpoint | — |
| Unit tests of either handler | None exist (`apps/frontend/src/routes/api/auth/` and `…/api/candidate/auth/logout/` each hold only `+server.ts`) | D-06's unit test is new work |

Re-derive with:

```bash
git grep -n "UNIVERSAL_API_ROUTES\.logout" -- ':!.planning'
git grep -n "auth/logout" -- ':!.planning'
git grep -n -P "\.logout\(|backendLogout|_logout\b" -- apps/frontend/src
git grep -n "UniversalDataWriter" -- apps/frontend/src ':!*.md'
```

**What the two handlers actually do.** The CONTEXT table calls the older handler's call "default scope". The installed client states what that default is: `@supabase/auth-js` 2.117.2 declares `scope?: 'global' | 'local' | 'others'` and its `signOut` documentation reads "**Warning:** the default `scope` is `'global'`. This signs the user out of **every device they are currently signed in on**" [VERIFIED: node_modules/@supabase/auth-js/dist/module/GoTrueClient.d.ts:2005-2009 and lib/types.d.ts:1931-1943]. So:

| | `api/auth/logout` (older, no caller) | `api/candidate/auth/logout` (live) |
|---|---|---|
| Call | `await locals.supabase.auth.signOut();` → **global** [VERIFIED: apps/frontend/src/routes/api/auth/logout/+server.ts:9-12] | `await locals.supabase.auth.signOut({ scope: 'local' });` [VERIFIED: apps/frontend/src/routes/api/candidate/auth/logout/+server.ts:13-16] |
| Response | `json({ ok: true, type: 'success' } as DataApiActionResult)` | `json({ success: true })` |
| Signature | `POST({ locals })`, untyped | `POST({ locals }: RequestEvent): Promise<Response>` |

**Conclusion for the plan.** D-06's chosen reading is supported by the tree: the surviving handler keeps `signOut({ scope: 'local' })`, its typed signature and its docstring, and answers `{ ok: true, type: 'success' }`. The stated behaviour change, in measured terms: (1) the response body of the route the app posts to changes shape, and no caller reads it; (2) **a global sign-out endpoint no longer exists at any route** — today one exists and nothing calls it. The second point is what the phase summary must say, in those words, because "default scope" understates it.

Three consequences the merge commit carries, none of which is in CONTEXT.md:

1. `apps/frontend/eslint.config.mjs` — `ADAPTER_BOUNDARY_ALLOWLIST` names **both** logout files. The entry `'src/routes/api/candidate/auth/logout/+server.ts'` is deleted with the file; the surviving entry's comment (`// 158-EASY: a bare \`auth.signOut()\`.`) becomes false and is corrected under D-21. The block's prose counts "the nine grandfathered sites" in two places, and `eslint-adapter-boundary-guard.test.ts` repeats the number; the count becomes eight [VERIFIED: apps/frontend/eslint.config.mjs:29-43].
2. `supabaseDataWriter.test.ts` pins `'/api/candidate/auth/logout'` three times and `ROUTE.CandAppAuthLogout` once; `appGates.test.ts` uses `ROUTE.CandAppAuthLogout` as its sample API route id.
3. The inline comment in `_logout` explains that reading the locale off the pathname "returns 'candidate' for an unprefixed candidate route". After the URL move that segment is `'contestant'`; the comment is one of the D-21 corrections of fact.

### (b) The opt-in visual-regression run on a macOS host

**It can be run locally, on this host, today.** There are two channels, and the first is the one to plan on.

**Channel 1 — the in-container run (`tests/scripts/visual-container.sh`).** The script runs Playwright inside the pinned linux/amd64 image and reaches the host's dev server through a TCP relay, so the screenshots are rasterised on Linux/x86_64 even though the host is macOS/arm64.

| Fact | Evidence |
|---|---|
| The pinned image is present locally and is linux/amd64 | `docker image inspect "mcr.microsoft.com/playwright@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27" --format '{{.Architecture}} {{.Os}}'` → `amd64 linux`, exit 0 (run for this research). The script refuses to pull (exit 4), so presence is a precondition, and it holds. |
| The channel worked two days ago on this host | `tests/e2e-runs/169-08-visual-final/status` holds `0`; its `results.json` stats are `expected: 7, unexpected: 0, flaky: 0, skipped: 0`, start `2026-10-03T16:12:16Z`; `provenance.txt` records `uname_m=x86_64` inside the container. |
| The host recipe that produced it | Recorded in `169-EVIDENCE.md`: `yarn build`, `yarn db:reset && yarn db:seed --template e2e/base`, then `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2 yarn workspace @openvaa/frontend dev --host 0.0.0.0`, then `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/<name>`. |
| The one known way to get it wrong | The same record: the run `169-04-visual-playwright-attempt1-wrong-project` exited 1 before any test because the dev server was started **without** `PUBLIC_PROJECT_ID`, so it served the default project and the served-project preflight refused. |
| `yarn dev --host 0.0.0.0` does not work | The script header: the root `dev` script chains through `concurrently`, so the flag lands on `concurrently`; use the workspace script. |

The run for D-19 (ii), from the repo root, with **no** update flag:

```bash
tests/scripts/visual-container.sh --run-dir tests/e2e-runs/170-visual; echo "exit=$?"
# then read tests/e2e-runs/170-visual/observed.txt: observed_expected=7, observed_unexpected=0
```

**Channel 2 — CI (`e2e-visual` job) through the `ci-evidence/**` push trigger.** `.github/workflows/main.yaml` runs on a push to a `ci-evidence/**` branch, and its `e2e-visual` job runs `PLAYWRIGHT_VISUAL=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/ci-visual --no-db-reset --no-watch --project visual-regression`. Two cautions. The branch must be a source-only tree (the standing note records 2,930 `.planning/` files that must not be pushed to the public repository) and every evidence commit must touch a non-`.md` path, because `paths-ignore: "**.md"` otherwise produces no run at all. And the standing note says the two E2E jobs "have NEVER passed" in CI as of its writing; whether that still holds was **not observed** in this session [ASSUMED: stale-able memory note]. Channel 2 is therefore a fallback, not the plan.

**What "without a pixel changing" is proven by.** Not by the run: by the blob ids. Today:

```
402f4bf8d8af61bfc2db5fac26d4df25d8acbebc  …/visual-regression.spec.ts/candidate-preview-desktop.png
8878188644373d9a6069c98b46819d4be546f2a5  …/visual-regression.spec.ts/candidate-preview-mobile.png
```

After the move, `git ls-files -s tests/tests/specs/visual/__screenshots__/` must show the same two ids under the `contestant-preview-…` names. The run then proves the *rendering* still matches them.

**The hazard that makes the blob check necessary.** A baseline's path comes from the string handed to `toHaveScreenshot` (`snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}'`), and Playwright's `updateSnapshots` default is `'missing'`: "Missing snapshots are created" [CITED: playwright.dev/docs/api/class-testconfig]. So if the argument is renamed and the file is not (or the reverse), the run **writes a new baseline** instead of comparing against the old one. Guard: after the visual run, `git status --porcelain tests/tests/specs/visual/__screenshots__/` prints nothing.

### (c) The complete pattern list for the "search finds none" gate

See § *The gate pattern list* below: the 13 patterns D-18 lists, the 8 it names as examples, and 23 found by research, each with a measured count, a class and — where it applies — the entity-typed residue the pattern must not catch.

## Measured inventory of the rename surface

Every population is stated as a command. Counts are the snapshot at HEAD `c74eb65ae`; they are context, not targets. `occ / files` means occurrences / files, `.planning/` excluded. **`git grep -E` on this host (BSD regex) does not understand `\b`** — a pattern using it silently matches nothing. Use `git grep -P` for word boundaries; every command below that needs one does.

### Paths that move

```bash
# Every tracked path carrying an app-level name (238 today; the CONTEXT figure reproduces)
git ls-files -- ':!.planning' | grep -E "(routes|lib|contexts|navigation|api|fixtures|setup|specs|generated)/candidate(/|$)|candidateApp\.|candidate-app|candidate-(journey|a11y|bank-auth|preview)|candidateJourneyConstants|candidate-user-management|navigation/candidate"
```

| Population | Command | Today | Plan |
|---|---|---|---|
| Page tree | `git ls-files apps/frontend/src/routes/candidate` | 34 files, 20 directories | 2 |
| API tree | `git ls-files apps/frontend/src/routes/api/candidate` | 4 files: `auth/callback/+server.ts`, `auth/logout/+server.ts`, `preregister/+server.ts`, `preregister/preregisterUpstreamStatus.test.ts` | 2 |
| `lib/candidate/` | `git ls-files apps/frontend/src/lib/candidate` | 26 files | 1 |
| Context directory | `git ls-files apps/frontend/src/lib/contexts/candidate` | 7 files, 6 of them named `candidate…` | 1 |
| Navigation | `git ls-files apps/frontend/src/lib/dynamic-components/navigation/candidate` | 3 files | 1 |
| Message catalogues | `git ls-files apps/frontend/messages \| grep -c candidateApp` | 119 (17 × 7 locales) | 1 |
| Tests | `git ls-files tests \| grep -i candidate` | 26: 14 under `fixtures/candidate/` (13 files named for the app plus `perm-l10n.ts`, which moves with the directory), 4 under `setup/candidate/`, 4 under `specs/candidate/` (3 specs and a `.gitkeep`), `specs/a11y/candidate-a11y.spec.ts`, `utils/candidateJourneyConstants.ts`, 2 PNG baselines | 3 |
| Docs section | `git ls-files 'apps/docs/src/routes/(content)/developers-guide/candidate-app'` | 5 pages | 4 |
| Docs redirect stubs | `git ls-files 'apps/docs/src/routes/(content)/developers-guide/candidate-user-management'` | 5 `+page.ts` (re-pointed; directory rename is discretionary) | 4 |
| Generated component docs | `git ls-files 'apps/docs/src/routes/(content)/developers-guide/frontend/components/generated' \| grep -i candidate` | 8 pages — **regenerated, not moved**: `move-generated.ts` clears the destination before writing | 4 |
| dev-seed template | `git ls-files packages/dev-seed \| grep candidate-app` | `src/templates/e2e/perm/perm-disable-candidate-app.ts` — **not named in CONTEXT.md**; registered in `templates/index.ts` as the key `'perm-disable-candidate-app'` and the export `permDisableCandidateAppTemplate` | 1 |

Inside the page tree two files carry the name themselves: `(protected)/candidateHome.helpers.ts` and its test (14 `CandidateHome*` type and helper names, 77 occurrences in 12 files counting the test fixtures of the same stem).

**Entity-typed paths that must not move** (they match `candidate` and are not the app): `packages/data/src/objects/entities/variants/candidate*.ts`, `…/nominations/variants/candidateNomination*.ts`, `packages/dev-seed/src/generators/CandidatesGenerator.ts`, `…/templates/defaults/candidates-override.ts`, `apps/supabase/supabase/functions/identity-callback/candidateRecord*.ts`, `apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql`, `apps/frontend/src/lib/api/utils/translateLocalizedCandidate.ts`, the three publishers'-guide pages (`candidates-or-parties-answers`, `moderation-of-candidate-answers`, `candidates-and-parties-data-be`), `apps/docs/static/images/guides/nested-candidate-matches-within-parties.png`, and the spike source directory `.claude/skills/…/sources/005-candidate-answer-store-rune/`. `invite-candidate/` stays by D-10.

### Route constants, gates and the request hook

```bash
git grep -n -P "\bCANDIDATE(_PROT|_GATE)?\b|isCandidateRoute" -- apps/frontend/src/lib/routes
git grep -o "CandApp[A-Za-z]*" -- ':!.planning' | awk -F: '{print $NF}' | sort | uniq -c | sort -rn
```

- `route.ts` declares `export const CANDIDATE = '/candidate';` and `CANDIDATE_PROT` [VERIFIED: apps/frontend/src/lib/routes/route.ts:10-13] and the 21 `CandApp*` keys, of which the last two are `CandAppAuthCallback: \`${API_ROOT}/candidate/auth/callback\`` and `CandAppAuthLogout: \`${API_ROOT}/candidate/auth/logout\`` [VERIFIED: apps/frontend/src/lib/routes/route.ts:92-114].
- The word `CANDIDATE` is **not** imported anywhere outside `route.ts` (tests reach it through `ROUTE`), so its rename is a file-scoped rule. Tree-wide the bare word occurs 41 times in 17 files, and outside `route.ts` every one is the entity or the English word ("NOT A TIDY-UP CANDIDATE" in `eslint.config.mjs`).
- `appGates.ts` holds `const CANDIDATE_GATE` with `name: 'Candidate App'`, `isRoute: isCandidateRoute`, `loginRoute: 'CandAppLogin'`.
- `hooks.server.ts` does **not** key on the literal: it reads `APP_GATES` by route id. Nothing in the hook needs more than the renamed symbols. `routeConsistency.test.ts` walks `src/routes/` on disk for `(protected)` groups and ties them to `ROUTE` and `APP_GATES`, so the constant's value and the directory must change in the same content commit.
- **Tests import the frontend's route keys.** `tests/` calls `buildRoute({ route: 'CandAppPreview', … })` (21 uses of a `CandApp*` key) and `yarn typecheck:tests` is a link in `lint:check`. Plan 1's key rename therefore edits `tests/` too. Plan boundaries follow *pattern families*, not directories.

### The alias, in three places

```bash
git grep -n -P '\$candidate\b' -- ':!.planning'
```

The alias is declared **twice**, and consumed by a third tool:

1. `apps/frontend/svelte.config.js` — `$candidate: path.resolve('./src/lib/candidate')`.
2. `apps/frontend/vitest.config.ts` — `{ find: '$candidate', replacement: path.resolve(here, 'src/lib/candidate') }` [VERIFIED: apps/frontend/vitest.config.ts:26-30]. Vitest does not read the SvelteKit alias map; a missed edit here fails only the unit suite.
3. `apps/docs/scripts/docs-scripts.config.ts` — `dir: join(FRONTEND_ROOT, 'src', 'lib', 'candidate', 'components')`, `name: 'Candidate App Components'`, `importPrefix: '$candidate/components'` [VERIFIED: apps/docs/scripts/docs-scripts.config.ts:68-72], and `generate-component-docs.ts` branches twice on `componentDir.importPrefix === '$candidate/components'` to set `categorySubdir = 'candidate/components'`. The `dir` is built from path *segments*: no path-fragment pattern matches it.

Six imports bypass the alias and spell `$lib/candidate/components/…` (one of them in `routes/admin/login/+page.svelte`, which uses the app's `PasswordField`). The `lib/candidate` pattern covers them.

### Contexts and browser storage

```bash
git grep -n -P "(sessionStorageState|localStorageState)[^\n]*[Cc]andidate|['\"\`][Cc]andidateContext-" -- apps/frontend/src
```

**Four keys, not two.** CONTEXT.md names two; the tree has:

| Key (verbatim) | Storage | Where |
|---|---|---|
| `'candidateContext-preselectedElectionIds'` | session | [VERIFIED: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:102] |
| `'candidateContext-preselectedConstituencyIds'` | session | [VERIFIED: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:104-106] |
| `'candidateContext-isPreregistered'` | local | [VERIFIED: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:108] |
| `'CandidateContext-candidateUserDataStore-editedAnswers'` | local | [VERIFIED: apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts:41-44] |

No test and no Playwright storage state names any of them. The earlier `store-to-state` codemod deliberately skipped the fourth key to avoid orphaning persisted data; under the nothing-is-deployed ruling that reason no longer holds, and the listed patterns rewrite it to `'ContestantContext-contestantUserDataStore-editedAnswers'`.

A second spelling of the context local exists: `const candidateCtx = …` in `QuestionHeading.svelte` (2 code uses). No file holds both `candCtx` and `candidateCtx`, so both can map to `contestantCtx` without a collision.

**The `[Cc]andidateUserData` pattern reaches the DataWriter API.** Its 123 occurrences in 24 files include `getCandidateUserData` (20), `GetCandidateUserDataOptions` (7) and `_getCandidateUserData` (3), declared in `apps/frontend/src/lib/api/base/dataWriter.type.ts`, plus `App.PageData.candidateUserData` in `app.d.ts`. CONTEXT fact 3's figure of 123/24 is exactly this population, so D-04 as counted renames the method to `getContestantUserData` — which then calls the RPC `get_candidate_user_data` that D-09 keeps. See *Open Questions* 2.

### Message catalogues, and why a namespace rename is safe

```bash
python3 - <<'PY'   # flatten every locale; counts per namespace
import json,glob,os
for loc in ['da','en','et','fi','fr','lb','sv']:
    n=c=d=0
    for f in glob.glob(f'apps/frontend/messages/{loc}/*.json'):
        def walk(t,p):
            global n,c,d
            for k,v in t.items():
                fk=f'{p}.{k}' if p else k
                if isinstance(v,dict) and not any(x in v for x in ('declarations','selectors','match')): walk(v,fk)
                else:
                    n+=1; c+=fk.startswith('candidateApp.'); d+=fk.startswith('dynamic.candidateApp')
        walk(json.load(open(f)),'')
    print(loc,n,c,d)
PY
```

Measured: every one of the seven locales holds **595 keys, of which 159 are `candidateApp.*` and 15 are `dynamic.candidateApp*`**, in 17 `candidateApp.<page>.json` files each. (The doc comment in `assert-i18n-catalog-namespaces.mjs` says 598 and 161; the script's own output says 595 and 159. The comment is stale independently of this phase.)

How a key reaches the screen, end to end:

1. **The catalogue.** Each file holds exactly one top-level key equal to its file name without `.json` — `{"candidateApp.common": { … }}`. `tools/translationKey/generateTranslationKeyType.ts` **throws** if the top-level key and the file name disagree, so the file move and the in-file key change must land together before the generator runs.
2. **The inlang settings.** `apps/frontend/project.inlang/settings.json` lists all 47 catalogue files by name under `plugin.inlang.messageFormat.pathPattern`; 17 name `candidateApp.<page>.json`. The generator also **throws** on a listed file that does not exist.
3. **Paraglide's compiler.** Read from the compiled output on disk (`@inlang/paraglide-js` 2.25.4): a key `candidateApp.common.greeting` becomes an internal function `candidateapp_common_greeting1` and is exported under its original dotted string — `export { candidateapp_common_greeting1 as "candidateApp.common.greeting" }` [VERIFIED: apps/frontend/src/lib/paraglide/messages/_index.js, generated; 159 such exports for the namespace]. The internal name is derived from the key; nothing else in the output depends on the namespace string. `src/lib/paraglide/` is gitignored (`apps/frontend/.gitignore`) and rebuilt by the Vite plugin at `dev` and `build` and by `yarn workspace @openvaa/frontend paraglide:compile`.
4. **The wrapper.** `t(key: TranslationKey)` looks up `(m as MessageModule)[key]` and, if no function is found, **returns the key itself**. A missed call site therefore renders the raw key rather than failing at run time.
5. **The type.** `TranslationKey` is a union generated from the base-locale catalogue (`yarn workspace @openvaa/frontend generate:translation-key-type`). Every static call site is typed against it, including the two lookup tables in `lib/candidate/utils/` (`Record<…, TranslationKey>`), so `svelte-check` and `tsc` catch a missed literal.

So the rename is safe **provided** the gate that catches a miss is the type check, and it is: no call site assembles a `candidateApp.` key dynamically (`git grep -n -E "candidateApp\.[A-Za-z.]*\\$\{|\`candidateApp" -- apps/frontend/src tests` finds one test's expected string and doc comments that quote a settings key in backticks; no `t()` argument). Runtime translation overrides are keyed by message key, but no dev-seed template or E2E dataset stores one under a `candidateApp.` key.

Two properties of the catalogues constrain the codemod:

- **No message value contains `candidateApp`** (0 of 4,165 values across the seven locales), so the `candidateApp` → `contestantApp` rule touches only keys there. In the base locale four keys keep an inner entity segment and must keep it: `…error.candidateNoNomination`, `…error.userNoCandidate`, `…preregister.status.candidateExistsError.{title,content}`.
- **Two message values match the prose pattern**: `apps/frontend/messages/en/candidateApp.notSupported.json` holds "…does not support the Candidate Application." and "Candidate Application Not Available". The prose rule of D-14 must exclude `apps/frontend/messages/**` outright. D-19's identity check is the proof that it did.

The regenerated `translationKey.ts` will not be a line-for-line substitution: the generator sorts keys, and `contestantApp.*` sorts after `common.*`, `components.*` and `constituencies.*` where `candidateApp.*` sorted before them.

### Settings and customization keys

```bash
git grep -c -E "candidateApp|CandidateApp|candPoster" -- ':!.planning' ':!apps/frontend/messages' ':!apps/frontend/src' | sort
```

- `packages/app-shared`: `StoredSettingsSchema` holds `access.candidateApp`, `notifications.candidateApp` and the root `candidateApp` [VERIFIED: packages/app-shared/src/data/schemas/storedSettings.schema.ts:130-149]; the customization schema holds `candPoster` and `candidateAppFAQ` [VERIFIED: packages/app-shared/src/data/schemas/storedCustomization.schema.ts:36-41]; `staticSettings.ts` holds `supportsCandidateApp: true` [VERIFIED: packages/app-shared/src/settings/staticSettings.ts:12-15], with two more in `staticSettings.type.ts`; `dynamicSettings.ts` and `dynamicSettings.type.ts` hold three each. Both schema files have a sibling `.test.ts` that states the keys.
- `packages/dev-seed`: `templates/e2e/base.ts`, `templates/e2e/perm/{shared,perm-access-disable,perm-closed-project,perm-disable-candidate-app,perm-hide-hero,perm-per-app-notifications}.ts`, `templates/index.ts`, `templates/_helpers/buildMinimal.test.ts`, and `tests/templates/base-app-settings.test.ts`, which pins `'candidateApp'` in an exact top-level key list.
- `tests/`: the perm specs write the keys through the admin client (`perm-access-disable.spec.ts` 7, `perm-question-video.spec.ts` 4, `perm-per-app-notifications.spec.ts` 1, `setup/perm/perm-access-disable.setup.ts` 1).
- `apps/frontend/src`: the provider localises notifications by iterating `['candidateApp', 'voterApp'] as const` — a key held as a string literal in code.
- **pgTAP states none of the keys.** `git grep -n -i "candidateApp" -- apps/supabase` finds nothing; the only SQL mention is the comment "the candidate-app FAQ" in `schema/106-app-settings.sql` and its mirror in the migration.
- **What a stale stored row does.** The settings column is parsed with `parseWithPartialPreserve`, which keeps the members the strict schema accepts and drops the rest with a logged error. A row still holding `access.candidateApp: false` after the rename is therefore *silently read as open*. Under the nothing-is-deployed ruling this is accepted. For the E2E project it cannot arise: `setupFromTemplate.ts` REPLACEs the whole `settings` JSONB and asserts exact equality after every template seed, so `--no-db-reset` is safe for the run that follows D-07.

### Supabase: allowlist, functions, SQL

- `apps/supabase/supabase/config.toml`: `additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:5173/api/candidate/auth/callback", "http://localhost:5173/*/api/candidate/auth/callback"]`, under a comment block that quotes `/fi/api/candidate/auth/callback` and `/fi/api/candidate/auth/callback/extra` [VERIFIED: apps/supabase/supabase/config.toml:177-195]. `site_url = "http://127.0.0.1:5173"`. No custom email template is configured (both `content_path` lines are commented out) and there is no `[functions.*]` block.
- Edge Functions: `redirectTo: \`${redirectSiteUrl}/candidate\`` [VERIFIED: apps/supabase/supabase/functions/identity-callback/index.ts:340-346] and `const redirectTo = \`${siteUrl}/candidate/complete-registration\`;` [VERIFIED: apps/supabase/supabase/functions/invite-candidate/index.ts:125-126]. No Edge Function test pins either string.
- **SQL comments are byte-mirrored.** `assert:schema-migration-parity` (in `lint:check`) requires `cat schema/*.sql` to equal `migrations/00001_initial_schema.sql` byte for byte. The prose sweep of D-14 touches comments in `schema/106-app-settings.sql` and `schema/302-rls.sql`; the mirror is refreshed with `yarn schema:regenerate`, or by applying the identical substitution to both, and the gate proves which. It is a comment-only change, so no `db:reset` and no types regeneration follow from it.
- `packages/supabase-types` carries no app-level name; its only matches are the exempt RPC.

### Tests

```bash
git grep -c -P "/candidate\b" -- tests | sort -t: -k2 -nr | head -20      # URL and path fragments
git grep -h -o -E "data-testid=(\"|'|\{['\"\`])candidate-[A-Za-z0-9-]*" -- apps/frontend/src | sed -E "s/.*(candidate-[A-Za-z0-9-]*)/\1/" | sort -u   # the 34 ids
git grep -n -o -P "getByTestId\(['\"\`]candidate-[a-z0-9-]*" -- tests                                                                                # raw ids outside testIds.ts
git grep -n -E "name: '[a-z-]*candidate[a-z-]*'|'[a-z-]*candidate-(journey|a11y-scan)'" -- tests/playwright.config.ts
```

- **Playwright project names: five, not three.** `'candidate-a11y-scan'` [VERIFIED: tests/playwright.config.ts:258-262], `'cold-entry-dataroot-candidate'` with `grep: /@cand-session/` and the sibling project's `grepInvert: /@cand-session/` [VERIFIED: tests/playwright.config.ts:371-385], and `'data-setup-candidate-journey'`, `'data-teardown-candidate-journey'`, `'candidate-journey'` [VERIFIED: tests/playwright.config.ts:679-701]. The names recur as strings in `dependencies:` and `teardown:` entries and in `tests/README.md`.
- **Test ids: 34 in source, 25 of them in `testIds.ts`.** Nine are used as raw strings and are in no registry: `candidate-home-continue`, `candidate-home-preview`, `candidate-home-profile`, `candidate-home-tip`, `candidate-questions-cancel`, `candidate-questions-continue`, `candidate-questions-home`, `candidate-questions-progress`, `candidate-questions-return`. Raw `getByTestId('candidate-…')` calls sit in `candidateHomePage.fixture.ts`, `candidateQuestionsOverviewPage.fixture.ts` and `candidate-journey.spec.ts` (ten sites, five of them the `candidate-nav-*` ids). The 34 fall under eight stems — `answers`, `help`, `home`, `nav`, `preview`, `privacy`, `profile`, `questions` — and the rule `candidate-(answers|help|home|nav|preview|privacy|profile|questions)\b` (136 / 25) matches nothing that names the entity.
- **The registry's namespace is app-named.** `tests/tests/utils/testIds.ts` opens `candidate: {` beside `voter: {`; `testIds.candidate` is used 135 times in 27 files. D-12 names the id *values*; the namespace key is the same kind of name. See *Open Questions* 3.
- **URL literals take three forms.** With a leading slash (`'/candidate/login'`, `/\/candidate(\/|$|\?|#)/`); **without one** (`'candidate/profile'`, `redirectTo: 'candidate/questions/first-question'` — 10+ in `buildRoute.redirects.test.ts`, `loginRedirectTarget.test.ts`, `appGates.test.ts`); and **percent-encoded** (`'/candidate/login?redirectTo=candidate%2Fprofile'`, `'candidate%2Fprofile'`). D-18's `/candidate/` pattern sees only the first.
- **Storage-state files carry no app name** (`playwright/.auth/user.json`, `perm-*.json`) and are re-minted by each run's setup projects. Nothing to rename; nothing stale survives a run.
- `tests/IDURA-TEST-RUNBOOK.md` (14 `/candidate` fragments) and `tests/README.md` (8) describe the old paths and project names.

### Docs, agent docs, CI

```bash
git grep -c -i -E "candidate[ -]app(lication)?s?" -- 'apps/docs/src/routes/(content)/developers-guide' | wc -l
git grep -n -i "candidate" -- apps/docs/scripts apps/docs/src/lib/navigation.config.ts
git grep -c -E "candidateApp|CandApp|CandidateContext|candidateContext|candCtx|\\\$candidate|routes/candidate|lib/candidate|contexts/candidate|api/candidate|candidateUserData|CandidateUserData|[Cc]andidate[ -][Aa]pp" -- .claude CLAUDE.md
```

- `apps/docs/src/lib/navigation.config.ts` holds the section title `'Candidate app'` and six `/developers-guide/candidate-app…` routes. `generate-navigation-config.ts` compares the config with the routes on disk and marks differences with "New" and "Removed" comments; rewriting the six route strings **before** running the generator leaves it nothing to mark [ASSUMED: inferred from the script header, not run].
- `yarn workspace @openvaa/docs generate:docs` runs component docs → route map → move → navigation → link validation, then `yarn format`. `validate-links --check` reports a link that lands on a redirect stub as a finding, which is the check that the five `candidate-user-management` stubs point at pages that exist.
- `.claude/skills/components/SKILL.md` lists `apps/frontend/src/lib/candidate/components` in its `targets:` frontmatter, which `.claude/scripts/audit-skill-drift.sh` parses. `CLAUDE.md` has 6 matching lines, `.claude/skills/**` 15 files.
- `.github/workflows/*.yml`: **no app-level name**. The one `candidate` in `main.yaml` is prose about seeded candidate rows. CI invokes projects only through the wrapper and by `--project visual-regression`.
- Root `ROADMAP.md` (a tracked project-level file, not the planning roadmap) says "the candidate app" twice. It is outside `.planning/`, so a prose gate would report it.

## The gate pattern list (D-18), measured

Counts come from a throwaway scanner over `git ls-files` (2,598 text files, `.planning/` and `.yarn/` excluded) using JavaScript regular expressions, which is the engine the gate will run on. "Residue" is what the pattern matches that is **not** app-level; a pattern with residue needs the stated anchoring before it can join the gate.

**Listed by D-18 (13)**

| # | Pattern (JS regex) | occ / files | Class | Residue |
|---|---|---|---|---|
| L1 | `candidateApp` | 756 / 212 | app | none |
| L2 | `CandidateApp` | 10 / 5 | app | none (`supportsCandidateApp`, `permDisableCandidateAppTemplate`) |
| L3 | `CandApp` | 193 / 55 | app | none |
| L4 | `CandidateContext` | 112 / 47 | app | none |
| L5 | `candCtx` | 161 / 18 | app | none |
| L6 | `\$candidate\b` | 33 / 23 | app | none |
| L7 | `isCandidateRoute` | 12 / 5 | app | none |
| L8 | `CandidateNav` | 27 / 12 | app | none |
| L9 | `routes\/candidate\b` | 36 / 26 | app | none |
| L10 | `lib\/candidate\b` | 51 / 26 | app | none |
| L11 | `contexts\/candidate\b` | 41 / 35 | app | none |
| L12 | `api\/candidate\b` | 38 / 18 | app | none; no exemption (R6) |
| L13 | URL `\/candidate` not followed by a word character, `.` or `-`, and not preceded by a path-fragment or entity prefix | 211 / 56 | app | 3 left after anchoring — see below |

**Named by D-18 as examples (8)**

| # | Pattern | occ / files | Class | Residue |
|---|---|---|---|---|
| E1 | `[Cc]andidateUserData` | 123 / 24 | app | none — but it includes `getCandidateUserData` and its two siblings (30) |
| E2 | `candidateContext` | 55 / 26 | app | none; covers three of the four storage keys, the file names and a local |
| E3 | `candPoster` | 13 / 7 | app | none |
| E4 | `cand-session` | 5 / 2 | app | none |
| E5 | `candidate-journey` | 77 / 24 | app | none; covers the three project names that hold it |
| E6 | `candidate-a11y` | 41 / 6 | app | none |
| E7 | `cold-entry-dataroot-candidate` | 2 / 2 | app | none |
| E8 | `candidateJourneyConstants` | 4 / 4 | app | none |

**Found by research (23)**

| # | Pattern | occ / files | Class | Note |
|---|---|---|---|---|
| R1 | `candidateCtx` | 4 / 2 | app | second spelling of the context local |
| R2 | `CANDIDATE_(PROT\|GATE)\b` | 9 / 2 | app | |
| R3 | `\bCANDIDATE\b`, scoped to `apps/frontend/src/lib/routes/route.ts` | 17 in the file | app | tree-wide the word has 24 entity or English uses in 16 other files; the gate rule must be file-scoped |
| R4 | `navigation\/candidate\b` | 7 / 3 | app | D-02 names the directory; the list omits the fragment |
| R5 | `(fixtures\|setup\|specs)\/candidate\b` | 28 / 15 | app | D-12 names the directories |
| R6 | `candidate-bank-auth` | 18 / 10 | app | D-12 names the specs |
| R7 | `candidate-preview` | 8 / 5 | app | the two baselines and one test id |
| R8 | `candidate-(answers\|help\|home\|nav\|preview\|privacy\|profile\|questions)\b` | 136 / 25 | app | the 34 test ids by stem; zero entity matches |
| R9 | `testIds\.candidate\b` | 135 / 27 | app (open) | `testIds.voter.results.candidateSection` does not match |
| R10 | `[Cc]andidate(Login\|Home\|Profile\|Preview\|Question\|QuestionsOverview\|TermsOfUse\|ForgotPassword\|Preregister)Page` | 315 / 26 | app | fixture page objects, their types and factories |
| R11 | `[Cc]andidate(LogoutButton\|PasswordSetter)` | 68 / 9 | app | fixtures of the app's own widgets |
| R12 | `CandidateJourney`, `candidateTest\b`, `[Cc]andidateSession` | 4 / 1, 9 / 1, 13 / 5 | app | `CandidateJourneyFixtures`, the visual spec's `candidateTest` alias, `setupCandidateSession` / `mintCandidateSession` / `candidateSessionMinter` |
| R13 | `[Cc]andidateHome` | 77 / 12 | app | `candidateHome.helpers.ts` and its 12 type names; overlaps R10 |
| R14 | `Candidate(Login\|Preregistration)Error`, `CANDIDATE_(LOGIN\|PREREGISTRATION)_ERROR` | 19 / 5 | app (open) | in `lib/candidate/utils/`; the error *codes* inside (`userNoCandidate`, `candidateNoNomination`) name the entity and stay |
| R15 | `CANDIDATE_(APP_URL\|LOGIN_URL\|AXE_ROUTES\|A11Y_SPEC\|NAV_LOGGED_(IN\|OUT)\|SIBLING_PREFIX_ROUTE_IDS)` | 16 / 4 | app | constants in the a11y spec, the journey spec, `appGates.test.ts` and the a11y gate script |
| R16 | `CandidateAxeRoute`, `candidateA11ySrc`, `assertCandidate(Reach\|AuthNavPresent)`, `candidateLoad\b`, `candidateProjectMatch` | 19 / 4 | app | helpers and locals of the same files |
| R17 | `appType[^\n]{0,40}['"]candidate['"]` and the union `'admin' \| 'candidate' \| 'voter'` | 6 / 6 | app (open) | the `AppType` discriminant value; not in CONTEXT.md |
| R18 | slashless `candidate\/` or `candidate%2F` before a lower-case letter or `(`, not preceded by a word character, `/`, `.` or `-` | 80 / 45 | app | **11 residue** — see below |
| R19 | `join\([^\n]*['"]candidate['"]` | 2 / 2 | app | `scripts/assert-no-session-in-loads.mjs` and `apps/docs/scripts/docs-scripts.config.ts` |
| R20 | prose `[Cc]andidate[ -][Aa]pp(lication)?s?\b` | 258 / 132 | prose | 26 / 12 of it is the publishers' guide (left to Phase 171) and 2 / 1 is message values (never edited); gate it with those two path exclusions or not at all |
| R21 | `candidate-portal` | 1 / 1 | app | a sibling-prefix probe in `appGates.test.ts`; see Pitfall 14 |
| R22 | `cand-nav-menu`, `notif-cand` | 11 / 3 | open | an a11y scan entry's label; a seeded notification marker string |
| R23 | `hero-candidate` | 2 / 1 | app — operator ruling 2026-10-05 | `apps/frontend/static/images/hero-candidate.png`, the app's default login poster. **Renamed to `hero-contestant.png` in plan 170-02** (`git mv`, references updated in the content commit); a gate pattern with no exemption |

**Exempt, one line each (D-09, D-10):** `get_candidate_user_data` 51 / 15; `invite-candidate` 73 / 32.

**The two URL patterns are the only ones that need an allowlist.** These are the entity-typed forms a naive `/candidate/` catches, measured one by one (`git grep -o -P '<form>' -- ':!.planning'`):

| Form | occ / files | What it is | Where |
|---|---|---|---|
| `(candidates\|organizations\|alliances)/candidate` | 8 / 7 | the voter results route's entity segment (`[[entity=etSg]]`) | `resultsRoutes.test.ts`, `voterAppPath.test.ts`, `layout.tracking.test.ts`, the results `+page.svelte`, `+page.ts`, `page.guards.test.ts`, `voter-results-redraw.spec.ts` |
| `variants/candidate` | 11 / 3 | `packages/data` file paths | `packages/data/README.md`, `packages/data/src/internal.ts`, `.claude/skills/data/extension-patterns.md` |
| `proj/candidate` | 2 / 1 | a storage path, where the segment is the entity type | `storageUrl.test.ts` |
| `entity/candidate` | 1 / 1 | a grant string, `entity/candidate/<uuid>/editor` | `apps/supabase/supabase/tests/database/14-grants-migration.test.sql` |
| `voter/candidate`, `Voter/candidate`, `user/candidate`, `party/candidate`, `faction/candidate` | 15 / 13 | slash-separated prose | skills, docs, two SQL comments and their migration mirror, `identity-callback/index.ts`, the `preregister` handler |
| slashless `candidate/party`, `candidate/faction`, `candidate/organization`, `candidate/question`, `candidate/voter` | 11 / 8 | slash-separated prose | publishers' guide, docs |
| `results/candidate`, `candidate/candidate` | 2 / 2 | prose | one test comment, one docs page |

The look-behind used for the L13 measurement, as a starting point for the gate: `(?<!candidates|organizations|alliances|variants|[Vv]oter|party|user|proj|entity|routes|lib|contexts|navigation|api|fixtures|setup|specs)\/candidate(?![\w.-])`. With it, L13's remaining residue is three (`faction/candidate`, `results/candidate`, `candidate/candidate`); R18's is the eleven slashless prose forms. JavaScript supports the variable-width look-behind; PCRE (`git grep -P`) does not, so this one cannot be checked from the shell — only by the gate script itself.

**Classes R9, R14, R17, R22 and R23 are judgement calls the decisions do not make.** Each is listed in *Open Questions* with a recommendation. A pattern joins the gate only after its rename is decided. All five are now decided — see *Open Questions (RESOLVED)*: R9, R14, R17 and R22 as recommended, R23 by the operator's ruling of 2026-10-05 (the poster is renamed).

## Standard Stack

This phase installs nothing. The "stack" is the tooling already in the repository, at the versions the tree pins.

### Core

| Tool | Version | Purpose | Why it is the one to use |
|------|---------|---------|--------------------------|
| Node.js | **24.21.0** (floor `>=24.15.0`) | runs every gate and the codemod | `engines.node` is `>=24.15.0` and `assert:node-engine` is a link in `lint:check` and the `preinstall` hook. See *Environment Availability*: the default Node in a non-interactive shell here is below the floor. |
| git | 2.50.1 | `git mv`, exact-rename verification | `-M100%` "limit[s] detection to exact renames" [CITED: git-scm.com/docs/git-diff]. |
| Yarn | 4.18.1 | workspaces, scripts | root `package.json` `engines.yarn: "4.18"`. |
| Turborepo | ^2.8.17 | `build`, `lint`, `typecheck`, `test:unit` | run with `TURBO_FORCE=true` for gate runs, as the Phase 169 gate script did. |
| Vitest | ^5.0.2 | unit suites (frontend, packages, Edge Functions) | `yarn test:unit`. |
| Playwright | 1.63.0 (catalog) | E2E, a11y scan, visual regression | driven only through `tests/scripts/e2e-run.sh`. |
| Supabase CLI | 2.118.0 | local stack, pgTAP | `yarn db:start`, `yarn db:stop`, `yarn workspace @openvaa/supabase test:db`. |
| `@inlang/paraglide-js` | 2.25.4 (installed) | message compilation | `paraglide:compile`; the Vite plugin at `dev` and `build`. |

### Supporting — tooling that already exists for mass renames

| Asset | What it is | Use in this phase |
|-------|-----------|-------------------|
| `apps/frontend/scripts/store-to-state-codemod.mjs` | The closest precedent: an **ordered allowlist, longest token first**, whole-word anchored, dry-run by default, `--apply` to write, `--files <glob>` to scope, idempotent ("a second run reports 0 rewrites"), with a string-literal guard and documented allowlist omissions. | The shape to copy for the D-15 codemod. Its glob scope is `src/**/*.{ts,svelte}`; this phase needs all tracked text files. |
| `apps/frontend/scripts/flatten-current-codemod.mjs` | The earlier codemod the one above mirrors. | Reference only. |
| `.claude/skills/ship-review-stack/sources/build-rename-commit.sh` | Builds a pure-rename commit **by rule** by re-pathing a tree in a private index, reusing blob ids. Written for `frontend/** → apps/frontend/**`. | Not needed at this size (238 paths); plain `git mv` suffices. Its principle is what transfers: derive the move list from the mapping, never from rename detection. |
| `.claude/skills/ship-review-stack/sources/verify-commit-taxonomy.sh` | Classifies a commit range by subject prefix and checks disjoint modified-path sets. | Optional; the pure-move check in *Code Examples* is enough. |
| `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` | A second text codemod with `--self-test` over committed input/expected fixture pairs. | The model for a codemod self-test, and a **hazard**: its fixtures are byte-exact (Pitfall 9). |
| `scripts/lib/comment-spans.mjs` | The shared comment classifier the hygiene and cookie gates import. | Not needed: the D-18 gate scans comments too (D-14 renames prose in comments). |
| `scripts/assert-*.mjs` (18 gates) | House style: Node built-ins only, `execFileSync('git', ['ls-files', '-z', …])` for the file set, a long header stating the incident and the rules, numbered exit codes, `--self-test` against fixtures under `scripts/fixtures/`. | The D-18 gate follows it. |
| `tests/scripts/e2e-run.sh`, `tests/scripts/e2e-evidence.mjs` | One preflight-confirmed run with an evidence directory; a verdict derived into `summary.json` with `counts.{total,passed,failed,flaky,skipped,didNotRun}`. | The closing run of every plan. |
| `.planning/phases/169-…/169-gates.sh`, `169-e2e.sh` | The most recent working gate and E2E drivers in this repository: each gate run as `cmd > log 2>&1; s=$?`, never through a pipe, with a `summary.tsv`. | Copy the shape into the phase directory rather than transcribing commands into each plan. |

The Phase 158 and 159 directories hold no rename tooling (159 holds `classify-effects.mjs` only); the codemods those phases ran are the two under `apps/frontend/scripts/`.

### Alternatives Considered

| Instead of | Could use | Why not here |
|------------|-----------|--------------|
| A text codemod | An AST transform (`ts-morph`, `jscodeshift`) | Locked by D-15, and correct: the surface includes Svelte markup, JSON keys, SQL comments, Markdown and TOML, none of which a TypeScript AST reads. No AST library is installed. |
| `git mv` | `build-rename-commit.sh` (index-level re-pathing) | That tool earns its complexity at 1,316 paths across a re-parented tree. Here the worktree is the source of truth and the moves are 238 paths. |
| One codemod run | Hand edits | 436 files; D-15 makes the mapping table the reviewable artefact. Hand edits are for the residue pass only. |

**Installation:** none.

## Package Legitimacy Audit

No external package is installed, upgraded or removed by this phase. The codemod and the gate use Node built-ins only, matching the house style of `scripts/assert-*.mjs`. The audit is therefore empty by construction.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

How one plan turns the old tree into a green renamed tree. The same flow runs four times, each over its own rule family.

```
                        mapping table (one file, ordered, longest first)
                        each rule: { plan, from, to, scope, kind: text | path }
                                          |
              +---------------------------+----------------------------+
              |                                                        |
   path rules of plan N                                      text rules of plan N
              |                                                        |
              v                                                        |
   [codemod --moves --plan N]                                          |
   prints old<TAB>new for every tracked path                           |
              |                                                        |
              v                                                        |
   git mv (mkdir -p parents first)                                     |
              |                                                        |
              v                                                        |
   CHECK: every staged row is R100,                                    |
          0 insertions, 0 deletions  --no--> stop: a file was edited   |
              | yes                                                    |
              v                                                        |
   COMMIT 1  "pure move; does not build"                               |
              |                                                        |
              +------------------------------+-------------------------+
                                             v
                              [codemod --apply --plan N]  over git ls-files
                                             |
                                             v
                     regenerate what is generated (never hand-edit):
                     translationKey.ts · schema->migration mirror · docs pages
                                             |
                                             v
                     yarn lint:fix ; yarn format   (import order, line width)
                                             |
                                             v
                     [codemod --plan N]  dry run  --rewrites > 0--> a rule is not idempotent
                                             | 0
                                             v
                     [gate --report --plan N]  --residue--> manual residue pass, loop
                                             | clean
                                             v
                     yarn dev:clean  (drop .svelte-kit and the Vite cache)
                                             |
                                             v
        gates, each read by its own exit status: typecheck · lint:check · check ·
        test:unit · build · format:check · (plan 2: stack restart + allowlist probe) · E2E
                                             |
                               any red ------+------ all green
                                  |                     |
                                  v                     v
                         fix in the mapping        COMMIT 2  content
                         or the residue;           (plan 2 only: COMMIT 3, the
                         never in a pipe            logout merge with its unit test)
```

### Recommended Project Structure

```
.planning/phases/170-contestant-app-rename-symbols-routes/
├── rename.mjs               # the D-15 codemod (throwaway; never in scripts/)
├── rename.map.mjs           # the ordered mapping table: THE reviewable artefact
├── catalogue-identity.mjs   # D-19 (i): flatten before/after, compare through the key map
├── 170-gates.sh             # the per-plan gate set, modelled on 169-gates.sh
├── 170-e2e.sh               # one wrapper run plus the cardinal verdict, modelled on 169-e2e.sh
└── evidence/                # catalogue snapshots, probe output, negative-control records

scripts/
├── assert-no-candidate-app-names.mjs          # the D-18 standing gate
└── fixtures/
    ├── assert-no-candidate-app-names.input.ts               # planted old names (negative control)
    └── assert-no-candidate-app-names.expected.ts.violations # what the gate must report for it
```

### Pattern 1: One ordered mapping table, plan-scoped and path-scoped

**What:** Every rename is a row. A row says which plan applies it, what it matches, what it writes, and where it may run. Text rules and path rules live in the same table, so a file's new name and the strings that refer to it cannot drift.

**When to use:** Every mechanical edit of the phase. If an edit cannot be expressed as a row, it is residue and is done by hand with a note in the plan summary.

**Why plan-scoped, not directory-scoped:** the plans are split by what the tests exercise (D-17), and a pattern family crosses directories. Plan 1's route-key rename edits `tests/` (21 `CandApp*` uses, type-checked by `typecheck:tests`); plan 1's settings-key rename edits the perm specs; plan 3's test-id rename edits eight files under `apps/frontend/src`.

**Example** — the shape, with the rules whose ordering matters. Old names are quoted from the tree; new names are the ones the decisions fix.

```js
// rename.map.mjs — ordered: a rule that contains another rule's match comes first.
export const EXCLUDE = [
  /^\.planning\//, /^\.yarn\//, /^yarn\.lock$/, /^packages\/supabase-types\//,
  /\.(png|jpe?g|webp|gif|ico|woff2?|ttf|pem|pdf|mp4)$/i
];
const NOT_MESSAGES = (f) => !f.startsWith('apps/frontend/messages/');
const NOT_PUBLISHERS_GUIDE = (f) => !f.includes('/publishers-guide/');

export const RULES = [
  // ── plan 1: symbols ────────────────────────────────────────────────────────
  // The two auth keys are left for plan 2, so they are renamed once, not twice.
  { plan: 1, from: /CandApp(?!Auth(Callback|Logout))/g, to: 'ContestantApp' },
  { plan: 1, from: /CandidateApp/g, to: 'ContestantApp' },          // supportsCandidateApp, permDisableCandidateAppTemplate
  { plan: 1, from: /candidateApp/g, to: 'contestantApp' },          // settings keys, namespaces, dynamic groups, candidateAppFAQ
  { plan: 1, from: /candPoster/g, to: 'contestantPoster' },         // also candPosterDark
  { plan: 1, from: /CandidateUserData/g, to: 'ContestantUserData' },
  { plan: 1, from: /candidateUserData/g, to: 'contestantUserData' },
  { plan: 1, from: /CandidateContext/g, to: 'ContestantContext' },
  { plan: 1, from: /candidateContext/g, to: 'contestantContext' },  // file names, locals, three storage keys
  { plan: 1, from: /\bcand(?:idate)?Ctx\b/g, to: 'contestantCtx' },
  { plan: 1, from: /CandidateNav/g, to: 'ContestantNav' },
  { plan: 1, from: /isCandidateRoute/g, to: 'isContestantRoute' },
  { plan: 1, from: /CANDIDATE_(PROT|GATE)\b/g, to: 'CONTESTANT_$1' },
  { plan: 1, from: /\bCANDIDATE\b/g, to: 'CONTESTANT', only: (f) => f === 'apps/frontend/src/lib/routes/route.ts' },
  { plan: 1, from: /\$candidate\b/g, to: '$$contestant' },          // '$$' is a literal '$' in String.replace
  { plan: 1, from: /(lib|contexts|navigation)\/candidate\b/g, to: '$1/contestant' },
  { plan: 1, kind: 'path', from: /\/candidateApp\./, to: '/contestantApp.' },   // 119 catalogue files

  // ── plan 2: URLs ───────────────────────────────────────────────────────────
  // Most specific first: the general URL rule below would otherwise turn the
  // auth pair into api/contestant/auth/…, which D-06 rules out.
  { plan: 2, from: /api\/candidate\/auth\/(callback|logout)/g, to: 'api/auth/$1' },
  { plan: 2, from: /api\/candidate\/preregister/g, to: 'api/contestant/preregister' },
  { plan: 2, from: /CandAppAuth(Callback|Logout)/g, to: 'Auth$1' },
  { plan: 2, from: /routes\/candidate\b/g, to: 'routes/contestant' },
  { plan: 2, from: /(?<!candidates|organizations|alliances|variants|[Vv]oter|party|user|proj|entity|faction|results|candidate|lib|contexts|navigation|fixtures|setup|specs)\/candidate(?![\w.-])/g,
    to: '/contestant', only: NOT_MESSAGES },
  // … slashless and percent-encoded forms, path.join('candidate', …) — see Pitfalls 5 and 12.

  // ── plan 4: slugs and prose ────────────────────────────────────────────────
  // The hyphenated compound is a slug, a template key or a DOM id in more than half its uses
  // (the docs directory, six navigation routes, the dev-seed template key, 'candidate-app-menu'),
  // so it keeps its hyphen and its case. It must never be handed to the spaced rule.
  // No publishers'-guide exclusion here: that guide holds one link into the moved docs section.
  { plan: 4, from: /candidate-app\b/g, to: 'contestant-app' },
  { plan: 4, from: /\b[Cc]andidate [Aa]pp(?![A-Za-z])/g, to: 'Contestant App',
    only: (f) => NOT_MESSAGES(f) && NOT_PUBLISHERS_GUIDE(f) }
];
```

Three properties to hold, each checkable:

1. **No rule's output contains any rule's input.** `contestant` contains no `candidate`, so a second run is a no-op. The dry run after `--apply` reporting 0 is the proof.
2. **The exemptions are structural, not listed.** No rule matches `get_candidate_user_data` (nothing matches the snake-case form) or `invite-candidate` (the URL rule requires `/candidate`, and `invite-candidate` has `-candidate`). Prove it once: `git grep -c 'get_candidate_user_data\|invite-candidate'` is identical before and after every `--apply` (51 / 15 and 73 / 32 today).
3. **The target namespace starts empty.** `git grep -i -c contestant -- ':!.planning'` matches no file today. After a plan it must equal the sum of that plan's reported rewrites — a cheap total check.

The spaced-phrase rule writes "Contestant App" for every case variant, which is what D-14 states. Three sub-forms need a ruling the decision does not give: sentence-case titles (`'Candidate app'` in `navigation.config.ts`, 35 / 29 tree-wide), the hyphenated compound (69 case-insensitively: 37 slugs or template keys, 31 adjectival prose such as "the candidate-app login form", and the DOM id `'candidate-app-menu'` that the header's `aria-controls` points at — applying the spaced rule to any of the first group would write a space into a path), and "Candidate Application" / "candidate application". See *Open Questions* 6.

### Pattern 2: The move list is derived from the mapping

**What:** `rename.mjs --moves --plan N` applies the path rules and the directory-fragment text rules to every tracked *path* and prints `old<TAB>new` for each one that changes. The executor runs `git mv` over that list. No move is typed by hand, and none is inferred from similarity.

**When to use:** Before every pure-move commit.

**What is safe with `git mv`, measured in a scratch repository on this host's git:**

- A directory move followed by file renames inside it, staged together, is reported as one exact rename per file: `R100 a/candidate/candidateCtx.ts a/contestant/contestantCtx.ts`. `git log --follow` then walks through the move.
- Exact renames are found at `diff.renameLimit=1`. The limit bounds only "the exhaustive fallback portion" [CITED: git-scm.com/docs/git-diff, `-l<num>`]; identical blobs are paired before it applies.
- An empty file (`tests/tests/specs/candidate/.gitkeep`) moves as `R100` like any other. Git may cross-pair *identical* blobs among themselves; that is cosmetic and does not break the all-`R100` check.
- A destination that exists cannot be a move. `routes/api/auth/logout/+server.ts` exists, so the logout merge is `git rm` of the old file plus an edit of the surviving one, in its own commit (D-16, R4).
- `git mv` removes a source directory only when it is left empty. An untracked leftover (`.DS_Store`, a stale generated file) keeps the old directory alive on disk, where `routeConsistency.test.ts`'s filesystem walk will find it. After each move: `test ! -e <old directory>`.
- This worktree has `core.hooksPath=/dev/null` set in its own config, so a commit that does not build is not blocked by the husky hook.

**The three API moves of plan 2**, spelled out because the destinations differ:

```bash
mkdir -p apps/frontend/src/routes/api/contestant
git mv apps/frontend/src/routes/api/candidate/auth/callback apps/frontend/src/routes/api/auth/callback
git mv apps/frontend/src/routes/api/candidate/preregister   apps/frontend/src/routes/api/contestant/preregister
# The logout handler is NOT moved here. It leaves in the merge commit, with git rm.
```

After the merge commit `apps/frontend/src/routes/api/candidate/` must not exist.

### Pattern 3: Keep the pure-move commit pure

**What:** A pure-move commit changes paths and nothing else. It is verified before it is made, and its message says it does not build and names the commit that completes it.

**Example:** see *Code Examples* § *Pure-move check*.

**What must stay out of it:** the in-file top-level key of the 119 catalogue files (it must change in the *content* commit, even though the generator rejects the tree in between); the `toHaveScreenshot` arguments; import specifiers; the `project.inlang` list. The tree between the two commits is expected to be red.

**The generated docs pages are not moves.** The eight pages under `generated/candidate/…` are deleted and re-created by `move-generated.ts`; they belong to plan 4's content commit, not to a pure-move commit.

### Pattern 4: The D-18 gate is built first and wired last

**What:** Write `scripts/assert-no-candidate-app-names.mjs` in plan 1, with a `--report` mode that prints findings without failing and a `--only <group>` selector. Each plan uses it to drive its residue pass. Plan 4 adds it to `lint:check`.

**Why:** the residue pass of D-15 needs the gate's output from plan 1 on, while the gate cannot be green — and so cannot be in `lint:check` — until plan 4.

**The gate cannot avoid naming what it forbids.** Its own source spells every old name, and so do its negative-control fixtures. D-18 allows `.planning/` and two named lines as exemptions and nothing else. Two ways to stay inside that:

- Exclude the gate's own two paths (`scripts/assert-no-candidate-app-names.mjs` and `scripts/fixtures/assert-no-candidate-app-names.*`) *structurally* — a self-exclusion every text gate of this shape needs, stated in the header, distinct from the exemption list.
- Or assemble the patterns so the source never contains them (`'candidate' + 'App'`), which keeps the file scannable but makes the pattern list — the thing a reviewer reads — harder to read.

The first is the house precedent in spirit (`assert-comment-hygiene.mjs` excludes its fixtures through `.prettierignore` and names vendored files it skips). Recommend the first, and have the header say it in one sentence. The planner should treat this as a point to state in the plan, since it reads against the letter of D-18.

**The negative control, recorded:** `--self-test` runs the gate over the planted fixture and compares with the committed `.violations` file; the plan summary records the command and its exit code for both the clean tree (0) and a planted name in a real path (1), then the revert (0).

### Anti-Patterns to Avoid

- **A blind `s/candidate/contestant/`.** 8,123 occurrences, of which the app-level ones are a minority. Every rule is anchored.
- **Rename detection as evidence.** "git shows it as a rename" proves nothing at the default 50% similarity. Only `-M100%` with every row `R100` does.
- **Hand-editing a generated file.** `translationKey.ts`, `src/lib/paraglide/**`, the generated docs pages, `navigation.config.ts`'s generated parts, `migrations/00001_initial_schema.sql`.
- **Reading a gate through a pipe.** `yarn lint:check | tail` reports `tail`'s status. `lint:check` is also a 19-link `&&` chain: a red early link hides every later one, so a red run is not one failure but an unknown number.
- **Trusting a warm dev server after a directory move.** Restart it; `yarn dev:clean` first. The wrapper does both.
- **Applying the prose rule to the message catalogues or to the publishers' guide.**
- **`supabase stop --all`.** It stops every local Supabase instance on the machine. Use `yarn db:stop`.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Running the E2E suite | A `yarn dev` in one terminal and `yarn test:e2e` in another | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` | It spawns and owns one fresh dev server scoped to the project the suite seeds, runs `yarn dev:clean` first, and asserts a positive preflight verdict. A plain `yarn dev` serves the default project. |
| Deciding a run's verdict | Reading the Playwright summary line | `node tests/scripts/e2e-evidence.mjs <run-dir> --note <label>` then `summary.json` `counts` | "did not run" is a failure here, and the summary line does not always show it. |
| Regenerating the translation-key type | Find-and-replace inside `translationKey.ts` | `yarn workspace @openvaa/frontend generate:translation-key-type` | The generator sorts; the order changes. |
| Mirroring SQL comments into the migration | Editing `00001_initial_schema.sql` | `yarn schema:regenerate` | The parity gate is a byte comparison against `cat schema/*.sql`. |
| Component docs for the moved library | Moving the eight generated pages | `yarn workspace @openvaa/docs generate:docs` after editing `docs-scripts.config.ts` and `generate-component-docs.ts` | The generator clears and rewrites the destination. |
| Proving the allowlist | Reading `config.toml`, or a green suite | The `GET /auth/v1/verify` probe, plus `docker inspect … GOTRUE_URI_ALLOW_LIST` | The suite never exercises the list (Pitfall 10). |
| The visual run on macOS | `PLAYWRIGHT_VISUAL=1 yarn test:e2e` on the host | `tests/scripts/visual-container.sh` | Host rasterisation differs; the baselines are Linux/x86_64. |
| The bank-auth runs | `PLAYWRIGHT_BANK_AUTH=1` on the default wrapper call | `tests/IDURA-TEST-RUNBOOK.md` § *Deterministic E2E run* (E-1…E-4) and § *Full-browser journey* (B-1…B-3) | They need the IdP environment in the dev server's own process and the `identity-callback` function served with the test JWKS. |
| A gate's file set | `find` or a glob | `execFileSync('git', ['ls-files', '-z'])` | Tracked files only; the house pattern. |

**Key insight:** in this repository almost every "how do I check X" already has an instrument that was built after the naive check gave a false green. The work of this phase is choosing the instrument, not building one — with two exceptions, the codemod and the D-18 gate, both of which have a close precedent to copy.

## Runtime State Inventory

The canonical question: after every file in the repository is updated, what still holds the old string?

| Category | Items found | Action required |
|----------|-------------|-----------------|
| **Stored data** | (1) `app_settings.settings` JSONB rows hold `access.candidateApp`, `notifications.candidateApp`, root `candidateApp`; `app_settings.customization` may hold `candidateAppFAQ`, `candPoster`. Present wherever a template has been seeded — the E2E project (`…0000e2`) from earlier runs, the default project if `db:seed --template default` or a perm template was run. (2) Browser storage in any developer's or test browser under the four keys of § *Contexts and browser storage*. | (1) **No data migration** (D-07; nothing is deployed). The E2E project heals itself: every template seed REPLACEs `settings` and asserts exact equality. A default-project row with old keys is read as if the keys were absent — *silently*; `yarn db:reset` is the remedy for a developer who needs it. State this in the phase summary. (2) **No migration** (D-03). Old keys are orphaned in place. |
| **Live service config** | The local auth service's redirect allowlist. Measured on the running stack: `docker inspect supabase_auth_openvaa-local` shows `GOTRUE_URI_ALLOW_LIST=https://127.0.0.1:3000,http://localhost:5173/api/candidate/auth/callback,http://localhost:5173/*/api/candidate/auth/callback` — the list is **baked into the container's environment at start**. No hosted project exists (nothing is deployed), so no dashboard holds a copy. | Edit `config.toml`, then `yarn db:stop && yarn db:start`. A `yarn db:start` on a stack that is already running leaves the existing container and its environment in place [ASSUMED: not exercised here, because the stack is shared], and `e2e-run.sh --no-db-reset` calls exactly that. So the restart is an explicit step, verified with the probe and with `docker inspect`, not something the wrapper does. |
| **OS-registered state** | None. No launchd, cron, pm2 or systemd registration names the app. `git grep -l -i -E "launchd\|systemd\|pm2\|crontab" -- ':!.planning' ':!*.md'` returns two incidental byte matches (the vendored Yarn release and an SVG) and no registration; the stack is Docker containers named for the project id `openvaa-local`, not for the app (`docker ps`). | None. |
| **Secrets and env vars** | None carries the name. `.env.example` and `apps/supabase/supabase/functions/.env.example` mention "candidate" only in comments about the entity. The variables the phase's code reads (`SITE_URL`, `PUBLIC_PROJECT_ID`, `FRONTEND_PORT`, the IdP set) are unchanged. The external identity provider's registered redirect URI is `/api/oidc/callback`, which does not move. | None. (`.env` itself was not read; the variable names come from `.env.example`.) |
| **Build artefacts and generated output** | (1) `apps/frontend/src/lib/paraglide/**` — gitignored, holds 159 `"candidateApp.…"` exports. (2) `apps/frontend/.svelte-kit/` — generated route types under `types/src/routes/candidate/…` and the generated `tsconfig.json` that carries the `$candidate` alias. (3) `apps/frontend/node_modules/.vite` — the dev server's module cache. (4) `packages/app-shared/dist` — the built settings the frontend resolves at run time. (5) `.turbo/` task caches. (6) `apps/frontend/build/` if a production build was made. (7) Playwright storage states under `tests/playwright/.auth/` — hold cookies and local storage for the old origin paths; re-minted per run. (8) Old directories kept alive by untracked files. | (1) recompiled by `dev`, `build` or `paraglide:compile`. (2)(3) `yarn dev:clean`, then `svelte-kit sync` (every `typecheck` / `check` / `build` script runs it). (4) `yarn build` before anything that runs the frontend — a stale `dist` keeps serving the old keys. (5) `TURBO_FORCE=true` on gate runs. (6) rebuilt by the build gate. (7) nothing. (8) `test ! -e` after each move. |

## Common Pitfalls

Each was found on the tree. Pitfalls 1–10, 12–14 and 17 are names or couplings CONTEXT.md does not carry; 11, 15 and 16 sharpen ones it does; 18 is about the host's tools.

### Pitfall 1: Three standing gates hard-code the names, not two

**What goes wrong:** Fact 10 names `assert-i18n-catalog-namespaces.mjs` and `assert-a11y-scan-wiring.mjs`. A third, `scripts/assert-no-session-in-loads.mjs`, lists `path.join('candidate', '+layout.server.ts')` among its `ANCHOR_FILES` [VERIFIED: scripts/assert-no-session-in-loads.mjs:106-111]. When the route tree moves, the anchor is no longer in the corpus and the gate fails — inside `lint:check`, in plan 2.
**Why it happens:** the path is assembled from segments, so `routes/candidate` never appears as a string and no listed pattern finds it.
**How to avoid:** plan 2 edits the anchor in the content commit. The other two gates are edited by pattern: `{ label: 'candidateApp.*', prefix: 'candidateApp.', floor: 60 }` and `const requiredKeys = ['candidateApp.questions.editAnswer', 'common.required'];` [VERIFIED: scripts/assert-i18n-catalog-namespaces.mjs:62-65 and 147] in plan 1; the a11y gate's `CANDIDATE_A11Y_SPEC` path [VERIFIED: scripts/assert-a11y-scan-wiring.mjs:70] and its checks on the project name `'candidate-a11y-scan'` and on the spec's `testMatch` in plan 3. **D-17 puts "the two scripts of fact 10" in plan 1, but the a11y gate asserts names D-12 renames in plan 3**; it must change with them or `lint:check` is red at the end of plan 1 or of plan 3.
**Warning signs:** `yarn lint:check` red with a message from a gate nobody edited. Because the chain is `&&`, every later link is then unreported.

### Pitfall 2: An app-level name that looks exactly like the entity type

**What goes wrong:** `export type AppType = 'admin' | 'candidate' | 'voter' | undefined;` [VERIFIED: apps/frontend/src/lib/contexts/app/appContext.type.ts:114-117]. The value is set by `appType.set('candidate')` in the app's root layout and read by `appType.current === 'candidate'` in `Banner.svelte`, `EntityOpinions.svelte` and `QuestionHeading.svelte`, plus one test fixture. It says *which app*, so by the phase's own line it is renamed — and it is spelled identically to the entity type that appears thousands of times.
**Why it happens:** no pattern on the string can tell them apart; only the `appType` context can.
**How to avoid:** rule it explicitly (*Open Questions* 1). If renamed, the edit is six sites found by `git grep -n -P "appType[^\n]{0,40}['\"]candidate['\"]|'admin' \| 'candidate'" -- apps/frontend/src`, done by hand or by a rule scoped to those files. The type check then proves completeness: with the union changed, a missed comparison is a compile error.
**Warning signs:** none at run time if it is left — which is exactly why it would survive into Phase 171.

A neighbour that is **not** app-level and must stay: `export type UserRole = 'candidate' | 'admin'` in `dataWriter.type.ts`, the coarse role derived from an entity grant (`target_type: 'candidate'`).

### Pitfall 3: The alias is declared twice and consumed by a third tool

**What goes wrong:** `svelte.config.js` is edited, the app builds, and the unit suite fails to resolve `$contestant/…`, or the docs generator silently documents nothing.
**How to avoid:** the three sites of § *The alias, in three places* change in plan 1's content commit. The docs generator's `join(…, 'lib', 'candidate', 'components')` and its two `categorySubdir = 'candidate/components'` branches are code, not prose, and are missed by the path-fragment patterns.
**Warning signs:** `Failed to resolve import "$contestant/…"` in Vitest only; a `generate:docs` run that warns "Source path not found" and leaves the old pages in place (`move-generated.ts` keeps a committed destination when the source is missing).

### Pitfall 4: The ESLint adapter-boundary allowlist is keyed on file paths

**What goes wrong:** `ADAPTER_BOUNDARY_ALLOWLIST` in `apps/frontend/eslint.config.mjs` names five files this phase moves — the callback, the live logout handler, `candidate/(protected)/+layout.server.ts`, `candidate/login/+page.server.ts` and the `preregister` handler [VERIFIED: apps/frontend/eslint.config.mjs:29-43]. After the move those files are no longer allowlisted, and `turbo run lint` reports real violations in files nobody changed.
**The test beside it is sharper still.** `eslint-adapter-boundary-guard.test.ts` probes `'routes/candidate/(protected)/+layout.server.ts'` as an allowlisted *virtual* path and calls `eslint.lintFiles([probePath])` on the **real** file `routes/candidate/preregister/+layout.server.ts`. After the move the first probe starts firing (the path is no longer on the list) and the second has no file to lint.
**How to avoid:** the path-fragment rules of plan 2 rewrite all of these, in the config and in the test, in the same commit as the move's content. The logout entry is removed in the merge commit, and the block's "nine" becomes "eight" in the two places it is spelled out.
**Warning signs:** lint errors mentioning "Supabase packages are banned outside the adapter" in a route file after a move.

### Pitfall 5: Paths assembled from segments, and one relative import

**What goes wrong:** two code sites build a path with `join(…, 'candidate', …)` (Pitfalls 1 and 3), and `apps/frontend/src/routes/admin/layout.server.test.ts` imports `from '../candidate/+layout.server'`. None contains `routes/candidate`.
**How to avoid:** add the two forms to the mapping for plan 2 (`join\([^\n]*['"]candidate['"]` at two named files; `'\.\./candidate/` at one) and to the gate (R19). Re-derive: `git grep -n -P "join\([^\n]*['\"]candidate['\"]" -- ':!.planning'` and `git grep -n -P "['\"]\.{1,2}/candidate['\"/]" -- apps tests packages`.
**Warning signs:** a unit test that fails to import; a gate precondition failure.

### Pitfall 6: The prose rule reaches user-facing text

**What goes wrong:** D-14's phrase substitution, run over every tracked file, rewrites two base-locale message values ("…the Candidate Application." and "Candidate Application Not Available") and 26 occurrences in the publishers' guide that D-14 leaves to Phase 171.
**How to avoid:** the *spaced-phrase* rule carries two path exclusions, `apps/frontend/messages/**` and `**/publishers-guide/**`. D-19's catalogue identity check is the proof for the first. For the second, `git diff -- 'apps/docs/src/routes/(content)/publishers-guide'` after plan 4 shows exactly two kinds of edit and no prose: the settings keys of D-07 (`access.candidateApp` and its siblings are documented in `app-settings/+page.md` and *are* renamed), and that page's one link to `/developers-guide/candidate-app/bank-authentication`, which must follow the docs move or it breaks. The exclusion is for the phrase, not for the directory.
**Warning signs:** the identity check reporting a changed value; a publishers'-guide diff that touches prose.

### Pitfall 7: SQL comments are mirrored byte for byte

**What goes wrong:** the prose sweep edits a comment in `schema/106-app-settings.sql` or `schema/302-rls.sql`, and `assert:schema-migration-parity` fails because `migrations/00001_initial_schema.sql` no longer equals `cat schema/*.sql`.
**How to avoid:** `yarn schema:regenerate` after the codemod, or let the codemod apply the identical substitution to both — then prove it with `node scripts/assert-schema-migration-parity.mjs; echo $?`. This is a comment-only change: no `db:reset`, no `db:types`. D-09's "no schema edit" is about the RPC; it does not forbid a comment.
**Warning signs:** the parity gate's census showing different line counts or a first differing byte.

### Pitfall 8: The names get longer, so formatting and import order move

**What goes wrong:** `ContestantApp` is five characters longer than `CandApp` and `contestantCtx` six longer than `candCtx`. Lines cross Prettier's width and are reflowed; Markdown tables are re-aligned; and `simple-import-sort/imports` (an error in the shared config) reorders imports, because `$lib/contestant/…` now sorts *after* `$lib/components/…` and `$lib/contexts/contestant` after `$lib/contexts/component…`, where the `candidate` spellings sorted before them.
**How to avoid:** `yarn lint:fix` then `yarn format` after every `--apply`, before the gates. Expect the content commit to carry reflow and reordering noise beyond the substitutions; say so in its message. Do **not** list these commits in `.git-blame-ignore-revs`: that file's own rule is "Only formatting-only commits belong here", and a rename is not one.
**Warning signs:** `yarn format:check` or `turbo run lint` red on files where the only edit was a substitution.

### Pitfall 9: Byte-exact fixtures and dead tooling sit inside the scan

**What goes wrong:** `.claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.{input,expected}.ts` each hold `candidateContext` in a comment, and `hygiene-codemod.mjs --self-test` asserts whole-file equality between the transformed input and the expected file. The two one-shot codemods under `apps/frontend/scripts/` and the spike sources under `.claude/skills/spike-findings-…/sources/` carry old names in their own rename tables and snapshots.
**How to avoid:** the substitution is safe for the fixture pair as long as it lands in *both* halves identically; confirm with `node .claude/skills/ship-review-stack/sources/hygiene-codemod.mjs --self-test; echo $?` (0 today). For the dead tooling there are only two options inside D-18's exemption list — rewrite it mechanically, leaving historical tables that name things that never existed, or delete it — and the decision belongs to the planner or the operator (*Open Questions* 7).
**Warning signs:** the self-test failing after plan 1; the gate reporting findings in files that are not part of the application.

### Pitfall 10: The E2E suite never exercises the redirect allowlist

**What goes wrong:** the allowlist is edited wrongly — or not at all — and every gate stays green.
**Why it happens:** two mechanisms, both measured. (1) The auth service compares the redirect's *hostname* with `site_url`'s and allows a match outright, before it consults the list; `site_url` is `http://127.0.0.1:5173`. The suite's two `redirectTo` strings are built as `SUPABASE_URL.replace('54321', '5173')`, i.e. on `127.0.0.1` [VERIFIED: tests/tests/utils/supabaseAdminClient.ts:672-674]. (2) `toCallbackUrl` rewrites the mailed verify link into a direct callback URL, "bypassing the Supabase redirect". So the list's two `localhost` entries are never matched by a test.
**How to avoid:** criterion 2's allowlist clause is verified by the probe in *Code Examples*, which was run on the live stack for this research. Before the change it shows the two `candidate` URLs echoed back and the neutral URLs rejected; after the change and the restart it must show the reverse. Record both outputs.
**Warning signs:** none. That is the pitfall.

### Pitfall 11: The allowlist is container state, and restarting has sharp edges

**What goes wrong:** `config.toml` is edited and nothing changes, or the wrong thing is stopped.
**How to avoid:**
- Restart with `yarn db:stop && yarn db:start` (the workspace scripts run `supabase stop` and `supabase start` for the project `openvaa-local`). `supabase stop` keeps the data unless `--no-backup` is given; `--all` "Stop[s] all local Supabase instances from all projects across the machine" [VERIFIED: `supabase stop --help`, CLI 2.118.0]. Never pass either.
- At research time exactly one Supabase stack was running (`docker ps` shows only `…_openvaa-local` containers). Fact 21's second stack was not up; check again before the restart rather than assuming either way.
- Confirm the new list reached the service: `docker inspect supabase_auth_openvaa-local --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^GOTRUE_URI_ALLOW_LIST='`.
- Edit the two Edge Function `redirectTo` strings *before* the restart, in the same plan. The edge runtime bind-mounts this worktree's `functions/` directory (measured), so a source edit is visible to the container; whether a running worker picks it up without a restart was not tested [ASSUMED], and the restart makes the question moot.
- A killed or interrupted run after the restart leaves the stack up; the wrapper only starts it.
**Warning signs:** the probe still echoing a `candidate` URL after the edit.

### Pitfall 12: URL literals come in three spellings

**What goes wrong:** the gate's `/candidate/` pattern passes while `'candidate/profile'` and `'candidate%2Fprofile'` remain in three unit test files, and those tests then assert against a path that no longer exists — and still pass, because they test string handling, not routing.
**How to avoid:** rules and gate patterns for the slashless and percent-encoded forms (R18), with the eleven prose forms allowlisted. Also the regex-literal spelling `\/candidate` in specs, which the `/candidate` rule does match because the string `/candidate` is inside it.
**Warning signs:** unit tests green with `candidate/` still in their fixtures after plan 2.

### Pitfall 13: Test ids outside the registry, and baselines that re-create themselves

**What goes wrong:** (a) `testIds.ts` is updated and nine ids used as raw strings in fixtures and one spec are missed, so those locators find nothing. (b) A baseline file and its `toHaveScreenshot` argument are renamed out of step, and Playwright writes a fresh baseline instead of comparing.
**How to avoid:** (a) drive the test-id rule from the stem pattern R8 over the whole tree, not from `testIds.ts`. (b) rename the two PNGs in the pure-move commit and the two arguments in the content commit; then check the blob ids and that `__screenshots__/` has no untracked file after the visual run (§ *Research-open (b)*).
**Warning signs:** an E2E timeout on `getByTestId('candidate-…')`; `git status` showing a new PNG.

### Pitfall 14: A negative test that goes vacuous

**What goes wrong:** `appGates.test.ts` holds `const CANDIDATE_SIBLING_PREFIX_ROUTE_IDS = ['/candidate-portal', '/candidates'];` — route ids that merely *start with* the app's root and must **not** be claimed by its gate. Once the root is `/contestant`, those two ids are trivially unclaimed and the test proves nothing.
**How to avoid:** in plan 2 the probes become `'/contestant-portal'` and `'/contestants'`. The first is caught by a pattern (R21); the second, `'/candidates'`, is spelled like the entity plural and can only be changed by hand.
**Warning signs:** none; the test stays green either way.

### Pitfall 15: Stale output survives a directory move

**What goes wrong:** a gate is green or red for a reason that is not in the source.
**How to avoid:**
- **Node.** The default `node` in a non-interactive shell on this host is v24.14.1; the floor is `>=24.15.0`. `assert:node-engine` fails under it (measured: exit 1), and it is a link in `lint:check` and the `preinstall` hook. Every command block starts with `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"` — shell state does not persist between tool calls.
- **`.svelte-kit/` and the Vite cache.** `.svelte-kit/types/src/routes/candidate/` and a generated `tsconfig.json` carrying `$candidate` exist now. `yarn dev:clean` removes both; every `typecheck`, `check` and `build` script runs `svelte-kit sync` first.
- **`@openvaa/app-shared`'s `dist`.** The frontend resolves the built package. After D-07 edits the settings keys, `yarn build` comes before anything that runs the frontend.
- **Turbo.** Use `TURBO_FORCE=true` for gate runs, as the Phase 169 gate script does on the stated ground that turbo does not hash the Node version or the shared base configs.
- **The dev server.** One fresh server per E2E run. The wrapper spawns its own and refuses to adopt a listener; `strictPort` makes a held port fail loudly.
- **Old directories.** `test ! -e apps/frontend/src/routes/candidate` and its siblings after each move. At research time none of the directories to be moved holds an untracked or ignored file, so `git mv` will remove them cleanly unless one appears.
**Warning signs:** type errors naming a path that no longer exists; a preflight failure; `routeConsistency.test.ts` finding a protected group nobody declared.

### Pitfall 16: A missed message key renders as itself

**What goes wrong:** `t()` returns the key when no compiled message exists, so a missed call site shows `candidateApp.home.title` on the page and throws nothing.
**How to avoid:** the type check is the gate (`TranslationKey` is regenerated from the renamed catalogue, so an old literal no longer type-checks), and the candidate a11y scan's raw-key detection is the backstop on the pages it visits. Regenerate the type **after** both the file moves and the in-file key edits; the generator throws on either half alone.
**Warning signs:** `svelte-check` errors of the form "Argument of type '"candidateApp.…"' is not assignable to parameter of type 'TranslationKey'".

### Pitfall 17: Renaming the two auth keys twice

**What goes wrong:** plan 1's `CandApp` → `ContestantApp` rule turns `CandAppAuthCallback` into `ContestantAppAuthCallback`, which R1 says must not exist, and plan 2 then renames it again.
**How to avoid:** plan 1's rule excludes the pair (`CandApp(?!Auth(Callback|Logout))`); plan 2 renames them once, to `AuthCallback` and `AuthLogout`, with the paths. Neither target occurs anywhere today, so there is no collision.
**Warning signs:** `ContestantAppAuth` anywhere in the tree.

### Pitfall 18: BSD regular expressions in ad-hoc commands

**What goes wrong:** a count or a residue check written with `git grep -E '…\b'` reports zero on this host and is read as "clean"; a `sed` substitution using `\|` for alternation silently matches nothing.
**How to avoid:** `git grep -P` for word boundaries (measured: `/candidate\b` returns 0 occurrences with `-E` and 503 with `-P`). For substitutions outside the codemod use `perl -pi -e`, not `sed -i ''` (measured while validating the identity script: a BSD `sed` rule with `\(A\|B\)` left all four `dynamic` groups unrenamed and reported no error — the identity check is what caught it). The gate and the codemod run in Node and are unaffected; the hazard is in verification one-liners inside plans.
**Warning signs:** a zero that is too good.

## Code Examples

### The gate set, each status read directly

```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
export TURBO_FORCE=true
cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
D=tests/e2e-runs/170-gates/<label>; mkdir -p "$D"; FAILED=0
run() { local n="$1"; shift; "$@" > "$D/$n.log" 2>&1; local s=$?; printf '%s\t%s\n' "$n" "$s" >> "$D/summary.tsv"; [ "$s" -eq 0 ] || FAILED=1; }

run 01-build           yarn build
run 02-typecheck       yarn typecheck
run 03-lint            yarn lint:check
run 04-format          yarn format:check
run 05-check-frontend  yarn workspace @openvaa/frontend check
run 06-check-docs      yarn workspace @openvaa/docs check
run 07-unit            yarn test:unit
run 08-build-frontend  yarn workspace @openvaa/frontend build
run 09-docs-links      yarn workspace @openvaa/docs validate:links --check
run 10-pgtap           yarn workspace @openvaa/supabase test:db     # needs the stack up
cat "$D/summary.tsv"; exit "$FAILED"
```

Every gate runs even after a red one, which is the point: `lint:check` alone is a 19-link `&&` chain [VERIFIED: package.json:51] and stops at its first failure. The shape is `169-gates.sh`'s. Observed at HEAD `c74eb65ae` under Node 24.21.0 for this research: `yarn lint:check` exit 0 (32 s, warm cache), `yarn format:check` exit 0 (13 s), `yarn workspace @openvaa/frontend check` exit 0 ("2052 FILES 0 ERRORS 0 WARNINGS"), `yarn workspace @openvaa/docs validate:links --check` exit 0 ("Total findings: 0"). **Not run here**, because they write to or depend on the shared stack or are heavy: `yarn test:unit`, the two builds, pgTAP and the E2E suite. Their last recorded results are Phase 169's, from 2026-10-03 and 2026-10-04, before the last source commits on this branch: twelve gates green in `tests/e2e-runs/169-gates/169-rulings-r2/summary.tsv` (typecheck 18 s, lint 39 s, unit 31 s, build 14 s) and a default-suite run of **171 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run in 4.7 min** (`tests/e2e-runs/169-e2e/169-nodemailer-pin/summary.json`). They are context for sizing, **not a baseline for this HEAD**: plan 1 opens by running the full set once on the untouched tree and recording it. A full gate set plus one E2E run is about eight minutes — cheap enough to run at every plan boundary, as D-17 requires.

A fast loop for the route work, measured at 2 s:

```bash
yarn workspace @openvaa/frontend test:unit src/lib/routes/route.test.ts src/lib/routes/routeConsistency.test.ts src/lib/routes/appGates.test.ts
```

### One E2E run and its verdict

```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
R=tests/e2e-runs/170-0N-e2e          # a new directory per run; never overwrite evidence
tests/scripts/e2e-run.sh --run-dir "$R" --no-db-reset > "$R.wrapper.log" 2>&1; s=$?
node tests/scripts/e2e-evidence.mjs "$R" --note 170-0N; ev=$?
node -e 'const c=require(require("path").resolve(process.argv[1],"summary.json")).counts;
  console.log(c); process.exit(c.failed||c.flaky||c.didNotRun||!c.total||!c.passed?1:0)' "$R"; v=$?
echo "wrapper=$s evidence=$ev verdict=$v"     # all three must be 0
```

Wrapper exit codes worth branching on: 5 the port was held or the server never listened, 6 no positive preflight verdict, 130 interrupted. The default port is 5273 (`FRONTEND_PORT`), not 5173. `169-e2e.sh` adds two guards worth copying: `docker builder prune -af` first, and a refusal below 13.8 GiB free in the Docker VM (29.6 GiB free at research time).

### Pure-move check (verified in a scratch repository on this host)

```bash
# After the git mv calls, before committing:
git -c diff.renameLimit=1 diff --cached -M100% --name-status | awk '$1 != "R100"'   # must print nothing
git diff --cached -M100% --shortstat                                              # "N files changed, 0 insertions(+), 0 deletions(-)"
```

Observed output of the first command's unfiltered form on a directory move with one file also renamed inside it:

```
R100	a/candidate/.gitkeep	a/contestant/.gitkeep
R100	a/candidate/candidateCtx.ts	a/contestant/contestantCtx.ts
R100	a/candidate/logout.ts	a/contestant/logout.ts
R100	a/candidate/x/f1.ts	a/contestant/x/f1.ts
 4 files changed, 0 insertions(+), 0 deletions(-)
```

### The redirect-matcher probe (zero side effects; run on the live stack for this research)

A `GET /auth/v1/verify` with a deliberately invalid token and the `redirect_to` under test. The service answers 303 either to the requested URL (allowed) or to `site_url` (rejected). No email is sent and no user is touched.

```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
KEY="$(cd apps/supabase && yarn supabase status -o env 2>/dev/null | grep -E '^ANON_KEY=' | cut -d= -f2- | tr -d '"')"
probe() { loc="$(curl -sS -o /dev/null -D - --max-time 10 -G "http://127.0.0.1:54321/auth/v1/verify" \
    --data-urlencode "token=deadbeefdeadbeef" --data-urlencode "type=recovery" \
    --data-urlencode "redirect_to=$1" -H "apikey: $KEY" | tr -d '\r' | grep -i '^location:' \
    | sed -E 's/^[Ll]ocation: //; s/[#?].*$//')"; printf '%-58s -> %s\n' "$1" "$loc"; }
for u in api/candidate/auth/callback fi/api/candidate/auth/callback api/auth/callback fi/api/auth/callback fi/en/api/auth/callback; do
  probe "http://localhost:5173/$u"; done
probe "http://evil.example.com/api/auth/callback"
```

**Measured before the change** (auth image `gotrue:v2.197.0`, container started 2026-10-04):

```
http://localhost:5173/api/candidate/auth/callback          -> http://localhost:5173/api/candidate/auth/callback
http://localhost:5173/fi/api/candidate/auth/callback       -> http://localhost:5173/fi/api/candidate/auth/callback
http://localhost:5173/api/auth/callback                    -> http://127.0.0.1:5173
http://localhost:5173/fi/api/auth/callback                 -> http://127.0.0.1:5173
http://localhost:5173/fi/en/api/auth/callback              -> http://127.0.0.1:5173
http://evil.example.com/api/auth/callback                  -> http://127.0.0.1:5173
```

Both directions are observed, so the instrument is live. **Required after the change and the restart:** rows 1 and 2 answer `http://127.0.0.1:5173` (rejected — "no `candidate/` URL"), rows 3 and 4 echo their own URL, rows 5 and 6 stay rejected. Row 5 is what shows the wildcard is still a single segment, which the official description supports: "`*` matches any sequence of non-separator characters" where "the separator characters in a URL are defined as `.` and `/`" [CITED: supabase.com/docs/guides/auth/redirect-urls].

Use `localhost`, not `127.0.0.1`, in every probed URL: any path on `127.0.0.1` is allowed by the hostname short-circuit and would tell nothing.

### The catalogue identity check (D-19 (i))

```js
// catalogue-identity.mjs <before-dir> <after-dir>   — both hold messages/<locale>/*.json
// Snapshot "before" with: git archive <pre-phase-commit> apps/frontend/messages | tar -x -C <before-dir>
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const mapKey = (k) => k.replace(/^candidateApp\./, 'contestantApp.').replace(/^dynamic\.candidateApp/, 'dynamic.contestantApp');
const isVariant = (v) => 'declarations' in v || 'selectors' in v || 'match' in v;
function flatten(tree, prefix, out) {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && !isVariant(v)) flatten(v, key, out);
    else out.set(key, JSON.stringify(v));          // byte-level value identity, variants included
  }
  return out;
}
const load = (root, locale) => {
  const out = new Map();
  for (const f of readdirSync(path.join(root, locale))) if (f.endsWith('.json'))
    flatten(JSON.parse(readFileSync(path.join(root, locale, f), 'utf8')), '', out);
  return out;
};
let bad = 0;
for (const locale of ['da', 'en', 'et', 'fi', 'fr', 'lb', 'sv']) {
  const before = load(process.argv[2], locale), after = load(process.argv[3], locale);
  for (const [k, v] of before) if (after.get(mapKey(k)) !== v) { bad++; console.error(`${locale} ${k}: value changed or key missing`); }
  if (before.size !== after.size) { bad++; console.error(`${locale}: ${before.size} keys before, ${after.size} after`); }
  console.log(`${locale}: ${before.size} keys compared`);
}
process.exit(bad ? 1 : 0);
```

Expected: `595 keys compared` for each of the seven locales, exit 0. Its negative control is one edited value in a scratch copy of the "after" directory (exit 1), recorded beside the green run.

### The merged logout handler and its unit test (the one behaviour change)

The surviving file is `apps/frontend/src/routes/api/auth/logout/+server.ts`. Every element below is quoted from one of the two existing handlers; nothing is new.

```ts
import { json } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Server-side logout endpoint for Supabase auth.
 *
 * Calls `signOut` on the server Supabase client so that httpOnly session cookies are cleared via the `setAll` callback in `createSupabaseServerClient`. Client-side `signOut` alone cannot remove httpOnly cookies.
 *
 * The scope is deliberately local: this clears the session on this device only and leaves the user's other sessions alone.
 *
 * @returns A json `Response` with a `DataApiActionResult`.
 */
export async function POST({ locals }: RequestEvent): Promise<Response> {
  await locals.supabase.auth.signOut({ scope: 'local' });
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
```

```ts
// +server.test.ts beside it — a sketch; the mocking idiom is the planner's to match to the nearest existing
// route test (routes/api/candidate/preregister/preregisterUpstreamStatus.test.ts).
import { describe, expect, it, vi } from 'vitest';
import { POST } from './+server';

describe('POST /api/auth/logout', () => {
  it('signs out this session only and answers a DataApiActionResult', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const response = await POST({ locals: { supabase: { auth: { signOut } } } } as never);
    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
    expect(await response.json()).toEqual({ ok: true, type: 'success' });
  });
});
```

The scope assertion is the one that would have caught the merge going the other way, which is why it is the test's first line.

### The D-18 gate, in the house shape

```js
#!/usr/bin/env node
// scripts/assert-no-candidate-app-names.mjs — skeleton. Header to state: what the gate forbids and why,
// the pattern groups, the two exemption lines with their removing phases, the self-exclusion, usage, exit codes.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SELF = 'scripts/assert-no-candidate-app-names.mjs';
/** Structural, not an exemption: a text gate cannot avoid naming what it forbids. */
const SELF_PATHS = [SELF, 'scripts/fixtures/assert-no-candidate-app-names.'];
const SKIP = (f) => f.startsWith('.planning/') || f.startsWith('.yarn/') || SELF_PATHS.some((p) => f.startsWith(p));

/** Exactly two, each naming the phase that deletes it (D-09, D-10). */
const EXEMPT = [
  /get_candidate_user_data/g, // removed by Phase 173
  /invite-candidate/g //        removed by Phase 174
];

const PATTERNS = [
  { name: 'candidateApp', re: /candidateApp/g },
  { name: 'CandApp', re: /CandApp/g },
  // … the rest of the measured table, group by group
];

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean);
const findings = [];
for (const file of files) {
  if (SKIP(file)) continue;
  for (const { name, re } of PATTERNS) if (new RegExp(re.source).test(file)) findings.push(`${file}: path matches ${name}`);
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  if (text.includes('\u0000')) continue; // binary
  const masked = EXEMPT.reduce((t, re) => t.replace(re, (m) => ' '.repeat(m.length)), text);
  masked.split('\n').forEach((line, i) => {
    for (const { name, re } of PATTERNS) if (new RegExp(re.source).test(line)) findings.push(`${file}:${i + 1}: ${name}`);
  });
}
for (const f of findings) console.error(`[ERROR] ${SELF}: ${f}`);
console.log(`No-candidate-app-names guard — ${files.length} tracked file(s); ${findings.length} finding(s).`);
process.exit(findings.length ? 1 : 0);
```

Paths are scanned as well as contents, so a file left under an old name is a finding even if nothing refers to it. Masking the two exempt strings before matching is what lets `invite-candidate/` paths and `get_candidate_user_data` calls pass without a path-based exemption — a planted `candidateApp` inside `invite-candidate/index.ts` is still caught.

## State of the Art

| Old approach | Current approach in this repository | Since | Impact on this phase |
|--------------|-------------------------------------|-------|----------------------|
| `yarn dev` + `yarn test:e2e` in two terminals | `tests/scripts/e2e-run.sh` owns the server and the evidence directory | v2.14–v2.15 | The only trusted E2E signal; `--no-db-reset` is safe because the suite owns its project. |
| Visual baselines compared on the host | Compared inside the pinned linux/amd64 Playwright image | v2.15 | The macOS host is not an obstacle (§ *Research-open (b)*). |
| A signature-based schema/migration comparison | A byte comparison against one folded migration | Phase 162 | A comment edit must be mirrored. |
| Locale as a route parameter | Paraglide's `url` strategy; no route constant carries a locale | earlier | The allowlist needs one unprefixed and one single-segment-wildcard entry, and the probe uses a locale prefix to test the second. |
| Two conditionals in the request hook | The `APP_GATES` table read by route id | Phase 158 | The hook needs no edit beyond renamed symbols. |

**Deprecated or stale, and relevant:** the doc comment in `assert-i18n-catalog-namespaces.mjs` quotes 598 keys and 161 `candidateApp.*`; the script's own output is 595 and 159. D-21 does not ask for this to be fixed, and the rename does not make it more wrong.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | `yarn db:start` on an already-running stack does not recreate the auth container, so it does not apply an edited allowlist. | Runtime State Inventory; Pitfall 11 | Low: the plan restarts explicitly and verifies with `docker inspect` and the probe either way. |
| A2 | The CI `e2e-tests` and `e2e-visual` jobs may still not pass on a `ci-evidence/**` push; their current state was not observed. | Research-open (b) | Low: the local container channel is the plan; CI is a fallback. |
| A3 | `generate-navigation-config.ts` emits no "New"/"Removed" markers when the six route strings are rewritten before it runs. | Docs inventory | Low: a `git diff` of `navigation.config.ts` after `generate:docs` shows it immediately; clean up by hand if not. |
| A4 | The edge runtime serves edited function source without a container restart. | Pitfall 11 | None if the functions are edited before plan 2's restart, as recommended. |
| A5 | Playwright marks a test failed on the run in which it writes a missing snapshot. | Research-open (b); Pitfall 13 | Low: the blob-id and untracked-file checks do not depend on it. |
| A6 | The `AppType` value `'candidate'` should be renamed to `'contestant'`. | Pitfall 2; pattern R17 | Medium: if left, an app-level name survives into Phase 171 with no gate able to see it; if renamed against the operator's intent, six sites to revert. |
| A7 | `getCandidateUserData` and its two siblings are in D-04's scope (the 123/24 figure includes them). | Contexts inventory; pattern E1 | Medium: the alternative needs a look-ahead in the rule and an exemption-shaped carve-out in the gate. |
| A8 | `testIds.candidate`, the fixture page-object names (R10–R12) and the helper names (R15, R16) count as "app-level test names" under D-12. | Tests inventory | Low to medium: about 600 mechanical occurrences in `tests/`; leaving them is harmless but leaves the gate's test group empty. |
| A9 | `CandidateLoginError`, `CandidatePreregistrationError` and their constants are app-level. | Pattern R14 | Low: 19 occurrences in 5 files, all under `lib/candidate/utils/` and its importers. |
| A10 | `yarn workspace @openvaa/supabase test:db` is safe to run against a stack that an E2E run will use next. | Code Examples | Low: CI runs it on a fresh stack; locally, run it before the E2E run rather than during it. |
| A11 | The recorded host recipe for the container visual run (`db:reset`, seed `e2e/base`, dev server with the E2E project id) is the minimum; a run without the reset was not tried. | Research-open (b) | Low: follow the recorded recipe; it worked five times in Phase 169. |
| A12 | Turbo's task cache can replay a stale green after directory moves. | Pitfall 15 | None if `TURBO_FORCE=true` is used. |

## Open Questions (RESOLVED)

Each has a recommendation; none blocks planning, and 1–5 are the classification calls D-18 leaves to the planner.

**All eleven were resolved on 2026-10-05.** The orchestrator adopted every recommendation, with one exception: the operator overruled the third name of item 5, so the default login poster IS renamed. Each item below carries its resolution line; the rulings are recorded in `170-01-PLAN.md § rulings`, whose item numbers match the item numbers here.

1. **Is the `AppType` value `'candidate'` renamed?**
   - Known: it names the app; six sites; a typed union, so the compiler proves completeness.
   - Unclear: no decision mentions it.
   - Recommendation: rename to `'contestant'` in plan 1, by hand, and add R17 to the gate. Flag it in the plan as a research-found name.
   - **RESOLVED — ruling 1, plan 170-01:** renamed to `'contestant'` by hand at the six sites; the `AppType` forms are patterns of the gate's `symbols` group.

2. **Does D-04 rename `getCandidateUserData`?**
   - Known: fact 3's count includes it; the method wraps the exempt RPC; Phase 173 replaces both.
   - Unclear: whether a method named for the entity it returns is "app-level".
   - Recommendation: rename by the pattern (`getContestantUserData`), so the gate needs no carve-out. The cost of being wrong is one more rename in Phase 173, which rewrites this method anyway.
   - **RESOLVED — ruling 2, plan 170-01:** renamed by pattern (mapping row P1-05) to `getContestantUserData`; the RPC `get_candidate_user_data` keeps its exemption for Phase 173.

3. **How far does D-12's "every app-level test name" reach inside files?**
   - Known: D-12 lists directories, files, projects, the tag, id values and baselines. The identifiers inside (page-object names, `testIds.candidate`, `candidateTest`, `setupCandidateSession`) are not listed; they are 600-odd occurrences.
   - Recommendation: rename them in plan 3 with R9–R12, R15 and R16. They are the same names as the files they live in.
   - **RESOLVED — ruling 3, plan 170-03:** renamed (mapping rows P3-10 to P3-15 and P3-17), including the registry namespace `testIds.contestant`.

4. **Are the login and pre-registration error types app-level (R14)?**
   - Recommendation: yes for the type and constant names; the error *codes* and the message sub-keys that name the entity stay.
   - **RESOLVED — ruling 4, plan 170-01:** the type and constant names are renamed (mapping row P1-17); the error codes and the entity-naming message sub-keys stay.

5. **Three small names nothing rules on:** `'cand-nav-menu'` (an a11y scan entry label), `'[notif-cand]'` (a seeded notification marker in `perm-per-app-notifications.ts`, asserted by its spec), and `apps/frontend/static/images/hero-candidate.png` (the default poster, referenced twice in the login page).
   - Recommendation: rename the first two in plan 3 (test naming). Leave the image: it is a served static asset, renaming it changes a public URL for no reader's benefit, and no gate pattern needs it. State the choice in the plan.
   - **RESOLVED — ruling 5.** `'cand-nav-menu'` and `'[notif-cand]'` are renamed in plan 170-03 (mapping row P3-16), as recommended. **The recommendation to leave the image was overruled by the operator on 2026-10-05: `apps/frontend/static/images/hero-candidate.png` IS renamed, to `hero-contestant.png`, in plan 170-02** — the file by `git mv` in that plan's pure-move commit, its references (two, both in the app's login page, plus whatever a fresh search finds) in the content commit (mapping row P2-08), and the old file name is a pattern of the gate's `urls` group with no exemption. Do not leave the image in place.

6. **What does the prose rule write for the three sub-forms?**
   - Known: D-14 says "Candidate App" / "candidate app" → "Contestant App".
   - Unclear: `'Candidate app'` as a sentence-case nav title (→ "Contestant app"?), the hyphenated adjective ("the candidate-app login form" → "contestant-app"), and "Candidate Application" in comments and specs (the message values are excluded regardless).
   - Recommendation: keep each form's own casing and punctuation (`Candidate app` → `Contestant app`, `candidate-app` → `contestant-app`, `candidate application` → `contestant application`), capitalise only where the source did. This is the least editorial reading; D-14's literal reading capitalises everything. The planner picks one and writes it into the mapping table, where a reviewer can see it.
   - **RESOLVED — ruling 6, plan 170-04:** each form keeps its own casing and punctuation (mapping rows P4-01 and P4-02); message catalogue values and the publishers' guide's prose are never rewritten.

7. **Dead tooling and root-level documents inside the gate's scan.**
   - Known: `apps/frontend/scripts/{store-to-state,flatten-current}-codemod.mjs`, the spike `sources/` snapshots, and root `ROADMAP.md` (prose only) hold old names. `CAND-APP-PLAN.md` is untracked today, cited as canonical by the requirements, and full of the old names; if it is ever committed, it becomes a finding.
   - Unclear: whether D-18's "`.planning/` plus exactly two lines" is meant to forbid a third exemption for historical artefacts.
   - Recommendation: rewrite them mechanically (they are not executed, and a rewritten rename table harms nothing), and raise `CAND-APP-PLAN.md` with the operator: either it moves under `.planning/` or it is rewritten when committed.
   - **RESOLVED — ruling 7, plans 170-01 to 170-04:** the dead tooling, the spike sources and root `ROADMAP.md` are rewritten mechanically by the codemod. `CAND-APP-PLAN.md` is untracked and is the operator's file: it is not edited, moved, staged or committed; the gate scans tracked files, so it is not a finding; it is recorded as a note for the operator.

8. **The gate's self-exclusion against the letter of D-18.** See Pattern 4. Recommendation: exclude the gate's own source and fixtures structurally, and say so in the plan.
   - **RESOLVED — rulings 8 and 12, plans 170-01 and 170-04:** the declared exemption list is exactly two entries; in addition, as a structural necessity, the gate skips its own source and fixtures and masks its own script name. Stated in the plan for operator review.

9. **Which plan boundaries need the bank-auth runs?**
   - Known: D-20 requires them at the close. They exercise exactly what plan 2 changes (`api/contestant/preregister`, the `identity-callback` redirect) and nothing the default suite covers. They need the runbook's multi-terminal setup and `supabase functions serve`, which replaces how the shared stack serves that function.
   - Recommendation: run them twice — at the end of plan 2, where a failure points at the URL move, and at the close. Plan them as their own task with `tests/IDURA-TEST-RUNBOOK.md` as required reading, noting the standing correction that the journey's Edge environment must name the mock issuer (`https://127.0.0.1:9443`), not the synthetic one the runbook's § B-3 points back to.
   - **RESOLVED — rulings 9 and 20, plans 170-02 and 170-04:** bank-auth is its own task in both plans — once per project at the end of plan 170-02, three consecutive runs per project at the close — through one driver script that plan 170-02 builds and plan 170-04 only invokes, with the journey's Edge environment naming the mock issuer.

10. **Where the docs generator's source path is fixed.** `lib/candidate/` moves in plan 1; the generator's config points at it. Recommendation: edit `docs-scripts.config.ts` and `generate-component-docs.ts` in plan 1 (they are code that would otherwise point at nothing) and regenerate the pages in plan 4 with the rest of the docs work. The generated pages are stale in between; no per-plan gate reads them.
    - **RESOLVED — ruling 10, plans 170-01 and 170-04:** the generator's config and its two `categorySubdir` branches are edited in plan 170-01; the pages are regenerated in plan 170-04. Both generated docs subtrees are excluded from the codemod in between.

11. **`perm-disable-candidate-app` (dev-seed template).** Not in CONTEXT.md. Recommendation: rename file, key and export in plan 1, with the settings keys it states. No test seeds it by name.
    - **RESOLVED — ruling 11, plan 170-01:** the file, the key and the export are renamed (mapping rows P1-02 and P1-18).

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 24.15.0 | every gate (`assert:node-engine`), `yarn install` | ✓ **only with a PATH prefix** | default `node` is v24.14.1 (fails the floor); v24.21.0 is installed under `~/.nvm/versions/node/` | `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"` at the top of every command block |
| Yarn | scripts | ✓ | 4.18.1 | — |
| git | moves, checks | ✓ | 2.50.1 | — |
| Docker | Supabase stack, visual container | ✓ | 29.7.2; 29.6 GiB free in the VM (floor used by Phase 169: 13.8 GiB) | — |
| Local Supabase stack | E2E, pgTAP, the probe | ✓ running | project `openvaa-local`; auth `gotrue:v2.197.0`; CLI 2.118.0 | `yarn db:start` |
| A second Supabase stack | — (must not be disturbed) | not running at research time | — | re-check with `docker ps` before plan 2's restart |
| Pinned Playwright image | D-19 (ii) | ✓ present locally | `sha256:eff16c30e6f3…`, linux/amd64 | the `e2e-visual` CI job through `ci-evidence/**` |
| Ports 5173, 5273 | dev server | ✓ free at research time | — | `FRONTEND_PORT` |
| Python 3 | optional, ad-hoc measurement | ✓ | 3.9.16 | Node |
| `core.hooksPath` override | commits that do not build | ✓ `/dev/null` in this worktree's own config | — | — |
| Context7 MCP | documentation lookup | ✗ not available in this session | — | official docs by `WebFetch` (used) |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** the default Node (use the 24.21.0 prefix).

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so validation is enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Unit | Vitest ^5.0.2 — `apps/frontend/vitest.config.ts`, one config per package, `apps/supabase` for Edge Function tests |
| E2E | Playwright 1.63.0 — `tests/playwright.config.ts`, run only through `tests/scripts/e2e-run.sh` |
| Database | pgTAP — `apps/supabase/supabase/tests/database/*.test.sql` via `supabase test db` |
| Static | `yarn lint:check` (ESLint, two type checks, 15 `assert:*` gates), `yarn workspace @openvaa/frontend check` (svelte-check), `yarn format:check` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit <file…>` (2 s for the three route test files) |
| Full suite command | the gate set in *Code Examples*, then one wrapper run |

### Phase Requirements → Test Map

| Req | Behaviour | Type | Automated command | Exists? |
|-----|-----------|------|-------------------|---------|
| NAME-01 | No app-level old name remains outside `.planning/` and the two exemptions | static gate | `node scripts/assert-no-candidate-app-names.mjs` | ❌ Wave 0 |
| NAME-01 | The gate fails on a planted old name | negative control | `node scripts/assert-no-candidate-app-names.mjs --self-test` | ❌ Wave 0 |
| NAME-01 | Every renamed identifier resolves | type check | `yarn typecheck` and `yarn workspace @openvaa/frontend check` | ✅ |
| NAME-01 | The two exemptions are untouched | count | `git grep -c 'get_candidate_user_data\|invite-candidate' -- ':!.planning'` equal before and after | ✅ ad hoc |
| NAME-01 | No message value changed (D-19 (i)) | identity | `node .planning/phases/170-…/catalogue-identity.mjs <before> <after>` | ❌ Wave 0 |
| NAME-01 | The namespace floors and the required key hold under the new prefix | static gate | `node scripts/assert-i18n-catalog-namespaces.mjs` | ✅ (edited in plan 1) |
| NAME-01 | The a11y scan is still wired under its new project and spec names | static gate | `node scripts/assert-a11y-scan-wiring.mjs` | ✅ (edited in plan 3) |
| NAME-02 | Route constants, the tree on disk and the gate table agree | unit | `yarn workspace @openvaa/frontend test:unit src/lib/routes/` | ✅ |
| NAME-02 | No `candidate/` route directory is left | filesystem | `test ! -e apps/frontend/src/routes/candidate && test ! -e apps/frontend/src/routes/api/candidate` | ✅ ad hoc |
| NAME-02 | The surviving logout handler signs out locally and answers a `DataApiActionResult` | unit | `yarn workspace @openvaa/frontend test:unit src/routes/api/auth/logout/` | ❌ Wave 0 |
| NAME-02 | The data writer posts to the neutral endpoint | unit | `yarn workspace @openvaa/frontend test:unit src/lib/api/adapters/supabase/dataWriter/` | ✅ (literals updated) |
| NAME-02 | The allowlist admits the neutral callback and no `candidate/` URL | live probe | the probe in *Code Examples*; and `docker inspect … \| grep '^GOTRUE_URI_ALLOW_LIST='` | ✅ instrument measured; manual step (needs the running stack) |
| NAME-02 | Sign-in, registration, password reset and sign-out work on the new routes, in both apps | E2E | the wrapper run (`contestant-journey`, `admin-access`, the perm chain) | ✅ |
| NAME-02 | The identity-provider return lands on `contestant/preregister/…` and the preregister API answers | E2E, opt-in | the bank-auth projects per `tests/IDURA-TEST-RUNBOOK.md` | ✅ (opt-in; manual setup) |
| NAME-02 | The docs describe the new routes and no link is broken | link check | `yarn workspace @openvaa/docs validate:links --check` | ✅ |
| Criterion 4 | The preview page renders as before | visual, opt-in | `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/170-visual` | ✅ |
| Criterion 4 | The two baselines are the same bytes | blob id | `git ls-files -s tests/tests/specs/visual/__screenshots__/` shows `402f4bf8…` and `88781886…` | ✅ ad hoc |
| E2E-03 | Zero failed, zero flaky, zero did-not-run | E2E | wrapper + `e2e-evidence.mjs` + the verdict one-liner | ✅ |

**Manual-only, with reason:** the redirect-matcher probe and the bank-auth runs need a running stack and, for the second, a multi-process setup; neither can be a unit-level command. Both are scripted, and both leave output to record.

### Sampling Rate

- **Per task commit:** the quick command over the files the task touched, plus `node rename.mjs --plan N` (must report 0 rewrites after an apply). A pure-move commit is exempt from "builds" and is checked by the pure-move command instead.
- **Per plan close:** the full gate set, the gate script in report mode for that plan's groups, and one wrapper run. Plan 2 adds the restart, the probe and the bank-auth runs. Plan 3 adds the visual run if it follows the baseline move immediately; otherwise plan 4.
- **Phase gate:** everything green on the final tree — gate set, default suite, bank-auth projects, visual run, catalogue identity — before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `.planning/phases/170-…/rename.mjs` and `rename.map.mjs` — the codemod and its table, with a dry-run default and `--moves`.
- [ ] `scripts/assert-no-candidate-app-names.mjs` with `--report`, `--only` and `--self-test`, and its two fixture files — built in plan 1, wired into `lint:check` in plan 4.
- [ ] `.planning/phases/170-…/catalogue-identity.mjs`, and a "before" snapshot of `apps/frontend/messages` taken from the pre-phase commit.
- [ ] `apps/frontend/src/routes/api/auth/logout/+server.test.ts` — the unit test D-06 requires (plan 2).
- [ ] `170-gates.sh` and `170-e2e.sh` in the phase directory, so no plan transcribes a gate command.
- [ ] A recorded baseline before the first edit: the probe output above (already captured here), `git grep -c` of the two exemptions, the two baseline blob ids, the `Checked / Dangling` line of `.claude/scripts/audit-skill-links.sh` (711 / 222 today; the dangling count must not rise after plan 4).

Framework install: none needed.

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so this section applies.

### Applicable ASVS Categories

| ASVS category | Applies | Standard control in this repository |
|---------------|---------|-------------------------------------|
| V2 Authentication | yes — the callback and logout endpoints move | Supabase Auth with PKCE; the callback verifies the OTP through the request hook's client. The move changes paths, not the mechanism. |
| V3 Session Management | **yes — the one behaviour change** | `signOut({ scope: 'local' })` on the server client clears the httpOnly cookies. After the merge no route performs a global sign-out; today one does and nothing calls it. This is a reduction of unused surface, and it is the fact the summary must state. |
| V4 Access Control | yes | Gate membership from the route id through `APP_GATES`; the ESLint adapter-boundary allowlist; the redirect allowlist. All three are keyed on names this phase changes. |
| V5 Input Validation | yes, unchanged | `safeRedirectTarget` validates `next` and `redirectTo`; strict zod schemas drop unknown stored keys. |
| V6 Cryptography | no | Nothing cryptographic is touched. |

### Known Threat Patterns for this change

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Broadening the redirect allowlist while editing it (a trailing or host wildcard "to be safe") | Spoofing, Tampering | The edit removes one path segment and nothing else. The comment block's rule stands: never a trailing wildcard, a prefix wildcard, a bare `**` or a host wildcard. The probe's fifth and sixth rows prove the boundary still holds. |
| Leaving the old callback URL admitted | Tampering | Criterion 2 requires "no `candidate/` URL"; probe rows 1 and 2 must be rejected after the restart. |
| A gate that silently stops gating after a rename | Elevation of privilege | `isContestantRoute` keeps the segment-exact form (`=== ROOT \|\| startsWith(ROOT + '/')`); the sibling-prefix probes are renamed with it (Pitfall 14); `routeConsistency.test.ts` C5 ties every protected subtree to a gate row. |
| Files falling off the adapter-boundary allowlist, or staying on it under a dead path | Elevation of privilege (guard erosion) | Pitfall 4: the allowlist follows the moves exactly, and shrinks by one with the logout merge. A stale entry for a path that no longer exists is removed, not left. |
| A stale stored settings key read as absent (`access.candidateApp: false` → open) | Tampering by omission | Accepted under the nothing-is-deployed ruling (D-07); stated in the summary; self-healing for the E2E project. |
| A message key rendered raw | Information disclosure (minor) | The type check and the a11y scan's raw-key detection (Pitfall 16). |
| Secrets in evidence | Information disclosure | The probe reads the anon key into a shell variable and never prints it; `.env` is not read (variable names come from `.env.example`). |

## Sources

### Primary (HIGH confidence)

- The working tree at HEAD `c74eb65ae`, read with the `Read` tool for every discrete value cited with a line range, and searched with `git grep -P` and a throwaway scanner over `git ls-files` for every count.
- Measurements made in this session: the redirect-matcher probe against the running auth service (both directions); `docker inspect` of the auth container's environment and the edge runtime's mounts; `docker image inspect` of the pinned Playwright image; the pure-move check in a scratch repository; `yarn lint:check`, `yarn format:check`, the frontend `check`, the docs link check and seven `scripts/assert-*.mjs` gates, each by exit status; `supabase stop --help`.
- Installed library sources: `@supabase/auth-js` 2.117.2 type documentation for `signOut` scope; `@inlang/paraglide-js` 2.25.4 compiled output under `apps/frontend/src/lib/paraglide/`.
- Recorded evidence in the repository: `tests/e2e-runs/169-08-visual-final/` (status, `observed.txt`, `results.json`, `provenance.txt`), `tests/e2e-runs/169-gates/169-rulings-r2/summary.tsv`, `tests/e2e-runs/169-e2e/169-nodemailer-pin/summary.json`.
- Project documents: `CLAUDE.md`; `tests/README.md`; `tests/IDURA-TEST-RUNBOOK.md`; `.claude/skills/ship-review-stack/SKILL.md` and `sources/`; `.claude/skills/README.md`; `158-06-SUMMARY.md` (the probe's method and its instrument validation); `169-EVIDENCE.md`, `169-gates.sh`, `169-e2e.sh`.

### Secondary (MEDIUM confidence)

- [git-diff documentation](https://git-scm.com/docs/git-diff) — `-M100%`, `--diff-filter`, `-l<num>`.
- [Supabase Auth: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) — wildcard semantics and separators.
- [Playwright TestConfig](https://playwright.dev/docs/api/class-testconfig) — `updateSnapshots` default, `snapshotPathTemplate` tokens.

### Tertiary (LOW confidence)

- The operator's standing notes on the CI evidence channel and on the bank-auth runs: used for procedure, and marked [ASSUMED] where a claim about current state rests on them alone.

## Metadata

**Confidence breakdown:**
- Rename surface and counts: HIGH — every CONTEXT figure reproduces, and each population has a command.
- Logout merge (research-open a): HIGH — the caller enumeration is exhaustive over `apps/frontend/src` and `tests/`, and the scope semantics come from the installed client.
- Visual channel (research-open b): HIGH for the local container (image present, a green run two days old, a recorded recipe); LOW for CI's current state.
- Gate pattern list (research-open c): HIGH for the counts and the residue; MEDIUM for the five classification calls, each raised as an open question.
- Codemod mechanism: HIGH for the shape (a close in-repo precedent) and the commit checks (measured); the mapping table itself is a sketch to be completed and dry-run by the executor.
- Gate commands: HIGH for the four run here and for the invocations (read from `package.json` and the CI workflow). `yarn test:unit`, the builds, pgTAP and the E2E suite were **not** run at this HEAD; Phase 169's recorded results predate the last source commits and are sizing context only.

**Research date:** 2026-10-05
**Valid until:** the first commit that changes a non-planning file. The counts are a snapshot by design; the commands are what stay valid.
