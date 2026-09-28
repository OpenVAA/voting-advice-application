---
phase: 158-routing-auth-surface-harmonisation
plan: 01
subsystem: routing
tags: [sveltekit, routing, auth, hooks, codemod, git-mv, vitest, paraglide, qs]

requires:
  - phase: 157-adapter-boundary-and-typing
    provides: the adapter boundary the moved route and auth code must not re-leak across
provides:
  - "`apps/frontend/src/lib/routes/` — one discoverable locus holding every route definition, the `(protected)` route-group pattern and the post-login redirect validator, behind a single barrel"
  - "`PROTECTED_GROUP`, `isCandidateRoute()`, `isProtectedRoute()` and the six group-prefix consts, exported from `$lib/routes/route.ts`"
  - "`candidateAuthHandle` deciding Candidate-App membership and protected-route membership from `route.id` alone"
  - "`buildRoute.redirects.test.ts` — the standing proof that the attacker-influenced `redirectTo` survives a `buildRoute` round trip without being laundered"
affects: [158-02, 158-03, 158-04, 158-05, 158-06, 159, any phase importing route definitions]

actuals:
  tokens: 12800
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "One `$lib/<name>/` locus per cross-cutting concern, flat layout, `export * from './<module>';` barrel alphabetised one line per module"
    - "Route-group membership expressed as an exported predicate over `route.id` with a segment split, never a substring test on `url.pathname`"
    - "Isolated `git mv` plus import codemod as its own commit, verified by the standing command chain rather than by inspection"

key-files:
  created:
    - apps/frontend/src/lib/routes/buildRoute.redirects.test.ts
  modified:
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/lib/routes/index.ts
    - apps/frontend/src/lib/routes/buildRoute.ts
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/src/routes/README.md
    - tests/tests/utils/buildRoute.ts
    - tests/tests/utils/axeScan.ts

key-decisions:
  - "D-G1 widened on the operator's answer `whole-directory`: all eight files of `lib/utils/route/` move, not the two the decision's letter named"
  - "`filterPersistent` stays out of the barrel, preserving today's deep-import behaviour"
  - "The `redirectTo` round trip HELD, so no REVIEW-RT-03 exclusion was recorded; both hook redirects go through `buildRoute`"
  - "Rewriting the redirects through `buildRoute` drops the redundant base-locale prefix, aligning the hook with the protected candidate layout, which has always built its login redirect this way"

patterns-established:
  - "Predicate over route id: `isCandidateRoute` / `isProtectedRoute` are pure, take a route id and are the single definition the hook and the route map both bind to"
  - "Characterisation test before a URL-emitting rewrite, including a discriminating case so the round-trip assertions cannot pass vacuously"

requirements-completed: [REVIEW-RT-03, REVIEW-RT-04, REVIEW-RT-05]

coverage:
  - id: D1
    description: "`$lib/routes/` exists and exports buildRoute, ROUTE, safeRedirectTarget, PROTECTED_GROUP, isCandidateRoute and isProtectedRoute from one barrel"
    requirement: REVIEW-RT-05
    verification:
      - kind: other
        ref: "yarn build && yarn typecheck && yarn typecheck:tests && yarn lint:check"
        status: pass
    human_judgment: false
  - id: D2
    description: "No source file under apps, packages or tests resolves route definitions through the old locus path; every former importer still compiles"
    requirement: REVIEW-RT-05
    verification:
      - kind: other
        ref: "grep -rn 'utils/route' apps packages tests (zero genuine hits) + yarn typecheck:tests"
        status: pass
    human_judgment: false
  - id: D3
    description: "candidateAuthHandle decides Candidate-App membership from route.id alone, so a subpath deployment cannot make it misfire"
    requirement: REVIEW-RT-04
    verification:
      - kind: e2e
        ref: "yarn test:e2e full suite, 150 passed"
        status: pass
      - kind: other
        ref: "curl -s -o /dev/null -w '%{http_code} %{redirect_url}' http://localhost:5173/candidate/profile -> 303 /candidate/login?redirectTo=candidate%2Fprofile"
        status: pass
    human_judgment: false
  - id: D4
    description: "Route-id predicates hold at their boundaries: /candidate and /candidate/login are candidate routes, /candidates and a voter results id are not; /candidate/(protected)/profile is protected and /candidate/xx(protected)yy is not"
    requirement: REVIEW-RT-04
    verification:
      - kind: other
        ref: "tsx probe over src/lib/routes/route.ts, 7/7 PASS (see Verification Evidence)"
        status: pass
    human_judgment: false
    rationale: ""
  - id: D5
    description: "A redirectTo value accepted by safeRedirectTarget survives a buildRoute round trip and is still accepted; a rejected value is still rejected"
    requirement: REVIEW-RT-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/routes/buildRoute.redirects.test.ts (12 tests)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Both redirects emitted by candidateAuthHandle are produced by buildRoute, not by string interpolation"
    requirement: REVIEW-RT-03
    verification:
      - kind: other
        ref: "grep -cE 'redirect\\(303, `/' apps/frontend/src/hooks.server.ts -> 0"
        status: pass
      - kind: e2e
        ref: "yarn test:e2e full suite, 150 passed"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-09-01
