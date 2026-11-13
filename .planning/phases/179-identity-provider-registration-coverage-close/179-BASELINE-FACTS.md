# Phase 179 — Baseline facts

Written by `tests/e2e-runs/179-unit/179-01-facts.sh` (gitignored) from the tree at head `3964d6efdb90ae11d316667393b6bc8420a897ba`, 2026-10-21T19:34:53Z.
Every line below is a command's output or a relation it checked. No plan reads a number from this file as a target.

## Base and baseline

- base commit (`179-BASE`): `320bd265bbd4fb6d28500c39e63c999514b3bc4e` — `git log -1 --format=%H -- . ':(exclude).planning'` gives `320bd265bbd4fb6d28500c39e63c999514b3bc4e`
- baseline directory (`179-BASELINE`): `tests/e2e-runs/179-e2e/179-01-baseline-r5`
- baseline head: `85cebaded3211810ed22a20eccfb760a240f3728`; tree-equal to the base outside `.planning/`: yes
- baseline wrapper exit: 0; void marker present: no
- baseline provenance: project:        <full default suite>
- baseline counts: total 548, passed 548, failed 0, flaky 0, skipped 0, did not run 0; void null; wall clock 12.8 min

### Tests per project in the baseline

| project | total | passed | failed | flaky | skipped | did not run |
|---|---|---|---|---|---|---|
| a11y-smoke | 16 | 16 | 0 | 0 | 0 | 0 |
| admin-access | 1 | 1 | 0 | 0 | 0 | 0 |
| auth-service-contract | 2 | 2 | 0 | 0 | 0 | 0 |
| auth-setup | 2 | 2 | 0 | 0 | 0 | 0 |
| cold-entry-dataroot | 3 | 3 | 0 | 0 | 0 | 0 |
| cold-entry-dataroot-contestant | 1 | 1 | 0 | 0 | 0 | 0 |
| contestant-a11y-scan | 30 | 30 | 0 | 0 | 0 | 0 |
| contestant-code-registration | 6 | 6 | 0 | 0 | 0 | 0 |
| contestant-email-registration | 11 | 11 | 0 | 0 | 0 | 0 |
| contestant-entity-selection | 8 | 8 | 0 | 0 | 0 | 0 |
| contestant-entry-phone | 20 | 20 | 0 | 0 | 0 | 0 |
| contestant-entry-scan | 29 | 29 | 0 | 0 | 0 | 0 |
| contestant-journey | 1 | 1 | 0 | 0 | 0 | 0 |
| contestant-password-recovery | 4 | 4 | 0 | 0 | 0 | 0 |
| contestant-terms-gate-phone | 2 | 2 | 0 | 0 | 0 | 0 |
| data-setup-admin-auth | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-base | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-contestant-journey | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-entity-selection | 3 | 3 | 0 | 0 | 0 | 0 |
| data-setup-passwordless-session | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-1e1cg1co | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-2e-asymmetric | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-2e-shared | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-access-disable | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-analytics-tracking | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-answers-locked | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-closed-project | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-contestant-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-disable-allow-open | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-disable-election-1co | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-disable-election-2co | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-disjoint-1co | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-header-show-help | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-hide-all-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-hide-category-tags | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-hide-election-tags | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-hide-hero | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-hide-if-missing-answers | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-interactive-info | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-localisation-positive | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-missing-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-no-nomination | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-not-located-2e2cg | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-org-matching | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-organization-editing | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-per-app-notifications | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-question-video | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-show-feedback-survey | 1 | 1 | 0 | 0 | 0 | 0 |
| data-setup-perm-startfromcg | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-admin-access | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-base | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-contestant-journey | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-entity-selection | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-passwordless-session | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-1e1cg1co | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-2e-asymmetric | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-2e-shared | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-access-disable | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-analytics-tracking | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-answers-locked | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-closed-project | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-contestant-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-disable-allow-open | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-disable-election-1co | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-disable-election-2co | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-disjoint-1co | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-header-show-help | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-hide-all-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-hide-category-tags | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-hide-election-tags | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-hide-hero | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-hide-if-missing-answers | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-interactive-info | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-localisation-positive | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-missing-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-no-nomination | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-not-located-2e2cg | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-org-matching | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-organization-editing | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-per-app-notifications | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-question-video | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-show-feedback-survey | 1 | 1 | 0 | 0 | 0 | 0 |
| data-teardown-perm-startfromcg | 1 | 1 | 0 | 0 | 0 | 0 |
| eperm07-term-trigger | 1 | 1 | 0 | 0 | 0 | 0 |
| invitation-contract | 15 | 15 | 0 | 0 | 0 | 0 |
| invitation-landing | 3 | 3 | 0 | 0 | 0 | 0 |
| performance | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-1e1cg1co | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-2e-asymmetric | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-2e-shared | 2 | 2 | 0 | 0 | 0 | 0 |
| perm-access-disable | 3 | 3 | 0 | 0 | 0 | 0 |
| perm-answers-locked | 5 | 5 | 0 | 0 | 0 | 0 |
| perm-closed-project | 18 | 18 | 0 | 0 | 0 | 0 |
| perm-contestant-nominations | 97 | 97 | 0 | 0 | 0 | 0 |
| perm-disable-allow-open | 3 | 3 | 0 | 0 | 0 | 0 |
| perm-disable-election-1co | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-disable-election-2co | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-disjoint-1co | 2 | 2 | 0 | 0 | 0 | 0 |
| perm-header-show-help | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-hide-all-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-hide-category-tags | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-hide-election-tags | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-hide-hero | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-hide-if-missing-answers | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-interactive-info | 4 | 4 | 0 | 0 | 0 | 0 |
| perm-localisation-positive | 2 | 2 | 0 | 0 | 0 | 0 |
| perm-missing-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| perm-no-nomination | 68 | 68 | 0 | 0 | 0 | 0 |
| perm-not-located-2e2cg | 5 | 5 | 0 | 0 | 0 | 0 |
| perm-org-matching | 3 | 3 | 0 | 0 | 0 | 0 |
| perm-organization-editing | 46 | 46 | 0 | 0 | 0 | 0 |
| perm-per-app-notifications | 2 | 2 | 0 | 0 | 0 | 0 |
| perm-question-video | 4 | 4 | 0 | 0 | 0 | 0 |
| perm-show-feedback-survey | 6 | 6 | 0 | 0 | 0 | 0 |
| perm-startfromcg | 6 | 6 | 0 | 0 | 0 | 0 |
| storage-cleanup | 3 | 3 | 0 | 0 | 0 | 0 |
| voter-alliance | 1 | 1 | 0 | 0 | 0 | 0 |
| voter-dark-mode | 1 | 1 | 0 | 0 | 0 | 0 |
| voter-journey | 2 | 2 | 0 | 0 | 0 | 0 |
| voter-journey-mobile | 1 | 1 | 0 | 0 | 0 | 0 |
| voter-nominations | 1 | 1 | 0 | 0 | 0 | 0 |
| voter-pageview-only | 1 | 1 | 0 | 0 | 0 | 0 |
| voter-prefs-tracking | 20 | 20 | 0 | 0 | 0 | 0 |
| voter-results-redraw | 5 | 5 | 0 | 0 | 0 | 0 |

