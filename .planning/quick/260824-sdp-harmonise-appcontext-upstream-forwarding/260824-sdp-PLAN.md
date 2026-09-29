---
quick_id: 260824-sdp
slug: harmonise-appcontext-upstream-forwarding
type: quick
date: 2026-08-24
---

<objective>
Harmonise `AppContextProvider`'s upstream forwarding onto the ONE mechanism the repo already has for exactly this problem: `contexts/utils/inheritContextMembers.ts` (written in Phase 113 CR-01, already adopted by `voterContext` / `candidateContext` / `adminContext` for their inherit-from-appContext step).

Today appContext's "EXPLICIT FORWARDING" block (`appContext.svelte.ts:321-360`) uses THREE ad-hoc mechanisms for THREE upstream contexts:
1. a hand-rolled `Object.defineProperty` accessor install for the one reactive member (`dataRoot`, `:335-341`), and
2. a single `Object.assign(this, { … })` value-copy (`:343-360`) carrying `t`/`translate` (componentCtx), `setDataRoot` (dataCtx), and 8 hand-listed tracking members.

After this change:
- componentCtx stays an **explicit selective** forward (`t` + `translate` only) — appContext deliberately OVERRIDES `locale`/`locales`/`darkMode` with its own accessor/handles, and `componentCtx.darkMode` is a prototype getter (not own-enumerable) anyway. A blanket inherit there would be wrong.
- dataCtx becomes a **full** forward: `inheritContextMembers(this, this.#dataCtx)`.
- tracking becomes a **full** forward: `inheritContextMembers(this, this.#tracking)` — GATED on the Task 1 surface proof.

**This is a pure mechanism-harmonisation refactor. Runtime behaviour MUST NOT change**: every member appContext exposes today must still be exposed, with the same own-enumerability and the same reactivity. The decision is already made — do not re-litigate it, do not explore alternatives.
</objective>

<context>

**Files (all under `apps/frontend/src/lib/contexts/`)**

| File | Role |
|---|---|
| `app/appContext.svelte.ts` | THE file being changed (Task 2) |
| `app/tracking/trackingService.svelte.test.ts` | gets the surface-lock guard (Task 1) |
| `app/appContext.spread.svelte.test.ts` | THE regression guard for this change; gets the live-forwarding guard (Task 3) |
| `utils/inheritContextMembers.ts` | the helper being adopted — **DO NOT MODIFY** |
| `data/dataContext.svelte.ts` | upstream source — **DO NOT MODIFY** (read-only, for the surface proof) |
| `app/tracking/trackingService.svelte.ts` | upstream source — **DO NOT MODIFY** (read-only, for the surface proof) |

**Why the helper is semantically equivalent here (the whole basis of the change).** `inheritContextMembers` copies each own-enumerable member BY PROPERTY DESCRIPTOR (`utils/inheritContextMembers.ts:27-56`):
- an **accessor** member (`get`/`set` pair) is re-installed as a LIVE forwarding accessor delegating to the source on every read — i.e. byte-equivalent to today's hand-rolled `get() { return self.#dataCtx.dataRoot; }` install, and the reactive `#version` re-read still happens inside the CONSUMER's tracking scope;
- a **data** member (arrow field, stable `{ current }` handle, plain value) is copied by value with `enumerable: true` — i.e. byte-equivalent to today's `Object.assign` copy.

**Upstream surfaces (read, confirmed statically during planning — Task 1 must PROVE them at runtime):**
- `DataContextProvider` (`data/dataContext.svelte.ts`) own-enumerable surface = `dataRoot` (accessor installed via `Object.defineProperty(..., { enumerable: true })` in its constructor) + `setDataRoot` (arrow field). Everything else on that class is `#`-private (`#dataRoot`, `#version`).
- `TrackingServiceImpl` (`app/tracking/trackingService.svelte.ts`) own-enumerable surface = `sessionId`, `sendTrackingEvent`, `shouldTrack`, `startPageview`, `startEvent`, `submitAllEvents`, `track`, `resetAllEvents` (8) — everything else is `#`-private. That is EXACTLY the 8 keys appContext hand-lists today.

**Ordering constraint — DO NOT BREAK.** `this.#tracking` is assigned in the constructor producers block (`appContext.svelte.ts:314-317`), BEFORE the forwarding block at `:321`. The forwarding block MUST stay below it. (`this.#dataCtx` is a field initializer, so it is available either way — but do not reorder anything.)

