---
phase: 10-version-management
plan: 02
subsystem: infra
tags: [github-actions, changesets, release-workflow, ci-cd]

# Dependency graph
requires:
  - phase: 10-version-management plan 01
    provides: Changesets CLI and .changeset/config.json with changelog-github plugin
provides:
  - GitHub Actions release workflow that creates automated version PRs via changesets/action
  - Disabled npm publish step ready for Phase 11 activation
affects: [11-package-publishing]

# Tech tracking
tech-stack:
  added: [changesets/action@v1]
  patterns: [concurrency serialization for release workflows, explicit GitHub token permissions]

key-files:
  created:
    - .github/workflows/release.yml
  modified: []

key-decisions:
  - "Publish step commented out with Phase 11 note (per user decision)"
  - "Changeset-bot installation deferred (user skipped manual step)"
  - "Concurrency key added to serialize workflow runs and prevent race conditions"

patterns-established:
  - "Release workflow pattern: checkout -> yarn setup -> node setup -> install -> changesets/action"
  - "Workflow permissions explicitly declared (contents:write, pull-requests:write)"

requirements-completed: [VER-03, VER-05]

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 10 Plan 02: Release Workflow Summary

**GitHub Actions release workflow using changesets/action@v1 with concurrency control and disabled publish step**

## Performance

- **Duration:** 3 min (across two sessions with checkpoint pause)
- **Started:** 2026-03-13T11:13:43Z
- **Completed:** 2026-03-13T11:17:00Z
- **Tasks:** 1 completed, 1 deferred
- **Files modified:** 1

## Accomplishments
- Created `.github/workflows/release.yml` that triggers on push to main and creates "Version Packages" PRs
- Workflow uses `changesets/action@v1` with concurrency serialization and explicit permissions
- npm publish step included but commented out, ready for Phase 11 activation
- Node/Yarn versions match existing CI workflow (Node 20.18.1, Yarn 4.6)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create release workflow with disabled publish step** - `5d1cba913` (feat)
2. **Task 2: Install changeset-bot GitHub App** - DEFERRED (user skipped)

## Files Created/Modified
- `.github/workflows/release.yml` - Release workflow that creates version PRs on push to main

## Decisions Made
- **Publish step commented out:** The `publish: yarn changeset publish` line is present but commented with a "Phase 11" note, per user decision to build but disable npm publishing initially
- **Changeset-bot deferred:** User chose to skip the manual changeset-bot GitHub App installation step; this can be done by an org admin at any time by visiting https://github.com/apps/changeset-bot
- **Concurrency control:** Added `concurrency` key to serialize workflow runs when multiple PRs merge quickly

## Deviations from Plan

None - plan executed exactly as written. Task 2 was a checkpoint:human-action that the user explicitly chose to skip/defer.

## Deferred Items

### Changeset-bot GitHub App Installation (Task 2)
- **Requirement:** VER-04
- **Status:** Deferred by user choice ("skip")
- **Action needed:** A repository/organization admin must visit https://github.com/apps/changeset-bot, install it, and select the repository
- **Impact:** PRs will not receive automated reminders about missing changesets until the bot is installed. This is non-blocking -- the release workflow functions independently of the bot.

## Issues Encountered
None

## User Setup Required

The changeset-bot GitHub App installation was deferred. When ready:
1. Visit https://github.com/apps/changeset-bot
2. Click "Install"
3. Select the `OpenVAA/voting-advice-application` repository
4. Authorize the app
5. Verify by opening a PR without a changeset -- the bot should comment

## Next Phase Readiness
- Release workflow is in place, ready to create version PRs when changesets merge to main
- Phase 11 can activate npm publishing by uncommenting the publish step in the workflow
- VER-04 (changeset-bot) remains pending until an admin installs the GitHub App

## Self-Check: PASSED

- FOUND: .github/workflows/release.yml
- FOUND: 10-02-SUMMARY.md
- FOUND: commit 5d1cba913

---
*Phase: 10-version-management*
*Completed: 2026-03-13*
