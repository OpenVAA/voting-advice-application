# Phase 169: Dependency Bump to Latest Safe Versions - Pattern Map

**Mapped:** 2026-10-01
**Files analyzed:** ~22 modify sites (no new source files except possibly an inline Vite plugin)
**Analogs found:** all sites are edits in place; the "analog" is the current content of each site.

> Per the standing rule, plans should cite **content anchors** (quoted strings below), not line numbers. Line numbers here are a snapshot only.

## File Classification

| File | Role | Data Flow | Anchor / Analog | Decision |
|---|---|---|---|---|
| `.github/workflows/main.yaml` | config (CI) | batch | `node-version: 22.22.1` x8 + step names `Setup Node.js 22.22.1` | D-11 |
| `.github/workflows/main.yaml` node-engine guard job | config (CI) | batch | step `"Setup Node.js 22.22.1 (in range)"` + rejecting step above it | D-11 |
| `.github/workflows/docs.yml` | config (CI) | batch | `node-version: 22.22.1` x1 | D-11 |
| `.github/workflows/release.yml` | config (CI) | batch | `node-version: 22.22.1` + `uses: changesets/action@v1` | D-11, Actions majors |
| `apps/frontend/Dockerfile` | config (deploy) | build | `FROM node:22-alpine AS base`, `ENV YARN_VERSION=4.13.0` | D-11, Yarn bump |
| `package.json` (root) | config | - | `"node": ">=22"`, `"packageManager": "yarn@4.13.0"`, lint scripts with `--flag v10_config_lookup_from_file` | D-11, Yarn, D-17 |
| `apps/frontend/package.json` | config | - | `"node": ">=22"`, lint `--flag v10_config_lookup_from_file` | D-11, D-17 |
| `packages/*/package.json` (10: matching, filters, llm, core, argument-condensation, question-info, app-shared, dev-tools, data, dev-seed) | config | - | `"lint": "eslint --flag v10_config_lookup_from_file src/"` | D-17 |
| `apps/frontend/src/lib/_guards/eslint-*-guard.test.ts` (4) | test | - | `new ESLint({ flags: ['v10_config_lookup_from_file'] })` | D-17 |
| `.yarnrc.yml` | config | - | `yarnPath: .yarn/releases/yarn-4.13.0.cjs`, `catalog:` block; add `npmMinimalAgeGate` | D-04, catalog bumps |
| `packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts` | test (gate) | - | `toEqual({ node: '>=22', yarn: '4.13', npm: 'please-use-yarn' })` | D-11, Yarn |
| `packages/dev-seed/tests/nodeEngineGate.test.ts` | test (gate) | - | reads `engines: { node: string }` | D-11 |
| `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` | test (gate) | - | reads Dockerfile; asserts `AS production`, `--file apps/frontend/Dockerfile`, `--target production` | D-11 (must stay green) |
| `scripts/assert-dependency-audit.mjs` | utility (gate) | request-response (subprocess) | `function runAudit(threshold)`; `if (findings.length === 0 && baseline.accepted.length > 0)` | D-28 |
| `packages/dev-seed/tests/auditBaselineShape.test.ts` | test | - | `it('is not empty, so the assertions below measure something'` | D-28 |
| `security/audit-baseline.json` | data | - | top-level `note`, `accepted[]` | D-29 |
| `apps/supabase/supabase/config.toml` | config | - | `major_version = 15` | D-14 |
| `apps/supabase/supabase/functions/{send-email,identity-callback,invite-candidate}/index.ts` | edge function | request-response | `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';`; send-email also `npm:nodemailer@6.9.10` | D-09 |
| `vitest.workspace.ts` (root) | config | - | whole file: `export default ['packages/**/vitest.config.ts'];` | D-19 |
| `apps/frontend/vite.config.ts` | config | - | `import ViteRestart from 'vite-plugin-restart';` + `restart: ['../../.env']` | D-18 |
| `tests/scripts/visual-container.sh` | script | - | `PW_IMAGE="${PW_IMAGE:-mcr.microsoft.com/playwright@sha256:6446946a…}"` | Playwright bump |
| `tests/tests/specs/visual/visual-regression.spec.ts`, `tests/scripts/tcp-forward.mjs` | prose comments | - | mention `mcr.microsoft.com/playwright:v1.58.2-noble` | follow Playwright bump |
| `apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts` | test comments | - | `on node 22.22.1 (the version CI pins)` (two `// reason:` comments) | D-11 prose follow-through |

