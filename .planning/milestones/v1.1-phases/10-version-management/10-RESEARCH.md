# Phase 10: Version Management - Research

**Researched:** 2026-03-13
**Domain:** Monorepo version management with Changesets
**Confidence:** HIGH

## Summary

Changesets is the standard tool for explicit-intent version management in JavaScript/TypeScript monorepos. It integrates cleanly with Yarn 4 workspaces and Turborepo, which are already in use in this project. The ecosystem consists of three parts: the CLI (`@changesets/cli`) for local developer workflow, the GitHub Action (`changesets/action@v1`) for automated version PRs, and the changeset-bot GitHub App for PR reminders.

The OpenVAA monorepo has 13 workspace packages (9 packages + 3 apps + 1 Strapi plugin), all currently at version `0.1.0` and all marked `"private": true` (except the Strapi plugin which has no explicit `private` field). Since all packages are private, the `privatePackages` config option is critical -- it must be set to `{ "version": true, "tag": false }` to ensure private packages get versioned and receive changelogs. The `workspace:^` protocol used for internal dependencies is natively understood by Changesets via the `updateInternalDependencies` config option.

**Primary recommendation:** Install `@changesets/cli` and `@changesets/changelog-github`, run `changeset init`, customize `config.json` for independent versioning with patch-level internal dependency bumps, create a release workflow at `.github/workflows/release.yml`, and document the changeset-bot GitHub App installation as a manual step.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Keep packages at current 0.1.0 -- do NOT bump to 0.2.0 in this phase
- First real PR with a changeset will organically trigger the first version bump
- Independent versioning per package (not fixed/locked across all packages)
- Dependent packages get automatic patch bumps when upstream changes (e.g., core bump -> data/matching/filters patch bump)
- Track ALL packages and apps (all 9 packages + 3 apps)
- Apps and internal packages are private but still get version bumps and changelogs
- Version-bump everything consistently -- no separate treatment for private packages
- Add `yarn changeset` convenience script to root package.json
- Use the official @changesets/bot GitHub App (not a custom action)
- Bot comments as a reminder on PRs without changesets -- non-blocking
- Automated "Version Packages" PR requires manual review before merge (no auto-merge)
- npm publish step in release workflow: commented-out with a note "Uncomment when ready to publish (Phase 11)"
- Audience: developers using the libraries -- technical language, API-focused
- Categorized format using Changesets defaults (### Minor Changes, ### Patch Changes)
- Include PR links via @changesets/changelog-github plugin
- Per-package CHANGELOG.md only -- no root-level aggregate changelog

### Claude's Discretion
- Exact .changeset/config.json configuration details
- How to configure linked/dependent package bump groups
- GitHub Action workflow structure and triggers
- Whether to add changeset validation to existing CI workflow or keep separate

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VER-01 | Changesets CLI is installed and configured with `.changeset/config.json` | Standard Stack section provides exact packages, versions, and config.json structure |
| VER-02 | Per-package CHANGELOG.md files are generated from changeset descriptions | Architecture Patterns section covers changelog-github plugin setup and config |
| VER-03 | GitHub Action creates automated version PRs on changeset merge | Code Examples section provides complete release.yml workflow |
| VER-04 | Changeset bot comments on PRs missing changesets | Architecture Patterns section documents bot installation (manual step) |
| VER-05 | npm publishing step exists in pipeline but can be easily disabled/enabled | Code Examples section shows commented-out publish step pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@changesets/cli` | 2.30.0 | CLI for declaring version bump intents, running `version` and `publish` commands | The de facto standard for monorepo versioning; used by Turborepo, Next.js, Radix, Mantine |
| `@changesets/changelog-github` | 0.6.0 | Changelog formatter that includes PR links and GitHub usernames | Official plugin, required for PR-linked changelogs per user decision |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `changesets/action` | v1 (1.7.0) | GitHub Action for automated version PRs and publish | In `.github/workflows/release.yml` |
| `changeset-bot` | GitHub App | Comments on PRs missing changesets | Install from https://github.com/apps/changeset-bot |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Changesets | semantic-release | Poor monorepo support, commit-message-driven vs explicit-intent (already out of scope per REQUIREMENTS.md) |
| @changesets/changelog-github | @changesets/cli/changelog (default) | Default has no PR links -- user locked in changelog-github |

**Installation:**
```bash
yarn add -D @changesets/cli @changesets/changelog-github
```

## Architecture Patterns

### Recommended File Structure
```
.changeset/
  config.json              # Changesets configuration
  README.md                # Auto-generated by `changeset init`
  *.md                     # Individual changeset files (temporary, consumed by `version`)
.github/
  workflows/
    release.yml            # NEW: Version PR + publish workflow
    main.yaml              # EXISTING: CI validation (unchanged)
packages/*/CHANGELOG.md    # Generated per-package changelogs
apps/*/CHANGELOG.md        # Generated per-app changelogs
```

### Pattern 1: Changesets Config for Independent Versioning
**What:** Configure `.changeset/config.json` for independent package versioning with automatic downstream patch bumps.
**When to use:** Always -- this is the single source of truth for Changesets behavior.

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "OpenVAA/voting-advice-application" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "privatePackages": { "version": true, "tag": false },
  "ignore": []
}
```

**Key config decisions:**
- `"fixed": []` -- no fixed groups; independent versioning per user decision
- `"linked": []` -- no linked groups; packages version independently
- `"updateInternalDependencies": "patch"` -- when `@openvaa/core` bumps, `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters` automatically get a patch bump (per user decision)
- `"privatePackages": { "version": true, "tag": false }` -- CRITICAL: all packages are currently `private: true`, so this must be enabled or Changesets will skip them entirely. Tags disabled since we are not publishing yet
- `"access": "restricted"` -- appropriate since all packages are private; Phase 11 will change to `"public"` for publishable packages
- `"commit": false` -- version command does not auto-commit; the GitHub Action handles commits
- `"baseBranch": "main"` -- matches the project's main branch

### Pattern 2: Developer Workflow
**What:** How developers create changesets during feature development.
**When to use:** Every PR that changes package behavior.

1. Developer makes changes to packages
2. Runs `yarn changeset` (interactive CLI)
3. Selects affected packages from picker
4. Chooses bump type (patch/minor/major)
5. Writes human-readable description
6. Commits the generated `.changeset/*.md` file with PR
7. Changeset-bot confirms the PR has a changeset

### Pattern 3: Release Workflow
**What:** Automated flow when changesets merge to main.
**When to use:** Happens automatically via GitHub Actions.

1. PR with changeset files merges to `main`
2. GitHub Action detects pending changesets
3. Action creates/updates a "Version Packages" PR that:
   - Runs `changeset version` (consumes changeset files, bumps versions, generates changelogs)
   - Updates `package.json` versions for affected packages
   - Updates internal dependency versions (`workspace:^` aware)
   - Generates/updates per-package `CHANGELOG.md` files
4. Maintainer reviews and merges the Version Packages PR
5. (Phase 11) Publish step would run after merge

### Pattern 4: Changeset Bot (Manual Installation)
**What:** GitHub App that comments on PRs missing changesets.
**When to use:** One-time installation per repository.

Installation steps (documented in plan, executed manually by repo admin):
1. Visit https://github.com/apps/changeset-bot
2. Click "Install"
3. Select the `OpenVAA/voting-advice-application` repository
4. Authorize the app

The bot is non-blocking -- it reminds but does not prevent merge. It also provides a convenience link to create a changeset directly in the GitHub UI.

### Anti-Patterns to Avoid
- **Using `fixed` groups for all packages:** Would force all packages to share a version number, defeating independent versioning
- **Setting `commit: true`:** Would auto-commit version changes locally, conflicting with the GitHub Action PR workflow
- **Adding changesets to the `ignore` list:** Would silently skip packages, causing confusion
- **Using `"access": "public"` before Phase 11:** Would cause publish errors since npm org is not set up yet
- **Omitting `privatePackages` config:** With default `{ version: true, tag: false }` this actually works, but being explicit prevents confusion

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version bumping | Custom script to update package.json versions | `changeset version` | Handles dependency graph, workspace protocol, changelog generation |
| Changelog generation | Custom git-log-to-changelog script | `@changesets/changelog-github` | Handles PR links, user attribution, categorized output |
| PR reminders | Custom GitHub Action to check for version changes | `changeset-bot` GitHub App | Official, maintained, includes convenience links |
| Automated version PRs | Custom GitHub Action with manual version bumps | `changesets/action@v1` | Handles PR creation/update, git user setup, concurrency |

**Key insight:** The Changesets ecosystem is tightly integrated -- the CLI, GitHub Action, changelog plugin, and bot are all designed to work together. Using any piece in isolation or hand-rolling replacements breaks the workflow chain.

## Common Pitfalls

### Pitfall 1: Missing `privatePackages` Configuration
**What goes wrong:** Changesets skips version bumps for private packages, producing no changelogs or version updates.
**Why it happens:** All OpenVAA packages have `"private": true`. The default `privatePackages` config does version them, but some older Changesets versions behaved differently.
**How to avoid:** Explicitly set `"privatePackages": { "version": true, "tag": false }` in config.
**Warning signs:** Running `changeset version` produces no changes despite pending changesets.

### Pitfall 2: Yarn 4 + npm Publish Conflict
**What goes wrong:** `changeset publish` uses `npm publish` internally, which does not resolve `workspace:^` protocol strings. Published packages contain literal `workspace:^` in their dependency versions.
**Why it happens:** Changesets defaults to npm for publishing; Yarn's `yarn npm publish` handles workspace protocol replacement, but `npm publish` does not.
**How to avoid:** In Phase 11, use `yarn changeset publish` or configure a custom publish command. For Phase 10 this is not an issue since publishing is disabled.
**Warning signs:** Published package.json contains `"@openvaa/core": "workspace:^"` instead of an actual version.

### Pitfall 3: GITHUB_TOKEN Permissions Too Restrictive
**What goes wrong:** The release workflow fails to create PRs or push commits.
**Why it happens:** Default GITHUB_TOKEN permissions may not include `contents: write` and `pull-requests: write`.
**How to avoid:** Explicitly set permissions in the workflow YAML at the job level.
**Warning signs:** 403 errors in the workflow logs when trying to create a PR.

### Pitfall 4: Missing `@changesets/changelog-github` GITHUB_TOKEN
**What goes wrong:** Changelog generation fails or produces changelogs without PR links.
**Why it happens:** The `@changesets/changelog-github` plugin needs a GITHUB_TOKEN to look up PR numbers and usernames via the GitHub API.
**How to avoid:** Pass `GITHUB_TOKEN` as an env variable to the changesets/action step.
**Warning signs:** Changelog entries show commit hashes instead of PR links, or the version step fails with API errors.

### Pitfall 5: Strapi Plugin Not in Workspaces List
**What goes wrong:** `@openvaa/strapi-admin-tools` is not detected by Changesets.
**Why it happens:** It lives at `apps/strapi/src/plugins/openvaa-admin-tools/` which is a nested workspace path.
**How to avoid:** Verify that `"apps/strapi/src/plugins/*"` is in the root `package.json` workspaces array (it already is).
**Warning signs:** The plugin does not appear in the `yarn changeset` interactive picker.

### Pitfall 6: Concurrent Release Workflow Runs
**What goes wrong:** Two version PRs created simultaneously, race conditions in version bumps.
**Why it happens:** Multiple PRs merge to main in quick succession.
**How to avoid:** Add `concurrency` key to the release workflow to serialize runs.
**Warning signs:** Multiple "Version Packages" PRs open at the same time.

## Code Examples

Verified patterns from official sources:

### Complete `.changeset/config.json`
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "OpenVAA/voting-advice-application" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "privatePackages": { "version": true, "tag": false },
  "ignore": []
}
```

### Complete `.github/workflows/release.yml`
```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Version Packages
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4

      - name: Setup Yarn 4.6
        uses: threeal/setup-yarn-action@v2
        with:
          version: 4.6

      - name: Setup Node.js 20.18.1
        uses: actions/setup-node@v4
        with:
          node-version: 20.18.1
          cache: "yarn"

      - name: Install Dependencies
        run: yarn install --frozen-lockfile

      - name: Create Release Pull Request
        uses: changesets/action@v1
        with:
          title: "chore: version packages"
          commit: "chore: version packages"
          # Uncomment when ready to publish (Phase 11)
          # publish: yarn changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Root `package.json` Script Addition
