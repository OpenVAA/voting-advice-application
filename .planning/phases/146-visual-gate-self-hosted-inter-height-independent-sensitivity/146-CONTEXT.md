# Phase 146: Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline - Context

**Gathered:** 2026-08-25
**Amended in place:** 2026-08-25 after research — see § *AMENDED IN PLACE after research* inside
`<decisions>`. 11 findings, 7 substantive; **no decision reversed**, four qualified, three new
obligations. Read the amendment before planning: it is not an addendum, it corrects premises above.
**Status:** Ready for planning
**Measured at HEAD:** `f36ad1ce1` (M-1 … M-17), re-verified by research at `f857b200e`; the amendment's
findings measured at `0b808fa89`. Every intervening commit is `.planning/`-only — zero product bytes.

<domain>
## Phase Boundary

Make the blocking visual job a **component-level** guard on **every** baseline, and make it need
nothing from the public internet to say so.

**In scope:**
- `tests/playwright.config.ts:314-319` — the `expect.toHaveScreenshot` budget (add an absolute
  `maxDiffPixels` cap alongside the existing `threshold` / `maxDiffPixelRatio`).
- `tests/tests/specs/visual/visual-regression.spec.ts` — the `settleFonts` docblock, the recipe
  pointer, and a new third-party-font-request listener guard.
- `tests/tests/specs/visual/__screenshots__/` — the four re-captured baselines.
- `tests/scripts/visual-container.sh` — new, the executable container recipe, **plus a committed Node
  TCP forwarder** replacing the recipe's `socat` step (N-3: `socat` is not in the pinned image).
- `apps/frontend/static/fonts/` (new woff2 + `inter.css` + `OFL.txt`) and
  `packages/app-shared/src/settings/staticSettings.ts` — the `font.url` **default**. A `yarn build` is
  a **hard prerequisite** of every capture that follows it (N-7).
- Records: `tests/README.md:185`, `.github/workflows/main.yaml:318-319`, and the `settleFonts` docblock
  — whose central claim is a **fifth** stale record claim (N-2), beyond D-18's four.
- Ledgers: `146-VISUAL-NOISE-LEDGER.md`, `146-NEGATIVE-CONTROL.md` — the latter also carrying the
  **font-delta measurement** (N-1) and the D-14/D-11 observation records.

**Out of scope:**
- `apps/docs`'s own hardcoded Google Fonts `<link>` (M-11) — recorded as known-remaining, todo filed
  (D-13).
- Adding weights 500/600 or a variable face — that is a visual design change (D-09 B/C, rejected).
- `cloud.umami.is` analytics references in the build output (M-10) — not a font host, not criterion 4.
- Any edit to Phase 137's preflight (D-14 B, rejected — the mount path moves, the gate does not).
- `staticSettings.font.name` / `.style` (dead, M-6) — a framework-API cleanup, deferred.
- `CLAUDE.md`'s stale "app-shared builds to both ESM and CommonJS" claim (N-7 — it is ESM-only).
  Real, but outside this phase's declared record-correction set; file it, do not fold it in.

</domain>

<decisions>
## Implementation Decisions

All **18 items** in `146-DISCUSSION-POINTS.md` carried a ★ RECOMMENDED option. Per the standing
convention (unchecked = recommended wins), the user reviewed the doc and left every box unchecked:
**18/18 resolved to their recommended option; 0 overrules.** Every decision rests on a measurement
recorded in that doc (M-1 … M-17), taken in this working tree — not on the roadmap's or the two source
todos' claims, four of which are stale (M-15, M-16).

### The sensitivity mechanism

- **D-01 → A: add an absolute `maxDiffPixels` cap; keep `fullPage: true` captures unchanged.**
  Settled on evidence, not taste: M-3 read `playwright-core@1.58.2`
  `lib/server/utils/comparators.js:88-97` and found `maxDiffPixels = Math.min(maxDiffPixels1,
  maxDiffPixels2)` when both are set (the ratio is converted to `width × height × ratio` first). An
  absolute cap is therefore **monotonically strictness-increasing on every baseline** — it can never
  loosen one — and `min(N, 0.01·area)` is bounded by `N` regardless of page height. Option B
  (element-scoped capture) buys the same property by *shrinking what the gate looks at*, trading one
  blindness for another. — **Reversibility:** reversible (one config value).
