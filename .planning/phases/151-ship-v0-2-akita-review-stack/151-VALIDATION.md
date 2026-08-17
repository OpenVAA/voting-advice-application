---
phase: 151
slug: ship-v0-2-akita-review-stack
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-16
finalised: 2026-08-17          # plan 151-19, from measured state rather than aspiration
wave_0_scripts_delivered: 7    # all seven exist, all seven have run, all seven are in the skill's sources/
criteria_green_by_command: [1, 2, 4, 5, 6, 7]
criteria_red_by_design: [3]    # hygiene gate exits 1 on a written, enumerated expected state -- see below
open_regression: F-89          # the one row of criterion 3's red that is NOT expected
---

# Phase 151 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Phase shape caveat:** the deliverable is a git history and a PR stack, not product code.
> Validation therefore splits into **command-checkable** (assert in a task, record output verbatim)
> and **human-inspection** (`checkpoint:human-verify`). Source: `151-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (workspace-rooted `vitest.workspace.ts`, 15 package configs) · Playwright (`tests/playwright.config.ts`, 43 specs, preflight in global setup) · pgTAP (56 `.sql` under `apps/supabase`) |
| **Config file** | `vitest.workspace.ts` · `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:unit` (turbo-cached) |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~10.5 min for the full E2E suite (per the v2.14 waiver record) |
| **Lint/type gate** | `yarn lint:check` (turbo lint + eslint tests + `tsc -p tests/tsconfig.json --noEmit`) |
| **Format gate** | `yarn format:check` |
| **Phase-local gate** | the Wave-0 scripts below (identity, taxonomy, hygiene, overlap) |

**E2E execution prerequisites** (project memory, non-negotiable): one fresh dev server on `:5173`
(no Playwright `webServer`; a stale server steals the port) and a clean DB (`yarn db:reset`) before
the full-suite gate.

---

## Sampling Rate

- **After every sweep fix landed on the branch (D-04):** `yarn test:unit` + `yarn lint:check`.
  Full E2E is 10.5 min — too slow per-fix, per the project's own economics.
- **After every slice built:** `verify-identity.sh` against the *partial* stack + a
  remaining-slices catch-all, asserting the catch-all file count. Catches a partition bug at the
  slice that caused it rather than nine slices later.
- **Before any PR opens:** the hygiene grep report and the taxonomy script for that slice.
- **Phase gate (D-24):** full E2E suite once, green, on the post-sweep branch tip; plus
  `verify-identity.sh` on the complete stack; plus `verify-commit-taxonomy.sh`.
- **Max feedback latency:** ~60s (unit + lint) during sweep work; ~10.5 min at the phase gate.

---

## Per-Task Verification Map

> Task IDs are assigned when PLAN.md files are written; `/gsd-validate-phase` fills this table.
> The criterion-level map below is the contract those task rows must satisfy — it is derived from
> the seven ROADMAP success criteria, which serve as the requirement set (no REQ-IDs are mapped
> to this phase).

| Criterion | Behaviour verified | Test Type | Automated Command | File Exists |
|---|---|---|---|---|
| **1** — every checklist condition dispositioned | Disposition matrix has a verdict + evidence in every (item × slice) cell; no blanks | structural | `grep -E '^(cells_expected\|cells_filled\|blank_cells):' 151-DISPOSITION.md` → `163 / 163 / 0` | ✅ 151-06 scaffold → 151-09…151-18 fill → 151-19 finalise |
| **2** — Code Style Guide adhered to | Lint 0 errors / 20 warnings; format red on exactly the two PD-03-fenced files | automated | `TURBO_FORCE=1 yarn lint:check && TURBO_FORCE=1 yarn format:check` | ✅ 151-03 baseline, re-measured 151-19 |
| **2** — the guide's unflagged rules | Named parameters, TSDoc, file organisation | **human** | per-slice agent verdicts in `151-DISPOSITION.md` items 3, 4, 6, 7, 10 | ✅ 151-09 … 151-18, one column per slice |
| **3** — comment hygiene | No planning refs survive except bare `see phase N` / `see spike N` | automated | `bash scripts/hygiene-grep-report.sh --assert-clean` | ⚠️ **RED BY DESIGN, with one real regression.** Expected: `task-id` 82, `phase-ref` bare 12, `plan-number` 1. `planning-path`, `section-anchor`, `decision-id-*` are all **0**. The `plan-number` row and the 12th bare `phase-ref` are one line — **F-89**, open. |
| **3** — no `[PR review]` tags | Tag absent from shipped source | automated | `git grep -c -P '\[PR review\]' -- apps/ packages/ tests/` → 0 | ✅ (already 0) |
| **4.1–4.5** — commit taxonomy | Each restructured commit belongs to exactly one class; "one commit" classes hold exactly one | automated | `bash scripts/verify-commit-taxonomy.sh ship/v0.2-akita-01a-layout-move..ship/v0.2-akita-11-planning` → CONFORMING | ✅ 151-18; **4.4's proxy is named on every run** so no record overclaims |
| **4.6** — `[db]` tag | Every commit touching `apps/supabase/`, `packages/supabase-types/`, or any `*/migrations/*.sql` carries `[db]` in its subject | automated | the same script; **`[db]` gaps: 0** | ✅ 151-18 |
| **5** — backup worktree | Pre-sweep tip reachable from a live worktree | automated | `git -C ../voting-advice-application-gsd-backup rev-parse HEAD` → **`fe91f3099`**, equal to `pre_sweep_tip` in `151-BASELINE.md:8` | ✅ 151-03 pinned, **re-verified at 151-18 at the END of the review**. The `94be73a61` in this row was the pre-plan estimate; the pinned tip is `fe91f3099`. |
| **6** — split quality | Minimal same-file overlap across slices | automated | `bash scripts/slice-overlap-matrix.sh` → **max off-diagonal 0** | ✅ 151-05 |
| **6** — split quality | "Does each PR read as one thing?" | **human** | operator approval, recorded twice and re-readable | ✅ 151-05 (the split) and 151-18 Task 5 (the stack read bottom-up) |
| **7** — byte-identity | `git diff <target> <stack-tip>` empty AND tree hashes equal | automated | `bash scripts/verify-identity.sh feat-gsd-roadmap ship/v0.2-akita-11-planning` | ✅ 151-19's final re-cut. **Proven as of a commit, red at rest** — slice 11's pathspec contains `.planning/`. |
| **D-24** — collective green | Full E2E suite green on the post-sweep branch tip | automated | `yarn db:reset` → one fresh `yarn dev` on `:5173` → `yarn test:e2e` | ✅ 151-18 run 2: **135 passed / 0 failed / 0 skipped / 0 did-not-run**, exit 0, 10.7 min — after a fix at source, not a waiver. Run 1's red is kept as the diagnosis. |

*Status: ✅ green · ❌ red · ⚠️ red-by-design or partial. Every row above is terminal; the phase closed
with no row left unmeasured. `❌ W0` meant "the Wave-0 script that proves this does not exist yet" —
all seven now exist and have run.*

---

## Wave 0 Requirements

**All seven scripts exist, all seven have run, and all seven are carried in
`.claude/skills/ship-review-stack/sources/` byte-identically (`diff -r` empty).** Delivered by plan
151-02 (taxonomy, hygiene grep, overlap matrix), 151-01 (the two build primitives and the identity
check, proven on throwaway refs first) and 151-07 (the codemod).

- [x] `scripts/build-rename-commit.sh` — pure-rename reconstruction **by rule**. Verified at
      `diff.renameLimit=1`: **1316 R / 0 A / 0 M / 0 D**.
- [x] `scripts/build-slice.sh` — path-partitioned slice construction. Ran 30+ times across plans
      151-01, 151-09 … 151-19; every slice in the published stack is one invocation of it.
- [x] `scripts/verify-identity.sh` — criterion 7, both independent checks (D-23).
- [x] `scripts/verify-commit-taxonomy.sh` — criteria 4.1–4.6 including the `[db]` implication.
      **CONFORMING** over `C1..TIP`; the `origin/main..TIP` run is recorded beside it and explained.
- [x] `scripts/hygiene-grep-report.sh` — criterion 3, three measured states, plus `--assert-clean`.
- [x] `scripts/slice-overlap-matrix.sh` — criterion 6; **max off-diagonal 0**.
- [x] `scripts/hygiene-codemod.mjs` — hygiene Stage 1, dry-run by default, `--apply` to write,
      warn-only second pass. Committed fixtures + `--self-test`: **4 fixtures, 0 failures**, re-run at
      151-19 after a formatting-only rewrite to prove the transform unchanged.
- [x] **Baseline capture, before any edit** — `151-BASELINE.md` + `151-MEASUREMENTS.md`: the hygiene
      grep table, the `any` / TODO / stale-route counts, and the three gate verdicts.
- [x] **Baseline lint/format state** — measured, not assumed (Assumption A5 discharged):
      `lint:check` **0 errors / 20 warnings**, `format:check` **red on exactly two** PD-03-fenced
      files. The 20 warnings are a **baseline, not a target** — F-39 records that they were
      deliberately not reduced, because reducing them would hide a later regression.
- [x] **Re-measurement of `assertAxeScan` reach** — done rather than inherited (Correction C-8 /
      Assumption A7). **7 route entries → 5 distinct URLs → 14 emitted tests × 2 themes**, and the
      named complement: **31 of 36 `+page.svelte` route surfaces are never scanned**, including all
      18 candidate-app routes, all 5 admin routes, and `questions/[questionId]`. Phase 147 is the
      scheduled remedy and **has not executed**, so the complement is current, not inherited.

**One Wave-0 assumption did not survive, and is recorded rather than quietly dropped.** The plan
expected `verify-commit-taxonomy.sh` to satisfy clause 4.4 directly over `origin/main..TIP`. It cannot:
paths change in the rename commit and contents change later, so a proxy treating a rename as a
modification can never pass across that boundary. The gate runs over `C1..TIP` instead and **names the
4.4 proxy on every run**. That is a narrowed claim, not a satisfied one.

## Manual-Only Verifications

| Behavior | Criterion | Why Manual | Test Instructions |
|----------|-----------|------------|-------------------|
| Each PR holds "changes of a similar nature" — one reviewing viewpoint | 6 | Reviewer ergonomics is the stated goal; no command expresses "reads as one thing" | Open each PR's Files-changed tab; confirm the slice title describes every file in it without an "and also" |
| Code Style Guide rules with no lint rule behind them (named parameters, TSDoc completeness, file organisation) | 2 | Not encoded in `packages/shared-config/eslint.config.mjs` | Per-slice agent report against the guide, spot-checked by the operator |
| Disposition evidence is genuine, not laundered | 1, D-18 | A cell can cite a gate that does not reach the slice; only a human catches "met" that should read "not swept" | Sample cells citing automated coverage; confirm the gate's reach was re-measured, not assumed |
| Secret scan over the D-12 planning PR | security | This is the one PR explicitly "approvable without reading" | Run a `gitleaks`-equivalent over `git diff <parent> <planning-slice>`; record in the disposition matrix |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all ❌ MISSING references above — every one is now ✅ or ⚠️ with a written reason
- [x] No watch-mode flags
- [x] Feedback latency < 60s during sweep work (unit + lint); ~10.5 min at the phase gate, once
- [x] `nyquist_compliant: true` set in frontmatter

**`nyquist_compliant: true` is a measured claim, not an aspirational one.** Every criterion has an
automated command except the two the phase always said were human — criterion 6's "does each PR read
as one thing?" and criterion 2's unflagged style rules — and both of those have a *recorded operator
decision* rather than an agent's assertion. The one row that is not green is criterion 3, which is red
**by design against a written expected state**, plus **F-89**, the single row of that red which is a
real regression and is open.

**Approval:** the phase-close approval is requested at plan 151-19 Task 3 and is the operator's to
give. This document is complete; it does not claim its own sign-off.
