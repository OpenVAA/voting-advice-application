import path from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Lock-in self-test — the ADAPTER-SINGLETON ESLint guard (criterion **C6**, decisions **D1(a)** and **D2(a)**, requirement **D11**).
 *
 * The guard is two clauses expressed as `no-restricted-syntax` entries: clause 1 bans a module-scope `new` of an adapter class, clause 2 bans an `init` member DECLARED on an adapter class. `157.2-01` (wave 1) wrote this file with its apparatus live and its cases declared; `157.2-09` spread the selectors into the three existing config blocks, filled the cases, and recorded both halves in `157.2-NEGATIVE-CONTROL-LEDGER.md` rows 4 and 5.
 *
 * Stable anchor, deliberately NOT a line citation: the guard lives in `apps/frontend/eslint.config.mjs`, spread into the three config objects that already set `no-restricted-syntax` — the `src/**` store-guard block, the adapter-boundary block and the parse-posture block. Line ranges move on every edit; globs and rule keys do not.
 *
 * ## Why clause 2 is a DECLARATION ban and not a `.init(` call ban (the **D2** NOTE, answered)
 *
 * The operator asked whether `init` is still a meaningful target once **B3** removes it from the adapters, their abstracts and their interfaces. Research answered it by measurement: `CallExpression[callee.type='MemberExpression'][callee.property.name='init']` was measured FIRING on `userData.init(snapshot.userData)` and `store.init(d)`, two live in-tree sites that have nothing to do with adapters, so the bare call form must not ship. A variant narrowed to the four selector identifiers is silent on both but has no live target after **B3**, because a reintroduced two-step protocol would be called on a local name. What survives is the DECLARATION: banning `init` as a member of an adapter class catches the reintroduction at the point where it is written rather than where it is called, and that is a live target forever.
 *
 * The two `init` mentions this file carries are BOTH deliberate and were left standing by `157.2-08`'s breadcrumb sweep on purpose. `MESSAGES.CLAUSE2` below is live RULE TEXT — the contract this spec disambiguates on — and the paragraph above is that rule's RATIONALE. Neither is an adapter breadcrumb of the kind `157.2-08` retired, and `157.2-09` confirms that reading rather than overruling it.
 *
 * ## ⚠ Clause 2 ships in TWO FORMS, and which form is live at which zone is a MEASUREMENT
 *
 * This is the single most surprising thing about the assertions below, so it is stated before them rather than discovered inside them.
 *
 * - **The BROAD form** (`SELECTORS.S2_BROAD`, research's original) keys on the MEMBER NAME alone: any `init` in any class body. It was measured firing on the abstract base, on the Supabase mixin's inner class — whose name carries no adapter suffix — AND on the live `init` member of `src/lib/contexts/candidate/candidateUserDataState.svelte.ts`, a store with nothing to do with adapters. That last one is a FALSE POSITIVE, so the broad form ships in the ADAPTER BLOCK ONLY, where every class is an adapter. Zone C is that block.
 * - **The SCOPED form** (`SELECTORS.S2_SCOPED`) additionally keys on the CLASS'S OWN NAME ending in one of the same five adapter suffixes the instance clause uses. It is silent on the store and on the mixin's inner class, and it ships in ALL THREE blocks.
 *
 * The abstract base and the store resolve to the SAME effective zone (B), so no block placement can catch one without the other — which is why two forms exist rather than one placed cleverly. The consequence for this file: the five generic-named clause-2 fixtures (`CLAUSE2_VIOLATIONS`, class `A` / `WithMixin`) fire at zone C and ONLY at zone C, while the five adapter-suffixed ones (`CLAUSE2_VIOLATIONS_SCOPED`) fire at all three. Both sets are asserted, in the form that actually ships at each zone.
 *
 * ## Correctness invariants, each one a distinct way this spec could hand back a false PASS
 *
 * 1. Every probe `filePath` MUST resolve under `apps/frontend/src` (see `SRC` below), or the guard blocks' `files` scopes simply do not apply and every assertion passes vacuously. The paths are VIRTUAL — no file is ever written to any of them.
 * 2. The `ESLint` construction below MUST carry the ESLint v10 config-lookup-from-file flag (the literal flag name appears exactly once in this file, on that construction, so a grep can prove it is present). It loads the real `apps/frontend/eslint.config.mjs` and matches `apps/frontend/package.json`'s lint script exactly; omitting it risks config-resolution drift, and this spec would then measure a different config than the gate does.
 * 3. ESLint must be invoked FROM `apps/frontend`. Research measured that invoking it from elsewhere changes config resolution. `yarn workspace @openvaa/frontend vitest run …` and `yarn test:unit` both set that working directory, which is why no case here passes an explicit `cwd` — but a future runner that does not must not be assumed equivalent. `157.2-09` measured the failure shape directly: the same fixture at a repository-root path resolves the ROOT config and returns a plausible message from a DIFFERENT rule set, and at a path one directory above `src/` resolves a ONE-ENTRY effective array in which no guard clause could ever appear.
 * 4. ⚠ **A fixture whose virtual `filePath` falls outside the base path returns ZERO messages, which is INDISTINGUISHABLE from a silent rule.** That is the single most dangerous failure mode in this file, because it would let a non-firing guard read as correct and would corrupt ledger row 4's blind half by recording a false silence as a measured RED. The three zone probes below are the mitigation and they are not optional: each one both resolves the real flat config for its zone AND lints a fixture for a ban that is ALREADY INHERITED there, which must fire. A zone whose already-inherited ban does not fire is OUT OF SCOPE, not silent, and the probe says so before any clause assertion is read.
 * 5. Assert on `ruleId`, never on a bare problem count. A violating fixture also trips unrelated rules — `unused-imports/no-unused-vars` and `@typescript-eslint/no-unused-vars` among them — so a count assertion would pass for the wrong reason.
 * 6. FIFTEEN entries share `ruleId === 'no-restricted-syntax'` at the adapter zone now that this guard has landed. Assertions therefore disambiguate on the MESSAGE SUBSTRING and NEVER on line or column. Line and column move with any edit; the messages are the contract.
 * 7. The flat-config REPLACE trap gets a standing regression case PER INHERITED ENTRY, PER ZONE — thirteen in all. See the zone table below for why the number is thirteen and not one.
 * 8. The guard must be silent where the shape is legitimate, and the compliant fixtures are what make "it fires" a discriminating signal rather than a constant.
 *
 * ## The three zones, and why the standing regressions number thirteen
 *
 * `no-restricted-syntax` resolves to THREE distinct effective option arrays across `apps/frontend/src`, because flat config REPLACES a rule's options array per-file rather than merging it, and three config objects set that rule at overlapping globs. Measured at the phase's opening HEAD, one representative path per zone: **Zone A = 2 entries** (`src/lib/api/dataProvider.ts`, allowlisted, so only the two inherited bans apply), **Zone B = 4** (`src/lib/api/base/`, where the adapter-boundary block matches and replaces), **Zone C = 7** (`src/lib/api/adapters/supabase/`, where the parse-posture block matches last and replaces in turn). `157.2-09` RE-CONFIRMED those three numbers at its own HEAD, eight plans later, before touching the config. Those three numbers specify the thirteen standing regressions this file declares, one per entry that must survive the edit. `157.1-NEGATIVE-CONTROL-LEDGER.md` row 7 records the trap firing for real: with a block present and two entries omitted, an `export enum` and a dynamic `svelte/store` import at a guarded adapter path both linted CLEAN — zero messages of any kind — and no other gate in this repository reported anything.
 *
 * The counts AFTER the guard landed were 6, 8 and 12, and the WR-08 arms take them to 9, 11 and 15 — each a strict superset of its own predecessor, with every prior entry present verbatim and in order, because the selectors were SPREAD into the three existing arrays rather than added as a fourth block. Array extension within an object is additive and triggers no replacement. That superset check was a one-off measurement (ledger row 5); the thirteen cases below are what turn it into a standing property of the suite.
 *
 * ⚠ **Zone A's representative is a NAMED FILE, not a directory.** `ADAPTER_BOUNDARY_ALLOWLIST` names `src/lib/api/dataProvider.ts` by path rather than by glob, so a sibling virtual name in the same directory — `src/lib/api/__probe__.ts` — is NOT allowlisted and resolves to Zone B instead. The Zone A constant below is therefore that exact path. It is still virtual: `lintText` never reads the file it is given a path for.
 *
 * ⚠ **One path deliberately changed zone during this phase and must never be used as a representative.** `src/lib/api/adminWriter.ts` was not on the allowlist at the phase's opening HEAD, so it resolved to Zone B; `157.2-02` added it, moving it to Zone A and legitimately SHRINKING its effective array from 4 entries to 2. A superset assertion made against that file would fail for the right reason and be read as a REPLACE regression. See ledger row 5.
 *
 * ## ⚠ What this guard CANNOT see — stated here so a green lint is never read as a proof the class is closed
 *
 * FIVE forms are not caught, and none is a gap this file may paper over. The same five are written into the config's own comment, which is the copy a future editor will read first. The list was THREE and presented as exhaustive until `157.2-REVIEW.md` WR-08 found three further shapes; the namespaced callee, the container literal and the static class field are now CLOSED by clause-1 arms (fixtures V8, V8b, V9, V10, V11 below), and forms 4 and 5 are the residue those arms do not reach. An understated list is worse than none, which is why the count moved rather than the claim.
 *
 * 1. **Lazy module-level memoization.** `let c; export function get(){ c ??= new SupabaseDataProvider(); return c; }` — the `new` is syntactically inside a function, so no module-scope selector reaches it, and the singleton-ness lives in the module-scope `let`, which esquery cannot correlate with it. **Measured silent.**
 * 2. **A renamed class.** `export const dp = new Foo();` — every clause keys on a naming convention, so a future adapter class whose name ends in none of the five suffixes evades them entirely. **Measured silent.**
 * 3. **Outside the adapter tree, a configuration member on a non-adapter-named class.** `class Thing { init(c) {} }` under `src/lib/contexts/**` or `src/routes/**` is not caught, because only the SCOPED declaration form ships there. This follows from the two-form asymmetry above and is the price of not firing on the live candidate user-data store. It is measured, not assumed: the five generic-named clause-2 fixtures are asserted SILENT at zones A and B below, which makes the hole a recorded property rather than an oversight.
 * 4. **A container nested more than one level, or one that is not a literal.** `S1d` and `S1e` are CHILD combinators by design, so `export const c = { a: { dp: new SupabaseDataProvider() } }` and `export const c = new Map([['dp', new SupabaseDataProvider()]])` both evade them. A descendant combinator would span every depth but was rejected on measurement: it also fires on `export const createDataProvider = (c) => new SupabaseDataProvider(c)`, the factory shape this phase moves the tree TO. Fixture C10 is that boundary, asserted silent.
 * 5. **A static ACCESSOR rather than a static field.** `static get dp() { return (this.#c ??= new SupabaseDataProvider()); }` is form 1 wearing a class: the `new` is inside a function body and the sharing lives in the static private field.
 *
 * **The backstop for all three is `src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts`**, the C1(a) concurrency negative control. None of the three evasions can produce a per-request instance, so none can pass that spec's interleaving assertions. A lint guard locks the measured shape against reopening; the concurrency spec is what actually says the contamination stopped.
 */

// MANDATORY (invariant 2): loads the real apps/frontend/eslint.config.mjs.
const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });

// MANDATORY (invariant 1): every probe path resolves under apps/frontend/src, which is what puts the fixture inside a guard block's `files` scope. The paths below are VIRTUAL — no file is ever written to them; they are only passed as `lintText`'s `filePath` option.
const SRC = path.resolve(__dirname, '../..');

/**
 * The three zone representatives, one per distinct effective `no-restricted-syntax` array. Zone A is a NAMED FILE because the allowlist names it by path rather than by glob; see the docstring.
 *
 * `entryCount` is the INHERITED count — the entries that predate this guard and must survive it — not the post-edit total.
 *
 * `effectiveEntryCount` IS that total, measured from the live flat config, and it exists to name a failure the inherited count cannot (IN-04). Zone A's probe is `lib/api/dataProvider.ts`, a REAL file that is Zone A only because `ADAPTER_BOUNDARY_ALLOWLIST` names it — and this file records that `adminWriter.ts` changed zone during this very phase for exactly that reason. A future allowlist edit striking `dataProvider.ts` would silently reclassify this probe to Zone B, at which point every Zone-A assertion would be measuring Zone B. Asserting the effective count against the live config makes that failure say "this path is no longer Zone A" instead of surfacing as an unrelated transcription mismatch.
 */
const ZONES = {
  A: { probePath: 'lib/api/dataProvider.ts', entryCount: 2, effectiveEntryCount: 9 },
  B: { probePath: 'lib/api/base/__adapter_singleton_probe__.ts', entryCount: 4, effectiveEntryCount: 11 },
  C: { probePath: 'lib/api/adapters/supabase/__adapter_singleton_probe__.ts', entryCount: 7, effectiveEntryCount: 15 }
} as const;

