import path from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Lock-in self-test — the PARSE-POSTURE ESLint guard (criterion 6, decisions **D1(a)** and **D2(a)**, requirement **D8**).
 *
 * The guard is five esquery selectors expressed as `no-restricted-syntax` entries, and this spec proves each one fires on the shape it was measured to catch — individually, by message substring, never as "some selector fired". That distinction is load-bearing here in a way it was not for the boundary guard: three of the violation fixtures are caught by exactly ONE selector each (`157.1-RESEARCH.md` § "The five selectors": V4 and V7 by G5 alone, V9 by G4 alone), so an assertion that merely counted messages would stay green after four of the five selectors were deleted.
 *
 * Matrix axes and the deliberate trim. Following the boundary guard's trim reasoning, the axes are THREE guarded directories — the three structurally distinct adapter loci a degrade-to-empty can be written in: the shared JSONB utils, the read path and the write path — times the violation fixtures times two assertions (fires with the right message substring; parses without a fatal message), plus one silence assertion per compliant fixture, two allowed-locus probes, one real-file probe and two standing regressions. The extension axis of the analog is dropped on purpose: every parse-posture fixture is a `.ts` body, because there are no `.svelte` files under the adapter and the shape being banned is not one a component can express.
 *
 * Stable anchor, deliberately NOT a line citation: the guard lives in `apps/frontend/eslint.config.mjs`, in the config object whose `files` glob is `src/lib/api/adapters/**` and whose rule key is `no-restricted-syntax`. Line ranges move on every edit; globs and rule keys do not.
 *
 * Correctness invariants, each one a distinct way this spec could hand back a false PASS:
 *
 * 1. Every probe `filePath` MUST resolve under `apps/frontend/src` (see `SRC` below), or the guard block's `files` scope simply does not apply and every assertion passes vacuously. The paths are VIRTUAL — no file is ever written to any of them.
 * 2. The `ESLint` construction below MUST carry the ESLint v10 config-lookup-from-file flag (the literal flag name appears exactly once in this file, on that construction, so a grep can prove it is present). It loads the real `apps/frontend/eslint.config.mjs` and matches `apps/frontend/package.json`'s lint script exactly; omitting it risks config-resolution drift, and this spec would then measure a different config than the gate does.
 * 3. Assert on `ruleId`, never on a bare problem count. A violating fixture also trips unrelated rules — `unused-imports/no-unused-vars` among them — so a count assertion would pass for the wrong reason.
 * 4. SEVEN entries share `ruleId === 'no-restricted-syntax'` under this block (the five parse-posture selectors plus the two re-included inherited ones). Assertions therefore disambiguate on the MESSAGE SUBSTRING and NEVER on line or column. Line and column move with any edit; the messages are the contract.
 * 5. The flat-config REPLACE trap gets a standing regression case PER INHERITED ENTRY. Flat config REPLACES a rule's options array per-file rather than merging it (`157-NEGATIVE-CONTROL-LEDGER.md` § Probe: `PROBE VERDICT: REPLACE`, measured for both restricted rules), so a new block that sets `no-restricted-syntax` for adapter files replaces the inherited array wholesale. Dropping an inherited entry produces ZERO errors on the real tree — the adapter contains no enums and no dynamic store imports today — so no other gate in this repository would catch it, and these two cases are the only detector.
 * 6. The guard must be silent where the shape is legitimate, and the two ALLOWED-LOCUS probes are what make "it fires" a property of the SCOPE rather than of the fixture: the same violating source is linted at `lib/api/base` and `lib/utils`, both outside the block's `files` glob, and must come back clean.
 * 7. Nothing in this file asserts how many records the tree emits at any log level. Decision **C5**'s NOTE is binding: after this phase the non-test tree has ZERO `log.warn` sites and that is the expected end state, so a self-test that counted levels would encode a defect as a requirement.
 *
 * ACTIVATED (`157.1-07`, wave 6). The parse-posture block now exists in `apps/frontend/eslint.config.mjs` and every case below is live. The fixture tables, the selector strings, the guarded directories and the allowed loci were transcribed HERE first, by `157.1-01`, in the plan that changed no application source, precisely so `157.1-07` could copy them into the config rather than re-derive them — a re-derived selector is a different selector, and the four evasion fixtures exist because the obvious derivations miss them. That copy went the other way too: the config block's message strings are the CONTRACT this file disambiguates on, and the config's are longer than the substrings below (each names the shape and then points at `ParseOutcome` as the alternative), so the assertions match by `includes` and a config message may only ever be EXTENDED, never re-worded through its first clause.
 *
 * WHAT WAS MEASURED WHEN THIS FILE WENT LIVE, recorded in `157.1-NEGATIVE-CONTROL-LEDGER.md` rows 6 and 7 with transcripts. Row 6: the same twelve fixtures, run through the same extraction of the tables below, were **silent 0/36** across the three guarded directories before the block existed and fire **36/36** after it. Row 7: with the block installed but its two re-included inherited entries omitted, an `export enum` and a dynamic `svelte/store` import at a guarded adapter path both returned ZERO messages of any kind — while the five parse-posture selectors were firing 12/12 — which is precisely why the two standing regressions at the foot of this file are not redundant with anything.
 *
 * TRANSCRIPTION NOTE, kept because the reconciliation is the point and not because the question is still open. Wave 0 found `157.1-01-PLAN.md`, `157.1-07-PLAN.md` and `157.1-VALIDATION.md` describing research's scored set as ELEVEN violation fixtures, while research's own scored table (`157.1-RESEARCH.md` § "The five selectors — written, executed, and scored against 17 fixtures") lists TWELVE violation rows (V1, V2, V2b, V3, V4, V5, V5b, V6, V7, V8, V9, V10) and FIVE silent compliant rows (C1, C2, C3, C4, C8), with a sixth compliant fixture — C7 — recorded separately in § "What the guard cannot see" as the one measured false positive. This file transcribed what was MEASURED: twelve violations and six compliant fixtures, C7 among them and flagged non-silent. The count was **SETTLED at TWELVE** and the plan documents were amended to match; the ledger's closing note records that ruling. Dropping a measured violation to reach eleven, or inventing a sixth silent fixture that was never scored, would each be a fabrication in a phase whose entire subject is not fabricating evidence.
 */

