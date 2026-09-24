# Phase 142: Assertion Design — Wiring-Only Tests Assert Output - Pattern Map

**Mapped:** 2026-08-20
**Files analyzed:** 19 (11 test files modified, 1 renamed, 5 product files, 1 new ledger doc, 2 record-propagation docs)
**Analogs found:** 15 / 19 (3 "no analog — write fresh", 1 deliberately-no-analog by construction)

> **Read this first.** Phase 142 is *not* an architecture phase. Nothing is created from a
> template; almost every file already exists and is being **edited in place**. The useful
> analogs are therefore **in-tree examples of the assertion shape being adopted**, not
> structural scaffolds. Every excerpt below is quoted verbatim from the live tree at
> `feat-gsd-roadmap` HEAD, with `file:line`.
>
> **Read this second.** The negative-control columns **invert** relative to Phase 139: in 139
> a green under injection was the finding; in 142 a **RED is the success signal**. This is
> repeated per-plan in CONTEXT.md § Specific Ideas and must be repeated in every injection
> task's text.

---

## File Classification

### Test files (role: test · data flow: assertion / transform-verification)

| File to modify | Finding | Assertion shape being adopted | Closest analog | Match |
|---|---|---|---|---|
| `packages/question-info/tests/questionTypes.test.ts` | F15-A, D-03, D-05 | mock-call-args capture + prompt-content assertion | `packages/dev-seed/tests/pipeline.test.ts:70-85` (call-arg destructure) + `packages/llm/tests/setPromptVars.test.ts:17-23` (prompt-string `toBe`) | **role+flow match, split across two analogs** |
| `packages/argument-condensation/tests/condensation/condenserStandalone.test.ts` | F15-B, E9 | content assertion on a result array (`toHaveLength` + `.map(...).toEqual`) | `packages/dev-seed/tests/templates/nominations-override.test.ts:34-39` | role-match |
| `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts` | F15-C | same, across three clusters | same as above | role-match |
| `packages/argument-condensation/tests/unit/handleQuestion.test.ts` | F16 | `rejects.toThrow('<exact prefix>')` + non-empty fixture | `packages/llm/tests/setPromptVars.test.ts:33-40` (message matcher on a thrown Error); fixture from `condenseQuestions.test.ts:82-123` | **exact** |
| `apps/frontend/.../entityList/EntityListWithControls.test.ts` → `.helpers.test.ts` | F17 / D-04 | independently-derived expectation, `toEqual` on an observed array | `packages/dev-seed/tests/templates/nominations-override.test.ts:27-32` (expectation derived from a second source, not from the loop bound) | partial |
| `packages/dev-seed/tests/templates/default.test.ts` | F18 | seeded-Faker replay + boundary non-identity | `packages/dev-seed/tests/templates/default.test.ts:113-119` ("Test 9", determinism, **same file**) | **exact — in-file sibling** |
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` | F20-1 | `rejects.toMatchObject({ status: 400 })` | **no analog** — see § No Analog Found | — |
| `apps/frontend/src/lib/i18n/tests/overrides.test.ts` | F20-2 | exact-string `toBe` on a returned template | `packages/llm/tests/setPromptVars.test.ts:22` | **exact** |
| `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts` | F20-3 | `toMatchObject({ success: false, error: { code } })` | `packages/dev-seed/tests/pipeline.test.ts:80` (`toMatchObject` on a captured object) | role-match |
| `packages/dev-seed/tests/supabaseAdminClient.test.ts` | F20-4 | exact-string `toBe` on a captured call argument | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts:134` (`mock.calls[0][0]` assertion) | role-match |
| `packages/data/src/objects/nominations/variants/variants.test.ts` | F20-5 | count derived from the fixture, not hard-coded | `packages/data/src/objects/nominations/base/nomination.test.ts:7-17` — **the sibling directory, same fixture, same helper** | **exact** |
| `packages/argument-condensation/tests/unit/planValidation.test.ts` | F20-6 | `toThrow('<exact message>')` | `packages/argument-condensation/tests/unit/planValidation.test.ts:89-96` — **seven siblings in the same file** | **exact — in-file** |

### Product files (role: service / route / config · data flow: request-response, transform)

