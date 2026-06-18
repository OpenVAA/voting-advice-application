import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/**
 * RUNES-03 lock-in self-test — the `svelte/store` ESLint guard regression gate.
 *
 * Traceability: RUNES-03 / D-01.3 (met-via-Phase-115-SWEEP-03).
 *
 * The hard part of RUNES-03 — widening the `no-restricted-imports` guard glob to
 * `src/**\/*.{ts,svelte}` and clearing every `svelte/store` import — already landed
 * in Phase 115 SWEEP-03 (see `apps/frontend/eslint.config.mjs` lines 77-84). This
 * spec makes the lock-in PROVABLE rather than merely present: it asserts the guard
 * actually FIRES on a deliberate `import { writable } from 'svelte/store'` (so a
 * future reintroduction breaks the test suite, not just lints clean by accident),
 * AND that it stays SILENT on clean rune code. Per D-01/D-02 the guard config is
 * NOT edited here — this is a SEPARATE vitest spec, side-stepping the flat-config
 * REPLACE-not-merge trap.
 *
 * Correctness invariants (RESEARCH Pitfalls 1-2):
 * - `probePath` MUST resolve under `apps/frontend/src/**` so the
 *   `files: ['src/**\/*.{ts,svelte}']` guard scope applies — a filePath outside
 *   `src/` gives a false PASS.
 * - `new ESLint({ flags: ['v10_config_lookup_from_file'] })` is MANDATORY so the
 *   test loads the real `apps/frontend/eslint.config.mjs` (matches the repo `lint`
 *   script exactly; omitting it risks config-resolution drift).
 * - Filter messages by `ruleId === 'no-restricted-imports'` (NOT a bare
 *   `errorCount`) — the violating fixture also trips an unrelated
 *   `import/newline-after-import` rule.
 */

const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });

// The probe path is virtual — no file is written there. It is only passed as
// `lintText`'s `filePath` option so the fixture resolves UNDER `apps/frontend/src/**`
// and the `files: ['src/**\/*.{ts,svelte}']` guard scope applies.
const probePath = path.resolve(__dirname, '__store_guard_probe__.ts');

describe('svelte/store ESLint guard (RUNES-03 lock-in)', () => {
  it('fires no-restricted-imports on a svelte/store import (positive control)', async () => {
    const [result] = await eslint.lintText("import { writable } from 'svelte/store';\nexport const x = writable(0);\n", {
      filePath: probePath
    });
    const restricted = result.messages.filter((m) => m.ruleId === 'no-restricted-imports');
    expect(restricted.length).toBeGreaterThan(0);
  });

  it('stays silent on a clean rune file (negative control)', async () => {
    const [result] = await eslint.lintText('export const x = $state(0);\n', { filePath: probePath });
    const restricted = result.messages.filter((m) => m.ruleId === 'no-restricted-imports');
    expect(restricted.length).toBe(0);
  });
});
