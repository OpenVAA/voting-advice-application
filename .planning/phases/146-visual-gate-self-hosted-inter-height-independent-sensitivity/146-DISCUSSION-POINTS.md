# Phase 146 — Discussion Points

**Phase**: Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline
**Requirements**: VGATE-01, VGATE-02, VGATE-03, VGATE-04, VGATE-05, VGATE-06
**Domain**: `tests/` visual-regression project + the frontend's font delivery — make the blocking
visual job a **component-level** guard on every baseline, and make it need nothing from the public
internet to say so.

**How to use this doc**: every item lists its options with a checkbox next to each. One option per
item carries **★ RECOMMENDED**. **Leave everything unchecked to accept every recommendation.** Tick
a box only to *overrule* the recommendation for that item. Add free-text under any item if you want
something neither option covers.

---

## Measurements taken during this discussion

All measured in this working tree today at HEAD `f36ad1ce1`. Nothing below is inferred from the
roadmap or the two source todos.

| # | Measurement | Result |
|---|---|---|
| M-1 | Current gate configuration | `tests/playwright.config.ts:314-319` — `threshold: 0.2`, `maxDiffPixelRatio: 0.01`, **no `maxDiffPixels`**. Applied globally via `expect.toHaveScreenshot`; no per-assertion overrides in the spec |
| M-2 | Baseline dimensions on disk (re-measured, not quoted) | `voter-results-desktop` **1280×3684** · `voter-results-mobile` **390×4152** · `candidate-preview-desktop` **1280×821** · `candidate-preview-mobile` **390×924**. Matches the v2.14 record exactly |
| M-3 | **How Playwright combines the two budgets** — `playwright-core@1.58.2`, `lib/server/utils/comparators.js:88-97` | `maxDiffPixels = Math.min(maxDiffPixels1, maxDiffPixels2)` when **both** are set; the ratio is converted to `width × height × ratio` first. So an absolute cap can only ever **tighten** the budget — it can never loosen one, on any baseline. This is the decisive fact for D-01 |
| M-4 | Failure message emits the raw count | `` `${count} pixels (ratio ${ratio}) are different.` `` — so per-baseline noise is readable directly off a run at zero tolerance (the method run 3 of the v2.14 control already used) |
| M-5 | Font delivery — the whole surface | **One** consumer: `apps/frontend/src/routes/+layout.svelte:208` reads `staticSettings.font?.url`, `:221-223` emits the two `fonts.googleapis`/`gstatic` preconnects behind an `indexOf('fonts.googleapis')` test, `:225` emits `<link href={fontUrl} rel="stylesheet">`. Nothing else in `apps/frontend` reads the font setting |
| M-6 | `staticSettings.font.name` and `.style` are **dead** | Zero consumers anywhere in `apps/` or `packages/`. The family is hardcoded as `'Inter', system-ui, …` in `apps/frontend/src/app.css:226-228` (`--font-base`). Only `.url` is live |
| M-7 | Which weights the app can actually render — **fresh production build** (`apps/frontend/build/`, built today 11:02) | Built CSS contains **`.font-bold` and `.font-normal` only**. `app.css:93` does `--font-weight-*: initial` and re-declares just `--font-weight-normal: 400` / `--font-weight-bold: 700`, so Tailwind v4 emits no `font-medium` / `font-semibold` utility at all |
| M-8 | …yet the source uses four | `font-bold` ×25, `font-normal` ×11, **`font-medium` ×9**, **`font-semibold` ×6**. The latter 15 are **dead classes** — they emit no CSS. So 400 + 700 is the complete rendering surface today, and vendoring exactly those two is rasterisation-neutral |
| M-9 | Italic surface | **0** occurrences of `italic` in `apps/frontend/src`. No italic face is needed |
| M-10 | Third-party hosts in the **production build output** | `fonts.googleapis.com` ×7 · `fonts.gstatic.com` ×3 · `cloud.umami.is` ×3. The umami references are analytics (`analytics.trackEvents: false` in `staticSettings.ts:61-63`) and are **not a font host** — out of scope for criterion 4 as written |
| M-11 | `apps/docs` has its own hardcoded copy | `apps/docs/src/app.html:9-11` — the same two preconnects plus the same `css2?family=Inter:wght@400;700&display=swap` stylesheet, entirely independent of `staticSettings` |
| M-12 | **Phase 137's preflight now blocks the container recipe** (new since the v2.14 runs) | `tests/global-setup.ts:41` derives `repoRoot = path.resolve(TESTS_DIR, '../..')` — *the test process's own path*. `tests/tests/support/preflight.ts:429-444` then requires `path.resolve(servedModuleRoot) === path.resolve(repoRoot, 'apps/frontend')`, a **strict absolute-path equality** against the path the **host** dev server emits. The v2.14 recipe mounts `-v "$PWD":/work -w /work`, so the container computes `/work/apps/frontend` and the host serves `/Users/…/voting-advice-application-gsd/apps/frontend`. Clause (b1) (`/@fs<repoRoot>/apps/frontend/src/routes/+layout.svelte` → 200) fails for the same reason. There is no skip flag by design |
| M-13 | Container prerequisites are present locally | Docker 29.7.2; `mcr.microsoft.com/playwright:v1.58.2-noble` already cached (2.39 GB), the exact tag the recipe and `@playwright/test@1.58.2` pin |
| M-14 | No executable container recipe exists in-repo | The procedure lives only as prose in the spec docblock (`visual-regression.spec.ts:24-43`) and in the `main.yaml` comment. No script, no make target. The socat host-port forwarding step is described nowhere in `tests/README.md` (0 hits for `socat`, `docker run`, `0.0.0.0`) |
| M-15 | Two stale claims in `tests/README.md:185` | (a) *"`auth-setup` can't authenticate against the base dataset yet (no registered base candidate / email)"* — **false since Phase 136**: `auth.setup.ts` force-registers base CA-AA-1 via `SupabaseAdminClient`. (b) *"Screenshot baselines under `tests/specs/__screenshots__/`"* — the real path is `tests/tests/specs/visual/__screenshots__/` |
| M-16 | One stale claim in `.github/workflows/main.yaml:318-319` | *"The job needs network access to fonts.googleapis.com"* — true today, false the moment VGATE-04 lands |
| M-17 | Prior noise data, all of it | From `136-VISUAL-DISCRIMINATION-EVIDENCE.md`: both `candidate-preview` baselines diffed at **exactly 0 px** across runs. The **voter pair's run-to-run noise has never been measured** — runs 1/5/6/7 passed at a 16k–47k budget, which bounds noise below that and says nothing more. That gap is precisely what VGATE-03 exists to close |

