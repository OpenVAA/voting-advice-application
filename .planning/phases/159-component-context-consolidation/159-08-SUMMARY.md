---
phase: 159-component-context-consolidation
plan: 08
subsystem: ui
tags: [sveltekit, vite, vitest, path-alias, barrel, codemod, source-scan-guard]

requires:
  - phase: 153-build-tooling-config-correctness
    provides: "the `here` constant in apps/frontend/vitest.config.ts, derived from import.meta.url, which this plan's new alias entry is written against"
  - phase: 159-component-context-consolidation
    provides: "159-03's committed effect census and 159-07's shared question rollup, both of which touch files this plan's import rewrite passes through"
provides:
  - "The `$layouts` path alias, registered in all three resolvers (svelte.config.js, the generated .svelte-kit/tsconfig.json, vitest.config.ts)"
  - "src/lib/layouts/main/ holding the nine relocated app-shell components behind a two-level barrel"
  - "noRelativeLayoutImports.test.ts — the third committed source-scan guard, seen red before the rewrite"
  - "Three re-anchored .planning/todos/pending/ register entries"
  - "Dated supersession clauses on Phase 153's two plans for the four claims this phase falsifies"
affects: [158-routing-auth-surface-harmonisation, 163, any phase importing the app-shell components]

actuals:
  tokens: 20700
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Path-alias registration triple: framework config + generated TS path map (never hand-edited) + hand-maintained unit-test resolver, all in one change"
    - "Two-level barrel (outer re-exports inner) for a relocated component family"
    - "Source-scan guard with a path-separator-anchored basename, so a longer name ending in the same word cannot redden it"

key-files:
  created:
    - apps/frontend/src/lib/layouts/index.ts
    - apps/frontend/src/lib/layouts/main/index.ts
    - apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts
  modified:
    - apps/frontend/svelte.config.js
    - apps/frontend/vitest.config.ts
    - apps/frontend/src/routes/README.md
    - .planning/phases/153-build-tooling-config-correctness/153-04-PLAN.md
    - .planning/phases/153-build-tooling-config-correctness/153-09-PLAN.md

key-decisions:
  - "Operator resolved the Phase 153 collision as a dated supersession clause on 153's plans — a refinement of amend-153-directly, not a rewrite: the four falsified claims each gained a `⚠ Superseded 2026-09-03 by Phase 159-08:` clause while the original text stayed intact, because Phase 153 is complete and its plans are records of what ran, not live statements."
  - "Phase 153 landed first (complete in state.json, 11/11 summaries), so Task 2's new alias entry was written against 153-04's derived constant `here`, not a directory-name global — verified by reading vitest.config.ts before editing."
  - "Imports use exactly one spelling, `$layouts/main` (the inner barrel); `$lib/layouts` appears nowhere in source."
  - "Intra-barrel sibling imports stay relative — Header imports ./Banner.svelte, Layout imports ./Header.svelte, three components import their own ./X.type — and the guard excludes the barrel directory by path rather than by pattern."

patterns-established:
  - "Registration triple in one commit: registering an alias in the framework config alone leaves the app and type checker working while the unit suite silently loses resolution."
  - "Guard basenames anchored to a path separator: the first red run flagged SurveyBanner.svelte on `Banner`, proving why an end-anchored-only pattern reddens correct code."

requirements-completed: [REVIEW-CMP-06]

