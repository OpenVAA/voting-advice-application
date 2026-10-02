# Spike 036 — Context topology audit

**Question (project owner):** What is the actual benefit of using multiple separate Svelte contexts (app, voter, candidate, admin, data, filter, layout, i18n, component, auth) compared with fewer contexts or a single one?

**Method:** read-only static audit of `apps/frontend/src` on branch `spike/drawer-context-scoping`. Consumer counts come from `grep -l "get<X>Context("` over `lib/` and `routes/`, excluding `lib/contexts/` itself. Import reachability comes from the transitive-import walker `.planning/spikes/035-drawer-context-scoping/context-closure.mjs`. Nothing was built or run. Citations name a file plus an identifier, never a line number.

---

## 0. Bottom line

1. **Keep voter, candidate and admin as separate contexts scoped to their subtrees (status quo, alternative A).** The split gives three concrete, verifiable things:
   - **Lifecycle.** Each context is created when its subtree mounts and destroyed when it unmounts, along with its `$effect`s.
   - **Namespace separation.** 8 member names mean different things in `VoterContext` and `CandidateContext`, and `userData` means different things in candidate and admin.
   - **Server-side isolation per request.** Every context instance belongs to one request's component tree.

   A single app-wide context (C) or module-level singletons (D) would give these up.
2. **What the split does not deliver:**
   - **Code splitting.** It is effectively absent for voter and candidate context code. The shared `Layout → Header → Banner` chain statically imports both `getVoterContext` and the candidate `LogoutButton`, so matching and filters code ships to the candidate and admin apps, and candidate context code ships to the voter app.
   - **Mutual exclusion enforced by the type system.** Shared components instead check a runtime `appType` flag before calling the subtree getter.
3. **Most of the pain is not caused by having many contexts.** It comes from the **inheritance design**: `VoterContext`, `CandidateContext` and `AdminContext` are each typed `AppContext & …` and re-expose every app member on their own instance. That design is what forces:
   - `inheritContextMembers`,
   - the "own-enumerable or it silently disappears" discipline in `AppContextProvider`,
   - 81 redeclaration lines (27 × 3),
   - a 205-line spread regression test,
   - two different shapes for `darkMode`.
4. **The DrawerHost/ContextBridge friction is caused by where the host is placed, not by how many contexts there are.** Both openers (`EntityDrawerOpener`, `QuestionExtendedInfoButton`) live under `routes/(voters)/(located)/`. A host mounted in `routes/(voters)/+layout.svelte` would see voter and filter contexts natively and would need no bridge. Among the context alternatives, only C (and the unsafe D) remove the bridge. B does not.
5. **Recommended action (low cost):** keep A, and do three targeted cleanups (§6):
   - fix the live destructure trap in `Image.svelte` and unify the `darkMode` shape;
   - fold the two contexts that have zero external consumers, `i18n` and `data`, into the app provider's internals (optional);
   - decide on the DrawerHost placement on its own merits.

   A larger optional step, "flatten, don't merge" (§5, option E), removes the inheritance machinery. That is where the real complexity lives.

---

## 1. Per-context inventory

