import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import parser from 'svelte-eslint-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

/**
 * The adapter-boundary allowlist (REVIEW-ADP-06, Phase 157, decision D-F4).
 *
 * Every entry is named EXPLICITLY rather than implied by a wildcard, because criterion 6 asks for an explicit allowed list. The list is a live, shrinking target rather than a permanent amnesty: `157-16` has taken the first Phase-158 entry off it, and Phase 158 removes the rest.
 *
 * GROUP 1 — the boundary's own INSIDE. These are not "leaks" at all; they are what the adapter IS, and they are permanent by construction. A guard that fired here would be broken rather than strict, which is why `157-NEGATIVE-CONTROL-LEDGER.md` row C records 0 errors against an unmodified `supabaseDataProvider.ts`.
 *
 * GROUP 2 — the nine grandfathered sites OUTSIDE the boundary, each annotated with its Phase-158 disposition. Seven are route files measured in `157-RESEARCH.md` § F.6, which measured eight before `157-16` cleared one; the last two live under `src/` but outside criterion 6's stated scope, and are recorded here so the guard does not fail on files the criterion never asked about.
 */
const ADAPTER_BOUNDARY_ALLOWLIST = [
  // GROUP 1 of 2, the boundary's own inside, permanent by construction.
  // The Supabase adapter itself. Supabase specifics are exactly what this directory is for.
  'src/lib/api/adapters/**',
  // The browser and server Supabase client factories the adapter is built on.
  'src/lib/supabase/**',
  // Four selector modules that name the adapter path; they are the seam, not a leak. Phase 157.2 gives each one a per-call factory, so each also READS a client — `locals.supabase` on the server arm, the parent data's client on the universal arm — which is why the whole group belongs here and why no converted route file needs an entry of its own.
  // `adminWriter.ts` joins its three siblings in `157.2-02`. It was the one selector measured FIRING today, because it alone was left off this list when the other three were added; the group has always been four files.
  'src/lib/api/dataProvider.ts',
  'src/lib/api/dataWriter.ts',
  'src/lib/api/adminWriter.ts',
  'src/lib/api/feedbackWriter.ts',

  // GROUP 2 of 2, the nine grandfathered sites, each annotated with its Phase-158 disposition. This group shipped at TEN under `157-15`; `157-16` struck the first entry, `src/routes/candidate/preregister/+layout.server.ts`, by deleting its Supabase use rather than its annotation, and that path is now guarded and carries a firing case in `eslint-adapter-boundary-guard.test.ts`. It was the ONLY removable one: the two 158-HARD login files are the heart of Phase 158's login collapse, the 158-MEDIUM pair needs adapter methods that do not exist, the 158-EASY logout pair would create a route cycle, and the remaining three either hand the cookie-capable client to the adapter or declare and populate it. The nine below are a worklist, not an oversight.
  // 158-MEDIUM: `auth.verifyOtp` then `auth.getUser`, both needing new adapter methods that do not exist on `DataWriter` today.
  'src/routes/api/candidate/auth/callback/+server.ts',
  // 158-EASY, with a caveat: `SupabaseDataWriter._logout` already does this, but it `fetch`es THIS route, so moving it creates a cycle Phase 158 must break first.
  'src/routes/api/candidate/auth/logout/+server.ts',
  // 158-MOSTLY-PERMANENT: ONE site remains after `157.2-04` — a bare `locals.supabase.auth.signOut()` in `handleError`. The two sites that handed the cookie-capable client to the adapter are gone with the two-step configuration protocol itself (`157.2-08`), so the entry survives on its remaining site rather than on the arithmetic it was written with.
  'src/routes/candidate/(protected)/+layout.server.ts',
  // 158-HARD: `signInWithPassword` plus an inline JWT role decode; the heart of Phase 158's three-login-paths-into-one collapse.
  'src/routes/candidate/login/+page.server.ts',
  // 158-HARD: identical to the candidate login path, and the file a recorded cookie-loss incident was fixed in.
  'src/routes/admin/login/+page.server.ts',
  // 158-MEDIUM: `functions.invoke('identity-callback')` plus `auth.verifyOtp`; `SupabaseDataWriter._preregister` already establishes the Edge-Function pattern.
  'src/routes/api/candidate/preregister/+server.ts',
  // 158-EASY: a bare `auth.signOut()`.
  'src/routes/api/auth/logout/+server.ts',
  // 158-OWNED, outside criterion 6's stated scope: this file POPULATES `event.locals.supabase`, which is the structural reason the eight route files above can reach Supabase without importing it.
  'src/hooks.server.ts',
  // 158-OWNED, and unreachable by this guard on purpose: this file DECLARES `supabase` on the global `App.Locals` interface, which is a type declaration rather than an import or a member access, so the guard should not pretend to reach it.
  'src/app.d.ts'
];

