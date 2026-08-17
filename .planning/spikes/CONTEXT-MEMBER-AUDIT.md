# Context Member Audit — preparation for class-conversion re-evaluation

**Date:** 2026-06-12
**Purpose:** Enumerate every state / derived / method / prop exposed by every context
factory in `apps/frontend/src/lib/contexts/`, classify each by reactivity + write
pattern, and group them to prepare a re-evaluation against Svelte 5 best practices
([best-practices](https://svelte.dev/docs/svelte/best-practices) — *"use classes with
`$state` fields to share reactivity between components, instead of using stores"* —
and [context](https://svelte.dev/docs/svelte/context)).

**Central question being prepared:** can each context become a `class` with `$state` /
`$derived` fields (set into context via `setContext`, read via `getContext`), retiring
the getter-handle / `{ current }` / version-bridge intricacies?

> **Read this with spikes 017–019.** 017 (write-side `.instance` eliminable), 018
> (producer reads only re-spellable, not removable), 019 (destructure trap is
> orthogonal and the bare getter is the trap-prone shape). The class-conversion
> question is the natural successor: a class `get`/`$derived` field has the *same*
> destructure semantics as a bare getter (019 applies unchanged), but `this`-bound
> `$state` fields are mutate-in-place by default (changes the Group-A calculus).

---

## Part 1 — Master table (every returned member)

Type legend: `$state` = mutable rune cell · `$derived` = computed (read-only) ·
`getter→$derived` = getter wrapping a $derived · `{current} handle` = stable object
with reactive `.current` getter (± `.set/.update`) · `version-bridge` = getter reading a
`version++` counter over a stable mutate-in-place singleton · `method` · `const ref` =
stable non-reassigned sub-store/instance.

### app/appContext.svelte.ts — `initAppContext()`

| prop | type | write pattern | note |
|------|------|---------------|------|
| locale | {current} handle | never written | forwards ComponentContext.locale |
| locales | {current} handle | never written | forwards ComponentContext.locales |
| darkMode | {current} handle | never written | forwards ComponentContext.darkMode |
| appType | {current} handle + set/update | primitive reassign | `appTypeValue` |
| appCustomization | {current} handle + set/update | **wholesale (= data)** | AppCustomization object |
| appSettings | {current} handle + set/update | **wholesale (= mergeAppSettings(...))** | merge(static,dynamic,page.data) |
| reactiveAppSettings | {current} handle | never written | mirror of appSettings cell |
| reactiveLocale | {current} handle | never written | mirror of locale |
| getRoute | {current} handle | never written | wraps `$derived.by` RouteBuilder |
| surveyLink | {current} handle | never written | `surveyLink()` producer `$derived.by` |
| userPreferences | {current} handle + set/update | **wholesale (= newObj)** | localStorageState persisted |
| popupQueue | const ref (PopupStore) | wholesale (`queue=[...]`/`.slice`) | push/shift methods + current |
| openFeedbackModal | {current} handle + set | primitive reassign (fn) | `(()=>void)\|undefined` |
| sendFeedback | method | n/a | FeedbackWriter API |
| startFeedbackPopupCountdown | method | n/a | setTimeout → popup |
| startSurveyPopupCountdown | method | n/a | setTimeout → popup |
| setDataConsent | method | n/a | userPreferences.update |
| setFeedbackStatus | method | n/a | userPreferences.update |
| setSurveyStatus | method | n/a | userPreferences.update |
| _pocDarkMode / _pocAppType / _pocGetRoute | const ref | (Phase-102 PoC) | bare-getter experiments |

### app/getRoute.svelte.ts — `createGetRoute()`
| current | getter→$derived | never written | `$derived.by` over page.params/route/url |

### app/popup/popupStore.svelte.ts — `popupStore()`
| current | getter→$derived | never written | `$derived(queue[0])` |
| push / shift | method | wholesale (`queue=[...]`) | array reassigned, not mutated |

### app/survey.svelte.ts — `surveyLink()`
| current | getter→$derived | never written | `$derived.by` over appSettings.current + sessionId.current |

### app/tracking/trackingService.svelte.ts — `trackingService()`
| sendTrackingEvent | {current} handle + set | primitive reassign (fn) | TrackingHandler\|null |
| sessionId | {current} handle | never written | sessionStorageState UUID |
| shouldTrack | {current} handle (→$derived) | never written | consent boolean |
| startPageview / startEvent / submitAllEvents / resetAllEvents / track | method | n/a (internal `pageviewEvent`/`unsubmittedEvents` mutated) | |

### auth/authContext.svelte.ts — `initAuthContext()`
| isAuthenticated | $derived | never written | `!!page.data.session` |
| logout / requestForgotPasswordEmail / resetPassword / setPassword | method | n/a | DataWriter wrappers |

### component/componentContext.svelte.ts — `initComponentContext()`
| darkMode | getter (bare) | never written | reads createDarkMode().current |
| locale / locales / t / translate | (spread I18nContext) | — | i18n surface |

### component/darkMode.svelte.ts — `createDarkMode()`
| current | getter (bare) | primitive reassign | `dark` $state on matchMedia change |

### data/dataContext.svelte.ts — `initDataContext()`
| dataRoot | {current} handle | **version-bridge** | stable DataRoot, `version++` |
| reactiveDataRoot | {current}+{instance} | **version-bridge** | `.current` reactive / `.instance` non-reactive (E3 split) |

### filter/filterContext.svelte.ts — `initFilterContext()`
| filterGroup | getter (bare→$derived) | never written | active FilterGroup per (electionId, entityTab) |
| version | getter (bare) | **in-place mutation (version++)** | FilterGroup.onChange bridge |
| setFilter / resetFilters | method | n/a | mutate FilterGroup, emit onChange |
| addFilter / removeFilter | method (stub) | n/a | deferred (D-06) |

### layout/layoutContext.svelte.ts — `initLayoutContext()`
| pageStyles / topBarSettings / navigationSettings | const ref (SettingsOverlayApi) | in-place (overlay registry) | token-keyed overlay merge |
| progress | const ref | `max` primitive reassign + `current` Tween in-place | |
| navigation | const ref | in-place | `{ close? }` |
| video | const ref (VideoController) | in-place (show/hasContent/mode/player $state) | |
| routeTitle | const ref ({current}) | in-place via $effect untrack | |
| setRouteTitle / useTopBar / usePageStyles / useNavigation | method | n/a | declarative $effect-scoped registration |

### voter/voterContext.svelte.ts — `initVoterContext()`
| electionsSelectable / constituenciesSelectable | getter→$derived | never written | booleans |
| selectedElections | getter→{current}? ($state) | **wholesale (= [])/= next** | written in $effect |
| selectedConstituencies | getter ($state) | **wholesale** | written in $effect |
| currentResultsElection | getter→$derived.by | never written | selectedElections + page.params |
| entityTypes / hideIfMissingAnswers | getter→$derived | never written | from appSettings |
| infoQuestionCategories / opinionQuestionCategories / infoQuestions / opinionQuestions | getter ($state) | **wholesale (= nextX in $effect)** | array cells |
| selectedQuestionBlocks | getter ($state) | **wholesale** | object cell (built then reassigned) |
| selectedQuestionCategoryIds | getter + setter ($state) | **wholesale** | Id array |
| firstQuestionId | getter + setter | persisted (sessionStorageState) | |
| answers | const ref (answerStore) | n/a | sub-store |
| resultsAvailable / nominationsAvailable | getter→$derived.by | never written | |
| matches / entityFilters | getter (bare) | never written | sub-store `.value` |
| currentResultsEntityType | getter→$derived.by | never written | |
| filterContext | getter (bare) | never written | getFilterContext() delegation |
| resetVoterData | method | n/a | |
| algorithm | const ref | never written | MatchingAlgorithm instance |

### voter/answerStore.svelte.ts — `answerStore()`
| answers | {current} handle | version-bridge (localStorageState, frozen) | |
| setAnswer / deleteAnswer / reset | method | n/a | store.update/set + tracking |

### voter/matchStore.svelte.ts — `matchStore()`
| value | getter→$derived.by | never written | MatchTree recomputed wholesale |

### voter/nominationAndQuestionStore.svelte.ts — `nominationAndQuestionStore()`
| value | getter→$derived.by | never written | NominationAndQuestionTree recomputed wholesale |

### voter/filters/filterStore.svelte.ts — `filterStore()`
| value | getter→$derived.by | never written | FilterTree (new FilterGroups per run) |

### candidate/candidateContext.svelte.ts — `initCandidateContext()`
| answersLocked / constituenciesSelectable / electionsSelectable / profileComplete | getter→$derived | never written | booleans |
| selectedElections / selectedConstituencies | getter ($state) | **wholesale** | written in $effect |
| infoQuestionCategories / opinionQuestionCategories / infoQuestions / opinionQuestions | getter ($state) | **wholesale (= nextX)** | array cells |
| questionBlocks | getter ($state) | **wholesale (= {...})** | object cell |
| requiredInfoQuestions / unansweredOpinionQuestions / unansweredRequiredInfoQuestions | getter→$derived(.by) | never written | |
| isPreregistered | getter+setter | persisted (localStorageState) | primitive |
| newUserEmail | getter+setter ($state) | primitive reassign | |
| preregistrationElectionIds / preregistrationConstituencyIds | getter+setter | persisted | Id arrays |
| idTokenClaims | getter→$derived | never written | page.data |
| preregistrationElections / preregistrationNominations | getter→$derived.by | never written | |
| userData | const ref (candidateUserDataStore) | n/a | sub-store |
| logout / register / exchangeCodeForIdToken / preregister / clearIdToken | method | n/a | |

### candidate/candidateUserDataStore.svelte.ts — `candidateUserDataStore()`
| current | getter→$derived.by | version-bridge-ish | composite of savedData + edited* |
| hasUnsaved / savedCandidateData / unsavedQuestionIds / unsavedProperties | getter→$derived(.by) | never written | |
| savedData (internal) | $state | **wholesale (= data)** | not directly exposed |
| editedImage / editedTermsOfUseAccepted (internal) | $state | primitive reassign | |
| init / reloadCandidateData / reset / resetAnswer(s) / resetImage / resetTermsOfUseAccepted / resetUnsaved / save / setAnswer / setImage / setTermsOfUseAccepted | method | n/a | |

### admin/adminContext.svelte.ts — `initAdminContext()`
| userData | getter+setter ($state) | **wholesale (= v)** | BasicUserData\|undefined |
| jobs | const ref (jobStores) | n/a | sub-store |
| isAuthenticated | getter (bare) | never written | delegates authContext |
| logout / requestForgotPasswordEmail / resetPassword / setPassword | const ref | never written | forwarded authContext methods |
| updateQuestion / getActiveJobs / getPastJobs / startJob / getJobProgress / abortJob / abortAllJobs / insertJobResult | method | n/a | DataWriter wrappers |

### admin/jobStores.svelte.ts — `jobStores()`
| jobs (internal) | $state Map | **wholesale (`jobs = newJobs`)** | Map reassigned, not `.set` |
| activeJobsByFeature / pastJobs / pastJobsByFeature | getter→$derived(.by) | never written | derived from jobs Map |
| startPolling / stopPolling | method | n/a | timer side-effects |

### utils/persistedState.svelte.ts — `persistedState()`
| current | getter (bare) | never written (read of `value`) | |
| set / update | method | **wholesale (`value = v`/`fn(value)`)** + persist | underlies userPreferences/answers |

### utils helpers (`paramStore` / `questionBlockStore` / `questionCategoryStore` / `questionStore`)
| value | getter→$derived(.by) | never written | pure derived projections of page/data |

### utils/SettingsOverlay.svelte.ts — `SettingsOverlay()`
| current | getter→$derived | never written | base + overlays merge |
| size | getter (bare) | never written | overlay count (debug) |
| push / use | method | in-place (overlay slots via untrack) | returns revert fn |

---

## Part 2 — Groups (the re-evaluation buckets)

### A. Wholesale-reassigned object/array `$state` — *the appSettings pattern*
`appSettings`, `appCustomization`, `userPreferences`, `popupQueue.queue`,
`selectedElections`/`selectedConstituencies` (voter+candidate),
`infoQuestionCategories`/`opinionQuestionCategories`/`infoQuestions`/`opinionQuestions`
(voter+candidate), `selectedQuestionBlocks`/`questionBlocks`,
`selectedQuestionCategoryIds`, `savedData`, `adminContext.userData`, `jobStores.jobs`
(Map), `persistedState.value`.
- **Write:** `x = newValue` (immutable-update style; even the Map is swapped).
- **Reactivity need:** a **deferred read** (getter / `.current` / thunk). A held bare
  reference goes stale (018b CASE 3).
- **Class implication:** as a `$state` *field* on a class instance, the field is read
  via `this.x` — and consumers read `instance.x` (a property access that re-invokes the
  signal each time). Wholesale reassignment of a `$state` **field** is fully reactive
  (unlike a reassigned `let`), so **Group A is the bucket that benefits most from
  class conversion** — the getter-handle disappears, replaced by a plain public field.
  ⚠️ but 019 still applies: `const { x } = instance` snapshots. The destructure
  discipline survives the class move.

### B. Primitives
`appType`, `newUserEmail`, `darkMode/dark`, `routeTitle`, `progress.max`,
`video.show/hasContent/mode`, `editedTermsOfUseAccepted`, `isPreregistered`,
`sendTrackingEvent` (fn ref), `openFeedbackModal` (fn ref), `firstQuestionId`.
- **Write:** primitive reassignment.
- **Class implication:** trivially a public `$state` field. Same destructure caveat.
  No accessor needed once it's a field (vs. today's `{ current }` handle).

### C. Version-bridge singletons — *the dataRoot pattern (NOT replacement)*
`dataContext.dataRoot`/`reactiveDataRoot` (DataRoot), `filterContext.version`
(FilterGroup), `answerStore.answers` + `candidateUserDataStore.current` (frozen-payload
localStorageState bridges, related shape).
- **Write:** the underlying object identity is **stable**; it is mutated in place and a
  `version++` `$state` counter is the only reactive signal.
- **Class implication:** the cleanest class refactor wraps the foreign mutable object
  (DataRoot/FilterGroup) and keeps a private `#version` `$state`; the public getter
  reads it. The E3 `{ current, instance }` split (017) can collapse to a `get
  dataRoot()` + `setDataRoot(updater)` pair on the class. **This group does NOT
  simplify away** — the bridge is intrinsic to mutating a non-rune library object.

### D. Pure `$derived` projections (read-only)
The **largest** group: `electionsSelectable`, `constituenciesSelectable`,
`profileComplete`, `answersLocked`, `matches`, `entityFilters`, `resultsAvailable`,
`nominationsAvailable`, `currentResultsElection/EntityType`, `entityTypes`,
`hideIfMissingAnswers`, `requiredInfoQuestions`, `unanswered*`, `idTokenClaims`,
`preregistrationElections/Nominations`, `isAuthenticated`, `shouldTrack`, `getRoute`,
`surveyLink`, all `utils/*Store.value`, `SettingsOverlay.current`, jobStores derived
maps, candidate `hasUnsaved`/`unsaved*`.
- **Write:** never. Recomputed wholesale by Svelte.
- **Class implication:** become `$derived` **class fields** (`x = $derived(...)`) or
  `get x()`. Direct 1:1 mapping — this is where classes read *cleanest*. Still 019:
  destructuring a derived getter snapshots.

### E. Methods
All the `set*`/`reset*`/`start*`/`logout`/`register`/`save`/`provide*`/`use*` etc.
- **Class implication:** plain class methods. Zero friction. `this`-binding actually
  *improves* on today's closure-captured factory functions.

### F. Stable sub-store / instance const-refs (never reassigned, internally reactive)
`answers` (answerStore), `userData` (candidateUserDataStore), `jobs` (jobStores),
`algorithm` (MatchingAlgorithm), `popupQueue` (PopupStore), layout `video`/`progress`/
`navigation`/`pageStyles`/`topBarSettings`/`navigationSettings`/`routeTitle`,
voter `filterContext` delegation.
- **Class implication:** these are *already* the "class with $state fields" shape in
  embryo (PopupStore, VideoController, SettingsOverlay are de-facto classes written as
  factories). Converting the parent context to a class makes them natural nested-class
  fields. Strong candidates to formalize as classes first (low blast radius).

### G. Forwarded / delegated refs
`adminContext.{logout,resetPassword,...}` forwarding authContext;
`appContext.{locale,locales,darkMode}` forwarding componentContext;
`voterContext.filterContext`.
- **Class implication:** getter delegation (`get logout(){ return this.#auth.logout }`)
  or composition. Trivial.

---

## Part 3 — Signal for the re-evaluation

1. **There are no mutate-in-place `$state` objects/arrays today.** Every Group-A member
   is reassigned wholesale (the codebase's immutable-update convention). That's *why*
   every reactive source needs a deferred-read accessor today — and why class
   conversion is attractive: a `$state` **field** reassigned wholesale stays reactive
   for `instance.x` consumers **without** a handle (the `let`-binding staleness that
   forces `{ current }` does not apply to object fields read via property access).

2. **Class conversion simplifies A, B, D, E, F, G; it does NOT simplify C.** The
   version-bridge is intrinsic to wrapping foreign mutable singletons (DataRoot,
   FilterGroup). 017's `get/set` collapse is the best available improvement there.

3. **Class conversion does NOT retire the destructure trap (019).** A class `get x()` /
   `$derived` field has identical snapshot-on-destructure semantics to today's bare
   getter. The CLAUDE.md destructuring rule + Phase-103 PASS 3/PASS 4 survive intact —
   arguably *more* load-bearing, since flattening to public fields invites
   `const { x } = ctx` everywhere. The `{ current }` handle was incidentally a firewall;
   removing it raises trap exposure.

4. **Lowest-blast-radius first move:** formalize the already-class-shaped factories in
   Group F (`PopupStore`, `VideoController`, `SettingsOverlay`, `MatchingAlgorithm` is
   already a class) as real classes, then convert leaf contexts (auth, component,
   darkMode, data) before the orchestrators (voter, candidate, app).

5. **Open question for a spike:** does `setContext(KEY, new VoterContext())` + class
   `$derived` fields actually behave identically across SSR/hydration (spike 008
   territory) and HMR (spike 011)? Class instances + `$state` fields are the documented
   idiom, but the SSR `$effect`-doesn't-run merge finding (008) needs re-confirmation
   under a class shape.
