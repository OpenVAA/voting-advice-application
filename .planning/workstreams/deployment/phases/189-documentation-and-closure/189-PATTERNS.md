# Phase 189: Documentation and Closure - Pattern Map

**Mapped:** 2026-11-20
**Files analyzed:** 20 groups (new + modified)
**Analogs found:** 19 / 20 (all analogs verified git-tracked via `git ls-files`)

Cite by content anchor (heading, symbol, `describe` title), not by line number, when a plan quotes these; line numbers below are as of `99f6c3ea4`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/frontend/src/lib/server/startup/environmentReference.test.ts` (new, B-02) | test (docs guard) | file-I/O, transform | `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts` | exact |
| `apps/frontend/src/lib/analytics/eventCatalogue.test.ts` (new, D-02) | test (docs guard) | file-I/O | `taskEnvironment.test.ts` (+ `EVENT_NAMES` in `events.schema.ts`) | exact |
| `infra/scripts/hosted-settings-reference.test.ts` (new, B-01) | test (docs guard, infra suite) | file-I/O | `infra/scripts/destroy-workflow.test.ts` (root resolution) + `taskEnvironment.test.ts` (problems shape) | role-match |
| `apps/docs/.../developers-guide/deployment/+page.md` (rewrite) | docs page | — | itself + `configuration/environmental-variables/+page.md` | exact |
| `apps/docs/.../deployment/hosted-settings/+page.md` (new) | docs page (reference table) | — | `configuration/environmental-variables/+page.md` | role-match |
| `apps/docs/.../deployment/operations/+page.md` (new) | docs page (runbook summary) | — | `contributing/contribute/+page.md` (numbered procedure) | role-match |
| `apps/docs/.../configuration/analytics/+page.md` (new) | docs page | — | `configuration/environmental-variables/+page.md` | role-match |
| `apps/docs/.../configuration/environmental-variables/+page.md` (rewrite) | docs page | — | itself | exact |
| `apps/docs/src/lib/navigation.config.ts` (regenerated) | config (generated) | batch | `contributing` entry with `children` | exact |
| `infra/README.md`, `infra/bootstrap/README.md`, `infra/envs/staging/{aws,dns-mail,supabase}/README.md` | runbook | — | `infra/envs/staging/supabase/README.md` `## Observations` table | exact |
| 6 todos → `.planning/todos/completed/*.md` | closure record | — | `.planning/todos/completed/2026-10-07-174-no-per-caller-limit-…md` | exact |
| new pending todos (unobserved statements, pre-launch auth, restore drill, drift guard) | todo | — | same file's frontmatter | exact |
| `packages/dev-seed/tests/deploymentTemplates.test.ts`, `analyticsEnvTemplates.test.ts`, `ciDockerImageBuildGate.test.ts` | test (deletion/edit) | — | n/a (removal per RESEARCH § F-01 table) | n/a |
| `render.example.yaml`, `apps/frontend/docker-compose.dev.yml` (delete), `apps/frontend/Dockerfile` (drop `development` stage) | config | — | n/a (removal) | n/a |
| `apps/frontend/src/lib/utils/constants.ts`, `.env.example`, root `docker-compose.dev.yml`, 4 auth test mocks | config / test (line removal, B-03) | — | n/a | n/a |
| `CLAUDE.md` § Deployment, `.github/workflows/main.yaml:181-184` comment, `.claude/skills/recommended-skills/SKILL.md` | docs/comment edit | — | n/a | n/a |
| `REQUIREMENTS.md` DOCS-07/INFRA-13, `ROADMAP.md` § 189 crit. 5 | planning doc | — | n/a | n/a |
| `189-*/evidence/*.md` | evidence | file-I/O | `188-*/evidence/188-16-hosted-limit.md` | exact |
| `publishers-guide/.../what-data-should-be-collected/+page.md` (pointer) | docs | — | — | trivial edit |
| Optional `deployment/` Overview child in nav | config | — | **none** (no page in `(content)/*/*/` has own `+page.md` AND children) | **no analog** |

## Pattern Assignments

### `environmentReference.test.ts` (B-02) and `eventCatalogue.test.ts` (D-02)

**Analog:** `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts` (561 lines)

**Header + imports** (lines 1-10): one TSDoc paragraph stating the specification, then `@vitest-environment node`:
```typescript
/**
 * Specification for ... Every problem found names the variable or the file it concerns.
 *
 * @vitest-environment node
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ANALYTICS_ENV } from '$lib/server/analytics/config';
import { REQUIRED_ENV } from './requiredEnv';
```
For `eventCatalogue.test.ts` import `EVENT_NAMES` from `./events.schema` (`events.schema.ts:271-273`: `Object.freeze(EventSchema.options.map((member) => member.shape.name.value))`).

