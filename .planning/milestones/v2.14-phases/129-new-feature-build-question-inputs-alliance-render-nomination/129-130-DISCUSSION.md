# Phases 129 + 130 — Batch Discussion Doc

**How to use:** Check `[x]` one option per question (multi-select where marked). Add free-text under any question's **Notes:** line. When done, save and tell me — I'll turn this into `129-CONTEXT.md` + `130-CONTEXT.md` in one pass.

- **Phase 129:** New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch (UNBLK-01/02/04/05/06)
- **Phase 130:** E2E Specs — New-Feature Coverage (EQTYP-01/02/03, EFLOW-02, + nominations assertion, + EPERM-03 alliance slice)

---

## ⓘ Already locked — no answer needed (from the approved Phase 118 coverage plan)

These come from `.planning/v2.14-E2E-COVERAGE-PLAN.md` (operator-approved 2026-06-14) and won't be re-asked:

1. **Main-category seed placement (non-additive).** The new number-scale and multipleChoiceCategorical opinion questions go directly into the MAIN question category of `e2e/base`. The rigid-expectation re-baselines (`Answer 4` gate, 4→5+ score gauges, category counts, results-CTA boundary) are planned up-front work, not a fallback.
2. **Fixtures ship in Phase 129 alongside the features** (119.4 operator override). Phase 130 authors specs only.
3. **Phase 129 gets a separate UI-SPEC** (129.2) grounding the new inputs + alliance card in existing Button/Input/EntityCard conventions; the input↔fixture locator contract (`question-choice` etc.) is pinned there.
4. **Phase 130 spec paths are pinned:** EQTYP-01/02 → EXTEND `voter-journey.spec.ts` + `candidate-journey.spec.ts`; EQTYP-03 → flip the multipleText info item from asserted-ABSENT to PRESENT (13→14 items) + candidate round-trip; EFLOW-02/EPERM-03-slice → NEW `voter-alliance.spec.ts` with its own leaf project; nominations → re-enable/re-author the journey step and/or a dedicated spec (shape asked below).
5. **E2E cardinal rule + 3× determinism** (fresh server on :5173, clean DB) applies to the Phase 130 gate.

**Codebase reality check (scouted today):**
- `OpinionQuestionInput.svelte` is the single dispatch site for **both** voter and candidate opinion answering — number + multi-choice branches there fix both apps at once. Unsupported types currently render an inline `error.unsupportedQuestion`.
- `NumberQuestion` in `@openvaa/data` is **already fully matchable** — only the input UI + seed authoring are missing.
- `MultipleChoiceCategoricalQuestion` exists but has a literal `// TODO: Implement for matching` — the matching engine itself already supports categorical subdimensions, so the gap is only the data-class implementation.
- `MultipleTextQuestion` is non-matchable by design; `QuestionInput.svelte` (info-question dispatch) currently **throws** for it.
- **Alliance render is largely pre-built (Phase 69):** `EntityCard` has an alliance branch rendering member-org subcards in-card, `EntityDetails` has the member-orgs children tab, results routes accept `alliances`, and the matching cascade (org→alliance imputation) exists. UNBLK-06 is likely "find and close the residual gap" (seed wiring / settings-type coverage / polish), not a greenfield build.
- `/nominations` fix is a one-loader change: `nominations/+layout.ts` fetches only nomination data; adding `getQuestionData({ locale })` gives parity with `(located)/+layout.ts`.

---

# PHASE 129 — primary questions

## Q1. MultipleText input UX (UNBLK-01)

The pending todo sketches "an editable list of text inputs (add/remove rows) bound to `Array<string>`". Used for candidate INFO questions (e.g. "keywords"); voters only ever see the values rendered on the entity-detail info tab.

