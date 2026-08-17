---
phase: 97
reviewers: [claude]
reviewed_at: 2026-06-05T07:25:44Z
plans_reviewed: [97-01-PLAN.md, 97-02-PLAN.md, 97-03-PLAN.md]
reviewer_note: >-
  Only the `claude` CLI was available on this system (gemini/codex/coderabbit/opencode/qwen/cursor/antigravity
  not installed; no local model servers running). This review was therefore produced by a separate `claude`
  session (fresh context, no plan-authoring bias) rather than a genuinely independent non-Claude model.
  Treat the "Consensus Summary" as a single-reviewer synthesis, not multi-model consensus. For true cross-AI
  adversarial review, install gemini or codex and re-run `/gsd-review --phase 97 --all`.
---

# Cross-AI Plan Review — Phase 97 (Domain A Wave 3: getRoute + Consumer Codemod)

## Claude Review

I've now verified the plans against the actual source. The technical reasoning in the research/patterns is sound, but grounding it in the real code surfaced one structural sequencing flaw that the plans miss. Here is my review.

### 1. Summary

This is a strong, unusually well-grounded set of plans for a high-blast-radius mechanical phase (~280 consumer sites + admin auth). The research correctly grounds the spike findings in the live tree (counts/line numbers re-verified), the destructure-trap and spread-of-context reasoning is correct, the `getRoute` `$derived.by` rewrite genuinely does bypass the `toStore` short-circuit, and the highest-flagged risk (Pitfall 1, the `.current` resolution gap) is resolved correctly with an **additive + atomic-with-codemod** discipline (D-08 Option A). **However, that same additive+atomic discipline is correctly applied to `appSettings`/`dataRoot`/`locale`/`darkMode` but is NOT applied to `getRoute` — and `getRoute`'s producer rewrite is split a full wave (97-02) before the consumer codemod (97-03). Because the rewrite destroys `getRoute`'s store shape, all ~130 untouched `$getRoute(...)` template auto-subscribe sites break the build at the 97-02 commit boundary, contradicting 97-02's own "build green" acceptance criteria.** This is a real, execution-derailing defect with a clean fix (treat `getRoute` like the other four: producer rewrite atomic with the codemod). Everything else is minor.

### 2. Strengths

- **Research is grounded in the real tree, not the stale spike numbers.** I confirmed the live shapes: `adminContext.svelte.ts:97-99` spread (verified), `authContext.svelte.ts:25` `$derived(!!page.data.session)` + `:64-72` getter return (verified), `AdminNav.svelte:32` destructure + `:41-52` six `$getRoute(...)` template calls (verified), `getRoute.svelte.ts:35-43` `writable + afterNavigate` (verified), `reactiveAppSettings`/`reactiveDataRoot` precedents (verified). The "re-run dry-run for live counts, don't hardcode" discipline is exactly right.
- **The destructure-trap / spread reasoning is correct.** `{ ...authContext }` does invoke `get isAuthenticated()` once and capture the boolean; the explicit `get isAuthenticated() { return authContext.isAuthenticated; }` delegation is the right fix, and fixing AdminNav alone (without the spread) would leave it broken (Pitfall 2). D-01 ordering (CONS-03 first) is correct.
- **The `getRoute` `$derived.by` reasoning holds.** Reading `page.params`/`page.route`/`page.url` as separate fields inside `$derived.by` establishes fine-grained deps that each navigation invalidates; returning `{ get current() { return builder; } }` mirrors the verified `reactiveDataRoot.current` precedent (a `$derived`/`$state` read through a getter does propagate). Returning a fresh closure per nav is correct.
- **Pitfall 1 resolved correctly for the 4 stores.** The additive `.current` getter over the *same* `$state`/store the legacy export wraps, landing **atomic** with the codemod `--apply`, is the right call — the store shape survives for same-commit-unmigrated consumers, the build is green before apply, and there is never a broken intermediate. Rejecting Option B (migration-era `reactive*` names in 145 consumers) is well-justified.
- **Good codemod discipline:** dry-run-by-default, idempotency proven by a post-apply dry-run = 0, mandatory human full-diff review (D-02) before the single commit, Pitfall-5 "destructure line untouched" review item, and a `checkpoint:human-verify` admin UAT to cover the genuine "no automated admin E2E spec exists" gap.
- **Threat models are scoped correctly** — the admin-nav reactivity bug is display-correctness (server guards untouched), not privilege escalation.

