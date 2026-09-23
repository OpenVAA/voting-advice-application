---
phase: "162"
slug: "permissions-auth-model-refactor"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-20"
---

# Phase 162 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> The register itself was authored **at plan time**, inside the `<threat_model>` block of each of
> the 21 PLAN files. This document does not copy its 250 rows; it records the census, the audit's
> verdict per tier, the accepted-risk log in full, and the one item left open. To read a threat's
> original wording, open its plan: the id encodes it (`T-162-<plan>-<nn>`).

---

## Trust Boundaries

The register's per-plan boundary tables reduce to five that every authority decision in this phase
crosses:

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| client → Supabase Auth → PostgREST → `request.jwt.claims` | Where the `grants` claim enters the database. Signed by Supabase Auth, placed by PostgREST after verification; the client never writes it. Every authority decision rests on that signature. | the caller's full grant map (scope, target id, role) — identity-bearing |
| `public.grants` → access-token hook → the claim | The producing half. A key-name disagreement across this boundary is a silent total denial, not an error. | grant rows, filtered to `g.user_id = the event's user` |
| `user_can` (`SECURITY DEFINER`) → `public.projects` and the four entity tables | The predicate runs as its owner and reads tables the caller may not. A mutable `search_path` here is a privilege-escalation primitive, not a style issue. | project/entity hierarchy rows — read under elevated rights, returned only as a boolean |
| RLS policy → `user_can` | 102 policies delegate their entire authority decision across this boundary. A wrong answer is caught by no caller, because no caller second-guesses it. | the allow/deny itself |
| Edge Function → `user_can` through the caller's own token | `invite-candidate`, `send-email`, `identity-callback`. The gate runs after `getUser()` and **before** the service-role client is constructed. | the caller's authority over a project; afterwards, service-role reach |

---

## Threat Register

**Census (measured mechanically from the 21 `<threat_model>` blocks, and independently re-measured
by the auditor to the same numbers):**

| | critical | high | medium | low | total |
|---|---|---|---|---|---|
| mitigate | 49 | 113 | 39 | 8 | 209 |
| accept | 0 | 1 | 7 | 24 | 32 |
| transfer | 0 | 0 | 9 | 0 | 9 |
| **total** | **49** | **114** | **55** | **32** | **250** |

`workflow.security_block_on: high` — only open threats at `high` or `critical` count toward
`threats_open`.

### Verification reached, per tier

| Tier | Scope | Verified | Status |
|------|-------|----------|--------|
| 1 | 49 critical | All 49, individually against source | closed |
| 2 | 114 high | All 114 — 21 discharged by one verified supply-chain measurement, 8 by the `search_path` pin, the rest individually | closed |
| 3 | 32 accept + 9 transfer | All 41 — rationale stated in-register, nothing in shipped code contradicts it | closed (logged below) |
| 4 | 47 medium/low mitigate | 28 sampled, not exhausted | 27 closed, 1 open (below threshold) |

**Depth note.** ASVS level is 1, but the authority core was verified at L2 depth: mitigations were
checked *at the boundary they claim to defend*, not merely found to exist.

### Evidence character

Closures rest on catalogue reads rather than source text — `pg_policies.qual`, `pg_proc.proconfig`
and `prosecdef`, `pg_index.indnullsnotdistinct`, `pg_enum` membership — with populations derived at
run time and floored, so a clean result cannot come from an empty instrument. Load-bearing examples:

- **`SECURITY DEFINER` search-path pin** (T-162-04-03 and 7 siblings): 24 such functions in
  `apps/supabase/supabase/schema/`, 0 unpinned; asserted from `pg_proc.proconfig` over `public` and
  `private` with the examined count floored (`tests/database/18-entity-policies.test.sql`).
- **No policy re-derives a rule `user_can` answers** (T-162-10-02): `302-rls.sql` contains
  `auth.uid()` in comments only; a derived zero-census over five forbidden tokens read from
  `pg_policies` pins it, and lint check 9001 (`apps/supabase/scripts/lint-schema.mjs`) generalises
  it to the whole estate on every build.
- **The predicate is observed to deny, not only to allow** (T-162-04-02): every allow assertion in
  `12-user-can.test.sql` is paired with a deny, and the file is run against a `user_can` stub
  returning `true` unconditionally before the real body is accepted.
- **Retired mechanism is absent, not merely unused** (T-162-05-01/-03, T-162-15-03): absence of all
  five retired names asserted from `pg_proc` **at any signature**, printed by signature.
- **Supply chain** (21 × `T-162-*-SC`): measured base..HEAD — `yarn.lock` untouched, not one
  dependency or devDependency line moved; the only `package.json` change is two gate entries added
  to the root `lint:check` script.

