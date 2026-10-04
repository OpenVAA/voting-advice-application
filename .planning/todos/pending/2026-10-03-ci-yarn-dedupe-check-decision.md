---
title: "Decide whether CI should hold the lockfile to `yarn dedupe --check` (Phase 169 introduced the check locally)"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: next CI-hardening phase
keywords: [yarn, dedupe, lockfile, ci, gate, operator]
re_check_trigger: "operator decision; any time"
---

# `yarn dedupe --check` is a phase-local gate, not a CI gate (169-01)

`169-gates.sh` runs `yarn dedupe --check` as gate 02. The starting lockfile failed it (71 dedupable descriptors);
group 0's `yarn dedupe` brought it to 0, and every later 169 gate run kept it at 0. No workflow, script or hook in the
repository runs `yarn dedupe` (`grep -rn dedupe .github/ package.json` → nothing), so the lockfile can drift again.

**Decision for the operator:** add `yarn dedupe --check` to the CI install/lint job (cheap; a failing check is fixed with
`yarn dedupe` in the same PR), or leave it to dependency phases.