| Context | Initialised in | Composes / depends on (type + provider) | Owned state | Constructor `$effect`s / side effects | External consumers (prod) | Tests that `vi.mock` it |
|---|---|---|---|---|---|---|
| **i18n** | `routes/+layout.svelte` (`initI18nContext`) | none; plain object `{ locale: getLocale(), locales, t, translate }` | none (stable refs; `locale` is fixed for the page lifecycle) | none | **0** (only `componentContext`, `dataContext` read it) | 1 |
| **component** | root layout (`initComponentContext`) | type `ComponentContext = I18nContext & { darkMode }`; `ComponentContextProvider` does `Object.assign(this, getI18nContext())` | `#darkMode = new DarkMode()` (matchMedia listener, browser only) | none (DarkMode adds a `change` listener) | **57** (43 `lib/components`, 6 `dynamic-components`, 5 `lib/candidate`, 2 `layouts`, 1 `lib/admin`) | 9 mock calls |
| **data** | root layout (`initDataContext`) | reads `getI18nContext()` for `locale`/`t` formatters | the single `DataRoot` (stable identity) + `#version` bridge | `dataRoot.subscribe` → `#version++` | **0** (only `appContext` reads it) | 2 |
| **app** | root layout (`initAppContext`) | type `AppContext = Omit<ComponentContext,'locale'\|'locales'\|'darkMode'> & DataContext & TrackingService & {…}`; provider forwards componentCtx selectively, dataCtx via `inheritContextMembers`, tracking selectively | `appType`, merged `appSettings`, `appCustomization`, `userPreferences` (localStorage), popup queue, tracking, survey, `getRoute` | 2 `$effect`s (appSettings / appCustomization re-merge on `page.data` change) | **27** (16 `dynamic-components`, 4 `layouts`, 4 `routes/(voters)`, 1 each candidate/admin routes, 1 `lib/candidate`) | 1 |
| **layout** | root layout (`initLayoutContext`) | none | top-bar / page-style / navigation overlays, progress tween, route title, `VideoController` | `beforeNavigate` / `afterNavigate` hooks; `setRouteTitle` registers per-caller `$effect` | **32** (13 `routes/candidate`, 8 `routes/(voters)`, 2 `routes/admin`, 5 `layouts`, 4 `dynamic-components`) | 2 |
| **auth** | root layout (`initAuthContext`; source carries `TODO: Consider moving the candidate and admin apps to a (auth) folder`) | none | `isAuthenticated = $derived(!!page.data.session)` + 4 DataWriter wrappers | none | **1** (`dynamic-components/logoutButton/LogoutButton.svelte`) + consumed internally by candidate and admin | 1 |
| **voter** | `routes/(voters)/+layout.svelte` (`initVoterContext`) | type `VoterContext = AppContext & {…}`; `VoterContextProvider` calls `inheritContextMembers(this, getAppContext())` | answers (localStorage `VoterContext-answerStore`), selected elections/constituencies, question categories/blocks, `MatchingAlgorithm`, `matchState`, `nominationAndQuestionState`, `filterState`, `firstQuestionId` (sessionStorage) | **5 `$effect`s** (selectedElections, selectedConstituencies, question roll-up, category seeding, question blocks) and `initFilterContext(...)` | **19** (13 `routes/(voters)`, 4 `dynamic-components`, 1 `layouts`, 1 `components` = `ContextBridge`) | 0 |
| **filter** | inside `VoterContextProvider` constructor (`initFilterContext`) | closes over voter's `#entityFilters` + `#currentResultsEntityType` | `#version` bridge over the active `FilterGroup` | 1 `$effect` (FilterGroup `onChange` subscription). It reads `#currentResultsEntityType`, which reads `#matches.value`, **so it pulls matching eagerly** | **1** (`EntityListWithControls.svelte`); also exposed as `voterCtx.filterContext` | 0 (own harness tests) |
| **candidate** | `routes/candidate/+layout.svelte` (`initCandidateContext`) | type `CandidateContext = AppContext & AuthContext & {…}`; inherits app via `inheritContextMembers`, auth via `Object.assign` minus `logout` (overridden by prototype getter) | the logged-in candidate's `userData` (saved data + localStorage-edited answers), pre-registration state (session/localStorage), question roll-ups derived from the candidate's own nominations | **3 `$effect`s** (selectedElections, selectedConstituencies, question roll-up) + 1 in `candidateUserDataState` (clears edits when `answersLocked`) | **26** (23 `routes/candidate`, 2 `dynamic-components`, 1 `lib/candidate`) | 1 |
| **admin** | `routes/admin/+layout.svelte` (`initAdminContext`) | type `AdminContext = AppContext & AuthContext & {…}`; inherits app via `inheritContextMembers`, forwards 5 auth members by hand | `userData`, `jobs = jobStates()` (polling only after `startPolling`, called from `WithPolling.svelte`) | none (documented "adminContext has NO `$effect`") | **13** (7 `routes/admin`, 3 `lib/admin`, 2 `lib/components/controller`, 1 `dynamic-components`) | 2 |

The only other `setContext` in the tree is `navGroupContext.ts` (a boolean `NavGroup` flag).

**Totals:** 176 production consumer references across 10 getters (some files call several getters). Context-module mocks: 19 `vi.mock` calls in **11** test files. `component` accounts for 9 of them.

