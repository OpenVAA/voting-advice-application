# Phase 146 — Negative-Control Register: the visual gate's blindness measured before it is closed

**Twenty-nine rows, five instruments, one pinned container — and not one borrowed observation
anywhere in the register.** Every blind half this phase owes is measured **inside this phase**, on the
tree that still carries the old configuration, in a commit that **precedes** the commit that changes
behaviour. A row whose run did not execute keeps its placeholder cells and carries **no** outcome —
never a confirmed one — because under `CLAUDE.md` § E2E Hard Rule a measurement that did not run
counts as a **failure, not a pass**.

**The placeholder word in this register is the single lower-case word `pending`.** It is the only
legal value for a measurement cell whose run has not happened yet, and it is what every one of the
last five cells of every row reads at creation. Filling a cell means replacing that word with an
observation **this phase** made, together with the log path and the HEAD it was taken at.

- **Phase:** 146 (visual-gate-self-hosted-inter-height-independent-sensitivity)
- **Requirements:** **VGATE-01 … VGATE-06**
- **Opened by:** `146-01-PLAN.md` (wave 1, Task 3). **Every row is created here, before the phase's
  first measurement, and before the phase's first product byte.** `146-01` writes zero product bytes;
  the first product byte lands in `146-04`. No row is filled by this plan — `146-01` runs no
  container, no Playwright and no `curl`.
- **Corpus:** exactly **29 rows**, asserted in this file's own § Completeness table. The sibling
  ledger `146-VISUAL-NOISE-LEDGER.md` asserts its **own** corpus (40 matrix cells + 1 max row + 1
  font-delta section) about itself; **neither file's corpus assertion covers the other's.**
- **Protocol source:** `.planning/REQUIREMENTS.md:7-13` — the milestone's standing acceptance rule
  (*prove the guard fails before claiming it guards*), discharged here in the four D-07 halves plus
  the D-06 control, the two D-11 egress controls, the D-14 observation and the D-17 determinism runs.
  The HYGIENE-LOOP itself descends from `139-VERDICTS.md` § 3.1 through `143-01-PLAN.md`,
  `144-01-PLAN.md` and `145-01-PLAN.md`.
- **Baseline for OLD halves:**
  `.planning/milestones/v2.14-phases/136-*/136-VISUAL-DISCRIMINATION-EVIDENCE.md` is cited for
  **comparability of the injection only** — the same `MatchScore.svelte:30` `text-lg` → `text-2xl`
  edit, the same image, the same digest. It is **never** a source of any cell's value here. **No cell
  in this register may be filled from a document, from a prior session, from `146-RESEARCH.md`'s
  measurement tables, or from `136-VISUAL-DISCRIMINATION-EVIDENCE.md`'s.** Every row carries its own
  log path and the HEAD its own half was measured at.
- **Run date:** 2026-08-25 (ledger opened).
- **HEAD at ledger creation:** `0c3a26ab6` — branch `feat-gsd-roadmap`. **Rows measured before and
  after the cap and the font land legitimately carry different HEADs**, because the
  behaviour-changing commits (`146-04`, `146-05`) sit *between* the two halves of every pair — the
  142.1 D-20 precedent, inherited through 143, 144 and 145. Each row records the HEAD its own half was
  measured at.
- **Host dev server — one process, started once, and it must stay up.** The three host-side
  prerequisites were performed **in that order** (`146-02` Task 1), and the resulting dev server is
  the single server every in-container run in this phase talks to:
  - **Port:** `5173` (the preferred port; `tests/tests/utils/supabaseAdminClient.ts:585,628` hardcode
    it by string substitution, so no `FRONTEND_PORT` override is in play).
  - **PID:** `41925` — the `vite` process itself; its `yarn` wrapper is `41918`. Vite v6.4.1.
  - **Start timestamp:** `2026-08-25 22:38:56` local time.
  - **HEAD at build time:** `b2645370d`.
  - **Bind:** `lsof -nP -iTCP:5173 -sTCP:LISTEN` → `node 41925 … TCP *:5173 (LISTEN)` — a **wildcard**
    bind, not `127.0.0.1:5173`. This is the one check that distinguishes a correct
    `yarn workspace @openvaa/frontend dev --host 0.0.0.0` from the `yarn dev --host 0.0.0.0` form
    that passes the flag to `concurrently` and silently leaves the server on loopback (research
    N-10); a loopback bind is unreachable from the container and fails as exit 7.
  - **Sequence, in order:** `yarn build` (full, not filtered — 14/14 turbo tasks successful, at HEAD
    `b2645370d`; `@openvaa/app-shared` is ESM-only and the frontend reads its built `dist/`, N-7),
    then `yarn db:reset` followed by `yarn db:seed --template e2e/base` (**143** rows — 30 candidates,
    61 nominations, 26 questions, 8 question categories, 5 organizations, 2 alliances, 2 elections,
    6 constituencies, 2 constituency groups, 1 app_settings — plus **30** portraits), then
    `yarn workspace @openvaa/frontend dev --host 0.0.0.0`.
  - **Served-app sanity at start, all HTTP 200:** `http://localhost:5173/`,
    `http://192.168.0.249:5173/`, and — the clause the preflight actually tests —
    `http://localhost:5173/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte`.
  - **This process must remain running and un-restarted for the remainder of the phase**, and **any
    restart is itself recorded here**, because `146-07`'s D-16 run-4 anomaly attempts are only valid
    while the server has been **continuously** up. A server silently restarted between plans would
    void that control without leaving a trace.
  - **Restart history — appended, never overwritten.** Identity changes are recorded in full below
    under § *The host dev server changed PID between `146-02` and `146-03`*, § *The `146-05` restart —
    planned, and D-16's continuity requirement is void as chartered* and § *The `146-06` restarts*:
    - `41925` → `82314` (between `146-02` and `146-03`, retro-filled by `146-04`).
    - `82314` → **`98287`** (`146-05` Task 2, stopped `2026-08-26 15:37:32`, started
      `2026-08-26 15:37:44` local, `vite dev --host 0.0.0.0`, wildcard bind `*:5173`). **Planned and
      required** — the font default only reaches runtime through a rebuilt `dist/` and a restarted
      server.
    - `98287` → `3733` → **`4037`** (`146-05` Task 3, the two restarts the guard's deliberate-fail
      demonstration required: `3733` served `font.url: '/fonts/inter-alt.css'`, `4037` serves the
      committed `/fonts/inter.css` again). **`4037`, started `2026-08-26 15:57:13`**, was built at the
      committed tree (`yarn build`, 14/14 successful, `dist/index.js` carrying `/fonts/inter.css` and
      zero `inter-alt`). It served **all four** of `F1-DELTA-PRE`'s runs.
    - `4037` → `93764` → **`94791`** (`146-06` Task 2, the two restarts the `F2-BOGUS-RED` injection
      and its revert required — see § *The `146-06` restarts* below). `93764` (started
      `2026-08-26 16:47:19`) served `font.url: '/fonts/inter.csss'`; **`94791`, started
      `2026-08-26 16:49:35`, serves the committed `/fonts/inter.css` again and is the server the
      phase continues on** — wildcard bind `node 94791 … TCP *:5173 (LISTEN)`, port `5173`, no
      `FRONTEND_PORT` override, built at HEAD `073fefc72` with a clean tree.
    - `94791` → **`31124`** (`146-08` Task 1 — **planned and required**). The plan opens with a
      clean database and a fresh server so the phase's gate runs meet known state rather than nine
      plans' worth of accumulated session; `146-07-SUMMARY.md` closes the D-16 anomaly attempts, so
      the continuous-uptime constraint recorded above **lapsed with that plan** and no longer forbids
      a restart. `94791` was stopped in this session immediately before the rebuild, with port `5173`
      confirmed free (`lsof -nP -iTCP:5173 -sTCP:LISTEN` returned no listener) before `yarn build`
      began; the exact stop second was not captured. **`31124`, started `2026-08-26 21:08:32`**
      local — its `yarn` wrapper is `31121`, started `21:08:31`. Vite v6.4.1, port `5173`, **no
      `FRONTEND_PORT` override**, bind `node 31124 … TCP *:5173 (LISTEN)` — a **wildcard** bind with
      **exactly one** listener on the port. **Sequence, in order:** `yarn build` (full, not filtered
      — 14/14 turbo tasks successful, all 14 cached at HEAD `5bb95083e` on a clean tree, and
      `packages/app-shared/dist/index.js` carries `/fonts/inter.css` with **zero** `inter-alt`
      occurrences), then `yarn db:reset` followed by `yarn db:seed --template e2e/base` (**143**
      rows — 30 candidates, 61 nominations, 26 questions, 8 question categories, 5 organizations,
      2 alliances, 2 elections, 6 constituencies, 2 constituency groups, 1 app_settings — plus **30**
      portraits, seed `42`), then `yarn workspace @openvaa/frontend dev --host 0.0.0.0`.
      **Served-app sanity at start, all HTTP 200:** `http://localhost:5173/`,
      `http://localhost:5173/fonts/inter.css`, and — the clause the preflight actually tests —
      `http://localhost:5173/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte`.
      **HEAD at build time: `5bb95083e`.** This is the server every run in `146-08` talks to.
