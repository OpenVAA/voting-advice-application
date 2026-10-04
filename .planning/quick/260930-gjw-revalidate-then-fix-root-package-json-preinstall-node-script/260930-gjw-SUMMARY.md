---
phase: quick-260930-gjw
plan: 01
quick_id: 260930-gjw
status: complete
subsystem: docker
tags: [docker, yarn, node-engine-guard, build]
requires: []
provides:
  - "apps/frontend/Dockerfile base stage copies scripts/ before yarn install, so every image stage builds again"
affects:
  - docker-compose.dev.yml (production target)
  - apps/frontend/docker-compose.dev.yml (development target)
  - render.example.yaml (Render deploy)
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - apps/frontend/Dockerfile
decisions:
  - "Copy the whole scripts/ directory rather than the single guard file. This matches the existing COPY apps/packages form and keeps working if a root lifecycle script ever references another file under scripts/."
metrics:
  completed: 2026-09-30
  duration: ~15min
actuals:
  tasks: 3
  commits: 1
plan_head_before: 79b4faed97b40e845094f7d4b9e7f988aa0cfd48
plan_head_after: 6798df6612243158b47cb70d68aaf4089a73133c
fix_sha: 6798df6612243158b47cb70d68aaf4089a73133c
---

# Quick 260930-gjw: Root preinstall guard missing from the Docker install

**The base stage of `apps/frontend/Dockerfile` now runs `COPY scripts scripts` before `RUN yarn install --immutable`. The Docker install builds again, and the Node engine guard still runs and still rejects Node 20 inside the image build.**

## Decision branch: HOLDS

The static check and a real build both reproduced the finding. The intervention (adding only the scripts COPY) turned the same build green, which confirms the root cause.

## Task 1: Revalidation at base 79b4faed9

- **COPY-coverage check** exited 1:
  `{"refs":["scripts/assert-node-engine.mjs"],"srcs":["package.json","yarn.lock",".yarnrc.yml","turbo.json",".yarn","apps","packages"],"installLine":19,"missing":["scripts/assert-node-engine.mjs"]}`
- **Root lifecycle:** `preinstall` is `node scripts/assert-node-engine.mjs`. There is no `install` or `postinstall` script. `prepare` is `husky`, which does not run on a Yarn 4 install, and the image sets `HUSKY=0`.
- **Other Dockerfiles:** `git ls-files` lists `apps/frontend/Dockerfile` as the only tracked Dockerfile.
- **.dockerignore:** the root file excludes only `**/node_modules` and `**/build`. `apps/frontend/.dockerignore` has no effect when the build context is the repo root. Neither excludes `scripts/`.
- **Consumers:**
  - `docker-compose.dev.yml` builds with context `.`, dockerfile `apps/frontend/Dockerfile`, target `production`.
  - `apps/frontend/docker-compose.dev.yml` builds with context `../../`, the same dockerfile, target `development`.
  - `render.example.yaml` uses `dockerfilePath: ./apps/frontend/Dockerfile` and `dockerContext: .`.
  - All three inherit `base` and need no edit.
- **CI:** no `.github/workflows` job builds the image.
- **Docker snapshot before the run:**
  - Images: 28 (17.6GB). Build Cache: 0B.
  - No `node:*` images present.
  - Free space inside the VM: 14.8G, above the 10 GiB threshold, so no reclaim was needed.
- **Pre-fix `docker build --target base`:** exit 1. Yarn reported:
  - `YN0007: │ root-workspace-0b6124@workspace:. must be built because it never has been before or the last one failed`
  - `YN0009: │ root-workspace-0b6124@workspace:. couldn't be built successfully (exit code 1, logs can be found here: /tmp/xfs-6b0daaa6/build.log)`
  - Docker: `ERROR: process "/bin/sh -c yarn install --immutable" did not complete successfully: exit code: 1`
  - Only the root workspace failed. The other packages Yarn built in the same step (esbuild ×3, supabase) did not.
  - A second build of the unchanged file (my first edit attempt failed, so that run reused the original Dockerfile) failed the same way (`YN0009`, `/tmp/xfs-28dc2593/build.log`).

## Task 2: Fix (commit 6798df661)

Two lines added to the base stage, after `COPY packages packages`:

```
# Root lifecycle scripts (the preinstall Node engine guard) run from scripts/ during install
COPY scripts scripts
```

- **COPY-coverage check:** exit 0 (`missing: []`, `installLine: 21`).
- **Post-fix `docker build --target base`:** exit 0. The root workspace was built (`YN0007: │ root-workspace-0b6124@workspace:. must be built ...` with no following YN0009). The step ended with `YN0000: · Done with warnings in 15s 28ms`. The warnings are the existing peer-dependency notes (YN0060 zod, YN0002 playwright-core, YN0086), which the pre-fix log also shows.
- **Guard inside the built image:** `docker run --rm --entrypoint node openvaa-frontend-base:gjw-post scripts/assert-node-engine.mjs` exited 0 and printed `assert-node-engine: v22.23.3 satisfies "engines.node": ">=22" — OK`.
- **Guard-integrity verify:** exit 0.
  - The fix commit changes only `apps/frontend/Dockerfile`.
  - `package.json`, `scripts/`, `.yarnrc.yml` and both `.dockerignore` files are unchanged.
  - The Dockerfile has nothing that disables lifecycle scripts.
  - The added comment passes the hygiene grep.

## Task 3: Negative control, repo-side guard, cleanup

- **node:20-alpine variant** (scratch copy of the fixed Dockerfile, two sed edits, each checked to apply exactly once): **PASS**.
  - Build exit 1, failing at `YN0009` on the root workspace.
  - The build log contains the guard's own rejection: `assert-node-engine: this Node is v20.20.2, and the root manifest declares "engines.node": ">=22". Switch to a Node satisfying that range, or change the declared range deliberately.`
- **Repo-side guard:** `yarn assert:node-engine` exited 0 (v24.14.1 OK). `node scripts/assert-node-engine.mjs --self-test` exited 0 (23 cases OK).
- **Cleanup:**
  - Removed `openvaa-frontend-base:gjw-post`. `gjw-pre` never existed because that build failed.
  - Removed `node:22-alpine`, which was absent before the run. `node:20-alpine` was only pulled into BuildKit and never became a local image.
  - Ran `docker builder prune -af`, since the pre-run cache was 0B. It reclaimed 1.329GB.
  - The final `docker system df` matches the pre-run snapshot: 28 images, 17.6GB, Build Cache 0B. No images or volumes were pruned and Docker was not restarted.

## Deviations from Plan

- **The zsh shell treats `status` as a read-only variable.** The plan's verify snippets assign `status=$?`, so I used `rc` for exit statuses instead. The commands and gates are otherwise unchanged.
- **One extra pre-fix build.** My first Edit call was rejected because the file hadn't been read yet, so the next "post-fix" build ran against the unchanged file and failed identically. That is a second reproduction of the finding, not a fix failure. I then re-applied the edit and reran.

Otherwise the plan ran as written.

## Follow-up observations (not fixed here)

- No CI job builds the image. A future root lifecycle reference outside the copied directories would again go unnoticed until someone deploys.
- The plan says the deployment docs page under `apps/docs` still cites pre-monorepo Dockerfile paths. **UNCONFIRMED:** my read-only grep to check this was blocked by the auto-mode permission classifier, so I did not verify it.

## Known Stubs

None.

## Self-Check: PASSED

- `apps/frontend/Dockerfile` contains `COPY scripts scripts` before `RUN yarn install --immutable`.
- Commit 6798df661 is on `fix/888-review-findings`. It is the only commit in `79b4faed9..HEAD`.
