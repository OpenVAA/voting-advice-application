# Phase 13: Tech Debt Cleanup - Research

**Researched:** 2026-03-15
**Domain:** Monorepo housekeeping — version strings, dead code, stale documentation paths
**Confidence:** HIGH

## Summary

Phase 13 addresses 9 well-defined tech debt items identified by the v1.1 milestone audit. All items are mechanical fixes: version string updates, dead export removal, path corrections in documentation, and CI workflow alignment. There are no architectural decisions, no new dependencies, and no feature logic changes.

Every item was verified by examining the actual files in the repository. The fixes are straightforward find-and-replace or small edits. The primary risk is in item 3 (stale docs paths) where 45 occurrences across 15 files need `backend/vaa-strapi` replaced with `apps/strapi`. An additional finding: there are also 262 occurrences of stale `frontend/` paths across 117 docs files, but this is NOT in scope per the CONTEXT.md (only `backend/vaa-strapi` was called out).

**Primary recommendation:** Group the 9 items into 2-3 small plans by category (version alignment, dead code/hooks, docs paths) for clean atomic commits.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
None explicitly locked -- all 9 items are at Claude's discretion.

### Claude's Discretion
All 9 items are well-defined by the milestone audit. Claude has full discretion on implementation approach:

1. `.husky/pre-commit` cd depth -- Fix so it always lands at monorepo root before running `yarn lint-staged`
2. `STRAPI_DIR` dead export -- Remove unused export from `tests/tests/utils/paths.ts`
3. Stale docs paths -- Update 45 references from `backend/vaa-strapi` to `apps/strapi` in `apps/docs/src/`
4. Stale README references -- Update 4 package READMEs (core, data, matching, filters) to reflect tsup instead of tsc-esm-fix
5. Frontend `packageManager` -- Update `apps/frontend/package.json` from `yarn@4.6.0` to `yarn@4.13.0`
6. Strapi `packageManager` -- Update `apps/strapi/package.json` from `yarn@4.6.0` to `yarn@4.13.0`
7. Root `engine.yarn` -- Update from `4.6` to `4.13` in root `package.json`
8. Dockerfile `YARN_VERSION` -- Update from `4.6` to `4.13.0` in both Dockerfiles
9. `docs.yml` Yarn setup -- Add explicit Yarn version pinning (match `release.yml` pattern with `setup-yarn-action`)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

## Detailed Findings Per Item

### Item 1: `.husky/pre-commit` cd depth regression

**Current state (verified):**
```bash
turbo run build --filter=@openvaa/app-shared...

cd apps/frontend
yarn generate:translation-key-type && git diff --quiet src/lib/types/generated/translationKey.ts || (echo "Run 'yarn generate:translation-key-type' and 'git add' generated file" && exit 1)

cd ..
yarn lint-staged
```

**Problem:** Script starts at monorepo root, `cd apps/frontend` enters `apps/frontend/`, then `cd ..` goes to `apps/` (not root). `yarn lint-staged` runs from `apps/` instead of root. This is functionally non-breaking (cosmiconfig traverses upward to find the lint-staged config) but is incorrect.

**Fix:** Change `cd ..` to `cd ../..` to return to monorepo root.

**Confidence:** HIGH -- verified by reading the file.

### Item 2: `STRAPI_DIR` dead export

**Current state (verified):**
File `tests/tests/utils/paths.ts` exports `STRAPI_DIR`, `FRONTEND_DIR`, and `REPO_ROOT`. Only `FRONTEND_DIR` is imported (by `tests/tests/utils/translations.ts`). `STRAPI_DIR` is never imported anywhere.

**Fix:** Remove the `STRAPI_DIR` export line from `tests/tests/utils/paths.ts`.

**Confidence:** HIGH -- verified via grep across entire codebase.

### Item 3: Stale docs paths (`backend/vaa-strapi` -> `apps/strapi`)

**Current state (verified):**
- 45 occurrences across 15 files in `apps/docs/src/`
- All are GitHub blob URLs: `voting-advice-application/blob/main/backend/vaa-strapi/...`
- Replace with: `voting-advice-application/blob/main/apps/strapi/...`

