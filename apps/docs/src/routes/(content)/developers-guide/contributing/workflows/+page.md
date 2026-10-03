# Workflows

The project uses GitHub Actions to check every change. If a check fails, read its log, fix the problem and push the fix before asking for a review.

## Main tests and validation

The [`main.yaml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/main.yaml) workflow runs on pull requests to `main` and on pushes to `main` (and to `ci-evidence/**` branches), unless the change only touches Markdown or `.env.example` files. Its jobs run in parallel:

| Job                                     | What it checks                                                                                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend-and-shared-module-validation` | Builds the packages, then runs `yarn format:check`, `yarn typecheck`, `yarn lint:check` and `yarn test:unit`, type-checks the frontend with svelte-check and builds it |
| `docker-image-build`                    | Builds the production image of the frontend from `apps/frontend/Dockerfile`, without pushing it                                                                        |
| `supabase-tests`                        | Runs the pgTAP database tests, when `apps/supabase` or `packages/supabase-types` changed                                                                               |
| `sql-lint`                              | Runs `yarn db:lint:sql` against a local Supabase                                                                                                                       |
| `supabase-types-drift`                  | Regenerates the Supabase types with `yarn db:types` and fails if they differ from the committed ones                                                                   |
| `dev-seed-integration`                  | Runs the `@openvaa/dev-seed` tests against a local Supabase                                                                                                            |
| `e2e-tests`                             | Runs the Playwright end-to-end tests with `tests/scripts/e2e-run.sh`                                                                                                   |
| `e2e-visual`                            | Runs the visual regression tests                                                                                                                                       |
| `dependency-audit`                      | Runs `yarn audit:deps`, which fails on a high or critical advisory that is not in the accepted baseline                                                                |
| `secret-scan`                           | Scans the new commits for committed secrets                                                                                                                            |
| `skill-drift-check`                     | Fails when the code a Claude Code skill in `.claude/skills` covers has changed since the skill was last updated                                                        |
| `node-engine-range-negative-control`    | Checks that the Node version guard rejects a Node version outside `engines` and accepts one inside it                                                                  |

See [Testing](/developers-guide/development/testing) for running the same tests locally.

## Other workflows

- [`docs.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/docs.yml) builds and deploys this documentation site when a push to `main` changes `apps/docs/**`. See [About these docs](/developers-guide/about-these-docs).
- [`release.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/release.yml) runs on pushes to `main` and uses [Changesets](https://github.com/changesets/changesets) to open a release pull request or publish the packages.
- `claude.yml`, `claude-code-review.yml` and `claude-solve-issue.yml` run Claude on request; see [AI agents](/developers-guide/contributing/ai-agents).