**The one-sentence root cause (sensitivity half):** `maxDiffPixelRatio` is a *proportional* budget
applied to `fullPage` screenshots of *unbounded* height, so a baseline's tolerance is a function of
its own length — the 1280×3684 desktop results page grants itself 47,155 px of slack and swallowed a
19,484 px regression that the 2.9×-smaller mobile capture caught at 19,545 px.

**The one-sentence root cause (egress half):** the app's only font source is a `<link>` to
`fonts.googleapis.com`, and since Phase 136 removed `continue-on-error` the job that depends on it is
build-reddening — a third-party availability risk inside a blocking gate.

---

## D-01 — Sensitivity mechanism: absolute cap, not bounded capture

The todo offered three options (A: absolute `maxDiffPixels` cap; B: element-scoped/clipped capture;
C: accept and document). **M-3 settles it on evidence rather than taste**: because Playwright takes
`Math.min` of the two budgets, adding `maxDiffPixels` is monotonically strictness-increasing on every
baseline and removes the height coupling completely — `min(N, 0.01·area)` is bounded by `N` regardless
of how tall the page grows. Option B buys the same property at the cost of *shrinking what the gate
looks at*: a layout regression outside the clipped element becomes invisible, which trades one
blindness for another. Option C is a non-starter under VGATE-01.

- [ ] **A ★ RECOMMENDED — add an absolute `maxDiffPixels` cap; keep `fullPage: true` captures unchanged.**
      Justified in writing against the D-04 noise measurements per VGATE-03. Coverage is unchanged,
      sensitivity becomes height-independent by construction (M-3), and no baseline loses area.
- [ ] **B — switch to bounded / element-scoped captures.** Removes the coupling too, but reduces the
      guarded surface and needs new fixtures per baseline.
- [ ] **C — accept and document.** Rejected by VGATE-01; listed only for completeness.

