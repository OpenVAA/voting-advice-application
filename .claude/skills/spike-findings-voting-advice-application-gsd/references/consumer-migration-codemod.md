# Consumer Migration Codemod ($store.X → ctx.current.X)

A pure-Node, dependency-free codemod that mechanically rewrites every
template `$<store>` auto-subscribe site and audits every destructure-trap
hit in `apps/frontend/src/**/*.svelte`. After [[reactive-contexts]],
[[persistent-rune-stores]], and [[layout-overlay-registry]] migrations land,
this script handles the consumer-side migration in ~1 hour of automated work
(146+ sites) instead of ~3 days of manual editing.

## Requirements

- **Idempotent** — running twice produces identical output. The rewrite
  regex `\$<store>(?!\w)` does not match `<store>.current`, so applied files
  are no-ops on re-run.
- **Zero false positives** — negative-lookbehind / lookahead guards reject
  `$$<store>` (double-dollar event refs), `_$<store>` (prefixed), and
  `$<store>Foo` (suffix continuation).
- **Restricted to `.svelte` files** — does not touch `+page.ts` loaders or
  other TS files where `$store.X` shouldn't appear anyway.
- **Destructure-trap audit pass uses the CLAUDE.md reactive-accessor list**
  — single source of truth. When CLAUDE.md adds a new accessor, the codemod
  picks it up via a one-line `REACTIVE_ACCESSORS` set update.
- **Dry-run by default** — `--apply` flag required to actually write.
- **Lives in `apps/frontend/scripts/`** — keep it adjacent to other dev
  tooling, not in `runes-test/` (which is deletable post-migration).

## How to Build It

### Two-pass design

```
PASS 1 — rewrite $<store>.X → <store>.current.X
PASS 2 — audit const { <reactive-accessor>, ... } = get*Context(...)
```

Each store rewritten in Pass 1:

| Store | Handle | Accessor |
|-------|--------|----------|
| `$appSettings` | `appSettings` | `current` |
| `$dataRoot` | `dataRoot` | `current` |
| `$darkMode` | `darkMode` | `current` |
| `$locale` | `locale` | `current` |

### Pass 1 — rewrite regex

```js
// Per-store regex — negative lookbehind on word/$/_ rejects $$store, _$store.
// Negative lookahead on word char rejects $storeFoo.
const re = new RegExp(`(?<![\\w$_])\\$${store}(?!\\w)`, 'g');

// Replacement: $appSettings  →  appSettings.current
// Trailing .X (if any) chains naturally onto .current
content = content.replace(re, `${handle}.${accessor}`);
```

Examples:

```
$appSettings.publisher.name        →  appSettings.current.publisher.name
$dataRoot                          →  dataRoot.current
$darkMode                          →  darkMode.current
{$locale}                          →  {locale.current}
```

### Pass 2 — destructure-trap audit

```js
// Match: const { A, B, C } = get<Anything>Context(  — accept multi-line
const destructureRe = /const\s*\{([\s\S]*?)\}\s*=\s*(get\w+Context)\s*\(/g;

// For each match, split names on `,`, trim, drop default-value parts.
// Any name in REACTIVE_ACCESSORS gets a warning line.
```

The accessor set is copied verbatim from CLAUDE.md "Context Destructuring
Rule (Svelte 5)" — 24 names spanning voter, candidate, auth, admin, and
preregistration contexts:

```js
const REACTIVE_ACCESSORS = new Set([
  // voter
  'selectedElections', 'selectedConstituencies', 'opinionQuestions',
  'infoQuestions', 'infoQuestionCategories', 'opinionQuestionCategories',
  'questionBlocks', 'unansweredOpinionQuestions',
  'unansweredRequiredInfoQuestions', 'requiredInfoQuestions',
  'answersLocked', 'profileComplete', 'electionsSelectable',
  'constituenciesSelectable', 'matches', 'nominationsAvailable',
  'resultsAvailable',
  // candidate / auth / preregistration
  'idTokenClaims', 'isPreregistered', 'isAuthenticated',
  'preregistrationElections', 'preregistrationNominations', 'newUserEmail'
]);
```

