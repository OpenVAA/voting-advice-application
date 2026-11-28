# Phase 186: Deployed Smoke Entry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-14
**Phase:** 186-deployed-smoke-entry
**Areas discussed:** The target gate, The second entry, What the run does, The one-time hosted seeding, Negative controls and proofs, Records

**Mode:** The operator was away, so no question was asked. Every decision was read as its ★ RECOMMENDED option in `186-DISCUSSION-POINTS.md`, which stays open for the operator's fill. The "User's choice" lines below record that reading, not an answer the operator gave.

---

## The target gate

| Option | Description | Selected |
|--------|-------------|----------|
| Ref and project id (A-01) | Served `PUBLIC_SUPABASE_URL` host must be the tfvars `project_ref`, and `data-project-id` the tfvars `public_project_id`; no frontend change | ✓ |
| Explicit `data-supabase-ref` attribute | Cleaner contract; needs a frontend change, a new image and a redeploy | |
| Project id alone | Refuses nothing: `0001` is also the local default | |
| No service-role client in the entry (A-05) | Gate refuses a set service-role key; ESLint forbids value imports of the admin clients | ✓ |
| Parameterise the admin client (research flag, literal) | Puts a hosted-capable bulk-delete client into the tests tree | |
| Required `SMOKE_EXPECTED_SHA` (A-02) | Full 40-hex, exact match with `/api/health` | ✓ |
| Default from tfvars `image_tag` | Proves only that the stack agrees with the file | |
| Read from the served page | Tautology; the control cannot fail | |
| All checks evaluated and printed (A-03) | Each control shows which check failed | ✓ |
| Stop at first failure | Shorter, less diagnostic | |
| `SMOKE_BASE_URL`, no host allowlist (A-04) | Safety on the served project | ✓ |
| Host allowlist | Makes the local-target controls impossible | |

**User's choice:** ★ in every row (operator away).
**Notes:** The research flag is read, not skipped: the constructor already takes a URL, and what blocks a hosted URL is the local-only guard, whose opt-out a read-mostly entry should not hold.

---

## The second entry

| Option | Description | Selected |
|--------|-------------|----------|
| Files beside the local config, specs `tests/tests/deployed/*.smoke.ts` (B-01) | Inside the typecheck, ESLint and vitest scope; `--list` count unchanged | ✓ |
| Separate top-level directory | Outside tsconfig, ESLint and vitest | |
| No `dotenv` (B-02) | Root `.env` holds local keys | ✓ |
| Load `.env` | Local keys reach a hosted run | |
| One project, `retries: 0` everywhere (B-03) | No retried-until-green | ✓ |
| CI retries | Forbidden by the E2E hard rule | |
| No wrapper (B-04) | Exit status read directly | ✓ |
| `e2e-run.sh`-style wrapper | A second wrapper for a one-minute run | |

**User's choice:** ★ in every row (operator away).

---

## What the run does

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse the `smoke` dataset plus one contestant (C-01) | Already seeded in 184; content read from `smokeTemplate` | ✓ |
| Seed `e2e/base` on the hosted project | Two elections in project `0001`; hosted prefix teardown later | |
| New purpose-built template | A second hosted sitting; may remove the probe's dataset | |
| `walkVoterStages` plus page objects (C-02) | Leaves the local fixtures alone | ✓ |
| Generalise `answeredVoterPage` | Touches the local gate's fixture | |
| Sign in, assert home, sign out (C-03) | Auth-service writes only | ✓ |
| No sign-out | Leaves a refresh token per run | |
| Also save an answer | A write voters read | |
| Address and password as inputs (C-04) | Nothing committed or printed | ✓ |
| Commit the address | Public address next to a public form | |

**User's choice:** ★ in every row (operator away).

---

## The one-time hosted seeding

| Option | Description | Selected |
|--------|-------------|----------|
| curl user plus committed `grant-smoke-contestant.sql` (D-01) | Modelled on `grant-project-admin.sql`; no dev-seed, no `--allow-remote` | ✓ |
| Auth user in the `smoke` template | Against dev-seed's design; rerun with `--allow-remote` | |
| Admin-App invitation and mailed link | Mail round trip, excluded by E2 | |
| Orchestrator at an operator-approved checkpoint (D-02) | Keychain credentials, ref-refusing prelude, read-back | ✓ |
| Operator by hand | About six paste-backs | |
| Tonight under the 184 standing authorisation | Stretches an authorisation to a new kind of write | |
| Generated password stored in the keychain (D-03) | Never printed or on a command line | ✓ |
| Operator-chosen password | Human-chosen secret on a public form | |

**User's choice:** ★ in every row (operator away).
**Notes:** D-02 is the one item that needs the operator before the phase can complete: the contestant half of the green run waits for the approved sitting.

---

## Negative controls and proofs

| Option | Description | Selected |
|--------|-------------|----------|
| Real targets, each failing at its own check alone (E-01) | Wrong SHA on staging; local builds for the wrong id and the foreign ref | ✓ |
| Expected id and ref as inputs | Makes the dedicated identity a variable | |
| Unit tests only for (2) and (3) | Success criterion 2 asks for a run | |
| Unit test of refused refs (E-02) | No input widens the allowed ref | ✓ |
| Refusal list of production refs | There are none; unlisted refs pass | |
| Unit-test scan for `DEV_SEED_ALLOW_REMOTE` and setup projects (E-03) | Covers the workflows 187 adds | ✓ |
| One grep in the evidence | Says nothing about later workflows | |
| Empty diff of the local gate, one full run at the end (E-04) | Standing rule of 2026-11-09 | ✓ |
| Full run after every plan | About 10 minutes each | |

**User's choice:** ★ in every row (operator away).

---

## Records

| Option | Description | Selected |
|--------|-------------|----------|
| README Step 22, `tests/README.md` section, one CLAUDE.md line, phase evidence (F-01) | Inputs findable by 187 and 189 | ✓ |
| Phase evidence only | Inputs buried in plan evidence | |
| Fold no todos (F-02) | No pending todo is in scope | ✓ |
| Fold the local port-identity todo | Touches the local gate | |

**User's choice:** ★ in every row (operator away).

## Claude's Discretion

None. Every reversible technical item is listed under "Decided autonomously" in CONTEXT.md.

## Deferred Ideas

- Pipeline wiring of the smoke run (187).
- An explicit `data-supabase-ref` attribute, if reading the SvelteKit `env` block proves fragile.
- Bank-auth contestant sign-in (A4) and an automated mail round trip (E2).
