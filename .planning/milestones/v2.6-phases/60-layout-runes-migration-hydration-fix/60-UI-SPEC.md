---
phase: 60
slug: layout-runes-migration-hydration-fix
status: draft
shadcn_initialized: false
preset: not applicable (SvelteKit + Tailwind + daisyUI)
created: 2026-04-24
---

# Phase 60 — UI Design Contract

> Refactor-only contract. Phase 60 is a Svelte 5 hydration bug fix + runes-mode migration for `+layout.svelte`. No new visual design is introduced — this spec exists to lock the **existing** visual states the refactor must preserve so the executor does not accidentally regress UX while swapping the `$effect + Promise.all(...).then(...)` pattern for `$derived`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (SvelteKit is not a shadcn target; preset automation N/A) |
| Preset | not applicable |
| Component library | daisyUI (Tailwind plugin) — already installed, no changes this phase |
| Icon library | HeroEmoji (in-project text-emoji renderer) — no changes this phase |
| Font | `Inter` via Google Fonts (from `staticSettings.font.url`) — no changes this phase |

**Rationale:** This phase does not add, remove, or restyle any component. It rewires the reactivity pattern that decides which of 4 pre-existing layout branches renders. All visual tokens are inherited from `packages/app-shared/src/settings/staticSettings.ts` + `apps/frontend/src/app.css` + `apps/frontend/src/tailwind-theme.css`.

---

## Spacing Scale

N/A — refactor preserves existing. Existing spacing is daisyUI + Tailwind default scale (multiples of 4 via Tailwind) and in-project semantic tokens (`gap-sm`, `gap-md`, `gap-lg`, `py-lg`, `mb-lg`, `mb-md`, `mt-sm`, etc.) already applied in the Loading / ErrorMessage / MaintenancePage / TermsOfUseForm components. Executor must not change any spacing class on layout-state components.

Exceptions: none — phase changes no spacing.

---

## Typography

N/A — refactor preserves existing. Body/heading sizing and weights inherit from the daisyUI theme + `Inter` font family. Typography on the four layout states (loading / error / maintenance / terms) already ships correctly on `main` and must render unchanged after the refactor.

---

## Color

N/A — refactor preserves existing. 60/30/10 split is governed by `staticSettings.colors.light` + `colors.dark` (already in production):

