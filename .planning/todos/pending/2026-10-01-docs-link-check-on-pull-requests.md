---
created: 2026-10-02
title: The docs link check (validate:links --check) never runs on pull requests, so a frontend rename can break a generated Source link unseen
area: ci
severity: follow-up
source: Phase 168 (docs-site rewrite), orchestrator ruling 4 (Q1), filed by plan 168-08 as residue (D-04)
related_phase: 168
files:
  - .github/workflows/docs.yml (`on: push: branches: [main], paths: ["apps/docs/**"]` and `workflow_dispatch`)
  - .github/workflows/main.yaml (the `frontend-and-shared-module-validation` job runs `yarn lint:check`)
  - apps/docs/scripts/validate-links.ts (`--check`, `--only`, `--scope`; seven finding classes)
---

## Problem

`yarn workspace @openvaa/docs validate:links --check` is the gate that proves every link on the docs site resolves. It covers seven
classes, including `github-path`: the Source links on the generated component and route pages point at files under `apps/frontend/src`. Phase 168 made it exit 0 on the final tree (`gate-evidence/168-08-gates.md`). **No CI job runs it before a merge:**

- `docs.yml` ("Deploy Documentation") runs `generate:docs`, which ends in `validate-links`, but only on a **push to `main`** that touches
  `apps/docs/**`, or on a manual dispatch. It never runs on a pull request.
- `main.yaml` runs on pull requests to `main`, but none of its jobs runs `validate:links`. `yarn lint:check` covers docs lint, which is
  ESLint and Prettier, not links.
- `main.yaml` also ignores `**.md` (`paths-ignore`), and every docs page is a `+page.md`. A pull request that changes only docs pages
  therefore produces no `main.yaml` run at all. The pending todo `2026-09-14-markdown-only-changes-can-break-tests-but-never-trigger-ci.md`
  covers that wider gap.

**Consequence.** Suppose a pull request renames or moves a frontend component, or deletes a route, and touches nothing under
`apps/docs`. It merges green. The generated pages keep a Source link to the old path. Because the push touched no `apps/docs/**`
path, `docs.yml` does not run either. The broken link surfaces only at the next docs push or the next manual `generate:docs`, and
then as a failure in an unrelated change.

## Options (operator decision)

1. **Add the check to `main.yaml`'s lint job.** Add a step running `yarn workspace @openvaa/docs validate:links --check` after
   `yarn lint:check` in `frontend-and-shared-module-validation`. The checker reads the source tree; whether it needs a prior `yarn build` in CI is
   unmeasured, so check it when wiring the step (the job already builds earlier). It runs on every non-markdown pull request, which is exactly the frontend-rename case.
2. **Widen `docs.yml` `paths`** to include `apps/frontend/src/**` (and the other scanned directories), and add a `pull_request`
   trigger that runs only the generate-and-validate part, not the Pages deploy.
3. **Both:** option 1 for pull requests, and `docs.yml` unchanged for the deploy.

Whichever option is chosen, the `stub` and `inbound` classes come along at no extra cost. They catch a redirect stub that points at a
moved page, and a README or PR template link to a missing docs anchor.

## Evidence

- `.github/workflows/docs.yml`: `branches:` `- main` and `paths:` `- "apps/docs/**"` under `on: push:`, plus `workflow_dispatch:`.
- `.github/workflows/main.yaml`: `paths-ignore:` `- "**.md"` on both `push` and `pull_request`.
- Phase 168 handoff: `.planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-DOCS-AUDIT.md` § Residue and § Handoff to Phase 169.
