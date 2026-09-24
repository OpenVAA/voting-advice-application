# Phase 142 — Discussion Log

**Date:** 2026-08-20
**Mode:** Consolidated checkbox document (`142-DISCUSSION-POINTS.md`), per the standing
preference — one all-items doc with `→` defaults and ⚠ DECIDE markers, filled in one pass,
never interactive per-area Q&A.
**Outcome:** `142-CONTEXT.md` (D-00 … D-19)

---

## Shape

35 items across 10 sections, each carrying a recommended default (`→`), with **5** marked
**⚠ DECIDE** as shape-changing rather than implementation detail: **B1, B2, C1, D1, F2**.

Grounding was read at HEAD `7bd87085b` before the doc was written: ROADMAP Phase 142 detail
(469-483), `REQUIREMENTS.md:60`, `139-VERDICTS.md` (§ 4 verdict table, § 4.3, § 5.N.2 / § 5.N.6
per finding, § 7 limits, § 8 discarded injections), `.planning/audits/2026-08-11-fake-guard-sweep.md`,
and `141-CONTEXT.md` D-01.

Two live greps were re-run at HEAD during authoring and both fed ⚠ items:

- `grep -rnE 'question\.type|QUESTION_TYPE|choices' packages/question-info/src/` → **exit 1, no
  output**. The shipped code ignores question type entirely (→ B1).
- `apps/frontend/src/routes/api/oidc/authorize/+server.ts` → `return error(400, …)` at `:22` sits
  inside a `try` whose `catch` at `:50` replaces it with a 500 at `:52` (→ B2).

---

## Fill outcome

**31 of 35 confirmed in writing** by the operator (`[x]` on the default). Four returned unchecked
and were resolved 2026-08-20:

| Item | ⚠ | Resolution |
|---|---|---|
| **A1** — adjacent same-class sites | — | Proceeded on default per the doc's confirm-or-ignore rule; operator confirmed. → **D-05** |
| **A2** — missing tests out of scope | — | Same. → **D-05**, deferred idea 2 |
| **F2** — does full E2E gate the phase? | ⚠ | Default was *conditional* ("Yes, if B1 or B2 is accepted"). Both were accepted, so it resolves affirmatively — **confirmed explicitly by the operator** rather than inferred. → **D-16** |
| **I1** — free-form | — | Returned with no notes. Nothing to fold. |

Two items carried a written **NOTE** offering an override (E3's "if you'd rather not pin an exact
string"; G1's "one plan per finding" for finer commit granularity). Both were confirmed at their
defaults, so neither override applies.

---

## The five ⚠ DECIDE outcomes

### B1 — `question-info` ignores question type. Fix the product here? → **yes, minimally**

The largest scope question in the phase: it converts 142 from test-only to **test+product**.
Options were (a) fix it here, (b) write the assertions and leave them red with the fix in its own
phase, (c) `test.fails()`/skip-with-reason. (b) and (c) both leave `yarn test:unit` red, which
violates ROADMAP criterion 5's exit-0 — so (a) is the only option that closes the phase.
"Minimally" was pinned in the decision text: question type + choice labels reach the prompt
variables at `infoGeneration.ts`; no feature redesign. → **D-01**

### B2 — the authorize endpoint swallows its own 400. Fix here? → **yes**

One-line class (`throw error(400, …)` or hoist the guard out of the `try`), plus a check for the
same `return error(...)`-inside-`try` shape in the sibling `token/` and `callback/` endpoints.
Smallest possible product change, and the tightened assertion at `authorize-endpoint.test.ts:233`
is worthless without it. → **D-02**

### C1 — F17: mount the component, or rename to the contract? → **rename**

Criterion 3 offers both branches. (a) mounting needs the full appContext + locale + i18n harness
and touches Spike-024 `#version`-bridge territory — a component-test-harness project, not an
assertion redesign. The file's own `:9` doc comment already records the deliberate non-mounting.
(b) taken; C2 pinned its four-part scope so "renamed" cannot be read loosely. → **D-04**

### D1 — re-run the OLD negative-control half, or cite 139's recorded green? → **cite, with an exception**

A 12-run vs 24-run difference — roughly one week vs two. 139's greens are committed,
environment-stamped, and logged, so citation is sound **except** where the target file changed for
a reason other than the assertion under test: a product change underneath invalidates the citation
for that finding specifically. B1 makes F15-A such a case and B2 makes F20-1 one, so both re-run
both halves. → **D-06**

### F2 — does the full E2E suite gate this phase? → **yes**

Contingent on B1/B2, both accepted. B2's endpoint is on the Phase-122 bank-auth E2E path, so a
unit-only gate would leave the product change unexercised by the specs that actually hit it. One
full `yarn test:e2e` on a fresh dev server + clean DB, under the cardinal rule. → **D-16**

---

## Notable non-⚠ outcomes

- **0.1** — corpus fixed at **12**, not 15; F19a/b/c belong to ASSERT-03 / Phase 140 (closed). The
  12 are enumerated in CONTEXT so no planner re-derives them. → **D-00**
- **A4** — the `processingTimeMs > 0` removal extends to a grep of the two AI packages for the same
  wall-clock-on-a-mock shape, and **no further**. → **D-12**
- **A3** — withdrawal permitted only on a ground 139 could not have seen; expected count **0**. → **D-13**
- **D2/D3/D4/D5** — 139's HYGIENE-LOOP verbatim (including logs outside the repo and the per-finding
  post-gate), the two-column and collateral rules, a `142-NEGATIVE-CONTROL-LEDGER.md` whose 12 rows
  exist in full before the first injection, and the four qualified injection records plus the ten
  prohibited designs carried into plan text verbatim. → **D-07 … D-10**
- **E1–E9** — per-finding matcher strength settled: exact prefix for F16 (plus non-empty `entities`,
  without which the test exercises five lines and nothing else); boundary-not-packet for F18 with
  `LOCALE_BLOCK_SIZE` read from the constant; exact raw template for F20-2; exact column equality
  for F20-4; exact derived count for F20-5; a discriminating error field for F20-3 (adding one is in
  scope if absent); exact message for F20-6; argument **content** not non-emptiness for F15-B/C; and
  deletion — not `toBeGreaterThanOrEqual(0)` — for the wall-clock line. → **D-11**
- **G1/G2/G3** — six plans partitioned per package/area, **sequential** (the HYGIENE-LOOP pre-gate
  asserts a clean tree, which any concurrent injection violates; and one agent's `git checkout --`
  reverts another's live injection), with `autonomous: false` checkpoints on the B1 and B2 plans per
  the Phase 138 D-06 fix-tier precedent. → **D-17**

---

## Todos created

Per H3, captured via `/gsd-capture` rather than left in prose:

1. Six unenumerated F19-class `!`-on-`null` sites in the two auth test files (A1).
2. `getIdTokenClaims` missing negative tests — bad signature / wrong `issuer` / wrong `audience` (A2).
3. Anything B1 defers out of the minimal `question-info` product fix.

## Scope guardrail

Out: F19a/b/c and the six adjacent F19-class sites; missing tests; any info-generation or OIDC
change beyond what D-01/D-02 name; mounting `EntityListWithControls`; Phase 143 `svelte/store` work
even in the same files.
