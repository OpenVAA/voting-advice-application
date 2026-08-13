# Phase 137 — Negative Control: the E2E served-application preflight

**Two runs, four halves, all observed on one machine in one session.** The retired check is run
against a foreign server and against ours, and cannot tell them apart. The committed preflight is run
against the same two servers, and does.

- **Date:** 2026-08-13
- **Plan:** `137-03-PLAN.md` (wave 2)
- **Decisions discharged:** D-11 (staged adversary), D-12 (retired check as a throwaway script), D-13 (this document)
- **Requirements:** INTEG-04, INTEG-05
- **Precedent followed:** `.planning/milestones/v2.14-phases/136-real-guards-visual-repair-sweep-remediation/136-VISUAL-DISCRIMINATION-EVIDENCE.md`

---

## 1. Why this run existed

The v2.15 milestone carries a **standing acceptance rule**: every new check must be run as a negative
control **twice** — once against the old assertion to demonstrate its blindness, once against the new
assertion to demonstrate the catch. ROADMAP Phase 137 restates it as success criterion 1:

> 1. With a **foreign dev server** occupying the target port — a real second Vite project answering
>    200, as measured on 2026-08-11 — the preflight FAILS and names the mismatch. The identical
>    scenario is first run against the retired "listener is a `node` process" check and observed to
>    PASS: the two-run negative control that demonstrates the old check's blindness before the new
>    one's catch.

Criterion 1 is the only success criterion in this phase whose proof is an **observation of a
failure**. An observation does not survive the session that produced it, so it is recorded here.

**The concrete incident behind the phase.** A sibling OpenVAA checkout — the non-`-gsd` working tree —
runs its frontend in Docker and binds port 5173. It is a real Vite dev server serving a real
SvelteKit build of the *same application* from a *different module root* (`/opt/frontend`), and it
`301`-redirects `/` to a locale segment. Any E2E run started against it answers 200, renders a
plausible VAA, and produces results that read as application behaviour. A green suite measured
against that server is a false green, and a false green is undetectable after the fact. That is the
class of failure this preflight exists to make impossible.

The retired defence against it was the runbook instruction to "assert the listener is a `node`
process". This document shows, by measurement, that that instruction does not detect a foreign
application.

---

## 2. Environment

Every value below was captured in the same session as the runs. A future re-run that behaves
differently should be diagnosed against this stamp before it is called a regression.

```
date:               2026-08-13T08:02:46Z (UTC)  /  2026-08-13 11:02 EEST
repo root:          /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:           5b0813e94  branch feat-gsd-roadmap
OS:                 macOS 26.5.1 arm64
Node:               v24.14.1
Vite (root hoist):  7.3.0
Vite (frontend):    vite/6.4.1 darwin-arm64 node-v24.14.1
SvelteKit:          2.55.0
Playwright:         1.58.2
Supabase local:     project_id=openvaa-local (apps/supabase/supabase/config.toml:5), /rest/v1/ -> 200
```

> **Vite version split, carried from RESEARCH §R1.1.** `apps/frontend/package.json` pins `^6.4.1` and
> resolves its own nested copy; the workspace root hoists 7.3.0. **This checkout's dev server runs
> 6.4.1. The staged adversary runs 7.3.0**, because it borrows the root binary. That split is not a
> confound — clause (b) is an absolute-filesystem-path assertion, not a version assertion — but it is
> recorded so nobody later reads the adversary's Vite version as part of the control.

### Port allocation

| Port | Held by | Role in this control |
|---|---|---|
| **5273** | this checkout's `yarn workspace @openvaa/frontend dev` (Vite 6.4.1) | the CORRECT server — everything must pass against it |
| **5373** | the staged adversary (`$SCRATCH/foreign-app`, Vite 7.3.0) | the STAGED foreign server (D-11) |
| 5173 | `voting-advice-application-frontend-1` (Docker; the sibling checkout) | the FOUND foreign server — probed read-only over HTTP, never touched |
| 54321 | `supabase_kong_openvaa-local` (Docker) | this repo's local Supabase, healthy — needed by the run-2b real project run |

**5173 was deliberately avoided for staging.** Docker Desktop holds the IPv6 **wildcard** there
(`TCP *:5173`). Binding a second server to the same port produces the shadow-bind (§7), where
`localhost` and `127.0.0.1` reach *different* servers and it becomes ambiguous which server is under
test. This control is about **content**, not about winning a port race.

