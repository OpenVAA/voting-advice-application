# Phase 179 — UI Review

**Audited:** 2026-10-22
**Baseline:** 179-UI-SPEC.md (approved)
**Screenshots:** not captured (no dev server answered on 3000, 5173 or 8080; the stack must not be started for this audit). Code-only audit; nothing below was seen rendered.
**Interaction captures:** off (workflow.ui_interaction_capture is false)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | All 23 new keys exist in 7 locales and match the contract; only locale quality and one copy edge are unverified |
| 2. Visuals | 3/4 | One anchor per surface as specified; "Use another email address" on CI1 is a one-way switch; nothing seen rendered |
| 3. Color | 4/4 | No hardcoded colour, no accent on text or addresses; contrast is computed in the spec, not measured |
| 4. Typography | 4/4 | No size class written; only `font-bold` (legend, address) |
| 5. Spacing | 4/4 | Only T-shirt tokens; no numeric or arbitrary spacing class in any audited file |
| 6. Experience Design | 3/4 | States, loading, disabled-until-mount and failure paths are covered; recovery from the address switch and untested visual states are gaps |

**Overall: 21/24**

No BLOCKER found. All items are WARNING-level.

---

## Top 3 Priority Fixes

1. **CI1 "Use another email address" cannot be undone** — a user with a pending address who presses it loses the Send again / waiting-link view (`switched` is set once and never reset in `IdentityProviderGate.svelte`). A mis-press forces a new address or Log Out. Fix: add a "Keep this address" text button (or reset `switched`) in the switched state, reusing the `changeAddress` pattern, and keep the pending address visible above the form.
2. **No rendered verification of any new surface** — contrast (the spec's `secondary`/`primary` on `base-300` pass by a tenth), the 👍 hero, the nested type radio group in C's panel and CI2's three classes were never seen. Fix: when a stack is available, capture CI1 (V1-V5), CI2 (3 classes), C's provider panel and the home reminder at 375, 768 and 1440 px in light and dark, and confirm no overflow of the address (`[overflow-wrap:anywhere]`) at 375.
3. **Non-English copy for the 23 `contestantApp.identityProvider` keys is unreviewed** — key parity holds (23 keys in each of da, et, fi, fr, lb, sv; one value identical to English), but native review is not evidenced, and Swedish `common.login` ("Registrera dig") is a known mislabel the new views avoid but the neighbouring B button still carries. Fix: native-speaker pass on the new file per locale, and resolve `[U-23]`.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- `apps/frontend/messages/en/contestantApp.identityProvider.json` holds every contract string: titles "Complete your registration" / "You have already registered"; the three CI2 titles and sentences; "Enter your party’s name in {language}."; the address-in-use text; the failed-save text. Wording matches the spec; the cancelled class is calm and does not apologise.
- Catalogue parity: all seven locales hold 1087 message entries; the new file has 23 keys in each.
- CI1 uses `common.continue`, `common.logout`, `common.saving`, not `common.login`. No generic "Submit"/"OK" labels.
- Gap: `lead` in `IdentityProviderGate.svelte` shows `nameIntro` ("Enter your party’s name to continue.") for an unnamed party with a pending or proved address, but that variant has no title change; the title still reads "Complete your registration" even for a returning proved user only if the marker is absent. This matches the spec's `[U-05]`, so it is a note, not a defect.
- Unverified: locale quality (see fix 3).

### Pillar 2: Visuals (3/4)
- CI1: one `MainContent` frame, 👍 hero only for `arrival === 'created'`, `<dl>` for the address with a `small-label` caption, Continue as the `variant="main"` button and Log Out as `color="warning"`. Matches the contract's hierarchy.
- CI2: heading group with the app name above an `<h1>`, one main action per class, Return always present. `noRetry` puts `ContactSupport variant="main"` first and Try again as a plain button, as specified.
- C: type group is a native `fieldset`/`legend` with `radio radio-primary`, nothing chosen on arrival.
- Defect (WARNING): the address switch on CI1 is one-way (see fix 1).
- Not seen rendered; focal-point and spacing balance are inferred from markup.

### Pillar 3: Color (4/4)
- Grep for hex values, `text-primary`, `text-accent` and similar in the CI1 gate, CI2 page, C's page, the home and the settings page: no hits. Colour comes from `color="warning"`, `variant="main"`, `radio-primary` and the shared components, which is exactly the contract's reserved accent list.
- CI2 sets `bg-base-300` through `pageStyles.use`, as the contract states; CI1 takes the gate default.
- Contrast figures come from the spec's computed table, not from a measurement.

### Pillar 4: Typography (4/4)
- Across the three audited new files the only weight/size utility written is `font-bold` (C's legend). Addresses use `font-bold`; labels use the `small-label` class; info lines use `small-info`. No fifth size and no third weight.

### Pillar 5: Spacing (4/4)
- Only `gap-md`, `my-lg`, `my-md`, `mt-lg`, `mb-sm`, `gap-sm`, `min-h-touch` style tokens appear; no `gap-6`/`mt-16`/`p-[...]`. `[overflow-wrap:anywhere]` is a wrapping rule, not a spacing value. No `text-left`.

### Pillar 6: Experience Design (3/4)
- Loading: Continue uses `loading` + `loadingText`; it is natively `disabled` until `mounted`; "Send again" is `aria-disabled` with a countdown description and a polite status region.
- Error: name error is an `ErrorMessage` alert tied by `aria-describedby`; address-in-use goes to the address field via `showEmailError`; any other failure is an alert under the form with the typed values kept and focus restored.
- CI2 is server-mapped to a closed class set, falls back to `retry`, and hides Try again when the provider's mode is not offered (`providerOffered`). The route is in `pageviewRoutes.ts`; no legacy `preregister` source file remains.
- Test coverage of visual states is strong: `contestant-identity-provider.spec.ts` declares axe scans (light and dark twins) for the new-candidate, new-party, empty-submit, address-in-use, returning (none, proved, pending), home reminder and settings views, and `contestant-entry-scan.spec.ts` scans CI2 in cancelled, retry and noRetry. They were not run in this audit.
- Gaps: one-way address switch (fix 1); no destructive-action confirmation is needed (Log Out is non-destructive); nothing verified at runtime.

---

## Files Audited
- apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte
- apps/frontend/src/routes/contestant/register/identity-provider/error/+page.svelte (and +page.server.ts)
- apps/frontend/src/routes/contestant/register/+page.svelte (docstring and type group markup)
- apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte and settings/+page.svelte (pending reminder, grep level)
- apps/frontend/messages/*/contestantApp.identityProvider.json
- apps/frontend/src/lib/analytics/pageviewRoutes.ts
- tests/tests/specs/contestant/contestant-identity-provider.spec.ts, contestant-entry-scan.spec.ts (headers and scan entries)
