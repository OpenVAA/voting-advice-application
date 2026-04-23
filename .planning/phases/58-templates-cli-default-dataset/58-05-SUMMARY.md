---
phase: 58-templates-cli-default-dataset
plan: 05
subsystem: dev-seed
tags: [dev-seed, cli, parse-args, template-resolve, help, summary, phase-58-wave-2, d-58-08, d-58-09, d-58-10, d-58-12, d-58-13, d-58-14, tdd]

# Dependency graph
requires:
  - plan: 58-03
    provides: fanOutLocales + LOCALES + generateTranslationsForAllLocales schema field — CLI invokes fanOutLocales between runPipeline and writer.write
  - phase: 56-generator-foundations-plumbing
    provides: Writer constructor (env enforcement + D-58-12 messages), runPipeline, TemplateSchema / validateTemplate, buildCtx seed plumbing
provides:
  - packages/dev-seed/src/cli/seed.ts — CLI entry point consumed by `yarn workspace @openvaa/dev-seed seed`
  - packages/dev-seed/src/cli/resolve-template.ts — pure-function name-vs-path resolver (D-58-09 + D-58-10) — consumed by Plan 09 integration test via barrel
  - packages/dev-seed/src/cli/help.ts — USAGE constant (D-58-13) — re-exported as SEED_CLI_USAGE
  - packages/dev-seed/src/cli/summary.ts — formatSummary pure function (D-58-14) — consumed by Plan 09 integration test via barrel
  - package.json scripts.seed = "tsx src/cli/seed.ts"
  - Barrel re-exports: resolveTemplate, formatSummary, SEED_CLI_USAGE, SummaryInput (type)
affects:
  - 58-06 default template — loadBuiltIns dynamically imports ../templates/index.js; Plan 06 populates the map without touching cli/
  - 58-07 pipeline wiring — none (this plan already invokes runPipeline + fanOutLocales directly per plan spec)
  - 58-09 integration test — can unit-test resolveTemplate + formatSummary via barrel imports + subprocess-exec 'yarn seed' for end-to-end
  - 58-10 README — must document the T-58-05-02 "custom templates execute developer code" warning under --template <path>

# Tech tracking
tech-stack:
  added: []  # No new deps — uses node:util, node:fs, node:path, node:url (all builtin) + existing vitest + existing zod via validateTemplate
  patterns:
    - "CLI via node:util parseArgs (strict mode, no positionals) — matches packages/dev-tools/src/keygen.ts precedent; NOT commander/yargs/minimist per CONTEXT"
    - "pathToFileURL conversion before dynamic import() — cross-platform safe for absolute filesystem paths per D-58-10"
    - "Two-stage template load: JSON → readFileSync + JSON.parse + validateTemplate; TS/JS → pathToFileURL + import() + validateTemplate"
    - "Forward-compatible Writer.write contract: CLI inspects write result at runtime (extractPortraitCount helper) to tolerate both current void return and Plan 04's future { portraits: number } shape without re-editing seed.ts"
    - "Dynamic indirect import path (`const modulePath = '../templates/index.js'; await import(modulePath)`) — sidesteps TypeScript's static module resolution so the CLI compiles before Plan 06 ships the templates/ module; runtime try/catch returns {} built-ins if absent"

key-files:
  created:
    - packages/dev-seed/src/cli/seed.ts
    - packages/dev-seed/src/cli/resolve-template.ts
    - packages/dev-seed/src/cli/help.ts
    - packages/dev-seed/src/cli/summary.ts
    - packages/dev-seed/tests/cli/resolve-template.test.ts
    - packages/dev-seed/tests/cli/summary.test.ts
    - packages/dev-seed/tests/cli/help.test.ts
  modified:
    - packages/dev-seed/package.json (added scripts.seed)
    - packages/dev-seed/src/index.ts (barrel re-exports: resolveTemplate, formatSummary, SEED_CLI_USAGE, SummaryInput)

key-decisions:
  - "Indirect dynamic import path in loadBuiltIns — TypeScript cannot statically resolve `../templates/index.js` until Plan 06 ships; storing the path in a const first prevents the TS2307 error while preserving runtime ESM resolution"
  - "Forward-compatible portrait count extraction — the plan spec names a Writer.write return shape ({ portraits: number }) that doesn't exist in this plan's base; implementing extractPortraitCount as a runtime duck-type check means Plan 04's eventual Writer signature change ships without re-touching seed.ts"
  - "Task 1 pure-function utilities split across three files (resolve-template, help, summary) — each is independently unit-testable via vitest without subprocess-execing the CLI; Plan 09 integration test imports them through the barrel"
  - "USAGE constant hardcodes the built-in template list (default, e2e) rather than deriving from BUILT_IN_TEMPLATES at --help time — keeps --help fast (no module import) and documents the expected Plan 06 shape"

