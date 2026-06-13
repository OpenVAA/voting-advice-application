# Phase 114: Store → State Rename - Research

**Researched:** 2026-06-13
**Domain:** Mechanical identifier/file/type rename across SvelteKit frontend (rune-native contexts)
**Confidence:** HIGH

## Summary

Phase 114 renames the rune-native `*Store` identifiers to `*State` across `apps/frontend/src`.
These symbols were named "Store" historically but, after the Phase 106–113 class conversions, there
are **no Svelte stores behind any of them** — they are plain classes / factory functions / `$state`-backed
fields. The rename covers identifiers, file names, PascalCase type names, and test names. Two genuine
exceptions stay and must be documented: the server-side `jobStore` (a real in-memory data registry) and
the `cookieStore` test mock.

This is a purely mechanical, zero-behavior-change phase. The single non-mechanical risk is **two
localStorage key string literals** that embed `Store` (`'VoterContext-answerStore'` and
`'CandidateContext-candidateUserDataStore-editedAnswers'`). Renaming those literals would orphan existing
users' persisted answers — a behavior change. The recommendation is to **leave the persisted-key string
literals unchanged** (rename only code identifiers), or, if the planner wants name-consistency, to do it
as an explicit, separately-justified decision. The grep gate must therefore exclude string-literal key
contents, not just code.

The substring-collision surface is real but small and fully enumerated below. The safe mechanism is the
project's established pattern (used in Phase 113): **`git mv` for files + a word-boundary-anchored,
allowlist-driven codemod** (a small `.mjs` script or `sed` with `\b` anchors), run longest-name-first to
avoid double-rename, with `LocallyStoredValue`/`StoredValue`, `svelte/store`, the server `jobStore`, and
`cookieStore` explicitly excluded.

**Primary recommendation:** Rename code identifiers + file names + type names with `git mv` + a
word-boundary codemod ordered longest-token-first; **leave the two `*Store` localStorage key string
literals untouched** (orphans persisted data otherwise); gate on `svelte-check 151/0`, `build 14/14`,
`vitest ~762–766 passed`, plus the grep gate (zero rune-context `*Store` identifiers minus the documented
exclusions).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rune-native context state classes/factories | Frontend (client) | — | All in-scope `*Store` symbols are SvelteKit client-side `lib/contexts/**` runes |
| Server job registry (`jobStore`) | Frontend Server (SSR/`+server.ts`) | — | `lib/server/admin/jobs/jobStore.ts` is a genuine module-level in-memory registry — OUT of scope |
| Test mock (`cookieStore`) | Test harness | — | Local `Map` in auth endpoint tests — OUT of scope |

This is a single-tier (client) rename. The only cross-tier concern is that the client `admin/jobStores`
context imports `JobInfo` (a TYPE) from the server `jobStore.type.ts` — renaming the client context must
NOT touch the server `Job*` types or the server file.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RENAME-01 | Rename all rune-native `*Store` symbols → `*State` (identifiers, file names, type names, test names) covering the 12 listed symbols; grep gate confirms zero remaining rune-context `*Store` identifiers (minus exclusions). | Complete rename map + per-symbol declaration files, exported identifiers, type names, file-rename list, and usage-site counts in `## Rename Map`. Gate grep in `## Grep Gate`. |
| RENAME-02 | Exclude + document server `jobStore` and `cookieStore` mock; client `admin/jobStores` IS renamed. | Exclusion inventory + verification that the exclusion list is complete (no real `writable` named `*Store` in scope) in `## Exclusion Inventory`. |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None beyond ROADMAP success criteria — `## Implementation Decisions` says all choices are Claude's discretion.
ROADMAP-derived constraints (treated as locked):
- Rename covers identifiers, file names, type names, AND test names.
- Grep gate confirms zero remaining rune-context `*Store` identifiers (minus documented exclusions).
- Server `jobStore` + `cookieStore` mock excluded and documented; client `admin/jobStores` IS renamed.
- `yarn build` + `yarn vitest run` + `yarn svelte-check` green; no behavior change.
- Use `git mv` for file renames to preserve history where practical.

