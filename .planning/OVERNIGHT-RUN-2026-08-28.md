# Overnight autonomous run — started 2026-08-28 (evening)

Operator away until 2026-08-29. Instruction: get as much done as possible, defer anything
needing a ruling to tomorrow, and start on later phases rather than idling on a blocked one.

## Route (respects wave order A -> B -> C -> D from decision O3)

| # | Phase | Plans attempted | Status |
|---|---|---|---|
| 1 | 152 Comment & Naming Hygiene | 15 of 15 | in progress |
| 2 | 154 dev-seed Determinism | 4 of 4 (fully autonomous) | queued |
| 3 | 155 Edge Function Hardening | 6 of 6 (fully autonomous) | queued |
| 4 | 153 Build & Tooling Config | 8 of 9 (153-09 deferred) | queued |
| 5 | 156 Schema Corrections | 10 of 10 (fully autonomous) | queued |
| 6 | 157 Adapter Boundary | up to 157-03, then as far as reachable | stretch |

Execution is SEQUENTIAL — `workflow.use_worktrees=false`, so one executor at a time on the
main tree regardless of wave parallelism. Waves are a dependency order here, not concurrency.

## Cleared before the run

- **152-14 D-A4 scope** — RULED tonight. Option (b), verbatim detection with the five
  structural categories codified. Plus two amendments. See `152-LINEBREAK-RULING.md`.
  Phase 152 is now fully autonomous.
- **153-02 engines enforcement** — pre-answered by operator decision **O5** (D-B5 REVERSED;
  enforce via a preinstall script, because Yarn 4.13.0 has no `.yarnrc.yml` setting that
  makes an engine mismatch an error). Executor will be told this so it does not re-raise.
- **Disk** — 60 GiB free at run start, against the 13 GiB that blocked the planning close.
  `159-01`'s 15 GiB floor is satisfied.

## DEFERRED — needs the operator (2026-08-29)

Nothing here has been decided or worked around. Each is left untouched.

### D1. `153-09` — phase-153 close: the E2E cardinal-rule disposition
The last plan of 153. It assembles the phase ledger and puts two undischargeable criteria
plus the E2E cardinal rule in front of a human. Its own threat model (T-153-40) says quietly
skipping the cardinal rule and quietly declaring it satisfied are both false records. Not a
call to make unattended. **Plans 153-01..08 will have run; only the close is held.**

### D2. `153-04` amendment — so Phase 159 may add a 12th path alias
Standing blocker 2 from the planning close. `153-04` declares collision surface "None", pins
"all 11 measured usages", and gates on `Tests 816 passed (816)` — all falsified by 159's
`$layouts` work. **This does not block executing 153-04 tonight**: at execution time the tree
genuinely has 11 aliases and 816 tests, so the plan is correct as written and no work is
wasted. The amendment governs Phase 159 in wave F, which this run will not reach.

### D3. CI does not run on this branch
Standing blocker 3. `.github/workflows/main.yaml` triggers only on push/PR to `main`; this
branch is 50+ commits ahead. Phase 163's four criteria are unobservable until that changes,
and `163-01` puts a permanent trigger change behind an operator checkpoint. Phase 163 is
7-of-9 non-autonomous and is not attempted in this run.

### D4. Phase 162 is not planned at all
Section K of `v2.15-DISCUSSION-POINTS.md` was left open. The source document marks 162
**blocking ship**, so v2.15 cannot close without it. Needs a ruling before it can be planned.

### D5. Downstream checkpoints not reached tonight, listed so they are not a surprise
- `157-03` migration coordination with 156 · `157-09` candidate-settings `currentPassword`
  · `157-10`, `157-11`
- `158-01`, `158-04`, `158-05`, `158-06` — 158 is blocked at its FIRST plan
- `159-02` `PasswordSetter` `$bindable` collision · `159-04` `Alert:117` · `159-08`, `159-10`
- `160-07` the `spike-findings` deletion
- `161-01`, `161-02` — 161 is blocked at its first two plans · `161-07` two-run E2E proof
- `163-01`..`163-09` — seven of nine

## Run log

(appended as plans land)

### 152-01 — comment-hygiene guard — COMPLETE (~20 min, 5 commits)

`scripts/assert-comment-hygiene.mjs` live as the seventh link of `yarn lint:check`;
1,560 files scanned, 0 violations. Rule 1 is comment-scoped — it finds the one real
violation and leaves the eight non-comment occurrences alone (a naive `git grep` reports 9).
Both flips recorded with both halves (HYG2, HYG-ESC). `lint:check`, dev-seed `test:unit`
and `build` all exit 0.

Four deviations, all documented in the SUMMARY. **One is flagged for the operator rather
than settled:** deviation 4 — the executor resolved the tracer feedback gate autonomously
instead of raising it as a checkpoint, reasoning from `mode: yolo` + `autonomous: true` +
no checkpoint tasks + a fully automated `<verify>`, and honoured the gate's purpose by
re-running the tracer verify end-to-end against committed state before starting Task 2.
It notes that preferring the literal rule is a reasonable disagreement. Given the operator
is away and asked for autonomy, this run treats it as aligned with instruction — but it is
recorded here as a **review item, not a settled question**.

Two corrections the executor surfaced and propagated forward:
- `152-CONTEXT.md` `<open>` item 1 is STALE — `REVIEW-HYG-01..04` ARE defined at
  `.planning/REQUIREMENTS.md:88-91`. The executor had repeated the stale claim before
  checking it, then corrected it.
- `REVIEW-HYG-01` left deliberately **Pending**, not Complete — its text spans the
  forced-line-break class and the escape, and rule 2 does not ship until 152-15. An initial
  `mark-complete` call was an error, reverted; `REQUIREMENTS.md` is byte-identical to
  committed state.

Gap registered in `.planning/WINDOWS.md` for 152-15: the guard scans eleven extension
families, so 6 `.css` and 4 `.html` comment-bearing files are invisible to it. No rule-1
coverage lost (all nine tree escapes are in scanned families), but rule 2's corpus makes
it material.

### 152-02 — instruments + baseline — DISPATCHED
Carries tonight's ruling: builds `unwrap-comment-paragraphs.mjs` for disposition (b) with
the paragraph-break rule codified, fixture-tested and reported as a sixth named exclusion.

### 152-02 — instruments + baseline — COMPLETE (~33 min, 6 commits)

Five instruments built, pre-sweep baseline recorded in `152-BASELINE.md`.

**The retargeting trap was real, and is demonstrated rather than asserted.** Both gates run
against the same tree minutes apart: the unmodified original prints
`spike-ref 40 30 0 bare = 0 OK` — green over 40 live violations, because all 40 spike
references are already in the collapsed `see spike N` form. 642 phase references are invisible
to it the same way. Exactly one row flips under the retargeted copy.

**Tonight's ruling is implemented.** `PARAGRAPH_BREAK` is a named constant beside the five
structural exclusions, cites the ruling, has its own report row (4,201 junctions), and is
proven by a fixture pair differing by one line: 0 violations with the blank comment line,
1 without.

**The ruling's re-raise condition is now settled and will NOT fire.** Live D-A4 figures
(14,171 junctions / 5,576 paragraphs / 742 files) agree with the research figures the ruling
was made on (14,094 / 5,550 / 747) to within 0.7%. Recorded in `152-LINEBREAK-RULING.md` so
`152-14` Task 1 confirms and proceeds rather than returning to the operator. **One fewer
overnight stall.**

**An inherited figure is wrong, and the executor did not bend the instrument to match it.**
The plan's criterion says the UK/US audit finds 14 occurrences; it finds **16**.
`152-RESEARCH.md` § 9.1's own tool output says `8x offences` (= 16) while § 9.2's hand-written
site list gives 6, omitting `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts:99`
and `:101` where `offences` shares a line with `describeOffence`. Verified two ways.
**`152-04` must size the rename against 16 sites, not 14** — registered in
`.planning/WINDOWS.md` and passed explicitly to 152-04's executor.

Two items the operator may want to overrule later, both recorded not hidden:
- `hygiene-codemod.mjs` was made **importable** — a fifth change beyond the plan's four — so
  the three new instruments share one classifier instead of adding three more hand-synchronised
  copies. Proven behaviour-neutral by a byte-identical dry-run summary.
- The phase moved its own baseline: `152-01`'s comment block in `ciTypecheckGate.test.ts`
  added 2 phase references to the swept surface (744/102 -> 746/104).

### 152-03 — three renames (REVIEW-HYG-03) — DISPATCHED

### 152-03 — the three REVIEW-HYG-03 renames — COMPLETE (~18 min, 4 commits)

All three renames landed: `SettingsOverlay.svelte.ts` -> camelCase,
`EntityListWithControls.helpers` -> `helpers`, `quatenaryChoices` -> `quaternaryChoices`.
Every gate green after each one: full `yarn build`, full `yarn lint:check` (so 152-01's
hygiene guard ran each time), the affected workspace's `test:unit`, and one full
`yarn test:unit` across 11 workspaces after the third.

**The case-only rename's green is real, not a replayed cache.** `core.ignorecase` re-measured
`true`; two-step `git mv` via a temp name; git recorded `R097`/`R100`. Then `yarn dev:clean`
+ `TURBO_FORCE=true` typecheck printed `cache bypass, force executing` and `0 cached, 11 total`.
The later `lint:check` typecheck leg DID report `FULL TURBO` on 22/22 cached — recorded in the
SUMMARY so nobody mistakes the replay for the evidence. That distinction is the whole proof.

Three dispositions carried forward:
- **One `must_have` truth deliberately unmet**, registered as `unmet-truth`:
  `apps/frontend/src/routes/(voters)/+layout.svelte:75` still names `SettingsOverlay.svelte.ts`
  in prose, because **152-11 deletes that entire block**. Editing one word inside a
  soon-to-be-deleted block would hand 152-11's executor an unexplained mismatch. Prose only —
  the cache-bypassed typecheck proves no code linkage to the old name survives.
- **The fixture rename was widened** to `singleChoiceCategoricalQuestion.test.ts` (same
  misspelling, 3 occurrences), a file no requirement names. Recorded as a decision so a
  verifier reads it as widening, not drift. `REQUIREMENTS.md`, `ROADMAP.md` and `CONTEXT.md`
  were NOT edited — plan prohibition.
- **`REVIEW-HYG-03` is NOT marked Complete.** `ready-ids` returns 0/1 — 152-04 and 152-15 also
  declare it and have no SUMMARY, so the shared-ID gate holds it Pending. Its three renames
  are nonetheless all landed.

`yarn test:e2e` was correctly NOT run: none of the three renames touches E2E, the plan's
`<verification>` does not name it, and no `tests/**` file was edited. The full suite belongs to
whichever later 152 plan first edits an E2E spec — that plan owns the cardinal rule for 152.

### 152-04 — UK/US symbol audit (REVIEW-HYG-04) — DISPATCHED
Dispatched with the corrected figure: **16 sites, not the plan's 14**, per 152-02's measurement
and the `WINDOWS.md` entry. Also carrying 152-03's handoff item — the out-of-scope
`"multiple dimesions"` typo at `singleChoiceCategoricalQuestion.test.ts:36`, which 152-03
explicitly left for this plan's spelling pass.

### 152-04 — UK/US symbol audit (REVIEW-HYG-04) — COMPLETE (~25 min, 6 commits)

Artefact: `152-SPELLING-AUDIT.md`, committed as findable and re-runnable.

**The corrected figure held.** Re-measured before touching anything: **16 occurrences, not the
plan's 14**, matching 152-02's correction and WINDOWS 69. All 16 renamed; the audit script now
reports `in-scope hits: 0` across 1,521 files, exit 0.