requirements-completed: [CLI-01, CLI-04, CLI-05, TMPL-06]

# Metrics
duration: ~12 min
completed: 2026-04-23
---

# Phase 58 Plan 05: CLI Shell Summary

**Node-builtin parseArgs CLI that loads a template (built-in name or filesystem path), runs the Phase 56/57 pipeline, fans out locales (Plan 03), writes to Supabase via the Writer, and prints a D-58-14 aligned-table summary — exit 0 on success, exit 1 with D-58-12 actionable messages on failure**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-23T11:10:58Z (RED commit)
- **Completed:** 2026-04-23T11:15:~ (GREEN Task 2 commit)
- **Tasks:** 2 (Task 1 TDD = RED + GREEN; Task 2 GREEN-only = non-TDD wiring task per plan)
- **Files changed:** 9 (7 created, 2 modified); +393 / -3 lines across 3 commits
- **Test delta:** +27 tests (240 → 267 passed; 33 files green, zero regressions)

## Accomplishments

- Shipped `packages/dev-seed/src/cli/seed.ts` — CLI entry with `parseArgs({ strict: true, allowPositionals: false })`, `--help` short-circuit, lazy `loadBuiltIns`, template-arg resolution, `--seed` / `--external-id-prefix` override application, Writer env enforcement, `runPipeline` + `fanOutLocales` + `writer.write` orchestration, D-58-14 summary print, D-58-12 error rephrasing.
- Shipped `cli/resolve-template.ts` — pure-function D-58-09 resolver (name-first / path-fallback via `./` / `/` / `../` prefix OR `.ts` / `.js` / `.json` extension) + D-58-10 loader dispatch (JSON → `readFileSync + JSON.parse`, TS/JS → `pathToFileURL + import()`). Every resolved template runs through `validateTemplate` so TMPL-09 field-path errors surface on misconfiguration.
- Shipped `cli/help.ts` USAGE — flag docs, `Built-in templates:` section (default + e2e), custom-template `README.md` pointer, `Environment:` section documenting `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
- Shipped `cli/summary.ts` formatSummary — D-58-14 aligned-table output: `Applied template:` header, Seed / Elapsed / Portraits header rows, alphabetically-sorted table with Total row, deterministic (same input → byte-identical output).
- `package.json` now has `scripts.seed = "tsx src/cli/seed.ts"` — `yarn workspace @openvaa/dev-seed seed --help` resolves and exits 0.
- Barrel (`src/index.ts`) re-exports `resolveTemplate`, `formatSummary`, `SEED_CLI_USAGE`, and `SummaryInput` (type). Plan 09 integration test can unit-test the pure utilities without subprocess-execing the CLI.
- 27 new unit tests (11 resolve-template + 7 summary + 9 help) in `tests/cli/`; full dev-seed suite 267/267 green across 33 files.
- Lint clean (`yarn exec eslint src/cli/` → exit 0 after autofix applied to import order + string quoting), typecheck clean (`yarn workspace @openvaa/dev-seed typecheck` → exit 0).

## Task Commits

| # | Type | Hash | Description |
|---|------|------|-------------|
| 1 | RED (Task 1) | `0ddd56dc1` | test(58-05): add failing CLI utility tests (resolve-template, summary, help) |
| 2 | GREEN (Task 1) | `87d39a709` | feat(58-05): implement CLI utility modules (resolve-template, summary, help) |
| 3 | GREEN (Task 2) | `01818fef5` | feat(58-05): wire cli/seed.ts entry + package.json script + barrel re-exports |

_TDD gate compliance (Task 1):_ RED commit (`0ddd56dc1`) precedes GREEN commit (`87d39a709`); verified via `git log --oneline`. Task 2 is wiring-only (plan spec marks it `type="auto"` without `tdd="true"`); verification relies on `--help` smoke test + `typecheck` + full suite green.

## Files Created / Modified

- **`packages/dev-seed/src/cli/seed.ts`** (NEW, ~180 lines) — CLI entry with shebang `#!/usr/bin/env tsx`. parseArgs in strict mode; indirect dynamic import for `../templates/index.js`; runtime portrait-count extraction; D-58-12 error rephrasing for `fetch failed` / `ECONNREFUSED` / `ENOTFOUND`.
- **`packages/dev-seed/src/cli/resolve-template.ts`** (NEW, 116 lines) — `resolveTemplate(arg, builtIns)` + internal `isPath` / `loadJsonTemplate` / `loadModuleTemplate` helpers. All paths run through `validateTemplate`.
- **`packages/dev-seed/src/cli/help.ts`** (NEW, 40 lines) — `export const USAGE` template literal documenting every flag, both built-ins, and env vars.
- **`packages/dev-seed/src/cli/summary.ts`** (NEW, 51 lines) — `export interface SummaryInput` + `export function formatSummary`. Column widths 30 / 10; uses `'─'.repeat(...)` for separator lines.
- **`packages/dev-seed/tests/cli/resolve-template.test.ts`** (NEW, 88 lines) — 11 tests covering built-in resolution, unknown-name error with list + path suggestion, empty-map handling, populated-map listing, JSON absolute path load, zod field-path errors, path-vs-name dispatch edge cases (`./rel.ts`, `./rel.js`, `/abs.json`, `default.md`), malformed JSON parse error.
- **`packages/dev-seed/tests/cli/summary.test.ts`** (NEW, 47 lines) — 7 tests covering template name, elapsed formatting (2 decimals), portraits line, alphabetical sort of tables, Total row sum, zero-portraits handling, determinism.
- **`packages/dev-seed/tests/cli/help.test.ts`** (NEW, 44 lines) — 9 tests covering every documented flag, built-in template list, README pointer, env var documentation.
- **`packages/dev-seed/package.json`** (+1 line) — added `"seed": "tsx src/cli/seed.ts"` to `scripts`.
- **`packages/dev-seed/src/index.ts`** (+4 lines) — barrel re-exports: `USAGE as SEED_CLI_USAGE`, `resolveTemplate`, `formatSummary`, type `SummaryInput`. Alphabetical within each section.