### Claude's Discretion
All implementation choices (rename mechanism, ordering, codemod vs sed). Pure mechanical rename.

### Deferred Ideas (OUT OF SCOPE)
- Straggler `svelte/store` clearance (`videoPreferences` writable) → Phase 115 (SWEEP-01..03).
- Milestone-close green gate → Phase 116.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- **Context Destructuring Rule (Svelte 5):** Reactive accessors must be read via `ctx.X`, never
  destructured. **A pure identifier rename does not change destructuring shape** — none of the in-scope
  symbols are reactive-accessor *names* on a context object (they are factory functions / classes / file
  modules). The rename must NOT introduce or remove any destructuring; verify the spike-009 PASS-4 audit
  / build still pass post-rename.
- **Svelte warning-accepted format / `// reason:` blocks** — unaffected; no warnings introduced by a rename.
- **Use TypeScript strictly, avoid `any`** — rename is type-preserving.
- **Localization** — N/A (no user-facing strings renamed; see persisted-key caveat below, which is a
  storage key, not a locale string).
- **`yarn build` rebuilds packages** — frontend depends on `@openvaa/*` packages; build the frontend
  (and any dependee) to verify runtime resolution after file renames.

## Rename Map

Authoritative per-symbol inventory. **Word-boundary counts** are `grep -rwn` across
`apps/frontend/src/**/*.{ts,svelte}`. "Decl file" = where the symbol is declared/exported.

### Symbols WITH dedicated files (file `git mv` + identifier + type rename)

| Symbol (`*Store`→`*State`) | Decl file(s) | Exported identifier(s) | Type name(s) | Files to `git mv` | Code sites |
|---|---|---|---|---|---|
| `answerStore`→`answerState` | `lib/contexts/voter/answerStore.svelte.ts` (+`.type.ts`, +`.svelte.test.ts`) | `answerStore()` fn; internal `AnswerStoreImpl` class | `AnswerStore` (17 sites), `AnswerStoreImpl` (3) | `answerStore.svelte.ts`, `answerStore.type.ts`, `answerStore.svelte.test.ts` | 16 |
| `popupStore`→`popupState` | `lib/contexts/app/popup/popupStore.svelte.ts` (+`.type.ts`, +`.svelte.test.ts`) | `popupStore()` fn | `PopupStore` (13), `PopupStoreApi` (3) | `popupStore.svelte.ts`, `popupStore.type.ts`, `popupStore.svelte.test.ts` | 15 |
| `candidateUserDataStore`→`candidateUserDataState` | `lib/contexts/candidate/candidateUserDataStore.svelte.ts` (+`.type.ts`, +`.svelte.test.ts`) | `candidateUserDataStore()` fn | `CandidateUserDataStore` (9), `CandidateUserDataStoreImpl` (3) | `candidateUserDataStore.svelte.ts`, `candidateUserDataStore.type.ts`, `candidateUserDataStore.svelte.test.ts` | 14 |
| `matchStore`→`matchState` | `lib/contexts/voter/matchStore.svelte.ts` | `matchStore()` fn; `MatchTree` type (export) | `MatchStoreDeps` (4), `MatchStoreImpl` (2) | `matchStore.svelte.ts` | 10 |
| `filterStore`→`filterState` | `lib/contexts/voter/filters/filterStore.svelte.ts` | `filterStore()` fn; `FilterTree` type (export) | `FilterStoreDeps` (4), `FilterStoreImpl` (2) | `filterStore.svelte.ts` | 12 |
| `nominationAndQuestionStore`→`nominationAndQuestionState` | `lib/contexts/voter/nominationAndQuestionStore.svelte.ts` | `nominationAndQuestionStore()` fn; `NominationAndQuestionTree` type | `NominationAndQuestionStoreDeps` (4), `NominationAndQuestionStoreImpl` (2) | `nominationAndQuestionStore.svelte.ts` | 8 |
| `paramStore`→`paramState` | `lib/contexts/utils/paramStore.svelte.ts` | `paramStore()` fn | `ParamStoreImpl` (2) | `paramStore.svelte.ts` | 6 |
| `questionBlockStore`→`questionBlockState` | `lib/contexts/utils/questionBlockStore.type.ts` | (type-only file) | exports `QuestionBlocks` type — **type name has NO "Store"**; only the file name + comment refs carry "Store" | `questionBlockStore.type.ts` | 7 |
| client `jobStores`→`jobState` (or `jobStores`→`jobStates`) | `lib/contexts/admin/jobStores.svelte.ts` (+`.type.ts`, +`.svelte.test.ts`) | `jobStores()` fn; `JobStoresProvider` class | `JobStores` (8), `JobStoresProvider` (9) | `jobStores.svelte.ts`, `jobStores.type.ts`, `jobStores.svelte.test.ts` | (see note) |

