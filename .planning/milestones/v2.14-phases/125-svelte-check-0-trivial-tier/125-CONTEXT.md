# Phase 125: svelte-check → 0 — Trivial Tier - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

The opening phase of the svelte-check → 0 workstream (Phases 125–128, gate-tightening in 132). Three quick, low-risk type-error clusters in `apps/frontend` are cleared — **~18 of the 151-error baseline** — with **no behavior change**:

1. **TYPE-01 — `qs` ambient types (8 × TS7016).** `qs@^6.15.0` is a direct frontend dependency with no bundled types, imported in 8 files.
2. **TYPE-02 — admin-jobs `cookies` cluster (6 errors).** All 6 `src/routes/api/admin/jobs/**/+server.ts` routes call `getUserData({ fetch, cookies })`, but `getUserData` accepts only `{ fetch, parent? }` and never reads cookies (the session flows via the cookie-forwarding server `fetch`). `cookies` is a dead excess property.
3. **TYPE-03 — `_spikes-017-019` scaffolding (4 errors).** All 4 errors are in `018b-snapshot-mechanism.spike.svelte.test.ts`; the whole leftover spike dir is deleted.

**Ground truth verified 2026-07-15:** frontend svelte-check reports exactly **151 errors / 1 warning**; all three clusters confirmed present with the exact counts above (8 + 6 + 4 = 18). Expected post-phase count: **≤ 133**.

**Out of bounds:** `supabaseDataProvider` (Phase 126), adapter layer + contexts (Phase 127), long-tail/tests/docs incl. `_spikes-020-class-conversion` (Phase 128), gate tightening to zero (Phase 132). No UI phase needed — type-only hygiene work with zero visual surface.

</domain>

<decisions>
## Implementation Decisions

### TYPE-01 — qs typing mechanism
- **D-01 — `@types/qs` devDependency, fix fallout in-phase.** Add `@types/qs` to `apps/frontend` devDependencies (matching the installed `qs@^6.15.0` major). Real types are preferred over a `declare module 'qs'` shim (which would leave qs as `any` everywhere — zero type value). **If real types surface NEW errors in the 8 importing files, fix them within this phase** — they are part of honestly clearing the cluster, not deferred fallout. The 8 importing files: `src/lib/utils/route/buildRoute.ts`, `src/lib/utils/route/parseParams.ts`, `src/lib/api/base/universalAdapter.ts`, `src/lib/api/base/universalAdapter.type.ts`, `src/routes/api/admin/jobs/active/+server.ts`, `src/routes/api/admin/jobs/past/+server.ts`, `src/routes/api/data/[collection]/+server.ts`, `src/routes/(voters)/constituencies/+page.svelte`.

### TYPE-02 — cookies cluster direction
- **D-02 — Drop `cookies` from the 6 call sites.** Remove the dead `cookies` property from each `getUserData({ fetch, cookies })` call (and the now-unused `cookies` destructure from the handler signature where nothing else uses it). Do NOT widen `getUserData`'s signature (codifies a dead parameter) and do NOT thread cookies through (auth-plumbing change, out of trivial-tier scope). Behavior-neutral: the property was silently ignored at runtime. The 6 routes: `abort-all`, `active`, `past`, `start`, `single/[jobId]/abort`, `single/[jobId]/progress` under `src/routes/api/admin/jobs/`.

### TYPE-03 — spike scaffolding deletion
- **D-03 — Delete the entire `src/lib/contexts/_spikes-017-019/` directory** (all 4 files: 017-readwrite-split-dataroot, 018-readwrite-split-producer-inputs, 018b-snapshot-mechanism, 019-readwrite-split-destructure-trap `.spike.svelte.test.ts`). Findings are durably preserved in `.planning/spikes/` and the `spike-findings-voting-advice-application-gsd` skill — the scaffolding has no ongoing value. Nothing imports these files (verified). **`_spikes-020-class-conversion/` stays untouched** — it is error-free and belongs to Phase 128 (TYPE-08) if it needs anything at all.

### Acceptance gate & baseline accounting
- **D-04 — Full gate with exact per-cluster accounting.** Success = build + unit tests + svelte-check showing **all 18 targeted errors gone with no net-new errors (final count ≤ 133)**, verified per-cluster (0 qs TS7016, 0 admin-jobs cookies errors, 0 _spikes-017-019 errors), **plus one full E2E suite run as the trust signal** (Phase 123 D-03 convention; cardinal rule — a failing or did-not-run E2E test blocks completion). Capture the before (151) and after counts in the verification evidence. Rationale for not skipping E2E: the spike-dir deletion and call-site edits touch runtime-adjacent files, and any D-01 fallout fixes may touch route/adapter code.