## Decisions Made

- **Indirect dynamic import for `../templates/index.js`.** The plan `<interfaces>` block suggested `const mod = await import('../templates/index.js');` — TypeScript flagged TS2307 ("Cannot find module") because Plan 05 ships before Plan 06 creates the `templates/` directory. Stored the path in a const first (`const modulePath = '../templates/index.js'; await import(modulePath)`) so TS can't statically resolve it; runtime behavior is identical, and the `try/catch` returns `{}` built-ins until Plan 06 lands. Documented inline in `loadBuiltIns`.
- **Forward-compatible portrait count via `extractPortraitCount` helper.** The plan spec interface block names `Writer.write(data, externalIdPrefix?): Promise<{ portraits: number }>` — but the current `Writer.write` signature in the base is `write(data): Promise<void>`. Plan 04 is expected to add the second argument + portraits return shape. Rather than block on Plan 04 or break the spec, the CLI invokes `writer.write(rows, prefix)` via a widened function type and inspects the resolved value at runtime: `{ portraits: number }` → pass through, anything else → 0. When Plan 04 ships, the CLI picks up the real portrait count with zero edits. Documented inline in `seed.ts`.
- **Task 1 as TDD, Task 2 as non-TDD.** Plan `<tasks>` frontmatter marks Task 1 `tdd="true"` and Task 2 plain `type="auto"`. Followed the plan: Task 1 RED (failing tests) → GREEN (source + tests passing); Task 2 wiring-only because the verification path is `--help` smoke test + typecheck, not pure-function unit tests (seed.ts is all side effects — process.exit / stdout write / env reads).
- **Linter autofix absorbed into Task 2 commit.** `yarn exec eslint --fix src/cli/` reorganized imports in seed.ts (moved `./help`, `./resolve-template`, `./summary` before `../locales`, `../pipeline`, `../writer` per simple-import-sort grouping) and flipped single-quoted strings in resolve-template.ts — all cosmetic, no behavior change. Included in the Task 2 commit rather than a separate style-only commit.

## Deviations from Plan

**Rule 3 — blocking issue (Writer.write signature mismatch):**

The plan's `<interfaces>` block documents Writer as `write(data, externalIdPrefix?): Promise<{ portraits: number }>` — but Plan 04 (which adds portrait upload) hasn't landed in this worktree's base (`cf42a4bf7`). The base Writer signature is `write(data): Promise<void>`. Rather than stubbing / blocking, the CLI was implemented forward-compatibly:

- **Fix applied:** `extractPortraitCount(result: unknown): number` helper — duck-types the return value, reports 0 when Writer returns `void`, passes `portraits` through when Plan 04 later returns `{ portraits: number }`.
- **Call site:** cast `writer.write` to `(...args: Array<unknown>) => Promise<unknown>` at the invocation so the two-argument call compiles against either Writer shape.
- **Commit:** `01818fef5` (Task 2 GREEN).
- **Forward-compatibility:** Plan 04's eventual Writer signature change ships without re-editing seed.ts. Documented inline.

**Rule 3 — blocking issue (TypeScript cannot resolve `../templates/index.js`):**

The plan `<interfaces>` block's `loadBuiltInTemplates` sketch uses `await import('../templates/index.js')` — TS2307 error because Plan 06 hasn't created that module yet.

- **Fix applied:** indirect path via `const modulePath = '../templates/index.js'; await import(modulePath)`. Runtime identical, TypeScript bypass via dynamic string.
- **Commit:** `01818fef5`.
- **Impact:** zero — the `try/catch` returns `{}` built-ins until Plan 06 ships, so `resolveTemplate('unknown-name', {})` surfaces "Built-in templates: (none registered yet)" as intended in the Plan-05-only state.

**No other deviations.** Plan `<action>` blocks otherwise followed verbatim — USAGE text, summary formatter column widths, resolveTemplate algorithm (all 4 steps of D-58-09), loader dispatch (D-58-10), parseArgs options shape, D-58-12 error rephrasing, TMPL-06 arbitrary-path loading. All plan `<verify>` and `<acceptance_criteria>` commands pass (see Self-Check below).

## Issues Encountered

- **Worktree base mismatch on startup.** Agent spawned on `9e0399286` (feat-gsd-roadmap HEAD), but plan requires `cf42a4bf7` (Wave 1 merge). Resolved via `git reset --hard cf42a4bf7` per `<worktree_branch_check>` instructions; `yarn install` already had node_modules state so no re-install needed initially — a follow-up `yarn install` was required to populate the state file.
- **Pre-existing test failures on first baseline run.** 5 test files failed with `Failed to resolve entry for package "@openvaa/core"` and `"@openvaa/matching"` — these packages weren't built in the worktree yet. Resolved via `yarn build --filter=@openvaa/core` + `yarn build --filter=@openvaa/matching`; baseline then clean (240/240). Not a code issue — worktree setup artifact.
- **Linter surfaced 4 issues on first Task 2 lint run.** `simple-import-sort` wanted imports regrouped, string-quote rule flagged 2 double-quoted escaped strings. `yarn exec eslint --fix src/cli/` resolved all 4; autofix diff folded into Task 2 commit. No behavior change.

## User Setup Required

None — pure library code + CLI shell. No env vars set by this plan; the Writer constructor reads `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` already (Phase 56 plumbing), and this plan only surfaces those errors via D-58-12 CLI rephrasing.

## Next Phase Readiness

- **Plan 58-06 (default template):** Create `packages/dev-seed/src/templates/index.ts` exporting `BUILT_IN_TEMPLATES: Record<string, Template>` with at least `{ default: ... }`. The CLI's `loadBuiltIns` picks it up automatically — zero changes needed in cli/ files.
- **Plan 58-07 (pipeline wiring):** Not needed — this plan already wires `runPipeline` + `fanOutLocales` + `writer.write` inside the CLI flow. Plan 07's scope is server-side (teardown / `seed:teardown` CLI) rather than pipeline integration.
- **Plan 58-08 (e2e template):** Add `e2e: ...` to `BUILT_IN_TEMPLATES`; e2e template sets `generateTranslationsForAllLocales: false` per D-58-16.
- **Plan 58-09 (integration test):** Can (a) import `resolveTemplate`, `formatSummary` directly from `@openvaa/dev-seed` barrel for unit-level checks, AND (b) subprocess-exec `yarn workspace @openvaa/dev-seed seed --template <arg>` for end-to-end verification against live Supabase.
- **Plan 58-10 (README):** Must document the T-58-05-02 warning ("Custom templates execute developer-authored code — only pass `--template <path>` pointing at code you trust") under the `--template <path>` usage section, per the threat model's documentation obligation.

