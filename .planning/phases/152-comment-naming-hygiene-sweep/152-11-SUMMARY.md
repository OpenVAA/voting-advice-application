---
phase: 152-comment-naming-hygiene-sweep
plan: 11
subsystem: frontend
tags:
  [sweep, exemplar, judgement-pass, svelte5-reactivity, destructure-trap, route-tree, component-library, behaviour-neutrality, two-route-completeness, markdown-fence]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's `assert-comment-only-diff.mjs` prover and `152-RESIDUE-REGISTER.md`'s seven-way prefix partition"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-03's camelCase rename of `settingsOverlay.svelte.ts`, and the `unmet-truth` it deferred to THIS plan by name"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-06's finding that the shipped gate invocation exits 2 under a caller-supplied pathspec, and its transcription workaround"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-07/08/09/10's memo items 10-20 — the gate is not a completeness test, the queue is a floor, the scanner has a floor, bound the prover range, measure per site"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's discharged E2E cardinal gate (150 passed / 0 failed / 0 did-not-run), which is why a comment-only plan does not re-run the suite"
provides:
  - "the phase's EXEMPLAR — `apps/frontend/src/routes/(voters)/+layout.svelte` — line-exact against D-A2, with its live Svelte-5 invariant compressed to one citation-free line"
  - "the closure of the `unmet-truth` 152-03 deferred to this plan: `SettingsOverlay.svelte` now returns ZERO lines repo-wide outside `.planning/` and `.claude/`"
  - "the frontend route tree, base component library, param matchers, codemod scripts, eslint config and font stylesheet swept — 70 files, all 66 register-queue files plus 4 the queue never listed"
  - "the disposition of `152-CONTEXT.md` `<open>` item 4 at the Input number branch: label KEPT, backend-RPC reference DELETED, check untouched"
  - "the first POSITIVE hit on memo item 13 (Markdown) after two clean negatives, and a second instance of the memo-12 coverage-id fence, both left byte-identical for the operator"
affects: [152-13, 152-14, 152-15, 157]

# Actuals (#2632)
actuals:
  tokens: 26335
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "two-route completeness accounting, reported PER REWRITE SITE (memo item 19): 153 sites — 107 reached by the nine gate rows, 34 only by the widened scanner, 12 only by reading. The same diff measured per LINE would have read 116/48/162 and called the blind spot 64% instead of 30%; the unit is stated so the phase's closing arithmetic can compare plans."
    - "PCRE alternation case-leak trap: a leading `(?i)` applies to EVERY later branch of the same pattern, so `\\b[A-Z]{2,}-\\d{2,3}\\b` folded into a `(?i)`-prefixed alternation matches `base-100` and `spacing-24`. The first scanner build reported 34 phantom hits in `app.css` for exactly this reason. Split case-insensitive prose branches and case-sensitive id-shaped branches into two greps."
    - "flip-testing a scoped gate WITHOUT `git checkout --`: restoring the injection target from HEAD silently discards that file's uncommitted sweep edits (it did, here). Inject into an already-committed file, or copy aside and restore from the copy."

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/(voters)/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts
    - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
    - apps/frontend/src/routes/+layout.svelte
    - apps/frontend/src/routes/candidate/+layout.svelte
    - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
    - apps/frontend/src/routes/loginRedirectTarget.ts
    - apps/frontend/src/lib/components/input/Input.svelte
    - apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
    - apps/frontend/src/lib/components/tabs/Tabs.svelte
    - apps/frontend/src/params/etPl.ts
    - apps/frontend/src/params/etSg.ts
    - apps/frontend/eslint.config.mjs
    - apps/frontend/scripts/flatten-current-codemod.mjs
    - apps/frontend/scripts/store-to-state-codemod.mjs
    - apps/frontend/static/fonts/inter.css
    - .planning/WINDOWS.md

key-decisions:
  - "The exemplar's `:46-47` invariant was KEPT and COMPRESSED to one line, not deleted, exactly as D-A2 rejected alternative (b) in terms. The roadmap's literal criterion 2 ('the prose at :36 and :59 goes') would have deleted a live CLAUDE.md invariant guarding the `$derived` alias on the very next line. Fact 10 and D-A2 win, and `REQUIREMENTS.md:89` already carries the correction."
  - "The `unmet-truth` 152-03 deferred to this plan is CLOSED, not re-registered. The 17-line block containing the stale `SettingsOverlay.svelte.ts` reference went entirely at commit ec2df91cd; `git grep -nI 'SettingsOverlay\\.svelte' -- ':!.planning' ':!.claude'` now returns zero lines. `.planning/WINDOWS.md` entry 70 moved from `open` to `fixed`. No word was edited inside the block, so no one-word mismatch against RESEARCH section 7's verbatim extents was ever introduced — which is exactly why 152-03 was right to defer it."
  - "Task 3's gate criterion is registered UNSATISFIABLE rather than reported met. Every one of the nine residual gate occurrences in this partition sits in ONE Markdown file that memo item 13 forbids this plan to touch. The property was proved by a named alternate route (the same nine rows with `:!*.md`) and FLIP-TESTED. No program byte was edited to make a grep go green; no allow entry was added; no `.md` byte changed."
  - "The Input number branch keeps its label and loses the backend reference, per RESEARCH 10.3 rather than per the reviewer's literal words. Deleting the whole block would have obeyed the review comment while removing a comment that satisfies this phase's own criterion and leaving one arm of a four-way chain unlabelled."
  - "Four in-prefix files the register's span-derived queue never listed were swept anyway (memo item 11, sixth confirmation): `MultipleTextInput.svelte`, `MultipleTextInput.type.ts`, `QuestionInput.svelte` and `loginRedirectTarget.ts`. Three carry `this phase` / `plan-02` forms no gate row matches; the fourth carries pure historical narrative with no id-shaped token at all."
  - "`T-62-04` / `T-69-01` (threat ids in the param matchers) and `NAVA11Y-01` / `CR-01` / `VT-01` / `VT-03` (requirement ids in the app shell) were rewritten out, not merely de-cited: each sentence was restated so it says what the code does. None is reachable by the gate's `\\b[A-Z]{3,}-\\d{2}\\b` row — `T-` has one letter, `CR-`/`VT-` have two, and `NAVA11Y` has digits inside the alpha run."

