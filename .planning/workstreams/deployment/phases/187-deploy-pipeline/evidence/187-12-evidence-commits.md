# 187-12 evidence: the two evidence commits and their local build proofs

Recorded 2026-11-15 (UTC) by the plan executor, from this checkout. Logs are in `tmp/187-gates/187-12/` (ignored). Nothing was pushed, no registry was signed in to, no image was tagged for a registry, and no remote or hosted service was read: the parent comes from the local remote-tracking ref, and the builds' only downloads were the base image and the packages `yarn install --immutable` takes from the committed lockfile.

## The green commit (Task 2)

```
GREEN_TREE_SUPERSEDED=fa16b0c68a9d32835f811344393d2bb31a173c9b
GREEN_COMMIT_SUPERSEDED=69d10a72357e149c1c35a7002d7779233ffc4d44
GREEN_PARENT_SUPERSEDED=340a200708c28fb7ed078d452138712f3400c789
GREEN_PATHS_SUPERSEDED=3320
GREEN_PLANNING_PATHS_SUPERSEDED=0
GREEN_LOCAL_BUILD_EXIT_SUPERSEDED=0
GREEN_BUILD_MINUTES_SUPERSEDED=3.4
```

- **Date:** 2026-11-15 (UTC), commit written 03:17Z, build 03:18:11Z to 03:21:34Z (203 s).
- **The parent, without a remote read.** `git rev-parse --verify refs/remotes/origin/main` exit 0: `340a200708c28fb7ed078d452138712f3400c789`, the commit origin's `main` named at the last fetch (the same parent plan 185-12 used). No `git fetch` and no `git ls-remote` was run.
- **The tree.** In a temporary index under the session scratch directory (`GIT_INDEX_FILE=$(mktemp)`, removed afterwards): `git read-tree HEAD` exit 0 (HEAD `e5bb3601e`, the Task 1 evidence commit), `git rm -r --cached --quiet .planning` exit 0, `git write-tree` exit 0. `git diff --quiet HEAD <commit> -- . ':!.planning'` exit 0: the tree is HEAD's outside `.planning/`, which is the tree the Task 1 gates ran on (that commit only added a `.planning/` file). The real index and the working tree were not touched (`git diff --cached --quiet` exit 0, `git status --porcelain` empty).
- **The commit.** `git commit-tree "$GREEN_TREE" -p "$GREEN_PARENT" -m "deploy: staging"` exit 0, with the author date set to `2026-11-15T03:20:00Z` through `GIT_AUTHOR_DATE` (the committer date is the moment of writing); `git update-ref refs/evidence/187/green "$GREEN_COMMIT"` exit 0.
- **No planning path.** `git ls-tree -r --name-only "$GREEN_COMMIT"` written to `green-paths.txt` (exit 0, 3320 paths); `awk -F/ '$1 == ".planning"'` counts 0 and `grep -c '^\.planning/'` counts 0 (exit 1, no match).
- **The build (C-02 control).** The script's archive context and build flags (`infra/scripts/build-push-image.sh` `make_context` and `build_and_push`), with the registry tag and `--load` replaced by a cache-only output: `git archive --format=tar -o <tmp>/green.tar "$GREEN_COMMIT"` exit 0, extracted into an empty `<tmp>/context` exit 0, then, in the background, `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=69d10a72357e149c1c35a7002d7779233ffc4d44 --provenance=false --sbom=false -f <tmp>/context/apps/frontend/Dockerfile --output type=cacheonly --progress=plain <tmp>/context` (`green-build.log`, status in `green-build.status`): exit 0. Its step `#19 [production 2/2] RUN yarn workspace @openvaa/frontend build` ended `DONE 10.9s`. The archive holds only the commit's tracked files, so the Dockerfile needs no ignored or untracked file. The temporary directory was removed after the build.

## The red commit (Task 3)

```
RED_TREE_SUPERSEDED=bbf466d2f18b5adf94a193a01b85ac3d1ea12c68
RED_COMMIT_SUPERSEDED=4d4624315ef323b5f8bb712eebada6b394ee1074
RED_DIFF_PATHS_SUPERSEDED=apps/frontend/src/routes/+layout.ts
RED_LOCAL_BUILD_EXIT_SUPERSEDED=1
RED_FAILED_AT_FRONTEND_BUILD_SUPERSEDED=yes
RED_FAILING_DOCKER_STEP_SUPERSEDED=shared 2/2 RUN yarn build (Dockerfile line 28), turbo task @openvaa/frontend#build
RED_NAMES_MISSING_MODULE_SUPERSEDED=yes
WORKING_TREE_UNCHANGED_SUPERSEDED=yes
BUILDER_CACHE_PRUNED_SUPERSEDED=yes
```

