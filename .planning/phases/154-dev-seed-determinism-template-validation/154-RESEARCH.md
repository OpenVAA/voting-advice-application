# Phase 154: dev-seed Determinism & Template Validation — Research

**Researched:** 2026-08-28
**Domain:** Seeded data generation determinism (`@openvaa/dev-seed`), faker reference dates, vitest fake timers, zod template schema
**Confidence:** HIGH — every load-bearing claim below was measured in this worktree this session by running code, not inferred from docs.

**Worktree:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`, branch `integration/ship-12-squash`.
**Working tree after research:** clean. The throwaway probe (`packages/dev-seed/tests/__tmp154probe.test.ts`) was deleted and `git status --porcelain` returns empty.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-0 (§ 0.1, won by TICK — operator selected `(c)`)** — the § 0 33-fact table is the run's factual
baseline AND `.planning/ROADMAP.md:1003-1217` is corrected in place. **Where the roadmap and a § 0
fact disagree, the fact wins.**

**D-C1 ⚠ DECIDE (won by DEFAULT)** — **(a) A single exported `SEED_REF_DATE` const (a fixed ISO
date), overridable per template.**

> one knob, seed-deterministic across time by construction, and templates that need a different era
> (an "upcoming election" demo) can set it explicitly rather than inheriting wall-clock.

Rejected, with the recorded reason each was rejected (so no planner re-opens them):

- **(b) Derive the ref date from the numeric seed** — "no new config surface; makes the generated
  dates unreadable and couples two independent concerns, so a seed change silently moves every
  election."
- **(c) Require every template to declare `refDate`, no default** — "most explicit; breaks every
  existing template at once and adds required boilerplate to the e2e templates."
- **(d) Fixed absolute date, no override** — "simplest; the default template's demo data permanently
  shows a past election date, which is visibly wrong in the Finnish demo."

Implementation shape fixed by D-C1: one exported constant, a fixed ISO date string, living in
`@openvaa/dev-seed` and reachable from both consuming sites; passed as `refDate` to both
`faker.date.future` and `faker.date.recent`; per-template override alongside the existing
`seed?: number` (`types.ts:158`, `schema.ts:122`), noting `TemplateSchema` is `.strict()`
(`schema.ts:164`); the resolved ref date belongs on the same `SeedCtx` seam as the seeded `Faker`
(`ctx.ts:84-87`) so **both call sites read one resolved value, not a re-read of the template at each
site**.

**D-C2 (won by DEFAULT)** — **(a) A vitest guard using `vi.setSystemTime` at two dates months apart.**

> runs in the existing unit suite, needs no new tooling, and the same test file holds both the
> negative control (differs on old code) and the positive (identical after).

Explicitly **not** `libfaketime` / `TZ`+`FAKETIME` (option (b), rejected: "adds a platform-specific
binary dependency that will not exist in CI or on macOS ARM without work"). Explicitly **not**
"assert the fix only" (option (c), rejected: "criterion 2 exists precisely to forbid this, and the
project's negative-control ledger convention (Phase 142) requires it").

Obliged order of production: (1) negative control on unfixed code, outputs **observed to DIFFER**,
*run and recorded*, not asserted from reasoning; (2) positive, same two-clock run after the fix,
outputs **observed IDENTICAL**; (3) committed guard.

**D-C3 (won by DEFAULT)** — **(a) Fix the two comment-shaped triage items in 154, since 154 is
already editing these files.** Rejected: (b) route both to 152 — "clean phase boundaries; two phases
queue diffs on the same file and 152 lands after 154 in the sequence, risking a conflict."

**D-N1 (won by DEFAULT)** — 152 stays first and lands its scan in `yarn lint:check`. Consequence:
every comment **this** phase writes must satisfy that scan — no historical narrative, no
planning-artifact paths, no phase or plan numbers, no decision ids, no forced line breaks inside
multiline comment spans. The "see phase 144, D-07" style at `resolve-template.ts:19-29` / `:80-84`
is the style this phase must **not** add.

**D-N2 (won by DEFAULT)** — follow-up items are filed in `.planning/todos/pending/` during the
owning phase, with blocking ones flagged.

**D-N3 (won by DEFAULT)** — one `<padded>-CONTEXT.md` per phase plus a shared
`<padded>-DISCUSSION-LOG.md` pointer.

### Claude's Discretion

- The literal value of `SEED_REF_DATE`, subject to option (d)'s rejection constraint (D-C1).
- The name and carrier of the per-template override field, and whether the resolved ref date rides
  on `SeedCtx` or is passed explicitly — provided both call sites read one resolved value.
- The exact two dates used for the `vi.setSystemTime` control, provided they are "months apart".
- Whether the cross-time guard extends `packages/dev-seed/tests/determinism.test.ts` or lands in a
  sibling file, provided it runs under the existing `vitest run`
  (`packages/dev-seed/package.json:16`).
- Whether site 1 of D-C3 is fixed by completing the bullet or by deleting it — the reviewer offered
  both.

### Deferred Ideas (OUT OF SCOPE)

- The wider planning-reference comment class inside `packages/dev-seed/**` beyond the two sites D-C3
  names — belongs to Phase 152 (CONTEXT O-3, ~237 loose-grep lines across 20+ files).
- Refreshing the hardcoded `election_date: '2026-06-15'` template rows (CONTEXT O-4) — filed as a
  todo per D-N2, not folded in.
- Anything about the seeding **pipeline's** behaviour, row shapes, template contents or the Supabase
  writer.

</user_constraints>

---

<phase_requirements>

## Phase Requirements

**⚠ CONTEXT O-5 IS STALE — the requirement ids DO exist.** CONTEXT.md O-5 states
`grep -n "REVIEW-SEED" .planning/REQUIREMENTS.md` returns nothing. **Measured now:** it returns four
hits, at lines 106–109. `REVIEW-HYG-01..04` are likewise present at `:88-91`, and `REVIEW-EDGE-*` at
`:113+`. A sibling agent added them, or the CONTEXT measurement predates them. Either way, **no
traceability step needs scoping out, and nobody needs to edit `REQUIREMENTS.md` for this phase.**
[VERIFIED: `.planning/REQUIREMENTS.md:106-109`, quoted verbatim below]

| ID | Description (verbatim from `.planning/REQUIREMENTS.md`) | Research support |
|----|--------------------------------------------------|------------------|
| REVIEW-SEED-01 | "`election_date` and date-question answers are generated from a **fixed reference window**, not from the wall clock, so the same seed does not drift with the calendar. (Measured, the drift is **exactly two live sites**: `faker.date.future({ years: 1 })` at `packages/dev-seed/src/generators/ElectionsGenerator.ts:58` and `faker.date.recent()` at `packages/dev-seed/src/emitters/answers.ts:91`.)" | § R1 (sites re-verified), § R5 (`refDate` measured clock-independent at faker 8.4.1), § R6 (carrier map) |
| REVIEW-SEED-02 | "The determinism contract dev-seed states in writing is true and is guarded: the same seed run against a faked system clock set months apart is **observed to differ** on the current code and **identical** after the fix, and a cross-time stability guard is committed. (The breach is proven real before it is proven fixed — the standing acceptance rule applied to a data pipeline.)" | § R3 (negative control BUILT AND RUN — drift pasted), § R4 (`vi.setSystemTime` mechanics measured), § R7 (post-fix simulation measured identical) |
| REVIEW-SEED-03 | "Built-in templates and filesystem templates behave identically, because `resolveTemplate()` runs both through `validateTemplate()` … (⚠ **Measured 2026-08-28 as already satisfied on the tree** … re-confirm before planning rather than planning work that no longer exists.)" | § R2a — **independently re-confirmed. Holds.** Remaining work = one regression test. |
| REVIEW-SEED-04 | "A `fixed[]` row without an `external_id` is rejected at validation time with a field path, instead of being seeded as `\"${prefix}undefined\"`, and a negative control shows the old schema accepting the bad row. (⚠ **Measured 2026-08-28 as already satisfied on the tree** … What genuinely remains is the negative control, not the guard.)" | § R2b — **independently re-confirmed. Holds.** Remaining work = negative control + regression test. |

Note the ROADMAP's own D-C3 comment items map to no `REVIEW-SEED-*` id (the triage files them under
Phase 154 but REQUIREMENTS routes the comment *class* to `REVIEW-HYG-02`). The plan should treat the
two D-C3 sites as discharging a **slice of `REVIEW-HYG-02`** carried out here by D-C3(a), and say so,
rather than inventing a fifth `REVIEW-SEED` id.

</phase_requirements>

---

## Summary

Everything the phase needs is measurable and was measured. The two wall-clock sites are exactly the
two the roadmap names; criteria 3 and 4 are genuinely already discharged at HEAD by Phase 144 and I
re-confirmed both independently by running the validator; `faker.date.future`/`date.recent` at the
version this repo actually resolves (8.4.1) both accept `refDate` and become byte-stable across a
faked clock; and `vi.setSystemTime` works in this suite with no configuration and no async hazard.

**The one thing CONTEXT.md gets wrong is worth reading before planning.** CONTEXT F7 asserts that "a
negative control run against `runPipeline({seed:42})` **or** against a built-in would show **no
difference**." The built-in half is right and I re-measured it across all 30 built-ins run the way
the CLI runs them (template + overrides): **none drift**. But `runPipeline({seed:42})` **does** drift
— because `{seed:42}` declares no `elections` fragment, `ElectionsGenerator.defaults(ctx)` supplies
`{ count: 1 }` (`ElectionsGenerator.ts:34-36`), the synthetic loop fires, and `election_date` moves
from `2026-10-09` to `2027-06-09` between the two clocks. That is the *existing*
`determinism.test.ts:21-23` fixture, silently drifting today. It changes nothing about the phase's
shape — a purpose-built template is still needed for the *date-answer* half — but it means the
elections half of the breach is provable against a fixture the suite already has.

**The negative control is built, run, and reproduced below with its actual output.** A 5-field
in-test template reaches both faker sites, passes `validateTemplate`, and produces different bytes at
two fake clocks eight months apart. A post-fix simulation (same template, `refDate` threaded through
both seams via the public `overrides` / `ctx.answerEmitter` hooks, no source file touched) produces
byte-identical output at the same two clocks. The proof the plan owes is therefore known to be
constructible, not hoped to be.

**Primary recommendation:** put `SEED_REF_DATE` (an ISO string) and a resolved `Ctx.refDate: Date`
next to the existing `faker.seed(template.seed ?? 42)` in `ctx.ts`, thread it into
`ElectionsGenerator.ts:58` via the existing `this.ctx` destructure and into `answers.ts:91` via a
third parameter on the already-private `emitValueFor(q, faker)`, mirror the new optional
`refDate?: string` in `types.ts:158` and `schema.ts:122` (inside the `.strict()` object), update
`tests/utils.ts`'s `makeCtx` literal, and put both halves of the two-clock proof in a new `describe`
block inside `tests/determinism.test.ts`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ref-date resolution (template value or `SEED_REF_DATE`) | Run-context factory (`src/ctx.ts` `buildCtx`) | — | Already the single seam that resolves `seed`, `projectId`, `externalIdPrefix` per run; D-C1 requires ONE resolved value, and this is the only place a per-run value can be resolved once. |
| Ref-date consumption for `election_date` | Generator (`src/generators/ElectionsGenerator.ts`) | — | It already destructures `this.ctx`; the row is emitted there. |
| Ref-date consumption for date answers | Emitter (`src/emitters/answers.ts`) | Latent emitter (`emitters/latent/project.ts`) delegates `date` here | `answers.ts:91` is the single `date` branch; `project.ts:114-126` routes `date` back into it, so there is one authority. |
| Template-field declaration (authoring authority) | `src/template/types.ts` | — | Mirrors `seed?: number` at `:158`. |
| Template-field declaration (runtime authority) | `src/template/schema.ts` | — | `.strict()` at `:164` makes a schema-side omission a hard failure for any template that sets the field. |
| Cross-time determinism proof | Unit suite (`tests/determinism.test.ts`) | — | D-C2 fixes the mechanism to vitest; `package.json:16` (`vitest run`) already wires it into `yarn test:unit`. |
| Comment hygiene (repo-wide) | Phase 152 | Phase 154 for exactly two sites | D-C3(a). |

---

## Findings

### R1 — The two wall-clock sites, re-verified verbatim

[VERIFIED: `packages/dev-seed/src/generators/ElectionsGenerator.ts:38-64`, read this session]

```ts
  generate(fragment: ElectionsFragment): Array<TablesInsert<'elections'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;          // :39
    ...
    const n = fragment.count ?? 0;                                     // :50
    for (let i = 0; i < n; i++) {                                      // :51
      rows.push({
        ...
        election_date: faker.date.future({ years: 1 }).toISOString().slice(0, 10),   // :58
```

[VERIFIED: `packages/dev-seed/src/emitters/answers.ts:77-91`, read this session]

```ts
function emitValueFor(q: TablesInsert<'questions'>, faker: Faker): unknown {   // :77
  const type = q.type as QuestionType;                                          // :78
  switch (type) {                                                               // :79
    ...
    case 'date':                                                                // :90
      return faker.date.recent().toISOString();                                 // :91
```

Call chain into `:91`: `CandidatesGenerator.generate` resolves `const emit = this.ctx.answerEmitter ??
defaultRandomValidEmit` (`CandidatesGenerator.ts:93`) and calls it per candidate (`:148`);
`runPipeline` pre-installs `ctx.answerEmitter ??= latentAnswerEmitter(template)` (`pipeline.ts:178`);
the latent emitter's `date` path lands on `defaultProject`'s shared fallback branch:

[VERIFIED: `packages/dev-seed/src/emitters/latent/project.ts:114-126`]

```ts
      case 'text':
      case 'multipleText':
      case 'number':
      case 'boolean':
      case 'date':                                                              // :118
      case 'image': {
        const fallback = defaultRandomValidEmit({} as TablesInsert<'candidates'>, [q], ctx);  // :123
```

So `answers.ts:91` is reached on **both** the plain and the latent path — the plan does not need to
suppress the latent emitter to hit it. (Measured: a probe candidate that DID resolve a party — the
latent path — still received a wall-clock date answer.)

No third live site: `grep -rn "faker\.date" packages/dev-seed/src` yields those two plus the
docstring at `answers.ts:52`. Confirms CONTEXT F1. [VERIFIED: grep this session]

### R2 — ⚠ Criteria 3 and 4: BOTH re-confirmed as already satisfied at HEAD

This is the question the orchestrator asked to be answered loudly. **The verdict is: both hold. Neither
needs implementing. Both need a committed test.**

#### R2a — Criterion 3 (built-in / filesystem validation parity) — **HOLDS**

[VERIFIED: `packages/dev-seed/src/cli/resolve-template.ts:80-85`, read in full this session]

```ts
  // Phase 144, D-07: validate here too, so every entry path — built-in,
  // path-loaded module and JSON — traverse the same two layers. Costs
  // microseconds per run; without it `.strict()` would never fire on `default`,
  // `e2e/base` or any `perm-*`.
  return validateTemplate(builtIn);                                             // :84
}
```

(The quoted comment is `:80-83`; the statement is `:84`. All three loader branches converge on
`validateTemplate`: `:57` → `loadJsonTemplate` → `:113`; `:59` → `loadModuleTemplate` → `:136`;
built-in → `:84`.)

**Behavioural confirmation, measured** — a built-in resolved *through `resolveTemplate`* with an
unknown top-level key is rejected by the same `.strict()` path a filesystem template hits:

```
PROBE-J: Template validation failed:
  template.: Unrecognized key: "bogusTopLevelKey"
```

and directly through the validator:

```
PROBE-H: Template validation failed:
  template.: Unrecognized key: "bogusTopLevelKey"
```

**Remaining work for criterion 3: one regression test.** Resolve a built-in name through
`resolveTemplate(name, builtIns)` where the injected built-in carries an unknown key, and assert the
throw. The existing `tests/cli/resolve-template.test.ts` is the home.

#### R2b — Criterion 4 (`fixed[]` rows require `external_id`) — **HOLDS**

[VERIFIED: `packages/dev-seed/src/template/schema.ts:194-208` and `:221-229`, read in full this session]

```ts
function assertFixedRowsCarryExternalId(parsed: z.infer<typeof TemplateSchema>): asserts parsed is Template {  // :194
  const problems: Array<string> = [];
  for (const [slot, value] of Object.entries(parsed)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;
    const { fixed } = value as { fixed?: unknown };
    if (!Array.isArray(fixed)) continue;
    fixed.forEach((row: unknown, index: number) => {
      const externalId = (row as Record<string, unknown> | null)?.external_id;
      if (typeof externalId !== 'string' || externalId === '') {                                              // :202
        problems.push(`  template.${slot}.fixed[${index}].external_id: Expected a non-empty string`);         // :203
      }
    });
  }
  if (problems.length > 0) throw new Error(`Template validation failed:\n${problems.join('\n')}`);            // :207
}

export function validateTemplate(input: unknown): Template {                                                  // :221
  const result = TemplateSchema.safeParse(input);                                                             // :222
  if (!result.success) { ... }
  assertFixedRowsCarryExternalId(result.data);                                                                // :227
  return result.data;                                                                                        // :228
}
```

The call at `:227` is unconditional on the success path. **Behavioural confirmation, measured** — both
the absent and the empty-string case:

```
PROBE-I (missing): Template validation failed:
  template.elections.fixed[0].external_id: Expected a non-empty string
PROBE-I (empty):   Template validation failed:
  template.elections.fixed[0].external_id: Expected a non-empty string
```

**Remaining work for criterion 4: the negative control the criterion explicitly demands, plus a
regression test.** The pre-144 `validateTemplate` body is exactly this function **minus the `:227`
call** — i.e. `TemplateSchema.safeParse(input)` alone. That makes the control trivially expressible
*in-test with no source archaeology*: assert `TemplateSchema.safeParse(badTemplate).success === true`
(the old behaviour — the bad row passes the zod layer) and
`expect(() => validateTemplate(badTemplate)).toThrow(/external_id: Expected a non-empty string/)`
(the current behaviour). Both authorities are already exported from `schema.ts` (`TemplateSchema` at
`:120`, `validateTemplate` at `:221`) and re-exported from the barrel, so no test-only export is
needed. **The plan should specify exactly this pair** — it is the cheapest honest negative control
available and it does not require reconstructing a historical file.

**Neither criterion is deleted.** The plan must state both as *retired on evidence, with the evidence
re-measured on 2026-08-28*, and must not claim to have fixed what Phase 144 fixed (CONTEXT O-2).

### R3 — ⚠ THE CENTRAL RISK: negative-control feasibility. **SOLVED AND MEASURED.**

#### R3.1 — Why a built-in is a false pass (re-measured, and widened)

CONTEXT F6/F7 said no built-in reaches either site. I re-measured that across **all 30 built-ins**,
run the way the CLI runs them (`runPipeline(template, BUILT_IN_OVERRIDES[name])`), at two fake clocks
eight months apart:

```
PROBE-N built-ins that DRIFT across clocks: NONE
PROBE-N built-ins checked: 30
```

and the cause:

```
PROBE-O e2e/base: elections.count=0 dateQuestions=[test-e2e-base-qu-info-date]
PROBE-O done
```

— i.e. exactly one built-in declares a `date`-typed question at all, and it carries a hardcoded
answer. [VERIFIED: `packages/dev-seed/src/templates/e2e/base.ts:753-761` declares
`external_id: 'test-e2e-base-qu-info-date', type: 'date'`; `:277` reads
`'test-e2e-base-qu-info-date': { value: '1980-06-15' },` inside `DEFAULT_INFO_ANSWERS`, merged by
`withInfoAnswers` at `:284-286`.] **A control against a built-in is a false pass. Confirmed.**

#### R3.2 — ⚠ CORRECTION TO CONTEXT F7: `runPipeline({seed:42})` DOES drift

CONTEXT F7 reads: "A negative control run against `runPipeline({seed:42})` or against a built-in would
show **no difference**". The `runPipeline({seed:42})` half is **wrong**, measured:

```
PROBE-K table 'elections' DIFFERS: @193: ..."election_date":"2026-10-09","is_generated":true  ||VS||  ..."election_date":"2027-06-09","is_generated":true
PROBE-K elections c1: [{"external_id":"seed_election_00", ... "election_date":"2026-10-09", ...}]
PROBE-K elections c2: [{"external_id":"seed_election_00", ... "election_date":"2027-06-09", ...}]
```

`elections` was the **only** table that differed. Cause: `{seed:42}` declares no `elections`
fragment, so `pipeline.ts:185` merges `gen.defaults(ctx)` — and
[VERIFIED: `ElectionsGenerator.ts:34-36`] `defaults(ctx)` returns `{ count: 1 }`. F7's reasoning
("`elections.count` is `0` in every built-in") is about built-ins; `{}` is not a built-in and
inherits the generator default instead.

**Consequence for the plan:** `tests/determinism.test.ts:20-24` ("same seed (42) produces
byte-identical output across two fresh runs") is green today only because both runs happen at the same
wall-clock instant. The elections half of the breach is live in an existing fixture. This does not
change the phase shape — the date-answer half still needs a purpose-built template — but the plan
should note it, because it is the strongest available statement of why the guard is needed.

#### R3.3 — The minimal in-test template that reaches BOTH sites (built and run)

```ts
const makeTemplate = (): Template => ({
  seed: 42,
  elections: { count: 1 },
  question_categories: { count: 1 },
  questions: { count: 0, fixed: [{ external_id: 'q_date', type: 'date', name: { en: 'When?' } }] },
  candidates: { count: 1 }
});
```

Measured properties:

- **It passes validation.** `expect(() => validateTemplate(t)).not.toThrow()` — green.
- **It reaches both sites.** At the real clock:

```
PROBE-A real clock: {
  "election_date": "2027-05-22",
  "election_extid": "seed_election_00",
  "dateAnswer": "2026-08-27T22:16:51.244Z",
  "answerKeys": ["seed_q_date"]
}
PROBE-A now: 2026-08-28T14:59:32.238Z
```

`election_date` ≈ 9 months in the future (`date.future({years:1})`), `dateAnswer` ≈ 16 h before now
(`date.recent()`, default `days: 1`). Both live.

What each field is load-bearing for:

| Field | Why it is needed |
|---|---|
| `elections: { count: 1 }` | Drives the `for (let i = 0; i < n; i++)` loop at `ElectionsGenerator.ts:51` that contains `:58`. **No parent, constituency group or fixed row is required** — measured: the generator emits a standalone row (`ElectionsGenerator.ts:52-63` references only `externalIdPrefix`/`projectId`). |
| `questions: { fixed: [{ type: 'date', … }] }` | Mandatory. The synthetic question rotation is `['singleChoiceOrdinal','boolean','singleChoiceCategorical','text']` [VERIFIED: `QuestionsGenerator.ts:80-85`, `PHASE_56_TYPE_ROTATION`] — it **never** emits a `date` question, so `count` alone cannot reach `answers.ts:91`. `count: 0` suppresses the synthetic rows so the output stays small. `external_id` is required by `assertFixedRowsCarryExternalId`. |
| `candidates: { count: 1 }` | The `date` answer is emitted per synthetic candidate (`CandidatesGenerator.ts:103-149`); `questionRows.length > 0` gates it at `:126`. Fixed candidate rows do NOT get answers (the `fixed` loop at `:82-88` is pass-through only) — so `count ≥ 1` is required, not a fixed row. |
| `question_categories: { count: 1 }` | **Not load-bearing for either faker site** [INFERRED — I did not re-run with it removed]. It only supplies the `category` ref at `QuestionsGenerator.ts:150-153`. Keep it or drop it; the plan should not treat it as required. |

**No hardcoded answer must exist for the date question** — that is the trap that neutralises
`e2e/base`. The template above declares no `candidates.fixed` and therefore no `answersByExternalId`
override.

**`buildMinimal` is NOT a usable base** for this control, and the CONTEXT/prompt path for it is wrong.
Measured path: `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` (not
`src/template/_helpers/…`). It IS importable — `packages/dev-seed/src/templates/_helpers/index.ts:8`
reads `export { buildMinimal } from './buildMinimal';` — but `:241` hardcodes
`election_date: '2026-06-15'` on a fixed row and `:407` sets `elections.count: 0`, i.e. it produces
exactly the false-pass shape. Its `defaultAnswerForQuestion` helper also pre-answers questions.
**Recommend a hand-written 5-line literal in the test file, not `buildMinimal`.**

#### R3.4 — THE DRIFT ITSELF, measured (this is the negative control)

Same template, same `seed: 42`, two fake system clocks eight months apart:

```
PROBE-B clock1 2026-01-15T00:00:00.000Z {"election_date":"2026-10-09","election_extid":"seed_election_00","dateAnswer":"2026-01-14T07:17:19.007Z","answerKeys":["seed_q_date"]}
PROBE-B clock2 2026-09-15T00:00:00.000Z {"election_date":"2027-06-09","election_extid":"seed_election_00","dateAnswer":"2026-09-14T07:17:19.007Z","answerKeys":["seed_q_date"]}
PROBE-B DIFFER? true
PROBE-B after useRealTimers, now = 2026-08-28T14:59:32.240Z
```

and at whole-pipeline granularity:

```
PROBE-D whole-output DIFFER? true
```

**Both sites drift, and both drift by exactly the clock delta:** `2026-10-09` → `2027-06-09` is
+8 months; `2026-01-14` → `2026-09-14` is +8 months. Note the **time-of-day is identical**
(`07:17:19.007` on both) — the seeded offset is stable; only the calendar base moves. That is a
useful assertion detail: the guard is about the base date, not about faker's draw sequence.

**Verdict: the control is buildable exactly as CONTEXT D-C2 specifies. The plan is not blocked.**

### R4 — `vi.setSystemTime` mechanics in THIS repo, measured

| Property | Measured value | Evidence |
|---|---|---|
| vitest version | **3.2.4** | `node_modules/vitest/package.json` `"version": "3.2.4"`; root catalog `vitest: ^3.2.4` (`.yarnrc.yml:8`); `packages/dev-seed/package.json:35` `"vitest": "catalog:"` |
| dev-seed vitest config | `packages/dev-seed/vitest.config.ts` is `export default {};` — an empty marker for the root workspace file. **No `setupFiles`, no `globals`, nothing to change.** | file read this session |
| `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime(d)` | **Works.** `new Date()` returns the faked instant, both faker sites move, the pipeline completes synchronously. | PROBE-B above |
| `vi.useFakeTimers()` with the **default** `toFake` set (fakes `setTimeout`/`setInterval`/etc.) | **Also works — it does NOT hang.** The dev-seed pipeline is fully synchronous (no timers, no promises inside `runPipeline`), so the default set is harmless here. | `PROBE-C full-fake result {"election_date":"2026-10-09", ...}` / `PROBE-C ok = yes` |
| `vi.useRealTimers()` teardown | **Restores immediately and completely.** `new Date().toISOString()` read right after returned the real `2026-08-28T14:59:32.240Z`. | PROBE-B trailing line |
| Repo precedent | **Zero.** `grep -rn "setSystemTime\|useFakeTimers"` across `packages/`, `apps/`, `tests/` → no hits (re-confirmed; the only hits during research were my own deleted probe). Greenfield, as CONTEXT records. | grep this session |

**Recommendation (Claude's discretion area O-6 / D-C2 mechanics):**

- Use **`vi.useFakeTimers({ toFake: ['Date'] })`**, not the bare default. Both work here, but `['Date']`
  is the minimum blast radius and states the intent in the call.
- Tear down with **`try { … } finally { vi.useRealTimers(); }` inside each test**, not a bare trailing
  call. A failing assertion inside the block must not leave the clock faked for the remaining 569
  tests. An `afterEach(() => vi.useRealTimers())` is an acceptable belt-and-braces addition but is not
  sufficient alone if the guard block is later copied into another file.
- The two dates used in the measurements above — `2026-01-15T00:00:00.000Z` and
  `2026-09-15T00:00:00.000Z` — satisfy "months apart" (8 months) and are recommended as the literals,
  since the drift they produce is already recorded here for cross-checking.
- **`vi` must be imported**: `import { describe, expect, it, vi } from 'vitest';`.
  `determinism.test.ts:14` currently imports `{ describe, expect, it }` — the plan must extend that
  import line.

### R5 — `faker.date.*` `refDate` semantics, measured

- **Version resolved for `@openvaa/dev-seed`: `@faker-js/faker` 8.4.1.** Catalog declares
  `'@faker-js/faker': ^8.4.1` (`.yarnrc.yml:21`); `packages/dev-seed/package.json:21` reads
  `"@faker-js/faker": "catalog:"`; `require.resolve` from the package directory resolves to the
  hoisted root `node_modules/@faker-js/faker/package.json`, `"version": "8.4.1"`. **There is no
  `packages/dev-seed/node_modules`.** [VERIFIED, all three commands run this session]
  ⚠ Note `ctx.ts:82-83` claims "the @faker-js/faker **v10** API surface we consume" — that comment is
  wrong at HEAD. Do not act on it; do not fix it either (out of scope, and it is Phase 152's comment
  class).
- **Both calls accept `refDate` at 8.4.1, and supplying it makes the result clock-independent:**

```
PROBE-E clock1 {"future":"2027-03-17","recent":"2026-10-31T04:52:58.482Z","recentDays":"2026-10-03T11:29:08.455Z"}
PROBE-E clock2 {"future":"2027-03-17","recent":"2026-10-31T04:52:58.482Z","recentDays":"2026-10-03T11:29:08.455Z"}
PROBE-E IDENTICAL? true
```

  measured with a fresh `new Faker({locale:[en]})` seeded to 42, calling
  `date.future({ years: 1, refDate })`, `date.recent({ refDate })` and `date.recent({ days: 30, refDate })`
  at the two clocks. All three byte-identical.
- **Emitted shapes are unchanged by adding `refDate`:** `ElectionsGenerator.ts:58` keeps
  `.toISOString().slice(0, 10)` → `YYYY-MM-DD` (measured `"2027-09-25"`); `answers.ts:91` keeps
  `.toISOString()` → full ISO (measured `"2026-12-31T18:27:30.005Z"`).
- **Do NOT also change `days` on `date.recent`.** The default is `days: 1`. Adding `refDate` alone is
  the minimal diff criterion 1 asks for; changing `days` changes emitted values for reasons no
  decision covers.

### R6 — The carrier for the resolved ref date

#### Current wiring, measured

[VERIFIED: `packages/dev-seed/src/ctx.ts:30-60` (the `Ctx` interface) and `:78-107` (`buildCtx`)]

```ts
export interface Ctx {          // :30
  faker: Faker;                 // :31
  projectId: string;            // :32
  externalIdPrefix: string;     // :33
  refs: { ... };                // :34-49
  logger: (msg: string) => void;   // :50
  answerEmitter?: AnswerEmitter;   // :51
  latent?: LatentHooks;            // :59
}

export function buildCtx(template: Template): Ctx {                 // :78
  const faker = new Faker({ locale: [en] });                        // :84
  faker.seed(template.seed ?? 42);                                  // :85
  return {
    faker,                                                          // :87
    projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001',   // :88
    externalIdPrefix: template.externalIdPrefix ?? 'seed_',                    // :89
```

Note the type is named **`Ctx`**, not `SeedCtx` (CONTEXT D-C1 says "SeedCtx"; the tree says `Ctx`).
It is defined in `src/ctx.ts` and re-exported type-only from `src/types.ts:12,14`.

How each site receives it:

- `ElectionsGenerator` gets the **whole ctx** at construction (`ElectionsGenerator.ts:30`
  `constructor(private ctx: Ctx) {}`) and destructures three fields at `:39`. Adding a fourth is a
  one-token edit.
- `answers.ts` — `defaultRandomValidEmit(_candidate, questions, ctx)` **has** the ctx (`:58-62`), but
  the switch lives in a private helper whose signature is **faker-only**:
  `emitValueFor(q, ctx.faker)` at `:67`, declared `function emitValueFor(q: …, faker: Faker)` at `:77`.

#### Recommended minimal-diff carrier

1. **`src/ctx.ts`** — add an exported const and a resolved field:
   - `export const SEED_REF_DATE = '2027-01-01T00:00:00.000Z';` (value rationale in R6.1)
   - `Ctx` gains `refDate: Date;` — **required, not optional**, so no consumer can silently fall back
     to the wall clock (that is precisely the class this phase closes). Making it optional would let a
     `ctx.refDate ?? undefined` reach faker and reinstate the bug.
   - `buildCtx` gains `refDate: new Date(template.refDate ?? SEED_REF_DATE),` alongside `:88-89`.
     Resolving to a `Date` once per run (rather than a string re-parsed per row) satisfies D-C1's "one
     *resolved* value" wording literally.
2. **`src/generators/ElectionsGenerator.ts`** — `:39` destructure gains `refDate`; `:58` becomes
   `faker.date.future({ years: 1, refDate }).toISOString().slice(0, 10)`.
3. **`src/emitters/answers.ts`** — `:67` becomes `emitValueFor(q, ctx.faker, ctx.refDate)`; `:77`
   signature gains `refDate: Date`; `:91` becomes `faker.date.recent({ refDate }).toISOString()`.
   A third parameter is a smaller diff than passing the whole `ctx` and leaves
   `emitNumberInDeclaredRange(q, faker)` (`:134`) untouched.
   ⚠ `project.ts:123` calls `defaultRandomValidEmit(…, ctx)` and therefore inherits the ref date with
   **no edit** — verified by reading the call.
4. **`src/template/types.ts:157-175`** — add `refDate?: string;` immediately after `seed?: number;`
   (`:158`), and document it in the "Top-level fields" block (add a bullet after the `seed` bullet at
   `:54-56`).
5. **`src/template/schema.ts:120-164`** — add `refDate: z.iso.datetime().optional(),` immediately
   after `seed: z.number().int().optional(),` (`:122`). This **must** happen: `TemplateSchema` closes
   with `.strict()` at `:164`, so any template setting an undeclared `refDate` fails validation —
   and since Phase 144 routed built-ins through `validateTemplate` too (R2a), that failure would hit
   the CLI, not just tests.
   **zod API, measured:** the tree's zod is **4.3.6**; `z.iso.datetime` is a function and
   `z.iso.datetime().optional()` accepts `'2027-01-01T00:00:00.000Z'` and rejects `'2027-01-01'` with
   `Invalid ISO datetime`. (`z.string().datetime()` also exists at 4.3.6 and works, but `z.iso.*` is
   the v4 spelling. Measured both.)
6. **`src/index.ts`** — export `SEED_REF_DATE` from the barrel (the file documents the public API and
   already lists `buildCtx`, `validateTemplate` etc. at `:16-19`; the export statements start around
   `:90`).
7. **`tests/utils.ts:18-43`** — `makeCtx(overrides: Partial<Ctx> = {}): Ctx` returns a **complete
   object literal** typed `Ctx`. A required `Ctx.refDate` makes this a **typecheck failure** unless
   the literal supplies it. This is the one mandatory test-file edit; see R8.

**Files that do NOT need changing** (checked, so the plan does not over-scope):

- `tests/templates/nominations-override.test.ts:111` builds a ctx and closes with `} as Ctx;` — an
  assertion, so a new required field does not break it. [VERIFIED: read this session]
- `tests/pipeline.test.ts:209` — `const customCtx: Ctx = { ...buildCtx({}), logger };` — spreads a
  real ctx. Safe.
- `src/assertKnownRowProps.ts:105-128` walks **pipeline output rows**, not the template, so a new
  top-level template field never reaches it. `permittedKeys` is row-level only. [VERIFIED: read]
- `src/cli/seed.ts` — applies `--seed` / `--external-id-prefix` onto the template (`:87-98`). **No
  `--ref-date` flag is required**: D-C1 fixes the override as *per-template*, not per-invocation.
  Adding a CLI flag would be scope creep.

#### R6.1 — Recommended literal value for `SEED_REF_DATE`

**Recommend `'2027-01-01T00:00:00.000Z'`.**

Measured consequences at that value:

```
PROBE-M future@ref: ["2027-05-17","2027-10-18","2027-12-14"]     # date.future({years:1, refDate})
PROBE-M recent@ref: ["2026-12-31T15:00:39.109Z","2026-12-31T04:52:58.482Z","2026-12-31T01:10:58.234Z"]
```

Why it satisfies option (d)'s rejection constraint ("must not make the demo show a past election
date"):

- Synthetic `election_date`s land in **2027**, i.e. future for well over a year from today.
- More decisively: **no built-in template emits a synthetic election at all** (measured, R3.1 — all 30
  built-ins have `elections.count: 0`). The demo's visible election date is the *hardcoded*
  `'2026-06-15'` on `default.ts:79`, not a faker draw. So the choice of `SEED_REF_DATE` has **zero
  user-visible impact on the Finnish demo today** — the past-date problem CONTEXT O-4 describes is
  entirely the hardcoded rows' and is not this phase's to fix. The plan should say this plainly rather
  than implying the const fixes the demo.
- A round `YYYY-01-01T00:00:00.000Z` anchor is legible in a diff and in a failing assertion.

⚠ **One honest wrinkle to record in the plan, not to fix:** the only `date`-typed question in the
whole repo is a **date of birth** (`e2e/base.ts:757`, `'[qu-info-date] Info: date of birth.'`).
`date.recent()` was already producing a nonsense "born yesterday" DOB before this phase; with a 2027
ref date it becomes a nonsense *future* DOB. It is not a regression in kind, and **it fires under no
built-in** (measured). Do not widen the phase to fix it; a one-line note in the todo filed for O-4 is
the right disposition.

If the planner prefers an anchor that is not in the future at all, `'2026-01-01T00:00:00.000Z'` is the
alternative — but it makes synthetic `election_date`s land in 2026, some of which are already past,
which is the exact condition option (d) was rejected for. **Not recommended.**

### R7 — POST-FIX SIMULATION: the composed fix is measured, not assumed

Rather than infer that "refDate at both seams ⇒ deterministic pipeline", I simulated the fix through
the package's **public** seams (an `overrides.elections` byte-copy of `ElectionsGenerator.generate`
with `refDate` added, plus a pre-installed `ctx.answerEmitter` whose `date` branch uses `refDate`) —
**no source file was modified**:

```
PROBE-L post-fix IDENTICAL? true
PROBE-L election_date: 2027-09-25
PROBE-L date answer: 2026-12-31T18:27:30.005Z
```

Same template, same seed, the same two clocks that produced PROBE-B's drift. **Byte-identical.**

[INFERRED, flagged] This proves the composition; it does not prove the *specific in-source edit* the
plan will write, because that edit does not exist yet. The plan's positive half must re-run the guard
against the real edited source. Nothing measured here suggests it will behave differently.

### R8 — Test-suite home and blast radius

#### Baseline (measured, `yarn workspace @openvaa/dev-seed test:unit`)

```
 Test Files  49 passed (49)
      Tests  569 passed (569)
   Duration  10.37s
```

`tests/integration/default-template.integration.test.ts` is **9.44 s of that 10.37 s** (its inner case
alone is 9.03 s). Wave planning should not treat the dev-seed suite as uniformly fast.

The plan should state the after-figure as **569 + N passing, 49 or 50 files**, where N is the number
of new cases and the file count rises only if the guard lands in a sibling file rather than in
`determinism.test.ts`.

#### Recommended home

**Extend `packages/dev-seed/tests/determinism.test.ts`** with a new
`describe('determinism across wall-clock time', …)` block below the existing
`describe('determinism (TMPL-08)')` (which spans `:19-109`). Rationale is D-C2's own: "the same test
file holds both the negative control (differs on old code) and the positive (identical after)". The
file is already the package's determinism authority and needs only one import-line change
(`:14`, add `vi`).

The criterion-3 and criterion-4 tests belong elsewhere: criterion 3 in
`tests/cli/resolve-template.test.ts` (it is the resolver's contract), criterion 4 in
`tests/template.test.ts` (it is the schema's).

#### Every existing test that could break — enumerated

| Test | Why it was checked | Verdict |
|---|---|---|
| `tests/determinism.test.ts:20-24` (`same seed (42) … byte-identical`) | Uses `runPipeline({seed:42})`, which R3.2 shows drifts across clocks | **Stays green.** It compares two runs at the *same* instant. After the fix it becomes green for a stronger reason. |
| `tests/determinism.test.ts:26-30`, `:32-38`, `:63-80`, `:82-94`, `:96-109` | Same-instant comparisons and locale-key assertions | **Stay green.** None reads a date value. |
| `tests/generators/ElectionsGenerator.test.ts` (read in full, 66 lines) | The generator whose line changes | **Stays green.** Asserts only length (`:23`), `external_id` prefix (`:29`, `:39`), `fixed[]` pass-through (`:46`), run-to-run equality (`:52`), `project_id` (`:58`) and sentinel absence (`:64`). **No assertion touches `election_date`.** |
| `tests/latent/project.test.ts:200-204` (`date → ISO string`) | Asserts the `date` branch's output | **Stays green.** Asserts `typeof … === 'string'` and that `new Date(v).toISOString()` does not throw. A `refDate`-derived ISO string satisfies both. |
| `tests/emitters/answers.test.ts` | The emitter file being changed | **Stays green.** It has no `date` case at all — only `defaultRandomValidEmit — number answers respect the declared range` (`:76`) and the fallback-span case (`:94`). |
| `tests/assertKnownRowProps.test.ts:81` | Mentions `election_date` | **Stays green.** Asserts the string appears in an error *message* about permitted keys — a key name, not a value. |
| `tests/template/permittedKeys.test.ts:170` | Mentions `election_date` | **Stays green.** `expect(permittedKeys('candidates').has('election_date')).toBe(false)` — key-set membership. |
| `tests/templates/default.test.ts:198` | Asserts a literal timestamp | **Stays green.** It pins `terms_of_use_accepted === '2025-01-01T00:00:00.000Z'` — a hand-authored template literal, untouched by faker. |
| `tests/utils.ts:18-43` (`makeCtx`) | Returns a complete `Ctx` literal | **⚠ BREAKS TYPECHECK** if `Ctx.refDate` is required and this literal does not supply it. **This is the one mandatory test edit.** Add `refDate: new Date(SEED_REF_DATE),` (or accept `overrides.refDate`). This is a `tsc --noEmit` failure, not a vitest failure — `yarn workspace @openvaa/dev-seed typecheck` (`package.json:15`) is what catches it, and it is wired into root `lint:check` via `turbo run typecheck` (root `package.json:35-36`). |
| Snapshot / golden files | Would encode dates | **None exist.** `find packages/dev-seed -name "__snapshots__" -o -name "*.snap"` returns nothing. [VERIFIED this session] |
| All 30 built-in template outputs | Would change if the fix altered emitted rows | **Unchanged.** Every built-in sets `elections.count: 0` and pre-answers its one date question, so neither modified line executes for any of them (measured, R3.1). **The fix changes no built-in's output.** This is a strong, cheap assertion for the plan to make and for the verifier to re-check. |

#### E2E blast radius

**Zero, inferred with high confidence.** The E2E datasets are seeded from built-in templates
(`e2e/base`, `perm-*`), and no built-in reaches either modified line (measured across all 30 with
their CLI overrides). The plan should still run the full E2E suite at the phase gate per CLAUDE.md's
cardinal rule, but should not budget for E2E churn.

### R9 — The two D-C3 comment sites, quoted verbatim

**Site 1 — `packages/dev-seed/src/template/types.ts:113-121`** (the stub is `:118`, continuing
`:119-120`). Verbatim, with surrounding lines:

```
 * ## Further reading                                                     :113
 *                                                                        :114
 * - `packages/dev-seed/README.md` — worked authoring example (see phase 58 DX-01).   :115
 *   schema-extension pattern; override signature.                        :116
 * - `./permittedKeys.ts` — the four permitted-key sources and the row types.   :117
 * - — latent                                                             :118
 *   block semantics (`dimensions`, `eigenvalues`, `centroids`, `spread`,  :119
 *   `loadings`, `noise`).                                                 :120
 */                                                                        :121