coverage:
  - id: D1
    description: "The $layouts alias resolves in all three resolvers — the framework config for the app, the generated TypeScript path map for the type checker, and the hand-maintained vitest resolver for the unit suite."
    requirement: REVIEW-CMP-06
    verification:
      - kind: other
        ref: "yarn typecheck (svelte-check found 0 errors and 0 warnings)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit (87 files / 1574 tests)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend build (exit 0, adapter-node output written) — proves SSR resolves the alias"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nine named app-shell components relocated out of the file-based router's namespace to src/lib/layouts/main/ behind a two-level barrel, with the route files, +error.svelte and the README left in place."
    requirement: REVIEW-CMP-06
    verification:
      - kind: other
        ref: "find apps/frontend/src/routes -maxdepth 1 -type f | wc -l -> 5 (+error.svelte, +layout.server.ts, +layout.svelte, +layout.ts, README.md)"
        status: pass
      - kind: other
        ref: "ls apps/frontend/src/lib/layouts/main/ | wc -l -> 10"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every importer reaches the relocated components through the alias in exactly one spelling; no relative import of them survives anywhere in the frontend source."
    requirement: REVIEW-CMP-06
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts#finds no relative import of a relocated layout component outside the barrel"
        status: pass
      - kind: other
        ref: "grep -rn '$lib/layouts' apps/frontend/src | wc -l -> 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The relative-import guard is committed and was observed red before the rewrite, naming real offending files and lines."
    requirement: REVIEW-CMP-06
    verification:
      - kind: unit
        ref: "git show 71dadf97a — RED commit; 55 offender file:line pairs recorded in this summary"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every pending-register entry citing a relocated path is re-anchored, found by a conditional sweep over whatever entries existed at execution time."
    verification:
      - kind: other
        ref: "grep -rn 'routes/Banner|routes/Header|routes/Layout|routes/MainContent|routes/MaintenancePage|routes/SingleCardContent' .planning/todos/pending/ | wc -l -> 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "Phase 153's four falsified claims each carry a dated supersession clause, with the original text intact as the record of what that phase executed."
    verification:
      - kind: other
        ref: "gsd-tools verify plan-structure on both amended plans (parses; all tasks intact); grep -c 'Superseded 2026-09-03 by Phase 159-08' -> 6 in 153-04, 1 in 153-09"
        status: pass
    human_judgment: true
    rationale: "The clauses parse and the counts check out, but whether each clause states what actually changed without overstating it is a reading judgment about another phase's committed record — precisely the risk the operator's one-way reversibility rating named. A human should read the six clauses."

duration: 14 min
completed: 2026-09-03
status: complete
---

# Phase 159 Plan 08: The `$layouts` alias and the route-root move — Summary

**Nine app-shell components moved out of SvelteKit's file-based router into `$lib/layouts/main/` behind a two-level barrel, reached through a new `$layouts` alias registered in all three resolvers, with 49 relative imports across 46 files rewritten and a committed source-scan guard that was seen red first.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-03T05:21:47Z
- **Completed:** 2026-09-03T05:36:07Z
- **Tasks:** 3
- **Files modified:** 69 (including 9 renames)

## Accomplishments

- The `$layouts` alias registered in one change across both hand-maintained resolvers, and propagated into the generated TypeScript path map by a sync — the third registration is the one that fails silently, and it landed with the other two rather than after them.
- Nine named files relocated by explicit allow-list. The route root now holds five files: three route modules, the error page and its README. `loginRedirectTarget.ts` — the file Phase 158 owns — had already left; nothing else was swept along.
- 49 import lines across 46 files rewritten to the single string `'$layouts/main'`, replacing five different `../` depths. Three files that imported two components each were merged into one statement.
- A third committed source-scan guard, red before the rewrite over 55 real offender lines and green after.
- Three pending-register entries re-anchored — the conditional sweep found the two Phase 158 G5 todos, which now exist, plus the pre-existing 2026-06-06 entry the research predicted.
- Phase 153's four falsified claims dated rather than rewritten, per the operator's answer.

## Task Commits

1. **Task 1: Cross-phase collision resolution (recorded, then implemented)** — `425c5f378` (docs)
2. **Task 2: Register the alias in both hand-maintained configs** — `6a1f81c36` (feat)
3. **Task 3 RED: the failing relative-import guard** — `71dadf97a` (test)
4. **Task 3 GREEN: move, rewrite, re-anchor** — `455b58801` (refactor)
5. **Residuals filed in the defect ledger** — `071b4ffb0` (docs)

## Task 1 — the operator's answer, recorded verbatim

The checkpoint was `gate="blocking-human"` and the operator had already answered it before execution began. Their answer, as supplied:

> **A DATED SUPERSESSION CLAUSE on Phase 153's plans — a refinement of `amend-153-directly`, NOT a rewrite.**
>
> Their reasoning: this project distinguishes LIVE statements from DATED records. A live statement gets amended in place; a record of what was executed gets a dated correction clause rather than a silent overwrite. Phase 153 is COMPLETE and its gate already passed, so its PLAN files are records of what actually ran. Rewriting them would make them no longer describe what that phase executed.
>
> So, for each of the four falsified claims, ADD a clause beginning `⚠ Superseded 2026-09-03 by Phase 159-08:` that names what changed and why. **Leave the original claim text intact and readable** as what was true at Phase 153's close.

