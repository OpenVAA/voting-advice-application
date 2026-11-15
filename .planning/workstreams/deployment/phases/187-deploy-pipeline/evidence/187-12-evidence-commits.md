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

