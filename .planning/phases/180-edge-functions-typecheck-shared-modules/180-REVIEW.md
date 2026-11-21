---
phase: 180-edge-functions-typecheck-shared-modules
reviewed: 2026-11-13T16:05:02Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts
  - apps/supabase/package.json
  - apps/supabase/supabase/functions/_shared/envConfig.test.ts
  - apps/supabase/supabase/functions/_shared/envConfig.ts
  - apps/supabase/supabase/functions/_shared/placeholderAddress.test.ts
  - apps/supabase/supabase/functions/_shared/placeholderAddress.ts
  - apps/supabase/supabase/functions/account-access/addressConfirmation.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/deno.json
  - apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/identity-callback/placeholderAccount.test.ts
  - apps/supabase/supabase/functions/identity-callback/serverCredential.ts
  - apps/supabase/supabase/functions/send-email/callerAuthority.ts
  - apps/supabase/supabase/functions/send-email/index.ts
  - apps/supabase/supabase/functions/send-email/templateVars.ts
  - packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts
  - scripts/assert-edge-env-defaults.mjs
  - scripts/assert-edge-function-env.mjs
findings:
  critical: 0
  warning: 1
  info: 5
  total: 6
  necessity: 1
status: issues_found
---

# Phase 180: Code Review Report

**Reviewed:** 2026-11-13T16:05:02Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

I reviewed `git diff -M 32314f7d4 HEAD` over the 19 listed files. That covers the move of `envConfig.ts` and `placeholderAddress.ts` into `functions/_shared/`, the deletion of `send-email/jwtSegment.ts` and its test, the `SupabaseClient` typing in `identity-callback/index.ts`, the pinned `deno@2.9.6` devDependency with the `typecheck` script and `functions/deno.json`, and the removal of copy-drift Check 2 from `scripts/assert-edge-env-defaults.mjs`.

I verified these directly, all read-only:
- `yarn workspace @openvaa/supabase typecheck` exits 0. On a scratch copy of the functions tree, `deno check .` checks all 22 non-test modules, `_shared/` included, and turns red on type errors injected into `_shared/envConfig.ts` and `identity-callback/index.ts`. The typecheck is a real check, not one that passes by accident.
- `yarn workspace @openvaa/supabase test:unit`: 26 files and 1150 tests pass. `edgeEnvDefaultsGate.test.ts` and `ciTypecheckGate.test.ts` pass.
- `assert-edge-env-defaults.mjs` reports `2 of 2`, 0 violations. `assert-edge-function-env.mjs` derives 11 names, 0 violations. `assert:declared-binaries`, `assert:comment-hygiene`, `assert:no-candidate-app-names` and `assert:env-pair-registry` are all clean.
- Leftover references: no source, test, script, app doc or README imports or names `jwtSegment`, `decodeJwtSegment`, `DUPLICATED_MODULES`, `EXPORTS_HELD_FOR_PARITY`, or a per-function `envConfig.ts` / `placeholderAddress.ts`. The one textual hit, `scripts/fixtures/assert-no-candidate-app-names.input.ts:109`, is an inert guard fixture. Under `.claude/skills/database/SKILL.md`, the measurement table at line 1161 ("copies of `envConfig.ts` | 3 and 3, byte-identical") and the Phase 155 log row at line 1345 sit inside dated, historical update entries, and § 7 and the newer table at lines 1133-1134 already state the new layout. That file is agent-facing and outside this file list.
- `_shared/placeholderAddress.test.ts` builds the frontend path as `../../../../frontend/...`, which resolves to `apps/frontend/...` from `_shared/` (the same depth as the old location). `vitest.config.ts` (`supabase/functions/**/*.test.ts`) collects both `_shared` specs. `edgeFunctionPins.test.ts` skips `_shared/` because it has no `index.ts`. The Alpine Dockerfile install is unaffected: the `@deno/*` platform packages carry `libc=glibc` conditions and `enableScripts: false` skips the postinstall.

There are no blockers. The one warning is a coverage gap the move created: the security-invariant source scans in the conformance specs read only their own function directory, while each function's module graph now reaches into `_shared/`. The info items are stale or inaccurate comments, an unchecked test surface, a floating transitive graph, and a near-tautological test case.

I read `$HOME/.claude/gsd-core/references/necessity-review.md` and applied it. One necessity finding (Info).

## Warnings

### WR-01: The conformance specs' "every module of the function" scans no longer cover the function's `_shared/` modules

**File:** `apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts:96-108`, together with `apps/supabase/supabase/functions/account-access/flowConformance.test.ts:29-32,247-249,258-261`
**Issue:** Both specs build the module set they check with `readdirSync(new URL('./', import.meta.url))`, which means "the function's own directory". Since this phase, each function's module graph also includes `../_shared/envConfig.ts` and `../_shared/placeholderAddress.ts`, which neither scan reads. The invariants that are now silently scoped down include security properties:
- `account-access`: "holds one admin update that carries an email key" (`updateUserById(... email ...)` over `SOURCES`).
- `account-access`: "confirms no address on the service's word: email_confirm only where the placeholder is put back".
- `account-access`: "never creates a user by the admin API's direct calls" (`createUser` / `inviteUserByEmail`).
- `identity-callback`: "export no value the function does not use", which no longer sees `placeholderAddressFor`, the shared module's export that identity-callback uses.