- [x] **A. Row list with add/remove buttons (Recommended)** — one text input per value, "+ add" button, per-row remove; matches the todo sketch and the existing Input primitive conventions.
- [ ] **B. Tag/chip input** — type + Enter adds a chip; denser but a new interaction pattern with a bigger a11y surface.
- [ ] **C. Leave to UI-SPEC** — let the Phase 129 UI-SPEC agent pick within existing conventions.
- [ ] Other: ___

**Notes:** Model on the existing multi-select categorical to implement reordering as well.

### Q1.1 (secondary) MultipleText constraints
- [x] **A. No hard limit; empty rows dropped on save (Recommended)**
- [ ] **B. Cap the number of values** (specify in notes, e.g. 10)
- [ ] Other: ___

**Notes:** Add max and min question settings for controlling the number of items. If min is > 1, show with those rows initially and prevent deletion but allow reordering.

## Q2. Number-scale opinion input UI (UNBLK-05)

This choice directly shapes the Phase-130 `answerNumberScale(question, value)` fixture and the boundary-matching test (voter at min ranks the min-positioned candidate first). `NumberQuestion` carries `min`/`max`.

- [x] **A. Slider (range input) with live numeric value label (Recommended)** — the common VAA idiom for scales; works for any min/max span; keyboard-accessible arrows give exact-value control for E2E.
- [ ] **B. Numeric stepper/field with min/max validation** — precise but clunkier for voters.
- [ ] **C. Discrete choice buttons generated from the range** — only viable for small ranges; degenerates for e.g. 0–100.
- [ ] **D. Leave to UI-SPEC.**
- [ ] Other: ___

**Notes:**

### Q2.1 (secondary) Number-scale display mode (entity-detail opinions tab)
`OpinionQuestionInput`'s `mode='display'` is reused by `EntityOpinions` — the voter's value vs the entity's value must be readable there (EQTYP-02 asserts it).
- [x] **A. Same slider rendered read-only with both markers (voter + entity) (Recommended)** — mirrors how Likert answers display today.
- [ ] **B. Plain numeric values side by side.**
- [ ] Other: ___

**Notes:**

## Q3. Multi-choice categorical opinion input (UNBLK-02)

The old QSPEC-02 todo (folded here, see Q7) suggests a checkbox-style multi-select — either extending `QuestionChoices` or a sibling component if the checkbox a11y surface differs too much from radio.

- [x] **A. Extend `QuestionChoices` with a multi-select (checkbox semantics) mode (Recommended)** — keeps one choice-rendering component; the fixture's `question-choice` locator contract carries over, which the coverage plan explicitly wants.
- [ ] **B. New sibling component** — cleaner separation if checkbox vs radio semantics fight each other.
- [ ] **C. Leave to UI-SPEC / researcher** after inspecting `QuestionChoices` internals.
- [ ] Other: ___

**Notes:**

### Q3.1 (secondary) Multi-choice matching semantics
The matching engine already supports categorical subdimensions (n choices → n binary subdimensions; single-choice categorical uses exactly this). For multi-select the natural extension is: each selected choice's subdimension = 1, unselected = 0, distance normalized over subdimensions.
- [x] **A. Binary-subdimension extension per the existing categorical reference impl (Recommended)** — consistent with `packages/matching`'s documented paradigm; no new engine code.
- [ ] **B. Something else** (e.g. Jaccard/overlap-based) — specify in notes; would need new engine support.
- [ ] **C. Claude's discretion** — researcher verifies against `packages/matching` docs and picks.

**Notes:**

### Q3.2 (secondary) Selection constraints
- [x] **A. Any number of selections incl. zero-as-unanswered (Recommended)** — simplest; matches "select all that apply".
- [x] **B. Enforce min/max selection counts** (specify).

**Notes:** Min and max can be specified in questionSettings. When answering, the component should show info if min/max is specified:

"Select 2 to 3 options."
"Select 2 options."

If it's the candidate app, disable saving when outside of min/max.
If it's the voter app, keep the action button to Skip while outside of min/max.

## Q4. Alliance render — scope framing (UNBLK-06)

