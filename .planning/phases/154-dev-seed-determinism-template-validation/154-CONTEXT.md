# Phase 154: dev-seed Determinism & Template Validation - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Source of decisions:** `.planning/v2.15-DISCUSSION-POINTS.md` § 0 (fact 11), § C (C1–C3), § N (N1–N3)
**Requirements:** REVIEW-SEED-01..04 (see `<open>` — these ids are not yet in `REQUIREMENTS.md`)

<domain>
## Phase Boundary

`@openvaa/dev-seed` states a determinism contract in writing — "same seed = same rows" — in its
README (`packages/dev-seed/README.md:86`, `:133`, `:247`), in the `Template` authoring docstring
(`packages/dev-seed/src/template/types.ts:54-56`) and in the CLI's `--seed` help text
(`README.md:46`). Two live `faker.date` calls read the wall clock, so the contract is false across
days. This phase makes it true, and proves it was false first.

Delivers:

1. **Fixed reference window** — both measured wall-clock sites generate from a fixed `refDate`
   rather than from `now`, so `election_date` and date-question answers are seed-deterministic
   across time (roadmap criterion 1).
2. **A negative control, then a committed guard** — the same seed run against a faked system clock
   set months apart is observed to produce *differing* output on current code, then *identical*
   output after the fix; the cross-time stability assertion is committed (criterion 2).
3. **Built-in / filesystem template parity in `resolveTemplate()`** (criterion 3) — see `<facts>`
   F4: this appears **already discharged** at HEAD by Phase 144 D-07, so the work is likely
   verification + a regression guard, not a change.
4. **`fixed[]` rows require `external_id`**, with a negative control showing the old schema
   accepting the bad row (criterion 4) — see `<facts>` F5: this too appears **already discharged**
   at HEAD.
5. **Two comment-shaped triage items in dev-seed files**, fixed here rather than deferred to
   Phase 152 (decision D-C3).

**Not in scope:** the wider planning-reference comment class inside `packages/dev-seed/**` beyond
the two items D-C3 names — that belongs to Phase 152 (see `<open>` O-3). Nothing about the seeding
*pipeline's* behaviour, row shapes, template contents, or the Supabase writer changes; this phase
touches date generation, one validation seam, and comments.

</domain>

<decisions>
## Implementation Decisions

**Checkbox semantics of the source document** (`.planning/v2.15-DISCUSSION-POINTS.md:11-24`): exactly
one option per decision carries `★ RECOMMENDED`; **all boxes unchecked = the ★ option is CHOSEN**,
identical to ticking it; a ticked `[x]` non-recommended box overrules the `★`; and `**EDIT:**` /
`**NOTE:**` / `**NOTES**:` free text beats every box.

**Every decision in § C is unchecked and carries no operator free text.** All three therefore resolve
to their `★ RECOMMENDED` option **by default**, which the document states is a complete answer, not
an absent one. The same holds for N1, N2 and N3. The one decision relevant to this phase that the
operator resolved **by tick** is § 0.1 (the factual baseline), option **(c)**.

### D-0 (§ 0.1, won by TICK — operator selected `(c)`, overruling `★ (a)`)

**Question:** is § 0's 33-fact table the run's factual baseline?

**Won:** `(c) Accept all 33 facts AND also correct `.planning/ROADMAP.md:1003-1217` in place`.
The nine ⚑ contradictions are edited into the roadmap phase entries so the roadmap stops carrying
false premises, at the cost of a commit touching a shared doc that parallel planners may be reading.

**Consequence for this phase:** the Phase 154 roadmap entry is being corrected concurrently by
another agent. **Where the roadmap and a § 0 fact disagree, the fact wins.** As read at the time of
writing, the roadmap entry has already absorbed fact 11 verbatim ("**exactly two**", with both
file:line pairs), so there is currently *no* disagreement to arbitrate for this phase. If a later
read of `.planning/ROADMAP.md` § "Phase 154" shows anything other than the two sites named in F1
below, **F1 wins**.

### D-C1 ⚠ DECIDE (won by DEFAULT — no box ticked, `★` stands)

**Question:** what is the fixed reference window that replaces wall-clock date generation?

**Won:** **(a) A single exported `SEED_REF_DATE` const (a fixed ISO date), overridable per template.**

**Winning rationale, verbatim from the source document:**

> one knob, seed-deterministic across time by construction, and templates that need a different era
> (an "upcoming election" demo) can set it explicitly rather than inheriting wall-clock.

