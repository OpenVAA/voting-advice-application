---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 13
subsystem: infra
tags: [audit-baseline, yarn-npm-audit, dependabot, version-table, age-rule, postgres-17, pgtap, e2e, phase-gate, deno-edge-functions, nodemailer]

requires:
  - phase: 169-12
    provides: "Kit 3 HOLD-AGE verdict + todo; the full group 0–10 tree at 9e3301a35 (every gate green at 169-10/169-11, CI 12/12 at 169-11)"
  - phase: 169-RULINGS
    provides: "local Postgres 17.6 with is_valid_choice_id STABLE; ESLint 10.11.0 with three scoped disables"
  - phase: 169-01
    provides: "the re-keyed audit gate (liveness on the audit's own exit status, zero-row baseline legal), 169-version-probe.mjs, 169-gates.sh, 169-e2e.sh"
provides:
  - "security/audit-baseline.json reconciled by hand: all 68 rows dropped (each checked against GitHub's range and the resolved version), accepted: [], a current note with no history"
  - "the end-of-phase version table: 67 packages, current 47, HOLD-7d 13, HOLD-30d 5, major 2 (both held), in-major 0; every non-current row backed by a § 3 hold"
  - "the moderate/low listing (D-05) and nodemailer 6.9.10's open advisories on the held Deno pin"
  - "18 new pending todos + the updated Dependabot (D-30) and nodemailer todos"
  - "the phase gate on one HEAD be000f31a: 12/12 gates, pgTAP 1335/1335 + db:lint:sql 0 on Postgres 17.6, full E2E 171/171/0/0/0 after a clean reset"
affects: [phase-169-verification, phase-169-code-review, v2.15-ship, next-dependency-pass]

actuals:
  tokens: 40943   # chars/4 over git diff 9e3301a35..df2112ea9 (163773 chars; one JSON file + .planning docs, no source code)
  tasks: 3
  commits: 3      # MEASURED: git rev-list --count 9e3301a35..df2112ea9 (the SUMMARY and state commits follow)
plan_head_before: 9e3301a35a3bcf66bb7fa6e4d83c449f8248a9fb
plan_head_after: df2112ea93832704a2dd885ac4aef205ccd16cdf

tech-stack:
  added: []
  patterns:
    - "A baseline row leaves only with row-by-row evidence: GitHub's vulnerable range for that package against every version yarn.lock resolves, or the package's absence (yarn why empty)"
    - "Every hold, operator item and residue in the ledger maps to a pending todo or a summary line (the § 7 disposition table)"

key-files:
  created:
    - .planning/todos/pending/2026-10-03-deno-edge-imports-invisible-to-audit-deps.md
    - .planning/todos/pending/2026-10-03-upgrade-hosted-postgres-to-17.md
    - .planning/todos/pending/2026-10-03-render-node-24-deploy-watch.md
    - .planning/todos/pending/2026-10-03-typescript-7-held.md
    - .planning/todos/pending/2026-10-03-widen-dependabot-after-v2-15-merge.md
    - .planning/todos/pending/2026-10-03-remove-docs-vitest-browser-config.md
    - .planning/todos/pending/2026-10-03-age-held-majors-recheck.md
    - .planning/todos/pending/2026-10-03-watch-first-main-run-of-release-and-docs-workflows.md
    - .planning/todos/pending/2026-10-03-root-glob-devdependency-has-no-importer.md
    - .planning/todos/pending/2026-10-03-docs-eslint-config-prettier-unused.md
    - .planning/todos/pending/2026-10-03-playwright-163-trace-cost-and-thin-ci-performance-margin.md
    - .planning/todos/pending/2026-10-03-auth-cookie-cache-control-vs-route-setheaders.md
    - .planning/todos/pending/2026-10-03-supabase-config-inbucket-section-deprecated.md
    - .planning/todos/pending/2026-10-03-ai-sdk-7-allow-system-in-messages-opt-in.md
    - .planning/todos/pending/2026-10-03-edge-email-functions-have-no-e2e-coverage.md
    - .planning/todos/pending/2026-10-03-dev-host-docker-credential-helper-and-image-reclaim.md
    - .planning/todos/pending/2026-10-03-ci-yarn-dedupe-check-decision.md
    - .planning/todos/pending/2026-10-03-docs-scripts-tsconfig-does-not-typecheck.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-13-SUMMARY.md
  modified:
    - security/audit-baseline.json
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-VERSION-TABLE.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md
    - .planning/todos/pending/2026-09-03-dependabot-alert-list-is-stale-against-main.md
    - .planning/todos/pending/2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md