## D-02 — Where the cap lives: one global number, per-baseline override only if measured noise forces it

- [ ] **A ★ RECOMMENDED — a single global `maxDiffPixels` in `expect.toHaveScreenshot`, next to the
      existing `threshold`/`maxDiffPixelRatio`.** One number, one place, one comment carrying the
      derivation. Add a per-assertion override **only** if D-04's measurements show one baseline's
      noise genuinely exceeds the others' — and if so, record the number *and the reason* at the
      override site.
- [ ] **B — per-baseline caps from the start**, four numbers in the spec. More precise, four things
      to re-derive at every re-baseline.

## D-03 — Keep `maxDiffPixelRatio` alongside the cap

Under M-3's `Math.min`, keeping the ratio can only ever tighten further — never loosen. Its value is
as a **small-baseline floor**: if a future baseline is small enough that `0.01·area < N`, the ratio
binds and the gate stays proportionate there.

- [ ] **A ★ RECOMMENDED — keep both, and re-document the ratio as the small-baseline floor rather
      than as "the budget".** The comment at `playwright.config.ts:314` currently reads as if the
      ratio *is* the budget; after this phase the cap is, on every baseline the suite has today.
- [ ] **B — drop `maxDiffPixelRatio` entirely** once the cap is set. Fewer knobs; loses the floor.

## D-04 — Noise-measurement protocol (VGATE-03's evidence)

VGATE-03 requires the number be **selected from measured per-baseline run-to-run noise**, recorded so
it can be re-derived. M-17 says only the `candidate-preview` pair has data (0 px); the voter pair —
the two baselines that actually matter — has none.

- [ ] **A ★ RECOMMENDED — 10 consecutive captures per baseline in-container at `maxDiffPixels: 0`
      (measurement configuration only, never shipped), reading counts off the failure text per M-4.**
      Record every run's per-baseline count — not just the max — in `146-VISUAL-NOISE-LEDGER.md`, with
      image digest, platform, invocation and dataset, so the threshold is re-derivable. n=10 at ~1.2 min
      a run is ~15 min and gives a distribution; n=3 gives a number with no shape, which is what
      VGATE-03 exists to stop.
- [ ] **B — n=5.** Halves the wall-clock, weaker tail.
- [ ] **C — n=3.** Matches the roadmap's minimum for criterion 5, but that criterion is about *pass
      stability*, not about noise distribution.

## D-05 — Lock the derivation *rule*, not the number

The number cannot be chosen in this discussion — it does not exist until D-04 runs. What can be
locked is the arithmetic, so the researcher/planner do not re-litigate it.

- [ ] **A ★ RECOMMENDED — `cap = max(observed per-baseline noise across all runs) × 10`, floored at a
      minimum of 200 px and rounded up to a round number; and the cap MUST be < 5,000 px, i.e. at
      least ~4× below the 19,484 px regression it has to catch.** If the measured noise makes those
      two constraints incompatible, that is a *finding* — stop and record it rather than quietly
      widening. Write the arithmetic into the config comment.
- [ ] **B — `cap = max(noise) × 3`.** Tighter, more exposed to an unobserved tail.
- [ ] **C — pick a round number below the regression** (e.g. 2,000) without tying it to noise.
      Explicitly what VGATE-03 forbids.

## D-06 — Proving height-independence (criterion 3)

Criterion 3 wants *the same absolute injected damage to fail on both a short and a deliberately
lengthened capture of the same route*. The lengthening must not perturb the shipped baselines or the
shared dataset (the standing constraint every visual change in this repo has had to respect).

- [ ] **A ★ RECOMMENDED — a dedicated, non-baselined control run: capture the route twice in one
      controlled session — once as-is, once with the page lengthened by injected DOM/CSS at capture
      time (`page.addStyleTag` / `page.evaluate` appending inert filler below the fold) — compare each
      against its own freshly-taken reference with the same injected damage present, and record both
      diff counts and both verdicts in the negative-control ledger.** No new committed baseline, no
      seed change, no fixture change; the artefact is the ledger, not a PNG.
- [ ] **B — seed additional candidates so the results list grows naturally.** Most realistic
      lengthening, but it mutates `e2e/base` and perturbs the voter/candidate journey assertions —
      the exact constraint Phase 136 called load-bearing.
