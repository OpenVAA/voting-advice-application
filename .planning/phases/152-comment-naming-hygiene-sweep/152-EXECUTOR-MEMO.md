# Phase 152 — binding carry-forward for plans 07 through 15

Written by the orchestrator during the overnight run of 2026-08-28/29, from what plans 01-06
measured. **Read this before your plan's own text.** Every item here was paid for by an
earlier plan; none of it is speculation.

---

## 1. Check your file set against the REGISTER, not your frontmatter (WINDOWS 79)

`152-06`'s frontmatter listed **4 paths**. The register's `152-06` partition holds **36 files**.
Sixteen files sat in the gap — `helpers/`, `setup/`, `support/`, `scripts/`,
`eslint.config.mjs`, `global-setup.ts` — carrying 64 gate occurrences. **No plan owned them**:
152-07 takes specs only, 152-13 titles, 152-14 line breaks, 152-15 the guard. 152-06 swept them
under its Task 2 criterion, which permits anything inside the register's list.

**Do the same check.** Diff your frontmatter against your partition in `152-05`'s committed
register. If files sit in the gap, they are probably ownerless — sweep them and say so.

## 2. Your gate invocation does not exist and will exit 2 (WINDOWS 81)

Plans 07-12 all carry `hygiene-grep-report.sh -- <pathspec>`. **The script rejects any `-*`
token and hardcodes `-- apps/ packages/ tests/` at every call site deliberately** — its own
comment says `SCOPE IS LOAD-BEARING`. It exits 2.

**Do not modify the script to accept a pathspec.** 152-06 proved the property instead by
transcribing the same nine patterns under a caller-supplied pathspec. Do that.

## 3. The balance line proves COMPLETENESS, not CORRECTNESS (WINDOWS 78)

152-05's codemod printed `OK`, passed five fixtures, and matched the baseline byte for byte —
and its apply still corrupted `z.record(z.string(), z.unknown())` into
`z.record(z.string, z.unknown)` **inside a docblock**, from a deletion on a different part of
the line. The instrument is now fixed (repair-local `MARK` sentinel anchoring every enclosure
and punctuation rule) but the lesson stands: **read the actual diff.** 152-05 hand-fixed 62
sites; 152-06 hand-fixed more. Expect to.

## 4. Unsatisfiable criteria are REPORTED, never engineered around (WINDOWS 72, 73, 80)

Three plans have now hit acceptance criteria that cannot be satisfied because the surviving
occurrences are **program bytes** — a `throw` message, an operator-facing `echo`, shell
variables and strings — which the zero-allow-entry prover forbids you to touch.

The house rule, set by 152-04 and followed by 152-06:
- Do **not** edit program bytes to make a grep go green.
- Do **not** quietly restate the criterion as met.
- Prove the underlying property by another **named** route (a comment-scoped pass over the
  shared classifier), **flip-test it** — a gate that examines nothing also reports green, so
  show it going red — and register the criterion as unsatisfiable in `.planning/WINDOWS.md`.

## 5. Count BEFORE you write the commit message (WINDOWS 77, 84)

This has now gone wrong twice. 152-05 wrote "40 HAND-FIXES" against a real 62. 152-06 put wrong
counts in **three** messages (45 rules/72 sites written as "45 sites"; 18 files/50 sites written
as 19/38; 16 files/65 sites written as 45).

Neither rebased, and both were right not to: this is the shared `integration/ship-12-squash`
branch and interactive rebase is unavailable in this environment. **So the message is
permanent — get the number right the first time.** Run the count, read it, then write the
message. If a message is already wrong, register it rather than rewriting history.

## 6. Correct a false claim; do not merely strip its citation (WINDOWS 82)

`bank-auth-journey`'s docblocks asserted the project *"stands ALONE, NOT threaded into the perm
serial chain"*. The config declares `dependencies: ['voter-prefs-tracking']` — the perm chain's
last leaf. Deleting only the planning citation would have left the falsehood standing more
baldly than before. 152-06 corrected the statement.

**If stripping a citation would leave a false sentence, fix the sentence.**

## 7. Do not delete a numeral that carries meaning

Playwright's own `phase 2` / `phase 3` / `phase 55` vocabulary names Playwright's **scheduling**
phases, not this project's planning phases. 152-06 reworded rather than stripped: deleting the
numerals to satisfy the regex would have turned three true statements false.

## 8. Standing items