**Files affected (15):**
1. `apps/docs/src/routes/(content)/developers-guide/backend/mock-data-generation/+page.md` (3)
2. `apps/docs/src/routes/(content)/developers-guide/localization/supported-locales/+page.md` (1)
3. `apps/docs/src/routes/(content)/developers-guide/troubleshooting/+page.md` (1)
4. `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md` (3)
5. `apps/docs/src/routes/(content)/developers-guide/development/running-the-development-environment/+page.md` (1)
6. `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/registration-process-in-strapi/+page.md` (3)
7. `apps/docs/src/routes/(content)/developers-guide/configuration/app-customization/+page.md` (2)
8. `apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md` (2)
9. `apps/docs/src/routes/(content)/developers-guide/backend/plugins/+page.md` (1)
10. `apps/docs/src/routes/(content)/developers-guide/backend/security/+page.md` (2)
11. `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.md` (1)
12. `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md` (2)
13. `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md` (3)
14. `apps/docs/src/routes/(content)/developers-guide/backend/default-data-loading/+page.md` (4)
15. `apps/docs/src/routes/(content)/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi/+page.md` (16)

**Implementation approach:** Use `sed` or per-file find-replace: `backend/vaa-strapi` -> `apps/strapi`. This is a safe global replacement within GitHub blob URLs.

**Additional finding (OUT OF SCOPE):** There are also 262 occurrences of stale `frontend/` (not `apps/frontend/`) paths across 117 docs files. The CONTEXT.md only scopes `backend/vaa-strapi` corrections, so this is out of scope for Phase 13 but should be noted for future cleanup.

**Confidence:** HIGH -- verified via grep counts.

### Item 4: Stale README references to `tsc-esm-fix`

**Current state (verified):**
Five files contain `tsc-esm-fix` references. Four are in-scope per CONTEXT.md (core, data, matching, filters). The fifth is in `shared-config/README.md`.

| File | Current text | Status |
|------|-------------|--------|
| `packages/core/README.md:16` | `The module uses [tsc-esm-fix]...` | In scope |
| `packages/data/README.md:15` | `The module uses [tsc-esm-fix]...` | In scope |
| `packages/matching/README.md:28` | `The module uses [tsc-esm-fix]...` | In scope |
| `packages/filters/README.md:21` | `The module uses [tsc-esm-fix]...` | In scope |
| `packages/shared-config/README.md:12` | `"tsc-esm-fix": "^3.1.2"` (in devDeps example) | In scope (CONTEXT.md says "4 package READMEs" but shared-config also references it) |

**Replacement text:** The actual tooling is now `tsup` (verified: `packages/core/package.json` build script is `tsup && tsc --emitDeclarationOnly --outDir dist`). Replace the tsc-esm-fix sentence with something like: "The module uses [`tsup`](https://tsup.egoist.dev/) for building ESM output with automatic import resolution."

For `shared-config/README.md`, the devDependencies example should replace `tsc-esm-fix` with `tsup`.

**Confidence:** HIGH -- verified via grep and package.json inspection.

### Items 5-8: Yarn version alignment

**Current state (verified):**

| File | Field | Current | Target |
|------|-------|---------|--------|
| `apps/frontend/package.json:85` | `packageManager` | `yarn@4.6.0` | `yarn@4.13.0` |
| `apps/strapi/package.json:67` | `packageManager` | `yarn@4.6.0` | `yarn@4.13.0` |
| Root `package.json:60` | `engine.yarn` | `4.6` | `4.13` |
| `apps/frontend/Dockerfile:6` | `YARN_VERSION` | `4.6` | `4.13.0` |
| `apps/strapi/Dockerfile:6` | `YARN_VERSION` | `4.6` | `4.13.0` |

**Source of truth:** Root `package.json` line 69 has `"packageManager": "yarn@4.13.0"` -- this is the correct version. All other references must match.

**Note on Dockerfile value:** The Dockerfiles use `ENV YARN_VERSION=4.6` then `corepack prepare yarn@${YARN_VERSION}`. The value should be `4.13.0` (with patch) to match root packageManager and `corepack prepare` expectations. CI workflows (main.yaml, release.yml) already use `version: 4.13` (minor only, no patch) via `setup-yarn-action`.

**Confidence:** HIGH -- all values verified by grep.

### Item 9: `docs.yml` Yarn setup

**Current state (verified):**
`docs.yml` uses the old pattern:
```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: "yarn"

- name: Install dependencies
  run: |
    yarn install --immutable
    cd apps/docs
    yarn install --immutable
```

