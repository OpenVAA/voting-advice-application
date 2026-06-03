# Voter journey — absorbed-tests migration map

> Phase 88 Plan 01 Task 7. Developer-facing cross-reference between the new
> `voter-journey.spec.ts` and the existing pre-Phase-88 voter test
> inventory.

## Context

The voter journey absorbs ~15 existing voter-app spec entries plus
introduces ~25 NEW/MOVE steps from `TEST-INVENTORY-REFACTOR-1.md:204-378`.
This README maps every absorbed test in `TEST-INVENTORY.md` sections 9.1,
9.4, 9.5, 9.6, 9.9 against its position in the new spec, so 88-02+
migration plans can pick up the migration cleanly.

- Journey spec: `tests/tests/specs/voter/voter-journey.spec.ts`
- Authoritative design source:
  [`TEST-INVENTORY-REFACTOR-1.md`](../../../../TEST-INVENTORY-REFACTOR-1.md)
  lines 1-378 (lines 379+ deferred to 88-NN).
- Phase context: `.planning/phases/88-.../88-CONTEXT.md`.

Step status legend:

- **executes**: spec runs real assertions against the live frontend.
- **deferred-88-nn**: spec step exists as a placeholder with a
  `console.log` note; assertions land in 88-02+ once empirically
  validated against base. Driven by Plan 88-01 Risk #2 + #7.

## Migration table

