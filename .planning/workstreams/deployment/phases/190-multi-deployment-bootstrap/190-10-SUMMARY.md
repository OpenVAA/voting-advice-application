---
phase: 190-multi-deployment-bootstrap
plan: 10
subsystem: infra-docs
tags: [docs, multi-deployment, accepted-risks, root-copies]
requires: [190-06, 190-09]
provides:
  - "infra/README.md for several deployments in one account, with § Adding a deployment"
  - "deployment guide subsection Adding a deployment from a downstream repository"
  - "rootCopies.test.ts discovering every env root under infra/envs/"
affects: [190-13, nuorten-2027 193, nuorten-2027 195]
tech-stack:
  added: []
  patterns: ["root families discovered with readdirSync, staging first"]
key-files:
  created: []
  modified:
    - infra/README.md
    - infra/envs/example/aws/main.tf
    - infra/envs/example/dns-mail/main.tf
    - infra/envs/example/supabase/main.tf
    - "apps/docs/src/routes/(content)/developers-guide/deployment/+page.md"
    - infra/scripts/rootCopies.test.ts
decisions:
  - "The thirteen unconfirmed SAR reads are one accepted-risk bullet naming every action; a confirmed tag condition can later go into plan_deny in place"
  - "The guide's pipeline section uses its own placeholder <your-environment>; the downstream subsection uses <key>"
  - "rootCopies families: every <env>/<family> holding a main.tf, staging first, others in name order, scratch in supabase only"
metrics:
  duration: "about 45 min"
  completed: 2026-11-24
---

# Phase 190 Plan 10: Multi-deployment docs and the root-copy guard Summary

**infra/README.md, the deployment guide and the example roots now describe several deployments in one account and the downstream path (map entry upstream, roots under `infra/envs/<key>/`, branches `deploy/<key>` and `deploy-evidence/destroy-<key>`), the accepted risks name what IAM cannot scope between deployments and the lost reviewer gate without GitHub Environments, and `rootCopies.test.ts` holds every env root under `infra/envs/` to staging's wiring.**

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | README, example root comments and guide | 6be80d2cd | infra/README.md, infra/envs/example/{aws,dns-mail,supabase}/main.tf, the deployment guide |
| 2 | rootCopies over every env root | bb05f417f | infra/scripts/rootCopies.test.ts |

## What changed

- **infra/README.md**
  - Intro and § Roots: one account holds every deployment. `bootstrap` holds the bucket, budget and OIDC provider once, and one set of roles, policies, execution role and image repository per entry of `deployments.auto.tfvars.json`, keyed by name. The "account of its own" sentence is gone. The state paragraph says each plan role reads only its own pipeline key.
  - Prerequisites, Rules of every apply (the workspace rule), the Guards row (resolved root, `aws-pipeline`, no literal role ARN, needs-resolve) and two new Scripts rows (`resolve-deployment.sh`, `check-bootstrap-plan.sh`).
  - § The deploy pipeline:
    - The resolve job and how it picks an entry in each workflow.
    - The static triggers.
    - The infra-plan push trigger without `deploy-evidence/destroy-*`. The paragraph that said a destroy push also starts `infra-plan.yml` now says it starts `destroy.yml` only.
    - The settings check, the per-key migration push, smoke, topic and recovery paths.
    - The constant `aws-pipeline` group, with the operator note that no run may be waiting on the old group when the change reaches `main`.
    - The per-deployment plan and wrong-subject matrix.
    - Settings for a deployment without environments, as repository secrets and variables.
    - The destroy workflow per key, with the destroy-branch subject.
    - `AWS_PLAN_ROLE_ARN`: the repository needs it no longer, and nothing reads it. This resolves the 190-09 deferred item.
  - § Accepted risks:
    - A premise line for several deployments.
    - The tag-scope bullet rewritten for `Project`/`Root`/`Environment`.
    - New bullets: ECS task-definition registration on `*` across deployments; Application Auto Scaling scoped by namespace and dimension only; the 190-06 SAR rows, all thirteen actions named, as plan-role reads of the other deployment's configuration through `ReadOnlyAccess`; the shared budget; and, for a deployment without GitHub Environments, no reviewer gate and repository secrets.
  - New § Adding a deployment, before § Example environment, in four steps: the upstream map entry, with its fields, the 15-character key, both subject forms, the 2026-07-15 id-bearing form, the token probe and the destroy-branch subject; the bootstrap apply; the copied roots, with per-key backend keys and the four-platform locks; the branches and settings. § Example environment step 1 now points at the map and `example-deployments.json`.
