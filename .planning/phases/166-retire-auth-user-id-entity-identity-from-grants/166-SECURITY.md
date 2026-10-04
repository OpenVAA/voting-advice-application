---
phase: "166"
slug: "retire-auth-user-id-entity-identity-from-grants"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-04"
---

# Phase 166 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register built from the `<threat_model>` blocks of 166-01..166-04 (authored at plan time), de-duplicated (T-166-SC appears in all four plans and is one row here), plus the `## Threat Flags` sections of 166-01..166-03 SUMMARY (all "None"; 166-04 SUMMARY has no Threat Flags section). Verified against the current HEAD of the `-gsd` worktree (`01ad0a4bc`, after Phases 167-169 landed), at ASVS L1 (grep depth), `block_on: high`. Evidence cites file + content anchor, not line numbers.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| authenticated client -> PostgREST `rpc/get_candidate_user_data` | Any logged-in user names a project and an entity type; the answer must be their own entity and nobody else's. | Entity row (candidate PII: first/last name, answers, ToU timestamp) |
| INVOKER RPC -> `private.caller_entity_ids` (SECURITY DEFINER) | The one place on this path that reads `public.grants`, which every API role is refused. | Grant rows (user-to-entity authority) |
| service-role Edge Functions -> `public.grants` | identity-callback (unauthenticated callers, verify_jwt off) and invite-candidate write grant rows. | Authorization grants; service-role privilege |
| internet -> `identity-callback` (verify_jwt off) | An unauthenticated caller presents a provider token; the function then acts with the service role. | Encrypted ID token (national identity number, name, birthdate) |
| project admin -> `invite-candidate` -> service role | Gated by `callerMayOnProject`; writes candidate, invite and grant. | Candidate record, invite email, grant |
| anon -> public tables | Any column anon can SELECT is public. | Auth user ids (must not cross, except the D-02 exemption) |
| schema source -> applied database | `schema/` is edited; `migrations/00001_initial_schema.sql` is what is applied. | DDL |
| generated types -> application code | `database.ts` is what every package compiles against. | Column/type contract |
| E2E harness -> service-role client | Test-only; the key is guarded to local hosts by `createServiceRoleClient`. | Service-role key (local) |
| test-only keys and IdP env -> the repository | Bank-auth gates need committed TEST private keys and a TLS bypass in process env; neither may reach a committed or default env file. | Test private JWKs, IdP config, `NODE_TLS_REJECT_UNAUTHORIZED=0` |
| gate output -> the recorded verdict | A verdict read through a pipe or a console tail can report green over a failure. | Gate exit status / E2E counts |
| the Docker VM -> run validity | Disk exhaustion voids a run silently. | Run integrity |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-166-01 | Elevation of privilege | `get_candidate_user_data` / `private.caller_entity_ids` | high | mitigate | `apps/supabase/supabase/schema/301-auth-functions.sql` `CREATE OR REPLACE FUNCTION private.caller_entity_ids`: filters `g.user_id = (SELECT auth.uid())`, `g.scope = 'entity'`, `g.role = 'editor'`, `g.target_type = p_entity_type`, per-type `EXISTS ... e.project_id = p_project_id`; no `user_can` call. `503-entity-rpcs.sql` `get_candidate_user_data` uses only `ARRAY (SELECT private.caller_entity_ids (...))`. `tests/database/36-entity-identity.test.sql` asserts 'a project admin resolves to no candidate' (`admin_a`) and 'an admin-role entity grant on a candidate resolves to no candidate'. | closed |
| T-166-02 | Information disclosure | `private.caller_entity_ids` as a definer function | high | mitigate | Function lives in schema `private`; `supabase/config.toml` `[api] schemas = ["public", "graphql_public"]` (private not exposed). Body answers only for `auth.uid()`. 36 asserts 'caller_entity_ids is not a public function, so PostgREST does not publish it'. `07-rpc-security.test.sql` Section 8c census 'the SECURITY DEFINER functions in public that anon can execute are exactly the five allow-listed ones' / authenticated '... same five plus get_entity_basic_data' unchanged (`get_candidate_user_data` is `SECURITY INVOKER`). | closed |
| T-166-03 | Elevation of privilege | definer `search_path` | medium | mitigate | `private.caller_entity_ids` declares `SET search_path = ''` and uses schema-qualified `public.grants` / `public.candidates` etc. 36 asserts `'search_path=""' = ANY (p.proconfig)` ('private.caller_entity_ids is SECURITY DEFINER with an empty search_path'); `18-entity-policies.test.sql` Section 11 census 'every SECURITY DEFINER function in schemas public and private pins its search_path'. | closed |
| T-166-04 | Spoofing / Elevation | a second user's grant on an existing candidate | high | mitigate | `schema/300-auth-tables.sql` `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id) WHERE scope = 'entity' AND target_type = 'candidate' AND role = 'editor'`. Both `functions/{identity-callback,invite-candidate}/entityGrant.ts` (byte-identical, `diff` empty) treat 23505 as success only when `error.message.includes(IDEMPOTENT_GRANT_KEY)` where `IDEMPOTENT_GRANT_KEY = 'grants_user_scope_target_role_key'`. 36 `throws_ok` pins both constraint names ('a second user''s editor grant on a candidate is refused by idx_grants_one_candidate_editor', 'an exact duplicate ... refused by grants_user_scope_target_role_key'). Vitest 'throws when a unique violation names a key other than the grant key' in both `entityGrant.test.ts`. | closed |
| T-166-05 | Tampering (integrity) | ambiguous identity silently picked | medium | mitigate | `503-entity-rpcs.sql` `get_candidate_user_data`: `IF cardinality(v_entity_ids) > 1 THEN RAISE EXCEPTION ... USING ERRCODE = 'P0001', HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS'`; no `LIMIT 1`. 36 `throws_ok` P0001 in both arms ('two organization-editor grants in one project raise'; 'a second candidate-editor grant in the table raises even though the token predates it') plus `pg_temp.hint_of` readback = 'ERR_ENTITY_IDENTITY_AMBIGUOUS'. | closed |
| T-166-06 | Information disclosure | RAISE text reaching server logs | low | mitigate | RAISE message is 'the caller holds an editor grant on more than one % in this project' with only `p_entity_type` interpolated (no uuid). 36 `throws_ok` pins the exact message text for both arms, so adding an id would fail the test. | closed |
| T-166-07 | Information disclosure | anon reading an auth user id from `candidates` / `organizations` (166-01 stage) | high | mitigate | Superseded to completion by T-166-14: `166-NEGATIVE-CONTROLS.md` "NC-4 — anon can read no auth user id" records RED observed then closed; the `# TODO` wrapper is gone (0 `todo`/`TODO` in 36). Census in 36 equals `ARRAY['public.nominations.created_by']`. | closed |
| T-166-08 | Spoofing / Elevation | `findExistingCandidate` adopting another project's candidate | high | mitigate | `functions/identity-callback/candidateRecord.ts` `findExistingCandidate`: candidates query `.eq('project_id', projectId)` `.in('id', ids)` `.maybeSingle()`; `deleteCandidate` also `.eq('project_id', projectId)`. `candidateRecord.test.ts` 'reads the granted candidate in the served project only, as at most one row', 'carries every granted id and the project id it was given rather than one of its own', and source scan 'names the project on every candidates query the helper module issues' + 'holds no candidates chain of its own at all' (index.ts). | closed |
| T-166-09 | Tampering (integrity) | orphan candidate after a failed grant write | medium | mitigate | `functions/identity-callback/index.ts`: `catch (grantError) { if (!existingCandidate) { await deleteCandidate(supabaseAdmin, { projectId, candidateId }).catch(...console.error(...)) } throw grantError; }`. `flowConformance.test.ts` pins order (`branchEnd` < `tryAt` < `catchAt` < `guardAt` < `deleteAt` < `rethrowAt`) and `occurrences('await deleteCandidate(')` = 1. Residue filed: `.planning/todos/pending/2026-10-01-identity-callback-compensating-delete-failure.md`. | closed |
| T-166-10 | Information disclosure | Edge Function error text (verify_jwt off) | medium | mitigate | `candidateRecord.ts` `lookupFailed` / `ERR_CANDIDATE_DELETE_FAILED` messages carry only the client-reported `error.message`. `candidateRecord.test.ts` 'names the client-reported failure of %s and nothing about the deployment' (`not.toContain(PROJECT_ID)` / `AUTH_USER_ID`) and 'rejects with the client-reported text only when the delete fails'. Outer catch in `index.ts` returns fixed literal `{ error: 'Internal server error' }`; delete-failure log is `console.error` only. | closed |
| T-166-11 | Elevation | an invite reported successful with no grant | high | mitigate | `functions/invite-candidate/index.ts`: `catch (grantErr) { await rollbackInvite(supabaseAdmin, { candidateId: candidate.id, userId: inviteData.user.id }); return new Response(..., { status: 500 ... }) }`; no `auth_user_id` update arm remains. `invite-candidate/flowConformance.test.ts` asserts `'await rollbackInvite(supabaseAdmin'` occurs exactly once. | closed |
| T-166-12 | Tampering (test integrity) | teardown ordering that skips the ToU reset | low | mitigate | `tests/tests/utils/supabaseAdminClient.ts` `unregisterCandidate`: step 2 `candidateIdsForUser(user.id)` "BEFORE anything is deleted", step 3 `terms_of_use_accepted: null`, then `from('grants').delete()`, then `deleteUser`. `deleteAllTestUsers` reads `candidateIdsForUser` "BEFORE the grants are deleted" with the same order; both docblocks state the order and reason. | closed |
| T-166-13 | Information disclosure | the service-role key in specs | low | accept | Plan-time accept (166-02). Confirmed no new construction: `candidate-bank-auth.spec.ts` imports `createServiceRoleClient` from `@openvaa/dev-seed`; census `packages/dev-seed/tests/serviceRoleClientCallSites.test.ts` covers it. See Accepted Risks Log. | closed |
| T-166-14 | Information disclosure | anon reading an auth user id from `candidates` / `organizations` | high | mitigate | Case-sensitive `git grep auth_user_id -- . ':!.planning'` returns only the 36 behavioural probe; 0 hits in `schema/`, `migrations/00001_initial_schema.sql`, `packages/supabase-types/src/database.ts`, `permittedKeys.ts`. 36 census (FK to `auth.users`, `has_column_privilege('anon', ...)`, RLS policy check) equals `ARRAY['public.nominations.created_by']`; `throws_ok ($$SELECT auth_user_id FROM public.candidates$$, '42703', ...)` as anon. | closed |
| T-166-15 | Information disclosure | `nominations.created_by` readable by anon | medium | accept | Plan-time accept (166-03, D-02). Census pins it as the single exemption; residue todo `.planning/todos/pending/2026-10-01-nominations-created-by-readable-by-anon.md` exists. See Accepted Risks Log. | closed |
| T-166-16 | Tampering | schema and applied migration diverging | medium | mitigate | `scripts/assert-schema-migration-parity.mjs` (exit 1 on "a byte difference, a second migration file, a failed self-check"); root `package.json` `lint:check` chains `yarn assert:schema-migration-parity`. `migrations/` holds only `00001_initial_schema.sql`. | closed |
| T-166-17 | Tampering | generated types drifting from the schema | low | mitigate | `packages/supabase-types/src/database.ts` carries no `auth_user_id`; `packages/dev-seed/src/template/permittedKeys.ts` `TABLE_COLUMNS ... satisfies { [C in CollectionKey]: ReadonlyArray<Extract<keyof TablesInsert<C>, string>> }` plus `_NoMissingColumns` (both directions). | closed |
| T-166-18 | Information disclosure | test private JWKs, IdP env, `NODE_TLS_REJECT_UNAUTHORIZED=0` | medium | mitigate | `166-04-gate-evidence/GATES.md` records env files in the session scratchpad only (`bank-auth-edge.env`, `bank-auth-journey-edge.env`, `bank-auth-journey.env`), TLS bypass sourced "in that shell only", and the leak check `! ... grep -qE '(^\|/)\.env\|functions/'` exit 0. Current HEAD: `git status --untracked-files=all` clean apart from unrelated `.planning/quick`; only `functions/.env.example` is tracked; `NODE_TLS_REJECT_UNAUTHORIZED` appears in committed test code only as a comment. The gitignored `functions/.env` has mtime 2026-09-28 (predates 166-04, not written by it; contents not read). | closed |
| T-166-19 | Repudiation | gate verdicts | medium | mitigate | `GATES.md`: each row records the command's own exit; E2E totals decoded from `report.json` inside `playwrightReportBase64`, cross-checked against `results.json`; "0 did-not-run" established by total == expected. | closed |
| T-166-20 | Denial of service | Docker VM disk | low | mitigate | `GATES.md` records `docker builder prune -af`, the 15 GiB floor measurement via `docker run --rm alpine df -k /` (25.7 GiB before the full run), and `grep -c ENOSPC` = 0 in the run's `console.log`; no Docker restart. | closed |
| T-166-SC | Tampering | npm/pip/cargo installs | low | accept | Plan-time accept (166-01..04). `166-RESEARCH.md` "Package Legitimacy Audit": "This phase installs no external packages." No `(166...)` commit touches a `package.json` or `yarn.lock`. See Accepted Risks Log. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Informational notes (not threats in the register; no status change)