patterns-established:
  - "When a numeral names something real, reword; when it is a true citation, strip. `Pattern 1` (a plan-internal label) went; `Phase-120 expectArguments` became `E2E expectArguments` because the reader function is real and still exists; `88-02` narrative became present-tense statements of what the loader does and does not do."
  - "A cross-file line-range pointer becomes DANGLING the moment the target block is deleted. `candidate/+layout.svelte:50` pointed at `(voters)/+layout.svelte:100-119` — lines this plan removed in its own first commit. Deleting a block obliges you to grep for pointers INTO it."

# Copied verbatim from 152-11-PLAN.md. NOT marked Complete in REQUIREMENTS.md:
# `requirements.ready-ids` returns 0/1 — REVIEW-HYG-02 is ALSO declared by sibling
# plans in this phase that have no SUMMARY yet, so the shared-ID gate (#2388) holds
# it Pending until the last declaring plan finishes.
requirements-completed: [REVIEW-HYG-02]

coverage:
  - id: D1
    description: "The phase's exemplar landed line-exact against D-A2: the ten-line narrative deleted, the reactive-accessor invariant kept and compressed to one citation-free line, the seventeen-line block gone, the revert narrative reduced to one line justifying the mount-time call, the queue comment removed, and both the reactive-reads and consent-condition comments kept."
    requirement: REVIEW-HYG-02
    verification:
      - kind: command
        ref: "git diff 224f78e60..ec2df91cd -- '(voters)/+layout.svelte' — 45 comment lines removed, 2 written, net -43; comment lines in the swept range fell 53 → 10 (drop 43, criterion asks for ≥40)"
        status: pass
      - kind: command
        ref: "git grep -ciE 'destructur' → 1; 'dependenc' → 1; 'consent' → 7 — the compressed invariant, the reactive-reads comment and the consent comment all survive"
        status: pass
      - kind: command
        ref: "git diff 224f78e60..ec2df91cd -- '(voters)/+layout.svelte' | grep -cE '^[+-]\\s*(import|const|let|function|\\$derived|\\$state|\\$effect|onMount)' → 0"
        status: pass
      - kind: command
        ref: "exactly ONE comment line adjacent to the mount-time call (line 64, immediately above `onMount(`)"
        status: pass
      - kind: command
        ref: "assert-comment-only-diff.mjs --range ec2df91cd~1..ec2df91cd — 1 compared, 0 violations, 0 allow entries, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The route tree swept — every reactivity and navigation invariant preserved citation-free, all narrative about past edits deleted, no route/load/redirect/guard/prop/action/snippet touched."
    requirement: REVIEW-HYG-02
    verification:
      - kind: command
        ref: "101 rewrite sites across 49 files; 184 comment lines removed, 155 written"
        status: pass
      - kind: command
        ref: "scoped nine-row gate over apps/frontend/src/routes → 0 on every row; widened scanner over the same tree → 0 lines"
        status: pass
      - kind: command
        ref: "git diff 224f78e60..95deffbd5 -- apps/frontend/src/routes | grep -cE '^[+-]\\s*(import|const|let|function|export|\\$derived|\\$state|\\$effect)' → 0"
        status: pass
      - kind: command
        ref: "git grep -c -P '(?i)\\bsee\\s*$' -- apps/frontend/src/routes → 0 (one trailing-`see` line wrap was rewrapped rather than left)"
        status: pass
      - kind: command
        ref: "assert-comment-only-diff.mjs --range 801c81270~1..801c81270 — 49 compared, 0 violations, 0 allow entries"
        status: pass
    human_judgment: false
  - id: D3
    description: "The component library, param matchers, codemod scripts, eslint config and font stylesheet swept; the Input number branch's boundary-violating backend reference deleted while the branch stays labelled; both hooks entry points and every spec fixture left byte-identical."
    requirement: REVIEW-HYG-02
    verification:
      - kind: command
        ref: "48 rewrite sites across 20 files; 97 comment lines removed, 81 written"
        status: pass
      - kind: command
        ref: "git grep -c validate_answer_value -- apps/frontend/src apps/frontend/scripts apps/frontend/tests → 0; -- apps/supabase → 19 hits across 6 files (the check itself is untouched)"
        status: pass
      - kind: command
        ref: "git grep -ci 'coerce' -- Input.svelte → 1 (the branch is still labelled)"
        status: pass
      - kind: command
        ref: "git diff --stat 224f78e60..95deffbd5 -- apps/frontend/src/hooks.server.ts apps/frontend/src/hooks.ts → EMPTY; both eslint-disable directives byte-identical"
        status: pass
      - kind: command
        ref: "git diff 224f78e60..95deffbd5 -- apps/frontend/src/params/ restricted to non-comment lines → EMPTY (no fixture value changed)"
        status: pass
      - kind: command
        ref: "assert-comment-only-diff.mjs --range 95deffbd5~1..95deffbd5 — 20 compared, 0 violations, 0 allow entries"
        status: pass
    human_judgment: false
  - id: D4
    description: "The `unmet-truth` 152-03 deferred to this plan by name is discharged, and the discharge is proved rather than asserted."
    requirement: REVIEW-HYG-03
    verification:
      - kind: command
        ref: "git grep -nI 'SettingsOverlay\\.svelte' -- ':!.planning' ':!.claude' → exit 1, ZERO lines (was exactly one: (voters)/+layout.svelte:75)"
        status: pass
      - kind: command
        ref: ".planning/WINDOWS.md entry 70 status: open → fixed, resolved_at 2026-08-29T00:57:22Z"
        status: pass
    human_judgment: false
  - id: D5
    description: "Behaviour neutrality proved over the whole plan range with zero allow entries, and the partition cross-checked in both directions."
    requirement: REVIEW-HYG-02
    verification:
      - kind: command
        ref: "assert-comment-only-diff.mjs --range 224f78e60..95deffbd5 (BOUNDED at the last refactor commit) — 70 files changed, 70 compared, 0 allow entries, 0 violations, exit 0"
        status: pass
      - kind: command
        ref: "partition cross-check: 0 paths outside apps/frontend/**; 0 paths under src/lib/ other than components/; 0 under contexts/, dynamic-components/ or api/; all 66 register-queue files present; 4 in-prefix extras the queue never listed"
        status: pass
    human_judgment: false
  - id: D6
    description: "The residual gate rows are Markdown-only, and that is registered as an unsatisfiable criterion with a named, flip-tested alternate route — not restated as met."
    requirement: REVIEW-HYG-02
    human_judgment: true
    rationale: "The operator must rule on whether the phase sweeps Markdown prose at all, under which plan, and against which prover. This plan proves the property on the surface it owns and leaves the ruling untaken, per memo items 12 and 13."
