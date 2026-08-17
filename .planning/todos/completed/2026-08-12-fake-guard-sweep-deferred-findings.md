---
created: 2026-08-12
source: Phase 136 plan 06 (verification gate) — deferred remainder of the 2026-08-11 fake-guard sweep
resolves_phase: 139
severity: medium
area: tests / assertion quality
---

# Fake-guard sweep — the ten findings Phase 136 did NOT remediate

`.planning/audits/2026-08-11-fake-guard-sweep.md` carries **20 findings**. Phase 136 was scoped by the
roadmap to eight of them — F1, F2, F4, F5, F6, F7, F12, F14 — which are now closed under REAL-01..04.
Three more (F8, F10, F11) the audit itself classes as benign or documentation-only.

The following remain **open and unremediated**. They are recorded here rather than left implicit in a
green phase summary, because the entire point of the sweep was that an unremediated blind assertion
looks exactly like a passing one.

## The deferred set

| ID | Where | Why it is a non-guard | Audit class |
|----|-------|-----------------------|-------------|
| **F3** | 27 `*.teardown.ts` files | `expect(rowsDeleted).toBeGreaterThanOrEqual(0)` is **unfailable by construction** — a row count is never negative | Blind (decoration), High |
| **F9** | `perm-hide-category-tags`, `perm-hide-election-tags` | Absence-only assertions with **no positive control anywhere in the suite** — a tag that never renders at all passes both | Partially blind, Medium |
| **F10** | `voter-journey.spec.ts` header | Claims a "3-slot `expect.soft` budget"; the file has **137**. Documentation drift, not a broken assertion | Doc drift, High |
| **F13** | `packages/dev-seed` `TemplateSchema` (`schema.ts:99-132`) | Schema is not `.strict()`, so **6 "accepts field X" tests cannot fail** — an unknown field is accepted whether or not the schema declares it | Blind, High |
| **F15** | `questionTypes.test.ts` (9 sites) + `condenserStandalone.test.ts` | AI-package tests assert **wiring, never output** | Blind, High |
| **F16** | `handleQuestion.test.ts:56` | Bare `rejects.toThrow()` against a mock that **throws from every method** — passes for the wrong reason | Blind, High |
| **F17** | `EntityListWithControls.test.ts:94` | "Bounded `apply()` invocations" measures **the test's own `for` loop**, not reactivity | Blind, High |
| **F18** | `default.test.ts:121-135` | "Faker locale cycling" asserts only that names are **truthy** — no cycling is checked | Blind, High |
| **F19** | 3 sites | `toBeDefined()` on `URLSearchParams.get()` / `FormData.get()`, which return `string \| null` and **never `undefined`** | Blind (mitigated), High |
| **F20** | 6 assorted sites | Assertions weaker than their test titles (400-status, ICU-fallback, JWKS error paths, `toContain('id')`, nomination-tree propagation, bare `rejects.toThrow`) | Partially blind, Medium |

## Confidence caveat carried from the audit

The audit independently re-read F1, F12, F13, F14 and F17 and reports all five as confirmed. **F15,
F16, F18, F19 and the F20 table are SINGLE-SOURCE** — they come from a delegated sweep and are
reported at that subagent's confidence, not independently verified. Any phase that picks these up
should re-read the cited lines before planning around them; one of them may not survive contact.

## Suggested shape of the fix

These do not form one coherent phase. The natural groupings:

1. **F3 + F19** — mechanical and low-risk. Both are "the matcher cannot fail"; both are one-line
   substitutions (`toBe(expectedCount)` / `toBeTruthy()`-with-a-value-check). F3 spans 27 files but
   is the same edit 27 times.
2. **F13** — one-line schema change (`.strict()`), but it will surface whatever those 6 tests were
   actually permitting. Budget for fallout.
3. **F9** — needs a positive control seeded, which is a dataset decision, not a matcher fix.
4. **F15 + F16 + F17 + F18 + F20** — each needs someone to decide what the test SHOULD assert. That
   is design work, not remediation, and it is where the real cost sits.

Follow the phase's own discipline when they are picked up: **prove the guard fails before claiming it
guards** — run the negative control against the realistic failure mode, and run it twice (once against
the old assertion to prove blindness, once against the new one to prove the fix).

## Related

- `.planning/audits/2026-08-11-fake-guard-sweep.md` — the full sweep
- `.planning/REQUIREMENTS.md` — REAL-01..04 (the eight findings that WERE closed)
- `.planning/phases/136-real-guards-visual-repair-sweep-remediation/136-06-SUMMARY.md` — the gate

---

## Resolution — Phase 139 (2026-08-14)

This todo named Phase 139 for its **confidence caveat**, not for remediation. That caveat is now
discharged: `139-VERDICTS.md` carries an independent, run-backed verdict for each of the fifteen
single-source findings (F15-A/B/C, F16, F17, F18, F19a/b/c, F20-1..F20-6) — **15 confirmed, 0
withdrawn**. None of them failed to survive contact with the live code, so no downstream scope
shrank. Propagation was checked against all three criterion-4 targets and recorded as
*inspected; left unchanged* (`139-VERDICTS.md` § 6).

**Remediation of every finding listed above remains open** and is tracked in the ROADMAP, not here:

| Findings | Owner |
|---|---|
| F3, F9, F10, F19 | Phase 140 (ASSERT-02/03/05/06) |
| F13 | The `TemplateSchema` phase (TMPL-01/02, ASSERT-04) |
| F15, F16, F17, F18, F20 | Phase 142 (ASSERT-07) |

Two items surfaced by the verdict pass that the table above does not carry:

- **The F19 blind pattern appears at six further sites** beyond the audit's enumeration
  (`authorize-endpoint.test.ts:157,169,189`, `token-endpoint.test.ts:188,207,229`). Deliberately
  NOT added to ASSERT-07 — criterion 4 is a shrink mechanism, and widening scope onto sites this
  pass never verdicted would push unverified work into Phase 140. Proposed in `139-VERDICTS.md` § 6.4.
- **A live product defect, not in the audit:** the OIDC authorize endpoint does not return 400 for a
  missing `redirectUri` — SvelteKit 2's `error()` throws, so `return error(400, …)` at
  `apps/frontend/src/routes/api/oidc/authorize/+server.ts:22` is swallowed by that function's own
  `catch` and returned as 500. Phase 142 tightening `authorize-endpoint.test.ts:233` to
  `{ status: 400 }` **will red on the clean tree** until the endpoint is fixed. See § 7.
