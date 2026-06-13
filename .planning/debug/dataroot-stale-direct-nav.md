---
status: diagnosed
trigger: "Stale/empty dataRoot on DIRECT-URL navigation to /elections (v2.13 milestone-close). The reactive-accessor consumption pattern `const dataRoot = $derived(voterCtx.dataRoot)` works when arriving via the intro page's Continue button, but navigating directly by URL to /elections yields a STALE EMPTY dataRoot because the data has not been loaded/provided into the context yet at the time the $derived alias is first evaluated. Operator already corrected the elections page alone by switching to the full accessor inside `let elections = $derived.by(() => ...voterCtx.dataRoot...)`. GOAL: find the root cause and determine SCOPE — does this affect only dataRoot, or is it a general defect across ALL `$derived(ctx.X)` reactive-accessor consumers documented in CLAUDE.md's Context Destructuring Rule? Do NOT change all such derivations yet — diagnose first. A spike will validate the findings afterward."
created: 2026-06-13T00:00:00Z
updated: 2026-06-13T00:00:00Z
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED. Root cause is the Svelte 5 `$derived` referential-equality short-circuit applied to an INTERMEDIATE alias over an IDENTITY-STABLE reactive accessor (`dataRoot`). `dataRoot` is a stable DataRoot object reference whose only reactive trigger is the dataContext `#version` $state counter (bumped untracked on each `DataRoot.update()`). When a consumer writes `const dataRoot = $derived(ctx.dataRoot)`, that `$derived` recomputes on `#version` change BUT yields the SAME object reference; per Svelte 5 push-pull semantics ("if the new value of a derived is referentially identical to its previous value, downstream updates will be skipped"), the alias does NOT notify downstream consumers. A downstream `$derived.by(() => alias.elections)` / template `{#if alias.elections}` therefore never re-runs when data is provided, so it keeps showing the empty initial snapshot. Reading `ctx.dataRoot.<prop>` DIRECTLY inside the consuming thunk makes the thunk itself depend on `#version`, so it re-runs and reads the now-populated property. Direct-URL cold entry merely EXPOSES the latent bug (data is provided after mount); intro→Continue MASKS it (data already provided before the alias first computes, and the consumer never needs to react to a later change).
test: COMPLETE — (1) dataContext.svelte.ts confirms stable-ref + #version mechanism; (2) git diff HEAD of elections/+page.svelte confirms the only-change is alias→direct-read inside the SAME $derived.by; (3) appContext/voterContext/candidateContext confirm dataRoot forwarded as the same stable-ref accessor; (4) Svelte 5.53.12 official docs + issue tracker confirm the referential-equality downstream-skip; (5) enumerated all 14 `$derived(ctx.dataRoot)` alias sites and classified.
expecting: SCOPE answer delivered below. Not dataRoot-on-elections-only: it is a GENERAL latent defect for the `$derived(ctx.X)`-alias pattern whenever X is an identity-stable mutated-in-place accessor (dataRoot is the prime instance; answers/sub-store handles are the same class). appSettings + locale are NOT affected (their values change reference/scalar on update, so the alias propagates). Several other dataRoot consumers carry the same latent pattern but are masked by route gating ((located) waits for data) or by a co-tracked reference that changes.
next_action: DIAGNOSE-ONLY complete. Return Root Cause Report + scope map to caller. Do NOT apply fixes. A spike will validate; recommend the spike repro the OLD elections alias form under direct-URL cold entry and assert empty list, then assert constituencies/+page.svelte + info/+page.svelte exhibit the same staleness under cold entry.

## Symptoms

