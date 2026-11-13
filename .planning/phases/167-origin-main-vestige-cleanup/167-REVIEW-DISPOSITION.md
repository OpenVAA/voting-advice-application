---
phase: 167
review: 167-REVIEW.md
recorded: 2026-10-02
---

# Phase 167 — Code-review disposition

The code-review gate is advisory. Every finding is recorded here with what happened to it.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| WR-01 | warning | `security/audit-baseline.json` rows describe dependents that no longer exist (js-yaml rows name argument-condensation; flatted rows name the removed `flat-cache@6.1.20`) | **no change needed** (batch D): resolved by Phase 169 — `accepted` is empty, so the stale rows are gone (`dd1311d2a`) |
| WR-02 | warning | `@openvaa/shared-config` imports `globals` undeclared; root resolution moved 16.5.0 → 15.14.0 (lint globals 1193 → 1151 keys, findings unchanged) | **no change needed** (batch D): resolved by Phase 169 plan 169-10 — `"globals": "catalog:"` declared (`acb99c416` in the restructured history); todo already in `done/` |
| IN-01 | info | `OpenVAALogo` emits the fill class twice for predefined colours (carried over from the Svelte 4 original) | **fixed** in review-fix batch D: `93a2b0706` (red), `34c70b12b` (fix) |
| IN-02 | info | Strict Proxy in `safeGetSession.test.ts` traps only `get` | **fixed** in review-fix batch D: `674af2247` (red), `68d6b09e8` (fix) — `has`, `set`, `deleteProperty` and `ownKeys` are trapped too |
| IN-03 | info | `apps/docs` has no lint script and its ESLint crashes | **no change needed** (batch D): resolved by 168-01.1 — `apps/docs` has `"lint": "eslint ."` and lints clean |
| IN-04 | info | Pre-existing undeclared imports: `zod` (argument-condensation), `@openvaa/app-shared` (question-info), `glob` (docs scripts) | **fixed** in review-fix batch D: `fd81e083a` (red), `b8ba1a1c7` (fix) — `zod` and `@openvaa/app-shared` declared; `glob` was already declared |