type ZoneId = keyof typeof ZONES;

const ZONE_IDS = Object.keys(ZONES) as Array<ZoneId>;

/** The zone whose block is the adapter tree, and therefore the ONLY zone where the broad declaration form ships. */
const ADAPTER_ZONE: ZoneId = 'C';

/** A generous per-case budget. The warm-up removes the one-time config-resolution cost from the first case's budget, but every case still runs a real `lintText` through a fifteen-entry rule set, and the full frontend suite runs them under concurrent load. See the warm-up's own comment for the measured failure this avoids. */
const CASE_TIMEOUT = 30_000;

/**
 * Resolve a zone's virtual probe path.
 * @param zone - The zone id.
 * @returns The absolute virtual path.
 */
function probePath(zone: ZoneId): string {
  return path.join(SRC, ZONES[zone].probePath);
}

/*
 * The clause selectors, TRANSCRIBED VERBATIM from `157.2-RESEARCH.md` § "The D1 guard — measured selectors", where they were WRITTEN AND EXECUTED against the fixture set below. They are not re-derived here and must not be re-derived: a re-derived selector is a different selector, and the three evasion fixtures (V5, V5b, V7) exist because the obvious derivation misses them.
 *
 * Clause 1 needs THREE selectors rather than one because a module-scope `new` can be written as a variable declarator, as a default export, or as an assignment to a previously declared binding, and no single esquery expression spans all three.
 *
 * Clause 2 needs TWO because of the zone asymmetry documented at the head of this file. `S2_BROAD` is research's measured selector, unchanged. `S2_SCOPED` is a COMPOSITION of two measured fragments — research's clause-2 body and the same five-suffix predicate clause 1 keys on, read off `id.name` rather than `callee.name` — rather than a new invention.
 */

/** The adapter naming convention clause 1 keys on, and the same predicate `S2_SCOPED` reuses. Its blind spot — a class named outside these five suffixes — is stated in the docstring. */
const ADAPTER_SUFFIXES = '/(Adapter|DataProvider|DataWriter|AdminWriter|FeedbackWriter)$/';

/** The module-scope declaration prefix three of the clause-1 arms share. */
const MODULE_SCOPE_DECLARATION =
  ':matches(Program > VariableDeclaration, Program > ExportNamedDeclaration > VariableDeclaration)';

/**
 * The callee predicate every clause-1 arm is read through.
 *
 * `callee.name` is `undefined` for a `MemberExpression` callee, so an arm keyed on it alone is silent on `new adapters.SupabaseDataProvider(cfg)` — and `import * as adapters from './...'` is idiomatic. The `callee.property.name` alternative was measured on the same fixture matrix as the rest of this file: it fires on the namespaced form of each shape and stays silent on `new lib.DataRoot()`, so the discrimination is still on the five suffixes and not on the presence of a namespace.
 */
const ADAPTER_CALLEE = `:matches([callee.name=${ADAPTER_SUFFIXES}], [callee.property.name=${ADAPTER_SUFFIXES}])`;

/** The measured selectors, keyed by the research ids. */
const SELECTORS = {
  /** A module-scope `new` bound by a variable declarator, exported or not. */
  S1: `${MODULE_SCOPE_DECLARATION} > VariableDeclarator > NewExpression${ADAPTER_CALLEE}`,
  /** EVASION: a module-scope `new` as the default export. */
  S1b: `Program > ExportDefaultDeclaration > NewExpression${ADAPTER_CALLEE}`,
  /** EVASION: a module-scope `new` assigned to a previously declared binding. */
  S1c: `Program > ExpressionStatement > AssignmentExpression > NewExpression${ADAPTER_CALLEE}`,
  /** EVASION (WR-08): a module-scope OBJECT literal holding the instance. A child combinator, deliberately — see uncaught form 4 in the docstring. */
  S1d: `${MODULE_SCOPE_DECLARATION} > VariableDeclarator > ObjectExpression > Property > NewExpression${ADAPTER_CALLEE}`,
  /** EVASION (WR-08): a module-scope ARRAY literal holding the instance. */
  S1e: `${MODULE_SCOPE_DECLARATION} > VariableDeclarator > ArrayExpression > NewExpression${ADAPTER_CALLEE}`,
  /** EVASION (WR-08): a STATIC class field, which is process-shared exactly like a module binding. The INSTANCE-field form stays silent; C4 below is that control. */
  S1f: `ClassBody > PropertyDefinition[static=true] > NewExpression${ADAPTER_CALLEE}`,
  /** An `init` member DECLARED on a class whose OWN NAME ends in an adapter suffix. Ships in ALL THREE blocks. */
  S2_SCOPED:
    `:matches(ClassDeclaration, ClassExpression)[id.name=${ADAPTER_SUFFIXES}]` +
    " > ClassBody > :matches(MethodDefinition, PropertyDefinition)[key.name='init']",
  /** An `init` member DECLARED on ANY class body — method, property or private. Ships in the ADAPTER BLOCK ONLY; see the two-form note in the docstring. */
  S2_BROAD: "ClassBody > :matches(MethodDefinition, PropertyDefinition)[key.name='init']"
} as const;

/**
 * The message substring each clause's `no-restricted-syntax` entry must carry.
 *
 * These are the CONTRACT between this spec and the config entries `157.2-09` installed: the assertions disambiguate on message and never on line or column, so a message edit in the config without the matching edit here silently turns a firing case into a false pass. Change both together, or neither. A config message may be EXTENDED past these substrings but never re-worded through them — and the shipped ones ARE extended: each of the three clause-1 entries names its own form, and each of the two clause-2 entries names its own scope, after the shared substring below.
 *
 * ⚠ `CLAUSE2` is shared by BOTH declaration forms on purpose, so `singletonMessages` sees them as one clause. The forms are told apart by the FIXTURE rather than by the message: a generic-named fixture can only be caught by the broad form, and it is asserted firing at the adapter zone alone.
 */
