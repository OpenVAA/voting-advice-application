---
phase: 168-docs-site-rewrite-strapi-to-supabase
plan: 06
subsystem: docs-content
status: complete
tags: [docs, candidate-app, invite-candidate, identity-callback, oidc, bank-auth, admin-app, app-settings, claims-ledger, d-18]

requires:
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-02: the eight pages at their final URLs with their final H1s; redirect stubs for candidate-user-management/* and llm-features"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-01: validate-links --check/--scope/--only, check-claims.mjs ledger/commands, base-rev.txt"
  - phase: 166-retire-auth-user-id-entity-identity-from-grants
    provides: "the editor grant as the only user-to-entity link; invite-candidate writes only the grant; identity-callback finds candidates by grant"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-03 F2/F3 (invite-candidate has no UI caller; complete-registration has no page) and 168-04 F7 (no Admin App customization editor), carried into this plan's findings"
provides:
  - "Pre-registration and invitation: invite-candidate's caller, the user_can authority check, the numbered steps with both rollbacks, the auth callback and the set-password invite branch, plus a bank-auth paragraph"
  - "Registration: the invitation path to first sign-in and the registration-key method as the declared contract the Supabase adapter throws for (D-18)"
  - "Login and password reset: the login action, the protected loader's errors, the live session-based reset flow, the redirect allow-list and logout"
  - "Bank authentication (OIDC): both providers, the six-step flow, frontend token verification, identity-callback's seven steps, env names only, key-generation link"
  - "Password validation: the seven requirements with thresholds; the Admin app: access, three tools, the job model, the three packages"
  - "Both app-settings pages re-derived from DynamicSettings (53 key paths with defaults), storage in app_settings.settings and the top-level-key merge"
  - "168-06-CLAIMS.md: 13 page verdicts, 536 content-anchored claims, Key coverage (53 paths, AST-checked), findings F1-F11, no sweep exceptions"
affects: [168-07, 168-08]

estimate:
  tokens: 75000
actuals:
  tokens: 54700
  tasks: 3
  commits: 3
plan_head_before: 4cb7bf5f392221525717761130575b6303c18410
plan_head_after: 91d4cd381cd3f7281c089de788a7bec62fed4764

tech-stack:
  added: []
  patterns:
    - "Claims rows generated from a scratchpad Python list (page, kind, claim, file, anchor) that asserts no pipe or backtick in an anchor, then re-checked by check-claims ledger"
    - "D-06 key coverage counted twice: by hand from the type, and by a TypeScript-AST walk of the DynamicSettings alias diffed against the table"

key-files:
  created:
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-06-CLAIMS.md
  modified:
    - "apps/docs/src/routes/(content)/developers-guide/candidate-app/pre-registration-and-invitation/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/candidate-app/registration/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/candidate-app/login-and-password-reset/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/candidate-app/bank-authentication/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/candidate-app/password-validation/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/admin-app/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md"
    - "apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md"

key-decisions:
  - "password-reset-code-method.md: the reset page's ?code= branch is not reachable from any in-repo path (the only redirect to CandAppResetPassword is the callback's recovery case, which passes no code); leave the todo open for a code phase (F1)"
  - "register-page-registrationkey-method.md: close as superseded by the 2026-09-15 registration refactor todo, whose own header says so; Registration documents the key method only as the throwing contract (F2)"
  - "The live reset flow is documented as calling setPassword, not _resetPassword as the plan said; the session branch of password-reset/+page.svelte calls setPassword"
  - "App settings document the real merge: static, then dynamic defaults, then the stored column, each replacing by top-level key; both pages tell the reader to store whole top-level groups (F11)"
  - "The Key coverage table counts 53 key paths: every property whose type is not an inline object, plus the four NotificationData fields under each notifications key"

patterns-established:
  - "A behaviour the code shows but a docs reader could trip on (no UI caller, a missing redirect target, a discarded request body) is stated on the page 'at the time of writing' and carried as a finding, never fixed (D-18)"

requirements-completed: []

coverage:
  - id: D1
    description: "Pre-registration and invitation describes the post-166 invite flow, each step attributed to the Edge Function or server route that performs it, with no Strapi, registrationKey or auth_user_id"
    requirement: "DOCS-05"
    verification:
      - kind: other
        ref: "Task 1 <verify> blocks (validate:links --check --scope …/pre-registration-and-invitation 0 findings; check-claims ledger; check-claims commands; prettier --check; nohit strapi|1337|registrationKey|auth_user_id; H1 check) exit 0, re-run on the committed tree for the tracer gate"
        status: pass
    human_judgment: false
  - id: D2
    description: "Registration, Login and password reset, Bank authentication, Password validation and Admin app are written from the code; both D-18 questions answered with anchors"
    requirement: "DOCS-05"
    verification:
      - kind: other
        ref: "Task 2 <verify> blocks over the five pages (links 0 findings, ledger, commands, prettier; nohit Strapi/1337/auth_user_id/private-key header; nohit JWT-shaped value; both todo names present in 168-06-CLAIMS.md) exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both app-settings pages match DynamicSettings key for key (53 paths with defaults), link the type file, and the #customization anchor is fixed"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "AST derivation of DynamicSettings key paths diffs empty against the Key coverage table (53); per-row grep of the full key path on the developers' page and of the last segment on the publishers' page (0 missing); validate:links --check --only anchor --scope /publishers-guide/app-settings exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "All eight pages pass every page gate: scoped link check (0 findings), claims ledger (536 rows), command resolution (2 commands), prettier, D-21 and D-17 sweeps, no docker hit"
    requirement: "DOCS-03"
    verification:
      - kind: other
        ref: "Task 3 <verify> block 1 (exit 0) and block 2 (exit 0); docs build (exit 0); docs check (653 files, 0/0); check:research-quotes two-base form (exit 0); no product file in 4cb7bf5f3..HEAD"
        status: pass
    human_judgment: false
  - id: D5
    description: "Claims ledger: 536 content-anchored rows, 13 page verdicts, Key coverage, findings F1-F11"
    requirement: "DOCS-04"
    verification:
      - kind: other
        ref: "node scripts/check-claims.mjs ledger 168-06-CLAIMS.md (exit 0, 536 rows)"
        status: pass
    human_judgment: true
    rationale: "Anchors prove each cited literal exists; whether every sentence reads its anchor correctly, and whether F1/F6/F7 become todos, is the 168-08 verifier's and operator's call (D-09)"

duration: 30min
completed: 2026-10-02
---

# Phase 168 Plan 06: Candidate app, Admin app and app settings Summary

**The Candidate app section now describes the post-166 grant-only flows from the code. The Admin app page covers its gate and three LLM tools. Both app-settings pages list all 53 `DynamicSettings` key paths with their defaults and explain how a project's stored settings replace them by top-level key.**

The pages are anchored by 536 claims that a script re-checks. Both D-18 todo questions were settled by reading the code.

## Performance

- **Duration:** about 30 min
- **Started:** 2026-10-02T11:29:12Z
- **Completed:** 2026-10-02T11:59:30Z
- **Tasks:** 3 of 3
- **Files modified:** 9 (8 pages, 1 claims ledger)

## Accomplishments

### Pre-registration and invitation (tracer)

- **Account model:** a candidate account is an auth user with an `(entity, candidate, <id>, editor)` grant. The app finds the candidate through `get_candidate_user_data` and `private.caller_entity_ids`.
- **Invitation:**
  - **Request:** a `POST` with four fields and the caller's token.
  - **Caller:** `_preregister` through `preregisterWithApiToken`. No route or component calls it.
  - **Authority:** `user_can` with `project.edit_entities`, asked through the caller's own client. The responses are 401 and 403.
  - **Steps:** the candidate row, then `inviteUserByEmail` with `SITE_URL`, with the candidate deleted if the invite fails. Then `writeEntityGrant`, with `rollbackInvite` if the grant fails. The function returns 201.
  - **Nomination:** the candidate cannot sign in until nominated (`candidateNoNomination`).
- **Email link:** the auth callback (`token_hash` + `type` → `verifyOtp` → `CandAppSetPassword`).
  - The `complete-registration` target has no page.
  - The E2E tests bypass the auth server's redirect (`toCallbackUrl`).
- **Set password:** the page's invite branch.
- **Bank authentication:** one paragraph.
- **Tracer gate:** the run is interactive in `end-of-phase` mode, and the `<verify>` is automated only. Both blocks passed again on the committed tree before expansion.

### Registration

- The invitation path to the first sign-in:
  1. The callback.
  2. `setPassword`.
  3. Back to login, with the reason the code gives.
  4. The terms of use (`terms_of_use_accepted`).
  5. The home page.
- The `answersLocked` lock on the register pages.
- `checkRegistrationKey` and `register` appear only as the declared contract:
  - The page quotes the Supabase adapter's thrown message.
  - It notes that `_register` ignores the key.
  - It has no instruction to use a key and no proposal to remove the method.

### Login and password reset

- **Login:** the form action and `passwordLogin`, which returns 400, 500 or 403 and checks `CANDIDATE_GRANTS` and `redirectTo`. The protected loader has four `errorMessage` values.
- **Reset:** only the live session-based flow.
  1. `forgot-password` calls `resetPasswordForEmail`, with the locale-prefixed callback as `redirectTo`.
  2. The callback runs `verifyOtp` with `type=recovery`.
  3. `password-reset` calls `setPassword` and then does a full page load.
- **Configuration:** the redirect allow-list in `config.toml`.
- **Other:** changing the password on the settings page, and logout (the server route, then the client, then reset).

### Bank authentication (OIDC)

- **Providers:** `idura-ftn` (JAR, `private_key_jwt`, `state`) and `signicat-ftn` (PKCE, client secret).
- **Flow, in six steps:** authorize, callback, choices, submit, account, session. Every token-handling step is attributed to a server route or to the Edge Function.
- **Frontend token check:** decrypt, verify, and require the audience and issuer.
- **`identity-callback`:** seven steps.
- **Configuration:**
  - the frontend and Edge Function env names, as names only;
  - `yarn check:env-local`;
  - a link to `docs/key-generation.md`.
- **Testing:** pointers to the tests and the runbook.
- **Not done yet, stated as such:** the request body is discarded, and the nonce is not verified.

### Password validation

- Kept the page as it was and fixed the step-4 call names.
- Added:
  - a table of the seven requirements (length 8, repetition 4, and the others);
  - that `PasswordSetter` passes no username;
  - the local Supabase password policy (6 characters, no character classes).

### Admin app

- **Access:** `supportsAdminApp` and `access.adminApp`, the admin login with `ADMIN_GRANTS`, the protected `admin` role, and the verified-session gate on actions and job endpoints.
- **Role resolution:** candidate grants are tested first (F6).
- **Not there:** no settings or customization editor.
- **Tools:** the three tool routes. The factor-analysis link is disabled and has no page.
- **Jobs:**
  - each runs with the admin's own session;
  - results go to `custom_data`;
  - they need `LLM_OPENAI_API_KEY`;
  - running jobs are kept in memory;
  - finished jobs are written to `admin_jobs`.
- **Packages:** links to the three packages.

### App settings (both pages, D-06)

- **Developers' page:**
  - **Storage:** `app_settings.settings`, validated by `StoredSettingsSchema` (strict, with partial preserve at the top level), with notification localization.
  - **No settings row:** the `project_open_for_voters` rule.
  - **Read access.**
  - **Merging:** static, then dynamic defaults, then the stored settings, each replacing by top-level key.
  - **Editing:** there is no Admin App editor.
  - **Keys:** a table of all 53 keys with their defaults.
  - **New settings:** a step for adding the key to `StoredSettingsSchema`.
- **Publishers' page:**
  - Kept its prose and H1. Removed the banner and the Strapi instructions.
  - Fixed: the `#customization` anchor, `candidates` → `children`, `submatches`, the per-entity `showMissing*`, and the `showSurveyPopup` condition.
  - Added: alliances, `results.sections` values, `preRegistration.enabled`, every default, and the whole-group warning.

## Task Commits

1. **Task 1 (tracer): Pre-registration and invitation**, `59496f9a7` (docs)
2. **Task 2: Registration, Login and password reset, Bank authentication, Password validation, Admin app**, `85436fe9d` (docs)
3. **Task 3: both app-settings pages and the Key coverage table**, `91d4cd381` (docs)

**Plan metadata:** the docs commit that adds this summary.

## Files Created/Modified

- `apps/docs/src/routes/(content)/developers-guide/candidate-app/{pre-registration-and-invitation,registration,login-and-password-reset,bank-authentication,password-validation}/+page.md`: the Candidate app section
- `apps/docs/src/routes/(content)/developers-guide/admin-app/+page.md`: the Admin app
- `apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md`: the developers' settings reference
- `apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md`: the publishers' settings guide
- `.planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-06-CLAIMS.md`: verdicts, claims, findings, sweep exceptions, Key coverage

## Decisions Made

See `key-decisions` in the frontmatter. Three of them change what a reader does:

- **The reset page's code branch is dead.** No in-repo link reaches the reset page with `?code=`, so the page documents only the session flow. The residual question is about the callback, not the page.
- **Stored settings replace whole groups.** Changing one member of a group means storing the whole group.
- **Pre-registration does not keep the candidate's choices.** At the time of writing, the email address and nominations a candidate enters are dropped. An existing todo tracks this.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] The live reset flow calls `setPassword`, not `_resetPassword`**
- **Found during:** Task 2
- **Issue:** The plan's brief says "`_resetPassword` sets the new password on the session". The session branch of `password-reset/+page.svelte` calls `setPassword`. Only the dead `?code=` branch calls `resetPassword`.
- **Fix:** The page and claims rows #131 and #132 document `setPassword`. F1 records the dead branch.
- **Committed in:** `85436fe9d`

**2. [Rule 1 - Accuracy] `preRegistration.enabled` is a dynamic app setting, not a static one**
- **Found during:** Task 1
- **Issue:** The merged source page called it a static setting. `DynamicSettings` declares it, and the pre-registration layout reads it from `app_settings`.
- **Fix:** The pages call it an app setting, and the verdict row records the correction.
- **Committed in:** `59496f9a7`

**3. [Rule 1 - Accuracy] Password validation step 4, and the inert username rule**
- **Found during:** Task 2
- **Issue:** Step 4 said each page calls `register`, `resetPassword` or `setPassword`. The live pages call `setPassword`, and `PasswordSetter` passes no username.
- **Fix:** The page corrects step 4, adds the requirements table, and states the username behaviour (F8).
- **Committed in:** `85436fe9d`

### Other deviations

**4. [Convention] Commit subjects use `docs[docs]:`, not the plan's `docs(docs):`.** This follows the contributing guide's bracketed form, as in 168-01, 168-02, 168-04 and 168-05.

**5. [Scope] The Key coverage table includes the `NotificationData` fields.** The plan asks for "the nested types it references", so the table has the four fields under each `notifications` key, giving 53 paths. The caption states the counting rule.

---

**Total deviations:** 3 auto-fixed (accuracy), 2 other (convention, counting rule).
**Impact on plan:** None on scope. Only the plan's eight pages and its claims file were touched, and no product file changed (`git log --name-only 4cb7bf5f3..HEAD -- apps/frontend apps/supabase packages` prints nothing).

## Issues Encountered

None blocking. The findings are in `168-06-CLAIMS.md` § Findings for todos, and none was fixed (D-18):

- **F1 (`password-reset-code-method.md`):** the code branch is not reachable. Leave the todo open. The residual question is whether a default-template recovery or invite email, sent through the auth server's verify redirect, reaches the callback in a form it accepts. This is UNCONFIRMED; it was not run.
- **F2 (`register-page-registrationkey-method.md`):** close as superseded.
- **F3 and F4:** cross-references to 168-03 F3 and F2.
- **F5:** the pre-registration route discards the candidate's choices. An existing todo tracks it.
- **F6:** an admin who also holds a candidate grant cannot use the Admin App. This is UNCONFIRMED; it was read, not run.
- **F7:** the OIDC nonce is not verified. No todo tracks it.
- **F8:** the username rule never fires.
- **F9:** there is no settings or customization editor (cross-reference to 168-04 F7).
- **F10:** the stale `analytics.survey` doc comment.
- **F11:** the settings merge replaces whole top-level groups, which is the code's own TODO.

## Known Stubs

None. Every page is fully written, with no placeholder or TODO text.

## User Setup Required

None.

## Next Phase Readiness

- 168-08 can:
  - copy the 13 verdicts into `168-DOCS-AUDIT.md`;
  - annotate `password-reset-code-method.md` with F1 and leave it open;
  - close `register-page-registrationkey-method.md` with F2;
  - decide which of F6, F7, F8, F10 and F11 become todos.
- There are no sweep exceptions to copy.
- DOCS-01, DOCS-03 and DOCS-04 stay Pending, because they are shared with sibling plans. DOCS-05 also stays Pending, because 168-08 owns the todo closures it names.

## Self-Check: PASSED

- **Files:** all 8 pages and `168-06-CLAIMS.md` are present.
- **Commits:** `59496f9a7`, `85436fe9d` and `91d4cd381` are present.
- **Commit count:** `git rev-list --count 4cb7bf5f3..HEAD` = 3 before the metadata commit.
- **Plan-level verification at `91d4cd381`,** each exit status read directly:
  - Task 3 verify block 1 = 0 (links 0 findings, ledger 536 rows, 2 commands, prettier clean).
  - Task 3 verify block 2 = 0.
  - The anchor-only link check on `/publishers-guide/app-settings` = 0.
  - The Key coverage AST diff is empty.
  - Docs `build` = 0.
  - Docs `check` = 0 (653 files, 0/0).
  - `check:research-quotes` (two-base form) = 0.
  - The product-code log is empty.

---
*Phase: 168-docs-site-rewrite-strapi-to-supabase*
*Completed: 2026-10-02*