Scout finding: the alliance card (with in-card member-org subcards), member-orgs drawer, results-tab param wiring, and org→alliance match imputation all already exist from Phase 69. Yet the Phase-118 audit (2026-06-14) verified alliances don't render in voter results against `e2e/base`. The real gap is unknown — plausibly seed wiring (Alliance A ↔ member-org edges), a settings/`results.sections` gap, or the `EntityCard` settings-type TODO (submatches/card-content settings only typed for candidate/org).

- [x] **A. Research-first: Phase 129 research pins the exact residual gap before planning; build only what's missing (Recommended)** — avoids re-building what Phase 69 shipped.
- [ ] **B. Assume seed/settings wiring gap** and plan directly against that assumption.
- [ ] Other: ___

**Notes:**

### Q4.1 (secondary) Alliance card content depth
The coverage plan requires: alliance card in results sections, member orgs as clickable children in-card, and the member-orgs drawer. Beyond that:
- [x] **A. Alliance card also shows a match score/gauge like org cards (if the imputation cascade already produces alliance matches) (Recommended if cheap)** — the cascade exists; likely mostly display wiring.
- [ ] **B. Presence + members only; no score surface this phase.**
- [ ] **C. Claude's discretion** based on what the existing cascade actually emits.

**Notes:**

## Q5. Nominations route fix scope (UNBLK-04)

The core fix is locked (add `getQuestionData` to `nominations/+layout.ts`). Adjacent pending todo: "Display the nominating organization in candidate/profile nominations" — a different surface (candidate app profile page) needing a new candidate-scoped RPC + type regen.

- [x] **A. Core fetch fix only; defer the nominating-org display todo (Recommended)** — the RPC work is its own slice and not required by any 129/130 requirement.
- [ ] **B. Fold the nominating-org display in too** — accepts the extra RPC + supabase-types scope.

**Notes:**

## Q6. Where do the voter-journey re-baseline edits land?

The 129 seed change (new opinion questions in the main category) will break `voter-journey.spec.ts`'s rigid expectations (`Answer 4` gate, 4 gauges, category counts, results-CTA boundary). Under the E2E cardinal rule, Phase 129 cannot close with a red suite.