- **Date:** 2026-11-15 (UTC), commit written 03:22Z, build 03:22:33Z to 03:25:14Z.
- **The commit.** In a new temporary index under the session scratch directory, removed afterwards: `git read-tree refs/evidence/187/green` exit 0; a blob of the line `import '$lib/does-not-exist-187-red';` followed by the unchanged content of `apps/frontend/src/routes/+layout.ts` at the green commit, written with `git hash-object -w --stdin` (`8ccc60be8f1696621812d5e7f8084f403b708aa7`); `git update-index --cacheinfo 100644,<blob>,apps/frontend/src/routes/+layout.ts` exit 0 (the mode the green tree gives the file); `git write-tree` exit 0; `git commit-tree "$RED_TREE" -p 340a200708c28fb7ed078d452138712f3400c789 -m "deploy: a build broken on purpose, never merged"` exit 0, its parent being Task 2's `GREEN_PARENT`; `git update-ref refs/evidence/187/red "$RED_COMMIT"` exit 0.
- **One path.** `git diff-tree -r --name-only refs/evidence/187/green "$RED_COMMIT"` prints the one path `apps/frontend/src/routes/+layout.ts`; `git diff --stat` between the two: `1 file changed, 1 insertion(+)`.
- **The build.** The same archive build as Task 2, in the background (`red-build.log`, status in `red-build.status`): `git archive` exit 0, extraction exit 0, `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=4d4624315ef323b5f8bb712eebada6b394ee1074 --provenance=false --sbom=false -f <tmp>/context/apps/frontend/Dockerfile --output type=cacheonly --progress=plain <tmp>/context` exit 1. `yarn install --immutable` (`#13`) completed; the step that failed is `#15 [shared 2/2] RUN yarn build`, whose turbo run reports `Failed: @openvaa/frontend#build` (`Tasks: 13 successful, 14 total`) after the frontend's vite build printed `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red` for `import "$lib/does-not-exist-187-red";`. The build ended `ERROR: failed to build: failed to solve: process "/bin/sh -c yarn build" did not complete successfully: exit code: 1`.
- **Where it fails, against the plan's expectation.** The plan and research Pitfall 4 expected the failure at the production stage's `RUN yarn workspace @openvaa/frontend build` (Dockerfile line 56). It comes one stage earlier: the `shared` stage's `RUN yarn build` (line 28) runs turbo's `build` over every workspace, the frontend included, so the frontend's own `build` script fails there, on the missing module, and the production stage never starts. The failing work is the frontend build, and nothing before it failed (the base image, the install and the 13 other build tasks all completed), so `RED_FAILED_AT_FRONTEND_BUILD=yes` is recorded with the Docker step named in `RED_FAILING_DOCKER_STEP`. For the pipeline the difference does not matter: the whole `docker buildx build` is the script's `build` step, so the red run's build step ends `failed=build` before any push, plan or hosted write.
- **The working tree.** `git status --porcelain` empty after the build, and `git diff --quiet -- apps/frontend/src/routes/+layout.ts` exit 0. Neither the working tree nor the real index was touched.
- **The builder cache.** `docker builder prune -af` exit 0 (`builder-prune.status`), `Total: 4.897GB` reclaimed; `docker system df` then shows `Build Cache 0 0 0B 0B`.

## Nothing pushed, from local refs alone

- `git for-each-ref --contains 69d10a72357e149c1c35a7002d7779233ffc4d44 --format='%(refname)'` prints exactly `refs/evidence/187/green`.
- `git for-each-ref --contains 4d4624315ef323b5f8bb712eebada6b394ee1074 --format='%(refname)'` prints exactly `refs/evidence/187/red`.

No branch and no remote-tracking ref holds either commit. A push to origin would have left one under `refs/remotes/origin/`, since origin's fetch refspec is `+refs/heads/*:refs/remotes/origin/*`.

## Re-run 2026-11-15 (after review fixes)

Recorded 2026-11-15 (UTC) by a plan executor that the orchestrator spawned to re-run plan 187-12, because plan 187-15 Task 1 found `PUSH_TREE_MATCHES_HEAD=no`. The green commit above (`69d10a723`, tree `fa16b0c68`) predates the review fixes `49d8ec823` … `6bf28e0e1`, `95d1d6ad5`, `d55a94b7a` and the orchestrator's `1e10dff7f`, which changed files under `.github/workflows/` and `infra/` only. Its lines and the red commit's are kept, renamed `*_SUPERSEDED=` so that each line a verify reads has exactly one current value (the convention of `186-07-closing-e2e.md`). The lines below are current. Logs are in `tmp/187-gates/187-12-rerun/` (ignored). Nothing was pushed, no registry was signed in to, no image was tagged for a registry, and neither the repository's remote nor a hosted service was read.

