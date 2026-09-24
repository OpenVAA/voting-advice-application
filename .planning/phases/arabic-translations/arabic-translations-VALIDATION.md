---
phase: arabic-translations
slug: arabic-translations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase arabic-translations — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `arabic-translations-RESEARCH.md` → `## Validation Architecture`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend workspace) + `tsx` for the one-time D-06 check script |
| **Config file** | `frontend/vitest.config.ts` (existing); D-06 script standalone (not in CI) |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit -- translations` |
| **Full suite command** | `yarn workspace @openvaa/frontend test:unit` |
| **Estimated runtime** | ~30–60 seconds (unit); D-06 script ~seconds |

---

## Sampling Rate

- **After every task commit:** Run the key-parity test (`test:unit -- translations`)
- **After every plan wave:** Run the D-06 placeholder/structure check (`tsx frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts`)
- **Before `/gsd-verify-work`:** Full unit suite green + D-06 check passes + backend `dynamic.json` loads
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task | Wave | Decision | Test Type | Automated Command | Status |
|------|------|----------|-----------|-------------------|--------|
| Glossary lock | 0 | D-02 | manual/review | glossary file present, terms fixed | ⬜ pending |
| D-06 check script | 0 | D-06 | unit-ish | `tsx .../checkArabicPlaceholders.ts` exits 0 on en==en | ⬜ pending |
| Per-file translation | 1..N | D-01/D-03/D-04/D-05 | automated | parity test green + D-06 passes for the file | ⬜ pending |
| Backend sync | final | D-03 | automated | `yarn sync:translations`; `dynamic.json` loads via `appCustomization.ts` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Glossary file — locked MSA renderings for recurring VAA domain terms (D-02)
- [ ] `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts` — D-06 placeholder/ICU/HTML/URL diff check (reuses `flattenKeys` pattern)
- [ ] No new test framework needed — existing vitest parity test (`translations.test.ts`) is the permanent guardrail

*Existing infrastructure (vitest parity test) covers key-parity; D-06 covers value-level token integrity the parity test does not.*

---

## Manual-Only Verifications

| Behavior | Decision | Why Manual | Test Instructions |
|----------|----------|------------|-------------------|
| Spot RTL in-context rendering of translated copy | D-07 DoD | Visual correctness not unit-testable | Load `/ar`, eyeball key voter/candidate screens; verify no reordering corruption around Latin tokens |
| MSA linguistic correctness | D-07/D-08 | Native sign-off postponed (deferred) | Tracked follow-up, NOT a blocker for this phase |

*Key-parity + D-06 token integrity + backend load are automated; linguistic quality is the deferred manual gate.*

---

## Validation Sign-Off

- [ ] Key-parity test stays green for every translated file
- [ ] D-06 check passes (no dropped/renamed placeholder, ICU construct, HTML tag, or URL/href)
- [ ] Backend `dynamic.json` loads via `appCustomization.ts` after `yarn sync:translations`
- [ ] No watch-mode flags in any committed command
- [ ] `nyquist_compliant: true` set in frontmatter once the map above is complete

**Approval:** pending