### 1a. Dependency graph (construction order)

```
i18n ──► component ──┐
  └────► data ───────┴─► app ──┬─► voter ──► filter      (routes/(voters)/+layout)
                               ├─► candidate ◄── auth     (routes/candidate/+layout)
layout (independent)           └─► admin     ◄── auth     (routes/admin/+layout)
auth (independent, root)
```

The graph is a strict chain. Every subtree context type is `AppContext & …`, so the voter, candidate and admin contexts are each a **superset** of app, not a sibling of it.

---

## 2. Lifecycle: what hoisting to root would cost or break

| Context | Needs create-on-enter / destroy-on-leave? | Cost if constructed app-wide at root | What breaks or leaks if hoisted |
|---|---|---|---|
| voter | **Yes.** 5 effects + filter effect run on every `dataRoot` / URL-param change | Question roll-up (`rollUpQuestionCategories`) and the filter effect would run on **every navigation in the candidate and admin apps**. The filter `$effect` reads `#currentResultsEntityType` → `#matches.value`, so when `selectedElections` resolves to a single election (the `$derived.by` fallback), **matching is computed on candidate and admin pages** against voter answers from localStorage. `matchState`, `nominationAndQuestionState` and `filterState` are lazy `$derived`, but the filter effect defeats the laziness | `initFilterContext`'s single-init guard would become "once per tab" instead of "once per voter subtree mount". `appType.set('voter')` (voter layout) would no longer tell you which context exists. The `(voters)` layout's `onMount` popup queueing assumes it runs once per entry |
| candidate | **Yes.** `userData` is the logged-in candidate's private record | 3 effects + `candidateUserDataState` effect; cheap while `userData.current` is undefined | **In-memory retention:** today leaving `/candidate` destroys the instance. At root, the candidate's saved data and unsaved edits would stay in memory while the same tab browses the voter app, and would be cleared only by `#reset` on `logout`. Both apps populate the one shared `DataRoot` differently (candidate `(protected)/+layout.svelte` deliberately does **not** call `provideNominationData`), so the two sets of effects would react to each other's writes |
| admin | Weakly | Near zero: no effects; `jobStates` polls only after `startPolling` | Nothing functional. Admin is the one context that could be hoisted cheaply, and also the one with no reason to be |
| auth | No (already at root) | 1 `$derived` | none |
| app / component / data / i18n / layout | No; they are app-wide by nature and already at root | n/a | n/a |

**Server-side isolation per request (adapter-node):** `setContext` state belongs to the component tree, so on the server each request gets fresh instances. This holds for A, B and C alike. It is lost only in D (§5).

---

## 3. Mutual exclusion and guards

- **No subtree needs voter together with candidate or admin.** No route file calls two of `getVoterContext` / `getCandidateContext` / `getAdminContext`.
- **Shared components that reach a subtree context** (4 files): `EntityCard.svelte`, `EntityDetails.svelte`, `QuestionHeading.svelte` (voter **and** candidate) and `layouts/main/Banner.svelte`. All four guard with `appType.current === 'voter' ? getVoterContext() : undefined` (or the `'candidate'` equivalent).
- **`hasContext` outside `lib/contexts/`: 0 uses.** The `appType` flag is a hand-rolled substitute. It works only because each subtree layout calls `appType.set(...)` before its children initialise. If that ordering were violated, the getter would throw `error(500, 'getVoterContext() called before initVoterContext()')`.
- **Name collisions**, the strongest evidence against merging subtree contexts onto one object. `VoterContext` ∩ `CandidateContext` own members: `selectedElections`, `selectedConstituencies`, `electionsSelectable`, `constituenciesSelectable`, `infoQuestions`, `infoQuestionCategories`, `opinionQuestions`, `opinionQuestionCategories` (**8**).
  - The two sides compute these differently. Voter selections come from the URL params `electionId`/`constituencyId` and filter out hidden questions. Candidate selections come from the candidate's own `nominations`, with `entityType: Candidate`.
  - `CandidateContext` ∩ `AdminContext`: `userData` (different types).
  - `logout` is overridden in candidate: it wraps auth logout with a redirect and `#reset`.

  Merging the subtree contexts onto one object therefore forces namespacing (`ctx.voter.selectedElections`), and that reproduces the separation by hand.

