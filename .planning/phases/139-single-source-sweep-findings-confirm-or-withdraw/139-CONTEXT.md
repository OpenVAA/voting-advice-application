# Phase 139: Single-Source Sweep Findings — Confirm or Withdraw - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

An **evidence pass, not a remediation pass.** Phase 139 re-reads the five single-source
findings of `.planning/audits/2026-08-11-fake-guard-sweep.md` — F15 (the
`questionTypes.test.ts` sites plus `condenserStandalone.test.ts` / `condenseQuestions.test.ts`),
F16, F18, F19 (3 sites) and all six F20 rows — against the live tree and issues an independent
**confirmed** or **withdrawn** verdict for each, with the `file:line` re-quoted from the current
tree.

Deliberately early and small: a withdrawal here shrinks Phase 142 rather than surprising it
mid-remediation.

**In scope:** verdicts; the re-read evidence behind each; a concretely-named, mechanically
reusable regression per surviving finding; striking withdrawn findings from the audit and
editing ASSERT-07's scope down in ROADMAP.md and REQUIREMENTS.md to match.

**Out of scope:** fixing any assertion. Every repair belongs to Phase 140 (ASSERT-02/03/05/06) or
Phase 142 (ASSERT-07). Wiring `question-info` / `argument-condensation` into `test:unit` belongs
to Phase 141 (UNIT-01..04) — see D-05.

</domain>

<decisions>
## Implementation Decisions

### Evidence bar

- **D-01:** **Break-and-run every finding — all 13 sites**, not the ROADMAP's criterion-2
  minimum of one. For each finding: inject the regression the finding claims its assertion
  cannot detect, run the test, and record the observed PASS/FAIL against the verdict reached on
  paper. A finding that reads blind but **fails** correctly under injection is withdrawn
  (criterion 2), subject to D-02. Rationale: the run corpus IS Phase 142's negative-control
  corpus — producing it here satisfies criterion 3 by construction rather than by prose.
- **D-02:** **Vacuous-but-red assertions are CONFIRMED as written, with the mitigation recorded
  on the verdict.** F19 is the type case: `expect(null).toBeDefined()` passes, so the assertion
  is structurally incapable of detecting absence — that is the finding — but the following line
  (`requestParam!.split('.')`, `jose.decodeJwt(...)`) throws a `TypeError`, so the test still
  red-lights. Cost is diagnosis time, not coverage. Do **not** read criterion 2's "fails
  correctly → withdraw" as reaching this class. — **Reversibility:** costly — withdrawing F19
  instead would shrink ASSERT-03/Phase 140 as well as ASSERT-07/Phase 142, and re-expanding
  scope after a recorded withdrawal means reopening a struck audit finding.
- **D-03:** **Injection hygiene: inject → run → `git checkout -- <path>` → assert
  `git status --porcelain` is clean, per finding.** No injected break may survive into the next
  finding's run or into any commit. Not a scratch branch (a mid-run interruption would leave 13
  live regressions in the tree) and not scratchpad copies (breaking a copy changes the module
  graph, so the evidence would be about the copy rather than the shipped file).
- **D-04:** **The injected diff is recorded verbatim** — the exact `-`/`+` lines — beside each
  verdict, together with the observed PASS/FAIL. Phase 142 re-applies it mechanically. Prose
  descriptions of the regression are not sufficient; re-deriving the diff at remediation time is
  exactly the invention criterion 3 exists to prevent.

### Running the unwired AI packages

- **D-05:** F15 (`packages/question-info`, `packages/argument-condensation`), F16 and the F20
  `planValidation.test.ts` row live in packages with **no `test:unit` script** — verified:
  `question-info` and `argument-condensation` expose only `test` / `test:watch`, so
  `turbo run test:unit` never reaches them. Phase 139 runs them **ad hoc, in-package**
  (`cd packages/argument-condensation && npx vitest run <file>`) and records the exact command
  in the evidence. **No wiring changes.** Adding the scripts here would pre-empt Phase 141 and
  risk surfacing unrelated package failures in the middle of a verdict pass.

### F17 scope seam

