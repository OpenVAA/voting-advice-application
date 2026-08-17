# Phase 123 — Lifecycle (RUNES-01) + Reactive-`let` (RUNES-02) Disposition Record

**Authored:** 2026-06-17 (plan 123-03)
**Purpose:** The committed, measurable artifact for RUNES-01 criterion 1 ("migrated where semantically equivalent; genuine lifecycle semantics retained") and RUNES-02 criterion 2 ("reactive `let` → `$state`, per-site; non-reactive locals left as `let`"). Each disposition is source-grounded, citing the `123-RESEARCH.md` classification, not subjective "looks migrated" judgment.

**Posture:** D-04 conservative (`onMount`/`onDestroy` → `$effect` ONLY for clean 1:1 with no re-run hazard and no genuine once-only/teardown semantics) + D-05 (reactive-`let` → `$state` only when the local is mutated for reactive effect; non-reactive locals stay `let`).

---

## RUNES-01 — Lifecycle hook disposition (all live call sites)

### Live enumeration (re-run 2026-06-17)

Re-ran the RESEARCH enumeration grep on the live tree:

```bash
grep -rIn "onMount(" --include="*.svelte" --include="*.ts" apps/frontend/src   # filter import + commented
grep -rIn "onDestroy(" --include="*.svelte" --include="*.ts" apps/frontend/src  # filter import + commented
```

**Live count: 13 `onMount` + 12 `onDestroy` = 25 real call sites across 21 distinct files.** This matches RESEARCH (25 sites / 21 files) exactly — **delta = 0**, no other phase landed in the surface since RESEARCH was captured. The commented-out hooks in `lib/components/input/Input.svelte:358` (`onMount`) and `:363` (`onDestroy`) are excluded as non-live (Input.svelte has 0 real hooks). 23 files match the keyword; 2 of those (`Input.svelte`, plus the keyword appears in the candidate test surface) carry no live hook, leaving the 21 real-hook files.

### Disposition legend

- **MIGRATE** — clean 1:1 `$effect`-equivalent: no re-run hazard AND no genuine once-only/teardown semantics.
- **LEAVE** — re-run hazard, browser-only imperative once-only setup, genuine teardown, OR a documented prior anti-`$effect` decision.
- **hard-LEAVE** — a documented prior REVERT-TO-ONMOUNT / PRESERVE-VERBATIM decision; converting reintroduces a known, fixed regression. MUST NOT be migrated.

### Per-site table

