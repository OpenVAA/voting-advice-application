import path from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Lock-in self-test — the `svelte/store` ESLint guard's APP-WIDE REACH, proven at four directories x two extensions rather than at a single probe path.
 *
 * Matrix axes:
 *   dir       — lib/components | lib/utils | lib/dynamic-components | lib/candidate/components extension — .ts | .svelte assertion — fires on a static store import | stays silent on clean rune code | parses without a fatal message 4 x 2 x 3 = 24 matrix assertions, plus 3 extension probes, 2 dynamic-import probes and 1 inherited-ban regression case = 30 cases.
 *
 * The CONSTRUCTION half — widening the guard glob beyond `lib/contexts` + `routes`, clearing every real `svelte/store` import, and closing the dynamic `import()` form — is done and lives in the config. This spec supplies the PROOF half: the guard is asserted to FIRE on a deliberate store import — so a future reintroduction breaks the test suite rather than linting clean by accident — AND to stay SILENT on clean rune code, so "it fires" is a discriminating signal rather than a constant.
 *
 * Stable anchor, deliberately NOT a line citation: the guard lives in `apps/frontend/eslint.config.mjs`, in the block whose `rules` object holds `no-restricted-imports` (the static form, plus the inherited deep-relative-`lib` `patterns` ban) and `no-restricted-syntax` (the dynamic form, plus the inherited TS-enum ban). Line ranges move on every edit — rule keys do not. The guard config is NOT edited here: this is a SEPARATE vitest spec, which is what side-steps the flat-config REPLACE-not-merge trap the config's own comments document.
 *
 * Correctness invariants. Each one is a distinct way this spec could hand back a false PASS:
 *
 * 1. Every probe `filePath` MUST resolve under `apps/frontend/src` (see `SRC` below), or
 *    the guard block's `files` scope simply does not apply and every assertion passes vacuously. Stated WITHOUT quoting the glob text: the glob has now been widened twice, and a quoted-and-then-stale glob is exactly how this file's header became a record target in the first place.
 * 2. `new ESLint({ flags: ['v10_config_lookup_from_file'] })` is MANDATORY. It loads the
 *    real `apps/frontend/eslint.config.mjs` and matches `apps/frontend/package.json`'s lint script exactly; omitting it risks config-resolution drift, and the spec would then be measuring a different config than the gate does.
 * 3. Filter messages by `ruleId` — never by a bare `errorCount`. The violating fixture
 *    also trips an unrelated `import/newline-after-import` rule, so a count assertion would pass for the wrong reason.
 * 4. TWO bans share `ruleId === 'no-restricted-syntax'`: the dynamic
 *    `svelte/store` closure and the inherited TS-enum ban. Assertions therefore disambiguate on the MESSAGE SUBSTRING — 'svelte/store is banned' for the dynamic cases, 'const assertion' for the enum case — and NEVER on line or column. Line and column move with any edit; the messages are the contract.
 */

// MANDATORY (invariant 2): loads the real apps/frontend/eslint.config.mjs.
const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });

// MANDATORY (invariant 1): every probe path resolves under apps/frontend/src, which is what puts the fixture inside the guard block's `files` scope. The paths below are VIRTUAL — no file is ever written to them; they are only passed as `lintText`'s `filePath` option.
// The shipped glob is src/**/*.{ts,js,mjs,cjs,svelte} — recorded here for the reader,
// asserted nowhere: the config is the source of truth, and the probes below measure it.
const SRC = path.resolve(__dirname, '../..');

const GUARDED_DIRS = ['lib/components', 'lib/utils', 'lib/dynamic-components', 'lib/candidate/components'] as const;

const STORE_IMPORT = {
  '.ts': "import { writable } from 'svelte/store';\n\nexport const x = writable(0);\n",
  '.svelte':
    '<script lang="ts">\n  import { writable } from \'svelte/store\';\n\n  const x = writable(0);\n</script>\n\n<p>{$x}</p>\n'
} as const;

const CLEAN_RUNE = {
  '.ts': 'export const x = $state(0);\n',
  '.svelte': '<script lang="ts">\n  let x = $state(0);\n</script>\n\n<p>{x}</p>\n'
} as const;

// Array-of-arrays + %s positional tokens is the repo's house style for table-driven specs, and it dissolves the quoted-object title rendering an object-shaped table would otherwise produce.
const cases = GUARDED_DIRS.flatMap((dir) =>
  (Object.keys(STORE_IMPORT) as Array<keyof typeof STORE_IMPORT>).map((ext) => [dir, ext] as const)
);