The spec test is titled "reads every module of the function" and the `MODULE_CODE` docstring says "The function's modules other than its tests". Both statements are now false. Today `_shared/` holds only pure helpers, so nothing escapes yet. But the phase sets `_shared/` up to grow: `send-email/callerAuthority.ts:10` tells the next author to move the gate there. An `updateUserById(id, { email })` or a `createUser` call added to a shared module would then pass every one of these assertions.
**Fix:** Derive the module set from the function's own imports, so `_shared/` modules a function uses are scanned as that function's modules:
```ts
const OWN = readdirSync(new URL('./', import.meta.url)).filter((n) => n.endsWith('.ts') && !n.endsWith('.test.ts'));
const SHARED = [
  ...new Set(
    OWN.flatMap((n) =>
      [...readFileSync(new URL(`./${n}`, import.meta.url), 'utf8').matchAll(/from '\.\.\/_shared\/([\w.-]+\.ts)'/g)].map(
        ([, f]) => `../_shared/${f}`
      )
    )
  )
];
const SOURCES = [...OWN.map((n) => `./${n}`), ...SHARED].map(
  (p) => [p, codeOf(readFileSync(new URL(p, import.meta.url), 'utf8'))] as const
);
```
Also assert that `SHARED` is non-empty, so the derivation cannot quietly go blind. Adjust the `email_confirm` count's `name === 'index.ts'` key to `./index.ts`. Apply the same derivation to `identity-callback`'s `MODULE_CODE`.

## Info

### IN-01: The changed inventory of "the checks that reach that tree" is inaccurate

**File:** `packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts:8`; also `scripts/assert-edge-env-defaults.mjs:31-33`
**Issue:** The rewritten sentence says that, besides Prettier and the vitest files, "the checks that reach that tree are this guard and `deno check`". At least four other `lint:check` links also scan `apps/supabase/supabase/functions`: `assert-edge-function-env.mjs`, `assert-env-pair-registry.mjs` ("46 Deno file(s)"), `assert-comment-hygiene.mjs` and `assert-no-candidate-app-names.mjs`. So does `apps/supabase/scripts/edgeFunctionPins.test.ts`. The conclusion still holds, since no other check reads environment defaults, but the inventory is wrong. The comment was changed in this phase, so it should describe the tree as it is.
**Fix:** Narrow the claim to what is true: "No other check reads that tree for an environment read followed by a defaulting operator; `deno check` (through `yarn typecheck`) reads it for types alone, so a removed link ends that check rather than degrading it."

### IN-02: "Four docstrings" that quote the forbidden shape are now two

**File:** `scripts/assert-edge-env-defaults.mjs:47-49`; `packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts:49` (also `scripts/lib/comment-spans.mjs:12-13`, outside this list)
**Issue:** Deleting the two extra `envConfig.ts` copies leaves exactly two docstrings in the tree that quote `` `Deno.env.get('X') || fallback` ``: `_shared/envConfig.ts:8` and `_shared/envConfig.test.ts:4`. At `32314f7d4` there were four. These comments justify the guard's comment-span exclusion by the four docstrings, so they now miscount the tree. They are also phrased as historical narrative ("This phase deliberately wrote…"), which Comment Hygiene forbids. Those lines were not edited here, but this phase made them false.
**Fix:** Describe the present tree: "Docstrings in `_shared/envConfig.ts` and its test quote `Deno.env.get('X') || fallback` in prose to explain why the shape is forbidden…", and drop the phase narrative.

### IN-03: The vitest specs under `functions/` are type-checked by nothing

**File:** `apps/supabase/supabase/functions/deno.json:3`
**Issue:** `"exclude": ["**/*.test.ts"]` keeps `deno check .` off the vitest specs, which is correct because Deno cannot resolve `vitest`. But `apps/supabase` has no `tsconfig.json` and its `typecheck` script runs only `deno check`, so the 26 spec files under `functions/` get no type checking at all. vitest strips types without checking them. A spec that passes a wrongly typed fixture to a module stays green. The new docs say `yarn typecheck` covers "every function module", which is true for modules only.
**Fix:** Either add a small `apps/supabase/tsconfig.json` (with `allowImportingTsExtensions`, `noEmit`, and `include: ["supabase/functions/**/*.test.ts", "scripts/**/*.test.ts"]`) and chain `tsc -p .` into the `typecheck` script, or state the gap in the README next to the `typecheck` line.

### IN-04: `"lock": false` leaves the Edge Functions' transitive npm graph floating for the typecheck

**File:** `apps/supabase/supabase/functions/deno.json:2`
**Issue:** Direct `npm:` specifiers are exact-pinned and held to each other by `edgeFunctionPins.test.ts`. With no lockfile, though, `deno check` resolves transitive dependencies fresh on every cold cache. That resolution also bypasses the repository's `npmMinimalAgeGate: 7d`, and turbo's cache key (`$TURBO_DEFAULT$`) does not see it. The same tree can type-check differently on different days. This is a judgement call: the spike chose `lock: false` so that no `deno.lock` is ever written into the functions tree.
**Fix:** Either accept it and state it in the README's `deno.json` paragraph, or commit a `deno.lock` and run `deno check --frozen .` so drift fails loudly.

### IN-05: Already-defended-elsewhere — the `_shared/placeholderAddress.ts` row of the domain-parity test checks the module against itself

**File:** `apps/supabase/supabase/functions/_shared/placeholderAddress.test.ts:11-12,62-65`
**Category:** necessity
**Issue:** With one Edge Function copy, the `'_shared/placeholderAddress.ts'` entry of `COPIES` reads the source text of the module this spec imports `PLACEHOLDER_EMAIL_DOMAIN` from, and compares it with that same import. The literal value is already pinned by the case at line 58-60. Only the frontend row still compares two copies. The extra row adds one weak property: that the constant is declared as a literal exactly once. Whether that is worth a parity row is a matter of judgement, not provable from the repository.
**Fix:** Keep the single cross-runtime row (the frontend file), or rename the `_shared` row so that it states the declared-once-as-a-literal property it actually tests.

---

_Reviewed: 2026-11-13T16:05:02Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
