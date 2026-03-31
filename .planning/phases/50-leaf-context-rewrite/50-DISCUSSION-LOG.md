# Phase 50: Leaf Context Rewrite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 50-leaf-context-rewrite
**Areas discussed:** LayoutContext writables, Tweened progress, $app/stores scope, Consumer update depth

---

## LayoutContext Writables

| Option | Description | Selected |
|--------|-------------|----------|
| Direct $state properties | Replace Writable<T> with plain $state properties. Consumers use ctx.video.show instead of $video.show. | ✓ |
| Getter/setter wrapper class | Create ReactiveValue<T> class with .value access. More explicit but adds abstraction. | |
| You decide | Claude picks based on codebase patterns. | |

**User's choice:** Direct $state properties (Recommended)
**Notes:** Clean break, fully rune-native. Type changes from Writable<boolean> to boolean.

---

## Tweened Progress

| Option | Description | Selected |
|--------|-------------|----------|
| Svelte 5 Tween class | Replace tweened() with new Tween() from svelte/motion. Rune-native with .current and .target properties. | ✓ |
| Keep tweened() with adapter | Wrap tweened() so consumers don't see it's a store. Lower risk but keeps svelte/store dependency. | |
| You decide | Claude picks based on Svelte 5 best practices. | |

**User's choice:** Svelte 5 Tween class (Recommended)
**Notes:** Fully $state-compatible, no store imports needed.

---

## $app/stores Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 11 files now | Migrate every $app/stores import in one sweep. Matches roadmap success criteria. | ✓ |
| Only leaf-context-related | Migrate only 6 files outside other context modules. Leave others for their respective phases. | |
| You decide | Claude decides based on dependencies and risk. | |

**User's choice:** All 11 files now (Recommended)
**Notes:** Mechanical change — import from $app/state instead and use .page instead of $page.

---

## Consumer Update Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full migration per phase | Each phase rewrites contexts AND updates all consumers. No intermediate shims. | ✓ |
| Shim layer first, bulk update later | Context returns shim objects preserving $store syntax. Consumers updated in separate bulk phase. | |
| You decide | Claude decides based on risk assessment. | |

**User's choice:** Full migration per phase (Recommended)
**Notes:** Clean, no intermediate shims, but more files touched per phase.

---

## Claude's Discretion

- I18nContext implementation approach
- AuthContext isAuthenticated implementation
- File rename strategy (.ts → .svelte.ts)
- SSR safety validation approach

## Deferred Ideas

None.