**Two acceptance criteria are unsatisfiable by construction — reported, not engineered around.**
This is the precedent worth keeping:
- Task 1 criterion 2 (`git grep -cwE 'q[s]|showS[M]|sc[s]'` returns 0) can NEVER return 0 —
  `qs` is the npm querystring package, imported by name in 9 frontend files. Proved the real
  property another way (zero old names in `EntityCard.svelte` + function-local scope +
  `svelte-check` 0/0). -> WINDOWS 72.
- Task 2 criterion 2 (zero `offences` in the builtins test) requires a string edit that D-A6 and
  152-13's prohibitions BOTH forbid — the survivor at `:172` is a test title. Proved via the
  audit script, which blanks strings. -> WINDOWS 73.

**152-03's handover item disposed of by fixing it:** `singleChoiceCategoricalQuestion.test.ts:36`
"dimesions" -> "dimensions", own commit. WINDOWS 71 marked fixed. It is a vitest assertion
message (zero behavioural surface) and no later 152 plan claims it — 152-13 renames titles
carrying planning references, not typos.

**One Rule-1 fix beyond the plan:** `uk-identifier-audit.mjs:14`'s docblock still claimed
"14 in-scope". Corrected to 16 in place — an artefact whose stated purpose is "so the next
reader does not repeat it" cannot itself carry the number that caused the repeat.

Gates: `build` 0 · `test:unit` 0 (25/25 tasks; 816 + 570 + 244 + 30 + 22) · `lint:check` 0 ·
`format:check` 0 · frontend typecheck 0/0 · `assert-comment-hygiene.mjs` 0 ·
`git diff --stat HEAD~4 HEAD -- tests/` **empty** (so the E2E cardinal rule still passes forward).

Requirements: `ready-ids` returned **0 of 2**. Neither REVIEW-HYG-04 nor REVIEW-HYG-03 marked
complete — both declared by sibling plans without SUMMARYs. Nothing force-marked.

One measured divergence flagged rather than smoothed: out-of-scope `organisation` count is **28**,
not RESEARCH § 9.3's 27. Also filed WINDOWS 74 for an out-of-scope terse local `qs` in
`packages/dev-seed/tests/latent/loadings.test.ts` — same naming class as the reviewed EntityCard
site but not the reviewed site, so recorded rather than silently assumed closed repo-wide.

### 152-05 — mechanical planning-reference purge — DISPATCHED
Sweeps `packages/**`, `apps/**`, `tests/**`. **This is likely the first 152 plan to edit
`tests/`**, so it was dispatched carrying the full E2E cardinal-rule protocol: background+poll
(never foreground — an ~11 min suite trips the 600 s watchdog), one fresh dev server on :5173,
`db:reset` before the definitive run, stale-server detection via both `lsof` and `docker ps`,
and explicit instruction that if the suite cannot run at all it must be reported as undischarged
rather than waived.

### 152-05 — mechanical planning-reference purge — COMPLETE (~34 min, 5 commits)

**E2E CARDINAL GATE DISCHARGED.** This plan edited 13 files under `tests/`, so it owned the
rule: **150 passed (10.3m), exit 0, zero failed / zero flaky / zero did-not-run**, on a clean
DB against one fresh dev server.

**The finding that justifies the whole instrument-first design.** The plan insisted the balance
line proves completeness and NOT correctness — and that paid on the first pass. The codemod's
arithmetic printed `OK`, its five fixtures were green, its residue table matched
`152-BASELINE.md` byte for byte, and the apply it produced still turned
`z.record(z.string(), z.unknown())` into `z.record(z.string, z.unknown)` **inside a docblock**,
on a line whose actual deletion was elsewhere. Three of `repair()`'s rules were global over the
line, contradicting the function's own docblock promise to stay in the deletion's neighbourhood.

The executor reverted the apply, fixed the instrument (repair-local `MARK` sentinel; every
enclosure and punctuation rule now requires it as an anchor), wrote three hand-reviewed
regression fixtures for defects that had none, and only then re-applied. **WINDOWS 78 — and it
flags that the same defect class may sit in the inherited `sources/hygiene-codemod.mjs` that
Phase 151 ran over the whole repo.** That is a cross-phase concern, not a 152 concern.

Results: behaviour neutrality proven over 41 files, 0 violations, **0 `--allow` entries**.
**62 hand-fixes** inside the apply commit, each listed with `file:line`. Two were worse than
merely ungrammatical — a **quoted git commit subject** was truncated (falsifying a record), and
three **multi-line wrapped `.planning/` paths** were half-deleted by a line-scoped pattern.

**Two numbers that resize the rest of the phase.** Occurrences fell 8.6% (948 -> 866), but the
**judgement surface fell only 4.5%** (671 -> 641 spans across 282 files) — computed exactly, not
re-estimated, because the apply touched 41 files and left the other ~1,519 byte-identical.
Nearly every citation a regex could strip safely shared a span with a deferred phase reference.
**152-06 .. 152-12 are sized on 641.** The seven-way partition is an ordered path-prefix rule,
so `130+44+208+13+132+105+9 = 641` and zero files unassigned or double-assigned are structural,
not checked after the fact. The 152-08/152-09 imbalance (208 vs 13) is stated in the register
rather than hidden.

**Two items for the operator:**
- **WINDOWS 77 — a wrong number in a commit message.** `bfcf2dae5` says "40 HAND-FIXES"; the
  counted figure is **62**. The message was written before the sites were enumerated. History
  was deliberately NOT rewritten: the commit is on the shared `integration/ship-12-squash`
  branch and interactive rebase is unavailable here, so rewriting was the more dangerous option.
  A reviewer reading only that message sees a number 22 too low.
- **WINDOWS 75 — 14 residue rows belong to no plan in Phase 152.** 152-13 owns test titles;
  these are planning references in *other* runtime strings (shell output, assertion messages, a
  thrown `Error`). Each is defensible where it sits, but the phase cannot later claim the class
  is closed over them.

### 152-06 — Playwright config + test utils/fixtures sweep — DISPATCHED
Wave 4 begins (seven partition plans, 152-06 .. 152-12). Dispatched with 152-05's instrument fix
and its "balance line proves completeness, not correctness" lesson made binding, sized on 641.

### 152-06 — Playwright config + E2E utils/fixtures — COMPLETE (~45 min, 7 commits)

Prover over `80e02e753..e2978881d`: 35 files, **0 allow entries, 0 violations**. 0 declaration
lines and 0 config-key lines in the diff. `lint:check`, `typecheck:tests`,
`assert-comment-hygiene.mjs` all exit 0. E2E correctly not re-run, per the plan's own
`<verification>`.

**Three findings that bind every remaining wave-4 plan** — consolidated into
`152-EXECUTOR-MEMO.md` and committed, so 152-07..15 read them instead of re-deriving them:

- **WINDOWS 81 — the plan's gate invocation does not exist.** `hygiene-grep-report.sh -- <pathspec>`
  exits 2: the script rejects any `-*` token and hardcodes `-- apps/ packages/ tests/` at every
  call site *deliberately* (`SCOPE IS LOAD-BEARING`). The executor did NOT modify it; it proved
  the property with the same nine patterns transcribed under a caller-supplied pathspec.
  **152-07..12 carry the identical invocation and will hit the identical exit 2.**
- **WINDOWS 79 — the plan's frontmatter is narrower than its own partition, and the gap had no
  owner.** Frontmatter: 4 paths. Register's 152-06 partition: 36 files. Sixteen files sat
  between them (`helpers/`, `setup/`, `support/`, `scripts/`, `eslint.config.mjs`,
  `global-setup.ts`) carrying 64 gate occurrences — and 152-07 takes specs only, 152-13 titles,
  152-14 line breaks, 152-15 the guard. **Nobody owned them.** Swept under Task 2's own
  criterion. Remaining plans must check the REGISTER, not their frontmatter.
- **WINDOWS 80 — three gate rows unsatisfiable, not engineered around.** All six surviving
  occurrences are *program bytes*: a `throw` message, an operator-facing `echo`, a shell
  variable and three strings. The criterion and the zero-allow-entry prover cannot both be
  satisfied. Proven instead by a comment-scoped route over the shared classifier (36 files,
  5,035 comment lines, 0 on every gated row) and **flip-tested to 6-red / 0-green, because a
  gate that examines nothing also reports green.**

**A false claim corrected rather than preserved (WINDOWS 82).** `bank-auth-journey`'s setup and
teardown docblocks asserted the project *"stands ALONE, NOT threaded into the perm serial
chain"*. The config declares `dependencies: ['voter-prefs-tracking']` — the perm chain's last
leaf. Stripping only the citation would have left the falsehood standing more baldly. The same
stale premise may live in `tests/IDURA-TEST-RUNBOOK.md` Step B-3 (markdown, out of scope).

**Playwright's own `phase N` vocabulary was reworded, not stripped** — `phase 2/3/55` name
Playwright's *scheduling* phases; deleting the numerals to satisfy the regex would have made
three true statements false.

**WINDOWS 84 — wrong counts in three more commit messages.** Measured 45 rules/72 sites (written
"45 sites"), 18 files/50 sites (written 19/38), 16 files/65 sites (written 45). Not rebased —
shared branch, same call 152-05 made. That is now four bad counts across two plans; the memo
makes counting-before-writing an explicit gate.

### 152-07 — E2E specs sweep — DISPATCHED
The heaviest planning-narrative carriers in the repository. Dispatched pointing at the memo, with
the three traps 152-06 hit called out by name.

### 152-07 — E2E spec-tree sweep — COMPLETE (~22 min, 3 commits)

Prover over `61dc6febf~1..fa08c6d07`: **19 files, 0 allowed by name, 0 violations, exit 0**.
Gate over `tests/tests/specs`: phase-ref 51->0, spike-ref 1->0, section-anchor 4->0, all other
gated rows 0. 0 title lines, 0 selector/timeout/template lines, 0 declaration lines in the diff.
`typecheck:tests`, `lint:check`, `assert-comment-hygiene.mjs`, `prettier --check` all green.
**40 long spans, 40 rewrites, 0 deletions at any length.**

**First plan in the phase whose commit-message counts needed no correction** — measured
mechanically before writing. The memo gate works.

**The finding that resizes 152-08..12 (WINDOWS 85-87).** **22 of the 80 sites were planning
references NO gate row matches**: hyphenated `Phase-145`, bare `plan 05`, `plan-130-01`,
`DEF-135-04`, parenthesised `(122)`/`(129)`, the document names `RESEARCH`/`SUMMARY`/
`120-07-SUMMARY`, `criterion N`, and `this phase` narrative. **A plan that trusts the gate alone
as its completeness test leaves roughly a quarter of the work behind.** Registered with a
ready-to-run grep; promoted to memo item 10 and made a required, two-number report for every
remaining plan.

**The register's per-plan file list is a FLOOR, not a ceiling (memo item 11).** 152-06 found its
frontmatter narrower than its partition; 152-07 found the opposite shape — frontmatter matched
the partition exactly, but the register's work queue is *span-derived* while ownership is a
*prefix* rule. Three in-partition files carried citations no gate pattern matches and never
entered the queue (`candidate-a11y.spec.ts`, `perm-org-matching.spec.ts`,
`voter-dark-mode.spec.ts`). Swept.

**Unsatisfiable criterion, reported not engineered around:** the whole `task-id` row. All 24
residual occurrences are program bytes — 23 Playwright test titles this plan is *prohibited*
from renaming (152-13 owns them) and 1 assertion-message string. Proven by a comment-scoped
route over the shared classifier (40 files, 4,089 comment lines, 0 on every gated row),
**flip-tested 8-red / 0-green**.

## DEFERRED — D6. The E2E coverage-id question (added 2026-08-29, from 152-07)

**ESCALATED 2026-08-29 by 152-11: this now breaks a MERGE GATE, not a cross-reference.**

**This is an operator decision and has been fenced off as memo item 12 so no executor settles
it overnight.**

The residual Playwright test-title ids — `EFLOW-11`, `EPERM-07`, `TMPL-03`, `VGATE-04/05`, … —
look like planning ids to the `task-id` gate row, but they are **E2E coverage ids that appear in
the run registers**. The tension is genuine:

- **Strip them** (satisfying the gate) -> breaks the register cross-reference that E2E run
  evidence depends on — **and, per 152-11, `VGATE-04/05` are cited by the BLOCKING `e2e-visual`
  CI job, so stripping them fails a required check.**
- **Keep them** -> the `task-id` row stays permanently red repo-wide.

152-13 has been instructed to sweep everything else, **leave the ids in place**, and report the
row as *deferred-to-operator* — not as met, and not as an ordinary
unsatisfiable-by-construction row. A broken run-register cross-reference is not recoverable by
re-reading the diff, and a broken CI gate is worse.


### 152-08 — dev-seed workspace sweep — DISPATCHED
**The largest partition in the phase: 208 of 641 spans** (next largest 132, smallest 9) —
roughly a third of the entire judgement surface. Dispatched with memo item 10's wider grep made
a required two-number report, since on a 208-span partition the gate-vs-reality gap could be
50+ sites.

### 152-08 — dev-seed workspace sweep — COMPLETE (~1h 40m, 5 commits)

The largest partition in the phase. 105 files swept, 513 sites across two refactor commits.

**THE headline number of the night.** Both completeness figures, over
`packages/dev-seed/{src,tests}` at baseline:

| | Comment lines |
|---|---:|
| Matched by the **nine gate rows** | **246** |
| Matched by the **wider sweep** | **678** |
| **Invisible to the gate** | **432 — 64% of the work** |

152-07 measured this gap at ~27%. Here it is nearly two-thirds. **Trusting the gate alone would
have declared this partition clean with 432 live violations standing.** Memo item 10 has been
revised from "a quarter" to "up to 64%" and the four new reference classes are now required
reading for every remaining plan.

Four reference classes had to be added to the scanner mid-plan — classes even 152-07's
registered grep misses: planning-artifact filenames (`refactor-doc:66-107`, `TIR4:86-90`),
two-letter requirement prefixes (`NF-01`..`NF-05`), **letter-suffixed ids (`GEN-06a`, `D-03a` —
whose letter suffix defeats the gate's OWN `decision-id-bare` pattern by removing the trailing
word boundary)**, and plan-internal structure (`Task 1`, `Option B`).

**Whole-prefix ownership, third confirmation.** All 81 register-queue files appeared in the
diff, plus **24 in-partition files the span-derived queue never listed** — the whole
`tests/latent/` suite, seven `tests/generators/` specs, `tests/utils.ts`, three
`src/emitters/latent/*` modules. 105 total, zero out-of-partition.

Verification: prover **105 compared, 0 allowed by name, 0 violations** · transcribed gate 0 on
every row · comment-scoped gate 0 on every gated row, **flip-tested 9 red / 0 green** ·
dev-seed `test:unit` **49 files / 570 tests identical before and after** ·
`assert-unit-test-coverage.mjs`, `assert-comment-hygiene.mjs`, `lint:check`, prettier all 0.

Also repaired **15 sentences 152-05's codemod broke mid-strip** before its fix landed
(`the three-pass sequence per).`, `* / NF-02:`, `acceptable per:`, `* - — latent`, `shell (`) —
promoted to memo item 14, since that damage may sit in other partitions too. Left four source
identifiers carrying planning references in place (`PHASE_56_TYPE_ROTATION`, `DENIED_AT_TASK_1`,
the `negctl144-` fixture namespace, one test label) — renaming any is a non-comment change the
prover forbids (WINDOWS 91, memo item 15).

Commit-message counts measured from the applier's tables before writing; both correct — second
plan in a row.

Unsatisfiable rows reported not restated (WINDOWS 88): `task-id` 53, `decision-id-bare` 9,
`phase-ref` 5 — all program bytes or Markdown (47 `describe`/`it` titles owned by 152-13, 2
skip-message literals, 9 in `packages/dev-seed/README.md`).

## DEFERRED — D7. Does the phase sweep Markdown prose? (added 2026-08-29, from 152-08)

**Fenced as memo item 13 so no executor settles it overnight.**

`packages/dev-seed/README.md` sits inside 152-08's prefix, but **the shared classifier maps
`md` to an empty comment family, so `assert-comment-only-diff.mjs` treats every byte of a
Markdown file as code** — the phase's behaviour-neutrality prover structurally cannot verify a
Markdown edit. The register routes Markdown "whole to the judgement pass", but **no plan in the
phase claims it.**

It is entangled with D6: the README's four `TMPL-`/`GEN-` ids cross-reference the very test
titles 152-13 is deferring, so stripping them would pre-empt that decision from the wrong end.

**The question:** does the phase sweep Markdown prose at all — under which plan, and against
which prover, given the current one cannot see Markdown comments?

**Four sites now registered**, not one: `packages/dev-seed/README.md` (152-08),
`apps/frontend/static/fonts/README.md` (152-11), and `tests/README.md` +
`tests/IDURA-TEST-RUNBOOK.md` (152-13, WINDOWS 122).

**A hard constraint on whatever you rule:** three of the five `§` markers in `fonts/README.md`
are **OFL 1.1 licence sections**. They are not planning references and must survive any
disposition — a sweep treating `§` as a citation marker would strip licence text.

### 152-09 — core packages sweep — DISPATCHED
Register partition is **13 spans, the smallest of the seven** — dispatched with an explicit
warning not to let that number set the effort, since 13 is a *gate-derived* count and the gate
was just measured 64% blind.

### 152-09 — core/shared packages sweep — COMPLETE (~1h 18m, 3 commits)

11 files, 30 rules. `build`, `test:unit` (**1,835 tests / 173 files, identical before and
after**), `lint:check`, `assert-comment-hygiene.mjs`, `prettier --check` all green. Gate
flip-tested 9 red / 9 green.

**Both completeness numbers, over `packages/**` excl. dev-seed:**

| | Lines | Files |
|---|---:|---:|
| Nine gate rows | **13** | 6 |
| Widened sweep (152-07 grep + 152-08's four classes + 10 more) | **29** | 11 |
| Real reference-bearing lines after classification | **28** | 10 |
| **Invisible to the gate** | **15 — 54%** | |

**The trap it names is the sharpest observation of the night:** the gate's 13 matched the
register's 13 **exactly** — *"that agreement is the trap: it makes a 46%-swept partition look
finished."* Agreement between gate and register is not evidence of completeness.

**Widening the scanner has a FLOOR (memo item 17).** Five real reference-bearing lines name no
artifact at all — `F15-C`, the `T1`/`T2`/`T3` proof-obligation labels, *"the two red targets"*,
*"added with the product fix"* — so **no id-shaped pattern can ever reach them.** Found by
reading. Scaling rule stated: a 13-span partition should be read end to end; **152-10's 132
spans cannot be**, so it needs the scanner AND a read of its long spans. Dispatched that way.

**WINDOWS 98 — a criterion unsatisfiable as written, for every plan 07-12.** Task 3 says run the
prover `--range <plan-start>..HEAD`; with the docs commit as HEAD that ALWAYS reports violations
— one per `.planning/` file — because the classifier maps `md` to an empty comment family and
reads every Markdown byte as code (same root cause as D7). Measured: `..ea5bf6685` = 15
compared / **4 violations**; `..7390fd983` bounded at the last refactor commit = 11 compared /
**0 violations** / exit 0. 152-08 had read it the same way without saying so — which is how a
reader ends up unable to reproduce a number. Now memo item 16, with an explicit "**never add an
allow entry for a `.planning/` path**".

Both fenced decisions produced a clean NEGATIVE finding here rather than being nibbled at:
`task-id` is 0 across all eleven workspaces, and the gate over `packages/**/*.md` (excl.
dev-seed) is 0 on every row. **No `.md` byte changed.** D6 and D7 stay exactly where 152-08
left them.

Judgement calls, all registered rather than taken silently:
- `generateBoth.yaml:30,36` left byte-identical — `## Task 1:` / `## Task 2:` sit inside a
  `promptText: |` **block scalar**: LLM prompt content, not comments. The classifier maps `yaml`
  to the `#` family with no block-scalar state, so it would have mis-swept them. Classifier NOT
  modified.
- `condenser.ts`'s `PHASE 1..4` **reworded to `STAGE 1..4`, not stripped** — they name a
  method's four internal stages. `STAGE` over `STEP` because `step`/`stepIndex` already names
  something else in the same method.
- `matchingAlgorithm.ts:44`'s `see.` typo traced to a 2024 formatting refactor, not a citation
  strip — outside the scope boundary, registered not fixed.
- `packages/shared-config/**` — **not one byte.** Escape count verified at 5 before and after.
- One 152-05-class break repaired: `multipleChoiceCategoricalQuestion.test.ts:51` read
  `(binary subdimensions per).` after an earlier commit deleted `D-06` and closed the paren over
  the hole. A seven-signature damage scan confirmed it was the only one in the partition.
- `packages/dev-tools/**` is in the prefix, named by no plan frontmatter and in no register
  queue — the ownerless-gap shape again. Checked (gate 0, wide 0); needed nothing.

Commit-message counts mechanically counted before writing, both times — third plan in a row.

### 152-10 — frontend contexts, dynamic components, Supabase adapter — DISPATCHED
132 spans. Dispatched with the two-route method 152-09 prescribed (widened scanner + deliberate
read of long spans, each site attributed to its route) and with the bounded prover range.

### 152-10 — frontend contexts, dynamic components, Supabase adapter — COMPLETE (40 min, 4 commits)

84 files, 216 rewrite sites. `build` 0 · `test:unit` 0 (54 files / **816 tests, unchanged**) ·
`lint:check` 0 · `assert-comment-hygiene.mjs` 0 (1,560 files).

**A measurement convention worth keeping (memo item 19).** It reported per **rewrite site**, not
per line, and said why — a multi-line rewrite has one anchor and many collateral lines:

| Route | Per site | (per line would have said) |
|---|---:|---:|
| Nine gate rows | 136 (63%) | 165 |
| Widened sweep only | 45 (21%) | 82 |
| **Neither — found by READING** | **35 (16%)** | 308 |

**The gate missed 37%** — fifth measurement in the series (27 / 64 / 54 / 37). It is never zero.
The 35 read-only sites are exactly the memo-17 class: `D1 field-init order` x8, `Pattern 3 / L-2`,
`A7`, `A2 SEAM`, `Group G`, `REACTIVE_ACCESSORS`, *"to keep the audit grep clean"*, plus 21
codemod repairs whose citation was already gone. One instructive near-miss:
`EntityListControls.svelte:58` reads `post Phase` / `97/98` **across a line break**, which no
phase-shaped pattern can reach.

**Prover bounded correctly (memo 16):** `--range eb6225303~1..5895b106a` = **84 compared, 0
allowed by name, 0 violations, exit 0**. Run to HEAD it reports one violation per `.planning/`
Markdown file. **No allow entry added.** Both numbers in the SUMMARY, so the result is
reproducible.

Two unsatisfiable criteria, each proven by a named flip-tested route:
1. *"gate reports 0 on every row"* — five raw survivors are all `describe()` **titles**
   (`ASSERT-08`, `RUNES-05`, `CLEAN-04`, `D-05`, `D-06`), which are 152-13's and are program
   bytes. Proven comment-scoped (0/9); nine injected tokens turn all nine rows red, reverting
   returns all nine to zero.
2. *"declaration-line grep returns 0"* — returns **2**, because a citation sat in a **trailing
   comment on a `let`**. Proven by a comment-stripped `+`/`-` comparison (symmetric =
   comment-only), flip-tested against a real declaration widening (asymmetric). Now memo item 20.

Also: **21 codemod repairs** (memo 14) including six empty-paren identifiers (`new DarkMode `,
`get value `, `Updatable.subscribe `) and a duplicated line in `trackingService.svelte.ts`;
**one false claim corrected** (memo 6) — `AdminNav.svelte:33` said `getRoute` *"is still a
store"* while the same file calls `getRoute.current(...)` at seven sites; a **Phase-157 handoff**
recorded at `supabaseDataProvider.ts:361-366`, left byte-identical. Whole-prefix ownership,
fifth confirmation: 71 queue files + **13 the queue never listed** = 84, zero out of partition.

Memo 12 and 13 both **negative** again: zero E2E coverage ids; all seven in-prefix `README.md`
files clean on every gate row and the wide sweep; **zero `.md` bytes changed**.

### 152-11 — frontend routes + base components, and the phase EXEMPLAR — DISPATCHED
105 spans. Dispatched with the two-route method, the per-site convention, the bounded prover
range — and with **152-03's outstanding debt named explicitly**: the
`(voters)/+layout.svelte:75` `unmet-truth`, which 152-03 deferred to this plan by name on the
grounds that 152-11 deletes that whole block. Its disposition must be stated by name, resolved
or re-registered with a new owner.

### 152-11 — frontend routes, component library, and the phase EXEMPLAR — COMPLETE (23 min, 6 commits)

**152-03's debt discharged by name.** The 17-line block at `(voters)/+layout.svelte` containing
`SettingsOverlay.svelte.ts` went **entirely**;
`git grep -nI "SettingsOverlay\.svelte" -- ':!.planning' ':!.claude'` now exits 1 with zero
lines. WINDOWS **70** moved `open -> fixed`. No word was edited inside the block, so RESEARCH
§7's verbatim extents matched byte for byte on read — **which is exactly why deferring was the
right call.**

**The exemplar** is line-exact against D-A2 across all eight extents: 45 comment lines removed,
2 written, net **-43** (criterion was >=40). The invariant survives compressed to one
citation-free line stating rule **and** consequence.

Completeness per SITE: **153 sites** — gate 107, widened-only 34, **reading-only 12**.
**Blind spot 30%.** (Per line the same diff reads 116/48/162 -> 64%; both given, unit stated —
which is exactly why memo 19 requires the unit.) Series: 27 / 64 / 54 / 37 / **30**.

Prover, bounded: `224f78e60..95deffbd5` = 70 compared, **0 violations, 0 allow entries**, exit 0.
Through docs = 74 compared, **4 violations**, exit 1 — one per `.planning/**.md`, exactly as
WINDOWS 98 predicts. All 70 source files `COMMENT-ONLY` in both.

Whole prefix: **66/66** queue files + **4** the queue never listed, 0 out-of-partition. The five
`src/lib/*` dirs its frontmatter listed belong to 152-10 under the prefix rule — re-measured
clean; nothing owed, nothing taken.

**Three new registered items promoted to memo 21-23:**
- **21 — deleting a block obliges a grep for pointers INTO it.** `candidate/+layout.svelte:50`
  pointed at `(voters)/+layout.svelte:100-119` — lines Task 1 had just deleted. A dangling
  line-range pointer looks more precise than the citation it replaced.
- **22 (WINDOWS 113) — `git checkout --` is NOT a safe flip-test undo.** It destroyed an
  uncommitted sweep edit; caught only because the gate still read red afterwards.
- **23 — three more scanner classes:** two-letter ids (`CR-01`, `VT-03`), digit-infixed alpha
  runs (`NAVA11Y-01`), single-letter threat ids (`T-62-04`). Also **confirmed the
  split-across-a-line-break class** (`introduced by Phase` / `88`) — second sighting.

Also registered: **111** — `git grep validate_answer_value -- apps/frontend` reads 1 not 0,
from a **tracked `tsconfig.tsbuildinfo` echoing stale source**; source trees read 0. **112** —
Task 2's `svelte-warning: accepted` criterion is **vacuous** (0 before, 0 after; the format is
absent from `apps/frontend` entirely).

