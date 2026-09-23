# Phase 147 — Negative-Control Register: the candidate-surface blindness measured before it is closed

**Thirteen rows, three instruments, one helper-owned dev server — and not one borrowed observation.**

`147-SCOUT-INVENTORY.md` measured the candidate `(protected)` surfaces at **0 axe violations across 42
scans**. That zero is this phase's foundation and it is also its trap: **a gate wired onto an
already-clean surface turns green whether or not it is looking at anything.** The only thing that can
tell those two states apart is a defect the OLD tree provably misses and the NEW tree provably catches.
This register is where both halves of every such pair are recorded, and the OLD halves can only be taken
**now** — on the tree that still carries the old configuration, before a single product byte moves.

**The placeholder in this register is the literal string `TBD-147`.** It is the only legal value for a
measurement cell whose run has not happened yet. Filling a cell means replacing that string with an
observation **this phase** made, together with the run directory and the HEAD it was taken at. A row that
is never filled is therefore visible as an **absence** rather than as a row nobody thought to write.

**Under `CLAUDE.md` § E2E Hard Rule a measurement that did not run counts as a FAILURE, not a pass.** A
"did not run" test is counted separately from a skip in every row here, and is never folded into a green.

- **Phase:** 147 (candidate-app-scan-reach-authenticated-fixture-raw-key-gate)
- **Requirements:** **CSCAN-01 … CSCAN-04**
- **Opened by:** `147-01-PLAN.md` (wave 1, Task 1). **Every row is created here, before this phase's
  first measurement and before its first product byte.** `147-01` writes **zero** surviving bytes into
  `apps/`, `packages/` or `tests/`; the first surviving product byte lands in `147-03`.
- **Corpus:** exactly **13 rows**, asserted in this file's own § Completeness.
- **Protocol source:** `.planning/REQUIREMENTS.md:7-13` — the milestone's standing acceptance rule
  (*prove the guard fails before claiming it guards*). The HYGIENE-LOOP lineage runs `139-VERDICTS.md`
  § 3.1 → `143-01` → `144-01` → `145-01` → `146-01`, and this register reuses `146-NEGATIVE-CONTROL.md`'s
  shape directly.
- **Foundation, cited for sizing only:** `147-SCOUT-INVENTORY.md`. **No cell in this register may be
  filled from that document**, from a prior session, or from any other document. Every row carries its
  own run directory and its own HEAD. In particular `BASE-GREEN` **re-derives** the suite total from its
  own run rather than carrying the scout's 135 forward.

## Environment

| | |
|---|---|
| Host | macOS (darwin 25.5.0), local Chromium via Playwright |
| Node | v24.14.1 |
| Yarn | 4.13.0 |
| Playwright | 1.58.2 (`@playwright/test` 1.58.2) |
| axe | `@axe-core/playwright` 4.11.3, `axe-core` 4.11.4 |
| Branch | `feat-gsd-roadmap` |
| **HEAD at register creation** | **`d7d3303be`** — `docs(147): create the phase plan — 5 serial plans, controls first` |
| Frontend port | `5173` — no `FRONTEND_PORT` override in play; `apps/frontend/vite.config.ts:37-43` sets `strictPort: true`, so the server is on this port or it fails |
| Playwright `baseURL` | `http://localhost:5173` (`tests/playwright.config.ts:354`) |
| Dataset | `e2e/base`, seeded by the suite's own `tests/tests/setup/shared/base.setup.ts` |
| Identity | `CA-AA-1` (`test-e2e-base-ca-aa-1`), force-registered and UI-logged-in by `tests/tests/setup/shared/auth.setup.ts` |

### Database state

**`yarn db:reset` was performed in this session, by the orchestrator, before any row below was
measured** — deliberately, even though the database already measured clean, so that this register records
it as a fact performed in-session rather than as an inference from a table read. Migrations applied
through `00003_authenticated_insert_feedback.sql`, `seed.sql` executed, containers restarted, both
storage buckets recreated.

The pre-reset state was measured read-only and is recorded because it is the state the scout's
*Environment finding* warns about:

| probe | observed before the in-session reset |
|---|---|
| `seed_`-prefixed candidates | **0** |
| `test-e2e-`-prefixed candidates | **0** |
| total candidates / elections / questions | 1 / 0 / 0 |
| `auth.users` | 2 |

