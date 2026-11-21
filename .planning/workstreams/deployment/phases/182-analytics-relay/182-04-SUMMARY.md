---
phase: 182-analytics-relay
plan: 04
subsystem: frontend-analytics
tags: [analytics, relay, zod, vocabulary, privacy, batch, vitest]
status: complete

requires:
  - phase: 182-03
    provides: ID_PATTERN, MAX_BATCH_EVENTS, MAX_EVENT_AGE_MS (constants.ts), isUuidV7 (uuidv7.ts), isPageviewRoute (pageviewRoutes.ts)
  - phase: 182-12
    provides: nothing read here; listed as a wave dependency only
provides:
  - apps/frontend/src/lib/analytics/events.schema.ts (EventSchema, EVENT_NAMES, SENSITIVE_EVENTS, isSensitiveEvent, EventName, WireEvent, EventAttributes)
  - apps/frontend/src/lib/analytics/events.fixtures.ts (VALID_EVENTS, SAMPLE_VISIT_ID, SAMPLE_ID, SAMPLE_OTHER_ID; test support)
  - apps/frontend/src/lib/analytics/batch.schema.ts (BatchSchema, Batch, ParsedBatch, parseBatch)
  - evidence/04-event-catalogue.md for the operator
affects: [182-07, 182-08, 182-13, 182-14, 182-25, 182-29]

actuals:
  tokens: 14000     # chars/4 over the two code commits' diff (56010 chars)
  tasks: 2
  commits: 2        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the docs commit follows
plan_head_before: d52b28fc8440a0bb7965e962e6ecce9bec388016
plan_head_after: b15209659fe67e22e311b5908f50253c69f9fd62

tech-stack:
  added: []
  patterns:
    - "A closed event vocabulary as one zod discriminated union of strict members, with the name list derived from the union's options"
    - "A batch parser that checks a strict envelope, then parses each event alone and returns only a count of what it dropped"

key-files:
  created:
    - apps/frontend/src/lib/analytics/events.schema.ts
    - apps/frontend/src/lib/analytics/events.fixtures.ts
    - apps/frontend/src/lib/analytics/events.schema.test.ts
    - apps/frontend/src/lib/analytics/batch.schema.ts
    - apps/frontend/src/lib/analytics/batch.schema.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/04-event-catalogue.md
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/04-gates.txt
  modified: []

key-decisions:
  - "video.toggleTranscript is bounded by the closed pattern ^((true|false),)+$, because Video.svelte writes the words true and false; jump uses ^(-?\\d+(\\.\\d+)?,)+$"
  - "results_ranked_entity.score is an integer from 0 to 100, because Match.score is a rounded percentage"
  - "results_browse and results_ranked take election and entityType as optional, because the call site can produce them undefined; results_changeTab.section is the entity-type enum"
  - "Pageview param names must start with a letter and values must match ID_PATTERN, so __proto__ and free text cannot appear"
  - "The pageview duration is any non-negative safe integer; clamping to MAX_PAGEVIEW_DURATION_MS is the relay's"

requirements-completed: [RELAY-08, RELAY-15, RELAY-17]

duration: 7min
completed: 2026-10-19
---

# Phase 182 Plan 04: The closed event vocabulary and the batch envelope Summary

**`EventSchema` is one `z.discriminatedUnion('name', …)` of 30 `z.strictObject` members, strict at every level, with no free-text attribute. Every string has a pattern or a length cap. `results_browse_entity` and `results_ranked_entity` replace the two template names. The feedback description, the localised filter names and the section titles are gone. `video.src` is cut at the first `?` or `#`. `parseBatch` checks a strict envelope (listed route id, supported locale, 1 to 50 events), then parses each event on its own. It returns only how many events it dropped.**

The classification of the events the research marked as assumption A11 is unreviewed by the operator.

## Performance

- **Start sha:** `d52b28fc8440a0bb7965e962e6ecce9bec388016`
- **Started:** 2026-10-19T10:08:40Z
- **Completed:** 2026-10-19T10:15Z
- **Tasks:** 2 (both auto, TDD)
- **Files:** 5 source and test files, plus 2 evidence records

## Accomplishments

- **Task 1.** I re-derived the call sites at run time. There are 30 calls in 14 files, which matches the research; the Umami component's `window.umami.track` and the comment line in `appContext.svelte.ts` were left out.
  - The schema's `name: z.literal(…)` count (30) equals the catalogue's row count (30). The file has no `z.object(` and no template-literal name.
  - `EVENT_NAMES` is derived from `EventSchema.options`, and `EventName` from the union's output type.
  - The entity-type enum is `z.enum(ENTITY_TYPE)`, taken from `@openvaa/data`.
  - `SENSITIVE_EVENTS` holds exactly the six names. It carries a doc comment saying what the flag means.
  - The tests cover:
    - a valid sample per name
    - an unknown key rejected inside and beside `attributes` for every name, and a missing `attributes` rejected for every name
    - a typed `REJECTED_TWINS: Record<EventName, …>`, so a name without a twin does not compile; each twin is pinned by its path
    - an over-long case for every string attribute
    - the four free-text carriers and the media-URL stripping
    - `id` on the pageview, a non-UUIDv7 `id`, and `ago` that is negative, fractional or over the limit
    - the sensitive set
  - Red: module missing, exit 1. Green: 253 tests.
