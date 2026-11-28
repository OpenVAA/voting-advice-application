# Phase 190: Multi-deployment bootstrap - Context

**Gathered:** 2026-11-24
**Status:** Ready for planning
**Source:** operator answers to the Open Decisions of 190-RESEARCH.md (2026-11-24)

<domain>
## Phase Boundary

`infra/bootstrap` takes a map of deployments so a second OpenVAA instance deploys from its own repository into the same AWS account (471112560111) without colliding with staging, and the deploy, destroy and infra-plan workflows (plus the scripts and test helpers that hard-code staging) read the deployment from data, so a downstream repository runs them unedited. The first consumer is the private downstream `OpenVAA/deploy-nuortenvaalikone` (repository id 1468971368, owner id 115159211; domain `nuortenvaalikone.openvaa.org`, its own Supabase project). The roadmap's name `deploy-nuorten-vaalikone-2027` is wrong; use the real one.

Not in this phase: adding the nuorten-2027 entry's live resources (its hosted zone comes from the downstream's dns-mail root, Phase 193 of workstream nuorten-2027), any downstream file, and any live `apply` (operator checkpoints).
</domain>

<decisions>
## Implementation Decisions

### Locked by the operator
- **D1 Registry:** one ECR repository per deployment. Staging keeps `openvaa-frontend` unchanged.
- **D2 Configuration:** the deployment map lives upstream in `infra/bootstrap/deployments.auto.tfvars.json`. Terraform loads it; the workflows read it with `jq`; a run acts only on the entry whose repository id matches its own (`github.repository_id`). Application facts stay in `infra/envs/<key>/*/terraform.tfvars`. Adding a deployment is an upstream PR; the downstream adds nothing outside its allowlist.
- **D4 Budget:** the one account budget stays as it is, outside the map. Per-deployment budgets are deferred.
- **D7 GitHub plan:** the org is on GitHub Free. The private downstream therefore has **no GitHub Environments**: no environment secrets, no branch policies, no required reviewers. Consequences the plans must honour:
  - The environment a job names is per-entry data and optional; an entry without one runs its jobs with no `environment:`, and its OIDC subjects are ref-based (`repo:<owner>@<owner_id>/<repo>@<repo_id>:ref:refs/heads/<branch>`), not environment-based. Confirm the exact subject form with a token probe as an operator step; keep subjects as data so the result is an entry edit.
  - The downstream's deploy gate is the trigger branch alone; its secrets are repository secrets. Record the loss of the reviewer gate as an accepted risk for that entry.
  - Staging keeps its environments and subjects byte-identical.

### Recommended by research, accepted (Claude's discretion within these)
- **D3 Key and schema:** key = deployment name (`staging`, `nuorten-2027`), at most 15 characters (load balancer name limit). State key `pipeline/<key>/aws/terraform.tfstate` and role names derive from it. Each entry declares repository id and owner id (required), plan and deploy subjects, deploy branches, hosted zone and domain, optional environment, and optional `registry_name` / `iam_name_prefix`, which staging sets to keep its current names. Every field is declared; a test asserts the file's keys are a subset of the schema (unknown attributes are silently dropped), and entries are checked to be mutually distinct.
- **D5 Trigger branch:** static triggers `deploy/*` and `deploy-evidence/**` minus `deploy-evidence/destroy-*`; a credential-free resolve step picks the one entry this repository owns whose deploy branches match the ref. Downstream branches `deploy/nuorten-2027` and `deploy-evidence/destroy-nuorten-2027`. One constant concurrency group replaces `staging-aws`. Keep `DEPLOY_ENVIRONMENT` and fail when it differs from the resolved key.
- **D6 Plan role:** one per deployment (staging keeps `openvaa-plan`), each reading only its own pipeline state key. Cross-deployment reads that `ReadOnlyAccess` still allows are denied by tag where possible, otherwise recorded as an accepted risk.
- **The deploy role's tag scopes** gain `Environment=<key>` in the network, CloudFront and certificate conditions (in-place policy update; staging's resources already carry the tag).
- **Staging's names never change:** IAM policy `name`, `path` and `description` force replacement. The description that says "staging zone" is rendered from a variable so staging's text stays byte for byte the same.
- **D8 Apply order:** three operator applies, each through the plan guard: (1) the pure move, which must plan as 0 to add, 0 to change, 0 to destroy; (2) the in-place policy tightening; (3) the nuorten entry, in nuorten-2027 Phase 193.
- **Proof before the operator plans:** the offline move-proof harness from research (base tree applied under a mock provider, new tree planned with the real AWS provider, fake keys, refresh off, one data-source override, shared state key; `terraform test -json -verbose` gives `previous_address` and actions) runs as a phase-verification script; the two-entry isolation test and the schema test run in CI. The `jq` plan guard also gates the operator's live plan.
- **Upstream files outside the three workflows** that hard-code staging (`infra/scripts/push-migrations.sh`, `tests/tests/utils/deployedTarget.ts`, and the tests that pin those literals) are parameterised in this phase, since the downstream can't edit them.

### Baseline
- `yarn test:unit:infra` is 524 passed / 6 failed here, all six in `workflow-errexit.test.ts`; these are the host-only failures the operator accepted at the Phase 191 close (todo `workflow-errexit-host-failures.md`). Plans judge against that baseline and must not add failures.
- The phase's final plan makes one full E2E run (CLAUDE.md), since `tests/tests/utils/deployedTarget.ts` and the deploy scripts change; deltas against the last full run of this tree.
- Terraform 1.16.5 is not installed; download it with checksum verification. Docker must be started (`openvaa-stack-up` or dockerd) for `yarn lint:workflows`.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/workstreams/deployment/ROADMAP.md` § Phase 190
- `.planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/190-RESEARCH.md`
- `.planning/workstreams/nuorten-2027/ROADMAP.md` (Phases 193, 195 consume this phase)
- `infra/README.md`, `infra/bootstrap/`, `infra/envs/staging/`, `infra/envs/example/`
- `.github/workflows/deploy.yml`, `destroy.yml`, `infra-plan.yml`
- `CLAUDE.md` (comment hygiene; E2E rules)
</canonical_refs>

<deferred>
## Deferred Ideas

- Per-deployment, tag-filtered budgets.
- Running the move-proof harness permanently in CI.
- A reviewer gate for the downstream (needs a paid plan).
</deferred>
</content>
</invoke>