describe('svelte/store ESLint guard — ASSERT-08 app-wide reach', () => {
  // Correctness invariant 5, from a measured gate failure: the FIRST `lintText` call in this file pays the one-time cost of resolving the real flat config and loading the typescript-eslint parser. Every later call is warm. Left unhoisted, that one-time cost is charged to whichever assertion happens to run first, against vitest's DEFAULT 5000ms per-test budget — so the spec's outcome depends on how busy the machine is, not on the guard under test.
  //
  // Measured: the first `it` cost 651-1047ms when the file ran alone, and 5391ms inside the full 54-file frontend suite under concurrent load, failing with `Test timed out in 5000ms`. Same tree, same assertion, opposite verdict.
  // That is the timing-fragility class CLAUDE.md forbids treating as flaky, and the fix is to remove the cost from the budget rather than to widen the budget: warm the instance ONCE here, under an explicit hook timeout large enough that scheduling noise cannot reach it. No assertion changes — every `it` below still makes its own call.
  beforeAll(async () => {
    await eslint.lintText(CLEAN_RUNE['.ts'], {
      filePath: path.join(SRC, GUARDED_DIRS[0], '__store_guard_warmup__.ts')
    });
  }, 120_000);

  describe.each(cases)('guard reach: src/%s/__store_guard_probe__%s', (dir, ext) => {
    const probePath = path.join(SRC, dir, `__store_guard_probe__${ext}`);

    it('fires no-restricted-imports on a static svelte/store import', async () => {
      const [result] = await eslint.lintText(STORE_IMPORT[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBeGreaterThan(0);
    });

    it('stays silent on clean rune code (negative control)', async () => {
      const [result] = await eslint.lintText(CLEAN_RUNE[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBe(0);
    });

    // Guards the negative control itself: a parse failure yields a fatal message and would otherwise read as "silent".
    it('parses without a fatal message', async () => {
      const [result] = await eslint.lintText(STORE_IMPORT[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.fatal)).toEqual([]);
    });
  });

  // A guard glob covering only .ts and .svelte lets a live static store import in a .js file under a guarded directory pass the entire gate untouched — measured against exactly that narrower glob.
  describe('extension reach — .js / .mjs / .cjs under a guarded directory', () => {
    it.each([['.js'], ['.mjs'], ['.cjs']])(
      'fires no-restricted-imports on a static svelte/store import in a %s file',
      async (ext) => {
        const [result] = await eslint.lintText(STORE_IMPORT['.ts'], {
          filePath: path.join(SRC, 'lib/components', `__store_guard_probe__${ext}`)
        });
        expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBeGreaterThan(0);
      }
    );
  });

  // `no-restricted-imports` inspects static `ImportDeclaration` nodes only, so an `ImportExpression` never reaches it. The dynamic form is closed by a separate rule — hence the message-substring filter required by invariant 4.
  describe('dynamic import() closure', () => {
    it('fires no-restricted-syntax on await import(svelte/store) in .ts', async () => {
      const [result] = await eslint.lintText(
        "export async function f() {\n  return await import('svelte/store');\n}\n",
        { filePath: path.join(SRC, 'lib/utils', '__store_guard_probe__.ts') }
      );
      const dynamicBan = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('svelte/store is banned')
      );
      expect(dynamicBan.length).toBeGreaterThan(0);
    });

    it('fires no-restricted-syntax on import(svelte/store) in a .svelte script block', async () => {
      const [result] = await eslint.lintText(
        '<script lang="ts">\n  const p = import(\'svelte/store\');\n</script>\n\n<p>{p}</p>\n',
        { filePath: path.join(SRC, 'lib/components', '__store_guard_probe__.svelte') }
      );
      const dynamicBan = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('svelte/store is banned')
      );
      expect(dynamicBan.length).toBeGreaterThan(0);
    });
  });

  // This enum case lives in a `svelte/store` guard spec on purpose.
  // Adding `no-restricted-syntax` to the frontend block REPLACES the inherited option array rather than merging it, so a single-entry array would silently delete the TS-enum ban for every file under apps/frontend/src — and, because the frontend has no enums today, would produce ZERO errors and pass every gate in this repository.
  // The standing case below is the only mechanism that catches a recurrence.
  it('still enforces the inherited TSEnumDeclaration ban (flat-config REPLACE regression)', async () => {
    const [result] = await eslint.lintText("export enum Color {\n  Red = 'red'\n}\n", {
      filePath: path.join(SRC, 'lib/utils', '__store_guard_probe__.ts')
    });
    const enumBan = result.messages.filter(
      (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('const assertion')
    );
    expect(enumBan.length).toBeGreaterThan(0);
  });
});
