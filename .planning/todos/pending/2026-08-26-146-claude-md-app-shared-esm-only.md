---
created: 2026-08-26T19:30:00.000Z
title: CLAUDE.md claims @openvaa/app-shared builds to both ESM and CommonJS — it is ESM-only
area: documentation
severity: minor
source: Phase 146 research § N-7
files:
  - CLAUDE.md
  - packages/app-shared/tsup.config.ts
  - packages/app-shared/package.json
---

## Problem

`CLAUDE.md` describes `@openvaa/app-shared` as *"Shared between frontend and backend … Builds to
both ESM (frontend) and CommonJS (backend)"*. It is **ESM-only**:

- `packages/app-shared/tsup.config.ts` declares `format: ['esm']`.
- `packages/app-shared/package.json` exposes only an `import` condition — there is no `require`
  condition and no CJS artifact.

Found during Phase 146 (research § N-7), where it mattered concretely: every in-container run in
that phase had to be preceded by a full `yarn build`, because the frontend reads app-shared's
**built** `dist/` and a stale `dist/` serves the previous `font.url` default. The build-first
prerequisite is now recorded in `visual-container.sh`'s header and in the visual spec's
docblock; the CLAUDE.md claim that motivates a reader to expect a CJS consumer path is still
standing.

## Solution

Correct the sentence in `CLAUDE.md`. While there, check whether any consumer is *assumed* to
`require()` it — the backend framing in that sentence is the part most likely to have
propagated.

## Why it was not folded into Phase 146

Real, and outside that phase's declared record-correction set (D-18 enumerated four claims; a
fifth was added and named explicitly). CONTEXT scoped it out with instructions to file it rather
than fold it in.