key-decisions:
  - "The baseline was rewritten by hand, not with --update-baseline (orchestrator rule): it mirrors what updateBaseline emits on a tree with no findings (recorded 2026-10-03, recordedAtHead 9e3301a35, accepted [])."
  - "All 68 rows were dropped because the audit no longer reports any of them; each drop is justified row by row in EVIDENCE § 6 (GitHub range vs resolved version, or package absent). No row survived, so no 'no fixed version' / 'held:' note was needed."
  - "The braces review item (169-01) is resolved by removal: braces left the tree with changesets 3 (169-10). DEPS-02 closes."
  - "The nodemailer 10 Edge pin was NOT applied: 169-13 ran ~13 h before 10.0.11 clears the age rule (2026-10-04T07:51Z). DEPS-09 stays Pending for that reason only."
  - "DEPS-12 is complete: its text admits 'held with a reason'; dotenv 18 and intl-messageformat 12 are held by the 30-day rule with a dated todo, and nothing is unassigned (in-major 0)."
  - "No confirm-vite-8-browser-floor todo: the operator accepted Vite 8's default target (ruling R4)."
  - "The three Splinter 'foreign keys without indexes' warnings in db:lint:sql are pre-existing and informational (exit 0, output identical to the rulings PG17 run and the PG15 runs); not treated as a gate failure."

patterns-established:
  - "End-of-phase ledger close: version table → § 3 cross-check of every non-current row → todo per hold/operator item → disposition table in § 7"

requirements-completed: [DEPS-01, DEPS-02, DEPS-08, DEPS-12, DEPS-15, DEPS-16]

coverage:
  - id: D1
    description: "The audit baseline holds only what the audit still reports (nothing), with a current note; gate and shape test green"
    requirement: DEPS-15
    verification:
      - kind: other
        ref: "yarn audit:deps -> exit 0, 0 new / 0 accepted (tests/e2e-runs/169-gates/13-t1-audit-after.log); plan node -e rationale + js-yaml checks exit 0; grep -c -i strapi -> 0"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/auditBaselineShape.test.ts (14/14)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Moderate and low advisories on the chosen versions listed (npm tree + the Deno pins)"
    verification:
      - kind: other
        ref: "yarn npm audit --severity moderate/low --json (exit 1, 1 and 3 NDJSON lines); gh api advisories for the Deno pins; 169-EVIDENCE.md § 8"
        status: pass
    human_judgment: false
  - id: D3
    description: "End-of-phase version table; every non-current row has a § 3 hold"
    requirement: DEPS-01
    verification:
      - kind: other
        ref: "node 169-version-probe.mjs --out 169-VERSION-TABLE.md --node 24.21.0 (exit 0); § 1 169-13 cross-check table"
        status: pass
    human_judgment: false
  - id: D4
    description: "Follow-up todos filed, the Dependabot todo updated and still pending, dependabot.yml unchanged"
    requirement: DEPS-15
    verification:
      - kind: other
        ref: "plan Task 2 verify loop (exit 0); git diff --exit-code 5ed82f437..HEAD -- .github/dependabot.yml (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Local Postgres 17 proven at the phase gate; hosted upgrade filed as an operator todo"
    requirement: DEPS-08
    verification:
      - kind: integration
        ref: "db:reset exit 0; show server_version = 17.6; test:db Files=36 Tests=1335 PASS; db:lint:sql exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "Twelve gates and the full E2E suite under the cardinal rule on one HEAD"
    requirement: DEPS-16
    verification:
      - kind: other
        ref: "bash 169-gates.sh 169-13-final -> 12 rows of 0 at be000f31a"
        status: pass
      - kind: e2e
        ref: "bash 169-e2e.sh 169-13-final -> 171 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; provenance: full default suite, db-reset yes"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 13: Audit Baseline Reconciliation and the Phase Gate Summary