### The green commit (Task 2, re-run)

```
GREEN_TREE_SUPERSEDED=3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b
GREEN_COMMIT_SUPERSEDED=395b71c712f9af6a80512625f2b38baf93167c1a
GREEN_PARENT_SUPERSEDED=340a200708c28fb7ed078d452138712f3400c789
GREEN_PATHS_SUPERSEDED=3320
GREEN_PLANNING_PATHS_SUPERSEDED=0
GREEN_LOCAL_BUILD_EXIT_SUPERSEDED=0
GREEN_BUILD_MINUTES_SUPERSEDED=3.7
GREEN_BUILT_FROM_HEAD_SUPERSEDED=1e10dff7f33c51e3e22e3853e3ec95f1a7e0087d
GREEN_BUILD_ATTEMPTS_SUPERSEDED=2, the first void at the base-image fetch (below)
```

- **Date:** 2026-11-15 (UTC). The commit was written at 20:14:08Z. The build of record ran from 21:03:24Z to 21:07:05Z (221 s).
- **The parent, without a remote read:** `git rev-parse --verify refs/remotes/origin/main` exit 0 printed `340a200708c28fb7ed078d452138712f3400c789`, the same parent as before. There was no `git fetch` and no `git ls-remote`.
- **The tree:** a temporary index under the session scratch directory (`GIT_INDEX_FILE=$(mktemp)`, removed afterwards). `git read-tree HEAD` exit 0 with HEAD `1e10dff7f`, the orchestrator's last source commit, then `git rm -r --cached --quiet .planning` exit 0 and `git write-tree` exit 0. `git diff --quiet HEAD <commit> -- . ':!.planning'` exit 0, so the tree is HEAD's outside `.planning/`. That is the tree the Task 1 re-run gates ran on. The Task 1 commit `3c7be6128` and the 187-13 record `ced29ef11` that followed add `.planning/` files only. The real index was not touched (`git diff --cached --quiet` exit 0).
- **The commit:** `git commit-tree "$GREEN_TREE" -p "$GREEN_PARENT" -m "deploy: staging"` exit 0, then `git update-ref refs/evidence/187/green "$GREEN_COMMIT"` exit 0.
- **No planning path:** `git ls-tree -r --name-only "$GREEN_COMMIT"` was written to `green-paths.txt` (exit 0, 3320 paths), and `awk -F/ '$1 == ".planning"'` counts 0.
- **The first build attempt was void, and not because of the archive:** `attempt1/green-build.log` failed at step `#2 [internal] load metadata for docker.io/library/node:24-alpine` with `DeadlineExceeded: context deadline exceeded`, before any build work.
  - The Docker client's credential helper (`docker-credential-desktop get`) did not answer at the time.
  - The host reached the registry (HTTP 401 in 0.38 s), and a container started from a local image resolved it and got 401 too.
  - A plain `docker pull --platform linux/arm64 node:24-alpine` (`pull.log`, `pull.status` 0) later finished on its own, `Downloaded newer image`.
  - No process was killed and the Docker client configuration was not changed.
- **The build of record (C-02 control), `attempt2/`:** the script's archive context and build flags (`infra/scripts/build-push-image.sh` `make_context` and `build_and_push`), with the registry tag and `--load` replaced by a cache-only output.
  - `git archive --format=tar -o <tmp>/green.tar "$GREEN_COMMIT"` exit 0, and extraction into an empty `<tmp>/context` exit 0.
  - In the background: `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=395b71c712f9af6a80512625f2b38baf93167c1a --provenance=false --sbom=false -f <tmp>/context/apps/frontend/Dockerfile --output type=cacheonly --progress=plain <tmp>/context` (`attempt2/green-build.log`, status in `attempt2/green-build.status`) exit 0.
  - Step `#19 [production 2/2] RUN yarn workspace @openvaa/frontend build` ended `DONE 11.2s`. The temporary directory was removed after the build.

### The red commit (Task 3, re-run)

```
RED_TREE_SUPERSEDED=154717e0ed840739539376f4cdeee21e1f73be67
RED_COMMIT_SUPERSEDED=700c18362ff260a8a0e77303e464db2deef7d60a
RED_DIFF_PATHS_SUPERSEDED=apps/frontend/src/routes/+layout.ts
RED_LOCAL_BUILD_EXIT_SUPERSEDED=1
RED_FAILED_AT_FRONTEND_BUILD_SUPERSEDED=yes
RED_FAILING_DOCKER_STEP_SUPERSEDED=shared 2/2 RUN yarn build (Dockerfile line 28), turbo task @openvaa/frontend#build
RED_NAMES_MISSING_MODULE_SUPERSEDED=yes
WORKING_TREE_UNCHANGED_SUPERSEDED=yes
BUILDER_CACHE_PRUNED_SUPERSEDED=yes
```

