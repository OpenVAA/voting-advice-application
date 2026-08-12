# Phase 125: svelte-check → 0 — Trivial Tier - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 9 modified + 1 dir deletion (4 files) + 1 dependency add
**Analogs found:** 3 / 3 clusters (all intra-repo, exact)

> This is a type-hygiene phase: no NEW files are created. Every change is an edit,
> a dependency add, or a deletion. "Analogs" here are **sibling files that already
> exhibit the correct shape** — copy their shape onto the erroring files.

## File Classification

| File | Cluster | Role | Data Flow | Change | Closest Analog | Match |
|------|---------|------|-----------|--------|----------------|-------|
| `apps/frontend/package.json` | TYPE-01 | config | n/a | add `@types/qs` devDep | existing `@types/node` entry (same file, line 29) | exact |
| `src/routes/api/data/[collection]/+server.ts` | TYPE-01 | route (SSR endpoint) | request-response | one cast fallout at line 20 | `active/+server.ts:23` (`qs.parse(...) as {...}`) | exact |
| `src/lib/utils/route/buildRoute.ts` | TYPE-01 | utility | transform | none (import resolves) | self / stringify-clean | exact |
| `src/lib/utils/route/parseParams.ts` | TYPE-01 | utility | transform | none | self | exact |
| `src/lib/api/base/universalAdapter.ts` | TYPE-01 | service (adapter) | request-response | none | self | exact |
| `src/lib/api/base/universalAdapter.type.ts` | TYPE-01 | type | n/a | none | self | exact |
| `src/routes/(voters)/constituencies/+page.svelte` | TYPE-01 | component (page) | transform | none | self | exact |
| `src/routes/api/admin/jobs/abort-all/+server.ts` | TYPE-02 | route (SSR endpoint) | request-response | drop `cookies` ×2 | any post-fix sibling | exact |
| `src/routes/api/admin/jobs/active/+server.ts` | TYPE-02 | route | request-response | drop `cookies` ×2 | (also TYPE-01 import) | exact |
| `src/routes/api/admin/jobs/past/+server.ts` | TYPE-02 | route | request-response | drop `cookies` ×2 | sibling | exact |
| `src/routes/api/admin/jobs/start/+server.ts` | TYPE-02 | route | request-response | drop `cookies` ×2 | sibling | exact |
| `src/routes/api/admin/jobs/single/[jobId]/abort/+server.ts` | TYPE-02 | route | request-response | drop `cookies` ×2 | sibling | exact |
| `src/routes/api/admin/jobs/single/[jobId]/progress/+server.ts` | TYPE-02 | route | request-response | drop `cookies` ×2 | sibling | exact |
| `src/lib/contexts/_spikes-017-019/` (4 files) | TYPE-03 | test (spike) | n/a | `git rm -r` | `_spikes-020-class-conversion/` (leave as-is) | exact |

## Pattern Assignments

### TYPE-01 — `apps/frontend/package.json` (config)

**Analog:** the existing `@types/node` devDependency **in the same file** (verified line 29):

```jsonc
// apps/frontend/package.json:29 (devDependencies)
"@types/node": "catalog:",
```

vs. the `qs` runtime dep (verified line 76, dependencies):

```jsonc
"qs": "^6.15.0",
```

**Decision point (Research A1):** the repo has BOTH conventions live — `@types/node` uses the shared `catalog:` pin, while `qs` itself is a plain per-workspace `^6.15.0`. Research recommends per-workspace to mirror `qs`:

```bash
yarn workspace @openvaa/frontend add -D @types/qs@^6.15.0
```

Planner note: if the repo's convention prefers `@types/*` via `catalog:` (as `@types/node` does), the planner may add a catalog entry instead — type resolution is identical either way (A1, low risk). Prefer whichever keeps the devDependencies block internally consistent; the per-workspace `^6.15.0` mirrors the sibling `qs` line.

### TYPE-01 — `src/routes/api/data/[collection]/+server.ts` (route, predicted fallout)

**Analog (correct shape to copy):** sibling `active/+server.ts:23` already casts the `qs.parse` result — this is the pattern the erroring line is missing:

```typescript
// active/+server.ts:23 — GOOD: parse result is explicitly cast
const params = qs.parse(url.search.replace(/^\?/g, '')) as { jobType?: AdminFeature };
```

**Erroring site** (verified `data/[collection]/+server.ts:18-20`, no cast — compiles today only because `qs.parse` returns `any`):

```typescript
let options: GetDataOptionsBase | undefined;
try {
  options = qs.parse(url.search.replace(/^\?/g, ''));   // ⚠️ NEW error once @types/qs lands
```

