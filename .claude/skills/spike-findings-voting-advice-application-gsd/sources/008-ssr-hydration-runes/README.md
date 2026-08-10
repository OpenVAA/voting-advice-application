---
spike: 008
name: ssr-hydration-runes
type: standard
validates: "Given two rune-native appSettings context variants — A: $effect-only merge (production today + Spike 001 shape), B: synchronous init from page.data — when the page server-renders with seeded DB-override settings, then (a) Variant A's SSR HTML misses the DB override because $effect doesn't run on server, (b) Variant B's SSR HTML reflects the merged DB-override values because the merge ran synchronously at $state init, (c) after client hydration both converge to the same value, (d) Variant A pays a re-render cycle while Variant B does not"
verdict: VALIDATED
related: [001]
tags: [svelte5, runes, ssr, hydration, appsettings, migration]
---

# Spike 008 — SSR + Hydration with Rune Contexts

## What This Validates

The production `appContext.svelte.ts:74-100` and Spike 001's rune-native
replacement both follow the same pattern:

```ts
let value = $state(mergeAppSettings(staticSettings, dynamicSettings));
$effect(() => {
  const data = page.data?.appSettingsData;
  // ... merge DB override into value
});
```

**The `$effect` does NOT run during SSR.** So the server-rendered HTML reflects
only `staticSettings ∪ dynamicSettings` — the DB override is missed. After
client mount, the `$effect` fires, merges the DB override, and re-renders.

Two side-by-side variants prove the gap and propose a fix:

- **Variant A** — `$effect`-only merge (production today + Spike 001 shape).
- **Variant B** — synchronous `page.data` read at `$state` init. The
  `$effect` only handles the navigation-changed-page.data case.

## Implementation

`apps/frontend/src/routes/runes-test/ssr-hydration/`:

1. **`appSettingsVariantA.svelte.ts`** — production-shape: `$effect`-only merge.
2. **`appSettingsVariantB.svelte.ts`** — SSR-aware: synchronous init reads
   `page.data?.appSettingsData` at the top of `init*()`, folds it into the
   initial `$state` value. `$effect` then only handles
   page-data-changed-after-nav.
3. **`+layout.svelte`** — initializes both variants under separate Symbol-keyed contexts.
4. **`+page.svelte`** — renders both panels side-by-side with `data-test-*`
   attributes so curl can read SSR-output values without DOM tooling.

## Test field choice

The chosen indicator is `results.sections`:

- Default in `dynamicSettings.ts`: `['candidate', 'organization']`
- DB seed override in `default` template: `['candidate', 'organization', 'alliance']`
- `'alliance'` presence is a clean binary signal: present = DB override was applied.

## Verification (server-side via curl)

```bash
curl -s http://localhost:5173/runes-test/ssr-hydration | grep -oE 'data-test-[a-z-]+="[^"]*"' | sort -u
```

```
data-test-a-effectfired="false"                     ← $effect didn't run
data-test-a-hasalliance="false"                     ← DB override MISSING
data-test-a-sections="candidate,organization"
data-test-b-effectfired="false"                     ← $effect didn't run
data-test-b-hasalliance="true"                      ← DB override APPLIED
data-test-b-initialmergedb="true"                   ← synchronous init read page.data
data-test-b-sections="candidate,organization,alliance"
```

## Verification (post-hydration)

```js
// After page load, in browser:
Object.fromEntries(
  [...document.querySelectorAll('[data-test-a-effectfired]')].flatMap((el) =>
    [...el.attributes].filter((a) => a.name.startsWith('data-test-')).map((a) => [a.name, a.value])
  )
);
```

```
data-test-a-effectfired: "true"                     ← $effect ran on client
data-test-a-hasalliance: "true"                     ← caught up via re-render
data-test-a-sections: "candidate,organization,alliance"
data-test-b-effectfired: "true"                     ← $effect ran but no-op'd (data === prevData)
data-test-b-hasalliance: "true"
data-test-b-sections: "candidate,organization,alliance"
```

Console clean — no hydration mismatches or `effect_update_depth_exceeded`.

## Investigation Trail

- **2026-05-22** — Built Variant A + Variant B side-by-side. Initial test
  used `header.showFeedback` as the test field; both variants showed `true`
  in SSR because `header.showFeedback` is ALSO defaulted to `true` in
  `dynamicSettings.ts` (not a clean DB-only field). Switched to `results.sections`
  where the seed adds `'alliance'` to the default `['candidate', 'organization']`.

