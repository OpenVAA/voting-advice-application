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
| `candidate-journey.spec.ts:924` | `toHaveText(/edit/i)` | `candidateApp.questions.editAnswer` |
| `candidateProfilePage.fixture.ts:179` | `expect.soft(...).toContainText(/required/i)` | `common.required` |

> **Citations corrected 2026-08-27 (`147-05`, from `147-SCOUT-INVENTORY.md` § D).** Both line numbers
> in this table had drifted (921 → **924**, 174 → **179**) and the key was written with an extra
> wildcard segment between `questions` and `editAnswer`; there is none — it is the only `editAnswer`
> key in the union. The second matcher is additionally `expect.soft`, so even a genuine miss there
> would not fail fast: recorded here because this table is one of the three places the stale
> citations lived.

REAL-04's headline ("the raw-i18n-key class is closed systemically") is therefore true for voter
surfaces and **overstated by one word** for the app as a whole — the verifier's finding, recorded
rather than quietly left.

> **⚠ And the overstatement is about SURFACE REACH, not key coverage** (`147-SCOUT-INVENTORY.md`
> § B, recomputed from disk 2026-08-27). The 598 was never voter-only: `loadCatalogKeys()` flattens
> every `*.json` in each source directory, which already includes the 17 `candidateApp.*.json` and
> 10 `adminApp.*.json` files, and the union decomposes as `candidateApp` **161** + `adminApp`
> **121** + voter/shared **316** = **598**. The paragraph above is right that the class was open on
> the candidate app; a later restatement that made it a *key-coverage* gap was not.

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

---

## RESOLVED — 2026-08-27, Phase 147 (`147-03` shipped the extension, `147-04` proved it, `147-05` closes this record)

**What was actually delivered — the class, on the candidate surfaces, by the route-family extension
this todo asked for.**

- `tests/tests/specs/a11y/candidate-a11y.spec.ts` (`147-03`) scans the **seven** candidate
  `(protected)` surfaces in **both themes** — **14 scans** — over the shared scan core in
  `tests/tests/utils/axeScan.ts`, authenticated via the `candidate-a11y-scan` project's stored
  candidate session. Same `WCAG_TAGS`, same `assertAxeGates`, same raw-key gate as the voter half:
  identical by construction, not "kept in sync". Register row `REACH-14` — 14/14 green, each with
  its own `reach-proof-*.json`, at phase 3 of 80 exactly as `147-ORDERING.md` predicted.
- **The scan is live, not vacuous** (`AX1-NEW`): the identical `image-alt` defect that left the full
  suite at **135 passed / 0 failed** in `147-01` now fails **all 14** candidate scans, each naming
  `"id": "image-alt"` and a resolved offending selector.
- **The raw-key half is proven by injection at both named keys** (`RK1-NEW` / `RK2-NEW`): deleting
  `candidateApp.questions.editAnswer`, then `common.required`, from the runtime catalogue makes the
  candidate scan FAIL **naming the key** — on `cand-questions` and `cand-profile`, both themes.
- **The suite is green with those scans blocking**: 150 passed / 0 failed / 0 skipped / 0 flaky /
  0 did-not-run, **four consecutive full-suite runs** on one HEAD, each from a reset database
  (`E2E1-SUITE` + `DET-RUNS`).
- **REAL-04's overstatement is retired** in `.planning/milestones/v2.14-REQUIREMENTS.md` as the
  **wording** correction it is — see the CORRECTION block under REAL-04 there.

**⚠ What was NOT delivered, stated because a todo closed with a claim it did not deliver is worse
than one left open:**

1. **Neither named matcher was patched. Both remain BLIND at phase close, by design.**
   `candidate-journey.spec.ts:924` is still `toHaveText(/edit/i)`; `candidateProfilePage.fixture.ts:179`
   is still `expect.soft(...).toContainText(/required/i)`. ROADMAP Phase 147 criterion 3 says in terms
   that *"patching those two matchers in place does **not** satisfy this: the route-family extension is
   the fix."* This todo's own § *Why site patches are the wrong fix* says the same. So the sites were
   deliberately left as found — and the evidence for that being right is `RK1-NEW`/`RK2-NEW`, where
   **one** Playwright invocation over one broken catalogue produced **two opposite verdicts**: the scan
   named the key while the matcher passed on the very same node. The soft assertion at `:179` is
   additionally filed as its own todo.
2. **Seventeen further candidate states and routes remain unscanned** — six reachable-but-not-scanned
   *states* of the already-scanned routes, and eleven candidate routes outside the `(protected)`
   family. Each is filed as its own `2026-08-27-147-*` todo with its lever. They are **unknowns, not
   zeros.**
3. **The zero's standing limits are unchanged** except for contention: one operating system, one
   identity on one dataset, one viewport. See `147-NEGATIVE-CONTROL.md` § *Residue*.

**Pointer:** `.planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/` —
`147-NEGATIVE-CONTROL.md` (13 rows, 0 unfilled cells) is the evidence; `147-05-SUMMARY.md` is the
close.