**Rejected, with the recorded reason each was rejected** (so no planner re-opens them):

- **(b) Derive the ref date from the numeric seed** — "no new config surface; makes the generated
  dates unreadable and couples two independent concerns, so a seed change silently moves every
  election."
- **(c) Require every template to declare `refDate`, no default** — "most explicit; breaks every
  existing template at once and adds required boilerplate to the e2e templates."
- **(d) Fixed absolute date, no override** — "simplest; the default template's demo data permanently
  shows a past election date, which is visibly wrong in the Finnish demo."

**This is the ⚠ DECIDE of the phase** — it fixes what "deterministic" *means* for `election_date`
and for date-question answers from here on. Implementable without re-deciding, as follows:

- **Shape:** one exported constant, a fixed ISO date string, living in `@openvaa/dev-seed` and
  reachable from both consuming sites (`generators/` and `emitters/`). Both `faker.date.future` and
  `faker.date.recent` accept a `refDate` option; the const is passed as that `refDate`.
- **Override:** per-template, i.e. an optional template-level field alongside the existing
  `seed?: number` (`packages/dev-seed/src/template/types.ts:158`,
  `packages/dev-seed/src/template/schema.ts:122`). A template that sets it gets its own era; a
  template that does not inherits `SEED_REF_DATE`. Note `TemplateSchema` is `.strict()`
  (`schema.ts:164`) — a new template field must be added to the schema or every template setting it
  fails validation.
- **Wiring:** the seeded `Faker` instance is built once in `buildCtx`
  (`packages/dev-seed/src/ctx.ts:84-87`, `new Faker({locale:[en]})` + `faker.seed(template.seed ?? 42)`).
  The resolved ref date belongs on the same `SeedCtx` so both call sites read one resolved value —
  the planner may choose the exact carrier, but it must be a *resolved* value, not a re-read of the
  template at each site.
- **Value:** not fixed by this decision. Constraint from option (d)'s rejection rationale: the chosen
  default must not make the demo show an election date in the past. Note that the *hand-authored*
  fixed rows already hardcode `election_date: '2026-06-15'` at 20+ template sites (F6) — a date that
  is already past as of 2026-08-28 — so the "visibly wrong past date" problem exists today
  independently of this phase and is **not** this phase's to fix (see `<open>` O-4).

**Reversibility:** reversible — the const and the optional template field are additive; reverting
restores wall-clock behaviour with no migration and no published contract outside this repo.

### D-C2 (won by DEFAULT — no box ticked, `★` stands)

**Question:** how is the breach *proven real* before it is proven fixed (criterion 2)?

**Won:** **(a) A vitest guard using `vi.setSystemTime` at two dates months apart.**

**Winning rationale, verbatim:**

> runs in the existing unit suite, needs no new tooling, and the same test file holds both the
> negative control (differs on old code) and the positive (identical after).

**The load-bearing method detail — how the clock is faked:** **`vi.setSystemTime`**, from vitest,
inside the unit suite. Explicitly **not** `libfaketime` / `TZ`+`FAKETIME` around a CLI run — option
(b) was rejected because it "adds a platform-specific binary dependency that will not exist in CI or
on macOS ARM without work". And explicitly **not** "assert the fix only" — option (c) was rejected
because "criterion 2 exists precisely to forbid this, and the project's negative-control ledger
convention (Phase 142) requires it".

**What this obliges the plan to produce, in order:**

1. **Negative control, on unfixed code:** same seed, `vi.setSystemTime` set to two dates months
   apart, outputs **observed to DIFFER**. This must be *run and recorded*, not asserted from
   reasoning about `faker.date` semantics.
2. **Positive:** the same two-clock run after the fix, outputs **observed to be IDENTICAL**.
3. **Committed guard:** the cross-time-stability assertion lands in the suite so the class cannot
   reopen. `packages/dev-seed/tests/determinism.test.ts` (110 lines, `describe('determinism (TMPL-08)')`)
   is the established home for exactly this contract and is the natural host.