**The audit baseline now accepts nothing: all 68 accepted high/critical rows were fixed in the tree during the phase, and each removal was checked one by one against GitHub's vulnerable range. The final version table has every package at its latest safe version or on a dated hold. Eighteen follow-up todos were filed. On one HEAD (`be000f31a`): all twelve gates pass, pgTAP passes 1335/1335 with the SQL lint at 0 on Postgres 17.6, and the full E2E suite passes 171/171 with 0 flaky and 0 did-not-run.**

## Performance

- **Duration:** about 24 min
- **Started:** 2026-10-03T18:56:07Z
- **Completed:** 2026-10-03T19:20Z
- **Tasks:** 3 of 3
- **Files modified:** 23 (one source-tree file, `security/audit-baseline.json`; the rest are `.planning` files)

## Accomplishments

- **Baseline (D-29, D-28, D-02).** Before the edit, `yarn audit:deps` reported `[ACCEPTED] 0`, `[NEW] 0` and listed all 68 baseline rows as "no longer appear". The file was rewritten by hand: `accepted: []`, and a new `note` that states:
  - the current count;
  - what present-but-accepted means;
  - that the build goes red on any NEW advisory, because the subtraction is keyed on the advisory ID;
  - the two allowed rationale forms;
  - the Deno blind spot.

  The note contains no history and no retired-backend text. EVIDENCE § 6 has a 68-row table: for each row, either the package has left the tree (`@isaacs/brace-expansion`, `braces`, `form-data`, `ip-address`), or every version `yarn.lock` resolves is outside every range GitHub lists. The four `js-yaml` ids, the faker row and the stale `@eslint/eslintrc` `via` text are gone with their rows.
- **Moderate and low advisories (D-05).**
  - npm tree: `cookie` 0.6.0, low, through Kit 2.70.3 (it leaves with Kit 3); `esbuild` 0.27.7, low, through `tsup` 8.5.1 (affects only the dev server on Windows); and a `whatwg-encoding` deprecation notice. The npm tree has no moderate advisory.
  - Deno pins: `supabase-js` 2.117.2 and `jose` 6.2.12 have 0 advisories. The held `nodemailer` 6.9.10 has 17 (6 high, 10 moderate, 1 low).
- **Version table (D-33, criterion 1).** 67 packages: current 47, HOLD-7d 13, HOLD-30d 5, major 2, in-major 0. The two `major` rows are both held: TypeScript 7 is blocked by its peers, and `@types/node` 26 is a runtime-major move. Three new 7-day hold rows were added to § 3 (the AI SDK family, typescript-eslint and turbo). The `braces` hold was closed. The version-prose sweep found nothing to correct, and `dependabot.yml` is unchanged.
- **Todos (D-06, D-09, D-11, D-14, D-16, D-30, D-31).** 18 new todos were filed. The Dependabot todo gained a dated post-phase section (audit numbers and the Deno blind spot) and stays pending. The nodemailer todo was updated: still held, with its resume steps and the DEPS-09 note.
- **Phase gate (D-26).** All results below are on `be000f31a`:
  - `169-13-final` gates: 12/12, all uncached; the lint findings list is identical to 169-11's;
  - `db:reset` passed, and `show server_version` returned 17.6;
  - pgTAP: `Files=36, Tests=1335`, PASS, with the census file listed;
  - `db:lint:sql`: exit 0;
  - full E2E: 171/171/0/0/0 after a clean reset, on 29.63 GiB free in the Docker VM.

## Task Commits

1. **Task 1: Baseline reconciliation + moderate/low listing** — `ab0857938` (chore)
2. **Task 2: Version table, todos, Dependabot todo, prose sweep** — `be000f31a` (docs)
3. **Task 3: Phase gate on one HEAD** — gates, pgTAP and E2E were run at `be000f31a`; evidence recorded in `df2112ea9` (docs)

