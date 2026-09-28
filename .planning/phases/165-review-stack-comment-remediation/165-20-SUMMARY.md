---
phase: 165-review-stack-comment-remediation
plan: 20
subsystem: planning-record
tags: [review-remediation, planning-record, todos, validation, pr-887]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-02 (wave dependency); 165-01 instruments (assert-absent.sh, ledger-check.sh, tip-proofs.sh)
provides:
  - Phase 163 validation record with no template placeholder left, marked backfilled and not Nyquist-audited
  - Three corrected todos (empty-answer candidate, scan determinism, CI SSR-500)
  - The root-env todo resolved and moved to todos/completed
  - Five filled 165-LEDGER.md rows for the #887 planning-record threads
affects: [165-14, 165-36]

tech-stack:
  added: []
  patterns:
    - "Each planning-record correction states the tip file it rests on and carries a dated 'corrected' note, so the old figure cannot propagate silently"

key-files:
  created: []
  modified:
    - .planning/phases/163-ci-gates-sql-lint-format-secrets-vulnerability-scanning/163-VALIDATION.md
    - .planning/todos/pending/2026-08-27-147-empty-answer-candidate-states-unscanned.md
    - .planning/todos/pending/2026-08-27-147-scan-determinism-is-a-bound-not-an-absence.md
    - .planning/todos/completed/2026-08-28-ci-frontend-does-not-read-root-env.md (moved from todos/pending)
    - .planning/todos/pending/2026-09-03-ci-e2e-ssr-500.md
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "163-VALIDATION.md is marked `status: backfilled`, `nyquist_compliant: false`: no Nyquist audit was run for phase 163, and its evidence is organised by gate, so the per-task map is replaced by a gate-level map with a pointer to 163-VERIFICATION.md"
  - "Only the E2E runtime (11.8 min) was recorded for phase 163, so the validation record says so rather than estimating the other commands"
  - "The root-env todo's resolution names plan 165-14 as the owner of the residual placeholder-key fix; 165-14 has not run yet, so the note says it owns the fix, not that the fix has landed"

requirements-completed: [165-SC2, C-4080515788, C-4080515841, C-4080515881, C-4080515920, C-4080515954]

actuals:
  tokens: 4973
  tasks: 3
  commits: 6
plan_head_before: 4be0f68e4f83dbbe49bb68bb568490a82d716fa7
plan_head_after: c54d2eca212aa3405fafcf6a8ff1403272053a78

duration: 5min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 20: #887 Planning-Record Corrections Summary

**The five factual errors Copilot found in the #887 planning record are corrected at the tip, each against the file it cites: the phase 163 validation record is filled from its recorded evidence, three todos are corrected, and the root-env todo is resolved because `svelte.config.js` already sets `env: { dir: repoRoot }`.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-09-27T19:51Z
- **Completed:** 2026-09-27T19:57Z
- **Tasks:** 3
- **Files modified:** 6 (one moved)

## Accomplishments

- `163-VALIDATION.md` names the real jobs, commands and configs of phase 163 and says plainly that no Nyquist audit was run.
- The empty-answer todo now names the one answerless `e2e/base` candidate and explains why it cannot drive the scan.
- The determinism todo carries the correct miss probability, 0.95⁴ ≈ 0.81.
- The root-env todo is in `todos/completed/` with a `## Resolution` section.
- The SSR-500 todo states `main.yaml`'s real triggers.

## Task Commits

1. **Task 1: Fill `163-VALIDATION.md`** — `9a72d709a` (docs). Tracer gate: verify re-run, exit 0.
2. **Task 2: Correct the two 147 todos** — `4e89a71c1` (docs, empty-answer), `44b4543fc` (docs, determinism)
3. **Task 3: Resolve the root-env todo and correct the CI trigger claim** — `4cbbbebea` (docs, rename + resolution), `ae716772d` (docs, SSR-500)

Ledger rows: `c54d2eca2` (chore).

## Review-comment dispositions

| Comment | Disposition | Commit | Evidence (checked at the tip) |
|---|---|---|---|
| C-4080515788 | fix | 9a72d709a | `assert-absent.sh '\{(pytest\|quick command\|N\} seconds\|full command)'` over `163-VALIDATION.md` → exit 0. Frontmatter `status: backfilled`, `nyquist_compliant: false` |
| C-4080515841 | fix | 4e89a71c1 | `base.ts` has 30 candidate declarations (`grep -cE "^\s+external_id: 'test-e2e-base-ca-"`) and 29 `answersByExternalId` lines, all on candidates. `git grep -n test-e2e-base-ca-aa-unregistered -- packages/dev-seed/src/templates/e2e/base.ts` finds the answerless candidate; its declaration comment says "NO auth_user_id". The todo's verify grep → exit 0 |
| C-4080515881 | fix | 44b4543fc | `python3 -c 'print(0.95**4)'` → 0.8145. `assert-absent.sh 'one-in-seven\|0\.86'` → exit 0; `grep -c 0.81` → 1 |
| C-4080515920 | fix | 4cbbbebea | `apps/frontend/svelte.config.js` has `env: { dir: repoRoot }`. The commit records `R068` pending → completed. Verify (`test ! -e` pending path and grep of the resolution) → exit 0 |
| C-4080515954 | fix | ae716772d | `main.yaml` `on:` block: `push.branches` `main` and `"ci-evidence/**"`, and `pull_request.branches` `main`. `grep -q 'ci-evidence/\*\*'` → exit 0; `assert-absent.sh 'only triggers on .main'` → exit 0 |

