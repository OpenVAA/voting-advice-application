---
created: "2026-07-15T00:00:00.000Z"
title: Remove the inert `declare module 'qs'` shim from global.d.ts
area: frontend
priority: low
files:
  - apps/frontend/src/lib/types/global.d.ts
source: Phase 125 verification finding (125-VERIFICATION.md)
---

## Problem

`apps/frontend/src/lib/types/global.d.ts:13` carries a pre-existing `declare module 'qs';` any-shim
(from May 2026) that predates Phase 125. Since Phase 125 added the real `@types/qs` devDependency,
the shim is **inert** — the Phase-125 verifier empirically proved this by removing it and diffing
`yarn check` output (byte-identical error set). It is now dead code that could confuse readers into
thinking qs is untyped.

## Solution

Delete the `declare module 'qs';` line from `global.d.ts` and confirm `yarn check` output is
unchanged (should stay at the then-current baseline). One-line cleanup; fits any later TYPE-workstream
phase (126–128) or a quick task.