// MANDATORY (invariant 2): loads the real apps/frontend/eslint.config.mjs.
const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });

// MANDATORY (invariant 1): every probe path resolves under apps/frontend/src, which is what puts the fixture inside the guard block's `files` scope. The paths below are VIRTUAL — no file is ever written to them; they are only passed as `lintText`'s `filePath` option.
const SRC = path.resolve(__dirname, '../..');

/** The three structurally distinct adapter loci a degrade-to-empty can be written in: the shared JSONB utils, the read path, the write path. */
const GUARDED_DIRS = [
  'lib/api/adapters/supabase/utils',
  'lib/api/adapters/supabase/dataProvider',
  'lib/api/adapters/supabase/dataWriter'
] as const;

/** Two loci OUTSIDE the block's `files` glob. The same violating source must be silent here, or "it fires" is a property of the fixture rather than of the scope (invariant 6). */
const ALLOWED_LOCI = ['lib/api/base', 'lib/utils'] as const;

/** The two real adapter files the refactor touches. The real-file probe lints these rather than a fixture; it is the case that goes red if plans 04-06 left a degrade branch behind. */
const REAL_FILES = [
  'lib/api/adapters/supabase/utils/parseJsonbColumn.ts',
  'lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts'
] as const;

/*
 * The five selectors, TRANSCRIBED VERBATIM from `157.1-RESEARCH.md` § "The five selectors — written, executed, and scored against 17 fixtures". They were written and EXECUTED there against the fixture set below; they are not re-derived here and must not be re-derived in `157.1-07`.
 *
 * ⚠ THE ESQUERY TRAP, measured and not to be repeated: `[argument.name='undefined']` matches whenever the attribute is JavaScript-`undefined` — it fired at `return {};` in a fixture containing no `undefined` identifier anywhere, which over-fires on every empty-object return. Every `undefined` arm below is therefore PAIRED with an argument-type guard, `[argument.type='Identifier'][argument.name='undefined']`.
 * Do not simplify them.
 *
 * ⚠ DO NOT WIDEN G2. An earlier draft that also banned an `undefined` alternate fired on fixture C4 — the compliant partial-preserve shape that decision A2 REQUIRES. The published form bans only empty object and empty array alternates.
 */