- **Date:** 2026-11-15 (UTC). The commit was written at 21:07:55Z. The build ran from 21:08:02Z to 21:10:54Z.
- **The commit:** a new temporary index under the session scratch directory, removed afterwards.
  - `git read-tree refs/evidence/187/green` exit 0, the new green commit `395b71c71`.
  - A blob of the line `import '$lib/does-not-exist-187-red';` followed by the unchanged content of `apps/frontend/src/routes/+layout.ts` at that commit, written with `git hash-object -w --stdin`. It is `8ccc60be8f1696621812d5e7f8084f403b708aa7`, the same blob as before, because the review fixes did not touch the file.
  - `git update-index --cacheinfo 100644,<blob>,apps/frontend/src/routes/+layout.ts` exit 0, `git write-tree` exit 0.
  - `git commit-tree "$RED_TREE" -p 340a200708c28fb7ed078d452138712f3400c789 -m "deploy: a build broken on purpose, never merged"` exit 0. The parent is Task 2's `GREEN_PARENT`.
  - `git update-ref refs/evidence/187/red "$RED_COMMIT"` exit 0.
- **One path:** `git diff-tree -r --name-only refs/evidence/187/green "$RED_COMMIT"` prints the one path `apps/frontend/src/routes/+layout.ts`. `git diff --stat` reports `1 file changed, 1 insertion(+)`.
- **The build:** the same archive build as Task 2, in the background (`attempt2/red-build.log`, status in `attempt2/red-build.status`).
  - `git archive` exit 0 and extraction exit 0. `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=700c18362ff260a8a0e77303e464db2deef7d60a --provenance=false --sbom=false -f <tmp>/context/apps/frontend/Dockerfile --output type=cacheonly --progress=plain <tmp>/context` exit 1.
  - `yarn install --immutable` (`#13`) completed.
  - The step that failed is `#15 [shared 2/2] RUN yarn build`. Its turbo run reports `Failed: @openvaa/frontend#build` (`Tasks: 13 successful, 14 total`), after the frontend's vite build printed `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red` for `import "$lib/does-not-exist-187-red";`.
  - The build ended `ERROR: failed to build: failed to solve: process "/bin/sh -c yarn build" did not complete successfully: exit code: 1`.
  - That is the same step and the same failing task as the first red build, for the reason stated there: the frontend's own build runs inside the shared stage's turbo build, and nothing before it failed.
- **The working tree:** `git status --porcelain` lists only the untracked `.planning/workstreams/deployment/.verification-ledger.json`. `git diff --quiet -- apps/frontend/src/routes/+layout.ts` exit 0. Neither the working tree nor the real index was touched.
- **The builder cache:** `docker builder prune -af` exit 0 (`attempt2/builder-prune.status`), `Total: 4.897GB` reclaimed. `docker system df` then shows `Build Cache 0 0 0B 0B`.

### Nothing pushed, from local refs alone (re-run)

- `git for-each-ref --contains 395b71c712f9af6a80512625f2b38baf93167c1a --format='%(refname)'` prints exactly `refs/evidence/187/green`.
- `git for-each-ref --contains 700c18362ff260a8a0e77303e464db2deef7d60a --format='%(refname)'` prints exactly `refs/evidence/187/red`.

The superseded commits `69d10a723` and `4d4624315` are no longer held by any ref. They were never pushed.

## Re-run 2026-11-16 (plan 187-26)

Recorded 2026-11-16 (UTC) by the plan executor of plan 187-26, after Tasks 1 to 3 of that plan changed `tests/tests/utils/deployedTarget.test.ts`, `infra/scripts/push-migrations.sh`, `infra/scripts/push-migrations.test.ts`, `.github/workflows/main.yaml` and added `infra/scripts/main-e2e-workflow.test.ts`. The 2026-11-15 re-run's lines above are renamed `*_SUPERSEDED=`, so each line a verify reads has exactly one current value; plan 187-18 reads the red commit from the lines below. Logs are in `tmp/187-26/commits/` (ignored). Nothing was pushed, no registry was signed in to, no image was tagged for a registry, and the one remote read of the plan so far is `git ls-remote` of the target branch.

### The green commit (Task 2, re-run 2026-11-16)

