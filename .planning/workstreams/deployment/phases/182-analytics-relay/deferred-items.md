# Phase 182: deferred items

Out-of-scope findings recorded during execution. Each one names the plan that found it and the plan or owner that should act on it.

## From plan 182-15

- **RESOLVED in 182-16 (`51177cc58`).** ~~`TrackingHandler` is still exported from `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts`.~~ The type and its doc comment are deleted together with the Umami directory; `git grep -n TrackingHandler -- apps/frontend/src` prints nothing.
- **RESOLVED in 182-16 (`51177cc58`).** ~~A stale comment in `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts`.~~ The paragraph that starts "Persisting ONLY on `set`/`update`" now gives a generated default (a random id, a timestamp) as its example instead of the removed tracking `sessionId`.
- **RESOLVED in 182-16 (`51177cc58`).** ~~The Umami type comment (`UmamiAnalytics.type.ts`) still names `sendTrackingEvent`.~~ The file is deleted.

## From plan 182-26 (carried by 182-16)

- **Stale class comments in `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts` and `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts`.** The section comment "Inherited appContext members (declared for `implements …`; INSTALLED via `Object.assign(this, this.#appContext)` …" is false: both constructors call `inheritContextMembers(this, this.#appContext)`. The contestant file's "Inherited authContext members" comment, by contrast, is correct (`Object.assign(this, authContextRest)`), so the reword is per comment, not a search-and-replace. Plan 182-16 left them: neither file is its own and the v2.16 stream edits the contestant context. **Act:** whoever next edits either file; comment-only.

## From plan 182-16

- **RESOLVED in 182-19 (`ca961cb09`).** ~~**`packages/dev-seed/src/templates/index.ts`** still names the integration in the comment above the `perm-analytics-tracking` entry ("dummy umami code"). Plan 182-19 owns `packages/dev-seed` by directory, but its `files_modified` lists only `perm-analytics-tracking.ts`. **Act in plan 182-19:** correct that comment when the template stops writing `platform`.~~ The comment now says the template seeds `analytics.trackEvents:true` for the tracking spec.

## From plan 182-17

- **RESOLVED in 182-19 (`96bb107f0`).** ~~**`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`**, the doc comment of `_getAppSettings` (the paragraph that starts "Limitation: nothing else that is stored is honoured"), names `analytics.platform` as an example of a stored setting a closed project does not honour. It is a comment, not a read, but it makes 182-17's first Task 1 verify (`git grep -F 'analytics.platform' -- apps/frontend/src`) print one line. The file belongs to plan 182-19. **Act in plan 182-19:** drop `analytics.platform` from that list when the setting is removed.~~ The Limitation paragraph no longer names it; `git grep -F 'analytics.platform' -- apps/frontend/src` prints nothing.

## From plan 182-23

- **RESOLVED in 182-19 (`96bb107f0`).** ~~**`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`**, the case "copies no other member of analytics, whatever the answer carries there" (added in `87ae648f6`), uses `platform: { name: 'umami', code: 'x' }` as its stray member. That makes 182-23's acceptance grep `git grep -n -i umami -- tests apps/frontend/src` print one line. It is a deliberate fixture: it shows that a stale provider member is not copied, not a read of the integration. The file belongs to plan 182-19, which owns the data provider. **Act in plan 182-19:** rename the stray member to a neutral name, for example `platform: { name: 'other', code: 'x' }`, when `analytics.platform` is removed. Keep the case itself.~~ The stray member is `platform: { name: 'other', code: 'x' }` and the case is kept; `git grep -n -i umami -- tests apps/frontend/src` prints nothing.

## From plan 182-19

