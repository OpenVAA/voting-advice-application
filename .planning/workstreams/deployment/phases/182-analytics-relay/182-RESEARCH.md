# Phase 182: Analytics Relay - Research

**Researched:** 2026-10-11
**Domain:** First-party analytics relay in SvelteKit (adapter-node), consent and identifier model, settings migration, one baseline schema change, privacy tests
**Confidence:** HIGH for facts about this repository, MEDIUM for browser and PostHog behaviour, not settled for anything legal
**Tree read:** `feat/deployment-terraform-supabase` at `03d3c2c40`. The v2.16 branch `feat/entity-signup-multi-grant` was read at `e375152a4` (2026-10-11 21:20 +0200).

## How to read the evidence tags

| Tag | Meaning |
| --- | --- |
| `[VERIFIED: path:lines]` | I opened the file with the Read tool in this session. The quoted text beside the tag is verbatim. |
| `[OBSERVED: path]` | I printed the file through the shell in this session and quote it verbatim. It is not a grep hit, but it is below `VERIFIED` under the provenance rule. An executor re-reads the file before relying on a discrete value from it. |
| `[CITED: url]` | Read from the named page in this session. Confidence is MEDIUM when two sources agree and LOW for a single fetch (the project's `classify-confidence` seam rates `webfetch` LOW). |
| `[ASSUMED]` | Training knowledge or inference. Not checked in this session. Listed again in the Assumptions Log. |

Line numbers are given only next to a content anchor. Use the quoted text to find the place; the numbers drift.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### The consent-independent pageview (RELAY-15)

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

#### Identifiers and consent (RELAY-11, RELAY-16, RELAY-17, RELAY-18)

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

#### Vocabulary and event shape (RELAY-08, RELAY-20, RELAY-21)

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

#### Configuration and transport (RELAY-01 to RELAY-03, RELAY-05 to RELAY-07, RELAY-09, RELAY-10)

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

#### Contestant and Admin apps (RELAY-19)

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

#### Text and tests (RELAY-12, RELAY-13)

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

### Deferred Ideas (OUT OF SCOPE)

- Contestant-specific events (registration steps, answer saved) — not built; they would edit files v2.16 is
  changing.
- A consent prompt or a terms page for the Admin app.
- Relay-side enforcement of `trackEvents` through a cached read of `app_settings`.
- FUT-03 (differential privacy or order masking for answer events) and FUT-04 (an event allowlist and
  denylist setting) — filed as todos.
- A redesign of the consent prompt. None was decided, so the roadmap's "no UI hint" stands.

#### Reviewed Todos (not folded)
The todo matcher returned only keyword matches unrelated to this phase's scope. The absorbed todo
`2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e` is closed by D-11b and D-15 and gets its
closure record in phase 189.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (short) | Research support |
|----|---------------------|------------------|
| RELAY-01 | Same-origin endpoint, answers at once, never blocks the interface | § Relay route; § Transport. `routes/api/` precedent and the `isApiRoute` gate skip are verified. |
| RELAY-02 | No third-party script or origin; a send survives unload | § 2 (page leave and `keepalive`); § 11 (third-party-origin assertion). The Umami mount is the natural red control. |
| RELAY-03 | Provider interface chosen by configuration, `none` default | § 3 (`$env/dynamic/private`); § Architecture Patterns, Pattern 2. |
| RELAY-05 | No analytics identifier on the device; the session id leaves the tracking path | § 1 (session id); § 11 (storage allowlist and the full key inventory). |
| RELAY-06 | No fingerprint, in browser or server | § Validation (static source guard plus a behavioural spy). |
| RELAY-07 | Address and user agent stop at the relay | § 8 (headers the relay must not forward); § Validation. |
| RELAY-08 | Closed vocabulary, bounded size, no query strings | § 1 (event table); § 2 (route allowlist); Pattern 1. |
| RELAY-10 | Provider, key, host are server configuration; `trackEvents` gates all but the pageview | § 3, § 4. |
| RELAY-11 | Consent mode is a deployment setting, gated by default | § 3 (projection); the gating table in § Architecture Patterns. |
| RELAY-12 | Each privacy test seen failing once | § Validation Architecture: a green observer and a red control for each property. |
| RELAY-13 | Privacy text in seven locales; objection without storage (`Sec-GPC`) | § 9, § 12. |
| RELAY-14 | Umami browser integration removed | § 1 (the mount), § 4 (`platform` readers). |
| RELAY-15 | Identifier-free pageview for every page view | § 2. Reading 1 has a cost that is stated plainly there. |
| RELAY-16 | Visit id modes `memory` and `none` | § Architecture Patterns, Pattern 3. |
| RELAY-17 | Consent-free: each sensitive event has a fresh random id | § 1 (`sensitive` column); relay-side enforcement in Pattern 1. |
| RELAY-18 | `{sessionId}` from the in-memory id, empty in `none` mode | § 1 (survey link). |
| RELAY-19 | Contestant and Admin tracked; terms of use say so | § 5, § 6, § 12. |
| RELAY-20 | OTel log record and `LogRecord` mappings, one test each | § 7. |
| RELAY-21 | `log` provider writes structured lines | § 7 (the default sink does not write JSON lines). |
| RELAY-04 (builds toward) | PostHog provider against a stand-in | § 8. |
| RELAY-09 (builds toward) | Same-origin check, body cap, bounded queue, fixed destination | § Relay route; § Security Domain. |
| DOCS-05 (builds toward) | Event catalogue | The closed schema in Pattern 1 is the catalogue's source. |
</phase_requirements>

## Summary

The phase is a data-model change with a transport attached. Three things carry most of the risk, and none of them is the endpoint. The first is the closed vocabulary: 30 event names at 30 call sites in 14 files, of which five carry text that must go (two more than the context file names). The second is the pageview of D-01, because sending it at page leave moves every landing-only visit onto the least reliable send a browser has. The third is the contact with the v2.16 stream, which is larger than the context file assumes in the database and smaller than it assumes in the terms-of-use files.

No new package is needed. `zod` 4.6.5, SvelteKit 2.70.3 and adapter-node 5.5.7 are in `yarn.lock` and cover everything: the schema, the `+server.ts` route, `$env/dynamic/private`, and the `sveltekit:shutdown` event for the final flush. The PostHog provider is a plain `fetch` to `POST {host}/batch/`.

Four statements in the planning record are wrong or out of date and a plan must not rely on them. They are listed in the next section. The most important: the v2.16 branch has changed the schema since the branch point (its phase 177 is executed), and its written plan 178-04 edits the same SQL function that D-13 edits.

**Primary recommendation:** Plan D-13 first as one self-contained `[db]` commit that can be cherry-picked to the v2.16 branch. Build the vocabulary, the route allowlist and the two mappers second, as pure modules with no I/O. Send the pageview once per view at the first of client navigation or `visibilitychange` to hidden, with `pagehide` as a fallback, and ask the operator to confirm that this replaces "on `pagehide`" in reading 1.

## Findings that correct the planning record

Each is evidence, not a ruling. The operator or the orchestrator decides what to do with it.

| # | Statement in the record | What the tree shows | Consequence |
|---|-------------------------|---------------------|-------------|
| C1 | Discussion points 181-3: "v2.16 has made no schema change since the branch point (`git diff --stat d228b52bc..feat/entity-signup-multi-grant -- apps/supabase` is empty)". Repeated in 181-CONTEXT `<code_context>`. | False at `e375152a4`. The same command now lists changes in `schema/000-enums.sql`, `011-validation-functions.sql`, `101-elections.sql`, `104-nominations.sql`, `301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`, `503-entity-rpcs.sql`, the regenerated `00001_initial_schema.sql` (921 lines changed) and nine pgTAP files. `git log d228b52bc..feat/entity-signup-multi-grant -- apps/supabase` shows commits of plans 177-17 and 177-21. `[OBSERVED: git diff --stat, git log]` | The regenerated migration of D-13 on this branch will conflict textually with v2.16's regenerated copy. Resolve at merge by keeping both `schema/` edits and running `yarn schema:regenerate`, never by hand-merging `00001`. |
| C2 | CONTEXT D-13: a schema change in `schema/` and the single migration. Nothing says another stream edits the same function. | v2.16's written plan `178-04-PLAN.md` lists `apps/supabase/supabase/schema/106-app-settings.sql` and `tests/database/38-contestant-app-public-config.test.sql` in `files_modified`. Its context (J5) says: "`answersLocked` becomes one more member of `contestant_app_public_config`". Plan 178-18 modifies `supabaseDataProvider.ts` and its test. `[OBSERVED: ../voting-advice-application-gsd/.planning/phases/178-sign-in-email-code-registration/]` | Both streams edit one function body, one pgTAP file and one provider helper. By 181 D-04, phase 178 appends after the freeze. Its appended migration is a `CREATE OR REPLACE FUNCTION` of the whole body. If it is written from a copy without D-13, it silently removes the `analytics` member. The v2.16 session must be told. |
| C3 | CONTEXT D-12 (reading 4): "The acceptance page is in files the v2.16 stream is changing". | Not so far. `git diff --stat d228b52bc feat/entity-signup-multi-grant` lists no file under `lib/contestant/components/termsOfUse/` or `lib/contestant/gates/`. Planned v2.16 work: 178-14 adds `SetPasswordGate.svelte` beside the gate and edits `gates.ts`, `gateViews.ts`, `gates.test.ts`. It reads `TermsOfUseGate.svelte` as a model and does not list it as modified. Phase 179's context plans to delete the `preregister/` tree, which removes one caller of `TermsOfUseForm`. `[OBSERVED]` | The collision is smaller than assumed. A new component file plus a few lines in `TermsOfUseGate.svelte` and `TermsOfUse.svelte` meets no planned v2.16 edit. |
| C4 | CONTEXT `<code_context>`: "about 30 call sites in 13 files, folded into one compound `pageview`". | 30 call sites in 14 files, not counting the root layout. Two of the 30 are not folded: `maintenance_shown` and `video` go through `track()` and are sent at once. `[OBSERVED: grep of startEvent/track call sites, each file then read]` | The vocabulary plan covers 14 files. `track()` needs a ruling in the plan: keep "send now" or buffer like `startEvent`. |
| C5 | CONTEXT D-08: free text is in `feedback_sent` and `filters_active`. | Five carriers. Also `feedback_error` (same `{ rating, description }` payload), and `questionExtendedInfo_collapseSection` / `_expandSection`, which send `{ title }`, a localised section title. `video` sends `src`, a media URL, and two unbounded comma-joined strings (`jump`, `toggleTranscript`). `[OBSERVED: Feedback.svelte, questions/+layout.svelte, Video.type.ts]` | The schema must replace or bound all of these, not two. |
| C6 | D-11: "one batch per existing flush point". Reading 1: "on `pagehide` for the last page". | The existing flush points are `onNavigate`, `onDestroy` and `visibilitychange` to hidden. There is no `pagehide` listener. `[VERIFIED: apps/frontend/src/routes/+layout.svelte:152-185]` "`if (document.visibilityState === 'hidden') submitAllEvents();`" | D-11 and reading 1 name different events for the last page. See § 2 for which is workable and at what cost. |
| C7 | 182-RESEARCH inputs (STACK.md): `navigator.sendBeacon` for the flush on page hide; ARCHITECTURE.md: route `/api/analytics`, a `visitorHash`, consent components deleted. | All three are overruled by D-07, D-11 and RELAY-11. Stated here so no plan copies the sketch. | None beyond not copying it. |

A further observation that is not a correction: today's compound `pageview` sends `href` and `from` as full URLs, query string included. `[VERIFIED: trackingService.svelte.ts:112-119, 145-147]` "`this.track('pageview', { href, from, start, duration, ...events });`". The app reads `registrationKey`, `email`, `token`, `token_hash` and `code` from query strings. `[OBSERVED: grep searchParams.get]` Umami's own script is mounted with `data-auto-track="true"` on the provider setting alone and reports page URLs by itself. Whether it includes the query string by default is `[ASSUMED]`. Either way, the new pageview carries no URL, so this ends with the phase.

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|------------|--------------|----------------|-----------|
| Event production (names, payloads) | Browser | — | Call sites stay where they are (D-08). |
| Consent state and prompt | Browser | — | The choice is device state in `localStorage`; no server stores it. |
| Visit id (`memory` mode) | Browser (module variable) | Frontend server validates its shape | RELAY-16. The relay never trusts a caller-chosen id beyond its format. |
| Random per-event ids | Frontend server | — | D-06: "The relay mints every random id." |
| Vocabulary and size enforcement | Frontend server | Browser (same schema, for early drop) | The endpoint is public. Only the server check counts. |
| Pageview record (time, app, record building) | Frontend server | Browser supplies route id, parameters, locale, duration | D-01. |
| Provider selection and forwarding | Frontend server | — | Private environment, read at run time (D-10). |
| Mode projection to the three apps | Frontend server (root server load) | Browser reads `page.data` | D-10. |
| `trackEvents` | Database (`app_settings.settings`) | Browser reads it through the data provider | D-11b. The relay does not read it (D-11). |
| Closed-project read of `analytics.trackEvents` | Database (`contestant_app_public_config`) | Browser adapter copies the member | D-13. |
| Terms acceptance | Database (`terms_of_use_acceptances`) | Browser writes the consent choice to `localStorage` at the same moment | D-12. Two stores with different scopes; see § 6. |

## Standard Stack

No package is installed in this phase.

### Core (already in the tree)

| Library | Version in `yarn.lock` | Purpose | Evidence |
|---------|------------------------|---------|----------|
| `zod` | 4.6.5 (range `^4.3.6`) | The closed vocabulary; `z.strictObject` is the house pattern | `[OBSERVED: yarn.lock]` "`"zod@npm:^4.3.6": version: 4.6.5`"; `[VERIFIED: storedSettings.schema.ts:68]` "`export const StoredSettingsSchema = z.strictObject({`" |
| `@sveltejs/kit` | 2.70.3 | `+server.ts` route, `$env/dynamic/private`, `afterNavigate` / `onNavigate`, `init` hook (`@since 2.10.0`) | `[OBSERVED: yarn.lock; node_modules/@sveltejs/kit/types/index.d.ts]` |
| `@sveltejs/adapter-node` | 5.5.7 | `BODY_SIZE_LIMIT` default `512K`; emits `sveltekit:shutdown` | `[OBSERVED: adapter-node/files/handler.js]` "`parse_as_bytes(env('BODY_SIZE_LIMIT', '512K'))`"; `[OBSERVED: files/index.js]` "`process.emit('sveltekit:shutdown', reason);`" |
| `@playwright/test` | 1.63.0 | Request capture; `storageState({ indexedDB: true })` | `[OBSERVED: playwright-core/types/types.d.ts]` "`indexedDB?: boolean;`" |
| Node built-in `fetch`, `crypto.randomUUID` | Node 24 | PostHog forward; random ids | `[ASSUMED]` that Node 24 exposes both as globals; standard since Node 18/19. |

Dependency sources were read from `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/node_modules`. The four versions above match this worktree's `yarn.lock`.

### Alternatives Considered

| Instead of | Could use | Why not |
|------------|-----------|---------|
| Plain `fetch` to PostHog | `posthog-node` | Ruled out by the milestone research and D-09's "no dependency" direction: its queue is state to flush at every scale-in, and it publishes more often than the repository's seven-day age gate allows. `[CITED: research/STACK.md]` |
| An OpenTelemetry SDK | Hand-written mapper | D-09: no OpenTelemetry dependency. |
| A UUIDv7 package | A 15-line local helper | One function; a package for it is not justified. |

## Package Legitimacy Audit

Not applicable. This phase installs no external package. If a plan proposes one, it must run `gsd-tools query package-legitimacy check` first and add a `checkpoint:human-verify`.

## Architecture Patterns

### System Architecture Diagram

```
 call sites (14 files)          root layout                      browser module state
 startEvent / track ─────────►  TrackingService  ◄────────────── visit id (UUIDv7, memory only)
                                   │  buffer of discrete events
 afterNavigate ─► view start       │  current view {route, params, start, visibleMs, sent?}
                                   │
 flush points: onNavigate, visibilitychange→hidden, pagehide (fallback)
                                   │
            gate (browser)         ▼
   projection.active && !GPC ──► pageview goes
   + trackEvents && (free || consent granted) ──► other events go
                                   │
                                   ▼  fetch POST /api/usage  keepalive, JSON, credentials:'omit'
 ┌──────────────────────────────── frontend server (adapter-node) ───────────────────────────────┐
 │ +server.ts                                                                                    │
 │   1 provider none?            → 204, nothing read                                             │
 │   2 Sec-GPC present?          → 204, nothing forwarded, nothing stored                        │
 │   3 same origin? (Sec-Fetch-Site, then Origin) no → 403                                       │
 │   4 content type JSON, body ≤ cap? no → 415 / 413                                             │
 │   5 parse envelope; validate each event against the closed union; drop what fails             │
 │   6 build AnalyticsEvent: stamp time, derive app from route id, mint random ids,              │
 │     strip ids the mode forbids                                                                │
 │   7 enqueue (bounded, drop when full)  → 204 at once                                          │
 │                                                                                               │
 │ queue ──► provider.capture(batch)        (after the response; never awaited by the route)     │
 │            ├─ none     : no-op                                                                │
 │            ├─ log      : toLogRecord(event) → one JSON line on stdout                         │
 │            └─ posthog  : toPostHog(event)  → fetch POST {host}/batch/   (fails open)          │
 │ sveltekit:shutdown ──► flush the queue once                                                   │
 └───────────────────────────────────────────────────────────────────────────────────────────────┘
 root +layout.server.ts ──► { analytics: { active, consentMode, visitIdMode } } ──► +layout.ts forwards it
```

### Recommended Project Structure

```
apps/frontend/src/
├── lib/analytics/                    # universal: imported by browser and server
│   ├── analyticsEvent.type.ts        # AnalyticsEvent, AnalyticsApp
│   ├── events.schema.ts              # the closed zod union, the `sensitive` set, caps
│   ├── pageviewRoutes.ts             # route id → allowed parameter names and validators
│   ├── batch.schema.ts               # the wire envelope
│   ├── appOfRoute.ts                 # route id → 'voter' | 'contestant' | 'admin'
│   └── mappers/
│       ├── toLogRecord.ts            # → @openvaa/app-shared LogRecord
│       └── toOtelLogRecord.ts        # → OpenTelemetry log record fields
├── lib/server/analytics/             # server only
│   ├── config.ts                     # resolveAnalyticsConfig(env) — pure
│   ├── relay.ts                      # steps 1 to 7 as a pure function over (request parts, config)
│   ├── queue.ts                      # bounded queue, timer, shutdown flush
│   └── providers/{none,log,posthog}.ts
├── lib/contexts/app/tracking/        # existing; the service is rewritten, the API kept
│   ├── trackingService.svelte.ts
│   ├── relayTransport.ts             # the one fetch call
│   └── visitId.ts                    # module variable, UUIDv7 helper
└── routes/api/usage/+server.ts       # thin: calls relay.ts
```

`relay.ts` as a pure function is what makes the privacy unit tests possible without a server.

### Pattern 1: The closed vocabulary

**What:** one `z.discriminatedUnion('name', [...])` of `z.strictObject` members, plus a `Set` of sensitive names beside it. The relay parses each event separately, so one bad event does not take the batch down.

**Skeleton** (names and payloads are from § 1; the two new fixed names are a recommendation):

```ts
// Source: this repository's schema style — storedSettings.schema.ts uses z.strictObject at every level.
const Id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);          // covers a uuid and FIRST_QUESTION_ID '__first__'
const EntityTypeSchema = z.enum(['candidate', 'faction', 'organization', 'alliance']);

export const EventSchema = z.discriminatedUnion('name', [
  z.strictObject({ name: z.literal('answer'), ago: Ago, id: VisitId.optional(),
    attributes: z.strictObject({ questionId: Id, value: z.union([z.number(), z.boolean(), z.string().max(256)]) }) }),
  z.strictObject({ name: z.literal('results_ranked_entity'), ago: Ago, id: VisitId.optional(),
    attributes: z.strictObject({ entityType: EntityTypeSchema, entityId: Id, score: z.number() }) }),
  // … one member per name in § 1
]);

export const SENSITIVE: ReadonlySet<EventName> = new Set([
  'answer', 'answer_delete', 'question_skip',
  'results_ranked_entity', 'results_browse_entity', 'filters_active'
]);
```

The four `EntityType` values are verbatim: `[VERIFIED: packages/data/src/objects/entities/base/entityTypes.ts:4-21]` "`Candidate: 'candidate'`", "`Faction: 'faction'`", "`Organization: 'organization'`", "`Alliance: 'alliance'`". `'__first__'` is `[OBSERVED: lib/routes/route.ts]` "`export const FIRST_QUESTION_ID = '__first__';`".

`ago` is the event's age in milliseconds at send time. The relay computes `time = receivedAt - ago`. This keeps per-event times without trusting the visitor's clock. It is a recommendation; the milestone research asked only for "an explicit client-side timestamp".

**Relay-side rules that do not depend on the browser** (so a changed client cannot widen them):

| Mode | Rule applied by the relay |
|------|---------------------------|
| any | `pageview` never keeps an id. |
| `visitIdMode: none` | Every `id` is removed; each event gets a fresh random id at the provider mapper. |
| `consentMode: free` | `id` is removed from every event in `SENSITIVE`. |
| any | An `id` that is not a UUIDv7, or whose timestamp is more than 24 h from now, is removed. |

### Pattern 2: Provider interface, chosen once from private environment

```ts
// lib/server/analytics/config.ts — pure, so the unit test needs no $env stub
export type AnalyticsConfig = {
  provider: 'none' | 'log' | 'posthog';
  consentMode: 'gated' | 'free';
  visitIdMode: 'memory' | 'none';
  posthog?: { host: string; key: string };
};
export function resolveAnalyticsConfig(env: Record<string, string | undefined>):
  { config: AnalyticsConfig; problems: Array<string> } { /* … */ }
```

Recommended variable names (Claude's discretion): `ANALYTICS_PROVIDER` (`none` when unset), `ANALYTICS_CONSENT_MODE` (`gated` when unset), `ANALYTICS_VISIT_ID_MODE` (`memory` when unset), `ANALYTICS_POSTHOG_KEY`, `ANALYTICS_POSTHOG_HOST` (`https://eu.i.posthog.com` when unset). None carries `PUBLIC_`, so `assert:env-pair-registry` has no pair to register.

A value outside the vocabulary, and `posthog` with no key, are `problems`. In a production start they fail the `init` check of phase 181. Outside it the config resolves to `none` and one `error` record is logged, so a bad value sends nothing.

The pattern follows `resolveLogLevel`, which is pure and returns a problem beside the value. `[VERIFIED: apps/frontend/src/lib/utils/logLevel.ts:36-40]` "`export function resolveLogLevel(raw: string | undefined, dev: boolean, publicDebug: boolean): ResolvedLogLevel {`"

### Pattern 3: The browser's gates

| Decision | Condition |
|----------|-----------|
| Relay usable | `projection.active && navigator.globalPrivacyControl !== true` |
| Send the pageview | relay usable |
| Send other events | relay usable, and `trackEvents`, and (`consentMode === 'free'` or consent is `'granted'`) |
| Show the voter prompt | relay usable, `trackEvents`, `consentMode === 'gated'`, voter app accessible, consent absent or `'indetermined'` |
| Attach the visit id to an event | `visitIdMode === 'memory'`, and (`consentMode === 'gated'`, or the event is not in `SENSITIVE`) |
| Fill `{sessionId}` in the survey link | `visitIdMode === 'memory'` and "send other events" is true |

The consent values are verbatim: `[VERIFIED: apps/frontend/src/lib/contexts/app/userPreferences.type.ts:25]` "`export type ConsentStatus = 'denied' | 'granted' | 'indetermined';`".

### Pattern 4: One pageview per view, sent once

State held for the current view: route id, allowed parameters, start, accumulated visible milliseconds, and a `sent` flag.

- `afterNavigate` starts a view. Its first call has `type: 'enter'` and `from: null`. `[OBSERVED: kit/src/runtime/client/client.js]` "`type: 'enter',`"
- The view is sent at the first of: the next client navigation (`onNavigate`), `visibilitychange` to hidden, or `pagehide` when no hidden event came first.
- After a send the flag is set. A later navigation away from the same view sends nothing for it.
- `pageshow` with `persisted` starts a new view, because the page came back from the back/forward cache.

See § 2 for why this differs from the letter of reading 1.

### Anti-Patterns to Avoid

- **Awaiting the provider in the route.** The route returns 204 before `capture` resolves.
- **Copying inbound headers to the onward request.** Build the onward request from nothing. § 8 lists what must never cross.
- **Reading `event.getClientAddress()` anywhere under `lib/server/analytics/` or the route.** RELAY-06 and RELAY-07. Phase 181's diagnostics response reads it elsewhere; keep the guard scoped to the analytics directories.
- **Logging a rejected payload.** The schema-failure record names the event name position and the zod path, never the value. The repository's rule for parse failures is the same: "naming the column and the row and never the value". `[OBSERVED: parseJsonbColumn.ts]`
- **Deriving the app from `appType` at send time.** Derive it from the route id of the view, with one function shared by browser and relay.
- **Hand-merging `00001_initial_schema.sql`.** Regenerate it.
- **A count or a line number in a plan anchor.** Derive populations at run time (the route walk, the catalogue key count).

## The twelve questions

### 1. Inventory of today's tracking

**Service.** `TrackingServiceImpl` in `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts`.

| Element | Today | Evidence |
|---------|-------|----------|
| Session id | Written to `sessionStorage` at construction for every visitor | `[VERIFIED: trackingService.svelte.ts:61]` "`readonly sessionId = sessionStorageState('appContext-sessionId', getUUID());`". The persisted-state constructor writes the default when nothing is stored: `[OBSERVED: persistedState.svelte.ts]` "`if (stored === null) saveItemToStorage(type, key, defaultValue);`" |
| Gate | Browser, `trackEvents`, consent | `[VERIFIED: :84-88]` "`browser && this.#appSettings.current.analytics.trackEvents && this.#userPreferences.current.dataCollection?.consent === 'granted'`" |
| Buffer | An array of `{ name, data }`; folded into one `pageview` with keys `NN__name`, at most 45 | `[VERIFIED: :136-144]` "`if (i >= 50 - 5) {`", "``events[`${i < 10 ? '0' : ''}${i}__${name}`] = data;``" |
| Id stamping | On every sent event | `[VERIFIED: :156]` "`const dataToSend = purgeNullish({ vaaSessionId: this.sessionId.current, ...data });`" |
| Debug log | Logs name and payload | `[VERIFIED: :157]` "`log.debug('Tracking event dispatched', { name, data: dataToSend });`" |
| Flush then reset | `submitAllEvents` always ends with `resetAllEvents`, which also drops the pageview start | `[VERIFIED: :149, :161-164]` |
| Survey link | `{sessionId}` replaced from the same handle, whatever the consent state | `[OBSERVED: survey.svelte.ts]` "`linkTemplate.replace(/\{\s*sessionId\s*\}/g, this.#sessionId.current ?? '')`"; `[VERIFIED: appContext.svelte.ts:233]` "`this.#survey = surveyLink({ appSettings: appSettingsHandle, sessionId: this.#tracking.sessionId });`" |
| Consent store | `localStorage` key `appContext-userPreferences`, member `dataCollection: { consent, date }` | `[VERIFIED: appContext.svelte.ts:87, 342-350]` "`#userPreferences = localStorageState('appContext-userPreferences', {} as UserPreferences);`" |
| Umami mount | On `analytics.platform` alone; no `trackEvents` or consent check | `[VERIFIED: routes/+layout.svelte:232-238]` "`{#if appSettings.analytics?.platform?.name === 'umami'}`"; `[OBSERVED: UmamiAnalytics.svelte]` "`<script defer src={scriptSrc} data-website-id={websiteId} data-auto-track="true"></script>`", default `scriptSrc = 'https://cloud.umami.is/script.js'` |
| Flush points | `onNavigate`, `onDestroy`, `visibilitychange` to hidden (the last only when `analytics.platform` is set) | `[VERIFIED: routes/+layout.svelte:152-185]` |
| View start | `afterNavigate` with full URLs | `[VERIFIED: :169-170]` "`startPageview(to?.url?.href ?? '', from?.url?.href);`" |
| Producer surface lock | A unit test pins the producer's eight own-enumerable members | `[OBSERVED: trackingService.svelte.test.ts]` "`exposes EXACTLY eight own-enumerable members, of which appContext forwards six`". Removing `sessionId` and `sendTrackingEvent` changes this test and `appContext.spread.svelte.test.ts`. |

The file comment "The storage key is load-bearing: renaming it would orphan every browser's stored id" is the property the phase removes on purpose.

**Events.** The union has 30 members. `[VERIFIED: trackingEvent.type.ts:13-43]` All payload fields below were read at the call site.

| # | Name today | Call site (under `apps/frontend/src/`) | Payload today | Sensitive (D-06) | What changes |
|---|-----------|------------------------------------------|---------------|------------------|--------------|
| 1 | `pageview` | `lib/contexts/app/tracking/trackingService.svelte.ts` (`submitAllEvents`), driven by `routes/+layout.svelte` | `href`, `from`, `start`, `duration`, `vaaSessionId`, plus every buffered event as `NN__name` | no, and never an id | Becomes the relay-built record of D-01: route id, allowed parameters, locale, duration. Consent-independent. Unfolded. |
| 2 | `answer` | `lib/contexts/voter/answerState.svelte.ts` | `questionId`, `value` (number, boolean, or `` `${value}` ``) | **yes** | Payload kept, bounded. `value` is a choice id, a boolean, a number, or a comma-joined list of choice ids; it is not visitor-typed text. `[OBSERVED: OpinionQuestionInput.svelte]` handles single choice, boolean, multiple choice and number questions. |
| 3 | `answer_delete` | same | `questionId` | **yes** | Kept. |
| 4 | `answer_resetAll` | same | none | no | Kept. |
| 5 | `dataConsent_granted` | `lib/contexts/app/appContext.svelte.ts` (`setDataConsent`) | none | no | Kept. Order matters: clear the buffer, then start this event (D-05). |
| 6 | `entityCard_expandSubcards` | `lib/dynamic-components/entityCard/EntityCard.svelte` | `length` | no | Kept, bounded integer. |
| 7 | `entityDetails_changeTab` | `lib/dynamic-components/entityDetails/EntityDetails.svelte` | `section` (a content tab id) | no (it names no entity) | Kept; `section` becomes an enum or a bounded id. |
| 8 | `feedback_error` | `lib/dynamic-components/feedback/Feedback.svelte` | `rating`, `description` | no | **`description` is the visitor's typed text. Remove it.** Keep `rating`. |
| 9 | `feedback_sent` | same | `rating`, `description` | no | Same. |
| 10 | `filters_active` | `lib/dynamic-components/entityList/EntityListControls.svelte`, `EntityListWithControls.svelte` | `activeFilters`: filter names joined with commas | **yes** | The names are localised question texts. `[OBSERVED: contexts/voter/filters/buildQuestionFilter.ts]` "`name: question.text`". Replace with `count`. |
| 11 | `filters_reset` | same two files | none | no | Kept. |
| 12 | `maintenance_shown` | `lib/layouts/main/MaintenancePage.svelte` | none; sent with `track()` at component init | no | Kept. |
| 13 | `menu_open` | `lib/layouts/main/Layout.svelte` | none | no | Kept. Produced in all three apps. |
| 14 | `question_next` | `routes/(voters)/(located)/questions/+layout.svelte` | `questionIndex` | no | Kept. |
| 15 | `question_previous` | same | `questionIndex` | no | Kept. |
| 16 | `question_skip` | same | `questionIndex` | **yes** | Kept. |
| 17 | `question_startFrom` | same | `questionId` | no | Kept. |
| 18 | `questionInfo_collapse` | same | none | no | Kept. |
| 19 | `questionInfo_expand` | same | none | no | Kept. |
| 20 | `questionExtendedInfo_collapseSection` | same | `title` | no | **`title` is localised content text. Replace with a section index.** `QuestionExtendedInfo.svelte` must pass the index. |
| 21 | `questionExtendedInfo_expandSection` | same | `title` | no | Same. |
| 22 | `questionExtendedInfo_open` | same | none | no | Kept. |
| 23 | `` `results_browse_${EntityType}` `` | `routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte` | `id` (entity id) | **yes** (an entity view) | Fixed name plus `entityType`, `entityId`. Recommended name: `results_browse_entity`. |
| 24 | `results_browse` | `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | `election`, `entityType`, `numAnswers` | no | Kept. |
| 25 | `results_changeElection` | same | `election` | no | Kept. |
| 26 | `results_changeTab` | `routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte` | `section` (an entity type) | no | Kept. |
| 27 | `` `results_ranked_${EntityType}` `` | same file as 23 | `id`, `score` | **yes** | Fixed name plus `entityType`, `entityId`, `score`. Recommended name: `results_ranked_entity`. |
| 28 | `results_ranked` | same file as 24 | `election`, `entityType`, `numAnswers` | no | Kept. |
| 29 | `survey_opened` | `lib/dynamic-components/survey/SurveyButton.svelte` | none | no | Kept. |
| 30 | `video` | `lib/layouts/main/Layout.svelte` (`onTrack`), built in `lib/components/video/Video.svelte` | `startMuted`, `startWithTranscript`, `startWithCaptions`, `src`, `duration`, `endAt`, `endMuted`, `endWithTranscript`, `endWithCaptions`, optionally `ended`, `error`, `jump`, `toggleTranscript`; sent with `track()` from `beforeNavigate` | no | `src` loses query string and fragment (RELAY-08). `jump` and `toggleTranscript` get a pattern and a length cap. |

Two names already exist without the template suffix (`results_browse`, `results_ranked`), so the fixed names for 23 and 27 must be new. The entity id attribute is renamed from `id` to `entityId` so that it cannot be confused with the event's own `id`.

Rows 7, 10 and 20-21 are my reading of D-06 and D-08 where the decision gives a category, not a list. The planner confirms them with the operator if in doubt.

**Contestant and Admin today.** No file under `routes/contestant`, `routes/admin` or `lib/contestant` calls the service. `[OBSERVED: grep of call sites]` They produce `pageview` (root layout), `menu_open` and `video` (`$layouts/main/Layout.svelte`) and `maintenance_shown`. None of it leaves the browser unless the same browser holds a voter's grant, because neither app has a prompt.

### 2. The consent-independent pageview at page leave (D-01)

**What SvelteKit gives.** `[OBSERVED: kit 2.70.3 src/runtime/client/client.js]`

- `afterNavigate(cb)`: called once at mount with `type: 'enter'`, `from: null`, and after every client navigation with `from` and `to`. Each side holds `params`, `route: { id }` and `url`: "`route: { id: current.route?.id ?? null }`", "`params: intent?.params ?? null`".
- `onNavigate(cb)`: "runs the supplied `callback` immediately before we navigate to a new URL except during full-page navigations."
- `beforeNavigate(cb)`: also called from the `beforeunload` listener with `type: 'leave'`. The kit's own `visibilitychange` listener only persists scroll and snapshot state.
- A route with no match (the 404 page) has `route.id === null`. Such views are not counted.

**Which unload event is reliable.** MDN describes the change of `visibilityState` to hidden as the last event a page can reliably observe, and says `pagehide` is not reliably fired, especially on mobile. Chrome's Page Lifecycle guidance says `beforeunload`, `pagehide` and `unload` do not fire when a backgrounded mobile tab is killed. `[CITED: developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event; developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event; developer.chrome.com/docs/web-platform/page-lifecycle-api]` (MEDIUM: two sources agree; read through a search summary, not the pages' full text.)

**The cost of reading 1, stated plainly.** Reading 1 is workable. It is not free.

1. With the beacon at leave, a visit of one page produces its only record at unload. Under the ★ text (a beacon at `afterNavigate`) the same visit was recorded on arrival.
2. If the last-page send waits for `pagehide`, as reading 1 says, every visit that ends by switching apps on a phone and having the tab discarded loses its last page view, and a one-page visit is lost entirely. That is the common way a mobile visit ends.
3. The tree's existing last-page flush is `visibilitychange` to hidden, not `pagehide` (correction C6). D-11 says "one batch per existing flush point". So D-11 and reading 1 disagree on this one event.

**Nearest workable alternative, recommended:** one beacon per view, sent at the first of client navigation, `visibilitychange` to hidden, or `pagehide` when no hidden event came first (Pattern 4). It keeps reading 1's single beacon and "no identifier". It moves the last-page send to the reliable event. Its cost is that time spent on the page after the visitor returns to the tab is not measured, because the view was already sent.

The other alternative keeps durations whole and splits counts: send at every hide and treat the return as a new view. A visitor who switches tabs then produces two page views for one. I do not recommend it; a count is more useful than a full duration.

A third option needs a ruling and is listed under Open Questions: a random token that lives for one page view and joins a "view started" send to a "view ended" send. It would give reliable counts and best-effort durations, but D-01 says "no id".

**Duration.** Measure visible time: accumulate `performance.now()` deltas while `document.visibilityState === 'visible'`. Send integer milliseconds. The relay clamps to a maximum (recommended 6 h) and can round (recommended to 100 ms) so that the value is not a precise timing signal. The relay stamps the record with its own receive time, so the record's time is the time the page was left.

**What is lost, in total.** Views ended by a crash or a kill with no hidden event; sends blocked by a content blocker or a failing network; views on an unmatched route; everything under `Sec-GPC`; time after a return to the tab. Counts are a lower bound, as D-11 already says.

**`fetch` with `keepalive`.**

| Fact | Source |
|------|--------|
| `keepalive: true` lets the request outlive the page; MDN names end-of-session analytics as the use. | `[CITED: developer.mozilla.org/en-US/docs/Web/API/RequestInit]` |
| The body limit is 64 KiB, and it is shared: the Fetch standard sums the body lengths of all unfinished keepalive requests of the same fetch group and returns a network error above 64 KiB. | `[CITED: fetch.spec.whatwg.org § 4.6 step 10]` "If the sum of contentLength and inflightKeepaliveBytes is greater than 64 kibibytes, then return a network error." |
| Support: Chrome 66, Edge 15, Safari 13, **Firefox 133**. | `[CITED: github.com/mdn/browser-compat-data api/Request.json]` (LOW: one fetch) |
| `credentials: 'omit'` sends no cookies and ignores `Set-Cookie`. The default is `same-origin`, which would send the Supabase auth cookies of a signed-in contestant. | `[CITED: MDN RequestInit]` |
| A JSON `POST` is outside SvelteKit's built-in cross-site check, which covers form content types only. | `[OBSERVED: kit/src/utils/http.js]` "`'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain',`" |

Consequences for the plan: cap the batch well under 64 KiB (recommended: at most 50 events and 16 KiB, with the relay's own cap at 32 KiB); a Firefox older than 133 ignores `keepalive`, so its unload send is likely aborted `[ASSUMED]`; the relay must do its own origin check, as D-11 says.

**Route ids and parameters.** The page routes below are every directory under `apps/frontend/src/routes` that holds a `+page.svelte` or `+page.server.ts`. `[OBSERVED: find apps/frontend/src/routes -type f]` The constants are verbatim: `[VERIFIED: apps/frontend/src/lib/routes/route.ts:11-35]` "`export const CONTESTANT = '/contestant';`", "`export const VOTER = '/(voters)';`", "`export const ADMIN = '/admin';`", "``export const CONTESTANT_ENTITY = `${CONTESTANT_PROT}/[entityType=servedEntityType]/[entityId=uuid]`;``".

| Route id | Parameters | Proposed allowlist | Excluded, and why |
|----------|------------|--------------------|-------------------|
| `/(voters)` and `/about`, `/constituencies`, `/elections`, `/info`, `/intro`, `/nominations`, `/privacy` below it | none | — | — |
| `/(voters)/(located)/questions` | none | — | — |
| `/(voters)/(located)/questions/[questionId]` | `questionId` | `questionId` | — |
| `/(voters)/(located)/questions/category/[categoryId]` | `categoryId` | `categoryId` | — |
| `/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]` | `electionTab`, `entityTab`, `entity`, `id` | `electionTab`, `entityTab`, `entity` | **`id`**: "entity id for the drawer" `[VERIFIED: route.ts:96]`. It identifies the entity the voter opened. |
| `/(voters)/(located)/results/statistics` | none | — | — |
| `/contestant/login`, `/forgot-password`, `/help`, `/password-reset`, `/privacy` | none | — | — |
| `/contestant/preregister`, `/preregister/(authenticated)/elections`, `/constituencies`, `/email`, `/preregister/status` | none | — | — |
| `/contestant/register`, `/contestant/register/password` | none | — | — |
| `/contestant/(protected)` | none | — | — |
| `/contestant/(protected)/[...page=contestantEntityPage]` | `page` (rest) | none | `page` can hold `questions/<any one segment>`, a free string. The route only redirects. |
| `/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]` | `entityType`, `entityId` | `entityType` | **`entityId`**: the signed-in user's own entity. For a candidate it is a personal value. |
| the same prefix with `/nominations`, `/settings`, `/(nominated)/preview`, `/(nominated)/profile`, `/(nominated)/questions` | `entityType`, `entityId` | `entityType` | `entityId` |
| the same prefix with `/(nominated)/questions/[questionId]` | `entityType`, `entityId`, `questionId` | `entityType`, `questionId` | `entityId` |
| `/admin/login`, `/admin/(protected)`, `/admin/(protected)/argument-condensation`, `/jobs`, `/question-info` | none | — | — |

Notes for the schema:

- Express the allowlist as one map from route id to parameter names, each name with a value validator: an enum for `entityTab`, `entity` and `entityType` (their matchers are closed sets), and the `Id` pattern for the rest. A parameter value comes from the address bar, so `/questions/<anything>` reaches the same route id; an unvalidated value would be visitor-chosen free text.
- Accept only route ids that are keys of the map. A unit test walks `src/routes` and fails when a page route has no key. `lib/routes/routeConsistency.test.ts` is the precedent: it walks the same tree "by a filesystem walk rather than by a hand-maintained list". A new route then cannot ship unlisted, and listing it with no names is how "sends no parameter until it is listed" is met.
- That test will go red when v2.16 merges, by design: v2.16 adds `…/nominations/(edit)/elections`, `/constituencies` and `/details`. `[OBSERVED: git diff d228b52bc feat/entity-signup-multi-grant -- apps/frontend/src/lib/routes/route.ts]`
- No path parameter carries a token. Tokens and personal values travel in query strings (`registrationKey`, `email`, `token`, `token_hash`, `code`, `redirectTo`, and the voter's `electionId` / `constituencyId`). The record has no query string, so none of them can leave.
- Derive the app from the route id: the first segment `(voters)`, `contestant` or `admin`. `AppType` has the same three values: `[VERIFIED: appContext.type.ts:117]` "`export type AppType = 'admin' | 'contestant' | 'voter' | undefined;`".
- The locale is not in the route id. Paraglide resolves it from the URL prefix (`strategy: ['url', 'cookie', 'baseLocale']`). `[OBSERVED: apps/frontend/paraglide.options.ts]` The browser sends `getLocale()` and the relay validates it against the locale list.

### 3. Where `trackEvents` is read, the root load, and the projection (D-02, D-10, D-11)

**Readers of `analytics` in application code** `[OBSERVED: repository-wide grep, each file then read]`:

| File | Reads | After the phase |
|------|-------|-----------------|
| `lib/contexts/app/tracking/trackingService.svelte.ts` | `analytics.trackEvents` (gate) | Reads the projection and consent too. |
| `routes/+layout.svelte` | `analytics.platform` (Umami mount; the `visibilitychange` effect) | Mount removed; the effect keys on the projection. |
| `routes/(voters)/+layout.svelte` | `analytics.platform && analytics.trackEvents` (push the popup) | Pattern 3, "Show the voter prompt". |
| `routes/(voters)/privacy/+page.svelte` | `analytics.platform` (analytics section), `analytics.trackEvents` (consent control), `staticSettings.analytics.platform.infoUrl` | Provider-neutral keys by consent mode. |
| `lib/dynamic-components/dataConsent/DataConsent.svelte`, `DataConsentInfoButton.svelte` | `appSettings.analytics.platform`, `staticSettings.analytics.platform.infoUrl` and `.name`, key `privacy.dataCollection.platform.${name}` | No `platform` read; provider-neutral key. |
| `routes/(voters)/(located)/+layout.svelte` | doc comment only | Comment corrected. |

**The root loads.** `routes/+layout.server.ts` returns only `{ supabaseCookies }`. `routes/+layout.ts` exists and therefore shadows it: "a present one hands on only what it explicitly returns". `[OBSERVED: routes/+layout.ts]` It returns `supabaseClient`, `appCustomizationData`, `appSettingsData`, `electionData`, `constituencyData`.

So the projection needs two edits: add `analytics: { active, consentMode, visitIdMode }` to the server load's return, and forward it in `+layout.ts`. All three apps read it from `page.data`, because the root layout is their common ancestor. The root server load reads no URL, so it runs once per document; a client navigation does not rerun it. One document therefore sees one mode.

`assert:no-session-in-loads` checks server loads for a returned session. A plain projection object does not trip it. `[OBSERVED: routes/+layout.server.ts comment]`

**Private environment at run time.** `lib/server/constants.ts` already reads `$env/dynamic/private`: `[OBSERVED]` "`import { env } from '$env/dynamic/private';`". With adapter-node this is the process environment at start. A provider change is a restart, not a rebuild. In development `kit.env.dir` points at the repository root's `.env`, and a shell variable overrides the file. `[OBSERVED: apps/frontend/svelte.config.js comment]` "SvelteKit's `loadEnv` lets any `process.env` entry override the file".

**The start-up check.** `hooks.server.ts` has no `init` export in this tree. `[VERIFIED: apps/frontend/src/hooks.server.ts:112-117]` Phase 181 builds it (181 D-13). This phase should deliver `resolveAnalyticsConfig` with its `problems` list and a unit test, and add one call inside `init` when 181's plan has landed. Whichever lands second writes the call. `hooks.server.ts` is also in v2.16's plan 178-16.

### 4. Settings (D-11b)

| Item | Where | Evidence |
|------|-------|----------|
| Static type | `packages/app-shared/src/settings/staticSettings.type.ts`, member `analytics` | `[VERIFIED: :99-121]` "`readonly name: 'umami';`", "`readonly code: string;`", "`readonly infoUrl: string;`", "`readonly trackEvents: boolean;`" |
| Static value | `staticSettings.ts` | `[OBSERVED]` "`analytics: { trackEvents: false }`" |
| Dynamic type and shipped defaults | `dynamicSettings.type.ts`, `dynamicSettings.ts` | No `analytics` member today. `[OBSERVED: grep]` |
| Strict stored schema | `packages/app-shared/src/data/schemas/storedSettings.schema.ts` | `[VERIFIED: :183-195]` "`analytics: z.strictObject({ platform: z.strictObject({ name: z.string().optional(), code: z.string().optional(), infoUrl: z.string().optional() }).optional(), trackEvents: z.boolean().optional() }).optional()`" (line breaks removed) |
| Its tests | `storedSettings.schema.test.ts` | Four cases name `platform`: "accepts a full `analytics.platform` object", "accepts an `analytics.platform` with no `infoUrl`", "LEVEL 3: rejects an unknown key inside `analytics.platform`", and the header comment's list of nesting levels. `[OBSERVED]` |
| Merge | `lib/utils/settings.ts` (`mergeAppSettings`) | Deep merge of static, shipped dynamic, stored. `AppSettings = StaticSettings & DynamicSettings`. `[OBSERVED]` |
| Seed base | `packages/dev-seed/src/templates/e2e/perm/shared.ts`, `MINIMAL_BASE_APP_SETTINGS` | `[OBSERVED]` "`analytics: { trackEvents: false },`". 25 files under `packages/dev-seed/src` name the constant. This shape stays valid; no template that uses it needs an edit. |
| The one template with `platform` | `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` | `[OBSERVED]` "`name: 'umami',`", "`code: 'e2e-dummy-code',`", "`trackEvents: true`". v2.16 changed one other line of this file (`election_type`). |
| Type params and tests that name the link | `lib/i18n/types.ts` (`analyticsLink: string`), `lib/i18n/tests/translations.test.ts` ("analyticsLink preserved in privacy.json as simple variable") | That test fails when `{analyticsLink}` leaves `privacy.json`. It must be changed with the strings. `[OBSERVED]` |
| Docs that describe the old setting | `apps/docs/src/routes/(content)/developers-guide/configuration/static-settings/+page.md`, `…/configuration/intro/+page.md`, `…/configuration/app-settings/+page.md`, `about/features/+page.md`, `publishers-guide/preparing/what-data-should-be-collected/+page.md` | `[OBSERVED]` e.g. "`analytics`: an optional analytics platform (Umami is the one supported)". The full analytics documentation is phase 189; these five sentences become false in this phase. |

**What the move touches.** Remove `analytics` from `StaticSettings` and `staticSettings.ts`. Add `analytics: { trackEvents: boolean }` to `DynamicSettings` with a shipped default of `false`. Reduce the schema member to `z.strictObject({ trackEvents: z.boolean().optional() }).optional()`. Rewrite the four schema tests. Edit `perm-analytics-tracking.ts`. Every reader keeps reading `appSettings.analytics.trackEvents`, because `AppSettings` is the intersection.

**The stored row with `platform`.** `_getAppSettings` validates with `parseWithPartialPreserve`: "the members the schema accepts survive a malformed sibling". `[VERIFIED: supabaseDataProvider.ts:102, 150-158]` The issue path starts at `analytics`, so the whole `analytics` member is dropped, one `error` record is emitted, and `trackEvents` reads its shipped default, `false`. This matches D-11b and fails safe. It happens on every read, on the server and in the browser. Nothing is deployed, so no row needs migrating; the seed template is the only writer.

### 5. Why a signed-out reader of a closed project gets no `analytics` (D-13)

**The chain.**

1. The anon policy on the table: `[VERIFIED: apps/supabase/supabase/schema/302-rls.sql:1317-1325]` "`CREATE POLICY "anon_select_app_settings" ON public.app_settings FOR SELECT TO anon USING ( ( SELECT project_open_for_voters (project_id) ) );`" (line breaks removed). A closed project returns no row.
2. The provider's zero-row branch calls `project_open_for_voters`, and on `false` calls `contestant_app_public_config`. `[VERIFIED: supabaseDataProvider.ts:111-121]`
3. The function returns three values only: `[VERIFIED: apps/supabase/supabase/schema/106-app-settings.sql:34-41]` "`'access', jsonb_build_object('contestantApp', v.settings #> '{access,contestantApp}')`", "`'entityTypes', v.settings #> '{contestantApp,entityTypes}'`", "`'registrationModes', v.settings #> '{contestantApp,registrationModes}'`".
4. The provider copies only those three: `[VERIFIED: supabaseDataProvider.ts:57-59]` "Only `access.contestantApp`, `contestantApp.entityTypes` and `contestantApp.registrationModes` are copied, whatever else the answer carries." It then returns only the `access` and `contestantApp` roots. `[VERIFIED: :136-145]`

The same branch serves a signed-in user with no grant in the project, so the fix covers that caller too.

**The smallest change.** Add one member to the function's answer:

```sql
'analytics', jsonb_build_object('trackEvents', v.settings #> '{analytics,trackEvents}')
```

No new function, no new grant, no policy change. The function keeps "It never returns the row".

**What moves with it.**

| File | Change |
|------|--------|
| `apps/supabase/supabase/schema/106-app-settings.sql` | The member, and the comment's "three stored values" and "exactly three values". |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` | Regenerated with `yarn schema:regenerate` (`node scripts/assert-schema-migration-parity.mjs --write`). `yarn assert:schema-migration-parity` is in `lint:check`. |
| `apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql` | It pins "the exact key set at every level": the top-level keys `ARRAY['access', 'contestantApp']`, the plan count (`plan (16)`), the fixture row, the all-null literal. A new assertion for the fourth value. `[OBSERVED]` |
| `supabaseDataProvider.ts` (`storedPublicConfig` and the closed-project return) and `supabaseDataProvider.test.ts` | Copy `analytics.trackEvents` when non-null; return an `analytics` root. |
| `.claude/skills/database/SKILL.md`, `schema-reference.md`, `rls-policy-map.md`; `apps/docs/…/configuration/app-settings/+page.md` | Each says three values. |
| `tests/tests/specs/perm/perm-closed-project.spec.ts` | Its last describe "pins the contestant app's configuration as an anonymous visitor of the closed project receives it". Check whether it asserts the exact member set. `[OBSERVED: header only]` |

Not affected: `packages/supabase-types` (the signature `{ Args: { p_project_id: string }; Returns: Json }` is unchanged, so `yarn db:types` should produce no diff); the definer census in `07-rpc-security.test.sql` (no function is added); `scripts/assert-project-scoped-queries.mjs` (the RPC is already listed).

**Two conditions.** The pgTAP file needs a running local database (`yarn workspace @openvaa/supabase test:db`). And the commit must reach the branch on which the freeze commit of phase 181 is cut; see correction C2 and Open Question 3.

### 6. Terms of use in the Contestant app (D-12)

**The files.** `[OBSERVED: each read in full]`

| File | Role |
|------|------|
| `lib/contestant/components/termsOfUse/TermsOfUse.svelte` | Renders the two dynamic texts: `dynamic.contestantAppPrivacy.registryStatement` and `…otherTermsOfUse`. Uses `getComponentContext()` for `t` only. |
| `…/termsOfUse/TermsOfUseForm.svelte` | The ingress, an `Expander` holding `<TermsOfUse />`, and the acceptance checkbox (`name="termsAccepted"`, `data-testid="terms-checkbox"`), bound to a `$bindable` prop. |
| `lib/contestant/gates/TermsOfUseGate.svelte` | The acceptance page. `handleSubmit` calls `acceptTermsOfUse()`, then `invalidateAll()`. |
| `routes/contestant/preregister/(authenticated)/email/+page.svelte` | The second caller of `TermsOfUseForm`. v2.16's phase 179 plans to delete this tree. |
| `routes/contestant/privacy/+page.svelte` | Renders `<TermsOfUse />` on a public page. |

**How acceptance is stored.** On the server, per user and project: `acceptTermsOfUse` on the contestant context calls the data writer's `_acceptTermsOfUse`; the table is in `schema/304-terms-of-use-acceptances.sql`. `[OBSERVED: contestantContext.svelte.ts, universalDataWriter.ts; the SQL file was not read]`

**How the popup stores consent.** `setDataConsent` on the app context writes `dataCollection: { consent, date }` into `localStorage['appContext-userPreferences']`. `[VERIFIED: appContext.svelte.ts:342-350]` The contestant context already forwards the same function: `[OBSERVED: contestantContext.svelte.ts]` "`readonly setDataConsent!: AppContext['setDataConsent'];`". `localStorage` is shared by every page of the origin, so the three apps read one choice.

**The smallest edit.**

1. A new component, for example `lib/contestant/components/termsOfUse/TrackingOptOut.svelte`: one checkbox with a visible label, bound to a prop.
2. In `TermsOfUseGate.svelte`: render it under `<TermsOfUseForm>` when Pattern 3's "show the prompt" conditions hold for the Contestant app (relay usable, `trackEvents`, `consentMode === 'gated'`), and after a successful `acceptTermsOfUse()` call `setDataConsent(optOut ? 'denied' : 'granted')`.
3. In `TermsOfUse.svelte`: render the new non-`dynamic` paragraph when `trackEvents` is on. It needs `getAppContext()` for `appSettings`; read it as `ctx.appSettings`, never destructured (CLAUDE.md, Context Destructuring Rule).

None of the three files is in a v2.16 `files_modified` list (correction C3). `TermsOfUseForm.svelte` is left untouched.

**Recommended form of the checkbox:** unticked by default, label meaning "Do not collect usage data about my use of the app". Ticked means opt out. It is a native checkbox inside a `<label>`, the same markup as the acceptance checkbox, so name, role and keyboard operation come from the element (WCAG 4.1.2, 2.1.1). No pre-ticked box is shown. Whether either form is valid consent is a legal question and stays open.

**Consequences of reading 4 that the plan should handle or record.** The reading is workable. These follow from two stores with different scopes:

| Case | What happens | Recommendation |
|------|--------------|----------------|
| The contestant earlier chose "denied" in the voter popup on this browser. | Acceptance would overwrite it with "granted". | Pre-tick the opt-out box when the stored choice is `'denied'`, so acceptance never flips a refusal silently. |
| The contestant accepted on another device, or before this phase shipped. | No gate is shown, so nothing grants consent here. Only the pageview is sent. | Record it. It is the safe direction. |
| The contestant wants to change the choice later. | The Contestant app has no control. The voter privacy page has one, but a closed project hides the voter app. | Add the existing `DataConsent` control to `routes/contestant/privacy/+page.svelte` when tracking is enabled. It is not a popup, and that file is in no v2.16 plan. Open Question 5. |
| Another person uses the same browser as a voter afterwards. | The voter popup does not appear, because a choice exists. | Record it in the privacy text. It is how an origin-wide choice behaves today. |
| `Sec-GPC` is set. | Nothing can be sent. | Do not show the checkbox. |

### 7. `LogRecord`, the logger, and the OpenTelemetry fields (D-09)

**`LogRecord`.** `[VERIFIED: packages/app-shared/src/logging/logger.type.ts:13-30]` "`level: 20 | 30 | 40 | 50;`", "`time: number;`" (epoch milliseconds), "`msg: string;`", "`severityText: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';`", "`err?: { type: string; message: string; stack?: string; };`", "`attributes?: Record<string, unknown>;`".

**The logger.** `log.debug|info|warn|error` in `logger.ts`. It starts at `'silent'`. Its default sink is the console with the record object: `[OBSERVED: logger.ts]` "`if (record.level >= 40) console.error(record); else console.info(record);`". That is not one JSON line per record; Node prints an inspected object. So D-09 is right twice: an `info` record is dropped at the production default, and even when emitted it is not a JSON line.

**Production default level.** `[VERIFIED: apps/frontend/src/lib/utils/logLevel.ts:37]` "`const fallback: LogLevel = dev || publicDebug ? 'debug' : 'warn';`". `.env.example` sets `PUBLIC_LOG_LEVEL=warn`.

**House rule for `msg`.** The message is a constant and varying values go in `attributes`. `[OBSERVED: parseJsonbColumn.ts]` "A CONSTANT, never an interpolation: a downstream sink keys events on a stable message and every varying value belongs in the attribute bag instead".

**The `LogRecord` mapper (recommended).** `{ level: 30, severityText: 'INFO', time: event.time, msg: event.name, attributes: { 'openvaa.app': event.app, ...(event.id ? { 'session.id': event.id } : {}), ...event.attributes } }`. The event name is one of a closed set of constants, so it satisfies the rule. The envelope keys are namespaced so they cannot collide with a payload key.

**The OpenTelemetry Logs data model.** `[CITED: opentelemetry.io/docs/specs/otel/logs/data-model/]` (LOW: one fetch; the page is marked Stable.)

| Field | Type | What the mapper fills |
|-------|------|------------------------|
| `Timestamp` | uint64 nanoseconds since the Unix epoch | `event.time` in nanoseconds. Above 2^53, so hold it as a decimal string or a `bigint`. |
| `ObservedTimestamp` | same | The relay's receive time. |
| `TraceId`, `SpanId`, `TraceFlags` | bytes, bytes, byte | Absent. |
| `SeverityText` | string | `'INFO'` |
| `SeverityNumber` | integer; INFO is 9 to 12 | `9` |
| `Body` | any value | Absent. The payload goes in `Attributes`. |
| `Resource`, `InstrumentationScope` | objects | Absent in the mapper; a sender adds them. |
| `Attributes` | attribute collection | The same namespaced map as above. |
| `EventName` | string | `event.name`. "A log record with a non-empty event name is an Event." |

The mapper returns these as a plain object. It does not produce the OTLP wire encoding; D-09 rejected OTLP as the canonical form. No provider in this phase uses the OpenTelemetry mapper. The `log` provider should use the `LogRecord` mapper, so the container's log store holds one record shape.

### 8. PostHog's HTTP capture API (RELAY-04, builds toward)

| Topic | Finding | Source and confidence |
|-------|---------|------------------------|
| EU host | `https://eu.i.posthog.com` | `[CITED: posthog.com/docs/api/capture]` MEDIUM |
| Batch endpoint | `POST /batch/`. Single event: `POST /i/v0/e/`. | Same page, and the SDK core: `[CITED: github.com/PostHog/posthog-js packages/core/src/posthog-core-stateless.ts]` "`return '/batch/'`". MEDIUM |
| Batch body | `{ api_key, batch: [ { event, properties, timestamp? } ], historical_migration?: false }`. In the docs' batch example `distinct_id` is inside `properties`. The SDK sends it at the top level of each item and adds `uuid` and a batch-level `sent_at`. | Docs and SDK source. MEDIUM. For the single-event endpoint the docs say the top level is read first and `properties.distinct_id` is the fallback; they do not say it for batch items. Phase 188 confirms which placement the live batch endpoint takes. |
| Authentication | None in a header. The project token is `api_key` in the body. | Docs. MEDIUM |
| Size | No limit on the number of events; "the entire request body must be less than 20MB by default". | Docs. LOW |
| Missing or empty `distinct_id`, or no event name | The event is not ingested, "but you still receive a `200: OK` response". Ids over 200 characters are cut. | Docs. MEDIUM (also in the milestone research) |
| An event with no identifier | PostHog has no id-less event. Send a random id: "Use a random ID such as a UUID". A fixed id would merge all visitors. | `[CITED: posthog.com/docs/data/anonymous-vs-identified-events]` MEDIUM |
| No person profile | Property `$process_person_profile: false` on every event. Backend and API events are identified by default. If the id already belongs to a person, the event "counts as an identified event". | Same page and the Node docs. MEDIUM |
| `$session_id` | A custom id "Must be a valid UUIDv7"; "The timestamp part of the UUIDv7 must be equal to or before the timestamp of the first event in the session"; plus 24 hours it must be after the last event. Events that fail "are not included in session aggregations". Server SDKs send none by default. | `[CITED: posthog.com/docs/data/sessions]` LOW (one fetch); it agrees with the milestone research. |
| GeoIP | Property `$geoip_disable: true`. The SDK sets exactly this: "`message.properties['$geoip_disable'] = true`", and its `disableGeoip` option defaults to `true`. The capture API page does not document the property. | SDK source and `[CITED: posthog.com/docs/libraries/node]`. MEDIUM |
| Client address | The capture page says nothing on `$ip`. EU organisations "Automatically default to IP data capture disabled". For a relay, the address PostHog sees is the server's. | `[CITED: posthog.com/docs/privacy/data-collection]` LOW. Phase 188 observes it. |

**Mapping to prescribe for the provider (tested against a stand-in `fetch`):** `distinct_id` is the event's visit id when present, otherwise a fresh `crypto.randomUUID()`; `$session_id` only when the visit id is present; `properties` are the event attributes plus `$process_person_profile: false`, `$geoip_disable: true` and `openvaa.app`; `timestamp` is ISO 8601 from `event.time`.

**Headers the relay must never forward.** The onward request is built from nothing, with `Content-Type: application/json` and no other header set by our code. It must not carry the inbound `User-Agent`, `X-Forwarded-For`, `Forwarded`, `X-Real-IP`, `CF-Connecting-IP`, `True-Client-IP`, `Cookie`, `Authorization`, `Referer`, `Origin`, `Accept-Language`, or any `Sec-CH-UA*` or `Sec-Fetch-*` header. The body must not carry `$ip`, `$raw_user_agent`, `$current_url` with a real URL, or `$referrer`. The unit test passes a request holding distinctive values for each of these and asserts that none appears in the stand-in's recorded arguments.

Open for phase 188, not this phase: whether the pageview should be sent as PostHog's `$pageview` with a route id in `$current_url`, and how PostHog classifies events that carry no user agent. `[ASSUMED]` that it labels them as automation, from the milestone research.

### 9. `Sec-GPC` and `navigator.globalPrivacyControl` (D-03)

| Fact | Source |
|------|--------|
| `Sec-GPC: 1` is the only value; otherwise the header is absent. It is a forbidden request header, so page script cannot set or remove it. | `[CITED: developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-GPC]` |
| `navigator.globalPrivacyControl` is a boolean that reflects the same setting. MDN marks it "Limited availability" and experimental. | `[CITED: developer.mozilla.org/en-US/docs/Web/API/Navigator/globalPrivacyControl]` |
| Support: Firefox 120 and Firefox for Android 122, both opt-in by a setting. Chrome: `false`. Safari: `false`. | `[CITED: github.com/mdn/browser-compat-data http/headers/Sec-GPC.json, api/Navigator.json]` LOW (one fetch each) |
| Brave and DuckDuckGo send the signal by default; extensions add it to Chrome. | `[ASSUMED]` |

Consequences: the signal reaches a minority of visitors. A browser without the property returns `undefined`, so test `=== true`. The relay checks the header on its own, because it is the authority; the browser check only hides the prompt and saves the request. The relay answers 204 with nothing forwarded and nothing stored, so the response does not reveal the drop. The relay cannot be tested by a page script that sets the header; Playwright sets it with `extraHTTPHeaders` on the context and sets the property with `addInitScript`.

### 10. Is `/api/usage` on a common filter list?

**How I checked.** On 2026-10-11 I downloaded five lists and ran a simplified Adblock-syntax matcher over their generic network rules (rules not limited to other domains or to third-party requests, and applying to `xmlhttprequest`, `ping` or untyped requests) against `https://vaa.example.org<path>`. I then searched the same files for the plain strings.

| List | Version read | `/api/usage` |
|------|--------------|--------------|
| EasyPrivacy | `202610112000` | no match |
| EasyList | `202610111953` | no match |
| Fanboy's Annoyance List | `202610112000` | no match |
| uBlock filters – Privacy | repository head | no match |
| AdGuard Tracking Protection | repository head, **download cut at 10.5 of 11.4 MB** | no match in the part read |

The only generic rules that contain `usage` are `/usage/Clickstream?`, `/usage/ReportEvent?`, `/cdp/usage/GetWeblabTreatment?` and `/cdp/usage/ClientsideImpression?`. None matches `/api/usage`.

The matcher did find rules for two other candidates, which shows it works: EasyPrivacy has `/api/collect|$ping,xmlhttprequest` and `/api/events|$ping,~third-party`. `/api/analytics`, `/api/track`, `/api/event`, `/api/telemetry` and `/api/metrics` had no generic match either.

**Conclusion:** keep `/api/usage`. Confidence MEDIUM: the matcher is an approximation, one list was truncated, and Brave's and other blockers' own lists were not read. Lists change daily. The docs sentence "counts are a lower bound and blocking is not worked around" stays necessary.

### 11. E2E: what exists, the project layout, the second run, the storage assertion (D-15)

**What exists.** `[OBSERVED: each file read]`

| File | What it does today |
|------|--------------------|
| `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` | Stubs `window.umami.track` with `page.addInitScript` and collects calls in `window.__trackCalls`. It does not block the request for `https://cloud.umami.is/script.js`. |
| `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` | Three serial tests: suppressed without consent; emitted after consent (asserts a `pageview` call whose keys include `dataConsent_granted`); the preferences round trip. It flushes by redefining `document.visibilityState` and dispatching `visibilitychange`. The consent button is found by name `/agree to share my data/i`. |
| `tests/tests/setup/perm/perm-analytics-tracking.setup.ts`, `.teardown.ts` | Seed and remove the dataset with prefix `e2e-perm-analytics-`. |
| `tests/playwright.config.ts`, projects `data-setup-perm-analytics-tracking`, `data-teardown-perm-analytics-tracking`, `voter-prefs-tracking` | The spec's project. It sits at the tail of the perm serial chain; its setup depends on the previous perm spec. v2.16 changed that dependency and the comment above it. |
| `tests/tests/specs/visual/visual-regression.spec.ts`, `guardThirdPartyFonts` | The precedent for a third-party-request assertion: it reads `performance.getEntriesByType('resource')`. |
| `tests/tests/specs/perf/performance-budget.spec.ts` | Counts only requests whose URL includes `/rest/v1/`. Relay requests do not affect it. |
| `tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts`, `specs/contestant/contestant-terms-gate-phone.spec.ts` | A terms-pending user and a page object for the gate. |

**Layout.** One config with about 119 named projects. The perm family is one serial chain over the shared `app_settings` row. Opt-in projects are spread in conditionally: "visual-regression (PLAYWRIGHT_VISUAL) and bank-auth (PLAYWRIGHT_BANK_AUTH) are opt-IN and are excluded from the default run". Two static guards read the config: an orphan-probe check inside it, and `scripts/assert-a11y-scan-wiring.mjs`.

**The second single-project run, without editing the wrapper.** The precedent is in CI: `[OBSERVED: .github/workflows/main.yaml]` "`PLAYWRIGHT_VISUAL=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/ci-visual --no-db-reset --no-watch --project visual-regression`". The wrapper starts the dev server in a subshell that inherits its environment: `[OBSERVED: tests/scripts/e2e-run.sh]` "`export FRONTEND_PORT PUBLIC_PROJECT_ID="$E2E_PROJECT_ID_RESOLVED"`" followed by "`yarn dev`". It unsets only `EPERM07_FORCE_BUDGET_MS`, `EPERM07_FORCE_CPU_RATE`, `EPERM07_NO_VT` and `CI`. So a prefix reaches both the dev server and Playwright:

```bash
ANALYTICS_PROVIDER=log ANALYTICS_CONSENT_MODE=free PLAYWRIGHT_ANALYTICS_CONSENT_FREE=1 \
  tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --project voter-tracking-consent-free
```

Two things the plan must settle:

- **The dependency chain.** A project that depends on `data-setup-perm-analytics-tracking` drags in the whole perm chain, and every perm spec would then run in consent-free mode. Give the opt-in project its own setup project that reuses the same setup file and depends on nothing in the perm chain. In a single-project run nothing else writes the settings row.
- **The default mode needs a provider.** With the default `none`, `active` is false and the gate suite's tracking spec would see nothing. CI builds its environment with `cp .env.example .env`. `[OBSERVED: main.yaml]` So `.env.example` should set `ANALYTICS_PROVIDER=log`, and the operator's own `.env` needs the same line (I cannot read that file). The spec must fail by name when the relay is inactive, not time out. See Open Question 4.

**The storage allowlist.** One helper, used after the voter journey, the contestant journey and the admin journey:

```ts
// cookies, localStorage and IndexedDB in one call; sessionStorage by evaluate
const state = await context.storageState({ indexedDB: true });
const session = await page.evaluate(() => Object.keys(sessionStorage));
```

The keys the application writes today, which form the allowlist `[OBSERVED: grep of storage writes, each line read]`:

| Store | Keys |
|-------|------|
| `localStorage` | `appContext-userPreferences`, `VoterContext-answerStore`, `contestantContext-isPreregistered`, keys starting `contestantContext-userData-editedAnswers-` |
| `sessionStorage` | `voterContext-firstQuestionId`, `contestantContext-preselectedElectionIds`, `contestantContext-preselectedConstituencyIds`, SvelteKit's `sveltekit:snapshot`, `sveltekit:scroll`, `sveltekit:states` |
| Cookies | `PARAGLIDE_LOCALE`, the Supabase auth cookies (names start with `SUPABASE_COOKIE_PREFIX`), and `id_token`, `oidc_state`, `oidc_nonce`, `oidc_code_verifier` `[VERIFIED: apps/frontend/src/lib/cookies/index.ts:14-19]` |
| IndexedDB | none expected `[ASSUMED]`; the first run shows whether the Supabase client creates a database |

The key the phase removes is `appContext-sessionId` in `sessionStorage`. On the unchanged tree the assertion fails on exactly that key, which is the red control D-15 asks for. The helper should also assert that the data of `appContext-userPreferences` has no member besides `dataCollection`, `feedback` and `survey`.

**"No third-party origin" needs an allowlist of two origins.** The browser talks to the app origin and to Supabase (`PUBLIC_SUPABASE_URL`, a different origin from the app's). Assert that every request's origin is one of the two, that every request of type `script` is same-origin, and that the analytics request goes to the app origin.

**Capturing a send made at unload.** Install `context.on('request')` before the navigation, filter on the relay path, then leave the page (`page.goto('about:blank')`), and read the request's `postDataJSON()`. Whether Playwright still reports the response of a keepalive request after the document is gone is `[ASSUMED]`. Plan a short probe first; if the response is not reported, the proof of arrival is a `route.fetch()` inside a `context.route` handler, which performs the request itself and returns the status.

### 12. Translation keys in the seven locales (D-14)

All seven locale directories hold the same keys. `[OBSERVED: a script printed each key for da, en, et, fi, fr, lb, sv]`

| Key (file) | English text | Becomes false? |
|------------|--------------|----------------|
| `privacy.analytics.content.umami` (`privacy.json`) | "We use the Umami service for analytics. This happens completely anonymously and does require any cookies. Further info: {analyticsLink}." | **Yes.** No Umami. The key is provider-keyed; replace with one key per consent mode. The English and Swedish texts also lack "not" ("does require", "kräver några cookies"). |
| `privacy.analytics.title` | "Analytics" | No. |
| `privacy.cookies.content` | "The application does not use cookies to store your data. Your answers and preferences are stored in your browser's local storage for a better user experience. This data can only be accessed by your device, not by the application's publisher." | **The last sentence is false** once answer events are sent with consent (D-14 names it). The first sentence is outside this phase: the app does set a locale cookie and, for contestants, session cookies. |
| `privacy.dataCollection.platform.umami` | "We use the Umami service for data collection. It does not employ cookies. Further info: {analyticsLink}." | **Yes.** Read by `DataConsent.svelte` and `DataConsentInfoButton.svelte`. |
| `common.privacy.dataCollection.content` (`common.json`) | "We would like to collected usage data anonymously for research purposes and to improve the application. The data to collect includes your answers to the questions, the time spent answering the questions and in other sections and the results viewed, but the data cannot be connected to you." | Kept by D-04. It does not mention that a page-view count is recorded without consent; the new privacy text must. |
| `common.privacy.dataCollection.title` | "Collecting Usage Data" | No. |
| `dynamic.privacy.dataConsentIntro.popup` (`dynamic.json`) | "Could we collect your data completely anonymously for research purposes and to improve the application? We do not use cookies, and the data cannot be connected to you." | Kept by D-04. It is a `dynamic` key, so a deployer can override it. |
| `dynamic.privacy.content` | "The privacy and data collection of the application is outlined below." | No. D-14: the deployer names the processor here. |
| `privacy.dataConsentInfoButton`, `privacy.dataConsentIntro.{denied,granted,indetermined}`, `privacy.dataConsentLabel.{denied,granted}` | consent control strings | No. |
| `dynamic.contestantAppPrivacy.registryStatement.content` | Holds "Cookies necessary for the functionality of the service are processed based on legitimate interest…" (found in da, en, et, fr, sv; my pattern did not find it in fi and lb) and "after the publication of the election compass ends, the data may be used for research purposes". | Not false, but silent on usage tracking. The new non-`dynamic` paragraph covers that. |
| `dynamic.contestantAppPrivacy.otherTermsOfUse.content` | empty in all seven | No. D-14 rejected using it. |

**New keys, each in seven locales:** the analytics text for consent-gated mode; the analytics text for consent-free mode; the sentence that a page-view count with no identifier is recorded in any case; the `Sec-GPC` sentence; the terms-of-use paragraph naming the voter, Contestant and Admin apps; the opt-out checkbox label.

**Mechanics.** Removing `{analyticsLink}` breaks `translations.test.ts` ("analyticsLink preserved in privacy.json as simple variable") and leaves `analyticsLink` in `lib/i18n/types.ts`. `lib/types/generated/translationKey.ts` is generated by `yarn workspace @openvaa/frontend generate:translation-key-type`; v2.16's plans 178-08 and 178-23 regenerate it too, so regenerate it at merge. `yarn assert:i18n-catalog-namespaces` checks key counts per namespace. The voter consent button is matched in the E2E spec by its English name, so the granted label must keep matching `/agree to share my data/i` or the spec changes with it.

## Don't Hand-Roll

| Problem | Do not build | Use instead | Why |
|---------|--------------|-------------|-----|
| Payload validation | `if` chains per event | `zod` discriminated union of `z.strictObject` | Unknown keys are rejected at every level; the same schema documents the catalogue. |
| Partial tolerance of a stored settings value | A new parser | `parseWithPartialPreserve` already in the provider | D-11b's behaviour comes from it unchanged. |
| The regenerated migration | A manual edit of `00001` | `yarn schema:regenerate` | The parity guard compares them byte for byte. |
| A consent store | A new key or a cookie | `setDataConsent` and `appContext-userPreferences` | One origin-wide choice; RELAY-05 allows only this state. |
| Route discovery for the allowlist test | A hand-kept list of routes | A filesystem walk, as in `routeConsistency.test.ts` | A list is one more thing to drift. |
| A second E2E wrapper | A copy of `e2e-run.sh` | An environment prefix on the existing one | D-15; the wrapper passes its environment on. |
| Hashing an address to count visitors | Anything | Nothing | Ruled out (RELAY-06). |
| A queue library or the PostHog SDK | — | An array with a cap, a timer, and one `fetch` | The relay needs nothing else, and the SDK's queue is new state to lose. |

**Key insight:** the hard parts here are definitions (what an event may contain, what identifies a visit, what a page view is). Every one of them is a few lines of schema. The code around them is small.

## Runtime State Inventory

The phase removes an integration and moves a setting, so state outside the repository matters.

| Category | Items found | Action required |
|----------|-------------|-----------------|
| Stored data | `app_settings.settings.analytics.platform` in any existing project row. Locally only the `perm-analytics-tracking` dataset writes it. Nothing is deployed (operator ruling of 2026-10-04 in project memory). | Code edit of the seed template. No data migration. A leftover local row loses its `analytics` member and logs one error per read until the database is reset or reseeded. |
| Stored data (browsers) | `sessionStorage['appContext-sessionId']` in open tabs; it ends with the tab. `localStorage['appContext-userPreferences']` holds earlier consent choices, which stay valid. | None. A grant given under the old text is kept as a grant; say so in the privacy text or accept it (Open Question 6). |
| Live service config | A Umami website and its dashboard, if a deployer has one. Not in git. | None in code. Docs: the integration is gone. |
| OS-registered state | None. Verified by reading the tree: no scheduled task or service names analytics. | None. |
| Secrets and environment | New private variables (`ANALYTICS_*`). `.env.example` is copied to `.env` in CI. The operator's local `.env` is not readable by agents. `render.example.yaml` and the root `docker-compose.dev.yml` are the other templates; phase 181 edits the same files. | Add the variables to the three templates. The operator adds `ANALYTICS_PROVIDER=log` to the local `.env` before the gate run. |
| Build artifacts | `apps/frontend/src/lib/types/generated/translationKey.ts`; `packages/supabase-types/src/database.ts` (expected unchanged); built `@openvaa/app-shared` output consumed by the frontend. | Regenerate the key type. Run `yarn db:types` and confirm no diff. Rebuild `@openvaa/app-shared` (`yarn build`) before the frontend typechecks. |

## Common Pitfalls

### Pitfall 1: The v2.16 appended migration removes D-13
**What goes wrong:** phase 178-04 of the v2.16 stream replaces `contestant_app_public_config` to add `answersLocked`. Written from the pre-D-13 body, it drops `analytics`. No test on that branch would notice.
**How to avoid:** land D-13 early as one commit; tell the v2.16 session; make the pgTAP key-set assertion name four values so the loss fails there.
**Warning signs:** `trackEvents` reads `false` on `/contestant/login` of a closed project.

### Pitfall 2: The pageview and the consented events in one request, with the same id
**What goes wrong:** the browser sends the pageview and events in one batch and a mapper gives them one `distinct_id`.
**How to avoid:** the relay strips any id from `pageview` and mints a fresh one in the provider mapper. A unit test asserts that two events of one batch, one of them the pageview, never share an id.

### Pitfall 3: The buffer clear takes the pageview with it
**What goes wrong:** today `resetAllEvents` clears both the events and the view start. `[VERIFIED: trackingService.svelte.ts:161-164]` If D-05's "clear at grant" calls it, the current view is lost.
**How to avoid:** hold the view state and the event buffer separately. Clearing the buffer never touches the view.

### Pitfall 4: A second pageview for a view already sent
**What goes wrong:** the view is sent at hidden, the visitor returns, navigates, and it is sent again. With no id it cannot be removed later.
**How to avoid:** the `sent` flag of Pattern 4. A unit test drives hidden, visible, navigate and asserts one pageview.

### Pitfall 5: The gate suite runs with provider `none`
**What goes wrong:** the tracking spec sees no request and fails with a timeout that names nothing.
**How to avoid:** `.env.example` sets `ANALYTICS_PROVIDER=log`; the spec's first assertion fails with a message that names the variable.

### Pitfall 6: Removing `platform` in one plan and its readers in another
**What goes wrong:** `StaticSettings` loses `platform`, and `routes/+layout.svelte`, the voter layout, the privacy page and the two consent components stop compiling.
**How to avoid:** one plan removes the type member, the Umami component and every `platform` reader together.

### Pitfall 7: Shadowing in the root load
**What goes wrong:** the projection is added to `+layout.server.ts` and not forwarded by `+layout.ts`. It is then `undefined` in every app, which reads as "inactive", and nothing is sent. No error appears.
**How to avoid:** a unit test of the universal load asserts the forwarded member; the E2E precondition of Pitfall 5 catches it too.

### Pitfall 8: A value from the URL becomes free text
**What goes wrong:** `/questions/<anything>` has the same route id as a real question, so an allowed parameter carries whatever was typed.
**How to avoid:** a validator per parameter; a failing value is dropped, not the pageview.

### Pitfall 9: Payloads in logs
**What goes wrong:** the service logs each event at `debug` today, and a relay that logs rejected bodies writes answers next to request metadata.
**How to avoid:** no payload in any log record except the `log` provider's own line. The `log` provider's line never holds the address or the user agent.

### Pitfall 10: Reading a gate through a pipe
Project memory records two commits where `lint:check | grep` hid 74 violations. Read `yarn lint:check`'s exit status directly, and run the production build as well as the typecheck.

### Pitfall 11: `keepalive` quota
**What goes wrong:** two unfinished keepalive requests together exceed 64 KiB and the second fails with a network error.
**How to avoid:** one request per flush, capped; catch and drop a rejected send without a console error.

### Pitfall 12: The dev-only shutdown
`sveltekit:shutdown` is emitted by adapter-node, not by the Vite dev server. The flush-on-shutdown path is covered by a unit test that emits the event on `process`; the real signal is observed in phases 185 and 188.

## Code Examples

### The relay route, thin
```ts
// routes/api/usage/+server.ts — the route owns no logic
import { relay } from '$lib/server/analytics/relay';
export async function POST({ request, url }) {
  const status = await relay({ request, origin: url.origin });   // 204 | 403 | 413 | 415 | 400
  return new Response(null, { status });
}
```
`url.origin` is correct behind a proxy only when `ORIGIN` is set, which phase 181 makes a required variable.

### The transport
```ts
// lib/contexts/app/tracking/relayTransport.ts
// Source: MDN RequestInit — keepalive and credentials
export function sendBatch(body: string): void {
  void fetch('/api/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'omit'
  }).catch(() => undefined);   // a lost send is a lost count, never a console error
}
```

### The root projection
```ts
// routes/+layout.server.ts
return { supabaseCookies, analytics: analyticsProjection() };   // { active, consentMode, visitIdMode }
// routes/+layout.ts — must forward it explicitly
return { supabaseClient, appCustomizationData, appSettingsData, electionData, constituencyData, analytics: data.analytics };
```

### Flush on shutdown
```ts
// Source: adapter-node 5.5.7 files/index.js emits this event before the process exits
process.on('sveltekit:shutdown', () => { void queue.flush(); });
```

## State of the Art

| Old approach | Current approach | When | Impact |
|--------------|------------------|------|--------|
| A third-party analytics script in the page | A first-party relay with server-side forwarding | This phase | No third-party origin or script. |
| `navigator.sendBeacon` at unload | `fetch` with `keepalive` | Firefox added `keepalive` in 133 | Request options such as `credentials: 'omit'` are available. |
| `unload` / `beforeunload` for the last send | `visibilitychange` to hidden, `pagehide` as a fallback | Chrome is deprecating `unload` `[ASSUMED]` | The hidden event is the reliable one on mobile. |
| A stored session id | An id in a module variable | This phase | Nothing on the device. |

**Deprecated here:** `analytics.platform`, `UmamiAnalytics.svelte`, the `sendTrackingEvent` handle, the `trackingIntercept` stub of `window.umami.track`.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Playwright reports the response of a keepalive request after its document is gone. | § 11 | The unload test needs the `context.route` form. A probe settles it. |
| A2 | Firefox before 133 aborts an unload `fetch` that asked for `keepalive`. | § 2 | Old Firefox would lose or keep more last pageviews than stated. Documentation only. |
| A3 | Umami's script reports the query string by default. | Corrections | Only the description of today's state changes. |
| A4 | Brave and DuckDuckGo send `Sec-GPC` by default. | § 9 | The reach of the signal is described wrongly in docs. |
| A5 | The Supabase browser client creates no IndexedDB database and writes no `localStorage` key. | § 11 | The allowlist needs one more entry. The first red run shows it. |
| A6 | PostHog labels an event with no user agent as automation. | § 8 | A phase 188 matter. |
| A7 | In `vite dev`, a shell variable overrides the root `.env` for `$env/dynamic/private`. Based on the comment in `svelte.config.js`, not on a run. | § 11 | The consent-free run would not switch mode. The run's first assertion (no prompt) shows it at once. |
| A8 | `yarn db:types` yields no diff after D-13. | § 5 | One more generated file in the commit. |
| A9 | `tests/tests/specs/perm/perm-closed-project.spec.ts` asserts the exact member set of the closed-project settings. Only its header was read. | § 5 | The spec either needs an edit or does not. |
| A10 | Node 24 has global `fetch` and `crypto.randomUUID`. | Standard Stack | None realistic. |
| A11 | Events 7, 10 and 20-21 are classified as I read D-06 and D-08. | § 1 | A payload is kept or removed against the operator's intent. Cheap to change in the schema. |
| A12 | PostHog accepts `distinct_id` at the top level of a batch item (the SDK's placement) as well as inside `properties` (the docs' example). | § 8 | The provider's body shape changes in phase 188. Keep the mapper in one function. |

## Open Questions

Legal questions are recorded, not answered. This document nowhere says that consent is or is not required.

1. **(Legal, open)** Is a script-initiated pageview before consent "access" under ePrivacy Art. 5(3) or a national rule, and does an exemption apply? The docs say the determination is the deployer's (B7).
2. **(Legal, open)** Is acceptance of the terms with an opt-out checkbox valid consent for the Contestant app? The operator was told it is weak and chose it. The form of the checkbox does not settle it.
3. **(Coordination)** How does D-13 reach the branch on which the freeze commit is cut? Options: cherry-pick the one commit to `feat/entity-signup-multi-grant` and regenerate `00001` there; or merge. And the v2.16 session must write 178-04 on top of it. Recommendation: cherry-pick, and add the item to 181's pre-freeze list with the commit named.
4. **(Operator)** May `.env.example` set `ANALYTICS_PROVIDER=log`? It makes the development and CI default differ from the code default `none`. The alternative is a prefix on every gate run. Recommendation: yes, and the operator adds the line to the local `.env`.
5. **(Operator, reading 4)** May the Contestant app's privacy page show the existing consent control when tracking is enabled? Without it a contestant cannot change the choice in that app. Recommendation: yes.
6. **(Operator)** A grant stored under the old consent text stays a grant after the model changes. Accept, or reset stored choices by bumping `staticSettings.appVersion.requireUserDataVersion` (which also discards voters' stored answers)? Recommendation: accept; nothing is deployed.
7. **(Operator, reading 1)** Confirm that "sent at the first of navigation, hidden, or `pagehide`" replaces "on `pagehide` for the last page", and that time after a return to the tab is not measured. If the operator prefers reliable counts and whole durations, the option is a random token that lives for one page view and joins two sends; it conflicts with "no id" and needs a ruling.
8. **(Planner)** Does `track()` keep "send now" for `maintenance_shown` and `video`, or buffer like `startEvent`? Recommendation: buffer, so there is one batch per flush point, as D-11 says.
9. **(Planner)** Names for the two fixed events. Recommendation: `results_ranked_entity` and `results_browse_entity`.
10. **(Phase 188)** `$pageview` mapping, `distinct_id` placement, and the user-agent classification at PostHog.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node | everything | yes, but the shell's default is too old | default `v24.14.1`; `engines.node` is `>=24.15.0`; CI uses 24.21.0 | Use the nvm install, as v2.16's plans do: `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"` `[OBSERVED: 178-14-PLAN.md]` |
| Yarn | everything | yes | 4.18.1 | — |
| `node_modules` in this worktree | unit tests, typecheck, build | **no** | — | `yarn install` in this worktree before any plan runs code. Sources were read from the `-gsd` worktree for research only. |
| Local Supabase stack | pgTAP for D-13, every E2E run | not probed | — | I was told not to start, stop or reset any stack; another session uses them. Executors need a window in which the stack is theirs. |
| `psql` | not needed here | yes | PostgreSQL 17 client | — |
| Docker | the stack | present | not probed | — |
| PostHog project | not needed | — | — | The provider is tested against a stand-in `fetch`. |

**Missing with no fallback:** none, but `yarn install` and exclusive use of the local stack are preconditions of execution, and this host runs a second, unrelated Supabase stack (project memory).

**Wrong version:** Node in the default shell.

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json`, so it is enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Unit | Vitest (`apps/frontend`, jsdom 30; `packages/app-shared`; `packages/dev-seed`) |
| Database | pgTAP through `supabase test db` |
| E2E | Playwright 1.63.0, run only through `tests/scripts/e2e-run.sh` |
| Quick run | `yarn workspace @openvaa/frontend test:unit` |
| Full unit | `yarn test:unit` |
| Static gates | `yarn lint:check` (exit status read directly) and `yarn workspace @openvaa/frontend build` |
| E2E gate | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name>`; status 8 is a void run, not evidence |

### Success criteria: what observes green, and the red control

| Criterion | Green observer | Red control on the unchanged tree or by mutation |
|-----------|----------------|--------------------------------------------------|
| 1a. Analytics requests go only to the app's origin; no third-party script | E2E: origin allowlist over every request in a journey through the three apps, with `trackEvents` on | **Unchanged tree:** the `perm-analytics-tracking` dataset mounts `https://cloud.umami.is/script.js`; the assertion fails on it. |
| 1b. The relay answers at once and the interface never waits | Unit: `relay()` returns 204 while the stand-in provider's promise is still pending. E2E: the next question is reachable while the relay request is held open by `context.route` | Mutation: a control case in the unit file awaits the provider and is detected by the same assertion. |
| 1c. A send made at unload arrives | E2E: answer, leave to `about:blank`, read the captured request and its 204 | Mutation: the same test with the transport's `keepalive` forced off must fail, if the probe shows the difference is observable in Chromium; otherwise record the limit and rely on the request capture. |
| 1d. Umami is gone | `git grep -n -i umami -- apps packages tests` returns nothing; the build succeeds | The same command lists matches today. |
| 2a. No analytics identifier in any device store; the consent choice is the only analytics state | E2E storage allowlist after each of three journeys | **Unchanged tree:** fails on `appContext-sessionId`. D-15 requires this run before the removal. |
| 2b. No hash of address and user agent, browser or server | Unit: `relay()` gets a request with distinctive address headers and user agent, and a `getClientAddress` that throws; nothing throws. Source scan in a Vitest spec: no `getClientAddress`, `user-agent`, `x-forwarded-for`, `createHash`, `createHmac` or `subtle.digest` under `lib/server/analytics`, `lib/analytics`, the tracking directory and the route | Control case: a fixture file with a forbidden token is scanned by the same function and flagged. |
| 2c. The onward request carries neither address nor user agent | Unit: the PostHog provider and the `log` provider with a recording stand-in; none of the planted values appears in the recorded URL, headers, body or line | Control case: a deliberately leaky provider in the test file is caught by the same detector. |
| 2d. `memory`: id in memory, gone on reload, `{sessionId}` filled. `none`: random id per event, `{sessionId}` empty | Unit: service and survey link per mode; relay mapper gives distinct ids in `none`. E2E in default mode: two batches before a reload share an id, a batch after it has another; no storage key appears | Unit control: the `none` assertions run against `memory` config and fail. |
| 3a. Default mode, before consent: only the pageview, with no id | E2E: a pre-consent voter journey with answers; every captured event is `pageview` and has no `id` | **Red control:** the same spec run under `ANALYTICS_CONSENT_MODE=free` fails. |
| 3b. After consent the other events are sent | E2E: grant in the popup, answer, flush; `answer` is captured with the visit id; nothing buffered before the grant appears (D-05) | Unchanged tree: the rewritten spec fails, since no relay request exists. |
| 3c. Consent-free: events without a prompt; each sensitive event has a fresh id | E2E, second run: no dialog; events captured; `answer` carries no id from the browser. Unit: the relay gives two `answer` events different ids and neither equals the visit id | **Red control:** the consent-free spec run with no prefix fails (a prompt appears, no events). |
| 3d. `trackEvents` off: only the pageview. Provider `none`: nothing | E2E: a journey on a perm dataset built from `MINIMAL_BASE_APP_SETTINGS` (which stores `analytics: { trackEvents: false }`) captures only pageviews. Unit: `relay()` with provider `none` forwards nothing; the projection is inactive and the service sends nothing | Unit control: the same input with provider `log` forwards. |
| 3e. `Sec-GPC` is dropped; nothing is stored | Unit: `relay()` with the header returns 204 and the provider is not called. E2E: a context with `extraHTTPHeaders: { 'Sec-GPC': '1' }` and the property set shows no prompt and sends no request; the storage allowlist holds | Unit control: the same request without the header reaches the provider. |
| 4a. Closed vocabulary, size bound, no query string, refusal of the rest | Unit per event: a valid payload passes; an unknown name, an unknown key, an over-long value, a `video` `src` with a query string, a cross-origin request and an oversized body are each refused or stripped | Each case is its own control: the valid twin passes. |
| 4b. Provider by configuration, `none` default, no rebuild | Unit: `resolveAnalyticsConfig` over each value, unset, and invalid; `posthog` with no key is a problem | — |
| 4c. `log` writes a structured line | Unit: one line per event on a captured `stdout`, parseable as JSON, with the `LogRecord` fields | — |
| 4d. One tested mapping each | Unit: `toLogRecord` and `toOtelLogRecord`, each over a sensitive and a non-sensitive event | — |
| 5. Texts in seven locales; the suite is green | Unit: the existing translation tests (all locales hold the same keys); a component test that `TermsOfUse.svelte` renders the paragraph when `trackEvents` is on. Full E2E run, complete and green | Component control: with `trackEvents` off the paragraph is absent. |
| D-13 | pgTAP `38-…`: the four values and the exact key set. Provider unit test: a closed project's answer holds `analytics.trackEvents` | pgTAP on the unchanged function fails the new assertion. |
| D-12 | Component tests: the checkbox shows only when tracking is enabled; accepting writes `granted`, accepting with the box ticked writes `denied`; a stored `denied` pre-ticks it | Each pair is its own control. |
| Route allowlist | Unit: the tree walk finds every page route in the map; `id` and `entityId` are in no list | Control: a fixture route outside the map is reported. |

### Phase Requirements → Test Map

| Req | Behaviour | Type | Command | File exists? |
|-----|-----------|------|---------|--------------|
| RELAY-01, -07, -08, -09 | `relay()` | unit | `yarn workspace @openvaa/frontend vitest run src/lib/server/analytics` | no, Wave 0 |
| RELAY-03, -10, -21 | config and providers | unit | same directory | no, Wave 0 |
| RELAY-04 | PostHog mapper against a stand-in | unit | same directory | no, Wave 0 |
| RELAY-06 | source scan and spy | unit | same directory | no, Wave 0 |
| RELAY-08, -20 | schema and mappers | unit | `… vitest run src/lib/analytics` | no, Wave 0 |
| RELAY-05, -16, -18 | service, visit id, survey link | unit | `… vitest run src/lib/contexts/app` | exists, rewritten (`trackingService.svelte.test.ts`, `survey.svelte.test.ts`, `appContext.spread.svelte.test.ts`) |
| RELAY-10 (settings) | schema without `platform` | unit | `yarn workspace @openvaa/app-shared test:unit` | exists, rewritten |
| RELAY-19 (D-13) | public config | pgTAP + unit | `yarn workspace @openvaa/supabase test:db` | exists, edited |
| RELAY-02, -05, -11, -12, -14, -15, -17, -19 | browser behaviour | E2E | `tests/scripts/e2e-run.sh --run-dir … --project voter-prefs-tracking` and the full gate | spec exists, rewritten; fixtures are Wave 0 |
| RELAY-11, -12, -17 (consent-free) | second run | E2E | the prefixed command in § 11 | no, Wave 0 |
| RELAY-13, -19 (text) | keys and rendering | unit | `… vitest run src/lib/i18n` and component tests | partly exists |

### Sampling Rate

- **Per task commit:** the quick unit run of the touched workspace.
- **Per wave:** `yarn test:unit`, `yarn lint:check`, the frontend production build.
- **Phase gate:** one complete green run of the full E2E suite in default mode, and one complete green run of the consent-free project. A void run is repeated under a new `--run-dir`.

### Wave 0 Gaps

- [ ] `tests/tests/fixtures/shared/relayCapture.fixture.ts` — request capture on the relay path; replaces `trackingIntercept.fixture.ts`
- [ ] `tests/tests/fixtures/shared/deviceStores.fixture.ts` — the storage allowlist
- [ ] A third-party-origin assertion helper (two allowed origins)
- [ ] A probe of how Playwright reports a keepalive request sent while the page is left (assumption A1)
- [ ] The opt-in Playwright project and its own setup project for consent-free mode
- [ ] `.env.example`, `render.example.yaml`, root `docker-compose.dev.yml`: the `ANALYTICS_*` variables
- [ ] Red runs recorded in the phase's evidence directory before the code that turns them green: the storage allowlist and the third-party-origin assertion on the unchanged tree

## Security Domain

`security_enforcement` is not set, so it is enabled.

### Applicable ASVS Categories

| Category | Applies | Control |
|----------|---------|---------|
| V2 Authentication | no | The endpoint is public by design. `credentials: 'omit'` keeps session cookies away from it. |
| V3 Session Management | no | No session. The visit id is not a session credential and is never trusted beyond its format. |
| V4 Access Control | yes, narrowly | Same-origin check (`Sec-Fetch-Site`, then `Origin` against `url.origin`). D-13's function stays a definer function that returns named members only; the pgTAP key-set assertion is its control. |
| V5 Input Validation | yes | The zod closed union, per-parameter validators, body and batch caps, content-type check. |
| V6 Cryptography | no | No hashing, no signing. Random ids from `crypto.randomUUID` / `crypto.getRandomValues`. |
| V7 Logging | yes | No payload, address or user agent in application logs. |
| V13 API | yes | Fixed onward destination from server configuration; the caller cannot choose a host. |

### Known Threat Patterns

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Forged events inflate counts or spend the provider quota | Tampering, Denial of service | Closed schema, caps, bounded queue that drops when full. An origin check stops other sites' pages, not scripts; the data is advisory and the docs say so. The WAF rule is phase 188. |
| The relay becomes an open forwarder | Tampering | Destination from private configuration only. |
| Visitor address or user agent reaches the provider or a log | Information disclosure | Onward request built from nothing; tests with planted values. |
| A visitor's answers linked to one id without consent | Information disclosure | Relay-side id stripping by mode (Pattern 1). |
| Free text reaches the provider | Information disclosure | Five payloads changed (§ 1); strict objects reject unknown keys. |
| A caller-chosen id merges visitors or attaches to an existing PostHog person | Spoofing | UUIDv7 shape and age check; otherwise a fresh random id. |
| Memory exhaustion while the provider is slow | Denial of service | Bounded queue; the route never awaits the provider. |
| The public-config function leaks other settings | Information disclosure | Named members only; pgTAP pins the exact key set at every level. |
| The projection leaks the provider or key | Information disclosure | Three public fields only; a unit test pins the object's keys. |
| Cross-site script calls the relay with a visitor's cookies | Spoofing | No cookies are sent or read; the relay ignores credentials. |

## Recommended Plan Order

The milestone research asks for the data model first. D-13 must also be early. E2E runs cannot overlap on this host, so plans that run the suite are serial.

| Wave | Plan | Content | Depends on | Notes |
|------|------|---------|------------|-------|
| 1 | A `[db]` | D-13: the function member, regenerated migration, pgTAP, provider helper and its test, the skill and docs rows | — | One self-contained commit. Needs the local database. Tell the v2.16 session (C2). |
| 1 | B | The data model: `AnalyticsEvent`, the closed union with `SENSITIVE`, the route allowlist and its tree-walk test, the batch envelope, both mappers with tests | — | Pure modules. The operator sees the event table of § 1 here. |
| 1 | C | Server configuration: `resolveAnalyticsConfig`, the projection in both root loads, the variables in the three templates, the start-up-check entry as a pure function | — | Shares files with phase 181 (`.env.example`, templates, `hooks.server.ts`). |
| 2 | D | The relay: `relay()`, the queue with shutdown flush, the three providers, the route. All unit privacy tests with their control cases | B, C | Closes most of RELAY-01, -03, -06, -07, -08, -21; builds RELAY-04 and -09. |
| 2 | E | E2E groundwork: the capture fixture, the storage allowlist, the origin assertion, the unload probe. **Red runs recorded on the unchanged tree.** | B (path constant) | Must finish before F. Nothing joins the default project list yet in a failing state. |
| 3 | F | The cutover, in one plan so the tree compiles and the suite is green at its end: remove `platform` (type, schema, tests, template), delete the Umami component and mount, rewrite the tracking service (in-memory visit id, view state, gates, transport), the survey link, the 14 call sites' payloads, the rewritten `voter-prefs-tracking` spec | D, E | The largest plan. Split only along a line that keeps `yarn typecheck` green between the parts. |
| 4 | G | Consent surfaces and text: the voter prompt's conditions, the privacy page, the two consent components, the Contestant opt-out component and paragraph, the strings in seven locales, the regenerated key type, the translation test | F | Strings must land with or before the components that use them, because Paraglide compiles the keys. |
| 5 | H | E2E completion: the consent-free project and its run, the three-app journey with the storage and origin assertions, `Sec-GPC`, D-12 on the gate. Each red control recorded | G | |
| 6 | I | The five docs sentences that became false, the environment-variable notes, and the closing gate: `lint:check`, production build, full suite green, consent-free run green | H | DOCS-05 itself is phase 189. |

## Project Constraints (from CLAUDE.md)

Read from the worktree's `CLAUDE.md` (it describes the Supabase tree; the copy injected from the main repository still describes Strapi and is not the one to follow).

- **E2E hard rule.** A failing E2E test is a cardinal failure. No known-flaky exemption. A test that did not run counts as failed. A void run (wrapper status 8) is not evidence and is repeated.
- **E2E runs go through `tests/scripts/e2e-run.sh`**, which starts Supabase and its own dev server. There is no Playwright `webServer` for the app. The preflight cannot be skipped.
- **TypeScript strictly:** no `any`.
- **WCAG 2.1 AA** for every UI change; here the new checkbox and any new text block.
- **Localisation:** every user-facing string in all supported locales. The roadmap fixes them as `da, en, et, fi, fr, lb, sv`.
- **Context Destructuring Rule:** never destructure a reactive accessor such as `appSettings`; read `ctx.appSettings`.
- **Comment Hygiene:** no history, no planning references beyond `see phase N`, nothing addressed to a reviewer. So no `D-13` or `RELAY-15` in a code comment.
- **Results navigation invariants:** the `(located)` load must not read the URL tracked. The pageview code lives in the root layout and the service, not in a load.
- **After a schema change:** `yarn db:types` and `yarn db:lint:sql`.
- **Commits that change the database carry `[db]`** (code review checklist). Never commit secrets or `.env` files.
- **Code review checklist** (`.agents/code-review-checklist.md`): new definer functions set `search_path = ''` (none is added here); documentation is updated where the change touches it; "If the change adds functions available to the user, tracking events are enabled with new ones defined if needed".
- **Skills:** changes under `apps/frontend/src/lib/components`, `dynamic-components` or `lib/contestant` follow `.claude/skills/components`; schema work follows `.claude/skills/database`, whose three reference files name `contestant_app_public_config`.
- **Project memory, standing:** cite by content, never by line number alone; never read a gate through a pipe; do not edit `tests/scripts/e2e-run.sh` in this phase; tell executors to ignore a "CONTEXT WARNING" hook line and to background long gates.

## Sources

### Primary (HIGH: this repository, read in this session)
- `apps/frontend/src/lib/contexts/app/tracking/*`, `appContext.svelte.ts`, `survey.svelte.ts`, `userPreferences.type.ts`
- `apps/frontend/src/routes/+layout.svelte`, `+layout.ts`, `+layout.server.ts`, `(voters)/+layout.svelte`, `(voters)/privacy/+page.svelte`, the 14 call-site files
- `apps/frontend/src/hooks.server.ts`, `lib/server/constants.ts`, `lib/utils/constants.ts`, `lib/utils/logLevel.ts`, `lib/routes/*`, `src/params/*`
- `packages/app-shared/src/settings/*`, `data/schemas/storedSettings.schema.ts` and its test, `logging/*`
- `apps/supabase/supabase/schema/106-app-settings.sql`, `302-rls.sql`, `tests/database/38-contestant-app-public-config.test.sql`
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`
- `lib/contestant/components/termsOfUse/*`, `lib/contestant/gates/TermsOfUseGate.svelte`, `lib/dynamic-components/dataConsent/*`
- `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/{privacy,common,dynamic}.json`
- `tests/playwright.config.ts`, `tests/scripts/e2e-run.sh`, `tests/tests/fixtures/shared/trackingIntercept.fixture.ts`, `tests/tests/specs/voter/voter-prefs-tracking.spec.ts`, `.github/workflows/main.yaml`, `.env.example` (names only)
- Installed sources in the `-gsd` worktree: `@sveltejs/kit` 2.70.3 (`runtime/client/client.js`, `runtime/server/respond.js`, `utils/http.js`), `@sveltejs/adapter-node` 5.5.7 (`files/handler.js`, `files/index.js`), `playwright-core` 1.63.0 types
- `git diff` and `git log` of `feat/entity-signup-multi-grant` against `d228b52bc`; the v2.16 plan files of phase 178 and the context of phase 179

### Secondary (MEDIUM: official pages, two sources agreeing)
- [PostHog capture API](https://posthog.com/docs/api/capture) with [posthog-js core source](https://github.com/PostHog/posthog-js/blob/main/packages/core/src/posthog-core-stateless.ts)
- [PostHog anonymous and identified events](https://posthog.com/docs/data/anonymous-vs-identified-events), [PostHog Node library](https://posthog.com/docs/libraries/node)
- [MDN visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event), [MDN pagehide](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event), [Chrome Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)
- [MDN RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit) with the [Fetch Standard](https://fetch.spec.whatwg.org/) § 4.6
- EasyList, EasyPrivacy, Fanboy's Annoyance List, uBlock filters – Privacy, AdGuard Tracking Protection (partial), downloaded 2026-10-11

### Tertiary (LOW: a single fetch)
- [OpenTelemetry Logs data model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)
- [PostHog sessions](https://posthog.com/docs/data/sessions), [PostHog data collection](https://posthog.com/docs/privacy/data-collection)
- [MDN Sec-GPC](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-GPC), [MDN globalPrivacyControl](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/globalPrivacyControl), [browser-compat-data](https://github.com/mdn/browser-compat-data)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. No new package; versions read from `yarn.lock` and matched against installed sources.
- Inventory, settings, D-13 chain, terms-of-use files: HIGH. Read in the tree.
- Contact with v2.16: HIGH for what the branch and its plan files say today; it moves as that stream executes.
- Page-leave behaviour and `keepalive`: MEDIUM. Official pages; nothing was run in a browser.
- PostHog: MEDIUM for endpoint, body and the two properties; LOW for address handling and session rules. Phase 188 observes them.
- Filter lists: MEDIUM. An approximate matcher over lists of one day.
- Legal: not assessed.

**Not done, by instruction:** no Docker or Supabase stack was started, stopped or reset; no dev server and no E2E run was made; the local `.env` was not read; nothing outside the phase directory was edited; nothing was committed.

**Research date:** 2026-10-11
**Valid until:** 2026-10-18 for everything about the v2.16 branch and the filter lists; 2026-11-10 for the rest.
