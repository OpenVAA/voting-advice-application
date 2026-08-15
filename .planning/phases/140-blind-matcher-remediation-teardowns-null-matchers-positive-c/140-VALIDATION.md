---
phase: 140
slug: blind-matcher-remediation-teardowns-null-matchers-positive-controls
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-15
---

# Phase 140 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Phase shape note:** Phase 140 changes *assertions*, not product behaviour. A green
> suite is therefore **not** evidence that the phase worked — a suite that was green
> before the edits and green after them proves nothing about whether the assertions can
> now fail. Every requirement below is validated by an **observed two-run control**: the
> mutated scenario must be seen to FAIL under the new assertion and PASS under the old
> one. One run cannot distinguish "the guard caught it" from "something else was already
> red". Sourced verbatim from `140-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest **3.2.4** (unit) · `@playwright/test` **1.58.2** (E2E) |
| **Config file** | per-workspace (`apps/frontend/vite.config.ts` for the F19 files) · `tests/playwright.config.ts` (globalSetup `./global-setup.ts`) |
| **Quick run command** | unit: `cd apps/frontend && npx vitest run src/lib/api/utils/auth/__tests__/<file>` · E2E: `tests/scripts/e2e-run.sh --run-dir <dir> --project=<name>` |
| **Full suite command** | `tests/scripts/e2e-run.sh --run-dir <dir>` (no `--project`) + `yarn test:unit` + `yarn lint:check` |
| **Estimated runtime** | unit lane sub-second per file; single perm E2E project pulls its dependency chain; full E2E suite is the phase gate |

**Critical:** the full E2E gate is `tests/scripts/e2e-run.sh`, **not** bare `yarn test:e2e` —
only the wrapper captures the Phase-137 preflight verdict into the evidence dir, and
criterion 5 requires the preflight be shown satisfied on every run used as evidence.

---

## Sampling Rate

| Point | What runs | Why this rate |
|---|---|---|
| **Per task commit (unit lane, F19)** | `npx vitest run <the one file>` from inside `apps/frontend` | Sub-second; the HYGIENE-LOOP post-gate (`git status --porcelain -- apps tests packages` empty + no `INJECTED (140)` marker) runs with it |
| **Per task commit (E2E lane)** | `e2e-run.sh --project=<the one project>` | A single perm project still pulls its dependency chain; this is the smallest trustworthy E2E unit |
| **Per two-run control** | Exactly **two** runs of the same command, before/after, both recorded with the failing `file:line` and both outcome columns | One run cannot distinguish "the guard caught it" from "something else was already red" |
| **Per wave merge** | `yarn test:unit` + `yarn lint:check` (includes `typecheck:tests`) | Catches cross-workspace breakage from the `dev-seed` template edits and the new `tests/` helper |
| **Phase gate** | One full `e2e-run.sh` with no `--project`, green, preflight-confirmed; plus `yarn test:unit` and `yarn lint:check` green | Criterion 5. Under the CLAUDE.md cardinal rule this must be **all** green — zero failed, zero did-not-run |
| **F3 specifically — additional gate** | One full-suite run **after** the helper lands, compared against the pre-change instrumented measurement table | The F3 change is the one edit capable of reddening ~26 projects; a single-project smoke cannot see the ordering hazard |

- **Max feedback latency:** ~1 s (unit lane); one perm-project chain (E2E lane).

---

## Per-Task Verification Map

Task IDs are assigned by the planner. The verification *observable* per requirement is
fixed by research and reproduced here. Every row names **the observable that proves
failure is now possible**, not merely a command that exits 0.