That is the post-`db:reset` shape (only `seed.sql`'s baseline rows) — **not** the dev-seed `default`
template that `147-SCOUT-INVENTORY.md` measured producing 7 failed / 79 did-not-run on an unchanged tree.

**Every suite run in this phase is taken against a `db:reset` database.** A run taken against the
`default` template would be measuring the dataset, not the gate.

### Dev server — one owner, and every start is recorded

**From `147-01` onward the frontend dev server's lifecycle is owned by
`tests/e2e-runs/147/devserver.sh`** (gitignored). This is not bookkeeping: **Paraglide compiles the
message catalogue at dev-server START**, so a verdict read after a catalogue injection but without a
restart is a verdict read against the PRE-injection catalogue — a silently vacuous measurement. Every
injection and every revert in this phase is therefore followed by a restart, and **every start appends a
line here**.

The helper does not merely wait for something to answer on the port. Its `start` and `restart` block
until the served application proves it came from **this** working tree, and the assertion is **not
reimplemented**: `tests/e2e-runs/147/identity-probe.mts` calls the suite's own `assertServedApp`
(`tests/tests/support/preflight.ts`), so the helper and the E2E preflight gate cannot drift apart. On
success it prints the suite's own `E2E PREFLIGHT OK` line. A server that comes up but fails identity is
**killed** rather than left holding the port.

| # | event | PID | wrapper | port | HEAD | timestamp | plan | why |
|---|---|---|---|---|---|---|---|---|
| 1 | start | `77160` | `77134` | 5173 | `d7d3303be` | 2026-08-27 09:13:15 EEST | `147-01` T1 | claim the port; `BASE-GREEN` ran against this server |
| 2 | stop | `77160` | — | 5173 | `4a8cd6c1e` | 2026-08-27 09:32:05 EEST | `147-01` T2 | RK1 injection applied — the catalogue must recompile |
| 3 | start | `7004` | `6979` | 5173 | `4a8cd6c1e` | 2026-08-27 09:32:11 EEST | `147-01` T2 | serves the RK1-injected catalogue (`en.js` 597) |
| 4 | restart | `26125` | `26114` | 5173 | `4a8cd6c1e` | 2026-08-27 09:41:23 EEST | `147-01` T2 | RK1 reverted — back to `en.js` 598 |
| 5 | restart | `26792` | `26773` | 5173 | `4a8cd6c1e` | 2026-08-27 09:41:54 EEST | `147-01` T2 | serves the RK2-injected catalogue (`en.js` 597) |
| 6 | restart | `28933` | `28922` | 5173 | `4a8cd6c1e` | 2026-08-27 09:43:51 EEST | `147-01` T2 | RK2 reverted — back to `en.js` 598 |
| 7 | restart | `34355` | `34330` | 5173 | `07bb87587` | 2026-08-27 09:47:59 EEST | `147-01` T3 | serves the AX1-injected layout (`image-alt` violation live) |
| 8 | restart | `54261` | `54249` | 5173 | `07bb87587` | 2026-08-27 10:00:38 EEST | `147-01` T3 | AX1 reverted — clean tree for the confirmation run |
| 9 | stop | `54261` | — | 5173 | `07bb87587` | 2026-08-27 10:32:04 EEST | `147-03` | *(transcribed by `147-04`; see the note below)* server released before the `147-03` build |
| 10 | start | `4746` | `4735` | 5173 | `cad7ad1ea` | 2026-08-27 10:32:45 EEST | `147-03` | *(transcribed by `147-04`)* the server every `147-03` run was taken against, including `REACH-14` |
| 11 | restart | `16063` | `16052` | 5173 | `9d3193dd5` | 2026-08-27 15:39:57 EEST | `147-04` T1 | serves the AX1-injected layout (`image-alt` violation live, `191:2`) |
| 12 | restart | `18169` | `18158` | 5173 | `9d3193dd5` | 2026-08-27 15:42:51 EEST | `147-04` T1 | AX1 reverted — clean tree for the confirmation run |
| 13 | restart | `23580` | `23569` | 5173 | `a619a1c2c` | 2026-08-27 15:47:42 EEST | `147-04` T2 | serves the RK1-injected catalogue (`en.js` 597) |
| 14 | restart | `26506` | `26495` | 5173 | `a619a1c2c` | 2026-08-27 15:50:34 EEST | `147-04` T2 | RK1 reverted — back to `en.js` 598 |
| 15 | restart | `26791` | `26766` | 5173 | `a619a1c2c` | 2026-08-27 15:50:53 EEST | `147-04` T2 | serves the RK2-injected catalogue (`en.js` 597) |
| 16 | restart | `28464` | `28453` | 5173 | `a619a1c2c` | 2026-08-27 15:52:45 EEST | `147-04` T2 | RK2 reverted — back to `en.js` 598 |
| 17 | **stop** | `28464` | — | 5173 | `fce234ac3` | 2026-08-27 16:59:37 EEST | `147-05` T2 | **the hand-back.** The phase's last measurement was taken at row 16's server; nothing after it needs one. Port confirmed free by `devserver.sh status` (verdict `NOT RUNNING`, exit 2) **and** independently by `lsof -nP -iTCP:5173 -sTCP:LISTEN` (no listener) |

**Row 17 closes the lifecycle this table exists to record.** From `147-01` to here the frontend dev
server was helper-owned without a gap; it is now stopped and the port is released. Anyone picking the
tree up starts their own.

**⚠ Rows 9–10 are a transcription `147-03` owed this table and did not make.** They are recovered from
`devserver-history.log`, the helper's own append-only record, and are added here by `147-04` so the table
remains a faithful transcription of that log rather than a partial one. No `147-02` start appears between
rows 8 and 9 because `147-02` injected only into `playwright.config.ts` — a file Vite does not serve — and
so ran against the server row 8 started. Rows 11 onward are `147-04`'s own, each transcribed after the
restart it records had happened.

The machine-readable original of this table is `tests/e2e-runs/147/devserver-history.log`, appended to by
the helper itself on every start and stop — so the table above is a transcription of a log the helper
wrote, not a narrative reconstructed afterwards.

**Predecessor, recorded because the port changed hands:** PID `31124` (`vite dev --host 0.0.0.0`, started
2026-08-26 21:08:32) held port 5173 on arrival. It was **not** a foreign server — the probe verified it
as this checkout's — but it was the server `146-08` Task 1 stood up, it predated this phase's HEAD by
~12 h, and it was hand-started rather than helper-owned. It was stopped by the orchestrator before
`yarn build`, and the helper claimed the port afterwards.

## Harness — the three gitignored scripts this phase runs everything through

All three live under the wholesale-gitignored `tests/e2e-runs/147/`, which is outside the suite's
`testDir` (`tests/tests`) and so is collected by nothing.

| script | what it does | why it is not an existing script |
|---|---|---|
| `devserver.sh` | `start` / `stop` / `restart` / `status` for the frontend workspace's **own** dev script | the root `yarn dev` would also restart Supabase and the package watcher, resetting the database a run is being taken against |
| `run-suite.sh` | one evidence-producing Playwright run against the **helper-owned** server | `tests/scripts/e2e-run.sh` SPAWNS AND OWNS its own dev server and refuses to adopt a foreign listener (its exit 5). Two competing owners of port 5173 would make this header's audit trail meaningless. `run-suite.sh` reuses that wrapper's **proven Playwright invocation verbatim** (`e2e-run.sh:386-405` — `--reporter=html,json`, `PLAYWRIGHT_JSON_OUTPUT_FILE`, stdout via `tee`, preflight verdict counted from captured stdout) and drops only the server-owning parts |
| `summarize.mjs` | mines a run's `results.json` into counts **and a per-test duration table** | the repo's configured reporter is HTML-only (`playwright.config.ts:312`); an HTML report is not machine-mineable, and `147-02` must mine per-test durations to cost criterion 5's reporting split |

**Both wrappers fail CLOSED.** `run-suite.sh` refuses to run unless `devserver.sh status` exits 0 (a
verified, helper-owned server), and it requires a **positive** `E2E PREFLIGHT OK` line — never merely the
absence of a failure, since an absence is also what a run that never reached the preflight produces. It
reads both preflight literals **out of `preflight.ts` itself** rather than copying them, which is the
drift hole `e2e-run.sh`'s exit 7 exists to close.

---

## The corpus — 13 rows, declared before any is filled

| # | Row ID | Owner | Purpose — one line |
|---|---|---|---|
| 1 | `BASE-GREEN` | `147-01` | the full default suite at this phase's HEAD, un-injected, on a `db:reset` DB — the only row where green means green |
| 2 | `RK1-OLD` | `147-01` | raw-key BLIND half at `candidate-journey.spec.ts:924`: the matcher PASSES while `candidateApp.questions.editAnswer` renders raw |
| 3 | `RK2-OLD` | `147-01` | raw-key BLIND half at `candidateProfilePage.fixture.ts:179`: the matcher PASSES while `common.required` renders raw |
| 4 | `AX1-OLD` | `147-01` | axe BLIND half: a real WCAG 2.1 AA violation live on all candidate `(protected)` surfaces, full suite still GREEN |
| 5 | `ORD-OBSERVED` | `147-02` | the observed Playwright phase/dependency order before `auth-setup` is ungated — the ordering risk the scout named as this phase's genuine risk |
| 6 | `ORD-PERTURB` | `147-02` | the same order re-observed under the perturbation the dependency change implies, so the risk is measured rather than reasoned about |
| 7 | `REACH-14` | `147-03` | the extension actually reaches 14 new authenticated surfaces (7 × 2 themes), each proven authenticated and in the theme claimed |
| 8 | `AX1-NEW` | `147-04` | axe CATCH half: the SAME injection as `AX1-OLD`, same instrument blob hash, now RED — the pairing that makes the green mean something |
| 9 | `RK1-NEW` | `147-04` | raw-key CATCH half at site 1: the same catalogue deletion as `RK1-OLD`, now caught by the raw-key gate |
| 10 | `RK2-NEW` | `147-04` | raw-key CATCH half at site 2: same, for `common.required` |
| 11 | `E2E1-SUITE` | `147-04` | the full default suite green again with every injection reverted and the new gate live — the cardinal-rule gate |
| 12 | `DET-RUNS` | `147-04` | repeat runs proving the new scans are deterministic, not a coin flip; no flaky exemption exists in this project |
| 13 | `REV1-CLEAN` | `147-04` | zero surviving injected bytes across the phase, proven by `git diff --exit-code` AND `git hash-object` equality |

**Pairings this corpus exists to support** — each OLD half is taken in `147-01`, each NEW half in
`147-04`, against the **same instrument**:

| pair | OLD (blind) | NEW (catch) | shared instrument |
|---|---|---|---|
| axe | `AX1-OLD` | `AX1-NEW` | the injected element in `apps/frontend/src/routes/candidate/(protected)/+layout.svelte`, matched by **injected-state blob hash** |
| raw key 1 | `RK1-OLD` | `RK1-NEW` | `candidateApp.questions.editAnswer` deleted from `apps/frontend/messages/**`, matched by injected-state blob hash |
| raw key 2 | `RK2-OLD` | `RK2-NEW` | `common.required` deleted from `apps/frontend/messages/**`, matched by injected-state blob hash |

**⚠ Every injecting row must record its instrument's `git hash-object` in BOTH states — clean AND
injected.** `147-04` compares its own injection against the **injected-state** hash to prove the two
halves share an instrument. A row that records only the clean hash cannot support its pairing, and the
omission is not discoverable until three plans later.

---

## Register

Nine columns, in this order:
`Row · Owner · Site / instrument · Blob hash clean → injected · Exact command · Run dir · HEAD · Observed verdict · Reading`.

**Ordering guarantee:** all thirteen rows below were written and committed **before this phase's first
measurement existed and before its first product byte existed**. That is a property of the **commit
graph** — this file's creating commit precedes every run in this phase and precedes `147-02` entirely —
not a claim made in prose about itself.

Every measurement cell reads `TBD-147` at creation: **13 rows × 6 unfilled cells = 78** occurrences. The
count is checked, not asserted:

```
grep -E '^\| `(BASE-GREEN|RK1-OLD|RK2-OLD|AX1-OLD|ORD-OBSERVED|ORD-PERTURB|REACH-14|AX1-NEW|RK1-NEW|RK2-NEW|E2E1-SUITE|DET-RUNS|REV1-CLEAN)` ' \
  .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-NEGATIVE-CONTROL.md \
  | grep -o 'TBD-147' | wc -l
```

→ **78** at creation, decremented plan by plan as a running assertion. **Each plan clears only its own
rows.** The same pattern with `grep -c` returns the row count, **13**.

**Non-injecting rows** (`BASE-GREEN`, `ORD-OBSERVED`, `ORD-PERTURB`, `REACH-14`, `E2E1-SUITE`,
`DET-RUNS`) have no instrument to hash. Their blob-hash cell is filled with `n/a — no injection` when the
row is filled. **That cell is never left blank**, so "no injection" and "nobody recorded it" stay
distinguishable.

| Row | Owner | Site / instrument | Blob hash clean → injected | Exact command | Run dir | HEAD | Observed verdict | Reading |
|---|---|---|---|---|---|---|---|---|
| `BASE-GREEN` | `147-01` | full default suite, un-injected | `n/a — no injection` | `run-suite.sh --run-dir tests/e2e-runs/147-base-green` (wraps `npx playwright test -c tests/playwright.config.ts tests --grep-invert @probe --reporter=html,json`) | `tests/e2e-runs/147-base-green/` | `4a8cd6c1e` | **135 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**; exit **0**; 10.8 min; preflight OK=1 FAILED=0 | GREEN, and here green means green. Total **re-derived from this run's own `results.json`** at **135** — matches the scout's 135. Per-test durations in `durations.csv`. |
| `RK1-OLD` | `147-01` | `tests/tests/specs/candidate/candidate-journey.spec.ts:924` — `toHaveText(/edit/i)`; key `candidateApp.questions.editAnswer` | en `898b4717…` → `3c0d1304…` (all 7 locales in § *Injected-state blob hashes*) | `run-suite.sh --run-dir tests/e2e-runs/147-rk1-old --project candidate-journey --db-reset` | `tests/e2e-runs/147-rk1-old/` | `4a8cd6c1e` | un-injected (from `BASE-GREEN`): **PASS**. injected: **PASS** 1/1, exit **0**, preflight OK=1 FAILED=0. Paraglide `en.js` **598 → 597**, `candidateapp_questions_editanswer` export gone | **BLIND.** The matcher passed while the card action rendered the literal `candidateApp.questions.editAnswer` — 15 occurrences in the run's own trace, `Edit Your Answer` 0. `/edit/i` matched the raw key. |
| `RK2-OLD` | `147-01` | `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:179` — `expect.soft(...).toContainText(/required/i)`; key `common.required` | en `2cb3a609…` → `99a108e0…` (all 7 locales in § *Injected-state blob hashes*) | `run-suite.sh --run-dir tests/e2e-runs/147-rk2-old --project candidate-journey --db-reset` | `tests/e2e-runs/147-rk2-old/` | `4a8cd6c1e` | un-injected (from `BASE-GREEN`): **PASS**. injected: **PASS** 1/1, exit **0**, preflight OK=1 FAILED=0. Paraglide `en.js` **598 → 597**, `common_required` export gone | **BLIND, and doubly weak.** The matcher passed while the `sr-only` marker rendered the literal `common.required` — 7 occurrences in the run's own trace, `Required` 0. Plus `expect.soft`: even a genuine miss would not fail fast. |
| `AX1-OLD` | `147-01` | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:184-191` — additive `<img>` with NO `alt`; axe rule **`image-alt`**, tag **`wcag2a`** (WCAG 2.1 AA superset the gate uses) | `18c71976…` → `ca43e76a…` | `run-suite.sh --run-dir tests/e2e-runs/147-ax1-old --db-reset` (FULL default suite, no `--project`) | `tests/e2e-runs/147-ax1-old/` | `07bb87587` | **135 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**; exit **0**; 10.5 min; preflight OK=1 FAILED=0. `a11y-smoke` itself **16/16 PASS**. Post-revert confirmation run: **5/5 pass**, exit 0 | **BLIND — and this green IS the defect.** A real WCAG 2.1 AA violation was live on every candidate `(protected)` surface and **nothing caught it**: not `a11y-smoke`, not `candidate-journey`, not any perm project. Identical count to `BASE-GREEN` (135/135). |
| `ORD-OBSERVED` | `147-02` | `tests/playwright.config.ts` — project dependency graph as it stands, read from the config MODULE by `tests/e2e-runs/147/config-projects.mts`; phase assignment derived by `tests/e2e-runs/147/phases.mjs` | `n/a — no injection` | `node tests/e2e-runs/147/phases.mjs --self-check` (predicted from the live config vs. observed from `147-base-green/results.json` per-test `startTime` + `duration`) | `tests/e2e-runs/147/` (instrument) mining `tests/e2e-runs/147-base-green/` (evidence — **no new suite run**) | `325db69cd` | **89 scheduled projects, 89 phase matches, 0 mismatches; 80 predicted phases vs 80 observed phases.** `_probes` declared but **not scheduled** (0 tests under the default suite's `--grep-invert @probe`) and recorded as such. Observed phase wall clocks: ph1 0.9 s, ph2 **64.3 s**, ph3 **27.3 s**, full-run span 643.4 s | **The derivation is validated, so predictions from it may be used.** The scan surface today (`a11y-smoke`) sits in **phase 2**, whose critical path is `voter-journey` (64.3 s) — `a11y-smoke` finishes at +40.7 s, so it carries **27.3 s of slack**. Phases 1–3 contain **no** `app_settings` REPLACE and **no** `test-` pre-clear: the perm family is anchored on the journey leaves and every one of its 25 setups lives in phase ≥ 4. The two named hazards are therefore **absent by construction** from every wiring that keeps the scan in phase 3. Full table and the six wirings scored against both hazard axes: `147-ORDERING.md`. |
| `ORD-PERTURB` | `147-02` | `tests/playwright.config.ts` — the same graph under the `auth-setup` ungating (gate expression `process.env.PLAYWRIGHT_VISUAL` → `true`, **1 insertion / 1 deletion**; **no dependency edge added**, so nothing consumes the project) | `fbbd85ae…` → `9004306d…` (reverted; see the two proofs below) | `run-suite.sh --run-dir tests/e2e-runs/147-ord-perturb --db-reset` (FULL default suite, no `--project`) | `tests/e2e-runs/147-ord-perturb/` | `6e65a5d2f` | **136 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**; exit **0**; 10.7 min; preflight OK=1 FAILED=0. `auth-setup` itself **1/1 PASS in 3.0 s**, landing in **phase 2 of 80** | **DOES NOT PERTURB.** Against `BASE-GREEN`: counts +1/+1 (the declared setup itself), failures 0 → 0, wall clock 10.8 → **10.7 min**, phase count 80 → **80**, and **0 projects moved phase**. Every candidate-side authenticated assertion held while `auth-setup` force-registered base CA-AA-1 concurrently. |
| `REACH-14` | `147-03` | the 14 new authenticated candidate scans (7 surfaces × 2 themes), under the committed W3 wiring in `tests/playwright.config.ts` | `n/a — no injection` | `run-suite.sh --run-dir tests/e2e-runs/147-reach14 --project candidate-a11y-scan --db-reset` **and** `run-suite.sh --run-dir tests/e2e-runs/147-reach14-suite --db-reset` (FULL default suite, no `--project`) | `tests/e2e-runs/147-reach14/` (project) + `tests/e2e-runs/147-reach14-suite/` (full suite) | `59dbb971a` + this task's working tree (each run's `provenance.txt` carries its own `git status --porcelain`) | project run **17 passed / 0 failed**, exit **0**, 15.1 s, preflight OK=1 FAILED=0 — the 14 scans plus `data-setup-base`, `auth-setup`, `data-teardown-base`. Full suite **150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**, exit **0**, **10.7 min**, preflight OK=1 FAILED=0. All **14/14 green, 0 axe violations and 0 raw-key findings on every one**, each carrying its own `reach-proof-*.json`. Observed phase of `candidate-a11y-scan`: **3 of 80**, co-scheduled with **`candidate-journey` and nothing else** | **REACHES, AND THE INSTRUMENT HELD.** The observed phase equals `147-ORDERING.md`'s W3 prediction exactly — phase 3 of 80, `auth-setup` phase 2, one co-scheduled project — at **0 mismatches over 91 scheduled projects**, so `147-02`'s instrument is confirmed a second time against a run it did not see. Against `BASE-GREEN`: +15 tests (14 scans + `auth-setup`), failures 0 → 0, wall clock 10.8 → **10.7 min**. Full per-surface reach/theme evidence and the wall-clock derivation below. |
| `AX1-NEW` | `147-04` | same instrument as `AX1-OLD`: `apps/frontend/src/routes/candidate/(protected)/+layout.svelte`, an additive `<img src="/favicon.png" width="24" height="24" data-testid="ax1-old-injection" />` with NO `alt`, first child of the `{:else}` branch, compiled at **191:2** — the same file, the same line and the same column `AX1-OLD` was compiled at; axe rule **`image-alt`**, tag **`wcag2a`** | clean `18c71976…` → injected `f8c08e07…`. The clean hash is **equal** to `AX1-OLD`'s clean hash, so both halves start from the same file. The **injected** hashes differ (`AX1-OLD`: `ca43e76a…`) because that hash covers a 6-line comment whose text is nowhere recorded — see § *`AX1-NEW` — the pairing, and where the blob hash could not carry it* | `run-suite.sh --run-dir tests/e2e-runs/147-ax1-new --project candidate-a11y-scan --db-reset`; post-revert: same with `--run-dir tests/e2e-runs/147-ax1-new-postrevert` | `tests/e2e-runs/147-ax1-new/` + `tests/e2e-runs/147-ax1-new-postrevert/` | `9d3193dd5` (working tree carrying the injection; `provenance.txt` records ` M …(protected)/+layout.svelte` as the only tracked modification) | **14 failed / 3 passed / 0 skipped / 0 flaky / 0 did-not-run**; exit **1**; 17.9 s; preflight OK=1 FAILED=0. **All 14** candidate scans failed — 7 surfaces × 2 themes, light and dark alike — each with exactly **one** violation, `"id": "image-alt"`, `"impact": "critical"`, `"tags": [… "wcag2a" …]`, `"html": "<img src=\"/favicon.png\" width=\"24\" height=\"24\" data-testid=\"ax1-old-injection\">"`, and an offending selector in `"target"`: `["img"]` on ten scans, `["img[src$=\"favicon.png\"]"]` on the four `cand-profile` / `cand-preview` scans, which carry a second real `<img>`. Raw-key findings **0/14** in the same run. Post-revert: **17/17 passed**, exit **0**, preflight OK=1 FAILED=0 | **CATCHES, AND THE PAIR FLIPS.** Its blind half `AX1-OLD` is the same defect, in the same file at the same line, with the FULL suite reporting **135 passed / 0 failed**. Here the gate names it by rule and by selector on every candidate surface. Between the two observations the product is identical and the instrument is identical — **the only thing that changed is the gate** — so criterion 2's evidence is the flip, not the green. The 42-scan zero the scout measured is now a zero taken by something that provably fails when there is something to find. |
| `RK1-NEW` | `147-04` | same instrument as `RK1-OLD`: `candidateApp.questions.editAnswer` deleted from `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/candidateApp.questions.json`, runtime catalogue only. Observed against `candidate-a11y-scan` (the new gate) **and** `candidate-journey`, which carries the blind matcher at `candidate-journey.spec.ts:924`, in ONE invocation | clean en `898b4717…` → injected en `3c0d1304…`. **All 7 injected-state hashes are byte-identical to `RK1-OLD`'s**, compared BEFORE the run — `5de85899…`/`3c0d1304…`/`3cc4df1d…`/`da407009…`/`b155c15e…`/`1d3355e3…`/`e8cdd690…` for da/en/et/fi/fr/lb/sv. Compiled catalogue: `en.js` **598 → 597**, `candidateapp_questions_editanswer` export gone | `run-suite.sh --run-dir tests/e2e-runs/147-rk1-new --project candidate-a11y-scan --project candidate-journey --db-reset` → `npx playwright test -c tests/playwright.config.ts --project=candidate-a11y-scan --project=candidate-journey --reporter=html,json` | `tests/e2e-runs/147-rk1-new/` | `a619a1c2c` (working tree carrying the injection) | **2 failed / 18 passed / 0 skipped / 0 flaky / 0 did-not-run**; exit **1**; 37.1 s; preflight OK=1 FAILED=0. **The scan FAILS naming the key** on `cand-questions` and `cand-questions (dark)` — 11 sightings each, message: `Untranslated i18n key(s) rendered on "cand-questions" … 598 catalog keys were checked.` then `- "candidateApp.questions.editAnswer" (as text) in div[data-testid="candidate-questions-card"] > a[data-testid="candidate-questions-card-action"] > div > span`. **In the SAME run `candidate-journey` PASSED** (1/1, 22.8 s — its `18.6` step, which contains `:924`, completed with no error). axe verdict on both failing scans: **0 violations**, reported alongside | **CATCHES BY NAME WHILE THE MATCHER STILL PASSES — and that simultaneity is the finding.** One broken catalogue, one run, two opposite verdicts: the new scan names `candidateApp.questions.editAnswer` on the very node `:924` asserts against (`a[data-testid="candidate-questions-card-action"]`), and `:924`'s `toHaveText(/edit/i)` passes on that same node because the key CONTAINS `edit`. Patching the matcher was therefore never the fix, and this is the measurement that says so rather than the argument. Paired against `RK1-OLD`, where the same seven blobs produced a passing journey and no scan at all. |
| `RK2-NEW` | `147-04` | same instrument as `RK2-OLD`: `common.required` deleted from `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/common.json`, runtime catalogue only. Observed against `candidate-a11y-scan` **and** `candidate-journey`, which carries the blind **soft** matcher at `candidateProfilePage.fixture.ts:179`, in ONE invocation | clean en `2cb3a609…` → injected en `99a108e0…`. **All 7 injected-state hashes are byte-identical to `RK2-OLD`'s**, compared BEFORE the run — `672a4a47…`/`99a108e0…`/`cb2eb998…`/`661692fe…`/`4edb244f…`/`71e7bfe3…`/`17b7abca…` for da/en/et/fi/fr/lb/sv. Compiled catalogue: `en.js` **598 → 597**, `common_required` export gone | `run-suite.sh --run-dir tests/e2e-runs/147-rk2-new --project candidate-a11y-scan --project candidate-journey --db-reset` → the same two-project invocation | `tests/e2e-runs/147-rk2-new/` | `a619a1c2c` (working tree carrying the injection) | **2 failed / 18 passed / 0 skipped / 0 flaky / 0 did-not-run**; exit **1**; 38.5 s; preflight OK=1 FAILED=0. **The scan FAILS naming the key** on `cand-profile` and `cand-profile (dark)` — 1 sighting each, message: `Untranslated i18n key(s) rendered on "cand-profile" … 598 catalog keys were checked.` then `- "common.required" (as text) in div > section > div > span`, the `sr-only` marker. **In the SAME run `candidate-journey` PASSED** (1/1, 24.3 s — its `12` step, which calls `expectRequiredBadge` at `:594` and so reaches `:179`, completed with no error). axe verdict on both failing scans: **0 violations** | **CATCHES BY NAME WHILE A *SOFT* MATCHER STILL PASSES — doubly weak, and it passed anyway.** `:179` is `expect.soft(...).toContainText(/required/i)`, so even a genuine miss there would not fail fast; it did not have to fall back on that weakness, because `/required/i` matches the raw key `common.required` outright. The roadmap names this site blind; this run re-confirms it on the POST-extension tree rather than carrying `RK2-OLD`'s reading forward. Paired against `RK2-OLD`: same seven blobs, same passing soft matcher, and now a scan that names the key. |
| `E2E1-SUITE` | `147-04` | full default suite, every injection of this phase reverted, the 14 candidate scans live and BLOCKING | `n/a — no injection` | `run-suite.sh --run-dir tests/e2e-runs/147-e2e1-suite --db-reset` (FULL default suite, no `--project`) | `tests/e2e-runs/147-e2e1-suite/` | `ff37a87fc` (clean tree; `git status --porcelain` carries only the untracked `.planning/milestone.lock`) | **150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**; exit **0**; 621174 ms = **10.4 min**; preflight OK=1 FAILED=0. Total **re-derived** from this run's own `results.json` by `summarize.mjs` at **150**, and Playwright's own `stats` block agrees (`expected: 150, unexpected: 0`) | **GREEN, and here green means green.** Delta against `BASE-GREEN`: **135 → 150 = +15**, reconciled exactly — 14 candidate scans + the `auth-setup` project the wiring declares to back them, with **no residue**. Wall clock 10.8 → 10.4 min, i.e. the phase added 15 tests and the suite got no slower. Under the E2E Hard Rule this is the cardinal gate, and it is met with the new scans blocking rather than opt-in. |
| `DET-RUNS` | `147-04` | the same full default suite, three consecutive times on one unchanged HEAD — the added scans meeting real suite contention for the first time | `n/a — no injection` | `run-suite.sh --run-dir tests/e2e-runs/147-e2e-det0{1,2,3} --db-reset`, run back-to-back with no tree change between them | `tests/e2e-runs/147-e2e-det01/`, `-det02/`, `-det03/` | `ff37a87fc` — **the same HEAD for all three, and the same HEAD as `E2E1-SUITE`** | run 1 **150/0/0/0/0**, exit **0**, 625595 ms = 10.4 min, preflight OK=1 FAILED=0, `db:reset` ok 13:08:58Z. run 2 **150/0/0/0/0**, exit **0**, 624062 ms = 10.4 min, preflight OK=1 FAILED=0, `db:reset` ok 13:19:57Z. run 3 **150/0/0/0/0**, exit **0**, 626196 ms = 10.4 min, preflight OK=1 FAILED=0, `db:reset` ok 13:30:53Z. **No run was retried, replaced or abandoned.** The 14 candidate scans summed **33.4 / 32.6 / 32.1 s**; the widest single-scan spread was 0.7 s (`cand-questions (dark)`, 1.23×) and the widest ratio 1.36× on a 1.1 s scan | **DETERMINISTIC AT THIS FREQUENCY — which is a bound, not an absence.** Four consecutive full-suite runs (this row's three plus `E2E1-SUITE`) at 150/0 on one HEAD, each from a reset database and each preflight-confirmed, meets the Phase-136 gate's own standard. It matters because `147-SCOUT-INVENTORY.md` § 9 records its zero as taken at a **single worker with nothing else running**, and `axeScan.ts`'s own docblock records that scan-timing pressure previously produced phantom `color-contrast` failures on the voter side; these are the first candidate-scan observations under real contention. **Three green runs evidence a low failure frequency; they do not prove absence.** |
| `REV1-CLEAN` | `147-04` | every path this phase injected into, plus the served-application preflight, the global setup, the manifest and the lockfile — over the phase's full commit range `4adf451ed..ff37a87fc` | clean-state equality asserted for all **15** injected paths at three points at once: the range base, HEAD, and the working tree (see § below for the per-class table) | `git diff --exit-code 4adf451ed..HEAD -- <paths>` **and** `git rev-parse <ref>:<path>` / `git hash-object <path>` for the same paths; `git diff --name-only 4adf451ed..HEAD -- apps packages tests .github package.json yarn.lock` | *(no suite run — this row is a structural assertion over the commit graph)* | `ff37a87fc`; range base `4adf451ed` (the `146-09` close, the last commit before Phase 147's first) | **15/15 injected paths: range diff exit 0 AND blob-hash equality — 0 differing.** `tests/tests/support/preflight.ts` and `tests/global-setup.ts`: range diff exit **0**, hashes `389197f038e3…` and `1c4a29d3326a…` identical at base, HEAD and worktree. `package.json` / `yarn.lock`: range diff exit **0**, hashes `30a9c3774e2b…` / `b75c364ca876…` identical at all three. The **whole** phase changed exactly **7** tracked files, every one under `tests/` — **nothing under `apps/` or `packages/` at all**. Both frozen matcher files still at `cacf8810…` and `d79db2b7…` | **ZERO SURVIVING INJECTED BYTES, AND NO GREEN WAS BOUGHT BY WEAKENING THE GATE.** Six injections across the phase (three in `147-01`, three here), six reverts, each proven twice. The served-application preflight is byte-identical across the entire phase, so no run in this register was confirmed by a gate this phase had relaxed — the structural proof `146-08`'s `PF1-UNTOUCHED` took, applied to a phase whose main risk is a differently-ordered run. No dependency was added, so T-147-SC needed no legitimacy checkpoint. |

### `BASE-GREEN` — the total was re-derived, not carried

`147-SCOUT-INVENTORY.md` records a 135/0 run. **That number was not carried into this row.** The count
here comes from this run's own `results.json`, parsed by `tests/e2e-runs/147/summarize.mjs`, which
derives every class independently and reports Playwright's own `stats` block **alongside** its
derivation rather than instead of it:

| source | total | passed | failed | flaky | skipped | did-not-run |
|---|---|---|---|---|---|---|
| derived from `results.json` by `summarize.mjs` | 135 | 135 | 0 | 0 | 0 | 0 |
| Playwright's own `stats` block | — | 135 (`expected`) | 0 | 0 | 0 | — |
| `147-SCOUT-INVENTORY.md` (**not** a source — comparison only) | 135 | 135 | 0 | 0 | 0 | 0 |

The two live sources agree, and the re-derived total **coincides** with the scout's 135. Wall clock
645064 ms = **10.8 min**, started `2026-08-27T06:19:31Z`.

**"did not run" is counted separately from "skipped" and is never folded into a pass**, per
`CLAUDE.md` § E2E Hard Rule. `summarize.mjs` classifies a test whose `results` array is EMPTY — the
dependency-cascade shape — as `did-not-run`, not as a skip.

**⚠ HEAD drift, disclosed:** this row's HEAD is `4a8cd6c1e`, not the `d7d3303be` recorded at register
creation. `4a8cd6c1e` is this plan's Task 1 commit. `git diff --name-only d7d3303be 4a8cd6c1e` returns
**exactly one path**, `147-NEGATIVE-CONTROL.md` — a `.planning/` document. **No product or suite byte
differs between the two**, so the run is against the same tree the phase was sized on.

#### Per-test durations — mineable, and where they live

`147-02` needs these to cost criterion 5's reporting split. Two artefacts carry them:

- `tests/e2e-runs/147-base-green/results.json` — Playwright's own JSON report, one `duration` per test
  result. This is the primary source.
- `tests/e2e-runs/147-base-green/durations.csv` — the same data flattened to
  `project,file,line,status,attempts,duration_ms,title`, sorted longest-first, written by
  `summarize.mjs`.

The repo's configured reporter is **HTML-only** (`tests/playwright.config.ts:312`), which is not
machine-mineable; `run-suite.sh` adds `--reporter=html,json` with a per-run
`PLAYWRIGHT_JSON_OUTPUT_FILE`. Reporters are passive observers — this changes what is RECORDED, never
what is EXECUTED.

The 16 `a11y-smoke` entries (14 axe scans + 2 `navigation-a11y` tests), which are the closest existing
analogue to the split being costed, totalled **130.2 s**:

| entry | ms | entry | ms |
|---|---|---|---|
| results | 17051 | questions | 3545 |
| results-filter-drawer | 16421 | questions (dark) | 3483 |
| voter-detail-drawer | 16328 | elections-selector | 2835 |
| results-filter-drawer (dark) | 16008 | constituencies-selector-located | 2408 |
| voter-detail-drawer (dark) | 15939 | elections-selector (dark) | 2233 |
| results (dark) | 15591 | constituencies-selector-located (dark) | 1800 |
| navigation-a11y — focus lands on heading | 10222 | home | 1187 |
| navigation-a11y — route announcer | 4006 | home (dark) | 1183 |

`candidate-journey` is **one** test (`:367`, `full candidate journey end-to-end`), 27252 ms.

### `RK1-OLD` / `RK2-OLD` — why these are TWO-RUN controls, and what the second run added

A single green run would only have proved the site exists. Each row therefore pairs an **un-injected**
verdict with an **injected** one for the *same* assertion:

| | `RK1-OLD` (`:924`) | `RK2-OLD` (`:179`) |
|---|---|---|
| un-injected verdict | **PASS** (from `BASE-GREEN`) | **PASS** (from `BASE-GREEN`) |
| injected verdict | **PASS** | **PASS** |
| Paraglide `en.js` exports before → after | 598 → **597** | 598 → **597** |
| mangled export removed | `candidateapp_questions_editanswer` | `common_required` |
| rendered text the assertion matched | `candidateApp.questions.editAnswer` | `common.required` |
| raw-key occurrences in the run's own trace | **15** | **7** |
| working-string occurrences in the same trace | **0** (`Edit Your Answer`) | **0** (`Required`) |

**A structural fact that makes the pairing tight:** both named assertions live inside the SAME single
test — `candidate-journey.spec.ts:367`, the project's only test (`:924` directly, `:179` via
`expectRequiredBadge`, called once at `:594`). So "the un-injected verdict" is one observation covering
both sites, and each injected run isolates one key while leaving the other intact.

#### The injection is proven to have TAKEN, not merely to have been typed

An injection that silently no-opped would produce a green that *looks* like blindness. Each row
therefore records the compiled catalogue's export count **before and after**, per the REAL-04 control's
own `598 → 597` precedent (`.planning/milestones/v2.14-REQUIREMENTS.md`, REAL-04). Both fell by
**exactly one**, and the specific mangled export vanished in each case. A dev-server **restart** sits
between every injection and every verdict, because Paraglide compiles at server start.

#### The rendered text, read from the run's own artefacts

`trace: 'on'` (`tests/playwright.config.ts:352`) means even a PASSING test leaves a trace, and the HTML
reporter copies it into the per-run directory. The DOM snapshots inside those traces are the source of
the strings below — they are not asserted from theory:

- `RK1-OLD`, from `147-rk1-old/html/data/810a8065….zip`:
  `["DIV",{"class":"vaa-button-label first-letter:uppercase"},["SPAN",{"class":"uc-first relative"},"candidateApp.questions.editAnswer "]]`
- `RK2-OLD`, from `147-rk2-old/html/data/92d78675….zip`:
  `["SPAN",{"class":"sr-only …"},"common.required"]` — the screen-reader-only marker
  `candidateProfilePage.fixture.ts:174-176` documents as its target (`Input.svelte:135`).

`/edit/i` matches `candidateApp.questions.editAnswer` because the key CONTAINS `edit`; `/required/i`
matches `common.required` for the same reason. Both regexes also match the working strings
`Edit Your Answer` and `Required` — which is precisely why neither can tell the working state from the
broken one. This reproduces the scout's control C5 against a real render rather than a string
comparison.

#### `RK2-OLD` carries a second, independent weakness

`candidateProfilePage.fixture.ts:179` is `expect.soft(...)`. Even a **genuine** miss there would not
fail fast — it would accumulate as a soft failure rather than stopping the walk. That is a weakness in
its own right, separate from the blindness measured above, and it is recorded here rather than only in
a summary. Note also that the soft-assertion budget guard in `tests/playwright.config.ts` is scoped to
`specs/voter/voter-journey.spec.ts` only, so this site is ungoverned by it.

#### Both reverts proven twice

*(The left column is worded so these lines cannot be mistaken for register rows by the anchored
`^| \`ID\` ` count pattern above — the count must stay 13.)*

