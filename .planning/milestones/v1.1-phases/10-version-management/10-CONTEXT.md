# Phase 10: Version Management - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up Changesets for automated version management across all workspace packages and apps. Includes CLI tooling for declaring version bumps, GitHub Action for automated version PRs, changeset bot for PR reminders, per-package changelogs with PR links, and a disabled-but-present npm publish step. This phase does NOT cover npm org setup, package metadata, tsup migration, or actual publishing (Phase 11).

</domain>

<decisions>
## Implementation Decisions

### Initial version numbers
- Keep packages at current 0.1.0 — do NOT bump to 0.2.0 in this phase
- First real PR with a changeset will organically trigger the first version bump
- Independent versioning per package (not fixed/locked across all packages)
- Dependent packages get automatic patch bumps when upstream changes (e.g., core bump → data/matching/filters patch bump)

### Changeset scope
- Track ALL packages and apps (all 9 packages + 3 apps)
- Apps and internal packages are private but still get version bumps and changelogs
- Version-bump everything consistently — no separate treatment for private packages
- Add `yarn changeset` convenience script to root package.json
- CLI flow: Claude's discretion on interactive picker vs manual specification

### Bot behavior
- Use the official @changesets/bot GitHub App (not a custom action)
- Bot comments as a reminder on PRs without changesets — non-blocking
- Automated "Version Packages" PR requires manual review before merge (no auto-merge)
- npm publish step in release workflow: commented-out with a note "Uncomment when ready to publish (Phase 11)"

### Changelog style
- Audience: developers using the libraries — technical language, API-focused
- Categorized format using Changesets defaults (### Minor Changes, ### Patch Changes)
- Include PR links via @changesets/changelog-github plugin
- Per-package CHANGELOG.md only — no root-level aggregate changelog

### Claude's Discretion
- Exact .changeset/config.json configuration details
- How to configure linked/dependent package bump groups
- GitHub Action workflow structure and triggers
- Whether to add changeset validation to existing CI workflow or keep separate

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Turborepo already configured (turbo.json) — Changesets works alongside, not in conflict
- Yarn 4.6 workspaces with `workspace:^` protocol — Changesets understands workspace protocol
- Existing GitHub Actions CI at `.github/workflows/main.yaml` — reference for workflow patterns

### Established Patterns
- Root package.json has convenience scripts for all dev commands (build, test, lint, format)
- CI uses `yarn install --frozen-lockfile` and `yarn build` as standard steps
- Husky already set up (`"prepare": "husky"` in root package.json) — could integrate changeset checks

### Integration Points
- Root `package.json` — add `changeset` script and `@changesets/cli` dependency
- `.changeset/config.json` — new config file for Changesets
- `.github/workflows/` — new workflow for version PR automation
- @changesets/bot — GitHub App installation (manual step, documented in plan)
- @changesets/changelog-github — dependency for PR-linked changelogs

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard Changesets conventions and best practices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-version-management*
*Context gathered: 2026-03-13*
