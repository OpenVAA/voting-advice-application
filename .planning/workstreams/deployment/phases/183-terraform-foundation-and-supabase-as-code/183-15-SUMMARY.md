---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 15
subsystem: infra
tags: [ci-evidence, github-actions, infra-validate, terraform, red-control, publication-manifest]
status: complete

requires:
  - phase: 183-11
    provides: "the infra-validate job in .github/workflows/main.yaml and the ci-evidence/** push trigger"
  - phase: 183-13
    provides: "the infra-validate local loop green on the finished tree"
  - phase: 183-01
    provides: "tools/attempt.sh (attempt files, reply screen, bound checks)"
provides:
  - "evidence/183-15-ci-evidence.md: the full publication manifest with whole-tree scan results, the operator's push confirmation, and both GitHub Actions runs of infra-validate read at job and step level without a credential"
  - "remote branches ci-evidence/183-infra-validate (b0c910e9f350465f83482ef31db3b7f55a4d3bc4) and ci-evidence/183-infra-validate-red (a58cb0ad73b659e73da9402d9ba3d1ff2eb94b2d), pushed by the operator"
affects: [183-27, phase-183-verification]

estimate:
  tokens: 58000
  tasks: 3
actuals:
  tokens: 78835    # chars/4 over the realized diff: evidence file 309771 chars + plan amendment 5568 changed chars
  tasks: 3
  commits: 4       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: 59d6affaeb5d5e150e634b069623e69d49a370a5
plan_head_after: a3558f239541b8b1ae6ca3f4019c4dbdbd485923

tech-stack:
  added: []
  patterns:
    - "Evidence commits built from a temporary GIT_INDEX_FILE (read-tree HEAD, drop .planning), parented on origin/main, pushed by the operator with an empty-lease --force-with-lease per branch"
    - "CI results read from the public REST API by head_sha with unauthenticated curl, at job and step level, never at run level"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-15-ci-evidence.md
  modified:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-15-PLAN.md

key-decisions:
  - "Follow-up 183-R6 answered with the ci-evidence/** push (A-10), not a draft pull request into main"
  - "Operator ruling 2026-10-21: the stop rules accept exactly four classified scan findings by path and kind (pem-to-jwk.ts header text, mock OIDC test key, vendored Yarn key-shaped substring, two unverified trufflehog URI test inputs)"

patterns-established:
  - "Read a CI job's evidence at job and step level: both runs concluded failure at run level because of secret-scan and dependency-audit, while infra-validate was green on the green tree"

requirements-completed: [SUPA-11]

coverage:
  - id: D1
    description: "infra-validate seen success in a real GitHub Actions run of the green evidence branch, dated, read at job level"
    requirement: SUPA-11
    verification:
      - kind: other
        ref: "https://github.com/OpenVAA/voting-advice-application/actions/runs/39591102824 (job 119191973141)"
        status: pass
  - id: D2
    description: "infra-validate seen failure on the tree broken on purpose, with the formatting and validation steps each failed, read at step level"
    requirement: SUPA-11
    verification:
      - kind: other
        ref: "https://github.com/OpenVAA/voting-advice-application/actions/runs/39591102968 (job 119191973249)"
        status: pass

duration: ~2h40m (first Task 1 attempt 08:46Z to run reading 11:23Z, including two operator checkpoints)
completed: 2026-10-21
---

# Phase 183 Plan 15: infra-validate seen in CI Summary

**`infra-validate` passed in GitHub Actions run 39591102824 on the published tree of this branch, and failed at both its formatting and its validation step in run 39591102968 on a tree broken on purpose. Both were read without a credential on 2026-10-21, and Terraform 1.16.5 in CI accepted the formatting written with 1.14.7.**

## Performance

