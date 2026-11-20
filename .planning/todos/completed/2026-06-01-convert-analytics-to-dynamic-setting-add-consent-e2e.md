---
title: Convert analytics setting to a dynamic setting + add e2e for consent handling and analytics events
created: 2026-06-01
completed: 2026-11-21
status: completed
---

# Convert analytics setting to a dynamic setting + add e2e for consent handling and analytics events

**Filed:** 2026-06-01
**Source:** quick task `260601-hn9` (skip notification popup permutation tests + record todos)
**Home phase:** v2.11+ (target phase TBD)
**Effort:** ~0.5–1 phase (settings reclassification + consumer rewiring + new consent/analytics-event e2e)

## Why deferred

Analytics is currently a **static** setting (hardcoded in
`packages/app-shared/src/settings/staticSettings.ts`). Per the
StaticSettings / DynamicSettings split documented in CLAUDE.md ("Settings
Architecture"), backend-loaded feature flags belong in `DynamicSettings`, not
`StaticSettings`. Analytics enablement is properly a per-instance,
backend-controlled feature flag, so it should be moved to `DynamicSettings`
(loaded from the backend) rather than baked into the static settings module.

Closure work:

1. Reclassify the analytics setting from `StaticSettings` to `DynamicSettings`
   (backend-loaded feature flag), updating all consumers to read it from the
   dynamic settings source.
2. Add an e2e test covering consent handling (opt-in / opt-out) and verifying
   that analytics events fire when consent is granted and are suppressed when
   consent is denied — i.e. event emission is gated by consent state.

## Cross-references

- Current static settings home: `packages/app-shared/src/settings/staticSettings.ts`
- Settings split reference: CLAUDE.md "Settings Architecture" section (StaticSettings vs DynamicSettings)

## Closed (phase 189), 2026-11-21

Closed by plan 189-18, on what the tree holds today.

- **What was built.** Item 1: `analytics.trackEvents` is a dynamic setting, `false` by default (`packages/app-shared/src/settings/dynamicSettings.ts`), loaded from each project's stored app settings; `staticSettings.ts` no longer carries an analytics setting. While it is `false` no event but the server pageview is sent and the consent prompt is not shown. Item 2: the consent and event specs `tests/tests/specs/voter/analytics-privacy.spec.ts`, `analytics-gpc.spec.ts` and `voter-prefs-tracking.spec.ts` run in the `voter-prefs-tracking` project, behind `data-setup-perm-analytics-tracking`, whose dataset turns `trackEvents` on in the perm serial chain; `voter-tracking-consent-free.spec.ts` runs in `analytics-consent-free` (`tests/playwright.config.ts`). The last full run of phase 188 passed them with the rest of the suite (`tests/e2e-runs/188-close3-20261119T213204Z`: 729 passed, 0 failed, 0 did not run, per `.planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-VERIFICATION.md`). The setting, the consent modes and every event are documented on `apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md`.
- **What remains.** None.
- **Moved.** None.
