---
created: 2026-10-08T00:00:00.000Z
title: Next milestone after v2.16 — build and test a full deployment (AWS by Terraform, remote Supabase, possibly a self-hosted Supabase container) and refactor analytics to send through a local endpoint that forwards to a logging service
area: milestone planning / deployment / analytics
severity: major
source: operator, 2026-10-08 (captured during the v2.16 run)
owner: the operator, at `/gsd-new-milestone` after v2.16 closes
files:
  - render.example.yaml
  - docker-compose.dev.yml
  - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
  - apps/supabase/supabase/config.toml
---

## Problem

Nothing in this project is deployed (ruling of 2026-10-04), so every statement about a hosted project is unobserved:
the auth settings, the redirect allowlist, the Edge Functions' variables and SMTP secrets, the Supabase API limits,
the per-caller limits on the anonymous invitation operations, and the CI behaviour of anything that needs a hosted
gateway. The reference deployment is `render.example.yaml` with Supabase Cloud; no infrastructure-as-code exists.

Analytics events are sent from the browser straight to the third-party service. There is no first-party endpoint
between the application and the service, so the service cannot be swapped or self-hosted without touching the
client, and the events leave from the visitor's browser to a third-party origin.

## Solution

The operator's direction for the milestone that follows v2.16, as one milestone with two parts:

1. **A full deployment, built and tested.** AWS provisioned with Terraform, against a remote Supabase project;
   possibly also a self-hosted Supabase container as a second target. "Tested" means the deployment is stood up and
   exercised, not only described.
2. **Analytics through a local endpoint.** The application sends events to an endpoint of its own, which forwards
   them to a logging service — a hosted one or a self-hosted one, e.g. PostHog or Umami.

Not decided here, for the milestone's discussion: which AWS services run the frontend container; whether the
self-hosted Supabase target is in scope or a stretch; which analytics service is the first one supported and whether
it is self-hosted in the same Terraform; how consent sits with a first-party relay.

## Standing todos this milestone would absorb or close

- `2026-08-31-evaluate-self-hosted-posthog-log-sink.md`
- `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md`
- `2026-09-02-deployment-guide-production-redirect-allowlist.md`
- `2026-09-18-document-supabase-api-limits-for-deployments.md`
- `2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md`
- `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`
- `2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md` (operator decision G1 (a) of
  2026-10-08: the limit cannot be designed before a hosted gateway is measured)
