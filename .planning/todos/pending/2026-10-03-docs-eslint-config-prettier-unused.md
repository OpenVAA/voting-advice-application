---
title: "`apps/docs` declares `eslint-config-prettier` but its ESLint config never uses it"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: any cleanup slot
keywords: [docs, eslint-config-prettier, unused-dependency, cleanup, 168-review-IN-01]
re_check_trigger: "any time"
---

# Unused docs devDependency (168 review IN-01)

`apps/docs/package.json` declares `eslint-config-prettier: catalog:`. `apps/docs/eslint.config.js` imports only
`@openvaa/shared-config/eslint` and `eslint-plugin-svelte`, and `@openvaa/shared-config` declares and applies
`eslint-config-prettier` itself. Phase 169 left it in place (169-10's sweep covered unassigned majors and consumer-less
catalog keys, not unused declarations); the catalog key stays consumed by `@openvaa/shared-config` either way.

**What to do:** remove the declaration from `apps/docs/package.json`, `yarn install`, then `yarn workspace
@openvaa/docs lint` (or the root `lint:check`) and confirm the findings list is unchanged.
