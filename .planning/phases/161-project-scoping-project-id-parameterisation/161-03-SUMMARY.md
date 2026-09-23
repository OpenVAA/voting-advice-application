---
phase: 161-project-scoping-project-id-parameterisation
plan: 03
subsystem: api
tags: [supabase, deno, edge-functions, env, multi-tenancy, security, config]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: 'the canonical PUBLIC_PROJECT_ID name and the one-name operator ruling recorded in 161-01-DECISION.md'
  - phase: 155-edge-function-hardening
    provides: 'requireEnv, envConfig.ts and scripts/assert-edge-env-defaults.mjs, all landed before this plan ran'
provides:
  - 'identity-callback resolves its project from PUBLIC_PROJECT_ID through requireEnv, with no fallback of any kind'
  - 'the hardcoded DEFAULT_SEED_PROJECT_ID constant is deleted from the functions tree'
  - 'a caller-supplied project_id is validated against the configured project and refused with a fixed 400'
  - 'an [edge_runtime.secrets] entry naming PUBLIC_PROJECT_ID through the env(...) indirection'
  - 'a measured, both-directions account of what the local edge runtime does and does not deliver'
affects: [161-04, 161-06, 161-07, 162-permissions-and-auth-model-refactor]

actuals:
  tokens: 4331
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - 'A body field that duplicates configuration is validated against it rather than trusted or removed: the HTTP contract is unchanged and the mismatch is observable'
    - 'A probe whose success path is only reachable AFTER the thing under test succeeded doubles as its own positive control'
    - 'A two-by-two matrix over mechanism and source, so a filed gap names the conjunction that works rather than asserting a workaround'

key-files:
  created:
    - .planning/todos/pending/2026-08-28-edge-runtime-secrets-local-wiring.md
    - .planning/phases/161-project-scoping-project-id-parameterisation/deferred-items.md
  modified:
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/config.toml
    - .env.example
    - tests/IDURA-TEST-RUNBOOK.md
    - .claude/skills/database/SKILL.md

key-decisions:
  - 'DR-10 branch taken: Phase 155 HAS landed, so only the name changed and requireEnv structure and error shape were preserved verbatim'
  - 'The .env.example entry 155 added was DELETED rather than renamed, because 161-01 had already added the canonical line and renaming would have assigned one name twice'
  - 'The runbook and database skill were renamed too, as repair directly caused by this rename, with a migration notice for deployments provisioned under the old name'
  - 'Both the config.toml entry AND the todo ship, because measurement falsified the plan''s exclusive-or: the entry is necessary but not sufficient'
  - 'The operator''s seeded local database was NOT reset to make a pgTAP assertion pass, because the arithmetic already settled attribution without a destructive act'

patterns-established:
  - 'Absence greps carry a plant-and-restore positive control before their zero is believed'
  - 'A gate exit is captured into a variable on its own line, never read through a pipe or after an intervening command'

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: 'identity-callback resolves its project from PUBLIC_PROJECT_ID with no fallback, and the hardcoded seed-project constant is gone from the functions tree'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "node -e '<convergence guard from the plan>' — 0 violations"
        status: pass
      - kind: other
        ref: 'node scripts/assert-edge-env-defaults.mjs — 17 files, 3/3 checks, 0 violations'
        status: pass
      - kind: other
        ref: 'git grep -c DEFAULT_SEED_PROJECT_ID -- apps/supabase — no match, with a plant-and-restore positive control'
        status: pass
    human_judgment: false
  - id: D2
    description: 'A mismatched caller-supplied project_id is refused with 400 and a fixed error string; a matching one (any case) is accepted; an absent one falls back to configuration'
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: 'live invocation probes A/B/C/C2 against http://127.0.0.1:54321/functions/v1/identity-callback — 401/400/401/401'
        status: pass
      - kind: other
        ref: 'tsc --strict narrowing probe over the landed predicate, with a failing negative control'
        status: pass
    human_judgment: false
  - id: D3
    description: 'Phase 155 fail-loudly posture preserved: a missing project variable produces a 500 with a fixed opaque body and a server-side log naming the variable'
    verification:
      - kind: integration
        ref: 'observed 500 {"error":"Internal server error"} with container log ERR_ENV_UNCONFIGURED naming the variable, response body naming nothing'
        status: pass
    human_judgment: false
  - id: D4
    description: 'The local edge runtime delivers PUBLIC_PROJECT_ID when the config.toml entry and a process-environment value are both present'
    verification:
      - kind: integration
        ref: 'four-cell mechanism/source matrix via docker exec env, with SUPABASE_URL as positive control and an unwired variable as negative control'
        status: pass
    human_judgment: false
  - id: D5
    description: 'A bare yarn db:start does NOT deliver the variable from the repo-root .env; the gap is filed with evidence and a verified workaround'
    verification:
      - kind: other
        ref: '.planning/todos/pending/2026-08-28-edge-runtime-secrets-local-wiring.md'
        status: pass
    human_judgment: true
    rationale: 'Whether to close the gap by changing db:start, adding functions/.env, wiring all seven variables, or upgrading the CLI is an operator decision with deployment implications, deliberately not taken here'