### 3. Concerns

#### HIGH

- **`getRoute` producer rewrite (97-02) breaks the build for ~130 `$getRoute(...)` template sites that 97-02 does not migrate.** This is the headline issue.
  - 97-02 Task 1 rewrites the producer to return `{ readonly current: RouteBuilder }` **and** changes `appContext.type.ts:65` to `getRoute: { readonly current: RouteBuilder }` (its acceptance asserts `grep -c "readonly current: RouteBuilder" → 1`). After that, `getRoute` is no longer a store.
  - 97-02 only migrates the **13 script-block** `fromStore(getRoute)`/`getRouteState.current(...)` sites. The **133 `$getRoute(opts)` template auto-subscribe sites** (e.g. `AdminNav.svelte:41-52`, verified) are explicitly deferred to 97-03's codemod. But `$getRoute(...)` is store auto-subscribe syntax — it requires `getRoute` to be a `Readable`. Against `{ readonly current }` it is both a **type error** (svelte-check) and a **compile error** (Svelte: not a store).
  - Therefore `yarn build --filter=@openvaa/frontend` is **red at the end of 97-02**, directly contradicting 97-02's acceptance ("`yarn build` green (Task 1 + Task 2 together)") and the VALIDATION per-task build-green gate. A faithful executor hits ~130 errors where the plan says "green."
  - Root cause: the plan author's note in 97-02 Task 1 ("this build will surface the 13 script-block consumers as type errors UNTIL Task 2") accounts only for the 13 `fromStore` sites and **misses the 133 template sites** that the destructive producer change also breaks.
  - **Asymmetry that exposes the fix:** the plan handles the other four stores correctly — *additive* `.current` (store shape survives) + producer change *atomic* with the codemod (97-03). `getRoute` is handled *destructively* (store shape removed) + producer change a *wave earlier* (97-02). Applying the same additive+atomic discipline to `getRoute` removes the red intermediate.

#### MEDIUM