**Note on `jobStores`:** plural ("Stores"). It holds two job collections, so the natural rename is
`jobStores`→`jobStates` / `JobStores`→`JobStates` / `JobStoresProvider`→`JobStatesProvider`. The planner
should pick one form and apply consistently. Consumers: `adminContext.svelte.ts` (`jobs = jobStores()`),
`adminContext.type.ts` (`jobs: JobStores`), `admin/index.ts` barrel (`export * from './jobStores.type'`).
The client file imports `JobInfo` (TYPE) from the **server** `jobStore.type.ts` — that import path and
the `JobInfo`/`Job*` server types are OUT of scope and must not change.

### Symbols that exist ONLY in comments / doc-strings (NO live code identifier)

These have no declaration to rename — they appear only inside `// ...` historical comments referencing the
pre-class helper-store design. **Decision needed (low-stakes):** update the comment text for accuracy, or
leave as historical record. Recommendation: update them so the grep gate is clean and the comments don't
mislead future readers.

| Symbol | Sites (comments only) |
|---|---|
| `questionStore` | `candidateContext.svelte.ts:197` (comment), `voterContext.svelte.ts:94` (comment), `voterContext.svelte.ts:480` (comment) |
| `questionCategoryStore` | `candidateContext.svelte.ts:197` (comment), `voterContext.svelte.ts:93` (comment) |
| `pageDatumStore` | `appContext.svelte.ts:369` (comment: "replaces pageDatumStore per …") |
| `questionBlockStore` (the *comment* refs, separate from the file) | `candidateContext.svelte.ts:197`, `voterContext.svelte.ts:94,519` (comments) |

### Symbol that is a PRIVATE FIELD only (rename field, no file)

| Symbol | Decl | Sites |
|---|---|---|
| `editedAnswersStore`→`editedAnswersState` | `candidateUserDataStore.svelte.ts:51` — private class field `#editedAnswersStore` | 7 sites, ALL inside `candidateUserDataStore.svelte.ts` (lines 51, 64, 144, 197, 204, 211, 246). Self-contained — rename the `#editedAnswersStore` field in one file. |

### Rename totals (gate denominators)

- In-scope **camelCase** `*Store` identifier + filename sites (the 12 symbols): **97** word-boundary matches.
- In-scope **PascalCase** type sites (excluding server `jobStore`): **47** word-boundary matches.
- These are the numbers the grep gate must drive to **zero** (minus exclusions + intentionally-kept string literals).

## Exclusion Inventory (RENAME-02)

| Excluded symbol | Location | Why kept | Document as |
|---|---|---|---|
| Server `jobStore` (functions: `createJob`, `getJob`, `updateJobProgress`, … + file) | `lib/server/admin/jobs/jobStore.ts`, `jobStore.type.ts` | Genuine module-level in-memory data registry (a real "store"), not a rune. | Intentional exception (RENAME-02). |
| Server `Job*` types (`JobInfo`, `JobMessage`, `JobStatus`, `PastJobStatus`, `ActiveJobStatus`, …) | `lib/server/admin/jobs/jobStore.type.ts` | These are server-domain types, NOT `*Store`-suffixed identifiers; the client context imports `JobInfo` by reference. | No rename — they don't match the `*Store` pattern anyway. |
| `cookieStore` test mock | `lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` (5 sites), `token-endpoint.test.ts` (3 sites) | Local `Map` mock of a cookie jar — not a rune, not a Svelte store. | Intentional exception (RENAME-02). |
| `videoPreferences` `writable` | `lib/components/video/component-stores.ts` | A **real** `svelte/store` `writable` — but it is **not named `*Store`** (the identifier is `videoPreferences`; the FILE is `component-stores.ts`). NOT in the rename list. Its conversion is Phase 115 (SWEEP-01). | Out of scope — Phase 115. |
| `LocallyStoredValue` / `…StoredValue` | `lib/contexts/utils/persistedState.svelte.ts` (lines 10, 192) | Contains the substring `Stored`/`Store` but is `StoredValue`, NOT a `*Store` symbol. | **Substring trap — must be excluded from any codemod.** |

