# Phase 143 — Discussion Log

**Document:** `143-DISCUSSION-POINTS.md` · 15 decisions · 4 marked ⚠ DECIDE (B1, B2, C2, F1)
**Baseline measured at:** HEAD `374af0bf6` (branch `feat-gsd-roadmap`), 2026-08-22
**Returned by the operator:** 2026-08-22

## Fill outcome

**All 15 ★ RECOMMENDED options ticked. Zero overrules. Zero free-text `EDIT:` / `NOTE:` entries.**

Per the document's own fill rule ("leave everything unchecked and the ★ options are taken as chosen"),
an all-★ return is behaviourally identical to an empty return — but the operator ticked every box
explicitly rather than leaving them blank. Recorded as an explicit confirmation of all fifteen, not as
a default-through.

| § | Decision | Ticked | Outcome |
|---|---|---|---|
| B | **B1** ⚠ | ★ (a) | Re-scope to "prove the reach, close the measured gaps, correct the record" |
| B | **B2** ⚠ | ★ (a) | In-place narrow → measure → restore, ledger-recorded, restore proven by `git diff --exit-code` |
| B | **B3** | ★ (a) | 3 plans, fully serial (measure → change → gates) |
| C | **C1** | ★ (a) | Guard test grows to table-driven 4 dirs × {`.ts`, `.svelte`} + negative control |
| C | **C2** ⚠ | ★ (a) | Widen glob to `src/**/*.{ts,js,mjs,cjs,svelte}`, re-measure fallout |
| C | **C3** | ★ (a) | Close dynamic `import()` via `no-restricted-syntax` + a probe |
| C | **C4** | ★ (a) | `svelte/motion` out of scope; measure, record, file a todo |
| C | **C5** | ★ (a) | Files outside `src/` out of scope; record + file a lint-scope todo |
| D | **D1** | ★ (a) | ASSERT-09 discharged as a measured zero with a per-file disposition table |
| D | **D2** | ★ (a) | SC-4 grep is one-time and recorded, not a standing gate |
| E | **E1** | ★ (a) | Leave the dead `'**/_spikes-*/**'` ignore; record it as measured-dead |
| F | **F1** ⚠ | ★ (a) | Correct all four record targets in-phase, naming `7c47b35b7` at each |
| F | **F2** | ★ (a) | Evidence lives in `143-NEGATIVE-CONTROL-LEDGER.md` |
| G | **G1** | ★ (a) | Five static gates + one full `yarn test:e2e` run |
| G | **G2** | ★ (a) | Standard E2E prereq: `yarn db:reset` + one fresh dev server |

## Corrections applied during context synthesis

Two of the document's § A measurements did not survive re-measurement at the same HEAD. Both are
recorded as **⚠ DERIVED** decisions in `143-CONTEXT.md` rather than left for an executor to rediscover,
per the standing rule that a stale count must be amended at its source and not merely annexed.

1. **D1's "five mentions" undercounts.** The strict grep's 2 hits are confirmed exactly. The prose set
   is **4 files, not 3** — `supabaseDataProvider.test.ts:17` was missed. The disposition table is
   therefore **5 files / 10 lines** under `apps/frontend/src`, not five sites. → **D-09a**.
2. **A fifth record target exists.** `eslint-store-guard.test.ts` carries a corrupted traceability line
   (`Traceability:.3 (met-via-Phase-115).` — the requirement ID is missing) and a stale line citation
   (`lines 77-84`; the block is now 87-110). F1 named four targets; there are five. → **D-12a**.

**Three further corrections were surfaced by Phase 143 research (`576c9e50b`) and independently
re-verified before being accepted**, bringing the derived-decision count to five:

3. **`no-restricted-syntax` is already occupied.** `packages/shared-config/eslint.config.mjs:79-85`
   bans `TSEnumDeclaration`. Flat config replaces rule option arrays, so C3/D-06's naive edit would
   delete that ban for all of `apps/frontend/src/**` — producing **zero errors**, because the frontend
   has zero enums, and shipping invisibly. → **D-06a**.
4. **`yarn lint:check` is Turborepo-cached** (`turbo.json`'s `lint` task has no `"cache": false`,
   unlike `test:unit`). A cached exit 0 is indistinguishable from a measured blind GREEN — aimed
   squarely at B2/D-02's evidence. → **D-02a**.
5. **The exclusion list is 16 entries at `:23-40`, not 18 at `:22-42`**; the dead `_spikes` ignore is
   at `:40`. The block spans 18 *lines*, two of which are comments. E1/D-11 requires the size to be
   *stated* — stating 18 would state it wrongly. → **D-11a**.

None of the five corrections changes any ticked option. All five enlarge the work slightly within the
shape B1, C3 and F1 already chose.