/**
 * Shared esquery fragments for the parse-posture guard (Phase 157.1, criterion 6, decisions D1(a) and D2(a), requirement D8).
 *
 * TRANSCRIBED CHARACTER FOR CHARACTER from `157.1-RESEARCH.md` § "The five selectors — written, executed, and scored against 17 fixtures", where they were WRITTEN AND EXECUTED and scored 5/5 firing with zero false positives across the compliant set. (That heading's count is the seventeen rows of its scored table — twelve violation fixtures, four of them deliberate evasions, and five compliant ones; a sixth compliant fixture, C7, is recorded separately in § "What the guard cannot see" as the one measured false positive.) They are not re-derived here, and they must not be re-derived later: a re-derived selector is a different selector, and the four deliberate evasion fixtures exist because the obvious derivations miss them. The same three fragments and the same five compositions are transcribed a second time in `src/lib/_guards/eslint-parse-posture-guard.test.ts`, under the names `FAIL_BRANCH`, `OK_BRANCH` and `EMPTY`; the prefixes below only disambiguate them in this file's namespace.
 *
 * ⚠ THE ESQUERY TRAP, measured and not to be repeated. `[argument.name='undefined']` matches whenever the attribute is JavaScript-`undefined` — it was measured firing at `return {};` in a fixture that contained no `undefined` identifier anywhere, i.e. it over-fires on every empty-object return. Every `undefined` arm below is therefore PAIRED with an argument-type guard, `[argument.type='Identifier'][argument.name='undefined']`. Do not simplify them.
 */
const PARSE_FAIL_BRANCH =
  ':matches(' +
  "IfStatement[test.type='UnaryExpression'][test.operator='!'][test.argument.type='MemberExpression'][test.argument.property.name='success']," +
  "IfStatement[test.type='UnaryExpression'][test.operator='!'][test.argument.type='Identifier'][test.argument.name='success']," +
  "IfStatement[test.type='BinaryExpression'][test.left.property.name='success'][test.right.value=false]," +
  "IfStatement[test.type='BinaryExpression'][test.left.name='success'][test.right.value=false])";

/** The success side of the same guard, used only by the inverted-form selector. */
const PARSE_OK_BRANCH =
  ":matches(IfStatement[test.type='MemberExpression'][test.property.name='success'],IfStatement[test.type='Identifier'][test.name='success'])";

/** The four empty-value argument shapes a degrade branch returns. The `undefined` arm carries its type guard; see the esquery trap above. */
const PARSE_EMPTY_ARGUMENT =
  ":matches([argument.type='ObjectExpression'][argument.properties.length=0]," +
  "[argument.type='ArrayExpression'][argument.elements.length=0]," +
  "[argument.type='Identifier'][argument.name='undefined']," +
  "[argument.type='Literal'][argument.value=null])";

/**
 * The adapter naming convention BOTH adapter-singleton clauses key on (Phase 157.2, criterion C6, decisions D1(a) and D2(a), requirement D11 / ruling D11).
 *
 * TRANSCRIBED CHARACTER FOR CHARACTER from `157.2-RESEARCH.md` § "The D1 guard — measured selectors", where the five suffixes were WRITTEN AND EXECUTED against a 17-fixture matrix and scored 12/12 firing with zero false positives on the compliant set. It is not re-derived here and must not be re-derived later: a re-derived selector is a different selector, and the four deliberate evasion fixtures (V5, V5b, V7, D5) exist because the obvious derivations miss them.
 *
 * The same regex body is read off two DIFFERENT attributes below — `callee.name` for a `new` expression, `id.name` for a class declaration — which is what makes the declaration clause a composition of measured fragments rather than an invention.
 */