- [ ] **C — add a second committed baseline for a lengthened variant.** Permanent, but doubles the
      re-baseline cost forever for a one-time proof.

## D-07 — Negative-control shape (the standing milestone rule)

The milestone's standing rule: *prove the guard fails before claiming it guards* — the blindness half
against the old assertion, the catch half against the new one. Criterion 2 names both explicitly.

- [ ] **A ★ RECOMMENDED — reuse the identical v2.14 injection (`MatchScore.svelte:30`, `text-lg` →
      `text-2xl`), run in the same image at the same digest, and record four halves in
      `146-NEGATIVE-CONTROL.md`:** (1) old config + injection → `voter-results-desktop` **passes**
      (blindness re-observed, not cited), (2) old config + injection → `voter-results-mobile` **fails**
      (the one it did catch), (3) new config + injection → **both** voter baselines fail, (4) new
      config, clean tree → all green. Comparability with the recorded 19,484 / 19,545 px numbers is
      the entire point of reusing the same injection.
- [ ] **B — design a fresh injection** more representative of a typical regression. Loses direct
      comparability with the only numbers this project has.

## D-08 — How Inter gets self-hosted

M-5/M-6: exactly one live consumer (`font.url`), and `font.name`/`font.style` are dead. The setting
is a documented framework customization point ("the download url of the font… added to the `<link>`
tag") — a downstream VAA operator is meant to be able to point it elsewhere.

- [ ] **A ★ RECOMMENDED — vendor the `woff2` files into `apps/frontend/static/fonts/`, add a
      same-origin `static/fonts/inter.css` carrying the `@font-face` rules, and change the
      `staticSettings.font.url` **default** to that same-origin path.** Nothing in the layout changes
      shape: `<link href={fontUrl} rel="stylesheet">` still works, the `indexOf('fonts.googleapis')`
      preconnect test naturally goes false for the default while still firing for an operator who
      overrides back to Google, and the customization point survives intact. The vendored bytes are
      auditable in-tree.
- [ ] **B — add `@fontsource/inter` as a dependency and `@import` its CSS from `app.css`.** Versioned
      and updatable by the package manager, but it bypasses `staticSettings.font.url` entirely — the
      documented customization point becomes a lie, and a downstream override would load *two* fonts.
- [ ] **C — inline the woff2 as base64 `@font-face` in `app.css`.** Removes even the second request;
      inflates the critical CSS by hundreds of KB and makes the font invisible to caching.

## D-09 — Which faces to vendor

M-7/M-8/M-9 make this arithmetic rather than judgement: the built CSS emits **only** 400 and 700; the
15 `font-medium`/`font-semibold` usages emit nothing; there is no italic anywhere. Locales are
en/fi/sv — Latin-script only.

- [ ] **A ★ RECOMMENDED — exactly 4 files: Inter 400 and 700, `latin` and `latin-ext` subsets,
      normal style, with the upstream `unicode-range` declarations preserved; plus the SIL OFL 1.1
      `OFL.txt` committed alongside them.** This reproduces today's rendering surface exactly, so the
      only re-baseline delta is Google-served-vs-self-hosted file differences and not a design change.
      Source the files from the OFL-licensed `@fontsource/inter` distribution as-is (no re-subsetting
      tooling in the repo).
- [ ] **B — also vendor 500 and 600**, so the 15 dead `font-medium`/`font-semibold` classes start
      rendering. That is a **visual design change** smuggled into a test-infrastructure phase; the
      baselines would then encode a new look. → If A is taken, file a todo for the 15 dead classes
      instead (decide deliberately whether they should be `font-normal`/`font-bold` or whether the
      theme should gain the weights).
- [ ] **C — a single variable woff2 per subset.** Fewer files, covers every weight; changes rendering
      for the same reason B does, and variable-font rasterisation differs from static instances.

## D-10 — What `settleFonts` and the preconnects become

`settleFonts` (`visual-regression.spec.ts:56-76`) exists to convert an unreachable-Google failure
from an inscrutable pixel diff into a named "Inter did not load". Self-hosting removes the network,
but not the failure mode: a wrong vendored path fails identically.

- [ ] **A ★ RECOMMENDED — keep `settleFonts` and its `document.fonts.check('1em Inter')` assertion
      verbatim; rewrite only its docblock** so the rationale names a broken same-origin asset rather
      than an egress-restricted runner. Leave the conditional preconnect block at `+layout.svelte:221`
      **in place** — it is dead for the default and correct for an operator who overrides `font.url`
      back to Google.
- [ ] **B — delete `settleFonts`** now that the race is same-origin. Removes the only thing standing
      between a broken font path and a whole-page diff.
- [ ] **C — delete the preconnect block too.** Cleaner default; silently degrades any downstream
      operator who overrides the URL.

## D-11 — How egress is blocked for criterion 4

The criterion is explicit that *the block is applied to the runner, not simulated by a stubbed fetch* —
so `page.route(…)` interception is out by construction.

- [ ] **A ★ RECOMMENDED — blackhole both hosts at the container's own resolver:
      `--add-host fonts.googleapis.com:127.0.0.1 --add-host fonts.gstatic.com:127.0.0.1` on the
      `docker run`, and prove the block is live with an in-container `curl` control (must fail)
      recorded in the ledger before the suite runs.** Environment-level, needs no extra capability,
      reproducible from the committed script, and the control makes it falsifiable rather than
      assumed.
- [ ] **B — `iptables -j DROP` inside the container (`--cap-add=NET_ADMIN`).** Blocks by IP rather
      than by name, so it survives a hardcoded-IP bypass; needs an elevated capability and a rule set
      that has to be re-derived if Google's ranges move.
- [ ] **C — run the container with `--network none`.** Absolute, but also severs the host stack the
      suite needs — unusable here.

## D-12 — How VGATE-05 (production app issues no third-party font request) is discharged

- [ ] **A ★ RECOMMENDED — both halves: (1) a permanent request-listener guard in the visual spec
      (`page.on('request')` failing on any URL matching a third-party font host), so a future
      re-introduction reddens the build; and (2) one recorded production-build network trace in the
      ledger, since VGATE-05 says "the production app" and the suite drives the dev server.**
      Consistent with the milestone's preference for standing guards over one-off observations.
- [ ] **B — the one-off production-build trace only.** Discharges the requirement literally; nothing
      stops a regression tomorrow.
- [ ] **C — a static assertion over the built output** (grep `apps/frontend/build` for font hosts).
      Cheap and CI-able, but proves absence of a *string*, not absence of a *request*.

## D-13 — `apps/docs` is out of scope

M-11: the docs site carries its own hardcoded Google Fonts `<link>`, independent of `staticSettings`.
VGATE-05 names "the production app" — the VAA — and this project's own precedent (Phase 138's shape
note; the `tests/README.md` concurrency item filed rather than fixed at v2.14 close) is to file
adjacent work rather than pad a phase with it.