**⚠ Feasibility constraint the planner must design around (F7, measured):** neither faker site is
reached by any built-in template as they stand. `elections.count` is `0` in **every** built-in
(F6), so `ElectionsGenerator.ts:58` never fires; and the only `type: 'date'` question in any
built-in (`e2e/base.ts:755`) carries a hardcoded answer `'1980-06-15'` (`e2e/base.ts:277`), so
`answers.ts:91` never fires either. A negative control run against `runPipeline({seed:42})` or
against a built-in would show **no difference** — which would read as "no breach" and would be
wrong. The control must use a purpose-built in-test template that sets `elections.count > 0` and
emits a synthetic answer for a `date`-typed question. **`vi.useFakeTimers()`/`vi.setSystemTime` must
also be torn down** (`vi.useRealTimers()`) so the rest of the dev-seed suite is unaffected.

**There is no in-repo precedent for `vi.setSystemTime`** — a repo-wide grep for
`setSystemTime|useFakeTimers` across `packages/`, `apps/` and `tests/` returns **zero** hits. This
is a greenfield pattern here; the planner should not go looking for an existing one to copy.

### D-C3 (won by DEFAULT — no box ticked, `★` stands)

**Question:** two comment-shaped triage items sit in dev-seed files — which phase edits them?

**Won:** **(a) Fix them in 154, since 154 is already editing these files.**

**Winning rationale, verbatim:**

> avoids two phases touching the same lines, and 152's codemod will then find nothing here.

Rejected: **(b) Route both to 152 and leave 154 untouched** — "clean phase boundaries; two phases
queue diffs on the same file and 152 lands after 154 in the sequence, risking a conflict."

**The 152/154 boundary, stated so neither phase drops these and neither collides:**

- Phase 152 owns the comment class **repo-wide** (817 planning-reference comment lines measured;
  `.planning/ROADMAP.md` § "Phase 152" criterion 2).
- **Phase 154 edits these two sites.** Phase 152 does not. By the time 152's codemod runs, these
  two are already clean and it finds nothing here — which is the stated point of choosing (a).
- Phase 152 runs **first** in the roadmap order (see D-N1), so 154's fix lands on already-swept
  files; if 152 has already rewritten either site, 154's obligation is discharged and the planner
  should record that rather than re-edit.
- Everything *else* comment-shaped in `packages/dev-seed/**` stays with 152 — see `<open>` O-3.

**The two sites, measured this session** (the § C heading cites `types.ts:77`; see F8 for why the
line to edit is `:118`):

| Site | Measured location | What is wrong |
|---|---|---|
| 1 | `packages/dev-seed/src/template/types.ts:118` | The "Further reading" list's third bullet is a stub: `* - — latent` with its continuation on `:119-120`. Reviewer (PR #867, cited `types.ts:79` against the PR diff): "reads like an unfinished edit … Point it at the latent emitter docs (or remove the bullet)." |
| 2 | `packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts:48-49` | Dangling reference: `:48` ends `…(see phase 120 trace-confirmed; see` and `:49` opens `// ). A 1-second delay is the type-correct "small`. Reviewer: "better to remove the stub so the rationale reads cleanly." |

Note that site 2's fix is *also* a planning-reference removal ("see phase 120"), i.e. squarely
Phase 152's class — which is exactly why D-C3 exists.

### D-N1 (cross-cutting, won by DEFAULT)

**Won:** **(a) Keep 152 first as roadmapped, and land its scan in `yarn lint:check` (per A4a) so
later phases cannot reopen the class.** Rationale: "the enforcement, not the ordering, is what makes
the sweep durable, and running first means every later phase is written against the new convention."

**Consequence for this phase:** Phase 154 is authored **after** 152's sweep and **under** its
committed scan. Every comment this phase writes — around `SEED_REF_DATE`, around the new guard —
must satisfy that scan: no historical narrative, no planning-artifact paths, no phase or plan
numbers, no decision ids, no forced line breaks inside multiline comment spans. Concretely, the
"see phase 144, D-07" style already present in `resolve-template.ts:19-29` and `:80-84` is the style
this phase must **not** add.

### D-N2 (cross-cutting, won by DEFAULT)

**Won:** **(a) Follow-up items are filed in `.planning/todos/pending/` during the owning phase, with
blocking ones flagged.** Rationale: "that register is already this project's mechanism (12 todos
filed in Phase 147), and `/gsd-discuss-phase` cross-references it automatically on future phases."

**Consequence for this phase:** anything this phase declines to fix (see `<open>`) is filed there
during Phase 154, not left as a code comment and not opened as a roadmap backlog entry.

### D-N3 (cross-cutting, won by DEFAULT)

