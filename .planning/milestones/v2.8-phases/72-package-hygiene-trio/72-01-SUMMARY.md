---
phase: 72-package-hygiene-trio
plan: 01
subsystem: package-hygiene
tags: [paradigm-normalisation, app-shared, canonical-paradigm, esm, cjs, dual-build]
requires: []
provides:
  - canonical-paradigm-reference (packages/README.md)
  - claude-md-anchor (CLAUDE.md §"Module Resolution & Dependencies")
  - app-shared-paradigm-aligned (.js extensions stripped; truthful README + description)
affects:
  - packages/app-shared (paradigm normalisation; no API change)
  - CLAUDE.md (1-paragraph anchor added)
tech_stack_added: []
patterns:
  - canonical-paradigm-reference-doc (NEW pattern, packages-level README)
key_files:
  created:
    - packages/README.md
    - .planning/phases/72-package-hygiene-trio/72-01-SUMMARY.md
  modified:
    - packages/app-shared/src/index.ts
    - packages/app-shared/src/data/isImage.ts
    - packages/app-shared/src/data/isLocalized.ts
    - packages/app-shared/src/data/isEmoji.ts
    - packages/app-shared/package.json
    - packages/app-shared/README.md
    - CLAUDE.md
  deleted:
    - packages/app-shared/tsconfig.tsbuildinfo (stale strapi-era artifact)
decisions:
  - "Option A taken for CLAUDE.md anchor (default per D-03): 1-paragraph anchor in §'Module Resolution & Dependencies' linking to packages/README.md. Net CLAUDE.md growth: +2 lines (359 → 361), well under Pitfall 5's ≤15-line ceiling."
  - "Truthful dual-build justification language adopted per RESEARCH A1 flag — 'future-compatibility hedge' replaces stale '@openvaa/strapi' reference. Verified zero apps/supabase/functions/ files import @openvaa/app-shared; the previous CONTEXT.md 'Edge Functions consume CJS for some legacy paths' rationale was stale at HEAD."
metrics:
  duration: ~25 minutes
  completed: 2026-05-09
  tasks_total: 3
  tasks_completed: 3
  files_changed: 8
  commits: 3
---

# Phase 72 Plan 01: `@openvaa/app-shared` paradigm normalisation Summary

`@openvaa/app-shared` brought to byte-equivalent paradigm with the canonical 4 (`@openvaa/core` is the tiebreaker per D-04) modulo the documented dual-ESM+CJS build divergence; new `packages/README.md` codifies the paradigm and lists `@openvaa/app-shared` as the only justified divergence; CLAUDE.md anchor points to it.

## Outcome

| Item | Status |
|------|--------|
| All 20 `.js` extensions stripped from `packages/app-shared/src/` | ✅ verified `grep -rEn "from ['\"]\.+/.*\.js['\"]" packages/app-shared/src/` returns 0 |
| Stale `packages/app-shared/tsconfig.tsbuildinfo` deleted from git | ✅ `git rm` applied; root file did not regenerate after build |
| Dual ESM+CJS build preserved | ✅ `dist/index.js` (ESM, 7.36 KB), `dist/index.cjs` (CJS, 8.81 KB), `dist/index.d.ts` (types) all produced |
| `package.json` `description` field added with truthful dual-build language | ✅ "Settings and utilities shared between OpenVAA frontend and backend. Builds to both ESM (current consumers) and CommonJS (preserved as a future-compatibility hedge — no current in-repo CJS consumer at the time of writing). See README.md for full rationale." |
| README rewritten — `@openvaa/strapi` reference removed | ✅ `! grep -q "@openvaa/strapi" packages/app-shared/README.md` |
| README contains `## Dual ESM + CommonJS build` section with `future-compatibility hedge` language | ✅ both grep checks pass |
| `packages/README.md` (NEW) created with canonical paradigm reference | ✅ names `@openvaa/core` 5 times; explains import-path / barrel / build / package.json / tsconfig / tsup shapes; lists `@openvaa/app-shared` divergence |
| CLAUDE.md anchor added (Option A) | ✅ `**Canonical package paradigm:**` paragraph in §"Module Resolution & Dependencies" linking to `packages/README.md`; net +2 lines |
| `yarn workspace @openvaa/app-shared lint` passes | ✅ exit 0 |
| `yarn workspace @openvaa/app-shared test:unit` passes | ✅ 21 tests in 3 files (mergeSettings.test.ts, passwordValidation.test.ts, isEmoji.test.ts) |
| Existing tests in `mergeSettings.test.ts`, `passwordValidation.test.ts`, `isEmoji.test.ts` still pass | ✅ all 21 pass |