| File to modify | Decision | Change shape | Closest analog | Match |
|---|---|---|---|---|
| `apps/frontend/src/routes/api/oidc/authorize/+server.ts` | D-02 | re-throw framework exceptions from the catch arm | `apps/frontend/src/routes/api/oidc/callback/+server.ts:95-99` | **exact — sibling route** |
| `packages/question-info/src/core/infoGeneration.ts` | D-01 | add two entries to the prompt-variables literal | the literal itself at `:75-82` (extend in place) | in-file |
| `packages/question-info/src/prompts/en/{generateInfoSections,generateTerms,generateBoth}.yaml` | D-01 | add `params.required` / `params.optional` + `{{placeholder}}` | the existing `question` param in the same three YAMLs | in-file |
| `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` | ⚠-5 / E6 (**third product change**) | two-code branch split via `Object.assign(new Error(...), { code })` | the existing `'code' in e` catch branch at `:47-59` | in-file |
| `packages/question-info/src/utils/responseTransformer.ts` | D-03 | **read-only** — inspected, confirmed non-identity; the *test* repoints at its field-renames | — | n/a |

### Documents (role: record · data flow: evidence ledger)

| File to create/modify | Decision | Closest analog | Match |
|---|---|---|---|
| `142-NEGATIVE-CONTROL-LEDGER.md` (**new**) | D-09 | `141-ASSERT10-LEDGER.md` (shape) + `139-VERDICTS.md` (per-finding depth) | **exact — two-analog composite** |
| `.planning/audits/2026-08-11-fake-guard-sweep.md` | D-18 | `139-VERDICTS.md` § 6.2 three-propagation-target precedent | exact |
| `.planning/REQUIREMENTS.md:60` + ROADMAP phase line | D-18 | the ASSERT-01 evidence clause already on `REQUIREMENTS.md` | exact |

---

## Pattern Assignments

### 1. `142-NEGATIVE-CONTROL-LEDGER.md` (record, evidence ledger) — D-09

**Analogs:** `141-ASSERT10-LEDGER.md` (document skeleton) and `139-VERDICTS.md` (per-finding
record depth). Neither alone is sufficient: 141 has the right *shape*, 139 has the right
*corpus semantics*. Compose.

**Frontmatter pattern — neither file uses YAML frontmatter.** Both open with an H1 that states
the claim, then a bullet block of provenance. `141-ASSERT10-LEDGER.md:1-13` verbatim:

```markdown
# Phase 141 — ASSERT-10 Injection Ledger: every branch of the shipped teardown-prefix guard, run red

- **Phase:** 141 (package-unit-test-coverage-test-unit-invariant-guard)
- **Requirement:** ASSERT-10
- **Plan:** `141-04-PLAN.md` (wave 1)
- **Guard under test:** `tests/playwright.config.ts:138-240` — **read-only to this phase (D-15)**
- **Guard built by:** phase 140, commit `abe1fabb0` (hardened by `bdb759575` IN-01, `c15e444e8` IN-02)
- **Run:** 2026-08-18 (UTC; first command issued `2026-08-18T15:58:40Z`)
- **HEAD at time of run:** `9b6d939a1`
- **Machine:** developer Mac, host Node + host Playwright. No container: ...
```

`139-VERDICTS.md:1-15` uses the same bullet block plus a **`Decisions discharged:`** line and a
**`Precedent followed:`** line naming its predecessor document — 142's ledger should name
`141-ASSERT10-LEDGER.md` and `139-VERDICTS.md`, continuing that explicit chain.

**Table pattern — a compact "row register" table up front, then one H2 section per row.**
`141-ASSERT10-LEDGER.md:75-88`:

```markdown
## Row register

| Row | Branch exercised | Injection site | Exit | Outcome |
|-----|------------------|----------------|------|---------|
| A | none — clean baseline | — | **0** | `Total: 143 tests in 94 files` |
| B | equality collision (`:220` → throw `:221`) | `tests/tests/setup/perm/zz-scratch-b.teardown.ts` | **1** | names both files + the shared prefix |
```

D-09 fixes 142's columns instead:
`# · Finding · Site · Injection source (§ 5.N.2) · OLD half (cited/re-run) · NEW-assertion outcome · File outcome · Collateral · Verdict`.
Note this is **9 columns vs 141's 5** — wider than the analog; keep it, D-09 is locked, and the
separate `NEW-assertion outcome` / `File outcome` cells are exactly D-08's two-column rule.

**Per-row section pattern** — `141-ASSERT10-LEDGER.md:115-150`, the fields in order:

```markdown
## Row B — equality collision (catch half)

**Branch:** `a.prefix === b.prefix` at `tests/playwright.config.ts:220`, throwing at `:221`.

**Injected declaration (verbatim, `<path>`):**
```ts
// TRANSIENT ASSERT-10 injection (row B) — removed by rm in the same task.
...
```

**Command:** `npx playwright test -c ./tests/playwright.config.ts --list`

**Exit code:** `1`

**Message (verbatim):**
```
Error: Teardown prefix collision: ...
```
```

**Two conventions to copy verbatim, both load-bearing:**

1. **The "not doctored" disclosure.** `141-ASSERT10-LEDGER.md:60-71` explains that the literal
   first output line is a dotenv banner and that the recorded "first line" is the first
   *verdict-bearing* line. 142 must make the equivalent disclosure for vitest's own preamble.
2. **The provenance clause** at `141-ASSERT10-LEDGER.md:47-52`: *"`141-RESEARCH.md` § Injection
   Ledger is cited as the **template for this document's shape**, and is never the source of
   truth for any outcome here — its rows were re-run, not copied."* 142's analogue is subtler
   and **must be written**, because D-06 *does* permit citing 139's OLD half: the ledger must
   state, per row, whether the OLD half is cited (`139 § 5.N.4`) or re-run, and never let a
   citation look like a measurement.

**Ordering guarantee (D-09, from 139):** write all 12 rows with empty cells **before** the first
injection. `139-VERDICTS.md:5-9` states the principle: *"A finding whose injection run did not
execute keeps its placeholder and carries **no** verdict — never a confirmed one."*

---

### 2. `packages/argument-condensation/tests/unit/planValidation.test.ts` (test, F20-6) — D-11 E7

**Analog:** the same file, `:89-96`. This is the model CONTEXT.md D-05 and the phase prompt name.
Verbatim at HEAD (note: the *sibling* at `:94` referenced in the decisions is the second
`toThrow` call, the multi-line form at `:94-96`):

```ts
  test('It should throw if the pipeline does not result in a single list', () => {
    const steps: Array<ProcessingStep> = [
      createStep(CondensationOperations.MAP, { batchSize: 10 }), // produces 10 lists for 100 comments
      createStep(CondensationOperations.REDUCE, { denominator: 5 }) // reduces 10 lists to 2 lists
    ];
    expect(() => validatePlan({ steps, commentCount: 100 })).toThrow(
      'Pipeline must end with a single list, but ends with listOfLists in 2 batch(es)'
    );
  });
```

And the single-line variant one test earlier, `planValidation.test.ts:86`:

```ts
    expect(() => validatePlan({ steps, commentCount: 100 })).toThrow('refine can only be followed by ground');
```

**The defect being fixed, `:104` verbatim** — identical call, message argument missing:

```ts
    expect(() => validatePlan({ steps, commentCount: 100 })).toThrow();
```

**Copy exactly:** the multi-line form (the target message exceeds the line budget), with the
message string RESEARCH § B.12 traced: `'Pipeline must end with a single list, but ends with
listOfLists in 100 batch(es)'` — note **100**, not the sibling's 2.

**Collateral warning (139 § 8.1 C-1):** the `:94-96` sibling pins the *old* message and reds under
the same injection. Verdict run must be the isolated `-t 'It should throw if a final map step
would produce multiple batches'`; whole-file run kept as the collateral record.

---

### 3. `packages/question-info/tests/questionTypes.test.ts` (test, F15-A) — D-01, D-03, D-05

**Analog A — mock-call-args capture: `packages/dev-seed/tests/pipeline.test.ts:70-85`.** The
cleanest in-tree example of *destructuring* a spy's recorded arguments and asserting on their
shape (as opposed to the `mock.calls[0][0]` index chains that dominate the rest of the repo):

```ts
  it('override receives (fragment, ctx) with seeded faker + projectId', () => {
    const overrideSpy = vi.fn((_fragment: unknown, ctx: Ctx) => [
      { external_id: 'override_el_0', project_id: ctx.projectId }
    ]);
    runPipeline({ elections: { count: 3 } }, { elections: overrideSpy });

    expect(overrideSpy).toHaveBeenCalledTimes(1);
    const [receivedFragment, receivedCtx] = overrideSpy.mock.calls[0];

    // Fragment carries the template's count (merged fragment).
    expect(receivedFragment).toMatchObject({ count: 3 });
    ...
  });
```

Three things to copy: (a) the `toHaveBeenCalledTimes(1)` **guard before** the `mock.calls[0]`
dereference — without it a zero-call regression fails with a `TypeError` on the wrong axis rather
than a clean assertion red; (b) the destructure into a *named* local; (c) the explanatory comment
tying the captured value back to its source.