- **Task 2.**
  - `BatchSchema` is a `z.strictObject` with `routeId` refined by `isPageviewRoute` and `locale` checked against `locales` from `$lib/paraglide/runtime`. `events` is `z.array(z.unknown())` with 1 to `MAX_BATCH_EVENTS` entries.
  - `parseBatch` keeps the parsed outputs, so the stripped `src` is what travels on, and counts the failures. Its result holds only `ok`, `routeId`, `locale`, `events` and `dropped`. A test asserts that a marker value from a rejected event and the rejected key do not appear in the serialised result.
  - `git grep "\$lib/server" -- apps/frontend/src/lib/analytics` prints nothing.
  - Red: module missing, exit 1. Green: `src/lib/analytics` has 5 files and 321 tests.
- **Gates** (attempt `20261019T101400Z.b15209659`; tree clean before and after; HEAD `b15209659` before and after): `TYPECHECK_EXIT=0` (3021 files, 0 errors, 0 warnings) and `LINT_EXIT=0`. `evidence/04-gates.txt` is a `cmp`-equal copy of the attempt file, and the plan's pointer verify exits 0.

## Task Commits

1. **Task 1:** `47ffb3d41` feat(182-04): the closed event vocabulary, its sensitive set and one sample per event
2. **Task 2:** `b15209659` feat(182-04): the batch envelope and a parser that judges each event alone

## Deviations from Plan

**1. [Rule 1 - Plan text vs tree] `toggleTranscript` is bounded by its own closed pattern.** The plan allowed only digits, dots, commas, colons, semicolons, hyphens and `>`. It also said to use exactly the separators `Video.svelte` writes. `Video.svelte` writes `` `${show ? 'true' : 'false'},` ``, so the value is made of the words `true` and `false`. The schema admits `^((true|false),)+$`, at most 512 characters, which is a closed form and holds no free text. `jump` is `^(-?\d+(\.\d+)?,)+$` (digits, hyphen, dot, comma), at most 512 characters. That is a subset of the plan's set and matches what `jump()` writes (`` `${steps},` ``).

**2. [Rule 2 - Correctness] Bounds tighter than the plan text.**
- Pageview `params`:
  - Names must match `^[A-Za-z][A-Za-z0-9_]{0,63}$`, which rules out `__proto__` and the like.
  - Values must match `ID_PATTERN`, not just be at most 64 characters. Every validator in `PAGEVIEW_ROUTES` accepts only values of that form.
- `results_ranked_entity.score` is an integer from 0 to 100, because `MatchBase.score` is `Math.round(matchFraction * 100)`.
- `video.duration` is 0 to 86400 seconds, and `endAt` is `'end'` or a number from 0 to 1.
- The envelope's `routeId` and `locale` are capped at 256 characters before the allowlist check.

**3. [Rule 3 - Lint] `EventAttributes<TName extends EventName>`.** The plan's interface wrote `N`. The repository's naming rule requires `T[A-Z]…` type parameters. Usage is unchanged.

**4. Readings of "as the call site produces them".**
- `results_browse` and `results_ranked` take `election` and `entityType` as optional, because `activeElectionId` and `currentResultsEntityType` can be undefined.
- `results_changeTab.section` is the entity-type enum, because it receives `tab.id`, an entity type.
- `feedback_*.rating` is an optional integer from 1 to 5.
- Every `video` attribute is optional, as `VideoTrackingEventData` declares them `Partial`.
- The `answer` value needed no extra character: values are choice ids, comma-joined choice ids, booleans or numbers.

**5. Additive exports.** `ParsedBatch` (the return type of `parseBatch`) and the fixtures' `SAMPLE_VISIT_ID`, `SAMPLE_ID` and `SAMPLE_OTHER_ID`.

## Notes for later plans and the operator

- **Operator (A11):** please review `evidence/04-event-catalogue.md`. Its four readings, each with what a change costs:
  - `entityDetails_changeTab` is not sensitive.
  - `filters_active` sends a count and is sensitive.
  - The two section events send an index.
  - `video` keeps `src` without its query string.

  None of these blocks 182-08, 182-13, 182-14 or 182-25.
- **182-25 (call sites):**
  - `filters_active` must send `count`.
  - The two `questionExtendedInfo_*Section` events must send `sectionIndex`. `QuestionExtendedInfo.svelte`'s `onSectionCollapse` and `onSectionExpand` pass `title` today, and the `{#each}` already has `index`.
  - The entity views must send `entityType` and `entityId`, not `id`.
  - `Video.svelte` can produce `NaN` for `duration` and `endAt` before metadata loads, and such an event fails the schema. The call site should omit non-finite values, or the browser-side check will drop the event.
- **182-08 (relay):**
  - `parseBatch` does not clamp the pageview duration and does not filter params against the allowlist. Both remain the relay's job, through `MAX_PAGEVIEW_DURATION_MS` and `allowedPageviewParams`.
  - `parseBatch` returns the envelope's route id unchanged, as a listed key.
- **Follow-up 182-R1:** the pageview's `duration` member stands as planned, on the recommended answer. The operator has not ruled.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: all five source and test files, `evidence/04-event-catalogue.md` and `evidence/04-gates.txt`
- FOUND: `47ffb3d41` and `b15209659` are ancestors of HEAD
- `yarn workspace @openvaa/frontend test:unit src/lib/analytics` exits 0 (5 files, 321 tests). The `04-gates` pointer verify exits 0.