- [ ] **A ★ RECOMMENDED — frontend only. Record `apps/docs/src/app.html:9-11` explicitly in the phase
      record as known-remaining, and file a todo.** The record says what was left, so nobody later
      reads "self-hosted Inter" as covering the docs site.
- [ ] **B — fix `apps/docs` in the same pass.** ~3 lines plus its own copy of the woff2 files; makes
      the repo genuinely Google-Fonts-free. Scope creep by this project's own rule, but cheap.

## D-14 — The container mount path must equal the host path (prerequisite, not preference)

M-12 is a **blocker**, not a nicety: with the v2.14 `-v "$PWD":/work -w /work` mount, Phase 137's
preflight aborts the run with exit 1 before any spec body, and it has no bypass. Every in-container
run this phase needs — noise measurement, both negative-control halves, the egress-blocked run, the
consecutive-run proof — hits it first.

- [ ] **A ★ RECOMMENDED — mount at the identical absolute path: `-v "$PWD":"$PWD" -w "$PWD"`.**
      Container and host then agree on `repoRoot`, both preflight clauses pass unchanged, and **not one
      byte of the preflight changes** — the integrity gate keeps its full strength. Verify by
      observation (a preflight-passing container run) rather than by reasoning, and record it.
- [ ] **B — add an env-var escape hatch to the preflight** for containerised runs. Directly contradicts
      `global-setup.ts:19-21` ("There is no bypass here by design") — this phase would be punching the
      hole Phase 137 deliberately refused.
- [ ] **C — run the dev server inside the container too.** Removes the mismatch and the socat step,
      but changes the served-app environment the baselines are captured against.

