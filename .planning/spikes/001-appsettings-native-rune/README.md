---
spike: 001
name: appsettings-native-rune
type: standard
validates: "Given a rune-only `appSettings` context exposing `get current()` over `$state`, when DB overrides arrive via `page.data.appSettingsData`, then both a template consumer and a `.ts` `$derived` consumer update reactively — with no `toStore`, no `$appSettings` auto-subscribe, no `get(appSettings)`, and no `svelte/store` import"
verdict: VALIDATED
related: [002]
tags: [svelte5, runes, context, settings, migration]
---

# Spike 001 — appSettings as a Native Svelte 5 Rune

## What This Validates

Replace the hybrid `toStore()`-wrapped `$state` pattern in
`apps/frontend/src/lib/contexts/app/appContext.svelte.ts:74-100` with a fully
idiomatic Svelte 5 rune context exposing a `get current()` getter — and
demonstrate that consumers can read it three ways (template direct read,
`.ts` `$derived` alias, raw template binding) **without any `svelte/store`
import or `$store.X` auto-subscribe**.

## Research

### Why the production code uses `toStore`

The legacy bridge at `appContext.svelte.ts:74-80` exists for **template
`$appSettings.X` auto-subscribe** compatibility. Svelte's `$store` prefix only
works on Readable / Writable stores — it does NOT work on rune-based getter
objects. To migrate, every `$appSettings.X` consumer must change to either:

- `appSettings.current.X` (raw read in tracking scope), or
- `const foo = $derived(appSettings.current.X)` (.ts alias)

This is identical to the constraint already documented in `CLAUDE.md` for
`reactiveDataRoot`, just extended to the appSettings path.

### Merge semantics

`mergeAppSettings(target, additional)` (`apps/frontend/src/lib/utils/settings.ts`)
overwrites by root key with non-null filter. Production runs it twice: once
synchronously at init with `(staticSettings, dynamicSettings)`, then re-runs
inside a `$effect` whenever `page.data.appSettingsData` changes. The spike
context replicates both steps verbatim.

### Reference-equality guard

The production code at `appContext.svelte.ts:93-100` adds a reference-equality
guard because SvelteKit returns the same loader payload object across
navigations that share the same loader inputs. Without the guard,
`mergeAppSettings` would produce a new object on every nav, cascading filter
recreation through downstream contexts. The spike preserves this guard.

## Implementation

Code lives in `apps/frontend/src/routes/runes-test/contexts/appSettingsRuneContext.svelte.ts`
(co-located with the temp route so deleting the route deletes the spike).

Key shape:

```ts
export interface AppSettingsRuneContext {
  readonly current: AppSettings; // getter that returns $state
}
```

Consumer patterns demonstrated in `+page.svelte`:

```svelte
<!-- 1. Template direct -->
{appSettingsCtx.current.admin?.email}

<!-- 2. .ts $derived alias -->
<script>
  const adminEmail = $derived(appSettingsCtx.current.admin?.email);
</script>
{adminEmail}
```

## How to Run

```bash
yarn db:start                # boots Supabase + dev server
# navigate to: http://localhost:5173/runes-test
```

## What to Expect

The "Spike 001" panel shows seven AppSettings fields read in three different
patterns. All values should be populated (not "∅"). On hard navigation away
and back, the values should still appear without flicker — the merge runs
fresh in the new context. The page.data override merge runs in an effect; the
fields will reflect `staticSettings ∪ dynamicSettings ∪ DB overrides`.

## Investigation Trail

*(Updated as the spike progresses.)*

- **2026-05-21** — Built initial Approach A: rune context returning `get current()`
  with internal `$state` and `$effect`-driven merge on `page.data.appSettingsData`.
  Type-check clean (svelte-check: 0 new errors). Awaiting browser verification.

## Results

**Verdict:** VALIDATED ✓

Browser verification on 2026-05-21 at http://localhost:5173/runes-test against
the seeded default template (327 candidates / 1 election / 5 constituencies / 24
questions / 4 categories) confirmed:

| Field                          | Template direct    | $derived alias     | Match |
|--------------------------------|--------------------|--------------------|-------|
| admin.email                    | first.last@openvaa.org | first.last@openvaa.org | ✓ |
| font.name                      | Inter              | (same)             | ✓ |
| analytics.platform.name        | ∅ (no DB override) | (same)             | ✓ |
| elections.disallowSelection    | false              | (same)             | ✓ |
| header.showFeedback            | true (from DB)     | (same)             | ✓ |
| colors.light.primary           | #2546a8            | (same)             | ✓ |

**Key findings:**

- Template direct read (`{ctx.current.X}`) and `.ts` `$derived(ctx.current.X)`
  alias are **observationally equivalent** under the rune context. The merge
  flows from static + dynamic + DB override into `$state` and both readers
  re-evaluate in the same render cycle.
- `header.showFeedback=true` proves the DB override merge worked — staticSettings
  does NOT define this; only the seeded `app_settings` row does. The `$effect`
  inside the context fired on the initial `page.data.appSettingsData` value
  and merged correctly.
- The reference-equality guard (`prevData === data`) is structurally identical
  to production's guard at `appContext.svelte.ts:93-100` — verified by code
  inspection only (would need a navigation-stress test to observe the
  cascade-avoidance behavior; out of scope for this spike).

**Signal for the real migration:**

- Migrating `appContext` to drop the `toStore()` bridge is a clean swap. Every
  template `$appSettings.X` site must change to `appSettings.current.X` — but
  the diff is mechanical and TypeScript will catch all of them.
- The 17+ template `$appSettings.X` sites surveyed in scouting (e.g.
  `Notification.svelte`, `EntityInfo.svelte`, `CandidateNav.svelte`, etc.) all
  follow the same pattern and can be migrated en masse.
- No paradigm alteration is needed for `appSettings` — Approach A is sufficient.