- **D-02 → A: one global `maxDiffPixels`** in `expect.toHaveScreenshot`, next to the existing knobs,
  with the derivation in the comment. A per-assertion override lands **only** if D-04's measurements
  show one baseline's noise genuinely exceeds the others' — and then the number *and the reason* go at
  the override site. — **Reversibility:** reversible.
- **D-03 → A: keep `maxDiffPixelRatio` alongside the cap**, and re-document it as the
  **small-baseline floor** rather than as "the budget". Under M-3's `Math.min` it can only tighten
  further; it binds where `0.01·area < N`. The comment at `playwright.config.ts:314` currently reads
  as if the ratio *is* the budget — after this phase the cap is, on all four baselines the suite has.
  — **Reversibility:** reversible.
- **D-05 → A: lock the derivation *rule*, not the number.**
  `cap = max(observed per-baseline noise across all runs) × 10`, floored at **200 px**, rounded up to
  a round number, and **MUST be < 5,000 px** (≥ ~4× below the 19,484 px regression it has to catch).
  The arithmetic goes into the config comment. **If the measured noise makes those two constraints
  incompatible, that is a finding — stop and record it, never quietly widen.** The number does not
  exist until D-04 runs and cannot be chosen in planning. — **Reversibility:** reversible.

### The evidence (VGATE-03)

- **D-04 → A: n=10 consecutive captures per baseline, in-container, at `maxDiffPixels: 0`**
  (a measurement-only configuration, never shipped), reading counts off the failure text per M-4
  (`` `${count} pixels (ratio ${ratio}) are different.` ``). Record **every run's per-baseline count**
  — not just the max — in `146-VISUAL-NOISE-LEDGER.md`, with image digest, platform, invocation and
  dataset, so the threshold is re-derivable. ~15 min at ~1.2 min/run. n=3 gives a number with no
  shape, which is exactly what VGATE-03 exists to stop. M-17: only the `candidate-preview` pair has
  prior data (0 px both runs); **the voter pair's noise has never been measured** — that gap is the
  phase's reason for existing.
- **D-06 → A: prove height-independence with a dedicated, non-baselined control run.** Capture the
  route twice in one controlled session — once as-is, once lengthened by injected DOM/CSS at capture
  time (`page.addStyleTag` / `page.evaluate` appending inert filler below the fold) — compare each
  against its own freshly-taken reference **with the same injected damage present**, and record both
  diff counts and both verdicts. No new committed baseline, no seed change, no fixture change: the
  artefact is the ledger, not a PNG. Rejected B (seeding more candidates) because it mutates
  `e2e/base` and perturbs the journey assertions — the constraint Phase 136 called load-bearing.
- **D-07 → A: reuse the identical v2.14 injection** (`MatchScore.svelte:30`, `text-lg` → `text-2xl`),
  same image, same digest, and record **four halves** in `146-NEGATIVE-CONTROL.md`:
  (1) old config + injection → `voter-results-desktop` **passes** (blindness **re-observed**, not
  cited); (2) old config + injection → `voter-results-mobile` **fails**; (3) new config + injection →
  **both** voter baselines fail; (4) new config, clean tree → all green. Comparability with the
  recorded 19,484 / 19,545 px numbers is the entire point of reusing the same injection.

### Self-hosting Inter

