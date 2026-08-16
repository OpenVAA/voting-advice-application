---
phase: 151
slug: ship-v0-2-akita-review-stack
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-16
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
| **1** — every checklist condition dispositioned | Disposition matrix has a verdict + evidence in every (item × slice) cell; no blanks | structural | parse `151-DISPOSITION.md`; assert `cells_with_verdict == items_in_scope × slices` and `blank_cells == 0` | ❌ W0 |
| **2** — Code Style Guide adhered to | Lint/format/typecheck green on the post-sweep tip | automated | `yarn lint:check && yarn format:check` | ✅ |
| **2** — the guide's unflagged rules | Named parameters, TSDoc, file organisation | **human** | `checkpoint:human-verify` per slice, agent-reported | n/a |
| **3** — comment hygiene | No planning refs survive except bare `see phase N` / `see spike N` | automated | hygiene grep loop; assert `occ=0` for `.planning/`, `§`, `Plan NN-NN`, `D-NN(-NN)`; assert every surviving `phase \d+` is preceded by `see ` | ❌ W0 |
| **3** — no `[PR review]` tags | Tag absent from shipped source | automated | `git grep -c -P '\[PR review\]' -- apps/ packages/ tests/` → 0 | ✅ (already 0) |
| **4.1–4.5** — commit taxonomy | Each restructured commit belongs to exactly one class; "one commit" classes hold exactly one | automated | script over `git log --format='%s' <base>..<tip>` asserting the subject-prefix set and class cardinality | ❌ W0 |
| **4.6** — `[db]` tag | Every commit touching `apps/supabase/`, `packages/supabase-types/`, or any `*/migrations/*.sql` carries `[db]` in its subject | automated | `git log --format='%H %s' --name-only <base>..<tip>` → assert the implication | ❌ W0 |
| **5** — backup worktree | Pre-sweep tip `94be73a61` reachable from a live worktree | automated | `git worktree list \| grep <backup path>` and `git -C <backup> rev-parse HEAD` == `94be73a61…` | ❌ W0 |
| **6** — split quality | Minimal same-file overlap across slices | automated | pairwise `comm -12` over each slice's file list → overlap matrix | ❌ W0 |
| **6** — split quality | "Does each PR read as one thing?" | **human** | `checkpoint:human-verify` on the overlap matrix + slice titles | n/a |
| **7** — byte-identity | `git diff <target> <stack-tip>` empty AND tree hashes equal | automated | `verify-identity.sh` | ❌ W0 |
| **D-24** — collective green | Full E2E suite green on the post-sweep branch tip | automated | `yarn db:reset` → fresh `yarn dev` on `:5173` → `yarn test:e2e` | ✅ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Scripts are provided verbatim in `151-RESEARCH.md` § Code Examples / § Architecture Patterns —
Wave 0 lifts them into the repo, it does not invent them.

- [ ] `scripts/build-rename-commit.sh` — Pattern 1 (pure-rename reconstruction, D-11)
- [ ] `scripts/build-slice.sh` — Pattern 2 (path-partitioned slice construction)
- [ ] `scripts/verify-identity.sh` — criterion 7, both independent checks (D-23)
- [ ] `scripts/verify-commit-taxonomy.sh` — criteria 4.1–4.6, including the `[db]` implication check
- [ ] `scripts/hygiene-grep-report.sh` — criterion 3, before/after occurrence table
- [ ] `scripts/slice-overlap-matrix.sh` — criterion 6, pairwise file-set overlap
- [ ] `scripts/hygiene-codemod.mjs` — hygiene Stage 1, with dry-run mode following the two existing
      in-repo codemods' `APPLY`-flag convention
- [ ] **Baseline capture, before any edit** — the hygiene grep table plus checklist-relevant counts
      (`any`, TODO, stale `docs/src/routes`), so "fixed" is provable rather than asserted
- [ ] **Baseline lint/format state** — `yarn lint:check` was NOT measured during research
      (Assumption A5). If it is currently red, checklist items 3–4 carry pre-existing debt that
      D-05's fix bar pulls into scope. Measure before planning sweep effort against it.
- [ ] **Re-measurement task for `assertAxeScan` reach** — do NOT hard-code "7 voter routes × 2
      themes" from D-18. Phases 147–148 are scheduled to change it before 151 executes
      (Correction C-8 / Assumption A7).

---

## Manual-Only Verifications

| Behavior | Criterion | Why Manual | Test Instructions |
|----------|-----------|------------|-------------------|
| Each PR holds "changes of a similar nature" — one reviewing viewpoint | 6 | Reviewer ergonomics is the stated goal; no command expresses "reads as one thing" | Open each PR's Files-changed tab; confirm the slice title describes every file in it without an "and also" |
| Code Style Guide rules with no lint rule behind them (named parameters, TSDoc completeness, file organisation) | 2 | Not encoded in `packages/shared-config/eslint.config.mjs` | Per-slice agent report against the guide, spot-checked by the operator |
| Disposition evidence is genuine, not laundered | 1, D-18 | A cell can cite a gate that does not reach the slice; only a human catches "met" that should read "not swept" | Sample cells citing automated coverage; confirm the gate's reach was re-measured, not assumed |
| Secret scan over the D-12 planning PR | security | This is the one PR explicitly "approvable without reading" | Run a `gitleaks`-equivalent over `git diff <parent> <planning-slice>`; record in the disposition matrix |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all ❌ MISSING references above
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s during sweep work
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