status: complete
---

# Phase 158 Plan 01: Routes Locus Tracer Summary

**One `$lib/routes/` locus holding all nine route modules plus the post-login redirect validator, an exported `(protected)` route-group pattern with two segment-exact predicates, and a `candidateAuthHandle` that decides from `route.id` alone and builds both its redirects through `buildRoute` — proven by a 150-passed full E2E run.**

## Performance

- **Duration:** ~55 min (two full 10.3-minute E2E runs and two database resets dominate)
- **Started:** 2026-09-01T18:05Z
- **Completed:** 2026-09-01T19:00Z
- **Tasks:** 3
- **Files modified:** 43

## D-G1 — Task 1 decision: RECORDED WIDENING of a ticked decision

**Operator's answer, verbatim: `whole-directory`.**

D-G1's letter named exactly two files as moving out of `apps/frontend/src/lib/utils/route/`
— `buildRoute.ts` and `route.ts` — plus `apps/frontend/src/routes/loginRedirectTarget.ts`
relocating from the SvelteKit route tree. The operator selected the whole-directory option,
so **four more modules move with them**: `params.ts`, `parseParams.ts` (with its colocated
`parseParams.test.ts`), `impliedParams.ts` and `filterPersistent.ts`, together with the
`index.ts` barrel. `apps/frontend/src/lib/utils/route/` ceases to exist.

**This is a widening of a ticked decision and is recorded as one**, not discovered later as
an oversight.

**Rationale the operator accepted:**

1. `buildRoute.ts` imports three of the modules the letter would have left behind
   (`./filterPersistent`, `./params`, `./parseParams`, plus `./route`). A split leaves the
   new `$lib/routes/` locus reaching back into `$lib/utils/route/`, so the routes code is
   half-buried rather than centralised — criterion 3's "route definitions live in one
   centralised locus" is satisfied only in part.
2. The barrel would straddle two directories. Every in-repo importer but one goes through
   the barrel, so a split either rewrites nothing (leaving `$lib/utils/route` as the
   discoverable name, criterion 3 unmet) or rewrites everything anyway (the split bought
   nothing).
3. **The import-rewrite size is identical either way, because the barrel specifier is the
   same string.** The widening costs a larger `git mv` and no extra codemod surface.
4. No importer consumes the parameter machinery for a non-route purpose, so there is no
   cohesion argument for splitting; and `parseParams.test.ts` keeps its colocated home.

**Barrel decision carried with it:** `filterPersistent` stays OUT of the barrel, exactly as
today. `routes/(voters)/constituencies/+page.svelte` deep-imports it, and adding it to the
barrel would be a behaviour-neutral but unrequested change.

**Recording order:** the decision was written to this file and committed (`33bb0726d`) while
`git status --porcelain apps/frontend/src/lib` was still empty, which is Task 1's own
acceptance criterion.

## Pre-move census — the codemod's expected hit count

Measured at HEAD `b5c9bb68d`, immediately before the move:

```
grep -rn "utils/route" apps packages tests --exclude-dir=node_modules --exclude-dir=.svelte-kit
```