## Threat Flags

None — this plan's scope stays inside the `<threat_model>` register. All STRIDE threats (T-58-05-01 through T-58-05-07) have dispositions of either `mitigate` (implemented via parseArgs strict mode, `validateTemplate` zod, Writer env enforcement, explicit error-channel writes) or `accept` (T-58-05-02 arbitrary code execution via `.ts`/`.js` is the feature, T-58-05-06 memory DoS is equivalent to running any `.ts` under tsx).

## Self-Check: PASSED

**File existence:**
- FOUND: `packages/dev-seed/src/cli/seed.ts`
- FOUND: `packages/dev-seed/src/cli/resolve-template.ts`
- FOUND: `packages/dev-seed/src/cli/help.ts`
- FOUND: `packages/dev-seed/src/cli/summary.ts`
- FOUND: `packages/dev-seed/tests/cli/resolve-template.test.ts`
- FOUND: `packages/dev-seed/tests/cli/summary.test.ts`
- FOUND: `packages/dev-seed/tests/cli/help.test.ts`
- FOUND: `packages/dev-seed/package.json` (scripts.seed present)
- FOUND: `packages/dev-seed/src/index.ts` (barrel re-exports present)

**Commit existence (`git log --oneline | grep`):**
- FOUND: `0ddd56dc1` test(58-05): add failing CLI utility tests (resolve-template, summary, help)
- FOUND: `87d39a709` feat(58-05): implement CLI utility modules (resolve-template, summary, help)
- FOUND: `01818fef5` feat(58-05): wire cli/seed.ts entry + package.json script + barrel re-exports

**Acceptance criteria grep checks (all PASS):**
- `grep -q "export async function resolveTemplate" packages/dev-seed/src/cli/resolve-template.ts` — PASS
- `grep -q "export const USAGE" packages/dev-seed/src/cli/help.ts` — PASS
- `grep -q "export function formatSummary" packages/dev-seed/src/cli/summary.ts` — PASS
- `grep -q "pathToFileURL" packages/dev-seed/src/cli/resolve-template.ts` — PASS
- `grep -q "validateTemplate" packages/dev-seed/src/cli/resolve-template.ts` — PASS
- `grep -q "parseArgs" packages/dev-seed/src/cli/seed.ts` — PASS
- `grep -q "import { Writer }" packages/dev-seed/src/cli/seed.ts` — PASS
- `grep -q "import { runPipeline }" packages/dev-seed/src/cli/seed.ts` — PASS
- `grep -q "import { fanOutLocales }" packages/dev-seed/src/cli/seed.ts` — PASS
- `grep -q "BUILT_IN_TEMPLATES" packages/dev-seed/src/cli/seed.ts` — PASS
- `grep -q "process.exit(0)" + "process.exit(1)"` — PASS (both present)
- `grep -q "Cannot reach Supabase at"` — PASS
- `grep -q '"seed": "tsx src/cli/seed.ts"' packages/dev-seed/package.json` — PASS
- `grep -q "#!/usr/bin/env tsx"` seed.ts line 1 — PASS
- Barrel: resolveTemplate / formatSummary / SEED_CLI_USAGE all present — PASS

**Verification command results:**
- `yarn workspace @openvaa/dev-seed test:unit tests/cli/` — 27 passed (11 + 7 + 9) in 3 files
- `yarn workspace @openvaa/dev-seed test:unit` (full suite) — 267 passed across 33 files, zero regressions
- `yarn workspace @openvaa/dev-seed typecheck` — exit 0
- `yarn workspace @openvaa/dev-seed seed --help` — exit 0, USAGE printed to stdout (first line `Usage: yarn workspace @openvaa/dev-seed seed [options]`)
- `yarn workspace @openvaa/dev-seed seed --template unknown-name` — exit 1, stderr has `Error: Unknown template: 'unknown-name'. Built-in templates: (none registered yet). For a custom template, pass a path like './my-template.ts' or '/abs/path.json'.`
- `cd packages/dev-seed && yarn exec tsx -e "import('./src/index.ts').then(m => console.log(typeof m.resolveTemplate, typeof m.formatSummary, typeof m.SEED_CLI_USAGE))"` — prints `function function string`
- `yarn exec eslint --flag v10_config_lookup_from_file src/cli/` — exit 0 (after autofix)

---
*Phase: 58-templates-cli-default-dataset*
*Plan: 05*
*Completed: 2026-04-23*
