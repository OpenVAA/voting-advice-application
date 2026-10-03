---
phase: 168-docs-site-rewrite-strapi-to-supabase
plan: 08
subsystem: docs-content
status: complete
tags: [docs, audit-ledger, gsd-doc-verifier, gates, todos, residue, d-11, security-todo]

requires:
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-01/01.1: validate-links (seven classes), check-claims.mjs, the two-base span gate, docs lint in lint:check"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-02: D-02 tree and 26 redirect stubs; 168-03..07: every page written or audited, with claim ledgers and findings"
provides:
  - "Final D-22 gate set green on the final tree (Task 1) and re-run after the one page-level fix (Task 3)"
  - "Independent gsd-doc-verifier pass over all 58 changed pages reconciled against the claim ledgers (0 BLOCKER / 0 FAIL)"
  - "D-11 commands run once with redacted evidence; secret scan clean; local Supabase left as found"
  - "Three todos closed, password-reset annotated and left open, ten residue todos filed (one security), five existing todos annotated"
  - "Complete 168-DOCS-AUDIT.md: verifier reconciliation, routing of every finding, 26 stubs to retire, no-product-change probe, handoff to 169"
affects: [169-dependency-upgrades, docs-ci, candidate-auth, deployment, claude-md]

actuals:
  tokens: 25800
  tasks: 3
  commits: 3
plan_head_before: 4dee167c609c0294518a1247ecdb7e8aabd3fde1
plan_head_after: db73e2801bc0208a9111e605dac3488f49df399a

tech-stack:
  added: []
  patterns:
    - "Verifier pass through uniquely named page copies (MANIFEST.txt + SOURCES.tsv), so parallel results never overwrite each other"
    - "Redacted D-11 evidence quotes only non-key status lines; the perl filter alone misses table rows separated by │"
    - "Findings routed by class: one todo per class (README/comment drift, deployment config, CLAUDE.md), dated notes on existing todos"

key-files:
  created:
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence/168-08-verifier-reconciliation.md
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence/168-08-d11-runs.md
    - .planning/todos/pending/2026-10-01-docs-link-check-on-pull-requests.md
    - .planning/todos/pending/2026-10-01-claude-md-stale-claims-found-by-docs-rewrite.md
    - .planning/todos/pending/2026-10-02-oidc-callback-does-not-verify-nonce.md
    - .planning/todos/pending/2026-10-02-readme-comment-and-skill-drift-found-by-docs-rewrite.md
    - .planning/todos/pending/2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md
    - .planning/todos/pending/2026-10-02-admin-with-candidate-grant-locked-out-of-admin-app.md
    - .planning/todos/pending/2026-10-02-voter-statement-weights-and-live-top-results-not-implemented.md
    - .planning/todos/pending/2026-10-02-routing-and-locale-findings-from-docs-rewrite.md
    - .planning/todos/pending/2026-10-02-password-validator-username-never-passed.md
    - .planning/todos/pending/2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md
  modified:
    - apps/docs/src/routes/(content)/developers-guide/localization/localization-in-strapi/+page.ts
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-DOCS-AUDIT.md
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-07-CLAIMS.md
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence/168-08-gates.md
    - .planning/todos/done/2026-08-28-broken-docs-script-references.md (moved from pending, Resolution added)
    - .planning/todos/done/register-page-registrationkey-method.md (moved from pending, Resolution added)
    - .planning/todos/done/configurable-mock-data.md (moved from pending, Resolution added)
    - .planning/todos/pending/password-reset-code-method.md
    - .planning/todos/pending/2026-09-02-forgot-password-pkce-code-not-exchanged.md
    - .planning/todos/pending/2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md
    - .planning/todos/pending/2026-09-21-preregister-route-discards-email-and-nominations.md
    - .planning/todos/pending/2026-08-28-reintroduce-the-local-data-adapter.md

key-decisions:
  - "The verifier pass found 0 BLOCKER/FAIL in 1022 claims; the q-info/arg-cond prefixes are sourced from commit history (an editorial convention, no code enforces it), kept as written, with package-name rows #215-216 added to 168-07-CLAIMS.md"
  - "configurable-mock-data.md closed rather than narrowed: dev-seed satisfies configurable generation; seeding on initialise was never asked for as such"
  - "password-reset-code-method.md stays open while the ?code= branch exists (D-18); the measured PKCE todo is the one to fix first"
  - "The localization-in-strapi stub now targets Multi-locale data, where its surviving content lives (168-05 F4)"
  - "The OIDC nonce gap (168-06 F7) is a dedicated todo marked security: true, not folded into wording fixes"
  - "D-11 evidence omits the Supabase key tables entirely because the plan's perl filter misses │-separated S3 key rows"
  - "Supabase was already running and was left running; yarn dev was stopped by process group; no Docker restart, no supabase stop --all"

