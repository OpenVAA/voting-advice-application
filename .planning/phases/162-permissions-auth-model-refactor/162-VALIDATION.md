---
phase: "162"
slug: "permissions-auth-model-refactor"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: false
wave_0_complete: true
created: "2026-09-20"
---

# Phase 162 — Validation Strategy

> Reconstructed from phase artifacts (State B) by `/gsd-validate-phase 162` on 2026-09-20. Phase 162
> shipped before a VALIDATION.md existed, so this document records the verification estate the 21
> plans actually built, rather than a contract written ahead of them. Row granularity is the **plan**,
> not the task: the plans carry per-task `<verify>` blocks, but their automated commands collapse to
> the same suite-level commands listed below, and a 200-row per-task table would restate them.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | pgTAP (database), Vitest (unit, per workspace via Turborepo), Playwright (E2E) |
| **Config files** | `apps/supabase/supabase/tests/database/*.test.sql`, `vitest.config.*` per workspace, `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/supabase test:db` (`supabase test db`) — needs a running local Supabase |
| **Unit command** | `yarn test:unit` (`assert-unit-test-coverage` + `turbo run test:unit`) |
| **Schema/lint gate** | `yarn db:lint:sql` (plpgsql_check + the two Splinter-derived advisors in `apps/supabase/scripts/lint-schema.mjs`) and `yarn lint:check` (17 `assert:*` structural guards, incl. `assert:grant-permission-enum` and `assert:schema-migration-parity`, both added by this phase) |
| **Full suite command** | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` (or `yarn test:e2e`) |
| **Estimated runtime** | pgTAP ~30s · unit ~60s · E2E ~627–651s baseline (`162-14-E2E-OUTLIER-DIAGNOSIS.md`) |

**Estate growth across the phase:** pgTAP went from 401 assertions / 12 files at the 162-02b baseline
to **1204 assertions / 32 files** at 162-19 close. The one net *drop* (1092 → 978 at 162-15) is the
disclosed decommission of `13-shim-parity.test.sql` alongside the mechanism it tested, dispositioned
row by row in `162-15-SUMMARY.md` — not an erosion of coverage.

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/supabase test:db`
- **After every plan wave:** `yarn test:unit` + `yarn lint:check` + `yarn db:lint:sql`
- **Before `/gsd-verify-work`:** full E2E green (CLAUDE.md § E2E Hard Rule — a failing or
  did-not-run spec is a cardinal failure, and there are no known-flaky exemptions)
