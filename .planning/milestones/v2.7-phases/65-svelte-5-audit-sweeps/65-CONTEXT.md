# Phase 65: Svelte 5 Audit Sweeps - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Milestone:** v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Phase 1 of 4)

<domain>
## Phase Boundary

Sweep `apps/frontend/src/lib/**/*.svelte` (and select `src/routes/`) for three Svelte 5 idiom hazards left over from the v2.6 migration:

1. **`bind:*` audit** — 93 sites under `apps/frontend/src/lib/`. Each must be classified as keep / migrate / remove. The dev server must emit zero `binding_property_non_reactive` warnings during the post-fix smoke. Surfaced by Phase 64 manual smoke (`QuestionChoices.svelte:271` warning fixed locally; broader sweep deferred).
2. **`{#key …}` audit** — only 2 sites total in `apps/frontend/src/`: `routes/candidate/(protected)/questions/[questionId]/+page.svelte:243` (`{#key question.id}`) and `routes/(voters)/(located)/results/+layout.svelte:372` (`{#key \`${activeElectionId}:${activeEntityType}\`}`). Both are deliberate; the audit confirms that and adds inline justification. Sweep also looks for residual `{#key item}`-inside-`{#each}` patterns and missing-key conversion candidates (Phase 64 removed one such pattern from `EntityList.svelte`).
3. **Context-destructuring rule** — Phase 61 Plan 03 diagnosed that `const { electionData, candidates } = ctx` breaks Svelte 5's reactive tracking when read inside `$derived`/`$effect`. Codebase-wide audit + a documented project rule in `CLAUDE.md`.

**Goal anchor:** ROADMAP SC-1/2/3/4 — every retained `bind:*` site has either inline justification or matches a documented pattern in `CLAUDE.md`; zero binding warnings in voter + candidate-app smoke; `{#key}` sites have inline justification or test gate; context-destructuring rule documented; v2.6 parity gate at HEAD `2c7ad2dea` continues to pass.

**In scope:**
- Inline classification of all 93 `bind:*` sites under `apps/frontend/src/lib/`
- Verification of the 2 `{#key}` sites + each-block conversion residue sweep
- Codebase audit for `const { … } = ctx` / `const { … } = getContext(...)` / `const { … } = use*Context()` destructure patterns
- `CLAUDE.md` (or per-package README) entry documenting the context-destructure rule
- Manual smoke: 9-step voter flow + a light 3-4 step candidate-app sanity (login → view question → save)
- Local fixes for any broken-by-destructure-but-working sites uncovered during the audit

