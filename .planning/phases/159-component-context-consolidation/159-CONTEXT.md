# Phase 159: Component & Context Consolidation - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Depends on:** Phase 158 (Routing & Auth Surface Harmonisation) — routes settle first
**Source of decisions:** `.planning/v2.15-DISCUSSION-POINTS.md` § H (H1–H6) + § N (cross-cutting), filled
by the operator. Per N3(a) this file is the one CONTEXT.md for Phase 159.

<domain>
## Phase Boundary

A component exists because it earns its own file, and reactive state is *derived* where it can be
derived rather than *pushed* by an effect. Delivers, in the frontend only:

1. a **frontend-wide `$effect` census** with a per-site recorded disposition, plus conversion of the
   unambiguous sites (starting with `PasswordSetter.svelte:55,58`);
2. `MultipleTextInput`'s input part **extracted and imported into `Input`**, with the same extraction
   applied to the other complex types, and **multilingual support landing in the same change**;
3. `EntityCardAction` replaced by a **snippet**; the component *and* its `.type.ts` deleted;
4. the **two tracking-service layers collapsed to one** type + implementation, with internal-only
   members (`sessionId` among them) **removed from** the consumer-facing interface;
5. `reactiveHandle.type.ts` moved to `contexts/utils`; the duplicated `questionCategories` rollup at
   `candidateContext.svelte.ts:355` and its `voterContext.svelte.ts:467` twin extracted to a shared
   utility; the `sameRefs` helper at `voterContext.svelte.ts:37` moved to the bottom of the file or
   into utils;
6. `Alert.svelte`'s ad-hoc spacing converted to semantic classes (**both** `:117` and `:114`), and
   `MainContent` plus the other route-root components moved behind a new **`$layouts/main`** alias +
   barrel.

**Not in scope:** the backend, packages outside `apps/frontend`, and the six review comments that the
roadmap's criteria do not cover (see `<open>`). Not a redesign: no visual change is intended anywhere
except `Alert`'s two spacing values, which must render identically.

## ⚠ Hard constraint — the Svelte 5 reactivity invariants (CLAUDE.md)

H1's `$effect` → `$derived` conversions are **exactly the operation that can reintroduce the
Phase-61 / Spike-024 bug class.** Both rules in `CLAUDE.md` § "Context Destructuring Rule (Svelte 5)"
are live invariants this phase must not break:

- **Destructure trap.** Reactive accessors (`appSettings`, `dataRoot`, `locale`, `selectedElections`,
  `opinionQuestions`, `matches`, … — full list in `CLAUDE.md`) are read via `ctx.X` inside the
  consuming tracking scope. Destructuring invokes the getter once at component init and binds the
  initial empty value. Only genuinely handle-shaped members (`getRoute`) and stable members
  (`t`, `answers`, lifecycle fns) may be destructured.
- **The `dataRoot` `#version`-bridge carve-out.** `dataRoot` is **identity-stable**: its reference
  never changes and its only reactive signal is a private `#version` `$state` counter. Binding it to
  an intermediate `$derived` read alias goes **stale on cold / direct-URL entry**, because Svelte 5's
  referential-equality rule skips downstream notification when the alias recomputes to the same
  reference. Read `ctx.dataRoot.<prop>` **directly** inside the consuming tracking scope; never bind
  it to an intermediate alias. Canonical analog: `apps/frontend/src/routes/(voters)/elections/+page.svelte:43-44`.
  Mechanism: `.planning/spikes/024-derived-alias-stable-ref-skip/README.md`, `.planning/debug/dataroot-stale-direct-nav.md`.

This bites the phase in two concrete places: the criterion-5 extraction operates on
`candidateContext.svelte.ts:356` (`const dr = this.#dataRoot;` inside the `$effect`) and its
`voterContext` twin — i.e. the shared utility being extracted reads `dataRoot` — and every H1
conversion of a context-consuming `$effect` in a `.svelte` file. **Every converted site must be
checked for cold/direct-URL entry, not only warm `intro → Continue` entry, which masks the bug.**

Second Svelte-5 constraint, specific to H1: converting an *effect that writes to a prop* into a
`$derived` requires the target to become `$bindable`, which changes the component's public contract.
H1(a) deliberately converts **only the unambiguous sites** to keep that blast radius bounded — the
census records the rest rather than converting them.

## What 159 assumes Phase 158 has delivered

159 is sequenced after 158 because both phases move files in and around `apps/frontend/src/routes/`
and `apps/frontend/src/lib/`. 159's plans should be written against the **post-158** tree:

- **`$lib/routes/` exists** (158 creates it; G1(a)) containing the relocated `buildRoute.ts`,
  `route.ts`, `loginRedirectTarget.ts` and the `(protected)` pattern. Consequence for H5:
  `apps/frontend/src/routes/loginRedirectTarget.ts` **has already left the routes root**, so 159's
  route-root sweep must not try to move it again — the remaining non-route files there are
  `Banner.svelte`, `Header.svelte`, `Layout.svelte`, `Layout.type.ts`, `MainContent.svelte`,
  `MainContent.type.ts`, `MaintenancePage.svelte`, `MaintenancePage.type.ts`, `SingleCardContent.svelte`
  (+ `README.md`).
- **`$lib/cookies/` exists** as a frozen const map with its collision/literal test (G2(a)) — no 159
  file should introduce a cookie literal.
- **`hooks.server.ts` matches on `route.id`, not `pathname`** (G4(a)).
- **Follow-up review comments are filed** in `.planning/todos/pending/` rather than implemented
  (G5(a) + N2(a)) — but see the operator NOTE carried into D-N2 below, which pulls the *blocking*
  ones back into 158/159.
- **Transitively via Phase 157 (F5(a) + its NOTE):** `logDebugError` has been renamed and reworked
  into structured logging **and moved into `app-shared`** across all 82 call sites. Two of those call
  sites (`candidateContext.svelte.ts:333` and `:350`) sit immediately above the block criterion 5
  extracts, and `apps/frontend/src/lib/utils/logger.ts` is the current import source
  (`candidateContext.svelte.ts:8`). Plan the extraction against the *new* logger name/import, not
  `logDebugError` from `$lib/utils/logger`.
- **Transitively via Phase 152 (A5(a)):** the `–` escape at `EntityCardAction.svelte:12` has been
  fixed and a `\uXXXX`-in-comment guard wired into `yarn lint:check`. See D-H3 for the collision.

</domain>

<decisions>
## Implementation Decisions

**How these were resolved.** `.planning/v2.15-DISCUSSION-POINTS.md` states its own rule (lines 13-17):
*"Leaving every box in a decision unchecked = choosing the `★ RECOMMENDED` option. Identical to
ticking it."* — and *"free text beats every box"*.

**In § H, the operator ticked nothing and wrote no free text.** All six of H1–H6 therefore resolve
**by default to their `★ RECOMMENDED` option, which is `(a)` in every case** — these are *chosen*, not
undecided. Two § N decisions carry operator free text that binds this phase; both are recorded verbatim.

### D-H1 ⚠ DECIDE — How wide is the `$effect` census?

**Question:** criterion 1 says "every other `$effect` in the frontend is audited against the same test
with the disposition recorded per site". How many sites is that, and how much of it does 159 do?

**Won: option (a) — by default (★ RECOMMENDED, no tick).**

> **(a) Census all [N] into a committed table (file:line · pure-function-of-inputs? · disposition);
> convert only the unambiguous ones.**

**Rationale as written:** "this is what the criterion says, the census is mechanical (a script can
classify most sites by whether the body writes only to one target), and the table is the artifact
that stops the question being re-asked. Converting only the clear cases keeps the behavioural risk
bounded."

Rejected: (b) contexts/components only — "leaves 170 route-level effects unexamined and the criterion
unmet as written"; (c) fix `PasswordSetter` only — the reviewer explicitly asked to "check all other
`$effect` calls"; (d) census **and convert every convertible site** — "converting effect-writes-to-prop
into `$derived` requires each target to become `$bindable`, so this changes ~dozens of component
contracts in a single phase".

#### ⚠ The census size: the "211" in fact 24 and the roadmap does not reproduce. **Measured: 92.**

This is the single number that decides whether the phase is tractable, so it was re-measured this
session, on this branch, with the exact command fact 24 cites:

| Measurement | Command | Result |
|---|---|---|
| **The cited command** | `grep -rn '\$effect(' apps/frontend/src` | **92** |
| Same command at the doc's cited HEAD `bff94f382` | `git grep -c … bff94f382 -- apps/frontend/src` | **92** (identical; no frontend diff between `bff94f382` and HEAD `e1ab15f71`) |
| Distinct files containing a `$effect(` | `grep -rl` | **54** |
| In `*.test.*` files | — | **0** (all 92 are production sites) |
| Heaviest single file | `routes/+layout.svelte` | **5** |
| Including `$effect.root(` (test-harness scaffolding, 38 lines) | `grep -rnE '\$effect(\.root)?\('` | **130** |
| `$derived(` lines, for contrast | `grep -rn '\$derived('` | **207** |

**Fact 24 and the roadmap both say 211. The command they cite returns 92.** The discussion doc's
qualitative claim in the same row — *"Concentration is low: the top file has 5"* — **reproduces
exactly**, which is evidence the same tree was measured and the total was mis-transcribed. `207`
(`$derived(` lines) is close enough to `211` to be the plausible source of the error, but that is a
hypothesis, not a finding. Standing instruction is that a § 0 fact beats the roadmap where they
disagree; here **fact 24 and the roadmap agree with each other and both disagree with the tree**, so
the measurement governs.