const MESSAGES = {
  CLAUSE1: 'A module-scope `new` of an adapter class creates a shared instance',
  CLAUSE2: 'An `init` member on an adapter class reintroduces the two-step construction protocol'
} as const;

/**
 * The `(Form: …)` clause each shipped entry appends after {@link MESSAGES}, keyed by the selector that produces it.
 *
 * ⚠ THIS IS WHAT MAKES `selectorIds` LIVE DATA (IN-02). Every fixture below carries a `selectorIds` field naming the arm that is supposed to catch it, and until this map existed NO assertion read it: it documented intent while drifting freely from the fixture it annotated, and a fixture could be caught by the WRONG arm — or by a broader arm that also swallowed three others — with every case still green. The firing assertions now check that the fixture trips the arm it names, so re-pointing a fixture at a different id fails, and so does an arm quietly widening to cover another arm's shape.
 *
 * Like {@link MESSAGES} these are a CONTRACT with the config: a message edited there without the matching edit here turns a firing case into a failure that names the wrong thing. Change both together, or neither.
 */
const SELECTOR_MESSAGE_FORMS = {
  S1: '(Form: a module-scope variable declarator, exported or not.)',
  S1b: '(Form: the default export.)',
  S1c: '(Form: assignment to a previously declared module-scope binding.)',
  S1d: '(Form: a module-scope object literal holding the instance',
  S1e: '(Form: a module-scope array literal holding the instance',
  S1f: '(Form: a STATIC class field',
  S2_SCOPED: '(Form: a member named `init` on a class whose own name ends in an adapter suffix',
  S2_BROAD: '(Form: any member named `init` in a class body under'
} as const;

/**
 * Ambient declarations prefixed to every fixture body so each one is a self-contained, parseable module.
 *
 * Nothing here may itself match a clause: there is no module-scope `new` of an adapter class and no `init` member anywhere in it, so the prelude cannot change what a fixture measures. `Base` exists for the mixin fixtures, `DataRoot` and `Foo` for the compliant and blind-spot shapes.
 */
const PRELUDE = [
  'declare const config: { fetch: unknown };',
  'declare class SupabaseDataProvider { constructor(c?: unknown); }',
  'declare class SupabaseDataWriter { constructor(c?: unknown); }',
  'declare class SupabaseAdminWriter { constructor(c?: unknown); }',
  'declare class SupabaseFeedbackWriter { constructor(c?: unknown); }',
  'declare class ApiRouteDataProvider { constructor(c?: unknown); }',
  'declare class DataRoot { constructor(); }',
  'declare class Foo { constructor(); }',
  'declare const Base: new () => object;',
  '',
  ''
].join('\n');

/** The SEVEN clause-1 violation fixtures research scored, transcribed with the selector measured to catch each. */
const CLAUSE1_VIOLATIONS = [
  {
    name: 'V1 — the shipped shape, four times over in the tree',
    selectorIds: ['S1'],
    source: 'export const dataProvider = new SupabaseDataProvider();\n'
  },
  {
    name: 'V2 — the same, not exported',
    selectorIds: ['S1'],
    source: 'const w = new SupabaseDataWriter();\nexport function use() {\n  return w;\n}\n'
  },
  {
    name: 'V3 — the apiRoute variant, one of the four extra singletons finding D-1 measured',
    selectorIds: ['S1'],
    source: 'export const dataProvider = new ApiRouteDataProvider();\n'
  },
  {
    name: 'V4 — declared with `let` rather than `const`',
    selectorIds: ['S1'],
    source: 'export let aw = new SupabaseAdminWriter();\n'
  },
  {
    name: 'V5 — EVASION: the default export',
    selectorIds: ['S1b'],
    source: 'export default new SupabaseDataProvider();\n'
  },
  {
    name: 'V5b — EVASION: a second declarator in a multi-declarator statement',
    selectorIds: ['S1'],
    source: 'export const a = 1,\n  dp = new SupabaseDataProvider();\n'
  },
  {
    name: 'V7 — EVASION: assignment to a previously declared binding',
    selectorIds: ['S1c'],
    source: 'let c;\nc = new SupabaseDataProvider();\nexport { c };\n'
  },
  {
    name: 'V8 — EVASION (WR-08): a NAMESPACED callee, which `callee.name` alone cannot see',
    selectorIds: ['S1'],
    source: "import * as adapters from './adapters';\nexport const dp = new adapters.SupabaseDataProvider(config);\n"
  },
  {
    name: 'V8b — EVASION (WR-08): the namespaced callee as the default export',
    selectorIds: ['S1b'],
    source: "import * as adapters from './adapters';\nexport default new adapters.SupabaseDataProvider(config);\n"
  },
  {
    name: 'V9 — EVASION (WR-08): a module-scope object literal holding the instance',
    selectorIds: ['S1d'],
    source: 'export const clients = {\n  dp: new SupabaseDataProvider(config)\n};\n'
  },
  {
    name: 'V10 — EVASION (WR-08): a module-scope array literal holding the instance',
    selectorIds: ['S1e'],
    source: 'export const all = [new SupabaseDataWriter(config)];\n'
  },
  {
    name: 'V11 — EVASION (WR-08): a STATIC class field, process-shared exactly like a module binding',
    selectorIds: ['S1f'],
    source: 'export class Registry {\n  static dp = new SupabaseDataProvider(config);\n}\n'
  }
] as const;

/** The FOUR clause-1 compliant fixtures research measured silent. C1 and C2 are the factory shape this whole phase moves the tree to, so a guard that fired on them would be broken rather than strict. */
const CLAUSE1_CLEAN = [
  {
    name: 'C1 — the factory shape, as a function declaration',
    source: 'export function createDataProvider(c: unknown) {\n  return new SupabaseDataProvider(c);\n}\n'
  },
  {
    name: 'C2 — the factory shape, as an arrow',
    source: 'export const createDataProvider = (c: unknown) => new SupabaseDataProvider(c);\n'
  },
  {
    name: 'C3 — a module-scope `new` of a NON-adapter class; the clause must discriminate on the callee name',
    source: 'export const dataRoot = new DataRoot();\n'
  },
  {
    name: 'C4 — an instance field, which is per-instance rather than module-scope; the control for V11',
    source: 'export class Holder {\n  p = new SupabaseDataProvider();\n}\n'
  },
  {
    name: 'C9 — a NAMESPACED `new` of a NON-adapter class; the namespaced arm must still discriminate on the five suffixes',
    source: "import * as lib from './lib';\nexport const dataRoot = new lib.DataRoot();\n"
  },
  {
    name: 'C10 — a container built INSIDE a factory, which is per-call; the container arms must not reach through a function body',
    source: 'export function makeClients(c: unknown) {\n  return { dp: new SupabaseDataProvider(c) };\n}\n'
  }
] as const;