- `base-100` (#ffffff) — dominant surface
- `base-200` / `base-300` (#e8f5f6 / #d1ebee) — secondary (full-viewport state backgrounds for Loading, ErrorMessage, MaintenancePage use `bg-base-300 h-dvh`)
- `primary` (#2546a8) / `accent` (#0a716b) — reserved for interactive elements (not touched this phase)
- `warning` (#a82525) — reserved for destructive actions (already applied to the TermsOfUseForm `logout` button via `<Button color="warning">`)

Accent reserved for: no changes this phase. Executor must not recolor layout-state backgrounds, headings, or buttons.

---

## Copywriting Contract

All copy below is **already in the i18n catalog** (`apps/frontend/src/lib/i18n/translations/en/`) and is rendered by existing components. The refactor must not change any of these strings. This table exists to document the user-visible contract the layout branches must satisfy, so the auditor can verify nothing regressed.

| Element | Copy (i18n key → rendered string) | Rendered By |
|---------|------------------------------------|-------------|
| Loading indicator (aria label) | `common.loading` → `"Loading…"` | `Loading` component (shown while `!ready` in root, while `layoutState === 'loading'` in protected) |
| Error state heading | `error.default` → `"Something went wrong, sorry!"` | `ErrorMessage` component (shown when any loader result is invalid) |
| Error state body | `error.content` → `"<p>We're very sorry for the inconvenience. You can try to go back and reload the page…</p><p>If you still experience the problem, please send an email to first.last@openvaa.org…</p>"` | `ErrorMessage` component |
| Maintenance page title | `maintenance.title` → `"Under Maintenance"` | `MaintenancePage` component (shown when `appSettingsData.access.underMaintenance === true`) |
| Maintenance page body | `dynamic.maintenance.content` (dynamic, per-instance) | `MaintenancePage` component |
| Terms-of-use page title | `dynamic.candidateAppPrivacy.consent.title` | `TermsOfUseForm` inside `MainContent` (shown when `layoutState === 'terms'`) |
| Terms-of-use accept label | `dynamic.candidateAppPrivacy.consent.acceptLabel` | `TermsOfUseForm` checkbox |
| Terms-of-use primary CTA | `common.continue` → `"Continue"` | `Button variant="main"` — disabled until `termsAccepted === true`, submits `userData.setTermsOfUseAccepted(...)` |
| Terms-of-use secondary (destructive) action | `common.logout` → `"Log out"` (with `color="warning"`) | `Button color="warning"` — triggers `logout()` and returns user to auth |
| Popup overlay | N/A — each popup item supplies its own `component` + `props` + `onClose`; copy is per-popup | `PopupRenderer` or inline `{#if currentItem}...{/if}` (removal attempt per D-08) |

**Destructive actions in this phase:**
- Terms-of-use "Log out" button — color=`warning`; no confirmation dialog (existing behaviour; executor does not add one). Clicking immediately calls `logout()` → returns to auth.
- No other destructive actions introduced or modified.

---

## Layout-State Contract (phase-specific)

This section replaces what would be a "component inventory" in a new-UI phase. It documents the exact visual/interaction contract each rendered branch must satisfy **after** the refactor. The checker and auditor use this table to verify parity.

### Root layout (`apps/frontend/src/routes/+layout.svelte`)

Branches — mutually exclusive, `{#if ... :else if ... :else}` chain:

| Branch condition (post-refactor `$derived`) | Rendered output | Interaction contract |
|----------------------------------------------|-----------------|----------------------|
| `error` is truthy | `<ErrorMessage class="bg-base-300 h-dvh" />` | Static page; no navigation away; user's only recourse is reload per `error.content` copy |
| `!error && !ready` | `<Loading class="bg-base-300 h-dvh" />` | Brief; resolves to `ready` branch after first `$derived` evaluation on hydrated `data` prop (post-refactor should flip on the same tick, not after a microtask) |
| `!error && ready && underMaintenance` | `<MaintenancePage />` | Static page; `maintenance_shown` analytics event fires once |
| `!error && ready && !underMaintenance` | `{@render children()}` + `<FeedbackModal bind:this={feedbackModalRef} />` + conditional `<UmamiAnalytics>` | Normal app; child routes render; feedback modal ref wired for `openFeedbackModal` store |
| (Always, outside the branch chain) | `<PopupRenderer {popupQueue} />` — OR inline `{#if currentItem}<svelte:component ... />{/if}` if D-08 removal succeeds | Popup overlay above all other content; dismissed via `onClose` → `popupQueue.shift()` |

**Timing contract (LAYOUT-02 UX promise):**

- Fresh full-page-load to a protected candidate route via `page.goto(registrationLink)` must render the final branch (`children` or `terms`) within the first hydration pass — no stuck Loading state.
- Transition from `<Loading>` to ready branch must occur **without a visible flicker** of the error or maintenance branch. Post-refactor, because validation is `$derived` off already-resolved data, this should be synchronous at hydration time (SSR and client first paint agree on the final branch).
- No new animation or transition is added between branches. Existing daisyUI `loading-spinner` animation on the Loading state is preserved.

### Protected candidate layout (`apps/frontend/src/routes/candidate/(protected)/+layout.svelte`)

Branches — mutually exclusive, driven by existing `layoutState` enum (retained per RESEARCH.md recommendation as `$derived<'loading' | 'error' | 'terms' | 'ready'>`):

| Branch condition | Rendered output | Interaction contract |
|------------------|-----------------|----------------------|
| `layoutState === 'error'` | `<ErrorMessage class="bg-base-300" />` | Static; no recovery path from this layout (parent root handles reload suggestion) |
| `layoutState === 'loading'` | `<Loading />` | Should be brief or unobserved on full page load post-refactor; pre-refactor bug left users stuck here indefinitely |
| `layoutState === 'terms'` | `<MainContent title={t('dynamic.candidateAppPrivacy.consent.title')}>` wrapping `<HeroEmoji>` (hero snippet) + `<TermsOfUseForm bind:termsAccepted />` + primaryActions snippet with `<Button variant="main" text={t('common.continue')}>` (disabled until `termsAccepted`) and `<Button color="warning" text={t('common.logout')}>` | Submit: `handleSubmit()` → `userData.setTermsOfUseAccepted(new Date().toJSON())` + `userData.save()` + `layoutState = 'ready'`. Cancel: `handleCancel()` → `logout()`. `status` state cycles `idle → loading → success/idle` and drives button `loading` prop. |
| `layoutState === 'ready'` | `{@render children()}` | Normal candidate dashboard; downstream routes (`candidate/(protected)/dashboard/*` etc.) render |

**Hydration parity contract (LAYOUT-02 regression gate):**

- On a full page load with valid SSR-resolved data and a candidate whose `termsOfUseAccepted` is truthy, the user must see the `ready` branch — never a permanent `loading` branch. This is the condition the 2 blocked E2E tests (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) assert.
- On a full page load with valid data and an unaccepted-terms candidate, the user must see the `terms` branch with a functional `Continue` / `Log out` pair.
- Client-side navigation to the same routes (which already works on `main`) must continue to work — no regression.

### Popup overlay (LAYOUT-03 empirical-removal path)

Regardless of whether `PopupRenderer` is retained or removed in execution:

| Trigger | Expected UX |
|---------|-------------|
| `popupQueue.push({ component, props, onClose })` called from anywhere (including from `setTimeout`) | The popup's `component` renders as an overlay within 1 tick; its `onClose` handler fires when the component calls back; `popupQueue.shift()` removes it and the next item (if any) appears |
| `popupQueue` is empty | Nothing rendered for the popup slot |

**LAYOUT-03 regression gate (D-09 test):** A full-page-load scenario where `popupQueue.push(...)` is invoked from inside a `setTimeout(..., N)` after hydration must still surface the popup. This is the exact reactivity path the v2.1 `PopupRenderer` wrapper was introduced to guard. If inline rendering in the migrated root layout passes this test, `PopupRenderer` is deleted. If it fails, `PopupRenderer` is retained with an in-code rationale per D-10.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| N/A | No registry blocks added or modified this phase | not applicable |

No third-party component blocks are pulled in. All components referenced (`Loading`, `ErrorMessage`, `MaintenancePage`, `TermsOfUseForm`, `MainContent`, `Button`, `HeroEmoji`, `FeedbackModal`, `PopupRenderer`) are first-party, already in the repo, and unchanged by this phase.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all four layout-state strings documented, all reference existing i18n keys, no new copy introduced
- [ ] Dimension 2 Visuals: PASS — layout-state contract table enumerates all four root branches and all four protected branches; each mapped to the existing component that renders it
- [ ] Dimension 3 Color: PASS — N/A (refactor preserves existing); `bg-base-300 h-dvh` on Loading/Error preserved; `warning` on logout button preserved
- [ ] Dimension 4 Typography: PASS — N/A (refactor preserves existing)
- [ ] Dimension 5 Spacing: PASS — N/A (refactor preserves existing)
- [ ] Dimension 6 Registry Safety: PASS — no registry blocks introduced

**Approval:** pending