**Binding for planning — AMENDED 2026-09-02 (operator decision).** The census is **91 sites across 54
files**, plus **40** `$effect.root(` lines in **16** files that are test scaffolding and are *not*
candidates for `$derived` conversion. D-H1(a) is unchanged in substance — census all of them into a
committed table, convert only the unambiguous ones — but it is a ~91-row table, not a ~211-row one,
and the phase should be **sized against 91**. A planner or executor that re-derives 211 from the
roadmap text is working from a number that does not exist on the tree. Re-run the grep at plan time
and record the count in the plan.

> **Why this line moved from 92 to 91.** The 92 was correct when this file was written and is still
> correct at the two commits the table above cites; it went stale when **Phase 158 removed one
> `$effect` from `apps/frontend/src/routes/(voters)/+layout.svelte`**. Re-measured at this phase's own
> base commit `7503a4a70` and again at `9afc10226`: 91 sites / 54 files / 40 `$effect.root(` / 16
> root-files / 85 any-token files / 220 `$derived(`. Only the 54 reproduces from the second-pass set.
> Amended in place rather than by addendum so the stale figure cannot propagate onward; ROADMAP
> criterion 1 and `159-03-PLAN.md` were amended in the same pass. Note that the population **moves
> within this phase's own execution** — waves 1–2 convert and delete sites — so `159-03` asserts
> classifier-total *equals the criterion's grep re-run at generation time* and records that live
> value; this 91 is the base-commit baseline, not a frozen expectation for wave 3.

### D-H2 — `MultipleTextInput` (228 lines) and `Input` (692 lines)

**Question:** fold `MultipleTextInput` wholesale into `Input`, or extract its input part and import it?

**Won: option (a) — by default (★ RECOMMENDED, no tick). The EXTRACT-AND-IMPORT variant, not the fold.**

> **(a) Extract the input part and import it into `Input`, applying the same extraction to the other
> complex types; land multilingual support in the same change.**

**Rationale as written:** "the reviewer offered this as the alternative and it keeps `Input.svelte`
from growing to ~900 lines, while making the 'each text item behaves like a normal multilingual text
item' requirement structural."

Rejected: (b) inline wholesale — "a ~900-line component and no path for the other complex types the
reviewer names"; (c) leave separate, add multilingual only — "the consolidation the criterion is
about does not happen".

**Multilingual scoping — how the decision scopes it:** multilingual support **lands in the same
change**, and the acceptance shape is the reviewer's own wording, quoted in the criterion and the
triage: *"each text item behaves much the same as a normal multilingual text item."* It is not a
separate step and not deferrable — (c), which defers the consolidation and keeps multilingual, was
explicitly rejected, and the recommended option names multilingual as part of the same landing. The
"same extraction applied to the other complex types in `Input`" is likewise part of (a), not optional.

Note for planning: `MultipleTextInput.type.ts` (55 lines) exists alongside the component and the
roadmap does not name it; its disposition follows the extraction (it is the prop contract that moves
with the extracted part).

### D-H3 — `EntityCardAction` → snippet

**Question:** when the component is replaced by a snippet, does its `.type.ts` survive?

**Won: option (a) — by default (★ RECOMMENDED, no tick).**

> **(a) Replace with a snippet; delete both the component and its `.type.ts`.**

**Rationale as written:** "criterion 3 says 'the separate component is deleted', and a type file for a
deleted component is the same dead weight." Rejected: (b) keep the type file — "a `.type.ts` named
after a component that no longer exists is a fresh naming defect."

**Measured reference map (12 refs / 4 files, as the decision states — with the useful refinement):**

