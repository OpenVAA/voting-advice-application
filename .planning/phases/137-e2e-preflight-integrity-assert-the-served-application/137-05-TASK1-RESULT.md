# Phase 137 Plan 05 — Task 1 Result: the cardinal-rule gate

**Status:** Task 1 COMPLETE. Task 2 (CI observation checkpoint) NOT executed — it requires a `git
push`, which the orchestrator is handling with the operator. This document is deliberately **not**
`137-05-SUMMARY.md`; the plan is still open.

Executed 2026-08-13 on `feat-gsd-roadmap`, tree at `894dbfd2e` (plan 04's completion commit).

## Headline

`yarn test:e2e` ran **134 tests, 134 passed, 0 failed, 0 skipped, 0 flaky, 0 did-not-run**, exit **0**,
wall **648 s (10.8 min)** — with the preflight active and passing on the first attempt. The project's
E2E Hard Rule holds unwaived: nothing was retried, nothing was annotated flaky, no criterion was
weakened.

## Environment (why not port 5173)

The run was performed on **port 5273**, not the default 5173, and the reason is itself part of the
evidence. Port 5173 is held by a **sibling OpenVAA checkout in Docker** (`com.docker` PID 62915,
IPv6 wildcard `*:5173`). Per plan 02's measured wildcard shadow-bind, our own server can still bind
`[::1]:5173` even with `strictPort: true`, after which `localhost:5173` and `127.0.0.1:5173` reach
*different applications*. A suite run there would measure an ambiguous target — precisely the false
green this phase exists to eliminate.

`FRONTEND_PORT=5273` was exported as a **shell prefix** for both the dev server and Playwright. The
root `.env` was never opened, read, or written: the shell form wins over `.env` (plan 02 D-16 row b),
so no checksum-and-restore dance was needed and `.env` is byte-identical by construction.

| Item | State |
|---|---|
| Database | `yarn db:reset` → exit 0 (migrations + `seed.sql`) |
| Dev server | one fresh `FRONTEND_PORT=5273 yarn dev`, single listener `node` PID 84716 on `[::1]:5273` |
| Stale listeners | none — 5273/9443/8777 all free before the run, no vite/playwright processes |
| Supabase | already up on 54321 (`supabase_kong_openvaa-local` — **this** repo's stack, per 137-03's correction of 137-01) |
| Docker sibling | left untouched throughout |

Pre-run identity confirmation of the target: `HTTP 200`, `<title>Election Compass</title>`, and the
preflight's own probe `GET /@fs<repo>/apps/frontend/src/routes/+layout.svelte` → **200** with the
absolute path echoed back in the HMR preamble.

> A `GET /@fs<repo>/package.json` returns **403** from our own correct server. That is expected and
> documented: SvelteKit replaces Vite's `server.fs.allow` list and the repo root is not in it, which
> is exactly why `PROBE_RELATIVE_PATH` is the route layout rather than a "more obvious" root marker.

## The full suite

```
FRONTEND_PORT=5273 yarn test:e2e
  → Running 134 tests using 6 workers
  → 134 passed (10.8m)
  → exit 0
```

- Started `2026-08-13T11:59:33Z`, ended `2026-08-13T12:10:21Z`, measured wall **648 s**.
- Progress counter reached `[134/134]` — every selected test produced a result.
- Marker counts over the ANSI-stripped log: `E2E PREFLIGHT FAILED` **0**, `did not run` **0**,
  `flaky` **0**, `interrupted` **0**, `failed` **0**, `Error: ` **0**.

### Count reconciliation — the 142 vs 134 question, settled

The brief flagged an unexplained drop in executed tests as a regression in its own right. There is no
drop; the two figures in the planning record are **two different selections of one suite**:

| Invocation | Result |
|---|---|
| `npx playwright test --list` | **142 tests in 93 files** — matches the wave-1 and wave-3 baseline exactly |
| `npx playwright test --list --grep-invert @probe` | **134 tests in 88 files** |
| `yarn test:e2e` (carries `--grep-invert @probe` by definition) | **134 executed, 134 passed** |

The 8-test / 5-file delta is the `@probe` project, which `yarn test:e2e` excludes by definition. The
grep-inverted list (134/88) equals the executed count (134) exactly. This also retires the standing
ambiguity around the "older `134 tests in 88 files`" figure in the v2.14 archive: it is not a stale
smaller suite, it is the same `--grep-invert @probe` selection this run measured.

## Bank-auth — the only invocation exercising the `webServer` entry

Both directions confirmed. Setup followed the Idura runbook EFLOW-10 steps E-1…E-3: test env +
JWKS derived from `tests/tests/utils/testKeys.ts` into `/tmp`, a static JWKS server on 8777, and
`supabase functions serve identity-callback --no-verify-jwt --env-file /tmp/eflow10.env`.

**Positive — `PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5273 --project=bank-auth`:**

```
Running 8 tests using 1 worker
  8 passed (6.7s)
  exit 0
```

No `E2E PREFLIGHT FAILED`. The mock issuer started (webServer), the preflight passed after it, the
specs executed, and port 9443 was **free** after the run.

**Negative — `PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5173` (the foreign sibling):**

```
Error: E2E PREFLIGHT FAILED — the server on port 5173 is not this checkout's dev server.
  reason:            the listener is not this checkout's Vite dev server
                     (GET http://localhost:5173/@fs<repo>/apps/frontend/src/routes/+layout.svelte
                      returned 404, expected 200)
  expected port:     5173 (http://localhost:5173)
  expected checkout: /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
  observed:          HTTP 200 -> http://localhost:5173/sv; <title>Valkompass</title>;
                     served module root: /opt/frontend
  listening process:
    com.docke 62915 … TCP *:5173 (LISTEN)
  remedies: …
  exit 1
```

Zero `Running N test` lines and zero spec titles — **no spec body executed**. This is a stronger
negative than a dead port: the foreign server answered `200` with a title (`Valkompass`) that is a
legitimate `appName` in this checkout's own catalogue, so clauses (a) and (c) both pass and clause (b)
is isolated as the sole discriminator. The `served module root: /opt/frontend` line names the wrong
checkout outright.

**No orphan, and the issuer demonstrably started.** The first negative run left 9443 free, but an
absent orphan alone cannot distinguish "started then torn down" from "never started". The run was
therefore repeated while polling `lsof` on 9443 every 250 ms: the mock issuer was **observed
LISTENing** as `node` PID 97207 on `127.0.0.1:9443` during the run, and the port was **FREE**
afterwards. This is the §R2.4 ordering (webServer before globalSetup) confirmed end to end, together
with Playwright's clean teardown of a server started for a run that then aborted.

## Static gates, re-confirmed on the final tree

| Gate | Result |
|---|---|
| `grep -rn -i "listener" CLAUDE.md tests/README.md tests/IDURA-TEST-RUNBOOK.md` | no match |
| `grep -rn -i "node process"` over the same three | no match |
| `grep -c "seq 1 60" .github/workflows/main.yaml` | **0** |
| `grep -c "Wait for frontend" .github/workflows/main.yaml` | **0** |
| `grep -c "Start frontend" .github/workflows/main.yaml` | **2** (both jobs still start it) |
| any `until curl` / `for i in` / `sleep 2` remnant in the workflow | none |

## Toolchain gates

| Command | Result |
|---|---|
| `yarn typecheck:tests` | exit **0** |
| `yarn lint:check` | exit **0** — 0 errors; warnings are pre-existing `unused-imports` in `packages/core` and `packages/dev-seed`, untouched by this phase and out of scope |

## Cleanup and final state

Every server started for this task was killed. No repo file was modified by Task 1 (it is
verification-only): `git status --short` shows only the two modifications that predate this session
(`.vscode/settings.json`, `supabase/.temp/cli-latest`). The `/tmp` EFLOW-10 artifacts — including the
test decryption JWK — were deleted.

| Port | Final state |
|---|---|
| 5273 | FREE |
| 9443 | FREE |
| 8777 | FREE |
| 5173 | Docker sibling, PID 62915 — untouched, exactly as found |
| 54321 | this repo's Supabase — still up, as required |

`STATE.md` and `ROADMAP.md` were not modified. Nothing was pushed to any remote.

## What Task 1 does NOT discharge

The CI-only gap the plan names explicitly. After the wait-loop removal the preflight's 120 s CI poll
is the only thing absorbing runner cold-start, and that failure mode has **no local reproduction** by
construction. Task 2 remains open and must observe a real run on both jobs (E2E and `e2e-visual`)
before the phase can be sealed.
