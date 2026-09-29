---
phase: 165-review-stack-comment-remediation
plan: 14
subsystem: infra
tags: [ci, github-actions, supabase, env-guard, comment-hygiene, keygen]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs, assert-absent.sh, ledger-check.sh)"
provides:
  - "Edge-function env guard that blanks comments with the shared classifier's `{ c: true }` family, with a regression spec"
  - "Copyable one-option-per-line `keygen` usage block in a `sh` fence"
  - "`Write the local Supabase keys into .env` step in the `e2e-tests` and `e2e-visual` CI jobs"
  - "Hygiene-clean comments across `.github/workflows/main.yaml`"
affects: [165-24, 165-35, 165-36]

actuals:
  tokens: 14590
  tasks: 3
  commits: 6
plan_head_before: a7baa524f1f364ba83b266ff3d4f6571459a2f1a
plan_head_after: a0a8935f74983c8ee5cfcd0fbc230fb0b6b9ff91

tech-stack:
  added: []
  patterns:
    - "A root `scripts/*.mjs` guard is imported into a dev-seed spec with a dynamic `import(pathToFileURL(...))` cast to a local interface, so the spec typechecks without an `.mjs` declaration file"
    - "CI keys from the ephemeral local stack: read once from `supabase status -o env`, `test -n` guarded, `::add-mask::` before use, `sed -i` with a `|` delimiter anchored on `^NAME=`, then a count check that no placeholder survived"

key-files:
  created:
    - packages/dev-seed/tests/edgeFunctionEnvGate.test.ts
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-allow/165-14.tsv
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-14.tsv
  modified:
    - scripts/assert-edge-function-env.mjs
    - packages/dev-tools/src/keygen.ts
    - .github/workflows/main.yaml
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "The key step ends with a count check (three key lines, none starting with `<`), so a renamed line in `.env.example` fails the step by name instead of leaving a placeholder in `.env`"
  - "Two layer-3 hits are runtime or CI error-message strings, not comments, and are allowlisted with reasons rather than rewritten, which keeps the comment-only commits code-identical"

patterns-established:
  - "Comment-only rewrite of a YAML file: a block-by-anchor script that refuses to touch a non-comment line, proven afterwards with code-identity.mjs against the preceding commit"

requirements-completed: [165-SC2, 165-SC3, C-4080504697, C-4080504728, C-4080504623, C-4080504664]

coverage:
  - id: D1
    description: "The edge-function env guard blanks `//` and block comments before matching, so a commented `Deno.env.get` read is not a required variable"
    requirement: "C-4080504697"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/edgeFunctionEnvGate.test.ts (RED 1 failed at 771963da4, GREEN 3/3 at 9b4146788)"
        status: pass
      - kind: other
        ref: "yarn assert:edge-function-env (exit 0, 10 required names, unchanged)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The keygen usage block is a `sh` code fence with one option per continued line"
    requirement: "C-4080504728"
    verification:
      - kind: other
        ref: "node .planning/phases/165-review-stack-comment-remediation/scripts/code-identity.mjs ship/v2.15-12-planning WORKTREE packages/dev-tools/src/keygen.ts (exit 0)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/dev-tools typecheck (exit 0); node scripts/assert-comment-hygiene.mjs (exit 0, 0 violations)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both CI E2E jobs write the local stack's anon and service-role keys over the `.env` placeholders before the frontend starts, masked and never echoed"
    requirement: "C-4080504623"
    verification:
      - kind: other
        ref: "awk job-slice check: exactly one `supabase status -o env` read in each of e2e-tests and e2e-visual (exit 0)"
        status: pass
      - kind: other
        ref: "local simulation of the extracted run block with a stub supabase CLI and fake values: three lines rewritten, three $GITHUB_ENV lines, other lines untouched, exit 1 when ANON_KEY is missing"
        status: pass
      - kind: other
        ref: "assert-absent.sh 'eyJ[A-Za-z0-9_-]{10,}' -- .github/workflows/main.yaml (exit 0); git diff ship/v2.15-12-planning -- .env.example (empty)"
        status: pass
    human_judgment: true
    rationale: "The step only runs on a GitHub Actions runner with a live local Supabase; the CI run of the pushed branch (plan 165-36) is the behavioural proof."
  - id: D4
    description: "All four changed shipped files pass the per-file hygiene gate with recorded reads"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <4 files> (exit 0, VERDICT: CLEAN)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit Gate (9 files, 166 tests passed); test:unit ciSecretScanFlags (7 passed)"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 14: Root-tooling review fixes Summary