**Which phase landed first, and the consequence for Task 2.** Half the question was settled by measurement before it reached the operator, and that half is fact rather than choice: **Phase 153 has ALREADY LANDED** — `complete` in `.planning/state.json` with 11/11 SUMMARY files present. `apps/frontend/vitest.config.ts` already carries Phase 153 Plan 04's derived constant. Confirmed by reading the file before editing it:

```
6  // ... derive the directory from `import.meta.url` instead of depending on it.
7  const here = fileURLToPath(new URL('.', import.meta.url));
```

The legacy `__dirname` global is gone. **Task 2 therefore wrote this phase's new alias entry against the derived constant `here`.** Writing the legacy form would have failed Phase 153's own comment-filtered scan gate at `153-09-PLAN.md:282`.

### The four clauses, each anchored by content and its line re-measured

Every anchor was located by content before editing, per the standing warning that line anchors in this phase's planning documents have drifted on five consecutive plans. All four cited positions still held.

| # | Falsified claim | Measured line | Clause placed |
|---|---|---|---|
| 1 | Collision surface declared **None**, listing Phases 152 and 163 but not 159 | `153-04-PLAN.md:78-80` | New paragraph after the `None.` paragraph, naming the surface as `{Phase 159 Plan 08}` |
| 2 | Pins "all 11 measured usages" at named line numbers | `153-04-PLAN.md:20` | Appended to the frontmatter truth string (YAML re-parsed valid) |
| 3 | Proves diff scope with "no alias string, key or ordering changes" | `153-04-PLAN.md:160` | Nested sub-bullet, scoping the proof to the commit that plan produced |
| 4 | Pins `Tests 816 passed (816)` | `153-04-PLAN.md:151, 159, 234` and `153-09-PLAN.md:254` | One clause at each of the four, carrying the current measured count |

**The current count was measured, not inherited.** Before any of this plan's own work:

```
Test Files  86 passed (86)
     Tests  1571 passed (1571)
```