```
GREEN_TREE_SUPERSEDED=81bc87981fce519fe86efdc7fade95df939213cf
GREEN_COMMIT_SUPERSEDED=102202f7a162cb8a67d31cc50f7692a22e015ab7
GREEN_PARENT_SUPERSEDED=340a200708c28fb7ed078d452138712f3400c789
GREEN_PATHS_SUPERSEDED=3321
GREEN_PLANNING_PATHS_SUPERSEDED=0
GREEN_LOCAL_BUILD_EXIT_SUPERSEDED=0
GREEN_BUILD_MINUTES_SUPERSEDED=4.3
GREEN_BUILT_FROM_HEAD_SUPERSEDED=27ee4fcea49b699ba3d8246e58ecf290fb818473
GREEN_BUILD_ATTEMPTS_SUPERSEDED=1
```

- **Date:** the commit was written at 08:22:43Z, from HEAD `27ee4fcea`, the `GATES_HEAD` of `187-26-ci-closure.md`. The build ran from 08:25:18Z to 08:29:34Z (256 s).
- **The parent, without a remote read:** `git rev-parse --verify refs/remotes/origin/main` printed `340a200708c28fb7ed078d452138712f3400c789`. There was no `git fetch`.
- **The tree:** a temporary index under the session scratch directory, removed afterwards. `git read-tree HEAD` exit 0, `git rm -r --cached --quiet .planning` exit 0, `git write-tree` exit 0. `git diff --quiet HEAD <commit> -- . ':!.planning'` exit 0. The real index was not touched (`git diff --cached --quiet` exit 0). One path more than the 2026-11-15 green commit: `infra/scripts/main-e2e-workflow.test.ts`.
- **The commit:** `git commit-tree "$GREEN_TREE" -p "$GREEN_PARENT" -m "deploy: staging"` exit 0, then `git update-ref refs/evidence/187/green "$GREEN_COMMIT"` exit 0.
- **No planning path:** `git ls-tree -r --name-only "$GREEN_COMMIT"` lists 3321 paths, and `awk -F/ '$1 == ".planning"'` counts 0.
- **The build:** `git archive --format=tar` of the commit exit 0, extraction into an empty directory exit 0, and in the background `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=102202f7a162cb8a67d31cc50f7692a22e015ab7 --provenance=false --sbom=false -f <tmp>/context/apps/frontend/Dockerfile --output type=cacheonly --progress=plain <tmp>/context` exit 0 (`green-build.log`, `green-build.status`). `#15 [shared 2/2] RUN yarn build` ended `DONE 207.8s` and `#19 [production 2/2] RUN yarn workspace @openvaa/frontend build` `DONE 17.0s`.

### The red commit (Task 3, re-run 2026-11-16)

```
RED_TREE_SUPERSEDED=e89347de20dc0a8d76d0ebf8db3c74d9898720d2
RED_COMMIT_SUPERSEDED=34d7b211db38003e988cd4600cc7b7283341733c
RED_DIFF_PATHS_SUPERSEDED=apps/frontend/src/routes/+layout.ts
RED_LOCAL_BUILD_EXIT_SUPERSEDED=1
RED_FAILED_AT_FRONTEND_BUILD_SUPERSEDED=yes
RED_FAILING_DOCKER_STEP_SUPERSEDED=shared 2/2 RUN yarn build (Dockerfile line 28), turbo task @openvaa/frontend#build
RED_NAMES_MISSING_MODULE_SUPERSEDED=yes
WORKING_TREE_UNCHANGED_SUPERSEDED=yes
BUILDER_CACHE_PRUNED_SUPERSEDED=yes
```

- **The commit:** a new temporary index under the session scratch directory, removed afterwards. `git read-tree refs/evidence/187/green` exit 0. A blob of the line `import '$lib/does-not-exist-187-red';` followed by the unchanged content of `apps/frontend/src/routes/+layout.ts` at the green commit, written with `git hash-object -w --stdin`: `8ccc60be8f1696621812d5e7f8084f403b708aa7`, the same blob as on 2026-11-15. `git update-index --cacheinfo`, `git write-tree`, then `git commit-tree "$RED_TREE" -p 340a200708c28fb7ed078d452138712f3400c789 -m "deploy: a build broken on purpose, never merged"` and `git update-ref refs/evidence/187/red`, each exit 0. The commit was written at 08:23:03Z.
- **A first red commit was discarded before any build.** The first attempt's `git show "$G:apps/…"` was read by zsh as a path modifier on `$G`, so its blob held the import line alone (`git diff --stat` showed `1 insertion(+), 52 deletions(-)`). That commit, `4d8658250`, was never built or pushed, and `refs/evidence/187/red` was moved to the commit above in the same minute. No ref holds it.
- **One path:** `git diff-tree -r --name-only refs/evidence/187/green refs/evidence/187/red` prints the one path `apps/frontend/src/routes/+layout.ts`, and `git diff --stat` reports `1 file changed, 1 insertion(+)`.
- **The build:** the same archive build, in the background, from 08:29:45Z to 08:33:12Z, exit 1. `yarn install --immutable` (`#13`) completed. `#15 [shared 2/2] RUN yarn build` failed: the frontend's vite build printed `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red` for `import "$lib/does-not-exist-187-red";`, turbo reported `Tasks: 13 successful, 14 total` and `Failed: @openvaa/frontend#build`, and the build ended `ERROR: failed to build: failed to solve: process "/bin/sh -c yarn build" did not complete successfully: exit code: 1`.
- **The working tree:** `git status --porcelain` lists only this plan's two modified evidence files and the untracked ledger; `git diff --quiet -- apps/frontend/src/routes/+layout.ts` exit 0. Neither the working tree outside `.planning/` nor the real index was touched.
- **The builder cache:** `docker builder prune -af` exit 0 (`builder-prune.status`), `Total: 4.897GB` reclaimed; `docker system df` then shows `Build Cache 0 0 0B 0B`.