**33 files / 44 lines.**

This is larger than the CONTEXT's 24-file figure because that figure counted only
`apps/frontend/src`. The difference is:

| Surface | Files | Note |
|---|---:|---|
| `apps/frontend/src` (imports plus prose comments) | 25 | the CONTEXT's 24 plus one |
| `tests/` deep-relative importers (`tests/tests/utils/{buildRoute,axeScan}.ts`) | 2 | invisible to any `$lib` grep; `yarn typecheck:tests` is the only gate that catches them |
| `tests/` prose mentions (`IDURA-TEST-RUNBOOK.md`, `perm-header-show-help.spec.ts`) | 2 | non-import doc references |
| `packages/dev-seed` prose mention | 1 | non-import doc reference |
| `apps/docs` prose GitHub links naming the old path | 1 | non-import doc reference |
| `apps/docs/scripts/*` — `./utils/routes` (a docs-local module) | 2 | **FALSE POSITIVES**, unrelated to the frontend locus; must NOT be rewritten |
| `apps/frontend/tsconfig.tsbuildinfo` | 1 | gitignored build artifact, regenerates |

`loginRedirectTarget` census: **2 importers**
(`apps/frontend/src/routes/candidate/login/+page.server.ts:10`,
`apps/frontend/src/routes/admin/login/+page.server.ts:10`), **2 in-file prose mentions**
(the `// Caller-controlled:` comment in each of those two files) and **1 doc reference**
(`apps/frontend/src/routes/README.md:18`).

## Post-move census

`grep -rn "utils/route" apps packages tests --exclude-dir=node_modules --exclude-dir=.svelte-kit`
returns **2 lines**, both false positives:

```
apps/docs/scripts/generate-navigation-config.ts:18:  ... from './utils/routes';
apps/docs/scripts/validate-links.ts:25:            ... from './utils/routes';
```

These import a **docs-local `scripts/utils/routes.ts`** module that has nothing to do with
the frontend route locus; the grep matches them only because `utils/route` is a substring of
`utils/routes`. Rewriting them would produce `./utils/routess`. The plan's acceptance
criterion asked for a literally-zero grep; the honest form of that criterion is:

```
grep -rn "utils/route" apps packages tests --exclude-dir=node_modules \
  --exclude-dir=.svelte-kit --exclude='*.tsbuildinfo' | grep -v "utils/routes"
```

which returns **zero**. The `loginRedirectTarget` residue grep returns only the barrel
re-export, the updated `README.md` prose, and the unchanged `// Caller-controlled:` comment
in each of the two login server files — the import statements themselves are gone, because
both were merged into the existing `$lib/routes` barrel import.

## Re-measured `hooks.server.ts` anchors — the fifth drift

The plan cited `const { url, route } = event;` at `:59`, the pathname substring test at
`:59+10` and the `(protected)` test at `:59+15`. **Measured at HEAD `b5c9bb68d` they were at
`:80`, `:90` and `:95`**, with the two hand-built redirects at `:93` and `:97` — a `+21`
drift from the plan's numbers, and exactly where the CONTEXT's re-measure had put them. The
CONTEXT's standing instruction to navigate by expression rather than by line number is what
made the drift a non-event; every edit in this plan was located by expression.

## Accomplishments

- **One routes locus.** Nine modules now live at `apps/frontend/src/lib/routes/`, reachable
  as `$lib/routes`. No alias was added: `$lib` is SvelteKit's built-in and resolves in vite,
  svelte-check and vitest alike, so `svelte.config.js`, `tsconfig.json` and
  `vitest.config.ts` are all untouched.
- **The `(protected)` pattern has one definition.** `PROTECTED_GROUP` is exported and
  `CANDIDATE_PROT` / `ADMIN_PROT` are now built from it, so every `(protected)` route id in
  `ROUTE`, the hook's predicate and the group consts all derive from the same string.
- **The subpath-unsafe check is gone.** `candidateAuthHandle` reads `route.id` only. The
  correct `pathname.startsWith(NORMALIZED_API_ROOT)` API skip is preserved and was
  deliberately not caught by the sweep.