That is the number written into the supersession clauses. (The suite ended this plan at 87 files / 1574 tests, the difference being this plan's own guard.)

Both amended plans still parse: `gsd-tools verify plan-structure` reports every task with its `files`/`action`/`verify`/`done` intact on each.

## Task 2 — the registration triple

| Resolver | How it was registered | Proof |
|---|---|---|
| `apps/frontend/svelte.config.js` | `$layouts: path.resolve('./src/lib/layouts')` alongside the three existing entries | app + build |
| `apps/frontend/.svelte-kit/tsconfig.json` | **not hand-edited**; regenerated by `svelte-kit sync` from `kit.alias`. `$layouts` and `$layouts/*` appear at :22-26 | `yarn typecheck` exit 0 |
| `apps/frontend/vitest.config.ts` | `{ find: '$layouts', replacement: path.resolve(here, 'src/lib/layouts') },` at line 31 | unit suite exit 0 |

Ordering holds: the last generated-output override (the paraglide messages mock) ends at line 25; the new entry sits at 31, among the SvelteKit built-ins and after the overrides the file's own comment says must come first. `$layouts` and `$lib` share no prefix (`$la` vs `$li`), so neither shadows the other.

`git diff --name-only` for that task listed exactly `apps/frontend/svelte.config.js` and `apps/frontend/vitest.config.ts` — `apps/frontend/tsconfig.json` was not touched.

## Task 3 — the guard, seen red first

**First red run — and why the guard changed before the move.** The initial pattern matched a basename anywhere after a relative segment, and reddened over **58** lines. Three were false positives:

```
lib/dynamic-components/survey/banner/SurveyBanner.svelte:25
lib/dynamic-components/survey/banner/index.ts:1
lib/dynamic-components/survey/banner/index.ts:2
```

`SurveyBanner` is an unrelated component whose name merely ends in `Banner`. A guard that reddens on correct code gets disabled, so the basename is now anchored between a path separator and the end of the specifier. That correction was found by running the guard, not by inspecting it — which is the point of running it red.

**Second red run, immediately before the move — 55 real offender lines across 51 files.** The failure names each one. First and last of the list:

```
A relocated layout component is imported through a relative path at:
routes/(voters)/(located)/questions/+layout.svelte:42, ...,
routes/candidate/register/password/+page.svelte:24.
Those components live under $layouts/main and are reached through the alias, which
resolves identically from any depth and in all three resolvers. Do not adjust the ../
depth — import from '$layouts/main' instead.
  expected [ …(55) ] to deeply equal []

Test Files  1 failed (1)
     Tests  1 failed | 2 passed (3)
```

**Green after the rewrite:**

```
Test Files  87 passed (87)
     Tests  1574 passed (1574)
```

**The build caches were cleared between the move and the build**, as the plan requires: `yarn dev:clean` (wipes `apps/frontend/.svelte-kit` and `apps/frontend/node_modules/.vite`), `rm -rf .turbo/cache`, then `svelte-kit sync` to regenerate the path map. The subsequent `yarn typecheck` and `yarn lint:check` both reported `Cached: 0 cached, 22 total`, confirming nothing was served from cache.

### Register entries found and re-anchored

The sweep was over whatever existed at execution time, and it mattered — two of the three did not exist when the research was written:

| Entry | Citations re-anchored | Line references |
|---|---|---|
| `2026-08-28-header-style-settings-refactor.md` | 4 (`Header.svelte:44`, `Header.svelte`, `Banner.svelte`) | `Header.svelte:44` still resolves to the `headerStyle` read |
| `2026-08-28-banner-static-component-arbitrary-header-content.md` | 4 (`Banner.svelte:9`, `Banner.svelte`, `Header.svelte`) | `Banner.svelte:9` still resolves to the arbitrary-header-content line |
| `2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md` | 1 (`Banner.svelte:76-84`) | `Banner.svelte:76-84` still resolves to the Results button |

Nine citation lines re-anchored in total, all line references preserved because the moved files' content is unchanged above the `@reference` fix. Bare mentions without a directory (`Banner.svelte:77-83`, `Banner.svelte:11-13`) were left alone — they name the right file and cite no stale path.

## Files Created/Modified

- `apps/frontend/svelte.config.js` — `$layouts` in `kit.alias`
- `apps/frontend/vitest.config.ts` — matching `resolve.alias` entry against the derived constant
- `apps/frontend/src/lib/layouts/index.ts` — outer barrel, `export * from './main'`
- `apps/frontend/src/lib/layouts/main/index.ts` — inner barrel, nine modules alphabetically, component + type where a type module exists
- `apps/frontend/src/lib/layouts/main/{Banner,Header,Layout,MainContent,MaintenancePage,SingleCardContent}.svelte` and `{Layout,MainContent,MaintenancePage}.type.ts` — the nine relocated files
- `apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts` — the guard
- 46 importer files under `apps/frontend/src/routes/` — rewritten to `$layouts/main`
- `apps/frontend/src/routes/README.md` — re-describes the directory
- 3 files under `.planning/todos/pending/` — re-anchored
- `.planning/phases/153-build-tooling-config-correctness/153-04-PLAN.md`, `153-09-PLAN.md` — supersession clauses

## Decisions Made

- **Alias spelling: `$layouts/main`, the inner barrel.** `$lib/layouts` and `$layouts` resolve to overlapping directories, so exactly one is in use and the other appears nowhere in source (`grep -rn '$lib/layouts' apps/frontend/src` returns 0). A mixed set would type-check and run while defeating the alias.
- **Intra-barrel siblings stay relative and are excluded by path, not by pattern.** `Header.svelte` imports `./Banner.svelte`, `Layout.svelte` imports `./Header.svelte`, and three components import their own `./X.type`. Routing peers in one directory through the alias would be circular indirection. The exclusion is asserted by its own test, which also fails if the barrel directory ever empties, so the exclusion cannot go hollow unnoticed.
- **The `matchMedia` gap was fixed with the house per-file stub, not a global setup file.** `PasswordSetter.svelte.test.ts:19-22` is the existing precedent for exactly this cause; a `setupFiles` entry would have changed the environment for all 87 suites to fix two.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two `@reference` paths to the tailwind theme broke on the move**

- **Found during:** Task 3, at the production build
- **Issue:** `Banner.svelte:105` and `Header.svelte:101` carry `@reference "../tailwind-theme.css"` inside their `<style>` blocks. That is a CSS-side relative path, not a `from '...'` module import, so it was invisible to the import census and to the guard. After the move it pointed one level above `src/lib/layouts/`, and the build failed: `Can't resolve '../tailwind-theme.css' in .../src/lib/layouts/main`.
- **Fix:** re-depthed both to `"../../../tailwind-theme.css"`, matching every other `lib/components/*/` component in the tree.
- **Files modified:** `apps/frontend/src/lib/layouts/main/Banner.svelte`, `Header.svelte`
- **Verification:** `yarn workspace @openvaa/frontend build` exit 0 after the fix; the moved directory was re-scanned for other relative asset paths and holds none.
- **Committed in:** `455b58801`
- **Note:** this is exactly the failure the plan's production-build requirement exists to catch. Typecheck and the unit suite were both green while the build was broken.

**2. [Rule 3 - Blocking] Two page suites lost their import-time environment to the barrel**

- **Found during:** Task 3, immediately after the import rewrite
- **Issue:** `routes/candidate/(protected)/termsOfUseLayout.svelte.test.ts` and `routes/admin/(protected)/jobs/jobsPage.svelte.test.ts` failed at import with `window.matchMedia is not a function`. Importing one name from the barrel loads all nine components, so `Header.svelte` — and through it the candidate logout button's `TimedModal`, which pulls `svelte/motion` — entered their module graph for the first time. `svelte/motion` reads `matchMedia` at module-evaluation time and jsdom does not implement it.
- **Fix:** added the house `matchMedia` stub already used at `PasswordSetter.svelte.test.ts:19-22`, placed above each suite's `await import(...)` of the component so it runs first, with a comment naming the barrel as the new cause.
- **Files modified:** the two test files
- **Verification:** `yarn workspace @openvaa/frontend test:unit` — 87 files / 1574 tests, 0 failed.
- **Committed in:** `455b58801`

**3. [Rule 1 - Bug] The routes README described a directory that no longer exists**

- **Found during:** Task 3, after the move
- **Issue:** `apps/frontend/src/routes/README.md` asserted that `Layout.svelte`, `Header.svelte`, `MainContent.svelte`, `SingleCardContent.svelte`, `Banner.svelte` and `MaintenancePage.svelte` sit directly in that directory. After the move that paragraph is false, and it is the first thing a reader of the route tree meets.
- **Fix:** rewrote the paragraph to state that `+error.svelte` is the only non-route file left, name the new location and the alias, give the canonical import form, and point at the guard. Followed the shape of the sentence already there about `loginRedirectTarget.ts` having left in Phase 158.
- **Files modified:** `apps/frontend/src/routes/README.md`
- **Verification:** `prettier --check` clean; repo-wide grep finds no other code or doc citing the old locations.
- **Committed in:** `455b58801`

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 3 blocker)
**Impact on plan:** all three were caused directly by this task's move and all three were caught by the plan's own verification chain — the build for the first, the unit suite for the second, a post-move doc sweep for the third. No scope creep; no file outside the move's blast radius was changed to make a check pass.

