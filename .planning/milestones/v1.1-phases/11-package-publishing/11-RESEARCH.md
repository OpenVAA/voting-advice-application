# Phase 11: Package Publishing - Research

**Researched:** 2026-03-13
**Domain:** npm package publishing, tsup build tooling, Yarn workspace protocol, Changesets CI publishing
**Confidence:** HIGH

## Summary

Phase 11 makes four packages (@openvaa/core, @openvaa/data, @openvaa/matching, @openvaa/filters) publishable to npm. The work covers three main areas: (1) migrating ALL packages from `tsc + tsc-esm-fix` to tsup, (2) adding npm metadata and LICENSE files to publishable packages, and (3) configuring CI to publish via `yarn npm publish` instead of `changeset publish`.

The most critical finding is that **Changesets has an unresolved bug with Yarn workspaces**: `changeset publish` uses `npm publish` under the hood, which does NOT resolve `workspace:^` protocol to real version numbers. The fix PRs (#1449, #1560, #674) remain unmerged as of March 2026. The solution is to use a custom publish script that calls `yarn workspaces foreach --no-private yarn npm publish` instead, which correctly resolves workspace protocols.

The second important finding concerns tsup's `.d.ts` generation in monorepos with TypeScript project references. tsup's `--dts` flag has known issues with `composite: true` and project references (issue #647, open since 2022, 62 upvotes). The proven workaround is to use tsup for JS bundling and `tsc --emitDeclarationOnly` for type declarations in a two-step build.

**Primary recommendation:** Use tsup 8.x for ESM-only JS output, tsc for declaration files, and a custom `yarn workspaces foreach` publish script to bypass the Changesets workspace protocol bug.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- MIT license for the 4 publishable packages (core, data, matching, filters)
- Each publishable package gets its own MIT LICENSE file
- Root repository stays GPL-3.0 (split licensing -- standard open-source practice)
- Package descriptions: Claude generates concise, accurate npm descriptions per package
- All 4 publishable packages target 1.0.0 as the first published version
- Don't manually bump in package.json -- let Changesets handle the 0.1.0 to 1.0.0 bump via a major changeset
- All start at the same version (1.0.0), then diverge naturally via independent versioning
- ESM-only output for published packages -- no CommonJS
- Migrate ALL packages to tsup (not just publishable ones) for unified build tooling
- app-shared's CJS dual output is temporary (Strapi compatibility) -- don't over-invest in it; tsup can handle it simply but it gets removed during Strapi to Supabase migration
- Removes tsc-esm-fix dependency across all packages
- @openvaa npm org already exists on npmjs.com
- Public access -- anyone can `npm install @openvaa/core`
- Update Changesets config from `access: "restricted"` to `access: "public"`
- Automated publishing via CI -- configure NPM_TOKEN as GitHub secret, uncomment publish step in release workflow
- Merging a version PR automatically publishes to npm

### Claude's Discretion
- Exact tsup configuration (entry points, output format, dts generation)
- How to handle app-shared's temporary CJS output in tsup config
- Package.json `files` field contents (what to include/exclude in published tarball)
- Repository, homepage, bugs field values in package.json
- How to verify packages work in a fresh Node.js project (PUB-06)
- Whether to bundle dependencies or keep them as peer/external

### Deferred Ideas (OUT OF SCOPE)
- License review for the entire project (not just publishable packages) -- consider as future roadmap item
- Publishing additional packages beyond core/data/matching/filters (REL-02)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PUB-01 | `@openvaa` npm org is registered and configured | Already exists per CONTEXT.md; change Changesets access to "public" |
| PUB-02 | core, data, matching, filters have complete npm metadata (license, description, repository, files, publishConfig) | Package.json fields, MIT LICENSE file, `files` array, `publishConfig` with `access: "public"` |
| PUB-03 | `"private": true` removed from publishable packages | Direct package.json edit on 4 packages |
| PUB-04 | tsup replaces tsc + tsc-esm-fix for publishable package builds (ESM+CJS dual output) | tsup 8.x for ESM JS, tsc --emitDeclarationOnly for .d.ts; note: user locked ESM-only (not dual) despite REQUIREMENTS.md wording |
| PUB-05 | Published packages do not contain `workspace:^` protocol strings | `yarn pack --dry-run` verification; `yarn npm publish` resolves workspace: protocol; custom publish script needed |
| PUB-06 | Package installation verified in a fresh Node.js project | `yarn pack` tarballs installed in temp project via `npm install ./path-to-tarball.tgz` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsup | ^8.5.1 | TypeScript bundler for package JS output | De facto standard for TS library bundling; esbuild-powered; zero-config possible |
| typescript | ^5.7.3 | Declaration file generation via `--emitDeclarationOnly` | Already in use; tsup's dts has monorepo issues |
| @changesets/cli | ^2.30.0 | Version management and publish orchestration | Already configured in Phase 10 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| yarn (v4.6) | 4.6.0 | Package manager with `yarn npm publish` | Publishing -- resolves workspace: protocol correctly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsup | tsdown | Newer, faster, but less mature ecosystem; tsup is user's locked decision |
| tsup --dts | tsc --emitDeclarationOnly | tsup dts broken with monorepo project references; tsc is reliable |
| changeset publish | yarn workspaces foreach yarn npm publish | Changesets has unresolved Yarn workspace bug; custom script required |

**Installation:**
```bash
yarn add -D tsup -W
```
Note: tsup should be added as a root devDependency (shared across all packages via Yarn workspaces) OR per-package. Root install is cleaner for this monorepo since ALL packages use it.

## Architecture Patterns

### Recommended Build Setup Per Package

```
packages/core/
  src/index.ts          # Entry point (existing)
  tsup.config.ts        # tsup configuration
  tsconfig.json         # Keep for IDE + declaration generation
  tsconfig.build.json   # (optional) Separate config for dts if needed
  dist/                 # tsup output (replaces build/)
  LICENSE               # MIT license (new, publishable only)
  package.json          # Updated with npm metadata
```

### Pattern 1: Two-Step Build (tsup + tsc)
**What:** tsup handles JS bundling (fast, ESM output), tsc handles .d.ts generation (reliable with project references)
**When to use:** ALL packages in this monorepo
**Example:**
```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  // Do NOT use dts: true -- it has issues with monorepo project references
  // Type declarations are generated by tsc in a separate step
});
```

```json
// package.json build script
{
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly --outDir dist"
  }
}
```

### Pattern 2: app-shared Dual Output (Temporary)
**What:** app-shared needs CJS for Strapi compatibility
**When to use:** Only for app-shared, until Strapi is migrated to Supabase
**Example:**
```typescript
// packages/app-shared/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  clean: true,
});
```

### Pattern 3: Package.json for Publishable Packages
**What:** Complete npm metadata for public packages
**Example:**
```json
{
  "name": "@openvaa/core",
  "version": "0.1.0",
  "type": "module",
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
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  },
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly --outDir dist"
  }
}
```

### Pattern 4: Custom Publish Script for CI
**What:** Bypass Changesets' broken `npm publish` by using Yarn's `yarn npm publish`
**Why:** Changesets issue #432/#1454 -- `changeset publish` uses `npm publish` which does NOT resolve `workspace:^`
**Example:**
```yaml
# In .github/workflows/release.yml
- name: Create Release Pull Request or Publish
  uses: changesets/action@v1
  with:
    title: "chore: version packages"
    commit: "chore: version packages"
    publish: yarn release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

```json
// Root package.json
{
  "scripts": {
    "release": "yarn build && yarn workspaces foreach --no-private yarn npm publish --access public --tolerate-republish"
  }
}
```

### Pattern 5: Output Directory Migration (build/ to dist/)
**What:** Change output from `build/` to `dist/` (tsup convention)
**Why:** tsup defaults to `dist/`; `build/` was tsc convention
**Impact on:**
- `.gitignore` in each package: change `build/` to `dist/`
- `turbo.json`: already includes `dist/**` in outputs -- no change needed
- `tsconfig.json`: update `outDir` from `./build` to `./dist`
- `package.json` exports: update from `./build/` to `./dist/`

### Anti-Patterns to Avoid
- **Using `tsup --dts` in monorepo with project references:** Causes TS6307/TS6059 errors. Use tsc for declarations instead.
- **Using `changeset publish` with Yarn workspaces:** Publishes via `npm publish` which breaks `workspace:^` resolution. Use custom publish script.
- **Bundling workspace dependencies:** Keep `@openvaa/*` as external dependencies, not bundled into the output. tsup externalizes dependencies by default.
- **Manually editing versions to 1.0.0:** Let Changesets handle the version bump via a major changeset.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ESM extension fixing (.js imports) | tsc-esm-fix post-processing | tsup (handles ESM natively) | tsup uses esbuild which emits correct ESM |
| Workspace protocol stripping | Custom sed/awk on package.json | `yarn npm publish` / `yarn pack` | Yarn's beforeWorkspacePacking hook handles this automatically |
| Dual ESM/CJS output | Separate tsc configs (current app-shared approach) | tsup `format: ['esm', 'cjs']` | Single config, single command |
| Type declaration bundling | Manual .d.ts aggregation | tsc --emitDeclarationOnly | Reliable with project references |

**Key insight:** The tsc-esm-fix dependency exists solely because tsc doesn't add `.js` extensions to ESM imports. tsup eliminates this problem entirely since esbuild generates correct ESM output with proper import specifiers.

## Common Pitfalls

### Pitfall 1: Changesets + Yarn Workspace Protocol
**What goes wrong:** Published packages contain literal `workspace:^` strings instead of resolved version numbers
**Why it happens:** `changeset publish` calls `npm publish` internally, and npm doesn't understand Yarn's workspace: protocol
**How to avoid:** Use a custom publish script that calls `yarn npm publish` (or `yarn workspaces foreach ... yarn npm publish`)
**Warning signs:** After publishing, check the npm registry page -- if dependencies show `workspace:^`, the protocol was not resolved

### Pitfall 2: tsup --dts in Monorepo with Project References
**What goes wrong:** TS6307 "File is not under rootDir" or TS6059 errors when generating .d.ts files
**Why it happens:** tsup's dts generation doesn't support TypeScript's composite project references (open issue #647 since 2022)
**How to avoid:** Use two-step build: tsup for JS, tsc --emitDeclarationOnly for types
**Warning signs:** Build failures specifically in packages that depend on other workspace packages (data depends on core, filters depends on core+data)

### Pitfall 3: Forgetting to Remove `private: true`
**What goes wrong:** `yarn npm publish` silently skips the package or errors
**Why it happens:** Easy to forget when the package was private throughout development
**How to avoid:** Verification step checks each package.json for absence of `private: true`
**Warning signs:** Publish succeeds but package not visible on npm registry

### Pitfall 4: Output Directory Mismatch
**What goes wrong:** Turborepo cache misses, imports fail, package exports point to wrong files
**Why it happens:** Changing from `build/` to `dist/` requires updates in multiple places
**How to avoid:** Comprehensive checklist: package.json exports, tsconfig.json outDir, .gitignore, turbo.json outputs
**Warning signs:** `yarn build` succeeds but `import` fails at runtime; or Turborepo reports 0% cache hit rate

### Pitfall 5: Missing `files` Field in package.json
**What goes wrong:** Entire package directory gets published (including source, tests, configs)
**Why it happens:** Without `files` field, npm includes everything not in `.npmignore`
**How to avoid:** Always specify `"files": ["dist", "LICENSE"]` in publishable packages
**Warning signs:** `yarn pack --dry-run` shows unexpected files in tarball

### Pitfall 6: Dependency Externalization
**What goes wrong:** Bundled output includes dependency code, inflating package size and causing version conflicts
**Why it happens:** tsup bundles dependencies by default when they're not in `package.json` dependencies
**How to avoid:** Keep all `@openvaa/*` packages as `dependencies` (not devDependencies) in publishable packages; tsup externalizes packages listed in dependencies by default
**Warning signs:** Tarball size is unexpectedly large (MBs instead of KBs)

## Code Examples

### tsup.config.ts for ESM-Only Package (core, matching)
```typescript
// Source: tsup official docs + monorepo best practices
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // External: tsup auto-externalizes packages in dependencies
  // Do NOT use dts: true in monorepo with project references
});
```

### tsup.config.ts for app-shared (Dual ESM+CJS, Temporary)
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
});
```

### Updated package.json build script
```json
{
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly --outDir dist"
  }
}
```

### tsconfig.json adjustments for declaration-only output
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts"]
}
```
Note: `declarationMap` is already `true` in the shared base config. The `declaration` flag may need to be explicitly set since `tsc --emitDeclarationOnly` requires it.

### MIT LICENSE file content
```
MIT License

Copyright (c) 2024-2026 OpenVAA

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Verification: yarn pack tarball inspection
```bash
# Verify workspace protocol resolution
cd packages/core
yarn pack --dry-run
# Check output -- should not contain "workspace:" strings
# Then test tarball install:
yarn pack -o /tmp/openvaa-core.tgz
cd /tmp && mkdir test-install && cd test-install
npm init -y
npm install /tmp/openvaa-core.tgz
node -e "import('@openvaa/core').then(m => console.log('OK:', Object.keys(m).length, 'exports'))"
```

### Release workflow publish command
```yaml
publish: yarn release
```
```json
{
  "scripts": {
    "release": "yarn build && yarn workspaces foreach --no-private yarn npm publish --access public --tolerate-republish"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tsc + tsc-esm-fix | tsup (esbuild-powered) | 2023-2024 | Eliminates ESM extension fixing; faster builds |
| tsc for bundling | tsup for JS + tsc for .d.ts | 2024-2025 | Best of both: fast JS, reliable types |
| changeset publish | Custom yarn publish script | Workaround (2024+) | Required for Yarn workspace protocol support |
| Dual ESM+CJS default | ESM-only for libraries | 2024-2025 | Simpler config; Node 18+ and all modern bundlers support ESM |
| build/ directory | dist/ directory | Convention | tsup default; aligns with broader ecosystem |

**Deprecated/outdated:**
- `tsc-esm-fix`: No longer needed with tsup -- tsup generates correct ESM imports
- `changeset publish` with Yarn 4: Broken for workspace protocol; use custom publish script
- app-shared's dual tsc build (tsconfig.cjs.json + tsconfig.esm.json): Replaced by single tsup config with `format: ['esm', 'cjs']`

## Open Questions

1. **tsc --emitDeclarationOnly with tsBuildInfoFile**
   - What we know: Current tsconfigs specify `tsBuildInfoFile` in the build output dir. With tsup handling JS output, tsc only generates declarations.
   - What's unclear: Whether `composite: true` from the shared base config conflicts with `--emitDeclarationOnly`. May need `composite: false` or a separate tsconfig.build.json.
   - Recommendation: Test during implementation. If `tsc --emitDeclarationOnly` works with existing tsconfig, no change needed. If composite causes issues, create `tsconfig.build.json` that extends base but disables composite.

2. **yarn workspaces foreach exact syntax**
   - What we know: The command is `yarn workspaces foreach` but syntax varies between Yarn versions.
   - What's unclear: Yarn 4.6's exact flags for filtering private packages and controlling publish order.
   - Recommendation: Verify syntax with `yarn workspaces foreach --help` during implementation. May need `--topological` for dependency-ordered publishing.

3. **Experimental packages (llm, argument-condensation, question-info) tsup migration**
   - What we know: These packages also use tsc + tsc-esm-fix and need tsup migration (user decision: migrate ALL packages).
   - What's unclear: argument-condensation and question-info have custom post-build steps that copy prompt files. tsup may need `onSuccess` hooks or the copy steps remain separate.
   - Recommendation: Use tsup for JS bundling, keep prompt-copying as separate script step in build command.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.1.8 |
| Config file | Per-package `vitest.config.ts` (empty, workspace-level) |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PUB-01 | Changesets access set to public | manual | Check `.changeset/config.json` has `"access": "public"` | N/A |
| PUB-02 | npm metadata complete | smoke | `node -e "const p=require('./packages/core/package.json'); console.assert(p.license && p.description && p.repository && p.files && p.publishConfig)"` | Wave 0 |
| PUB-03 | private:true removed | smoke | `node -e "const p=require('./packages/core/package.json'); console.assert(!p.private)"` | Wave 0 |
| PUB-04 | tsup builds produce ESM output | smoke | `yarn workspace @openvaa/core build && ls packages/core/dist/index.js` | Wave 0 |
| PUB-05 | No workspace: strings in tarball | smoke | `cd packages/core && yarn pack --dry-run 2>&1` + grep for workspace: | Wave 0 |
| PUB-06 | Fresh install works | integration | Script: pack tarball, install in temp dir, import and verify exports | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/core build && yarn workspace @openvaa/core test:unit`
- **Per wave merge:** `yarn build && yarn test:unit`
- **Phase gate:** Full suite green + PUB-06 integration test passes

### Wave 0 Gaps
- [ ] Verification script for PUB-05 (tarball workspace: protocol check)
- [ ] Integration test script for PUB-06 (fresh install verification)
- [ ] Existing unit tests must pass with new tsup build output (regression check)

## Sources

### Primary (HIGH confidence)
- Yarn workspaces docs (https://yarnpkg.com/features/workspaces) - workspace: protocol resolution rules
- Yarn npm publish docs (https://yarnpkg.com/cli/npm/publish) - publishing behavior
- Turborepo publishing guide (https://turborepo.dev/docs/guides/publishing-libraries) - tsup + monorepo setup
- tsup GitHub issues #647, #929 (https://github.com/egoist/tsup/issues/647) - dts monorepo limitations

### Secondary (MEDIUM confidence)
- Changesets GitHub issue #432 (https://github.com/changesets/changesets/issues/432) - workspace protocol not resolved during publish
- Changesets GitHub issue #1454 (https://github.com/changesets/changesets/issues/1454) - yarn publishing broken
- Changesets action #246 (https://github.com/changesets/action/issues/246) - workspace:* not replaced
- PR #1449 and #1560 (unmerged as of March 2026) - confirm bug still exists
- changesets/action README (https://github.com/changesets/action) - custom publish command option
- cometkim/yarn-changeset-action (https://github.com/cometkim/yarn-changeset-action) - alternative action for Yarn

### Tertiary (LOW confidence)
- tsup maintenance status: search results suggest it's not actively maintained; tsdown recommended as successor. However, tsup 8.5.1 is stable and widely used. LOW concern for this project.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - tsup is well-established; existing project already uses tsc, Changesets, Yarn 4
- Architecture: HIGH - Two-step build pattern (tsup + tsc) is widely documented and proven
- Pitfalls: HIGH - Changesets workspace bug is well-documented across multiple GitHub issues; tsup dts issue is confirmed with 62 upvotes
- Workspace protocol: HIGH - Yarn docs explicitly document resolution rules for workspace:^ during packing/publishing
- Custom publish script: MEDIUM - Pattern used by multiple projects but exact `yarn workspaces foreach` syntax for Yarn 4.6 needs verification during implementation

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days -- stable domain, main risk is Changesets fixing the workspace bug)
