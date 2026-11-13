# Phase 178 — baseline facts

Written by `facts.sh` of plan 178-01 (a script kept outside the repository), not by hand. Every value is
the output of a command run on the tree at head `4ba1b1b1437dc9181afc0e95d2ca9b7782561693`.
**This file is a record. No plan reads a number from it as a target.**

## The base commit

`git log -1 --format=%H -- . ':(exclude).planning'`, as recorded in `178-BASE`:

```
06d81c75e5b1acda70031018715e88fa45158feb
06d81c75e  2026-10-11 16:37:08 +0200  docs(177): an edit by the entity's user hides a confirmed nomination until it is confirmed again; the stored parent's id is what a card starts from
```

## The baseline run

- directory (`178-BASELINE`): `tests/e2e-runs/178-e2e/178-01-baseline`
- head: `89c8420671942dcae164fab078ae508c69cf80e2` — tree-equal to the base commit outside `.planning/`: yes
- started: 2026-10-12T15:59:24Z
- ended: 2026-10-12T16:12:18Z
- wrapper status (`exit`): 0; void marker: none
- provenance: `project: <full default suite>`
- preflight: 1 success(es), 0 failure(s)
- Docker VM free space before it: 16.12 GiB (the driver's record, after its own builder prune)
- **made by plan 178-01 with `178-e2e.sh`**, because Phase 177's closing run is complete and green but not of this tree:
  its directory is `tests/e2e-runs/177-e2e/177-21-final`, its head `f71107820caf69496e8bd956b9ade9caf503577f`, and `git diff --stat <that head> <base> -- . ':(exclude).planning'` prints:

  ```
   .../developers-guide/contestant-app/defining-nominations/+page.md       | 2 +-
   .../publishers-guide/preparing/candidates-and-parties-data-be/+page.md  | 2 +-
   2 files changed, 2 insertions(+), 2 deletions(-)
  ```

The sentence of `177-21-SUMMARY.md` that names Phase 177's closing run:

> ### The full run — `tests/e2e-runs/177-e2e/177-21-final`, head `f71107820`

### Counts

```
total 444, passed 444, failed 0, flaky 0, skipped 0, didNotRun 0
projects: 116
```

### Per-project totals (`summary.json` → `byProject`)

```
  16  a11y-smoke
   1  admin-access
   2  auth-service-contract
   2  auth-setup
   3  cold-entry-dataroot
   1  cold-entry-dataroot-contestant
  24  contestant-a11y-scan
   8  contestant-entity-selection
   1  contestant-journey
   2  contestant-terms-gate-phone
   1  data-setup-admin-auth
   1  data-setup-base
   1  data-setup-contestant-journey
   3  data-setup-entity-selection
   1  data-setup-perm-1e1cg1co
   1  data-setup-perm-2e-asymmetric
   1  data-setup-perm-2e-shared
   1  data-setup-perm-access-disable
   1  data-setup-perm-analytics-tracking
   1  data-setup-perm-answers-locked
   1  data-setup-perm-closed-project
   1  data-setup-perm-contestant-nominations
   1  data-setup-perm-disable-allow-open
   1  data-setup-perm-disable-election-1co
   1  data-setup-perm-disable-election-2co
   1  data-setup-perm-disjoint-1co
   1  data-setup-perm-header-show-help
   1  data-setup-perm-hide-all-nominations
   1  data-setup-perm-hide-category-tags
   1  data-setup-perm-hide-election-tags
   1  data-setup-perm-hide-hero
   1  data-setup-perm-hide-if-missing-answers
   1  data-setup-perm-interactive-info
   1  data-setup-perm-localisation-positive
   1  data-setup-perm-missing-nominations
   1  data-setup-perm-no-nomination
   1  data-setup-perm-not-located-2e2cg
   1  data-setup-perm-org-matching
   1  data-setup-perm-organization-editing
   1  data-setup-perm-per-app-notifications
   1  data-setup-perm-question-video
   1  data-setup-perm-show-feedback-survey
   1  data-setup-perm-startfromcg
   1  data-teardown-admin-access
   1  data-teardown-base
   1  data-teardown-contestant-journey
   1  data-teardown-entity-selection
   1  data-teardown-perm-1e1cg1co
   1  data-teardown-perm-2e-asymmetric
   1  data-teardown-perm-2e-shared
   1  data-teardown-perm-access-disable
   1  data-teardown-perm-analytics-tracking
   1  data-teardown-perm-answers-locked
   1  data-teardown-perm-closed-project
   1  data-teardown-perm-contestant-nominations
   1  data-teardown-perm-disable-allow-open
   1  data-teardown-perm-disable-election-1co
   1  data-teardown-perm-disable-election-2co
   1  data-teardown-perm-disjoint-1co
   1  data-teardown-perm-header-show-help
   1  data-teardown-perm-hide-all-nominations
   1  data-teardown-perm-hide-category-tags
   1  data-teardown-perm-hide-election-tags
   1  data-teardown-perm-hide-hero
   1  data-teardown-perm-hide-if-missing-answers
   1  data-teardown-perm-interactive-info
   1  data-teardown-perm-localisation-positive
   1  data-teardown-perm-missing-nominations
   1  data-teardown-perm-no-nomination
   1  data-teardown-perm-not-located-2e2cg
   1  data-teardown-perm-org-matching
   1  data-teardown-perm-organization-editing
   1  data-teardown-perm-per-app-notifications
   1  data-teardown-perm-question-video
   1  data-teardown-perm-show-feedback-survey
   1  data-teardown-perm-startfromcg
   1  eperm07-term-trigger
  15  invitation-contract
   3  invitation-landing
   1  performance
   1  perm-1e1cg1co
   1  perm-2e-asymmetric
   2  perm-2e-shared
   3  perm-access-disable
   4  perm-answers-locked
  11  perm-closed-project
  97  perm-contestant-nominations
   3  perm-disable-allow-open
   1  perm-disable-election-1co
   1  perm-disable-election-2co
   2  perm-disjoint-1co
   1  perm-header-show-help
   1  perm-hide-all-nominations
   1  perm-hide-category-tags
   1  perm-hide-election-tags
   1  perm-hide-hero
   1  perm-hide-if-missing-answers
   4  perm-interactive-info
   2  perm-localisation-positive
   1  perm-missing-nominations
  68  perm-no-nomination
   5  perm-not-located-2e2cg
   3  perm-org-matching
  46  perm-organization-editing
   2  perm-per-app-notifications
   4  perm-question-video
   6  perm-show-feedback-survey
   6  perm-startfromcg
   3  storage-cleanup
   1  voter-alliance
   1  voter-dark-mode
   2  voter-journey
   1  voter-journey-mobile
   1  voter-nominations
   3  voter-prefs-tracking
   5  voter-results-redraw
```

## The names of Phases 171 to 177, each read on the tree at `4ba1b1b1437dc9181afc0e95d2ca9b7782561693`

`found` means the tracked file holds the name in the form given. A name that is absent is `MISSING`, with
the plans of this phase that depend on it; one such line halts the phase at plan 178-01.

- found: `private.user_password_set` in `apps/supabase/supabase/schema/506-invitation-rpcs.sql` (plans 178-04 to 178-06)
- found: `public.invitation_code_status` in `apps/supabase/supabase/schema/506-invitation-rpcs.sql` (plans 178-04 to 178-06)
- found: `public.invitation_link_request` in `apps/supabase/supabase/schema/506-invitation-rpcs.sql` (plans 178-04 to 178-06)
- found: `public.invitation_link_release` in `apps/supabase/supabase/schema/506-invitation-rpcs.sql` (plans 178-04 to 178-06)
- found: `public.claim_invitations` in `apps/supabase/supabase/schema/506-invitation-rpcs.sql` (plans 178-04 to 178-06)
- found: `private.invitation_throttle_take` in `apps/supabase/supabase/schema/506-invitation-rpcs.sql` (plans 178-04 to 178-06)
- found: `public.get_user_entities` in `apps/supabase/supabase/schema/503-entity-rpcs.sql` (plans 178-04)
- found: `private.caller_entity_ids` in `apps/supabase/supabase/schema/301-auth-functions.sql` (plans 178-04)
- found: `ON ALL FUNCTIONS IN SCHEMA private` in `apps/supabase/supabase/schema/301-auth-functions.sql` (plans 178-04)
- found: `contestant_app_public_config` in `apps/supabase/supabase/schema/106-app-settings.sql` (plans 178-04)
- found: `export function parseAccountAccessRequest` in `apps/supabase/supabase/functions/account-access/contract.ts` (plans 178-06, 178-07)
- found: `export const ACCEPTED_BODY` in `apps/supabase/supabase/functions/account-access/contract.ts` (plans 178-06, 178-07)
- found: `export async function issueSignInLink` in `apps/supabase/supabase/functions/account-access/linkIssue.ts` (plans 178-06, 178-07)
- found: `export … LinkIssueDeps` in `apps/supabase/supabase/functions/account-access/linkIssue.ts` (plans 178-06, 178-07)
- found: `export function buildSignInLink` in `apps/supabase/supabase/functions/account-access/signInLink.ts` (plans 178-06, 178-07)
- found: `export … SIGN_IN_MAIL_TEMPLATES` in `apps/supabase/supabase/functions/account-access/mailTemplates.ts` (plans 178-06, 178-07)
- found: `export … renderSignInMail` in `apps/supabase/supabase/functions/account-access/mailTemplates.ts` (plans 178-06, 178-07)
- found: `CONTESTANT_GATES` in `apps/frontend/src/lib/contestant/gates/gates.ts` (plans 178-14)
- found: `firstNeededGate` in `apps/frontend/src/lib/contestant/gates/gates.ts` (plans 178-14)
- found: `GATE_VIEWS` in `apps/frontend/src/lib/contestant/gates/gateViews.ts` (plans 178-14)
- found: `claimAndRefresh` in `apps/frontend/src/routes/api/auth/callback/+server.ts` (plans 178-14)
- found: `REFUSED_TYPE` in `apps/frontend/src/routes/api/auth/callback/+server.ts` (plans 178-14)
- found: the tracked file `apps/frontend/src/lib/auth/invitationCodeLogin.ts` (plans 178-13, 178-15)
- found: the tracked file `apps/frontend/src/lib/auth/passwordLogin.ts` (plans 178-13, 178-15)
- found: the tracked file `apps/frontend/src/lib/auth/sessionAdmission.ts` (plans 178-13, 178-15)
- found: `the key ContestantAppLogin` in `apps/frontend/src/lib/routes/route.ts` (plans 178-13 to 178-19)
- found: `the key ContestantAppRegister` in `apps/frontend/src/lib/routes/route.ts` (plans 178-13 to 178-19)
- found: `the key ContestantAppSetPassword` in `apps/frontend/src/lib/routes/route.ts` (plans 178-13 to 178-19)
- found: `the key ContestantAppPreregister` in `apps/frontend/src/lib/routes/route.ts` (plans 178-13 to 178-19)
- found: `the key ContestantAppForgotPassword` in `apps/frontend/src/lib/routes/route.ts` (plans 178-13 to 178-19)
- found: `the key ContestantAppHelp` in `apps/frontend/src/lib/routes/route.ts` (plans 178-13 to 178-19)
- found: `whenAuthenticatedOnLogin` in `apps/frontend/src/lib/routes/appGates.ts` (plans 178-13 to 178-19)
- found: `#newUserEmail` in `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts` (plans 178-10, 178-14, 178-23)
- found: `#reset` in `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts` (plans 178-10, 178-14, 178-23)
- found: `#user derived from page.data.user` in `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts` (plans 178-10, 178-14, 178-23)
- found: `export … isRegistrationModeAllowed` in `packages/app-shared/src/settings/contestantAppConfig.ts` (plans 178-05, 178-08)
- found: `export … isRegistrationModeAllowedForAnyType` in `packages/app-shared/src/settings/contestantAppConfig.ts` (plans 178-05, 178-08)
- found: `export … isAnyRegistrationAllowed` in `packages/app-shared/src/settings/contestantAppConfig.ts` (plans 178-05, 178-08)
- found: `export … getEffectiveRegistrationModes` in `packages/app-shared/src/settings/contestantAppConfig.ts` (plans 178-05, 178-08)
- found: `export … REGISTRATION_MODE` in `packages/app-shared/src/settings/contestantAppConfig.ts` (plans 178-05, 178-08)
- found: `seedEmailInvitation` in `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (plans 178-12 to 178-22)
- found: `seedCodeInvitation` in `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (plans 178-12 to 178-22)
- found: `seedProjectInvitation` in `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (plans 178-12 to 178-22)
- found: `signInLinkToOpen` in `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (plans 178-12 to 178-22)
- found: `askForLink` in `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (plans 178-12 to 178-22)
- found: `releaseLinkSlot` in `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (plans 178-12 to 178-22)
- found: `expectNothingSent` in `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (plans 178-12 to 178-22)
- found: `assertSignInLinkShape` in `tests/tests/utils/mailedLink.ts` (plans 178-12 to 178-22)
- found: `toRunOrigin` in `tests/tests/utils/mailedLink.ts` (plans 178-12 to 178-22)
- found: `declareScans` in `tests/tests/utils/contestantAxeScan.ts` (plans 178-12 to 178-22)
- found: `registerAndStoreSession` in `tests/tests/setup/shared/registerAndStoreSession.ts` (plans 178-12 to 178-22)
- found: `expectNoHorizontalOverflow` in `tests/tests/fixtures/shared/pageGeometry.fixture.ts` (plans 178-12 to 178-22)

Names missing: 0

The line of the context that derives `#user`, as it stands:

```
#user = $derived(page.data.user ?? undefined);
```

## What is recorded and is no halt

### The signature of the seeding function

`git grep -c -F p_confirm_entity -- apps/supabase/supabase/schema/506-invitation-rpcs.sql` → 0 line(s)

create_invitations: two-argument form

The function's header on the tree:

```
CREATE OR REPLACE FUNCTION public.create_invitations (p_project_id uuid, p_invitations jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
```

### The next free number among the pgTAP files

`git ls-files 'apps/supabase/supabase/tests/database/*.test.sql'`: 44 files, the highest number 44; **the next free number is 45**. The last three:

```
42-entity-nominations.test.sql
43-set-entity-nominations.test.sql
44-nomination-parent-options.test.sql
```

### Message keys in each of the seven catalogues

By the command of `178-UI-SPEC.md` § *Copywriting Contract* → *Arithmetic*, once per locale directory:

```
da  704
en  704
et  704
fi  704
fr  704
lb  704
sv  704
```

Locales: 7; distinct counts: 1 — the seven agree.

### Accessibility scan entries, and the contestant and invitation projects

`grep -c -E '^  \{$' tests/tests/specs/a11y/contestant-a11y.spec.ts` (an entry of one of the file's route lists opens at that indentation): **12** entries; the file calls `declareScans(` 4 times, once per list. The baseline run's `contestant-a11y-scan` project holds 24 tests.

The projects of `tests/playwright.config.ts` whose name begins `contestant-` or `invitation-`:

```
contestant-a11y-scan
invitation-contract
invitation-landing
contestant-terms-gate-phone
contestant-journey
contestant-entity-selection
```

### The files of `178-RESEARCH.md` § *Phase 177 overlap*, each with the last commit that changed it

`git log -1 --format='%h %s' -- <path>`; "177" says whether that commit's subject carries Phase 177's scope.

| Path | Last commit | 177 |
|---|---|---|
| `apps/supabase/supabase/schema/503-entity-rpcs.sql` | `b21d16eae` docs[db](177-17): the write function's comments say that the confirmat | yes |
| `apps/supabase/supabase/schema/301-auth-functions.sql` | `80d3f515f` feat(177-05): an organization creates its alliance's nomination under  | yes |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` | `50e930916` docs(177-21)[db]: two comments on the requested-parent key say it serv | yes |
| `packages/supabase-types/src/database.ts` | `3e002a74f` chore(177-07): the generated database types for set_entity_nominations | yes |
| `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` | `fd6e610eb` test(177-06): the parent options an entity may name, and the parent's  | yes |
| `apps/frontend/src/lib/api/base/dataWriter.type.ts` | `2ee846c45` feat(177-09): the writer sets an entity's nominations and reads its pa | yes |
| `apps/frontend/src/lib/api/base/universalDataWriter.ts` | `2ee846c45` feat(177-09): the writer sets an entity's nominations and reads its pa | yes |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | `2ee846c45` feat(177-09): the writer sets an entity's nominations and reads its pa | yes |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` | `ae078b2d3` test(177-09): the writer cases read a call's arguments only after asse | yes |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts` | `f71107820` docs(177-21): comments and docstrings that describe the code as it is | yes |
| `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts` | `8f6db36bc` feat(177-19): the first task and the nominations view lead into the ed | yes |
| `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | `c104fc45b` feat(177-15): an entity with no nomination defines its nominations — t | yes |
| `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts` | `a90d76cb8` test(177-19): the nomination task's route, the nominations view's six  | yes |
| `apps/frontend/src/lib/routes/route.ts` | `c104fc45b` feat(177-15): an entity with no nomination defines its nominations — t | yes |
| `apps/frontend/src/lib/types/generated/translationKey.ts` | `027614b2d` feat(177-12): the strings of the nomination editor and the changed nom | yes |
| `apps/frontend/messages/*/contestantApp.common.json` | `027614b2d` feat(177-12): the strings of the nomination editor and the changed nom | yes |
| `tests/playwright.config.ts` | `f71107820` docs(177-21): comments and docstrings that describe the code as it is | yes |
| `tests/tests/utils/testIds.ts` | `6dad8f47e` test(177-11): the nomination editor's test ids and semantic steps | yes |
| `tests/tests/specs/a11y/contestant-a11y.spec.ts` | `8f6db36bc` feat(177-19): the first task and the nominations view lead into the ed | yes |
| `scripts/assert-a11y-scan-wiring.mjs` | `8abaf9146` test(177-10): contestant-nominations.spec.ts on its own dataset, in th | yes |
| `scripts/assert-project-scoped-queries.mjs` | `2ee846c45` feat(177-09): the writer sets an entity's nominations and reads its pa | yes |
| `packages/dev-seed/src/templates/e2e/base.ts` | `87e9f2203` feat(177-02): every seed template and the election generator state the | yes |
| `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` | `108dbee31` feat(177-10): the perm-contestant-nominations dataset and its constant | yes |
| `apps/frontend/src/routes/contestant/README.md` | `ba89d7b1e` docs(177-21): the Contestant app's route tree and the dev-seed's elect | yes |
| `apps/supabase/README.md` | `ba89d7b1e` docs(177-21): the Contestant app's route tree and the dev-seed's elect | yes |
| `.claude/skills/components/SKILL.md` | `d44b3844c` docs(177-21): the database, data and components skills name the nomina | yes |
| `.claude/skills/components/context-reactivity.md` | `d44b3844c` docs(177-21): the database, data and components skills name the nomina | yes |
| `.claude/skills/database/` | `d44b3844c` docs(177-21): the database, data and components skills name the nomina | yes |
| `apps/docs/src/routes/(content)/developers-guide/` | `06d81c75e` docs(177): an edit by the entity's user hides a confirmed nomination u | yes |

## The UI contract's round

UI contract round: 0 line(s) beginning with a ticked box or a bold NOTE or EDIT marker between `## PROPOSED` and `## Checker Sign-Off` (0 ticked box(es) at any indentation, 83 empty); status `approved`; the sign-off's three rulings found: the count from the settlement (1), the ten-second bound (1), the two wordings (1).

## Operator rulings as read

`178-OPERATOR-ROUND` names `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, section(s) `H`. `node .planning/phases/178-sign-in-email-code-registration/178-read-rulings.mjs .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md H` printed the lines below, each behind a leading `- `, and exited with the status given after them.

- H1: applied (b)
- H2: recommended-unticked (a)
- H3: recommended-unticked (a)
- H4: recommended-unticked (a)
- H5: recommended-unticked (a)
- H6: recommended-unticked (a)
- H7: recommended-unticked (a)
- H8: recommended-unticked (a)
- H9: recommended-unticked (a)
- H10: recommended-unticked (a)
- H11: recommended-unticked (a)
- H12: recommended-unticked (a)
- H13: recommended-unticked (a)
- H14: recommended-unticked (a)
- H15: recommended-unticked (a)
- H16: recommended-unticked (a)
- H18: recommended-unticked (a)
- H19: recommended-unticked (a)
- H20: recommended-unticked (a)
- H21: recommended-unticked (a)
- H22: recommended-unticked (a)
- H23: recommended-unticked (a)
- H24: recommended-unticked (a)
- H25: recommended-unticked (a)
- H26: recommended-unticked (a)
- H27: recommended-unticked (a)
- H28: recommended-unticked (a)
- H29: recommended-unticked (a)
- H31: recommended-unticked (a)
- H32: recommended-unticked (a)
- H33: recommended-unticked (a)
- H34: recommended-unticked (a)
- H35: recommended-unticked (a)
- H36: recommended-unticked (a)
- H37: recommended-unticked (a)
- H38: recommended-unticked (a)

Exit status of the reading: 0. Items read: 36.
