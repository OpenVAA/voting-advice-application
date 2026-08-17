---
schema_version: 1
open_count: 26
waived_count: 0
fixed_count: 0
total_count: 26
last_updated: 2026-08-17T11:44:12.162Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 139 | deviation | .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md |  | Plan 06 Rule-3 deviation: § 6's 'not yet written' placeholder converted to an explicit plan-07 reservation to satisfy task 2's repo-wide no-placeholder gate without pre-empting criterion 4 | open |  | 2026-08-14T13:16:36.218Z |  |
| 2 | 140 | deviation | tests/tests/specs/candidate/candidate-journey.spec.ts | 47 | Rigidity contract drift: header declares '0 expect.soft' but the file carries 3 (measured at 568b1dfe). Out of ASSERT-06 scope (voter-journey.spec.ts only); filed by 140-01 rather than absorbed. | open |  | 2026-08-15T10:46:11.569Z |  |
| 3 | 140 | deviation | tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts | 43 | Rigidity contract drift: header declares 'NO expect.soft' but the file carries 6 (measured at 568b1dfe). Out of ASSERT-06 scope; filed by 140-01. | open |  | 2026-08-15T10:46:11.715Z |  |
| 4 | 140 | deviation | tests/tests/fixtures/candidate/candidateHomePage.fixture.ts | 23 | Rigidity contract drift: header declares 'NO expect.soft' but the file carries 4 (measured at 568b1dfe). Out of ASSERT-06 scope; filed by 140-01. | open |  | 2026-08-15T10:46:11.858Z |  |
| 5 | 140 | unrun-verify | tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts |  | Bank-auth journey SPEC not run in Phase 140's F3 control; only its teardown data lane was exercised (140-NEGATIVE-CONTROL.md § 19.6, § 22) | open |  | 2026-08-15T15:24:14.808Z |  |
| 6 | 140 | unrun-verify | .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-06-PLAN.md |  | Both verification:backstop truths (duplicated e2e-perm-notloc- prefix in one invocation; concurrent pre-clear tolerance) are reasoned, not observed (140-NEGATIVE-CONTROL.md § 22) | open |  | 2026-08-15T15:24:14.942Z |  |
| 7 | 151 | lint-warning | packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts | 30 | prettier printWidth: hand-wrapped declaration; format:check red at 151-03 baseline, DEFERRED per PD-03 | open |  | 2026-08-16T20:58:28.880Z |  |
| 8 | 151 | lint-warning | tests/README.md | 182 | prettier markdown table alignment: columns 3-5 under-padded; format:check red at 151-03 baseline, DEFERRED per PD-03 | open |  | 2026-08-16T20:58:29.034Z |  |
| 9 | 151 | unmet-truth | .planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md |  | 151-07 must-have 'surviving phase/spike references appear only in the collapsed short-pointer form' is NOT met: 108 attributive references (e.g. 'the Phase 64 fix') were deliberately reported instead of collapsed, because 'the see phase 64 fix' is ungrammatical. phase-ref/spike-ref gate rows stay red until plan 151-08. | open |  | 2026-08-17T07:05:45.227Z |  |
| 10 | 151 | deviation | .planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md |  | 151-07 Task 3 acceptance criteria 1 and 2 (zero '.planning/' paths, zero 'Plan NN-NN') are not met: 5 + 2 occurrences survive in Markdown prose and in an ESLint rule message string, both classes the same plan routes to the 151-08 agent pass. Plan-internal contradiction, enumerated in 151-HYGIENE-REPORT.md. | open |  | 2026-08-17T07:05:45.402Z |  |
| 11 | 151 | deviation | .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-prose-queue.tsv |  | 7 comment lines were rewritten correctly (reference removed) but read badly after a mid-sentence deletion, e.g. 'See for the trace.' Enumerated as 151-08's prose-polish queue. | open |  | 2026-08-17T07:05:45.533Z |  |
| 12 | 151 | deviation | apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte | 103 | Admitted shipped bug: admin Past Jobs section does not show past jobs; recorded not fixed per operator leave-and-record, carries an open product question | open |  | 2026-08-17T08:05:52.298Z |  |
| 13 | 151 | unrun-verify | .planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-grep-report.sh |  | hygiene --assert-clean exits 1 on task-id (84) and phase-ref bare (11); both KEEP-classified with measured justification, gate re-scoping left to operator | open |  | 2026-08-17T08:05:52.468Z |  |
| 14 | 151 | deviation | README.md | 12 | Front-page mascot image src=./docs/static/images/shiba-inu-facing-front.png broken by the layout move; blocked by F-15 (no slice pathspec claims README.md) | open |  | 2026-08-17T08:50:38.414Z |  |
| 15 | 151 | deviation | apps/frontend/jest.config.json |  | F-01 dead jest config; deletion blocked by F-15 (unclaimed by any slice pathspec) | open |  | 2026-08-17T08:50:38.585Z |  |
| 16 | 151 | deviation | apps/frontend/android |  | F-10 89 orphaned Capacitor files; deletion blocked by F-15 (unclaimed by any slice pathspec) | open |  | 2026-08-17T08:50:38.709Z |  |
| 17 | 151 | deviation | apps/supabase/supabase/schema/502-email-helpers.sql | 22 | F-21 yarn db:lint:sql exits 1 on four plpgsql_check warnings; greening it needs a breaking public-RPC signature change (operator decision) | open |  | 2026-08-17T10:54:24.731Z |  |
| 18 | 151 | deviation | apps/supabase/supabase/functions/identity-callback/claimConfig.ts | 34 | F-24 Signicat identity path keys account identity on birthdate, so two candidates sharing one collide into the same auth user; same design stated in the frontend (routed to 151-14) | open |  | 2026-08-17T10:54:24.887Z |  |
| 19 | 151 | deviation | apps/supabase/supabase/schema/200-indexes.sql |  | F-29 two join-table FKs have no covering index; fix is a migration, blocked by PD-02 on the F-21-red gate | open |  | 2026-08-17T10:54:25.019Z |  |
| 20 | 151 | deviation | apps/supabase/supabase/schema/302-rls.sql |  | F-30 22 of 52 triggers use prefixes outside the checklist's set; both remedies are the operator's | open |  | 2026-08-17T10:54:25.152Z |  |
| 21 | 151 | stub | packages/supabase-types/tsconfig.tsbuildinfo |  | F-31 packages/supabase-types/tsconfig.tsbuildinfo is a tracked build artifact (class of F-08, routed to 151-16) | open |  | 2026-08-17T10:54:25.286Z |  |
| 22 | 151 | deviation | apps/supabase/supabase/schema/400-storage.sql | 529 | F-32 storage_config stores a live service_role key in a plaintext column in production; remedy is Supabase Vault | open |  | 2026-08-17T10:54:25.431Z |  |
| 23 | 151 | deviation | apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md | 14 | F-33 apps/strapi (a path that never existed) appears 46 times across 16 files, 15 under apps/docs (routed to 151-16) | open |  | 2026-08-17T10:54:25.572Z |  |
| 24 | 151 | deviation | packages/dev-seed/src/cli/seed.ts | 123 | F-38: live forward-compatibility scaffolding for shipped plans — writer.write cast to (...args: Array<unknown>) defeats type-checking on a real call; D-13 excludes the restructure | open |  | 2026-08-17T11:44:11.884Z |  |
| 25 | 151 | deviation | packages/dev-seed/README.md |  | F-36: dev-seed has no locality guard; both CLIs fall back SUPABASE_URL ??= PUBLIC_SUPABASE_URL and seed:teardown has no env enforcement. Documented, not guarded — operator decision | open |  | 2026-08-17T11:44:12.028Z |  |
| 26 | 151 | lint-warning | packages/dev-seed/src/generators |  | F-39: 15 of the repo's 20 lint:check warnings, all unused-ctx on the uniform generator signature; the /^_/ remedy would move the phase-wide baseline | open |  | 2026-08-17T11:44:12.162Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "139",
    "file": ".planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md",
    "line": null,
    "description": "Plan 06 Rule-3 deviation: § 6's 'not yet written' placeholder converted to an explicit plan-07 reservation to satisfy task 2's repo-wide no-placeholder gate without pre-empting criterion 4",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T13:16:36.218Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "140",
    "file": "tests/tests/specs/candidate/candidate-journey.spec.ts",
    "line": 47,
    "description": "Rigidity contract drift: header declares '0 expect.soft' but the file carries 3 (measured at 568b1dfe). Out of ASSERT-06 scope (voter-journey.spec.ts only); filed by 140-01 rather than absorbed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T10:46:11.569Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "140",
    "file": "tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts",
    "line": 43,
    "description": "Rigidity contract drift: header declares 'NO expect.soft' but the file carries 6 (measured at 568b1dfe). Out of ASSERT-06 scope; filed by 140-01.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T10:46:11.715Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "140",
    "file": "tests/tests/fixtures/candidate/candidateHomePage.fixture.ts",
    "line": 23,
    "description": "Rigidity contract drift: header declares 'NO expect.soft' but the file carries 4 (measured at 568b1dfe). Out of ASSERT-06 scope; filed by 140-01.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T10:46:11.858Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "140",
    "file": "tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts",
    "line": null,
    "description": "Bank-auth journey SPEC not run in Phase 140's F3 control; only its teardown data lane was exercised (140-NEGATIVE-CONTROL.md § 19.6, § 22)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T15:24:14.808Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "unrun-verify",
    "phase": "140",
    "file": ".planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-06-PLAN.md",
    "line": null,
    "description": "Both verification:backstop truths (duplicated e2e-perm-notloc- prefix in one invocation; concurrent pre-clear tolerance) are reasoned, not observed (140-NEGATIVE-CONTROL.md § 22)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-15T15:24:14.942Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "lint-warning",
    "phase": "151",
    "file": "packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts",
    "line": 30,
    "description": "prettier printWidth: hand-wrapped declaration; format:check red at 151-03 baseline, DEFERRED per PD-03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-16T20:58:28.880Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "lint-warning",
    "phase": "151",
    "file": "tests/README.md",
    "line": 182,
    "description": "prettier markdown table alignment: columns 3-5 under-padded; format:check red at 151-03 baseline, DEFERRED per PD-03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-16T20:58:29.034Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unmet-truth",
    "phase": "151",
    "file": ".planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md",
    "line": null,
    "description": "151-07 must-have 'surviving phase/spike references appear only in the collapsed short-pointer form' is NOT met: 108 attributive references (e.g. 'the Phase 64 fix') were deliberately reported instead of collapsed, because 'the see phase 64 fix' is ungrammatical. phase-ref/spike-ref gate rows stay red until plan 151-08.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T07:05:45.227Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "deviation",
    "phase": "151",
    "file": ".planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md",
    "line": null,
    "description": "151-07 Task 3 acceptance criteria 1 and 2 (zero '.planning/' paths, zero 'Plan NN-NN') are not met: 5 + 2 occurrences survive in Markdown prose and in an ESLint rule message string, both classes the same plan routes to the 151-08 agent pass. Plan-internal contradiction, enumerated in 151-HYGIENE-REPORT.md.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T07:05:45.402Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "deviation",
    "phase": "151",
    "file": ".planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-prose-queue.tsv",
    "line": null,
    "description": "7 comment lines were rewritten correctly (reference removed) but read badly after a mid-sentence deletion, e.g. 'See for the trace.' Enumerated as 151-08's prose-polish queue.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T07:05:45.533Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte",
    "line": 103,
    "description": "Admitted shipped bug: admin Past Jobs section does not show past jobs; recorded not fixed per operator leave-and-record, carries an open product question",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T08:05:52.298Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "unrun-verify",
    "phase": "151",
    "file": ".planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-grep-report.sh",
    "line": null,
    "description": "hygiene --assert-clean exits 1 on task-id (84) and phase-ref bare (11); both KEEP-classified with measured justification, gate re-scoping left to operator",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T08:05:52.468Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "deviation",
    "phase": "151",
    "file": "README.md",
    "line": 12,
    "description": "Front-page mascot image src=./docs/static/images/shiba-inu-facing-front.png broken by the layout move; blocked by F-15 (no slice pathspec claims README.md)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T08:50:38.414Z",
    "resolved_at": null
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/frontend/jest.config.json",
    "line": null,
    "description": "F-01 dead jest config; deletion blocked by F-15 (unclaimed by any slice pathspec)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T08:50:38.585Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/frontend/android",
    "line": null,
    "description": "F-10 89 orphaned Capacitor files; deletion blocked by F-15 (unclaimed by any slice pathspec)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T08:50:38.709Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/supabase/supabase/schema/502-email-helpers.sql",
    "line": 22,
    "description": "F-21 yarn db:lint:sql exits 1 on four plpgsql_check warnings; greening it needs a breaking public-RPC signature change (operator decision)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T10:54:24.731Z",
    "resolved_at": null
  },
  {
    "id": 18,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/supabase/supabase/functions/identity-callback/claimConfig.ts",
    "line": 34,
    "description": "F-24 Signicat identity path keys account identity on birthdate, so two candidates sharing one collide into the same auth user; same design stated in the frontend (routed to 151-14)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T10:54:24.887Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/supabase/supabase/schema/200-indexes.sql",
    "line": null,
    "description": "F-29 two join-table FKs have no covering index; fix is a migration, blocked by PD-02 on the F-21-red gate",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T10:54:25.019Z",
    "resolved_at": null
  },
  {
    "id": 20,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/supabase/supabase/schema/302-rls.sql",
    "line": null,
    "description": "F-30 22 of 52 triggers use prefixes outside the checklist's set; both remedies are the operator's",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T10:54:25.152Z",
    "resolved_at": null
  },
  {
    "id": 21,
    "kind": "stub",
    "phase": "151",
    "file": "packages/supabase-types/tsconfig.tsbuildinfo",
    "line": null,
    "description": "F-31 packages/supabase-types/tsconfig.tsbuildinfo is a tracked build artifact (class of F-08, routed to 151-16)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T10:54:25.286Z",
    "resolved_at": null
  },
  {
    "id": 22,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/supabase/supabase/schema/400-storage.sql",
    "line": 529,
    "description": "F-32 storage_config stores a live service_role key in a plaintext column in production; remedy is Supabase Vault",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T10:54:25.431Z",
    "resolved_at": null
  },
  {
    "id": 23,
    "kind": "deviation",
    "phase": "151",
    "file": "apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md",
    "line": 14,
    "description": "F-33 apps/strapi (a path that never existed) appears 46 times across 16 files, 15 under apps/docs (routed to 151-16)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T10:54:25.572Z",
    "resolved_at": null
  },
  {
    "id": 24,
    "kind": "deviation",
    "phase": "151",
    "file": "packages/dev-seed/src/cli/seed.ts",
    "line": 123,
    "description": "F-38: live forward-compatibility scaffolding for shipped plans — writer.write cast to (...args: Array<unknown>) defeats type-checking on a real call; D-13 excludes the restructure",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T11:44:11.884Z",
    "resolved_at": null
  },
  {
    "id": 25,
    "kind": "deviation",
    "phase": "151",
    "file": "packages/dev-seed/README.md",
    "line": null,
    "description": "F-36: dev-seed has no locality guard; both CLIs fall back SUPABASE_URL ??= PUBLIC_SUPABASE_URL and seed:teardown has no env enforcement. Documented, not guarded — operator decision",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T11:44:12.028Z",
    "resolved_at": null
  },
  {
    "id": 26,
    "kind": "lint-warning",
    "phase": "151",
    "file": "packages/dev-seed/src/generators",
    "line": null,
    "description": "F-39: 15 of the repo's 20 lint:check warnings, all unused-ctx on the uniform generator signature; the /^_/ remedy would move the phase-wide baseline",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-17T11:44:12.162Z",
    "resolved_at": null
  }
]
````
