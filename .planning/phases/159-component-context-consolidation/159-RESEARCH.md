# Phase 159: Component & Context Consolidation - Research

**Researched:** 2026-08-28
**Domain:** Svelte 5 runes (`$effect`→`$derived`, snippets, `$bindable`), SvelteKit path aliases, Tailwind v4 theme tokens, frontend component/context refactoring
**Confidence:** HIGH for everything measured in-tree (the bulk of this document); MEDIUM for the two Svelte-doc claims; LOW for nothing that gates a decision.

**Measurement baseline.** Every count, path and line number below was re-measured this session on
branch `integration/ship-12-squash`, HEAD `db220cb5f` (`docs(v2.15): make the CONTEXT decisions
parseable by the plan-phase gate`). That is one commit past the `e1ab15f71` at which `159-CONTEXT.md`
measured; `git diff` shows no `apps/frontend/src` change between them, so the CONTEXT facts F1–F27
remain directly comparable. Divergences from CONTEXT.md are called out explicitly and marked ⚑.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied from `.planning/phases/159-component-context-consolidation/159-CONTEXT.md`. **All six § H
decisions won on option (a) by the discussion document's stated default rule** (no box ticked, no free
text in § H). Two § N decisions carry binding operator free text. Do not re-litigate any of these.

### Locked Decisions

- **D-H1 — How wide is the `$effect` census.** Won: **(a)** *"Census all [N] into a committed table
  (file:line · pure-function-of-inputs? · disposition); convert only the unambiguous ones."*
  Rejected: (b) contexts/components only; (c) fix `PasswordSetter` only; (d) census **and convert every
  convertible site** — rejected because "converting effect-writes-to-prop into `$derived` requires each
  target to become `$bindable`, so this changes ~dozens of component contracts in a single phase".
  **Binding size: 92 sites across 54 files**, not 211.

- **D-H2 — `MultipleTextInput` (228 lines) and `Input` (692 lines).** Won: **(a) — the
  EXTRACT-AND-IMPORT variant, not the fold.** *"Extract the input part and import it into `Input`,
  applying the same extraction to the other complex types; land multilingual support in the same
  change."* Multilingual is **not deferrable**; acceptance wording is the reviewer's own: *"each text
  item behaves much the same as a normal multilingual text item."* `MultipleTextInput.type.ts` (55
  lines) moves with the extracted prop contract.

- **D-H3 — `EntityCardAction` → snippet.** Won: **(a)** *"Replace with a snippet; delete both the
  component and its `.type.ts`."*

- **D-H4 — Tracking service: two layers → one.** Won: **(a)** *"One type, one implementation; narrow
  the consumer interface, dropping `sessionId` and any other internal-only member from it."*
  `appContext.spread.svelte.test.ts:178` "must be updated as part of the narrowing, not worked around".
  `sendTrackingEvent` "is explicitly consumer-facing by design … so it stays".

- **D-H5 — The `$layouts` alias and the `MainContent` move.** Won: **(a)** *"Add `$layouts` →
  `src/lib/layouts` in `svelte.config.js`; move `MainContent` and the other route-root components
  behind a barrel."* Three config places, not one: `svelte.config.js:11-15`; the *generated*
  `.svelte-kit/tsconfig.json` (verify by typecheck, do not hand-edit `apps/frontend/tsconfig.json`);
  and the hand-maintained `apps/frontend/vitest.config.ts:25-28`, which **will break silently** if
  missed.

- **D-H6 — `Alert.svelte` ad-hoc spacing.** Won: **(a) — BOTH values.** `:114` (`-mt-[1rem] sm:mt-0`)
  and `:117` (`top-2 right-2`). *"Rendering must not change perceptibly — pick the semantic class
  nearest the current computed value and say which, per site, in the plan."*

- **D-N1 — Sequencing.** Won: **(a).** Phase 152's comment purge runs **first** and lands a
  `\uXXXX`-in-comment scan in `yarn lint:check`. **Every comment 159 writes** — snippet docs, extracted
  utility headers, the census table's prose — must satisfy that convention (no `\uXXXX` escapes; no
  forced line breaks per the A4 rule).

