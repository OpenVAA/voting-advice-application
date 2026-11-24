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

Moved after 190-14's evidence deploy by operator ruling (2026-11-24). Pending.
