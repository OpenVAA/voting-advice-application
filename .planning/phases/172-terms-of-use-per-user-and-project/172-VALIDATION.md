---
phase: "172"
slug: "terms-of-use-per-user-and-project"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-05"
---

# Phase 172 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Filled from
> `172-RESEARCH.md` § *Validation Architecture* while the plans were written.

Paths and project names are written as Phase 170 leaves them (`contestant…`). `172-NAMES.md`, written
by plan 172-01 task 1, is the authority for any name that differs on the tree.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | vitest (unit; jsdom for mounted Svelte), pgTAP through `supabase test db`, Playwright (E2E + axe) |
| **Config files** | `apps/frontend/vitest.config.ts`, the `packages/dev-seed` vitest config, `tests/playwright.config.ts` |
| **Quick run commands** | `yarn workspace @openvaa/frontend test:unit` · `yarn workspace @openvaa/dev-seed test:unit` · `yarn workspace @openvaa/supabase test:db` |
| **Static gate set** | `bash .planning/phases/172-terms-of-use-per-user-and-project/172-gates.sh <label>` (created by 172-01 task 1): `yarn lint:check`, `yarn db:types` + no diff, `yarn db:lint:sql`, pgTAP, `yarn test:unit`, `yarn workspace @openvaa/frontend check`, `yarn build`, `yarn format:check` |
| **Full suite command** | `bash .planning/phases/172-terms-of-use-per-user-and-project/172-e2e.sh <label>`, which runs `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/172/<label> --no-db-reset` and derives `summary.json` |
| **Estimated runtime** | quick commands under 120 s each; static gate set about 10 min; full E2E about 5 min (last measured 4.7 min, 171 tests) |

Every status is read from the command's own exit code or from the run directory's own files, never
through a pipe.

**Shell preamble.** A non-interactive shell's default `node` on this host is below the engines floor. Every
shell invocation that runs `yarn` or `node` begins with
`export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"` (confirm the directory exists; otherwise the
newest version at or above 24.15 under `~/.nvm/versions/node`). The two helper scripts resolve it themselves.
`git grep -E` on this host does not understand `\b`; use `git grep -P`.

**Long gates.** The static gate set and every E2E run are started in the background and polled with the
helper's `--status <label>` every 45 seconds; completion is the `done` file the helper writes into the
attempt's directory as its last act. Ceilings: 30 minutes for the gate set, 25 minutes for an E2E run, after
which the executor stops and reports. No single foreground command runs longer than about eight minutes.

---

## Sampling Rate

- **After every task commit:** the workspace-level quick command for what the task touched.
- **Full E2E runs:** plan 01 (the pre-change baseline) and plans 03, 04, 06, 07, 08 and 09.
- **Plans 02 and 05 close on targeted gates, not on a full run.** 172-02: the tests-project typecheck and the
  slice of the suite its fixtures feed (the contestant scan project with the base data setup and the auth
  setup); its boundary proof is the full run closing 172-03. 172-05: the frontend typecheck, unit suite and
  lint; its boundary proof is the full run closing 172-06.