patterns-established:
  - "Residue routing table: every Findings-for-todos row maps to a todo, a dated note on an existing todo, or a closed todo's Resolution"
  - "Phase handoff: the next phase's gate re-runs exact commands with the recorded SHAs written inline"

requirements-completed: [DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07, DOCS-08]

coverage:
  - id: D1
    description: "Independent gsd-doc-verifier pass over all 58 changed pages reconciled against the claim ledgers"
    requirement: DOCS-04
    verification:
      - kind: other
        ref: "node scripts/check-claims.mjs ledger 168-03..07-CLAIMS.md (2176 rows pass); check-claims.mjs commands over 83 pages (201 resolve)"
        status: pass
      - kind: other
        ref: "gate-evidence/168-08-verifier-reconciliation.md: 58 result files, 1022 checked / 1022 passed / 0 BLOCKER-FAIL"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-11 commands run once with redacted evidence; secret scan over gate-evidence exits 1"
    requirement: DOCS-04
    verification:
      - kind: manual_procedural
        ref: "gate-evidence/168-08-d11-runs.md (yarn install, db:start, db:seed --template default, yarn dev HTTP 200, generate:docs, check, build: all exit 0)"
        status: pass
      - kind: other
        ref: "grep -r -E 'eyJ[A-Za-z0-9_-]{20,}|sb_(secret|publishable)_[A-Za-z0-9]' gate-evidence -> exit 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Four todos settled per D-13/D-18 (three closed via git mv with Resolutions, password-reset annotated and left open)"
    requirement: DOCS-05
    verification:
      - kind: other
        ref: "Task 3 verify 1 (test -f done/... && test ! -e pending/... && residue todos exist) -> exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Ledger complete: Verifier reconciliation, Sweep exceptions, Residue (routing table, 26 stubs), Handoff to Phase 169; no Pages row pending"
    requirement: DOCS-02
    verification:
      - kind: other
        ref: "Task 3 verify 2 (section greps, pending count 0, secret scan) -> exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Final gates green after the page fix: validate:links --check, two-base check:research-quotes, docs lint, root lint:check, format:check, generate:docs idempotent"
    requirement: DOCS-08
    verification:
      - kind: other
        ref: "gate-evidence/168-08-gates.md § Task 3 re-run (all exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Residue todos filed, including the security todo for the unchecked OIDC nonce (severity major, UNCONFIRMED by run)"
    verification:
      - kind: other
        ref: "test -f .planning/todos/pending/2026-10-02-oidc-callback-does-not-verify-nonce.md"
        status: pass
    human_judgment: true
    rationale: "The nonce todo's final severity, and the operator questions in the residue todos (link check on PRs, dual-grant admins, weights, deep merge), need an owner's decision"

duration: 38min
completed: 2026-10-02
---

# Phase 168 Plan 08: Final gates, verifier reconciliation, D-11 runs, todos and ledger close-out Summary

**An independent verifier pass over all 58 changed docs pages checked 1022 claims and found 0 BLOCKER or FAIL. All seven D-11 commands ran with redacted evidence. Three todos closed, and every 168-03..07 finding now sits in a todo or a dated note, including a new security todo for the OIDC nonce the callback never checks. The ledger ends with the 26 stubs to retire and the exact commands Phase 169's gate re-runs.**

## Performance

- **Duration:** about 38 min. Task 1 ran from 2026-10-02T12:29Z (after the 168-07 state commit) to its commit at 12:35Z. The orchestrator's verifier pass followed. Task 3 ran from 12:40Z to 13:07Z.
- **Started:** 2026-10-02T12:29:17Z
- **Completed:** 2026-10-02T13:07:24Z
- **Tasks:** 3 of 3. Task 1 was the tracer. Task 2 was a checkpoint, with the verifier run by the orchestrator. Task 3 was auto.
- **Files modified:** 26 in the plan diff (`git diff --name-only 4dee167c6..db73e2801`)

## Accomplishments

- **Verifier reconciliation (D-09).** All 58 result files exist, each with `claims_checked > 0`: 1022 checked, 1022 passed, 0 BLOCKER/FAIL.
  - The caveats are recorded honestly: mostly existence and grep checks, behaviour claims spot-checked, claim counts as hand tallies, runtime flows not run.
  - The one item with no source, the `q-info` / `arg-cond` prefixes on Contribute, is sourced from the commit history (10 and 14 subjects, against 1 using a full name). No commitlint enforces it. It is kept as written, and package-name rows #215–#216 were added to `168-07-CLAIMS.md`.
  - The claim ledgers were re-checked on the final tree: `ledger` passes all 2176 rows, and `commands` resolves 201 commands.