---

# Phase 152 Plan 11: The Exemplar, the Route Tree and the Component Library Summary

The file the roadmap nominates as the phase's exemplar now reads the way the phase says code should read — 43 comment lines of history gone, one compressed line of live Svelte-5 invariant kept — and with it the whole frontend route tree, base component library, param matchers, codemod scripts, eslint config and font stylesheet: 70 files, 153 rewrite sites, 326 comment lines removed and 238 written, with zero non-comment bytes changed and zero allow entries.

**Duration:** 23 min &nbsp;|&nbsp; **Tasks:** 3/3 &nbsp;|&nbsp; **Files:** 70 source + 1 planning &nbsp;|&nbsp; **Completed:** 2026-08-29

---

## 1. The exemplar — full before and after

Task 1's output spec asks for the whole before-and-after of the swept range, because this diff is the artefact a reviewer reads first. `apps/frontend/src/routes/(voters)/+layout.svelte`, commit `ec2df91cd`:

```diff
@@ -33,18 +33,7 @@
   // Init Voter Context
   ////////////////////////////////////////////////////////////////////

-  // WR-04 (see phase 86.3 review): popupQueue is a stable instance reference per
-  // CLAUDE.md "Context Destructuring Rule" — popupStore() returns an object
-  // literal `{ push, shift, subscribe }` (popupStore.svelte.ts:23) attached as
-  // a plain context property (appContext.svelte.ts:226), NOT a $state/$derived
-  // getter. The `push`/`shift`/`subscribe` methods are bound function
-  // references; destructuring captures the instance once at component init
-  // and subsequent `popupQueue.push(...)` calls correctly mutate the live
-  // queue. DO NOT swap popupQueue for a $derived/$state-based collection (or
-  // a getter on the context object) without migrating consumers to
-  // `ctx.popupQueue.push(...)` per the destructuring rule.
-  // appSettings is a reactive accessor (see phase 113 flatten) — read via
-  // `ctx.appSettings`, never destructure (the alias below tracks it).
+  // appSettings is a reactive accessor — read via `ctx.appSettings`; destructuring it captures one value at init and stops updating.
   const ctx = initVoterContext();
   const { appType, popupQueue, userPreferences, t } = ctx;
   const appSettings = $derived(ctx.appSettings);
@@ -56,23 +45,6 @@

   const { navigation, useTopBar } = getLayoutContext();

-  // see phase 86.3-01 wave A fix (cells #1 + #2): the top-bar overlay must
-  // be reactive on appSettings so runtime overrides via
-  // mergeAppSettings(page.data.appSettingsData) (appContext.svelte.ts:93-100)
-  // propagate to the header Banner. Mirrors the canonical $effect pattern at
-  // appContext.svelte.ts:93-100.
-  //
-  // Migrated (see phase 95) off the StackedState revert/push-baseline
-  // pattern to the token-keyed settingsOverlay registry. `useTopBar(...)` is
-  // `$effect(() => topBar.push(overlay))` — a NESTED effect. When this OUTER
-  // $effect re-runs on an appSettings change, Svelte tears down the nested
-  // `use()` effect first (its cleanup reverts the prior overlay) and then
-  // re-creates it (pushing the fresh overlay). This is structurally robust to
-  // out-of-order child mount/unmount: each overlay is token-keyed, so a child
-  // consumer's overlay is never silently erased by this parent re-run (the
-  // WR-02 interleave hazard the index-based stack carried is gone). No
-  // `untrack` is required here — the push/revert write-after-read is already
-  // untrack-guarded inside settingsOverlay (SettingsOverlay.svelte.ts).
   $effect(() => {
     // Reactive reads — these register the OUTER $effect's dependencies.
     const feedback = appSettings.header.showFeedback;
@@ -89,24 +61,9 @@
   // Popup management
   ////////////////////////////////////////////////////////////////////

-  // see phase 86.3-01 cell #3 (notifications.voterApp) REVERTED 2026-05-20 to the
-  // pre-86.3 onMount-only queueing semantic. The reactive `$effect` rewrite
-  // surfaced an unintended interaction with test-infrastructure conventions:
-  // multiple e2e specs leave `notifications.voterApp.show: true` in their
-  // afterAll (e.g. voter-popup-hydration.spec.ts:70 defaultPopupSettings),
-  // which the prior onMount-only queue-then-dismiss flow tolerated but a
-  // reactive $effect re-queues on every page mount — blocking the
-  // answeredVoterPage fixture from advancing past the intro page in any
-  // downstream voter spec. Cells #1 + #2 (header.showFeedback / showHelp via
-  // reactive topBar $effect above) remain reactive — those changed in app
-  // settings UI and the topBar reactivity is the user-visible value.
-  //
-  // Cell #3 disposition is now REVERT-TO-ONMOUNT (downgraded from FIX-PASS),
-  // matching the baseline (see phase 77). The DataConsentPopup branch (below) stays
-  // in the same onMount, per the same small-fix constraint.
+  // Queued once on mount rather than reactively: a reactive queue re-pushes on every settings change, re-showing a dismissed popup.
   onMount(() => {
     if (!appSettings.access.voterApp) return;
-    // Queue the voter-app notification popup (cell #3 — onMount one-shot).
     if (appSettings.notifications.voterApp?.show) {
```

