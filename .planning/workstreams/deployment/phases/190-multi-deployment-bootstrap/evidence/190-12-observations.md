# 190-12 observations

## Token probe (2026-11-24)

Operator pushed the probe as `.github/workflows/downstream-oidc-probe.yml` on a throwaway `deploy/nuorten-2027` of `OpenVAA/deploy-nuortenvaalikone` (commit 477627181, downstream guard green on push and pull request), opened pull request #7, counted the environments, and deleted the branch. Claim lines read verbatim from the job logs through the GitHub API.

### Push run — https://github.com/OpenVAA/deploy-nuortenvaalikone/actions/runs/45475184723 (success)

probe-no-environment (success):

```
sub=repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:ref:refs/heads/deploy/nuorten-2027
repository_id=1468971368
repository_owner_id=115159211
ref=refs/heads/deploy/nuorten-2027
environment=
event_name=push
```

probe-empty-environment (success):

```
sub=repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:ref:refs/heads/deploy/nuorten-2027
repository_id=1468971368
repository_owner_id=115159211
ref=refs/heads/deploy/nuorten-2027
environment=
event_name=push
```

probe-arm (success): `uname_m=aarch64`

### Pull-request run — https://github.com/OpenVAA/deploy-nuortenvaalikone/actions/runs/45475355453 (success)

probe-no-environment (success):

```
sub=repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:pull_request
repository_id=1468971368
repository_owner_id=115159211
ref=refs/pull/7/merge
environment=
event_name=pull_request
```

probe-empty-environment (success):

```
sub=repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:pull_request
repository_id=1468971368
repository_owner_id=115159211
ref=refs/pull/7/merge
environment=
event_name=pull_request
```

probe-arm (success): `uname_m=aarch64`

### Environments and cleanup (operator's terminal)

```
environments_total_count=0
- [deleted]           deploy/nuorten-2027
```

### Verdicts

PROBE_PUSH_SUB=repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:ref:refs/heads/deploy/nuorten-2027
PROBE_PR_SUB=repo:OpenVAA@115159211/deploy-nuortenvaalikone@1468971368:pull_request
EMPTY_ENVIRONMENT=runs-without
ARM_RUNNER=available

The subjects take the id-bearing form, so the nuorten-2027 entry's plan and deploy subjects are written in it (Phase 193).

## Smoke runs

Moved after 190-14's evidence deploy by operator ruling (2026-11-24). Run on 2026-11-27 from the operator's workstation (macOS, Node 24), in a checkout of `planning/deployment-190` at 8b0f5cdff, right after Deploy run 45947196363 put EVIDENCE_COMMIT b7a78427d on staging. Voter-only runs: no contestant inputs, every variable the gate refuses unset, each in a fresh subshell with its own run directory.

```
served=b7a78427de3c42817b04610155007f2e3d7f6c72      curl -fsS https://staging.openvaa.org/api/health
tree_diff_exit=0                                    git diff --quiet $served -- apps packages
```

### SMOKE_DEPLOYMENT unset

Run directory `tests/e2e-runs/190-12-smoke-default-20261127T064626Z`.

```
DEPLOYED SMOKE GATE https://staging.openvaa.org
PASS service-role-key-absent
PASS origin
PASS sha
PASS ref
PASS project-id
DEPLOYED SMOKE GATE OK build=b7a78427de3c42817b04610155007f2e3d7f6c72 ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001
  1 passed (7.8s)
smoke_exit=0
VERDICT OK: 1 tests -- passed 1, failed 0, flaky 0, skipped 0, did not run 0
verdict_exit=0
void_marker=none
```

### SMOKE_DEPLOYMENT=staging

Run directory `tests/e2e-runs/190-12-smoke-staging-20261127T064635Z`.

```
DEPLOYED SMOKE GATE https://staging.openvaa.org
PASS service-role-key-absent
PASS origin
PASS sha
PASS ref
PASS project-id
DEPLOYED SMOKE GATE OK build=b7a78427de3c42817b04610155007f2e3d7f6c72 ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001
  1 passed (6.9s)
smoke_exit=0
VERDICT OK: 1 tests -- passed 1, failed 0, flaky 0, skipped 0, did not run 0
verdict_exit=0
void_marker=none
```

The verdict was first called as tests/README.md step 5 wrote it, with `--no-flaky`; the script refused that flag (`e2e-spec-verdict.mjs: unknown flag '--no-flaky'`, status 2), because a flaky test fails every run whatever the flags. The README step was corrected and the verdict run again on the same run directories; the lines above are from that run.

### Verdicts

SMOKE_DEFAULT=passed
SMOKE_STAGING_KEY=passed
