# Phase 134: A11y Contrast + i18n Catalog + Boolean-Answer Defect Closure - Context

**Gathered:** 2026-08-10
**Status:** Ready for planning
**Source:** `134-DISCUSSION-POINTS.md` (all sections resolved by the operator)

<domain>
## Phase Boundary

Close the three user-facing defects carried by `v2.14-MILESTONE-AUDIT.md` (FIX-01/02/03) —
**with three verified scope corrections** established by live scouting before this context
was written. These corrections are load-bearing; do NOT re-derive from the audit's wording.

| # | Roadmap/audit premise | Verified ground truth (scouted 2026-08-09/10, live dev server + `e2e/base` seed) |
|---|---|---|
| **FIX-01** | "12/12 FAIL at 3.69:1" on the elections selector | **STALE — the app-side defect is already fixed.** `apps/frontend/src/app.css:492` `.label { color: inherit }` landed in commit `0eb27c677` (2026-06-22 19:59), *after* the debug doc the audit cited (`e144768e0`, 15:25). Settled-DOM axe scan of `/en/elections`: **0 total violations, 0 color-contrast, light AND dark.** Option spans compute `rgb(51,51,51)` on `#fff` (12.6:1) and `rgb(204,204,204)` on `#000` (15.8:1), `opacity: 1`. `NumericEntityFilter`'s `text-label` spans match no CSS rule and no `--color-label` token exists — since `.label { color: inherit }` they inherit full-strength `#333`. They are a **dead class, not a live violation.** |
| **FIX-02** | 2 keys missing from the runtime catalog | Live — **but it is 7 keys, not 2.** Full list in D-06. |
| **FIX-03** | truthiness guard "and in the completion gating that reads the same helper" | Live at `questions/+page.svelte:58` — **but the completion-gating half is wrong.** `candidateContext.svelte.ts:233` already uses `isEmptyValue()`, which handles `false`/`0` correctly. **Single site, not two.** |

**In scope:**
1. **FIX-01, re-scoped to gate + cleanup** (D-01..D-03): the regression gate that would
   actually have caught the original defect, the `text-label` dead-class cleanup, and
   correcting the ROADMAP / REQUIREMENTS / audit text to record that `0eb27c677` closed the
   app-side defect.
2. **A11y gate hardening** (D-04..D-07): a typed route contract for the axe scan set,
   axe coverage for the previously-unscanned filter surfaces, and fixing anything that
   surfaces once the settle actually waits for content.
3. **FIX-02, all 7 keys** (D-06..D-09) + a key-set parity check that makes the defect class
   structurally impossible to reintroduce.
4. **FIX-03** (D-10..D-12) using the canonical `isEmptyValue()` helper, plus a repo-wide
   falsy-guard sweep and an E2E lock.
5. **Verification gate** (D-13): full E2E suite green to the **3×** determinism standard;
   svelte-check stays 0/0; lint + prettier + `typecheck:tests` clean.

**Out of scope (operator-confirmed, carried per audit §4.4/§4.5):**
- `preview/+page.svelte:32` `dataRoot` alias-indirection warning — pre-existing, does not
  currently manifest.
- DEF-120-03-01 feedback rate-limit teardown.
- Unifying the two i18n catalogs into one (that is a refactor phase, not defect closure).
- Narrowing the global `app.css:492` `.label { color: inherit }` override (D-03).
- Any change to `ConstituencySelector` (already uses opaque `.small-label`).
</domain>

<decisions>
## Implementation Decisions

### FIX-01 — re-scope to gate + cleanup
- **D-01 (Keep FIX-01 as a requirement, rewritten):** Do NOT close it as already-satisfied and
  do NOT broaden it to an app-wide `.label` audit. The deliverable is three-part:
  (a) a **settled-DOM regression gate** that would actually have caught the original defect
  (see D-04), (b) the `text-label` dead-class cleanup (D-02), (c) corrected ROADMAP /
  REQUIREMENTS / `v2.14-MILESTONE-AUDIT.md` text recording that commit `0eb27c677` closed the
  app-side contrast defect and that the 12/12-FAIL figure was stale.