Line for line against D-A2, at HEAD `22c2542e3` extents:

| Extent | Disposition | Done |
|---|---|---|
| `:36-45` | DELETE the ten-line narrative | ✅ gone |
| `:46-47` | KEEP, compressed to ONE line, no citation | ✅ one line at `:36`, states rule **and** consequence |
| `:48-51` | the code the invariant guards — unchanged | ✅ byte-identical |
| `:59-75` | GONE | ✅ gone (and with it the last stale filename) |
| `:77` | **not in the disposition — keep** | ✅ survives at `:49` |
| `:92-106` | reduce to ONE line justifying `onMount` | ✅ one line at `:64` |
| `:109` | REMOVE | ✅ gone |
| `:116` | KEEP | ✅ survives at `:73` |

The compressed keeper reads:

```
// appSettings is a reactive accessor — read via `ctx.appSettings`; destructuring it captures one value at init and stops updating.
```

It states the rule (read via property access, never destructure) and the consequence (a destructured copy freezes at init) in one sentence, with no phase number and no `see` pointer. RESEARCH's suggested wording stopped at the rule; the plan asked for both halves, so the consequence clause was added rather than the suggestion copied.

**Counts.** 45 comment lines removed, 2 written, net **−43**. Comment lines in the swept range fell **53 → 10**; the criterion asked for a drop of at least 40. Declaration-line diff check returns **0**.

---

## 2. The debt 152-03 left this plan — DISCHARGED

152-03 deliberately left one of its own `must_have` truths unmet and named 152-11 as the reason. Its truth was *"a repo-wide grep for each old file stem returns zero lines outside `.planning/` and `.claude/`"*; the one surviving line was `apps/frontend/src/routes/(voters)/+layout.svelte:75`, naming `SettingsOverlay.svelte.ts` inside the seventeen-line block above.

**That block went entirely, at commit `ec2df91cd`.** Proof, not assertion:

```
$ git grep -nI "SettingsOverlay\.svelte" -- ':!.planning' ':!.claude'
$ echo $?
1                       # exit 1 = zero matches
```

`.planning/WINDOWS.md` entry **70** moved `open → fixed` (`resolved_at 2026-08-29T00:57:22Z`). 152-03's truth is met as of this commit.

It is worth recording *why* 152-03 was right to defer it rather than fix the one word. The block was deleted **wholesale**, so no word inside it was ever edited — which means the verbatim extents RESEARCH section 7 quotes at HEAD `22c2542e3` matched this file byte for byte when this executor read them. Had 152-03 patched the filename, the read_first table would have carried one unexplained mismatch for zero durable gain.

---

## 3. Two-route completeness — measured PER REWRITE SITE

Reported per **rewrite site** (memo item 19), where a site is one contiguous edited comment span. A multi-line rewrite has one anchor and many collateral lines, so a per-line count inflates unevenly.

| Route | Sites | % |
|---|---:|---:|
| Matched by the **nine gate rows** | **107** | 70% |
| Matched only by the **widened scanner** | **34** | 22% |
| Found only by **reading** | **12** | 8% |
| **Total** | **153** | |

**Gate blind spot: 30%** — 46 of 153 sites. The series across the phase is now ~27% (152-07), 64% (152-08), 54% (152-09), 37% (152-10), **30% (152-11)**. Still never zero.

The same diff measured **per line** would have read **116 / 48 / 162** and put the blind spot at **64%**. Both numbers are given so the phase's closing arithmetic can pick a unit and stay consistent; the site figure is the one this plan stands behind.

### The twelve reading-only sites

No id-shaped pattern reaches any of these.

| File | What was there |
|---|---|
| `components/input/Input.svelte` | the two lines naming the backend `validate_answer_value` RPC (see §5) |
| `params/etPl.ts`, `params/etSg.ts` (×2) | `readable in directory listings)` — the tail of a sentence whose citation sat on an earlier line |
| `params/etSg.ts` | **`introduced by Phase` / `88` split across a line break** — the exact near-miss class memo item 19 flagged at `EntityListControls.svelte:58`. No phase-shaped pattern reaches a reference split over two lines. |
| `results/[[electionTab]]/+layout.svelte` | `Re-named local aliases preserved for template readability:` |
| `results/[[electionTab]]/+layout.svelte` | `Unchanged from prior phases.` |
| `results/[[electionTab]]/+layout.svelte` | `route params (renamed from the prior plural/singular matcher-gated segments)` |
| `candidate/(protected)/+layout.svelte` | `parity with pre-refactor logDebugError calls (was inlined in the old update())` |
| `candidate/+layout.svelte` | `mirrors the voters layout's REVERT-TO-ONMOUNT decision (…:100-119)` — a **dangling** pointer into the block this plan deleted (see §7) |
| `loginRedirectTarget.ts` (×3) | `both used to interpolate it … without validating it`, `The pre-existing interpolation`, `this is that guard applied to the auth path that lacked it` |