**Exclusion-completeness verification (RENAME-02):**
- Only ONE `svelte/store` import remains in `apps/frontend/src`: `component-stores.ts` (`videoPreferences`) — verified via `grep -rn "from 'svelte/store'"`. It is not a `*Store`-named symbol, so it does not collide with the rename and is correctly out of scope (Phase 115).
- No other real `writable`/`readable`/`derived` store is named `*Store` anywhere in `src`. **The exclusion list (server `jobStore`, `cookieStore`) is complete.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Tree-wide identifier rewrite | Hand-edit 97+47 sites | Word-boundary `sed`/`.mjs` codemod with an explicit allowlist (the Phase-113 pattern) | 144 sites across ~30 files; manual edits miss sites and risk substring corruption |
| File rename preserving git history | `mv` + `git add` | `git mv old new` | Preserves blame/log across the rename (CONTEXT.md asks for history preservation) |
| Detecting leftover sites | Eyeball | The grep gate (below) | Deterministic, re-runnable, becomes the verification artifact |

**Key insight:** Phase 113 already established the project's mechanical-rewrite pattern — a small dry-run-by-default
`.mjs` codemod with an explicit allowlist, plus an audit grep (`apps/frontend/scripts/flatten-current-codemod.mjs`).
Mirror that shape rather than inventing a new tool. `ts-morph` is overkill for a pure rename; word-boundary `sed`
or a tiny `.mjs` is sufficient and matches precedent.

## Architecture Patterns

### Recommended rename mechanism

1. **Files first (`git mv`)** — rename `.svelte.ts`, `.type.ts`, `.svelte.test.ts` triplets per symbol.
   Then fix the import specifiers that referenced the old paths (the `from './answerStore.svelte'`,
   `from './answerStore.type'`, barrel `export * from './answerStore.type'`, and the `$lib/...` aliased
   imports like `QuestionHeading.type.ts`).
2. **Identifiers + types via word-boundary codemod**, run **longest-token-first** to defeat substring
   collisions. Anchor every replacement with `\b`:
   ```bash
   # Order matters: longest names BEFORE their substrings.
   # editedAnswersStore  BEFORE  answerStore
   # nominationAndQuestionStore  BEFORE  questionStore
   # candidateUserDataStore (standalone)
   # …then the rest.
   ```
3. **Exclude** `LocallyStoredValue`/`StoredValue`, `svelte/store`, `server/admin/jobs/jobStore`,
   `cookieStore` from the codemod's file/line scope.
4. **Leave string literals alone** (see Pitfall 2).
5. Re-run the grep gate; iterate to zero.

### Anti-Patterns to Avoid
- **Naive `sed s/Store/State/g`:** corrupts `LocallyStoredValue`→`LocallyStatedValue`, `cookieStore`,
  server `jobStore`, and the substring pairs. Always `\b`-anchor and allowlist.
- **Renaming the persisted-key string literals:** orphans existing users' localStorage answers — a
  behavior change in a "no behavior change" phase.
- **Running this concurrently with another large rewrite:** Phase 113 noted the v2.12 collision lesson.
  Run Phase 114 alone.

## Common Pitfalls

