# Phase 162 — Flow Conformance: the two flows CHECKED against § 3's matrix, not assumed compatible with it

**ROADMAP criterion 7's written half.** `162-SPEC.md` § 6 defines level-1 and names 162-17 as the plan that
checks the flows against it; 162-06 implements them. This document is the check. Its executable half is
three standing vitest gates — one beside each module — so the properties below are re-asserted on every
build rather than recorded once in a document nobody re-reads.

- **Phase:** 162 (permissions-auth-model-refactor) · **Criterion:** 7 · **Written by:** `162-17-PLAN.md` Task 7
  (`85ae062aa`), on `integration/ship-12-squash`
- **Re-derived by:** 162-18 and 162-19, closing 162-VERIFICATION.md's criterion-7 gap
- **Re-derived at HEAD:** `3f2f1e46e`, 2026-09-19
- **Executable half:** four vitest files —
  `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts` (19),
  `apps/supabase/supabase/functions/send-email/flowConformance.test.ts` (16),
  `apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts` (13) and
  `apps/supabase/supabase/functions/invite-candidate/callerAuthority.test.ts` (10) for the shared gate —
  **58 tests across the four vitest files** (19 + 16 + 13 + 10), measured by a vitest run of exactly
  those four; 56 until the 162-REVIEW fix run added `invite-candidate`'s missing call-site
  assertion (CR-03) and its derived grant-vocabulary guard (WR-03); each flow file derives the 23-member permission vocabulary from `schema/000-enums.sql` at run time.
  The database half is the pgTAP files this document quotes: `07-rpc-security.test.sql`,
  `12-user-can.test.sql`, `19-entity-immutability.test.sql`, `23-nominations-write.test.sql`,
  `25-matrix-conformance.test.sql` and `32-level1-confirmation-flow.test.sql` (declared plan 13), inside a
  `test:db` run of 32 files and 1204 assertions. The controls that keep each assertion family able to fail
  are in `evidence/162-18/flow-controls.txt` (G1–G5; G1b/G1bs and G6/G6s were measured by the
  162-REVIEW CR-01/CR-02 fix run and are described in the control table below, not in that file), `evidence/162-19/confirmation-controls.txt` (N1, N2)
  and `evidence/162-19/flow-controls-rerun.txt` (F1, F2, F2i).

> **A conformance check that reports no findings at all is the outcome to distrust.** These flows were
> written against the retired role model, converted by one plan in one wave, and the amendment that widened
> them to every entity type arrived as a margin note (D-20). Findings are what a real check of that surface
> returns. 162-17 returned **two** open findings and one closed; the re-derivation by 162-18 and 162-19
> returns **5 findings** — one DEFERRED (F-1), one GAP (F-2) and three CLOSED (F-3, F-4, F-5) — and two of
> the closed ones (F-4, F-5) are defects the first version of this check either carried or passed, which is
> why it was re-derived rather than amended. The confirmation flow 162-19 added conforms in every row and
> adds no finding. WR-04 is cross-referenced after the findings as an open product decision, not a finding.

---

## What changed since 162-17 wrote this check

162-17 wrote this document in `85ae062aa`, against the Edge Functions as they stood before the 162-REVIEW
fix run. That run rewrote both authority gates, so the version at `85ae062aa` described code that is no
longer in the tree. **It is superseded, not amended**: 162-18 re-derived the `invite-candidate`, `send-email`
and `identity-callback` sections and the module census from the tree as it is after the fixes, and tightened
the executable half before re-running it. The earlier text stays readable in git at `85ae062aa`.

- **CR-05 — `729964a56`.** `invite-candidate`'s hand-coded TypeScript gate over the raw claim is gone; the
  function asks `public.user_can` for `project.edit_entities` through the caller's own client, via the new
  `callerAuthority.ts`. For this check it means the gate is one database question, the account admin is
  bounded to its own account's projects, and the ProjectEditor is admitted (F-5).
- **WR-09 — `3e3c2a0f1`.** `send-email` routes its gate through a byte-identical copy of the same helper,
  listed in `DUPLICATED_MODULES` of `scripts/assert-edge-env-defaults.mjs`; neither `index.ts` holds a scope
  or role literal any more, which closes the account-reach residual this document used to carry (F-4).
- **WR-02 — `0ae0b7565`.** `resolve_email_variables` resolves only users whose grant resolves to the named
  project, the sender is always the configured `SMTP_FROM`, and the HTML part escapes every substituted
  value; for this check it bounds bulk send's recipients, which the `send-email` table now walks.
- **WR-07 — `30a40f0ca`.** `invite-candidate`'s grant-write failure and its now-fatal link failure both call
  `rollbackInvite`, which deletes the invited auth user as well as the candidate row; the invite table walks
  both.
- **WR-06 — `e3e9ecb45`.** `writeEntityGrant` is idempotent and `identity-callback` writes the grant on both
  the new-candidate and the existing-candidate branch, so a failed first write is repaired at the next login.
- **WR-03 — `ae6ed6395` (+ `fb3180203`).** `requireAdminIdentity` backs its claim read with a `user_can` call
  on the deployment's configured project, through the adapter's `callerMayOnProject`; the census now lists
  that asker.
- **IN-05 — `9f84cfc50`.** `roles.ts`'s candidate-app shapes name `target_type: 'candidate'`, so only a
  candidate entity editor is admitted to the Candidate App; the census records the narrowed display gate.

---

## The module census this check is built on — RE-DERIVED, not inherited

`162-IMPLEMENTATION-BRIEF.md` § 5 named four frontend claim readers and D-25 measured five; 162-17 built
this check on a census of that five. 162-18 re-derived it from the tree after the review-fix run, with the
commands and their raw output kept in `evidence/162-18/census.txt`: one search for non-test modules that
read the access token's `grants` claim (`readGrants(`, `decodeTokenPayload(`, a `grants` property off a
decoded payload) and its consumers, one for non-test modules that ask the `'user_can'` RPC and their
callers, plus the importers of `jwtSegment` and `callerAuthority`, the grant writers and the Edge Function
entry points.