### The four reference classes the widened scanner had to carry

Beyond memo items 10 / 10-REVISED's list, this partition needed:

1. **Two-letter requirement ids** — `CR-01`, `VT-01`, `VT-03`. The gate row is `\b[A-Z]{3,}-\d{2}\b`; two letters never match.
2. **Digit-infixed alpha runs** — `NAVA11Y-01`. `[A-Z]{3,}` cannot span the `11`, and there is no word boundary before the trailing `Y`, so the gate misses it in both directions.
3. **Single-letter threat ids** — `T-62-04`, `T-69-01` in the param matchers. One letter defeats every `[A-Z]{2,}`-anchored row including the gate's own `decision-id` pair.
4. **Plan-internal structure labels in markup** — `Pattern 1`, `Pitfall 3`, `Pitfall 6`, `Assumption A2`, `Open Question O-2`, `RESEARCH Open Question 1 RESOLVED`, `research Pitfalls 1, 2, 4`.

### A scanner-construction trap worth carrying forward

The first build of the widened scanner reported **34 hits in `apps/frontend/src/app.css`** — `base-100`, `spacing-24`, `bg-base-300`. Cause: in PCRE a leading `(?i)` applies to **every later branch of the same alternation**, so the case-**sensitive** `\b[A-Z]{2,}-\d{2,3}\b` branch folded into a `(?i)`-prefixed pattern matched lowercase Tailwind tokens. Splitting the case-insensitive prose branches from the case-sensitive id branches into two greps dropped the partition from 302 phantom lines to 151 real ones, and `app.css` to zero. A scanner that over-matches is safe but expensive; one that silently case-folds an id class is neither.

---

## 4. Whole-prefix ownership — sixth confirmation

The register's `152-11` partition is a **prefix rule**, evaluated in order: `apps/frontend/src/lib/components/` → 152-11, `apps/frontend/src/lib/` → 152-10, `apps/frontend/` → 152-11.

| Check | Result |
|---|---|
| Register-queue files (table rows) | **66** |
| Queue files present in this plan's diff | **66 / 66** — none skipped |
| In-prefix files the queue never listed, swept anyway | **4** |
| Files in the diff outside the prefix partition | **0** |
| Files under `src/lib/contexts/`, `dynamic-components/` or `api/` | **0** |
| **Total files in the plan diff** | **70** |

The four extras:

| File | Why the queue never saw it |
|---|---|
| `components/input/MultipleTextInput.svelte` | `out of this phase's input scope` — `this phase` matches no gate row |
| `components/input/MultipleTextInput.type.ts` | same phrasing in the props docblock |
| `components/input/QuestionInput.svelte` | `from the plan-02 customData keys` — the gate's `plan-number` row wants `plans?\s+\d+[-.]\d+`, and `plan-02` uses a hyphen |
| `routes/loginRedirectTarget.ts` | three sentences of historical narrative with **no id-shaped token at all** — reachable only by reading |

**A note on the plan frontmatter vs the register.** The frontmatter's `files_modified` lists `src/lib/candidate/**`, `src/lib/voter/**`, `src/lib/utils/**`, `src/lib/i18n/**` and `src/lib/_guards/**`. Under the register's prefix rule those belong to **152-10**, which swept them. Re-measured here: the nine gate rows over those five directories return `phase-ref 0, spike-ref 0, section-anchor 0, planning-path 0, plan-number 0`; the only residue is four `describe(...)` **test titles** (`ASSERT-08`, `D-05`, `D-06`, `CLEAN-04`) which this plan's own prohibitions assign to `152-13`. Nothing was owed and nothing was taken.

---

## 5. `152-CONTEXT.md` `<open>` item 4 — the Input number branch

Review comment (PR #869): *"Remove comment, the frontend components should not reference data provider implementations."*

Before, at `Input.svelte:316-318`:

```js
      // Number — coerce the DOM string value to a real JS number (or undefined when cleared).
      // The backend `validate_answer_value` RPC requires a JSON number, so emitting the raw
      // string would fail validation ("Answer for number question must be a number").
    } else if (type === 'number' && currentTarget instanceof HTMLInputElement) {
```

After — the label kept, the two lines below deleted:

```js
      // Number — coerce the DOM string value to a real JS number (or undefined when cleared).
    } else if (type === 'number' && currentTarget instanceof HTMLInputElement) {
```

The comment's odd placement (it sits *inside* the previous branch's block while labelling the branch that follows) was **not** changed. The neighbouring arms of the same four-way chain carry the same kind of label; deleting the whole block would have left one arm unlabelled while obeying the reviewer's literal words.

> ### ⚠ THIS DELETION REMOVES A COMMENT, NOT A CHECK.
> `validate_answer_value` is a **server-side PostgreSQL validation function**. It still exists and still runs on every write, regardless of what any frontend comment says. Proof, both directions:
>
> ```
> $ git grep -c validate_answer_value -- apps/frontend/src apps/frontend/scripts apps/frontend/tests
> (no output — zero)
> $ git grep -c validate_answer_value -- apps/supabase
> apps/supabase/supabase/migrations/00001_initial_schema.sql:6
> apps/supabase/supabase/schema/011-validation-functions.sql:3
> apps/supabase/supabase/schema/105-answers.sql:3
> apps/supabase/supabase/tests/database/08-triggers.test.sql:5
> apps/supabase/benchmarks/scripts/install-smart-jsonb-trigger.sql:1
> apps/supabase/benchmarks/scripts/restore-original-jsonb-trigger.sql:1
> ```
>
> The function is defined once, wired into the answers table, and covered by five pgTAP assertions. What was deleted is the *frontend's description of it* — the sole place the component layer named a database function, which is exactly the architectural-boundary complaint the reviewer raised.

