# Requirements: OpenVAA — Milestone v2.16 Contestant App

**Defined:** 2026-10-04
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Milestone goal:** A candidate or an organization (party) user can register by any mode the project allows, land in one Contestant app that serves both entity types, and — when they hold grants on several entities — choose which one to edit.

**Authoritative definition:** `CAND-APP-PLAN.md` at the repo root (operator, 2026-10-04) defines the nomenclature and the screens A–L that the requirements below cite by letter. `162-USER-RIGHTS.md` and `162-IMPLEMENTATION-BRIEF.md` §§ 6.1–6.2 (under the v2.15 Phase 162 directory) are the model it implements. Where they disagree, `CAND-APP-PLAN.md` and the operator's 2026-10-04 rulings recorded here win.

**The v2.15 requirements** this file replaced are in git history at `98b7bba26` and are archived by the v2.15 completion run, which happens in a separate session.

## Standing rules (apply to every requirement below)

- **Cardinal rule:** no failing E2E test, no exemptions. A "did not run" test counts as a failure.
- **Localisation:** every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
- **Accessibility:** every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan.
- **Both entity types:** a requirement that says "user" or "entity" holds for candidates and for organizations unless it names one.
- **No backwards compatibility is owed:** nothing is deployed, so the schema, the settings shape, the routes and the renamed symbols change in place.

## v2.16 Requirements

### Nomenclature

- [x] **NAME-01**: Every `candidateApp`-type symbol — identifiers, contexts, route constants, message namespaces, test fixtures — is renamed to its contestant form, spelled in full (`contestantApp`, `ContestantApp*`, `ContestantContext`, `$contestant`, `contestant-…`); the two auth-endpoint route keys, whose paths are neutral, become `AuthCallback` and `AuthLogout`. This is done first, before feature work builds on the old names. (amended 2026-10-05, 170-A4, 170-A5 (b))
- [x] **NAME-02**: The app's routes move from `candidate/` to `contestant/`, including the app's own API route (`preregister`, to `api/contestant/`), the Edge Function redirect targets, the auth redirect allowlist and the docs. The auth callback and logout API routes, which the Admin app shares, move to the neutral `api/auth/{callback,logout}` instead, and the duplicate logout handler is merged into that one. (amended 2026-10-05, 170-A5 (b))
- [x] **NAME-03**: The UI names the app "Candidate and party app", "Candidate app" or "Party app" according to which entity types the project's Contestant app serves.

### Project settings

