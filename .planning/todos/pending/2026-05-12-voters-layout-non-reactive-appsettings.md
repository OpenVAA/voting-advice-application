# (voters)/+layout.svelte non-reactive topBarSettings/popupQueue.push (Phase 77 P01 deferred → v2.10+)

**Filed:** 2026-05-12 at Phase 78 close (Plan 07 Task 5)
**Source:** Phase 77 P01 SUMMARY §"PRODUCT-GAP cells — surfaced not fixed" + Phase 78 P07 per RESEARCH Q3 + §"Phase 77 P01 Deferred-Cell Disposition Recommendation"
**Severity:** MEDIUM (product-gap, not blocker; 3 SETTINGS-01 wave A cells PASS-WITH-DEFERRAL — surfaces but does not block ship)
**Routed to:** v2.10+ a11y/UX milestone candidate

## Defect (production frontend)

Non-reactive read of `$appSettings` at component-mount causes 3 SETTINGS-01 wave A cells (`header.showFeedback`, `header.showHelp`, `notifications.voterApp`) to PASS-WITH-DEFERRAL — the test override never lands in DOM because the mount-time read captures static defaults BEFORE the runtime `$effect` merges page-data values.

### Affected sites

- `apps/frontend/src/routes/(voters)/+layout.svelte:65-69` — `topBarSettings.push(...)` fires in script body at mount; reads `$appSettings.header.showFeedback` / `$appSettings.header.showHelp` ONCE.
- `apps/frontend/src/routes/(voters)/+layout.svelte:43-50` — `onMount(() => popupQueue.push(...))` reads `$appSettings.notifications.voterApp?.show` ONCE.
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:74` — `appSettingsValue` initialized with static defaults.
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:94-100` — `$effect` merges `page.data.appSettingsData` AFTER mount.

### Race window

Mount → `topBarSettings.push` / `popupQueue.push` reads static defaults → `$effect` merges runtime values → DOM has already been painted with static-default-shaped Banner UI (no Feedback button when `header.showFeedback=false` in runtime override). Test override never lands.

## Recommended approach (v2.10+ phase)

1. Refactor `topBarSettings.push` + `onMount popupQueue.push` to react to `$appSettings` via `$effect`:
   ```ts
   $effect(() => {
     // Re-evaluate when $appSettings updates
     if ($appSettings.header.showFeedback) topBarSettings.push({ ... });
     if ($appSettings.header.showHelp) topBarSettings.push({ ... });
   });
   ```
2. OR gate Banner button rendering on `$appSettings.header.*` directly inside the Banner component (push into a derived store).
3. Estimated 30-60 LOC across:
   - `apps/frontend/src/routes/(voters)/+layout.svelte`
   - adjacent Banner / Popup components
   - new test cells in `candidate-settings.spec.ts` (or a new voter-settings extension) to validate the reactive behavior

## Cross-references

- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-01-SUMMARY.md` §"PRODUCT-GAP cells — surfaced not fixed"
- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-VERIFICATION.md` §"SETTINGS-01 — 10 wave A cells (7 PASS + 3 PASS-WITH-DEFERRAL)"
- `.planning/phases/78-cleanup-hygiene-phase/78-RESEARCH.md` §"Phase 77 P01 Deferred-Cell Disposition Recommendation"
- `.planning/phases/78-cleanup-hygiene-phase/78-VERIFICATION.md` §"Out-of-Scope Items (Filed as Follow-up Todos)" #2
- `apps/frontend/CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — adjacent pattern (different defect class but same Svelte 5 reactivity neighborhood)