```

CONTEXT F8 is **confirmed**: `:118` is the incomplete bullet. For completeness, `:77` reads
``* - `latent: LatentConfig` — see phase 57 latent-factor answer model`` — a *planning-reference*
comment, Phase 152's class, **not** this phase's. **Edit `:118`. Leave `:77`.**

Reviewer's offer (both acceptable per Claude's Discretion): "Point it at the latent emitter docs (or
remove the bullet)." If completing it, the correct target is
`./schema.ts`'s `latentBlock` (`schema.ts:75-100`) or `../emitters/latent/latentEmitter.ts`.
⚠ Note `:115` also carries `(see phase 58 DX-01)` — that is 152's class, **do not** fold it in.

**Site 2 — `packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts:44-51`.** Verbatim:

```
    header: { showFeedback: true },                                                    :44
    // NB: showFeedbackPopup / showSurveyPopup are countdown delays in SECONDS         :45
    // (appContext.svelte.ts:414-437 schedule `setTimeout(…, delay * 1000)`), NOT      :46
    // milliseconds. The prior 180 / 500 values were 3 min / ~8 min — the popups       :47
    // never surfaced inside the test window (see phase 120 trace-confirmed; see       :48
    // ). A 1-second delay is the type-correct "small                                  :49
    // positive delay" the popup needs to enqueue promptly on /results.                :50
    results: { showSurveyPopup: 1, showFeedbackPopup: 1 },                             :51
