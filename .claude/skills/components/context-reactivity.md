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

OpenVAA's Svelte 5 contexts (`getCandidateContext()`, `getVoterContext()`, `getAppContext()`, plus
generic `getContext()` consumers) expose two property classes with **different reactivity semantics
under destructuring**.

### 1a. Stable references — safe to destructure

The translation function `t`; the route helper `getRoute` (still a `{ current }` handle); `darkMode`;
`answers`; the `userData` object (whose internal `$state` getters are accessed by property); and the
lifecycle functions (`logout`, `register`, `preregister`, `startEvent`, `*Countdown`).

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
`preregistrationNominations`, `newUserEmail`.

These **MUST** be read via direct property access:

```ts
const ctx = getCandidateContext();
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
`candidateContext` `$derived` chain captured initial empty arrays at component init and never
re-evaluated after the data layer populated, because consumers destructured reactive properties out of
the context object. The fix landed by switching consumers to `ctx.X` reads.

The in-tree explanation lives in two places, both in
`apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts`: the `Destructure-trap contract`
docblock section at `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:44-45`, and
the root-mechanism comment — why a destructured context property has no live reactive source — at
`apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:131-134`.

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
accessors `selectedElections` / `opinionQuestions` / `matches` (their array reference is replaced). For
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
Canonical analog, `apps/frontend/src/routes/(voters)/elections/+page.svelte:40-41`:

```ts
let elections = $derived.by(() => {
  let result = voterCtx.dataRoot.elections;
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
