# Phase 140: Blind-Matcher Remediation — Teardowns, Null-Matchers, Positive Controls — Pattern Map

**Mapped:** 2026-08-15
**Files analyzed:** 36 (1 new module + 27 teardown call sites + 1 config + 2 specs + 2 templates + 3 unit tests + 1 new doc)
**Analogs found:** 36 / 36 (every target has a real in-tree analog; none stretched)
**Scope source:** `140-RESEARCH.md` only (no CONTEXT.md — discuss-phase was not run)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tests/tests/setup/shared/assertTeardown.ts` **(NEW)** | test utility / harness helper | request-response (RPC → assert) | `tests/tests/setup/shared/setupFromTemplate.ts` (module shape) + `tests/tests/setup/perm/perm-hide-category-tags.teardown.ts:13-17` (the assertion being lifted) | role-match (composite; no teardown-assertion helper exists today) |
| 25 × `tests/tests/setup/perm/*.teardown.ts` **(MOD)** | test setup/teardown project | batch delete | `perm-hide-category-tags.teardown.ts` (all 25 byte-identical on the `expect` line) | exact |
| `tests/tests/setup/shared/base.teardown.ts` **(MOD)** | test teardown project | batch delete + auth unlink | itself (variant A: pre-delete `unregisterCandidate`) | exact |
| `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` **(MOD)** | test teardown project | batch delete + auth cascade + settings restore | itself (variant B: three extra steps) | exact |
| `tests/playwright.config.ts` **(MOD)** | config (config-load guard) | validate-and-throw | ORPHAN-PROBE GUARD, same file, `:18-47` | **exact — same file, same block class** |
| `tests/tests/specs/perm/perm-hide-category-tags.spec.ts` **(MOD)** | E2E spec | request-response (UI assert) | `tests/tests/specs/perm/perm-answers-locked.spec.ts:53-54` (counted presence assertion w/ message) | exact |
| `tests/tests/specs/perm/perm-hide-election-tags.spec.ts` **(MOD)** | E2E spec | request-response (UI assert) | same as above | exact |
| `packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts` **(MOD)** | seed template / fixture | batch seed | `perm-hide-election-tags.ts:21-30` (already carries `elections: 2`) | **exact — the two templates are each other's analog** |
| `packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts` **(MOD)** | seed template / fixture | batch seed | `perm-hide-category-tags.ts:20-28` (already carries a `questions.showCategoryTags` overlay) | exact |
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` **(MOD)** | unit test | transform/assert | `apps/frontend/src/lib/i18n/tests/utils.test.ts:25-58` (`expect(x, 'msg').toX()` house form) | role-match |
| `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` **(MOD)** | unit test | transform/assert | same | role-match |
| `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` **(MOD)** | unit test | transform/assert | same + **its own line `:165`** (`expect(capturedFetchBody).not.toBeNull()`) | **exact — the correct idiom is one line above the defect** |
| `140-NEGATIVE-CONTROL.md` **(NEW)** | evidence document | n/a | `137-NEGATIVE-CONTROL.md` (structure) + `138-NEGATIVE-CONTROL.md` (two-half framing) | exact |

---

## Pattern Assignments

### 1. `tests/tests/setup/shared/assertTeardown.ts` (NEW — test utility)

**There is no teardown-assertion helper today.** `tests/tests/setup/shared/` holds exactly four files
(`auth.setup.ts`, `base.setup.ts`, `base.teardown.ts`, `setupFromTemplate.ts`), none of which plays this
role. The analog is therefore **composite**: module shape from the shared dir, assertion body from the
27 sites, probe shape from the client.

#### (a) Module shape — house style of `tests/tests/setup/shared/`

All four files open with a `/** … */` block comment that states the module's role AND its design
rationale in prose (not a one-liner), then imports, then a module-level `const`. Named `export function`
/ `export async function` is the export style (`setupFromTemplate.ts`); `export default` appears only in
`packages/dev-seed` templates, never in `tests/`.

`base.setup.ts:1-16`:

```ts
/**
 * base data-setup project, decoupled from the perm anchor.
 *
 * Invokes the generic `setupFromTemplate('e2e/base')` helper to seed the
 * canonical base dataset. ...
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';
```

Import ordering (enforced by lint, observed in every file): external packages first
(`@openvaa/dev-seed`, `@playwright/test`), then relative modules, then `import type { … }` last
(`auth.setup.ts:9` — `import type { Page } from '@playwright/test';`).

**Follow this**: doc block explaining *why* the helper exists (it is the F3 "by construction" carrier),
named export, explicit return type (C-6 — `yarn typecheck:tests` gates it).

#### (b) The 27 call sites — three structurally distinct shapes

The research is right that the sites are **not** uniform. There are exactly three shapes; the helper
must fit all three.

**Shape 1 — bare (25 of 27, byte-identical)**, `tests/tests/setup/perm/perm-hide-category-tags.teardown.ts:1-17`:

```ts
/**
 * perm-hide-category-tags data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-hide-cattags-'.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-hide-cattags-';

teardown('delete perm-hide-category-tags dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
```

**Shape 2 — a step BEFORE the delete**, `tests/tests/setup/shared/base.teardown.ts:30-36`:

```ts
teardown('delete base dataset', async () => {
  const client = new SupabaseAdminClient();
  // Runs BEFORE the row wipe so the candidate row is still present to unlink.
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
```

**Shape 3 — numbered steps, delete is step 1 of 3**, `tests/tests/setup/candidate/bank-auth-journey.teardown.ts:28-55`:

```ts
teardown('delete bank-auth-journey dataset + created auth user', async () => {
  const client = new SupabaseAdminClient();

  // 1. Clear the seeded perm-not-located-2e2cg rows.
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);

  // 2. Delete the auth.users + user_roles + candidate-link the journey created.
  await client.deleteBankAuthCandidateBySub(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL);
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL);
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_EMAIL);

  // 3. Restore the scoped preregistration flag. ...
  await client.updateAppSettings({ preRegistration: { enabled: false } });
});
```

**Consequence for the helper signature.** All three shapes construct the client *themselves* and reuse
it for other calls, and shape 3 needs the delete to stay in ordinal position 1. So the helper must
**accept an existing `client`** (not construct one) and must **not** own the `teardown()` wrapper — it
replaces only the `runTeardown(...) + expect(...)` pair. Shape confirmed by the research sketch:

```ts
export async function runTeardownAsserted(prefix: string, client: SupabaseAdminClient): Promise<void>
```

After the change each site's two lines collapse to one: `await runTeardownAsserted(PREFIX, client);` —
and shapes 2 and 3 keep their extra steps in the file, exactly as the research's anti-pattern note requires.

#### (c) The before/after row-count probe — existing house shape

Two in-tree prior arts; **prefer the first** (it is inside `tests/`, uses the tests' own client, and is
the only one that generalises past the candidates table).

`tests/tests/setup/shared/setupFromTemplate.ts:101,106` — the only two `client.query(...)` call sites in `tests/`:

```ts
  const candQuery = client.query('candidates');
  ...
  const orgQuery = client.query('organizations');
```

The builder itself, `tests/tests/utils/supabaseAdminClient.ts:194-197` — note it already scopes to
`project_id`, so a `.like('external_id', `${prefix}%`)` chained onto it is the complete probe:

```ts
  query(collection: string) {
    const tableName = resolveCollectionName(collection);
    return this.client.from(tableName).select('*').eq('project_id', this.projectId);
  }
```

The prefix-filter idiom to copy verbatim, `packages/dev-seed/src/supabaseAdminClient.ts:839-845`
(template-literal `${prefix}%`, `.like`, throw-on-error with a `<fn> failed: <msg>` message):

```ts
  async listCandidateIdsByPrefix(prefix: string): Promise<Array<string>> {
    const { data, error } = await this.client.from('candidates').select('id').like('external_id', `${prefix}%`);
    if (error) {
      throw new Error(`listCandidateIdsByPrefix failed: ${error.message}`);
    }
    return (data ?? []).map((row) => (row as { id: string }).id);
  }
```

Caveat carried from research: `listCandidateIdsByPrefix` covers **candidates only** (1 of 10 tables). A
before/after probe built on `client.query('<table>')` over a named table list is the generalisation, and
`setupFromTemplate.ts:101-106` is the precedent for iterating a small explicit table list rather than
introspecting the schema.

**Assertion message style to preserve** — the existing sites use vitest/Playwright's
`expect(actual, 'message')` second-argument form. Keep it; make the message name the prefix and both
numbers (research shape A).

---

### 2. `tests/playwright.config.ts` (MODIFIED — config-load counted guard)

**Analog: the ORPHAN-PROBE GUARD in the same file, `tests/playwright.config.ts:18-47`.** This is the
strongest analog in the phase — same file, same block class, same firing point, and its docstring
already argues this phase's thesis.

Structure to mirror, exactly, in order:

1. A hoisted module-level `const` holding the invariant's parameter, placed **above** the guard with its
   own doc comment (`:12-16`):

```ts
/**
 * The `_probes` project's `testMatch` (see the project definition below).
 * Hoisted so the orphan check can compare the directory against it.
 */
