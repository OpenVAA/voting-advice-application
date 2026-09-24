---
phase: arabic-translations
plan: '01'
subsystem: i18n-tooling
tags: [glossary, placeholder-check, i18n, arabic, msa, d02, d05, d06, tdd]
dependency_graph:
  requires: []
  provides:
    - GLOSSARY.md locked MSA glossary for all downstream translation tasks
    - D-06 placeholder-safety check script executable before merge
  affects:
    - All 46 frontend ar/ JSON files (use glossary)
    - backend dynamic.json (use glossary)
    - Pre-merge check gate (run D-06 before merging translation PRs)
tech_stack:
  added: []
  patterns:
    - flattenKeys [key,value] pattern (reused from editTranslations.ts)
    - --test-file flag pattern for synthetic test injection into standalone tools
key_files:
  created:
    - .planning/phases/arabic-translations/GLOSSARY.md
    - frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts
    - frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts
  modified: []
decisions:
  - D-02 glossary locked — one MSA rendering per VAA term, all downstream plans must use it
  - D-05 brand rule enforced — OpenVAA/Bank ID stay Latin; Election Compass translates to البوصلة الانتخابية
  - D-06 script committed under frontend/tools/ but NOT in vitest or CI (run manually pre-merge)
  - TDD test helper renamed to .verify.ts (not .test.ts) to avoid vitest auto-discovery (deviation Rule 1)
metrics:
  duration: '~25 minutes'
  completed: '2026-06-15'
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
---

# Phase arabic-translations Plan 01: Wave 0 Foundations — Glossary and D-06 Check Script

**One-liner:** Locked MSA glossary (D-02/D-05) and six-check placeholder-safety script (D-06) gate all 46-file translation tasks.

## Tasks Completed

| Task    | Name                                                     | Commit      | Files                                                                      |
| ------- | -------------------------------------------------------- | ----------- | -------------------------------------------------------------------------- |
| 1       | Build and lock the MSA glossary (D-02, D-05)             | `2825aa26e` | `.planning/phases/arabic-translations/GLOSSARY.md`                         |
| 2 RED   | Add failing TDD tests for D-06 script                    | `b922fbac7` | `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts` |
| 2 GREEN | Implement D-06 placeholder-safety check script           | `ad068b5b2` | `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`        |
| 2 FIX   | Rename .test.ts to .verify.ts — prevent vitest discovery | `bf43a6eed` | rename only                                                                |

## What Was Built

### GLOSSARY.md

A locked MSA glossary at `.planning/phases/arabic-translations/GLOSSARY.md` covering:

- **Core VAA domain terms** (30+ entries): candidate singular/plural, party/organization, constituency, election, opinion, alliance, faction, question, results, answer yes/no, match score, Election Compass
- **UI action and state terms**: loading, saving, continue, back, close, cancel, clear, return, expand/collapse, skip to main
- **Authentication and account terms**: login/sign-in, logout, register, password, email, first name, surname
- **Content and info terms**: filters, feedback, privacy, statistics, nomination, portrait, website
- **Status/job-state terms** (adminApp.jobs Open Question 1 resolution): Pending/Confirmed/Locked plus running, failed, completed, cancelled, queued — formal MSA technical vocabulary
- **Brand/proper-noun rule (D-05)**: OpenVAA and Bank ID stay Latin verbatim; Election Compass → البوصلة الانتخابية; ICU tokens pass through verbatim; emoji kept in place
- **Arabic CLDR plural categories**: zero/one/two/few/many/other with dual-form note and per-category example

Marked LOCKED at the top — do not revise mid-phase.

### checkArabicPlaceholders.ts

Standalone D-06 check script at `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`:

- Reads all 46 files in `translations/en` and `translations/ar`, flattens to key→value maps using the `[key, value]` pattern from `editTranslations.ts`
- For each shared leaf key, runs six integrity checks:
  1. **ICU token names** — `{identifier}` names extracted with `/\{([a-zA-Z_][a-zA-Z0-9_]*)[,}]/g`, ICU keywords excluded; every en token must appear in ar
  2. **ICU constructs** — plural/select/date/selectordinal must be present in ar if present in en
  3. **HTML tag set** — en tag name set must be a subset of ar's (order may differ)
  4. **href targets** — `href="..."` values must appear verbatim in ar
  5. **Latin brand names** — hardcoded list `["Bank ID", "OpenVAA"]`; each brand present in en must appear literally in ar
  6. **Literal `\n`** — if en value contains a newline character, ar must too
- **Plural-union handling** — token UNION across all plural arms is compared, so `=0/=1/other` in en expanding to `zero/one/two/few/many/other` in ar does NOT fail as long as the token set is preserved
- Exit 0 if all checks pass; exit 1 if any fail
- Output format: `FAIL [key]: reason — en: "..." | ar: "..."` per failure + `Summary: N checks failed, M passed.`
- Baseline result (ar == en): `Summary: 0 checks failed, 127 passed.`
- Supports `--test-file` flag for injecting synthetic test cases (used by verify script)
- 326 lines, NOT wired into vitest or CI

### checkArabicPlaceholders.verify.ts

TDD verification script (17 assertions) covering all eight behavioral requirements. Runs via `tsx` directly. Named `.verify.ts` (not `.test.ts`) so vitest does not auto-discover it.

## Verification

```
cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts; echo exit=$?
# → Summary: 0 checks failed, 127 passed.
# → exit=0

npx tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts
# → Test Summary: 17 passed, 0 failed

yarn workspace @openvaa/frontend test:unit
# → Test Files  16 passed | 1 skipped (17) — 360 tests all green
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed TDD test helper from .test.ts to .verify.ts**

- **Found during:** Task 2, post-GREEN verification (`yarn workspace @openvaa/frontend test:unit`)
- **Issue:** Vitest auto-discovered `checkArabicPlaceholders.test.ts` by filename pattern and ran it as a vitest suite. The script calls `process.exit(0)` which vitest intercepts and throws `Error: process.exit unexpectedly called with "0"`, causing 1 failed suite.
- **Fix:** Renamed to `checkArabicPlaceholders.verify.ts`. Vitest only discovers `.test.ts` / `.spec.ts` files by default — the renamed file is invisible to vitest but still runnable directly via `tsx`.
- **Files modified:** `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts` (rename)
- **Commit:** `bf43a6eed`
- **D-06 compliance:** This rename keeps the verify script out of vitest/CI as required.

## Known Stubs

None — this plan produces tooling and documentation only. No UI values, no data wiring.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The check script reads existing translation files read-only.

## Self-Check: PASSED

- [x] `.planning/phases/arabic-translations/GLOSSARY.md` exists and is non-empty (14 KB)
- [x] `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` exists (326 lines)
- [x] `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts` exists (236 lines)
- [x] `2825aa26e` commit exists (GLOSSARY)
- [x] `b922fbac7` commit exists (RED test)
- [x] `ad068b5b2` commit exists (GREEN implementation)
- [x] `bf43a6eed` commit exists (rename fix)
- [x] D-06 script exits 0 on baseline (127 checks passed)
- [x] Unit test suite green: 360 passed (translations parity test included)
- [x] Script not in vitest.config.ts or vite.config.ts