```

The dangling fragment spans `:48-49` (`…trace-confirmed; see` / `// ).`). CONTEXT cites `:48-49`;
confirmed exactly. Reviewer: "better to remove the stub so the rationale reads cleanly."

**D-N1 constraint on the replacement text.** The rewritten comment must not contain
`see phase 120`, any planning path, any decision id, or any phase/plan number. A compliant rewrite is
a single sentence explaining the units and the value, e.g.:

```
    // showFeedbackPopup / showSurveyPopup are countdown delays in SECONDS —
    // appContext.svelte.ts:414-437 schedules setTimeout(…, delay * 1000). A
    // 1-second delay is the smallest type-correct value that lets the popup
    // enqueue promptly on /results.
```

(Illustrative only; the plan owns the final wording. Note it also drops the "prior 180 / 500 values"
historical narrative, which D-N1 forbids.)

**Phase-ordering caveat (D-C3):** Phase 152 runs first. If 152 has already rewritten either site by
the time 154 executes, 154's obligation is **discharged** and the executor should record that rather
than re-edit. The plan should carry that conditional explicitly.

### R10 — O-4 disposition input: the hardcoded `election_date` sites

**22 sites** (CONTEXT said "20+"; the exact figure is 22), **all** under
`packages/dev-seed/src/templates/**`, all the literal `election_date: '2026-06-15',`
[VERIFIED: `grep -rn "election_date: '2026-06-15'" packages/dev-seed/src` this session]:

```
packages/dev-seed/src/templates/default.ts:79
packages/dev-seed/src/templates/_helpers/buildMinimal.ts:241
packages/dev-seed/src/templates/e2e/base.ts:418
packages/dev-seed/src/templates/e2e/base.ts:430
packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts:50
packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts:62
packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts:82
packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts:44
packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts:56
packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts:49
packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts:61
packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts:121
packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts:49
packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts:61
packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts:78
packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts:90
packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts:50
packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts:62
packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts:40
packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts:52
packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts:81
packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts:55
```

**Todo filing convention** [VERIFIED: `ls .planning/todos/pending/` → 89 files; format read from
`2026-08-12-data-filters-unit-tests-not-in-ci.md`]:

- Filename: `YYYY-MM-DD-<kebab-slug>.md`
- Frontmatter keys, in this order: `created`, `source`, `resolves_phase`, `severity`, `area`
- Body: an H1 title, then narrative sections (`## The hole`, `## Why it was not fixed in-phase` …)

Proposed file: `.planning/todos/pending/2026-08-28-dev-seed-hardcoded-election-date-is-in-the-past.md`
with `created: 2026-08-28`, `source: Phase 154 (CONTEXT O-4)`, `resolves_phase: null`,
`severity: low`, `area: packages/dev-seed templates`. The body should carry the 22-site list above and
should note the E2E coupling: several perm specs may assert against the date, so a refresh is a real
change, not a find-and-replace. **Not blocking.**

