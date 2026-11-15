# Context reactivity — the destructure trap and the `dataRoot` `#version`-bridge carve-out

> **Reference for anyone writing or reviewing a Svelte 5 component that consumes an OpenVAA
> context.** It prevents one bug class: a context value that is correct at component-init and then
> silently never updates — a list that stays empty after the data layer populates, a `DataRoot` that
> keeps its pre-mount snapshot on cold / direct-URL entry. The failure is silent: nothing throws,
> nothing warns, and the component renders an empty state that looks like real data.

**This is relocated content, and no normative statement in it was weakened in the move.** It lived in
`CLAUDE.md` under *Context Destructuring Rule (Svelte 5)* until Phase 160 trimmed that file to
commands and hard conventions; `CLAUDE.md` § *Skill Routing* now points here in one hop. It moved
here rather than being cut because it is the one class of knowledge the finding behind that trim
explicitly carves out: agents recover repo conventions by reading code, but a Svelte 5
referential-equality behaviour **is not visible in the code that suffers from it**. That is why this
codebase re-suffered it twice — v2.6 Phase 61 (the destructure trap) and v2.13 Phase 117 (the
identity-stable-accessor hole).

## 1. The two property classes

OpenVAA's Svelte 5 contexts (`getContestantContext()`, `getVoterContext()`, `getAppContext()`, plus
generic `getContext()` consumers) expose two property classes with **different reactivity semantics
under destructuring**.

### 1a. Stable references — safe to destructure

The translation function `t`; the route helper `getRoute` (still a `{ current }` handle); `darkMode`;
`answers`; the `userData` object (whose internal `$state` getters are accessed by property); and the
lifecycle functions (`logout`, `preregister`, `startEvent`, `*Countdown`). On the contestant
context also the two nomination functions, `setEntityNominations` and `getNominationParentOptions`:
each is a stable arrow function that reads the selected entity when it is called, so a destructured
copy acts on the entity the route names at that moment. And the seven functions of the entry flow:
`checkInvitationCode`, `requestSignInLink` and `requestPasswordRecovery`, which forward to the data
writer, and `holdEntryCode`, `sendEntryLink`, `resendEntryLink` and `clearEntryFlow`, which write the
flow state (see `entryFlow` below). A screen calls `sendEntryLink`, never the two link forwards, so
that the request is held for the "email sent" screen.

```ts
const { t, getRoute } = getVoterContext();
```

### 1b. Reactive accessors — MUST be read via direct property access

Getters returning `$state`- or `$derived`-backed values that change over time. `appSettings`,
`dataRoot` and `locale` (which became reactive accessors in v2.13 Phase 113 — the handle flatten;
previously stable `{ current }` handles, now bare reactive fields). Plus: `selectedElections`,
`selectedConstituencies`, `opinionQuestions`, `infoQuestions`, `infoQuestionCategories`,
`opinionQuestionCategories`, `questionBlocks`, `unansweredOpinionQuestions`,
`unansweredRequiredInfoQuestions`, `requiredInfoQuestions`, `answersLocked`, `profileComplete`,
`electionsSelectable`, `constituenciesSelectable`, `matches`, `nominationsAvailable`,
`resultsAvailable`, `idTokenClaims`, `isPreregistered`, `isAuthenticated`, `preregistrationElections`,
`preregistrationNominations`. On the contestant context also `entryFlow`, what the entry screens
share — a checked registration code, the one link request that can be repeated, both, or nothing — a
private `$state.raw` field replaced whole on every write and written only through the four functions
above. On the contestant context also the three user-level
accessors derived from page data: `user`, `entities` and `selectedEntity` — the signed-in user, the
entities they edit, and the one the route's `entityType` and `entityId` params name — and
`homeRoute`, the built route "home" leads to from the current page: that entity's home when the
route params name one, the app root otherwise. They sit beside `userData`, which stays a stable
reference; read them as `contestantCtx.X`. Two more on the contestant context: `nominationsLocked`,
which follows the app setting `access.nominationsLocked` as `answersLocked` follows its own key, and
`questionsReady`, which is `true` once the question lists were rolled up for a loaded entity with a
selected election — the fact that tells an empty list that means "no questions" from one that means
"not loaded yet". The lists themselves are scoped to the loaded entity's type and are empty while no
entity is loaded. They are empty too for a loaded entity with no selected election. And five that
hold the entity's tasks:

- `nominations` — derived from page data: the list the entity-level load read for the entity on the
  page, an empty list for an entity with none and `undefined` on a page whose data holds no entity.
  It follows the load and not the store, so it changes when that load reruns.
- `taskState` — one `$derived.by` that hands values the context reads in its own scope to the pure
  `taskStateOf` of `$lib/contestant/tasks`: whether the entity has a nomination from `nominations`,
  and the counts of unanswered questions from the store and the question lists, read only while the
  store holds the entity the route names and `questionsReady` is true.
- `tasks` — the state's own `tasks` member: the entity's tasks in order, each with a status that is
  `undefined` while the facts it rests on are not loaded.
- `nextStep` — the state's own `nextStep` member: the first incomplete task and its route,
  `undefined` when there is none and while the state is not known.
- `previewOpen` — the state's own `previewOpen` member: false while the state is not known.

`profileComplete` is the state's `allComplete`: false for an entity with no nomination and while the
state is not known.

`taskState`, `tasks` and `nextStep` are **value-replacing**: `taskStateOf` returns a fresh object on
every call, so the reference changes on every change and a `$derived(contestantCtx.taskState)` read
alias follows it. `dataRoot` is not (§ 5). A value-replacing accessor is still never destructured.
Nothing is decided from a list's length before the state's `known` member is true: an empty list
that is not loaded looks the same as one with nothing left to do.

These **MUST** be read via direct property access:

```ts
const ctx = getContestantContext();
const opinionQuestions = $derived(ctx.opinionQuestions); // correct
// const { opinionQuestions } = ctx;                     // captures initial empty array
```

**Why:** Destructuring invokes the getter ONCE at component-init time and binds the captured value
(the initial empty `$state` array) to a local var. Subsequent reads of the local var are reads of a
static binding — not getter calls — and do not propagate dependency invalidation. Reads via `ctx.X`
re-invoke the getter inside the tracking scope each time, preserving the reactive edge.

## 2. Canonical pattern

Reproduced verbatim from
`apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:63-70`:

```ts
const voterCtx = getVoterContext();
const { answers, getRoute, startEvent, startFeedbackPopupCountdown, startSurveyPopupCountdown, t } = voterCtx;
// appSettings is value-replacing: a $derived read alias is safe and correct.
const appSettings = $derived(voterCtx.appSettings);
// dataRoot is identity-stable: read `voterCtx.dataRoot.<prop>` directly inside the consuming tracking scope, never through an intermediate $derived alias …
// Local aliases for template readability:
const elections = $derived(voterCtx.selectedElections);
const constituencies = $derived(voterCtx.selectedConstituencies);
```

**Read what this example does NOT contain.** There is no `const dataRoot = $derived(voterCtx.dataRoot)`
line, and its absence is the point — see § 5. A `$derived` read alias is correct for the
value-replacing accessors (`appSettings`, `selectedElections`, `selectedConstituencies`) and wrong for
`dataRoot`.

For a one-time, non-reactive init read (e.g. building a `const mailto` or a `topBarSettings.use({...})`
call at component setup), read the value off `ctx` directly (`ctx.appSettings`) rather than aliasing
through `$derived`; the `$derived` alias is for values consumed reactively in the template /
`$derived` / `$effect`, and aliasing it for a one-shot init read triggers a `state_referenced_locally`
warning.

## 3. Diagnostic origin

v2.6 Phase 61 Plan 03 — see
`.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md`. The
`contestantContext` `$derived` chain captured initial empty arrays at component init and never
re-evaluated after the data layer populated, because consumers destructured reactive properties out of
the context object. The fix landed by switching consumers to `ctx.X` reads.