Projects: 124.

## Freeze check (read at head `3964d6efdb90ae11d316667393b6bc8420a897ba`)

- `apps/supabase/supabase/migrations.manifest.json` is tracked
- baseline.file: `00001_initial_schema.sql`; migrations[0].file: `00001_initial_schema.sql`
- sha256 of `00001_initial_schema.sql` computed in Node equals migrations[0].sha256: yes
- migrations in the manifest: 1; highest version: 00001; the first migration of this phase takes 00002
- `git merge-base --is-ancestor 12c98aa5c HEAD`: exit 0
- `yarn assert:schema-migration-parity` (stdout to /dev/null; `yarn -s` fails on Yarn 4.18.1): exit 0
- `node scripts/assert-schema-migration-parity.mjs --write`: exit 1; then `git diff --quiet -- apps/supabase/supabase/migrations apps/supabase/supabase/migrations.manifest.json`: exit 0; untracked or changed paths there: 0

## The UI contract's round (Task 2 step 3)

- lines beginning with a ticked box between `## PROPOSED` and `## Checker Sign-Off`: 0
- lines beginning with a bold NOTE or EDIT marker there: 0
- frontmatter: `status: approved`
- items in the round: 24 (`**U-nn` headings); options marked ★ RECOMMENDED: 24

## Operator rulings as read