| Module | What it does with authority | Class | Changed since 162-17 by |
|---|---|---|---|
| `apps/frontend/src/lib/auth/roles.ts` | declares `readGrants` (decodes the token through `decodeTokenPayload`, fails closed on every malformed shape), `hasAnyGrant` and the entry-point shape sets `CANDIDATE_GRANTS` / `ADMIN_GRANTS` | claim reader for app entry | IN-05 (`9f84cfc50`): the candidate shapes name `target_type: 'candidate'` |
| `apps/frontend/src/lib/auth/passwordLogin.ts` | `hasAnyGrant(readGrants(session.access_token), allowedGrants)` decides whether a password login may enter the app it targets | claim reader for app entry | **new to the census** — 162-17 did not list it; its shape set narrowed with IN-05 |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | `_getBasicUserData` normalises the claim to the coarse `'candidate' \| 'admin'` role through `readGrants` and `hasAnyGrant` | claim reader for display (and the role `requireAdminIdentity` tests) | no authority change; its candidate arm narrowed with IN-05 |
| `apps/frontend/src/lib/server/admin/requireAdminIdentity.ts` | tests the normalised role, then asks `callerMayOnProject('project.edit_questions')` on the deployment's configured project | claim reader for app entry, backed by a `user_can` asker | WR-03 (`ae6ed6395`, `fb3180203`) |
| `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` | the `callerMayOnProject` method: `rpc('user_can', …)` at project scope on the adapter's configured project, through the request's own client | user_can asker | **new to the census** — WR-03 (`ae6ed6395`) |
| `apps/supabase/supabase/functions/invite-candidate/index.ts` | Edge Function entry point; one `callerMayOnProject` call gates candidate creation, then writes the invited candidate's grant | user_can asker (through the helper) and grant writer | CR-05 (`729964a56`), WR-07 (`30a40f0ca`) — reads no claim any more |
| `apps/supabase/supabase/functions/send-email/index.ts` | Edge Function entry point; one `callerMayOnProject` call gates bulk send | user_can asker (through the helper) | WR-09 (`3e3c2a0f1`), WR-02 (`0ae0b7565`) — reads no claim any more |
| `apps/supabase/supabase/functions/{invite-candidate,send-email}/callerAuthority.ts` | `callerMayOnProject`: `rpc('user_can', { p_scope: 'project', p_target_id, p_permission })` through the caller's client, failing closed | user_can asker | **new** — CR-05 / WR-09; byte-identical copies, listed in `DUPLICATED_MODULES` |
| `apps/supabase/supabase/functions/identity-callback/index.ts` | Edge Function entry point; asks no authority question of a claim; writes the new identity's grant | grant writer | WR-06 (`e3e9ecb45`): the grant is written on both candidate branches |
| `apps/supabase/supabase/functions/{invite-candidate,identity-callback}/entityGrant.ts` | `writeEntityGrant`, the one grant write; idempotent on a unique violation | grant writer | WR-06 (`e3e9ecb45`); byte-identical copies |
| `apps/supabase/supabase/functions/{invite-candidate,send-email}/jwtSegment.ts` | the token-segment decoder the retired claim read used; imported by NO non-test file | neither | WR-09 kept it and its tests, because the edge guard still lists it in `DUPLICATED_MODULES`; only its own tests still exercise the retired claim decode |
| `apps/supabase/supabase/functions/send-email/templateVars.ts` | renders template variables; returned by the `jwtSegment` search only because its docblock names that module | neither | WR-02 added the HTML-escaping renderer |

**Derived totals.** The claim-read search returns **three** non-test modules — `roles.ts`,
`passwordLogin.ts` and `supabaseDataWriter.ts` — plus `requireAdminIdentity.ts`, which reads the claim
transitively through the normalised role. The `user_can` search returns **three** asking sites — the two
byte-identical `callerAuthority.ts` copies and `supabaseAdminWriter.ts` — called from **three** places:
`invite-candidate/index.ts`, `send-email/index.ts` and `requireAdminIdentity.ts`.

**The headline change.** Neither Edge Function reads the claim any more. The only authorisation decisions
left outside the database are `user_can` calls; the claim readers left are app-entry and display gates, and
the one of them that fronts unguarded server work — the admin gate — is backed by a `user_can` call on the
deployment's project (WR-03).

---

## `invite-candidate` — the e-mail invite flow

Re-derived by 162-18 against the gate in the tree. Every authority step is walked across **all seven**
columns of `162-SPEC.md` § 5, because 162-17's version compared each hand-coded branch with the one cell it
named and so returned CONFORMS for two steps that did not conform (F-5). "Flow gate" below means
`invite-candidate/flowConformance.test.ts`; the pgTAP descriptions are quoted verbatim from
`apps/supabase/supabase/tests/database/12-user-can.test.sql` and `25-matrix-conformance.test.sql`.