### Usage

```bash
# Dry-run — show what would change, no writes
node apps/frontend/scripts/spike-009-store-codemod.mjs

# Apply the rewrites
node apps/frontend/scripts/spike-009-store-codemod.mjs --apply

# Scoped to a subdirectory
node apps/frontend/scripts/spike-009-store-codemod.mjs --files 'apps/frontend/src/lib/components/**/*.svelte'
```

### Expected dry-run output (production tree, May 2026)

```
Files scanned:   179
Files to change: 45
Total rewrites:  146
  by store:
    $appSettings: 103
    $dataRoot: 35
    $darkMode: 4
    $locale: 4
Files with destructure traps: 2
Total traps flagged:          2
```

## What to Avoid (codemod limitations)

1. **The codemod does NOT rewrite `<script>`-block store references** like
   `const { subscribe, ... } = appSettings` or `appSettings.subscribe(cb)`.
   These are rare and out of scope; review manually.

2. **The codemod does NOT rewrite TS-side `$<store>.X` reads** — the regex
   restricts to `.svelte` files. `+page.ts` loaders that import a store and
   read `$appSettings.X` need manual review (most don't exist by convention).

3. **The codemod does NOT detect spread-of-context.** Spike 009 surfaced
   `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:97` where
   `const adminContext = { ...appContext, ...authContext, jobs }` invokes
   every source-context getter ONCE at spread time and captures values,
   de-reactivating the chain. This is a sibling-trap of destructure that
   the codemod indirectly picks up (via the visible consumer-side
   `const { isAuthenticated } = getAdminContext()` in
   `AdminNav.svelte:33`). A future Pass 3 could scan for `{ ...<context-name>, ...}`
   spreads in context-init code. For now, treat it as a manual audit item.

4. **Destructure-trap detection is direct only** — does NOT flag intermediate
   aliases like `const ctx = getVoterContext(); const { X } = ctx;`. Add a
   manual sweep for `const \w+ = ...Context\(\)` followed by destructure of
   the local. (Production today: rare; the documented Phase 61 pattern is
   direct destructure.)

5. **Don't run with `--apply` before the rune-context migrations land.**
   The script rewrites consumers to `appSettings.current.X` — that property
   doesn't exist until [[reactive-contexts]] Pattern 1 ships. Recommended
   order: ship Wave 1 of [[migration-inventory-and-order]] first, then run
   the codemod.

## Constraints

- **Pure Node, no dependencies.** Uses `node:fs` (`readFileSync`,
  `writeFileSync`, `globSync` available from Node 22+) and `node:path` only.
  Easy to ship to the repo as-is; no `package.json` install step.
- **The accessor set MUST stay in sync with CLAUDE.md.** When new reactive
  getters land in a context, append them to both the codemod's
  `REACTIVE_ACCESSORS` set and CLAUDE.md's documented list.
- **Real production hit found** —
  `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte:33`:
  `const { isAuthenticated, t, getRoute } = getAdminContext();`
  `isAuthenticated` is defined as `$derived(!!page.data.session)` in
  `authContext.svelte.ts:25`. Likely production bug — when the user
  authenticates mid-session, the local `isAuthenticated` won't update.
  Fix BEFORE running the migration so it isn't compounded.
- **Codemod can graduate to a lint rule.** The same regex patterns can be
  wrapped as a custom svelte-eslint rule for ongoing protection. Until
  then, run as a pre-commit / CI check.

## Origin

Synthesized from spike: 009

Source files available in:
- `sources/009-store-codemod-feasibility/spike-009-store-codemod.mjs` — the codemod itself
- `sources/009-store-codemod-feasibility/README.md` — full investigation
  trail including the AdminNav production hit + spread-of-context bonus
  discovery
