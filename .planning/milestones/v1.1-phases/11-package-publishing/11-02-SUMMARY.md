---
phase: 11-package-publishing
plan: 02
subsystem: infra
tags: [npm, publishing, license, changesets, ci, release-workflow]

# Dependency graph
requires:
  - phase: 11-package-publishing/01
    provides: tsup build pipeline with dist/ output for all packages
provides:
  - Complete npm metadata on 4 publishable packages (core, data, matching, filters)
  - MIT LICENSE files for all publishable packages
  - Public Changesets access configuration
  - Custom release script using yarn npm publish (resolves workspace:^ protocol)
  - Release workflow with NPM_TOKEN for automated npm publishing
affects: [11-03, npm-registry]

# Tech tracking
tech-stack:
  added: []
  patterns: [nested exports with types condition, publishConfig access public, yarn npm publish for workspace protocol resolution]

key-files:
  created:
    - packages/core/LICENSE
    - packages/data/LICENSE
    - packages/matching/LICENSE
    - packages/filters/LICENSE
  modified:
    - packages/core/package.json
    - packages/data/package.json
    - packages/matching/package.json
    - packages/filters/package.json
    - .changeset/config.json
    - .github/workflows/release.yml
    - package.json

key-decisions:
  - "Nested exports with types condition for proper TypeScript resolution in consuming projects"
  - "Release script uses yarn workspaces foreach --no-private yarn npm publish to resolve workspace:^ at pack time"
  - "Both NPM_TOKEN and NODE_AUTH_TOKEN set in release workflow for broad npm registry compatibility"

patterns-established:
  - "Package exports use nested import condition: { '.': { import: { types, default } } }"
  - "Publishable packages include files: ['dist', 'LICENSE'] to limit tarball contents"
  - "Custom release script bypasses changeset publish to use yarn npm publish (resolves workspace:^)"

requirements-completed: [PUB-01, PUB-02, PUB-03, PUB-05]

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 11 Plan 02: npm Metadata and Release Pipeline Summary

**MIT LICENSE, complete npm metadata on 4 publishable packages, and Changesets public release workflow using yarn npm publish for workspace:^ resolution**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T16:24:26Z
- **Completed:** 2026-03-13T16:27:38Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- All 4 publishable packages (core, data, matching, filters) have MIT LICENSE files and complete npm metadata
- private:true removed from all publishable packages, publishConfig set to public access
- Changesets access changed from restricted to public
- Release workflow configured with custom yarn release script, NPM_TOKEN, and registry-url
- Verified yarn pack resolves workspace:^ to real version numbers (e.g., ^0.1.0) in tarballs

## Task Commits

Each task was committed atomically:

1. **Task 1: Add npm metadata and LICENSE files to 4 publishable packages** - `d320dec03` (feat)
2. **Task 2: Configure Changesets public access and release workflow publishing** - `445855719` (feat)

## Files Created/Modified
- `packages/core/LICENSE` - MIT license for npm publishing
- `packages/data/LICENSE` - MIT license for npm publishing
- `packages/matching/LICENSE` - MIT license for npm publishing
- `packages/filters/LICENSE` - MIT license for npm publishing
- `packages/core/package.json` - Complete npm metadata (license, description, repository, files, publishConfig, nested exports)
- `packages/data/package.json` - Complete npm metadata with @openvaa/core dependency
- `packages/matching/package.json` - Complete npm metadata with @openvaa/core dependency
- `packages/filters/package.json` - Complete npm metadata with @openvaa/core and @openvaa/data dependencies
- `.changeset/config.json` - Changed access from restricted to public
- `.github/workflows/release.yml` - Added publish step with yarn release, NPM_TOKEN, NODE_AUTH_TOKEN, registry-url
- `package.json` - Added release script for yarn build + yarn npm publish pipeline

## Decisions Made
- Used nested exports with types condition (`{ ".": { "import": { "types": ..., "default": ... } } }`) for proper TypeScript resolution in consuming projects -- this is the recommended modern pattern for TypeScript packages
- Added both NPM_TOKEN and NODE_AUTH_TOKEN env vars to release workflow -- some npm configurations look for NODE_AUTH_TOKEN specifically
- Release script uses `yarn workspaces foreach --no-private yarn npm publish --access public --tolerate-republish` which resolves workspace:^ protocol at pack time (verified: workspace:^ becomes ^0.1.0 in tarballs)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. NPM_TOKEN secret must be configured in GitHub repository settings before the release workflow will publish.

## Next Phase Readiness
- All 4 publishable packages ready for npm publication with correct metadata and licensing
- Release workflow configured and ready to publish when Changesets creates version PRs
- Ready for 11-03 (final verification and documentation)
- NPM_TOKEN GitHub secret needs to be added to repository settings before first publish

## Self-Check: PASSED

All created files verified present. Both commits verified in git log (d320dec03, 445855719).

---
*Phase: 11-package-publishing*
*Completed: 2026-03-13*
