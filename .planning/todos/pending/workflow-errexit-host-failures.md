---
title: Diagnose the 6 workflow-errexit test failures on the cloud host
priority: low
source: Phase 191 plan 06 deferred items (2026-11-24), nuorten-2027 workstream
---

`yarn test:unit:infra` fails 6 of 530 on the cloud host, all in `infra/scripts/workflow-errexit.test.ts` (infra-plan.yml wrong-subject cases, deploy.yml "Alert the operator", destroy.yml Supabase-root cases). They fail identically at 8f2bb68a7. The step under `bash -e` prints none of the expected lines; first suspect is a host utility symlinked through `UTILITY_PATHS` that behaves differently. Find the cause and make the harness host-independent. Details: `deferred-items.md` § 3 in the phase 191 directory.
