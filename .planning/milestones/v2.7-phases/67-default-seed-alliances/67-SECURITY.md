---
phase: 67
slug: default-seed-alliances
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-08
---

# Phase 67 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Built from the union of Plan 67-01 + Plan 67-02 `<threat_model>` blocks. All threats
> closed at audit time — mitigations verified in implementation or risks accepted at
> plan-time and documented below.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| dev-seed authoring → local Supabase | Hand-authored TS template + override files emit row literals; `bulk_import` RPC writes them under the `seed_` external_id prefix scoped to `TEST_PROJECT_ID`. Service-role key only available locally. | Synthetic test rows (entities, nominations, app_settings); no PII; no production credentials in scope. |
| `@openvaa/app-shared` type → frontend voter UI | A 1-line type-union widening unblocks `'alliance'` as a valid `results.sections` value. No runtime auth boundary; this is a type-only change in a workspace package. | TypeScript type narrowing — no data flow. |
| local Supabase ↔ frontend dev server | Both run on developer machine; service-role key only available locally. | Read-only fetch of seed/test rows over the local Supabase REST API. |
| Playwright runner ↔ frontend ↔ Supabase | E2E test runner exercises the full voter flow against the seeded DB; the parity gate is the regression invariant. | Synthetic test rows under `test-` prefix; demo service-role key only (no production secrets). |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-67-01 | Information Disclosure (political) | `packages/dev-seed/src/templates/defaults/alliances-override.ts` invented coalition names | mitigate | Acceptance grep at Plan 67-01 §"Pattern Audit" — `grep -E '(Punavihreä\|Porvarihallitus\|Vasemmistoliit\|Kokoomus\|Keskust)' alliances-override.ts` returns no matches. D-58-01 invariant. Names used: `Progressive Front`, `Conservative Bloc` (invented neutral). | closed |
| T-67-02 | Tampering | Seed accidentally writes to a non-test `project_id` | accept | Existing control: `TEST_PROJECT_ID = 00000000-0000-0000-0000-000000000001` is the dev sentinel; `buildCtx` (`packages/dev-seed/src/templates/ctx.ts`) defaults to it; production projects use distinct UUIDs. dev-seed scripts only run with the local service-role key (no production credentials in scope). Threat inherent to dev-seed package, unchanged by Phase 67. See Accepted Risks Log. | closed |
| T-67-03 | Tampering | DB-level invariant violation (alliance nom has parent, or org-nom parent in different constituency) | mitigate | DB-side `validate_nomination` trigger (`apps/supabase/migrations/.../011-validation-functions.sql:264-272`) raises EXCEPTION at INSERT time. Plan 67-01 Tasks 1+2 follow the schema invariants by construction (alliance noms emit no `parent_nomination` key; org-noms compute parent external_id from the same constituency external_id). Plan 67-01 Task 5 integration test asserts post-INSERT: for every with-parent org-nom, `parent.constituency_id === orgNom.constituency_id AND parent.election_id === orgNom.election_id`. 484/484 dev-seed tests green; raw psql counts confirm 30/10 split. | closed |
| T-67-04 | Information Disclosure | Sanity-check artifacts (logs at `/tmp/`) accidentally include `SUPABASE_SERVICE_ROLE_KEY` | mitigate | Plan 67-02 Tasks 1, 3 use `yarn` and `node` commands that never echo env vars; the key is read by the supabase admin client internally and never logged. The integration test hard-codes the local-default service-role key (a public demo key shipped with `supabase start` per `default-template.integration.test.ts:58`) — not a production secret. The parity gate uses Playwright with no service-role key in scope. Artifact logs at `/tmp/67-02-*` were inspected during VERIFICATION.md authoring; no key material present. | closed |
| T-67-05 | Denial of Service | imgproxy 502 during `yarn dev:reset-with-data` portrait upload | accept | Known infrastructure debt per STATE.md "Blockers/Concerns"; documented workaround `supabase stop && supabase start`. Not introduced by Phase 67. Did fire once during this phase's Task 1 step B; recovery applied; subsequent reset succeeded. See Accepted Risks Log. | closed |
| T-67-06 | Tampering | UI smoke or parity-gate result reported as PASS when actually FAIL | mitigate | Plan 67-02 Task 4 (`67-VERIFICATION.md`, 208 lines) cross-references appendix logs (`/tmp/67-02-{seed,integration,raw-counts,parity-diff,playwright,dev-server}.log` + `.planning/phases/67-default-seed-alliances/post-fix/playwright-report.json`). Plan 67-01 Task 5 integration test assertions are binary (pass/fail) — they cannot be fudged in narrative form. The first parity-gate attempt's false-positive (mixed default+e2e seed → 30p/21f/51c) was caught and corrected by the clean-DB protocol; the corrected result (67p/1f/34c) was reproduced by the user during 67-UAT Test 10. Documented in VERIFICATION.md so future readers don't repeat the trap. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-67-01 | T-67-02 | Threat inherent to the dev-seed package, unchanged by Phase 67. The control (`TEST_PROJECT_ID` sentinel + local-only service-role key) is structural to the dev-seed architecture. Reseeding a non-test `project_id` would require an explicit code change to override the default — out of scope for any seed-authoring phase. | Phase 67 — recorded at Plan 67-01 plan time | 2026-04-30 |
| R-67-02 | T-67-05 | Known infrastructure flake (imgproxy 502 during portrait upload). Documented workaround (`supabase stop && supabase start`). Affects local dev only; not present in production. Risk pre-exists Phase 67. | Phase 67 — recorded at Plan 67-02 plan time | 2026-04-30 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-08 | 6 | 6 | 0 | Phase 67 close-out — `/gsd-secure-phase 67` (short-circuit path: `threats_open: 0 AND register_authored_at_plan_time: true`; auditor agent skipped per workflow short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (R-67-01, R-67-02)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-08
