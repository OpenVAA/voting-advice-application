import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

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

// The probe path is virtual — no file is written there. It is only passed as
// `lintText`'s `filePath` option so the fixture resolves UNDER `apps/frontend/src/**`
// and the `files: ['src/**\/*.{ts,svelte}']` guard scope applies.
const probePath = path.resolve(__dirname, '__store_guard_probe__.ts');

describe('svelte/store ESLint guard (RUNES-03 lock-in)', () => {
  it('fires no-restricted-imports on a svelte/store import (positive control)', async () => {
    const [result] = await eslint.lintText(
      "import { writable } from 'svelte/store';\nexport const x = writable(0);\n",
      {
        filePath: probePath
      }
    );
    const restricted = result.messages.filter((m) => m.ruleId === 'no-restricted-imports');
    expect(restricted.length).toBeGreaterThan(0);
  });

  it('stays silent on a clean rune file (negative control)', async () => {
    const [result] = await eslint.lintText('export const x = $state(0);\n', { filePath: probePath });
    const restricted = result.messages.filter((m) => m.ruleId === 'no-restricted-imports');
    expect(restricted.length).toBe(0);
  });
});
