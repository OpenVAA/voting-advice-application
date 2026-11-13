---
created: 2026-10-18
title: Spike after the freeze, a native per-worktree Supabase stack and the CLI bump to 2.121 or later
area: apps/supabase
severity: low
source: Phase 181.1 (agent-ready local stack), decisions D-05, D-06 and D-08
related_phase: 181.1
re_check_trigger: "after the 181-17 freeze, and not before 2026-10-21 (npmMinimalAgeGate 7d on CLI 2.121.0)"
keywords: [supabase-cli, native-runtime, worktree, ports, e2e]
files:
  - apps/supabase/supabase/config.toml
  - tests/scripts/e2e-run.sh
  - .github/workflows/main.yaml
  - .yarnrc.yml
---

## Why

The `-infra` and `-gsd` worktrees share one local stack: both use `project_id = "openvaa-local"`
in `apps/supabase/supabase/config.toml` and the same ports, so a reset or an E2E run from one wipes
the other.

The native per-worktree stack (`[experimental] stack = true` or `SUPABASE_EXPERIMENTAL_STACK=1`,
with `--runtime native`) gives each worktree its own stack on ports 20000 to 32767. Limits:

- it is alpha;
- it needs CLI 2.119 or later, and 2.121 or later for port changes to apply on restart;
- it needs macOS 14 or later on Apple silicon;
- ports pinned in `config.toml` are exact requests and can conflict between worktrees.

## The spike (D-05)

- [ ] Bump the CLI to at least 2.121 once the age gate allows it (see the CLI bump below).
- [ ] Make the 15 literal ports in `config.toml` `env()`-driven, or remove them.
- [ ] Make `tests/scripts/e2e-run.sh` read the API URL from `supabase status` instead of
      hard-coding `54321`.
- [ ] Run the full E2E suite once with `--runtime native` in a worktree.

## The evidence rule (D-06)

E2E evidence from the native stack counts toward no gate. Gates (181-19 and later) run on the
Docker stack, as CI does. A native run is supporting evidence only.

## The CLI bump (D-08)

The freeze and phase 181 stay on CLI 2.118.0. That is the catalog entry `supabase: ^2.118.0` in
`.yarnrc.yml` and the six `setup-cli` pins `version: 2.118.0` in `.github/workflows/main.yaml`.
2.121.0 fails `npmMinimalAgeGate: 7d` until 2026-10-21. The 181-12 ruling and every isolated
observation were measured on 2.118, so after the bump they are observed again.

## Linked todos (D-15)

Both stay in `.planning/todos/pending/` and are done inside this spike:

- `2026-08-29-config-toml-hard-coded-ports-phase-156.md`: the 15 literal ports and hosts in
  `config.toml`.
- `2026-10-03-supabase-config-inbucket-section-deprecated.md`: the `[inbucket]` to `[local_smtp]`
  rename, done at the CLI bump.

## Sources

- `.planning/workstreams/deployment/phases/181.1-declarative-schema-on-pg-delta-agent-ready-local-stack-and-s/181.1-CONTEXT.md`, D-05, D-06, D-08, D-15
- `.planning/workstreams/deployment/phases/181.1-declarative-schema-on-pg-delta-agent-ready-local-stack-and-s/181.1-DISCUSSION-POINTS.md`, § 0 rows 11 to 13 and 17
- https://supabase.com/docs/guides/local-development/running-multiple-local-projects
