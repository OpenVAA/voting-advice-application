# Phase 123: Svelte 5 Idiom Polish — Lifecycle & Reactive-State - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Behavior-neutral Svelte 5 idiom cleanup across `apps/frontend/src`, delivering RUNES-01, RUNES-02, RUNES-05:

1. **RUNES-01** — Migrate `onMount`/`onDestroy` → `$effect` **where semantically equivalent** (~24 files: 14 with `onMount`, 16 with `onDestroy`), behavior-neutral and per-site verified. Genuine lifecycle/teardown semantics are retained (out-of-scope cases left untouched).
2. **RUNES-02** — Migrate reactive `let` declarations (locals mutated for reactive effect) → `$state`, per-site. Non-reactive locals stay `let`.
3. **RUNES-05** — Fix the two known context bugs:
   - **Bug 1** — `candidateContext.svelte.ts:378` calls `getApplicableQuestions({ elections, constituencies })` **without `entityType`**, unlike its three sibling calls (lines 364/369/372). One-line fix: add `entityType`.
   - **Bug 2** — `candidateUserDataState.save()` silently drops an explicit `termsOfUseAccepted: null` because of truthy guards (`#editedTermsOfUseAccepted ? …` at line 150 and `if (image || termsOfUseAccepted)` at line 276).

**This phase is mechanical and behavior-neutral.** No visual/UX change — post-runes visual verification and the `svelte/store` ESLint lock-in are **Phase 124** (RUNES-03, RUNES-04). The full `svelte/store`→runes bridge migration (spike-findings domain 1) already landed in v2.13 (Phases 113–117); this phase is the remaining idiom polish, not the bridge migration.

**UI hint is "yes" in ROADMAP, but skip `gsd-ui-phase`** — this is a behavior-neutral structural migration with no visual redesign (precedent: Phases 76/80 a11y/structural phases skipped UI spec). Visual verification is deferred to Phase 124.

</domain>

<decisions>
## Implementation Decisions

### Bug-fix semantics (discussed)
- **D-01 — Bug 2 (`termsOfUseAccepted: null`): persist explicit null.** Track edited-state by `!== undefined`, not truthiness. Tri-state contract: `undefined` = unedited → skip; `null` OR `string` = edited → send to backend. This honors the existing `setTermsOfUseAccepted(value: string | null)` contract so an explicit "un-accept" would persist if ever wired. **Both** truthy sites must change: the changed-properties filter (`candidateUserDataState.svelte.ts:150`) and the save guard (`:276`). NOTE: no production UI sets `null` today (the only caller, `routes/candidate/(protected)/+layout.svelte:50`, always passes `new Date().toJSON()`), so this is a latent-correctness / type-faithfulness fix, not a live-bug fix — keep it strictly behavior-neutral for the existing string path.
- **D-02 — Each bug gets a dedicated regression test.** Extend `candidateUserDataState.svelte.test.ts` to assert the terms edit is included in the `updateEntityProperties` call per D-01 semantics (incl. an explicit-null case). Add a `candidateContext` test asserting `entityType` is passed to `getApplicableQuestions` in the `questionBlocks` computation (Bug 1). Both fixes ship with a guarding test.

### Verification gate (resolved with recommended default — not discussed)
- **D-03 — Acceptance gate = build + unit tests + svelte-check (no net-new errors over the working baseline) + one full E2E suite run as the final trust signal.** Per the project's cardinal E2E rule, a failing/"did-not-run" E2E test blocks completion. Capture the svelte-check baseline error count BEFORE migration so "no net-new" is measurable (criterion 4). The two bug regression tests (D-02) are part of the unit gate.

### Lifecycle & reactive-state scope (resolved with recommended default — not discussed)
- **D-04 — Conservative `onMount`/`onDestroy` → `$effect` posture.** Migrate ONLY clean 1:1 cases where `$effect` is behavior-equivalent: no re-run hazard (body has no reactive deps that would re-fire, or re-running is provably harmless), and no genuine once-only/teardown semantics. Leave ambiguous or genuinely-lifecycle cases as-is, documented per-site (a one-line `// reason:` / `svelte-warning: accepted`-style note where useful). Mind the SSR caveat from spike findings: `$effect` does not run on the server (neither does `onMount`/`onDestroy`, but the re-run behavior differs).
- **D-05 — Reactive `let` → `$state` only when the local is mutated for reactive effect.** Non-reactive locals (computed-once, never reassigned to drive UI) stay `let`. Per-site judgment, not a blanket sweep.
- **D-06 — Commit granularity is Claude's discretion** — prefer atomic per-file or per-requirement commits so a regression can be bisected; this is an executor/planner call.

