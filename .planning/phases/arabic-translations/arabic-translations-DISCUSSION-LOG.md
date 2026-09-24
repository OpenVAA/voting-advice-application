# Phase arabic-translations: Arabic Translation Content - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** arabic-translations-Arabic Translation Content
**Areas discussed:** Translation method, Coverage scope, Token/placeholder safety, Review & merge gate, Brand names, Glossary

---

## Translation method

| Option | Description | Selected |
|--------|-------------|----------|
| Human translator | External/native human produces the Arabic | |
| LLM / machine (Claude) | Claude produces the Arabic directly | ✓ |
| Hybrid (LLM draft + human review) | Claude drafts, human reviews before merge | |

**User's choice:** "You translate" — Claude produces the translations.
**Notes:** MSA register is locked by PHASE.md. Linguistic review is postponed (see Review & merge gate).

---

## Coverage scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 46 files now | Full frontend + backend coverage in one phase | ✓ |
| Tier by app | Voter-facing (~21) first, candidate (16), admin (9) staged | |
| Defer admin strings | Skip `adminApp.*` since admin RTL layout is deferred | |

**User's choice:** "Coverage for all files."
**Notes:** Includes `adminApp.*` strings even though admin RTL *layout* stays deferred — strings ≠ layout.

---

## Token/placeholder safety

| Option | Description | Selected |
|--------|-------------|----------|
| Permanent placeholder-parity test | New vitest test in the suite, runs in CI forever | |
| One-time pre-merge check script | Run-once verification script before merge | ✓ |
| Manual review only | Rely on human eyeballing | |

**User's choice:** "One-time pre-merge check."
**Notes:** Existing key-parity test (key names only) stays green as the permanent guardrail; the new script covers placeholder/ICU/HTML/LTR-token integrity, which that test does not.

---

## Review & merge gate

| Option | Description | Selected |
|--------|-------------|----------|
| Native-speaker review required | Block merge on Arabic linguistic sign-off | |
| Machine output + "needs review" caveat | Ship now, review later | ✓ |
| Maintainer spot-check + RTL rendering | Non-linguistic spot review only | (partial — see notes) |

**User's choice:** "Review will be postponed."
**Notes:** Definition of done = Arabic present (not passthrough), key-parity green, placeholder check passes, RTL spot rendering OK. Native linguistic sign-off is a tracked deferred follow-up, not a merge blocker.

---

## Brand names

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Latin, bidi-isolated | All names stay Latin script | |
| Transliterate to Arabic | Render names phonetically in Arabic | |
| Translate descriptively | Translate descriptive names, keep true proper nouns Latin | ✓ |

**User's choice:** Option 3 — "keep only OpenVAA in Latin or other proper names. Election Compass is just descriptive, not a name per se."
**Notes:** True proper nouns (OpenVAA) → Latin, bidi-isolated. Descriptive names (Election Compass) → translate to Arabic.

---

## Glossary

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, glossary first | Lock a term→Arabic glossary as plan unit #1, translate against it | ✓ |
| No, translate inline | Keep terms consistent by judgment as we go | |

**User's choice:** "Yes, glossary first."
**Notes:** Guarantees one fixed Arabic rendering per VAA domain term across all 46 files; gives the postponed reviewer a stable vocabulary.

---

## Claude's Discretion

- Exact glossary term selection and MSA phrasing.
- Arabic ICU plural categories (`zero/one/two/few/many/other`) — may expand plural forms inside values without breaking key parity.
- Whether the pre-merge check script is committed as a dev utility or kept throwaway (default: commit under tooling, do not wire into CI).

## Deferred Ideas

- Native-speaker Arabic linguistic correctness review — postponed follow-up.
- Locale-aware `Intl` digit/number formatting (Arabic-Indic numerals) — RTL DECISIONS A8 deferral.
- Admin app RTL *layout* — still deferred (only admin strings translated here).
- Promoting the one-time placeholder check into permanent CI — possible later.
- LLM Arabic prompt support; Faker `ar` mock data — RTL DECISIONS deferrals.
