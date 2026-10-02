---
phase: 167
review: 167-REVIEW.md
recorded: 2026-10-02
---

# Phase 167 — Code-review disposition

The code-review gate is advisory. Every finding is recorded here with what happened to it.

| ID | Severity | Finding | Disposition |
|----|----------|---------|-------------|
| WR-01 | warning | `security/audit-baseline.json` rows describe dependents that no longer exist (js-yaml rows name argument-condensation; flatted rows name the removed `flat-cache@6.1.20`) | deferred to Phase 169 — 169 rewrites the baseline as advisories are fixed; ids are unaffected |
| WR-02 | warning | `@openvaa/shared-config` imports `globals` undeclared; root resolution moved 16.5.0 → 15.14.0 (lint globals 1193 → 1151 keys, findings unchanged) | open — todo `2026-10-02-declare-globals-in-shared-config.md`; candidate for Phase 169's dependency pass |
| IN-01 | info | `OpenVAALogo` emits the fill class twice for predefined colours (carried over from the Svelte 4 original) | open |
| IN-02 | info | Strict Proxy in `safeGetSession.test.ts` traps only `get` | open — `get` is the access path the helper uses |
| IN-03 | info | `apps/docs` has no lint script and its ESLint crashes | deferred to Phase 168 (168-01.1) |
| IN-04 | info | Pre-existing undeclared imports: `zod` (argument-condensation), `@openvaa/app-shared` (question-info), `glob` (docs scripts) | open — `glob` is handled by 168-01.1; the rest predate the phase |
