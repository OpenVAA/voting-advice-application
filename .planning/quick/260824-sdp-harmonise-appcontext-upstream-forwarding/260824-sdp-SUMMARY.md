---
quick_id: 260824-sdp
slug: harmonise-appcontext-upstream-forwarding
type: quick
date: 2026-08-24
status: complete
tasks_completed: 3
tasks_total: 3
files_changed: 3
commits:
  - c61eef21a
  - ce0f5e746
  - 8396d858d
---

# Quick Task 260824-sdp: Harmonise appContext's upstream forwarding — Summary

`AppContextProvider`'s upstream forwarding now uses the repo's ONE mechanism for this
problem. The hand-rolled `dataRoot` accessor install and the 11-key `Object.assign`
value-copy are gone; `dataCtx` and `tracking` are forwarded WHOLESALE by
`inheritContextMembers` (the Phase 113 CR-01 descriptor-preserving forwarder already
used by voterContext / candidateContext / adminContext), and `componentCtx` stays a
deliberate two-member selective forward. Pure mechanism harmonisation — same members,
same own-enumerability, same reactivity.

## Task 1 — upstream surface proof (the gate for Task 2)

### Tracking: PASS — exactly 8 own-enumerable members

Runtime-proven, not asserted from reading. The new case in
`apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts` constructs
the real service via the `trackingService({ appSettings, userPreferences })` factory
inside `$effect.root` and asserts `Object.keys(svc).sort()` with `toEqual` (an EXACT
lock, not a `toContain` superset check).

To capture the actual list verbatim rather than merely observing a green assertion, the
expectation was temporarily forced to `['__PROVE_ACTUAL__']`. Observed actual, verbatim
from the failure diff:

```
+   "resetAllEvents",
+   "sendTrackingEvent",
+   "sessionId",
+   "shouldTrack",
+   "startEvent",
+   "startPageview",
+   "submitAllEvents",
+   "track",
```

Eight members, exactly the eight appContext hand-listed before this change. The forced
failure was reverted immediately (`cp` from a scratchpad backup) and the file re-run
green before commit; it was never committed.

**Gate decision: BLANKET FORWARD APPROVED for tracking** → Task 2 step 3c executed,
`inheritContextMembers(this, this.#tracking)`.

The case carries a comment explaining why it is an exact lock: appContext now
blanket-forwards this producer's whole own-enumerable surface, so any new public member
here silently widens appContext's public runtime surface beyond the `AppContext` type,
and the appContext spread guard is a superset check that is blind to widening.

### dataCtx: PASS — exactly `dataRoot` + `setDataRoot`

`grep -nE "^  (readonly )?[A-Za-z_$][A-Za-z0-9_$]*[!:= ]" apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`

```
10:  if (!hasContext(CONTEXT_KEY)) error(500, 'getDataContext() called before initDataContext()');
11:  return getContext<DataContext>(CONTEXT_KEY);
53:  readonly #dataRoot: DataRoot;
62:  readonly dataRoot!: DataRoot;
97:  setDataRoot = (updater: (dataRoot: DataRoot) => void): void => {
107:  if (hasContext(CONTEXT_KEY)) error(500, 'initDataContext() called for a second time');
108:  const { locale, t } = getI18nContext();
110:  const dataRoot = new DataRoot({ locale });
116:  return setContext<DataContext>(CONTEXT_KEY, new DataContextProvider(dataRoot));
```

Of these, only lines 53 / 62 / 97 are class members: `#dataRoot` (private), `dataRoot`,
`setDataRoot`. Lines 10/11/107/108/110/116 are bodies of the module-level
`getDataContext()` / `initDataContext()` functions, matched incidentally by the
two-space indent; line 53 matched on the literal word `readonly`, not on an identifier.
`#version = $state(0)` (line 54) is `#`-private and correctly filtered out.

`grep -n "defineProperty(this," apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`

```
57:  // Installed via `Object.defineProperty(this, 'dataRoot', { enumerable: true })` in
81:    Object.defineProperty(this, 'dataRoot', {
```