- Started: 2026-10-21T08:46Z (first attempt of Task 1)
- Completed: 2026-10-21T11:25Z
- Tasks: 3 of 3, plus one plan amendment (the operator's ruling)
- Files changed: 2 (the evidence file, the plan)

## Accomplishments

- Task 1 built two commits, each parented on `origin/main`, from a temporary index that dropped `.planning/` and `.bg-shell`. It scanned the whole tree of each commit five ways and wrote a manifest with the complete list of 4192 changed paths. The second attempt rebuilt both commits after the operator's ruling.
- Task 2: the operator read the manifest, including the classification of the `token`-named `tfvars` variables (`enable_access_token_hook`, `rate_limit_token_refresh`, which are flags and a rate), did not object, and pushed both branches with empty leases (`s3_push_exit=0`, logs removed). The reply was stored through the helper's screen under attempt `15-2 20261021T105655Z.fd7f4c94d`. A credential-free `ls-remote` confirmed that both remote branches point at the manifest's commits.
- Task 3: read both runs from the public REST API by `head_sha`, with unauthenticated `curl` and no `gh`. Green: `infra-validate` was `success` and every step `success`. Red: `infra-validate` was `failure`, "Check Terraform formatting" `failure`, "Validate every Terraform root" `failure`, and "Check the settings types of the Supabase module" `success`. Both jobs had completed by the first reading, so no poll was needed.

## Task Commits

1. Task 1, first attempt (stopped on three scan findings): `567e744d0`
2. Plan amendment with the operator's ruling (2026-10-21): `18fdcd6ca`
3. Task 1, second attempt (rebuilt manifest, every finding accepted): `fd7f4c94d`
4. Tasks 2 and 3 (push confirmation, remote check, both runs): `a3558f239`

## Answers the plan asks for

- **Was a second push needed?** No. The operator pushed once. A second Task 1 attempt was needed before the push: the first attempt stopped on scan findings, and its commits (`b263b1cd…`/`514f4a3c…`) were never pushed.
- **Did the repository's secret scan run before the push?** Yes. trufflehog 3.95.2 ran on the workstation, while the workflow pins 3.97.9. Because trufflehog cannot open a linked worktree, it ran on a throwaway clone. It covered the range `origin/main`..green with the workflow's config and exclude files and exited 183, with 0 verified findings and 2 unverified `URI` findings, both accepted. CI's `secret-scan` job then concluded `failure` on both runs, as expected. Its log was not read, so the cause is expected, not observed.
- **Which answer to follow-up 183-R6?** The `ci-evidence/**` push (A-10).

## Deviations from Plan

### Operator-ruled amendment

**1. The stop rules accept four classified scan findings (operator's ruling, 2026-10-21)**
- **Found during:** Task 1, first attempt
- **Issue:** The whole-tree scans hit three stop rules: a private-key header (`packages/dev-tools/src/pem-to-jwk.ts`, `tests/tests/support/mock-oidc-key.pem`), an AWS key-id shape (`.yarn/releases/yarn-4.18.1.cjs`), and unverified trufflehog `URI` findings in two test files.
- **Fix:** The operator ruled, and the executor did not, that exactly these findings are accepted by path and kind. The plan was amended in `18fdcd6ca`, and Task 1 was re-run in full with nothing narrowed.
- **Commit:** `18fdcd6ca`, `fd7f4c94d`

Apart from this amendment the plan ran as written.

## Notes

- **Run-level conclusions are not the evidence.** At 11:23Z both runs were still `in_progress`. Both already held failed jobs other than `infra-validate` (`secret-scan`, and `dependency-audit` in both runs), so both will conclude `failure` at run level.
- **`dependency-audit` failed on both runs.** The plan did not anticipate this failure, and it is outside its scope. It is an unrelated job, and its log was not read.
- **Not tested:** what a lock file without Linux provider hashes does to the job. The evidence file says so.
- **The two `ci-evidence/183-infra-validate*` branches stay on the remote as the record.** The operator may delete them.
- The executor ran no `git push` and no `gh` command, and used no credential.
- SUPA-11 is not checked off in REQUIREMENTS.md. It is listed in the `requirements` of 15 plans of this phase, and several of them (183-21 to 183-25 and 183-27) have not run. `requirements.mark-complete` checked it off anyway, and that one change was reverted. It closes when the phase closes.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: evidence/183-15-ci-evidence.md (holds `Run observation: seen` and `Attempt: 15-3 20261021T112307Z.fd7f4c94d`)
- FOUND commits: 567e744d0, 18fdcd6ca, fd7f4c94d, a3558f239
- Task 3 verify commands 1, 2 and 3: exit 0
- Task 2 verify (credential-free `ls-remote`, both branches at the manifest commits): exit 0
