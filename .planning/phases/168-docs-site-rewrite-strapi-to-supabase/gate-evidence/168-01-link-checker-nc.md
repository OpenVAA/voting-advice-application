# 168-01 — link checker negative controls

Base revision: `0ec229dfe7ee26eafa21882fa37f6d49817e51f9` (`gate-evidence/base-rev.txt`). Every injection below is a
temporary working-copy edit, reverted with `git checkout -- <file>` (or deleted when the injection created a file) and
followed by an empty `git status --porcelain` over the touched paths. Nothing here was committed. Exit codes were read
from the command itself (`cmd > file 2>&1; echo "exit=$?"`), never through a pipe.

## Task 1 — `--check`, `--only`, GitHub source paths

### Real-tree reference runs (not controls)

- `yarn workspace @openvaa/docs validate:links --check --only github-path` → exit 1 (real data, before any injection):
  54 findings, **39 unique dead paths** (fact 5's 39 re-derived), among them
  `backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/data.ts` (4 links),
  `apps/frontend/src/lib/api/adapters/strapi`, `apps/frontend/src/routes/[[lang=locale]]/+layout.ts`,
  `apps/frontend/src/lib/components/icon/base/IconBase.svelte`. The `(protected)` link in
  `candidate-user-management/password-validation` (a `[t](<url>)` link) is **not** reported: it is extracted whole and
  resolves.
- `yarn workspace @openvaa/docs validate:links --check --only md-link` → exit 0 (197 markdown files, 173 internal links,
  0 findings under the extended page model). Acceptance satisfied without listing exceptions.

### NC (a) — injected dead GitHub source path

- Injection: appended `[nc](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/no/such/file.ts)` to
  `apps/docs/src/routes/(content)/about/intro/+page.md`.
- Command: `yarn workspace @openvaa/docs validate:links --check --only github-path`
- Result: exit=1; `github-path` count 54 → 55. Finding printed:
  ```
  [github-path] apps/docs/src/routes/(content)/about/intro/+page.md:7
    [nc](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/no/such/file.ts)
    → Not a tracked file or directory: apps/no/such/file.ts
  ```
- Revert: `git checkout -- 'apps/docs/src/routes/(content)/about/intro/+page.md'`; `git status --porcelain -- apps/docs/src` empty.

### Probe (DOCS-07 encoding) — `[t](<url>)` with `)` / `[[`, and URL-encoded paths

- Injection: three lines appended to `about/intro/+page.md`:
  - `[enc](…/blob/main/apps/frontend/src/routes/candidate/%28protected%29/settings/%2Bpage.svelte)` (encoded, exists)
  - `[par](<…/blob/main/apps/frontend/src/routes/candidate/(protected)/no-such/+page.svelte>)` (contains `)`, missing)
  - `[lang](<…/blob/main/apps/[[x]]/missing.ts>)` (contains `[[`, missing)
- Command: `yarn workspace @openvaa/docs validate:links --check --only github-path`
- Result: exit=1; count 54 → 56. The encoded link is decoded and resolves (no finding at line 7); both angle-bracket
  URLs are extracted whole:
  ```
  [github-path] apps/docs/src/routes/(content)/about/intro/+page.md:8
    → Not a tracked file or directory: apps/frontend/src/routes/candidate/(protected)/no-such/+page.svelte
  [github-path] apps/docs/src/routes/(content)/about/intro/+page.md:9
    → Not a tracked file or directory: apps/[[x]]/missing.ts
  ```
- Revert: `git checkout -- <file>`; `git status --porcelain -- apps/docs/src` empty.

### NC (b) — `--check` never writes; default mode does

- Injection: appended `[x](../development/requirements)` to
  `apps/docs/src/routes/(content)/developers-guide/quick-start/+page.md`.
  (The plan's literal `[x](../requirements)` resolves, under the checker's file-relative semantics, to
  `/developers-guide/requirements`, which does not exist — default mode only rewrites links that resolve, so that
  injection could not show a rewrite. It was run too: `--check --only md-link` gave exit 1 with
  `[md-link] …quick-start/+page.md:21 [x](../requirements) → Target not found: /developers-guide/requirements` and an
  unchanged hash.)
- `git hash-object` before: `fd17f4a4122ef05376e8c9c2c85b503989805ff1`
- Command: `yarn workspace @openvaa/docs validate:links --check` → exit 1 (the base findings); hash after:
  `fd17f4a4122ef05376e8c9c2c85b503989805ff1` (identical), summary `Fixed links: 0`, file still ends
  `[x](../development/requirements)`.
- Command: `yarn workspace @openvaa/docs validate:links` (default mode) → exit 1 (base findings); hash after:
  `66a7871a3480263d9cd2cddb933db0e8fac22141` (changed), summary `Fixed links: 1`,
  `✓ Fixed links in: apps/docs/src/routes/(content)/developers-guide/quick-start/+page.md`, file now ends
  `[x](/developers-guide/development/requirements)`.
- Revert: `git checkout -- <file>`; `git status --porcelain -- apps/docs/src` empty.

### NC (c) — unknown class is a usage error

- Command: `yarn workspace @openvaa/docs validate:links --check --only nosuchclass`
- Result: exit 2 (not 0, not 1). Printed:
  ```
  Usage error: unknown class "nosuchclass"; valid classes are md-link, svelte-href, nav-route, anchor, stub, github-path, inbound
  ```
- No file touched.
