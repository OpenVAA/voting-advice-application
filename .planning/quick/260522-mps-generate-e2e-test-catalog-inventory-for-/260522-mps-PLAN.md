---
quick_id: 260522-mps
slug: generate-e2e-test-catalog-inventory-for-
description: Generate e2e test catalog inventory for Phase 88 audit
date: 2026-05-22
mode: quick
---

# Quick Task 260522-mps — E2E Test Catalog Inventory

## Goal

Produce `tests/TEST-INVENTORY.md` — a hierarchical inventory of every spec and every test in the e2e suite, in **execution order** as defined by `tests/playwright.config.ts` project dependencies. The operator uses this document during Phase 88 to mark catalog edits (remove / add / consolidate). It is a single-pass static-analysis pass over the spec tree — no code changes outside the inventory file.

## Deliverable shape (verbatim from operator spec)

```
# 0. Fixtures

## 0.1 {fixture name and link to code}

List fixture contents in SUCCINCT_FORMAT

# 1. {"Setup" or "Project"} {project name}

## 1.1. {spec name with file link}

List any beforeAll/afterAll/beforeEach/helper definitions in SUCCINCT_FORMAT
List any other spec-level code in SUCCINCT_FORMAT

### 1.1.1 {test name with link to file:row}

List test setup actions on one line each (beforeEach Foo, fixture Bar with links to their descriptions in THIS document)
List test contents in SUCCINCT_FORMAT
```

### SUCCINCT_FORMAT rules

- List each non-trivial function call in the test on one line
- **No blank lines between lines** (the operator's IDE handles wrapping)
- If a function name isn't explanatory enough, append an inline comment on the same line
- Mark the **meat-of-the-test** expects (not the scaffolding ones) with all-caps `EXPECT(...)`
- Only include single-line comments when ABSOLUTELY necessary for understanding
- Do **NOT** wrap any lines — long lines stay long; the IDE handles wrapping

### Execution-order rules

- Order strictly follows the `dependencies:` graph in `tests/playwright.config.ts`. Where multiple projects share the same predecessor, list them in the order they appear in the config file.
- `data-setup` and `auth-setup` and all `*-setup`/`*-teardown` projects are listed as top-level sections (e.g., `# 1. Setup data-setup`, `# 2. Setup auth-setup`, etc.) — they have file-level contents but typically no `test()` blocks (they may use `test('setup', ...)` patterns); include whatever they contain.
- Spec projects are listed as `# N. Project {project-name}` (e.g., `# 5. Project candidate-app`).
- Sub-projects with the same testMatch (e.g., visual-regression, performance, a11y-smoke, bank-auth — they appear inside a child config block at lines 525+ of playwright.config.ts) are listed under their parent project section as additional spec entries OR as their own top-level sections — pick whichever reads cleanest; document the choice in the inventory's intro paragraph.

## Source inputs (must read)

1. `tests/playwright.config.ts` — project graph + dependencies → derive execution order
2. `tests/tests/fixtures/index.ts` + `tests/tests/fixtures/voter.fixture.ts` — fixtures section
3. `tests/tests/setup/*.setup.ts` + `tests/tests/setup/*.teardown.ts` — setup/teardown projects
4. All 37 files under `tests/tests/specs/**/*.spec.ts` — spec inventory
5. **Helpers consulted as needed but NOT inventoried inline** — `tests/tests/helpers/**`, `tests/tests/pages/**`, `tests/tests/utils/**`. If a helper is referenced in a test, name it on the line (e.g., `walkVoterIteration(...)`) but don't expand its body. The operator can drill into helper code via the file-row link if needed.

## Output file

`tests/TEST-INVENTORY.md` (single file, committed at task close).

## Tasks (single executor pass)

### Task 1 — Generate `tests/TEST-INVENTORY.md`

- **Files to read:** `tests/playwright.config.ts`, `tests/tests/fixtures/**`, `tests/tests/setup/**`, `tests/tests/specs/**/*.spec.ts`
- **Files to write:** `tests/TEST-INVENTORY.md` (CREATE — does not exist yet)
- **Action:**
  1. Parse `tests/playwright.config.ts` projects array. Build an execution-order list by topological sort of the `dependencies:` graph; tie-break by source-order in the config file.
  2. Read fixtures (`fixtures/index.ts` + `fixtures/voter.fixture.ts`). Write the `# 0. Fixtures` section.
  3. For each project (setup/teardown/spec), in execution order:
     - Open the file(s) matched by `testMatch:`.
     - Section header: `# N. Setup {name}` (for setup/teardown) OR `# N. Project {name}` (for specs).
     - For each matched spec file: `## N.M {spec-title-or-filename} ([path](relative/path/from/repo/root))`
     - List file-level constructs: imports of helpers worth noting, top-of-file `test.use(...)`, `test.describe.configure(...)`, top-level `test.beforeAll/afterAll/beforeEach/afterEach`, any top-level helper definitions or const blocks.
     - For each `test(...)` / `test.skip(...)` / `test.fixme(...)` block:
       - Header: `### N.M.K {test title} ([file:row](relative/path:row))`
       - Body in SUCCINCT_FORMAT (one line per non-trivial call). Mark scaffolding `expect(...)` lower-case and meat-of-test `EXPECT(...)` upper-case. Include `test.skip(...)` / `test.fixme(...)` markers inline.
  4. Verify every spec file under `tests/tests/specs/**` appears exactly once. If a spec is excluded from the suite via `testIgnore`, note it in the inventory (e.g., `## N.M {filename} — EXCLUDED via testIgnore`).
- **Verify:** `wc -l tests/TEST-INVENTORY.md` > 500 (rough lower bound — 37 specs × multiple tests each + fixture section). `grep -c "^### " tests/TEST-INVENTORY.md` should approximate the total live test count surfaced by `grep -rh "^\s*test\(" tests/tests/specs/`.
- **Done:** `tests/TEST-INVENTORY.md` written; commit reference in SUMMARY.

## must_haves

- **truths:** `tests/playwright.config.ts` is the single source of truth for execution order; the `dependencies:` graph determines section ordering. 37 spec files under `tests/tests/specs/**`. Fixtures live in `tests/tests/fixtures/`.
- **artifacts:** `tests/TEST-INVENTORY.md` (new file; markdown; no max line length).
- **key_links:**
  - `tests/playwright.config.ts:1` — project graph
  - `tests/tests/fixtures/voter.fixture.ts:1` — primary voter fixture
  - `tests/tests/specs/voter/voter-journey.spec.ts:1` — example spec for SUCCINCT_FORMAT reference

## Out of scope (DO NOT do in this task)

- Do not modify any spec file
- Do not modify `tests/playwright.config.ts`
- Do not expand helpers/page-objects/utils inline (reference them by name + line, don't inline their contents)
- Do not propose audit edits (remove/add/consolidate decisions) — that's Phase 88 work; this is the inventory it operates on
- Do not modify ROADMAP.md or STATE.md (orchestrator handles state)
