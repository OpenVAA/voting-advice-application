# Phase 158 — Triage Dispositions

**Measured:** 2026-09-01, at HEAD `3c958cccc`. Every anchor below was opened in this task.
**Produced by:** `158-08`, Task 3.
**Discharges:** decision **D-G5** step 2 (the classification deliverable) and decision **D-N2**'s
requirement that no follow-up comment be silently dropped.

Phase 158's triage bucket (`.planning/PRE-SHIP-REVIEW-TRIAGE.md`, § "Phase 158") holds **27
comments** — the largest single bucket in the review. This document accounts for the ones that are
not already the subject of a `REVIEW-RT-*` criterion.

---

## Section 0 — The enumeration, settled on the record

`158-CONTEXT.md`'s D-G5 section contains a **six-item table** and a **★ rationale** that contradict
each other. The ★ line says *"Two of them (`QuestionChoices` UAT, **`admin/login`
supabase-independence**) are marked blocking"* — but `admin/login/+page.server.ts:27` **is not among
the six the table enumerates**; the table's sixth slot is the local-adapter comment. The CONTEXT's
own `<open>` #2 flags the contradiction and offers three readings, leaving the choice to this
deliverable.

**Read the bucket verbatim, and it settles.** Three findings, each measured against
`.planning/PRE-SHIP-REVIEW-TRIAGE.md` and the tree:

### Finding 1 — the local-adapter comment is NOT in this phase's bucket

The table's sixth slot is *"We should add reintroducing the local adapter as a follow-up task."*
That comment sits in **Phase 157's** triage bucket, above the `## Phase 158` heading, and
`157-CONTEXT.md` claims it explicitly (`:56` — *"reintroducing the local adapter (a filed follow-up,
per N2)"* — and `:264`). Under **D-N2**, follow-ups are filed *during the owning phase*. **It is 157's
to file, not 158's.** The CONTEXT table put an upstream comment in its sixth slot.

### Finding 2 — the admin-login comment IS in this phase's bucket, and IS marked blocking

`apps/frontend/src/routes/admin/login/+page.server.ts:27` appears in the `## Phase 158` bucket, and
its text opens:

> Add as a **blocking** follow-up task a way to make this supabase independent in routes.

The reviewer's own literal word. Not an executor's classification.

### Finding 3 — the local-adapter comment's cited anchor cannot exist as written

The triage anchors it at `apps/frontend/src/lib/api/dataProvider.ts:12`. Measured at HEAD, that file
is **78 lines** and its `:12` is `export { createSupabaseAnonClient } from '$lib/supabase/anon';` —
an adapter-seam re-export with nothing to do with a local adapter.

The comment's content matches **`apps/frontend/src/lib/server/api/dataProvider.ts:12`** — the
`default:` arm of a `switch (type)` whose `case 'local':` already imports
`./adapters/local/dataProvider`:

```ts
  default:
    module = Promise.resolve({});
```

⚠ **A second correction on top of the CONTEXT's.** `158-CONTEXT.md` `<open>` #3 says
`lib/api/dataProvider.ts` *"is one line (`export { dataProvider } from './adapters/supabase/dataProvider';`)"*.
That was true when the CONTEXT was written; Phase 157.2 rebuilt the file into the adapter-source
selector it is now. **The corrected anchor is still right; the CONTEXT's reason for it is stale.**
Recorded so the next reader does not "re-correct" a correction using a description that no longer
matches the file. **This is the upstream phase's to file, not this one's.**

### The resolution

> **The ★ prose was right about there being two blocking items across the review set. The enumerated
> table was wrong about which items the set contains.** Reading (ii) of `<open>` #2, with reading
> (iii) applying to *half* of the admin-login ask rather than all of it.

The corrected six that **Phase 158 owns and files**: the four non-blocking items from the table's
slots 1-4, the admin-login blocking item that the ★ prose names, and one item promoted from the
unbucketed pass (§ 2, item 1). Slot 5 goes to 157; slot 6 goes to 159.

---

## Section 1 — The follow-up classification table (D-G5 step 2)

**This table is a deliverable in its own right.** Without it, the operator's binding NOTES —
*"Implement the blocking ones within 158/9 or so"* — has no referent: there is no other artifact in
the phase that says which comments are blocking.

