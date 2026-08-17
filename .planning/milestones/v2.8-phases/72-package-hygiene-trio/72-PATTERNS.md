# Phase 72: Package Hygiene Trio - Pattern Map

**Mapped:** 2026-05-09
**Files analyzed:** 13 files modified/created across 3 plans
**Analogs found:** 13 / 13 (100%) — every modified file has a verified canonical analog at HEAD `94a5934cf`

## File Classification

| New/Modified File | Plan | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|------|-----------|----------------|---------------|
| `packages/app-shared/src/index.ts` | 72-01 | barrel | static re-export | `packages/core/src/index.ts` | exact (D-04 tiebreaker) |
| `packages/app-shared/src/data/isImage.ts` | 72-01 | source | static (no `.js` ext) | `packages/data/src/**` | role + flow match |
| `packages/app-shared/src/data/isLocalized.ts` | 72-01 | source | static (no `.js` ext) | `packages/data/src/**` | role + flow match |
| `packages/app-shared/src/data/isEmoji.ts` | 72-01 | source | static (no `.js` ext) | `packages/data/src/**` | role + flow match |
| `packages/app-shared/package.json` | 72-01 | package manifest | publish-readiness fields | `packages/core/package.json` | exact (with justified divergence) |
| `packages/app-shared/README.md` | 72-01 | docs | rationale/justification | (rewrite — current text is stale) | self-rewrite |
| `packages/app-shared/tsconfig.tsbuildinfo` | 72-01 | stale artifact | DELETE | (none — orphan) | delete only |
| `packages/README.md` | 72-01 | docs | NEW canonical paradigm reference | (none — new file) | greenfield |
| `CLAUDE.md` | 72-01 + 72-03 | docs | docstring anchor + script ref | self (current sections) | self-edit |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` | 72-02 | context | import-path rewrite | (already-direct consumers in `tests/`) | exact |
| `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` | 72-02 | type | import-path rewrite | (already-direct consumers in `tests/`) | exact |
| `apps/frontend/src/lib/utils/merge.ts` | 72-02 | shim | DELETE | (none — only shim of its kind) | delete only |
| `apps/supabase/package.json` | 72-03 | package manifest | script rename | self (current `lint:schema` already uses `lint:<noun>` pattern) | self-edit |
| `package.json` (root) | 72-03 | root manifest | script rename | self | self-edit |

## Pattern Assignments

### Plan-72-01 (SHARED-01): `@openvaa/app-shared` paradigm normalisation

The canonical paradigm is **byte-equivalent across `@openvaa/core`, `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`** modulo two small variations: (a) `data` and `filters` add a `dependencies` block; (b) `data` adds an extra `generate:test-data-json` script. Per D-04, `@openvaa/core` is the tiebreaker. Plan-72-01 brings `@openvaa/app-shared` to this shape, preserving the dual ESM+CJS `tsup` divergence per D-06.

#### Pattern A: Canonical `package.json` shape

**Analog:** `packages/core/package.json` (verbatim, lines 1-43)

**Full file** (use as copy-paste template; substitute name/description/directory/homepage):

```json
{
  "name": "@openvaa/core",
  "version": "0.1.0",
  "license": "MIT",
  "description": "Core types, interfaces, and utilities for OpenVAA voting advice applications",
  "repository": {
    "type": "git",
    "url": "https://github.com/OpenVAA/voting-advice-application.git",
    "directory": "packages/core"
  },
  "homepage": "https://github.com/OpenVAA/voting-advice-application/tree/main/packages/core",
  "bugs": {
    "url": "https://github.com/OpenVAA/voting-advice-application/issues"
  },
  "files": [
    "dist",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly --outDir dist",
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "typecheck": "tsc --noEmit"
  },
  "type": "module",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  },
  "devDependencies": {
    "@openvaa/shared-config": "workspace:^",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

**Current `app-shared/package.json` (verbatim, lines 1-35) — divergence highlighted:**

```json
{
  "private": true,                                    // D-02 of source todo: keep (not published)
  "name": "@openvaa/app-shared",
  "version": "0.1.0",
                                                       // <-- MISSING: license, description, repository, homepage, bugs
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly --outDir dist",
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "test:unit": "vitest run --passWithNoTests",       // <-- justified divergence (real tests exist; keep)
    "typecheck": "tsc --noEmit"
  },
  "type": "module",
  "main": "./dist/index.cjs",                          // <-- justified divergence (CJS resolution; D-06)
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {                                     // <-- justified divergence (CJS branch; D-06)
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "dependencies": {
    "@openvaa/data": "workspace:^"
  },
  "devDependencies": {
    "@openvaa/shared-config": "workspace:^",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

**Action (per RESEARCH §"Delta 2" + D-06):** Add `description` minimally; private package legitimately omits `license`/`files`/`publishConfig`. Keep `private: true`, `main`, `test:unit`, `dependencies`, `require` exports branch — all justified divergences.

**Target shape** (after Plan-72-01):

```json
{
  "private": true,
  "name": "@openvaa/app-shared",
  "version": "0.1.0",
  "description": "Settings and utilities shared between OpenVAA frontend and backend. Builds to both ESM (frontend) and CommonJS (preserved for future-compatibility; see README).",
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly --outDir dist",
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "test:unit": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.cjs" }
    }
  },
  "dependencies": { "@openvaa/data": "workspace:^" },
  "devDependencies": {
    "@openvaa/shared-config": "workspace:^",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

#### Pattern B: Canonical `tsconfig.json` shape

**Analog:** `packages/core/tsconfig.json` (verbatim, lines 1-13)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": {
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo",
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "emitDeclarationOnly": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts"]
}
```

**Current `app-shared/tsconfig.json` (verbatim, lines 1-15)** — already byte-equivalent except for the `references` block (justified — needed for project-references compilation since app-shared depends on `data`):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": {
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo",
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "emitDeclarationOnly": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts"],
  "references": [{ "path": "../data/tsconfig.json" }]
}
```