- **Max feedback latency:** ~30s (pgTAP), ~11 min (E2E)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 162-01 | 01 | 0 | PRESHIP-02, D-01…D-23 | — none declared | N/A — normative reference only (`162-SPEC.md`) | manual | — | ✅ (doc) | ⬜ manual-only |
| 162-02 | 02 | 0 | PRESHIP-02 | `T-162-02-*` (9) | N/A — corrects REQUIREMENTS.md / ROADMAP.md | manual | — | ✅ (docs) | ⬜ manual-only |
| 162-02b | 02b | 0 | PRESHIP-02, D-14/14a/17/18 | `T-162-02b-*` (8) | Declarative schema is the single source; migrations cannot drift from it | integration | `yarn assert:schema-migration-parity`, `yarn workspace @openvaa/supabase test:db` | ✅ `11-question-rpcs.test.sql` | ✅ green |
| 162-03 | 03 | 1 | PRESHIP-02, D-02/04/05/07/08/14/18 | `T-162-03-*` (9) | 23-member permission enum × 3 scopes cannot silently gain or lose a member | unit + structural | `yarn assert:grant-permission-enum`, `yarn db:lint:sql` | ✅ `scripts/assert-grant-permission-enum.mjs` + 3 fixtures | ✅ green |
| 162-04 | 04 | 1 | PRESHIP-02, criterion 2 | `T-162-04-*` (13) | One predicate (`user_can`) answers every authority question; read ≠ write | pgTAP | `yarn workspace @openvaa/supabase test:db` | ✅ `12-user-can.test.sql` (45) | ✅ green |
| 162-05 | 05 | 2 | PRESHIP-02 | `T-162-05-*` (15) | Transitional shims behave identically to `user_can` (retired at 162-15) | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ `13-shim-parity.test.sql` — deliberately deleted with the mechanism at 162-15 | ⬜ superseded |
| 162-06 | 06 | 2 | PRESHIP-02 | `T-162-06-*` (14) | The retired `user_roles` claim is gone from the token; the hook emits `grants` | pgTAP + unit | `test:db`, `yarn test:unit` | ✅ `14-grants-migration.test.sql` (50), `passwordLogin.test.ts`, `supabaseDataWriter.test.ts`, `entityGrant.test.ts` ×2 | ✅ green |
| 162-07 | 07 | 3 | PRESHIP-02 | `T-162-07-*` (10) | Visibility/confirmation columns are per-row and column-grant restricted | pgTAP + unit | `test:db`, `yarn test:unit` | ✅ `15-visibility-flags.test.sql` (30), `09-column-restrictions.test.sql` | ✅ green |
| 162-07b | 07b | 3 | PRESHIP-02 | `T-162-07b-*` (12) | `organization_id` lives on factions; the two narrowed RPCs cannot over-return | pgTAP | `test:db` | ✅ `21-entity-organization.test.sql` (18) | ✅ green |
| 162-08 | 08 | 3 | PRESHIP-02, criterion 5 (clause 1) | `T-162-08-*` (13) | Anonymous reads are the public-row conjunction and nothing more | pgTAP | `test:db` | ✅ `16-anon-visibility.test.sql` (51) | ✅ green |
| 162-09 | 09 | 4 | PRESHIP-02, criterion 2 | `T-162-09-*` (15) | All 25 project-structure policies route through `user_can` | pgTAP | `test:db` | ✅ `17-project-structure-authority.test.sql` (87) | ✅ green |
| 162-10 | 10 | 4 | PRESHIP-02, criterion 5 (clause 2) | `T-162-10-*` (13) | The 20 entity `TO authenticated` policies route through `user_can`; window 267 closed | pgTAP | `test:db` | ✅ `18-entity-policies.test.sql` (58) | ✅ green (read-cost budget → Manual-Only, below) |
| 162-11 | 11 | 4 | PRESHIP-02, § 11.1 | `T-162-11-*` (13) | Content policies split project-editor from project-admin | pgTAP | `test:db` | ✅ `22-content-policies.test.sql` (68) | ✅ green |
| 162-12 | 12 | 4 | PRESHIP-02, D-11c/12*/13/14/18/21/24 | `T-162-12-*` (16) | Nomination writes carry `confirmed`/`created_by`; the 8-column key and parent-FK delete rule hold | pgTAP | `test:db` | ✅ `23-nominations-write.test.sql` (40) | ✅ green (13 named negative controls all reddened) |
| 162-13 | 13 | 4 | PRESHIP-02, D-10/11a/21/23 | `T-162-13-*` (14) | A confirmed entity's name is frozen unless `entity.edit_immutable` is held | pgTAP | `test:db` | ✅ `19-entity-immutability.test.sql` | ✅ green (shipped ordinal 19, plan predicted 18 — deviation recorded) |
| 162-14 | 14 | 5 | PRESHIP-02, D-03/11/11b/21/27, criterion 6 | `T-162-14-*` (14) | All 15 storage policies route through one mechanism, denial parity per verb | pgTAP | `test:db`, `yarn db:lint:sql` | ✅ `20-storage-authority.test.sql` (46), `06-storage-rls.test.sql` | ✅ green |
| 162-15 | 15 | 6 | PRESHIP-02, D-04, K1, B1a | `T-162-15-*` (13) | The legacy authority mechanism is absent, not merely unused | pgTAP | `test:db` | ✅ `24-legacy-removal.test.sql` (21) | ✅ green |
| 162-16 | 16 | 6 | PRESHIP-02, criterion 5 | `T-162-16-*` (13) | The retired per-row `published` mechanism is gone; the anon row set is unchanged (md5 fingerprint) | pgTAP + structural | `test:db`, `yarn assert:schema-migration-parity`, `yarn assert:rpc-nullability` | ✅ edits across `00`–`11` pgTAP files | ✅ green |
| 162-17 | 17 | 6 | PRESHIP-02, criteria 1–7 | `T-162-17-*` (14) | The grants matrix, the uniqueness keys, the parent-nomination queue and storage-table parity cannot silently collapse | pgTAP + structural | `test:db`, `yarn db:lint:sql` (lint check 9001) | ✅ `25-matrix-conformance.test.sql` (41), `26-uniqueness-keys.test.sql` (31), `27-parent-nomination-queue.test.sql` (15), `28-storage-table-parity.test.sql` (21) | ✅ green |
| 162-18 | 18 | gap-1 | PRESHIP-02, criterion 7 | `T-162-18-*` (7) | The Edge Function gates decide authority by asking `user_can` through the caller's own token, never in TypeScript | unit | `yarn workspace @openvaa/supabase test:unit` | ✅ `invite-candidate/flowConformance.test.ts`, `send-email/flowConformance.test.ts` | ✅ green (9 planted faults G1–G5 all reddened) |
| 162-19 | 19 | gap-2 | PRESHIP-02, criterion 7 | `T-162-19-*` (6) | A level-1 ProjectEditor meets the nomination- and entity-confirmation triggers as the matrix says | pgTAP | `test:db` | ✅ `32-level1-confirmation-flow.test.sql` (13) | ✅ green |