expected: Navigating directly by URL to /elections (cold entry, no prior intro page) renders with a fully populated dataRoot and the elections list, identically to arriving via the intro page's Continue button.
actual: Direct-URL entry to /elections renders with a STALE EMPTY dataRoot (data not yet loaded/provided into context when the `$derived(voterCtx.dataRoot)` alias is first evaluated); the value never updates when data arrives. Arriving via intro→Continue works because data is already populated by mount time.
errors: No thrown error — silent empty/stale state (empty elections list / missing data) rather than a crash.
timeline: Surfaced during v2.13 milestone-close review. Related to the v2.13 Phase 113 handle-flatten that made appSettings/dataRoot/locale bare reactive accessors (per CLAUDE.md). Prior `elections-continue-stall` debug session (resolved) examined the Continue-click DEFAULT path only and explicitly did NOT cover direct-URL entry — this is distinct.
reproduction: Navigate directly by URL to /elections (e.g. paste the URL / hard-load) without first visiting the intro page and clicking Continue. Observe stale empty dataRoot. Contrast: intro → click Continue → /elections works. Operator's local fix (elections page only): replace `const dataRoot = $derived(voterCtx.dataRoot)` consumption with `let elections = $derived.by(() => ... voterCtx.dataRoot ...)`.

## Investigation Constraints

- DIAGNOSE ONLY. Do NOT change all `$derived(ctx.X)` derivations. The deliverable is a Root Cause Report + a SCOPE map (only-dataRoot vs general across reactive-accessor consumers). A spike will validate before any broad codemod.
- The elections/+page.svelte fix is ALREADY applied by the operator (full `$derived.by` accessor). Treat it as a known-good data point, not as work to redo.
- Anchor in CLAUDE.md's "Context Destructuring Rule": reactive accessors are appSettings, dataRoot, locale (flattened in v2.13 Phase 113), selectedElections, selectedConstituencies, opinionQuestions, infoQuestions, matches, etc. The canonical safe pattern is documented as `const X = $derived(ctx.X)` — this bug suggests that pattern has a direct-URL-entry hole worth characterizing.
- Distinguish the DESTRUCTURE trap (captures initial empty array, documented) from this NEW init-vs-load ORDERING / tracking-edge issue on direct entry. They may share a root or be separate.
- Part of the v2.13 milestone closing phase.

## Eliminated

- hypothesis: The difference is "tracking scope vs non-tracking scope" — direct-URL entry reads the alias in a non-tracking position.
  evidence: The operator's actual fix (git diff HEAD) changes ONLY `let result = dataRoot.elections;` → `let result = voterCtx.dataRoot.elections;` INSIDE the SAME `$derived.by(() => {...})` thunk. Both before and after are in a tracking scope. The before-fix `dataRoot` was itself `const dataRoot = $derived(voterCtx.dataRoot)`. So the defect is NOT tracking-scope presence; it is the INTERMEDIATE `$derived` alias over a stable-reference accessor.
  timestamp: 2026-06-13