- **Do NOT `requirements.mark-complete` any `REVIEW-HYG-*` id.** Sibling plans declare the same
  ids without SUMMARYs; the shared-ID gate correctly holds them Pending. `ready-ids` has
  returned 0/1 and 0/2 repeatedly. 152-01 force-marked one in error and had to revert.
- **`152-CONTEXT.md` `<open>` item 1 is STALE** — `REVIEW-HYG-01..04` ARE defined at
  `.planning/REQUIREMENTS.md:88-91`, traceability `:260-263`, phase map `:332`.
- **Leave `apps/frontend/src/routes/(voters)/+layout.svelte:75` alone** — deliberate
  `unmet-truth`; **152-11 deletes that whole block**.
- `hygiene-codemod.mjs` is **importable**; all instruments share ONE classifier. Do not add a copy.
- **Trust your own measurement over an inherited number.** 152-02 (16 not 14), 152-04
  (28 not 27), 152-05 (641 not 671) and 152-06 (36 files not 4) were all right to.
- **Size on 641** spans across 282 files — the post-152-05 judgement surface. The seven-way
  partition sums exactly: `130+44+208+13+132+105+9 = 641`, zero files unassigned or
  double-assigned.

## 9. E2E disposition

**The cardinal gate was discharged by `152-05`**: 150 passed (10.3m), exit 0, zero failed /
flaky / did-not-run, clean DB, one fresh dev server. Wave-4 plans are comment-only, and
`assert-comment-only-diff.mjs` with **zero allow entries** is a stronger guarantee for a
comment-only diff than a suite re-run. Follow your plan's own `<verification>`.

**If the prover reports ANY non-comment byte change, that reasoning is void.** Never add an
allow entry — the fix is the classifier. If a non-comment change genuinely lands, you own the
full suite: `run_in_background: true`, tee to a per-run log, poll every ~60-90 s (a foreground
~11 min run trips the 600 s watchdog and kills you), `yarn db:reset` first, ONE fresh dev
server on :5173. Check stale servers with BOTH `lsof -nP -iTCP:5173 -sTCP:LISTEN` and
`docker ps | grep 5173`. `pkill -f 'vite dev'` does NOT match — use `pkill -f 'vite.js dev'`.

---

## 10. The gate is NOT your completeness test (WINDOWS 85-87) — added after 152-07

**22 of 152-07's 80 sites were planning references that no gate row matches.** A plan that
trusts the gate alone as its completeness test **leaves roughly a quarter of the work behind.**

The forms that slip through every gated row:

- hyphenated `Phase-145` (the gate matches `phase 145`, not the hyphen form)
- bare `plan 05`, and `plan-130-01`
- deferred-item ids like `DEF-135-04`
- parenthesised bare numbers — `(122)`, `(129)`
- document names used as references — `RESEARCH`, `SUMMARY`, `120-07-SUMMARY`
- `criterion N`
- `this phase` narrative

152-07 registered a ready-to-run grep for these. **Run it over your partition before you
declare completeness**, and report both numbers: what the gate says, and what the wider sweep
found. They will differ.

## 11. The register's per-plan file list is a FLOOR, not a ceiling — refines item 1

152-06 found its frontmatter narrower than its partition. 152-07 found the opposite shape: its
frontmatter matched the partition exactly, but the register's **work queue is span-derived**
while ownership is a **prefix rule**. Three in-partition files carried citations that no gate
pattern matches and so never entered the queue — `candidate-a11y.spec.ts` (`criterion 1/6`),
`perm-org-matching.spec.ts` (`See SUMMARY deviation`), `voter-dark-mode.spec.ts`
(`RESEARCH Pitfall 1`).

**Own your whole prefix, not just the queued spans.**

## 12. DO NOT DECIDE the E2E coverage-id question — it is the operator's (152-13 especially)

152-07 surfaced this and correctly recorded it rather than guessing. It is **deferred to the
operator** and must NOT be settled by an executor overnight.

23 residual Playwright test-title ids — `EFLOW-11`, `EPERM-07`, `TMPL-03`, and so on — look
like planning ids to the `task-id` gate row, but they are **E2E coverage ids that appear in the
run registers**. The two options are in genuine tension:

- **Strip them** (satisfying the gate) → breaks the register cross-reference that E2E run
  evidence depends on.
- **Keep them** → the `task-id` row stays permanently red repo-wide.

**Required behaviour for `152-13` and anyone else who meets them:** sweep everything else in
your scope, **leave the 23 coverage ids in place**, report the `task-id` row as
**deferred-to-operator** (not as met, and not as an ordinary unsatisfiable-by-construction
row), and register it. Do not strip a coverage id overnight; a broken run-register
cross-reference is not recoverable by re-reading the diff.