**Won:** **(a) One `<padded>-CONTEXT.md` per phase, generated from the shared decision document, plus
a shared `<padded>-DISCUSSION-LOG.md` pointer back to it.** Rationale: "`gsd-planner` and
`gsd-phase-researcher` read a single phase's CONTEXT.md; a milestone-level file would make each
planner read twelve phases' worth of irrelevant decisions."

**Consequence:** this document is that file. The pointer back is
`.planning/v2.15-DISCUSSION-POINTS.md` § 0 + § C + § N — read it for the options *not* taken and for
the other 30 facts. The `154-DISCUSSION-LOG.md` half of option (a) has **not** been written (see
`<open>` O-1).

### Claude's Discretion

- The literal value of `SEED_REF_DATE`, subject to option (d)'s rejection constraint (D-C1).
- The name and carrier of the per-template override field, and whether the resolved ref date rides
  on `SeedCtx` or is passed explicitly — provided both call sites read one resolved value.
- The exact two dates used for the `vi.setSystemTime` control, provided they are "months apart".
- Whether the cross-time guard extends `packages/dev-seed/tests/determinism.test.ts` or lands in a
  sibling file, provided it runs under the existing `vitest run` (`packages/dev-seed/package.json:16`).
- Whether site 1 of D-C3 is fixed by completing the bullet or by deleting it — the reviewer offered
  both.


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-0:** operator selected `(c)`, overruling `★ (a)`)
- **D-C1:** no box ticked, `★` stands)
- **D-C2:** no box ticked, `★` stands)
- **D-C3:** no box ticked, `★` stands)
- **D-N1:** cutting, won by DEFAULT)
- **D-N2:** cutting, won by DEFAULT)
- **D-N3:** cutting, won by DEFAULT)

</decisions>

<facts>
## Measured Facts

All measured in this worktree on 2026-08-28, branch `integration/ship-12-squash`. F1 is § 0 fact 11
restated with the paths verified; F2–F9 were measured while verifying it and are **not** in the § 0
table.

### F1 ⚑ — `faker.date` drift is exactly 2 sites, both confirmed live

This is § 0 **fact 11**, and it is the fact that outranks any conflicting roadmap wording (D-0).
`grep -rn "faker\.date" packages/dev-seed/src` returns exactly three lines, two of them live code:

| # | Path:line | Code | Status |
|---|---|---|---|
| 1 | `packages/dev-seed/src/generators/ElectionsGenerator.ts:58` | `election_date: faker.date.future({ years: 1 }).toISOString().slice(0, 10),` | **live** |
| 2 | `packages/dev-seed/src/emitters/answers.ts:91` | `return faker.date.recent().toISOString();` | **live**, in `case 'date':` |
| — | `packages/dev-seed/src/emitters/answers.ts:52` | `*  - \`date\` — \`faker.date.recent().toISOString()\`.` | docstring; must be updated with the fix |

Both paths and both line numbers are **verified to exist as stated**. There is no third live site.

### F2 — No other wall-clock read affects emitted rows

`grep -rn "new Date(\|Date.now()\|toISOString()" packages/dev-seed/src` adds only
`packages/dev-seed/src/cli/seed.ts:113` and `:129` — `const start = Date.now()` and
`const elapsedMs = Date.now() - start`, an elapsed-time readout for the CLI summary. Neither reaches
a row. F1's "exactly two" therefore holds for emitted data, not merely for the `faker.date` spelling.

### F3 — The determinism contract is stated in writing at four places

`packages/dev-seed/README.md:46` (`--seed` help, "determinism"), `:86` ("deterministic — same run
produces byte-identical rows"), `:133` ("deterministic — same seed = same rows"), `:247`
("`seed: number` — deterministic RNG seed (NF-04)"), plus
`packages/dev-seed/src/template/types.ts:54-56`. These are the written claims criterion 1 exists to
make true; the docstring at `answers.ts:52` is a fifth and must move with the code.

### F4 ⚠ — Criterion 3 appears **already satisfied** at HEAD

`packages/dev-seed/src/cli/resolve-template.ts:84` reads `return validateTemplate(builtIn);`, and
`:80-84` records that Phase 144 D-07 routed the built-in branch through the validator precisely so
built-ins, path-loaded modules and JSON all traverse the same two layers. `:19-29` states in the
module docstring that the "every resolved template runs through `validateTemplate()`" sentence
"became true in Phase 144 (D-07)" and was false before. The reviewer's comment (PR #867, cited
against `resolve-template.ts:59`) predates that fix.

