---
phase: "165"
slug: "review-stack-comment-remediation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-27"
---

# Phase 165 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `165-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 (packages + frontend); pgTAP via `supabase test db`; Playwright 1.58.2 (E2E) |
| **Config file** | per-workspace `vitest.config.ts`; `tests/playwright.config.ts`; `apps/supabase/supabase/tests/database/*.test.sql` |
| **Quick run command** | the touched workspace's `test:unit` (e.g. `yarn workspace @openvaa/frontend test:unit`); for schema tasks also `yarn workspace @openvaa/supabase test:db` |
| **Full suite command** | each run separately, exit status read directly (never through a pipe): `yarn build`, `yarn lint:check`, `yarn format:check`, `yarn test:unit`, `yarn workspace @openvaa/supabase test:db`, `yarn db:lint:sql`, `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-close --no-db-reset` |
| **Estimated runtime** | quick ~30-90 s; full ~25-40 min (E2E dominates) |

---

## Sampling Rate

- **After every task commit:** the touched workspace's `test:unit`; schema tasks add pgTAP.
- **After every plan wave:** `yarn build && yarn lint:check && yarn test:unit`. After the schema waves, also pgTAP + `yarn db:lint:sql`.
- **Before `/gsd-verify-work`:** the full suite is green: E2E 0 failed / 0 flaky / 0 did-not-run. The ledger completeness check and the per-changed-file hygiene gate both pass.
- **Max feedback latency:** ~90 s for the per-task quick run.

---

## Per-Task Verification Map

Every task in every `165-NN-PLAN.md` carries at least one `<automated>` command with a `<fails_when>` signal; the per-task commands live in the plans. The per-plan sampling, by lane:

| Plans | Wave(s) | Per-task quick check | Plan-level proof |
|---|---|---|---|
| 01 | 1 | each instrument's self-test, seen red and green | `ledger-check.sh` on the 78-row skeleton |
| 02, 20 | 2, 3 | `tip-proofs.sh <id>` / targeted greps | `tip-proofs.sh` (27 PASS), `ledger-check.sh` |
| 03, 08, 12, 16, 21 (schema comments) | 2-6 | `code-identity.mjs ship/v2.15-12-planning WORKTREE <schema files> <migration>` + `yarn assert:schema-migration-parity` | hygiene gate `--check-reads` on the plan's files; 21 also gates the migration |
| 04, 09, 13, 17 (pgTAP comments) | 2-5 | `code-identity.mjs --blank-sql-literals ...` + targeted pgTAP (`00-helpers` + the files) | identical `Tests=` total, `Result: PASS` |
| 05, 10, 14, 18 (packages, tooling) | 2-5 | the package's `test:unit` (vitest filter; dev-seed with `--exclude 'tests/integration/**'`) | hygiene gate `--check-reads` |
| 06, 07, 11, 15, 19, 23 (frontend, guard) | 2-6 | `yarn workspace @openvaa/frontend test:unit <filter>` + `check`; guard + gate spec | hygiene gate `--check-reads` |
| 22 (docs site) | 5 | docs `check` / `build`, targeted greps | hygiene gate `--check-reads` |
| 24 (interim gate) | 7 | — | `db:reset`, full pgTAP, `db:lint:sql`, types drift, build, lint, format, unit, full E2E (`e2e-verdict.mjs`), branch hygiene gate |
| 25-28 (schema behaviour) | 8-11 | `schema:regenerate && db:reset && db:types` + targeted pgTAP (new negative-control files 33 and 34) | full pgTAP, `db:lint:sql`, `lint:check`, full E2E verdict, branch hygiene gate |
| 29-33 (frontend moves, rename, styles) | 12-16 | frontend/Edge unit filters, `check`, compiled-class check (`tailwind-classes-present.mjs`) | `lint:check`, full E2E verdict, branch hygiene gate; end-of-phase `<human-check>` for the style plans |
| 34 (hygiene sweep) | 17 | branch hygiene gate `--check-reads` | second independent read + checklist record |
| 35 (final gate) | 18 | — | every D-06 gate on the gated commit; E2E `165-close` |
| 36 (ledger, push, PR) | 19 | `tip-proofs.sh`, `ledger-check.sh --final` | remote = local, PR base/title, `gh pr checks` green |

E2E runs happen only in plans that are alone in their wave (24-36), so no run shares the working tree with another plan's edits.

---

## Wave 0 Requirements

- [ ] `scripts/hygiene-changed-files.sh` + `scripts/code-identity.mjs` (phase-local): the per-changed-file hygiene gate, and the code-unchanged-after-comment-blanking proof — plan 165-01
- [ ] `165-LEDGER.md` skeleton: all 78 comment ids generated from `165-REVIEW-COMMENTS.md` at run time, plus the review-body appendix (D-11) — plan 165-01
- [ ] `scripts/assert-absent.sh`, `scripts/e2e-verdict.mjs`, `scripts/ledger-check.sh`, `scripts/record-hygiene-read.sh` — plan 165-01; `scripts/tip-proofs.sh` — plan 165-02; `scripts/tailwind-classes-present.mjs` — plan 165-31
- [ ] New test files (entity-id collision pgTAP, NULL-project feedback `throws_ok`, frontend↔DB type parity, spacing-list drift, safeGetSession per-token memo, pointer-cancel focus) belong to their own plans, not to a separate wave

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Developers' local `.env` provider values after the `*-ftn` rename | #880 idura.ts | the secret-file guard blocks agent reads of `.env` | Maintainer updates `.env` provider keywords to `idura-ftn` / `signicat-ftn` (human-action checkpoint after the rename plan) |
| GitHub thread replies | ROADMAP criterion 5 | outward-facing | Maintainer posts (or authorises posting) the drafted replies from `165-LEDGER.md` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