---

## 10-REVISED. The gate misses up to 64% of the work — not a quarter (WINDOWS 88-91)

**Item 10 understated this badly.** 152-07 measured the gate-vs-reality gap at ~27%
(22 of 80). 152-08 measured it over `packages/dev-seed/{src,tests}`:

| | Comment lines |
|---|---:|
| Matched by the **nine gate rows** | **246** |
| Matched by the **wider sweep** | **678** |
| **Invisible to the gate** | **432 — 64%** |

Trusting the gate alone would have declared that partition clean **with 432 live violations
standing.**

**Four reference classes had to be added to the scanner mid-plan — classes that even 152-07's
registered grep misses.** Add them to yours before you start:

1. **planning-artifact filenames** — `refactor-doc:66-107`, `TIR4:86-90`
2. **two-letter requirement prefixes** — `NF-01` … `NF-05`
3. **letter-suffixed ids** — `GEN-06a`, and `D-03a`, whose letter suffix defeats the gate's own
   `decision-id-bare` pattern by removing the trailing word boundary
4. **plan-internal structure** — `Task 1`, `Option B`

Report BOTH numbers. If your two numbers are equal, you have almost certainly not run the
wider sweep correctly.

## 11-CONFIRMED. Whole-prefix ownership — third confirmation

152-08: all **81** register-queue files appeared in its diff, **plus 24 in-partition files the
span-derived queue never listed** — the whole `tests/latent/` suite, seven `tests/generators/`
specs, `tests/utils.ts`, three `src/emitters/latent/*` modules. 105 files total, zero
out-of-partition. Own your whole prefix.

## 13. DO NOT DECIDE the Markdown question — it is the operator's (WINDOWS 90)

Second fenced decision, alongside item 12. 152-08 surfaced it and correctly refused to settle it.

`packages/dev-seed/README.md` sits inside 152-08's prefix, but **the shared classifier maps
`md` to an empty comment family, so `assert-comment-only-diff.mjs` treats every byte of a
Markdown file as code.** The register routes Markdown "whole to the judgement pass" — but **no
plan in the phase claims it.**

It is entangled with item 12: the README's four `TMPL-`/`GEN-` ids are cross-references to the
very test titles 152-13 is still deferring. Stripping them would pre-empt that decision from
the wrong end.

**Required behaviour:** do NOT sweep Markdown prose. Leave `.md` files byte-identical, report
any `.md` occurrences in your partition as **unowned / deferred-to-operator**, and register
them. The open question for the operator is: *does the phase sweep Markdown prose at all, under
which plan, and against which prover — given the current prover cannot see Markdown comments?*

## 14. Repair breakage from 152-05 may sit in YOUR partition

152-08 repaired **15 sentences** that 152-05's codemod broke mid-strip before its fix landed —
`the three-pass sequence per).`, `* / NF-02:`, `acceptable per:`, `* - — latent`, `shell (`.
These are pre-existing damage in your files, not damage you caused. **Read for them and repair
them**; do not assume the tree you inherited is clean prose.

## 15. Source identifiers carrying planning references stay put

152-08 left four in place — `PHASE_56_TYPE_ROTATION`, `DENIED_AT_TASK_1`, the `negctl144-`
fixture namespace, and one test label. **Renaming any of them is a non-comment change the
zero-allow-entry prover forbids.** Register them; do not rename them.

---

## 16. Your prover criterion is UNSATISFIABLE as written — bound the range (WINDOWS 98)

**This affects every plan 07-12 identically.** Task 3's criterion says run
`assert-comment-only-diff.mjs --range <plan-start>..HEAD`. With your metadata/docs commit as
`HEAD`, that range **always reports violations** — one per `.planning/` file in the range —
because the classifier maps `md` to an empty comment family and therefore reads every byte of
a Markdown file as code (the same root cause as memo item 13).

152-09 measured both:

| Range | Result |
|---|---|
| `..ea5bf6685` (through the docs commit) | 15 compared / **4 violations** |
| `..7390fd983` (bounded at the last REFACTOR commit) | 11 compared / **0 violations** / exit 0 |

**Required behaviour: bound the prover range at your last refactor commit, not at HEAD, and say
in your SUMMARY that you did and why.** 152-08 read it this way too but did not say so, which is
how a reader ends up unable to reproduce the number.

