---
created: 2026-08-12
source: Phase 136 D-136-04-1; queued for next milestone at v2.14 close
resolves_phase: 147
severity: medium
area: E2E / a11y / i18n
---

# The candidate app is unreached by both the axe scan and the raw-i18n-key scanner

## The gap

`assertNoRawI18nKeys` is wired into `assertAxeScan`, so it runs on exactly the surfaces the
`AXE_ROUTES` table declares: **7 voter routes × 2 themes**. On those it covers every catalog key —
all 598, current and future (union derivation verified by recomputation at Phase 136 verification:
runtime 598 / type-gen 591 / `TranslationKey` 598 → union 598, floor 400).

It does **not** reach the candidate app. Two F2 sites remain blind, both confirmed still blind at
Phase 136 verification:

| Site | Matcher | Would be satisfied by the raw key |
|---|---|---|
| `candidate-journey.spec.ts:921` | `toHaveText(/edit/i)` | `candidateApp.questions.*.editAnswer` |
| `candidateProfilePage.fixture.ts:174` | `toContainText(/required/i)` | `common.required` |

REAL-04's headline ("the raw-i18n-key class is closed systemically") is therefore true for voter
surfaces and **overstated by one word** for the app as a whole — the verifier's finding, recorded
rather than quietly left.

## Why site patches are the wrong fix

Patching those two matchers closes two instances and leaves the class open on every candidate-app
surface, including future ones. The real fix is to **extend the axe route table (or an equivalent
authenticated scan family) to the candidate app**, which brings the raw-key gate along for free and
closes an a11y coverage gap at the same time — the candidate app has never been axe-scanned.

## Why it wasn't done in Phase 136

Phase-sized work with its own prerequisites: an authenticated scan fixture (the candidate routes are
behind `(protected)`), a dataset decision, and unbounded a11y fallout on surfaces that have never
been measured — the same shape as Phase 135's GUARD-02, which newly scanned four surfaces and had to
own whatever it found. Recorded rather than smuggled into a test-guard plan.

## Related

- `136-VERIFICATION.md` — REAL-04 PASS-WITH-CONCERNS, both sites re-confirmed blind
- `.planning/audits/2026-08-11-fake-guard-sweep.md` — F2
- Phase 135 GUARD-02 — precedent for "our own gate found it, so it is ours to fix"