const FAIL_BRANCH =
  ':matches(' +
  "IfStatement[test.type='UnaryExpression'][test.operator='!'][test.argument.type='MemberExpression'][test.argument.property.name='success']," +
  "IfStatement[test.type='UnaryExpression'][test.operator='!'][test.argument.type='Identifier'][test.argument.name='success']," +
  "IfStatement[test.type='BinaryExpression'][test.left.property.name='success'][test.right.value=false]," +
  "IfStatement[test.type='BinaryExpression'][test.left.name='success'][test.right.value=false])";

const OK_BRANCH =
  ":matches(IfStatement[test.type='MemberExpression'][test.property.name='success'],IfStatement[test.type='Identifier'][test.name='success'])";

const EMPTY =
  ":matches([argument.type='ObjectExpression'][argument.properties.length=0]," +
  "[argument.type='ArrayExpression'][argument.elements.length=0]," +
  "[argument.type='Identifier'][argument.name='undefined']," +
  "[argument.type='Literal'][argument.value=null])";

/** The five measured selectors, keyed by the research ids `157.1-07` must keep. */
const SELECTORS = {
  /** An empty-literal / `undefined` / `null` / bare return inside a `safeParse`-failure branch. */
  G1: `${FAIL_BRANCH} :matches(ReturnStatement${EMPTY}, ReturnStatement:not([argument]))`,
  /** `parsed.success ? parsed.data : {}` — the shipped `supabaseDataProvider` shape. */
  G2:
    ":matches(ConditionalExpression[test.type='MemberExpression'][test.property.name='success'], ConditionalExpression[test.type='Identifier'][test.name='success'])" +
    ":matches([alternate.type='ObjectExpression'][alternate.properties.length=0], [alternate.type='ArrayExpression'][alternate.elements.length=0])",
  /** `parseAnswersColumn(…) ?? {}` — fact 5's exact line. */
  G3:
    "LogicalExpression[operator='??'][left.callee.name=/^parse[A-Z]/]" +
    ":matches([right.type='ObjectExpression'][right.properties.length=0], [right.type='ArrayExpression'][right.elements.length=0], [right.type='Literal'][right.value=null])",
  /** The inverted form: `if (parsed.success) return data; return {};` */
  G4: `${OK_BRANCH}:not([alternate]) + :matches(ReturnStatement${EMPTY})`,
  /** A failure-branch return carrying NEITHER `issues` NOR `error` — the positive requirement, and the only selector that catches V4 and V7. */
  G5: `${FAIL_BRANCH} ReturnStatement:not(:has(Identifier[name=/^(issues|error)$/]))`
} as const;

/**
 * The message substring each selector's `no-restricted-syntax` entry must carry.
 *
 * These are the CONTRACT between this spec and the config block `157.1-07` installs: the assertions disambiguate on message and never on line or column, so a message edit in the config without the matching edit here silently turns a firing case into a false pass. Change both together, or neither.
 */
const MESSAGES = {
  G1: 'A parse-failure branch must not return an empty value',
  G2: 'A `.success` conditional must not fall back to an empty literal',
  G3: 'A `parse*` call must not fall back to an empty literal',
  G4: 'An inverted `.success` branch must not fall through to an empty return',
  G5: 'A parse-failure return must carry `issues`'
} as const;

type SelectorId = keyof typeof SELECTORS;

/**
 * Ambient declarations prefixed to every fixture body so each one is a self-contained, parseable module.
 * None of these statements matches any of the five selectors, so the prelude cannot change what a fixture measures.
 */