**Repository root** (line 22) — adjust the `../` count to the file's depth (`src/lib/analytics/` is five up):
```typescript
/** The repository root, six directories above this file. */
const REPOSITORY_ROOT = fileURLToPath(new URL('../../../../../../', import.meta.url));
```

**Contract restated locally** (lines 25-41): `REQUIRED_NAMES` / `ANALYTICS_NAMES` as `ReadonlyArray<string>` "so the fixture cases assert against the contract rather than against the implementation's own export".

**Section extraction by heading + backticks** (lines 104-121) — reuse for the docs page (heading `## ...` of each role group, or the whole page):
```typescript
const RUNBOOK_SECTION_START = '## The task';
function runbookEnvironmentNames(runbook: string): Set<string> | undefined {
  const lines = runbook.split('\n');
  const start = lines.findIndex((line) => line.startsWith(RUNBOOK_SECTION_START));
  if (start < 0) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  const section = (end < 0 ? rest : rest.slice(0, end)).join('\n');
  return new Set(Array.from(section.matchAll(/`([^`\n]+)`/g), (match) => match[1]));
}
```
For D-02 (exact set, both ways) parse the catalogue table's first column (backticked event names) and report both "missing from page" and "on page, not in EventSchema".

**Structure:** a pure `xxxProblems(input): Array<string>` function; `describe` blocks of fixture cases that each plant one fault (red-first: e.g. "names a variable the page does not list", "reports a page without the section"); then one repository case (lines 543-561):
```typescript
describe('the task environment list in the repository', () => {
  const specPath =
    process.env.TASK_ENVIRONMENT_SPEC ?? `${REPOSITORY_ROOT}infra/modules/frontend-service/task-environment.json`;
  it("agrees with REQUIRED_ENV, ANALYTICS_ENV, ...", () => {
    expect(existsSync(specPath), `the list is expected at ${specPath}`).toBe(true);
    const problems = taskEnvironmentProblems({ spec: JSON.parse(readFileSync(specPath, 'utf8')), ... });
    expect(problems).toEqual([]);
  });
});
```
Docs page path: `` `${REPOSITORY_ROOT}apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md` ``. Names to require: 17 of `task-environment.json` `.variables[].name`, `REQUIRED_ENV`, `Object.values(ANALYTICS_ENV)`, optionally the `BOOTSTRAP_*` of `bootstrap.sql`.

---

### `infra/scripts/hosted-settings-reference.test.ts` (B-01)

**Analog:** `infra/scripts/destroy-workflow.test.ts` (header + root resolution), problems shape from `taskEnvironment.test.ts` above. Runs in the infra suite (`infra/vitest.config.ts` includes `scripts/**/*.test.ts`; no `$lib`).

**Header + root** (destroy-workflow.test.ts lines 1-19):
```typescript
/**
 * Guards on `<file>`, ... checked here rather than by its first run. ... shown red below on mutated copies of its text.
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'destroy.yml');
```
Replace `WORKFLOW` with `PAGE = join(REPO_ROOT, 'apps', 'docs', 'src', 'routes', '(content)', 'developers-guide', 'deployment', 'hosted-settings', '+page.md')` and `SETTINGS = join(REPO_ROOT, 'infra', 'modules', 'supabase', 'hosted-settings.json')`. Enumerate JSON leaf keys with a recursive `Object.keys` (not jq `paths(scalars)`, which drops `false` leaves). Fixed names: `site_url`, `uri_allow_list`, `smtp_host`, `smtp_port`, `smtp_admin_email`, `smtp_sender_name` (`settings.tf`), the 7 `rate_limit_*` (`variables.tf`), `smtp_user`/`smtp_pass` (`main.tf`), the 7 function-secret names (`function-secrets.tf`). Mutation-red pattern: run the problems function on a copy of the page text with one name removed.

---

### Docs pages (`deployment/`, `deployment/hosted-settings/`, `deployment/operations/`, `configuration/analytics/`, env page)

**Analog:** `apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md` (lines 1-15)

- **No frontmatter.** First line is the `# Title` heading; the nav title is taken from it (`apps/docs/scripts/utils/routes.ts` `extractTitle`).
- Intro paragraph, then `## ` sections, internal links as absolute site routes:
```markdown
# Environment variables

OpenVAA reads its per-deployment configuration from environment variables. ... (see [Deployment](/developers-guide/deployment)).

## The repo-root `.env`
```
- Each guide step: the step, the command in a fenced `bash` block, then a link to the runbook step where it was measured (A-01); no procedure copied whole. Placeholders `<your-domain>`, `<account-id>` (A-03).
- Numbered-procedure style for operations: `contributing/contribute/+page.md` ("If you want to ..., follow these steps." then `1. ...`).
- Never introduce a redirect for `deployment/` (path kept). If a page moves, a stub `+page.ts` follows `developers-guide/development/intro/+page.ts`:
```typescript
import { redirect } from '@sveltejs/kit';

export const prerender = true;

export function load() {
  redirect(308, '/developers-guide/development/running-the-development-environment');
}
```

### `apps/docs/src/lib/navigation.config.ts` (regenerated, not hand-edited)

**Analog:** the `Contributing` entry (lines ~248-262): a section with `children: [{ title, route }]`. Today `Deployment` (l.245-248) has no children. Regenerate with `apps/docs/scripts/generate-navigation-config.ts`; then run `validate:links --check --only nav-route`.

**Pitfall (no analog):** `NavigationItem.svelte` renders an item with children as `<details><summary>` with no link, and `buildSubsectionChildren` adds only depth-3 children — so `/developers-guide/deployment` itself becomes unreachable from the nav. No existing section has both its own page and children. Plan must add an `Overview` child (`fixedTitle: true`) and check the generator keeps it; fallback (`deployment/intro` + stub) needs operator OK (see RESEARCH § Docs site).

---

### Runbook Observations rows and "← guide" back-links

**Analog:** `infra/envs/staging/supabase/README.md` `## Observations` (line ~1789):
```markdown
## Observations

| Date (UTC)    | Observation |
| ------------- | ----------- |
| 2026-10-22    | The import of the throwaway project in Step 2 left no database password in state (`s7_password_in_state=false`). |
```
Rules: one fact per row, dated, past tense, cite run id / evidence path; raw output goes to `189-*/evidence/` (184 D-20). Prettier pads the table — run `yarn format` rather than hand-aligning. Emptied "Not yet observed" sections are deleted (C-01), not left empty.

---

### Todo closure records (G-01) and new pending todos

**Analog:** `.planning/todos/completed/2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md`

**Frontmatter** (lines 1-13) — add the last two keys on closure, keep the rest:
```yaml
---
created: 2026-10-07T12:53:29.000Z
title: ...
area: Edge Functions / database / operations
severity: major
source: Phase 174 (...)
owner: ...
files:
  - apps/supabase/supabase/functions/account-access/index.ts