- **D-08 → A: vendor the woff2 into `apps/frontend/static/fonts/`, add a same-origin
  `static/fonts/inter.css` carrying the `@font-face` rules, and change the `staticSettings.font.url`
  **default** to that same-origin path.** Nothing in the layout changes shape: M-5 measured exactly
  **one** live consumer — `apps/frontend/src/routes/+layout.svelte:208` reads `staticSettings.font?.url`,
  `:221-223` emits the two preconnects behind an `indexOf('fonts.googleapis')` test, `:225` emits
  `<link href={fontUrl} rel="stylesheet">`. The preconnect test naturally goes false for the new
  default while still firing for an operator who overrides back to Google, so the documented
  customization point survives intact. Rejected B (`@fontsource/inter` + `@import`) because it
  bypasses `font.url` entirely — the documented customization point would become a lie and a
  downstream override would load *two* fonts. — **Reversibility:** **costly** — it changes a published
  framework default (`staticSettings.font.url`) that downstream VAA operators may depend on, and it
  is the change the re-baseline is captured against.
- **D-09 → A: exactly 4 files — Inter 400 and 700, `latin` and `latin-ext` subsets, normal style,
  upstream `unicode-range` preserved — plus SIL OFL 1.1 `OFL.txt` committed alongside.** This is
  arithmetic, not judgement: M-7 (fresh production build) found the built CSS emits **`.font-bold` and
  `.font-normal` only** — `app.css:93` sets `--font-weight-*: initial` and re-declares just
  `normal: 400` / `bold: 700`, so Tailwind v4 emits no `font-medium`/`font-semibold` utility at all;
  M-8 found the source's 9 `font-medium` + 6 `font-semibold` usages are therefore **dead classes**;
  M-9 found **0** occurrences of `italic`. 400 + 700 is the complete rendering surface, so vendoring
  exactly those is **rasterisation-neutral** and the only re-baseline delta is
  Google-served-vs-self-hosted file differences. Source the files from the OFL-licensed
  `@fontsource/inter` distribution **as-is** (no re-subsetting tooling in the repo). Vendoring 500/600
  or a variable face would smuggle a **visual design change** into a test-infrastructure phase.
- **D-10 → A: keep `settleFonts` verbatim** (`visual-regression.spec.ts:56-76`, including its
  `document.fonts.check('1em Inter')` assertion); **rewrite only its docblock** so the rationale names
  a broken same-origin asset rather than an egress-restricted runner. Self-hosting removes the
  network, not the failure mode — a wrong vendored path fails identically, and `settleFonts` is the
  only thing between that and an inscrutable whole-page diff. Leave the conditional preconnect block
  at `+layout.svelte:221` **in place**: dead for the default, correct for an operator who overrides.

### Proving it (criteria 4 and 5)

- **D-11 → A: blackhole both hosts at the container's own resolver** —
  `--add-host fonts.googleapis.com:127.0.0.1 --add-host fonts.gstatic.com:127.0.0.1` on the
  `docker run` — and **prove the block is live with an in-container `curl` control (must fail)
  recorded in the ledger before the suite runs.** The criterion is explicit that the block is applied
  to the runner, not simulated, so `page.route(…)` interception is out by construction. The `curl`
  control makes the block falsifiable rather than assumed.
- **D-12 → A: discharge VGATE-05 with both halves** — (1) a **permanent** request-listener guard in
  the visual spec (`page.on('request')` failing on any URL matching a third-party font host), so a
  future re-introduction reddens the build; and (2) **one recorded production-build network trace**
  in the ledger, since VGATE-05 says "the production app" and the suite drives the dev server.
  Consistent with the milestone's preference for standing guards over one-off observations.
- **D-16 → A: one bounded, falsifiable attempt (≤3 tries) to reproduce the run-4 anomaly** — inject →
  run → `git checkout --` → run immediately **without restarting the dev server**, capturing full
  output every time. If it reproduces, the Vite-HMR-staleness hypothesis is confirmed and the remedy
  is a documented restart step. **If it does not, record it as still unexplained with the attempt
  described** — never as "did not recur, so presumed gone", the reasoning this milestone rejected for
  DEF-135-04. (Standing project feedback: flag unverified root causes and re-test in isolation.)
- **D-17 → A: 5 consecutive runs at `--workers=1 --retries=0`** (stricter than CI, which retries 3×),
  **plus 1 final run under CI's literal invocation** (`CI=true`, `--grep "@visual"`) — six runs total,
  mirroring the Phase 136 gate shape. Criterion 5's minimum is 3, but the anomaly appeared once in
  five runs and 3 has poor power to re-observe a ~20 % event. **Every run's exit code and per-test
  result recorded, including any that fail.**