- **Example roots:** one comment line above each backend block says a copy under `infra/envs/<key>/` sets the key with its own deployment key. Only comment lines changed (the acceptance grep prints nothing).
- **Guide:**
  - Intro: one account, several deployments.
  - Fork and configure: the map.
  - § The account-level root: the map, with a link to bootstrap Step 11.
  - The smoke paragraph: `SMOKE_DEPLOYMENT` picks `infra/envs/<key>/supabase/terraform.tfvars`.
  - The pipeline paragraph: no workflow names a deployment; they resolve it from the map.
  - New subsection "Adding a deployment from a downstream repository", linking the README section, bootstrap Step 13 and the Accepted risks.
- **rootCopies.test.ts:**
  - `families()` replaces the fixed `FAMILIES` list. It reads `infra/envs/` with `readdirSync` and keeps every `<env>/<family>` that holds a `main.tf`, staging first and scratch only in supabase. The `identical` lists and `wiring()` are unchanged.
  - New cases: example/scratch discovery, staging first, a temporary tree with new keys, and a discovered copy with one module input dropped.

## Verification

- Red first (not committed):
  - A deliberately wrong order expectation in the temp-tree case failed 1 of 20 tests.
  - A real copy `infra/envs/redcopy/aws` with `domain` dropped from `module "frontend"` failed "redcopy/aws/main.tf has staging/aws's wiring", 1 of 23.
  - An unaltered copy `greencopy/aws` passed, 23 of 23.
  - Both copies were then deleted.
- `yarn test:unit:infra rootCopies`: 23 passed. `rootCopies hosted-settings-reference`: 36 passed.
- `yarn test:unit:infra`: **724 passed / 6 failed**, against a 715/6 baseline. The six failures are the baseline host-only `workflow-errexit.test.ts` failures with the same titles: wrong-subject ×2, sweep "deploy.yml deploy Alert the operator", sweep "destroy.yml plan-destroy Show the Supabase root's state is out of reach", and Supabase-root ×2.
- `yarn lint:check`: 0. `yarn format:check`: 0. `terraform fmt -check -recursive infra` (1.16.5): 0.
- `yarn workspace @openvaa/docs validate:links`: 0 findings, with 276 anchors and 609 GitHub links checked.
- Acceptance greps:
  - `^## Adding a deployment`: 1.
  - "hosts one deployment" / "account of its own": none.
  - `deployments.auto.tfvars.json`: 3.
  - `reviewer gate`: 1.
  - `'staging/aws', 'example/aws'`: 0.
- `yarn test:unit:tests` and `yarn lint:workflows` were not run, because nothing under `tests/` or `.github/` was touched.

**E2E:** no local E2E project's spec, fixture, route or helper was touched (the docs site is not an E2E project), so no targeted run is due. Project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Deviations from Plan

- **[Rule 2] Two Scripts-table rows added.** The README rewrite names `resolve-deployment.sh` and `check-bootstrap-plan.sh`, which the Scripts table did not list. Commit 6be80d2cd.
- **Test shape.** The non-vacuity case is an `it.each` of `toContain` checks rather than one `arrayContaining` literal, so the "no fixed list" grep stays at 0. The scratch rule is proven on a temporary tree, because the real `scratch/` holds only a supabase root.
- Task 2 is `tdd="true"` but changes a test file only, so it went in as one `test(...)` commit with the red runs recorded above (as in 190-09).

## Deferred items

- Resolved: the 190-09 item (infra/README.md naming `AWS_PLAN_ROLE_ARN` for the PR plan), by 6be80d2cd.
- Left open:
  - The 190-03 `tests/README.md` item (`SMOKE_DEPLOYMENT` row and default) belongs to 190-13, whose file it is.
  - The 190-03 resolver comment-table lint item is unchanged; `yarn lint:check` exits 0.
  - No stale flat bootstrap variables were found in `infra/bootstrap/README.md`, which is 190-11's file in any case.
- Deleting the repository variable `AWS_PLAN_ROLE_ARN` in GitHub is the operator's job.

## Threat surface

- T-190-42: the accepted risks list the Pitfall 8 remainder, all thirteen SAR rows and the D7 reviewer-gate loss.
- T-190-43: the example comments and README step 3 name the per-key backend keys.
- T-190-44: accepted, as recorded.

No new surface.

## Self-Check: PASSED

- infra/README.md, the guide, the three example main.tf files and rootCopies.test.ts: present and modified.
- Commits 6be80d2cd and bb05f417f: present in `git log`.
