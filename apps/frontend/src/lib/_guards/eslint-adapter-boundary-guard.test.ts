import path from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Lock-in self-test — the ADAPTER-BOUNDARY ESLint guard (REVIEW-ADP-06, criterion 6 first half, decision D-F4).
 *
 * The guard is ONE ban expressed as a PAIR of rules, and this spec proves BOTH halves fire. `no-restricted-imports` inspects `ImportDeclaration` nodes only. Measured against the real tree, that half alone catches 3 of the 8 leaking route files and 0 of their 13 actual Supabase calls, because the leakage is `event.locals.supabase` — a `MemberExpression` the import rule cannot see, in files five of which have no Supabase import at all. A spec that exercised only the import half would report a working guard that misses the entire measured leak.
 *
 * Matrix axes and the deliberate trim. `157-RESEARCH.md` § F.4 specifies six guarded directories x two extensions x four violation fixtures x three assertions, which is roughly 150 assertions, and recommends trimming rather than shipping assertions nobody reads. The trim taken here is THREE guarded directories — one server-route tree, one API-route tree and one component tree — which are the three structurally distinct loci the boundary can be crossed from. The dropped directories differ from a kept one only in their path text, and the `files` glob is measured by the kept probes rather than quoted. 3 dirs x 2 ext x 4 fixtures x 3 assertions = 72 matrix assertions, plus 4 clean-code silence probes, 4 allowed-locus silence probes, 2 shrinking-allowlist probes and 4 inherited-ban standing regressions.
 *
 * Stable anchor, deliberately NOT a line citation: the guard lives in `apps/frontend/eslint.config.mjs`, in the config object whose `ignores` is `ADAPTER_BOUNDARY_ALLOWLIST`. Line ranges move on every edit; rule keys and the allowlist identifier do not.
 *
 * Correctness invariants, carried over from `eslint-store-guard.test.ts` because each one is a distinct way this spec could hand back a false PASS:
 *
 * 1. Every probe `filePath` MUST resolve under `apps/frontend/src` (see `SRC` below), or the guard block's `files` scope simply does not apply and every assertion passes vacuously. The paths are VIRTUAL — no file is ever written to any of them.
 * 2. `new ESLint({ flags: ['v10_config_lookup_from_file'] })` is MANDATORY. It loads the real `apps/frontend/eslint.config.mjs` and matches `apps/frontend/package.json`'s lint script exactly; omitting it risks config-resolution drift, and this spec would then measure a different config than the gate does.
 * 3. Assert on `ruleId`, never on a bare problem count. A violating fixture also trips unrelated rules — `unused-imports/no-unused-imports` is an ERROR in shared-config — so a count assertion would pass for the wrong reason.
 * 4. FOUR bans share `ruleId === 'no-restricted-syntax'` and FOUR share `ruleId === 'no-restricted-imports'`. Assertions therefore disambiguate on the MESSAGE SUBSTRING and NEVER on line or column. Line and column move with any edit; the messages are the contract.
 * 5. The flat-config REPLACE trap gets a standing regression case PER INHERITED BAN, not just for the enum one. `157-14` measured the semantics — `PROBE VERDICT: REPLACE`, per-file, for both rules — and these four cases are what keeps that answer true after a future editor restructures the blocks. Dropping an inherited entry produces ZERO errors on the real tree, so no other gate in this repository would catch it.
 */

// MANDATORY (invariant 2): loads the real apps/frontend/eslint.config.mjs.
const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });

// MANDATORY (invariant 1): every probe path resolves under apps/frontend/src, which is what puts the fixture inside the guard block's `files` scope. The paths below are VIRTUAL — no file is ever written to them; they are only passed as `lintText`'s `filePath` option.
const SRC = path.resolve(__dirname, '../..');

// Three structurally distinct loci the boundary can be crossed from: a server-route tree, an API-route tree and a component tree. None of these directories is on the allowlist, so a violation in any of them must fire.
const GUARDED_DIRS = ['routes/candidate', 'routes/api', 'lib/components'] as const;

/** The two allowed loci INSIDE the boundary. The adapter must keep using Supabase; a guard that fires here is broken rather than strict. */
const ALLOWED_LOCI = ['lib/api/adapters/supabase/dataProvider', 'lib/supabase'] as const;