It lacks the `setup-yarn-action` step that `release.yml` and `main.yaml` already have.

**Target pattern (from `release.yml`):**
```yaml
- name: Setup Yarn 4.13
  uses: threeal/setup-yarn-action@v2
  with:
    version: 4.13

- name: Setup Node.js 20.18.1
  uses: actions/setup-node@v4
  with:
    node-version: 20.18.1
    cache: "yarn"
```

**Additional issue:** The `docs.yml` also has a redundant `cd apps/docs && yarn install --immutable` step. Since it is a Yarn workspaces monorepo, a single `yarn install --immutable` at root should suffice. Also, the flag should be `--frozen-lockfile` to match other workflows (both flags work, but consistency matters).

**Confidence:** HIGH -- verified by comparing all three workflow files.

## Architecture Patterns

### Pattern: Consistent CI Workflow Bootstrap

All CI workflows should follow this bootstrap sequence:
```yaml
- uses: actions/checkout@v4
- uses: threeal/setup-yarn-action@v2
  with:
    version: 4.13
- uses: actions/setup-node@v4
  with:
    node-version: 20.18.1
    cache: "yarn"
- run: yarn install --frozen-lockfile
```

Currently `main.yaml` and `release.yml` follow this pattern. `docs.yml` does not.

### Pattern: Version Source of Truth

Root `package.json` field `"packageManager": "yarn@4.13.0"` is the single source of truth for the Yarn version. All other references (app-level packageManager, engine.yarn, Dockerfiles, CI workflows) must align.

## Don't Hand-Roll

Not applicable for this phase -- all items are simple edits, no library usage needed.

## Common Pitfalls

### Pitfall 1: Incomplete sed replacement in docs
**What goes wrong:** Replacing `backend/vaa-strapi` in docs but missing some occurrences or accidentally replacing text outside GitHub URLs.
**How to avoid:** Use exact string matching. Verify count before and after: expect exactly 45 replacements across 15 files. Run `grep -r 'backend/vaa-strapi' apps/docs/src/` after to confirm zero remaining.

### Pitfall 2: Dockerfile YARN_VERSION format
**What goes wrong:** Using `4.13` (without patch) in Dockerfiles while corepack expects `4.13.0` for precise version resolution.
**How to avoid:** Use `4.13.0` (with patch version) in Dockerfiles to match root packageManager field. CI workflows use `4.13` (minor only) because `setup-yarn-action` handles resolution differently.

### Pitfall 3: Husky pre-commit not tested
**What goes wrong:** Fixing the cd depth but not verifying the hook actually works.
**How to avoid:** After fixing, run `cd apps/frontend && cd ../..` to verify it lands at root. Or simply test the hook by staging a file and committing.

### Pitfall 4: shared-config README overlooked
**What goes wrong:** Only updating 4 package READMEs (core, data, matching, filters) but missing `shared-config/README.md` which also references `tsc-esm-fix` in its devDependencies example.
**How to avoid:** Include `shared-config/README.md` in the tsc-esm-fix cleanup scope. The CONTEXT.md says "4 package READMEs" but verification shows 5 files contain the reference.

## Code Examples

### Fix 1: `.husky/pre-commit` corrected
```bash
turbo run build --filter=@openvaa/app-shared...

cd apps/frontend
yarn generate:translation-key-type && git diff --quiet src/lib/types/generated/translationKey.ts || (echo "Run 'yarn generate:translation-key-type' and 'git add' generated file" && exit 1)

cd ../..
yarn lint-staged
```

### Fix 2: `tests/tests/utils/paths.ts` cleaned
```typescript
import path from 'path';
import { TESTS_DIR } from './testsDir';

/** Root of the monorepo */
export const REPO_ROOT = path.join(TESTS_DIR, '../..');

/** Frontend application directory */
export const FRONTEND_DIR = path.join(REPO_ROOT, 'apps', 'frontend');
```

### Fix 9: `docs.yml` aligned with CI pattern
```yaml
steps:
  - name: Checkout
    uses: actions/checkout@v4

  - name: Setup Yarn 4.13
    uses: threeal/setup-yarn-action@v2
    with:
      version: 4.13

  - name: Setup Node.js 20.18.1
    uses: actions/setup-node@v4
    with:
      node-version: 20.18.1
      cache: "yarn"

  - name: Install dependencies
    run: yarn install --frozen-lockfile
```