- **`isProtectedRoute` splits on the path separator** rather than substring-matching, closing
  the escalation shape where a route id merely containing the group name inside a larger
  segment would have been treated as protected.
- **Both hook redirects are built by `buildRoute`**, gated on a round-trip test that was
  written and run first.
- **Full E2E suite green:** 150 passed, on a fresh dev server and a `yarn db:reset` database,
  with the rewritten hook live.

## Task Commits

1. **Task 1: D-G1 decision recorded** — `33bb0726d` (docs)
2. **Task 2: the move, the codemod, the exported pattern and the hook rewrite** — `99cb9f761` (refactor)
3. **Task 3 RED: the redirect characterisation test** — `eb632ee8c` (test)
4. **Task 3 GREEN: both redirects through `buildRoute`** — `36eb9a132` (fix)

## Files Created/Modified

- `apps/frontend/src/lib/routes/` — the new locus (9 modules, all recorded as renames: `R061`–`R100`)
- `apps/frontend/src/lib/routes/route.ts` — `PROTECTED_GROUP`, six group consts promoted to exports, `isCandidateRoute()`, `isProtectedRoute()`
- `apps/frontend/src/lib/routes/index.ts` — barrel, with `./loginRedirectTarget` added, `filterPersistent` still absent
- `apps/frontend/src/lib/routes/buildRoute.ts` — one edit: `../removeDuplicates` becomes `$lib/utils/removeDuplicates`
- `apps/frontend/src/lib/routes/loginRedirectTarget.ts` — relocated out of the SvelteKit route tree, **byte-identical (`R100`)**
- `apps/frontend/src/lib/routes/buildRoute.redirects.test.ts` — new, 12 tests
- `apps/frontend/src/hooks.server.ts` — the `route.id` rewrite and both redirect targets
- `apps/frontend/src/routes/README.md`, `apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md`, `tests/IDURA-TEST-RUNBOOK.md` — doc references retargeted
- `tests/tests/utils/buildRoute.ts`, `tests/tests/utils/axeScan.ts` — the deep-relative importers
- 28 further importers rewritten from `$lib/utils/route` to `$lib/routes`

## The `redirectTo` round trip — RESULT: IT HOLDS

**No REVIEW-RT-03 exclusion is recorded.** Both hook redirects go through `buildRoute`.

`redirectTo` is not a declared route param, so `buildRoute` sends it to the search side and
emits it through `qs.stringify(..., { encodeValuesOnly: true })`. That percent-encodes the
separators: `candidate/profile` becomes `redirectTo=candidate%2Fprofile`, where the old
hand-built form wrote the slash raw.

The encoded form is **rejected** by `safeRedirectTarget` — its accepted-path pattern permits
`%` inside a query string but not inside a path segment. That is asserted explicitly in the
test as the discriminating case, so the round-trip assertions cannot pass vacuously. What
saves the deep link is that the value is never seen in its encoded form by the validator: the
login page reads it off `page.url.searchParams`, which decodes, and posts the decoded value
back in a hidden field. Measured live on the running dev server:

```
GET /candidate/profile (unauthenticated)
-> 303 http://localhost:5173/candidate/login?redirectTo=candidate%2Fprofile
```

and `URLSearchParams.get('redirectTo')` on that query yields `candidate/profile`, which
`safeRedirectTarget` accepts. Four accepted values and four rejected values were tested in
both directions; **a rejected value is still rejected after the round trip**, so the trip
cannot launder a hostile value into an accepted one.

## Decisions Made

### The base-locale prefix drops — measured, recorded, not an oversight

The hand-built redirects interpolated the locale unconditionally (`/${locale}/candidate`).
`buildRoute` finishes by handing its result to Paraglide's `localizeHref`, and **measured
against the generated runtime**, that function prefixes every non-base locale and omits the
prefix for the base locale:

| Call | Result |
|---|---|
| `localizeHref('/candidate', { locale: 'en' })` | `/candidate` |
| `localizeHref('/candidate', { locale: 'fi' })` | `/fi/candidate` |