> **Correction to a carried-forward claim.** `137-01-SUMMARY.md` attributes port 54321 to "the sibling
> checkout's Docker container". Measured this session, 54321 is `supabase_kong_openvaa-local` — the
> Supabase stack for the `project_id` declared in **this** repo's `apps/supabase/supabase/config.toml:5`.
> `lsof` reports `com.docke` as the listener for every Docker-published port, which is what made the
> two containers look like one. Immaterial to the earlier conclusions, recorded so the confusion is
> not inherited again.

### `lsof` for every port involved, at the time of the runs

```
--- lsof -nP -iTCP:5273 -sTCP:LISTEN  (this checkout's dev server) ---
COMMAND   PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    78784 kallejarvenpaa   48u  IPv6 0x95ddac433d77260d      0t0  TCP [::1]:5273 (LISTEN)

--- lsof -nP -iTCP:5373 -sTCP:LISTEN  (the staged adversary) ---
COMMAND   PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    78697 kallejarvenpaa   18u  IPv6 0xa2838e1a3a2c2226      0t0  TCP [::1]:5373 (LISTEN)

--- lsof -nP -iTCP:5173 -sTCP:LISTEN  (the FOUND adversary, untouched) ---
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 62915 kallejarvenpaa  219u  IPv6 0x1b5ed85d77da8c4f      0t0  TCP *:5173 (LISTEN)

--- lsof -nP -iTCP:54321 -sTCP:LISTEN ---
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 62915 kallejarvenpaa  149u  IPv6 0x4688f936ac47f7a2      0t0  TCP *:54321 (LISTEN)
```

---

## 3. The adversary (D-11) — rebuildable on any machine

D-11 chose a **staged throwaway Vite project** over the live sibling container, explicitly trading
adversary strength for reproducibility on any machine. That trade only pays if the recipe is complete
here, so the four files are reproduced verbatim. **They are NOT committed to the harness** — they live
in the scratch directory and are gone; this section is how they come back.

The adversary is built to be the **hardest** adversary that choice allows. It deliberately defeats two
of the preflight's three clauses:

- **Clause (a) — liveness:** it answers `301 → /sv/` and then 200, reproducing the sibling
  container's redirect-to-locale shape. It is genuinely live, so clause (a) cannot catch it.
- **Clause (c) — title sanity:** it serves a **byte-identical** `<title>Election Compass</title>`,
  which is this checkout's `en` app name (`apps/frontend/messages/en/dynamic.json` → `.dynamic.appName`).
  So clause (c) cannot catch it either.

That leaves **clause (b) — the `/@fs` absolute-path identity probe — as the only discriminator**, which
is exactly what this control needs to isolate.

`$SCRATCH/foreign-app/package.json`

```json
{ "name": "foreign-adversary", "private": true, "type": "module" }
```

`$SCRATCH/foreign-app/index.html`

```html
<!doctype html>
<html lang="sv">
  <head><meta charset="utf-8" /><title>Election Compass</title></head>
  <body><div id="app">foreign</div><script type="module" src="/src/main.js"></script></body>
</html>
```

`$SCRATCH/foreign-app/src/main.js`

```js
document.querySelector('#app').textContent = 'foreign app served from a DIFFERENT checkout';
```

`$SCRATCH/foreign-app/vite.config.js` — the middleware that reproduces the redirect-to-locale shape:

```js
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [
    {
      name: 'locale-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '') {
            res.statusCode = 301;
            res.setHeader('location', '/sv/');
            res.end();
            return;
          }
          if (req.url === '/sv/' || req.url === '/sv') {
            req.url = '/index.html';
          }
          next();
        });
      }
    }
  ]
});
```

**Launch** (no install: the repo's own `node_modules` is symlinked in, and the repo's own Vite binary
is used):

```bash
ln -sfn <REPO_ROOT>/node_modules $SCRATCH/foreign-app/node_modules
cd $SCRATCH/foreign-app
<REPO_ROOT>/node_modules/.bin/vite dev --port 5373 --strictPort
```

**And this checkout's own server, for the correctness half:**

```bash
FRONTEND_PORT=5273 yarn workspace @openvaa/frontend dev
```

### Observed: the adversary reproduces both shapes