| Refactor-doc step                                                                                          | Source (TEST-INVENTORY.md)         | Marker      | Journey location                                            | Status         |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------- | ---------------------------------------------------------------- | -------------- |
| 9.1.1 should load home page and display start button (refactor-doc:208)                                    | voter-journey.spec.ts:110          | MOVED       | `static: home page renders + start button`                       | executes       |
| 9.9.1 about page renders correctly (refactor-doc:210)                                                      | voter-static-pages.spec.ts:32      | MOVED       | `static: about page renders correctly`                           | executes       |
| should back button and go to home page (refactor-doc:212)                                                  | —                                  | NEW/MOVE    | `static: about → back button returns to home`                    | executes       |
| 9.9.2 info page renders correctly (refactor-doc:214)                                                       | voter-static-pages.spec.ts:45      | MOVED       | `static: info page renders correctly`                            | executes       |
| 9.9.3 privacy page renders correctly (refactor-doc:216)                                                    | voter-static-pages.spec.ts:58      | MOVED       | `static: privacy page renders correctly`                         | executes       |
| should show intro page with correct steps (refactor-doc:220)                                               | —                                  | NEW/MOVE    | `intro: home → start → intro page` + `intro: intro page continue` | executes       |
| should show election selector (refactor-doc:222)                                                           | —                                  | NEW/MOVE    | `elections: should show election selector`                       | executes       |
| should disable continue button when no election selected (refactor-doc:223)                                | —                                  | NEW/MOVE    | `[deferred-88-nn] elections: continue disabled`                  | deferred-88-nn |
| select both elections (refactor-doc:224)                                                                   | —                                  | NEW/MOVE    | `elections: continue with default selection`                     | executes       |
| should show constituency selector with hierarchical CG (only municipalities) (refactor-doc:226)            | —                                  | NEW/MOVE    | `constituencies: list visible` + `[deferred-88-nn] only-municipalities` | deferred-88-nn |
| should disable continue when no constituency selected (refactor-doc:227)                                   | —                                  | NEW/MOVE    | (folded into deferred constituencies cluster)                    | deferred-88-nn |
| select CO-Mun-NE + continue (refactor-doc:228)                                                             | —                                  | NEW/MOVE    | `[deferred-88-nn] constituencies-selection`                      | deferred-88-nn |
| 9.1.3 should show questions intro page with start button (refactor-doc:230)                                | voter-journey.spec.ts:140          | MOVED REPL  | `[deferred-88-nn] questions-intro cluster`                       | deferred-88-nn |
| category-list checkboxes / filtered-out / counts / minAnswers gate / uncheck Base-C (refactor-doc:234-239) | —                                  | NEW/MOVE    | (folded into deferred questions-intro cluster)                   | deferred-88-nn |
| should show category intro for QG-Opin-Base with continue (refactor-doc:242)                               | —                                  | NEW/MOVE    | (folded into deferred per-question chrome cluster)               | deferred-88-nn |
| should answer Likert 5/4/7/Categorical/Boolean with chrome (refactor-doc:247-258)                          | —                                  | NEW/MOVE    | `[deferred-88-nn] questions: per-question chrome` + `polar-MAX answer loop` | deferred-88-nn |
| 9.3.2 browser-back preserves answer state across navigation (refactor-doc:253-255)                         | voter-navigation.spec.ts:252       | MOVED       | (folded into deferred per-question chrome cluster)               | deferred-88-nn |
| should show results link enabled when minimum answers reached (refactor-doc:259)                           | —                                  | NEW/MOVE    | (folded into deferred per-question chrome cluster)               | deferred-88-nn |
| previous-button + delete + reanswer roundtrip (refactor-doc:265-269)                                       | —                                  | NEW/MOVE    | (folded into deferred per-question chrome cluster)               | deferred-88-nn |
| skip QG-Opin-Base-B via skip button (refactor-doc:271)                                                     | —                                  | NEW/MOVE    | `[deferred-88-nn] category-skip`                                 | deferred-88-nn |
| should not show deselected QG-Opin-Base-C (refactor-doc:273)                                               | —                                  | NEW/MOVE    | (folded into deferred category-skip cluster)                     | deferred-88-nn |
| should show election tag for QU-Opin-EL-Reg-1 (refactor-doc:276)                                           | —                                  | NEW/MOVE    | `[deferred-88-nn] category-scoping`                              | deferred-88-nn |
| should skip question with skip button (refactor-doc:277)                                                   | —                                  | NEW/MOVE    | (folded into deferred category-scoping cluster)                  | deferred-88-nn |
| filtered-out QG-Opin-CO-Mun-SE-SW (refactor-doc:278-282)                                                   | —                                  | NEW/MOVE    | (folded into deferred category-scoping cluster)                  | deferred-88-nn |
| filtered-in QU-Open-Filt-Mun-NE shown then skipped (refactor-doc:284-286)                                  | —                                  | NEW/MOVE    | (folded into deferred category-scoping cluster)                  | deferred-88-nn |
| filtered-out QG-Opin-Filt-B (refactor-doc:288)                                                             | —                                  | NEW/MOVE    | (folded into deferred category-scoping cluster)                  | deferred-88-nn |
| should show results (refactor-doc:291)                                                                     | —                                  | NEW/MOVE    | `[deferred-88-nn] results-landing`                               | deferred-88-nn |
| 9.5.2 entity type tabs visible (refactor-doc:296)                                                          | voter-results.spec.ts:118          | MOVED       | (folded into deferred results-landing cluster)                   | deferred-88-nn |
| 9.5.3 should switch parties/candidates section (refactor-doc:298)                                          | voter-results.spec.ts:131          | MOVED       | (folded into deferred results-landing cluster)                   | deferred-88-nn |
| 9.5.1 candidate cards with portrait/electionSymbol/match/submatches (refactor-doc:300-304)                 | voter-results.spec.ts:100          | MOVED       | `[deferred-88-nn] result-card-content`                           | deferred-88-nn |
| organizations section + abbreviations + 3-cand collapse-expand + alliance info (refactor-doc:307-314)      | —                                  | NEW/MOVE    | (folded into deferred result-card-content cluster)               | deferred-88-nn |
| 9.4.5 should NOT show hidden candidate (no termsOfUseAccepted) (refactor-doc:316)                          | voter-matching.spec.ts:280         | MOVED       | `[deferred-88-nn] hidden-candidate`                              | deferred-88-nn |
| 9.4.1 candidates in correct match ranking order (refactor-doc:322)                                         | voter-matching.spec.ts:214         | MOVED       | `[deferred-88-nn] matching: ranking order`                       | deferred-88-nn |
| 9.4.2 perfect-match candidate as top result (refactor-doc:324)                                             | voter-matching.spec.ts:240         | MOVED       | (folded into deferred matching cluster)                          | deferred-88-nn |
| 9.4.3 worst-match candidate as last result (refactor-doc:326)                                              | voter-matching.spec.ts:247         | MOVED       | (folded into deferred matching cluster)                          | deferred-88-nn |
| 9.4.4 partial-answer candidate with valid score (refactor-doc:328)                                         | voter-matching.spec.ts:265         | MOVED       | (folded into deferred matching cluster)                          | deferred-88-nn |
| 9.6.1 open candidate detail drawer (refactor-doc:332)                                                      | voter-detail.spec.ts:40            | MOVED       | `[deferred-88-nn] detail: drawer open`                           | deferred-88-nn |
| 9.6.2 display candidate info and opinions tabs (refactor-doc:334)                                          | voter-detail.spec.ts:52            | MOVED       | (folded into deferred detail-drawer cluster)                     | deferred-88-nn |
| 9.6.3 display candidate answers in info/opinions tabs (refactor-doc:336)                                   | voter-detail.spec.ts:76            | MOVED       | `[deferred-88-nn] detail: per-info-question-type render`         | deferred-88-nn |
| per-info-question-type render grid (9 types) (refactor-doc:338-348)                                        | —                                  | NEW/MOVE    | (folded into deferred per-info-question-type cluster)            | deferred-88-nn |
| 9.6.5 case (a) — both answered (refactor-doc:349)                                                          | voter-detail.spec.ts:231           | MOVED       | `[deferred-88-nn] detail: 9.6.5-8 voter-vs-entity matrix`        | deferred-88-nn |
| 9.6.6 case (b) — voter answered, entity missing (refactor-doc:351)                                         | voter-detail.spec.ts:255           | MOVED       | (folded into deferred 4-case matrix cluster)                     | deferred-88-nn |
| 9.6.7 case (c) — voter missing, entity answered (refactor-doc:353)                                         | voter-detail.spec.ts:276           | MOVED       | (folded into deferred 4-case matrix cluster)                     | deferred-88-nn |
| 9.6.8 case (d) — both missing (refactor-doc:355)                                                           | voter-detail.spec.ts:299           | MOVED       | (folded into deferred 4-case matrix cluster)                     | deferred-88-nn |
| 9.6.4 party detail drawer (info, candidates, opinions tabs) (refactor-doc:357)                             | voter-detail.spec.ts:125           | MOVED       | `[deferred-88-nn] party-drawer`                                  | deferred-88-nn |
| correct filters list (refactor-doc:359)                                                                    | —                                  | NEW/MOVE    | (folded into deferred party-drawer cluster)                      | deferred-88-nn |
| 9.5.5 filter toggle narrows list (RESULTS-01 + RESULTS-02) (refactor-doc:361)                              | voter-results.spec.ts:173          | MOVED       | `[deferred-88-nn] filters: toggle`                               | deferred-88-nn |
| 9.5.6 filter state resets on plural tab switch (D-14) (refactor-doc:363)                                   | voter-results.spec.ts:273          | MOVED       | `[deferred-88-nn] filters: persistence cluster`                  | deferred-88-nn |
| 9.5.7 filter state survives drawer open/close (D-15) (refactor-doc:365)                                    | voter-results.spec.ts:331          | MOVED       | (folded into deferred filter-persistence cluster)                | deferred-88-nn |
| 9.5.10 Browser Back through tab+drawer (D-13) (refactor-doc:367)                                           | voter-results.spec.ts:439          | MOVED       | (folded into deferred filter-persistence cluster)                | deferred-88-nn |
| 9.5.14 SETTINGS-01 wave B NumberFilter (refactor-doc:369)                                                  | voter-results.spec.ts:613          | MOVED       | `[deferred-88-nn] filters: SETTINGS-01 wave B cluster`           | deferred-88-nn |
| 9.5.15 SETTINGS-01 wave B TextFilter (refactor-doc:371)                                                    | voter-results.spec.ts:672          | MOVED       | (folded into deferred SETTINGS-01 wave B cluster)                | deferred-88-nn |
| 9.5.16 SETTINGS-01 wave B ChoiceQuestionFilter (categorical) (refactor-doc:373)                            | voter-results.spec.ts:731          | MOVED       | (folded into deferred SETTINGS-01 wave B cluster)                | deferred-88-nn |
| 9.5.17 SETTINGS-01 wave B FilterGroup AND (refactor-doc:375)                                               | voter-results.spec.ts:797          | MOVED       | (folded into deferred SETTINGS-01 wave B cluster)                | deferred-88-nn |
| 9.5.18 SETTINGS-01 wave B MISSING_FILTER_VALUE (refactor-doc:378)                                          | voter-results.spec.ts:889          | MOVED       | (folded into deferred SETTINGS-01 wave B cluster)                | deferred-88-nn |