### R11 — Docs that must move with the code

| Doc | Current text | Verdict |
|---|---|---|
| `packages/dev-seed/src/emitters/answers.ts:52` | ``*  - `date` — `faker.date.recent().toISOString()`.`` | **MUST CHANGE.** It names the exact call being changed. Rewrite to name the ref-date form. |
| `packages/dev-seed/src/template/types.ts:54-56` | "`seed: number` — fixed faker RNG seed for deterministic output. Default 42 (via `buildCtx`). Setting this guarantees byte-identical rows across runs at the same seed (NF-04)." | **BECOMES TRUE; SHOULD BE EXTENDED.** The claim is currently false across days. Add the sibling `refDate` bullet here (and note the `SEED_REF_DATE` default), which is the same edit the new template field needs anyway. |
| `packages/dev-seed/README.md:46` | `` | `--seed <integer>` | number | from template | Faker RNG seed override (determinism) | `` | **Already true post-fix. No edit required.** It describes the flag, not a date call. |
| `packages/dev-seed/README.md:86` | "- Seed `42` (deterministic — same run produces byte-identical rows)" | **Already true post-fix. No edit required** — "same run" is a same-instant claim, which held even before. |
| `packages/dev-seed/README.md:133` | "  seed: 100, // deterministic — same seed = same rows" | **Already true post-fix. No edit required.** |
| `packages/dev-seed/README.md:247` | "- `seed: number` — deterministic RNG seed (NF-04)." | **No edit required to this line**, but the "Key top-level fields" list it heads (`:246-256`) **MUST GAIN** a `refDate` bullet, mirroring `types.ts`. |
| `packages/dev-seed/src/cli/resolve-template.ts:19-29`, `:80-84`; `schema.ts:166-192`; `ctx.ts:5-6` | Planning-reference comments | **DO NOT TOUCH.** Phase 152's class (CONTEXT O-3). Note `resolve-template.ts:19-29` is explicitly named in D-N1 as the style this phase must not *add* — that is a prohibition on new comments, not a licence to rewrite existing ones. |
| `packages/dev-seed/src/ctx.ts:82-83` | "the @faker-js/faker **v10** API surface we consume" | **FACTUALLY WRONG** (the tree resolves 8.4.1) but **out of scope** — it is a planning-reference-adjacent comment and no criterion covers it. If the planner touches `ctx.ts:84-85` anyway, correcting "v10" to "v8" is a one-word, zero-risk truth repair; flag it as optional, not required. |

---

## Standard Stack

No new dependencies. Everything the phase needs is already resolved in this workspace.

### Core

| Library | Version | Purpose | Why standard |
|---------|---------|---------|--------------|
| `@faker-js/faker` | **8.4.1** (catalog `^8.4.1`, hoisted to root `node_modules`) | `date.future({ years, refDate })` / `date.recent({ refDate })` | Already the package's only RNG source; `refDate` is the mechanism the PR reviewer himself proposed ("Use a fixed `refDate`"). [VERIFIED: `node_modules/@faker-js/faker/package.json`, `.yarnrc.yml:21`, `packages/dev-seed/package.json:21`] |
| `vitest` | **3.2.4** (catalog `^3.2.4`) | `vi.useFakeTimers` / `vi.setSystemTime` / `vi.useRealTimers` | Fixed by D-C2; already the package's test runner via `package.json:16` (`vitest run`). [VERIFIED: `node_modules/vitest/package.json`, `.yarnrc.yml:8`] |
| `zod` | **4.3.6** (catalog `^4.3.6`) | `z.iso.datetime().optional()` for the new template field | Already `TemplateSchema`'s validator; `.strict()` at `schema.ts:164` makes the schema edit mandatory. [VERIFIED: `node_modules/zod/package.json` — measured `zod version: 4.3.6`] |

### Alternatives considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| `refDate` on both faker calls | `faker.date.between({ from, to })` | The reviewer offered it ("or a fixed between-range"), but it changes the *distribution*, not just the anchor, and would break the run-to-run byte equality the existing determinism tests pin at the same instant. `refDate` is the strictly smaller diff. **Not recommended.** |
| `vi.useFakeTimers({ toFake: ['Date'] })` | `vi.useFakeTimers()` (default set) | Both measured working (PROBE-B / PROBE-C). `['Date']` is the minimum blast radius. |
| `z.iso.datetime()` | `z.string().datetime()` | Both measured working at 4.3.6. `z.iso.*` is the v4 spelling; `z.string().datetime()` is the v3 carry-over. |
| `Ctx.refDate: Date` (required) | `Ctx.refDate?: Date` (optional) | Optional reinstates a wall-clock fallback path — the exact defect class this phase closes. **Required is the right call**, at the price of one `tests/utils.ts` edit. |

**Installation:** none.

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** Every library it touches is already a
declared dependency of `packages/dev-seed` (`package.json:20-36`) resolved through the root catalog.
No `npm install` / `yarn add` step is expected in any plan. If a plan proposes one, that is scope
creep and should be rejected.

---

## Architecture Patterns

### Data flow through the two changed seams

