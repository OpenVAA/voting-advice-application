# Phase 182: Analytics Relay - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitor events travel through a same-origin relay to a provider chosen by server configuration. Nothing
analytics-related is stored on the device except the consent choice. Consent is asked by default. The Umami
browser integration is removed. The voter, Contestant and Admin apps are all tracked.

The phase closes RELAY-01, -02, -03, -05, -06, -07, -08 and RELAY-10 to RELAY-21. It builds toward RELAY-04
(the PostHog provider, tested against a stand-in), RELAY-09 and DOCS-05. Real capture at PostHog is phase 188.

All decisions below come from the operator's fill of
`.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md` on 2026-10-11. Four decisions differ from
the ★ RECOMMENDED option or add to it: D-01, D-02, D-12 and D-13. Six readings of the operator's notes are
marked **(reading)**; the operator has not yet confirmed them, and each says what a reversal costs.

</domain>

<decisions>
## Implementation Decisions

### The consent-independent pageview (RELAY-15)

- **D-01 (182-1, with the operator's note):** One consent-independent beacon from the browser to the relay
  produces the pageview. The relay stamps the time and builds the identifier-free record. Fields: the
  SvelteKit route id (not the path), the app (`voter`, `contestant`, `admin`), the locale, server time, **the
  duration, and every route parameter except those that identify the entity or the nomination**. No path, no
  referrer, no id, no query string.
  - **(reading 1)** Duration is known only when the page is left, and the record has no identifier, so two
    sends could not be joined. The one beacon is therefore sent when the page is left: on the next navigation,
    and on `pagehide` for the last page. A tab killed without `pagehide` loses its last pageview; counts are a
    lower bound. Reversal is cheap before the vocabulary plan is executed.
  - **(reading 2)** "All other route params" is an allowlist of parameter names per route in the closed schema.
    Entity and nomination identifiers are never on it. A parameter not on the list is dropped, so a route added
    later sends no parameter until it is listed.
- **D-02 (182-1b, overrules the ★):** `trackEvents` off does **not** stop the pageview. It is recorded whenever
  a provider is configured. `trackEvents` gates every other event. Provider `none` is the only setting that
  stops the pageview. **(reading 3)** RELAY-10, RELAY-15 and criterion 3 of the roadmap were reworded to say
  this on 2026-10-11.
- **D-03 (182-11):** The relay drops every request that carries `Sec-GPC`, the pageview included. The browser
  reads `navigator.globalPrivacyControl`: no prompt, no sends, and the privacy page says so. Nothing is stored
  to record the objection.

### Identifiers and consent (RELAY-11, RELAY-16, RELAY-17, RELAY-18)

- **D-04 (182-2):** In the default (consent-gated) mode a consenting visitor's answer events carry the visit
  id, so one visit's answers are one linked record at the provider. **The consent wording is kept** (operator:
  a visit cannot be connected to a person), so "the data cannot be connected to you" is not changed.
- **D-05 (182-2 gaps):** The event buffer is cleared at grant and at withdrawal; events buffered before the
  grant are not flushed. The survey link's `{sessionId}` is empty unless this visitor's events carry the visit
  id. In `memory` mode a reload starts a new id while stored answers are restored, so one visitor's set splits
  across ids; this is accepted and documented.
- **D-06 (182-3):** The schema carries a `sensitive` flag. Sensitive: `answer`, `answer_delete`,
  `question_skip`, and the events that reveal leaning: `results_ranked_*` (entity id and match score), the
  entity views, `filters_active`. The browser attaches the visit id only to events allowed to carry it. The
  relay mints every random id.
- **D-07 (milestone rulings B1 to B4, B7, carried):** Consent-gated is the default and consent-free is an
  opt-in deployment setting. Visit-id modes are `memory` (default) and `none`. No hash of address and user
  agent is built anywhere. In consent-free mode each sensitive event gets a fresh random id.

### Vocabulary and event shape (RELAY-08, RELAY-20, RELAY-21)