**Action:** **NO CHANGE NEEDED.** Already canonical. (The `references` block matches `packages/data/tsconfig.json:14` and `packages/filters/tsconfig.json` — standard pattern when a package depends on another workspace package.)

#### Pattern C: Canonical `tsup.config.ts` shape

**Analog:** `packages/core/tsup.config.ts` (verbatim, lines 1-9)

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true
});
```

**Current `app-shared/tsup.config.ts` (verbatim, lines 1-9)** — diverges in `format` only:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],   // <-- the ONLY divergence; preserved per D-06
  outDir: 'dist',
  clean: true,
  sourcemap: true
});
```

**Action:** **NO CHANGE NEEDED.** Justified divergence; documented in README per D-06.

#### Pattern D: Canonical barrel `index.ts` (flat, no `.js` extensions)

**Analog:** `packages/core/src/index.ts` (verbatim, lines 1-19)

```ts
export * from './controller/abortError';
export * from './controller/controller';
export * from './controller/controller.type';
export * from './controller/noOpController';
export * from './entity/entity.type';
export * from './entity/getEntity';
export * from './id/haveSameId';
export * from './id/id.type';
export * from './id/isValidId';
export * from './matching/distance';
export * from './matching/distance.type';
export * from './matching/hasAnswers';
export * from './matching/hasAnswers.type';
export * from './matching/matchableQuestion.type';
export * from './matching/missingValue';
export * from './matching/missingValue.type';
export * from './pipelines/metrics.type';
export * from './serializable/serializable.type';
```

**Corroborating analog:** `packages/matching/src/index.ts` (verbatim, lines 1-13) — also uses sub-barrels rather than per-file re-exports, but same `.js`-free convention:

```ts
/*
 * Utility exports for this module. We are using blob exports here because
 * we're using named exports in the folder index files.
 */

export * from './algorithms';
export * from './distance';
export * from './match';
export * from './missingValue';
export * from './space';
export * from './utils';
```