```
                     Template (validated by validateTemplate)
                       │  seed?: number      refDate?: string   ← NEW, mirrored in
                       │                                          types.ts:158 + schema.ts:122
                       ▼
              buildCtx(template)            [src/ctx.ts:78-107]
                 ├── faker = new Faker(...)          :84
                 ├── faker.seed(template.seed ?? 42) :85
                 └── refDate = new Date(template.refDate ?? SEED_REF_DATE)   ← NEW, ONE resolution
                       │
                       ▼
                   Ctx  { faker, refDate, projectId, externalIdPrefix, refs, ... }
                       │
        ┌──────────────┴───────────────────────────────┐
        ▼                                              ▼
 ElectionsGenerator                            CandidatesGenerator
 (ctx captured at ctor, :30)                   (ctx captured at ctor, :65)
   destructure {faker, refDate}  :39             emit = ctx.answerEmitter ?? default  :93
   for i in 0..count-1           :51             for each synthetic candidate         :103
     election_date =                               emit(cand, questionRows, ctx)      :148
       faker.date.future(                             │
         {years:1, refDate})    :58                   ├── latentAnswerEmitter (installed
       .toISOString().slice(0,10)                     │   by pipeline.ts:178)
                                                      │     partyIdx < 0 ─► defaultRandomValidEmit
                                                      │     partyIdx ≥ 0 ─► defaultProject
                                                      │                       case 'date': ──┐
                                                      │                       [project.ts:118]│
                                                      └── defaultRandomValidEmit ◄────────────┘
                                                            emitValueFor(q, ctx.faker, ctx.refDate)  :67
                                                              case 'date':                            :90
                                                                faker.date.recent({refDate})
                                                                  .toISOString()                      :91
```

Both branches of the answer path converge on the **one** `case 'date':` at `answers.ts:91`. There is
no second date authority to keep in sync.

### Pattern 1 — Resolve-once at the ctx seam

