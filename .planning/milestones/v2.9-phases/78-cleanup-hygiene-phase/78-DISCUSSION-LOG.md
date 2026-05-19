# Phase 78: Cleanup Hygiene Phase - Discussion Log

**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question)
**Date:** 2026-05-12

## Auto-selected gray areas

All gray areas auto-selected per `--auto` mode. Areas:

1. **Plan grouping + sequence** — D-01
2. **`db:*` rename + alias semantics** — D-02 / D-03 / D-04
3. **Redirect implementation strategy (CLEAN-02)** — D-05 / D-06 / D-07
4. **CLEAN-03 sub-finding implementation** — D-08 / D-09 / D-10
5. **i18n wrapper tightening scope + audit deliverable** — D-11 / D-12
6. **Voter-fixture race-fix scope** — D-13
7. **Phase 73 review findings sweep** — D-14
8. **Plan order + dependency direction** — D-15 / D-16
9. **Determinism contract + parity-gate regen** — D-17 / D-18
10. **Vite-cache wipe + end-of-phase gate** — D-19
11. **Locator + lint convention** — D-20

## Auto-selected decisions per question

### Plan grouping + sequence
- **Q:** "How many plans? ROADMAP estimate: ~6-8; CLEAN-01/02/04 1 each, CLEAN-03 trio + CLEAN-05 split."
- **Selected:** "7 plans (P01 CLEAN-01 / P02 CLEAN-02 / P03 CLEAN-03 trio / P04 CLEAN-04 / P05 CLEAN-05 voter-fixture / P06 CLEAN-05 review findings / P07 verification gate)" (recommended default — matches ROADMAP estimate; CLEAN-03 bundled trio is the natural split given small sub-findings; CLEAN-05 split into voter-fixture + review-findings is the natural cluster boundary)

### `db:*` rename + alias semantics
- **Q:** "Keep aliases or remove immediately?"
- **Selected:** "Keep with one-line deprecation warning; plan removal after one milestone" (recommended default per source todo "Approach" step 1 — preserves back-compat for in-flight Phases 76/77)

- **Q:** "Chain `dev:clean` into `db:reset` and `db:reset-with-data`?"
- **Selected:** "YES — supabase reset first, `dev:clean` after via `&&` chain" (recommended default per source todo "Chain semantics" + v2.8 P69 gotcha)

### Redirect implementation strategy
- **Q:** "Where does the redirect gate live?"
- **Selected:** "Located-route layout `+layout.ts` (or `+layout.server.ts`) — read state from voter context; throw `redirect(303, /elections?next=...)` if missing" (recommended default — single insertion point covers all located routes)

- **Q:** "Open-redirect protection?"
- **Selected:** "Whitelist `?next=` to voter-app routes via regex on encoded pathname (`^/[a-z]{2}?/...`)" (recommended default — minimum viable open-redirect protection)

- **Q:** "E2E coverage location?"
- **Selected:** "NEW spec `voter-not-located-redirect.spec.ts`" (recommended default — scope-marked filename; 4 test cases per source todo)

### CLEAN-03 sub-finding implementation
- **Q:** "Per-cast `// reason:` distribution — same reason text on all 13 sites?"
- **Selected:** "Per-cast category (image / answer / settings) with category-specific reason text" (recommended default — distinguishes the JSONB → typed-shape vs. JSONB → answers cases per source todo)

- **Q:** "`setStore` cast refactor approach?"
- **Selected:** "Inline use — `afterNavigate(() => store.set(buildFn()))` (Option 2)" (recommended default — simplest; eliminates the one-shot variable; matches existing patterns)

- **Q:** "CLAUDE.md anchor — new top-level section or sub-section?"
- **Selected:** "New sub-section under 'Important Implementation Notes'" (recommended default — avoids growing section count; keeps adjacent to related Svelte 5 notes)

### i18n wrapper tightening
- **Q:** "Tighten t() signature scope?"
- **Selected:** "TranslationKey union type from auto-generated `translationKey.ts`" (recommended default per source todo)

- **Q:** "Handle `t.get = t` alias?"
- **Selected:** "Rewrite all consumers and remove alias" (user edited after auto discussion)

- **Q:** "Add `@ts-expect-error` regression-locking test?"
- **Selected:** "YES — assert in translations.test.ts that missing key is compile-time error" (recommended default — locks the tightening against future regressions)