So the English redirect target changes from `/en/candidate` to `/candidate`. This was
accepted rather than worked around, for one decisive reason: **the protected candidate layout
has always built its login redirect exactly this way**
(`routes/candidate/(protected)/+layout.server.ts`, `buildRoute({ route: 'CandAppLogin', locale })`),
so before this change the hook and the layout emitted two different URLs for the same
outcome. They now agree, and the English URL emitted is the canonical unprefixed one. The
full E2E suite passes with the change live.

### The unit harness boundary is documented rather than faked

`apps/frontend/src/lib/paraglide/` is generated at build time and gitignored, so no test may
import it. The vitest config aliases the Paraglide runtime to a stub whose `localizeHref` is
the identity function. Rather than mock a prefixing `localizeHref` and risk asserting a
fiction, the characterisation test asserts the string `buildRoute` itself assembles before
localization, and its docblock states that boundary plus the measured prefix behaviour
explicitly. The prefixing itself is Paraglide's and is proven by the browser suite.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Import-order lint errors introduced by the codemod**
- **Found during:** Task 2, at the `yarn lint:check` gate
- **Issue:** `$lib/routes` sorts before `$lib/utils/removeDuplicates` where `$lib/utils/route` sorted after it, so `simple-import-sort/imports` went red in `lib/contexts/candidate/candidateContext.svelte.ts` and `routes/candidate/(protected)/+layout.server.ts`
- **Fix:** `yarn workspace @openvaa/frontend lint --fix`, plus a hand reorder of the rewritten `$lib/utils/removeDuplicates` import inside the moved `buildRoute.ts`
- **Files modified:** those two files plus `apps/frontend/src/lib/routes/buildRoute.ts`
- **Verification:** `yarn lint:check` exits 0
- **Committed in:** `99cb9f761`

**2. [Rule 3 - Blocking] Prettier table misalignment in `tests/IDURA-TEST-RUNBOOK.md`**
- **Found during:** Task 2, at the `yarn format:check` gate
- **Issue:** the path substitution shortened a cell in a markdown table, breaking column alignment
- **Fix:** `yarn prettier --write tests/IDURA-TEST-RUNBOOK.md`; the resulting diff is confined to the two substituted lines
- **Verification:** `yarn format:check` reports all matched files clean
- **Committed in:** `99cb9f761`

**3. [Rule 2 - Missing critical] Codemod extended past the plan's recipe to reach zero residue**
- **Found during:** Task 2, at the pre-move census
- **Issue:** the recipe covered `apps/frontend/src` and `tests/` only. Four further surfaces named the old path in prose and would have been left stale: the `apps/docs` routing guide's GitHub links, a `packages/dev-seed` template comment, a `tests/` spec comment and two lines of `tests/IDURA-TEST-RUNBOOK.md`
- **Fix:** one deep-path substitution across `apps packages tests`, excluding the gitignored `*.tsbuildinfo`
- **Verification:** the residue grep, and `yarn format:check` after the runbook reflow
- **Committed in:** `99cb9f761`

**4. [Rule 3 - Blocking] `buildRoute` import deferred from Task 2 to Task 3**
- **Found during:** Task 2
- **Issue:** the plan says to import `buildRoute` into `hooks.server.ts` during Task 2, but Task 2 explicitly leaves the redirects hand-built; an unused import fails `lint:check`
- **Fix:** Task 2 imports the three route symbols, Task 3 adds `buildRoute` alongside them when it is first used
- **Committed in:** `99cb9f761` then `36eb9a132`

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 missing critical). **Impact on plan:** none
on scope. Every deviation is mechanical fallout of the codemod or of the plan's own task
ordering; no behaviour was added or removed beyond what the plan specifies, and the one
behaviour change that did occur (the base-locale prefix) is recorded above as a decision.

**Acceptance criterion restated rather than met literally:** the plan asked for a literally
zero `grep -rn "utils/route" apps packages tests` return. Two unrelated `./utils/routes`
imports in `apps/docs/scripts/` match that grep as a substring and must not be rewritten; the
honest zero-residue form of the criterion is given in the Post-move census section above.

## Verification Evidence