Green: `build`, frontend `test:unit` (54 files / 816 tests unchanged), `lint:check`
(svelte-check 0/0), `assert-comment-hygiene.mjs` — all exit 0.

### 152-12 — Supabase backend + docs site — DISPATCHED (last plan of wave 4)
Smallest partition at 9 spans, dispatched with memo 17's small-partition warning in force
(the blind-spot series has never been zero) and with both fenced questions flagged as likely to
fire in a prefix full of Markdown and cross-referenced ids.

### 152-12 — Supabase backend + docs site — COMPLETE (22 min, 5 commits) — WAVE 4 CLOSED

**The genuine exception needed no edit.** `identity-callback/index.ts:249-251` — the ASVS V7
control stating why the claim-extraction error is logged and never returned — **carries no
planning citation at all**, exactly as the register predicted at § 7.5(c). Protecting it meant
recognising the correct edit was **none**, while resisting a file-wide pass that had just
rewritten four other comments in that same file. Before-and-after recorded verbatim; the
exemption is legible in the commit body, the SUMMARY and two permanent acceptance greps.
Promoted to memo item 25 — *an exemption nobody can see is indistinguishable from an oversight.*

Completeness per site: gate 5 · widened-only 7 · **reading-only 3** · total 15.
**Blind spot 67% — the highest in the phase.** Final series across all seven partitions:
**27 / 64 / 54 / 37 / 30 / 67 %.**

**152-09's agreement trap sprang exactly as predicted:** the gate returned 13 occurrences over
**the same six files the register lists** — perfect gate/register agreement, two thirds of the
real work outside both.

**Final scanner class: dated walkthrough marker ids** — `260524-l1t D7`, `260523-u53`, the ids of
`.planning/quick/` sessions (`\b\d{6}-[a-z0-9]{2,6}\b`). **Six of fifteen sites, invisible to all
nine gate rows because they open with digits.**

Registered rather than engineered around: the `phase-ref` row is unsatisfiable (2 of 7 survivors
are shell `echo` program bytes, 5 are protected stage markers — and rewording the comments alone
would *desynchronise* each from the banner printed on the next line); `yarn db:lint:sql` is
**pre-existing red**, flip-tested byte-identical at `4be4f7301` — both linters query the running
database, not the tree. **Memo 13 fires positive** (`benchmarks/README.md:121` + 8
`markdown-file` residue rows; every `.md` byte untouched). **Memo 12 does NOT fire** — no
coverage id in this partition, no CI job cites one. 16 stale intra-repo SQL cross-references
found, judged out of class, registered.

