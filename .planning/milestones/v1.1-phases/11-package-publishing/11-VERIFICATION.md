---
phase: 11-package-publishing
verified: 2026-03-13T16:39:36Z
status: human_needed
score: 4/5 must-haves verified (SC-1 requires human confirmation)
human_verification:
  - test: "Confirm @openvaa npm org is active and configured for scoped publishing"
    expected: "npmjs.com/org/openvaa exists and the org owner can publish scoped packages under @openvaa/"
    why_human: "The npm registry returns {} (empty pkg list, not 404) for the org, and CONTEXT.md + RESEARCH.md record that the org already existed pre-phase. But packages are not yet published (registry returns Not found for @openvaa/core). Human must confirm the org account is accessible and has publishing rights before the release workflow will work end-to-end."
---

# Phase 11: Package Publishing Verification Report

**Phase Goal:** Core library packages are publishable to npm with correct metadata, builds, and dependency resolution
**Verified:** 2026-03-13T16:39:36Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `@openvaa` npm org exists and is configured for scoped package publishing | ? UNCERTAIN | npm /-/org/openvaa/package returns `{}` (not 404 — org exists but no packages yet); CONTEXT.md and RESEARCH.md record "already exists on npmjs.com". Packages not yet published (`@openvaa/core` returns 404 from npm). Human confirmation needed. |
| 2 | Running `yarn pack` on core, data, matching, filters produces tarballs with no `workspace:^` strings | VERIFIED | `yarn pack` on filters tarball confirmed: `{"@openvaa/core":"^0.1.0","@openvaa/data":"^0.1.0"}` — workspace protocol resolved to real semver. Tarball contains dist/ and LICENSE, no src/. |
| 3 | Each publishable package has complete npm metadata (license, description, repository, files, publishConfig) | VERIFIED | All 4 packages (core, data, matching, filters): license=MIT, description present, repository with directory, files=["dist","LICENSE"], publishConfig={access:"public"}, private removed. |
| 4 | A fresh Node.js project can `npm install` a packed tarball and import its exports without errors | VERIFIED | Plan 03 SUMMARY documents: "core: 14 exports, data: 68 exports, matching: 24 exports, filters: 21 exports" verified in temp dir. Task commit 445855719 exists in git. |
| 5 | Publishable packages produce ESM-only output via tsup (app-shared retains CJS for Strapi) | VERIFIED | All 8 tsup.config.ts files exist with correct format config. dist/index.js present for all 8 packages. app-shared has both dist/index.js (ESM) and dist/index.cjs (CJS). Core/data/matching/filters are ESM-only. |

