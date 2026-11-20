# 189-01 Render removal evidence

Date: 2026-11-20 (UTC). Local tree only; no deployed system was touched.
Base: `22e6d0939` (docs(phase-189): begin phase execution).

DEVSEED_TEMPLATE_TESTS_BEFORE=58
RENDER_GREP_BEFORE=21
DEVSEED_TEMPLATE_TESTS_AFTER=45
DEVSEED_TEMPLATE_DELTA=-13

## How each line was measured

- `DEVSEED_TEMPLATE_TESTS_BEFORE=58`: `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts tests/ciDockerImageBuildGate.test.ts` on the unchanged tree: `Test Files 3 passed (3)`, `Tests 58 passed (58)`, exit 0.
- `RENDER_GREP_BEFORE=21`: `git grep -n -E 'render\.example|render\.com|\bRender\b|fromGroup|envVarGroups|onrender|render\.yaml|Blueprint' -- ':!.planning'` on the unchanged tree printed 21 lines in 9 files: `render.example.yaml` (5), `packages/dev-seed/tests/analyticsEnvTemplates.test.ts` (4), `packages/dev-seed/tests/deploymentTemplates.test.ts` (3), the deployment guide (4), `.github/workflows/main.yaml` (1), `CLAUDE.md` (1), `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` (1), `apps/docs/src/routes/+page.svelte` (1), `scripts/fixtures/assert-test-keys-scope.input.txt` (1). The `\b` of the pattern does not act as a word boundary in `git grep -E` here, so a line whose only Render word is a bare `Render` (the guide's section headings) is not counted; those lines went with their sections all the same.
- `DEVSEED_TEMPLATE_TESTS_AFTER=45`: the same command after Task 1: `Test Files 3 passed (3)`, `Tests 45 passed (45)`, exit 0.
- `DEVSEED_TEMPLATE_DELTA=-13`: 5 from `deploymentTemplates.test.ts` (the `describe('render.example.yaml')` block: one test plus four of `it.each(SERVER_VARIABLES)`), 7 from `analyticsEnvTemplates.test.ts` (its `describe('render.example.yaml')` block: six of `it.each(ANALYTICS_VARIABLES)` plus one), and 1 from the `it.each(TEMPLATES)` case, which lost its `render.example.yaml` entry. The helper `renderEntry` went with the block, its only caller.
- The root-compose blocks survive: `grep -c "describe('docker-compose.dev.yml'"` prints 1 on each of the two test files.
- `yarn workspace @openvaa/docs validate:links --check`: `Total findings: 0` (`github-path: 0`), exit 0.
- `yarn eslint` and `yarn prettier --check` on the two test files and the guide: exit 0.
- The guide's removed section carried the warning never to set `SUPABASE_SERVICE_ROLE_KEY` on the frontend service; the environment-variables page still states that the key bypasses row-level security and that nothing in the frontend reads it.
