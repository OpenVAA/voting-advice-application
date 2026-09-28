---
spike: 028
idea: grant-model-read-cost
name: disjunct-order-fix
type: comparison
validates: "Given Spike 026 shows the authenticated read matters on whole-project reads, when the public disjunct is evaluated before the user_can disjuncts, then signed-in reads get faster AND the visible rows are identical for every reader, entity type and edge case"
verdict: VALIDATED
related: [025, 026]
tags: [rls, grant-model, performance, correctness, phase-162.1]
---

# Spike 028: Reordering the Authenticated Policies' Disjuncts

## RESULT IN ONE PARAGRAPH

**Residual (a) has a cheap, provably correct fix, and it is a reorder, not a rewrite.** The five
`authenticated_select_*` policies evaluate their three `user_can` calls **before** the public-visibility
disjunct. PostgreSQL evaluates an `OR` left to right and stops at the first `TRUE`, so every publicly
visible row, which is almost every row a voter page reads, still pays three `SECURITY DEFINER` calls.
Moving the public disjunct earlier **changes no boolean and no row**: proved by `EXCEPT ALL` in both
directions over 5 readers × 5 tables and a **2,120-probe truth grid**, 0 disagreements. It also leaves
the whole 1,086-assertion pgTAP estate green, and 162-17's guard still reddens on both of its
perturbations. Two orders were measured. **A (public first)** gives the lowest worst case: a candidate's
whole-municipal read drops **7.15 s → 3.32 s**, on par with anon. But admins go 1.30 s → 3.34 s.
**B (project authority → public → entity)** keeps admins unchanged and brings the candidate to 4.65 s.
**Chosen: B** (operator decision 2026-09-18): admins keep their early exit; the whole-project route matters little for candidates.

## The Change, Exactly

Only the **order** of the top-level disjuncts in five policy quals changes. No function, no conjunct, no
table. Shown for `authenticated_select_candidates`:

| | Order of disjuncts |
|---|---|
| **shipped** | `user_can(project, read_entities)` OR `user_can(entity, read_answers)` OR `user_can(entity, nomination.read)` OR **public** |
| **A** | **public** OR `user_can(project…)` OR `user_can(entity, read_answers)` OR `user_can(entity, nomination.read)` |
| **B** | `user_can(project…)` OR **public** OR `user_can(entity, read_answers)` OR `user_can(entity, nomination.read)` |