**The edge-function env guard now blanks comments through the shared classifier's `{ c: true }` family (with a regression spec), `keygen`'s usage is a copyable `sh` fence, and both CI E2E jobs replace the `.env.example` placeholder keys with the local stack's own keys, masked, before the frontend starts. `main.yaml` comments carry no planning trail.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-09-27T20:22:01Z
- **Completed:** 2026-09-27T20:33:00Z
- **Tasks:** 3 of 3
- **Files modified:** 7 (4 shipped files, 2 phase records, the ledger)

## Accomplishments

- `scripts/assert-edge-function-env.mjs` exports `TS_FAMILY = { c: true }` and `blankComments`. The old family `{ slash, blockC, template }` set no key that `commentSpans` reads, so nothing was blanked. The derived required set is unchanged at 10 names, so no name was ever read only inside a comment: `IDENTITY_PROVIDER_CLIENT_ID, IDENTITY_PROVIDER_DECRYPTION_JWKS, IDENTITY_PROVIDER_ISSUER, IDENTITY_PROVIDER_JWKS_URI, IDENTITY_PROVIDER_TYPE, PUBLIC_PROJECT_ID, SITE_URL, SMTP_FROM, SMTP_HOST, SMTP_PORT`.
- The guard's docblocks no longer carry the `.planning/debug/...` path, the dated observation or the history paragraphs.
- The `keygen.ts` docblock again holds the usage as a `sh` fence, one option per line, and the `--size` default is stated in a sentence after it. The change is comment-only.
- `.github/workflows/main.yaml`: `e2e-tests` and `e2e-visual` each gained a `Write the local Supabase keys into .env` step between `Start Supabase` and `Start frontend`. Every comment block in the file was rewritten to drop phase, plan, requirement and decision ids, the `.planning/phases/146-*` path, review ids, dated measurements and historical narrative. The reflowed `the font` line break in the `e2e-visual` header is repaired.

## The key step (identical in both jobs)

```yaml
      # `.env` is a copy of `.env.example`, whose anon and service-role keys are placeholders. The
      # frontend and the E2E setup need the keys this runner's local stack generated, so they are
      # read off the running instance, written over the placeholder lines and exported for the
      # test process. Each value is masked before use and never echoed; `set -x` must not be added.
      - name: "Write the local Supabase keys into .env"
        working-directory: apps/supabase
        run: |
          STATUS="$(supabase status -o env)"
          ANON_KEY="$(printf '%s\n' "$STATUS" | grep '^ANON_KEY=' | cut -d= -f2- | tr -d '"')"
          SERVICE_ROLE_KEY="$(printf '%s\n' "$STATUS" | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')"
          test -n "$ANON_KEY" || { echo "::error::ANON_KEY missing from supabase status"; exit 1; }
          test -n "$SERVICE_ROLE_KEY" || { echo "::error::SERVICE_ROLE_KEY missing from supabase status"; exit 1; }
          echo "::add-mask::$ANON_KEY"
          echo "::add-mask::$SERVICE_ROLE_KEY"
          sed -i \
            -e "s|^PUBLIC_SUPABASE_ANON_KEY=.*|PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" \
            -e "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" \
            -e "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" \
            ../../.env
          test "$(grep -c -E '^(PUBLIC_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=[^<]' ../../.env)" = "3" || { echo "::error::.env still lacks a local key line for PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY"; exit 1; }
          echo "SUPABASE_ANON_KEY=$ANON_KEY" >> "$GITHUB_ENV"
          echo "PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY" >> "$GITHUB_ENV"
          echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> "$GITHUB_ENV"
```