## Net-new (NEW/MOVE) steps

These steps have no clean predecessor in `TEST-INVENTORY.md` — they were
authored from scratch per the refactor doc:

- About → back button to home (refactor-doc:212)
- Intro page rendering (refactor-doc:220)
- Election selector (refactor-doc:222)
- Continue-disabled when no election (refactor-doc:223)
- Select both elections (refactor-doc:224)
- Hierarchical CG selector with only-municipalities (refactor-doc:226)
- Continue-disabled when no constituency (refactor-doc:227)
- Category-list checkboxes / filtered-out / counts / minAnswers gate / uncheck Base-C (refactor-doc:234-239)
- Category-intro for QG-Opin-Base (refactor-doc:242)
- Likert 4 / Likert 7 / Categorical / Boolean variants with per-question chrome (refactor-doc:251-258)
- Results-link enable behaviour (refactor-doc:259, 267, 269)
- Previous-button + delete + reanswer roundtrip (refactor-doc:265-269)
- Category-skip semantics (refactor-doc:271)
- Election tag (Regional) for EL-Reg question (refactor-doc:276)
- Filtered-out QG-Opin-CO-Mun-SE-SW (refactor-doc:278-282)
- Filtered-in QU-Open-Filt-Mun-NE shown then skipped (refactor-doc:284-286)
- Filtered-out QG-Opin-Filt-B (refactor-doc:288)
- Per-info-question-type render grid (9 types) (refactor-doc:338-348)
- Result card content cluster (portraits, submatches, independent, alliance info, 3-cand expand, election switching) (refactor-doc:300-314)
- Correct filters list for candidates (refactor-doc:359)