const PROBE_TEST_MATCH = /(video|questionInfo|popupNotice|orgMatching|numberScale)\.probe\.spec\.ts$/;
```

2. A named ALL-CAPS guard docstring citing the phase and the audit finding, ending with the rationale
   for checking rather than commenting (`:18-32`) — the F10 guard should cite `finding F10` the way this
   one cites `finding F4`:

```ts
/**
 * ORPHAN-PROBE GUARD (Phase 136 plan 03, fake-guard sweep finding F4).
 * ...
 * A comment asking future authors to keep the list in sync would be the same
 * kind of non-guard this phase exists to remove, so the invariant is CHECKED.
 * Throwing here fails every `playwright test` / `--list` invocation immediately
 * and by name, which is the earliest point at which the mistake is visible.
 */
```

3. The check itself: `fs.existsSync` gate → read → filter → `if (…) throw new Error(...)` (`:33-47`):

```ts
const probesDir = path.join(TESTS_DIR, 'specs/_probes');
if (fs.existsSync(probesDir)) {
  const orphans = fs
    .readdirSync(probesDir)
    .filter((f) => f.endsWith('.probe.spec.ts'))
    .filter((f) => !PROBE_TEST_MATCH.test(f));
  if (orphans.length > 0) {
    throw new Error(
      `Orphaned probe spec(s) in tests/specs/_probes — they match NO Playwright project and run ` +
        `from NO command: ${orphans.join(', ')}. Add each to the \`_probes\` project's testMatch ` +
        `(PROBE_TEST_MATCH in this file), or delete the file. Leaving it in place implies coverage ` +
        `that does not exist (fake-guard sweep 2026-08-11, finding F4).`
    );
  }
}
```

**Answers to the three questions asked of this analog:**

- **How it fails:** bare `throw new Error(...)` at module top level. **Not** `process.exit`. There is no
  `process.exit` in `playwright.config.ts`.
- **Message format:** a single concatenated template-literal string, four clauses in fixed order —
  (i) what is wrong, (ii) the offending items interpolated by name, (iii) the two admissible remedies
  naming the in-file symbol to edit, (iv) a parenthesised provenance citation
  (`(fake-guard sweep 2026-08-11, finding F4)`).
- **Placement:** above `defineConfig`, after the `dotenv.config()` / `STORAGE_STATE` preamble
  (`:1-10`), so it fires before the project graph is constructed.

Existing imports already available at the top of the file — the F10 guard needs **no new imports**
(`fs`, `path`, `TESTS_DIR` are all in scope):

```ts
import fs from 'fs';
import path from 'path';
import { TESTS_DIR } from './tests/utils/testsDir';
```

---

### 3. F9 positive control — the two perm specs

**Analog for a counted PRESENCE assertion: `tests/tests/specs/perm/perm-answers-locked.spec.ts:53-54`.**
This is the house form and it already carries an explanatory message:

```ts
    const count = await inputs.count();
    expect(count, 'profile page must render at least one visible input').toBeGreaterThan(0);