The `run:` block masks both keys with `::add-mask::` and contains no `set -x`. The only `set -x` in the job is the comment that forbids it. The `|` delimiter cannot occur in a JWT or in the newer `sb_*` keys. The behavioural proof is the CI run of the pushed branch in plan 165-36. Before commit, the run block was extracted from the parsed YAML and exercised locally against a stub `supabase` CLI with fake values. It rewrote exactly the three lines, left every other line of the copied template unchanged, wrote three `$GITHUB_ENV` lines, and exited 1 with `::error::ANON_KEY missing from supabase status` when the stub omitted the key.

## Task Commits

1. **Task 1: edge-function env guard (tracer, TDD)**: `771963da4` (test, RED), `9b4146788` (fix, GREEN)
2. **Task 2: keygen usage block**: `d3c4ffead` (docs)
3. **Task 3: CI keys, then main.yaml hygiene**: `340af6657` (fix), `61251ba1e` (docs, comment-only), `a0a8935f7` (chore, hygiene reads)

**Plan metadata:** the `docs(165-14)` commit that carries this SUMMARY and the ledger rows.

## RED / GREEN evidence (Task 1)

- RED at `771963da4`: `yarn workspace @openvaa/dev-seed test:unit edgeFunctionEnvGate` exited 1, `Tests 1 failed | 2 passed (3)`. The failure was `expected 'const a = 1; // Deno.env.get("X")\n/*…' not to contain 'Deno.env.get'`, the intended failure: the family blanked nothing.
- GREEN at `9b4146788`: the same command exited 0, `Tests 3 passed (3)`.
- Tracer gate: `end-of-phase` mode with automated-only verify. After the commit, all three verify commands were re-run and exited 0 before expansion.

## Verification (every status read directly)

| Command | Exit |
|---|---|
| `yarn workspace @openvaa/dev-seed test:unit edgeFunctionEnvGate` | 0 (3/3) |
| `yarn assert:edge-function-env` | 0 (10 names, 0 violations) |
| `grep -c 'slash: true' scripts/assert-edge-function-env.mjs` | prints 0 |
| `yarn workspace @openvaa/dev-seed typecheck` | 0 |
| `node .../code-identity.mjs ship/v2.15-12-planning WORKTREE packages/dev-tools/src/keygen.ts` | 0 (code-identical) |
| `yarn workspace @openvaa/dev-tools typecheck` | 0 |
| `node scripts/assert-comment-hygiene.mjs` | 0 (0 violations, none in keygen.ts) |
| `node -e "require('yaml').parse(...main.yaml...)"` after each main.yaml commit | 0 |
| awk job-slice `supabase status -o env` count, e2e-tests and e2e-visual | 0 (one each) |
| `node .../code-identity.mjs 340af6657 WORKTREE .github/workflows/main.yaml` | 0 (code-identical) |
| `yarn workspace @openvaa/dev-seed test:unit Gate` | 0 (9 files, 166 tests) |
| `yarn workspace @openvaa/dev-seed test:unit ciSecretScanFlags` | 0 (7 tests) |
| `bash .../assert-absent.sh 'eyJ[A-Za-z0-9_-]{10,}' -- .github/workflows/main.yaml` | 0 (absent) |
| `git diff ship/v2.15-12-planning -- .env.example` | empty (`--quiet` exit 0) |
| `bash .../hygiene-changed-files.sh --check-reads --files <the 4 shipped files>` | 0 (CLEAN, unread=0) |
| `node_modules/.bin/prettier --check` on all four files | 0 |
| `bash .../ledger-check.sh` | 0 |

`yarn check:env-pairs-agree` takes no default path by design, so it exits 1 with a usage error when it is not given an env file. The root `.env` was not read, because the secret-file guard forbids it. The same checker run on the committed template, `node scripts/assert-env-pairs-agree.mjs .env.example`, exited 0 (4 pairs compared, 0 disagreements).

## Review-comment dispositions

| Comment | Disposition | Commit | Evidence |
|---|---|---|---|
| C-4080504697 (`assert-edge-function-env.mjs` family) | fix | `9b4146788` (spec `771963da4`) | edgeFunctionEnvGate RED, then GREEN 3/3; guard exit 0 with 10 names, unchanged |
| C-4080504728 (`keygen.ts` usage backslashes) | fix | `d3c4ffead` | code-identical; hygiene gate and reflow detector clean; typecheck 0 |
| C-4080504623 (`.env.example` anon placeholder, e2e-tests) | fix | `340af6657` | key step in `e2e-tests`; no JWT literal; `.env.example` unchanged; CI proof in 165-36 |
| C-4080504664 (`.env.example` service-role placeholder, e2e-visual) | fix | `340af6657` | same step in `e2e-visual`; CI proof in 165-36 |

