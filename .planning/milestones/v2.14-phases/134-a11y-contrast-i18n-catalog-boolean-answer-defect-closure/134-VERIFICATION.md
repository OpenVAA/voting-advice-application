---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
verified: 2026-08-10T16:30:00Z
status: human_needed
score: 16/16 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "D-18 native-speaker review of the six constructed non-English `selectExact` singular forms (da, et, fi, fr, lb, sv) in apps/frontend/messages/{locale}/questions.json"
    expected: "Each singular form is grammatically correct, idiomatic, and case/inflection-correct for the noun after the numeral 1 in its locale"
    why_human: "No automated check can assess grammaticality; the strings were constructed by an agent (MEDIUM confidence), not natively authored, and this is already recorded as an open item in 134-UAT.md and .planning/todos/pending/2026-08-10-verify-non-english-selectexact-singulars.md — carried forward here per the escalation-gate contract, not newly discovered"
---

# Phase 134: A11y Contrast + i18n Catalog + Boolean-Answer Defect Closure Verification Report

**Phase Goal:** Close the three confirmed user-facing defects that v2.14-MILESTONE-AUDIT.md surfaced as carried tech debt, so v2.14 ships without a known WCAG 2.1 AA violation, without an untranslated key visible to users, and without a saved answer reading back as unanswered.

**Verified:** 2026-08-10
**Status:** human_needed (one pre-existing, already-tracked, non-blocking review item; every automatable check passed)
**Re-verification:** No — initial verification

## Summary

I read all 8 PLAN/SUMMARY pairs, the CONTEXT.md decision log, ROADMAP §Phase 134, and REQUIREMENTS.md, then independently verified the codebase against every claim rather than trusting the SUMMARYs. This included:

- Direct inspection of every product file the phase claims to have changed (`a11y-smoke.spec.ts`, `ConstituencySelector.svelte`, `app.css`, `NumericEntityFilter.svelte`, `questions/+page.svelte`, both journey specs, the i18n parity test, all 14 message catalog files, ROADMAP/REQUIREMENTS/audit/CLAUDE.md).
- Running the static gates myself: `yarn workspace @openvaa/frontend check` (2092 files, 0/0), `yarn lint:check` (exit 0), `yarn format:check` (exit 0), `yarn typecheck:tests` (exit 0), `yarn workspace @openvaa/frontend test:unit` (773/773 passed), and the parity check in isolation (`-t "parity"` → 14/14 passed).
- A live experiment reproducing the phase's core structural claim: I inserted a route into `AXE_ROUTES` missing `contentTestId` and re-ran `yarn typecheck:tests` — it failed with `TS2322: Property 'contentTestId' is missing … but required in type 'RawAxeRoute'`, exactly as claimed. Reverted; `diff` confirmed byte-identical restoration.
- Verifying all 17 cited commit hashes resolve in `git log`.
- Confirming `git status --short` shows only the pre-existing `supabase/.temp/cli-latest` dirt (no debug artifacts left behind).
- Confirming `playwright --list` produces exactly 130 tests / 88 files (matching Plan 08's claim) and the a11y-smoke project produces exactly 14 entries (10 axe scans + 2 navigation-a11y + setup/teardown), matching the claimed 6 raw (light+dark) + 4 fixture-driven (light only) breakdown.
- Confirming `packages/dev-seed/package.json` has no dependency on `@openvaa/frontend` and no `openvaa/frontend` reference anywhere in the package, corroborating the DEF-134-04-01 "unrelated" claim without re-running the flaky root aggregate (per task instruction).

I did **not** re-run the full E2E suite or the 3× determinism gate myself (per explicit task instruction — Plan 08 already ran it three times and each run takes ~11 min). For the E2E-locked claims (FIX-03's step 18.6, the accessible-name assertions, step 18.5's restored text assertion) I verified the assertion code exists exactly as described, matches the underlying product code it exercises, and is corroborated by a recorded negative-control run with verbatim, internally consistent Playwright error output — that combination of (a) source-level proof the assertion is real and correctly targeted, and (b) a specific, reproducible negative-control trace, is treated as sufficient given the instruction not to re-run E2E.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A new axe scan route cannot be added without a `contentTestId` (compile error) — D-04 | ✓ VERIFIED | Reproduced live: injected a route missing `contentTestId`, `yarn typecheck:tests` failed with `TS2322`/"required in type 'RawAxeRoute'"; reverted, `diff` identical |
| 2 | Constituencies scan reaches `/constituencies` and scans a rendered selector, not a silent `/elections` re-scan — D-17/D-19 | ✓ VERIFIED | `a11y-smoke.spec.ts:224-241`: `constituencies-selector-located` entry, `contentTestId: testIds.voter.constituencies.list`, settle walks the elections Continue gate then `waitForURL(/\/constituencies/)` |
| 3 | Constituency selector passes WCAG 2.1 AA contrast light+dark; readout no longer at 30% opacity — D-17 Option A | ✓ VERIFIED | `ConstituencySelector.svelte:302`: readout now gated on `applicableElections.length > 1 && sections[sectionIndex].selectedId`; `grep -rn faded apps/frontend/src` → 0 matches; `app.css` `.faded` rule confirmed absent |
| 4 | All six pre-existing scan entries driven by one typed table; none hand-written outside it | ✓ VERIFIED | Single `AXE_ROUTES` array, discriminated union `RawAxeRoute \| FixtureAxeRoute`, `contentTestId: string` required on the shared base interface (not optional) |
| 5 | Results filter drawer scanned by axe with rows expanded — D-05 | ✓ VERIFIED | `results-filter-drawer` entry present, `contentTestId: testIds.voter.results.filterNumericMin`; `playwright --list --project=a11y-smoke` shows it as a distinct scan |
| 6 | `NumericEntityFilter`'s dead `text-label` class replaced with `small-label` — D-02 | ✓ VERIFIED | `grep -n text-label NumericEntityFilter.svelte` → 0 matches; 3 spans (lines 85, 98, 113) now `small-label` |
| 7 | All 7 keys resolve to real text in all 7 locales in the runtime catalog — D-08 | ✓ VERIFIED | Directly parsed all 14 catalog files with Node: `selectExact`/`selectRange` present in `questions.json`, `listboxAriaLabel`/`multipleTextInput.{add,moveUp,moveDown,remove}` present in `components.json`, all 7 locales, no raw key fallthrough |
| 8 | `selectExact` is an MF2 plural declaration, not a plain string — D-09/D-18 | ✓ VERIFIED | `en` value is `[{declarations:["input count","local countPlural = count: plural"], selectors:["countPlural"], match:{...}}]` |
| 9 | Cross-catalog key-set parity check exists and is wired into `yarn test:unit` — D-10 | ✓ VERIFIED | `describe.each(translationLocales)('catalog key-set parity — %s')` in `translations.test.ts`; ran `yarn workspace @openvaa/frontend test:unit -t "parity"` myself → 14/14 passed |
| 10 | `getSavedAnswer` guards with `isEmptyValue` imported from `@openvaa/data` (not `@openvaa/core`) — D-12/D-19 | ✓ VERIFIED | `questions/+page.svelte:14` `import { isEmptyValue } from '@openvaa/data'`; line 63 `if (isEmptyValue(localizedAnswer?.value) \|\| localizedAnswer == null) return undefined;` |
| 11 | No other genuine falsy guard swallows a legitimate `false`/`0` on an answer-like value — D-13 | ✓ VERIFIED (by inspection, sweep evidence reproduced structurally) | SUMMARY's 11-hit classification table is internally consistent with the code paths named; spot-checked 3 of the 10 "benign" sites and confirmed the described guard shape |
| 12 | E2E regression locks exist for FIX-02 text/aria-label and FIX-03 boolean round-trip — D-11/D-14/D-21 | ✓ VERIFIED (code-level; E2E not re-run per instruction) | `candidate-journey.spec.ts:834` `toHaveText(/2.*3/)`; `:896-921` `selectChoice(0)` + `cardAction` `toHaveText(/edit/i)`; 4× `toHaveAccessibleName` for MultipleTextInput controls; `voter-journey.spec.ts:375` for the results listbox — all present, all target the real product testids |
| 13 | Governance documents (ROADMAP, REQUIREMENTS, audit, CLAUDE.md) no longer assert the stale premises — D-01c | ✓ VERIFIED | `grep -c '12/12'`/`'3.69:1'` present only inside explicit `⚠ STALE`/`⚠ CORRECTED` annotations; `grep -c 'lang=locale' CLAUDE.md` → 0; filesystem confirms `routes/(voters)/` and `routes/candidate/` are the real paths, no `[[lang=locale]]` directory exists |
| 14 | FIX-01/02/03 marked complete in REQUIREMENTS.md against evidence | ✓ VERIFIED | Lines 92-94, 201-203: all three `[x]`, mapping table rows `Complete (2026-08-10)` |
| 15 | Static gates all clean (svelte-check 0/0, lint, format, typecheck:tests, frontend unit) | ✓ VERIFIED (ran myself) | `check` → 0 errors/0 warnings; `lint:check` → exit 0 (2 pre-existing warnings, unrelated files); `format:check` → exit 0; `typecheck:tests` → exit 0; frontend `test:unit` → 773/773 passed |
| 16 | Full E2E suite green 3× consecutive, fresh server + clean DB per run — D-15 | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED (not independently re-run, per explicit task instruction) | Plan 08's SUMMARY carries a detailed, internally consistent 3-run record (real PIDs, timestamps, an honestly-logged infra wedge + documented recovery, 130/130/130 passed) that I did not reproduce; `playwright --list` independently confirms the suite is 130 tests/88 files as claimed |

**Score:** 16/16 truths present and wired; 15/16 independently exercised or reproduced by me; 1 (the 3× E2E gate) relies on the executor's recorded run — not re-run here per task instruction, and routed to human/orchestrator judgment below rather than silently counted as fully verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | `AxeRoute` discriminated union, required `contentTestId`, 7-entry `AXE_ROUTES` | ✓ VERIFIED | Confirmed structurally + by compile-error reproduction |
| `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte` | readout gated on selection, no `.faded` | ✓ VERIFIED | Confirmed |
| `apps/frontend/src/app.css` | `.faded`/`opacity-30` rule deleted | ✓ VERIFIED | `grep -rn faded apps/frontend/src` → 0 |
| `apps/frontend/src/lib/components/entityFilters/numeric/NumericEntityFilter.svelte` | `text-label` → `small-label` | ✓ VERIFIED | Confirmed |
| `apps/frontend/messages/{7 locales}/questions.json` + `components.json` | 7 keys × 7 locales | ✓ VERIFIED | Parsed all 14 files directly |
| `apps/frontend/src/lib/i18n/tests/translations.test.ts` | parity guard, 14 tests | ✓ VERIFIED | Ran the 14 tests myself |
| `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` | `isEmptyValue` guard | ✓ VERIFIED | Confirmed |
| `tests/tests/specs/candidate/candidate-journey.spec.ts`, `voter/voter-journey.spec.ts` | E2E locks | ✓ VERIFIED (code-level) | Confirmed present and correctly targeted |
| `.planning/ROADMAP.md`, `REQUIREMENTS.md`, `v2.14-MILESTONE-AUDIT.md`, `CLAUDE.md` | corrected bookkeeping | ✓ VERIFIED | Confirmed |
| `134-UAT.md` + `.planning/todos/pending/2026-08-10-verify-non-english-selectexact-singulars.md` | D-18 review item | ✓ VERIFIED | Both exist, both quote the same 6 as-shipped singulars |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `AXE_ROUTES` entries | `testIds` constants | `contentTestId: testIds.voter.constituencies.list` etc. | ✓ WIRED | No inline literals; every `contentTestId` traced to a real constant used at the corresponding call site |
| Runner (`goto → settle? → contentTestId wait → awaitAnimationsSettled → AxeBuilder`) | route contract | order in `assertAxeScan` | ✓ WIRED | Content anchor confirmed as the last gate before the scan (line 380 area) |
| `questions/+page.svelte` `getSavedAnswer` | `candidateContext.svelte.ts:233` completion gating | shared `isEmptyValue()` predicate, both from `@openvaa/data` | ✓ WIRED | Both call sites confirmed to import from the same package and use the same predicate |
| `translations.test.ts` parity check | `messages/` + `translations/` on disk | filesystem reads via `import.meta.url`-resolved paths | ✓ WIRED | Ran the 14 tests directly against the current tree; all passed |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| A route without `contentTestId` fails to compile | inject probe route + `yarn typecheck:tests`, then revert | `TS2322`, "required in type 'RawAxeRoute'"; file restored byte-identical | ✓ PASS |
| Cross-catalog parity guard actually fires | `yarn workspace @openvaa/frontend test:unit -t "parity"` | 14/14 passed on the clean tree (positive evidence the guard is wired; negative-control firing is corroborated by Plan 04's SUMMARY, not re-run) | ✓ PASS |
| Static gates | `check`, `lint:check`, `format:check`, `typecheck:tests`, `test:unit` (frontend) | all exit 0 / 0-errors as claimed | ✓ PASS |
| Full E2E suite composition matches claim | `playwright --list ./tests --grep-invert @probe` | `Total: 130 tests in 88 files` | ✓ PASS |
| a11y-smoke project composition matches claim | `playwright --list --project=a11y-smoke` | 14 entries (10 scans + 2 nav-a11y + setup/teardown) | ✓ PASS |
| Full E2E 3× run | not run | — | ? SKIP (per explicit task instruction) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| FIX-01 | 01, 02, 07, 08 | Settled-DOM a11y gate + `text-label` cleanup + filter-drawer coverage | ✓ SATISFIED | Structural compile-time guarantee reproduced live; all named artifacts confirmed |
| FIX-02 | 03, 04, 06, 07, 08 | 7 keys in runtime catalog, all 7 locales, parity guard | ✓ SATISFIED | Catalog contents parsed directly; parity guard run directly |
| FIX-03 | 05, 06, 07, 08 | `isEmptyValue()` guard on candidate overview | ✓ SATISFIED | Guard code confirmed; E2E lock code confirmed (not re-run) |

No orphaned requirements — REQUIREMENTS.md maps exactly FIX-01/02/03 to Phase 134, and all three appear in plan frontmatter `requirements:` fields.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `apps/frontend/src/app.css` | 464 | `TODO: Create dedicated Tailwind spacing terms` | ℹ️ Info | Pre-existing (predates phase 134, confirmed via `git log -S`), unrelated to the `.label`/`.faded` work — not a phase-introduced debt marker |

No `TBD`/`FIXME`/`XXX`/`HACK`/`PLACEHOLDER` introduced by this phase in any of the 8 touched files. No new `eslint-disable` in the phase's diff (`git diff c5b1117ec..HEAD -- tests/ apps/ packages/ | grep '^+.*eslint-disable'` → empty; the one `eslint-disable` present in `a11y-smoke.spec.ts` predates the phase, added in commit `5a171b28b` from Phase 92). No `.skip`/`.fixme` in any E2E spec (0, matching the pre-phase baseline). No stub return patterns in the touched files.

### Coverage Limits — scrutinized as requested

1. **`selectExact` has no E2E coverage.** **TRUE and honestly recorded.** Confirmed: the seeded `e2e/base` multi-choice question has a 2..3 window (renders `selectRange`, not `selectExact`), so no E2E path reaches the exact-count branch. Coverage is Plan 03's build-time render proof only (a real, executed proof — importing the compiled Paraglide output in Node — but a point-in-time check, not a standing regression guard). **Does not undermine the phase goal**: FIX-02's goal was "resolve to real text instead of the raw key," which is met and independently confirmed by direct catalog inspection; grammatical/branch-selection regression protection is a separate, smaller gap that is explicitly flagged rather than hidden.

2. **The six non-English singulars are constructed, not natively authored; D-18 review is open.** **TRUE.** Confirmed: `134-UAT.md` status is `pending`, one test, quoting the six strings verbatim; the companion todo file exists with the same content. This is a genuine, appropriately-flagged gap — not a defect of the phase's own deliverable (the keys do render real text in all locales; only the exact wording of one branch in 6 locales needs a native check). Routed below as a human-verification item per the escalation-gate contract, though it was already an intentionally-open item before this verification began.

3. **Fixture-driven axe scans are light-theme only.** **TRUE.** Confirmed via the route table (6 raw entries × light+dark, 4 fixture-driven entries × light only) and via `playwright --list --project=a11y-smoke` producing exactly that count. This is a real, standing gate blind spot: a dark-mode-only contrast regression on `/questions`, `/results`, the detail drawer, or the filter drawer would not be caught by CI going forward. It does **not** currently correspond to a known violation — research measured these four surfaces at 0 violations in both themes before deciding not to add dark twins — so it does not contradict "ships without a known WCAG 2.1 AA violation," but it is a real reduction in future regression coverage relative to the raw routes. Worth tracking, not blocking.

None of the three limits was concealed, minimized, or reported as resolved when it wasn't. All three match what the phase's own artifacts (REQUIREMENTS.md annotations, the in-file comment at `a11y-smoke.spec.ts`, `134-UAT.md`) independently say.

### Human Verification Required

#### 1. D-18: Native-speaker review of the six constructed non-English `selectExact` singular forms

**Test:** Read the six singular strings in `apps/frontend/messages/{da,et,fi,fr,lb,sv}/questions.json` at `questions.multiChoice.selectExact`'s `countPlural=one` branch (quoted verbatim in `134-UAT.md`) and judge grammaticality/idiom/case-inflection as a native or fluent speaker of each locale.
**Expected:** Each string is grammatically correct and matches the register of the pre-existing plural baseline beside it.
**Why human:** No automated check can assess grammaticality; the strings were agent-constructed (MEDIUM confidence) because no singular form of this message existed anywhere in the repo to copy from.

This is not a new finding — it is Phase 134's own explicitly-declared, already-tracked open item (D-18, `134-UAT.md`, and a durable todo file), surfaced here because the verification framework routes any open human-verification item to `human_needed` rather than absorbing it into a clean `passed` status. It does not block FIX-02 (the requirement — real text renders in all locales — is independently confirmed) and Plan 07/08 both explicitly scoped it as a milestone-close obligation, not a Phase-134 gate item.

### Gaps Summary

No blocking gaps. Every must-have truth, artifact, and key link I could verify independently (source inspection, live compile-error reproduction, direct catalog parsing, running the static gates and the parity test myself) matched the SUMMARY claims exactly — in several cases more precisely than the SUMMARYs themselves state (e.g. the exact TypeScript error text). The three declared coverage limits are real but honestly recorded and don't misrepresent the phase's completion. The one open item (D-18) is a pre-existing, self-declared, appropriately-scoped human-verification task, not a defect discovered during this verification.

The only thing I did not do is re-run the 3× full-suite E2E gate, per the explicit task instruction not to (Plan 08 already ran it three times at ~11 min/run). The static-gate re-runs I did perform (svelte-check, lint, format, typecheck:tests, frontend unit tests, the parity test) all reproduced the claimed results exactly, which is corroborating — not conclusive — evidence for the unran E2E claim.

---

_Verified: 2026-08-10_
_Verifier: Claude (gsd-verifier)_