- **D-02 (`text-label` → `small-label`):** Replace the dead `text-label` class at
  `NumericEntityFilter.svelte:85,98,113` with the project's own opaque muted-label token
  `small-label` (`app.css:384` → `text-secondary text-xs font-normal uppercase`), already used
  by `ConstituencySelector` and `QuestionChoices`. Expresses the original intent, AA-safe.
  Not a bare delete, not a new `--color-label` theme token.
- **D-03 (Leave `app.css:492` as-is):** The global `.label { color: inherit }` override stays.
  It is shipped, documented with rationale, and verified AA-clean in both themes. Narrowing it
  to per-component explicit colours risks re-opening the defect.

### A11y gate hardening — the real FIX-01 deliverable
**Why:** `a11y-smoke.spec.ts:150-163` — the `elections-selector` and `constituencies-selector`
entries `settle` on `page.getByRole('heading').first()` then `awaitAnimationsSettled`. The
2026-06-22 debug doc proved that at heading-visible the option span **"DOES NOT EXIST YET"**
(labels are data-driven, rendered later). The scan can therefore pass against a DOM that does
not contain the content the scan exists to check — that weakness is *why* the audit reached a
stale conclusion.

- **D-04 (Typed route contract — the chosen settle strategy):** Add a **required
  `contentTestId` field to the route-entry type** so a future route physically cannot be added
  to the scan set without declaring what "loaded" means; each entry waits for its own
  data-driven testid (elections → `election-selector-option-label`, constituencies → the
  constituency option) **before** `awaitAnimationsSettled`. Chosen over the minimal per-route
  settle patch and over a separate standalone assertion test — the type makes the guarantee
  structural rather than per-site discipline.
- **D-05 (Add a filter-drawer route to the scan set):** `NumericEntityFilter` /
  `EnumeratedEntityFilter` live behind the results-page filter drawer and are currently
  scanned by **nothing**. Add a scan route with a fixture path (navigate to results, open
  filters). These are exactly the surfaces the audit flagged — real coverage gain, not a
  backlog todo.
- **D-06 (axe global-zero gate only):** `assertAxeGates` already asserts
  `violations.length === 0`; with D-04 in place that is a genuine gate. Do **not** add a
  belt-and-braces computed-colour assertion pinning `rgb(51,51,51)` / `rgb(204,204,204)`.
- **D-07 (New violations surfaced by the harden are fixed in-phase):** Hardening the settle
  may reveal that other routes were passing for the same reason elections was. Those are ours
  to close **in this phase** — the E2E cardinal rule means we cannot ship with the suite red.
  Do NOT quarantine to a follow-up phase, do NOT keep a loose settle on those routes with a
  documented reason, and do NOT checkpoint the decision back to the operator. (If the volume
  turns out to be genuinely out of budget, escalate honestly with the gate left RED — never
  annotated around.)

### FIX-02 — i18n runtime catalog
- **D-08 (Fix all 7 keys, not 2):** All 7 are authored in all 7 locales in the type-gen source
  (`src/lib/i18n/translations/`) and all 7 render the raw key string today. Same defect, same
  mechanism, same commit shape — and one of them is an a11y defect. Add them to the **runtime
  Paraglide catalog** `apps/frontend/messages/{locale}/*.json` (registered at
  `project.inlang/settings.json:53`).

  | Key | Call site | User impact |
  |---|---|---|
  | `questions.multiChoice.selectExact` | `QuestionChoices.svelte:421` | visible helper text |
  | `questions.multiChoice.selectRange` | `QuestionChoices.svelte:422` | visible helper text |
  | `components.accordionSelect.listboxAriaLabel` | `AccordionSelect.svelte:84` | **`aria-label`** — screen readers announce the literal key. WCAG defect, not cosmetic. |
  | `components.multipleTextInput.add` | `MultipleTextInput.svelte:206` | visible button text |
  | `components.multipleTextInput.moveUp` | `MultipleTextInput.svelte:176` | visible button text |
  | `components.multipleTextInput.moveDown` | `MultipleTextInput.svelte:183` | visible button text |
  | `components.multipleTextInput.remove` | `MultipleTextInput.svelte:191` | visible button text |

  Reverse-parity is clean: 0 keys in `messages/` absent from `translations/`
  (`messages/en/lang.json` has no counterpart — expected, it is the locale-name catalog).