duration: 75 min
completed: 2026-09-04
status: complete
---

# Phase 161 Plan 03: Deno-side project-id convergence Summary

**`identity-callback` now reads one canonical `PUBLIC_PROJECT_ID` with no fallback, the hardcoded seed-project constant is deleted, and an unauthenticated caller can no longer direct a self-registration into an arbitrary project.**

## Performance

- **Duration:** ~75 min (including one blocking-human checkpoint for an unmet precondition)
- **Tasks:** 2
- **Files modified:** 5 source/doc files + 2 planning artifacts

## Accomplishments

- Deleted `DEFAULT_SEED_PROJECT_ID` and converged the function on `PUBLIC_PROJECT_ID`, the one name the operator ruled canonical for both runtimes.
- Closed T-161-01: a body `project_id` is now honoured only when it names the configured project, refused otherwise with a fixed `Invalid project_id` 400 that echoes neither uuid.
- Established, by measurement in both directions, exactly what the local edge runtime does and does not deliver — correcting the plan's assumed option space rather than forcing a branch.

## Task Commits

1. **Task 1: Converge identity-callback, delete the constant, validate the body project id** — `8b0e4e6b2` (feat)
2. **Task 2: Wire the local edge runtime, verify by invocation, and file the residual gap** — `f113c2df6` (chore)

## DR-10 branch: Phase 155 HAS landed

`envConfig.ts`, `requireEnv` and `scripts/assert-edge-env-defaults.mjs` were all present, so the
landed-branch applied. The project-id expression read, verbatim, before the edit:

```ts
const projectId = project_id || requireEnv('DEFAULT_PROJECT_ID', Deno.env.get('DEFAULT_PROJECT_ID'));
```

It now reads:

```ts
const projectId = requireEnv('PUBLIC_PROJECT_ID', Deno.env.get('PUBLIC_PROJECT_ID')?.trim());
```

155's `requireEnv` structure, its error shape and the outer catch's fixed-opaque discipline were
preserved exactly. `?.trim()` is optional chaining, not a coalescing default, so the guard's
`Deno\.env\.get\(...\)\s*(\?\?|\|\|)` predicate is untouched — confirmed green.

**`.env.example` branch: rename was NOT the right move.** 155 added `DEFAULT_PROJECT_ID=` to the
un-prefixed Edge block, but 161-01 had already added `PUBLIC_PROJECT_ID=` under Project scoping.
Renaming would have assigned the canonical name twice in one file, which the plan explicitly forbids.
The Edge-block entry was therefore **deleted**, and the Project-scoping comment now states that the
Edge Function reads the same variable under the same name.

## Invocation probes (Task 2)

Against `http://127.0.0.1:54321/functions/v1/identity-callback`, verbatim:

| Probe | Body | Result |
| --- | --- | --- |
| Control 0 — reachability | malformed body | `HTTP 400 {"error":"Invalid or missing request body"}` |
| **A — absent `project_id`** | `{id_token:"a.b.c"}` | `HTTP 401 {"error":"Token verification failed"}` |
| **B — mismatched `project_id`** | `…project_id:"11111111-2222-3333-4444-555555555555"` | `HTTP 400 {"error":"Invalid project_id"}` |
| **C — matching `project_id`** | `…project_id:"00000000-0000-0000-0000-000000000001"` | `HTTP 401 {"error":"Token verification failed"}` |
| C2 — matching, upper-cased | same, upper-cased | `HTTP 401 {"error":"Token verification failed"}` |