const ADAPTER_SUFFIXES = '/(Adapter|DataProvider|DataWriter|AdminWriter|FeedbackWriter)$/';

/**
 * ADAPTER-SINGLETON CLAUSE 1 — a module-scope `new` of an adapter class (ruling **D11**, decision **D1(a)**).
 *
 * ⚠ SIX selectors rather than one, and the count is measured rather than stylistic. A process-shared `new` can be written as a variable declarator, as the default export, as an assignment to a previously declared binding, inside a module-scope object literal, inside a module-scope array literal, or as a STATIC class field — and **no single esquery expression spans them**. `157.2-NEGATIVE-CONTROL-LEDGER.md` row 4 records the first three arms silent before this constant existed, across 21 fixture × zone pairs, and firing after; the last three were added by the `157.2-REVIEW.md` WR-08 fix and were measured on the same matrix, each firing on exactly its own shape and silent on all thirteen others, including the two factory fixtures and the INSTANCE-field fixture. Deleting an arm leaves the guard firing on most shapes and looking healthy while one evasion becomes reachable by nothing.
 *
 * WHAT IS BANNED IS THE SHARED INSTANCE, NOT THE CLASS. `157.2-02` through `157.2-08` retired the eight module-scope adapter instances the ruling names; that retires the INSTANCES and leaves the CLASS open — one new module-scope `new` next quarter undoes all of it. These six entries are what mechanically says no, and criterion D11-6 is the only one of the phase's six criteria that is about the future.
 */
const ADAPTER_MODULE_SCOPE_DECLARATION =
  ':matches(Program > VariableDeclaration, Program > ExportNamedDeclaration > VariableDeclaration)';

/**
 * The callee predicate BOTH the bare and the NAMESPACED construction shapes are read through.
 *
 * `callee.name` is `undefined` for a `MemberExpression` callee, so every arm keyed on it alone was silent on `new adapters.SupabaseDataProvider(cfg)` — and `import * as adapters from './...'` is idiomatic, not exotic. Adding `callee.property.name` costs one `:matches` and was MEASURED against the same fixture matrix: it fires on the namespaced form of each of the three original shapes and stays silent on `new lib.DataRoot()`, i.e. it still discriminates on the five suffixes rather than on the presence of a namespace.
 */
const ADAPTER_CALLEE = `:matches([callee.name=${ADAPTER_SUFFIXES}], [callee.property.name=${ADAPTER_SUFFIXES}])`;

/** The shared opening of every clause-1 message; each entry names its own form after it. `eslint-adapter-singleton-guard.test.ts` disambiguates on this substring, so it must not be re-worded on one entry alone. */
const ADAPTER_SINGLETON_MESSAGE =
  'A module-scope `new` of an adapter class creates a shared instance that every concurrent request rebinds. Export a per-call factory instead — `createDataProvider({ fetch, client })` — so each request owns its adapter.';

const ADAPTER_SINGLETON_INSTANCE = [
  {
    selector: `${ADAPTER_MODULE_SCOPE_DECLARATION} > VariableDeclarator > NewExpression${ADAPTER_CALLEE}`,
    message: `${ADAPTER_SINGLETON_MESSAGE} (Form: a module-scope variable declarator, exported or not.)`
  },
  {
    selector: `Program > ExportDefaultDeclaration > NewExpression${ADAPTER_CALLEE}`,
    message: `${ADAPTER_SINGLETON_MESSAGE} (Form: the default export.)`
  },
  {
    selector: `Program > ExpressionStatement > AssignmentExpression > NewExpression${ADAPTER_CALLEE}`,
    message: `${ADAPTER_SINGLETON_MESSAGE} (Form: assignment to a previously declared module-scope binding.)`
  },
  {
    selector: `${ADAPTER_MODULE_SCOPE_DECLARATION} > VariableDeclarator > ObjectExpression > Property > NewExpression${ADAPTER_CALLEE}`,
    message: `${ADAPTER_SINGLETON_MESSAGE} (Form: a module-scope object literal holding the instance — \`export const clients = { dp: new SupabaseDataProvider(cfg) }\`.)`
  },
  {
    selector: `${ADAPTER_MODULE_SCOPE_DECLARATION} > VariableDeclarator > ArrayExpression > NewExpression${ADAPTER_CALLEE}`,
    message: `${ADAPTER_SINGLETON_MESSAGE} (Form: a module-scope array literal holding the instance — \`export const all = [new SupabaseDataWriter(cfg)]\`.)`
  },
  {
    selector: `ClassBody > PropertyDefinition[static=true] > NewExpression${ADAPTER_CALLEE}`,
    message: `${ADAPTER_SINGLETON_MESSAGE} (Form: a STATIC class field, which is process-shared exactly like a module binding. An INSTANCE field is per-instance and stays silent.)`
  }
];

