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
