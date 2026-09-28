# Phase 90 — Plan Review

**Reviewed:** 2026-05-29
**Plans:** 90-01 (Stage A wiring) / 90-02 (missing-nominations) / 90-03 (l10n-negative + fixtures) / 90-04 (l10n-positive)
**Result:** PLANS NEED REVISION (1 blocker, 4 warnings)

---

## Dimension Summary

| # | Dimension | Status |
|---|-----------|--------|
| 1 | Goal-backward coverage (TIR5:15-26 / 28-50 / 52-95) | PASS |
| 2 | Wave structure correctness | PARTIAL — 90-03 depends_on includes 90-02 (chain anchor only); see W1 |
| 3 | Anti-shallow rules (read_first + acceptance) | PASS |
| 4 | Pitfall coverage (Research §"Common Pitfalls" 1-7) | PASS — all 7 cited; pitfall numbering drift on 90-03 (W2) |
| 5 | Stage A wiring scope discipline (D-90-10) | PASS — 90-01 touches only DynamicSettings type + i18n init + i18nContext; no customData.disableMultilingual surface |
| 6 | Strict-selector contract | PASS — new testids enumerated with component path + line refs |
| 7 | externalIdPrefix discipline (D-90-01) | PASS — 3 distinct prefixes; verified-unique |
| 8 | Playwright chain anchoring (HIGH-2) | PASS — 90-02 → perm-per-app-notifications; 90-03 → perm-missing-nominations; 90-04 → perm-localisation-negative |
| 9 | Voter-side cross-check (TIR5:89-95) is in-perm-spec (D-90-07) | PASS — 90-04 Task 2 Step C item 11 + must_haves truth #4 explicit |
| 10 | Nyquist validation (deterministic 3-run identity) | PARTIAL — see W3 |
| Extra-A | Context Compliance (D-90-01..D-90-10) | PASS — every D-90-XX implemented; no deferred ideas leak |
| Extra-B | CLAUDE.md compliance | PASS — Svelte 5 context destructuring rule cited in 90-01 Task 2; rigidity contract enforced everywhere |
| Extra-C | Research Resolution (#1602) | BLOCKER — see B1 |
| Extra-D | Pattern Compliance (#1861) | PASS — every modified/new file traces to a PATTERNS.md analog |
| Extra-E | Architectural tier compliance | PASS — Stage A keeps locale-list filtering in Frontend Server/Browser tier per Responsibility Map |

---

## BLOCKERS

### B1 — Research has 5 unresolved Open Questions (Dimension 11)

**File:** `.planning/phases/90-tir5-permutations-missing-nominations-warning-localisation-n/90-RESEARCH.md` (Open Questions section, ~line 540)

**Severity:** BLOCKER (Dimension 11 — Research Resolution gate)

**Description:** RESEARCH.md `## Open Questions` heading does NOT carry the `(RESOLVED)` suffix and the 5 listed questions do not show inline `RESOLVED:` markers. Per the gate, planning must not proceed while research questions are open. The five questions are:

1. Does TIR5 q3 require `customData.allowOpen=true`? — Plans 90-03 / 90-04 LOCK YES via the perm template Task 1 behavior — but RESEARCH itself isn't marked RESOLVED, leaving the decision ambiguous against future re-execution.
2. Stage A scoping — extend Phase 90 vs. split? — Operator resolved via CONTEXT.md D-90-10 (absorb as 90-01). RESEARCH not updated.
3. Should langSelectorFixture live under `fixtures/candidate/` or `fixtures/shared/`? — Plan 90-03 picks `fixtures/candidate/` (D-90-04 wording matches). RESEARCH not updated.
4. Inbucket isolation across perm chains? — Plans pick per-perm `recipientEmail` (90-03 / 90-04 Task 2). RESEARCH not updated.
5. Does seeded `candidate.answersByExternalId` persist to candidate-app profile? — Wave-0 probe P5 listed but not run; outcome doesn't gate 90-03 / 90-04 (specs assume YES; if NO, the en-answer-q1 assertion fails at execution).

**Fix:** Update RESEARCH.md `## Open Questions` to `## Open Questions (RESOLVED)` and add inline `RESOLVED:` markers citing CONTEXT.md decisions / Plan 90-03 / 90-04 task choices. Question 5 in particular should be resolved either by running Wave-0 probe P5 OR by explicit acceptance that 90-03 Task 3 step 5 includes a fallback (it does NOT — strict assertions; risk of execution-time fail surfaces here).

---

## WARNINGS

### W1 — 90-03 declares `depends_on: [90-01, 90-02]`, but 90-02 dependency is chain-anchor-only

**File:** `90-03-PLAN.md:6-8` (frontmatter `depends_on`)

**Severity:** WARNING

**Description:** 90-03 depends_on lists 90-01 (Stage A — required) AND 90-02 (only for playwright.config.ts chain anchoring on `perm-missing-nominations`). No file-overlap conflict, but the dependency surfaces as Wave 2 = max(deps)+1 = max(1,1)+1 = 2 → correct. However, the implication for parallel execution is that 90-02 must complete BEFORE 90-03 can append its playwright entries (because the anchor name `perm-missing-nominations` must exist in the config). The plans state this correctly. The wave assignment is internally consistent.

Minor issue: `90-02-PLAN.md` modifies `tests/playwright.config.ts` AND 90-03 modifies the same file. This is a Wave 1 / Wave 2 boundary — 90-02 must commit first. Plans correctly serialise this via `depends_on`, but the must_haves truth #10 in 90-03 ("Plan depends on 90-02 only for chain anchoring") understates the file-overlap reality (same-file edits, sequenced).

**Fix:** Add a note to 90-03 must_haves that `tests/playwright.config.ts` is modified by BOTH 90-02 AND 90-03 in sequence (Wave 1 must merge first). Same applies to 90-04 vs. 90-03. Plans imply this via wave numbering; making it explicit prevents merge conflicts during execution.

### W2 — Pitfall numbering drift in 90-03 must_haves (#cosmetic)

**File:** `90-03-PLAN.md:39` (must_haves truth #7 — "Pitfall 6 cross-perm Inbucket pollution")

**Severity:** WARNING

**Description:** 90-03 truth #7 attributes "cross-perm Inbucket pollution prevention" to **Pitfall 6**. Per RESEARCH.md, Pitfall 6 is "Voter-side locale switch requires full page reload" and the Inbucket isolation concern is **Open Question 4** (not a numbered pitfall). The actual Inbucket pollution mitigation is implicit in `candidate-mega.ts:87` (per-recipient filter). Same drift appears in 90-03 Task 2 action and 90-04 must_haves truth #4 (cites "Pitfall 6 cross-perm Inbucket pollution"). This is a citation accuracy issue, not a behavioural defect — executor will still use unique recipientEmail correctly.

**Fix:** Replace "Pitfall 6" citations relating to Inbucket isolation with "Open Question 4" or with a direct reference to `candidate-mega.ts:87` (the recipient-filter contract). Preserve actual Pitfall 6 references for the locale-switch full-reload behavior in `langSelector.switchTo`.

### W3 — Nyquist sampling: 90-04 has 3 tasks, all carry `<automated>` verify (Dimension 8 PASS), but only Task 3 is a quick gate — Task 2 spec is end-to-end heavy

**File:** `90-04-PLAN.md` Task 2 `<verify>` line ~235 + 90-03 Task 3 `<verify>` line ~333

**Severity:** WARNING

**Description:** 90-04 Task 2 verify runs `tsc --noEmit -p .` (acceptable static check). The actual end-to-end perm spec gate is operator-deferred ("Phase 89 cascade pattern"). Per Nyquist Dimension 8c (sampling continuity), 3 consecutive tasks without a true E2E gate is acceptable IF the static gate is sufficient to detect contract violations. The 90-04 spec is TIR5:52-95 — the longest walk in the phase (langSelector + Inbucket + profile + opinion-editor + voter cross-check) and the most likely to surface execution-time fixture-composition failures. `tsc --noEmit` does not catch fixture composition or locator-resolution failures.

**Fix:** Either (a) document operator-runbook E2E gate explicitly in the phase verification ledger (90-04 verification section already does this) and accept the deferral, or (b) add a Wave-0 / scoping `--list` Playwright dry-run to the Task 3 verify (`npx playwright test --list --project=perm-localisation-positive` is already in the verify block — good). Recommend accepting the operator-deferred E2E gate explicitly in the Phase 90 success criteria, mirroring Phase 89 lineage.

### W4 — 90-01 Task 2 has 2-option ambiguity (module-mutable vs. request-scope) without picking one

**File:** `90-01-PLAN.md` Task 2 action Step A (~line 176)

**Severity:** WARNING

**Description:** 90-01 Task 2 Step A presents TWO implementation paths for the override accessor:
- "expose a setter or factory function (e.g., `resolveSupportedLocales(dynamicSettings)`)…"
- "Alternatively (preferred — simpler): convert the top-level `const supportedLocales` derivation into a function `getEffectiveSupportedLocales()` that reads from a module-level mutable `_dynamicOverride`…"

Both options are presented with the second flagged as "preferred". The executor has discretion here, but the verify block only checks for `supportedLocales\|getEffectiveSupportedLocales\|applyDynamicOverride` (3 alternative identifiers). This is acceptable for executor discretion (CONTEXT.md doesn't lock implementation shape) but leaves SSR boot-ordering risk unresolved at planning time. The 90-01-SUMMARY output captures the choice post-hoc, but if option 1 (request-scope factory) is picked, the wiring in `+layout.server.ts` is a NEW file modification not declared in `files_modified` (frontmatter).

**Fix:** Either (a) lock the preferred option (module-level mutable + `applyDynamicOverride`) at planning time and remove the ambiguity, or (b) extend `files_modified` to include `apps/frontend/src/hooks.server.ts` / `apps/frontend/src/routes/+layout.server.ts` as POSSIBLE files (conditional on chosen path). Recommend (a) — pick the simpler path now; if execution reveals SSR-boot-ordering blocks it, surface a follow-up.

---

## Detailed Verification Notes

### Goal-backward coverage trace (Dimension 1)

| Requirement | Plan(s) | Covering task(s) |
|-------------|---------|---|
| I18N-RUNTIME-01 (D-90-10 Stage A) | 90-01 | Task 1 + Task 2 |
| TIR5:15-26 (PERM-MN-01 missing-nominations) | 90-02 | Task 1 (template) + Task 2 (spec) + Task 3 (playwright) |
| TIR5:28-50 (PERM-L10N-NEG-01..03) | 90-03 | Task 1 (template + testids) + Task 2 (fixtures + composition root) + Task 3 (spec + playwright) |
| TIR5:52-95 (PERM-L10N-POS-01..07) | 90-04 | Task 1 (template) + Task 2 (spec full walk inc voter cross-check) + Task 3 (playwright) |
| FIX-LANG-SEL-01 + FIX-ML-TEXT-01 | 90-03 | Task 2 |

All 7 expectations of TIR5 (TIR5:15-26 / 28-50 / 52-95) trace to ≥ 1 acceptance criterion. POS-02 (UI text changes on switch) is the weakest — plan 90-04 Task 2 Step C item 2 says "assert some known voter-home text changed (use a stable i18n key surface — e.g., the start-button label changes between locales; locate it via a testid + assert non-English text)" — this is executor-discretion language but acceptable given D-90-06 strict-selector requirement (the selector is testid; the assertion is `expect(text).not.toBe(englishLabel)` or similar).

### Wave structure (Dimension 2)

| Plan | depends_on | Wave | File overlap with peers |
|------|------------|------|-------------------------|
| 90-01 | [] | 1 | apps/frontend/src/lib/i18n/init.ts, packages/app-shared (Stage A only) |
| 90-02 | [] | 1 | tests/playwright.config.ts, packages/dev-seed/src/templates/index.ts |
| 90-03 | [90-01, 90-02] | 2 | tests/playwright.config.ts (sequenced), packages/dev-seed/src/templates/index.ts (sequenced), apps/frontend Input.svelte + LanguageSelection.svelte (NEW edits, no overlap with 90-01) |
| 90-04 | [90-01, 90-03] | 3 | tests/playwright.config.ts (sequenced after 90-03), packages/dev-seed/src/templates/index.ts (sequenced) |

**90-01 and 90-02 are parallel-safe in Wave 1** (no file overlap; 90-01 touches frontend i18n + app-shared types; 90-02 touches dev-seed templates + playwright config + setup files).

**90-03 and 90-04 sequenced** — both edit tests/playwright.config.ts and packages/dev-seed/src/templates/index.ts; wave order is correct.

### Pitfall coverage (Dimension 4)

| Pitfall | Where cited | Where mitigated |
|---------|-------------|------------------|
| 1 — app_settings.settings does NOT control locales today | RESEARCH §"Pitfall 1" + 90-01 objective | 90-01 Task 2 (override read path); 90-03 / 90-04 APP_SETTINGS spread |
| 2 — Sequential chain dependency miss | 90-02 / 90-03 / 90-04 must_haves chain-anchor truths | 90-02 Task 3 / 90-03 Task 3 / 90-04 Task 3 (dependencies arrays) |
| 3 — Candidate login without registration (Inbucket required) | 90-03 must_haves truth #7; 90-04 truth #4 | 90-03 Task 3 Step B; 90-04 Task 2 Step C item 3 |
| 4 — customData.disableMultilingual vs disableMultilingual route prop | 90-03 read_first (Pitfall 4 + 5); 90-04 read_first | 90-03 / 90-04 question seeds correctly target editable profile section |
| 5 — OpinionQuestionInput is NOT multilingual (q3 needs allow_open=true) | 90-03 must_haves truth #2; 90-04 truth #2 | 90-03 / 90-04 perm template Task 1 explicit `allow_open: true` on q3 |
| 6 — Reload-after-save / locale switch reload | 90-03 Task 2 behavior (switchTo Promise.all); 90-04 Task 2 Step C item 2 + item 11 (re-navigation) | langSelectorFixture.switchTo wraps Promise.all + waitForURL |
| 7 — modal-shown-for-key reopen race | 90-02 Task 1 read_first + behavior (fresh navigation) | 90-02 Task 2 Step C: single forward walk |

All 7 pitfalls cited and mitigated.

### Stage A scope discipline (Dimension 5)

90-01 frontmatter `files_modified` lists exactly 3 files:
- `packages/app-shared/src/settings/dynamicSettings.type.ts` (type extension)
- `apps/frontend/src/lib/i18n/init.ts` (read-path override)
- `apps/frontend/src/lib/contexts/i18n/i18nContext.ts` (propagation)

**NOT** touched (per Stage A scope discipline):
- `customData.disableMultilingual` plumbing (RESEARCH confirms already wired end-to-end)
- `staticSettings.ts` / `staticSettings.type.ts` (override is dynamic-only)
- Paraglide compile-time `project.inlang/settings.json`
- Other dynamic-settings surfaces (no expansion to general dynamic settings)

PASS — scope is correctly bounded.

### Voter-side cross-check (Dimension 9)

90-04 Task 2 Step C item 11 explicitly walks the voter-side cross-check IN the perm-localisation-positive.spec.ts file:
- `page.goto('/en/results')` → click candidate card → assert English answers
- `langSelector.switchTo('fi')` → assert Finnish answers

D-90-07 honoured: this is in the perm spec file, NOT in `voter-mega-journey.spec.ts`. `files_modified` for 90-04 does NOT include `tests/tests/specs/voter/voter-mega-journey.spec.ts`.

### CLAUDE.md compliance (Dimension 10)

- TypeScript strict (no `any`): every plan task includes "Strict TypeScript: no `any`" or equivalent in `<action>`.
- Svelte 5 context destructuring rule: 90-01 Task 2 read_first includes CLAUDE.md and action notes "if any new code introduces Svelte 5 context-reactive surfaces, follow the Context Destructuring Rule". Stage A is mostly module-level (init.ts), so no Svelte refactor expected — but rule cited.
- Yarn 4 / Turborepo build dependency: every verify block runs `yarn build` for affected workspaces.

PASS.

### Pattern compliance (Dimension 12 / #1861)

All 16 files in PATTERNS.md `## File Classification` table have analog references in their respective PLAN.md task `<action>` blocks. The `read_first` blocks consistently include the PATTERNS.md section reference.

PASS.

---

## Recommendation

**Status: PLANS NEED REVISION** — 1 BLOCKER + 4 WARNINGS.

### To unblock execution:

1. **(Required) Resolve B1**: Update RESEARCH.md `## Open Questions` heading to `## Open Questions (RESOLVED)` and add inline `RESOLVED:` markers for each of the 5 questions, citing the CONTEXT.md decision or plan task that resolves it. Optionally run Wave-0 probe P5 (seeded answersByExternalId persistence) to convert assumption A5 into evidence.

2. **(Recommended) Address W4**: Lock the 90-01 Task 2 implementation path (module-mutable + `applyDynamicOverride` is preferred per the plan itself). If the request-scope path is picked instead, expand `files_modified` to include the SSR layout/server hook file.

3. **(Recommended) Address W1**: Add an explicit note to 90-03 and 90-04 must_haves that `tests/playwright.config.ts` and `packages/dev-seed/src/templates/index.ts` are MULTI-EDIT files sequenced across waves (90-02 → 90-03 → 90-04). Prevents accidental merge conflicts.

4. **(Optional cosmetic) Address W2**: Correct pitfall numbering drift (Pitfall 6 vs. Open Question 4 for Inbucket isolation).

5. **(Optional documentation) Address W3**: Document the operator-deferred E2E gate explicitly in the Phase 90 verification ledger, mirroring Phase 89 cascade.

Once B1 is resolved, the 4 warnings can either be addressed in revision OR explicitly accepted by the operator at the gate. The plans are structurally sound, decision-compliant, and pattern-correct — the blocker is procedural (Research Resolution gate per #1602).


---

## Re-Review 2026-05-29

**Trigger:** Commits `004507ccc` (plan-checker remediation) + `eb6cbf688` (roadmap update).

**B1 (CLEARED):** `90-RESEARCH.md:540` heading is `## Open Questions (RESOLVED)`. All 5 questions carry inline `RESOLVED 2026-05-29:` markers. Q5 cites Wave-0 probe P5 evidence chain (`supabaseAdminClient.ts:243-312` → `writer.ts:128, 162` → `profile/+page.svelte:222, 295`).

**W4 (CLEARED):** `90-01-PLAN.md:176-184` LOCKS module-mutable + `applyDynamicOverride` path; request-scope variant explicitly rejected; `_dynamicOverride` / `applyDynamicOverride` / `getEffectiveSupportedLocales` shapes embedded; `files_modified` constraint reaffirmed (no SSR layout expansion).

**W2 (CLEARED):** `90-03-PLAN.md:39, 82, 289` + `90-04-PLAN.md:337` replace "Pitfall 6 cross-perm Inbucket pollution" with "Open Question 4 RESOLVED + `candidate-mega.ts:87` recipient-filter contract". Genuine Pitfall 6 (locale-reload) citations preserved at `90-03-PLAN.md:234, 237, 246, 281` and `90-04-PLAN.md:192`.

**W1 (ACCEPTED):** `90-03-PLAN.md:44` + `90-04-PLAN.md:37` carry explicit `MULTI-EDIT SEQUENCING (W1 acceptance 2026-05-29)` must_haves notes documenting 90-02 → 90-03 → 90-04 serialisation across `tests/playwright.config.ts` + `packages/dev-seed/src/templates/index.ts`.

**W3 (ACCEPTED):** `90-04-PLAN.md:38` carries explicit `E2E GATE ACCEPTANCE (W3 acceptance 2026-05-29)` must_haves note citing Phase 89 cascade lineage (operator-runbook 3-run cold-start identity gate post-merge). Reinforced at `90-04-PLAN.md:315, 388` and `90-03-PLAN.md:364`.

## PLANS VERIFIED

Phase 90 plans cleared for execution. All B1 blocker conditions resolved; W1–W4 either remediated (W2, W4) or operator-accepted in plan frontmatter (W1, W3) with explicit citation lineage.
