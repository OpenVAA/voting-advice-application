# Phase 181: Deployability and Migration Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-11
**Phase:** 181-Deployability and Migration Model
**Areas discussed:** 181-1 freeze mechanism, 181-2 `schema/` after the freeze, 181-3 cutover commit, 181-4 migration names, 181-5 bucket insert, 181-6 bootstrap script, 181-7 drift and seed checks, 181-8 health endpoint, 181-9 start-up check, 181-10 client address, 181-11 `SIGTERM` and proxy topology, 181-12 templates, things the freeze makes permanent

---

## How this discussion was held

The discussion was not interactive. Every decision of phases 181, 182 and 183 was written into one document,
`.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md`, with its options as checkboxes and one
option marked ★ RECOMMENDED. The operator filled it in one pass on 2026-10-11. An unticked decision takes its ★;
a note beats a box. That document holds every option presented, with its cost, and the table "Rulings as read,
2026-10-11" at its end. It is the full record and is not repeated here.

## The operator's choices

Every decision took its ★ RECOMMENDED option. Twelve were left unticked; 181-12 was ticked on the ★.

## Notes the operator wrote

- **181-12:** "Check there if we can retire the whole compose file as well. Is the test necessary?" Recorded under phase 189 in the roadmap.

## Claude's Discretion

See the "Claude's Discretion" list of `181-CONTEXT.md`.

## Deferred Ideas

See the "Deferred Ideas" section of `181-CONTEXT.md`.