| revert of | `git diff --exit-code` | `git hash-object` equality |
|---|---|---|
| row `RK1-OLD` | exit **0** over `apps/frontend/messages` and `apps/frontend/src/lib/i18n` | all **7** `candidateApp.questions.json` hashes equal to the recorded clean values |
| row `RK2-OLD` | exit **0** over the same paths | all **7** `common.json` hashes equal to the recorded clean values |

After both reverts: `en.js` back to **598**, and
`git status --porcelain -- apps packages tests .github package.json yarn.lock` prints **nothing**.

### `AX1-OLD` — the green that is the defect

**A real WCAG 2.1 AA violation was live in the product on seven candidate surfaces and the FULL default
suite reported 135 passed / 0 failed.** That is the measurement. It is not a successful run.

#### Why this injection, and why it cannot redden the suite for the wrong reason

The defect had to satisfy three properties at once. Each was **verified before the run**, not assumed:

| property | how it was verified |
|---|---|
| a genuine violation under the gate's own tag set | axe rule `image-alt`, tag `wcag2a` — inside `WCAG_TAGS` (`a11y-smoke.spec.ts:163`). The scout's control C1 measured this exact defect shape reported as `image-alt` on `/candidate/questions`. **Independently corroborated during the run itself:** the Svelte compiler emitted `a11y_missing_attribute` — "`<img>` element should have an alt attribute" at `+layout.svelte:191:2` — into the dev-server log. |
| renders on every candidate `(protected)` surface | it sits in the `{:else}` branch of the SHARED `(protected)` layout, the branch all six leaf routes take, with the nav drawer overlaying it |
| perturbs nothing an existing assertion reads | **no new text node** and **no new interactive control**. The suite has exactly **two** image-role matchers, found by grepping all of `tests/tests/`: `candidatePreviewPage.fixture.ts:100` (`container().getByRole('img').first()`) and `candidateQuestionPage.fixture.ts:48` (`hero.getByRole('img').first()`). **Both are scoped to containers the injection sits OUTSIDE of.** `locator('img')` has zero occurrences. |

**The visual gate could not have caught it either, and that is not luck:** `visual-regression` is declared
only under `PLAYWRIGHT_VISUAL` (`tests/playwright.config.ts:411-414`), so it is not in the default suite.
Had it been, a new visible element would have reddened it as a pixel diff — a red for the wrong reason.

#### The element was live, read from the served page — not from the source

An element hidden from the accessibility tree is excluded by axe and would make this whole measurement
vacuous, so presence was confirmed from the DOM the application actually served, captured in the run's
own traces:

```
["IMG",{"__playwright_current_src__":"http://localhost:5173/favicon.png","src":"/favicon.png",
        "width":"24","height":"24","data-testid":"ax1-old-injection"}]
```

| property | evidence in the served DOM |
|---|---|
| no `alt` attribute | the attribute list is exactly `src`, `width`, `height`, `data-testid` — the violation is real, not a mislabelled element |
| actually loaded | `__playwright_current_src__` resolved to `http://localhost:5173/favicon.png` — not a broken zero-size image |
| visible, in the accessibility tree | 24×24 with layout; no `hidden`, no `aria-hidden`, no `display:none`, no `sr-only` |
| on candidate `(protected)` routes | the same traces carry `/candidate`, `/candidate/profile`, `/candidate/questions`, `/candidate/preview` |
| how widely | **29 occurrences across 13 of the run's 135 traces** |

*(Recorded because it nearly produced a false negative: the FIRST probe searched only the single largest
trace in the run, which belongs to a `perm-*` test that never visits a candidate route, and returned 0.
The zero was an artefact of the probe, not of the injection. Searching all 135 traces returned 29. A
one-trace probe is not sufficient evidence of absence on a full-suite run.)*

#### What the run proves about reach

Nothing failed — so the reading is not "which project caught it" but "which project could have". The
closest candidate is `a11y-smoke`, the only project running axe at all, and it reported **16/16 pass**
while the violation was live. Its route table is voter-only, so its scans never loaded a candidate
`(protected)` surface. That is precisely the coverage hole CSCAN-01 exists to close, measured rather
than argued.

#### Revert proven twice, then re-confirmed by a run

| check | result |
|---|---|
| `git diff --exit-code -- apps/frontend/src/routes/candidate` | exit **0** |
| `git hash-object` of the layout | `18c71976e3d57208607f0010b02fe7926b59dc66` — equal to the recorded clean value |
| `git status --porcelain` (whole tree) | empty |
| post-revert confirmation run (`147-ax1-postrevert/`, `candidate-journey`, `--db-reset`) | **5/5 passed**, exit 0, preflight OK=1 |

