# Phase 121: E2E Specs — Flow Coverage - Context

**Gathered:** 2026-06-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Drive the voter & candidate end-to-end **flow** behaviours to asserted E2E coverage: entity filters, voter-vs-entity answer comparison, per-category subMatch breakdown, skip/delete/back navigation, mid-session locale switch, dark-mode persistence, user-preferences round-trip + tracking-payload emission, nav-menu contents per app, and an interactive mobile-viewport voter journey. Requirements: **EFLOW-01, -03, -04, -05, -06, -07, -08, -09, -11** (9). Alliance EFLOW-02 → deferred Phase 130; bank-auth EFLOW-10 → Phase 122. All specs must pass **3×** (3× determinism standard).

**What each requirement resolves to (from the APPROVED coverage plan):**
- **EFLOW-03, -05** — CONFIRMED ALREADY COVERED in `voter-journey.spec.ts` (4-case comparison; skip/delete/back + answer-count→results-CTA). **No new code** — re-confirm only.
- **EFLOW-01** — EXTEND `voter-journey` filter step (A4, no new spec): add (1) categorical select-all/select-none control behaviour, (2) text-search × dialog-filter intersection, (3) reset restoring full list.
- **EFLOW-04** — EXTEND `voter-journey` subMatches step (A4, no new spec): assert CORRECT per-category values for ONE candidate (only voter-answered categories appear; each gauge = expected score), upgrading the current count-only `toHaveCount(4)`.
- **EFLOW-06** — EXTEND `perm-localisation-positive.spec.ts`: net-new in-flight **answer/selection-state-preserved** slice across fi→en→fi (existing spec only switches pre-answer on home).
- **EFLOW-07** — NEW `voter-dark-mode.spec.ts` (leaf project, read-only on base, no setup/teardown). Toggle → assert applied → reload → assert persisted. PLUS extend `a11y-smoke.spec.ts` to re-run the axe colour-contrast scan with dark mode enabled.
- **EFLOW-08** — NEW `voter-prefs-tracking.spec.ts`. Prefs round-trip (every persisted field) + tracking-payload assertion via the `trackingIntercept` fixture (consent → emits; suppression → empty).
- **EFLOW-09** — EXTEND `candidate-journey.spec.ts`: candidate nav-menu contents logged-in vs logged-out. PLUS voter conditional nav-item omission (see D-02).
- **EFLOW-11** — NEW `voter-journey-mobile.spec.ts` (mobile device descriptor project). Interactive walk intro→select→answer→results→drawer; also feedback, nav-menu items, filters on mobile.

</domain>

<decisions>
## Implementation Decisions

### Seed strategy (additive-first)
- **D-01 (EFLOW-08 analytics seed):** Create a **dedicated perm node** (e.g. `perm-analytics-tracking`) carrying the analytics overlay (`analytics.platform='umami'` + `analytics.trackEvents=true`) that the `trackingIntercept` fixture requires as its arming prerequisite; `voter-prefs-tracking` depends on it. e2e/base stays untouched (additive). Consent (`userPreferences.dataCollection.consent`) is toggled at runtime in-app, NOT seeded.

### Test placement / host
- **D-02 (EFLOW-09 voter conditional nav items):** Assert the "Select elections" / "Select constituencies" nav-menu items are omitted-when-unavailable by **riding the existing EPERM-02 perm datasets** (`perm-1e1cg1co` / `perm-disable-election-1co`) where the not-selectable seed already exists — no new dataset. The candidate logged-in-vs-out nav slice stays in `candidate-journey.spec.ts`.

### Mobile coverage mechanism
- **D-03 (EFLOW-11 mobile smoke for EPERM-06/07):** Add the mobile-viewport smoke to `perm-question-video` and `perm-interactive-info` as a **per-spec viewport-override sub-test** (one extra test block per spec using a context/viewport override) — NOT a new shared mobile project variant. (The dedicated `voter-journey-mobile.spec.ts` still uses its own mobile device-descriptor project per the plan.)

