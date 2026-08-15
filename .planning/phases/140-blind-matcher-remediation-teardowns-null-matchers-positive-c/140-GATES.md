---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
ran_at: 2026-08-15T23:44:00Z
gates_owed: 3
gates_discharged: 3
status: all_green
evidence_dir: tests/e2e-runs/140-cr01-gates (gitignored — local only)
---

# Phase 140: E2E Gate Discharge

Discharges IN-05 from `140-REVIEW.md`, which had stood owed across all three
`--auto` fix/re-review iterations. Every prior verification in this phase was
static (`tsc`, eslint, unit suites, `playwright --list`); nothing had been
proven green against a running application until this run.

Preceded by the CR-01 implementation (`10ca954ac`) and the WR-04 scoping
decision (`f3f635c13`).

## Gate 1 — blocking default suite

```
yarn db:reset && yarn dev && yarn test:e2e
```

**PASSED — cardinal-clean. 135 passed (10.7m).**

Counts taken from the HTML report's embedded `report.json`, NOT the console
tail (per the project-memory evidence rule):

```json
{ "total": 135, "expected": 135, "unexpected": 0,
  "flaky": 0, "skipped": 0, "ok": true }
```

`total == expected` with `skipped: 0` is what establishes **0 did-not-run** —
which this project counts as a failure, not a neutral outcome.

## Gate 2 — bank-auth 3× determinism (IDURA-TEST-RUNBOOK.md Step B-3)

```
PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey
```

**PASSED — 3× consecutive, deterministic.**

| run | result | duration | exit |
| --- | ------ | -------- | ---- |
| 1   | 5 passed | 9.8s   | 0    |
| 2   | 5 passed | 8.5s   | 0    |
| 3   | 5 passed | 8.4s   | 0    |

Run shape is 5 projects (not 3) — `data-setup-base` + `data-teardown-base` are
pulled in by the `dependencies: ['data-setup-base']` edge, exactly as the
iteration-3 review measured. Per project-memory, the gate is ONE clean
`db:reset` baseline followed by 3 CONSECUTIVE runs (not reset-per-iteration):
rapid repeated resets 502-wedge local Supabase Storage, and each project's
setup/teardown owns its own per-run data.

`[setupFromTemplate] Database is NOT fresh — found 5 non-test candidate(s) and
5 non-test organization(s)` appears on every run. This is expected and is the
precise condition CR-01's fix exists to make safe: base's rows coexist with the
bank-auth dataset by design once the edge is in place.

## Gate 3 — CR-01-specific (which election was actually selected)

```
PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey --trace on
```

**PASSED — and this is the gate that actually proves CR-01 fixed.**

A green Gate 2 could NOT discharge CR-01: the pre-fix failure mode was a *pass
on the wrong dataset*, indistinguishable from a correct pass at the assertion
level. Only the trace settles which option the walk checked.

Extracted from `0-trace.trace`:

```
expect      | [EL1] election
isDisabled  | [EL1] election
check       | [EL1] election
expect      | [CO1] constituency
click       | [CO1] constituency
```

Full resolved election selector:

```
internal:testid=[data-testid="preregister-elections-list"s]
  >> internal:testid=[data-testid="election-selector-option-label"s]
  >> internal:has-text="[EL1]"i
  >> internal:testid=[data-testid="election-selector-option"s]
```

So `check` fired on the `[EL1]`-labelled option and `click` on a `[CO1]`
constituency — the walk provably exercises its OWN dataset while base's four
elections are live in the same DB. Under the pre-fix positional `.first()`,
base's `test-e2e-base-el-reg` (`sort_order: 0`, tied with this dataset's
`el-1`) would have been selected instead, silently.

`submitElection`'s `toHaveCount(1)` passing additionally proves exactly one
`[EL1]` option was offered — an ambiguous or absent dataset now fails loudly
rather than being walked past.

## Environment notes (cost real time; worth recording)

- The edge runtime resolves `host.docker.internal` to an **IPv6** address, but
  `python3 -m http.server` binds IPv4-only by default. The test-JWKS server
  must be started `--bind ::` or the Edge Function's JWKS fetch fails at verify
  time with a confusing error. Verified 200 on both stacks before running.
- The dev server binds `[::1]` only, so `curl 127.0.0.1:5173` returns 000 even
  when it is up. Use `localhost`.
- The SvelteKit process must carry the IdP env in ITS OWN environment (runbook
  Pitfall 1). Verified by reading `/proc`-equivalent process env (`ps eww`)
  rather than trusting that `source` took.
- All test-only services (mock issuer :9443, test-JWKS :8777, `functions serve`
  with test decryption keys, and the `NODE_TLS_REJECT_UNAUTHORIZED=0` dev
  server) were stopped and verified gone after the run — threat T-122-07.

## Residual — still open after this run

- **WR-03** remains a real finding (not collapsed to a doc fix): the operator
  decision is that `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` IS supported, so the
  `app_settings` singleton race between `data-setup-base` and
  `data-setup-bank-auth-journey` sharing phase 1 still needs addressing. None
  of the three gates exercises that combination — Gate 1 runs without
  `PLAYWRIGHT_BANK_AUTH`, Gates 2–3 run the project in isolation.
- **WR-04** is closed as a scoping decision, not a fix (`f3f635c13`).
- The remaining Info findings from `140-REVIEW.md` are untouched.
