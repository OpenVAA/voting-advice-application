# Phase 180: Edge Functions — Typecheck & Shared Modules - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-12
**Phase:** 180-edge-functions-typecheck-shared-modules
**Areas discussed:** factual baseline, scope and criteria text, toolchain, shared modules, editor setting, verification, CI, plan shape and E2E cost

---

## How the discussion ran

One consolidated document, `180-DISCUSSION-POINTS.md` (committed in `1c27dfd8b`), listed 25 decisions, 8 of them
marked ⚠ DECIDE (A1, B1, B5, C1, C2, D1, F1, G1), each with exactly one `★ RECOMMENDED` option. Its rule: an
unchecked box means the ★ option; a ticked box or EDIT/NOTE text overrules it.

**The operator returned the document untouched on 2026-11-12.** No box was ticked and no EDIT or NOTE was added, so
every decision takes its ★ option as written. The alternatives and their costs remain in the document itself.

## Decisions and chosen options

| Decision | Chosen option (★) | CONTEXT id |
|---|---|---|
| 0.1 Factual baseline | (a) Accept all 24 facts; CONTEXT restates them | D-01 |
| A1 ⚠ Amend criteria 1 and 3 | (a) Amend both before planning | D-02 |
| A2 Spike reference | (a) Bring over verbatim, add an "On `feat/entity-signup-multi-grant`" section | D-03 |
| A3 `supabaseAdmin: any` | (a) Type as `SupabaseClient`, drop the ignores and stale reason | D-04 |
| A4 `findExistingCandidate` reshape | (a) Close as moot, citing `4ecfe7778` | D-05 |
| A5 Neighbouring todos | (a) Out of scope; annotate each at close | D-06 |
| B1 ⚠ Deno pin | (a) `2.9.6` exact, devDependency of `@openvaa/supabase` | D-07 |
| B2 Config location | (a) `functions/deno.json`, the spike's four keys | D-08 |
| B3 Lock | (a) `"lock": false` | D-09 |
| B4 Script form | (a) `cd supabase/functions && deno check .` | D-10 |
| B5 ⚠ `deno lint` gate | (a) Not a gate; record the 4 findings | D-11 |
| B6 `deno fmt` | (a) Never wire it; exclude or document "Prettier formats this tree" | D-12 |
| C1 ⚠ Modules to `_shared/` | (a) `envConfig.ts` and `placeholderAddress.ts`; `callerAuthority.ts` stays | D-13 |
| C2 ⚠ `jwtSegment.ts` | (a) Delete it and its test; fix the database skill prose | D-14 |
| C3 `placeholderAddress.ts` merge | (a) Keep `identity-callback`'s copy as the shared one | D-15 |
| C4 Copy-drift guard | (a) Remove Check 2 and `DUPLICATED_MODULES`; renumber to 2 of 2 | D-16 |
| C5 Doc and prose surfaces | (a) Update all of them in the move's commit | D-17 |
| D1 ⚠ Editor setting | (a) Document only | D-18 |
| D2 LSP probe | (a) Re-run S8 and S9 once after the move | D-19 |
| E1 Bundle verification | (a) `verify.sh`, two passes (config present / moved aside) | D-20 |
| E2 Planted-error control | (a) Three plants, exit codes read directly, plus turbo cache check | D-21 |
| F1 ⚠ CI observation | (a) `ci-evidence/180-deno`, read at job level, push on the operator's go | D-22 |
| G1 ⚠ Plan shape | (a) Three plans, one with code | D-23 |
| G2 Targeted and full runs | (a) Green under the standing rules; both bank-auth projects named | D-24 |
| G3 Reconciliation | (a) Full | D-25 |

## Operator constraints (2026-11-12)

Given with the returned document and recorded as locked decisions:

- D-26: no stack use until the operator says -infra plan 185-10 has returned; then each plan's first stack use runs
  `yarn db:stop && yarn db:start` from this worktree and checks the migration count and the edge runtime's mount.
- D-27: no Edge Function deploy to the hosted staging project.
- D-28: any GitHub push (the `ci-evidence` branch) only after the operator's explicit go, asked at that point.
- D-29: targeted E2E runs within the phase; one full run at the end against `179.2-final-4` (729/729) with summed
  deltas, under the E2E Hard Rule.

## Roadmap amendment

D-02 (A1) amended criteria 1 and 3 of `.planning/ROADMAP.md` § Phase 180 in the same commit as this log, with a
dated note under the section.

## Claude's Discretion

- The choice between the `fmt` exclude and the documentation line (D-12).
- `cmp` of the eszips or `diff -r` of the unbundled trees (D-20).
- Commit order inside plan 02, within the never-red rule (D-23).

## Deferred Ideas

- `deno lint` as a gate, `deno fmt` wiring, `createClient<Database>`, a hosted deploy and a live misconfigured-deployment run.