completed: 2026-11-19
status: completed
---
```
New pending todos use the same keys minus `completed`/`status`, `source: Phase 189 (<decision id>)`, with `## Problem` and a per-item check.

**Closure section** (lines 36-44), appended after the original body (body left intact), file moved with `git mv` from `pending/` to `completed/`:
```markdown
## Closed (phase 188), 2026-11-19

Closed by plan 188-16 on its record, `.planning/workstreams/deployment/phases/188-.../evidence/188-16-hosted-limit.md`.

- **What was built.** ...
- **What remains.** ...
- **Moved.** The unconfirmed ... moves to `.planning/todos/pending/2026-11-15-....md`.
```
Use `## Closed (phase 189), 2026-11-xx`. Re-targeted todos (dependency audit, local ports) stay in `pending/` with a dated note only.

---

### Removals (F-01, F-02, B-03)

No analog; follow RESEARCH § F-01 inventory table exactly: delete `describe('render.example.yaml')` blocks (`deploymentTemplates.test.ts`, `analyticsEnvTemplates.test.ts`), the `TEMPLATES` entry and the now-unused `renderEntry` helper (lint), fix both headers' counts; keep the root-compose `describe` blocks. Expected `@openvaa/dev-seed` unit delta −13. After F-02, build `--target production` (as `main.yaml` and `infra/scripts/build-push-image.sh` do).

## Shared Patterns

### Docs-guard test shape
**Source:** `taskEnvironment.test.ts` · **Apply to:** all three new guards
- Pure `...Problems(input): Array<string>`, each problem naming the item and the file.
- Fixture `describe` cases planting one fault each (red-first), one repository case asserting `toEqual([])`.
- Names read in backticks; contract names restated locally.
- TSDoc on every helper and constant (code style guide); comments obey CLAUDE.md Comment Hygiene (no phase/decision ids).

### Dated observation
**Source:** staging runbooks' `| Date (UTC) | Observation |` · **Apply to:** C-01, E-02, E-03 rehearsal, G-03, G-04 results.

### Recorded search (C-02)
**Source:** RESEARCH § C-02 — the exact `git grep -niE 'unverified|not yet observed|untested'` command and its classified hit list go into the verification, no permanent guard.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `deployment/` nav entry with its own page and children | generated config | No `(content)/*/*/` section has both; generator behaviour for a self-route child unknown (RESEARCH, ASSUMED risk) |

## Metadata

**Analog search scope:** `apps/frontend/src/lib/server/startup`, `apps/frontend/src/lib/analytics`, `infra/scripts`, `apps/docs/src/routes/(content)/developers-guide`, `apps/docs/src/lib`, `infra/envs/staging`, `.planning/todos/completed`
**Files scanned:** ~25
**Pattern extraction date:** 2026-11-20