**Why the existing spread test is THE test.** All three downstream orchestrators do `{ ...appContext }`. `appContext.spread.svelte.test.ts` asserts (via `Object.keys`, deliberately not `in`) that all 29 `EXPECTED_KEYS` survive that spread as own-enumerable properties, and that the bare reactive accessors (`appSettings`/`dataRoot`/`locale`) are still own-enumerable after `Object.defineProperty`. If the refactor drops or de-enumerates a member, that test fails.

**Known coverage hole this plan closes (Task 3).** That test's `stubs.data` mock (`appContext.spread.svelte.test.ts:47-50`) declares `dataRoot` as a PLAIN DATA property, unlike production's accessor. Today the hand-rolled `Object.defineProperty` guarantees live forwarding regardless of the source's descriptor shape; after the change, live forwarding DEPENDS on the source being an accessor — and no appContext-level test exercises that path. Task 3 makes the stub faithful to production and locks the behaviour.

**Project rules that bind this plan** (`CLAUDE.md`, `.planning/STATE.md`):
- Standing acceptance rule: *prove the guard fails before claiming it guards* — hence the Task 3 negative control.
- Context Destructuring Rule / the `dataRoot` `#version`-bridge alias-indirection hole: `dataRoot` is an identity-stable `#version`-bridge accessor. Its reactivity is exactly what a value-copy destroys, which is why the accessor path must stay live.
- E2E hard rule: noted, but a full `yarn test:e2e` run is a POST-TASK gate for the user (needs a running dev server on :5173 + clean DB the orchestrator has not started). It is deliberately NOT inside this plan.

**Security:** no trust boundary is crossed — no new dependency, no network/user input, no auth or data-access change. Pure in-process refactor of an already-in-tree helper adoption. No STRIDE register applies.

</context>

<tasks>

<task type="execute">
  <name>Task 1: PROVE the upstream own-enumerable surfaces before any blanket forward (gate for Task 2)</name>
  <files>apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts</files>
  <read_first>
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts (the class — enumerate every non-`#` field)
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts:143-166 (the existing `spread-safety (gate regression guard)` describe — the new case goes inside it, reusing `importTracking` / `appSettingsHandle` / `userPrefsHandle` and the `$effect.root` idiom)
    - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts (the class — enumerate every non-`#` field)
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts:314-360 (the producers block + the forwarding block being replaced)
  </read_first>
  <action>
    A blanket forward that widens appContext's public runtime surface beyond the `AppContext` type is a FAIL. Prove the surfaces first.

    1. TRACKING (runtime proof, made durable). Inside the existing `spread-safety (gate regression guard)` describe in `trackingService.svelte.test.ts`, add ONE new case that constructs the real service via the `trackingService({ appSettings, userPreferences })` factory inside `$effect.root` (copy the construction idiom from the case already there) and asserts the EXACT own-enumerable surface, order-insensitively: `expect(Object.keys(svc).sort()).toEqual([...expected].sort())` where `expected` is the eight members `sessionId`, `sendTrackingEvent`, `shouldTrack`, `startPageview`, `startEvent`, `submitAllEvents`, `track`, `resetAllEvents`. Use `toEqual` on the sorted arrays — an exact lock, NOT a `toContain` superset check (the existing appContext spread test is already a superset check, so it is blind to widening; this case is the thing that is not blind). Document in a short comment above the case WHY it is exact: appContext blanket-forwards this producer's whole own-enumerable surface, so any new public own-enumerable member here silently widens appContext's public surface — this case is the tripwire.
    2. DATACTX (static proof, runnable). Run the grep in `<verify>` over `data/dataContext.svelte.ts` and confirm the only non-`#` instance members are `dataRoot` and `setDataRoot`. Record the exact grep output in the SUMMARY. (`DataContextProvider` is not exported and `initDataContext()` needs a live Svelte context, so a runtime lock would require exporting a test seam — out of scope for this task, and the class is ~100 lines with an unambiguous surface. Note the residual gap in the SUMMARY as an optional follow-up.)
    3. ORDERING. Confirm by reading `appContext.svelte.ts` that `this.#tracking = trackingService({...})` is assigned in the constructor BEFORE the forwarding block, and state the two line numbers in the SUMMARY. Task 2 must not move the forwarding block above it.
    4. GATE DECISION, recorded explicitly in the SUMMARY:
       - Tracking proof PASSES (exactly 8) → Task 2 uses the blanket `inheritContextMembers(this, this.#tracking)`.
       - Tracking proof FAILS (any extra own-enumerable member) → Task 2 KEEPS the tracking forward explicit/hand-listed and the SUMMARY names the extra member(s) and why. The dataCtx half of the change stands on its own either way — do NOT abandon the whole refactor over a tracking-surface surprise.
       - Same gate independently for dataCtx: anything beyond `dataRoot` + `setDataRoot` → keep that half explicit and report.
  </action>
  <verify>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application &amp;&amp; yarn workspace @openvaa/frontend test:unit src/lib/contexts/app/tracking/trackingService.svelte.test.ts</automated>
    Expected: all cases pass, including the new exact-surface case (which is itself the tracking proof).

    dataCtx surface grep (expect ONLY `dataRoot` and `setDataRoot` in the output — every other class member line must be `#`-prefixed and therefore filtered out):
    `grep -nE "^  (readonly )?[A-Za-z_$][A-Za-z0-9_$]*[!:= ]" apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`
    plus `grep -n "defineProperty(this," apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` (expect exactly one hit, the `dataRoot` install).
  </verify>
  <done>The tracking surface is locked by a passing exact-`Object.keys` test case; the dataCtx surface is grep-proven to be exactly two members; the producers-before-forwarding line numbers are recorded; the gate decision (blanket vs. keep-explicit, per upstream) is written down before any edit to `appContext.svelte.ts`.</done>