**One measurement correction.** The literal criterion `git grep -c validate_answer_value -- apps/frontend` returns **1**, not 0, and the cause is *not* a surviving comment: the single hit is `apps/frontend/tsconfig.tsbuildinfo`, a **tracked** TypeScript incremental-build cache whose serialized payload still contains the pre-sweep source text (`git ls-files` finds it; `git check-ignore` does not). Restricted to the source trees the criterion is about, the count is 0. Deleting or regenerating a tracked build artifact is a non-comment change the zero-allow-entry prover forbids and is outside this plan's scope boundary. Registered as `.planning/WINDOWS.md` entry **111**.

---

## 6. Long-span dispositions (spans of seven removed lines and up)

| Lines | File | Disposition and reason |
|---:|---|---|
| 17 → 0 | `(voters)/+layout.svelte` | **Deleted.** The top-bar overlay narrative: a nested-effect teardown story across two phases, naming a module renamed elsewhere in this phase. The `$effect` below it is four lines of self-evident reactive reads. |
| 15 → 1 | `(voters)/+layout.svelte` | **Reduced to one line.** The revert narrative said *what* was reverted and *when*; the replacement says why the work happens on mount. |
| 12 → 1 | `(voters)/+layout.svelte` | **Ten deleted, two compressed to one.** The queue-destructuring block restates CLAUDE.md; the accessor invariant is live and stays. |
| 10 → 8 | `results/[[electionTab]]/+layout.ts` | **Rewritten present-tense.** `What changed vs. 88-02 (loop fix)` became a statement of what the loader does and does not do; the force-fill/bounce mechanism is the load-bearing part and survives intact. |
| 8 → 5 | `eslint.config.mjs` | **Rewritten.** Two widenings narrated by commit hash and date became one statement of the current glob and *why narrowing it reopens the hole* — the measured `.js`-under-`components` bypass is stated as a live property, not as history. |
| 7 → 5 | `constituencySelector/ConstituencySelector.svelte` | **Rewritten.** The WCAG-contrast argument (1.52:1 light / 1.46:1 dark, opacity is a steady state so no scan-timing settle clears it) is the reason the block is gated on selection — kept verbatim in substance; `see phase 134 Option A` and `previously rendered` went. |
| 7 → 4 | `electionSelector/ElectionSelector.svelte` | **Rewritten.** *Why this must be an `$effect`* survives as a present-tense mechanism; the cascade-failure incident report went. |
| 7 → 6 | `candidate/+layout.svelte` | **Rewritten.** The debounce-starvation mechanism is real and stays; the dangling cross-file pointer and the incident framing went (see §7). |

---

## 7. Deviations from plan

### `[Rule 1 — Bug] A cross-file pointer went dangling the moment this plan deleted its target`

- **Found during:** Task 2, on the narrative-marker read pass.
- **Issue:** `candidate/+layout.svelte:50` read *"mirrors the voters layout's REVERT-TO-ONMOUNT decision (`apps/frontend/src/routes/(voters)/+layout.svelte:100-119`)"*. Those are precisely the lines Task 1 deleted an hour earlier. Left alone it would have pointed at `const menuId = 'voter-app-menu';`.
- **Fix:** rewritten to `matching the voter layout` with no line range, keeping the debounce-starvation mechanism that is the comment's actual value.
- **Generalisation:** deleting a comment block obliges a grep for pointers *into* it. Recorded under `patterns-established`.

### `[Rule 3 — Blocker] The shipped gate cannot be retargeted; transcribed instead`

Memo item 2, confirmed for the sixth time. `hygiene-grep-report.sh` rejects any `-*` token and hardcodes `-- apps/ packages/ tests/` at every call site (`SCOPE IS LOAD-BEARING`), exiting 2. The nine rows were transcribed verbatim into a scratch runner taking a caller-supplied pathspec. **The script was not modified.**

One trap inside the workaround, worth stating: `git grep -- 'apps/frontend/' ':!apps/frontend/src/lib/' 'apps/frontend/src/lib/components/'` **excludes** the components directory, because a `:!` exclusion beats a later positive pathspec regardless of order. The first gate baseline was silently measured over the wrong set. The partition is measured as **two invocations** and summed.

### `[Rule 1 — Bug] `git checkout --` as a flip-test undo destroyed an uncommitted edit`

- **Found during:** Task 3's flip test.
- **Issue:** the flip test appended `// see phase 999` to `Tabs.svelte`, confirmed the gate went red, then reverted with `git checkout -- <file>` — which restores from **HEAD**, discarding that file's completed but uncommitted sweep edit.
- **Detected by:** the post-revert gate run still reporting `phase-ref 1`, the one reading that should have been impossible.
- **Fix:** the `Tabs.svelte` rewrite was re-applied and re-verified before commit; the shipped file carries it.
- **Registered:** `.planning/WINDOWS.md` entry **113**, with the safe procedure for later plans.

### `[Reported, not engineered around] Task 3's gate criterion is unsatisfiable`

See §8. Registered rather than restated as met.

**Total deviations:** 3 auto-fixed (2 × Rule 1, 1 × Rule 3), 1 reported-and-registered. **Impact:** none on behaviour — the prover reports zero non-comment bytes over the whole plan range.

---

## 8. The unsatisfiable criterion, its alternate route, and the flip test

**The criterion:** *"The retargeted gate scoped to this plan's file set reports 0 on every gate row."*

**Measured over the prefix partition it cannot be met**, and the residual is 100% Markdown:

| Row | occ | files | Where |
|---|---:|---:|---|
| `phase-ref` | 2 | 1 | `static/fonts/README.md` |
| `decision-id-bare` | 1 | 1 | `static/fonts/README.md` (`D-09`) |
| `section-anchor` | 5 | 1 | `static/fonts/README.md` |
| `task-id` | 2 | 1 | `static/fonts/README.md` (`VGATE-05`, `VGATE-04`) |
| all other gated rows | 0 | 0 | — |

Every one of those nine occurrences is in **one file** that memo item 13's standing operator fence forbids this plan to touch, and which the shared classifier reads as 100% *code* because it maps `md` to an empty comment family.

**Named alternate route** (the 152-04 / 152-06 house rule): the same nine rows, over the same partition, with `':!*.md'` appended.

```
  pattern           kind       occ  files          pattern           kind       occ  files
  phase-ref         gate         0      0          phase-ref         gate         0      0
  spike-ref         gate         0      0          spike-ref         gate         0      0
  decision-id-long  gate         0      0          decision-id-long  gate         0      0
  decision-id-bare  gate         0      0          decision-id-bare  gate         0      0
  section-anchor    gate         0      0          section-anchor    gate         0      0
  planning-path     gate         0      0          planning-path     gate         0      0
  plan-number       gate         0      0          plan-number       gate         0      0
  milestone-ver     report       0      0          milestone-ver     report       0      0
  task-id           gate         0      0          task-id           gate         0      0
       apps/frontend/ minus src/lib/                    src/lib/components/
```

**Flip-tested**, because a gate that examines nothing also reports green. Appending `// see phase 999` to `components/tabs/Tabs.svelte` flipped `phase-ref` from **0 → 1** in the same invocation. The scoped gate demonstrably reads this partition's source.

No program byte was edited to make a grep go green. No allow entry was added. Registered as `.planning/WINDOWS.md` entry **109**.

---

## 9. The two fenced operator questions

Both were met in this partition. Neither was decided.

### Memo item 13 (Markdown) — **first POSITIVE hit**, after clean negatives from 152-09 and 152-10

The `152-11` prefix contains five tracked `.md` files: `apps/frontend/README.md`, `messages/README.md`, `src/routes/README.md`, `src/routes/candidate/README.md`, `static/fonts/README.md`. **Four are clean** on all nine gate rows and on the widened sweep. The fifth is not: `static/fonts/README.md` carries `phase 146` twice, `plan 146-05`, `D-09`, five `§` glyphs and two coverage ids.

**Left byte-identical.** `git diff --stat 224f78e60..95deffbd5 -- '*.md'` is empty.

The operator's question is unchanged in shape but now has a second instance: *does the phase sweep Markdown prose at all, under which plan, and against which prover, given the current prover cannot see Markdown comments?* Registered as entry **110**.

### Memo item 12 (E2E coverage ids) — fires in the **same file**, and more sharply than before

`VGATE-05` and `VGATE-04` in `static/fonts/README.md` are cited by the blocking `e2e-visual` CI job's own provenance record. Stripping them breaks a **CI** cross-reference, not merely a run-register one. **Left in place**; the `task-id` row is reported **deferred-to-operator**, not met and not an ordinary unsatisfiable-by-construction row.

Elsewhere in the partition the class does not occur: `git grep -P '\b(EFLOW|EPERM|TMPL|EQTYP|UNBLK|VGATE|GEN|NF|ASSERT|RUNES|CLEAN)-\d{2}\b'` over both halves returns only that one file.

---

## 10. The 152-05 repair-damage scan — clean negative

Memo item 14 asks each plan to read for sentences the 152-05 codemod broke mid-strip before its fix landed (152-08 repaired 15, 152-09 one, 152-10 twenty-one). A comment-scoped scan over all 70 partition files for the known shapes — `per).`, `per:` at line end, `* / NF-02:`, `* - — `, `see .`, a bare `(` at line end, ` ) .`, `, )` at line end — returns **zero**.

**Nothing to repair here.** Recorded as a negative because a plan that simply omits the scan and a plan that runs it and finds nothing look identical in a SUMMARY otherwise.

---

## 11. Prohibitions honoured

| Prohibition | Evidence |
|---|---|
| No `describe`/`it`/`test` title renamed (152-13 owns them) | 0 test-title edits; the four `describe(...)` ids found in the neighbouring lib prefix were left and attributed to 152-13 |
| No line-break join (152-14 owns them) | no join performed; rewraps are inside spans that were rewritten wholesale |
| Both hooks entry points byte-identical | `git diff --stat 224f78e60..95deffbd5 -- src/hooks.server.ts src/hooks.ts` → **empty**; both `/* eslint-disable func-style -- … */` directives and their ` -- ` separators untouched |
| The reactive-accessor invariant kept, not deleted | present at `(voters)/+layout.svelte:36` |
| The reactive-reads comment not deleted by momentum | present at `(voters)/+layout.svelte:49` |
| No UK-spelling edits in param-matcher specs or the Input usage docstring | `git diff` over `src/params/` restricted to non-comment lines → **empty**; no fixture value changed |
| No route / load / prop / action / guard / redirect changed | declaration-line diff check → **0** over routes; prover → 0 non-comment bytes over all 70 files |
| No dash normalisation | none performed; no dash rule exists in this plan |
| No file outside the partition | 0 out-of-partition paths (§4) |
| No `.planning/ROADMAP.md` / `REQUIREMENTS.md` / `STATE.md` edits in a task commit | all three task commits touch `apps/frontend/**` only |

---

## 12. Verification

