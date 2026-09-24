# Phase 154: dev-seed Determinism & Template Validation - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 12 (9 source/test modified, 1 test file extended, 1 todo created, 1 barrel)
**Analogs found:** 11 / 12 (the `vi.setSystemTime` guard has **no in-repo analog** — greenfield, confirmed by RESEARCH § R4)

All excerpts below were read from the tree this session. Where RESEARCH.md already pasted a
range verbatim (R1, R2a, R2b, R6, R9, R10), this document does **not** re-derive it — it cites the
RESEARCH section and adds only what RESEARCH left un-pasted.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/dev-seed/src/ctx.ts` | run-context factory | transform (template → resolved ctx) | **itself** — the `faker.seed(template.seed ?? 42)` line is the in-file precedent for the new resolved field | exact (self-analog) |
| `packages/dev-seed/src/generators/ElectionsGenerator.ts` | generator | batch row emission | **itself** — `:39` destructure + `:50-63` synthetic loop | exact (self-analog) |
| `packages/dev-seed/src/emitters/answers.ts` | emitter | transform (question → value) | **itself** — `emitNumberInDeclaredRange(q, faker)` is the same-file precedent for a typed helper with a narrowed signature | exact (self-analog) |
| `packages/dev-seed/src/template/types.ts` | type declaration (authoring authority) | n/a | `seed?: number;` at `:158` + its docstring bullet at `:54-56` | exact |
| `packages/dev-seed/src/template/schema.ts` | zod schema (runtime authority) | validation | `seed: z.number().int().optional()` at `:122` | exact |
| `packages/dev-seed/src/index.ts` | barrel | n/a | `export { TemplateSchema, validateTemplate } from './template/schema';` (`:117`) | exact |
| `packages/dev-seed/tests/determinism.test.ts` | test (unit) | assertion | **itself** — `describe('determinism (TMPL-08)')` `:19-109`, `makeTemplate()` factory `:64-72` | exact (self-analog) |
| `packages/dev-seed/tests/utils.ts` | test factory | transform | `buildCtx` in `src/ctx.ts` (it is a deliberate copy of it, minus the `Template` arg) | exact |
| `packages/dev-seed/tests/cli/resolve-template.test.ts` | test (regression, crit. 3) | validation-assertion | **already contains the pattern** — `DRIFTED_BUILT_INS` + the three `D-07:` cases at `:106-130` | exact (self-analog) |
| `packages/dev-seed/tests/template.test.ts` | test (neg. control + regression, crit. 4) | validation-assertion | `expect(() => validateTemplate(...)).toThrow(/template\.seed/)` at `:32` | exact |
| `packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts` | template data (comment fix) | n/a | clean-comment house style in `answers.ts` (see § Shared Patterns) | role-match |
| `.planning/todos/pending/2026-08-28-<slug>.md` | planning artifact | n/a | `.planning/todos/pending/2026-08-12-data-filters-unit-tests-not-in-ci.md` | exact |

---

## Pattern Assignments

### 1. `packages/dev-seed/src/ctx.ts` (run-context factory, transform)

**Analog: itself.** The construction seam already resolves three template-derived scalars with the
same `template.X ?? DEFAULT` shape. `SEED_REF_DATE` + `refDate` must be added by **exactly this
pattern**, not a novel one. Verbatim, `:78-92`:

```ts
export function buildCtx(template: Template): Ctx {
  // Pattern A per RESEARCH: construct a fresh Faker instance per pipeline run
  // (NOT the module-level `faker` singleton + `faker.seed()`). Seeding happens
  // via `.seed()` on the fresh instance immediately after construction — the
  // `new Faker({ seed })` constructor option does not exist in the @faker-js/faker
  // v10 API surface we consume (see RESEARCH code sample update).
  const faker = new Faker({ locale: [en] });
  faker.seed(template.seed ?? 42);
  return {
    faker,
    projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: template.externalIdPrefix ?? 'seed_',
    refs: {
      accounts: [{ id: '00000000-0000-0000-0000-000000000001' }],
      ...
```

**Pattern to copy:** the `template.X ?? <literal-default>` line, placed in the returned object
literal alongside `projectId` / `externalIdPrefix`. Per RESEARCH R6 the recommended addition is
`refDate: new Date(template.refDate ?? SEED_REF_DATE),` with `SEED_REF_DATE` an exported const in
this file and `Ctx.refDate: Date` **required** (not optional).

⚠ Note the comment block above says "@faker-js/faker **v10**" — RESEARCH R11 measured the tree at
8.4.1, i.e. that comment is factually wrong. It is **out of scope** (Phase 152's class); RESEARCH
flags a one-word repair as optional only. Do not fold in.

---

### 2. `packages/dev-seed/src/generators/ElectionsGenerator.ts` (generator, batch)

**Analog: itself.** The generator receives the whole ctx at construction and destructures the fields
it needs. Adding a fourth field is a one-token edit. Verbatim, `:29-63`:

```ts
export class ElectionsGenerator {
  constructor(private ctx: Ctx) {}

  // see phase 56 ignores ctx here; see phase 57/58 generators read ctx.refs to scale counts.

  defaults(ctx: Ctx): ElectionsFragment {
    return { count: 1 };
  }

  generate(fragment: ElectionsFragment): Array<TablesInsert<'elections'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;
    const rows: Array<TablesInsert<'elections'>> = [];

    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...fx,
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      });
    }

    const n = fragment.count ?? 0;
    for (let i = 0; i < n; i++) {
      rows.push({
        external_id: `${externalIdPrefix}election_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: faker.lorem.words({ min: 2, max: 4 }) },
        short_name: { en: `E${i + 1}` },
        election_type: 'general',
        election_date: faker.date.future({ years: 1 }).toISOString().slice(0, 10),
        is_generated: true,
        sort_order: i,
        multiple_rounds: false,
        current_round: 1
      });
    }

    return rows;
```

**Pattern to copy — minimal diff, two tokens:**
1. `const { faker, projectId, externalIdPrefix, refDate } = this.ctx;`
2. `election_date: faker.date.future({ years: 1, refDate }).toISOString().slice(0, 10),`

The `.toISOString().slice(0, 10)` tail stays — RESEARCH R5 measured the emitted shape unchanged.
`defaults(ctx)` returning `{ count: 1 }` is the reason `runPipeline({seed:42})` drifts today
(RESEARCH R3.2) — **do not change it**.

⚠ The `// see phase 56 ignores ctx here; …` comment at `:32` and the header's `see phase 56` / `see
phase 58` bullets are **Phase 152's class** — do not touch while editing adjacent lines.

---

### 3. `packages/dev-seed/src/emitters/answers.ts` (emitter, transform)

**Analog: itself, but a DIFFERENT signature shape from the generator.** The switch lives in a
private helper whose signature is deliberately faker-only, not ctx-carrying. Verbatim, `:58-93`:

```ts
export function defaultRandomValidEmit(
  _candidate: TablesInsert<'candidates'>,
  questions: Array<TablesInsert<'questions'>>,
  ctx: Ctx
): Record<string, { value: unknown; info?: unknown }> {
  const out: Record<string, { value: unknown; info?: unknown }> = {};
  for (const q of questions) {
    const qExtId = q.external_id;
    if (!qExtId) continue;
    out[qExtId] = { value: emitValueFor(q, ctx.faker) };
  }
  return out;
}

// Compile-time assertion that `defaultRandomValidEmit` conforms to the
// `AnswerEmitter` seam signature. If the signature drifts, TS reports here.
const _typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit;
void _typecheckDefaultEmit;

function emitValueFor(q: TablesInsert<'questions'>, faker: Faker): unknown {
  const type = q.type as QuestionType;
  switch (type) {
    case 'text':
      return faker.lorem.sentence();
    ...
    case 'number':
      return emitNumberInDeclaredRange(q, faker);
    case 'boolean':
      return faker.datatype.boolean();
    case 'date':
      return faker.date.recent().toISOString();
```

**Pattern to copy — a third parameter, mirroring how `emitNumberInDeclaredRange(q, faker)` narrows
rather than takes the whole ctx:**
1. `:67` → `out[qExtId] = { value: emitValueFor(q, ctx.faker, ctx.refDate) };`
2. `:77` → `function emitValueFor(q: TablesInsert<'questions'>, faker: Faker, refDate: Date): unknown {`
3. `:91` → `return faker.date.recent({ refDate }).toISOString();`

`emitNumberInDeclaredRange(q, faker)` at `:134` stays untouched (it takes no date). Do **not** add
`days:` to `date.recent` — RESEARCH R5 forbids it as an uncovered behaviour change.

**Docstring that MUST move with the code** (`:52`, inside the `defaultRandomValidEmit` doc block):

```
 *  - `date` — `faker.date.recent().toISOString()`.
```

`packages/dev-seed/src/emitters/latent/project.ts:123` calls `defaultRandomValidEmit(…, ctx)` and
inherits the ref date with **no edit** (RESEARCH R6, verified).

---

### 4. Paired template-field declaration — `types.ts` + `schema.ts`

The project declares every optional template field **twice**. Both halves are mandatory; omitting the
schema half makes any template that sets the field fail validation, because `TemplateSchema` closes
with `.strict()`.

**Half A — `packages/dev-seed/src/template/types.ts:157-161`:**

```ts
export type Template = {
  seed?: number;
  externalIdPrefix?: string;
  projectId?: string;
  generateTranslationsForAllLocales?: boolean;
```

**Half A' — its authoring docstring, `types.ts:52-56` (the bullet a new field must mirror):**

```
 * ### Top-level fields
 *
 * - `seed: number` — fixed faker RNG seed for deterministic output.
 *   Default 42 (via `buildCtx`). Setting this guarantees byte-identical rows
 *   across runs at the same seed (NF-04).
```

**Half B — `packages/dev-seed/src/template/schema.ts:120-125` and the `.strict()` close at `:164`:**

```ts
export const TemplateSchema = z
  .object({
    seed: z.number().int().optional(),
    externalIdPrefix: z.string().optional(),
    projectId: z.string().regex(UUID_SHAPE, 'Invalid UUID').optional(),
    ...
    feedback: perEntityFragment.optional()
  })
  /**
   * ORDERING CHOICE (Phase 144, D-04): `.strict()` goes AFTER the `.extend()`
   * chain link, ...
   */
  .extend({ latent: latentBlock.optional() })
  .strict();
```

**Pattern to copy:** add the new field in all three places — one line after `seed?: number;` in the
type, one line after `seed: z.number().int().optional(),` in the schema, one bullet after the `seed`
bullet in the docstring. RESEARCH R6 measured `z.iso.datetime().optional()` as the correct zod-4.3.6
spelling (accepts `'2027-01-01T00:00:00.000Z'`, rejects `'2027-01-01'`).

⚠ The `ORDERING CHOICE (Phase 144, D-04)` comment sits between the object and `.strict()`. The new
field goes **inside** the `.object({…})` — do not disturb that comment.

---

### 5. `packages/dev-seed/src/index.ts` (barrel)

Runtime value exports are one-per-line, alphabetised by module path, in a block at `:90-126`; type
exports live in a separate block at `:129-159`. Verbatim, the neighbours of the insertion point:

```ts
export { buildCtx } from './ctx';
export { defaultRandomValidEmit } from './emitters/answers';
export { latentAnswerEmitter } from './emitters/latent/latentEmitter';
```

**Pattern to copy:** since `SEED_REF_DATE` lives in `src/ctx.ts` alongside `buildCtx`, the minimal
diff is to widen the existing line to `export { buildCtx, SEED_REF_DATE } from './ctx';` — matching
the multi-name style already used at `:101` (`export { fanOutLocales, LOCALES } from './locales';`)
and `:117` (`export { TemplateSchema, validateTemplate } from './template/schema';`).

The file's header docstring (`:1-30`) enumerates the public API in prose and is **saturated with
`see phase NN` planning references** — Phase 152's class. Add a new API bullet only if it can be
written cleanly (see § Shared Patterns); otherwise leave the header alone.

---

### 6. `packages/dev-seed/tests/determinism.test.ts` (test, assertion) — the guard's home

**Analog: itself.** The file is the package's determinism authority. Verbatim, the existing block
head and the case shape (`:14-38`):

```ts
import { describe, expect, it } from 'vitest';
import { fanOutLocales } from '../src/locales';
import { runPipeline } from '../src/pipeline';
import type { Template } from '../src/template/types';

describe('determinism (TMPL-08)', () => {
  it('same seed (42) produces byte-identical output across two fresh runs', () => {
    const run1 = runPipeline({ seed: 42 });
    const run2 = runPipeline({ seed: 42 });
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });

  it('different seeds produce different output', () => {
    const run1 = runPipeline({ seed: 42 });
    const run2 = runPipeline({ seed: 99 });
    expect(JSON.stringify(run1)).not.toEqual(JSON.stringify(run2));
  });
```

**And the load-bearing `makeTemplate()` factory pattern (`:63-79`), which the new cross-time case
MUST reuse** — templates are constructed fresh per `runPipeline` call because generators mutate
`fixed[]` arrays in place:

```ts
  it('Pitfall #1: runPipeline + fanOutLocales is deterministic at the same seed (…)', () => {
    const makeTemplate = () => ({
      seed: 42,
      generateTranslationsForAllLocales: true,
      elections: { count: 0, fixed: [{ external_id: 'e1', name: { en: 'Demo 1' } }] },
      organizations: {
        count: 0,
        fixed: [{ external_id: 'o1', name: { en: 'Org 1' }, color: '#111111' }]
      }
    });
    const t1 = makeTemplate();
    const run1 = runPipeline(t1);
    ...
    const t2 = makeTemplate();
    const run2 = runPipeline(t2);
```

**Pattern the new block copies:**
- a sibling `describe(...)` below `:109`'s close;
- a local `makeTemplate()` **factory** (never a shared object) — RESEARCH R3.3 gives the exact 5-field
  literal that reaches both faker sites;
- `expect(JSON.stringify(a)).toEqual(JSON.stringify(b))` as the comparison idiom;
- the import line at `:14` extended to `import { describe, expect, it, vi } from 'vitest';`.

**No analog exists for the fake-clock half.** `grep -rn "setSystemTime\|useFakeTimers"` across
`packages/`, `apps/`, `tests/` returns zero (RESEARCH R4, re-confirmed). The planner must write it
from RESEARCH R4's measured recipe rather than hunt for one: `vi.useFakeTimers({ toFake: ['Date'] })`,
`vi.setSystemTime(new Date('2026-01-15T00:00:00.000Z'))` / `'2026-09-15T00:00:00.000Z'`, and
`try { … } finally { vi.useRealTimers(); }` **inside each test** so a failing assertion cannot leave
the clock faked for the remaining 569 tests.

⚠ The comment block at `:40-61` is thick with `see phase 58 Plan 09` / `see phase 56` references —
Phase 152's class. Do not rewrite it; do not imitate it.

---

### 7. `packages/dev-seed/tests/utils.ts` (test factory) — the typecheck tripwire

RESEARCH R8 flags this as **the one file whose breakage surfaces in `tsc --noEmit`, not in vitest**.
Verbatim, `:18-43`:

```ts
export function makeCtx(overrides: Partial<Ctx> = {}): Ctx {
  const faker = new Faker({ locale: [en] });
  faker.seed(42);
  return {
    faker,
    projectId: '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: 'seed_',
    refs: {
      accounts: [{ id: '00000000-0000-0000-0000-000000000001' }],
      projects: [{ id: '00000000-0000-0000-0000-000000000001' }],
      elections: [],
      constituency_groups: [],
      constituencies: [],
      organizations: [],
      alliances: [],
      factions: [],
      candidates: [],
      question_categories: [],
      questions: [],
      nominations: [],
      app_settings: [],
      feedback: []
    },
    logger: () => {},
    ...overrides
  };
}
```

**Pattern to copy:** the literal is a complete `Ctx`, so a required `Ctx.refDate` must be supplied
here alongside `externalIdPrefix`: `refDate: new Date(SEED_REF_DATE),`. `...overrides` is spread
**LAST**, so per-test override of the ref date works with no further change. Caught by
`yarn workspace @openvaa/dev-seed typecheck`, wired into root `lint:check` via `turbo run typecheck`.

Files that do **not** need this edit (RESEARCH R6, verified): `tests/templates/nominations-override.test.ts:111`
(`} as Ctx;` assertion) and `tests/pipeline.test.ts:209` (`{ ...buildCtx({}), logger }` spread).

---

### 8. `packages/dev-seed/tests/cli/resolve-template.test.ts` (criterion 3 regression)

**The pattern already exists in this file, added by Phase 144.** RESEARCH R2a measured criterion 3
as already satisfied at HEAD; what follows is the shape the phase should **observe and cite**, not
re-invent. Fixture, `:16-27`:

```ts
/**
 * A built-in that has DRIFTED — it carries an unknown top-level key.
 *
 * Built through an intermediate variable on purpose. Excess property checking is
 * a fresh-object-literal rule, so a template that reaches the registry through a
 * variable bypasses the type layer entirely (the hole `144-02` documented on
 * `FixedRow`). That is exactly the case the zod layer has to catch, so the
 * fixture is constructed the way the hole actually manifests rather than with a
 * cast that would prove nothing about the real failure mode.
 */
const driftedBuiltIn = { seed: 7, totallyUnknownTopLevelKey: 'drift' };
const DRIFTED_BUILT_INS: Record<string, Template> = { 'negctl-builtin': driftedBuiltIn };
```

Cases, `:115-130` — the async `rejects.toThrow(/regex/)` idiom, one regex per assertion:

```ts
  it('D-07: throws for a built-in carrying an unknown top-level key (was returned unvalidated)', async () => {
    await expect(resolveTemplate('negctl-builtin', DRIFTED_BUILT_INS)).rejects.toThrow(/Template validation failed/);
    await expect(resolveTemplate('negctl-builtin', DRIFTED_BUILT_INS)).rejects.toThrow(
      /Unrecognized key.*"totallyUnknownTopLevelKey"/
    );
  });

  it('D-07: a valid built-in still resolves, unchanged in substance', async () => {
    const r = await resolveTemplate('default', { default: minimal });
    expect(r).toEqual(minimal);
  });

  it('D-07: the `Unknown template:` path is unchanged by the added validation', async () => {
    await expect(resolveTemplate('nope', DRIFTED_BUILT_INS)).rejects.toThrow(/Unknown template: 'nope'/);
    await expect(resolveTemplate('nope', DRIFTED_BUILT_INS)).rejects.toThrow(/negctl-builtin/);
  });
```

**Planner implication:** criterion 3's "remaining work = one regression test" (RESEARCH R2a) is
**also already present**. The honest disposition is to cite these three cases as the committed guard
and record criterion 3 as retired on evidence — not to add a fourth near-duplicate. Note the
`// ── D-07 (Phase 144) —` comment header at `:106-113` is 152's class; do not imitate its style for
any new case this phase adds.

---

### 9. `packages/dev-seed/tests/template.test.ts` (criterion 4 negative control + regression)

**Analog: the file's own synchronous throw idiom.** Verbatim, `:20-56`:

```ts
import { describe, expect, it } from 'vitest';
import { validateTemplate } from '../src/template/schema';

describe('validateTemplate', () => {
  it('TMPL-02: {} template passes validation (every field is optional)', () => {
    expect(() => validateTemplate({})).not.toThrow();
    expect(validateTemplate({})).toEqual({});
  });

  it('TMPL-09: nested field-path error — candidates.count: "not-a-number"', () => {
    expect(() => validateTemplate({ candidates: { count: 'not-a-number' } })).toThrow(/template\.candidates\.count/);
  });

  it('TMPL-09: top-level field-path error — seed: "forty-two"', () => {
    expect(() => validateTemplate({ seed: 'forty-two' })).toThrow(/template\.seed/);
  });

  it('accepts valid top-level fields (seed, externalIdPrefix, projectId)', () => {
    expect(() =>
      validateTemplate({
        seed: 42,
        externalIdPrefix: 'test_',
        projectId: '00000000-0000-0000-0000-000000000001'
      })
    ).not.toThrow();
  });
```

And the round-trip idiom for accepted input, `:126-138`:

```ts
    const input = { candidates: { fixed: [{ external_id: 'my_cand', totally_made_up_column: 1 }] } };
    expect(validateTemplate(input)).toEqual(input);

  it('D-04: `.strict()` does not break the `.extend({ latent })` chain link', () => {
    const input = { latent: { dimensions: 2, eigenvalues: [1, 0.5] } };
    expect(validateTemplate(input)).toEqual(input);
  });
```

**Patterns to copy, three new cases:**
- **Criterion 4 negative control** (RESEARCH R2b's "cheapest honest control" — expresses the pre-144
  behaviour without source archaeology, since the pre-144 body was `safeParse` alone):
  `expect(TemplateSchema.safeParse(badTemplate).success).toBe(true);` — requires widening the import
  line to `import { TemplateSchema, validateTemplate } from '../src/template/schema';`.
- **Criterion 4 regression:**
  `expect(() => validateTemplate(badTemplate)).toThrow(/external_id: Expected a non-empty string/);`
  matching the `toThrow(/regex/)` house idiom above.
- **New `refDate` field:** an accept case in the `accepts valid top-level fields` shape and a reject
  case in the `TMPL-09: top-level field-path error` shape (`toThrow(/template\.refDate/)`).

---

### 10. D-C3 comment site 1 — `packages/dev-seed/src/template/types.ts:113-121`

RESEARCH § R9 pastes this verbatim with line numbers; **not reproduced here**. The stub is `:118`
(`* - — latent`), continuing `:119-120`. Reviewer offered either completion or deletion (Claude's
Discretion). If completing, RESEARCH names the correct targets: `./schema.ts`'s `latentBlock`
(`schema.ts:75-100`) or `../emitters/latent/latentEmitter.ts`.

⚠ The sibling bullet at `:115` carries `(see phase 58 DX-01)` and `:77` carries `see phase 57` —
both **Phase 152's class**. Edit `:118` only.

### 11. D-C3 comment site 2 — `packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts:44-51`

Verbatim in context (`:38-53`), so the planner sees the enclosing call:

```ts
export const showFeedbackSurveyTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    header: { showFeedback: true },
    // NB: showFeedbackPopup / showSurveyPopup are countdown delays in SECONDS
    // (appContext.svelte.ts:414-437 schedule `setTimeout(…, delay * 1000)`), NOT
    // milliseconds. The prior 180 / 500 values were 3 min / ~8 min — the popups
    // never surfaced inside the test window (see phase 120 trace-confirmed; see
    // ). A 1-second delay is the type-correct "small
    // positive delay" the popup needs to enqueue promptly on /results.
    results: { showSurveyPopup: 1, showFeedbackPopup: 1 },
    survey: { linkTemplate: 'https://example.com/survey?session={sessionId}', showIn: ['resultsPopup'] }
  }
});
```

Two defects in one span: the dangling `; see` / `// ).` fragment at `:48-49`, **and** the
`see phase 120` planning reference plus the "prior 180 / 500 values" historical narrative — both of
which D-N1 forbids the replacement from carrying. RESEARCH R9 sketches a compliant rewrite; the
house-style target is § Shared Patterns below.

---

### 12. `.planning/todos/pending/2026-08-28-<slug>.md` (O-4 todo, per D-N2)

**Analog: `.planning/todos/pending/2026-08-12-data-filters-unit-tests-not-in-ci.md`.** Verbatim head
and section shape:

```markdown
---
created: 2026-08-12
source: Phase 136 plan 136-06 (D-136-06-1)
resolves_phase: null
severity: high
area: CI / packages
---

# @openvaa/data and @openvaa/filters unit tests are executed by NO CI command

## The hole

`yarn test:unit` is `turbo run test:unit`, which only runs workspaces that DECLARE a `test:unit`
script: ...

## Why it was not fixed in-phase

Wiring the two packages in turns `yarn test:unit` **RED** on a pre-existing failure: ...

## The decision required

- **Option A — pin the test locale.** Smallest diff. Leaves a formatter whose output depends on the
  machine it runs on.
- **Option B — make `formatDateAnswer` take an explicit locale** ... **Recommended.**

## After the decision

1. ...

## Related

- `.planning/audits/2026-08-11-fake-guard-sweep.md` — F5 (the same pathology in CI env wiring)
```

**Pattern to copy exactly:** filename `YYYY-MM-DD-<kebab-slug>.md`; frontmatter keys in the order
`created`, `source`, `resolves_phase`, `severity`, `area`; body = H1 title, then `## The hole`,
`## Why it was not fixed in-phase`, `## The decision required` (options with one marked
**Recommended**), `## After the decision` (numbered steps), `## Related`.

Content per RESEARCH R10: the 22 measured `election_date: '2026-06-15'` sites (list is pasted in
full in RESEARCH R10 — copy it from there, do not re-grep), plus the note that several perm E2E
specs may assert against the date so a refresh is a real change, not a find-and-replace. Also fold
in RESEARCH R6.1's "wrinkle": the only `date`-typed question in the repo is a **date of birth**
(`e2e/base.ts:757`), which `date.recent()` already rendered as nonsense and a 2027 ref date renders
as a nonsense *future* DOB — fires under no built-in, so a note here is the right disposition.
Recommended header values: `created: 2026-08-28`, `source: Phase 154 (CONTEXT O-4)`,
`resolves_phase: null`, `severity: low`, `area: packages/dev-seed templates`. **Not blocking.**

---

## Shared Patterns

### Clean-comment house style (the D-N1 target for every comment this phase writes)

**Apply to:** the new `SEED_REF_DATE` const doc, the new `refDate` docstring bullets, the new guard
block's comments, and both D-C3 rewrites.

Most comments in `packages/dev-seed/src` are **contaminated** (`see phase 56`, `Phase 144, D-04`,
`Plan 09`, `per RESEARCH`) and are Phase 152's sweep corpus — they are **anti-patterns**, not models.
Three genuinely clean in-package comments to imitate:

**A — `src/emitters/answers.ts:73-74`** (a two-line rationale, no phase/plan/decision id, no
planning path, no historical narrative):

```ts
// Compile-time assertion that `defaultRandomValidEmit` conforms to the
// `AnswerEmitter` seam signature. If the signature drifts, TS reports here.
const _typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit;
```

**B — `src/emitters/answers.ts:105-108`** (a block docstring stating the invariant and who pins it,
by test file path — an in-tree path, which is permitted; planning-artifact paths are not):

```ts
/**
 * The span used for a `number` question that declares no range of its own.
 * Pinned by `tests/emitters/answers.test.ts` so it cannot be dropped silently.
 */
const NUMBER_FALLBACK_RANGE = { min: 0, max: 100 } as const;
```

**C — `src/emitters/answers.ts:127-131`** (the closing paragraphs of `emitNumberInDeclaredRange`'s
doc — states a design choice and the reason, in present tense, with no history):

```
 * A malformed declaration (`min > max`) is deliberately NOT papered over: faker
 * throws, the seed run fails loudly, and the template author sees the real
 * error rather than a silently-substituted span.
 *
 * ONE `faker.number.int` draw whatever the range — the pinned-seed determinism
 * contract depends on the number of faker reads per question staying fixed.
 */
```

**The rule these three exhibit, and the new comments must satisfy:** present-tense statement of what
the code does and why, naming in-tree files/symbols where useful; **no** phase numbers, **no** plan
numbers, **no** decision ids (`D-07`, `TMPL-08`, `NF-04`), **no** `.planning/` paths, **no** "the
prior value was…" narrative, **no** forced line breaks mid-span.

⚠ Counter-example from the same file, `:127-128` — do **not** imitate: *"the defect closed in
145-04.1, which was latent only because anon could not see candidates until 145-04"*. That is 152's
class sitting inside an otherwise-clean doc block. Leave it; do not copy it.

### Fresh-factory-per-run test discipline

**Source:** `packages/dev-seed/tests/determinism.test.ts:52-61` (comment) and `:64-79` (code).
**Apply to:** every new test in this phase that calls `runPipeline` more than once.

Generators mutate `fragment.fixed[]` arrays in place, so a template object shared across two
`runPipeline` calls leaks state into the second. Always build via a `makeTemplate()` arrow, never a
module-level const. This is doubly load-bearing for the cross-time guard, whose entire claim is
"identical output" — a shared template would produce a false negative.

### Fake-timer teardown

**Source:** none in repo (greenfield). **Apply to:** every test in the new cross-time describe block.
Per RESEARCH R4: `vi.useFakeTimers({ toFake: ['Date'] })` (minimum blast radius; the bare default
also works but says less), and `try { … } finally { vi.useRealTimers(); }` **inside each test**. An
`afterEach(() => vi.useRealTimers())` is acceptable belt-and-braces but insufficient alone.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| the `vi.setSystemTime` guard block in `tests/determinism.test.ts` | test (fake-clock) | assertion | Zero repo precedent — `grep -rn "setSystemTime\|useFakeTimers"` across `packages/`, `apps/`, `tests/` returns no hits (RESEARCH R4, re-confirmed this session). Use RESEARCH R4's measured recipe and R3.3's measured template literal; the surrounding `describe`/`it`/factory shape still copies § 6 above. |

---

## Metadata

**Analog search scope:** `packages/dev-seed/src/**`, `packages/dev-seed/tests/**`,
`.planning/todos/pending/`
**Files read this session:** 11 (`ctx.ts`, `ElectionsGenerator.ts`, `answers.ts`,
`template/types.ts`, `template/schema.ts`, `index.ts`, `templates/e2e/perm/show-feedback-survey.ts`,
`tests/determinism.test.ts`, `tests/utils.ts`, `tests/cli/resolve-template.test.ts`,
`tests/template.test.ts`) plus one todo exemplar
**Sections deferred to RESEARCH.md rather than re-derived:** R1 (site excerpts), R2a/R2b (validator
bodies), R3.3 (control template literal), R4 (fake-timer mechanics), R5 (`refDate` semantics), R6
(carrier map), R9 (comment site 1 verbatim), R10 (22-site list, todo convention)
**Pattern extraction date:** 2026-08-28