### Claude's Discretion
- Exact commit granularity — prefer one atomic commit per cluster (TYPE-01 / TYPE-02 / TYPE-03) so a bisect can isolate them.
- How D-01 fallout fixes (if any) are typed — as long as they stay behavior-neutral and inside the 8 importing files' call paths.
- Whether the handler-signature `cookies` destructure removal warrants any inline note (it shouldn't — plain dead-code removal).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 125 entry (goal + 4 success criteria; lines ~401–415).
- `.planning/REQUIREMENTS.md` — TYPE-01 (line 98), TYPE-02 (line 99), TYPE-03 (line 100). TYPE-04+ are Phases 126–128 — do NOT pull in.

### TYPE-01 — qs cluster
- `apps/frontend/package.json` — `qs: ^6.15.0` dependency (line ~76); `@types/qs` devDependency lands here.
- The 8 importing files listed in D-01.

### TYPE-02 — cookies cluster
- `apps/frontend/src/lib/auth/getUserData.ts` (lines 13–19) — the actual signature `{ fetch: Fetch; parent?: () => Promise<{ session?: unknown }> }`; never reads cookies; comment at line 29 confirms session is cookie-based via fetch.
- `apps/frontend/src/routes/api/admin/jobs/` — the 6 `+server.ts` files listed in D-02.

### TYPE-03 — spike scaffolding
- `apps/frontend/src/lib/contexts/_spikes-017-019/` — the directory to delete (4 files).
- `.planning/spikes/MANIFEST.md` + `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` — where spike findings are durably preserved (why deletion is safe).

### Workstream context
- `.planning/todos/pending/2026-06-12-resolve-all-svelte-check-errors.md` — the workstream umbrella todo (151-error baseline origin; tagged `resolves_phase: 132`, NOT this phase).
- `.planning/phases/123-svelte-5-idiom-polish-lifecycle-reactive-state/123-CONTEXT.md` — D-03 acceptance-gate convention this phase carries forward.

### Review gate
- `.agents/code-review-checklist.md` — mandatory per CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- svelte-check run command: `yarn check` inside `apps/frontend` (2093 files; current output ends `151 ERRORS 1 WARNINGS 30 FILES_WITH_PROBLEMS`) — the before/after measurement tool.
- Existing gates: `yarn build`, `yarn test:unit`, `yarn test:e2e` (host Vite + local Supabase; suite last ran 125/0/0 clean at Phase 124 close).

### Established Patterns
- **Verified-baseline convention** — capture the svelte-check count BEFORE changes so "no net-new" is measurable (Phase 123 D-03; baseline re-verified at 151 during this discussion).
- **Atomic per-cluster commits** — workstream convention (Phases 123/124) so regressions bisect cleanly.
- **E2E cardinal rule** — full-suite run is the trust signal; "did not run" counts as failure.

### Integration Points
- `getUserData` is shared auth plumbing (`$lib/auth`) — D-02 deliberately avoids touching it; only call sites change.
- `qs` types flow into route-param utilities (`buildRoute`/`parseParams`) and `universalAdapter` — the most likely D-01 fallout surface; these are used across voter/candidate routing.
- `_spikes-017-019` has zero importers (verified by grep) — deletion is isolated.

</code_context>

<specifics>
## Specific Ideas

- This is the "trivial tier" on purpose: three independent, mechanically-verifiable clusters. Keep each fix minimal and cluster-scoped; resist any temptation to fix neighboring type errors (they belong to Phases 126–128 and would muddy the exact accounting).
- The expected end state is a single measurable line: svelte-check drops 151 → ≤ 133 with the three clusters each at zero.

</specifics>

<deferred>
## Deferred Ideas

None raised — discussion stayed within phase scope.

### Reviewed Todos (not folded)
- `2026-06-12-resolve-all-svelte-check-errors.md` — the whole-workstream umbrella (151 → 0), tagged `resolves_phase: 132`; Phase 125 only clears its trivial tier.
- `2026-06-03-after-runes-update-check-stale-app-header-styling-banner-ima.md`, `2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md` — UI todos matched by keyword only; the first was already folded/resolved in Phase 124, the second is unrelated UI polish.
- `2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` — RUNES-03, folded into Phase 124.
- Remaining keyword matches (nominations fetch, MultipleTextQuestion, auth-code migration, etc.) — feature/architecture work belonging to Phases 129+ or the backlog; none are type-hygiene scope.

</deferred>

---

*Phase: 125-svelte-check-0-trivial-tier*
*Context gathered: 2026-07-15*