```
### un-followed GET / on 5373 (adversary)
HTTP/1.1 301 Moved Permanently
Vary: Origin
location: /sv/
Date: Thu, 13 Aug 2026 08:02:06 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 0

STATUS=301 BODYBYTES=0

### followed GET / on 5373
STATUS=200 FINAL=http://localhost:5373/sv/
### title 5373
<title>Election Compass</title>

### followed GET / on 5273 (this checkout)
STATUS=200 FINAL=http://localhost:5273/
### title 5273
<title>Election Compass</title>

### byte-identical title comparison
TITLES_BYTE_IDENTICAL: <title>Election Compass</title>
```

Note the `Content-Length: 0` on the 301. That empty body is why clause (a) must **follow** redirects:
a content check reading the un-followed response has nothing to disagree with and would pass anything.

---

## 4. RUN 1 — blindness: the retired check, against BOTH servers

### 4.1 Provenance — the retired check never existed in code

Phase 137 scout **finding F3**: the "assert the listener is a `node` process" check exists only as
**runbook prose**, never as a committed script or test. D-12 therefore requires writing it as a
throwaway script for this control. Its archived sources, quoted by file and line:

`.planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/135-04-PLAN.md:45-48`
— the operative instruction:

> "Three CONSECUTIVE full-suite `yarn test:e2e` runs. Before EACH run: kill the `:5173` process,
> relaunch `yarn dev`, wait healthy, and assert the listener is `node` (`lsof -nP -iTCP:5173
> -sTCP:LISTEN`) per DEF-135-03 — a sibling checkout's Docker container can win the port and serve a
> stale build answering 200."

`.planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/135-04-SUMMARY.md:32`:

> "Assert the :5173 listener is a node process whose command path contains THIS repo before trusting
> any local E2E measurement — an HTTP 200 proves only that something answered"

`.planning/milestones/v2.14-REQUIREMENTS.md:119` — the Phase-136 content variant:

> "**Port identity was asserted by RESPONSE CONTENT, not process type** — `curl -s
> http://localhost:$PORT/ | grep -q '<title>Election Compass</title>'`"

### 4.2 The throwaway script (D-12) — verbatim, NOT committed to the harness

It implements **both** readings, so the demonstration cannot be dismissed as attacking a straw man:
this is the strictly stronger reading of "the retired check".

```bash
#!/bin/bash
# The RETIRED check, reconstructed from the two archived prose sources it existed as.
# It never existed in code (Phase 137 scout finding F3) — only as runbook prose:
#
#   135-04-PLAN.md:45-48  "assert the listener is `node` (`lsof -nP -iTCP:5173 -sTCP:LISTEN`)
#                          per DEF-135-03 — a sibling checkout's Docker container can win the
#                          port and serve a stale build answering 200."
#   v2.14-REQUIREMENTS.md:119
#                         "Port identity was asserted by RESPONSE CONTENT, not process type —
#                          curl -s http://localhost:$PORT/ | grep -q '<title>Election Compass</title>'"
#
# BOTH readings are implemented, so the blindness demonstration cannot be dismissed as
# attacking a straw man: this is the strictly STRONGER reading of "the retired check".
PORT="$1"
echo "  [retired] lsof -nP -iTCP:$PORT -sTCP:LISTEN"
LISTENER=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $1}')
PID=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $2}')
echo "  [retired] listener COMMAND = '$LISTENER' (pid $PID)"
if [ "$LISTENER" != "node" ]; then
  echo "  [retired] RESULT: FAIL (listener is not a node process)"
  exit 1
fi
echo "  [retired] curl -sL http://localhost:$PORT/ | grep '<title>Election Compass</title>'"
if curl -sL "http://localhost:$PORT/" | grep -q '<title>Election Compass</title>'; then
  echo "  [retired] RESULT: PASS (node process + title matches)"
  exit 0
else
  echo "  [retired] RESULT: FAIL (title mismatch)"
  exit 1
fi
```

### 4.3 Both halves, observed

```
############################################################
# RUN 1a — the RETIRED check against the FOREIGN server :5373
############################################################
  [retired] lsof -nP -iTCP:5373 -sTCP:LISTEN
  [retired] listener COMMAND = 'node' (pid 78697)
  [retired] curl -sL http://localhost:5373/ | grep '<title>Election Compass</title>'
  [retired] RESULT: PASS (node process + title matches)
  >>> exit=0

############################################################
# RUN 1b — the RETIRED check against OUR server :5273
############################################################
  [retired] lsof -nP -iTCP:5273 -sTCP:LISTEN
  [retired] listener COMMAND = 'node' (pid 78784)
  [retired] curl -sL http://localhost:5273/ | grep '<title>Election Compass</title>'
  [retired] RESULT: PASS (node process + title matches)
  >>> exit=0
```

