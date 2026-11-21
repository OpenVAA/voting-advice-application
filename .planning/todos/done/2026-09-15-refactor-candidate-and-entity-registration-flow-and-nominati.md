---
created: '2026-09-15T12:18:18.822Z'
title: Refactor entity registration flow and nomination selection to the Phase 162 model
area: apps/frontend/src/routes/candidate
severity: major
source: operator, 2026-09-15, during Phase 162 planning
related_phase: 162
blocked_by: 162
files:
  - apps/frontend/src/routes/candidate/preregister/**
  - apps/frontend/src/routes/candidate/register/**
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/supabase/supabase/functions/invite-candidate/index.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
resolves_phase: 178
---

# Refactor entity registration flow and nomination selection to the Phase 162 model

**Operator, 2026-09-15:** _"Add as a follow up item after these db change phases, refactor candidate
(organization editor) registration flow and nomination selection to match user tasks and the 4
registration methods defined in phase 162 planning."_

**Do this AFTER Phase 162 and the other database phases land.** Every entry point below writes a
grant, and grants do not exist until 162 ships.

## Problem

`162-USER-RIGHTS.md` defines **four sign-up methods** and a **nine-step common user task flow**. The
candidate app implements roughly one method and part of the flow, and the parts it does implement
diverge between its two route trees. This item is the frontend/flow half of that model — Phase 162 is
the database half.

### What exists today, measured at HEAD `440a7780f` (Phase 162 brief, facts 16–22, 26)

| # | Method | State |
|---|---|---|
| 1 | `identity_provider` (Signicat OIDC → `identity-callback`) | **Works.** But fact 21: it always creates a `candidate` and writes `role: 'candidate'` — **no entity-type selection exists**, so "select entity type if the election allows multiple" has no implementation and no entry point. |
| 2 | `email` invite (`invite-candidate`) | **⚠ BROKEN END TO END.** Fact 18: the function sets `redirectTo = ${siteUrl}/candidate/complete-registration` and **no such route is in the tree** — the only occurrence of that string repo-wide is the Edge Function line itself. This is a live defect today, independent of any refactor, and could be fixed on its own. |
| 3 | `code` (registration key) | **Contract exists and throws.** Fact 17: `checkRegistrationKey` is abstract in `universalDataWriter.ts`; the Supabase adapter implements it as `throw new Error('checkRegistrationKey is not supported by the Supabase adapter. Use invite-based registration.')`. The **UI strings already ship** — `candidateApp.login.haveRegistrationCode`, `candidateApp.register.wrongRegistrationCode` in `translationKey.ts`. |
| 4 | `open` | **Does not exist.** |
| — | `parent_email` (org invites its candidates) | **Does not exist.** Becomes `entity.invite_children` under Phase 162's matrix. |

**Fact 16: entities carry no `email` and no registration-code column.** `102-entities.sql` has no
`email` and no `*_code` on `candidates`, `organizations`, `factions` or `alliances`, and grepping
`registration_code` / `invite_code` across `schema/` returns nothing. **Methods 2, 2.1 and 3 all
require columns that do not exist**, so the schema work is a prerequisite of the flow work.

### ⚠ The sharpest existing defect: collected nominations are discarded

**Fact 22.** The writer contract carries `nominations: Array<{electionId, constituencyId}>` through
`preregisterWithIdToken` / `preregisterWithApiToken`, and `_preregister` passes only `firstName`,
`lastName`, `email` and `projectId` to `invite-candidate` — **which never writes a nomination
either.** The `preregister/(authenticated)/{elections,constituencies}` pages exist and feed
`candCtx.preregistrationNominations`, so **the UI half of task-flow step 7 is already built and its
output is silently dropped on the floor.**

Fact 19 explains why nothing could have written it: nominations are **admin-only** to write
(`admin_insert_nominations` and siblings all gate on `can_access_project`). Phase 162 adds the
entity-user write policies that make step 7 possible at all.

### Flow divergence

Fact 26: 30 route files under `apps/frontend/src/routes/candidate/`, with a working `preregister`
chain (`+page` → `elections` → `constituencies` → `email` → `status`) **plus a separate `register`,
`login`, `forgot-password`, `password-reset` tree**. Steps 1–6 of the task flow are spread across
both and diverge. Methods 2, 3 and 4 have no route of their own.

## Solution

Two phases, already scoped in `162-IMPLEMENTATION-BRIEF.md` §§ 6.1 and 6.2. **Read them before
planning this** — they carry the measured facts above and the dependency order.

**§ 6.1 — Sign-up methods and entity onboarding.** The auth-method × entity-type matrix in
`app_settings.settings` plus its `dynamicSettings.type.ts` type (fact 24: that table is already the
established home, one row per project, `anon`-readable, and `preRegistration.enabled` already lives
there — **do not put this on `projects`**, which would create the drift K3 was avoiding); `email` and
`registration_code` columns on the four entity tables; the `code` flow wired to the contract that
currently throws; the `open` flow; `parent_email` org→candidate invites through
`entity.invite_children`; entity-type selection at the identity entry point; and **the missing
`/candidate/complete-registration` route.**

**§ 6.2 — Entity-app task flow.** Unify steps 1–6 across the four entry points; **wire step 7 to a
real nomination write**; the free-text-party branch for `organization_list` elections; step 9's
question-set change when a nomination changes; ToU and password steps made common.

### Three constraints this inherits from Phase 162 — do not re-litigate them

1. **The identity-confirm step sets two separate flags.** Phase 162 ships `entities.confirmed` and
   `nominations.confirmed` with two separate permissions (`entity.confirm`, `nomination.confirm`).
   The operator's wording is _"an identity confirm step usually paired with confirming nominations"_
   — one UI act, two flags. See `162-CONTEXT.md` D-10, D-11.
2. **Sign-up is what makes `entities.confirmed` true.** Method 1, or seeding with a name **and** an
   email or code, sets it `true` on creation; anything else leaves it `false`. Phase 162 ships the
   column with `identity-callback` as its only automatic setter — **this item wires the rest.**
   A `false` entity is invisible to voters (D-11: public read is conjunctive through the nomination),
   so getting this wrong hides real candidates.
3. **Entity-type generality is a standing operator instruction**, not a candidate-only nicety. From
   the G2 margin note: _"Extend to cover all entity types, i.e. organization manager etc."_, and from
   A4: _"this kind of generalisation should be applied as widely as possible."_ The operator's title
   for this item says "candidate (organization editor)" for the same reason.

## Related todos — read before starting

- **`register-page-registrationkey-method.md`** (2026-03-24) — **its central question is now
  answered, and the answer is the opposite of what it assumed.** It asks whether the `registrationKey`
  flow is Strapi residue to delete. Fact 17 says the contract is live-but-throwing and § 6.1 makes
  `code` **method 3 of four** — so it is an unimplemented method, not a leftover. **Do not delete
  those routes.** That todo can be closed by this one.
- **`2026-08-28-preregister-election-constituency-selection-harmonisation.md`** — a real sub-problem
  of "nomination selection", kept separate because it carries measured detail this item does not
  repeat: the Candidate App honours `startFromConstituencyGroup` in **zero** places while the Voter
  App honours it in **four**, and `tests/tests/specs/perm/perm-startfromcg.spec.ts` is the existing
  regression surface. `ElectionSelector` / `ConstituencySelector` are shared by both apps, so
  changing them for the candidate flow can silently break the voter flow. **Extend that spec to the
  candidate side rather than writing a parallel one.**

## Sequencing

`162-IMPLEMENTATION-BRIEF.md` § 8.5 recommends (★, unticked, so it stands) that **v2.15 ships when
Phase 162 closes and these two phases open v2.16.** § 6.2 depends on § 6.1, and both depend on 162.

**One piece could be pulled forward independently:** fact 18's missing
`/candidate/complete-registration` route. It is a live defect on the e-mail path, it does not depend
on grants, and it is a single route file.

## Note (2026-10-02, Phase 168 docs rewrite: 168-03 F2/F3, 168-06 F3/F4)

The Phase 168 docs writers re-read the invitation path at HEAD and found the same defect plus one adjacent gap. Both were read, not
run.

- **Fact 18 still stands** (168-03 F3, 168-06 F3). `apps/supabase/supabase/functions/invite-candidate/index.ts` still redirects to
  `/candidate/complete-registration`, and there is still no route there (`find apps/frontend/src/routes -name 'complete-registration*'`
  prints nothing). The auth callback sends `invite` links to `CandAppSetPassword` instead (`route: 'CandAppSetPassword'`). The
  Pre-registration and invitation docs page states the path as the code has it and says no page exists there. A second reason the
  invite email may not land: with the default templates and PKCE, the verify redirect delivers `?code=` to the callback, which ignores
  it. That is measured for the recovery mail in `2026-09-02-forgot-password-pkce-code-not-exchanged.md`, and UNCONFIRMED for invites.
- **Neither invitation sender has a UI caller** (168-03 F2, 168-06 F4). `invite-candidate` is invoked only by
  `SupabaseDataWriter._preregister`, reached through `preregisterWithApiToken` (`universalDataWriter.ts`: `return this._preregister(opts);`).
  No route or component calls it: `git grep -n preregisterWithApiToken -- apps` lists the type, the base class, the writer's unit tests
  and two docs pages. `SupabaseAdminWriter.sendEmail` (the `send-email` function) has no caller either:
  `git grep -n "\.sendEmail(" -- apps/frontend/src ':!*.test.ts'` is empty. The docs say invitations are sent by calling the function
  directly. Whether these are dormant by design or unfinished wiring is UNCONFIRMED. The method 1 (email invite) UI this refactor
  designs is where they would be wired.

## Update 2026-10-11 — the nomination-selection half is built as the editor (Phase 177 close)

The "nomination selection to Phase 162's model" half of this todo is built: an entity's user creates, changes and removes its own nominations in the nomination editor (`set_entity_nominations` in the database, three steps under `…/nominations/(edit)/` in the Contestant App), for candidates and organizations alike, with the election's type deciding who may stand and under what. The selection of elections and constituencies there asks the same ordering module as the Voter App (`apps/frontend/src/lib/routes/selectionOrder.ts`), which closes the sub-problem `2026-08-28-preregister-election-constituency-selection-harmonisation.md`. **Still open:** the registration flow itself (Phases 178 and 179), the legacy `preregister` selection pages and the context's `preregistration*` members, which are in place, and nominations stated at invitation time (Phase 177.1).

## Resolution

**Closed 2026-10-16 at the close of Phase 178** (obligation O-9 of `178-CONTEXT.md`). Nothing of it is lost by the move; every row and item maps to the phase that delivered it, or to what holds what is left:

| Row or item | Where it went |
|---|---|
| Method 1, `identity_provider`, and its missing entity-type selection | Phase 179: REG-04 (registration for both entity types), REG-06 (the type chosen in the selector before the provider's flow) |
| Method 2, `email` invite, broken end to end (`invite-candidate`, the missing `/candidate/complete-registration`) | Phase 174 replaced `invite-candidate` with the `account-access` function, whose sign-in link is the callback URL; Phase 178 built the screens (REG-01, REG-02, REG-03, REG-10). The `complete-registration` route is not needed: no link points there |
| Method 3, `code`, contract throwing | Phase 174 (invitation codes, INV-01, INV-04); Phase 178 built the code screens (REG-09) and removed the throwing contract (REG-14 in part, plan 178-23) |
| Method 4, `open` | REG-F01 (a future requirement in `REQUIREMENTS.md`) |
| `parent_email` | REG-F02 (a future requirement in `REQUIREMENTS.md`) |
| Fact 16, no `email` or code column on the entities | Phase 174: an invitation is a row of `public.invitations`, bound to an address or a code hash |
| Fact 22, collected nominations discarded by `preregister` | Phase 179, standing todo `2026-09-21-preregister-route-discards-email-and-nominations.md`; the editor that writes nominations is Phase 177's (NOM-03 to NOM-06) |
| Fact 19, nominations admin-only to write | Phases 162 and 177 (`set_entity_nominations`) |
| Flow divergence between the two trees | Phase 178 (the `register/` tree is the mode selector and its screens); the `preregister/` chain is Phase 179's (REG-14, criterion 5) |
| § 6.1: the auth-method × entity-type matrix in `app_settings` | `contestantApp.registrationModes` (Phase 171), enforced on invitations by the database (Phase 178, plan 178-05) |
| § 6.1: the `code` flow wired | Phase 178 (REG-09) |
| § 6.1: entity-type selection at the identity entry point | Phase 179 (REG-06) |
| § 6.2: steps 1–6 unified | Phase 178 (screens A to G; the set-password and terms gates of the protected layout, REG-11, REG-12) |
| § 6.2: step 7 wired to a real nomination write | Phase 177 (NOM-03 to NOM-06) |
| § 6.2: the free-text-party branch | Phase 177 (NOM-05) |
| § 6.2: step 9, the question set following the nominations | Phase 177 (NOM-08) |
| § 6.2: terms of use and password steps made common | Phase 178 (the gate list: `setPassword`, then `termsOfUse`) |
| Constraint 1, two flags for the identity-confirm step | Phases 162 and 175 |
| Constraint 2, sign-up makes `entities.confirmed` true | Phase 174 (INV-05; confirmation at seeding), Phase 177.1 (the caller states it), Phase 179 (the identity provider's entity) |
| Constraint 3, entity-type generality | Phases 175 to 178 serve candidates and organizations alike; Phase 179 extends the identity provider |
| Related todo `register-page-registrationkey-method.md` | already in `done/` |
| Related todo `2026-08-28-preregister-election-constituency-selection-harmonisation.md` | closed by Phase 177 (`selectionOrder.ts`) |
| The legacy `preregister` selection pages and the context's `preregistration*` members | Phase 179 (REG-14, criterion 5) |
| Nominations stated at invitation time | Phase 177.1 |

No row is held by nothing, so no todo was filed for it.
