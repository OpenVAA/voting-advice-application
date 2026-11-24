# Workflows

The project uses GitHub Actions to check every change. If a check fails, read its log, fix the problem and push the fix before asking for a review.

## Main tests and validation

The [`main.yaml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/main.yaml) workflow runs on pull requests to `main` and on pushes to `main` (and to `ci-evidence/**` branches), unless the change only touches Markdown or `.env.example` files. Its jobs run in parallel:

| Job                                     | What it checks                                                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend-and-shared-module-validation` | Builds the packages, then runs `yarn format:check`, `yarn typecheck`, `yarn lint:check` and `yarn test:unit`, type-checks the frontend with svelte-check and builds it  |
| `docker-image-build`                    | Builds the production image of the frontend from `apps/frontend/Dockerfile`, without pushing it                                                                         |
| `infra-validate`                        | Validates every Terraform root under `infra/` without credentials, runs each module's `terraform test` and plans the example and bootstrap roots against mock providers |
| `supabase-tests`                        | Runs the pgTAP database tests, when `apps/supabase` or `packages/supabase-types` changed                                                                                |
| `sql-lint`                              | Runs `yarn db:lint:sql` against a local Supabase                                                                                                                        |
| `supabase-types-drift`                  | Regenerates the Supabase types with `yarn db:types` and fails if they differ from the committed ones                                                                    |
| `dev-seed-integration`                  | Runs the `@openvaa/dev-seed` tests against a local Supabase                                                                                                             |
| `e2e-tests`                             | Runs the Playwright end-to-end tests with `tests/scripts/e2e-run.sh`                                                                                                    |
| `e2e-visual`                            | Runs the visual regression tests                                                                                                                                        |
| `dependency-audit`                      | Runs `yarn audit:deps`, which fails on a high or critical advisory that is not in the accepted baseline                                                                 |
| `secret-scan`                           | Scans the new commits for committed secrets                                                                                                                             |
| `skill-drift-check`                     | Fails when the code a Claude Code skill in `.claude/skills` covers has changed since the skill was last updated                                                         |
| `node-engine-range-negative-control`    | Checks that the Node version guard rejects a Node version outside `engines` and accepts one inside it                                                                   |

See [Testing](/developers-guide/development/testing) for running the same tests locally.

## Other workflows

- [`docs.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/docs.yml) builds and deploys this documentation site when a push to `main` changes `apps/docs/**`. See [About these docs](/developers-guide/about-these-docs).
- [`release.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/release.yml) runs on pushes to `main` and uses [Changesets](https://github.com/changesets/changesets) to open a release pull request or publish the packages.
- [`infra-plan.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/infra-plan.yml) runs on pull requests that touch `infra/**`. For a pull request from this repository it plans the AWS root of every deployment the repository owns, each with that deployment's read-only role, and prints the plan. The credential-free Terraform checks, including the mock-provider plans of the example roots and the bootstrap root, are the `infra-validate` job of `main.yaml`. See [Deployment](/developers-guide/deployment).
- [`deploy.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/deploy.yml) deploys a commit to staging on a push to `deploy/staging`, after a reviewer approves its `staging` environment. See [Deployment operations](/developers-guide/deployment/operations).
- [`destroy.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/destroy.yml) destroys the staging AWS stack, after two approvals, and leaves the Supabase project untouched. See [Deployment operations](/developers-guide/deployment/operations).