/**
 * ADAPTER-SINGLETON CLAUSE 2, SCOPED FORM — an `init` member on a class whose OWN NAME ends in an adapter suffix. Spread into ALL THREE blocks.
 *
 * WHY A DECLARATION BAN AND NOT A `.init(` CALL BAN — decision **D2**'s NOTE, answered by measurement. `CallExpression[callee.type='MemberExpression'][callee.property.name='init']` was measured FIRING on `userData.init(snapshot.userData)` and `store.init(d)`, two live in-tree sites that have nothing to do with adapters and that this phase does not touch. Shipping the call form would mean shipping two suppression comments at sites the rule was never about, which teaches the next reader that the rule is noise. And "keep only the instance clause" concedes the one thing `157.2-08`'s removal cannot prevent: nothing stops a contributor re-adding the method next quarter, and the instance clause is silent on that. The DECLARATION is live after the removal and has a permanent target.
 *
 * ⚠ WHY TWO FORMS, AND WHY THE ASYMMETRY BELOW IS NOT A TIDY-UP CANDIDATE. This is the least obvious decision in this file, and it is a MEASUREMENT rather than a taste. Executed during planning against fixtures AND against the real files: the BROAD form (`ADAPTER_INIT_DECLARATION_BROAD`, keyed on the member name alone) fires on the abstract base, on the Supabase mixin's inner class — whose name carries no adapter suffix — AND on the live `init` member of `src/lib/contexts/candidate/candidateUserDataState.svelte.ts`, which is a FALSE POSITIVE. This scoped form fires on the abstract base, and is silent on both the store and the mixin's inner class. The abstract base and the store resolve to the SAME effective zone (zone B), so NO BLOCK PLACEMENT CAN SEPARATE THEM. Therefore: the scoped form goes into all three blocks, and the broad form is confined to the adapter tree, where there is no non-adapter class for it to fire on and where it is the only form that reaches the mixin.
 */
const ADAPTER_INIT_DECLARATION_SCOPED = [
  {
    selector:
      `:matches(ClassDeclaration, ClassExpression)[id.name=${ADAPTER_SUFFIXES}]` +
      " > ClassBody > :matches(MethodDefinition, PropertyDefinition)[key.name='init']",
    message:
      "An `init` member on an adapter class reintroduces the two-step construction protocol `157.2-08` deleted, and with it the window in which a second request rebinds the first request's client. Take the configuration in the constructor instead — `constructor(config: SupabaseAdapterConfig)`. (Form: a member named `init` on a class whose own name ends in an adapter suffix; this clause ships in every zone.)"
  }
];

/**
 * ADAPTER-SINGLETON CLAUSE 2, BROAD FORM — an `init` member on ANY class body. Spread into the ADAPTER BLOCK ONLY; see the asymmetry note on `ADAPTER_INIT_DECLARATION_SCOPED` above for the measurement that confines it there.
 *
 * TRANSCRIBED CHARACTER FOR CHARACTER from `157.2-RESEARCH.md` § "Clause 2", where it was executed and scored firing on all five declaration shapes — the method, the arrow property, the async method, the mixin's inner class and the private-named `#init` evasion.
 */
const ADAPTER_INIT_DECLARATION_BROAD = [
  {
    selector: "ClassBody > :matches(MethodDefinition, PropertyDefinition)[key.name='init']",
    message:
      "An `init` member on an adapter class reintroduces the two-step construction protocol `157.2-08` deleted, and with it the window in which a second request rebinds the first request's client. Take the configuration in the constructor instead — `constructor(config: SupabaseAdapterConfig)`. (Form: any member named `init` in a class body under `src/lib/api/adapters/**`, where every class is an adapter; this clause is confined to the adapter tree because the same selector was measured firing on a live non-adapter store method outside it.)"
  }
];