### Prerequisites and tooling

- **D-14 → A (a blocker, not a preference): mount at the identical absolute path —
  `-v "$PWD":"$PWD" -w "$PWD"`.** M-12 is new since the v2.14 runs: `tests/global-setup.ts:41`
  derives `repoRoot` from *the test process's own path*, and `tests/tests/support/preflight.ts:429-444`
  requires strict absolute-path equality with what the **host** dev server echoes. The v2.14 recipe's
  `-v "$PWD":/work -w /work` therefore aborts **every** in-container run this phase needs, with exit 1
  before any spec body and **no bypass by design**. The identical-path mount makes container and host
  agree on `repoRoot`, both preflight clauses pass, and **not one byte of the preflight changes**.
  Verify by observation (a preflight-passing container run), not by reasoning, and record it.
  Rejected B (an env-var escape hatch) — it would punch the hole `global-setup.ts:19-21` deliberately
  refused. — **Reversibility:** reversible.
- **D-15 → A: commit `tests/scripts/visual-container.sh`** encoding the whole recipe — image + digest
  pin, `--platform linux/amd64`, the D-14 identical-path mount, the socat host-port forwarding,
  `--workers=1`, and flags for this phase's two modes (`--update-snapshots`, the D-11 egress block).
  Point the spec docblock, `tests/README.md` and the `main.yaml` comment **at the script** instead of
  restating the steps in three places. M-14: the recipe exists today only as prose in a docblock and a
  YAML comment, the socat step is documented **nowhere** (0 hits for `socat` / `docker run` /
  `0.0.0.0` in `tests/README.md`), and this phase will run it ~20 times.

### Record corrections

- **D-18 → A: correct all four stale statements, in this phase, after the gates are green** (the
  Phase-144 ordering — records last):
  - `tests/README.md:185` (a) drop *"`auth-setup` can't authenticate against the base dataset yet"* —
    **false since Phase 136**, `auth.setup.ts` force-registers base CA-AA-1 via `SupabaseAdminClient`;
    (b) fix the baseline path to `tests/tests/specs/visual/__screenshots__/` (M-15).
  - `.github/workflows/main.yaml:318-319` — *"The job needs network access to fonts.googleapis.com"*
    is true today and **false the moment VGATE-04 lands** (M-16).
  - `visual-regression.spec.ts`'s docblock — the `settleFonts` rationale (D-10) and the recipe pointer
    (D-15).
- **D-13 → A: frontend only.** Record `apps/docs/src/app.html:9-11` **explicitly in the phase record
  as known-remaining** and file a todo, so nobody later reads "self-hosted Inter" as covering the docs
  site. This project's precedent (Phase 138's shape note; the `tests/README.md` concurrency item filed
  at v2.14 close) is to file adjacent work rather than pad a phase with it.

### AMENDED IN PLACE after research — 2026-08-25 (11 findings, 7 substantive)

`146-RESEARCH.md` (HEAD `0b808fa89`, 1,831 lines, every claim executed or line-cited) corrected seven
premises behind the decisions above. **No decision is reversed** — all 18 stand at their ★ RECOMMENDED
option — but four now carry a qualification the planner MUST honour, and three new obligations enter the
phase that the discussion could not have known about. Recorded here rather than as an addendum so no
stale premise propagates (standing project rule).

