# Phase 158: Routing & Auth Surface Harmonisation — Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 14 new/modified artifact classes (from CONTEXT `<decisions>` + RESEARCH § K.3's eight plans)
**Analogs found:** 12 / 14 exact-or-role match; 2 with no analog in tree (stated explicitly)

Every excerpt below was read this session at branch `integration/ship-12-squash`. Line numbers are
this-session measurements — RESEARCH's own "re-measure at planning time" caveat applies.

---

## File Classification

| New/Modified file | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|
| `apps/frontend/src/lib/routes/` (new dir, barrel) | module locus | n/a (pure consts) | `src/lib/auth/index.ts` + `src/lib/utils/route/index.ts` | exact |
| the `git mv` + import codemod | refactor operation | n/a | commit `0a7939aff` (route-tree move) | partial — see § 1b |
| `apps/frontend/src/lib/routes/route.ts` (+ `PROTECTED_GROUP`) | config/const map | n/a | `src/lib/api/base/universalApiRoutes.ts` | exact |
| `apps/frontend/src/lib/cookies/index.ts` | config/const map | n/a | `universalApiRoutes.ts` + `src/lib/utils/freeze.ts` | exact |
| `scripts/assert-cookie-names.mjs` | build guard script | file-I/O, batch | `scripts/assert-a11y-scan-wiring.mjs` (+ walk from `assert-unit-test-coverage.mjs`) | **exact — three exist** |
| `lint:check` wiring | config | n/a | `package.json:35` | exact |
| `cookies.test.ts` / `routeConsistency.test.ts` | test (source-scanning) | file-I/O | `src/lib/i18n/tests/translations.test.ts` + `src/lib/_guards/eslint-store-guard.test.ts` | exact |
| `apps/frontend/src/lib/auth/passwordLogin.ts` | service (server) | request-response | `src/lib/auth/getUserData.ts` | exact |
| `apps/frontend/src/lib/auth/roles.ts` | utility / const map | n/a | `src/lib/candidate/utils/loginError.ts` | exact |
| `routes/{admin,candidate}/login/+page.server.ts` (thinned) | route action | request-response | `routes/admin/login/+page.server.ts` itself (pre-image) | exact |
| `routes/api/candidate/auth/callback/+server.ts` (moved) | route handler | request-response | `routes/candidate/auth/callback/+server.ts` (pre-image) + `routes/api/auth/logout/+server.ts` | exact |
| `hooks.server.ts` rewrite | middleware | request-response | its own `:74` `route.id` idiom | exact |
| `<page>.helpers.ts` (`nextAction` extraction) | pure helper + colocated test | transform | `lib/dynamic-components/entityList/EntityListWithControls.helpers{,.test}.ts` | **exact** |
| `.planning/todos/pending/*.md` (5 files) | record | n/a | `2026-08-28-claude-md-stale-factual-claims.md` | exact |
| the `lib/utils` proposal document | record | n/a | **no analog in tree** — see § 9 |

---

## Pattern Assignments

### 1a. `apps/frontend/src/lib/routes/` — the new `$lib` locus

**Analog:** `apps/frontend/src/lib/auth/index.ts` (1 line) and `apps/frontend/src/lib/utils/route/index.ts` (5 lines).

**Measured barrel convention — this is the load-bearing finding.** Of the 14 directories directly under
`apps/frontend/src/lib/`, only **`auth/` and `types/`** carry a top-level `index.ts`. `admin/`,
`candidate/`, `api/base/`, `server/`, `components/`, `contexts/` do **not** — they are namespaces whose
*sub*-directories carry the barrels. `utils/route/` is a sub-directory and does carry one.

`lib/auth/index.ts`, in full:

```ts
export * from './getUserData';
```

`lib/utils/route/index.ts`, in full:

```ts
export * from './buildRoute';
export * from './impliedParams';
export * from './params';
export * from './parseParams';
export * from './route';
```

**Copy:** the `export * from './<module>';` flat form, one line per module, alphabetised, no default
export, no re-export renaming, no type-only split. This is what makes `import { buildRoute } from
'$lib/utils/route'` work today, and the identical file at `lib/routes/index.ts` is what makes
`$lib/routes` work tomorrow.

**Change:** nothing structural. Note that under CONTEXT's "Claude's Discretion" the internal layout is
free — but the barrel form is not a free choice if the codemod is to be a pure path substitution
(`$lib/utils/route` → `$lib/routes`, § 1b), and preserving the *same* export surface is what keeps the
codemod one-line-per-import.