**Corroborating analog:** `packages/filters/src/index.ts` (verbatim, lines 1-4):

```ts
export * from './filter';
export * from './group';
export * from './missingValue';
export * from './utils';
```

**Current `app-shared/src/index.ts` (verbatim, lines 1-14)** — every line ends in `.js`:

```ts
export * from './data/argumentType.js';
export * from './data/customData.type.js';
export * from './data/extendedData.type.js';
export * from './data/getCustomData.js';
export * from './data/isEmoji.js';
export * from './data/isImage.js';
export * from './data/isLocalized.js';
export * from './data/localized.type.js';
export * from './settings/dynamicSettings.js';
export * from './settings/dynamicSettings.type.js';
export * from './settings/staticSettings.js';
export * from './settings/staticSettings.type.js';
export * from './utils/mergeSettings.js';
export * from './utils/passwordValidation.js';
```

**Target shape** (mechanical strip):

```ts
export * from './data/argumentType';
export * from './data/customData.type';
export * from './data/extendedData.type';
export * from './data/getCustomData';
export * from './data/isEmoji';
export * from './data/isImage';
export * from './data/isLocalized';
export * from './data/localized.type';
export * from './settings/dynamicSettings';
export * from './settings/dynamicSettings.type';
export * from './settings/staticSettings';
export * from './settings/staticSettings.type';
export * from './utils/mergeSettings';
export * from './utils/passwordValidation';
```

#### Pattern E: Canonical relative-import policy (no `.js` on TS-internal imports)

**Analog evidence (RESEARCH-verified, HEAD `94a5934cf`):**
- `grep -rEn "from ['\"]\\.\\.?.*\\.js['\"]" packages/{core,data,matching,filters}/src/ | wc -l` returns `0`.
- All canonical packages import as `from './localFile'`, never `from './localFile.js'`.

**Current app-shared internal `.js` hits to strip (per RESEARCH §"Delta 1"):**

```ts
// packages/app-shared/src/data/isImage.ts:1 (current — VERBATIM)
import { isPlainObject } from './utils/isPlainObject.js';

// Target:
import { isPlainObject } from './utils/isPlainObject';
```

```ts
// packages/app-shared/src/data/isLocalized.ts:1-3 (current — VERBATIM)
import { isImage } from './isImage.js';
import { isPlainObject } from './utils/isPlainObject.js';
import type { LocalizedObject, LocalizedString } from './localized.type.js';

// Target:
import { isImage } from './isImage';
import { isPlainObject } from './utils/isPlainObject';
import type { LocalizedObject, LocalizedString } from './localized.type';
```

```ts
// packages/app-shared/src/data/isEmoji.ts:1-2 (current — VERBATIM)
import { isPlainObject } from './utils/isPlainObject.js';
import type { Emoji } from './customData.type.js';

// Target:
import { isPlainObject } from './utils/isPlainObject';
import type { Emoji } from './customData.type';
```

**Operationally:** Plan-72-01 should run `git grep -lE "from ['\"][^'\"]+\\.js['\"]" packages/app-shared/src/` first to enumerate all hits (including any test files), then strip atomically. RESEARCH cites 18 hits total (14 in `index.ts` + 4 in src files). Verify exhaustively.

#### Pattern F: README dual-build justification (D-06)

**Current `packages/app-shared/README.md` line 23 (VERBATIM):**

```markdown
Currently ESM version is used by `@openvaa/frontend` and CommonJS by `@openvaa/strapi` modules.
```

**Issue (per RESEARCH Pitfall 6 + Open Question 1):** `@openvaa/strapi` is retired. **No verified in-repo CJS consumer at HEAD `94a5934cf`** (verified by grepping `@openvaa/app-shared` over `apps/supabase/`, `apps/frontend/`, `packages/dev-seed/`, etc. — all consumers are ESM `type: module`).