| File | Refs | Nature |
|---|---:|---|
| `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` (59 lines) | 5 | self-references inside the file being deleted |
| `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.type.ts` (18 lines) | 1 | the type file, also deleted |
| `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` | 5 | the real consumer — usage site at `:220` |
| `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | 1 | second real consumer |

So **6 of the 12 refs disappear with the deleted files**; only **2 files** need rewriting.

#### ⚠ Collision with Phase 152 (§ 0 fact 8, decision A5(a))

Fact 8: the repo's only "encoded dash" is a `–` escape at **`EntityCardAction.svelte:12`** — verified
this session; it is the line `– default: The contents to wrap.` inside the component's JSDoc. Phase
152 owns fixing it, and N1(a) keeps **152 first**.

**What happens to 152's fix when 159 deletes the component:** the *instance* fix is retired along with
the file — the fixed line ceases to exist. This is not a loss, because A5(a)'s durable half is the
**`\uXXXX`-in-comment pattern added to the A4 scan and wired into `yarn lint:check`**, which is
repo-wide and survives the deletion. Two planning consequences:

1. **159 must not reintroduce the class.** The snippet's replacement documentation must use a literal
   `–`/`—`, never an escape. The 152 guard in `lint:check` will fail the build if it does — this is
   the intended enforcement, not an obstacle.
2. **If 159 lands before 152** (it should not, per N1(a)), 152's A5 fix target vanishes and 152's
   criterion "fix the one `–`" becomes vacuous. Flag it in 152's verification rather than treating it
   as a miss.

### D-H4 — Tracking service: two layers → one

**Question:** collapse the two layers, or keep them and document the internal members?

**Won: option (a) — by default (★ RECOMMENDED, no tick).**

> **(a) One type, one implementation; narrow the consumer interface, dropping `sessionId` and any
> other internal-only member from it.**

**Rationale as written:** "the criterion says 'removed from the consumer-facing interface rather than
merely documented as internal', which rules out a comment-only fix." Rejected: (b) keep both layers
and document — "explicitly the outcome the criterion forbids."

**Measured surface (this is a narrowing that is safe, and the evidence says so):**

- The two layers are `trackingService.type.ts` (52 lines — declares `TrackingService` with
  `sendTrackingEvent`, `sessionId`, `shouldTrack` as `{ readonly current }` handle shapes) and
  `trackingService.svelte.ts:17` (221 lines — declares `RuneTrackingService = Omit<TrackingService,
  'sendTrackingEvent' | 'sessionId' | 'shouldTrack'> & { … }`, i.e. the second layer exists solely to
  re-declare three members the first layer already declared).
- **`sessionId` has zero `.svelte` consumers** (`grep -rn 'sessionId' apps/frontend/src --include='*.svelte'` → 0).
- Its only real read is **internal**: `appContext.svelte.ts:329` passes `this.#tracking.sessionId`
  into `surveyLink(...)`, reaching the producer directly, not through the public surface.
- But it **is** re-declared as an own property on four context classes that must change with it:
  `appContext.svelte.ts:206`, `candidateContext.svelte.ts:261`, `voterContext.svelte.ts:358`,
  `adminContext.svelte.ts:93` — each `readonly sessionId!: AppContext['sessionId'];`.
- And it is **asserted present by a test**: `appContext.spread.svelte.test.ts:178` lists `'sessionId'`
  in the expected forwarded-member list. That test must be updated as part of the narrowing, not
  worked around.
- `shouldTrack` and `sendTrackingEvent` are the other two members to assess against the same test
  ("any other internal-only member") — `sendTrackingEvent` is explicitly consumer-facing by design
  ("must be set via `.set(...)`"), so it stays.

Also inside the tracking module: `trackingService.svelte.ts:92` uses
`sessionStorageState('appContext-sessionId', getUUID())`, and
`contexts/utils/persistedState.svelte.ts:90` documents the tracking `sessionId` as its never-explicitly-`set`
exemplar — keep that doc reference accurate after the narrowing.

### D-H5 — The `$layouts` alias and the `MainContent` move

**Question:** add a `$layouts` alias and move the route-root components, or leave them in `routes/`?

**Won: option (a) — by default (★ RECOMMENDED, no tick).**

> **(a) Add `$layouts` → `src/lib/layouts` in `svelte.config.js`; move `MainContent` and the other
> route-root components behind a barrel.**

**Rationale as written:** "this is `PRE-SHIP-REFACTORING.md` § item 2 verbatim, and it stops non-route
components living in the routes tree where SvelteKit's file-based router gives them accidental
meaning." Rejected: (b) leave them — "components that are not routes stay in the router's namespace,
which is the defect."

Source line, verified: `PRE-SHIP-REFACTORING.md` — *"Move MainContent and the other components in the
routes root to $layouts/main (export barrel), adding a new alias"*.

**A new path alias means config edits — three places, not one:**

1. **`apps/frontend/svelte.config.js:11-15`** — `kit.alias` currently declares exactly three:
   `$types`, `$voter`, `$candidate`. Add `$layouts: path.resolve('./src/lib/layouts')`.
2. **TypeScript: no manual edit needed, but verify.** `apps/frontend/tsconfig.json` extends
   `./.svelte-kit/tsconfig.json`, which SvelteKit *generates* from `kit.alias` — so the TS path
   mapping follows automatically once (1) is done and `svelte-kit sync` has run. Do not hand-add
   paths to `apps/frontend/tsconfig.json`; do confirm resolution with a typecheck.
3. **`apps/frontend/vitest.config.ts:25-28` — this one is hand-maintained and WILL break.** It
   re-declares `$lib`, `$types`, `$voter`, `$candidate` by hand with the comment "SvelteKit built-in
   aliases (not available via `@sveltejs/vite-plugin-svelte`)". `$layouts` must be added there or
   every unit test importing through the new alias fails to resolve. (Note `vitest.config.ts` also
   uses `__dirname` in an ESM-typed package — § 0 fact 3, owned by **Phase 153**; do not fix it here,
   but expect the file to have changed if 153 has landed.)