Probe A reaches the token path rather than a configuration 500, so the variable was delivered.
Probe B is the strongest evidence in the set: `Invalid project_id` is reachable **only after**
`requireEnv` has already succeeded, so it proves delivery and the new code path simultaneously. C
shows a matching value is accepted rather than refused; C2 shows the case-insensitive comparison
works. Neither 400 echoes the submitted or configured uuid.

**The coordinator's bad-control warning was live, not hypothetical.** The first run of Control 0
returned `HTTP 500 {"error":"Internal server error"}` — had I trusted it, I would have concluded the
project variable was undelivered. The container log named the real cause:

```
[Error] identity-callback error: Error: Missing required environment variable: IDENTITY_PROVIDER_TYPE.
  code: "ERR_ENV_UNCONFIGURED", variable: "IDENTITY_PROVIDER_TYPE"
```

That throw precedes the project-id line, so it says nothing about `PUBLIC_PROJECT_ID`. A temporary
second secrets entry was added purely as diagnostic scaffolding to reach the measurement point, the
probes were run, and the scaffold was then removed before commit.

## The plan's exclusive-or was falsified by measurement

DR-12 offered two outcomes: wire it, or revert and file. Neither is what the tree actually does.

| `config.toml` entry | value in process env | reaches the runtime |
| --- | --- | --- |
| present | no | **no** |
| absent | yes | **no** |
| present | yes | **yes** |

The `env(...)` indirection works, but resolves from the **process environment**, not the repo-root
`.env` — `yarn db:start` runs `supabase start` with cwd `apps/supabase`, and the CLI does not walk up
two levels. The entry is nonetheless **load-bearing**: without it an exported value is not forwarded
either.

So **both** artifacts ship, against the plan's "never both". Reverting a necessary entry per the
literal failure branch would have deleted the only thing that makes the documented workaround work,
leaving the runbook with an unsatisfiable instruction. Instrument controls: `SUPABASE_URL` present
throughout (positive), an unwired variable absent throughout (negative), and the reading flipped
0 → 2 → 0 → 1 across the four configurations, so it discriminates.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The rename broke three live configuration documents**
- **Found during:** Task 1
- **Issue:** `tests/IDURA-TEST-RUNBOOK.md` (5 sites) and `.claude/skills/database/SKILL.md` instructed operators to configure `DEFAULT_PROJECT_ID` — a variable nothing would read after the rename, producing a 500. The skill also claimed the variable is required "only when the request omits `project_id`", which the new validation makes false.
- **Fix:** Renamed the operative occurrences, corrected the conditional claim, and added a migration notice for deployments provisioned under the old name — the cost accepted on record in `161-01-DECISION.md`.
- **Verification:** `git grep -c DEFAULT_PROJECT_ID -- apps/supabase .env.example` returns no match, with a plant-and-restore positive control.
- **Committed in:** `8b0e4e6b2`

**2. [Rule 6 - False premise] `.env.example` rename would have duplicated the canonical name**
- **Found during:** Task 1
- **Issue:** The plan's landed-branch says to rename 155's `.env.example` line; 161-01 had already added the canonical line, so renaming would have declared `PUBLIC_PROJECT_ID` twice.
- **Fix:** Deleted the Edge-block entry instead and documented the shared name once, under Project scoping.
- **Verification:** `assert:env-pair-registry` green — still derives exactly 4 pairs; `PUBLIC_PROJECT_ID` correctly derives none.
- **Committed in:** `8b0e4e6b2`

**3. [Rule 6 - False premise] Both branches of DR-12 shipped, not one**
- **Found during:** Task 2
- **Issue:** The plan's acceptance criterion demands "never neither, never both". Measurement showed a third state the dichotomy did not anticipate.
- **Fix:** Shipped the entry and filed the todo, with the four-cell matrix as evidence.
- **Committed in:** `f113c2df6`

**Total deviations:** 3 auto-fixed (1 bug, 2 false plan premises).
**Impact:** No scope creep. Deviations 2 and 3 are corrections to plan premises that measurement falsified; deviation 1 is repair directly caused by this plan's own rename.

## Issues Encountered

**Unmet precondition — surfaced as a blocking-human checkpoint, resolved by the coordinator.** The
repo-root `.env` declared `DEFAULT_PROJECT_ID` and not `PUBLIC_PROJECT_ID`. Probing anyway would have
returned configuration 500s and produced a filed todo blaming the Supabase CLI for a variable that was
simply never set. Execution stopped before the `config.toml` edit so the "never neither, never both"
criterion stayed cleanly satisfiable. The coordinator renamed the key (backup at `.env.bak-161-03`,
confirmed gitignored) and execution resumed.