**Alias:** none needed. `svelte.config.js:11-15` declares only `$types`, `$voter`, `$candidate`;
`$lib` is SvelteKit's built-in and already resolves `src/lib/*`. Do **not** add a `$routes` alias —
D-G1 rejected it explicitly.

### 1b. The `git mv` + import codemod — precedent and its limits

**Analog:** commit `0a7939aff` (`feat: rewrite the frontend app shell and the voter and candidate
routing surface`) — the removal of the `[[lang=locale]]` route segment. `git log --diff-filter=R` shows
~40 `R0xx` renames in that single commit, e.g.

```
R078  apps/frontend/src/routes/[[lang=locale]]/api/auth/login/+server.ts
   -> apps/frontend/src/routes/api/auth/login/+server.ts
```

**What to copy:** that git records these as renames (`R055`–`R100` similarity scores) confirms
`git mv` + content-preserving edits is the house mechanism, and that reviewers read the rename
similarity score as the evidence the move was mechanical.

**What NOT to copy — and this is the point:** `0a7939aff` bundled the moves *with* a feature rewrite,
which is exactly why its diff is unreadable and why RESEARCH § K.1 classifies 158's move as one-way
"in practice". The only other rename in recent history is a single-file one
(`eff143789`: `EntityListWithControls.test.ts` → `.helpers.test.ts`). **There is no in-tree precedent
for an isolated, verified `git mv` + codemod commit.** RESEARCH § K.2 makes 158-01 that precedent.

**Verification shape to copy from the repo's guard family, not from a past move:** the codemod is
verified by the standing commands, not by inspection — `yarn build && yarn typecheck && yarn
typecheck:tests && yarn lint:check && yarn test:unit`. `typecheck:tests` is the non-obvious one
(`package.json:37`: `tsc -p tests/tsconfig.json --noEmit`) and is the *only* thing that catches
RESEARCH finding 2, the two deep-relative importers under `tests/tests/utils/`.

### 2. `apps/frontend/src/lib/cookies/index.ts` — the frozen const map

**Analog A (structure):** `apps/frontend/src/lib/api/base/universalApiRoutes.ts`, in full-shape:

```ts
/**
 * The root of all api routes.
 * Note that this is imported by `hooks.server.ts` to handle api routes differently.
 */
export const API_ROOT = '/api';

/**
 * Api routes that are used by the universal adapters.
 */
export const UNIVERSAL_API_ROUTES = {
  cacheProxy: `${API_ROOT}/cache`,
  login: `${API_ROOT}/auth/login`,
  ...
} as const;
```

**Analog B (freezing):** `apps/frontend/src/lib/utils/route/route.ts:73` closes `ROUTE` with the same
`} as const;`. Measured: **14 `} as const;` const maps under `src/lib`**, and **zero** `Object.freeze`
on a const map in `src/lib` outside `contexts/voter/answerState.svelte.ts` (which freezes *runtime
state*, not a literal map).

**The house `Object.freeze` helper exists** — `apps/frontend/src/lib/utils/freeze.ts`:

```ts
export function deepFreeze<TObject extends object>(obj: TObject): Frozen<TObject> {
  Object.freeze(obj);
  ...
}
export type Frozen<TObject> = TObject extends object
  ? Readonly<{ [KKey in keyof TObject]: Frozen<TObject[KKey]> }>
  : Readonly<TObject>;
```

**Copy:** `as const` — it is what every peer const map in `src/lib` does, and it is what D-G2's word
"frozen const map" means in this codebase's dialect (compile-time frozen). **Do not reach for
`Object.freeze`/`deepFreeze` for a flat string map**: the tree reserves those for runtime-mutable
objects and for `tests/` fixtures (14 uses, all under `tests/`). If runtime immutability is wanted as
belt-and-braces, `deepFreeze` from `$lib/utils/freeze` is the in-tree way — do not hand-roll.

**Change:** the map is a flat `Record<string, string>` of the four names, unlike `UNIVERSAL_API_ROUTES`'
templated values. Add a docblock in the `universalApiRoutes.ts` style stating **why** it exists (the
collision invariant) and naming the guard script that enforces it — the peer files all do.