**Plan metadata:** the SUMMARY commit and the STATE/ROADMAP/REQUIREMENTS/handoff commit follow.

## Files Created/Modified

- `security/audit-baseline.json`: zero accepted rows and a current note.
- `169-VERSION-TABLE.md`: the end-of-phase table.
- `169-EVIDENCE.md`:
  - § 1: the 169-13 re-measurement and the cross-check of every non-current row;
  - § 3: three new hold rows; braces closed; nodemailer marked still held;
  - § 4: the final gate row;
  - § 6: the 68-row baseline table;
  - § 7: the disposition of every follow-up;
  - § 8: the moderate/low listing.
- `.planning/todos/pending/`: 18 new todos plus 2 updated. All are listed in the frontmatter and in EVIDENCE § 7.

## Holds at phase close (EVIDENCE § 3)

| Package | In the tree | Held release | Clears | Todo |
|---|---|---|---|---|
| `nodemailer` (Deno `npm:` pin, `send-email`) | 6.9.10 (6 high advisories) | 10.0.11 | **2026-10-04T07:51Z** | `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md` |
| `intl-messageformat` | 11.2.15 | 12.x | 2026-10-15T12:27Z | `2026-10-03-dotenv-18-and-intl-messageformat-12-held.md` |
| `dotenv` | 17.4.2 | 18.x | 2026-10-17T21:18Z | same |
| `@sveltejs/kit` / `adapter-node` / `adapter-static` | 2.70.3 / 5.5.7 / 3.0.10 | 3.0.0 / 6.0.0 / 4.0.0 | 2026-10-31T17:24:31Z | `2026-10-03-sveltekit-3-held-by-the-age-rule.md` |
| `typescript` | 6.0.3 | 7.0.2 | when typescript-eslint (`<6.1.0`) and svelte-check (`^5 \|\| ^6`) admit 7 | `2026-10-03-typescript-7-held.md` |
| `@types/node` | 24.19.0 | 24.19.1 (26.x waits for the runtime major) | 2026-10-08T22:38Z | `2026-10-03-age-held-majors-recheck.md` |
| `ai` / `@ai-sdk/google` / `@ai-sdk/openai` | 7.0.116 / 4.0.82 / 4.0.78 | 7-day patches | 2026-10-04T03:28Z … 10-08T19:20Z | same |
| `@typescript-eslint/*` | 8.70.1 | 8.71.0 | 2026-10-05T17:13Z | same |
| `turbo` | 2.11.4 | 2.11.5–2.11.7 | 2026-10-05T00:45Z … 10-09T14:58Z | same |
| `vitest`, `@vitest/browser-playwright` | 5.0.2 | 5.0.3 | 2026-10-07T11:30Z | same |
| `daisyui` | 5.7.46 | 5.7.47 | 2026-10-07T00:29Z | same |
| `supabase` CLI + six `setup-cli` pins | 2.118.0 | 2.119.0 | 2026-10-07T21:36Z | same |
| `vite` | 8.3.1 | 8.3.2 | 2026-10-08T10:17Z | same |
| `globals` | 17.12.0 | 17.13.0 | 2026-10-08T03:57Z | same |
| `eslint` | 10.11.0 | 10.12.0 | 2026-10-09T20:08Z | same; the three disables: `2026-10-03-remove-bindable-no-useless-assignment-disables.md` |

## Operator follow-ups (EVIDENCE § 7)

