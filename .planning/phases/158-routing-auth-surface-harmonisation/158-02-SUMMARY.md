---
phase: 158-routing-auth-surface-harmonisation
plan: 02
subsystem: routing
tags: [sveltekit, routing, auth, vitest, guard, negative-control, route-groups]

requires:
  - phase: 158-routing-auth-surface-harmonisation
    provides: "the `$lib/routes` locus, `PROTECTED_GROUP` and the two segment-exact predicates that plan 01 exported"
provides:
  - "`apps/frontend/src/lib/routes/routeConsistency.test.ts` — 40 assertions across four checks binding the `(protected)` pattern, the SvelteKit route tree on disk and the candidate auth handler to one another, collected by `yarn test:unit`"
  - "`158-NEGATIVE-CONTROL-LEDGER.md` — the phase's plant-and-observe record, opened with three filled route-pattern rows and an explicitly unfilled six-row cookie section"
  - "`KNOWN_UNBUILT_PROTECTED_ROUTES` — a self-asserting register of the two admin `ROUTE` entries that name pages which do not exist"
affects: [158-03, 158-09, 158-11, 158-13, 158-15, 158-17, any phase adding a protected route]

actuals:
  tokens: 9400
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A vitest spec as the consistency mechanism when a check must BOTH import the module and walk the filesystem, rather than a `scripts/assert-*.mjs` guard which can only do the latter"
    - "Guard scoping by brace matching from a declared identifier over a comment- and literal-masked copy of the source, so a ban binds to a function body and never to a line number"
    - "A known-gap register asserted in BOTH directions, so an exemption cannot outlive the gap it records"

key-files:
  created:
    - apps/frontend/src/lib/routes/routeConsistency.test.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md
    - .planning/todos/pending/2026-09-01-admin-factor-analysis-route-missing.md
  modified:
    - apps/frontend/src/routes/README.md

key-decisions:
  - "C1 is measured at the level of addressable PAGE directories inside a protected group, not at the level of the group directories themselves — the plan's own negative control only reddens under that reading"
  - "C1 compares SERVED URL PATHS rather than raw route ids, because `ROUTE` addresses a group-root page without its group and a page below it with its group; comparing raw ids would report both group roots as unaddressable, which is false"
  - "The two measured C2 gaps are CARRIED in a self-asserting register rather than repaired here: repairing them means deleting a `ROUTE` key live code still calls, or building a page, and `route.ts` is owned by two other plans in this phase"
  - "The optional `lint:check` sibling clause for C4 is a DELIBERATE EXCLUSION, not an omission"

patterns-established:
  - "Plant, observe red, remove, observe green, paste the verbatim message — the ledger row is the evidence, and a predicted message does not count"
  - "Pair a ban with a precision assertion in the same run: C4's red run also shows the correct `startsWith` call staying silent, so the ban is proven discriminating rather than blanket"

requirements-completed: [REVIEW-RT-04]

coverage:
  - id: D1
    description: "A new protected route directory added under the SvelteKit route tree with no corresponding ROUTE entry fails yarn test:unit, naming the directory"
    requirement: REVIEW-RT-04
    verification:
      - kind: unit
        ref: "negative control A1 — planted `routes/candidate/(protected)/__probe__/+page.svelte`, observed 1 failed / 41 passed, message names the directory twice; removed, 40/40"
        status: pass
    human_judgment: false
  - id: D2
    description: "A ROUTE entry naming a protected route whose directory no longer exists fails yarn test:unit, naming the entry"
    requirement: REVIEW-RT-04
    verification:
      - kind: unit
        ref: "negative control A2 — planted `CandAppProbeGone` in the ROUTE map, observed 1 failed / 40 passed, message names ROUTE.CandAppProbeGone and the absent directory; removed, 40/40"
        status: pass
    human_judgment: false
  - id: D3
    description: "Reintroducing a url.pathname substring or suffix test inside the candidate auth handler fails yarn test:unit naming the offending construct, while the correct startsWith test against the API root stays silent"
    requirement: REVIEW-RT-04
    verification:
      - kind: unit
        ref: "negative control A3 — restored `pathname.includes('/candidate')`, observed 1 failed / 39 passed naming the construct and its source line; the sibling non-vacuity assertion requiring `pathname.startsWith(` stayed GREEN in the same run; removed, 40/40"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every one of the three failure modes has been OBSERVED failing and then observed passing again, and the observation is recorded, before the guard is claimed to guard"
    requirement: REVIEW-RT-04
    verification:
      - kind: other
        ref: ".planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md — three filled rows, each with the verbatim message, the command, and the removal confirmed green"
        status: pass
    human_judgment: false
  - id: D5
    description: "The guard cannot pass vacuously: the walk must find both protected groups, and C4's scan must be proved to have reached real source"
    requirement: REVIEW-RT-04
    verification:
      - kind: unit
        ref: "three non-vacuity assertions in the `the walk is not vacuous` describe block, plus the `handler body was located and the scan reached real source` test asserting the body contains both `pathname.startsWith(` and `isProtectedRoute(`"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-09-01
