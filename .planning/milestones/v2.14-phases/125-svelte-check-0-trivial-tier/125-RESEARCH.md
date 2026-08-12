# Phase 125: svelte-check → 0 — Trivial Tier - Research

**Researched:** 2026-07-15
**Domain:** TypeScript / svelte-check type-error hygiene (frontend, behavior-neutral)
**Confidence:** HIGH

## Summary

This phase clears three independent, mechanically-verifiable type-error clusters in `apps/frontend` — 18 of the 151-error svelte-check baseline — with zero runtime behavior change. All three clusters were re-verified against a live `yarn check` run during this research (2026-07-15): the frontend reports exactly **151 ERRORS / 1 WARNINGS / 30 FILES_WITH_PROBLEMS** across 2093 files, and every targeted error was confirmed present at its exact line/column with its exact message text (captured below). Expected post-phase count: **≤ 133**.

The work is genuinely trivial in mechanism but has one predictable type-fallout point. TYPE-01 (`qs` ambient types) is resolved by adding `@types/qs` as a devDependency; the real types are `any`-permissive at the two `stringify` call sites and the cast-guarded `parse` sites, so 7 of the 8 importing files will type-check clean with no edits — **but `src/routes/api/data/[collection]/+server.ts:20` assigns the now-typed `ParsedQs` return of `qs.parse()` directly (no cast) into a `GetDataOptionsBase | undefined` local, which will surface a NEW error** and must be fixed in-phase (per locked decision D-01). TYPE-02 (admin-jobs `cookies`) is pure dead-property removal at 6 call sites — `cookies` appears exactly twice per file (handler destructure + `getUserData` call) and nowhere else, so removal is clean everywhere. TYPE-03 (spike scaffolding) is a directory deletion with zero importers and no vitest include/coverage coupling.

**Primary recommendation:** Add `@types/qs@^6.15.0` to `apps/frontend` devDependencies; expect exactly one fallout fix (a cast at `data/[collection]/+server.ts:20`); drop `cookies` from both the destructure and the `getUserData` call in all 6 admin-jobs routes; `rm -rf src/lib/contexts/_spikes-017-019/`. Verify per-cluster with the exact grep assertions in the Common Pitfalls / Code Examples sections, then run the full acceptance gate (build + unit + svelte-check exact accounting + one full E2E suite).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — `@types/qs` devDependency, fix fallout in-phase.** Add `@types/qs` to `apps/frontend` devDependencies (matching installed `qs@^6.15.0` major). Real types preferred over a `declare module 'qs'` shim (which would leave qs as `any` everywhere — zero type value). **If real types surface NEW errors in the 8 importing files, fix them within this phase** — they are part of honestly clearing the cluster, not deferred fallout. The 8 importing files: `src/lib/utils/route/buildRoute.ts`, `src/lib/utils/route/parseParams.ts`, `src/lib/api/base/universalAdapter.ts`, `src/lib/api/base/universalAdapter.type.ts`, `src/routes/api/admin/jobs/active/+server.ts`, `src/routes/api/admin/jobs/past/+server.ts`, `src/routes/api/data/[collection]/+server.ts`, `src/routes/(voters)/constituencies/+page.svelte`.

- **D-02 — Drop `cookies` from the 6 call sites.** Remove the dead `cookies` property from each `getUserData({ fetch, cookies })` call (and the now-unused `cookies` destructure from the handler signature where nothing else uses it). Do NOT widen `getUserData`'s signature and do NOT thread cookies through (auth-plumbing change, out of trivial-tier scope). Behavior-neutral: the property was silently ignored at runtime. The 6 routes: `abort-all`, `active`, `past`, `start`, `single/[jobId]/abort`, `single/[jobId]/progress` under `src/routes/api/admin/jobs/`.