| Req ID | Behavior | The observable that proves it can fail | Test type | Automated Command | File Exists | Status |
|--------|----------|----------------------------------------|-----------|-------------------|-------------|--------|
| ASSERT-02 (F3) | A teardown whose delete matches nothing fails **by name** | Under a mutated helper (prefix forced to a non-matching value with rows present), the run fails and the message contains the prefix and both counts. **Same mutation against the pre-change `toBeGreaterThanOrEqual(0)` passes.** | E2E teardown project | `tests/scripts/e2e-run.sh --run-dir <d> --project=data-teardown-perm-<name>` ×2 (before/after) | ❌ W0 — helper does not exist | ⬜ pending |
| ASSERT-02 (F3) | The 27th file is covered by construction | `grep -c "runTeardownAsserted" tests/tests/setup/**/*.teardown.ts` = 27 **and** `grep -rn "toBeGreaterThanOrEqual(0)" tests/tests/setup/` = 0 | static | one grep pair | ❌ W0 | ⬜ pending |
| ASSERT-02 (F3) | The matcher is chosen against data | A committed `{prefix, before, rowsDeleted, after}` table for all 27 sites from one instrumented full-suite run | measurement | `e2e-run.sh --run-dir <d>` with the instrumented helper | ❌ W0 | ⬜ pending |
| ASSERT-03 (F19) | A missing `request` param fails **at the assertion line** | Under the `idura.ts:74` injection: **before** — failure at `authorize-endpoint.test.ts:147` (`TypeError … 'split'`); **after** — failure at `:144`, message contains `request` | unit | `cd apps/frontend && npx vitest run src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` ×2 | ✅ file exists; assertion changes | ⬜ pending |
| ASSERT-03 (F19) | Same at site 2 | Same injection; **before** failure at `idura.test.ts:151`, **after** at `:148` | unit | `cd apps/frontend && npx vitest run src/lib/api/utils/auth/providers/idura.test.ts` ×2 | ✅ | ⬜ pending |
| ASSERT-03 (F19) | Same at site 3 | Under the `idura.ts:101-102` deletion: **before** failure at `token-endpoint.test.ts:170`, **after** at `:167`, message contains `client_assertion` | unit | `cd apps/frontend && npx vitest run src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` ×2 | ✅ | ⬜ pending |
| ASSERT-05 (F9) | A tag that never renders fails the pair | Under the `QuestionHeading.svelte:80-89` deletion: **before** — both perm projects green (RUN 1, `140-NEGATIVE-CONTROL.md` § 15.3); **after** — each spec red at **its own counted presence assertion**, `expect(count, '<why>').toBeGreaterThan(0)`, with the explanatory message naming the seeded precondition: `perm-hide-election-tags.spec.ts:43:7` (§ 16.3) and `perm-hide-category-tags.spec.ts:43:7` (§ 16.5) | E2E | `e2e-run.sh --run-dir <d> --project perm-hide-category-tags` — ONE invocation covers both spec projects transitively (`tests/playwright.config.ts:1081`), run injected then byte-restored | ✅ both assertions landed (`c6b3abaec`) | ✅ green |
| ASSERT-05 (F9) | The control is seeded data | The two templates declare the precondition (`elections: 2`; `showCategoryTags: true`), each failure message quotes it verbatim, and the post-seed **exact-equality** `app_settings` assertion (`setupFromTemplate.ts:256-260`) fails the *setup* loudly if a template and its overlay disagree | static + E2E | `grep` the two template files; the setup projects reported `expected` in every run (`140-NEGATIVE-CONTROL.md` § 14, § 16.3, § 16.5). **No rebuild step:** `packages/dev-seed` is source-resolved (`"build": "echo 'Nothing to build.'"`, `exports` → `./src/index.ts`, no `dist`), measured by plan `140-03` | ✅ landed (`4c0bf5839`) | ✅ green |
| ASSERT-06 (F10) | The stated budget is true **or** enforced | Add one `expect.soft(true).toBe(true)` to `voter-journey.spec.ts` ⇒ **any** Playwright invocation (including `--list`) throws naming the file and both numbers. Remove it ⇒ passes. Both observed **before** the guard is accepted. | config-load guard | `cd tests && npx playwright test --list` ×2 (with / without the extra soft assertion) | ❌ W0 | ⬜ pending |
| Criterion 5 | Suites green after the edits, preflight satisfied | `e2e-run.sh` exits 0 **and** its evidence dir records ≥1 preflight success line and 0 failure lines; `yarn test:unit` exits 0; `yarn lint:check` exits 0 | full suite | `tests/scripts/e2e-run.sh --run-dir <d>` + `yarn test:unit` + `yarn lint:check` | ✅ infrastructure exists | ⬜ pending |

> **Form note (ASSERT-05).** The rows above name `expect(count, '<why>').toBeGreaterThan(0)`, not the
> `.not.toHaveCount(0)` that `140-RESEARCH.md` § Validation Architecture and its § F9 code example
> proposed and that this document inherited. `140-PATTERNS.md`'s pattern map found `.not.toHaveCount(`
> appears **nowhere** in `tests/tests/specs/perm/`, while the counted form is the established house
> convention at three in-tree call sites — `perm-answers-locked.spec.ts:54` (`expect(count, 'profile
> page must render at least one visible input').toBeGreaterThan(0)`), the same shape at `:86`, and
> `perm-localisation-positive.spec.ts:193,205,244`. House style won: it carries the explanatory second
> argument this phase wants on every new assertion, and `.not.toHaveCount(0)` is an auto-retrying
> web-first matcher whose negation semantics differ subtly from a one-shot count comparison — not an
> idiom worth introducing casually into a suite that has none of it. Resolved in `140-04-PLAN.md`
> § `<conflict_resolutions>` and executed there; recorded here so the contract states the form that
> actually shipped. The landed assertions wrap across four lines because the explanatory message
> exceeds Prettier's 120-column `printWidth` — the same wrap the house precedent takes at
> `perm-localisation-positive.spec.ts:206-209`.

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/setup/shared/assertTeardown.ts` — the shared F3 assertion helper (**does not exist**; research confirmed there is no shared teardown helper today, so creating it is part of the deliverable, not a refactor)
- [ ] A row-count-by-prefix probe usable from `tests/` (build on `client.query('<table>').like('external_id', prefix + '%')`; the existing `listCandidateIdsByPrefix` covers candidates only)
- [ ] Instrumented measurement pass producing the `{prefix, before, rowsDeleted, after}` table for all 27 sites — **must precede** the matcher choice
- [x] Positive assertions in the two perm specs + the two template preconditions (F9) — preconditions in `4c0bf5839` (plan `140-03`), counted presence assertions in `c6b3abaec` (plan `140-04`), both observed red under the render-path deletion (`140-NEGATIVE-CONTROL.md` §§ 16.3, 16.5) and green on a byte-restored tree (§ 16.6)
- [ ] The F10 counted guard block in `tests/playwright.config.ts` + the rewritten header
- [ ] A phase evidence document (`140-NEGATIVE-CONTROL.md`, following `137-NEGATIVE-CONTROL.md` / `138-NEGATIVE-CONTROL.md`) recording all two-run pairs with both outcome columns and the failing `file:line`

*No new test framework or config is needed — vitest and Playwright are both already wired.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.* Every two-run control is a pair of
scripted invocations whose outcomes (pass/fail + failing `file:line`) are machine-readable
from the runner output; none require human observation of a UI.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s (unit lane) / one project chain (E2E lane)
- [ ] Every requirement's two-run control recorded with **both** outcome columns in `140-NEGATIVE-CONTROL.md`
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
