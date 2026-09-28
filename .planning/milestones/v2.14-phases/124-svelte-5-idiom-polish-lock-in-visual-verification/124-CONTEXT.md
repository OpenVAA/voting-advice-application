# Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

The **closing** phase of the Svelte 5 idiom-polish workstream. Two verification/hardening deliverables — **no new capability, no visual redesign**:

1. **RUNES-03 — `svelte/store` ESLint guard lock-in.** The guard covers the entire `apps/frontend/src/**` tree and reports zero violations, with a permanent regression self-test proving it fires.
2. **RUNES-04 — post-runes visual verification.** A documented verification pass confirms no regressions on three named surfaces: **app-header styling, banner images, and post-login candidate navigation**.

**This phase is verification + lock-in, not migration.** The store→runes bridge migration landed in v2.13 (Phases 113–117); the lifecycle/reactive-`let`/bug-fix idiom polish landed in Phase 123. Phase 124 closes the workstream by locking the guard against regression and confirming the migrated app still renders correctly.

**Critical scout finding — RUNES-03's glob-widening is already done.** The ESLint guard glob in `apps/frontend/eslint.config.mjs` is already `src/**/*.{ts,svelte}` (widened in **Phase 115 / SWEEP-03**, per the in-file comment at lines 77–84). Verified during discussion: **zero `svelte/store` imports** remain anywhere in `apps/frontend/src`; **no `eslint-disable` escapes**; the only files outside the glob are 12 *generated* Paraglide i18n `.js` runtime files (`lib/paraglide/**`), which never contain hand-authored imports. So RUNES-03's literal requirement ("extend the guard to the entire tree") is **already satisfied** — Phase 124's RUNES-03 work is therefore *confirmation + a permanent self-test*, not a widening (see D-01).

**UI hint is "yes" in ROADMAP, but skip `gsd-ui-phase`** — this is a verification pass with no visual redesign (nothing to design; the goal is "no change"). Precedent: Phase 123 (sibling) and Phases 76/80 skipped the UI spec for behavior-neutral / verification work.

</domain>

<decisions>
## Implementation Decisions

### RUNES-03 — ESLint guard lock-in
- **D-01 — Confirm + permanent self-test (NOT re-widen).** The glob already covers `src/**/*.{ts,svelte}` (Phase 115 SWEEP-03) and `yarn lint:check` already reports zero `svelte/store` imports. Phase 124's RUNES-03 deliverable is therefore:
  1. Run `yarn lint:check` (frontend) and assert **zero** `svelte/store` / `no-restricted-imports` violations — the measurable "reports zero violations" criterion.
  2. Document RUNES-03 as **already-met by Phase 115 SWEEP-03** in the verification artifact + flip the requirement/traceability status, citing the eslint.config.mjs comment.
  3. **Add a permanent guard regression self-test** that proves the guard actually fires — e.g. a fixture/spec asserting a deliberate `import { writable } from 'svelte/store'` under `apps/frontend/src/**` trips `no-restricted-imports` (lint exits non-zero). This makes the lock-in *provable*, not merely *present*. Exact mechanism (a tiny lint-on-fixture test vs. a CI assertion) is Claude's discretion — the planner/researcher picks the lightest approach that runs in the existing test/lint gate.
- **D-02 — Do NOT broaden the guard's semantics or glob.** Hardening beyond the bare import-name ban (banning `get()`/`subscribe()`/`Readable`/`Writable` type imports, `$store` auto-subscription, or closing the generated-`.js` glob gap) was explicitly **not chosen** — it exceeds the requirement text ("extend the guard to the entire tree") and the generated Paraglide `.js` files are not a real regression surface. Keep RUNES-03 to confirm + self-test.