**Do not add** the Supabase SSR bridge names (`lib/supabase/server.ts`) to the map — the app does not
choose those names (CONTEXT `<open>` #5, RESEARCH § C.2). They are the detector's known-exempt locus.

### 3. `scripts/assert-cookie-names.mjs` — the source-scan guard **(highest-value section)**

**Three analogs exist. Do not invent a script shape.** `scripts/` holds exactly:
`assert-a11y-scan-wiring.mjs`, `assert-i18n-catalog-namespaces.mjs`, `assert-unit-test-coverage.mjs`.

**Primary analog: `scripts/assert-a11y-scan-wiring.mjs`** — closest by kind (a regex read of source
files, N independent checks, no build step). Its skeleton, verbatim:

```js
#!/usr/bin/env node

/**
 * A11Y-SCAN WIRING GUARD (phase 147, requirements CSCAN-02 / CSCAN-03).
 *
 * The incident this file exists for: ...
 *
 * FOUR checks, each a distinct way that green-but-blind could reoccur:
 *   Check 1 (CSCAN-02a) — ...
 *
 * This is a plain text/regex read of the three source files, matching the
 * house style of `scripts/assert-unit-test-coverage.mjs` (Node built-ins
 * only, no build step, exit 1 naming the specific problem). It is
 * deliberately NOT an AST parse: ...
 *
 * Usage:
 *   node scripts/assert-a11y-scan-wiring.mjs
 *
 * Exit codes:
 *   0 - all four checks clean
 *   1 - at least one violation, or a named precondition failure (a file
 *       missing or unreadable)
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-a11y-scan-wiring.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const PLAYWRIGHT_CONFIG = path.resolve(REPO_ROOT, 'tests', 'playwright.config.ts');

function readSource(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read '${path.relative(REPO_ROOT, filePath)}' (${error.message}). ` +
        'A file this guard cannot read is wiring it cannot verify — this fails closed.'
    );
    return null;
  }
}

function main() {
  // ... reads; if any === null { process.exitCode = 1; return; }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  // --- Check 1: ... ---
  if (!candidateProjectMatch) {
    violate(
      "tests/playwright.config.ts no longer declares a 'candidate-a11y-scan' project (or its shape " +
        'changed enough that this guard cannot find it). Losing this project drops 14 candidate a11y ' +
        'scans from the suite silently (CSCAN-02).'
    );
  }

  console.log(`A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — ${violations} violation(s).`);
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
```

**Copy, item by item:**

| Element | House form |
|---|---|
| Shebang | `#!/usr/bin/env node` |
| Args | **none.** All three take zero arguments. Everything is a module-level `const`. |
| Imports | `node:fs`, `node:path`, `node:url` only. **No dependency, no glob library, no AST parser.** |
| Path root | `const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');` |
| Self-name | `const SELF = 'scripts/assert-<name>.mjs';` prefixed onto every message |
| Docblock | Mandatory and long: *the incident this file exists for*, then the numbered checks, then `Usage:`, then `Exit codes:`. Requirement IDs in parentheses on each check. |
| Failure text | `[ERROR] ${SELF}: <what changed> <why it matters> (<REQ-ID>).` — full prose sentences, never a bare assertion name |
| Counting | `let violations = 0;` + a `violate(msg)` closure |
| Summary line | one `console.log` naming the phase, requirement IDs and `N violation(s).` **on success and failure alike** |
| Exit | `process.exitCode = violations > 0 ? 1 : 0;` — **never `process.exit()`** |

**The `process.exit()` prohibition is documented, not stylistic** —
`assert-unit-test-coverage.mjs:184-192`:

> `process.exit()` terminates without flushing queued writes, and `process.stdout`/`stderr` writes are
> ASYNCHRONOUS when the target is a pipe — which is every real invocation of this guard … Setting the
> code and letting the event loop run out exits with the same status and the whole message.

**Secondary analog for the glob/walk half — `assert-unit-test-coverage.mjs`.** The cookie guard must
scan a *tree* (`apps/frontend/src`), which `assert-a11y-scan-wiring.mjs` does not. There is **no glob
library in the guard family**; the house mechanism is a hand-rolled recursive `readdirSync` walk with a
prune set:

```js
function readDirEntries(dir, why) {
  try {
    return readdirSync(fromRepoRoot(dir), { withFileTypes: true });
  } catch (error) {
    fail(
      `could not read directory '${dir}' (${error.message}), so ${why}. A directory this guard ` +
        `cannot read is coverage it cannot verify, and an unreadable tree is never read as ` +
        `"everything is accounted for" — this fails closed. ...`
    );
  }
}

function hasTestFile(dir) {
  for (const dirent of readDirEntries(dir, 'it cannot be searched for test files (Check 1)')) {
    if (dirent.isDirectory()) {
      if (PRUNED_DIRS.has(dirent.name)) continue;
      if (hasTestFile(path.join(dir, dirent.name))) return true;
      continue;
    }
    if (TEST_FILE_PATTERN.test(dirent.name)) return true;
  }
  return false;
}
```

That file also carries the named-precondition-failure idiom for the walk (`class GuardFailure extends
Error` + `fail()` thrown, caught once around `main()`):

```js
try {
  main();
} catch (error) {
  if (!(error instanceof GuardFailure)) throw error;
  console.error(`\nUnit-test coverage guard: ${error.message}\n`);
  process.exitCode = 1;
}
```

**Change for the cookie guard:** its scan target is `apps/frontend/src` (not workspace roots), its file
pattern is `.ts`/`.svelte`, its prune set includes `node_modules`, `.svelte-kit`, `paraglide`. Its
literal detector must cover **both** write forms (RESEARCH finding 3): `cookies.get|set|delete('<name>'`
**and** `document.cookie = \`<name>=…\`` — the latter at
`routes/candidate/preregister/+page.svelte:111` is the sole producer of `oidc_code_verifier` and is
invisible to a `cookies.*`-only regex. Exempt `lib/supabase/server.ts` by explicit named path, in the
`assert-a11y-scan-wiring.mjs` style of naming the exemption in the docblock rather than in a silent
skip.

**`lint:check` wiring — `package.json:35`, verbatim:**

```json
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring",
```

with the script alias declared alongside its siblings (`package.json:25-27`):

```json
"assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs",
"assert:i18n-catalog-namespaces": "node scripts/assert-i18n-catalog-namespaces.mjs",
"assert:a11y-scan-wiring": "node scripts/assert-a11y-scan-wiring.mjs",
```

**Copy:** add `"assert:cookie-names": "node scripts/assert-cookie-names.mjs"` to that alias block and
append ` && yarn assert:cookie-names` to the **end** of the `lint:check` chain. Note the precedent
that `assert:i18n-catalog-namespaces` / `assert:a11y-scan-wiring` are chained into **both**
`lint:check` and `test:e2e` (`package.json:31`), and `assert:unit-coverage` gates `test:unit` — the
planner should decide and record which gates the cookie guard belongs in. Phase 144's rule (per
`.planning` history) is to assert chain **membership**, not position.