---

## 4. Code splitting, testability, destructure trap

### 4a. Code splitting: the claimed benefit is mostly absent

Static import walk, `context-closure.mjs`:

| Entry | reaches `getVoterContext` | reaches `getCandidateContext` | reaches `getAdminContext` |
|---|---|---|---|
| `routes/+layout.svelte` | yes, via `$layouts/main` barrel → `Banner.svelte` | yes, `Banner` → `$candidate/components/logoutButton` | no |
| `routes/candidate/+layout.svelte` | **yes**, `Layout` → `Header` → `Banner` | yes | no |
| `routes/admin/+layout.svelte` | **yes**, same chain | yes | yes |

Consequences:
- `voterContext.svelte.ts`, which imports `MatchingAlgorithm` from `@openvaa/matching` and `FilterGroup` plus 5 filter classes from `@openvaa/filters`, is statically reachable from the candidate and admin apps.
- `candidateContext.svelte.ts` is reachable from the voter app.
- Only admin context code is kept out of the other two apps.
- The root barrel path might be tree-shaken; the direct `Banner` imports cannot be.
- Splitting the contexts saves **runtime work** (instances and effects), **not bytes**. Making it save bytes would require `Banner` and `QuestionHeading` to stop importing subtree getters statically, for example by having the subtree layout pass in a snippet or prop.

### 4b. Testability

- 11 test files mock context modules. The most common pattern is to mock `$lib/contexts/component` with a 2–3 member fake: `{ t, darkMode }` or `{ locale, locales, t }`. Examples: `Input.svelte.test.ts`, `QuestionChoices.svelte.test.ts`, `PasswordSetter.svelte.test.ts`.
- **This is a real but modest benefit of the split.** The 43 base components in `lib/components` depend only on `ComponentContext` (i18n + darkMode), not on `AppContext`/`DataRoot`/tracking. Their tests mock one small module, and the base layer is architecturally decoupled from app state.
- Mocks are untyped partial objects (`getAdminContext: () => ({ t, getRoute, jobs, … })`). A merged root context would still allow the same partial fake, so the mocking cost of B is small. What B would lose is the layering guarantee, not mockability.
- The orchestrator tests (`candidateContext.svelte.test.ts`, `appContext.spread.svelte.test.ts`) have to mock their **upstream** contexts plus `inheritContextMembers`. That cost comes from the inheritance design.

### 4c. The destructure trap: how the split affects exposure

- The trap depends on each **member's shape** (stable reference vs reactive accessor), not on how many contexts there are. Merging contexts neither adds nor removes trap-prone members. Inheritance **does** multiply the places each reactive accessor is reachable from: `appSettings`, `dataRoot` and `locale` exist on app, voter, candidate and admin, and each is a separate forwarding accessor.
- Destructuring counts `const { … } = get<X>Context()`:

  | Context | Destructuring sites |
  |---|---|
  | component | 51 |
  | layout | 32 |
  | app | 9 |
  | candidate | 5 |
  | admin | 5 |
  | auth | 1 |

  The component and layout contexts are almost all stable references, so destructuring them is normally safe. That is an argument for **keeping** a narrow, stable-only surface like component.
- **Live defect found:** `lib/components/image/Image.svelte` does `const { darkMode } = getComponentContext();`. On `ComponentContextProvider`, `darkMode` is a prototype **getter** over `DarkMode.#dark` (`$state`, updated by a `matchMedia` `change` listener). Destructuring freezes it, so images do not switch to their dark variant when the OS theme changes after mount.
- The same member has **two shapes**: a bare `boolean` on `ComponentContext`, and `{ readonly current: boolean }` on `AppContext` (`appContext.type.ts`, the `Omit<ComponentContext, … 'darkMode'>` override). `Header.svelte` and `AppLogo.svelte` read `darkMode.current` correctly; `Image.svelte` does not. The split plus override is what created the inconsistency.

---

## 5. Alternatives evaluated

### A. Status quo: 10 contexts, subtree ones per subtree

