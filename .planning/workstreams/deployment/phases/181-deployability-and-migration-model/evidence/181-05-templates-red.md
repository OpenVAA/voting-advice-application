SPEC_EXIT_BEFORE=1
SPEC_TESTS_FAILED_BEFORE=13
SPEC_TESTS_PASSED_BEFORE=10
TEMPLATES_UNCHANGED_AT_RUN=yes

# Red control: `deploymentTemplates.test.ts` on the unchanged templates

The status above is the exit status of the command itself, written to a file by the shell that ran it. It was not read through a pipe. The two counts are copied from Vitest's own summary line.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12T17:32:43Z |
| Commit | `1b5021fb2535454a7db492639d21f92f388e1d92` |
| Tracked changes in the worktree | none (`git status --porcelain --untracked-files=no` printed nothing a moment before the run), so the three templates and `config.toml` were as they are in that commit |
| The spec | `packages/dev-seed/tests/deploymentTemplates.test.ts`, untracked at the time of the run; it is committed together with this record and was not changed between the run and that commit |
| Command | `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts`, with Node v24.21.0 first in `PATH` |
| Vitest | 5.0.2, default reporter |
| Turbo | not involved: the workspace script is `vitest run` |

Vitest's summary: `Test Files  1 failed (1)`, `Tests  13 failed | 10 passed (23)`.

## The failing cases, as Vitest prints them

```
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > render.example.yaml > declares - key: PUBLIC_PROJECT_ID
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > render.example.yaml > declares - key: ORIGIN
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > render.example.yaml > declares - key: ADDRESS_HEADER
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > render.example.yaml > declares - key: XFF_DEPTH
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > docker-compose.dev.yml > passes PUBLIC_PROJECT_ID with a default
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > docker-compose.dev.yml > passes ORIGIN with a default
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > docker-compose.dev.yml > passes ADDRESS_HEADER with a default
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > docker-compose.dev.yml > passes XFF_DEPTH with a default
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > .env.example > lists ORIGIN as a commented line
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > .env.example > lists ADDRESS_HEADER as a commented line
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > .env.example > lists XFF_DEPTH as a commented line
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > apps/supabase/supabase/config.toml > declares a [functions.identity-callback] section
 FAIL  tests/deploymentTemplates.test.ts > deployment templates > apps/supabase/supabase/config.toml > assigns verify_jwt = false in the [functions.identity-callback] section
```

All 13 are assertion failures of the case itself. Vitest printed four messages for them:

| Cases | Message |
|-------|---------|
| the four of `render.example.yaml` and the four of `docker-compose.dev.yml` | `AssertionError: expected 0 to be greater than 0` |
| the three of `.env.example` | `AssertionError: expected 0 to be greater than 0` |
| `declares a [functions.identity-callback] section` | `AssertionError: expected undefined to be defined` |
| `assigns verify_jwt = false in the [functions.identity-callback] section` | `AssertionError: expected [] to deeply equal [ 'false' ]` |

No case failed while a file was being read or the module was being loaded.

## The cases that passed on the unchanged tree

Ten cases passed. They are named here because a case that passes before the change shows nothing by being green after it.

| Case | Why it passes before the change |
|------|---------------------------------|
| `is read and is not empty`, once for each of the four files (for the Compose file: `is read and has an environment map with entries`) | The non-vacuity cases: each file exists and has content, and the Compose file's `environment` map already has six entries |
| `docker-compose.dev.yml > keeps the shape of the PUBLIC_SUPABASE_URL entry` | The line is there today. The case guards it against the edit |
| `.env.example > has no live line for ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH` | The file names none of the three today, so it has no live line for them. These three were not seen failing against the file |
| `docker-compose.dev.yml > does not count a bare substitution as an entry with a default` | A control on the spec's own matcher, over a literal: `ORIGIN: ${ORIGIN}` is refused and `ORIGIN: ${ORIGIN:-}` is accepted |
| `.env.example > recognises a live line, and does not take a commented one for it` | A control on the spec's own matcher, over literals: `ORIGIN=…` and `export ORIGIN = …` are found, `# ORIGIN=…` is not |

The three `has no live line` cases have no red run against the file itself. What stands in for one is the control case beside them, which shows that the matcher they use finds a live line when a text has one.
