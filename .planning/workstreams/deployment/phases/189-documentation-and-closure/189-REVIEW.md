---
phase: 189-documentation-and-closure
reviewed: 2026-11-21T13:55:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - .env.example
  - .github/workflows/main.yaml
  - apps/docs/scripts/generate-navigation-config.test.ts
  - apps/docs/scripts/generate-navigation-config.ts
  - apps/docs/src/lib/navigation.config.ts
  - apps/frontend/Dockerfile
  - apps/frontend/src/lib/analytics/eventCatalogue.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts
  - apps/frontend/src/lib/server/admin/features/condenseArguments.ts
  - apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts
  - apps/frontend/src/lib/server/startup/environmentReference.test.ts
  - apps/frontend/src/lib/utils/constants.ts
  - apps/supabase/supabase/seed.sql
  - docker-compose.dev.yml
  - infra/modules/mail-ses/main.tf
  - infra/modules/mail-ses/smtp.tf
  - infra/modules/supabase/main.tf
  - infra/scripts/hosted-settings-reference.test.ts
  - packages/dev-seed/tests/analyticsEnvTemplates.test.ts
  - packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
  - packages/dev-seed/tests/deploymentTemplates.test.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
  necessity: 1
status: issues_found
---

# Phase 189: Code Review Report

**Reviewed:** 2026-11-21T13:55:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

I reviewed the diff from `66d78c1ed` for every listed file. I also read the code these files call into: the docs nav runtime (`apps/docs/src/lib/utils/navigation.ts`, `NavigationItem.svelte`), the Supabase module sources the hosted-settings guard parses, `infra/scripts/bootstrap.sql`, `task-environment.json`, `events.schema.ts` and `requiredEnv.ts`.

**The removals are complete.** A repository-wide `git grep` (with `.planning/` excluded) finds no remaining reference to any of these:

- `render.example.yaml`
- `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL`
- `apps/frontend/docker-compose.dev.yml`
- the Dockerfile `development` stage, or any `--target development`

The only hit is a synthetic `# @as render.example.yaml` path in a test fixture (IN-01). The `main.yaml` comment's claim that `build-push-image.sh` builds `--target production` checks out: the script sets `BUILD_TARGET="production"` and passes it to `--target`. The module comments that had their "has not been observed" wording replaced are backed by dated Observations rows cited in the phase's 189-16 evidence. None of the added or changed comment lines break the reference-form rules.

**Guards and generator tested.** All four suites pass on the current tree: env reference plus event catalogue 22/22, hosted settings 16/16, nav generator 8/8. Their fixture cases do show red on drift in the direction they check, so they are not vacuous in that sense. A dry run of the nav generator against the real routes returns no changes, so `navigation.config.ts` is in sync with its generator.

**Key concerns:**

- **Nav regression (blocker, CR-01).** The new Overview child gives the docs site a leaf route that is a prefix of other leaf routes. The nav runtime's prefix-matching `isActive` was never written for that, so peer (prev/next) navigation is wrong on both new deployment sub-pages, and two menu entries are highlighted at once.
- **Guards check one direction only.** Each of the three doc guards checks just "code name → page". None would have caught the drift this phase fixed by hand: the stale `PUBLIC_*_FRONTEND_URL` row that was on the env page.

## Critical Issues

### CR-01: The Overview child breaks peer navigation and the active highlight on every page under Deployment

**File:** `apps/docs/src/lib/navigation.config.ts:248-265`, `apps/docs/scripts/generate-navigation-config.ts:443-445` (consumers: `apps/docs/src/lib/utils/navigation.ts:13-15,57`, `apps/docs/src/lib/components/NavigationItem.svelte:14-16`)

**Issue:** The generator now emits `{ title: 'Overview', route: '/developers-guide/deployment' }` as a leaf next to `/developers-guide/deployment/hosted-settings` and `/developers-guide/deployment/operations`. `isActive(route, url)` returns true for `url.pathname.startsWith(route + '/')`. That makes the Overview leaf "active" on every child page. Until this change no leaf route was a prefix of another leaf, because a page with children became a disclosure instead of a leaf, so the prefix rule was harmless. It no longer is.

