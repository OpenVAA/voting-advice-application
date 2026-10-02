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

## Task 2 — svelte-href, nav-route, anchor, stub, inbound (and md-link)

Real-tree reference run before the controls: `yarn workspace @openvaa/docs validate:links --check` → exit 1 with
md-link 0 · svelte-href 0 · nav-route 0 · anchor 4 · stub 0 · github-path 54 · inbound 4 (full report:
`168-01-links-baseline.txt`). Counters: 197 markdown files, 173 internal md links, 8 literal hrefs (12 dynamic, not
checked), 92 navigation leaves, 0 redirect stubs, 23 anchors checked, 370 GitHub links in 213 files, 42 inbound
references (1 pattern skipped). `--only svelte-href,nav-route,stub` → exit 0; `--only anchor` → exit 1.

Each control below adds one injection to that base and is read against the base count of its class.

### NC md-link (broken target)

- Injection: appended `[x](/developers-guide/no-such-page)` to `apps/docs/src/routes/(content)/about/intro/+page.md`.
- Command: `yarn workspace @openvaa/docs validate:links --check --only md-link`
- Result: exit=1; md-link 0 → 1.
  ```
  [md-link] apps/docs/src/routes/(content)/about/intro/+page.md:7
    [x](/developers-guide/no-such-page)
    → Target not found: /developers-guide/no-such-page
  ```
- Revert: `git checkout -- <file>`.

### NC svelte-href

- Injection: appended `<a href="/does-not-exist">x</a>` to `apps/docs/src/routes/+page.svelte`.
- Command: `yarn workspace @openvaa/docs validate:links --check --only svelte-href`
- Result: exit=1; svelte-href 0 → 1.
  ```
  [svelte-href] apps/docs/src/routes/+page.svelte:237
    /does-not-exist
    → Target not found: /does-not-exist
  ```
- Revert: `git checkout -- apps/docs/src/routes/+page.svelte`.

### NC nav-route (leaf)

- Injection: in `apps/docs/src/lib/navigation.config.ts`, the leaf `route: '/about/features'` changed to
  `route: '/about/no-such-leaf'` (`git diff --stat`: 1 insertion, 1 deletion).
- Command: `yarn workspace @openvaa/docs validate:links --check --only nav-route`
- Result: exit=1; nav-route 0 → 1.
  ```
  [nav-route] apps/docs/src/lib/navigation.config.ts:20
    [Features](/about/no-such-leaf)
    → Navigation leaf has no page: /about/no-such-leaf
  ```
- Revert: `git checkout -- apps/docs/src/lib/navigation.config.ts`.
- Section routes (e.g. `/developers-guide/backend`, which has no page) are not checked: the base run reports 0 with 92
  leaves walked.

### NC anchor

- Injection: appended `[x](/developers-guide/quick-start#no-such-heading)` to `about/intro/+page.md`.
- Command: `yarn workspace @openvaa/docs validate:links --check --only anchor`
- Result: exit=1; anchor 4 → 5. The injected finding:
  ```
  [anchor] apps/docs/src/routes/(content)/about/intro/+page.md:7
    [x](/developers-guide/quick-start#no-such-heading)
    → No id "no-such-heading" on apps/docs/src/routes/(content)/developers-guide/quick-start/+page.md
  ```
  The four base findings are the known broken anchors (`mock-data → …mock-data-generation/#mock-users`,
  `contexts #example-loading-cascade-…`, `troubleshooting #docker-error-no-space-left-on-device-errordocker-…`,
  `publishers-guide/app-settings #customization`); the other 19 anchors (including the PR template's `#self-review`
  and `#commit-your-update`) resolve, so the oracle is not reporting everything.
- Revert: `git checkout -- <file>`.

### NC stub (missing target) and NC stub (redirect chain)

- Injection: two scratch stubs, each a `+page.ts` only:
  - `apps/docs/src/routes/(content)/nc-stub/+page.ts` → `redirect(308, '/no-such-route');`
  - `apps/docs/src/routes/(content)/nc-stub-chain/+page.ts` → `redirect(308, '/nc-stub');`