## Pattern Assignments

### CI Node pins (`main.yaml`, `docs.yml`, `release.yml`)
Existing shape (repeat at every site; step name embeds the version, so change both):
```yaml
      - name: Setup Node.js 22.22.1
        uses: actions/setup-node@v4
        with:
          node-version: 22.22.1
```
Grep population at run time: `grep -rn "22\.22\.1" .github/` (snapshot: main.yaml x8, docs.yml x1, release.yml x1 = 10).

### Node-version guard job (main.yaml)
Two halves: a step installing an OUT-of-range Node and asserting rejection (message anchor `'assert-node-engine: this Node is '`), then:
```yaml
      - name: "Setup Node.js 22.22.1 (in range)"
        uses: actions/setup-node@v4
        with:
          node-version: 22.22.1

      - name: "Assert the node-engine guard ACCEPTS an in-range Node"
        run: |
          STATUS=0
          OUTPUT="$(node scripts/assert-node-engine.mjs 2>&1)" || STATUS=$?
          ...
          case "$OUTPUT" in
            *' satisfies "engines.node": '*) : ;;
```
When `engines.node` moves to `>=24`, the out-of-range Node in the rejecting half must be re-chosen below 24 (e.g. a 22.x) and the in-range step set to the new 24.x pin. Also run `node scripts/assert-node-engine.mjs --self-test`.

### `apps/frontend/Dockerfile`
```dockerfile
FROM node:22-alpine AS base
WORKDIR /opt
ENV YARN_VERSION=4.13.0
RUN corepack enable && corepack prepare yarn@${YARN_VERSION}
```
`YARN_VERSION` must equal root `packageManager` and `.yarnrc.yml` `yarnPath`. Keep the `AS production` stage name (asserted by `ciDockerImageBuildGate.test.ts`).

### Yarn version triple (must move together)
- `package.json`: `"packageManager": "yarn@4.13.0"`, `engines.yarn: '4.13'`
- `.yarnrc.yml`: `yarnPath: .yarn/releases/yarn-4.13.0.cjs` (plus the committed `.yarn/releases/*.cjs`)
- `Dockerfile`: `ENV YARN_VERSION=4.13.0`
- `assertDeclaredBinariesGate.test.ts`: `expect(readManifest('package.json').engines).toEqual({ node: '>=22', yarn: '4.13', npm: 'please-use-yarn' });` -> update both `node` and `yarn` literals.

### `.yarnrc.yml` catalog + age gate
```yaml
nodeLinker: node-modules
yarnPath: .yarn/releases/yarn-4.13.0.cjs
catalog:
  typescript: ^5.8.3
  vitest: ^3.2.4
  eslint: ^9.39.2
  '@types/node': ^22.19.15   # follows D-11 -> ^24
  '@faker-js/faker': ^8.4.1  # D-20
  '@playwright/test': ^1.58.2
  ...
```
Bump versions in the catalog, not in workspace manifests (catalog-first). Add top-level `npmMinimalAgeGate: 7d` (D-04) next to `nodeLinker`.

### Audit gate liveness (D-28) — `scripts/assert-dependency-audit.mjs`
Current (status swallowed):
```js
function runAudit(threshold) {
  const args = ['npm', 'audit', '--all', '--recursive', '--severity', threshold, '--json'];
  let stdout;
  try {
    stdout = execFileSync('yarn', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
  } catch (error) {
    if (typeof error.stdout !== 'string') { cannotRun(...); }
    stdout = error.stdout;
  }
```
and in `main()`:
```js
  if (findings.length === 0 && baseline.accepted.length > 0) {
    cannotRun(`...An empty instrument reads exactly like a clean tree...`);
  }
```
Change per RESEARCH Pattern 3: capture `status` (0 on success path, `error.status` in catch) and return `{ status, findings }`; classify empty stdout + status 0 = clean, empty stdout + status != 0 = `cannotRun` (exit 2) regardless of baseline size. Keep the docblock's "FOUR properties" section updated (property 4 rewording). `cannotRun` already exits 2 (`process.exit(2)`).