**Fix (copy the sibling's cast pattern; `GetDataOptionsBase` already imported line 8):**

```typescript
options = qs.parse(url.search.replace(/^\?/g, '')) as GetDataOptionsBase;
```

If TS reports insufficient overlap, escalate to `as unknown as GetDataOptionsBase` (still behavior-neutral, per D-01). **Re-run `yarn check` after the add** — the fallout set must be reconciled against the 7-clean/1-error prediction, not trusted blind (Pitfall 3).

### TYPE-02 — admin-jobs routes (6 × route, dead-property removal)

**Analog:** the `getUserData` signature is the source of truth (`src/lib/auth/getUserData.ts:13-19`) — accepts only `{ fetch, parent? }`, never reads `cookies`. Every sibling route once edited becomes the analog for the others.

**Current (erroring) shape** (verified `active/+server.ts:17-18`):

```typescript
export async function GET({ url, cookies, fetch }) {
  if ((await getUserData({ fetch, cookies }))?.role !== 'admin')
```

**Target shape (drop `cookies` from BOTH the destructure AND the call — keep every other param):**

```typescript
export async function GET({ url, fetch }) {
  if ((await getUserData({ fetch }))?.role !== 'admin')
```

**Per-file destructure edits (from Research TYPE-02 table — the call-site edit `{ fetch, cookies }` → `{ fetch }` is identical in all 6):**

| Route | destructure: current → after |
|-------|------------------------------|
| `abort-all/+server.ts` | `{ fetch, cookies, request }` → `{ fetch, request }` |
| `active/+server.ts` | `{ url, cookies, fetch }` → `{ url, fetch }` |
| `past/+server.ts` | `{ url, fetch, cookies }` → `{ url, fetch }` |
| `start/+server.ts` | `{ fetch, cookies, request }` → `{ fetch, request }` |
| `single/[jobId]/abort/+server.ts` | `{ params, request, fetch, cookies }` → `{ params, request, fetch }` |
| `single/[jobId]/progress/+server.ts` | `{ fetch, cookies, params }` → `{ fetch, params }` |

**Pitfall 2:** removing only the call-site `cookies` leaves an unused destructured binding that the mandatory ESLint `no-unused-vars` gate flags. Remove BOTH lines. No inline note needed (plain dead-code removal, D-02 discretion).

### TYPE-03 — `_spikes-017-019/` deletion (4 × spike test)

**Analog:** the sibling `_spikes-020-class-conversion/` directory — error-free, stays untouched. It is the model for "spike scaffolding that has already served its purpose"; `_spikes-017-019` is the same shape but erroring, so it is removed rather than kept.

**Deletion (stage atomically for the TYPE-03 commit):**

```bash
git rm -r apps/frontend/src/lib/contexts/_spikes-017-019/
```

Zero importers (verified grep), no vitest include/exclude/coverage coupling (`vitest.config.ts` has none). **Expected side effect:** the unit-test count drops (these `.test.ts` files currently run) — this is correct, not a regression. D-04 gate requires the suite to PASS, not to match a fixed count.

## Shared Patterns

### Auth-gate call shape (TYPE-02)
**Source of truth:** `src/lib/auth/getUserData.ts:13-19` — `getUserData({ fetch, parent? })`. Session is cookie-based via the cookie-forwarding server `fetch`, NOT via a `cookies` argument.
**Apply to:** all 6 admin-jobs routes. Do NOT widen the signature; do NOT thread cookies through (D-02).

### qs.parse cast idiom (TYPE-01)
**Source:** `active/+server.ts:23` and `past/+server.ts:24` already cast `qs.parse(...)` to a route-local shape.
**Apply to:** `data/[collection]/+server.ts:20` — the one site missing the cast. `stringify` call sites (`buildRoute.ts`, `universalAdapter.ts`) need no change: `@types/qs` types `stringify`'s first arg as `any`.

### Atomic per-cluster commits
**Convention:** Phases 123/124 — one commit per cluster (TYPE-01 / TYPE-02 / TYPE-03) so a bisect isolates them.

### Verified-baseline accounting
**Convention:** capture `yarn check` count BEFORE (151) and AFTER (≤ 133) so "no net-new" is measurable. Assert per-cluster on message text, NOT `TS7016` (the qs message is `module 'qs'`) — Pitfall 1.

## No Analog Found

None. Every change has an exact intra-repo analog (a sibling file, a same-file dependency entry, or a sibling spike dir).

## Metadata

**Analog search scope:** `apps/frontend/package.json`, `apps/frontend/src/routes/api/admin/jobs/**`, `apps/frontend/src/routes/api/data/[collection]/`, `apps/frontend/src/lib/auth/`, `apps/frontend/src/lib/contexts/_spikes-*`
**Files scanned:** package.json (2 lines relevant), active/+server.ts (full), data/[collection]/+server.ts (full)
**Pattern extraction date:** 2026-07-15