### Claude's Discretion
- Exact per-site migrate/leave classification for the ~24 lifecycle files and the reactive-`let` sites (apply D-04/D-05 rules during planning/execution).
- Commit batching (D-06).
- Whether a given leave-untouched lifecycle site warrants an inline rationale comment.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` (Phase 123 entry, lines ~353–366) — goal + 4 success criteria.
- `.planning/REQUIREMENTS.md` — RUNES-01 (line 90), RUNES-02 (line 91), RUNES-05 (line 94). RUNES-03/04 are Phase 124 (do NOT pull in).

### Runes idiom conventions (project-specific, non-negotiable)
- `CLAUDE.md` → "Context Destructuring Rule (Svelte 5)" — reactive accessors read via `ctx.X`, never destructured; `dataRoot` `#version`-bridge hole; reactive vs stable member list. Applies unchanged to any context-touching migration.
- `CLAUDE.md` → "Svelte Warning-Accepted Format" — `// svelte-warning: accepted — <rationale>` for any intentionally-accepted compiler warning surfaced by the migration.
- `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` — `<requirements>` block: `untrack()` around write-after-read in `$effect`-scoped helpers (invariant); SSR caveat ($effect doesn't run server-side); destructure-trap is paradigm-preserving. (Auto-loaded during implementation; also see `references/reactive-contexts.md`.)

### External / framework
- https://svelte.dev/docs/svelte/lifecycle-hooks — cited by RUNES-01 for `onMount`/`onDestroy`→`$effect` migration recommendations.

### Review gate
- `.agents/code-review-checklist.md` — mandatory per CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.test.ts` — existing vitest suite for the candidate user-data store (terms/image save shapes). Extend this for the Bug 2 regression test (current happy-path at line 151 sets a string timestamp; add the explicit-null case).
- Bug-1 sibling pattern: `candidateContext.svelte.ts:364/369/372` already pass `entityType` to `appliesTo`/`getApplicableQuestions` — line 378 is the lone omission; copy the sibling call shape.

### Established Patterns
- **Tri-state edited fields** in `candidateUserDataState.svelte.ts`: `#editedTermsOfUseAccepted = $state<string | null | undefined>(undefined)` (line 60); setter `setTermsOfUseAccepted(value: string | null)` (line 222); reset → `undefined` (line 226). D-01 hinges on respecting this tri-state via `!== undefined`.
- **`#version`-bridge / DataRoot identity-stable accessors** — read directly inside the tracking scope (CLAUDE.md carve-out); relevant if any migrated `$effect` touches `dataRoot`.

### Integration Points
- Bug 2 save path: `candidateUserDataState.svelte.ts:242–294` (`save()`), guard at `:276`, properties payload at `:279`; filter at `:150`. Only production caller of the setter: `routes/candidate/(protected)/+layout.svelte:50`.
- Bug 1: `candidateContext.svelte.ts:355–390` (`questionBlocks` `$derived`/compute), `entityType` defined at `:359`, orphaned call at `:378`, exposed via getter at `:565`.
- Lifecycle migration surface (~24 files): `onMount` in 14 files, `onDestroy` in 16 (e.g. `lib/components/video/Video.svelte`, `lib/components/alert/Alert.svelte`, `lib/components/preventNavigation/PreventNavigation.svelte`, `lib/components/modal/drawer/Drawer.svelte`, `lib/components/questions/QuestionOpenAnswer.svelte`, `lib/admin/components/jobs/WithPolling.svelte`). Per-site D-04 classification required — several are browser-only imperative setup that may be genuine once-only lifecycle (leave untouched).

</code_context>

<specifics>
## Specific Ideas

- Bug 2 is type-faithfulness, not a live user-facing bug — keep the string path byte-for-byte behavior-neutral; the only new behavior is that a (currently-unreachable) `null` edit now reaches the backend.
- Bug 1 is a one-line addition mirroring three adjacent sibling calls — minimal blast radius, but the regression test guards against future re-omission.

</specifics>

<deferred>
## Deferred Ideas

None raised during discussion that belong to other phases beyond the reviewed todos below.

### Reviewed Todos (not folded)
All four phase-matched todos are feature work, out of scope for behavior-neutral idiom polish:
- `2026-03-28-investigate-migrating-candidate-answer-store.md` — investigate a more robust candidate answer store. Feature/architecture investigation, not idiom polish.
- `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md` — new UI feature.
- `2026-05-31-fix-nominations-route-fetch-all-questions.md` — data-fetch feature/bugfix in nominations route.
- `2026-05-31-implement-multiple-text-question-input.md` — new question-input component (candidate of Phase 129 new-feature build).

</deferred>

---

*Phase: 123-svelte-5-idiom-polish-lifecycle-reactive-state*
*Context gathered: 2026-06-17*