- **Keeps:** lifecycle scoping (§2), namespace separation (§3), server-side isolation per request, the narrow component surface for 43 base components.
- **Costs today:**
  - `inheritContextMembers` (42 lines + 74-line test);
  - 27 `readonly X!: AppContext[...]` redeclarations in each of voter, candidate and admin (81 lines);
  - the own-enumerable discipline in `AppContextProvider`;
  - `appContext.spread.svelte.test.ts` (205 lines);
  - the `logout` override landmine in `CandidateContextProvider`;
  - the `darkMode` dual shape;
  - the `appType` runtime guards;
  - 79 comment lines about spread and own-enumerability across the non-test context sources.
- **Bridge:** needed while `DrawerHost` sits in the root layout.

### B. Merge the root six (i18n + component + data + app + layout + auth) into one root context; subtree contexts unchanged

- **Improves:**
  - removes 2 contexts that nobody outside `lib/contexts` consumes (i18n, data);
  - removes the component → app selective forward and the `darkMode`/`locale`/`locales` override divergence;
  - one `init` call at root.
- **Breaks or worsens:**
  - base components (57 consumers of `getComponentContext`) would depend on the full app surface unless `getComponentContext()` stays as a narrow, typed view of the same object;
  - layout context (32 consumers) is a separate concern with its own `beforeNavigate`/`afterNavigate` hooks, and merging it gains nothing.
- **Does not remove:** the inheritance machinery, because voter, candidate and admin still inherit root members.
- **Does not remove the ContextBridge**, because voter and filter stay per-subtree.
- **Migration:**
  - near 0 consumer files if `getComponentContext` / `getLayoutContext` / `getAuthContext` remain as aliases or views;
  - otherwise up to 57 + 27 + 32 + 1 = 117 file references;
  - internal: 6 provider modules.
- **Risk:** low. Benefit: modest.

### C. One app-wide context at root; voter, candidate and admin state created lazily

- **Improves:**
  - **removes the ContextBridge** and `getAllContexts()` capture in `EntityDrawerOpener` / `QuestionExtendedInfoButton`;
  - removes the 4 `appType` guards;
  - one getter.
- **Breaks:**
  - the 8 + 1 name collisions force namespacing (`ctx.voter.*`, `ctx.candidate.*`), which touches all **58** subtree consumer files (19 + 26 + 13);
  - "lazy" is hard to get right: the voter effects must not run on candidate or admin routes (§2: the filter effect computes matching eagerly), so each sub-state still needs an explicit start/stop tied to route entry, which is what subtree mounting does today for free;
  - candidate `userData` would be retained in memory across app switches;
  - init-once guards become per-tab.
- **Risk:** high. It replaces a framework-provided lifecycle with a hand-written one, in the exact area (effects, `untrack`, `$state` mirrors) where this codebase has shipped reactivity defects before (see CLAUDE.md Context Destructuring Rule history).

### D. Module-level singletons (no Svelte context) for app-global state

- **Server-side leakage between requests (adapter-node; one module instance serves all requests):**
  - `locale` is resolved per request through `paraglideMiddleware` in `hooks.server.ts`, and `DataRoot` is constructed with `{ locale }` and `t`-based formatters in `initDataContext`;
  - `appSettings`/`appCustomization` are merged from `page.data` in a **field initializer** that deliberately runs on the server;
  - `isAuthenticated` derives from `page.data.session`;
  - candidate `userData` is per user.

  All of these would be shared across concurrent requests. Rendering one user's locale or settings, or worse a candidate's data, into another user's response is a correctness and privacy failure.
- **Safe only for browser-only state behind a `browser` guard.** There is already a precedent: `drawerHostState.svelte.ts` exports `drawerHost = new DrawerHost()`, whose `open` returns early when `!browser`. `DarkMode` (browser-only `matchMedia`) would also qualify.
- **Improves:** removes the bridge for any state hoisted this way.
- **Verdict:** not viable for app, data, i18n, auth, voter or candidate state. Acceptable only case by case for browser-only UI singletons.

### E. (Recommended larger option) "Flatten, don't merge": keep the subtree boundaries, drop inheritance

Voter, candidate and admin contexts would expose **only their own members**. Consumers that need app members call `getAppContext()` as well.

- **Removes:**
  - `inheritContextMembers` and its test;
  - the 81 redeclaration lines;
  - the own-enumerable/spread constraint on `AppContextProvider`, and with it most of `appContext.spread.svelte.test.ts`;
  - the `logout` override clobber hazard;
  - the duplicated accessor chain for `appSettings`/`dataRoot`/`locale`.
