---
title: Evaluate self-hosted PostHog against alternatives for a durable log/analytics sink
priority: medium
source: Phase 157.1 discussion C4 NOTE (2026-08-31)
---

Phase 157.1 turned production logging on (`PUBLIC_LOG_LEVEL`, ruling D9) but deliberately shipped **no durable sink**. Decision C4(a) keeps the `console` default: with no sink configured, `@openvaa/app-shared` writes level >= 40 to `console.error` and everything quieter to `console.info`, which on the server is container stdout — real and collectable, but not durable, not queryable, and absent entirely for the browser half.

Evaluate **self-hosted PostHog** as that durable sink, and compare it against the alternatives rather than adopting it by default. The comparison should cover at least: self-hosting cost and operational burden, data residency (this is a voting-advice application, so where records land is a governance question and not only a technical one), client-side error reporting, retention and query ergonomics, and what a Sentry-class error tracker would give instead. Note that PostHog is primarily a product-analytics platform and a log sink is an adjacent use of it — whether that adjacency is a good fit is part of what is being evaluated.

**The transport swap should be cheap when this is picked up, and that is by design.** C4's NOTE part 1 was treated as a structural constraint on Phase 157.1 rather than as deferred work: `LoggerConfig.sink` is already an injection point (`packages/app-shared/src/logging/logger.type.ts`), records are pino/OpenTelemetry-conformant in shape without depending on either library, and every record this phase emitted or touched carries a **constant** `msg` with all varying data in a flat attribute bag. That last point is what lets a sink key events on a stable name; an interpolated message would produce a distinct event per boot. Verify that property still holds before wiring anything.

**Out of scope for Phase 157.1, by ruling.** D9 and C4(a) exclude a durable sink from that phase, and the operator's note asks for this comparison to be queued rather than smuggled in. Filed once, here, per the note's do-it-once clause — deliberately not also a GitHub issue and not a `TODO:` comment in the logger module.