- **2026-05-22 first SSR check** — Both Variant A AND Variant B showed
  `'alliance'` even though Variant A's `effectfired="false"`. Surprising —
  suggests $effect runs on server? Investigated `mergeAppSettings` and found:

  ```ts
  export function mergeAppSettings(target, additional): AppSettings {
    const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null));
    return Object.assign(target, nonNull); // ← MUTATES target in place
  }
  ```

  Both variants' `let value = $state(mergeAppSettings(staticSettings, ...))`
  was mutating the shared `staticSettings` reference. Variant B's
  page.data merge propagated through to Variant A's value via the shared
  object identity — masking Variant A's SSR gap.

- **2026-05-22 fix** — Replaced calls in both variants with a local
  `pureMerge(target, additional) → { ...target, ...nonNull }` that returns a
  fresh object. Re-ran the SSR check: clean divergence — Variant A
  misses 'alliance', Variant B includes it. The SSR gap is now visible.

## Results

**Verdict:** VALIDATED ✓ (Variant B's SSR-aware init pattern works; the SSR gap is real)

### Finding 1 — The $effect-only merge has a real SSR gap

Variant A's server-rendered HTML reflects only `staticSettings ∪ dynamicSettings`.
The DB-override merge happens client-side after $effect fires, causing a
client-side re-render. On slow connections this can produce a visible flash
(default-value → DB-override-value).

### Finding 2 — Synchronous-init pattern is the fix

Variant B reads `page.data?.appSettingsData` at the top of `init*()` and folds
it into the initial `$state` value. SSR HTML correctly reflects
`staticSettings ∪ dynamicSettings ∪ DB-override`. Client `$effect` still
fires once but no-ops (data === prevData), so no re-render, no flash.

### Finding 3 — Production `mergeAppSettings` is mutative (bonus discovery)

`apps/frontend/src/lib/utils/settings.ts:12-20`:

```ts
export function mergeAppSettings(target, additional): AppSettings {
  const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null));
  return Object.assign(target, nonNull); // ← MUTATES target
}
```

In production today this is masked because only one appContext initializes
per session. But the helper's signature returns `AppSettings`, suggesting
purity, and the JSDoc doesn't warn about mutation. Any future code that
runs `mergeAppSettings` twice over the same target gets compounding mutations.

**Suggested migration cleanup:** change to spread-based pure merge
(`return { ...target, ...nonNull }`). The reference-equality guard already in
place at `appContext.svelte.ts:93-100` correctly handles the SvelteKit
loader-payload-stability concern that prompted the guard.

**Signal for the real migration:**

1. **Migration of `appContext.svelte.ts` should adopt the SSR-aware pattern
   (Variant B).** Read `page.data?.appSettingsData` synchronously at init.
   The change is structurally local — the `$effect` stays for navigation
   handling, just doesn't carry initial-merge responsibility. Same fix
   applies to `appCustomizationData` in lines 110-118 (which has the same
   shape).

2. **`mergeAppSettings` should be made pure** as part of the migration —
   `return { ...target, ...nonNull }`. Low-risk diff; the function's
   declared signature already implies purity.

3. **SSR gap closure removes a class of "flash on first load" bugs.** Any
   downstream `$derived` of `appSettings` (theme colors, feature flags,
   layout settings) currently re-evaluates on hydration when $effect
   fires. After migration, the derived chain is correct from the first
   SSR render onwards.

4. **Spike 001's reference implementation** (`appSettingsRuneContext.svelte.ts`)
   should be updated to match Variant B's pattern before promotion. The
   spike-findings skill ([[reactive-contexts]]) reference should be revised
   to recommend the SSR-aware shape, not the current Spike 001 shape.

## Source Files

- `apps/frontend/src/routes/runes-test/ssr-hydration/appSettingsVariantA.svelte.ts`
- `apps/frontend/src/routes/runes-test/ssr-hydration/appSettingsVariantB.svelte.ts`
- `apps/frontend/src/routes/runes-test/ssr-hydration/+layout.svelte`
- `apps/frontend/src/routes/runes-test/ssr-hydration/+page.svelte`