### 4.4 The finding

**The two outputs are indistinguishable.** They differ only in the port number and the PID — values
that are inputs and incidentals, not verdicts. Both report `RESULT: PASS`. Both exit **0**.

State this precisely, because a single PASS proves nothing: the retired check produces **no signal
that discriminates a foreign application from ours**. Its entire output is `listener is node` and
`title matches`, and a six-line Vite project satisfies both. An operator following the runbook
faithfully, on a machine where a sibling checkout holds the port, would have proceeded to run the
suite and trusted the result.

That is criterion 1's first run, discharged.

---

## 5. RUN 2 — the catch: the committed preflight, against BOTH servers

Run 2 exercises the **committed** modules — `tests/tests/support/preflight.ts` via
`tests/global-setup.ts`, wired at `tests/playwright.config.ts:99` — through a real `npx playwright
test` invocation. Not the research prototype: criterion 1's evidence must be about the code that
shipped.

### 5.1 RUN 2a — against the staged adversary on :5373 → exit 1

```
############################################################
# RUN 2a — the COMMITTED preflight against the FOREIGN server :5373
############################################################
$ FRONTEND_PORT=5373 npx playwright test -c ./tests/playwright.config.ts --grep "@__preflight_probe_no_match__" --pass-with-no-tests
Error: E2E PREFLIGHT FAILED — the server on port 5373 is not this checkout's dev server.
  reason:            the listener is not this checkout's Vite dev server (GET http://localhost:5373/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte returned 403, expected 200)
  expected port:     5373 (http://localhost:5373)
  expected checkout: /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
  observed:          HTTP 200 -> http://localhost:5373/sv/; <title>Election Compass</title>; served module root: (not found)
  listening process:
    COMMAND   PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
    node    78697 kallejarvenpaa   18u  IPv6 0xa2838e1a3a2c2226      0t0  TCP [::1]:5373 (LISTEN)
  remedies:
    - stop the other server occupying port 5373, then start this repo's `yarn dev`; or
    - re-run with FRONTEND_PORT=<port your server is actually on>

   at support/preflight.ts:320

  318 |
  319 |   function fail(reason: string): never {
> 320 |     throw new Error(buildFailureMessage({ reason, port, baseURL, repoRoot, observed }));
      |           ^
  321 |   }
  322 |
  323 |   // --- On-disk sanity, BEFORE any network work --------------------------------
    at fail (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/support/preflight.ts:320:11)
    at assertServedApp (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/support/preflight.ts:361:5)
    at globalSetup (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/global-setup.ts:52:3)
>>> exit=1
```

**Read the `observed:` line — it is the whole point of this control.** It reports the adversary
**passing** the two subordinate clauses:

| Clause | What the adversary did | Verdict |
|---|---|---|
| **(a)** liveness after following redirects | `HTTP 200 -> http://localhost:5373/sv/` | **PASSED** — genuinely live, genuine locale redirect |
| **(c)** title sanity against the message catalogue | `<title>Election Compass</title>` — byte-identical to the `en` app name | **PASSED** — the catalogue accepts it |
| **(b)** `/@fs` absolute-path identity probe | `returned 403, expected 200` | **CAUGHT IT** |

The `served module root: (not found)` line is a second, independent tell: a minimal Vite project has
no `.svelte-kit` reference to emit at all.

**Clause (b) is the load-bearing clause, and clauses (a) and (c) are not.** This is that claim
measured rather than asserted — and it is why the `=== 200` comparison in `preflight.ts:360` matters:
the adversary answered **403** (its serving root lies elsewhere), so a `!== 404` comparison would have
let it through.

### 5.2 RUN 2b(i) — against this checkout's server on :5273 → exit 0

```
############################################################
# RUN 2b(i) — the COMMITTED preflight against OUR server :5273 (cheap half)
############################################################
$ FRONTEND_PORT=5273 npx playwright test -c ./tests/playwright.config.ts --grep "@__preflight_probe_no_match__" --pass-with-no-tests
>>> exit=0
```

No `E2E PREFLIGHT FAILED` anywhere in the output. **Without this half, criterion 1 would be
discharged by a check that simply always fails.** The gate is correct, not merely strict.