## Issues Encountered

**One acceptance criterion is unsatisfiable as written, and was not gamed.**

The plan asks that `grep -rl '\$layouts' apps/frontend/src | wc -l` return **51 or more**. Measured: **49**. The arithmetic:

- The research census counted **51 distinct files** holding a relative import of the nine components.
- **Five of those 51 are the moved components themselves** (`Header`, `Layout`, `MainContent`, `MaintenancePage`, `SingleCardContent`), whose intra-barrel sibling imports correctly stay relative and must never become alias imports.
- So at most **46** files could ever carry the alias, and all 46 do. The measured 49 is those 46 plus three files that name `$layouts/main` in prose (the guard and the two `matchMedia` stub comments).

51 was never reachable by a correct implementation. The invariant the criterion exists to protect — zero surviving relative imports of the nine, exactly one alias spelling — is verified directly and is green: 0 `../`-form imports for each of the six names, 0 occurrences of `$lib/layouts`, and the guard passing. Filed in the defect ledger rather than satisfied by sprinkling the alias into files that do not need it. This is the fifth consecutive plan in this phase whose acceptance greps needed re-measurement.

**A pre-existing `format:check` failure was left alone.** `yarn format:check` fails on `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte.test.ts`, unmodified by this plan and last touched by `65ba96fdc` (159-02). Per the executor scope boundary it was not fixed; `yarn lint:check`, which is the plan's verification command, exits 0. Filed in the ledger.