- **Peer navigation:** `getPeerNavigation` takes the *first* active leaf (`findIndex(item => isActive(item.route, url))`), so it always resolves to Overview. I ran it against the real config:
  - `/developers-guide/deployment/hosted-settings` → prev `/developers-guide/admin-app`, next `/developers-guide/deployment/hosted-settings`. The "next" link points to the page you are on.
  - `/developers-guide/deployment/operations` → prev `/developers-guide/admin-app`, next `/developers-guide/deployment/hosted-settings`. That is wrong in both directions, and Operations is unreachable via "next".
- **Highlight:** `NavigationItem.svelte` gives `menu-active` to both "Overview" and the actual page, so the sidebar shows two current items.

Every future subsection that gets an Overview child will hit the same problem, since the generator now adds one automatically. The new generator tests only cover the structure the generator builds, not how the runtime uses it, so nothing catches this.

**Fix:** Match a leaf exactly when another leaf in the tree sits below its route. The simplest form is to make leaf activity exact and keep the prefix rule only for disclosures:

```ts
// apps/docs/src/lib/utils/navigation.ts
export function isActive(route: string, url: URL, exact = false): boolean {
  return url.pathname === route || (!exact && url.pathname.startsWith(route + '/'));
}
// getPeerNavigation: prefer an exact match, fall back to prefix
const exactIndex = allItems.findIndex((item) => item.route === url.pathname);
const currentIndex = exactIndex >= 0 ? exactIndex : allItems.findIndex((item) => isActive(item.route, url));
```

In `NavigationItem.svelte`, compute leaf activity with `isActive(item.route, url, true)`, and keep the prefix test for `<details open>`. Add a unit test of `getPeerNavigation` on `/developers-guide/deployment/hosted-settings` that expects next = `/developers-guide/deployment/operations`.

## Warnings

### WR-01: The env-reference guard checks one direction only and does not read the two `constants` modules

**File:** `apps/frontend/src/lib/server/startup/environmentReference.test.ts:107-129`

**Issue:** `environmentReferenceProblems` only asks whether each code-side name is backticked somewhere on the page. Two gaps follow:

1. **One direction only.** A variable the code stops reading stays on the page and the test still passes. This phase's own cleanup shows the exposure: the base page at `66d78c1ed` (line 97) documented `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL`. Commit `6f735d819` removed them from `constants.ts`, and this guard would not have flagged the stale row.
2. **The `constants` modules are not inputs.** The page's own instruction is "To add a variable, add it to the right `constants` module and to `.env.example`." A new variable added that way, and not to the task list, `REQUIRED_ENV`, `ANALYTICS_ENV` or bootstrap, is never required on the page. Examples are a new `PUBLIC_*` flag or an `IDENTITY_*` value.

Today the page and the code agree in both directions (I checked by hand), so this is a robustness gap, not a current mismatch.

**Fix:**
- Add `$lib/utils/constants` and `$lib/server/constants` keys (`Object.keys(constants)`) to the required name set.
- Add the reverse check: every backticked token matching `^[A-Z][A-Z0-9_]+$` that appears in a variable table or list must be a name the code, `.env.example` or the functions' `.env.example` declares. Name each orphan in its own problem.
- Add a fixture case like "names `PUBLIC_BROWSER_FRONTEND_URL` when the page lists a variable nothing reads".

### WR-02: The hosted-settings guard checks neither stale rows nor values, and reads a hand-kept copy of the secret names

**File:** `infra/scripts/hosted-settings-reference.test.ts:144-150,180-215`

**Issue:** There are three gaps:

1. **One direction only (same class as WR-01).** A setting deleted from `hosted-settings.json` or `variables.tf` keeps its row on the page, and the test passes.
2. **Values are not checked.** The page's Value column restates every JSON value (`max_rows` `50000`, `jwt_exp` `3600`, the rate-limit defaults, and so on), and nothing ties those values to the sources. The page itself says `max_rows` "must also equal the frontend's page size". A drift there is a correctness statement going wrong, not a missing name.
3. **Function secrets come from a duplicate list.** They are read from the `function_secret_names` local (`function-secrets.tf:14-17`). That local is a hand-maintained duplicate of the `secrets` list of `supabase_edge_function_secrets.this` (`function-secrets.tf:24-36`). A secret added to the resource but not to the local is written to the project and never required on the page. The only other check of the local (`infra/envs/example/supabase/tests/plan.tftest.hcl:27-28`) reads the same local through the output, so nothing ties it to the resource.