- **D-09 (MF2 plural declaration for `selectExact` only):** Author `selectExact` as an inlang
  **MF2 plural declaration** in the runtime catalog (the shape used by
  `questions.category.numQuestions`), so it is grammatically correct at count=1 rather than
  rendering "Select 1 options.". The remaining 6 keys are plain interpolation strings
  mirroring the type-gen source verbatim. **Accepted tradeoff:** the two catalogs now differ
  in shape for this one key, so a byte-diff no longer detects drift for it — D-10's parity
  check (key-set, not value-shape) is what carries drift detection instead. Do NOT push MF2
  plurals back into the type-gen source or the 7 locales' wording.
- **D-10 (Key-set parity check — lands after the fix):** Add a unit test (or lint script)
  asserting `translations/{locale}` and `messages/{locale}` have **identical key sets**.
  ~30 lines; it just found 7 real bugs in one run; it makes the class structurally
  unreinventable. It will hard-fail until D-08 is complete, so sequence it after.
- **D-11 (Restore the withheld assertion + strip the obsolete comment):** Restore `/2.*3/` at
  `candidate-journey.spec.ts:813` **and strip the now-obsolete BLOCKER-130-05 comment block**
  (`candidate-journey.spec.ts:803-813`). Add assertions for the newly-fixed keys only where a
  spec already visits them — no new spec files for coverage's sake.
- **FYI (not a decision):** `apps/frontend/src/lib/paraglide/` is gitignored
  (`apps/frontend/.gitignore:19`, 0 files tracked) — generated output is not committed, so no
  regeneration artefacts land in the diff.

### FIX-03 — boolean answer guard
- **D-12 (`isEmptyValue()`, NOT `== null` — documented roadmap deviation):** Use
  `isEmptyValue(localizedAnswer?.value)` (`@openvaa/core`) at
  `candidate/(protected)/questions/+page.svelte:58`. The roadmap's literal wording prescribes
  `== null`, but the sibling completion-gating path 30 lines away
  (`candidateContext.svelte.ts:233`) already uses `isEmptyValue()`, which returns `true` for
  `null`/`undefined`/`''`/`[]`/empty objects and `false` for `false` and `0`. With `== null`,
  a saved answer of `''` or `[]` would start rendering as **answered** on the overview while
  `unansweredOpinionQuestions` still counted it unanswered — trading one inconsistency for
  another. **This deviation is deliberate and operator-approved; record it in the SUMMARY and
  correct the roadmap/requirement wording accordingly.**
