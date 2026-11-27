# Phase 189: Documentation and Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-20
**Phase:** 189-documentation-and-closure
**Areas discussed:** Location and shape, Reference pages, Unverified statements, Analytics, Runbook, Render and compose, Closure

Every decision was written to `189-DISCUSSION-POINTS.md` with a ★ option. The operator filled it on 2026-11-20 and ticked one box, F-01 (a written-in option). Every other decision is its ★.

| ID | Selected | Rejected alternatives |
|----|----------|-----------------------|
| A-01 | ★ docs site carries the guide, runbooks stay the record | guide in `infra/README.md`; full copy into `apps/docs` |
| A-02 | ★ `deployment/` subtree (without the render page, per F-01) | one long page; top-level "Deploying" section |
| A-03 | ★ against `infra/envs/example`, staging cited | staging only; READMEs in each example root |
| B-01 | ★ hand table + unit guard | table, no guard; generated at build time |
| B-02 | ★ rewrite by role + guard | rewrite, no guard |
| B-03 | ★ remove the two frontend URLs (provisional) | wire them; keep as unused |
| C-01 | ★ every deployed system; observe or move to a todo | Supabase only; keep tables retitled |
| C-02 | ★ recorded search, no guard | unit test over docs and infra markdown |
| D-01 | ★ one developer page + publisher pointer | two pages |
| D-02 | ★ hand table + unit guard | table, no guard; prose pointer |
| D-03 | ★ full checklist incl. the two limit keys | analytics items only |
| E-01 | ★ `deployment/operations` summaries | single `infra/RUNBOOK.md` |
| E-02 | ★ read-only backups read + documented procedure (provisional) | restore drill; docs reading only |
| E-03 | ★ per-secret procedures, rehearse origin secret (provisional) | rehearse none; rehearse all |
| E-04 | ★ document the limit as the tree is | ceiling 1 on staging; `/admin` stickiness |
| F-01 | **NEW (operator): remove the whole Render example and its mentions, and everything only it needs; the instructions are no longer maintained** | ★ bring in line with the task environment; fix only the broken parts |
| F-02 | ★ delete orphan compose and `development` target (provisional) | delete compose, keep target |
| F-03 | ★ keep root compose and its three tests | retire it; replace with proxy compose |
| G-01 | ★ 188 closure convention | `done/` resolution format |
| G-02 | ★ short comparison in the closure record | close on the anti-feature alone |
| G-03 | ★ close; move three asks to a new todo | observe all three; keep open |
| G-04 | ★ record (a)-(c), (d) none + todo | build the drift guard |
| G-05 | ★ fold docs-accuracy items, re-target the rest | fold everything; fold nothing |

**Consequences of the F-01 overrule recorded in CONTEXT.md:** ruling A5 / 181-12 superseded; DOCS-07 and ROADMAP § 189 criterion 5 amended; no `deployment/render` page; Render's statement leaves C-01's count with the file; the root compose's test halves survive.