### 4. `cookies.test.ts` / `routeConsistency.test.ts` — vitest over source files

**An analog DOES exist** — `apps/frontend/src/lib/i18n/tests/translations.test.ts` is the one test in
the tree that reads the filesystem rather than runtime behaviour:

```ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, test } from 'vitest';

const messagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'messages');

const translationLocales = fs
  .readdirSync(messagesDir)
  .filter((name) => fs.lstatSync(path.join(messagesDir, name)).isDirectory())
  .sort();
```

**Copy:** bare `fs`/`path`/`url` imports (note: this file uses `'fs'` not `'node:fs'` — the `node:`
prefix is the *scripts/* convention, not the vitest one), `path.dirname(fileURLToPath(import.meta.url))`
as the anchor, `readdirSync` + `.sort()` for determinism, and a module-level enumeration feeding
`describe`/`test`. **No `globSync`, no `fast-glob`, no `import.meta.glob`** — measured: zero uses of any
of the three in any `*.test.ts` in the repo.

**Second analog — the guard self-test shape:** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts`
is the model for a vitest that *proves a guard fires*, which is D-G2's and D-G4's "demonstrate both
failure modes failing" requirement. Copy from it:

- a `_guards/` sibling location for tests that verify tooling rather than product code;
- a long docblock enumerating "correctness invariants — each one a distinct way this spec could hand
  back a false PASS";
- **virtual fixtures**, never files written to disk: `// The paths below are VIRTUAL — no file is ever
  written to them; they are only passed as \`lintText\`'s \`filePath\` option.` For a cookie/route
  guard this becomes: feed the detector *strings*, not planted files;
- table-driven cases via `flatMap` + array-of-arrays with `%s` positional titles ("the repo's house
  style for table-driven specs");
- assert on **message substrings**, never on line/column: "Line and column move with any edit; the
  messages are the contract";
- a `beforeAll(..., 120_000)` warm-up if the first assertion pays a one-time load cost — the file
  documents a measured 5391ms-vs-651ms flake this fixed.

**Neighbour for plain vitest conventions:** `apps/frontend/src/lib/utils/route/parseParams.test.ts`
(same directory as the moving files) and `EntityListWithControls.helpers.test.ts` (see § 8).

### 5. `$lib/auth/passwordLogin.ts` + `$lib/auth/roles.ts`

**Analog A — `apps/frontend/src/lib/auth/getUserData.ts`** (same directory, same server-side shape),
in full:

```ts
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';

/**
 * A utility for getting the user data in a load or server function.
 * With Supabase, auth is cookie-based, so no token parameter is needed.
 * ...
 * @param fetch - The fetch function for making API requests.
 * @param parent - Optional parent data loader to check session state.
 * @returns BasicUserData or undefined if user data is not available.
 */
export async function getUserData({
  fetch,
  parent
}: {
  fetch: Fetch;
  parent?: () => Promise<{ session?: unknown }>;
}): Promise<BasicUserData | undefined> {
  ...
  const userData = await dataWriter.getBasicUserData({ authToken: '' }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
    return undefined;
  });
  return userData;
}
```

**Copy:**
- **single destructured object parameter with an inline type literal** — not positional args. This is
  the house signature style for `$lib` helpers and matches `buildRoute({ route, locale })`.
- `export async function`, named, not a `const` arrow (`func-style` is enforced; see § 6 for the one
  documented exemption).
- import order: value imports first, `import type` last — enforced by the lint config.
- **errors are swallowed into a sentinel return + `logDebugError`**, not thrown. The login helper
  should return a discriminated result and let each thin wrapper translate it into `fail(400)` /
  `json()` / `redirect()` — that is precisely what makes D-G3's "three entry points, different error
  and redirect semantics" work.
- ⚠ `logDebugError` is imported from `$lib/utils/logger` **today**; Phase 157 D-F5 moves and renames it.
  Import it by whatever name exists at execution time (RESEARCH § D.6).

**Consumption site to thin — `routes/admin/login/+page.server.ts:17-60`.** The duplication to extract
is visible in one block:

```ts
const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
if (error) {
  logDebugError(`Admin login failed: ${error.message}`);
  return fail(400);
}
const { session, user } = await locals.safeGetSession();
if (!session || !user) { ... return fail(500); }
const payload = JSON.parse(atob(session.access_token.split('.')[1]));
const userRoles: Array<{ role: string }> = payload.user_roles ?? [];
const isAdmin = userRoles.some((r) => ['project_admin', 'account_admin', 'super_admin'].includes(r.role));
```

`:43` is the role triple D-G3 folds into `$lib/auth/roles.ts`. The JWT-claims decode at `:41-42` is the
other half worth extracting, and it is the same code the candidate wrapper runs.

**Analog B — `$lib/auth/roles.ts` shape: `apps/frontend/src/lib/candidate/utils/loginError.ts`**, the
in-tree pattern for "a const map + a narrow union type + one pure accessor", in full:

```ts
import type { TranslationKey } from '$types';