**Do NOT add an allow entry for a `.planning/` path.** That converts a scoping artefact into a
standing exception, and the zero-allow-entry rule is what makes the proof mean anything.

## 17. Widening the scanner has a FLOOR — some references name no artifact (WINDOWS 92-97)

Items 10 and 10-REVISED tell you to widen the scanner. **That is necessary but not sufficient.**
152-09 found **five real reference-bearing lines that no id-shaped pattern can ever reach**,
because they name no artifact at all:

- `F15-C`
- the `T1` / `T2` / `T3` proof-obligation labels
- *"the two red targets"*
- *"added with the product fix"*

They were found **by reading**, not by any grep.

**The scaling rule 152-09 states explicitly:** a 13-span partition can and should be read end to
end. **152-10's 132 spans cannot be** — so a large partition needs the widened scanner **and** a
deliberate read of its long spans, and its SUMMARY should say which sites came from which route.

**And note the trap in agreement:** 152-09's nine gate rows returned 13, matching the register
exactly. That exact agreement is precisely what made a 46%-unswept partition look finished.
Agreement between the gate and the register is not evidence of completeness.

## 18. Reword a numeral that names something real; strip only true citations

Third confirmation of item 7. 152-09 reworded `condenser.ts`'s `PHASE 1..4` to `STAGE 1..4`
rather than stripping them — they name a method's four internal stages, not planning phases.
It chose `STAGE` over `STEP` because `step`/`stepIndex` already names something else in the
same method. That is the standard: understand what the numeral denotes before touching it.

Also left alone, correctly: `generateBoth.yaml:30,36`'s `## Task 1:` / `## Task 2:` sit inside a
`promptText: |` block scalar — **LLM prompt content, not comments**. The classifier maps `yaml`
to the `#` family with no block-scalar state, so it would have mis-swept them. Registered; the
classifier was NOT modified.

---

## 19. Measure per REWRITE SITE, not per line (152-10)

152-10 reported its completeness split per **rewrite site** (216 total), and said why: a
multi-line rewrite has **one anchor and many collateral lines**, so a per-line count inflates
everything unevenly. Its own numbers, both ways:

| Route | Per site | (per line would have said) |
|---|---:|---:|
| Nine gate rows | 136 | 165 |
| Widened sweep only | 45 | 82 |
| Neither — found by reading | 35 | 308 |

**Report per site, and say which unit you used.** Two plans reporting different units cannot be
compared, and the phase's closing arithmetic depends on comparing them.

**Fifth measurement of the gate blind spot: 37%.** The series so far is ~27% (152-07), 64%
(152-08), 54% (152-09), 37% (152-10). It is never zero. Assume yours is not either.

**A near-miss worth knowing:** `EntityListControls.svelte:58` reads `post Phase` / `97/98`
**across a line break** — no phase-shaped pattern reaches a reference split over two lines.

## 20. Proving "comment-only" when a citation sits in a trailing comment (152-10)

152-10's declaration-line grep returned 2, not 0, because a citation sat in a **trailing comment
on a `let`**. It did not edit the declaration and did not restate the criterion as met. It
proved the property by a **comment-stripped `+`/`-` comparison** — symmetric means comment-only
— and flip-tested it against a real declaration widening, which came out asymmetric.

Reuse that route if a trailing comment puts you in the same position.

---

## 21. Deleting a block obliges a grep for POINTERS INTO it (152-11, Rule-1 deviation)

152-11 deleted the 17-line `(voters)/+layout.svelte` block — and `candidate/+layout.svelte:50`
still pointed at `(voters)/+layout.svelte:100-119`, **lines the deletion had just removed**.
A dangling line-range pointer is worse than the citation it replaced, because it looks precise.

**Before you finish a deletion, grep for references to the deleted file AND to its line ranges.**

## 22. Flip-test hazard — `git checkout --` is NOT a safe undo (WINDOWS 113)

152-11's flip test used `git checkout -- <file>` to revert an injected token and **destroyed an
uncommitted sweep edit** in the same file. It was caught only because the gate still read red
afterwards.

**Flip-test on a scratch copy, or commit your sweep before injecting.** Never use
`git checkout --` to undo an injection in a file you have uncommitted work in.

## 23. Three more scanner classes (152-11)

On top of 152-08's four and 152-09's ten:
- **two-letter ids** — `CR-01`, `VT-03`
- **digit-infixed alpha runs** — `NAVA11Y-01`
- **single-letter threat ids** — `T-62-04`