- **N-1 amends D-08/D-09 — the switch is `variable → static`, not merely "the same two weights".**
  `css2?family=Inter:wght@400;700` makes Google serve **one 48,256-byte variable woff2 for both weights**
  (`fvar`/`gvar`/`avar`/`HVAR`/`MVAR` present in its table directory). D-09 A's rasterisation-neutrality
  argument is correct about *which weights render* (M-7/M-8/M-9 re-verified) and **silent about delivery**.
  `@fontsource/inter@5.3.0`'s files are **sha256-identical to Google's own single-weight statics**, so
  provenance is perfect — but whether FreeType's VF-instancing and static rasterisation of the same design
  agree at these sizes is **unmeasured, and is not to be assumed either way**.
  → **New obligation: a font-delta measurement task.** After the font lands and before the re-baseline,
  run the visual project with **no `-u`** and record all four diff counts in the ledger regardless of size.
  The two `candidate-preview` baselines (at *exactly* 0 px across every v2.14 run) are the sensitive
  detector. D-09 A is unchanged; what changes is that its neutrality claim gets **observed, not asserted**.
- **N-2 amends D-10, and adds a FIFTH stale record claim to D-18.** Measured in the pinned container:
  with **zero** `@font-face` rules present — exactly what an unreachable `fonts.googleapis.com` produces —
  `document.fonts.check('1em Inter')` returns **`true`**. `settleFonts`' docblock claim that it converts a
  font-load failure into a named assertion **was never true**. D-10 A is **preserved exactly** (keep
  `settleFonts` verbatim; rewrite only its docblock) — but the rewritten docblock must state the
  **measured** coverage, not a patched-up version of a claim that never held, and the blindness is closed
  by **widening the D-12 guard** to also assert `/fonts/inter.css` returns 200 (explicitly Claude's
  discretion under D-12). **The fifth stale claim is folded into D-18's record-correction plan and MUST be
  named explicitly** in the plan and in the phase record — it lives in the very docblock D-18 already
  opens, so it costs nothing extra, but the user reviewed **four**, not five. This is a premise
  correction, not a decision change.
- **N-3 amends D-15 — `socat` is NOT installed in `mcr.microsoft.com/playwright:v1.58.2-noble`.** The
  v2.14 prose recipe's host-port forwarding step cannot run as written. Use a **committed Node TCP
  forwarder** alongside `visual-container.sh` rather than `apt-get install -y socat` (a derived or
  mutated image would break D-07's same-image/same-digest comparability, which is the entire point of
  reusing the v2.14 injection). Keep `apt-get install -y socat` documented as the fallback. Watch
  assumption A2: if the container resolves `localhost` to `::1` only and the forwarder binds v4 only, the
  preflight fails with a *connection refused* that mimics the D-136-06-2 bind bug — the D-14 observation
  run is the first thing that would catch it.
- **N-4 amends VGATE-06's re-baseline step — bare `--update-snapshots` means mode `changed`,** which
  **skips within-tolerance images**. That is the wrong mode for a re-baseline whose whole purpose is to
  re-capture every baseline against new rendering. Use **`--update-snapshots=all`**.
- **N-5 amends D-09 — `@fontsource/inter`'s per-subset CSS carries no `unicode-range`.** Only its
  `index.css` and `unicode.json` do. Taking the per-subset CSS naively makes the four faces shadow each
  other — a correctness bug, not a nicety. Take the ranges from `unicode.json` (recovered verbatim in the
  research; matches Google byte-for-byte).
- **N-6 amends how D-12's evidence may be phrased.** `+layout.svelte:207-208` keeps the Google URL as the
  `??` **fallback literal** and `:222-223` keep the preconnect literals in a branch that is dead for the
  new default; all three survive into the bundle. This is **correct behaviour** under D-10 A — but it
  means a static grep of `apps/frontend/build/` will hit `fonts.googleapis.com` **forever**. The ledger
  must therefore claim **"zero third-party font *requests* observed"**, never "zero occurrences in the
  build", and the permanent guard must be a **request listener**, never a string scan. (D-12 option C was
  already rejected; N-6 shows it would have been actively wrong.)