- [x] **A. Re-baselines land in Phase 129, same plan wave as the seed change (Recommended)** — suite stays green at 129 close; 130 then only adds new assertions.
- [ ] **B. Seed change deferred to Phase 130** — 129 ships components + dev-seed *capability* only; the base-template question additions + re-baselines land together in 130. (Deviates from 119.4's "fixtures alongside features" spirit but keeps 129 purely product-code.)
- [ ] Other: ___

**Notes:**

## Q7. Todo folding for Phase 129 (multi-select — check all to fold)

- [x] **Fold: `2026-05-31-implement-multiple-text-question-input.md`** (Recommended — is UNBLK-01; includes baseV1/e2e-seed restore list + spec touchpoints)
- [x] **Fold: `2026-05-31-fix-nominations-route-fetch-all-questions.md`** (Recommended — is UNBLK-04; note its spec pointer `voter-mega-journey.spec.ts:1128` is stale, spec was renamed `voter-journey.spec.ts`)
- [x] **Fold: `2026-05-12-qspec-02-multi-choice-categorical-variant.md`** (Recommended — is UNBLK-02's prior scope write-up; its E2E items are superseded by the Phase 118 plan, its component/matching/seed items apply)
- [x] **Defer: `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md`** (Recommended defer — see Q5)
- [x] **Defer: `2026-05-09-rewrite-parent-answer-imputation.md`** (Recommended defer — structural refactor, explicitly out-of-scope of alliance ship per its own text)

**Notes:**

# PHASE 129 — secondary questions

## Q8. Default (demo) template authoring
UNBLK-02/05 say "dev-seed authoring support". The e2e/base additions are locked; should the new opinion types ALSO appear in the `default` Finnish demo template?

- [x] **A. Yes — add one number-scale + one multi-choice opinion question to `default` too (Recommended)** — dev-parity; the demo exercises everything the frontend supports.
- [ ] **B. No — e2e/base only; demo template untouched.**
- [ ] **C. Claude's discretion.**

**Notes:**

## Q9. UI-SPEC process
129.2 mandates a separate UI-SPEC. Confirm the mechanics:

- [x] **A. Run `/gsd-ui-phase 129` after this discussion, before planning (Recommended)** — matches the coverage plan's cross-reference; the phase has real visual surface (3 new inputs + alliance card).
- [ ] **B. Skip the UI-SPEC agent; capture component contracts in CONTEXT.md decisions instead.**

**Notes:**

## Q10. `buildMinimal.ts` number-answer gap
Scout noted `defaultAnswerForQuestion` has no number branch (falls through to `{ value: '' }`). Fixing it is a small dev-seed correctness item that number-opinion authoring will likely need anyway.

- [x] **A. Fix in 129 as part of UNBLK-05 seed work (Recommended)**
- [ ] **B. Leave unless it actually blocks.**

**Notes:**

---

# PHASE 130 — primary questions

## Q11. Nominations coverage shape

The coverage plan left this "AND/OR". Reality check: the commented-out journey step referenced a spec that no longer exists (`voter-mega-journey` → renamed/rebuilt as `voter-journey` in 119–122), so "re-enable" is really "re-author".

- [x] **A. Dedicated `voter-nominations.spec.ts` only (Recommended)** — clean leaf project (`data-setup-base`, read-only); avoids growing the already-long journey; the old step is bit-rotted anyway.
- [ ] **B. Journey step only** — re-author the step inside `voter-journey.spec.ts`.
- [ ] **C. Both** — dedicated spec + a light journey step.

**Notes:**

## Q12. EQTYP-01 opportunistic tightening

The coverage plan notes candidate answering of existing categorical/boolean opinion questions is exercised only generically (choice-select + continue). It suggests "opportunistically" tightening those to type-specific assertions while adding the new multi-choice assertions.

- [x] **A. Yes — tighten existing categorical + boolean candidate opinion assertions to type-specific in the same pass (Recommended)** — closes the EQTYP-01 NOTE fully; marginal cost while editing the same spec region.
- [ ] **B. No — new multi-choice assertions only; keep the diff minimal.**

**Notes:**

## Q13. Determinism-gate shape

Roadmap SC5: "All new-feature-coverage specs pass 3× deterministically (fresh server, clean DB)."

- [ ] **A. New/changed specs 3× + one full-suite green run (Recommended)** — matches the Phase 124/127 precedent and the cardinal rule.
- [x] **B. Full suite 3×** — strongest signal, ~3× the wall-clock.

**Notes:**

# PHASE 130 — secondary questions

## Q14. Alliance spec seed verification timing
The plan says "confirm at 130 build time" that Alliance A + member-org edges in `e2e/base` actually render once UNBLK-06 lands. Given 119.4 (fixtures + seed in 129):

- [x] **A. Verify Alliance A wiring already in Phase 129 (as part of UNBLK-06 verification) so 130 is assert-only (Recommended)**
- [ ] **B. Keep the verification in 130 as planned.**

**Notes:**

## Q15. EPERM-04 alliance tab-control rider
The coverage plan tracks the alliance entity-detail tab control (`entityDetails.tabs` setting honored for alliance drawers) as a rider on the alliance work in 130.

- [x] **A. Include the alliance tab-control assertion in `voter-alliance.spec.ts` (Recommended)** — it rides the same fixtures.
- [ ] **B. Skip — presence/members/drawer coverage only.**

**Notes:**

## Q16. Anything else / deferred ideas
Free-form: anything you want captured as a decision or noted for the backlog (it will go to the Deferred Ideas section, not into scope).

**Notes:**

---

*Submit by saving this file with your checkboxes + notes, then tell me you're done (or paste the answers). I'll write both CONTEXT.md files, the discussion logs, and commit.*