### Nothing pushed, from local refs alone (re-run 2026-11-16)

- `git for-each-ref --contains 102202f7a162cb8a67d31cc50f7692a22e015ab7 --format='%(refname)'` prints exactly `refs/evidence/187/green`.
- `git for-each-ref --contains 34d7b211db38003e988cd4600cc7b7283341733c --format='%(refname)'` prints exactly `refs/evidence/187/red`.

The 2026-11-15 commits `395b71c71` (pushed as `ci-evidence/187-final` for run 43817899191) and `700c18362` (never pushed) are no longer held by an `refs/evidence/187/*` ref.

## Re-run 2026-11-16 (plan 187-27)

Recorded 2026-11-16 (UTC) by the plan executor of plan 187-27, on the branch as rebased that day onto the -gsd stream. Every id in the superseded sections above names a commit of the pre-rebase history, `backup/deployment-pre-rebase-20261116`, and those lines are left as they were apart from the `*_SUPERSEDED=` rename of the 2026-11-16 (plan 187-26) section, so that each line a verify reads has exactly one current value; plan 187-18 reads the red commit from the lines below. Logs are in `tmp/187-27/commits/` (ignored). Nothing was pushed, no registry was signed in to, and no image was tagged for a registry.

### The green commit (Task 2, re-run 2026-11-16, plan 187-27)

```
GREEN_TREE_SUPERSEDED=6de8539cf8f28bd2eeb835753e041ddcaec44d27
GREEN_COMMIT_SUPERSEDED=2b0842fd46bf6f26dfa6dad009a13b2297197b30
GREEN_PARENT_SUPERSEDED=340a200708c28fb7ed078d452138712f3400c789
GREEN_PATHS_SUPERSEDED=3533
GREEN_PLANNING_PATHS_SUPERSEDED=0
GREEN_LOCAL_BUILD_EXIT_SUPERSEDED=0
GREEN_BUILD_MINUTES_SUPERSEDED=1.5
GREEN_BUILT_FROM_HEAD_SUPERSEDED=fabe70c1b4b9493eb181d3cc7cd139b8e004a8a4
GREEN_BUILD_ATTEMPTS_SUPERSEDED=1
```

- **The tree and the commit** (`tmp/187-27/commits/make-commits.sh`). The parent is `git rev-parse --verify refs/remotes/origin/main`, with no fetch. In a temporary index under the session scratch directory, removed afterwards: `git read-tree HEAD`, `git rm -r --cached --quiet .planning`, `git write-tree`, then `git commit-tree "$GREEN_TREE" -p "$GREEN_PARENT" -m "deploy: staging"` and `git update-ref refs/evidence/187/green`, each exit 0, written at 18:52Z from HEAD `fabe70c1b`. `git diff --quiet HEAD <commit> -- . ':!.planning'` exit 0; the real index untouched (`git diff --cached --quiet` exit 0). `git ls-tree -r --name-only` lists 3533 paths and none under `.planning/`.
- **The build:** `git archive --format=tar` of the commit exit 0, extraction exit 0, and in the background `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=<commit> --provenance=false --sbom=false -f <tmp>/context/apps/frontend/Dockerfile --output type=cacheonly --progress=plain <tmp>/context` exit 0, 18:52:21Z to 18:53:51Z (90 s). `#15 [shared 2/2] RUN yarn build` `DONE 43.4s`, `#19 [production 2/2] RUN yarn workspace @openvaa/frontend build` `DONE 13.9s`.

### The red commit (Task 3, re-run 2026-11-16, plan 187-27)