- **nodemailer 10 Edge pin**: apply the todo on or after 2026-10-04T07:51Z. This hold is the only reason DEPS-09 is still Pending.
- **Deno audit blind spot**: `yarn audit:deps` cannot see the Edge Functions' `npm:` imports, so it exits 0 while `send-email` runs a nodemailer with 6 high advisories. Todo `…-deno-edge-imports-invisible-to-audit-deps.md`.
- **Render runs Node 24 from the next deploy.** Confirm the service is Docker-runtime and watch the first deploy. Rollback is a redeploy. ssr 0.12 reads 0.9 cookies, so the deploy should not sign anyone out. Todo `…-render-node-24-deploy-watch.md`.
- **Hosted Postgres 15 → 17.** Until hosted is on 17, every migration must stay valid on PG15. Hosted databases that already applied `00001` keep the `IMMUTABLE` label on `is_valid_choice_id`, which is harmless. Todo `…-upgrade-hosted-postgres-to-17.md`.
- **One-time local step on every developer machine (PG15 volume → PG17):** `yarn db:stop && yarn workspace @openvaa/supabase exec supabase stop --no-backup && yarn db:reset`. This affects this project's stack only. The command is in the hosted-PG17 todo.
- **`release.yml` / `docs.yml` cannot be observed until merge.** Watch the first `main` run, then dispatch `docs.yml` once. Todo `…-watch-first-main-run-of-release-and-docs-workflows.md`.
- **CI `performance` margin is thin (4603/5000 ms), and Playwright 1.63 tracing costs about 350 ms per results render.** Operator call: keep `retain-on-failure`, or use `on-first-retry` in CI. Todo `…-playwright-163-trace-cost-and-thin-ci-performance-margin.md`.
- **Auth-cookie `Cache-Control`**: a route that sets its own header on a request that also refreshes the session would collide with it. Todo `…-auth-cookie-cache-control-vs-route-setheaders.md`.
- **Docker host:**
  - Repair the credential helper.
  - Reclaim images by name: `public.ecr.aws/supabase/postgres:15.8.1.085`, the CLI 2.83 images, and the trufflehog images 3.97.2 / 3.97.9 left on the host.
  - Todo `…-dev-host-docker-credential-helper-and-image-reclaim.md`.
- **Residue and decisions**, one todo each:
  - the root `glob` has no importer;
  - the docs app's `eslint-config-prettier` is unused;
  - the docs app's Vitest browser config is dead;
  - `[inbucket]` → `[local_smtp]`;
  - the AI SDK 7 `allowSystemInMessages` opt-in;
  - `send-email`/`invite-candidate` have no E2E coverage (168-03 F2/F3);
  - `yarn dedupe --check` in CI;
  - the docs `scripts/tsconfig.json` does not type-check;
  - widening Dependabot after the v2.15 merge.
- **Summary-only lines (no todo):**
  - The Vite 8 browser floor was accepted (ruling R4).
  - `nvm alias default` on this host is 24.21.0; restore it with `nvm alias default 24`.
  - Under faker 10, `yarn db:seed` (the `default` template) writes different values at seed 42.
  - `yarn changeset status` exits 1 on this branch, as it did on 2.x.
  - `setup-cli` v3 pulls from ECR and falls back to ghcr.
  - The voter-journey Base-6 slider race was addressed in 169-11; its mechanism is UNCONFIRMED (deferred-items).
- **Carried, not Phase 169's:**
  - 166 WR-01: `writeEntityGrant` upsert.
  - 168-06 F7: the OIDC nonce is not verified (todo exists).
  - 168-04 F1: `PUBLIC_PROJECT_ID` is missing from the deploy configs.
  - 168-07: docs product-intent items.

## Moderate and low advisories (EVIDENCE § 8, D-05)

| Package | Resolved | Severity | Advisory | Path |
|---|---|---|---|---|
| `cookie` | 0.6.0 | low | GHSA-pxg6-pf52-xh8x | `@sveltejs/kit` 2.70.3 (`^0.6.0`; Kit 3 uses `^2.0.1`) |
| `esbuild` | 0.27.7 | low | GHSA-g7r4-m6w7-qqqr (Windows dev server) | `tsup` 8.5.1 (`^0.27.0`, newest tsup) |
| `whatwg-encoding` | 3.1.1 | moderate (deprecation, not an advisory) | — | `cheerio` 1.2.0 → `encoding-sniffer` 0.2.1 |
| `nodemailer` (Deno pin, outside the npm tree) | 6.9.10 | 6 high, 10 moderate, 1 low | 17 GHSAs, all fixed in ≥ 10.0.6 (full list in § 8) | `send-email` — held until 2026-10-04T07:51Z |