</task>

<task type="execute">
  <name>Task 2: Replace the two ad-hoc forwarding mechanisms with inheritContextMembers, and re-document the block</name>
  <files>apps/frontend/src/lib/contexts/app/appContext.svelte.ts</files>
  <read_first>
    - apps/frontend/src/lib/contexts/utils/inheritContextMembers.ts (the descriptor-copy semantics being relied on)
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:375-389 (the in-repo comment + call-site idiom to mirror)
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts (whole file — the comments are load-bearing documentation, not decoration)
  </read_first>
  <action>
    Apply the Task 1 gate decision. Edit ONLY `appContext.svelte.ts`.

    1. IMPORT. Add `import { inheritContextMembers } from '../utils/inheritContextMembers';` next to the other sibling-directory imports (`../component`, `../data`, `../utils/persistedState.svelte`) — use the `../` form, NOT a `$lib` alias, matching this file's existing sibling imports. Respect the repo's import ordering/lint rules (`yarn lint:fix` if the sorter complains).
    2. DELETE the hand-rolled `Object.defineProperty` accessor install for the `dataRoot` member in the forwarding block (`:329-341`), together with its preceding comment paragraph. It is fully subsumed by the dataCtx inherit below.
    3. REPLACE the single `Object.assign(this, { … })` (`:343-360`) with three statements, in this order:
       a. `Object.assign(this, { t: this.#componentCtx.t, translate: this.#componentCtx.translate });` — componentCtx stays an EXPLICIT SELECTIVE forward. Keep/adapt the existing comment explaining why: appContext deliberately overrides `locale`/`locales`/`darkMode` with its own bare accessor / `{ current }` handles, and `componentCtx.darkMode` is a prototype getter (not own-enumerable) anyway, so a blanket inherit here would be wrong in both directions.
       b. `inheritContextMembers(this, this.#dataCtx);` — FULL forward. Removes the need for both the deleted accessor install AND the `setDataRoot` value-copy line.
       c. `inheritContextMembers(this, this.#tracking);` — FULL forward, replacing the eight hand-listed tracking key/value pairs. IF the Task 1 tracking gate FAILED, skip 3c and leave the tracking members hand-listed exactly as they are today (and say so in the SUMMARY).
    4. DO NOT reorder anything else. The forwarding block stays BELOW the producers block that assigns `this.#tracking` (Task 1 step 3). Do not touch the field declarations, the handle installs, the `$effect` re-merges, or any arrow-field method.
    5. COMMENTS — keep them accurate, they are the in-tree documentation of the spread-safety discipline:
       - Rewrite the `EXPLICIT FORWARDING` block header to describe the NEW mechanism: one selective `Object.assign` for componentCtx plus descriptor-preserving inherits for dataCtx and tracking. Keep it saying WHY descriptor-preserving matters here — the same reason it was correct one layer downstream in Phase 113 CR-01: a value-copy of a bare reactive accessor snapshots it at construction and freezes reactivity for every consumer. Keep the reference to the downstream `{ ...appContext }` spread-safety constraint and to Phase 113.
       - Update the `dataRoot` field-declaration comment (`:187-191`) so it describes the member as inherited from `dataContext` as a live forwarding accessor via the helper (still own-enumerable, therefore still spread-safe), instead of describing a hand-rolled install.
       - Update the `Forwarded tracking members` field-declaration comment (`:193`) and the `Forwarded STABLE componentCtx members` comment (`:183`) to match what each mechanism now is.
       - Update the mechanism enumeration in the class docblock (`:35-43`, the "Spread-of-context fix" paragraph) so its list of mechanisms includes the helper. Do not change that paragraph's meaning or its Phase-109 framing — only make the mechanism list true.
       - When these comments refer to the mechanisms that were REMOVED, describe them in prose. Do NOT quote the removed code constructs verbatim — a verbatim quote inside a comment would defeat the negative greps in `<verify>` below, which is the only cheap machine check that the old mechanisms are really gone.
    6. FORBIDDEN: modifying `inheritContextMembers.ts`, `dataContext.svelte.ts`, `trackingService.svelte.ts`, or any consumer. No behaviour change, no member added, no member removed.
  </action>
  <verify>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application &amp;&amp; yarn workspace @openvaa/frontend test:unit src/lib/contexts</automated>
    Expected: green, including `app/appContext.spread.svelte.test.ts` (all 3 cases — the 29-key own-enumerability guard, the bare-reactive-accessor guard, the `appType` handle guard), `utils/inheritContextMembers.test.ts`, `candidate/candidateContext.svelte.test.ts`, `app/tracking/trackingService.svelte.test.ts`, `app/survey.svelte.test.ts`, `admin/jobStates.svelte.test.ts`. (There is no `voterContext` / `adminContext` spec file — directory-scoped run is the full available coverage.)

    Structural gates on `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`:
    - `grep -c "^import { inheritContextMembers }" …/appContext.svelte.ts` → `1`
    - `grep -c "inheritContextMembers(this, this.#dataCtx);" …/appContext.svelte.ts` → `1`
    - `grep -c "inheritContextMembers(this, this.#tracking);" …/appContext.svelte.ts` → `1` (SKIP this gate only if the Task 1 tracking gate failed and 3c was skipped)
    - NEGATIVE (old dataRoot install gone, comments included): `grep -c "defineProperty(this, 'dataRoot'" …/appContext.svelte.ts` → `0`
    - NEGATIVE (tracking no longer hand-listed): `grep -c "this.#tracking.sendTrackingEvent" …/appContext.svelte.ts` → `0` (skip if 3c was skipped)
    - NEGATIVE (dataCtx writer no longer hand-copied): `grep -c "this.#dataCtx.setDataRoot" …/appContext.svelte.ts` → `0`
    - POSITIVE (componentCtx forward survives): `grep -c "this.#componentCtx.translate" …/appContext.svelte.ts` → `1`
    - The three `Object.defineProperty(this, …)` installs for `appSettings` / `locale` are UNTOUCHED: `grep -c "Object.defineProperty(this," …/appContext.svelte.ts` → `2`

    Typecheck + lint (scoped to the touched file — compare against the pre-change baseline; net-new diagnostics mentioning `appContext.svelte.ts` must be ZERO):
    - `yarn workspace @openvaa/frontend typecheck`
    - `yarn workspace @openvaa/frontend lint`
  </verify>
  <done>`appContext.svelte.ts` forwards componentCtx via one selective `Object.assign` and both dataCtx and tracking via `inheritContextMembers`; all context unit tests are green; the structural greps hold; typecheck and lint show no net-new diagnostics for the touched file; every comment in and around the forwarding block describes the mechanism that is actually there.</done>