const PRELUDE = [
  'declare const raw: unknown;',
  'declare const Schema: { safeParse: (value: unknown) => { success: boolean; data: Record<string, unknown>; error: { issues: Array<{ path: Array<string> }> } } };',
  'declare function report(context: unknown): void;',
  'declare function parseAnswersColumn(value: unknown, source: unknown): Record<string, unknown> | undefined;',
  'declare function parseMalformed(issues: Array<unknown>, value?: unknown): unknown;',
  'declare const stored: { maybe?: Record<string, unknown> };',
  'declare const source: { column: string };',
  '',
  ''
].join('\n');

/**
 * The TWELVE violation fixtures research scored, each paired with every selector measured to catch it and with the message substring of the selector the firing assertion disambiguates on.
 *
 * `selectorIds` records the FULL measured result, so a future reader can see that V4, V7 and V9 are each caught by a single selector — the reason no assertion in this file may settle for "some selector fired".
 */
const VIOLATIONS = [
  {
    name: 'V1 — a failure branch returning `undefined` (parseImageColumn / parseAnswersColumn shape)',
    selectorIds: ['G1', 'G5'] satisfies Array<SelectorId>,
    assertOn: 'G1' satisfies SelectorId,
    source:
      'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    report(source);\n    return undefined;\n  }\n  return parsed.data;\n}\n'
  },
  {
    name: 'V2 — a failure branch returning `{}` (_getAppSettings shape)',
    selectorIds: ['G1', 'G5'] satisfies Array<SelectorId>,
    assertOn: 'G1' satisfies SelectorId,
    source:
      'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    report(source);\n    return {};\n  }\n  return parsed.data;\n}\n'
  },
  {
    name: 'V2b — the same, written without block braces',
    selectorIds: ['G1', 'G5'] satisfies Array<SelectorId>,
    assertOn: 'G1' satisfies SelectorId,
    source:
      'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) return {};\n  return parsed.data;\n}\n'
  },
  {
    name: 'V3 — a `.success` conditional with an empty-object alternate (parseStoredCustomization retry shape)',
    selectorIds: ['G2'] satisfies Array<SelectorId>,
    assertOn: 'G2' satisfies SelectorId,
    source:
      'export function probe() {\n  const retry = Schema.safeParse(raw);\n  return retry.success ? retry.data : {};\n}\n'
  },
  {
    name: 'V4 — a fabricated success literal on the write path (sendEmail shape); G5 alone can see it',
    selectorIds: ['G5'] satisfies Array<SelectorId>,
    assertOn: 'G5' satisfies SelectorId,
    source:
      "export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    return { type: 'success', sent: 0, failed: 0, results: [] };\n  }\n  return parsed.data;\n}\n"
  },
  {
    name: 'V5 — a `parse*` call with an empty-object `??` fallback (fact 5)',
    selectorIds: ['G3'] satisfies Array<SelectorId>,
    assertOn: 'G3' satisfies SelectorId,
    source: 'export function probe() {\n  return parseAnswersColumn(raw, source) ?? {};\n}\n'
  },
  {
    name: 'V5b — the same with a `null` fallback',
    selectorIds: ['G3'] satisfies Array<SelectorId>,
    assertOn: 'G3' satisfies SelectorId,
    source: 'export function probe() {\n  return parseAnswersColumn(raw, source) ?? null;\n}\n'
  },
  {
    name: 'V6 — a destructured `success` failure branch returning `{}`',
    selectorIds: ['G1', 'G5'] satisfies Array<SelectorId>,
    assertOn: 'G1' satisfies SelectorId,
    source:
      'export function probe() {\n  const { success, data } = Schema.safeParse(raw);\n  if (!success) return {};\n  return data;\n}\n'
  },
  {
    name: 'V7 — EVASION: a module-level empty constant returned from the failure branch; G5 alone can see it',
    selectorIds: ['G5'] satisfies Array<SelectorId>,
    assertOn: 'G5' satisfies SelectorId,
    source:
      'const EMPTY = {};\n\nexport function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) return EMPTY;\n  return parsed.data;\n}\n'
  },
  {
    name: 'V8 — EVASION: `success === false` instead of `!success`',
    selectorIds: ['G1', 'G5'] satisfies Array<SelectorId>,
    assertOn: 'G1' satisfies SelectorId,
    source:
      'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (parsed.success === false) return {};\n  return parsed.data;\n}\n'
  },
  {
    name: 'V9 — EVASION: the inverted form, an empty return after a brace-less success branch; G4 alone can see it',
    selectorIds: ['G4'] satisfies Array<SelectorId>,
    assertOn: 'G4' satisfies SelectorId,
    source:
      'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (parsed.success) return parsed.data;\n  return {};\n}\n'
  },
  {
    name: 'V10 — EVASION: a bare `return;` in the failure branch',
    selectorIds: ['G1', 'G5'] satisfies Array<SelectorId>,
    assertOn: 'G1' satisfies SelectorId,
    source:
      'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    return;\n  }\n  return parsed.data;\n}\n'
  }
] as const;