```json
{
  "scripts": {
    "changeset": "changeset"
  }
}
```

### Example Changeset File (`.changeset/cool-tigers-dance.md`)
```markdown
---
"@openvaa/matching": minor
"@openvaa/core": patch
---

Add directional distance metric option to Manhattan matching algorithm.
Fixes edge case where MISSING_VALUE answers were counted as zero distance.
```

### Example Generated CHANGELOG.md
```markdown
# @openvaa/matching

## 0.2.0

### Minor Changes

- Add directional distance metric option to Manhattan matching algorithm. ([#142](https://github.com/OpenVAA/voting-advice-application/pull/142)) by [@contributor](https://github.com/contributor)

### Patch Changes

- Updated dependencies
  - @openvaa/core@0.1.1
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lerna version management | Changesets | ~2021 | Changesets is explicit-intent vs commit-message-driven |
| `@changesets/cli/changelog` (default) | `@changesets/changelog-github` | Available since 2020 | PR links and author attribution in changelogs |
| `npm publish` for Yarn workspaces | `yarn npm publish` | Yarn 2+ | Resolves `workspace:^` protocol before publishing |
| Manual version PRs | `changesets/action@v1` | v1.7.0 current | Automated PR creation with concurrency control |

**Deprecated/outdated:**
- Lerna for version management: Now wraps Nx, effectively abandoned as standalone versioning tool
- `semantic-release` for monorepos: Poor workspace support, commit-driven rather than explicit-intent
- `changeset publish` without Yarn awareness: Must use `yarn changeset publish` for workspace protocol resolution (Phase 11 concern)

## Open Questions

1. **Changesets `$schema` version alignment**
   - What we know: The `$schema` URL contains a version number (e.g., `@changesets/config@3.1.1`). This should match the installed `@changesets/config` version, which is an internal dependency of `@changesets/cli`.
   - What's unclear: The exact version of `@changesets/config` bundled with `@changesets/cli@2.30.0`.
   - Recommendation: After installing, check `node_modules/@changesets/config/package.json` for the version and update the schema URL accordingly. Alternatively, omit `$schema` -- it is optional.

2. **Changeset-bot GitHub App access for the OpenVAA org**
   - What we know: The bot must be installed from https://github.com/apps/changeset-bot by an organization admin.
   - What's unclear: Whether the current user has org admin permissions.
   - Recommendation: Document the installation step clearly in the plan as a manual action; provide the exact URL and steps.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation (no automated tests for CI/CD infrastructure) |
| Config file | N/A |
| Quick run command | `yarn changeset status` |
| Full suite command | `yarn changeset status && git diff --stat` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VER-01 | Changesets CLI installed and config exists | smoke | `test -f .changeset/config.json && yarn changeset status` | N/A |
| VER-02 | Per-package CHANGELOGs generated | manual | Create test changeset, run `yarn changeset version`, inspect CHANGELOG.md | N/A |
| VER-03 | GitHub Action creates version PRs | manual | Push changeset to main, observe workflow run | N/A |
| VER-04 | Bot comments on PRs without changesets | manual | Open a PR without a changeset, observe bot comment | N/A |
| VER-05 | Publish step exists but disabled | smoke | `grep -q "# publish:" .github/workflows/release.yml` | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn changeset status` (verifies config is valid)
- **Per wave merge:** Full validation checklist (config + workflow file review)
- **Phase gate:** Manual verification of VER-01 through VER-05