### Closures resting on a documented supersession rather than the declared control

Recorded deliberately, because each closed by something other than the literal mechanism the
register named:

| Threat | What closed it |
|--------|----------------|
| T-162-05-02 | The declared biconditional was replaced by two unconditional per-side absence assertions — strictly stronger (a biconditional with both sides false is satisfied by both sides returning together). Reasoning recorded in `24-legacy-removal.test.sql`'s header. |
| T-162-06-01 / -02 / -10 | **Subject removal.** 162-15 deleted `backfill_grants_from_user_roles` and `public.user_roles`; there is no backfill left to be incomplete. Absence asserted at any signature. |
| T-162-07-04 | Discharged to its named successor: `enforce_entity_immutability()` rule 1 refuses self-confirmation on all four entity tables, where the original column-grant bar covered two and also refused the legitimate admin. |
| T-162-16-09 | 162-14 retired `is_storage_entity_published`; all 15 storage policies route through the authority/visibility helpers instead. |

### Open threats

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-162-15-11 | Information Disclosure (documentation tombstone) | the declarative schema mentioning a retired name | medium | mitigate | Register promised: no file under `apps/supabase/supabase/schema/` may contain any of the five retired names, checked over the whole file rather than over executable lines. | **open — below `high` threshold (non-blocking)** |

**What is actually there.** `apps/supabase/supabase/schema/300-auth-tables.sql:3` contains
`user_roles`, inside a comment that exists to explain why the file kept its name (D-38). Verified
directly: it is the file's only occurrence, and every other retired name is absent from `schema/`.
`git log -S` attributes the line to `5a6c56178`, a **162-16** commit — i.e. it was reintroduced
*after* 162-15's sweep, by a later plan, and 162-15's sweep was plan-time only with no standing
gate to catch the return. The text states the table was deleted, so it does not teach a reader that
the object still exists; only the letter of the zero-mention rule is broken. Left open rather than
edited away here: an audit does not silently fix its own findings.

---

## Accepted Risks Log

Accepted by the operator at UAT sign-off, 2026-09-20, on the rationale each plan recorded.