**Score:** 4/5 truths verified (SC-1 needs human)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/tsup.config.ts` | tsup config for ESM-only build with `defineConfig` | VERIFIED | Contains `defineConfig`, `format: ['esm']`, `outDir: 'dist'` |
| `packages/app-shared/tsup.config.ts` | tsup config for dual ESM+CJS build | VERIFIED | Contains `format: ['esm', 'cjs']`, `outDir: 'dist'` |
| `packages/data/tsup.config.ts` | tsup config for ESM-only | VERIFIED | Exists with correct config |
| `packages/matching/tsup.config.ts` | tsup config for ESM-only | VERIFIED | Exists with correct config |
| `packages/filters/tsup.config.ts` | tsup config for ESM-only | VERIFIED | Exists with correct config |
| `packages/llm/tsup.config.ts` | tsup config for ESM-only | VERIFIED | Exists with correct config |
| `packages/argument-condensation/tsup.config.ts` | tsup config for ESM-only | VERIFIED | Exists with correct config |
| `packages/question-info/tsup.config.ts` | tsup config for ESM-only | VERIFIED | Exists with correct config |
| `packages/core/LICENSE` | MIT license text | VERIFIED | Contains "MIT License" |
| `packages/data/LICENSE` | MIT license text | VERIFIED | Present |
| `packages/matching/LICENSE` | MIT license text | VERIFIED | Present |
| `packages/filters/LICENSE` | MIT license text | VERIFIED | Present |
| `packages/core/package.json` | Complete npm metadata with publishConfig | VERIFIED | license, description, repository, files, publishConfig, nested exports with types condition |
| `packages/data/package.json` | Complete npm metadata | VERIFIED | All required fields present |
| `packages/matching/package.json` | Complete npm metadata | VERIFIED | All required fields present |
| `packages/filters/package.json` | Complete npm metadata | VERIFIED | All required fields present |
| `.changeset/config.json` | `"access": "public"` | VERIFIED | `access: "public"` confirmed |
| `.github/workflows/release.yml` | publish step with `yarn release`, NPM_TOKEN | VERIFIED | `publish: yarn release`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `registry-url: 'https://registry.npmjs.org'` all present |
| `package.json` (root) | `release` script | VERIFIED | `"release": "yarn build && yarn workspaces foreach --no-private yarn npm publish --access public --tolerate-republish"` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/*/package.json` | `packages/*/tsup.config.ts` | `build` script calls `tsup && tsc --emitDeclarationOnly` | WIRED | All 8 packages have `tsup && tsc --emitDeclarationOnly --outDir dist` in build script |
| `turbo.json` | `packages/*/tsup.config.ts` | `inputs` array includes `tsup.config.ts` | WIRED | `"tsup.config.ts"` confirmed in turbo.json build task inputs |
| `.github/workflows/release.yml` | `package.json` | publish command calls `yarn release` | WIRED | `publish: yarn release` in workflow, `release` script in root package.json |
| `package.json` release script | `packages/*/package.json` | `yarn workspaces foreach --no-private yarn npm publish` | WIRED | Command confirmed; `--no-private` filters to publishable packages; workspace:^ resolved at pack time (verified in tarball) |
| `.changeset/config.json` | `packages/*/package.json` | `access: public` matches `publishConfig.access` | WIRED | Both changeset config and all 4 publishable package.json have public access |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PUB-01 | 11-02-PLAN | `@openvaa` npm org is registered and configured | UNCERTAIN | CONTEXT.md records org pre-exists; npm registry /-/org/openvaa/package returns {} (org exists, no packages yet). Human confirmation needed for org access credentials. |
| PUB-02 | 11-02-PLAN | core, data, matching, filters have complete npm metadata | SATISFIED | All 4 packages verified: license, description, repository, files, publishConfig present in package.json |
| PUB-03 | 11-02-PLAN | `"private": true` removed from publishable packages | SATISFIED | All 4 publishable packages: `private: undefined` confirmed |
| PUB-04 | 11-01-PLAN | tsup replaces tsc + tsc-esm-fix for publishable package builds | SATISFIED | All 8 packages use `tsup && tsc --emitDeclarationOnly`; tsc-esm-fix absent from all package.json files |
| PUB-05 | 11-02-PLAN | Published packages do not contain `workspace:^` protocol strings | SATISFIED | filters tarball verified: deps resolved to `^0.1.0` (real semver), not `workspace:^` |
| PUB-06 | 11-03-PLAN | Package installation verified in a fresh Node.js project | SATISFIED | Plan 03 SUMMARY documents fresh install and import success for all 4 packages; 4 task commits verified in git |

**Orphaned requirements:** None. All PUB-01 through PUB-06 are covered by the three plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/core/README.md` | — | References `tsc-esm-fix` as current tooling | Info | Stale documentation only — tsc-esm-fix is not in any package.json; README has not been updated to reflect tsup migration |
| `packages/data/README.md` | — | References `tsc-esm-fix` as current tooling | Info | Same stale doc pattern |
| `packages/matching/README.md` | — | References `tsc-esm-fix` as current tooling | Info | Same stale doc pattern |
| `packages/filters/README.md` | — | References `tsc-esm-fix` as current tooling | Info | Same stale doc pattern |

All anti-patterns are informational only (stale documentation). None block the phase goal. The actual build tooling in package.json and tsup.config.ts files is correct.

### Human Verification Required

#### 1. Confirm @openvaa npm org is active and has publishing rights

**Test:** Log in to npmjs.com with the project's npm account. Navigate to npmjs.com/org/openvaa. Verify the org exists, is linked to an account with publishing rights, and can publish scoped packages under `@openvaa/`.

**Expected:** The org page shows the openvaa organization. The maintainer account has Owner or Member role. The `NPM_TOKEN` secret added to the GitHub repository corresponds to a token for this account with publish permissions.

**Why human:** The npm registry API confirms the org exists (returns `{}` for package list rather than an error), and CONTEXT.md records it as pre-existing. But the packages themselves are not yet published (404 from registry), and token/credential validation cannot be done programmatically. The release workflow will silently fail if NPM_TOKEN is not set in GitHub Secrets.

### Gaps Summary

No blocking gaps. All automated verifications passed. The one uncertain item (PUB-01) is partially verified: the @openvaa npm org exists on npmjs.com (registry confirms org is present) and Changesets is configured for public access. The remaining uncertainty is whether the NPM_TOKEN GitHub Secret is configured and has the correct permissions — this cannot be verified without running the release workflow or checking GitHub repository settings directly.

The stale README references to tsc-esm-fix are informational issues that should be addressed in a cleanup phase but do not block publishing.

---

_Verified: 2026-03-13T16:39:36Z_
_Verifier: Claude (gsd-verifier)_