### 5.3 RUN 2b(ii) — "and the suite proceeds" (ROADMAP criterion 2)

Opening the gate is not the same as the suite running. A real project run, dependency chain and all:

```
############################################################
# RUN 2b(ii) — the suite PROCEEDS: a real project run against OUR server :5273
############################################################
$ FRONTEND_PORT=5273 npx playwright test -c ./tests/playwright.config.ts --project=cold-entry-dataroot --reporter=line
Running 4 tests using 2 workers
[1/4] [data-setup-base] › tests/tests/setup/shared/base.setup.ts:18:1 › import base dataset
[2/4] [cold-entry-dataroot] › tests/tests/specs/voter/cold-entry-dataroot.spec.ts:44:3 › cold-entry-dataroot › cold direct-URL entry to /en/info renders the election-data region
[3/4] [cold-entry-dataroot] › tests/tests/specs/voter/cold-entry-dataroot.spec.ts:31:3 › cold-entry-dataroot › cold direct-URL entry to /en/elections renders the populated elections list
[4/4] [data-teardown-base] › tests/tests/setup/shared/base.teardown.ts:30:1 › delete base dataset
  4 passed (5.5s)
>>> exit=0
```

Two real spec bodies executed and passed, plus the data setup/teardown chain.

### 5.4 The four run records, side by side

| # | Check | Target | Exit | Verdict |
|---|---|---|---|---|
| 1a | retired (`node` process + title grep) | **:5373 foreign** | **0** | PASS — blind |
| 1b | retired (`node` process + title grep) | **:5273 ours** | **0** | PASS — indistinguishable from 1a |
| 2a | committed preflight | **:5373 foreign** | **1** | FAIL, clause (b), named |
| 2b | committed preflight | **:5273 ours** | **0** | PASS, and the suite proceeds (§5.3) |

---

## 6. Invocation matrix (INTEG-05) — the gate cannot be routed around

Every shape below was run against the **adversary** on :5373. "spec output" counts both `Running N
test` lines and any `› tests/…` spec title in the output.

```
############################################################
# INVOCATION MATRIX (INTEG-05) — all shapes against the FOREIGN server :5373
############################################################
------------------------------------------------------------
SHAPE: no flags at all
$ FRONTEND_PORT=5373 npx playwright test -c ./tests/playwright.config.ts
  exit code:            1
  'E2E PREFLIGHT FAILED' present:  1
  'Running N test' lines (spec execution): 0
  spec titles in output ('› tests/'):      0
------------------------------------------------------------
SHAPE: --project=cold-entry-dataroot
  exit code:            1
  'E2E PREFLIGHT FAILED' present:  1
  'Running N test' lines (spec execution): 0
  spec titles in output ('› tests/'):      0
------------------------------------------------------------
SHAPE: --grep "result card"
  exit code:            1
  'E2E PREFLIGHT FAILED' present:  1
  'Running N test' lines (spec execution): 0
  spec titles in output ('› tests/'):      0
------------------------------------------------------------
SHAPE: --shard=1/2
  exit code:            1
  'E2E PREFLIGHT FAILED' present:  1
  'Running N test' lines (spec execution): 0
  spec titles in output ('› tests/'):      0
```

All four reported the identical clause (b) reason:

```
reason:            the listener is not this checkout's Vite dev server (GET http://localhost:5373/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte returned 403, expected 200)
```

| Invocation | Exit | Preflight block | Spec body executed |
|---|---|---|---|
| no flags at all | **1** | yes | **none** |
| `--project=cold-entry-dataroot` | **1** | yes | **none** |
| `--grep "result card"` | **1** | yes | **none** |
| `--shard=1/2` | **1** | yes | **none** |
| `--list` (see below) | 0 | **not invoked — by design** | n/a (lists only) |

### The `--list` exemption is correct and deliberate — do not "fix" it

Measured with **both staged servers already torn down**, i.e. with nothing serving the app at all:

```
--- port state before ---
:5273 -> FREE
:5373 -> FREE

$ cd tests && npx playwright test --list
  [voter-prefs-tracking] › specs/voter/voter-prefs-tracking.spec.ts:212:3 › voter-prefs-tracking (EFLOW-08) › user-preferences round-trip: consent + feedback + survey survive a reload
Total: 142 tests in 93 files
>>> exit=0
  'E2E PREFLIGHT FAILED' present: 0
```

Two independent justifications:

1. `tests/README.md:21-25` advertises `--list` as a "no dropped specs" check **explicitly usable
   without a running dev server**. A preflight on `--list` would break a documented workflow.
2. The `--list` path is already guarded: the **config-load orphan-probe guard** at
   `tests/playwright.config.ts:33-47` evaluates at config load and therefore *does* fire on `--list`.
   The two guards are complementary — config-load covers listing, `globalSetup` covers execution.

INTEG-05 is about **runs**, not listings. The 142/93 count also matches the wave-1 baseline exactly,
confirming the preflight added no specs and dropped none.

---

## 7. The FOUND adversary (not staged) — the sibling checkout on :5173

D-11 chose the staged project for reproducibility, accepting a weaker adversary as the trade. The
**found** adversary is the realism half, and it is strictly harder: the *same application*, a
different checkout, a different module root, in Docker, on the port the suite defaults to. It costs
nothing to record and was never touched — only probed read-only over HTTP.

```
--- lsof -nP -iTCP:5173 -sTCP:LISTEN ---
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 62915 kallejarvenpaa  219u  IPv6 0x1b5ed85d77da8c4f      0t0  TCP *:5173 (LISTEN)

--- docker ps row ---
voting-advice-application-frontend-1	voting-advice-application-frontend	0.0.0.0:5173->5173/tcp, [::]:5173->5173/tcp

--- curl -sL http://localhost:5173/ ---
STATUS=200 FINAL=http://localhost:5173/sv
<title>Valkompass</title>
--- its served module root ---
/@fs/opt/frontend/.svelte-kit
```

### The committed preflight against it → exit 1 in 2 s

```
$ FRONTEND_PORT=5173 npx playwright test -c ./tests/playwright.config.ts --grep "@__preflight_probe_no_match__" --pass-with-no-tests
Error: E2E PREFLIGHT FAILED — the server on port 5173 is not this checkout's dev server.
  reason:            the listener is not this checkout's Vite dev server (GET http://localhost:5173/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte returned 404, expected 200)
  expected port:     5173 (http://localhost:5173)
  expected checkout: /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
  observed:          HTTP 200 -> http://localhost:5173/sv; <title>Valkompass</title>; served module root: /opt/frontend
  listening process:
    COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
    com.docke 62915 kallejarvenpaa  219u  IPv6 0x1b5ed85d77da8c4f      0t0  TCP *:5173 (LISTEN)
  remedies:
    - stop the other server occupying port 5173, then start this repo's `yarn dev`; or
    - re-run with FRONTEND_PORT=<port your server is actually on>
>>> exit=1  (elapsed 2s)
```

`served module root: /opt/frontend` is the diagnostic line an operator actually needs: it names the
foreign checkout's own root, so the failure is self-explanatory without further investigation. Note
also that this adversary returned **404** where the staged one returned **403** — two different
non-200 statuses from two different foreign servers, which is precisely why `preflight.ts` compares
`=== 200` rather than `!== 404`.

### Honest limits of the found adversary

**7a. The retired check DOES catch this one — but for the wrong reason, and only by luck.**

```
$ bash retired-check.sh 5173
  [retired] lsof -nP -iTCP:5173 -sTCP:LISTEN
  [retired] listener COMMAND = 'com.docke' (pid 62915)
  [retired] RESULT: FAIL (listener is not a node process)
  >>> exit=1
```

It fails on **process type**, because this particular sibling happens to be containerised, so `lsof`
reports Docker's proxy rather than `node`. Change nothing about the threat and run the sibling's dev
server on the host instead of in a container, and the check goes silent. This is exactly why the
staged adversary is the load-bearing half of the control: it is a `node` process, and the retired
check passes it (§4.3). **The found adversary demonstrates realism; the staged adversary demonstrates
blindness. Neither substitutes for the other.**

(Incidentally the title grep would also have caught it — `Valkompass` is not this checkout's `sv` app
name, which is `Valkompassen`. That near-miss is a coincidence of the sibling's branch, not a
property of the check.)

**7b. The shadow-bind pair was NOT reproducible this session.** RESEARCH QUAL-1 measured a state
where `lsof :5173` shows **two** LISTEN rows and `localhost:5173` and `127.0.0.1:5173` reach
*different* servers. This session `:5173` had a **single** LISTEN row (the Docker wildcard), and both
host spellings returned the identical `Valkompass` — the same server:

```
--- curl -sL http://localhost:5173/ ---   STATUS=200  <title>Valkompass</title>
--- curl -sL http://127.0.0.1:5173/ ---   STATUS=200  <title>Valkompass</title>
```

Reproducing the two-row state requires binding **this checkout's** dev server to 5173 alongside the
Docker wildcard, which D-11 and the plan explicitly forbid staging. It is **not recorded here as a
measurement of this session** — see `137-RESEARCH.md` QUAL-1 for the original capture.

Two things must be said honestly about that phenomenon regardless:

- **`strictPort` does not catch it.** The second bind *succeeds* (a specific-address bind coexists
  with a wildcard bind), so there is no port-in-use error to fail on. That hole is covered only by
  this preflight, which is why `preflight.ts` passes the host string through **verbatim** and never
  normalises `localhost` to `127.0.0.1`: under a shadow-bind those two names reach different servers,
  and normalising would validate a server the specs never touch.
- **It was observed on macOS with Docker Desktop only.** Linux socket semantics for wildcard vs.
  specific-address binds differ and were not measured. **No claim is made that this generalises.**

---

## 8. Verdict — evidence mapped to ROADMAP criteria

| ROADMAP criterion | Discharged by | Status |
|---|---|---|
| **1** — retired check PASSES against a foreign server; new preflight FAILS against the same scenario | §4.3 (run 1a exit 0, run 1b exit 0, indistinguishable) **and** §5.1 (run 2a exit 1, clause (b) named) | **DISCHARGED** |
| **2** — with this repo's own dev server on the same port, the preflight passes **and the suite proceeds** | §5.2 (exit 0, no failure block) **and** §5.3 (4 passed, two real spec bodies) | **DISCHARGED** |
| **3** — enforced by the harness, not remembered by the operator; aborts before the first spec executes | §6 (four invocation shapes, all exit 1, zero spec output) — enforcement point is `globalSetup` at `tests/playwright.config.ts:99` | **DISCHARGED locally** |
| **4** — live docs state the response-content assertion; retired wording greps empty | Not this plan. Plan 137-04. | **out of scope here** |

### What is explicitly NOT discharged by this document

- **CI behaviour.** Nothing here was observed in CI. The CI failure modes (a differently-rooted
  checkout path, the 120 s deadline, the removed blind wait loops) cannot be reproduced locally by
  construction. That evidence is **plan 137-05's observed CI run on both jobs**, and until it exists,
  criterion 3 is discharged *locally* only.
- **The full-suite cardinal-rule gate.** Run 2b(ii) ran one project (4 tests). The full-suite green
  is plan 137-05.
- **Non-macOS platforms.** Every measurement here is macOS 26.5.1 / arm64. The `lsof` decoration is
  already best-effort in code (it degrades to omitting one section), but the shadow-bind observation
  in §7b in particular must not be read as cross-platform.
- **The `--list` path's own guard.** Asserted from source (`tests/playwright.config.ts:33-47`) and
  from `--list` completing cleanly, not by driving the orphan-probe guard to a failure.

### Reproducibility and non-contamination

- **Nothing from this control was committed to the test harness.** `git status --porcelain` showed no
  new or modified file under `tests/` or `apps/` at every task boundary. The adversary project and
  the retired-check script existed only in the scratch directory and are gone.
- **Their complete source is embedded above** (§3 and §4.2) — that is the reproducibility mechanism
  D-11 option B was chosen for, and it is a deliverable of this document rather than a courtesy.
- **Both staged servers were torn down.** `lsof -nP -iTCP:5273 -sTCP:LISTEN` and `-iTCP:5373` both
  returned empty afterwards; the `--list` check in §6 was run in that state and is the evidence.
- **The Docker container on 5173/54321 was never stopped, restarted or reconfigured** — only probed
  read-only over HTTP.

> **Scope note on quoting the retired wording.** This document is in the phase directory, which D-14
> places **outside** the INTEG-06 live-doc grep scope (`CLAUDE.md`, `tests/README.md`,
> `tests/IDURA-TEST-RUNBOOK.md`). Quoting the retired check's original wording here is therefore
> correct and required — it is the historical record. The live docs edited by plan 137-04 must **not**
> carry that wording, or criterion 4's grep would return a hit on the very sentence describing its
> removal. That separation is deliberate.

---

*Phase: 137-e2e-preflight-integrity-assert-the-served-application · Plan 03 · Recorded 2026-08-13*