### Pitfall 1: Substring collisions between in-scope symbols
**What goes wrong:** `answerStore` is a substring of `editedAnswersStore`? — No (capital `A` in
`editedAnswersStore`'s `Answers`), but `questionStore` (lowercase `q`) is NOT a substring of
`nominationAndQuestionStore` (capital `Q`) either — verified, the camelCase boundary protects these.
The real traps are: (a) PascalCase `AnswerStore` is a substring of nothing in-scope but appears in
`answerStore.type` imports; (b) `Store` substring inside `StoredValue`.
**Why it happens:** Unanchored `sed`.
**How to avoid:** `\b`-anchor; run longest-first; the only genuine substring trap is `StoredValue` —
exclude `persistedState.svelte.ts` lines 10/192 (or the token `StoredValue`).
**Warning signs:** `LocallyStoredValue` appears changed in `git diff`.

### Pitfall 2: localStorage key string literals embed `Store` (DATA-ORPHANING)
**What goes wrong:** Two persisted-storage keys contain `Store`:
- `'VoterContext-answerStore'` — `answerStore.svelte.ts:31` (`localStorageState(...)`) + `answerStore.svelte.test.ts:57` (assertion).
- `'CandidateContext-candidateUserDataStore-editedAnswers'` — `candidateUserDataStore.svelte.ts:52`.

Renaming these literals to `*State` changes the storage namespace, so returning users lose their saved
answers / edited answers (the new code reads a key that doesn't exist yet). **That is a behavior change.**
**Why it happens:** A blanket identifier rename treats the string literal like code.
**How to avoid (RECOMMENDED):** **Keep the key string literals unchanged.** Rename only the code
identifier/field. The test assertion at `answerStore.svelte.test.ts:57` must continue asserting the
ORIGINAL key `'VoterContext-answerStore'` (do not rename inside the quotes). The grep gate must therefore
exclude `*Store` occurrences inside single/double-quoted string literals.
**Alternative (only if planner explicitly chooses):** rename the key AND add a one-time migration that
copies the old key's value to the new key — but that is extra scope and risk for a mechanical phase;
not recommended.
**Warning signs:** `git diff` shows a changed `localStorageState('...')` first argument, or the
`answerStore.svelte.test.ts` `localStorage.getItem('...')` argument changed.

### Pitfall 3: Comment-only references inflate / deflate the gate
**What goes wrong:** `questionStore`, `questionCategoryStore`, `pageDatumStore` have NO live identifiers —
only historical comments. If the gate counts comments, "zero remaining" is impossible without editing
comments; if it ignores comments, those symbols are trivially already "done."
**How to avoid:** Decide gate scope explicitly. Recommendation: update the comment text too (clean gate),
OR define the gate as "zero `*Store` identifiers in code (non-comment, non-string), minus exclusions."

### Pitfall 4: Client `jobStores` import of server `JobInfo`
**What goes wrong:** Renaming the client `jobStores` context accidentally rewrites the
`from '$lib/server/admin/jobs/jobStore.type'` import path or the `JobInfo` type.
**How to avoid:** The codemod allowlist targets `jobStores`/`JobStores`/`JobStoresProvider` ONLY — never
`jobStore` (singular, server) or `Job*` domain types. Verify the server import path is byte-identical
post-rename.

## Code Examples

### Word-boundary rename (ordered, allowlisted) — illustrative
```bash
# Source: project precedent — apps/frontend/scripts/flatten-current-codemod.mjs (Phase 113)
# Run longest-token-first; \b-anchored; skip excluded files.
# camelCase identifiers + filenames already handled by git mv for the file-bearing ones.
# Example sed pass (exclude persistedState + server + test mocks at the find level):
git grep -lE '\b(answerStore|AnswerStore)\b' -- 'apps/frontend/src' \
  | grep -v 'persistedState.svelte.ts' \
  | xargs sed -i '' -E 's/\bAnswerStoreImpl\b/AnswerStateImpl/g; s/\bAnswerStore\b/AnswerState/g; s/\banswerStore\b/answerState/g'
# IMPORTANT: do NOT touch lines where 'answerStore' is inside quotes (the localStorage key).
```

### The persisted-key literal to KEEP (do not rename)
```ts
// Source: apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:31
#store = localStorageState('VoterContext-answerStore', Object.freeze({}) as Frozen<Answers>);
//                          ^^^^^^^^^^^^^^^^^^^^^^^^^ KEEP literal — renaming orphans user data.
// The field/file/fn rename to *State leaves this string argument unchanged.
```

## Grep Gate

The post-rename verification gate. Define it to count **code** `*Store` identifiers minus exclusions and
minus intentionally-kept string literals.

```bash
# From apps/frontend/src — should return ONLY the documented exclusions + kept string literals.
grep -rwnE '[A-Za-z]*Store[A-Za-z]*' apps/frontend/src --include='*.ts' --include='*.svelte' \
  | grep -vE 'server/admin/jobs/jobStore'        `# server jobStore — kept` \
  | grep -vE 'cookieStore'                        `# test mock — kept` \
  | grep -vE 'StoredValue|LocallyStoredValue'     `# substring trap — kept` \
  | grep -vE "from 'svelte/store'"                `# real writable import — Phase 115` \
  | grep -vE "'[^']*Store[^']*'"                  `# localStorage key literals — intentionally kept` \
  | grep -vE '//|/\*|\* '                         `# comments (if gate excludes comments)`
# Expected after rename: EMPTY (or only the explicitly-acknowledged kept lines).
```

**Baseline (before rename):** the same grep without the exclusions returns ~166 lines; the in-scope
camelCase subset is 97 sites, PascalCase 47 sites. After rename, the gated count → 0.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `*Store` factories returning rune-backed objects | `*Store` are now plain classes / `$state` factories (no `svelte/store`) | Phases 106–113 (v2.13) | The "Store" suffix is now a misnomer — this phase corrects the naming |

**Deprecated/outdated:**
- The helper-store pull-chain (`questionStore`/`questionCategoryStore`/`questionBlockStore` as separate
  stores) was already inlined into `voterContext`/`candidateContext` `$effect`s — only comments remain.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Renaming the two `*Store` localStorage key literals would orphan persisted data, so they should be kept | Pitfall 2 | If keys SHOULD be renamed, an extra migration task is needed; if kept, a future reader may find the `answerState` field with an `answerStore` key mildly inconsistent (acceptable, documented) |
| A2 | `jobStores`→`jobStates` (pluralized) is the intended target form for the plural client context | Rename Map note | If a different form is wanted (`jobState`), trivially adjusted — planner picks |
| A3 | Comment-only refs (`questionStore` etc.) should be updated for a clean gate | Pitfall 3 | If left, gate must explicitly scope to code-only; both are fine |

These are all LOW-risk naming-convention choices for a mechanical phase, not verified facts requiring
external confirmation. All file/identifier/site facts in the Rename Map are `[VERIFIED: codebase grep]`.

## Open Questions (RESOLVED)

1. **Should the two localStorage key string literals be renamed (with migration) or kept?**
   - **RESOLVED: KEEP the literals (rename code identifiers only)** — adopted by all plans; renaming orphans persisted user data.
   - What we know: keeping them is zero-risk and matches "no behavior change"; renaming orphans data unless migrated.
2. **`jobStores` target form — `jobStates` vs `jobState`?**
   - **RESOLVED: `jobStates` (plural — holds active + past job collections)** — adopted by Plans 03/04.
3. **Comment-only `*Store` refs — update or leave?**
   - **RESOLVED: update for a clean grep gate** — adopted by Plan 04 Task 1.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| `yarn build` (turbo) | green-build gate | ✓ | repo turbo | — |
| `yarn svelte-check` | type gate | ✓ | repo | — |
| `yarn vitest run` | unit gate | ✓ | repo | — |
| `git mv` | file rename + history | ✓ | git | plain `mv`+`git add` (loses rename detection) |

No missing dependencies — pure code/config rename phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (frontend workspace) |
| Config file | `apps/frontend` vitest config (existing) |
| Quick run command | `cd apps/frontend && yarn vitest run <renamed-test-file>` |
| Full suite command | `cd apps/frontend && yarn vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RENAME-01 | Renamed factories/classes still behave identically | unit | `cd apps/frontend && yarn vitest run answerState popupState candidateUserDataState jobStates` (post-rename names) | ✅ (existing `*Store.svelte.test.ts` files, renamed to `*State.svelte.test.ts`) |
| RENAME-01 | Persisted-key literal unchanged | unit | `cd apps/frontend && yarn vitest run answerState` — asserts `'VoterContext-answerStore'` key still | ✅ (`answerStore.svelte.test.ts:57` → renamed file, KEEP literal in assertion) |
| RENAME-01 | Zero remaining `*Store` rune identifiers | grep gate | the `## Grep Gate` command | ✅ (gate is the artifact) |
| RENAME-02 | Exclusions intact | grep | `grep -rn 'cookieStore' && grep -rn 'server/admin/jobs/jobStore'` return the kept lines | ✅ |
| RENAME-01/02 | Whole-suite green, no behavior change | full | `cd apps/frontend && yarn vitest run` | ✅ |

### Sampling Rate
- **Per task commit:** rename one symbol's triplet + run that symbol's renamed test + `svelte-check` delta.
- **Per wave merge:** `yarn vitest run` (full frontend) + `yarn build`.
- **Phase gate:** grep gate empty + build 14/14 + svelte-check 151/0 + vitest green before `/gsd-verify-work`.

### Wave 0 Gaps
- None — every in-scope symbol with a file already has a `.svelte.test.ts`; comment-only and private-field
  symbols need no new tests. (`paramStore`, `filterStore`, `matchStore`, `nominationAndQuestionStore` have
  no dedicated test file but are exercised via `voterContext`/`filterContext` tests — adequate for a rename.)

## Baseline State (expected green/baseline numbers)

From Phase 113 verification (`113-VERIFICATION.md`, `113-04-SUMMARY.md`):

| Gate | Command | Baseline / Expected | Notes |
|------|---------|---------------------|-------|
| Build | `yarn build` (or `yarn workspace @openvaa/frontend build`) | **14/14** turbo tasks | client + SSR chunks emit |
| svelte-check | `cd apps/frontend && yarn svelte-check` | **151 errors / 0 warnings** (UNCHANGED baseline) | 6 are PRE-EXISTING `candidateContext` `SupabaseDataWriter`/`Promise<UniversalDataWriter>` errors — NOT introduced here; rename must not add to 151 |
| Vitest | `cd apps/frontend && yarn vitest run` | **~762–766 passed / 58 files** | 113-04 reported 762; 113-VERIFICATION re-ran at 766. Rename must keep this count (renamed test files still run) |
| Grep gate | `## Grep Gate` command | **0** (minus documented exclusions) | the new RENAME gate |

**Acceptance:** post-rename numbers must EQUAL the baseline (build 14/14, svelte-check 151/0, vitest count
unchanged) — any deviation signals an accidental behavior change or a missed/corrupted site.

## Security Domain

Not applicable beyond standard hygiene. No `security_enforcement`-relevant surface: this is an internal
identifier rename with no auth, input-validation, crypto, or data-flow change. The one data-adjacent
concern (localStorage key namespace) is addressed in Pitfall 2 (keep keys → no data orphaning).

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/**` codebase grep (`grep -rwn`, `find`) — all Rename Map facts `[VERIFIED: codebase grep]`.
- `.planning/phases/113-handle-flatten-de-duplication/113-VERIFICATION.md`, `113-04-SUMMARY.md` — baseline build/svelte-check/vitest numbers + codemod precedent `[VERIFIED]`.
- `.planning/REQUIREMENTS.md` (RENAME-01, RENAME-02) — scope `[CITED]`.
- `.planning/phases/114-store-state-rename/114-CONTEXT.md` — boundary/exceptions `[CITED]`.
- `./CLAUDE.md` — Context Destructuring Rule, build/test commands `[CITED]`.

### Secondary (MEDIUM confidence)
- `.claude/skills/spike-findings-voting-advice-application-gsd/` — Svelte 5 rune migration context (no rename-specific guidance; confirms the symbols are runes not stores).

## Metadata

**Confidence breakdown:**
- Rename map / inventory: HIGH — exhaustive codebase grep, every symbol's decl file + sites enumerated.
- Mechanism / pitfalls: HIGH — substring traps + persisted-key literals located by direct grep; codemod pattern from Phase 113.
- Baselines: HIGH — copied from Phase 113 verification.

**Research date:** 2026-06-13
**Valid until:** 2026-06-27 (stable; only invalidated if Phase 113 follow-up edits move these files before 114 runs)
