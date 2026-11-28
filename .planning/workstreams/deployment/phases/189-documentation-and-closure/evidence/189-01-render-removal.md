# 189-01 Render removal evidence

Date: 2026-11-20 (UTC). Local tree only; no deployed system was touched.
Base: `22e6d0939` (docs(phase-189): begin phase execution).

DEVSEED_TEMPLATE_TESTS_BEFORE=58
RENDER_GREP_BEFORE=21
DEVSEED_TEMPLATE_TESTS_AFTER=45
DEVSEED_TEMPLATE_DELTA=-13
RENDER_GREP_AFTER=2
RENDER_KEPT_DEMO_LINK=apps/docs/src/routes/+page.svelte (live demo VAA, not the deployment example)
RENDER_KEPT_FIXTURE=scripts/fixtures/assert-test-keys-scope.input.txt (path label in a guard's self-test fixture)

## How each line was measured

- `DEVSEED_TEMPLATE_TESTS_BEFORE=58`: `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts tests/ciDockerImageBuildGate.test.ts` on the unchanged tree: `Test Files 3 passed (3)`, `Tests 58 passed (58)`, exit 0.
- `RENDER_GREP_BEFORE=21`: `git grep -n -E 'render\.example|render\.com|\bRender\b|fromGroup|envVarGroups|onrender|render\.yaml|Blueprint' -- ':!.planning'` on the unchanged tree printed 21 lines in 9 files: `render.example.yaml` (5), `packages/dev-seed/tests/analyticsEnvTemplates.test.ts` (4), `packages/dev-seed/tests/deploymentTemplates.test.ts` (3), the deployment guide (4), `.github/workflows/main.yaml` (1), `CLAUDE.md` (1), `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` (1), `apps/docs/src/routes/+page.svelte` (1), `scripts/fixtures/assert-test-keys-scope.input.txt` (1). The `\b` of the pattern does not act as a word boundary in `git grep -E` here, so a line whose only Render word is a bare `Render` (the guide's section headings) is not counted; those lines went with their sections all the same.
- `DEVSEED_TEMPLATE_TESTS_AFTER=45`: the same command after Task 1: `Test Files 3 passed (3)`, `Tests 45 passed (45)`, exit 0.
- `DEVSEED_TEMPLATE_DELTA=-13`: 5 from `deploymentTemplates.test.ts` (the `describe('render.example.yaml')` block: one test plus four of `it.each(SERVER_VARIABLES)`), 7 from `analyticsEnvTemplates.test.ts` (its `describe('render.example.yaml')` block: six of `it.each(ANALYTICS_VARIABLES)` plus one), and 1 from the `it.each(TEMPLATES)` case, which lost its `render.example.yaml` entry. The helper `renderEntry` went with the block, its only caller.
- The root-compose blocks survive: `grep -c "describe('docker-compose.dev.yml'"` prints 1 on each of the two test files.
- `yarn workspace @openvaa/docs validate:links --check`: `Total findings: 0` (`github-path: 0`), exit 0.
- `yarn eslint` and `yarn prettier --check` on the two test files and the guide: exit 0.
- The guide's removed section carried the warning never to set `SUPABASE_SERVICE_ROLE_KEY` on the frontend service; the environment-variables page still states that the key bypasses row-level security and that nothing in the frontend reads it.
- `RENDER_GREP_AFTER=2`: the same `git grep` after Task 2 printed two lines: `apps/docs/src/routes/+page.svelte` (`href: 'https://voting-advice-application-qu5v.onrender.com'`, the docs home's link to a live demo VAA, kept: it is a demo, not deployment instructions) and `scripts/fixtures/assert-test-keys-scope.input.txt` (`# @as render.example.yaml`, a path label inside the self-test fixture of `assert-test-keys-scope`, kept: the file is never read, and editing it would shift the line numbers its expected-violations file pins).
- Task 2 edits: the header of `ciDockerImageBuildGate.test.ts` and the comment above the `docker-image-build` job in `.github/workflows/main.yaml` name the root compose and the AWS deploy pipeline (`infra/scripts/build-push-image.sh`, `BUILD_TARGET="production"`) in place of the template; `CLAUDE.md` § Deployment describes the AWS frontend (ECS behind CloudFront, Terraform under `infra/`, `deploy.yml` on `deploy/staging`), Supabase Cloud configured by `infra/modules/supabase`, the guide as the entry point, and keeps that `docker-compose.dev.yml` is for production build testing only.
- A word-match search, `git grep -n -w 'Render' -- ':!.planning' ':!.yarn'`, found two more Render mentions the pattern above misses: the parenthetical "(Render's default is 100s; these jobs run for minutes)" in the job-writer comment of `condenseArguments.ts` and of `generateQuestionInfo.ts` (`apps/frontend/src/lib/server/admin/features/`). Both now read "(a gateway's timeout is far shorter than these jobs, which run for minutes)"; the ALB idle timeout is 60 s (`infra/modules/frontend-service/origin.tf`, `idle_timeout`). Every other hit of the word search is the verb ("Render a filter", "Render templates"). A case-insensitive search for Render as a host (`on|to|in|via|from render`, `render service|dashboard|blueprint|url|deploy`) finds nothing.