- **166-REVIEW WR-01 vs T-166-04:** `writeEntityGrant` idempotency depends on PostgreSQL reporting `grants_user_scope_target_role_key` before `idx_grants_one_candidate_editor` for an exact same-user duplicate. If the order flipped, the same-user retry would be refused (fail closed: availability), not a second user admitted, so T-166-04's spoofing property holds either way. Open in `166-REVIEW-DISPOSITION.md`.
- **166-REVIEW WR-02 vs T-166-05:** a concurrent first login can create two candidates for one identity; reads then raise `ERR_ENTITY_IDENTITY_AMBIGUOUS` and `findExistingCandidate`'s `maybeSingle()` throws. Fail closed; deferred by D-12.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-166-01 | T-166-13 | No new service-role client construction: `candidate-bank-auth.spec.ts` keeps `createServiceRoleClient` (local-host guarded), and dev-seed's `serviceRoleClientCallSites` census still covers it. | plan-time disposition (166-02) | 2026-10-01 |
| AR-166-02 | T-166-15 | D-02: `nominations.created_by` is the single named census exemption; closing it needs column-level SELECT privileges or a side table, which the operator rejected for this phase. Filed as residue todo `2026-10-01-nominations-created-by-readable-by-anon.md`. | plan-time disposition (166-03) | 2026-10-01 |
| AR-166-03 | T-166-SC | Not applicable: the phase installs no package; `166-RESEARCH.md` "Package Legitimacy Audit" records no installs and no `[ASSUMED]`/`[SUS]`/`[SLOP]` verdict. | plan-time disposition (166-01, 166-02, 166-03, 166-04) | 2026-10-01 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-04 | 21 | 21 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-04
