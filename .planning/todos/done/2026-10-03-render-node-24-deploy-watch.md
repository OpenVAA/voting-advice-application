---
title: "Render runs Node 24 from the next deploy: confirm the service is Docker-runtime and watch the first production deploy"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: medium
suggested_phase: operator action at the first production deploy after v2.15 merges
keywords: [render, node-24, docker, deploy, rollback, supabase-ssr, cookies, operator, D-11]
re_check_trigger: "the first production deploy after the merge that carries 77d3ce8bf"
---

# The production runtime moves from Node 22 to Node 24 at the next deploy

## What changed (Phase 169 plan 02, `77d3ce8bf`)

`apps/frontend/Dockerfile` now builds on `node:24-alpine` (v24.21.0 at the pull of 2026-10-03), `engines.node` is
`>=24.15.0`, and CI pins 24.21.0. `render.example.yaml` declares the service `runtime: docker` with
`dockerfilePath: ./apps/frontend/Dockerfile`, so Render takes the Node version from the image. The phase did not deploy.
The production image was built and smoke-started locally (`/` → 200, `node -v` v24.21.0; `169-EVIDENCE.md` § 4).

## What to do

1. In the Render dashboard, confirm the live service really is Docker-runtime (the example file is not the live
   config) and that no service setting or env var pins a Node version outside the Dockerfile (none is expected —
   unverified).
2. Watch the first production deploy after merge: build log, health check, a voter page and a candidate login.
3. Rollback is a redeploy of the previous image from Render's deploy history, not a git revert.

## Sessions across the deploy

The same deploy moves `@supabase/ssr` 0.9 → 0.12.7 (169-07). 0.12 reads the cookies 0.9 wrote, so signed-in users
are not signed out by the deploy (`169-EVIDENCE.md` § 6, 169-07). If users do report a sign-out right after the
deploy, look there first.

## Resolved (2026-10-04, operator ruling)

Nothing is deployed yet, so there is no running Render service to migrate or watch and no backward compatibility to
keep. The first deploy starts on Node 24 (`apps/frontend/Dockerfile` `FROM node:24-alpine`). Closed.