- **Machine — container provenance, not host provenance.** This phase's numbers are pixel counts, so
  the rasterisation environment is the measurement instrument and is recorded as such:
  - Image **RepoDigest**, read on this machine with
    `docker image inspect mcr.microsoft.com/playwright:v1.58.2-noble --format '{{.RepoDigests}}'` →
    `mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d`
    (image `Architecture` `amd64`, `Os` `linux`, size 2,390,436,754 B). Every run in this phase is
    invoked against that **digest**, never against the tag.
  - `--platform`: `linux/amd64`.
  - In-container `uname -m`: **`x86_64`** — read off `tests/e2e-runs/146-d14-observe/provenance.txt`,
    written by the D-14 observation run's own entrypoint (`146-02` Task 2), not restated from
    `146-RESEARCH.md`. `x86_64` under `--platform linux/amd64` on an arm64 host is Rosetta/QEMU
    emulation, and it is exactly the rasterisation environment every pixel count in this phase is
    measured in.
  - In-container `/etc/os-release` (first two lines): **`PRETTY_NAME="Ubuntu 24.04.3 LTS"`** and
    **`NAME="Ubuntu"`** — same file, same run.
  - In-container `node -v`: **`v24.13.0`** — same file, same run. (The **host** runs `v24.14.1`; the
    two differ, which is why the container's is the one recorded.)
  - **RepoDigest re-confirmed against the run that produced the three fields above:**
    `tests/e2e-runs/146-d14-observe/docker-argv.txt:19` is
    `mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d`
    — the digest, not the tag, so the provenance above belongs to the pinned image and to nothing else.
  - Host, for the record only (**no baseline is ever captured here**): macOS 26.5.1 (build 25F80),
    Darwin 25.5.0, arm64, Node v24.14.1, Docker 29.7.2. Per `.planning/REQUIREMENTS.md:15-17`,
    baselines are captured **only** in the pinned image under `--platform linux/amd64`; the host runs
    the wrapper and the final `yarn test:e2e` gate, and nothing else.
- Resolved `$TMPDIR`: `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T` — so every
  `${TMPDIR:-/tmp}/gsd-146/…` reference resolves under
  `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-146/`. Recorded for the same reason
  139, 142.1, 143, 144 and 145 recorded theirs: **a log path that cannot be resolved later is not
  evidence.**
- **Raw output is not committed.** Per root `.gitignore`'s `tests/e2e-runs/` stanza, every run's
  stdout, HTML report, traces and `results.json` live under `tests/e2e-runs/146-*` and are **never**
  committed; only the derived, reviewed table below is.

**Decisions discharged by this register:** D-06 (height-independence proved by a dedicated
non-baselined control), D-07 (the four halves of the reused v2.14 injection), D-11 (the egress block
made falsifiable by a `curl` control that must fail, run **before** the suite), D-12 (the permanent
request-listener guard, proved by its own RED/GREEN pair, plus the production-build trace), D-14 (the
identical-path mount, verified by observation rather than by reasoning), D-16 (the bounded, falsifiable
run-4 anomaly attempt), D-17 (six determinism runs), and the ledger-first ordering that **overrides
tracer-first** per `.planning/REQUIREMENTS.md:7-13`.

---

## Why this ledger exists — and what it does NOT claim

The gate this phase repairs is **already green and already blind**. At v2.14 close an injected
component-level regression measured **19,484 diff px** on `voter-results-desktop` and the baseline
**passed** — because `maxDiffPixelRatio: 0.01` over a 1280×3684 capture is a budget of 47,155.2 px,
and 19,484 is 41 % of it. The same injection produced 19,545 px on `voter-results-mobile` and
**failed** there, purely because that capture's own area is smaller. A budget that scales with page
height is a budget that a taller page silently relaxes. That is VGATE-01 and VGATE-02, and the claim
has to be **re-measured here**, in this container, at this HEAD — not cited from the v2.14 record.
Rows `B1-OLD` and `B2-OLD` are that measurement.

**⚠ `B1-OLD` is the row where a GREEN is the finding, not the health.** Its expected outcome token is
`**The green IS the finding, not the health.**` — the same token `145-NEGATIVE-CONTROL-LEDGER.md` uses
for its blindness halves. **A `B1-OLD` that comes back RED means the phase's premise is not
established**, and `146-03` must stop and diagnose rather than celebrate: either the injection did not
take effect, or the old budget is not what this register says it is, and both are findings that change
what the rest of the phase may claim.

**What this register does NOT claim — (a) anything about the preflight.** `tests/tests/support/preflight.ts`
and `tests/global-setup.ts` are the served-application integrity gate, and D-14 B — an env-var escape
hatch through it — was **rejected**. The mount path moves to satisfy the gate; the gate does not move
to accommodate the mount. Row `PF1-UNTOUCHED` is the measured form of that commitment: a
`git diff --exit-code` over both paths across this phase's full commit range, compared against the
blob hashes in § Restoration blob hashes below. Prose is not admissible for it.

**What this register does NOT claim — (b) "zero occurrences of `fonts.googleapis.com` in the build".**
`+layout.svelte:207-208` deliberately keeps the Google URL as the `??` fallback literal and
`:221-223` keep the preconnect literals in a branch that is dead for the new default. All three
survive into the bundle, **correctly**, because the documented customization point must keep working
for an operator who overrides `font.url` back to Google. A static grep of `apps/frontend/build/` will
therefore hit that host **forever** (research N-6). Row `PT1-PRODTRACE` claims **"zero third-party
font *requests* observed"**, which is a different and checkable claim, and the permanent guard is a
**request listener**, never a string scan.

**What this register does NOT claim — (c) that `settleFonts` catches a missing stylesheet.** Measured
in the pinned container: with **zero** `@font-face` rules present — exactly what an unreachable
`fonts.googleapis.com` produces — `document.fonts.check('1em Inter')` returns **`true`** (research
N-2). That docblock claim was never true. It is corrected in `146-09` as the **fifth** stale record
claim, and the blindness is closed by the D-12 guard rather than by pretending `settleFonts` closed it.

**What this register does NOT claim — (d) the CI runner half of the egress-blocked job.** CI triggers
on push/PR to `main`, and this branch is far ahead of it. Rows `EG1-CURL` / `EG2-SUITE` record the
block **as observed in the pinned container on this machine**, which is what criterion 4 asks for; a
claim about the GitHub runner would need a runner.

**What this register does NOT claim — (e) a cap value.** The cap does not exist while this file is
being written. It is derived in `146-03` from the 40 measured cells in `146-VISUAL-NOISE-LEDGER.md`
and lands in `146-04`. Any numeral in this file that looks like a budget is either a **recorded
baseline dimension** or a **D-05 constraint bound**, never a chosen cap.

---

## Precedent chain

**`146-NEGATIVE-CONTROL.md` → `145-NEGATIVE-CONTROL-LEDGER.md` → `144-NEGATIVE-CONTROL-LEDGER.md` →
`143-NEGATIVE-CONTROL-LEDGER.md` → `142.1-NEGATIVE-CONTROL-LEDGER.md` →
`142-NEGATIVE-CONTROL-LEDGER.md` → `141-ASSERT10-LEDGER.md` → `138-NEGATIVE-CONTROL.md` →
`137-NEGATIVE-CONTROL.md` → `136-VISUAL-DISCRIMINATION-EVIDENCE.md`.**

- **`145-NEGATIVE-CONTROL-LEDGER.md` is this register's template** for the header field set, the
  rows-first ordering rule, the stance language quoted at the top of this file, the nine-column
  register, the `pending` discipline with its arithmetic assertion, the byte-identity requirement on
  every GREEN half, and the `## Completeness` self-assertion. 145 took its own shape from 144, and 144
  from 143, where the rows-first rule first appeared.
- **`136-VISUAL-DISCRIMINATION-EVIDENCE.md` is the far end of the chain and the closest analog in
  subject matter** — it is where the 19,484 / 19,545 px numbers and the `candidate-preview` pair's
  0 px noise were recorded. It is cited for **injection comparability** and for nothing else.
- **`139-VERDICTS.md` § 3.1 is the protocol source** — the HYGIENE-LOOP (pre-gate clean `git status`,
  record HEAD, run, revert, post-gate clean `git status`) every measuring plan in this phase runs.

Rows are **not** appended to any earlier ledger. 145's corpus is "exactly 30 rows", 144's "exactly 37",
143's "exactly 19"; adding to any of them would break a count those documents assert about themselves.
This register asserts **29**.

---

## Restoration blob hashes — the pre-change state of every tracked path this phase edits

Taken with `git hash-object` at ledger creation, at HEAD `0c3a26ab6`, before any injection or product
change existed. Any row that restores one of these paths asserts against the value here.

| Path | `git hash-object` at ledger creation |
|---|---|
| `tests/playwright.config.ts` | `de1ae33ff7710898a43220056bb841f78ec23492` |
| `tests/tests/specs/visual/visual-regression.spec.ts` | `6070ffea52934315f85bce57d430635cb68b1220` |
| `packages/app-shared/src/settings/staticSettings.ts` | `d4d4f9b2f907899d6c24ae8db6be1002e55cbe41` |
| `apps/frontend/src/lib/components/matchScore/MatchScore.svelte` | `ec84b65bd0cca43acff9db6982a3cce6bc45597c` |
| `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-desktop.png` | `ea8316c5038d1ef9367fd20e9a910a7adec75959` |
| `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/voter-results-mobile.png` | `e42d1d753b1cdc8681a612e254fbbef316b36cec` |
| `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/candidate-preview-desktop.png` | `5b847d227fd0d881a00f2a67ead1e44d443a9496` |
| `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/candidate-preview-mobile.png` | `fc19205d9a7d7eaf35027cfd335100394bd5c1aa` |
| `tests/README.md` | `84129cdd7e98cf269b842d4d0b65737acd5e6126` |
| `.github/workflows/main.yaml` | `67f311c9975faba2adc4978ec04cf84a310a74e6` |
| `tests/tests/support/preflight.ts` | `389197f038e3b53a6836ea467444d6097e134429` |
| `tests/global-setup.ts` | `1c4a29d3326ae8c4a2573a0678fe84e6f3b40fab` |

**⚠ This table records the state at LEDGER CREATION, which is the PRE-CHANGE state. It is the correct
restore target only for an injection made at a tree where the listed path has not changed since
`0c3a26ab6`.** Any injection made **after** a behaviour-changing commit has touched one of these paths
— and `146-04` touches `tests/playwright.config.ts`, `146-05` touches `staticSettings.ts` and
`visual-regression.spec.ts`, `146-07` rewrites all four PNGs — must record **its own restore target**
(`git hash-object <path>` taken at the injection HEAD, written into the injecting row **before** the
file is touched) and restore against that, never against the value here. Restoring against a stale
creation-time hash would silently revert the change the injection sits on top of. `F2-BOGUS-RED` and
the `D16-A*` attempts are exactly such cases.

**The last two paths are in this table for the opposite reason to the others.** They are the ones that
must **never** change. `PF1-UNTOUCHED` compares against `389197f038e3b53a6836ea467444d6097e134429` and
`1c4a29d3326ae8c4a2573a0678fe84e6f3b40fab` at the `146-08` gate, over the phase's full commit range.

**Files this phase creates have no pre-change blob** and are tracked by `git status --porcelain`
instead of by a hash comparison: `tests/scripts/tcp-forward.mjs` and `tests/scripts/visual-container.sh`
(created by `146-01` Tasks 1 and 2, both **before** this table was taken), the four woff2 files plus
`inter.css`, `OFL.txt` and `README.md` under `apps/frontend/static/fonts/` (`146-05`), and the two
ledgers themselves.

---

## Register

Nine columns, in this order:
`Row · Site · Injection / instrument · Instrument + command · HEAD · Cache verdict · Exit · Assertion outcome · Outcome`.

**Ordering guarantee (inherited from 145's and 144's rows-first rule, from 143's D-13, from 142.1's
D-19, from 139): all twenty-nine rows below were written and committed before the phase's first
measurement existed, and before the phase's first product byte existed.** Every measurement cell reads
`pending` at creation — **29 rows × 5 unfilled cells = 145** occurrences. That ordering is a property
of the **commit graph** — this file's creating commit precedes every run in this phase and precedes
`146-02` entirely — not a claim made in prose about itself.

The count is checked, not asserted, with the same anchored pattern the plans' `<verify>` blocks use:

```
grep -E '^\| (D14-OBS|E1-CURL|E2-CHROMIUM|B1-OLD|B2-OLD|C1-NEW|C2-NEW|H0-GROWTH|H1-SHORT|H2-LONG|F1-DELTA-PRE|F2-BOGUS-RED|F3-BOGUS-GREEN|G0-CLEAN|D16-A1|D16-A2|D16-A3|PT1-PRODTRACE|EG1-CURL|EG2-SUITE|D17-R01|D17-R02|D17-R03|D17-R04|D17-R05|D17-CI|PF1-UNTOUCHED|SS1-EMPTY|E2E1-SUITE) \|' \
  146-NEGATIVE-CONTROL.md | grep -o 'pending' | wc -l
```

→ **145** at creation, decremented plan by plan as a running assertion. **Each plan clears only its own
rows.** The same pattern with `grep -c` returns the row count, **29**.

**Running count after `146-07`: 55.** `146-02` cleared 3 rows, `146-03` 2, `146-04` 5, `146-06` 3
(`F1-DELTA-PRE`, `F2-BOGUS-RED`, `F3-BOGUS-GREEN`) and `146-07` 5 (`G0-CLEAN`, `D16-A1`, `D16-A2`,
`D16-A3`, `PT1-PRODTRACE`) — 18 rows × 5 cells = 90 cleared, 145 − 90 = **55**, which is what the
pattern above returns. The 55 outstanding all belong to `146-08` (11 rows). *(The count after
`146-06` was **80**.)*

**Cache-verdict rule.** No row in this register is turbo-mediated; the instruments are `docker`,
Playwright, `curl`, Node and `git`. Each row records `n/a — docker`, `n/a — playwright`, `n/a — curl`,
`n/a — node` or `n/a — git` in that cell when it is filled. **That cell is never left blank.** If a
future row ever *is* turbo-mediated it must show `cache bypass, force executing` and be invoked with
`TURBO_FORCE=true`, because a replayed exit code is a claim about a *previous* tree.

**Every GREEN half carries an instrument-identity proof.** `F3-BOGUS-GREEN` must show, by
`git hash-object` / `git rev-parse` over `tests/tests/specs/visual/visual-regression.spec.ts`, that the
guard it ran is **byte-identical** to the one `F2-BOGUS-RED` ran — otherwise "this check catches this
defect" is a recollection rather than a two-directional measurement.

**Rows `D17-R01` … `D17-CI` record every exit code and every per-test result, including any failure.**
Under `CLAUDE.md` § E2E Hard Rule a failure there is a **cardinal failure to diagnose**, not a footnote
to annotate, and there is no "known-flaky" exemption. A run that did not run counts as a failure.

**Why six runs, when criterion 5's minimum is three.** ROADMAP criterion 5 asks for *"≥3 consecutive
runs"*, and D-17 takes **five** at `--workers=1 --retries=0` plus **one** at CI's literal invocation.
The reason is power, not zeal. The event this sweep is trying to re-observe — the run-4 anomaly carried
at v2.14 close — appeared **once in five runs**, so its observed rate is roughly one in five. A sweep of
three has poor power against a ~20 % event: assuming independence, three clean runs leave a
`0.8³ ≈ 51 %` chance of missing an anomaly that is still present, which is a coin toss dressed as a
gate. Five runs bring that to `0.8⁵ ≈ 33 %` — better, and still not a proof of absence, which is why
the outcome is recorded as *"did not recur in five runs at this strictness"* and never as *"gone"*. The
five also run **stricter than CI**, at zero retries against CI's three: a result that survives zero
retries transfers trivially to a runner that allows three, while the converse does not hold. The sixth
run exists because the five are not CI's invocation — it takes `CI=true` and `--grep "@visual"` with no
`--project=`, so the strictness measured in the five is shown to hold under the selection CI actually
issues. It is CI's **invocation**, not CI's **environment**; no run in this register was taken on a CI
runner.

| Row | Site | Injection / instrument | Instrument + command | HEAD | Cache verdict | Exit | Assertion outcome | Outcome |
|---|---|---|---|---|---|---|---|---|
| D14-OBS | `tests/global-setup.ts:41` + `tests/tests/support/preflight.ts:429-444`, evaluated from **inside** the pinned container | none — the identical-path mount `-v "$PWD":"$PWD" -w "$PWD"` **is** the instrument (D-14 A) | docker + playwright · literal invocation: `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-d14-observe --project visual-regression` — no `--block-egress`, no snapshot-update flag · resolved `--run-dir`: `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/e2e-runs/146-d14-observe` → `stdout.log`, `results.json`, `observed.txt`, `provenance.txt`, `exit`, `docker-argv.txt`, `entrypoint.sh` | `43ec683d7` | n/a — playwright | **0** (`tests/e2e-runs/146-d14-observe/exit` reads `0`; the wrapper's own `status` file reads `0` too) | Preflight success line, **verbatim from `stdout.log`**: `E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)`. The echoed frontend root is **character-identical** to the host's `"$PWD"/apps/frontend`. Posture **read back from `results.json` into `observed.txt`**, not restated from the invocation: `observed_workers=1`, `observed_retries=0`, `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=72119`. All **7** tests passed — `[data-setup-base] import base dataset` 1,536 ms · `[auth-setup] register + authenticate as base candidate` 4,260 ms · `[visual-regression] Voter Results - Desktop @visual` 22,217 ms · `[visual-regression] Voter Results - Mobile @visual` 19,526 ms · `[visual-regression] Candidate Preview - Desktop @visual` 4,926 ms · `[visual-regression] Candidate Preview - Mobile @visual` 4,407 ms · `[data-teardown-base] delete base dataset` 471 ms. Logs: `tests/e2e-runs/146-d14-observe/stdout.log` (the preflight line), `results.json` (the per-test table), `observed.txt` (the posture), `provenance.txt` (the `Machine` fields), `exit` | **GREEN — the mount moved, the gate did not.** Diagnostic rather than anecdotal because the causal chain is now closed end to end by observation: `docker-argv.txt:7-10` shows `-v <abs>:<abs> -w <abs>`, `provenance.txt` shows the container's `pwd=` is that same absolute path, so `tests/global-setup.ts:41`'s `path.resolve(TESTS_DIR,'..','..')` derives the host's repo root and `preflight.ts:440`'s `path.resolve(served) !== path.resolve(expected)` comparison holds instead of firing — and it held with **zero preflight edits**, which is the half of D-14 that matters (`git diff --exit-code -- tests/tests/support/preflight.ts tests/global-setup.ts` exits **0** at this HEAD, both blobs still hashing to their § Restoration values `389197f038e3b53a6836ea467444d6097e134429` and `1c4a29d3326ae8c4a2573a0678fe84e6f3b40fab`). The old `/work` form would have aborted here with exit 1 and the `DIFFERENT checkout` message before any spec body. Two further facts fall out of the same run and are recorded because nothing else in this phase would catch them: the **container half of research assumption A2** is now observed — `visual-container.sh(in-container): forwarder ready (pid 12)` then `host dev server reachable on localhost:5173`, so `tcp-forward.mjs`'s no-host `listen()` accepts whatever family the container's `localhost` resolves to, and the `apt-get install -y socat` fallback (which would have cost the pinned digest, and with it D-07's comparability) is **not** needed; and the four captures **passed** against the committed Google-served-Inter baselines under the old ratio-only budget, which is the expected clean-tree result and is *not* part of this row's verdict — this row is about the preflight |
| E1-CURL | in-container `curl https://fonts.googleapis.com/css2?family=Inter`, under `--block-egress` | none — the two `--add-host …:127.0.0.1` blackholes are the instrument (D-11 A) | curl (in-container, entrypoint step 2) · `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-egress-ctl --block-egress --egress-control-only` → `curl-control.log`, `egress-curl.exit`, `egress-curl.err`, `provenance.txt` | `a3b10ff5a` + `tests/scripts/visual-container.sh` blob `4dea5f5cf28fc1f7f185a6644f9e2e71f4890de5`, committed unchanged as `61b685523` (see § the `--egress-control-only` disclosure) | n/a — curl | **7** (`egress-curl.exit` reads `7`; `curl-control.log`'s status line reads `exit=7`) | **FAILED, which is the required outcome.** Verbatim from `tests/e2e-runs/146-egress-ctl/curl-control.log`: `curl: (7) Failed to connect to fonts.googleapis.com port 443 after 10 ms: Couldn't connect to server`. The mechanism, verbatim from the same run's `provenance.txt`: `127.0.0.1	fonts.googleapis.com` and `127.0.0.1	fonts.gstatic.com` (tab-separated in the file) — the container's own `/etc/hosts`, written there by the two `--add-host` flags visible in `docker-argv.txt`. Log: `tests/e2e-runs/146-egress-ctl/curl-control.log` (the transcript: command, stderr, stdout, status), with `egress-curl.err` / `egress-curl.exit` as its unmerged sources | **FAILURE IS THE PASS — the resolver is blackholed, and now it is falsifiable rather than assumed.** Diagnostic because the failure mode is *connect*, not *resolve*: `curl` reached port 443 on `127.0.0.1` and was refused in **10 ms**, which is what a name pointed at the loopback with nothing listening produces — a DNS failure or a proxy would have produced a different code and a different latency. Taken **before** any suite ran behind the block, which is D-11's whole point: a green egress-blocked suite measured after an unproven block would prove nothing, and `146-08`'s `EG2-SUITE` now has a mechanism proof to stand on. Scope of the claim, deliberately: the block is **name-scoped to exactly two hosts**, so npm and every other host stay reachable — a future maintainer who "hardens" it to `--network none` or a broad DNS sink will sever the host stack the suite needs and it will surface as a **Playwright failure**, not as a network error (Pitfall 8) |
| E2-CHROMIUM | in-container Chromium navigating to a Google Fonts stylesheet, under `--block-egress` | none — the same two blackholes, observed one layer up at browser level | playwright/chromium (in-container, entrypoint step 2b — the image's bundled Playwright driven by an inline `node -e`, no spec file and nothing committed to the suite) · same invocation and same run dir `tests/e2e-runs/146-egress-ctl` → `chromium-control.log` | `a3b10ff5a` + the same script blob `4dea5f5cf28fc1f7f185a6644f9e2e71f4890de5`, committed as `61b685523` | n/a — playwright | **0** from the wrapper — and that 0 means *the navigation failed as required*: the probe is specified to exit **0** on a thrown navigation and **6** on a successful one, so a reachable Google Fonts would have aborted this run with the same code the `curl` control uses. `controls-exit` reads `0` | **FAILED, which is the required outcome.** Verbatim from `tests/e2e-runs/146-egress-ctl/chromium-control.log`: `navigation FAILED: page.goto: net::ERR_CONNECTION_REFUSED at https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap`. Versions reported by the image in the same log: `playwright_version=1.58.2`, `chromium_version=145.0.7632.6`. Log: `tests/e2e-runs/146-egress-ctl/chromium-control.log` | **FAILURE IS THE PASS — and this is a different claim from `E1-CURL`, which is why it is a different row.** `curl` proves the container's resolver is blackholed; it says nothing about Chromium, which has its own resolver path and could in principle route around `/etc/hosts` — and if it did, every VGATE-04 claim in this phase would be vacuous, because Chromium is the thing that actually rasterises the captures. Diagnostic because the browser reports `net::ERR_CONNECTION_REFUSED` rather than a DNS error: the browser resolved the name **through `/etc/hosts` to `127.0.0.1`** and was refused there, so it is subject to the same blackhole at the same layer. Measured with the image's bundled Playwright through an inline probe rather than a spec file, so a one-off control does not become a permanent member of the suite |
| B1-OLD | `voter-results-desktop` capture under the **OLD** budget (`threshold: 0.2` + `maxDiffPixelRatio: 0.01`, **no** absolute cap) — **the blindness half** the standing acceptance rule demands | `apps/frontend/src/lib/components/matchScore/MatchScore.svelte:30`, `text-lg` → `text-2xl` — the v2.14 injection, verbatim and unimproved. Applied and **reverted inside this task**; the diff is preserved at `tests/e2e-runs/146-negctl-b1/injection.diff` and is a **one-token** change: `class="text-lg font-bold"` → `class="text-2xl font-bold"` on line 30 and nothing else in the file (injected blob `65a16a56667be18e653a231c994af15f110d4f10`) | playwright (in-container) · literal invocation: `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-negctl-b1 --project visual-regression` — **no** `--block-egress`, **no** snapshot-update flag, **no** `--config` (so the SHIPPED `tests/playwright.config.ts` is what produced this verdict; `pw-args.txt` reads `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`) · script blob as run: `4dea5f5cf28fc1f7f185a6644f9e2e71f4890de5`, **the committed `146-02` blob, unmodified** · image `mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d` (`docker-argv.txt:21`) → `results.json`, `stdout.log`, `observed.txt`, `exit`, `injection.diff`, `pre-injection.txt`. **The count** comes from the companion measurement-only run `tests/e2e-runs/146-negctl-b1-zero/` — see § *The count a passing capture cannot emit* below; the **verdict** comes from this run alone | `09b08eaea` | n/a — playwright | **1** (`tests/e2e-runs/146-negctl-b1/exit` and `status` both read `1`) — and the 1 is **`voter-results-mobile`**, not this row. Posture read back **from `results.json`** into `observed.txt`: `observed_workers=1`, `observed_retries=0`, `observed_expected=6`, `observed_unexpected=1`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=74827` | `voter-results-desktop` **status `passed`** in `results.json`, with the injection live — 21,803 ms, attachments `["trace"]` only. **It emitted no diff message at all**: `comparators.js:96` compares with a strict `count > budget`, so a capture inside budget passes silently and Playwright attaches no `-actual`/`-diff` PNG. That silence is the observation. The magnitude was therefore taken from the companion zero-tolerance run in the same injected state: **16,650 px** (`16650 pixels (ratio 0.01 of all image pixels) are different.`, `tests/e2e-runs/146-negctl-b1-zero/results.json`; exact ratio 16,650 / 4,715,520 = **0.353 %**). Logs: `tests/e2e-runs/146-negctl-b1/stdout.log` (carries `E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)`, so the run is known to have been against this checkout), `results.json`, `observed.txt`, `exit`; companion `tests/e2e-runs/146-negctl-b1-zero/{results.json,stdout.log,observed.txt,exit}` | **The green IS the finding, not the health.** The arithmetic is what makes it diagnostic rather than anecdotal: `0.01 × 1280 × 3684` = a **47,155.2 px** budget, and the injection did **16,650 px** of real, visible damage — the type scale of the match score on **every** entity card in the results list — which is **35.3 % of the budget** and **0.353 % of the image**. The gate did not fail to *notice* the damage; it was told not to *care* about it. Note precisely what the old configuration does and does not know: the shipped run cannot even report the number, because a within-budget capture emits nothing — so under the old budget this regression is not merely tolerated, it is **invisible in the evidence**. Re-observed here, in this container, at this HEAD, with the same injection, the same image digest and the same four baselines — **not cited** from `136-VISUAL-DISCRIMINATION-EVIDENCE.md`, which supplied the injection and nothing else. ROADMAP criterion 2's blindness half is discharged by observation |
| B2-OLD | `voter-results-mobile` capture under the same OLD budget | the same injection, in the same run as `B1-OLD` — one injection, one capture pass, two baselines | playwright (in-container) · same run dir `tests/e2e-runs/146-negctl-b1`, same single invocation, same shipped config → `results.json`, `stdout.log`, `observed.txt`, `exit` | `09b08eaea` | n/a — playwright | **1** — the same exit as `B1-OLD`, because it is the same run; this row is the failure that produced it | `voter-results-mobile` **status `failed`**, 21,381 ms, message verbatim: `19861 pixels (ratio 0.02 of all image pixels) are different.` (exact ratio 19,861 / 1,619,280 = **1.227 %**). Attachments: `voter-results-mobile-expected.png`, `voter-results-mobile-actual.png`, `voter-results-mobile-diff.png`, `error-context`, `trace`. Companion zero-tolerance measurement of the same injected state: **16,689 px**. Logs: `tests/e2e-runs/146-negctl-b1/{stdout.log,results.json,observed.txt,exit}`; companion `tests/e2e-runs/146-negctl-b1-zero/` | **RED — and the red is the health check, not the finding.** Two things are established by it. (a) **The injection reached the served application.** A mobile pass here would have meant Vite served a stale module, not that the gate is sensitive; the failure is the proof of delivery, and no dev-server restart was required — PID `41925` is untouched (see the header). (b) **The contrast that makes `B1-OLD` a height effect rather than a broken injection.** The same edit, the same run, the same knob: `0.01 × 390 × 4152` = a **16,192.8 px** budget, and 19,861 px **exceeds it by 3,668 px (123 % of budget)**. Same damage, same configuration, opposite verdicts — and the only material difference between the two baselines is **captured area**: the desktop page is 2.9× taller in pixels, so it buys itself 2.9× the tolerance for the identical defect. That is VGATE-01/VGATE-02 measured rather than argued, and it is why D-01's mechanism is an **absolute** cap |
| C1-NEW | `voter-results-desktop` capture under the **NEW** budget, absolute cap `maxDiffPixels: 200` in force | the same injection, restored and re-applied at the post-cap HEAD: `apps/frontend/src/lib/components/matchScore/MatchScore.svelte:30`, `text-lg` → `text-2xl`. **Instrument identity PROVEN, not assumed**: the injected file hashes to `65a16a56667be18e653a231c994af15f110d4f10` — **byte-identical** to the injected blob `B1-OLD` records for its own half. Diff preserved at `tests/e2e-runs/146-negctl-c/injection.diff`, a one-token change and nothing else in the file | playwright (in-container) · literal invocation: `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-negctl-c --project visual-regression` — **no** `--block-egress`, **no** snapshot-update flag, **no** `--config`, so the **shipped** `tests/playwright.config.ts` (now carrying the cap) is what produced this verdict; `pw-args.txt` reads `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json` · image `mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d` · host dev server PID **82314** (see § *the 146-04 restart disclosure*) → `results.json`, `stdout.log`, `observed.txt`, `exit`, `injection.diff`. **Baselines compared against were refreshed in the working tree immediately before this run** — the operator-approved deviation disclosed below | `badae5c04` (the cap's own commit) | n/a — playwright | **1** (`tests/e2e-runs/146-negctl-c/exit` and `status` both read `1`). Posture read back **from `results.json`** into `observed.txt`: `observed_workers=1`, `observed_retries=0`, `observed_expected=5`, `observed_unexpected=2`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=78993` — **two** unexpected, the two voter baselines, which is this row and `C2-NEW` | `voter-results-desktop` **status `failed`** in `results.json`, 23,586 ms, message **verbatim**: `4783 pixels (ratio 0.01 of all image pixels) are different.` Attachments: `voter-results-desktop-expected.png`, `voter-results-desktop-actual.png`, `voter-results-desktop-diff.png`, `error-context`, `trace` — the `-actual`/`-diff` pair that `B1-OLD`'s silent pass could not produce. Exact arithmetic: 4,783 px is **23.9× the 200 px cap**, and 4,783 / 4,715,520 = **0.101 %** of the image. Logs: `tests/e2e-runs/146-negctl-c/stdout.log` (carries `E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)`), `results.json`, `observed.txt`, `exit` | **RED — and the red is the catch. ROADMAP criterion 2's catching half, discharged by observation.** Paired against `B1-OLD` (HEAD `09b08eaea`, same file, same line, same one-token edit, same injected blob hash, same pinned image digest, same container recipe, same host dev server session): under the old ratio-only budget this capture **passed** with the injection live; under the cap it **fails**. The verdict flipped. **The magnitudes did NOT stay near-identical, and that divergence is a finding rather than a discrepancy to smooth over**: `B1-OLD` measured **16,650 px** and this half measures **4,783 px** — 11,867 px apart, because `B1-OLD` was measured against the *pre-tie-break, churned* committed baselines and therefore carries the stale-ordering offset **on top of** the injection's own damage, while this half was measured against baselines refreshed minutes earlier and is the injection **alone**. The plan's expectation that the two counts would be near-identical ("the damage did not change — only the budget did") was written before the tie-break fix removed the churn from one side of the comparison; it does not hold, and the catch proof does not rest on it. What the catch proof rests on is the **verdict flip** plus the **blob-hash instrument identity**, and both are intact. One arithmetic consequence, stated as arithmetic and not as a measurement taken: 4,783 px is **10.1 % of the old 47,155.2 px ratio budget**, so under the old configuration this regression would have passed against these refreshed baselines too — the blindness is not an artefact of the stale images |
| C2-NEW | `voter-results-mobile` capture under the NEW budget, same cap in force | the same injection, in the same run as `C1-NEW` — one injection, one capture pass, two baselines; same proven blob `65a16a56667be18e653a231c994af15f110d4f10` | playwright (in-container) · same run dir `tests/e2e-runs/146-negctl-c`, same single invocation, same shipped config, same refreshed baselines → `results.json`, `stdout.log`, `observed.txt`, `exit` | `badae5c04` | n/a — playwright | **1** — the same exit as `C1-NEW`, because it is the same run; this row is the second of the two unexpected results that produced it | `voter-results-mobile` **status `failed`**, 20,585 ms, message **verbatim**: `4835 pixels (ratio 0.01 of all image pixels) are different.` Attachments: `voter-results-mobile-expected.png`, `voter-results-mobile-actual.png`, `voter-results-mobile-diff.png`, `error-context`, `trace`. Exact arithmetic: 4,835 px is **24.2× the 200 px cap**, and 4,835 / 1,619,280 = **0.299 %** of the image. Same logs as `C1-NEW` | **RED — the must-not-regress half: mobile failed before and still fails, so the cap did not buy desktop sensitivity at the cost of mobile's.** Stated precisely, because the two reds are not the same mechanism and pretending otherwise would overclaim: `B2-OLD`'s red was 19,861 px exceeding mobile's 16,192.8 px **ratio** budget, measured against the churned baselines; this red is 4,835 px exceeding the **200 px cap**, measured against refreshed ones. The **injection alone** is 4,835 px here, which is **29.9 % of the old ratio budget** — so against correct baselines the old configuration would have been blind on mobile as well, and mobile's historical red was carried by the tie-order churn rather than by the gate being sensitive there. That sharpens rather than weakens the case for the cap: under the old budget the injection is invisible on **both** voter baselines once the baselines are current, and under the cap it is caught on both. The other half of this run is the noise-floor check the derivation owes (`T-146-14`): **both `candidate-preview` captures passed** in the same run, at the 200 px cap, against their **committed, unrefreshed** baselines — 0 px of drift on the pair that has never moved across three measurement campaigns, so the cap sits above the measured noise floor and not below it |
| H0-GROWTH | `document.documentElement.scrollHeight` on the voter-results desktop route, read **before and after** the D-06 filler, in the spec that takes the capture | inert absolutely-positioned filler appended below the fold at capture time — `div#vgate-height-filler`, `aria-hidden="true"`, `pointer-events: none`, `width: 1px`, `top` at the pre-append `scrollHeight`, `height: 2000px`. **No seed change, no fixture change, no tracked file touched** | playwright (in-container), throwaway height overlay · `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-height-p1 --project height-control --config tests/e2e-runs/146-height-control/playwright.height.config.ts --update-snapshots-all` · the overlay's `--list` was taken **before** any capture (F-146-P2) and enumerated **5 tests in 4 files** — `height-control short`, `height-control long`, plus `data-setup-base`, `auth-setup`, `data-teardown-base` → `results.json`, `stdout.log`, `observed.txt`, `exit`, and the two throwaway reference PNGs under `tests/e2e-runs/146-height-control/` | `d788e4a43` | n/a — playwright | **0** (`tests/e2e-runs/146-height-p1/exit` reads `0`; `observed_expected=5`, `observed_unexpected=0`, `observed_duration_ms=62362`) | **The lengthening happened, and it is measured on both sides.** Read back from the run's own `results.json` (`results[].stdout`), verbatim: `HEIGHTCTL mode=short damage=none scrollHeightBefore=3684 scrollHeightAfter=3684` and `HEIGHTCTL mode=long damage=none scrollHeightBefore=3684 scrollHeightAfter=5684`. The spec asserts `after > before` **in-band** (`expect(after, 'the filler did not lengthen the document').toBeGreaterThan(before)`), so a silently no-opping filler would have failed the run rather than produced a control. Both captures' pixel dimensions, read from the **PNG headers** of the references this pass wrote: `height-short.png` **1280×3684** (area 4,715,520 px; `0.01 × area` = **47,155.2 px**) and `height-long.png` **1280×5684** (area 7,275,520 px; `0.01 × area` = **72,755.2 px**). The area difference is therefore a measured **2,560,000 px**, and the ratio budget it buys is a measured **+25,600 px** | **GREEN — the control's precondition holds, and the short capture is commensurable with the real baseline.** Three facts fall out of it. (a) `height-short.png` is **1280×3684** — pixel-for-pixel the dimensions of the committed `voter-results-desktop.png`, so the control is measuring the same page the gate measures, not a lookalike. (b) The filler added exactly the 2,000 px it declared (3,684 → 5,684) and the long PNG's own header agrees (5,684 = 3,684 + 2,000), so the *capture* grew, not merely the DOM. (c) The ratio budget grew **54.2 %** (47,155.2 → 72,755.2 px) for **zero** additional content — that growth, with nothing else changed, IS the defect VGATE-02 names, and `H2-LONG` measures what it costs. The cap, by construction, stayed at **200 px** at both heights |
| H1-SHORT | D-06 control at **natural** page height (1280×3684), compared against its own freshly-taken reference in `tests/e2e-runs/146-height-control/` | two disclosed damage levels, both applied at capture time and both identical at the two heights: (1) **`matchscore`** — `page.addStyleTag` setting `font-size: 1.4375rem !important; line-height: 1.21 !important` on `[data-testid="match-score"]`. **The LITERAL form was used, not the CSS variables** — the values are `--text-2xl` / `--text-2xl--line-height` read off `apps/frontend/src/app.css:210-211`, recorded here so a re-run reproduces the same pixels. (2) **`patch`** — a calibrated solid `#ff0000` overlay, `position:absolute; top:0; left:0; 1280×47 px`, `aria-hidden`, `pointer-events:none`, inside the existing page box; disclosed in full below | playwright (in-container), height overlay · `tests/e2e-runs/146-height-p2` (matchscore, **new cap**) · `146-height-p3` (matchscore, **old ratio-only budget**) · `146-height-p4` (patch, new cap) · `146-height-p5` (patch, old budget). The old budget was obtained **inside the overlay only**, by `mode.json`'s `oldBudget: true` selecting a `toHaveScreenshot` block of `{ threshold: 0.2, maxDiffPixelRatio: 0.01 }` with **no** `maxDiffPixels` key — `git diff --exit-code -- tests/playwright.config.ts` shows the shipped config unchanged since Task 1 | `d788e4a43` | n/a — playwright | `146-height-p2` **1**, `146-height-p3` **0**, `146-height-p4` **1**, `146-height-p5` **1** — each read from that run's own `exit` file; every one of the five passes carries the `E2E PREFLIGHT OK` line in its `stdout.log` | Diff counts taken from each pass's own `results.json`, never from stdout. **`matchscore`: `D_short` = 4,783 px** — `4783 pixels (ratio 0.01 of all image pixels) are different.` (`146-height-p2`), status `failed`; under the old ratio-only budget the same capture **passed** silently (`146-height-p3`, no message, exit 0). **`patch`: `D_short` = 59,507 px** — status `failed` under the cap (`146-height-p4`) and status `failed` under the old budget too (`146-height-p5`, `59507 pixels (ratio 0.02 …)`). Budgets in force: cap **200 px**; ratio **47,155.2 px** (0.01 × 1280 × 3684) | **Four verdicts, none omitted. `matchscore`: FAILS under the cap (4,783 px = 23.9× of 200), PASSES under the ratio-only budget (4,783 px = 10.1 % of 47,155.2). `patch`: FAILS under both (59,507 px = 297× the cap, 126 % of the ratio budget).** The `matchscore` count is the row's load-bearing number for a reason worth recording: **4,783 px is *exactly* the count `C1-NEW` measured for the git-level `MatchScore.svelte:30` injection on the real `voter-results-desktop` baseline** — same integer, different injection mechanism, different reference image. The CSS reproduction of the damage is therefore not merely "equivalent in character"; it is equivalent to the pixel, which is what makes this control commensurable with the D-07 halves rather than merely analogous to them |
| H2-LONG | D-06 control at **lengthened** page height (1280×5684 — the same route, +2,000 px of inert filler), compared against its own freshly-taken reference | **the same two damage levels as `H1-SHORT`, byte-identical code paths and identical absolute magnitudes** — the only variable between this row and `H1-SHORT` is the captured area | playwright (in-container), height overlay · the same four measurement passes `146-height-p2` / `-p3` / `-p4` / `-p5`, each of which captures BOTH heights in one run, so the short and long numbers in these two rows come from the *same* invocation and not from two sessions | `d788e4a43` | n/a — playwright | the same four exits as `H1-SHORT` (**1**, **0**, **1**, **1**) — `146-height-p5` exits 1 because of *this row's* short-height sibling alone; the long capture in that pass **passed** | **`matchscore`: `D_long` = 4,783 px** (`146-height-p2`, status `failed`) — **the same integer as `D_short`, to the pixel**; under the old budget it **passed** (`146-height-p3`). **`patch`: `D_long` = 59,507 px** (`146-height-p4`, status `failed` under the cap) — again **the same integer as `D_short`** — and under the old ratio-only budget the same capture **PASSED silently** (`146-height-p5`, no message, no `-diff` attachment). Budgets in force: cap **200 px** (unchanged by the growth); ratio **72,755.2 px** (0.01 × 1280 × 5684, i.e. **+25,600 px** of tolerance bought by 2,000 px of empty page) | **ROADMAP criterion 3, discharged as a measurement rather than as an argument from the formula: the same absolute damage (59,507 px, identical to the pixel at both heights) FAILS the natural-height capture and PASSES the lengthened one under the ratio-only budget, and FAILS BOTH under the cap — so growing a page no longer raises its own tolerance.** The flip is located entirely in the budget arithmetic: 59,507 > 47,155.2 (short, red) and 59,507 < 72,755.2 (long, green), while `min(200, ratio)` = 200 at both heights. **Research assumption A3 is falsified in the safe direction — the control HOLDS**: `D_short` and `D_long` do not merely land "within a few pixels", they are **identical integers** at both damage levels (4,783 = 4,783 and 59,507 = 59,507), so the filler perturbed no above-the-fold layout at all and the two captures differ only in area. **Disclosed without which this row would overclaim:** the `matchscore` level — the damage commensurable with the D-07 injection — does **NOT** produce the flip. At 4,783 px it is two orders of magnitude below *both* ratio budgets and passes at both heights, so with that damage criterion 3's flip is **not observable**, and the reason is arithmetic rather than incidental: a flip requires a defect inside the window `(0.01 × A_short, 0.01 × A_long)` = (47,155.2, 72,755.2) px, a window the page's own growth opens. The `patch` level exists solely to place a defect inside that window; its magnitude is **measured** (59,507 px against a geometric 1280 × 47 = 60,160 px, i.e. 98.9 % of the patch's area — the shortfall is pixels already within `threshold: 0.2` of the patch colour), and it doubles as a calibration check on the comparator. Two extra passes (`146-height-p4`, `-p5`) beyond the plan's three were taken for it and are disclosed rather than folded into the planned three |
| F1-DELTA-PRE | all four baselines, **no `-u` flag at all** (default mode `missing`, compare-only), after the self-hosted font lands and after `yarn build` | none — the instrument is the **variable → static** delivery switch itself (research N-1) | playwright (in-container) · `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-fontdelta-zero` → `results.json` | `9cd183379` | n/a — playwright | **1** (all four runs; `observed_expected=5`, `observed_unexpected=2`, `observed_workers=1`, `observed_retries=0` in each) | **Zero-tolerance diff counts, all four recorded including the zeros: `voter-results-desktop` 11,615 px · `voter-results-mobile` 11,601 px · `candidate-preview-desktop` 0 px · `candidate-preview-mobile` 0 px.** Verdicts at the shipped `maxDiffPixels: 200`: **FAIL · FAIL · PASS · PASS**. Every number reproduced identically in **four** runs — `tests/e2e-runs/146-fontdelta-zero/{stdout.log,results.json}`, `…-zero-run02/`, `…-zero-run03/` (overlay at `maxDiffPixels: 0`) and `tests/e2e-runs/146-fontdelta-cap-146-06/` (shipped config). `grep -c 'E2E PREFLIGHT OK'` → **1** in each of the four `stdout.log`s; `grep -c 'update-snapshots'` → **0** in each run's `pw-args.txt` and `docker-argv.txt` (8 files, 8 zeros). The two zeros are `status: "passed"` with no matcher message — Pitfall 1's silent pass, recorded as `0` | **DIAGNOSTIC — the delta is 0 px where it could be seen, and the voter number is not the font.** Research's falsification criterion was *"any non-zero delta on the two `candidate-preview` baselines"*; both measured **exactly 0** at zero tolerance, four times, so D-09 A's neutrality claim **survives measurement** and the variable→static switch is observed — not assumed — to cost nothing. The `candidate-preview` pair earns that role from this phase's own § *Noise matrix*: twenty of its forty cells, all 0. The voter counts are the old tie permutation the committed baselines still encode — decoding the actual against the baseline shows 31 row-height bands with a *different candidate in the same slot* (`Generic AA Four`/6 vs `Generic AA One`/3), i.e. content, not rasterisation. **For `146-07`:** the re-baseline absorbs **no** rasterisation change; on `candidate-preview` it re-records pixels that already match, and on the voter pair it clears a content difference owed since `53002b6a9`. ⚠ It also **corrects `146-05-SUMMARY.md`:187-202**, which read that plan's 856 px as the font moving: `pixelmatch@0.2` over that run's own expected/actual pair reproduces 856, and masking the single 48×48 portrait tile at x 373-420 / y 178-225 takes it to **0** — every scored pixel was a seeded photograph, and it does not reproduce at current HEAD |
| F2-BOGUS-RED | the new `guardThirdPartyFonts` in `tests/tests/specs/visual/visual-regression.spec.ts` | `staticSettings.font.url` pointed at a path that 404s, followed by a **mandatory** `yarn build` (N-7) | playwright (in-container) · `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-bogus-red` → `results.json` | `073fefc72` (restore target for `staticSettings.ts` taken at this HEAD **before** the edit: `4c2c31d5c0205fee501c9a0c1c92632ad1300d77` — **not** the creation-time hash, per the ⚠ above) | n/a — playwright | **1** (`observed_expected=3`, `observed_unexpected=4` — every one of the four visual captures failed; the three setup projects passed) | **The guard failed BY NAME on all four captures**, verbatim from `tests/e2e-runs/146-bogus-red/stdout.log`: `Error: the same-origin Inter stylesheet http://localhost:5173/fonts/inter.csss did not load: status 404. The vendored font path is wrong, so the capture is fallback glyphs — settleFonts cannot see this (N-2)` — raised at `visual-regression.spec.ts:143`, the status-200 assertion. `grep -c 'Screenshot comparison failed'` → **0**; `grep -c 'webfont Inter did not load'` → **0**. Injection: `font.url` `/fonts/inter.css` → `/fonts/inter.csss` (a one-character fat-finger), `yarn build`, dev server restarted so the rebuilt `dist/` was actually served; **verified broken before the suite ran** — served `<head>` carried `href="/fonts/inter.csss"` and `curl` returned `404` (193,258 B `text/html`, 41 ms). `grep -c 'E2E PREFLIGHT OK'` → **1** | **RED (catch) — and `settleFonts` PASSED throughout, which is the point.** The run reached the guard on all four captures *because* `settleFonts` was satisfied: with the stylesheet 404ing, zero `@font-face` rules are registered and `document.fonts.check('1em Inter')` returns `true` vacuously. That is research N-2 scenario **A** re-observed on this application rather than in a synthetic probe, and it is the single clearest statement of why the guard exists — the docblock's claim that `settleFonts` converts a font-load failure into a named assertion **was never true**. Note which branch this row exercises: `146-05`'s demo B pointed `font.url` at a **200-serving** copy and tripped the *"never requested"* assertion; this row 404s and trips the **`status 200`** assertion, so between them both halves of the N-2 closure are measured. It also shows a 404 vendored path is **loud but in the wrong place** without the guard — `146-05` recorded a deleted `inter.css` timing out `auth-setup` at 90 s (`146-05-guardfail-404`/`-404b`); here the SSR error page cost 41 ms and the suite reached the guard cleanly, so the two failure shapes are environment-dependent and neither of them *says* "the font stylesheet is missing". The guard does |
| F3-BOGUS-GREEN | the same `guardThirdPartyFonts`, on the restored tree | none — tree restored to its own recorded restore target, `yarn build` re-run | playwright (in-container) · `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-bogus-green` → `results.json` + `git hash-object` byte-identity proof against `F2-BOGUS-RED`'s instrument | `073fefc72` — **the same HEAD as `F2-BOGUS-RED`** | n/a — playwright | **1** (`observed_expected=5`, `observed_unexpected=2` — the two failures are the voter *screenshot* comparisons, not the guard) | **The guard passed on all four captures**: `grep -c 'did not load\|never requested\|third-party font requests observed'` over `tests/e2e-runs/146-bogus-green/stdout.log` → **0**. The only failures are `voter-results-desktop` at **11,615 px** and `voter-results-mobile` at **11,601 px** — the same two numbers `F1-DELTA-PRE` recorded four times over, i.e. the stale tie permutation, unchanged by the injection-and-revert cycle. Revert proven three ways *before* this run: `git diff --exit-code -- packages/app-shared/src/settings/staticSettings.ts` exit **0**; `git hash-object` → `4c2c31d5c0205fee501c9a0c1c92632ad1300d77`, equal to the restore target recorded in `F2-BOGUS-RED`; `git status --porcelain` **empty**. Served application restored, not just the source: `yarn build` re-run, dev server restarted, `/fonts/inter.css` → **200** (2,279 B), served `<head>` back to `href="/fonts/inter.css"`. `grep -c 'E2E PREFLIGHT OK'` → **1** | **GREEN — and the red screenshot comparisons are NOT a failed control.** This row claims one thing only: the guard is quiet on a healthy tree. It is, on all four captures. The two red screenshots are the pre-existing stale-baseline delta `146-07` re-baselines, and they are red in every run this phase has taken since the tie-break fix landed — reading them as a failed control would be reading `F1-DELTA-PRE`'s finding as a defect. **The instrument is byte-identical to `F2-BOGUS-RED`'s:** `git hash-object tests/tests/specs/visual/visual-regression.spec.ts` returns `d517229bb3e05ec0aa0c47c66cf937e31302b785` in the working tree at **both** halves, `git rev-parse 073fefc72:tests/tests/specs/visual/visual-regression.spec.ts` returns the same blob, `git diff 073fefc72..HEAD` over that path is **empty**, and `git status --porcelain` over it is empty at both halves — the spec was never touched, only the served font path was. So *"this check catches this defect"* is a two-directional measurement on one instrument, not a recollection |
| G0-CLEAN | all four baselines with the new cap **and** the self-hosted font, after the VGATE-06 re-baseline | none — clean tree, the fourth D-07 half | playwright (in-container), **no snapshot flag of any kind** · `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-g0-clean` → `results.json`. ⚠ The pre-written cell named `tests/e2e-runs/146-rebaseline`; that directory holds the **`--update-snapshots=all` baking run**, and a comparison run cannot share a directory with the run it is verifying — so the comparison went to `146-g0-clean`. Disclosed here rather than back-dated | `dc064f591` — the re-baseline commit itself, so the run compared against the **committed** bytes | n/a — playwright | **0** (`observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_workers=1`, `observed_retries=0`, `observed_duration_ms=69330`) | **All four captures PASS**, read per-test out of `tests/e2e-runs/146-g0-clean/results.json` rather than scraped from stdout: `visual-regression › screenshot matches baseline` × 4, `status: passed`, alongside `data-setup-base`, `auth-setup` and `data-teardown-base` — 7 specs, 7 `ok: true`. `grep -c 'E2E PREFLIGHT OK' tests/e2e-runs/146-g0-clean/stdout.log` → **1**. `grep -c 'update-snapshots'` → **0** in both `pw-args.txt` and `docker-argv.txt`, so nothing could have been re-recorded; the emitted argv is `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`. Taken **after** the re-baseline commit, `git status --short tests/tests/specs/visual/` is **empty** — Pitfall 7's proof that the gate COMPARED rather than re-recorded. Log: `tests/e2e-runs/146-g0-clean/stdout.log` | **GREEN — D-07 half (4): new cap, new font, clean tree, all four green.** With `B1-OLD`/`B2-OLD` (the old cap blind to the injection) and `C1-NEW`/`C2-NEW` (the new cap catching it), this completes the four halves D-07 specifies: the gate now **catches** what it must and **stays quiet** on a tree with nothing wrong. The row's load-bearing property is that it took **no snapshot-update flag** — a baseline set that has only ever been written and never compared against is a recording, not a gate, and this is the run that makes the difference observable. It is also the third independent confirmation of the committed bytes: their four sha256s were produced by all 12 pre-baking runs (`146-t0-focus/run1…12`), by the baking run (`146-rebaseline`), and are the bytes this run compared green against — 14 captures of each baseline, one hash each |
| D16-A1 | the run-4 anomaly reproduction protocol, **attempt 1 of at most 3** | inject → run → `git checkout -- <path>` → immediate re-run, **without restarting the host dev server** | ⚠ **RE-SCOPED — see § *D-16 was re-scoped, and why* below.** The pre-written cells to the left chartered a DISCOVERY attempt at an unexplained failure; it is no longer unexplained, so they are left verbatim rather than back-dated, and what actually ran is named here: the **relay-level regression heartbeat**, the high-power instrument the root-cause session used — a fresh no-keep-alive connection through `tcp-forward.mjs` every 200 ms for 480 s, connect leg timed separately from first byte. `tests/e2e-runs/146-d16-regression/heartbeat/{container.json,forwarder.log}` | `c980c0d88` | n/a — node | **0** (container exit 0; 2,239 trials, **0** transport errors) | **The fault fired 33 times and was absorbed 33 times.** `tcp-forward.mjs` closing line: `connections=2239 re-dialled=33 gave-up=0`. Ladder depths reached, counted from the per-drop lines: **28 × `dial 1/8`** (absorbed on dial 2), **4 × `dial 2/8`** (two consecutive drops), **1 × `dial 3/8`** (three) — deepest **4 of 8**, against a budget of `CONNECT_ATTEMPTS 8 × CONNECT_TIMEOUT_MS 1000` = **8,000 ms**, never approached. Client-visible request totals: p50 **32 ms**, p95 **44 ms**, p99 **1,029 ms**, max **3,036 ms**; **28** requests ≥ 1 s, **4** ≥ 2 s, **0** ≥ 5 s, **0** ≥ 30 s. The over-1-s totals are quantised to the 1,000 ms re-dial window (1,049–1,060 / 2,026–2,044 / 3,036), which is the absorbed-drop signature rather than ambient latency | **PASS — and the evidence is POSITIVE, not an absence.** Drop rate this window is **33 / 2,239 = 1.47 % per connection**, roughly **double** the 0.786 % the pre-fix corpus measured: the Docker Desktop egress defect is not quieter, it is louder, and every instance was still converted from a 36–68 s Linux SYN-backoff stall into ≤ 3 s. Worst stall in the pre-fix record was **68,378 ms**; worst here is **3,036 ms**. This is the row that separates *the drops stopped happening* — which would make any clean sweep meaningless — from *the drops kept happening and were absorbed*, which is what was observed |
| D16-A2 | the same protocol, **attempt 2 of at most 3** | the same inject/revert/re-run sequence, same session | ⚠ **RE-SCOPED — see § *D-16 was re-scoped, and why* below.** The pre-written cells to the left chartered a DISCOVERY attempt at an unexplained failure; it is no longer unexplained, so they are left verbatim rather than back-dated, and what actually ran is named here: the **suite-level corpus** — the forwarder statistics of every in-container Playwright run this plan took, read out of each run's own `forwarder.log` and aggregated by `tests/e2e-runs/146-d16-regression/aggregate.sh` | `bbbd626a9` … `c980c0d88` | n/a — node | **0** for all 15 runs | **15 runs, 1,662 relayed connections, 1 re-dial, 0 given up, deepest ladder 1 of 8.** The 15: `146-t0-focus/run1…12` (the byte-stability loop), `146-fontsize-probe` (the pre-write gate probe), `146-rebaseline` (the `--update-snapshots=all` baking run) and `146-g0-clean` (the non-updating comparison). Every one carries `E2E PREFLIGHT OK` in its own `stdout.log`, and none of them failed for any reason — `observed_unexpected=0` in all 15. The single re-dial connected on dial 2 | **PASS, and deliberately reported as the LOW-POWER arm.** 1 drop in 1,662 connections is 0.06 %, an order of magnitude below the heartbeat's 1.47 % in the same session — suite connections are longer-lived and fewer of them are fresh dials, which is exactly why the root-cause session called the suite a low-power instrument for this defect and put its conclusion on the connection-level measurement instead. Recorded because a run-level corpus is what a future reader reaches for first, and it should be visible on the page that this arm carries corroboration rather than proof |
| D16-A3 | the same protocol, **attempt 3 of at most 3** | the same inject/revert/re-run sequence, same session | ⚠ **RE-SCOPED — see § *D-16 was re-scoped, and why* below.** The pre-written cells to the left chartered a DISCOVERY attempt at an unexplained failure; it is no longer unexplained, so they are left verbatim rather than back-dated, and what actually ran is named here: the **paired host-direct control** — the identical heartbeat client, same 480 s window, same cadence, same dev server, but straight from the host to Vite with no container and no relay in the path. `tests/e2e-runs/146-d16-regression/heartbeat/host.json` | `c980c0d88` | n/a — node | **0** (2,384 trials, **0** transport errors) | **Zero stalls of any size on the host-direct path**: totals p50 **29 ms**, p95 **40 ms**, p99 **43 ms**, max **55 ms**; **0** requests ≥ 1 s. Ran concurrently with `D16-A1`, against the same Vite process (PID `94791`) that answered the container's 2,239 trials | **CONTROL — the dev server is exonerated by its own measurement, and the window was demonstrably not quiet.** The two arms observed the same server over the same 480 s: container-through-relay saw 33 dropped SYNs; host-direct saw a maximum request time of 55 ms. So the drops are on the container's egress path — not in Vite, not in the product, not in the network generally — which is what the root-cause record concluded and what this row re-confirms at this HEAD. Without this arm, `D16-A1`'s 33 absorbed drops could be read as the relay inventing work for itself |
| PT1-PRODTRACE | the **production** server — `node apps/frontend/build/index.js`, adapter-node — not the dev server the suite drives | none — a request trace grouped **by host** (VGATE-05, D-12 half 2) | playwright request listener (`page.on('request')`, the in-repo pattern from `performance-budget.spec.ts:137-140`) · throwaway script `tests/e2e-runs/146-prodtrace/trace.mjs`, **not** a committed spec — the suite's global-setup preflight asserts a Vite `/@fs` echo that adapter-node does not serve, which is precisely the gap this row exists to close · output `tests/e2e-runs/146-prodtrace/requests.txt` | `f19f24408` — `yarn build` re-run at this HEAD, 14/14 turbo tasks successful (fully cached), `packages/app-shared/dist/index.js` carrying `"/fonts/inter.css"` | n/a — playwright | **0** (server started, six routes driven, server stopped; `lsof -nP -iTCP:4319 -sTCP:LISTEN` empty afterwards and `curl` returns `000`) | **477 requests, exactly TWO hosts: `localhost:4319` (447 — the application itself) and `127.0.0.1:54321` (30 — local Supabase REST).** Zero requests to any other host at all, so the third-party font claim is a special case of a stronger observation. Font assets, all same-origin and all **200**: `/fonts/inter.css`, `/fonts/inter-latin-400-normal.woff2`, `/fonts/inter-latin-700-normal.woff2` — three distinct paths, fetched once per document, 18 requests over the six documents. Document statuses: `/` 200, `/elections` 200, `/questions` 307 → `/elections?next=/questions` 200, `/results` 307 → `/elections?next=/results` 200, `/candidate` 303 → `/en/candidate/login` 200, `/candidate/preview` 303 → `/en/candidate/login` 200. Port **4319**, deliberately not the dev server's 5173. Full list in `tests/e2e-runs/146-prodtrace/requests.txt`, grouped by host | **The claim, in its exact form: ZERO THIRD-PARTY FONT REQUESTS OBSERVED.** Not *zero occurrences in the build* — `grep -rn "fonts.googleapis" apps/frontend/build/` returns **7** hits across 5 files (`server/chunks/_layout.svelte-*.js` and its `.map`, `client/fonts/inter.css`, and two `client/_app/immutable/nodes/0.*.js`), and `fonts.gstatic` returns **5**. Those hits are **correct behaviour, not a leak** (N-6): the `??` fallback literal at `+layout.svelte:207-208` and the two preconnect literals at `:221-223` survive into the bundle **by design**, because they are what keeps the operator override working when `staticSettings.font.url` is pointed back at Google. A future reader running that grep will find a "regression" that is a string literal, and this cell exists so they stop before filing it. ⚠ **Two scope statements, so the claim is not overread.** (1) `/questions`, `/results` and `/candidate/preview` were reached as their **guard redirects** (307/303), not as located/authenticated documents: the throwaway script carries neither the voter fixture's ~20 s walk nor a candidate session. This does not weaken the claim — the font `<link>` is emitted by the **root** `+layout.svelte` and is therefore identical on every route, and those two routes are covered permanently by the in-spec `guardThirdPartyFonts` on the dev server, which is exactly why D-12 gives VGATE-05 two halves rather than one. It is recorded because a reader is entitled to know which documents were actually rendered. (2) Only **two** of the four vendored woff2 files are fetched: `inter.css` declares four `@font-face` rules but the latin-ext pair carries a `unicode-range` no English-locale page uses, so the browser never requests them — subsetting working as designed, matching the `document.fonts.size = 4` / 2-loaded reading in § *Baseline re-capture*. **Known-remaining residue, both out of scope by decision:** `apps/docs/src/app.html:9-11` still contacts `fonts.googleapis.com` (**D-13**, `T-146-06`, disposition *accept*, todo filed in `146-09`) — so "self-hosted Inter" is a claim about the VAA frontend, never about the repository; and `cloud.umami.is` survives in the build (**M-10**, `T-146-07`, *accept*, not a font host). Note the analytics host was **not requested** in this trace either — `grep -ci umami requests.txt` → **0** — because `analytics.trackEvents` is `false`; that is an observation, not a guarantee, and M-10 stands as filed |
| EG1-CURL | the pre-suite `curl` control for the **criterion-4** run, executed **before** `EG2-SUITE` in the same container | none — the two blackholes; the control runs first because a green suite behind an unproven block proves nothing | curl (in-container, entrypoint step 2) · `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-egress-green --block-egress` → `egress-curl.exit` | `bffc8fde7` — branch `feat-gsd-roadmap`, clean tree. **Zero product bytes separate this HEAD from `146-07`'s close (`5bb95083e`)**: `git diff --stat 5bb95083e..HEAD` reports one file, this ledger, +20 lines. `visual-container.sh` blob `2a5420a25a418b1d9cd29af359bea49b188f55f9` — **not** the `4dea5f5cf28fc1f7f185a6644f9e2e71f4890de5` that `E1-CURL` ran, and the difference is disclosed rather than glossed: `git diff 61b685523..HEAD -- tests/scripts/visual-container.sh` filtered to lines matching `curl`, `add-host`, `exit 6` or `blackhole` returns **empty**. The step-2 control, the two `--add-host` blackholes and the exit-6 abort are byte-unchanged; the only delta is `146-03`'s `--config` overlay support, which this invocation does not use | n/a — curl | **7** (`egress-curl.exit` reads `7`; `curl-control.log`'s status line reads `exit=7`) | **FAILED, which is the required outcome.** Verbatim from `tests/e2e-runs/146-egress-green/curl-control.log`: `curl: (7) Failed to connect to fonts.googleapis.com port 443 after 10 ms: Couldn't connect to server`, against the command the same file records, `curl -sS --max-time 8 "https://fonts.googleapis.com/css2?family=Inter"`. Stdout was **empty** — nothing was fetched. The mechanism, verbatim from **this run's own** `provenance.txt:6-8`: `--- /etc/hosts (the blackhole lines) ---`, `127.0.0.1	fonts.googleapis.com`, `127.0.0.1	fonts.gstatic.com`, put there by `docker-argv.txt:7-10`'s `--add-host fonts.googleapis.com:127.0.0.1` and `--add-host fonts.gstatic.com:127.0.0.1`. **Ordering, by timestamp rather than by assertion:** `curl-control.log` was written `2026-08-26 21:10:43` local and `results.json`'s `startTime` is `2026-08-26T18:10:47.557Z` = `21:10:47` local — the control precedes the Playwright invocation by **4 s**, inside the one `--rm` container session. Logs: `tests/e2e-runs/146-egress-green/curl-control.log`, with `egress-curl.err` / `egress-curl.out` / `egress-curl.exit` as its unmerged sources, and `provenance.txt` for the blackhole | **FAILURE IS THE PASS — and this is a different claim from `146-02`'s `E1-CURL`, which is why it is a separate row rather than a cross-reference.** `E1-CURL` proved the *mechanism*: that `--add-host` blackholing works at all. It proves nothing about **this** run, taken a day and eleven commits later against a rebuilt `dist/` and a restarted server. `EG1-CURL` proves the block was **live in the session that produced `EG2-SUITE`** — the same container, four seconds earlier, on the same `/etc/hosts`. That is what D-11 puts first and it is the only reason the green below is evidence: a green egress-blocked suite behind an unproven block proves nothing at all, and the script's exit-6 abort means the suite *cannot* run behind an unproven block even by accident. Diagnostic in the same way `E1-CURL` was, and re-observed here rather than inherited: the failure mode is **connect**, not **resolve** — `curl` reached port 443 on `127.0.0.1` and was refused in **10 ms**, the signature of a name pointed at loopback with nothing listening. A DNS failure or an intercepting proxy would have produced a different code and a different latency |
| EG2-SUITE | the full `visual-regression` project under `--block-egress` — **VGATE-04** | none — clean tree | playwright (in-container) · same run dir `tests/e2e-runs/146-egress-green` → `results.json` | `bffc8fde7` — the **same container session** as `EG1-CURL` above, so the same HEAD and the same script blob. The four baselines it compared against are the `146-07` re-captures, unmoved: `voter-results-desktop` `15dabda71245dbd8a975dfb6179932add208910e`, `voter-results-mobile` `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3`, `candidate-preview-desktop` `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc`, `candidate-preview-mobile` `8878188644373d9a6069c98b46819d4be546f2a5` | n/a — playwright | **0** (`tests/e2e-runs/146-egress-green/exit` reads `0`; the wrapper's `status` file reads `0`) | Preflight success line, **verbatim from `stdout.log:2`**: `E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)`. Posture **read back from `results.json` into `observed.txt`**, not restated from the invocation: `observed_workers=1`, `observed_retries=0`, `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=74429`. All **7** tests passed at retry 0 — `[data-setup-base] import base dataset` 1,846 ms · `[auth-setup] register + authenticate as base candidate` 4,304 ms · `[visual-regression] Voter Results - Desktop @visual` 22,809 ms · `[visual-regression] Voter Results - Mobile @visual` 20,539 ms · `[visual-regression] Candidate Preview - Desktop @visual` 5,148 ms · `[visual-regression] Candidate Preview - Mobile @visual` 4,335 ms · `[data-teardown-base] delete base dataset` 501 ms. **Seven, not four** — the three dependency projects ran, so this is the full project rather than the easier four-capture claim. Invocation as recorded in `pw-args.txt`, with **no snapshot-update flag in any form**: `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`. `git status --short tests/tests/specs/visual/` **empty** afterwards. Logs: `stdout.log`, `results.json`, `observed.txt`, `pw-args.txt`, `docker-argv.txt`, `exit` | **GREEN — VGATE-04, in ROADMAP criterion 4's own words: the `e2e-visual` project completes green in-container with egress to `fonts.googleapis.com` blocked, and the block is applied to the runner rather than simulated by a stubbed fetch.** *Applied to the runner* is the load-bearing clause and it is discharged structurally, not by assertion: `docker-argv.txt:7-10` carries the two `--add-host …:127.0.0.1` flags, so the blackhole lives in the container's own `/etc/hosts` and binds `curl`, Chromium and every other process in the image alike. There is no `page.route(…)`, no request interception and no stubbed fetch anywhere in the path — D-11 A rules them out by construction, because a simulated block is a claim about the test harness and criterion 4 is a claim about the runner. **The positive half, which research Pitfall 3 insists on:** a green egress-blocked run that made **no** `/fonts/inter.css` request would be a warning, not a success — it would mean the page never asked for a font at all and the capture is fallback glyphs. `guardThirdPartyFonts` (`visual-regression.spec.ts:125-146`) passed on **all four** captures, and it is three assertions, not one: (1) zero resource entries match `THIRD_PARTY_FONT_HOSTS`, (2) a `/fonts/inter.css` entry **is present** in `performance.getEntriesByType('resource')` — `expect(stylesheet).toBeDefined()`, which is exactly the presence check — and (3) `page.request.get(stylesheet)` returns **200**. The guard is silent on pass, so the record is the passing assertion named here rather than a log line; a violation of any of the three would have named itself and reddened the capture. Independently, the host answered `200` on `http://localhost:5173/fonts/inter.css` at server start (ledger header, restart `94791` → `31124`). **Scope, stated rather than implied:** the block is name-scoped to exactly two hosts, so npm and the host stack stay reachable; and this is one run — the consecutive-run claim is `D17-R01` … `D17-CI` below, not this row |
| D17-R01 | full `visual-regression` project, `--workers=1 --retries=0` (stricter than CI's `retries: 3`), run 1 of 5 | none | playwright (in-container) · `tests/e2e-runs/146-det-run01` → `results.json`, `observed.txt` | `2e29bf632` — branch `feat-gsd-roadmap`, clean tree, **pinned for the whole sweep**: all five strict runs and the CI-literal run were taken at this one HEAD, and `git status --short` was empty before the first and after the last. Baselines compared against: `voter-results-desktop` `15dabda71245dbd8a975dfb6179932add208910e`, `voter-results-mobile` `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3`, `candidate-preview-desktop` `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc`, `candidate-preview-mobile` `8878188644373d9a6069c98b46819d4be546f2a5` | n/a — playwright | **0** (`tests/e2e-runs/146-det-run01/exit` reads `0`) | Posture **read back from this run's own `results.json` into `observed.txt`**, never restated from the invocation: `observed_workers=1`, `observed_retries=0`, `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=71164`. Invocation from `pw-args.txt`, with **no `--update-snapshots` in any form**: `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`. Preflight line present in `stdout.log`: `E2E PREFLIGHT OK …/apps/frontend (verified against …)`. All **7** tests passed, every one at **retry 0** — `[data-setup-base] import base dataset` 1,092 ms · `[auth-setup] register + authenticate as base candidate` 3,882 ms · `[visual-regression] Voter Results - Desktop @visual` 22,239 ms · `[visual-regression] Voter Results - Mobile @visual` 20,938 ms · `[visual-regression] Candidate Preview - Desktop @visual` 4,426 ms · `[visual-regression] Candidate Preview - Mobile @visual` 4,330 ms · `[data-teardown-base] delete base dataset` 473 ms. Forwarder: `connections=161 re-dialled=0 gave-up=0`. Logs: `tests/e2e-runs/146-det-run01/stdout.log`, `results.json`, `observed.txt`, `forwarder.log`, `exit` | **GREEN, run 1 of 5.** Seven tests, not four: the three dependency projects ran, so this is the full project rather than the captures alone. Zero retries were **available** and zero were **consumed** — every result carries `retry 0`, so nothing here is a second attempt reported as a first |
| D17-R02 | the same, run 2 of 5 | none | playwright (in-container) · `tests/e2e-runs/146-det-run02` → `results.json`, `observed.txt` | `2e29bf632` — branch `feat-gsd-roadmap`, clean tree, **pinned for the whole sweep**: all five strict runs and the CI-literal run were taken at this one HEAD, and `git status --short` was empty before the first and after the last. Baselines compared against: `voter-results-desktop` `15dabda71245dbd8a975dfb6179932add208910e`, `voter-results-mobile` `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3`, `candidate-preview-desktop` `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc`, `candidate-preview-mobile` `8878188644373d9a6069c98b46819d4be546f2a5` | n/a — playwright | **0** (`tests/e2e-runs/146-det-run02/exit` reads `0`) | Posture **read back from this run's own `results.json` into `observed.txt`**, never restated from the invocation: `observed_workers=1`, `observed_retries=0`, `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=71827`. Invocation from `pw-args.txt`, with **no `--update-snapshots` in any form**: `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`. Preflight line present in `stdout.log`: `E2E PREFLIGHT OK …/apps/frontend (verified against …)`. All **7** tests passed, every one at **retry 0** — `[data-setup-base]` 954 ms · `[auth-setup]` 3,778 ms · `Voter Results - Desktop @visual` 22,324 ms · `Voter Results - Mobile @visual` 20,407 ms · `Candidate Preview - Desktop @visual` 4,880 ms · `Candidate Preview - Mobile @visual` 4,635 ms · `[data-teardown-base]` 780 ms. Forwarder: `connections=161 re-dialled=0 gave-up=0`. Logs: `tests/e2e-runs/146-det-run02/stdout.log`, `results.json`, `observed.txt`, `forwarder.log`, `exit` | **GREEN, run 2 of 5.** Consecutive with run 1 — no other work was interleaved on the host and the dev server was not restarted between them, so the contention environment the runs measure is the one they share |
| D17-R03 | the same, run 3 of 5 | none | playwright (in-container) · `tests/e2e-runs/146-det-run03` → `results.json`, `observed.txt` | `2e29bf632` — branch `feat-gsd-roadmap`, clean tree, **pinned for the whole sweep**: all five strict runs and the CI-literal run were taken at this one HEAD, and `git status --short` was empty before the first and after the last. Baselines compared against: `voter-results-desktop` `15dabda71245dbd8a975dfb6179932add208910e`, `voter-results-mobile` `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3`, `candidate-preview-desktop` `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc`, `candidate-preview-mobile` `8878188644373d9a6069c98b46819d4be546f2a5` | n/a — playwright | **0** (`tests/e2e-runs/146-det-run03/exit` reads `0`) | Posture **read back from this run's own `results.json` into `observed.txt`**, never restated from the invocation: `observed_workers=1`, `observed_retries=0`, `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=74616`. Invocation from `pw-args.txt`, with **no `--update-snapshots` in any form**: `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`. Preflight line present in `stdout.log`: `E2E PREFLIGHT OK …/apps/frontend (verified against …)`. All **7** tests passed, every one at **retry 0** — `[data-setup-base]` 1,047 ms · `[auth-setup]` 4,201 ms · `Voter Results - Desktop @visual` 22,504 ms · `Voter Results - Mobile @visual` 21,320 ms · `Candidate Preview - Desktop @visual` 4,929 ms · `Candidate Preview - Mobile @visual` 4,465 ms · `[data-teardown-base]` 775 ms. Forwarder: `connections=159 re-dialled=0 gave-up=0`. Logs: `tests/e2e-runs/146-det-run03/stdout.log`, `results.json`, `observed.txt`, `forwarder.log`, `exit` | **GREEN, run 3 of 5.** This run alone already meets ROADMAP criterion 5's stated minimum of three consecutive runs; the sweep continues to five for the reason recorded in the prose above — three has poor power against a roughly one-in-five event |
| D17-R04 | the same, run 4 of 5 | none | playwright (in-container) · `tests/e2e-runs/146-det-run04` → `results.json`, `observed.txt` | `2e29bf632` — branch `feat-gsd-roadmap`, clean tree, **pinned for the whole sweep**: all five strict runs and the CI-literal run were taken at this one HEAD, and `git status --short` was empty before the first and after the last. Baselines compared against: `voter-results-desktop` `15dabda71245dbd8a975dfb6179932add208910e`, `voter-results-mobile` `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3`, `candidate-preview-desktop` `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc`, `candidate-preview-mobile` `8878188644373d9a6069c98b46819d4be546f2a5` | n/a — playwright | **0** (`tests/e2e-runs/146-det-run04/exit` reads `0`) | Posture **read back from this run's own `results.json` into `observed.txt`**, never restated from the invocation: `observed_workers=1`, `observed_retries=0`, `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=108063`. Invocation from `pw-args.txt`, with **no `--update-snapshots` in any form**: `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`. Preflight line present in `stdout.log`: `E2E PREFLIGHT OK …/apps/frontend (verified against …)`. All **7** tests passed, every one at **retry 0** — `[data-setup-base]` 1,014 ms · `[auth-setup]` 3,934 ms · **`Voter Results - Desktop @visual` 45,382 ms** · `Voter Results - Mobile @visual` 27,164 ms · `Candidate Preview - Desktop @visual` 5,700 ms · `Candidate Preview - Mobile @visual` 4,743 ms · `[data-teardown-base]` 579 ms. Forwarder: `connections=160 re-dialled=0 gave-up=0`. Logs: `tests/e2e-runs/146-det-run04/stdout.log`, `results.json`, `observed.txt`, `forwarder.log`, `exit` | **GREEN, run 4 of 5 — and its latency excursion is diagnosed here rather than left as a shrug.** This run took 108,063 ms against the sweep's 71–83 ms band, with `Voter Results - Desktop` at **45,382 ms** against a 22,239–25,306 ms band. Under `CLAUDE.md` § E2E Hard Rule a green with an unexplained excursion at *this* run index is exactly the thing not to wave through: run 4 is the index the v2.14 anomaly occupied. **It is not that defect, and the trace says so by decomposition.** Extracted from this run's own `test.trace` (`html/data/c243d677….zip`) against run 1's (`146-det-run01/html/data/8f70d079….zip`): `Before Hooks` 24,145 ms vs 19,674 ms (+4.5 s, the `answeredVoterPage` walk) and **`After Hooks` 15,564 ms vs 1,182 ms (+14.4 s)**, of which `Fixture "context"` teardown is **15,501 ms** against 1,175 ms. The +23.1 s therefore lands in **context teardown** — the trace-zip flush across the bind mount — and in setup, i.e. **after** the verdict and **before** it. The verdict-bearing step itself, `Expect toHaveScreenshot(voter-results-desktop.png)`, took 3,463 ms and **passed**. Two facts rule out the phase's known network defect: the forwarder reports `re-dialled=0 gave-up=0`, so **no SYN was dropped or absorbed at all**, and the excursion is in a disk-bound teardown rather than a connection stall. Diagnosis: **host I/O/CPU contention on the instrument, not a product or gate defect** — no test failed, no retry was consumed (`retry 0` throughout), and no pixel comparison was affected. Recorded as an observation about the measuring apparatus, not absorbed into the gate's verdict |
| D17-R05 | the same, run 5 of 5 | none | playwright (in-container) · `tests/e2e-runs/146-det-run05` → `results.json`, `observed.txt` | `2e29bf632` — branch `feat-gsd-roadmap`, clean tree, **pinned for the whole sweep**: all five strict runs and the CI-literal run were taken at this one HEAD, and `git status --short` was empty before the first and after the last. Baselines compared against: `voter-results-desktop` `15dabda71245dbd8a975dfb6179932add208910e`, `voter-results-mobile` `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3`, `candidate-preview-desktop` `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc`, `candidate-preview-mobile` `8878188644373d9a6069c98b46819d4be546f2a5` | n/a — playwright | **0** (`tests/e2e-runs/146-det-run05/exit` reads `0`) | Posture **read back from this run's own `results.json` into `observed.txt`**, never restated from the invocation: `observed_workers=1`, `observed_retries=0`, `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=82964`. Invocation from `pw-args.txt`, with **no `--update-snapshots` in any form**: `test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0 --reporter=html,json`. Preflight line present in `stdout.log`: `E2E PREFLIGHT OK …/apps/frontend (verified against …)`. All **7** tests passed, every one at **retry 0** — `[data-setup-base]` 1,393 ms · `[auth-setup]` 5,204 ms · `Voter Results - Desktop @visual` 25,306 ms · `Voter Results - Mobile @visual` 23,438 ms · `Candidate Preview - Desktop @visual` 5,419 ms · `Candidate Preview - Mobile @visual` 4,752 ms · `[data-teardown-base]` 688 ms. Forwarder: `connections=162 re-dialled=0 gave-up=0`. Logs: `tests/e2e-runs/146-det-run05/stdout.log`, `results.json`, `observed.txt`, `forwarder.log`, `exit` | **GREEN, run 5 of 5 — the strict sweep closes at 5/5, 35/35 tests, zero unexpected, zero flaky, zero retries consumed.** `git status --short tests/tests/specs/visual/` is **empty** after this run, which is `SS1-EMPTY`'s observation and the reason these five greens are gate results rather than recordings. **What this sweep does NOT show, stated because silence would be misleading:** the run-4 anomaly did **not** recur, and — unlike `146-07`'s regression check, which saw 33 dropped SYNs in 2,239 connections (1.47 %) — this sweep's forwarders recorded **0 dropped SYNs across all ≈1,134 connections**. The absorb path was therefore never exercised here, so these runs are **no new evidence** for or against the `4066c2f41` fix; they are evidence that the gate is green and stable, which is the claim VGATE-06 actually makes |
| D17-CI | CI's **literal** invocation: `CI=true PLAYWRIGHT_VISUAL=1 npx playwright test -c ./tests/playwright.config.ts --grep "@visual"` — no `--project`, no worker/retry override | none | playwright (in-container) · `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-det-ci --ci-literal` → `results.json`. **Expect 7 tests, not 4**: dependency projects are exempt from `--grep` (N-11) | `2e29bf632` — branch `feat-gsd-roadmap`, clean tree, **pinned for the whole sweep**: all five strict runs and the CI-literal run were taken at this one HEAD, and `git status --short` was empty before the first and after the last. Baselines compared against: `voter-results-desktop` `15dabda71245dbd8a975dfb6179932add208910e`, `voter-results-mobile` `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3`, `candidate-preview-desktop` `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc`, `candidate-preview-mobile` `8878188644373d9a6069c98b46819d4be546f2a5` — the same pinned HEAD as the five strict runs, taken immediately after them | n/a — playwright | **0** (`tests/e2e-runs/146-det-ci/exit` reads `0`) | **Selection, verbatim from `pw-args.txt`, with no `--project=` anywhere in it:** `test -c tests/playwright.config.ts --grep @visual --reporter=html,json`. `CI=true` confirmed in this run's own `docker-argv.txt:22`. **Posture read back from `results.json`, not restated from `playwright.config.ts`:** `config.workers` = **1**, and the `visual-regression` project's `retries` = **3** — the values the config's two `process.env.CI` branches (`playwright.config.ts:307,309`) produce, observed rather than asserted. `observed.txt` records `observed_workers=1` and `observed_retries=3,0`; the `,0` is the wrapper de-duplicating retry values across **all** projects in the config, where the `data-teardown-*` projects deliberately keep `retries: 0` — the three projects that actually ran alongside the captures are `data-setup-base` (3), `auth-setup` (3) and `visual-regression` (3), with `data-teardown-base` at 0. Counts: `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, `observed_duration_ms=81584`. **Seven tests, exactly as N-11 predicts** — `[data-setup-base]` 1,478 ms · `[auth-setup]` 4,521 ms · `Voter Results - Desktop @visual` 22,470 ms · `Voter Results - Mobile @visual` 21,423 ms · `Candidate Preview - Desktop @visual` 4,929 ms · `Candidate Preview - Mobile @visual` 5,522 ms · `[data-teardown-base]` 961 ms — all at **retry 0**, so none of the three available retries was consumed. Forwarder: `connections=168 re-dialled=0 gave-up=0`. Logs: `tests/e2e-runs/146-det-ci/stdout.log`, `results.json`, `observed.txt`, `pw-args.txt`, `docker-argv.txt`, `forwarder.log`, `exit` | **GREEN at CI's own selection — and the scope of that claim is stated rather than implied.** What transfers: the five strict runs measured the gate at `--retries=0`, and a result that survives zero retries survives a runner that allows three; this run confirms the harsher measurement also holds under the **invocation** CI issues, including the `--grep "@visual"` selection that pulls in three dependency projects `--project=visual-regression` would have named explicitly. What does **not** transfer: this is CI's *invocation*, **not CI's environment**. It ran in the pinned image on this macOS host against a host Vite dev server through the TCP forwarder; CI runs on a GitHub runner with its own Supabase, its own filesystem and its own contention. No row in this register is evidence about the CI runner, and this one must not be read as one — the CI half of that claim remains unobserved on this branch for the same reason Phase 137's did (`main.yaml` triggers on push/PR to `main`, and this branch is thousands of commits ahead of a stale `origin/main`), and discharges on the branch's first PR. **Disclosure:** the first attempt at this row was invoked **without** `--ci-literal` — an executor slip, not a gate failure — so it ran as a plain `--project=visual-regression --workers=1 --retries=0` run. It was **green** (7/7, exit 0, 82 s) and is retained unaltered at `tests/e2e-runs/146-det-ci-MISINVOKED/`; it is **not** counted as `D17-CI` and **not** counted among the five, and the row above is the correctly-invoked replacement. See § Residue |
| PF1-UNTOUCHED | `tests/tests/support/preflight.ts` and `tests/global-setup.ts` — the served-application integrity gate D-14 B proposed weakening and was **rejected** for | none — a source assertion over the phase's full commit range | git · `git diff --exit-code <phase-base>..HEAD -- tests/tests/support/preflight.ts tests/global-setup.ts`, plus `git hash-object` on both against § Restoration blob hashes | Range **`512aacc1e~1..HEAD`** — `512aacc1e` is the phase's first commit (`plan(phase-146): 146-01 …`) and `512aacc1e~1` is `bacf9d921`, the last commit before Phase 146 existed. HEAD at assertion: `03d793717` | n/a — git | **0** — `git diff --exit-code 512aacc1e~1..HEAD -- tests/tests/support/preflight.ts tests/global-setup.ts` **exits 0 and prints nothing** | **Both proofs, not one — the diff and the blob identity, because either alone is weaker than it looks.** (1) *Range proof:* the `git diff --exit-code` above spans the phase's **entire** commit range, from before `146-01` to this HEAD, and exits **0**. It rules out an edit-then-revert as much as a standing edit, because a diff over the endpoints of a range says the endpoints match — so (2) the *blob proof* is taken as well and pins the identity absolutely: `git hash-object tests/tests/support/preflight.ts tests/global-setup.ts` at HEAD returns `389197f038e3b53a6836ea467444d6097e134429` and `1c4a29d3326ae8c4a2573a0678fe84e6f3b40fab`, **character-for-character** the two values § Restoration blob hashes recorded at ledger creation (HEAD `0c3a26ab6`), before any run in this phase existed. The register's own § Restoration note singles these two paths out for exactly this: they are in that table *for the opposite reason to the others* — they are the ones that must never change. No log file is cited because there is none to cite: this row's instrument is git, and its evidence is reproducible from the commit graph by anyone at any later HEAD | **UNTOUCHED across the whole phase — which is the half of D-14 that matters, and the reason every other green in this register is admissible.** D-14 B proposed an env-var escape hatch that would let a run opt out of the served-application check; it was **rejected**, because `tests/global-setup.ts:19-21` deliberately refuses to punch that hole and an opt-out would make the gate assert nothing on precisely the runs that needed it. The mount moved instead — `-v "$PWD":"$PWD" -w "$PWD"`, the identical-path form `D14-OBS` observed from inside the container — and **this row is the evidence that nothing else did**. What it rules out is specific and it is the failure mode this phase was most exposed to: a run in `146-02` … `146-08` that went green because the preflight had been quietly relaxed to let it. Every `E2E PREFLIGHT OK` line quoted in `D14-OBS`, `EG2-SUITE`, `D17-R01` … `D17-CI` was emitted by **this** byte-identical preflight, so those lines mean what they say. Threat `T-146-05` (Tampering) is discharged here by measurement rather than by prose assurance, which the plan explicitly refused to accept |
| SS1-EMPTY | `tests/tests/specs/visual/` after the final **non-updating** run | none — the proof the gate **compared** rather than re-recorded | git · `git status --short tests/tests/specs/visual/` | `03d793717` — taken after `D17-CI`, the last of the eight container runs this plan took | n/a — git | **0** — `git status --short tests/tests/specs/visual/` **prints nothing** | **The observation and the invocation-side proof that makes it mean something.** (1) `git status --short tests/tests/specs/visual/` produces **no output** after the final non-updating run — the same check `136-06-SUMMARY.md:187-188` used for the same claim. (2) The directory holds five tracked files and all five are unmodified: `git hash-object` on the four PNGs in the working tree returns `voter-results-desktop` `15dabda71245dbd8a975dfb6179932add208910e`, `voter-results-mobile` `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3`, `candidate-preview-desktop` `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc`, `candidate-preview-mobile` `8878188644373d9a6069c98b46819d4be546f2a5` — identical to the values `146-07` committed and to the values `EG2-SUITE` and `D17-R01` … `D17-CI` name as what they compared against. (3) **No run in `146-08` passed `--update-snapshots` in any form**, checked rather than asserted: `grep -l "update-snapshots" tests/e2e-runs/146-egress-green/pw-args.txt tests/e2e-runs/146-det-run0*/pw-args.txt tests/e2e-runs/146-det-ci*/pw-args.txt` matches **nothing**, across all eight runs including the misinvoked one | **COMPARED, NOT RE-RECORDED — and this is one of the two rows that decide whether this phase's greens mean anything at all.** A visual gate that silently re-records its own references reports a perfect green and asserts nothing: every run would pass because every run would have just written the file it is about to read. `EG2-SUITE` plus the six D-17 runs are **seven** greens; the value of all seven rests on the four reference PNGs being byte-identical before the first and after the last, which is what the three checks above establish from three independent directions — porcelain status, blob identity, and the absence of the flag that could have caused it. Note the deliberate asymmetry with `146-07`: that plan **did** pass `--update-snapshots=all`, once, behind the egress block, and recorded it as a re-baseline; this plan passes it **never**. Together with `PF1-UNTOUCHED` above, this closes the two ways a phase like this could have manufactured a green — by weakening the gate that guards the runs, or by rewriting the truth the runs compare against. Threat `T-146-23` is discharged here |
| E2E1-SUITE | the full default E2E suite at the phase HEAD — the **cardinal** gate, run last, after the final revert | none — clean tree | `yarn test:e2e` on the host, after `yarn db:reset`, against one fresh preflight-verified dev server. **Re-derive the standing test count with `--list`; do not assume 134** | `03d793717` — product tree identical to `2e29bf632`, the HEAD the six D-17 runs and the egress-blocked run were taken at; the only commits between them are this ledger's | n/a — playwright (host, not turbo) | **0** | **135 passed (11.0 m) · 0 failed · 0 skipped · 0 flaky · 0 did-not-run.** Preconditions, in order: `yarn db:reset` (exit 0) and one dev server, **PID `31124`**, wildcard bind `*:5173`, started `2026-08-26 21:08:32` — the server recorded in this header's restart bullet, still the single listener on the port. Served-application gate: `E2E PREFLIGHT OK …/apps/frontend (verified against …)` appears **once**, `E2E PREFLIGHT FAILED` **zero** times. **Count re-derived from this run rather than assumed:** `npx playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe --list` → **`Total: 135 tests in 89 files`**, and the run executed `[135/135]`. Log: the run's console transcript, `E2E_EXIT=0` | **GREEN — and the count moved from the previously-recorded 134, which is explained rather than silently adopted.** `136-05-SUMMARY.md:175` records `Total: 134 tests in 88 files` and `134 passed (10.3m)` as the standing default-suite figure at v2.14 close. This run re-derives **135 in 89 files**. The +1 is **not drift and not this phase**: `137-VALIDATION.md:99-101` already recorded it — *"Phase 138 raised it to 135 by shipping `eperm07-term-trigger` as a permanent LEAF regression guard"*, confirmed there on 2026-08-14 by the same `--list` command, with the explicit note that *"a later reader comparing 134 to 135 is seeing that deliberate change, not drift."* Phase 146 added, removed and renamed **zero** default-suite tests, so 135 is the correct expectation and 134 is the stale one. **Why this row exists at all:** the visual project is excluded from `yarn test:e2e` by construction — `playwright.config.ts:388,411` declare `visual-regression` and its `auth-setup` dependency **only** when `PLAYWRIGHT_VISUAL` is set, and the script is `playwright test … --grep-invert @probe` with no such variable. That exclusion is precisely what makes this run the guard it is: the seven container greens above cannot mask a regression in the other 135 tests, and the 135 cannot mask one in the captures. This phase changed a **global** default — `staticSettings.font.url`, which every route in both apps renders under — so "the visual baselines still match" would be a weak claim on its own. **0 failed, 0 skipped, 0 flaky, 0 did-not-run** is the only result `CLAUDE.md` § E2E Hard Rule accepts, and it is the result |

### The egress block's boundary — read this before "hardening" it

**The block is name-scoped to exactly `fonts.googleapis.com` and `fonts.gstatic.com`, on purpose**, so
npm and every other host the container needs stay reachable; a future maintainer who hardens it to
`--network none` or to a broad DNS sink will sever the host stack the suite depends on, and the damage
will surface as a **Playwright failure** rather than as a network error — which is the most expensive
possible way to learn it (research Pitfall 8). `E1-CURL` and `E2-CHROMIUM` above are claims about those
two names and about nothing else.

### ⚠ `--egress-control-only` was added during `146-02`, and it is disclosed rather than back-dated

`146-01` shipped `tests/scripts/visual-container.sh` without a mode that can take the D-11 controls
**and stop**. It had no browser-level probe at all, and it emitted neither `curl-control.log` nor
`chromium-control.log` — the two artifacts `146-02` Task 3 is specified to produce. As written, the
only way to reach the `curl` control was to run a suite immediately behind it, which is precisely the
ordering D-11 forbids: the control exists to *license* a suite, so a control that presupposes one
licenses nothing.

The gap was closed **in `146-02`**, in its own commit `61b685523`, per `146-02-PLAN.md`'s
`<polarity>` instruction to fix a defect found here rather than retro-edit `146-01`:
`--egress-control-only` (a usage error without `--block-egress`, and alongside
`--project`/`--grep`/`--ci-literal`/`--update-snapshots-all`), the `/etc/hosts` capture into
`provenance.txt`, the `curl-control.log` transcript, and entrypoint step 2b's Chromium probe. A
**successful** Chromium navigation reuses the existing exit **6**, so the script's nine-code table is
unchanged. `146-01`'s verified source properties were re-checked after the edit and all hold: `bash -n`
on the script and on the extracted entrypoint, `--help` exit 0 carrying all nine codes, digest pin ×1,
tag reference ×0, identical-path mount ×2/×2, the `T-146-03` bind-scope grep still empty, and **zero**
bare `--update-snapshots` emissions.

**The first control run failed for a reason that had nothing to do with the block, and that is
recorded too:** the probe declared its target as `const URL`, which shadows the global `URL` class that
node's bundled undici dereferences while loading `fetch`, so the run died with
`ReferenceError: URL is not defined` several frames inside undici — with `curl` having already
correctly reported exit 7. The constant was renamed `TARGET` and a comment records why. Both rows above
are filled from the **second** run; the first produced no ledger cell.

### The count a passing capture cannot emit — why `B1-OLD` has a companion run

**`B1-OLD` asks for a number that the instrument it names is structurally incapable of producing.**
Under the shipped configuration `voter-results-desktop` **passes** with the injection live — that is
the entire finding — and `comparators.js:96` compares with a strict `count > budget`, so a
within-budget capture emits **no message**, attaches **no** `-actual`/`-diff` PNG, and leaves nothing
in `results.json` but `status: "passed"` and a trace. There is no flag that makes a passing
`toHaveScreenshot` report its count.

So the run was taken **twice, in the same injected state, back to back**, exactly as v2.14 did (its
run 2 at the shipped ratio gave the *verdicts*; its run 3 at zeroed tolerance gave the *counts*):

| Run dir | Config | Purpose | Result |
|---|---|---|---|
| `tests/e2e-runs/146-negctl-b1` | **shipped** `tests/playwright.config.ts`, untouched | the **verdicts** — `B1-OLD` and `B2-OLD` take their outcome from here and from nowhere else | 6 passed / 1 failed; desktop **passed**, mobile failed at 19,861 px |
| `tests/e2e-runs/146-negctl-b1-zero` | the measurement-only overlay (`maxDiffPixels: 0`) | the **magnitudes** only — it changes no verdict and appears in no verdict cell | 5 passed / 2 failed; desktop 16,650 px, mobile 16,689 px, both `candidate-preview` **0** |

The shipped configuration was **not touched** for either run: `git diff --exit-code --
tests/playwright.config.ts` exits 0 and its blob still hashes to the § Restoration value
`de1ae33ff7710898a43220056bb841f78ec23492`. The zero-tolerance knob existed only in the gitignored
overlay under `tests/e2e-runs/146-noise/`, which is the same overlay
`146-VISUAL-NOISE-LEDGER.md` § *The measurement configuration* reproduces verbatim.

### The v2.14 comparison — stated plainly, including the drift

`136-VISUAL-DISCRIMINATION-EVIDENCE.md` is cited here for **injection comparability only**; no cell
above takes its value from it. Read side by side:

| Measurement | v2.14 (136) | `146-03`, observed | Δ |
|---|---|---|---|
| desktop, zero tolerance | 19,484 px | **16,650 px** | −2,834 px (**−14.5 %**) |
| mobile, zero tolerance | 19,545 px | **16,689 px** | −2,856 px (**−14.6 %**) |
| mobile, shipped `0.01` | 18,926 px | **19,861 px** | +935 px (+4.9 %) |
| desktop − mobile gap *within* the zero-tolerance run | 61 px | **39 px** | — |
| desktop verdict at shipped `0.01` | **PASSES** | **PASSES** | unchanged |
| mobile verdict at shipped `0.01` | FAILS | FAILS | unchanged |
| `candidate-preview` pair | 0 px / 0 px | **0 px / 0 px** | unchanged |

**The verdicts reproduce exactly. The magnitudes drift, and the drift is not smoothed over.** Three
observations about its shape, recorded because they are information rather than noise to be excused:

1. **The drift is a whole-run property, not a per-baseline one.** Desktop and mobile moved by
   −14.5 % and −14.6 % — the same amount, in the same direction, in the same run — while the gap
   *between* the two baselines stayed tiny in both sessions (61 px then, 39 px now). Whatever moved,
   moved both captures together. That is consistent with a difference in *what was rendered* (how
   many entity cards carry a match score) rather than with a difference in *how it was rasterised*.
2. **Two consecutive runs in this session disagree by more than the phase expected.** Our own mobile
   figure is 19,861 px under the shipped config and 16,689 px in the zero-tolerance run taken minutes
   later against the same injected tree — **3,172 px apart**. The injected damage is therefore not a
   fixed quantity across runs, which is a fact about *this session's* run-to-run variability and a
   direct question for the 40-cell matrix that follows.
3. **Neither point weakens the finding.** `B1-OLD` does not rest on a magnitude; it rests on a
   verdict, and the verdict is unambiguous — 16,650 px is **35.3 %** of desktop's 47,155.2 px budget,
   and it would still pass at 19,484 px (41.3 %). The blindness is wide enough that a ±15 % swing in
   the damage does not reach the edge of it. The mobile half fails at both figures.

The `candidate-preview` pair sat at **exactly 0 px** in the zero-tolerance run, matching the v2.14
record and confirming the component is genuinely absent from those two captures — so the injection is
scoped to the two voter baselines, as designed.

### ⚠ `--config` was added to `visual-container.sh` during `146-03`, and it is disclosed rather than back-dated

`146-01` shipped `tests/scripts/visual-container.sh` with the Playwright config **hardcoded** —
`pw-args.txt` is assembled with a literal `tests/playwright.config.ts` and no flag can change it.
That is correct and deliberate for every verdict-bearing run in this phase, and it is why the default
is unchanged. But `146-03` Task 2 is specified to take ten in-container runs **"through
`visual-container.sh` with the overlay config"**, and `146-04` Task 1 needs the same for its
height-control overlay: as shipped, neither is expressible.

The gap was closed **in `146-03`**, in its own commit, following the `146-02` precedent rather than
retro-editing `146-01`. `--config <path>` resolves against the **repo root** and must stay inside it
(the repo root is the only thing mounted, so a config outside it does not exist in the container),
must exist on disk, and is emitted to Playwright in repo-root-relative form so `pw-args.txt` reads
identically on both sides of the container boundary. It is a **usage error** alongside `--ci-literal`
(which reproduces CI's invocation, and CI runs the shipped config) and alongside
`--egress-control-only` (which runs no suite, so the config it would have run is never used). Its
help text carries the F-146-P1/F-146-P2 warning, because an overlay that does not absolutise
`globalSetup` and its projects' `testDir`s fails **silently**.

Re-checked after the edit, all still hold: `bash -n` on the script exit 0, `--help` exit 0, five usage
errors returning **2** (`--config` with `--ci-literal`; with `--egress-control-only`; outside the repo
root; a nonexistent path; and `--config` as the final argument with no value), digest pin ×1, tag
reference ×0, identical-path mount ×2/×2, the `T-146-03` bind-scope grep still empty, and **zero** bare
`--update-snapshots` emissions.

**`B1-OLD` and `B2-OLD` were taken with the committed blob, before this edit existed.** The
verdict-bearing run `146-negctl-b1` ran script blob `4dea5f5cf28fc1f7f185a6644f9e2e71f4890de5` — the
`146-02` blob, unmodified. Only the magnitude-only companion run used the extended script
(`2a5420a25a418b1d9cd29af359bea49b188f55f9`). No verdict in this register depends on the change.

### ⚠ DEVIATION, operator-approved — the pre-catch baseline refresh in `146-04`

**This is a deviation from `146-04-PLAN.md` Task 2 as written, disclosed here rather than absorbed
silently.** It is the same mechanism `146-VISUAL-NOISE-LEDGER.md` § *The pre-matrix baseline refresh*
used in `146-03`, applied for the same reason, and reverted the same way.

**Why it was needed — the plan's proof would otherwise have been vacuous.** The tie-break fix
(`dbb704bd4`) changed the voter-results render order, so the **committed** voter baselines under
`tests/tests/specs/visual/__screenshots__/` still encode the pre-fix ordering and differ from a current
capture by a **fixed ~16,883 px**. Under `cap = 200` that stale delta alone fails both voter baselines
**with no injection present at all**. Task 2's required observation — "both voter baselines fail" —
would therefore have been trivially true and would have measured nothing about whether the cap catches
the injection. That is precisely the vacuous green the phase's standing acceptance rule exists to
prevent.

**What was done, exactly.** One snapshot-update run, in-container, through the same harness, on a
**clean** tree, refreshing the four expected PNGs **in the working tree only**:

```
tests/scripts/visual-container.sh \
  --run-dir tests/e2e-runs/146-negctl-c-rebase \
  --project visual-regression \
  --update-snapshots-all
```

Exit **0**, 7/7 passed, `observed_duration_ms=72939`, `stdout.log` carrying the preflight OK line.
**It rewrote exactly two files** — `voter-results-desktop.png` (`ea8316c50…` → `045cf6ae1…`) and
`voter-results-mobile.png` (`e42d1d753…` → `e7069bef3…`). The two `candidate-preview` PNGs came back
**byte-identical to their committed blobs** (`5b847d227…`, `fc19205d9a…` unchanged), which is an
independent confirmation of the pair's measured-zero drift and of the refresh having touched only what
was stale. All four captures kept their recorded dimensions (1280×3684, 390×4152, 1280×821, 390×924).

**It was fully reverted.** After the measurement run: `git checkout --` over the injection path and
over `tests/tests/specs/visual/__screenshots__/`; `git diff --exit-code` exit **0**; all four PNG blobs
back to their § *Restoration blob hashes* values; `git status --short tests/tests/specs/visual/`
**empty**; `git status --porcelain -- apps packages tests .github package.json yarn.lock` prints
nothing.

**`146-07` still owns the real, committed re-baseline**, after `146-05`/`146-06` change font rendering.
Nothing here pulls that forward: no refreshed pixel was committed, and the committed baselines at this
plan's close are byte-for-byte the ones it opened with.

**What the deviation costs, stated rather than papered over.** `C1-NEW`/`C2-NEW` are measured against
*refreshed* baselines while `B1-OLD`/`B2-OLD` were measured against *churned* committed ones, so the two
halves' **magnitudes are not commensurable** — see the divergence recorded in `C1-NEW`'s outcome. Their
**verdicts** are, because a verdict under each configuration is exactly what each half was taken to
establish, and the instrument (the injected blob) is provably identical across both.

### The host dev server changed PID between `146-02` and `146-03` — recorded here, as this header requires

The header above records PID `41925` (started `2026-08-25 22:38:56`), and the header also states that
**any restart is itself recorded here**. The server running from `146-03` onward is PID **`82314`**,
started **2026-08-26 10:42:42** local time, `vite dev --host 0.0.0.0`, wildcard bind
`node 82314 … TCP *:5173 (LISTEN)`. `146-03-SUMMARY.md` records that PID throughout its own session;
the register header was not updated at the time, and this section closes that gap rather than
back-editing the header.

**`146-04` did not restart it.** Same PID `82314` at this plan's open and close, **4 h 31 m** of
unbroken uptime at close, `http://localhost:5173/` → 200, the `/@fs/…/+layout.svelte` clause the
preflight actually tests → 200, and Supabase's REST root → 200. Every container run in this plan
carried the `E2E PREFLIGHT OK` line naming this checkout. **D-16's continuous-uptime requirement is
therefore intact from `82314` forward**, which is the window `146-07`'s anomaly attempts live in.

**The served application was current for these runs.** The server was built at `dbb704bd4` and the tree
had moved to `9a7e9a47e` before this plan started; `git diff --stat dbb704bd4..HEAD -- apps packages`
is **empty** — the three intervening commits touch only `tests/` and `.planning/` — so no restart was
required and none was taken.

### The `146-05` restart — planned, and D-16's continuity requirement is void as chartered

**The restart, recorded to the same standard as the header requires.**

| Field | Value |
|---|---|
| Old PID | `82314` (vite), wrapper `82313`; started `2026-08-26 10:42:42`, up **4 h 54 m** |
| Stopped | `2026-08-26 15:37:32` local, `kill 82314`; `lsof -nP -iTCP:5173 -sTCP:LISTEN` then empty |
| New PID | **`98287`** (vite), wrapper `98284`; Vite v6.4.1 |
| Started | `2026-08-26 15:37:44` local |
| Invocation | `yarn workspace @openvaa/frontend dev --host 0.0.0.0` — **not** `yarn dev --host 0.0.0.0` (N-10) |
| Bind | `node 98287 … TCP *:5173 (LISTEN)` — **wildcard**, the form reachable from the container |
| Port | `5173`, no `FRONTEND_PORT` override |
| HEAD at build time | `195ec8244` (Task 1's commit) **plus** the uncommitted one-string `font.url` edit that became Task 2's commit. `yarn build` ran at that tree state, 14/14 turbo tasks successful, **before** the stop |
| Served-app sanity | `/` → 200; `/@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte` → 200 (the clause the preflight tests) |

**Why the restart was required rather than avoidable.** `@openvaa/app-shared` is ESM-only and the
frontend resolves it to the built `dist/` (N-7). The `font.url` edit is invisible at runtime until
`yarn build` rewrites `dist/index.js` **and** the dev server picks the rebuilt module up. Skipping
either step is Pitfall 3: every remaining gate in the phase would pass while measuring **Google-served**
Inter. The positive check was taken and is recorded in `146-05-SUMMARY.md`.

**D-16 as chartered is now obsolete, and `146-07` must be re-scoped rather than executed as written.**
D-16 chartered a bounded (≤ 3 attempt) reproduction of the *"run-4 anomaly"* under **continuous**
dev-server uptime, on the premise that the anomaly might be an HMR/uptime phenomenon. It is not, and it
is no longer unexplained. Between `146-03` and `146-04` it was root-caused and fixed: the container's
outbound TCP SYN to `host.docker.internal` was intermittently dropped, stalling connections **36–68 s**
in Linux SYN backoff, while `tests/scripts/tcp-forward.mjs` dialled **once with no deadline**. Fixed in
`4066c2f41` (bounded re-dial) and `351981b4f` (the voter fixture now fails at the stalled navigation
instead of swallowing the timeout). See `.planning/debug/answer-surface-wait-timeout.md`.

Consequently:

- The `D16-A1` … `D16-A3` rows below were written as a **discovery** protocol for an unexplained
  failure. That failure now has a confirmed root cause and a landed fix, so the protocol as written
  measures nothing — three attempts to reproduce a bug that was fixed two plans ago will produce three
  non-reproductions whose meaning is already known.
- Continuous uptime is no longer an independent variable of anything, so **this restart costs the phase
  nothing**. It is recorded because the header's contract is that any identity change is recorded, not
  because a control depended on it.
- `146-07` should either **retire** the D-16 step outright (citing the fix commits) or **re-scope** it
  into a *regression* check — confirm the bounded re-dial holds under repeated runs — which is a
  different question with a different pass condition. It must not be executed as a discovery attempt.

### The D-12 guard was proven to FAIL, not merely to pass — two deliberate violations

A guard that has only ever been observed passing is indistinguishable from a guard that cannot fail.
Both of `guardThirdPartyFonts`' assertions were therefore violated on purpose and observed to fail **by
name**. Evidence dirs are throwaway under `tests/e2e-runs/` (gitignored); every run carried
`E2E PREFLIGHT OK` and used the shipped `tests/playwright.config.ts`.

| Demo | Violation injected | Run dir | Result |
|---|---|---|---|
| **Control** | none — committed state | `146-05-guardfail-control` | Guard **passed**; only `toHaveScreenshot` failed at **856 px**. Establishes that the two failures below are the injection, not the environment |
| **A — third-party host** | `@import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');` prepended to `apps/frontend/static/fonts/inter.css` (app stays healthy, stylesheet still 200) | `146-05-guardfail-3p2` | Guard **failed, naming the URL**, verbatim: `third-party font requests observed (VGATE-05 requires none): https://fonts.googleapis.com/css2?family=Roboto&display=swap` |
| **B — wrong same-origin path** | `font.url` → `/fonts/inter-alt.css` (a real 200-serving copy), rebuilt and restarted, so **real Inter still loads** | `146-05-guardfail-nopath` | **`settleFonts` PASSED** and the guard **failed by name**: `the same-origin Inter stylesheet /fonts/inter.css was never requested — staticSettings.font.url is not pointing at it`. This is the N-2 blindness closure demonstrated rather than argued — the run reached the guard only *because* `settleFonts` was satisfied |

**A first attempt at Demo A was masked and is recorded rather than discarded.** Importing Google's
**Inter** (not Roboto) put a face named `Inter` in the document whose `src` then failed, which is N-2
case **B** — so `settleFonts` fired first (`webfont Inter did not load`) and the guard never ran
(`146-05-guardfail-3p`). Importing a family the Inter check cannot see is what isolates the guard.

**A second attempt at Demo B, by deleting `inter.css` from disk, contaminated the suite — and produced
a finding worth keeping.** With the file absent, `/fonts/inter.css` does **not** 404 quietly: the
request falls through to the SvelteKit router, which renders a **full SSR error page — 201,586 bytes of
`text/html`** whose own `<head>` contains another `<link href="/fonts/inter.css">`. Served on every
navigation, that was enough to time out `auth-setup`'s login at 90 s, twice
(`146-05-guardfail-404`, `146-05-guardfail-404b`), before any visual test could run — while the control
run either side passed. So a wrong vendored path in **dev** is not a quiet degradation: it is loud, but
it is loud in the **wrong place**, breaking an unrelated setup project rather than saying "the font
stylesheet is missing". That makes the guard's by-name failure more valuable, not less.

### The N-2 blindness is CLOSED by measurement — `F2-BOGUS-RED` / `F3-BOGUS-GREEN`

**A broken same-origin font path now fails by name, and that is measured in both directions on one
byte-identical instrument.** With `staticSettings.font.url` pointed at `/fonts/inter.csss` — a
one-character fat-finger that really 404s — all four visual captures failed with
`the same-origin Inter stylesheet http://localhost:5173/fonts/inter.csss did not load: status 404`,
and **zero** of them failed as `Screenshot comparison failed`. On the restored tree the same guard is
silent on all four. Research N-2's truth table is re-observed on the application itself: `settleFonts`
**passed** throughout the RED half, because a 404 stylesheet registers zero `@font-face` rules and
`document.fonts.check('1em Inter')` then returns `true` vacuously.

**The fix is in the GUARD, not in `settleFonts`.** `settleFonts`' body is unchanged and stays unchanged
(D-10 A); it is `guardThirdPartyFonts`' `/fonts/inter.css` status-200 assertion that closes scenario A.
`settleFonts`' docblock still claims the protection it has never provided — that is the fifth stale
record claim, and **`146-09` corrects the wording**.

**Both branches of the guard's same-origin assertion are now covered**, by two different plans and two
different injections: `146-05`'s demo B pointed `font.url` at a **200-serving** copy and tripped the
*"never requested"* branch; `146-06`'s `F2-BOGUS-RED` 404s and trips the **status** branch. Neither
alone would have covered the other.

**Why this matters to `146-07` specifically:** its `--update-snapshots=all` run rewrites all four
committed PNGs. Without this assertion, a wrong vendored path during that run would record
**fallback-font pixels as the project's new committed truth**, silently and permanently — research
Pitfall 4's second and worse failure mode. The guard runs before every capture, so that run now cannot
start from a broken font path without saying so.

### The `146-06` restarts

Two, both required by `F2-BOGUS-RED`'s injection-and-revert cycle, recorded because the header's
contract is that any identity change is recorded — **not** because a control depends on continuity.
D-16's continuous-uptime requirement is void as chartered (§ *The `146-05` restart*, above): the
anomaly it was written for was root-caused to dropped container SYNs and fixed in `4066c2f41` +
`351981b4f`.

| Field | Injection restart | Revert restart |
|---|---|---|
| Old → new PID | `4037` → **`93764`** | `93764` → **`94791`** |
| Started | `2026-08-26 16:47:19` | `2026-08-26 16:49:35` |
| Invocation | `yarn workspace @openvaa/frontend dev --host 0.0.0.0` (**not** `yarn dev --host …`, N-10) | same |
| Bind / port | `node 93764 … TCP *:5173 (LISTEN)`, wildcard | `node 94791 … TCP *:5173 (LISTEN)`, wildcard |
| Build state served | HEAD `073fefc72` **plus** the one-string bogus `font.url`; `dist/index.js` carrying `inter.csss` and zero `inter.css` | HEAD `073fefc72`, clean tree; `dist/index.js` carrying `inter.css` and zero `inter.csss` |
| Served-app sanity | `/` → 200, `/@fs/…/+layout.svelte` → 200, `<head>` → `href="/fonts/inter.csss"`, that path → **404** | `/` → 200, `/@fs/…/+layout.svelte` → 200, `<head>` → `href="/fonts/inter.css"`, that path → **200** (2,279 B) |

**Why a restart was required both times rather than avoidable.** `@openvaa/app-shared` is ESM-only and
the frontend resolves it to the built `dist/` (N-7). Measured here rather than assumed: after
`yarn build` wrote the bogus URL into `dist/index.js`, the **running** server still served
`href="/fonts/inter.css"` — the rebuild alone did not propagate. Skipping the restart would have run
the whole RED half against the healthy application and produced a green control that proved nothing.

### The D-06 height control — how it was built, and why it took five passes rather than three

**Nothing committed, and no fifth baseline.** The control lived entirely under
`tests/e2e-runs/146-height-control/` (covered by `.gitignore:44`, outside `tests/tsconfig.json`'s
include and outside `tests/eslint.config.mjs`'s scope) as three throwaway files —
`playwright.height.config.ts`, `height-control.spec.ts`, `mode.json` — plus the two reference PNGs the
first pass wrote. **All five were deleted at task close**, after which
`git status --short tests/tests/specs/visual/` is **empty** and `tests/e2e-runs/146-height-control/` no
longer exists on disk. `pixelmatch`/`pngjs` were **not** used: every count above is Playwright's own
comparator, which is the only way the numbers stay commensurable with the register's other rows.

**The overlay changed exactly three things** beyond the shipped config: `snapshotPathTemplate` pointing
into the throwaway directory (so no reference could reach `__screenshots__/` — Pitfall 7 / the rejected
D-06 option C); `globalSetup` absolutised (F-146-P1); and every inherited project's relative `testDir`
absolutised against the base config's own directory, with one `height-control` project appended
(`devices['Desktop Chrome']`, viewport 1280×720, `dependencies: ['data-setup-base', 'auth-setup']`).
`--list` was taken **before** any capture and enumerated 5 tests in 4 files (F-146-P2).

**One mechanical deviation, disclosed:** the pass mode is read from a throwaway `mode.json` beside the
overlay rather than from environment variables, because `visual-container.sh` deliberately forwards only
`FRONTEND_PORT` / `PLAYWRIGHT_VISUAL` / `VC_*` into the container. Editing that committed script to
smuggle a control's knob through would have been a product byte this control does not need.

**Why five passes.** The plan specified three: clean/update, damaged under the new cap, damaged under
the old budget. Those ran as `146-height-p1`/`-p2`/`-p3` and produced 4 of the 8 verdicts. They did
**not** produce criterion 3's flip, and the reason is arithmetic: with the damage commensurable with the
D-07 injection (4,783 px, identical at both heights) the defect sits two orders of magnitude below both
ratio budgets and passes at both heights. A flip requires a defect inside the window the growth opens,
`(47,155.2, 72,755.2)` px. `146-height-p4`/`-p5` placed one there — a calibrated 1280×47 px opaque patch
measuring 59,507 px — and the flip was then **observed**: red at the natural height, green at the
lengthened one, under the ratio-only budget; red at both under the cap. Both the negative result at the
commensurable damage level and the positive result at the calibrated one are recorded in `H2-LONG`,
because reporting only the second would misrepresent what the injection-sized defect does.

### ROADMAP criterion 2 is discharged in BOTH directions

Four rows constitute it, all measured inside this phase, in the same container, against the same pinned
image digest, with the **same injected blob** `65a16a56667be18e653a231c994af15f110d4f10` on both sides:

- **Blind half** — `B1-OLD` (desktop **passes** the injection under the ratio-only budget) and
  `B2-OLD` (mobile fails in the same run), `146-03`, HEAD `09b08eaea`.
- **Catching half** — `C1-NEW` (desktop **fails** it under `maxDiffPixels: 200`) and `C2-NEW` (mobile
  fails), `146-04`, HEAD `badae5c04`.

The variable between the halves is `tests/playwright.config.ts` — and, disclosed above, the freshness of
the two voter baselines. The desktop verdict **flipped**; the mobile verdict **held**. The
`candidate-preview` pair passed in both halves and in all forty noise cells, so no verdict anywhere
moved for a reason other than the injection and the budget.

---

### `146-07` restarted nothing — recorded because the header's contract is that identity changes are recorded

The host dev server is unchanged across this entire plan: **PID `94791`**, started
`2026-08-26 16:49:35` local, `vite dev --host 0.0.0.0`, wildcard bind `node 94791 … TCP *:5173
(LISTEN)`, port `5173`, no `FRONTEND_PORT` override — the same process `146-06` handed over, verified
alive at plan close. No rebuild was needed either: `git diff --stat 073fefc72..HEAD -- apps packages`
(the server's build commit against this plan's starting HEAD) is **empty**, so the running server
serves bytes identical to the tree every capture was taken against. `146-07`'s own product change is
test-only (`tests/tests/utils/selectElection.ts`), which the Playwright process reads from the mount
rather than from anything the dev server serves.

**Two state changes `146-08` should know about, recorded rather than left to be discovered:**

1. **The database was reset twice and re-seeded**, by `tests/e2e-runs/146-DEF1/reset-db.sh` (gated on
   storage answering non-502, `public-assets` present, and zero `test-e2e-base-` candidates): once
   before the byte-stability loop and once before the baking run. Both attempts reported
   `RESET HEALTHY on attempt 1`. After the trace, `yarn db:seed --template e2e/base` re-seeded the 143
   base rows, because `146-g0-clean`'s `data-teardown-base` had emptied them and the production app
   renders an **error page** with no `app_settings` — the first `PT1-PRODTRACE` attempt was taken in
   exactly that state and was **discarded and re-run**, disclosed here rather than quietly replaced.
2. **A production server ran on port `4319`** for the duration of the trace and was stopped at task
   close (`lsof` empty, `curl` `000`). It never shared the dev server's port, so no trace request can
   have reached `5173` by accident.

---

### D-16 was re-scoped, and why — what the rows above are, and what they are not

**Recorded explicitly rather than left to be inferred, because `146-09` corrects the phase record and
needs this stated.**

**What D-16 originally asked.** `146-CONTEXT.md` § *Proving it (criteria 4 and 5)* chartered up to
three bounded attempts to reproduce the *"run-4 anomaly"* carried from v2.14 — the single unexplained
failure in `136-VISUAL-DISCRIMINATION-EVIDENCE.md:83-98`, whose failing test's name was never
captured. The protocol was six steps: read the dev server's uptime, prove the tree clean, inject
`MatchScore.svelte:30` `text-lg` → `text-2xl`, run, `git checkout --`, immediately re-run **without
restarting the server** — the continuously-running server being the independent variable, because
v2.14 named **Vite HMR staleness** as its leading hypothesis and flagged it UNCONFIRMED.

**Why it is obsolete.** The failure is no longer unexplained. Between `146-03` and `146-04` it was
root-caused and fixed, and the record is `.planning/debug/answer-surface-wait-timeout.md`: the
container's outbound TCP SYN to `host.docker.internal` is intermittently **dropped**, and the
connection then waits out Linux's exponential SYN-retransmission backoff — measured at **35,634 –
68,369 ms** on the connect leg while DNS stayed ≤ 1.4 ms and first byte ≤ 5.2 ms — because
`tests/scripts/tcp-forward.mjs` dialled the upstream **once, with no deadline**. Fixed in
**`4066c2f41`** (bounded re-dial) and **`351981b4f`** (the voter fixture now fails at the stalled
navigation instead of swallowing the timeout). The HMR hypothesis D-16 was built around is
**falsified** for the two phase-146 recurrences. Run as chartered, the three attempts would have
produced three non-reproductions of a bug fixed two plans ago — a ritual whose result is known in
advance, presented as evidence. Its statistical power would also have been derisory: three attempts
against an event seen once in five runs is roughly a **49 %** chance of reproducing it even if the
rate really were 20 %, so a clean sweep of three is **weak evidence of absence** and would have had to
be labelled as such.

**What was done instead.** A **regression check on the landed fix**, structured around the strongest
available signal, which that record identifies as *positive rather than an absence*: in its own
post-fix window the relay logged **121 dropped SYNs and absorbed every one** (96 recovered on dial 2,
19 on 3, 5 on 4, 1 on 5; zero given up), while stalls ≥ 30 s went **34 / 4,328 → 0 / 6,240**. The three
rows re-run that measurement at this HEAD: `D16-A1` the relay-level heartbeat (33 drops, 33 absorbed,
deepest ladder 4 of 8, worst request 3,036 ms against an 8,000 ms bound), `D16-A2` the suite-level
corpus (15 runs, 1,662 connections, 1 drop, 0 given up), `D16-A3` the paired host-direct control
(2,384 connections, max 55 ms, zero stalls) which is what rules out *the environment simply went
quiet*.

**Two limits carried forward honestly, neither of which this plan closed.**

1. **The original end-to-end symptom was never reproduced post-fix.** The chain from *"the stall is now
   ≤ 4 s"* to *"the fixture no longer fails"* is **mechanical** — every budget it could blow is ≥ 10 s
   — not empirically demonstrated at the symptom level. The root-cause record says so in as many words
   under § *Where the evidence falls short of what I would like*, and nothing here changes it.
2. **Docker Desktop's egress drops are unfixed and outside our control.** The relay absorbs them; it
   does not stop them. This session measured the drop rate **higher** than the pre-fix corpus did
   (1.47 % vs 0.786 % per connection), which is a reminder that the rate moves. A burst deeper than
   eight consecutive drops on one connection would still exhaust the ladder — and would fail loudly,
   with `gave-up=N` in `forwarder.log`, which is the signal to re-open the record. **CI is a different
   environment and does not use this relay at all**, so none of this evidence transfers to it.

**And the v2.14 linkage itself remains INFERRED, not established.** The old record did not retain
which test failed in run 4, so there is no signature to compare against. The dropped-SYN mechanism is
a *sufficient* explanation for "1 unexplained failure in 5 clean runs" without invoking HMR at all,
but *consistent with* is not *proven to be*. The honest count of directly attributed sightings remains
the four measured in the root-cause session's own corpus.

---

## Baseline re-capture

**Filled by `146-07` on 2026-08-26.** Baking run `tests/e2e-runs/146-rebaseline`, at HEAD
`bbbd626a9` with a clean tree; the resulting bytes are commit `dc064f591`. Invocation
`tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-rebaseline --update-snapshots-all
--block-egress`, which emits the literal `--update-snapshots=all` — `grep -o 'update-snapshots=all'
pw-args.txt` → **1**, `grep -c '^--update-snapshots$'` → **0**, so the bare `changed` form never
appeared. `observed_expected=7`, `observed_unexpected=0`, `observed_workers=1`,
`observed_retries=0`. `grep -c 'E2E PREFLIGHT OK' stdout.log` → **1**. Playwright printed
`… is re-generated, writing actual.` for **all four** images.

### The pre-write gate, both halves, before a single byte was written

A `--update-snapshots=all` run behind a broken font path writes fallback glyphs into the committed
directory and every gate afterwards passes against them — silently and permanently. Two independent
readings licensed the write:

| Control | Reading | Where |
|---|---|---|
| `guardThirdPartyFonts` green on all four captures | **12 consecutive in-container runs**, each `observed_expected=6 observed_unexpected=0` — 48 guard passes, zero third-party font URLs, `/fonts/inter.css` requested and 200 in each | `tests/e2e-runs/146-t0-focus/run1…12/run/{stdout.log,observed.txt}` |
| `document.fonts.size >= 1` | **4** — `Inter 400 normal status=loaded`, `Inter 700 normal status=loaded`, plus the two latin-ext faces `status=unloaded`; `document.fonts.check('1em Inter')` `true`; font resources fetched: `/fonts/inter.css`, `/fonts/inter-latin-400-normal.woff2`, `/fonts/inter-latin-700-normal.woff2` | `tests/e2e-runs/146-fontsize-probe/run/stdout.log`, line `FONTSIZE_PROBE {…}` |

The second reading is the one `settleFonts` cannot supply: with zero `@font-face` rules present,
`document.fonts.check('1em Inter')` returns `true` while `size` is `0` (research N-2). It was taken in
the pinned container, at this HEAD, against the same dev server every capture in this phase talks to,
through a throwaway overlay that absolutised `globalSetup` (F-146-P1) and carries the preflight's own
OK line.

**Why the two latin-ext faces read `unloaded`, and why that is correct.** `inter.css` declares four
`@font-face` rules — latin and latin-ext, at 400 and 700 — each with a `unicode-range`. A browser
fetches only the subsets whose ranges the page actually uses, so an English-locale capture pulls the
two **latin** woff2 files and leaves the latin-ext pair declared but unfetched. Four faces registered,
two files fetched. This is recorded here because `PT1-PRODTRACE` below observes the same 2-of-4 shape,
and a reader expecting four woff2 requests would otherwise read a subsetting optimisation as a defect.

### Structural closure of Pitfall 3, not discipline

The capture ran with `--block-egress`: `/etc/hosts` inside the container carried
`127.0.0.1 fonts.googleapis.com` and `127.0.0.1 fonts.gstatic.com` (read back from the run's own
`provenance.txt`), and the step-2 `curl` control ran **before** Playwright and **failed**, verbatim:
`curl: (7) Failed to connect to fonts.googleapis.com port 443 after 9 ms: Couldn't connect to server`,
`exit=7` (`tests/e2e-runs/146-rebaseline/curl-control.log`). So it is not a matter of trusting that the
capture used the vendored faces — Google-served Inter was **unreachable** while the pixels were taken.

### Before and after — byte size, dimensions, `git hash-object`

| Baseline | Dimensions before → after | Bytes before → after | `git hash-object` before → after |
|---|---|---|---|
| `voter-results-desktop.png` | 1280×3684 → **1280×3684** | 324,146 → **324,178** | `ea8316c5038d1ef9367fd20e9a910a7adec75959` → `15dabda71245dbd8a975dfb6179932add208910e` |
| `voter-results-mobile.png` | 390×4152 → **390×4152** | 308,340 → **308,377** | `e42d1d753b1cdc8681a612e254fbbef316b36cec` → `78d8fad28d06d7d550bf006a9d544f4e8f76e6a3` |
| `candidate-preview-desktop.png` | 1280×821 → **1280×821** | 81,763 → **81,775** | `5b847d227fd0d881a00f2a67ead1e44d443a9496` → `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc` |
| `candidate-preview-mobile.png` | 390×924 → **390×924** | 68,489 → **68,497** | `fc19205d9a7d7eaf35027cfd335100394bd5c1aa` → `8878188644373d9a6069c98b46819d4be546f2a5` |

**All four dimensions are unchanged**, which is the expected result and is checked mechanically rather
than eyeballed (the IHDR width/height are read out of the PNG header, not out of a filename). A
dimension change here would have been a finding — it would mean the page's layout moved, which nothing
this phase landed should cause at unchanged metrics.

The new sha256s, for the record: `voter-results-desktop`
`3a775029625b3bb8ed76bcfe189454f80d1889e7bb5786c7830d378257025682` · `voter-results-mobile`
`abece0506e12719c03d9317f8ccbe9f0e7d189c81433f56b1967eae7661aaa43` · `candidate-preview-desktop`
`ed8aa7c6ac72201fac0040f05605e7676c78bced92ddff3a548c5de33d60e411` · `candidate-preview-mobile`
`18bd286a29d9c96f6d3f9987a6260cf123acf1cfaeb5215682e829e87433150e`.

### What changed, against `146-06`'s per-baseline font delta — both directions

Raw **exact** RGBA comparison (stricter than pixelmatch at any threshold) of each old committed
baseline against its replacement:

| Baseline | `146-06` font delta (scored, zero tolerance) | Exact differing px, old → new | Reading |
|---|---|---|---|
| `voter-results-desktop` | 11,615 px — **the stale tie permutation, not the font** | **31,540** | The permutation clears. Content, not rasterisation |
| `voter-results-mobile` | 11,601 px — same | **31,387** | Same |
| `candidate-preview-desktop` | **0 px** | **159** | A **zero-delta image that nonetheless changed hash** — see below |
| `candidate-preview-mobile` | **0 px** | **159** | Same |

**Both directions are informative, and both are recorded, because the plan asked for both.**

- *Images with a non-zero delta changed:* the two voter baselines, as expected. They carried the
  arbitrary tie permutation the committed PNGs still encoded, fixed in the product by `53002b6a9` +
  `dbb704bd4`. This is the change the re-baseline exists for.
- *Images with a **zero** delta ALSO changed:* both `candidate-preview` captures moved by exactly
  **159** raw pixels each — and that number is not new. `146-VISUAL-NOISE-LEDGER.md` § *The four
  counts* recorded precisely it: *"the remaining 159 raw pixels carry per-channel deltas of 6-7
  (max 44) and pixelmatch does not score any of them."* So the pair's `0 px` is a statement about the
  **comparator**, not about the bytes: sub-threshold anti-aliasing residue from the variable→static
  delivery switch is real, reproducible, and invisible to the gate at `threshold: 0.2`. Recording it
  as "0 px, so nothing changed" would have been wrong in a way that only shows up as an unexplained
  hash change later.

**The re-baseline therefore absorbs the tie permutation — and must not be described as absorbing a
font change.** `146-06` measured the variable→static switch at **0 scored px** on the only pair
sensitive enough to see it, i.e. N-1 resolved **in the negative**. Re-capturing the candidate pair was
harmless but not corrective.

### Byte-stability of what was committed — measured, not assumed

Before the baking run, the same four captures were taken **12 times** at a fixed HEAD into a throwaway
sink (`snapshotPathTemplate` redirected; the committed directory never read or written, verified with
`git status` after each). **All 12 runs produced one sha256 per baseline**, and those four hashes are
byte-identical to what `--update-snapshots=all` subsequently wrote — so the committed bytes are the
bytes measured stable, not a thirteenth sample that happened to land.

That is a change of state, not a restatement. Before `146-07`, the two voter baselines flipped between
**two** variants across runs at a fixed HEAD (8 blue / 4 black in 12 runs), diagnosed in
`.planning/debug/seed-determinism-across-resets.md`: the `/results` election chip rendering
`focus:text-primary` blue or near-black depending on whether the walk had to perform a real
election-switch navigation, whose `afterNavigate` rAF focus reset stole focus from the just-clicked
option button. `tests/tests/utils/selectElection.ts` now converges that focus state (commit
`2df2d0b28`, test-only; the product's NAVA11Y-02 focus reset is deliberately untouched). Post-fix, over
12 runs in which **both** interaction paths occurred — 3 runs took the 2-navigation path and 9 the
1-navigation path — every capture is byte-identical. The committed capture is byte-identical to the
pre-fix *unfocused* variant (0 exact differing pixels) and differs from the *focused* one by the same
291×17 px band.

**The honest bound on that claim.** Under the pre-fix model the path→hash map was deterministic
(12/12), so sampling both paths with identical bytes falsifies it outright. Under a weaker "some
residual ⅓ flip survives" model, 12 identical runs give `(2/3)¹²` ≈ **0.008**, i.e. the null is
rejected at about the 1 % level. What 12 runs **cannot** exclude is a third, rarer variant — the same
blind spot the debug record names for its own 12 — and this is one host and one image digest.

---

## Gates

**All at one HEAD — `03d793717`** — with the **product tree** asserted clean before the first gate and
after the last, and `yarn test:e2e` **last** as the cardinal gate. Every turbo-mediated gate was run
with `TURBO_FORCE=true` and reports `0 cached`: a replayed exit code is a claim about a *previous*
tree, and this section's whole purpose is to be a claim about *this* one. `03d793717` is the HEAD the
egress-blocked run, the six D-17 runs and the full suite were all taken at; the only later commit is
this ledger's own, which writes zero product bytes.

| # | Gate | Command | Exit | Result |
|---|---|---|---|---|
| 1 | build | `TURBO_FORCE=true yarn build` | **0** | 14/14 tasks · `0 cached, 14 total` — forced, not replayed |
| 2 | lint + typecheck (the script chains `turbo run lint`, root `eslint tests`, `yarn typecheck:tests`, `yarn typecheck`) | `TURBO_FORCE=true yarn lint:check` | **0** | 22/22 tasks · `0 cached, 22 total` · **0 errors** · **20 warnings, all pre-existing and unchanged**: `@openvaa/core` 2, `@openvaa/dev-seed` 15, `@openvaa/frontend` 1, root `tests` 2 (the `no-console` unused-disable at `mockOidcIssuerEntry.ts:33` plus one) — the same 20 `145-NEGATIVE-CONTROL-LEDGER.md` § the seven gates recorded · `svelte-check`: **0 errors, 0 warnings** |
| 3 | format | `yarn format:check` | **0** | `All matched files use Prettier code style!` — both passes |
| 4 | unit | `TURBO_FORCE=true yarn test:unit` | **0** | 25/25 tasks · `0 cached, 25 total` · **173 test files** · **1,832 tests** · 0 failed · 0 skipped |
| 5 | egress-blocked visual run (**VGATE-04**) | `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-egress-green --block-egress` | **0** | 7/7 · 0 unexpected · 0 flaky · 74,429 ms — behind a `curl` control that **failed first** with exit **7** (`EG1-CURL`) |
| 6 | determinism, 5 strict runs (**VGATE-06**) | `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-det-run0{1..5}` at `--workers=1 --retries=0` | **0** ×5 | 7/7 each · 35/35 total · 0 unexpected · 0 flaky · **0 retries consumed** · 71,164 / 71,827 / 74,616 / 108,063 / 82,964 ms. Run 4's excursion is diagnosed in its row, not waved through |
| 7 | determinism, CI-literal | `tests/scripts/visual-container.sh --run-dir tests/e2e-runs/146-det-ci --ci-literal` | **0** | 7/7 · `CI=true` · `--grep @visual` · **no `--project=`** · `config.workers` **1**, `visual-regression` `retries` **3** read back from `results.json` · 81,584 ms |
| 8 | integrity — the served-application gate | `git diff --exit-code 512aacc1e~1..HEAD -- tests/tests/support/preflight.ts tests/global-setup.ts` | **0** | No output. Blob identity also equal to § Restoration (`PF1-UNTOUCHED`) |
| 9 | integrity — baselines compared, not re-recorded | `git status --short tests/tests/specs/visual/` | **0** | **Empty**, after the final non-updating run; no run in `146-08` passed `--update-snapshots` in any form (`SS1-EMPTY`) |
| 10 | integrity — **no dependency was added by this phase** | `git diff --exit-code 512aacc1e~1..HEAD -- package.json yarn.lock` | **0** | No output across the phase's **full commit range**. Threat `T-146-SC` discharged: the four woff2 files were vendored as static assets from `@fontsource/inter@5.3.0`, **not** by adding a runtime dependency, so there is no install to audit and no package name to verify |
| 11 | integrity — clean tree | `git status --porcelain -- apps packages tests .github package.json yarn.lock` | **0** | No output, before gate 1 and after gate 12 |
| 12 | **E2E, cardinal, last** | `yarn test:e2e` | **0** | **135 passed (11.0 m) · 0 failed · 0 skipped · 0 flaky · 0 did-not-run**, after `yarn db:reset` (exit 0) against dev server PID `31124`. `--list` → `Total: 135 tests in 89 files` — re-derived, and the move from the previously-recorded 134 explained in `E2E1-SUITE` |

---

## Final counts

**Every number this phase states anywhere is derived ONCE, here, from the register above at the closing
HEAD `03d793717`.** `REQUIREMENTS.md`, `ROADMAP.md`, `146-09`'s record corrections and every plan
summary **cite this section and do not re-derive**. Phase 143 lost a plan cycle to counts that moved
between measurement and statement; that is the failure this rule exists to prevent.

### The register

| Count | Value |
|---|---|
| **Total register rows** | **29** |
| Pairs | **5** — `D07-DESKTOP` (`B1-OLD`/`C1-NEW`) · `D07-MOBILE` (`B2-OLD`/`C2-NEW`) · `D06-HEIGHT` (`H1-SHORT`/`H2-LONG`) · `D12-GUARD` (`F2-BOGUS-RED`/`F3-BOGUS-GREEN`) · `D11-EGRESS` (`EG1-CURL`/`EG2-SUITE`) |
| **Measured halves in those pairs** (5 × 2) | **10** |
| **Non-pair rows** | **19** — 10 + 19 = 29 |
| must-FAIL rows whose **failure is the pass** | **4** — `E1-CURL` (exit 7) · `E2-CHROMIUM` (`ERR_CONNECTION_REFUSED`) · `EG1-CURL` (exit 7) · `F2-BOGUS-RED` (4/4 captures red by name) |
| Deferred rows | **0.** No row in this register carries a `pending` cell or a deferred outcome |
| Gate rows | **12** — gates 1 … 12 in § Gates, all exit **0** at one HEAD |
| **Measured in THIS phase** | **29 of 29 — every row.** Not one cell is inherited from another phase, from `146-RESEARCH.md`'s measurement tables, or from `136-VISUAL-DISCRIMINATION-EVIDENCE.md` |
| **Borrowed observations** | **0.** Every row carries its own log path and the HEAD its own half was measured at |
| **Cache replays admitted as evidence** | **0.** No row is turbo-mediated; each records `n/a — <instrument>` and that cell is never blank. Every turbo-mediated **gate** was run under `TURBO_FORCE=true` and reports `0 cached` |
| **Placeholder cells remaining** | **0** — a checked number, not an assurance: the row-anchored grep at the closing HEAD returns **0** (see § Completeness) |
| Failed / discarded attempts disclosed rather than deleted | **3** — the `146-03` run voided by a run-4-shaped timeout and replaced; `146-04`'s operator-approved pre-catch baseline refresh; and `146-08`'s misinvoked first `--ci-literal` attempt (§ Residue). None was retried silently to green |
| Decisions **re-scoped** rather than executed as chartered | **1** — **D-16**, disclosed in full in § *D-16 was re-scoped, and why* |

**Rows per plan**, derived from the commit graph rather than from prose — each plan cleared only its
own rows, so the falling placeholder count is an assertion about history and not a claim this document
makes about itself. Each figure below was read back with `git show <commit>:<this file>` piped through
the row-anchored grep of § Register, never copied from a plan summary:

| Plan | Clearing commit | Rows cleared | Which | Register placeholder count after |
|---|---|---|---|---|
| — (creation) | `3b98ca71a` | — | all 29 rows pre-written, 5 cells each | **145** |
| `146-01` | — | **0** | takes no measurement at all; writes zero product bytes | **145** |
| `146-02` | `15516a78c` | **3** | `D14-OBS`, `E1-CURL`, `E2-CHROMIUM` | **130** |
| `146-03` | `360be0e0a` | **2** | `B1-OLD`, `B2-OLD` | **120** |
| `146-04` | `7be721491` | **5** | `C1-NEW`, `C2-NEW`, `H0-GROWTH`, `H1-SHORT`, `H2-LONG` | **95** |
| `146-05` | — | **0** | vendors the font whose effect `146-06` measures | **95** |
| `146-06` | `0170d2bb6` | **3** | `F1-DELTA-PRE`, `F2-BOGUS-RED`, `F3-BOGUS-GREEN` | **80** |
| `146-07` | `b92a53305` | **5** | `G0-CLEAN`, `D16-A1`, `D16-A2`, `D16-A3`, `PT1-PRODTRACE` | **55** |
| `146-08` | `2e29bf632` | **2** | `EG1-CURL`, `EG2-SUITE` | **45** |
| `146-08` | `03d793717` | **6** | `D17-R01` … `D17-R05`, `D17-CI` | **15** |
| `146-08` | *this commit* | **3** | `PF1-UNTOUCHED`, `SS1-EMPTY`, `E2E1-SUITE` | **0** |

0 + 3 + 2 + 5 + 0 + 3 + 5 + 2 + 6 + 3 = **29**. The count fell 145 → 130 → 120 → 95 → 80 → 55 → 45 →
15 → 0, and every intermediate value above was **read out of the commit graph**, not asserted.

### Pairs by outcome class

| Class | Count | Pairs |
|---|---|---|
| Standard **blind → catch** (OLD half against the ratio-only budget, NEW half against the cap, same injection, same image digest, same container recipe, instrument identity proven across the two) | **2** | **`D07-DESKTOP`** — `B1-OLD` **passed** the 16,650 px injection under a 47,155.2 px height-scaled budget, `C1-NEW` **fails** it under `maxDiffPixels: 200`. **`D07-MOBILE`** — the same injection on the shorter capture, which failed under the old budget too. Together they are ROADMAP criterion 2 in both directions: the desktop pair shows the blindness *and* its repair, the mobile pair shows the repair did not come at the cost of what already worked |
| **Height-independence** pair — one absolute injection, two capture heights of the **same** route, at one HEAD; what differs is the page height and the point is whether the budget moved with it | **1** | **`D06-HEIGHT`** — `H1-SHORT` / `H2-LONG`: 59,507 px **passes** the lengthened capture and **fails** the natural one under the ratio-only budget, and **fails both** under the cap. ROADMAP criterion 3, discharged as a measurement rather than as an argument from the formula |
| **Guard RED/GREEN** pair — the instrument proven to fail before it is trusted to pass, byte-identical spec across both halves | **1** | **`D12-GUARD`** — `F2-BOGUS-RED` (a 404 `font.url`: all four captures red, **by name**) / `F3-BOGUS-GREEN` (the committed path: the guard passes). Closes the N-2 blindness in **both** directions — `settleFonts` alone reports `document.fonts.check('1em Inter') === true` with zero `@font-face` rules present |
| **Control → licensed claim** pair — a must-FAIL control taken **before**, in the same session, whose failure is what makes the green admissible | **1** | **`D11-EGRESS`** — `EG1-CURL` (exit **7**, 4 s before the suite started) / `EG2-SUITE` (7/7 green behind the blackhole). Without the first, the second proves nothing; `visual-container.sh`'s exit-6 abort makes the ordering structural rather than procedural |
| **Total** | **5** | |

### Non-pair rows

| Row(s) | What they are | Result |
|---|---|---|
| `D14-OBS` | The D-14 identical-path mount, verified **by observation from inside the container** rather than by reasoning about paths | **GREEN — the mount moved, the gate did not.** `E2E PREFLIGHT OK` with the echoed frontend root character-identical to the host's `"$PWD"/apps/frontend`, and with **zero** preflight edits |
| `E1-CURL`, `E2-CHROMIUM` | The D-11 **mechanism** controls: that `--add-host` blackholing works at all, at the resolver layer *and* at the browser layer | Both **FAILED, which is the pass.** `curl: (7) … after 10 ms` (connect, not resolve) and `net::ERR_CONNECTION_REFUSED` (Chromium honours `/etc/hosts`). Chromium needed its own row: it has its own resolver path, and if it routed around `/etc/hosts` every VGATE-04 claim here would be vacuous |
| `H0-GROWTH` | The growth measurement the height pair rests on — that the lengthened capture really is taller | **0**, clean; the lengthening is real and measured, not assumed |
| `F1-DELTA-PRE` | The N-1 variable→static font delta, measured **after** the font landed and **before** the re-baseline — the one window in which the comparison existed | **DIAGNOSTIC. 0 px** on both `candidate-preview` baselines, so research's falsification criterion was **not** met and D-09 A's neutrality claim survives measurement. The voter pair's 11,615 / 11,601 px is the **stale tie permutation**, not the font |
| `G0-CLEAN` | The clean-tree D-07 half taken from a **non-updating** run after the re-baseline | **0** · 7/7 · `git status --short tests/tests/specs/visual/` empty afterwards |
| `D16-A1`, `D16-A2`, `D16-A3` | ⚠ **RE-SCOPED, not executed as chartered.** The HMR-staleness hypothesis D-16 was written around is **falsified**; the run-4 anomaly was root-caused to dropped egress SYNs and fixed in `4066c2f41` + `351981b4f`, so the three rows became a regression check on the landed fix | **PASS, with the low-power arm labelled as such.** 2,239 connections · **33** dropped SYNs · **33** absorbed · **0** given up · worst request 3,036 ms against an 8,000 ms bound. Drop rate **1.47 %** — nearly **double** the pre-fix 0.786 %: the defect is louder, not quieter, and was still absorbed every time. `D16-A3` exonerates the dev server by paired host-direct control. **What it does not show is in § Residue** |
| `PT1-PRODTRACE` | The D-12 second half — one recorded **production-build** network trace, because VGATE-05 says *"the production app"* and the suite drives the dev server | **477 requests across exactly two hosts · ZERO third-party font requests observed.** Deliberately *not* the claim *"zero occurrences in the build"*: `grep -rn "fonts.googleapis" apps/frontend/build/` returns **7** hits across 5 files, forever and correctly, because the Google URL survives as the documented `??` customization fallback. **Two scope caveats are carried to `146-09` in § Residue** |
| `D17-R01` … `D17-R05` | The five strict determinism runs, `--workers=1 --retries=0`, consecutive, one pinned HEAD | All **0** · 35/35 · 0 unexpected · 0 flaky · **0 retries consumed**. Run 4's +23 s excursion diagnosed to context teardown, with `re-dialled=0` ruling out the SYN defect |
| `D17-CI` | The sixth run, at CI's **literal invocation** | **0** · 7/7 · `workers` 1 and `retries` 3 read back from `results.json`. **CI's invocation, not CI's environment** — no row here is evidence about the GitHub runner |
| `PF1-UNTOUCHED`, `SS1-EMPTY` | The two **structural** rows: they measure whether the greens above were earned, not the application | Both **hold.** Phase-range `git diff --exit-code` at **0** *and* both blobs equal to § Restoration; `git status --short tests/tests/specs/visual/` **empty** with no `--update-snapshots` in any of the eight runs. Together they close the two ways this phase could have manufactured a meaningless green |
| `E2E1-SUITE` | The cardinal gate — the default suite, which **excludes** the visual project by construction | **135 passed · 0 failed · 0 skipped · 0 flaky · 0 did-not-run** (11.0 m). Count re-derived (`Total: 135 tests in 89 files`); the move from the recorded 134 traced to Phase 138's `eperm07-term-trigger`, not to this phase |

---

## Completeness

**This register's corpus is exactly 29 rows.** The count is asserted here, about this document, in the
manner 143, 144 and 145 asserted theirs — **a corpus that is not asserted about itself can be quietly
extended, and an extended corpus is no longer a negative control.**

29 rows × 5 measurement cells = **145** placeholder occurrences at creation. Each plan clears only its
own rows, so the running count is itself an assertion.

| Class | Count | Rows |
|---|---|---|
| D-14 mount observation | **1** | `D14-OBS` |
| egress controls (must-FAIL) | **3** | `E1-CURL`, `E2-CHROMIUM`, `EG1-CURL` |
| OLD / blind halves | **2** | `B1-OLD`, `B2-OLD` |
| NEW / catch halves | **2** | `C1-NEW`, `C2-NEW` |
| height-independence control rows | **3** | `H0-GROWTH`, `H1-SHORT`, `H2-LONG` |
| font-delta diagnostic | **1** | `F1-DELTA-PRE` |
| guard proof pair (RED / GREEN) | **2** | `F2-BOGUS-RED`, `F3-BOGUS-GREEN` |
| clean-tree D-07 half | **1** | `G0-CLEAN` |
| anomaly-reproduction attempts | **3** | `D16-A1`, `D16-A2`, `D16-A3` |
| production-build trace | **1** | `PT1-PRODTRACE` |
| egress-blocked suite (VGATE-04) | **1** | `EG2-SUITE` |
| determinism runs | **6** | `D17-R01` … `D17-R05`, `D17-CI` |
| source-assertion rows | **2** | `PF1-UNTOUCHED`, `SS1-EMPTY` |
| cardinal E2E gate | **1** | `E2E1-SUITE` |
| **= total register rows** | **29** | |

1 + 3 + 2 + 2 + 3 + 1 + 2 + 1 + 3 + 1 + 1 + 6 + 2 + 1 = **29**. The arithmetic closes, and it closes
against the register's **actual** row count measured by the anchored pattern given above § Register —
`grep -cE '^\| (…) \|'` → **29**. Asserted, not assumed.

**Rows owned by each plan** — the sum of these is the corpus, and each plan clears only its own:

| Plan | Rows | Count |
|---|---|---|
| `146-02` | `D14-OBS`, `E1-CURL`, `E2-CHROMIUM` | 3 |
| `146-03` | `B1-OLD`, `B2-OLD` | 2 |
| `146-04` | `C1-NEW`, `C2-NEW`, `H0-GROWTH`, `H1-SHORT`, `H2-LONG` | 5 |
| `146-06` | `F1-DELTA-PRE`, `F2-BOGUS-RED`, `F3-BOGUS-GREEN` | 3 |
| `146-07` | `G0-CLEAN`, `D16-A1`, `D16-A2`, `D16-A3`, `PT1-PRODTRACE` | 5 |
| `146-08` | `EG1-CURL`, `EG2-SUITE`, `D17-R01` … `D17-R05`, `D17-CI`, `PF1-UNTOUCHED`, `SS1-EMPTY`, `E2E1-SUITE` | 11 |
| **Total** | | **29** |

3 + 2 + 5 + 3 + 5 + 11 = **29**. `146-01` (this plan) and `146-05` own **no** rows: `146-01` takes no
measurement at all, and `146-05` vendors the font whose effect `146-06` measures.

### Every cell must be filled from a run that executed

**Placeholder CELLS remaining in this register: exactly 0.** Checked, not asserted, with the
row-anchored pattern of § Register at the closing HEAD:

```
grep -E '^\| (D14-OBS|E1-CURL|…|E2E1-SUITE) \|' 146-NEGATIVE-CONTROL.md | grep -o 'pending' | wc -l
```

→ **0** (was **145** at creation). The same pattern with `grep -c` returns **29**, the corpus. Every
intermediate value on the way down — 130, 120, 95, 80, 55, 45, 15 — was read back with
`git show <commit>:<this file>` piped through that same pattern, and is tabulated per plan in
§ Final counts. Not one of those figures was copied from a plan summary.

**Count `pending` with the anchored pattern, never with a bare `grep -o`.** A bare
`grep -o 'pending' … | wc -l` over this file returns a non-zero number **forever**, and every one of the
extras is *prose*: the header sentence at the top that defines the placeholder word, the
precedent-chain sentence, § Register's own explanation of the 29 × 5 = 145 arithmetic, and the grep
example in that block — which necessarily contains the word it searches for. The anchored form counts
**cells**; the bare form counts the documentation of the convention as if it were unfinished work. The
sibling `146-VISUAL-NOISE-LEDGER.md` makes the identical distinction, in its own § Completeness, for
the identical reason. **`146-08`'s plan `<verify>` block specifies the bare form**; that is a defect in
the check rather than in this file, and it is carried to `146-09` in § Residue rather than "fixed" by
mangling the prose the register needs.

**The four counts 145 closed with, restated for this register:**

| Property | Value |
|---|---|
| Borrowed observations | **0.** No cell carries an observation taken by another phase, another session, `146-RESEARCH.md`'s measurement tables, or `136-VISUAL-DISCRIMINATION-EVIDENCE.md`'s |
| Cache replays admitted as evidence | **0.** No row is turbo-mediated; every `Cache verdict` cell reads `n/a — <instrument>` and none is blank. Every turbo-mediated **gate** ran under `TURBO_FORCE=true` with `0 cached` |
| Deferred rows that say so | **0.** Unlike `145`'s `CI1`, no row here is deferred — but see § Residue for the **claims** that remain unobserved, which are recorded as scope limits on filled rows rather than as empty cells |
| Failed / discarded attempts disclosed rather than deleted | **3** — `146-03`'s voided timeout run, `146-04`'s operator-approved baseline refresh, `146-08`'s misinvoked `--ci-literal` attempt. Each is named, retained on disk, and excluded from the counts it would have inflated |

---

## Record corrections

**Written by `146-09`, after the gates were green — never before.** `146-08` recorded them green at
HEAD **`5bb95083e`** (the build the host dev server `31124` was launched from) with the eight container
runs pinned at `2e29bf632` / `bffc8fde7` / `03d793717`: the `curl` control failing first at `exit=7`,
the egress-blocked visual project **7/7 green**, six determinism runs at **exit 0 with zero retries
consumed**, the four baseline blobs unmoved, and the cardinal suite at **135 passed / 0 failed /
0 skipped / 0 flaky / 0 did-not-run**. A correction that lands before its evidence is a claim, not a
correction; this is the Phase 143/144/145 ordering, and it is why this section is written last.

**The plan chartered five rows.** The phase falsified more than it anticipated: eight further claims
were disproved between `146-03` and `146-08`, and they are recorded here rather than left in the plans
that made them. Where a correction contradicts `146-09-PLAN.md`'s own text, the plan's expectation is
**superseded** and said to be so — restating the plan's assumption alongside its disproof is how a
falsified premise survives into the next phase.

Every `Disproof` cell cites a file and line, a commit, or a ledger row ID. None cites prose.

| Claim | Where | Status before | Disproof | Corrected in |
|---|---|---|---|---|
| **1.** `auth-setup` cannot authenticate against the base dataset — the visual project's recorded opt-in reason. *(D-18 A, item 1 of 4 — reviewed)* | `tests/README.md:185`, the `visual-regression` row of the Opt-in table | True when written; **false since Phase 136** | `tests/tests/setup/shared/auth.setup.ts:82-84` — `SupabaseAdminClient.unregisterCandidate` then `.forceRegister` of base CA-AA-1, which is also what makes re-runs idempotent | `146-09` Task 1 — `04e91b221` |
| **2.** Screenshot baselines live under `tests/specs/__screenshots__/`. *(D-18 A, item 2 of 4 — reviewed)* | `tests/README.md:185`, same cell | **Never true** — that directory has never existed | `tests/playwright.config.ts:294` (`snapshotPathTemplate`) composed with `:415` (the visual project's `testDir`) resolves to `tests/tests/specs/visual/__screenshots__/`, which is where `git ls-files` finds all four tracked PNGs | `146-09` Task 1 — `04e91b221` |
| **3.** The `e2e-visual` job needs network access to `fonts.googleapis.com`. *(D-18 A, item 3 of 4 — reviewed)* | `.github/workflows/main.yaml:318-319` | **True when written**, false from the moment VGATE-04 landed — the hardest class of stale record to catch, because nothing about it was ever wrong until a change made it so | Row `EG1-CURL` (must-fail control, `exit=7` connect-not-resolve, 4 s before the suite in the same `--rm` container) and row `EG2-SUITE` (the whole visual project **7/7 green, exit 0** with both font hosts blackholed at the runner by `--add-host`) | `146-09` Task 1 — `04e91b221` |
| **4.** The container re-baselining recipe, restated as prose, with a fixed-container-directory bind mount and a port-forwarding step documented nowhere. *(D-18 A, item 4 of 4 — reviewed)* | `tests/tests/specs/visual/visual-regression.spec.ts`, file docblock | Has aborted **every** run since Phase 137 landed the served-application preflight | `tests/global-setup.ts:41` derives `repoRoot` from the test process's own path and `tests/tests/support/preflight.ts:429-444` requires strict absolute-path equality with what the host dev server echoes; row `D14-OBS` observed the identical-path mount `-v "$PWD":"$PWD" -w "$PWD"` succeeding from inside the pinned container | `146-09` Task 2 — `e25a78de5` |
| **5.** ⚠ `settleFonts` converts a font-load failure into a named assertion, so an unreachable host fails as *Inter did not load* rather than as an inscrutable pixel diff. **FOUND BY RESEARCH AFTER THE DISCUSSION CLOSED. NOT one of the four reviewed under D-18. A premise correction, not a decision change — D-10 A stands exactly as locked and the function body is byte-identical.** | `visual-regression.spec.ts`, the `settleFonts` docblock | **Never true at any point in the function's life** | `146-RESEARCH.md` § N-2, measured in `mcr.microsoft.com/playwright:v1.58.2-noble`: with **zero** `@font-face` rules present — exactly what a missing or 404ing stylesheet produces — `document.fonts.check('1em Inter')` returns **`true`** and `document.fonts.size` is `0`. Demonstrated in both directions by rows `F2-BOGUS-RED` and `F3-BOGUS-GREEN` | `146-09` Task 2 — `e25a78de5` |
| **6.** The variable → static Inter switch moved **856 px** on the `candidate-preview` pair. *(Added by execution — not chartered by `146-09-PLAN.md`, which expected N-1 to be open.)* | `146-05-SUMMARY.md:187-202` | An intermediate session's reading, carried forward as if measured against the font | Row `F1-DELTA-PRE`: the delta is **0 px** on both `candidate-preview` baselines. The 856 decoded to a **single 48×48 portrait tile** from a differently-seeded photograph; masking `x 373-420, y 178-225` took it to **0**. **N-1 is resolved in the NEGATIVE — research's falsification criterion was NOT met, so D-09 A's font-neutrality claim SURVIVES measurement.** The voter pair's 11,615 / 11,601 px is the stale tie permutation, not the font | `146-06`, in place, under a marked `⚠ CORRECTED BY 146-06` block; restated here so the correction is not only visible to a reader of `146-05` |
| **7.** The old configuration was blind to the v2.14 injection on `voter-results-desktop` — the tall baseline — while mobile's historic red showed the gate working. *(Added by execution.)* | ROADMAP criterion 2 and `146-CONTEXT.md`'s framing of the blindness half | Understated. The indictment is **sharper** than the phase originally claimed | `146-04-SUMMARY.md:99,116` and rows `B1-OLD`/`B2-OLD`/`C1-NEW`/`C2-NEW`: the injection's damage against current baselines is **4,783 px desktop and 4,835 px mobile** — **10.1 %** and **29.9 %** of the respective OLD ratio budgets. **The old configuration was blind on BOTH voter baselines.** Mobile's historic red was carried by the tie-permutation churn, not by the gate's sensitivity | `146-09` Task 3 — recorded here and in ROADMAP § Phase 146 |
| **8.** D-16's chartered claim: the *run-4 anomaly* is an unexplained failure whose leading hypothesis is Vite HMR staleness, to be attacked with three bounded inject/revert/re-run attempts on a continuously-running dev server. *(Added by execution.)* | `146-CONTEXT.md` § *Proving it (criteria 4 and 5)*; rows `D16-A1`/`D16-A2`/`D16-A3` as pre-written | **Obsolete.** It is no longer unexplained, and the HMR hypothesis it was built around is falsified for both phase-146 recurrences | `.planning/debug/answer-surface-wait-timeout.md`: the container's outbound TCP SYN to `host.docker.internal` is intermittently dropped and then waits out Linux's exponential retransmission backoff — **35,634 to 68,369 ms** on the connect leg while DNS stayed under 1.4 ms — because `tests/scripts/tcp-forward.mjs` dialled the upstream once with no deadline. Fixed in **`4066c2f41`** (bounded re-dial) and **`351981b4f`** (the voter fixture now fails at the stalled navigation). `146-07` converted the three rows into a **regression check on the landed fix** rather than a ritual non-reproduction. **Both standing limits carry forward UNSOFTENED: (a) the end-to-end symptom was NEVER reproduced post-fix, so the chain from "the stall is bounded to 4 s" to "the fixture no longer fails" is MECHANICAL, not demonstrated; (b) CI is a different environment that does not use this relay at all, and none of this local evidence transfers to it — `D17-CI` reproduced CI's INVOCATION, never CI's ENVIRONMENT.** The v2.14 linkage itself remains **INFERRED** — the old record never captured which test failed | `146-07`, in § *D-16 was re-scoped, and why*; ROADMAP entry corrected by `146-09` Task 3 |
| **9.** VGATE-05's woff2 criterion — all four `/fonts/*.woff2` requests appear with status 200. *(Added by execution.)* | `146-07-PLAN.md`'s acceptance criteria; carried into VGATE-05's assessment | **The criterion is wrong, not the implementation** | `146-07-SUMMARY.md:206` and row `PT1-PRODTRACE`: only **2 of 4** are fetched. `inter.css` declares four `@font-face` rules and the `latin-ext` pair carries a `unicode-range` the content never exercises, so the browser correctly never requests them. Subsetting working as designed, corroborated by an independent `document.fonts.size = 4` with 2 loaded. It is corrected in the record, **not** worked around by contorting a run until four appear | `146-09` Task 3 — VGATE-05's wording amended in `.planning/REQUIREMENTS.md` before its status was decided |
| **10.** VGATE-05's route scope — the production trace covers `/questions`, `/results` and `/candidate/preview` as rendered documents. *(Added by execution.)* | `146-07-PLAN.md`; `PT1-PRODTRACE`'s pre-written scope | **The criterion is wrong as written** | `146-07-SUMMARY.md` deviation 6: those three were reached as **307/303 guard redirects**, not as located or authenticated documents. Three attempts to drive election selection through the production UI were abandoned rather than building a second fixture harness. `146-08`'s egress-blocked run does **NOT** improve this — it drives the **dev** server through the suite's fixtures, a different instrument — so `PT1-PRODTRACE`'s production-build scope limit stands **unchanged and unimproved** | `146-09` Task 3 — recorded in VGATE-05's amended wording and in ROADMAP § Phase 146 |
| **11.** `146-08-PLAN.md`'s own `<verify>` block, which counts placeholders with a bare word-boundary `pending` match over the whole file and demands 0. *(Added by execution.)* | `146-08-PLAN.md` `<verify>` | **Unsatisfiable as written** | This register documents its own placeholder word in four places — see § *Every cell must be filled from a run that executed* — so a whole-file count can never return 0 while the register explains itself. The **row-anchored** count, this register's own documented method and the one the sibling ledger uses, returns **0**. The check's over-breadth is recorded; the prose was **not** mangled to satisfy a broken check | `146-09` Task 3 — recorded here |
| **12.** D-146-DEF-1 — seed ordering varies across sessions, via `packages/dev-seed/src/writer.ts:293` taking candidates in insertion order. *(Added by execution.)* | `146-06-SUMMARY.md`; `deferred-items.md` § D-146-DEF-1 | **Refuted.** The filing's mechanism was factually wrong at the source | `.planning/debug/seed-determinism-across-resets.md`: the seed **is** deterministic — the DB is byte-identical across `db:reset` cycles once re-minted surrogate UUIDs are normalised, and `portraitFiles[i % 30]` over 30 candidates is a **bijection**, so any reorder would have permuted every photograph and could not hide. `selectCandidatesForPortraitUpload` carries `.order('external_id', ascending)` (`packages/dev-seed/src/supabaseAdminClient.ts:660-681`). The real variance is a **291×17 focus-state band** on the election chip — `AccordionSelect.svelte:89`'s `focus:text-primary`, lost when the extra-navigation path lets `+layout.svelte:172-182`'s `afterNavigate` rAF steal focus — scoring **0 px at the shipped `threshold: 0.2`**. Fixed **test-only** in `2df2d0b28`; the product's NAVA11Y-02 focus reset was correctly left alone | `146-07` Task 0 (the fix) and the debug record; the filing corrected by `146-09` Task 3 |
| **13.** VGATE-01's own magnitudes — the injection measures *~19,500 diff px* and `voter-results-desktop` *previously passed it at 0.41 % of its ratio budget*. *(Added by execution.)* | `.planning/REQUIREMENTS.md:22`; propagated from `146-03-PLAN.md:223` and `146-04-PLAN.md:93,317` into ROADMAP criterion 2 | Both figures wrong, and one of them a units error that had been copied forward through three plans | `146-04-SUMMARY.md:99` measures the same provably-identical injection (blob `65a16a56667be18e653a231c994af15f110d4f10`) at **4,783 px desktop and 4,835 px mobile** against current baselines — **10.1 %** and **29.9 %** of the respective old ratio budgets, not 0.41 %. The desktop ratio budget is `0.01 × 1280 × 3684 = 47,155 px`, so the v2.14 reading of ~19,500 px was **41.4 %** of it; *0.41 %* is that ratio printed as a percentage without conversion | `146-09` Task 3 — VGATE-01's wording corrected in `.planning/REQUIREMENTS.md` before its status was decided |

### A negative result, recorded as one

`146-08`'s seven gate runs logged **0 dropped SYNs across roughly 1,134 connections**, against `146-07`'s
**33 in 2,239**. The absorb path in `4066c2f41` was therefore **never exercised** during the determinism
sweep. That sweep is **no new evidence about the SYN fix**: it says the gate is green and stable, and
nothing more. The phase record must not imply the determinism runs corroborated `4066c2f41` — they had
no opportunity to. It is also a reminder that the drop rate **moves**: the same host measured 0.786 %
per connection in the pre-fix corpus and 1.47 % during `146-07`.

---

## Residue

**What this phase carries forward rather than closes.** Everything below is real, was observed, and is
*not* fixed by the greens in § Gates. It is recorded here because a phase that reports only its
successes has not told you what its successes are worth.

### Claims that remain unobserved

- **The CI runner half of criterion 4 and of `D17-CI`.** `main.yaml` triggers on push/PR to `main`, and
  this branch is thousands of commits ahead of a stale `origin/main`, so **no run in this register was
  taken on a GitHub runner**. `D17-CI` reproduces CI's **invocation** — `CI=true`, `--grep "@visual"`,
  no `--project=` — in the pinned image on this macOS host, against a host Vite dev server through the
  TCP forwarder. It is **not** CI's environment, and the row says so. Discharges on the branch's first
  PR to `main`, following the Phase 137 precedent for exactly this shape of gap.
- **D-16's chartered claim.** D-16 was **re-scoped, not executed** (§ *D-16 was re-scoped, and why*).
  The original end-to-end symptom — the `voter-journey.fixture.ts:336` timeout — was **never reproduced
  after the fix**, so the chain from *"the stall is now bounded to ≤ 4 s"* to *"the fixture no longer
  fails"* is **mechanical rather than demonstrated**. `146-08`'s six runs gave it a second, independent
  chance to appear and it did not — but they add **no new evidence about the absorb path either**,
  because their forwarders recorded **0 dropped SYNs across ≈1,134 connections**, so the absorbing code
  was never exercised. Recorded as *"did not recur in six further runs"*, never as *"gone"* — the
  reasoning this milestone rejected for DEF-135-04.

### Record corrections owed to `146-09` — ⚠ DISCHARGED

**All three below are corrected in § *Record corrections* above (rows 9, 10 and 11), together with
nine further claims this phase falsified. The list is left standing rather than deleted, so a reader
of the residue can see what was owed as well as what was paid.**

- ⚠ **VGATE-05's woff2 criterion is wrong as written.** `146-07`'s production trace fetched **2 of 4**
  woff2 files, because the `latin-ext` pair carries a `unicode-range` the content never exercises. That
  is **correct browser behaviour**; the criterion is what is mistaken. It must be corrected in the
  record — **not** worked around by contorting a run until four appear.
- ⚠ **VGATE-05's scope caveat.** `146-07` reached `/questions`, `/results` and `/candidate/preview` as
  **307/303 guard redirects**, not as located/authenticated documents; three attempts to drive the
  elections selection through the production UI were abandoned rather than building a second fixture
  harness. `146-08`'s egress-blocked run does **not** improve on this: it drives the **dev** server via
  the suite's own fixtures, which is a different instrument, so `PT1-PRODTRACE`'s production-build scope
  limit stands unchanged and unimproved.
- ⚠ **`146-08`'s plan `<verify>` block counts placeholders with a bare `\bpending\b` match over the whole
  file.** That check can never return 0 while this register documents its own placeholder word — see
  § *Every cell must be filled from a run that executed*. The **row-anchored** count, which is this
  register's own documented method and the one the sibling ledger uses, returns **0**. A third wrong
  acceptance criterion for `146-09` to correct.

### Disclosed attempts, retained rather than deleted

- **`146-08`'s misinvoked `--ci-literal` run.** The first attempt at `D17-CI` was invoked **without**
  the `--ci-literal` flag — an executor slip, not a gate failure — so it ran as a plain
  `--project=visual-regression --workers=1 --retries=0` run and produced `CI` unset, `retries=0` and no
  `--grep`. It was **green** (7/7, exit 0, 82 s) and is retained unaltered at
  `tests/e2e-runs/146-det-ci-MISINVOKED/`. It is **not** counted as `D17-CI` and **not** counted among
  the five strict runs; the correctly-invoked replacement is the row. Recorded under the disclosure norm
  `145-NEGATIVE-CONTROL-LEDGER.md` established for a red first attempt: silence about a discarded run is
  exactly what makes a green arguable.
- `146-03`'s run voided by a run-4-shaped `voter-journey.fixture.ts:336` timeout, and `146-04`'s
  operator-approved pre-catch baseline refresh — both disclosed in their own sections above.

### Known-remaining, accepted by decision

*(Identified at ledger creation; todos filed in `146-09` — **seven**, not the three the plan
chartered. All live under `.planning/todos/pending/2026-08-26-146-*.md`.)*

- `apps/docs/src/app.html:9-11` — an independent hardcoded Google Fonts `<link>` in the docs site,
  **out of scope by D-13**, threat `T-146-06`, disposition **accept**. It must be recorded as
  known-remaining and a todo filed (`2026-08-26-146-docs-site-google-fonts-link.md`), so
  "self-hosted Inter" is never read as a repo-wide claim it is not.
- `cloud.umami.is` analytics references in the production build — not a font host, outside criterion 4
  as written, `analytics.trackEvents` is `false`. Threat `T-146-07`, disposition **accept**.
- The 15 dead `font-medium` / `font-semibold` classes — a type-scale design decision, todo filed
  (D-09; `2026-08-26-146-dead-font-weight-utility-classes.md`).
- `CLAUDE.md`'s stale claim that `@openvaa/app-shared` builds to both ESM and CommonJS — it is
  ESM-only (N-7). Real, outside this phase's declared record-correction set; todo filed
  (`2026-08-26-146-claude-md-app-shared-esm-only.md`).

**Four further items surfaced during execution and are filed rather than absorbed** — the plan
chartered three todos and the phase produced seven:

- **`e2e/base` declares `externalIdPrefix: ''`**, so `selectCandidatesForPortraitUpload('')` issues
  `.like('external_id', '%')`, matching every non-NULL `external_id` in the project. One foreign
  candidate sorting before `test-` would rotate **all 30** portrait assignments through the
  `portraitFiles[i % 30]` bijection. **Cannot fire on a clean database**, and the freshness probe
  warns when it would — an observation with a sharp edge, not a live defect.
  (`2026-08-26-146-e2e-base-empty-external-id-prefix.md`.)
- **`F3-BOGUS-GREEN` splits into 13 fields under a naive `awk -F'|'`** — two escaped pipes inside a
  `grep -c` code span, against the paired `F2-BOGUS-RED`'s correct 11. Pre-existing since `146-07`;
  **renders correctly**, so the row is not rewritten to satisfy a parser.
  (`2026-08-26-146-ledger-row-escaped-pipe-breaks-awk.md`.)
- **Docker Desktop's container-egress SYN drops are unfixed and not ours to fix.** The relay absorbs
  them on the paths that use it; **other non-relayed container paths remain exposed**, inheriting the
  original unbounded stall. The rate **moves** — 0.786 % per connection pre-fix, 1.47 % during
  `146-07`, 0 % across `146-08`'s ≈1,134 connections.
  (`2026-08-26-146-docker-desktop-container-egress-syn-drops.md`.)
- **`selectElection.ts`'s landing election is non-deterministic** by its own docblock
  (`tests/tests/utils/selectElection.ts:64`). `2df2d0b28` made the **capture** stable; it did **not**
  make the walk's path deterministic.
  (`2026-08-26-146-select-election-walk-path-nondeterministic.md`.)

---

*Phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity*
*Opened: 2026-08-25 at HEAD `0c3a26ab6` by `146-01` Task 3 — 29 rows, 145 placeholder cells, 0 measurements, 0 product bytes.*