```
RED_TREE_SUPERSEDED=7d816493407973dbbbd6279e31817151f8a2ced3
RED_COMMIT_SUPERSEDED=3e03b96481149573ac168d78201513335104ea22
RED_DIFF_PATHS_SUPERSEDED=apps/frontend/src/routes/+layout.ts
RED_LOCAL_BUILD_EXIT_SUPERSEDED=1
RED_FAILED_AT_FRONTEND_BUILD_SUPERSEDED=yes
RED_FAILING_DOCKER_STEP_SUPERSEDED=shared 2/2 RUN yarn build, turbo task @openvaa/frontend#build
RED_NAMES_MISSING_MODULE_SUPERSEDED=yes
WORKING_TREE_UNCHANGED_SUPERSEDED=yes
BUILDER_CACHE_PRUNED_SUPERSEDED=yes
```

- **The commit:** a second temporary index, removed afterwards. `git read-tree refs/evidence/187/green`; a blob of the line `import '$lib/does-not-exist-187-red';` followed by the green commit's unchanged `apps/frontend/src/routes/+layout.ts`, written with `git hash-object -w --stdin` (`8ccc60be8f1696621812d5e7f8084f403b708aa7`, the same blob as on 2026-11-15 and in plan 187-26, since the file did not change); `git update-index --cacheinfo`, `git write-tree`, `git commit-tree "$RED_TREE" -p 340a20070 -m "deploy: a build broken on purpose, never merged"` and `git update-ref refs/evidence/187/red`, each exit 0. `git diff-tree -r --name-only refs/evidence/187/green refs/evidence/187/red` prints the one path, and `git diff --stat` reports `1 file changed, 1 insertion(+)`.
- **The build:** the same archive build, 18:53:53Z to 18:54:26Z, exit 1. `#15 [shared 2/2] RUN yarn build` failed: the frontend's vite build printed `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red` for `import "$lib/does-not-exist-187-red";`, and turbo reported `Tasks: 13 successful, 14 total` and `Failed: @openvaa/frontend#build`.
- **The working tree:** after both builds and the scan, `git status --porcelain` listed only this file (the rename above) and the untracked ledger, and `git diff --quiet -- apps/frontend/src/routes/+layout.ts` exit 0.
- **The builder cache:** `docker builder prune -af` exit 0, `Total: 4.903GB` reclaimed; `docker system df` then shows `Build Cache 0 0 0B 0B`.

### Nothing pushed, from local refs alone (re-run 2026-11-16, plan 187-27)

- `git for-each-ref --contains 2b0842fd46bf6f26dfa6dad009a13b2297197b30 --format='%(refname)'` prints exactly `refs/evidence/187/green`.
- `git for-each-ref --contains 3e03b96481149573ac168d78201513335104ea22 --format='%(refname)'` prints exactly `refs/evidence/187/red`.

The plan 187-26 commits `102202f7a` (pushed as `ci-evidence/187-final-2` for run 43839245785) and `34d7b211d` (never pushed) are no longer held by a `refs/evidence/187/*` ref.

## Re-run 2026-11-16 (plan 187-28)

Recorded 2026-11-16 (UTC) by the plan executor of plan 187-28, on the branch as rebased onto the -gsd fix branch `fix/v2.16-ci-e2e` at `cecf649d8`. The -infra ids of the superseded sections above name pre-rebase history (`backup/deployment-pre-rebase-20261116` and `backup/infra-pre-rebase-2026-11-17`), while the green commits `102202f7a` and `2b0842fd4` are rooted on `origin/main` and exist on origin; the lines of the 2026-11-16 (plan 187-27) section are renamed `*_SUPERSEDED=` so that each line a verify reads has exactly one current value. Plan 187-18 reads the red commit from the lines below. Logs are in `tmp/187-28/commits/` (ignored). Nothing was pushed, no registry was signed in to, and no image was tagged for a registry.

### The green commit (Task 2, re-run 2026-11-16, plan 187-28)

```
GREEN_TREE=a9d648e87d3e075e1dafc650f2c5030afdda29fb
GREEN_COMMIT=68a54299aa81b2a2f95fd2151031ab4e624ef01c
GREEN_PARENT=340a200708c28fb7ed078d452138712f3400c789
GREEN_PATHS=3533
GREEN_PLANNING_PATHS=0
GREEN_LOCAL_BUILD_EXIT=0
GREEN_BUILD_MINUTES=1.2
GREEN_BUILT_FROM_HEAD=246f5dc8b06df4f9e51e3066e4c93c355c3cf413
GREEN_BUILD_ATTEMPTS=1
```