/**
 * Get the translation key for the given error code.
 */
export function getErrorTranslationKey(error: CandidateLoginError | null): TranslationKey | undefined {
  if (error == null || !(error in CANDIDATE_LOGIN_ERROR)) return undefined;
  return CANDIDATE_LOGIN_ERROR[error];
}

const CANDIDATE_LOGIN_ERROR: Record<CandidateLoginError, TranslationKey> = {
  candidateNoNomination: 'candidateApp.error.candidateNoNomination',
  ...
} as const;

/**
 * The allowed error codes ...
 */
export type CandidateLoginError = 'candidateNoNomination' | 'loginFailed' | ...;
```

**Copy:** the exported accessor **first**, the private const map second, the exported union type last;
`Record<Union, T>` typing so a missing key is a compile error; `as const`; a string-literal union rather
than a TS `enum` (enums are lint-banned — `eslint-store-guard.test.ts` names the "inherited TS-enum
ban"). This is also the exact shape RESEARCH § I.5 item 6 wants for `OIDC_ERROR`.

**Change:** `roles.ts` also needs a **runtime read of the role enum, not a hard-coded spelling** —
RESEARCH A7 measures `candidate/login/+page.server.ts:41` still reading `r.role === 'party'` while
Phase 156 renames it to `organization`.

**Barrel:** add `export * from './passwordLogin';` and `export * from './roles';` to
`lib/auth/index.ts`, keeping the one-line-per-module form (§ 1a).

### 6. The `/api` route files

**Analog A — house minimum, `apps/frontend/src/routes/api/auth/logout/+server.ts`**, in full:

```ts
import { json } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * An API route for logging out candidates.
 *
 * @returns A json `Response` with a `DataApiActionResult`.
 */