Prover bounded: **10/10 compared, 0 allow entries, 0 violations**; unbounded at HEAD 12/12/0/**2**,
both named `.md` scoping artefacts. Whole-prefix ownership confirmed a **seventh** time — 5 of
the 10 files touched were never in the register's list, and only 4 of its 9 queued spans were
sweepable at all.

### 152-13 — test-title renames — DISPATCHED (wave 5)
**This is the plan the D6 fence was built for.** Dispatched with the strongest instruction of the
run: sweep genuine planning references in test titles, leave every **E2E coverage id**
byte-identical, distinguish the two classes **by evidence** (appearance in a run register or
citation by a CI job) rather than by pattern shape, list which ids went in which class, and
report the `task-id` row as **DEFERRED-TO-OPERATOR** — explicitly not as met, and not as an
ordinary unsatisfiable row, because it differs in kind: the others *cannot* be satisfied, this
one *could* be but must not be.

### 152-13 — test-title renames — COMPLETE (20 min, 5 commits) — THE FENCE HELD

**The fenced decision was not taken.** All **81** residue-register rows the plan named as its
authoritative queue turned out to be coverage ids. **None was renamed.** In the executor's own
words: *"The queue turned out to contain only work I must not do, and all the work I must do lay
outside it."* Promoted to memo 26 — a queue that comes back entirely fenced is a **mis-scoped
queue**, not a finished plan.

**Told apart by EVIDENCE, not shape** (memo 27). The run registers store test titles *verbatim*,
so it built a corpus of the **1,400 textual files under `tests/e2e-runs/`** and substring-matched
every extracted title against it:

- **all 19 Playwright coverage-id titles cited, 12-61 register files each**
- **all 62 vitest ones, zero**

**The proof shape was never the test:** `D-07` vs `EPERM-07` — identical shape, opposite classes.
And `D-07`'s 11 register hits are all the *candidate-journey* title — **a different `D-07`
entirely.** A shape-based rule would have got both wrong.

- **Class 2 (fenced, byte-identical):** 70 occurrences across 38 titles — `EFLOW-/EPERM-/EQTYP-/
  UNBLK-/TMPL-/GEN-(incl. GEN-06a..g)/CLI-/ASSERT-/RUNES-/CLEAN-/NF-/CR-/WR-04/IN-01`, plus
  `T-58-07-02` x2 (class 1 by evidence, left anyway because `dev-seed/README.md` cites it three
  times as the guard's name and memo 13 forbids repairing Markdown), plus the `@probe` title.
- **Class 1 (swept):** 46 sites — 21 `Pitfall N`, 11 decision ids, 2 criterion numbers, 2 UAT
  gaps, 2 assumptions, `RES-1`, `P01`, `R3.3`, `Risk #7`, `TIR3`, `Bug 1`, `RED until :378`,
  `Plan 05`.

`task-id` reported **DEFERRED-TO-OPERATOR**, registered as WINDOWS **120** with the full evidence
table and the ruling owed.

**46 renames across 24 files** — not the plan's "roughly 23 across 20". Routes: 13 from the
widened scanner, **33 from the read -> 72% blind spot, the highest in the phase.** Final series:
27 / 64 / 54 / 37 / 30 / 67 / **72**.

Prover bounded at `cc319db17`: **24 compared / 24 allowed by name / 0 violations / exit 0**; flip
test with zero allows gives **24 violations**, proving the allows are load-bearing rather than a
blanket. This is legitimate and now memo 28: **the zero-allow rule is scoped to comment-only
plans**; a title-rename plan edits program bytes by design. **No `.planning/` allow entry** — that
prohibition stays absolute.

Gates: `build` 0 · `test:unit` **1,835 / 0 skipped / 173 files, identical per workspace** ·
`lint:check` 0 · `assert-comment-hygiene` 0. Repo-wide gate exits 1 with all 88+21+2+5+1
occurrences attributed — **not one is a test title.**

Also registered: **121** (`T-58-07-02`), **122** (a third and fourth Markdown site —
`tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`; **and the constraint that three of the five `§`
in `fonts/README.md` are OFL 1.1 LICENCE SECTIONS that must survive any ruling**), **123**
(out-of-scope `TIR3`/`B2 fix` comments + three more scanner classes for 152-14/15).

### 152-14 — the D-A4 forced-line-break sweep — DISPATCHED (wave 6)
**The plan whose checkpoint the operator ruled last night.** Dispatched with the ruling as
required reading #1 and an explicit instruction NOT to re-raise it: option (b), re-measure and
confirm rather than stop, write the decision doc from what it measures itself. Both amendments
carried — verify `PARAGRAPH_BREAK` still in place (do not re-implement), and `.editorconfig`
byte-identical because long joined comment lines are *sanctioned by the ruling, not violations*.
Warned that `152-12` deliberately left the identity-callback control byte-identical as its
genuine exception, so the join must not undo that protection — a line-break change is a different
axis from a citation strip.

### 152-14 — the D-A4 forced-line-break sweep — COMPLETE (45 min, 7 commits)

**The ruled decision was NOT re-raised.** Live figures came in at 13,936 junctions / 5,549
paragraphs / 741 files against the ruling's 14,094 / 5,550 / 747 — **inside 1.2%**, so the
re-raise condition did not fire and option (b) proceeded as instructed. Decision recorded in
`152-LINEBREAK-DECISION.md` from what the executor measured itself, not copied from the ruling.

Applied in **3 refactor commits** (the plan's cap): apps 3,411 junctions / 385 files · packages
3,796 / 207 · tests 5,795 / 135. Prover bounded at `dbc752e6a`: **727 compared, 0 violations,
0 allow entries, exit 0.** `hooks.server.ts`, `hooks.ts` and `.editorconfig` all byte-identical.

**THE FINDING OF THE NIGHT — reading the first apply's diff caught a silent behaviour change the
ruled predicate would have shipped.** Five ways the verbatim D-A4 predicate destroys structure:

- **903 junctions were folding fenced `@example` code blocks** — the whole component library's
  usage samples. `Button.svelte:40-49`, a ten-line `tsx` sample, was about to become one line.
- **`yarn lint:check` went red** because the sweep folded prose onto
  `candidate/register/+page.svelte:51`'s `eslint-disable-next-line`. **Two
  `svelte-ignore state_referenced_locally` directives were damaged identically and would have
  reddened NO GATE AT ALL.** That is threat **T-152-03** — an edit changing a directive's parse
  — reached by a route the no-dash prohibition does not cover. A silently disabled lint rule
  across the frontend.
- Section headers absorbing their paragraphs (43), unfenced shell recipes folded (135), aligned
  reference tables folded (42), and 47 token splits where the join inserted a space inside a
  hard-wrapped token.

Four are codified as **widenings of existing ruled constants** or preconditions beside
`BLOCK_DELIMITER` — **the ruling's five categories are unchanged in number and meaning**, so the
operator's disposition was honoured rather than reinterpreted. The fifth was hand-fixed: 43
repaired, 4 reviewed KEEPs — including a suspended hyphen, *"a single- or double-quoted string
literal"*, where the space is correct English.

**Net: the sweep is 6.4% smaller than the naive predicate, and every junction removed is
structure rather than prose.**

Two criteria unsatisfiable as written, registered not engineered around:
- **The dash criterion (WINDOWS 124).** `git grep -c` counts LINES; a sweep that removes lines
  necessarily lowers the count (551 -> 516) **with zero dashes normalised**. Replaced by a
  per-file occurrence proof — **8,715 = 8,715 across all 727 files** — flip-tested red on one
  injected em dash, green after a byte-identical restore.
- **`yarn db:lint:sql` is pre-existing red and cannot be otherwise (WINDOWS 125).** Its failing
  half lints the **live database** and reads no working-tree file; four plpgsql warnings, none
  comment-related. The file-reading half exits 0.

Fenced questions stay fenced: 23 E2E coverage ids untouched, every `.md` byte identical.

### 152-15 — guard rule 2 + phase close — DISPATCHED (wave 7, FINAL PLAN)
Owns the phase's **closing E2E cardinal gate** — nine plans have edited the tree since 152-05
discharged the mid-run gate, including 46 test-title renames and a 13,002-junction sweep across
727 files. Dispatched with the full protocol (background+poll, `db:reset`, one fresh dev server,
stale-server detection on both `lsof` and `docker ps`, counts decoded from the report zip rather
than the console tail) and with an explicit instruction that if the suite cannot run, the gate is
reported UNDISCHARGED — never waived. Also carries 152-01's `.css`/`.html` extension-gap, which
152-01 registered specifically for this plan because rule 2's corpus makes it material, and the
requirement that rule 2 enforce 152-14's HARDENED predicate rather than the naive one.

### 152-15 — guard rule 2 + phase close — COMPLETE (~55 min, 6 commits)

## ✅ PHASE 152 COMPLETE — 15 / 15 PLANS

**THE CARDINAL GATE IS DISCHARGED.** `yarn test:e2e` -> **150 passed, 10.2m, exit 0**. Counts
decoded from the report payload rather than the console tail:
`{total: 150, expected: 150, unexpected: 0, flaky: 0, skipped: 0, ok: true}` — `total == expected`
with `skipped: 0` is what establishes zero did-not-run. Environment verified first: 150 GiB
headroom, 5173 free on **both** `lsof` and `docker ps`, `yarn db:reset`, exactly one fresh dev
server. **All 46 of 152-13's renamed titles resolved.**

**1. The `.css`/`.html` gap 152-01 registered was measured and SPLIT, not waved through.**
`.html`: 4 files, 0 violations — **added** (1,560 -> 1,564 files scanned). `.css`/`.scss`: 4
files, **19 live rule-2 violations** — **declined**, because enabling a rule against N
pre-existing violations is exactly the D-N1(c) shape this phase rejected ("a guard that fails on
N pre-existing violations cannot be enabled until the sweep runs, so the split does not work
unless the guard ships disabled — which is no guard"). Two of the four are third-party
attribution headers; `inter.css` is a verbatim OFL-licensed `@fontsource/inter` header. Reason
and route-to-closing recorded in the guard's own docblock. WINDOWS 129.

**2. The sweep created exactly one violation, and only a phase-close comparison could find it.**
Comparing six gate rows and thirteen widened classes between pre-sweep `3e6158382` and now,
**exactly one moved upward**: `candidates-override.ts` read `… the defect Phase` / `145 repaired.`
**split across a line break** — unreachable by any grep — and **152-14's join re-assembled it into
a live planning reference.** Fixed, comment-only proven with zero allow entries. WINDOWS 130,
with the standing lesson: **any comment-joining sweep must re-run the reference gate afterwards.**

**3. Two requirements deliberately left Pending though `ready-ids` said 4/4.** `REVIEW-HYG-03`
and `-04` marked Complete. **`REVIEW-HYG-01` and `-02` left Pending on purpose** — both are unmet
*as literally worded* (19 forced line breaks survive in `apps/**/*.css`; the reference gate has
117 attributed survivors). **Marking them would convert a fenced operator question into a silent
claim.** Nothing force-marked.

`hygiene-grep-report.sh --assert-clean` exits 1 and **cannot go green without an operator ruling**
— reported with full per-occurrence attribution rather than engineered green (WINDOWS 128, 131).
Incidentally: `git grep -nE '\bdash\b'` is **silently vacuous** — git's ERE engine needs `-P` for
`\b`; the property holds under `grep` and `git grep -P`.

**Both fenced questions remain OUTSTANDING and unresolved, as required.** D6 (23 coverage ids,
`VGATE-04/05` gating the blocking `e2e-visual` job) and D7 (Markdown, four sites, OFL licence
sections). **Plus a third: the `.css` family.** Those three rulings are what unblock
`REVIEW-HYG-01` and `REVIEW-HYG-02`.

### PHASE 152 VERIFICATION — **status: passed** (with honestly-recorded open items)

14/14 independently-verified truths; 4/4 REVIEW-HYG requirements correctly classified (2 Complete,
2 correctly Pending). The verifier did **not** trust the SUMMARYs — it reproduced essentially
every hard claim against the live repo:

- Re-ran the guard itself: **1,564 files / 0 violations**, `--self-test` 6 fixtures + 27 edge
  cases / 0 failures; confirmed it is the **7th link of `lint:check`**; confirmed rule 2's nine
  constants are **byte-identical** between the standing guard and the phase-local instrument
  (diff shows only comment-prose differences) — so **152-14's hardening did NOT smuggle in a
  sixth category**; the operator's ruling was honoured.
- `git diff d206dc31a HEAD` over `hooks.server.ts`, `hooks.ts`, `.editorconfig` is **empty**;
  blob hashes match at both revisions. All four named Markdown files byte-identical.
- **Decoded the actual `report.json` payload** from the preserved HTML report itself, not the
  SUMMARY's transcription: `{total:150, expected:150, unexpected:0, flaky:0, skipped:0, ok:true}`.
- Re-ran every gate live: `build` 14/14 · `lint:check` 22/22 · `format:check` clean · dev-seed
  570/570 · frontend 816/816 · `db:lint:sql` pre-existing red on the same three named PL/pgSQL
  warnings, structurally unrelated to any file this phase touched.
- Independently confirmed the **19 `.css` rule-2 violations** exist and that the reference gate
  genuinely exits 1 (checked via direct `$?`, not through a pipe) — so `REVIEW-HYG-01`/`-02` are
  **correctly** left Pending.

**One addendum from the verifier's own widened sweep, not previously registered:** `DEF-133-01`
survives at `tests/tests/helpers/navigation.ts:185` and `tests/tests/utils/voterIntro.ts:8,23`.
It fits the already-sanctioned "id used as vocabulary, not narrative" pattern (as WR-05 and
T-58-07-02 were), so it is not scored as a gap — it is a data point for the phase's own thesis
that the gate is not a completeness test. Worth a one-line WINDOWS entry.

**No human verification items.** The three fenced questions are deliberate operator decisions,
fully recorded — not verification gaps.

---

## WAVE B BEGINS — 154, then 155, then 153-01..08

### 154-01 — prove the determinism breach on unfixed code — COMPLETE (8 min, 5 commits)

Precondition verified first: `ElectionsGenerator.ts` still draws `faker.date.future({years: 1})`
and `answers.ts` still draws `faker.date.recent()`, both with **no reference date**.

| Clock | `election_date` | `seed_q_date` answer |
|---|---|---|
| `2026-01-15T00:00:00.000Z` | `2026-10-09` | `2026-01-14T07:17:19.007Z` |
| `2026-09-15T00:00:00.000Z` | `2027-06-09` | `2026-09-14T07:17:19.007Z` |
| `2026-01-15T00:00:00.001Z` | `2026-10-09` (identical) | `2026-01-14T07:17:19.008Z` (**moved**) |

**The one-millisecond row is the sharp part:** a comparison restricted to day-granularity
`election_date` **passes across a real drift**. That is the whole reason the breach needed
demonstrating rather than asserting. The plan's midnight-straddle contingency was not needed.

Three flip-tests, each confirmed RED on the intended assertion before the gate was trusted:
elections `count 1->0`, question `type date->text`, and stripping `refDate` from the pinned draws.
`git checkout --` was used to restore only AFTER the relevant work was committed (house rule 6
honoured, where phase 152 lost an edit to exactly this).

**Three inherited figures were wrong — all registered:**
1. **The drift sites are `ElectionsGenerator.ts:48` and `answers.ts:77`, NOT `:58`/`:91`.** That
   wrong pair is repeated in the plan's own precondition, in RESEARCH R1/R3.3, **and in
   `REQUIREMENTS.md`'s REVIEW-SEED-01.** Substance holds, line numbers do not. **154-03 must
   navigate by call expression.** `REQUIREMENTS.md` deliberately not edited — this phase's plans
   state nobody edits it here.
2. dev-seed baseline is **570, not 569** (final 574 after this plan's 4).
3. `determinism.test.ts` was **88 lines, not 109/110** — block located by content instead.

Two exemptions made legible rather than engineered around:
- *"`git diff --name-only` lists exactly one file"* was unsatisfiable by construction — two
  planning docs were already dirty before the plan started, **none of them its own**. Proved the
  real property (no production code touched) by the named route
  `git diff --name-only -- packages/dev-seed/src/` returning empty.
- **Full E2E correctly declined**, and not for convenience: the whole diff is one vitest unit-test
  file, nothing imports it, and **`@openvaa/dev-seed` is not a dependency of `apps/frontend`**
  (`grep -c` returns 0), so it has no path to the served app. Disk had 150 GiB free, so ENOSPC
  did not drive the decision — the zero-runtime-surface proof did. Registered as `unrun-verify`.

Gates: `determinism.test.ts` 10 passed · dev-seed `test:unit` **574 / 49 files** · dev-seed
typecheck clean · root `test:unit` 25/25 · root `lint:check` 22/22 with comment-hygiene at 0 ·
`git diff -- packages/dev-seed/src/` **empty** (the fix is 154-03's, and was not pre-empted).

### 154-02 — discharge criteria 3 and 4 — DISPATCHED
Dispatched with the three corrected figures and a specific warning about this plan's shape:
*"confirm what already ships"* is the easiest place in a phase to write a green tick nobody
checked, so criteria 3 and 4 must be discharged by **named, flip-tested routes** rather than by
inspection.

### 154-02 — discharge criteria 3 and 4 — COMPLETE (~11 min, 5 commits)

Criteria 3 and 4 **retired on evidence, not implemented**. No file under `packages/dev-seed/src/`
changed (`git diff --stat e839d5658..HEAD -- packages/dev-seed/src/` empty). Four cases added
across two test files; dev-seed suite 574 -> **578 / 49 files**. Root `test:unit` 25/25,
`lint:check` 22/22, comment hygiene 0.

**Every new assertion flip-tested RED before being trusted — five flips.** The load-bearing one
temporarily commented out `assertFixedRowsCarryExternalId` in `src/template/schema.ts`: both
rejection cases went red **while the `safeParse(...).success === true` half stayed GREEN**, which
is exactly the pre-hardening statement the negative control encodes. The `src/` file was committed
and unmodified at injection time, so `git checkout --` was a safe undo (house rule 6).

**A FOURTH family of stale inherited line numbers** — same root cause as 154-01's three: the
phase-152 hygiene sweep shortened these files two hours ago.

| What | Inherited | Measured |
|---|---|---|
| `return validateTemplate(builtIn);` | `resolve-template.ts:84` | **`:60`** |
| `assertFixedRowsCarryExternalId` | `schema.ts:194` / `:227` | **`:130-144`, cond `:138`, call `:163`** |

The wrong pairs are embedded in **REQUIREMENTS.md REVIEW-SEED-03/04 and ROADMAP criteria 3 and 4**,
which the phase forbids editing — so they remain wrong in place, registered instead.

**Two acceptance criteria demanded literal citations that are FALSE** — they require the SUMMARY
to contain `resolve-template.ts:84`, `test.ts:115-130`, `schema.ts:194` and `:227`. Rather than
assert four falsehoods or silently drop the criteria, each inherited literal appears **only inside
a correction sentence naming the measured location beside it**. Reported and registered.

**E2E declined by a route RE-PROVED on this plan's own diff** (not inherited): two vitest unit
files, nothing imports them, `@openvaa/dev-seed` not a dependency of `apps/frontend`.

Handoff to 154-04: file todo slug `dev-seed-whitespace-only-external-id-accepted` — **three spaces
pass the guard today because the check is raw length, not trimmed length.**

## DEFERRED — D8. `requirements mark-complete` is blocked on ANNOTATED rows (added 2026-08-29; NARROWED by 154-03)

**Mechanical, low-stakes, but it will recur in every remaining phase — worth ruling early.**

`requirements mark-complete` returns `not_found` for this phase's ids and writes nothing.
Diagnosed: the traceability Status cells read
`Pending — measured 2026-08-28 as already satisfied by Phase 144 (…)`, but `milestone.cjs` gates
on `/^(pending|gaps found)$/i` against the **trimmed whole cell**. The row exists but rejects the
write, so the checkbox flip is rolled back (#2788 defect 2) and the tool reports `not_found`.

The executor did **not** hand-edit: this phase forbids editing `REQUIREMENTS.md`, and rewriting
the cell would **delete the annotation carrying the "already satisfied" finding**.

**NARROWED 2026-08-29 by 154-03: the block is ROW-SPECIFIC, not phase- or repo-wide.**
`requirements mark-complete REVIEW-SEED-01 REVIEW-SEED-02` **succeeded** — both surfaces written,
nothing hand-edited — because those rows held a **bare `Pending`**, which `milestone.cjs` matches.
Only rows whose Status cell carries a trailing annotation reject the write. So the ruling is still
needed, but for fewer ids than 154-02 feared.

**Choose one:**
- (a) normalise the affected Status cells to a bare `Pending` and re-run the tool — loses the
  inline annotation unless it is moved somewhere that survives;
- (b) tick the affected ids by hand at phase close;
- (c) fix `milestone.cjs` to match on a leading `Pending` rather than the whole trimmed cell —
  the only option that stops this recurring for phases 155, 153, 156 and the rest.

### 154-03 — the determinism FIX — DISPATCHED
Dispatched with all four families of corrected coordinates, an instruction to navigate by call
expression rather than line number, and the specific warning that **a post-fix proof comparing
only day-granularity `election_date` goes green whether or not anything was fixed** — 154-01's
one-millisecond row proves that comparison is blind. Also told to re-prove the E2E-decline route
on its own diff rather than inherit it, since unlike 154-01/02 it changes production `src/` code.

### 154-03 — the determinism FIX — COMPLETE (14 min, 4 commits)

**The breach is closed at the granularity that actually moved:**

| Clock | `seed_q_date` before | after |
|---|---|---|
| `2026-01-15T00:00:00.000Z` | `2026-01-14T07:17:19.007Z` | `2026-12-31T07:17:19.007Z` |
| `2026-09-15T00:00:00.000Z` | `2026-09-14T07:17:19.007Z` | `2026-12-31T07:17:19.007Z` |
| `2026-01-15T00:00:00.**001**Z` | `2026-01-14T07:17:19.00**8**Z` | `2026-12-31T07:17:19.007Z` |

The guard asserts whole-pipeline `JSON.stringify` equality **plus both sites separately, at both
deltas** — deliberately not `election_date` alone, which was byte-identical across the real 1 ms
drift. 154-01's mechanism control survives with **0 changed lines**. Suite 580 / 49 files;
typecheck, root `test:unit` 25/25 and `lint:check` 22/22 (hygiene 0) all green.

**Three things it refused to inherit — all three were wrong:**

1. **Its own plan's backstop truth 13 is FALSE.** It claimed the wave-1 controls stay green
   through task 1. They cannot: 154-01 wrote a *per-site* `electionDate` **inequality** on exactly
   the site task 1 pins, so the suite went red on
   `expected '2027-09-25' to not deeply equal '2027-09-25'` — **and that message is itself proof
   the tracer worked.** It flipped that one operator *inside the tracer's own commit*, honouring
   the no-red-commit invariant while keeping both boundaries, rather than merging commits and
   losing the tracer's record.
2. **The plan's typecheck blast radius was one file short.** It named only `tests/utils.ts`; two
   further fixtures build complete `Ctx` literals inline (`clustering.integration.test.ts`,
   `nominations-override.test.ts`) and broke **under typecheck only, invisible to vitest**. The
   tripwire worked; its enumeration didn't.
3. **The inherited E2E-decline route DOES NOT HOLD, and it replaced rather than repeated it.**
   154-01/02 declined on *"no path to the served application"*.
   `grep -c dev-seed apps/frontend/package.json` is still 0 — **but `tests/seed-test-data.ts:12`
   imports `runPipeline`, so dev-seed reaches E2E through the DATA, not the dependency graph.**
   Harmless for their test-only diffs; not for production `src/`. So it proved the stronger thing:
   **all 30 built-ins emit byte-identical datasets** under the fixed anchor, a wall-clock anchor
   (= the pre-fix behaviour) and a 2044 anchor, through the exact `runPipeline` + `fanOutLocales`
   composition the harness seeds with. Zero synthetic elections everywhere; `e2e/base`'s one date
   question is pre-answered. **The suite has nothing to observe.**

Both temporary probe files removed and verified gone. Five WINDOWS entries appended.

### 154-04 — close the phase — DISPATCHED (final plan of 154)
Dispatched with the three explicit handoffs addressed to it (file the whitespace-external_id todo,
attempt `mark-complete` without hand-editing, leave the stale citations in place but flagged) and
with **the corrected E2E reasoning made mandatory** — it may not inherit 154-01/02's disproved
"no path to the served app" route, and must decide the question on its own diff.

### 154-04 — close the phase — COMPLETE (20 min, 3 commits)

## ✅ PHASE 154 COMPLETE — 4 / 4 PLANS

**E2E gate discharged, and the decision was made on evidence rather than convenience.** Its diff
touched `templates/e2e/perm/show-feedback-survey.ts` — a built-in the harness seeds from. In its
own words: *"comment-only is a strong argument, but 154-01/02 had a strong argument too and
154-03 found it incomplete."* **So it ran the suite**, covering the phase's whole accumulated diff
including 154-03's production `src/`:
`{total: 150, expected: 150, unexpected: 0, flaky: 0, skipped: 0, ok: true}` — decoded from the
report payload, 10.2m, exit 0, **identical to the 152-15 baseline on every field.** Nothing
annotated, skipped or retried.

**Six more measured corrections — this milestone's running count is now sixteen:**
1. **Comment site one was already discharged by 152-08.** Not re-edited. Its acceptance criterion
   (`latentEmitter` count == 1) is unsatisfiable **without producing exactly the duplicate diff
   D-C3 exists to prevent** — so satisfying it would have violated a locked decision.
2. **R10's 22 election-date line numbers are ALL stale** (`default.ts:79`->`:51`,
   `base.ts:418/:430`->`:346/:358`, …). File set and per-file counts identical. It **overrode the
   plan's explicit "copy verbatim, do not re-grep"**, on the grounds that 22 wrong citations in a
   routing document defeat the document. Correct call.
3. **R10's E2E-coupling premise is refuted** — `grep -rn "2026-06-15" tests/` returns 0 files, as
   do the Finnish/English/US renderings; the frontend does not branch on the date. Its
   *conclusion* survives by a different route (the perm serial DAG seeds these rows) — the same
   data-not-imports shape 154-03 found.
4. **The comment it was told to repair cited a stale range itself** (`appContext.svelte.ts:414-437`;
   measured `:305-327`). **Copying the plan's sketch verbatim would have fixed one broken citation
   by writing another.**
5. **REVIEW-HYG-02 deliberately not marked** despite `ready-ids` returning 3/3 — the gate only
   checks siblings *in this phase*, and the bare `Pending` cell **would** have flipped. The row
   belongs to Phase 152 and its text sizes the class at 817 comment lines.
6. REVIEW-SEED-03/04 re-confirmed blocked (both `not_found`, nothing written); 01/02 already
   complete from 154-03. **`REQUIREMENTS.md` byte-identical throughout.**

**Handoffs discharged.** `dev-seed-whitespace-only-external-id-accepted` filed — and it *measured*
the downstream claim rather than inheriting it: the column has **no CHECK constraint** on
blankness, so the cost is human (invisible in logs), not structural, **which is what makes the
`low` severity honest**. Stale citations left in place per the prohibition, with a worked table
naming each wrong figure and its measured truth, plus WINDOWS 149 naming the two shared documents
so a later phase can find them.

**Two operator items, not decided here:** REVIEW-SEED-03/04's annotated Status cells (see D8), and
the stale shared-doc citations, which need a phase permitted to edit REQUIREMENTS.md and ROADMAP.

### PHASE 154 VERIFICATION — **status: passed**, 4/4 criteria

Independently re-derived rather than trusted:
- **Half 1:** `git diff 6d4b4f151^..49b4c2a08 -- packages/dev-seed/src/` is **empty** — 154-01's
  negative-control commits touched zero production code, so the breach really was proven on
  unfixed code.
- **Half 2:** `ElectionsGenerator.ts:48` and `answers.ts:77` both now pass `refDate` from
  `SEED_REF_DATE`/`ctx.refDate`.
- **The subtle part** (the thing most likely to be fake): read `determinism.test.ts` at HEAD —
  the committed guard asserts whole-pipeline `JSON.stringify` equality **and both sites
  separately, at both the 8-month and 1 ms deltas**. Confirmed by diff that exactly the two
  per-clock cases inverted from `.not.toEqual` to `.toEqual`, while **154-01's mechanism control
  shows 0 changed lines** — exactly as claimed.
- Ran the dev-seed suite itself: **580 / 49 files.** Decoded the E2E `report.json` out of the
  base64 zip in a fresh Python process: `{total:150, expected:150, unexpected:0, flaky:0,
  skipped:0, ok:true}`. Re-ran `build` 14/14, `test:unit` 25/25, `lint:check` 22/22.
- Confirmed `tests/seed-test-data.ts:12` really does import `runPipeline`/`BUILT_IN_TEMPLATES`,
  **validating 154-03's corrected E2E-decline reasoning**.

**Its own independent sweep answered the question I asked — was TWO the right number of
wall-clock reads to fix?** It found **no** unseeded `Math.random`, **no** unseeded `Faker`
instance, and **no** other row-affecting `Date.now()`/`new Date()` in `packages/dev-seed/src/`.
The only wall-clock-adjacent thing remaining is `gen_random_uuid()` on `nominations.id` — a DB
surrogate key, outside the row-content determinism contract and already mitigated by a prior
phase's `sort_order` pass. **Two was the right number.**

**One correction to this log's own earlier wording.** 154-04 and this log said `REQUIREMENTS.md`
was "byte-identical throughout". Precisely: its **prose** is byte-identical, but two tracking
cells DID change — the REVIEW-SEED-01/02 checkbox and status flips written by the sanctioned
`requirements mark-complete` tool call, and nothing else. No hand-editing occurred, which was the
substantive claim; "byte-identical" overstated it.

---

## PHASE 155 — Edge Function Hardening (env, JWT, provider identity)

### 155-01 — fail CLOSED on audience and issuer — COMPLETE (20 min, 5 commits)

`identity-callback` now binds `aud` and `iss` on every verification via
`requireVerifyClaimBinding` in a new pure sibling module, **called on the path to
`jose.jwtVerify` so the guard is structural, not positional**. Absent and empty-string are both
treated as unconfigured. **The comment that argued FOR the fail-open is deleted, not merely
contradicted.**

**Accept-then-reject demonstrated with both halves:** OLD at `8ebc3ebe4` red — plus a *permanent*
assertion that the evil-issuer token **resolves** under `{}` — and NEW at `636b4e7a2` 26/26,
rejected with `ERR_JWT_CLAIM_VALIDATION_FAILED`. Both flip-tests went red, so the control can fail.

**Four inherited claims were stale — corrected, not carried:**
- **The prior review's CR-02 error-oracle finding NO LONGER HOLDS.** Every catch arm returns a
  fixed opaque string with a comment saying so; no `kid` reaches the wire. (Operator memory
  updated accordingly — it had this as live.)
- **RESEARCH Pitfall 7 / D-N1 say the comment-hygiene gate does not exist. It does** — `lint:check`
  now ends `&& yarn assert:comment-hygiene` (1,566 files, 0 violations). Those documents were
  written before **phase 152 built it tonight**. It does not forbid `--` as an em dash.
- **T-155-SC's "no new registry fetch" is false:** the plan's literal `yarn add -D jose` pulled
  **6.2.10**, splitting the tree. Pinned to `^6.2.1` to dedupe onto the audited copy.
- `DEFAULT_SEED_PROJECT_ID` is at `:30`, not `:31`.

**The provider-config pair HAS re-diverged** — frontend `IDURA` `extractClaims` carries `country`,
the Deno copy does not. The security half (`identityMatchProp: 'sub'`) agrees. Not fixed; handed
to Plan 03. This pair drifted undetected once before, so the recurrence matters.

**Task 1's acceptance criterion 7 is unsatisfiable** — it forbids the string `Deno.` in
`verifyConfig.ts` while the same task mandates reproducing a docstring that *names*
`Deno.env`/`Deno.serve`/`deno.land` to declare their absence. The cited analog scores 1 on the
identical grep. Proven by two flip-tested routes instead (comment-excluding grep; and the module
importing under plain Node where no `Deno` global exists). **Plans 02/03/04 will hit this same wall.**

**E2E declined on measurement, not argument** — every `identity-callback`-referencing spec is
behind `PLAYWRIGHT_BANK_AUTH`, the sole non-spec reference is docstring prose, and the default run
never serves the function. **But the opt-in suite IS affected — this plan would have broken it —
so rather than assert the repair it executed it:** new 7-line recipe **ACCEPTED**, old 4-line
recipe **REJECTED [ERR_ISSUER_UNCONFIGURED]**. A real `PLAYWRIGHT_BANK_AUTH=1` run is still owed
and is filed as an open window.

Gates: supabase 20 -> **26/26**, `test:unit` 25/25, `build` 14/14, `format:check` clean,
comment-hygiene 0, eslint 0 errors.

## OWED — a real `PLAYWRIGHT_BANK_AUTH=1` run
155-01 repaired the opt-in bank-auth token recipe and proved the repair by executing it, but the
gated suite itself has not been run. Filed by 155-01 as an open window; worth clearing before ship.

### 155-02 — invite-candidate base64url + mandatory SITE_URL — COMPLETE (15 min, 5 commits)

Gates: supabase 26/26 -> **37/37**, `test:unit` 25/25, `build` 14/14, `lint:check` 22/22,
comment-hygiene 0 / 1,570.

**1. The plan's non-disclosure premise was FALSE, and following it literally would have created
the leak the phase exists to close.** Task 2 asserted the new throw *"is caught by the existing
handler, which logs the real error and returns its fixed opaque response"*, and threat row
T-155-10 rated the risk `low` **on that basis**. That describes `identity-callback`.
**`invite-candidate`'s catch did the opposite of BOTH halves** — no logging, and `err.message`
returned in the body. Left alone, `requireEnv`'s message would have published
`Missing required environment variable: SITE_URL.` to callers: **the plan's own stated invariant,
broken BY the change the plan requested.** Fixed (`console.error` + fixed opaque response).
**T-155-10 needed correction, not mitigation.**

**2. A sharpening of the "unsatisfiable criterion" rule, which was becoming easy to over-claim.**
Two criteria (no `Deno.` in the new modules) genuinely ARE the 155-01 wall — the mandated
docstring must *name* `Deno.env` to declare its absence — and were reported and flip-tested (route
A 0->1 on injection; route B 37/37 -> `Deno is not defined`). **But a third only LOOKED like it:**
the executor's own first draft used the forbidden word while explaining the change, and **that
word was not load-bearing**. Reworded; the criterion genuinely passes at 0.

> **The rule, now propagated to later plans: a criterion is unsatisfiable only when what it
> forbids is what the task REQUIRES. If you can satisfy it by writing differently without losing
> meaning, it is a draft to revise, not an unsatisfiable criterion.**

**3. E2E declined on measurement, not inheritance.** `invite-candidate` is ordinary admin-gated
functionality, so 155-01's "it's an Edge Function" reasoning would not transfer. Checked:
`functions.invoke` appears **zero** times under `tests/`; the many `inviteUserByEmail` hits are
name-matches (`supabaseAdminClient.ts` calls the admin API directly from Node, bypassing the
function); and `preregisterWithApiToken` — the only frontend caller — is referenced solely by its
interface and its own mocked unit test.

The negative control uses `{"marker":"~~~"}`, whose segment **verifiably contains `-`**; `atob`
threw `DOMException: Invalid character` before and parses after. Its own first draft of the latin1
test **had a real bug** — one padding char where three were needed, landing on the single length
class `atob` rejects — caught by the suite, fixed, recorded as a deviation.

## ⚠ OPERATOR ACTION — your root `.env` is missing FOUR now-required variables

Measured 2026-08-29 (names only; no values read):

| Variable | root `.env` | `.env.example` | Required by |
|---|---|---|---|
| `SITE_URL` | **missing** | documented | `invite-candidate` (155-02) |
| `SMTP_HOST` | **missing** | documented | `send-email` (155-04) |
| `SMTP_PORT` | **missing** | documented | `send-email` (155-04) |
| `SMTP_FROM` | **missing** | documented | `send-email` (155-04) |

These functions now **require** these rather than silently defaulting — the intended D-D2
behaviour, and the whole point of the phase. But it means
`supabase functions serve invite-candidate` and `supabase functions serve send-email` will throw
`ERR_ENV_UNCONFIGURED` locally until you copy the four across from `.env.example`.

**I did not edit `.env`** — it is your local environment and the correct SMTP values depend on
your setup. Not a defect; just something that will surprise you at the terminal.

Also filed: two **pre-existing** `details:` leaks the executor deliberately did NOT fix (out of
this plan's scope), plus the still-owed served-function run.

### 155-03 — remove the three silent config defaults — DISPATCHED
Dispatched with 155-02's finding 1 made a required check — it is making the same class of change
(silent defaults -> throws) in `identity-callback`, so for **each** new throw it must READ the
receiving catch arm and prove the message cannot reach a caller, rather than assume the plan's
premise. Also carries the sharpened unsatisfiable-criterion test, and owns both the provider-config
re-divergence and the still-open birthdate account-collision (fix with a threat model, or declare
out of scope — but not silently drop).

### 155-03 — three silent config defaults become named throws — COMPLETE (~15 min, 4 commits)

Gates: supabase 37/37 · `test:unit` 25/25 · `build` 14/14 · `lint:check` 22/22 ·
comment-hygiene 0/1,571 · `format:check` clean.

**Where each throw surfaces — READ, not assumed** (the check 155-02's finding forced). All five
`try`/`catch` pairs in `index.ts` mapped by indentation; the four inner arms each close before the
next `requireEnv`, so the calls at `:154`, `:183` and `:322` surface only at the outer `151->374`
pair — which `console.error`s the real error and returns a **fixed literal** `'Internal server
error'`, no template, no interpolation. **Unlike `invite-candidate`, the premise held here — and
verifying it is what makes saying so worth anything.**

