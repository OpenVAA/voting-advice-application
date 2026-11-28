---
title: "Widen `.github/dependabot.yml` to the whole monorepo once v2.15 is on `main`"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: medium
suggested_phase: post-v2.15-ship
keywords: [dependabot, renovate, monorepo, grouped-updates, security-updates, D-31]
re_check_trigger: "v2.15 merged to main"
---

# Dependabot watches one directory of the old layout

## State (unchanged by Phase 169, D-31)

`.github/dependabot.yml` has two entries, both `open-pull-requests-limit: 0` (security updates only) and
`target-branch: "main"`: `npm` at `/apps/frontend`, and `github-actions` at `/`. `git diff --exit-code
5ed82f437..HEAD -- .github/dependabot.yml` exits 0 at the end of the phase. Before v2.15 merges, Dependabot resolves
against the pre-v2 `main`, so widening it now would only add alerts for manifests this branch does not have.

## What to do after the merge

1. Replace the single npm `directory` with `directories:` covering `/`, `/apps/*` and `/packages/*` (Yarn workspaces
   share one lockfile at the root, so `/` alone may be enough for security updates; check what Dependabot reports).
2. Add `groups:` so related bumps arrive together (for example Svelte/Kit/Vite, Vitest, the AI SDK, ESLint and its
   plugins, Supabase), and decide whether version updates (not just security) should open PRs.
3. Keep the GitHub Actions entry; consider grouping it too.
4. Alternatively evaluate Renovate, which understands Yarn catalogs and the age rule (`minimumReleaseAge`) natively.
5. Then do the reconciliation in `2026-09-03-dependabot-alert-list-is-stale-against-main.md`.
