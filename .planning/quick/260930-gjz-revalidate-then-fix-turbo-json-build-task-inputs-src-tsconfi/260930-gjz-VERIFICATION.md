---
phase: quick-260930-gjz
verified: 2026-09-30T10:15:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
covered_files:
  - apps/frontend/turbo.json
  - apps/docs/turbo.json
  - packages/dev-seed/tests/turboBuildInputsGate.test.ts
  - CLAUDE.md
# covered_digest omitted: gsd_run verification.fingerprint is not available in this verifier shell
---

# Quick 260930-gjz: Verification Report

**Goal:** turbo build task inputs must cover every tracked build input of apps/frontend and apps/docs.
**Verified against:** commit 539ae3a28 (an ancestor of the current HEAD; none of the four files changed since).
**Status:** passed. **Re-verification:** No.

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Finding re-established from dry-run and CI log, recorded in SUMMARY | VERIFIED | SUMMARY Revalidation section records turbo 2.8.17, per-app hashes, 373/54 missing inputs, 15 generated Paraglide keys, the hash pair (580e5f.. vs c4a810..), and CI run 36535849705 (remote caching disabled, frontend build missed twice). This report did not re-fetch the CI log. The gate's red-at-HEAD behaviour, reproduced below, corroborates the dry-run part. |
| 2 | Every tracked file of apps/frontend and apps/docs is a hashed input of `build` | VERIFIED | Own dry run (`turbo run build --dry=json`, TURBO_* unset): frontend hashes 1568 of 1568 tracked files, 0 missing. Docs hashes 282 of 282, 0 missing. Resolved inputs are `$TURBO_DEFAULT$` plus `data/**` and `!src/lib/paraglide/**` (frontend) and `$TURBO_DEFAULT$` (docs). |
| 3 | Frontend build hash excludes Paraglide output; rebuild is a cache hit | VERIFIED | Dry run shows 0 hashed keys under `src/lib/paraglide/`. Run in this verification: build with cache miss 10194ed97a245b7d; H1 (after build) equals H2 (after `rm -rf src/lib/paraglide`), both 10194ed97a245b7d; the next build logged `cache hit`. |
| 4 | Cache hit restores `src/lib/paraglide/**` and `check` passes | VERIFIED (restore), check not re-run | The replay after deletion recreated `src/lib/paraglide/{messages,messages.js,README.md}`. Frontend outputs resolve to `build/**` and `src/lib/paraglide/**`. I did not re-run `yarn workspace @openvaa/frontend check`; the SUMMARY reports exit 0 (2811 files, 0 errors). |
| 5 | Both builds keep `dependsOn ["^build"]`; root turbo.json unchanged | VERIFIED | Resolved `dependsOn` is `["^build"]` for both tasks. `git show 539ae3a28` touches neither the root `turbo.json` nor `.github/`, and `turbo.json` still holds the `src/**`, `tsconfig*`, `tsup.config.ts`, `package.json` inputs. |
| 6 | Gate is red without the package configs and green with them | VERIFIED | Green: 10/10 pass. With `apps/frontend/turbo.json` moved aside: 4 failed, 6 passed (tracked coverage, no generated input, negation, outputs). With `apps/docs/turbo.json` moved aside: 1 failed (docs tracked coverage), 9 passed. Both files restored; `git status` is clean for apps/, packages/, CLAUDE.md and turbo.json. |

**Score:** 6/6. No behavior-dependent truths are left unexercised.

## Artifacts and Key Links

| Artifact | Status | Details |
|----------|--------|---------|
| `apps/frontend/turbo.json` | VERIFIED | `extends ["//"]`; inputs `$TURBO_DEFAULT$`, `data/**`, `!src/lib/paraglide/**`; outputs `build/**`, `src/lib/paraglide/**`; no `dependsOn` override. |
| `apps/docs/turbo.json` | VERIFIED | `extends ["//"]`; inputs `$TURBO_DEFAULT$` only. |
| `packages/dev-seed/tests/turboBuildInputsGate.test.ts` | VERIFIED | Substantive: repo-pinned turbo via `execFileSync` without a shell, TURBO_TOKEN/TEAM/API stripped, fails closed, tracked files derived at run time, anti-vacuity tests. Header comment is in the present tense and carries no history. |
| `CLAUDE.md` | VERIFIED | Build System paragraph names both configs and the gate. |

Key links: both package configs extend the root, and the resolved task definitions confirm the merge. The gate spawns `node_modules/.bin/turbo` with `--dry=json`.

## Anti-Patterns

No TBD, FIXME or XXX markers in the changed files. No stubs.

## Findings

- BLOCKER: none.
- WARNING: none.
- Note only (already recorded as out of scope in the SUMMARY): the `.env` files Vite reads are gitignored and so are not hashed. The inlang plugins load from a CDN and no hash can cover them. Remote caching is disabled in observed CI, so the stale-replay risk from the remote cache is latent.

## Human Verification

None required.

---

_Verified: 2026-09-30_
_Verifier: Claude (gsd-verifier)_