- **`summary.totalHits` will conflate `$store.X` and `$getRoute(` rewrites, muddying the reported counts.** The codemod pushes all hits into one `hits` array (`spike-009...mjs:181` `summary.totalHits += hits.length`), and `summary.byStore` is keyed off `STORE_REWRITES` (`:183-184` `h.match === '$'+store`), which deliberately excludes `getRoute`. So after the new pass: `byStore` shows the 4 stores (~145) but `getRoute` (~133) is *not* in `byStore` — it only inflates `totalHits` to ~278. 97-03 Task 2's instruction to "record the `$store.X` total (~145)" must read the `byStore` breakdown, **not** `totalHits`, and the implementer must add a *separate* getRoute counter (the plan says to, but doesn't note that `byStore` can't capture it and `totalHits` becomes 278). The idempotency assertion ("Total rewrites: 0") still works (both zero), but the pre-apply number recording and the human-review sanity-check are easy to misread.
- **O-2 spread-audit framing is slightly off-target.** Spreading an object whose properties hold *nested* getter-objects (e.g. appContext's `reactiveAppSettings: { get current }`) is safe — `{ ...appContext }` copies the object *reference*, preserving the getter. The actual de-reactivation risk is only a **top-level** `get X()` on a spread *source* that returns a `$derived`/`$state`. I verified appContext's return literal (`appContext.svelte.ts:289-320`) has no top-level getters (all plain `key: value`/shorthand/spreads), and `locale`/`darkMode`/`locales` are store-overridden after the `...componentCtx` spread. So `...appContext` in adminContext is safe. The Task-3 grep for `$derived` in context files is a reasonable proxy, but the audit should explicitly check **whether each `$derived` is exposed as a top-level getter on a spread source AND not subsequently overridden** — otherwise it may either over-flag (nested handles) or under-reason.

#### LOW

- **97-02 Task 2 acceptance `grep -c 'fromStore' admin/login/+page.svelte → 2` is off by one.** After deleting only the `getRouteState` line, the file still has the import line (`:17`) **plus** `fromStore(appSettings)` (`:37`) **plus** `fromStore(darkMode)` (`:38`) = **3** lines containing `fromStore`. The expected value should be `3`, not `2` (the criterion counted the two calls but forgot the import line). As written it would falsely fail the gate.
- **Augmented store construction should use spread, not manual method re-listing.** 97-03 Task 1B says "wrap each in an augmented object literal that forwards subscribe/set/update and adds `get current()`." Prefer `{ ...store, get current() {…} }` over hand-listing `subscribe`/`set`/`update` (avoids missing a method and any `this`-binding surprise). The build only validates the *type*; the runtime subscribe contract is exercised only by unit tests + the surviving `fromStore(appSettings)`/`fromStore(darkMode)` sites in `admin/login` — worth being deliberate. (`toStore` returns own-enumerable methods, so spread is safe.)
- **`getRoute` producer's component-init constraint is preserved but for a new reason.** The old header (`getRoute.svelte.ts:15-16`) notes `afterNavigate` needs component-init context. After the rewrite, `$derived.by` *also* requires runes-init context (it's called from `initAppContext`, which is valid). The plan says "retarget the header rationale" — ensure the retargeted comment still states the init-context requirement so a future reader doesn't move `createGetRoute()` out of init.
- **Bare `$getRoute` (non-call) would be missed.** The codemod pass `(?<![\w$_])\$getRoute(?=\()` only matches the call form. If any site passes `$getRoute` as a value (no `(`), it survives and breaks the build (caught by build, not the `grep -rEc '\$getRoute\(' → 0` gate). Research asserts it's "always a call"; flag as a human-review item.
- **97-03 Task 1 verify gate is brittle:** `node …mjs 2>/dev/null | grep -ic getroute && yarn build`. If `grep` finds 0 matches it exits non-zero and `&&` silently skips `yarn build`. Use `; yarn build` or separate the gates.

### 4. Suggestions