- `.planning/phases/179-identity-provider-registration-coverage-close/179-OPERATOR-ROUND` does not exist: no round document is named.
- the operator (2026-10-21): "I checked the context and ui specs and have nothing to add. The plan order is fine." — PL-01 accepted as built; the U/J round has no additions.
- J1: stands at the context's proposal (REG-05 (D-09):) by operator ruling 2026-10-21, item 2; the context carries no box for it.
- J2: stands at the context's proposal (the password fact and F (D-08):) by operator ruling 2026-10-21, item 2; the context carries no box for it.
- J3: stands at the context's proposal (identity-provider accounts never claim (X2 (a), D-06):) by operator ruling 2026-10-21, item 2; the context carries no box for it.
- J4: stands at the context's proposal (close `identity-callback` to server callers (D-03, D-17):) by operator ruling 2026-10-21, item 2; the context carries no box for it.
- J5: stands at the context's proposal (the function's project comes from the request (D-04):) by operator ruling 2026-10-21, item 2; the context carries no box for it.
- J6: stands at the context's proposal (how a returning identity's own entity is found (D-05):) by operator ruling 2026-10-21, item 2; the context carries no box for it.
- J7: stands at the context's proposal (the route names (Additional note 1, D-13):) by operator ruling 2026-10-21, item 2; the context carries no box for it.
- U-01: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (Where the entity-type choice sits.)
- U-02: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (What Try again opens.)
- U-03: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (CI2 when the provider's mode is no longer offered.)
- U-04: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (The weight of CI2's actions.)
- U-05: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (CI1's title.)
- U-06: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (CI1's frame.)
- U-07: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (The party's fields on CI1.)
- U-08: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (A party with no name while answers are locked.)
- U-09: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (The party's name left empty.)
- U-10: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (Where the pending reminder is shown.)
- U-11: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (Where "Use another email address" leads from the home.)
- U-12: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (`NothingToEdit` for an account with no address shown.)
- U-13: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (How a returning identity-provider user starts the provider's flow again.)
- U-14: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (F's first sentence.)
- U-15: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (Where the confirmation link lands.)
- U-16: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (A confirmation link whose address another account has taken)
- U-17: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 ("Send again" for the confirmation mail.)
- U-18: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (The words of C's provider panel.)
- U-19: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (Route names (the operator's J7).)
- U-20: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (The confirmation mail's text.)
- U-21: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (Scans.)
- U-22: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (Phone-width checks.)
- U-23: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (The Swedish `common.login`.)
- U-24: no box ticked and no NOTE or EDIT — built at its ★ (a) by operator ruling 2026-10-21, item 2 (Markers and names.)

## Names the plans build on (Task 2 step 5, read at head `3964d6efdb90ae11d316667393b6bc8420a897ba`)

`- found|MISSING | file | name | plans that depend on it`

- found | apps/supabase/supabase/schema/506-invitation-rpcs.sql | `public.claim_invitations` | 179-03
- found | apps/supabase/supabase/schema/506-invitation-rpcs.sql | `u.email_confirmed_at IS NOT NULL` | 179-03
- found | apps/supabase/supabase/schema/506-invitation-rpcs.sql | `public.invitation_link_request` | 179-03
- found | apps/supabase/supabase/schema/506-invitation-rpcs.sql | `public.invitation_link_release` | 179-03
- found | apps/supabase/supabase/schema/506-invitation-rpcs.sql | `private.invitation_throttle_take` | 179-03
- found | apps/supabase/supabase/schema/506-invitation-rpcs.sql | `-- service_role only. Each of the seven is SECURITY DEFINER` | 179-03
- found | apps/supabase/supabase/schema/503-entity-rpcs.sql | `public.get_user_entities` | 179-03, 179-08
- found | apps/supabase/supabase/schema/503-entity-rpcs.sql | `'password_set', private.caller_password_set()` | 179-03, 179-08
- found | apps/supabase/supabase/schema/301-auth-functions.sql | `private.caller_password_set` | 179-03, 179-08
- found | apps/supabase/supabase/schema/301-auth-functions.sql | `private.user_password_set` | 179-03, 179-08
- found | apps/supabase/supabase/schema/301-auth-functions.sql | `private.registration_mode_allowed_in` | 179-03, 179-08
- found | apps/supabase/supabase/tests/database/45-registration-mode-matrix.test.sql | (tracked file) | 179-03, 179-08
- found | apps/supabase/supabase/tests/database/07-rpc-security.test.sql | (tracked file) | 179-03, 179-08
- found | apps/supabase/supabase/tests/database/07-rpc-security.test.sql | `recovery_link_request` | 179-03, 179-08
- found | apps/supabase/supabase/functions/identity-callback/index.ts | `findUserByIdentityMatch` | 179-08, 179-09, 179-13
- found | apps/supabase/supabase/functions/identity-callback/index.ts | `@bank-auth.placeholder` | 179-08, 179-09, 179-13
- found | apps/supabase/supabase/functions/identity-callback/index.ts | `The entity type is named HERE and nowhere else` | 179-08, 179-09, 179-13
- found | apps/supabase/supabase/functions/identity-callback/candidateRecord.ts | `findExistingCandidate` | 179-08, 179-09, 179-13
- found | apps/supabase/supabase/functions/identity-callback/candidateRecord.ts | `createCandidate` | 179-08, 179-09, 179-13
- found | apps/supabase/supabase/functions/identity-callback/candidateRecord.ts | `deleteCandidate` | 179-08, 179-09, 179-13
- found | apps/supabase/supabase/functions/identity-callback/entityGrant.ts | `writeEntityGrant` | 179-08, 179-09, 179-13
- found | apps/supabase/supabase/functions/identity-callback/claimConfig.ts | `extractClaims: ['birthdate', 'hetu']` | 179-08, 179-09, 179-13
- found | apps/supabase/supabase/functions/account-access/contract.ts | `parseAccountAccessRequest` | 179-10
- found | apps/supabase/supabase/functions/account-access/contract.ts | `ACCEPTED_BODY` | 179-10
- found | apps/supabase/supabase/functions/account-access/linkIssue.ts | `LinkIssueDeps` | 179-10
- found | apps/supabase/supabase/functions/account-access/linkIssue.ts | `describeFailure` | 179-10
- found | apps/supabase/supabase/functions/account-access/signInLink.ts | `LINK_TYPES` | 179-10
- found | apps/supabase/supabase/functions/account-access/signInLink.ts | `buildSignInLink` | 179-10
- found | apps/supabase/supabase/functions/account-access/mailTemplates.ts | `RECOVERY_MAIL_TEMPLATES` | 179-10
- found | apps/supabase/supabase/functions/account-access/mailTemplates.ts | `renderRecoveryMail` | 179-10
- found | apps/supabase/supabase/functions/account-access/mailTemplates.ts | `SIGN_IN_MAIL_LOCALES` | 179-10
- found | apps/frontend/src/lib/contestant/gates/gates.ts | `CONTESTANT_GATES` | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/gates/gates.ts | `firstNeededGate` | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/gates/gates.ts | `'setPassword' | 'termsOfUse'` | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/gates/gateViews.ts | `GATE_VIEWS` | 179-06 to 179-19
- found | apps/frontend/src/lib/api/base/dataWriter.type.ts | `passwordSet: boolean` | 179-06 to 179-19
- found | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `_getBasicUserData` | 179-06 to 179-19
- found | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `parseCallerPasswordSet` | 179-06 to 179-19
- found | apps/frontend/src/lib/cookies/index.ts | `COOKIE` | 179-06 to 179-19
- found | apps/frontend/src/lib/cookies/index.ts | `idToken` | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/utils/oidcError.ts | `OIDC_ERROR` | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/utils/oidcError.ts | `upstreamOidcError` | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/utils/registrationOffer.ts | `listedRegistrationModes` | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/utils/registrationOffer.ts | `signInLinkOffered` | 179-06 to 179-19
- found | apps/frontend/src/lib/routes/route.ts | `ContestantAppPreregister` | 179-06 to 179-19
- found | apps/frontend/src/lib/routes/route.ts | `ContestantAppPreregisterIdentityProviderCallback` | 179-06 to 179-19
- found | apps/frontend/src/lib/routes/route.ts | `ContestantAppHome` | 179-06 to 179-19
- found | apps/frontend/src/lib/routes/route.ts | `ContestantAppRegister` | 179-06 to 179-19
- found | apps/frontend/src/lib/routes/appGates.ts | `entryRoutes` | 179-06 to 179-19
- found | apps/frontend/src/lib/analytics/pageviewRoutes.ts | `PAGEVIEW_ROUTES` | 179-06 to 179-19
- found | apps/frontend/src/lib/server/contestant/registrationGuard.ts | `refuseUnlessRegistrationOffered` | 179-06 to 179-19
- found | apps/frontend/src/lib/server/contestant/registrationGuard.ts | `isRegistrationOffered` | 179-06 to 179-19
- found | apps/frontend/src/routes/api/auth/callback/+server.ts | `REFUSED_TYPES` | 179-06 to 179-19
- found | apps/frontend/src/routes/api/auth/callback/+server.ts | `claimAndRefresh` | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte | (tracked file) | 179-06 to 179-19
- found | apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte | (tracked file) | 179-06 to 179-19
- found | packages/app-shared/src/settings/contestantAppConfig.ts | `SERVED_ENTITY_TYPES` | 179-07, 179-08, 179-16
- found | packages/app-shared/src/settings/contestantAppConfig.ts | `isRegistrationModeAllowed` | 179-07, 179-08, 179-16
- found | packages/app-shared/src/settings/contestantAppConfig.ts | `getEffectiveRegistrationModes` | 179-07, 179-08, 179-16
- found | packages/app-shared/src/settings/contestantAppConfig.ts | `isRegistrationModeAllowedForAnyType` | 179-07, 179-08, 179-16
- found | packages/app-shared/src/settings/contestantAppConfig.ts | `REGISTRATION_MODE` | 179-07, 179-08, 179-16
- found | tests/tests/support/mockOidcIssuer.ts | `IDURA_CLAIMS` | 179-04 to 179-06, 179-14
- found | tests/tests/support/mockOidcIssuer.ts | `createMockOidcIssuer` | 179-04 to 179-06, 179-14
- found | tests/tests/utils/mailedLink.ts | `MailedLinkType` | 179-04 to 179-06, 179-14
- found | tests/tests/utils/buildTestIdToken.ts | `DEFAULT_TOKEN_OPTS` | 179-04 to 179-06, 179-14
- found | tests/tests/utils/entryAxeScan.ts | `declareEntryScans` | 179-04 to 179-06, 179-14
- found | tests/playwright.config.ts | `'data-setup-bank-auth-journey'` | 179-04 to 179-06, 179-14
- found | tests/playwright.config.ts | `'bank-auth-journey'` | 179-04 to 179-06, 179-14
- found | tests/playwright.config.ts | `'bank-auth'` | 179-04 to 179-06, 179-14
- found | tests/playwright.config.ts | `'voter-prefs-tracking'` | 179-04 to 179-06, 179-14
- found | tests/playwright.config.ts | `'perm-closed-project'` | 179-04 to 179-06, 179-14
missing: 0

## Readers of the identity claims (Task 2 step 6, read at head `3964d6efdb90ae11d316667393b6bc8420a897ba`)

`git grep -n -I -E "(app_metadata|raw_app_meta_data)[^;]*(hetu|birthdate)" -- apps packages tests scripts`:

```text
apps/frontend/src/lib/api/utils/auth/providers/signicat.ts:36: * Keyed on `sub`, and it MUST NOT be keyed on `birthdate`, which is NOT an identifier: the Edge Function twin of this config (`identity-c
apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts:191: * `matchValue` is not a display field: the Edge Function writes it to `app_metadata.identity_match_value` (the key `findUser
tests/tests/specs/contestant/contestant-bank-auth.spec.ts:188:    expect(user?.app_metadata?.hetu).toBe(TEST_IDENTITY.hetu);
tests/tests/specs/contestant/contestant-bank-auth.spec.ts:189:    expect(user?.app_metadata?.birthdate).toBe(TEST_IDENTITY.birthdate);
```

`git grep -n -I -E "hetu|birthdate" -- apps/supabase/supabase/schema apps/supabase/supabase/tests packages/dev-seed/src`: 0 line(s).

```text
```

Reading: the only code that reads either key from `app_metadata` is the pair of assertions in `tests/tests/specs/contestant/contestant-bank-auth.spec.ts` (179-13 removes the keys and so reaches them); the two other hits are doc comments (`signicat.ts`, `claimConfig.test.ts`) that name `birthdate` as a key not to match on and read nothing. No schema object, pgTAP file or seed template names either key.

## Recorded counts (Task 2 step 7, read at head `3964d6efdb90ae11d316667393b6bc8420a897ba`)

- pgTAP files: highest number `47`; the next free number is `48`
- message keys per catalogue (the command of `179-UI-SPEC.md` § *Arithmetic*, per locale):
  - `da`: 744
  - `en`: 744
  - `et`: 744
  - `fi`: 744
  - `fr`: 744
  - `lb`: 744
  - `sv`: 744
  - the seven agree: yes
- the suite's tags (`npx playwright test -c tests/playwright.config.ts --list --reporter=json --grep-invert @probe`, each test's `tags`):

```text
tests listed: 548 untagged: 473
tags: {"perf":1,"contestant-session":1,"nomination-definition":72,"candidate":1}
projects: {"auth-setup":2,"performance":1,"a11y-smoke":16,"contestant-a11y-scan":30,"data-setup-base":1,"data-teardown-base":1,"voter-journey":2,"eperm07-term-trigger":1,"voter-pageview-only":1,"cold-entry-dataroot":3,"cold-entry-dataroot-contestant":1,"voter-dark-mode":1,"voter-journey-mobile":1,"voter-alliance":1,"voter-nominations":1,"voter-results-redraw":5,"storage-cleanup":3,"auth-service-contract":2,"invitation-contract":15,"invitation-landing":3,"contestant-email-registration":11,"contestant-code-registration":6,"contestant-password-recovery":4,"contestant-entry-scan":29,"data-setup-passwordless-session":1,"data-teardown-passwordless-session":1,"contestant-terms-gate-phone":2,"contestant-entry-phone":20,"data-setup-perm-1e1cg1co":1,"data-teardown-perm-1e1cg1co":1,"perm-1e1cg1co":1,"data-setup-perm-2e-shared":1,"data-teardown-perm-2e-shared":1,"perm-2e-shared":2,"data-setup-perm-2e-asymmetric":1,"data-teardown-perm-2e-asymmetric":1,"perm-2e-asymmetric":1,"data-setup-perm-startfromcg":1,"data-teardown-perm-startfromcg":1,"perm-startfromcg":6,"data-setup-perm-disjoint-1co":1,"data-teardown-perm-disjoint-1co":1,"perm-disjoint-1co":2,"data-setup-perm-disable-election-1co":1,"data-teardown-perm-disable-election-1co":1,"perm-disable-election-1co":1,"data-setup-perm-disable-election-2co":1,"data-teardown-perm-disable-election-2co":1,"perm-disable-election-2co":1,"data-setup-perm-not-located-2e2cg":1,"data-teardown-perm-not-located-2e2cg":1,"perm-not-located-2e2cg":5,"data-setup-contestant-journey":1,"data-teardown-contestant-journey":1,"contestant-journey":1,"data-setup-entity-selection":3,"data-teardown-entity-selection":1,"contestant-entity-selection":8,"data-setup-perm-access-disable":1,"data-teardown-perm-access-disable":1,"perm-access-disable":3,"data-setup-perm-per-app-notifications":1,"data-teardown-perm-per-app-notifications":1,"perm-per-app-notifications":2,"data-setup-perm-missing-nominations":1,"data-teardown-perm-missing-nominations":1,"perm-missing-nominations":1,"data-setup-perm-localisation-positive":1,"data-teardown-perm-localisation-positive":1,"perm-localisation-positive":2,"data-setup-perm-answers-locked":1,"data-teardown-perm-answers-locked":1,"perm-answers-locked":5,"data-setup-perm-hide-hero":1,"data-teardown-perm-hide-hero":1,"perm-hide-hero":1,"data-setup-perm-show-feedback-survey":1,"data-teardown-perm-show-feedback-survey":1,"perm-show-feedback-survey":6,"data-setup-perm-header-show-help":1,"data-teardown-perm-header-show-help":1,"perm-header-show-help":1,"data-setup-perm-hide-all-nominations":1,"data-teardown-perm-hide-all-nominations":1,"perm-hide-all-nominations":1,"data-setup-perm-hide-if-missing-answers":1,"data-teardown-perm-hide-if-missing-answers":1,"perm-hide-if-missing-answers":1,"data-setup-perm-hide-election-tags":1,"data-teardown-perm-hide-election-tags":1,"perm-hide-election-tags":1,"data-setup-perm-hide-category-tags":1,"data-teardown-perm-hide-category-tags":1,"perm-hide-category-tags":1,"data-setup-perm-disable-allow-open":1,"data-teardown-perm-disable-allow-open":1,"perm-disable-allow-open":3,"data-setup-perm-question-video":1,"data-teardown-perm-question-video":1,"perm-question-video":4,"data-setup-perm-interactive-info":1,"data-teardown-perm-interactive-info":1,"perm-interactive-info":4,"data-setup-perm-org-matching":1,"data-teardown-perm-org-matching":1,"perm-org-matching":3,"data-setup-perm-organization-editing":1,"data-teardown-perm-organization-editing":1,"perm-organization-editing":46,"data-setup-perm-no-nomination":1,"data-teardown-perm-no-nomination":1,"perm-no-nomination":68,"data-setup-perm-contestant-nominations":1,"data-teardown-perm-contestant-nominations":1,"perm-contestant-nominations":97,"data-setup-perm-analytics-tracking":1,"data-teardown-perm-analytics-tracking":1,"voter-prefs-tracking":20,"data-setup-admin-auth":1,"data-teardown-admin-access":1,"admin-access":1,"data-setup-perm-closed-project":1,"data-teardown-perm-closed-project":1,"perm-closed-project":18}
```

## The reading script on a document whose answers are known (Task 2 step 2)

- `node .planning/phases/179-identity-provider-registration-coverage-close/179-read-rulings.mjs .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md CD`: exit 0
- the same with `F`: exit 1; halted items: 1
