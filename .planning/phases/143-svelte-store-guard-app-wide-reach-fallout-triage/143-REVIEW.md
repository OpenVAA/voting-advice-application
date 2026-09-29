---
phase: 143-svelte-store-guard-app-wide-reach-fallout-triage
reviewed: 2026-08-22T00:00:00Z
depth: deep
files_reviewed: 2
files_reviewed_list:
  - apps/frontend/eslint.config.mjs
  - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: issues_found
---

# Phase 143: Code Review Report

**Reviewed:** 2026-08-22T00:00:00Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found (info-only)

## Summary

Scope confirmed: `git diff 289f80e8c..HEAD -- apps packages tests` touches exactly the two files
named in the task brief — `apps/frontend/eslint.config.mjs` and
`apps/frontend/src/lib/_guards/eslint-store-guard.test.ts`. No scope breach. (The wider repo diff
touches 10 additional files, all under `.planning/`, which is out of review scope per the brief.)

Both REPLACE-not-merge hazards called out in the review brief were checked byte-for-byte against
`packages/shared-config/eslint.config.mjs` using a script-level diff, not eyeballing:

- `no-restricted-syntax`'s inherited `TSEnumDeclaration` entry (`selector: 'TSEnumDeclaration'`,
  `message: 'Use const assertion or a string union type instead.'`) is re-included in
  `apps/frontend/eslint.config.mjs:124-126` **byte-identical** to `packages/shared-config/eslint.config.mjs:82-84`.
- `no-restricted-imports`'s inherited `patterns` entry (the deep-relative-`lib` regex ban) is
  re-included in `apps/frontend/eslint.config.mjs:102-108` **byte-identical** to
  `packages/shared-config/eslint.config.mjs:147-152`.
- The in-code line-number citations in the new comments (`shared-config/eslint.config.mjs:79-85`
  and `:147-152`) were checked against the actual file and are correct.

The glob widening to `src/**/*.{ts,js,mjs,cjs,svelte}` cannot pull in generated output: the only
`.js` files under `apps/frontend/src` are the paraglide-generated files under
`src/lib/paraglide/**`, which are covered by `packages/shared-config/eslint.config.mjs:35`'s
ignore-only config object (`'**/src/lib/paraglide/**'`) — an ignores-only object is global in
flat config, so it applies regardless of which later config block's `files` pattern would
otherwise match. `.svelte-kit` is likewise globally ignored via the frontend's own ignores-only
block. Verified empirically: `find apps/frontend/src -name '*.js' -o -name '*.mjs' -o -name '*.cjs'`
returns only paraglide files.

The 30-case guard spec was executed (`yarn vitest run src/lib/_guards/eslint-store-guard.test.ts`)
and all 30 pass against the real `apps/frontend/eslint.config.mjs` (loaded via the mandatory
`flags: ['v10_config_lookup_from_file']`). The three correctness invariants from the file's own
header — probe paths resolving under `apps/frontend/src`, the `v10_config_lookup_from_file` flag,
and filtering by `ruleId`/message-substring rather than line/column or bare `errorCount` — are all
honored in the code as shipped. The two co-resident `no-restricted-syntax` bans (TS-enum and
dynamic `svelte/store` import) are disambiguated by message substring (`'const assertion'` vs.
`'svelte/store is banned'`), and those substrings do not cross-match each other's message text, so
the disambiguation is real, not accidental. No assertion in the 30 cases was found that would pass
vacuously if its target rule stopped firing — each "fires" assertion is a
`toBeGreaterThan(0)` on a `ruleId`/message-filtered array, which fails outright (not
vacuously) if the rule goes silent.

Two minor Info-level observations follow; nothing rises to Warning or Critical.

## Info

### IN-01: `.cjs` extension widening doesn't guard the `require()` form a `.cjs` file would actually use

**File:** `apps/frontend/eslint.config.mjs:90` (glob), exercised by
`apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:112-125` (D-05 block)

**Issue:** The glob was widened to include `.cjs`, and the D-05 test block explicitly asserts the
guard fires for a `.cjs` probe file. However, both guard mechanisms — `no-restricted-imports`'s
`paths` entry (targets `ImportDeclaration`) and the new `no-restricted-syntax` selector
(`ImportExpression[source.value='svelte/store']`, targets dynamic `import()`) — only match ES
module import syntax. Neither matches a CommonJS `require('svelte/store')` call (a
`CallExpression` with `callee.name === 'require'`), which is the idiomatic way to pull in a
dependency from an actual `.cjs` file. The D-05 test itself only feeds `STORE_IMPORT['.ts']`
content (`import { writable } from ...`) through a `.cjs`-named probe path — it never exercises
`require(...)`, so the test and the shipped guard are internally consistent, but the extension
addition could read as "CommonJS is now covered" when only ESM-syntax-in-a-`.cjs`-file is
covered. This matches the phase's own stated measurement (row G1-OLD: "a live static store
import ... passed the entire gate untouched" — static `import`, not `require`), so it is not a
regression against what was measured, just a residual gap worth flagging given `.cjs` is
conventionally the CommonJS extension.

**Fix:** If CommonJS `require('svelte/store')` is a realistic reintroduction vector for this
codebase (currently no `.cjs` files exist under `apps/frontend/src` — verified), add a
`CallExpression[callee.name='require'][arguments.0.value='svelte/store']` selector to the same
`no-restricted-syntax` array, and a corresponding test case. Otherwise, consider a one-line
comment next to the glob noting that `.cjs` coverage is ESM-import-syntax only, so a future reader
doesn't assume `require()` is closed.

### IN-02: New D-05/D-06 test blocks lack the negative-control pairing the main matrix uses

**File:** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:112-152`

**Issue:** The primary `describe.each(cases)` matrix (lines 91-110) pairs every "fires" assertion
with a "stays silent on clean rune code" negative control and a "parses without a fatal message"
guard. The two new blocks added in this phase — "extension reach (D-05)" (lines 115-125,
`.js`/`.mjs`/`.cjs`) and "dynamic import() closure (D-06)" (lines 130-152) — only assert the
positive ("fires") case. There is no test proving that clean rune code in a `.js`/`.mjs`/`.cjs`
file, or a benign dynamic `import('some-other-module')`, stays silent under the widened glob.
Risk is low given the selectors are narrowly scoped (exact `source.value` match), but it is an
asymmetry against the file's own stated 3-assertions-per-case design principle, and a future
selector edit (e.g., loosening the `ImportExpression` selector to a regex) would have no test
catching a resulting false-positive in these three extensions.

**Fix:** Add a negative-control case per new block, e.g.:
```ts
it('stays silent on a benign dynamic import in .js/.mjs/.cjs', async () => {
  const [result] = await eslint.lintText("await import('svelte');\n", {
    filePath: path.join(SRC, 'lib/components', '__store_guard_probe__.js')
  });
  expect(result.messages.filter((m) => m.ruleId === 'no-restricted-syntax').length).toBe(0);
});
```

---

_Reviewed: 2026-08-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