| # | Step (content anchor) | Authority question | § 3.2 permission | § 3.3 cells — all seven columns | Pinned by | Verdict |
|---|---|---|---|---|---|---|
| 1 | body validation — `Missing required fields: firstName, lastName, email, and projectId are required` | none — request shape | — | no authority asked — all seven columns alike | not an authority step | CONFORMS |
| 2 | `Missing Authorization header`, then `callerClient.auth.getUser()` refusing with `Invalid or expired authentication token` | identity, not authority — "is this a live session?" | — | no authority asked — all seven columns alike | not an authority step | CONFORMS |
| 3 | **THE GATE** — `const mayInvite = await callerMayOnProject(callerClient, projectId, 'project.edit_entities')` | "may this caller create entities in THIS project?" | `project.edit_entities` | Root ✓ · Account ✓ on projects of its own account only, through `user_can`'s account hop · ProjAdmin ✓ · ProjEditor ✓ · Candidate — · OrgEditor — · Faction/Alliance — | flow gate `asks the database for the authority decision rather than re-deriving it (SPEC section 9, 162-REVIEW CR-05)`; `callerAuthority.test.ts` `asks user_can at project scope, for the named project and permission`; pgTAP `the 23-permission answer vector for RootAdmin equals the matrix row` and the same sentence for AccountAdmin, ProjectAdmin, ProjectEditor, Candidate, OrganizationEditor, FactionEditor and AllianceEditor; `matrix row project.edit_entities` | CONFORMS |
| 4 | the account column of the gate — `user_can` resolves which account owns `projectId` | "does the account this admin administers own THIS project?" | `project.edit_entities` | Account ✓ only where the project belongs to the admin's account; an account admin of any other account is — ; the other six cells as row 3 | pgTAP `an account admin is denied every permission on a project in another account` and `the 23-permission answer vector for AccountAdmin equals the matrix row` | CLOSED — F-5 |
| 5 | the ProjEditor column of the gate — no role literal left in the function | "does a ProjectEditor of THIS project pass?" | `project.edit_entities` | ProjEditor ✓, as § 5 grants; the other six cells as row 3 | pgTAP `the 23-permission answer vector for ProjectEditor equals the matrix row`; flow gate `asks the database for the authority decision rather than re-deriving it (SPEC section 9, 162-REVIEW CR-05)` (no scope or role comparison left in the source) | CLOSED — F-5 |
| 6 | fail closed on anything but a literal true — `return !error && data === true;` in `callerAuthority.ts` | "what does an error, a non-boolean or a blank project mean?" | `project.edit_entities` | every column — on an error, a non-boolean answer, a thrown client or a blank project id; no cell is widened by a failure | `callerAuthority.test.ts` `denies when user_can answers false`, `denies on an RPC error even if data looks truthy`, `denies on a non-boolean answer`, `denies when the client throws`, `denies without a round trip for project id %j` | CONFORMS |
| 7 | refusal on the answer — `if (!mayInvite)` returning `status: 403` and `Forbidden: caller may not create candidates in this project`, before the first `SUPABASE_SERVICE_ROLE_KEY` | "is the answer obeyed before the service role acts?" | `project.edit_entities` | the — cells of row 3 (Candidate, OrgEditor, Faction/Alliance, and an account admin of another account) are refused here, before any service-role work | flow gate `refuses on the answer of the gate, with a 403 it RETURNS, before the service-role client exists`; control G1 reddens it | CONFORMS |
| 8 | the gate is asked through `callerClient`, never `supabaseAdmin` | "whose grants does `user_can` read?" | `project.edit_entities` | all seven cells are answered for the CALLER's grants claim; a service-role token carries none | flow gate `asks the gate through the CALLER client, never the service-role client` | CONFORMS |
| 9 | the shared module — `import { callerMayOnProject } from './callerAuthority.ts';` and no local binding of that name | "is the gate the reviewed helper, or a local shadow?" | `project.edit_entities` | a shadow could answer ✓ in every column; the import keeps the seven cells the database's | flow gate `takes its gate from the shared callerAuthority module and declares none of its own` (control G2); `send-email/flowConformance.test.ts` `shares ONE gate module with invite-candidate, byte for byte` | CONFORMS |
| 10 | the RPC bound to the declared signature — `rpc('user_can', { p_scope: 'project', p_target_id, p_permission })` against `CREATE OR REPLACE FUNCTION public.user_can (` in `301-auth-functions.sql` | "does the question reach the predicate at all?" | `project.edit_entities` | a renamed parameter would turn every column to — (an outage, failing closed) | flow gate `binds the gate RPC to the parameter names user_can declares in the schema` (control G4) | CONFORMS |
| 11 | the candidate row — `supabaseAdmin.from('candidates').insert(candidateInsert)` | none — the service role bypasses row-level security by design, so row 3 is the only check | — | no authority asked — all seven columns alike; reached only by the ✓ cells of row 3 | flow gate `asks the gate through the CALLER client, never the service-role client` (the gate precedes the service-role key) | CONFORMS |
| 12 | the invite e-mail — `inviteUserByEmail(email, …)` with `redirectTo` built from `/candidate/complete-registration` | none | — | no authority asked — all seven columns alike | F-2's measurement (the route is absent from `apps/frontend/src/routes`) | GAP — F-2 |
| 13 | the invited identity's grant — `writeEntityGrant(supabaseAdmin, { …, entityType: 'candidate', … })` | "what may the invited candidate do?" | the grant IS the answer | § 3.1 row 5 `(entity, candidate, id, editor)`: the Candidate column only; no project-level column is written | flow gate `names the invited identity as a CANDIDATE entity at the one write site in the flow (D-20, D-21)` — the **call site** in `index.ts`, matched whole (`userId: inviteData.user.id`, `entityType: 'candidate'`, `entityId: candidate.id`), with the write site and the entity-type literal each counted at exactly one; the `(entity, …, editor)` half of the row is carried by the module-level `MODULE-LEVEL, not flow-level: writeEntityGrant writes a grant shape that is one of § 3.1’s eight rows`, which drives `entityGrant.ts` with arguments the TEST supplies and therefore evidences the module, not this flow (162-REVIEW CR-03) | CONFORMS |
| 14 | a failed grant write ABORTS — `Failed to grant the invited candidate access to their own record`, after `rollbackInvite` deletes the invited auth user and the candidate row | — | — | a grant-less identity answers — in every column, so success would be a false report | flow gate `rolls back the invited auth user as well as the candidate, and treats a failed link as fatal (162-REVIEW WR-07)` | CONFORMS |
| 15 | a failed link is FATAL — `Failed to link the invited user to the candidate record`, after the same `rollbackInvite` | — | — | an unlinked candidate holds the Candidate-column grant yet cannot load its own record; nothing is left behind | flow gate `rolls back the invited auth user as well as the candidate, and treats a failed link as fatal (162-REVIEW WR-07)` | CONFORMS |

**The function creates candidate rows only.** Creating an organization, a faction or an alliance by
invitation is brief § 6.1's scope — the same owner as F-1 — and is recorded under F-1 rather than as a new
finding. The grant WRITE is already entity-type parameterised (row 13), so a second entity kind is a second
call site, not a change to the write.

**On rows 4 and 5.** Both are CLOSED rather than CONFORMS because they record defects that were in the tree
when 162-17 marked them CONFORMS; the closing commit is `729964a56` and the reason the earlier check missed
them is F-5.

---

## `send-email` — bulk send (D-25's fifth module)

Re-derived by 162-18 against the gate in the tree, with the same seven columns as the invite table. "Flow
gate" below means `send-email/flowConformance.test.ts`; pgTAP descriptions are quoted verbatim from
`12-user-can.test.sql` and `07-rpc-security.test.sql`.

| # | Step (content anchor) | Authority question | § 3.2 permission | § 3.3 cells — all seven columns | Pinned by | Verdict |
|---|---|---|---|---|---|---|
| 1 | body validation — `templates must be a non-empty object with locale keys`, `recipient_user_ids must be a non-empty array` | none — request shape | — | no authority asked — all seven columns alike | not an authority step | CONFORMS |
| 2 | `Missing Authorization header`, then `callerClient.auth.getUser()` refusing with `Invalid or expired authentication token` | identity, not authority | — | no authority asked — all seven columns alike | not an authority step | CONFORMS |
| 3 | **THE GATE** — `const mayBulkSend = await callerMayOnProject(callerClient, project_id, 'project.edit_entities')`; the permission is the operator's S-3 NOTE ruling, recorded under D-30 | "may this caller send bulk e-mail for THIS project?" | `project.edit_entities` | Root ✓ · Account ✓ on projects of its own account only, through `user_can`'s account hop · ProjAdmin ✓ · ProjEditor ✓ · Candidate — · OrgEditor — · Faction/Alliance — | flow gate `asks the database for the authority decision rather than re-deriving it (SPEC section 9, 162-REVIEW WR-09)` and `names the permission bulk send asks for, and it is a member of the ratified 23 (D-30, operator S-3 NOTE)`; `callerAuthority.test.ts` `asks user_can at project scope, for the named project and permission`; pgTAP `the 23-permission answer vector for ProjectEditor equals the matrix row` and the same sentence for the other seven user types | CONFORMS |
| 4 | fail closed on anything but a literal true, and refusal on the answer — `if (!mayBulkSend)` returning `status: 403` and `Forbidden: caller may not send bulk email for this project`, before the first `SUPABASE_SERVICE_ROLE_KEY` | "is the answer obeyed before the service role acts?" | `project.edit_entities` | the — cells of row 3 (Candidate, OrgEditor, Faction/Alliance, and an account admin of another account) are refused here | flow gate `refuses on the answer of the gate, with a 403 it RETURNS, before the service-role client exists` (control G1s); `callerAuthority.test.ts` `denies on an RPC error even if data looks truthy`, `denies on a non-boolean answer`, `denies when the client throws` | CONFORMS |
| 5 | the gate is asked through `callerClient`, never `supabaseAdmin` | "whose grants does `user_can` read?" | `project.edit_entities` | all seven cells answered for the CALLER's grants claim | flow gate `asks the gate through the CALLER client, before the service-role client exists` | CONFORMS |
| 6 | the shared module — `import { callerMayOnProject } from './callerAuthority.ts';`, byte-identical to `invite-candidate`'s copy | "is the gate the reviewed helper, or a local shadow?" | `project.edit_entities` | a shadow could answer ✓ in every column; the import keeps the seven cells the database's | flow gate `takes its gate from the shared callerAuthority module and declares none of its own` (control G2s) and `shares ONE gate module with invite-candidate, byte for byte`; `DUPLICATED_MODULES` in `scripts/assert-edge-env-defaults.mjs` | CONFORMS |
| 7 | **THE ACCOUNT-TO-PROJECT REACH** — `user_can` resolves which account owns `project_id` | "does the account this admin administers own THIS project?" | `project.edit_entities` | Account ✓ only where the project belongs to the admin's account; an account admin of any other account is — ; the other six cells as row 3 | pgTAP `an account admin is denied every permission on a project in another account` and `the 23-permission answer vector for AccountAdmin equals the matrix row` | CLOSED — F-4 |
| 8 | the configured-project binding after the gate — `requireEnv('PUBLIC_PROJECT_ID', …)`, then the `Invalid project_id` refusal for any other request project | not a matrix question — a deployment binding: "is the request's project the one this deployment serves?" | — | no authority asked — all seven columns alike; reached only by the ✓ cells of row 3 | flow gate `binds bulk send to the configured project after the gate, and resolves recipients only in that project` (control G5) | CONFORMS |
| 9 | the configured sender only — `const senderAddress = requireEnv('SMTP_FROM'`, and a differing request `from` refused with `Invalid from` (WR-02) | none — the deployment's SMTP identity is not the caller's | — | no authority asked — all seven columns alike | flow gate `sends the HTML part with escaped variables and never as a caller-chosen sender (162-REVIEW WR-02)` | CONFORMS |
| 10 | recipient resolution — the service-role `rpc('resolve_email_variables'` with `p_project_id: configuredProjectId`, bounded to users holding a grant that resolves to that project, not executable by anon or authenticated | no § 3.2 member applies — a recipient-scope rule: "whose addresses may this send reach?" | — | no authority asked — all seven columns alike; the recipient set, not the caller, is what is bounded | flow gate `binds bulk send to the configured project after the gate, and resolves recipients only in that project`; pgTAP `resolve_email_variables is NOT executable by anon (CR-01)`, `resolve_email_variables is NOT executable by an authenticated caller, even a project admin (CR-01)` and `resolve_email_variables asked for project B returns NO row for a user whose only grant is in project A (WR-02)` | CONFORMS |
| 11 | writes no grant | none — an authorisation gate, not an identity entry point | — | no authority asked — all seven columns alike | flow gate `writes no grant at all — it is an authorisation gate, not an identity entry point` | CONFORMS |