- **The tree and the commit** (`tmp/187-28/commits/make-commits.sh`, in the background, exit 0). The parent is `git rev-parse --verify refs/remotes/origin/main`, with no fetch. In a temporary index under the session scratch directory, removed afterwards: `git read-tree HEAD`, `git rm -r --cached --quiet .planning`, `git write-tree`, then `git commit-tree "$GREEN_TREE" -p "$GREEN_PARENT" -m "deploy: staging"` and `git update-ref refs/evidence/187/green`, each exit 0, written at 23:36:50Z from HEAD `246f5dc8b`. `git diff --quiet HEAD <commit> -- . ':!.planning'` exit 0; the real index untouched (`git diff --cached --quiet` exit 0). `git ls-tree -r --name-only` lists 3533 paths and none under `.planning/`.
- **The build:** `git archive --format=tar` of the commit exit 0, extraction exit 0, and in the background `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=<commit> --provenance=false --sbom=false -f <tmp>/context/apps/frontend/Dockerfile --output type=cacheonly --progress=plain <tmp>/context` exit 0, 23:36:51Z to 23:38:04Z (73 s). `#15 [shared 2/2] RUN yarn build` `DONE 41.5s`, `#19 [production 2/2] RUN yarn workspace @openvaa/frontend build` `DONE 10.4s`.

### The red commit (Task 3, re-run 2026-11-16, plan 187-28)

```
RED_TREE=20756a2dec61b17bab3dafecbc020c4d0f1510c0
RED_COMMIT=3250ba0e8e964f8c87c03459f812bd935637272b
RED_DIFF_PATHS=apps/frontend/src/routes/+layout.ts
RED_LOCAL_BUILD_EXIT=1
RED_FAILED_AT_FRONTEND_BUILD=yes
RED_FAILING_DOCKER_STEP=shared 2/2 RUN yarn build, turbo task @openvaa/frontend#build
RED_NAMES_MISSING_MODULE=yes
RED_BUILD_ATTEMPTS=2 (the first void: the Docker VM's memory, see 187-28-ci-closure.md § The void red build)
WORKING_TREE_UNCHANGED=yes
BUILDER_CACHE_PRUNED=yes
```

- **The commit:** a second temporary index, removed afterwards. `git read-tree <green commit>`; a blob of the line `import '$lib/does-not-exist-187-red';` followed by the green commit's unchanged `apps/frontend/src/routes/+layout.ts`, written with `git hash-object -w --stdin` (`8ccc60be8f1696621812d5e7f8084f403b708aa7`, the same blob as on 2026-11-15 and in plans 187-26 and 187-27, since the file did not change); `git update-index --cacheinfo`, `git write-tree`, `git commit-tree "$RED_TREE" -p 340a20070 -m "deploy: a build broken on purpose, never merged"` and `git update-ref refs/evidence/187/red`, each exit 0. `git diff-tree -r --name-only refs/evidence/187/green refs/evidence/187/red` prints the one path, and `git diff --stat` reports `1 file changed, 1 insertion(+)`.
- **The build.** The first attempt (23:38:05Z to 23:38:15Z, exit 102) failed at `yarn install` with `cannot allocate memory`, before the step under test, and was ruled void by the orchestrator; it is not counted (`187-28-ci-closure.md` § The void red build). The counted attempt was made by the orchestrator at top level, after `yarn db:stop` of this checkout's stack: the same archive build, 23:40:13Z to 23:40:39Z, exit 1. `#15 [shared 2/2] RUN yarn build` failed: the frontend's vite build printed `error during build:` and `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red` at `src/routes/+layout.ts:1:8` for `import "$lib/does-not-exist-187-red";`, turbo reported `Tasks: 13 successful, 14 total` and `Failed: @openvaa/frontend#build`, and the step ended `ERROR: process "/bin/sh -c yarn build" did not complete successfully: exit code: 1`. `yarn db:start` followed, exit 0.
- **The working tree:** after both builds and the scan, `git status --porcelain` listed only this plan's evidence edits and the untracked ledger, and `git diff --quiet -- apps/frontend/src/routes/+layout.ts` exit 0.
- **The builder cache:** `docker builder prune -af` exit 0, `Total: 4.903GB` reclaimed; `docker system df` then shows `Build Cache 0 0 0B 0B`.

### Nothing pushed, from local refs alone (re-run 2026-11-16, plan 187-28)

- `git for-each-ref --contains 68a54299aa81b2a2f95fd2151031ab4e624ef01c --format='%(refname)'` prints exactly `refs/evidence/187/green`.
- `git for-each-ref --contains 3250ba0e8e964f8c87c03459f812bd935637272b --format='%(refname)'` prints exactly `refs/evidence/187/red`.

The plan 187-27 commits `2b0842fd4` (pushed as `ci-evidence/187-final-3` for run 43938990256) and `3e03b9648` (never pushed) are no longer held by a `refs/evidence/187/*` ref.
