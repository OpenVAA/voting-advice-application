# Phase 178: Sign-in, Email & Code Registration - Pattern Map

**Mapped:** 2026-10-11
**Tree read at:** `ea9cb0483` (Phases 170–176 and 174.1 executed; Phase 177 planned, not executed; Phase 177.1 empty)
**Files analyzed:** 96 new or modified files, in 14 families
**Analogs found:** 91 / 96

## How to read this file

- **Code is cited by content anchor** — a path and a quoted distinctive string or symbol — never by line number. Re-derive every anchor at plan time: Phase 177 edits several of the same files.
- Frontend paths are relative to `apps/frontend/src/` unless they start with `apps/`; `schema/`, `functions/` and `tests/database/` are relative to `apps/supabase/supabase/`; `ENTRY/` abbreviates `routes/contestant/`.
- **"structure only"** beside an analog means: copy its shape, imports and control flow, and write every comment anew. The analog's own comments carry historical narrative, plan or decision ids, or stale names, which `CLAUDE.md` § *Comment Hygiene* forbids in new or touched comments.
- **"177: NN"** beside a file means the file is also in the `files_modified` of that Phase 177 plan (planned, not on the tree). Such a file is edited on the tree as 177 leaves it. The list is from `178-RESEARCH.md` § *Phase 177 overlap*; re-derive it.
- Names of new routes, keys, components, functions and test ids are the proposals of `178-RESEARCH.md` and `178-UI-SPEC.md`. Where the two disagree, both are given and the item is in § *For the planner to resolve*.
- Every analog named below was checked with `git ls-files`: all are tracked source. None is a gitignored mirror.
- Nothing was run for this file but `git`, `grep`, `wc` and file reads. No stack, server or spec was started.

## File Classification

### 1. Gates — F as a gate view (D-03, D-06, D-08)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `lib/contestant/gates/gates.ts` (mod) | config (frozen list) | transform | itself — the `termsOfUse` entry | exact |
| `lib/contestant/gates/gateViews.ts` (mod) | config | transform | itself — `termsOfUse: TermsOfUseGate` | exact |
| `lib/contestant/gates/SetPasswordGate.svelte` (new) | component (gate view) | request-response | `lib/contestant/gates/TermsOfUseGate.svelte` | exact |
| `lib/contestant/gates/gates.test.ts` (mod) | test | — | itself | exact |
| `ENTRY/(protected)/+layout.server.ts` (mod) | route load | request-response | itself — stages 2 and 3 | exact |
| `ENTRY/(protected)/layout.server.test.ts` (mod) | test | — | itself | exact |
| `ENTRY/(protected)/setPasswordLayout.svelte.test.ts` (new) | test | — | `ENTRY/(protected)/termsOfUseLayout.svelte.test.ts` | exact |
| `ENTRY/(protected)/+layout.svelte` | — | — | **not modified**: the focus move is built ("cancelPendingFocus = focusNavigationTarget();") | — |