</task>

<task type="execute">
  <name>Task 3: Lock the dataRoot LIVE-forwarding behaviour with a negative-controlled guard</name>
  <files>apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts</files>
  <read_first>
    - apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts (the `vi.hoisted` stub block :28-71, the `vi.mock('../data', …)` line, the `setup()` helper, and the existing 3 cases)
    - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts (the production `dataRoot` accessor shape the stub must now mirror)
  </read_first>
  <action>
    After Task 2, appContext's `dataRoot` is live ONLY because the source exposes an accessor. The existing mock declares it as a plain data property, so that path is untested. Close the hole.

    1. Make `stubs.data` faithful to production: back it with a mutable holder and expose `dataRoot` as an own-enumerable GETTER over that holder (`{ get dataRoot() { return holder.value; }, setDataRoot: (_v) => {} }`), mirroring `DataContextProvider`'s own-enumerable accessor. Keep `setDataRoot` an arrow-field-shaped data property. Comment the stub to say the accessor shape is load-bearing: it is what makes the helper install a live forwarder rather than a value copy.
    2. Reset the holder between cases (`afterEach`, next to the existing `cleanup?.()` / `vi.clearAllMocks()`) so no case leaks state into another.
    3. Add ONE new case asserting live forwarding on the INSTANCE (not on a spread copy — the spread necessarily snapshots, and the existing case already covers the spread side): construct via `setup()`, read `instance.dataRoot` and assert it is the initial holder value; then replace the holder value; then read `instance.dataRoot` again and assert it is the NEW value. That is the assertion a value-copy forward cannot satisfy.
    4. NEGATIVE CONTROL (the project's standing acceptance rule — prove the guard fails before claiming it guards). Temporarily edit `appContext.svelte.ts` to forward `dataRoot` by VALUE instead (a plain value copy off `this.#dataCtx`), run this spec, and record that the new case FAILS. Then REVERT that temporary edit exactly (`git diff` on `appContext.svelte.ts` must show only the Task 2 change afterwards) and re-run to record that it PASSES. Put both observed outcomes — the failing assertion message and the passing run — in the SUMMARY. Do NOT commit the negative-control state.
    5. Do not weaken, reorder, or delete any existing case, and do not change `EXPECTED_KEYS`.
  </action>
  <verify>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application &amp;&amp; yarn workspace @openvaa/frontend test:unit src/lib/contexts/app/appContext.spread.svelte.test.ts</automated>
    Expected: 4 cases pass (3 pre-existing + the new live-forwarding case).

    Negative control, recorded in the SUMMARY (two runs of the SAME command above): with the temporary value-copy forward → the new case FAILS (stale value observed); with the Task 2 change restored → PASSES.

    Whole-workspace regression sweep, once, at the end:
    - `yarn workspace @openvaa/frontend test:unit`
    - `git diff --stat` shows exactly three changed files: `appContext.svelte.ts`, `appContext.spread.svelte.test.ts`, `trackingService.svelte.test.ts`.
  </verify>
  <done>The spread test's data stub mirrors production's accessor shape; a live-forwarding case exists, passes with the change, and is OBSERVED to fail without it; the negative-control edit is fully reverted; the full frontend unit suite is green.</done>
</task>

</tasks>

<verification>
- `yarn workspace @openvaa/frontend test:unit` green (whole frontend suite), including `appContext.spread.svelte.test.ts` (4 cases), `inheritContextMembers.test.ts`, `trackingService.svelte.test.ts` (with the new exact-surface lock), `candidateContext.svelte.test.ts`.
- `yarn workspace @openvaa/frontend typecheck` and `yarn workspace @openvaa/frontend lint`: zero net-new diagnostics for the touched files.
- Structural greps of Task 2 all hold (both the positive adoption gates and the negative old-mechanism gates).
- Task 1 surface proof is recorded: tracking = exactly 8 own-enumerable members (runtime-locked), dataCtx = exactly `dataRoot` + `setDataRoot` (grep-proven).
- Negative control recorded: the new live-forwarding case fails under a value-copy forward and passes under `inheritContextMembers`.
- Exactly three files changed; `inheritContextMembers.ts`, `dataContext.svelte.ts` and `trackingService.svelte.ts` are byte-unchanged (`git diff --stat`).
- Atomic commit(s) referencing the quick task.

**POST-TASK GATE FOR THE USER (deliberately NOT in this plan).** `CLAUDE.md`'s E2E hard rule applies to this file — `appContext` is the root context of both apps. A full `yarn test:e2e` run needs one fresh dev server on :5173 plus a clean DB (`yarn db:reset`), which this task's orchestrator has not started. Run it before considering the change shipped:
```
yarn db:reset && yarn dev      # in one terminal, wait for healthy
yarn test:e2e                  # in another; must be 0 failed, 0 did-not-run
```
</verification>

<output>
Create `.planning/quick/260824-sdp-harmonise-appcontext-upstream-forwarding/260824-sdp-SUMMARY.md` containing:
- The Task 1 surface proof results verbatim (the tracking `Object.keys` set; the dataCtx grep output) and the resulting gate decision (blanket vs. kept-explicit, per upstream).
- The producers-block / forwarding-block line numbers proving the ordering constraint was preserved.
- The final shape of the forwarding block (the three statements) and which comments were rewritten.
- The negative-control evidence for the Task 3 guard (failing assertion under a value-copy forward, passing under the helper).
- Test/typecheck/lint results, the `git diff --stat` file list, and any residual gap noted (e.g. `dataContext` has no runtime surface lock because its provider class is not exported as a test seam; `dataContext.svelte.ts` / `trackingService.svelte.ts` header comments still cite the old appContext line numbers and spread phrasing — left untouched by instruction, flag as optional follow-up).
</output>