export async function POST({ locals }) {
  await locals.supabase.auth.signOut();
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
```

**Analog B — the typed-handler form the moving file already uses,
`routes/candidate/auth/callback/+server.ts:1-20`:**

```ts
import { redirect } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';

/**
 * Auth callback route for Supabase PKCE token exchange.
 *
 * Handles all Supabase auth redirects:
 * - `recovery`: Password reset flow -> redirects to password-reset page
 * ...
 * Uses `locals.supabase` (server client from hooks.server.ts) so session cookies
 * are set automatically by @supabase/ssr.
 */
// eslint-disable-next-line func-style -- reason: SvelteKit RequestHandler type-binding requires const-form annotation
export const GET: RequestHandler = async ({ url, locals }) => {
```

**Analog C — the error shape, `apps/frontend/src/lib/api/utils/fail.ts`**, in full:

```ts
import { json } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

/**
 * Return a failure json response.
 * @param status - The HTTP status code for the response.
 */
export function apiFail(status = 500): Response {
  return json({ ok: false, type: 'failure', status } as DataApiActionResult);
}
```

**Copy:**
- **Three coexisting handler forms, and the choice is not free:** plain
  `export async function POST({ locals })` (untyped, `logout`); `({ cookies, request }: RequestEvent):
  Promise<Response>` (`api/oidc/authorize/+server.ts:16`); and `export const GET: RequestHandler`
  **with the mandatory `// eslint-disable-next-line func-style -- reason: …` comment**. Use the
  *plain function* form by default; use `RequestHandler` only when `./$types` params are needed, and
  then **carry the disable comment verbatim** — `func-style` is enforced and the `-- reason:` suffix is
  the house acceptance format.
- JSON responses go through `apiFail(status)` / `json({ ok: true, type: 'success' } as
  DataApiActionResult)`. Do not hand-roll a `new Response`.
- `error(400, { message: '…' })` from `@sveltejs/kit` for request-validation failures
  (`api/oidc/authorize/+server.ts:21`); `redirect(303, …)` for browser-facing flows.
- A `/**…*/` docblock naming the route's purpose and, where relevant, *why* it uses `locals.supabase`
  directly — the moved callback must keep that paragraph.

**Change:** `redirect(303, \`/${lang}/candidate/password-reset\`)` at `:31` is one of criterion 3's two
named hand-built strings and becomes `buildRoute({ route: 'CandAppPasswordReset', locale: … })`.
⚠ The move also changes locale derivation (RESEARCH A3, Pitfall 4): `locals.currentLocale` is
URL-derived, and Paraglide is believed not to localise `/api/*`.

### 7. `hooks.server.ts` — the `route.id` rewrite

**Analog is the file's own next-but-one line.** Measured (`nl -ba`, this session's CONTEXT fact 23):

```
64    if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
69    if (pathname.includes('/candidate')) {          <- THE DEFECT
74      if (!session && route.id.includes('(protected)')) {   <- the SAFE idiom, 5 lines below
```

**Copy:** `:74`'s form exactly — a `route.id` string test, with `route` already narrowed non-null by
the `:64` guard. **Change:** replace `.includes(…)` on both lines with predicates imported from
`$lib/routes` (`isCandidateRoute(route.id)`, `isProtectedRoute(route.id)`), so the pattern has one
definition the consistency test can bind to. ⚠ RESEARCH Pitfall 8: `route.id` is `string | null`;
the `:64` guard narrows it, but a helper taking `string` must not be called before that guard.

The two hand-built redirects at `:72` and `:76` are in criterion 3's sweep and are rewritten in the
same edit.

### 8. The `nextAction` pure-function extraction

**Analog: `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` +
`.helpers.test.ts`** — the tree's one precedent for lifting logic out of a `.svelte` `$derived.by` into
a colocated, unit-tested pure module. The rename `EntityListWithControls.test.ts` →
`.helpers.test.ts` (commit `eff143789`, `R055`) is the naming precedent.

```ts
/**
 * Pure helper used inside `EntityListWithControls.svelte`'s `$derived.by`.
 * Applies the active `FilterGroup` (if any) followed by the search filter
 * (if any). Both inputs are optional. Returns a fresh array (never mutates
 * the input).
 *
 * Both `FilterGroup.apply` and the search filter's `apply` are pure
 * `[VERIFIED: packages/filters/src/group/filterGroup.ts:46-52, ...]`,
 * which makes this helper safe to call inside a Svelte 5 `$derived` —
 * the compiler will not warn about non-pure reads.
 *
 * Tested in `EntityListWithControls.helpers.test.ts`.
 */
export function computeFiltered<TEntity>(
  entities: ReadonlyArray<TEntity>,
  filterGroup: { apply: <TFn>(targets: Array<TFn>) => Array<TFn> } | undefined,
  searchFilter: { apply: <TFn>(targets: Array<TFn>) => Array<TFn> } | undefined
): Array<TEntity> { ... }
```

and its test's header:

```ts
import { describe, expect, it, vi } from 'vitest';
import { computeFiltered, countActiveFilters } from './EntityListWithControls.helpers';

/**
 * The unit-level contract for the two pure helpers exported by
 * `EntityListWithControls.helpers.ts` ... its module graph is exactly `vitest` plus
 * `./EntityListWithControls.helpers`, and the helper itself has no imports,
 * so `EntityListWithControls.svelte` is not loaded here
 * `[VERIFIED: the import block above; EntityListWithControls.helpers.ts:1-32]`.
 */
```

**Copy:**
- filename `<Component>.helpers.ts` colocated beside the component, test as `<Component>.helpers.test.ts`;
- **structural parameter types, not imported domain types** (`{ apply: … } | undefined` rather than
  `FilterGroup`) — this is what keeps the helper's module graph empty and the test fast;
- docblock stating *which* `$derived.by` it is used inside, that it is pure, that it returns fresh data,
  and "Tested in `<file>`";
- the `[VERIFIED: path:line]` citation convention inside the docblock;
- the test docblock asserting the module graph explicitly.

**Change / apply to `candidate/(protected)/+page.svelte:38`:** the three branch arms measured at
`:36-75` each re-list every prop. The extraction takes **context-derived scalars** —
`{ profileComplete, answersLocked, unansweredRequiredInfoQuestionCount, unansweredOpinionQuestionCount,
username }` plus the two callables `t` and a route resolver — and returns the props object.

⚠ **Svelte 5 constraint, CLAUDE.md §"Context Destructuring Rule":** the call site currently reads
`candCtx.profileComplete` / `candCtx.answersLocked` *inside* the `$derived.by` thunk — that is what
keeps the reactive edge. The extraction must **pass the already-read scalars as arguments from inside
the thunk**, never pass `candCtx` itself into the helper (which would move the getter reads outside
the tracking scope). Existing correct reads to preserve:

```ts
const candCtx = getCandidateContext();
const { getRoute, t, userData } = candCtx;              // stable — destructure ok
const appSettings = $derived(candCtx.appSettings);      // reactive accessor
let nextAction = $derived.by(() => {
  if (candCtx.profileComplete) { ... }                  // read inside the thunk
```

RESEARCH § G.2 requires the rewrite be behaviour-preserving, and § K.3 puts the characterisation test
**first**, in Wave 0 — that ordering is the analog's lesson too (the helpers test was extracted with the
behaviour, not after it).

