# 187-12 evidence: the two evidence commits and their local build proofs

Recorded 2026-11-15 (UTC) by the plan executor, from this checkout. Logs are in `tmp/187-gates/187-12/` (ignored). Nothing was pushed, no registry was signed in to, no image was tagged for a registry, and no remote or hosted service was read: the parent comes from the local remote-tracking ref, and the builds' only downloads were the base image and the packages `yarn install --immutable` takes from the committed lockfile.

## The green commit (Task 2)

```
GREEN_TREE=fa16b0c68a9d32835f811344393d2bb31a173c9b
GREEN_COMMIT=69d10a72357e149c1c35a7002d7779233ffc4d44
GREEN_PARENT=340a200708c28fb7ed078d452138712f3400c789
GREEN_PATHS=3320
GREEN_PLANNING_PATHS=0
GREEN_LOCAL_BUILD_EXIT=0
GREEN_BUILD_MINUTES=3.4
```

- **Date:** 2026-11-15 (UTC), commit written 03:17Z, build 03:18:11Z to 03:21:34Z (203 s).
- **The parent, without a remote read.** `git rev-parse --verify refs/remotes/origin/main` exit 0: `340a200708c28fb7ed078d452138712f3400c789`, the commit origin's `main` named at the last fetch (the same parent plan 185-12 used). No `git fetch` and no `git ls-remote` was run.
- **The tree.** In a temporary index under the session scratch directory (`GIT_INDEX_FILE=$(mktemp)`, removed afterwards): `git read-tree HEAD` exit 0 (HEAD `e5bb3601e`, the Task 1 evidence commit), `git rm -r --cached --quiet .planning` exit 0, `git write-tree` exit 0. `git diff --quiet HEAD <commit> -- . ':!.planning'` exit 0: the tree is HEAD's outside `.planning/`, which is the tree the Task 1 gates ran on (that commit only added a `.planning/` file). The real index and the working tree were not touched (`git diff --cached --quiet` exit 0, `git status --porcelain` empty).
- **The commit.** `git commit-tree "$GREEN_TREE" -p "$GREEN_PARENT" -m "deploy: staging"` exit 0, with the author date set to `2026-11-15T03:20:00Z` through `GIT_AUTHOR_DATE` (the committer date is the moment of writing); `git update-ref refs/evidence/187/green "$GREEN_COMMIT"` exit 0.
- **No planning path.** `git ls-tree -r --name-only "$GREEN_COMMIT"` written to `green-paths.txt` (exit 0, 3320 paths); `awk -F/ '$1 == ".planning"'` counts 0 and `grep -c '^\.planning/'` counts 0 (exit 1, no match).
- **The build (C-02 control).** The script's archive context and build flags (`infra/scripts/build-push-image.sh` `make_context` and `build_and_push`), with the registry tag and `--load` replaced by a cache-only output: `git archive --format=tar -o <tmp>/green.tar "$GREEN_COMMIT"` exit 0, extracted into an empty `<tmp>/context` exit 0, then, in the background, `docker buildx build --platform linux/arm64 --target production --build-arg BUILD_SHA=69d10a72357e149c1c35a7002d7779233ffc4d44 --provenance=false --sbom=false -f <tmp>/context/apps/frontend/Dockerfile --output type=cacheonly --progress=plain <tmp>/context` (`green-build.log`, status in `green-build.status`): exit 0. Its step `#19 [production 2/2] RUN yarn workspace @openvaa/frontend build` ended `DONE 10.9s`. The archive holds only the commit's tracked files, so the Dockerfile needs no ignored or untracked file. The temporary directory was removed after the build.

## The red commit (Task 3)

```
RED_TREE=bbf466d2f18b5adf94a193a01b85ac3d1ea12c68
RED_COMMIT=4d4624315ef323b5f8bb712eebada6b394ee1074
RED_DIFF_PATHS=apps/frontend/src/routes/+layout.ts
RED_LOCAL_BUILD_EXIT=1
RED_FAILED_AT_FRONTEND_BUILD=yes
RED_FAILING_DOCKER_STEP=shared 2/2 RUN yarn build (Dockerfile line 28), turbo task @openvaa/frontend#build
RED_NAMES_MISSING_MODULE=yes
WORKING_TREE_UNCHANGED=yes
BUILDER_CACHE_PRUNED=yes
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