- Command: `yarn workspace @openvaa/docs validate:links --check --only stub`
- Result: exit=1; stub 0 → 2 (2 stubs found).
  ```
  [stub] apps/docs/src/routes/(content)/nc-stub-chain/+page.ts:4
    /nc-stub
    → Redirect chain: the target is itself a redirect stub (apps/docs/src/routes/(content)/nc-stub/+page.ts)
  [stub] apps/docs/src/routes/(content)/nc-stub/+page.ts:4
    /no-such-route
    → Redirect target is not a page: /no-such-route
  ```
  Stub with a missing target: exit=1 (the `nc-stub` finding above).
  Stub chain: exit=1 (the `nc-stub-chain` finding above).

### NC md-link to a stub

- Injection: with the two scratch stubs present, appended `[x](/nc-stub)` to `about/intro/+page.md`.
- Command: `yarn workspace @openvaa/docs validate:links --check --only md-link`
- Result: exit=1; md-link 0 → 1.
  ```
  [md-link] apps/docs/src/routes/(content)/about/intro/+page.md:7
    [x](/nc-stub)
    → Targets redirect stub → /no-such-route; link the final URL
  ```
- Revert: `git checkout -- <file>`.

### Probe (DOCS-07 chain; T-168-01) — external, protocol-relative, non-literal, wrong status, and a valid stub

- Injection: five more scratch stubs beside the two above:
  `nc-stub-ext` → `redirect(308, 'https://example.com/')`, `nc-stub-proto` → `redirect(308, '//evil.example/x')`,
  ``nc-stub-tpl`` → ``redirect(308, `/developers-guide/${"quick-start"}`)``, `nc-stub-302` →
  `redirect(302, '/developers-guide/quick-start')`, and a valid `nc-stub-ok` → `redirect(308, '/developers-guide/quick-start')`.
- Command: `yarn workspace @openvaa/docs validate:links --check --only stub`
- Result: exit=1; 7 stubs found, 6 findings — the valid stub is accepted:
  ```
  nc-stub-302/+page.ts:4   → Invalid redirect stub: redirect status 302, expected 301 or 308
  nc-stub-chain/+page.ts:4 → Redirect chain: the target is itself a redirect stub (…/nc-stub/+page.ts)
  nc-stub-ext/+page.ts:4   → Invalid redirect stub: redirect target https://example.com/ is not an internal route
  nc-stub-proto/+page.ts:4 → Invalid redirect stub: redirect target //evil.example/x is not an internal route
  nc-stub-tpl/+page.ts:4   → Invalid redirect stub: the redirect target is not a single string literal
  nc-stub/+page.ts:4       → Redirect target is not a page: /no-such-route
  ```
- Revert: `rm -r` of the seven scratch directories under `apps/docs/src/routes/(content)/`.

### NC inbound

- Injection: appended the line `https://openvaa.org/developers-guide/no-such-page` to the root `README.md`.
- Command: `yarn workspace @openvaa/docs validate:links --check --only inbound`
- Result: exit=1; inbound 4 → 5. The injected finding:
  ```
  [inbound] README.md:20
    /developers-guide/no-such-page
    → No page at /developers-guide/no-such-page
  ```
  The four base findings: `README.md:16 /developers-guide/contributing` and
  `apps/frontend/src/routes/candidate/README.md:5 /developers-guide/candidate-user-management` (section routes with no
  page), and the two `docs/src/routes/developers-guide/configuration/{static,app}-settings/+page.md` paths in
  `packages/app-shared/src/settings/README.md` (not tracked).
- Revert: `git checkout -- README.md`.

### Revert proof (Task 2)

`git status --porcelain -- apps/docs/src README.md` printed nothing after the last revert (the only working-tree changes
at that point were the uncommitted checker sources under `apps/docs/scripts`, `apps/docs/mdsvex.config.js` and
`apps/docs/svelte.config.js`).