### 9. `.planning/todos/pending/` entries

**Analog: `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md`** — the newest file,
and `candidate-journey-135-intermittent.md` for the severity field.

**YAML front matter EXISTS today — measured 78 of 89 pending files carry it.** Verbatim template:

```markdown
---
created: "2026-08-28T00:00:00.000Z"
title: CLAUDE.md carries two stale factual claims that misdirect planners
area: docs
files:
  - CLAUDE.md
  - packages/app-shared/tsup.config.ts
resolves_phase: 160
related_phase: 163
---

## Problem

<symptom-and-root-cause prose, long-form, citing file:line>

## Solution

<what to do, and which phase owns the surface>

## Why this is filed rather than fixed

<the constraint that makes filing correct>
```

**Filename:** `<YYYY-MM-DD>-<slug>.md`. Older files omit the date; every file created in the last two
days uses it.

**On the `blocking:` classification field — measured, and it corrects RESEARCH § I.4's assumption A5:**

- `grep -rl "^blocking:" .planning/todos/` → **0 files.** A `blocking:` field would be genuinely new.
- `severity:` is present and its observed values are: `blocking` (×1), `high` (×3), `major` (×4),
  `medium` (×12), `minor` (×16), `trivial` (×1).
- **`severity: blocking` already exists in the register** —
  `.planning/todos/pending/candidate-journey-135-intermittent.md:5`, filed 2026-08-28:

```yaml
---
created: 2026-08-28T09:00:00.000Z
title: candidate-journey step 13.5 failed once in 3 observations — intermittent, root cause UNKNOWN
area: tests/tests/specs/candidate
severity: blocking
source: Phase 151 post-merge integration gate (2026-08-28)
files:
  - tests/tests/specs/candidate/candidate-journey.spec.ts
---
```

**Recommendation to the planner (a correction, not a preference):** D-G5 step 2's "record the
classification in front matter" is satisfiable **with zero schema invention** by using
`severity: blocking` / `severity: minor`, which is already the register's dialect and is already
`grep`-able (`grep -rl "^severity: blocking" .planning/todos/pending/`). RESEARCH § I.4 proposes a new
`blocking: true|false` field on the assumption that no such convention exists; it does. If the planner
still wants the boolean, it should be recorded as a deliberate schema addition alongside `severity:`,
not instead of it — and RESEARCH's own A5 flags "worst case the operator prefers `severity: blocking`",
which is now the measured answer.

