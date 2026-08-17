---
phase: 133
slug: fix-phase-132-code-review-gaps
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-26
status: verified
---

# Phase 133 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| E2E test harness ↔ local seed Supabase (test-time only) | This phase REMOVES the only test-time DB read in `voterNavigation.ts` (`resolveSeedUuids` via `SupabaseAdminClient`, a local-seed lookup). No product/runtime trust boundary created or crossed; confined to `tests/`. | Local seed UUIDs only (test infra), now deleted entirely |
| E2E test harness ↔ frontend routing (test-time assertion only) | A single URL-assertion regex in `candidate-journey.spec.ts` observes the app's existing routing output; does not create, cross, or weaken any product trust boundary. | None — read-only route observation |
| E2E test harness ↔ local dev stack (test-time only) | The Plan 03 gate runs the full suite against a local dev server + local Supabase seed. No production surface; no code change. The only integrity concern is a false-green (masked/flaky pass). | None — synthetic seed data only |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-133-01 | Information Disclosure | removed `resolveSeedUuids` / `SupabaseAdminClient` test-time seed read | low | accept | Deleted entirely — net attack-surface reduction; the read only ever hit the local seed DB during tests, never a production path. Verified: `navigateDirectlyToQuestions`/`resolveSeedUuids`/`uuidCache` return 0 matches repo-wide (`grep -rn` across `tests/`); `SupabaseAdminClient` import removed from `voterNavigation.ts` only (`grep -c` → 0) while the class file + its ~50 other importers (`tests/tests/utils/supabaseAdminClient.ts`) are untouched; diff (`git diff f64e7c223..HEAD`) shows only removal, no new admin-client usage introduced anywhere as a side effect | closed |
| T-133-02 | Tampering | E2E coverage integrity — elections/constituencies "Continue" leg (`tests/tests/utils/voterNavigation.ts`) | medium | mitigate | `page.goto()` bypass removed (`grep -c 'page.goto' tests/tests/utils/voterNavigation.ts` → 0); real failure signal restored via deterministic continue-on-stall + loud terminal `waitFor`; confirmed end-to-end by the 3× full-suite gate — 129/129/129, 0 unexpected, including the four perm-consumer projects (`perm-hide-election-tags`, `perm-hide-category-tags`, `perm-hide-if-missing-answers`, `perm-disable-allow-open`) per `133-03-SUMMARY.md` | closed |
| T-133-03 | Tampering | E2E diagnostic precision — candidate profile-submit destination (`tests/tests/specs/candidate/candidate-journey.spec.ts`) | low | mitigate | Negative-lookahead `/\/candidate(?!\/profile)/` replaced with positive `/\/candidate\/?(?:\?|#|$)/` route assertion at step 13.5; `grep -c 'candidate(?!'` → 0, positive regex present exactly once; independently re-derived and confirmed by `133-REVIEW.md`, which traced the specific misroute (unauthenticated → `/candidate/login`) the old lookahead would have swallowed and confirmed the new regex rejects it | closed |
| T-133-04 | Tampering | Gate integrity — a flaky/masked "green" hiding a reintroduced continue-stall regression | medium | mitigate | 3 consecutive `yarn test:e2e` runs, 129/129/129 with 0 unexpected/flaky/skipped each (decoded from each run's `report.json`, not console tail, per `133-03-SUMMARY.md`); no retries, no flaky-annotation, no re-baselining; post-gate re-check of `grep -c 'page.goto'` on the helper confirmed still 0 | closed |
| T-133-05 | Denial of Service (test-env) | stale dev server on :5173 / imgproxy 502 wedge invalidating the gate run | low | mitigate | Documented protocol executed and recorded: `yarn db:status` healthy precheck, port :5173 confirmed free before start, single fresh dev-server PID verified via `lsof` (exactly one listener), one `yarn db:reset` before the run sequence, no re-reset between runs, documented `supabase stop && supabase start` recovery path for the storage/imgproxy 502 wedge — see `133-03-SUMMARY.md` § Environment and Protocol | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-133-01 | T-133-01 | Test-only phase; the removed read only ever touched the local seed DB during test runs, never a production path. Deletion is a net reduction in attack surface, not a residual risk requiring ongoing monitoring | plan-time disposition (133-01-PLAN.md), confirmed at execution (133-01-SUMMARY.md) and at audit (grep-verified zero remaining references) | 2026-07-26 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-26 | 5 | 5 | 0 | /gsd-secure-phase (auditor, ASVS L1, block-on-high) — each `mitigate`/`accept` disposition verified via grep against cited files plus cross-check against the independent 133-REVIEW.md code-review pass and the 133-03-SUMMARY.md decoded 3× full-suite report.json evidence |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-26