**Action (per D-06 + Pitfall 6):** Rewrite the paragraph truthfully. Recommended language:

> The package builds to both ESM and CommonJS via `tsup` (`format: ['esm', 'cjs']`). The ESM output is consumed by all current in-repo consumers (`@openvaa/frontend`, `@openvaa/dev-seed`, etc., all `type: module`). The CommonJS output is preserved as a future-compatibility hedge — if a downstream consumer (e.g., a future Edge Function or external integration) requires CJS resolution, the artifact is already produced. The `main` field in `package.json` resolves to `./dist/index.cjs` for any Node.js process that falls back to the legacy resolution path.

#### Pattern G: Stale `tsconfig.tsbuildinfo` deletion

**Current state (per RESEARCH §"Delta 4"):** `packages/app-shared/tsconfig.tsbuildinfo` is tracked in git. Content is a stale strapi-era artifact pointing to `node_modules/@strapi/admin/...`.

**Canonical state:** None of the 4 canonical packages tracks a `tsconfig.tsbuildinfo` at the package root.

**Action:**
```bash
git rm packages/app-shared/tsconfig.tsbuildinfo
```

**Verification (per Pitfall 4):** `packages/app-shared/tsconfig.json:5` already sets `tsBuildInfoFile: "./dist/tsconfig.tsbuildinfo"`. After deletion, the next `yarn workspace @openvaa/app-shared build` will write the fresh tsbuildinfo to `dist/` (gitignored per `.gitignore:2`). No new file should appear at the package root.

#### Pattern H: `packages/README.md` (NEW — anchor doc)

**Analog:** None — file does not exist. Greenfield.

**Required content (per D-03 + RESEARCH §"Anchor Doc Placement"):**
1. Name the canonical 4: `@openvaa/core`, `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`.
2. Short prose sections: import-path policy (no `.js` ext), barrel structure (flat `index.ts` re-exports — `core` is the tiebreaker per D-04), build pipeline (`tsup` + `tsc --emitDeclarationOnly`), `package.json` shape (link to `packages/core/package.json` as live reference), `tsconfig.json` shape (extends `@openvaa/shared-config/ts`).
3. **One** justified divergence: `@openvaa/app-shared`'s dual ESM+CJS build (with the verified-truthful one-sentence reason matching the README rewrite from Pattern F).
4. Link to live files (do not duplicate file contents).

**Default per RESEARCH:** Prose-only. Avoid code-snippet templates unless adding material clarity.

#### Pattern I: CLAUDE.md anchor (5-line addition, Option A default)

**Anchor location:** End of `CLAUDE.md` §"Module Resolution & Dependencies" (currently lines 112-125 per RESEARCH).

**Recommended content (5 lines max — per Pitfall 5 bloat ceiling):**

```markdown
**Canonical package paradigm:** New `packages/<name>/` workspaces follow the shape of `@openvaa/core` (lowest in the dep graph; tiebreaker). Same `package.json` scripts, `tsconfig.json` extends, `tsup.config.ts`, flat `src/index.ts` barrel, no `.js` extensions on TS-internal imports. See `packages/README.md` for full reference.
```

**Escape hatch (Option B):** If even this 1-paragraph addition is judged bloat, skip the CLAUDE.md edit and put the anchor only in `packages/README.md`. Either result satisfies SC-1.

---

### Plan-72-02 (SHARED-02): `mergeSettings` shim retirement

**Pattern:** Direct import from `@openvaa/app-shared` (already used elsewhere in the codebase — the shim is the outlier).

**Analog (already-direct consumers in `tests/` per RESEARCH §"Already-direct consumers"):**

- `tests/tests/setup/templates/variant-constituency.ts:53`
- `tests/tests/setup/templates/variant-multi-election.ts:33`
- `tests/tests/setup/templates/variant-startfromcg.ts:35`
- `packages/dev-seed/tests/templates/variant-app-settings.test.ts:27`