- **D-13 (Widen the sweep repo-wide):** A frontend-only grep for sibling truthiness guards on
  answer values already came back with `questions/+page.svelte:58` as the **only** site (the
  audit's "and in the completion gating" claim does not hold). Per operator decision, widen to
  a **repo-wide `!x.value` / falsy-guard audit across `packages/` too**, not just
  `apps/frontend/src`. Record the sweep result as evidence; fix any genuine
  `false`/`0`-swallowing guard found on answer-like values, and list anything deliberately
  left alone with a reason.
- **D-14 (Lock with E2E):** A candidate answers a boolean opinion question "No", returns to the
  overview, and sees it rendered as **answered**. This exercises the real save→reload→render
  path, which is where the bug lives. No unit test on `getSavedAnswer` (it is module-local to a
  `+page.svelte` and would need extraction to be testable).

### Verification gate
- **D-15 (Keep 3× determinism):** Full E2E suite green to the **3×** standard — fresh `:5173`
  dev server and clean DB (`yarn db:reset`) per run, 0 failed / 0 did-not-run, count restarts
  from 0 after any fix. Not reduced to 1×: this phase touches the a11y settle logic, exactly
  the kind of change that has produced parallel-pressure-dependent flakes here before (the
  2026-06-22 debug doc's original flake reproduced only under `--workers>1`).
- **D-16 (Static gates):** svelte-check stays **0/0**; `lint:check`, prettier `format:check`,
  and `typecheck:tests` clean. Unit suite green (D-10's parity check runs here).

### Claude's Discretion
- Exact naming/placement of the `contentTestId` field and how the route-entry type is
  expressed (interface vs. discriminated union), provided it is **required**.
- The fixture mechanics for reaching the filter-drawer scan route (D-05) — reuse an existing
  results-page fixture path if one fits.
- Whether the key-set parity check (D-10) is a vitest unit test or a lint script, and where it
  lives — provided it runs in the standard `yarn test:unit` / CI path.
- Plan decomposition and wave structure, subject to the single-`:5173` serialization
  constraint (E2E gate plans cannot parallelize) and to D-10 landing after D-08.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase governance
- `.planning/ROADMAP.md` §"Phase 134" — goal, deps, the 4 success criteria. **Note:** criteria
  1 and 3 carry premises this context corrects (D-01, D-12) — the corrections win, and
  correcting the roadmap text is itself in-scope work (D-01c).
- `.planning/REQUIREMENTS.md` lines 92–94 (FIX-01/02/03) + the mapping table lines 201–203.
- `.planning/v2.14-MILESTONE-AUDIT.md` — the audit that raised these; its FIX-01 12/12-FAIL
  figure and FIX-03 "two sites" claim are **stale** and must be corrected in-phase.
- `.planning/phases/134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure/134-DISCUSSION-POINTS.md`
  — the ticked decision source for everything above.

### FIX-01 / a11y gate (code)
- `tests/tests/specs/**/a11y-smoke.spec.ts` — `UNLOCATED_ROUTES` route entries at ~150-163
  (the weak `settle`), `assertAxeGates`, `awaitAnimationsSettled`.
- `apps/frontend/src/app.css:492` (`.label { color: inherit }`, leave as-is) and `:384`
  (`small-label`, the D-02 replacement token).
- `apps/frontend/src/lib/components/…/NumericEntityFilter.svelte:85,98,113` — the `text-label`
  dead class to replace.
- `EnumeratedEntityFilter.svelte:198`, `ElectionSelector.svelte:56` — audit-named surfaces,
  verified clean; do not change unless the hardened scan says otherwise.
- Commit `0eb27c677` — the app-side fix the audit predates.

### FIX-02 (code)
- `apps/frontend/messages/{locale}/*.json` — the **runtime** Paraglide catalog (target).
- `apps/frontend/project.inlang/settings.json:53` — where that catalog is registered.
- `apps/frontend/src/lib/i18n/translations/` — the type-gen source (values to mirror).
- `questions.category.numQuestions` — the in-repo MF2 plural-declaration shape for D-09.
- Call sites: `QuestionChoices.svelte:421-422`, `AccordionSelect.svelte:84`,
  `MultipleTextInput.svelte:176,183,191,206`.
- `tests/tests/specs/candidate/candidate-journey.spec.ts:803-813` — the withheld `/2.*3/`
  assertion + the BLOCKER-130-05 comment block to strip.

### FIX-03 (code)
- `apps/frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/+page.svelte:58`
  — the guard to fix.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:233` — the sibling
  `isEmptyValue()` path this must stay consistent with.
- `packages/core` — `isEmptyValue()` definition/semantics.

### Gate precedent
- `.planning/phases/132-milestone-close-green-gate-svelte-check-zero-flip/132-CONTEXT.md`
  D-04..D-07 — the 3× run mechanics, restart-on-failure rule, and the environment-wedge
  (`db:reset` storage-502 / imgproxy 502) recovery runbook that also applies here.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`small-label`** (`app.css:384`) — the existing opaque muted-label token; `ConstituencySelector`
  and `QuestionChoices` already consume it. D-02 is a swap onto an established token, not a new one.
- **`isEmptyValue()`** (`@openvaa/core`) — canonical empty-answer predicate, already load-bearing in
  `candidateContext.svelte.ts:233`. D-12 reuses it rather than introducing a second convention.
- **MF2 plural declaration** for `questions.category.numQuestions` — the in-repo template for D-09.
- **`assertAxeGates` / `awaitAnimationsSettled`** — the existing scan helpers; D-04 changes *when*
  they run, not what they assert.

### Established Patterns
- **3× determinism gate:** fresh `:5173` + clean DB per run; count restarts after any fix; "did not
  run" = failure; no skips, ever (CLAUDE.md cardinal rule).
- **Settled-DOM before assertion:** Phase 131's hardened `navigateToFirstQuestion` (terminal-state
  settle after `waitForURL`) is the proven shape; D-04 is the a11y-scan analog.
- **Runtime vs. type-gen catalog split:** the two i18n catalogs are independent; adding to
  `translations/` alone does nothing at runtime. That asymmetry is the whole FIX-02 defect.

### Integration Points
- **Milestone close:** this phase is the last before `/gsd-complete-milestone` for v2.14; its
  requirement flips (FIX-01/02/03) and corrected audit text are what the close consumes.
- **Every future a11y scan route** must now declare `contentTestId` (D-04) — the lasting deliverable.
- **`yarn test:unit`** gains the catalog parity check (D-10) — it will fail loudly on any future
  one-sided key addition.
- **Single `:5173` constraint:** E2E gate plans serialize; no parallel E2E waves.
</code_context>

<specifics>
## Specific Ideas

- Sequence matters: D-08 (add the 7 keys) **before** D-10 (parity check), or the unit suite goes
  red mid-phase by construction.
- D-07 is the schedule risk in this phase, not the three named fixes. Harden the settle early so
  whatever it surfaces has runway, rather than discovering it during the 3× gate.
- The corrected-bookkeeping work (D-01c) is real deliverable content, not a footnote: the audit,
  ROADMAP criterion 1, ROADMAP criterion 3, and REQUIREMENTS FIX-01/FIX-03 wording all carry
  premises now known to be wrong.
- Supabase wedge recovery (carried from Phase 131/132): repeated `db:reset` storage-502 →
  `yarn db:stop && yarn db:start && yarn db:reset`, then assert the `public-assets` bucket exists.
  NEVER run bare `npx supabase start` from the repo root (steals :54322).
</specifics>

<deferred>
## Deferred Ideas

- **Catalog unification** — collapsing `translations/` and `messages/` into a single source so the
  duplication disappears. Explicitly rejected for this phase (refactor, not defect closure); D-10's
  parity check is the interim guard.
- **MF2 plurals in both catalogs** — correct grammar *and* shape parity, but touches the type-gen
  source and 7 locales' wording. Not now (D-09 takes the runtime-only variant).
- **A `--color-label` theme token** — considered and rejected for D-02 in favour of the existing
  `small-label`.
- **App-wide `.label` audit** — rejected scope broadening for FIX-01 (D-01).
- **`preview/+page.svelte:32` `dataRoot` alias-indirection warning** (audit §4.4) — out of scope,
  pre-existing, does not currently manifest.
- **DEF-120-03-01 feedback rate-limit teardown** (audit §4.5) — out of scope.

</deferred>

---

*Phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure*
*Context gathered: 2026-08-10*
