# Phase 185: AWS Frontend Stack, First Apply by Hand - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `185-CONTEXT.md`; this log preserves how they were reached.

**Date:** 2026-11-12
**Phase:** 185-aws-frontend-stack-first-apply-by-hand
**Mode:** one all-items checkbox document (`185-DISCUSSION-POINTS.md`, committed `d3da5d1b2`), filled by the operator in one pass. An unticked decision takes its ★ option.

## Outcome by decision

| ID | Question | Choice | How |
|---|---|---|---|
| A-01 ⚠ | Who runs the AWS commands | The agent runs everything, applies included, with no per-apply approval | **Overruled** (ticked option 3) |
| A-02 | State key and the README's "never by hand" | Keep `pipeline/staging/aws`, correct the README | ★ |
| A-03 | Staged apply order | Image first, then one apply, no `-target` | ★ |
| B-01 ⚠ | CDN shape | CloudFront in front of the whole site, two behaviours | ★ |
| B-02 ⚠ | Closing the origin | Prefix list and secret origin header | ★ |
| B-03 | Client-address header | `x-forwarded-for`, depth 2 from the record | ★ |
| B-04 | Certificates and regions | Two certificates (`us-east-1` and `eu-north-1`), HTTPS to the origin | ★ |
| B-05 | WAF placement | On the distribution, built in 188 | ★ |
| B-06 | Showing HTML is not cached | Observed miss/hit pattern | ★ |
| C-01 | Architecture | ARM64 | ★ |
| C-02 | Task size | 0.5 vCPU / 1 GB | ★ |
| C-03 ⚠ | Secret store | SSM SecureString created out of band; `ANALYTICS_POSTHOG_KEY` | ★ |
| C-04 | Template for OBS-08 | One list in the module, guarded against `REQUIRED_ENV` | ★ |
| C-05 | Image tag | Full SHA, clean pushed tree, second push refused | ★ |
| D-01 ⚠ | The failed rollout | Revision without `ORIGIN`, circuit-breaker rollback | ★ |
| D-02 | Seeing SIGTERM | Log line on `sveltekit:shutdown` | ★ |
| D-03 | Deployment alert | Built here, EventBridge → SNS | ★ |
| D-04 | Scaling | Floor 1, ceiling 2, target tracking, one scheduled pair | ★ |
| D-05 | Log retention | 90 days | **Overruled** (ticked option 3) |
| E-01 | OBS-10 | Two clients on different networks | ★ |
| E-02 | OBS-06 | Invitation to the operator's second mailbox | ★ |
| E-03 | Destroy and re-apply | Before/after plans, tag sweep, probe, re-apply | ★ |
| E-04 | Cost estimate | Cost Explorer by tag after 7 days, plus inventory | ★ |
| E-05 | Runbook location | `infra/envs/staging/aws/README.md` with Observations table | ★ |
| E-06 | Todos | Fold none | ★ |

## Notes

- A-01's overrule replaces 183 D-10 / 184's "the agent holds no credential" for this phase. CONTEXT D-01 records
  which earlier rules still bind the agent under it: only `staging/aws` is applied, secret values come from the
  operator, an expired SSO session is a stop, and operator-only actions stay checkpoints.
- Found during the scout: the shell's default AWS credentials belong to a different account (`173787562496`);
  `openvaa-admin` resolves to `471112560111`.

## Deferred Ideas

- WAF rate rule (188), build-failure alert (187), measured cost figure if 7 days do not fit (189).