/**
 * The FIVE clause-2 violation fixtures research scored, with GENERIC class names. D1 and D4 are the two shapes that existed in the tree before `157.2-08` removed them, at `universalAdapter.ts:22` and `supabaseAdapter.ts:27`.
 *
 * ⚠ Because their class names carry no adapter suffix, ONLY the broad form can catch them — so they are asserted firing at the ADAPTER ZONE and asserted SILENT at zones A and B. That silence is not a defect being tolerated: it is uncaught form 3 from the docstring, measured rather than assumed, and it is the price of not firing on the live candidate user-data store, which shares zone B with the abstract base.
 */
const CLAUSE2_VIOLATIONS = [
  {
    name: 'D1 — the abstract base declaration, = universalAdapter.ts:22',
    selectorIds: ['S2_BROAD'],
    source: 'export abstract class A {\n  init(c: unknown): this {\n    return this;\n  }\n}\n'
  },
  {
    name: 'D2 — EVASION: an arrow property rather than a method',
    selectorIds: ['S2_BROAD'],
    source: 'export class A {\n  init = (c: unknown) => c;\n}\n'
  },
  {
    name: 'D3 — EVASION: an async method',
    selectorIds: ['S2_BROAD'],
    source: 'export class A {\n  async init(c: unknown) {\n    return c;\n  }\n}\n'
  },
  {
    name: 'D4 — the mixin inner class re-declaring init, = supabaseAdapter.ts:27',
    selectorIds: ['S2_BROAD'],
    source:
      'export function withMixin() {\n  abstract class WithMixin extends Base {\n    init(c: unknown): this {\n      return this;\n    }\n  }\n  return WithMixin;\n}\n'
  },
  {
    name: 'D5 — EVASION: a private method',
    selectorIds: ['S2_BROAD'],
    source: 'export class A {\n  #init(c: unknown) {\n    return c;\n  }\n}\n'
  }
] as const;

/**
 * The same five declaration shapes with ADAPTER-SUFFIXED class names — the fixtures for the SCOPED form, which is the one that ships outside the adapter tree.
 *
 * These five are NEW in `157.2-09` and their blindness was recorded in ledger row 4's OLD half alongside the originals, in the same run and before the config moved — not added afterwards once the guard was seen to fire. They differ from `CLAUSE2_VIOLATIONS` in the class name and in nothing else, which is what makes the pair a controlled comparison of the two forms rather than two unrelated fixture sets.
 */
const CLAUSE2_VIOLATIONS_SCOPED = [
  {
    name: 'D1s — the abstract base shape, adapter-suffixed class name',
    selectorIds: ['S2_SCOPED'],
    source: 'export abstract class MyDataProvider {\n  init(c: unknown): this {\n    return this;\n  }\n}\n'
  },
  {
    name: 'D2s — EVASION: an arrow property, adapter-suffixed class name',
    selectorIds: ['S2_SCOPED'],
    source: 'export class MyDataWriter {\n  init = (c: unknown) => c;\n}\n'
  },
  {
    name: 'D3s — EVASION: an async method, adapter-suffixed class name',
    selectorIds: ['S2_SCOPED'],
    source: 'export class MyAdminWriter {\n  async init(c: unknown) {\n    return c;\n  }\n}\n'
  },
  {
    name: 'D4s — the mixin inner class, adapter-suffixed name; the one shape block placement alone could never reach',
    selectorIds: ['S2_SCOPED'],
    source:
      'export function withMixin() {\n  abstract class WithSupabaseAdapter extends Base {\n    init(c: unknown): this {\n      return this;\n    }\n  }\n  return WithSupabaseAdapter;\n}\n'
  },
  {
    name: 'D5s — EVASION: a private method, adapter-suffixed class name',
    selectorIds: ['S2_SCOPED'],
    source: 'export class MyFeedbackWriter {\n  #init(c: unknown) {\n    return c;\n  }\n}\n'
  }
] as const;

/**
 * The FOUR clause-2 compliant fixtures research measured silent.
 *
 * C7 is the load-bearing one. It is a bare `x.init(1)` CALL, and it must stay silent: research measured the call-form selector firing on `userData.init(snapshot.userData)` and `store.init(d)`, two live in-tree sites with nothing to do with adapters. That measurement is why clause 2 bans the DECLARATION rather than the call, and this fixture is what would have gone red had `157.2-09` reached for the call form.
 */
const CLAUSE2_CLEAN = [
  {
    name: 'C5 — an explicit constructor, which is the shape this phase moves TO',
    source: 'export class A {\n  constructor(c: unknown) {\n    void c;\n  }\n}\n'
  },
  {
    name: 'C6 — a differently named member; the clause must discriminate on the key name',
    source: 'export class A {\n  initialise(c: unknown) {\n    return c;\n  }\n}\n'
  },
  {
    name: 'C7 — a bare `.init(` CALL, which must stay silent; see this constant’s docstring',
    source: 'export function probe(x: { init: (n: number) => void }) {\n  x.init(1);\n}\n'
  },
  {
    name: 'C8 — an object literal method, which is not a class body',
    source: 'export const handlers = {\n  init() {\n    return config;\n  }\n};\n'
  }
] as const;

/**
 * The thirteen inherited entries that must survive the edit, by zone, identified by the message substring each one carries today and paired with a fixture that trips it.
 *
 * The array lengths ARE the measured zone entry counts of 2, 4 and 7, and the zone probes below assert that correspondence, so a transcription slip here cannot pass unnoticed.
 *
 * Each `source` is the smallest body that trips its own entry. The parse-posture five are transcribed from `eslint-parse-posture-guard.test.ts`'s own scored fixtures (V2, V3, V5, V9 and V4 respectively) rather than re-derived, for the same reason the selectors are: a re-derived fixture is a different fixture.
 */