The ledger rows for all four carry this evidence, the commit and a draft reply.

## Files Created/Modified

- `scripts/assert-edge-function-env.mjs`: `TS_FAMILY = { c: true }`, `TS_FAMILY` and `blankComments` exported, comments rewritten
- `packages/dev-seed/tests/edgeFunctionEnvGate.test.ts`: new comment-blanking regression spec
- `packages/dev-tools/src/keygen.ts`: fenced usage block (comment only)
- `.github/workflows/main.yaml`: key step in two jobs, then every comment block rewritten
- `.planning/.../scripts/hygiene-allow/165-14.tsv`: two allowlist rows for error-message strings
- `.planning/.../scripts/hygiene-reads/165-14.tsv`: read log for the four shipped files
- `.planning/.../165-LEDGER.md`: rows C-4080504623, -664, -697 and -728

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] A post-rewrite count check in the key step**
- **Found during:** Task 3
- **Issue:** `sed -i` succeeds silently when an anchored line is absent, so a renamed line in `.env.example` would leave a placeholder in `.env` and reproduce the original failure without saying so.
- **Fix:** After the rewrite, the step counts the three key lines that do not start with `<` and fails with `::error::` unless the count is 3. It prints a count, never a value.
- **Files modified:** `.github/workflows/main.yaml`
- **Commit:** `340af6657`

**2. [Rule 3 - Blocking] Two allowlist rows for error-message strings**
- **Found during:** Tasks 1 and 3
- **Issue:** Layer 3 flags two code strings, not comments: the guard's empty-derivation error ("were renamed, removed, or moved…") and the `supabase-types-drift` step's `::error::` message ("a renamed or dropped RPC return column…"). Rewriting either would change code, and the Task 2 and Task 3 hygiene commits are meant to be comment-only.
- **Fix:** Added `hygiene-allow/165-14.tsv` rows, each with a reason: the text describes a possible cause or a failing change, not the history of the code.
- **Commits:** `9b4146788`, `61251ba1e`

**3. [Rule 1 - Bug] Wrong spec path in a `main.yaml` comment**
- **Found during:** Task 3 hygiene pass
- **Issue:** The type-check ordering comment cited `tests/ciTypecheckGate.test.ts`, which does not exist. The spec is at `packages/dev-seed/tests/ciTypecheckGate.test.ts`.
- **Fix:** The comment now names the real path.
- **Commit:** `61251ba1e`

**Total deviations:** 3 auto-fixed (1 missing-critical, 1 blocking, 1 bug). **Impact:** none on scope. The code in the comment-only commits is identical, as `code-identity.mjs` proves.

## Issues Encountered

- `yarn check:env-pairs-agree` needs an env-file argument, and the root `.env` must not be read here. It was run against `.env.example` instead (exit 0).
- zsh does not word-split an unquoted path list, so the first `record-hygiene-read.sh` call exited 2 before recording anything. It was re-run through a bash array.
- The secret-file guard also blocks a scratch copy named `.env`, so the local simulation of the key step rewrote the path in the extracted script to a neutral filename.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- The behavioural proof for C-4080504623 and C-4080504664 is the CI run of the pushed branch in plan 165-36.
- `main.yaml` is hygiene-clean with a recorded read, so the gate plans (165-24, 165-35, 165-36) need no further work on it unless a later plan edits it.

## Self-Check: PASSED

- Created files exist: `packages/dev-seed/tests/edgeFunctionEnvGate.test.ts`, `scripts/hygiene-allow/165-14.tsv`, `scripts/hygiene-reads/165-14.tsv`.
- Commits `771963da4`, `9b4146788`, `d3c4ffead`, `340af6657`, `61251ba1e` and `a0a8935f7` are in `git log`.
- `git status --short` shows only the maintainer's `MainContent.svelte` edit, the untracked `.planning/milestone.lock`, and this plan's docs files, which the metadata commit stages.
