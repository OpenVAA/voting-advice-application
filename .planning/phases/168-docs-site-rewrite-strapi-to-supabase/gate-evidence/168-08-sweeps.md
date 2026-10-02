# 168-08 — D-21 sweeps over `apps/docs`

**Tree:** HEAD `4dee167c609c0294518a1247ecdb7e8aabd3fde1`. Scope: every tracked file under `apps/docs` (pages, generated
pages, scripts, components, README, config). `git grep` exit 0 = hits, 1 = no hit, 128 = error; each status was read
right after the command.

Patterns: VESTIGES sweeps #1, #2, #5–#7, #9 and #10 (`261001-n8y-VESTIGES.md` § Sweep commands), plus the three D-21
patterns. #5 and the Svelte 4 pattern use `-P` (`\b`, `\$`; RESEARCH Pitfall 6).

**Controls (PROH-01):** each sweep was also run with the same pattern at the phase base revision. Every control hits
(exit 0), so a sweep that returns nothing at HEAD was run with a pattern and scope that can fail.

| # | Pattern | HEAD exit | HEAD hit lines | Control at base: exit / hit lines |
|---|---|---|---|---|
| 1 | Strapi | 0 | 1 | 0 / 168 |
| 2 | `vaa-strapi` | 1 | 0 | 0 / 41 |
| 5 | `$t(` / `$locale` | 1 | 0 | 0 / 4 |
| 6 | `localstack` | 1 | 0 | 0 / 7 |
| 7 | `awslocal` | 1 | 0 | 0 / 1 |
| 9 | `GENERATE_MOCK_DATA` | 1 | 0 | 0 / 8 |
| 10 | Old env names | 1 | 0 | 0 / 27 |
| D1 | `-i docker` | 0 | 8 | 0 / 38 |
| D2 | `Svelte 4\|export let\|$$Props\|$$restProps` | 1 | 0 | 0 / 19 |
| D3 | `[[lang` | 1 | 0 | 0 / 1 |

All 9 hit lines at HEAD are listed below and, file and text, in `168-DOCS-AUDIT.md` § Sweep exceptions (subsection
"168-08: final sweep over all of `apps/docs`"). No hit is in `apps/docs/scripts` (no pattern text), and none is in a
generated page.

## Commands and hits

### Sweep 1: Strapi

```bash
git grep -n -i -E '(^|[^a-z])strapi' -- apps/docs
```

exit=0 (1 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 168 hit lines

```text
apps/docs/src/routes/(content)/about/roadmap/+page.md:6:- Backend migrated from Strapi to Supabase (completed)
```

### Sweep 2: Strapi package path

```bash
git grep -n 'vaa-strapi' -- apps/docs
```

exit=1 (0 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 41 hit lines

### Sweep 5: Store-style i18n calls

```bash
git grep -n -P '\$t\(|\$locale\b' -- apps/docs
```

exit=1 (0 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 4 hit lines

### Sweep 6: LocalStack

```bash
git grep -n -i 'localstack' -- apps/docs
```

exit=1 (0 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 7 hit lines

### Sweep 7: awslocal

```bash
git grep -n -i 'awslocal' -- apps/docs
```

exit=1 (0 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 1 hit lines

### Sweep 9: Old mock-data env

```bash
git grep -n 'GENERATE_MOCK_DATA' -- apps/docs
```

exit=1 (0 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 8 hit lines

### Sweep 10: Old env names

```bash
git grep -n -E 'STRAPI_|BACKEND_API_TOKEN|PUBLIC_BROWSER_BACKEND_URL|PUBLIC_SERVER_BACKEND_URL|MAIL_FROM|MAIL_REPLY_TO|AWS_' -- apps/docs
```

exit=1 (0 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 27 hit lines

### Sweep D1: Docker (D-21 new)

```bash
git grep -n -i 'docker' -- apps/docs
```

exit=0 (8 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 38 hit lines

```text
apps/docs/src/routes/(content)/developers-guide/contributing/workflows/+page.md:12:| `docker-image-build`                    | Builds the production image of the frontend from `apps/frontend/Dockerfile`, without pushing it                                                                        |
apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:5:- **The frontend**, a SvelteKit app built into a Node container from [`apps/frontend/Dockerfile`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/Dockerfile). The repository has a [Render](https://render.com/) Blueprint template for it, [`render.example.yaml`](https://github.com/OpenVAA/voting-advice-application/blob/main/render.example.yaml).
apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:38:2. Create the service in Render from the Blueprint. It is a Docker web service built from `./apps/frontend/Dockerfile` with the repository root as the build context. The image builds the shared packages and the frontend and runs `node ./apps/frontend/build/index.js` on port 3000.
apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:78:[`docker-compose.dev.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/docker-compose.dev.yml) at the repository root builds the frontend's production image and runs it against the local Supabase stack. Start the stack first:
apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:82:docker compose -f docker-compose.dev.yml up --build
apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:85:The app is then on port 3000. The compose file reaches the local API at `http://host.docker.internal:54321` unless `PUBLIC_SUPABASE_URL` says otherwise, and takes `PUBLIC_SUPABASE_ANON_KEY` from your environment.
apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:87:To build and run the production frontend without Docker, run `yarn build` at the repository root, which builds the shared packages and the frontend, and then start the server with the variables set:
apps/docs/src/routes/(content)/developers-guide/development/requirements/+page.md:7:- **A container runtime such as Docker**, installed and running. The Supabase CLI runs the local Supabase services (among them the database, Auth, Storage, the Edge Functions, Studio and the email testing server) as containers.
```

### Sweep D2: Svelte 4 idioms (D-21 new)

```bash
git grep -n -P 'Svelte 4|export let|\$\$Props|\$\$restProps' -- apps/docs
```

exit=1 (0 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 19 hit lines

### Sweep D3: Optional locale segment (D-21 new)

```bash
git grep -n -F '[[lang' -- apps/docs
```

exit=1 (0 hit lines)

Control (same pattern at the phase base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, proving the pattern and scope can hit): exit=0, 1 hit lines