/**
 * The SIX compliant fixtures research scored. Five are measured SILENT and are the negative control that keeps "it fires" a discriminating signal rather than a constant.
 *
 * C7 is the sixth, and it is measured NON-silent: `return malformed(parsed)` trips G5, because the return carries neither `issues` nor `error`. That is G5's one measured false positive, and it is recorded here rather than hidden, because the mitigation is a design constraint on `157.1-03`: the outcome constructors take the issues as an argument (`parseMalformed(issues, value)`), so the identifier IS present at the call site and the shape the adapter actually ships stays silent. Its case below asserts the mitigated form and names the unmitigated one, so a future edit that drops the `issues` parameter is not a silent regression.
 */
const CLEAN = [
  {
    name: 'C1 — a compliant malformed outcome carrying its issues',
    silent: true,
    source:
      "export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    return { status: 'malformed', issues: parsed.error.issues };\n  }\n  return { status: 'ok', value: parsed.data };\n}\n"
  },
  {
    name: 'C2 — an unrelated `??` fallback on a non-`parse*` call; G3 must discriminate on the callee name',
    silent: true,
    source: 'export function probe() {\n  return stored.maybe ?? {};\n}\n'
  },
  {
    name: 'C3 — a compliant absent guard ahead of the parse',
    silent: true,
    source:
      "export function probe() {\n  if (raw == null) {\n    return { status: 'absent' };\n  }\n  const parsed = Schema.safeParse(raw);\n  return parsed.success ? { status: 'ok', value: parsed.data } : { status: 'malformed', issues: parsed.error.issues };\n}\n"
  },
  {
    name: 'C4 — the compliant partial-preserve shape A2 REQUIRES: an `undefined` conditional alternate',
    silent: true,
    source:
      'export function probe() {\n  const retry = Schema.safeParse(raw);\n  return { value: retry.success ? retry.data : undefined };\n}\n'
  },
  {
    name: 'C7 — G5s one measured false positive, in the MITIGATED form the constructors make possible',
    silent: false,
    source:
      'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    return parseMalformed(parsed.error.issues);\n  }\n  return parsed.data;\n}\n',
    /** The form research measured firing G5. It is NOT asserted silent; it is recorded so the mitigation cannot be dropped by accident. */
    unmitigatedSource:
      'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    return parseMalformed(raw);\n  }\n  return parsed.data;\n}\n'
  },
  {
    name: 'C8 — the compliant inverted form, both branches carrying a status',
    silent: true,
    source:
      "export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (parsed.success) return { status: 'ok', value: parsed.data };\n  return { status: 'malformed', issues: parsed.error.issues };\n}\n"
  }
] as const;

/** The message substrings the parse-posture block's OWN five entries carry, so a silence probe cannot be satisfied by an inherited ban staying quiet. */
const PARSE_POSTURE_MESSAGES = Object.values(MESSAGES);