| # | File:line | Hook | Disposition | Rationale (source-grounded, cites RESEARCH) |
|---|-----------|------|-------------|---------------------------------------------|
| 1 | `lib/admin/components/jobs/WithPolling.svelte:27` | onMount (returns `stopPolling`) | **LEAVE** | RESEARCH: genuine mount-once/unmount-once lifecycle (`startPolling()` on mount, `stopPolling()` on teardown). Borderline-MIGRATE candidate (Task 3, default skip) — the idiomatic `$effect(() => { startPolling(); return stopPolling; })` is a legal 1:1 because the body reads only stable context destructures (runs once). Default LEAVE per D-04 (no benefit; genuine lifecycle). See RESEARCH Open Question 2. |
| 2 | `lib/components/alert/Alert.svelte:76` | onMount | **LEAVE** | RESEARCH: `if (autoOpen) openAlert()` once-only init. `autoOpen` is a prop and could in principle change, so an `$effect` reading it would re-fire → re-run hazard. LEAVE to preserve once-only semantics. |
| 3 | `lib/components/modal/drawer/Drawer.svelte:67` | onMount | **LEAVE** | RESEARCH: `containerRef?.openModal()` imperative once-only DOM action against a `bind:this` ref populated only after first render. Re-running on any reactive change would re-open the modal. Genuine mount-time imperative call. |
| 4 | `lib/components/preventNavigation/PreventNavigation.svelte:43` | onMount | **LEAVE** | RESEARCH: `addEventListener('beforeunload', ...)` browser-only imperative once-only setup. Already carries an explicit in-code rationale (line 42: "browser-only; onMount itself doesn't fire on the server"). Paired with the onDestroy below — genuine add/remove lifecycle. Borderline-MIGRATE pair (Task 3); default LEAVE (the existing SSR-guard comment shows the author chose split hooks deliberately). |
| 5 | `lib/components/preventNavigation/PreventNavigation.svelte:49` | onDestroy | **LEAVE** | RESEARCH: `removeEventListener` teardown, browser-guarded (`if (browser)`). Already documented (line 47–48: "onDestroy fires on both server and client; guard the browser-only API"). Genuine teardown. |
| 6 | `lib/components/questions/QuestionOpenAnswer.svelte:33` | onMount (`tick().then(...)`) | **LEAVE** | RESEARCH: async post-mount DOM measurement (`el.clientHeight < el.scrollHeight`) gated on `tick()`. An `$effect` would re-fire on `collapsible`/`fullHeight` writes (re-run/feedback hazard); the async-then pattern is intentionally one-shot. |
| 7 | `lib/components/video/Video.svelte:221` | onMount (`setShouldPlay(!!autoPlay)`) | **LEAVE** | RESEARCH: one-shot init that starts an interval regime (`initErrorChecking` → `setInterval`). Re-running would spawn duplicate intervals. Genuine once-only. |
| 8 | `lib/components/video/Video.svelte:279` | onDestroy (`clearErrorChecking`) | **LEAVE** | RESEARCH: `clearTimeout`/interval teardown of the error-check regime. Genuine teardown (an `$effect` cleanup would have to own the interval start too — a larger refactor than behavior-neutral polish allows). |
| 9 | `lib/components/video/Video.svelte:328` | onMount (`startVideoEvent`) | **LEAVE** | RESEARCH: one-shot tracking-event start, paired with `beforeNavigate(endVideoEvent)`. Re-running would create duplicate events. Once-only intent. |
| 10 | `lib/candidate/components/passwordValidator/PasswordValidator.svelte:83` | onDestroy (`clearTimeout(timeout)`) | **LEAVE** | RESEARCH: debounce-timeout teardown. Genuine teardown. (CLAUDE.md memory + the candidate-layout revert note a prior perm-hang where reactive re-runs reset this 200ms debounce — extra reason NOT to convert to a re-running `$effect`.) |
| 11 | `lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:85` | onDestroy (`filter.onChange(updateSelected, false)`) | **LEAVE** | RESEARCH: unsubscribe from a non-reactive `filter.onChange` listener registered imperatively at init (line 82). Genuine teardown of an external subscription. |
| 12 | `lib/components/entityFilters/numeric/NumericEntityFilter.svelte:53` | onDestroy (`filter.onChange(updateValues, false)`) | **LEAVE** | RESEARCH: same pattern — unsubscribe external filter listener. Genuine teardown. |
| 13 | `lib/components/modal/timed/TimedModal.svelte:104` | onDestroy (`if (timer) clearTimeout(timer)`) | **LEAVE** | RESEARCH: timeout teardown. Genuine teardown. |
| 14 | `lib/dynamic-components/entityList/EntityList.svelte:76` | onDestroy (`if (scrollTimeout) clearTimeout(scrollTimeout)`) | **LEAVE** | RESEARCH: scroll-debounce teardown. Genuine teardown. |
| 15 | `lib/dynamic-components/feedback/Feedback.svelte:97` | onDestroy (`clearErrorTimeout`) | **LEAVE** | RESEARCH: error-timeout teardown. Genuine teardown. |
| 16 | `lib/dynamic-components/feedback/modal/FeedbackModal.svelte:33` | onDestroy (`if (closeTimeout) clearTimeout(closeTimeout)`) | **LEAVE** | RESEARCH: close-timeout teardown. Genuine teardown. |
| 17 | `lib/dynamic-components/feedback/popup/FeedbackPopup.svelte:30` | onDestroy (`if (closeTimeout) clearTimeout(closeTimeout)`) | **LEAVE** | RESEARCH: close-timeout teardown. Genuine teardown. |
| 18 | `lib/dynamic-components/survey/popup/SurveyPopup.svelte:29` | onDestroy (`if (closeTimeout) clearTimeout(closeTimeout)`) | **LEAVE** | RESEARCH: close-timeout teardown. Genuine teardown. |
| 19 | `routes/(voters)/(located)/questions/+layout.svelte:143` | onMount (`start` param handler) | **hard-LEAVE** | RESEARCH + in-code: already carries explicit anti-`$effect` rationale (lines 137–142: "kept as onMount … porting to afterNavigate/$effect would re-fire on every hop"). Once-per-session deep-link handler. PRESERVE-VERBATIM. **Do not migrate.** |
| 20 | `routes/(voters)/(located)/questions/+page.svelte:49` | onMount (redirect + stale-category filter) | **LEAVE** | RESEARCH: navigation redirect (`goto`) + one-shot `firstQuestionId` reset. An `$effect` would re-fire / re-redirect. Genuine navigation one-shot. |
| 21 | `routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte:77` | onMount (`goto` redirect) | **LEAVE** | RESEARCH: pure navigation redirect (`goto(..., { replaceState: true })`). Once-only; re-running re-redirects. |
| 22 | `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:196` | onMount (`startEvent` tracking) | **hard-LEAVE** | RESEARCH + in-code: file documents the onMount-vs-`$effect` split (line 193 "Pitfall 6 — PRESERVE VERBATIM"; the adjacent countdown logic was DELIBERATELY kept `$effect` while this tracking start was kept `onMount`). One-shot results-entry analytics event. **Do not migrate.** |
| 23 | `routes/(voters)/+layout.svelte:107` | onMount (popup queue) | **hard-LEAVE** | RESEARCH + in-code: explicit REVERT-TO-ONMOUNT decision (lines 92–106, Phase 86.3 cell #3) — a reactive `$effect` re-queue broke e2e fixtures (answeredVoterPage fixture stuck on intro). Converting reintroduces a known regression. **Do not migrate.** |
| 24 | `routes/candidate/+layout.svelte:56` | onMount (popup queue) | **hard-LEAVE** | RESEARCH + in-code: explicit anti-`$effect` rationale (lines 49–55) — a reactive `$effect` re-run reset PasswordValidator's 200ms debounce and hung the set-password submit (perm-localisation-positive hang). Converting reintroduces a known regression. **Do not migrate.** |
| 25 | `routes/+layout.svelte:173` | onDestroy (`submitAllEvents()`) | **LEAVE** | RESEARCH: analytics flush on root-layout teardown, paired with `onNavigate`/`afterNavigate` analytics hooks (spikes 015/016 view-transitions work). Genuine teardown of the root layout. |

### RUNES-01 net outcome

Of the 25 sites: **0 unambiguous MIGRATE; 25 LEAVE** (4 of which are hard-LEAVE documented prior decisions: sites #19, #22, #23, #24). Two sites (#1 WithPolling:27, #4+#5 PreventNavigation:43+49 as a paired `$effect`-with-cleanup) are *borderline* legal 1:1 conversions handled as optional executor-discretion in Task 3 — see the Task 3 outcome note below.

This is the correct, criterion-1-satisfying result per D-04 and RESEARCH's "Net RUNES-01 outcome (expected)" paragraph: the surface is genuine-lifecycle-dominant, so the disciplined audit LEAVES all sites with documented per-site rationale rather than pressure-migrating borderline sites against documented prior decisions.

### Inline rationale comments added this task

**None.** Every LEAVE site either (a) carries pre-existing in-code rationale (the 4 hard-LEAVE sites + PreventNavigation #4/#5), or (b) is a self-evident `clearTimeout`/`clearInterval`/`filter.onChange(...,false)`/listener-teardown whose teardown intent is unambiguous from the call itself. Per the Task 1 instruction "Do NOT add comments to sites that already carry an explicit rationale," and per D-04 (add a note only "where useful"), no inline comments were warranted — adding boilerplate `// reason: clearTimeout teardown` to an obvious `clearTimeout(timer)` call adds noise, not clarity. The disposition table here IS the committed rationale record.

---

## RUNES-02 — Reactive-`let` → `$state` enumeration + per-site classification

### Detection method (RESEARCH two-step, re-run 2026-06-17)

**Step 1 — bare-`let` candidates** (no `$state`/`$derived`/`$props`/`$bindable` on the RHS):

```bash
grep -rn '^\s*let [a-zA-Z_]' apps/frontend/src --include="*.svelte" \
  | grep -v '\$state' | grep -v '\$derived' | grep -v '\$props' | grep -v '\$bindable'
```

This returns ~85 raw hits. Per D-05 and the RESEARCH rule, locals declared **inside** a `$derived.by` thunk or a function body (deeper than component-scope indentation — e.g. `let cls`, `let styles`, `let parsedColor`, `let combined`, `let result`, `let questions`, `let end`) are NOT reactive component state and are **automatic LEAVE**. Filtering to top-level (component-scope, 2-space-indent) declarations leaves ~42 genuine candidates.

**Step 2 — per-candidate reassignment + tracking-scope read analysis.** For each top-level candidate, checked whether it is reassigned outside its declaration AND whether a template / `$derived` / `$effect` read needs to re-evaluate when it changes (→ MIGRATE) vs. whether it holds a non-reactive handle / is computed-once / is intentionally non-reactive (→ LEAVE-as-`let`).

### Classification of the top-level candidates

| Category | Representative sites | Disposition | Rationale |
|----------|---------------------|-------------|-----------|
| `bind:this` element/component refs | `alertRef` (Alert/Notification/PreregisteredNotification/DataConsentPopup/FeedbackPopup/SurveyPopup), `modalRef` (Modal/DataConsentInfoButton/FeedbackModal), `containerRef` (ModalContainer), `confirmModalRef` (ButtonWithConfirmation), `svgElement` (Icon), `triggerElement` (Term), `div` (EntityList:56), `timedModal` (TimedModal:36), `drawerOpenElement` (Layout:42), `feedbackRef`/`modalRef` (FeedbackModal/Popup) | **LEAVE-as-`let`** | RESEARCH LEAVE-as-`let` class: `bind:this` targets are imperative DOM/component handles populated by the framework after mount; not reactive component state. `$state` adds needless reactivity. |
| Timer / interval ids | `timeout` (PasswordValidator:62), `timer` (TimedModal:92), `scrollTimeout` (EntityList:57), `errorTimeout` (Feedback:89), `closeTimeout` (FeedbackPopup:29 / FeedbackModal:32 / SurveyPopup:28), `errorCheckInterval` (Video:207) | **LEAVE-as-`let`** | RESEARCH representative LEAVE table: timer/interval ids are non-reactive by design; mutated in callbacks but never read in a tracking scope. D-05: converting them risks extra effect invalidations. |
| Imperative bookkeeping handles | `lastPlaying` (Video:215), `event` (Video:333) | **LEAVE-as-`let`** | RESEARCH explicit LEAVE table: mutated inside interval/callbacks but never read in a tracking scope — pure imperative bookkeeping. |
| Callback/function handles | `reset` (Feedback:37), `openFeedback` (FeedbackModal:14), `passwordSetterRef` (settings:38), `feedbackRef` shapes | **LEAVE-as-`let`** | Imperative function/handle references assigned via `bind:` or child callback; never template-read as reactive state. |
| Documented intentional non-reactive local | `emailFromContext` (candidate/login/+page.svelte:79) | **LEAVE-as-`let`** | Reassigned (line 82) AND read inside an `$effect` (line 103), but the in-code comment (lines 76–78) documents it as a DELIBERATE plain-`let`: "captured once at init so reads inside `$effect` do not register a reactive dependency" — the focus-on-prefill heuristic depends on it NOT being reactive. Converting to `$state` would break the documented intent (re-fire the focus effect when the user types). Hard LEAVE-as-`let`. |
| Commented-out / doc-comment code (false positives) | `Header.svelte:55–59` (`videoHeight`/`videoWidth`/`hasVideo`/`screenWidth` — inside a `/* */` block), `Toggle.svelte:30,48` (`selected` — inside `<!-- -->` usage examples), `TermsOfUseForm.svelte:18` + `ModalContainer.svelte:32` (`termsAccepted`/`title` — inside `<!-- -->` usage examples; the live components use `$bindable()`) | **LEAVE (n/a)** | Not live code — matched by the grep inside comment blocks. No disposition needed. |
| Once-computed / locally-scoped non-reactive | `sections` (ConstituencySelector:66 — built once), `voterContext` (EntityDetails:59 — captured ref) | **LEAVE-as-`let`** | Computed-once / captured-once locals not reassigned to drive UI; D-05 leaves them `let`. |

### RUNES-02 MIGRATE set: **EMPTY**

**No top-level bare `let` was found that is reassigned to drive UI AND read in a tracking scope requiring re-evaluation.** Every survivor is a `bind:this` ref, a timer/interval/event handle, a documented intentional non-reactive local (`emailFromContext`), a once-computed local, or a false-positive match inside a comment block.

This is a valid, criterion-2-satisfying outcome and confirms RESEARCH assumption A1 (the MIGRATE set is small/empty because the v2.13 migration, Phases 113–117, already converted the obvious reactive locals — e.g. `Video.svelte` already uses `$state` for `shouldPlay`, `jumpBackPressed`, etc.). **No blanket sweep performed (D-05); no conversions made.**

---

## Task 3 outcome — borderline migration decision

**No borderline lifecycle migration performed (default per D-04).** Neither `WithPolling.svelte:27` nor `PreventNavigation.svelte:43+49` was converted. Both remain `onMount`/`onDestroy`. The two files listed in this plan's `files_modified` (`WithPolling.svelte`, `PreventNavigation.svelte`) are therefore untouched. RESEARCH Open Question 2 and the conservative D-04 posture both make LEAVE the correct, criterion-satisfying default — migrating them would add per-site E2E re-verification burden in plan 04 for zero behavioral benefit. No E2E spec flag for plan 04 is required from this plan.

---

## Verification

- Live enumeration re-run: 25 sites / 21 files, delta = 0 vs RESEARCH.
- 4 hard-LEAVE sites (#19, #22, #23, #24) recorded as do-not-migrate; remain `onMount`.
- RUNES-01 MIGRATE set: 0. RUNES-02 MIGRATE set: empty.
- No source `.svelte` files edited by this plan; svelte-check baseline (151 errors / 1 warning) unchanged; frontend unit suite green (see 123-03-SUMMARY.md gate).
