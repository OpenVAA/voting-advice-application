# Lens: Analytics · ID prefix `ANL`

**Applies when** the PR adds or changes a user affordance (anything the Behaviour lens would list), adds or changes a route a voter can visit, or touches the event vocabulary, the tracking service, the consent gates or the usage relay. Event data from a voting advice application can reveal political opinion, so a new event is never too small to check.

## List

One row per affordance from the Behaviour lens: _affordance_ → _event it emits_ (or `✗`) → _attributes_ → _in `SENSITIVE_EVENTS`?_. Then every event the PR adds to or changes in the vocabulary, with its attributes.

## Evaluate (criterion slugs)

- `anl-coverage`: every new or changed affordance worth measuring emits an event of the vocabulary through the tracking service. Pageviews are built by the service itself, so a new route must be registered in `pageviewRoutes.ts` instead. A missing event is `should-fix`; for a purely presentational toggle it is `consider`. This is the checklist's tracking-events item.
- `anl-schema`: a new event is a member of the `EventSchema` discriminated union in `events.schema.ts`, with typed attributes, and the fixtures (`events.fixtures.ts`), the mappers and the relay at `apps/frontend/src/routes/api/usage/+server.ts` accept it. No ad-hoc names, no untyped payloads, no call site constructing a wire event by hand.
- `anl-sensitivity`: judge every new or changed event. An event that says how a visitor answered, which answer they removed or skipped, which entity they viewed in the results or how well it matched, or which filters they applied, reveals political opinion (GDPR special-category data) and must be in `SENSITIVE_EVENTS`, so `isSensitiveEvent` returns true for it. A missing entry is `blocking`. Also check the attributes of every event: no free text the visitor typed, no identifier that links to a person (an email, a contestant's id on a voter event), no answer value on an event outside the set.
- `anl-gates`: sends go through the tracking service, so the gates in `gates.ts` decide them — `maySendEvents` / `maySendPageview` honour the `analytics.trackEvents` setting, the consent mode (`gated` / `free`), Global Privacy Control and the stored consent choice. A sensitive event must never carry the visit id in consent-free mode. Flag any call site that posts to the relay directly or reads consent itself.
- `anl-contestant-admin`: contestant-app events honour the contestant opt-out (`shouldShowContestantOptOut`); an admin action is not tracked as a voter event, and no admin event carries another user's data.

## Where to look

`apps/frontend/src/lib/analytics/` (read `events.schema.ts` for `EventSchema`, `SENSITIVE_EVENTS` and `isSensitiveEvent` first), `apps/frontend/src/lib/contexts/app/tracking/` (`gates.ts`, `trackingService.svelte.ts`), `apps/frontend/src/routes/api/usage/`, and the `analytics` block of `packages/app-shared/src/settings/dynamicSettings.ts`. These are the paths on the current tree. An older head may not have `apps/frontend/src/lib/analytics/` yet, with the vocabulary only under `apps/frontend/src/lib/contexts/app/tracking/`. Check with `git ls-tree` at `{HEAD_SHA}` and read whichever exists; a missing path is not a finding.

## Not a finding

An affordance with no analytic value (a purely decorative animation, a focus ring). An event deliberately left non-sensitive whose attributes carry no answer, match or filter information.

## Promote to

`.agents/code-review-checklist.md` (sharpen the tracking-events item with the sensitivity rule); `.claude/skills/components/SKILL.md`.
