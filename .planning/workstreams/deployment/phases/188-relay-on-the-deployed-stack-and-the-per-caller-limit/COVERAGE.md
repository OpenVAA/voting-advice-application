# API Coverage — PostHog Cloud EU

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

Phase 188 reaches one external API: PostHog's. The relay's provider (`apps/frontend/src/lib/server/analytics/providers/posthog.ts`, built in phase 182) sends to the batch capture endpoint, and this phase observes it on the deployed stack; the new `infra/scripts/posthog-read.sh` reads events and one project setting back. The other external services the phase touches (AWS through Terraform and the AWS CLI, Supabase through the existing pipeline, k6 as a container) are driven through tools that phases 183 to 187 already wired; no application code gains a client of them.

| capability | decision | reason |
|---|---|---|
| batch capture (`POST /batch/` on the ingestion host) | INTEGRATE | The relay's one forwarding path; observed on staging by plans 188-11 to 188-15 |
| query API (`POST /api/projects/:id/query/`, HogQL) | INTEGRATE | The read-back of every deployed observation (A-04), through `posthog-read.sh` |
| project settings read (`GET /api/projects/:id/`) | INTEGRATE | Reads back that the project discards client IP data (B-02), mode `settings` |
| single-event capture (`/capture`, `/i/v0/e`) | OPT-OUT | explicitly out of scope: the provider batches by design (RELAY-04) |
| identify, alias, groups, person properties | OPT-OUT | explicitly out of scope: no person profile is ever created (RELAY-04, `$process_person_profile: false`) |
| persons API (read) | OPT-OUT | not needed: the privacy read counts person rows through HogQL instead |
| feature flags (`/flags`, `/decide`) | OPT-OUT | explicitly out of scope: flags need a client identity and a third-party call the relay forbids (RELAY-02) |
| session recording, surveys, web analytics scripts | OPT-OUT | explicitly out of scope: no third-party script runs in the browser (RELAY-02) |
| project settings write | OPT-OUT | not needed: the operator sets IP discard and GeoIP in the UI (B-02), and the read key is read-only |
| insights, dashboards, cohorts, actions, annotations | OPT-OUT | not needed: analysis is the deployer's, in PostHog's own UI |
| billing API | OPT-OUT | not needed: the operator sets and reads the billing limit in the UI (A-02) |
| events export, batch exports, webhooks | OPT-OUT | not needed yet: phase 189 documents the deployer's options |