**Two premises I fed this executor were STALE, and it measured both rather than accepting them:**

- **The birthdate account-collision is ALREADY CLOSED.** `identityMatchProp: 'sub'` appears twice
  in `claimConfig.ts`; `authConfig.ts:21,37` agrees; test-locked at both ends. Reported as
  not-a-defect **with the measurement** — neither "fixed" nor silently dropped.
- **The `country` difference is DELIBERATE, not re-divergence.** Three measurements: `country` has
  **zero consumers** anywhere in `apps/frontend/src` or `apps/supabase/supabase`; and decisively,
  `candidate-bank-auth.spec.ts:174` says verbatim *"`country` is NOT in the production
  extractClaims set, so it is intentionally not asserted"* and asserts the exact two-element set —
  **the Deno-side absence is test-locked on purpose.** 155-01's "the pair has re-diverged" reading
  (which this log repeated) is therefore wrong.
  **What IS missing is a drift guard**, and that needs a prior decision — agree on `extractClaims`
  as a whole, or only on `identityMatchProp`? Filed as WINDOWS 160. *(Operator memory corrected.)*

**One genuinely unsatisfiable criterion**, checked against 155-02's sharpened test first: Task 1
AC2 was **already false at HEAD before this plan's diff** — `invite-candidate/envConfig.ts:8` and
`envConfig.test.ts:4` both match because they quote `Deno.env.get('X') || fallback` **in prose, to
declare why it is abolished** — and AC8 mandates a byte-identical copy, so rewording is forbidden.
Forbidden text *is* what the task requires. Flip-tested via a comment-excluding grep.

