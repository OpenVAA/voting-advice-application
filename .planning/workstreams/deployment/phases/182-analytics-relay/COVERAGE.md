# API Coverage — PostHog HTTP capture API

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

The phase builds one external integration: the `posthog` provider of the analytics relay, a plain server-side `fetch` to PostHog's public capture API (plan 182-07). It is tested against a stand-in in this phase; real capture is observed in phase 188. The surface below is the capture API as read in `182-RESEARCH.md` § 8 on 2026-10-11. The `log` and `none` providers call no external API.

| capability | decision | reason |
|---|---|---|
| batch-capture (POST /batch/) | INTEGRATE | |
| project-token-auth (api_key in the body) | INTEGRATE | |
| host-selection (EU, US or another host) | INTEGRATE | |
| event-name-and-properties | INTEGRATE | |
| event-timestamp (per-event timestamp) | INTEGRATE | |
| distinct-id | INTEGRATE | |
| session-id ($session_id) | INTEGRATE | |
| anonymous-events ($process_person_profile false) | INTEGRATE | |
| geoip-disable ($geoip_disable true) | INTEGRATE | |
| single-event-capture (POST /i/v0/e/) | OPT-OUT | not needed: the batch endpoint carries one or many events, and the relay sends one request per flush |
| identify-and-person-properties ($identify, $set, $set_once) | OPT-OUT | explicitly out of scope: no person profile is created for any visitor (RELAY-04) |
| alias ($create_alias) | OPT-OUT | not needed: there are no identities to merge |
| group-analytics ($groupidentify, $groups) | OPT-OUT | not needed: the application has no groups to report on |
| pageview-event ($pageview with $current_url) | OPT-OUT | not needed yet: the pageview is sent under the application's own name with a route id and no URL; the mapping to $pageview is decided in phase 188 |
| screen-event ($screen) | OPT-OUT | not needed: a mobile-app concept |
| client-ip ($ip) | OPT-OUT | explicitly out of scope: the visitor's address stops at the relay (RELAY-07) |
| user-agent-and-referrer ($raw_user_agent, $referrer) | OPT-OUT | explicitly out of scope: the user agent stops at the relay and the record carries no referrer (RELAY-07, D-01) |
| sent-at (batch-level clock-skew correction) | OPT-OUT | not needed: the relay stamps every event with its own clock |
| event-uuid (deduplication id) | OPT-OUT | not needed: the provider does not retry, so no duplicate can arise |
| compression (gzip body) | OPT-OUT | not needed: a batch is far below the size at which it would matter |
| historical-migration | OPT-OUT | not needed: nothing is backfilled |
| feature-flags (/flags, /decide) | OPT-OUT | explicitly out of scope: the integration is for analytics only |
| session-replay ($snapshot) | OPT-OUT | explicitly out of scope: replay would record political answers (REQUIREMENTS, Out of Scope) |
| autocapture-and-heatmaps | OPT-OUT | explicitly out of scope: they belong to the browser SDK, which is not used (REQUIREMENTS, Out of Scope) |
| exception-capture ($exception) | OPT-OUT | not needed yet: browser errors through the relay are FUT-08 |
| surveys | OPT-OUT | not needed: the application links to its own survey |
