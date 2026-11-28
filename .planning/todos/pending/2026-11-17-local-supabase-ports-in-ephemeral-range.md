---
title: Move the local Supabase ports out of Linux's ephemeral range, or check them before a CI `supabase start`
priority: medium
source: Phase 187 plan 187-28 (run 44033456141 attempt 1, `ci-evidence/187-final-4` at 68a54299a, read 2026-11-17)
target: after the stream merges
---

Note, 2026-11-20: re-targeted from phase 189 because it needs the merged default branch: the fix belongs to the stream that owns `apps/supabase/supabase/config.toml` and `main.yaml`'s E2E jobs after the merge.

The local Supabase stack binds fixed host ports in the 543xx block (`apps/supabase/supabase/config.toml`): the API
54321, the database 54322, Studio 54323, the mail server 54324 with SMTP on 54325 and POP3 on 54326, and the others
up to 54329. All of them lie inside Linux's default ephemeral port range, 32768 to 60999
(`net.ipv4.ip_local_port_range`), the range the kernel draws the local port of an outbound socket from. On a
GitHub-hosted runner, a CI `supabase start` can therefore find one of its ports already held by an outbound
connection opened earlier in the job, such as a package download, an image pull or the Playwright browser install.

**The occurrence.** On run
[44033456141](https://github.com/OpenVAA/voting-advice-application/actions/runs/44033456141) attempt 1, the
`e2e-visual` job (job 133870600988) failed at its `Start Supabase` step, before any visual test ran:

```
failed to start docker container "supabase_inbucket_openvaa-local": Error response from daemon: failed to set up
container networking: driver failed programming external connectivity on endpoint supabase_inbucket_openvaa-local
(...): failed to bind host port 0.0.0.0:54326/tcp: address already in use
```

The log does not name what held the port, so the ephemeral-socket explanation is the likely mechanism, not a
confirmed one. The operator ruled the failure void ("void + rerun"), and the job alone was re-run as attempt 2
(job 133887903492), which succeeded on the same commit. The record is
`.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-28-ci-closure.md` § Task 5.

**What closes it.** Either of:

- Move the stack's host ports below 32768 (for example the 2xxxx range) in `config.toml`, together with every
  place that names them: the root `.env.example`, `tests/scripts/e2e-run.sh`, the CI key-writing script, and the
  documentation that cites 54321, 54323 and 54324.
- Or, before each CI `supabase start` in `main.yaml`, check that every configured host port is free (`ss -ltn` and
  the established sockets' local ports), and fail with a message naming the port and its holder, or narrow the
  runner's ephemeral range first with `sudo sysctl -w net.ipv4.ip_local_port_range="55000 60999"`, which keeps the
  543xx block out of it.

Then observe the E2E jobs' `supabase start` succeed at job level on a `ci-evidence/**` push. A collision must not
be answered by re-running jobs until green: the re-run on run 44033456141 was the operator's one-off ruling.
