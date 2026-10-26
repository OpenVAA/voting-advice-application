---
phase: "184"
slug: "hosted-supabase-measurement-and-conformance-probe"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-26"
---

# Phase 184 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (root `catalog:` version), new non-workspace suite under `infra/` |
| **Config file** | `infra/vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `yarn vitest run --config infra/vitest.config.ts` |
| **Full suite command** | `yarn test:unit` (with `test:unit:infra` chained in) and `yarn lint:check` |
| **Estimated runtime** | ~10 s quick; full unit suite several minutes (needs the shared local stack running) |

---

## Sampling Rate

- **After every task commit:** the quick Vitest command and `yarn assert:hosted-settings-parity`. Read the exit status directly, never through a pipe.
- **After every plan wave:** `yarn lint:check` and `yarn test:unit`.
- **Before `/gsd-verify-work`:** the full unit suite and `lint:check` green, plus a full E2E run (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`), because `config.toml` and dev-seed change. Also the probe's recorded red and green runs.
- **Max feedback latency:** 30 s for the quick command

---

## Per-Task Verification Map

Filled by the planner. The research's requirement → test map (`184-RESEARCH.md` § Validation Architecture) is the source:

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-------------|
| SUPA-07 | Each comparison passes a conforming fixture and fails a broken one with its own finding. A source failure means could-not-run | unit | `yarn vitest run --config infra/vitest.config.ts` | ❌ W0 |
| SUPA-07 | Probe green on throwaway, red on every check after the batched break, green after the revert; green on persistent | live, operator-run | `node infra/scripts/probe-hosted.mjs --root infra/envs/<root>/supabase; echo "probe_exit=$?"` | ❌ |
| SUPA-01 | Wrapper refuses a wrong ref; push exits 0; a second run says it is up to date and exits 0 | live + red control | `infra/scripts/push-migrations.sh <ref>; echo "push_exit=$?"` | ❌ |
| SUPA-01 / D-22 | Drift exits 1 with a planted DDL change, 0 when clean; refuses a wrong ref or port 6543 | live + red controls | `infra/scripts/check-drift.sh --target linked …; echo "drift_exit=$?"` | ✅ script, ❌ ref guard |
| SUPA-02/03 | Served settings equal the HCL | live (probe) | probe | ❌ |
| SUPA-04/06 | Buckets present; bootstrap twice gives the same rows; `no-seed` exits 0 | live | `psql -X -f infra/scripts/bootstrap.sql` twice + counts | ✅ scripts |
| SUPA-05 | Three functions active; `verify_jwt` as declared; secrets present | live (probe) | probe | ❌ |
| SUPA-11 (kept) | Guard still green after widening to `[functions.*]` | unit | `node scripts/assert-hosted-settings-parity.mjs --self-test` and `yarn assert:hosted-settings-parity` | ✅ |
| D-18 | New dev-seed template has ≥1001 anon-readable rows and no auth users | unit | `yarn workspace @openvaa/dev-seed test:unit` | ❌ |
| OBS-07 | More than 1000 rows read whole; `anon` cut off at 8 s | live (probe) + one manual timing | probe | ❌ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `infra/vitest.config.ts` and `infra/scripts/probe-hosted.test.ts` — the SUPA-07 comparisons
- [ ] Root script `test:unit:infra`, chained in `test:unit`, with an entry in `NON_WORKSPACE_SUITES` (`scripts/assert-unit-test-coverage.mjs`)
- [ ] Synthetic fixtures per source (no captured bodies, no secrets)
- [ ] A dev-seed test for the new template

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Key model issued, legacy key state, retirement date | SUPA-13 | Dashboard and Management API read with the operator's token | Operator reads; evidence row with date |
| DKIM/SPF/DMARC pass on a mail from `account-access` | SUPA-14 | Header read from the operator's mailbox | Operator pastes `Authentication-Results` into evidence |
| Dashboard names of the two switches | OBS-01 | Dashboard UI | Operator records the names |
| Redirect allowlist behaviour, `/auth/v1/verify` admitted/refused | OBS-02 | Needs real sign-in links | Recorded calls with dates |
| Gateway with anon key and no user token | OBS-03 | Hosted gateway behaviour | Recorded call shapes |
| `account-access` refusing branches, slot released after a failed send | OBS-05 | Needs a deliberately failing send | Recorded calls with dates |
| Signed-in token carries the hook's claims | SUPA-02 | Needs a password sign-in | Decode locally, record claim names only |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