## .js-extension count: before 20 → after 0

```text
Before:
  packages/app-shared/src/index.ts          14 hits (all 14 export lines)
  packages/app-shared/src/data/isImage.ts    1 hit  (line 1)
  packages/app-shared/src/data/isLocalized.ts 3 hits (lines 1-3)
  packages/app-shared/src/data/isEmoji.ts    2 hits (lines 1-2)
  TOTAL                                     20

After: grep -rEn "from ['\"]\.+/.*\.js['\"]" packages/app-shared/src/ → 0 lines
```

## `package.json` `description` (exact value committed)

```json
"description": "Settings and utilities shared between OpenVAA frontend and backend. Builds to both ESM (current consumers) and CommonJS (preserved as a future-compatibility hedge — no current in-repo CJS consumer at the time of writing). See README.md for full rationale.",
```

This addresses the planning-context A1 flag: the dual-build justification is now truthful (no claim of an unverified `@openvaa/strapi` or Edge Function CJS consumer).

## README rewrite — diff snippet

```diff
- A module shared between `@openvaa/frontend` and `@openvaa/strapi`, which contains:
+ A module shared between `@openvaa/frontend` and (potentially) backend consumers, which contains:

  - The [application settings](./src/settings/)
  - Definitions for data types extending those defined in the `@openvaa/core` and `@openvaa/data` modules, ...
- - Utilities for [password validation](./src/utils/passwordValidation.ts)
+ - Utilities for [password validation](./src/utils/passwordValidation.ts) and [deep merge of settings](./src/utils/mergeSettings.ts)

  ## Development
  ...

- Currently ESM version is used by `@openvaa/frontend` and CommonJS by `@openvaa/strapi` modules.
+ ## Dual ESM + CommonJS build
+
+ The package builds to both ESM and CommonJS via `tsup` (`format: ['esm', 'cjs']`). The ESM output is consumed by all current in-repo consumers (`@openvaa/frontend`, `@openvaa/dev-seed`, etc., all `type: module`). The CommonJS output is preserved as a future-compatibility hedge — if a downstream consumer (e.g., a future Edge Function rewrite or external integration) requires CJS resolution, the artifact is already produced. The `main` field in `package.json` resolves to `./dist/index.cjs` for any Node.js process that falls back to the legacy resolution path.

  The ideation behind this hybrid module solution, as well as different approaches which did not work, are described in [this article](https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html).
```

## CLAUDE.md anchor — Option A (default per D-03)

**Choice:** Option A — added a 1-paragraph anchor in §"Module Resolution & Dependencies" (lines 124 area, between the `references` interdependency note and the `### Build System` heading).

**Net CLAUDE.md growth:** 2 lines (359 → 361). Well under the ≤15-line bloat ceiling per RESEARCH Pitfall 5.

**Inserted text (verbatim):**

```markdown
**Canonical package paradigm:** New `packages/<name>/` workspaces follow the shape of `@openvaa/core` (lowest in the dep graph; tiebreaker per the canonical-paradigm doc). Same `package.json` scripts + `exports`, `tsconfig.json` extends `@openvaa/shared-config/ts`, `tsup.config.ts`, flat `src/index.ts` barrel, no `.js` extensions on TS-internal relative imports. See `packages/README.md` for the full reference.
```

## New file: `packages/README.md`