Blind-spot series is now **27 / 64 / 54 / 37 / 30 %** across five partitions. Never zero.
152-11 also **confirmed the split-across-a-line-break class** (memo 19): `introduced by Phase` /
`88`, second sighting.

## 12+13 UPDATE — the fenced questions are now ENTANGLED AND LOAD-BEARING (WINDOWS 109, 110)

152-11 is the first plan where **memo item 13 fires POSITIVE**: real Markdown occurrences in
`apps/frontend/static/fonts/README.md`, plus nine residual gate occurrences all sitting in that
one file. Every `.md` byte was still left identical, correctly.

**And the two questions have collided.** That same file carries a memo-12 instance whose
`VGATE-04/05` ids **are cited by the blocking `e2e-visual` CI job**. So stripping those ids does
not merely break a documentation cross-reference — **it breaks a CI job that gates merges.**

This raises the cost of getting D6/D7 wrong from "a reader is confused" to "a required check
fails". **Neither question may be settled by an executor. Report and register; do not touch.**

---

## 24. Final scanner class, and the highest blind spot in the phase (152-12)

**Dated walkthrough marker ids** — `260524-l1t D7`, `260523-u53`: the ids of `.planning/quick/`
sessions. Regex `\b\d{6}-[a-z0-9]{2,6}\b`. They were **six of 152-12's fifteen sites and
invisible to all nine gate rows, because they open with digits.**

**152-12's blind spot was 67% — the highest in the phase.** Final series across all seven
partitions: **27 / 64 / 54 / 37 / 30 / 67 %**.

And **152-09's agreement trap sprang exactly as predicted**: 152-12's gate returned 13
occurrences over the **same six files the register lists** — perfect agreement between gate and
register, with two thirds of the real work outside both.

## 25. Protecting a comment can mean editing NOTHING (152-12)

152-12's "genuine exception" — the ASVS V7 disclosure control at
`identity-callback/index.ts:249-251` — **carried no planning citation at all.** Protecting it
meant recognising that the correct edit was *none*, while resisting a file-wide pass that had
just rewritten four other comments in that same file.

It recorded before-and-after verbatim anyway, and made the exemption legible in the commit body,
the SUMMARY, and two permanent acceptance greps. **Do that: an exemption nobody can see is
indistinguishable from an oversight.**

---

## 26. The queue can contain ONLY work you must not do (152-13)

152-13's plan named 81 residue-register rows as its authoritative queue. **Every one of the 81
was a fenced coverage id.** The queue contained only work it must not do, and all 46 sites it
*should* sweep lay outside it. Blind spot **72% — the highest in the phase** (final series
27/64/54/37/30/67/**72**).

**A queue that comes back entirely fenced is not a finished plan. It is a mis-scoped queue.**

## 27. Tell classes apart by EVIDENCE, never by shape (152-13)

152-13 did not pattern-match to separate coverage ids from planning references. It built a
corpus of the **1,400 textual files under `tests/e2e-runs/`** — the run registers store test
titles verbatim — and substring-matched every extracted title against it.

Result: **all 19 Playwright coverage-id titles are cited in 12-61 register files each; all 62
vitest ones in zero.**

**The proof that shape was never the test:** `D-07` vs `EPERM-07` — identical shape, opposite
classes. And the 11 register hits for `D-07` turned out to be the *candidate-journey* title, a
**different `D-07` entirely**. A shape-based rule would have got both wrong.

## 28. The allow-list rule is scoped to COMMENT-ONLY plans

Items 16 and 20 forbid allow entries. That rule governs **comment sweeps**, where an allow entry
would hide a real code change. 152-13 is a deliberate **title-rename** plan — its edits are
program bytes by design — so it correctly ran the prover with **24 files allowed by name, 0
violations**, and **flip-tested with zero allows to show 24 violations**, proving the allows are
load-bearing and honest rather than a blanket.

**Still absolute: never an allow entry for a `.planning/` path.** 152-13 added none.

## 13 UPDATE — a THIRD Markdown site, and a hard constraint on any ruling (WINDOWS 122)

Beyond `dev-seed/README.md` (152-08) and `fonts/README.md` (152-11), 152-13 registered
`tests/README.md` and `tests/IDURA-TEST-RUNBOOK.md`.

**Constraint that binds whatever the operator rules:** three of the five `§` markers in
`fonts/README.md` are **OFL 1.1 licence sections**. They are not planning references and
**must survive any Markdown disposition.** A sweep that treats `§` as a citation marker would
strip licence text.