Secondary, tighter analogs for a nested field: `packages/dev-seed/tests/latent/latentEmitter.test.ts:109-111`
(`const args = centroidsHook.mock.calls[0]; expect(args[4]).toBe(templateCentroids);` — with a
comment naming the arg index) and `packages/dev-seed/tests/writer.test.ts:197`
(`const bulkImportArg = instance.bulkImport.mock.calls[0][0] as Record<string, unknown>;` — the
`as`-cast idiom for an untyped spy, which `questionTypes.test.ts`'s `as any` provider needs).

The concrete capture expression RESEARCH § B.1(b) measured:

```ts
const [arg] = mockLLMProvider.generateObjectParallel.mock.calls[0];
const promptFor = (i: number): string => arg.requests[i].messages[0].content;
```

The mock handle already supports this — `questionTypes.test.ts:14-17`:

```ts
const mockLLMProvider = {
  generateObjectParallel: vi.fn()
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
```

**Analog B — asserting on prompt content: `packages/llm/tests/setPromptVars.test.ts:17-23`.** The
only place in the tree that asserts on a *built prompt string*, and it does so with exact equality:

```ts
  test('should replace variables correctly', () => {
    const promptText = 'Hello {{name}}, you are {{age}} years old.';
    const variables = { name: 'John', age: 25 };

    const result = setPromptVars({ promptText, variables, controller: mockLogger });
    expect(result).toBe('Hello John, you are 25 years old.');
  });
```

142 cannot use `toBe` (the prompt is a large YAML-rendered template), so the T1/T3 targets use
`toContain` and T2 uses `not.toEqual` between two captured prompts. **`setPromptVars` is still the
right analog for the failure mode to expect** — `:33-40` shows the strict-mode throw
(`'Prompt is missing required variables: age'`) that D-01's YAML edit will trigger if a
`params.required` name is added without a matching variable.

**⚠ T2 needs a NEW fixture, not an edited assertion** (RESEARCH ⚠-2). The three existing
"Configuration" blocks use differently-*named* questions, so a pairwise-inequality assertion over
them passes today. The new fixture holds `name` constant and varies `type`. Fixture-construction
analog is in the same file's import block, `questionTypes.test.ts:1-12` — `BooleanQuestion`,
`SingleChoiceCategoricalQuestion`, `SingleChoiceOrdinalQuestion`, `QUESTION_TYPE` are already
imported; no new import is needed.

**D-03 repoint (`:535-537`):** no analog needed — the target assertions are ordinary
`toBe`/`toEqual` on transformed fields. Record in the phase record that
`responseTransformer.ts:24-51` was inspected and found **non-identity** (D-03's "say so" clause).

---

### 4. `packages/data/src/objects/nominations/variants/variants.test.ts` (test, F20-5) — D-11 E5

**Analog: `packages/data/src/objects/nominations/base/nomination.test.ts:1-17`** — the sibling
directory, the same fixture (`getTestData()`), the same helper (`parseNominationTree`), and it
already does exactly what E5 asks: derives the expected count from the fixture rather than
hard-coding it.

```ts
import { expect, test } from 'vitest';
import { parseNominationTree } from '../../../internal';
import { getTestData, getTestDataRoot, parseNestedNominations } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const nominationData = parseNestedNominations(parseNominationTree(data.nominations));
const objects = [
  ...(root.allianceNominations ?? []),
  ...(root.candidateNominations ?? []),
  ...(root.factionNominations ?? []),
  ...(root.organizationNominations ?? [])
];

test('Should have all nominations', () => {
  expect(objects.length).toBe(nominationData.length);
});
```

**The whole file under repair, verbatim (12 lines):**

```ts
import { expect, test } from 'vitest';
import { parseNominationTree } from './variants';
import { getTestData } from '../../../testUtils';

test('ParseNominationTree should insert election and constituencyId to all items', () => {
  const tree = getTestData().nominations;
  const nominationData = parseNominationTree(tree);
  nominationData.forEach((d) => {
    expect(d.electionId).toBeDefined();
    expect(d.constituencyId).toBeDefined();
  });
});
```

**Secondary analog for the derivation arithmetic** —
`packages/dev-seed/tests/templates/nominations-override.test.ts:34-39`, which computes an expected
total by reduction *and* pins the literal beside it:

```ts
  it('total cell sum equals PARTY_WEIGHTS sum (327)', () => {
    const total = PARTY_CONSTITUENCY_MATRIX.flat().reduce((s, x) => s + x, 0);
    const expected = PARTY_WEIGHTS.reduce((s, x) => s + x, 0);
    expect(total).toBe(expected);
    expect(total).toBe(327);
  });
```

Note the belt-and-braces `expect(total).toBe(327)` — the analog for E5's non-vacuity guard
(`expect(expectedCount).toBeGreaterThan(0)`), which exists so that an empty fixture cannot make
the derivation trivially self-satisfying. **Do not** pin the literal 35 as well; E5 says derive.

**Build hazard, unique to this file** (RESEARCH § A.2 / A.3): the injection is under
`packages/data/src/`, and root `turbo run test:unit` `dependsOn: ["build"]`. The injection must
**never** be live during a root run. In-package `npx vitest run` only.

---

### 5. `packages/dev-seed/tests/templates/default.test.ts` (test, F18) — D-11 E2

**Analog — determinism from a seed: the same file, `:113-119` ("Test 9").** The only in-tree test
that asserts byte-identity of seeded generator output:

```ts
  it('Test 9: deterministic — same ctx/org refs yield byte-identical rows across calls', () => {
    const ctxA = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const ctxB = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rowsA = candidatesOverride({}, ctxA);
    const rowsB = candidatesOverride({}, ctxB);
    expect(JSON.stringify(rowsA)).toEqual(JSON.stringify(rowsB));
  });
```

That gives the *setup* (`makeCtx` + `eightParties()`) verbatim, which Test 10's rewrite reuses
unchanged. It does **not** give the per-locale replay — no test in the tree calls
`__buildLocaleFakerForTests` today (`grep` over `packages/dev-seed/tests`: zero hits).

**Seeded-Faker source pattern — `packages/dev-seed/src/templates/defaults/candidates-override.ts:172-176`,**
the exported test hook, byte-identical to the private `buildLocaleFaker` at `:81`:

```ts
export function __buildLocaleFakerForTests(locale: LocaleCode, baseSeed = 42): Faker {
  const f = new Faker({ locale: [LOCALE_PACKS[locale], en] });
  f.seed(baseSeed + LOCALE_SEED_OFFSETS[locale]);
  return f;
}
```

with the offsets at `:63-67` (`en: 0, fi: 1000, sv: 2000`) and the constant at `:53`
(`export const LOCALE_BLOCK_SIZE = 109;`). The private builder's docblock at `:163-171` already
states the intent: *"Tests in `default.test.ts` verify byte-level determinism at this base"* —
i.e. the hook was exported for precisely this phase's assertion and has never been used.

**Test 10 as it stands, `:121-134` — the defect, verbatim:**

```ts
  it('Test 10: faker locale cycling — 109 candidates per locale block (en/fi/sv)', () => {
    // Spec: indices 0-108 use en, 109-217 fi, 218-326 sv. We cannot easily
    // assert the locale packet, but we can assert that names within a block
    // are byte-identical to a freshly-seeded per-locale Faker. The override's
    // LOCALE_BLOCK_SIZE constant is 109. Shape-only assertion: non-empty
    // strings.
    ...
    for (const idx of [0, 109, 218]) {
      const r = rows[idx] as { first_name?: string; last_name?: string };
      expect(r.first_name).toBeTruthy();
      expect(r.last_name).toBeTruthy();
    }
  });
```

The comment **describes the assertion E2 wants** and then declines to write it. The rewrite makes
the comment true; delete the "Shape-only assertion" sentence with it.

**Constant-from-source analog:** `nominations-override.test.ts:17-18` shows the import-the-constant
idiom E2 mandates —

```ts
import { PARTY_WEIGHTS } from '../../src/templates/defaults/candidates-override';
...
    expect(PARTY_CONSTITUENCY_MATRIX).toHaveLength(PARTY_WEIGHTS.length);
```

**⚠ but invert the direction for F18.** RESEARCH § B.6: because the injection *changes*
`LOCALE_BLOCK_SIZE`, boundary indices must be derived from `rows.length / 3`, with
`expect(LOCALE_BLOCK_SIZE).toBe(blockSize)` as the assertion *on* the constant. Deriving indices
*from* the constant is the R-6 trap and reds on the wrong axis.

---

### 6. `apps/frontend/src/routes/api/oidc/authorize/+server.ts` (route, request-response) — D-02

**Analog: `apps/frontend/src/routes/api/oidc/callback/+server.ts:94-102`** — the sibling route in
the same directory family, already doing the re-throw-framework-exceptions-from-the-catch shape:

```ts
    // Redirect to the preregister page
    throw redirect(303, '/candidate/preregister');
  } catch (e) {
    // Re-throw SvelteKit redirects (they are thrown as exceptions)
    if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
      throw e;
    }
    console.error('Callback token exchange failed:', e);
    throw redirect(303, '/candidate/preregister?error=token_exchange_failed');
  }
```

**The import it relies on — confirmed.** The callback route uses a **structural duck-type check**
(`'status' in e && 'location' in e`), *not* a kit helper, so it imports **nothing extra**. That is
the analog's shape but not its best form for D-02: RESEARCH § C.2 recommends
`isHttpError`, which **is** exported by `@sveltejs/kit`
(`node_modules/@sveltejs/kit/src/exports/index.js:90-93`, `e instanceof HttpError`) and is *not*
currently imported anywhere in the authorize route.

**The authorize route's import line, verbatim at `+server.ts:13`:**

```ts
import { error, json } from '@sveltejs/kit';
```

→ D-02's edit is: extend that line to `import { error, isHttpError, json } from '@sveltejs/kit';`
and add `if (isHttpError(e)) throw e;` as the first statement of the catch at `:50`. Two lines.

**The defect, verbatim `+server.ts:17-23`:**

```ts
export async function POST({ cookies, request }: RequestEvent): Promise<Response> {
  try {
    const { redirectUri, codeChallenge } = await request.json();

    if (!redirectUri) {
      return error(400, { message: 'redirectUri is required' });
    }
```

**Two things the planner must carry:** (a) D-02's *first* named option (`throw error(400, …)`) is
a **runtime no-op** — `error()` throws unconditionally in kit 2.55.0 — so the fix must be the
re-throw (or the guard hoist), not the `throw` keyword; (b) with the fix in place, the F20-1
negative-control injection **flips from B to A** (RESEARCH ⚠-1). Both belong at the plan's
`autonomous: false` checkpoint.

**Sibling-shape check (D-02's second clause), already executed in research** —
`…/oidc/token/+server.ts:29` has the same shape but is *observationally inert* (swallowed status
and body byte-identical to the replacement); `…/api/cache/+server.ts:56` is a third live instance
but **outside D-02's named scope** → capture as a standing todo, do not fix.

---

### 7. `apps/frontend/.../EntityListWithControls.test.ts` → `.helpers.test.ts` (test, F17) — D-04

**Analog for the rewritten assertion: `packages/dev-seed/tests/templates/nominations-override.test.ts:27-32`** —
an expectation computed from an *independent* source and compared to the observed value, which is
precisely D-04 item 4's requirement ("an independently-derived expectation, not a value compared
to itself"):

```ts
  it('row sums match PARTY_WEIGHTS (each party total)', () => {
    for (let p = 0; p < PARTY_CONSTITUENCY_MATRIX.length; p++) {
      const rowSum = PARTY_CONSTITUENCY_MATRIX[p].reduce((s, x) => s + x, 0);
      expect(rowSum).toBe(PARTY_WEIGHTS[p]);
    }
  });
```

**The defect, verbatim `EntityListWithControls.test.ts:84-95`:**

```ts
    it('Contract 4: bounded apply() invocations under a flurry of filter mutations', () => {
      const entities = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
      const group = new FakeGroup([new FakeFilter('f1')]);
      // Simulate 10 mutation cycles (each cycle: toggle + recompute via the helper)
      for (let i = 0; i < 10; i++) {
        group.filters[0].setActive(i % 2 === 0);
        computeFiltered(entities, group, undefined);
      }
      // Each computeFiltered call invokes apply once. 10 cycles → 10 invocations.
      // Bounded: the assertion proves no recursive/extra calls occur.
      expect(group.applySpy).toHaveBeenCalledTimes(10);
    });
```

**The `:9` doc comment to rewrite (D-04 item 3), verbatim `:3-14`:**

```ts
/**
 * Pure-helper unit tests for `EntityListWithControls`. The component itself
 * is a thin wrapper around the `$derived.by(() => computeFiltered(...))`
 * pattern; testing the helper directly is the cheapest way to validate the
 * contract that "filter mutation narrows the rendered list" without standing
 * up the full appContext + locale + i18n surface a `mount()`-based test
 * would need.
 *
 * The version-counter bridge that triggers re-runs is tested in
 * `filterContext.svelte.test.ts` Contract 5; the bounded-re-run smoke
 * (Contract 4 below) is asserted by counting calls to `apply()` spies.
 */
```

**The back-reference that must move with the rename (D-04 item 1)** —
`EntityListWithControls.helpers.ts:13`, the only other mention of the old filename in the tree:

```ts
 * Tested in `EntityListWithControls.test.ts`.
 */
```

Note that `computeFiltered`'s own docblock (`helpers.ts:1-13`) is already written as a **contract
statement** with `[VERIFIED: …]` citations — it is the in-tree model for what item 3's rewritten
test docblock should read like.

**Supplementary-injection target, `helpers.ts:19`** (RESEARCH ⚠-3, the phase's largest evidence
risk — F17 has *no* NEW half for 139's pre-specified regression, by construction of D-04's chosen
remedy):

```ts
  const afterGroup = filterGroup ? filterGroup.apply([...entities]) : [...entities];
```

---

### 8. Remaining test files — analogs, briefly

- **`overrides.test.ts` (F20-2, E3)** — exact-string `toBe`; analog `setPromptVars.test.ts:22`
  (`expect(result).toBe('Hello John, you are 25 years old.')`). Nothing new in scope. E3's rule
  is procedural, not structural: if the value differs, that is a **finding to record**, never a
  value copied from the run output.
- **`supabaseAdminClient.test.ts` (F20-4, E4)** — captured-call-arg exact match; analog
  `packages/dev-seed/tests/generators/NominationsGenerator.test.ts:134`
  (`expect(loggerSpy.mock.calls[0][0]).toContain('Clamped to 2');`) — same *shape*, weaker
  matcher. F20-4 upgrades `toContain` → `toBe`. Discretion resolved by measurement:
  `selectCalls[0]` is a `string`, so **`toBe`**, not `toEqual` on an array.
- **`handleQuestion.test.ts` (F16, E1)** — message matcher, analog is
  `setPromptVars.test.ts:33-40` (`.toThrow('Prompt is missing required variables: age')`) for the
  sync form and `planValidation.test.ts:86` for the style; the *async* `rejects.toThrow('…')`
  form has no closer analog and is standard vitest. The non-empty `entities` fixture copies
  `condenseQuestions.test.ts:82-123`.
- **`condenserStandalone.test.ts` / `condenseQuestions.test.ts` (F15-B/C, E8/E9)** — array-content
  assertions; closest analog is the derived-count family above. ⚠ the path is
  `result.data.arguments`, **not** `result.arguments` as ROADMAP criterion 2's prose says.
- **`getIdTokenClaims.test.ts` (F20-3, E6)** — `toMatchObject` on a captured result; analog
  `pipeline.test.ts:80` (`expect(receivedFragment).toMatchObject({ count: 3 })`). The
  **product-side** two-code split has no in-tree `Object.assign(new Error(…), { code })` analog —
  see § No Analog Found.

---

## Shared Patterns

### The HYGIENE-LOOP (applies to every injection task, all 12 findings)

**Source:** `139-VERDICTS.md` § 3.1, reproduced as executable commands in `142-RESEARCH.md` § A.1.
**Apply to:** every plan. Reused **verbatim** per D-07 — no plan reinvents it.

Three standing constraints that are easy to drop and expensive to lose:

- The **bare** `git status --porcelain` is never a gate; the scoped form
  (`-- apps tests packages`) only.
- Always `cd` into the workspace directory before `npx vitest run` —
  `packages/argument-condensation/src/core/condensation/condenser.ts:198` writes
  `path.join(process.cwd(), 'data/operationTrees', …)`, gitignored *only inside that package*.
- Logs go **outside the repo**: `${TMPDIR:-/tmp}/gsd-142/<finding>-<half>-<n>.log`.

### Two-column and collateral rules, inverted

**Source:** `139-VERDICTS.md` § 3.2, § 3.3 (D-08). **Apply to:** every ledger row.
The assertion outcome and the file outcome are **separate cells**; collateral reds are recorded,
not hidden. In 142 the assertion cell must be **red** and the file cell **may** be red for
collateral reasons — which is exactly why separating them is what stops a collateral red being
credited as the negative control.

Known collateral, pre-identified: F20-6 → `planValidation.test.ts:94-96` (C-1);
F20-3 injection A → `getIdTokenClaims.test.ts:147,174,203` (C-5).

### Guard the dereference before asserting on `mock.calls`

**Source:** `packages/dev-seed/tests/pipeline.test.ts:76-77`. **Apply to:** F15-A, F20-4, and any
new call-args assertion.

```ts
    expect(overrideSpy).toHaveBeenCalledTimes(1);
    const [receivedFragment, receivedCtx] = overrideSpy.mock.calls[0];
```

Without the count guard, a zero-call regression surfaces as a `TypeError` on `mock.calls[0]`
rather than an assertion failure — a red on the wrong axis, which the ledger cannot credit.

### Derive expectations from the fixture, pin non-vacuity separately

**Source:** `packages/data/src/objects/nominations/base/nomination.test.ts:16` +
`packages/dev-seed/tests/templates/nominations-override.test.ts:34-39`.
**Apply to:** F20-5 (E5), F18 (E2), F15-B/C (E8).

A derived count closes the vacuity hole only if the derivation itself cannot be zero. Assert
`> 0` on the *derived* value, then `toHaveLength(derived)` on the observed one.

### Record propagation — three targets, not two

**Source:** `139-VERDICTS.md` § 6.2. **Apply to:** the ledger-completion plan (D-18).
The enumeration lands in `.planning/audits/2026-08-11-fake-guard-sweep.md` (a remediation line per
finding, naming commit + ledger row), `REQUIREMENTS.md:60` (ASSERT-07 `[x]` with an ASSERT-01-style
evidence clause), and the ROADMAP phase line. Withdrawals are **struck, not deleted** (§ 6
precedent). Expected withdrawal count: **0**.

---

## No Analog Found

Files/shapes with no close in-tree match. Per the phase brief, these are named rather than matched
to something distant.

| Target | Role | Data flow | Why no analog, and the closest adjacent convention |
|---|---|---|---|
| `authorize-endpoint.test.ts` — `rejects.toMatchObject({ status: 400 })` | test | request-response | **No in-tree test asserts on a thrown SvelteKit `HttpError`'s `status`.** `grep` for `toMatchObject` across `apps/frontend/src` returns only object-shape assertions on plain return values. The shape is forced by a framework fact rather than a convention: kit's `HttpError` is **not** an `Error` subclass (`node_modules/@sveltejs/kit/src/exports/internal/index.js` — a plain class with own `status` / `body`), so `toThrow(expect.objectContaining(...))` will not work and `toMatchObject` is the correct matcher. **Write fresh.** Closest adjacent convention: `pipeline.test.ts:80`'s `toMatchObject` usage for the matcher style only. |
| `getIdTokenClaims.ts` — `Object.assign(new Error(msg), { code })` | service | transform | **No in-tree site attaches a `code` to a thrown Error.** The consuming branch already exists (`getIdTokenClaims.ts:48`, `e instanceof Error && 'code' in e`) but only `jose`'s own errors currently satisfy it. **Write fresh**, matching the shape the existing catch already reads. ⚠ This is a **third product change** beyond D-01/D-02, authorized by E6 but not budgeted by D-17 — it must be named at plan 4's `autonomous: false` checkpoint, not ride in as an assertion edit. |
| F18 — per-locale Faker replay in a test | test | transform | The hook `__buildLocaleFakerForTests` is exported *for this purpose* and has **zero call sites** in `packages/dev-seed/tests`. The determinism *idiom* has an analog (Test 9, same file); the *replay* does not. **Write fresh**, guided by RESEARCH § B.6's injection-safe design. |
| F17 — a NEW half for 139's pre-specified regression | test | — | **Not "no analog" but "no such thing", by construction.** D-04 selects ROADMAP criterion 3's second branch (rename), and `139-VERDICTS.md` § 5.5.6 predicted in advance that only the *other* branch makes the pre-specified regression red. Ledger cell reads `N/A — by construction`, with reasoning; the finding is **remediated, not withdrawn** (D-13's bar is not engaged, withdrawal count stays 0). RESEARCH ⚠-3 recommends supplying a *supplementary* pair against `helpers.ts:19`, explicitly labelled "supplementary — not 139 § 5.5.2". |

---

## Metadata

**Analog search scope:** `packages/*/tests/`, `packages/data/src/**/*.test.ts`,
`apps/frontend/src/lib/**/*.test.ts`, `apps/frontend/src/routes/api/oidc/`,
`.planning/phases/139-*/`, `.planning/phases/141-*/`
**Files read this session:** 18 source/test files + 2 phase records + 2 upstream inputs
**Repository modifications:** none — this pass is read-only
**Pattern extraction date:** 2026-08-20
