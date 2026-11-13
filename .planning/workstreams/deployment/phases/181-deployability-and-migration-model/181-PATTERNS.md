# Phase 181: Deployability and Migration Model - Pattern Map

**Mapped:** 2026-10-11
**Tree read:** `6cb74fa8f` on `feat/deployment-terraform-supabase` (the research read `03d3c2c40`; every excerpt below was read again at this commit)
**Files analyzed:** 38 new or modified
**Analogs found:** 34 / 38

**How to cite from this document.** Every excerpt is quoted from the file named. Line numbers are given for convenience only. The quoted text is the anchor: find it again at run time, because the v2.16 merge will move lines. All analog paths were checked with `git ls-files` and are tracked source.

**File names.** The names and places of the new files are the planner's to choose (CONTEXT, Claude's Discretion). This map uses the structure recommended in `181-RESEARCH.md`, "Recommended Project Structure". If the planner renames a file, the analog stays the same.

## File Classification

### Server deployability (slices A to D)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/routes/api/health/+server.ts` (new) | route | request-response | `apps/frontend/src/routes/api/auth/logout/+server.ts` | exact |
| `apps/frontend/src/routes/api/health/server.test.ts` (new) | test | request-response | `apps/frontend/src/routes/api/auth/logout/server.test.ts` | exact |
| `apps/frontend/src/routes/api/diagnostics/+server.ts` (new) | route | request-response | `apps/frontend/src/routes/api/feedback/+server.ts` (the `error()` refusal) and `logout/+server.ts` (the `json()` answer) | role-match |
| `apps/frontend/src/routes/api/diagnostics/server.test.ts` (new) | test | request-response | `apps/frontend/src/routes/api/auth/logout/server.test.ts` | exact |
| `apps/frontend/src/lib/server/startup/requiredEnv.ts` (new) | utility | transform | `apps/frontend/src/lib/utils/logLevel.ts` | exact |
| `apps/frontend/src/lib/server/startup/requiredEnv.test.ts` (new) | test | transform | `apps/frontend/src/lib/utils/logLevel.test.ts` | exact |
| `apps/frontend/src/hooks.server.ts` (modified: `init` export) | hook | event-driven | the file itself (`handle`, `handleError` exports) | exact |
| `apps/frontend/svelte.config.js` (modified: `version.name`) | config | build-time | the file itself (`version:` block) | exact |
| `apps/frontend/svelte.config.test.ts` (modified: new cases) | test | build-time | the file itself (`kit.env.dir` cases) | exact |
| `apps/frontend/Dockerfile` (modified: `ARG`, exec-form `CMD`) | config | build-time | the file itself (`ARG NODE_ENV=production`) | exact |
| `render.example.yaml` (modified) | config | — | the file itself (`envVars:` entries) | exact |
| `docker-compose.dev.yml` (modified) | config | — | the file itself (`environment:` entries) | exact |
| `.env.example` (modified) | config | — | the file itself (the commented `E2E_PROJECT_ID` block) | exact |
| `infra/local/docker-compose.proxy.yml` (new) | config | — | `docker-compose.dev.yml` | role-match |
| `infra/local/nginx.conf` (new) | config | — | none | no analog |
| `infra/local/check-proxy-topology.sh` (new) | utility (check script) | request-response | `tests/scripts/visual-container.sh` | role-match |
| `apps/supabase/supabase/config.toml` (modified: `[functions.identity-callback]`) | config | — | the file itself (`[edge_runtime.secrets]`) | exact |
| `packages/dev-seed/tests/<templates>.test.ts` (new: three templates and the `config.toml` section) | test | file-I/O | `packages/dev-seed/tests/localSupabaseUrl.test.ts`, block `repository wiring drift gate` | exact |

### Migration model (slices E to J)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/assert-schema-migration-parity.mjs` (rewritten) | utility (guard) | file-I/O | the file itself, `scripts/assert-grant-permission-enum.mjs` (self-test over fixtures), `scripts/assert-env-pair-registry.mjs` (exports and entry-point test) | exact |
| `scripts/fixtures/schema-migration-freeze/**` (new) | test fixture | file-I/O | `scripts/fixtures/grant-permission-enum/` | role-match |
| `apps/supabase/supabase/migrations.manifest.json` (new) | config (data) | — | none | no analog |
| `packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts` (new) | test | file-I/O | `packages/dev-seed/tests/assertEnvPairRegistryGate.test.ts` (wiring) and `packages/dev-seed/tests/edgeFunctionEnvGate.test.ts` (calls a guard's export) | exact |
| `scripts/assert-comment-hygiene.mjs` (modified: frozen-files constant) | utility (guard) | file-I/O | the file itself (`VENDORED_EXCLUSIONS`) | role-match (see the warning under its assignment) |
| `.prettierignore` (modified) | config | — | the file itself (last entry and its comment) | exact |
| `.gitattributes` (new) | config | — | none | no analog |
| `package.json` (modified: `schema:regenerate`, new script keys) | config | — | the file itself (`assert:*`, `check:*` keys) | exact |
| `packages/dev-seed/tests/template/permittedKeys.test.ts` (modified) | test | file-I/O | the file itself (`SCHEMA_SQL`) | exact |
| `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts` (modified) | test | file-I/O | `permittedKeys.test.ts` (`SCHEMA_SQL`) | exact |
| `apps/supabase/supabase/schema/400-storage.sql` (modified: bucket rows, two comments) | migration | CRUD | `apps/supabase/supabase/schema/107-feedback.sql` (the in-schema `INSERT … ON CONFLICT DO NOTHING`) | exact |
| `apps/supabase/supabase/schema/107-feedback.sql`, `100-tenancy.sql` (modified: comments) | migration | — | the files themselves | exact |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` (regenerated before the freeze, never hand-edited) | migration | — | generated by `yarn schema:regenerate` | n/a |
| `apps/supabase/scripts/isolated-instance.sh` (new) | utility (harness) | batch | `tests/scripts/visual-container.sh` | role-match |
| `apps/supabase/scripts/check-schema-equivalence.sh` (new) | utility (check script) | batch | `tests/scripts/visual-container.sh` (statuses), `scripts/assert-schema-migration-parity.mjs` (census, floor) | partial |
| `infra/scripts/bootstrap.sql` (new) | migration (data bootstrap) | CRUD | `apps/supabase/supabase/seed.sql` | role-match |
| `infra/scripts/check-seed.sql` (new) | utility (check) | CRUD read | `apps/supabase/supabase/seed.sql` (the facts it looks for) | partial |
| `infra/scripts/check-drift.sh` (new) | utility (check script) | batch | `tests/scripts/visual-container.sh` | role-match |
| `apps/supabase/README.md`, `.claude/skills/database/SKILL.md`, the docs page `developers-guide/backend/intro/+page.md`, the header of `scripts/assert-grant-permission-enum.mjs` (modified: text that becomes false at the freeze) | docs | — | the files themselves | n/a |

## Pattern Assignments

### `apps/frontend/src/routes/api/health/+server.ts` (route, request-response)

**Analog:** `apps/frontend/src/routes/api/auth/logout/+server.ts` (17 lines, whole file)

**Imports and handler shape** (lines 1-3 and 14-17):
```typescript
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
```
```typescript
export async function POST({ locals }: RequestEvent): Promise<Response> {
  await locals.supabase.auth.signOut({ scope: 'local' });
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
```

**What to copy:** a named function export per HTTP verb (`export async function POST`, not a `const`), `json()` from `@sveltejs/kit`, an explicit `Promise<Response>` return type, and a TSDoc block above the handler that says what the endpoint does and what it returns.

**What not to copy:** `locals.supabase`. The health handler touches neither `locals.supabase` nor `getClientAddress()` (RESEARCH, Anti-Patterns). The body is `{ status, build }` with `build` taken from `version` of `$app/environment`.

**Why no hook change is needed.** `apps/frontend/src/hooks.server.ts`, in `appGateHandle`:
```typescript
  // Skip non-route and API requests.
  if (route?.id == null || isApiRoute(route.id)) {
    return resolve(event);
  }
```
and `apps/frontend/src/lib/routes/route.ts`:
```typescript
export function isApiRoute(routeId: string): boolean {
  return routeId === API_ROOT || routeId.startsWith(`${API_ROOT}/`);
}
```
`supabaseHandle` and `paraglideHandle` still run for `/api/health`.

---

### `apps/frontend/src/routes/api/health/server.test.ts` and `diagnostics/server.test.ts` (test, request-response)

**Analog:** `apps/frontend/src/routes/api/auth/logout/server.test.ts` (34 lines, whole file)

**File name.** The test beside a `+server.ts` is named `server.test.ts`, not `+server.test.ts` (also `apps/frontend/src/routes/api/auth/callback/server.test.ts`).

**Structure** (lines 1-2, 10-19, 28-33):
```typescript
import { describe, expect, it, vi } from 'vitest';
import { POST } from './+server';
```
```typescript
/** Build the `{ locals }` the endpoint receives, with a recording `signOut`. */
function eventWith() {
  const signOut = vi.fn(async () => ({ error: null }));
  return {
    signOut,
    event: {
      locals: { supabase: { auth: { signOut } } }
    } as unknown as Parameters<typeof POST>[0]
  };
}
```
```typescript
  it('answers 200 with a DataApiActionResult', async () => {
    const { event } = eventWith();
    const response = await POST(event);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, type: 'success' });
  });