status: complete
---

# Phase 158 Plan 02: Route Consistency Guard Summary

**A 40-assertion vitest spec that holds the exported `(protected)` pattern, the route tree on disk and the candidate auth handler to one definition — each of its three failure modes observed red on a planted control and observed green after removal, with the verbatim message on the record.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-09-01T20:29Z
- **Completed:** 2026-09-01T20:42Z
- **Tasks:** 2
- **Files created/modified:** 4

## The three observed failure messages, verbatim

These are the plan's output requirement. Each was copied from the run's own output, not predicted.
The full rows, with commands and removal confirmations, are in the ledger.

### Control 1 — the route tree drifts ahead of `ROUTE` (C1)

Planted `apps/frontend/src/routes/candidate/(protected)/__probe__/+page.svelte`. Observed
**1 failed / 41 passed**:

```
AssertionError: The route tree carries an addressable page at /candidate/(protected)/__probe__, served at /candidate/__probe__, and no entry in the ROUTE map addresses it or anything below it. A protected route added without a ROUTE entry is still gated, because the hook's predicate is structural, but it cannot be linked to: buildRoute has no key for it, so every link to it has to be a hand written string, which is the drift this check exists to stop. Add a key to the ROUTE map in route.ts whose value is /candidate/(protected)/__probe__, or delete the page directory.: expected [] to not have a length of +0
```

The other eight C1 rows stayed green in the same run, so C1 answered differently for the planted
directory than for the eight real ones. Removed with `rm -rf`; **40/40**.

### Control 2 — `ROUTE` rots ahead of the route tree (C2)

Planted `` CandAppProbeGone: `${CANDIDATE_PROT}/__gone__`, `` in the `ROUTE` map. Observed
**1 failed / 40 passed**:

```
AssertionError: ROUTE.CandAppProbeGone is /candidate/(protected)/__gone__, which carries the protected group segment, and there is no directory at /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/candidate/(protected)/__gone__. A ROUTE entry with no route behind it produces a link to a page that does not exist, and nothing else in the tree notices. Either restore the route directory, or delete the ROUTE key and every caller that asks for it. If the gap is deliberate and is owned elsewhere, add CandAppProbeGone to KNOWN_UNBUILT_PROTECTED_ROUTES in this file with the reason, which keeps it counted rather than silent.: expected false to be true // Object.is equality
```

Removed with `git checkout --` on that one file; **40/40**.

### Control 3 — the hook stops using the pattern (C4)

Restored `if (pathname.includes('/candidate')) {` in place of `if (isCandidateRoute(routeId)) {`,
located by expression. Observed **1 failed / 39 passed**:

```
AssertionError: candidateAuthHandle in /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/hooks.server.ts tests a pathname with includes or endsWith, and that is the subpath-unsafe defect class this handler was rewritten to close. A pathname carries the deployment's base path and the locale prefix and the resolved values of every route parameter, so a substring test fires when the app is served under a path that contains the word and fails to fire when it is served under one that does not. Decide membership from the SvelteKit route id instead, through isCandidateRoute and isProtectedRoute, which take a route id and compare whole segments. The prefix test pathname.startsWith( is deliberately NOT banned: it guards a served URL prefix rather than a route id and is correct as written. Offending constructs: pathname.includes( in the source line: if (pathname.includes('/candidate')) {
```

**The precision half, in the same red run:** the sibling assertion *"the handler body was located
and the scan reached real source"* stayed **green**. That assertion requires the extracted body to
contain `pathname.startsWith(` — the API skip, three lines above the plant, which guards a served
URL prefix and is correct as written. So one run proves both halves: the banned construct caught,
the correct call not. A C4 that banned every `pathname` read would have reddened here for the wrong
reason and this control would be evidence of nothing. Removed with `git checkout --`; **40/40**.