**Pre-existing finding surfaced by that check:** `resolveProjectId` in `supabaseAdapter.ts:33` throws
when `PUBLIC_PROJECT_ID` is empty, so local dev and the E2E suite were already broken at HEAD from
161-01 — which would have sunk plan 161-07's twice-in-a-row proof. The rename fixed that too.

**pgTAP: one failure, proven not attributable to this plan.** `yarn workspace @openvaa/supabase
test:db` exits 1 on `07-rpc-security.test.sql` test 14 (`have: 4`, `want: 381`), an assertion authored
by 161-02 (`d3104a13d`). This plan changed **no SQL and no DB artefact** — its full file list is
`index.ts`, `config.toml`, `.env.example`, the runbook, the skill and one todo. The local database
holds a previously seeded default-template dataset (377 nominations, 327 `seed_`-prefixed candidates,
1 project); the fixture adds 4 nominations, and `377 + 4 = 381` exactly reproduces the observed
`want`. The assertion encodes a clean-DB precondition it does not state. Logged to
`deferred-items.md`; **not fixed** (another plan's assertion) and the operator's seeded data was
deliberately **not** reset, since the arithmetic settles attribution without a destructive act.

## Verification

| Gate | Result |
| --- | --- |
| `yarn lint:check` (17 links, `TURBO_FORCE=true`, after last edit) | **exit 0** |
| `assert:rpc-nullability` harvest | **3** `RETURNS TABLE` RPCs, not 0 |
| `assert:edge-env-defaults` | exit 0 — 17 files, 3/3 checks |
| `assert:comment-hygiene` | 0 violations, 1653 files |
| `assert:env-pair-registry` | 0 violations, 4 pairs (unchanged) |
| Task 1 convergence guard | exit 0 |
| Task 2 wiring guard | exit 0 — `wired` |
| `yarn workspace @openvaa/supabase test:db` | exit 1 — 1 pre-existing, state-dependent failure (above) |

Every exit captured directly into a variable, never through a pipe, and every gate run after the last
edit. **Nothing was pushed** — no upstream tracking ref exists.

## Broken-windows ledger

`.planning/WINDOWS.md` refuses `windows append` (its rendered table disagrees with its own fenced
JSON — pre-existing, verified untouched by this phase), so the entries it would have carried are here:

- `deviation` — both DR-12 branches shipped; the plan's exclusive-or is falsified by the four-cell matrix.
- `unrun-verify` — `test:db` is red on one pre-existing, DB-state-dependent 161-02 assertion.

## Next Phase Readiness

- **161-04** converts the write paths and will likely hit the `ScopedTableAccess.update`/`delete` shape 161-02 flagged.
- **161-06** owns the runbook's `db:reset` edit. Its file was touched here for the rename only; the `db:reset` prerequisite sentences are untouched.
- **161-07**'s default `yarn test:e2e` project set is unaffected — `PLAYWRIGHT_BANK_AUTH` gating is unmodified (12 occurrences).
- **Not started, and not mine:** the operator's ruling that `get_questions` gets the same required-`p_project_id` treatment. Untouched here.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-04*

## Surviving `DEFAULT_PROJECT_ID` mentions, enumerated

`git grep -c DEFAULT_PROJECT_ID -- apps/supabase .env.example` returns no match. Repo-wide, five
mentions survive outside `.planning/`, and none of them instructs anyone to configure a variable
nothing reads:

| Site | Count | Why it stays |
| --- | --- | --- |
| `apps/frontend/.../supabaseAdapter.ts` | 2 | `DOCUMENTED_DEFAULT_PROJECT_ID` — a different symbol, 161-01's constant holding the documented default uuid for an error-remedy message. Not the environment variable's name. |
| `scripts/assert-edge-env-defaults.mjs` | 2 | Historical narrative in comments, quoting the removed fallback verbatim. Renaming it would falsify the incident record the guard exists to explain. |
| `tests/IDURA-TEST-RUNBOOK.md` | 1 | The migration notice added by this plan, telling operators provisioned under the old name to rename the secret. Operative, not stale. |

## Self-Check: PASSED

All three created artifacts exist on disk; all three commits (`8b0e4e6b2`, `f113c2df6`, `9666b00b8`)
are present in the git history.