- **D-08 (182-4):** Event names stay at the call sites. One zod discriminated union with strict per-event
  payloads is the closed vocabulary. The two template names become fixed names plus `entityType`. Free text is
  removed (`feedback_sent` carries the visitor's typed text today; `filters_active` carries localised names).
  The compound `pageview` is unfolded into discrete events. **(reading 1, continued)** The consented
  `page_leave` event of the ★ text is not built, because the pageview of D-01 now carries the route and the
  duration.
- **D-09 (182-5):** The canonical shape is an own `AnalyticsEvent` (`name`, `time`, `app`, optional `id`,
  `attributes`). Two pure, separately tested mappers derive the OpenTelemetry log record and the app's
  `LogRecord`. No OpenTelemetry dependency is added. The `log` provider writes one JSON line to stdout itself,
  because events sent through `log.info` are dropped at the production default level (`logLevel.ts`: fallback
  `'warn'`).

### Configuration and transport (RELAY-01 to RELAY-03, RELAY-05 to RELAY-07, RELAY-09, RELAY-10)

- **D-10 (182-6):** The provider, the consent mode and the visit-id mode all live in private server
  environment. The root server load returns a projection (`active`, `consentMode`, `visitIdMode`); the browser
  never learns the provider, and no prompt appears for a relay that drops everything. `posthog` with no key
  fails the start-up check that phase 181 builds (181 D-13). One E2E run sees one mode.
- **D-11 (182-7, 182-9, 182-10):** The browser's `trackEvents` gate is trusted and provider `none` is the hard
  off; the relay does not read `app_settings`. Transport is `fetch` with `keepalive`, a JSON body,
  `credentials: 'omit'`, one batch per existing flush point. The relay does its own same-origin check
  (`Sec-Fetch-Site`, then `Origin`), so auth cookies never reach it. The path is a plain descriptive name
  outside the usual blocker patterns (`/api/usage`); the docs say counts are a lower bound and that blocking is
  not worked around.
- **D-11b (182-8):** `platform` is removed from the settings type, the strict schema and its tests, and
  `analytics.trackEvents` moves from static to dynamic settings (closes todo `2026-06-01` as written). A stored
  row that still has `platform` loses its `analytics` member with one error record per read. The names
  `perm-analytics-tracking` and `voter-prefs-tracking` are kept.

### Contestant and Admin apps (RELAY-19)

- **D-12 (182-12 prompt, overrules the ★, with the operator's note):** In the Contestant app, acceptance of
  the terms of use counts as consent. The acceptance page gets a second checkbox by which the user opts out,
  shown when tracking is enabled. The operator was told this bundled consent is legally weak and chose it.
  - **(reading 4)** The voter app keeps its popup, in the voter layout as today; it is not moved to the root
    layout. The Contestant app has no popup. The contestant's choice is written to the same origin-wide store
    the popup writes. The checkbox's exact form (ticked means "allow", or ticked means "do not track") is left
    to planning. The acceptance page is in files the v2.16 stream is changing, so the two streams meet there at
    merge; the plan keeps that edit small and isolated.
  - **(reading 5)** The Admin app has no terms page, so nothing there grants consent. Admin sends the pageview,
    and other events only if the same browser already holds a grant from another app. No prompt is added to
    Admin.
- **D-12b (182-12 events):** Contestant and Admin produce only what the root and shared layouts produce
  (pageviews, menu), with the `app` attribute. No Contestant-specific event is added.
- **D-13 (182-12 gap, overrules the ★):** The gap is fixed: in a project not open for voters, a signed-out
  reader gets the `analytics` member, so `trackEvents` reads correctly on the Contestant app's public pages.
  **(reading 6)** This is a schema change that goes into the baseline. Phase 182 writes it in `schema/` and
  the single migration, and it must land before the freeze of phase 181 (181 D-06). Plan it early, as its own
  plan. — **Reversibility:** one-way — once frozen, it can be changed only by an appended migration.

### Text and tests (RELAY-12, RELAY-13)

- **D-14 (182-13):** The provider-keyed privacy keys become provider-neutral, one variant per consent mode, in
  all seven locales. Text that becomes false is corrected (for example "This data can only be accessed by your
  device, not by the application's publisher."), except the sentence kept by D-04. The processor is not named
  in shipped text; the deployer names it in `dynamic.privacy.content`. The terms-of-use paragraph is a new
  non-`dynamic` key rendered by `TermsOfUse.svelte` when `trackEvents` is on, so a deployer's override cannot
  drop it. It names all three apps. Admin gets no terms or privacy page.
- **D-15 (182-14):** Playwright request capture on the relay path replaces the `window.umami.track` stub.
  Relay and provider unit tests with a stand-in `fetch` prove that the onward request carries neither address
  nor user agent. The default mode runs in the gate suite. Consent-free mode runs as a second single-project
  run with an environment prefix. The storage assertion (an exact allowlist over localStorage, sessionStorage,
  cookies and IndexedDB) lands before the session id is removed, so it is seen failing on the unchanged tree.
  `tests/scripts/e2e-run.sh` is not edited.

### Claude's Discretion

- The relay's exact path, if research finds `/api/usage` on a common filter list.
- The form of the opt-out checkbox (D-12), and the wording of the new strings in the seven locales.
- The names of the environment variables for provider, consent mode and visit-id mode.
- How the per-route parameter allowlist is expressed in the schema.

</decisions>

<research_amendments>
## Amendments after research (2026-10-11)

`182-RESEARCH.md` corrected parts of this file and raised questions for the operator. Each question below is
planned on its recommended answer. The operator has not ruled on them; they are listed for the operator in
`.planning/workstreams/deployment/v2.17-181-183-RESEARCH-FOLLOWUPS.md`. Where an amendment and a decision above
differ, the amendment wins.

- **A-01 (revises reading 1 of D-01):** The pageview is sent once per view, at the first of: a client
  navigation, `visibilitychange` to hidden, or `pagehide` as a fallback. `pagehide` alone is not reliable on
  mobile, and the tree's existing flush point is `visibilitychange`. Time after a return to the tab is not
  measured. No per-view token is used.
- **A-02 (D-13, coordination):** D-13 is one self-contained `[db]` commit that can be cherry-picked to the
  v2.16 branch, where `00001` is regenerated. The v2.16 branch has changed the schema since the branch point
  (its phase 177 is executed), so the regenerated migration conflicts at merge; it is resolved by keeping both
  `schema/` edits and regenerating, never by hand. v2.16's written plan 178-04 edits the same function
  (`contestant_app_public_config` in `schema/106-app-settings.sql`) and the same pgTAP file; it must be written
  on top of D-13, or its `CREATE OR REPLACE` removes the `analytics` member.
- **A-03 (D-12, reading 4):** The opt-out checkbox is unticked by default and its label means "do not collect
  usage data"; ticked means opt out. It is pre-ticked when this browser already holds a "denied" choice, so
  acceptance never flips a refusal. It is not shown when `Sec-GPC` is set. It is a new component plus a few
  lines in `TermsOfUseGate.svelte` and `TermsOfUse.svelte`; `TermsOfUseForm.svelte` is not touched. No v2.16
  plan edits those files today. The Contestant privacy page shows the existing consent control when tracking
  is enabled, so a contestant can change the choice.
- **A-04 (D-10, D-15):** `.env.example` sets the provider to `log`, so the gate suite's tracking spec sees
  events; the code default stays `none`. The operator adds the same line to the local `.env`.
- **A-05:** A consent grant stored under the old text stays a grant. Stored choices are not reset.
- **A-06 (D-08, D-11):** `track()` buffers like `startEvent`, so there is one batch per flush point. The two
  template names become `results_ranked_entity` and `results_browse_entity`. Free text is in five payloads, not
  two (`feedback_sent`, `feedback_error`, `filters_active`, `questionExtendedInfo_collapseSection` and
  `_expandSection`), and `video` sends a media URL and two unbounded strings; the schema replaces or bounds all
  of them.
- **A-07 (facts corrected):** The call sites are in 14 files, not 13. `maintenance_shown` and `video` are sent
  at once today, not folded.
- **A-08 (narrows D-14; from the plan check of 2026-10-12):** The terms-of-use paragraph is rendered when
  `trackEvents` is on and a provider is configured. With provider `none` nothing is sent, so a paragraph saying
  the three apps are tracked would be false. The visitor's own `Sec-GPC` signal does not hide it: the paragraph
  is the deployment's statement to every user. D-14 as ruled said "when `trackEvents` is on"; the operator has
  not ruled on this narrowing (follow-up 182-R6).

</research_amendments>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rulings and scope
- `.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md` — the decisions of this phase with
  their evidence and rejected options; "Rulings as read, 2026-10-11" and "Six readings" at the end are
  authoritative
- `.planning/workstreams/deployment/v2.17-DISCUSSION-POINTS.md` § B and "Rulings as read" — B1 to B8
- `.planning/workstreams/deployment/ROADMAP.md` § Phase 182 — goal, five success criteria (criterion 3
  reworded 2026-10-11), standing rules
- `.planning/workstreams/deployment/REQUIREMENTS.md` — RELAY-01 to RELAY-21 (RELAY-10 and RELAY-15 reworded
  2026-10-11)
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/181-CONTEXT.md` — D-06 (the
  pre-freeze list) and D-13 (the start-up check this phase extends)

### Research
- `.planning/workstreams/deployment/research/SUMMARY.md`, `FEATURES.md`, `PITFALLS.md`, `ARCHITECTURE.md`,
  `STACK.md` — written before the rulings. Where a sketch and a requirement differ, the requirement wins; the
  sketch removes the consent components and RELAY-11 keeps them.

### Code named by the decisions
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` — the session id in
  `sessionStorage` (`appContext-sessionId`), the event buffer, the consent gate, the survey link
- `TermsOfUse.svelte`, the voter layout that pushes the consent popup, the root and shared layouts
- `logLevel.ts` and the app's `LogRecord` type
- `packages/app-shared/src/settings/` — static and dynamic settings, `analytics.platform`,
  `analytics.trackEvents`
- The seed templates `perm-analytics-tracking` and `voter-prefs-tracking`
- `.planning/todos/pending/2026-10-11-analytics-event-allowlist-and-denylist-setting.md`,
  `2026-10-11-answer-events-differential-privacy-or-order-masking.md` — filed, not built here

File locations not given as full paths are confirmed by the researcher by content.

</canonical_refs>

<code_context>
## Existing Code Insights

Taken from the discussion document, whose grounding was three read-only analyses of the tree at `a5a1cf6e3`.
The orchestrator did not re-verify them; the researcher does.

### Reusable Assets
- `zod` is already a dependency.
- The consent components exist and are kept (RELAY-11).
- Both the Contestant and Admin apps already pass through the tracking path by the root and shared layouts;
  neither calls the service itself.

### Established Patterns
- Today there are 30 event names, two of them templates, at about 30 call sites in 13 files, folded into one
  compound `pageview`.
- Umami's script mounts on the provider setting alone with `data-auto-track="true"`, so pageviews already go
  to a third party without consent today.
- The session id is written to `sessionStorage` for every visitor at context construction, whatever
  `trackEvents` and consent say.
- Only one seed template writes the provider setting.
- The voter tree's only server loads do not read the URL, so client-side navigations do not reach the server
  (inferred from SvelteKit's rerun rules). This is why the pageview is a beacon and not a server hook.

### Integration Points
- Phase 181: the start-up check (181 D-13), the environment templates both phases add variables to, and the
  baseline freeze (181 D-06).
- The v2.16 stream: the terms acceptance page in the Contestant app (D-12).
- Phase 188 verifies the relay on the deployed stack and adds the WAF variable.

</code_context>

<specifics>
## Specific Ideas

- The research advises that the first plan is the data model and the event vocabulary, not the endpoint. With
  D-13, the baseline schema change is also early.
- Each privacy test is seen failing once (RELAY-12): no analytics identifier in any device store, no request
  to a third-party origin, nothing but the pageview before consent in the default mode, events without a prompt
  in consent-free mode.
- Whether a script-initiated send before consent is "access" under ePrivacy Art. 5(3) is a legal question that
  is not settled here. The docs say the consent determination is the deployer's and nowhere say that no consent
  is required (B7).
- Every user-facing string ships in `da, en, et, fi, fr, lb, sv`. WCAG 2.1 AA applies to the new checkbox.
- The phase closes on a green local E2E suite; a test that did not run counts as failed.

</specifics>

<deferred>
## Deferred Ideas

- Contestant-specific events (registration steps, answer saved) — not built; they would edit files v2.16 is
  changing.
- A consent prompt or a terms page for the Admin app.
- Relay-side enforcement of `trackEvents` through a cached read of `app_settings`.
- FUT-03 (differential privacy or order masking for answer events) and FUT-04 (an event allowlist and
  denylist setting) — filed as todos.
- A redesign of the consent prompt. None was decided, so the roadmap's "no UI hint" stands.

### Reviewed Todos (not folded)
The todo matcher returned only keyword matches unrelated to this phase's scope. The absorbed todo
`2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e` is closed by D-11b and D-15 and gets its
closure record in phase 189.

</deferred>

---

*Phase: 182-Analytics Relay*
*Context gathered: 2026-10-11*