## Recommended Plan Grouping

| Plan | Items | Description | Files |
|------|-------|-------------|-------|
| Plan 1 | 1, 2 | Hook fix + dead code removal | 2 files |
| Plan 2 | 5, 6, 7, 8, 9 | Yarn version alignment across all references + docs.yml CI alignment | 5 files |
| Plan 3 | 3, 4 | Documentation path corrections + README updates | 20 files |

This grouping keeps related changes together and separates the high-file-count docs update into its own plan.

## Open Questions

1. **shared-config/README.md scope**
   - What we know: CONTEXT.md says "4 package READMEs" but shared-config also has a tsc-esm-fix reference
   - Recommendation: Include it in scope -- it is clearly the same type of stale reference and omitting it would leave an inconsistency

2. **Stale `frontend/` paths in docs (262 occurrences)**
   - What we know: These exist but were not called out in the milestone audit as part of Phase 13
   - What's unclear: Whether these should be added to Phase 13 scope
   - Recommendation: Document as a finding but keep out of scope per CONTEXT.md constraints. Flag for future cleanup or a separate task

3. **docs.yml redundant install step**
   - What we know: `docs.yml` has `cd apps/docs && yarn install --immutable` as a second install step, which other workflows do not have
   - Recommendation: Remove it when aligning the workflow, since `yarn install --frozen-lockfile` at root handles all workspaces

## Validation Architecture

> nyquist_validation not explicitly set in config.json -- treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit), Playwright (E2E) |
| Config file | `vitest.config.ts` (root), `tests/playwright.config.ts` |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn test:unit && yarn test:e2e` |

### Phase Requirements -> Test Map

This phase has no formal requirement IDs. Validation is via manual verification of the 5 success criteria:

| Criterion | Behavior | Test Type | Automated Command | File Exists? |
|-----------|----------|-----------|-------------------|-------------|
| SC-1 | `.husky/pre-commit` uses correct cd depth | manual-only | `grep 'cd \.\./\.\.' .husky/pre-commit` | N/A |
| SC-2 | No unused STRAPI_DIR export | manual-only | `grep -r STRAPI_DIR tests/ \| wc -l` (should be 0) | N/A |
| SC-3 | No old backend/vaa-strapi paths in docs | manual-only | `grep -r 'backend/vaa-strapi' apps/docs/src/ \| wc -l` (should be 0) | N/A |
| SC-4 | No tsc-esm-fix in package READMEs | manual-only | `grep -r 'tsc-esm-fix' packages/*/README.md \| wc -l` (should be 0) | N/A |
| SC-5 | All Yarn version refs say 4.13 | manual-only | `grep -r 'yarn@4\.6\|YARN_VERSION=4\.6\|"4\.6"' . --include='*.json' --include='Dockerfile*' \| wc -l` (should be 0) | N/A |

All validations are grep-based verification commands -- no unit/E2E tests needed for config/docs changes.

### Sampling Rate
- **Per task commit:** Grep verification commands above
- **Per wave merge:** N/A (single wave)
- **Phase gate:** All 5 grep checks return 0

### Wave 0 Gaps
None -- no test infrastructure needed for documentation and configuration fixes.

## Sources

### Primary (HIGH confidence)
- Direct file reads: `.husky/pre-commit`, `tests/tests/utils/paths.ts`, all Dockerfiles, all CI workflows, all affected READMEs, all affected package.json files
- Grep searches: `backend/vaa-strapi` (45 hits in 15 files), `STRAPI_DIR` (1 definition, 0 imports), `tsc-esm-fix` (5 files), `packageManager` (verified in all app package.json files), `YARN_VERSION` (2 Dockerfiles)

### Secondary (MEDIUM confidence)
- `.planning/v1.1-MILESTONE-AUDIT.md` -- authoritative source for the 9 tech debt items

### Tertiary (LOW confidence)
None -- all findings verified by direct file inspection.

## Metadata

**Confidence breakdown:**
- All items: HIGH -- every single item verified by reading the actual files
- File counts: HIGH -- grep counts verified and cross-checked
- Fix approaches: HIGH -- all fixes are mechanical string replacements or small edits

**Research date:** 2026-03-15
**Valid until:** Indefinite (tech debt items are static until fixed)