- **D-11 runs:**
  - `yarn install`: 0.
  - `yarn db:start`: 0. This project's stack was already running and was left running.
  - `yarn db:seed --template default`: 0, 752 rows.
  - `yarn dev` start-up: HTTP 200 on 5173 after 11 s, then the process group was stopped.
  - `generate:docs`: 0 and idempotent.
  - Docs `check`: 0. Docs `build`: 0.
  - The evidence omits the key tables. The secret scan and a hex-key probe both exit 1.
- **Todos (D-13, D-18):**
  - `2026-08-28-broken-docs-script-references.md`, `register-page-registrationkey-method.md` and `configurable-mock-data.md` moved to `done/` with `git mv`, each with a `## Resolution`.
  - `password-reset-code-method.md` is annotated with 168-06's reading and stays open.
- **Residue (D-04):**
  - The two plan-named todos are filed: the link check on pull requests, and the stale CLAUDE.md claims (seeding on start, theme colours, the Render env set; no cache-disk claim remains).
  - Eight more todos cover the other findings, one of them the dedicated **security** todo for the unchecked OIDC nonce.
  - Dated notes were added to five existing todos.
  - Every `## Findings for todos` row from 168-03..07 is routed, 168-07 F1–F4 included. The table is in the ledger § Residue.
- **Page fix:** the `localization-in-strapi` redirect stub now targets Multi-locale data, which settles 168-05 F4 (`d2dee9d6f`).
- **Ledger:**
  - `## Verifier reconciliation`, `## Residue` (routing table, 26 stubs listed, verifier warnings), the no-product-change probe and `## Handoff to Phase 169`.
  - Eight 168-08 decisions added to `## Decisions recorded at execution`.

## Task Commits

1. **Task 1: final gate set, sweeps, verifier inputs** (tracer): `6c9117378` (docs)
2. **Task 2: independent gsd-doc-verifier pass** (checkpoint): no commit. The orchestrator spawned the verifiers, which wrote gitignored results under `.planning/tmp/`.
3. **Task 3: reconciliation, D-11, todos, residue, ledger:**
   - `d2dee9d6f` docs[docs]: point the localization-in-strapi stub at Multi-locale data
   - `db73e2801` docs(168-08): reconcile the verifier pass, run D-11, settle todos, finish the ledger

**Plan metadata:** this SUMMARY's commit, followed by the STATE/ROADMAP/REQUIREMENTS update.

## Files Created/Modified

- `gate-evidence/168-08-verifier-reconciliation.md`: the pass, its caveats, the `q-info` / `arg-cond` resolution, and a 58-row per-page table (page, copy, owning ledger, counts, disposition).
- `gate-evidence/168-08-d11-runs.md`: the seven commands with exit codes and redacted excerpts, plus the secret scan.
- `gate-evidence/168-08-gates.md`: new § Task 3 re-run.
- `168-DOCS-AUDIT.md`: Verifier reconciliation, decisions, Residue (todos, annotated todos, routing table, 26 stubs, warnings, probe), Handoff to Phase 169. Rows 25 and 57 now note the stub retarget.
- `168-07-CLAIMS.md`: rows #215–#216.
- `apps/docs/…/localization-in-strapi/+page.ts`: the redirect target.
- Todos: 3 moved to `done/`, 10 created, 6 annotated (listed in the frontmatter).

## Decisions Made

See `key-decisions` above and `168-DOCS-AUDIT.md` § Decisions recorded at execution (the 168-08 entries).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] D-11 evidence omits the Supabase key tables instead of relying on the plan's perl filter**
- **Found during:** Task 3, D-11 `yarn db:start`.
- **Issue:** The plan's redaction filter replaces values after `:` or `=`. The Supabase CLI prints its S3 access key and secret key in a table separated by `│`, so the filter left both values intact in the redacted stream.
- **Fix:** The evidence quotes only the non-key status lines, and the key tables are omitted. A hex-key probe was added to the secret scan, and both exit 1. The raw logs lived outside the repo and were deleted.
- **Files modified:** `gate-evidence/168-08-d11-runs.md`
- **Committed in:** `db73e2801`

**2. [Scope, settles a recorded finding] Retargeted the `localization-in-strapi` stub (168-05 F4)**
- **Found during:** Task 3, routing the findings.
- **Issue:** 168-05 F4 said 168-08 may prefer Multi-locale data as the stub target, because the old page's surviving content lives there.
- **Fix:** The stub target was changed, and ledger rows 25 and 57 updated. `validate:links --check` (stub class 0), the span gate, docs lint, root `lint:check` / `format:check` and `generate:docs` idempotence were all re-run green.
- **Files modified:** `apps/docs/src/routes/(content)/developers-guide/localization/localization-in-strapi/+page.ts`, `168-DOCS-AUDIT.md`
- **Committed in:** `d2dee9d6f` (page), `db73e2801` (ledger)