- **N-7 adds a hard prerequisite to every capture: `yarn build` must run first.** `@openvaa/app-shared` is
  **ESM-only** (`tsup.config.ts` declares `format: ['esm']`; `package.json` exposes only an `import`
  condition — `CLAUDE.md`'s "builds to both ESM and CommonJS" is stale), and the frontend resolves it to
  the built `dist/`. **Editing `staticSettings.ts` alone changes nothing at runtime.** A stale `dist/`
  would silently re-baseline against Google-served Inter and **pass every gate for the wrong reason** —
  the single most dangerous failure mode in this phase. In the container recipe the dev server is spawned
  on the *host* by the operator, so `yarn build` (or at minimum
  `yarn build --filter=@openvaa/app-shared`) must be an **explicit step before the dev server is
  (re)started**, not left to `yarn watch:shared`.
- **N-10 fixes the host-side invocation criterion 5 depends on.** `yarn dev --host 0.0.0.0` does **not**
  do what it looks like: the root `dev` script chains through `concurrently`, so appended args land on
  `concurrently`, not `vite`. `vite.config.ts:36-44` declares no `host`, so Vite binds `127.0.0.1` by
  default and the flag must come from the CLI. The correct sequence is:
  `yarn build` → `yarn db:start` (or the reset variant) →
  `yarn workspace @openvaa/frontend dev --host 0.0.0.0`.
  Prefer port 5173 if free: `FRONTEND_PORT` is honoured by Vite and Playwright, but
  `tests/tests/utils/supabaseAdminClient.ts:585,628` hardcode `5173` by string substitution. v2.14 ran on
  5180 without incident (the visual path uses `forceRegister` + UI login, not the redirect flow), so this
  is a preference, not a blocker; `strictPort: true` makes a busy port fail loudly rather than drift.
- **N-11 pins D-17's CI-literal run to CI's actual invocation:**
  `PLAYWRIGHT_VISUAL=1 npx playwright test -c ./tests/playwright.config.ts --grep "@visual"` with
  `CI=true` — note **no `--project=`**; CI selects by grep, and `CI=true` gives `workers: 1`,
  `retries: 3`. Such a run yields **7** tests (4 captures + `data-setup-base` + `auth-setup` +
  `data-teardown-base`) because dependency projects are exempt from `--grep`.
- **N-8 / N-9 are confirmations, not corrections** — both D-14 and D-11 are now **verified live on this
  machine in the pinned image**: `-v "$PWD":"$PWD" -w "$PWD"` makes container `pwd` equal host `pwd` at
  digest `sha256:6446946a…`, and `--add-host` blackholing blocks at **both** curl (exit 7) and Chromium
  (`net::ERR_CONNECTION_REFUSED`) level. The D-14 observation run and the D-11 curl control are still
  required as *recorded* evidence, but they are no longer at risk of not working.

**Serial ordering is now forced, and one plan boundary moved.** Research establishes that the cap
(D-01…D-05) and the font (D-08/D-09) are **not safely parallel**: both feed the same re-baseline, and the
font delta must be measured against the cap already in force, or "did the pixels move?" and "did the
verdict move?" are confounded. The honest shape is strictly serial — ledger/measurement → cap → font →
re-baseline+proof → records. Plan 1 still writes **zero product bytes** (the container script and the
Node forwarder are test infrastructure), preserving ledger-first ordering per `REQUIREMENTS.md:9-13`.

**Two open questions are deliberately left unresolved, by design:** whether variable→static moves pixels
(N-1 — settled by measurement in the font plan, not by planning), and whether `max(noise) × 10` fits under
5,000 (the incompatibility threshold is `max(noise) ≥ 500`; if reached, **stop and record a finding** per
D-05 A — note that D-01's rationale is unaffected either way, since `Math.min` still makes the cap
monotonically strictness-increasing; only the chosen *number* would be in question).

**Out of scope, newly identified:** `CLAUDE.md`'s stale claim that `@openvaa/app-shared` "builds to both
ESM (frontend) and CommonJS (backend)" (N-7). Real, but outside this phase's declared record-correction
set — file it, do not fold it in.

### Claude's Discretion

- Plan count and wave shape, subject to the ordering constraint below.
- The exact filenames/paths under `apps/frontend/static/fonts/` and the `@font-face` CSS's internal
  shape, provided the four faces and their upstream `unicode-range` declarations are preserved.
- The shell-flag surface of `visual-container.sh`, provided it encodes every element D-15 lists.
- The regex/host list backing the D-12 request-listener guard.
- Where the noise ledger and negative-control ledger split vs. merge, provided both artefacts named in
  D-04 and D-07 exist and are re-derivable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's own measured baseline
- `.planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-DISCUSSION-POINTS.md`
  — **read first.** M-1 … M-17 and the full option set behind all 18 decisions. It disproves four
  in-repo record claims and identifies a new blocker (M-12) that did not exist during the v2.14 runs.
  Planning from the roadmap's wording alone will reproduce a stale premise.

### The mechanism being changed
- `tests/playwright.config.ts:314-319` — `threshold: 0.2`, `maxDiffPixelRatio: 0.01`, **no
  `maxDiffPixels`**; applied globally, no per-assertion overrides in the spec (M-1).
- `playwright-core@1.58.2` `lib/server/utils/comparators.js:88-97` — the `Math.min` combination rule
  (M-3). **The decisive fact for D-01**; re-read it rather than trusting this summary.
- Baseline dimensions on disk (M-2, re-measured): `voter-results-desktop` **1280×3684** ·
  `voter-results-mobile` **390×4152** · `candidate-preview-desktop` **1280×821** ·
  `candidate-preview-mobile` **390×924**.

### The blocker that gates every container run
- `tests/global-setup.ts:41` + `tests/tests/support/preflight.ts:429-444` — the strict absolute-path
  equality (M-12). `global-setup.ts:19-21` states there is no bypass **by design**. D-14 moves the
  mount, never the gate.
- `tests/README.md` § Run and `CLAUDE.md` § E2E preflight — the preflight's contract in prose.

### The font surface
- `apps/frontend/src/routes/+layout.svelte:208,221-223,225` — the **only** live consumer of
  `staticSettings.font.url` (M-5).
- `packages/app-shared/src/settings/staticSettings.ts` — the `font` setting; `.name` and `.style` have
  **zero consumers anywhere** (M-6). The family is hardcoded at `apps/frontend/src/app.css:226-228`
  (`--font-base`), and `app.css:93` is why only 400/700 exist (M-7).
- `apps/docs/src/app.html:9-11` — an independent hardcoded copy of the same `<link>` (M-11).
  **Out of scope; must appear in the record as known-remaining.**

### The gate and its prior evidence
- `tests/tests/specs/visual/visual-regression.spec.ts` — `settleFonts` at `:56-76`; the container
  recipe as prose at `:24-43` (M-14).
- `.planning/phases/136-*/136-VISUAL-DISCRIMINATION-EVIDENCE.md` — all prior noise data (M-17): the
  `candidate-preview` pair at exactly 0 px, the voter pair **never measured**, and the 19,484 /
  19,545 px regression numbers D-07 reuses.
- `.github/workflows/main.yaml:318-319` — the `e2e-visual` job and its soon-to-be-false comment.

### Standing rules this phase inherits
- `.planning/REQUIREMENTS.md:7-13` — the milestone's standing acceptance rule (**prove the guard fails
  before claiming it guards**). D-07 is its discharge here, in four halves.