## Deferred to 88-NN (lines 379+)

`TEST-INVENTORY-REFACTOR-1.md` lines 379+ are explicitly out of scope for
Plan 88-01 and are deferred to subsequent plans. The next plan's
`CONTEXT.md` will scope which cluster lands first. Until then, the
existing spec entries that the refactor doc enumerates below line 378
remain in place — they continue to run under their current playwright
project entries.

## How 88-02+ should use this map

1. **Pick a cluster** marked `deferred-88-nn` in the table above.
2. **Locate the source test** in the existing inventory column to copy
   the assertion shape.
3. **Replace** the relevant `[deferred-88-nn]` test.step body in
   `voter-journey.spec.ts` with real assertions against the base
   dataset.
4. **Confirm** the source test can be removed from its existing project
   (or marked `test.skip` if it's worth keeping under the e2e dataset
   as a regression fallback). Document the removal in the 88-NN plan's
   "Files retired" section.
5. **Verify** the journey + the remaining suite stays green per
   the standard 3-cold-start gating constraint.

## Constituency-selection landmine (cross-ref)

The `[deferred-88-nn] constituencies-selection` step is the highest-risk
cluster. During Plan 88-01 Task 5 verification, the naive
"select first option per combobox" approach triggered the
`voter-missing-nominations-modal` because one of the selected
constituencies had no nominations for one of the selected elections.
The base template DOES declare nominations across all 6 constituencies
for both elections — but the UI's hierarchical CG resolution + combobox
ordering doesn't trivially match the dataset. This needs empirical
inspection of the live frontend's constituency-selector under base
before any downstream answer-loop step can run.