- **At each stage boundary (plans 04, 07, 09):** the static gate set plus the full E2E run.
- **Before `/gsd-verify-work`:** plan 09 task 3 has run D-21's gate in order and its census is clean.
- **Max feedback latency:** 120 s for a quick command; a stage gate is a background job.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 172-01-01 | 01 | 1 | TOU-01 | — | N/A (names, helpers, baseline) | gate + E2E | `172-gates.sh 172-01-baseline`, `172-e2e.sh 172-01-baseline` | ❌ created by the task | ✅ green |
| 172-01-02 | 01 | 1 | TOU-01 | T-172-01..07 | `anon` holds nothing; `authenticated` holds SELECT and INSERT on `project_id` only | gate | `yarn assert:schema-migration-parity && yarn db:lint:sql` | ✅ | ✅ green |
| 172-01-03 | 01 | 1 | TOU-01 | T-172-01..06 | forged `user_id` / `accepted_at`, UPDATE, DELETE and `anon` each refused with `42501`; another user's row unreadable; a row for project A absent for project B | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ created by the task | ✅ green |
| 172-02-01 | 02 | 2 | REG-12 | T-172-08 | N/A (test harness) | typecheck | `yarn typecheck:tests` | ✅ | ✅ green |
| 172-02-02 | 02 | 2 | REG-12 | T-172-08 | N/A | typecheck + E2E slice | `yarn typecheck:tests`, `172-e2e.sh 172-02-fixtures --project <contestant scan project>` judged with `--allow-slice` (boundary proof: `172-03-writer`) | ✅ | ✅ green |
| 172-03-01 | 03 | 3 | TOU-01 | T-172-09 | the scoped upsert always sends ignore-duplicates | gate + unit | `yarn assert:project-scoped-queries && yarn workspace @openvaa/dev-seed vitest run projectScopingGate` | ✅ | ✅ green |
| 172-03-02 | 03 | 3 | TOU-01 | T-172-09..11 | the read is project-scoped; a failed read yields `null` | unit | `yarn workspace @openvaa/frontend vitest run supabaseDataWriter` | ✅ (cases new) | ✅ green |
| 172-03-03 | 03 | 3 | REG-12 | T-172-10 | N/A | typecheck + E2E | `yarn workspace @openvaa/frontend typecheck`, `172-e2e.sh 172-03-writer` (also the boundary proof for 172-02) | ✅ | ✅ green |
| 172-04-01 | 04 | 4 | REG-12 | T-172-13, T-172-20 | the gate list is frozen and ordered | unit | `yarn workspace @openvaa/frontend vitest run gates.test` | ❌ created by the task | ✅ green |
| 172-04-02 | 04 | 4 | REG-12 | T-172-12..14 | no entity read for a user without an acceptance; a failed accept is shown | unit | `yarn workspace @openvaa/frontend vitest run layout.server.test termsOfUseLayout` | ❌ / ✅ rewritten | ✅ green |
| 172-04-03 | 04 | 4 | REG-12 | T-172-12 | a newly registered user meets G, accepts once, is not asked again | gate + E2E | `172-gates.sh 172-04-stage1`, `172-e2e.sh 172-04-stage1` | ✅ | ✅ green |
| 172-05-01 | 05 | 5 | TOU-01 | — | N/A (removal) | typecheck + unit | `yarn workspace @openvaa/frontend typecheck && yarn workspace @openvaa/frontend vitest run UserDataState` | ✅ | ✅ green |
| 172-05-02 | 05 | 5 | TOU-01 | T-172-21 | the candidates image write stays project-scoped; no entity-level type or store file declares the field | typecheck + unit + lint | `yarn workspace @openvaa/frontend typecheck && yarn workspace @openvaa/frontend test:unit && yarn workspace @openvaa/frontend lint`, plus the region check on `LocalizedCandidateData` and `EditableEntityProps` (boundary proof: `172-06-visibility`) | ✅ | ✅ green |
| 172-06-01 | 06 | 6 | TOU-02 | T-172-15, T-172-16 | visibility is project open ∧ confirmed ∧ confirmed nomination for every entity type | gate + unit | `yarn assert:schema-migration-parity && yarn db:lint:sql && yarn workspace @openvaa/dev-seed vitest run base.test` | ✅ | ✅ green |
| 172-06-02 | 06 | 6 | TOU-02 | T-172-15, T-172-16, T-172-22 | an anon-visible candidate, its storage object and its `get_nominations` row with no acceptance row for its editor; the eight entity policies compared verbatim | pgTAP | `yarn workspace @openvaa/supabase test:db` | ✅ | ✅ green |
| 172-06-03 | 06 | 6 | TOU-02 | T-172-15 | voter-side counts on `e2e/base` unchanged | unit + gate + E2E | `yarn workspace @openvaa/dev-seed test:unit`, `172-gates.sh 172-06-visibility`, `172-e2e.sh 172-06-visibility` (also the boundary proof for 172-05) | ✅ | ✅ green |
| 172-07-01 | 07 | 7 | TOU-01 | T-172-17, T-172-23 | no column, no column grant, no RPC column | gate + unit | `yarn assert:schema-migration-parity && yarn assert:rpc-nullability && yarn db:lint:sql && yarn workspace @openvaa/dev-seed test:unit && yarn typecheck:tests` | ✅ | ✅ green |
| 172-07-02 | 07 | 7 | TOU-01, TOU-02 | T-172-24 | no policy qual and no function body names terms of use | pgTAP + types | `yarn workspace @openvaa/supabase test:db`, `yarn db:types` leaving no diff | ✅ | ✅ green. The types check was made in the form that resets the database first (pgTAP leaves its helper functions in `public`): before the commit, and by gate rows 02 and 03 after it. See 172-07-SUMMARY |
| 172-07-03 | 07 | 7 | TOU-01 | — | N/A (stage close; no source edit) | census + gate + E2E | the column name absent from schema, packages, frontend, scripts and the harness files that wrote it; `172-gates.sh 172-07-stage2`, `172-e2e.sh 172-07-stage2` | ✅ | ✅ green |
| 172-08-01 | 08 | 8 | REG-12 | T-172-18 | N/A (test harness) | typecheck + lint | `yarn typecheck:tests`, ESLint on the three files | ✅ | ✅ green |
| 172-08-02 | 08 | 8 | REG-12 | — | N/A (comment-only sweep of the E2E tree) | typecheck + lint + census | `yarn typecheck:tests`, ESLint, the column name absent under `tests/` outside the a11y spec | ✅ | ✅ green |
| 172-08-03 | 08 | 8 | REG-12 | T-172-25 | G passes axe in both themes through the shared scan core, with no rule or node excluded | gate + E2E | `yarn assert:a11y-scan-wiring`, `172-e2e.sh 172-08-axe` | ✅ (entries new) | ✅ green |
| 172-09-01 | 09 | 9 | TOU-01, TOU-02 | T-172-26 | N/A (docs and skills) | link check | `yarn workspace @openvaa/docs validate:links`, `bash .claude/scripts/audit-skill-links.sh database` | ✅ | ✅ green for the docs link check (exit 0). ❌ as written for the skill link audit: it exits 1 on the phase's start tree and after this task alike, with the same 31 dangling citations (146 checked before, 151 after, none of the five new ones dangling). See 172-09-SUMMARY |
| 172-09-02 | 09 | 9 | TOU-03 | T-172-19 | N/A (todos) | file check | exactly one file in `.planning/todos/pending/` contains `TOU-F01` | ❌ created by the task | ✅ green |
| 172-09-03 | 09 | 9 | TOU-01, TOU-02, REG-12 | T-172-27 | every gate of D-21 green on one tree (nothing outside `.planning` differs between the runs' commit and HEAD); census clean | gate + E2E + census | `172-gates.sh 172-09-final`, `172-e2e.sh 172-09-final`, `git grep terms_of_use_accepted -- ':!.planning' ':!CAND-APP-PLAN.md'` exits 1 with no output | ✅ | ✅ green for the gate set (nine rows at 0) and the census (exit 1, no output). ⚠️ for the E2E run: the first attempt was ❌ red (`172-09-final`: 77 passed, 9 failed, 94 did not run) and the second, on the same commit with no change in between, ✅ green (`172-09-final-r2`: 180 of 180). See 172-09-SUMMARY § _The Red First Attempt_ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Statuses were set on 2026-10-06 by plan 172-09 from the nine plan summaries and from the run directories
`tests/e2e-runs/172-gates/` and `tests/e2e-runs/172/`. Each row's evidence, and each acceptance criterion
that was met in a different form than written, is in that plan's own summary.

---

## Requirement → Test Map

| Req | Behaviour | Test type | Where |
|-----|-----------|-----------|-------|
| TOU-01 | own-row insert succeeds; forged `user_id` → `42501`; another user's row unreadable; `anon` refused; a row for A is absent for B | pgTAP | new `NN-terms-of-use-acceptances.test.sql` (172-01) |
| TOU-01 | the writer upserts with ignore-duplicates through `scopedFrom`; `BasicUserData.termsOfUseAccepted` is filled per project | unit | `supabaseDataWriter.test.ts` (172-03) |
| TOU-01 | no entity carries the field | census | `git grep terms_of_use_accepted -- ':!.planning' ':!CAND-APP-PLAN.md'` → exit 1, no output (172-09; the second exclusion is the operator's root planning document) |
| TOU-02 | no policy qual, no function body mentions it | pgTAP census | the new pgTAP file (172-07) |
| TOU-02 | an anon-visible candidate, its storage object and its `get_nominations` row, with no acceptance row for its editor | pgTAP | the new pgTAP file (172-06) |
| TOU-02 | the eight entity SELECT assemblies are identical with no special case | pgTAP | `05`, `18`, `25` with the strip removed (172-06) |
| TOU-02 | voter-side counts on `e2e/base` unchanged; the two rows are seeded `confirmed: false` | E2E + unit | `voter-journey`; `base.test.ts` (172-06) |
| TOU-03 | one todo for the Admin rule exists and names TOU-F01 | file check | 172-09 |
| REG-12 | without acceptance the load returns the gate and does not read the entity | unit | new `layout.server.test.ts` (172-04) |
| REG-12 | a failed accept shows `tou-save-error` and keeps the form; a successful one reruns the load | unit | `termsOfUseLayout.svelte.test.ts` rewritten (172-04) |
| REG-12 | gate order and predicate | unit | new `gates.test.ts` (172-04) |
| REG-12 | a newly registered user meets G, accepts, lands on home; is not asked again after sign-out, password reset and sign-in | E2E | `contestant-journey` steps 5, 8, 9 |
| Criterion 5 | G passes axe in both themes | E2E | `contestant-a11y-scan`, two entries under the second stored session (172-08) |
| E2E-03 | whole suite green, zero did-not-run | E2E | `172-e2e.sh 172-09-final` |

---

## Wave 0 Requirements

There is no separate Wave 0 plan. Every new test file is created by the task that first needs it, in
the same commit as the code it holds:

- [ ] `apps/supabase/supabase/tests/database/NN-terms-of-use-acceptances.test.sql` — 172-01 task 3 (extended by 172-06 task 2 and 172-07 task 3)
- [ ] `apps/frontend/src/lib/contestant/gates/gates.test.ts` — 172-04 task 1
- [ ] `apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts` — 172-04 task 2
- [ ] new cases and mock-chain members in `supabaseDataWriter.test.ts` — 172-03 task 2
- [ ] the second identity, its stored session and two scan entries — 172-08
- [ ] `.planning/phases/172-terms-of-use-per-user-and-project/172-gates.sh` and `172-e2e.sh` — 172-01 task 1
- [ ] framework install: none

---

## Manual-Only Verifications

All phase behaviours have automated verification. Two items are judged by a person reading a result,
and both are recorded as operator review points rather than as manual tests:

| Behavior | Requirement | Why not automated | Where it is recorded |
|----------|-------------|-------------------|----------------------|
| The two reasoned `REACHES_NEITHER_ALLOW` entries are an acceptable widening of the schema linter's exemption list | TOU-01 | a security-surface judgement, not a behaviour | 172-01 § Deviations |
| Acceptance stays a table read (D-06) rather than joining the user-data RPC | TOU-01 | an open design point for Phase 178 | 172-03 § Deviations |

---

## Validation Sign-Off

- [x] All tasks have an `<automated>` verify with a stated failing direction
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No Wave 0 `MISSING` references: test files are created in the task that needs them
- [x] No watch-mode flags
- [x] Feedback latency under 120 s for quick commands; long gates run in the background
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** per-task map filled 2026-10-06 by plan 172-09: no row of the 25 pending, 23 rows green, and two rows
carrying a finding the operator should read before approving (172-09-01, an acceptance check that cannot
pass on this tree; 172-09-03, an E2E run that was red once and green once on one commit). Not approved by
the executor: approval is the operator's or `/gsd-validate-phase`'s, and the frontmatter `status` is left
at `draft` for that step.