**Six `816` pins outside the operator's named scope survive.** The operator named `153-04-PLAN.md:151,159,234` and `153-09-PLAN.md:254`; those four were amended. Six further occurrences remain in `153-04-PLAN.md` (lines 23, 26, 195, 205, 219, 225) and three in `153-09-PLAN.md` (285, 353, 547). The 153-09 clause states in prose that every other occurrence is superseded on the same date and for the same reason, but a reader landing directly on one of them still sees the stale number. Filed in the ledger rather than expanded into unilaterally.

## Known Stubs

None. The two barrels were created empty in Task 2 and filled in Task 3; `main/index.ts` now re-exports all nine modules and `layouts/index.ts` re-exports it.

## Threat Flags

None. This plan added no network endpoint, auth path, file-access pattern or schema change. The threat register's four `mitigate` dispositions were all discharged:

| Threat ID | Discharge |
|---|---|
| T-159-23 alias registration drift | Both hand-maintained resolvers registered in one task; typecheck, unit suite and production build all run and all green |
| T-159-24 accidental route exposure | Nine files moved by explicit allow-list; the route root holds only route files, the error page and the README |
| T-159-25 staled register anchors | Conditional sweep found three entries, all re-anchored; stale-citation grep returns 0 |
| T-159-26 stale build cache | `dev:clean` + `.turbo/cache` removed + `svelte-kit sync` between the move and the build; the following turbo runs reported 0 cached of 22 |

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

- The alias is live in all three resolvers, so any later plan can import from `$layouts/main` without further config work.
- The guard is committed and green; a future author who reintroduces a relative path to one of the nine gets a named file and line rather than a silent regression.
- The route root is now clean for Phase 158's `loginRedirectTarget.ts` work — nothing this plan touched overlaps it, and the file had already left before execution began.
- **Open for a human:** the six supersession clauses on Phase 153's plans (coverage D6). They parse and count correctly, but whether each states what changed without overstating it is a reading judgment about another phase's committed record.
- **REVIEW-CMP-06 stays `Pending` in REQUIREMENTS.md.** `requirements-completed` above copies this
  plan's frontmatter verbatim, but the shared-ID gate blocks the actual tick: `159-11-PLAN.md` also
  declares REVIEW-CMP-06 and has no SUMMARY yet, so `requirements.ready-ids` reports 0/1 ready. The
  requirement's other half — `Alert.svelte:117`'s semantic class, owned by 159-04 — is already done;
  159-11 is what the tick is waiting on. An initial `mark-complete` was reverted rather than left.
- **Not run:** no E2E suite. `159-CONTEXT.md` § O5 budgets one full-suite run at phase level, in plan 159-11. This plan changed no runtime behaviour — the nine components moved with their prop contracts and content unchanged, and the production build resolves them server-side — but that budgeted run is where the cardinal-rule evidence comes from.

## Self-Check: PASSED

Created files verified present on disk:

- `apps/frontend/src/lib/layouts/index.ts` — FOUND
- `apps/frontend/src/lib/layouts/main/index.ts` — FOUND
- `apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts` — FOUND
- all nine relocated files under `apps/frontend/src/lib/layouts/main/` — FOUND (directory holds 10 entries)

Commits verified in `git log`: `425c5f378`, `6a1f81c36`, `71dadf97a`, `455b58801`, `071b4ffb0`.

Plan-level verification re-run at final HEAD:

- `yarn typecheck` → exit 0
- `yarn workspace @openvaa/frontend test:unit` → exit 0, 87 files / 1574 tests
- `yarn workspace @openvaa/frontend build` → exit 0
- `yarn lint:check` → exit 0
- `grep -rn '$lib/layouts' apps/frontend/src | wc -l` → 0
- stale register citations → 0

One acceptance criterion measured 49 against a stated 51-or-more; it is unsatisfiable by any correct implementation, is documented above with its arithmetic, and is filed in the defect ledger.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-03*