**The account reach is closed, not carried.** 162-17 recorded here that an account administrator was
accepted without resolving which account contains the named project, and carried it as WINDOWS 263. The
gate that did so is gone: the decision is `user_can`'s, which makes the project-to-account hop in the
database, so an account admin of another account is refused at row 4 exactly like any other — cell. Row 7
records that as CLOSED under F-4, pinned by the pgTAP description quoted in it, and WINDOWS 263 is marked
fixed.

---

## `identity-callback` — the bank-authentication entry point

Re-derived by 162-18, with the same seven columns. "Flow gate" means
`identity-callback/flowConformance.test.ts`, unchanged by 162-18.

| # | Step (content anchor) | Authority question | § 3.2 permission | § 3.3 cells — all seven columns | Pinned by | Verdict |
|---|---|---|---|---|---|---|
| 1 | decrypt and verify the provider's token — `decryptJweToken`, then `jose.jwtVerify` | identity, not authority | — | no authority asked — all seven columns alike | the refusals `Token decryption failed` and its siblings log and never echo (the `identity-callback` convention) | CONFORMS |
| 2 | bind `aud` / `iss` through `requireVerifyClaimBinding` on the path to `jose.jwtVerify` | identity — "was this token minted for this deployment?" | — | no authority asked — all seven columns alike | `verifyConfig.test.ts` `is accepted under the pre-fix empty options object and rejected under the guard output`; `envReadSites.test.ts` `binds both verification claims through the one guard on the path to jwtVerify` | CONFORMS |
| 3 | the project — `requireEnv('PUBLIC_PROJECT_ID', …)`, a request project honoured only when it names the configured one | not a matrix question — a deployment binding | — | no authority asked — all seven columns alike | `envReadSites.test.ts` `reads %s through requireEnv` | CONFORMS |
| 4 | find or create the candidate through the service role — `findExistingCandidate(supabaseAdmin, { projectId, authUserId: userId })`, else `createCandidate` | none — the service role bypasses row-level security by design | — | no authority asked — all seven columns alike | `candidateRecord.test.ts` `names the project on every candidates query the helper module issues` | CONFORMS |
| 5 | the row is written `confirmed: true` in `candidateRecord.ts` (the paragraph `WHY THE ROW IS WRITTEN CONFIRMED`) — D-10's one automatic path | "is this identity the entity it claims to be?" | `entity.confirm` | Root ✓ · Account ✓ · ProjAdmin ✓ · ProjEditor ✓ · Candidate — · OrgEditor — · Faction/Alliance — ; the write is the provider's assertion made service-side, where `enforce_entity_immutability`'s confirmation gate — scoped to the effective role `authenticated` — does not apply, so no entity-user cell is exercised | `candidateRecord.test.ts` `writes the confirmation flag as true and never as false or absent` | CONFORMS |
| 6 | the grant on BOTH branches — `await writeEntityGrant(supabaseAdmin, { …, entityType: 'candidate', … })` after the new- and existing-candidate branches join, idempotent on a unique violation (WR-06) | "what may this identity do?" | the grant IS the answer | § 3.1 row 5 `(entity, candidate, id, editor)`: the Candidate column only | flow gate `writes the grant on BOTH the new-candidate and the existing-candidate branch, so a failed first write is repaired (162-REVIEW WR-06)` and `writes a grant shape that is one of § 3.1’s eight rows`; `entityGrant.test.ts` `treats a unique violation (the grant already exists) as success` | CONFORMS |
| 7 | a failed grant write THROWS | — | — | a grant-less identity answers — in every column, so a swallowed failure would be a false success | flow gate `a failed grant write THROWS rather than being swallowed (D-20)`; `entityGrant.test.ts` `still throws for any other coded failure, such as a foreign-key violation` | CONFORMS |
| 8 | **entity-type SELECTION anywhere on the path** — exactly one `entityType: 'candidate'` argument, beside the comment `The entity type is named HERE and nowhere else` | "WHICH of the four entity kinds is this identity?" | — the matrix admits four, the flow writes one | § 3.1 rows 5–8: the Candidate column is reachable, OrgEditor and Faction/Alliance are not | flow gate `still names exactly ONE entity type on the whole path — D-22’s gap, pinned as OPEN` | DEFERRED — F-1 |
| 9 | magic-link redirect — `redirectTo` built as `${redirectSiteUrl}/candidate` | none | — | no authority asked — all seven columns alike | not an authority step | CONFORMS |

---

## Nomination and entity confirmation — the database-enforced flow, checked at level 1

