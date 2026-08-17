# Phase 139: Single-Source Sweep Findings — Confirm or Withdraw - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 139-single-source-sweep-findings-confirm-or-withdraw
**Areas discussed:** Evidence bar per verdict, Running the unwired AI packages, F17 scope seam
**Areas offered but not selected:** Where verdicts are recorded (→ Claude's discretion)

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence bar per verdict | Read-only vs. break-and-run for every confirmable finding | ✓ |
| Where verdicts are recorded | New 139-VERDICTS.md vs. in-place audit annotation vs. both | |
| Running the unwired AI packages | question-info / argument-condensation have no `test:unit` script | ✓ |
| F17 scope seam | In ASSERT-07 but absent from Phase 139 criterion 1 | ✓ |

---

## Evidence bar per verdict

| Option | Description | Selected |
|--------|-------------|----------|
| Break-and-run every finding | All 13 sites get an injected regression + observed pass/fail; produces Phase 142's negative-control corpus as a byproduct | ✓ |
| Break-and-run the blind ones only | Run F15/F16/F18/F19/F20-planValidation; read-only for the six "weaker than title" rows | |
| Criterion-2 minimum: one runner | One finding proven by running, twelve by re-read — exactly what the ROADMAP demands | |

**User's choice:** Break-and-run every finding (all 13 sites).
**Notes:** Chosen over the ROADMAP's stated minimum. The run corpus doubles as Phase 142's
pre-specified negative controls, satisfying criterion 3 by construction rather than by prose.

---

## Evidence bar — the blind-but-red class

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm as-written, note the mitigation | The assertion is structurally incapable of failing; the incidental TypeError is diagnosis-cost, not coverage | ✓ |
| Withdraw per the literal criterion | Strict reading of criterion 2 ("fails correctly when broken → withdrawn") | |
| New third verdict: "confirmed — low severity" | A tier between confirmed and withdrawn, carrying the mitigation | |

**User's choice:** Confirm as-written, note the mitigation.
**Notes:** F19 is the type case — `expect(null).toBeDefined()` passes, but the following line
throws. Withdrawing it would have shrunk ASSERT-03/Phase 140 as well as ASSERT-07/Phase 142.
The proposed third verdict tier was rejected: the vocabulary stays exactly confirmed/withdrawn.

---

## Running the unwired AI packages

| Option | Description | Selected |
|--------|-------------|----------|
| Ad hoc in-package vitest, no wiring changes | `cd packages/argument-condensation && npx vitest run <file>`; exact command recorded in the evidence | ✓ |
| Add the `test:unit` scripts now | Wire both packages into turbo as part of 139 | |
| Skip running them; read-only verdicts for those three | Reach criterion 2 via a frontend or dev-seed finding instead | |

**User's choice:** Ad hoc in-package vitest, no wiring changes.
**Notes:** Verified during scout — `question-info` and `argument-condensation` expose only
`test` / `test:watch`, so `turbo run test:unit` skips them silently. Wiring is Phase 141's
requirement set (UNIT-01..04); doing it here would pre-empt that phase and risk surfacing
unrelated package failures mid-verdict-pass.

---

## F17 scope seam

| Option | Description | Selected |
|--------|-------------|----------|
| Give it a verdict too, flagged as out-of-criterion | Cheap to check; Phase 142 needs a pre-specified regression for it regardless | ✓ |
| Leave it — already confirmed by direct read | The auditor read F17 directly, so it is not single-source | |
| Note the seam only, no verdict | Record the deliberate exclusion so Phase 142 does not read it as a withdrawal | |

**User's choice:** Give it a verdict too, flagged as out-of-criterion-1.
**Notes:** F17 is in ASSERT-07's scope but absent from Phase 139's criterion 1. Closing the seam
here costs one file and stops Phase 142 misreading the omission.

---

## Injection mechanics (follow-up to the break-and-run choice)

| Option | Description | Selected |
|--------|-------------|----------|
| Inject → run → `git checkout --` → verify clean | Per-finding hard revert, then assert `git status --porcelain` clean before the next | ✓ |
| One scratch branch, revert at the end | Fewer revert steps, but an interruption leaves 13 live regressions | |
| Patch files under the scratchpad | Repo stays pristine, but the evidence is about a copy, not the shipped file | |

**User's choice:** Inject → run → `git checkout --` → verify clean.

| Option | Description | Selected |
|--------|-------------|----------|
| Verbatim diff per finding in the evidence doc | Exact `-`/`+` lines plus observed PASS/FAIL; Phase 142 re-applies mechanically | ✓ |
| Prose description of the regression | Lighter doc, but reintroduces the invention criterion 3 prevents | |
| Diffs as `.patch` files in the phase dir | Most mechanically reusable; adds 13 files to the phase directory | |

**User's choice:** Verbatim diff per finding in the evidence doc.

---

## Claude's Discretion

- **Verdict record location** — offered as a gray area, not selected. Default carried into
  CONTEXT.md: a phase-local `139-VERDICTS.md` plus mandatory in-place edits to the audit for any
  withdrawal (criterion 4 forces the audit edit regardless).
- Ordering of the 13 injections; whether to batch by package to amortise vitest startup.

## Deferred Ideas

- Wiring `question-info` + `argument-condensation` into `test:unit` → Phase 141 (UNIT-01..04).
- All repairs → Phase 140 (ASSERT-02/03/05/06) and Phase 142 (ASSERT-07).
- `getIdTokenClaims` missing negative tests (bad signature / wrong issuer / wrong audience) — a
  coverage gap, not a fake guard; belongs in a future coverage phase.
- Test-runbook concurrency doc drift (Phase 138 F-2) — already filed in STATE.md deferred items.