- **D-03 — Delete the entire `src/lib/contexts/_spikes-017-019/` directory** (all 4 files: `017-readwrite-split-dataroot`, `018-readwrite-split-producer-inputs`, `018b-snapshot-mechanism`, `019-readwrite-split-destructure-trap` — all `.spike.svelte.test.ts`). Findings durably preserved in `.planning/spikes/` and the `spike-findings-voting-advice-application-gsd` skill. Nothing imports these files (verified). **`_spikes-020-class-conversion/` stays untouched** — error-free, belongs to Phase 128 (TYPE-08).

- **D-04 — Full gate with exact per-cluster accounting.** Success = build + unit tests + svelte-check showing **all 18 targeted errors gone with no net-new errors (final count ≤ 133)**, verified per-cluster (0 qs module-declaration errors, 0 admin-jobs cookies errors, 0 `_spikes-017-019` errors), **plus one full E2E suite run as the trust signal** (Phase 123 D-03 convention; cardinal rule — a failing or did-not-run E2E test blocks completion). Capture the before (151) and after counts in the verification evidence.

### Claude's Discretion

- Exact commit granularity — prefer **one atomic commit per cluster** (TYPE-01 / TYPE-02 / TYPE-03) so a bisect can isolate them.
- How D-01 fallout fixes (if any) are typed — as long as they stay behavior-neutral and inside the 8 importing files' call paths.
- Whether the handler-signature `cookies` destructure removal warrants any inline note (it shouldn't — plain dead-code removal).

### Deferred Ideas (OUT OF SCOPE)

None raised — discussion stayed within phase scope. Do NOT pull in TYPE-04+ (`supabaseDataProvider` = Phase 126; adapter/contexts = Phase 127; long-tail/tests/docs incl. `_spikes-020-class-conversion` = Phase 128; gate-to-zero = Phase 132). Resist fixing neighboring type errors — they muddy the exact accounting.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPE-01 | `qs` module ambient-declaration errors (8 × TS7016) resolved via `@types/qs` or a shim | `@types/qs@6.15.1` verified on npm (DefinitelyTyped, matches `qs@6.15.0`); all 8 error sites captured with exact line:col; fallout predicted at exactly one site (`data/[collection]/+server.ts:20`) — see TYPE-01 analysis below |
| TYPE-02 | admin-jobs `+server.ts` `cookies` cluster (6 errors) resolved | All 6 error sites captured; `cookies` confirmed to appear exactly twice per file (destructure + call), nowhere else → clean removal; `getUserData` signature confirmed to never read cookies |
| TYPE-03 | `_spikes-017-019` leftover spike scaffolding (4 errors) deleted | All 4 errors confirmed in `018b-snapshot-mechanism.spike.svelte.test.ts`; zero external references verified; vitest config has no include/exclude/coverage coupling |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `qs` query-string parse/stringify typing | Build / type-check tooling | Frontend Server (SSR) + Client | `@types/qs` is a dev-time type-only artifact; the 8 consumers span client route utils, SSR `+server.ts` endpoints, and one `.svelte` page — all consume the same ambient module declaration |
| admin-jobs auth-gate call shape | Frontend Server (API / `+server.ts`) | — | `getUserData` role-gate runs server-side in SvelteKit endpoint handlers; the `cookies` property is a dead argument to a server-only auth helper |
| spike test scaffolding | Test tooling (vitest) | — | `.spike.svelte.test.ts` files are unit-test-tier scaffolding with no production import path |

**No production runtime tier is modified.** Every change is either a dev-dependency addition, a dead-argument removal, or a test-file deletion. Behavior surface is null by construction.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@types/qs` | `^6.15.0` (resolves to 6.15.1) | Ambient TypeScript declarations for the `qs` query-string library | Canonical DefinitelyTyped package; the exact fix svelte-check itself recommends in the TS7016 message ("Try `npm i --save-dev @types/qs`") |

**Version verification (performed 2026-07-15):**
- `npm view @types/qs version` → `6.15.1` (latest) `[VERIFIED: npm registry]`
- Installed `qs` is `6.15.0` (`node_modules/qs/package.json`) `[VERIFIED: filesystem]`
- `@types/qs` dist-tag `ts5.9 → 6.15.1`; the frontend uses TypeScript `5.9.3` (`catalog:`) → the `^6.15.0` range resolves to a TS-5.9-compatible build `[VERIFIED: npm dist-tags + node -e typescript.version]`
- `@types/qs` is currently ABSENT from the monorepo `node_modules/@types/` `[VERIFIED: filesystem]` — it must be added.

**Installation (from repo root; Yarn 4 workspaces):**
```bash
yarn workspace @openvaa/frontend add -D @types/qs@^6.15.0
```
This writes `"@types/qs": "^6.15.0"` into `apps/frontend/package.json` devDependencies (sibling to the existing `"qs": "^6.15.0"` dependency at ~line 76). No root/catalog change is required for a `@types/*` dev-only package. `[ASSUMED]` — the planner should confirm whether this repo pins `@types/*` via the shared `catalog:` or per-workspace; `qs` itself is a plain per-workspace dep, so a per-workspace `@types/qs` is consistent.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@types/qs` real types | `declare module 'qs';` shim in a `.d.ts` | Rejected by D-01: the shim silences TS7016 but leaves `qs` as `any` everywhere (zero type value, and it would hide — not fix — the `data/[collection]` assignment). Real types are the honest fix. |

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@types/qs` | npm | mature (DefinitelyTyped, versioned to `qs` 6.x line) | 48,880,041 / week (last-week, 2026-07-08→14) | github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/qs | **OK** | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

`@types/qs` is a DefinitelyTyped (`@types/*` scope) package — community-maintained, tied to the already-present, already-trusted `qs` runtime dependency. 48.8M weekly downloads and the DefinitelyTyped homepage confirm legitimacy. `[VERIFIED: npm registry + npmjs downloads API]` No postinstall scripts (DefinitelyTyped packages ship declaration files only).

## Ground-Truth Error Inventory (captured from live `yarn check`, 2026-07-15)

svelte-check summary line: `COMPLETED 2093 FILES 151 ERRORS 1 WARNINGS 30 FILES_WITH_PROBLEMS`

Output format is machine-style: `<ts> ERROR "<file>" <line>:<col> "<message>"`. **Note for assertions:** the qs errors do NOT contain the literal string `TS7016` — the message text is `Could not find a declaration file for module 'qs'.` Grep on `module 'qs'` (or file+`ERROR`), not on `TS7016`.

### TYPE-01 — qs cluster (8 errors, all identical message: "Could not find a declaration file for module 'qs'")
| # | File | Position |
|---|------|----------|
| 1 | `src/lib/api/base/universalAdapter.type.ts` | 1:21 |
| 2 | `src/lib/api/base/universalAdapter.ts` | 1:16 |
| 3 | `src/lib/utils/route/parseParams.ts` | 1:16 |
| 4 | `src/lib/utils/route/buildRoute.ts` | 1:16 |
| 5 | `src/routes/api/admin/jobs/active/+server.ts` | 2:16 |
| 6 | `src/routes/api/admin/jobs/past/+server.ts` | 2:16 |
| 7 | `src/routes/api/data/[collection]/+server.ts` | 5:16 |
| 8 | `src/routes/(voters)/constituencies/+page.svelte` | 15:18 |

### TYPE-02 — cookies cluster (6 errors, all identical message: "Object literal may only specify known properties, and 'cookies' does not exist in type '{ fetch: …; parent?: … }'")
| # | File | Position |
|---|------|----------|
| 1 | `src/routes/api/admin/jobs/abort-all/+server.ts` | 15:35 |
| 2 | `src/routes/api/admin/jobs/active/+server.ts` | 18:35 |
| 3 | `src/routes/api/admin/jobs/past/+server.ts` | 20:35 |
| 4 | `src/routes/api/admin/jobs/single/[jobId]/abort/+server.ts` | 12:35 |
| 5 | `src/routes/api/admin/jobs/single/[jobId]/progress/+server.ts` | 14:35 |
| 6 | `src/routes/api/admin/jobs/start/+server.ts` | 20:35 |

### TYPE-03 — spike cluster (4 errors, all in one file, message: "Type 'number' is not assignable to type 'void | (() => void)'")
| # | File | Position |
|---|------|----------|
| 1 | `src/lib/contexts/_spikes-017-019/018b-snapshot-mechanism.spike.svelte.test.ts` | 25:21 |
| 2 | same file | 48:21 |
| 3 | same file | 78:21 |
| 4 | same file | 79:21 |

8 + 6 + 4 = **18** targeted errors. `151 − 18 = 133`. `[VERIFIED: live yarn check]`

## TYPE-01 Fallout Analysis (per importing file)

The pivotal research question: does adding real `@types/qs` surface NEW errors? Analyzed each of the 8 sites against the actual `@types/qs` signatures (`parse(str, opts?): ParsedQs` where `ParsedQs = { [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[] }`; `stringify(obj: any, opts?): string`).

| # | File & call | Prediction | Reason |
|---|-------------|-----------|--------|
| 1 | `universalAdapter.type.ts:59` — `Parameters<typeof qs.stringify>[0]` | **CLEAN** | `stringify`'s first param is `any`; `SearchParams` widens from `unknown`→`any` (more permissive, cannot add errors downstream) |
| 2 | `universalAdapter.ts:155` — `qs.stringify(params, { encodeValuesOnly: true })` | **CLEAN** | `stringify` first arg is `any` |
| 3 | `parseParams.ts:18` — `Object.entries(qs.parse(...))` then narrowed/cast | **CLEAN** | line 20 casts `as Array<string>`; line 21 narrows `typeof value === 'string'`; line 22 assigns the narrowed `string`. The `parsed[key]` LHS index behavior is independent of qs typing (unchanged) |
| 4 | `buildRoute.ts:90` — `qs.stringify(searchParams, { encodeValuesOnly: true })` | **CLEAN** | `stringify` first arg is `any` |
| 5 | `active/+server.ts:23` — `qs.parse(...) as { jobType?: AdminFeature }` | **CLEAN** | Cast is legal: `{ jobType?: AdminFeature }` is assignable to `ParsedQs` (AdminFeature ⊆ string ⊆ index type), so the `as` conversion is permitted |
| 6 | `past/+server.ts:24` — `qs.parse(...) as { jobType?: string\|string[]; statuses?…; startFrom?… }` | **CLEAN** | Each field `string \| string[]` is assignable to the ParsedQs index type → cast legal |
| 7 | **`data/[collection]/+server.ts:20`** — `options = qs.parse(...)` (NO cast) into `let options: GetDataOptionsBase \| undefined` | **⚠️ NEW ERROR EXPECTED** | `ParsedQs` is NOT assignable to `GetDataOptionsBase` (`{ locale?: string }` and its typed subclasses): the ParsedQs index yields `string \| string[] \| ParsedQs \| …` for `locale`, which is not assignable to `string \| undefined`. Today it compiles only because `qs.parse()` returns `any`. **Fix in-phase.** |
| 8 | `constituencies/+page.svelte:147-148` — `qs.parse(...)` spread into `qs.stringify({...})` | **CLEAN** | parse→ParsedQs `targetParams` is spread into `stringify`'s `any` first arg |

**Predicted fallout total: exactly 1 site** (`data/[collection]/+server.ts:20`). Recommended fix (behavior-neutral, per D-01):
```ts
// Before:
options = qs.parse(url.search.replace(/^\?/g, ''));
// After (add an explicit cast — qs.parse's ParsedQs is structurally the loose
// options bag the DataProvider already tolerates at runtime):
options = qs.parse(url.search.replace(/^\?/g, '')) as GetDataOptionsBase;
```
`GetDataOptionsBase` is already imported in that file (`import type { GetDataOptionsBase } …`). This is the minimal cast; the planner may instead use `as unknown as GetDataOptionsBase` if TS still complains about insufficient overlap, but the direct `as GetDataOptionsBase` should suffice because all `GetDataOptionsBase` fields are optional strings and the cast direction (ParsedQs → looser target) is comparable. **Confidence: HIGH on "one new error here"; MEDIUM on "the single cast fully resolves it"** — the plan must re-run `yarn check` after adding `@types/qs` to confirm the exact fallout set rather than trusting this prediction blind. `[VERIFIED: source inspection of all 8 sites + @types/qs signatures]`

## TYPE-02 Mechanics (cookies removal)

`getUserData` signature (`src/lib/auth/getUserData.ts:13-19`) accepts only `{ fetch: Fetch; parent?: () => Promise<{ session?: unknown }> }` and never reads `cookies` (session is cookie-based via the cookie-forwarding server `fetch` — confirmed by the file's doc comment). `[VERIFIED: source]`

Per-file `cookies` occurrence audit (grep count = 2 in every file → destructure + call only, no other use):

| Route | Handler destructure (current → after) | getUserData call (current → after) |
|-------|----------------------------------------|-------------------------------------|
| `abort-all/+server.ts:13,15` | `{ fetch, cookies, request }` → `{ fetch, request }` | `{ fetch, cookies }` → `{ fetch }` |
| `active/+server.ts:17,18` | `{ url, cookies, fetch }` → `{ url, fetch }` | `{ fetch, cookies }` → `{ fetch }` |
| `past/+server.ts:19,20` | `{ url, fetch, cookies }` → `{ url, fetch }` | `{ fetch, cookies }` → `{ fetch }` |
| `start/+server.ts:19,20` | `{ fetch, cookies, request }` → `{ fetch, request }` | `{ fetch, cookies }` → `{ fetch }` |
| `single/[jobId]/abort/+server.ts:11,12` | `{ params, request, fetch, cookies }` → `{ params, request, fetch }` | `{ fetch, cookies }` → `{ fetch }` |
| `single/[jobId]/progress/+server.ts:13,14` | `{ fetch, cookies, params }` → `{ fetch, params }` | `{ fetch, cookies }` → `{ fetch }` |

**Remove `cookies` from BOTH lines in each file.** Removing only the call-site property fixes the svelte-check error, but leaving `cookies` in the destructure creates an unused-binding that `@typescript-eslint/no-unused-vars` (part of the mandatory lint gate) would flag — so remove both, per D-02. All other destructured params (`url`, `request`, `params`, `fetch`) remain used and must be kept. `[VERIFIED: source + grep counts]`

## TYPE-03 Mechanics (spike deletion)

- Directory `src/lib/contexts/_spikes-017-019/` contains exactly 4 files, all `.spike.svelte.test.ts` (017, 018, 018b, 019). `[VERIFIED: ls]`
- Zero external references: repo-wide grep for `_spikes-017-019`, `017-readwrite`, `018-readwrite`, `018b-snapshot`, `019-readwrite` across `apps/frontend/src`, `vitest.config.ts`, `package.json` returns nothing outside the directory itself. `[VERIFIED: grep]`
- `apps/frontend/vitest.config.ts` defines NO `test.include`, NO `test.exclude`, NO `coverage` block (only `globals: true`, `environment: 'jsdom'`, and resolve aliases). Deletion cannot break an include glob or a coverage threshold. `[VERIFIED: full config read]`
- These 4 files DO match vitest's default test glob (`**/*.{test,spec}.…` — the names end in `.test.ts`), so they currently run under `yarn test:unit`. Deleting them will **reduce the reported unit-test count** (by however many `it/test` blocks the 4 files contain). This is expected and correct — the D-04 unit gate requires the suite to PASS, not to match a fixed count. Flag it so a lower unit count post-deletion is not mistaken for a regression.
- `_spikes-020-class-conversion/` (4 files: 020-023) is error-free and OUT OF SCOPE — do not touch. `[VERIFIED: ls + D-03]`

**Deletion command:** `git rm -r apps/frontend/src/lib/contexts/_spikes-017-019/` (use `git rm` so the deletion is staged atomically for the TYPE-03 commit).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Silence `qs` TS7016 | A hand-written `declare module 'qs'` shim | `@types/qs` (D-01) | The shim types `qs` as `any` — it hides the real `data/[collection]` mismatch instead of surfacing it, delivering zero type value |
| Make `cookies` type-valid | Widen `getUserData` to accept `cookies` | Drop the dead property (D-02) | Widening codifies a parameter the function never reads; threading cookies through is an auth-plumbing change out of trivial-tier scope |
| Preserve spike findings | Keep the failing test files "for reference" | Delete; findings live in `.planning/spikes/` + the spike-findings skill (D-03) | The scaffolding has no ongoing value and its type errors are pure noise |

## Common Pitfalls

### Pitfall 1: Grepping for "TS7016" in the acceptance assertion
**What goes wrong:** The svelte-check message for the qs cluster does NOT contain the string `TS7016`; it reads `Could not find a declaration file for module 'qs'.` An assertion grepping `TS7016` returns 0 both before and after, giving a false green.
**How to avoid:** Assert on `module 'qs'` (or the specific file paths + `ERROR`). See Code Examples for exact commands.
**Warning signs:** A "0 qs errors" claim that was already 0 before any change.

### Pitfall 2: Removing only the call-site `cookies`, leaving the destructure
**What goes wrong:** svelte-check goes green for that error but ESLint `no-unused-vars` flags the now-unused destructured `cookies`, failing the lint gate.
**How to avoid:** Remove `cookies` from BOTH the handler destructure and the `getUserData` call in all 6 files (per the TYPE-02 table). Keep every other destructured param.

### Pitfall 3: Trusting the fallout prediction instead of re-running check
**What goes wrong:** The `data/[collection]` fix is predicted with HIGH confidence, but the exact cast that clears it is MEDIUM confidence, and a stray second fallout site (unlikely, but possible) would be missed.
**How to avoid:** After adding `@types/qs`, run `yarn check` and diff the error set against the 8 predicted-clean sites. Fix whatever real fallout appears, staying inside the 8 importing files' call paths (D-01).

### Pitfall 4: Scope creep into neighboring errors
**What goes wrong:** While editing `data/[collection]/+server.ts` or the admin routes, it's tempting to fix an adjacent Phase-126/127/128 error, muddying the "exactly 18, no net-new" accounting.
**How to avoid:** Touch ONLY the qs import line, the one fallout cast, the cookies properties, and the spike dir. Final count must be exactly ≤ 133 with the three clusters each at zero and no net-new.

## Code Examples

### Per-cluster verification assertions (run inside `apps/frontend`)
```bash
# Capture the after-state once:
yarn check 2>&1 | tee /tmp/check-after.log
# 0. Overall count (expect ≤ 133; ideally exactly 133 if no net-new):
grep -E "COMPLETED .* ERRORS" /tmp/check-after.log      # -> "... 133 ERRORS 1 WARNINGS ..."

# 1. qs cluster -> expect 0 (NOTE: message says "module 'qs'", NOT "TS7016"):
grep -c "module 'qs'" /tmp/check-after.log               # -> 0

# 2. cookies cluster -> expect 0:
grep -c "'cookies' does not exist" /tmp/check-after.log  # -> 0
grep -c "api/admin/jobs" /tmp/check-after.log            # -> 0 (belt-and-braces: no admin-jobs errors remain)

# 3. spike cluster -> expect 0:
grep -c "_spikes-017-019" /tmp/check-after.log           # -> 0

# no net-new: diff the set of error-bearing files against the before baseline
# (30 FILES_WITH_PROBLEMS before; expect the qs/cookies/spike files gone and no new files added)
```

### The one predicted fallout fix
```ts
// src/routes/api/data/[collection]/+server.ts  (~line 20)
// GetDataOptionsBase is already imported at top of file.
options = qs.parse(url.search.replace(/^\?/g, '')) as GetDataOptionsBase;
```

### Add the dependency (repo root)
```bash
yarn workspace @openvaa/frontend add -D @types/qs@^6.15.0
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@types/qs` version-pinned separately from `qs` | DefinitelyTyped now publishes `@types/qs` on the same 6.x minor line as `qs` and tags builds per TS version (`ts5.9 → 6.15.1`) | ongoing | `^6.15.0` cleanly matches `qs@6.15.0` under TS 5.9.3; no version-skew risk |

**Deprecated/outdated:** none relevant.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@types/qs` should be added per-workspace (like `qs`) rather than via a shared `catalog:` pin | Standard Stack / Installation | Low — if the repo enforces catalog pins for `@types/*`, the planner adds a catalog entry instead; either way the type resolution is identical. Verify against how other `@types/*` are declared. |
| A2 | The single `as GetDataOptionsBase` cast fully resolves the `data/[collection]:20` fallout | TYPE-01 Fallout Analysis | Low/Medium — if TS reports insufficient overlap, escalate to `as unknown as GetDataOptionsBase` (still behavior-neutral, still inside the file's call path per D-01). Re-running `yarn check` is the authority. |

**If all else:** every other claim in this research is `[VERIFIED]` against the live codebase / live `yarn check` / npm registry this session.

## Open Questions

1. **Does any second fallout site appear once `@types/qs` is live?**
   - What we know: 7 of 8 sites are predicted clean with reasoned type analysis; only `data/[collection]:20` is predicted to error.
   - What's unclear: prediction is static analysis, not an executed type-check with the types installed.
   - Recommendation: the plan's TYPE-01 verification step MUST re-run `yarn check` after the `add` and reconcile actual fallout against this prediction before committing. Treat any surprise as in-scope (D-01), fixed inside the 8 files' call paths.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `qs` (runtime) | existing frontend code | ✓ | 6.15.0 | — |
| `@types/qs` | TYPE-01 fix | ✗ (to be added) | 6.15.1 via `^6.15.0` | none needed — `yarn add -D` installs it |
| TypeScript | `yarn check` | ✓ | 5.9.3 (`catalog:`) | — |
| Yarn 4 workspaces | dependency add | ✓ | (repo standard) | — |
| Local Supabase + host Vite (`:5173`) | full E2E gate (D-04) | ✓ (per project memory `project_gsd_repo_e2e_runs_clean`) | — | none — E2E is a cardinal gate |

**Missing dependencies with no fallback:** none blocking (`@types/qs` is trivially installable).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | svelte-check (type gate) + vitest (unit) + Playwright (E2E) |
| Config file | `apps/frontend/vitest.config.ts` (no include/exclude/coverage); svelte-check via `yarn check` |
| Quick run command | `yarn check` (in `apps/frontend`) — the primary per-cluster measurement |
| Full suite command | `yarn build` && `yarn test:unit` && `yarn check` && `yarn test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPE-01 | 0 `qs` module-declaration errors | type-check | `yarn check 2>&1 \| grep -c "module 'qs'"` → 0 | ✅ (`yarn check`) |
| TYPE-02 | 0 admin-jobs `cookies` errors | type-check | `yarn check 2>&1 \| grep -c "'cookies' does not exist"` → 0 | ✅ |
| TYPE-03 | 0 `_spikes-017-019` errors + dir gone | type-check + fs | `yarn check 2>&1 \| grep -c "_spikes-017-019"` → 0; `! test -d src/lib/contexts/_spikes-017-019` | ✅ |
| (all) | net error count ≤ 133, no net-new | type-check | `yarn check 2>&1 \| grep -E "COMPLETED .* ERRORS"` → `133 ERRORS` | ✅ |
| (all) | no behavior change | integration | full E2E suite passes (cardinal gate, D-04) | ✅ existing suite (125/0/0 at Phase 124 close) |

### Sampling Rate
- **Per cluster commit:** `yarn check` (confirm that cluster at 0 + count dropped by the cluster's error count, no net-new)
- **Per phase gate:** `yarn build` + `yarn test:unit` + `yarn check` (exact accounting: 151 → 133) + one full `yarn test:e2e` run
- **E2E prereqs (project memory):** one fresh dev server on `:5173` (no Playwright webServer — a stale server steals the port), clean DB via `yarn db:reset` + `e2e/base` seed, before the full-suite gate.

### Wave 0 Gaps
- None — `yarn check` / `yarn test:unit` / `yarn test:e2e` all exist and are the standing gates. No new test infrastructure required. TYPE-03 REMOVES test files (expected unit-count drop, not a gap).

## Security Domain

> `security_enforcement` not set in config → treated as enabled. This phase has effectively null security surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Adjacent (unchanged) | The admin-jobs routes gate on `getUserData(...).role === 'admin'`. TYPE-02 removes only the DEAD `cookies` argument that `getUserData` already ignores at runtime — the role check and its cookie-based session (via server `fetch`) are untouched. No access-control behavior change. |
| V5 Input Validation | Adjacent (unchanged) | `qs.parse` of query strings is now type-aware but parsing behavior is identical; the `data/[collection]` cast is type-only. No validation logic changes. |
| V6 Cryptography | No | — |

### Known Threat Patterns for {SvelteKit `+server.ts` / query-string parsing}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Query-param injection via `qs.parse` prototype pollution | Tampering | Out of scope — no parsing behavior changes this phase; `qs` default `plainObjects:false`/depth limits unchanged. Note for awareness only. |
| Auth-gate bypass on admin routes | Elevation of Privilege | Unchanged — `cookies` removal does not alter the `role !== 'admin'` guard or session resolution. Verified behavior-neutral. |

## Sources

### Primary (HIGH confidence)
- Live `yarn check` run (2026-07-15) — exact 151-error baseline, all 18 target errors at exact line:col with exact messages, and the summary line format.
- Direct source inspection — `getUserData.ts:13-19`, all 6 admin-jobs `+server.ts`, all 8 qs importers, `getDataOptions.type.ts`, `vitest.config.ts`, `_spikes-017-019/` + `_spikes-020-class-conversion/` listings, repo-wide reference grep.
- `npm view @types/qs` + dist-tags + `https://api.npmjs.org/downloads/point/last-week/@types/qs` — version, TS-compat mapping, download legitimacy.
- `node -e "require('typescript').version"` → 5.9.3.

### Secondary (MEDIUM confidence)
- Static type-analysis of `@types/qs` `ParsedQs`/`stringify` signatures against the 8 call sites (fallout prediction) — reasoned, not executed with types installed.

### Tertiary (LOW confidence)
- Assumption A1 (per-workspace vs catalog `@types/qs` placement) — to be confirmed by the planner against repo convention.

## Metadata

**Confidence breakdown:**
- Standard stack (`@types/qs`): HIGH — version/compat/legitimacy all verified against the live registry and installed `qs`.
- Error inventory: HIGH — captured verbatim from a live `yarn check`.
- TYPE-01 fallout: HIGH that exactly one new error appears at `data/[collection]:20`; MEDIUM that a single `as GetDataOptionsBase` cast fully clears it (re-run `yarn check` to confirm).
- TYPE-02 / TYPE-03 mechanics: HIGH — occurrence counts, importer references, and vitest coupling all verified.

**Research date:** 2026-07-15
**Valid until:** 2026-08-14 (stable; only invalidated if the 151-baseline shifts from concurrent work on other files — re-baseline `yarn check` at plan time regardless).
