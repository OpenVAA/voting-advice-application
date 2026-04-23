---
phase: 58-templates-cli-default-dataset
plan: 02
subsystem: dev-seed
tags: [dev-seed, portraits, assets, phase-58-wave-1, d-58-05, d-58-07, gen-10]
requirements_completed: [GEN-10]
dependency_graph:
  requires: []
  provides:
    - "30 deterministically-named candidate portrait JPEGs at packages/dev-seed/src/assets/portraits/"
    - "assets inventory lock test (5 assertions, fails fast on drift)"
    - "maintainer refresh tooling (one-off download script)"
    - "honest legal-posture LICENSE.md (RESEARCH Pitfall #7 mitigation)"
  affects:
    - "Plan 58-04 Writer — reads packages/dev-seed/src/assets/portraits/ during candidate portrait upload"
    - "Plan 58-06 Default template — cycles portraits[i % 30] across 100 candidates (~3.3 reuses per face per D-58-05)"
tech_stack:
  added: []
  patterns:
    - "tsx-first maintainer script (mirrors packages/dev-tools/src/keygen.ts — top-level await, node: built-ins, exit-code handling)"
    - "node:fs synchronous inventory test (readdirSync + readFileSync + statSync inside describe/it; vitest handles describe-time I/O cleanly)"
    - "JPEG magic-byte validation (FF D8 FF) as corruption-guard in asset tests"
key_files:
  created:
    - "packages/dev-seed/scripts/download-portraits.ts (42 lines — one-off maintainer fetch, Node built-ins only)"
    - "packages/dev-seed/src/assets/portraits/portrait-01.jpg through portrait-30.jpg (30 files, 16MB total, 1024x1024 JFIF JPEGs)"
    - "packages/dev-seed/src/assets/portraits/LICENSE.md (31 lines — honest ambiguity disclosure per RESEARCH Pitfall #7)"
    - "packages/dev-seed/tests/assets.test.ts (59 lines — 5 vitest assertions)"
    - ".planning/phases/58-templates-cli-default-dataset/deferred-items.md (logs pre-existing workspace-build pre-requisite)"
  modified: []
decisions:
  - "Portraits sourced from thispersondoesnotexist.com per D-58-05 (locked); did NOT substitute Pexels/Unsplash despite RESEARCH LOW-confidence flag — switching is a CONTEXT-level decision requiring new D-58-XX"
  - "LICENSE.md adopts honest ambiguity language ('legally unresolved', 'does not claim a formal license') instead of the simpler 'public domain' phrasing from the D-58-05 shorthand — aligns with RESEARCH Pitfall #7 and Open Q 1 resolution"
  - "Inventory test uses JPEG magic-byte (FF D8 FF) check rather than file-extension-only — guards against empty/corrupt files slipping in via future refresh runs"
  - "download-portraits.ts uses ONLY node: built-ins (fs/promises, path, url, global fetch) — preserves Phase 56 'no new deps' constraint"
metrics:
  duration: "~6 minutes (including ~30s portrait fetch + 1s-rate-limit waits)"
  completed_date: "2026-04-23"
  tasks_completed: 3
  files_created: 33
  commits: 4
---

# Phase 58 Plan 02: Portrait Assets + LICENSE + Download Script + Inventory Test Summary

Committed 30 StyleGAN-generated candidate portrait JPEGs to `packages/dev-seed/src/assets/portraits/` with honest licensing disclosure, preserved the one-off download script for maintainer reproducibility, and locked the asset inventory with a 5-assertion vitest that guards count, naming pattern, JPEG validity, LICENSE.md presence, and deterministic sort order.

## Outcome

`@openvaa/dev-seed` now has the portrait pool that Writer (Plan 58-04) consumes during the candidate upload pass. GEN-10 is satisfied: 30 files committed, inventory test green, LICENSE.md disclosures the ambiguous posture explicitly.

Downstream plans can proceed:
- **Plan 58-04 (Writer)** — its portrait-upload step has a deterministic `fs.readdir` target.
- **Plan 58-06 (Default template)** — its 100-candidate cycle across 30 portraits is ready to wire (`portraits[i % 30]`).

## Execution Flow

### Task 1 — Maintainer script + 30 portraits (commit `a16992be8`)