| # | Anchor (review-era) | Comment, verbatim | Owning phase | Classification | Disposition |
|--:|---|---|---|---|---|
| 1 | `routes/Banner.svelte:9` ✅ resolves exactly | "Add this is as a follow up task." (the file's own `### TODO`: allow layouts to insert arbitrary header content; make this a static component) | **158** | non-blocking | **FILED** — `2026-08-28-banner-static-component-arbitrary-header-content.md` |
| 2 | `routes/Header.svelte:44` ✅ resolves exactly | "Add as a follow up task, refactoring the header style settings." | **158** | non-blocking | **FILED** — `2026-08-28-header-style-settings-refactor.md`, cross-referenced to Phase 159's `REVIEW-CMP-01` reactive-state census, which will read the same component |
| 3 | `…/questions/+layout.svelte:144` ⚠ drifted → `:122-131` | "Add a follow up for a e2e test targeting this behaviour." (the `onMount` once-per-session `start` deep-link handler) | **158** | non-blocking | **FILED** — `2026-08-28-questions-layout-start-param-e2e-coverage.md` |
| 4 | `candidate/preregister/(authenticated)/elections/+page.svelte:1` ✅ file-level, resolves | "Add a follow-up task: harmonise election and constituency selection logic with the Voter App (mainly `startFromConstituencyGroup` option)." | **158** | non-blocking | **FILED** — `2026-08-28-preregister-election-constituency-selection-harmonisation.md`, cross-referenced to `tests/tests/specs/perm/perm-startfromcg.spec.ts` so the regression surface is visible to whoever picks it up |
| 5 | `admin/login/+page.server.ts:27` ⚠ drifted → `:22` | "Add as a **blocking** follow-up task a way to make this supabase independent in routes … Also, add a source test for ensuring that no adapter-specifics find their way into routes, components or anywhere not especially allowed…" | **158** | **BLOCKING** (the reviewer's own word) | **FILED** — `2026-08-28-admin-login-supabase-independence.md`. Source-test half **discharged upstream** by `REVIEW-ADP-06`; independence half **open**, implemented by `158-05` |
| 6 | `hooks.server.ts:17` ⚠ drifted — expression anchor only, per C1(a)/OB-4 | "Paramaterise this dependent on the adapter configuration and rename to dataAdapterHandle if possible." | **158** | non-blocking | **FILED** — `2026-08-28-hooks-supabase-handle-parameterisation.md`. Arises from § 2 item 1, not from the six-item list |
| — | `lib/components/questions/QuestionChoices.svelte:1` | "Add as a follow-up **blocking** task for me to UAT: - BooleanInput - multi-select choices" | **159** | **BLOCKING** | **CROSS-REFERENCE.** Not filed here. Phase 159 owns the file and owns the filing under D-N2. Recorded so it is not lost between the two phases |
| — | triage-cited `lib/api/dataProvider.ts:12`, **real anchor** `lib/server/api/dataProvider.ts:12` | "We should add reintroducing the local adapter as a follow-up task." | **157** | non-blocking | **CROSS-REFERENCE.** Not filed here. Sits in 157's bucket; `157-CONTEXT.md:56` claims it. The corrected anchor is recorded in § 0 Finding 3 so 157 does not have to re-derive it |

### What this phase actually implements: **ZERO of them**

Stated plainly, because the operator's instruction was *"implement the blocking ones"* and the honest
answer is not "none, we skipped it":

**Phase 158 owns exactly one blocking follow-up — row 5 — and it is discharged by cross-reference
plus scheduled work, not by new implementation in this plan.** Its two halves:

- The **source-test half** is word-for-word `REVIEW-ADP-06`, Phase 157's criterion 6, and is
  **already delivered**: `ADAPTER_BOUNDARY_ALLOWLIST` in `apps/frontend/eslint.config.mjs`, enforced
  by `yarn lint:check`, with a firing negative control at the path `157-16` struck. Re-implementing it
  in 158 would be a second guard for one class.
- The **independence half** is Phase 158's, and lands in **`158-05`** (the login collapse) — the plan
  that rewrites both login entry points onto one shared helper and owns the four `locals.supabase.*`
  calls in that file. `158-08` is a records plan that **declares a dependency** on `158-05`; it
  cannot both depend on that work and perform it.

The other blocking item across the review set (`QuestionChoices` UAT) is **Phase 159's**, by file
ownership. Neither phase's blocking item is unowned, and neither is unimplemented — both are
scheduled.

---

## Section 2 — The seven unbucketed comments

Seven comments in this phase's bucket that **no `REVIEW-RT-*` criterion names**
(`158-CONTEXT.md` `<open>` #8 enumerates them). D-N2's spirit is that none is silently dropped.
Each gets a verdict and a reason citing a file, a line or a requirement id.

| # | Anchor | Comment | Verdict | Reason |
|--:|---|---|---|---|
| 1 | `hooks.server.ts:17` ⚠ stale — expression anchor: `const supabaseHandle: Handle = async ({ event, resolve }) => {` | "Paramaterise this dependent on the adapter configuration and rename to dataAdapterHandle if possible." | **DEFER**, with the register entry filed in Task 2 | **There is nothing to parameterise against.** `lib/server/api/dataProvider.ts:8-14` switches on `staticSettings.dataAdapter.type`; the `case 'local'` arm imports a local provider, the `default:` arm resolves to `Promise.resolve({})`, and per `CLAUDE.md` Supabase is the only production adapter. One value is not a parameter. And the **rename half would make the name lie**: `dataAdapterHandle` naming a body that calls `createSupabaseServerClient(event)` and assigns `event.locals.supabase` asserts backend-neutrality the code does not have. Order is mandatory — parameterise, then rename. Downstream of item 8's local-adapter follow-up (157's). Entry: `2026-08-28-hooks-supabase-handle-parameterisation.md` |
| 2 | `…/questions/+layout.ts:1` | "Try to drop this." | **DECLINE**, no entry filed | The file's own docblock (`:3-7`) states it is a **deliberate parity stub**: *"Establishes the unified-layout-with-empty-leaf pattern that already ships in production at `results/[[electionTab]]/+layout.ts`. Question data flows through the client-side `voterCtx` … so this load is a parity stub returning `{}`."* Dropping it reverses a **shipped, spike-validated layout shape** (spikes 013-016: unified-layout-with-empty-leaf, chosen to make View Transitions survive Q→Q). **Filing an entry for reversing shipped design is not a follow-up, it is a re-litigation**, and the register is not the place to open one |
| 3 | `…/questions/[questionId]/+page.svelte:1` | "Check if this is necessary or if some content from the layout can be moved here with the transitions surviving." | **DECLINE**, no entry filed | **The file's own first line already answers the question**: `<!-- Empty leaf — rendering is owned by questions/+layout.svelte, mirroring the results route shape. -->`. The whole file is four lines. The shape it belongs to was tested and chosen (same spike series as item 2), and the comment's own clause — *"with the transitions surviving"* — names the constraint that produced this shape. ⚠ **Divergence from plan:** `158-08-PLAN.md` expected this line to cite a spike and therefore to be the comment-sweep phase's to resolve. **Measured: it no longer does.** At review era (`0a7939aff:1`) it read *"(results shape / see spike 014b)"*; Phase 152's comment-hygiene purge removed the planning-artifact reference, and `git grep -n "spike" -- "…/questions/"` now returns nothing. **That sub-item is discharged, not pending** |
| 4 | `(voters)/+layout.svelte:59` | "As well as this." | **DECLINE**, no entry filed | **The anchor's subject no longer exists.** At review era `:59` opened a 12-line comment block citing *"phase 86.3-01 wave A fix (cells #1 + #2)"* and *"phase 95"* — planning-artifact references in source, exactly the class **`REVIEW-HYG-01`** (Phase 152) exists to purge. That purge ran: `scripts/assert-comment-hygiene.mjs` is live in `package.json:45`'s `lint:check` chain. **At HEAD `:59` is a blank line.** Filing an entry against a line a completed sweep already deleted would create precisely the **dangling anchor the register exists to prevent** |
| 5 | `api/candidate/preregister/+server.ts:16` | "Check." | **CROSS-REFERENCE** to Phase 157, no new entry | A **bare one-word comment**. Its only concrete subject at the anchor is `locals.supabase.functions.invoke('identity-callback', { body: { id_token: idToken } })` at `:15-17` — a direct backend call in a route, which is **already inside `REVIEW-ADP-06`'s scope**. The file is entry #7 of `ADAPTER_BOUNDARY_ALLOWLIST` (`eslint.config.mjs:52`), annotated *"158-MEDIUM: `functions.invoke('identity-callback')` plus `auth.verifyOtp`."* **Do not invent a requirement from one word** — the allowlist annotation is a better record of the ask than a todo reconstructed from "Check." would be |
| 6 | `api/oidc/callback/+server.ts:35` ⚠ drifted — subject spans `:25`-`:101` | "Check whether we could use strict type for the error parameters." | **FOLD into `158-07`** | `158-07` already adds `apps/frontend/src/lib/candidate/utils/oidcError.ts` exporting `OIDC_ERROR` and the `OidcError` type (`158-07-PLAN.md:66`, `:117`), because *"the sweep is rewriting all six lines anyway"* (`:38`). Measured at HEAD: the file carries **6 `redirect(303, …)` calls** — `:29, :34, :44, :75, :94, :101` — of which **5 carry a `?error=` slug** (`:94` is the success path). The error slugs are string literals today: `missing_code`, `invalid_state`, `invalid_token`, `token_exchange_failed`, plus the pass-through `encodeURIComponent(errorParam)` at `:29`. **Nearly free given the rewrite; wasteful as a separate change** |
| 7 | `candidate/preregister/+layout.server.ts:9` | "Extract this to the adapter and use the typing provided with no ad hoc casts." | **CROSS-REFERENCE** to Phase 157, no new entry | This is **`REVIEW-ADP-01`** (*"typed JSONB columns validated on read … the typecasts are gone"*) applied to the `app_settings` column, and the file was leakage site #1 of 157's eight. **Measured: already discharged.** `157-16` moved the route off the boundary — `:11` now reads `createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) })` through the seam, `:14-21` reads `dataProvider.getAppSettings()` returning a typed `DPDataType['appSettings']`, **the ad-hoc cast is gone**, and the path was **struck from the allowlist** with a firing negative control (`eslint.config.mjs:40`). The CONTEXT's hedge *"arguably Phase 157's"* can be dropped: it was 157's, and 157 did it |

### The arithmetic

**7 comments = 1 folded + 1 deferred with an entry + 3 declined with reasons + 2 cross-referenced.**

1 + 1 + 3 + 2 = **7**. Every one dispositioned. None silently dropped.

---

## Section 3 — Standing cross-references: the upstream assumptions, now resolved

`158-RESEARCH.md` § "Upstream: Phase 157" was written when Phase 157 had **no `PLAN.md`**, and made
this phase's plans robust to three unresolved upstream questions. All three have since resolved.
Recorded here because a later reader will otherwise find plans hedged against branches that no longer
exist and wonder which branch was taken.

| # | The assumption, as research left it | Measured at HEAD `3c958cccc` | Consequence |
|--:|---|---|---|
| 1 | **157's `<open>` #3** — grandfather the 8 adapter-leakage sites, or drive the allowlist to 0? *"the planner must not write a task whose success depends on either"* | **GRANDFATHERED.** `apps/frontend/eslint.config.mjs` carries a two-group `ADAPTER_BOUNDARY_ALLOWLIST`; the second group holds **nine** entries, each annotated with its Phase-158 disposition (`158-HARD`, `158-MEDIUM`, `158-EASY`, `158-OWNED`). `157-16` struck one of an original ten. `admin/login/+page.server.ts` is `:50`, annotated `158-HARD` | § 1 row 5's blocking entry stays **open**, as its outcome-(a) branch specified. ⚠ **And the standing warning applies**: `158`'s `/api` move relocates two allowlist paths, and a stale `files`-scoped ESLint allowlist **fails open** — the glob matches nothing, the ban does not apply, `lint:check` stays green. Whichever plan performs the move must update the entries and re-run the negative control at the new paths |
| 2 | **Phase 152's planning-reference comment scan** — research measured it *"prospective, not live at HEAD `db220cb5f`"* | **LIVE.** `package.json:45` chains `yarn assert:comment-hygiene`; `scripts/assert-comment-hygiene.mjs` exists and names `REVIEW-HYG-01` in its header | **D-N1 is satisfied and enforced.** It also *retroactively discharged* two of § 2's declines (items 3 and 4) by deleting the comments they were anchored to — which is why both are DECLINE rather than DEFER |
| 3 | **`logDebugError`'s rename and move** (157's D-F5) — research's § D.6 wrote coupling rules for both outcomes | **DONE.** `157-17` migrated every call site to the shared structured logger and **deleted the frontend logger module with no re-export shim** (`6aaeaed46`). `apps/frontend/src/lib/utils/logger.ts` no longer exists; the logger lives at `packages/app-shared/src/logging/logger.ts`. Call sites now read `log.error(…)` — e.g. `admin/login/+page.server.ts:24` | § D.6's outcome-(c) branch ("157 slips; `logDebugError` keeps its name") is **dead**. Also removes the logger from `158-LIB-UTILS-MOVE-PROPOSAL.md`'s scope: it is resolved, not merely dispositioned |

**This phase's work lands in full regardless of any of the three.** Not one of `D-G1`, `D-G2`,
`D-G4` or this plan's five record artifacts has a success criterion that reads *"the allowlist has N
entries"* or *"file X no longer imports Supabase"* — those are 157's outcomes, and
`158-RESEARCH.md`'s robustness invariant forbids depending on them. The resolutions above **narrow**
the phase (three hedged branches collapse to one measured answer each); they do not gate it.

---

## Where the decisions came from

See `158-DISCUSSION-LOG.md` — the pointer back to `.planning/v2.15-DISCUSSION-POINTS.md` § G, which
is the source of record for D-G1 … D-G5 and D-N1 … D-N3.
