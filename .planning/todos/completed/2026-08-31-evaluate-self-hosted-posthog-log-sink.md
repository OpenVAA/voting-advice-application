---
title: Evaluate self-hosted PostHog against alternatives for a durable log/analytics sink
priority: medium
source: Phase 157.1 discussion C4 NOTE (2026-08-31)
created: 2026-08-31
completed: 2026-11-21
status: completed
---

Phase 157.1 turned production logging on (`PUBLIC_LOG_LEVEL`, ruling D9) but deliberately shipped **no durable sink**. Decision C4(a) keeps the `console` default: with no sink configured, `@openvaa/app-shared` writes level >= 40 to `console.error` and everything quieter to `console.info`, which on the server is container stdout — real and collectable, but not durable, not queryable, and absent entirely for the browser half.

Evaluate **self-hosted PostHog** as that durable sink, and compare it against the alternatives rather than adopting it by default. The comparison should cover at least: self-hosting cost and operational burden, data residency (this is a voting-advice application, so where records land is a governance question and not only a technical one), client-side error reporting, retention and query ergonomics, and what a Sentry-class error tracker would give instead. Note that PostHog is primarily a product-analytics platform and a log sink is an adjacent use of it — whether that adjacency is a good fit is part of what is being evaluated.

**The transport swap should be cheap when this is picked up, and that is by design.** C4's NOTE part 1 was treated as a structural constraint on Phase 157.1 rather than as deferred work: `LoggerConfig.sink` is already an injection point (`packages/app-shared/src/logging/logger.type.ts`), records are pino/OpenTelemetry-conformant in shape without depending on either library, and every record this phase emitted or touched carries a **constant** `msg` with all varying data in a flat attribute bag. That last point is what lets a sink key events on a stable name; an interpolated message would produce a distinct event per boot. Verify that property still holds before wiring anything.

**Out of scope for Phase 157.1, by ruling.** D9 and C4(a) exclude a durable sink from that phase, and the operator's note asks for this comparison to be queued rather than smuggled in. Filed once, here, per the note's do-it-once clause — deliberately not also a GitHub issue and not a `TODO:` comment in the logger module.

## Closed (phase 189), 2026-11-21

Closed by plan 189-18. The evaluation was made by the milestone's scoping rather than by a separate study: the server sink and the analytics sink are separate, and self-hosted PostHog is neither.

| Candidate | Role here | What is measured or decided | Source |
| --- | --- | --- | --- |
| Container logs in CloudWatch | The durable server log sink | The container's stdout goes through the `awslogs` driver to the log group `/openvaa/<environment>/frontend`, kept 90 days on staging (`log_retention_days = 90`) | `infra/modules/frontend-service/service.tf`, `infra/envs/staging/aws/terraform.tfvars` |
| PostHog Cloud EU | Analytics only, through the relay | Events from staging retrieved in PostHog EU with no person profile, no visitor address, no GeoIP and no raw user agent; batches, the flush at `SIGTERM` and fail-open delivery observed (RELAY-04, truth 1) | `.planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-VERIFICATION.md` |
| Self-hosted PostHog, or PostHog as the log sink | Not provisioned | An anti-feature of the milestone: unsupported at this scale, and the container log store already holds the server logs | `.planning/workstreams/deployment/REQUIREMENTS.md` § Out of Scope |
| Browser errors through the relay | Not built | Future work, FUT-08 | `.planning/workstreams/deployment/REQUIREMENTS.md` § Future Requirements |

- **What was built.** The durable server sink is the CloudWatch log group of the frontend service module, with no change to the logger: `@openvaa/app-shared` still writes to the console, and `LoggerConfig.sink` (`packages/app-shared/src/logging/logger.type.ts`) remains the injection point, unused. Analytics goes to PostHog Cloud EU through the server relay, proven on staging in phase 188. A Sentry-class error tracker was not adopted; nothing in this milestone needed one.
- **What remains.** The browser half of this todo: browser errors have no durable sink. That is FUT-08 ("browser errors through the relay").
- **Moved.** To FUT-08 in `.planning/workstreams/deployment/REQUIREMENTS.md` § Future Requirements. No new todo.