Created `packages/dev-seed/scripts/download-portraits.ts` mirroring the `packages/dev-tools/src/keygen.ts` shape (top-level await, Node built-ins, stderr on fail + exit 1, stdout progress). The script fetches 30 images from `https://thispersondoesnotexist.com/` with 1-second politeness delays between requests (~30s total runtime).

Ran the script via `yarn workspace @openvaa/dev-seed tsx scripts/download-portraits.ts`. All 30 portraits fetched cleanly on the first attempt — no retries needed. Files verified with `file(1)` as "JPEG image data, JFIF standard 1.01, ... 1024x1024, components 3".

Total asset size: 16MB (~530KB average per portrait). Well within normal repo-asset expectations.

### Task 2 — LICENSE.md honest posture (commit `2db918c7f`)

Wrote the LICENSE.md verbatim from the plan's `<action>` block. Key wording:

> `thispersondoesnotexist.com` does not publish an explicit license for its output... The copyright status of AI-generated images is legally unresolved in most jurisdictions as of 2026. This package **does not claim** a formal license on these images.

Adds substitution guidance (Pexels, Unsplash, UIFaces) gated on a new D-58-XX decision, so future contributors who hit a licensing-blocker know the migration path without re-diving RESEARCH.

### Task 3 — Inventory lock test (commit `68522b37b`)

Wrote `packages/dev-seed/tests/assets.test.ts` verbatim from the plan's `<action>` block. 5 assertions all green:

```
RUN  v3.2.4
 tests/assets.test.ts (5 tests) 17ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

Uses only `node:fs` built-ins + vitest — no new deps. JPEG magic-byte check (`FF D8 FF`) guards against a future `git add` of empty/corrupt files being silently committed.

### Deferred-items log (commit `986c4c32e`)

Logged one pre-existing workspace-build pre-requisite: running the full dev-seed unit suite without a prior `yarn build` fails 5 test files because `@openvaa/core` / `@openvaa/matching` dist outputs aren't produced. Reproduces on the base commit `2286f83608` — **not caused by this plan**. Noted for a later CI-setup plan or architectural alternative (source-direct package exports).

## Deviations from Plan

None. Plan executed exactly as written — all three tasks, LICENSE.md verbatim, inventory test verbatim, one-off script shape verbatim from `<interfaces>` block. No auto-fix needed (no bugs surfaced), no architectural decisions raised.

## Success Criteria Check

- [x] 30 `portrait-NN.jpg` files committed (N = 01..30) — verified: `ls packages/dev-seed/src/assets/portraits/portrait-*.jpg | wc -l` → `30`
- [x] Each file is a non-empty, valid JPEG — verified via JPEG magic-byte check in inventory test
- [x] LICENSE.md documents ambiguous licensing posture honestly — contains "legally unresolved" and "does not claim"; no unqualified "public domain" claim
- [x] download-portraits.ts committed, Node built-ins only, ONE-OFF marker in header JSDoc
- [x] assets.test.ts passes with 5 green assertions
- [x] No stray files in portraits dir (only `portrait-NN.jpg` + `LICENSE.md`) — verified clean

## Threat Surface Scan

No new threats beyond the register in `58-02-PLAN.md`. All four STRIDE entries (T-58-02-01 through T-58-02-04) have accepted/mitigated dispositions; T-58-02-04 (legal ambiguity) is actively mitigated by LICENSE.md per plan. No new attack surface discovered during execution.

## Self-Check: PASSED

- FOUND: `packages/dev-seed/scripts/download-portraits.ts` (commit `a16992be8`)
- FOUND: All 30 files `packages/dev-seed/src/assets/portraits/portrait-{01..30}.jpg` (commit `a16992be8`)
- FOUND: `packages/dev-seed/src/assets/portraits/LICENSE.md` (commit `2db918c7f`)
- FOUND: `packages/dev-seed/tests/assets.test.ts` (commit `68522b37b`)
- FOUND: `.planning/phases/58-templates-cli-default-dataset/deferred-items.md` (commit `986c4c32e`)
- FOUND commits: `a16992be8`, `2db918c7f`, `68522b37b`, `986c4c32e` all in `git log --oneline`
- TEST: `yarn workspace @openvaa/dev-seed test:unit tests/assets.test.ts` → 5/5 green