### CLEAN-04 Pairing direction
- **Q:** "Order A or Order B (per ROADMAP Pairing note + Phase 74 D-06)?"
- **Selected:** "Order B — Phase 74 landed E2E-08 first; Phase 78 P04 tightens; E2E-08 re-validates against tightened wrapper" (recommended default — explicit precedent in Phase 74 D-06)

### Voter-fixture race-fix scope
- **Q:** "Path A or Path B?"
- **Selected:** "Path B — `--likert-only` seed modifier (operator-locked 2026-05-11)" (per source todo operator decision; not a Claude choice)

- **Q:** "Heterogeneous-question-type coverage in this phase?"
- **Selected:** "NO — explicitly OUT OF SCOPE per operator lock; deferred to future-milestone backlog" (per source todo)

### Phase 73 review findings sweep
- **Q:** "Group by surface (cluster-edit) or per-finding?"
- **Selected:** "Group by surface — variants/setup/utils/specs clusters per D-14" (recommended default — efficient editing; reduces context-switching cost)

- **Q:** "Plan 06 split into 06a (CR+WR) + 06b (IN)?"
- **Selected:** "Default 1 bundled Plan 06; planner may split at PLAN.md time if scope exceeds per-plan ceiling" (recommended default — bundle for efficiency; split as fallback)

### Plan order + dependency
- **Q:** "Serial or parallel?"
- **Selected:** "Mostly-parallel — Plans 01-06 independent surfaces; P05 has weak dependency on P01 (db:* alias OR fallback); P07 depends on all" (recommended default — minimum merge conflict)

### Determinism contract
- **Q:** "Parity-gate regen required?"
- **Selected:** "REQUIRED — 16-test PASS_LOCKED swap is the explicit ROADMAP SC #5 acceptance" (per ROADMAP)

### Vite-cache wipe
- **Q:** "Use new `dev:clean` (post-Plan-01) or imperative recipe?"
- **Selected:** "Use `yarn dev:clean` post-Plan-01; fallback to imperative if order differs" (recommended default — exercises the new script)

### Locator + lint convention
- **Q:** "Role/aria or testIds for Plan 02 new spec + Plan 06 IN-03 sites?"
- **Selected:** "Role/aria default; `// reason:` blocks for IN-03 sites that can't migrate" (recommended default — Phase 74 D-11 + Phase 75 D-06 + Phase 76 D-11a + Phase 77 D-11 inheritance)

## Deferred ideas captured

- Removal of deprecated `dev:*` aliases (v2.10+ follow-up)
- Heterogeneous-question-type voter-fixture coverage (operator-locked OUT)
- `dataContext.ts` `setStore`-equivalent eradication beyond `getRoute.svelte.ts`
- `t.get = t` retention if many consumers (PASS-WITH-DEFERRAL)
- `@ts-expect-error` regression-locking tests for other tightened APIs
- Visual-regression coverage of i18n wrapper
- CLEAN-03 analog eradication beyond named sites
- CLEAN-05 review findings beyond `73-REVIEW.md`'s 13
- `58-E2E-AUDIT.md`-style addendum for `--likert-only` seed mode

## Folded todos

7 source todos RESOLVED in Phase 78 (per Folded Todos in `<decisions>`):
- `2026-05-10-rename-package-scripts-dev-to-db.md` → CLEAN-01
- `2026-05-10-redirect-unlocated-voter-to-selectors.md` → CLEAN-02
- `2026-05-10-d04-per-cast-reason-distribution.md` → CLEAN-03a
- `2026-05-10-getroute-setstore-cast-cleanup.md` → CLEAN-03b
- `2026-05-09-claude-md-svelte-warning-accepted-format.md` → CLEAN-03c
- `2026-05-09-tighten-i18n-wrapper.md` → CLEAN-04
- `2026-05-11-voter-fixture-heterogeneous-question-types.md` → CLEAN-05a (moves to `completed/`)

Source-todo removal + STATE.md cleanup happens at Plan 07.

## Reviewed-but-not-folded todos

See `<deferred>` section of `78-CONTEXT.md` for the full audit. Phase 78 is bounded to the 5 CLEAN-0X workstreams; non-folded todos route to other phases or remain backlog.

---

*Phase: 78-Cleanup Hygiene Phase*
*Mode: --auto*
*Discussion log generated: 2026-05-12*