> **Action handed to Plan 05:** `assert-edge-env-defaults.mjs` **must exclude comment lines** or it
> will red on three explanatory docstrings.

**Every plan line citation for `index.ts` was stale by 18-40 lines** (`:169`->`:151`,
`:197`->`:179`, `:361`->`:321`, `:355`->`:315`, `:17`->`:16`). **The only correct number was the
one it forbade touching.** `155-PATTERNS.md` §6 carries the same stale figures.

Also found: `siteUrl` at `:315` is not merely a name collision but a **dead binding** — assigned
and never read. Left untouched by instruction (AC7 pins the count); filed as WINDOWS 161.

Its own Task 1 comment tripped the hygiene gate — **caught by the gate, not by review** (commit
`b5bf954dd`). Phase 152's guard earning its keep on the same night it shipped.

### 155-04 — send-email base64url, placeholders, required SMTP — COMPLETE (12 min, 5 commits)

Gates: supabase 37/37 -> **55/55**, `test:unit` 25/25, `build` 14/14, `lint:check` 22/22,
comment-hygiene 0 / 1,576, `format:check` clean.

**1. The catch-arm check paid off a SECOND time — the score is now 2 of 3.** `send-email`'s outer
catch (`try` at `:40`, `catch` at `:286`) returned `err.message` **verbatim with no logging** —
the `invite-candidate` shape, **not** the `identity-callback` shape that the plan's Task 3 premise
and threat row T-155-23 both assert. All three `requireEnv` sites surface only there. Left alone,
`Missing required environment variable: SMTP_HOST.` would have gone to callers.