- hypothesis: dataRoot is "special" because it is populated by a deferred post-mount $effect/async load that only defers on direct entry (an ordering/provisioning artifact unique to dataRoot).
  evidence: dataRoot population IS deferred to an async load (`(located)/+layout.svelte` updateAsync → dataRoot.update(...provide*)), but this deferral is identical on BOTH entry paths and the elections page is NOT even under (located). The real differentiator is the reactivity MECHANISM of the dataRoot accessor (stable object ref + #version counter), not a dataRoot-specific load ordering. Population timing is a contributing condition (data arrives after mount on cold entry) but the root cause is the $derived-alias-over-stable-ref equality short-circuit, which generalizes to ANY stable-reference reactive accessor.
  timestamp: 2026-06-13

## Evidence

- timestamp: 2026-06-13
  checked: dataContext.svelte.ts (the dataRoot reactive accessor definition)
  found: `dataRoot` is a STABLE object reference. The getter is `get dataRoot() { void self.#version; return dataRoot; }` — it ALWAYS returns the same DataRoot instance and is reactive ONLY via the `#version` $state counter, which is bumped (untracked) inside `dataRoot.subscribe(() => this.#version++)` on every `DataRoot.update()`. Data is mutated IN PLACE on the same instance; the reference never changes.
  implication: Any consumer is reactive to data arrival ONLY if it reads `voterCtx.dataRoot` (and thus `#version`) inside a tracking scope that actually RE-RUNS on `#version` change. An intermediate `$derived` that returns the stable ref will recompute but yield an equal value and NOT propagate.

- timestamp: 2026-06-13
  checked: git diff HEAD of elections/+page.svelte (operator's uncommitted fix) — the known-good comparison point
  found: The ONLY change is removing `const dataRoot = $derived(voterCtx.dataRoot)` and reading `voterCtx.dataRoot.elections` directly inside the existing `let elections = $derived.by(() => {...})` thunk. BROKEN form read `dataRoot.elections` off the alias; FIXED form reads `voterCtx.dataRoot.elections` directly.
  implication: The defect is the `$derived`-alias INDIRECTION over a stable-reference accessor, not the consuming derivation. `$derived(voterCtx.dataRoot)` computes the DataRoot instance; because the reference is identity-stable across `provide*` calls, the alias's value never changes by Svelte's equality check, so it never marks downstream dirty — even though `#version` bumped. The downstream `$derived.by` depends on the ALIAS value (stable) not on `#version`, so it never re-runs when data arrives. Reading `voterCtx.dataRoot` directly inside the thunk makes the thunk itself depend on `#version`, so it re-runs and re-reads `.elections` (now populated).

- timestamp: 2026-06-13
  checked: appContext.svelte.ts dataRoot/appSettings/locale accessor definitions
  found: dataRoot accessor forwards dataContext's stable-ref getter (`void #version; return dataRoot`). appSettings accessor returns `#appSettingsValue` ($state object — REPLACED by a new object on re-merge via mergeAppSettings, so its reference DOES change). locale forwards componentCtx.locale (a $derived/$state scalar string — value changes).
  implication: appSettings and locale change their VALUE/REFERENCE on update, so `$derived(ctx.appSettings)` DOES propagate (new object each merge). dataRoot is the ONLY one of the three flattened accessors whose value is an identity-STABLE object reactive via a side-channel version counter. This predicts the defect is dataRoot-specific among {dataRoot, appSettings, locale} — but generalizes to ANY accessor returning a stable mutated-in-place object (e.g. `answers`, sub-store instances).

- timestamp: 2026-06-13
  checked: route structure — elections page is at (voters)/elections/, NOT under (voters)/(located)/
  found: The (located)/+layout.svelte that calls dataRoot.update(...provide*Data) does NOT wrap the elections page. Election/constituency data for /elections is provided via the root/(voters) loader chain (electionData/constituencyData from parent()), resolved into the shared context dataRoot. On cold direct-URL entry the provide* happens after the page component mounts and its $derived aliases have first-evaluated.
  implication: Cold direct entry = data arrives AFTER alias first-eval (empty DataRoot at mount). Intro→Continue = a prior (located) or loader pass already provided data, so dataRoot.elections is non-empty at the moment the alias first computes — masking the bug. The bug is a LATENT alias-indirection defect EXPOSED by the cold-entry timing, not caused by it.

- timestamp: 2026-06-13
  checked: Svelte 5.53.12 official $derived docs + sveltejs/svelte issue tracker
  found: Official docs — push-pull reactivity: "if the new value of a derived is referentially identical (same reference in memory) to the previous value, the reactivity system skips notifying downstream consumers." Issue #14772 documents the exact failure for a derived reading an object whose reference doesn't change.
  implication: This is the authoritative confirmation of the mechanism. `$derived(ctx.dataRoot)` returns the identity-stable DataRoot every recompute → downstream-skip → consumer never reacts to in-place data provision.

- timestamp: 2026-06-13
  checked: candidateContext.svelte.ts dataRoot forwarding
  found: candidate context forwards the SAME appContext.dataRoot stable-ref accessor via inheritContextMembers (line 108 `get #dataRoot() { return this.#appContext.dataRoot; }`). Same mechanism as voter context.
  implication: The scope map spans voter + candidate + admin apps — any app reading dataRoot through the shared accessor is subject to the same alias-indirection defect.

## Resolution

root_cause: |
  Svelte 5 `$derived` referential-equality downstream-skip applied to an INTERMEDIATE
  alias over an IDENTITY-STABLE reactive accessor.

  `dataRoot` (dataContext.svelte.ts) is a STABLE DataRoot object whose accessor is
  `get dataRoot() { void #version; return dataRoot; }`. Data is mutated IN PLACE via
  `DataRoot.update(() => dr.provide*Data(...))`; the object reference NEVER changes.
  Reactivity is carried solely by the `#version` $state counter, bumped (untracked) in
  `dataRoot.subscribe(() => #version++)` on every update. appContext + voter/candidate
  contexts forward this accessor unchanged (Phase 113 FLATTEN-02).

  When a consumer aliases it as `const dataRoot = $derived(ctx.dataRoot)`, that alias
  $derived recomputes when `#version` changes, but its computed VALUE is the same DataRoot
  reference each time. Per Svelte 5 push-pull semantics, a derived whose new value is
  referentially identical to its previous value does NOT notify downstream consumers.
  So any downstream `$derived`/template/`$effect` that reads a PROPERTY off the alias
  (e.g. `dataRoot.elections`) depends on the alias's (never-changing) value, not on
  `#version`, and is never re-run when data is provided — it keeps rendering the empty
  initial snapshot. Reading `ctx.dataRoot.<prop>` DIRECTLY inside the consuming thunk makes
  the thunk itself take the `#version` dependency, so it re-runs and reads the populated value.

  Direct-URL cold entry EXPOSES the latent bug because data is provided after the alias has
  first computed against an empty DataRoot. Intro→Continue MASKS it: data is already provided
  before the alias first computes, so the consumer reads a populated value once and never needs
  to react to a later change. The bug is alias-indirection, not load ordering — ordering only
  controls whether the latent defect is observable.

scope: |
  GENERAL, but precisely bounded — NOT dataRoot-on-elections-only, and NOT all reactive accessors.

  AFFECTED CLASS: the `const X = $derived(ctx.X)` alias pattern is unsafe ONLY when X is an
  IDENTITY-STABLE, mutated-in-place reactive accessor (value reference is constant across
  updates; reactivity carried by a side-channel version counter). In this codebase:
    - dataRoot  → AFFECTED (the prime instance; stable DataRoot + #version bridge).
    - answers / sub-store `.value` handles that return a stable instance → SAME CLASS, audit recommended.

  NOT AFFECTED (alias is safe) — the other two flattened accessors named in CLAUDE.md's rule:
    - appSettings → returns `#appSettingsValue`, REPLACED with a NEW object on each mergeAppSettings
      re-merge, so the alias's value reference changes and downstream propagation fires normally.
    - locale → scalar string from componentCtx; value changes, alias propagates.
    Array/scalar accessors that REPLACE their value (selectedElections, opinionQuestions, matches, …)
    are also safe under the alias pattern for the SAME reason — but note the SEPARATE, documented
    DESTRUCTURE trap still applies to them (destructuring captures the initial empty array). The
    alias-indirection defect here is DISTINCT from the destructure trap: it bites a CORRECTLY
    $derived-aliased stable-ref accessor.

  CLAUDE.md correction implied: the "Context Destructuring Rule" lists the canonical safe pattern as
  `const X = $derived(ctx.X)`. That guidance is CORRECT for value-replacing accessors (appSettings,
  locale, the array accessors) but has a HOLE for identity-stable accessors (dataRoot): for those the
  ONLY safe consumption is reading `ctx.X.<prop>` directly inside the consuming tracking scope (the
  operator's elections fix), never through an intermediate `$derived` alias.

  CONSUMER MAP — all 14 `$derived(ctx.dataRoot)` alias sites (the at-risk pattern):
    LATENT-VULNERABLE (alias property-read inside a reactive tracking scope; would go stale on cold entry):
      1. routes/(voters)/elections/+page.svelte          → ALREADY FIXED by operator (known-good).
      2. routes/(voters)/constituencies/+page.svelte     → $derived.by(()=>dataRoot.constituencyGroups) + $derived(...dataRoot.elections); SAME pattern as the bug. HIGH-CONFIDENCE next repro.
      3. routes/(voters)/info/+page.svelte                → template {#if dataRoot.elections}{#each dataRoot.elections}.
      4. lib/dynamic-components/entityDetails/EntityInfo.svelte → template {#if dataRoot.elections.length>1}.
      5. lib/dynamic-components/questionHeading/QuestionHeading.svelte → $derived(... : dataRoot.elections) (fallback branch only).
      6. lib/dynamic-components/entityCard/EntityCard.svelte → $derived.by passes dataRoot to getCardQuestions.
      7. routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte → $derived(...dataRoot.getQuestionCategory).
      8. routes/(voters)/(located)/questions/+layout.svelte → $derived.by(()=>dataRoot.getQuestion). Masked by (located) data-ready gate.
      9. routes/candidate/preregister/(authenticated)/elections/+page.svelte → template elections={dataRoot.elections}.
      10. routes/candidate/(protected)/questions/[questionId]/+page.svelte → $derived.by(()=>dataRoot.getQuestion). Masked by protected gate.
      11. routes/candidate/(protected)/profile/+page.svelte → {@const ...parseNomination()} reads dataRoot.getElection. Likely masked by nominations-ref change.
      12. routes/admin/(protected)/argument-condensation/+page.svelte → {#each dataRoot.elections}.
      13. routes/admin/(protected)/question-info/+page.svelte → {#each dataRoot.elections}.
    NOT-VULNERABLE (imperative reader / writer — reads live value at call time, no reactive staleness expectation):
      14. routes/(voters)/(located)/+layout.svelte → dataRoot.update/provide* inside async updateAsync(); this is the WRITER + gates the (located) subtree on ready.
      (preview is the candidate WRITER: dataRoot.provideEntityData inside async — also imperative.)

  Why several latent-vulnerable sites don't currently misbehave: route gating. The (located) layout
  blocks its subtree behind `ready` (set true only after updateAsync provides data), so questions/*
  aliases first-compute against an already-populated DataRoot. /elections, /constituencies, /info,
  candidate /elections, and admin pages are NOT behind such a gate, so they are the genuine cold-entry
  exposures. The dynamic-components (EntityCard/EntityInfo/QuestionHeading) only render inside
  already-populated results/details routes, so they are masked in practice but carry the latent pattern.

fix: |
  NOT APPLIED (diagnose-only). The known-good fix shape (operator, elections page): delete the
  `const dataRoot = $derived(ctx.dataRoot)` alias and read `ctx.dataRoot.<prop>` directly inside the
  consuming `$derived`/`$derived.by`/template tracking scope, so the consumer takes the `#version`
  dependency. Spike should validate this scope map before any broad codemod; highest-confidence repro
  is constituencies/+page.svelte (lines 56-62) and info/+page.svelte (template) under direct-URL cold entry.

verification: NOT APPLIED (diagnose-only). Spike will own live repro + validation.

files_changed: []

## Specialist Review

- timestamp: 2026-06-13
  specialist_hint: react (closest allowed match for the Svelte 5 $derived reactivity framework domain; no Svelte-specific specialist exists in the allowed set)
  mapped_skill: typescript-expert
  outcome: NOT DISPATCHED — the `typescript-expert` agent/skill is not installed in this environment (Agent tool returned "agent type not found"). Per the routing convention, proceeding without specialist review. The root cause is anchored in official Svelte 5.53.12 `$derived` push-pull semantics (referential-equality downstream-skip) and confirmed by the operator's known-good elections fix, so the diagnosis stands without a specialist second opinion. A future spike will validate the scope map against live cold-entry repro (constituencies/+page.svelte, info/+page.svelte) before any broad codemod.