## D-15 — Land the container recipe as an executable script

M-14: the recipe exists only as prose, and this phase will run it on the order of 20 times. A recipe
that is re-typed by hand each time is a recipe whose next runner gets a different answer.

- [ ] **A ★ RECOMMENDED — commit `tests/scripts/visual-container.sh`** encoding the whole recipe:
      image + digest pin, `--platform linux/amd64`, the D-14 identical-path mount, the socat host-port
      forwarding, `--workers=1`, and flags for the two modes this phase needs (`--update-snapshots`,
      and the D-11 egress block). Point the spec docblock, `tests/README.md` and the `main.yaml`
      comment at the script instead of restating the steps in three places.
- [ ] **B — keep it as prose**, improved in the docblock only. No new surface to maintain; every
      future re-baseline re-derives the socat step from scratch.

## D-16 — The run-4 anomaly (criterion 5): a bounded attempt to reproduce, then record either way

The v2.14 record is honest that this is **1 unexplained failure in 5 clean runs**, hypothesis (Vite
HMR staleness after a revert against a long-running dev server) **UNCONFIRMED**, failing test unknown.
Standing feedback on this project: flag unverified root causes and re-test in isolation before
accepting one.

- [ ] **A ★ RECOMMENDED — one bounded, falsifiable control (≤3 attempts): inject → run → `git checkout --`
      → run immediately without restarting the dev server, capturing full output every time.** If it
      reproduces, the hypothesis is confirmed and the remedy is a documented restart step. If it does
      not, record it as **still unexplained** with the attempt described — never as "did not recur, so
      presumed gone", which is the reasoning this milestone rejected for DEF-135-04.
- [ ] **B — skip the reproduction; rely on the consecutive-run count** in D-17 to re-observe it or not.
      Cheaper; leaves an unexplained failure carried a second milestone with no new information.

## D-17 — How many consecutive green runs

Criterion 5 says ≥3. But the anomaly D-16 is chasing appeared once in five runs; three runs has poor
power to re-observe a ~20 % event.

- [ ] **A ★ RECOMMENDED — 5 consecutive runs at `--workers=1 --retries=0` (stricter than CI, which
      retries 3×), plus 1 final run under CI's literal invocation (`CI=true`, `--grep "@visual"`).**
      Six runs total, mirroring the Phase 136 gate shape and giving the anomaly a fair chance to
      reappear. Every run's exit code and per-test result recorded, including any that fail.
- [ ] **B — the roadmap's minimum: 3 strict + 1 CI-literal.** Meets criterion 5 as written; weaker
      against D-16.

## D-18 — Record corrections carried by this phase

Four stale statements were measured en route (M-15, M-16). This project corrects the record inside the
phase that touches the surface rather than leaving it for a reader to trip over.

- [ ] **A ★ RECOMMENDED — correct all four, in the same phase, after the gates are green** (the
      Phase-144 ordering: records last): `tests/README.md:185` — drop the false "`auth-setup` can't
      authenticate against the base dataset yet" blocker and fix the baseline path to
      `tests/tests/specs/visual/__screenshots__/`; `.github/workflows/main.yaml:318-319` — replace
      "the job needs network access to fonts.googleapis.com" with the self-hosted reality; and
      `visual-regression.spec.ts`'s docblock — the `settleFonts` rationale (per D-10) and the recipe
      pointer (per D-15).
- [ ] **B — correct only the two that this phase falsifies** (the `main.yaml` comment and the
      `settleFonts` docblock); leave the two `tests/README.md` errors for a separate pass.

---

## Deferred ideas (captured, not acted on)

| Idea | Why deferred |
|---|---|
| The 15 dead `font-medium` / `font-semibold` classes (M-8) | A design decision about the type scale, not test infrastructure. Todo per D-09 |
| `apps/docs` Google Fonts `<link>` (M-11) | Adjacent app, not "the production app" VGATE-05 names. Todo per D-13 |
| `cloud.umami.is` third-party analytics references in the production build (M-10) | Not a font host; outside criterion 4 as written. A privacy question worth its own phase |
| Making `staticSettings.font.name` / `.style` live, or deleting them (M-6) | Dead settings surface; a framework-API cleanup, not this phase |