> **The generalisation, now a standing check: the catch-arm premise is a property of each FILE,
> not of the codebase.** Two of the three Edge Functions contradicted their own plan's threat model.

**2. Enumerating the placeholder keys from the tree found what the examples hid.**
`resolve_email_variables` emits five keys and **two are three segments deep**
(`nomination.constituency.name`, `nomination.election.name`) — **no example in the plan or the
research is.** All five asserted in both whitespace forms. There are no template files anywhere:
`templates` is entirely caller-supplied, so the SQL producer is the only contract. The D-D4 control
is flip-tested — under the rejected traversal implementation **all five real keys fail.**

**3. One criterion was genuinely the wall; two only looked like it** — and it revised those two
into compliance rather than registering them, applying its own sharpened test from 155-02. The
genuine one: its mandated byte-identical copy added the fourth docstring hit.

E2E declined with a four-way proof: the 20+ `sendEmail` hits under `tests/` are the harness's own
method calling `inviteUserByEmail` from Node, **never the Edge Function**.

### 155-05 — the D-D2 static guard — DISPATCHED
**Two prior plans filed an action addressed to this one:** the guard must exclude comment lines
structurally, or it reddens on the **four** explanatory docstrings this phase itself wrote (155-03
filed it at three; 155-04's own mandated copy made it four). Dispatched with that as the primary
risk, plus phase 152's keepability principles — ship LIVE, no opt-out flag or ignore-file, never
enable a rule against N pre-existing violations, assert chain MEMBERSHIP not position, and
flip-test both halves because a gate that examines nothing also reports green.

### 155-05 — the D-D2 static guard — COMPLETE (~27 min, 5 commits)

Guard reports **0 / 17 files**, wired into `lint:check` as link **8 of 8** with its MEMBERSHIP
asserted by a test (not its position). Gates: `lint:check` exit 0 (22/22), `test:unit` 25/25,
dev-seed 584/50, comment-hygiene 0 / **1,577**.

**The filed action discharged — and a FIFTH trap neither prior plan named.** It measured rather
than inherited (comment-blind scan: exactly 4 hits, all prose, zero code — 155-04's count was
right). Then it found **check 3 has the same problem from the other direction**: `envConfig.ts`,
`claimConfig.ts` and `verifyConfig.ts` all name the Deno global **in prose** ("no `Deno.env`, no
`Deno.serve`") while holding none in code. **A check-3 without comment exclusion would have
reddened on the very docstrings stating the contract it enforces.**

**It rejected the cheap fix on FAILURE MODE, not diff size** — the standout judgement of the
phase. The shared classifier didn't fit as it stood (no exports; self-executes a whole-tree scan
on import). The three-line route was to entry-point-guard `assert-comment-hygiene`'s `main()`.
It refused, because **that route's failure mode is phase 152's guard silently ceasing to run,
latently — the exact catastrophe this phase exists against.** Extracted to
`scripts/lib/comment-spans.mjs` instead, whose failure mode is a visible refactor bug and whose
detector (`--self-test` over committed fixtures) already existed. **Inertness proven:** self-test
PASSED, whole-tree run **byte-identical on stdout AND stderr**, and still able to fail (injected
escape -> exit 1).

**One observation proved three properties at once:** an operator **wrapped onto the next line**,
injected below a 14-line block comment, was caught at **the exact real line 230** while the
**12 prose mentions inside that comment were not flagged**. Plus drift naming both paths,
URL-import and Deno-global catches, and 6 violations ordered path-then-position, byte-identical
across runs.

**A subtlety worth keeping:** the comment-hygiene count stepping 1,576 -> 1,577 *matters*. The
guard intersects with `git ls-files`, so an **unstaged new file is invisible to a tree scan** —
its first run still said 1,576. **Staging before measuring is what made that check real rather
than vacuous.**

One genuinely unsatisfiable criterion (window 170) — but only after checking whether it could be
revised: Task 1 AC4 (`^import .* from '[^n]'` = 0) conflicts with the mandated classifier reuse.
Its *intent* is the bootstrapping property, which a relative sibling import does not touch, so it
was **revised to "every specifier is `node:` or `./`"** and flip-tested.

Deliberately left (window 172): `send-email/jwtSegment.ts:6` says its byte-identical copy lives in
`send-email/` — **itself**. The `envConfig.ts` copies share the shape. **Inherent to
byte-identity, not carelessness** — a per-file correction would immediately redden check 2 of the
new guard. The fix is one commit rewording every copy together; handed to 155-06.

### 155-06 — phase close, port/loopback scan — DISPATCHED (final plan of 155)
Dispatched with five outstanding obligations named explicitly (the owed `PLAYWRIGHT_BANK_AUTH=1`
run, `REVIEW-EDGE-02`'s mark, window 172's self-referential docstrings, window 161's dead binding,
and the two pre-existing `details:` leaks), plus the instruction that **a scan's clean zero is
worth nothing until it is shown able to go red** — and that it must stage before any
`git ls-files`-based count, or the count is vacuous.

### 155-06 — phase close, port/loopback sweep — COMPLETE (~45 min, 5 commits)

## ✅ PHASE 155 COMPLETE — 6 / 6 PLANS

Gates: `test:unit` 25/25 · `lint:check` exit 0 (8 of 8 links) · `format:check` exit 0 ·
**`test:e2e` 150/150, zero skipped** — delta zero against phase 154's close, decoded from the
report payload. Servers shut down, both ports confirmed free, and the temp file carrying the test
private JWK deleted.

**1. The owed `PLAYWRIGHT_BANK_AUTH=1` run was EXECUTED, not deferred a third time.** Full runbook
rig: JWKS server on `:8777` with reachability confirmed **from inside a Supabase container rather
than assumed**, `supabase functions serve identity-callback --env-file`, one dev server. Result
**8/8, `skipped: 0`**, and the served-function log shows **12 real requests** — a genuine Deno run
of the deployed function, closing 155-01's open `human_judgment` item. Then it made it fail: the
pre-155 four-line recipe gives `1 failed, 5 did not run, exit 1`; restoring gives 8/8 twice.

> **That flip corrected the phase's own claim.** 155-01 recorded the old recipe as
> `REJECTED [ERR_ISSUER_UNCONFIGURED]`. On a **real** request the handler reads
> `DEFAULT_PROJECT_ID` at `index.ts:165` *before any token work*, so an operator actually sees
> `ERR_ENV_UNCONFIGURED / DEFAULT_PROJECT_ID`. **155-01 drove only the token path offline, which
> is why it could not see this.** Not a product defect — but the guidance would have sent an
> operator looking in the wrong place. Window 174.
>
> The same observation **confirmed the non-disclosure bar ON THE WIRE for the first time**:
> variable name present in the container log, absent from the response body.

**2. The scan lied TWICE before it told the truth** — and both lies were silent:
- **`git grep -E` has no `\b` on this git.** It returned `ports = 0` **across the whole
  repository**, over a file whose line 10 is `port = 54321`, **with no error**. (152-15 hit the
  same ERE-engine gap independently — `\b` needs `-P`. Two phases, same trap.)
- **The pathspec glob `packages/*/src` matches nothing, silently** — bucket A read **1 hit instead
  of 51**.

Its first draft shipped both. Both are demonstrated with reproductions in the sweep record,
alongside 155-05's staging lesson (verified 5 -> 6 after `git add -N`). Both halves of the pattern
were flipped in the bucket that reported zero, and **the port half catches a bare literal the
loopback half misses**, so they are independently load-bearing.

**3. Window 172 FIXED** — one commit, all five byte-identical copies reworded together, and
flip-tested rather than asserted: a per-file phrasing in one copy makes check 2 exit 1 naming both
paths, exactly as the window claimed.

**4. REVIEW-EDGE-04 NOT force-marked.** `ready-ids` said 5/5; `mark-complete` applied 4 and
declined 04 on both surfaces (`write_set_complete: false`) because its Status cell reads
*"Retired on evidence (…) — doc-verification residue only"* and the matcher tests the trimmed
whole cell. **This is D8 again** — see the deferred section.

**Declined explicitly, not silently:** window 161 (dead `siteUrl`) and the three `details:` leaks
(windows 157, 166) — all three tasks declare no source change and the bindings have zero runtime
effect. **Window 161's own anchor was stale: `:318`, not `:315`.**

**Deviation: five todos, not four.** The re-run found **two silent env-defaults in
`apps/supabase/scripts` and `apps/supabase/benchmarks` that RESEARCH's bucket A never searched.**
Also: every RESEARCH bucket-A line number was stale by 6-32 lines; every anchor filed was
re-measured.

### PHASE 155 VERIFICATION — **status: passed**, 5/5 must-haves
*(written after a 600 s watchdog stall and a SendMessage resume; the report was written FIRST on
resume, then amended — which is why it survived this time)*

All four named security properties verified **against running code**, not SUMMARY prose:

1. **`aud`/`iss` fail-closed is STRUCTURAL, not merely a call-site convention** — there is exactly
   **one** `jose.jwtVerify` call site (`identity-callback/index.ts:81`) and it is fed
   unconditionally by `requireVerifyClaimBinding`. So a future caller cannot route around it.
   Permanent negative control re-run green (55/55).
2. **No unconfigured-env message reaches a caller** — read all three catch arms directly and
   traced the `try`/`catch` nesting; all log-and-return a fixed literal.
3. **base64url decode** — read both `jwtSegment.ts` copies (byte-identical via `cmp`) and
   **verified the negative-control fixtures genuinely contain `-`/`_` before firing**, which is
   the check that makes the control mean anything.
4. **The D-D2 guard** — it **personally injected a real silent default** into
   `send-email/index.ts`, watched the guard go red naming the exact `file:line`, reverted, and
   confirmed 0 violations and a clean tree. Live as link 8/8 of `lint:check`.

It also **independently decoded the bank-auth report from disk** — `total=8, expected=8,
unexpected=0, skipped=0, ok=true` — matching 155-06's claim exactly from a genuine artefact.

**One gap flagged honestly rather than asserted or dropped.** The default `yarn test:e2e` 150/150
claim was **NOT** independently re-confirmed: the report file on disk had been **overwritten by
the later bank-auth run**, and launching a full `db:reset` + dev server + ~10 min suite was judged
unsafe unattended mid-verification. Recorded in `not_performed` frontmatter AND as a human
verification item, with the reasoning that the bank-auth decode is *corroborating by adjacency,
not a substitute*.

> **Root cause worth fixing:** `tests/playwright-report/` is overwritten every run. 154-04
> preserved its run to `tests/e2e-runs/154-04-cardinal-gate/`; phase 155's default-suite run was
> not copied to a per-run path before the bank-auth run clobbered it. **Every cardinal-gate run
> should be copied to `tests/e2e-runs/<plan>-<label>/` immediately.**

Two residual-risk findings, both already disclosed by the phase and independently re-measured
rather than taken on trust: the broader silent-config-default class survives **outside** the
guard's scope (`packages/dev-seed`, `apps/supabase/scripts` — 5 sites, filed as out-of-scope
todos), and a **different-operator variant** survives *inside* the hardened functions — **13
non-null-assertion `Deno.env.get(...)!` sites**, outside the guard's stated coverage by design.

---

# ⏸ RUN PAUSED HERE — 2026-08-29, at the operator's request

Three phases complete (152, 154, 155), **all three verified passed**. Phase 153 deliberately NOT
started so nothing is in flight. See `RESUME-HERE.md` for the next action, the eight open
operator decisions, and the house rules.