Criterion 7 names two flows and level-1; the 162-17 version of this document walked the Edge Function flows
only and had no section for this one. Written by 162-19 against the tree. Confirmation is not an Edge
Function flow: it is enforced in the database by two SECURITY INVOKER triggers, `enforce_nomination_confirmation`
(fired by `enforce_nomination_confirmation_before_insert_or_update` on `public.nominations`) and the
confirmation gate of `enforce_entity_immutability` (fired by `enforce_entity_immutability` on each entity
table), so every row below is pinned by pgTAP rather than by a vitest gate. Descriptions are quoted verbatim
from `23-nominations-write.test.sql`, `19-entity-immutability.test.sql`, `12-user-can.test.sql` and the new
`32-level1-confirmation-flow.test.sql`, which drives a ProjectEditor — a project-scope `editor` grant and no
other, built as a `public.grants` row — through both triggers. Controls **N1** and **N2** are recorded in
`evidence/162-19/confirmation-controls.txt`.

| # | Step (content anchor) | Authority question | § 3.2 permission | § 3.3 cells — all seven columns | Pinned by | Verdict |
|---|---|---|---|---|---|---|
| 1 | an entity user edits its own confirmed nomination — `enforce_nomination_confirmation` rule 2, `NEW.confirmed := false` for an `authenticated` caller without `nomination.confirm` | "may an edit by this caller keep the row confirmed?" | `nomination.edit` held, `nomination.confirm` withheld | `nomination.confirm`: Root ✓ · Account ✓ · ProjAdmin ✓ · ProjEditor — · Candidate — · OrgEditor — · Faction/Alliance — ; an entity user's edit (`nomination.edit` own, unless locked) therefore lands unconfirmed | pgTAP 23 `an entity user editing their own confirmed nomination leaves it UNCONFIRMED -- the review gate, which an entity user who could edit and keep confirmation would have defeated` | CONFORMS |
| 2 | an entity user turns confirmation ON — `enforce_nomination_confirmation` rule 2, `Setting nomination % confirmed requires the nomination.confirm permission` | "may this caller confirm?" | `nomination.confirm` | Root ✓ · Account ✓ · ProjAdmin ✓ · ProjEditor — · Candidate — · OrgEditor — · Faction/Alliance — ; the Candidate column is refused by name | pgTAP 23 `an entity user attempting to turn confirmation ON is REFUSED with a named exception -- silently ignoring an explicit request is how a client comes to believe it succeeded` | CONFORMS |
| 3 | **level 1 edits** — a ProjectEditor edits a confirmed nomination in its project; `enforce_nomination_confirmation` rule 2 applies because `user_can('project', …, 'nomination.confirm')` answers false | "does a level-1 edit keep the row confirmed?" | `nomination.edit` held, `nomination.confirm` withheld | `nomination.edit`: ProjEditor ✓ (one row affected); `nomination.confirm`: ProjEditor —, so the row lands unconfirmed; Root · Account · ProjAdmin ✓ on both; Candidate · OrgEditor · Faction/Alliance as row 1 | pgTAP 32 `L1: the ProjectEditor edits a confirmed nomination in its project and exactly one row is affected -- nomination.edit is held` and `L1: the ProjectEditor's edit leaves the nomination UNCONFIRMED -- rule 2 of enforce_nomination_confirmation applies to level 1, so only a confirm-holder can restore it`; control **N1** reddens the second | CONFORMS |
| 4 | **level 1 confirms** — a ProjectEditor sets `confirmed = true`; `enforce_nomination_confirmation` raises the named refusal | "may level 1 confirm?" | `nomination.confirm` | ProjEditor — (the § 6 subtraction); Root ✓ · Account ✓ · ProjAdmin ✓ · Candidate — · OrgEditor — · Faction/Alliance — | pgTAP 32 `L2: the ProjectEditor turning confirmation ON is REFUSED, naming nomination.confirm -- the level-1 subtraction exercised through the flow it governs`, preceded by the two L0 assertions that the caller holds `project.edit_nominations` and not `nomination.confirm`; control **N1** reddens it | CONFORMS |
| 5 | the paired control — a ProjectAdmin edits and confirms in ONE statement; `enforce_nomination_confirmation` rule 3, the supplied value stands | "is the refusal the missing permission, or a block?" | `nomination.confirm` | ProjAdmin ✓ (and Root ✓ · Account ✓ through the same rule 3); ProjEditor — as row 4; the three entity columns — | pgTAP 32 `L3: the ProjectAdmin edits and confirms the same nomination in ONE statement -- so L2's refusal is the missing nomination.confirm and not a blanket block`; pgTAP 23 `a holder of nomination.confirm may edit and confirm in ONE statement -- the paired opposite of the two assertions above`; both stay green under **N1**, as a paired control must | CONFORMS |
| 6 | a write with no `authenticated` role in effect — `enforce_nomination_confirmation` rule 2 is scoped to `current_user = 'authenticated'`, and `enforce_entity_immutability` returns early for any other effective role | none — the service role is not a matrix column | — | no matrix cell is asked; a service-role write (re-seed, bulk import, `identity-callback`) keeps the supplied flag. This is what makes `identity-callback`'s service-side `confirmed: true` on the candidate row legitimate (its step 5 above) | pgTAP 23 `an update performed with no authenticated role in effect leaves the flag exactly as supplied -- what stops a service-role re-seed unconfirming everything it upserts` | CONFORMS |
| 7 | a nomination carrying the requested-parent key — `enforce_nomination_confirmation` rule 1, on either verb and for every caller | "may this row be confirmed at all?" | `nomination.confirm` | refused in all seven columns, the ✓ cells included: no holder of `nomination.confirm` may confirm a row whose party request is unresolved | pgTAP 23 `REQ: a nomination carrying the requested-parent key CANNOT be confirmed -- confirming it would publish as an independent a candidate who asked for a party` | CONFORMS |
| 8 | **level 1 confirms an entity** — a ProjectEditor changes a candidate's `confirmed` flag; `enforce_entity_immutability` rule 1 asks `user_can('entity', NEW.id, 'entity.confirm')` and it answers true | "may level 1 confirm an entity?" | `entity.confirm` | Root ✓ · Account ✓ · ProjAdmin ✓ · ProjEditor ✓ · Candidate — · OrgEditor — · Faction/Alliance — ; the ProjEditor cell is exercised and the change lands | pgTAP 32 `L4: the ProjectEditor may change an entity's confirmed flag -- entity.confirm is held at level 1` and `L4: the ProjectEditor's change of the entity flag LANDED -- the statement did not merely survive while affecting nothing`; both stay green under **N2**, as the paired allowance must | CONFORMS |
| 9 | an entity user changes its own `confirmed` flag — `enforce_entity_immutability` rule 1, `Entity confirmation requires the entity.confirm permission:` | "may an entity user confirm or unconfirm itself?" | `entity.confirm` | Candidate — (exercised here); OrgEditor — and Faction/Alliance — through the same rule on `organizations`, `factions` and `alliances`; Root · Account · ProjAdmin · ProjEditor ✓ as row 8 | pgTAP 32 `L5: the entity user changing its own confirmed flag is REFUSED by name -- the paired contrast to L4, entity.confirm withheld from entity users` (control **N2** reddens it); pgTAP 19 `candidates: an entity grantee cannot confirm its own entity either` and `candidates: an entity grantee cannot UNCONFIRM its own entity -- the direction that would unfreeze the name` | CONFORMS |

