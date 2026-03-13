---
phase: 11
slug: load-testing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgbench (PostgreSQL 15) + k6 (latest) |
| **Config file** | `apps/supabase/benchmarks/scripts/run-benchmarks.sh` (Wave 0 creates) |
| **Quick run command** | `bash apps/supabase/benchmarks/scripts/run-benchmarks.sh --quick` |
| **Full suite command** | `bash apps/supabase/benchmarks/scripts/run-benchmarks.sh --full` |
| **Estimated runtime** | ~120 seconds (quick), ~600 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `bash apps/supabase/benchmarks/scripts/run-benchmarks.sh --quick`
- **After every plan wave:** Run `bash apps/supabase/benchmarks/scripts/run-benchmarks.sh --full`
- **Before `/gsd:verify-work`:** Full suite must complete with results captured
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | LOAD-01 | benchmark | `k6 run apps/supabase/benchmarks/k6/voter-bulk-read.js` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | LOAD-02 | benchmark | `pgbench -f voter-bulk-read-jsonb.sql -c 1 -T 30` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | LOAD-03 | benchmark | `pgbench -f candidate-write-jsonb.sql -c 100 -T 30` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 2 | LOAD-04 | document | Manual review of decision document | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/supabase/benchmarks/` directory — entire benchmark infrastructure
- [ ] `apps/supabase/benchmarks/data/generate-test-data.sql` — shared data generation
- [ ] `apps/supabase/benchmarks/data/generate-candidates-jsonb.sql` — JSONB candidate data
- [ ] `apps/supabase/benchmarks/data/generate-candidates-relational.sql` — relational candidate data
- [ ] `apps/supabase/benchmarks/scripts/run-benchmarks.sh` — orchestration script
- [ ] `apps/supabase/benchmarks/scripts/swap-schema.sh` — schema swap automation
- [ ] `apps/supabase/benchmarks/scripts/parse-pgbench-log.py` — percentile extraction
- [ ] k6 installation verified (`brew install k6`)
- [ ] pgbench availability verified (host or Docker)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Decision document completeness | LOAD-04 | Requires human judgement on reasoning quality | Review 11-DECISION.md for: threshold criteria, p50/p95/p99 tables, clear recommendation, supporting reasoning |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