These files already import `mergeSettings` directly from `@openvaa/app-shared`. The 3 import lines in `apps/frontend/src/lib/contexts/layout/` are the only deviation.

#### Shim consumer rewrite — exact before/after

**File 1:** `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts`

**BEFORE (verbatim, lines 6 + 11):**

```ts
// line 6:
import { mergeSettings } from '$lib/utils/merge';
// line 11:
import type { DeepPartial } from '$lib/utils/merge';
```

**AFTER:**

```ts
import { mergeSettings } from '@openvaa/app-shared';
import type { DeepPartial } from '@openvaa/app-shared';
```

(Note: the existing line 9 already imports `VideoContent` from `@openvaa/app-shared` — the new imports may be merged into that same import statement for compactness, e.g., `import { mergeSettings, type VideoContent } from '@openvaa/app-shared'; import type { DeepPartial } from '@openvaa/app-shared';`. Planner discretion.)

**File 2:** `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts`

**BEFORE (verbatim, line 4):**

```ts
import type { DeepPartial } from '$lib/utils/merge';
```

**AFTER:**

```ts
import type { DeepPartial } from '@openvaa/app-shared';
```

(Same merge opportunity with line 1's `import type { VideoContent } from '@openvaa/app-shared';`.)

#### Shim file deletion

**File:** `apps/frontend/src/lib/utils/merge.ts`

**Current content (verbatim, lines 1-5) — confirms it's a pure re-export with NO original code:**

```ts
/**
 * Re-export of @openvaa/app-shared's deep-merge utility (Phase 63 hoist, D-02).
 * Kept as a re-export so existing `$lib/utils/merge` import sites compile unchanged.
 */
export { type DeepPartial,mergeSettings } from '@openvaa/app-shared';
```

**Action:**
```bash
git rm apps/frontend/src/lib/utils/merge.ts
```

**Verification gate (per RESEARCH §SHARED-02 success criteria):**
```bash
git grep -nE "from ['\"]\\\$lib/utils/merge['\"]" apps/frontend/ tests/ packages/   # expect 0 matches
git grep -nE "['\"]\\\$lib/utils/merge['\"]" apps/frontend/ tests/ packages/        # broader; also expect 0
yarn workspace @openvaa/frontend build                                              # exits 0
yarn workspace @openvaa/frontend test:unit                                          # exits 0
```

#### Other-shim audit (per D-07)

**Action:** Run `grep -lE "^export .* from ['\"]@openvaa/" apps/frontend/src/lib/utils/*.ts` first.

**Expected result (RESEARCH-verified, HEAD `94a5934cf`):** Only `merge.ts` matches. **No follow-up todo needed.** The 6-line `removeDuplicates.ts` is a real implementation, not a re-export.

---

### Plan-72-03 (LINT-01): Supabase lint script disambiguation

**Pattern:** `lint:<noun>` for sibling lint commands (matches existing `lint:schema` in the same file). Recommended target name: `lint:sql` (per RESEARCH §"Naming convention picks").

**Analog (in-file):** `apps/supabase/package.json:13` already has `"lint:schema": "node scripts/lint-schema.mjs"` — same `lint:<noun>` shape. The target rename of the SQL script to `lint:sql` matches this existing convention exactly.

#### Edit 1: `apps/supabase/package.json`

**BEFORE (verbatim, lines 1-22):**

```json
{
  "private": true,
  "type": "module",
  "name": "@openvaa/supabase",
  "version": "0.1.0",
  "scripts": {
    "start": "supabase start",
    "stop": "supabase stop",
    "reset": "supabase db reset",
    "diff": "supabase db diff",
    "status": "supabase status",
    "lint": "supabase db lint --schema public --fail-on warning",
    "lint:schema": "node scripts/lint-schema.mjs",
    "lint:all": "yarn lint && yarn lint:schema",
    "test:unit": "vitest run"
  },
  "devDependencies": {
    "supabase": "catalog:",
    "vitest": "catalog:"
  }
}
```

**AFTER (target):**

```json
{
  "private": true,
  "type": "module",
  "name": "@openvaa/supabase",
  "version": "0.1.0",
  "scripts": {
    "start": "supabase start",
    "stop": "supabase stop",
    "reset": "supabase db reset",
    "diff": "supabase db diff",
    "status": "supabase status",
    "lint:sql": "supabase db lint --schema public --fail-on warning",
    "lint:schema": "node scripts/lint-schema.mjs",
    "lint:all": "yarn lint:sql && yarn lint:schema",
    "test:unit": "vitest run"
  },
  "devDependencies": {
    "supabase": "catalog:",
    "vitest": "catalog:"
  }
}
```

Three lines change: line 12 (`lint` → `lint:sql`), line 14 (`lint:all` self-reference updated per Pitfall 3).

#### Edit 2: `package.json` (root) line 38

**BEFORE (verbatim):**

```json
"supabase:lint": "yarn workspace @openvaa/supabase lint:all"
```

**AFTER:**

```json
"supabase:lint:sql": "yarn workspace @openvaa/supabase lint:all"
```

#### Edit 3: `CLAUDE.md` line 63 — Supabase Commands section

**BEFORE (verbatim, lines 55-64):**

```bash
yarn supabase:start           # Start local Supabase instance
yarn supabase:stop            # Stop local Supabase instance
yarn supabase:reset           # Reset database (drops and recreates)
yarn supabase:status          # Show service status
yarn supabase:types           # Regenerate TypeScript types from schema
yarn supabase:lint            # Run SQL linter on all migrations
```

**AFTER:**

```bash
yarn supabase:start           # Start local Supabase instance
yarn supabase:stop            # Stop local Supabase instance
yarn supabase:reset           # Reset database (drops and recreates)
yarn supabase:status          # Show service status
yarn supabase:types           # Regenerate TypeScript types from schema
yarn supabase:lint:sql        # Run SQL linter on all migrations (sqlfluff + Splinter advisors)
```

#### Non-edits (verified by RESEARCH)

| File | Why no edit | Citation |
|------|-------------|----------|
| `turbo.json` | Turborepo's `lint` task is script-existence-driven; the supabase workspace simply drops out of the fan-out after the rename. No `turbo.json` task definition references `supabase:lint`. | RESEARCH §"Implicit call sites" + lines 569 + 593-597 |
| `.github/workflows/*.yml` | Zero references to `yarn supabase:lint` or `yarn workspace @openvaa/supabase lint`. CI's only lint invocation is `yarn lint:check` in `main.yaml:67`. | RESEARCH §"CI workflow references" lines 599-602 |
| Phase 68 historical `.planning/milestones/v2.7-phases/68-*` | Frozen audit trail; do not edit. | RESEARCH §"Documentation-only call sites" line 587 |
| `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md` | These reference the rename **target** (`lint:sql` already authored as such); no rename-followup edit required. | RESEARCH §"Documentation-only call sites" lines 584-586 |

**Verification gate (per LINT-01 success criteria):**

```bash
grep -c '"supabase:lint":' package.json                          # expect 0
grep -c '"supabase:lint:sql":' package.json                      # expect 1
grep -c '"lint":' apps/supabase/package.json                     # expect 0
grep -c '"lint:sql":' apps/supabase/package.json                 # expect 1
grep -c 'yarn supabase:lint:sql' CLAUDE.md                       # expect >=1
grep -cE 'yarn supabase:lint(\s|$)' CLAUDE.md                    # expect 0 (old form, trailing space/EOL)
yarn lint:check 2>&1 | grep -c "supabase db lint"                # expect 0 (no longer in JS lint chain)
yarn supabase:start && yarn supabase:lint:sql                    # runs SQL linter; warnings expected per deferred §3
```

---

## Shared Patterns

### Pattern S1: Canonical paradigm lookup order (Plan-72-01)

**Decision rule (per D-04, RESEARCH Pitfall 8):** When the canonical 4 diverge, `@openvaa/core` is the tiebreaker (lowest in dep graph). When all 4 agree (`tsup.config.ts`, `package.json` script names, `lint` flag, `vitest.config.ts` empty stub), the agreement is the paradigm.

**Sources for tie-break tests:**
- `packages/core/package.json:1-43`
- `packages/core/tsconfig.json:1-13`
- `packages/core/tsup.config.ts:1-9`
- `packages/core/src/index.ts:1-19`

### Pattern S2: Justified divergence list (preserved in app-shared)

Per RESEARCH §"Non-Deltas" + §"Delta 3" + §"App-shared Divergence Audit" lines 489-523:

| Field | app-shared value | Canonical value | Why preserved |
|-------|------------------|-----------------|---------------|
| `private` | `true` | (absent — packages are publishable) | App-shared is internal-only. |
| `main` | `./dist/index.cjs` | (absent) | Required for Node CJS resolution fallback when consumer hits dual-build path. |
| `tsup.config.ts:format` | `['esm', 'cjs']` | `['esm']` | Future-compatibility hedge per D-06; documented in README. |
| `package.json:exports.require` | present | absent | Same reason as `main`; CJS branch needed for `require()` resolution. |
| `package.json:scripts.test:unit` | `vitest run --passWithNoTests` | absent | App-shared has real tests (`mergeSettings.test.ts`, `passwordValidation.test.ts`, `isEmoji.test.ts`); canonical packages discover via root `vitest.workspace.ts`. |

### Pattern S3: GSD repo hook workaround (all 3 plans)

Per CLAUDE.md memory note + RESEARCH §"Project Constraints":

```bash
git -c core.hooksPath=/dev/null commit -m "..."
```

Required for any commit in this repo until the global hook config is fixed. Applies uniformly to Plan-72-01, Plan-72-02, Plan-72-03.

### Pattern S4: Phase verification gate (single, at close)

Per RESEARCH §"Validation Architecture" + §"Phase Requirements → Test Map":

```bash
yarn build                                                       # all packages build, dual ESM+CJS for app-shared
yarn test:unit                                                   # all unit tests pass
yarn lint:check                                                  # no SQL linter in chain; ESLint clean
yarn supabase:start && yarn supabase:lint:sql                    # renamed SQL pipeline still works
node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline> <post>   # parity gate
```

Baseline: `67p / 1f / 34c` (Phase 67 close, HEAD `2c7ad2dea`, file `.planning/milestones/v2.7-phases/67-default-seed-alliances/post-fix/parity-diff.log`).

---

## No Analog Found

| File | Reason |
|------|--------|
| `packages/README.md` | NEW file — no existing `packages/`-level paradigm doc in the repo. Plan-72-01 creates fresh per D-03 + RESEARCH §"Anchor Doc Placement". The closest reference shape is `packages/<pkg>/README.md` files, but the new file's purpose (cross-package paradigm reference) has no in-repo precedent. Use prose-only content per RESEARCH Open Question 3 default. |

---

## Metadata

**Analog search scope:**
- `packages/core/`, `packages/data/`, `packages/matching/`, `packages/filters/` — canonical 4 (full read of `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`)
- `packages/app-shared/` — current target state (full read of `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts`, `README.md`, `.gitignore`)
- `apps/frontend/src/lib/utils/merge.ts` — shim source
- `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:1-20` — consumer 1
- `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts:1-15` — consumer 2
- `apps/supabase/package.json` — LINT-01 target
- `package.json` (root) lines 25-49 — LINT-01 root script
- `turbo.json` — verified no edit needed
- `CLAUDE.md` lines 55-64 — Supabase Commands section
- `packages/` directory listing — confirmed `packages/README.md` does NOT exist

**Files scanned:** 18

**Pattern extraction date:** 2026-05-09

**HEAD verified:** `94a5934cf` (matches RESEARCH.md HEAD)
