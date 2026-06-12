# Phase 104: Store → State Rename (RENAME-01 + RENAME-02) - Context

**Gathered:** 2026-06-09 (batch discussion — `v2.12-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename every **rune-native `*Store` symbol** to `*State` — identifiers, file names, type names, and test names — so the naming no longer implies a Svelte store that does not exist. The two genuine non-rune exceptions are explicitly excluded + documented.

**Depends on:** Phase 103 (RENAME-01 collides with the HANDLE-03 codemod on many of the same frontend files; serialized **after** the codemod to avoid a same-file collision). **Must NOT run concurrently with Phase 103.**
**Requirements:** RENAME-01, RENAME-02. **Parallel-eligible:** No.

**Symbols in scope (12):** `answerStore`→`answerState`, `editedAnswersStore`, `filterStore`, `popupStore`, `matchStore`, `candidateUserDataStore`, `questionBlockStore`, `questionCategoryStore`, `questionStore`, `nominationAndQuestionStore`, `paramStore`, `pageDatumStore` (~227 "Store" occurrences frontend-wide).
</domain>

<decisions>
## Implementation Decisions

### Rename mechanism
- **D-01 (104-1):** **Scripted codemod** (symbols + file names + type names + test names) → **human-review the diff** → commit. Consistent, idempotent, reviewable in one pass; manual rename of ~227 sites is error-prone. *(Note the asymmetry with Phase 103, which auto-applies: the rename keeps a human diff review.)*

### File renames
- **D-02 (104-2):** Rename files via **`git mv`** (e.g. `answerStore.svelte.ts` → `answerState.svelte.ts`) so blame/history follows the rename — these files carry meaningful migration history.

### Commit shape
- **D-03 (104-3):** **One mechanical rename commit** + separate commits for any manual fix-ups. One clean revert boundary for the bulk rename (mirrors 103-2).

### Exclusions
- **🔒 (RENAME-02 / cross-cutting K2):** the server-side **`jobStore`** (`lib/server/admin/jobs/jobStore.ts`, a genuine in-memory registry) and the **`cookieStore`** test mock are **left untouched** and **documented as intentional exceptions**.

### Verification
- **🔒:** grep gate confirms **zero remaining rune-context `*Store` identifiers** (excluding the documented exclusions); build + typecheck + test suites stay green (no broken imports / stale references).

### Claude's Discretion
- The exact rename tooling (sed/jscodeshift/ts-morph) as long as it covers symbols + files + types + tests and the diff is reviewed before commit (D-01).
- Where the `jobStore` / `cookieStore` exclusion rationale is documented (in-code comment vs this CONTEXT vs both).
</decisions>

<specifics>
## Specific Ideas
- Must land **after** Phase 103's codemod — the two rewrites touch overlapping files and would collide if interleaved.
- `popupStore`, `matchStore`, `nominationAndQuestionStore` are already rune-native (per v2.11 / spike 004) — they are renamed here for naming consistency, not migrated.
- **Single-E2E mid-chain validation (K3)** after the rename lands — confirm no broken import slipped past typecheck.
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `.planning/v2.12-DECISIONS.md` (K2 exclusions, K3 validation) + `REQUIREMENTS.md` RENAME-01/02.
- `CLAUDE.md` → context architecture (the `*Store` symbols are listed in the Context Destructuring Rule reactive-accessor inventory — keep that list accurate post-rename).
- Grep `Store` across `apps/frontend/src/**` to enumerate the full occurrence set before scripting.
</canonical_refs>