const REGRESSION_PRELUDE = [
  'declare const raw: unknown;',
  'declare const Schema: { safeParse: (value: unknown) => { success: boolean; data: Record<string, unknown> } };',
  'declare function parseAnswersColumn(value: unknown, source: unknown): Record<string, unknown> | undefined;',
  'declare const source: { column: string };',
  'declare const holder: { supabase: unknown };',
  '',
  ''
].join('\n');

const INHERITED_ENTRIES: Record<ZoneId, ReadonlyArray<{ substring: string; source: string }>> = {
  A: [
    { substring: 'const assertion', source: "export enum Color {\n  Red = 'red'\n}\n" },
    {
      substring: 'svelte/store is banned.',
      source: "export async function probe() {\n  await import('svelte/store');\n}\n"
    }
  ],
  B: [
    { substring: 'const assertion', source: "export enum Color {\n  Red = 'red'\n}\n" },
    {
      substring: 'svelte/store is banned.',
      source: "export async function probe() {\n  await import('svelte/store');\n}\n"
    },
    {
      substring: 'A `.supabase` access reaches through the adapter boundary',
      source: 'export function probe() {\n  return holder.supabase;\n}\n'
    },
    {
      substring: 'Destructuring `supabase` reaches through the adapter boundary',
      source: 'export function probe() {\n  const { supabase } = holder;\n  return supabase;\n}\n'
    }
  ],
  C: [
    { substring: 'const assertion', source: "export enum Color {\n  Red = 'red'\n}\n" },
    {
      substring: 'svelte/store is banned.',
      source: "export async function probe() {\n  await import('svelte/store');\n}\n"
    },
    {
      substring: 'A parse-failure branch must not return an empty value',
      source:
        'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    return {};\n  }\n  return parsed.data;\n}\n'
    },
    {
      substring: 'A `.success` conditional must not fall back to an empty literal',
      source:
        'export function probe() {\n  const retry = Schema.safeParse(raw);\n  return retry.success ? retry.data : {};\n}\n'
    },
    {
      substring: 'A `parse*` call must not fall back to an empty literal',
      source: 'export function probe() {\n  return parseAnswersColumn(raw, source) ?? {};\n}\n'
    },
    {
      substring: 'An inverted `.success` branch must not fall through to an empty return',
      source:
        'export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (parsed.success) return parsed.data;\n  return {};\n}\n'
    },
    {
      substring: 'A parse-failure return must carry `issues`',
      source:
        "export function probe() {\n  const parsed = Schema.safeParse(raw);\n  if (!parsed.success) {\n    return { type: 'success', sent: 0 };\n  }\n  return parsed.data;\n}\n"
    }
  ]
};

/** An already-inherited violation that fires in EVERY zone. It is the positive control that tells "the fixture is out of scope" apart from "the rule is silent" (invariant 4). */
const IN_SCOPE_FIXTURE = "export enum Color {\n  Red = 'red'\n}\n";

/** The substring `IN_SCOPE_FIXTURE` is expected to produce. */
const IN_SCOPE_MESSAGE = 'const assertion';

/** The three real files whose CURRENT source this spec lints from disk. The store is the false positive the two declaration forms exist to avoid; the two singletons are the exemptions whose directives must be doing their job. */
const REAL_FILES = {
  store: 'lib/contexts/candidate/candidateUserDataState.svelte.ts',
  localDataProvider: 'lib/server/api/adapters/local/dataProvider/index.ts',
  localFeedbackWriter: 'lib/server/api/adapters/local/feedbackWriter/index.ts'
} as const;

/**
 * Reduce a lint result to the messages this guard owns.
 * @param messages - The messages ESLint returned.
 * @returns Only the adapter-singleton guard's own messages.
 */
function singletonMessages(messages: Array<{ ruleId: string | null; message: string }>) {
  return messages.filter(
    (m) => m.ruleId === 'no-restricted-syntax' && Object.values(MESSAGES).some((s) => m.message.includes(s))
  );
}

/**
 * Lint a fixture body at a zone's virtual path, through the real flat config.
 * @param zone - The zone id whose representative path to lint at.
 * @param source - The fixture body, appended to `PRELUDE`.
 * @param prelude - The prelude to prefix; defaults to the clause fixtures' `PRELUDE`.
 * @returns The messages ESLint returned.
 */
async function lintAt(zone: ZoneId, source: string, prelude: string = PRELUDE) {
  const [result] = await eslint.lintText(prelude + source, { filePath: probePath(zone) });
  return result.messages;
}

/**
 * Filter a message set down to a single restriction entry, by substring.
 * @param messages - The messages ESLint returned.
 * @param substring - The message substring identifying the entry.
 * @returns The matching messages.
 */
function hitsFor(messages: Array<{ ruleId: string | null; message: string }>, substring: string) {
  return messages.filter((m) => m.ruleId === 'no-restricted-syntax' && m.message.includes(substring));
}

