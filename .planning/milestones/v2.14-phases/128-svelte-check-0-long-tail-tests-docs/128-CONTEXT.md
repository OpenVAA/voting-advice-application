# Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Fourth and final clearing phase of the svelte-check → 0 workstream (Phases 125–128, gate-flip in 132). The remaining **24 frontend errors** (TYPE-07 long-tail singles + TYPE-08 test errors) and **both a11y warnings** (frontend `Term.svelte` + `apps/docs` — TYPE-09) are resolved, so the monorepo svelte-check reads **0 errors / 0 warnings** ahead of the Phase 132 absolute-gate flip. **No runtime behavior change** (the two a11y source-fixes are deliberate markup corrections, not behavior drift) — full E2E suite as the safety net.

**Ground truth verified 2026-07-16** (fresh runs saved during discussion — scratchpad `svelte-check-128-baseline.txt`):

- Frontend baseline: **24 errors / 1 warning** (`COMPLETED 2090 FILES 24 ERRORS 1 WARNINGS 11 FILES_WITH_PROBLEMS`) — exactly matches Phase 127's pinned close.
- `apps/docs`: **0 errors / 1 warning** (`src/routes/+page.svelte` 91:1 — `<section>` with touchstart/touchend handler must have an ARIA role).
- The ROADMAP's original estimates (~25 long-tail + ~19 test) are stale — actual decomposition of the 24:
  - **serverClient/AdapterConfig seam — 13 errors, ONE root cause** (spans TYPE-07 + TYPE-08): call sites hold the writer as base `UniversalDataWriter`, whose `init({ fetch }: AdapterConfig)` accepts only `{ fetch }` — but `SupabaseAdapterConfig` legitimately declares `serverClient?` and the mixin's `init()` consumes it (runtime already correct; only the static type at the call sites lies). Sites: `routes/candidate/(protected)/+layout.server.ts` (2, prod) + `supabaseDataProvider.test.ts` (9 of its 10) + `supabaseDataWriter.test.ts` (1 of its 4) + `supabaseAdminWriter.test.ts` (1).
  - **Password-API mismatches — 5 errors**: `settings/+page.svelte` 52:40 (`currentPassword` not in the wrapper's `{ password }` type — the writer's real signature is `setPassword(opts: WithAuth & { currentPassword: string; password: string })`, `universalDataWriter.ts:147`) + 121:11 (`confirmPasswordTestId` prop doesn't exist on `PasswordSetter`); `supabaseDataWriter.test.ts` 353:44 + 363:36 (tests pass `{ password }` where `register()` requires `{ registrationKey, password }`).
  - **Scattered singles — 6 errors**: `viewTransition.ts` 26:11 (`DocumentWithViewTransition` now conflicts with TS's built-in View Transition lib types — `types` property missing); `EntityInfo.svelte` 80:28 (no-overlap `'organization'`/`'candidate'` comparison); `(voters)/(located)/questions/+layout.svelte` 232:11 + `candidate/(protected)/questions/[questionId]/+page.svelte` 282:11 (`string` → `number`); `FeedbackPopup.svelte` 35:38 (`'idle'` not in `SendingStatus`); `supabaseDataProvider.test.ts` 59:5 (thenable-mock `then` signature).
- Expected post-phase count: **frontend 0 errors / 0 warnings; docs 0 errors / 0 warnings** (this phase clears everything known; Phase 132 flips the gate and re-proves it).
- `_spikes-020-class-conversion/` still exists (4 files: 020-class-core, 021-class-localstorage, 022-class-version-bridge, 023-class-ssr-effect `.spike.svelte.test.ts`) — currently error-free; disposition decided below (D-05).

**Out of bounds:** The Strapi-era auth-flow investigations (`password-reset-code-method`, `register-page-registrationkey-method` todos) — types are aligned to runtime truth here, flows are NOT redesigned or deleted. RPC RETURNS-TABLE nullability audit stays backlog. Gate flip + 3× determinism is Phase 132. New features are Phases 129+. Cluster-scoped discipline carries forward.

</domain>

<decisions>
## Implementation Decisions

### serverClient type seam (13 errors, one root cause)
- **D-01 — Concrete typing at the seam.** Expose/consume the writer as `SupabaseDataWriter` where Supabase-specific config is passed — `routes/candidate/(protected)/+layout.server.ts` and the 3 adapter test files — so `init(config: SupabaseAdapterConfig)` typechecks naturally. Mirrors Phase 127 D-01 honesty: the adapter switch is gone (CLAUDE.md: Supabase is the only production adapter), so sites passing `serverClient` may know the concrete adapter. Do NOT widen the universal `AdapterConfig` (would leak `SupabaseClient<Database>` into the adapter-agnostic layer) and do NOT introduce a generic `TConfig` param on the base hierarchy (bigger diff for the same 13 errors). Zero change to the universal layer.

### Password-API mismatches (5 errors)
- **D-02 — Type-truth only; flows untouched.** Align types with what runtime actually does: widen the context/wrapper type so the settings page's `setPassword({ currentPassword, password })` call matches the writer's real signature; fix the tests to pass what `register()`'s signature requires. The two Strapi-era flow-investigation todos stay backlog — no auth-flow branches are deleted or redesigned in this phase.
- **D-03 — Kill the dead `confirmPasswordTestId` prop; rely on the hardcoded testid.** `PasswordSetter` already hardcodes `data-testid="password-setter-confirmation"` (and `password-setter-password`) on its wrapper divs, and the E2E fixture (`tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts`) uses ONLY those via `testIds.candidate.passwordSetter.*`. The `confirmPasswordTestId="settings-confirm-password"` pass in `settings/+page.svelte:121` never rendered as a usable testid (it fell into form `restProps`), and the catalogue entry `settings.confirmPassword: 'settings-confirm-password'` (`tests/tests/utils/testIds.ts:71`) is dead — no spec references it. Fix: **do NOT add a prop** — drop the dead prop pass from the settings page, keep the hardcoded component testids, and reconcile the testIds catalogue (remove or repoint the dead `settings-confirm-password` entry so the catalogue reflects the hardcoded ids). Per user: "hardcode the confirmPasswordTestId into the PasswordSetter's confirmation input — there's no need to pass a separate test id for it; check that it's reflected in the testIds catalogue."

### Test & spike scaffolding (TYPE-08)
- **D-04 — Fix test errors honestly.** Remaining test errors (thenable mock at dataProvider.test 59:5, `LocalizedAnswers` image-answer shape at dataWriter.test 290:9, register-signature args) are fixed by typing mocks/args correctly to the real signatures — no `any`-casting to silence.
- **D-05 — Delete `_spikes-020-class-conversion/` entirely** (all 4 spike test files). Consistent with the Phase 125 D-03 deletion of 017-019: findings are durably preserved in `.planning/spikes/` + the `spike-findings-voting-advice-application-gsd` skill; the scaffolding runs in every unit sweep for no ongoing value. Verify zero importers before deletion (same grep check as 125).

### A11y warnings → 0 (TYPE-09 + Term.svelte)
- **D-06 — Fix both warnings at source.** Real markup fixes, not `svelte-warning: accepted` comments — WCAG 2.1 AA is a project requirement and source-fix is the convention-preferred outcome. `Term.svelte` 91:1 (noninteractive element with nonnegative tabindex → needs proper interactive semantics or the tabindex dropped, judged against the component's actual focus behavior); `apps/docs/src/routes/+page.svelte` 91:1 (`<section>` with touch handlers → ARIA role or semantics restructure). These are deliberate a11y corrections — the only intentional markup changes in the phase; E2E + visual sanity as the net.

### Acceptance gate
- **D-07 — Carry forward the workstream full gate (125 D-04 / 126 D-06 / 127 D-06 convention), extended to docs.** Success = build + unit tests + frontend svelte-check at **0 errors / 0 warnings** (24 → 0 exact; no net-new) + **`apps/docs` svelte-check at 0 errors / 0 warnings** + one full green E2E suite run (cardinal rule — failing or did-not-run blocks completion). E2E prereqs per convention: fresh dev server on :5173 (no Playwright webServer), clean DB (`yarn db:reset`) first; watch for the storage/imgproxy 502-wedge (remedy: `supabase stop && supabase start`; also check for orphaned Supabase stacks squatting ports 54321–54327 — the 127-03 recovery precedent). Capture before/after counts in verification evidence.

### Claude's Discretion
- Exact mechanism for D-01's concrete typing (retype the export, local narrowing at the call sites, or typed accessor) — smallest honest diff wins; `prepareDataWriter`'s Phase-127 seam must keep compiling.
- Per-error fixes for the 6 scattered singles — mechanical type-truth fixes; for `viewTransition.ts` prefer adopting/aligning with TS's built-in View Transition types over maintaining a parallel interface.
- The `EntityInfo.svelte` no-overlap comparison and the two `string`→`number` errors: determine which side lies (the comparison/value or the declared type) and fix the lying side; flag in the SUMMARY if any turns out to mask a real logic bug rather than a type lie.
- `FeedbackPopup` `'idle'`: extend `SendingStatus` or map the state — whichever reflects the component's actual state machine.
- Commit granularity — prefer atomic per-cluster commits (serverClient seam / password APIs / singles / spike deletion / a11y warnings) so regressions bisect cleanly (workstream convention).
- Fallout rule (125 D-01 precedent): if a fix surfaces follow-on errors caused by this phase's changes, fix them in-phase; genuinely pre-existing out-of-scope issues get filed, not fixed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 128 entry (goal + 3 success criteria; ~line 478). Note the per-requirement counts (~25/~19) are stale; this CONTEXT's verified decomposition governs.
- `.planning/REQUIREMENTS.md` — TYPE-07 (line 104), TYPE-08 (line 105), TYPE-09 (line 106). TYPE-10 is Phase 132 — do NOT pull in.

### D-01 — serverClient seam
- `apps/frontend/src/lib/api/base/universalAdapter.type.ts` (line 4) — base `AdapterConfig = { fetch }`; stays UNCHANGED per D-01.
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` (line 9) — `SupabaseAdapterConfig extends AdapterConfig` with `locale?/defaultLocale?/serverClient?` (the honest config type).
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` (lines 28–54) — the mixin `init()` that consumes `serverClient` (runtime ground truth).
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` (errors 27:28, 67:30) — the 2 prod call sites.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` (9 serverClient errors + thenable mock at 59:5).
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` (serverClient at 59:7; LocalizedAnswers at 290:9; register args at 353:44, 363:36).
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` (serverClient at 60:7).
- `apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts` — Phase 127's retyped seam (sync `UniversalDataWriter`); must keep compiling under D-01.

### D-02/D-03 — password APIs & PasswordSetter
- `apps/frontend/src/lib/api/base/universalDataWriter.ts` (lines 39–43, 143–148, 248–258) — real signatures: `setPassword(WithAuth & { currentPassword; password })`, `register({ registrationKey; password })`, `resetPassword({ code; password })`.
- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` (errors 52:40, 121:11) — the settings-page call site + dead prop pass.
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` (lines 76, 80) — hardcoded `password-setter-password` / `password-setter-confirmation` testids (keep).
- `tests/tests/utils/testIds.ts` (line 71 dead `settings.confirmPassword`; lines 139–140 live `passwordSetter.*`) — catalogue to reconcile per D-03.
- `tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts` — the E2E fixture proving only `passwordSetter.*` ids are consumed.

### D-05 — spike scaffolding
- `apps/frontend/src/lib/contexts/_spikes-020-class-conversion/` — the directory to delete (4 files).
- `.planning/spikes/MANIFEST.md` + `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` — where findings are durably preserved (why deletion is safe).

### D-06 — a11y warnings
- `apps/frontend/src/lib/components/term/Term.svelte` (91:1) — `a11y_no_noninteractive_tabindex`.
- `apps/docs/src/routes/+page.svelte` (91:1) — `a11y_no_static_element_interactions` (`<section>` + touchstart/touchend).

### Long-tail singles (TYPE-07)
- `apps/frontend/src/lib/utils/viewTransition.ts` (26:11) — `DocumentWithViewTransition` vs TS built-in View Transition types.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte` (80:28) — no-overlap comparison.
- `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` (232:11) + `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` (282:11) — `string`→`number`.
- `apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte` (35:38) — `'idle'` vs `SendingStatus`.

### Workstream context & conventions
- `.planning/phases/127-svelte-check-0-adapter-layer-contexts/127-03-SUMMARY.md` — residual-24 per-file breakdown (this phase's baseline evidence) + the E2E flake-triage and 502-wedge/orphaned-stack recovery precedents.
- `.planning/phases/127-svelte-check-0-adapter-layer-contexts/127-CONTEXT.md` — D-01 sync-writer seam (must not regress), D-04 test-scope pin that defined this phase's inheritance.
- `.planning/phases/125-svelte-check-0-trivial-tier/125-CONTEXT.md` — fallout-fix rule (D-01 precedent), spike-deletion precedent (D-03), cluster-scoped discipline.
- `.planning/todos/pending/2026-06-12-resolve-all-svelte-check-errors.md` — workstream umbrella (tagged `resolves_phase: 132`, NOT this phase — but this phase clears the last known errors).

### Review gate
- `.agents/code-review-checklist.md` — mandatory per CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- svelte-check: `yarn check` inside `apps/frontend` (baseline raw output in scratchpad `svelte-check-128-baseline.txt`) and inside `apps/docs` — the before/after measurement tools.
- `SupabaseAdapterConfig` already models the seam correctly — D-01 is consumption-side typing only; no new types needed.
- Hardcoded `password-setter-*` testids + `candidatePasswordSetter.fixture.ts` — the live E2E contract D-03 preserves.
- Existing gates: `yarn build`, `yarn test:unit`, `yarn test:e2e` (suite last green 125/0/0 at Phase 127 close).

### Established Patterns
- **Verified-baseline convention** — 24/1 frontend + 0/1 docs re-verified via fresh runs during this discussion.
- **Atomic per-cluster commits** — workstream convention (Phases 123–127) for clean bisects.
- **E2E cardinal rule** — full-suite run is the trust signal; "did not run" counts as failure. Fresh dev server on :5173 + `yarn db:reset` before the gate.
- **Flake-triage precedent (127-03)** — a first-run flake with an error-context snapshot proving correct app state → clean re-run with zero code change is the accepted triage path; did-not-run cascades are NOT accepted.
- **`// reason:` / `svelte-warning: accepted` idioms** — last resort only; D-06 explicitly chooses source fixes over acceptance comments.

### Integration Points
- The writer instance is shared across `+layout.server.ts`, contexts (via Phase 127's `prepareDataWriter`), and the adapter tests — D-01's concrete typing must not regress the 127 seam (sync `UniversalDataWriter` param there stays valid since `SupabaseDataWriter` IS one).
- `testIds.ts` is the single E2E selector catalogue — D-03's reconciliation touches test infrastructure, so the full E2E run doubles as the proof nothing consumed the dead entry.
- `Term.svelte` is a shared voter/candidate component — its a11y fix is the one production-DOM change with app-wide surface; E2E + a quick visual sanity check cover it.
- `_spikes-020` files import app contexts (that's what they spike) but nothing imports THEM — deletion is isolated after the importer grep re-check.

</code_context>

<specifics>
## Specific Ideas

- The phase is really "one seam retype + one dead-prop deletion + a handful of mechanical singles + two honest a11y fixes + one dir deletion": 13 of 24 errors dissolve at the serverClient seam alone. Expect a small diff dominated by test-file edits.
- Expected end state: two measurable lines — frontend `0 ERRORS 0 WARNINGS`, docs `0 ERRORS 0 WARNINGS` — plus a green full E2E run. Phase 132 then flips the absolute gate.
- User's explicit instruction on the confirm-password testid: hardcode in the component (already the case), no prop, and make sure the testIds catalogue reflects reality.

</specifics>

<deferred>
## Deferred Ideas

- **Strapi-era auth-flow investigations** — `password-reset-code-method.md`, `register-page-registrationkey-method.md`: D-02 deliberately types the flows as-is; whether the code-based reset / registrationKey branches are dead code remains an open backlog investigation.
- **RPC RETURNS-TABLE nullability audit** — `2026-07-16-rpc-returns-table-nullability-audit.md`: design task, still backlog (127 D-03 lineage).

### Reviewed Todos (not folded)
- `register-page-registrationkey-method.md` — the 2 test errors sit on this API, but D-02 fixes types only; the flow-validity investigation stays backlog.
- `password-reset-code-method.md` — adjacent to the setPassword error sites; same type-truth-only boundary.
- `2026-07-16-rpc-returns-table-nullability-audit.md` — per-column design audit, not error clearing; backlog.
- `2026-06-12-resolve-all-svelte-check-errors.md` — workstream umbrella (→ Phase 132 gate flip); Phase 128 clears the final known slice but does not resolve the umbrella.
- `2026-07-16-perm-hide-election-tags-navigation-timing-flake.md` — Phase 131 flake-triage scope (filed there at 127 close).
- `2026-06-15-fix-view-transition-flicker-in-results-section.md` — UI behavior work; only coincidentally adjacent to the `viewTransition.ts` type fix (which must stay behavior-neutral).
- Remaining keyword matches (MultipleTextQuestion, nominations fetch, alliance render, party-app, etc.) — Phases 129+ feature work or unrelated backlog.

</deferred>

---

*Phase: 128-svelte-check-0-long-tail-tests-docs*
*Context gathered: 2026-07-16*