"public" is the table's anon assembly, verbatim: `project_open_for_voters(...) AND confirmed AND
entity_has_confirmed_nomination(...) [AND terms-of-use for candidates]`. `authenticated_select_nominations`
has two `user_can` disjuncts and is reordered the same way. Applied by `run.sh`'s `DO` block (and
`apply-reorder.sql` for the estate runs), which **refuses** to run if the public disjunct is not the last
top-level disjunct, or if B's first disjunct is not the project-authority `user_can`.

Fingerprints of the five quals: shipped `b3fa76a6…`, A `ea7c63b8…`, B `b096e3bb…`.

## Why a Reorder Is Safe in Principle, and Proved Anyway

`OR` is commutative on booleans, and every function involved is `STABLE` with no side effects, so the
result cannot change. What can change is **which functions run**, and therefore the time. The ROADMAP's
rule is that a time improvement without a row-identity proof is not acceptable ("the fastest variant
measured in this phase was the incorrect one"), so the proof below was run for both variants.

## Correctness: Identical Rows, Measured

### Grid (`grid.sql`), shaped after D-36 § 4

- 2 projects: **G1 open for voters, G2 not**.
- 4 entity types × `confirmed` {t, f} × nomination {confirmed, unconfirmed, none, **in the other project**};
  candidates additionally × terms of use {past, NULL, future}.
- Parent/child chains: alliance → organization → candidate, and organization → **faction → unconfirmed
  candidate with no terms of use**. The last one is visible *only* through a grant, which exercises the
  window-267 child-nominee reach (`is_child_nominee`).
- **104 grid entities + 1 absent id + 1 NULL = 106 probe ids; 80 nominations.**

### Readers

`anon`, `auth_nogrant`, `cand_grid` (entity grant on the unconfirmed chain candidate), `org_grid` (entity
grant on the carrier organization, whose reach includes child nominees), `admin_grid` (project admin of the
**closed** project G2).

### Result, identical for A and B

| Check | A | B |
|---|---|---|
| visible rows per reader (before / after) | admin 118/118, anon 14/14, no-grant 14/14, candidate 16/16, org 58/58 | same |
| visible sets: before `EXCEPT ALL` after | **0** | **0** |
| visible sets: after `EXCEPT ALL` before | **0** | **0** |
| truth grid (106 ids × 4 tables × 5 readers) | 2,120 probes: 110 true, 2,010 false | same |
| truth: before `EXCEPT ALL` after | **0** | **0** |
| truth: after `EXCEPT ALL` before | **0** | **0** |

The per-reader counts show the grid is not empty where it matters. The organization grantee sees 18
candidates and 29 nominations (child reach), the candidate grantee sees its own unconfirmed row (2 candidates
against anon's 1), and the admin of the closed project sees 26 candidates. So a clean answer cannot come
from an instrument that asked nothing.

## Speed: Municipal Scale (Spike 026 fixture), SQL, Full Uncapped Result, Median ms

| Reader | Query | shipped | **A** | speed-up | shipped | **B** | speed-up |
|---|---|---|---|---|---|---|---|
| candidate | Q1 voter, Helsinki-sized | 278 | **129** | 2.15x | 292 | 184 | 1.59x |
| candidate | Q2 whole municipal | 7,148 | **3,324** | 2.15x | 7,270 | 4,652 | 1.56x |
| candidate | Q3 candidates table | 2,521 | **487** | 5.18x | 2,536 | 1,000 | 2.54x |
| no-grant | Q1 | 177 | **131** | 1.36x | 183 | 167 | 1.10x |
| no-grant | Q2 | 4,315 | **3,269** | 1.32x | 4,771 | 3,807 | 1.25x |
| no-grant | Q3 | 1,069 | **474** | 2.26x | 1,178 | 709 | 1.66x |
| admin | Q1 | 54 | 131 ⚠ | 0.41x | 55 | **53** | 1.03x |
| admin | Q2 | 1,296 | 3,339 ⚠ | 0.39x | 1,265 | **1,298** | 0.97x |
| admin | Q3 | 604 | 480 | 1.26x | 613 | **619** | 0.99x |

Each variant was measured against its own "shipped" baseline, in the same transaction, 3 runs per cell, at
load 6–7. For reference, anon on the same fixture: Q1 115, Q2 3,207, Q3 423 (Spike 026).

### Worst reader per variant, whole municipal project (the page that matters)

| | shipped | **A** | B |
|---|---|---|---|
| worst signed-in reader | candidate **7.15 s** | admin **3.34 s** | candidate **4.65 s** |
| headroom to the 8 s authenticated timeout | 11% | **58%** | 42% |

## Criterion 4: 162-17's Eight-Assembly Guard

| Run | Estate result |
|---|---|
| shipped | **PASS**, 1,086 assertions / 28 files |
| A applied | **PASS**, 1,086 / 28 |
| B applied | **PASS**, 1,086 / 28 |
| A + G8A (drop `project_open_for_voters` from `anon_select_factions`) | **FAIL as required**: 16-anon #32, #47; 25-matrix #34, #38 |
| A + G8B (drop `confirmed` from all four authenticated assemblies) | **FAIL as required**: 25-matrix #36, #37 |
| B + G8A | **FAIL as required**: same four as A + G8A |
| B + G8B | **FAIL as required**: same two as A + G8B |

These are **exactly** the assertions 162-17-SUMMARY recorded for G8A and G8B. The guard's relative check
("each authenticated assembly carries its own table's anon assembly verbatim") is order-insensitive, which
is why the reorder passes it and the perturbation still fails it. `yarn db:reset` after every run; the final
state was verified back on the shipped fingerprints (`b3fa76a6…`, storage `2c137e2b`).

## Verdict for Residual (a)

**Operator decision 2026-09-18: variant B (project authority → public → entity).** The "All nominations" route is not important, and even less so for signed-in candidates; admins may more often need whole-project data, so their early exit on `user_can(project)` is kept. Candidate whole-municipal read 7.15 s → 4.65 s (42% headroom to the 8 s timeout); admin unchanged at 1.30 s. The analysis below recommended A (lowest worst case); the operator weighed readers differently, which is the preference question it named.

**FIX, with variant B.** It is a reorder of five quals in `302-rls.sql`, proved row-identical, estate-green,
guard-preserving, and it removes the authenticated regression on the only path where Spike 026 found it
matters. Things the fix plan must still carry:

1. Edit `302-rls.sql`, then `yarn schema:regenerate` for the migration (never hand-edit
   `00001_initial_schema.sql`), then `db:types`, then `test:db` (the D-36 § 9 order).
2. Re-run this spike's `run.sh` against the committed schema as the plan's correctness gate.
3. Record the trade-off accepted: candidates stay at 4.65 s on whole-project reads instead of A's 3.32 s, in exchange for admins staying at 1.30 s instead of A's 3.34 s.
4. A **monitor**: this spike's timing cells (or a trimmed version) as a regression check, so a future
   policy edit that puts a `user_can` back in front shows up as a number, not as a support ticket.

**What A does NOT fix:** anon's own whole-project cost (3.2 s against a 3 s timeout, Spike 026 F2) and the
1,000-row truncation (Spike 026 F1). Neither is part of the grant model's regression.

## How to Run

```bash
.planning/spikes/028-disjunct-order-fix/run.sh 3                                   # variant A, one rolled-back transaction
VARIANT=B_project_public_entity .planning/spikes/028-disjunct-order-fix/run.sh 3   # variant B
.planning/spikes/028-disjunct-order-fix/estate.sh                                  # pgTAP: shipped / A / B (db:reset between)
.planning/spikes/028-disjunct-order-fix/perturb.sh                                 # G8A/G8B on top of A and B (db:reset between)
```

## Investigation Trail

1. The first run died in the report parser (an `awk` scalar/array name clash). psql aborted, the
   transaction rolled back and nothing persisted. Fixed and re-run.
2. A was correct and fast for candidates, but the timing table showed **admins 0.4x**, a regression the
   A-only view would have hidden. Cause: admins used to exit on the first disjunct (`user_can(project)`
   is true for them), and under A they pay the public check first on every row.
3. That suggested B (keep the project check first). Measured: admins unchanged, candidates 1.56x rather
   than 2.15x. Recorded as a head-to-head rather than picking silently.
4. Criterion 4 was checked by running the estate, not by reasoning about the guard's text. "Green" was
   then shown to be meaningful by replaying 162-17's two perturbations on top of each variant: all four
   runs go red on the recorded assertions.