```

**What to copy:** import the verb straight from `./+server`; build a minimal event with a helper and cast it through `as unknown as Parameters<typeof POST>[0]`; assert on `response.status` and `await response.json()`. For the diagnostics test the event helper supplies `request` (a `Request` with chosen headers), `url` and a `getClientAddress` stub, including one that throws.

**Test environment facts** (`apps/frontend/vitest.config.ts`, `alias` list):
```typescript
      // SvelteKit env modules stub
      {
        find: '$env/dynamic/public',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/env-dynamic-public.ts')
      },
      {
        find: '$app/environment',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/app-environment.ts')
      },
```
- `$app/environment` is stubbed, so `version` is `'test'` and `dev` is `true` in every frontend unit test.
- `$env/dynamic/public` has a stub. `$env/dynamic/private` has none, and no test under `apps/frontend/src` mocks it (`grep "vi.mock('$env/dynamic"` finds nothing). A diagnostics switch read from `$env/dynamic/private` therefore needs either a new alias entry in this list or a switch function that takes its environment as an argument. The second matches the next assignment.

---

### `apps/frontend/src/routes/api/diagnostics/+server.ts` (route, request-response)

**Analogs:** `apps/frontend/src/routes/api/feedback/+server.ts` for the refusal; `logout/+server.ts` for the answer.

**Refusal pattern** (`feedback/+server.ts`, lines 5 and 9-11):
```typescript
import { error } from '@sveltejs/kit';
```
```typescript
export async function POST({ request }) {
  const feedbackWriter = await feedbackWriterPromise;
  if (!feedbackWriter) error(500, 'No server feedback writer available');
```

**What to copy:** `error(status, message)` from `@sveltejs/kit` called as a statement (it throws; no `return`, no `throw`). The diagnostics handler calls `error(404)` when its switch is off, then answers with `json()` as the logout handler does.

**Nothing in the tree is an analog for `getClientAddress()`:** `grep -rn getClientAddress apps packages tests` finds no file. Use the shape in `181-RESEARCH.md`, "The diagnostics response".

---

### `apps/frontend/src/lib/server/startup/requiredEnv.ts` (utility, transform)

**Analog:** `apps/frontend/src/lib/utils/logLevel.ts` (57 lines, whole file)

This is the house shape for "a pure function over raw environment values, called once from the hooks module".

**Vocabulary as an exported constant** (line 6):
```typescript
export const EMITTABLE: ReadonlyArray<LogLevel> = ['debug', 'info', 'warn', 'error'];
```

**A named result type with a TSDoc line per field** (lines 11-16):
```typescript
export type LogLevelProblem = {
  /** `missing` when nothing was set, `invalid` when the value is not an emittable level. */
  reason: 'missing' | 'invalid';
  /** The normalised value, present only for `invalid`. */
  provided?: string;
};
```

**The function takes its inputs as arguments and never throws** (lines 36-40):
```typescript
export function resolveLogLevel(raw: string | undefined, dev: boolean, publicDebug: boolean): ResolvedLogLevel {
  const fallback: LogLevel = dev || publicDebug ? 'debug' : 'warn';

  // `typeof`, not a nullish check: the value comes from the process environment, and a non-string reaching `.trim()` would throw at module scope. A whitespace-only value counts as unset.
  if (typeof raw !== 'string' || raw.trim() === '') return { level: fallback, problem: { reason: 'missing' } };
```

**What to copy:**
- The empty-or-whitespace test `typeof raw !== 'string' || raw.trim() === ''` as the definition of "unset". This is required here: `apps/frontend/src/lib/utils/constants.ts` turns an unset value into `''` (`PUBLIC_PROJECT_ID: env.PUBLIC_PROJECT_ID ?? ''`).
- A full TSDoc block with `@param` and `@returns` on the exported function.
- The function returns data (the list of missing names); the caller decides what to do. `resolveLogLevel` "emits nothing", and the hooks module reports.
- Shape the required names as a list of rules, not four `if`s: phase 182 adds a rule to the same function (RESEARCH, Pattern 5).

**Test analog:** `apps/frontend/src/lib/utils/logLevel.test.ts`. Imports (lines 1-3):
```typescript
import { configureLogger } from '@openvaa/app-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveLogLevel } from './logLevel';
```
Cases to mirror (lines 21-27): one case for unset, one that an empty string is treated exactly as unset:
```typescript
  it('resolves an unset value to the `warn` fallback and reports a `missing` problem', () => {
    expect(resolveLogLevel(undefined, false, false)).toEqual({ level: 'warn', problem: { reason: 'missing' } });
  });

  it('treats an empty-string value exactly as unset', () => {
    expect(resolveLogLevel('', false, false)).toEqual({ level: 'warn', problem: { reason: 'missing' } });
  });
```
The file opens with one doc comment that states the function's specification in a sentence. Copy that.

---

### `apps/frontend/src/hooks.server.ts` (hook; add `init`)

**Analog:** the file itself.

**The file-level lint waiver that covers a `const` export** (line 1):
```typescript
/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
```

**Import conventions** (lines 2-12): value imports first in path order, then `import type` last:
```typescript
import { configureLogger, log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
...
import { constants } from '$lib/utils/constants';
import { resolveLogLevel } from '$lib/utils/logLevel';
import type { Handle, HandleServerError } from '@sveltejs/kit';
```
Add `ServerInit` to the existing `import type { Handle, HandleServerError } from '@sveltejs/kit';` line.

**Typed const exports** (lines 112-117):
```typescript
export const handle: Handle = sequence(supabaseHandle, paraglideHandle, appGateHandle);

export const handleError: HandleServerError = async ({ error }) => {
  console.error('Server error:', error);
  return { message: '500' };
};
```
`export const init: ServerInit = () => { … }` joins these two.

**The existing "resolve with a pure function at module scope, then act" call** (lines 16-21), which is the wiring style to follow:
```typescript
const { level: logLevel, problem: logLevelProblem } = resolveLogLevel(
  constants.PUBLIC_LOG_LEVEL,
  import.meta.env.DEV,
  constants.PUBLIC_DEBUG
);
configureLogger({ level: logLevel });
```

**Two cautions.**
- This file reads development mode as `import.meta.env.DEV` and does not import `$app/environment` today. The research sketch imports `building` and `dev` from `$app/environment`; `building` has no `import.meta.env` equivalent, so that import is new to the file.
- `apps/frontend/src/lib/routes/routeConsistency.test.ts` reads this file as text (`const HOOKS_FILE = path.resolve(HERE, '..', '..', 'hooks.server.ts');`) and extracts the session-gate handler's body by identifier. Adding an export does not change that body, but the test must be run after the edit.

---

### `apps/frontend/svelte.config.js` and `svelte.config.test.ts` (config and its test)

**Analog:** the files themselves.

**The block to extend** (`svelte.config.js`, lines 30-32):
```js
    version: {
      pollInterval: 5 * 60 * 1000
    }
```
Add `name: process.env.BUILD_SHA || undefined` (an empty string must become `undefined`; RESEARCH, Pitfall 5).

**Comment style in this file.** A setting whose reason is not obvious carries a prose comment directly above it, in full sentences, stating what goes wrong without it (see the long comment above `env: { dir: repoRoot }`, beginning "Point SvelteKit's env loader at the repo-root `.env`"). Write the `name` line's comment the same way, without history and without planning ids.

**Test pattern** (`svelte.config.test.ts`, lines 1-8 and 21-23):
```typescript
// @vitest-environment node

// Node environment for the same reason as `vite.projectIdEnv.test.ts`: this file touches the real filesystem and the SvelteKit config, neither of which wants the project-wide jsdom realm.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import config from './svelte.config.js';
```
```typescript
  it('is set at all (an absent value silently defaults to process.cwd())', () => {
    expect(config.kit?.env?.dir).toBeDefined();
  });
```
**Caution for the new cases.** The config is imported statically (`import config from './svelte.config.js';`), so `process.env.BUILD_SHA` is read once at import. Cases that need different values of the variable must set it and re-import the module (`vi.resetModules()` and a dynamic `import()`), in a new `describe` block beside `describe('svelte.config.js — kit.env.dir', …)`. `logLevel.test.ts` names the same technique in its comment on `HOOKS_CLIENT_MODULE` ("Resolved at call time so the case reads the module the entry point itself imports, rather than a snapshot taken before `vi.resetModules()`").

---

### `apps/frontend/Dockerfile` (config)

**Analog:** the file itself, production stage (lines 45-55):
```dockerfile
FROM frontend AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt

RUN yarn workspace @openvaa/frontend build

EXPOSE 3000
CMD node ./apps/frontend/build/index.js
```
**What to copy:** the `ARG NAME=default` then `ENV NAME=${NAME}` pair is the file's way to pass a build argument into the build. `BUILD_SHA` is declared in this stage, above `RUN yarn workspace @openvaa/frontend build`. The last line becomes the JSON-array form.

**Constraints.** The stage name must stay: `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` asserts `AS production`. The file has no trailing newline today. The development stage's `CMD yarn workspace @openvaa/frontend dev --host` is also shell form and is out of scope.

---

### `render.example.yaml`, `docker-compose.dev.yml`, `.env.example` (config)

**Analogs:** the files themselves.

**`render.example.yaml`, the three entry shapes in use** (lines 23-36):
```yaml
      - key: PUBLIC_SUPABASE_URL
        sync: false
      - key: PUBLIC_SUPABASE_ANON_KEY
        sync: false

      - key: PUBLIC_DEBUG
        value: 'false'
      - key: PUBLIC_LOG_LEVEL # debug | info | warn | error; anything else logs one error and falls back to warn
        value: 'warn'

      - key: PUBLIC_BROWSER_FRONTEND_URL # Check value after deployment
        value: https://<INSTANCE_NAME>-frontend.onrender.com
```
- A value the operator supplies in Render: `sync: false` (use for `PUBLIC_PROJECT_ID`).
- A fixed value: `value: '…'` with an inline `#` comment for its meaning.
- A value to check: the inline marker `# Check`, which the header names ("3. Check default values marked with # Check"). Use it for `ORIGIN` (`https://<INSTANCE_DOMAIN>`, a placeholder the header already defines) and for the address variables, whose comment says the depth is unmeasured on Render (A-12).

**`docker-compose.dev.yml`, the substitution shape** (lines 13-19):
```yaml
    environment:
      PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:-http://host.docker.internal:54321}
      PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY}
      PUBLIC_BROWSER_FRONTEND_URL: ${PUBLIC_BROWSER_FRONTEND_URL:-http://localhost:3000}
```
Every new variable takes the `${NAME:-default}` form (`${ORIGIN:-http://localhost:3000}`, `${XFF_DEPTH:-1}`); the bare `${NAME}` form passes an empty string when unset, which adapter-node refuses for `ORIGIN` (Pitfall 5). The `PUBLIC_SUPABASE_URL` line's shape is read by a test (see Shared Patterns, "Tests that read the templates") and must not change.

**`.env.example`, the commented-variable pattern** (the block above `# E2E_PROJECT_ID=…`):
```
# KEEP IT COMMENTED OUT. The dev-seed CLI loads this file through `process.loadEnvFile` and the
# Playwright config loads it through `dotenv.config()`, so a live line here would silently re-point
# `yarn db:seed:default` -- and therefore `yarn db:reset-with-data` -- at the E2E project, leaving a
# plain local dev session showing an empty app.
# E2E_PROJECT_ID=00000000-0000-0000-0000-0000000000e2
```
**What to copy:** the proxy variables are listed as commented lines, with a comment that says what a live line would do (CI copies this file to `.env`, and Compose reads `.env`; Pitfall 8). Sections of the file are separated by a rule of `#` characters and a title line (for example `# Database-side deployment settings (not environment variables)`). Put the proxy variables in a section of their own, outside the cross-runtime pair block, which two guards parse.

---

### `infra/local/docker-compose.proxy.yml` (config)

**Analog:** `docker-compose.dev.yml` (19 lines, whole file)

**Header and service shape** (lines 1-12):
```yaml
# Production build test compose
# Purpose: verify the frontend production Dockerfile builds and runs correctly
# Usage: docker compose -f docker-compose.dev.yml up --build
# Prerequisites: supabase start (for backend services)
services:
  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
      target: production
    ports:
      - "3000:3000"
```
**What to copy:** the four-line header (what it is, purpose, usage, prerequisites) and the `build:` block with `target: production`. From `infra/local/` the `context` is the repository root (`../..`), and `dockerfile` stays relative to that context. Add `args: BUILD_SHA`. Prettier skips the file already: `.prettierignore` holds `**/docker-compose.*`.

`infra/local/nginx.conf` has no analog in the tree; use the block in `181-RESEARCH.md`, "The local proxy".

---

### `infra/local/check-proxy-topology.sh`, `infra/scripts/check-drift.sh`, `apps/supabase/scripts/isolated-instance.sh`, `apps/supabase/scripts/check-schema-equivalence.sh` (check and harness scripts)

**Analog:** `tests/scripts/visual-container.sh` (550 lines; header and preamble read, lines 1-110). It is the house model for "a shell script that drives Docker and whose exit status is the verdict". `tests/scripts/ci-write-local-keys.sh` (38 lines) is the short form of the same conventions.

**Header: name, one-line purpose, usage, prerequisites it asserts, and an exit-code table** (lines 1-4 and 48-58):
```bash
#!/usr/bin/env bash
#
# visual-container.sh -- Perform exactly ONE in-container visual run and leave behind a
#                        complete, machine-readable evidence directory.
```
```bash
# Exit codes -- the caller must be able to branch on the status alone:
#   0:  Playwright reported success
#   1:  Playwright reported failures
#   2:  usage error
#   3:  docker is unavailable (the daemon did not answer)
#   4:  the pinned image digest is NOT present locally; this script REFUSES to pull
```
Each new script states its own table. The research fixes the meanings: 0 clean, 1 a finding, 2 could not run (Pattern 4; Q1 step 4; Q5).

**Preamble** (lines 62-67):
```bash
set -euo pipefail

# Auto-detect paths from the script's location, so the script behaves identically from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/.." && pwd)"
```

**Image pinned by digest, with the reason** (lines 72-76):
```bash
# Pinned BY DIGEST, never by tag. Two reasons, both load-bearing:
#   (a) A tag reference can resolve to a different image later, and comparing one run with another rests on "same image, same digest".
...
PW_IMAGE="${PW_IMAGE:-mcr.microsoft.com/playwright@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27}"
```
Use this for the nginx image in the topology check (the research asks for tag and digest).

**Usage printed from the header, and named failure helpers** (lines 89-108):
```bash
usage() {
  # Delimit the header block rather than hardcoding a line range: a `sed -n '2,Np'` form truncates the exit-code table the header tells the caller to branch on, and drifts further every time the header grows.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}
```
```bash
require_value() {
  if [ "$2" -lt 2 ]; then
    echo "visual-container.sh: $1 requires a value" >&2
    usage >&2
    exit 2
  fi
}

fatal() {
  echo "visual-container.sh: FATAL -- $1" >&2
  exit "$2"
}
```
`fatal "<message>" <code>` gives every non-zero exit a message and a code from the table.

**A required environment variable, checked by the shell** (`ci-write-local-keys.sh`, line 19):
```bash
: "${GITHUB_ENV:?ci-write-local-keys.sh runs only on GitHub Actions, which sets GITHUB_ENV}"
```
**A value that must not be echoed** (same file, header): "Each value is masked before use and never echoed; `set -x` must not be added." Copy the rule into every script that handles the service-role key or a database password.

**What the analog also shows and the new scripts must keep:** an interrupt is never reported as success (`trap 'INTERRUPTED=1' INT TERM`, and exit `130`); a control that must fail runs before the thing it licenses ("A green suite behind an unproven block proves nothing, so the control runs BEFORE Playwright, not after."). The topology check's negative controls and the equivalence check's planted differences follow that order.

**What the analog does not give.** No tracked script starts a second Supabase CLI instance or uses `supabase --workdir`. The isolated-instance harness has no analog for that part; build it from RESEARCH Pattern 2 after the spike of Open Question 5. `config.toml` holds the values the harness must change: `project_id = "openvaa-local"`, and the ports under `[api]` (`port = 54321`), `[db]` (`port = 54322`, `shadow_port = 54320`), `[db.pooler]` (`port = 54329`) and the rest; and `[db.seed]` with `sql_paths = ["./seed.sql"]`.

**A Node alternative for a script that queries the database.** `apps/supabase/scripts/lint-schema.mjs` is the one tracked script that connects to Postgres from a script. Its header (lines 15-19) shows the usage and exit-code block, and line 28 its connection default:
```js
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
```
It is wired through `apps/supabase/package.json` (`"lint:schema": "node scripts/lint-schema.mjs"`, `"lint:all": "yarn lint:sql && yarn lint:schema"`) and the root key `"db:lint:sql": "yarn workspace @openvaa/supabase lint:all"`. Copy the wiring pattern for the equivalence check's script key. Do not copy a connection URL constant into any script that could run against a hosted database: the connection comes from the libpq `PG*` variables (D-09; RESEARCH Q4).

---

### `apps/supabase/supabase/config.toml` (config; add `[functions.identity-callback]`)

**Analog:** the file itself, the `[edge_runtime.secrets]` block (lines 416-419):
```toml
[edge_runtime.secrets]
# The entry names an environment variable and carries no value, so nothing secret enters git.
# identity-callback requires this variable and refuses to run without it.
PUBLIC_PROJECT_ID = "env(PUBLIC_PROJECT_ID)"
```
**What to copy:** a section is followed by `#` comment lines that state what the setting does and why, then the key. The new section goes beside this one, since both concern `identity-callback`. No `[functions.*]` section exists today (`grep -n "^\[functions"` finds nothing). The `[storage.buckets.*]` blocks (lines 126-135) are kept (D-07):
```toml
# Entity images, project-level public files (photos, videos, PDFs)
# Path convention: {project_id}/{entity_type}/{entity_id}/filename.ext
[storage.buckets.public-assets]
public = true
file_size_limit = "500MiB"

# Private files accessible only by authenticated users with appropriate roles
[storage.buckets.private-assets]
public = false
file_size_limit = "500MiB"
```

---

### `packages/dev-seed/tests/<templates>.test.ts` (test, file-I/O)

**Analog:** `packages/dev-seed/tests/localSupabaseUrl.test.ts`, the block `describe('repository wiring drift gate', …)`.

**Reading repository files and capturing by pattern**:
```typescript
describe('repository wiring drift gate', () => {
  function read(path: string): string {
    return readFileSync(resolve(REPO_ROOT, path), 'utf8');
  }
  function capture(text: string, pattern: RegExp): Array<string> {
    return [...text.matchAll(pattern)].map((m) => m[1]);
  }

  const apiSection = read('apps/supabase/supabase/config.toml')
    .split(/^\[/m)
    .find((section) => section.startsWith('api]'));
```

**Non-vacuity first, then the property**:
```typescript
  it.each(Object.keys(sources))('%s yields at least one URL', (source) => {
    expect(sources[source].length).toBeGreaterThan(0);
  });
```

**What to copy:**
- `read()` and `capture()` as local helpers; `Array<string>`, not `string[]`.
- The way one `config.toml` section is isolated: split on `/^\[/m` and find the section by its name. For the new spec: `.find((section) => section.startsWith('functions.identity-callback]'))`, then a pattern for `verify_jwt`.
- A table of sources keyed by a readable label, driven through `it.each`, with a "yields at least one" case before the real assertion so an empty match cannot pass.
- The spec is written first and seen failing on the unchanged tree (`render.example.yaml` and `docker-compose.dev.yml` do not name `PUBLIC_PROJECT_ID` today), then the templates are edited.

---

### `scripts/assert-schema-migration-parity.mjs` (guard; rewritten to frozen mode)

**Analogs:** the file itself for the census, the floor and the failure messages; `scripts/assert-grant-permission-enum.mjs` for the self-test over committed fixtures; `scripts/assert-env-pair-registry.mjs` for exports and the entry-point test.

**Imports: Node built-ins only** (parity guard, lines 105-110):
```js
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
```
Keep resolving from `REPO_ROOT`. The header says why the family uses no package: "Node built-ins only, no build step". Add `createHash` from `node:crypto`.

**The constants that become the default arguments** (lines 112-120):
```js
const SCHEMA_DIR = 'apps/supabase/supabase/schema';
const MIGRATIONS_DIR = 'apps/supabase/supabase/migrations';
const MIGRATION_FILE = `${MIGRATIONS_DIR}/00001_initial_schema.sql`;

const WRITE = process.argv.slice(2).includes('--write');

/** Non-vacuity floor. Absolute thresholds; raise them as the schema grows. */
const MIN_SCHEMA_FILES = 20;
const MIN_SCHEMA_LINES = 3000;
```

**The failure helper and message prefix** (lines 122-125):
```js
function fail(message) {
  console.error(`Schema-migration parity guard: ${message}`);
  process.exit(1);
}
```

**The floor on the baseline, to keep** (lines 258-263):
```js
  if (!/^CREATE TABLE public\./m.test(migrationText)) {
    fail(
      `precondition failed: ${MIGRATION_FILE} contains no line beginning \`CREATE TABLE public.\`. It is ` +
        `empty, truncated, or not the initial schema — comparing against it proves nothing.`
    );
  }
```

**The census, printed on green and inside every red message** (lines 265-268 and 310):
```js
  const census =
    `census: ${schemaNames.length} schema file(s) -> ${schemaLineCount} line(s); ` +
    `${path.basename(MIGRATION_FILE)} -> ${migrationLineCount} line(s); ` +
    `${MIGRATIONS_DIR} holds ${migrationNames.length} .sql file(s)`;
```
```js
  console.log(`Schema-migration parity guard (phase 156: REVIEW-DB-07) — ${census}; generated copy is current.`);
```

**The red message shape: a capitalised finding name, the offending files, then what to do** (lines 270-282):
```js
  if (migrationNames.length !== 1) {
    console.error(
      `Schema-migration parity guard — ${census}.\n\n` +
        `SECOND MIGRATION FILE: ${MIGRATIONS_DIR} holds ${migrationNames.length} .sql file(s) where the\n` +
        `invariant allows exactly one:\n` +
        migrationNames.map((n) => `  ${n}`).join('\n') +
```
This is the conjunct the freeze reverses (a second file becomes legal when it has a manifest line). The `--write` branch (`if (WRITE) { writeFileSync(migrationPath, schemaText); …`) is what becomes a refusal that names the next step.

**The docblock's sections, to keep as sections in the rewrite:** "THE INVARIANT", "WHAT THIS CHECK CANNOT DO, stated so nobody over-reads a green run", "THE GUARD GUARDS ITSELF", "Usage", "Exit codes". The rewrite states the frozen-mode invariant under the same headings. The header of the current file tells the history of the byte-parity model; that text becomes false at the freeze and is replaced, not appended to.

**The gap in the analog that the rewrite must close.** The file ends:
```js
main();
```
with no export and no entry-point test, so importing it from a spec would run the guard and may call `process.exit`. Replace it with the form `scripts/assert-env-pair-registry.mjs` ends on (last line of that file):
```js
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
```
and export the checker as that file exports its parts (`export const DENO_ROOT = …`, `export function enumerateFiles(rootRel, extensions) {`, `export function derivePairs() {`). That file also sets the status with `process.exitCode = violations > 0 ? 1 : 0;` and returns, where the parity guard calls `process.exit(1)`. An exported function must return findings and never exit, so the spec can call it.

**The self-test over fixtures, from `scripts/assert-grant-permission-enum.mjs`.**

Fixture paths as constants (lines 77-80):
```js
const FIXTURE_DIR = 'scripts/fixtures/grant-permission-enum';
const CLEAN_FIXTURE = `${FIXTURE_DIR}/enums.ok.sql`;
const VIOLATION_FIXTURE = `${FIXTURE_DIR}/enums.violations.sql`;
const EXPECTED_VIOLATIONS = `${FIXTURE_DIR}/expected.violations`;
```
Note that this guard's paths are relative to the working directory, while the parity guard resolves from `REPO_ROOT`. Keep `REPO_ROOT`.

The self-test runs the same routine as the real verdict and returns a result (lines 252-262):
```js
function selfTest() {
  const cleanSrc = readOrNull(CLEAN_FIXTURE);
  const violationSrc = readOrNull(VIOLATION_FIXTURE);
  const expectedRaw = readOrNull(EXPECTED_VIOLATIONS);
  if (cleanSrc === null || violationSrc === null || expectedRaw === null) {
    return { passed: false, summary: 'self-test could not read its fixtures, so it proved nothing' };
  }

  const expected = expectedRaw.split('\n').filter((line) => line.trim() !== '');
  const cleanFindings = auditSqlSource(cleanSrc, FIXTURE_LABEL);
  const violationFindings = auditSqlSource(violationSrc, FIXTURE_LABEL);
```

Both legs are checked, and an empty expectation is itself a failure (lines 269-291):
```js
  if (cleanFindings.length !== 0) {
    passed = false;
    console.error(
      `[ERROR] ${SELF}: the clean fixture produced ${cleanFindings.length} finding(s) and must produce none:`
    );
    for (const finding of cleanFindings) console.error(`          ${finding}`);
  }
  if (expected.length === 0) {
    passed = false;
    console.error(
      `[ERROR] ${SELF}: '${EXPECTED_VIOLATIONS}' is empty, so the seeded fixture would be compared against nothing.`
    );
  }
  if (!sortedEqual(violationFindings, expected)) {
    passed = false;
    console.error(`[ERROR] ${SELF}: the seeded fixture did not produce the committed expected findings.`);
    for (const finding of violationFindings) {
      if (!expected.includes(finding)) console.error(`          produced but not expected: ${finding}`);
    }
```

The self-test runs in the same invocation as the real check and withholds the verdict (lines 377-387):
```js
  // --- The self-test, in this same invocation ---------------------------------
  const { passed: selfTestPassed, summary: selfTestSummary } = selfTest();
  if (!selfTestPassed) {
    console.error(
      `[ERROR] ${SELF}: the self-test did not match its committed expectations (printed above). The result over ` +
        'the real channels says nothing until this passes, so the verdict is withheld.'
    );
  }

  console.log(`Grant enum membership guard — ${findings.length} finding(s); ${selfTestSummary}.`);
  process.exitCode = findings.length > 0 || !selfTestPassed ? 1 : 0;
```

A `--self-test` flag runs the self-test alone (lines 297-304):
```js
  const selfTestOnly = process.argv.includes('--self-test');

  if (selfTestOnly) {
    const { passed, summary } = selfTest();
    console.log(`Grant enum membership guard — ${summary}.`);
    process.exitCode = passed ? 0 : 1;
    return;
  }
```

**What to copy:** findings as plain strings that name the file and the fact; fixture findings compared with a committed expected list as sets (`sortedEqual`); "produced but not expected" and "expected but not produced" reported separately; the summary line carries the self-test's own counts. `lint:check` calls the script with no argument, so no argument can point the real gate at a fixture (RESEARCH Q2).

**Mode switch.** Do not switch the guard's mode on the manifest's presence (RESEARCH, Pattern 1 and Anti-Patterns). Until the freeze commit `main()` runs today's byte parity; the frozen checker and its fixtures exist beside it and are exercised by the self-test and the spec.

---

### `scripts/fixtures/schema-migration-freeze/**` (test fixtures)

**Analog:** `scripts/fixtures/grant-permission-enum/`, which holds `enums.ok.sql`, `enums.violations.sql` and `expected.violations`.

**The expected-findings file is one finding per line, the guard's exact message text** (`expected.violations`, first lines):
```
grant_role_type: in the schema declaration, absent from the canon: owner
grant_permission: in the canon, absent from the schema declaration: entity.confirm
grant_permission: in the canon, absent from the schema declaration: nomination.create_parent
grant_permission: in the schema declaration, absent from the canon: entity.confrim
```
**What to copy:** one clean fixture that must produce no finding, seeded fixtures that must produce exactly the committed findings, and a `.violations` text file per seeded case. The freeze guard needs a directory per case (a migrations directory and a manifest each): `ok` plus one each for edited file, unlisted file, missing file, duplicate version, non-increasing version and bad name (RESEARCH, "New Guards and Checks"). A second naming style exists for single-file fixtures (`scripts/fixtures/assert-comment-hygiene.input.sql` beside `assert-comment-hygiene.expected.sql.violations`); the directory style fits better here.

**Already protected.** `.prettierignore` holds `scripts/fixtures/`, with the reason that reformatting a fixture "reddens `--self-test` on a change nobody made to the guard". Fixture hashes therefore do not move under `yarn format`. `scripts/` is outside `assert-comment-hygiene.mjs`'s `SCAN_ROOTS`.

---

### `packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts` (test)

**Analogs:** `packages/dev-seed/tests/assertEnvPairRegistryGate.test.ts` (59 lines, whole file) for wiring; `packages/dev-seed/tests/edgeFunctionEnvGate.test.ts` for calling a guard's export.

**Imports and the repository root** (`assertEnvPairRegistryGate.test.ts`, lines 19-30):
```typescript
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
```

**The three wiring assertions** (lines 33-48):
```typescript
  it('keeps `yarn assert:env-pair-registry` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:env-pair-registry');
  });

  it('points the registered script at the guard it claims to run', () => {
    expect(ROOT_PACKAGE_JSON.scripts['assert:env-pair-registry']).toBe('node scripts/assert-env-pair-registry.mjs');
  });

  it('keeps the guard file itself present and recognisable', () => {
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-env-pair-registry.mjs'), 'utf8')).toContain(
      'CROSS-RUNTIME ENV-PAIR REGISTRY GUARD'
    );
  });
```
The third assertion looks for a capitalised title in the guard's docblock. The rewritten guard needs such a title (today: `SCHEMA-MIGRATION PARITY GUARD`).

**A rule the analog states for itself, to obey:** "The invariant asserted here is MEMBERSHIP of the `&&` chain, never terminal position, never the whole string, never the link count."

**Asserting that a check is deliberately outside `lint:check`** (lines 50-58), the pattern for the equivalence, drift and seed checks, which need a database:
```typescript
    expect(ROOT_PACKAGE_JSON.scripts['check:env-pairs-agree']).toBe('node scripts/assert-env-pairs-agree.mjs');
    expect(ROOT_PACKAGE_JSON.scripts['lint:check']).not.toContain('env-pairs-agree');
```
with the naming reason in its comment: "Its script key is deliberately `check:env-pairs-agree` rather than `assert:*`, because every existing `assert:*` key IS a chain link". Root script keys for the new on-demand checks take `check:*` (or a workspace key, as `db:lint:sql` does), never `assert:*`.

**Calling the exported checker** (`edgeFunctionEnvGate.test.ts`):
```typescript
import { fileURLToPath, pathToFileURL } from 'node:url';
```
```typescript
interface EdgeFunctionEnvGuard {
  TS_FAMILY: CommentFamily;
  blankComments: (text: string, family: CommentFamily) => string;
}
```
```typescript
const GUARD_PATH = resolve(REPO_ROOT, 'scripts/assert-edge-function-env.mjs');

function loadGuard(): Promise<EdgeFunctionEnvGuard> {
  return import(pathToFileURL(GUARD_PATH).href) as Promise<EdgeFunctionEnvGuard>;
}
```
**What to copy:** declare a local interface for the guard's exports, load the `.mjs` by a dynamic `import()` of its file URL, and call the export in each case. For the freeze spec the interface is `checkFrozenMigrations(args: { migrationsDir: string; manifestPath: string }): Array<string>`, called over each fixture directory. Where a spec must run the script as a process, `packages/dev-seed/tests/projectScopingGate.test.ts` uses `spawnSync(process.execPath, [resolve(REPO_ROOT, GUARD_PATH)], { cwd: REPO_ROOT, encoding: 'utf8' })` and reads `result.status` directly.

**Why the spec lives in `packages/dev-seed/tests/`** (the analog's own docblock): "`yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests."

---

### `scripts/assert-comment-hygiene.mjs` (guard; add the frozen-files constant)

**Analog:** the file itself, `VENDORED_EXCLUSIONS`.

**The named-exclusion constant and its docblock** (lines 219-225):
```js
const VENDORED_EXCLUSIONS = new Map([
  [
    'apps/frontend/static/fonts/inter.css',
    'a verbatim OFL-licensed @fontsource/inter@5.3.0 distribution header (3 rule-2 junctions)'
  ],
  ['apps/docs/src/lib/layouts/prism-vs.css', 'an upstream author credit for the VS Prism theme (2 rule-2 junctions)']
]);
```
Its docblock states the rule a new constant must also meet: "A NAMED CONSTANT … there is no flag, no ignore file, no per-path roster and no warn-only tier. Excusing a file means editing this list, which is then reviewed as the decision it is. Each entry carries the reason it is here" and "The exclusion is REPORTED in this guard's summary line, never silent".

**Fail closed when an exclusion matches nothing** (lines 819-826):
```js
  for (const [rel, reason] of VENDORED_EXCLUSIONS) {
    if (candidates.includes(rel)) continue;
    violate(
      `the vendored exclusion '${rel}' (${reason}) matches no tracked, scannable file under ` +
        `${SCAN_ROOTS.join(', ')}. An exclusion that excuses nothing is a hole nobody can see — ` +
        'delete the entry or correct the path.'
    );
  }

  const files = candidates.filter((f) => !VENDORED_EXCLUSIONS.has(f));
```

**Reported in the summary line** (lines 910-916):
```js
  console.log(
    `Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: ${scanned}; ` +
      `vendored files excluded by name: ${VENDORED_EXCLUSIONS.size} ` +
      `(${[...VENDORED_EXCLUSIONS.keys()].join(', ')}); ` +
```

**Warning: the analog matches exact file paths, and the need is a directory prefix.** `VENDORED_EXCLUSIONS` is a `Map` keyed by one file, tested with `candidates.includes(rel)` and `VENDORED_EXCLUSIONS.has(f)`. The frozen files are every file under `apps/supabase/supabase/migrations/`, a set that grows. Adding an entry per migration to this map would require a guard edit for every appended migration. Add a separate named constant for the exact prefix, with its own three pieces copied from above: the filter (`f.startsWith(prefix)`), the fail-closed check (the prefix matches at least one candidate), and a clause in the summary line. Do not add `migrations` to `SKIP_PATH_RE` (line 200), which matches a path segment anywhere:
```js
const SKIP_PATH_RE =
  /(^|\/)(node_modules|\.svelte-kit|\.turbo|\.yarn|\.git|dist|build|coverage|playwright-report|playwright-results[\w-]*|test-results|e2e-runs|paraglide|project\.inlang|snippets)\//;
```
The guard has its own fixtures and self-test (`scripts/fixtures/assert-comment-hygiene.*`); run it after the edit.

---

### `.prettierignore` (config)

**Analog:** the file itself, the last entry and the comment above it (lines 72-82):
```
# --- Phase 162 (162-02b): the generated migration ---
# `apps/supabase/supabase/migrations/00001_initial_schema.sql` is GENERATED by
# `yarn schema:regenerate` to be byte-identical to `cat apps/supabase/supabase/schema/*.sql` in
...
apps/supabase/supabase/migrations/00001_initial_schema.sql
```
**What to copy:** every entry in the lower half of this file has a comment block above it that gives the measured reason. Replace the one line with the directory `apps/supabase/supabase/migrations/` and rewrite the comment, which describes the generated-file model. Add the psql files (`infra/scripts/bootstrap.sql`, `infra/scripts/check-seed.sql`) with their reason. The reason is already recorded in this file for another set of files, and can be cited:
```
# 163-RESEARCH section P5.5 measured 12 of 12 pgbench scripts failing to parse on 2026-08-28 — their
# psql meta-commands are not SQL — and called that exclusion forced rather than discretionary,
# because a prettier ERROR exits 2, reddens `format:check` permanently, and cannot be repaired by
# `yarn format`.
```
Already covered and needing no entry: `**/docker-compose.*` (the proxy compose file), `scripts/fixtures/`, `.planning/`.

---

### `package.json` (config; scripts)

**Analog:** the file itself.
```json
    "schema:regenerate": "node scripts/assert-schema-migration-parity.mjs --write",
```
```json
    "assert:schema-migration-parity": "node scripts/assert-schema-migration-parity.mjs",
```
```json
    "check:env-pairs-agree": "node scripts/assert-env-pairs-agree.mjs",
```
The guard is already a link of `lint:check` (`… && yarn assert:env-pair-registry && yarn assert:schema-migration-parity && yarn assert:adapter-casts && …`). Keep the key and the link; the refusal is implemented inside the script's `--write` branch, so `schema:regenerate` keeps its key and now exits non-zero with the instruction (RESEARCH Q2: "make it refuse, do not remove it"). `package.json` is in `.prettierignore`.

---

### `packages/dev-seed/tests/template/permittedKeys.test.ts` and `cli/allowedTeardownTables.test.ts` (tests; re-point at `schema/`)

**Analog:** `permittedKeys.test.ts` already holds the target constant beside the one to remove:
```typescript
/**
 * The declarative schema copy of `_bulk_upsert_record`. Note the doubled `supabase/` segment — `apps/supabase/supabase/schema/…` is the real path.
 */
const SCHEMA_SQL = resolve(REPO_ROOT, 'apps/supabase/supabase/schema/501-bulk-operations.sql');
/** The applied migration copy of the same function. */
const MIGRATION_SQL = resolve(REPO_ROOT, 'apps/supabase/supabase/migrations/00001_initial_schema.sql');
```
`allowedTeardownTables.test.ts` reads the baseline through:
```typescript
const SCHEMA_MIGRATION_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  'apps/supabase/supabase/migrations/00001_initial_schema.sql'
);
```
and names the file in its thrown message (`'declaration in 00001_initial_schema.sql — the bulk_delete function shape changed; update the '`) and in its docblock ("which is a checkable fact against the migration SQL").

**What to change:** point both at `apps/supabase/supabase/schema/501-bulk-operations.sql`; in `permittedKeys.test.ts` drop the schema-against-migration byte comparison (the equivalence check takes that job; Pitfall 6); update the message and docblock text that names the migration. Keep the non-vacuity assertions (`expect(allowedCollections.length).toBeGreaterThan(0);`) and the throw on a missing declaration. The plan must confirm at run time that `bulk_delete` and `_bulk_upsert_record` are both defined in `501-bulk-operations.sql`.

---

### `apps/supabase/supabase/schema/400-storage.sql` (migration; bucket rows and comments)

**Analog for a data row inside a schema file:** `apps/supabase/supabase/schema/107-feedback.sql`:
```sql
INSERT INTO
  private.deployment_settings
DEFAULT VALUES
ON CONFLICT DO NOTHING;
```
**Formatting to copy.** `schema/*.sql` is under prettier (`prettier-plugin-sql`, `language: 'postgresql'`): keywords upper-case, `INSERT INTO` on its own line, the target on the next, `VALUES` on its own line, each tuple on its own lines. `seed.sql` shows the multi-row form:
```sql
INSERT INTO
  storage_config (key, value)
VALUES
  ('supabase_url', 'http://kong:8000'),
  (
    'service_role_key',
    '…'
  )
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value;
```
Run `yarn format` on the schema file after the edit, then `yarn schema:regenerate` (still working before the freeze), and commit both together.

**Section style in this file.** Each part opens with a rule of dashes, a title line and a prose paragraph (`-- storage_config: configuration table for storage cleanup triggers`). The file header lists what the file provides under `-- Provides:`; add the two bucket rows there. Schema-qualify the target (`storage.buckets`), as the file does for `public.storage_config`.

**The comments to correct (D-08), quoted from the tree:**
- `400-storage.sql`: "seed.sql sets local dev defaults; in production, set the project's actual Supabase URL and service role key."
- `400-storage.sql`, last line: "-- Note: the cleanup triggers need supabase_url and service_role_key in storage_config. seed.sql sets the local dev values; in production, set the actual values."
- `107-feedback.sql`: "so a hosted deployment sets it once in the SQL editor with `UPDATE private.deployment_settings SET behind_cloudflare = true;`" and "The local stack sets it in seed.sql." and "Only the owner reads or writes it: the SECURITY DEFINER trigger, the seed and an operator."
- `100-tenancy.sql`: "seed.sql and SupabaseAdminClient.ensureProject set it to true."

Run the research's search again at run time before editing; the v2.16 merge moves these lines.

---

### `infra/scripts/bootstrap.sql` (data bootstrap, CRUD)

**Analog:** `apps/supabase/supabase/seed.sql`, lines 11-79. It writes the same six rows to the same tables with the same conflict targets.

**The four statement shapes to copy** (table, columns, conflict target):
```sql
INSERT INTO
  private.deployment_settings (singleton, behind_cloudflare)
VALUES
  (true, true)
ON CONFLICT (singleton) DO UPDATE
SET
  behind_cloudflare = EXCLUDED.behind_cloudflare;
```
```sql
INSERT INTO
  accounts (id, name)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Default Account'
  )
ON CONFLICT (id) DO NOTHING;
```
```sql
INSERT INTO
  projects (
    id,
    account_id,
    name,
    default_locale,
    open_for_voters
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Default Project',
    'en',
    true
  )
ON CONFLICT (id) DO NOTHING;
```
```sql
INSERT INTO
  app_settings (project_id, settings)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '{}'::jsonb
  )
ON CONFLICT (project_id) DO NOTHING;
```
plus the `storage_config (key, value)` statement quoted in the previous assignment (`ON CONFLICT (key) DO UPDATE`).

**What differs from the analog, on purpose:**
- `seed.sql` uses unqualified names (`accounts`, `projects`) and runs "as service_role" by its own header. The bootstrap runs as `postgres` over a direct connection and schema-qualifies every table (`public.accounts`).
- `seed.sql` holds literal values, among them the demo service-role key. The bootstrap holds no value: each comes from the environment by `\getenv`, and the key goes by `\bind` (RESEARCH, "The bootstrap's shape").
- `seed.sql` writes `open_for_voters` as `true`. The bootstrap takes it from the environment and defaults to `false` (A-09).
- `seed.sql` writes `behind_cloudflare` as `true` and warns in its own comment: "Never apply this seed to a deployment that is not behind Cloudflare". The bootstrap takes the value from the environment.
- The psql meta-commands make the file unparseable by prettier; it goes in `.prettierignore`, and its formatting is by hand in the style above.
- `infra/` is outside `assert-comment-hygiene.mjs`'s `SCAN_ROOTS` (`['apps', 'packages', 'tests']`), but the review checklist's comment rules still apply: no decision ids, no history.

### `infra/scripts/check-seed.sql` (check)

**Analog:** partial. `seed.sql` supplies the facts the check looks for: the storage URL `('supabase_url', 'http://kong:8000')`, and the seed users in the section headed "Test auth users for local development Uses fixed UUIDs for idempotent seeding." (line 82 onward; the plan reads that section for the exact addresses and ids at run time). No tracked SQL file raises an exception to set psql's status; use RESEARCH Q5 ("Write the check as one SQL file that raises an exception listing every finding") and Pattern 4.

---

### Docs and text that becomes false at the freeze

No pattern to copy. The plan must edit, in or beside the freeze commit: the header of `scripts/assert-schema-migration-parity.mjs`; the `.prettierignore` comment quoted above; `apps/supabase/README.md`; `.claude/skills/database/SKILL.md`; the docs page `developers-guide/backend/intro/+page.md`; and the header of `scripts/assert-grant-permission-enum.mjs`, which says (lines 31-32): "A declaration that was edited but never regenerated into `migrations/00001_initial_schema.sql`, or regenerated but never applied".

## Shared Patterns

### Guard scripts under `scripts/` (the `assert:*` family)
**Sources:** `scripts/assert-schema-migration-parity.mjs`, `scripts/assert-grant-permission-enum.mjs`, `scripts/assert-env-pair-registry.mjs`
**Apply to:** the rewritten parity guard, the `assert-comment-hygiene.mjs` edit, and any Node check script
- Shebang `#!/usr/bin/env node`, then a blank line, then one docblock that opens with a capitalised title and holds "Usage:" and "Exit codes:" blocks.
- Node built-ins only, imported with the `node:` prefix. No package, no build step.
- A `SELF` or title prefix on every message; errors to `console.error`, the census and verdict to `console.log`.
- Three self-defences on every run: a census printed before the verdict, a non-vacuity floor that fails with a named precondition, and a self-test whose failure withholds the verdict.
- A script that a spec imports exports its parts and guards `main()` with `if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();`.
- A guard is a link of `lint:check` and has a `*Gate.test.ts` in `packages/dev-seed/tests/` that asserts the link by membership.

### A check's exit status is its verdict
**Source:** `tests/scripts/visual-container.sh`, header: "Exit codes -- the caller must be able to branch on the status alone"
**Apply to:** the topology check, the equivalence check, the drift check, the seed check, the isolated-instance harness
- An exit-code table in the header; every non-zero exit goes through a helper that prints a message and takes a code from the table.
- Three outcomes with three statuses: clean, a finding, could not run.
- Tool output is written to a file and the file is tested. A status is never read through a pipe (project rule; `supabase db diff` exits 0 with or without a difference).
- An interrupt is not a green.

### Seen failing before it counts
**Sources:** `scripts/assert-grant-permission-enum.mjs` ("a guard that has never been seen to fire has not been shown to guard anything"); `tests/scripts/visual-container.sh` ("A green suite behind an unproven block proves nothing, so the control runs BEFORE Playwright, not after."); `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts` ("Throws rather than returning empty when the declaration is not found: a silent `[]` would make every comparison below pass vacuously")
**Apply to:** every guard, check, spec and probe of this phase
Each has a planned red control: a seeded fixture for a guard, a spec run on the unchanged tree, a planted difference for a database check. A parser that finds nothing throws or fails a floor; it does not return empty.

### Tests that read the templates this phase edits
**Source:** `packages/dev-seed/tests/localSupabaseUrl.test.ts`, block `repository wiring drift gate`
**Apply to:** the edits of `docker-compose.dev.yml`, `.env.example`, `config.toml`
```typescript
    '.env.example': capture(read('.env.example'), /^(?:PUBLIC_)?SUPABASE_URL=(\S+)$/gm),
```
```typescript
    'docker-compose.dev.yml': capture(
      read('docker-compose.dev.yml'),
      /PUBLIC_SUPABASE_URL:\s*\$\{PUBLIC_SUPABASE_URL:-([^}]+)\}/g
    ),
```
```typescript
    'seed.sql supabase_url': capture(read('apps/supabase/supabase/seed.sql'), /\('supabase_url',\s*'([^']+)'\)/g)
```
Every captured URL must pass `isLocalSupabaseUrl`. So: keep the `PUBLIC_SUPABASE_URL` line of the compose file in its shape; add no line beginning `SUPABASE_URL=` or `PUBLIC_SUPABASE_URL=` with a non-local value to `.env.example`; the `[api]` section of `config.toml` keeps its `port`. The bootstrap's storage-URL variable needs a name of its own that this pattern does not match (RESEARCH Q4).

### Frontend unit tests
**Sources:** `apps/frontend/src/routes/api/auth/logout/server.test.ts`, `apps/frontend/src/lib/utils/logLevel.test.ts`, `apps/frontend/vitest.config.ts`
**Apply to:** the health, diagnostics and `requiredEnv` tests
- Co-located: `foo.ts` beside `foo.test.ts`; a route's test is `server.test.ts`.
- `import { describe, expect, it, vi } from 'vitest';`, then the unit under test by relative path.
- A doc comment at the top states what the suite specifies.
- `$app/environment` and `$env/dynamic/public` are aliased to stubs; `$env/dynamic/private` is not. Prefer functions that take their environment as an argument.

### Comments in new source
**Source:** `CLAUDE.md` of this worktree and the review checklist; enforced under `apps/`, `packages/`, `tests/` by `scripts/assert-comment-hygiene.mjs`
**Apply to:** every new or edited file
No decision id (`D-NN`, `A-NN`), no `.planning/` path, no history of the change, nothing addressed to a reviewer. A comment states what the code does and what breaks without it, in full sentences, on one line per paragraph (the guard's second rule rejects a forced line break inside a comment). The existing analogs carry phase and decision ids in places (`(phase 156, requirement REVIEW-DB-07 …)`, `D-17`); do not copy those into new text.

## No Analog Found

| File | Role | Data Flow | Reason | Use instead |
|------|------|-----------|--------|-------------|
| `apps/supabase/supabase/migrations.manifest.json` | config (data) | — | No hash manifest exists in the tree | RESEARCH Q2 (the six checks) and "The frozen-mode checker"; CONTEXT D-01, A-02 for its fields |
| `infra/local/nginx.conf` | config | — | No reverse-proxy configuration exists in the tree | RESEARCH, "The local proxy" |
| `.gitattributes` | config | — | The repository has none | RESEARCH Q2, "Line endings" |
| The isolated-instance part of `apps/supabase/scripts/isolated-instance.sh` | utility | batch | No tracked script starts a second Supabase CLI instance or uses `--workdir` | RESEARCH Pattern 2, after the spike of Open Question 5; shell conventions from `tests/scripts/visual-container.sh` |

Partial analogs, where the conventions come from the tree and the mechanism from the research: `infra/scripts/check-seed.sql` (psql exception as status), `apps/supabase/scripts/check-schema-equivalence.sh` (`pg_dump` comparison), the `getClientAddress()` call in the diagnostics route, and the psql meta-commands of `bootstrap.sql`.

## Metadata

**Analog search scope:** `scripts/`, `scripts/fixtures/`, `apps/frontend/` (routes under `src/routes/api/`, `src/lib/utils/`, `src/lib/server/`, `src/hooks.server.ts`, config files), `apps/supabase/` (`scripts/`, `supabase/schema/`, `seed.sql`, `config.toml`, `package.json`), `packages/dev-seed/tests/`, `tests/scripts/`, and the root templates
**Files read for excerpts:** 27
**Tracked-source check:** every analog path named above is printed by `git ls-files` in this worktree; no gitignored mirror is cited
**Pattern extraction date:** 2026-10-11