## Decisions Made

See `key-decisions` in the frontmatter. The main ones:
- The baseline was rewritten by hand to zero rows, with each row's removal justified by evidence.
- `braces` is resolved by its removal from the tree.
- The nodemailer pin is held, not waited for.
- DEPS-12 is closed through its "held with a reason" branch.

## Deviations from Plan

**1. [Orchestrator rule] Baseline rewritten by hand instead of `node scripts/assert-dependency-audit.mjs --update-baseline`.**
- **Found during:** Task 1, step 2.
- **Issue:** The plan names a reviewed `--update-baseline` run. The orchestrator forbids running `--update-baseline` at all.
- **Fix:** The file was written to exactly what `updateBaseline` would emit on a tree with no findings: fresh `recorded` and `recordedAtHead`, `threshold` kept, `accepted: []`. The note was rewritten. Each dropped row was justified in EVIDENCE § 6.
- **Verification:**
  - `yarn audit:deps`: 0 new / 0 accepted;
  - the shape test: 14/14;
  - both `node -e` acceptance checks exit 0;
  - `grep -i strapi` finds 0.
- **Committed in:** `ab0857938`.

**2. [Rule 2 - completeness] Three 7-day hold rows added to § 3 (`ai`/`@ai-sdk/*`, `@typescript-eslint/*`, `turbo`).** The regenerated table showed them as HOLD-7d, and § 3 had no row for them (Task 2, step 1). Committed in `be000f31a`.

**3. [Rule 1 - accuracy] Corrected step 6 of the nodemailer todo's resume steps.** It said the full E2E suite "includes the email specs", but no spec calls `send-email`. Standard frontmatter keys were also added. Committed in `be000f31a`.

**4. Extra todos beyond the plan's list.** The orchestrator named items that had no todo yet: CI dedupe, docs `scripts/tsconfig`, Docker host, AI SDK opt-in, cookie `Cache-Control`, `[inbucket]`, and edge email coverage. Filing them satisfies PROH-169-24.

**Not applied (held):** the nodemailer 10 pin, per the orchestrator. Do not wait for it.

## Issues Encountered

- `db:lint:sql` prints three Splinter "foreign keys without indexes" warnings. These are pre-existing and informational: exit 0, and the output is identical to the rulings PG17 run, which matched PG15. They are not a regression, and they were not changed.
- The E2E wrapper logged `setupFromTemplate` "rows this run does not own" notices for two perm projects. They are informational, and the run was 171/171.

## User Setup Required

None from this plan. The operator follow-ups above (Render, hosted Postgres, the Docker host, the nodemailer pin date) are recorded as todos.

## Next Phase Readiness

All 13 Phase 169 plans are complete. Next: code review, phase verification, then `phase.complete 169`. DEPS-09 stays Pending only for the nodemailer 10 Edge pin, which can be applied on or after 2026-10-04T07:51Z as a quick task using the todo's resume steps. The next `ci-evidence/169-deps` push leases on `59607e5cd6b55ed9bc94563ad9a29dd1a31662d0`. Nothing was pushed in this plan.

## Self-Check: PASSED

- Files exist: `security/audit-baseline.json`, `169-VERSION-TABLE.md`, `169-EVIDENCE.md`, all 18 new todo files, the updated Dependabot and nodemailer todos.
- Commits exist: `ab0857938`, `be000f31a`, `df2112ea9`.
- Run evidence:
  - `tests/e2e-runs/169-gates/169-13-final/summary.tsv`: 12 rows of 0, `env.txt` head `be000f31a…`;
  - `tests/e2e-runs/169-e2e/169-13-final/summary.json`: 171/171/0/0/0; the `head` file is `be000f31a…`; `provenance.txt` shows the full default suite with `db-reset: yes`;
  - `13-final-pgtap.log`: PASS, 1335.

---
*Phase: 169-dependency-bump-to-latest-safe-versions*
*Completed: 2026-10-03*
