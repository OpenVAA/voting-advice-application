---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "12"
subsystem: infra
status: complete
tags: [aws, ecr, image, immutable-tags, health, runbook, deploy-evidence]
requires:
  - phase: 185-01
    provides: RULING_PUSH=deploy-evidence
  - phase: 185-10
    provides: the code gates green on the tree the image is built from
  - phase: 185-11
    provides: the parameters and the execution role, read back
provides:
  - the source-only commit 712947a1bd44a735f66ee8f51610f4748d76cd30 on origin as deploy-evidence/185-image
  - the image openvaa-frontend:712947a1bd44a735f66ee8f51610f4748d76cd30, linux/arm64, one manifest, digest sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
  - image_tag pinned in infra/envs/staging/aws/terraform.tfvars
  - evidence/185-12-image.md
affects: [185-13]
tech-stack:
  added: []
  patterns:
    - "In zsh a refspec is written \"${SHA}:refs/...\": \"$SHA:refs\" loses its `:r` to zsh's modifier syntax"
    - "A push refused for an immutable tag is found in the log by `tag invalid|immutable`; `already exists` matches the layer lines first"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-12-image.md
  modified:
    - infra/envs/staging/aws/terraform.tfvars
    - infra/envs/staging/aws/README.md
    - infra/bootstrap/README.md
key-decisions:
  - "The AWS runbook's five Step 4 rows were moved from 'Not yet observed' to dated Observations, as bootstrap's second-push row was, because all five were seen in this run"
  - "The first image, left untagged locally once the derived image took its tag, was removed by image id after its BUILD_SHA was checked, so no 2.6 GB dangling image stays on the workstation; the registry's copy is untouched"
requirements-completed: [INFRA-01]
duration: 12min
completed: 2026-11-12
estimate_ref:
  tokens: 22000
  tasks: 2
actuals:
  tokens: 8900
  tasks: 2
  commits: 3
plan_head_before: 25ec14e8103bcb1fadffc82f36368a1658d1addc
plan_head_after: a3ee3d7f059a95e42c2da6e62a3860c33865dc5d
---

# Phase 185 Plan 12: The image Summary

```
SOURCE_COMMIT=712947a1bd44a735f66ee8f51610f4748d76cd30
IMAGE_DIGEST=sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
```

One linux/arm64 image, a single manifest, built by `build-push-image.sh` from a source-only commit (HEAD's tree without `.planning`, parent `origin/main`) pushed to `deploy-evidence/185-image`. Its tag, its `BUILD_SHA`, the pushed commit and the `build` of its `/api/health` are one 40-character string. The registry refused a different image under that tag for immutability, and the staging tfvars now pin `image_tag` to the commit.

## What was done

- **Task 1 (tracer):** Step 4 items 1 to 7 and 10 of the staging AWS runbook, with `AWS_PROFILE=openvaa-admin` in `eu-north-1`, the account asserted 471112560111 before each AWS call. The tree was clean. The commit was built through a temporary index; its 3291 paths hold none under `.planning/`. The branch did not exist on `origin`, so the push was a first push with no lease, exit 0, and `git ls-remote origin` lists the commit once. The build from a detached worktree ran in the background, exit 0, about six minutes. The registry holds one image, manifest `application/vnd.docker.distribution.manifest.v2+json` with the script's digest; locally it is `arm64` with `BUILD_SHA` equal to the commit. Run locally with the four stand-in variables (the key a fake `stand-in`, the Supabase URL a closed port), `/api/health` answered 200, `status` `ok`, `build` equal to the tag. The verify was re-run as the tracer gate before expanding and exited 0.
- **Task 2:** items 8, 9 and 11. A derived `FROM … LABEL` image pushed under the same tag was refused, exit 1, with `tag invalid: The image tag '712947a1bd44a735f66ee8f51610f4748d76cd30' already exists in the 'openvaa-frontend' repository and cannot be overwritten because the tag is immutable.` The text names no registry host. The digest is unchanged and the repository still holds one image. The script run again printed `tag_exists=yes image_digest=<same>` and exited 3. The derived image, the untagged first image, the worktree and `$L` were removed. Dated rows were added to both runbooks' Observations.

## Verification

| Check | Exit |
| --- | --- |
| Task 1 verify (plan text, shell `grep`) | 0 |
| Task 1 verify (with `/usr/bin/grep`) | 0 |
| Task 1 acceptance: `git ls-tree -r --name-only <SOURCE_COMMIT>` to a file (exit 0), `grep -c '^\.planning/'` counts 0 | 0 lines |
| Task 2 verify 1 (record lines, no `dkr.ecr`), both greps | 0 |
| Task 2 verify 2 (Prettier check of both READMEs, bootstrap row gone from "Not yet observed") | 0 |
| `terraform fmt -check infra/envs/staging/aws` | 0 |

The plan's verify commands behaved the same under ugrep and `/usr/bin/grep`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Step 4 item 4's refspec breaks in zsh**
- **Found during:** Task 1
- **Issue:** `git push origin "$SHA:refs/heads/$B"` in zsh reads `:r` as a history modifier and drops it. The push named `<sha>efs/heads/deploy-evidence/185-image` and was refused with `src refspec … does not match any`, exit 1, nothing pushed.
- **Fix:** both pushes of item 4 write `"${SHA}:refs/heads/$B"`, with one sentence saying why. The push then went through.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** e39a98fe6

**2. [Rule 1 - Bug] Step 4 item 8's refusal search matches the wrong line**
- **Found during:** Task 2
- **Issue:** `grep -i -m1 -E 'immutable|already exists'` matched the first `eb7eb03ece1b: Layer already exists` line of the push log, not the refusal.
- **Fix:** the pattern is `tag invalid|immutable`, with a note on the layer lines. Re-run on the same log, it printed the refusal.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** a3ee3d7f0

**3. [Scope] The AWS runbook's Step 4 "Not yet observed" rows moved**
- The plan asked only for new Observations rows in the AWS runbook. Its "Not yet observed" section says a statement moves once seen, so its five Step 4 rows were moved, as bootstrap's was. Commit a3ee3d7f0.

**4. [Precondition note] Gates and HEAD's tree**
- Plan 185-10's gates ran on `633d09151`. HEAD's tree outside `.planning` differed from it only in `infra/bootstrap/README.md` and `infra/envs/staging/aws/README.md`, both Prettier-clean. The built source is the gated code.

## Pushes

- `deploy-evidence/185-image` on `origin`: did not exist before (no old tip). New tip `712947a1bd44a735f66ee8f51610f4748d76cd30`. First push, no force. The working branch and every `.planning/` commit stay local.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: evidence/185-12-image.md, infra/envs/staging/aws/terraform.tfvars (`image_tag` line)
- FOUND: commits e39a98fe6, dac8cf926, a3ee3d7f0 on HEAD
- FOUND: 712947a1bd44a735f66ee8f51610f4748d76cd30 on origin as refs/heads/deploy-evidence/185-image