- **`apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql`**: two comments name the stored bait `analytics.platform` (the header's "WHY EVERY ASSERTION BELOW IS NON-VACUOUS" paragraph and the comment above the key-set assertions). The bait is a deliberate stale-row fixture and the comments are true, but they make 182-19's acceptance grep `git grep -n -E "analytics\??\.platform" -- apps packages tests ':!apps/docs'` print two lines. The file is 182-02's `[db]` test, shared with v2.16 (178-04). **Act:** none required. If the phase-182 sweep (182-22) wants the grep empty, reword the two comments to "a stored provider member under `analytics`" and keep the bait.
- **`apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md`** says "`StoredSettingsSchema` also accepts `analytics`, which is a static setting". That is false after 182-19. **Act in plan 182-22** (the docs sweep), with the other static-settings pages listed in RESEARCH § 4.

## From plan 182-20

- **RESOLVED in 182-27 (`e9e6a1bd6`).** The "Capture seam" paragraph no longer claims to see sends made as a document is left, and a new "What it does not see" section points to `relayProxy.fixture.ts`. ~~**`tests/tests/fixtures/shared/relayCapture.fixture.ts`**, the "Capture seam" paragraph of the header, says a context listener does not miss a request a page sends on the way out. That is false for a batch sent at page hide: a probe on Chromium 153 with Playwright 1.63 (plan 182-20) saw no context `request` event, no `context.route` call and no raw CDP `Network` event for a keepalive `fetch` made in `pagehide` or in `visibilitychange` to hidden while `page.goto` left the page, while the server received it. A send started while the document is alive is reported. Plan 182-20 added `relayProxy.fixture.ts` for the page-hide case and left this file alone, because it is plan 182-10's. **Act:** whoever next edits the fixture; comment only. Say that the capture sees batches sent while the document is alive (client navigation, the hidden flush reached by hand) and not batches sent at page hide, and point to `relayProxy.fixture.ts`.~~

## From plan 182-27

- **`scripts/assert-a11y-scan-wiring.mjs`** lists, in its Check 4a, the files that declare an axe scan and must take their gate from the shared `assertAxeScan`. The new `tests/tests/specs/contestant/contestant-terms-tracking.spec.ts` scans the terms-of-use view with the opt-out box through `toScanEntry` and `assertAxeScan`, so it complies, but the guard does not list it, so a later edit that built its own `AxeBuilder` there would not be caught. The guard was not in 182-27's files. **Act:** whoever next edits the guard; add the spec to Check 4a's list (no import is required of it, as for the other specs that hold tests besides scans).

## From plan 182-22

The sweep's population was the two derive commands of the plan; every line they printed outside `.planning/` was corrected or is reported here. The items below are outside the plan's files and stay open.

- **`tests/tests/setup/perm/perm-analytics-tracking.setup.ts`**, the file docblock: "UNAUTHENTICATED" and "The template seeds the analytics overlay (platform object + trackEvents:true, dummy code)" are stale; the template now seeds `analytics.trackEvents: true` only. **Act:** whoever next edits the file; comment only.
- **`apps/frontend/src/hooks.server.ts`**, the production start-up error "Required environment variables are not set: …" also fires for an invalid `ANALYTICS_` value (for example `ANALYTICS_PROVIDER=posthgo`), where "not set" is the wrong word. **Act:** phase 181, which owns the start-up check's wording.
- **Shutdown contact with phase 181.** `apps/frontend/src/lib/server/startup/shutdown.ts` is not tracked yet, so `apps/frontend/src/lib/server/analytics/runtime.ts` keeps `registerShutdownFlush(queue)` from `./queue`. **Act:** when plan 181-14 lands `onShutdown(task)`, change `runtime.ts` to register the queue's flush through it and attach no listener of its own, then run the tests under `src/lib/server/analytics` and `src/routes/api/usage`.
- **`tests/tests/utils/e2eSpecVerdict.test.ts`** uses `NEEDLE = 'appContext-sessionId'` as fixture text for the failure message a privacy red control prints. It names the removed key as a violation, like the allowlist unit test, so it was reported and not edited. **Act:** none required; if a later plan wants the only `tests` match to be the allowlist test, change the needle (and the split colour-sequence case) to a neutral key.
- **`apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md`** does not list the five `ANALYTICS_` variables. The static-settings and intro pages now name `ANALYTICS_PROVIDER` and point to `.env.example`. **Act:** DOCS-05 in phase 189, with the event catalogue and the deployer's checklist.
- Still open from earlier plans: the `scripts/assert-a11y-scan-wiring.mjs` Check 4a item (182-27), the two accurate `analytics.platform` comments in `38-contestant-app-public-config.test.sql` (182-19; left, they describe a deliberate stale-row fixture in a file shared with v2.16), and the class comments of the contestant and admin contexts (182-26).

## From plan 182-24

### The same focus gap as the voter privacy page (NAVA11Y-02), not fixed

`e06816d05` gave the voter privacy page's heading `tabindex="-1"`, so the post-navigation focus reset lands there (confirmed from the trace DOM; the unit test `3029d15e3` was red first). The same gap, a page heading that cannot take focus, was found by reading these files and was not fixed, because none of them is in this phase's scope:

- `apps/frontend/src/routes/(voters)/about/+page.svelte`
- `apps/frontend/src/routes/admin/login/+page.svelte`
- `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte`
- `apps/frontend/src/lib/layouts/main/MaintenancePage.svelte`

**Act:** whoever next owns NAVA11Y-02 or edits one of these files; add `tabindex="-1"` to the heading the focus reset targets, with a unit test that is red first, as for the privacy page.

### Texts left stale by the keepalive form change (`0e343a40d`)

As of `0e343a40d` the keepalive page-leave test in `tests/tests/specs/voter/analytics-privacy.spec.ts` is in the proxy form (title ends `(proxy form)`, the 204 read through `startRelayRecordingProxy()`). Playwright resolves `request.response()` only when the answer arrives before the page is left, so the direct form was a race (11 of 30 repeats red; the proxy form 30 of 30). These texts still describe the direct form. A dated correction was appended to 182-20-SUMMARY, 182-23-SUMMARY and the 182-VALIDATION checklist; the others are listed here. Evidence files are byte copies of attempt files and are never edited.

- **182-20-PLAN, Task 1**, the sentence that starts "Keep in the test only the form it names…", and its form verify `grep -q -F "($U)"`: it now fails, because the spec says `(proxy form)` and the record says `direct form`. **Act:** none on a completed plan; a re-run of that verify is expected to fail for this reason.
- **182-20-SUMMARY**, the key decision "The keepalive test keeps only the direct form…" and `requires … provides: UNLOAD_FORM=direct form`. Superseded by the appended correction.
- **evidence/23-green-cutover.txt**, `UNLOAD_FORM=direct form`. Not edited (byte copy).
- **evidence/23-window.txt**, the `GREEN_RUN=` line ("in the direct form; control direct-no-keepalive passed (keepalive necessity not observed)"). Not edited (byte copy).
- **evidence/23-keepalive-control.txt**: its values (`CONTROL_KEEPALIVE_TEST=passed`, `KEEPALIVE_NECESSITY=not observed`) still hold as observed, but its reading is wrong. The control measured nothing about whether a send outlives the page, because the direct form cannot see an answer that arrives after the leave. Not edited (byte copy).
- **182-23-PLAN**, the must-have "Which form of the keepalive test proves arrival is measured and recorded in the words direct form or route form…". Neither form is the one in the tree now.
- **182-23-SUMMARY**, the keepalive lines (`provides` "the keepalive form measured (direct form) and the no-keepalive control recorded", the key decisions on `UNLOAD_FORM=direct form` and on the control, and the Results bullets "Keepalive form" and "Control"). Superseded by the appended correction.
- **182-RESEARCH**, § 11 "Capturing a send made at unload" (`[ASSUMED]` on whether Playwright reports a keepalive response after the document is gone) and assumption **A1** in the assumptions table: settled, it is not reported.
- **182-VALIDATION**, the checklist item "The keepalive test at page leave with its two forms…". A dated correction is appended beside it.
- **For plan 182-29:** its "Keepalive at page leave: " line must not describe the 182-23 control as having measured whether the send outlives the page. It may quote `CONTROL_KEEPALIVE_TEST` and `KEEPALIVE_NECESSITY` from `evidence/23-keepalive-control.txt`, but must say that the necessity of the flag was not measured, because the direct form cannot see an answer that arrives after the leave, and that the kept test is the proxy form as of `0e343a40d`.