```

Second instance, same file `:84`:

```ts
    expect(count, 'candidate-questions-answer must render at least one radio').toBeGreaterThan(0);
```

And in `perm-localisation-positive.spec.ts:193,205,244` the same `expect(x, '<why>').toBeGreaterThan(0)`
shape. **Note the house preference:** `await locator.count()` into a `const`, then a *non-awaited*
`expect(count, msg).toBeGreaterThan(0)` — rather than
`await expect(locator).not.toHaveCount(0)`. `.not.toHaveCount(0)` does **not** appear anywhere in
`tests/tests/specs/perm/`. Use the `count()` + message form.

**The absence assertion being complemented** (`perm-hide-category-tags.spec.ts:21-22`, and the
byte-parallel `perm-hide-election-tags.spec.ts:22-23`):

```ts
    await navigateToFirstQuestion(page);
    await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);
```

Both specs are 23–25 lines, identical skeleton: doc block (which states the setting under test AND a
`Rigidity contract:` line), three imports (`@playwright/test`, `testIds`, `navigateToFirstQuestion`),
one `test.describe` with one `test`, and an inline comment explaining the walk. **The presence assertion
goes immediately after the existing absence assertion, inside the same `test`**, and the doc block's
first paragraph must be extended to state the positive control (otherwise the header becomes a fourth
stale-comment instance of exactly the F10 class).

---

### 4. F9 positive control — the two dev-seed templates

**These two files are each other's analog** — each already demonstrates the edit the other needs.

`packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts:21-30` shows both the
`elections: 2` precondition and a `settingsOverlay`:

```ts
export const permHideElectionTagsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  elections: 2,
  settingsOverlay: {
    elections: { showElectionTags: false }
  }
});
```

`perm-hide-category-tags.ts:20-28` shows the `questions.showCategoryTags` overlay key:

```ts
export const permHideCategoryTagsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    questions: { showCategoryTags: false }
  }
});
```

So design A is literally a **cross-transplant**: add `elections: 2` to the category-tags template
(copied from the election-tags file), and add `questions: { showCategoryTags: true }` to the
election-tags template's `settingsOverlay` (copied from the category-tags file, value flipped).

**Option surface, `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:77-107`** — both keys are
first-class, no new plumbing:

```ts
export interface BuildMinimalOptions {
  /** Required: unique per-perm external_id prefix (e.g. `'e2e-perm-answers-locked-'`). */
  externalIdPrefix: string;
  ...
  /** Number of elections. Default: 1. All elections share the single CG/CO. */
  elections?: number;
  ...
  settingsOverlay?: Record<string, unknown>;
  /**
   * When `elections > 1`, controls which elections receive nominations.
   * Default: all elections receive nominations. ...
   */
  nominationsInElectionIndices?: Array<number>;
```

**File-shape conventions both templates share** (preserve them): doc block whose first lines state
*Topology:* then *Prefix:* then the auth posture and the spec's assertion; `const P = '<prefix>-';`;
`import { buildMinimal } from '../../_helpers/buildMinimal';` then
`import type { Template } from '../../../template/types';`; a named `export const …Template: Template`
followed by `export default …Template;`.

**Doc-block obligation:** both doc blocks currently describe the absence assertion only. They must be
updated in the same edit, or they become new stale comments.

---

### 5. F19 — the three unit test files

**The `expect(value, 'message').toX()` house form DOES exist in the frontend suite.** Analog:
`apps/frontend/src/lib/i18n/tests/utils.test.ts:25-31,55-58`:

```ts
  expect(matchLocale(['zn', '*'], available), 'Wildcard match from list').toEqual('fi-FI');
  expect(matchLocale(['fi', 'en-US'], available), 'Soft match from list').toEqual('fi-FI');
  expect(matchLocale(['de', 'zn'], available), 'No match from list').toBeUndefined();
  ...
  expect(translate(strings, 'bar'), 'Exact locale match').toEqual(strings.bar);
  expect(translate(strings, 'MISSING'), 'Default match').toEqual(strings[defLocale]);
```

Caveat for the planner: in this file the messages are terse *labels* ("Wildcard match from list"), not
failure explanations. The richer, failure-explaining register the F19 repair wants is the **`tests/`**
register — `perm-answers-locked.spec.ts:54` (`'profile page must render at least one visible input'`)
and the 27 teardown sites (`'runTeardown returned non-numeric rowsDeleted'`). Both are the same syntax;
use the `tests/` phrasing register with the frontend precedent for the syntax.

**Same-file idiom analog at site 3** — the correct null check already sits one line above the defect,
`__tests__/token-endpoint.test.ts:165-171`:

```ts
    expect(capturedFetchBody).not.toBeNull();
    const assertion = capturedFetchBody!.get('client_assertion')!;
    expect(assertion).toBeDefined();
```

The repair at this site matches its own neighbour on line 165, and drops the trailing `!` on `:166`.

Sites 1 and 2 (`__tests__/authorize-endpoint.test.ts:141-148`,
`providers/idura.test.ts:145-152`) are byte-parallel to each other: `new URL(...)` →
`url.searchParams.get('request')` → blind `toBeDefined()` → `requestParam!.split('.')` →
`toHaveLength(3)`. One repair diff, applied twice with the local variable names unchanged.

---

### 6. `140-NEGATIVE-CONTROL.md` (NEW — evidence document)

**Analogs: `137-NEGATIVE-CONTROL.md` (673 lines) and `138-NEGATIVE-CONTROL.md`.** 138 explicitly names
137 as its precedent, which itself names `136-VISUAL-DISCRIMINATION-EVIDENCE.md` — this is a
deliberate chain and 140 continues it. Reproduce this skeleton:

```
# Phase 140 — Negative Control: <the thing under control>

<bolded 2–4 sentence thesis: how many runs, how many halves, one machine, one session>

- **Date:** …
- **Plan:** `140-0N-PLAN.md` (wave N)
- **Decisions discharged:** D-xx (…), D-yy (…)
- **Requirements:** ASSERT-02, ASSERT-03, ASSERT-05, ASSERT-06
- **Precedent followed:** `.planning/phases/138-…/138-NEGATIVE-CONTROL.md`

---

## 1. Why this run existed
   - quotes the v2.15 STANDING ACCEPTANCE RULE, then blockquotes the ROADMAP success
     criterion verbatim, then states why an observation must be written down (it does
     not survive the session).

## 2. Environment
   - fenced block, aligned `key:  value` columns. 137/138 both carry exactly:
     date (UTC + local), repo root, git HEAD + branch, git status, OS, kernel, Node,
     Vite (root hoist), Vite (frontend), SvelteKit, Playwright, Supabase local.
   - 138 adds a blockquote explaining why the dirty files are inert to the control.
### Port allocation                 (table: Port | Held by | Role in this control)
### `lsof` for every port involved

## 3. The adversary / the injection — rebuildable on any machine
### Prerequisites            (fenced, exact commands)
### The invocation           (fenced, verbatim)
### What the knobs do, and the one that weakens the oracle

## 4. RUN 1 — blindness: the pre-repair assertion
### 4.1 Provenance           (proof the tree was genuinely unrepaired)
### 4.2 The invocation, verbatim
### 4.3 Observed             (verbatim output, not paraphrase)
### 4.4 The finding

## 5. RUN 2 — the catch: the repaired assertion, same scenario
### 5.1 Provenance           (the post-fix HEAD)
### 5.2 The invocation, verbatim
### 5.3 Observed
### 5.4 The two halves side by side      ← THE LOAD-BEARING TABLE
### 5.5 The finding
### 5.6 Discarded block — intermediate implementations, recorded rather than hidden

## 6. What this pair does and does not prove

## 7/8. Verdict — evidence mapped to ROADMAP criteria   ← THE SECOND TABLE
### What is explicitly NOT discharged by this document
### Reproducibility and non-contamination
```

**The two load-bearing tables, verbatim from the precedents.**

Side-by-side run record — `137-NEGATIVE-CONTROL.md:419-427` (four-run form):

```md
### 5.4 The four run records, side by side

| # | Check | Target | Exit | Verdict |
|---|---|---|---|---|
| 1a | retired (`node` process + title grep) | **:5373 foreign** | **0** | PASS — blind |
| 1b | retired (`node` process + title grep) | **:5273 ours** | **0** | PASS — indistinguishable from 1a |
| 2a | committed preflight | **:5373 foreign** | **1** | FAIL, clause (b), named |
| 2b | committed preflight | **:5273 ours** | **0** | PASS, and the suite proceeds (§5.3) |
```

and `138-NEGATIVE-CONTROL.md:362-368` (two-half form, with the invariant-adversary column):

```md
| Half | git HEAD | Adversary | Runs | Failures | Tri-state at settle release |
|---|---|---|---|---|---|
| RUN 1 — pre-fix | `360927495` | `FRONTEND_PORT=5273 …` | 5 | **5** | … |
| RUN 2 — post-fix | `e96e24a44` | `FRONTEND_PORT=5273 …` | 5 | **0** | … |
```

> For F19 the columns MUST include the **failing `file:line`** and must separate the assertion outcome
> from the file outcome (Phase 139's TWO-COLUMN RULE) — "the file went red both times" is not evidence;
> the moving line number is.

Verdict mapping — `137-NEGATIVE-CONTROL.md:629-636`:

```md
## 8. Verdict — evidence mapped to ROADMAP criteria

| ROADMAP criterion | Discharged by | Status |
|---|---|---|
| **1** — … | §4.3 (run 1a exit 0 …) **and** §5.1 (run 2a exit 1 …) | **DISCHARGED** |
| **3** — … | §6 (four invocation shapes, all exit 1, zero spec output) | **DISCHARGED locally** |
| **4** — … | Not this plan. Plan 137-04. | **out of scope here** |
```

Both precedents follow this with a `### What is explicitly NOT discharged by this document` bullet list
that enumerates the honest gaps (CI, full-suite green, non-macOS platforms). **Reproduce that section —
it is the part that makes the document evidence rather than advocacy.**

---

## Shared Patterns

### Assertion-with-message (`expect(actual, 'why')`)
**Source:** `tests/tests/setup/perm/perm-hide-category-tags.teardown.ts:16`,
`tests/tests/specs/perm/perm-answers-locked.spec.ts:54`,
`apps/frontend/src/lib/i18n/tests/utils.test.ts:25`
**Apply to:** the F3 helper, both F9 presence assertions, all three F19 repairs.
Both runners (Playwright `expect` and vitest `expect`) accept the second argument; it is already the
repo's convention on the exact lines being remediated, so **every** new assertion in this phase should
carry a message naming what is missing.

### Config-load / boot-time throw
**Source:** `tests/playwright.config.ts:18-47`
**Apply to:** the F10 counted guard.
`throw new Error(<what> + <items> + <remedy naming the in-file symbol> + <parenthesised provenance>)`.
Never `process.exit`; never a `console.warn`.

### Doc block states the *rationale*, not just the *what*
**Source:** `tests/tests/setup/shared/base.teardown.ts:1-21` (four paragraphs, including a
"Teardown-ownership" paragraph justifying the prefix narrowing), `tests/playwright.config.ts:29-31`
**Apply to:** the new helper, both edited templates, both edited specs, the `voter-journey.spec.ts` header.
Every file this phase touches carries a header comment that will become FALSE as a result of the edit
(the two spec headers, the two template headers, the `voter-journey.spec.ts` budget line). **Updating the
header is part of every edit in this phase, not a follow-up** — F10 exists precisely because a header
was allowed to drift.

### `Rigidity contract:` header line
**Source:** `perm-hide-category-tags.spec.ts:6`, `perm-hide-election-tags.spec.ts:7` (68 files in
`tests/` carry one)
**Apply to:** the two F9 specs (unchanged — no soft assertions are added) and the F10 header rewrite,
where the budget must become a **named constant** referenced by the guard rather than a prose number.

### Prefix-scoped PostgREST query
**Source:** `packages/dev-seed/src/supabaseAdminClient.ts:839-845`;
builder at `tests/tests/utils/supabaseAdminClient.ts:194-197`; call sites at
`tests/tests/setup/shared/setupFromTemplate.ts:101,106`
**Apply to:** the F3 before/after probe. `client.query('<table>').like('external_id', `${prefix}%`)`,
throw on `error` with a `<fn> failed: ${error.message}` message.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| — | — | — | None. Every target in this phase has a real in-tree analog. |

Two near-misses worth flagging so the planner does not over-trust the match:

- **`assertTeardown.ts`** has no *functional* analog (no assertion helper exists anywhere under
  `tests/tests/setup/`). Its module shape is well-precedented; its **body is new code**. The closest
  behavioural prior art for "helper that wraps a dev-seed call plus harness policy" is
  `setupFromTemplate.ts` (which does pre-clear + seed + a post-seed exact-equality `app_settings`
  assertion at `:256-260`) — read that file's assertion section before writing the helper's.
- **The F19 message register.** The `expect(x, 'msg')` *syntax* is precedented in the frontend suite,
  but every frontend instance uses a short label, not a failure explanation. The explanatory register
  the repair needs is precedented only in `tests/`. Cross-register borrowing is intended, not accidental —
  state it in the plan so a reviewer does not read it as inconsistency.

---

## Metadata

**Analog search scope:** `tests/tests/setup/**`, `tests/tests/specs/perm/**`, `tests/tests/utils/**`,
`tests/playwright.config.ts`, `packages/dev-seed/src/templates/e2e/perm/**`,
`packages/dev-seed/src/templates/_helpers/`, `packages/dev-seed/src/supabaseAdminClient.ts`,
`apps/frontend/src/lib/**/*.test.ts`, `.planning/phases/137*/`, `.planning/phases/138*/`
**Files read in full or in targeted ranges:** 16
**Pattern extraction date:** 2026-08-15