/**
 * Reduce a lint result to the messages this guard owns.
 * @param messages - The messages ESLint returned.
 * @returns Only the parse-posture guard's own messages.
 */
function postureMessages(messages: Array<{ ruleId: string | null; message: string }>) {
  return messages.filter(
    (m) => m.ruleId === 'no-restricted-syntax' && PARSE_POSTURE_MESSAGES.some((s) => m.message.includes(s))
  );
}

const cases = GUARDED_DIRS.flatMap((dir) => VIOLATIONS.map((v) => [dir, v.name] as const));

/**
 * Look a violation fixture up by name.
 * @param name - The fixture name.
 * @returns The fixture record.
 */
function fixtureFor(name: string) {
  const found = VIOLATIONS.find((v) => v.name === name);
  if (!found) throw new Error(`unknown fixture: ${name}`);
  return found;
}

describe('parse-posture ESLint guard — criterion 6, D1/D2', () => {
  // Invariant 8, from a measured gate failure recorded in `eslint-store-guard.test.ts` and reused by the boundary guard: the FIRST `lintText` call in a file pays the one-time cost of resolving the real flat config and loading the typescript-eslint parser. Left unhoisted, that cost is charged to whichever assertion happens to run first, against vitest's DEFAULT 5000ms per-test budget — so the outcome depends on how busy the machine is rather than on the guard under test. Measured there: 651-1047ms alone, 5391ms inside the full frontend suite under concurrent load, failing with `Test timed out in 5000ms`. That is the timing-fragility class CLAUDE.md forbids treating as flaky, and the fix is to remove the cost from the budget rather than to widen it.
  beforeAll(async () => {
    await eslint.lintText(PRELUDE + CLEAN[0].source, {
      filePath: path.join(SRC, GUARDED_DIRS[0], '__parse_posture_warmup__.ts')
    });
  }, 120_000);

  // LIVE at `157.1-01`, and the only live case in this file until `157.1-07` installs the block. It measures the APPARATUS rather than the guard: that the config-lookup flag on the `ESLint` construction really resolves this repository's own flat config for a guarded adapter path. Invariant 2 is otherwise unobservable — a construction that silently resolved no config would make every todo case below pass vacuously the moment it was flipped live.
  it('resolves the real flat config for a guarded adapter path', async () => {
    const config = await eslint.calculateConfigForFile(path.join(SRC, GUARDED_DIRS[0], '__parse_posture_probe__.ts'));

    expect(config.rules).toBeDefined();
    expect(Object.keys(config.rules ?? {})).toContain('no-restricted-syntax');
  });

  describe.each(cases)('guard reach: src/%s/__parse_posture_probe__.ts — %s', (dir, name) => {
    const probePath = path.join(SRC, dir, '__parse_posture_probe__.ts');
    const fixture = fixtureFor(name);

    it(`fires ${fixtureFor(name).assertOn} on the violation`, async () => {
      const [result] = await eslint.lintText(PRELUDE + fixture.source, { filePath: probePath });
      const hits = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes(MESSAGES[fixture.assertOn])
      );
      expect(hits.length).toBeGreaterThan(0);
    });

    // Guards the negative control itself: a parse failure yields a fatal message and would otherwise read as "silent".
    it('parses without a fatal message', async () => {
      const [result] = await eslint.lintText(PRELUDE + fixture.source, { filePath: probePath });
      expect(result.messages.filter((m) => m.fatal)).toEqual([]);
    });
  });

  describe('compliant shapes stay silent (negative control)', () => {
    it.each(CLEAN.filter((c) => c.silent).map((c) => [c.name] as const))('stays silent on %s', async (name) => {
      const fixture = CLEAN.find((c) => c.name === name);
      const [result] = await eslint.lintText(PRELUDE + (fixture?.source ?? ''), {
        filePath: path.join(SRC, GUARDED_DIRS[0], '__parse_posture_probe__.ts')
      });
      expect(postureMessages(result.messages)).toEqual([]);
    });

    // C7, recorded rather than hidden. The MITIGATED form — the one the outcome constructors make possible, where `issues` is passed as an argument — must be silent. The unmitigated `parseMalformed(raw)` form was measured to trip G5, and this case is what would go red if `157.1-03` ever dropped the issues parameter and the adapter reverted to it.
    it('stays silent on the mitigated constructor call that carries its issues (C7)', async () => {
      const c7 = CLEAN.find((c) => !c.silent);
      const [result] = await eslint.lintText(PRELUDE + (c7?.source ?? ''), {
        filePath: path.join(SRC, GUARDED_DIRS[0], '__parse_posture_probe__.ts')
      });
      expect(postureMessages(result.messages)).toEqual([]);
    });
  });

  // The must-NOT-fire half, and the half that makes firing a property of SCOPE rather than of fixture (invariant 6). `lib/api/base` and `lib/utils` sit outside the block's `files` glob; the same violating source must come back clean there.
  describe('allowed loci OUTSIDE the guard scope stay silent', () => {
    it.each(ALLOWED_LOCI)('stays silent on the V2 degrade shape under src/%s', async (locus) => {
      const [result] = await eslint.lintText(PRELUDE + fixtureFor(VIOLATIONS[1].name).source, {
        filePath: path.join(SRC, locus, '__parse_posture_probe__.ts')
      });
      expect(postureMessages(result.messages)).toEqual([]);
    });

    it.each(ALLOWED_LOCI)('parses the fixture without a fatal message under src/%s', async (locus) => {
      const [result] = await eslint.lintText(PRELUDE + fixtureFor(VIOLATIONS[1].name).source, {
        filePath: path.join(SRC, locus, '__parse_posture_probe__.ts')
      });
      expect(result.messages.filter((m) => m.fatal)).toEqual([]);
    });
  });

  // The real files, not fixtures. This is the case that goes red if plans 04 through 06 left a degrade branch behind, and it is the only assertion in this file that measures the shipped tree rather than a constructed one.
  describe('the real migrated adapter files carry no degrade branch', () => {
    it.each(REAL_FILES)('finds no parse-posture violation in src/%s', async (relativePath) => {
      const [result] = await eslint.lintFiles([path.join(SRC, relativePath)]);
      expect(postureMessages(result.messages)).toEqual([]);
    });
  });

  // Standing regressions for the flat-config REPLACE trap, one per inherited entry (invariant 5). Both probes run at a GUARDED adapter path on purpose: that is where the replacement happens, and therefore where a dropped entry would vanish while producing zero errors on the real tree.
  describe('inherited bans survive the flat-config REPLACE (standing regressions)', () => {
    const guardedPath = path.join(SRC, GUARDED_DIRS[0], '__parse_posture_probe__.ts');

    it('still enforces the inherited TSEnumDeclaration ban', async () => {
      const [result] = await eslint.lintText("export enum Color {\n  Red = 'red'\n}\n", { filePath: guardedPath });
      const hits = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('const assertion')
      );
      expect(hits.length).toBeGreaterThan(0);
    });

    it('still enforces the inherited dynamic svelte/store ImportExpression ban', async () => {
      const [result] = await eslint.lintText(
        "export async function f() {\n  return await import('svelte/store');\n}\n",
        { filePath: guardedPath }
      );
      const hits = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('svelte/store is banned.')
      );
      expect(hits.length).toBeGreaterThan(0);
    });
  });

  // The selector strings are transcribed above rather than re-derived, and `157.1-07` copies them into the config block verbatim. This case makes that transcription observable: if a selector loses its argument-type guard, the empty-return arms start matching every `return {}` in the adapter (the measured esquery trap) and the guard becomes noise rather than a gate.
  describe('the transcribed selectors keep their measured shape', () => {
    it('pairs every `undefined` arm with an argument-type guard', () => {
      expect(SELECTORS.G1).toContain("[argument.type='Identifier'][argument.name='undefined']");
      expect(SELECTORS.G4).toContain("[argument.type='Identifier'][argument.name='undefined']");
    });
  });
});
