---
phase: 189-documentation-and-closure
plan: "15"
subsystem: docs
tags: [docs, runbook, infra, bootstrap, aws, observations, back-links, c-01, a-01]
status: complete

requires:
  - phase: 187 (plans 187-19, 187-21)
    provides: run 44104573552 (2026-11-17) and its digest-step and plan-role evidence
  - phase: 189 (plans 189-07, 189-12, 189-14)
    provides: the guide, hosted-settings and operations pages whose runbook links the back-links answer
provides:
  - "infra/bootstrap/README.md: § Not yet observed deleted; two 2026-11-17 Observations rows (S8 the read-only plan role read all a pipeline plan needs, S10 a workflow assumed the plan role), both from run 44104573552"
  - "infra/envs/staging/aws/README.md: § Not yet observed deleted; one 2026-11-17 row (S11 running-image-digest.sh on a tag-named task definition)"
  - "35 `← guide:` back-links: 12 in infra/README.md, 5 in infra/bootstrap/README.md, 18 in infra/envs/staging/aws/README.md"
  - "Pending todo: Unobserved statements about the deployed stack (189), holding S3, S4 and S7 with their checks"
  - "evidence/189-15-c01-bootstrap-aws.md: C01_S3 to C01_S13"
affects: [189-16, 189-20]

actuals:
  tokens: 12582
  tasks: 3
  commits: 3
plan_head_before: c9f7251cd866e678648241cfaef5893e1fb8c06e
plan_head_after: 58c9688889d36e6c1cd32882fc8fb68b5fe198f3

tech-stack:
  added: []
  patterns:
    - "Runbook back-link: one `← guide: [<page> § <section>](https://openvaa.org/developers-guide/<route>#<id>)` paragraph under each heading a docs page links to, one per citing section, checked by validate:links class inbound"

key-files:
  created:
    - .planning/todos/pending/2026-11-20-189-unobserved-statements-about-the-deployed-stack.md
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-15-c01-bootstrap-aws.md
  modified:
    - infra/bootstrap/README.md
    - infra/envs/staging/aws/README.md
    - infra/README.md