## The deliberate exclusion: no `lint:check` sibling clause for C4

Research offered an optional second home for C4's ban — a regex clause inside a
`scripts/assert-*.mjs` guard, so `yarn lint:check` would catch a regression without running the unit
suite. **It is not implemented, and that is a decision rather than an oversight.** Three reasons:

1. **File contention.** The named host was `scripts/assert-cookie-names.mjs`, which does not exist
   yet and is built by the cookie-name plan. Both plans are live in the same phase, and the cookie
   plan owns that file plus its `package.json` script wiring. Putting a second author into it buys a
   merge conflict for a duplicate check.
2. **Both of the requirement's stated failure modes are already proven.** The requirement names two:
   the pattern drifting from the tree, and the hook reverting to a pathname test. Controls 1 and 3
   demonstrate exactly those, plus control 2 for the tree-rot mirror. A second mechanism would
   restate a proven property, not add one.
3. **A regex over the whole file is strictly weaker than what shipped.** The spec masks comments and
   literals, then brace-matches the handler body from its declared identifier, which is what lets it
   permit the correct API-root `startsWith` sitting inside the same handler. A `lint:check` regex
   would either flag that correct call or be scoped so loosely it stops discriminating.

If a later phase wants the faster gate anyway, the honest form is to call the same predicate from
both places rather than to write a second, weaker one.

## Two live findings the guard surfaced on its first run

C2 went red at HEAD before any plant. Both hits are real, and neither is test scaffolding:

| Key | Value | Directory | In-repo callers |
| --- | --- | --- | --- |
| `AdminAppJob` | `/admin/(protected)/jobs/[jobId]` | **absent** | **none** |
| `AdminAppFactorAnalysis` | `/admin/(protected)/factor-analysis` | **absent** | **two** |

`AdminAppJob` is a dead entry — nothing asks `getRoute` for the key. `AdminAppFactorAnalysis` is a
**live broken link**: `lib/dynamic-components/navigation/admin/AdminNav.svelte` builds a nav item
from it and `routes/admin/(protected)/+page.svelte` builds a dashboard card from it, so both resolve
to a page that does not exist. The Paraglide catalogue carries a full set of
`adminapp_factoranalysis_*` strings, so the page was authored for and either never built or removed
without its links following.

**Neither is repaired here.** Repairing them means deleting a `ROUTE` key that live code calls, or
building a page — and `apps/frontend/src/lib/routes/route.ts` is in the `files_modified` of two
other plans in this phase, one of them in this same wave. Instead they are **carried in a register
that asserts itself in both directions**: a registered key that leaves `ROUTE`, and a registered key
whose directory appears, each fail the suite and name the row to delete. An exemption cannot outlive
the gap it records. The product decision is filed at
`.planning/todos/pending/2026-09-01-admin-factor-analysis-route-missing.md` with the three options.

## Decisions Made

### C1 is measured at page directories, not at group directories

The plan's C1 sentence reads *"every directory whose basename is the protected group has at least
one `ROUTE` value whose string starts with that directory's derived route id"*, and there are
exactly two such directories. **Under that literal reading the plan's own control 1 could not
redden**: a probe directory added inside `candidate/(protected)/` does not have the group as its
basename, so it would never enter the set. The binding truth in `must_haves` is the one that
decides — *"a new protected route directory added under the route tree with no corresponding `ROUTE`
entry fails `yarn test:unit`, naming the directory"* — so C1 walks every directory **inside** a
protected group that contains a page file, which is the set the truth describes and the set the
control perturbs. The measured set is nine, not two; the two-group count survives as a separate
non-vacuity assertion.

### C1 compares served URL paths, not raw route ids

`ROUTE` addresses the same page in two shapes. A group-root page is addressed **without** its group
(`CandAppHome` is `/candidate`, for the page at `/candidate/(protected)`) while a page below it is
addressed **with** it (`CandAppProfile` is `/candidate/(protected)/profile`). Comparing raw route
ids would report both group roots as unaddressable, which is false — SvelteKit route groups never
appear in a served URL. So both sides are normalised by dropping parenthesised segments before the
comparison. C2 needs no normalisation and does not use it: it tests directory existence against the
raw value, which keeps C2 bound to the literal pattern string.

Prefix comparisons are **segment-safe**, not bare `startsWith`: a bare prefix test would let
`/candidate/settings` satisfy a directory called `/candidate/set`.