### Claude's Discretion
- Exact seeded categorical filter to surface the select-all/none control (must exceed the option-count threshold — confirm against the filter-dialog component at build time).
- Which concrete routes/actions exercise `startPageview` / `startEvent` / `track` (one representative each), and the precise per-category expected subMatch values for the chosen candidate (derive deterministically from the answeredVoterPage answer set).
- The exact mobile device descriptor (`devices['Pixel 5']` vs explicit 390×844 matching visual-regression's config).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Master coverage plan (LOCKED — read first)
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` — operator-approved (2026-06-14) coverage map + build list. §EFLOW Coverage Map (verdicts), §Build List → EFLOW (Phase 121) blocks (spec paths, project wiring, seed delta, fixtures, semantic steps per requirement), §Extension-Scope Pins (exact net-new delta for EFLOW-01/04/08/09). This is the authoritative WHAT-to-build spec.

### Requirements
- `.planning/REQUIREMENTS.md` §EFLOW (EFLOW-01..11, with per-requirement NOTEs that the plan resolved)

### Fixtures already built (Phase 119 — reuse, do not rebuild)
- `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` — capture seam LOCKED to `window.umami.track`; documents the 3-part arming prerequisite (D-01) + `getTrackCalls()`.
- `tests/tests/fixtures/shared/theme.fixture.ts` — dark-mode toggle + `expectTheme()` reader for EFLOW-07.
- `tests/tests/fixtures/shared/navMenu.fixture.ts` — nav-menu drawer + item readers for EFLOW-09.

### Specs to extend / model against
- `tests/tests/specs/voter/voter-journey.spec.ts` — host for EFLOW-01 (filters ~997–1085), EFLOW-04 (subMatches ~724–730); also EFLOW-03/05 confirmed-covered evidence.
- `tests/tests/specs/perm/perm-localisation-positive.spec.ts` — host for EFLOW-06 (owns langSelector + locale machinery).
- `tests/tests/specs/candidate/candidate-journey.spec.ts` — host for EFLOW-09 candidate auth-state nav.
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — dark-mode contrast extension (EFLOW-07 NOTE).
- `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — leaf-project shape to mirror for new read-only specs (voter-dark-mode, voter-prefs-tracking, voter-journey-mobile).

### Tracking model
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts` — `track`/`startEvent`/`startPageview` differ by bundling/submission timing; all data routed via `track` at the boundary; `shouldTrack` gates emission.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `trackingIntercept`, `theme`, `navMenu` fixtures (Phase 119) — all three boundary/reader decisions are already settled and verified.
- `answeredVoterPage` / `locatedVoterPage` / `views.ts` voter root — viewport-agnostic, drive the same walk at mobile viewport for EFLOW-11.
- `langSelector` fixture — reused for EFLOW-06.
- Candidate page-objects (`candidateHomePage`, `candidateLoginPage`, `candidateLogoutButton`) — reused for EFLOW-09.

### Established Patterns
- A4 (extend, don't add): EFLOW-01/04 extend `voter-journey`; EFLOW-06 extends `perm-localisation-positive`; EFLOW-09 extends `candidate-journey`. Only EFLOW-07/08/11 are NEW specs.
- New leaf specs read `e2e/base` read-only with `dependencies: [data-setup-base]` and NO own setup/teardown (mirror `cold-entry-dataroot`); scoped `testMatch` keeps `voter-journey` from picking them up.
- 3× determinism standard is the per-spec gate.

### Integration Points
- D-01 adds one perm node + its data-setup dependency for `voter-prefs-tracking`.
- EFLOW-07 dark-mode contrast extension touches the a11y suite (cross-spec).

</code_context>

<specifics>
## Specific Ideas

All four open build-time pins resolved to the coverage-plan-recommended option (D-01..D-03 + EFLOW-09 host). No deviations from the approved plan — this phase executes the plan's EFLOW (Phase 121) build list as written.

</specifics>

<deferred>
## Deferred Ideas

- **EFLOW-02** (alliance card + member-orgs drawer) — deferred to Phase 130 (depends on UNBLK-06 alliance render, built Phase 129).
- **EFLOW-10 / -10b** (bank-auth) — Phase 122.

None outside phase scope surfaced during discussion.

</deferred>

---

*Phase: 121-e2e-specs-flow-coverage*
*Context gathered: 2026-06-16*