type Ext = '.ts' | '.svelte';

/**
 * The four violation fixtures, each paired with the ruleId it must trip and the message substring that disambiguates it from its co-ruleId siblings (invariant 4).
 */
const VIOLATIONS = [
  {
    name: 'a @supabase/* package import',
    ruleId: 'no-restricted-imports',
    messageSubstring: 'Supabase packages are banned outside the adapter',
    source: {
      '.ts': "import type { EmailOtpType } from '@supabase/supabase-js';\n\nexport type Probe = EmailOtpType;\n",
      '.svelte':
        '<script lang="ts">\n  import { createBrowserClient } from \'@supabase/ssr\';\n\n  const factory = createBrowserClient;\n</script>\n\n<p>{typeof factory}</p>\n'
    } satisfies Record<Ext, string>
  },
  {
    name: 'a direct $lib/api/adapters import',
    ruleId: 'no-restricted-imports',
    messageSubstring: 'must not be imported directly',
    source: {
      '.ts':
        "import { supabaseAdapter } from '$lib/api/adapters/supabase/supabaseAdapter';\n\nexport const probe = supabaseAdapter;\n",
      '.svelte':
        '<script lang="ts">\n  import { supabaseAdapter } from \'$lib/api/adapters/supabase/supabaseAdapter\';\n\n  const probe = supabaseAdapter;\n</script>\n\n<p>{typeof probe}</p>\n'
    } satisfies Record<Ext, string>
  },
  {
    name: 'a locals.supabase member access',
    ruleId: 'no-restricted-syntax',
    messageSubstring: 'A `.supabase` access',
    source: {
      '.ts':
        'export async function POST({ locals }) {\n  await locals.supabase.auth.signOut();\n  return new Response();\n}\n',
      '.svelte':
        '<script lang="ts">\n  const { data } = $props();\n  const client = data.supabase;\n</script>\n\n<p>{typeof client}</p>\n'
    } satisfies Record<Ext, string>
  },
  {
    name: 'a destructured supabase binding',
    ruleId: 'no-restricted-syntax',
    messageSubstring: 'Destructuring `supabase`',
    source: {
      '.ts': 'export function probe(locals) {\n  const { supabase } = locals;\n  return supabase;\n}\n',
      '.svelte': '<script lang="ts">\n  const { supabase } = $props();\n</script>\n\n<p>{typeof supabase}</p>\n'
    } satisfies Record<Ext, string>
  }
] as const;

/** Clean code that reaches the same capability THROUGH the interface. The guard must stay silent on it, or "it fires" is a constant rather than a discriminating signal. */
const CLEAN: Record<Ext, string> = {
  '.ts':
    "import { dataWriter } from '$lib/api/dataWriter';\n\nexport async function probe() {\n  await dataWriter.logout();\n}\n",
  '.svelte':
    '<script lang="ts">\n  import { dataWriter } from \'$lib/api/dataWriter\';\n\n  const onLogout = () => dataWriter.logout();\n</script>\n\n<button onclick={onLogout}>Log out</button>\n'
};

const BOUNDARY_RULE_IDS = ['no-restricted-imports', 'no-restricted-syntax'];

/** The message substrings the guard's OWN four entries carry, so an allowed-locus silence probe cannot be satisfied by an inherited ban staying quiet. */
const BOUNDARY_MESSAGES = [
  'Supabase packages are banned outside the adapter',
  'must not be imported directly',
  'A `.supabase` access',
  'Destructuring `supabase`'
];

function boundaryMessages(messages: Array<{ ruleId: string | null; message: string }>) {
  return messages.filter(
    (m) =>
      m.ruleId !== null && BOUNDARY_RULE_IDS.includes(m.ruleId) && BOUNDARY_MESSAGES.some((s) => m.message.includes(s))
  );
}

const cases = GUARDED_DIRS.flatMap((dir) =>
  (['.ts', '.svelte'] as const).flatMap((ext) => VIOLATIONS.map((v) => [dir, ext, v.name] as const))
);

function fixtureFor(name: string) {
  const found = VIOLATIONS.find((v) => v.name === name);
  if (!found) throw new Error(`unknown fixture: ${name}`);
  return found;
}