`review_anchor:` genuinely has **no precedent** — but the `files:` list is the existing carrier, and
`source:` is where the provenance sentence lives (`source: Phase 151 post-merge integration gate
(2026-08-28)`). Consider `source: PR #870 review, apps/frontend/src/routes/Banner.svelte:9` before
inventing a field.

**D-N1 constraint on the body:** these are `.planning/` files, so they may reference planning paths —
but the *source comments* 158 writes may not.

### 10. The `lib/utils` proposal document — **no analog in tree**

`.planning/phases/*/` carries CONTEXT / RESEARCH / PLAN / SUMMARY artifacts; there is no precedent for a
standalone architectural *proposal* document in a phase directory. CONTEXT's "Claude's Discretion"
leaves the shape free ("provided it lives in the phase directory and names sections, not individual
files only"). The nearest structural conventions to borrow are the table-plus-rationale form used by
RESEARCH § B.1–B.4 (which already drafts the inventory and the selection criteria) and this file's own
"Copy / Change" framing. **Do not invent a template — reuse RESEARCH § B.4's stated deliverable shape.**

---

## Shared Patterns

### Docblock-first, incident-anchored comments
**Source:** `scripts/assert-a11y-scan-wiring.mjs:3-18`, `EntityListWithControls.helpers.test.ts:4-30`,
`_guards/eslint-store-guard.test.ts:5-56`.
**Apply to:** every new module in this phase.
The house form opens with *the incident this file exists for* / *the contract asserted below, in full*,
enumerates the checks or invariants with requirement IDs, and states what the file deliberately does
**not** do. This is unusually heavy by general standards and is uniformly applied here.

### `[VERIFIED: path:line]` citations
**Source:** `EntityListWithControls.helpers.ts:8-9`.
**Apply to:** any claim a docblock makes about another file.

### Stable anchors over line citations
**Source:** `_guards/eslint-store-guard.test.ts:31-35` — "Stable anchor, deliberately NOT a line
citation … Line ranges move on every edit — rule keys do not."
**Apply to:** the two new guards and their self-tests. Bind to identifier names and message substrings,
never to `hooks.server.ts:69` — a phase whose own CONTEXT documents three drifted line anchors should
not write more.

### `-- reason:` / `svelte-warning: accepted` lint acceptances
**Source:** `routes/candidate/auth/callback/+server.ts:19`
(`// eslint-disable-next-line func-style -- reason: SvelteKit RequestHandler type-binding requires
const-form annotation`); CLAUDE.md § Svelte Warning-Accepted Format.
**Apply to:** every suppression this phase adds.

### Import ordering
**Source:** `auth/getUserData.ts:1-3`, `candidate/auth/callback/+server.ts:1-3`.
Framework/value imports first, `$lib/*` next, `import type` last. Enforced by the lint config; the
codemod's rewritten import lines must not disturb it.

### D-N1 — no `.planning/` references in source comments
**Apply to:** every comment 158 writes. Note the existing violation the phase will read past:
`routes/(voters)/(located)/questions/[questionId]/+page.svelte:1` cites "spike 014b" — that is Phase
152's to resolve, not 158's (RESEARCH § I.5 item 3).

---

## No Analog Found

| File | Role | Data flow | Reason |
|---|---|---|---|
| the `lib/utils` proposal document | record | n/a | No standalone architectural-proposal artifact exists in any phase directory. Use RESEARCH § B.4's stated shape. |
| `review_anchor:` todo front-matter field | record schema | n/a | Zero occurrences in `.planning/todos/`. `files:` + `source:` are the existing carriers; see § 9. |

Two near-misses worth naming so the planner does not go looking:

- **An isolated `git mv` + codemod commit.** The only mass rename (`0a7939aff`) was bundled with a
  feature rewrite. 158-01 establishes the precedent rather than copying one (§ 1b).
- **A glob library in a guard script.** None of the three `scripts/assert-*.mjs` uses one; the walk is
  hand-rolled `readdirSync` (§ 3). Do not add `fast-glob` for this.

---

## Metadata

**Analog search scope:** `apps/frontend/src/lib/**`, `apps/frontend/src/routes/api/**`,
`apps/frontend/src/routes/{admin,candidate}/**`, `scripts/`, root `package.json`,
`apps/frontend/svelte.config.js`, `.planning/todos/{pending,completed,done}/`, `tests/tests/**`,
`git log --diff-filter=R`.
**Files read this session:** 22 in full or in targeted ranges; 6 census greps.
**Pattern extraction date:** 2026-08-28
