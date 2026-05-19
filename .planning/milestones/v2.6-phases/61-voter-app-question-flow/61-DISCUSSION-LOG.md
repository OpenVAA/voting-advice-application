# Phase 61: Voter-App Question Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 61-voter-app-question-flow
**Areas discussed:** Boolean UI (QUESTION-01), Boolean match-breakdown (QUESTION-02), Category default + reactivity (QUESTION-03), Scope fold for candidate-questions testId-timeout (QUESTION-04)

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Boolean answer UI pattern (QUESTION-01) | Visual/interaction shape for yes/no | ✓ |
| Boolean match-breakdown (QUESTION-02) | Display pattern on candidate result-detail | ✓ |
| Category default + reactivity (QUESTION-03) | Default state + counter fix | ✓ |
| Scope — include candidate-questions testId failures | Fold Phase 60 handoff into Phase 61 | ✓ |

**User's choice:** All four.

---

## Boolean Answer UI Pattern (QUESTION-01)

### Q1: Visual/interaction shape

| Option | Selected |
|--------|----------|
| Reuse QuestionChoices grid with 2 pseudo-choices | ✓ |
| Dedicated BooleanInput with two big buttons | |
| Toggle/slider (agree → disagree axis) | |

### Q2: Label framing

| Option | Selected |
|--------|----------|
| Yes / No from i18n defaults (`common.yes` / `common.no`) | ✓ |
| Agree / Disagree (opinion-framed) | |
| Admin-defined per question | |

### Q3: Synthesis layer

| Option | Selected |
|--------|----------|
| In `OpinionQuestionInput.svelte` — add `isBooleanQuestion` branch | ✓ |
| In `booleanQuestion.ts` — expose `.choices` getter | |
| In a wrapper — new `BooleanOpinionInput.svelte` component | |

### Q4: Skip behavior

| Option | Selected |
|--------|----------|
| Same as ordinal — skip button still available | ✓ |
| No skip for boolean — must answer yes or no | |
| Per-question customData flag | |

---

## Boolean Match-Breakdown (QUESTION-02)

### Q1: Match score computation

| Option | Selected |
|--------|----------|
| Treat as 2-point singleChoiceOrdinal | ✓ (user note: "The data BooleanQuestion already exposes all necessary methods for matching") |
| Exact-match only (binary) | |
| Custom subdimension pair (2-dim categorical) | |

**User's notes:** Critical correction — `BooleanQuestion._normalizeValue` already maps false→`COORDINATE.Min` and true→`COORDINATE.Max`; inherits default single-dim subdim. `@openvaa/matching` treats boolean identically to 2-point ordinal. **No matching-layer work is needed.** QUESTION-02 is purely a UI-layer dispatch fix.

### Q2: Display in match-breakdown UI

| Option | Selected |
|--------|----------|
| Extend the singleChoiceOrdinal renderer path | ✓ |
| Dedicated binary match renderer | |
| Reuse singleChoiceCategorical rendering with 2 categories | |

### Q3: Missing-side behavior

| Option | Selected |
|--------|----------|
| Same as ordinal — skip from match calc, show neutral/grayed | ✓ |
| Explicit 'not answered' badge with muted color | |
| Hide question from breakdown entirely | |

---

## Category Default + Reactivity (QUESTION-03)

### Q1: Default selection state

| Option | Selected |
|--------|----------|
| All opinion categories checked by default | ✓ (user note: "make a note that this item is on the list bc of a bug that needs to be inspected. The behaviour was correct sometimes but not always") |
| None checked — voter must opt in | |
| Admin-configurable via `app_customization` | |
| Persist last voter preference | |

**User's notes:** Default-all-checked is the product intent — BUT this is also a bug inspection item. The correct behavior manifests intermittently. Researcher/planner must investigate the failure mechanism.

### Q2: Reactivity fix shape

| Option | Selected |
|--------|----------|
| $derived migration per Phase 60 pattern | ✓ |
| Store-subscription fix (manual `.subscribe`) | |
| Investigate-first — code read before committing | |

### Q3: Counter scope

| Option | Selected |
|--------|----------|
| Opinion questions across selected categories only | |
| All questions (opinion + info) across selected categories | |
| Preserve existing — fix only the reactivity bug | ✓ |

### Q4: Persistence

| Option | Selected |
|--------|----------|
| Preserve during session only (current) | ✓ |
| Persist to sessionStorage | |
| Persist to localStorage | |

---

## Scope Fold — Candidate-Questions TestId-Timeout (QUESTION-04)

### Q1: Scope handling

| Option | Selected |
|--------|----------|
| Fold into Phase 61 as additional requirement | ✓ |
| Spin a new decimal Phase 61.1 after | |
| Defer to a later milestone / Phase 63 | |
| Investigate root cause during Phase 61, decide after | |

### Q2: Reactivity-class estimation

| Option | Selected |
|--------|----------|
| Expected-same-class — plan as sibling to voter $derived fix | ✓ |
| Same phase but separate wave/plan after diagnosis | |
| Treat as testId-visibility issue, not reactivity | |

### Q3: Requirement ID convention

| Option | Selected |
|--------|----------|
| Add `QUESTION-04` to REQUIREMENTS.md | ✓ |
| New cluster `CAND-QUESTION-01` | |
| Generic `REACTIVITY-01` | |

---

## Claude's Discretion

- Plan split within Phase 61 (1 plan per REQ-ID vs grouped). Planner picks.
- Diagnostic depth for QUESTION-03's intermittent-failure investigation.
- Whether QUESTION-04 splits into diagnosis + fix plans.
- Exact test-ID identifiers for boolean Yes/No pseudo-choices.

## Deferred Ideas

- Admin-configurable category defaults
- Cross-session category persistence (localStorage)
- Dedicated boolean UI (big buttons / toggle / slider)
- Agree/Disagree framing
- Dedicated subdimension for boolean
- New `REACTIVITY` REQ-ID cluster
- Test-ID-visibility as alternative hypothesis for QUESTION-04