- **Fix the HIGH finding by treating `getRoute` exactly like the other four stores — atomic with the codemod.** Concretely:
  - Move the `getRoute.svelte.ts` producer rewrite **and** the `appContext.type.ts:65` type change **and** the 13 script-block migrations **into 97-03's single atomic commit** (the one that adds the additive `.current` getters and runs `--apply`). In that commit, the "before" state is the old store + `$getRoute(...)` consumers (green) and the "after" state is `{ current }` + codemod-rewritten `getRoute.current(...)` consumers (green) — atomic, no red intermediate, mirroring the appSettings handling exactly.
  - This dissolves 97-02 as a standalone green-building plan. Either fold it into 97-03 or reduce it to non-breaking prep only. 97-01 (CONS-03) remains a clean separate first commit (it leaves `getRoute` a store, so AdminNav's `$getRoute(...)` still builds green).
  - Update D-05's "separate commit per manual fix" to acknowledge that — just as D-08 already folds the hand-edited additive getters into the mechanical commit — the `getRoute` producer rewrite + script-block migrations must also be in that commit. The clean-revert boundary is preserved between 97-01 (CONS-03) and the atomic codemod commit.
  - (If keeping a separate `getRoute` producer commit is desired for revert granularity, the only green-preserving alternative is to make `getRoute` *transiently additive* — keep a store bridge **plus** `.current` — codemod the templates, then drop the bridge. That re-introduces the very `afterNavigate`/bridge complexity D-04 removes, for two commits. The atomic-merge is cleaner; recommend it.)
- **Correct the count-reporting in 97-03 Task 2:** specify that the pre-apply `$store.X` total comes from the `byStore` breakdown (the 4 stores), that the new `$getRoute` count is a separate counter, and that `totalHits` will read ~278 (sum). State the idempotency check as "post-apply: `byStore` all 0 **and** `$getRoute` 0."
- **Fix the `grep -c 'fromStore' → 2` acceptance to `→ 3`** in 97-02 (or wherever the script-block migration lands after restructuring), and prefer asserting "no `fromStore(getRoute)` and no `getRouteState` remain" over a raw `fromStore` line count.
- **Tighten the O-2 audit** to check for top-level `$derived` getters on spread *sources* that are not overridden, and explicitly note nested `{ get current }` handle objects are reference-copied (safe) so they aren't false-flagged.
- **Add the optional `getRoute.current('Home')` unit test** (VALIDATION already calls it recommended-non-blocking). Given there is no automated admin E2E, a tiny unit lock on the producer is cheap insurance for CTX-08.

### 5. Risk Assessment

**Overall risk: MEDIUM (currently MEDIUM-HIGH; drops to LOW once the sequencing fix lands).**

Justification: The phase is mechanical with browser-verified shapes, an idempotent dry-run-first codemod, a mandatory human diff review, strong build/typecheck gates, and a UAT for the un-automatable admin path — all of which sharply limit downside. The CONS-03 fix and the `getRoute` `$derived.by` rewrite are correct as designed, and Pitfall 1 (the genuinely scary item) is resolved well. The one material risk is the **getRoute producer/consumer wave split**, which makes 97-02 a red-building commit and would stall an autonomous executor that trusts the "build green" acceptance. It is a structural/commit-shape fix, not a redesign — apply the same additive/atomic discipline the plan already uses for the other four stores and the broken-intermediate disappears. The remaining items are minor acceptance-criteria and reporting nits. With the HIGH finding addressed, the plans achieve all four requirements (CTX-08, CONS-01, CONS-02, CONS-03) cleanly.

---

## Consensus Summary

> **Single-reviewer caveat:** only the `claude` CLI was available (a separate, fresh `claude` session — no plan-authoring bias, but not an independent non-Claude model). The synthesis below reflects that one reviewer. Install `gemini` or `codex` and re-run for genuine cross-AI consensus.

### Agreed Strengths

- Research and plans are grounded in the **live tree** (counts and line numbers re-verified against actual source), not stale spike numbers.
- The **destructure-trap / spread-of-context** reasoning (CONS-03) and the **`getRoute` `$derived.by`** rewrite (CTX-08) are technically correct.
- **Pitfall 1** (the `.current` resolution gap) is resolved well via D-08 Option A: additive `.current` getters landing atomic with the codemod.
- Strong **codemod discipline**: dry-run-by-default, idempotency proof, mandatory human full-diff review (D-02), and a `checkpoint:human-verify` admin UAT covering the missing automated admin E2E.

### Agreed Concerns (priority order)

1. **[HIGH] `getRoute` producer/consumer wave split breaks the build at the 97-02 commit boundary.** The 97-02 producer rewrite destroys `getRoute`'s store shape, but the ~130–133 `$getRoute(...)` template auto-subscribe sites aren't migrated until 97-03's codemod — so `yarn build` is red at the end of 97-02, contradicting its own "build green" acceptance. **Fix:** treat `getRoute` like the other four stores — move the producer rewrite + `appContext.type.ts:65` type change + 13 script-block migrations into 97-03's single atomic codemod commit. Consider folding 97-02 into 97-03 or reducing it to non-breaking prep.
2. **[MEDIUM] Count-reporting conflation** — `summary.totalHits` will read ~278 (sum of 4 stores + getRoute), and `byStore` deliberately excludes `getRoute`. 97-03 Task 2 must read `$store.X` totals from `byStore`, add a separate getRoute counter, and state idempotency as "byStore all 0 AND $getRoute 0."
3. **[MEDIUM] O-2 spread-audit framing** — only **top-level** `get X()` returning `$derived`/`$state` on a spread *source* (and not subsequently overridden) de-reactivates; nested `{ get current }` handles are reference-copied and safe. Tighten the audit accordingly (appContext spread verified safe).
4. **[LOW] Acceptance-criteria nits:** `grep -c 'fromStore' → 2` should be `→ 3` (forgot the import line); prefer `{ ...store, get current() }` spread over manual method re-listing; retarget the init-context header comment; flag bare-`$getRoute` (non-call) as a human-review item; fix the brittle `grep … && yarn build` gate (use `;` not `&&`).

### Divergent Views

None — single reviewer. Re-run with an independent model to surface disagreement, especially on the HIGH finding's recommended fix (atomic-merge vs. transiently-additive bridge).
