---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
ran_at: 2026-08-16T13:40:00Z
gates_owed: 4
gates_discharged: 4
status: all_green
evidence_dir: tests/e2e-runs/140-cr01-gates + tests/e2e-runs/140-wr03-gates (gitignored — local only)
supersedes: the 2026-08-15 run of Gates 1-3, which predates the WR-03 chain move
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


---

# Re-run after WR-03 (2026-08-16)

`data-setup-bank-auth-journey` was moved to the tail of the perm serial chain
(`dependencies: ['voter-prefs-tracking']`), so the 2026-08-15 results above no
longer describe the shipped graph. All gates were re-run, and a FOURTH gate was
added for the invocation WR-03 was actually about.

## What the re-run caught (the gate earning its keep)

The first re-run attempt **FAILED**, identically in all three determinism runs:

```
Error: expected exactly one election labelled '[EL1]' to be offered
expect(locator).toHaveCount(expected) failed
Expected: 1   Received: 2
```

`[EL1]` is a **perm-family shape convention emitted by twelve templates**, not a
dataset identity. CR-01's identity selection was unambiguous only because the
setup used to run in phase 2, when just the base dataset (`[el-reg]`, different
names) was live. At the chain tail, perm datasets are live too, and `[EL1]`
matched 2 elections.

This is precisely the failure the pre-CR-01 `.first()` would have swallowed: it
would have picked whichever `[EL1]` sorted first and passed on foreign data.

**Fix:** `buildNotLocated2e2cgTemplate(prefix, labelToken)` — the bank-auth
consumer passes `'BA-'`, giving its dataset its own DISPLAY-label namespace
(`[BA-EL1]`, `[BA-CO1A]`, …) alongside its existing `external_id` prefix
discipline. `perm-not-located-2e2cg` passes no token and its labels are
byte-unchanged; the two templates remain structurally identical modulo prefix
and token (verified programmatically).

## Results

| Gate | Command | Result |
| ---- | ------- | ------ |
| 1 — default suite | `yarn test:e2e` | **135 passed (11.1m)** — `{total:135, expected:135, unexpected:0, flaky:0, skipped:0, ok:true}` |
| 2 — 3× determinism | `--project=bank-auth-journey` ×3 | **115 passed ×3** (11.0 / 10.8 / 10.7m), exit 0 each |
| 3 — CR-01 identity | traces from the three Gate-2 runs | `check` on **`[BA-EL1]`**, `click` on **`[BA-CO1]`** — in **all three** runs |
| 4 — WR-03 combination | `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` | **144 passed (11.1m)** — `{total:144, expected:144, unexpected:0, flaky:0, skipped:0, ok:true}` |

Gate 2 is now 115 tests / ~11 min per run, not 5 tests / 8s — the accepted cost
of joining the chain. Gate 3 needs no separate `--trace on` run: the config sets
`trace: 'on'` globally, so every Gate-2 run carries its own proof.

Gate 4 required `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` exported (from
`supabase status -o env`) — the sibling `bank-auth` (EFLOW-10) project throws at
MODULE LOAD without them, which aborts collection for the whole run. This is
documented in `tests/README.md` and runbook Step E-4, and is not a defect. It is
also why `--project=bank-auth-journey` runs do not need them: that project never
collects `candidate-bank-auth.spec.ts`.

## What is and is not proven about WR-03

The race was a CONCURRENCY defect, and concurrency defects do not fail reliably.
Four green runs are supporting evidence, NOT the proof. The proof is
**structural**: `data-setup-bank-auth-journey` now sits alone at phase 54, and
the only project co-scheduled with it — `data-teardown-perm-analytics-tracking`
— cannot touch `app_settings` (`ALLOWED_TEARDOWN_TABLES` is entity tables only;
the code states resetting `app_settings` is `db:reset`'s job) and operates on a
disjoint prefix. There is no longer any project in that phase that can write the
singleton.

## Residual

- **WR-03 is CLOSED** (structurally, per above), superseding the "still open"
  note in the 2026-08-15 section.
- **WR-04** closed as a scoping decision (`f3f635c13`), not a fix.
- Remaining Info findings from `140-REVIEW.md` are untouched.