**Not a § 0 fact** — the § 0 table carries no row for criterion 3, and the roadmap still schedules
it as work. Re-verify before planning. If it holds, criterion 3 reduces to *observing* the parity
and committing a regression guard, not changing behaviour. See `<open>` O-2.

### F5 ⚠ — Criterion 4 appears **already satisfied** at HEAD

`packages/dev-seed/src/template/schema.ts:194-208`, `assertFixedRowsCarryExternalId`, walks every
top-level slot with a `fixed` array and pushes
`template.<slot>.fixed[<i>].external_id: Expected a non-empty string` for any row whose
`external_id` is not a non-empty string, throwing `Template validation failed:` if any problem is
found. Its docstring at `:166-192` attributes it to Phase 144 and states the reason
(`_bulk_upsert_record` raises `external_id is required for bulk import`). Slots are discovered from
the parsed value rather than a hand-kept list, so new collections are covered.

Same caveat as F4: **not a § 0 fact**, the roadmap still schedules it. Re-verify. If it holds,
criterion 4 reduces to the negative control the criterion already demands (showing the *old* schema
accepting the bad row) plus a committed regression guard. See `<open>` O-2.

### F6 — Every built-in template sets `elections.count: 0` and hardcodes `election_date`

Measured across `packages/dev-seed/src/templates/**`: `elections.count` is `0` in `default.ts:72`,
`e2e/base.ts:411`, `:671`, `:1027`, `_helpers/buildMinimal.ts:407`, and in all eleven `e2e/perm/*`
templates that declare an `elections` fragment. Hand-authored `fixed[]` rows carry
`election_date: '2026-06-15'` at 20+ sites (e.g. `default.ts:79`, `e2e/base.ts:418`, `:430`,
`_helpers/buildMinimal.ts:241`).

### F7 ⚠ — Consequence of F6: neither faker site fires under any built-in template

- `ElectionsGenerator.ts:58` sits inside the synthetic loop `for (let i = 0; i < n; i++)` where
  `const n = fragment.count ?? 0` (`:50-51`). With `count: 0` everywhere, it never executes.
- `answers.ts:91` fires only for a `type: 'date'` question receiving a synthetic answer. The only
  `type: 'date'` question in any built-in is `test-e2e-base-qu-info-date` (`e2e/base.ts:753-761`),
  and every candidate carrying it gets the hardcoded `'1980-06-15'` via `DEFAULT_INFO_ANSWERS`
  (`e2e/base.ts:277`) / `withInfoAnswers` (`:284-286`). `default.ts` declares no `date` question at
  all.

This is why D-C2's negative control cannot use a built-in template — a run against one would show
no drift and would falsely read as "no breach". Design the control against a purpose-built template.

### F8 — The `types.ts` line numbers in the sources disagree with the tree; `:118` is the one to edit

Three different numbers name this one item: the reviewer cited `types.ts:79` (against the PR diff),
the discussion document's § C3 heading cites `types.ts:77`, and the measured stub is at
`packages/dev-seed/src/template/types.ts:118` (`* - — latent`, continuing `:119-120`, inside the
`## Further reading` block opened at `:113`). For reference, `:77` in the current tree is
`* - \`latent: LatentConfig\` — see phase 57 latent-factor answer model` — a *planning-reference*
comment, i.e. Phase 152's class rather than the incomplete-bullet item. **Edit `:118`.** If the
planner also wants `:77` cleaned, note it is 152's class and 152 runs first (D-N1).

### F9 — The suite home and the seeding entry point

- `packages/dev-seed/tests/determinism.test.ts` (110 lines) already holds the determinism contract
  as `describe('determinism (TMPL-08)')`, with three cases asserting byte-identical
  `JSON.stringify(runPipeline({seed}))` across fresh runs and across the default-seed fallback.
- `packages/dev-seed/src/ctx.ts:84-87` constructs one `new Faker({ locale: [en] })` per
  `runPipeline` call and seeds it with `template.seed ?? 42` — Pattern A, deliberately not the
  module-level `faker.seed()` shared-state trap. Any ref-date resolution belongs at this same seam.
- `packages/dev-seed/package.json:16` — `"test:unit": "vitest run"`, so a guard added here runs in
  the root `yarn test:unit` sweep with no new wiring.