The in-tree explanation lives in two places, both in
`apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts`: the `Destructure-trap contract`
section of the class docblock, and the root-mechanism comment — why a destructured context property
has no live reactive source — which begins `Root mechanism:`. Find both by those words; the file
grows, so a line range would not keep pointing at them.

## 4. Caveat — genuinely store-shaped stable members

A few context members are still `{ current }` rune handles (e.g. `getRoute`) and are STABLE — they
remain safe to destructure. NOTE: as of v2.13 Phase 113, `appSettings` / `dataRoot` / `locale` are NO
LONGER stores nor `{ current }` handles — they are bare reactive fields and **must NOT be
destructured** (destructuring captures the value once at init and stops updating on navigation — the
Phase-61 destructure-trap). Read them via `ctx.appSettings` (bare, no `.current` — the FLATTEN-02
codemod removed every `.current` read on these three). Only the genuinely-handle-shaped stable members
(like `getRoute`) stay destructurable.

## 5. Carve-out — the `dataRoot` `#version`-bridge alias-indirection hole (v2.13 Phase 117)

The canonical `const X = $derived(ctx.X)` read pattern (§ 2) is correct for **value-replacing**
accessors — `appSettings` (its reference is replaced on update), `locale` (a scalar), and the array
accessors `selectedElections` / `opinionQuestions` / `matches` (their array reference is replaced), and
the contestant context's `taskState` with its members `tasks` and `nextStep` (a fresh object on every
change). For
those the destructure-trap guidance above fully applies and the `$derived` read alias is safe.

It has a HOLE for `dataRoot` — and any same-shape **identity-stable** `#version`-bridge accessor (an
object whose reference never changes and whose only reactive signal is a private `#version` `$state`
counter bumped on `DataRoot.update()`). Binding `dataRoot` to an intermediate read alias and reading
`aliasedDataRoot.<prop>` downstream goes **STALE on cold / direct-URL entry**: the alias recomputes on
each `#version` bump but yields the SAME `DataRoot` reference every time, and Svelte 5's
referential-equality rule SKIPS downstream notification — so the consumer keeps the empty pre-mount
snapshot. (Warm `intro → Continue` entry masks it because the data is already present before the alias
first computes; cold entry exposes it because the data arrives after mount.)

**Safe consumption for `dataRoot`:** read `ctx.dataRoot.<prop>` **DIRECTLY** inside the consuming
tracking scope (`$derived.by` thunk / template `{#if}` / `{#each}` / `{@const}` / `$effect`) so the
consumer itself takes the `#version` dependency — **never bind** it to an intermediate read alias.
Canonical analog, the derivation of `elections` in
`apps/frontend/src/routes/(voters)/elections/+page.svelte`, which reads `voterCtx.dataRoot.elections`
inside the `$derived` expression itself, once as an argument and once as the result:

```ts
let elections = $derived(
  appSettings.elections?.startFromConstituencyGroup
    ? electionsHeldIn({ elections: voterCtx.dataRoot.elections, constituencies: voterCtx.selectedConstituencies })
    : voterCtx.dataRoot.elections
);
```

## 6. References

Mechanism explanation is NOT duplicated here — see:

- `.planning/spikes/024-derived-alias-stable-ref-skip/README.md` — 4/4 validated affected-vs-not
  classification.
- `.planning/spikes/CONVENTIONS.md` § 9 (`$derived.by` over per-field reads for reference-stable
  `$state` proxies) plus its Spike-024 anti-pattern entry.
- `.planning/debug/dataroot-stale-direct-nav.md` — root cause and the 14-site consumer map.
- `.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md` — the original
  Phase-61 diagnosis (§ 3).

## 7. Enforcement

**Lint enforcement** is currently a guideline, not an automated rule. A future phase may add a custom
svelte-eslint rule if violations recur. Until then the enforcement is review: when you touch a
component that consumes a context, check its reads against § 1 and § 5 before approving.