**Which components move** (measured, `apps/frontend/src/routes/` root, post-158): `MainContent.svelte`
(119) + `MainContent.type.ts` (53), `Banner.svelte`, `Header.svelte`, `Layout.svelte` +
`Layout.type.ts`, `MaintenancePage.svelte` + `MaintenancePage.type.ts`, `SingleCardContent.svelte`.
`loginRedirectTarget.ts` is **158's** to move (to `$lib/routes/`); `+error.svelte`, `+layout.svelte`,
`+layout.ts`, `README.md` stay.

**Side effect to record:** `Banner.svelte:9` and `Header.svelte:44` are the anchors of two G5 follow-up
todos filed in `.planning/todos/pending/`. Moving those files **staled those file:line anchors** — the
todo entries must be updated with the new paths as part of this phase, or the register points at
nothing.

### D-H6 — `Alert.svelte` ad-hoc spacing

**Question:** fix only `:117` as the roadmap names it, or both ad-hoc values in the file?

**Won: option (a) — by default (★ RECOMMENDED, no tick). BOTH values.**

> **(a) Convert both to the closest semantic classes.**

**Rationale as written:** "same file, same class of defect, and leaving `-mt-[1rem]` makes the
criterion's own example (`top-sm`) look arbitrary." Rejected: (b) `:117` only — "the arbitrary-value
bracket syntax survives two lines above the line being fixed for using arbitrary values."

**Measured, verified this session** (`apps/frontend/src/lib/components/alert/Alert.svelte`, 128 lines):

- `:114` — `<Button … class="-mt-[1rem] sm:mt-0" />` — arbitrary-value bracket syntax.
- `:117` — `<button … class="btn btn-circle btn-ghost btn-sm absolute top-2 right-2">` — `top-2 right-2`,
  the pair the reviewer named ("Use closest available semantic class, e.g. `top-sm`").

Both roadmap and § 0 fact agree on `:117`; the fact adds `:114`, which the roadmap omits. The fact
governs: **fix both.** Rendering must not change perceptibly — pick the semantic class nearest the
current computed value and say which, per site, in the plan.

### D-N1 — Sequencing (cross-cutting; constrains when 159 runs)

**Won: option (a) — by default (★ RECOMMENDED, no tick).** 152's comment purge stays **first**, and its
scan lands in `yarn lint:check` so later phases (159 included) cannot reopen the class. Practical
effect on 159: **every comment 159 writes** — the new snippet's docs, the extracted utility's header,
the census table's prose — is authored against 152's convention and must pass its `lint:check` scan
(no `\uXXXX` escapes; no forced line breaks per the A4 rule).

### D-N2 — Where the "follow-up task" comments land — **operator free text overrules the option here**

**Won: option (a) — by default (★ RECOMMENDED, no tick):** file each in `.planning/todos/pending/`
during its owning phase, implement none; the two *blocking* ones get a register entry carrying that flag.

**Operator NOTE, verbatim, on decision G5 (`.planning/v2.15-DISCUSSION-POINTS.md:554`):**

> **NOTES**: Implement the blocking ones within 158/9 or so.

**Binding effect on 159.** Free text beats the box. G5 names two blocking items; the one that lands in
this phase's own surface is the reviewer's comment on
`apps/frontend/src/lib/components/questions/QuestionChoices.svelte:1` — *"Add as a follow-up blocking
task for me to UAT: - BooleanInput - multi-select choices"* (PR #869, in the 159 triage section). The
other (`admin/login` supabase-independence) is 158's. So:

- 159 **files** the todo (per (a)) **and additionally implements** the blocking `QuestionChoices` item —
  the BooleanInput and multi-select-choices work — so it is ready for the operator's UAT.
- The non-blocking G5 items in 159's surface stay filed and unimplemented.
- "within 158/9 **or so**" is deliberately soft: if the blocking item proves to be its own design
  problem at plan time, raise it as a `checkpoint:decision` rather than silently deferring it.

Related, and worth the planner's attention because it overlaps 159's files: the operator's NOTE on
**G1** (158) — *"Also, sweep other content of lib/utils and make a proposal of other sections to move
directly to lib."* Three of 159's uncovered triage comments live in `lib/utils/`
(`constants.ts`, `getAllianceSummary.ts`, `multiChoiceValidity.ts`). **That sweep is 158's**, but 159
must not fight it; coordinate the two rather than moving the same files twice.

### D-N3 — How this document becomes CONTEXT.md

**Won: option (a) — by default (★ RECOMMENDED, no tick).** One `<padded>-CONTEXT.md` per phase (this
file), generated from § H + the applicable § N decisions, **plus a shared `<padded>-DISCUSSION-LOG.md`
pointer back to `.planning/v2.15-DISCUSSION-POINTS.md`.** Rationale as written: "`gsd-planner` and
`gsd-phase-researcher` read a single phase's CONTEXT.md; a milestone-level file would make each
planner read twelve phases' worth of irrelevant decisions." The pointer file was **not** written by
this pass (see `<open>`); until it exists, the canonical decision source is
`.planning/v2.15-DISCUSSION-POINTS.md` § H and § N.