- `.planning/ROADMAP.md` § Phase 146 — the five success criteria; `.planning/REQUIREMENTS.md:22-27` —
  VGATE-01 … VGATE-06.
- `CLAUDE.md` § E2E Hard Rule — failing E2E is a **cardinal failure**; no "known-flaky" exemption, and
  a "did not run" test counts as a failure.
- Ledger-first plan ordering (Phases 143, 144, 145): the negative-control ledger's blindness half must
  be captured **before** the fix lands, so the first plan writes zero product bytes. This **overrides
  tracer-first** per the milestone's standing acceptance rule.
- Record correction as a task, not a footnote (Phase 143 D-01, Phase 144 D-01, Phase 145 D-01/D-05):
  corrections land **after** the gates are green, in their own plan, with the disproof cited.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **The v2.14 injection** — `MatchScore.svelte:30`, `text-lg` → `text-2xl`, with recorded diff counts
  of 19,484 px (desktop, **passed**) and 19,545 px (mobile, failed). Reused verbatim by D-07; its
  value is comparability, so do not "improve" it.
- **`settleFonts`** — already converts a font-load failure into a named assertion rather than a pixel
  diff. Kept verbatim (D-10); only its docblock changes.
- **The container image is already local** (M-13): Docker 29.7.2 and
  `mcr.microsoft.com/playwright:v1.58.2-noble` cached at 2.39 GB — the exact tag the recipe and
  `@playwright/test@1.58.2` pin. No pull step needed; the digest still gets recorded in the ledgers.
