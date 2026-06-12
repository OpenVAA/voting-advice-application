---
created: "2026-06-12T00:00:00.000Z"
title: Extend E2E coverage to all user preferences + tracking-event sending
area: frontend
priority: medium
files: []
source: v2.13 discussion points C4 (.planning/v2.13-DISCUSSION-POINTS.md)
---

## Problem

The v2.13 context-as-class migration converts `appContext` (`userPreferences`, persisted via `persistedState`)
and `trackingService` (`sendTrackingEvent`, `startEvent`, `submitAllEvents`, consent-gated `shouldTrack`) to
classes. These surfaces are exercised only indirectly by the current E2E suite — there is no dedicated spec that
walks **every** user preference (data consent, feedback status, survey status, dark mode, locale, etc.) or that
asserts tracking events are actually emitted/submitted under consent and suppressed without it.

## Solution

Add E2E coverage that:

1. **User preferences** — round-trips each `userPreferences` field through the UI: set → reload → assert persisted
   (extends the v2.9 reload-persistence pattern to the full preference set, not just profile fields).
2. **Tracking events** — asserts `trackingService` emits the expected events on the expected interactions
   **with** consent, and emits nothing **without** consent (consent toggle is the gate). Pairs with the existing
   `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e` todo.

Scope as a coverage phase after the v2.13 class conversion lands (so the specs target the final class API). Not a
v2.13 deliverable — the migration is a pure refactor; this is net-new coverage.