The confirmation run exists so the row does not end on an unverified restoration: a hash can prove the
bytes are back, but only a run proves the application still behaves as it did before the injection.

---

### `ORD-OBSERVED` — a derivation is not evidence until it reproduces a run

**This row cost no suite time.** `BASE-GREEN` already carries a `startTime` and a `duration` for each of
its 135 test results, and Playwright runs phases *strictly sequentially*, so the phase boundaries are
recoverable from the per-project `[first start, last end]` windows alone — the observed assignment is
read off the clock, never off the config.

Why bother, when the scheduler's source is on disk in `node_modules`? Because
`tests/playwright.config.ts:496-518` records this exact wiring being reasoned about wrongly **twice**,
and that file's own comment says not to fix the race the second way. A third reading would be a third
guess. The instrument is therefore required to reproduce the real assignment before a single prediction
is taken from it, and `--self-check` exits non-zero on any disagreement.

| | |
|---|---|
| declared projects in the default config | 90 |
| scheduled projects (have tests after `--grep-invert @probe`) | **89** |
| predicted phases | **80** |
| observed phases | **80** |
| project-level mismatches | **0** |
| new suite runs required | **0** |

The instrument reads `dependencies` and `teardown` by **importing the config module**, so it cannot
drift from the file it describes, and it reproduces Playwright's teardown rule as well as its
dependency rule — which is what puts the 27 `data-teardown-*` projects in phases 54–80 instead of in
phase 1, and is the part a hand-drawn graph gets wrong.

**`git diff --exit-code -- tests/playwright.config.ts` → 0.** This row edits nothing; the wirings it
feeds are in-memory overlays.

### `ORD-PERTURB` — ✅ FILLED 2026-08-27; verdict **does not perturb**

**Resolved.** The third attempt completed: **136 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**,
exit **0**, 10.7 min, preflight OK=1 FAILED=0, at HEAD `6e65a5d2f` into
`tests/e2e-runs/147-ord-perturb/`. What follows preserves the two voided attempts and the blocked
analysis **verbatim below**, because the disclosure of two failed measurements is part of this row's
evidence, not scaffolding to delete once it went green.

#### The measurement, against `BASE-GREEN`

| | `BASE-GREEN` | `ORD-PERTURB` | delta |
|---|---|---|---|
| total | 135 | **136** | **+1** — exactly the one declared setup, as predicted |
| passed | 135 | **136** | +1 |
| failed / skipped / flaky / did-not-run | 0 / 0 / 0 / 0 | **0 / 0 / 0 / 0** | **0** |
| exit code | 0 | **0** | — |
| wall clock | 10.8 min | **10.7 min** | **−0.1 min** — noise, not a cost |
| observed phases | 80 | **80** | **0** |
| projects whose observed phase MOVED | — | **0 of 89** | **0** |

#### Where `auth-setup` landed, read from this run rather than predicted

Derived by `observedFromRun()` in `tests/e2e-runs/147/phases.mjs` — the same instrument `ORD-OBSERVED`
validated at 0 mismatches — applied to this run's own `results.json`, never to a prediction.

| | |
|---|---|
| observed phase | **2 of 80** |
| its own result | **1/1 PASS, 3.0 s** |
| projects sharing phase 2 (10) | `performance`, `eperm07-term-trigger`, `voter-journey`, `a11y-smoke`, `data-setup-candidate-journey`, `cold-entry-dataroot`, `voter-dark-mode`, `voter-journey-mobile`, `voter-alliance`, `voter-nominations` |
| set difference vs `BASE-GREEN` | `auth-setup` present here and only here; **no project present in `BASE-GREEN` is missing**, and none moved |

This is the concurrency the hazard analysis flagged: `auth-setup` force-registers base CA-AA-1 —
mutating `auth.users` and the candidate row's `auth_user_id` — **while `voter-journey`, `a11y-smoke` and
the candidate-journey setup share its phase**. The three interaction questions the plan posed, each
answered from the run:

1. **Did any journey assertion depending on candidate registration state move?** No. `candidate-journey`
   1/1 (24.8 s), `perm-disable-allow-open` (candidate side, authenticated) 3/3, `perm-answers-locked`
   3/3, `perm-access-disable` 3/3 — all pass, none flaky.
2. **Did the base candidate row still carry the identity the journeys expect at the end?** Yes, as far as
   this run can show: every candidate-side authenticated assertion passed *after* the force-register, and
   `data-teardown-base` completed cleanly. **Boundary:** this is end-state evidence from assertions, not a
   direct post-run row inspection — the teardowns delete the base dataset by design, so no such
   inspection is available after a completed run.
3. **Did `auth-setup`'s own step pass, and at what cost now that it competes for the database?** Yes —
   3.0 s, inside phase 2's 64.3 s critical path (`voter-journey`), so it consumed slack rather than
   extending the run. The −0.1 min total is consistent with that.

#### Verdict

**DOES NOT PERTURB.** Declaring `auth-setup` unconditionally, with nothing depending on it, changes the
suite by exactly the one test it adds. Per the plan's own framing this is the *less* valuable of the two
possible results — a perturbation would have constrained `147-03`'s decision by disqualifying any wiring
whose first move is already a regression. It does not, so **no wiring is disqualified on this axis**.

#### The revert, proven twice

| proof | result |
|---|---|
| `git diff --exit-code -- tests/playwright.config.ts` | exit **0** |
| `git hash-object tests/playwright.config.ts` | `fbbd85ae27895d9e19a73ad95113610dcf511c04` — **identical** to the pre-edit hash taken fresh before this attempt |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | **empty** |

---

#### History retained: the blocked analysis and the two voids

*Everything below is the record as it stood before the third attempt. It is retained deliberately.*

**This row was NOT filled, and it must not have been.** Two full-suite runs were taken and **both were voided by
the host machine's disk, not by the variable under test.** Under `CLAUDE.md` § E2E Hard Rule a run that
did not complete is a **failure**, and per this register's own § *Every cell must be filled from a run
that executed*, a cell whose run did not execute keeps its `TBD-147` and carries **no** outcome. The
runs are preserved rather than deleted, because a voided run that nobody can find is indistinguishable
from a run nobody took.

#### What IS established, and survives both voids

The perturbation edit itself was applied and **behaviourally confirmed**, which is half of what this row
asks. Exactly one token changed in `tests/playwright.config.ts` — `process.env.PLAYWRIGHT_VISUAL` →
`true` on the `auth-setup` gate expression (`git diff --stat` → 1 insertion, 1 deletion). **No
dependency edge was added anywhere**, so nothing consumed the project.

Its presence in a default invocation was confirmed **behaviourally, from the loaded config's project
list**, never by a text search of the file — the file's own comment says the gate is the source of
truth, and a grep cannot distinguish a *declared* project from a *mentioned* one. Two independent
confirmations:

| check | method | result |
|---|---|---|
| the config module's own project array | `config-projects.mts` imports `tests/playwright.config.ts` and prints `projects[]`; run with **no** environment set | `auth-setup` **declared**, `dependencies: ['data-setup-base']`, `teardown: null`; 91 projects (was 90) |
| Playwright's own enumeration | `npx playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe --list` | `[auth-setup] › setup/shared/auth.setup.ts:68:1 › register + authenticate as base candidate`; **`Total: 136 tests in 90 files`** |

**136 vs `BASE-GREEN`'s 135 — the test-count delta is exactly +1**, which is the delta this row predicts
if the only change is that one more setup is declared. Both voided runs also enumerated **136**.

#### The two voided runs, disclosed

| run dir | counts | wall clock | preflight | why VOID |
|---|---|---|---|---|
| `tests/e2e-runs/147-ord-perturb-void1/` | 136 total — **56 passed / 1 failed / 79 did-not-run** | 1.8 min | OK=1 FAILED=0 | The **dev server died mid-run**. `candidate-journey` failed with `net::ERR_CONNECTION_REFUSED` at `http://localhost:5173/en/candidate/auth/callback?…` (`candidate-journey.spec.ts:509`), and `devserver.sh status` afterwards reported `<nothing listening>`. A dead server is not a measurement of a dependency-graph change. |
| `tests/e2e-runs/147-ord-perturb-void2/` | 136 total — **123 passed / 6 failed / 7 did-not-run** | 8.9 min | OK=1 FAILED=0 | **`No space left on device`.** `data-setup-perm-org-matching` failed with `updateAppSettings: merge failed: could not extend file "base/5/18798": No space left on device`, and the five teardown failures are all the same cause surfacing through Supabase Auth as `unregisterCandidate: deleteUser failed: Error recording audit log entry`. Postgres could not extend a relation. |

**All six failures in `void2` are one cause, and it is the disk.** Not one of them is in phase 2 or 3
where `auth-setup` lands; they are in perm phases 50–65, downstream of everything the edit touches, and
the failing operations are writes to `app_settings` and to `auth.audit_log_entries`.

#### The blocker, measured