### Claude's Discretion

- The **file name and location of the census artifact** (D-H1). Nothing in the decision names it;
  `159-EFFECT-CENSUS.md` in this phase dir follows the `137-NEGATIVE-CONTROL.md` precedent.
- The **classification script** for the census — throwaway vs. committed. The decision only requires
  the *table* be committed.
- Exactly **which semantic classes** replace `top-2 right-2` and `-mt-[1rem]` (D-H6), provided the
  rendering is unchanged.
- The **internal module layout** of the extracted `Input` sub-components (D-H2) and of the shared
  context utility (criterion 5), provided the destructure-trap and `dataRoot` rules hold.
- Whether the shared `questionCategories` rollup utility lives in `contexts/utils/` alongside the
  relocated `reactiveHandle.type.ts` or elsewhere under `lib/`.


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-H1:** How wide is the `$effect` census
- **D-H2:** `MultipleTextInput` (228 lines) and `Input` (692 lines)
- **D-H3:** `EntityCardAction` → snippet
- **D-H4:** Tracking service: two layers → one
- **D-H5:** The `$layouts` alias and the `MainContent` move
- **D-H6:** `Alert.svelte` ad-hoc spacing
- **D-N1:** Sequencing (cross-cutting; constrains when 159 runs)
- **D-N2:** Where the "follow-up task" comments land — **operator free text overrules the option here**
- **D-N3:** How this document becomes CONTEXT.md

</decisions>

<facts>
## Measured Facts

Everything below was verified this session (2026-08-28) on branch `integration/ship-12-squash`,
HEAD `e1ab15f71`. `git diff bff94f382..HEAD -- apps/frontend/src` is **empty**, so these are directly
comparable to the discussion doc's own measurements at `bff94f382`.

### The census