| Gate | Result |
|---|---|
| Scoped nine-row gate, partition minus Markdown, both halves | **0 on every gated row**, flip-tested red |
| Scoped nine-row gate, partition including Markdown | 9 occurrences in 1 `.md` file — registered unsatisfiable (§8) |
| Widened scanner over the partition | **0 lines** outside `static/fonts/README.md` |
| `assert-comment-only-diff.mjs --range 224f78e60..95deffbd5` (**bounded at the last refactor commit**) | 70 changed, **70 compared, 0 allow entries, 0 violations**, exit 0 |
| `assert-comment-only-diff.mjs --range 224f78e60..HEAD` (unbounded, measured **after** the docs commit) | 74 changed, 74 compared, 0 allow entries, **4 violations**, exit 1 — one per `.planning/**.md` file in the range (`152-11-SUMMARY.md`, `STATE.md`, `ROADMAP.md`, `WINDOWS.md`) |
| `yarn build` | exit 0, 14/14 tasks |
| `yarn workspace @openvaa/frontend test:unit` | exit 0, **54 files / 816 tests passed** — unchanged from the pre-sweep baseline |
| `yarn lint:check` | exit 0, `svelte-check found 0 errors and 0 warnings` |
| `node scripts/assert-comment-hygiene.mjs` | exit 0, 1560 files scanned, **0 violations** |
| Full E2E suite | **not run** — discharged by 152-05 (150 passed, exit 0, zero failed/flaky/did-not-run). This plan's diff is provably comment-only with zero allow entries, which is the stronger guarantee. The single cardinal-gate run belongs to `152-15`. |

### On the prover range (memo item 16 / WINDOWS 98)

Task 3's criterion says `--range <plan-start>..HEAD`. **The range is bounded at the last REFACTOR commit `95deffbd5`, not at `HEAD`, and that is deliberate.** Once the SUMMARY/STATE/ROADMAP/WINDOWS docs commit lands, `..HEAD` sweeps `.planning/**.md` into the compared set, and the classifier maps `md` to an empty comment family — so it reads every byte of a Markdown file as code and reports one violation per `.planning` file in the range. That is a **scoping artefact of the range, not a property of this plan's diff.**

Both numbers, measured after the docs commit `057e6a175` so the difference is reproducible rather than predicted:

| Range | Result |
|---|---|
| `224f78e60..95deffbd5` — bounded at the last refactor commit | 70 compared, **0 violations**, exit **0** |
| `224f78e60..HEAD` — through the docs commit | 74 compared, **4 violations**, exit **1** |

The four are exactly the four `.planning/` Markdown files the docs commit adds:

```
[ERROR] '.planning/phases/152-comment-naming-hygiene-sweep/152-11-SUMMARY.md': a NON-COMMENT byte changed at code-stream offset 0.
[ERROR] '.planning/STATE.md':    a NON-COMMENT byte changed at code-stream offset 233.
[ERROR] '.planning/ROADMAP.md':  a NON-COMMENT byte changed at code-stream offset 127828.
[ERROR] '.planning/WINDOWS.md':  a NON-COMMENT byte changed at code-stream offset 36.
```

Every one of the 70 source files is `✓ COMMENT-ONLY` in **both** runs. The bounded figure is the verdict.

**No allow entry was added for a `.planning/` path.** The zero-allow-entry rule is what makes the proof mean anything.

### A criterion that passes but proves nothing, said plainly

Task 2's criterion *"`git grep -c 'svelte-warning: accepted' -- apps/frontend/src/routes` returns a count no lower than before"* is **vacuous**. Measured at plan-start `224f78e60` and again after the sweep: **0 both times**. The sanctioned inline warning-acceptance format appears nowhere in `apps/frontend` at all — repo-wide it lives only under `.planning/`, `.claude/` and `CLAUDE.md`. The criterion is satisfied (0 is not lower than 0) but says nothing about this sweep, because there was no such comment in the partition to preserve. Registered as entry **112** so a later reader does not mistake a vacuous pass for an audit.

---

## 13. Issues encountered

**None blocking.** Four findings registered in `.planning/WINDOWS.md` (entries 109–113), one window closed (70), and no interactive checkpoint raised — the plan is `autonomous: true` and the operator is away.

## 14. Requirements

`REVIEW-HYG-02` is declared by sibling plans in this phase that have no SUMMARY yet. `requirements.ready-ids` returns **0/1**, so the shared-ID gate (#2388) correctly holds it Pending. **Not marked complete** (memo standing item).

## 15. Next phase readiness

Ready for the remaining `152-1x` plans. Three specific handoffs:

- **`152-13`** inherits the four `describe(...)` ids found in the neighbouring lib prefix (`ASSERT-08`, `D-05`, `D-06`, `CLEAN-04`) and the memo-12 fence, now with a second instance whose ids are cited by a blocking CI job rather than a run register.
- **`152-14`** inherits no join from this plan; none was performed.
- **`152-15`** owns the single cardinal E2E gate. This plan's partition is comment-only with zero allow entries, so nothing here should move it.
- **The operator** owes rulings on entries **109/110** (Markdown), **111** (a tracked `.tsbuildinfo`) and the memo-12 coverage ids.

---

## Self-Check: PASSED

- `apps/frontend/src/routes/(voters)/+layout.svelte` — FOUND, 99 lines, exemplar disposition verified line by line
- `apps/frontend/src/lib/components/input/Input.svelte` — FOUND, number branch labelled, RPC reference gone
- `.planning/phases/152-comment-naming-hygiene-sweep/152-11-SUMMARY.md` — FOUND (this file)
- `ec2df91cd` `refactor(152-11): land the exemplar exactly as D-A2 disposes it` — FOUND in `git log`
- `801c81270` `refactor(152-11): sweep the rest of the voter, candidate, admin and shell routes` — FOUND
- `95deffbd5` `refactor(152-11): sweep the component library and the rest of the frontend surface` — FOUND
- All three per-task provers exit 0 with 0 allow entries; the plan-range prover (bounded) exits 0 over 70 files
- `yarn build`, `yarn workspace @openvaa/frontend test:unit`, `yarn lint:check`, `node scripts/assert-comment-hygiene.mjs` — all exit 0
