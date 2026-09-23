---
created: '2026-09-03T09:32:00.000Z'
title: Five CI jobs each pay for their own `supabase start` — consolidating the Supabase-hosting jobs, without inheriting a paths-filter
area: ci — .github/workflows/main.yaml
severity: low
source: Phase 164 (returns-table nullability) Plan 04 Task 3, per decision D-N2 — an optimisation explicitly NOT a Phase 164 deliverable
files:
  - .github/workflows/main.yaml
---

## Problem

Every job that needs a database starts its own Supabase stack. Measured on
`.github/workflows/main.yaml` at HEAD `8c34b5184`, each of these has its own `run: supabase start`
step:

| Job | `supabase start` at | Gated by `dorny/paths-filter`? |
|---|---|---|
| `supabase-tests` (`:106`) | `:128` | **yes** (`:112`) |
| `dev-seed-integration` (`:163`) | `:201` | no |
| `supabase-types-drift` (`:247`) | `:307` | **no — deliberately** |
| `e2e-tests` (`:337`) | `:373` | no |
| `e2e-visual` (`:418`) | `:454` | no |

Phase 163 will add a sixth when its SQL-lint job lands.

**The `supabase-types-drift` job is Phase 164's** (plan 03), and it is the newest of the five — so
this phase added one of the starts it is pointing at. Consolidating some subset of these into a
single Supabase-hosting job is a reasonable optimisation.

## The constraint that must shape any consolidation

**The drift job must remain unfiltered.** `supabase-types-drift` deliberately carries **no**
`dorny/paths-filter`, and that absence is load-bearing, not an oversight:

`supabase/setup-cli@v1` is pinned to `version: latest`, so a Supabase CLI update can change the type
generator's output **with no repository path changing at all**. That is precisely the silent-reversion
class the requirement exists to catch, and precisely what a paths-filter would hide. The risk is live
and was observed during Phase 164 plan 03: the installed CLI was v2.83.0 while the toolchain
advertised v2.116.0 on every invocation.

A consolidation that folds the drift check into `supabase-tests` — the obvious host, since it already
starts Supabase — would therefore **silently narrow the gate**, because every step in
`supabase-tests` sits behind that job's `dorny/paths-filter` at `:112`.

This is guarded, not merely written down: `packages/dev-seed/tests/rpcNullabilityGate.test.ts` asserts
the filter's absence, so reintroducing one is a **red test** rather than a quiet narrowing. Probe P2
in plan 03 confirmed that assertion fires. Any consolidation work will have to update that spec
deliberately and argue the case — which is the intended friction.

Two further facts that constrain the merge, both measured in plan 03:

- `supabase-tests` has five steps and among them **no** `actions/setup-node`, **no**
  `threeal/setup-yarn-action` and **no** `yarn install`. `yarn db:types` needs Yarn 4, Node, an install
  and the `supabase` devDependency, so hosting the drift check there means adding three setup steps
  and an install — which is to say making it a different job.
- The file **sets no `timeout-minutes` on any job and caches no Supabase Docker images**, so there is
  no measured baseline for what a `supabase start` actually costs here. Any consolidation should
  establish that baseline first, or its benefit is asserted rather than known.

## Why it was out of scope for Phase 164

Phase 164's criterion 4 asks for a gate that proves regeneration does not silently revert the
nullability guarantee. It got one. Restructuring the workflow's job topology is a CI-architecture
change affecting five jobs and three phases' deliverables, and Phase 163 has not landed yet
(`grep -c 'db:lint:sql' .github/workflows/main.yaml` returns **0**; ROADMAP shows
`163. CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning | 0/TBD | Not started`).
Consolidating against a topology that is about to gain a job would be premature.

## Solution

TBD, and **sequenced after Phase 163 lands** so the full job set is visible. Sketch:

- Measure first: add `timeout-minutes` and record actual per-job wall time, so the saving is a number
  rather than an assumption.
- Consider Docker layer caching for the Supabase images as the cheaper intervention — it may remove
  most of the cost without changing the job topology or any gate's reach at all.
- If jobs are merged, the merged job must carry **no** `paths-filter`, and
  `packages/dev-seed/tests/rpcNullabilityGate.test.ts` must be updated to assert that absence on the
  merged job's name. Do not weaken the assertion to make the merge pass.
- Keep `e2e-tests` and `e2e-visual` separate from the lint/type jobs regardless: they run
  substantially longer, and serialising a fast gate behind them delays the signal that gate exists to
  give.

## Context

Filed during Phase 164 plan 04, Task 3, under decision **D-N2**. The plan that requested this entry
framed it as "two CI jobs each pay for a Supabase start"; measured, it is **five today and six after
Phase 163**, and the entry records the measured figure.
