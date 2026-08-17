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