| # | Fact | Evidence |
|---|---|---|
| F1 | **⚑ `$effect(` returns 92, not 211.** Both the roadmap and § 0 fact 24 state 211 for the same command | `grep -rn '\$effect(' apps/frontend/src` → **92** (also 92 at `bff94f382`) |
| F2 | 92 sites span **54 files**; **0** are in test files | `grep -rl` → 54; `grep … \| grep -c '\.test\.'` → 0 |
| F3 | Heaviest file holds **5** — fact 24's "the top file has 5" reproduces exactly | `routes/+layout.svelte` (5), `voterContext.svelte.ts` (5), then three files at 3 |
| F4 | A further **38** `$effect.root(` lines exist (test scaffolding; not conversion candidates) | `grep -rn '\$effect\.root('` → 38; combined `$effect(`+`$effect.root(` = 130 |
| F5 | `$derived(` returns **207** — the nearest number to the doc's 211; a plausible but unproven transcription source | `grep -rn '\$derived('` → 207 |
| F6 | The two named sites are real | `PasswordSetter.svelte:55` and `:58`, both `$effect(() => {` |

### Components

| # | Fact | Evidence |
|---|---|---|
| F7 | `MultipleTextInput.svelte` = **228** lines; `Input.svelte` = **692** — both as stated | `wc -l` |
| F8 | `MultipleTextInput.type.ts` (**55** lines) also exists; unnamed by the roadmap | `apps/frontend/src/lib/components/input/` |
| F9 | `EntityCardAction`: **12** refs / **4** files — but 6 of the 12 are inside the two files being deleted; only **2** consumer files need edits | `EntityCard.svelte` (5, use at `:220`) · `results/[[electionTab]]/+layout.svelte` (1) |
| F10 | `EntityCardAction.svelte` = 59 lines, `EntityCardAction.type.ts` = 18 lines | `wc -l` |
| F11 | The `–` escape is at **`EntityCardAction.svelte:12`** (`– default: The contents to wrap.`) — Phase 152's A5 target, inside a file 159 deletes | verified by `sed -n '8,16p'` |
| F12 | `Alert.svelte` (128 lines): `-mt-[1rem] sm:mt-0` at **`:114`**, `top-2 right-2` at **`:117`** | verified |

### Contexts

| # | Fact | Evidence |
|---|---|---|
| F13 | `contexts/utils/` **already exists** (`inheritContextMembers.ts`, `paramState.svelte.ts`, `persistedState.svelte.ts`, `prepareDataWriter.ts`, `questionBlockState.type.ts`, `SettingsOverlay.svelte.ts` + tests) — criterion 5's destination is a move into a live directory, not a new one | `ls apps/frontend/src/lib/contexts/utils` |
| F14 | `reactiveHandle.type.ts` (10 lines, `ReactiveHandle` + `WritableHandle`) has exactly **2** importers | `contexts/app/survey.svelte.ts:1` · `contexts/app/tracking/trackingService.svelte.ts:6` |
| F15 | The duplicated rollup: `candidateContext.svelte.ts:355` (`$effect`) and its twin at **`voterContext.svelte.ts:467`** — the candidate copy filters on `entityType: ENTITY_TYPE.Candidate`, the voter copy on `{ elections, constituencies }` only (`:474`). **They are not identical**; the shared utility must parameterise the difference | verified by reading both |
| F16 | The candidate copy reads `dataRoot` as `const dr = this.#dataRoot;` at `:356` — the `#version`-bridge accessor. See the `<domain>` hard constraint | `candidateContext.svelte.ts:356` |
| F17 | `voterContext.svelte.ts:37` is `function sameRefs<TItem>(a, b)`, preceded by a 10-line comment (`:28-36`) explaining the Phase-64 filter-badge regression it guards. **The comment must move with it** | verified |
| F18 | `voterContext.svelte.ts` = 686 lines / 5 `$effect(`; `candidateContext.svelte.ts` = 615 lines / 3 | `wc -l`, `grep -c` |
| F19 | Tracking: `trackingService.type.ts` (52) declares `TrackingService`; `trackingService.svelte.ts:17` declares `RuneTrackingService = Omit<TrackingService, 'sendTrackingEvent'\|'sessionId'\|'shouldTrack'> & {…}` — the second layer re-declares three members the first already has | verified |
| F20 | `sessionId` has **0** `.svelte` consumers; 4 context classes re-declare it (`appContext:206`, `candidateContext:261`, `voterContext:358`, `adminContext:93`); its only real read is internal (`appContext:329` → `surveyLink`); one test asserts it (`appContext.spread.svelte.test.ts:178`) | `grep -rn 'sessionId' apps/frontend/src` |

### Config surface

| # | Fact | Evidence |
|---|---|---|
| F21 | `kit.alias` declares exactly 3 aliases; **no `$layouts`** | `apps/frontend/svelte.config.js:11-15` |
| F22 | `apps/frontend/tsconfig.json` extends `./.svelte-kit/tsconfig.json` — alias paths are generated, no manual TS edit needed | verified |
| F23 | `apps/frontend/vitest.config.ts:25-28` **hand-declares** `$lib`/`$types`/`$voter`/`$candidate`; a new alias must be added here too or unit tests break | verified |
| F24 | Route root currently holds 10 non-route files + `README.md`; `loginRedirectTarget.ts` among them is **158's** to move | `find apps/frontend/src/routes -maxdepth 1 -type f` |

### Provenance

| # | Fact | Evidence |
|---|---|---|
| F25 | **No box is ticked and no free text appears anywhere in § H.** All six decisions resolve to `(a)` by the document's stated default rule | `grep -n '^\s*- \[x\]'` returns 16 ticks, none between the § H and § I headers; `grep` for `**EDIT:**`/`**NOTE:**` finds 7, none in § H |
| F26 | The two operator NOTEs that bind 159 are on **G5** (`:554`) and **G1** (`:501`) — both in § G (Phase 158) | verified |
| F27 | The roadmap's Phase 159 entry was itself corrected on 2026-08-28 against § 0 fact 24 and now restates the 211 figure — so **both** documents carry the number F1 disproves | `.planning/ROADMAP.md` § Phase 159, "Corrected 2026-08-28" preamble + criterion 1 |

</facts>

<open>
## Open Items

### O1 ⚠ — The 211/92 discrepancy needs an owner

Fact 24 and the roadmap's Phase 159 criterion 1 both assert **211**; the cited command returns **92**
(F1–F5). This context file records the measurement and sizes the phase at 92, but **it does not edit
`ROADMAP.md`** (out of scope for this pass, and another agent is concurrently editing that entry).
Someone must correct fact 24 and roadmap criterion 1, or the next reader re-derives 211. Until then,
treat 92 as the number and this section as the reason.

### O2 — Six review comments in the 159 triage that no roadmap criterion covers

`.planning/PRE-SHIP-REVIEW-TRIAGE.md` § "Phase 159" lists **14** comments; the roadmap's six criteria
account for eight of them. Uncovered, each verified to exist:

| Comment | Location | Status |
|---|---|---|
| "This ad hoc rollup is fixed in the last branch of the stack" | `contexts/app/appContext.svelte.ts:335` (inside the EXPLICIT FORWARDING comment block) | Reviewer says **already fixed** — likely no action; confirm and close |
| "Check whether these utils are any longer needed after the extraction of translation utils to app-shared" | `lib/i18n/init.ts:52` (`export function translate(...)`) | **Depends on Phase 157's app-shared extraction.** Unassigned |
| "Remove default." | `lib/utils/constants.ts:10` — `PUBLIC_IDENTITY_PROVIDER_TYPE: env.… ?? 'signicat'` | Unassigned; small, but it changes runtime behaviour when the env var is unset |
| "Rename to `alliances.ts`" | `lib/utils/getAllianceSummary.ts` | Unassigned; **overlaps the G1 `lib/utils` sweep NOTE (158)** |
| "If so, `minSelection` should be checked to be > 0." | `lib/utils/multiChoiceValidity.ts:8` | Unassigned; touches the voter/candidate save gate — needs a test |
| "Add as a follow-up blocking task for me to UAT: BooleanInput, multi-select choices" | `lib/components/questions/QuestionChoices.svelte:1` | **Pulled INTO this phase by the D-N2 operator NOTE.** Not open — but the roadmap's criteria do not mention it, so the planner must add it deliberately |

Recommendation: fold the four cheap `lib/utils` / `i18n` items into 159 as a seventh work item **or**
file them in `.planning/todos/pending/` — but decide explicitly, because right now they are in the
triage and in no criterion.

### O3 — `REVIEW-CMP-01..06` do not exist in `REQUIREMENTS.md`

The roadmap's Phase 159 entry declares `**Requirements**: REVIEW-CMP-01..06`, but
`grep -c 'REVIEW-' .planning/REQUIREMENTS.md` returns **0** — no `REVIEW-*` id of any kind is in that
file (the same is true of 158's `REVIEW-RT-01..07`). Either the ids need adding to `REQUIREMENTS.md`
or the roadmap's requirement line is nominal. Verification tooling that resolves requirement ids will
not find these.

### O4 — The N3(a) `159-DISCUSSION-LOG.md` pointer file was not written

D-N3(a) specifies "one `<padded>-CONTEXT.md` per phase … **plus a shared `<padded>-DISCUSSION-LOG.md`
pointer back here**". This pass was scoped to write only `159-CONTEXT.md`, so the pointer file does
not exist. Either create it, or accept the `Source of decisions` line at the top of this file as the
pointer.

### O5 — Unresolved by any decision, needed before implementation

- **The census's classification test.** D-H1 says the table records "pure-function-of-inputs? ·
  disposition", but the exact predicate that makes a site "unambiguous" enough to convert is not
  defined. Define it in the plan, in one sentence, and apply it uniformly — otherwise the census's
  92 dispositions are 92 judgement calls.
- **Cold-entry verification method for converted sites.** The `dataRoot` carve-out only manifests on
  cold / direct-URL entry. The phase needs a stated way to check that — a direct-URL E2E path, or the
  Spike-024 classification — not "it looked fine on click-through".
- **Whether any H1 conversion requires a `$bindable` prop.** D-H1(a) bounds the risk by converting
  only unambiguous sites, but "unambiguous" and "does not need `$bindable`" are not stated to be the
  same set. If a conversion would change a component's public contract, it belongs in the census as
  *recorded, not converted*.
- **E2E gate.** Per `CLAUDE.md`'s cardinal rule this phase cannot complete with a failing E2E test, and
  it touches `EntityCard`, `Input`, `Alert`, the route-root layout components and both orchestrating
  contexts — the widest blast radius in the v2.15 run. Budget a full-suite run (fresh dev server on
  :5173, `db:reset`) as part of the phase, not after it.

</open>

---

*Phase: 159-component-context-consolidation*
*Context gathered: 2026-08-28*
---

## OPERATOR AMENDMENT — 2026-08-29 (decision D2): the 12th path alias is permitted

Standing blocker 2 from the v2.15 planning close is **discharged**. Ruling recorded in
`.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § D2.

`153-04` (Phase 153, wave B) collapses 11 `__dirname` usages in `apps/frontend/vitest.config.ts`
to one `import.meta.url`-derived constant. Its acceptance criteria pin **"all 11 measured usages"**
(`:18,22,25,26,27,28,32,36,40,44,48`) and gate on **`Tests 816 passed (816)`** / `Test Files 54
passed (54)`.

**Those figures are point-in-time execution gates, not standing invariants.** Verified before
Phase 153 ran: the numbers appear only as acceptance criteria inside `153-04-PLAN.md`; **no shipped
guard, script or config hard-codes 11 or 816.** `153-04` therefore executed correctly as written —
at its execution time the tree genuinely had 11 aliases and 816 tests — and it was **not** amended.

**What this means for Phase 159:**

1. **Adding a 12th path alias (`$layouts`) is permitted.** It does not violate 153-04, whose
   "collision surface: None" claim describes the tree as measured then, not a contract on the
   future.
2. **Re-derive both numbers; do not inherit them.** Measure the current alias count and the current
   `Test Files` / `Tests` totals at execution time and gate on what you measure. A plan that
   inherits `816` will red spuriously the moment 159 adds or moves a spec.
3. **Do not treat 153-04 as a contradiction to escalate.** This amendment is the answer; no
   checkpoint is required and no deviation should be filed for it.

House rule 3 applies with full force here: trust your own measurement over an inherited number.