- **D-N2 — Where the follow-up comments land.** Won: **(a)** — file each in `.planning/todos/pending/`,
  implement none — **overruled in part by operator free text** (`.planning/v2.15-DISCUSSION-POINTS.md:554`):
  > **NOTES**: Implement the blocking ones within 158/9 or so.

  Binding effect: 159 **files** the todo **and additionally implements** the blocking
  `QuestionChoices.svelte:1` item (BooleanInput + multi-select choices) so it is ready for the
  operator's UAT. Non-blocking G5 items in 159's surface stay filed and unimplemented. *"within 158/9
  or so"* is deliberately soft: if the blocking item proves to be its own design problem at plan time,
  **raise it as a `checkpoint:decision` rather than silently deferring it.**

  Related operator NOTE on **G1** (`:501`, Phase 158's): *"Also, sweep other content of lib/utils and
  make a proposal of other sections to move directly to lib."* **That sweep is 158's**; 159 must
  coordinate, not move the same files twice.

- **D-N3 — CONTEXT.md shape.** Won: **(a).** One CONTEXT.md per phase plus a `159-DISCUSSION-LOG.md`
  pointer. ⚑ Both files now exist (`159-DISCUSSION-LOG.md`, 1628 bytes) — CONTEXT.md's O4 is stale.

### Claude's Discretion

- The **file name and location of the census artifact**. `159-EFFECT-CENSUS.md` in this phase dir
  follows the `137-NEGATIVE-CONTROL.md` precedent.
- The **classification script** for the census — throwaway vs. committed. Only the *table* must be committed.
- Exactly **which semantic classes** replace `top-2 right-2` and `-mt-[1rem]`, provided rendering is unchanged.
- The **internal module layout** of the extracted `Input` sub-components and of the shared context
  utility, provided the destructure-trap and `dataRoot` rules hold.
- Whether the shared `questionCategories` rollup utility lives in `contexts/utils/` alongside the
  relocated `reactiveHandle.type.ts` or elsewhere under `lib/`.

### Deferred Ideas (OUT OF SCOPE)

- The backend, and every package outside `apps/frontend`.
- Any visual change anywhere except `Alert`'s two spacing values — **and those must render identically**.
- Mass-moving files out of `lib/utils/` (that is 158's G1 proposal, and a *proposal only*).
- The non-blocking G5 follow-up comments (filed, not implemented).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

### ⚑ CORRECTION to CONTEXT.md `<open>` O3 — the requirement IDs **do** exist

CONTEXT.md O3 states *"`grep -c 'REVIEW-' .planning/REQUIREMENTS.md` returns **0**"*. That is **no
longer true on this tree.** Re-measured this session:

```
grep -c 'REVIEW-' .planning/REQUIREMENTS.md              →  116
grep -n 'REVIEW-CMP' .planning/REQUIREMENTS.md           →  lines 151-156, 303-308, 340
```
`[VERIFIED: .planning/REQUIREMENTS.md:151-156]`

The IDs were added by commit `48713631f` *"docs(v2.15): build the 152-164 planning baseline from the
filled discussion"*. **O3 is discharged: do not add the IDs, they are already there.** The traceability
table at `:303-308` maps all six to "Phase 159 — Component & Context Consolidation | Pending", and
`:340` records `159 … | REVIEW-CMP-01..06 | 6`.

| ID | Description (verbatim from REQUIREMENTS.md) | Research support |
|----|---------------------------------------------|------------------|
| **REVIEW-CMP-01** | "Reactive state is derived where it can be derived: the `$effect` calls at `PasswordSetter.svelte:55` are `$derived` where the value is a pure function of its inputs, and **every other `$effect` in the frontend is audited against the same test** with its disposition recorded per site — a census, not a spot fix. Measured, that census is **211 `$effect` sites** … the recorded artifact is a committed table (file:line · pure-function-of-inputs? · disposition)." | § Census mechanics — **the 211 is wrong, it is 92**; full 14-bucket classification of all 92 below; predicate defined; artifact schema proposed. ⚠ The two named `PasswordSetter` sites are **not** convertible without a contract change — see Pitfall 1. |
| **REVIEW-CMP-02** | "A text item behaves like a normal multilingual text item wherever it appears — `MultipleTextInput` is folded into `Input` (or its input part extracted and imported, with the same extraction applied to the other complex types), and multilingual support lands at the same time." | § Criterion 2 — `Input.svelte`'s five numbered branches enumerated; the four "complex types" named; sole consumer (`QuestionInput.svelte`) and its `Exclude<>` cast identified as the acceptance signal. |
| **REVIEW-CMP-03** | "`EntityCardAction` — a pre-snippet-era workaround — is a snippet, and the separate component no longer exists." | § Criterion 3 — ⚠ blocked on a scoped `<style>` block; only **one** real consumer, not two; `data-testid` is load-bearing for 3 E2E files. |
| **REVIEW-CMP-04** | "There is one tracking-service type and one implementation, and members used only internally (`sessionId` among them) are absent from the consumer-facing interface rather than merely documented as internal." | § Criterion 4 — `sessionId` **and** `shouldTrack` both confirmed zero-external-consumer; the two-test lock; the wholesale-vs-selective forwarding crux. |
| **REVIEW-CMP-05** | "Context code has one home per concern: `reactiveHandle.type.ts` lives in `contexts/utils`, the duplicated block at `candidateContext.svelte.ts:355` and its `voterContext` twin is one shared utility, and the helper at `voterContext.svelte.ts:37` sits at the bottom of its file or in utils." | § Criterion 5 — both rollups read verbatim; the exact parameterisation delta; the `dataRoot` hazard at the call boundary. |
| **REVIEW-CMP-06** | "Styles come from the design system and a route-root component earns its own home: `Alert.svelte:117` uses the closest available semantic class (e.g. `top-sm`) rather than an ad-hoc value, and `MainContent` plus the other route-root components sit under a `$layouts/main` barrel behind a new alias." | § Criterion 6 — ⚠ the reviewer's `top-sm` suggestion would change rendering **4×**; exact-value tokens identified from compiled CSS; 51-file codemod scoped. |

**Note for the verifier:** REQUIREMENTS.md:151 itself carries the phantom **211**. The number is now
wrong in *three* documents (ROADMAP § Phase 159 criterion 1, `v2.15-DISCUSSION-POINTS.md` § 0 fact 24,
and REQUIREMENTS.md:151). This research does not edit any of them (out of scope per the task brief);
CONTEXT.md O1's "needs an owner" therefore still stands, now with a third document named.
</phase_requirements>

---

## Summary

Phase 159 is **seven loosely-coupled work items wearing one phase's clothing**, and the single most
important planning insight is that only two of them carry real risk. The `$effect` census (criterion 1)
is a *classification* job, not a conversion job: of the 92 sites, a mechanical pass puts **4** in the
unambiguously-convertible bucket and **88** in nine distinct record-don't-convert buckets, each with a
stated reason. The tracking narrowing, the `reactiveHandle` move, the `sameRefs` move, the `Alert`
spacing and the four uncovered `lib/utils`/`i18n` comments are each a handful of lines with a named
test. The risk concentrates in exactly two places: the **`$layouts` move**, which is a 51-file
codemod that collides with Phase 153 in `vitest.config.ts` and breaks *silently* in the unit suite if
the alias is not hand-added there; and the **`Input`/`MultipleTextInput` extraction with multilingual**,
which is the only item that adds behaviour rather than moving it.

Three findings materially change how the phase must be planned, and none of them are in CONTEXT.md.
**First**, criterion 1's own named exemplar defeats criterion 1's own rule: `PasswordSetter.svelte:55`
and `:58` write to `valid` and `errorMessage`, which are **already `$bindable(…)` props**, and Svelte 5
does not permit a `$bindable` prop to hold a `$derived` value. So the two sites the reviewer pointed at
are exactly the class D-H1(a) says to *record, not convert*. The planner must resolve this as a
`checkpoint:decision` — either accept a public-contract change at the three `PasswordSetter` call sites,
or convert the *computation* to a local `$derived` and leave a one-line push effect, and say which in
the census. **Second**, the reviewer's suggested fix for `Alert.svelte:117` — `top-sm` — would change
rendering by 6px per side, because this project overrides Tailwind's spacing scale so that
`--spacing-2 = 0.125rem` while `--spacing-sm = 0.5rem`; and the *same* `top-2 right-2` idiom appears
verbatim in three other components, so it is a house convention rather than an Alert-local defect.
**Third**, `EntityCardAction` cannot become a bare snippet without first relocating its scoped
`<style lang="postcss">` `.hover-shaded` rule, because snippets carry no style scope of their own.

The Svelte 5 reactivity invariants are live throughout, and the phase already owns a runnable proof:
`tests/tests/specs/voter/cold-entry-dataroot.spec.ts` is a purpose-built cold/direct-URL negative
control from Phase 117, and Spike 024 ships a copy-in/copy-out vitest harness that classifies all four
accessor shapes. Between them, `<open>` O5's "cold-entry verification method" is answered with named,
existing artifacts rather than a new invention.

**Primary recommendation:** plan this as six waves ordered *low-risk-first*, with the `$layouts`
codemod isolated in its own wave (it touches 51 files and one file Phase 153 also edits) and the
`Input` extraction last (it is the only item that changes behaviour). Produce the census as a
**committed `159-EFFECT-CENSUS.md` table generated by a committed classifier script**, convert only
the 4 clean sites, and route the two `PasswordSetter` sites and the `$layouts`/`Alert` semantic-class
choices to `checkpoint:decision` tasks rather than letting an executor guess.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `$effect` → `$derived` conversion (criterion 1) | Browser / Client (Svelte runtime) | — | Runes are a client-side reactivity concern; all 92 sites are in components or client-side context classes. Zero server modules involved. |
| `Input` / `MultipleTextInput` consolidation + multilingual (criterion 2) | Browser / Client | Frontend Server (SSR) | Form widgets render on both sides; the multilingual value shape (`LocalizedString`) is defined in `@openvaa/app-shared`, so the *contract* is shared but the widget is client-tier. |
| `EntityCardAction` → snippet (criterion 3) | Browser / Client | — | Pure markup/compile-time construct. The `<style>` relocation is a build-tier (Tailwind/PostCSS) side effect. |
| Tracking-service collapse (criterion 4) | Browser / Client | — | The producer is a client-side class over `sessionStorage`; the network hop is the injected `sendTrackingEvent` handler (Umami), which is out of scope. |
| Context utility extraction (criterion 5) | Browser / Client | — | `candidateContext` / `voterContext` are client-instantiated orchestrator classes; the `dataRoot` they read is the client `DataRoot` object. |
| `Alert` spacing (criterion 6a) | CDN / Static (build-time CSS) | Browser / Client | Tailwind v4 resolves utilities at build time from `@theme` tokens in `apps/frontend/src/app.css`. |
| `$layouts` alias + barrel (criterion 6b) | Build / Tooling | Frontend Server (SSR) | A path alias is resolved by Vite/SvelteKit/vitest at build time in **three** independent configs. |
| `QuestionChoices` BooleanInput + multi-select UAT readiness (D-N2) | Browser / Client | Database / Storage (seed) | The features exist; readiness is a seeded-data + documented-path concern, so `@openvaa/dev-seed` templates are the secondary tier. |

**Why this matters here:** criterion 6b is the only item whose primary tier is *build tooling*, and
that is exactly why it fails silently — a build-tier miss (`vitest.config.ts`) produces a unit-suite
resolution error, not a runtime error, so a plan that verifies only by browsing the app will not catch it.

---

## Project Constraints (from CLAUDE.md)

Actionable directives extracted from `./CLAUDE.md`. These carry the same authority as locked decisions.

| # | Directive | Where it bites in 159 |
|---|-----------|----------------------|
| C1 | **E2E Hard Rule — a failing E2E test is a CARDINAL FAILURE.** No task may proceed, complete, or be marked done while any E2E test fails. **No "known-flaky" exemptions.** A "did not run" test counts as a failure. | Budget a full `yarn test:e2e` inside the phase, not after it. 159 touches `EntityCard`, `Input`, `Alert`, every route-root layout component and both orchestrating contexts — the widest blast radius in the v2.15 run. |
| C2 | **Prefer the full E2E suite for interim verification** over ad-hoc manual checks. | Per-wave gate should be the full suite, not a `--grep` subset. |
| C3 | **E2E preflight** asserts the served app came from *this* checkout via Vite `/@fs`. No bypass flag, no bypass env var. `FRONTEND_PORT` moves the target, it does not disable the check. | The executor needs one fresh dev server on the agreed port and must not run `yarn db:reset` mid-suite (it wipes test data — `tests/README.md:276`). |
| C4 | **Context Destructuring Rule (Svelte 5).** Reactive accessors (`appSettings`, `dataRoot`, `locale`, `selectedElections`, `opinionQuestions`, `matches`, …) MUST be read via `ctx.X` **inside the consuming tracking scope**. Only stable members (`t`, `answers`, `getRoute`, lifecycle fns) may be destructured. | Every criterion-1 conversion in a `.svelte` file, and the criterion-5 extraction. |
| C5 | **The `dataRoot` `#version`-bridge carve-out.** `dataRoot` is identity-stable; binding it to an intermediate `$derived` alias goes stale on cold/direct-URL entry because Svelte 5's referential-equality rule skips downstream notification. Read `ctx.dataRoot.<prop>` **directly** in the consuming tracking scope. | The criterion-5 shared utility reads `dataRoot`. See Pitfall 2. |
| C6 | **Svelte warning-accepted format:** `// svelte-warning: accepted — <one-sentence-rationale>` immediately above the triggering line. | If the `Input` extraction or the snippet conversion raises compiler warnings. |
| C7 | **Use TypeScript strictly — avoid `any`, prefer explicit types.** | The `Input` prop-union extension for multilingual multi-text. |
| C8 | **Localization** — all user-facing strings must support multiple locales. | Criterion 2 is *about* this; also the new snippet must not hard-code strings. |
| C9 | **WCAG 2.1 AA compliance.** | `EntityCardAction`'s `<button>`/`<a>` branching is an a11y-load-bearing structure; the snippet must preserve it exactly. `QuestionChoices` is a radio-group with documented keyboard semantics. |
| C10 | **Never commit sensitive data.** | Not engaged by this phase. |
| C11 | **Always check against `.agents/code-review-checklist.md`** — notably "no code repeated within the PR or elsewhere", "all new components/functions documented", "changed parts fully usable with keyboard and screen-reading", "check that parts sharing dependencies but not included are not unduly affected". | The last item is the `$layouts` codemod's blast radius in one sentence. |

---

## Standard Stack

**This phase installs nothing.** It is a pure in-repo refactor. Versions below are recorded because
behaviour depends on them, not because anything is to be added.

### Core (already installed — verified from `node_modules`)

| Library | Version | Purpose | Why it matters here |
|---------|---------|---------|---------------------|
| `svelte` | **5.53.12** `[VERIFIED: node_modules/svelte/package.json "version"]` | Runes runtime + compiler | `$bindable`/`$derived` interaction (Pitfall 1); snippets (criterion 3); the `#version`-bridge referential-equality rule (Pitfall 2). ≥5.25 means overridable deriveds are available. |
| `tailwindcss` | **4.2.1** `[VERIFIED: node_modules/tailwindcss/package.json "version"]` | Utility CSS | v4 `@theme` token resolution is what makes `top-2` ≠ Tailwind-default (criterion 6a). |
| `vitest` | (workspace) | Unit tests | `apps/frontend/vitest.config.ts` hand-maintains the alias list — the criterion-6b silent-break vector. |
| `@playwright/test` | (workspace) | E2E | The cardinal gate. 40 spec files under `tests/tests/specs/`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-classifying 92 `$effect` sites | A committed Node classifier script + generated table | **Recommend the script.** Hand classification of 92 sites is 92 judgement calls (exactly O5's warning); a script makes the predicate literally executable and re-runnable by the verifier. Cost: ~80 lines. A working prototype is described under § Census mechanics and was run this session. |
| A new `$layouts` alias | Keeping the components in `routes/` and importing relatively | Rejected by D-H5(a). Not re-litigated. |
| `EntityCardAction` snippet with inline `class:` | Snippet + relocated `.hover-shaded` into `EntityCard`'s existing `<style>` block | The latter is the only one that works — see Criterion 3. |

**Installation:** none.

**Version verification:** performed by reading the installed `package.json` files in-tree rather than
by registry lookup, because nothing is being added and the *installed* version is what governs behaviour.

---

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.**

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none)* | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

If the `Input` multilingual work turns out to want a new dependency (it should not — the repo already
has `LocalizedString` handling in `@openvaa/app-shared` and multilingual branches in `Input.svelte`),
that is a deviation to raise, and the legitimacy gate must run before it lands.

---

## Census Mechanics (criterion 1 / D-H1 / O5 bullet 1)

### The counts — re-measured, three commands, exactly as the orchestrator specified

All run from the repo root at HEAD `db220cb5f`:

```bash
grep -rn '\$effect('       apps/frontend/src | wc -l   #  92   ← the census
grep -rl '\$effect('       apps/frontend/src | wc -l   #  54   ← files holding those 92
grep -rl '\$effect'        apps/frontend/src | wc -l   #  83   ← files containing ANY $effect token
grep -rn '\$effect\.root(' apps/frontend/src | wc -l   #  38   ← test-harness scaffolding
grep -rl '\$effect\.root(' apps/frontend/src | wc -l   #  14
grep -rn '\$effect\.pre('  apps/frontend/src | wc -l   #   0
grep -rn '\$derived('      apps/frontend/src | wc -l   # 207   ← the likely source of the phantom 211
grep -rn '\$derived\.by('  apps/frontend/src | wc -l   #  58
```
`[VERIFIED: measured this session at HEAD db220cb5f]`

**State both file numbers precisely so a later reader cannot conflate them:**

- **54 files** hold the **92** `$effect(` census sites.
- **83 files** contain *some* `$effect` token — this is the roadmap's "83 files". It is a **superset**:
  it also counts the 14 files whose only `$effect` token is `$effect.root(`, plus files where the
  token appears only in a comment or a type position. **83 is not the count of files holding the 92.**
- Total effect sites of all kinds: **92 + 38 = 130**.
- The 38 `$effect.root(` lines are test-harness scaffolding and are **not** `$derived` conversion
  candidates. `$effect.pre(` does not appear at all.

⚑ **D-H1(a) is therefore a ~92-row table, not a ~211-row one.** The phase should be sized against 92.
CONTEXT.md F1–F5 are confirmed verbatim, including F3's "heaviest file holds 5" — re-measured:
`routes/+layout.svelte` (5) and `voterContext.svelte.ts` (5) tie for heaviest.

### The classification predicate (answers O5 bullet 1 in one sentence)

> **A site is CONVERTIBLE iff, on every execution path through its body, it performs exactly one
> assignment, to exactly one target, where that target is a plain local `$state` binding declared in
> the same module (not a prop, not a member expression on another object), and the body contains no
> `untrack`, no returned cleanup function, no `await`/`async`/`.then`, no navigation call, and no DOM
> access.**

Every clause of that predicate is mechanically checkable, which is what makes the census reproducible
rather than 92 judgement calls. The three sub-clauses that do the real work:

- **"on every execution path"** — an `if (…) target = x;` with no `else` is *not* total: on the false
  path the target keeps its previous value, which a `$derived` cannot express. These are `CONDITIONAL
  SINGLE-TARGET`.
- **"a plain local `$state` binding"** — a `$bindable` prop cannot be a `$derived` (Pitfall 1), and a
  member expression (`filter.include`, `progress.max`) is a *mutation of a foreign object*, which is a
  side effect by definition.
- **"no `untrack`"** — an `untrack` call is a load-bearing signal that the body reads and writes
  overlapping state; converting it changes the dependency graph.

### The measured classification — all 92 sites, 14 buckets

Produced by running that predicate as a script over the balanced-brace body of each `$effect(` site.
Bucket totals sum to 92. `[VERIFIED: classifier run this session over all 92 sites]`

| Bucket | Count | Disposition | Why |
|--------|------:|-------------|-----|
| **NO ASSIGNMENT (call-only side effect)** | **32** | record | Body is a function call — `setRouteTitle(title)`, `loadSvg(…)`, `topBar.push(overlay)`. A `$derived` produces a value; these produce an effect. |
| **WRITES `$bindable` PROP** | **9** | record ⚠ | Cannot be `$derived` in Svelte 5. **Includes both named `PasswordSetter` sites.** See Pitfall 1. |
| **MULTI-TARGET (2 targets)** | **8** | record | Two independent outputs; would need two deriveds and a restructure. |
| **UNTRACK (read/write same state)** | **8** | record | Deliberate dependency-graph carve-out. |
| **TEARDOWN (returns cleanup fn)** | **7** | record | A `$derived` has no cleanup phase. |
| **CONDITIONAL SINGLE-TARGET (not total)** | **5** | record | Falls through leaving the previous value. |
| **WRITES MEMBER / EXTERNAL OBJECT** | **5** | record | `filter.include`, `progress.max`, `selected[election.id]` — mutation of a foreign object. |
| **★ CONVERTIBLE** | **4** | **convert** | Total single write to a local `$state`. |
| **ASYNC** | **4** | record | `await` in the body. |
| **NAV** | **3** | record | `goto(…)` / `invalidate`. |
| **MULTI-TARGET (3 targets)** | **3** | record | |
| **MULTI-TARGET (4 targets)** | **2** | record | Includes `voterContext.svelte.ts:467` — the criterion-5 twin. |
| **MULTI-TARGET (5 targets)** | **1** | record | `candidateContext.svelte.ts:355` — the criterion-5 rollup. |
| **DOM** | **1** | record | `candidate/login/+page.svelte:102`. |
| **TOTAL** | **92** | | |

### The 4 ★ CONVERTIBLE sites — the whole of criterion 1's conversion work

```
apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte:110  → validationProgress
apps/frontend/src/routes/candidate/register/+page.svelte:50                                → changedAfterCheck
apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:169                   → opinionInputValid
apps/frontend/src/routes/(voters)/elections/+page.svelte:65                                → selected
```
`[VERIFIED: classifier output, this session]`

Each writes one local `$state` on every path. Each must still be hand-reviewed against C4/C5 before
conversion — the classifier proves *shape*, not *reactive safety*. Note in particular
`(voters)/elections/+page.svelte:65`: that file's lines 43-44 are CLAUDE.md's own canonical
`ctx.dataRoot.<prop>`-direct-read analog, so a conversion there sits two lines from the carve-out and
must not introduce an alias.

### Recommended artifact + schema

**File:** `.planning/phases/159-component-context-consolidation/159-EFFECT-CENSUS.md` (operator's
suggested precedent — `137-NEGATIVE-CONTROL.md`).

**Table schema** (matches the criterion's stated triple, plus two columns the phase actually needs):

| Column | Content |
|--------|---------|
| `#` | 1–92, stable ordering (sort by path then line) |
| `Site` | `path:line` |
| `Pure fn of inputs?` | `yes` / `no` — the predicate's verdict |
| `Bucket` | one of the 14 above |
| `Disposition` | `CONVERTED` / `RECORDED — <bucket reason>` |
| `Contract change?` | `none` / `$bindable` / `public API` — this is O5 bullet 3, made a column |

Adding the `Contract change?` column is the cheapest way to discharge O5 bullet 3 permanently: it makes
"unambiguous" and "does not need `$bindable`" visibly *different* columns rather than an assumed identity.

**Should the classifier script be committed?** **Yes — recommend committing it**, under the phase
directory (not under `src/`, so it never enters the unit suite). Rationale: the census is a claim about
92 sites that a reviewer would otherwise have to re-derive by hand, and a committed script makes it
re-runnable when a later phase adds an `$effect`. It is ~80 lines of Node with no dependencies. This is
explicitly Claude's Discretion under D-H1, so it is a recommendation, not a constraint.

---

## Architecture Patterns

### System Architecture Diagram

```
                                 ┌───────────────────────────────────┐
   direct URL (COLD entry)  ───► │  SvelteKit router                 │
   intro → Continue (WARM)  ───► │  apps/frontend/src/routes/        │
                                 └───────────────┬───────────────────┘
                                                 │ mounts
                                                 ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  ROUTE-ROOT LAYOUT COMPONENTS  (criterion 6b moves these)                │
   │  Layout ─► Header ─► Banner        MainContent   SingleCardContent       │
   │  MaintenancePage                   (41 + 1 importers)                    │
   │  ── today: apps/frontend/src/routes/*.svelte  (inside the router's ns)   │
   │  ── after: $layouts/main/*  + barrel  (outside the router's ns)          │
   └───────────────┬──────────────────────────────────────────────────────────┘
                   │ consume
                   ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  CONTEXT ORCHESTRATORS   (criterion 5 extracts the shared rollup)        │
   │                                                                          │
   │   appContext ──inheritContextMembers──► dataCtx { dataRoot, setDataRoot }│
   │       │        (LIVE accessor forward — NOT a value copy)                │
   │       │                                                                  │
   │       ├──inheritContextMembers──► trackingService                        │
   │       │        ⚠ criterion 4: wholesale forward is what leaks sessionId  │
   │       │                                                                  │
   │       ├──► voterContext      ─┐                                          │
   │       └──► candidateContext  ─┤ each holds a questionCategories rollup   │
   │            adminContext       │ $effect that reads `this.#dataRoot`      │
   │                               └─► criterion 5 extracts the shared core   │
   └───────────────┬──────────────────────────────────────────────────────────┘
                   │ dataRoot is IDENTITY-STABLE; its only signal is #version
                   │ ⚠ an intermediate $derived alias here SKIPS downstream
                   │   notification → stale on COLD entry only
                   ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  COMPONENT LEAVES                                                        │
   │   Input (692) ◄── criterion 2 ── MultipleTextInput (228) + multilingual  │
   │   EntityCard (368) ◄── criterion 3 ── EntityCardAction (59) → snippet    │
   │   Alert (128) ── criterion 6a ── two spacing values → theme tokens       │
   │   QuestionChoices (484) ── D-N2 ── BooleanInput + multi-select UAT       │
   └──────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  BUILD-TIER ALIAS RESOLUTION  (criterion 6b — THREE independent configs) │
   │   1. svelte.config.js  kit.alias      → Vite + SSR + generated TS paths  │
   │   2. .svelte-kit/tsconfig.json        → GENERATED, do not hand-edit      │
   │   3. vitest.config.ts  resolve.alias  → HAND-MAINTAINED, fails SILENTLY  │
   └──────────────────────────────────────────────────────────────────────────┘
```

Trace the primary hazard by following the arrows: a cold direct-URL entry reaches a route-root layout,
which reaches a context orchestrator, which reads `dataRoot` — and if criterion 5's extraction puts a
`$derived` alias anywhere on that path, the leaf renders empty. Warm entry follows the same arrows and
does not fail, which is why click-through is not verification.

### Recommended Project Structure (post-159)

```
apps/frontend/src/
├── lib/
│   ├── layouts/                  # NEW — $layouts alias target (criterion 6b)
│   │   ├── index.ts              #   barrel
│   │   └── main/                 #   'MainContent plus the other route-root components'
│   │       ├── index.ts
│   │       ├── Layout.svelte + Layout.type.ts
│   │       ├── Header.svelte
│   │       ├── Banner.svelte
│   │       ├── MainContent.svelte + MainContent.type.ts
│   │       ├── MaintenancePage.svelte + MaintenancePage.type.ts
│   │       └── SingleCardContent.svelte
│   ├── components/input/
│   │   ├── Input.svelte          # slimmer — dispatches to the extracted parts
│   │   └── parts/                # NEW — the 'same extraction … to the other complex types'
│   │       ├── MultilingualTextPart.svelte
│   │       ├── SelectMultiplePart.svelte
│   │       ├── ImagePart.svelte
│   │       └── MultipleTextPart.svelte     # ← MultipleTextInput's input part
│   ├── contexts/
│   │   ├── utils/                # ALREADY EXISTS (F13) — a move, not a new dir
│   │   │   ├── reactiveHandle.type.ts      # ← moved from contexts/app/
│   │   │   ├── questionRollup.ts           # ← the shared criterion-5 utility
│   │   │   ├── sameRefs.ts                 # ← OR leave at the bottom of voterContext
│   │   │   └── … (7 existing files)
│   │   └── app/tracking/
│   │       ├── trackingService.type.ts     # ONE narrowed consumer-facing type
│   │       └── trackingService.svelte.ts   # ONE implementation
│   └── dynamic-components/entityCard/
│       ├── EntityCard.svelte     # snippet + relocated .hover-shaded style
│       ├── EntityCard.type.ts
│       ├── EntityCardAction.svelte     ← DELETED
│       └── EntityCardAction.type.ts    ← DELETED
└── routes/                       # only +error / +layout.svelte / +layout.ts / README.md remain
```

`contexts/utils/` **already exists** with 9 files and **no `index.ts` barrel** — imports there are
direct file paths (`from '../utils/persistedState.svelte'`). Keep that convention for the two new files
rather than introducing a barrel. `[VERIFIED: ls apps/frontend/src/lib/contexts/utils]`

---

### Criterion 1 — the two named `PasswordSetter` sites

`apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte:44-66`
`[VERIFIED: PasswordSetter.svelte:44-66]` — quoted verbatim:

```ts
  let {
    password = $bindable(''),
    autocomplete = 'new-password',
    errorMessage = $bindable(undefined),
    valid = $bindable(false),
    ...restProps
  }: PasswordSetterProps = $props();

  export function reset(): void {
    password = '';
    passwordConfirmation = '';
    errorMessage = undefined;
  }
  …
  $effect(() => {
    valid = !!(password && passwordConfirmation && validPassword && password === passwordConfirmation);
  });
  $effect(() => {
    if (!validPassword) {
      errorMessage = t('candidateApp.setPassword.passwordNotValid');
    } else if (password !== passwordConfirmation) {
      errorMessage = t('candidateApp.setPassword.passwordsDontMatch');
    } else {
      errorMessage = undefined;
    }
  });
```

Both bodies **are** pure functions of their inputs (`password`, `passwordConfirmation`,
`validPassword`, `t`) — the second is total (if/else-if/else covers every path). So they pass the
*semantic* half of criterion 1's test and fail the *mechanical* half: the write targets are
`$bindable` props.

Three consumers, all binding both outputs `[VERIFIED: grep, this session]`:

```
routes/candidate/register/password/+page.svelte:120   <PasswordSetter bind:valid={isPasswordValid} bind:errorMessage={validationError} bind:password />
routes/candidate/password-reset/+page.svelte:111      <PasswordSetter bind:valid={isPasswordValid} bind:errorMessage={validationError} bind:password />
routes/candidate/(protected)/settings/+page.svelte:116 <PasswordSetter bind:valid={…} bind:errorMessage={…} bind:password bind:this={passwordSetterRef} />
```

The third also holds a `bind:this` ref and calls `reset()`, so any restructure must keep `reset()` working.

**Three options for the planner — this is a `checkpoint:decision`, not an executor call:**

| Option | Shape | Cost | Contract change |
|--------|-------|------|-----------------|
| **A — split computation from push** | `const isValid = $derived(…)` + `$effect(() => { valid = isValid; })` | 2 files, ~6 lines | none |
| **B — callback props** | Drop `valid`/`errorMessage` from props; add `onValidityChange?: (v: {valid, errorMessage}) => void`; compute both as local `$derived` | 4 files | **yes** — 3 call sites rewritten |
| **C — record, do not convert** | Census rows say `RECORDED — writes $bindable prop` | 0 files | none |

Option A is the honest middle: it satisfies "the value is a pure function of its inputs, so it is
`$derived`" for the *computation* while leaving one thin push effect, and it changes nothing public.
Option C is what D-H1(a)'s own bounding rule literally implies, but it leaves criterion 1's named
exemplar untouched, which reads as the criterion being unmet. **Recommend A**, with the census row
recording the residual push effect and `Contract change? = none`.

### Criterion 2 — `Input.svelte`'s branch structure and what "the same extraction" means

`Input.svelte` is 692 lines with a **numbered five-branch markup structure**, and the reviewer's
"other more complicated types" maps onto it exactly `[VERIFIED: Input.svelte markup, branch comments at :406, :467, :482, :540, :596]`:

| # | Branch (verbatim comment) | Line | Types covered | Complex? |
|---|---------------------------|-----:|---------------|----------|
| 1 | `<!-- 1. Multilingual text inputs and textareas -->` | 406 | `text-multilingual`, `textarea-multilingual` | **yes** — per-locale loop, translation-visibility toggle, language labels |
| 2 | `<!-- 2. Single-language textareas -->` | 467 | `textarea` | no |
| 3 | `<!-- 3. Select multiple -->` | 482 | `select-multiple` | **yes** — options list + selected-chips region + remove buttons |
| 4 | `<!-- 4. Image input -->` | 540 | `image` | **yes** — file input, preview, loading state, four-way display branch |
| 5 | `<!-- 5. Other single-row inputs -->` (5.1 Boolean · 5.2 Select · 5.3 date/number/text) | 596 | `boolean`, `select`, `date`, `number`, `text`, `url`, `email` | no |

`Input.type.ts` declares 11 `type:` literals `[VERIFIED: Input.type.ts:7-41]`: `'text'`, `'url'`,
`'email'`, `'text-multilingual'`, `'textarea'`, `'textarea-multilingual'`, `'number'`, `'date'`,
`'boolean'`, `'image'`, `'select'`, `'select-multiple'`.

**So "the same extraction applied to the other complex types" = extract branches 1, 3 and 4 into
sibling part-components, alongside the new part that absorbs `MultipleTextInput`.** Branches 2 and 5
are single-element and stay inline. This is the reading that keeps `Input.svelte` from growing (the
stated rationale) while giving the new multi-text part a peer group rather than a special case.

**The acceptance signal is already in the tree.** `QuestionInput.svelte` is the sole real consumer of
`MultipleTextInput`, and it carries a type-level apology for the split `[VERIFIED: QuestionInput.svelte:40, :61-72, :150-152]`:

```ts
const INPUT_TYPES: Record<Exclude<QuestionType, typeof QUESTION_TYPE.MultipleText>, InputProps['type']> = {
…
  // MultipleText is dispatched to `MultipleTextInput` (its own template
  // branch below), so the cast is safe … the map has no MultipleText entry.
  let t = INPUT_TYPES[question.type as Exclude<QuestionType, typeof QUESTION_TYPE.MultipleText>];
…
{#if isMultipleText}
  <MultipleTextInput
    {...multipleTextProps}
```

Once `multipleText` becomes an `Input` type, the `Exclude<>` in the `Record` key, the `as Exclude<>`
cast, the `isMultipleText` `$derived` and the `{#if isMultipleText}` branch **all delete**. That is a
crisp, typecheck-enforced completion signal for criterion 2 — recommend the plan state it as such.

**Multilingual is the explicit gap, and the component says so.** `MultipleTextInput.svelte:7-8`
`[VERIFIED: MultipleTextInput.svelte:7-8]`:

> `Multilingual \`multipleText\` values are out of this phase's input scope: rows are`
> `PLAIN text inputs bound to \`Array<string>\`.`

`QuestionInput.svelte` already implements the multilingual promotion for the other text types
`[VERIFIED: QuestionInput.svelte:78-82]`:

```ts
      else if (t === 'text-multilingual') t = 'textarea-multilingual';
…
      if (t === 'text') t = 'text-multilingual';
      else if (t === 'textarea') t = 'textarea-multilingual';
```

So "each text item behaves much the same as a normal multilingual text item" has a concrete
implementation target: add `'multiple-text'` / `'multiple-text-multilingual'` to the type union and
extend that same promotion ladder, so a multi-text row renders the branch-1 per-locale treatment.

`MultipleTextInput` uses an `onChange(rows.filter(r => r.trim() !== ''))` callback with a local
non-reactive `rows = $state(initRows())` clone `[VERIFIED: MultipleTextInput.svelte:71-97]` — note
that this "clone the initial value" convention is documented in the file as *"mirroring the `Input`
'clone the initial value' convention"*, so the two components already agree on value semantics. Good.

### Criterion 3 — `EntityCardAction` → snippet

**⚠ The blocker CONTEXT.md does not mention: a scoped `<style>` block.**
`EntityCardAction.svelte:54-59` `[VERIFIED: EntityCardAction.svelte:54-59]`:

```
<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .hover-shaded {
    @apply hover:bg-base-content/20 hover:ring-base-content/20 rounded-md hover:ring-4;
  }
</style>
```

**A snippet has no style scope.** Svelte scopes styles per *component*, and a snippet is a markup
fragment inside its declaring component. So step 1 of this conversion is relocating `.hover-shaded`
into `EntityCard.svelte`'s **existing** `<style lang="postcss">` block at `:362`
`[VERIFIED: EntityCard.svelte:362]` — which is fortunate, because it means no new style block is needed.

**⚑ CORRECTION to CONTEXT.md F9 / D-H3's reference map: there is only ONE real consumer, not two.**
The second "real consumer" the decision names —
`routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` — turns out to hold a **comment
reference only**, at `:314` `[VERIFIED: results/[[electionTab]]/+layout.svelte:310-318]`:

```
    // `noScroll: true` mirrors the entity-card open path (EntityCardAction
    // uses `data-sveltekit-noscroll`). Without it, SvelteKit's default
```

There is no `import` and no usage there. So the edit set is: **`EntityCard.svelte` (5 refs, rewritten)
+ `results/…/+layout.svelte` (1 comment, reworded)**, plus the two deleted files. That is *smaller*
than D-H3 assumed, not larger — record it, do not treat the comment as a code change.

**Two nested call sites in `EntityCard.svelte`** `[VERIFIED: EntityCard.svelte:220-222, :229-232, :333, :360]`:

```
:220  <EntityCardAction
:221    action={variant === 'details' || parsed.subcards?.length ? false : parsed.action}
:222    shadeOnHover={variant === 'subcard'}>
:223    <article …>                       ← wraps the WHOLE card
:229      <EntityCardAction
:230        action={variant !== 'details' && parsed.subcards?.length ? parsed.action : false}
:231        shadeOnHover
:232        class={gridClasses}>          ← wraps only the HEADER (~100 lines of content)
:333      </EntityCardAction>
:360  </EntityCardAction>
```

The snippet must therefore take **four parameters** — `action`, `shadeOnHover`, an extra class string
(the inner site passes `class={gridClasses}`; the component today folds it through
`concatClass(restProps, 'transition-all !text-neutral')`), and the wrapped `content` snippet — and the
two wrapped bodies each become their own `{#snippet}`. That is the least-surprising shape; the
alternative (a rest-props object) reproduces the component's spread semantics but is harder to read.

**Three invariants the conversion must preserve exactly:**

1. **`data-testid="entity-card-action"`** appears on both the `<button>` and `<a>` branches
   (`:37`, `:46`) and is selected by **three E2E files** `[VERIFIED: grep over tests/]`:
   `tests/tests/fixtures/voter/resultsPage.fixture.ts:213`,
   `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:209`,
   and referenced in `tests/tests/specs/voter/voter-alliance.spec.ts:123`. All three rely on
   `.first()` DOM ordering across nested actions. Changing the element order or the testid breaks the
   cardinal gate.
2. **`data-sveltekit-noscroll`** on the `<a>` branch (`:44`) — the results layout's comment at `:314`
   documents a behaviour that depends on it.
3. **The three-way branch and its 500 error** (`:31`, `:33`, `:41`, `:50-51`): `null|false|''` renders
   bare children; `function` → `<button onclick>`; `string` → `<a href>`; anything else →
   `{error(500, …)}`. The `<button>`/`<a>` split is a WCAG-load-bearing role distinction (C9) — keep it.

**D-H3's Phase-152 collision, restated so the plan does not read as lost work.** Fact 8 / F11: the
repo's only encoded dash is at `EntityCardAction.svelte:12` `[VERIFIED: EntityCardAction.svelte:12]`
— the JSDoc line `– default: The contents to wrap.` Phase 152 fixes that *instance*; 159 then
deletes the file, so the instance fix is **retired, not lost**. A5(a)'s durable half — the
`\uXXXX`-in-comment guard wired into `yarn lint:check` — is repo-wide and survives the deletion, and
it **still binds every comment 159 writes**. Concretely: **the snippet's replacement documentation must
use a literal `–`/`—`, never an escape**, and `yarn lint:check` will fail the build if it does not.
That is the guard working as designed. If 159 somehow lands before 152 (it should not, per D-N1),
152's A5 target vanishes and its "fix the one `–`" criterion becomes vacuous — flag it in 152's
verification rather than counting it a miss.

**✅ Good news — 152 already knows.** `152-01-PLAN.md` was written concurrently with this research and
**anticipates the deletion in its own durability note** `[VERIFIED: .planning/phases/152-comment-naming-hygiene-sweep/152-01-PLAN.md:93-94]`:

> `**Durability note on the escape fix.** \`EntityCardAction.svelte\` is **deleted by Phase 159**`
> `(\`ROADMAP.md:1161\` — *"\`EntityCardAction\` is replaced by a snippet … and the separate component is deleted"*).`

`152-01` lists `EntityCardAction.svelte` among its edited files (`:23`, `:144`) and reads `lines 1-20`
(`:153`). So this collision needs **no coordination action from 159** beyond not reintroducing the
class — unlike the `vitest.config.ts` one below, which is unhandled on 153's side.

### Criterion 4 — tracking: two layers → one

**Why two layers exist, in the code's own words** `[VERIFIED: trackingService.svelte.ts:11-21]`:

```ts
/**
 * The pure-rune internal shape of the tracking service. The `appContext` seam
 * owns the store conversion of the store-shaped properties (`sendTrackingEvent`,
 * `sessionId`, `shouldTrack`) declared on the exported `TrackingService` type —
 * this producer exposes them as rune handles.
 */
export type RuneTrackingService = Omit<TrackingService, 'sendTrackingEvent' | 'sessionId' | 'shouldTrack'> & {
  sendTrackingEvent: WritableHandle<TrackingHandler | null | undefined>;
  sessionId: ReactiveHandle<string>;
  shouldTrack: ReactiveHandle<boolean>;
};
```

**The `Omit`+re-add is now a near-no-op**, because the two handle shapes have converged. Compare
`reactiveHandle.type.ts` `[VERIFIED: contexts/app/reactiveHandle.type.ts:1-10]`:

```ts
export type ReactiveHandle<TValue> = { readonly current: TValue };
export type WritableHandle<TValue> = { current: TValue; set: (v: TValue) => void };
```

against `trackingService.type.ts` `[VERIFIED: trackingService.type.ts:38-49]`:

```ts
  sendTrackingEvent: {
    readonly current: TrackingHandler | null | undefined;
    set(v: TrackingHandler | null | undefined): void;
  };
  sessionId: { readonly current: string };
  shouldTrack: { readonly current: boolean };
```

`sessionId` and `shouldTrack` are **literally identical** to `ReactiveHandle<string>` /
`ReactiveHandle<boolean>`. The only real difference across the whole `Omit` is `readonly current`
(consumer type) vs `current` (`WritableHandle`) on `sendTrackingEvent`. **So collapsing to one type is
a small, low-risk edit**, and the layer's stated reason ("the appContext seam owns the store
conversion") no longer holds — there is no store bridge left.

**Which members are internal-only — measured, not assumed** `[VERIFIED: grep -rn over apps/frontend/src]`:

| Member | External consumers (outside the tracking module + the four context re-declarations) | Verdict |
|--------|-------------------------------------------------------------------------------------|---------|
| `sessionId` | **0**. Only internal reads: `trackingService.svelte.ts:196` (`vaaSessionId: this.sessionId.current`) and `appContext.svelte.ts:329` (`surveyLink({ …, sessionId: this.#tracking.sessionId })` — producer-to-producer, not through the public surface). Zero `.svelte` consumers. | **narrow out** |
| `shouldTrack` | **0**. Only internal reads of the private `#shouldTrackValue` at `:168`, `:193`. | **narrow out** — this is D-H4's "any other internal-only member", and it qualifies on the same evidence as `sessionId` |
| `sendTrackingEvent` | **yes** — `routes/+layout.svelte:49` destructures it and `:149` calls `sendTrackingEvent.set(umamiRef.trackEvent)`. | **keep** (D-H4 says so explicitly) |
| `startPageview` / `startEvent` / `track` / `submitAllEvents` / `resetAllEvents` | consumer-facing (`routes/+layout.svelte:49`) | keep |

**The crux the plan must solve.** `appContext.svelte.ts` forwards the tracking surface **wholesale**
`[VERIFIED: appContext.svelte.ts:367-379]`:

> `// tracking — WHOLESALE forward of the producer's eight own-enumerable members`
> `// … its surface is pinned by an exact-`Object.keys` case in`
> `// `tracking/trackingService.svelte.test.ts` — without that lock, a new public`
> `// member on the producer would silently widen this context's public surface.`
> `inheritContextMembers(this, this.#tracking);`

The producer **must keep** `sessionId` (it reads it at `:196`; `appContext:329` passes it to
`surveyLink`). So narrowing the *consumer-facing interface* while keeping the *producer* member means
one of two mechanisms, and the planner must pick:

- **(i) Selective forward** — replace the wholesale `inheritContextMembers(this, this.#tracking)` with
  an explicit list omitting `sessionId`/`shouldTrack`. Keeps the producer intact; keeps
  `trackingService.svelte.test.ts`'s exact-keys lock passing unchanged; requires updating
  `appContext.spread.svelte.test.ts:178-179`.
- **(ii) Make the producer members non-enumerable / private** — e.g. `#sessionId` with an internal
  accessor. Breaks `trackingService.svelte.test.ts:159` (`typeof spread.sessionId?.current`) and
  `:183`/`:192` (exact `Object.keys(svc).sort()` equality), and breaks `appContext:329`'s direct read.

**Recommend (i).** It is the smaller blast radius and it preserves the spread-safety discipline the
file documents at length.

**Five cascading declarations to delete** `[VERIFIED: grep -rn 'sessionId\|shouldTrack']`:

```
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:206        readonly sessionId!: AppContext['sessionId'];
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:207        readonly shouldTrack!: AppContext['shouldTrack'];
apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:261-262
apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:358-359
apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:93-94
```

**Two tests to update, not work around:**
- `appContext.spread.svelte.test.ts:178` (`'sessionId'`) and `:179` (`'shouldTrack'`) in
  `EXPECTED_KEYS`, plus the fixture handles at `:71-72`. D-H4 names `:178` explicitly.
- `trackingService.svelte.test.ts:183`/`:192` — the **exact** `Object.keys(svc).sort()).toEqual(...)`
  assertion. Under mechanism (i) this stays green untouched; under (ii) it must change. Use that as a
  tell: if the executor finds itself editing `:192`, it has chosen mechanism (ii) by accident.

**One doc reference to keep accurate** (D-H4 says so): `contexts/utils/persistedState.svelte.ts:90`
documents the tracking `sessionId` as its never-explicitly-`set` exemplar
`[VERIFIED: persistedState.svelte.ts:90]`. Also `trackingService.svelte.ts:92`:
`readonly sessionId = sessionStorageState('appContext-sessionId', getUUID());` — the storage key string
is unchanged by a type-level narrowing, which matters because it is persisted user state.

### Criterion 5 — the context utilities

**(a) `reactiveHandle.type.ts` → `contexts/utils/`.** 10 lines, **exactly 2 importers**
`[VERIFIED: grep -rn 'reactiveHandle']`:

```
apps/frontend/src/lib/contexts/app/survey.svelte.ts:1                    import type { ReactiveHandle } from './reactiveHandle.type';
apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts:6  import type { ReactiveHandle, WritableHandle } from '../reactiveHandle.type';
```

Trivially safe: type-only imports, two files, `contexts/utils/` already exists (F13 confirmed —
9 files present, no barrel). Sequence with criterion 4 (both touch `trackingService.svelte.ts`).

**(b) The duplicated rollup.** Both blocks read in full this session. **They are not identical, and
the differences are exactly three** `[VERIFIED: candidateContext.svelte.ts:355-405 and voterContext.svelte.ts:467-499]`:

| | `candidateContext.svelte.ts:355` | `voterContext.svelte.ts:467` |
|---|---|---|
| entity scope | passes `entityType: ENTITY_TYPE.Candidate` into both `appliesTo(...)` and `getApplicableQuestions(...)` | passes only `{ elections, constituencies }` |
| question filter | none | filters out `(q.customData as CustomData['Question'])?.hidden` on **both** info and opinion questions |
| question blocks | computes `#questionBlocks` (with `getByCategory`/`getByQuestion` closures) **inside the same effect** | computes blocks in a **separate** `$effect` at `:519`, with category-id filtering and `firstQuestionId` reordering |

**Shared core (identical in both, and this is what extracts):** filter `dr.questionCategories` by
`appliesTo(...) && getApplicableQuestions(...).length > 0`; split into
`type !== QUESTION_CATEGORY_TYPE.Opinion` (info) and `=== Opinion` (opinion); flatMap applicable
questions per group; and the identical opinion-matchability guard, verbatim in both files:

```ts
        if (c.type === QUESTION_CATEGORY_TYPE.Opinion && questions.some((q) => !q.isMatchable))
          error(500, `Some opinion questions in category ${c.id} is not matchable.`);
```

**Recommended utility signature** (Claude's Discretion under D-H1's sibling clause):

```ts
// contexts/utils/questionRollup.ts
export function rollUpQuestionCategories({
  dataRoot, elections, constituencies, entityType, questionFilter
}: {
  dataRoot: DataRoot;                                   // ← passed BY VALUE, read at the CALL SITE
  elections: ReadonlyArray<Election>;
  constituencies: ReadonlyArray<Constituency>;
  entityType?: EntityType;                              // candidate passes Candidate; voter omits
  questionFilter?: (q: AnyQuestion) => boolean;         // voter passes the `hidden` filter
}): {
  infoCategories; opinionCategories; infoQuestions; opinionQuestions;
}
```

`#questionBlocks` stays out of the shared utility — the two apps build blocks differently enough
(candidate: all opinion cats; voter: category-id-filtered + `firstQuestionId` reorder) that sharing it
would be a parameterised branch rather than shared logic.

**⚠ The `dataRoot` hazard, and why the current code is already correct.** Both contexts expose
`dataRoot` through a **private getter** `[VERIFIED: candidateContext.svelte.ts:108-110, voterContext.svelte.ts:163-165]`:

```ts
  get #dataRoot(): AppContext['dataRoot'] {
    return this.#appContext.dataRoot;
  }
```

and both rollups open with `const dr = this.#dataRoot;` **inside** the `$effect` body
(`candidateContext.svelte.ts:356`, `voterContext.svelte.ts:468`). That is **safe today** because the
read happens inside the effect's tracking scope, so the effect takes the `#version` dependency and
re-runs. **The extraction is safe iff it keeps that property.** Concretely:

- ✅ **SAFE:** `rollUpQuestionCategories({ dataRoot: this.#dataRoot, … })` called *inside* the existing
  `$effect` — the read is still in the tracking scope, and the utility receives a plain value.
- ❌ **UNSAFE:** hoisting to a class field `#rollup = $derived(rollUp({ dataRoot: this.#dataRoot, … }))`
  — an intermediate `$derived` over the identity-stable `DataRoot`; downstream notification is skipped
  on the version bump and the consumer keeps the pre-mount snapshot on cold entry.
- ❌ **UNSAFE:** passing a thunk `dataRoot: () => this.#dataRoot` that the utility invokes lazily
  outside any tracking scope.

The in-tree safe precedent for a `$derived` that *does* read `dataRoot` is a **direct property access
inside the derived**, not an alias `[VERIFIED: candidateContext.svelte.ts:137-139]`:

```ts
  #electionsSelectable = $derived(this.#dataRoot.elections?.length !== 1);
  #constituenciesSelectable = $derived(this.#dataRoot.elections?.some((e) => !e.singleConstituency));
```

**(c) `sameRefs` → bottom of file or utils.** `voterContext.svelte.ts:37`, preceded by a 12-line
comment at `:27-36` that must move with it (F17) — it documents the Phase-64 filter-badge regression
the helper guards `[VERIFIED: voterContext.svelte.ts:27-42]`. Two call sites, both in the same file:
`:416` and `:451`. Since both callers are `voterContext`-local, **moving it to the bottom of the file
is the smaller change and satisfies the criterion's own "or"** — recommend that over a `utils/` move
unless the criterion-5 extraction ends up needing it too.

### Criterion 6a — `Alert.svelte` spacing: ⚠ the reviewer's suggestion changes rendering

**The two sites** `[VERIFIED: Alert.svelte:114, :117]`:

```
:114      <Button onclick={closeAlert} color="warning" text={t('common.close')} class="-mt-[1rem] sm:mt-0" />
:117  <button onclick={closeAlert} class="btn btn-circle btn-ghost btn-sm absolute top-2 right-2">
```

**This project overrides Tailwind's spacing scale wholesale.** `apps/frontend/src/app.css:88-90`
clears the defaults (`--spacing-*: initial;` inside `@theme`), then redefines a custom scale in which
the numeric names are **not** Tailwind's `0.25rem × n`. Verified values `[VERIFIED: apps/frontend/src/app.css:155-179]`:

```
  --spacing-2:  0.125rem;    --spacing-xs:  0.25rem;
  --spacing-4:  0.25rem;     --spacing-sm:  0.5rem;
  --spacing-8:  0.5rem;      --spacing-md:  0.625rem;
  --spacing-16: 1rem;        --spacing-lg:  1.25rem;
  --spacing-20: 1.25rem;     --spacing-xl:  2.5rem;
                             --spacing-xxl: 3.75rem;
```

**Confirmed against the compiled stylesheet** in `apps/frontend/.svelte-kit/output/client/_app/immutable/assets/`
`[VERIFIED: compiled CSS artifacts, this session]`:

```
.top-2{top:var(--spacing-2)}          --spacing-2:.125rem;      → 2px
.right-2{right:var(--spacing-2)}                                → 2px
.-mt-\[1rem\]{margin-top:-1rem}                                 → -16px
.mt-16{margin-top:var(--spacing-16)}  --spacing-16:1rem;        → 16px
.-mt-lg{margin-top:calc(var(--spacing-lg) * -1)}                → negative variants compile
.-mt-md{margin-top:calc(var(--spacing-md) * -1)}
```

**Consequences the plan must state:**

| Site | Current computed | Candidate replacement | Computed | Δ |
|------|-----------------|----------------------|---------:|---|
| `:114` `-mt-[1rem]` | **−16px** | **`-mt-16`** ← recommended | −16px | **0 — exact** |
| `:114` | | `-mt-lg` (nearest *named* token) | −20px | +4px |
| `:114` | | `-mt-md` | −10px | −6px |
| `:117` `top-2 right-2` | **2px** | `top-2 right-2` (already a theme token) | 2px | **0 — no-op** |
| `:117` | | `top-xs right-xs` (nearest *named* token) | 4px | +2px |
| `:117` | | **`top-sm right-sm`** ← the reviewer's literal suggestion | 8px | **+6px — 4× the current value** |

Two findings that must reach the plan:

1. **`top-sm` violates D-H6's own "rendering must not change perceptibly" constraint.** The reviewer's
   `e.g. top-sm` was offered before this scale's shape was in view. There is **no named token at
   0.125rem**; the nearest is `xs` at 0.25rem.
2. **`top-2 right-2` is not Alert-specific and is not an arbitrary value** — it is a numeric *theme
   token*, and the identical string appears in three other components `[VERIFIED: grep, this session]`:
   `Video.svelte:858`, `Modal.svelte:100`, `Drawer.svelte:90` — all four are the same
   `btn btn-circle btn-ghost btn-sm absolute top-2 right-2` close-button idiom. Changing only Alert
   creates a four-way inconsistency where there is currently none.

**Recommendation → `checkpoint:decision`.** The self-consistent reading of D-H6 that satisfies both its
letter ("convert both to the closest semantic classes") and its constraint ("rendering must not change
perceptibly") is:

- `:114` → **`-mt-16 sm:mt-0`** — removes the arbitrary-value bracket syntax (the actual defect the
  decision's own rationale names), exact same computed value, zero risk.
- `:117` → **leave `top-2 right-2`, and record why** — it is already a theme token, it is the
  four-site house idiom, and every semantic-named alternative changes the rendering.

If the operator wants the *named* scale at `:117` regardless, that is a deliberate visual change and
should (a) be applied to all four sites for consistency, and (b) go through the visual-regression
project (`PLAYWRIGHT_VISUAL=1 yarn test:e2e --project=visual-regression`) with baselines updated.

### Criterion 6b — the `$layouts` alias and the route-root move

**What moves** — `find apps/frontend/src/routes -maxdepth 1 -type f` returns 14 entries
`[VERIFIED: this session]`:

| File | Lines | Disposition |
|------|------:|-------------|
| `Layout.svelte` / `Layout.type.ts` | 111 / 25 | **move** |
| `Header.svelte` | 139 | **move** ⚠ todo anchor |
| `Banner.svelte` | 116 | **move** ⚠ todo anchor |
| `MainContent.svelte` / `MainContent.type.ts` | 119 / 53 | **move** |
| `MaintenancePage.svelte` / `MaintenancePage.type.ts` | 64 / 16 | **move** |
| `SingleCardContent.svelte` | 71 | **move** |
| `loginRedirectTarget.ts` | 51 | ⛔ **158's** — do not touch |
| `+error.svelte` / `+layout.svelte` / `+layout.ts` / `README.md` | 35 / 284 / 44 / — | stay |

**Importer census — the blast radius** `[VERIFIED: grep -rn, this session]`:

| Component | External importers |
|-----------|-------------------:|
| `MainContent.svelte` | **41** |
| `MainContent.type` | 2 (`SingleCardContent.svelte:25`, +1) |
| `MaintenancePage.svelte` | 4 |
| `Layout.svelte` | 3 |
| `SingleCardContent.svelte` | 1 |
| `Banner.svelte` | 1 (`Header.svelte:21`) |
| `Header.svelte` | 1 (`Layout.svelte:22`) |
| **Distinct files needing an import rewrite** | **51** |

Every one of the 41 `MainContent` imports is a *relative* path of varying depth
(`'../../MainContent.svelte'` … `'../../../../../MainContent.svelte'`), which is precisely the
argument for the alias — after the move they all become the single string `'$layouts/main'`. A
regex-based codemod on `from '(\.\./)+MainContent\.svelte'` is straightforward and mechanically
verifiable (post-condition: zero remaining relative imports of the moved names anywhere in `src/`).

**The three config edits, verified line-for-line:**

1. `apps/frontend/svelte.config.js:11-15` `[VERIFIED: svelte.config.js:11-15]` — declares exactly three:
   ```js
       alias: {
         $types: path.resolve('./src/lib/types'),
         $voter: path.resolve('./src/lib/voter'),
         $candidate: path.resolve('./src/lib/candidate')
       },
   ```
   Add `$layouts: path.resolve('./src/lib/layouts')`.
2. `apps/frontend/tsconfig.json` extends `./.svelte-kit/tsconfig.json`, which SvelteKit **generates**
   from `kit.alias`. **Do not hand-add paths.** Verify with `yarn typecheck`.
3. `apps/frontend/vitest.config.ts:24-28` `[VERIFIED: vitest.config.ts:24-28]` — hand-maintained:
   ```js
         // SvelteKit built-in aliases (not available via @sveltejs/vite-plugin-svelte)
         { find: '$lib', replacement: path.resolve(__dirname, 'src/lib') },
         { find: '$types', replacement: path.resolve(__dirname, 'src/lib/types') },
         { find: '$voter', replacement: path.resolve(__dirname, 'src/lib/voter') },
         { find: '$candidate', replacement: path.resolve(__dirname, 'src/lib/candidate') },
   ```
   **⚠ Ordering matters:** `$lib` is declared *first* and the file's own comment at `:15` warns that
   earlier entries win ("These must come before the `$lib` alias to prevent `$lib` from matching
   first"). Since `$layouts` resolves to `src/lib/layouts`, a `$lib`-first ordering is fine for
   `$layouts` (distinct prefix), but the entry must still be added or every unit test importing
   through it fails to resolve — and that failure is a *resolution error in the unit suite*, not a
   visible app break. This is the silent-break vector.

**⚠⚠ Cross-phase collision — `vitest.config.ts` is owned by Phase 153 Plan 153-04, whose concurrency
section says there is no collision.** That file uses `__dirname` at **11 sites** — lines 18, 22, 25,
26, 27, 28, 32, 36, 40, 44, 48 `[VERIFIED: vitest.config.ts]` — in an ESM-typed package (§ 0 fact 3).
Phase 153 was planned concurrently with this research; `153-04-PLAN.md` now exists and replaces all 11
with one constant derived from `import.meta.url` + `fileURLToPath`. **Its stated collision surface is
wrong for 159** `[VERIFIED: .planning/phases/153-build-tooling-config-correctness/153-04-PLAN.md:78-80]`:

> `## Concurrency: named collision surfaces`
> `**None.** \`apps/frontend/vitest.config.ts\` is touched by no other plan in this phase and by neither`
> `Phase 152 nor Phase 163.`

Phase **159** is not in that list, and D-H5(a) requires 159 to add a 12th `resolve.alias` entry to that
exact file. **Three concrete conflicts, in both orders:**

| If … | What breaks |
|------|-------------|
| **153 lands first** | 159's new `$layouts` entry must use 153's derived constant, **not `__dirname`** — otherwise `153-09-PLAN.md:282`'s phase gate (`grep -c '__dirname'` comment-filtered must equal `0`) fails on 159's line. |
| **159 lands first** | 153-04's acceptance says *"all 11 measured usages (`:18,22,25,26,27,28,32,36,40,44,48`)"* `[VERIFIED: 153-04-PLAN.md:20]` — there would be **12**, at shifted line numbers. Its load-bearing proof, *"`git diff` … touches only lines 1-2, the new constant and its comment, and the 11 `path.resolve` first arguments — **no alias string, key or ordering changes**"* `[VERIFIED: 153-04-PLAN.md:160]`, is invalidated by an added alias key. |
| **Either order** | 153-04 and 153-09 both **pin the frontend unit-test count**: `Tests 816 passed (816)` across `Test Files 54 passed (54)` `[VERIFIED: 153-04-PLAN.md:151,159,234; 153-09-PLAN.md:254]`. **159's Wave 0 adds unit tests**, which moves that number and fails 153's `grep -qE 'Tests +816 passed'` gate. |

**Recommendation:** the 159 plan must (a) name 153-04 as an upstream dependency, (b) use whatever
constant 153-04 introduces rather than `__dirname`, and (c) **file a note against 153-04/153-09 that
their `816` pin and their "None" collision section need amending for 159** — this is exactly the class
of stale-`missing:`-item propagation the standing re-verification feedback warns about. Do not let it
surface as a merge conflict.

**⚠ Two G5 follow-up todo anchors stale on this move — and neither todo file exists yet.** Searched
`.planning/todos/` this session: 89 pending files, and **no todo cites `routes/Banner.svelte:9` or
`routes/Header.svelte:44`** `[VERIFIED: grep -rn 'routes/Banner\|routes/Header' .planning/todos/]`.
The only near-match is `.planning/todos/pending/2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md`,
which cites `apps/frontend/src/routes/Banner.svelte:76-84` and `Banner.svelte:77-83` — a **different,
pre-existing** todo, but one whose anchors this move *also* stales.

So the correct planning statement is:

- **`.planning/todos/pending/2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md`**
  — **exists today**, cites `apps/frontend/src/routes/Banner.svelte:76-84` (line 7) and
  `Banner.svelte:77-83` (line 13). **159 must re-anchor it** to `$lib/layouts/main/Banner.svelte`.
- The **two G5 todos for `Banner.svelte:9` and `Header.svelte:44`** are **Phase 158's to create**
  (158-CONTEXT.md D-G5 items #1 and #2, both classified non-blocking). They do not exist yet. **159
  must re-anchor them if 158 has created them by then** — and the plan should express it as a
  conditional sweep ("re-anchor every `.planning/todos/pending/` reference to a moved path"), not as a
  hard-coded pair of filenames, precisely because their existence depends on 158 having run.

Recommended verification: after the move, `grep -rn 'routes/\(Banner\|Header\|Layout\|MainContent\|MaintenancePage\|SingleCardContent\)' .planning/todos/pending/` must return zero.

### D-N2's blocking item — `QuestionChoices.svelte:1` (BooleanInput + multi-select choices)

**Read the comment carefully: it asks for UAT readiness, not a build.** Verbatim from the triage
`[VERIFIED: .planning/PRE-SHIP-REVIEW-TRIAGE.md § Phase 159]`:

> Add as a follow-up blocking task for me to UAT: - BooleanInput - multi-select choices

**Both features already exist on the tree** `[VERIFIED: this session]`:
- There is **no `BooleanInput` component file** anywhere in `apps/` or `packages/`. "BooleanInput" is
  `Input` with `type: 'boolean'` (`Input.type.ts:31`), rendered by `Input.svelte`'s branch 5.1 at `:602`.
- Multi-select choices are live in `QuestionChoices.svelte` (484 lines): `selectedMulti` (`:160`),
  `multiConstraints` (`:421-422`), and the shared validity gate
  `isMultiChoiceCountValid` imported at `OpinionQuestionInput.svelte:38`.
- Both question shapes are present in the dev-seed templates (`packages/dev-seed/src/templates/default.ts`
  and `templates/e2e/base.ts` both reference boolean and `multipleChoiceCategorical`).

So the deliverable is **an operator-runnable UAT path**: a named seed template + a documented route +
the expected behaviours, so the operator can exercise both without hunting. That is a small, tractable
item — but note D-N2's escape hatch: *"if the blocking item proves to be its own design problem at plan
time, raise it as a `checkpoint:decision` rather than silently deferring it."* Given that it also
overlaps criterion 2 (the `Input` extraction touches branch 5.1 boolean and the multi-select constraint
plumbing), **recommend sequencing it after criterion 2** so the UAT exercises the post-extraction code,
not code about to change.

### The six uncovered triage comments (CONTEXT.md O2) — investigated, each with a disposition

D-N2/O2 require each to be scoped in or filed; none dropped. All six investigated this session:

| # | Comment | Anchor | Finding | Recommended disposition |
|---|---------|--------|---------|------------------------|
| 1 | "This ad hoc rollup is fixed in the last branch of the stack" | `contexts/app/appContext.svelte.ts:335` | **Reviewer is correct — already fixed on this tree.** `:335` is inside the `EXPLICIT FORWARDING` comment block, which itself states it *"REPLACES the former componentCtx / dataCtx / tracking instance-spreads"* and explains it replaced *"the two ad-hoc mechanisms this block used to carry"*. The fix landed in `ce0f5e746` *"refactor(quick/260824-sdp): forward dataCtx and tracking via inheritContextMembers"*. `[VERIFIED: appContext.svelte.ts:333-337 + git log -S]` | **Close as already-fixed.** Record the commit in the phase summary. No code change. ⚠ But note criterion 4 edits this same block (mechanism (i) changes `inheritContextMembers(this, this.#tracking)` at `:379`) — so 159 does touch it, just not for this reason. |
| 2 | "Check whether these utils are any longer needed after the extraction of translation utils to app-shared" | `lib/i18n/init.ts:52` (`export function translate(...)`) | **Depends on Phase 157.** `translate`/`translateObject` are exported from `lib/i18n/init.ts`; nothing imports them from `'$lib/i18n'` directly (**0** such imports) — they reach consumers via `i18nContext.type.ts:18` → `componentContext` → `appContext.translate`. `packages/app-shared/src/data/localized.type.ts` is the only app-shared file mentioning translation, and it is a *type*, not the util. So the app-shared extraction the comment presupposes **has not landed here yet**. `[VERIFIED: grep -rn over apps/frontend/src + packages/app-shared/src]` | **File as a todo, blocked on 157.** Do not implement in 159 — the precondition is not on the tree, so "check whether still needed" cannot be answered. |
| 3 | "Remove default." | `lib/utils/constants.ts:10` | **Safe, and the default is duplicated.** `:10` reads `PUBLIC_IDENTITY_PROVIDER_TYPE: env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat',`. There is a **second** default downstream: `lib/api/utils/auth/providers/index.ts:31` — `const providerType = (constants.PUBLIC_IDENTITY_PROVIDER_TYPE \|\| 'signicat') as ProviderType;`. The only other reader is `routes/candidate/preregister/+page.svelte:75` (`=== 'idura'`), which is unaffected by an empty value. **So with the env var unset: removing `?? 'signicat'` (replacing it with `?? ''`, matching the other 9 entries in the object) leaves runtime behaviour IDENTICAL — `providers/index.ts:31` still resolves signicat — while collapsing two defaults to one.** `[VERIFIED: constants.ts:1-15, providers/index.ts:31, preregister/+page.svelte:75]` | **Scope INTO 159** — one line, zero runtime delta, and it removes a duplicated default. Use `?? ''` (not bare removal, which would widen the type to `string \| undefined`). Test: `providers/index.ts` already has coverage in `providers/signicat.test.ts` and `providers/idura.test.ts`. |
| 4 | "Rename to `alliances.ts`" | `lib/utils/getAllianceSummary.ts` | 23 lines, one export (`getAllianceSummary`), **2 importers**: `EntityDetails.svelte:38` and `EntityCard.svelte:56`. ⚠ **Overlaps Phase 158's G1 `lib/utils` sweep NOTE.** `[VERIFIED: wc -l + grep]` | **File as a todo and defer to 158's `lib/utils` proposal** — D-N2 says explicitly *"That sweep is 158's; 159 must not fight it; coordinate rather than moving the same files twice."* A rename inside `lib/utils/` while 158 is proposing what leaves `lib/utils/` is exactly the double-move to avoid. ⚠ Note `EntityCard.svelte` is *also* edited by criterion 3 — a conflicting rename there would be a needless collision. |
| 5 | "If so, `minSelection` should be checked to be > 0." | `lib/utils/multiChoiceValidity.ts:8` | **A real, currently-unguarded defect.** Line 8 is the doc line `* - \`effectiveMin = minSelections ?? 1\` — zero selections is ALWAYS` / `:9` `*   invalid-as-unanswered, even when \`minSelections\` is omitted.` But the implementation at `:28` is `const effectiveMin = minSelections ?? 1;` — so an **explicit `minSelections: 0`** yields `effectiveMin = 0` and `count: 0` returns `true`, contradicting the documented invariant. The fix is `Math.max(minSelections ?? 1, 1)`. **Save gates touched:** the function is imported only by `OpinionQuestionInput.svelte:38`, which is the single source of truth for *"the voter persistence gate + candidate Save gate"* (its own doc comment, `:1-5`). **Test coverage gap confirmed:** `multiChoiceValidity.test.ts` has 13 cases across 4 describes, and **not one passes `minSelections: 0`** — it covers omitted and `null`, never explicit zero. `[VERIFIED: multiChoiceValidity.ts:1-31, multiChoiceValidity.test.ts:14-65, OpinionQuestionInput.svelte:38]` | **Scope INTO 159** — one-line fix plus **one new unit test** (`explicit minSelections=0 → count 0 is false`) in the existing `multiChoiceValidity.test.ts`. Demonstrate the test failing before the fix (project's standing "prove the guard fails first" rule). |
| 6 | "Add as a follow-up blocking task for me to UAT: BooleanInput, multi-select choices" | `lib/components/questions/QuestionChoices.svelte:1` | **Pulled INTO 159 by the D-N2 operator NOTE.** See the section above. | **File the todo AND implement** (UAT readiness), sequenced after criterion 2. |

**Net:** items 3 and 5 fold into 159 as cheap, tested work items (both in `lib/utils/`, both one-line);
items 2 and 4 are filed with a stated blocker; item 1 is closed as already-fixed with the commit named;
item 6 is implemented per the operator NOTE.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Proving a `$derived` conversion did not go stale on cold entry | A manual click-through, or a bespoke "did it render?" assertion | **`tests/tests/specs/voter/cold-entry-dataroot.spec.ts`** — extend it with cases for the routes whose contexts change | It is a purpose-built negative control from Phase 117 with the mechanism documented in its own header, it already encodes the "no intro→Continue walk" discipline, and it uses waiting assertions that cover the post-hydration mount window. |
| Classifying whether an accessor shape is affected by the alias-skip | Reasoning about it per-site | **Spike 024's harness** (`ctx.svelte.ts` + `Harness.svelte` + `spike024.svelte.test.ts`), copied into `src/__spike024__/`, run, deleted | 4/4 validated affected-vs-not classification across all four accessor shapes; the run recipe is in the spike README. |
| A "wrap children in an action" component | A new wrapper component | A **snippet** (criterion 3) | That is the criterion. But see Pitfall 3 — snippets carry no style scope. |
| Two-way child→parent value flow for a computed value | A `$bindable` prop written by an `$effect` | A local `$derived` + a callback prop, **or** a local `$derived` + one thin push effect | Svelte's own docs: *"In general, `$effect` is best considered something of an escape hatch … In particular, avoid using it to synchronise state."* `[CITED: svelte.dev/docs/svelte/$effect]` |
| An arbitrary spacing value | `class="…-[1rem]"` bracket syntax | A `@theme` token from `apps/frontend/src/app.css` | The project deliberately cleared Tailwind's defaults (`--spacing-*: initial`) to enforce a restrictive design system — bracket values bypass it. |
| Alias registration | Editing `apps/frontend/tsconfig.json` by hand | `svelte.config.js` `kit.alias` (SvelteKit generates `.svelte-kit/tsconfig.json`) **plus** a hand entry in `vitest.config.ts` | Hand-editing the generated tsconfig is overwritten by `svelte-kit sync`; forgetting vitest fails silently. |

**Key insight:** the two things worth *not* hand-rolling in this phase are both about **verification**,
not implementation. Every implementation item here is small; the expensive mistakes are all
"we changed reactivity and only checked the warm path" and "we added an alias and only checked the app".

---

## Common Pitfalls

### Pitfall 1: converting an `$effect` that writes a `$bindable` prop

**What goes wrong:** the executor sees a body that is a pure function of its inputs, rewrites it as
`const valid = $derived(...)`, and the compiler either errors or — worse — the prop silently stops
propagating to the parent's `bind:`.

**Why it happens:** `$bindable` and `$derived` are mutually exclusive. `$bindable` marks a prop as
accepting two-way flow and mutation; `$derived` creates a read-only computed value.
`[CITED: svelte.dev/docs/svelte/$bindable]` The Svelte docs do not document a pattern for a derived
bindable prop.

**How to avoid:** the census's `Contract change?` column. **9 of the 92 sites are in this bucket**, and
they include both sites criterion 1 names by anchor:

```
PasswordSetter.svelte:55  → valid            PasswordSetter.svelte:58  → errorMessage
ElectionSelector.svelte:41 → selected        Video.svelte:176 → atEnd     Video.svelte:286 → mode
ConstituencySelector.svelte:132 → selectionComplete
OpinionQuestionInput.svelte:98 → valid
EntityList.svelte:72 → itemsShown            Feedback.svelte:99 → canSubmit
```

**Warning signs:** a `bind:` on the prop at any call site; the prop's declaration containing
`$bindable(`; a compiler diagnostic about assigning to a derived.

### Pitfall 2: reintroducing the Spike-024 alias-skip while extracting the criterion-5 utility

**What goes wrong:** the shared rollup is hoisted to a class field as
`#rollup = $derived(rollUp({ dataRoot: this.#dataRoot, … }))`, and on **cold / direct-URL entry** the
questions list renders empty. Warm `intro → Continue` entry works, so it passes casual testing.

**Why it happens (mechanism, quoted from the spike):** `[VERIFIED: .planning/spikes/024-derived-alias-stable-ref-skip/README.md]`

> `dataRoot` is an **identity-stable** object (a non-rune `DataRoot`) whose ONLY reactive signal is a
> separate `#version` `$state` counter, bumped on each `update()`. A consumer that writes
> `const dataRoot = $derived(ctx.dataRoot); const elections = $derived.by(() => dataRoot.elections);`
> recomputes the alias on the version bump, but the alias yields the **same object reference** every
> time. Per Svelte 5 push–pull semantics, *if a derived's new value is referentially identical to its
> previous value, downstream updates are skipped*.
> … `intro → Continue` masks the bug (data already present before the alias first computes);
> direct-URL cold entry exposes it (data arrives after mount).

**How to avoid:** keep the `dataRoot` read where it is today — `const dr = this.#dataRoot;` *inside* the
`$effect` body — and pass the resulting value into the utility. Never bind `dataRoot` to an
intermediate `$derived`. Never hand the utility a lazy thunk it will call outside a tracking scope.

**Warning signs:** the string `$derived(this.#dataRoot)` or `$derived(ctx.dataRoot)` appearing anywhere
in the diff; a utility parameter typed as `() => DataRoot`; a class field (rather than an effect body)
that mentions `dataRoot`.

**Detection:** `yarn test:e2e --project=<the cold-entry project>` — the spec fails by *timeout* on the
data-dependent region, not by assertion mismatch, so budget the `TIMEOUTS.slowPage` wait.

### Pitfall 3: the snippet conversion loses `.hover-shaded`

**What goes wrong:** `EntityCardAction.svelte` is deleted, its markup becomes a `{#snippet}` in
`EntityCard.svelte`, and the hover shading silently disappears on subcards and card headers — a visual
regression with no compiler or test signal.

**Why it happens:** snippets are markup fragments, not components. Svelte's style scoping is
per-component, so a `.hover-shaded` rule defined in the deleted file has no home. And because it is a
`:hover` style, no static render assertion catches its absence.

**How to avoid:** relocate the rule into `EntityCard.svelte`'s existing `<style lang="postcss">` block
at `:362` **as the first step**, before touching the markup. Note the `@reference` path also changes
depth (`"../../../tailwind-theme.css"` from `entityCard/` — same directory, so it happens to be
identical; verify).

**Warning signs:** a diff that deletes `EntityCardAction.svelte` without adding `.hover-shaded`
anywhere; `grep -rn 'hover-shaded' apps/frontend/src` returning 0 after the change.

### Pitfall 4: the `$layouts` alias breaks the unit suite silently

**What goes wrong:** `svelte.config.js` gets the alias, the app builds and runs fine, `yarn typecheck`
passes (SvelteKit regenerated `.svelte-kit/tsconfig.json`), and `yarn test:unit` fails with a module
resolution error in whichever tests transitively import a moved component — or, if none do today, it
passes now and breaks for the next author.

**Why it happens:** `apps/frontend/vitest.config.ts` re-declares SvelteKit's built-in aliases by hand
because they are not exposed by `@sveltejs/vite-plugin-svelte` (the file's own comment at `:24` says so).
Vitest has no knowledge of `kit.alias`.

**How to avoid:** treat the vitest entry as part of the *same* task as the `svelte.config.js` entry, not
a follow-up. Verification: add the alias, then run `yarn test:unit` **and** `yarn typecheck` before
touching a single import.

**Warning signs:** a task that says "add the alias" and lists one file.

### Pitfall 5: running `yarn db:reset` while the E2E suite is running

**What goes wrong:** the suite's teardown projects lose their data mid-run and specs fail in ways that
look like product bugs.

**Why it happens:** documented in `tests/README.md:276` — *"`yarn db:reset` in another terminal will
wipe the suite mid-run — the teardown projects are the only legitimate path to clear test data."*

**How to avoid:** reset **before** starting the dev server, never during a run.

### Pitfall 6: assuming the tracking narrowing is a type-only change

**What goes wrong:** `sessionId` is removed from `trackingService.type.ts`, and either
`appContext.svelte.ts:329` (`surveyLink({ …, sessionId: this.#tracking.sessionId })`) stops
typechecking, or the member still appears on `appContext` because
`inheritContextMembers(this, this.#tracking)` forwards it wholesale regardless of the type.

**Why it happens:** the type and the runtime surface are decoupled — `inheritContextMembers` copies
**own-enumerable property descriptors**, not declared members. Narrowing the type does not narrow the
forward.

**How to avoid:** change the forwarding mechanism (recommended option (i) above), and use
`appContext.spread.svelte.test.ts`'s `EXPECTED_KEYS` as the executable definition of the public surface.

**Warning signs:** the diff touches only `.type.ts` files.

---

## Code Examples

### Safe `dataRoot` read inside a converted / extracted tracking scope

```ts
// Source: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:355-360 (current, SAFE)
    $effect(() => {
      const dr = this.#dataRoot;                       // read INSIDE the effect's tracking scope
      const elections = this.#selectedElections;
      const constituencies = this.#selectedConstituencies;
      const entityType = ENTITY_TYPE.Candidate;
      // ... after extraction, the utility call goes HERE, receiving `dr` by value:
      // const rolled = rollUpQuestionCategories({ dataRoot: dr, elections, constituencies, entityType });
    });
```

```ts
// Source: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:137-139
// SAFE $derived over dataRoot — DIRECT property access, no intermediate alias
  #electionsSelectable = $derived(this.#dataRoot.elections?.length !== 1);
  #constituenciesSelectable = $derived(this.#dataRoot.elections?.some((e) => !e.singleConstituency));
```

```ts
// ANTI-PATTERN — Source: .planning/spikes/024-derived-alias-stable-ref-skip/README.md
const dataRoot = $derived(ctx.dataRoot);                 // intermediate alias  ← NEVER
const elections = $derived.by(() => dataRoot.elections); // goes STALE on cold entry
```

### The `$effect` → `$derived` rule, from the official docs

```js
// Source: https://svelte.dev/docs/svelte/$effect  ("When not to use $effect")
// Avoid:
let doubled = $state();
$effect(() => {
  doubled = count * 2;
});

// Recommended:
let doubled = $derived(count * 2);
```
`[CITED: svelte.dev/docs/svelte/$effect]` — and the doc's own framing: *"In general, `$effect` is best
considered something of an escape hatch — useful for things like analytics and direct DOM manipulation
— rather than a tool you should use frequently. In particular, avoid using it to synchronise state."*
Note this is exactly why **32 of the 92 sites** (the call-only bucket, incl. `setRouteTitle`, `loadSvg`,
overlay pushes) are correct as effects and must stay.

### Cold-entry E2E shape to copy for the converted sites

```ts
// Source: tests/tests/specs/voter/cold-entry-dataroot.spec.ts:31-42
  test('cold direct-URL entry to /en/elections renders the populated elections list', async ({ page }) => {
    // COLD: bare hard navigation, no Home→Intro→Continue walk.
    await page.goto('/en/elections');
    // WAITING assertion covers the post-hydration mount window.
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await expect(page.getByTestId(testIds.voter.elections.option).first()).toBeVisible({ timeout: TIMEOUTS.element });
  });
```

Its header states the discipline in one line: *"NO intro→Continue walk — a bare hard navigation IS the
cold entry; the warm intro walk MASKS the bug."*

---

## Runtime State Inventory

> This phase moves 9 files, deletes 2, and renames a persisted-state consumer's *type*. Categories below
> are answered explicitly per the rename/refactor protocol.

| Category | Items found | Action required |
|----------|-------------|-----------------|
| **Stored data** | **One persisted key, and it does NOT change.** `trackingService.svelte.ts:92` — `readonly sessionId = sessionStorageState('appContext-sessionId', getUUID());` `[VERIFIED: trackingService.svelte.ts:92]`. Criterion 4 narrows the *type/forwarding*, not the storage key. No other `localStorage`/`sessionStorage` key is touched by any 159 item (`grep` for `persisted`/`Storage` across the moved files: 0). | **None** — but the plan must state the key is unchanged, because a reader could reasonably assume "removing `sessionId`" means removing the stored value. It does not. |
| **Live service config** | **None.** 159 touches no external service. Tracking events flow to Umami via the injected `sendTrackingEvent` handler, which is unchanged (`routes/+layout.svelte:149`). No n8n/Datadog/Tailscale/Cloudflare surface. | None |
| **OS-registered state** | **None** — verified: no scheduler task, pm2 process name, launchd plist or systemd unit references any file this phase moves. | None |
| **Secrets / env vars** | **One env var read changes semantics, and the change is a no-op.** `PUBLIC_IDENTITY_PROVIDER_TYPE` (uncovered comment #3): removing the `?? 'signicat'` at `constants.ts:10` leaves the downstream `\|\| 'signicat'` at `providers/index.ts:31` intact. **No `.env` file needs editing.** `[VERIFIED: constants.ts:10, providers/index.ts:31]` | Record in the plan that `.env` / `.env.example` need no change. |
| **Build artifacts / installed packages** | **The Vite cache and `.svelte-kit/` will hold stale module graphs after the `$layouts` move.** `apps/frontend/.svelte-kit/` currently contains a compiled output tree (verified — it is what the compiled-CSS values above were read from), and `apps/frontend/node_modules/.vite` is the dev-server cache. A 51-file import rewrite plus a new alias is exactly the class of change that leaves a stale resolution cached. | Run **`yarn dev:clean`** (wipes `apps/frontend/.svelte-kit` + `apps/frontend/node_modules/.vite`) after the `$layouts` wave and before the E2E gate. Also re-run `svelte-kit sync` (implicit in `yarn dev` / `yarn build`) so `.svelte-kit/tsconfig.json` regenerates with the new alias path. |

**Anything else?** No compiled binaries, no published packages, no Docker image tags, no pip
egg-info equivalents — this phase's artifacts are entirely within `apps/frontend`'s build outputs.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | **vitest** (jsdom env, `globals: true`), config `apps/frontend/vitest.config.ts` `[VERIFIED: vitest.config.ts:52-55]` |
| Unit orchestration | Turborepo — `yarn test:unit` = `yarn assert:unit-coverage && turbo run test:unit` `[VERIFIED: package.json:28]` |
| E2E framework | **@playwright/test**, config `tests/playwright.config.ts` |
| E2E command | `yarn test:e2e` = `yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring && playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe` `[VERIFIED: package.json:30]` |
| Static gate | `yarn lint:check` = `turbo run lint && eslint … tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring` `[VERIFIED: package.json:35]` |
| Frontend unit test files | **52** `[VERIFIED: find apps/frontend/src -name '*.test.ts' \| wc -l]` |
| E2E spec files | **40** under `tests/tests/specs/` `[VERIFIED: ls tests/tests/specs/*/*.spec.ts \| wc -l]` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit && yarn lint:check && yarn test:e2e` |

### Existing coverage for the files 159 touches

| Target | Existing test | Status for 159 |
|--------|--------------|----------------|
| tracking service | `contexts/app/tracking/trackingService.svelte.test.ts` — incl. an **exact** `Object.keys(svc).sort()).toEqual(expected)` at `:192` with `'sessionId'` at `:183`, and `typeof spread.sessionId?.current` at `:159` | **Green under the recommended mechanism (i).** If it turns red, mechanism (ii) was chosen by accident. |
| appContext public surface | `contexts/app/appContext.spread.svelte.test.ts` — `EXPECTED_KEYS` list; `'sessionId'` at **`:178`**, `'shouldTrack'` at `:179`; fixture handles at `:71-72` | **MUST BE UPDATED** (D-H4 says so by name). Remove both keys and both fixture handles. |
| `inheritContextMembers` | `contexts/utils/inheritContextMembers.test.ts` | Regression guard for criterion 4's forwarding change. |
| `multiChoiceValidity` | `lib/utils/multiChoiceValidity.test.ts` — 13 cases, 4 describes | **GAP: no `minSelections: 0` case.** New test required (see below). |
| `candidateContext` | `contexts/candidate/candidateContext.svelte.test.ts` | Regression guard for the criterion-5 extraction. |
| `persistedState` | `contexts/utils/persistedState.svelte.test.ts` | Guards the `sessionId` storage behaviour the narrowing must not disturb. |
| Cold-entry `dataRoot` | **`tests/tests/specs/voter/cold-entry-dataroot.spec.ts`** (2 tests) | **The named cold-entry mechanism.** Extend, do not replace. |
| `EntityCardAction` DOM contract | `tests/tests/fixtures/voter/resultsPage.fixture.ts:213`; `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:209`; `tests/tests/specs/voter/voter-alliance.spec.ts:123` | Must stay green **unchanged** — they are the snippet conversion's behavioural contract. |
| `Input` / `Alert` / `EntityCard` | **No dedicated unit tests exist.** `[VERIFIED: find … -name '*.test.ts' filtered]` | Wave 0 gap — see below. |

### Phase Requirements → Test Map

| Req | Behaviour | Test type | Automated command | Exists? |
|-----|-----------|-----------|-------------------|---------|
| CMP-01 | Census table covers all 92 sites, buckets sum to 92 | unit (script self-check) | `node .planning/phases/159-*/effect-census.cjs --assert-total 92` | ❌ Wave 0 |
| CMP-01 | Each of the 4 converted sites still produces the same value | unit | `yarn workspace @openvaa/frontend test:unit` (component tests for `PasswordValidator`) | ❌ Wave 0 (no `PasswordValidator` test today) |
| CMP-01 | Converted sites do not go stale on cold entry | **e2e** | `yarn test:e2e --grep "cold-entry"` | ✅ extend `cold-entry-dataroot.spec.ts` |
| CMP-02 | `multipleText` renders through `Input`; the `Exclude<>` cast is gone | **typecheck** | `yarn typecheck` (fails if the cast is removed but the type union is not extended) | ✅ existing gate |
| CMP-02 | A multilingual multi-text row behaves like a multilingual text item | unit + e2e | new component test; candidate-journey spec covers the info-question save path | ❌ Wave 0 |
| CMP-03 | Card and header remain clickable with the right element and testid | **e2e** | `yarn test:e2e --grep "result card"` + `perm-show-feedback-survey` | ✅ 3 existing files |
| CMP-03 | `.hover-shaded` still applies | source assertion | `grep -rn 'hover-shaded' apps/frontend/src` returns ≥1 | ❌ Wave 0 (trivial) |
| CMP-04 | `sessionId`/`shouldTrack` absent from the appContext public surface | unit | `yarn workspace @openvaa/frontend test:unit` → `appContext.spread.svelte.test.ts` | ✅ **update** `:178-179` |
| CMP-04 | Producer surface unchanged | unit | same → `trackingService.svelte.test.ts:192` | ✅ must stay green |
| CMP-05 | Both contexts produce identical rollups pre/post extraction | unit | `candidateContext.svelte.test.ts` | ✅ (extend) |
| CMP-05 | No `$derived` alias over `dataRoot` introduced | **source scan** | `grep -rnE '\$derived(\.by)?\(\s*(this\.#\|ctx\.)dataRoot\s*\)' apps/frontend/src` returns 0 | ❌ Wave 0 (recommend committing this as a guard) |
| CMP-06a | `Alert` renders identically | **visual** | `PLAYWRIGHT_VISUAL=1 yarn test:e2e --project=visual-regression` | ✅ `tests/tests/specs/visual/` |
| CMP-06b | `$layouts` resolves in **all three** configs | typecheck + unit + build | `yarn typecheck && yarn test:unit && yarn workspace @openvaa/frontend build` | ✅ existing gates — but only if the plan runs all three |
| CMP-06b | No relative imports of moved components survive | source scan | `grep -rnE "from '(\.\./)+\.?/?(MainContent\|Layout\|Header\|Banner\|MaintenancePage\|SingleCardContent)" apps/frontend/src` returns 0 | ❌ Wave 0 (trivial) |
| D-N2 | `minSelections: 0` is not saveable | unit | `yarn workspace @openvaa/frontend test:unit multiChoiceValidity` | ❌ **Wave 0 — the named gap** |
| D-N2 | BooleanInput + multi-select UAT path | **manual** | operator UAT, seeded via `yarn db:seed --template e2e/base` | manual by design (the reviewer asked for UAT) |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` (fast, jsdom) + `yarn typecheck`.
- **Per wave merge:** `yarn test:unit && yarn lint:check`. For the `$layouts` wave additionally
  `yarn workspace @openvaa/frontend build` (proves SSR resolution) and `yarn dev:clean`.
- **Phase gate:** full `yarn test:e2e` green, per CLAUDE.md's cardinal rule, before `/gsd-verify-work`.

### E2E gate mechanics (the executor needs all four)

1. **Clean DB first, never mid-run:** `yarn db:reset` → then start the server. *"`yarn db:reset` in
   another terminal will wipe the suite mid-run"* `[VERIFIED: tests/README.md:276]`.
2. **One fresh dev server** on the agreed port. `yarn dev` now uses `strictPort` and fails loudly on a
   collision. If the port must move, `FRONTEND_PORT` in the root `.env` (persistent, both sides) or
   prefixed on a single command (`FRONTEND_PORT=5273 yarn dev`), and **the suite must use the same port**.
3. **The preflight has no bypass.** It asserts the served app came from *this* checkout via Vite `/@fs`
   and prints exactly one `E2E PREFLIGHT OK …` line on success. There is no flag and no env var that
   skips it `[VERIFIED: tests/README.md:18-20, 35-37]`.
4. **Disk.** ⚠ `tests/e2e-runs/` currently holds **6.8 GiB** and the volume is at **98% (23 GiB free)**
   `[VERIFIED: du -sh + df -h, this session]`. A full-suite run writes traces/videos there. This has
   voided runs before (`ENOSPC`). **`tests/e2e-runs/` is cited by registers and must not be deleted** —
   free space elsewhere (the known ~52 GiB of reclaimable `Docker.raw` bloat requires an operator
   `fstrim`). **Recommend the plan open with a disk-headroom checkpoint** rather than discovering
   `ENOSPC` at the phase gate.

### Wave 0 Gaps

- [ ] `apps/frontend/src/lib/utils/multiChoiceValidity.test.ts` — add `explicit minSelections=0 → count 0 is false`; **demonstrate it failing before the fix** (covers uncovered comment #5)
- [ ] `apps/frontend/src/lib/components/input/Input.svelte` — no unit test exists; add at least a `multipleText` / `multiple-text-multilingual` render+emit case (covers CMP-02)
- [ ] `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` — no unit test; add a validity/errorMessage case before touching its two effects (covers CMP-01's named sites)
- [ ] `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — extend with cold-entry cases for the routes whose contexts criterion 5 changes (candidate questions, results) (covers CMP-01/CMP-05)
- [ ] Source-scan guard: no `$derived` alias over `dataRoot` (covers CMP-05, Pitfall 2) — recommend committing it as a vitest source test, following the D-G2/D-G4 precedent of demonstrating both failure modes first
- [ ] Source-scan guard: no surviving relative imports of moved route-root components (covers CMP-06b)
- [ ] Source-scan guard: `.hover-shaded` still defined somewhere (covers CMP-03, Pitfall 3)
- [ ] Census self-check: bucket totals sum to 92 (covers CMP-01)
- [ ] `EntityCard.svelte` / `Alert.svelte` — no unit tests; **do not add** unless the visual-regression project proves insufficient. E2E + visual already cover their observable behaviour, and adding component tests here is scope the criteria do not ask for.

*No framework install needed — vitest and Playwright are both configured and running.*

---

## Wave Structure and Blast Radius

Ordered **low-risk-first**, with the two entangled items isolated.

| Wave | Items | Files touched | Independent? | Notes |
|------|-------|--------------:|--------------|-------|
| **0** | Test scaffolding gaps above | ~8 | yes | Must precede the waves they guard. |
| **A — free-standing** | criterion 6a (`Alert` spacing, 1 file) · `reactiveHandle.type.ts` move (3 files) · `sameRefs` move (1 file) · `constants.ts` default (1 file) · appContext:335 close-out (0 files) | 6 | **yes** — no overlap with any other wave | Cheapest possible first green. ⚠ `reactiveHandle` touches `trackingService.svelte.ts`, which wave B also touches — sequence A before B. |
| **B — tracking** | criterion 4 | `trackingService.type.ts`, `trackingService.svelte.ts`, `appContext.svelte.ts`, ×3 other contexts, `appContext.spread.svelte.test.ts` | mostly | Overlaps A on `trackingService.svelte.ts` and overlaps the appContext:335 comment block. |
| **C — EntityCardAction** | criterion 3 | `EntityCard.svelte`, delete ×2, reword 1 comment | **yes** | ⚠ Depends on **Phase 152** landing first (D-N1). ⚠ `EntityCard.svelte` also appears in uncovered-comment #4 (`getAllianceSummary` rename) — which is **deferred to 158**, so no live conflict, but say so. |
| **D — census** | criterion 1 (table + 4 conversions) | census artifact + 4 source files + script | **yes** | Needs Wave 0's cold-entry extension. The `PasswordSetter` question is a `checkpoint:decision` here. |
| **E — `$layouts`** | criterion 6b | **51 importers** + `svelte.config.js` + `vitest.config.ts` + 9 moved files + todo re-anchoring | **NO — widest** | ⚠ Collides with **Phase 153** on `vitest.config.ts` (`__dirname`, 11 sites). ⚠ Overlaps Wave D on `MainContent.svelte:59` and `SingleCardContent.svelte:48` (both hold one `$effect`) — do D first so the census cites stable paths. Run `yarn dev:clean` after. **Isolate this wave.** |
| **F — Input** | criterion 2 (+ then D-N2's UAT item) | `Input.svelte`, `Input.type.ts`, new `parts/`, `MultipleTextInput.*` (moved/deleted), `QuestionInput.svelte`, `index.ts` | **NO — only behaviour-adding item** | Last, because it is the only wave whose failure mode is "the feature is wrong" rather than "the import is wrong". D-N2's `QuestionChoices` UAT readiness follows it. |
| **G — filing** | The four filed todos (i18n #2, alliances #4) + re-anchoring moved-path todos | `.planning/todos/pending/` | yes | Must run **after E** (paths must be final). |

**File-level collisions to record in the plan:**

| File | Phases | Nature |
|------|--------|--------|
| `apps/frontend/vitest.config.ts` | **153 Plan 153-04** (`__dirname` ×11 → one `import.meta.url` constant) + **159** (12th `resolve.alias` entry) | **⚠ Hard collision. 153-04's own "Concurrency: named collision surfaces" section says "None" and does not list 159.** Three failure modes in both orders — including 153's pinned `Tests 816 passed` gate, which 159's Wave 0 unit tests move. See criterion 6b. |
| `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` | **152** (fix the `–` escape) + **159** (delete) | 152 first per D-N1; the instance fix retires with the file, the `lint:check` guard survives and binds 159. |
| `apps/frontend/src/lib/utils/*` (`constants.ts`, `getAllianceSummary.ts`, `multiChoiceValidity.ts`) | **158** (G1 `lib/utils` *proposal*) + **159** (two one-line fixes) | 158 produces a **proposal only** — no file moves in 158. So 159's in-place edits are safe; the *rename* (#4) is what must wait. |
| `apps/frontend/src/routes/loginRedirectTarget.ts` | **158** (move to `$lib/routes/`) | 159's route-root sweep **must not** move it. |
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | **157** (logger rename ripples) + **159** (criterion 4) | 157 renames `logDebugError` into `app-shared`; `candidateContext.svelte.ts:333` and `:350` sit immediately above criterion 5's block. Plan the extraction against the *new* logger name. |

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + yarn 4 workspaces | everything | ✓ | (workspace) | — |
| `svelte` | criteria 1–3, 5 | ✓ | 5.53.12 | — |
| `tailwindcss` | criterion 6a | ✓ | 4.2.1 | — |
| vitest + jsdom | unit gate | ✓ | configured | — |
| Playwright + browsers | E2E cardinal gate | ✓ | 40 specs configured | — |
| Local Supabase (Docker) | E2E data setup | assumed ✓ (`yarn db:reset` is the documented prerequisite) | — | none — E2E cannot run without it |
| **Disk headroom** | E2E artifacts under `tests/e2e-runs/` | **⚠ MARGINAL** | 23 GiB free / 98% used; `tests/e2e-runs/` = 6.8 GiB | Operator `fstrim` to reclaim the known Docker.raw bloat. **Do not delete `tests/e2e-runs/`** — registers cite it. |

**Missing dependencies with no fallback:** none, strictly — but **disk headroom is the one real
environmental risk**, and it has voided full-suite runs in this repo before. Treat it as a
pre-phase checkpoint.

**Missing dependencies with fallback:** none.

---

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json`, so this section is included.

### Applicable ASVS categories

| ASVS category | Applies | Standard control |
|---------------|---------|------------------|
| V2 Authentication | **partially** | `PasswordSetter` (criterion 1's named sites) is the password-entry surface. Its `valid` / `errorMessage` outputs gate the parent's submit button at three routes. **Any conversion must not weaken the equality check** `password === passwordConfirmation` nor the `validPassword` dependency. No credential is stored or logged by these effects. |
| V3 Session Management | **partially** | Criterion 4 narrows `sessionId` — a **tracking/analytics** session id (`sessionStorageState('appContext-sessionId', getUUID())`), **not** an auth session. Auth sessions are Supabase cookie/PKCE and are untouched. Narrowing *reduces* its exposure surface, which is a security improvement. |
| V4 Access Control | no | No route guard, RLS policy or role check is edited. |
| V5 Input Validation | **yes** | Criterion 2 (`Input` multilingual multi-text) and the `multiChoiceValidity` fix are both validation surfaces. Use the existing typed prop unions (`Input.type.ts`) and the single-source `isMultiChoiceCountValid` — do not add a second validity path. |
| V6 Cryptography | no | Nothing cryptographic. `getUUID()` is unchanged. |
| V7 Error Handling & Logging | **partially** | `EntityCardAction`'s `{error(500, …)}` fallback and the rollups' `error(500, 'Some opinion questions … not matchable')` must survive their respective moves. Phase 157's logger rename ripples through the criterion-5 block. |
| V14 Configuration | **yes** | `constants.ts:10` env-default removal, and the three-config `$layouts` alias. Neither exposes a secret; the env var is `PUBLIC_`-prefixed by construction. |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation | 159-specific note |
|---------|--------|--------------------|-------------------|
| XSS via unescaped snippet content | Tampering | Svelte auto-escapes `{@render}` output; `{@html}` is the only bypass | The snippet conversion renders `{@render children?.()}` — same escaping as today. **Do not introduce `{@html}`.** |
| Client-side validation treated as a trust boundary | Spoofing / Tampering | Server-side re-validation | `PasswordSetter.valid` and `isMultiChoiceCountValid` are **UX gates**, not authorisation. The `minSelections: 0` fix improves correctness, not security. Do not let a "we fixed validation" framing imply a server-side guarantee. |
| Analytics session-id leakage into the public surface | Information Disclosure | Narrow the consumer interface | **This is exactly criterion 4.** Removing `sessionId` from the forwarded surface reduces the number of components that can read (and therefore accidentally log or transmit) the tracking id. |
| Env-var default masking a misconfiguration | Configuration | Fail loud, or default in exactly one place | `constants.ts:10` — removing the duplicate default leaves one authoritative default at `providers/index.ts:31`. **Verified no runtime behaviour change.** |
| Prototype/spread surface widening | Tampering | Exact-`Object.keys` locks | The repo already does this (`trackingService.svelte.test.ts:192`, `appContext.spread.svelte.test.ts`). Criterion 4 must keep the locks meaningful, not loosen them. |

---

## State of the Art

| Old approach | Current approach | When changed | Impact on 159 |
|--------------|------------------|--------------|---------------|
| Wrapper component for conditional markup | `{#snippet}` / `{@render}` | Svelte 5 | Criterion 3 is exactly this migration. |
| `$effect` to sync derived state | `$derived` | Svelte 5 | Criterion 1. But the docs are explicit that `$effect` remains correct for *side effects* — which is 88 of the 92 sites. |
| Deriveds are strictly read-only | Deriveds can be **overridden** by direct assignment | **Svelte 5.25** `[CITED: svelte.dev/docs/svelte/$effect]` | Relevant to Pitfall 1 only as a *non*-solution: overridable deriveds address optimistic UI, not `$bindable` props. Installed version 5.53.12 has it. |
| `tailwind.config.js` with `theme.extend` | CSS-first `@theme { --spacing-*: … }` in `app.css` | Tailwind v4 | Why `top-2` resolves to 0.125rem here and not 0.5rem. Any planner reasoning from Tailwind's *default* scale will get criterion 6a wrong. |
| Svelte 4 stores absorbing no-op writes via `safe_not_equal` | Raw `$state` writes propagate; explicit equality guards needed | Svelte 5 migration | This is why `sameRefs` exists (`voterContext.svelte.ts:27-36`) and why the `#version` bridge behaves as it does. |

**Deprecated / outdated in this repo's own docs:** CONTEXT.md's O3 ("`REVIEW-` returns 0") and O4
("the DISCUSSION-LOG pointer was not written") are both stale — see the corrections above. F9's "second
real consumer" of `EntityCardAction` is a comment, not code.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Phase 158 will have landed before 159 and will have created `$lib/routes/`, moved `loginRedirectTarget.ts`, and filed the Banner/Header G5 todos. **158 has a CONTEXT.md and a RESEARCH.md but NO PLAN.md** as of this write — it is unplanned. (152 and 153 *were* planned concurrently during this research — 152-01..15 and 153-01..09 now exist; their content is therefore observed, not projected.) | Wave structure, criterion 6b | If 158 slips, 159's route-root sweep would find `loginRedirectTarget.ts` still present and might move it, colliding with 158 later. **Mitigation: make the sweep an explicit allow-list of the 9 named files, never "everything that is not a `+` file".** |
| A2 | Phase 152's `\uXXXX`-in-comment guard will be live in `yarn lint:check` when 159 writes its comments. | D-N1, criterion 3 | If 152 slips, 159 could reintroduce an escape unnoticed. Low impact (cosmetic), and 152 would catch it later. |
| A3 | Phase 157's logger rename will have landed, so the criterion-5 block's `logDebugError` calls have a new name/import. | Criterion 5 | An extraction written against the old name would conflict. **Mitigation: read the actual import at plan time, do not hard-code either name.** |
| A4 | Extracting branches 1, 3 and 4 of `Input.svelte` is what the reviewer means by "the same extraction done to other more complicated types". The reviewer did not enumerate them. | Criterion 2 | A different reading (e.g. only branch 3) would under- or over-deliver. **Mitigation: state the enumeration in the plan and let the operator correct it — this is cheap to surface and expensive to guess wrong.** |
| A5 | The `QuestionChoices` blocking item is *UAT readiness* for existing features, not new feature work. Based on the comment's own wording ("for me to UAT") and on both features being present on the tree. | D-N2 | If the operator meant "build these", the phase is materially larger. **Mitigation: D-N2's own escape hatch — raise as `checkpoint:decision`.** |
| A6 | A snippet cannot carry a scoped `<style>` block, so `.hover-shaded` must relocate. Reasoned from Svelte's per-component style scoping; not confirmed against a Svelte doc page in this session. | Criterion 3, Pitfall 3 | If snippets *could* somehow carry styles, the relocation is unnecessary but harmless. Very low risk — the relocation is correct either way. |
| A7 | The `$layouts` barrel shape is `$layouts/main` per `PRE-SHIP-REFACTORING.md` § item 2's wording, with `MainContent` and siblings under a `main/` subdirectory. | Criterion 6b | Cosmetic. The alias and the import rewrite are what matter. |
| A8 | Removing `?? 'signicat'` should become `?? ''` (matching the other 9 entries) rather than a bare removal. The reviewer said only "Remove default." | Uncovered comment #3 | A bare removal widens the type to `string \| undefined` and would need call-site changes. `?? ''` is the type-preserving reading. Low risk; state it in the plan. |
| A9 | Recommending vitest-config-alias-and-svelte-config-alias as **one task** rather than two. Not mandated by any decision. | Pitfall 4 | If split, the silent-break risk returns. Purely a planning recommendation. |

**Nothing in this log is presented as verified fact.** Everything above the log that carries
`[VERIFIED: path:lines]` was read from the named file this session.

---

## Open Questions

1. **`PasswordSetter`: contract change, or split computation from push?**
   - *What we know:* both sites are pure functions of their inputs and both targets are `$bindable`
     props with three binding call sites; Svelte 5 forbids a derived bindable.
   - *What's unclear:* whether criterion 1's "are converted to `$derived`" is satisfied by option A
     (local `$derived` + one-line push effect) or demands option B (public contract change).
   - *Recommendation:* **`checkpoint:decision`**, default to option A, record the residual push effect
     in the census with `Contract change? = none`.

2. **`Alert.svelte:117`: keep `top-2 right-2` or accept a 4× rendering change?**
   - *What we know:* `top-2` is a theme token (0.125rem); `top-sm` is 0.5rem; there is no named token
     at 0.125rem; the same string appears in three other components.
   - *What's unclear:* whether D-H6's "closest available semantic class" outranks its own "rendering
     must not change perceptibly" when the two conflict.
   - *Recommendation:* **`checkpoint:decision`.** Default: fix `:114` → `-mt-16` (exact), leave `:117`
     and record why. If the operator wants named tokens, apply to all four sites + visual baselines.

3. **Which of criterion 4's two narrowing mechanisms?**
   - *What we know:* selective forwarding keeps both existing tests meaningful; making producer members
     non-enumerable breaks `trackingService.svelte.test.ts:159/183/192` and `appContext:329`.
   - *Recommendation:* selective forwarding. Low enough risk to leave to the planner rather than a checkpoint.

4. **Does 158's `lib/utils` proposal pre-empt 159's two in-place `lib/utils` fixes?**
   - *What we know:* 158's NOTE buys a **proposal document only**; no file moves in 158 on its strength
     (158-CONTEXT.md § Not in scope). So `constants.ts` and `multiChoiceValidity.ts` do not move, and
     in-place edits are safe.
   - *What's unclear:* nothing material. The `getAllianceSummary` **rename** is the only item that
     genuinely must wait.
   - *Recommendation:* proceed with the two edits; defer the rename.

5. **Does the phase commit the census classifier script?**
   - *Recommendation:* yes, under the phase directory. Claude's Discretion, so no checkpoint needed —
     but say so explicitly in the plan so a reviewer knows it was a choice.

6. **CONTEXT.md O1's owner.** The phantom 211 is now in **three** documents (ROADMAP § Phase 159,
   `v2.15-DISCUSSION-POINTS.md` § 0 fact 24, and **REQUIREMENTS.md:151** — the third is new here).
   This research is scoped not to edit any of them. Someone must, or the next reader re-derives 211.

7. **⚠ Who amends Phase 153's `vitest.config.ts` plan?**
   - *What we know:* `153-04-PLAN.md:78-80` declares its collision surface **"None"** and lists 152 and
     163 but not 159; `:20` pins "all 11 measured usages"; `:160` proves "no alias string, key or
     ordering changes"; `:151`/`:159`/`:234` and `153-09-PLAN.md:254` pin `Tests 816 passed (816)`.
     All four are falsified by 159 doing what D-H5(a) requires.
   - *What's unclear:* whether 159's plan amends 153's, files a todo against it, or simply sequences
     after it and absorbs the breakage.
   - *Recommendation:* **`checkpoint:decision`** — this is a cross-phase document correction, not an
     executor call, and the project's standing feedback is that an addendum alone lets a stale item
     propagate. Prefer amending 153-04/153-09 directly over an addendum.

---

## Sources

### Primary (in-repo, read this session — highest confidence available for this phase)

Every `[VERIFIED: …]` tag above names a file and line range opened with `Read`/`sed` in this session.
The load-bearing ones:

- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte:44-66`
- `apps/frontend/src/lib/components/input/Input.svelte` (branch map), `Input.type.ts:7-46`, `MultipleTextInput.svelte:1-120`, `QuestionInput.svelte:29-152`
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:1-59`, `.type.ts:1-18`, `EntityCard.svelte:215-368`
- `apps/frontend/src/lib/components/alert/Alert.svelte:105-128`; `apps/frontend/src/app.css:87-182`
- `apps/frontend/.svelte-kit/output/client/_app/immutable/assets/*.css` — **compiled** `.top-2` / `.right-2` / `.-mt-\[1rem\]` / `.mt-16` / `--spacing-*` declarations
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts:1-52`, `trackingService.svelte.ts:1-60,92,196`, `trackingService.svelte.test.ts:159,183,192`
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:320-400`, `appContext.spread.svelte.test.ts:160-200`
- `apps/frontend/src/lib/contexts/app/reactiveHandle.type.ts:1-10`
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:108-139,310-405`
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:25-50,163-165,455-545`
- `apps/frontend/src/lib/utils/constants.ts:1-15`, `multiChoiceValidity.ts:1-31`, `multiChoiceValidity.test.ts:14-65`, `getAllianceSummary.ts`, `i18n/init.ts:40-70`
- `apps/frontend/src/lib/api/utils/auth/providers/index.ts:31`
- `apps/frontend/svelte.config.js:1-30`, `apps/frontend/vitest.config.ts:1-56`, `package.json:28,30,35,36`
- `tests/tests/specs/voter/cold-entry-dataroot.spec.ts:1-53`, `tests/README.md:5-37,276`
- `.planning/spikes/024-derived-alias-stable-ref-skip/README.md`
- `.planning/phases/158-routing-auth-surface-harmonisation/158-CONTEXT.md` (D-G1, D-G5, `<open>` items 4-8)
- `.planning/phases/153-build-tooling-config-correctness/153-04-PLAN.md:20,78-80,151,159,160,234` and `153-09-PLAN.md:254,282` — the `vitest.config.ts` collision and the `816`-test pin
- `.planning/phases/152-comment-naming-hygiene-sweep/152-01-PLAN.md:23,72,93-94,144,153` — the `EntityCardAction` escape fix and its durability note
- `.planning/PRE-SHIP-REVIEW-TRIAGE.md` § Phase 159 (all 14 comments)
- `.planning/REQUIREMENTS.md:151-156,303-308,340`
- `.agents/code-review-checklist.md`, `CLAUDE.md`

### Secondary (official documentation)

- `[CITED: https://svelte.dev/docs/svelte/$effect]` — "When not to use `$effect`"; the `$derived`
  replacement; the ≥5.25 overridable-derived note. **MEDIUM confidence** — official docs, fetched and
  summarised this session, not cross-checked against a second source.
- `[CITED: https://svelte.dev/docs/svelte/$bindable]` — `$bindable` semantics and the absence of a
  derived-bindable pattern. **MEDIUM confidence** — the "No" answer is partly an absence-of-evidence
  reading of that page, which is why Pitfall 1 also offers option A (which works regardless).

### Tertiary

None. No claim in this document rests on a search-engine result.

### Tooling note

`gsd_run query research-plan` routed all three questions to `context7`, but **no Context7 MCP tool is
available in this session**, so the two Svelte questions fell back to `WebFetch` against svelte.dev
(the authoritative source) and the snippet question was answered from in-repo code instead.
`gsd_run query classify-confidence --provider webfetch --verified` returns `LOW`; the seam appears to
recognise only curated MCP providers. **Deviation recorded:** the tags in this document use the
provenance rules from the role brief (`[VERIFIED: path:lines]` for files opened this session with
values quoted verbatim; `[CITED: url]` for official docs) rather than the seam's tier, because the seam's
`LOW` for "official Svelte documentation" and for "read the file and quoted it" is not discriminative.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|------|-------|--------|
| Census counts and 14-bucket classification | **HIGH** | Measured three times with the exact commands; classifier run over all 92 sites; buckets sum to 92. |
| Criterion 6a spacing values | **HIGH** | Read from the **compiled** stylesheet, not inferred from config. |
| Criterion 3 blockers (style block, single consumer, testid) | **HIGH** | All three read directly from source and from `tests/`. |
| Criterion 4 surface analysis | **HIGH** | Exhaustive `grep` for every member; both locking tests read. |
| Criterion 5 rollup delta | **HIGH** | Both blocks read in full; the three differences enumerated. |
| Criterion 6b importer census + 3 configs | **HIGH** | 51 files enumerated; all three configs read line-for-line. |
| Uncovered-comment dispositions | **HIGH** | Each of the six investigated to a runtime conclusion. |
| `$bindable` × `$derived` incompatibility | **MEDIUM** | Official docs + the absence of any counter-pattern in 692 lines of `Input.svelte` and 92 census sites; not empirically compiled this session. |
| Criterion 2 "which types are complex" | **MEDIUM** | The branch structure is verified; the *mapping* to the reviewer's phrase is my reading (A4). |
| Phase 152/153 state | **HIGH** | Both were planned concurrently during this research; `152-01..15-PLAN.md` and `153-01..09-PLAN.md` exist and the collision-relevant lines were read directly (`153-04-PLAN.md:20,78-80,151,159,160`). |
| Phase 158/157 state | **MEDIUM** | Read from their CONTEXT.md files; **neither has a PLAN.md yet**, so their delivered shape is projected, not observed. |

**Research date:** 2026-08-28
**Valid until:** 2026-09-27 for the in-repo measurements (they invalidate on any `apps/frontend/src`
commit — **re-run the census greps at plan time**, as D-H1 itself instructs); 2026-11-28 for the
Svelte/Tailwind version-behaviour claims.