- **D-06:** **F17 gets a verdict too, explicitly flagged as out-of-criterion-1.** F17 is named in
  ASSERT-07 but absent from Phase 139's criterion 1 (the auditor read it directly — "Confidence:
  high (read directly)" — so it is not single-source). It is one file and self-evident
  (`10 === 10` arithmetic over the test's own `for` loop), and Phase 142 needs a pre-specified
  regression for it regardless. Recording it here costs little and stops Phase 142 reading the
  omission as a withdrawal.

### Claude's Discretion

- **Verdict record location** (not selected for discussion). Planner's call, with this default:
  a phase-local `139-VERDICTS.md` carrying the per-finding verdict + re-quoted `file:line` +
  verbatim injected diff + observed PASS/FAIL, **plus** in-place edits to
  `.planning/audits/2026-08-11-fake-guard-sweep.md` for any withdrawal (criterion 4 forces the
  audit edit regardless — the shrink must be visible in the record, not silent).
- Ordering of the 13 injections, and whether to batch by package to amortise vitest startup.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The findings under verdict
- `.planning/audits/2026-08-11-fake-guard-sweep.md` §F15 (:622), §F16 (:660), §F17 (:683),
  §F18 (:719), §F19 (:749), §F20 (:771) — the findings themselves, their suggested fixes, and
  the stated confidence per finding.
- `.planning/audits/2026-08-11-fake-guard-sweep.md` § "Not assessed" (:950-956) — the auditor's
  own statement that F15/F16/F18/F19/F20 are single-source (the delegated sweep) and were **not**
  independently re-read. This is the exact gap Phase 139 closes.

### Scope + requirements
- `.planning/ROADMAP.md` § "Phase 139" (:339-352) — goal and the four success criteria.
- `.planning/REQUIREMENTS.md` ASSERT-01 (:54) — this phase's sole requirement; ASSERT-07 (:60) —
  the scope that criterion 4 edits down on any withdrawal.
- `.planning/STATE.md` § "Standing acceptance rule for every v2.15 phase" — prove the guard fails
  before claiming it guards; negative control run twice.

### The 13 sites (all verified present in the live tree, 2026-08-14)
- F15: `packages/question-info/tests/questionTypes.test.ts` (540 lines; sites at 84, 139, 199,
  263, 323, 387, 532, 535-537) — and its **cleared** sibling
  `packages/question-info/tests/api.test.ts`, explicitly NOT part of the finding.
- F15: `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts:130-141,
  181-183`; `.../condenseQuestions.test.ts:139-145, 215-219, 268-274`.
- F16: `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68` — plus
  `.../defineCondensationPlan.test.ts:71`, which proves the competing throw path.
- F17: `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts:84-95`.
- F18: `packages/dev-seed/tests/templates/default.test.ts:121-135`.
- F19: `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:144`;
  `.../providers/idura.test.ts:148`; `.../__tests__/token-endpoint.test.ts:167`.
- F20: `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:233`;
  `apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36`;
  `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:236,259`;
  `packages/dev-seed/tests/supabaseAdminClient.test.ts:151`;
  `packages/data/src/objects/nominations/variants/variants.test.ts:5-12`;
  `packages/argument-condensation/tests/unit/planValidation.test.ts:104`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 138's negative-control format** — `138-NEGATIVE-CONTROL.md` already establishes the
  pre-fix-fails / post-fix-passes evidence shape this phase's per-finding records should mirror.
- **Deterministic seeding** — `packages/dev-seed` runs at `seed: 42`, so F18's locale-block
  injection (change `LOCALE_BLOCK_SIZE`, or force every block to `en`) is reproducible without
  snapshot churn.
- **Mock-call introspection** — F15's suggested fix reaches for
  `mockLLMProvider.generateObjectParallel.mock.calls[0]`; that handle also gives 139 a clean
  injection point (make `generateQuestionInfo` ignore question type and confirm all 540 lines
  stay green).

### Established Patterns
- `turbo.json` `test:unit` `dependsOn: ["build"]`, `cache: false` — packages without a
  `test:unit` script are silently skipped rather than erroring. This is why F15/F16 are invisible
  to `yarn test:unit` today (D-05).
- `packages/data` and `packages/dev-seed` DO expose `test:unit` (`vitest run --passWithNoTests`),
  so the F18, F20-`supabaseAdminClient` and F20-`variants` injections are runnable through the
  normal path.
- Frontend sites (F17, F19 ×3, F20 ×3) run under `apps/frontend`'s own `test:unit`.

### Integration Points
- **Phase 140** consumes the F19 verdict (ASSERT-03) and must not start before it lands.
- **Phase 142** consumes every surviving verdict plus its verbatim injected diff (ASSERT-07,
  criterion 3) — and depends on **Phase 141** so the AI-package repairs actually execute in CI.
- **Criterion 4** writes back into `.planning/audits/2026-08-11-fake-guard-sweep.md`,
  `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` on any withdrawal.

</code_context>

<specifics>
## Specific Ideas

- Verdict vocabulary is exactly two values — **confirmed** / **withdrawn**. A third
  "confirmed — low severity" tier was offered for the vacuous-but-red class and **rejected**; that
  class is plain `confirmed` with the mitigation noted in the verdict body (D-02).
- Criterion 2's "a finding that reads blind but fails correctly is withdrawn" is scoped to
  findings whose *own assertion* catches the regression — not to findings rescued by an
  incidental downstream throw (D-02).
- The F15 incidental (`processingTimeMs).toBeGreaterThan(0)` on a fully-mocked run) is the only
  flake-capable line in that cluster; carry it into the verdict as a note.
- The F20 `getIdTokenClaims.test.ts` row has an adjacent finding attached in the audit — no
  negative test for bad signature / wrong `issuer` / wrong `audience`. That is a **missing** test,
  not a fake one; note it, do not fold it.

</specifics>

<deferred>
## Deferred Ideas

- **Wiring `question-info` + `argument-condensation` into `test:unit`** — Phase 141
  (UNIT-01..04). Explicitly rejected for 139 (D-05).
- **Every repair** — Phase 140 (F3/F9/F10/F19 matchers) and Phase 142 (F15/F16/F17/F18/F20
  assertion redesign). 139 issues verdicts and pre-specifies regressions; it fixes nothing.
- **`getIdTokenClaims` missing negative tests** (bad signature / wrong issuer / wrong audience) —
  a coverage gap, not a fake guard. Belongs in a future coverage phase, not in ASSERT-07.
- **Test-runbook concurrency doc drift** (Phase 138 F-2, `tests/README.md:124`/`:135` vs
  `tests/playwright.config.ts:514-517`) — already filed in STATE.md deferred items; unrelated to
  this phase.

### Reviewed Todos (not folded)
- `2026-06-03-after-runes-update-check-stale-app-header-styling-banner-ima.md` — keyword-only
  match ("phase", "findings"); UI staleness, unrelated to assertion verdicts.
- `2026-05-09-rewrite-parent-answer-imputation.md`, `2026-05-11-e2e-01-single-locale-runtime-override.md`,
  `2026-05-12-58-e2e-audit-addendum-qspec.md` — all matched on generic tokens ("2026", "phase",
  "source"); none touch the F15–F20 sites.

</deferred>

---

*Phase: 139-single-source-sweep-findings-confirm-or-withdraw*
*Context gathered: 2026-08-14*
