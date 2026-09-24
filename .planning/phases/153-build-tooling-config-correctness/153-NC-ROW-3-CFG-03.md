# Phase 153 — Negative Control, Row 3 (REVIEW-CFG-03)

Fragment owned by plan `153-04`. Assembled into `153-NEGATIVE-CONTROL.md` by plan `153-09`.

- **Date:** 2026-08-29
- **Plan:** `153-04-PLAN.md` (wave 1)
- **Requirements:** REVIEW-CFG-03
- **Standing acceptance rule:** `.planning/REQUIREMENTS.md:9-12` — *prove the guard fails before claiming it guards*
- **Precedent followed:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md`

## Environment

```
date (UTC):          2026-08-29T12:50:41Z
repo root:           /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:            dd5db88903068be24ab54894186a84e55dfff646  (the 153-04 Task 1 commit)
git branch:          integration/ship-12-squash
git status:          scoped `-- apps/frontend/vitest.config.ts` → empty before and after every run below
OS:                  macOS 26.5.1 / Darwin 25.5.0 arm64
Node:                v24.14.1
Yarn:                4.13.0
vitest:              3.2.4
vite (root):         7.3.0   → node_modules/vite
vite (vitest-nested): 7.3.1  → node_modules/vitest/node_modules/vite   ← the loader that actually bundles the config
```

> **Why the bare `git status` is not the gate.** `.planning/milestone.lock` carries a pid
> heartbeat and is modified continuously by the GSD orchestrator, so the bare form is never
> empty during a run. The gate that carries the claim here is the **scoped** form
> `git status --porcelain -- apps/frontend/vitest.config.ts`, which is the only path this row
> injects into. The injection below was reverted by targeted
> `git checkout -- apps/frontend/vitest.config.ts` against the already-committed Task 1 state.
> No `git stash`, no `git clean`, no `git checkout .` was run at any point.

---

## Row 3 — REVIEW-CFG-03

### Why this row has no ordinary BLINDNESS half

**`apps/frontend/vitest.config.ts` does not fail today, and no injection can make it fail
today.** There is therefore nothing to observe in a "before" state, and this row does not
pretend otherwise.

The reason is mechanical. Vite does not hand a TypeScript config file to Node; it bundles it
with esbuild first, and that bundle step **defines `__dirname` unconditionally — in ESM output
as well as CJS**. Quoting the installed loader,
`node_modules/vitest/node_modules/vite/dist/node/chunks/config.js` (Vite **7.3.1**, the copy
vitest resolves):

- `:35804` — `const dirnameVarName = "__vite_injected_original_dirname";`
- `:35821` — `__dirname: dirnameVarName,` — inside the esbuild `define` map
- `:35824` — `"import.meta.dirname": dirnameVarName,`
- `:35864` — `let injectValues = \`const ${dirnameVarName} = ${JSON.stringify(path.dirname(args.path))};…\`;`

The `define` map at `:35818-35826` sits **outside** the `format: isESM ? "esm" : "cjs"` branch
at `:35813`, which is the precise reason the shim is not CJS-only. So a demonstration of the
form "watch the config break, now watch it fixed" would be a demonstration that does not
reproduce, and staging one would put a fabricated BLINDNESS row in the ledger.

> **Citation correction.** `153-04-PLAN.md` cites Vite **6.4.1** at
> `node_modules/vite/dist/node/chunks/config.js:35802,35819,35822,35862`. No Vite 6.4.1 is
> installed. Those four line numbers are exact against the **root** copy, Vite **7.3.0**; the
> vitest-nested copy is 7.3.1 and the same four sites sit at `:35804,35821,35824,35864` (a
> uniform +2 offset). The plan's line numbers were real measurements mislabelled with a wrong
> version string. Both copies are cited above rather than one, because the nested copy is the
> one that actually loads this config.

### Claim under test

This is a **portability** claim, not a defect claim: that `apps/frontend/vitest.config.ts`
can derive its own directory without depending on a shim its own package type says should
not be there (`apps/frontend/package.json:59` — `"type": "module"`), **and that doing so
changes no resolved path**. It is proven by a no-regression pair plus a wrong-directory
control. The control is what makes the pair non-vacuous: without it, an alias table that
resolved to nothing at all would produce the same green.