- **M-4's failure text** — `` `${count} pixels (ratio ${ratio}) are different.` `` — is the noise
  read-out mechanism for D-04; the v2.14 method run 3 already used it. No new tooling required.

### Established Patterns
- Negative-control ledgers as first-class committed artefacts (`144-NEGATIVE-CONTROL-LEDGER.md`,
  `145-NEGATIVE-CONTROL-LEDGER.md`) — the shape D-04/D-07's two ledgers follow.
- `--workers=1 --retries=0` for determinism gates, plus one CI-literal run — the Phase 136 gate shape
  D-17 mirrors.
- Committed executable scripts under `tests/scripts/` as the single source of a multi-step recipe
  (D-15), replacing prose restated in three places.

### Integration Points
- `docker run` → identical-path mount (D-14) → `global-setup.ts` preflight → `e2e-visual` project →
  `expect.toHaveScreenshot` budget (D-01/D-02/D-03) → `__screenshots__/`. The preflight is the first
  hop and currently fails; nothing downstream can be measured until D-14 lands.
- `staticSettings.font.url` → `+layout.svelte:208` → `<link>` → `document.fonts` → `settleFonts` →
  the captured pixels. Changing the default (D-08) changes the last link in that chain, which is
  precisely why the re-baseline (VGATE-06) belongs in the same phase.

</code_context>

<specifics>
## Specific Ideas

- **The number cannot be planned.** D-05 locks the arithmetic; the cap does not exist until D-04's 10
  runs per baseline are in the ledger. A plan that names a cap value up front is working ahead of its
  evidence. If `max(noise) × 10` and the `< 5,000 px` ceiling turn out incompatible, **that is a
  finding to record, not a constraint to relax**.
- **D-14 comes first, and is verified by observation.** Every in-container step (noise measurement,
  both control halves, the egress-blocked run, the six-run proof) is blocked behind a
  preflight-passing container run. Prove it once, record it, then build on it.
- **Order the font change against the re-baseline deliberately.** The self-hosted faces are asserted
  rasterisation-neutral (M-7/M-8/M-9) — but "asserted" is not "observed". The re-baseline must be
  captured *after* both the cap and the font default land, and any pixel delta attributable to
  Google-served-vs-self-hosted files should be recorded rather than absorbed silently.
- **The egress control (`curl`, must fail) runs before the suite**, not after — a green suite behind an
  unproven block proves nothing.

</specifics>

<deferred>
## Deferred Ideas

| Idea | Why deferred |
|---|---|
| The 15 dead `font-medium` / `font-semibold` classes (M-8) | A design decision about the type scale, not test infrastructure. **File a todo** per D-09 — decide deliberately whether they become `font-normal`/`font-bold` or whether the theme gains the weights |
| `apps/docs` Google Fonts `<link>` (M-11) | Adjacent app, not "the production app" VGATE-05 names. **File a todo** per D-13, and name it in the phase record as known-remaining |
| `cloud.umami.is` third-party analytics references in the production build (M-10) | Not a font host; outside criterion 4 as written (`analytics.trackEvents: false` in `staticSettings.ts:61-63`). A privacy question worth its own phase |
| Making `staticSettings.font.name` / `.style` live, or deleting them (M-6) | Dead settings surface; a framework-API cleanup, not this phase |

</deferred>

---

*Phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity*
*Context gathered: 2026-08-25 — 18/18 discussion items resolved to ★ RECOMMENDED, 0 overrules*