- `packages/dev-seed/src/template/schema.ts:122` (`seed: z.number().int().optional()`) and
  `packages/dev-seed/src/template/types.ts:158` (`seed?: number;`) are the two declarations any new
  template-level field must mirror; `schema.ts:164` closes `TemplateSchema` with `.strict()`.

### F10 — The six PR #867 review comments this phase answers

`.planning/PRE-SHIP-REVIEW-TRIAGE.md:125-142` enumerates them: `resolve-template.ts:59` (built-in
validation), `answers.ts:89` (`faker.date.recent`), `ElectionsGenerator.ts:58` (`faker.date.future`,
and it is the reviewer who proposes "use a fixed `refDate` (or a fixed between-range)"),
`schema.ts:37` (`fixed` rows without `external_id`), `types.ts:79` (incomplete bullet),
`show-feedback-survey.ts:50` (dangling "see"). Line numbers are as-of the PR diff; F1, F4, F5 and F8
carry the measured ones.

</facts>

<open>
## Open Items

- **O-1 — `154-DISCUSSION-LOG.md` not written.** D-N3(a) specifies "one `<padded>-CONTEXT.md` per
  phase … **plus a shared `<padded>-DISCUSSION-LOG.md` pointer back here**." Only the CONTEXT.md was
  in this task's scope. Either that pointer file is produced separately, or the § "Source of
  decisions" header line above is accepted as discharging it. Flagging so it is not silently lost
  across all thirteen phases.

- **O-2 ⚠ — Criteria 3 and 4 look already discharged, and no decision covers that case.** F4 and F5
  measure both as satisfied at HEAD by Phase 144. § C contains no decision analogous to § D's
  **D1** ("Criterion 4 (Signicat identity) is **already satisfied**"), which is how the discussion
  document handles this situation elsewhere — so the operator has not ruled on whether 154 restates
  these criteria as observations, or does the work anyway. **Research must re-verify both before
  planning**, and the phase must not claim to have "fixed" what Phase 144 fixed. Note criterion 4's
  negative control ("A negative control shows the old schema accepting the bad row") is still owed
  regardless: it demonstrates the *pre-144* schema's behaviour, which no existing test does.

- **O-3 — The residual dev-seed comment class belongs to Phase 152, and nobody has scoped it.**
  D-C3 names exactly two sites. A loose grep
  (`grep -rn "see phase\|Phase 1[0-9][0-9]\|phase [0-9]\|D-0[0-9]\|Plan [0-9]" packages/dev-seed/src`)
  returns ~237 lines across 20+ files — planning references, decision ids and plan numbers, e.g.
  `resolve-template.ts:19-29` and `:80-84`, `schema.ts:166-192`, `ctx.ts:5-6`,
  `determinism.test.ts:41-60`. The pattern is deliberately loose and overcounts; the true figure is
  part of Phase 152's 817-line corpus. Recorded so 154 does not silently widen into 152's sweep and
  so 152 does not assume dev-seed was already handled.

- **O-4 — `election_date: '2026-06-15'` is already in the past** (today: 2026-08-28) at 20+
  hand-authored template sites (F6). Option (d)'s rejection rationale — "the default template's demo
  data permanently shows a past election date, which is visibly wrong in the Finnish demo" — is
  therefore describing a condition that **already exists** independently of the faker sites. No
  decision covers refreshing those hardcoded dates, and no roadmap criterion asks for it. Per D-N2,
  file it in `.planning/todos/pending/` rather than folding it in.

- **O-5 — `REVIEW-SEED-01..04` are not defined in `REQUIREMENTS.md`.** The roadmap entry cites them
  at `.planning/ROADMAP.md:1048`, but `grep -n "REVIEW-SEED" .planning/REQUIREMENTS.md` returns
  nothing (the only hits repo-wide are the two roadmap citation lines). The same is true of
  `REVIEW-HYG-01..04`. Verification that maps criteria back to requirement ids will find nothing to
  map to. Either the ids get added to `REQUIREMENTS.md` or the traceability step is explicitly
  scoped out for the whole v2.15 remediation run.

- **O-6 — Criterion 2's phrase "A guard asserting cross-time stability is committed" does not fix
  where.** D-C2 settles the mechanism (`vi.setSystemTime`, in the unit suite) but not the file.
  Listed under Claude's Discretion above; noted here so it is not read as an unanswered decision.

</open>

---

*Phase: 154-dev-seed-determinism-template-validation*
*Context gathered: 2026-08-28*
