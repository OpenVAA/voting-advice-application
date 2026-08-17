---
spike: 019
name: readwrite-split-destructure-trap
type: standard
validates: "Given the bare-getter read/write-split context shape, when a consumer writes const { foo } = ctx, then the destructure trap still fires — the split removes .current ergonomics but not the trap; only non-destructured ctx.foo reads stay reactive"
verdict: INVALIDATED
related: [007, 009, 017]
tags: [svelte5, runes, destructure-trap, context, readwrite-split, phase-103]
---

# Spike 019: read/write split does NOT eliminate the destructure trap

## What This Validates

GIVEN the bare-getter read/write-split shape (`readonly foo` internally a
`$derived`, plus `setFoo(updater)`),
WHEN a consumer writes `const { foo } = ctx`,
THEN the destructure trap still fires (snapshot) — the split removes `.current`
ergonomics but does NOT remove the trap; only non-destructured `ctx.foo` reads
stay reactive.

The user predicted this would not solve the context-restructure issue. It does
not — and the spike surfaces *why*, plus a counterintuitive corollary.

## How to Run

```bash
cd apps/frontend
yarn vitest run src/lib/contexts/_spikes-017-019/019-readwrite-split-destructure-trap.spike.svelte.test.ts
```

3 tests, <1s.

## What to Expect

- **Test 1 (bare getter + destructure → TRAP):** `const { foo } = ctx` snapshots
  `foo = 0`; after `ctx.setFoo(n => n+5)` the direct read `ctx.foo` updates to
  `10` while the destructured `foo` stays `0`. The write side fires correctly —
  it cannot rescue the destructured read.
- **Test 2 (`{ current }` handle + destructure → SAFE):** `const { foo } = ctx`
  destructures the STABLE handle object; `foo.current` updates `0 → 10` through
  the destructure. The handle is a trap firewall.
- **Test 3 (the only trap-free bare read):** `$derived(ctx.foo)` (never
  destructured) updates `0 → 6`. Reactive — but only because it was not
  destructured.

## Investigation Trail

1. **Separated the two concerns up front.** The trap is about how a value is
   READ (getter invocation timing), not about how it is written. Built a context
   with both `get foo()` and `setFoo(updater)` so the test could show the write
   side firing while the destructured read stayed stale — proving orthogonality.
2. **Added the head-to-head against `{ current }`** to test the deeper hypothesis:
   if the trap is about destructuring a *getter*, then destructuring a stable
   *object* whose getter is one level down (`.current`) should be safe. Test 2
   confirms it.
3. **Confirmed the prescribed escape still holds** (Test 3): `$derived(ctx.foo)`
   without destructuring is reactive — the existing CLAUDE.md rule is unchanged by
   the split.
4. **All green on first run.** No surprises in the mechanism; the surprise is in
   the corollary (below).

## Results

**VERDICT: INVALIDATED** (for the claim that the read/write split fixes the trap).

- **The destructure trap is orthogonal to the read/write split.** It is a property
  of getter-based reads + JS destructuring. `setFoo` is irrelevant to it.
- **Counterintuitive corollary — the bare shape is the trap-PRONE shape.** Dropping
  `.current` for a bare `get foo()` is exactly the move that re-exposes the trap:
  - `{ foo: { get current() } }` → `const { foo } = ctx` destructures a stable
    OBJECT; `foo.current` stays reactive. **Firewall.**
  - `{ get foo() }` → `const { foo } = ctx` invokes the getter once, binds a
    frozen value. **Trap.**
  So the `.current` handle that Phase 103 / the user's proposal want to remove was
  *incidentally* protecting against the destructure trap.

### Why this matters for Phase 103 (and confirms its design)

This is exactly why the Phase-103 codemod is not just PASS 1 (fold `.current`):
it MUST also run **PASS 3** (rewrite `const { foo } = ctx` → `const foo =
$derived(ctx.foo)`) and **PASS 4** (audit remaining destructures). Flattening to
bare getters without PASS 3 would silently convert every destructure site into a
stale-snapshot trap. The split idea cannot shortcut that — if anything it makes
PASS 3 more essential.

### Net signal across 017–019

- **017 VALIDATED** — the read/write split genuinely removes the `{ current,
  instance }` (E3) intricacy on the WRITE side.
- **018 PARTIAL** — it can't remove producer input reads, only re-spell them away
  from the codemod's `.current` regex.
- **019 INVALIDATED** — it does not touch the destructure trap, and the bare read
  side it prescribes is the trap-prone one. The trap stays a READ-side
  destructuring discipline (CLAUDE.md rule + Phase-103 PASS 3/4), regardless of how
  writes are modeled.
