# Operator ruling — the three open questions on the hygiene class

> **Ruled 2026-08-29 by the operator.** All three took the recommended option.
> This file is the INPUT to `153-11`, which does the resulting work. Phase 152 is closed and
> verified (`152-VERIFICATION.md`, `status: passed`) and is **not** reopened.

Phase 152 closed honestly with three questions fenced rather than answered, because each *could*
have been settled by an executor and each would have been settled wrongly. This records the answers.

---

## D6 — E2E coverage ids in test titles → **KEEP THEM. Narrow the gate.**

**Ruling: option (a).** The 70 occurrences across 38 test titles — `EFLOW-`, `EPERM-`, `EQTYP-`,
`UNBLK-`, `TMPL-`, `GEN-` (incl. `GEN-06a..g`), `CLI-`, `ASSERT-`, `RUNES-`, `CLEAN-`, `NF-`, `CR-`,
`WR-04`, `IN-01`, `VGATE-04/05` — **stay byte-identical**. They are legitimate E2E coverage
vocabulary, not planning debt. **The `task-id` gate row's pattern is over-broad; the tree is right.**

`hygiene-grep-report.sh`'s `task-id` row is narrowed to exclude the coverage-id namespace.

**Why, on the evidence 152-13 gathered by measurement rather than by shape:** all 19 Playwright
titles among them are quoted **verbatim** in `tests/e2e-runs/**` run registers — 12 to 61 citing
files each — while all 62 vitest ones appear in zero. `D-07` vs `EPERM-07` settles that shape was
never a usable test: identical shape, opposite classes, and `D-07`'s eleven register hits are a
*different* `D-07` entirely.

**What stripping them would have cost:** `VGATE-04/05` gate the **blocking `e2e-visual` CI job**;
`NF-01` appears in a CI **step name** at `main.yaml:239` and `TMPL-07` in a step comment at `:237`;
`TMPL-03`/`GEN-04`/`NF-02` are cited from `packages/dev-seed/README.md` and `CR-01` from
`tests/README.md` + `tests/IDURA-TEST-RUNBOOK.md`. A strip fails a required merge check and orphans
run-register evidence that is not recoverable by re-reading a diff.

**This row was always different in kind from the phase's other red rows.** Those *cannot* be
satisfied without editing program bytes the zero-allow-entry prover forbids. This one **could** have
been satisfied and must not be.

---

## D7 — Markdown prose → **OUT OF SCOPE, permanently. Scope the gate to exclude `.md`.**

**Ruling: option (a).** The class this phase enforces is **code comments**. Markdown prose is not in
it. The four registered sites keep their occurrences:

- `packages/dev-seed/README.md`
- `apps/frontend/static/fonts/README.md`
- `tests/README.md` (`:137`, `:186`, `:188`)
- `tests/IDURA-TEST-RUNBOOK.md` (`:420`, `:430`, plus task-ids at `:192`, `:405`)

**The decisive reason is a capability gap, not a preference.** The shared classifier maps `md` to an
**empty comment family**, so `assert-comment-only-diff.mjs` reads every byte of a Markdown file as
code. The zero-allow-entry behaviour-neutrality proof — the property that makes all fifteen of this
phase's sweep commits trustworthy — **does not function on Markdown at all.** Sweeping `.md` would
mean landing edits under a proof that structurally cannot verify them, which is worse than not
sweeping them.

**A constraint this ruling honours automatically:** three of the five `§` markers in
`fonts/README.md` are **OFL 1.1 licence sections** (sections 2 and 5). They are legal citations, not
planning references. Any sweep treating `§` as a citation marker would strip licence text.

**Consequence for D6:** because Markdown stays out of scope, the READMEs that cite coverage ids are
never edited — which is consistent, since D6 keeps those ids anyway. Ruling D6 "strip" would have
forced D7's hand; ruling both (a) leaves them coherent.

**If Markdown is ever brought into the class, it needs a Markdown-aware prover first.** That is a
phase, not a plan, and this ruling does not authorise it.

---

## D7b — the `.css` / `.scss` family → **SWEEP FIRST-PARTY ONLY, THEN ADD.**

**Ruling: option (a).** In order, in one plan:

1. **Sweep `app.css`'s 14 rule-2 violations** — the only first-party file of the four.
2. **Codify the two third-party files as named constants** in the guard — **not** an ignore-file,
   not a flag, per the phase's standing no-opt-out principle: excusing a case must require editing
   the guard so it is reviewed as the decision it is.
3. **Then add `css` and `scss` to `FAMILY_BY_EXT`**, in one commit, with the guard green on arrival.

**The two exclusions and why they are exclusions rather than sweep targets:**
- `inter.css` — a **verbatim OFL-licensed `@fontsource/inter@5.3.0` distribution header** (3 violations)
- `prism-vs.css` — an **upstream author credit** (2 violations)

Editing vendored licence and attribution text to satisfy a line-break rule is not a trade this
project makes.

**Order is load-bearing.** Adding the family before the sweep would enable a rule against 19
pre-existing violations — exactly the **D-N1(c)** shape this milestone rejected: such a guard cannot
go live until the sweep runs, so it would have to ship disabled, and a disabled guard is no guard.

`.html` was already added by 152-15 on the same measurement (4 files, 0 violations, 1,560 → 1,564).

---

## What these rulings unblock

`REVIEW-HYG-01` and `REVIEW-HYG-02` were deliberately left **Pending** by 152-15 — correctly, since
both were unmet as literally worded (19 forced line breaks surviving in `apps/**/*.css`; the
reference gate carrying 117 attributed survivors). 152-15 declined to mark them because doing so
would have converted a fenced operator question into a silent claim.

**All three rulings are prerequisites for marking them.** After `153-11`:

- the `.css` violations are swept (D7b), so the line-break half is true;
- the `task-id` row is narrowed (D6) and `.md` is scoped out (D7), so the reference gate's survivors
  are no longer counted against the class.

`153-11` must re-measure and mark **only what is genuinely ready** — `ready-ids` first, nothing
force-marked. Note the standing tooling condition: `milestone.cjs` matches `/^(pending|gaps found)$/i`
against the **trimmed whole cell**, so a Status cell carrying a trailing annotation will reject the
write. That is a separate open decision (D8) and is not resolved here.

## A note on the WINDOWS `status` vocabulary

Entries 120, 122 and 129 move from `open` to **`ruled`** — a value this file introduces. It means
*the question is answered; the work is not yet done*. They become `fixed` when `153-11` lands, and
not before. Marking them `fixed` now would be the same category error as marking a requirement
complete because it had been discussed.