| Risk ID | Threat Ref | Sev | Rationale (abridged — full text in the owning plan) | Accepted By | Date |
|---------|------------|-----|------|-------------|------|
| R-01 | T-162-14-SC | high | Plan installs nothing; risk eliminated by scope, not by a control. Measured: `yarn.lock` untouched, zero dependency lines moved. | operator | 2026-09-20 |
| R-02 | T-162-03-06 | medium | `grants.target_id` is polymorphic across six tables, so no FK can bind the `target_type`/`target_id` pair. Writers are privileged only (`REVOKE ALL … FROM authenticated, anon, public`). | operator | 2026-09-20 |
| R-03 | T-162-07b-09 | medium | Deleting an organization cascades to its factions and their nominations — ruled explicitly in § 11.8; `NOT NULL` forecloses `SET NULL`, `RESTRICT` rejected for blocking deletion. | operator | 2026-09-20 |
| R-04 | T-162-09-11 | medium | Per-row cost of two function calls where a column comparison stood — measured and recorded rather than gated, because no baseline exists for the replaced term. | operator | 2026-09-20 |
| R-05 | T-162-11-09 | medium | `authenticated_insert_feedback` admits a row naming any project: pre-existing, and § 3.2 (canonical) has no atomic right to gate it with. Bounded by `check_feedback_rate_limit`; reads are gated on `feedback.read`. | operator | 2026-09-20 |
| R-06 | T-162-12-13 | medium | A candidate may create placeholder parents in any organization in the project — operator ticked § 8.9(b). Bounded by `caller_unconfirmed_originated_count() < 10`, the uniqueness key, and `created_by` attribution. | operator | 2026-09-20 |
| R-07 | T-162-12-15 | medium | Per-row cost of the guard that scans a contest's nominations, bounded by that contest's row count. | operator | 2026-09-20 |
| R-08 | T-162-17-12 | medium | Residual false-positive risk in build gate 9001; every clause is exercised by a targeted control (C0–C5) with exit codes and resolving logs in `162-NEGATIVE-CONTROL-LEDGER.md`. | operator | 2026-09-20 |
| R-09 | T-162-02b-06 | low | Loss of per-stage applied history; no rollback target but a reset. Operator ruling § 10.2 — no database published, git retains every deleted file. | operator | 2026-09-20 |
| R-10 | T-162-02b-07 | low | Ordinal swap breaking an order-dependent consumer — measured before planning: no column-list-less `INSERT`, no `SELECT * INTO`, no bare `COPY`. | operator | 2026-09-20 |
| R-11 | T-162-03-08 | low | `grants` carries `created_at` but no `granted_by`, matching the table it replaced. | operator | 2026-09-20 |
| R-12 | T-162-04-11 | low | `user_can` executable by `anon`/`authenticated`; a caller learns only their own authority. | operator | 2026-09-20 |
| R-13 | T-162-04-12 / T-162-05-14 / T-162-11-12 | low | Test helpers with owner rights exist only on a database that ran the pgTAP estate; `supabase db reset` removes them. | operator | 2026-09-20 |
| R-14 | T-162-06-11 | low | Each token carries its own holder's grants, and a JWT payload is readable by its bearer — the retired claim carried the same information. | operator | 2026-09-20 |
| R-15 | T-162-07-08 | low | `lock_nominations` shipped inert. **Superseded as anticipated** — 162-12 wired it via `private.project_nominations_locked`. | operator | 2026-09-20 |
| R-16 | T-162-07-09 | low | The confirmation column reaches the client alongside every other column, because entity reads use a wildcard select. | operator | 2026-09-20 |
| R-17 | T-162-08-12 / T-162-09-13 / T-162-14-13 | low | Visibility/hop helpers executable by `anon`. **Shipped stronger than accepted:** WR-01 moved the hierarchy and visibility hops into schema `private`, so they are no longer PostgREST-published. | operator | 2026-09-20 |
| R-18 | T-162-10-12 | low | A revoked grant authorises until token expiry, because the claim is read from the token rather than the table — D-06's ratified hybrid. | operator | 2026-09-20 |
| R-19 | T-162-12-14 | low | The hierarchy validator's exceptions act as an existence oracle for a supplied identifier. | operator | 2026-09-20 |
| R-20 | T-162-13-12 | low | The service role may rename a confirmed entity: `IF current_user <> 'authenticated' THEN RETURN NEW` admits it deliberately, and that role already bypasses RLS and every column grant. | operator | 2026-09-20 |
| R-21 | T-162-13-13 | low | The refusal message names both values, disclosing a column the caller can already read on a row they supplied. | operator | 2026-09-20 |
| R-22 | T-162-14-12 | low | Storage policies leave no record of which grant admitted a write (`storage.objects.owner` still records the uploader). | operator | 2026-09-20 |
| R-23 | T-162-16-11 | low | The Phase-164 `RETURNS TABLE` guard is not engaged; `assert:rpc-nullability` runs green with a live census (3 RPCs / 31 columns / 0 cast hits). | operator | 2026-09-20 |
| R-24 | T-162-02-08 | low | No environment value, key or connection string introduced by the edited planning documents. | operator | 2026-09-20 |
| R-25 | T-162-SC / T-162-02-SC / T-162-18-SC / T-162-19-SC | low | Documentation- and test-only plans install nothing; no `package.json` change. | operator | 2026-09-20 |

**Transfers (9).** Seven — T-162-04-10, -05-13, -06-12, -09-12, -10-11, -11-11, -13-11 — are the
same risk transferred to the same party: a **forged `grants` claim**, bounded by Supabase Auth's JWT
signature and PostgREST's verification. Confirmed in code: `user_can` reads `auth.jwt()` (the
verified claim, never a request body); `roles.ts` states its decode is signature-blind and safe only
downstream of `safeGetSession`'s verifying round-trip; both Edge Functions call `getUser()` before
the gate. **T-162-07-07** transfers entity confirmation to the IdP assertion — checked specifically
because a prior-phase note flagged aud/iss failing open on unset env: `identity-callback`'s
`requireVerifyClaimBinding` now **throws** `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED`,
so the transfer rests on a path that fails closed. **T-162-16-09** is discharged, not merely
transferred (see the supersession table above).

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-20 | 250 | 249 | 1 (medium — non-blocking) | gsd-security-auditor, via `/gsd-verify-work 162` → `verify:post` |

**Scope not covered.** The pgTAP estate and the Playwright suite were not executed during this audit
(both need a running local Supabase); reading the assertions was the evidence, per the audit brief.
Their last recorded full runs are `Files=32, Tests=1204, Result: PASS` and E2E 155/0/0/0
(`162-VERIFICATION.md`). Six filesystem-only gates *were* run read-only and passed:
`assert:schema-migration-parity`, `assert:grant-permission-enum`, `assert:project-scoped-queries`,
`assert:rpc-nullability`, `assert:comment-hygiene`, `assert:edge-env-defaults`. Tier 4 was sampled
(28 of 47), not exhausted.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer) — 209 / 32 / 9
- [x] Accepted risks documented in Accepted Risks Log — 32 accepts as 25 rows (three rows group
      threats that share one rationale: R-13, R-17, R-25), 9 transfers narrated below the table
- [x] `threats_open: 0` confirmed — the single open threat is medium, below the `high` block threshold
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-20