**3. [Convention] The page-fix commit uses `docs[docs]:`, not the plan's `docs(docs):`.** The contributing guide sets the bracketed form, and 168-02 to 168-07 made the same change. The orchestrator's resume instructions also name `docs[docs]:`.

**4. [Interpretation] Findings grouped by class rather than one todo each.** The plan requires every finding row to become a todo or a note, with none dropped. Same-class findings went into one todo each: README and comment drift (9 items), deployment config (4 items), and CLAUDE.md (3 items). Distinct behaviour questions got their own todos. "No action" rows (168-04 F4, 168-04 F8, 168-03 F8) are recorded in a todo or a Resolution, so the routing table has no gap.

---

**Total deviations:** 1 auto-fixed (Rule 2), 1 scoped fix of a recorded finding, 1 convention, 1 interpretation. **Impact:** No product code changed. The extra redaction strictly tightens PROH-03.

## Issues Encountered

- A first background start of `yarn dev` failed to launch, because zsh rejected `set -m` inside a subshell, so nothing started and nothing needed stopping. It was re-run under `bash -c 'set -m; …'` so the dev server got its own process group and could be stopped as a whole.
- `yarn install` printed the two pre-existing warnings (YN0060 `zod`, YN0002 `playwright-core`), which belong to other workspaces. No lockfile change.
- `generate:docs` prints six `failed to load language javascript/css` lines from the syntax highlighter, as the 168-07 pipeline record also shows. The exit status is 0.

## Requirements

**DOCS-01..08 are marked complete; this is the phase's final plan.** The evidence for each:

- **DOCS-01:**
  - `navigation.config.ts` has no `// New` / `// Removed` marker and no Strapi title.
  - Regeneration is idempotent.
  - `## Pages` has no `pending` row.
- **DOCS-02:**
  - Every page has a verdict row.
  - The two-base span gate is green, with 168-01 and 168-01.1 negative controls.
  - **Caveat:** the requirement text says `ResearchQuote.svelte` and `ReferenceList.svelte` are "unchanged". Under the operator ruling of 2026-10-02 (Option B), both received lint-only edits in `6090476cc`, and the component freeze was re-anchored there. DOCS-02 is satisfied as that ruling amended it. Rewording the requirement to match is suggested.
- **DOCS-03:** the 168-08 sweeps show only ledger-recorded exceptions.
- **DOCS-04:** the ledgers pass, the independent verifier pass is reconciled, every command resolves, and the D-11 runs are recorded with redacted evidence.
- **DOCS-05:** the todos are settled as the requirement specifies.
- **DOCS-06:** the 168-01.1 repairs are in place, and the broken-scripts todo is now closed.
- **DOCS-07:** all seven link classes were observed red in 168-01, and the gate is green now.
- **DOCS-08:** docs lint is red-observed in 168-01.1 and all gates are green now.

## Known Stubs

None. No placeholder content was added. The 26 redirect stubs are intentional (D-04) and are listed for retirement in the ledger.

## Threat Flags

None. The plan's diff adds no endpoint, auth path or schema change. The new security todo records an existing gap; it does not introduce one.

## User Setup Required

None.

## Next Phase Readiness

- Phase 168 is complete. Phase 169's gate re-runs `validate:links --check`, the two-base `check:research-quotes` (base `0ec229dfe7ee26eafa21882fa37f6d49817e51f9`, component base `6090476cc44aa995e3b36368b8a605c96e4ccc1a`) and the docs `build` (ledger § Handoff to Phase 169).
- Operator attention:
  - The security todo `2026-10-02-oidc-callback-does-not-verify-nonce.md`.
  - The link-check-on-PRs decision.
  - The likely-breaking `PUBLIC_PROJECT_ID` gap in the deployment templates (`2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md`, item 1).

## Self-Check: PASSED

- FOUND: `gate-evidence/168-08-verifier-reconciliation.md`, `gate-evidence/168-08-d11-runs.md`, the three `done/` todos, `2026-10-01-docs-link-check-on-pull-requests.md`, `2026-10-01-claude-md-stale-claims-found-by-docs-rewrite.md`, `2026-10-02-oidc-callback-does-not-verify-nonce.md`.
- FOUND commits: `6c9117378`, `d2dee9d6f`, `db73e2801`.
- Task 3 acceptance:
  - verify 1 (todo states) exit 0.
  - verify 2 (secret scan, four sections, 0 pending) exit 0.
  - verify 3 (`validate:links --check`, the two-base span gate, `lint:check`, `format:check`) all exit 0.
- `commits: 3` measured with `git rev-list --count 4dee167c6..HEAD` at SUMMARY time.