### C4 scopes by brace matching over a masked copy, and proves it read real source

The ban is scoped to the candidate auth handler's body, located by its **declared identifier** and
delimited by brace matching over a copy of the file with every comment, string and template literal
blanked to spaces of the same length. Preserving length is what lets a match be reported with the
untouched source line it came from, so a failure quotes real code and **cites no line number** — in
a phase whose own context records five drifts of these very anchors.

The mask is deliberately simple and does not model regular-expression literals. That is safe only
because of the paired non-vacuity assertions: the extracted body must contain both
`pathname.startsWith(` and `isProtectedRoute(`, so a mis-mask that swallowed the handler produces a
loud named failure rather than a silent empty scan.

## Task Commits

1. **Task 1: the four-check consistency spec** — `0e9ad4a40` (test)
2. **Task 2: three observed controls and the ledger** — `3209aac51` (docs)
3. **Code-review checklist follow-ups** — `f5b341428` (docs)

## Files Created/Modified

- `apps/frontend/src/lib/routes/routeConsistency.test.ts` — new, 40 assertions in five describe
  blocks: non-vacuity, C1, C2 with its self-asserting register, C3, C4.
- `.planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md` — new;
  section A filled with three rows, section B a header with six explicitly unfilled cookie rows and
  a completeness table declaring the phase total of nine.
- `.planning/todos/pending/2026-09-01-admin-factor-analysis-route-missing.md` — new; the product
  decision behind the two carried C2 gaps, with three options and the register row each would clear.
- `apps/frontend/src/routes/README.md` — a section telling a route author what the guard expects:
  add a `ROUTE` entry with a protected route, remove it with the route, and decide membership from
  `event.route.id`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] C1 as literally worded could not redden under the plan's own control**

- **Found during:** Task 1, while deriving the set C1 measures
- **Issue:** the plan's C1 sentence scopes the walk to directories whose basename is the group
  itself, of which there are two; control 1 plants a directory **inside** a group, which that set
  never contains. The check and the control it must fail under disagreed.
- **Fix:** C1 walks every directory inside a protected group that contains a page file, which is
  what the binding `must_haves` truth describes. The two-group count is preserved as a separate
  non-vacuity assertion, so nothing the plan asked for was dropped.
- **Verification:** control 1 observed red naming the planted directory; the eight real rows green
  in the same run
- **Committed in:** `0e9ad4a40`

**2. [Rule 2 - Missing critical] C2 was red at HEAD on two real gaps, with no register to hold them**

- **Found during:** Task 1, on the first run of C2
- **Issue:** `AdminAppJob` and `AdminAppFactorAnalysis` both name protected routes with no directory
  on disk. Shipping C2 as a bare check would have left the unit suite red — a cardinal failure —
  and shipping it without them would have meant weakening C2 until it saw nothing.
- **Fix:** a `KNOWN_UNBUILT_PROTECTED_ROUTES` register carrying both with their reasons, asserted in
  both directions so a row cannot outlive its gap, plus a pending todo carrying the product decision
- **Files modified:** `apps/frontend/src/lib/routes/routeConsistency.test.ts`, plus the new todo
- **Verification:** control 2 still reddens for a key outside the register; the register-rot test
  passes today and is proven to name a stale row
- **Committed in:** `0e9ad4a40`, `3209aac51`

**3. [Rule 2 - Missing critical] The routes README said nothing about the new obligation**

- **Found during:** the code-review checklist walk, item *"repo documentation markdown files are
  updated if the changes touch upon those"*
- **Issue:** a guard that reddens the unit suite when someone adds a protected route, with no
  in-tree documentation saying so, is a trap rather than a guard
- **Fix:** a section in `apps/frontend/src/routes/README.md`, the file that already documents the
  three route groups
- **Committed in:** `f5b341428`

---

**Total deviations:** 3 auto-fixed (1 bug, 2 missing critical). **Impact on scope:** none. No
runtime source file was changed by this plan; `route.ts` and `hooks.server.ts` were touched only by
negative controls and restored, verified by an empty `git status --porcelain apps/frontend/src`.

## Verification Evidence