- [x] **SET-01**: A project can declare which entity types the Contestant app serves (the `contestantApp.entityTypes` setting — the operator's `contestant_app_entities` — over `candidate`, `organization`). A type named twice counts once. (amended 2026-10-05, 171-A3 (b))
- [x] **SET-02**: A project can declare, per served entity type, which registration modes are allowed — a registration-mode × entity-type matrix over `identity_provider`, `email` and `code`, stored as the `contestantApp.registrationModes` setting. Any cell, a whole row or the whole matrix may be empty, and a mode named twice for a type counts once. (amended 2026-10-05, 171-A3 (b))
- [x] **SET-03**: When no registration mode is allowed for any served entity type, the login screen offers sign-in only.

### Invitations

- [x] **INV-01**: An admin can seed an entity with an email or a registration code, defining in advance the grant its user will receive.
- [x] **INV-02**: A duplicate invitation is refused and the first is left unchanged: a second invitation in the project carrying the same email for the same grant target `(scope, target type, target id)`, whatever role it promises, or carrying a code the project already holds, whatever its target. (amended 2026-10-06, 174-A3 (c), 174-B3)
- [x] **INV-03**: Claiming an invitation writes exactly the grants it defines, and only for the user who proved the email or the code.
- [x] **INV-04**: A used code is retained, so that entering it again leads to password sign-in rather than to an error.
- [x] **INV-05**: An entity seeded with a name and an email or a registration code is confirmed when the admin says so in the seeding call; the seed writer and the docs say so for a named entity unless told otherwise; an entity seeded without either stays unconfirmed until an admin confirms it. (amended 2026-10-18, Phase 177.1 decision D-18; the clause read "is confirmed automatically")

### Terms of use

- [x] **TOU-01**: Terms-of-use acceptance is recorded per user and project, not on the candidate.
- [x] **TOU-02**: Terms-of-use acceptance no longer affects which entities are publicly visible: every RLS, storage and RPC condition on it is removed.
- [x] **TOU-03**: A backlog todo records the Admin-app rule — an entity whose primary editor has not accepted the terms of use cannot be confirmed, or is confirmed with a warning — merged into an existing todo if one already covers it.

### Registration flow

- [ ] **REG-01**: The login screen offers "Sign in with email" and, when any registration mode is allowed, "Register" (A).
- [ ] **REG-02**: On the sign-in screen, when the email mode or the identity-provider mode is allowed for any served entity type, a user who has not set a password can ask for a sign-in email with "I have not set a password yet" (B). (amended 2026-10-05, 179-B3)
- [ ] **REG-03**: The registration-mode selector lists each allowed mode as an expandable option with one Continue button, or shows the single allowed mode directly (C).
- [ ] **REG-04**: A user can register with the identity provider. The user and the entity are created together when the provider's flow completes; on the success screen the user enters and confirms the email they will sign in with, and goes straight to editing without waiting to confirm it: the address is recorded as pending, a confirmation link is sent to it, and it becomes the sign-in identifier once that link is opened — until then the user returns through the identity provider (CI, CI1). (amended 2026-10-05, 179-B1)
- [ ] **REG-05**: A returning identity-provider user is told they have already registered, is asked to use their email to sign in next time, and continues without entering an email again. A returning user who never gave an email is asked for it before reaching the home screen (CI1). Planned at J1 (2026-10-21, operator ruling 2026-10-21: plan at the ★/proposal; the operator may still answer J1, and a different answer becomes a located revision): a pending address counts as given. Only a user with no address is stopped by the gate and asked for one. A user whose address is pending is shown once that they have registered and that the link is waiting, with "send again" and "use a different address", sees a reminder on the home screen, and returns through the identity provider until the link is opened. Only a user whose address is confirmed is asked to use their email to sign in next time (179-CONTEXT.md D-09; plans 179-14, 179-17, 179-18). This closes the open question recorded on 2026-10-05 (179-B1 ★ against 179-B4 ★).
- [ ] **REG-06**: When identity-provider registration is allowed for more than one entity type, the user chooses the type in the registration-mode selector, before the provider's flow, and the choice is carried through it; when it is allowed for one, that type is used without asking (C).
- [ ] **REG-07**: A user registering an organization with the identity provider enters the organization's name and abbreviation (short name) on the success screen, through multilingual inputs; they are saved to the already-created organization, and the user is told they can be edited later, until the organization is confirmed (CI1). A self-registered organization is created unconfirmed (179-C1), and a name is editable while the entity is unconfirmed, whatever the nominations lock says — see GEN-03. (amended 2026-10-07, operator decision B1 (a); the clause read "unless nominations are locked")
- [ ] **REG-08**: An identity-provider failure shows an error with the support block and a "Try again" action. The message is honest about whether retrying can help and treats a deliberate cancel separately (CI2).
- [ ] **REG-09**: A user can register with a code: a valid code leads to entering and confirming an email, a used code leads to password sign-in, and anything else shows "We couldn't confirm your registration code." (C, D1, D2).
- [ ] **REG-10**: A user can register by email and is sent a sign-in link. The "email sent" screen offers a rate-limited resend, links to support, and never surfaces a backend error for an invalid address (E).
- [ ] **REG-11**: A user who arrived through an emailed sign-in link and has not set a password is asked to set one before proceeding, enforced at layout level. A user in their initial identity-provider registration is not asked (F).
- [x] **REG-12**: A user who has not accepted the terms of use for the project is asked to accept them before proceeding, enforced at layout level (G).
- [ ] **REG-13**: The sign-in, password and email-entry pieces are shared components across the sign-in, code-reuse, email-entry and set-password screens, and every input carries the type and autocomplete hints that browser autofill and password managers need.
- [ ] **REG-14**: The legacy registration flows are removed and the flow of screens A–K is the only registration path: the legacy `register/` tree and its `checkRegistrationKey` / `register` contracts go in Phase 178, the legacy `preregister/` chain in Phase 179. No `preregister/` route survives: the one registration tree is `register/`, with the identity-provider flow as a subroute inside it (operator note, 2026-10-05; exact route names settled in the Phase 178 plan). (amended 2026-10-05, 178-G1 and Additional note 1)

### Entity selection

- [x] **ENT-01**: A user holding grants on several entities chooses which one to edit from a list of entity cards; a user holding one grant skips the screen (H).
- [x] **ENT-02**: The user can switch the selected entity later without signing out.
- [x] **ENT-03**: One user can hold editor grants on more than one entity in a project; the single-entity assumptions in the user-data RPC (its `ERR_ENTITY_IDENTITY_AMBIGUOUS` raise) and in the frontend are lifted. `idx_grants_one_candidate_editor` stays: it limits a candidate to one editor, not a user to one candidate, so it was never the blocker. (amended 2026-10-05, 173-A1)

### Contestant home and nominations

**"Nominations locked"** in NOM-02, NOM-06 and the phase criteria means the app setting `access.nominationsLocked`, which sits beside `access.answersLocked`. The lock moves there out of `projects.lock_nominations`, and is promoted to a full column only if RPCs or indices need it; the database goes on enforcing it. (amended 2026-10-05, 175-B5 (b) + note, 177-B5 (b))

- [x] **NOM-01**: The home screen lists every task for the selected entity, starting with "Define nomination", which is incomplete while the entity has no nomination. An entity without nominations no longer causes an error (I).
- [x] **NOM-02**: The user can view the entity's nominations in a dedicated view, moved out of the profile. When they cannot be edited — nominations are locked — a reusable note directs the user to support (J). (amended 2026-10-05, 175-B5 (b))
- [x] **NOM-03**: The user can pick election and constituency pairs the same way a voter does, with the `startFromConstituencyGroup` setting honoured. Only elections whose election type admits the entity's type are offered. The election choice is offered whenever there is something to choose; the selection step is skipped entirely when there is one election with one constituency (K). (amended 2026-10-05, 177-C2 (b) and Additional note 2)
- [x] **NOM-04**: For each chosen pair the user can enter an election symbol and, where the election type allows a parent for this entity type, choose a parent party or alliance. The parent is required for candidates in `organization_list` elections, where "Other" (NOM-05) satisfies it. In `organization_list_and_independents` elections — a new election type, and the default — a candidate may instead choose "Independent / no party" and be nominated without a parent. For an organization's alliance parent, "None" is the default selection. These election-shape rules are enforced in the database, in `validate_nomination`, for every writer (K). (amended 2026-10-05, 177-A3 (b) + note, 177-A4 (b) + note)
- [x] **NOM-05**: Choosing "Other" as the parent asks for free text and stores it in `customData.requestedParentOrganization` instead of linking a parent nomination (K).
- [x] **NOM-06**: Nominations are created or updated when the user continues. Editing is refused when nominations are locked (`access.nominationsLocked`), and an edited nomination loses its confirmed state. (amended 2026-10-05, 177-B5 (b))
- [x] **NOM-07**: The profile, questions and preview are reachable only once the entity has a nomination (L).
- [x] **NOM-08**: When the entity's nominations change, the questions it is asked follow the new nominations: questions that now apply appear as tasks to answer, and questions that no longer apply are no longer asked.

### Task state

- [x] **TASK-01**: One derived state in the contestant context holds the entity's incomplete tasks and the next step, and every Continue button routes through it.

### Both entity types

- [x] **GEN-01**: An organization user can edit the organization's profile, answer questions and preview its public appearance, as a candidate can.
- [x] **GEN-02**: The data writer and the user-data RPC work for every entity type the Contestant app serves, not only candidates.
- [x] **GEN-03**: An organization's profile shows its name and abbreviation (short name) as multilingual fields, editable while the organization is unconfirmed and answers are not locked (`access.answersLocked`), and read-only once it is confirmed. The rule is one rule for every entity type: changing a name — first name, last name, name, short name — is gated on the entity being unconfirmed, and the nominations lock affects nominations only. An entity created through the identity provider is confirmed if it is a candidate and unconfirmed if it is an organization, because the organization's name is user-defined; an organization seeded as confirmed — what the seed writer and the docs do for a named entity invited by a code or an email, and from Phase 177.1 what the admin states on each call — has its name and short name set by the admin who seeds it and locked for its user from the first sign-in. The database freezes `short_name` on confirmation together with `name`, on all four entity tables, and `entity.edit_immutable` lets an admin correct either. (amended 2026-10-07, operator decisions B1 (a), B2 (a), B3 (a), which settle the 175-B2 and 175-B3 notes and supersede 175-B4 ★; the clause read "editable unless nominations are locked") (amended 2026-10-08, operator decisions C1 (a), C3 (a), F1 (a); the clauses read "editable while the organization is unconfirmed and read-only once it is confirmed" and "one created from a code or an email invitation is confirmed for both types, so such an organization's name and short name are set by the admin who seeds it and are locked for its user from the first sign-in"; "on all four entity tables" is new)

### Fixes and coverage

- [ ] **FIX-01**: A password-reset link requested from inside the app completes and signs the user in, in whichever browser or device it is opened. (amended 2026-10-05, 178-F1: the requirement states the outcome; the recovery link is issued by the server and carries a `token_hash` to the auth callback, so no PKCE `code` is produced.)
- [ ] **E2E-01**: Each registration mode has an E2E spec that follows the real email verify redirect rather than hand-building the callback URL.
- [ ] **E2E-02**: Organization registration, entity selection with several grants, and nomination definition each have E2E coverage.
- [x] **E2E-03**: The full E2E suite is green at the close of every phase. (marked 2026-11-06 at Phase 179.1's UAT, on the operator's ruling, ahead of Phase 179's close: `179.1-55-final` 678 of 678)

## Future Requirements

Deferred. Tracked, not in this roadmap.

### Registration

- **REG-F01**: `open` sign-up — a user registers with an email and no invitation.
- **REG-F02**: `parent_email` — an organization user invites its own candidates by email (`entity.invite_children`).

### Admin app

- **TOU-F01**: The Admin app refuses to confirm, or warns when confirming, an entity whose primary editor has not accepted the terms of use (TOU-03 files the todo). It also covers two questions about the acceptance rows: who may read them, since letting project admins read an acceptance to audit who agreed adds a new reader of personal data (today only the accepting user reads their own row); and recording which terms version or content hash was accepted, compared by the gate, so that an acceptance of an older text no longer counts once the terms change (review items C1 and C2 of Phase 179.1).

## Out of Scope

| Feature | Reason |
| --- | --- |
| Faction and alliance users in the Contestant app | `contestantApp.entityTypes` covers `candidate` and `organization` only; alliances appear only as a selectable nomination parent |
| A suggestion store for changes to immutable data | Ruled out in Phase 162 (C3): users message the admin |
| Admin-app screens for seeding invitations | The invitation model and its admin-callable write path are in scope; an Admin-app UI over them is not |
| Magic-link-only accounts (no password ever) | The set-password gate stays mandatory for emailed sign-in links; making it optional is a later setting |

## Design questions — settled 2026-10-05

The four questions left open on 2026-10-04 were settled by the operator in `.planning/v2.16-DISCUSSION-POINTS.md` (decision ids in brackets). Each phase's CONTEXT.md is the full record.

- **Invitation mechanism — settled (174-A1 ★, 174-A3 (c)).** A `public.invitations` table, claimed through one `SECURITY DEFINER` function (`claim_invitations`) after a GoTrue emailed-link sign-in; no auth user and no grant exists until the claim. A used code is kept and resolved to its user server-side for password sign-in. What an invitation promises is a general grant spec `(scope, target_type, target_id, role)`, or a child table of grants per invitation — not only an entity-editor grant — so the seeding path must itself decide who may promise which grant. It replaces `inviteUserByEmail` pre-creation, and `invite-candidate` is deleted (174-C5 ★).
- **Settings shape — settled (171-A1 ★, 171-A2 ★, 171-A3 (b)).** JSON inside `app_settings.settings`, deduplicated at parse, under the existing `contestantApp` root: `contestantApp.entityTypes` (a list) and `contestantApp.registrationModes` (a map from entity type to a list of modes). A stored root replaces the shipped root whole, so every writer restates the whole `contestantApp` root or the merge becomes deep in Phase 171.
- **Selected entity encoding — settled (173-B1 ★).** A route parameter, `contestant/(protected)/[entityType]/[entityId]/…`.
- **Where per-user-and-project ToU acceptance lives — settled (172-A1 ★).** A dedicated table, `public.terms_of_use_acceptances`, keyed by user and project.

- **When an entity's name is editable — settled (operator decisions B1–B3 (a), 2026-10-07).** While the entity is unconfirmed, for every entity type and every name field; the nominations lock affects nominations only (GEN-03, and the same clause in REG-07). In the app a name is also read-only while answers are locked (operator decision C1 (a), 2026-10-08).

**Settled 2026-10-04 — the identity-provider write is not deferred.** `identity-callback` keeps creating the user and the entity in one step. Because the entity type must therefore be known before the provider's flow, the type choice sits in the registration-mode selector (REG-06), and the organization's name and abbreviation are an update to the already-created entity (REG-07). A returning user without an email is asked for one before the home screen (REG-05).

## Traceability

Filled in by the roadmap.

| Requirement | Phase | Status |
| --- | --- | --- |
| NAME-01 | Phase 170 | Complete |
| NAME-02 | Phase 170 | Complete |
| NAME-03 | Phase 171 | Complete |
| SET-01 | Phase 171 | Complete |
| SET-02 | Phase 171 | Complete |
| SET-03 | Phase 171 | Complete |
| INV-01 | Phase 174 | Complete |
| INV-02 | Phase 174 | Complete |
| INV-03 | Phase 174 | Complete |
| INV-04 | Phase 174 | Complete |
| INV-05 | Phase 174 | Complete |
| TOU-01 | Phase 172 | Complete |
| TOU-02 | Phase 172 | Complete |
| TOU-03 | Phase 172 | Complete |
| REG-01 | Phase 178 | Pending |
| REG-02 | Phase 178 | Pending |
| REG-03 | Phase 178 | Pending |
| REG-04 | Phase 179 | Pending |
| REG-05 | Phase 179 | Pending |
| REG-06 | Phase 179 | Pending |
| REG-07 | Phase 179 | Pending |
| REG-08 | Phase 179 | Pending |
| REG-09 | Phase 178 | Pending |
| REG-10 | Phase 178 | Pending |
| REG-11 | Phase 178 | Pending |
| REG-12 | Phase 172 | Complete |
| REG-13 | Phase 178 | Pending |
| REG-14 | Phase 179 | Pending |
| ENT-01 | Phase 173 | Complete |
| ENT-02 | Phase 173 | Complete |
| ENT-03 | Phase 173 | Complete |
| NOM-01 | Phase 176 | Complete |
| NOM-02 | Phase 176 | Complete |
| NOM-03 | Phase 177 | Complete |
| NOM-04 | Phase 177 | Complete |
| NOM-05 | Phase 177 | Complete |
| NOM-06 | Phase 177 | Complete |
| NOM-07 | Phase 176 | Complete |
| NOM-08 | Phase 177 | Complete |
| TASK-01 | Phase 176 | Complete |
| GEN-01 | Phase 175 | Complete |
| GEN-02 | Phase 173 | Complete |
| GEN-03 | Phase 175 | Complete |
| FIX-01 | Phase 178 | Pending |
| E2E-01 | Phase 179 | Pending |
| E2E-02 | Phase 179 | Pending |
| E2E-03 | Phase 179 | Complete |

E2E-03 is a closing criterion of every phase, 170 to 179; the table names the phase at which it is finally discharged. The operator marked it complete at Phase 179.1's UAT (2026-11-06), overruling that rule; a red close of a later phase still breaks it.

**Coverage:**

- v2.16 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---

_Requirements defined: 2026-10-04_
_Last updated: 2026-10-11 — NOM-03, NOM-04, NOM-05, NOM-06 and NOM-08 (Phase 177) marked complete on `177-VERIFICATION.md` (no gap; status `human_needed`, 13 items for a person, and the operator's items G1 to G16 unread and built at their recommended options)._