describe('adapter-boundary ESLint guard — REVIEW-ADP-06', () => {
  // Correctness invariant 6, from a measured gate failure recorded in `eslint-store-guard.test.ts`: the FIRST `lintText` call in a file pays the one-time cost of resolving the real flat config and loading the typescript-eslint parser. Left unhoisted, that cost is charged to whichever assertion happens to run first, against vitest's DEFAULT 5000ms per-test budget — so the outcome depends on how busy the machine is rather than on the guard under test. Measured there: 651-1047ms alone, 5391ms inside the full frontend suite under concurrent load, failing with `Test timed out in 5000ms`. That is the timing-fragility class CLAUDE.md forbids treating as flaky, and the fix is to remove the cost from the budget rather than to widen it.
  beforeAll(async () => {
    await eslint.lintText(CLEAN['.ts'], {
      filePath: path.join(SRC, GUARDED_DIRS[0], '__adapter_guard_warmup__.ts')
    });
  }, 120_000);

  describe.each(cases)('guard reach: src/%s/__adapter_guard_probe__%s — %s', (dir, ext, name) => {
    const probePath = path.join(SRC, dir, `__adapter_guard_probe__${ext}`);
    const fixture = fixtureFor(name);

    it(`fires ${fixtureFor(name).ruleId} on the violation`, async () => {
      const [result] = await eslint.lintText(fixture.source[ext], { filePath: probePath });
      const hits = result.messages.filter(
        (m) => m.ruleId === fixture.ruleId && m.message.includes(fixture.messageSubstring)
      );
      expect(hits.length).toBeGreaterThan(0);
    });

    it('stays silent on clean code that calls through the interface (negative control)', async () => {
      const [result] = await eslint.lintText(CLEAN[ext], { filePath: probePath });
      expect(boundaryMessages(result.messages)).toEqual([]);
    });

    // Guards the negative control itself: a parse failure yields a fatal message and would otherwise read as "silent".
    it('parses without a fatal message', async () => {
      const [result] = await eslint.lintText(fixture.source[ext], { filePath: probePath });
      expect(result.messages.filter((m) => m.fatal)).toEqual([]);
    });
  });

  // The must-NOT-fire half, and the reason the guard needed a narrower scope than the import bans. `MemberExpression[property.name='supabase']` fires on ANY `.supabase` access, including `this.supabase` inside the adapter — which is what the adapter is FOR. `157-NEGATIVE-CONTROL-LEDGER.md` row C records the same result against the real, unmodified `supabaseDataProvider.ts`.
  describe('allowed loci INSIDE the boundary stay silent', () => {
    const ADAPTER_INTERNALS =
      "import { createBrowserClient } from '@supabase/ssr';\n\nexport class Probe {\n  private supabase = createBrowserClient;\n  read() {\n    const { supabase } = this;\n    return this.supabase && supabase;\n  }\n}\n";

    it.each(ALLOWED_LOCI)('stays silent on adapter-internal Supabase use under src/%s', async (locus) => {
      const [result] = await eslint.lintText(ADAPTER_INTERNALS, {
        filePath: path.join(SRC, locus, '__adapter_guard_probe__.ts')
      });
      expect(boundaryMessages(result.messages)).toEqual([]);
    });

    it.each(ALLOWED_LOCI)('parses the adapter-internal fixture without a fatal message under src/%s', async (locus) => {
      const [result] = await eslint.lintText(ADAPTER_INTERNALS, {
        filePath: path.join(SRC, locus, '__adapter_guard_probe__.ts')
      });
      expect(result.messages.filter((m) => m.fatal)).toEqual([]);
    });
  });

  // The shrinking half of the allowlist: the nine grandfathered sites OUTSIDE the boundary. These probe the REAL file paths rather than invented ones, because the allowlist names exact files — an entry that stopped matching its file would turn the gate red on the untouched tree, and this is what catches a mistyped path before the next editor does.
  describe('grandfathered allowlist entries stay silent', () => {
    it.each([['routes/candidate/(protected)/+layout.server.ts'], ['hooks.server.ts']])(
      'stays silent on a locals.supabase access in the allowlisted src/%s',
      async (relativePath) => {
        const [result] = await eslint.lintText(fixtureFor('a locals.supabase member access').source['.ts'], {
          filePath: path.join(SRC, relativePath)
        });
        expect(boundaryMessages(result.messages)).toEqual([]);
      }
    );
  });

  // The allowlist SHRINKING, measured rather than asserted. `157-16` moved `routes/candidate/preregister/+layout.server.ts` onto `dataProvider.getAppSettings()` and struck its allowlist entry, taking the list from ten to nine. Deleting a line from an array is not evidence that the path became guarded, so these cases lint the same violation fixtures at that REAL path and require them to FIRE. They are the inverse of the silence cases above, and they are what would go red if a future editor re-added the entry.
  describe('the de-allowlisted preregister route is now guarded (157-16)', () => {
    const DE_ALLOWLISTED = 'routes/candidate/preregister/+layout.server.ts';
    const probePath = path.join(SRC, DE_ALLOWLISTED);

    it.each(VIOLATIONS.map((v) => [v.name] as const))(
      'fires on %s at the de-allowlisted src/routes/candidate/preregister path',
      async (name) => {
        const fixture = fixtureFor(name);
        const [result] = await eslint.lintText(fixture.source['.ts'], { filePath: probePath });
        const hits = result.messages.filter(
          (m) => m.ruleId === fixture.ruleId && m.message.includes(fixture.messageSubstring)
        );
        expect(hits.length).toBeGreaterThan(0);
      }
    );

    // The discrimination half: the same four fixtures must still be silent at a path that IS allowlisted, or "it fires" would be a property of the fixtures rather than of the allowlist edit.
    it.each(VIOLATIONS.map((v) => [v.name] as const))(
      'stays silent on %s at the still-allowlisted src/hooks.server.ts',
      async (name) => {
        const fixture = fixtureFor(name);
        const [result] = await eslint.lintText(fixture.source['.ts'], {
          filePath: path.join(SRC, 'hooks.server.ts')
        });
        expect(boundaryMessages(result.messages)).toEqual([]);
      }
    );

    // The real file, not a fixture: after the `157-16` rewrite it must be clean under the now-stricter scope. This is the case that goes red if the rewrite left a Supabase reference behind.
    it('finds no boundary violation in the real rewritten route file', async () => {
      const [result] = await eslint.lintFiles([probePath]);
      expect(boundaryMessages(result.messages)).toEqual([]);
    });
  });

  // Standing regressions for the flat-config REPLACE trap, one per inherited ban (invariant 5). The guard block sets BOTH restricted rules for every guarded file, so BOTH inherited option arrays are replaced wholesale rather than merged. All four probes run at a GUARDED path on purpose: that is where the replacement happens, and therefore where a dropped entry would vanish.
  describe('inherited bans survive the flat-config REPLACE (standing regressions)', () => {
    const guardedPath = path.join(SRC, 'lib/components', '__adapter_guard_probe__.ts');

    it('still enforces the inherited TSEnumDeclaration ban', async () => {
      const [result] = await eslint.lintText("export enum Color {\n  Red = 'red'\n}\n", { filePath: guardedPath });
      const hits = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('const assertion')
      );
      expect(hits.length).toBeGreaterThan(0);
    });

    it('still enforces the inherited deep-relative-lib patterns ban', async () => {
      const [result] = await eslint.lintText("import { thing } from '../../lib/thing';\n\nexport const x = thing;\n", {
        filePath: guardedPath
      });
      const hits = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-imports' && m.message.includes('Use the $lib alias instead of deep relative')
      );
      expect(hits.length).toBeGreaterThan(0);
    });

    it('still enforces the inherited svelte/store paths ban', async () => {
      const [result] = await eslint.lintText(
        "import { writable } from 'svelte/store';\n\nexport const x = writable(0);\n",
        {
          filePath: guardedPath
        }
      );
      const hits = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-imports' && m.message.includes('svelte/store is banned in migrated contexts')
      );
      expect(hits.length).toBeGreaterThan(0);
    });

    it('still enforces the inherited dynamic svelte/store ImportExpression ban', async () => {
      const [result] = await eslint.lintText(
        "export async function f() {\n  return await import('svelte/store');\n}\n",
        {
          filePath: guardedPath
        }
      );
      const hits = result.messages.filter(
        (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('svelte/store is banned.')
      );
      expect(hits.length).toBeGreaterThan(0);
    });
  });
});
