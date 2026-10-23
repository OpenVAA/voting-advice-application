---
phase: arabic-translations
plan: 07
subsystem: i18n
tags: [arabic, msa, translations, backend-sync, rtl, qa-gate]

# Dependency graph
requires:
  - phase: arabic-translations
    provides: "Plans 01-06: all 46 frontend ar/*.json files translated to MSA Arabic; D-06 check script; GLOSSARY.md"
provides:
  - "Backend ar/dynamic.json synced to MSA Arabic via yarn sync:translations"
  - "Full phase QA gate: 360 unit tests green, D-06 0 failed/125 passed, no English passthrough across 46 files"
  - "Human-approved RTL spot-check checkpoint (deferred due to env blockers — live /ar visual review recorded as non-blocking follow-up)"
  - "D-08 native-speaker MSA linguistic sign-off recorded as deferred, non-blocking follow-up"
affects: [rtl-bidi-support, future-arabic-maintenance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "yarn sync:translations rsync is the canonical method to propagate frontend dynamic.json to backend (never hand-edit the backend file)"
    - "D-06 checkArabicPlaceholders.ts is the permanent placeholder/ICU/HTML/href/brand/newline guardrail across all ar/ files"

key-files:
  created: []
  modified:
    - backend/vaa-strapi/src/util/translations/ar/dynamic.json

key-decisions:
  - "D-07: Phase ships Claude MSA machine translation now; native-speaker linguistic sign-off (D-08) is a non-blocking deferred follow-up"
  - "D-08: Native Arabic MSA linguistic sign-off deferred — does not block feat-rtl-locales merge"
  - "Live /ar RTL in-context visual spot-check deferred due to blocked dev stack (env issue: LocalStack Pro-license + Tailwind hoist conflict); RTL layout/dir wiring belongs to the separate rtl-bidi-support phase"

patterns-established:
  - "Backend sync pattern: yarn sync:translations (rsync) propagates frontend ar/dynamic.json downstream; byte-identity assertion proves sync is clean"
  - "Phase QA gate order: sync → unit suite (parity) → D-06 check → no-passthrough assertion → human verify"

requirements-completed: [D-03, D-06, D-07, D-08]

# Metrics
duration: continuation (Tasks 1-2 completed in prior session; Task 3 human-approved)
completed: 2026-06-15
---

# Phase arabic-translations Plan 07: Backend Sync + QA Gate + RTL Checkpoint Summary

**46 frontend ar/ files + backend ar/dynamic.json now contain Claude MSA Arabic; D-06 0 failed, 360 unit tests green, no English passthrough, backend loads via appCustomization.ts — phase ships machine translation with native sign-off deferred (D-08)**

## Performance

- **Duration:** continuation session (Tasks 1-2 in prior agent session; Task 3 checkpoint human-approved)
- **Started:** prior session
- **Completed:** 2026-06-15
- **Tasks:** 3 of 3
- **Files modified:** 1 (backend/vaa-strapi/src/util/translations/ar/dynamic.json)

## Accomplishments

- Backend `ar/dynamic.json` synced via `yarn sync:translations` — byte-identical to frontend source, no longer English passthrough, valid JSON, loads via `appCustomization.ts getDynamicTranslations()` without error
- Full frontend unit suite: 360 passed (including 237 key-parity tests) — all 46 ar/ files confirmed structurally correct
- D-06 placeholder/ICU/HTML/href/brand/newline check: 0 failed / 125 passed across all 46 translated files
- No English passthrough: all 46 ar/*.json files confirmed to differ from their en/ siblings
- RTL spot-check checkpoint human-approved; deferred follow-ups (live /ar visual review, D-08 native sign-off) explicitly recorded as non-blocking

## Task Commits

Each task was committed atomically:

1. **Task 1: Sync frontend dynamic.json to backend and verify it loads** — `bf5b62636` (feat)
2. **Task 2: Run full phase QA gate (parity + D-06 + no-passthrough)** — no separate commit (verification-only task; no files modified)
3. **Task 3: Spot RTL in-context rendering review + record deferred native-review follow-up** — human-approved checkpoint; no source files modified

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `backend/vaa-strapi/src/util/translations/ar/dynamic.json` — MSA Arabic dynamic content synced from frontend via yarn sync:translations (commit bf5b62636)

## Decisions Made

- **D-07 confirmed:** Phase ships Claude MSA machine translation now. Native-speaker MSA linguistic sign-off is deferred (D-08) and does not block the feat-rtl-locales merge.
- **D-08 recorded:** Native Arabic MSA linguistic correctness review is a tracked non-blocking follow-up. A native Arabic speaker should review the translated copy before public-facing production launch.
- **Live /ar RTL visual spot-check deferred:** The dev stack is currently blocked by known env issues (LocalStack Pro-license exit 55 + monorepo Tailwind v3/v4 hoist conflict in Docker). The live in-context rendering review is recorded as a non-blocking follow-up. Note: RTL layout/dir wiring (the `dir="rtl"` HTML attribute, logical CSS properties, text alignment) belongs to the separate `rtl-bidi-support` phase — this plan's scope is translation content only.

## Deferred Follow-Ups

These items are explicitly NON-BLOCKING for the feat-rtl-locales merge. They are tracked here for future action.

### (1) Live /ar RTL In-Context Visual Spot-Check

- **What:** Eyeball key voter screens (results, question list, entity card/details) and a candidate screen (login/register/home) at `http://localhost:5173/ar` with the dev stack running. Confirm Arabic copy is visible (not English), renders under RTL, and Latin tokens (URLs, OpenVAA, Bank ID, example codes) are not reordered/corrupted around surrounding Arabic.
- **Why deferred:** Dev stack currently blocked by LocalStack Pro-license (exit 55) and monorepo Tailwind v3/v4 hoist conflict in Docker — see project memory `project_e2e_env_blockers_2026_06.md`.
- **Who:** Developer with a working local dev stack.
- **Blocks:** Does not block feat-rtl-locales merge. Should be completed before public launch of Arabic locale.

### (2) Native Arabic MSA Linguistic Sign-Off (D-08)

- **What:** A native Arabic speaker reviews the full translated corpus (46 frontend ar/ files + backend ar/dynamic.json) for linguistic correctness, natural MSA register, and terminology accuracy against the GLOSSARY.md established in Plan 01.
- **Why deferred:** Per D-07, the phase ships Claude machine translation now; D-08 is a tracked deferral. The GLOSSARY.md (established Plan 01) provides reference terminology for the reviewer.
- **Who:** Native Arabic MSA speaker with VAA/civic-tech domain context.
- **Blocks:** Does not block feat-rtl-locales merge. Required before public production launch for any Arabic-speaking market.

## Deviations from Plan

None — plan executed exactly as written. Task 3 was a checkpoint:human-verify which the user approved, explicitly choosing to defer the live /ar spot-check and D-08 sign-off as non-blocking follow-ups per D-07.

## Issues Encountered

None during plan execution. The deferred live RTL spot-check reflects a known environment blocker (documented in project memory) that predates this plan and is not caused by it.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The arabic-translations phase is complete. All 46 frontend ar/ files and the backend ar/dynamic.json contain MSA Arabic. The translation pipeline (Plans 01-07) is done.
- The separate `rtl-bidi-support` phase handles RTL layout wiring (`dir="rtl"`, logical CSS, font configuration). That phase can proceed independently.
- Before public Arabic-locale launch: resolve env blockers and run the live /ar spot-check; complete D-08 native linguistic review.

---
*Phase: arabic-translations*
*Completed: 2026-06-15*

## Self-Check: PASSED

- `bf5b62636` exists in git log: CONFIRMED (verified via `git log --oneline | grep arabic-translations`)
- `backend/vaa-strapi/src/util/translations/ar/dynamic.json` — modified by commit bf5b62636 (Task 1)
- `.planning/phases/arabic-translations/07-SUMMARY.md` — this file (written now)
- No unrelated working-tree files touched (docker-compose.dev.yml, +layout.svelte, etc. left untouched)