**Fix:**
- Read the function-secret names from the resource's `{ name = "..." }` entries, or assert that the local equals them.
- Compare each JSON leaf's scalar value with the Value cell of its row (for `false`/`true`/numbers, the backticked first token of the cell).
- Add the reverse check over the table's Setting column: each first backticked token must be a name the sources yield, or one of the declared non-module rows (`statement_timeout`).

### WR-03: The event-catalogue guard does not tie the "Sensitive" and consent column to `SENSITIVE_EVENTS`

**File:** `apps/frontend/src/lib/analytics/eventCatalogue.test.ts:26-63`

**Issue:** The guard compares only the first-cell event names with `EVENT_NAMES`. The page states that "**Sensitive** marks the events in `SENSITIVE_EVENTS`". That column is a privacy claim a deployer reads before turning analytics on (in `free` mode these events never carry the visit id). If someone adds an event to `SENSITIVE_EVENTS`, or removes one, the page goes on stating the old classification and the test stays green. I checked by hand and the six rows marked "sensitive" match the set today, so there is no live mismatch.

**Fix:** In `catalogueRowNames`, also return the last cell, and assert `cell.includes('sensitive') === SENSITIVE_EVENTS.has(name)` for every row. Add a fixture case that flips one.

### WR-04: A touched comment block keeps its historical narrative (comment hygiene)

**File:** `apps/frontend/src/lib/server/admin/features/condenseArguments.ts:60-63`, `apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts:71-74`

**Issue:** The phase edited line 61/72 of this block to drop the Render reference. The surrounding comment still breaks the CLAUDE.md "No historical narrative" rule, which applies to every touched comment:

- "reason: the writer used to be built from the initiating request's client …"
- "BOTH ARE NOW CLOSED …"
- "they stay named because a reader arriving after the next incident needs to know what was considered"

That is a story of the earlier design and of the review, not a description of the code as it is. The same text appears in both files.

**Fix:** Rewrite the block in the present tense. Say what the job-owned client guarantees: it renews nothing and writes no cookie, so neither a timed-out gateway nor a response that has already been generated can reach it. Keep the one open question, what happens when the admin's session expires during a job. Move the "used to be built from the request's client" account to the commit message.

## Info

### IN-01: A test fixture still names the deleted `render.example.yaml`

**File:** `scripts/fixtures/assert-test-keys-scope.input.txt:23`

**Issue:** `# @as render.example.yaml` is a synthetic path, so the self-test is unaffected. Even so, it is the only remaining hit for the deleted file, and a future "nothing references it" grep will trip on it.

**Fix:** Change the directive to a path that exists, for example `# @as infra/modules/frontend-service/task-environment.json`, and update the matching line in `assert-test-keys-scope.expected.violations`.

### IN-02: The bootstrap reader silently skips any `\getenv` that is not in canonical form

**File:** `apps/frontend/src/lib/server/startup/environmentReference.test.ts:94-99`

**Issue:** The regex requires the line to be exactly `\getenv <var> <NAME>`. Some forms psql accepts would not match: a quoted name (`\getenv x 'NAME'`), a second meta-command on the same line, or a trailing token. Such a line is dropped without a problem being reported, as long as one other `\getenv` line still matches. All eight current lines are canonical.

**Fix:** Count lines that start with `\getenv` and report any that the strict regex does not parse, naming the line.

### IN-03: Generality without instantiation: the `frontend` Docker stage now has a single consumer

**File:** `apps/frontend/Dockerfile:30-38`
**Category:** necessity
**Issue:** Before this change, `frontend` was shared by `development` and `production`. With `development` removed, `FROM frontend AS production` is its only consumer. No build targets `frontend`: `git grep` finds `BUILD_TARGET="production"` (`infra/scripts/build-push-image.sh:88`), `target: production` in `docker-compose.dev.yml:10`, and no `--target frontend` anywhere. The intermediate stage no longer separates anything.

**Fix:** Optionally fold the two `COPY --from=shared` lines into the `production` stage (`FROM base AS production`). Keep `AS production`, which `ciDockerImageBuildGate.test.ts` asserts.

---

_Reviewed: 2026-11-21T13:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