### Evidence 1 — the no-regression pair (alias values byte-identical)

All 11 `resolve.alias` `replacement` values were dumped by loading the config through Vite's
own `loadConfigFromFile` — the same esbuild-bundle path vitest uses — before and after the
edit.

```
$ diff aliases-BEFORE.txt aliases-AFTER.txt
$ echo $?
0

$ md5 -q aliases-BEFORE.txt aliases-AFTER.txt
47e87c7ad24a88d59ea6b487f9496180
47e87c7ad24a88d59ea6b487f9496180
```

Empty diff, identical digest, 11 lines each side.

### Evidence 2 — collection and suite unchanged

```
$ cd apps/frontend && npx vitest list --run
EXIT=0
822 output lines, 806 beginning `src/`, 0 occurrences of "Failed to resolve"
```

```
$ yarn workspace @openvaa/frontend test:unit

 Test Files  54 passed (54)
      Tests  816 passed (816)
```

Identical before the edit and after it — both runs recorded, not one run assumed to stand for
two.

### Evidence 3 — the wrong-directory control (the decisive half)

**Injection.** The single derived constant at `apps/frontend/vitest.config.ts:7` was pointed
at a sibling directory that does not exist:

```ts
-const here = fileURLToPath(new URL('.', import.meta.url));
+const here = fileURLToPath(new URL('../frontend-nonexistent-negative-control/', import.meta.url));
```

**Control half A — the alias-dump harness flips.** The same `diff` that returned empty above
returns non-empty against the injected constant, so the comparison in Evidence 1 is a live
comparison and not one examining nothing:

```
$ diff aliases-BEFORE.txt aliases-BOGUS.txt
1,11c1,11
< $lib/paraglide/runtime	…/apps/frontend/src/lib/i18n/tests/__mocks__/paraglide-runtime.ts
…
$ echo $?
1
```

**Control half B — collection fails by name.** Command, exit code and verbatim output:

```
$ cd apps/frontend && npx vitest list --run
Error: Failed to resolve import "$lib/i18n/wrapper" from "src/lib/i18n/tests/translations.test.ts". Does the file exist?
  Plugin: vite:import-analysis
  File: /Users/kallejarvenpaa/…/apps/frontend/src/lib/i18n/tests/translations.test.ts:5:18
  3  |  import { fileURLToPath } from "url";
  4  |  import { describe, expect, test } from "vitest";
  5  |  import { t } from "$lib/i18n/wrapper";
     |                     ^
 ❯ TransformPluginContext._formatLog …/vitest/node_modules/vite/dist/node/chunks/config.js:28999:43

Error: Failed to resolve import "$lib/paraglide/runtime" from "src/lib/i18n/overrides.ts". Does the file exist?
  Plugin: vite:import-analysis

EXIT=1
```

347 output lines, all resolution failures; `$lib` is named in the first one.

**Restoration.** `git checkout -- apps/frontend/vitest.config.ts` against the committed Task 1
state, then re-run:

```
$ grep -c 'nonexistent-negative-control' apps/frontend/vitest.config.ts
0
$ git status --porcelain -- apps/frontend/vitest.config.ts
$ cd apps/frontend && npx vitest list --run
EXIT=0
```

The tree is left in the restored state and the committed file contains no bogus path.

### Verdict

**Demonstrated.** That the 11 alias replacement values are byte-identical across the change,
by printing both sets and diffing rather than by inspection. That the config loads and every
alias resolves under the new constant (`vitest list --run`, exit 0, full collection). That the
54-file / 816-test suite is unmoved. And — decisively — that all three of those signals are
capable of going red: pointing the derived constant one directory sideways turns the diff
non-empty and collection into exit 1 naming `$lib`. The proof examines something.

**Not demonstrated, and not claimed.** No live failure of the pre-change config, because none
exists to observe: Vite's bundler defines `__dirname` for it in ESM mode. This row is a
no-regression pair with a live control, and is recorded as exactly that. It is **not** a
guard that noticed a defect, and nothing here should be read into the ledger as one. The
change's value is portability — the file no longer depends on an implementation detail of the
tool that happens to load it — and portability is a property that a passing test suite can
corroborate but cannot, on its own, prove.