key-decisions:
  - "S11 (running-image-digest.sh on a service whose task definition names a tag) became a dated 2026-11-17 row rather than a todo entry: run 44104573552's digest step printed running_image_reference=tag on task definition :6, and the script run from the workstation the same day printed the same lines (187-19 and 187-21 evidence), so C-01's rule (an existing record settles it, so a dated row) applies"
  - "New Observations rows dated 2026-11-17 were placed after each table's last 2026-11-17 row, not after its last row, so the table stays in date order"
  - "DOCS-03 and DOCS-01 are not marked complete: plan 189-16 still sweeps the dns-mail and Supabase runbooks and adds their back-links, and 189-20 is the closing verification"

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "Bootstrap runbook: § Not yet observed deleted, S8 and S10 as dated rows, S6 and S9 settled by rows, S5 moot, S3/S4/S7 into the new todo with checks"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 1 <verify> (section absent, C01_S3..S10 present, 44104573552 cited, todo ## Statements, prettier --check): exit 0; acceptance grep -c '^- ' todo = 3"
        status: pass
    human_judgment: false
  - id: D2
    description: "Staging AWS runbook: § Not yet observed deleted, S11 as a dated row, S12 and S13 settled by the 2026-11-18/19 rows"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 2 <verify> without its todo clause (section absent, C01_S11..S13 present, prettier --check): exit 0; the todo clause (grep running-image-digest in the todo) exit 1 by the S11 deviation; acceptance grep -c '^## Observations' = 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Back-links from the three runbooks to the guide, hosted-settings and operations pages"
    requirement: DOCS-01
    verification:
      - kind: other
        ref: "Task 3 <verify> (back-link in each file, prettier --check, yarn workspace @openvaa/docs validate:links --check 0 findings, 92 inbound references): exit 0; mutation (#teardown-mutant) exit 1 with the finding; acceptance grep -c '← guide:' aws README = 18"
        status: pass
    human_judgment: false
---

# Phase 189 Plan 15: Bootstrap and staging AWS runbooks swept of unobserved statements, back-linked to the guide — Summary

**The bootstrap and staging AWS runbooks lost their "Not yet observed" sections: four statements became 2026-11-17 rows from run 44104573552, five were settled by existing rows or were moot, three went into a new pending todo with their checks. 35 `← guide:` back-links now resolve in `validate:links --check`.**

## Performance

- **Started:** 2026-11-21T07:43:54Z
- **Completed:** 2026-11-21T07:47Z
- **Tasks:** 3
- **Files modified:** 5 (3 runbooks, 1 todo, 1 evidence file)

## Accomplishments

- `infra/bootstrap/README.md`: S3 to S10 disposed of. S8 and S10 are new rows citing run 44104573552 (the plan role, which holds `ReadOnlyAccess` and `openvaa-plan-deny`, planned the staging AWS root with every step green and `plan_exit=2`; the workflow assumed it as `pr-plan-44104573552`). S6 is settled by the 2026-10-21 row and S9 by the 2026-11-18 row. S5 is moot after the 2026-10-22 row. S3, S4 and S7 went into the todo. The section, its heading and its preamble are deleted.
- `infra/envs/staging/aws/README.md`: S11 is a new row (see Deviations), S12 and S13 are settled by the 2026-11-18 row of run 44270824581 (and the 2026-11-19 row). The section is deleted. `## Observations` is still there.
- The todo `2026-11-20-189-unobserved-statements-about-the-deployed-stack.md` uses the 174 todo's frontmatter keys without `completed`/`status`, with `source: Phase 189 (C-01)`. It has `## Problem` and `## Statements`: the budget mail and its latency (with the INFRA-15 accept-console-alert ruling), the forecast alert, and one OIDC provider per URL, each with its check. Plan 189-16 adds its own statements here.
- Back-links: every link from the deployment, hosted-settings and operations pages into the three runbooks has one `← guide:` line under its heading for each citing section, with no duplicates and no other text added. The pairs were derived by script from the docs pages, so they reflect the pages at run time.
- The dated rows that contain the search phrase (bootstrap 2026-11-16 Step 9 item 6 and 2026-11-17 run 44042442267) were not edited.

## Task Commits

1. **Task 1 (tracer): bootstrap runbook's statements disposed of, the todo begun.** `29a150e51`. Tracer gate: the verify was re-run end-to-end and exited 0, then the plan continued.
2. **Task 2: staging AWS runbook's statements disposed of.** `3150a1418`.
3. **Task 3: back-links to the guide.** `58c968888`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] S11 settled by an existing record, so it became a dated row instead of a todo entry**
- **Found during:** Task 1 read_first (the 187 evidence for run 44104573552)
- **Issue:** The plan carries S11 ("`running-image-digest.sh` reads the digest of a running service whose task definition names its image by a tag") into the todo as no longer arising on staging. But `evidence/187-19-pr-plan.md` § The plan job records run 44104573552's digest step on 2026-11-17, while the service ran task definition `:6` with a tag-named image, printing `running_image_reference=tag` and the tag's digest. `evidence/187-21-green-run.md` records the script run from the workstation the same day printing the same lines. C-01, a locked decision, says a statement an existing record settles becomes a dated row.
- **Fix:** Added a 2026-11-17 row to the AWS runbook citing the run. Wrote `C01_S11=row 2026-11-17`. Left S11 out of the todo.
- **Consequence:** The Task 2 `<verify>` clause `grep -q 'running-image-digest' <todo>` exits 1. The verify's other clauses were run on their own and exited 0. The must-have truth "S11 … carried into the todo" is replaced by this row.
- **Files modified:** infra/envs/staging/aws/README.md, evidence/189-15-c01-bootstrap-aws.md
- **Commit:** `3150a1418`

**2. [Rule 1 - Ordering] New 2026-11-17 rows placed in date position, not after each table's last row**
- **Issue:** The plan says to append the new rows after the last row so each table stays in date order. Each table's last rows are dated 2026-11-18 or later, so appending 2026-11-17 rows at the end would break the date order the rule exists to keep.
- **Fix:** Each new row sits right after its table's last 2026-11-17 row. No existing row was edited.
- **Commits:** `29a150e51`, `3150a1418`

## Checks

- Task 1 verify: exit 0. Acceptance `grep -c '^- '` on the todo: 3.
- Task 2 verify without the todo clause: exit 0. The todo clause: exit 1 (deviation 1). `grep -c '^## Observations'` on the AWS runbook: 1.
- Task 3 verify: back-link present in all three files, `prettier --check` exit 0, `yarn workspace @openvaa/docs validate:links --check` exit 0 with 0 findings (92 inbound references). A mutation that changed one back-link to `#teardown-mutant` made it exit 1 with `No id "teardown-mutant"`, and the change was reverted. `grep -c '← guide:'`: aws 18, infra 12, bootstrap 5.
- E2E: no project affected; delta 0. `yarn lint:check` was not run: the plan changed markdown only, and ESLint does not lint it.

## Deferred Issues

None.

## Known Stubs

None.

## Self-Check: PASSED
