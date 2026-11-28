---
phase: 189-documentation-and-closure
plan: "01"
subsystem: docs
tags: [render, deployment, docs, dev-seed-tests, requirements]
status: complete

requires:
  - phase: 189 (CONTEXT F-01)
    provides: the operator's 2026-11-20 fill removing the Render deployment example
provides:
  - "render.example.yaml deleted; its only tests removed (dev-seed template tests 58 -> 45, delta -13)"
  - "The plan's Render grep leaves two lines, both kept: the docs-home demo link and a guard's fixture label"
  - "CLAUDE.md § Deployment describes the AWS frontend (Terraform under infra/) and Supabase Cloud"
  - "DOCS-07 and ROADMAP § 189 criterion 5 amended to F-01"
affects: [189-11, 189-12, 189-20]

actuals:
  tokens: 7400
  tasks: 3
  commits: 3
plan_head_before: 22e6d093936918e6a4fc06e635254407d40a21f9
plan_head_after: c4a84d816a39f90b1cacf72f4a91ab0e1ce7db91

tech-stack:
  added: []
  patterns:
    - "Back a pattern grep with a word-match grep (`git grep -w`) when the pattern relies on `\\b`, which `git grep -E` does not honour here"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-01-render-removal.md
  modified:
    - packages/dev-seed/tests/deploymentTemplates.test.ts
    - packages/dev-seed/tests/analyticsEnvTemplates.test.ts
    - packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
    - .github/workflows/main.yaml
    - CLAUDE.md
    - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
    - apps/frontend/src/lib/server/admin/features/condenseArguments.ts
    - apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts
    - .planning/workstreams/deployment/REQUIREMENTS.md
    - .planning/workstreams/deployment/ROADMAP.md
  deleted:
    - render.example.yaml

key-decisions:
  - "The Render gateway timeout named in two Admin job comments (condenseArguments.ts, generateQuestionInfo.ts) is removed under F-01 ('anywhere else a grep finds them'), though the plan's inventory missed it"
  - "The docs-home demo link (onrender.com) and the assert-test-keys-scope fixture label stay: a demo VAA, and a fixture whose line numbers are pinned"

requirements-completed: [DOCS-07]

coverage:
  - id: D1
    description: "Template, its only tests and the guide's Render text gone in one commit; 45 tests pass"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts tests/ciDockerImageBuildGate.test.ts -> Tests 45 passed (45)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/docs validate:links --check -> Total findings: 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Only the two kept Render mentions remain; comment hygiene green"
    verification:
      - kind: other
        ref: "Task 2 verify: git grep -l over the truth-4 pattern = the two kept files; yarn assert:comment-hygiene exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "DOCS-07 and criterion 5 amended with the F-01 note"
    verification:
      - kind: other
        ref: "Task 3 verify, exit 0"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-20
---

# Phase 189 Plan 01: Render Removal Summary

**The Render template is gone with the 13 dev-seed tests that guarded only it (58 -> 45). The plan's Render grep now finds two lines, both kept on purpose: the live demo link on the docs home (`apps/docs/src/routes/+page.svelte`) and a path label in `scripts/fixtures/assert-test-keys-scope.input.txt`.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-11-20T09:46:00Z
- **Completed:** 2026-11-20T09:51Z
- **Tasks:** 3
- **Files:** 1 deleted, 1 created, 10 modified

## Accomplishments

- Deleted `render.example.yaml`. Removed the `describe('render.example.yaml')` blocks from `deploymentTemplates.test.ts` (5 tests) and `analyticsEnvTemplates.test.ts` (7 tests), plus the `TEMPLATES` entry (1 test) and the `renderEntry` helper. The `docker-compose.dev.yml` and `.env.example` blocks are unchanged.
- Deleted the deployment guide's Render sentence and its section "3. Deploy the frontend on Render", with the subsection on upgrading an older service. The docs link check has 0 findings.
- Rewrote the `ciDockerImageBuildGate.test.ts` header and the `docker-image-build` comment in `main.yaml` so they name the root compose and the AWS pipeline (`infra/scripts/build-push-image.sh`, `--target production`). Only comment lines changed in `main.yaml`.
- Rewrote `CLAUDE.md` § Deployment. The frontend runs on AWS as an ECS service behind CloudFront, written in Terraform under `infra/` and deployed by `deploy.yml` on `deploy/staging`. The backend is Supabase Cloud, configured by `infra/modules/supabase`. The guide is the entry point, and `docker-compose.dev.yml` is still for production build testing only.
- Changed DOCS-07 and ROADMAP § Phase 189 criterion 5 to say the Render example is removed, citing the operator's 2026-11-20 fill (189-CONTEXT F-01, which supersedes A5).

## Task Commits

1. **Task 1 (tracer): remove the template, its only tests and the guide's Render text**: `5f8ae5034` (feat)
2. **Task 2: update the shared comments and CLAUDE.md § Deployment**: `eca863801` (docs)
3. **Task 3: amend DOCS-07 and criterion 5**: `c4a84d816` (docs)

After Task 1 the tracer verify was run again on the committed tree and passed, so expansion went ahead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing coverage] Two Render mentions the plan's grep cannot see**
- **Found during:** Task 2
- **Issue:** `\b` does not act as a word boundary under `git grep -E` on this host, so the `\bRender\b` arm of the truth-4 pattern matches nothing. The research inventory was built with the same pattern and missed the parenthetical "(Render's default is 100s; these jobs run for minutes)" in the job-writer comments of `condenseArguments.ts` and `generateQuestionInfo.ts`. `git grep -w Render` found both.
- **Fix:** both now read "(a gateway's timeout is far shorter than these jobs, which run for minutes)". The ALB idle timeout is 60 s (`infra/modules/frontend-service/origin.tf`). Nothing else in those comments changed. A case-insensitive search for Render used as a host name now finds nothing.
- **Files modified:** `apps/frontend/src/lib/server/admin/features/condenseArguments.ts`, `apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts`
- **Commit:** `eca863801`

**Total deviations:** 1 auto-fixed. The plan's `files_modified` did not list these two files; F-01 covers them.

## Notes for later plans

- **189-11 / 189-12 (guide rewrite):** the deleted Render section carried the warning never to set `SUPABASE_SERVICE_ROLE_KEY` on the frontend service. The environment-variables page still says the key bypasses RLS and that the frontend never reads it, but the rewritten guide should repeat the warning for the AWS task environment.
- **Final full-suite plan:** if a later grep uses the truth-4 pattern, use `git grep -w` (or `-P`) for the word arm, because `\b` matches nothing here.
- `RENDER_GREP_BEFORE` was 21 lines. That figure inherits the same `\b` blind spot (the guide's bare `Render` headings were not counted). The evidence file says so.

## Issues Encountered

- `yarn eslint` on `ciDockerImageBuildGate.test.ts` reports two `func-style` errors on HEAD before this plan too. They are on lines this plan did not touch, and no gate runs them: `@openvaa/dev-seed`'s `lint` covers `src/` only, and the root `eslint tests` covers `tests/`. Left as they are.

## E2E

No spec, fixture or served route changed (the two frontend edits are comment-only), so no E2E project was affected. Delta 0.

## Self-Check: PASSED

- FOUND: evidence/189-01-render-removal.md (`DEVSEED_TEMPLATE_TESTS_AFTER=45`, `DEVSEED_TEMPLATE_DELTA=-13`, `RENDER_GREP_AFTER=2`)
- ABSENT (intended): render.example.yaml
- FOUND: 5f8ae5034, eca863801, c4a84d816 (ancestors of HEAD)