**What:** any per-run value that must be identical at every consumption site is resolved exactly once
in `buildCtx` and read off `Ctx`, never re-derived from the template downstream.
**When:** for `refDate`, mandated by D-C1 ("it must be a *resolved* value, not a re-read of the
template at each site").
**Existing precedent in-tree:** `projectId` (`ctx.ts:88`) and `externalIdPrefix` (`:89`) already work
exactly this way, and `seed` (`:85`) is resolved into faker's internal state rather than carried.

```ts
// Source: packages/dev-seed/src/ctx.ts:84-89 (existing shape; the refDate line is the addition)
const faker = new Faker({ locale: [en] });
faker.seed(template.seed ?? 42);
return {
  faker,
  refDate: new Date(template.refDate ?? SEED_REF_DATE),   // ← NEW
  projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001',
  externalIdPrefix: template.externalIdPrefix ?? 'seed_',
```

### Pattern 2 — Two-authority mirroring for a template field

**What:** every top-level template field is declared **twice** — in `Template` (`types.ts`, the
authoring authority) and in `TemplateSchema` (`schema.ts`, the runtime authority) — and the schema
object is `.strict()`.
**Why it is non-optional here:** `schema.ts:164` closes `TemplateSchema` with `.strict()`, and since
Phase 144 routed built-ins through `validateTemplate` (R2a), a schema-side omission would make the
CLI reject any template that sets `refDate`, not merely a test.

```ts
// types.ts:157-159 shape
export type Template = {
  seed?: number;
  refDate?: string;      // ← NEW, immediately after seed
  ...

// schema.ts:120-124 shape
export const TemplateSchema = z
  .object({
    seed: z.number().int().optional(),
    refDate: z.iso.datetime().optional(),    // ← NEW, immediately after seed
    ...
  })
  ... .strict();          // :164
```

### Pattern 3 — Two-clock guard with scoped teardown

```ts
// Recommended shape for tests/determinism.test.ts
const CLOCK_A = new Date('2026-01-15T00:00:00.000Z');
const CLOCK_B = new Date('2026-09-15T00:00:00.000Z');

it('the same seed produces identical rows at two system clocks eight months apart', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    vi.setSystemTime(CLOCK_A);
    const a = JSON.stringify(runPipeline(makeDateReachingTemplate()));
    vi.setSystemTime(CLOCK_B);
    const b = JSON.stringify(runPipeline(makeDateReachingTemplate()));
    expect(a).toEqual(b);
  } finally {
    vi.useRealTimers();
  }
});
```

Note `makeDateReachingTemplate()` must be a **factory**, not a shared object — `determinism.test.ts:52-61`
already records why (generators mutate `fixed[]` arrays in place, so sharing a template across two
`runPipeline` calls leaks state into the second).

### Anti-patterns to avoid

- **Running the two-clock control against a built-in or against `runPipeline({})`.** A built-in
  produces identical output at both clocks (measured) and reads as "no breach" — a vacuous proof.
  `runPipeline({seed:42})` drifts, but only in `election_date`; using it alone would silently leave
  the date-answer half unproven.
- **Making `Ctx.refDate` optional.** `ctx.refDate ?? undefined` reaching `faker.date.recent()`
  reinstates the wall clock through a nullish operator — the identical defect shape Phase 155's
  criterion 2 is about, in a different file.
- **Adding the template field to `types.ts` but not `schema.ts`.** `.strict()` at `schema.ts:164`
  turns that omission into a CLI-level rejection of any template that sets it.
- **Changing `date.recent`'s `days` while adding `refDate`.** Widens the diff beyond criterion 1 and
  changes emitted values for reasons no decision covers.
- **Writing a comment that names a phase, plan, decision id or planning path.** D-N1 puts this phase
  under Phase 152's committed scan.
- **"Fixing" the hardcoded `2026-06-15` rows.** CONTEXT O-4 routes that to a todo, not to this phase.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Faking the system clock | A module-level `Date` monkey-patch, a `globalThis.Date = …` shim, or a `Date.now` spy | `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime()` + `vi.useRealTimers()` | Fixed by D-C2. Measured working with no config. A hand-rolled patch does not restore cleanly on assertion failure and leaks into the other 569 tests. |
| Pinning a generated date | Post-processing rows to overwrite `election_date`, or a `Math.random` shim | faker's own `refDate` option | Measured clock-independent at 8.4.1 for both calls. Post-processing would leave the underlying non-determinism live and only mask it in one code path. |
| Reconstructing the pre-144 schema for the criterion-4 negative control | Checking out an old commit, vendoring the old `validateTemplate`, or a git-archaeology fixture | `TemplateSchema.safeParse(bad).success === true` vs `expect(() => validateTemplate(bad)).toThrow(…)` | The pre-144 body *is* `safeParse` alone (R2b). Both symbols are already exported. Zero archaeology, and the control is a live executable statement rather than a historical claim. |
| A minimal template for the control | `buildMinimal()` from `templates/_helpers` | A 5-field literal in the test file | `buildMinimal` hardcodes `election_date` (`:241`) and sets `elections.count: 0` (`:407`) — it produces exactly the false-pass shape. |
| Validating an ISO date string | A regex, or `!isNaN(Date.parse(x))` | `z.iso.datetime()` (zod 4.3.6, measured) | The schema is already the runtime authority; a second parallel validator is the "two authorities that can drift" shape `schema.ts:47-56` explicitly warns against. |

**Key insight:** every mechanism this phase needs already exists in the tree or in a resolved
dependency. The phase's difficulty is not implementation — it is *proving* the breach against a
codebase whose entire built-in corpus is accidentally immune to it.

---

## Runtime State Inventory

Not applicable — this is not a rename, refactor or migration phase. It changes two expressions, adds
one optional template field, and adds tests. No stored data, live service config, OS-registered state,
secret or build artifact carries a value this phase renames.

For completeness, since dev-seed *writes* to a database: the changed lines produce values only for
templates that no built-in matches (measured, R3.1), so **no already-seeded local or CI database holds
a row this phase changes the generation of.** No data migration is owed.

---

## Common Pitfalls

### Pitfall 1: The vacuous negative control

**What goes wrong:** the control is run against `default`, `e2e/base` or a `perm-*` template, produces
identical output at both clocks, and is read as "no breach found — criterion already satisfied."
**Why it happens:** every built-in sets `elections.count: 0` and pre-answers its single `date`
question, so neither faker line executes. Measured across all 30.
**How to avoid:** the control MUST use the purpose-built template in R3.3. The plan should include a
**meta-assertion** — assert that the control template's output actually *contains* a non-empty
`election_date` and a `seed_q_date` answer — so a future refactor that stops reaching the sites
reddens the guard instead of silently making it vacuous.
**Warning signs:** the control's "differs" assertion passes trivially; the emitted `elections` array
is empty; `answersByExternalId` has no date key.

### Pitfall 2: Leaked fake timers

**What goes wrong:** an assertion inside a `useFakeTimers` block throws, `useRealTimers` never runs,
and every subsequent test in the file (and, depending on isolation, the run) sees a frozen clock.
**Why it happens:** vitest does not auto-restore timers between tests unless configured to.
**How to avoid:** `try { … } finally { vi.useRealTimers(); }` inside each test. Measured: teardown
restores the real clock immediately.
**Warning signs:** later tests fail with impossible timestamps; the failure moves when tests are
reordered.

### Pitfall 3: Template shared by reference across the two `runPipeline` calls

**What goes wrong:** the second run's output differs from the first for reasons unrelated to the
clock, and the guard reports a false positive.
**Why it happens:** generators mutate `fixed[]` arrays in place — already documented in-tree at
`determinism.test.ts:52-61`.
**How to avoid:** a `makeTemplate()` factory per call, matching the existing convention in that file.
**Warning signs:** the "identical" assertion fails on the post-fix run with a diff in a table that has
nothing to do with dates.

### Pitfall 4: The schema/type mirror is half-done

**What goes wrong:** `refDate` is added to `Template` but not `TemplateSchema`; a template that sets it
fails at CLI seed time with `Template validation failed: template.: Unrecognized key: "refDate"`.
**Why it happens:** `.strict()` at `schema.ts:164`, plus Phase 144 having routed built-ins through the
validator (R2a) so the failure now reaches production paths, not just tests.
**How to avoid:** treat `types.ts:158` and `schema.ts:122` as one edit. Add a test that sets `refDate`
on a template and validates it.
**Warning signs:** typecheck passes, unit tests pass, `yarn db:seed` fails.

### Pitfall 5: `tests/utils.ts` typecheck breakage read as unrelated

**What goes wrong:** `yarn test:unit` is green but `yarn lint:check` fails, and the failure surfaces as
a typecheck error in a *test utility* rather than in the changed source.
**Why it happens:** `makeCtx` (`tests/utils.ts:18-43`) returns a complete `Ctx` object literal; a new
required field breaks it, and `tsc --noEmit` is what catches it, not vitest.
**How to avoid:** edit `tests/utils.ts` in the same task as `ctx.ts`. Run
`yarn workspace @openvaa/dev-seed typecheck` per task, not only `test:unit`.
**Warning signs:** green tests, red `lint:check`.

### Pitfall 6: Re-implementing what Phase 144 already shipped

**What goes wrong:** the phase writes a `validateTemplate` call into `resolveTemplate` that is already
there, or an `external_id` check that duplicates `assertFixedRowsCarryExternalId`.
**Why it happens:** the roadmap lists criteria 3 and 4 as work, and the source PR comments describe
them as open.
**How to avoid:** R2a/R2b. Both are re-confirmed as satisfied. The plans for criteria 3 and 4 must be
**test-only**, and the phase's write-up must not claim to have fixed either.
**Warning signs:** a plan task whose action edits `resolve-template.ts` or `schema.ts` behaviour.

---

## Code Examples

### The control template (measured working — R3.3)

```ts
// Source: measured in-tree this session; validates and reaches both faker sites.
const makeDateReachingTemplate = (): Template => ({
  seed: 42,
  elections: { count: 1 },
  questions: { count: 0, fixed: [{ external_id: 'q_date', type: 'date', name: { en: 'When?' } }] },
  candidates: { count: 1 }
});
```

### Reading both drifting values out of the pipeline output (measured)

```ts
// Source: the probe used to produce PROBE-A/B/K above.
const rows = runPipeline(makeDateReachingTemplate());
const electionDate = (rows.elections[0] as { election_date: string }).election_date;   // "2027-05-22"
const answers = (rows.candidates[0] as {
  answersByExternalId: Record<string, { value: unknown }>;
}).answersByExternalId;
const dateAnswer = answers['seed_q_date'].value;                                      // "2026-08-27T22:16:51.244Z"
```

Note the `seed_` prefix on the answer key: `ctx.externalIdPrefix` defaults to `'seed_'`
(`ctx.ts:89`) and `QuestionsGenerator.ts:103` prefixes the fixed row's `external_id`.

### The criterion-4 negative control (both authorities already exported)

```ts
// Source: schema.ts:120 (TemplateSchema) and :221 (validateTemplate), both exported.
const badRow = { elections: { count: 0, fixed: [{ name: { en: 'x' } }] } };

// pre-144 behaviour: the zod layer alone ACCEPTS the row
expect(TemplateSchema.safeParse(badRow).success).toBe(true);

// current behaviour: validateTemplate REJECTS it with a field path
expect(() => validateTemplate(badRow)).toThrow(
  /template\.elections\.fixed\[0\]\.external_id: Expected a non-empty string/
);
```

Measured message (both the absent and the empty-string case produce it verbatim):

```
Template validation failed:
  template.elections.fixed[0].external_id: Expected a non-empty string
```

### The criterion-3 regression test

```ts
// Source: resolve-template.ts:53 signature + :84 validate call, both read this session.
const injected = { ...BUILT_IN_TEMPLATES['default'], bogusTopLevelKey: 1 } as Template;
await expect(resolveTemplate('default', { default: injected })).rejects.toThrow(
  /Unrecognized key: "bogusTopLevelKey"/
);
```

Measured throw (via `resolveTemplate`, PROBE-J):

```
Template validation failed:
  template.: Unrecognized key: "bogusTopLevelKey"
```

`resolveTemplate` is `async`, so `rejects` (not a sync `toThrow`) is required.

---

## State of the Art

| Old approach | Current approach | When changed | Impact on this phase |
|---|---|---|---|
| `resolveTemplate` returned built-ins with a bare `return builtIn;` | `return validateTemplate(builtIn);` | Phase 144 (D-07) | Criterion 3 is already met. Also raises the stakes on the `schema.ts` half of the new template field (Pitfall 4). |
| `validateTemplate` was `safeParse` alone; `fixed[]` rows without `external_id` passed | `assertFixedRowsCarryExternalId` called unconditionally at `:227` | Phase 144 | Criterion 4 is already met — and the *old* body is exactly today's `TemplateSchema.safeParse`, which makes the required negative control a two-line test. |
| `TemplateSchema` was non-strict | `.strict()` on both `TemplateSchema` (`:164`) and `perEntityFragment` (`:59`) | Phase 144 (D-04) | A new template field MUST be schema-declared. |
| zod v3 `z.string().datetime()` | zod v4 `z.iso.datetime()` | zod 4.x (tree is at 4.3.6) | Both work here (measured); prefer `z.iso.*`. |

**Stale in-tree claim, flagged not fixed:** `ctx.ts:82-83` says the package consumes "the
@faker-js/faker **v10** API surface". The resolved version is **8.4.1**. Do not build on that comment.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | `question_categories: { count: 1 }` is not load-bearing for reaching either faker site — I included it in the measured template but did not re-run with it removed. | R3.3 | None material. If it *is* needed, the template already has it. |
| A2 | The specific in-source edit (as opposed to the public-seam simulation) will produce byte-identical output at two clocks. Simulated and measured identical via `overrides` + `ctx.answerEmitter`; the real edit does not exist yet. | R7 | Low. The plan's positive half re-runs the guard against real source, so a surprise would surface immediately rather than propagate. |
| A3 | E2E blast radius is zero. Inferred from the measured fact that no built-in reaches either line; not proven by running the E2E suite. | R8 | Low, and the phase gate runs the full E2E suite regardless per CLAUDE.md's cardinal rule. |
| A4 | `SEED_REF_DATE = '2027-01-01T00:00:00.000Z'` is the right literal. The *constraint* (must not show a past election date) is from CONTEXT; the *value* is my recommendation under Claude's Discretion. | R6.1 | Low — reversible, additive, and invisible under every built-in. |
| A5 | The D-C3 site-2 replacement wording sketched in R9 satisfies Phase 152's not-yet-written scan. The scan does not exist in the tree yet (`grep` for a comment-scan script in `package.json` / `scripts` / `.github/workflows` returns nothing), so compliance is judged against D-N1's stated rules, not against a runnable checker. | R9 | Medium — if 152 lands a stricter scan, 154's comments may need a touch-up. Mitigation: keep the new comments to one mechanical sentence each. |

---

## Open Questions

1. **Does `SEED_REF_DATE` want a companion `--ref-date` CLI flag?**
   - What we know: `cli/seed.ts:87-98` applies `--seed` and `--external-id-prefix` onto the template
     before `buildCtx`. A `--ref-date` flag would be a symmetric addition.
   - What's unclear: D-C1 fixes the override as *per-template* and says nothing about the CLI.
   - Recommendation: **do not add it.** Out of decision scope; adding it invites a `--ref-date` that
     re-introduces per-invocation non-determinism, which is the opposite of the phase's goal.

2. **Should the `types.ts:118` bullet be completed or deleted?**
   - What we know: the reviewer explicitly offered both, and CONTEXT lists this under Claude's
     Discretion.
   - What's unclear: whether a "latent emitter docs" target exists that is stable enough to cite.
     `emitters/latent/latentEmitter.ts` and `schema.ts:75-100` (`latentBlock`) are both plausible.
   - Recommendation: **complete it**, pointing at `../emitters/latent/latentEmitter.ts`, because the
     two neighbouring bullets (`:115`, `:117`) are both file pointers and a deletion leaves an
     asymmetric list. Deleting is also acceptable and cheaper.

3. **Does `154-DISCUSSION-LOG.md` already discharge CONTEXT O-1?**
   - What we know: `.planning/phases/154-dev-seed-determinism-template-validation/` contains both
     `154-CONTEXT.md` and `154-DISCUSSION-LOG.md` [VERIFIED: `ls` this session]. CONTEXT O-1 says the
     log "has **not** been written."
   - What's unclear: whether the file present is the D-N3(a) pointer or a stub.
   - Recommendation: the planner should read it once and, if it is the pointer, mark O-1 closed rather
     than carrying it forward. Not blocking.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js + yarn 4 workspaces | running the dev-seed unit suite | ✓ | (suite ran, 569/569) | — |
| `vitest` | the cross-time guard | ✓ | 3.2.4 | — |
| `@faker-js/faker` | `refDate` | ✓ | 8.4.1 | — |
| `zod` | the schema field | ✓ | 4.3.6 | — |
| Supabase / Docker | **not required** — the dev-seed unit suite is pure I/O by contract (`determinism.test.ts:11`: "contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc`") | n/a | — | — |
| Playwright / a running dev server | only for the CLAUDE.md phase-gate E2E run, not for any task in this phase | (per the standing E2E prereqs) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

⚠ **Disk note, not a dependency:** the project memory records ENOSPC voiding full-suite E2E runs in
this worktree. The dev-seed unit suite is unaffected (it ran clean in 10.4 s). The phase-gate E2E run
may need the operator's disk reclamation first.

---

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | vitest 3.2.4 (root catalog `^3.2.4`) |
| Config file | `packages/dev-seed/vitest.config.ts` — `export default {};` (workspace marker only; root `vitest.workspace.ts` aggregates) |
| Quick run command | `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts` |
| Package suite command | `yarn workspace @openvaa/dev-seed test:unit` (= `vitest run`) |
| Full suite command | `yarn test:unit` (turbo, all workspaces) |
| Typecheck (separately load-bearing here) | `yarn workspace @openvaa/dev-seed typecheck` (= `tsc --noEmit`); wired into root `lint:check` via `turbo run typecheck` (root `package.json:35-36`) |
| **Measured baseline** | **49 files, 569 tests, 569 passing, 10.37 s** |

### Requirement → validation map

| Req | Behaviour | Layer | Automated command | File exists? |
|---|---|---|---|---|
| REVIEW-SEED-01 | `ElectionsGenerator.ts:58` and `answers.ts:91` read a fixed `refDate`, not `now` | unit | `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts` | ✅ extend `tests/determinism.test.ts` |
| REVIEW-SEED-01 | The changed signature compiles (`Ctx.refDate` required; `makeCtx` updated) | typecheck | `yarn workspace @openvaa/dev-seed typecheck` | ✅ existing script |
| REVIEW-SEED-01 | No built-in template's output changes | unit | `yarn workspace @openvaa/dev-seed test:unit` (the 30-built-in assertions in `tests/templates/*` and `tests/assertKnownRowProps.builtins.test.ts` already cover this) | ✅ existing |
| REVIEW-SEED-02 (negative) | Same seed at two clocks 8 months apart **DIFFERS on pre-fix code** | unit, run-and-recorded | run once before the fix lands; record the output in the plan's evidence artifact. **Measured shape already available in R3.4 of this document.** | ❌ Wave 0 — the control template + the recorded run |
| REVIEW-SEED-02 (positive) | Same seed at the same two clocks is **IDENTICAL after the fix** | unit | `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts` | ❌ Wave 0 — the committed guard |
| REVIEW-SEED-02 (anti-vacuity) | The control template really reaches both sites | unit | same command; assert the emitted `election_date` is a non-empty `YYYY-MM-DD` and a `seed_q_date` answer key exists | ❌ Wave 0 — **do not omit this**; it is what stops the guard rotting into a false pass |
| REVIEW-SEED-03 | A built-in with an unknown key is rejected through `resolveTemplate` by the `.strict()` path | unit | `yarn workspace @openvaa/dev-seed vitest run tests/cli/resolve-template.test.ts` | ✅ file exists, case does not |
| REVIEW-SEED-04 (negative) | Pre-144 schema accepts the bad row: `TemplateSchema.safeParse(bad).success === true` | unit | `yarn workspace @openvaa/dev-seed vitest run tests/template.test.ts` | ✅ file exists, case does not |
| REVIEW-SEED-04 (positive) | Current `validateTemplate` rejects it with a field path | unit | same | ✅ file exists, case does not |
| REVIEW-HYG-02 slice (D-C3) | Neither comment site carries a dangling reference | manual read + Phase 152's scan once it lands | `grep -n "\- — latent" packages/dev-seed/src/template/types.ts` → no match; `grep -n "trace-confirmed; see" packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts` → no match | ✅ greppable |
| Phase gate | No regression anywhere | full suite | `yarn test:unit`, then `yarn lint:check`, then the full E2E suite under CLAUDE.md's cardinal rule | ✅ existing |

### Sampling rate

- **Per task commit:** `yarn workspace @openvaa/dev-seed test:unit` **and**
  `yarn workspace @openvaa/dev-seed typecheck`. The typecheck is not optional here — `tests/utils.ts`
  is the one file whose breakage vitest alone will not surface (Pitfall 5).
- **Per wave merge:** `yarn test:unit` (root) + `yarn lint:check`.
- **Phase gate:** full E2E suite green per CLAUDE.md's cardinal rule. Expected E2E delta: **zero**
  (no built-in reaches either changed line) — but the rule is unconditional.

### Wave 0 gaps

- [ ] `makeDateReachingTemplate()` factory (in `tests/determinism.test.ts`) — the control template
      from R3.3, plus the anti-vacuity assertions. Covers REVIEW-SEED-02.
- [ ] The recorded pre-fix two-clock run (the negative control artifact). Covers REVIEW-SEED-02's
      "observed to differ" half. **Must be run against unfixed code, before the fix task.** The output
      shape is already known (R3.4) and can be used to sanity-check the recording.
- [ ] `tests/utils.ts` `makeCtx` update for the new required `Ctx` field. Blocks typecheck for every
      other task.
- [ ] Criterion-3 case in `tests/cli/resolve-template.test.ts`.
- [ ] Criterion-4 negative-control pair in `tests/template.test.ts`.
- [ ] No framework install needed.

### Ordering constraint the plan MUST honour

The negative control is only meaningful if it is **run before** the fix. A wave that lands the
`refDate` edit and the guard together destroys the ability to observe the drift. Sequence:

1. Wave A — build the control template + run it on unfixed code + record the differing output.
2. Wave B — the `refDate` fix across `ctx.ts` / `ElectionsGenerator.ts` / `answers.ts` /
   `types.ts` / `schema.ts` / `index.ts` / `tests/utils.ts`.
3. Wave C — flip the control's assertion to `toEqual`, commit it as the standing guard; add the
   criterion-3 and criterion-4 tests; docs; the two D-C3 comments; file the O-4 todo.

---

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json`, so this section is included.

### Applicable ASVS categories

| ASVS category | Applies | Standard control |
|---|---|---|
| V2 Authentication | no | The phase touches no auth surface. |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | **yes** | The new `refDate` template field is untrusted input in the `--template ./path.ts` / `.json` case (`resolve-template.ts:56-59` loads arbitrary developer-authored files). It is validated by `TemplateSchema` (`z.iso.datetime()`, `.strict()` at `:164`) before `buildCtx` sees it — the same layer that already guards `seed`, `projectId` and `externalIdPrefix`. Do not bypass it. |
| V6 Cryptography | no | `faker` is not a CSPRNG and is not used as one; nothing here changes that. |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation | Status in this phase |
|---|---|---|---|
| Unvalidated template field reaching `new Date(...)` | Tampering | zod `.iso.datetime()` at the schema seam | Handled by the schema edit; a malformed string would otherwise yield an `Invalid Date` whose `toISOString()` throws deep in a generator. |
| A hostile template setting `refDate` to force a colliding dataset | Tampering | Out of the trust model: `resolve-template.ts:31-35` already records that loading `.ts`/`.js` from arbitrary paths executes developer code, which is intentional for a dev tool. A `refDate` value is strictly less powerful than the arbitrary-code execution already granted. | No new exposure. |
| Non-determinism as a supply-chain / reproducibility weakness | Repudiation | This phase's whole content: pinning generated dates so a seeded dataset is reproducible and therefore auditable. | This is the mitigation. |

The dev-seed package is a **local development tool** guarded by `NF-02`'s env-enforced writer
(`src/writer.ts`); it never runs against production. No new attack surface is introduced.

---

## Project Constraints (from CLAUDE.md)

The planner must verify each of these against the plans it writes.

- **E2E hard rule (cardinal failure).** No task may proceed or be marked done while any E2E test is
  failing. No "known-flaky" exemptions; a "did not run" test counts as a failure. Prefer running the
  **whole** suite (`yarn test:e2e`) for interim verification.
- **E2E preflight.** Every run asserts the served application came from this checkout; there is no
  skip flag. `FRONTEND_PORT` is the alternate-port escape hatch.
- **Never commit sensitive data.** Not applicable here, but standing.
- **Use TypeScript strictly — avoid `any`, prefer explicit types.** Relevant: the new
  `Ctx.refDate: Date` and `Template['refDate']?: string` must be explicit; no `as any` at the
  `emitValueFor` signature change.
- **Always check work against `/.agents/code-review-checklist.md`.** [VERIFIED: the file exists.]
- **Localization:** not applicable — no user-facing string is added.
- **Accessibility (WCAG 2.1 AA):** not applicable — no UI is touched.
- **Canonical package paradigm** (`packages/README.md`): if `SEED_REF_DATE` lands in a new file rather
  than in `ctx.ts`, that file must follow the package's conventions (no `.js` extensions on
  TS-internal relative imports; export through the flat `src/index.ts` barrel).
- **`db:*` vs `dev:*` naming:** no script changes are expected in this phase; if one is proposed,
  it must respect the harmonised naming.
- **Context Destructuring Rule (Svelte 5):** not applicable — no Svelte file is touched.

**Project skills consulted:** `.claude/skills/` contains `architect`, `components`, `data`,
`database`, `filters`, `matching`, `ship-review-stack`,
`spike-findings-voting-advice-application-gsd`, plus `BOUNDARIES.md`. None owns `packages/dev-seed`;
no skill pattern constrains this phase beyond CLAUDE.md itself.

---

## Sources

### Primary (HIGH confidence — measured in this worktree this session)

- `packages/dev-seed/src/cli/resolve-template.ts` (read in full) — criterion 3 verdict
- `packages/dev-seed/src/template/schema.ts` (read in full) — criterion 4 verdict, `.strict()` seam
- `packages/dev-seed/src/ctx.ts` (read in full) — the `Ctx` / `buildCtx` seam
- `packages/dev-seed/src/generators/ElectionsGenerator.ts` (read in full) — site 1, `defaults` = count 1
- `packages/dev-seed/src/emitters/answers.ts:1-140` — site 2, `emitValueFor` signature
- `packages/dev-seed/src/emitters/latent/project.ts` (read in full) — the `date` delegation at `:114-126`
- `packages/dev-seed/src/emitters/latent/latentEmitter.ts` — the two answer paths
- `packages/dev-seed/src/pipeline.ts` (read in full) — fragment merge at `:185`, emitter install at `:178`
- `packages/dev-seed/src/generators/CandidatesGenerator.ts`, `QuestionsGenerator.ts` (read in full)
- `packages/dev-seed/src/template/types.ts`, `src/types.ts`, `src/index.ts`
- `packages/dev-seed/tests/determinism.test.ts`, `tests/utils.ts`,
  `tests/generators/ElectionsGenerator.test.ts` (all read in full)
- Throwaway probe runs PROBE-A … PROBE-O (four probe files, each written, run, and deleted). Outputs
  pasted verbatim above.
- `yarn workspace @openvaa/dev-seed test:unit` baseline — 49 files / 569 tests / 10.37 s
- `node_modules/@faker-js/faker/package.json`, `node_modules/vitest/package.json`,
  `node_modules/zod/package.json` — resolved versions
- `.yarnrc.yml:8,21,24` — catalog declarations
- `.planning/REQUIREMENTS.md:106-109` — the REVIEW-SEED ids (contradicting CONTEXT O-5)
- `.planning/PRE-SHIP-REVIEW-TRIAGE.md:127-142` — the six PR #867 comments, quoted
- `.planning/config.json` — no `nyquist_validation` key ⇒ enabled

### Secondary (MEDIUM confidence)

- `.planning/phases/154-.../154-CONTEXT.md` — the decision record; F7 and O-5 corrected above against
  measurement, per D-0's "the fact wins".
- `.planning/ROADMAP.md:1042-1059` — the phase entry as corrected twice on 2026-08-28.

### Tertiary (LOW confidence)

- None. No web source was consulted; every claim is from the tree or from running the tree.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Criteria 3 & 4 already satisfied | **HIGH** | Source read in full AND behaviour exercised — the validator was run and its exact error strings recorded. |
| Negative-control feasibility | **HIGH** | Template built, run, and its drift pasted. Not reasoned about. |
| `vi.setSystemTime` mechanics | **HIGH** | Both `toFake` configurations and teardown measured in this suite. |
| `faker` `refDate` semantics | **HIGH** | Measured at the exact resolved version (8.4.1) with the exact option shapes both sites use. |
| Carrier / minimal diff | **HIGH** | Every named file read; the two consumers' signatures quoted; the two `Ctx`-literal sites in tests distinguished (one breaks, one does not). |
| Test blast radius | **HIGH** | Every candidate test read; snapshot search run; baseline recorded. |
| Post-fix end-to-end behaviour | **MEDIUM-HIGH** | Simulated through public seams and measured identical; the literal source edit is not yet written (A2). |
| `SEED_REF_DATE` literal value | **MEDIUM** | A recommendation under Claude's Discretion, constrained by a locked rejection rationale (A4). |
| Phase 152 scan compliance of new comments | **MEDIUM** | The scan does not exist yet; judged against D-N1's stated rules (A5). |

**Research date:** 2026-08-28
**Valid until:** 2026-09-27 (30 days — the package is stable; the only volatility is Phase 152 landing
first and possibly rewriting the two D-C3 sites, which D-C3 already anticipates)