**Out of scope:**
- `bind:*` audits outside `apps/frontend/src/lib/**` (routes are out unless they're the only consumer of an audited lib component — case-by-case)
- Other Svelte 5 idioms (`$effect.pre`, `$state.raw`, `$state.snapshot`, etc.) — explicit OoS per REQUIREMENTS.md
- ESLint rule implementation for the destructure ban — guideline-only this phase (D-02)
- Migration to `$bindable()`-driven flow at consumer sites unless the audit surfaces a specific hazard requiring it

</domain>

<decisions>
## Implementation Decisions

### Audit Deliverable Format

- **D-01: Inline-only justifications.** Each retained `bind:*` site gets a Svelte comment (`<!-- bind: keep — reason -->`) or an adjacent `// Phase 65: $bindable annotation` line. No separate `65-AUDIT.md` table. Rationale: 93 sites is too many to keep in sync across two surfaces; reviewers read code at the site, not in a separate doc; single source of truth.

### Context-Destructuring Rule

- **D-02: CLAUDE.md guideline, not a lint rule.** Documented as: *"Use direct property access (`ctx.X`) for reactive reads inside `$derived` / `$effect`. Destructuring (`const { X } = ctx`) is acceptable for one-shot setup reads (e.g., `getRoute`, `t` translation function) where reactive tracking isn't needed."* Any broken-by-destructure-but-working sites uncovered during audit are either rewritten to direct access or carry an inline justification noting they're one-shot reads. Lint enforcement deferred — Phase 65 doesn't ship an ESLint rule. Rationale: matches Phase 61's actual fix shape; lower friction; preserves legitimate one-shot patterns like the `routes/candidate/(protected)/questions/+layout.svelte:27` `const { getRoute, t } = ctx` site.

### Smoke Scope

- **D-03: 9-step voter smoke + light candidate-app smoke.** Reuse the v2.6 9-step voter checklist (Phase 60-04 / Phase 64 D-10 manual checkpoint). Add a 3-4 step candidate-app sanity pass: (1) candidate login, (2) view a question, (3) save an answer, (4) logout. `bind:*` instances skew candidate-app-heavy (PasswordSetter, PasswordValidator, TermsOfUseForm, LogoutButton) so the candidate path is non-optional. Matches ROADMAP SC-1's "voter flow + candidate-app smoke" phrasing.

### {#key} Sweep Depth

- **D-04: Audit existing 2 sites + each-block conversion residue sweep.** The 2 known sites both look deliberate (URL-context reset, question id remount) and just need inline justification confirming why the remount is observable behavior. Additionally, sweep `{#each ... as item}` blocks under `apps/frontend/src/` for two patterns:
  - `{#key item}` *inside* `{#each items as item}` — replace with keyed each `{#each items as item (item.id)}` if the template is positional. Phase 64 already removed one such case from `EntityList.svelte`; verify no residue.
  - `{#each items}` blocks where `item.id`-style keying would be the more idiomatic fix vs the current positional reuse.
  Missing-key bug sweep (looking for places where a `{#key}` *should* exist but doesn't) is **out of scope** — too large; defer.

### Plan Split

- **D-05: 3 plans (per ROADMAP).** Suggested:
  - **Plan 65-01: `bind:*` audit + inline justifications** — Walk all 93 sites, classify, fix `binding_property_non_reactive` warnings, add inline justifications. Largest plan.
  - **Plan 65-02: `{#key}` audit + context-destructure audit + CLAUDE.md rule** — Bundle the 2 small audits since both touch a handful of files and depend on the same audit toolkit (codebase grep + classify + annotate).
  - **Plan 65-03: Verification + smoke** — Voter 9-step + candidate-app smoke; v2.6 parity gate re-run; phase verification report.
  Sequential; no parallelism opportunities since plan 03 depends on 01 + 02 landing.

### Claude's Discretion

- Specific wording of the CLAUDE.md context-destructure guideline (D-02) — the planner picks language consistent with adjacent CLAUDE.md style. Anchor on the Phase 61 Plan 03 example as the canonical broken case.
- Inline comment phrasing for the 93 `bind:*` sites — use a consistent short prefix (e.g., `bind:` or `Phase 65 audit:`) but the wording per category (`bind:this` reactive, `$bindable()` flow, two-way state) is the planner's call.
- Whether to bundle the candidate-app smoke into a separate plan or fold it into 65-03 — folded by default (D-05); split if 65-03 grows unwieldy.
- Specific bind:* migration targets if the audit reveals deep two-way bindings (3+ component layers per todo item 1) — surface as deferred ideas, not in-scope rewrites.

### Folded Todos

- **`svelte5-cleanup.md` items 4 + 5** (`bind:*` audit + `{#key}` audit) — folded as the entire scope of D-01, D-04. The todo file is closed by Phase 65 completion.
- **`2026-04-25-investigate-destructuring-contexts.md`** — folded as D-02 + D-03 audit substep. Closed by Phase 65 completion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 65 — Goal, success criteria, plan count
- `.planning/REQUIREMENTS.md` §SVELTE5 — SVELTE5-01, SVELTE5-02, SVELTE5-03 acceptance text
- `.planning/STATE.md` §Roadmap Evolution — v2.7 milestone scope rationale

### Source Todos (folded into this phase)
- `.planning/todos/pending/svelte5-cleanup.md` — items 4 (`bind:*` audit) and 5 (`{#key}` audit) — full audit pattern catalog
- `.planning/todos/pending/2026-04-25-investigate-destructuring-contexts.md` — full investigation scope + Phase 61 reference

### Prior-Phase Context (read for the destructure-bug origin)
- `.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-CONTEXT.md` — Phase 61 D-XX context destructure decision
- `.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md` — original `const { electionData, candidates } = ctx` failing case + the working `ctx.electionData` fix
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` — Phase 64 manual smoke surfaced the `bind:*` warning at `QuestionChoices.svelte:271`

### Files Targeted by the Audit
- `apps/frontend/src/lib/**/*.svelte` — 93 `bind:*` sites; primary audit surface
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:243` — `{#key question.id}` site
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:372` — `{#key \`${activeElectionId}:${activeEntityType}\`}` site
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:113` — already documents the destructure hazard in a comment; reference example for the CLAUDE.md rule
- `apps/frontend/src/routes/candidate/(protected)/questions/+layout.svelte:27` — `const { getRoute, t } = ctx` — example of a legitimate one-shot destructure that the rule allows

### Documentation Targets
- `CLAUDE.md` — primary location for the destructure rule (D-02). Per-package READMEs are a fallback if a package-specific addendum makes more sense.

### Verification References
- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — v2.6 parity gate tool; Phase 65 verification re-runs but does NOT regenerate constants
- `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — v2.5 baseline (preserved per Phase 64 D-15)
- v2.6 parity baseline at HEAD `2c7ad2dea` — Phase 65 must not regress this gate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`grep -rn "bind:" apps/frontend/src/lib --include='*.svelte'`** — canonical audit invocation (todo item 1). Returns 93 lines today.
- **`grep -rn "{#key" apps/frontend/src --include='*.svelte'`** — canonical `{#key}` audit invocation. Returns 2 lines today.
- **Phase 64 fix pattern at `QuestionChoices.svelte:271`** — `bind:this={inputs[id]}` warning was fixed by converting `const inputs = {}` to `const inputs = $state({})`. Apply the same pattern at any other `bind:this` warning surfaced by the audit.
- **Phase 61 fix pattern at `+layout.svelte` (candidate questions)** — `const { electionData, candidates } = ctx` → `const visible = $derived(filterCandidates(ctx.electionData, ctx.candidates))`. Apply at any other broken destructure site found during the audit.
- **`candidateContext.svelte.ts:113` documentation comment** — already an in-tree example of the destructure hazard, written as a code comment. Reference style for inline annotations on retained legitimate destructures.

### Established Patterns

- **`apps/frontend/src/lib/contexts/<concern>/<concern>Context.svelte.ts`** — context location pattern. The destructure rule applies to consumers of `getContext()` returns from these files.
- **Inline justification comments** — Phase 64 introduced inline comments explaining non-obvious binding/key decisions (`<!-- ... -->`). Reuse the syntax convention.
- **Phase 60 `get(store) + untrack(() => store.update(...))` idiom** — defensive against `effect_update_depth_exceeded`. Don't preemptively reach for it during the bind audit; only if a binding fix triggers the symptom.
- **UI-framework agnosticism for `@openvaa/*` packages** — Phase 64 D-01 (carried forward). The destructure-rule documentation lives in app code (`CLAUDE.md`) not in `@openvaa/data` etc., since contexts are an app-side concern.

### Integration Points

- **`hooks.server.ts`** — Svelte session/locale wiring; not in audit scope unless a `bind:*` regression is observed there.
- **Candidate-app `(protected)` route group** — heavy `bind:*` user (PasswordSetter, etc.); priority audit target for the candidate-app smoke step (D-03).
- **Voter results `+layout.svelte`** — heavy context consumer; primary target for the destructure audit substep alongside the candidate-app `+layout.svelte`.

</code_context>

<specifics>
## Specific Ideas

- **Inline-only documentation philosophy** (D-01) — single source of truth at the site; don't fork knowledge into a separate AUDIT.md that has to be maintained alongside the code.
- **CLAUDE.md guideline phrasing seed** (D-02) — "Use direct property access (`ctx.X`) for reactive reads inside `$derived`/`$effect`. Destructuring (`const { X } = ctx`) is acceptable for one-shot setup reads (e.g., `getRoute`, translation `t`) where reactive tracking is not needed." Planner refines.
- **Candidate-app smoke is non-optional** (D-03) — `bind:*` distribution makes voter-only smoke an inadequate verification surface.
- **Sweep for each-block conversion residue, not missing-key bugs** (D-04) — bounded scope; missing-key bug sweep is a much bigger investigation that doesn't fit the v2.7 milestone.

</specifics>

<deferred>
## Deferred Ideas

- **ESLint rule for context-destructure ban** (D-02 alternative) — Phase 65 ships a guideline; if violations recur, a future phase can add a custom svelte-eslint rule. Captured but not in v2.7.
- **Missing-`{#key}` bug sweep** (D-04 alternative) — looking for places where positional reuse causes silent bugs. Out of v2.7 scope; revisit if a regression surfaces.
- **`bind:*` migration to `$bindable()`-flow patterns** — for two-way bindings flowing 3+ component layers. Mentioned in todo item 1; defer unless audit surfaces a specific hazard.
- **Wider Svelte 5 idiom audit** (`$effect.pre`, `$state.raw`, `$state.snapshot`) — explicitly OoS in REQUIREMENTS.md.
- **Centralized `bind:*` migration playbook** for future Svelte upgrades — could be extracted from the inline justifications post-Phase-65; not in scope.

### Reviewed Todos (not folded)

- None — Phase 65 scope is precisely the two folded todos. No additional pending todos surfaced as in-scope during scout.

</deferred>

---

*Phase: 65-svelte-5-audit-sweeps*
*Context gathered: 2026-04-29*
