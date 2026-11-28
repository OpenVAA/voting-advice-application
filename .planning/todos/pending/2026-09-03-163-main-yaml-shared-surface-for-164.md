---
created: 2026-09-03
source: Phase 163 close — the permanent workflow surface it leaves behind
resolves_phase: 164
severity: medium
area: CI / GitHub Actions
---

# `.github/workflows/main.yaml` is a SHARED surface: Phase 163 left it with ELEVEN jobs and a live trigger glob

Phase 164 is the next phase expected to edit this file (a `db:types` drift job). This note is the
hand-over, so 164 inherits the surface knowingly rather than discovering it in a merge.

## 1. The workflow Phase 163 inherited had six jobs. It now has eleven.

163 added three: `secret-scan`, `sql-lint`, `dependency-audit`. (Phase 164 had already added
`supabase-types-drift` on 2026-09-02, and `node-engine-range-negative-control` predates both, which
is why the count at HEAD is eleven rather than nine.) Full list at phase close, and **all eleven
must survive any edit**:

`skill-drift-check`, `secret-scan`, `frontend-and-shared-module-validation`, `supabase-tests`,
`sql-lint`, `dependency-audit`, `dev-seed-integration`, `supabase-types-drift`, `e2e-tests`,
`e2e-visual`, `node-engine-range-negative-control`.

## 2. The `sql-lint` job is the reusable skeleton for a `db:types` drift job

Both need the same thing — a live Supabase plus Node — and `sql-lint` is the worked example:

- `supabase/setup-cli@v1` with `version: latest` (resolved to CLI **2.83.0** in the observed runs,
  taken from the repo's own devDependency rather than from the action's "latest")
- `threeal/setup-yarn-action@v2` at 4.13, `actions/setup-node@v4` at 22.22.1 with `cache: yarn`
- `yarn install --frozen-lockfile`
- an explicit "assert psql is available" step, because `lint-schema.mjs` shells out to `psql` and a
  missing binary would otherwise read as a lint failure
- `supabase start` before the command, `supabase stop` after

Copy that shape rather than re-deriving it. Observed green: run 33791749587.

## 3. Job placement is NOT free — a unit test slices this file by job key

`packages/dev-seed/tests/ciSecretScanFlags.test.ts` slices the `secret-scan` region between two
literal job keys. Phase 163 placed `dependency-audit` **after** `sql-lint` rather than between
`secret-scan` and `frontend-and-shared-module-validation` for exactly this reason: a job inserted
there silently widens what that guard measures. Check the guard before choosing where to put a new
job.

## 4. The `ci-evidence/**` trigger glob is a LIVE, PERMANENT surface — decide, do not inherit

`on.push.branches` now carries `ci-evidence/**` (operator-authorised, 163-01 Task 0).
`on.pull_request` was left untouched.

Consequences 164 should decide about explicitly rather than absorb:

- **Any branch matching the glob executes THAT COMMIT'S workflow file.** It is namespaced rather
  than `**` for exactly that reason.
- **It is the only mechanism by which `supabase-types-drift` can currently be observed at all.**
  That job has never executed (WINDOWS 242 / 252). `origin/main` still carries an older workflow
  file, so `workflow_dispatch` is not an alternative — GitHub only offers dispatch for workflows
  present on the DEFAULT branch. Pushing a `ci-evidence/…` branch is how 164 finally gets a run.
- **`paths-ignore` still applies to the glob.** A push touching only markdown produces **no run at
  all**, and a missing run reads exactly like a passing one. Before any evidence push, confirm
  `git show --stat HEAD` lists a non-ignored path.

Retention of the glob past phase close was an operator decision, recorded in `163-CI-EVIDENCE.md`
§2.1. Removing it would make every run recorded in that document un-re-runnable.

## 5. `e2e-tests` and `e2e-visual` are RED in CI and were red for every one of Phase 163's runs

The dev server listens and answers HTTP 500; the preflight waits its full 120s and aborts. Filed as
`.planning/todos/pending/2026-09-03-ci-e2e-ssr-500.md`, deferred by operator decision. The practical
consequence for 164: **every workflow RUN conclusion on this branch is `failure`**, so a new job's
health must be read at JOB granularity (`gh run view <id> --json jobs`), never from the run's own
conclusion. Phase 163's ledger records job conclusions for this reason.

---

**A note on the count, because the plan that filed this note said "nine".** `163-09-PLAN.md` states
that "the six-job workflow this phase inherited is now nine". Measured at HEAD by counting
top-level keys under `jobs:`, the figure is **eleven**. The difference is not 163's three additions
being miscounted — it is that the inherited workflow already had eight, not six, because Phase 164's
`supabase-types-drift` and the earlier `node-engine-range-negative-control` were already present.
The measured figure is recorded; the plan's figure is not bent to fit it.