/*
 * ⚠ WHAT THE ADAPTER-SINGLETON GUARD CANNOT SEE — stated here, in the guard's own file, so a green `lint:check` is NEVER read as a proof that the defect class is closed by construction. This follows `157.1`'s precedent for the parse-posture guard (see that block's comment further down) and `157.2-RESEARCH.md` § "What the guard cannot see".
 *
 * FIVE forms are NOT caught. The list is longer than the three this file originally claimed, and it was ALSO wrong to present three as exhaustive: `157.2-REVIEW.md` WR-08 found three further shapes, of which the namespaced callee, the container literal and the static class field are now CLOSED by the arms above, while the two below them are the residue those arms do not reach. An understated list is worse than none, so the count is stated as what it is rather than as what is tidy.
 *
 * 1. LAZY MODULE-LEVEL MEMOIZATION. `let c; export function get() { c ??= new SupabaseDataProvider(); return c; }` — the `new` sits syntactically INSIDE a function, so no module-scope selector reaches it, and the shared-ness lives in the module-scope `let`, which esquery cannot correlate with the construction. MEASURED SILENT.
 * 2. A RENAMED CLASS. `export const dp = new Foo();` — every clause keys on a NAMING CONVENTION, so a future adapter class whose name ends in none of the five suffixes evades them entirely. MEASURED SILENT.
 * 3. OUTSIDE THE ADAPTER TREE, A CONFIGURATION MEMBER ON A NON-ADAPTER-NAMED CLASS. `class Thing { init(c) {} }` under `src/lib/contexts/**` or `src/routes/**` is not caught, because only the SCOPED declaration form ships there and it keys on the class's own name. That is deliberate and measured — the broad form was observed firing on the live `init` member of `src/lib/contexts/candidate/candidateUserDataState.svelte.ts`, a store that has nothing to do with adapters — but it IS a hole and it is named rather than papered over.
 * 4. A CONTAINER NESTED MORE THAN ONE LEVEL, OR ONE THAT IS NOT A LITERAL. The two container arms above are CHILD combinators by design: `export const c = { a: { dp: new SupabaseDataProvider() } }` and `export const c = new Map([['dp', new SupabaseDataProvider()]])` both evade them. A descendant combinator would span every nesting depth but was rejected on measurement — it also fires on `export const createDataProvider = (c) => new SupabaseDataProvider(c)`, the factory shape this whole phase moves the tree TO, and a guard that fires on the remedy teaches the next reader that the rule is noise.
 * 5. A STATIC ACCESSOR RATHER THAN A STATIC FIELD. `static get dp() { return (this.#c ??= new SupabaseDataProvider()); }` is form 1 wearing a class; the `new` is inside a function body and the sharing lives in the static private field.
 *
 * THE BACKSTOP FOR ALL THREE is `src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts`, the C1(a) concurrency negative control (ledger rows 1 and 2). NONE of the three evasions can produce a per-request instance, so none can pass that spec's interleaving assertions: request A would still resume to read back request B's tag. A lint guard locks the MEASURED SHAPE against reopening; the concurrency spec is what actually says the contamination stopped.
 */