- **Migration:** files that call a subtree getter without `getAppContext()` and use app members (heuristic): voter 14, candidate 25, admin 12, about **51 files**, each gaining one extra getter call. That is mechanical and fits a codemod.
- **Does not remove the ContextBridge.**
- **Risk:** low to moderate. It is a surface change and needs a full E2E run, per the E2E hard rule.

### Summary matrix

| | Lifecycle scoping | Name-collision safety | SSR isolation | Removes ContextBridge | Removes inheritance machinery | Consumer files touched | Risk |
|---|---|---|---|---|---|---|---|
| A status quo | ✔ | ✔ | ✔ | ✘ | ✘ | 0 | — |
| B merge root six | ✔ | ✔ | ✔ | ✘ | ✘ (partial: component → app forward only) | ~0 with aliases / ≤117 without | low |
| C single app-wide | ✘ (hand-written) | ✘ (needs namespacing) | ✔ | ✔ | ✔ | ≥58 + guards | high |
| D module singletons | ✘ | n/a | **✘ leak** | ✔ | ✔ | many | unacceptable |
| E flatten subtree contexts | ✔ | ✔ | ✔ | ✘ | ✔ | ~51 | low–moderate |
| Move `DrawerHost` to `(voters)/+layout.svelte` (orthogonal) | ✔ | ✔ | ✔ | **✔** | ✘ | 2–3 (root layout, voters layout, host/opener docs) | low |

---

## 6. Recommendation

**Keep the per-subtree voter, candidate and admin contexts.** Their benefit is concrete: framework-managed create/destroy of 8 constructor `$effect`s plus filter and matching work, isolation of the candidate's private data to `/candidate`, and 8 + 1 same-named members with different semantics kept apart. Server-side isolation per request comes free with any context-based design, and D forfeits it.

**Do not adopt C or D.** C trades the drawer bridge (one small component) for a hand-written lifecycle and a ≥58-file namespacing migration. D leaks per-request state on adapter-node.

In order of value per unit of cost:

1. **Fix the live trap:** `Image.svelte` should read `getComponentContext().darkMode` inside the template or a `$derived`, not destructure it. Then unify `darkMode` to one shape across `ComponentContext` and `AppContext`.
2. **Resolve the drawer friction where it actually arises.** Both openers live under `routes/(voters)/(located)/`. Mounting `DrawerHost` in `routes/(voters)/+layout.svelte` (stable across voter navigation, above the `(located)` `ready`/`<Loading/>` swap) would give hosted content voter and filter contexts natively, and would make `ContextBridge` and the `getAllContexts()` capture unnecessary. Keep the root host plus bridge only if a candidate-app or admin-app drawer is planned. That is a product decision, not a context-topology one.
3. **Optional (B-lite):** fold `i18n` and `data` into `AppContextProvider` internals. They have 0 external consumers. Keep `getComponentContext()` as the narrow stable surface for base components and `getLayoutContext()` as is.
4. **Optional (E):** if the forwarding and own-enumerability machinery keeps costing review time, flatten the subtree contexts so they stop re-exposing `AppContext`. This removes the largest block of incidental complexity at a cost of about 51 mechanical consumer edits.
5. **Record accurately** (docs and `lib/contexts/README.md`) that the split does **not** keep voter or candidate context code out of the other apps' bundles. `Banner.svelte` and `QuestionHeading.svelte` import both getters statically. If bundle separation matters, that import chain is what to change.

---

### Caveats

- Consumer counts are file-level grep counts. A file that calls a getter twice counts once.
- The "relies on inherited app members" figures in E are a keyword heuristic (`t`, `getRoute`, `appSettings`, `dataRoot`, …) over files that do not also call `getAppContext()`. Treat them as ±20%.
- Reachability is static import reachability, not measured chunk contents. No build was run.
- The claim that the filter `$effect` computes matching eagerly on non-voter routes if voter is hoisted is inferred from the dependency chain (`FilterContextProvider.#filterGroup` → `#currentEntityType()` → `VoterContextProvider.#currentResultsEntityType` → `#matches.value`). It was not measured.