### 2. Entry-flow routes — A, B, C, D1, D2, E (D-02, D-09..D-12, D-19, D-20)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `ENTRY/login/+page.svelte` (rewrite → A) | route page | request-response | itself — the frame, the poster, the secondary links | role-match, **structure only** |
| `ENTRY/login/+page.server.ts` (delete after B works) | route action | — | moves to B | — |
| `ENTRY/login/email/+page.svelte` (new → B) | route page (form) | request-response | `ENTRY/login/+page.svelte` — the `use:enhance` block | exact, **structure only** |
| `ENTRY/login/email/+page.server.ts` (new → B's action) | route action | request-response | `ENTRY/login/+page.server.ts` | exact |
| `ENTRY/register/+layout.server.ts` (rewrite) | route guard | request-response | itself | exact, **structure only** |
| `ENTRY/register/layout.server.test.ts` (rewrite) | test | — | itself | exact |
| `ENTRY/register/+page.svelte` (rewrite → C) | route page (form) | request-response | `ENTRY/forgot-password/+page.svelte` (frame + script-submitted form) | role-match |
| `ENTRY/register/email/+page.svelte` (new → D1) | route page (form) | request-response | `ENTRY/forgot-password/+page.svelte` | role-match |
| `ENTRY/register/sign-in/+page.svelte` (new → D2) | route page (form) | request-response | B's page | exact |
| `ENTRY/register/sign-in/+page.server.ts` (new → D2's action) | route action | request-response | `ENTRY/login/+page.server.ts` + `lib/auth/invitationCodeLogin.ts` | exact |
| `ENTRY/email-sent/+page.svelte` (new → E) | route page | event-driven (timer) | `lib/contestant/components/nothingToEdit/NothingToEdit.svelte` (frame, `dl`) | role-match |
| `ENTRY/register/+layout.svelte`, `+page.ts`, `registrationCodeGuard.ts`, `registrationCodeGuard.test.ts`, `password/+page.svelte` (delete) | — | — | removals (D-19) | — |
| page tests beside A, B, C, D1, D2, E (new) | test | — | `ENTRY/(protected)/page.svelte.test.ts`, `termsOfUseLayout.svelte.test.ts` | role-match |

### 3. Forgot-password and password-reset (D-13, D-18)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `ENTRY/forgot-password/+page.svelte` (mod) | route page (form) | request-response | itself | exact |
| `ENTRY/password-reset/+page.svelte` (mod) | route page (form) | request-response | itself + `TermsOfUseGate.svelte` | exact, **structure only** |
| `ENTRY/password-reset/+page.server.ts` (new, if the planner takes research OQ-12) | route load | request-response | `ENTRY/(protected)/+layout.server.ts` stage 1 | role-match |
| `routes/api/auth/callback/+server.ts` (mod) | controller | request-response | itself | exact |
| `routes/api/auth/callback/server.test.ts` (mod) | test | — | itself | exact |

### 4. Shared components (D-14, D-15)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `lib/contestant/components/emailField/{EmailField.svelte,EmailField.type.ts,index.ts,EmailField.svelte.test.ts}` (new) | component | transform | `lib/contestant/components/passwordField/` (the `focus()` export) + `contactSupport/` (the four-file shape) | role-match |
| `lib/contestant/components/emailEntry/…` (new) | component | transform | `lib/contestant/components/passwordSetter/` (two fields, a comparison, exports) | role-match |
| `lib/contestant/components/passwordSignIn/…` (new) | component | transform | `passwordSetter/` (wraps `PasswordField`) | role-match |
| `lib/contestant/components/registrationCodeField/…` (new) | component | transform | `passwordField/` | role-match |
| `lib/contestant/components/registrationModeSelector/…` (new) | component | event-driven | **no close analog** (see § *No Analog Found*); four-file shape from `contactSupport/` | partial |
| `lib/contestant/components/emailSentPanel/…` (new) | component | event-driven (timer, live region) | `nothingToEdit/NothingToEdit.svelte` (`dl`) + `contactSupport/` | partial |
| `lib/contestant/components/passwordField/PasswordField.svelte`, `.type.ts` (mod) | component | transform | itself | exact, **structure only** |
| `lib/contestant/components/passwordSetter/PasswordSetter.svelte`, `.type.ts`, `.svelte.test.ts` (mod) | component | transform | itself | exact, **structure only** |
| `lib/components/button/Button.type.ts` (mod, `form`) | type | — | itself — "formaction?: string \| null;" | exact |
| `lib/dynamic-components/navigation/contestant/ContestantNav.svelte` (mod) | component | request-response | itself — `canRegisterWithCode` | exact |
| `lib/contestant/components/README.md` (mod, six rows) | docs | — | itself | exact |
| a shared "list of offered modes" function (new; home is the planner's — `lib/contestant/utils/` or `packages/app-shared/src/settings/contestantAppConfig.ts`) | utility | transform | `lib/contestant/utils/contestantAppName.ts` + its `.test.ts` | role-match |
| a shared email-syntax rule (new, if UI-SPEC S1 is taken) | utility | transform | `lib/contestant/utils/nameRule.ts` + `.test.ts` | role-match |

### 5. Routes, gate table, context, writer contract

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `lib/routes/route.ts` (mod; **177: 15**) | config | — | itself — "ContestantAppLogin: \`${CONTESTANT}/login\`," | exact |
| `lib/routes/appGates.ts` (mod) | config (frozen table) | request-response | itself | exact, **structure only** |
| `lib/routes/appGates.test.ts`, `routeConsistency.test.ts` (mod) | test | — | themselves | exact |
| `hooks.server.ts` (mod) | middleware | request-response | itself — "routeId === ROUTE[gate.loginRoute]" | exact |
| `lib/contestant/utils/loginError.ts` (mod, `authError`) | utility | transform | itself | exact |
| `lib/contexts/contestant/contestantContext.svelte.ts`, `.type.ts`, `.svelte.test.ts` (mod; **177: 15, 19**) | store | event-driven | itself — `#newUserEmail` | exact, **structure only** |
| `lib/contexts/auth/authContext.svelte.ts`, `.type.ts`, `.svelte.test.ts` and the Admin context that forwards it (mod) | store | — | themselves | exact |
| `lib/api/base/dataWriter.type.ts`, `universalDataWriter.ts` (mod; **177: 09**) | model (contract) | — | themselves — `requestSignInLink` | exact |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`, `.test.ts`, `.integration.test.ts` (mod; **177: 09**) | service (adapter) | request-response | itself — `#accountAccess`, `_requestSignInLink` | exact |
| `lib/api/adapters/supabase/utils/invitationAccess.ts` (mod, the recovery answer's parser) | utility | transform | itself — `parseSignInLinkRequest` | exact |
| `lib/api/adapters/supabase/utils/userEntities.ts`, `.test.ts` (mod, `password_set`) | utility | transform | itself | exact |
| `lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (mod, J5 only) | service | request-response | itself — "Place the three values `contestant_app_public_config` answers" | exact |
| `packages/app-shared/src/settings/contestantAppConfig.ts` (mod, docblock D-05) | utility | — | itself | exact |

### 6. Edge Function — the recovery operation and mail (D-13, D-16)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `functions/account-access/contract.ts`, `contract.test.ts` (mod) | model (wire contract) | request-response | itself — the `'request-link'` branch of `parseAccountAccessRequest` | exact |
| `functions/account-access/index.ts` (mod) | controller | request-response | itself — `issueInBackground`, the `request-link` branch of `Deno.serve` | exact |
| `functions/account-access/linkIssue.ts`, `linkIssue.test.ts` (mod) | service | event-driven | itself — `attempt`, `issueSignInLink` | exact |
| `functions/account-access/signInLink.ts`, `signInLink.test.ts` (mod, `type`) | utility | transform | itself — `buildSignInLink` | exact |
| `functions/account-access/mailTemplates.ts`, `mailTemplates.test.ts` (mod) | config (templates) | transform | itself — `template(…)`, `SIGN_IN_MAIL_TEMPLATES` | exact |
| `functions/account-access/flowConformance.test.ts` (mod) | test (source-reading) | — | itself | exact |

### 7. Schema and pgTAP (D-05, D-06, J5, J6)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `schema/301-auth-functions.sql` (mod; **177: 05, 07**) — `private.caller_password_set`, the relocated `private.user_password_set`, the two matrix readers | migration (source) | CRUD | `private.caller_entity_ids` in the same file | exact |
| `schema/503-entity-rpcs.sql` (mod; **177: 06, 07**) — `get_user_entities` | migration (source) | CRUD | itself | exact |
| `schema/506-invitation-rpcs.sql` (mod; 177.1 edits it too) — the matrix condition in `invitation_code_status`, `invitation_link_request`, `claim_invitations`; the recovery eligibility function | migration (source) | CRUD | `invitation_link_request` in the same file | exact |
| `schema/106-app-settings.sql` (mod, J5 only) | migration (source) | CRUD | itself — `contestant_app_public_config` | exact |
| `migrations/00001_initial_schema.sql` (regenerated; **177: 02–07**) | migration | — | generated | — |
| `packages/supabase-types/src/database.ts` (regenerated; **177: 02–07**) | generated | — | generated | — |
| `tests/database/36-entity-identity.test.sql` (mod, key set) | test | — | itself | exact |
| `tests/database/39-invitations.test.sql` (mod: a matrix in its setup; new sections) | test | — | itself — "Section 14: password_set", "Section 17: who may be mailed" | exact |
| `tests/database/38-contestant-app-public-config.test.sql` (mod, J5 only) | test | — | itself | exact |
| `tests/database/45-registration-mode-matrix.test.sql` (new; 45 assumes 177's 43 and 44) | test (truth table) | — | `38-contestant-app-public-config.test.sql` (preamble, stored-shape fixtures) | role-match |
| `packages/dev-seed/tests/registrationModeMatrixParity.test.ts` (new) | test (cross-artifact) | file-I/O | `packages/dev-seed/tests/rpcNullabilityGate.test.ts` | role-match |

### 8. Auth configuration (D-17, J6)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `apps/supabase/supabase/config.toml` (mod) | config | — | itself — "minimum_password_length = 6"; "[auth.hook.custom_access_token]" for J6 | exact |
| `scripts/assert-auth-signup-closed.mjs` (mod) | utility (gate) | file-I/O | itself — `REQUIRED`, `CASES`, `selfTest` | exact |

### 9. Messages (seven locales)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.emailSent.json` (new namespace) | config | — | `apps/frontend/messages/en/contestantApp.nothingToEdit.json`; plural form from `contestantApp.home.json` `incompleteCount` | exact |
| `…/contestantApp.login.json`, `.register.json`, `.resetPassword.json`, `.setPassword.json`, `common.json` (mod) | config | — | themselves | exact |
| `…/contestantApp.common.json` (mod; **177: 12**) | config | — | itself | exact |
| `lib/types/generated/translationKey.ts` (regenerated; **177: 12**) | generated | — | generated | — |

### 10. E2E — fixtures, helpers, setups

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts` (mod → B, plus A's steps) | test fixture | — | itself | exact |
| `tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts` (new) | test fixture | — | `contestantLoginPage.fixture.ts` | exact |
| `tests/tests/fixtures/contestant/contestantEmailSentPage.fixture.ts` (new) | test fixture | — | `contestantTermsOfUsePage.fixture.ts` | role-match, **structure only** |
| `tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts` (new) | test fixture | — | `contestantTermsOfUsePage.fixture.ts` | exact, **structure only** |
| `tests/tests/fixtures/contestant/contestantPasswordSetter.fixture.ts`, `contestantForgotPasswordPage.fixture.ts` (mod) | test fixture | — | themselves | exact |
| composition roots for the new specs (new, e.g. `fixtures/contestant/contestant-registration.ts`) | test fixture | — | `tests/tests/fixtures/contestant/invitation-landing.ts` | exact |
| `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (mod: recovery link, passwordless user) | test fixture | — | itself — `signInLinkToOpen`, `askForLink`, `expectNothingSent` | exact |
| `tests/tests/fixtures/shared/emailBucket.fixture.ts` (mod: delete `toCallbackUrl`) | test fixture | — | — | — |
| `tests/tests/utils/mailedLink.ts`, `mailedLink.test.ts` (mod: recovery type) | test utility | transform | itself — `assertSignInLinkShape` | exact |
| `tests/tests/utils/testIds.ts` (mod; **177: 11**) | config | — | itself | exact |
| `tests/tests/utils/supabaseAdminClient.ts` (mod: drop the `resetPasswordForEmail` path; a passwordless-user step) | test utility | CRUD | itself — `inviteByEmail`, `forceRegisterUser` | exact |
| `tests/tests/utils/contestantAxeScan.ts` (read; mod only if `CONTESTANT_LOGIN_URL` must change) | test utility | — | itself | — |
| `tests/tests/setup/shared/registerAndStoreSession.ts` (mod) | test setup | — | itself | exact |
| `tests/tests/setup/perm/{perm-answers-locked,perm-disable-allow-open,perm-hide-hero,perm-question-video}.setup.ts` (mod: their own `waitForLoginForm`) | test setup | — | `registerAndStoreSession.ts` | exact |
| setup / teardown pair for the new specs and for the passwordless stored session (new, e.g. `tests/tests/setup/contestant/registration.setup.ts`, `.teardown.ts`) | test setup | CRUD | `tests/tests/setup/contestant/entity-selection.setup.ts`, `.teardown.ts` | exact |
| `tests/playwright.config.ts` (mod; **177: 10**) | config | — | itself — the `contestant-entity-selection` trio and the `invitation-landing` leaf | exact |

### 11. E2E — specs

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| email-registration spec, candidate (new, `tests/tests/specs/contestant/`) | test | — | `invitation-landing.spec.ts` | exact |
| code-registration spec, organization (new) | test | — | `invitation-landing.spec.ts` + `invitation-contract.spec.ts` | exact |
| forgot-password / FIX-01 case (new, or in the journey) | test | — | `invitation-landing.spec.ts` (link opened as received) | exact |
| `tests/tests/specs/contestant/contestant-entry-scan.spec.ts` (new, UI-SPEC U-26) | test (axe) | — | the `loginScan` cases of `perm-closed-project.spec.ts` | exact, **structure only** |
| `tests/tests/specs/a11y/contestant-a11y.spec.ts` (mod; **177: 19**) | test (axe) | — | itself — the `contestant-terms-gate` entry | exact |
| `tests/tests/specs/perm/perm-closed-project.spec.ts` (mod) | test | — | itself | exact, **structure only** |
| `tests/tests/specs/contestant/contestant-journey.spec.ts` (mod; read by 177's closing runs) | test | — | itself | exact |
| `invitation-landing.spec.ts`, `invitation-contract.spec.ts`, `perm-answers-locked.spec.ts`, `perm-access-disable.spec.ts`, `fixtures/contestant/contestant-entity-selection.ts`, `contestantLogoutButton.fixture.ts` (mod) | test | — | themselves | exact |
| `scripts/assert-a11y-scan-wiring.mjs` (mod; **177: 10**) | utility (gate) | file-I/O | itself — `CLOSED_PROJECT_SPEC` | exact |

### 12. Seed data and its pins (D-21, J3)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `packages/dev-seed/src/templates/e2e/base.ts` (mod, only if the organization row is widened; **177: 02**) | config (template) | — | itself — "entityTypes: ['candidate', 'organization']," | exact |
| `packages/dev-seed/tests/templates/base-app-settings.test.ts`, `built-in-templates-contestant-app.test.ts` (mod with it; the second is **177: 10**) | test (pin) | — | themselves | exact |
| a perm template + setup + teardown for the organization code spec (new, only if the base row is **not** widened) | config + test setup | — | `packages/dev-seed/src/templates/e2e/perm/perm-closed-project.ts`, `tests/tests/setup/perm/perm-closed-project.setup.ts` | exact, **structure only** |

### 13. Phase drivers (in the phase directory; exempt from comment hygiene)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `178-gates.sh` | utility (driver) | batch | `.planning/phases/176-contestant-home-task-state-nominations-view/176-gates.sh` | exact |
| `178-e2e.sh` | utility (driver) | batch | `…/176-e2e.sh` | exact |
| `178-verdict.mjs` | utility (verdict) | file-I/O | `…/176-verdict.mjs` | exact |
| `178-bankauth.sh` (D-24 (i)) | utility (driver) | batch | `.planning/phases/174-invitations-grants-defined-in-advance/174-bankauth.sh` | exact |
| `178-probe.mjs` (research Wave 0, rows P1–P7) | utility (probe) | request-response | `…/174-fn-probe.mjs`, `174-stack-probe.sh` | exact |
| `178-NN-PLAN.md` | plan | — | `.planning/phases/177-define-nominations/177-15-PLAN.md` (**plan form only**) | exact |

### 14. Docs (O-8)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `apps/frontend/src/routes/contestant/README.md`, `apps/supabase/README.md` (mod; **177: 21**) | docs | — | themselves | exact |
| `apps/docs/src/routes/(content)/developers-guide/{candidate-user-management,contestant-app,backend,deployment}/…` (mod; **177: 21**) | docs | — | themselves | exact |
| `.claude/skills/components/context-reactivity.md`, `.claude/skills/database/*` (mod; **177: 21**) | docs | — | themselves | exact |
| `CLAUDE.md` | docs | — | quoted in the closing summary, not edited by an executor (O-8) | — |

## Pattern Assignments

### `lib/contestant/gates/gates.ts`, `gateViews.ts` (config, frozen list)

**Analog:** themselves. The whole pattern is one entry, one id, one view.

**The id type and the entry** — anchor `export type ContestantGateId = 'termsOfUse';` and `export const CONTESTANT_GATES`:

```typescript
export type ContestantGateId = 'termsOfUse';

export const CONTESTANT_GATES: ReadonlyArray<ContestantGate> = Object.freeze([
  Object.freeze({
    id: 'termsOfUse',
    // Any stored acceptance counts: the value is the time the database stamped, and its presence is the acceptance.
    isNeeded: (user: BasicUserData) => user.termsOfUseAccepted == null
  })
]);
```

**The view record** — anchor `export const GATE_VIEWS: Readonly<Record<ContestantGateId, Component>>`:

```typescript
export const GATE_VIEWS: Readonly<Record<ContestantGateId, Component>> = Object.freeze({
  termsOfUse: TermsOfUseGate
});
```

**What to copy:** prepend `{ id: 'setPassword', isNeeded }` as a frozen entry; add the member to `ContestantGateId`; add the view to `GATE_VIEWS` (the record is keyed by the id type, so an id without a view fails the type check). Keep the module free of Svelte imports and of any mutable binding: its header states "The array and its entries are frozen. The server load imports this module".

**What differs:** the predicate's parameter type. Today it is `BasicUserData`; `178-RESEARCH.md` § J1 prescribes `BasicUserData & { passwordSet: boolean }` so that a caller that did not ask for the fact cannot call `firstNeededGate`, and the predicate is `user.passwordSet === false`. `gates.test.ts` holds "holds exactly the terms-of-use gate" and "is frozen, and a write to it throws": the first becomes a two-gate order assertion, the second is copied per entry.

---

### `lib/contestant/gates/SetPasswordGate.svelte` (component, gate view)

**Analog:** `lib/contestant/gates/TermsOfUseGate.svelte`

**Imports** — anchor `import { invalidateAll } from '$app/navigation';`:

```svelte
  import { log } from '@openvaa/app-shared';
  import { invalidateAll } from '$app/navigation';
  import { TermsOfUseForm } from '$contestant/components/termsOfUse';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getContestantContext } from '$lib/contexts/contestant/contestantContext.svelte';
```

**Core pattern: write in the browser, then rerun the loads** — anchor `await invalidateAll();`:

```svelte
  const { t, logout, acceptTermsOfUse } = getContestantContext();

  let status = $state<ActionStatus>('idle');

  async function handleSubmit() {
    if (!termsAccepted) return;
    status = 'loading';
    try {
      const result = await acceptTermsOfUse();
      if (result?.type !== 'success') throw new Error('The terms-of-use acceptance was not recorded.');
      // Awaited so that Continue keeps its loading state until the page has its new data. Only the rerun load, reading the stored acceptance, removes this view.
      await invalidateAll();
      status = 'idle';
    } catch (error) {
      log.error('Failed to record the terms-of-use acceptance', { err: error });
      status = 'error';
    }
  }

  async function handleLogout() {
    status = 'loading';
    await logout();
    status = 'idle';
  }
```

**Frame and actions** — anchor `<Button color="warning" text={t('common.logout')}`:

```svelte
<MainContent title={t('dynamic.contestantAppPrivacy.consent.title')}>
  …
  {#if status === 'error'}
    <div role="alert" data-testid="tou-save-error" class="text-error my-md text-center">
      {t('contestantApp.error.saveFailed')}
    </div>
  {/if}
  {#snippet primaryActions()}
    <Button text={t('common.continue')} variant="main" disabled={!termsAccepted}
      loading={status === 'loading'} onclick={handleSubmit} data-testid="terms-of-use-submit" />
    <Button color="warning" text={t('common.logout')} loading={status === 'loading'} onclick={handleLogout} />
  {/snippet}
</MainContent>
```

**What differs for F:**
- `setPassword` in place of `acceptTermsOfUse`; `t`, `logout`, `setPassword` are stable references and may be destructured. `user` (for the address) is a reactive accessor: read `contestantCtx.user?.email`, as `NothingToEdit.svelte` does — anchor `{#if contestantCtx.user?.email}`. Whether the context's `user` is filled while a gate is shown is **not established** (UI-SPEC N-4): `GATE_VIEWS` components take no props, and the layout renders `<GateView />` bare.
- The main button is `type="submit" form={formId}` and never `disabled` for an unfinished form (UI-SPEC U-06), where G's is `disabled={!termsAccepted}` with an `onclick`.
- The failure is `ErrorMessage inline role="alert"`, where G writes a bare `div`.
- The address block is `NothingToEdit.svelte`'s — see § *Shared Patterns → The address block*.
- `MainContent`'s default heading is used (it is `<h1 tabindex="-1">{title}</h1>`), so the layout's focus move lands.
- The `@component` docblock form is G's: "### Dynamic component / Accesses `ContestantContext`. / ### Properties / None. / ### Usage".

**Test analog:** `ENTRY/(protected)/termsOfUseLayout.svelte.test.ts` — its header lists the four cases to mirror ("A gated load renders the gate in place of the page", "A failed acceptance is shown and the form stays", "A recorded acceptance reruns the load, and nothing else advances the view", "An ungated load renders the page and no gate").

---

### `ENTRY/(protected)/+layout.server.ts` (route load)

**Analog:** itself.

**Stages 2 and 3** — anchors `const user = await dataWriter.getBasicUserData().catch(` and `const gate = firstNeededGate(user);`:

```typescript
  // Stage 2: the user-level data, which is all the gates are decided on.
  const user = await dataWriter.getBasicUserData().catch((e) => {
    log.error(`Error fetching basic user data: ${e?.message ?? 'No error message'}`, { err: e });
    return undefined;
  });
  if (!user) return await signOutToLogin(locals, lang, 'loginFailed');

  // Stage 3: a gated user gets the gate and the user-level data only.
  const gate = firstNeededGate(user);
  if (gate !== null) return { gate, user };
```

**What to copy:** the existing `catch` → `signOutToLogin(locals, lang, 'loginFailed')` is already D-06's "a failed read is neither set nor not set": a throw inside `_getBasicUserData` when the fact was asked for and could not be read lands here with no new code.

**What must not change:** the load reads `params.entityType` and `params.entityId` "for the dependency alone" and nothing else — anchor `void params.entityType;`. `layout.tracking.test.ts` beside it fails on any `url` or `route` read. The file's header docblock describes four stages; it is rewritten where the stages change.

**Test analog:** `ENTRY/(protected)/layout.server.test.ts` — `vi.hoisted` mocks of `createDataWriter` / `createDataProvider`, a `FakeEvent` type, and `const runLoad = load as unknown as LoadFn;`. Its case "A gated user gets the gate and nothing else … The list read is set up to REJECT in that case" is the shape for F's case.

---

### `ENTRY/login/email/+page.server.ts` (B's action) and `ENTRY/register/sign-in/+page.server.ts` (D2's action)

**Analog:** `ENTRY/login/+page.server.ts`

**The whole action** — anchor `const outcome = await passwordLogin({`:

```typescript
import { fail, redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { CONTESTANT_GRANTS, passwordLogin } from '$lib/auth';
import { buildRoute, safeRedirectTarget } from '$lib/routes';

export const actions = {
  default: async ({ request, locals, fetch }) => {
    const data = await request.formData();
    // Caller-controlled: see `loginRedirectTarget.ts`. Rejected values fall back to the app home.
    const redirectTo = safeRedirectTarget(data.get('redirectTo') as string | null);
    const outcome = await passwordLogin({
      context: {
        auth: locals.supabase.auth,
        getSession: locals.safeGetSession,
        claimInvitations: () => createDataWriter({ fetch, locals }).claimInvitations()
      },
      email: data.get('email') as string,
      password: data.get('password') as string,
      allowedGrants: CONTESTANT_GRANTS,
      logLabel: 'Candidate login'
    });
    if (!outcome.ok) return fail(outcome.status);
    const home = buildRoute({ route: 'ContestantAppHome', locale: locals.currentLocale });
    return redirect(303, redirectTo ? `/${locals.currentLocale}/${redirectTo}` : home);
  }
};
```

**B:** the file moves as it is. The page's form today writes `action="login"`; under `login/email/` the form posts to its own route, so the attribute goes.

**D2:** the same shape over `invitationCodeLogin` (anchor `export async function invitationCodeLogin(` in `lib/auth/invitationCodeLogin.ts`; it has **no caller** on the tree). The context gains `signInWithInvitationCode`, the code is read with `data.get('code')` from the form body, and no `redirectTo` is read. `178-RESEARCH.md` § *Code Examples* holds the proposed body. Every refusal is `fail(outcome.status)` with 400; `admitSession` adds 403 `grantNotAllowed` and 500 `noSession`.

**Analog caveat:** the docblock of `login/+page.server.ts` says "the redirect to the protected candidate home page" and the log label is `'Candidate login'` — stale names. Write the new docblocks anew.

---

### `ENTRY/login/email/+page.svelte` (B) and `ENTRY/register/sign-in/+page.svelte` (D2) — forms with a server action

**Analog:** `ENTRY/login/+page.svelte` — **structure only** (its docblock and its `isLoginShown` / `showPasswordSetMessage` machinery describe the page being replaced).

**Context reads** — anchor `const contestantCtx = getContestantContext();`:

```svelte
  const contestantCtx = getContestantContext();
  const { appCustomization, darkMode, getRoute, t } = contestantCtx;
  // appSettings is a reactive accessor — read via contestantCtx.X, never destructure.
  const appSettings = $derived(contestantCtx.appSettings);
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const answersLocked = $derived(contestantCtx.answersLocked);
  const { pageStyles, topBarSettings } = getLayoutContext();
```

**The enhanced submit and its status mapping** — anchor `use:enhance={() => {`:

```svelte
    use:enhance={() => {
      status = 'loading';
      return async ({ result }) => {
        if (result.type === 'failure') {
          status = 'error';
          errorMessage =
            result.status === 400
              ? t('error.wrongEmailOrPassword')
              : result.status === 403
                ? t('error.403')
                : t('contestantApp.login.unknownError');
          return;
        }
        await applyAction(result);
        status = 'success';
      };
    }}>
```

**The hidden target and the URL read in the page, not in a load** — anchors `const redirectTo = page.url.searchParams.get('redirectTo');` and `<input hidden name="redirectTo" value={redirectTo} />`.

**The link-button's mode condition** (D-09) reuses the accessor the page already imports — anchor `isRegistrationModeAllowedForAnyType(appSettings, REGISTRATION_MODE.Code)`; B's condition is the same call for `REGISTRATION_MODE.Email` or `REGISTRATION_MODE.IdentityProvider`.

**What differs:** the form is `method="POST" novalidate` with an `id`, its submit button is in `primaryActions` tied by `form={formId}` (needs `Button.type.ts` to admit `form`), fields are `EmailField` and `PasswordSignIn`, the 403 text is the new no-profile sentence (UI-SPEC U-13), and the `<h1>` is `<h1 tabindex="-1">` inside the `heading` snippet (UI-SPEC T-9: a bare `<h1>` in a custom `heading` snippet takes no focus). D2 has a hidden `code` field filled from the context's flow state and no email field.

---

### `ENTRY/login/+page.svelte` (A — two links, no form)

**Analog:** itself — **structure only**.

**The frame, the poster and the secondary links** — anchors `pageStyles.use({ drawer: { background: 'bg-base-300' } });`, `topBarSettings.use({`, and `data-testid="login-help-link"`:

```svelte
  pageStyles.use({ drawer: { background: 'bg-base-300' } });
  topBarSettings.use({
    imageSrc: darkMode.current
      ? (appCustomization.current.contestantPoster?.urlDark ??
        appCustomization.current.contestantPoster?.url ??
        '/images/hero-contestant.png')
      : (appCustomization.current.contestantPoster?.url ?? '/images/hero-contestant.png')
  });
```

```svelte
      <Button
        href={getRoute.current('ContestantAppHelp')}
        text={t('contestantApp.help.title')}
        data-testid="login-help-link" />
      {#if appSettings.access.voterApp}
        <Button
          onclick={() => goto(getRoute.current('Home'), { invalidateAll: true })}
          text={t('contestantApp.common.voterApp')}
          data-testid="login-voter-app-link" />
      {/if}
```

**A link as a main button** — anchor `data-testid="login-preregister"`: `<Button href={getRoute.current('ContestantAppPreregister')} text=… variant="main" … />` with `<div class="divider">{t('common.or')}</div>` above it. A's two entries are this shape.

**The notice** — anchor `const errorParam = page.url.searchParams.get('errorMessage') as ContestantLoginError | null;` with `getErrorTranslationKey(errorParam)`. `lib/contestant/utils/loginError.ts` holds one key (`loginFailed: 'error.loginFailed'`, `export type ContestantLoginError = 'loginFailed';`); `authError` is one more member of both.

**What goes:** `contestantCtx.newUserEmail`, `showPasswordSetMessage`, `isLoginShown`, `handleShowLogin`, the `<form>`, `PasswordField`, `slide`, `tick`, and the comment that says "we call invalidateAll when navigation to the Voter App to remove the Nominations we have added" stays only if still true.

---

### `ENTRY/register/+page.svelte` (C), `ENTRY/register/email/+page.svelte` (D1), `ENTRY/forgot-password/+page.svelte` — forms submitted by script

**Analog:** `ENTRY/forgot-password/+page.svelte`

**Frame with the app's name above the title** — anchor `<PreHeading>{contestantAppName}</PreHeading>`:

```svelte
<MainContent title={t('contestantApp.resetPassword.title')}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{contestantAppName}</PreHeading>
      <h1>{t('contestantApp.resetPassword.title')}</h1>
    </HeadingGroup>
  {/snippet}
```

**The script-handled submit** — anchor `async function handleSubmit(e: SubmitEvent) {`:

```svelte
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    status = 'loading';
    const result = await requestForgotPasswordEmail({ email }).catch((e) => {
      log.error(`Error requesting password reset email: ${e?.message}`);
      return undefined;
    });
    if (result?.type !== 'success') {
      status = 'error';
      return;
    }
    status = 'success';
    email = '';
  }
```

**What differs (each a decision, not a style):**
- **The outcome is not shown.** The analog branches on `result?.type` into `status = 'error'` / `'success'` and renders `ErrorMessage` / `SuccessMessage`. Under D-11 and D-13 the new handlers navigate to E **on the request's settlement whatever it was, success or throw** (research Pitfall 6); the `SuccessMessage` import and both message blocks go.
- The form carries `method="POST" novalidate` and an `id`; the analog's `<form onsubmit={handleSubmit} class="flex flex-col items-center">` has no method, which is a GET before hydration (research Pitfall 8).
- The submit `Button` leaves the form for `primaryActions` and is tied by `form`; it is not `disabled={email.trim() === '' || …}`.
- `<h1>` gains `tabindex="-1"`.
- The email input becomes `EmailField` with `autocomplete="email"`; the analog has `aria-label` and a placeholder and no `autocomplete`.
- The link request goes through `contestantCtx.requestSignInLink` / the recovery method; the locale is the page's.
- C's code path calls `checkInvitationCode` and treats **a throw like `unknown`** (D-10).

**C's modes** come from one function shared with A, the menu and the guard (UI-SPEC *Shared premises*); the accessors exist — `isRegistrationModeAllowed(appSettings, 'candidate', REGISTRATION_MODE.IdentityProvider)` and `isRegistrationModeAllowedForAnyType(appSettings, REGISTRATION_MODE.Code)` are both on today's login page and in `ContestantNav.svelte`.

---

### `ENTRY/register/+layout.server.ts` (route guard)

**Analog:** itself — **structure only** (it is written around the legacy set-password leg and a `registrationKey` read).

**The settings read with an anonymous client, failing closed** — anchor `const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });`:

```typescript
  const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });

  // A failed read is logged and answered with empty settings. The accessor reads empty settings as the shipped defaults, which allow no registration mode, so the guard fails closed and redirects.
  const appSettings: DPDataType['appSettings'] = await dataProvider
    .getAppSettings()
    .catch((e): DPDataType['appSettings'] => {
      log.error(`[Contestant App register layout] Error reading app settings: ${e?.message ?? 'No error message'}`, {
        err: e
      });
      return {};
    });
  if (!isRegistrationModeAllowedForAnyType(appSettings, REGISTRATION_MODE.Code)) {
    return redirect(303, buildRoute({ route: 'ContestantAppLogin', locale: locals.currentLocale }));
  }
```

**What differs:** the condition becomes "no mode listed" for `register` and "`code` not allowed" for `register/email` and `register/sign-in` (D-19), and — under J5 — "answers locked". The route is told apart by `route.id`, as the analog does with `SET_PASSWORD_ROUTE_ID`; `isRegistrationCodeLeg`, `SET_PASSWORD_ROUTE_ID` and the `url.searchParams.get('registrationKey')` read are deleted. **The replacement reads no search parameter** (UI-SPEC *View Transitions*).

**Test analog:** `ENTRY/register/layout.server.test.ts` (194 lines on the tree) — rewritten, not deleted (D-19).

---

### `ENTRY/password-reset/+page.svelte`

**Analog:** itself — **structure only** (its comments narrate a change: "the original destructure was effectively safe — but switching to contestantCtx.X future-proofs…").

**The session branch that stays** — anchor `const result = await setPassword({ password }).catch((e) => {`. **What goes:** `const code = page.url.searchParams.get('code');`, `isSessionFlow`, the whole `else` arm that calls `resetPassword({ code: code!, password })`, `submitLabel = $derived(validationError || …)`, and the client-side `goto(getRoute.current('ContestantAppLogin'))` if the planner adds a server load.

**Leaving the page after a save** — anchor `window.location.href = getRoute.current('ContestantAppHome');` with its comment "navigate to candidate home via full page load to ensure session cookies are sent to the server-side loader". This is the tree's own distrust of the step research RQ-3 leaves unmeasured: F does `invalidateAll()` instead. Probe row P4 decides which is right for both.

**A class typo to not copy:** `<div class="flex-nowarp flex flex-col items-center">`.

---

### `routes/api/auth/callback/+server.ts`

**Analog:** itself.

**Refused types** — anchor `const REFUSED_TYPE = 'invite';` and `if (token_hash && type && type !== REFUSED_TYPE) {`. Research J2 makes it a set of three (`invite`, `signup`, `email`).

**The arm that changes** — anchor `if (!claim.passwordSet) throw redirect(303, await setPasswordRoute({ locals, locale }));`:

```typescript
        case 'magiclink':
          if (!claim) {
            await locals.supabase.auth
              .signOut({ scope: 'local' })
              .catch((e: Error) =>
                log.error(`Auth callback: sign-out after a failed claim failed: ${e?.message ?? '-'}`)
              );
            throw redirect(303, buildRoute({ route: 'ContestantAppLogin', locale, errorMessage: 'authError' }));
          }
          if (!claim.passwordSet) throw redirect(303, await setPasswordRoute({ locals, locale }));
          throw redirect(303, landingRoute({ next, locale }));
```

**What to do:** delete the `passwordSet` line and the whole `setPasswordRoute` helper (it names `ContestantAppSetPassword`); every `magiclink` user goes to `landingRoute({ next, locale })`. **The claim already runs before every arm** — anchor `const claim = await claimAndRefresh({ locals, fetch });` directly above `switch (type) {` — so D-13's "the recovery arm runs the same sequence" needs no code. `landingRoute` and `safeRedirectTarget` are kept as they are.

**Ordering constraint (research Pattern 2):** this line may be deleted **only in the commit that adds F**; between the two a first-time user would land in the app with no password and nothing asking for one.

**Extraction candidate:** `claimAndRefresh` here duplicates the pair inside `lib/auth/sessionAdmission.ts` (`admitSession`); the pending todo names the moment D2's action is added as the time to extract (research OQ-13).

**Test analog:** `server.test.ts` — the case "sends a verified magiclink of a user without a password to the set-password page, in the request locale, with the address and no registration key" is rewritten to the app root; "refuses a link of the type invite, and verifies and claims nothing" is copied for `signup` and `email`; "claims before the landing on the email arm" goes with the arm.

---

### `lib/routes/appGates.ts` and `hooks.server.ts`

**Analog:** themselves — `appGates.ts` is **structure only** (its docblocks say "transcribed from what the request hook did before this table existed" and "both shapes predate this table").

**The row** — anchor `const CONTESTANT_GATE: AppGate = Object.freeze({`:

```typescript
const CONTESTANT_GATE: AppGate = Object.freeze({
  name: 'Contestant App',
  isRoute: isContestantRoute,
  loginRoute: 'ContestantAppLogin',
  whenAuthenticatedOnLogin: Object.freeze({
    status: 303,
    route: 'ContestantAppHome',
    params: () => ({})
  }),
  whenUnauthenticatedInProtectedGroup: Object.freeze({
    status: 303,
    route: 'ContestantAppLogin',
    params: ({ redirectTo }: GateRedirectContext) => ({ redirectTo })
  })
});
```

**The handler's test** — anchor in `hooks.server.ts`: `if (session && routeId === ROUTE[gate.loginRoute]) {`.

**What to do:** the row gains a frozen list of route keys (research proposes `entryRoutes: Object.freeze([...] satisfies ReadonlyArray<Route>)`), `AppGate` gains the member with its TSDoc, the Admin row lists its one login route, and the hook tests membership instead of equality. `whenAuthenticatedOnLogin.params` stays `() => ({})` (D-04: no parameter). The three module properties stay true: route **ids** never pathnames; everything frozen; descriptors name route **keys**.

**Tests:** `appGates.test.ts` — "freezes every row and every redirect descriptor" and "holds no path string in any descriptor: every target is a route key" extend to the new member; `routeConsistency.test.ts` compares `ROUTE` with the tree on disk, so each new key lands in the commit that adds its directory (`route.ts` says "This constant and the directory move together or the route 404s.").

---

### `lib/contexts/contestant/contestantContext.svelte.ts` (+ `.type.ts`, test) — the flow state

**Analog:** `#newUserEmail` in the same file — **structure only** (the file's class JSDoc and section comments carry narrative).

**The four pieces to copy, each by anchor:**

```typescript
  #newUserEmail = $state<string | undefined>(undefined);
```

```typescript
  #reset = (): void => {
    this.#userData.reset();
    this.#newUserEmail = undefined;
  };
```

```typescript
  get newUserEmail() {
    return this.#newUserEmail;
  }
  set newUserEmail(v) {
    this.#newUserEmail = v;
  }
```

and the type member in `contestantContext.type.ts` — anchor `newUserEmail: string | undefined;`.

**Why this shape and not another:** the surface members are **prototype** accessors on purpose — the file states that `Object.assign(this, this.#authContext)` would clobber an own-enumerable arrow field, and that reads through `ctx.X` "re-invoke the getter in the tracking scope". `#reset` is what the logout wrapper calls: `goto(this.#getRoute.current('ContestantAppLogin'), { invalidateAll: true }).then(this.#reset)`. The flow state replaces `#newUserEmail` in all four places, as a private `$state` of the instance, with explicit transition methods (research Pattern 3 proposes the union shape). It is a **reactive accessor**: never destructured by a page.

**Removed with it:** `checkRegistrationKey = (` … `prepareDataWriter().checkRegistrationKey(...args)`, `register`, and the forwards `readonly requestForgotPasswordEmail!: AuthContext['requestForgotPasswordEmail'];` / `readonly resetPassword!: AuthContext['resetPassword'];` change with `AuthContext` — which the **Admin** context forwards too (research T10, Pitfall 11): one commit for `authContext.type.ts`, both contexts and `authContext.svelte.test.ts`.

**177:** plans 15 and 19 edit this file. Fix every anchor after they land.

---

### `supabaseDataWriter.ts`, `dataWriter.type.ts`, `invitationAccess.ts` — the recovery method and `passwordSet`

**Analog:** the invitation methods of the same adapter.

**The one invocation site** — anchor `async #accountAccess(`:

```typescript
  async #accountAccess(
    operation: 'check-code' | 'request-link' | 'code-sign-in',
    fields: Record<string, string>
  ): Promise<unknown> {
    const { data, error } = await this.supabase.functions.invoke('account-access', {
      body: { ...fields, operation, project_id: this.projectId }
    });
    if (error) throw new Error(`account-access ${operation}: ${error.message}`);
    return data;
  }
```

**The method to copy** — anchor `protected async _requestSignInLink({ email, code, locale }: RequestSignInLinkOptions) {`:

```typescript
  protected async _requestSignInLink({ email, code, locale }: RequestSignInLinkOptions) {
    // An absent member is left out of the body rather than sent as `undefined`, so the body states exactly what the caller gave.
    const fields: Record<string, string> = { locale };
    if (email !== undefined) fields.email = email;
    if (code !== undefined) fields.code = code;
    parseSignInLinkRequest(await this.#accountAccess('request-link', fields));
    return { type: 'success' as const };
  }
```

**What to do:** widen the operation union by one member and add one `_…` method beside the four; **add no second `functions.invoke`** — `scripts/assert-project-scoped-queries.mjs` gates the project term at this one site (research Pitfall 7). The answer is narrowed by a zod parser in `invitationAccess.ts`, as `parseSignInLinkRequest` does.

**What is deleted** — anchors `this.supabase.auth.resetPasswordForEmail(email, {`, `protected async _resetPassword({ password }: { password: string; code: string }) {`, `protected async _checkRegistrationKey(`, `protected async _register({ password }: { password: string }) {`; in the type file `checkRegistrationKey: (opts: { registrationKey: string })`, `resetPassword: (opts: { code: string; password: string })` and `export type CheckRegistrationData`.

**`_setPassword` carries the open question** — anchor "The remedy is `await this.supabase.auth.refreshSession()` here" — decided by probe row P4, not by reading.

**`passwordSet` on `BasicUserData`:** `_getBasicUserData` today returns `{ id, email, username, role, termsOfUseAccepted, settings }` (anchor `termsOfUseAccepted,` in its return). The pattern for an in-method read that is logged and degraded is the acceptance read — anchor `if (acceptanceError)` — **but `passwordSet` must not copy its degradation**: that read "is reported and read as 'not accepted' rather than thrown", and D-06 requires a failed password-set read to **throw**. The RPC call shape to copy is `_getUserEntities` — anchor `await this.supabase.rpc('get_user_entities', {` with `p_project_id: this.projectId`. `parseUserEntities` already tolerates the key (a unit case feeds it `password_set: true`). `InvitationClaimResult` already has `passwordSet: boolean` — the naming precedent.

**177:** plan 09 edits all of these.

---

### `functions/account-access/*` — the recovery operation

**Analog:** the `request-link` operation, end to end.

**Contract** (`contract.ts`) — the closed union and the parser branch:

```typescript
export type AccountAccessRequest = CheckCodeRequest | RequestLinkRequest | CodeSignInRequest;
```

```typescript
  if (operation === 'request-link') {
    const email = optional(fields.email, isEmail);
    const code = optional(fields.code, isCode);
    const locale = optional(fields.locale, isString);
    if (email === MALFORMED || code === MALFORMED || locale === MALFORMED) return null;
    if (email === null && code === null) return null;
    const { witness } = fields;
    return {
      operation, projectId, email, code,
      locale: locale ?? undefined,
      witness: typeof witness === 'string' && UUID_PATTERN.test(witness) ? witness.toLowerCase() : null
    };
  }
```

The recovery request is this minus `code`, with `email` required. Its answer is the existing `ACCEPTED_BODY` — anchor `export const ACCEPTED_BODY = Object.freeze({ accepted: true } as const);` — and nothing new: "None of them carries anything that depends on whether an address, a code or an account exists".

**Handler** (`index.ts`) — the uniform answer before the work:

```typescript
  if (request.operation === 'request-link') {
    // The answer is built before any work and returned without waiting for any of it, so neither its body nor its timing says anything about the address or the code.
    const accepted = answer(ACCEPTED_BODY, 200);
    EdgeRuntime.waitUntil(issueInBackground(request));
    return accepted;
  }
```

and its dependencies — anchors `async requestEligibility({ projectId, email, code }) {` (calls `admin.rpc('invitation_link_request', { p_project_id, p_email, p_code })`), `async mintToken(recipient) {` (`generateLink({ type: 'magiclink', email: recipient })`), `async createPasswordlessUser(recipient) {` (`generateLink({ type: 'invite', … })`, tolerating `email_exists`).

**Pipeline** (`linkIssue.ts`) — `attempt` is the order to keep: sign-up check → locale and callback → redirect check → eligibility (takes the slot) → user → token → link → mail → release on failure → witness in `finally`. Anchors `const address = await deps.requestEligibility({`, `const link = buildSignInLink({ siteUrl: deps.siteUrl, locale, tokenHash });`, `const { subject, text, html } = renderSignInMail(locale, link);`, `await deps.release({ projectId: request.projectId, address, code: request.code });`.

**What differs for recovery (research Pattern 5):**
- the eligibility answer says **which mail** (recovery for a grant-holder, the ordinary sign-in mail for an address with only an open invitation, nothing otherwise — D-13);
- the recovery arm **creates no user** (no `createPasswordlessUser` call on it);
- the token is minted with `type: 'recovery'`, the link built with `type=recovery`, the template is the recovery one;
- **the slot key is shared** with `invitation_link_request` — the `'link:' || p_project_id::text || ':' || encode(sha256(…))` key — because the two link kinds are one token family in GoTrue.

**Link builder** (`signInLink.ts`) — anchor `url.searchParams.set('type', 'magiclink');` in `buildSignInLink`: the literal becomes a parameter from a closed set of two. `callbackUrl` and `isRedirectAdmitted` are unchanged.

**Templates** (`mailTemplates.ts`) — the five-sentence builder and one frozen record per mail:

```typescript
function template(subject: string, intro: string, linkLabel: string, once: string, ignore: string): SignInMailTemplate {
  return Object.freeze({
    subject,
    text: `${intro}\n${LINK_MARKER}\n\n${once}\n\n${ignore}\n`,
    html: `<p>${intro}</p><p><a href="${LINK_MARKER}">${linkLabel}</a></p><p>${once}</p><p>${ignore}</p>`
  });
}

export const SIGN_IN_MAIL_TEMPLATES: Readonly<Record<SignInMailLocale, SignInMailTemplate>> = Object.freeze({
  …
  en: template(
    'Sign-in link for the voting advice application',
    'Open this link to sign in:',
    'Sign in',
    'The link works once and expires soon. If it has expired, ask for a new one on the sign-in page.',
    'If you did not ask for this link, you can ignore this message.'
  ),
```

The recovery mail is a second record of the same type over the same `SIGN_IN_MAIL_LOCALES`, built by the same `template(…)`; its five English parts are in `178-UI-SPEC.md` § *The mails*. The sign-in mail's fourth sentence is reworded in all seven (UI-SPEC U-24).

**Tests to extend, by case name:**
- `mailTemplates.test.ts` — "has one template per locale and no other", "holds the link marker exactly once in its text and once in its html, and no other marker", "states no duration and no address", "holds no markup character in its sentences", "reads as written": each runs over both records.
- `contract.test.ts` — the four `describe`s ("well-formed bodies", "the witness changes no answer", "malformed bodies give null", "the answers are a closed set") each gain the operation.
- `flowConformance.test.ts` — reads `index.ts` as source: "returns after handing the work to EdgeRuntime.waitUntil, with no await in the branch", "builds the accepted answer before the hand-off and returns that same value", "hands over the one background function, which is the only caller of the link issue", "creates the user with the type invite and mints with the type magiclink". **The last two are written against one branch and one caller**: a second operation changes what they must say, so they are edited deliberately, with a new property for "the recovery arm creates no user".
- `linkIssue.test.ts` — every path through `attempt` is a case; the recovery paths are added the same way (all effects are injected `LinkIssueDeps`).

**Comment discipline:** every module's header states "Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global" — keep that true for `contract.ts`, `linkIssue.ts`, `signInLink.ts`, `mailTemplates.ts`, or vitest cannot import them.

---

### Schema — `private.caller_password_set`, `get_user_entities`, the matrix condition, the recovery eligibility

**Analog for a caller-only definer helper:** `private.caller_entity_ids` in `schema/301-auth-functions.sql`:

```sql
CREATE OR REPLACE FUNCTION private.caller_entity_ids (
  p_project_id uuid,
  p_entity_type public.entity_type
) RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT g.target_id
  FROM public.grants g
  WHERE g.user_id = (SELECT auth.uid())
  …
```

and the grant statement after it, whose reach is stated in its own comment — anchor "The statement reaches only the functions defined before it.":

```sql
GRANT
EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon,
authenticated,
service_role;

REVOKE
EXECUTE ON FUNCTION private.feedback_client_ip (json, boolean)
FROM
  anon,
  authenticated,
  service_role;
```

**Analog for the fact itself:** `private.user_password_set` in `schema/506-invitation-rpcs.sql` — anchor `SELECT NULLIF(u.encrypted_password, '') IS NOT NULL FROM auth.users u WHERE u.id = p_user_id` — followed by `REVOKE EXECUTE ON FUNCTION private.user_password_set (uuid) FROM PUBLIC, anon, authenticated;`.

**Two measured facts that shape the edit (research T7, Pitfall 1):** no API role may execute `private.user_password_set`, and it is defined in `506`, after `503`. So D-06 as written ("through the private definer helper") cannot be implemented: `get_user_entities` is `SECURITY INVOKER` and a `LANGUAGE sql` body is checked at creation. Research prescribes a zero-argument `private.caller_password_set()` returning `private.user_password_set((SELECT auth.uid()))`, defined before `503` with `private.user_password_set` moved with it, granted to `authenticated` only. If it is placed in `301` **after** the blanket grant, it needs its own explicit `GRANT`/`REVOKE`; if placed **before**, the blanket grant opens it to `anon` and `service_role` and a `REVOKE` in the `feedback_client_ip` form is needed. Either way `private.user_password_set` must end up executable by no API role, as today.

**`get_user_entities`** (`schema/503-entity-rpcs.sql`) — the top-level object is built once — anchor `SELECT jsonb_build_object(` / `'entities',` — and its comment already reserves the place: "The top level holds facts about the caller; every fact about an entity sits inside `entities`." The key is added beside `'entities'`; signature, cardinality, `SECURITY INVOKER`, the `REVOKE … FROM PUBLIC, anon` and `GRANT … TO authenticated` are unchanged. Its header comment is rewritten to name the key.

**The matrix condition** (`schema/506-invitation-rpcs.sql`) goes into three bodies, by anchor:

```sql
      SELECT CASE
        WHEN i.claimed_at IS NOT NULL THEN 'used'
        WHEN i.expires_at IS NOT NULL AND i.expires_at <= now() THEN 'unknown'
        ELSE 'valid'
      END
```
(`invitation_code_status` — one more `WHEN` before `ELSE`, on open rows only)

```sql
    EXISTS (
      SELECT 1
      FROM public.invitations i
      WHERE i.project_id = p_project_id
        AND i.email = v_email
        AND i.claimed_at IS NULL
        AND (i.expires_at IS NULL OR i.expires_at > now())
    )
```
(`invitation_link_request` — the open-invitation arm; and its code arm, between `ELSIF v_row.expires_at IS NOT NULL AND v_row.expires_at <= now() THEN` and `ELSIF v_email IS NULL THEN`)

```sql
    WHERE i.project_id = p_project_id
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.email = v_email OR (i.code_hash IS NOT NULL AND i.pending_email = v_email))
    ORDER BY i.created_at, i.id
    FOR UPDATE
```
(`claim_invitations` — **in the `WHERE` of the loop**, so a disallowed row is in neither `claimed` nor `skipped`)

**Do not add a skip reason.** The claim's reasons are a closed zod enum on the frontend — `reason: z.enum(['candidate_has_editor', 'target_not_in_project'])` in `invitationAccess.ts` — and a third value makes `parseInvitationClaim` throw, which the callback reads as a failed claim and signs the user out (research J3.5).

**A row's mode needs no column:** `CONSTRAINT invitations_binding_check CHECK (num_nonnulls (email, code_hash) = 1)` in `schema/305-invitations.sql` — a row with `email` is the `email` mode, one with `code_hash` the `code` mode.

**The matrix reader** has no analog function on the tree; its **storage path** does — `contestant_app_public_config` in `schema/106-app-settings.sql` reads `v.settings #> '{contestantApp,registrationModes}'` and `'{contestantApp,entityTypes}'`. Research § *Code Examples* holds the proposed `private.registration_mode_allowed_in(p_settings jsonb, p_entity_type text, p_mode text)` (IMMUTABLE, table-free) and its project-reading wrapper; it is **unrun**. The TypeScript rule it must equal is `getEffectiveRegistrationModes` in `packages/app-shared/src/settings/contestantAppConfig.ts`.

**The recovery eligibility function** copies `invitation_link_request`'s form: `plpgsql SECURITY DEFINER SET search_path = ''`, `v_email text := NULLIF(lower(btrim(p_email)), '');`, the grant-holder `EXISTS` over `auth.users u` and `public.grants g` (anchor `(g.scope = 'project' AND g.target_id = p_project_id)`), then `private.invitation_throttle_take('link:' || …, 1, interval '60 seconds')` with **the same key**, and a `REVOKE`/`GRANT … TO service_role` block like the one that ends `public.invitation_link_witness (uuid, text) TO service_role;`. It is a new **public** function called by the service role, so the census of `07-rpc-security.test.sql` and Section 21 ("exposure") of file 39 gain it — which is at odds with D-06's "the 07 census does not grow" as a phase-wide statement (see § *For the planner to resolve*).

**Function-header comment form** (every function in `506`): a dashed rule, `-- name: one-line question`, what it returns, what it never returns, and a closing `-- SECURITY DEFINER because …` sentence. Write the new ones in that form.

**J5 (`answersLocked` in the public config):** one key in `contestant_app_public_config`'s `'access', jsonb_build_object('contestantApp', …)`; the header's "Returns one object with exactly three values" and the sentence in `301` that says "three fixed settings values" change with it; the provider's copy — anchor "Place the three values `contestant_app_public_config` answers at their storage paths" in `supabaseDataProvider.ts` — gains the member.

---

### pgTAP — files 36, 38, 39 and the new truth-table file

**Analog for a fact assertion:** `39-invitations.test.sql` § "Section 14: password_set":

```sql
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'password_set',
    'false'::jsonb,
    'password_set is false for a user whose encrypted_password is the empty string'
  );
```

The three users it switches between (`…03e001` empty string, `…03e002` a hash, `…03e008` null) are the fixtures for the `get_user_entities -> 'password_set'` assertions in `36-entity-identity.test.sql`, whose existing reads are of the form `public.get_user_entities (test_id ('project_a')) -> 'entities'` and whose anon refusal is "anon is refused get_user_entities by privilege". Those users live in file 39's own setup, not in the shared helper: file 36 needs its own.

**Analog for a file preamble and a stored-shape fixture:** `38-contestant-app-public-config.test.sql`:

```sql
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (16);

SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

UPDATE app_settings
SET
  settings = '{
    …
    "contestantApp": {
      "entityTypes": ["organization", "candidate", "candidate"],
      "registrationModes": {"candidate": ["code", "email", "code"], "organization": []},
      "questions": {"hideHero": true}
    }
  }'::jsonb
WHERE
  project_id = test_id ('project_b');
```

Its header is the model for the new file's: "WHAT IS PINNED." then "WHY EVERY ASSERTION BELOW IS NON-VACUOUS." then "Depends on:".

**Two fixture rules (research J3.2, Pitfall 2):**
- `create_test_data` writes `'{"theme":"light"}'` / `'{"theme":"dark"}'` as the settings rows — **no matrix**. File 39 names the three invitation functions 98 times; without a matrix for its projects most rows flip. **Give file 39 a permissive matrix in its own setup with the `UPDATE app_settings` form above; do not edit `00-helpers.test.sql`.** The matrix and the new sections land in the commit that adds the condition.
- Each file's `SELECT plan (N);` moves with its assertions.

**The truth-table file (`45-…`)** holds literal rows `(settings json, entity type, mode, expected)` asserted against the pure reader; the same rows are parsed by the vitest below. Its row list is in research § J3 ("nothing stored; `contestantApp: null`; `entityTypes` not an array, empty, …").

---

### `packages/dev-seed/tests/registrationModeMatrixParity.test.ts` (cross-artifact text-reading gate)

**Analog:** `packages/dev-seed/tests/rpcNullabilityGate.test.ts`

**Imports and the repo-root read** — anchor `/** \`packages/dev-seed/tests\` → repo root. */`:

```typescript
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const WORKFLOW = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8');
```

**What to copy:** the file reads another workspace's artifact as text from `REPO_ROOT`, and its header says why it lives here ("`yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests … `assertKnownRowProps.test.ts` parses `apps/supabase/supabase/schema/501-bulk-operations.sql`") and that it is "a text-level spec, deliberately". The new test parses the rows out of the `.sql` file and asserts `isRegistrationModeAllowed` from `@openvaa/app-shared` returns each row's `expected`. **Guard against a vacuous pass**: assert the parsed row count is above zero and equals the file's `plan`.

**Not a model for its comments' length**: the analog's header argues its own existence over several paragraphs; write the new one in four lines.

---

### `scripts/assert-auth-signup-closed.mjs` and `config.toml` (D-17)

**Analog:** itself.

**The three parts every new key touches** — anchors `const REQUIRED = [`, `const CORRECT = \``, `const CASES = [`:

```javascript
const REQUIRED = [
  {
    table: 'auth',
    key: 'enable_signup',
    …
```

```javascript
  {
    name: '[auth] enable_signup = true',
    text: CORRECT.replace('enable_signup = false\n\n[auth.rate_limit]', 'enable_signup = true\n\n[auth.rate_limit]'),
    expected: ['auth/enable_signup']
  },
```

**What to copy:** one `REQUIRED` entry (`table: 'auth'`, `key: 'minimum_password_length'`, `value: '8'`, a `why`), the key added to `CORRECT`, and self-test cases in the four existing shapes: wrong value, absent, commented out, and present only in another table. The header docblock lists each required key with its reason and says "all three keys hold" in its exit codes — both counts move. `selfTest` refuses a case whose text equals `CORRECT` ("the case text equals the required configuration, so it tests nothing"): each `replace` must actually match.

**`config.toml`:** anchor `minimum_password_length = 6` under `[auth]`. For J6 the configured-hook form is `[auth.hook.custom_access_token]` with `uri = "pg-functions://postgres/public/custom_access_token_hook"`; a commented `# [auth.hook.before_user_created]` block shows where hook tables sit.

**Stack rule:** both are read when the stack starts — `yarn db:stop` then `yarn db:start` before any verdict (research Pitfall 9).

---

### New components — the four-file shape

**Analog:** `lib/contestant/components/contactSupport/` (`ContactSupport.svelte`, `ContactSupport.type.ts`, `index.ts`, `ContactSupport.svelte.test.ts`).

**Type file** — anchor `export type ContactSupportProps = SvelteHTMLElements['div'] & {`:

```typescript
import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { ButtonProps } from '$lib/components/button';

export type ContactSupportProps = SvelteHTMLElements['div'] & {
  /**
   * Optional lead-in rendered above the button, e.g. a sentence saying when to contact support.
   */
  children?: Snippet;
  /**
   * Where the button leads: `'help'` links to the support section of the Help page, `'email'` opens an email to the support address. @default 'help'
   */
  action?: 'help' | 'email';
```

**Component script** — anchor `let { children, action = 'help', variant = 'prominent', iconPos, ...restProps }: ContactSupportProps = $props();`:

```svelte
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { Button } from '$lib/components/button';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { concatClass } from '$lib/utils/components';
  import type { ContactSupportProps } from './ContactSupport.type';

  let { children, action = 'help', variant = 'prominent', iconPos, ...restProps }: ContactSupportProps = $props();

  const ctx = getContestantContext();
  const { getRoute, t } = ctx;

  // appSettings is a reactive accessor: read via ctx.appSettings inside the derived, never destructured.
  const supportMailto = $derived(getEmailUrl({ … to: ctx.appSettings.admin.email }));
```

**Root element** — anchor `<div {...concatClass(restProps, 'flex w-full flex-col items-center gap-md')}>`.

**`@component` docblock** — the sections, in order: one-sentence summary, `### Dynamic component` (only if it reads a context), `### Properties` (one bullet per prop with its default), `### Settings`, `### Usage` with a `tsx` block.

**Test file** — anchors `vi.mock('$lib/contexts/contestant', () => ({` and `function render(props: Record<string, unknown> = {}): HTMLElement {`:

```typescript
import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
    appSettings: { admin: { email: SUPPORT_EMAIL }, contestantApp: { entityTypes: ['candidate'] } }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { ContactSupport, SUPPORT_ANCHOR } = await import('.');

let teardown: Array<() => void> = [];
afterEach(() => { for (const fn of teardown.reverse()) fn(); teardown = []; });

function render(props: Record<string, unknown> = {}): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ContactSupport, { target, props: props as never });
  flushSync();
  teardown.push(() => { unmount(component); target.remove(); });
  return target;
}
```

`t` is the identity, so assertions read message **keys**; the import of the component is dynamic and comes **after** the `vi.mock` calls.

**Base (context-free) components** read `t` from the component context, as `PasswordField` does — anchor `const { t } = getComponentContext();` — and ids from `getUUID()` with a prop override: `const fallbackId = getUUID();` / `const id = $derived(idProp ?? fallbackId);`. `EmailField`, `RegistrationCodeField` and `EmailEntry` should be context-free in this sense ("Knows nothing of what it is used for").

**An imperative export** — anchor in `PasswordField.svelte`: `export function focus(): void { input?.focus(); }`; in `PasswordSetter.svelte`: `export function reset(): void {`. `EmailField.focus()`, `EmailEntry.validate()`, `PasswordSetter.validate()` follow this.

**A component that wraps `ContactSupport` on a shaded page** passes `variant="normal"` (UI-SPEC T-5: the default `'prominent'` fill is the entry pages' own background).

---

### `PasswordField.svelte` and `PasswordSetter.svelte` (changed)

**Analog:** themselves — **structure only** (both carry `bind: keep — Pattern 2…` comments and one that points at "(line below)").

**What is there, by anchor, and what each becomes:**

| Today | Anchor | Becomes |
|---|---|---|
| a fixed name | `name="password"` in `PasswordField.svelte` | a `name` prop, default `'password'` |
| a label only for screen readers | `<label for={id} class="sr-only">{label \|\| t('common.password')}</label>` under `{#if !externalLabel}` | unchanged for existing callers; with `externalLabel` no placeholder is rendered |
| an always-on placeholder | `placeholder={t('components.passwordInput.placeholder')}` | absent with `externalLabel` |
| the toggle | `type="button"` … `data-testid="password-field-toggle"` | unchanged |
| the setter is the form | `<form class="m-0 flex w-full flex-col flex-nowrap items-center" {...restProps}>` | gains `method="POST"`, `novalidate`; `id` and `onsubmit` arrive through `restProps` |
| the validator without the address | `<PasswordValidator bind:validPassword {password} />` | given `username` |
| two fields, one name, a numeric gap | `<div class="mb-md mt-md flex w-full flex-col gap-6">` | distinct names, visible labels, `gap-md` |
| validity pushed to the parent | `onValidityChange?.({ valid, errorMessage });` | kept, for the settings page |
| the load-bearing equality | `const valid = $derived(!!(password && passwordConfirmation && validPassword && password === passwordConfirmation));` | kept; `validate()` judges the password as typed |

**Reach:** `PasswordSetter` has three callers — `password-reset`, `register/password` (deleted here) and the entity's `settings` page; `PasswordField` is also the Admin login's input (`routes/admin/login/+page.svelte`) and `adminLoginPage.fixture.ts` reads `testIds.contestant.password.field`. A unit case holds the defaults for the Admin login.

**Test analog:** `PasswordSetter.svelte.test.ts` (176 lines on the tree) — extended, not replaced.

---

### `ContestantNav.svelte` (the signed-out group)

**Analog:** itself. Anchors: `const canRegisterWithCode = $derived(isRegistrationModeAllowedForAnyType(appSettings, REGISTRATION_MODE.Code));`, `{#if canPreregister}` over `href={getRoute.current('ContestantAppPreregister')}`, `{#if canRegisterWithCode}` over `href={getRoute.current('ContestantAppRegister')}` with `text={canPreregister ? …`. The two items become one "Register" item shown when the shared list of modes is not empty (UI-SPEC S10, U-23).

---

### E2E — page-object fixtures

**Analog:** `tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts`

**The whole shape** — anchor `export function createContestantLoginPage(page: Page) {`:

```typescript
import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export function createContestantLoginPage(page: Page) {
  return {
    async goToPage(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppLogin', locale: 'en' }));
      await expect(page.getByTestId(testIds.contestant.login.email)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },
    async login(email: string, password: string): Promise<void> {
      await this.enterEmail(email);
      await this.enterPassword(password);
      await this.submit();
    },
    async expectErrorMessage(text?: string | RegExp): Promise<void> {
      const err = page.getByTestId(testIds.contestant.login.errorMessage);
      await expect(err).toBeVisible();
      if (text !== undefined) await expect(err).toContainText(text);
    }
  };
}

export type ContestantLoginPageFixture = ReturnType<typeof createContestantLoginPage>;
```

**What to copy:** a factory over `page` returning an object of steps; every locator through `testIds`; every URL through `utils/buildRoute`; the header's "Surface:" list of steps and its closing **Rigidity contract** line ("NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions"); the exported `ReturnType` alias.

**The re-point:** `goToPage()` opens B's route key and waits for the same `login.email` id, so `login(email, password)` keeps its meaning. `page.getByTestId(testIds.contestant.password.field)` is the shared `PasswordField` id — unchanged.

**For a gate view** the analog is `contestantTermsOfUsePage.fixture.ts` — **structure only** (one step's comment narrates "a 346× click-retry dump"). Copy `open()` — anchor `await page.goto(buildEntityLessRoute({ route: 'ContestantAppHome', locale: 'en' }));` then a visibility wait on the view's marker — and `expectNoHorizontalOverflow()` through `createPageGeometry(page)` for the 320 / 390 px checks (UI-SPEC U-27).

**Composition root** — `tests/tests/fixtures/contestant/invitation-landing.ts`:

```typescript
export const test = base.extend<InvitationLandingFixtures, InvitationLandingWorkerFixtures>({
  invitationFlow: [
    async ({}, use) => {
      await use(createInvitationFlow(new SupabaseAdminClient(), { addressPrefix: INVITATION_LANDING_ADDRESS_PREFIX }));
    },
    { scope: 'worker' }
  ],
  contestantLoginPage: async ({ page }, use) => {
    await use(createContestantLoginPage(page));
  },
  …
});

export { expect };
```

Each new spec gets a root like this, with **its own address prefix** in `tests/tests/utils/invitationConstants.ts`, the worker-scoped `invitationFlow` and its test-scoped page objects.

---

### E2E — the registration specs and the FIX-01 case

**Analog:** `tests/tests/specs/contestant/invitation-landing.spec.ts`

**Hooks** — anchors `test.use({ storageState: { cookies: [], origins: [] } });` and `await invitationFlow.removeEverythingUnderPrefix();`:

```typescript
// Every test signs in from scratch.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('where a claimed invitation lands its user', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ invitationFlow }) => {
    await invitationFlow.removeEverythingUnderPrefix();
  });

  test.afterEach(async ({ invitationFlow }) => {
    await invitationFlow.removeEverythingUnderPrefix();
  });

  test.afterAll(async ({ invitationFlow }) => {
    expect(await invitationFlow.leftoversUnderPrefix()).toEqual({ invitations: 0, users: 0 });
  });
```

**The link opened as received** — anchor `await page.goto(await invitationFlow.signInLinkToOpen(user.email, { locale: 'en' }));`:

```typescript
    const request = await invitationFlow.askForLink({ email: user.email, locale: 'en' });
    expect(request.outcome, 'the link request handed a mail over').toBe('sent');

    await page.goto(await invitationFlow.signInLinkToOpen(user.email, { locale: 'en' }));

    await contestantNothingToEditPage.expectShown();
    await contestantNothingToEditPage.expectSignedInEmail(user.email);
```

**A message read from its source, never copied** — anchor `const NOT_AUTHORIZED_MESSAGE: string = JSON.parse(`:

```typescript
const NOT_AUTHORIZED_MESSAGE: string = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/error.json'), 'utf8')
).error['403'];
```

**The header's sections** — "## The three cases", "## What it writes", "## Grants", then the Rigidity contract ("No expectation takes a link, a token or a password as its subject").

**Seeding and the negative oracle** come from `invitationFlow` (`tests/tests/fixtures/shared/invitationFlow.fixture.ts`) and `invitation-contract.spec.ts`:
- seed only through `seedEmailInvitation('candidate', address)` / `seedCodeInvitation('organization')` — one place for 177.1's `p_confirm_entity` to change (research § *Phase 177.1 dependency*); `DedicatedTarget = 'candidate' | 'organization'` are the two reserved rows of the base dataset;
- `askForLink` "returns once the request's own completion witness has finished"; a no-mail assertion goes through `expectNothingSent`, "which asserts the witness's outcome before it looks at the mail catcher";
- `releaseLinkSlot(email)` gives the server's 60-second slot back, so a resend case never waits a minute;
- `resetDedicatedRows()` in `beforeAll` / `afterAll` and `leftovers()` → `{ invitations: 0, users: 0 }` when the spec writes on the reserved rows;
- constants as frozen expectations — `const CODE_VALID = { status: 200, body: { status: 'valid' } };`.

**What the specs drive that the fixture does not:** the **screens**. In these specs the link request is made by the page (C's Continue, B's button, forgot-password), not by `askForLink`; the fixture is then needed for seeding, for reading the mailed link (`signInLinkToOpen`) and for the witness. **A page-made request carries no witness** ("174's completion witness is a service-role field no screen sends" — D-21). How a "no mail" assertion is made after a page-made request is unresolved: the precedent on the tree is the last test of the contract spec, which "follows the two latest things that can be observed" — a further witnessed request for the same address made after it. Probe and state it in the plan.

**`mailedLink.ts`** — anchors `const SIGN_IN_LINK_TYPE = 'magiclink';` and `if (type !== SIGN_IN_LINK_TYPE) {` inside `assertSignInLinkShape`. The recovery link needs the type as a parameter from a closed set (or a twin); `toRunOrigin` is unchanged ("its scheme, host and port are replaced, and everything after them is returned byte for byte"). Its own unit test is `tests/tests/utils/mailedLink.test.ts`, run by `yarn test:unit:tests`.

---

### E2E — setup / teardown pair and stored sessions

**Analog:** `tests/tests/setup/contestant/entity-selection.setup.ts` and `.teardown.ts`

**Setup** — anchor `setup('register + authenticate as a user who edits two candidates and an organization', async ({ page }) => {`:

```typescript
import { expect, test as setup } from '@playwright/test';
…
setup('register + authenticate as a user who edits two candidates and an organization', async ({ page }) => {
  setup.setTimeout(TIMEOUTS.testMax);

  await registerAndStoreSession(page, {
    entityGrants: [ … ],
    email: TEST_MULTI_ENTITY_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: MULTI_ENTITY_STORAGE_STATE,
    acceptTermsOfUse: true,
    settledTestId: testIds.contestant.entitySelection.list
  });
});
```

**Teardown** — the whole file:

```typescript
teardown('unregister the entity-selection auth users', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(TEST_MULTI_ENTITY_EMAIL);
  await client.unregisterCandidate(TEST_NO_ENTITY_EMAIL);
  await client.unregisterCandidate(TEST_LOGOUT_ENTITY_EMAIL);
});
```

**Project trio in `tests/playwright.config.ts`** — anchor `name: 'data-setup-entity-selection',`:

```typescript
  {
    name: 'data-setup-entity-selection',
    testMatch: /entity-selection\.setup\.ts/,
    teardown: 'data-teardown-entity-selection',
    dependencies: ['data-setup-base']
  },
  {
    name: 'data-teardown-entity-selection',
    testMatch: /entity-selection\.teardown\.ts/,
    retries: 0
  },
  {
    name: 'contestant-entity-selection',
    testDir: './tests/specs/contestant',
    testMatch: /contestant-entity-selection\.spec\.ts/,
    fullyParallel: false, // the cases share one user's rows and one stored session
    use: { ...devices['Desktop Chrome'], storageState: MULTI_ENTITY_STORAGE_STATE },
    dependencies: ['data-setup-entity-selection', 'auth-setup']
  },
```

**A leaf with no teardown project** — anchor `name: 'invitation-landing',`: `use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } }`, `dependencies: ['data-setup-base']`, `fullyParallel: false`, and a prose comment above it stating what it writes and why it needs no teardown. Every project in this file has such a comment; write one for each new project. `testMatch` names the one spec file, because several projects share `./tests/specs/contestant`.

**What differs for the passwordless session (D-22):** `registerAndStoreSession` cannot be used — it calls `client.forceRegisterUser(identity.email, identity.password, …)`, which stores a password, and signs in through the form. The session for F's scan is "written by a setup through a real mailed link" over a user made by the two-call recipe (`invite` then `magiclink`, as `createPasswordlessUser` + `mintToken` in the function do). The setup then opens the link, waits on `contestant-set-password-gate`, and stores the state with `page.context().storageState({ path })` — the last line of `registerAndStoreSession`. **The session is read-only for the run**: no spec sets its password. `contestant-a11y-scan`'s `dependencies: ['data-setup-base', 'auth-setup', 'data-setup-entity-selection']` gains the new setup. Whether a `magiclink` session's stored state survives a whole run (token lifetime, refresh) is **not established**.

**Where the constants live:** `tests/tests/utils/testCredentials.ts` (`MULTI_ENTITY_STORAGE_STATE`, `TEST_MULTI_ENTITY_EMAIL`, …) for stored-session paths and identities; `invitationConstants.ts` for address prefixes and reserved rows.

**D-21's scheduling constraint:** "Readers of the multi-entity and no-entity sessions run before the perm chain … the new specs do not consume those identities" — the new leaves depend on `data-setup-base`, which is what places them "in the scheduling phase of the other base leaves, which ends before the first setup that clears the base dataset starts" (the `invitation-contract` comment).

---

### `registerAndStoreSession.ts` and the four perm setups (the re-point)

**Analog:** itself.

**The steps that break when A loses its form** — anchors `await waitForLoginForm(page, contestantHome, testIds.contestant.login.email);` and `await expect(page).not.toHaveURL(/.*login.*/);`:

```typescript
  const contestantHome = buildRoute({ route: 'ContestantAppHome', locale: 'en' });
  await waitForLoginForm(page, contestantHome, testIds.contestant.login.email);

  await page.getByTestId(testIds.contestant.login.email).fill(identity.email);
  await page.getByTestId(testIds.contestant.password.field).fill(identity.password);
  await page.getByTestId(testIds.contestant.login.submit).click();

  // Wait for navigation away from the login page
  await expect(page).not.toHaveURL(/.*login.*/);
```

`waitForLoginForm` opens the **app root** and waits for `login-email` on the page the redirect lands on; that page becomes A, which has no field. `perm-answers-locked.setup.ts`, `perm-disable-allow-open.setup.ts`, `perm-hide-hero.setup.ts` and `perm-question-video.setup.ts` each hold their own copy of `waitForLoginForm` and the same four lines.

**Prescription (research § *The E2E estate*):** consolidate onto one page object for B, used by this helper, the four setups and the specs; land B as a new route **beside** the unchanged login page; re-point; show a full run green; only then take the form off A. Prefer the identity's `settledTestId` (a positive sign of the landed page) to the URL wait. **Re-read this file at plan time**: another session was investigating exactly its URL wait when the research was written.

**Other one-line consumers to re-derive by search:** `fixtures/contestant/contestant-entity-selection.ts` (asserts `login.email` after a sign-out), `perm-access-disable.spec.ts` (three assertions), `contestantLogoutButton.fixture.ts` (`toHaveURL(/\/contestant\/login/)`, which B's path also matches), `perm-closed-project.spec.ts` ("anon can reach the candidate login and the admin login on a closed project" waits for `login.email` at `/en/contestant/login`).

---

### Axe scans

**Under a stored session — analog `tests/tests/specs/a11y/contestant-a11y.spec.ts`**, the gate entry and its describe:

```typescript
  {
    // The terms-of-use view replaces the page at every protected URL, so it is opened at the home route, and the home markers the other entries use are not rendered.
    // Anchor on the acceptance checkbox, which the view's form renders.
    // Marker: the view's submit button, which only the protected layout renders, and only for a signed-in user who has not accepted.
    name: 'contestant-terms-gate',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.terms.checkbox,
    postLoginTestId: testIds.contestant.terms.submit
  }
```

```typescript
test.describe(() => {
  test.use({ storageState: TERMS_PENDING_STORAGE_STATE });
  …
    declareScans(entry);
```

F's entries are a fourth table and a fourth `describe` with its own `storageState`; `declareScans` (in `tests/tests/utils/contestantAxeScan.ts`) declares the light scan and its dark twin. Each entry's three-line comment form (why this route, "Anchor on …", "Marker: …") is the convention.

**With no session — analog the `loginScan` cases of `perm-closed-project.spec.ts`** (**structure only**: its `describe` title carries plan and decision ids, "perm-closed-project (162.1 D-05, D-16, D-17)"):

```typescript
function loginScan(name: string, contentTestId: string): RawAxeRoute {
  return { name, fixture: 'raw', routeId: 'ContestantAppLogin', contentTestId };
}
…
      await assertAxeScan(
        page,
        loginScan('contestant-login-sign-in-only', testIds.contestant.login.email),
        testInfo,
        'contestant-login-sign-in-only'
      );
```

**Why the signed-out entries cannot go into `declareScans`** (UI-SPEC T-7): its reach proof asserts the settled URL is not the login route — `const CONTESTANT_LOGIN_URL = /\/contestant\/login(\/|$|\?|#)/;` and `.not.toMatch(CONTESTANT_LOGIN_URL)` in `contestantAxeScan.ts` — and that expression matches B's path too. The existing four are scanned **once, in one theme**; D-22 wants both, and "a dark twin runs in a context born dark, never by a flip" (`axeScan.ts`). **`loginScan` as written has no dark twin and no helper for one outside `declareScans`**: the new spec needs a small raw-entry twin declarer — read `toScanEntry` and `assertDarkThemeIfDark` in `contestantAxeScan.ts` before deciding whether to generalise `declareScans` or write a sibling.

**The matrix per test** — anchor `await client.updateAppSettings({ contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: [], organization: [] } } });` — is how `perm-closed-project.spec.ts` reaches each login state; its `afterAll` calls `new SupabaseAdminClient().ensureProject()`. The three replacement entries (A2, C single-mode, C with the provider's panel) are reached the same way.

**Refusals observed by URL** — `expectRefusedToLogin(page, target)` with `await expect(page).toHaveURL(urlOf(LOGIN_ROUTE), { timeout: TIMEOUTS.slowPage });` — is kept for `register/**` under an empty matrix; the case "a signed-in user reaches the set-password page without a registration key under an empty matrix" goes with the page.

**The wiring gate** — `scripts/assert-a11y-scan-wiring.mjs` names each spec that may scan as a constant (`const CLOSED_PROJECT_SPEC = path.resolve(REPO_ROOT, 'tests', 'tests', 'specs', 'perm', 'perm-closed-project.spec.ts');`) and lists them with a `label`; the new spec is one more constant and one more list entry (**177: 10** adds its own). The verdict's expected entry count per project moves in the same commit.

---

### Seed data — the organization row or a spec's own settings

**If the base matrix is widened:** `packages/dev-seed/src/templates/e2e/base.ts` — anchor `entityTypes: ['candidate', 'organization'],` with `registrationModes` below it — and both pins in the same commit: `packages/dev-seed/tests/templates/base-app-settings.test.ts` (`expect(BASE_APP_SETTINGS.contestantApp.registrationModes.organization).toEqual([]);`) and `built-in-templates-contestant-app.test.ts` (three literals `registrationModes: { candidate: ['email', 'code'], organization: [] }`). The perm family's shared settings (`packages/dev-seed/src/templates/e2e/perm/shared.ts`, `entityTypes: ['candidate'],`) are pinned equal to the base's `registrationModes` by `expect(minimal.registrationModes).toEqual(BASE_APP_SETTINGS.contestantApp.registrationModes);` — they move too.

**If the spec declares its own settings:** the perm template + setup pair — **structure only** (the template's header cites requirement and decision ids):

```typescript
import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-closed-project-';

export const permClosedProjectTemplate: Template = {
  ...buildMinimal({
    externalIdPrefix: P,
    candidates: 1,
    opinionQuestions: 1,
    infoQuestions: 0,
    settingsOverlay: {
      access: { voterApp: true, contestantApp: true, underMaintenance: false }
    }
  }),
  openForVoters: false
};
```

```typescript
setup('import perm-closed-project dataset', async () => {
  await setupFromTemplate('perm-closed-project');

  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(CANDIDATE_EMAIL);
  await client.forceRegister(CANDIDATE_EXTERNAL_ID, CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);
});
```

A perm setup **replaces the settings row** of the one project the server serves, so such a spec joins the serial perm chain, not the base leaves. That is the cost side of the choice research J3 puts to the operator (it recommends widening).

---

### Phase drivers

**Analogs:** `.planning/phases/176-contestant-home-task-state-nominations-view/176-gates.sh`, `176-e2e.sh`, `176-verdict.mjs`; for the bank-auth runs and the probe, `.planning/phases/174-invitations-grants-defined-in-advance/174-bankauth.sh`, `174-fn-probe.mjs`, `174-stack-probe.sh`.

**What to carry over from `176-gates.sh` (its header is the specification):**
- one row per gate in a **fixed order**, "every one with TURBO_FORCE=true in its environment"; the database rows ordered reset → types → `types-clean` (`git diff --exit-code -- packages/supabase-types/src/database.ts`) → pgTAP → SQL lint → integration, because "the pgTAP suite's first file commits its helper functions into `public`, where they stay until the next reset";
- "Every row runs as `cmd > "$DIR/NN-name.log" 2>&1; s=$?` -- never through a pipe -- and `name<TAB>status<TAB>seconds` is appended to summary.tsv. Every row runs even after a red one.";
- `--rows` for a subset, with `rows-expected.txt` holding exactly the names, so "176-verdict.mjs never reads a subset run as the full gate set";
- refusals with exit 2: Node below the engines floor; a dirty tree outside `.planning/` "other than the operator's untracked CAND-APP-PLAN.md"; a label that already holds a run ("a re-run takes <label>-r2, -r3, ...");
- "Never in the foreground: start it in the background and poll the marker" and the `done` file as the run's last act.

**What 178 adds that 176 dropped on purpose.** 176's header says: "Two rows of Phase 174's gate set are not rows here. Its auth-config row runs a script that is a link of `yarn lint:check` … Its row that probes the served auth configuration guards files no plan of this phase changes; `176-verdict.mjs scope` is what says so, by refusing a changed path under the Edge Functions, the auth configuration, the hooks or the auth API routes." **Phase 178 changes exactly those paths** (`functions/account-access/`, `config.toml`, `hooks.server.ts`, `routes/api/auth/callback/`), so: take the served-auth-configuration row from **`174-gates.sh`**, add the functions' unit row (`yarn workspace @openvaa/supabase test:unit`) and `yarn test:unit:tests`, and rewrite `scope` in the verdict so that it admits those paths instead of refusing them. A copied 176 `scope` would fail every plan of this phase.

**From `176-e2e.sh`:** the guard list; `docker builder prune -af` first ("the build cache only -- never images, never volumes, never a Docker restart"); the free-space refusal; the port refusal; `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/176-e2e/<label> --no-db-reset`; `--require-project <name>` (repeatable) for the new projects; the VOID pass-through ("Only the wrapper makes a run VOID … This driver passes that status through and says VOID by name"); "It never deletes anything under tests/e2e-runs/."

**From `176-verdict.mjs`:** the subcommands `gates`, `e2e`, `control`, `determinism`, `scope`, `hygiene`, `dir`; `--same-projects-as <label-or-path> --except <project>=<delta>` for the project-count comparison against a baseline (this phase adds projects and scan entries, so each is an `--except`); `--expect-title-count <project>::<substring>=<n>` for the scan-entry counts D-22 says move "in the same commit".

**From `174-fn-probe.mjs`:** the header form — what it works in ("the default project that apps/supabase/supabase/seed.sql creates"), its own address prefix ("Every address it uses begins with r174-probe-fn- and carries the run's own id"), "HOW A NEGATIVE IS ASSERTED" through the witness, numbered steps with one PASS/FAIL line each, the last step deleting everything it made, and "What it never does: print a key, a code, a password, a token, a token hash or a link; read a container variable; open any environment file." Keys are captured "from `supabase status -o env` into variables". Research rows P1–P4 run ahead of any build; **P5 and P6 change `config.toml` and restart the stack, so they run in the plan that makes the change**; P7 needs B's action to exist.

**Plan form:** `.planning/phases/177-define-nominations/177-15-PLAN.md` — frontmatter keys `phase`, `plan`, `type: execute`, `wave`, `depends_on`, `files_modified`, `autonomous`, `requirements`, `user_setup`, `estimate { tokens, raw_tokens, tasks, confidence }`, `must_haves.truths`; UI truths are written "UI: <category> · <element> — <resolution>", lifted from the UI spec's state tables. **Form only**: 177 is not on the tree and its content is no analog.

## Shared Patterns

### Reactive context reads (every `.svelte` file of this phase)
**Source:** `ENTRY/login/+page.svelte`, `lib/contestant/components/contactSupport/ContactSupport.svelte`, `nothingToEdit/NothingToEdit.svelte`; rule in `CLAUDE.md` § *Context Destructuring Rule*.

```svelte
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;                       // stable references
  const answersLocked = $derived(contestantCtx.answersLocked);  // reactive accessor: read through ctx
```

`appSettings`, `answersLocked`, `isAuthenticated`, `user`, `locale` **and the new flow state** are reactive accessors. `t`, `getRoute`, `logout`, `setPassword`, `requestSignInLink`, `checkInvitationCode` are stable.

### Redirect targets (every load, action and the callback)
**Source:** `ENTRY/login/+page.server.ts`, `routes/api/auth/callback/+server.ts`, `lib/routes/appGates.ts`.
A target is a route **key** through `buildRoute({ route, locale, … })`; a caller-supplied path passes `safeRedirectTarget` first and nothing else. Search-side values are passed raw ("the builder percent-encodes them"). No request to `account-access` carries a target, a URL, a path or text.

### The address block (E, F, password-reset)
**Source:** `lib/contestant/components/nothingToEdit/NothingToEdit.svelte` — anchor `class="font-bold [overflow-wrap:anywhere] hyphens-none"`.

```svelte
  {#if contestantCtx.user?.email}
    <dl class="my-lg text-center">
      <dt class="small-label">{t('contestantApp.nothingToEdit.signedInAs')}</dt>
      <dd
        class="font-bold [overflow-wrap:anywhere] hyphens-none"
        translate="no"
        data-testid="contestant-nothing-to-edit-email">
        {contestantCtx.user.email}
      </dd>
    </dl>
  {/if}
```

### The shaded entry frame (A, B, C, D1, D2, E, forgot-password, password-reset — not F)
**Source:** `ENTRY/forgot-password/+page.svelte` — `pageStyles.use({ drawer: { background: 'bg-base-300' } });`, `HeadingGroup` + `PreHeading` with `getContestantAppName({ appSettings: contestantCtx.appSettings, t })`. **Add `tabindex="-1"` to the `<h1>`**: `lib/utils/focusNavigationTarget.ts` focuses `[data-focus-on-nav]` or the first `h1`, and only `MainContent`'s default heading is focusable today.

### One answer, shown or not (B, C's email option, D1, D2's link, E, forgot-password, the function)
**Source:** `functions/account-access/index.ts` — "The answer is built before any work and returned without waiting for any of it" — and `contract.ts` `ACCEPTED_BODY`. On the screen side there is **no analog on the tree**: today's forgot-password page shows the outcome. The rule is D-11's and research Pitfall 6's — navigate on settlement whatever it was, word the screen from the origin alone.

### Server-decided view, rerun load (F, G)
**Source:** `lib/contestant/gates/TermsOfUseGate.svelte` — `await invalidateAll();` — and `ENTRY/(protected)/+layout.svelte` — `{@const GateView = GATE_VIEWS[data.gate]}` / `<GateView />`. Never a client flag that hides the view.

### Definer functions in SQL
**Source:** `schema/506-invitation-rpcs.sql`, `schema/301-auth-functions.sql`.
`LANGUAGE … SECURITY DEFINER` followed by `SET search_path = ''`; every relation schema-qualified; `(SELECT auth.uid())`, never a user id from an argument; an explicit `REVOKE EXECUTE … FROM PUBLIC, anon, …` and a `GRANT … TO` for exactly the role that calls; a header comment ending "SECURITY DEFINER because …".

### Logging without the subject
**Source:** `functions/account-access/linkIssue.ts` — `describeFailure` ("A failure's message can quote the address or the code it failed on, so it is never logged") and the frontend's `log.error(\`…: ${e?.message ?? 'No error message'}\`, { err: e })` in loads. No address, code, token, link or password in a log line, an error message or a test expectation's subject.

### Test-file headers
**Source:** `ENTRY/(protected)/layout.server.test.ts`, `termsOfUseLayout.svelte.test.ts`, `ContactSupport.svelte.test.ts`.
A header that says what is driven and how it is faked, then a numbered "What this file holds" list of the behaviours, each in bold; `vi.hoisted` for mocks used inside `vi.mock` factories ("Hoisted because `vi.mock`'s factory is lifted above every import"); assertions "on the DOM rather than on component state".

### E2E rigidity
**Source:** every fixture and spec named above. Hard assertions only; locators only through `testIds`; no locator in a spec body; routes through `utils/buildRoute`; messages read from the catalogue file; `mode: 'serial'` where tests share state; a teardown that asserts nothing is left.

### Comment hygiene for everything under `apps/`, `packages/`, `tests/`
**Source:** `CLAUDE.md` § *Comment Hygiene*. No history, no plan / decision / requirement ids, no `.planning/` paths, nothing addressed to a reviewer. The analogs marked **structure only** break this in their existing text; a comment that is *touched* must be made clean, and a *copied* one must not bring the breach along. `hygiene-grep-report.sh --assert-clean` gates the reference forms only — narrative is caught by reading.

## No Analog Found

| File | Role | Data Flow | Reason | Use instead |
|---|---|---|---|---|
| `lib/contestant/components/registrationModeSelector/RegistrationModeSelector.svelte` | component | event-driven | No one-of-many panel selector exists: `Expander` and `AccordionSelect` are not one, and no component renders a native radio `fieldset` with snippet panels. `QuestionChoices` uses `radio-primary` but is a question control. | `178-UI-SPEC.md` § S4 (markup, states C0–C7, accessibility) and `178-RESEARCH.md` § Pattern 4 (only the chosen panel in the DOM). Four-file shape and tests from `contactSupport/`. |
| `lib/contestant/components/emailSentPanel/EmailSentPanel.svelte` — the countdown and the status region | component | event-driven (timer) | No countdown computed from a press time, no `aria-disabled` button that stays a tab stop, and no polite status region spoken twice per cycle exist in the three component libraries. No spec uses `page.clock`. | UI-SPEC § S7; research Pitfall 4 (a margin beyond 60 s) and assumption A7 (`page.clock` in Playwright 1.63.0 is assumed, not measured). Static parts from `NothingToEdit.svelte`. |
| `private.registration_mode_allowed_in` / `private.registration_mode_allowed` | SQL function | transform | No SQL function reads the registration matrix; only `contestant_app_public_config` returns it raw. | Research § *Code Examples → The matrix rule with a pure core* (unrun) against `getEffectiveRegistrationModes`. |
| The screen side of "navigate whatever the answer" | route page | request-response | Every existing form shows its request's outcome. | D-11, research Pitfall 6. |
| A no-op send-email hook (J6, only if adopted) | SQL function + config | event-driven | The one configured hook, `custom_access_token_hook`, transforms claims; nothing on the tree is a no-op mail hook. | Research § J6 (desk only) and probe row P6. |

## For the planner to resolve

Found while mapping; each changes a file list or an anchor.

1. **`178-UI-SPEC.md` was written without the research** ("there is no `178-RESEARCH.md`") and is a draft being checked. They disagree in at least five places:
   - **Route keys:** UI-SPEC `ContestantAppSignIn` for B; research `ContestantAppLoginEmail`. Both agree on `ContestantAppRegisterEmail`, `ContestantAppRegisterSignIn`, `ContestantAppEmailSent`.
   - **Email syntax:** UI-SPEC lifts `EMAIL_REGEX` out of `Input.svelte` into a shared rule; research § *Don't Hand-Roll* says use the input's own `checkValidity()` and no regex. All forms are `novalidate` in the UI-SPEC, which removes the browser's bubble but not `checkValidity()`.
   - **F's logout:** UI-SPEC U-22 — G's plain `Button color="warning"`; research Pattern 1 and the context's table — `LogoutButton`.
   - **Where the signed-out scans live:** UI-SPEC U-26 — a new `contestant-entry-scan.spec.ts` (departing from D-22's letter); D-22 and research's test map — `contestant-a11y.spec.ts`. The tree supports U-26: `declareScans` refuses the login routes.
   - **When the flow state is cleared:** UI-SPEC U-03 and research Pattern 3 agree with each other and both depart from D-02's "when the link is requested".
2. **D-06 cannot be built as worded** (the helper is not executable by `authenticated` and is defined after `503`). The wrapper and the relocation need a home decision in `301` relative to the blanket `GRANT … ON ALL FUNCTIONS IN SCHEMA private`.
3. **"The 07 census does not grow"** is true for D-06 and false for the phase: the recovery eligibility function is a new **public** function called by the service role (and J6's hook function would be another). `07-rpc-security.test.sql` is also in 177-06.
4. **`_getBasicUserData` has Admin callers** (`lib/auth/getUserData.ts` behind `requireAdminIdentity`, two Admin pages). Whether `passwordSet` is filled on request only (research J1) decides the signature of `getBasicUserData` in `dataWriter.type.ts`, `universalDataWriter.ts` and both contexts.
5. **How F gets the address** (UI-SPEC N-4): gate views take no props and the load's gated return is `{ gate, user }`. Either the layout passes `data.user` to the view (a change to `+layout.svelte` and to `GATE_VIEWS`' component type) or the view reads `contestantCtx.user` — not established which is filled while gated.
6. **`invalidateAll()` after `setPassword`** (research RQ-3, A3) is unmeasured, and the tree's own reset page leaves by `window.location.href` because it distrusts the step. Probe row P4 before F's plan fixes its mechanism.
7. **D-21's `p_confirm_entity`** is not on the tree: Phase 177.1's directory is empty and `506-invitation-rpcs.sql` holds no such parameter. Seed through the `invitationFlow` steps only and state which signature the plan was written against.
8. **A "no mail" assertion after a page-made link request** has no witness. Decide the mechanism (a following witnessed request, as the contract spec's last test does) before writing the oracle cases.
9. **The stored passwordless session** for F's scans: its lifetime across a run is unmeasured, and `registerAndStoreSession` cannot make it.
10. **A raw-entry dark twin** does not exist outside `declareScans`; twenty entries need forty scans.
11. **J3's four rulings and the base dataset's organization row** decide whether file family 12 is "widen `base.ts` and three pins" or "a new perm template, setup and teardown in the serial chain".
12. **J5** decides whether `106-app-settings.sql`, file 38, `supabaseDataProvider.ts`, `301`'s "three fixed settings values" sentence and the pin in `perm-closed-project.spec.ts` are in the phase at all; **J6** decides the same for a hook function, a second `config.toml` change and a further row of the auth-config gate.
13. **`flowConformance.test.ts` pins "the one background function, which is the only caller of the link issue"** and the two `generateLink` types by reading `index.ts`. The recovery operation makes those sentences false as written; the plan that adds it rewrites them rather than working around them.
14. **The gate driver's `scope`** must be re-derived for this phase: 176's refuses the very paths 178 edits.
15. **Serial order with 177 and 177.1.** The schema step, `route.ts`, the context, the writer, `testIds.ts`, `playwright.config.ts`, `contestantApp.common.json`, `contestant-a11y.spec.ts` and `assert-a11y-scan-wiring.mjs` are all in 177 plans; `506-invitation-rpcs.sql`, `39-invitations.test.sql`, `invitationFlow.fixture.ts`, `invitation-contract.spec.ts` and the journey are in 177.1's reach. Every anchor above is the tree's at `ea9cb0483`.

## Metadata

**Analog search scope:** `apps/frontend/src/routes/contestant/`, `routes/api/auth/`, `lib/contestant/`, `lib/auth/`, `lib/routes/`, `lib/contexts/{contestant,auth}/`, `lib/api/`, `hooks.server.ts`; `apps/supabase/supabase/{schema,functions/account-access,tests/database}`, `config.toml`; `packages/dev-seed/{src/templates/e2e,tests}`; `packages/app-shared/src/settings/`; `tests/tests/{specs,fixtures,setup,utils}`, `tests/playwright.config.ts`; `scripts/`; the phase directories of 174, 174.1, 176 and 177.
**Files read in full or in the cited part:** 52. **Files located by search only:** about 40.
**Not read:** `lib/auth/sessionAdmission.ts`, `passwordLogin.ts` and `invitationCodeLogin.ts` beyond their signatures as quoted in the research; `174-gates.sh`, `174-bankauth.sh`, `174-stack-probe.sh` (existence checked, tracked); the settings page that calls `PasswordSetter`; `Input.svelte`; the docs pages.
**Pattern extraction date:** 2026-10-11