### RUNES-04 — visual verification
- **D-03 — Method: manual documented pass (NOT pixel snapshots).** Drive the running app and visually confirm the three surfaces, capturing screenshots as evidence and writing a verification report. A one-time pass — **no permanent pixel-snapshot test**. Rationale: `toHaveScreenshot()` baselines are net-new infra and pixel-diff flake collides with the project's cardinal "no known-flaky E2E" rule; functional E2E assertions were considered but the operator chose the lighter documented-pass route that the originating todo describes.
- **D-04 — Reference: correctness smoke (present-and-correct), NOT a historical pixel diff.** "No regressions" means each surface is **present and correct per spec** — header styled (light + dark), banner/hero image loads and renders, candidate nav renders correctly post-login. No pre-migration git-ref screenshot diff is required; "regression" = "broken/stale," not "pixel-changed."
- **D-05 — On a found regression: fix in-phase.** If the verification pass surfaces a real visual/nav regression, **repair it within Phase 124** (its own atomic commit + re-verify the affected surface), rather than only filing a follow-up todo. **Guardrail:** if a regression turns out to be large/architectural (not a stale Tailwind class or a lost reactive binding), the planner should flag it for an operator scope decision rather than ballooning the phase — keep the default-path fixes bounded to small, surgical repairs.
- **D-06 — Verification scope matrix (sensible default; planner may refine).** Per the originating todo, cover at minimum:
  - **App header** — light **and** dark theme; both the voter app and the candidate app.
  - **Banner / hero images** — render correctly across the key routes that show them, in at least the default locale (spot-check one other locale, e.g. `en`, since asset/derived-state paths were the migration risk).
  - **Post-login candidate nav** — log in as a candidate and walk the protected-route navigation (nav menu, nav state, logout); desktop primary, with a mobile-viewport spot-check (nav is the highest-risk reactivity surface — original Phase 61 destructure-trap origin).
- **D-07 — Evidence artifact.** Produce a committed verification report (e.g. `124-VISUAL-VERIFICATION.md`) recording per-surface pass/fail, the env used, and screenshots (or links to them). Exact filename/format is Claude's discretion.

### Acceptance gate (carried from Phase 123 convention)
- **D-08 — Gate = `yarn lint:check` clean (RUNES-03) + the guard self-test passing + the RUNES-04 verification report showing all three surfaces pass + the standard build/unit/E2E trust signal per the cardinal rule.** A "did-not-run" E2E counts as a failure. Capture the verification in the report so completion is auditable.

### Claude's Discretion
- The exact mechanism of the RUNES-03 guard self-test (D-01.3).
- The verification-report filename, format, and screenshot storage (D-07).
- Per-surface depth within the D-06 matrix (which exact routes/locales/viewports beyond the minimums).
- Commit granularity (prefer atomic: RUNES-03 lock-in separate from any RUNES-04 fix).

### Folded Todos
Two todos are explicitly tagged `resolves_phase: 124` and are folded into scope:
- **`2026-06-04-extend-svelte-store-eslint-guard-app-wide.md`** → RUNES-03. Original problem: the v2.11 Phase 98 guard was scoped to `lib/contexts/**` + `routes/**` only; widen it frontend-wide. **Status note:** the widening already landed in Phase 115 SWEEP-03 (todo predates it) — Phase 124 confirms + self-tests it per D-01.
- **`2026-06-03-after-runes-update-check-stale-app-header-styling-banner-ima.md`** → RUNES-04. Names the exact three surfaces (app-header styling, banner images, post-login candidate nav) and the per-surface migration-risk rationale. Drives D-03..D-07.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 124 entry (goal + 2 success criteria). Phase 123 entry (sibling predecessor) for the workstream convention.
- `.planning/REQUIREMENTS.md` — RUNES-03 (line 92), RUNES-04 (line 93); traceability table (lines 169–170).

### RUNES-03 — the existing guard (already app-wide)
- `apps/frontend/eslint.config.mjs` (lines 77–107) — the `no-restricted-imports` `svelte/store` ban; glob already `src/**/*.{ts,svelte}` per the SWEEP-03 comment. The verbatim re-included deep-relative-`lib` pattern ban must stay (flat-config replaces, not merges).
- `packages/shared-config/eslint.config.mjs` (~lines 147–152) — the inherited deep-relative-`lib` `patterns` ban that the frontend block re-includes verbatim.
- `.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` — the folded RUNES-03 todo (source: v2.11 Phase 98 decision 98-2).

### RUNES-04 — visual verification surfaces & origin
- `.planning/todos/pending/2026-06-03-after-runes-update-check-stale-app-header-styling-banner-ima.md` — the folded RUNES-04 todo: the 3 surfaces + per-surface risk rationale + the "verify light/dark, both apps, across routes and locales, candidate post-login walk" method sketch.
- `apps/frontend/src/routes/Header.svelte` — app-header surface.
- `apps/frontend/src/routes/Banner.svelte` — banner/hero-image surface.
- `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` — post-login candidate-nav surface.

### Runes idiom conventions (project-specific, non-negotiable)
- `CLAUDE.md` → "Context Destructuring Rule (Svelte 5)" — reactive accessors read via `ctx.X`; `dataRoot` `#version`-bridge hole; the reactive-vs-stable member list. Relevant when diagnosing any nav/header reactivity regression (post-login nav is the Phase 61 destructure-trap origin).
- `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` — runes requirements (no `svelte/store`, no `$store.X` auto-subscribe, `untrack()` invariant, SSR caveat) + domain-2 (View Transitions / a11y). Auto-loaded during implementation.

