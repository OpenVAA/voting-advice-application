# 187-26 evidence: closing run 43817899191's red jobs at their causes

Repository `OpenVAA/voting-advice-application`, branch `feat/deployment-terraform-supabase`. Read and written by the plan executor from this checkout, 2026-11-16. Remote reads were `gh api` GETs and `git ls-remote` only. Nothing was pushed, and no GitHub, AWS or Supabase setting was read or changed. Logs and status files are under `tmp/187-26/` (ignored).

## Operator rulings of 2026-11-16, as given

- **B-02 override:** the two steps added to `main.yaml`'s existing `e2e-tests` job (the Edge Functions env template copy before "Start Supabase", and the `if: failure()` edge-runtime log dump) are approved.
- **G-05 override:** rewriting the user-info fixtures in `tests/tests/utils/deployedTarget.test.ts` is approved; the exclusion-file entry stays a fallback only.
- **The closing full E2E run** is made with the developer's untracked `apps/supabase/supabase/functions/.env` moved aside (never read, never printed, never listed) and restored afterwards with the edge runtime restarted, exactly as Task 5 specifies. If any move or restore command is refused by a hook or the permission system, the executor stops at once, leaves the file wherever it safely is, and reports the exact command and the file's location.
- **The push** was approved in advance by the operator, conditionally; it is Task 6's business (the orchestrator's), not the executor's.

## Task 1: the secret scan, reproduced locally at 3.97.9, then 0 on the fixed tree

```
SCAN_TOOL_VERSION=3.97.9
SCAN_IMAGE_DIGEST=ghcr.io/trufflesecurity/trufflehog@sha256:52e67fef4d054ecff5c2ce4b4ae376626d1ef54aa0898b53cac19c25e92e14db
SCAN_ARGS_FROM_ACTION=yes
SCAN_BASE=340a200708c28fb7ed078d452138712f3400c789
SCAN_BASELINE_HEAD=395b71c712f9af6a80512625f2b38baf93167c1a
SCAN_BASELINE_EXIT=183
SCAN_BASELINE_RESULTS=3
SCAN_BASELINE_FINDING=tests/tests/utils/deployedTarget.test.ts:603 detector=URI verified=false
SCAN_BASELINE_FINDING=tests/tests/utils/deployedTarget.test.ts:604 detector=URI verified=false
SCAN_BASELINE_FINDING=tests/tests/utils/deployedTarget.test.ts:603 detector=URI verified=false
SCAN_THIRD_RESULT=a second URI result at tests/tests/utils/deployedTarget.test.ts:603, same commit, unverified; the --github-actions printer writes one annotation per file and line, so CI and the local run each showed 2 annotations for 3 results
EXCLUSION_ADDED=none
FIXTURE_TESTS_BEFORE=118
FIXTURE_TESTS_AFTER=118
NEGATIVE_CONTROL_FAILED=2
NEGATIVE_CONTROL_RESTORED=yes
FIXTURE_FIX_COMMIT=02a1530b209d9eb11dcce0955a21b8c4b65bb62b
SCAN_PROBE_HEAD=e9e50bf88e155f9163c83277421475028d01f502
SCAN_PROBE_TREE=63ccb45bff21138dd891a677c31e0ab3fa8e770f
SCAN_AFTER_EXIT=0
SCAN_AFTER_RESULTS=0
SCAN_PROBE_REF_DELETED=yes
```

How each line was read:

- **The command.** `gh api 'repos/trufflesecurity/trufflehog/contents/action.yml?ref=v3.97.9' --jq .content | base64 -d` exit 0. The action's run step is `docker run --rm -v .:/tmp -w /tmp "${IMAGE}:${VERSION}" git file:///tmp/ --since-commit ${BASE} --branch ${HEAD} --fail --no-update --github-actions ${ARGS}`, with `IMAGE` defaulting to `ghcr.io/trufflesecurity/trufflehog`. The local command is that line verbatim, with `VERSION=3.97.9`, `HEAD` the scanned commit's SHA, and `ARGS` main.yaml's `extra_args`: `--config=.github/trufflehog-openvaa.yml --exclude-paths=.github/trufflehog-exclude-paths.txt`. `docker pull ghcr.io/trufflesecurity/trufflehog:3.97.9` exit 0; `--version` printed `trufflehog 3.97.9`; the digest is from `docker image inspect --format '{{json .RepoDigests}}'`. The script is `tmp/187-26/scan.sh`.
- **The scan repository.** For each scan, `git init` under `tmp/187-26/scan/<label>/`, then `git fetch` from this checkout's own path of `refs/remotes/origin/main` and the head, and `git checkout` of the head. The directory was removed after each scan, and `tmp/187-26/scan/` itself after the last.
- **Baseline.** Head `395b71c71`, base `340a20070`. The `--github-actions` run exited 183, the code CI's step exited with. Its summary line reads `"verified_secrets": 0, "unverified_secrets": 3` over 3779 chunks, CI's exact numbers. Its two annotations name `deployedTarget.test.ts` lines 603 and 604, as CI's did. The `--json` run, to a file in a mode-700 `mktemp -d` directory, also exited 183. `jq` selected only `.SourceMetadata.Data.Git.file`, `.line`, `.commit`, `.DetectorName` and `.Verified`, giving the three finding lines above, all at commit `395b71c71`. Then the directory was deleted, unread otherwise. No raw or redacted field was selected, and no matched text was printed or kept.
- **The fix.** In `tests/tests/utils/deployedTarget.test.ts`, the four fixtures holding a user, a colon and an `@` after the scheme separator (the deployed setup's user-info `baseURL`, and the `gateTargetLine` rows for a user and a password, a password alone, and a space in the host) are now built by one helper, `httpsWithUserInfo(userInfo, rest)`, which returns `` `https://${userInfo}@${rest}` ``. No source line now holds a whole user-info URL: `grep -cE '://[^/ ]*:[^/ ]*@'` over the file counts 0, where HEAD counted 4. A node comparison (`tmp/187-26/compare-fixtures.mjs`) of HEAD's four literals with the four reconstructed calls printed `old=4 new=4 equal`, so every string that reaches `gateTargetLine` or the setup is byte-identical. The two "user alone" fixtures carry no colon, are not URI findings, and are left as they are. No exclusion was needed.
- **Same test.** `vitest run --config tests/vitest.config.ts --reporter=verbose deployedTarget.test.ts` printed `Tests 118 passed (118)` before (exit 0) and after (exit 0). Prettier and ESLint on the file exited 0.
- **Negative control.** With the one line `url.password = '';` of `gateTargetLine` in `tests/tests/utils/deployedTarget.ts` deleted, the file exited 1 with `Tests 2 failed | 116 passed (118)`: "withholds user info made of a user and a password" and "withholds user info made of a password alone". `git checkout -- tests/tests/utils/deployedTarget.ts`, then `git diff --quiet` on it exit 0.
- **After.** The probe commit is HEAD `02a1530b2`'s tree without `.planning/`, written in a temporary index (`read-tree HEAD`, `rm -r --cached .planning`, `write-tree`), with parent `340a20070` and message `deploy: staging`, held by `refs/evidence/187/scan-probe`; its tree has 0 planning paths and the real index stayed clean. Scanned as above: both runs exit 0, `"verified_secrets": 0, "unverified_secrets": 0` over 3780 chunks, no annotation, no JSON result. `git update-ref -d refs/evidence/187/scan-probe`, then `git show-ref --quiet` on it exit 1.
