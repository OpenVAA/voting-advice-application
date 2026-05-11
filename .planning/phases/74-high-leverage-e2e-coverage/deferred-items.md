# Phase 74 — Deferred Items (out-of-scope discoveries)

Discoveries surfaced during execution of plans in Phase 74. Items here are out-of-scope for the current plan/phase per the executor SCOPE BOUNDARY rule.

## Plan 01 (E2E-01)

### `lang.<locale>` translation keys are unwired

**Discovered:** 2026-05-11 (Plan 01 execution)
**File:** `apps/frontend/src/lib/components/input/Input.svelte:392, 417`
**Symptom:** The per-locale label inside the multilingual translation surface is rendered with `t(assertTranslationKey(\`lang.${locale}\`))`. None of the seven `lang.<locale>` keys (`lang.en`, `lang.fi`, `lang.sv`, `lang.da`, `lang.et`, `lang.fr`, `lang.lb`) are registered in any of the per-locale translation files at `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/`, nor are they exposed via the `keys` array in `apps/frontend/src/lib/i18n/translations/index.ts:7-54`.

**Effect at runtime:** The translation surface renders literal text `"lang.fi"`, `"lang.sv"`, etc., as the per-locale labels. Accessible-name of the inner textbox is `"<openAnswerPrompt> lang.<locale>"` (e.g. `"Arguments lang.fi"`) — see Plan 01 error-context page snapshot.

**Why this is NOT a Plan 01 / Phase 74 concern:**
- Predates Phase 74 (not introduced by this plan's changes).
- Not in the plan-task scope of "add E2E spec" — fixing this requires translation-files work spanning seven locales plus the `keys` array registration in `apps/frontend/src/lib/i18n/translations/index.ts`.
- Plan 01's spec asserts the SURFACE contract (Button toggle, per-locale inputs become reachable, value persists across reload), which is observable irrespective of whether the per-locale LABEL is human-readable. The spec adapts its locator to the actual accessible name produced today.

**Recommended routing:** New `.planning/todos/pending/` entry at Phase 74 close: "Wire `lang.<locale>` translation keys for the multilingual input surface". Pair with Phase 78 CLEAN-04 (i18n wrapper tightening) since the work is i18n-internal.

### `staticSettings.supportedLocales` is unused by the input surface

**Discovered:** 2026-05-11 (Plan 01 execution)
**File:** Input.svelte uses `locales` from `getComponentContext()` which traces back to Paraglide's `locales` (`apps/frontend/src/lib/i18n/init.ts:42`), NOT to `staticSettings.supportedLocales` from `@openvaa/app-shared`.
**Symptom:** `staticSettings.ts:46-64` declares 4 locales (`en/fi/sv/da`) but the runtime renders 7 (`en/fi/sv/da/et/fr/lb`) because Paraglide is the source of truth.

**Why this is NOT a Plan 01 / Phase 74 concern:**
- Discovery is incidental — the spec doesn't care how many non-default locales exist, only that the surface renders correctly when more than one is present.
- The deferred single-locale path (CONTEXT D-04) becomes even more architecturally distant: a runtime-override would need to target Paraglide, not `staticSettings`.

**Recommended routing:** Surface in the Phase 74 close follow-up for the deferred single-locale variant (D-04). Re-scope the follow-up todo to reference Paraglide as the runtime source of truth.