**Deviation from the plan's stated expectation (documentation only, not a finding):**
the plan expected exactly ONE hit; there are TWO, because line 57 is a COMMENT quoting
the construct and line 81 is the single real install. The substantive expectation — one
`dataRoot` accessor install — holds.

**Gate decision: BLANKET FORWARD APPROVED for dataCtx** → `inheritContextMembers(this, this.#dataCtx)`.

### Ordering constraint — preserved

Read from `appContext.svelte.ts` before editing: `this.#tracking = trackingService({…})`
was at line 314; the `EXPLICIT FORWARDING` block header at line 321; the hand-rolled
`dataRoot` install at 335; the `Object.assign` at 343. Producers strictly BEFORE
forwarding.

Post-change line numbers (nothing reordered, only the block's own content rewritten):

| Statement | Line |
|---|---|
| `this.#tracking = trackingService({` | 325 |
| `EXPLICIT FORWARDING` block header | 333 |
| `Object.assign(this, {` (componentCtx selective) | 362 |
| `inheritContextMembers(this, this.#dataCtx);` | 370 |
| `inheritContextMembers(this, this.#tracking);` | 378 |

## Task 2 — the refactor

Final shape of the forwarding block (three statements, in this order; each preceded by
its own explanatory comment, omitted here):

```ts
Object.assign(this, {
  t: this.#componentCtx.t,
  translate: this.#componentCtx.translate
});

inheritContextMembers(this, this.#dataCtx);

inheritContextMembers(this, this.#tracking);
```

Import added at line 16, `import { inheritContextMembers } from '../utils/inheritContextMembers';`,
in the `../` sibling form, sorted between `'../data'` and `'../utils/persistedState.svelte'`
(eslint's import sorter accepted it unchanged; lint-staged's `eslint --fix` made no
modification).

Deleted: the hand-rolled `Object.defineProperty(this, 'dataRoot', { get() { … } })`
install and its comment paragraph; the `setDataRoot` value-copy line; the eight
hand-listed tracking key/value pairs.

### Comments rewritten

| Location | Change |
|---|---|
| Class docblock, "Spread-of-context fix" paragraph | Mechanism list now names three mechanisms — the selective `Object.assign`, `inheritContextMembers` for the whole dataCtx + tracking surfaces, and `Object.defineProperty` / handle-object fields for this context's own reactive members. Phase-109 framing and meaning unchanged. |
| `appSettings` / `locale` field-declaration comment | Reworded the construct reference to `Object.defineProperty(…, { enumerable: true })` so it no longer contains the literal `Object.defineProperty(this,` token — otherwise it would defeat the `→ 2` structural grep. Semantics unchanged. |
| `t` / `translate` field-declaration comment | Now says SELECTIVE forward (only these two, by reference), pointing at the block for why not wholesale. |
| `dataRoot` / `setDataRoot` field-declaration comment | Now describes inheritance WHOLESALE from `dataContext` via the helper, with `dataRoot` arriving as a live forwarding accessor that is still own-enumerable and therefore still spread-safe. |
| Tracking field-declaration comment | Now describes the wholesale inherit and names the exact-surface lock in `trackingService.svelte.test.ts` as what keeps it honest. |
| `EXPLICIT FORWARDING` block header | Rewritten: two mechanisms chosen per upstream; why descriptor preservation is load-bearing (a value copy of a bare reactive accessor invokes the getter once at construction and freezes reactivity — the Phase 113 CR-01 reason); the `enumerable: true` / downstream `{ ...appContext }` spread-safety constraint retained. |

Removed mechanisms are described in prose only — no verbatim quoting of the deleted
constructs, so the negative greps stay meaningful.

### Structural gates — all 8 hold

```
import: 1
dataCtx inherit: 1
tracking inherit: 1
NEG defineProperty dataRoot: 0
NEG tracking hand-list: 0
NEG dataCtx setDataRoot: 0
POS componentCtx translate: 1
defineProperty(this, count: 2
```

## Task 3 — the dataRoot live-forwarding guard

The stub in `appContext.spread.svelte.test.ts` declared `dataRoot` as a plain DATA
property, so after Task 2 the accessor path was untested — a plain-data source makes
`inheritContextMembers` take its value-copy branch, which would have let a value-copy
regression pass silently.

Changes: `dataRoot` is now an own-enumerable object-literal GETTER over a mutable
`dataRootHolder` created in the `vi.hoisted` block (the same descriptor shape production
installs); `setDataRoot` remains an arrow-field-shaped data property; the holder is reset
to its initial value in `afterEach` alongside `cleanup?.()` / `vi.clearAllMocks()`. One
new case reads `instance.dataRoot`, replaces the holder value, and reads again —
asserted on the INSTANCE, not on a spread copy, since the spread necessarily snapshots.
No existing case was weakened, reordered or deleted; `EXPECTED_KEYS` is untouched.

### Negative control — observed, both directions

Temporarily replaced `inheritContextMembers(this, this.#dataCtx);` with a value copy
(`Object.assign(this, { dataRoot: this.#dataCtx.dataRoot, setDataRoot: this.#dataCtx.setDataRoot });`)
and re-ran the same spec:

```
 FAIL  src/lib/contexts/app/appContext.spread.svelte.test.ts > AppContextProvider — own-enumerability spread guard > dataRoot is forwarded LIVE from dataContext, not snapshotted at construction
AssertionError: expected { marker: 'dataRoot-initial' } to be { marker: 'dataRoot-replaced' } // Object.is equality

- Expected
+ Received

  {
-   "marker": "dataRoot-replaced",
+   "marker": "dataRoot-initial",
  }

 ❯ src/lib/contexts/app/appContext.spread.svelte.test.ts:242:42

 Test Files  1 failed (1)
      Tests  1 failed | 3 passed (4)
```

The other three cases still passed under the value copy — they are blind to the
regression, which is exactly why the new case was needed.

Reverted with `git checkout -- apps/frontend/src/lib/contexts/app/appContext.svelte.ts`;
`git diff --name-only` then listed only the test file, confirming the temporary edit left
no residue. Re-run with the helper restored:

```
 ✓ src/lib/contexts/app/appContext.spread.svelte.test.ts (4 tests) 4ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

The negative-control state was never committed.

## Verification results

| Check | Result |
|---|---|
| `test:unit src/lib/contexts/app/tracking/trackingService.svelte.test.ts` | **1 file passed, 8 tests passed (8)** — 7 pre-existing + the new exact-surface lock |
| `test:unit src/lib/contexts` | **15 files passed (15), 81 tests passed (81)** |
| `test:unit src/lib/contexts/app/appContext.spread.svelte.test.ts` | **1 file passed (1), 4 tests passed (4)** |
| `yarn workspace @openvaa/frontend test:unit` (whole frontend) | **54 files passed (54), 775 tests passed (775)**, exit 0 |
| `yarn workspace @openvaa/frontend typecheck` | `COMPLETED 2081 FILES 24 ERRORS 0 WARNINGS 16 FILES_WITH_PROBLEMS` — **byte-identical to the pre-change baseline**; 0 diagnostics mention `appContext.svelte.ts` or `appContext.spread`. Net-new: **ZERO**. |
| `yarn workspace @openvaa/frontend lint` | exit 0, `1 problem (0 errors, 1 warning)` — same single pre-existing warning as baseline (`candidateContext.svelte.test.ts:39` unused `question`), 0 diagnostics on the touched files. Net-new: **ZERO**. |
| `prettier --check` on all three touched files | `All matched files use Prettier code style!` |

The 24 typecheck errors are pre-existing and unrelated (missing `$lib/paraglide/*`
generated modules — the Paraglide output is a build artifact absent from this working
tree). Identical count, files and messages before and after the change.

### git diff --stat (the three commits)

```
 .../contexts/app/appContext.spread.svelte.test.ts  |  50 +++++++++-
 .../src/lib/contexts/app/appContext.svelte.ts      | 102 ++++++++++++---------
 .../app/tracking/trackingService.svelte.test.ts    |  31 +++++++
 3 files changed, 138 insertions(+), 45 deletions(-)
```

Exactly three files. `inheritContextMembers.ts`, `dataContext.svelte.ts` and
`trackingService.svelte.ts` verified byte-unchanged via `git diff --quiet` per file.

## Commits

| Commit | Task | Message |
|---|---|---|
| `c61eef21a` | 1 | `test(quick/260824-sdp): lock trackingService's exact own-enumerable surface` |
| `ce0f5e746` | 2 | `refactor(quick/260824-sdp): forward dataCtx and tracking via inheritContextMembers` |
| `8396d858d` | 3 | `test(quick/260824-sdp): lock dataRoot live-forwarding through the dataCtx inherit` |

All three landed on `ship/v0.2-akita-12-refactor-and-fix` through the husky/lint-staged
pre-commit hook with no `--no-verify` anywhere.

## Deviations

**[Rule 3 — Blocking] Missing `apps/frontend/.svelte-kit/tsconfig.json`.** The first
unit-test invocation aborted with
`TSConfckParseError: failed to resolve "extends":"./.svelte-kit/tsconfig.json"` — the
SvelteKit-generated tsconfig was absent from this working tree. Fixed by running
`yarn workspace @openvaa/frontend exec svelte-kit sync`. Generated artifact, gitignored,
nothing committed. No source change.

No other deviations; no Rule 4 (architectural) situations; no auth gates.

## Residual gaps and optional follow-ups

1. **`dataContext` has no runtime surface lock.** Its surface is grep-proven, not
   runtime-proven, because `DataContextProvider` is not exported and `initDataContext()`
   needs a live Svelte context — a runtime lock would require adding a test seam
   (deliberately out of scope per the plan). The class is ~100 lines with an unambiguous
   surface, so the residual risk is that a future contributor adds a public
   own-enumerable member there and silently widens appContext's surface. If that seam is
   ever added for another reason, mirror the tracking exact-`Object.keys` case onto it.
2. **Stale cross-file line-number citations, left untouched by instruction.**
   `trackingService.svelte.ts:34` still says "consumed via `...tracking` spread
   (`appContext.svelte.ts:299`)" and `:49` cites "appContext:249"; `dataContext.svelte.ts:56`
   still describes appContext re-exposing it via `{ ...dataCtx }`. Both files were on the
   plan's DO-NOT-MODIFY list. The spread phrasing has been inaccurate since Phase 109
   (the instance-spreads were removed then) and is now doubly so. Cheap doc-only cleanup.
3. **`appContext.spread.svelte.test.ts` header comment** still cites
   `candidateContext.svelte.ts:366` / `adminContext.svelte.ts:98` / `voterContext.svelte.ts:488`;
   `voterContext` now inherits at 388 and `candidateContext` at 313. Not touched — outside
   this task's scope.
4. **POST-TASK GATE, NOT RUN HERE (counts as not-run, not as a pass).** Per `CLAUDE.md`'s
   E2E hard rule, `yarn test:e2e` must be run before this change is considered shipped —
   `appContext` is the root context of both apps. It needs one fresh dev server on :5173
   plus a clean DB, which this task's orchestrator did not start, and the plan explicitly
   placed it outside the task:
   ```
   yarn db:reset && yarn dev      # terminal 1, wait for healthy
   yarn test:e2e                  # terminal 2; must be 0 failed, 0 did-not-run
   ```

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — FOUND
- `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` — FOUND
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts` — FOUND
- `.planning/quick/260824-sdp-harmonise-appcontext-upstream-forwarding/260824-sdp-SUMMARY.md` — FOUND
- Commit `c61eef21a` — FOUND
- Commit `ce0f5e746` — FOUND
- Commit `8396d858d` — FOUND