export default [
  ...sharedConfig,
  ...compat.extends('plugin:svelte/prettier'),
  {
    ignores: [
      'ios/*',
      'android/*',
      '**/.DS_Store',
      '**/node_modules',
      'build',
      '.svelte-kit',
      'package',
      '**/.env',
      '**/.env.*',
      '!**/.env.example',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
      'src/app.html',
      'src/error.html',
      // Frozen Svelte-5 migration fixtures: kept as regression tests but intentionally not held to production lint standards.
      '**/_spikes-*/**'
    ]
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      },

      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        extraFileExtensions: ['.svelte']
      }
    },

    settings: {
      'svelte/typescript': true
    }
  },
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  },
  // Ban `svelte/store` so any reintroduction of the store seam fails
  // `yarn lint:check`. The glob spans the whole `src/**` tree at five extensions —
  // `.ts`, `.js`, `.mjs`, `.cjs` and `.svelte`. Narrowing either the tree or the extension list reopens the hole: a live static store import in a `.js` file under `src/lib/components` passes an otherwise-identical gate untouched.
  // Flat config REPLACES (does not merge) the `no-restricted-imports` array for in-scope files, so the inherited deep-relative-`lib` `patterns` ban (shared-config/eslint.config.mjs:147-152) is re-included VERBATIM here. Omitting it would silently drop that ban for these files, because the replacement is total rather than additive.
  {
    files: ['src/**/*.{ts,js,mjs,cjs,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'svelte/store',
              message:
                'svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead.'
            }
          ],
          patterns: [
            {
              regex: '^(\\.\\./){2,}lib(/|$)',
              message:
                'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
            }
          ]
        }
      ],
      // Paired with the `no-restricted-imports` `paths` entry above: together they form ONE ban on `svelte/store`. `no-restricted-imports` sees only static `ImportDeclaration` nodes, so the dynamic `import('svelte/store')` form is closed here. Edit both or neither.
      // Flat config REPLACES this array too — it does not merge it. The inherited TS-enum ban (shared-config/eslint.config.mjs:79-85) is therefore re-included VERBATIM as the first entry below, selector and message byte-identical.
      // Dropping it would silently delete that ban for every file under
      // `apps/frontend/src/**` AND produce zero errors, because the frontend
      // contains no enums today — so no gate in this repository would catch it.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        },
        {
          selector: "ImportExpression[source.value='svelte/store']",
          message: 'svelte/store is banned. Use $state/$derived rune handles exposing `current` instead.'
        },
        // The adapter-singleton guard, SPREAD rather than appended as a fourth block; see the note above the constants. Zone A resolves to this block's array. Pre-edit: 2 entries. Post-edit: 2 + 3 + 1.
        ...ADAPTER_SINGLETON_INSTANCE,
        ...ADAPTER_INIT_DECLARATION_SCOPED
      ]
    }
  },
  // The adapter-boundary guard (REVIEW-ADP-06, criterion 6 first half, decision D-F4).
  //
  // This block is ONE ban expressed as a PAIR of rules, exactly as the `svelte/store` guard above is, and for the same structural reason. `no-restricted-imports` inspects `ImportDeclaration` nodes only. Measured, the import half alone catches 3 of the 8 leaking route files and 0 of their 13 actual Supabase calls, because the leakage is `event.locals.supabase` — a `MemberExpression`, which that rule cannot see. Five of the eight have no Supabase import at all. Edit both rules together or neither.
  //
  // FLAT-CONFIG REPLACE, measured rather than reasoned. `157-NEGATIVE-CONTROL-LEDGER.md` § Probe records `PROBE VERDICT: REPLACE` for BOTH `no-restricted-imports` and `no-restricted-syntax`: when two config objects match the same file and both set a rule, the LATER object's options array replaces the earlier one's ENTIRELY, and the replacement is per-file rather than global. That verdict DISPROVES `157-RESEARCH.md` § F.2, which reasoned a strict-subset glob would let both configs apply. It does not. Therefore all FOUR entries inherited from the block above are re-included here BYTE-IDENTICALLY: the `svelte/store` `paths` entry, the deep-relative-`lib` `patterns` entry, the `TSEnumDeclaration` selector and the `ImportExpression` selector. Dropping any of them would delete that ban for every guarded file WHILE PRODUCING ZERO ERRORS, which is why `eslint-adapter-boundary-guard.test.ts` carries a standing regression case per inherited entry.
  //
  // SCOPE. The `files` glob is the same `src/**` tree as the block above, minus `ADAPTER_BOUNDARY_ALLOWLIST`. Scoping is the whole mitigation for the member-expression selector, which fires on ANY `.supabase` access — including `this.supabase` inside the adapter, which is what the adapter is FOR. The allowlist is declared and annotated at the top of this file.
  {
    files: ['src/**/*.{ts,js,mjs,cjs,svelte}'],
    ignores: ADAPTER_BOUNDARY_ALLOWLIST,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'svelte/store',
              message:
                'svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead.'
            }
          ],
          patterns: [
            {
              regex: '^(\\.\\./){2,}lib(/|$)',
              message:
                'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
            },
            {
              regex: '^@supabase/',
              message:
                'Supabase packages are banned outside the adapter. Call through the `$lib/api/dataProvider` or `$lib/api/dataWriter` interface instead.'
            },
            {
              regex: '^\\$lib/(supabase|api/adapters)(/|$)',
              message:
                'The Supabase adapter and its client factories must not be imported directly. Use the `$lib/api/{dataProvider,dataWriter,feedbackWriter}` selectors instead.'
            }
          ]
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        },
        {
          selector: "ImportExpression[source.value='svelte/store']",
          message: 'svelte/store is banned. Use $state/$derived rune handles exposing `current` instead.'
        },
        {
          selector: "MemberExpression[property.name='supabase']",
          message:
            'A `.supabase` access reaches through the adapter boundary. Call through the `dataProvider` or `dataWriter` interface instead.'
        },
        {
          selector: "ObjectPattern > Property[key.name='supabase']",
          message:
            'Destructuring `supabase` reaches through the adapter boundary. Call through the `dataProvider` or `dataWriter` interface instead.'
        },
        // The adapter-singleton guard, SPREAD rather than appended as a fourth block; see the note above the constants. Zone B resolves to this block's array, and it is the zone that holds BOTH the abstract base and the live candidate user-data store — which is exactly why only the scoped declaration form is here. Pre-edit: 4 entries. Post-edit: 4 + 3 + 1.
        ...ADAPTER_SINGLETON_INSTANCE,
        ...ADAPTER_INIT_DECLARATION_SCOPED
      ]
    }
  },
  // The parse-posture guard (Phase 157.1, criterion 6, decisions D1(a) and D2(a), requirement D8).
  //
  // WHAT IS BANNED IS THE SHAPE, NOT A LIBRARY CALL (decision D2(a)). Banning a call would miss a NEW schema; banning strictness would miss a permissive schema carrying the same degrade branch. Phase 157.1 widened five boundary schemas and removed the known triggers, which retires the INSTANCES and leaves the CLASS open — one new helper written in the old shape undoes all of it. These five entries are what mechanically says no.
  //
  // ⚠ FLAT-CONFIG REPLACE, measured rather than reasoned — the same trap the two blocks above document, and the reason the first two entries below look like duplication. `157.1-NEGATIVE-CONTROL-LEDGER.md` row 7 records it firing: with this object present and the two entries below OMITTED, `export enum Color {}` and `await import('svelte/store')` at `src/lib/api/adapters/supabase/utils/` both linted CLEAN — zero messages of any kind — while the five parse-posture selectors fired 12/12 on their fixtures. The replacement is per-file and TOTAL, so both bans vanished for every adapter file and NO GATE IN THIS REPOSITORY reported anything: the adapter contains no enums and no dynamic store imports today. The entries are therefore re-included BYTE-IDENTICALLY from their sources — `TSEnumDeclaration` from `packages/shared-config/eslint.config.mjs`, the dynamic `ImportExpression` from the `src/**` store-guard block above — selector and message text alike.
  // A future editor who tidies this duplication away reopens the hole. Do not. The only detector is the pair of standing regressions in `src/lib/_guards/eslint-parse-posture-guard.test.ts`, one per re-included entry.
  //
  // ⚠ The sibling IMPORT-restriction rule that the `svelte/store` guard above pairs with its syntax ban is DELIBERATELY NOT SET in this object. Leaving a rule entirely unset means no replacement occurs for it and its inherited array survives untouched for adapter files; setting it to an empty array is NOT the same thing and would delete those bans. (Its rule id is deliberately not spelled anywhere in this object, because `157.1-07`'s prohibition check greps this block for that literal and requires zero hits — the mechanical form of "this object sets exactly one rule". Measured under stage one: a deep-relative `lib` import at a guarded adapter path still fires the inherited pattern ban.)
  //
  // NO `ignores` KEY, on purpose. `ADAPTER_BOUNDARY_ALLOWLIST` above EXEMPTS `src/lib/api/adapters/**`, which is this guard's ENTIRE SCOPE. Copying that list here would invert the intent and produce a guard that never fires.
  //
  // SCOPE is the adapter tree at the same FIVE extensions the store guard uses, whose own comment records that narrowing either the tree or the extension list reopens the hole. There are no `.svelte` files under the adapter today, which is the argument FOR including that extension rather than against it.
  //
  // WHAT THIS GUARD CANNOT SEE, stated honestly so a green lint is not mistaken for a proof the class is closed by construction (`157.1-RESEARCH.md` § "What the guard cannot see"). A `return EMPTY;` naming a module-level empty constant is caught by the LAST entry only, because that entry keys on the absence of an `issues`/`error` identifier rather than on the returned literal. A `return degradeToEmpty();` whose helper returns `{}`, a `try { … } catch { return {}; }` around a `.parse()`, and a `.catch(() => ({}))` on a promise are caught by NOTHING: esquery matching is purely syntactic and cannot follow a value across a function boundary or out of a catch clause. If `.parse()` ever appears at this boundary — it does not today — a sixth entry for the catch form is the follow-up.
  {
    files: ['src/lib/api/adapters/**/*.{ts,js,mjs,cjs,svelte}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        // Re-included byte-identically; see the FLAT-CONFIG REPLACE note above. Entry 1 of 2.
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        },
        // Re-included byte-identically; see the FLAT-CONFIG REPLACE note above. Entry 2 of 2.
        {
          selector: "ImportExpression[source.value='svelte/store']",
          message: 'svelte/store is banned. Use $state/$derived rune handles exposing `current` instead.'
        },
        {
          selector: `${PARSE_FAIL_BRANCH} :matches(ReturnStatement${PARSE_EMPTY_ARGUMENT}, ReturnStatement:not([argument]))`,
          message:
            'A parse-failure branch must not return an empty value. Return a `ParseOutcome` instead — `parseMalformed(issues, value)` from `utils/parseOutcome` — so that malformed stays distinguishable from absent.'
        },
        {
          selector:
            ":matches(ConditionalExpression[test.type='MemberExpression'][test.property.name='success'], ConditionalExpression[test.type='Identifier'][test.name='success'])" +
            ":matches([alternate.type='ObjectExpression'][alternate.properties.length=0], [alternate.type='ArrayExpression'][alternate.elements.length=0])",
          message:
            'A `.success` conditional must not fall back to an empty literal. Return a `ParseOutcome` instead; an `undefined` alternate inside a wider outcome is the partial-preserve shape and is allowed.'
        },
        {
          selector:
            "LogicalExpression[operator='??'][left.callee.name=/^parse[A-Z]/]" +
            ":matches([right.type='ObjectExpression'][right.properties.length=0], [right.type='ArrayExpression'][right.elements.length=0], [right.type='Literal'][right.value=null])",
          message:
            'A `parse*` call must not fall back to an empty literal. Branch on the `ParseOutcome` `status` instead — coalescing it discards the distinction the outcome type exists to carry.'
        },
        {
          selector: `${PARSE_OK_BRANCH}:not([alternate]) + :matches(ReturnStatement${PARSE_EMPTY_ARGUMENT})`,
          message:
            'An inverted `.success` branch must not fall through to an empty return. Return a `ParseOutcome` from BOTH branches — inverting the guard does not change what the empty value means.'
        },
        {
          selector: `${PARSE_FAIL_BRANCH} ReturnStatement:not(:has(Identifier[name=/^(issues|error)$/]))`,
          message:
            'A parse-failure return must carry `issues` (or `error`). Return a `ParseOutcome` — `parseMalformed(issues, value)` — so the caller can tell a refused value from an absent one.'
        },
        // The adapter-singleton guard, SPREAD rather than appended as a fourth block; see the note above the constants. This is THE ADAPTER BLOCK — the only one whose glob is the adapter tree — so it is the only block that carries the BROAD declaration form. Pre-edit: 7 entries. Post-edit: 7 + 3 + 1 + 1.
        ...ADAPTER_SINGLETON_INSTANCE,
        ...ADAPTER_INIT_DECLARATION_SCOPED,
        ...ADAPTER_INIT_DECLARATION_BROAD
      ]
    }
  }
];