### Wave 0 Gaps
None -- this phase creates infrastructure (config files, workflow YAML) rather than testable application code. Validation is via file existence checks and manual workflow observation.

## Sources

### Primary (HIGH confidence)
- [changesets/action GitHub repo](https://github.com/changesets/action) - Full action inputs/outputs, workflow YAML examples, authentication requirements
- [npm: @changesets/cli@2.30.0](https://www.npmjs.com/package/@changesets/cli) - Current version verified via `npm view`
- [npm: @changesets/changelog-github@0.6.0](https://www.npmjs.com/package/@changesets/changelog-github) - Current version verified via `npm view`
- [DeepWiki: changesets GitHub Actions integration](https://deepwiki.com/changesets/changesets/9.1-github-actions-integration) - Comprehensive workflow patterns, permissions, caveats
- [changesets/changesets GitHub repo](https://github.com/changesets/changesets) - Config options, CLI commands, architecture

### Secondary (MEDIUM confidence)
- [changeset-bot GitHub App](https://github.com/apps/changeset-bot) - Installation flow
- [Changesets config-file-options.md](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md) - All config options documented
- [Changesets issue #432: workspace protocol](https://github.com/changesets/changesets/issues/432) - Yarn workspace:^ publishing caveats

### Tertiary (LOW confidence)
- Schema version (`@changesets/config@3.1.1`) -- needs verification after install

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified via npm, well-established ecosystem
- Architecture: HIGH - official documentation and examples, patterns verified across multiple sources
- Pitfalls: HIGH - documented in GitHub issues with known workarounds
- Config options: HIGH - cross-referenced between schema, docs, and examples

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable ecosystem, slow-moving)
