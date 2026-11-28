---
title: "Dev host: Docker Desktop's credential helper hangs on pull, and several images this project no longer uses can be reclaimed"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: operator host maintenance (not a code change)
keywords: [docker, credential-helper, docker-credential-desktop, images, disk, dev-host, operator]
re_check_trigger: "the next Supabase CLI bump (its first db:start pulls images); or when Docker VM free space nears the 13.8 GiB E2E floor"
---

# Host maintenance items (169-04, 169-06, 169-11)

## Credential helper

`docker-credential-desktop get` hung on the first `docker pull` in 169-04 and again for 30 minutes during 169-06's
`yarn db:start` (same host fault as 136-05). The workaround that worked: a scratch `DOCKER_CONFIG` directory whose
`config.json` is `{}` plus `DOCKER_HOST=unix://$HOME/.docker/run/docker.sock`. Until Docker Desktop's helper is
repaired (reset credentials / reinstall the helper), the first `yarn db:start` after any CLI bump on this host needs
that workaround.

## Images this project no longer uses (prune by hand, operator only)

A second, unrelated Supabase stack runs on this host, so never `docker image prune -a` or `supabase stop --all`;
remove these by name after checking `docker ps -a` shows no container using them:

- the Supabase CLI 2.83.0 service images (postgrest v14.5, gotrue v2.187.0, storage-api v1.41.8, realtime v2.78.10,
  edge-runtime v1.71.0, postgres-meta v0.96.1, studio 2026.03.04, mailpit v1.22.3, logflare 1.34.7, vector 0.28.1);
- `public.ecr.aws/supabase/postgres:15.8.1.085` (replaced by `postgres:17.6.1.171` for this project);
- the trufflehog images pulled for the local secret-scan runs (`ghcr.io/trufflesecurity/trufflehog:3.97.2` /
  `3.97.9`), unless kept on purpose for local scans.

`docker builder prune -af` is always safe here and is what the E2E runs use before a full suite.