**Level 1, checked through the flow it governs.** `162-SPEC.md` § 6 defines the ProjectEditor as the
ProjectAdmin minus three permissions: `project.manage_editors`, `project.edit_project_settings` and
`nomination.confirm`. The first two are pinned at the predicate, by the `12-user-can.test.sql` description
`the 23-permission answer vector for ProjectEditor equals the matrix row` (and its sibling `a project editor is
denied the three cells that distinguish it from a project admin`). The third is the one that only means
something through the flow it governs, and rows 3–5 exercise it there: a level-1 edit lands and unconfirms,
a level-1 confirmation is refused naming `nomination.confirm`, and the ProjectAdmin's one-statement
edit-and-confirm shows the refusal is that permission and not a block. The trigger's own header — the
paragraph beginning `A PROJECT EDITOR'S EDIT ALSO TURNS CONFIRMATION OFF` — recorded this behaviour and said
nobody had written it down; until `32-level1-confirmation-flow.test.sql` no assertion pinned it. Row 8 checks
the permission level 1 keeps (`entity.confirm`) with row 9 as its contrast. Every row conforms; this section
adds no finding.

---

## Findings

Five, each re-derived from the tree rather than copied forward (F-1, F-3, F-4 and F-5 by 162-18, F-2 by 162-18 and again by 162-19), and each with an owner: F-1 DEFERRED, F-2 GAP, F-3, F-4 and F-5 CLOSED.

### F-1 — entity-type selection is absent at the identity entry point · **DEFERRED** · owner: brief § 6.1

**Measured (162-18, by content anchor):** `identity-callback/index.ts` carries exactly one
`entityType: 'candidate'` argument on the whole path, in the `writeEntityGrant` call beside the comment
beginning `The entity type is named HERE and nowhere else`. There is no selection parameter, no request field
and no branch anywhere on the path. The grant WRITE is fully parameterised — all four types are accepted and
all four are exercised by the flow gates' `… takes the entity type as a VALUE … (D-20, D-21)` pair (prefixed
`MODULE-LEVEL, not flow-level:` in `invite-candidate` since 162-REVIEW CR-03) — so what is missing is the
SELECTION, not the capability.

**Status on re-derivation: OPEN.** D-22 records it; 162-06 is prohibited from closing it and defers it to
brief § 6.1 by name. **Owner: the sign-up phase, brief § 6.1.** Creating an organization, a faction or an
alliance by invitation — `invite-candidate` creates candidate rows only — is brief § 6.1's scope too, and
shares this owner; it is recorded here rather than as a new finding.

**Pinned in the gate.** `identity-callback/flowConformance.test.ts` pins it OPEN with the test titled
`still names exactly ONE entity type on the whole path — D-22’s gap, pinned as OPEN`. When § 6.1 closes the
gap, that assertion reddens — which is the signal that this DEFERRED row has stopped being true and this
document needs re-deriving.

### F-2 — the invite's redirect names a route the tree does not carry · **GAP** · owner: a standalone defect

**Measured (re-derived by 162-19, by content anchor):** `invite-candidate/index.ts` builds its invite
redirect as the `redirectTo` template ending `/candidate/complete-registration`, passed to
`inviteUserByEmail`. `find apps/frontend/src/routes -ipath "*complete-registration*"` returns nothing, and
`git grep -l complete-registration` outside `.planning` returns exactly one tracked file —
`apps/supabase/supabase/functions/invite-candidate/index.ts`, that template. M7 / fact 18 recorded it before
this phase started; 162-18 and 162-19 both re-measured it, and it is still true at the re-derivation HEAD.
WINDOWS 272 stays open.

**Status on re-derivation: OPEN.** The e-mail invite flow is broken end to end today, independently of this
phase. **No plan in phase 162 owns it**, and a criterion-7 conformance check that did not surface it would
be a check that confirms whatever it is shown. Reported as a standalone defect.

### F-3 — bulk send gated on grant shapes § 3.2 enumerates no member for · **CLOSED** · owner: 162-06, re-closed by WR-09