*Status: ⬜ pending/manual · ✅ green · ❌ red · ⚠️ flaky*

**On 162-05's ❌ row.** `13-shim-parity.test.sql` is absent by design: 162-15 demolished the shim
mechanism it tested and deleted the file in the same commit (`92fd09280`), dispositioning each
assertion into `14-grants-migration.test.sql` or `24-legacy-removal.test.sql`. It is recorded here as
*superseded*, not as a coverage hole — a missing test for a mechanism that no longer exists is the
correct end state.

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase added to it rather than needing it
installed: two standing structural guards (`assert:grant-permission-enum` at 162-03, the lint-schema
9001 read/write-collapse check at 162-17), eleven new pgTAP files, and three Edge Function
flow-conformance suites.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `162-SPEC.md` is a faithful normative reference (23-permission enum, 161-cell matrix, level-1 definition, 3 PRESHIP-02 amendments) | PRESHIP-02, D-01…D-23 | A document's fidelity to an intent is human judgment; `162-01-SUMMARY.md` self-flags must-have D6 as `human_judgment: true` | Read `162-SPEC.md` against `162-CONTEXT.md`'s ratified decisions; confirm each amendment is reflected |
| `.planning/REQUIREMENTS.md` and ROADMAP § 162 describe measured reality | PRESHIP-02 | `162-02-SUMMARY.md` states outright that no lint rule, unit test or spec reads these files | Re-read both against the phase's SUMMARYs at ship time |
| Entity-SELECT read cost stays within the ruled budget | PRESHIP-02, criterion 5 | **Ruled, not gated.** 162-10 measured 6.37× anon / 7.31× authenticated against a 2.0× budget; `162-10-D36-REVERT.md` re-measured after the D-36 revert at **0.99× anon (CLOSED)** and **4.47× authenticated (recorded, not repaired)** — the residue is the three `user_can` disjuncts, i.e. the authority mechanism this phase exists to deliver. A standing timing assertion was considered and rejected at UAT on 2026-09-20: a wall-clock gate is intermittently red, and CLAUDE.md's E2E hard rule treats an intermittent failure as a real defect rather than an accepted flake. WINDOWS.md row 270 is `fixed` on that ruling. **Followed up, not dropped:** Phase 162.1 (complete, 2026-09-19) investigated both residuals — item 1(a) reordered the five authenticated policy quals to variant B; item 1(b), the 6.4× anon storage-bucket read, was accepted because D-36's remedy is structurally unavailable to a storage policy (its identity is text path segments, not a typed column) and no application path exercises it. See `.planning/spikes/GRANT-MODEL-READ-COST-REPORT.md` (spikes 025–030). | Re-run `162-10-D36-REVERT.md` § 1's decomposition (one 5000-row fixture, one rolled-back transaction, each variant's qual fingerprinted) and compare the four cells against 39.7 ms anon / 88.9 ms authenticated. Treat a material rise on the **anon** path as a regression; the authenticated figure is the ruled price of `user_can` and moves only if the disjunct ordering or the per-row `SECURITY DEFINER` call is attacked deliberately. |
| WR-04 app-entry routing (ProjectEditor Admin App admission; multi-role identities) | PRESHIP-02 | An explicit product decision with two live options, not resolvable by grep or database probe | Ruled at UAT 2026-09-20: current routing stands — see `162-UAT.md` test 1 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a recorded Manual-Only disposition
- [x] Sampling continuity: no 3 consecutive plans without an automated verify (162-01/02 are the only manual pair, and they are wave 0 documents)
- [x] Wave 0 covers all MISSING references — none were missing; the phase extended the estate
- [x] No watch-mode flags (`test:unit` is `vitest run`; `test:unit:watch` is a separate script and is not used by any gate)
- [x] Feedback latency < 60s for the pgTAP + unit gates
- [ ] `nyquist_compliant: true` — **not set.** Four behaviours are Manual-Only by disposition (two documents, one ruled performance budget, one product decision), so the phase is validated-partial by design, not by omission.

**Approval:** approved 2026-09-20
