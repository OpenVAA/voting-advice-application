---
phase: 58-templates-cli-default-dataset
plan: 10
subsystem: dev-seed
tags: [dev-seed, documentation, readme, claude-md, phase-58-wave-5, d-58-18, d-58-19, dx-01, dx-04]

# Dependency graph
requires:
  - plan: 58-05
    provides: USAGE / SEED_CLI_USAGE text + flag reference shape (`seed` CLI) — README mirrors the help output structure
  - plan: 58-06
    provides: default template characteristics (8 parties, 100 candidates non-uniform, 13 constituencies, 24 questions 18/4/1/1, `generateTranslationsForAllLocales: true`, seed 42) — README's Built-in Templates §default section documents these exactly
  - plan: 58-07
    provides: seed:teardown CLI surface + TEARDOWN_USAGE + root aliases (`dev:seed`, `dev:seed:teardown`, `dev:reset-with-data` composition per D-58-11) + D-58-17 permissive-prefix contract + T-58-07-02 2-char guard — README's Flag Reference §seed:teardown and Troubleshooting sections document these
  - plan: 58-08
    provides: e2e template characteristics (single-locale, Playwright spec-derived) — README §Built-in Templates §e2e references
  - phase: 56-generator-foundations-plumbing
    provides: Template type JSDoc (D-18 schema-extension pattern), TMPL-03 `{ count, fixed }` mixing semantics, D-15 env enforcement messages — README links to `./src/template/types.ts` as the canonical field-level reference (D-58-18 third doc home)
  - phase: 57-latent-factor-answer-model
    provides: latent block semantics — README's Template shape reference §latent bullet points to `.planning/phases/57-latent-factor-answer-model/57-CONTEXT.md` for deep semantics
provides:
  - packages/dev-seed/README.md — DX-01 authoring guide (Overview, Quick Start, Commands, Flag Reference, Built-in Templates, Authoring Custom Templates with TMPL-03 worked example, Environment, Security Notes, Troubleshooting, Related Docs)
  - CLAUDE.md §Seeding local data — DX-04 short snippet (4 bash commands + pointer to README) under Common Workflows
affects:
  - Phase 59 fixture rewrite — README is the canonical contributor-facing authoring reference when Phase 59 authors migration templates
  - Future housekeeping milestone — when `apps/docs/` gets its next broad update (D-58-19 deferred scope), the SvelteKit docs site page on dev-seed can cross-link to README.md as the source of truth
  - AI pair-programming (Claude Code) discovery — CLAUDE.md Common Workflows surfaces `yarn dev:reset-with-data` during normal session context-load

# Tech tracking
tech-stack:
  added: []  # Docs-only plan, no dependency changes
  patterns:
    - "README.md depth / CLAUDE.md brevity (D-58-18): README owns the full authoring guide with worked example; CLAUDE.md is a short snippet (13 lines incl. blank lines) pointing to README. No duplication of authoring depth."
    - "Template type JSDoc as the field-level API reference (D-58-18 third doc home): README explicitly defers field-level docs to IDE hover on the `Template` TypeScript type in `./src/template/types.ts` — no per-field prose in README prevents drift."
    - "Security warning pattern (T-58-05-02): README §Security Notes documents that `--template <path>` with .ts/.js dynamically imports the module and executes top-level code — same trust model as tsx / ts-node. JSON templates parse as pure data and cannot execute code. Acceptance criterion required `grep -q 'execute developer-authored code'` to prevent the warning from being silently dropped (T-58-10-02 mitigation)."
    - "apps/docs/ scope exclusion (D-58-19): README explicitly notes it IS the canonical contributor-facing home; apps/docs/ is NOT updated in Phase 58 and is deferred to a future housekeeping milestone. No docs-site route added."