### `auditBaselineShape.test.ts`
```ts
  it('is not empty, so the assertions below measure something', () => {
    expect(baseline.accepted.length).toBeGreaterThan(0);
  });
```
Per D-28 this assertion is relaxed/removed (the empty baseline becomes legal); the per-row assertions (`ALLOWED_SEVERITIES`, integer id, unique, rationale, no `REVIEW_MARKER`, `GHSA-`) stay as `filter` -> expect-empty style. Keep the "no advisory-ignore key" guard.

### `config.toml`
```toml
# The database major version to use. This has to be the same as your remote database's. Run `SHOW
# server_version;` on the remote database to check.
major_version = 15
```
-> 17; amend comment to record that hosted is an operator follow-up (D-14).

### Edge Functions (D-09)
All three: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';` -> exact 2.x pin (`@2.x.y`). send-email: `import nodemailer from 'npm:nodemailer@6.9.10';`. No `deno.json` import maps exist; pins are inline URL specifiers. identity-callback has a `// reason:` comment referencing the esm.sh import (keep accurate).

### ESLint flag (D-17)
Pattern in 12 manifests: `"lint": "eslint --flag v10_config_lookup_from_file src/"`; root: `eslint --flag v10_config_lookup_from_file tests` in `lint:fix`/`lint:check`; 4 guard tests: `new ESLint({ flags: ['v10_config_lookup_from_file'] })` with docblocks stating the flag is MANDATORY and must match the lint script. On ESLint 10 the flag becomes default/removed — change scripts and guard tests together, and rewrite the guard docblocks. Population: `grep -rn v10_config_lookup --exclude-dir=node_modules`.

### `vitest.workspace.ts` (D-19)
Whole file: `export default ['packages/**/vitest.config.ts'];` -> delete and move to root `vitest.config.ts` `test.projects: ['packages/**/vitest.config.ts']`; check `test:unit` scripts that reference the workspace file.

### `apps/frontend/vite.config.ts` (D-18)
`import ViteRestart from 'vite-plugin-restart';` and in `plugins: [ ... ViteRestart({ restart: ['../../.env'] }) ]` -> replace with inline plugin (configureServer + `server.watcher.add` + `server.restart()` on change).

### Playwright visual image
`tests/scripts/visual-container.sh`: `PW_IMAGE="${PW_IMAGE:-mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d}"` — digest must be re-resolved to the `v<new>-noble` tag matching catalog `@playwright/test`; main.yaml comment `mcr.microsoft.com/playwright:v<version>-noble` is version-agnostic. Baselines may need regeneration.

### `release.yml`
```yaml
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          title: "chore: version packages"
          commit: "chore: version packages"
          publish: yarn release
```
Actions majors (`actions/setup-node@v4`, `changesets/action@v1`) bumped in place.

## Shared Patterns
- **Gate tests in `packages/dev-seed/tests/*Gate.test.ts`** read repo files via `readFileSync(resolve(REPO_ROOT, ...))` with `REPO_ROOT` from `fileURLToPath(import.meta.url)`; they assert literal content of CI/Dockerfile/manifests, so every pin change must be mirrored there in the same commit.
- **Read gate exit status directly**, never piped.
- **Content anchors, not line numbers** in plans.

## No Analog Found
| File | Reason |
|---|---|
| root `vitest.config.ts` with `test.projects` (if created) | no root vitest config exists; use Vitest docs per RESEARCH |
| inline Vite restart plugin | no existing custom Vite plugin; use RESEARCH example |

## Metadata
**Scope:** .github/workflows, apps/frontend, apps/supabase, packages/*, scripts, tests/scripts, root configs. **Date:** 2026-10-01.