### Tooling / environment
- `tests/playwright.config.ts` — the E2E Playwright config (if any functional probe is added; primary verification is manual per D-03).
- `CLAUDE.md` → Development/E2E commands (`yarn dev`, `yarn db:reset`, `yarn db:seed:default`) — the manual pass needs a running dev server + a seeded DB with a registerable/registered candidate for the post-login walk.

### Review gate
- `.agents/code-review-checklist.md` — mandatory per CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/eslint.config.mjs` — guard already present & app-wide; RUNES-03 reuses it as-is (confirm + self-test, no edit needed unless the self-test fixture lives alongside).
- Existing frontend lint/test gates (`yarn lint:check`, `yarn workspace @openvaa/frontend check`, vitest) — the RUNES-03 self-test should slot into one of these, not a bespoke runner.
- The repo runs the app + Playwright cleanly via host Vite + local Supabase (per project memory: E2E 95/0, no Docker), so the manual RUNES-04 pass is feasible here without extra infra.

### Established Patterns
- **Flat-config replacement semantics** — the frontend `no-restricted-imports` block REPLACES (does not merge) the inherited array for in-scope files, so the deep-relative-`lib` `patterns` ban is re-included verbatim (RESEARCH Pitfall 3). Any guard touch must preserve this.
- **Skip-UI-phase for verification work** — Phase 123 (sibling) + Phases 76/80 precedent: behavior-neutral / verification phases skip `gsd-ui-phase`.
- **Verification-report-as-deliverable** — prior phases (e.g. 91 visual/perf) produced VERIFICATION-style artifacts recording per-item pass/fail.

### Integration Points
- The 3 RUNES-04 surfaces consume migrated reactive context (appSettings / locale / darkMode / candidateContext) — the exact accessors whose shape changed under the runes migration; that is why they are the named risk surfaces.
- Post-login candidate nav (`CandidateNav.svelte`) depends on `candidateContext` reactive accessors — the original Phase 61 destructure-trap surface; highest-risk for a reactivity regression.
- The 12 generated Paraglide `.js` files (`apps/frontend/src/lib/paraglide/**`) are the only `src` files outside the guard glob — intentionally excluded (generated, never hand-authored); not a regression surface (D-02).

</code_context>

<specifics>
## Specific Ideas

- RUNES-03 is essentially a **bookkeeping + provable-lock-in** task: the hard part (widening + clearing all imports) already happened in Phase 115. The new value is the self-test that guarantees the guard fires, plus correctly flipping RUNES-03's status with a citation rather than re-doing finished work.
- RUNES-04 is a **"confirm nothing broke"** pass, not a redesign. The three surfaces were singled out because each consumes a reactive accessor whose shape changed under the migration (header → appSettings/locale/darkMode; banner → derived asset paths; candidate nav → candidateContext, the destructure-trap origin).
- Keep RUNES-03 and any RUNES-04 fix in separate atomic commits so a later bisect can isolate a lock-in change from a visual repair.

</specifics>

<deferred>
## Deferred Ideas

None raised that belong to other phases beyond the reviewed todos below. Discussion stayed within the verification/lock-in scope.

### Reviewed Todos (not folded)
The remaining phase-matched todos are feature work or other-phase scope, out of bounds for a verification/lock-in phase:
- `2026-03-28-generalize-candidate-app-to-party-app.md` — large product refactor; explicitly Out of Scope this milestone.
- `2026-03-28-investigate-migrating-candidate-answer-store.md` — architecture investigation (v2 CAND-STORE-01).
- `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md`, `2026-05-31-fix-nominations-route-fetch-all-questions.md`, `2026-05-31-implement-multiple-text-question-input.md` — new-feature build (Phase 129).
- `2026-06-12-resolve-all-svelte-check-errors.md` — svelte-check zero workstream (Phases 125–128, 132).
- `2026-06-15-fix-view-transition-flicker-in-results-section.md` — View-Transitions UX bug; not one of the 3 named RUNES-04 surfaces (separate follow-up).
- `2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md`, `2026-06-07-hide-forgot-password-email-input-after-submitting.md`, `2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md` — unrelated UI/arch follow-ups.

</deferred>

---

*Phase: 124-svelte-5-idiom-polish-lock-in-visual-verification*
*Context gathered: 2026-06-18*