describe('adapter-singleton ESLint guard — criterion C6, D1/D2', () => {
  // Invariant 8 from `eslint-parse-posture-guard.test.ts`, reused verbatim: the FIRST `lintText` call in a file pays the one-time cost of resolving the real flat config and loading the typescript-eslint parser. Left unhoisted, that cost is charged to whichever assertion happens to run first, against vitest's DEFAULT 5000ms per-test budget — so the outcome depends on how busy the machine is rather than on the guard under test. Measured there: 651-1047ms alone, 5391ms inside the full frontend suite under concurrent load, failing with `Test timed out in 5000ms`. That is the timing-fragility class CLAUDE.md forbids treating as flaky, and the fix is to remove the cost from the budget rather than to widen it.
  beforeAll(async () => {
    await eslint.lintText(PRELUDE + CLAUSE1_CLEAN[0].source, {
      filePath: path.join(SRC, 'lib/api/base/__adapter_singleton_warmup__.ts')
    });
  }, 120_000);

  // THE THREE ZONE PROBES, live from `157.2-01`. They measure the APPARATUS rather than the guard, and invariant 4 is the reason each one carries a POSITIVE CONTROL as well as a config resolution: a virtual path that fell outside the base path would return zero messages, which is indistinguishable from a silent rule and would let every case below pass vacuously.
  describe.each(ZONE_IDS)('zone %s apparatus', (zone) => {
    it(
      'resolves the real flat config and fires an already-inherited ban at this zone',
      async () => {
        const config = await eslint.calculateConfigForFile(probePath(zone));
        const [result] = await eslint.lintText(IN_SCOPE_FIXTURE, { filePath: probePath(zone) });
        const hits = hitsFor(result.messages, IN_SCOPE_MESSAGE);

        expect(config.rules).toBeDefined();
        expect(Object.keys(config.rules ?? {})).toContain('no-restricted-syntax');
        // The positive control. Zero hits here means the path is OUT OF SCOPE, not that a rule is silent.
        expect(hits.length).toBeGreaterThan(0);
        // Guards the negative control itself: a parse failure yields a fatal message and would otherwise read as "silent".
        expect(result.messages.filter((m) => m.fatal)).toEqual([]);
        // An enum carries neither a module-scope adapter `new` nor an `init` member, so this guard's OWN messages must be absent here. It exercises the message filter every clause assertion depends on.
        expect(singletonMessages(result.messages)).toEqual([]);
        // The transcription check: this zone's inherited-entry list is the measured entry count, so a slip in the table cannot pass unnoticed.
        expect(INHERITED_ENTRIES[zone].length).toBe(ZONES[zone].entryCount);
        // THE CLASSIFICATION CHECK (IN-04), and it is a different failure from the one above. Each zone's probe resolves to a distinct effective array, and Zone A's probe is a REAL file that is Zone A only because `ADAPTER_BOUNDARY_ALLOWLIST` names it by path. Measuring the live total here means an allowlist edit that reclassifies the probe fails with "zone A no longer has 9 entries" rather than with an unrelated transcription mismatch three cases later.
        expect((config.rules?.['no-restricted-syntax'] as Array<unknown>).slice(1)).toHaveLength(
          ZONES[zone].effectiveEntryCount
        );
      },
      CASE_TIMEOUT
    );
  });

  // CLAUSE 1 — ledger row 4. Every fixture is linted at all three zones, because "it fires" must be a property of the SCOPE rather than of the fixture, and clause 1 is spread into all three blocks precisely so no zone is a hole.
  describe('clause 1 — a module-scope `new` of an adapter class', () => {
    for (const zone of ZONE_IDS) {
      for (const fixture of CLAUSE1_VIOLATIONS) {
        it(
          `fires at zone ${zone} on ${fixture.name}`,
          async () => {
            const messages = await lintAt(zone, fixture.source);
            expect(hitsFor(messages, MESSAGES.CLAUSE1).length).toBeGreaterThan(0);
            // …and it is the arm the fixture NAMES that fires, not merely some arm of the clause (IN-02).
            for (const id of fixture.selectorIds)
              expect(hitsFor(messages, SELECTOR_MESSAGE_FORMS[id]).length).toBeGreaterThan(0);
          },
          CASE_TIMEOUT
        );

        it(
          `parses without a fatal message at zone ${zone} on ${fixture.name}`,
          async () => {
            const messages = await lintAt(zone, fixture.source);
            expect(messages.filter((m) => m.fatal)).toEqual([]);
          },
          CASE_TIMEOUT
        );
      }

      for (const fixture of CLAUSE1_CLEAN) {
        it(
          `stays silent at zone ${zone} on ${fixture.name}`,
          async () => {
            const messages = await lintAt(zone, fixture.source);
            expect(singletonMessages(messages)).toEqual([]);
            expect(messages.filter((m) => m.fatal)).toEqual([]);
          },
          CASE_TIMEOUT
        );
      }
    }
  });

  // CLAUSE 2, SCOPED FORM — ledger row 4. This is the form that ships in ALL THREE blocks, so its fixtures are asserted firing at every zone.
  describe('clause 2, scoped form — an `init` member on an adapter-NAMED class', () => {
    for (const zone of ZONE_IDS) {
      for (const fixture of CLAUSE2_VIOLATIONS_SCOPED) {
        it(
          `fires at zone ${zone} on ${fixture.name}`,
          async () => {
            const messages = await lintAt(zone, fixture.source);
            expect(hitsFor(messages, MESSAGES.CLAUSE2).length).toBeGreaterThan(0);
            // The SCOPED form specifically: the two clause-2 forms share `MESSAGES.CLAUSE2`, so only the `(Form: …)` clause tells them apart (IN-02).
            for (const id of fixture.selectorIds)
              expect(hitsFor(messages, SELECTOR_MESSAGE_FORMS[id]).length).toBeGreaterThan(0);
          },
          CASE_TIMEOUT
        );

        it(
          `parses without a fatal message at zone ${zone} on ${fixture.name}`,
          async () => {
            const messages = await lintAt(zone, fixture.source);
            expect(messages.filter((m) => m.fatal)).toEqual([]);
          },
          CASE_TIMEOUT
        );
      }
    }
  });

  // CLAUSE 2, BROAD FORM — ledger row 4. This form ships in the ADAPTER BLOCK ONLY, so its generic-named fixtures fire at the adapter zone and are SILENT elsewhere. Both halves are asserted: the silence is uncaught form 3 from the docstring, and asserting it is what keeps that hole a measured property rather than an oversight.
  describe('clause 2, broad form — an `init` member on ANY class inside the adapter tree', () => {
    for (const fixture of CLAUSE2_VIOLATIONS) {
      it(
        `fires at the adapter zone ${ADAPTER_ZONE} on ${fixture.name}`,
        async () => {
          const messages = await lintAt(ADAPTER_ZONE, fixture.source);
          expect(hitsFor(messages, MESSAGES.CLAUSE2).length).toBeGreaterThan(0);
          // The BROAD form specifically. A generic-named fixture caught by the scoped form would mean the scoped form had lost its class-name predicate (IN-02).
          for (const id of fixture.selectorIds)
            expect(hitsFor(messages, SELECTOR_MESSAGE_FORMS[id]).length).toBeGreaterThan(0);
        },
        CASE_TIMEOUT
      );

      it(
        `parses without a fatal message at the adapter zone ${ADAPTER_ZONE} on ${fixture.name}`,
        async () => {
          const messages = await lintAt(ADAPTER_ZONE, fixture.source);
          expect(messages.filter((m) => m.fatal)).toEqual([]);
        },
        CASE_TIMEOUT
      );

      for (const zone of ZONE_IDS.filter((z) => z !== ADAPTER_ZONE)) {
        it(
          `is silent OUTSIDE the adapter tree, at zone ${zone}, on ${fixture.name} — uncaught form 3, measured`,
          async () => {
            const messages = await lintAt(zone, fixture.source);
            expect(hitsFor(messages, MESSAGES.CLAUSE2)).toEqual([]);
          },
          CASE_TIMEOUT
        );
      }
    }

    for (const zone of ZONE_IDS) {
      for (const fixture of CLAUSE2_CLEAN) {
        it(
          `stays silent at zone ${zone} on ${fixture.name}`,
          async () => {
            const messages = await lintAt(zone, fixture.source);
            expect(singletonMessages(messages)).toEqual([]);
            expect(messages.filter((m) => m.fatal)).toEqual([]);
          },
          CASE_TIMEOUT
        );
      }
    }
  });

  // THE REAL-FILE PROBES — the cases that would have caught this phase's own worst mistake. A fixture proves the selector; only a real file proves the tree.
  describe('real files, linted from disk', () => {
    it(
      'the live candidate user-data store produces ZERO guard messages — the false positive the two declaration forms exist to avoid',
      async () => {
        const [result] = await eslint.lintFiles([path.join(SRC, REAL_FILES.store)]);
        expect(singletonMessages(result.messages)).toEqual([]);
      },
      CASE_TIMEOUT
    );

    for (const key of ['localDataProvider', 'localFeedbackWriter'] as const) {
      it(
        `the surviving stateless singleton ${REAL_FILES[key]} produces ZERO guard messages — its directive is doing its job`,
        async () => {
          const [result] = await eslint.lintFiles([path.join(SRC, REAL_FILES[key])]);
          // ⚠ THE ASSERTION IS THIS ONE, AND ONLY THIS ONE (IN-03). An `expect(result.errorCount).toBe(0)` used to sit here, which coupled a spec named for the SINGLETON GUARD to the total lint cleanliness of two unrelated files: any future rule firing there would fail this case with a message about something else entirely. What the test name claims is that the guard is silent on these files, and that is what `singletonMessages` measures.
          expect(singletonMessages(result.messages)).toEqual([]);
        },
        CASE_TIMEOUT
      );
    }
  });

  // THE THIRTEEN STANDING REGRESSIONS — ledger row 5. One per inherited entry per zone, and the ONLY detector of a flat-config REPLACE regression: a dropped entry produces zero errors on the real tree, so no other gate in this repository would report it.
  describe('inherited bans survive the flat-config REPLACE (standing regressions)', () => {
    for (const zone of ZONE_IDS) {
      for (const entry of INHERITED_ENTRIES[zone]) {
        it(
          `zone ${zone} still enforces the inherited ban carrying "${entry.substring}"`,
          async () => {
            const messages = await lintAt(zone, entry.source, REGRESSION_PRELUDE);
            expect(messages.filter((m) => m.fatal)).toEqual([]);
            expect(hitsFor(messages, entry.substring).length).toBeGreaterThan(0);
          },
          CASE_TIMEOUT
        );
      }
    }
  });

  /*
   * THE TRANSCRIPTION CHECK — the selectors above are what the config SHIPS, not merely what this file declares.
   *
   * ⚠ THIS BLOCK USED TO BE VACUOUS, and its own comment claimed otherwise. It asserted `SELECTORS.S1` and its four siblings — five string constants declared at the top of THIS file — against substrings of themselves. Nothing in it touched `apps/frontend/eslint.config.mjs`; `SELECTORS` was passed to no linter and compared to nothing, so deleting all three `ADAPTER_SINGLETON_INSTANCE` entries from the config left the block green. The coverage its comment claimed ("if clause 1 loses one of its three arms, V5 and V7 stop being reachable") belongs to the V5/V7 FIRING cases above, and a future editor trusting the misattribution could have weakened those believing this block was the backstop.
   *
   * It now reads the REAL effective rule set through `calculateConfigForFile` — the same resolution path the zone probes use — and asserts the transcribed selectors are present in it, character for character. That closes the drift hazard the `MESSAGES` docstring warns about from the other side: the messages are the contract for WHICH entry fired, and these are the contract for WHAT each entry matches.
   *
   * The zone split is the two-form asymmetry documented at the head of this file, asserted rather than described: the three clause-1 arms and the SCOPED clause-2 form ship in all three blocks, and the BROAD form ships in the adapter block alone.
   */
  describe('the transcribed selectors are the ones the config ships', () => {
    /**
     * Read a zone's effective `no-restricted-syntax` selectors out of the real flat config.
     * @param zone - The zone id.
     * @returns Every selector string the rule is configured with at that zone.
     */
    async function shippedSelectors(zone: ZoneId): Promise<Array<string>> {
      const config = await eslint.calculateConfigForFile(probePath(zone));
      // The computed form is `[severity, ...entries]`; the severity is dropped.
      const entries = (config.rules?.['no-restricted-syntax'] as Array<unknown>).slice(1);
      return entries.map((entry) => (entry as { selector: string }).selector);
    }

    for (const zone of ZONE_IDS) {
      it(
        `zone ${zone} ships clause 1's three arms and clause 2's scoped form verbatim`,
        async () => {
          expect(await shippedSelectors(zone)).toEqual(
            expect.arrayContaining([SELECTORS.S1, SELECTORS.S1b, SELECTORS.S1c, SELECTORS.S2_SCOPED])
          );
        },
        CASE_TIMEOUT
      );
    }

    it(
      `the broad clause-2 form ships at the adapter zone ${ADAPTER_ZONE} and NOWHERE else`,
      async () => {
        expect(await shippedSelectors(ADAPTER_ZONE)).toContain(SELECTORS.S2_BROAD);
        for (const zone of ZONE_IDS.filter((z) => z !== ADAPTER_ZONE))
          expect(await shippedSelectors(zone)).not.toContain(SELECTORS.S2_BROAD);
      },
      CASE_TIMEOUT
    );

    // The composition check, kept because it is about the SHAPE of the transcription rather than its presence: the scoped form is research's clause-2 body plus the same five-suffix predicate clause 1 keys on, read off `id.name` rather than `callee.name`.
    it('keeps the scoped form a composition of the two measured fragments', () => {
      expect(SELECTORS.S2_SCOPED).toContain(SELECTORS.S2_BROAD);
      expect(SELECTORS.S2_SCOPED).toContain(`[id.name=${ADAPTER_SUFFIXES}]`);
      expect(SELECTORS.S1).toContain(`[callee.name=${ADAPTER_SUFFIXES}]`);
    });
  });
});
