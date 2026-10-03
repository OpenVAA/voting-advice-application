---
title: "`release.yml` and `docs.yml` changed in Phase 169 but cannot run outside `main`: watch their first run after the merge"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: medium
suggested_phase: post-v2.15-ship (first push to main)
keywords: [github-actions, release, changesets-action-v2, docs, pages, ci, unobservable, D-10]
re_check_trigger: "the first push to main after the merge; then one manual workflow_dispatch of docs.yml"
---

# Two workflows unobservable until merge (169-11)

Neither triggers on `ci-evidence/**`: `release.yml` runs on push to `main`; `docs.yml` on push to `main` under
`apps/docs/**` or by manual dispatch. Every other workflow change of the phase was observed green in CI (run
37144076939, 12/12).

## `release.yml`

checkout v7, setup-node v7 (no dummy `NODE_AUTH_TOKEN` any more), `changesets/action` v2 with the `github-token`
input, the renamed inputs (`pr-title`, `commit-message`, `publish-script`) and `push-with-git-cli: true`. On the first
`main` push check:

1. the step runs `changeset version` (or skips it when there are no changesets) without the "GITHUB_TOKEN environment
   variable is set and does not match" warning;
2. a release PR, if one is due, is opened and pushed as before; a publish, if due, carries provenance.

Note: `changeset version` (Changesets 3) exits 1 when there is nothing to release; the action calls it only when
changesets exist.

Optional pre-merge rehearsal (169-REVIEW IN-08): run `release.yml` once on `workflow_dispatch` in a fork, or with
`publish-script` stubbed to `changeset status`, so the action v2 + Changesets 3 combination is observed before `main`.
Publishing auth is still unresolved: `release.yml` sets no `NODE_AUTH_TOKEN` and relies on npm trusted publishing,
which is deferred until after the first publish.

## `docs.yml`

checkout v7, setup-node v7, `configure-pages` v6, `upload-pages-artifact` v5 (dotfiles excluded) and `deploy-pages` v5.
Dispatch it once by hand after the merge and check the deployed docs site loads.
