---
phase: 170-contestant-app-rename-symbols-routes
plan: 02
subsystem: frontend
tags: [rename, sveltekit, routing, auth, logout, supabase, redirect-allowlist, edge-functions, bank-auth, e2e]

requires:
  - phase: 170-01
    provides: "The contestant symbols, the mapping table and codemod, the search gate in report mode, the gate, E2E and verdict drivers, and the recorded baseline"
provides:
  - "Every page of the app served under /contestant; no candidate/ route directory left in the tree"
  - "The app's own API route at /api/contestant/preregister; the auth callback at the neutral /api/auth/callback"
  - "One logout handler at /api/auth/logout, local scope, DataApiActionResult response, with its own unit test"
  - "The route keys AuthCallback and AuthLogout"
  - "The redirect allowlist admitting the neutral callback, proven on the running auth service before and after a stack restart"
  - "170-allowlist-probe.sh and 170-bankauth.sh: the redirect-matcher probe and the non-interactive bank-auth driver plan 170-04 invokes"
affects: [170-03, 170-04, 171, 173, 174, 178, 179]

actuals:
  tokens: 76327
  tasks: 4
  commits: 8
plan_head_before: 9a10c837a8e418f32246f29080a12863801e6c88
plan_head_after: bfae9806e481716835e9df8dede408c2e001cc04

tech-stack:
  added: []
  patterns:
    - "A behaviour change inside a rename is one commit of its own, test first, placed before the mechanical commits that would otherwise carry it"
    - "Service configuration that is container state is proven by probing the running service in both directions around an explicit restart, never by reading the config file or a green suite"
    - "A readiness wait reads back the value that distinguishes the new container from the one it replaces, not only an HTTP status"

key-files:
  created:
    - apps/frontend/src/routes/api/auth/logout/server.test.ts
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-allowlist-probe.sh
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-bankauth.sh
    - .planning/phases/170-contestant-app-rename-symbols-routes/evidence/plan-02-start-rev.txt
    - .planning/phases/170-contestant-app-rename-symbols-routes/deferred-items.md
  modified:
    - apps/frontend/src/routes/contestant/ (moved from routes/candidate/, 34 files)
    - apps/frontend/src/routes/api/auth/callback/+server.ts (moved from api/candidate/auth/callback/)
    - apps/frontend/src/routes/api/contestant/preregister/ (moved from api/candidate/preregister/)
    - apps/frontend/src/routes/api/auth/logout/+server.ts
    - apps/frontend/static/images/hero-contestant.png (moved from hero-candidate.png)
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/lib/api/base/universalApiRoutes.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/eslint.config.mjs
    - apps/supabase/supabase/config.toml
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/invite-candidate/index.ts
    - scripts/assert-no-session-in-loads.mjs
    - scripts/assert-no-candidate-app-names.mjs
    - CLAUDE.md
    - .planning/phases/170-contestant-app-rename-symbols-routes/rename.map.mjs
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-EVIDENCE.md

key-decisions:
  - "Map row P2-05 and the search gate's URL pattern were tightened a second time: both matched the regex literal /candidate/i in voter-journey.spec.ts, which matches the voter results tab's label and names the entity"
  - "Map row P2-01b was added for the one place the auth callback's path is assembled from the API root constant, which P2-01 cannot see and P2-05 would have sent to /contestant/auth/callback"
  - "The allowlist probe carries one row beyond the plan's list (/api/evil on localhost), so every form the config.toml comment says was measured is a row of the probe"
  - "The bank-auth driver's readiness wait reads the issuer back from the serving container, because the default container answers OPTIONS with 200 until functions serve replaces it"

patterns-established:
  - "The logout merge commit holds the merge, its test and only what the deletion forces; no identifier is renamed in it"
  - "The opt-in bank-auth projects run through one driver script that restores the stack from its exit trap"

requirements-completed: [NAME-02]