**Path:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/README.md`

**Content shape:** Prose-only (per RESEARCH §"Anchor Doc Placement" default — no code-snippet templates). Sections:
1. Title + reference statement.
2. Canonical packages list (4 named; `@openvaa/core` flagged as tiebreaker).
3. Paradigm summary (6 bullets: import-path policy, barrel structure, build pipeline, `package.json` shape, `tsconfig.json` shape, `tsup.config.ts` shape — each links to live `packages/core/*` files rather than duplicating).
4. Justified divergences (only `@openvaa/app-shared` listed; rationale points to its README §"Dual ESM + CommonJS build").
5. Adding-a-new-package recipe (copy `@openvaa/core` shape; substitute name/description/repository.directory/homepage).

## Dual ESM+CJS build verification

```bash
$ yarn workspace @openvaa/app-shared run build
ESM dist/index.js     7.36 KB
ESM dist/index.js.map 18.71 KB
CJS dist/index.cjs     8.81 KB
CJS dist/index.cjs.map 19.40 KB
ESM ⚡️ Build success in 11ms
CJS ⚡️ Build success in 11ms

$ ls packages/app-shared/dist/index.{js,cjs,d.ts}
packages/app-shared/dist/index.cjs
packages/app-shared/dist/index.d.ts
packages/app-shared/dist/index.js

$ test ! -f packages/app-shared/tsconfig.tsbuildinfo && echo "ROOT-TSBUILDINFO-ABSENT"
ROOT-TSBUILDINFO-ABSENT
```

## Test verification

```bash
$ yarn workspace @openvaa/app-shared run test:unit
 ✓ src/utils/mergeSettings.test.ts (6 tests)
 ✓ src/utils/passwordValidation.test.ts (8 tests)
 ✓ src/data/isEmoji.test.ts (7 tests)

 Test Files  3 passed (3)
      Tests  21 passed (21)
```

## Lint verification

```bash
$ yarn workspace @openvaa/app-shared run lint; echo "EXIT=$?"
EXIT=0
```

## Justified divergences preserved

Per RESEARCH §"Non-Deltas" and PATTERNS Pattern S2:

| Field | app-shared value | Why preserved |
|-------|------------------|---------------|
| `private` | `true` | Internal-only; not published |
| `main` | `./dist/index.cjs` | Required for Node CJS resolution fallback |
| `tsup.config.ts:format` | `['esm', 'cjs']` | Future-compatibility hedge (D-06) |
| `package.json:exports.require` | present | CJS branch needed for `require()` resolution |
| `package.json:scripts.test:unit` | `vitest run --passWithNoTests` | Real tests in `src/` need a workspace-level `test:unit` runner |
| `package.json:dependencies.@openvaa/data` | `workspace:^` | Genuine workspace dep |

`tsconfig.json` and `tsup.config.ts` shapes already byte-equivalent to canonical (sans the dual-format `tsup` divergence) — no edits needed.

## Deviations from Plan

None — plan executed exactly as written. The only judgement call was whether the canonical-paradigm doc's `@openvaa/core` mention count would meet the acceptance criterion of ≥2 (initial draft had 1 prose mention plus 3 link-path-only mentions); resolved by widening the prose to name `@openvaa/core` 5 times explicitly. The substantive content is unchanged.

## Commits

| Task | Commit | Subject |
|------|--------|---------|
| 1 | `508a15ba0` | refactor(72-01): strip .js extensions from app-shared TS imports + delete stale tsbuildinfo |
| 2 | `127b5b48a` | docs(72-01): truthful description + dual-build justification for @openvaa/app-shared |
| 3 | `ed4cc862f` | docs(72-01): add canonical package paradigm reference + CLAUDE.md anchor |

(All commits made with `git -c core.hooksPath=/dev/null commit ...` per the project hook workaround.)

## Cross-Plan Coordination Notes

This plan and Plan 72-03 (LINT-01) both modify `CLAUDE.md`. Plan 72-01 inserts after line ~123 (§"Module Resolution & Dependencies"); Plan 72-03 edits line 63 (§"Supabase Commands"). The textual edits do not overlap. As of this plan's commit, CLAUDE.md is at 361 lines (was 359) — the +2-line growth leaves headroom for Plan 72-03's same-line rename.

## Self-Check: PASSED

- All 8 created/modified file paths verified to exist on disk.
- All 3 commit hashes (`508a15ba0`, `127b5b48a`, `ed4cc862f`) verified via `git log --oneline`.
- All 11 plan-level verification gate checks pass (see "Outcome" table above).