| probe | value |
|---|---|
| host volume (`/System/Volumes/Data`) | 926 GiB total, **853 GiB used, 17 GiB free — 99 % full** |
| `~/Library/Containers/com.docker.docker/…/Docker.raw` | **104 GB** |
| `docker system df` — images | 27.33 GB (8.52 GB reclaimable) |
| `docker system df` — local volumes | 12.73 GB |
| `docker system df` — build cache | 2.99 GB → **pruned to 0 B reclaimable** during this plan |
| dangling images available to prune | **1** |
| `tests/e2e-runs/` (this repo's gitignored evidence, phases 140/146/147) | 6.5 GB |

**One reclaim was performed and it was not enough.** `docker builder prune -f` freed **3.049 GB** of
Docker build cache — regenerable by construction, and it touches no image, no container and no volume,
so no project lost data. That was sufficient to get `yarn db:reset` to exit 0 (it had been failing with
`initdb: could not create directory "…/pg_wal": No space left on device`), but not sufficient to carry a
full suite run, which grows both the Postgres data directory and ~260 MB of Playwright traces.

**Nothing further was reclaimed, deliberately.** The remaining candidates all reach outside this phase's
blast radius: `docker system prune -a --volumes` would destroy the databases of the other Supabase
projects on this machine (`next-supabase-skimle2` and others are running in the same daemon); deleting
`tests/e2e-runs/` would destroy the evidence directories that phases **140** and **146** registers cite
by path; and freeing 100+ GiB on the host volume means deleting the operator's own files. None of those
is a decision this plan may take on its own.

#### The revert is proven twice regardless

The perturbation edit does **not** survive this blocker. Both proofs were taken after the second void
run:

| proof | result |
|---|---|
| `git diff --exit-code -- tests/playwright.config.ts` | exit **0** |
| `git hash-object tests/playwright.config.ts` | `68ef2b19a1e7d97931fa7fe77923bbc41ecfcd75` — **identical** to the pre-edit hash recorded before the edit was applied |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | **empty** |

#### ⚠ The clean baseline for `tests/playwright.config.ts` MOVED after this row was written

The two proofs above remain true **as statements about 2026-08-27 at HEAD `23448af0b`**, and are left
standing rather than rewritten. But `68ef2b19a1e7d97931fa7fe77923bbc41ecfcd75` is **no longer the clean
hash of that file**, and a re-run that asserts against it will fail its revert-identity check for a
reason that has nothing to do with the variable under test.

`fde174ccf` (`chore(tests): retain traces only for failures`) changed `trace: 'on'` →
`trace: 'retain-on-failure'` in the `use` block, for the disk reason this very row is blocked on.

| | `git hash-object tests/playwright.config.ts` |
|---|---|
| clean, as recorded by this row (HEAD `23448af0b`) | `68ef2b19a1e7d97931fa7fe77923bbc41ecfcd75` |
| **clean, current (HEAD `fde174ccf`)** | **`fbbd85ae27895d9e19a73ad95113610dcf511c04`** |

**The re-run must take a fresh pre-edit hash and assert against that**, not against `68ef…`. The
perturbation itself is unaffected — it is one deterministic token in the projects array, and the
`use` block it now shares the file with is not what ORD-PERTURB varies.

#### What unblocks this row

Free disk on the host so that Postgres and the trace writer can both grow through a ~9–11 minute
full-suite run, then re-run **exactly** the recorded command (with the corrected baseline hash above).
Nothing else about the measurement changes; the edit is one deterministic token and the run directory
name is already reserved.

**A fourth option the paragraph above did not consider, and the only one that frees nothing of the
operator's.** The three rejected options were: stop the other daemons' projects, delete
`tests/e2e-runs/` (cited by the 140 and 146 registers), or delete the operator's own files. Measured
2026-08-27, there is a fourth:

| | |
|---|---|
| `Docker.raw` — blocks actually allocated on the host | **60 GiB** |
| `docker system df` — images + containers + local volumes | **~7.5 GB** |
| difference, i.e. blocks the VM freed internally but never returned to macOS | **~52 GiB** |

Docker Desktop's disk image is sparse and grows monotonically; deleting a layer or volume inside the VM
does not hand the blocks back to APFS without an `fstrim`. Reclaiming that gap **destroys no image, no
volume, and no operator file** — it returns space the VM has already stopped using. Host free at
measurement was **56 GiB / 926 GiB (94% capacity)**, so this roughly doubles the headroom the voided
`void2` run ran out of.

This is an operator decision about their whole Docker environment (the Supabase stack plus other
projects' containers are live in that daemon), so it is **recorded here, not taken**. The standard
non-destructive form is an `fstrim` inside the VM.

Note also that `fde174ccf` removes the *trace writer* half of this row's disk pressure going forward: a
green full-suite run now deposits ~0 bytes of trace instead of 260–340 MB, and because `e2e-run.sh`
points `PLAYWRIGHT_HTML_OUTPUT_DIR` at `$RUN_DIR/html`, a green archived run drops from ~340 MB to a few
MB. That shrinks the *next* run's footprint; it does not by itself free what is already allocated.

### `REACH-14` — ✅ FILLED 2026-08-27; the fourteen scans, their reach proofs, and the phase the instrument predicted

Two runs, both preflight-confirmed, both after `yarn db:reset`:

| run | invocation | verdict |
|---|---|---|
| project | `run-suite.sh --run-dir tests/e2e-runs/147-reach14 --project candidate-a11y-scan --db-reset` | **17 passed / 0 failed**, exit 0, 15.1 s |
| full suite | `run-suite.sh --run-dir tests/e2e-runs/147-reach14-suite --db-reset` | **150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**, exit 0, 10.7 min |

Counts derived from each run's own `results.json` by `tests/e2e-runs/147/summarize.mjs`, which reports
Playwright's `stats` block alongside its own derivation rather than instead of it. Both agree.

#### The fourteen scans, each with the proof taken from its own run

Every cell below is read out of that scan's `reach-proof-<label>.json` /
`axe-violations-<label>.json` / `raw-i18n-keys-<label>.json` attachment in
`tests/e2e-runs/147-reach14/results.json` — not from the summary, and not from the auth fixture's exit
code. `prefers-color-scheme` is the scan's own live reading; the dark twins additionally passed
`assertDarkThemeApplied`, which compares a probe node created at scan time against the persistent header
chrome and so cannot be satisfied by a half-dark document.

| # | label | settled URL (asserted inside `/candidate`, asserted **not** `/candidate/login`) | post-login marker | h1 read at scan time | dark | violations | raw-key findings |
|---|---|---|---|---|---|---|---|
| 1 | `cand-home` | `/candidate` | `candidate-home-logout` ×1 ("Log Out") | "You’re Ready to Roll!" | false | **0** | **0** |
| 1d | `cand-home-dark` | `/candidate` | `candidate-home-logout` ×1 | "You’re Ready to Roll!" | **true** | **0** | **0** |
| 2 | `cand-profile` | `/candidate/profile` | `candidate-profile-nominations` ×1 | "Basic Information" | false | **0** | **0** |
| 2d | `cand-profile-dark` | `/candidate/profile` | `candidate-profile-nominations` ×1 | "Basic Information" | **true** | **0** | **0** |
| 3 | `cand-questions` | `/candidate/questions` | `candidate-questions-list` ×1 | "Your Opinions" | false | **0** | **0** |
| 3d | `cand-questions-dark` | `/candidate/questions` | `candidate-questions-list` ×1 | "Your Opinions" | **true** | **0** | **0** |
| 4 | `cand-question` | `/candidate/questions/77513d9e-e512-414b-9924-7331c3e3fea7` | `candidate-questions-save` ×1 | "[qu-opin-base-1-likert5] Base opinion 1 — Likert 5." | false | **0** | **0** |
| 4d | `cand-question-dark` | `/candidate/questions/77513d9e-…` | `candidate-questions-save` ×1 | same | **true** | **0** | **0** |
| 5 | `cand-preview` | `/candidate/preview` | `candidate-preview-container` ×1 | *(none — see below)* | false | **0** | **0** |
| 5d | `cand-preview-dark` | `/candidate/preview` | `candidate-preview-container` ×1 | *(none)* | **true** | **0** | **0** |
| 6 | `cand-settings` | `/candidate/settings` | `settings-update-password` ×1 | "Settings" | false | **0** | **0** |
| 6d | `cand-settings-dark` | `/candidate/settings` | `settings-update-password` ×1 | "Settings" | **true** | **0** | **0** |
| 7 | `cand-nav-menu` | `/candidate` (drawer open) | `candidate-nav-settings` ×1 | "You’re Ready to Roll!" | false | **0** | **0** |
| 7d | `cand-nav-menu-dark` | `/candidate` (drawer open) | `candidate-nav-settings` ×1 | "You’re Ready to Roll!" | **true** | **0** | **0** |
| | | | | | | **TOTAL 0** | **TOTAL 0** |

Every h1 matches the one `147-SCOUT-INVENTORY.md` § 4 recorded for that surface, and the per-question
route carries a database UUID — i.e. it was reached by WALKING the expanded overview, which is the only
way that URL can be produced. **`cand-preview` reports no h1 deliberately:** the preview card's title
renders below `<h1>` level, so the surface's proof is its `EntityDetails` article (the scan's own content
anchor) plus the container marker, exactly as the scout recorded it. Reading the absent h1 as a weakness
would be reading the wrong instrument — a null there is a fact about the template, not about the reach.

**The zero is a repeat, not a first sighting.** `147-SCOUT-INVENTORY.md` § 4 measured 0/0 across the same
14 scans, twice, in a standalone config. This run reproduces it a third time from inside the real suite,
under real contention, through the committed wiring. Per the plan's own backstop clause, a violation here
would have meant "this wiring reaches a different DOM than the scout's did" before it meant a product
finding; it did not arise.

#### Observed execution phase vs. `147-ORDERING.md`'s prediction

Recovered from the full-suite `results.json` by `observedFromRun()` — per-test `startTime` + `duration`
windows, swept into phases — and compared against `computePhases()` run on the now-live config. **This is
the same instrument `ORD-OBSERVED` validated, applied to a run it had not seen.**

| quantity | W3 predicted (`147-ORDERING.md` § *Decision (A)*) | observed here | verdict |
|---|---|---|---|
| `candidate-a11y-scan` phase | 3 of 80 | **3 of 80** | ✔ |
| `auth-setup` phase | 2 | **2** | ✔ |
| co-scheduled with the scan | 1 — `candidate-journey`, and nothing else | **1 — `candidate-journey`** | ✔ |
| total phases | 80 | **80** | ✔ |
| predicted-vs-observed mismatches | — | **0 over 91 scheduled projects** | ✔ |
| `--project=candidate-a11y-scan` pulls | 2 — `data-setup-base`, `auth-setup` | **2 — the same two** | ✔ |
| `--project=a11y-smoke` pulls | 1 — `data-setup-base` (isolation preserved) | **1 — `data-setup-base`** | ✔ |
| `--project=performance` pulls | 1 — `data-setup-base` | **1 — `data-setup-base`** | ✔ |

The plan required that a disagreement here be recorded as a failure of `147-02`'s instrument before
anything else was concluded from the run. **There is no disagreement**, on any of the eight quantities.

Hazard verdict, re-read from the observed assignment rather than re-argued: the scan's phase contains
`candidate-journey` alone — no `app_settings` REPLACE, no `test-` pre-clear — and every
`data-setup-perm-*` sits in phase ≥ 4, so the last authoritative `app_settings` write before the scan is
`data-setup-base`'s, which is the singleton the default suite runs under.

#### Wall clock — what it actually cost

| quantity | `BASE-GREEN` | `REACH-14` (full suite) | delta |
|---|---|---|---|
| suite wall clock | 10.8 min | **10.7 min** | **−0.1 min — inside noise** |
| tests | 135 | **150** | +15 (14 scans + `auth-setup`) |
| failures / flaky / did-not-run | 0 / 0 / 0 | **0 / 0 / 0** | 0 |
| `auth-setup` | not declared | 5.0 s, phase 2 | absorbed under `voter-journey`'s 67.6 s |
| `candidate-a11y-scan` | — | sum 39.0 s, **window 10.3 s**, phase 3 | new |
| phase 3 window | 27.3 s | **32.2 s** | +4.9 s |
| `a11y-smoke` window | 40.7 s | 47.9 s | +7.2 s |
| `a11y-smoke` summed per-test | 130.2 s | 166.5 s | +36.3 s |

The scan's ≈22 s scout estimate came in at **39.0 s summed / 10.3 s wall**, and it lands in a phase whose
critical path is `candidate-journey`, so the marginal cost is the +4.9 s of phase 3 rather than the full
39.0 s — the prediction that the new work would hide under an existing critical path holds in direction,
with a small residue rather than the predicted flat zero.

**The `a11y-smoke` +36.3 s is NOT attributed to this change, and is recorded as unattributed rather than
explained away.** The evidence against attributing it: the same project, on the same tree, measured
**194.9 s and 301.4 s** in this plan's two Task-1 isolated a11y runs
(`tests/e2e-runs/147-03-t1-a11y-final/`, `147-03-t1-a11y/`) — both *before* Task 2 touched the shared
body. 166.5 s sits below both. The summed per-test figure for this project varies by a factor of ~2.3
across runs regardless of the change, so a +28 % reading against a single prior run is inside that
spread and cannot carry a causal claim either way. What is measured, and is the number that matters
under the cardinal rule, is the suite wall clock: **10.8 → 10.7 min**.

---

### `AX1-NEW` — ✅ FILLED 2026-08-27; the same defect, now named by rule and by selector

**`AX1-OLD` and `AX1-NEW` are one experiment with one variable.** The product byte that was injected is
the same byte; the file is the same file; the compiled source location is the same location. The suite
missed it two plans ago and names it now. That difference is the measurement, and it is the only thing in
this register that can distinguish a live candidate gate from a gate pointed at nothing.

#### The pairing, stated as the comparison it is

| | `AX1-OLD` (blind, `147-01` T3) | `AX1-NEW` (catch, `147-04` T1) |
|---|---|---|
| file | `…/candidate/(protected)/+layout.svelte` | **the same file** |
| clean blob hash before injection | `18c71976e3d57208607f0010b02fe7926b59dc66` | **`18c71976e3d57208607f0010b02fe7926b59dc66`** — equal |
| injected element | `<img src="/favicon.png" width="24" height="24" data-testid="ax1-old-injection" />` | **byte-identical**, including the `data-testid` |
| insertion point | first child of the `{:else}` branch, immediately before `{@render children?.()}` | **the same point** |
| compiled source location | `+layout.svelte:191:2` | **`191:2`** — read out of the served module's own `add_locations` call, `[[191, 2` |
| Svelte compiler warning | ``a11y_missing_attribute`` — "`<img>` element should have an alt attribute", `191:2` | **the same warning at the same location**, emitted 0 → 1 times in `devserver.log` after the restart |
| served DOM node | `["IMG",{"__playwright_current_src__":"http://localhost:5173/favicon.png","src":"/favicon.png","width":"24","height":"24","data-testid":"ax1-old-injection"}]` | axe reported `"html": "<img src=\"/favicon.png\" width=\"24\" height=\"24\" data-testid=\"ax1-old-injection\">"` — the same attribute set, no `alt` |
| scope of the run | FULL default suite | the `candidate-a11y-scan` project alone |
| **verdict** | **135 passed / 0 failed** — nothing caught it | **14 of 14 candidate scans FAILED**, naming `image-alt` and the selector |

**Why the two run scopes differ, deliberately.** `AX1-OLD`'s claim was *nothing* catches this, which only
a full suite can carry. `AX1-NEW`'s claim is *this gate* catches this, which its own project carries
exactly. Scoping the catch half to one project is not a weakening: the full-suite consequence of the same
gate being live is measured separately, and green, in `E2E1-SUITE`.

#### Where the blob hash could NOT carry the pairing, and what carries it instead

**The injected-state blob hashes differ — `ca43e76a…` (`AX1-OLD`) vs `f8c08e07…` (`AX1-NEW`) — and that
is a defect in `147-01`'s record, not a difference in the instrument.** Recorded rather than smoothed
over, because the register's own § *Injected-state blob hashes* makes the opposite promise:

- That section says *"the exact injected text is recoverable from this plan's commit range"*. **It is
  not.** `147-01` committed **zero product bytes** by design — that is the property its own summary
  claims — so the injected file never entered git history and the blob `ca43e76a…` is not in the object
  database (`git cat-file -t ca43e76a…` → `could not get object info`).
- The hash covers a **6-line comment** whose text `147-01` never recorded anywhere. The comment is not
  recoverable from the run's artefacts either: the Svelte compiler strips markup comments, so the
  `147-ax1-old` traces show the `IMG` node with a bare `" "` text sibling and no comment node.
- The same section anticipated exactly this and permits the alternative it names: *"`147-04` must
  re-apply the comment verbatim **or record its own injected-state hash instead**."* This row takes that
  second branch.

**What is proven instead is stronger than a source-file hash, because it is proof about the thing the
gate actually reads.** axe reads the DOM, not the file. Both halves are proven to have presented the
**same DOM element**: `AX1-OLD` from its own traces, `AX1-NEW` from axe's own `"html"` field, and the two
are byte-identical in tag, attribute set and attribute order, with `alt` absent in both. The source-level
identity is carried by four further equalities — same file, equal clean hash, byte-identical element
line, identical compiled location `191:2` — leaving the comment text as the only difference, a comment
the compiler deletes before anything under test can observe it.

**`AX1-NEW`'s own injection IS fully reproducible from this register**, which is the half of `147-01`'s
promise this row keeps. Insert, immediately after the `{:else}` line and before `{@render children?.()}`:

```
  <!--
    147-04 AX1-NEW catch half - the SAME defect as 147-01 AX1-OLD: a visible <img>
    with NO alt attribute, axe rule `image-alt` (tag wcag2a), inserted as the first
    child of the shared (protected) {:else} branch so it renders on every candidate
    protected surface. Reverted and proven twice inside 147-04 Task 1.
  -->
  <img src="/favicon.png" width="24" height="24" data-testid="ax1-old-injection" />
```

Applied to the file at clean hash `18c71976…` this yields `f8c08e07d…` = `f8c08e072e88916c751ba44f3b2a48399483ef54`, checkable by anyone.

#### The injection was proven LIVE before the verdict was read

An element outside the accessibility tree is excluded by axe, and would produce a false negative that
looks exactly like a broken gate. Presence was therefore established from the **served application**,
before the run, not from the source file:

| proof | reading |
|---|---|
| the served module — `GET /@fs/<repo-root>/apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | `200 text/javascript`, containing `$.from_html(`\`<img src="/favicon.png" width="24" height="24" data-testid="ax1-old-injection"/> <!>`\`, 1), _layout[$.FILENAME], [[191, 2` — **this checkout's own dev server is serving the injected template**, and it records the source location as 191:2 |
| the Svelte compiler | `15.40.34 [vite-plugin-svelte] src/routes/candidate/(protected)/+layout.svelte:191:2 \`<img>\` element should have an alt attribute` / `a11y_missing_attribute` — count in `devserver.log` went **0 → 1** across the restart |
| axe, in the run itself | 14/14 surfaces reported the element with `"impact": "critical"` and a resolved `"target"` selector — an element axe could not see is an element axe cannot report |

*(The dev server was restarted through `devserver.sh` between injection and verdict, per this register's
standing rule. The layout is not a Paraglide catalogue, but the rule is unconditional for a reason: a
verdict read against a pre-injection module is silently vacuous.)*

#### All fourteen failed — which is what the injection's placement predicts

The element sits in the **shared** `(protected)` layout's `{:else}` branch, the branch every leaf route
takes, so every candidate surface should see it. **Fourteen of fourteen did.** There is no surface to
account for as an exception, and therefore no reach finding hiding inside a partial catch.

| surface | light | dark | selector axe named |
|---|---|---|---|
| `cand-home` (`/candidate`) | FAIL | FAIL | `["img"]` |
| `cand-profile` (`/candidate/profile`) | FAIL | FAIL | `["img[src$=\"favicon.png\"]"]` |
| `cand-questions` (`/candidate/questions`) | FAIL | FAIL | `["img"]` |
| `cand-question` (`/candidate/questions/c04286b4-…`) | FAIL | FAIL | `["img"]` |
| `cand-preview` (`/candidate/preview`) | FAIL | FAIL | `["img[src$=\"favicon.png\"]"]` |
| `cand-settings` (`/candidate/settings`) | FAIL | FAIL | `["img"]` |
| `cand-nav-menu` (drawer over `/candidate`) | FAIL | FAIL | `["img"]` |

**Both themes behave identically** — the dark twins are born-dark contexts, not flipped light ones, and
they name the same rule on the same element. **The two selector shapes are a feature of the report, not
an inconsistency:** axe emits the shortest selector that uniquely identifies the node, so on the two
surfaces that carry a second real `<img>` (the candidate portrait on `/candidate/profile` and on the
preview card) it disambiguates with `img[src$="favicon.png"]`. Both forms name the offending element.

The quoted failure message, from `147-ax1-new/results.json` (`cand-home`; the other thirteen differ only
in the selector shape above):

```
Error: expect(received).toHaveLength(expected)

Expected length: 0
Received length: 1
Received array:  [{"description": "Ensure <img> elements have alternative text or a role of none or
  presentation", "help": "Images must have alternative text",
  "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/image-alt?application=playwright",
  "id": "image-alt", "impact": "critical", "nodes": [{… "failureSummary": "Fix any of the following:
  Element does not have an alt attribute
  aria-label attribute does not exist or is empty
  …", "html": "<img src=\"/favicon.png\" width=\"24\" height=\"24\" data-testid=\"ax1-old-injection\">",
  "impact": "critical", "none": [], "target": ["img"]}],
  "tags": ["cat.text-alternatives", "wcag2a", "wcag111", …]}]

   at utils/axeScan.ts:189
```

`utils/axeScan.ts:189` is the **global zero gate**, `expect(results.violations).toHaveLength(0)` — the
single parameterless gate both halves of the scan family run through. The rule ID and the offending
selector are inside the message itself, not only in the `axe-violations-*.json` attachment, so a reader
of the reporter output alone learns both.

#### The raw-key verdict was reported in the SAME run, and was clean

All 14 scans attached `raw-i18n-keys-*.json` with **0 findings** while the axe gate failed. That is
`147-03`'s Decision (B) working in the direction this row needs: the two verdicts do not suppress each
other, so an axe failure here is an axe failure, uncontaminated by the catalogue. (The opposite
direction — an i18n failure not suppressing the axe result — is what `RK1-NEW`/`RK2-NEW` exercise.)

#### Revert proven twice, then re-confirmed by a run

| check | result |
|---|---|
| `git diff --exit-code -- apps/frontend/src/routes/candidate` | exit **0** |
| `git hash-object` of the layout after revert | `18c71976e3d57208607f0010b02fe7926b59dc66` — equal to the recorded clean value |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | **empty** |
| post-revert confirmation run (`147-ax1-new-postrevert/`, same project, `--db-reset`) | **17/17 passed**, exit **0**, 15.2 s, preflight OK=1 FAILED=0 |

The confirmation run exists so this row does not end on an unverified restoration, and so `RK1-NEW`
starts from a tree that is measured clean rather than assumed clean: a hash proves the bytes are back,
only a run proves the fourteen scans are green again.

---

### `RK1-NEW` / `RK2-NEW` — ✅ FILLED 2026-08-27; one broken catalogue, one run, two opposite verdicts

Criterion 3 does not ask only that the new scan catch the injection. It asks that the **two named
matchers still pass while it does** — because it is their *simultaneity* that shows the route-family
extension is the fix and a matcher patch never was. Both rows therefore take both verdicts from **one
Playwright invocation** over two projects, not from two runs that would have to be argued comparable.

#### The instrument is provably the same — this time at the blob level

Unlike `AX1-NEW`, these injections are deterministic deletions of a single line, so the pairing is carried
by the blob hashes exactly as the register intended. **All fourteen injected-state hashes were computed
and compared against `RK1-OLD` / `RK2-OLD` BEFORE the runs**, and all fourteen are equal:

| locale | `candidateApp.questions.json` injected (`RK1`) | `common.json` injected (`RK2`) |
|---|---|---|
| da | `5de8589925ebaec5d9350508d80ba50d768b64b0` ✅ | `672a4a47d95cde9f62187c90382f2c16c20e7895` ✅ |
| en | `3c0d1304c1b27baa9d6e416e24beb708935cfa42` ✅ | `99a108e01c2d6f18bf6fec7687fb759d1aa4f5df` ✅ |
| et | `3cc4df1d952254e49a4bdd8cb06236cfd9d3bb8c` ✅ | `cb2eb998d792201abd4082e076e4967667980827` ✅ |
| fi | `da407009ec78da766e5cc98664275658aaed995d` ✅ | `661692fe19a912369ce7d03e14306b78d8106f72` ✅ |
| fr | `b155c15e0374aeb10ad09cb03c18a362310992ac` ✅ | `4edb244f1152d8655b6be4165987ea0d9d251d59` ✅ |
| lb | `1d3355e3fc5708cb5f7e98acc3c02167d774f688` ✅ | `71e7bfe32a640d73b71bca0134d419bfe875c55c` ✅ |
| sv | `e8cdd6904d02c39177a41d1fe967bc4d15a69fcb` ✅ | `17b7abcaf8a11879f8bf4d09c9c848f510b91bc0` ✅ |

The clean hashes were equally verified against § *Restoration blob hashes* before either injection — all
fourteen equal, so both halves start from the same catalogue as well as arriving at the same one.

#### And the injection is proven to have TAKEN, by the same instrument REAL-04 used

| | `RK1-NEW` | `RK2-NEW` |
|---|---|---|
| `en.js` exports before | 598 | 598 |
| `en.js` exports after the dev-server restart | **597** | **597** |
| mangled export removed | `candidateapp_questions_editanswer` | `common_required` |
| the *other* key still present during the run | `common_required` ✅ | `candidateapp_questions_editanswer` ✅ |

Each key is isolated: while one is deleted the other is intact, so neither run can borrow the other's
failure. A dev-server restart sits between every injection and every verdict — Paraglide compiles at
server start, and a verdict read without the restart is a verdict about the pre-injection catalogue.

#### The two verdicts, side by side, from the same invocation

| | `RK1-NEW` (`147-rk1-new/`) | `RK2-NEW` (`147-rk2-new/`) |
|---|---|---|
| new scan — surfaces FAILED | `cand-questions`, `cand-questions (dark)` | `cand-profile`, `cand-profile (dark)` |
| sightings per failing surface | **11** | **1** |
| key named in the message | `candidateApp.questions.editAnswer` | `common.required` |
| catalogue size in the message | `598 catalog keys were checked` | `598 catalog keys were checked` |
| element named in the message | `div[data-testid="candidate-questions-card"] > a[data-testid="candidate-questions-card-action"] > div > span` | `div > section > div > span` (the `sr-only` marker) |
| gate that threw | `utils/axeScan.ts:325` — `expect.soft(rawKeys.findings, rawKeys.message)` | the same |
| axe verdict on those same tests | **0 violations**, reported | **0 violations**, reported |
| **the named blind matcher** | `candidate-journey.spec.ts:924` — **PASSED** | `candidateProfilePage.fixture.ts:179` — **PASSED** |
| its enclosing step, from the run's own step tree | `18.6. categorical + boolean opinion — type-specific input contracts` — completed, 0 errors | `12. profile: static info + filtered questions partition + required badge` — completed, 0 errors |
| other 12 scans | green | green |

**Why the matcher's pass is a real observation and not an absence.** `candidate-journey` has exactly one
test, and the assertion sits inside a `test.step` on its linear path. The run's own step tree records
both enclosing steps as present and error-free, so the assertion was reached and evaluated — the pass is
the matcher's verdict, not a skipped branch. (`147-01` established the same structural fact for the blind
halves: both sites live inside `candidate-journey.spec.ts:367`, `:179` via `expectRequiredBadge` at
`:594`.)

**Neither matcher was touched.** ROADMAP criterion 3 is explicit that patching them in place is not the
fix, and § *Paths that must NEVER change* freezes both files. `git status --porcelain` over `tests/` was
empty for the whole task; the two frozen hashes are re-asserted in `REV1-CLEAN`.

#### Where the scan failed, reconciled against where the key actually renders

A gate that fires on fewer surfaces than the defect touches would be a reach finding hiding inside a
catch. Both rows reconcile, and the reconciliation is read off the product rather than assumed:

| key | rendered by | surfaces in the scan family that render it | surfaces that FAILED |
|---|---|---|---|
| `candidateApp.questions.editAnswer` | `routes/candidate/(protected)/questions/+page.svelte:175` — the card action label on the questions overview | `cand-questions` only | `cand-questions` **light + dark** ✅ |
| `common.required` | `components/input/Input.svelte` (required-badge branch) and `routes/candidate/(protected)/profile/+page.svelte:323` | `cand-profile` only | `cand-profile` **light + dark** ✅ |

`147-SCOUT-INVENTORY.md` § D measured exactly these two placements (`editAnswerVisible: true` on
`cand-questions`, `requiredMarkerVisible: true` on `cand-profile`), and the runs agree with the scout on
both. **`cand-settings` does not fail on `common.required`, and that is correct, not a gap:** its page
declares no `required` input at all (`grep -n required …/settings/+page.svelte` returns nothing), so the
badge branch never renders there. `cand-question` likewise renders neither key.

**One quantity that differs from `RK1-OLD` and is stated rather than reconciled away:** `RK1-OLD` counted
**15** raw-key occurrences in its trace and the scout counted 22 card actions carrying the label, while
this run's scan reports **11** sightings. The three numbers are taken by three different instruments on
three different datasets — a trace-wide string search over the journey's own data, a scout probe, and a
visibility-filtered DOM walk over the `e2e/base` dataset — so they are not expected to coincide and no
claim here rests on their coinciding. What the row asserts is the key's **presence by name**, which all
three agree on.

#### Both reverts proven twice, and the catalogue proven restored

*(The left column is worded so these lines cannot be mistaken for register rows by the anchored
`^| \`ID\` ` count pattern — the count must stay 13, the same care `147-01` took in its own revert table.)*

| revert of | `git diff --exit-code` | `git hash-object` equality | `en.js` exports | export restored |
|---|---|---|---|---|
| row `RK1-NEW` | exit **0** over `apps/frontend/messages` and `apps/frontend/src/lib/i18n` | all **7** `candidateApp.questions.json` hashes equal to the recorded clean values | 597 → **598** | `candidateapp_questions_editanswer` back |
| row `RK2-NEW` | exit **0** over the same paths | all **7** `common.json` hashes equal to the recorded clean values | 597 → **598** | `common_required` back |

After both: `git status --porcelain -- apps packages tests .github package.json yarn.lock` prints
**nothing**, and the dev server was restarted onto the restored catalogue before `E2E1-SUITE` was taken.

#### A change to the harness, disclosed

`run-suite.sh`'s `--project` flag accepted a single value; a two-project invocation is what makes the two
verdicts simultaneous, so the flag was made **repeatable** (`PROJECTS=()`, one `--project=` per entry).
The wrapper is gitignored, the change touches only argument assembly, and the resulting command is
recorded verbatim in each run's `provenance.txt`:
`npx playwright test -c tests/playwright.config.ts --project=candidate-a11y-scan --project=candidate-journey --reporter=html,json`.
No other behaviour of the wrapper moved: it still fails closed on an unverified server and still requires
a positive `E2E PREFLIGHT OK`.

---

### `E2E1-SUITE` / `DET-RUNS` / `REV1-CLEAN` — ✅ FILLED 2026-08-27; the gates, and what they are worth

#### `E2E1-SUITE` — the delta reconciles exactly, with no residue

| quantity | `BASE-GREEN` (`147-01`) | `E2E1-SUITE` (`147-04`) | delta |
|---|---|---|---|
| tests | 135 | **150** | **+15** |
| passed | 135 | **150** | +15 |
| failed / flaky / skipped / did-not-run | 0 / 0 / 0 / 0 | **0 / 0 / 0 / 0** | 0 |
| exit code | 0 | **0** | — |
| wall clock | 645064 ms (10.8 min) | **621174 ms (10.4 min)** | **−23890 ms** |
| preflight | OK=1 FAILED=0 | **OK=1 FAILED=0** | — |

**The +15 is accounted for, item for item, and nothing is left over.** The extension adds 14 candidate
scans (7 surfaces × 2 themes) and declares the `auth-setup` project that supplies their session:
14 + 1 = 15. `REACH-14` measured the same +15 independently one plan earlier, so this is the second
observation of that arithmetic and not a re-derivation of it. There is no residue to explain away.

The wall clock did not merely fail to grow — it came in **0.4 min under** `BASE-GREEN`. That is inside the
suite's own run-to-run spread rather than a speed-up caused by this phase (the three `DET-RUNS` below sit
at 10.4 min each, so 10.4 min is simply this HEAD's figure), and it is recorded that way.

#### `DET-RUNS` — three consecutive runs, and what three green runs do and do not prove

| | run 1 (`147-e2e-det01`) | run 2 (`147-e2e-det02`) | run 3 (`147-e2e-det03`) |
|---|---|---|---|
| passed / failed / skipped / flaky / did-not-run | **150 / 0 / 0 / 0 / 0** | **150 / 0 / 0 / 0 / 0** | **150 / 0 / 0 / 0 / 0** |
| exit code | **0** | **0** | **0** |
| wall clock | 625595 ms (10.4 min) | 624062 ms (10.4 min) | 626196 ms (10.4 min) |
| database reset immediately before | ✅ `13:08:58Z` | ✅ `13:19:57Z` | ✅ `13:30:53Z` |
| preflight | OK=1 FAILED=0 | OK=1 FAILED=0 | OK=1 FAILED=0 |
| HEAD | `ff37a87fc` | `ff37a87fc` | `ff37a87fc` |
| started / ended (UTC) | 13:08:30 → 13:19:26 | 13:19:26 → 13:30:22 | 13:30:22 → 13:41:21 |

**Every run is preceded by its own `yarn db:reset`, and the row says so per run** — a run taken against
whatever state the previous run left behind would be measuring the dataset's residue, not the gate's
determinism. The three wall clocks agree to within **2.1 s over 10.4 minutes** (1.003×).

**No run in this row was replaced.** Under `CLAUDE.md` § *E2E Hard Rule* there is no known-flaky
exemption and a "did not run" counts as a failure; nothing was annotated, skipped or retried-until-green,
and the did-not-run count is reported separately from the skip count in all three (`summarize.mjs`
classifies an empty `results` array — the dependency-cascade shape — as `did-not-run`, never as a skip).

##### The fourteen added scans under contention, run by run

This is the measurement the row exists for. `147-SCOUT-INVENTORY.md` § 9 states its 42-scan zero was taken
at a **single worker with nothing else running**, and `utils/axeScan.ts`'s `awaitAnimationsSettled`
docblock records that scan-timing pressure has previously produced phantom `color-contrast` failures on
the voter side. Three full-suite runs are the first time the candidate scans meet that pressure.

| scan | run 1 | run 2 | run 3 | spread | max/min |
|---|---|---|---|---|---|
| `cand-home` | 1.1 s | 1.1 s | 0.8 s | 0.3 s | 1.36× |
| `cand-profile` | 2.7 s | 2.6 s | 2.3 s | 0.4 s | 1.16× |
| `cand-questions` | 3.7 s | 3.7 s | 3.7 s | 0.0 s | 1.00× |
| `cand-question` | 3.3 s | 3.4 s | 3.3 s | 0.1 s | 1.03× |
| `cand-preview` | 1.3 s | 1.3 s | 1.7 s | 0.4 s | 1.34× |
| `cand-settings` | 0.9 s | 1.0 s | 1.1 s | 0.3 s | 1.34× |
| `cand-nav-menu` | 3.4 s | 3.2 s | 3.5 s | 0.2 s | 1.07× |
| `cand-home (dark)` | 1.1 s | 0.9 s | 0.9 s | 0.2 s | 1.23× |
| `cand-profile (dark)` | 2.5 s | 2.4 s | 2.4 s | 0.2 s | 1.07× |
| `cand-questions (dark)` | 3.8 s | 3.6 s | 3.1 s | 0.7 s | 1.23× |
| `cand-question (dark)` | 3.4 s | 3.1 s | 3.1 s | 0.4 s | 1.11× |
| `cand-preview (dark)` | 1.5 s | 1.5 s | 1.8 s | 0.3 s | 1.19× |
| `cand-settings (dark)` | 1.0 s | 1.1 s | 1.1 s | 0.1 s | 1.07× |
| `cand-nav-menu (dark)` | 3.6 s | 3.6 s | 3.4 s | 0.3 s | 1.08× |
| **summed (14 scans)** | **33.4 s** | **32.6 s** | **32.1 s** | 1.3 s | **1.04×** |

**Nothing moved materially.** The largest absolute movement is **0.7 s** and the largest ratio **1.36×**,
and that ratio belongs to `cand-home` — a ~1 s scan, where a 0.3 s shift is scheduler noise rather than a
timing cliff. The summed figure varies by **4 %** across three runs, against the ~2.3× run-to-run spread
`147-03` measured for the voter `a11y-smoke` project on an unchanged tree. **The two flagged hazards did
not appear at all:** zero `color-contrast` violations and zero dark-theme-guard failures in any of the
three runs.

*(One cross-plan movement, stated: `REACH-14` recorded the same 14 scans summing **39.0 s**, against
32–33 s here. Different runs on different HEADs under different contention; the row does not attribute
the −6 s to anything, and nothing here rests on it.)*

##### What these three runs are worth, stated plainly

**Three green runs are evidence of a low failure frequency. They are not proof of absence.** A defect
that fires once in twenty runs would clear this gate with probability ≈ 0.86. What the gate rules out is
the shape that actually threatened this phase — a scan whose verdict depends on where it lands in the
schedule — and it rules it out at the standard this repository set for itself in Phase 136, no lower and
no higher.

#### `REV1-CLEAN` — both proofs, for every class, with nothing taken on trust

Range: **`4adf451ed..ff37a87fc`** — from the `146-09` close (the last commit before Phase 147's first,
`315d6d721`) through this task's HEAD. Every class below is asserted **twice**: a `git diff --exit-code`
over the range, *and* a blob-hash comparison at the range base, at HEAD and in the working tree.

| class | paths | `git diff --exit-code` over the range | blob-hash equality |
|---|---|---|---|
| axe injection site | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | exit **0** | `18c71976…` at base = HEAD = worktree ✅ |
| raw-key injection sites | `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/candidateApp.questions.json` + `…/common.json` (14 files) | exit **0** (all 15 injected paths in one invocation) | **14/14** equal at base = HEAD = worktree ✅ |
| served-application preflight | `tests/tests/support/preflight.ts` | exit **0** | `389197f038e3…` at base = HEAD = worktree ✅ |
| global setup | `tests/global-setup.ts` | exit **0** | `1c4a29d3326a…` at base = HEAD = worktree ✅ |
| manifest + lockfile | `package.json`, `yarn.lock` | exit **0** | `30a9c3774e2b…` / `b75c364ca876…` at base = HEAD = worktree ✅ |
| frozen blind matchers | `tests/tests/specs/candidate/candidate-journey.spec.ts`, `…/fixtures/candidate/candidateProfilePage.fixture.ts` | not diffed as injected paths — they were never injected into | `cacf8810e213…` / `d79db2b73af4…`, equal to § *Paths that must NEVER change* ✅ |

**Injected paths checked: 15. Differing: 0.**

**What the phase actually changed, over its whole range** — `git diff --name-only 4adf451ed..HEAD -- apps
packages tests .github package.json yarn.lock` returns exactly seven paths, and every one of them is
under `tests/`:

```
tests/README.md
tests/playwright.config.ts
tests/tests/fixtures/shared/forensicCapture.fixture.ts
tests/tests/specs/a11y/a11y-smoke.spec.ts
tests/tests/specs/a11y/candidate-a11y.spec.ts
tests/tests/utils/axeScan.ts
tests/tests/utils/rawKeyScan.ts
```

**Nothing under `apps/` or `packages/` changed at all.** The phase's six injections were all into product
files, and not one of them survives; the only surviving bytes are test-side. That is the strongest form
of the "zero surviving injected bytes" claim available, because it is asserted over the whole product
surface rather than over the injected paths alone.

**Why the preflight proof is the load-bearing one.** This phase's main risk is a differently-ordered run
(`147-02` exists because of it), and the way that risk would be *hidden* rather than solved is by
weakening the gate that proves a run talked to this checkout. `tests/tests/support/preflight.ts` and
`tests/global-setup.ts` are byte-identical across the entire phase, so no `E2E PREFLIGHT OK` recorded in
this register was produced by a gate this phase relaxed — the same structural proof `146-08` took in its
`PF1-UNTOUCHED` row.

**T-147-SC — no dependency was added.** `git diff --exit-code 4adf451ed..HEAD -- package.json yarn.lock`
exits 0. No `npm`/`yarn`/`pip`/`cargo` install ran at any point in this phase, so no package-legitimacy
checkpoint was required and none was skipped.

#### Every run in `147-04` was preflight-confirmed

A POSITIVE `E2E PREFLIGHT OK` was required in every case, never merely the absence of a failure.

| run dir | scope | expected verdict | preflight OK / FAILED | exit |
|---|---|---|---|---|
| `147-ax1-new/` | `candidate-a11y-scan` | **red** (catch half) | 1 / 0 | 1 |
| `147-ax1-new-postrevert/` | `candidate-a11y-scan` | green | 1 / 0 | 0 |
| `147-rk1-new/` | `candidate-a11y-scan` + `candidate-journey` | **red** (catch half) | 1 / 0 | 1 |
| `147-rk2-new/` | `candidate-a11y-scan` + `candidate-journey` | **red** (catch half) | 1 / 0 | 1 |
| `147-e2e1-suite/` | full default suite | green | 1 / 0 | 0 |
| `147-e2e-det01/` | full default suite | green | 1 / 0 | 0 |
| `147-e2e-det02/` | full default suite | green | 1 / 0 | 0 |
| `147-e2e-det03/` | full default suite | green | 1 / 0 | 0 |

**Eight runs, zero "did not run", zero flaky, zero skipped, and none replaced or abandoned.** The three
exit-1 runs are the catch halves, where a red IS the finding; the five exit-0 runs are the gates.

#### Static gates at the recorded HEAD

All four run at **`ff37a87fc`**, on the reverted tree:

| check | result |
|---|---|
| `yarn lint:check` | exit **0** — 22/22 tasks |
| `yarn format:check` | exit **0** — all matched files use Prettier code style |
| `yarn build` | exit **0** — 14/14 tasks |
| `yarn test:unit` | exit **0** — 25/25 tasks, **1832** tests passed |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | **empty** |

---

## Restoration blob hashes — the pre-injection state of every tracked path this phase injects into

Taken with `git hash-object` **at the moment of injection**, written into the injecting row **before**
the file is touched, and asserted against on revert. Filled by the task that injects.

| Path | `git hash-object` (clean) | recorded by |
|---|---|---|
| `apps/frontend/messages/da/candidateApp.questions.json` | `ea47aa480e7bf446d3daa15d813f1ed01e5aaded` | `147-01` T2 |
| `apps/frontend/messages/en/candidateApp.questions.json` | `898b47177575e02659a33a8f614648a2eb76e740` | `147-01` T2 |
| `apps/frontend/messages/et/candidateApp.questions.json` | `daed4ce17e8d2217a31ba1f023cb76b80dc90656` | `147-01` T2 |
| `apps/frontend/messages/fi/candidateApp.questions.json` | `1ba68acc28d6b6d82e26efa90a5e95e8fa7c4a32` | `147-01` T2 |
| `apps/frontend/messages/fr/candidateApp.questions.json` | `72a15a2063a997be813334863112a6728c6702c0` | `147-01` T2 |
| `apps/frontend/messages/lb/candidateApp.questions.json` | `0fcc615f2da49b085295cba6c67a603d95921ad5` | `147-01` T2 |
| `apps/frontend/messages/sv/candidateApp.questions.json` | `165b2c4a7dd0d68d7e90a7ae25d6c816ff8d575b` | `147-01` T2 |
| `apps/frontend/messages/da/common.json` | `87169155004a08173b456e137d9104a984b73fb8` | `147-01` T2 |
| `apps/frontend/messages/en/common.json` | `2cb3a6093b376cf54c59c9a05a90201c5b74b9a0` | `147-01` T2 |
| `apps/frontend/messages/et/common.json` | `e4e611021b4033bd25f15bf4594c83554ceff0c0` | `147-01` T2 |
| `apps/frontend/messages/fi/common.json` | `766fc465c324d1dda1d45da767c21fa91fa03e94` | `147-01` T2 |
| `apps/frontend/messages/fr/common.json` | `eb0fe933aa04c230afa574e4a023f01ecbcff194` | `147-01` T2 |
| `apps/frontend/messages/lb/common.json` | `41dedced3aead37112151409007d4fb1cb7da1c9` | `147-01` T2 |
| `apps/frontend/messages/sv/common.json` | `30641b994a2104782866ddeb0355870cb22fac1d` | `147-01` T2 |
| `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | `18c71976e3d57208607f0010b02fe7926b59dc66` | `147-01` T2 (taken with the others; injected by T3) |

### Injected-state blob hashes — what `147-04` must reproduce

**These are the load-bearing half of the pairing.** `147-04` re-applies these exact injections and proves
instrument identity by comparing against the values here, not against the clean ones. Recorded at the
moment each injection was live, before its revert.

| Path | `git hash-object` (INJECTED) | row |
|---|---|---|
| `apps/frontend/messages/da/candidateApp.questions.json` | `5de8589925ebaec5d9350508d80ba50d768b64b0` | `RK1-OLD` |
| `apps/frontend/messages/en/candidateApp.questions.json` | `3c0d1304c1b27baa9d6e416e24beb708935cfa42` | `RK1-OLD` |
| `apps/frontend/messages/et/candidateApp.questions.json` | `3cc4df1d952254e49a4bdd8cb06236cfd9d3bb8c` | `RK1-OLD` |
| `apps/frontend/messages/fi/candidateApp.questions.json` | `da407009ec78da766e5cc98664275658aaed995d` | `RK1-OLD` |
| `apps/frontend/messages/fr/candidateApp.questions.json` | `b155c15e0374aeb10ad09cb03c18a362310992ac` | `RK1-OLD` |
| `apps/frontend/messages/lb/candidateApp.questions.json` | `1d3355e3fc5708cb5f7e98acc3c02167d774f688` | `RK1-OLD` |
| `apps/frontend/messages/sv/candidateApp.questions.json` | `e8cdd6904d02c39177a41d1fe967bc4d15a69fcb` | `RK1-OLD` |
| `apps/frontend/messages/da/common.json` | `672a4a47d95cde9f62187c90382f2c16c20e7895` | `RK2-OLD` |
| `apps/frontend/messages/en/common.json` | `99a108e01c2d6f18bf6fec7687fb759d1aa4f5df` | `RK2-OLD` |
| `apps/frontend/messages/et/common.json` | `cb2eb998d792201abd4082e076e4967667980827` | `RK2-OLD` |
| `apps/frontend/messages/fi/common.json` | `661692fe19a912369ce7d03e14306b78d8106f72` | `RK2-OLD` |
| `apps/frontend/messages/fr/common.json` | `4edb244f1152d8655b6be4165987ea0d9d251d59` | `RK2-OLD` |
| `apps/frontend/messages/lb/common.json` | `71e7bfe32a640d73b71bca0134d419bfe875c55c` | `RK2-OLD` |
| `apps/frontend/messages/sv/common.json` | `17b7abcaf8a11879f8bf4d09c9c848f510b91bc0` | `RK2-OLD` |
| `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | `ca43e76a2610155a29c16ecb16c5ab846100687e` | `AX1-OLD` |

**The injection is reproducible from its description alone**, so a hash mismatch in `147-04` is
diagnosable rather than merely alarming:

- **RK1 / RK2** — delete the single line matching `^    "editAnswer": ` (RK1) or `^    "required": `
  (RK2) from the named file in **each of the seven locale directories** under
  `apps/frontend/messages/`, and **nowhere else**.
- **AX1** — insert, as the first child of the `{:else}` branch of
  `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (immediately before
  `{@render children?.()}`), a 6-line comment plus the single line
  `<img src="/favicon.png" width="24" height="24" data-testid="ax1-old-injection" />`.
  The exact injected text is recoverable from this plan's commit range; the `ca43e76a…` hash is what
  `147-04` must reproduce. **Note the hash covers the comment as well as the element**, so `147-04`
  must re-apply the comment verbatim or record its own injected-state hash instead.

**⚠ This table records the PRE-INJECTION state as measured at each injection's own HEAD.** Any injection
made **after** a behaviour-changing commit has touched one of these paths — `147-03` changes the suite
configuration, and `147-04` re-injects on top of it — must record **its own** restore target at its own
HEAD and restore against that, never against a stale value here. Restoring against a stale hash would
silently revert the change the injection sits on top of.

### Paths that must NEVER change in this phase

Recorded here for the opposite reason to the rows above. ROADMAP criterion 3 is explicit that patching
the two blind matchers in place does **not** satisfy it — the route-family extension is the fix, and both
sites must stay exactly as they are so `147-04` can re-run the identical control against them.

| Path | why it is frozen | `git hash-object` at register creation |
|---|---|---|
| `tests/tests/specs/candidate/candidate-journey.spec.ts` | carries the `:924` blind matcher | `cacf8810e2130543cd1d9981321589db083fba54` |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts` | carries the `:179` blind matcher | `d79db2b73af402f85854818beacbf3775fca2916` |

Both re-verified byte-identical at the close of `147-01` T2, **after** both injections and both reverts.

*(These two cells are filled by `147-01` T2 alongside its injections and are outside the 78-cell count,
which covers the register table only.)*

---

## Gates

| Gate | Requirement | Owner | Status |
|---|---|---|---|
| Cardinal E2E | full default suite 0 failed / 0 skipped / 0 flaky / 0 did-not-run | `147-01` (`BASE-GREEN`), `147-04` (`E2E1-SUITE`) | `147-01` half **MET** — 135/0/0/0/0 twice (`BASE-GREEN`, `AX1-OLD`). `147-04` half **MET** — 150/0/0/0/0 **four times** on one HEAD (`E2E1-SUITE` + the three `DET-RUNS`), each from a reset database, each preflight-confirmed, with the candidate scans blocking |
| Preflight-confirmed | every run's `stdout.log` carries `E2E PREFLIGHT OK` and zero `E2E PREFLIGHT FAILED` | every run | `147-01` **MET** — all 5 runs at OK=1, FAILED=0 (see § below). `147-04` **MET** — all 8 runs at OK=1, FAILED=0 (see § *Every run in `147-04` was preflight-confirmed*) |
| Zero surviving bytes | `147-01` leaves the tree byte-identical; `147-03` is the first plan permitted a product byte | `147-01`, `147-04` (`REV1-CLEAN`) | `147-01` **MET** — 3 injections, 3 reverts, each proven twice; `git status --porcelain` empty at plan close. `147-04` **MET** via `REV1-CLEAN` — 3 further injections, 3 further reverts, and all **15** injected paths proven byte-identical across `4adf451ed..ff37a87fc` by range diff AND blob hash. *(**Owner corrected 2026-08-27 by `147-05`, from `147-05` to `147-04`.** This cell read `147-05` from the file's creation while § *The corpus* row 13 and § *Completeness* both assigned `REV1-CLEAN` to `147-04` — a three-way inconsistency present since `147-01` wrote both tables. **The Gates table was the wrong one**, on three counts: the corpus is this register's declared authority over its own row set, § *Completeness* independently counts `REV1-CLEAN` among the six rows `147-04` filled, and `147-04` is in fact the plan that took the measurement. `147-04` recorded the discrepancy in place rather than silently rewriting it and handed it to `147-05`, which owns record corrections; this is that correction.)* |
| Lint + format | `yarn lint:check` and `yarn format:check` pass | every plan | `147-01` **MET** (run at plan close, on the reverted tree). `147-04` **MET** at `ff37a87fc`, together with `yarn build` and `yarn test:unit` (1832 tests) |

### Every run in `147-01` was preflight-confirmed

A POSITIVE `E2E PREFLIGHT OK` was required, never merely the absence of a failure — an absence is also
what a run that never reached the preflight produces. `run-suite.sh` reads both literals out of
`tests/tests/support/preflight.ts` itself, so the count cannot drift from a rename.

| run dir | scope | preflight OK / FAILED | exit |
|---|---|---|---|
| `147-base-green/` | full default suite | 1 / 0 | 0 |
| `147-rk1-old/` | `candidate-journey` | 1 / 0 | 0 |
| `147-rk2-old/` | `candidate-journey` | 1 / 0 | 0 |
| `147-ax1-old/` | full default suite | 1 / 0 | 0 |
| `147-ax1-postrevert/` | `candidate-journey` | 1 / 0 | 0 |

**Five runs, zero "did not run", zero flaky, zero skipped.** No run in this plan was retried, abandoned
or replaced.

---

## Completeness

**Corpus: 13 rows.** The arithmetic, asserted about this file by this file:

| class | rows | IDs |
|---|---|---|
| filled by `147-01` | 4 | `BASE-GREEN`, `RK1-OLD`, `RK2-OLD`, `AX1-OLD` |
| filled by `147-02` | 2 | `ORD-OBSERVED`, `ORD-PERTURB` |
| filled by `147-03` | 1 | `REACH-14` |
| filled by `147-04` | 6 | `AX1-NEW`, `RK1-NEW`, `RK2-NEW`, `E2E1-SUITE`, `DET-RUNS`, `REV1-CLEAN` |
| **total** | **13** | — |

4 + 2 + 1 + 6 = **13**. ✅

**Unfilled measurement cells: 13 × 6 = 78 at creation.** Running count, decremented by each plan as it
clears only its own rows:

| after | rows cleared | cells cleared | `TBD-147` remaining |
|---|---|---|---|
| creation (`147-01` T1) | 0 | 0 | **78** |
| `147-01` T2 | 3 (`BASE-GREEN`, `RK1-OLD`, `RK2-OLD`) | 18 | **60** |
| `147-01` T3 | 1 (`AX1-OLD`) | 6 | **54** |
| `147-02` | 2 (`ORD-OBSERVED`, `ORD-PERTURB`) | 12 | **42** |
| `147-03` | 1 (`REACH-14`) | 6 | **36** |
| `147-04` | 6 (`AX1-NEW`, `RK1-NEW`, `RK2-NEW`, `E2E1-SUITE`, `DET-RUNS`, `REV1-CLEAN`) | 36 | **0** |

18 + 6 + 12 + 6 + 36 = **78**, and 78 − 78 = **0**. ✅ **The register carries no unfilled measurement
cell.** Every one of the thirteen rows was filled from a run whose directory it names, at a HEAD it
records.

**How that zero is counted, exactly.** The count is the ANCHORED one this file defined at creation — the
`^| \`ID\` ` pattern, which selects the thirteen register rows and nothing else:

```
grep -E '^\| `(BASE-GREEN|RK1-OLD|RK2-OLD|AX1-OLD|ORD-OBSERVED|ORD-PERTURB|REACH-14|AX1-NEW|RK1-NEW|RK2-NEW|E2E1-SUITE|DET-RUNS|REV1-CLEAN)` ' \
  147-NEGATIVE-CONTROL.md | grep -o 'TBD-147' | wc -l
```

→ **0**, with the same pattern under `grep -c` still returning **13**.

An unanchored `grep -o 'TBD-147' | wc -l` over the whole file returns **8**, and every one of the eight is
a **prose reference to the literal**, not a measurement cell: the four sentences that define the
placeholder convention (§ *header*, § *Register*, § *`ORD-PERTURB`*, § *Every cell must be filled from a
run that executed*), the two fenced examples of the count command (§ *Register* and immediately above),
the running-count table's own column heading, and this sentence. **None is a cell.**

They are deliberately not deleted. They are the definition of the convention the zero is a zero *of*, and
deleting a register's explanation of its own placeholder so that a naive `grep` returns zero would be
optimising the check at the expense of the document. The anchored count is the one this file has asserted
since creation, and it is the one that is zero.

### Every cell must be filled from a run that executed

A cell may be filled **only** with an observation made by a run in this phase whose directory is named in
the same row. It may **not** be filled from `147-SCOUT-INVENTORY.md`, from a prior session, from a
plan's prose, or by inference from another row. Under the E2E Hard Rule a run that did not execute is a
**failure**, and a cell whose run did not execute keeps its `TBD-147` and carries **no** outcome — never
a confirmed one.

### ⚠ In `147-01`, the passes are the findings

This register's `147-01` rows inverted-polarity by design, and a reader who forgets it will misread them:

- `RK1-OLD` and `RK2-OLD` are **expected to PASS with the key broken**. A failure there would be good
  news about the suite and bad news about the roadmap's premise — it would make criterion 3's blindness
  claim false and force a re-scoping.
- `AX1-OLD` is **expected to be a green full suite with a real WCAG violation live in the product**.
  **That green is the defect.** It is not a successful run.
- `BASE-GREEN` is the only `147-01` row where green means green.

---

## Residue

**Written 2026-08-27 by `147-05` at HEAD `fce234ac3`. Nothing below is closed by this phase; each item
is named with its reason and, where one exists, the todo that carries it.** The point of this section
is that a phase whose headline is a **green gate on already-green surfaces** can absorb almost
anything into that green. Everything this phase carried rather than closed is therefore listed here
and filed where someone can act on it — not mentioned once in a summary nothing later reads.

### A. Deliberately not done — the two named matchers stay blind

| item | why it was NOT done | filed as |
|---|---|---|
| `candidate-journey.spec.ts:924` — `toHaveText(/edit/i)`, satisfied by the raw key `candidateApp.questions.editAnswer` | **By design.** ROADMAP criterion 3 says in terms that *"patching those two matchers in place does **not** satisfy this: the route-family extension is the fix."* Rows `RK1-OLD` (blind) and `RK1-NEW` (the scan names the key while the matcher passes **in the same invocation**) are the measurement that says the class, not the site, was the right unit | recorded in `2026-08-27-147-soft-required-badge-assertion-left-in-place.md` § *Related* |
| `candidateProfilePage.fixture.ts:179` — `expect.soft(...).toContainText(/required/i)`, **doubly weak** (the regex matches the raw key AND the assertion is soft) | Same reason. Additionally measured as soft, so even a genuine miss would not fail fast. The scan proves the key is not rendering raw; it does not make this assertion assert what its author meant, which is a separate defect | `.planning/todos/pending/2026-08-27-147-soft-required-badge-assertion-left-in-place.md` |

**⚠ The phase closes the raw-key CLASS on the candidate surfaces via the scan. It does not claim to
have repaired either site.** A later phase that reads "the matchers were fixed" has read this record
wrongly, and that misreading is the specific false premise this section exists to prevent.

### B. Reachable but never scanned — states of routes that WERE scanned

Six states from `147-SCOUT-INVENTORY.md` § 6. **Unknowns, not zeros.** Filed as five todos, split by
lever rather than by count, so each can be acted on without reading the others:

| state(s) | lever | filed as |
|---|---|---|
| ToU gate modal (`terms-of-use-submit`) | **No dataset change needed** — `e2e/base` already ships `test-e2e-base-ca-aa-hidden` with `terms_of_use_accepted` deliberately absent (`base.ts:1073`, comment at `:1076`); it is a session choice | `2026-08-27-147-tou-gate-modal-unscanned.md` |
| `/candidate/questions` empty-state intro **+** logout confirmation modal | One lever, hence one todo: a candidate with no/incomplete answers (measured: `answersByExternalId: {}` → **0 hits across 31 declarations**) | `2026-08-27-147-empty-answer-candidate-states-unscanned.md` |
| `answersLocked` warning (3 routes) | An `app_settings` scenario owned by the `perm-*` chain — and taking it inside `candidate-a11y-scan` would move the project out of Playwright phase 3 and back inside the two ordering hazards `147-02` measured its way out of | `2026-08-27-147-answers-locked-warning-unscanned.md` |
| `PreventNavigation` unsaved-changes modal (profile, question) | An extra `settle` step; no dataset, identity or ordering change | `2026-08-27-147-prevent-navigation-modal-unscanned.md` |
| portrait-upload error (`profile-image-error`) **+** preview `notFound` error | Failure paths — recorded by the scout as out of scope for a *route-family* scan, so the exclusion is a decision rather than an oversight | `2026-08-27-147-candidate-error-paths-unscanned.md` |

### C. Out of the family — candidate routes never scanned at all

**Twelve** leaf routes outside `(protected)`, re-derived from disk at this phase's close by
`find apps/frontend/src/routes/candidate -name '+page.svelte' | grep -v '(protected)'`. Their a11y
state is unknown for exactly the reason the `(protected)` ones were. They fall outside **CSCAN-01's
wording**, not outside the coverage hole — and **none of them needs authentication**, so they do not
need the machinery this phase built.

> **Count corrected, not propagated.** `147-SCOUT-INVENTORY.md` § 6 says *"11 further unscanned
> candidate surfaces"* while **naming twelve**; the named set is identical to the measured set. The
> enumeration was right and the prose count was an arithmetic slip. Recorded here because a wrong
> count is precisely the shape of premise `147-05` spent its first task retiring.

Filed as `2026-08-27-147-candidate-routes-outside-protected-unscanned.md`.

### D. Accepted rather than solved

| item | state at close | filed as |
|---|---|---|
| **Criterion 5's reporting shape.** `147-02` decision (B) reports the raw-key verdict via `expect.soft` inside the shared scan body. It satisfies the criterion's **purpose** (an independent, non-subsumed verdict — execution independence was already true per scout § C) but **not** the literal *"reported as its own **test**"*. `147-03` re-surfaced it rather than letting the green close it. Alternative priced at **≤ +138 s** | Accepted, with the cost measured | `2026-08-27-147-rawkey-verdict-not-its-own-test.md` |
| **`AX1-NEW`'s source-blob pairing could not be taken as the register designed it.** `147-01` promised `AX1-OLD`'s injected text was recoverable from its commit range; that plan committed **zero** product bytes by design, so the blob was never in the object database, and the Svelte compiler strips the 6-line comment the hash covers. `147-04` took the register's own permitted alternative and carried identity at four substitute equalities (equal *clean* hash, byte-identical element line, identical compiled location `191:2`, byte-identical served DOM node), flagged `human_judgment: true` rather than presented as a machine check | **A record-quality defect in `147-01`, not a measurement defect.** Disclosed, not smoothed over | `2026-08-27-147-register-convention-record-injection-text-verbatim.md` |
| **Disk headroom** — ~23 GiB and falling ~0.5–1 GiB per full-suite `db:reset` cycle; **`147-02` lost two runs to ENOSPC** and they are disclosed rather than deleted. `tests/e2e-runs/` is **not** the sink (1.8–1.9 MB per run) and must not be reclaimed — the registers cite those directories | Environment condition, carried | `2026-08-27-147-full-suite-disk-headroom-falling.md` |
| **Plan-supplied `<verify>` scripts that measure a proxy for the claim** — `147-03`, `147-04` and `147-05` EACH found their own plan's script wrong: a `/cand-/` title filter that also matched a perm test; a row selector that matched the corpus summary table instead of the register row (and so **failed on a correct implementation**); a `TBD-147` count that included the prose defining the placeholder; and, in `147-05`, a bare `/161/` substring assertion that would **pass without the claim being true**. Each was corrected by the executing plan and recorded as a per-plan deviation; nothing aggregated them, which is how the same defect reached three plans running | **Filed at the human's prompting at `147-05`'s Task-3 checkpoint.** A defect in how plans author verification, not three coincidences | `2026-08-27-147-plan-supplied-verify-scripts-measure-a-proxy.md` |
| **Three cross-instrument counts that do not coincide** — `RK1-OLD` counted 15 raw-key occurrences in a trace, the scout counted 22 card actions carrying the label, `RK1-NEW`'s scan reports 11 visible sightings. Three instruments, three datasets | **Stated rather than reconciled.** Every row asserts the key's presence *by name*, which all three agree on; nothing in this register rests on the counts matching | no todo — nothing is claimed that the divergence threatens |

### E. Resolved by this plan, recorded so the trail survives

- **The `REV1-CLEAN` owner discrepancy.** § *Gates* read `147-05` while § *The corpus* row 13 and
  § *Completeness* both read `147-04` — a three-way inconsistency present since `147-01` wrote both
  tables. **The Gates table was the wrong one** and is corrected above; the corpus is this register's
  declared authority over its own row set, Completeness independently counts `REV1-CLEAN` among
  `147-04`'s six, and `147-04` is the plan that actually took the measurement. `147-04` recorded it
  in place rather than rewriting it silently.
- **CSCAN-03's false opening clause, corrected at the Task-3 checkpoint.** The human read all three
  locations of the two-matcher claim and judged the *content* of the correction right but its
  *placement* wrong: `.planning/REQUIREMENTS.md` CSCAN-03 opened with the original requirement text
  — *"the two named blind sites … **now fail** when their key renders raw"* — which this phase's own
  measurement falsifies, while the ⚠ caveat correcting it sat ten lines later, after the evidence.
  **Requirement lists are skimmed by their first clause, and `.planning/REQUIREMENTS.md` is a live,
  forward-read document** — unlike `v2.14-REQUIREMENTS.md`, an archive where preserving the original
  wording verbatim and correcting beneath it is the right convention. Leaving it there made the false
  clause the first and possibly only thing a later phase would read, which is exactly the
  false-premise propagation § A exists to prevent. **Applied:** the clause is struck inline
  (`~~…~~`) with the falsification attached directly to it, so it cannot be read in isolation; the
  original wording is struck rather than deleted, so it stays recoverable. The other two locations
  were judged to read clearly as-is and are unchanged.
- **The dev-server lifecycle**, closed at table row 17 — stopped by the helper's own `stop` verb,
  port confirmed free twice (helper `status` verdict `NOT RUNNING` exit 2, and `lsof` with no
  listener).
- **The database is left in its `db:reset` state**, which is what every gate in this register
  required. `yarn db:seed:default` restores the Finnish demo data — and re-reddens the suite, since
  the scout measured the `default` template producing 7 failed / 79 did-not-run on an unchanged
  tree. That is the standing trade, not a regression.

### F. The four standing limits of the zero — which this phase moved, and which it did not

`147-SCOUT-INVENTORY.md` § 9 bounded its own 42-scan zero on four axes. The phase's 14 blocking scans
inherit every one of them:

| limit | moved by this phase? | state at close |
|---|---|---|
| **Environment** — macOS, local Chromium; CI runs `ubuntu` (`.github/workflows/main.yaml:289`) | **NO** | Colour values are computed rather than rendered so contrast should transfer, but **layout-dependent rules have still never been observed on Linux.** No run in this phase was taken on CI |
| **Contention** — scout measured at `--workers=1` with nothing else running | **PARTLY — the one axis this phase moved.** `DET-RUNS` + `E2E1-SUITE` put the scans through **four** consecutive full default suites on one HEAD, each from a reset database, all 150/0 | **A bound, not an absence.** Three green runs clear a 1-in-20 defect with p ≈ 0.86. `axeScan.ts`'s own docblock records scan-timing pressure previously producing phantom `color-contrast` failures on the voter side. Filed: `2026-08-27-147-scan-determinism-is-a-bound-not-an-absence.md` |
| **One identity, one dataset** — `CA-AA-1` on `e2e/base` | **NO** | The six states in § B above are exactly what this limit excludes; all six are filed |
| **One viewport** — 1280×720 (`devices['Desktop Chrome']`), matching the voter family | **NO** | Mobile candidate layouts are unscanned — as are mobile voter ones, so this is a family-wide limit rather than a candidate-specific one |

---

## Completeness — re-asserted at phase close

**Re-checked 2026-08-27 by `147-05`, after every row was filled and after this § *Residue* was
written**, using the anchored pattern this file has specified since creation:

| assertion | command | result |
|---|---|---|
| corpus size | `grep -cE '^\| \`(BASE-GREEN\|…\|REV1-CLEAN)\` '` | **13 rows** |
| unfilled measurement cells | same pattern, `\| grep -o 'TBD-147' \| wc -l` | **0** |

13 rows × 6 cells = 78 at creation; 18 + 6 + 12 + 6 + 36 = 78 cleared; 78 − 78 = **0**. ✅ The
arithmetic in § *Completeness* above is unchanged by this plan, which filled **no** measurement cell
— `147-05` corrects records and files gaps; it took no measurement of its own and added no row.

**The corpus is closed at thirteen.** No row may be added to this register after this assertion
without also amending this section, which is what stops it being quietly extended later.

### The HEAD every gate was green at

| gate | HEAD | verdict |
|---|---|---|
| row `BASE-GREEN` (full default suite, un-injected) | `4a8cd6c1e` | 135/0/0/0/0, exit 0 |
| row `RK1-OLD` / `RK2-OLD` (blind halves) | `4a8cd6c1e` | matcher PASS with the key rendering raw — the finding |
| row `AX1-OLD` (blind half) | `07bb87587` | 135/0/0/0/0 with a live WCAG violation — **the green IS the defect** |
| row `ORD-OBSERVED` | `325db69cd` | 89/89 phase matches, 0 mismatches |
| row `ORD-PERTURB` | `6e65a5d2f` | 136/0/0/0/0, exit 0 — **does not perturb** |
| row `REACH-14` | `59dbb971a` + that task's working tree | project 17/17; full suite 150/0/0/0/0, exit 0 |
| row `AX1-NEW` (catch half) | `9d3193dd5` (tree carrying the injection) | 14 failed / 3 passed, exit 1 — caught by rule ID and selector. Post-revert 17/17, exit 0 |
| row `RK1-NEW` / `RK2-NEW` (catch halves) | `a619a1c2c` (tree carrying the injection) | 2 failed / 18 passed each, exit 1 — scan names the key **while its matcher passes in the same invocation** |
| **row `E2E1-SUITE` — the cardinal gate** | **`ff37a87fc`** | **150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**, exit 0, 10.4 min |
| **row `DET-RUNS` ×3** | **`ff37a87fc`** — same HEAD as `E2E1-SUITE` | 150/0 three more times, exit 0 each, each from its own `yarn db:reset` |
| row `REV1-CLEAN` | `ff37a87fc`, range base `4adf451ed` | 15/15 injected paths byte-identical by range diff **and** blob hash; 7 tracked files changed in the whole phase, every one under `tests/` |
| Static gates (`lint:check`, `format:check`, `build` 14/14, `test:unit` 1832) | **`ff37a87fc`** | all exit 0 |

*(Left column reads `row \`ID\`` rather than `` `ID` `` deliberately — the same precaution `147-01` took
in its revert table and `147-04` in its. A bare backticked ID at the start of a table row is counted as
a register row by this file's own anchored `^| \`ID\` ` pattern, and this table would otherwise push the
count from 13 to 22.)*

**Every suite gate in this phase is green at `ff37a87fc`.** Commits after it (`b53a2839c` onward,
including `147-05`'s own) change **`.planning/` bytes only** — independently confirmed for `147-04`
by a `git diff` over the phase range excluding `.planning`, which is empty, and asserted for `147-05`
by `git diff --exit-code -- apps packages tests .github package.json yarn.lock` at each of its
commits.