| Gate | Command | Result |
|---|---|---|
| 1 | `yarn build` | exit 0 |
| 2 | `yarn typecheck` | exit 0, svelte-check 0 errors 0 warnings |
| 3 | `yarn typecheck:tests` | exit 0 — the gate for the two deep-relative importers |
| 4 | `yarn lint:check` | exit 0 |
| 5 | `yarn format:check` | exit 0 |
| 6 | `yarn test:unit` | 70 files / 1290 tests passed, plus the 12 new redirect tests |
| 7 | `yarn test:e2e` full suite, run twice | **150 passed (10.3m)** after Task 2, **150 passed (10.3m)** after Task 3 |
| 8 | live redirect probe | `GET /candidate/profile` -> `303 /candidate/login?redirectTo=candidate%2Fprofile` |
| 9 | rename detection | `R061`–`R100` on all nine moved files; `loginRedirectTarget.ts` at `R100`, i.e. byte-identical |

Both E2E runs were on a fresh dev server started after a `yarn db:reset`; the server was
restarted between them so the rewritten `hooks.server.ts` could not be served from a stale
SSR module.

**Predicate boundary probe** (`tsx` over `src/lib/routes/route.ts`, 7/7 PASS):

```
PASS  isCandidateRoute('/candidate')
PASS  isCandidateRoute('/candidate/login')
PASS  !isCandidateRoute('/candidates')
PASS  !isCandidateRoute('/(voters)/(located)/results/[[electionTab]]')
PASS  isProtectedRoute('/candidate/(protected)/profile')
PASS  !isProtectedRoute('/candidate/xx(protected)yy')
PASS  PROTECTED_GROUP === '(protected)'
```

The standing regression proof for these is `routeConsistency.test.ts`, which a later plan in
this phase owns; this probe is the measurement that the truths hold today.

## Threat Model Disposition

| Threat | Disposition |
|---|---|
| T-158-01 elevation via substring `(protected)` match | **mitigated** — segment split, both the positive and the negative case measured |
| T-158-02 spoofing under a base path | **mitigated** — every `includes`/`endsWith` read of `pathname` removed from the handler; the correct `startsWith` API skip preserved |
| T-158-03 tampering via the validator relocation | **mitigated** — moved at `R100` (byte-identical), and the round-trip test asserts a rejected value stays rejected |
| T-158-04 the validator becomes importable by browser code | **accepted, as planned** — the function is pure and discloses nothing; the security property is that the server calls it, which is unchanged |
| T-158-05 `buildRoute` called from a hook | **mitigated** — proven by two full E2E runs, not by reasoning |
| T-158-SC package installs | **not applicable** — this plan installed nothing |

## Threat Flags

None. No new network endpoint, auth path, file access pattern or schema change was
introduced; the only trust-boundary code that moved did so byte-identically.

## Known Stubs

None.

## Issues Encountered

- The plan's `hooks.server.ts` line anchors were stale by 21 lines. Navigating by expression,
  as the CONTEXT requires, made this a non-event.
- The `qs` percent-encoding question could not be settled by reading: it needed the executed
  round-trip test plus a live probe against the running server. It resolved in favour of the
  rewrite.
- The E2E suite takes 10.3 minutes and exceeds a single foreground command budget; both runs
  were driven as background processes and polled.

## Next Phase Readiness

- `$lib/routes` is the import target for every later plan in this phase that touches a route
  string. The barrel export surface is: `buildRoute`, `RouteOptions`, `impliedParams`
  helpers, `Params` types, `parseParams`, `ROUTE`, `Route`, `FIRST_QUESTION_ID`,
  `DEFAULT_PARAMS`, `PROTECTED_GROUP`, the six group consts, `isCandidateRoute`,
  `isProtectedRoute` and `safeRedirectTarget`. `filterPersistent` is deliberately not in it.
- `routeConsistency.test.ts` (the pattern / route tree / hook consistency test, with its two
  negative controls) is **not** in this plan and remains owned downstream. Until it lands,
  the `(protected)` pattern is single-defined but not yet guarded against drift.
- The `apps/docs/scripts/utils/routes.ts` substring collision is worth knowing about for any
  later plan that greps for `utils/route`.

## Self-Check: PASSED

All five claimed artifacts plus `hooks.server.ts` exist on disk; all four claimed commit
hashes resolve in `git log`.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-01*