coverage:
  - id: D1
    description: "Exactly one logout handler exists, at /api/auth/logout. It calls signOut({ scope: 'local' }) once and answers { ok: true, type: 'success' }; the test failed against the handler as it stood before the merge"
    requirement: NAME-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/api/auth/logout/server.test.ts (2 tests; red before the merge on the scope assertion, exit 1; green after, exit 0)"
        status: pass
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-02-close --expect-project candidate-journey --expect-project admin-access (exit 0; the sign-out steps of both apps)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every page of the app is served under /contestant; src/routes/candidate/ and src/routes/api/candidate/ no longer exist; the move is a pure-move commit at 100% similarity followed by a content commit"
    requirement: NAME-02
    verification:
      - kind: other
        ref: "git show -M100% --name-status --format= 40cb307b5 | awk '$1 != \"R100\"' (prints nothing; 38 files, 0 insertions, 0 deletions)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit src/lib/routes/ src/lib/_guards/eslint-adapter-boundary-guard.test.ts src/routes/admin/layout.server.test.ts src/routes/api/ (exit 0; 13 files, 293 tests; routeConsistency.test.ts walks the tree on disk)"
        status: pass
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-02-close --same-total-as 170-01-baseline (exit 0; 171 passed of 171, 0 failed, 0 flaky, 0 did-not-run)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The app's API route is served at /api/contestant/preregister and the auth callback at /api/auth/callback, with the route keys AuthCallback and AuthLogout and no ContestantAppAuth key anywhere"
    requirement: NAME-02
    verification:
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-02-bankauth-journey-1 --expect-project bank-auth-journey (exit 0; 131 passed of 131; the journey's preregister step posts to /api/contestant/preregister)"
        status: pass
      - kind: other
        ref: "node rename.mjs --check --plan 2 (exit 0); gate row residue in 170-02-close (0 findings of groups symbols and urls outside the generated docs subtrees)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The running local auth service admits the two neutral callback URLs and rejects both candidate callback URLs, a two-segment prefix, a suffix, two foreign paths, the root and a foreign host"
    requirement: NAME-02
    verification:
      - kind: other
        ref: "bash 170-allowlist-probe.sh before (exit 0, on the container still carrying the old list); yarn db:stop, yarn db:start; bash 170-allowlist-probe.sh after (exit 0); again after the bank-auth restore (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The three code-built redirects target the new URLs: the password-reset redirectTo from buildRoute('AuthCallback'), identity-callback to /contestant, invite-candidate to /contestant/complete-registration"
    requirement: NAME-02
    verification:
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-02-bankauth-1 --expect-project bank-auth (exit 0; 8 passed of 8; the identity-callback function served from the edited source)"
        status: pass
      - kind: other
        ref: "content checks of Task 2's acceptance criteria on the committed tree (170-EVIDENCE.md section 3.2)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The default login poster is served at /images/hero-contestant.png with the bytes it had before"
    requirement: NAME-02
    verification:
      - kind: other
        ref: "git ls-files -s apps/frontend/static/images/hero-contestant.png against git ls-tree <base-rev> …/hero-candidate.png (blob 88a00570e03d2e0f939442002a33d72b3e46cdfd in both)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The gate set is green on the moved tree"
    requirement: NAME-02
    verification:
      - kind: other
        ref: "node 170-verdict.mjs gates 170-02-close (exit 0; 14 rows at status 0, not stale)"
        status: pass
    human_judgment: false
  - id: D8
    description: "No redirect, alias, fallback route, re-export or shim was added for an old URL, key or the old poster, and no behaviour changed other than the logout merge (PROH-170-03, PROH-170-04)"
    requirement: NAME-02
    verification: []
    human_judgment: true
    rationale: "The plan marks both prohibitions as verified by judgment. The supporting facts are measured — the callback handler is byte-identical to the file the pure move carried, the content commit is 280 insertions against 280 deletions of substitutions, and no file was added outside the unit test — but that nothing was opportunistically changed is a reading of three commits."
  - id: D9
    description: "The invitation redirect is renamed and still lands on a path with no page"
    requirement: NAME-02
    verification: []
    human_judgment: true
    rationale: "D-11 leaves it dangling on purpose for Phases 174 and 178. Roadmap criterion 2 read literally says every link arrives on the new routes; 170-CONTEXT.md is the authority, and the operator should see the difference stated."

duration: 29min
completed: 2026-10-05
status: complete
---

# Phase 170 Plan 02: Contestant App Rename — Routes Summary

**The app is served under `/contestant`, its API route under `/api/contestant/preregister` and the two auth endpoints under the neutral `/api/auth/`, with the duplicate logout handler merged into one, and the running auth service observed admitting the new callback and no `candidate` URL after an explicit stack restart.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-10-05T19:27:48Z
- **Completed:** 2026-10-05T19:57:00Z
- **Tasks:** 4 of 4
- **Files changed:** 131 (126 outside `.planning/`)
- **Start revision:** `9a10c837a8e418f32246f29080a12863801e6c88` (pinned in `evidence/plan-02-start-rev.txt`)

## The One Behaviour Change of the Phase

**The two logout handlers were merged into `api/auth/logout`.** Stated as a behaviour change, in measured terms:

- **The response body of the route both apps post to changed shape**, from `{ success: true }` to `{ ok: true, type: 'success' }`, **and no caller reads it**: `SupabaseDataWriter._logout` discards the response.
- **A global-scope sign-out endpoint that nothing reached no longer exists at any route.** The handler that stood at `api/auth/logout` called `signOut()` with no argument, which the installed Supabase client treats as a global sign-out (every device). Its only reader is `UniversalDataWriter.logout`, which the one concrete writer overrides without calling `super`; no test posts to it. That handler is gone.
- **The local-scope handler survives.** The surviving file keeps the live handler's `signOut({ scope: 'local' })`, its typed signature and its docstring. The contestant app and the admin app sign out exactly as they did.

It is one commit, `b3ae09d56`, with its unit test. The test was written first and failed against the handler as it stood, on the scope assertion (`expected … to be called once with arguments: [ { scope: 'local' } ]`, received `[]`). The commit also holds the three things the deletion forces — the logout route key's value, the three path literals its unit test pins, and the adapter-boundary allowlist entry with the counts beside it — and renames no identifier.

Which logout behaviour survives is still listed as open for operator confirmation in `170-CONTEXT.md`. A different answer changes this one commit.

## Accomplishments

- Merged the two logout handlers, test first, as a commit of its own placed before the route move.
- Moved 38 paths by a pure-move commit at 100% similarity: the 34-file page tree, the auth callback, the two files of the preregister API route and the login poster.
- Rewrote every URL literal, route value, allowlist entry, Edge Function redirect and path-keyed guard in a content commit of 280 insertions against 280 deletions, with the formatter's output in a third commit.
- Proved the redirect allowlist on the running auth service in both directions around an explicit restart of this project's stack only.
- Closed green: 14 gate rows at 0, one full E2E run with the baseline's counts, and one run of each opt-in bank-auth project.
- Built the bank-auth driver that plan 170-04 only has to invoke.

## Task Commits

1. **Task 1: Merge the two logout handlers**
   - `b3ae09d56` `fix[auth](170-02): one logout endpoint at api/auth/logout, signing out the local session` — one `D`, one `A`, five `M`, no `R` row.
2. **Task 2: Move the route trees and the poster, rewrite every URL**
   - `320dee73a` `chore[lint](170-02): spare the entity-word regex literal /candidate/i in the app-name search gate` — the gate and its fixture (deviation 1).
   - `a8a7c7f54` `docs(170-02): pin the plan's start revision; tighten map row P2-05 and add P2-01b` — the map (deviations 1 and 2).
   - `40cb307b5` `refactor[frontend](170-02): move the app's route trees and login poster to contestant paths` — the pure move: 38 paths, every row `R100`, 0 insertions and 0 deletions. Does not build.
   - `68573e5b1` `refactor[frontend](170-02): serve the contestant app under /contestant, its API route under api/contestant and the auth callback under api/auth` — the content: 87 files, 280 insertions and 280 deletions. 315 codemod rewrites in 86 files plus the hand edits listed below.
   - `88c19c10e` `style(170-02): import order and line width after the route move` — formatter output only, 6 files.
3. **Task 3: Prove the allowlist, close on the gate set and one E2E run**
   - `3e4845cd8` `docs(170-02): record the logout merge, the route move, the allowlist probe and the plan-2 close` — the probe script and evidence sections 3.1 to 3.5.
4. **Task 4: Run the opt-in bank-auth projects once each**
   - `bfae9806e` `docs(170-02): add the bank-auth driver and record one run of each opt-in project`.

## Gate, E2E and Bank-Auth Results

| What | Label / command | Exit | Result |
|---|---|---|---|
| Logout unit test, before the merge | `yarn workspace @openvaa/frontend test:unit src/routes/api/auth/logout/` | 1 | 1 failed (the scope), 1 passed |
| Logout unit test, after the merge | the same | 0 | 2 passed |
| Allowlist probe, before the restart | `170-allowlist-probe.sh before` | 0 | ten rows OK: both old URLs admitted, both neutral URLs rejected |
| Allowlist probe, after the restart | `170-allowlist-probe.sh after` | 0 | ten rows OK: both neutral URLs admitted, both old URLs rejected |
| Closing gate set | `170-gates.sh 170-02-close --plan 2` | 0 | 14 rows, all 0 |
| `170-verdict.mjs gates 170-02-close` | | 0 | not stale |
| Closing E2E | `170-e2e.sh 170-02-close` | 0 | 171 total, 171 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run |
| `170-verdict.mjs e2e 170-02-close --same-total-as 170-01-baseline --expect-project candidate-journey --expect-project admin-access` | | 0 | same counts as the baseline; both projects 1/1 |
| Bank-auth driver | `170-bankauth.sh 170-02 1` | 0 | both wrappers 0, restore OK |
| `bank-auth` | `170-verdict.mjs e2e 170-02-bankauth-1 --expect-project bank-auth` | 0 | 8 total, 8 passed; project 6/6 |
| `bank-auth-journey` | `170-verdict.mjs e2e 170-02-bankauth-journey-1 --expect-project bank-auth-journey` | 0 | 131 total, 131 passed; project 1/1; Edge issuer `https://127.0.0.1:9443` |
| Allowlist probe, after the bank-auth restore | `170-allowlist-probe.sh after` | 0 | ten rows OK |
| `rename.mjs --check --plan 2` | | 0 | nothing pending |
| `170-verdict.mjs exemptions` | | 0 | 51 / 15 and 73 / 32 at both revisions |

Run directories: `tests/e2e-runs/170-gates/170-02-close`, `tests/e2e-runs/170-e2e/170-02-close`, `tests/e2e-runs/170-e2e/170-02-bankauth-1`, `tests/e2e-runs/170-e2e/170-02-bankauth-journey-1`. There was no red gate row and no red E2E run. The full record is `170-EVIDENCE.md` section 3.

## What Later Phases and Every Developer Need to Know

- **The allowlist is live only after a stack restart.** `additional_redirect_urls` is read into the auth container when the stack starts. Anyone who pulls this plan runs `yarn db:stop` then `yarn db:start` once; until then the running service rejects the neutral callback on `localhost` and still admits the two old URLs. The E2E suite does not notice either way, because its redirects are built on `127.0.0.1`. This host's stack has been restarted and carries the new list.
- **The invitation redirect dangles at `/contestant/complete-registration`.** No page exists at that path, as none existed at the old one. D-11 leaves it for Phases 174 and 178. The docs sentence that says so names the new path and still says so.
- **The auth endpoints and their keys are `api/auth/{callback,logout}` and `AuthCallback` / `AuthLogout`.** Later phases' documents still cite them under the old names (for example `routes/api/candidate/auth/callback/+server.ts` and `CandAppAuthCallback` in the Phase 178 material and in FIX-01); their planners read those anchors as the neutral path. `ROUTE.AuthLogout` reads `UNIVERSAL_API_ROUTES.logout`, so the path has one definition.
- **The default login poster is now served at `/images/hero-contestant.png`**, with the bytes it had before. Nothing answers at the old URL.
- **No old URL has a route.** No redirect, alias or shim was added; `src/routes/` holds `(voters)`, `admin`, `api` and `contestant`.

## How Roadmap Criterion 2 Reads Here

Two of its clauses are wider than the decisions, and `170-CONTEXT.md` is the authority in both:

- **The identity-provider return is `/api/oidc/callback`.** It is neither a `contestant/` URL nor the neutral callback, it carries no app name, and it did not move (D-05). What moved is where the flow lands afterwards and the `identity-callback` function's redirect.
- **The invitation link arrives at a path with no page** (D-11), so "every link arrives on the new routes" does not hold for it in this phase, by decision.

## Hand Edits Beyond the Mapping Table

- `scripts/assert-no-session-in-loads.mjs`: the anchor assembled with `path.join` names the `'contestant'` segment.
- `appGates.test.ts`: the sibling-prefix probes are `'/contestant-portal'` and `'/contestants'`, so the negative test still probes ids that merely begin with the app's root.
- `route.ts`: the comment above `AuthCallback` and `AuthLogout` says what is now true — the endpoints sit under the generic API prefix because both apps address the same handlers, and their keys carry no app name for the same reason.
- `SupabaseDataWriter._logout`: the path segment its comment names is `'contestant'`.
- `supabaseDataWriter.test.ts`: one test title and two comments whose statements the move made false (deviation 3).

## Decisions Made

Nothing in the plan's decisions was decided differently. Calls the plan does not make are the four under `key-decisions` and the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Map row P2-05 and the search gate matched a regex literal that names the entity**
- **Found during:** Task 2, step 1, by tabulating every P2-05 match with its context.
- **Issue:** `candidateTab: /candidate/i` in `tests/tests/specs/voter/voter-journey.spec.ts` matches the voter results tab's label. Plan 1's review read only the matches not followed by a URL delimiter; this one is followed by a slash. The codemod would have rewritten it to `/contestant/i` and the locator would have matched nothing; the gate already reported it as a finding.
- **Fix:** the look-ahead of the row and of the gate's URL pattern also spares `/i` followed by a word boundary. A fixture negative covers it; the self-test is still 81 of 81. It is the only regex literal of that form in the tree.
- **Files modified:** `rename.map.mjs`, `scripts/assert-no-candidate-app-names.mjs`, the gate's fixture input. The two gate files are not in the plan's `files_modified`.
- **Committed in:** `320dee73a`, `a8a7c7f54`.

**2. [Rule 1 - Bug] No map row saw the auth callback's path in `route.ts`**
- **Found during:** Task 2, step 1, same tabulation.
- **Issue:** the path is written `` `${API_ROOT}/candidate/auth/callback` ``, so the string `api/candidate` is not in the file. P2-01 does not match and P2-05 would have written `${API_ROOT}/contestant/auth/callback`, which contradicts the acceptance criterion and D-06.
- **Fix:** map row P2-01b, placed after P2-01. One match.
- **Committed in:** `a8a7c7f54`.

**3. [Rule 1 - Bug] The codemod left three false statements in `supabaseDataWriter.test.ts`**
- **Found during:** Task 2, step 4.
- **Issue:** one comment came out quoting a mixed path (`/contestant/candidate/auth/logout`, the second segment sitting behind the look-behind), one became a claim about `contestant/auth/callback`, a path that never existed, and a test title still named the `/candidate-prefix` bug while its fixture pathname had moved.
- **Fix:** by hand, as corrections of fact under D-21. Both comments now state the mechanism without quoting a path that is not real.
- **Committed in:** `68573e5b1`.

**4. [Rule 1 - Bug] Two counts in the adapter-boundary block could not be corrected by changing a number alone**
- **Found during:** Task 1, step 5.
- **Issue:** the plan says to correct every number the deletion changes and nothing else. The comment above the `hooks.server.ts` entry read "eight route files above" when seven were listed, so it was already one off; and the docblock's clause "which measured eight before `157-16` cleared one" cannot stand beside "Six".
- **Fix:** the first now reads six. The second sentence reads "Six are route files, of the eight `157-RESEARCH.md` § F.6 measured". "The logout pair" in the same comment became "the logout handler". No other wording changed.
- **Committed in:** `b3ae09d56`.

**5. [Rule 3 - Blocking] The merged handler's import order failed lint**
- **Found during:** Task 1, step 6.
- **Issue:** with the element order of the research's sketch, `simple-import-sort/imports` is an error.
- **Fix:** `eslint --fix` on that one file reordered its two type imports before the commit.
- **Committed in:** `b3ae09d56`.

**6. [Rule 2 - Missing critical] The allowlist probe carries one row beyond the plan's list**
- **Issue:** the comment block in `config.toml` says a path of the form `/api/...` was measured as rejected. With the plan's nine rows nothing measures that form any longer, because `/api/auth/callback` is now admitted by the first entry.
- **Fix:** a tenth row, `http://localhost:5173/api/evil`, rejected in both modes. The comment block was not edited beyond the two paths the codemod rewrote.

**7. [Scope boundary] One unrelated autofix was again kept out of the formatter commit**
- `yarn lint:fix` proposed the removal of an unused `eslint-disable` directive in `tests/tests/support/mockOidcIssuerEntry.ts`; it was dropped, as in plan 1. Logged in `deferred-items.md`.

### Commits the plan's output list does not name

The plan lists a behaviour-change commit, a pure-move commit, a content commit and a formatter commit. There are four more: the gate tightening (`320dee73a`), the map changes with the start revision (`a8a7c7f54`), and two evidence commits (`3e4845cd8`, `bfae9806e`).

### A handover expectation that did not materialise

Plan 1's summary expected set-aside docs-link findings under `frontend/routing/generated/` once the route tree moved. Measured: none. The 15 set-aside findings are the same 15 as at the plan-1 close, all under `frontend/components/generated/`.

---

**Total deviations:** 7 (2 map rows, 2 comment corrections beyond the listed hand edits, 1 lint fix, 1 extra probe row, 1 scope exclusion).
**Impact on plan:** deviation 1 prevented a rewrite that would have broken a voter E2E spec; deviation 2 prevented a wrong route value. None changes application behaviour beyond the logout merge.

## Changes for the Operator's Eye

- **`CLAUDE.md`: one line changed**, the route directory citation under § *Frontend (SvelteKit)* → *Routing*, by map row P2-04. The file is in the plan's `files_modified`; nothing else in it changed.
- **The search gate changed a second time** (deviation 1). Its declared exemption list is still exactly two entries.
- **This project's Supabase stack was stopped and started twice**, with `yarn db:stop` and `yarn db:start` only: once for the allowlist and once by the bank-auth driver's restore. The container list after each is identical to the list before; `my-redis` was never touched. The database was not reset.

## Deferred Issues

Logged in `deferred-items.md`, neither fixed:

1. Two comments (`lib/api/dataWriter.ts`, `supabaseAdapter.concurrency.test.ts`) say `SupabaseDataWriter` inherits `logout` un-overridden. The code overrides it, which is what the "no live caller" finding rests on. The comments predate the phase.
2. The `yarn lint:fix` proposal of deviation 7.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification that was not run.

## Issues Encountered

None beyond the deviations above. No gate row and no E2E test was red at any point, and the bank-auth procedure ran without a terminal on the first attempt.

## Known Stubs

None.

## Next Plan Readiness — What 170-03 Must Know

- **Compare against:** E2E `170-01-baseline` for the counts (171 / 171 / 0 skipped). The last green tree is `88c19c10e` (gate set and E2E `170-02-close`). The wrapper's port is 5273.
- **Read every map row from `rename.map.mjs`.** P2-05's look-ahead is `(?![\w.-]| lookup failed|\/i\b)` and there is a row P2-01b; neither is in the plan's prose.
- **`tests/tests/specs/voter/voter-journey.spec.ts` holds `candidateTab: /candidate/i`**, which names the entity and must survive plan 3 as it survived plan 2.
- **The test directories still carry the old names** (`specs/candidate/`, `fixtures/candidate/`, `setup/candidate/`); their URL literals already name the new routes. The constant `CANDIDATE_SIBLING_PREFIX_ROUTE_IDS` in `appGates.test.ts` keeps its name for row P3-14; its two values were changed here.
- **Carried by the gate rows:** docs-links 15 set-aside findings, all under `frontend/components/generated/`; residue 70 lines set aside (symbols 42, urls 28), all under the same subtree, 0 outside. With `--plan 3` the residue row adds group `tests`.
- **The generated route-map page is stale in a form no gate sees:** `frontend/routing/generated/+page.md` draws the tree with `candidate/` as a directory name (two lines). Plan 170-04 regenerates it.
- **The docs pages already name the new URLs** (13 files under `apps/docs`), while the section directory `developers-guide/candidate-app/` keeps its name until plan 170-04.
- **`170-bankauth.sh <label-stem> <runs>`** is ready for plan 170-04: `bash PD/170-bankauth.sh 170-04 3` in the background with an exit marker, then `170-allowlist-probe.sh after`. It refuses a label stem that already holds a run. Measured: about 5 minutes at one run per project, so about 15 at three. It drives the projects by name (`bank-auth`, `bank-auth-journey`), so plan 3's rename of the three spec files does not touch it, provided the `testMatch` regexes follow the files.
- **Frontend unit count:** 2037 tests in 130 files.
- **`yarn lint:fix`** proposes the unrelated change of deviation 7 every time.
- **Stack state:** up and healthy on the new allowlist, default function environment, not reset. Nothing listens on 5173, 5273, 8777 or 9443. A Vite dev server on port 5199 that predates this plan belongs to another session and was left alone.

## Self-Check: PASSED

- Every file under `key-files.created` exists; `apps/frontend/src/routes/contestant/+layout.svelte`, `apps/frontend/src/routes/api/auth/callback/+server.ts`, `apps/frontend/src/routes/api/contestant/preregister/+server.ts` and `apps/frontend/static/images/hero-contestant.png` exist; the two old route directories and the old poster do not.
- All eight commits (`b3ae09d56`, `320dee73a`, `a8a7c7f54`, `40cb307b5`, `68573e5b1`, `88c19c10e`, `3e4845cd8`, `bfae9806e`) are ancestors of HEAD; `git rev-list --count 9a10c837a..HEAD` was 8 when this file was written.
- The plan's seven verification items were re-run on the final tree and each exited 0.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