| Gate | Command | Result |
| --- | --- | --- |
| 1 | `yarn workspace @openvaa/frontend test:unit` | **73 files / 1361 tests passed**, the new spec among them |
| 2 | three negative controls, each planted and removed | each observed **red then green**, messages in the ledger |
| 3 | `git status --porcelain apps/frontend/src` after every control | **empty** |
| 4 | `yarn lint:check` | exit 0, including the comment-hygiene guard over 1604 files, 0 violations |
| 5 | `yarn format:check` | all matched files clean |
| 6 | `yarn typecheck` | exit 0, svelte-check 0 errors 0 warnings |
| 7 | `.agents/code-review-checklist.md` walked over the diff | two items actioned, recorded as deviations 2 and 3 |

**Acceptance criteria, measured:**

- `grep -c 'toHaveLength\|toBeGreaterThan' apps/frontend/src/lib/routes/routeConsistency.test.ts`
  returns **5** (required: at least 1).
- `grep -c 'observed' .planning/.../158-NEGATIVE-CONTROL-LEDGER.md` returns **8** (required: at
  least 3).
- The spec contains **no numeric line-number literal** used as an anchor into `hooks.server.ts`;
  every anchor is an identifier or a message substring.
- The tree walk finds **9** addressable protected page directories and **2** protected group
  directories, both asserted non-zero.

**On E2E.** The plan's verification block does not call for it, and this plan changed **no runtime
source**: the only files that ship are a test, a README section and two planning documents. The
three controls that did touch runtime files were restored and verified clean by
`git status --porcelain`. The full suite was last run green at 150 passed by the tracer plan, after
the `hooks.server.ts` rewrite this spec now guards; nothing here alters what that run measured.

## Threat Model Disposition

| Threat | Disposition |
| --- | --- |
| T-158-06 a protected route added later with no `ROUTE` entry | **mitigated** — C1 fails naming the directory, demonstrated by control 1 |
| T-158-07 the hook silently reverts to a `url.pathname` test | **mitigated** — C4 fails naming the construct and its source line, demonstrated by control 3 |
| T-158-08 a guard claimed to guard but never seen failing | **mitigated** — three plants, each observed red then green, verbatim messages in the ledger |
| T-158-09 C4's scan vacuous because it read the wrong region or an empty string | **mitigated** — the body must contain both `pathname.startsWith(` and `isProtectedRoute(`; the first stayed green during control 3, proving the scan was live and discriminating |
| T-158-10 a plant left behind in the working tree | **mitigated** — `git status --porcelain apps/frontend/src` empty after each removal and at plan close; every removal was a targeted `rm -rf` of a directory this plan created or a `git checkout --` on one named file, never a blanket reset and never `git clean` |
| T-158-SC package installs | **not applicable** — this plan installed nothing; vitest was already a dev dependency |

## Threat Flags

None. No network endpoint, auth path, file access pattern or schema change was introduced. The one
new file that reads the filesystem is a unit test reading paths derived from `import.meta.url`
inside the repository, with no input from outside the process.

## Known Stubs

None. The two carried C2 gaps are pre-existing product gaps, not stubs written by this plan; they
are registered in the spec, asserted in both directions, and filed as a pending todo.

## Issues Encountered

- C2 was red at HEAD, on two real gaps. That is the check working, on its first run, before any
  plant — but it forced a decision between shipping a red suite, weakening the check, or carrying
  the gaps explicitly. The register was chosen because it is the only one of the three that keeps
  the gaps counted.
- The plan's C1 wording and the plan's own control 1 disagreed about what C1 measures. The
  `must_haves` truth broke the tie.

## Next Phase Readiness

- **The ledger is open and visibly incomplete.** Section B expects six cookie-name rows from the
  cookie plan; until they land, the phase sign-off block cannot be ticked. The five-field rule for a
  filled row is stated at the top of the file.
- **The consistency spec is extended, not rewritten, by the app-gates plan**, which lists it in its
  own `files_modified`. It will find: a tree walk that names an offending directory in its message,
  a hook-shape assertion scoped to the auth handler's body by brace matching from the declared
  identifier, and a non-vacuity block that any new check should join rather than duplicate.
- **Any plan that edits `route.ts`** should know that adding a protected `ROUTE` entry now requires a
  matching directory, or a registered reason. Deleting `AdminAppJob` would additionally require
  removing its register row, which the spec will name if forgotten.

## Self-Check: PASSED

All four claimed files exist on disk (`routeConsistency.test.ts`, the ledger, the todo, the amended
README); all three claimed commit hashes resolve in `git log`.

---

_Phase: 158-routing-auth-surface-harmonisation_
_Completed: 2026-09-01_