key-files:
  created:
    - packages/dev-seed/README.md (301 lines)
  modified:
    - CLAUDE.md (+13 lines, 1 new subsection under ## Common Workflows)

key-decisions:
  - "README structured with 9 top-level `## ` sections rather than the plan-suggested 8: added `## Commands` as a separate quick-reference table between Quick Start and Flag Reference. Quick Start is 3 commands for muscle-memory; Commands is the full 5-row table with the workspace-level --help entry points; Flag Reference is flag-by-flag detail. Reduces the Quick Start → 'where do I find the full reference' cognitive gap."
  - "README worked example uses `count: 0 + fixed[]` for elections / constituency_groups / organizations (hand-authored only) and `count: N` without fixed[] for candidates / questions / nominations (fully synthetic), mirroring the built-in `default` template's shape. Demonstrates both ends of the TMPL-03 spectrum plus the middle `{ count: 4, fixed: [...2 entries...] }` case = 2 hand-authored + 2 synthetic. Pulled the `count: 0` idiom from `packages/dev-seed/src/templates/default.ts:40` for authenticity."
  - "Overrides section in README describes the `runPipeline(template, overrides)` programmatic path rather than a CLI `--overrides` flag (CLI does not expose overrides per Plan 05 design). Keeps the doc accurate to the Phase 58 surface. Programmatic overrides are explicitly an advanced subsection with a pointer to `candidates-override.ts` as the reference implementation."
  - "CLAUDE.md snippet kept to 13 lines including the blank line around the code block (well under the ≤20-line DX-04 budget). Included 4 bash commands (dev:reset-with-data, --template e2e, --template ./path, :teardown) covering 95% of contributor use cases without duplicating README's Flag Reference or Troubleshooting."
  - "Section ordering in README: Quick Start → Commands → Flag Reference → Built-in Templates → Authoring → Environment → Security → Troubleshooting → Related Docs. Puts read-first content (Quick Start) ahead of reference material (Flag Reference) and defers security notes to after the happy-path authoring flow — a new contributor who just wants to seed the DB reaches Quick Start in one scroll, while security/troubleshooting is discoverable but not frontloaded."

requirements-completed: [DX-01, DX-04]

# Metrics
duration: ~3 min
completed: 2026-04-23
---

# Phase 58 Plan 10: `@openvaa/dev-seed` README + CLAUDE.md Extension Summary

**`packages/dev-seed/README.md` (301 lines, 9 sections) ships as the contributor-facing authoring guide (DX-01) — worked TMPL-03 example mixing `fixed[]` + `count`, full flag reference for both CLIs, built-in template characteristics, T-58-05-02 security note on dynamic `import()` of custom templates, and troubleshooting for missing env / validation errors / teardown prefix mismatches. `CLAUDE.md` Common Workflows gains a 13-line `### Seeding local data` subsection (DX-04) with the three `dev:*` aliases plus a README pointer.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-23T08:49:09Z
- **Completed:** 2026-04-23T08:52:~Z
- **Tasks:** 2 (both `type="auto"`, both docs-only, no TDD)
- **Files changed:** 2 (1 created, 1 modified); +314 lines across 2 commits
- **Commits:** 2 per-task commits (README first, CLAUDE.md second)

## Accomplishments

- Shipped **`packages/dev-seed/README.md`** (301 lines) with all 8 plan-required section headings plus a 9th `## Commands` quick-reference table:
  - **Overview** — positions dev-seed as a template-driven dev data generator; names the happy-path `yarn dev:reset-with-data` in the lead paragraph.
  - **Quick Start** — 3 bash commands (reset-with-data, e2e, teardown) for muscle memory.
  - **Commands** — 5-row table mapping every user-facing entry point (including the workspace-scoped `--help` commands) to what it does.
  - **Flag Reference** — per-flag table for `seed` (4 flags) and `seed:teardown` (2 flags); documents D-58-09 name-vs-path resolution algorithm as a numbered 4-step list; notes D-58-17 permissive-prefix contract + T-58-07-02 2-char guard.
  - **Built-in Templates** — `default` (13 constituencies / 8 invented Finnish-flavored parties / 100 candidates via `[20,18,15,12,10,10,8,7]` weighting / 24 questions 18/4/1/1 / 4 locales / seed 42 / 100 portraits from 30-pool) and `e2e` (Playwright-spec-matched, single-locale); cross-links to `LICENSE.md` for portrait provenance and notes the Phase 57 latent emitter auto-wires clustering for free.
  - **Authoring Custom Templates** — worked example (50 lines of commented TypeScript) demonstrating all three TMPL-03 modes: `count: 0 + fixed[]` (hand-authored only), `count: N` bare (fully synthetic), and `count: 4 + fixed: [2 entries]` (mixed 2 hand-authored + 2 synthetic); TMPL-03 mixing rule explained as a bulleted list; advanced `Overrides` subsection documents the `runPipeline(template, overrides)` programmatic path with a pointer to `candidates-override.ts` as a reference implementation; Template shape reference defers field-level docs to IDE hover on `Template` in `./src/template/types.ts` (D-58-18 third doc home).
  - **Environment** — lists `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; notes they're set automatically by `supabase start`.
  - **Security Notes** — T-58-05-02 acknowledgment: custom `.ts`/`.js` templates execute top-level code via dynamic `import()` (same trust model as tsx/ts-node); JSON templates parse as pure data. Frames the CLI as local-dev only (writer refuses to run without `SUPABASE_URL`).
  - **Troubleshooting** — 5 actionable error scenarios (missing env, unreachable Supabase, unknown template, validation error with field-path, teardown prefix mismatch, portrait upload failure).
  - **Related Docs** — cross-links to Phases 56 / 57 / 58 context dirs, portrait LICENSE, and CLAUDE.md's `### Seeding local data` subsection.
- Shipped **`CLAUDE.md §Seeding local data`** — new 13-line subsection inserted at the end of `## Common Workflows` (between `### Fixing "module not found" errors` and `## Important Implementation Notes`). Four bash commands (dev:reset-with-data, --template e2e, --template ./path, :teardown) followed by a 3-sentence pointer to `packages/dev-seed/README.md` for authoring depth. No duplication of README content; DX-04's "AI pair programmer should discover the seeding command from a normal CLAUDE.md read" intent satisfied in the minimum prose.

## Verification

All plan acceptance criteria pass:

- `wc -l packages/dev-seed/README.md` → **301** (plan required ≥150)
- `grep -c "^## " packages/dev-seed/README.md` → **9** (plan required ≥8 sections; 9 by design — see key-decisions)
- All 8 required section headings present at stable line numbers (Quick Start L11, Commands L24, Flag Reference L38, Built-in Templates L69, Authoring Custom Templates L103, Environment L239, Security Notes L251, Troubleshooting L264)
- `grep -q "dev:reset-with-data" packages/dev-seed/README.md` → matches (multiple occurrences)
- `grep -q "execute developer-authored code"` → matches (T-58-10-02 mitigation — security warning present)
- `grep -q "SAME trust model"` → matches
- `grep -q "src/template/types.ts"` → matches (Template type JSDoc link per D-58-18)
- Worked example mixes `count` and `fixed[]`: `count: 4, fixed: [...]` at organizations shown; TMPL-03 mixing rule explained as bulleted list
- `grep -q "^### Seeding local data" CLAUDE.md` → matches
- `grep -q "yarn dev:reset-with-data" CLAUDE.md` → matches
- `grep -q "yarn dev:seed --template e2e" CLAUDE.md` → matches
- `grep -q "yarn dev:seed:teardown" CLAUDE.md` → matches
- `grep -q "packages/dev-seed/README.md" CLAUDE.md` → matches (authoring-depth pointer)
- `git diff CLAUDE.md` → only additions; no existing lines modified
- CLAUDE.md new subsection = 13 lines (well under ≤20-line DX-04 budget)
- `apps/docs/` not touched — verified by `git status` showing only `packages/dev-seed/README.md` + `CLAUDE.md` in the plan commits (D-58-19 deferred scope honored)

## Deviations from Plan

None — plan executed exactly as written. The only structural choice beyond the plan's literal section list was adding a `## Commands` quick-reference table between `## Quick Start` and `## Flag Reference`; the plan's suggested 8 headings are all present, and the extra `## Commands` section is a readability enhancement that does not conflict with any success criterion (plan says "Contains section headings X, Y, Z…" as an inclusion check, not an exact-match check).

## Known Stubs

None. This is a documentation-only plan; no code surface was introduced that could contain stubs. The README describes features that exist in the codebase (verified against `help.ts` / `teardown-help.ts` / `default.ts` / `package.json` scripts / `index.ts` barrel exports read during Task 1 read_first).

## Pre-existing Issues (Out of Scope)

Plan 07's SUMMARY notes pre-existing lint errors in `packages/dev-seed/src/templates/*.ts` — these remain untouched per scope boundary (Plan 10 is docs-only; lint issues are unrelated to Plan 10's changes and would be fixed in a dedicated chore commit). The plan's success criteria explicitly state "No pre-existing dev-seed lint errors fixed (SUMMARY.md can reference them as known issues, but plan 10 is docs-only)" — this plan honors that constraint.

## Self-Check: PASSED

- FOUND: `packages/dev-seed/README.md` (created, 301 lines)
- FOUND: `CLAUDE.md` §Seeding local data at line 272 (diff verified — only additions)
- FOUND: commit `fead12fa3` — `docs(58-10): add packages/dev-seed/README.md (DX-01)`
- FOUND: commit `402faa871` — `docs(58-10): add Seeding local data subsection to CLAUDE.md (DX-04)`
- All plan success criteria verified via grep checks above.