**Re-derived against the gate in the tree.** The operator's S-3 NOTE supplied `project.edit_entities` as
the permission bulk send asks for (D-30), an existing member of the ratified 23, so no enum was widened. The
finding stays **CLOSED**, but it is no longer closed by 162-06's hand-coded branches: since `3e3c2a0f1` it is
closed by the single `callerMayOnProject(callerClient, project_id, 'project.edit_entities')` call, which asks
`public.user_can` and so carries § 5's whole `project.edit_entities` row. That row now also admits the
ProjectEditor, whom § 5 grants the permission. Pinned by the flow gate's `names the permission bulk send asks
for, and it is a member of the ratified 23 (D-30, operator S-3 NOTE)` and `refuses on the answer of the gate,
with a 403 it RETURNS, before the service-role client exists`, and by the pgTAP description `matrix row
project.edit_entities`.

### F-4 — the account-to-project reach in bulk send · **CLOSED** by CR-05 and WR-09 · owner: 162-REVIEW

**What it was.** 162-17 recorded `send-email`'s account branch as "CONFORMS with a residual": an account
administrator was accepted without resolving which account owns the project the request names. The residual
was carried, not closed, as `.planning/WINDOWS.md` row 263.

**CLOSED by `729964a56` (CR-05) and `3e3c2a0f1` (WR-09)**: both Edge Functions now ask `public.user_can`,
which resolves which account owns the project before it answers for an account grant — the reach rule this
document said the function should not copy, and which it no longer has to. Pinned by the `12-user-can.test.sql`
description `an account admin is denied every permission on a project in another account`. **WINDOWS 263 is
marked `fixed`.** WINDOWS 272 (F-2) stays open.

### F-5 — two invite steps 162-17 marked CONFORMS did not conform · **CLOSED** by CR-05 · owner: 162-REVIEW

**What the earlier check returned.** 162-17's `invite-candidate` table marked every step of the gate
CONFORMS. Two of them did not conform to § 5's `project.edit_entities` row. The account branch admitted an
account admin of ANY account, because it never resolved which account owns the project the request names —
162-17 recorded that reach as a residual for `send-email` only, and passed the identical reach in
`invite-candidate` without comment. The project branch admitted only the `admin` role, refusing the
ProjectEditor whom § 5 grants `project.edit_entities`.

**Found by 162-REVIEW CR-05, not by this check. CLOSED by `729964a56`**: the function now asks
`public.user_can` through the caller's own token, which holds the project-to-account hop and the full
matrix row. Pinned by the `12-user-can.test.sql` descriptions `an account admin is denied every permission
on a project in another account` and `the 23-permission answer vector for ProjectEditor equals the matrix
row`, and by the flow gate's `refuses on the answer of the gate, with a 403 it RETURNS, before the service-role
client exists`.

**Why it was missed.** Each hand-coded branch was compared with the one cell that branch named — the
account branch with the Account cell, the project branch with the ProjAdmin cell — and the permission's row
was never walked across every column. A branch-by-branch comparison cannot see a column no branch names,
and it cannot see a reach rule the branch does not make. That is why every re-derived table in this
document now carries all seven columns in one cell, and why the account reach is its own row.

### Open product decision, cross-referenced — WR-04

Not a finding of this check, and recorded here so the check is not read as silent on it. A ProjectEditor is
admitted by both Edge Function gates — § 5 grants it `project.edit_entities`, and `callerMayOnProject` asks
exactly that — but `ADMIN_GRANTS` in `apps/frontend/src/lib/auth/roles.ts` does not open the Admin App to
it; and an identity holding both an admin grant and a candidate grant is routed to the Candidate App by
`_getBasicUserData`'s role normalisation. Both are app-entry routing questions, skipped by
`162-REVIEW-FIX.md` as needing a product decision and carried as `162-VERIFICATION.md`'s human-verification
item. Authority is unaffected either way: WR-03 backs every admin entry point with a `user_can` call, so the
routing decides which app an identity lands in, never what it may do there. No code change is made here.

---

## What the executable half enforces on every build

Rewritten by 162-19 from the tests as they stand. Every `it(` title of the three `flowConformance.test.ts`
files and of `invite-candidate/callerAuthority.test.ts` maps to one row of the vitest half; each row names
the control that keeps it able to fail, with the reddened count from its evidence file, or the paired
assertion that plays that role. Two properties 162-17's version of this table carried are no longer asserted
by these files, because the code that needed them is gone: the per-column grant matching and the
project-scope match were properties of the retired claim read, and both now live in `user_can`, pinned by
`12-user-can.test.sql`.

**Controls cited.** G1–G5 (and G1s–G3s) are 162-18's plants, in `evidence/162-18/flow-controls.txt`. F1,
F2 and F2i are this plan's re-measurement of 162-17's vocabulary and literal controls against the current
corpus (T0 = 46 across the three flow files; 48 since the 162-REVIEW fix run), in
`evidence/162-19/flow-controls-rerun.txt`. The F1 and F2
rows of `162-NEGATIVE-CONTROL-LEDGER.md` are 162-17's measurement at `64d2995c1` over 36 tests (F1 reddened
5, F2 reddened 2), cited as history and not rewritten. N1 and N2 are the applied-database controls in
`evidence/162-19/confirmation-controls.txt`.

### The vitest half

| Property | Where | Kept non-vacuous by |
|---|---|---|
| the permission vocabulary is derived from `schema/000-enums.sql` and has exactly 23 members before any membership assertion uses it — `derived a 23-member permission vocabulary before any membership assertion uses it` | all three flow files | **F1** — the enum body reduced to one non-member; reddened 6 of 46, this title once in each file. **"BEFORE" is enforced since 162-REVIEW WR-05** in `invite-candidate` and `send-email`: the pin also sits in a `beforeAll` that THROWS, so a short derivation aborts the describe with one named error and the membership assertions are SKIPPED rather than each reporting a confusing "permission outside the enum". Measured with `'project.edit_entities'` removed from the enum body: `Error: derivePermissionVocabulary parsed 22 members … expected 23`, 35 skipped. The peer `it` guards are kept for readability. **RESIDUE, follow-up:** `identity-callback` still has the peer-`it` form only. Note the earlier rationale ("an empty vocabulary would make every membership check pass for everything") was FALSE — an empty derivation reddens the membership checks outright; what the pin guards is a PARTIAL one. Both docblocks now say so |
| every permission literal the module names is a member — `names no permission literal outside the derived enum` | all three flow files | **F2** (a non-member planted in `send-email`, reddened 1) and **F2i** (the same in `invite-candidate`, reddened 1), each naming this title; **F1** reddens it in both files too. `identity-callback` names no permission literal, so there it is a tripwire for one being added |
| the membership check has something to check — `names at least one permission literal IN CODE, so the membership assertion below is not vacuous` | `invite-candidate`, `send-email` | it is itself the paired guard for the row above. Measured over the module with its comments STRIPPED since 162-REVIEW WR-02: two of `invite-candidate/index.ts`'s three `project.edit_entities` occurrences and one of `send-email/index.ts`'s two are prose, so the raw-text form stayed green against a module naming no permission in executable code at all. **F3** / **F3s** — the gate's permission rewritten to `'project' + '.' + 'edit_entities'`, leaving the comments untouched; green under the raw form, reddens 2 in `invite-candidate` and 3 in `send-email` now. The NEGATIVE check `names no permission literal outside the derived enum` still reads the raw text on purpose |
| bulk send asks for a member of the ratified 23 — `names the permission bulk send asks for, and it is a member of the ratified 23 (D-30, operator S-3 NOTE)` | `send-email` | **F1** reddens it (one of the 6) |
| the source read is non-empty and is the module under test — `read a non-empty index.ts, and it is the module under test`, `read a non-empty entityGrant.ts, and it is the module under test` | all three flow files (`entityGrant.ts` in `invite-candidate` and `identity-callback`) | a distinctive string per module, the paired assertion that stops every text assertion passing over an empty read |
| no retired claim key is read — `reads no retired claim key: %s`, once per key | all three flow files | the bare KEY asserted absent in `invite-candidate` and `send-email`; the read assertions above prove the text searched is the module. Until 162-REVIEW WR-01 all three files asserted `payload.<key>` and `['<key>']` instead, and the token `payload` occurs in none of the three modules, so those six assertions could not fail for any realistic edit: `const claims = decodeTokenPayload(jwt); claims.user_roles` passed them. `identity-callback/flowConformance.test.ts` still carries the weak form — **RESIDUE, follow-up**: it was outside the CR/WR fix scope |
| the authority decision is one `callerMayOnProject(callerClient, …, 'project.edit_entities')` call with no scope or role comparison in the source — `asks the database for the authority decision rather than re-deriving it (SPEC section 9, 162-REVIEW CR-05)` / `(… WR-09)` | `invite-candidate`, `send-email` | **G3** / **G3s** — a hand-rolled claim check re-planted; reddened 3 in each file. **G6** / **G6s** — a caller-controlled escape hatch OR'd into the gate (`const mayInvite = (await callerMayOnProject(…)) \|\| body.debugBypass === true`); measured out of tree at 162-REVIEW time to leave all 33 green, because the pinned call text was still present and `await X \|\| Y` parses as `(await X) \|\| Y` so the prefix match survived. Since 162-REVIEW CR-02 bound the WHOLE assignment statement and pinned the gate variable at exactly one assignment, it reddens 2 in each file |
| the gate is the shared `callerAuthority.ts`, not a local shadow — `takes its gate from the shared callerAuthority module and declares none of its own` | `invite-candidate`, `send-email` | **G2** / **G2s** — a local always-true function appended; reddened 1 in each |
| the two gate copies are one module — `shares ONE gate module with invite-candidate, byte for byte` | `send-email` | compares against `invite-candidate`'s copy read from disk; `DUPLICATED_MODULES` in `scripts/assert-edge-env-defaults.mjs` is the lint-side twin |
| the refusal is conditioned on the gate's answer, RETURNS, and precedes the service-role client — `refuses on the answer of the gate, with a 403 it RETURNS, before the service-role client exists` | `invite-candidate`, `send-email` | **G1** / **G1s** — the refusal condition made constant false; reddened 1 in each (and among the 3 of G3 / G3s). **G1b** / **G1bs** — the `return` deleted in front of `new Response`, so the 403 is constructed and discarded and execution falls through to the service-role client; measured out of tree at 162-REVIEW time to leave all 33 green, and reddens 1 in each file since 162-REVIEW CR-01 rewrote the assertion from five ordered `indexOf` hits to one contiguous `return new Response` block |
| the gate is asked through the caller's own client — `asks the gate through the CALLER client, never the service-role client` / `asks the gate through the CALLER client, before the service-role client exists` | `invite-candidate`, `send-email` | **G3** / **G3s** redden it in each |
| the helper's RPC arguments are the parameter names `user_can` declares — `binds the gate RPC to the parameter names user_can declares in the schema` | `invite-candidate` | **G4** — `p_target_id` renamed in a scratch schema; reddened 1. **G7** — `callerAuthority.ts`'s `p_scope` changed from `'project'` to `'global'`, the OUTAGE this row's own comment says it guards (a `global`-scope question denies every caller, so every invite fails closed). Green until 162-REVIEW WR-04, because the test asserted only that `p_scope` was ANY of the four scopes and never asserted `p_target_id` or `p_permission` at all; reddens 1 now that all three arguments are asserted exactly |
| bulk send is bound to the configured project and recipients resolve only there — `binds bulk send to the configured project after the gate, and resolves recipients only in that project` | `send-email` | **G5** — the recipient RPC pointed at the request's project; reddened 1 |
| the HTML part escapes substituted values and the sender is the configured one — `sends the HTML part with escaped variables and never as a caller-chosen sender (162-REVIEW WR-02)` | `send-email` | the escaping itself is exercised by behaviour in `templateVars.test.ts`. The SENDER half had no planted control and no positive assertion until 162-REVIEW WR-06: it was `not.toMatch(/from\s*\|\|\s*requireEnv/)`, one historical spelling, and the line that decides the envelope sender (`from: senderAddress` at the `transport.sendMail` call) was unpinned. Now bound positively, with `from:` counted at exactly one in executable code. **G8a/G8b/G8c** — `from: from ?? senderAddress`, `from: body.from` and `from: from \|\| senderAddress` at the send site; all three passed the old negative, each reddens 1 now |
| `send-email` writes no grant — `writes no grant at all — it is an authorisation gate, not an identity entry point` | `send-email` | a negative text assertion over the module the read assertion proved is present |
| a failed invite rolls back the auth user and the candidate, and a failed link is fatal — `rolls back the invited auth user as well as the candidate, and treats a failed link as fatal (162-REVIEW WR-07)` | `invite-candidate` | an exact count of two `rollbackInvite` calls, so removing either one reddens |
| the INVITE FLOW's own call site names a candidate entity — `names the invited identity as a CANDIDATE entity at the one write site in the flow (D-20, D-21)` | `invite-candidate` | **M7** — the call rewritten to `entityType: 'organization', entityId: projectId`; measured out of tree at 162-REVIEW time to leave all 17 green, because no assertion in the file reached `index.ts`'s call site at all. Reddens 1 since 162-REVIEW CR-03 added the assertion |
| the grant written is one of § 3.1's eight rows — `MODULE-LEVEL, not flow-level: writeEntityGrant writes a grant shape that is one of § 3.1’s eight rows` (`invite-candidate`) / `writes a grant shape that is one of § 3.1’s eight rows` (`identity-callback`) | `invite-candidate`, `identity-callback` | asserted by IMPORT of `entityGrant.ts` against a recording client, with scope, role and target type each asserted exactly. The arguments are the TEST's, so this evidences the MODULE and not the flow — the flow's half is the call-site row above (162-REVIEW CR-03) |
| the entity type arrives as a VALUE — `MODULE-LEVEL, not flow-level: writeEntityGrant takes the entity type as a VALUE rather than as a literal (D-20, D-21)` (`invite-candidate`) / `takes the entity type as a VALUE at the write site rather than as a literal (D-20, D-21)` (`identity-callback`) | `invite-candidate`, `identity-callback` | four calls write four discriminators, and the grant module carries no `'candidate'` literal |
| an entity type outside the four is refused — `refuses an entity type outside the declared four rather than writing an unknown discriminator` | `invite-candidate` | paired with the row above: four accepted, a fifth refused |
| `identity-callback` writes its grant through the extracted module — `writes its grant through the extracted module rather than inline` | `identity-callback` | its negative half: no inline entity-scope grant literal in `index.ts` |
| the grant is written on both candidate branches — `writes the grant on BOTH the new-candidate and the existing-candidate branch, so a failed first write is repaired (162-REVIEW WR-06)` | `identity-callback` | exactly one write call, located after the branches join |
| a failed grant write throws — `a failed grant write THROWS rather than being swallowed (D-20)` | `identity-callback` | a recording client whose insert fails must make the call reject |
| F-1 is still open — `still names exactly ONE entity type on the whole path — D-22’s gap, pinned as OPEN` | `identity-callback` | reddens when brief § 6.1 adds a second entity type, which is the signal to re-derive F-1 |
| the helper asks `user_can` at project scope for the named project and permission — `asks user_can at project scope, for the named project and permission` | `callerAuthority.test.ts` | asserted against a recording client; paired with the fail-closed row below |
| the helper fails closed — `denies when user_can answers false`, `denies on an RPC error even if data looks truthy`, `denies on a non-boolean answer`, `denies when the client throws`, `denies without a round trip for project id %j` | `callerAuthority.test.ts` | paired with the allow case above, so a helper that denied everything could not pass both |

### The database half

| Property | Where | Kept non-vacuous by |
|---|---|---|
| bulk send's recipient resolution is service-role only and bounded to the named project | `07-rpc-security.test.sql` | the paired allowance `resolve_email_variables asked for project A resolves the candidate variables of project A's own candidate (control for the project B zero below)` |
| `user_can`'s answer vector for each of the eight user types equals its matrix row, including the account-to-project hop and the three cells separating ProjectEditor from ProjectAdmin | `12-user-can.test.sql` | every allow paired with a deny, the deny half observed red against an over-permissive `user_can` (the file's own header) |
| the entity confirmation gate, in both directions, on all four entity tables | `19-entity-immutability.test.sql` | **N2** reddens 9 of its assertions; each refusal is paired with a holder's allowance |
| the nomination write model: editing unconfirms, confirming needs `nomination.confirm`, the requested-parent key blocks confirmation, a service-role write keeps its value | `23-nominations-write.test.sql` | **N1** reddens 4 of its assertions; every assertion has a twin |
| § 3.3 as the policies enforce it, row by row | `25-matrix-conformance.test.sql` | 162-17's ledger rows M1 (over-permissive, reddened 28 of 41) and M2 (over-strict, reddened 27 of 41) |
| level 1 through the confirmation flows (L0–L5) | `32-level1-confirmation-flow.test.sql` | **N1** reddens 6-7 (L1, L2) and **N2** reddens 12 (L5), while the paired allowances L3 and L4 stay green |
