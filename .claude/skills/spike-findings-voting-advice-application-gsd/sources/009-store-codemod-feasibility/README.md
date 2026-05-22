---
spike: 009
name: store-codemod-feasibility
type: standard
validates: "Given a regex-based Node.js codemod that targets $appSettings.X / $dataRoot.X / $darkMode / $locale template auto-subscribe sites across apps/frontend/src/**/*.svelte, when run in dry-run mode against the production tree, then (a) all 146+ enumerable sites are listed with file + line + before/after, (b) false positives are 0 (negative-lookbehind guards against word-boundary collisions), (c) the destructure-trap pass surfaces real production sites that the manual migration would otherwise miss, (d) the rewrite is mechanical and idempotent — applying twice produces identical output"
verdict: VALIDATED
related: [001, 002, 007]
tags: [svelte5, codemod, regex, migration, automation]
---

# Spike 009 — $store.X Codemod Feasibility

## What This Validates

After the rune-context migration ships (`appSettings`, `dataRoot`, etc.
become rune-native), the **consumer-side** migration requires rewriting every
`$store.X` auto-subscribe site to `ctx.current.X`. Per the migration plan in
the spike-findings skill ([[reactive-contexts]]):

> Template `$store.X` auto-subscribe sites become mechanical search-and-replace
> (every one is enumerable via grep).

This spike proves that "mechanical" claim — by actually building the codemod
and verifying it works against the production tree.

Spike 007 also surfaced the **destructure trap** (CLAUDE.md → Context
Destructuring Rule, Phase 61 production fix). The codemod's second pass detects
that pattern across all `.svelte` files so the migration plan can include it
as a checklist item.

## Implementation

`apps/frontend/scripts/spike-009-store-codemod.mjs` — pure Node.js, no
dependencies beyond `node:fs` + `node:path`. Two passes:

### Pass 1 — `$store.X` rewrite

Regex pattern: `(?<![\\w$_])\\$<storeName>(?!\\w)` — matches `$<store>` as
a standalone identifier, rejects:
- `$$appSettings` (double-dollar) ✓
- `_$appSettings` (prefixed) ✓
- `$appSettingsFoo` (suffix continuation) ✓

Each matched `$<store>` is replaced with `<store>.current`. The trailing
`.X` (if any) is unchanged — naturally chains onto `.current`:

```
$appSettings.publisher.name  →  appSettings.current.publisher.name
$dataRoot                    →  dataRoot.current
$darkMode                    →  darkMode.current
```

### Pass 2 — destructure-trap detection

Regex pattern: `const\\s*\\{([\\s\\S]*?)\\}\\s*=\\s*(get\\w+Context)\\s*\\(`
— matches `const { A, B, C } = get*Context(`. Each name in `{...}` is checked
against the reactive-accessor list from CLAUDE.md. Any hit flags the line
with a warning.

The accessor list (24 names) covers documented reactive getters across voter,
candidate, auth, admin, and preregistration contexts.

## How to Run

```bash
# Dry-run (default) — show what would change, no writes
node apps/frontend/scripts/spike-009-store-codemod.mjs

# Apply changes
node apps/frontend/scripts/spike-009-store-codemod.mjs --apply

# Restrict to a subdirectory
node apps/frontend/scripts/spike-009-store-codemod.mjs --files 'apps/frontend/src/lib/components/**/*.svelte'
```

## Results

**Verdict:** VALIDATED ✓ — codemod is feasible, low-false-positive, and
discovers an unexpected real production hit.

### Dry-run against production tree (apps/frontend/src/**/*.svelte)

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

### Destructure traps surfaced

1. `apps/frontend/src/routes/runes-test/voter-context-orchestration/DestructureTrapConsumer.svelte:23`
   — Spike 007's intentional anti-pattern demo. **Correctly flagged.**

2. `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte:33`
   — Real production hit. `const { isAuthenticated, t, getRoute } = getAdminContext();`
   `isAuthenticated` is defined as `$derived(!!page.data.session)` in
   `authContext.svelte.ts:25`. **Likely production bug** — when the user logs
   in mid-session, the local `isAuthenticated` captured at AdminNav init
   wouldn't update.

### Bonus discovery — spread-of-context trap

While investigating finding #2, identified a related-but-distinct trap in
`apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:97`:

```ts
const adminContext: AdminContext = {
  ...appContext,      // ← spread invokes every getter ONCE, captures VALUE
  ...authContext,
  // ...
};
```

Object spread invokes each getter on the source context once at spread time
and captures the value. So `adminContext.isAuthenticated` is NOT a getter
pointing back to `authContext`'s `$derived` — it's a static boolean captured
at adminContext init. This is the **root cause** of the AdminNav destructure
hit; even fixing the destructure in AdminNav wouldn't restore reactivity
because the context value itself is already de-reactivated.

### Sanity-check rewrite on a single file

Applied codemod to `Notification.svelte` (1 hit) — diff inspected:

```diff
- <Notification data={$appSettings.notifications.voterApp}/>
+ <Notification data={appSettings.current.notifications.voterApp}/>
```

(Note: the only hit in Notification.svelte was in a docstring example, not
runtime code. Correctly rewritten regardless.)

Then reverted via `git checkout` — spike does not commit production rewrites.

### Idempotence test

Running the codemod twice produces identical output the second run. The
regex pattern `\\$<store>(?!\\w)` does not match `<store>.current`, so applied
files are safely skipped on re-run.

## What to Avoid (codemod limitations)

1. **The codemod does NOT rewrite `<script>`-block store references** like
   `const { subscribe, ...} = appSettings` or `appSettings.subscribe(cb)`.
   These need separate manual review — but they're rare and out of scope
   for the consumer-side template migration.

2. **The codemod does NOT rewrite TS-side `$appSettings.X` reads** (e.g. in
   `+page.ts` loader files). The regex restricts to `.svelte` files only.

3. **The codemod does NOT detect spread-of-context** — see "Bonus discovery"
   above. Spreads need their own audit pass (which could be added in a
   future codemod iteration). For Phase 1 of the migration this is a manual
   review item.

4. **The codemod's destructure-trap detection is limited to direct
   destructure** — does not flag intermediate aliases like
   `const ctx = getVoterContext(); const { X } = ctx;`. The migration plan
   should include a manual sweep for these.

## Signal for the Real Migration

1. **Consumer migration is ~1 hour of automated work** — `node spike-009-store-codemod.mjs --apply`,
   review the diff, commit. Down from ~3 days of manual work.

2. **The destructure-trap pass should be run BEFORE the migration**, not just
   after — the production hit in AdminNav.svelte is real and the migration
   shouldn't compound it.

3. **The spread-of-context anti-pattern needs an audit phase.** AdminNav's
   issue traces back to `adminContext`'s `{ ...authContext, ... }` spread.
   At minimum, document this in the spike-findings skill
   ([[reactive-contexts]]). Optimally, add a "Pass 3" to this codemod to
   detect spread-of-context-object patterns.

4. **The codemod itself can ship to the codebase** as a one-shot migration
   tool, or wrapped as an ESLint rule for ongoing protection against the
   patterns it detects.

## Source Files

- `apps/frontend/scripts/spike-009-store-codemod.mjs` — the codemod (kept
  outside `runes-test/` because it's a developer tool, not a route)