## Commands written into 163-VALIDATION.md, and where each was found

| Command | Found in |
|---|---|
| `yarn db:lint:sql` | root `package.json` (`yarn workspace @openvaa/supabase lint:all`); `main.yaml` job `sql-lint` |
| `yarn lint:check` | root `package.json`; `main.yaml` job `frontend-and-shared-module-validation` |
| `yarn format:check` | root `package.json`; `main.yaml` step `Run Prettier check globally` |
| `yarn audit:deps` | root `package.json` (`node scripts/assert-dependency-audit.mjs`); `main.yaml` job `dependency-audit` |
| `yarn db:reset` | root `package.json` |
| `yarn build --force` | root `package.json` `build` (turbo `--force`) |
| `yarn typecheck --force` | root `package.json` `typecheck` |
| `yarn test:unit --force` | root `package.json` `test:unit` |
| `yarn test:e2e` | root `package.json` `test:e2e` |
| trufflehog 3.97.2 (no local command) | `main.yaml` job `secret-scan` |
| `gh run view <id> --json jobs` (manual verification) | the method `163-VERIFICATION.md` used; not a repo script |

The config files it names all exist: `prettier.config.mjs`, `.github/trufflehog-openvaa.yml`, `.github/trufflehog-exclude-paths.txt`, `security/audit-baseline.json`, `scripts/assert-dependency-audit.mjs` and `apps/supabase/scripts/lint-schema.mjs`.

## Files Created/Modified

- `.planning/phases/163-ci-gates-sql-lint-format-secrets-vulnerability-scanning/163-VALIDATION.md` — filled from the phase's evidence, marked backfilled
- `.planning/todos/pending/2026-08-27-147-empty-answer-candidate-states-unscanned.md` — corrected evidence line and lever paragraph
- `.planning/todos/pending/2026-08-27-147-scan-determinism-is-a-bound-not-an-absence.md` — corrected probability
- `.planning/todos/completed/2026-08-28-ci-frontend-does-not-read-root-env.md` — moved from pending; `resolved:` key and `## Resolution` section added
- `.planning/todos/pending/2026-09-03-ci-e2e-ssr-500.md` — corrected trigger sentence
- `.planning/phases/165-review-stack-comment-remediation/165-LEDGER.md` — this plan's five rows filled

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The root-env todo made the same wrong trigger claim as the SSR-500 todo**
- **Found during:** Task 3
- **Issue:** The todo moved to completed also said "`main.yaml` triggers only on `main`".
- **Fix:** Its resolution note corrects that as well, so the error does not survive in the completed record.
- **Files modified:** `.planning/todos/completed/2026-08-28-ci-frontend-does-not-read-root-env.md`
- **Commit:** 4cbbbebea

**2. [Rule 1 - Bug] The empty-answer todo's "single lever" paragraph repeated the wrong premise**
- **Found during:** Task 2
- **Issue:** Besides the evidence line, the paragraph said "no such candidate exists in `e2e/base`" and proposed `answersByExternalId: {}`, which would not have been enough without an auth user.
- **Fix:** It now asks for a *registered* answerless candidate.
- **Commit:** 4e89a71c1

**3. [Wording] The SSR-500 pull-request trigger is narrower than the plan stated**
- `pull_request` in `main.yaml` is filtered to `branches: main`, so the todo says "pull requests into `main`" rather than "pull requests" in general.

---

**Total deviations:** 3 (two auto-fixed errors in the same records, one narrower wording). No scope change.

## Issues Encountered

- A Bash call that grepped `main.yaml` with a `\.env` pattern was blocked by the secret-read guard. It was re-run without that pattern; no `.env` file was read.

## Verification

- All five plan verify commands exit 0 (above).
- `ledger-check.sh` → VERDICT: PASSED (exit 0).
- `tip-proofs.sh` → exit 0; none of its proofs read the files this plan edits.
- Everything written is under `.planning/` (hygiene-exempt, D-04; prettier-ignored). No build, database or E2E command was run, per the plan's wave-safety note.

## Next Phase Readiness

- Plan 165-14 still owns the E2E jobs' placeholder anon/service-role key fix that the root-env resolution note points to.

## Self-Check: PASSED

- FOUND: all six modified files, including `.planning/todos/completed/2026-08-28-ci-frontend-does-not-read-root-env.md`; the pending path is absent
- FOUND: commits 9a72d709a, 4e89a71c1, 44b4543fc, 4cbbbebea, ae716772d, c54d2eca2

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-27*
