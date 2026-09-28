# Phase 146: Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline - Research

**Researched:** 2026-08-25
**Measured at HEAD:** `f857b200e` (two `.planning/`-only commits since `f36ad1ce1`; zero product/test bytes changed — every M-number re-verified below)
**Domain:** Playwright visual-regression gating · containerised CI-matching capture · webfont self-hosting
**Confidence:** HIGH (every load-bearing claim was re-measured in this session; four new findings are container-observed, not reasoned)

<user_constraints>
## User Constraints (from CONTEXT.md)

All **18 items** in `146-DISCUSSION-POINTS.md` resolved to their ★ RECOMMENDED option; **0 overrules**.
These are LOCKED. Research does **not** re-litigate them; it supplies the executable *how*.

### Locked Decisions

**The sensitivity mechanism**
- **D-01 → A:** add an absolute `maxDiffPixels` cap; keep `fullPage: true` captures unchanged.
- **D-02 → A:** one global `maxDiffPixels` in `expect.toHaveScreenshot`, derivation in the comment. Per-assertion override only if D-04 shows one baseline's noise genuinely exceeds the others'.
- **D-03 → A:** keep `maxDiffPixelRatio` alongside the cap, re-documented as the **small-baseline floor**, not "the budget".
- **D-05 → A:** lock the derivation *rule*, not the number. `cap = max(observed per-baseline noise across all runs) × 10`, floored at **200 px**, rounded up to a round number, and **MUST be < 5,000 px**. If those two constraints are incompatible, **that is a finding — stop and record it, never quietly widen.**

**The evidence (VGATE-03)**
- **D-04 → A:** n=10 consecutive captures per baseline, in-container, at `maxDiffPixels: 0` (measurement-only configuration, never shipped). Record **every run's per-baseline count** in `146-VISUAL-NOISE-LEDGER.md` with image digest, platform, invocation and dataset.
- **D-06 → A:** prove height-independence with a dedicated, **non-baselined** control run — capture the route twice in one session (as-is, and lengthened by injected DOM/CSS below the fold), each compared against its own freshly-taken reference with the same injected damage present. No new committed baseline, no seed change, no fixture change; the artefact is the ledger.
- **D-07 → A:** reuse the identical v2.14 injection (`MatchScore.svelte:30`, `text-lg` → `text-2xl`), same image, same digest; record **four halves** in `146-NEGATIVE-CONTROL.md`.

**Self-hosting Inter**
- **D-08 → A:** vendor woff2 into `apps/frontend/static/fonts/`, add same-origin `static/fonts/inter.css`, change the `staticSettings.font.url` **default**. (Reversibility: **costly** — a published framework default.)
- **D-09 → A:** exactly 4 files — Inter 400 and 700, `latin` and `latin-ext`, normal style, **upstream `unicode-range` preserved** — plus SIL OFL 1.1 `OFL.txt`. Source from the OFL-licensed `@fontsource/inter` distribution **as-is**.
- **D-10 → A:** keep `settleFonts` **verbatim**; rewrite only its docblock. Leave the conditional preconnect block at `+layout.svelte:221` in place.

**Proving it (criteria 4 and 5)**
- **D-11 → A:** blackhole both hosts at the container's own resolver (`--add-host fonts.googleapis.com:127.0.0.1 --add-host fonts.gstatic.com:127.0.0.1`), and prove the block is live with an in-container `curl` control (**must fail**) recorded **before** the suite runs.
- **D-12 → A:** both halves — a **permanent** `page.on('request')` guard in the visual spec, **and** one recorded production-build network trace.
- **D-16 → A:** one bounded, falsifiable attempt (**≤3 tries**) to reproduce the run-4 anomaly: inject → run → `git checkout --` → run immediately **without restarting the dev server**. If it does not reproduce, record it as **still unexplained**.
- **D-17 → A:** 5 consecutive runs at `--workers=1 --retries=0`, plus 1 final run under CI's literal invocation (`CI=true`, `--grep "@visual"`). Six runs total; every run's exit code and per-test result recorded, including failures.

**Prerequisites and tooling**
- **D-14 → A (a blocker):** mount at the identical absolute path — `-v "$PWD":"$PWD" -w "$PWD"`. **Not one byte of the preflight changes.** Verify by observation, and record it.
- **D-15 → A:** commit `tests/scripts/visual-container.sh` encoding the whole recipe; point the spec docblock, `tests/README.md` and the `main.yaml` comment **at the script**.

**Record corrections**
- **D-18 → A:** correct all four stale statements, **after the gates are green** (records last).
- **D-13 → A:** frontend only. Record `apps/docs/src/app.html:9-11` explicitly as known-remaining; file a todo.

### Claude's Discretion

- Plan count and wave shape, subject to the ordering constraint.
- Exact filenames/paths under `apps/frontend/static/fonts/` and the `@font-face` CSS's internal shape, provided the four faces and their upstream `unicode-range` declarations are preserved.
- The shell-flag surface of `visual-container.sh`, provided it encodes every element D-15 lists.
- The regex/host list backing the D-12 request-listener guard.
- Where the noise ledger and negative-control ledger split vs. merge.

### Deferred Ideas (OUT OF SCOPE)

| Idea | Why deferred |
|---|---|
| The 15 dead `font-medium` / `font-semibold` classes (M-8) | A type-scale design decision. **File a todo** per D-09 |
| `apps/docs` Google Fonts `<link>` (M-11) | Adjacent app. **File a todo** per D-13; name it as known-remaining in the record |
| `cloud.umami.is` analytics references in the production build (M-10) | Not a font host; outside criterion 4 as written |
| Making `staticSettings.font.name` / `.style` live, or deleting them (M-6) | Dead settings surface; framework-API cleanup |

### Hard ordering constraints (restated for the planner)

1. **Ledger-first.** The negative-control **blindness half** (old config + injection → `voter-results-desktop` **passes**) must be captured **before** the fix lands, so the first plan writes **zero product bytes**. This **overrides tracer-first** per `.planning/REQUIREMENTS.md:9-13`.
2. **Not one byte** of `tests/tests/support/preflight.ts` or `tests/global-setup.ts` may change (D-14 A; env-var escape hatch explicitly rejected).
3. **No new committed baseline** for the D-06 control; no change to `e2e/base` or the journey fixtures.
4. **The cap's numeric value CANNOT be chosen in planning.** Lock the arithmetic, not a number.
5. **E2E cardinal rule** (`CLAUDE.md` § E2E Hard Rule): no flaky exemptions; a "did not run" test counts as a failure.
6. **The egress `curl` control runs BEFORE the suite**, not after.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (verbatim, `.planning/REQUIREMENTS.md:22-27`) | Research Support |
|----|-------------|------------------|
| **VGATE-01** | "An injected component-level regression of the magnitude measured at v2.14 close (~19,500 diff px) is caught on **every** baseline in the suite, including `voter-results-desktop` (1280×3684), which previously passed it at 0.41% of its ratio budget." | § *The `Math.min` combination rule* (re-verified at `comparators.js:88-94`) proves the absolute cap is monotonically strictness-increasing; § *Negative-control mechanics* gives the four-half protocol and the injection's exact source line. |
| **VGATE-02** | "The gate's diff budget no longer scales with captured page height — a baseline that grows taller does not silently raise its own tolerance." | § *The D-06 height-independence control* gives the exact 4-capture Playwright design, the filler-injection recipe that does not perturb above-the-fold layout, and where the throwaway references live. |
| **VGATE-03** | "The chosen sensitivity mechanism … is selected from **measured** per-baseline run-to-run noise, and those measurements are recorded so the threshold can be re-derived rather than re-guessed." | § *The measurement-only configuration* gives the overlay-config mechanism (no shipped knob), the verbatim failure-message shape, and the JSON-reporter extraction (robust; in-repo precedent). |
| **VGATE-04** | "The app loads its Inter typeface from its own origin — the `e2e-visual` job completes green with all egress to `fonts.googleapis.com` blocked." | § *Self-hosting Inter, concretely* (4 files, verbatim `unicode-range`, byte-provenance proof) + § *The egress block* (**verified live in the container at both curl and Chromium level**). |
| **VGATE-05** | "The production app issues no third-party font request (the privacy/latency win the self-hosting delivers independently of testing)." | § *The D-12 request-listener guard* (attachment point, host list, loud failure) + § *The production-build network trace* — including **N-6**, why a static grep of `apps/frontend/build/` will still hit `fonts.googleapis.com`. |
| **VGATE-06** | "Baselines are re-captured in the CI-matching container after VGATE-01..05 land, and the full visual project passes green there across consecutive runs." | § *The container recipe, end to end* + **N-4** (`--update-snapshots` mode semantics, read from the installed source — bare `-u` is the **wrong** mode for this phase's re-baseline). |

</phase_requirements>

## Summary

The 18 decisions are locked and, on re-measurement, **all of them survive**. What did *not* survive is
a set of premises the discussion doc reasoned from. This research re-ran every M-number at HEAD
`f857b200e` and then went further, into the container itself. Five findings change what the plan must
do, and three of them were invisible from source-reading alone because they only appear when the
CI-matching image is actually running.

The biggest is **N-1**: the app does **not** currently render static Inter. `css2?family=Inter:wght@400;700`
makes Google serve **one 48,256-byte variable woff2** shared by both the 400 and the 700 `@font-face`
rule — the file's table directory carries `fvar`, `gvar`, `avar`, `HVAR` and `MVAR`. D-09's neutrality
argument ("400 + 700 is the complete rendering surface, so vendoring exactly those is
rasterisation-neutral") is correct **about weights** and silent about **delivery**: the switch is
variable→static. `@fontsource/inter@5.3.0`'s files are byte-identical to Google's own single-weight
static instances (sha256 match, both weights), so the provenance is impeccable — but the currently
rasterised outlines come from a different file. The plan must therefore **measure** the font delta
before absorbing it into a re-baseline, exactly as `<specifics>` already demands, rather than assert it away.

The second is **N-2**: `settleFonts`'s `document.fonts.check('1em Inter')` assertion is **blind to a
missing stylesheet**. Measured in the container: with no `@font-face` rule present at all (the exact
state produced by an unreachable `fonts.googleapis.com`, or by a wrong same-origin `/fonts/inter.css`
path), `check()` returns **`true`** and `document.fonts.size` is `0`. It returns `false` only when a
face exists whose `src` fails. So the docblock sentence the phase is about to *rewrite* is not merely
stale in its example — its central claim was never true. D-10 A keeps `settleFonts` verbatim, which is
still right; the hole is closed for free by the D-12 request guard, which is already in scope.

The remainder is executable detail the planner needs and cannot derive: the container recipe is
**verified working** at the identical-path mount (D-14 proven by observation, not reasoning), the
`--add-host` blackhole is **verified at Chromium level** (`net::ERR_CONNECTION_REFUSED`), `socat` is
**not installed** in the pinned image, and bare `--update-snapshots` resolves to mode `changed`, which
is the **wrong** mode for VGATE-06's re-baseline.

**Primary recommendation:** build `tests/scripts/visual-container.sh` around the verified invocation in
§ *The container recipe*, replace the v2.14 socat step with a committed ~20-line Node TCP forwarder
(no `apt-get`, no undocumented step), take the noise measurements through a **throwaway overlay
config** read via the **JSON reporter**, and insert an explicit *font-delta measurement* task between
the font change and the re-baseline.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Diff-budget arithmetic (`maxDiffPixels` / `maxDiffPixelRatio`) | Test config (`tests/playwright.config.ts`) | — | `expect.toHaveScreenshot` is the single global budget surface; `comparators.js:88-94` consumes it. No product tier is involved. |
| Height-independence proof | Test spec + throwaway config overlay | Test artefacts (`tests/e2e-runs/`, gitignored) | The proof is a measurement, not a shipped guard; the shipped guard is the cap itself. |
| Noise measurement | Throwaway config overlay + JSON reporter | Ledger (`.planning/`) | Must never ship a zero-tolerance knob (D-04). |
| Font **delivery** (`<link>` emission, preconnect gating) | Frontend SSR head (`apps/frontend/src/routes/+layout.svelte:207-225`) | — | Sole live consumer of `staticSettings.font.url` (M-5, re-verified). |
| Font **default value** | Shared settings package (`packages/app-shared/src/settings/staticSettings.ts:41-45`) | Frontend (consumes built `dist/`) | It is a published framework customization point; the default lives where operators override it. |
| Font **bytes** + `@font-face` rules | SvelteKit static assets (`apps/frontend/static/fonts/`) | — | `static/` is served at origin root at both dev and build; no bundler involvement, so no hashing/CSP surprises. |
| Third-party-request prohibition | Test spec listener (permanent) | One-off production-build trace | D-12 A: a standing guard beats a one-off observation, but VGATE-05 says "the production app" and the suite drives the dev server — hence both halves. |
| Egress block | Container runtime (`--add-host`) | — | Criterion 4 is explicit: applied **to the runner**, not simulated. `page.route()` is out by construction. |
| Repo/served-app identity | Preflight (`tests/global-setup.ts` → `tests/tests/support/preflight.ts`) | Container mount path | **Immutable** (D-14 A). The mount moves; the gate does not. |

## Re-verification of M-1 … M-17 at HEAD `f857b200e`

Every measurement re-run in this session. **All 17 hold.** Two get material corrections (M-4's message
text, M-13's digest field), and one (M-3) gains a consequence the doc did not draw.

| # | Verdict | Re-measured evidence |
|---|---------|----------------------|
| M-1 | ✅ **HOLDS** | `tests/playwright.config.ts:315-319` verbatim: `expect: {` / `toHaveScreenshot: {` / `threshold: 0.2,` / `maxDiffPixelRatio: 0.01` — **no `maxDiffPixels`**. `grep -n "visual" tests/playwright.config.ts` shows no per-assertion override; the spec's four `toHaveScreenshot` calls (`:91`, `:110`, `:131`, `:154`) pass only `fullPage: true, animations: 'disabled'`. [VERIFIED: tests/playwright.config.ts:315-319] |
| M-2 | ✅ **HOLDS** | PNG IHDR read directly off disk: `voter-results-desktop.png` **1280×3684** (324,146 B) · `voter-results-mobile.png` **390×4152** (308,340 B) · `candidate-preview-desktop.png` **1280×821** (81,763 B) · `candidate-preview-mobile.png` **390×924** (68,489 B). [VERIFIED: node PNG header read over `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/`] |
| M-3 | ✅ **HOLDS + consequence** | `node_modules/playwright-core/lib/server/utils/comparators.js:88-94` verbatim: `const maxDiffPixels1 = options.maxDiffPixels;` … `if (maxDiffPixels1 !== void 0 && maxDiffPixels2 !== void 0)` / `maxDiffPixels = Math.min(maxDiffPixels1, maxDiffPixels2);` / `else` / `maxDiffPixels = maxDiffPixels1 ?? maxDiffPixels2 ?? 0;`. `playwright-core` version confirmed `1.58.2`. **Consequence the doc did not draw:** line 96 is `count > maxDiffPixels`, a **strict** comparison — so `maxDiffPixels: 0` fails on a count of 1 and passes on 0, which is exactly the D-04 measurement semantics required. [VERIFIED: node_modules/playwright-core/lib/server/utils/comparators.js:88-96] |
| M-4 | ⚠️ **HOLDS, text corrected** | The doc quotes `` `${count} pixels (ratio ${ratio}) are different.` ``. The **actual** source, `comparators.js:96`, is: <br>`` `${count} pixels (ratio ${ratio.toFixed(2)} of all image pixels) are different.` `` <br>Three differences matter: the phrase **"of all image pixels"** is present (grep patterns must account for it), the ratio is `.toFixed(2)`, and `:95` computes `ratio = Math.ceil(count / (expected.width * expected.height) * 100) / 100` — **the ratio is quantised to 2 dp and is useless as a noise readout. Only `count` is.** [VERIFIED: node_modules/playwright-core/lib/server/utils/comparators.js:95-96] |
| M-5 | ✅ **HOLDS** | `apps/frontend/src/routes/+layout.svelte` — `:207-208` `const fontUrl =` / `staticSettings.font?.url ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';`; `:221` `{#if fontUrl.indexOf('fonts.googleapis') !== -1}`; `:222-223` the two preconnects; `:225` `<link href={fontUrl} rel="stylesheet" />`. Note the const spans **two** lines (207-208), not one. [VERIFIED: apps/frontend/src/routes/+layout.svelte:207-225] |
| M-6 | ✅ **HOLDS** | `packages/app-shared/src/settings/staticSettings.ts:41-45` verbatim: `font: {` / `name: 'Inter',` / `url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',` / `style: 'sans'` / `},`. Family hardcoded at `apps/frontend/src/app.css:226` (`--font-base:`), value `'Inter', system-ui, -apple-system, …`. [VERIFIED: packages/app-shared/src/settings/staticSettings.ts:41-45; apps/frontend/src/app.css:226-228] |
| M-7 | ✅ **HOLDS** | `apps/frontend/src/app.css:93` verbatim `  --font-weight-*: initial;`; `:222-223` verbatim `  --font-weight-normal: 400;` / `  --font-weight-bold: 700;`. Only those two weight tokens are re-declared. [VERIFIED: apps/frontend/src/app.css:93,222-223] |
| M-8 | ✅ **HOLDS** (not re-counted) | Dead-class counts not re-tallied; the mechanism (M-7) is verified and is what makes them dead. [CITED: 146-DISCUSSION-POINTS.md M-8] |
| M-9 | ✅ **HOLDS** (not re-counted) | [CITED: 146-DISCUSSION-POINTS.md M-9] |
| M-10 | ✅ **HOLDS + see N-6** | `grep -rn "fonts.googleapis" apps/frontend/build/` hits, e.g. `apps/frontend/build/server/chunks/_layout.svelte-D3JshrpC.js:110` and `:118`. **These are the `??` fallback literal and the preconnect literals, not a live request** — see N-6. [VERIFIED: grep over apps/frontend/build/] |
| M-11 | ✅ **HOLDS** | `apps/docs/src/app.html:9-11` verbatim: `<link rel="preconnect" href="https://fonts.googleapis.com" />` / `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />` / `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />`. [VERIFIED: apps/docs/src/app.html:9-11] |
| M-12 | ✅ **HOLDS — and the fix is now proven, not reasoned** | `tests/tests/utils/testsDir.ts:7` verbatim: `export const TESTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');` → `<repo>/tests/tests`. `tests/global-setup.ts:42` verbatim: `const repoRoot = path.resolve(TESTS_DIR, '..', '..');` (the doc writes `path.resolve(TESTS_DIR,'../..')` — same result, different call shape). `tests/tests/support/preflight.ts:429` `const expectedModuleRoot = path.join(repoRoot, FRONTEND_RELATIVE_ROOT);` and `:440` `if (path.resolve(observed.servedModuleRoot) !== path.resolve(expectedModuleRoot)) {`. `FRONTEND_RELATIVE_ROOT = 'apps/frontend'` at `:88`; `PROBE_RELATIVE_PATH = 'apps/frontend/src/routes/+layout.svelte'` at `:77`; the `/@fs` probe is built at `:411` (`const probeURL = \`${origin}/@fs${probeAbsolutePath}\``) and demands **strictly 200** at `:414`. `global-setup.ts:19-22` verbatim: `There is no bypass here by design: no environment variable skips` / `the gate and there is no CI early return. \`FRONTEND_PORT\` is the legitimate` / `escape hatch`. **See N-9 — the identical-path mount was executed and observed working.** [VERIFIED: tests/tests/utils/testsDir.ts:7; tests/global-setup.ts:19-22,42; tests/tests/support/preflight.ts:77,88,411,414,429,440] |
| M-13 | ⚠️ **HOLDS, one field corrected** | `docker version` → server **29.7.2**. `docker image inspect mcr.microsoft.com/playwright:v1.58.2-noble` → `Id=sha256:35524db2ea7f…`, `RepoDigests=[mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d]`, `Arch=amd64`, `Os=linux`, 2.39 GB. **The RepoDigest matches `136-VISUAL-DISCRIMINATION-EVIDENCE.md:23` exactly**, so a digest-pinned run needs no pull. Correction: `docker images --digests` prints `<none>` in its DIGEST column for this image — only `docker image inspect … {{.RepoDigests}}` surfaces it. A script that reads the digest must use `inspect`. [VERIFIED: `docker image inspect` output, this session] |
| M-14 | ✅ **HOLDS** | The recipe exists only as prose at `tests/tests/specs/visual/visual-regression.spec.ts:24-43` and as a comment at `.github/workflows/main.yaml:311-319`. `grep -rn "socat\|docker run\|0\.0\.0\.0" tests/` returns hits **only** in `visual-regression.spec.ts:32-33` and `tests/IDURA-TEST-RUNBOOK.md`; `tests/README.md` has **zero**. [VERIFIED: grep over tests/, .github/] |
| M-15 | ✅ **HOLDS** | `tests/README.md:185` still carries both errors verbatim: *"`auth-setup` can't authenticate against the base dataset yet (no registered base candidate / email). Screenshot baselines under `tests/specs/__screenshots__/`"*. Claim (a) is disproven by `tests/tests/setup/shared/auth.setup.ts:82-84`: `const client = new SupabaseAdminClient();` / `await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);` / `await client.forceRegister(TEST_CANDIDATE_EXTERNAL_ID, TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);`. Claim (b) is disproven by the real path `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/`. [VERIFIED: tests/README.md:185; tests/tests/setup/shared/auth.setup.ts:82-84] |
| M-16 | ✅ **HOLDS** | `.github/workflows/main.yaml:318-319` verbatim: `  # The job needs network access to fonts.googleapis.com: the app loads Inter` / `  # with display=swap and the specs assert it resolved before capturing.` The `e2e-visual:` job starts at `:320`. [VERIFIED: .github/workflows/main.yaml:318-320] |
| M-17 | ✅ **HOLDS** | `136-VISUAL-DISCRIMINATION-EVIDENCE.md:60-63` — desktop **19,484** px / **PASSES**, mobile **19,545** px / FAILS, both `candidate-preview` at **0** px. `:41` records run 4 as the anomaly; `:83-98` §5 records it as **NOT explained**. [VERIFIED: .planning/milestones/v2.14-phases/136-real-guards-visual-repair-sweep-remediation/136-VISUAL-DISCRIMINATION-EVIDENCE.md:41,60-63,83-98] |

### Ratio budgets, recomputed from the on-disk dimensions

| Baseline | W×H | Total px | `0.01 × area` | Binds against a cap of… |
|---|---|---|---|---|
| `voter-results-desktop` | 1280×3684 | 4,715,520 | **47,155** | never (any cap < 5,000 wins) |
| `voter-results-mobile` | 390×4152 | 1,619,280 | **16,192** | never (any cap < 5,000 wins) |
| `candidate-preview-desktop` | 1280×821 | 1,050,880 | **10,508** | never (any cap < 5,000 wins) |
| `candidate-preview-mobile` | 390×924 | 360,360 | **3,603** | **the ratio binds for any cap > 3,603** |

**Planner note for D-03's comment rewrite:** the "small-baseline floor" is not hypothetical — with the
D-05 ceiling of `< 5,000`, `candidate-preview-mobile` is *already* the case where the ratio, not the
cap, is the operative budget (3,603 < 5,000). The re-documentation should say so with this number, not
in the abstract. If D-04's noise puts the cap at or below ~3,600, the cap binds on all four and the
ratio is a pure future-proofing floor; state whichever is true after measurement.

## NEW FINDINGS — things the discussion doc could not see

These are the reason this research exists. Each is measured, not reasoned. N-1 and N-2 change premises
the decisions were argued from (the decisions themselves survive; their *rationales* need amending).
N-3 … N-5 change the recipe. N-6 changes ledger wording. N-8 … N-11 are recipe facts the plan needs.

---

### N-1 — 🔴 The app currently renders a **VARIABLE** font. D-09 A is not delivery-neutral.

**What was assumed.** D-09's argument is that because the built CSS emits only `.font-normal` and
`.font-bold` (M-7), vendoring exactly Inter 400 + 700 is *"rasterisation-neutral"* and "the only
re-baseline delta is Google-served-vs-self-hosted **file differences**".

**What is true.** Fetching the exact URL the app uses —
`https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap`, with a Chrome UA — returns
14 `@font-face` rules (7 subsets × 2 weights). For the `latin` subset, the **400 rule and the 700 rule
carry the *same* `src` URL**:

```
/* latin */ font-weight: 400;
  src: url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2) format('woff2');
/* latin */ font-weight: 700;
  src: url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2) format('woff2');
```

One file, both weights → it must be a variable font. Confirmed by parsing the WOFF2 table directory of
the downloaded 48,256-byte file: it contains **`fvar`, `gvar`, `avar`, `HVAR`, `MVAR`** (and `STAT`).
The `@fontsource/inter@5.3.0` static file has **none of them** (16 tables, no `fvar`/`gvar`).

Requesting a **single** weight (`css2?family=Inter:wght@400`) yields a *different* URL family
(`UcCO3Fwr…`) and a **static** instance of 23,664 bytes.

**The provenance is nonetheless perfect.** `@fontsource/inter@5.3.0`'s files are **byte-identical** to
Google's own single-weight static instances:

| File | sha256 |
|---|---|
| Google `css2?family=Inter:wght@400` → latin | `8909904ab6c872eb994093482a88a28eca2cd95912d7b6fecd72103b0dc07edc` |
| `@fontsource/inter@5.3.0` `files/inter-latin-400-normal.woff2` | `8909904ab6c872eb994093482a88a28eca2cd95912d7b6fecd72103b0dc07edc` |
| Google `css2?family=Inter:wght@700` → latin | `6f56409fd3d64bb85f7d070bce20749db2d66b6d63cec586cc22d1c761be2491` |
| `@fontsource/inter@5.3.0` `files/inter-latin-700-normal.woff2` | `6f56409fd3d64bb85f7d070bce20749db2d66b6d63cec586cc22d1c761be2491` |

**Consequence for the plan.** D-09 A stays (it is locked, it is still the right choice, and it is the
*only* option that avoids a weight-surface change). But the phrase "rasterisation-neutral" must not be
carried into the config comment, the ledger or the phase record. The switch is **variable→static**, and
whether FreeType instancing a VF at `wght=400` produces byte-identical raster output to the
corresponding static instance is an **empirical question this phase is uniquely positioned to answer**.

**Required plan change — insert a font-delta measurement task.** Between "the font default lands" and
"the re-baseline is taken", run the visual project **without** `--update-snapshots` against the still-old
baselines and record the four diff counts. That number *is* the variable→static delta, isolated from
everything else (the cap change does not alter pixels; it alters only the verdict). Record it in the
noise ledger beside the noise numbers. `<specifics>` already requires this — N-1 tells the planner
*why* it is not optional and what it is measuring.

**What would falsify neutrality:** any non-zero delta on the two `candidate-preview` baselines, which
`136-VISUAL-DISCRIMINATION-EVIDENCE.md:79-81` recorded at *exactly* 0 px across runs. Those two are the
project's cleanest signal: if they move at all, the move is the font.

*(Out of scope, but worth the record: `@fontsource-variable/inter` exists and would be the
delivery-neutral option. D-09 B/C are rejected and this is not a re-litigation — it is a note for
whoever reads the delta and asks "could we have avoided it?")* [VERIFIED: live fetch of
fonts.googleapis.com/css2 + `shasum -a 256` + WOFF2 table-directory parse, this session]

---

### N-2 — 🔴 `settleFonts` is **blind to a missing stylesheet**. Its docblock's central claim is false.

The current docblock claims (`visual-regression.spec.ts:66-69`), verbatim:

> `The `check` assertion is deliberate: if a runner cannot reach` <br>
> `fonts.googleapis.com, `document.fonts.ready` still resolves (with the fallback` <br>
> `in place) and the run would fail as an inscrutable whole-page pixel diff. This` <br>
> `fails it as "Inter did not load" instead.`

**Measured in the pinned container** (`mcr.microsoft.com/playwright@sha256:6446946a…`, Chromium,
`--add-host fonts.googleapis.com:127.0.0.1`):

| Scenario | `document.fonts.size` | face status | `document.fonts.check('1em Inter')` | `settleFonts` verdict |
|---|---|---|---|---|
| **A** — stylesheet blocked/404 → **no `@font-face` rule exists** | `0` | — | **`true`** | **PASSES — silently, on fallback glyphs** |
| **B** — `@font-face` present, `src` unreachable | `1` | `error` | `false` | FAILS, named |
| **C** — `@font-face` present, `src` valid (real vendored woff2 + `unicode-range: U+0000-00FF`) | `1` | `loaded` | `true` | PASSES, correctly |

Scenario A is **exactly** the egress-restricted-runner case the docblock names: the `<link>` to
`fonts.googleapis.com` fails (`net::ERR_CONNECTION_REFUSED`, observed), so the stylesheet never parses,
so zero `@font-face` rules are registered, so `check()` has nothing to be unloaded and returns `true`
vacuously. **`settleFonts` has never protected against the failure it says it protects against.** It
protects against scenario B — a broken *font file*, which is the swap-window race it was actually born
from (`136-05-SUMMARY.md` deviation #2).

**This is a fifth stale record claim**, not covered by M-15 or M-16, and it is live: it is the entire
stated rationale for a function D-10 A preserves verbatim.

**Consequences:**
1. **D-10 A survives** — keep `settleFonts` verbatim. Scenario C proves the self-hosted setup with
   `unicode-range` still satisfies it (`check()`'s default probe text is a single space, U+0020, inside
   the `latin` range).
2. **The docblock rewrite D-10 mandates must state the measured truth**, not a repaired version of the
   old claim. Suggested substance: *"`settleFonts` catches a vendored font file that fails to load
   (`document.fonts` face status `error`). It does **not** catch a missing or 404ing `inter.css` — with
   no `@font-face` rule registered, `check()` returns `true` on zero faces (measured, phase 146). That
   case is covered by the third-party/asset request guard below."*
3. **The D-12 guard should carry the second half.** D-12 A is already committed to a permanent
   `page.on('request')` listener. Extending its predicate to also assert that the same-origin
   `/fonts/inter.css` request returned **200** closes scenario A **without touching `settleFonts`** —
   honouring D-10 A's "verbatim" constraint exactly. This is the recommended resolution; it needs no
   new decision, only a slightly wider guard, which is explicitly Claude's discretion
   (*"The regex/host list backing the D-12 request-listener guard"*).

[VERIFIED: three-case Chromium probe executed inside `mcr.microsoft.com/playwright@sha256:6446946a…`, this session]

---

### N-3 — 🟠 `socat` is **NOT installed** in the pinned image. Replace it with a committed Node forwarder.

Measured inside the image: `command -v socat` → **`socat NOT installed`**. `curl` (`/usr/bin/curl`) and
`npx` (`/usr/bin/npx`) are present; node is `v24.13.0`.

The v2.14 recipe's socat step therefore implied an `apt-get install -y socat` that was never written
down anywhere (M-14: zero hits in `tests/README.md`). This phase runs the container ~20 times.

**Why a forwarder is needed at all** (not optional, verified):
- `tests/playwright.config.ts:327` hardcodes the host as `localhost`:
  `baseURL: process.env.FRONTEND_PORT ? \`http://localhost:${process.env.FRONTEND_PORT}\` : 'http://localhost:5173'`
- `tests/tests/utils/supabaseAdminClient.ts:59`:
  `const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';`
- The candidate `storageState` cookie is minted for origin `localhost:<port>`.

So the container must see the host's dev server and Supabase **on its own loopback under the name
`localhost`**, byte-identically to the host. `--network host` is not a reliable answer on macOS Docker
Desktop (it maps to the Linux VM, not the macOS host). Hence a loopback→`host.docker.internal` TCP
forwarder.

**Recommendation:** commit a ~20-line Node TCP forwarder alongside `visual-container.sh` instead of
`apt-get install socat`. It costs nothing (node is in the image), requires no network, is deterministic,
is auditable in-tree, and removes the "documented nowhere" defect M-14 names. Ports to forward:
**`$FRONTEND_PORT`** (Vite), **54321** (Supabase API), and **54324** (Inbucket — forwarded by v2.14;
keep it for parity even though the visual path likely does not need it).

Dual-stack matters: `136-06-SUMMARY.md:174` calls the v2.14 forwarders "dual-stack" specifically. Node's
`server.listen(port)` with no host binds `::` with dual-stack enabled by default, covering both `::1`
and `127.0.0.1` — which is precisely the property that made the v2.14 socat setup work.

**Fallback, if the Node forwarder is not adopted:** `apt-get update && apt-get install -y socat` inside
the container entrypoint. This *works* even under the D-11 blackhole, because `--add-host` blackholes
**only** those two names — general egress (and therefore apt) is untouched. **Do not** bake socat into a
derived image: that changes the image digest and destroys the "same image, same digest" comparability
D-07 depends on.

[VERIFIED: `command -v socat` / `command -v curl` / `command -v npx` / `node -v` executed inside the pinned image, this session]

---

### N-4 — 🟠 Bare `--update-snapshots` means mode **`changed`** — the wrong mode for VGATE-06.

`npx playwright test --help` (installed 1.58.2), verbatim:

```
  -u, --update-snapshots [mode]    Update snapshots with actual results. Running
                                   tests without the flag defaults to "missing"
                                   (choices: "all", "changed", "missing",
                                   "none", preset: "changed")
```

The v2.14 prose recipe (`visual-regression.spec.ts:39`) uses bare `--update-snapshots` → mode
`changed`. Read from the installed implementation, `node_modules/playwright/lib/matchers/toMatchSnapshot.js`:

- `:283` — `expectScreenshotOptions.expected = helper.updateSnapshots === "all" ? void 0 : expected;`
  In **`changed`** mode the old baseline is still handed to the comparator, so `_expectScreenshot`
  **retries against it until the `expect` timeout** before conceding a difference. A genuine
  re-baseline in `changed` mode therefore burns the full retry budget on every changed image. In
  **`all`** mode `expected` is `undefined` → one stabilised capture, no retry loop.
- `:291-296` — when there is **no** `errorMessage` (i.e. the new capture is *within tolerance* of the
  old baseline), `changed` mode falls through to `helper.handleMatching()` and **writes nothing**.

That second point is the trap. Under the new absolute cap, a font delta smaller than the cap is
"within tolerance", so **bare `-u` would leave those baselines carrying pre-font-change pixels** while
the plan believes they were re-captured. VGATE-06 says *"Baselines are **re-captured**"* — mode
`changed` does not guarantee that.

- `:285-290` — `writeFiles` returns `helper.createMatcherResult(..., true)`, i.e. **the test PASSES when
  it rewrites**, and logs to stdout: `console.log(helper.expectedPath + " is re-generated, writing actual.");`

**Recommendations:**
1. Use **`--update-snapshots=all`** for the VGATE-06 re-baseline. Note `:292` still guards on
   `compareBuffersOrStrings(actual, expected)`, so byte-identical files are left untouched even in
   `all` mode — you get the fast path *and* an honest `git diff`.
2. **The ledger's "which baselines moved" evidence is free**: count the
   `… is re-generated, writing actual.` lines on stdout, and cross-check with
   `git diff --stat tests/tests/specs/visual/__screenshots__/`.
3. Take the **font-delta measurement (N-1) with no `-u` flag at all** — default mode `missing` compares
   and never rewrites, which is what a measurement needs.

[VERIFIED: `npx playwright test --help`; node_modules/playwright/lib/matchers/toMatchSnapshot.js:283,285-296]

---

### N-5 — 🟠 `@fontsource/inter`'s per-subset CSS carries **no `unicode-range`**. Take the ranges from `unicode.json`.

D-09 A requires *"the upstream `unicode-range` declarations preserved"*. Measured on
`@fontsource/inter@5.3.0` (`npm pack`, extracted):

```
grep -c "unicode-range"  package/latin.css      → 0
grep -c "unicode-range"  package/latin-400.css  → 0
grep -c "unicode-range"  package/index.css      → 7
```

A naive copy of `latin.css` + `latin-ext.css` would produce **four `@font-face` rules with identical
`font-family`/`font-weight`/`font-style` and no `unicode-range`** — under CSS cascade the later rule
wins outright for each weight, so `latin-ext` would shadow `latin` entirely and basic-Latin glyphs
would come from the wrong (or no) file. **This is a correctness bug, not a nicety.**

The authoritative in-package source is `package/unicode.json`, and its values match Google's byte-for-byte
(modulo Google's space-after-comma formatting). Verbatim, from `unicode.json`:

- **`latin`**: `U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD`
- **`latin-ext`**: `U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF`

Cross-checked against the live Google response for `css2?family=Inter:wght@400;700&display=swap`, which
emits the identical sets under `/* latin */` and `/* latin-ext */`.

Second detail: fontsource's per-subset CSS lists **both** `woff2` and `woff` in `src`. Google's response
lists **woff2 only**. D-09 A specifies **exactly 4 files** (woff2). The vendored CSS must therefore list
woff2 only — matching Google, and matching the file count the decision locks.

[VERIFIED: `npm pack @fontsource/inter@5.3.0` + grep + `unicode.json` read; live `fonts.googleapis.com/css2` fetch, this session]

---

### N-6 — 🟡 A static grep of `apps/frontend/build/` will **still** hit `fonts.googleapis.com` after VGATE-04.

`apps/frontend/src/routes/+layout.svelte:207-208` keeps the Google URL as the `??` **fallback literal**,
and `:222-223` keep the two preconnect literals inside a branch that is dead for the new default. All
three survive into the bundle. Measured on the current build:

```
apps/frontend/build/server/chunks/_layout.svelte-D3JshrpC.js:110:
  const fontUrl = staticSettings.font?.url ?? "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap";
apps/frontend/build/server/chunks/_layout.svelte-D3JshrpC.js:118:
  $$renderer3.push(`<link rel="preconnect" href="https://fonts.googleapis.com"/> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>`);
```

**This is correct behaviour** — D-10 A explicitly keeps the preconnect block "dead for the default,
correct for an operator who overrides". But it means:

- D-12 option C (grep the build output) was already rejected; N-6 shows it would have been **actively
  wrong**, returning hits forever. The ledger must not claim "zero occurrences in the build".
- The production-build trace must be phrased as **zero third-party font *requests* observed**, and the
  D-12 permanent guard must be a **request** listener, never a string scan. Both already are.

[VERIFIED: grep over `apps/frontend/build/`, this session]

---

### N-7 — 🟡 `@openvaa/app-shared` is **ESM-only**, and the frontend consumes its **built `dist/`**.

`CLAUDE.md` says app-shared "Builds to both ESM (frontend) and CommonJS (backend)". Measured, that is
**stale**: `packages/app-shared/tsup.config.ts` declares `format: ['esm']`, and `package.json` exposes
only an `import` condition:

```json
"exports": { ".": { "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } } }
```

**Consequence for D-08:** editing `staticSettings.ts` alone changes nothing at runtime. The frontend
resolves `@openvaa/app-shared` to `dist/index.js`, so **the package must be rebuilt** before the dev
server serves the new default. In an interactive `yarn dev` this is handled by `yarn watch:shared`
(`turbo watch build --filter='./packages/*'`); in the container recipe, where the dev server is spawned
on the **host** by the operator, the plan must make `yarn build` (or at minimum
`yarn build --filter=@openvaa/app-shared`) an explicit step **before** the dev server is (re)started.
A stale `dist/` here would silently re-baseline against Google-served Inter and pass every gate.

No CJS consumer exists to break, so the change carries no dual-format risk. [VERIFIED:
packages/app-shared/tsup.config.ts; packages/app-shared/package.json `exports`]

---

### N-8 — ✅ The D-11 egress block is **verified live, at both curl and Chromium level**.

Executed this session inside the pinned image with
`--add-host fonts.googleapis.com:127.0.0.1 --add-host fonts.gstatic.com:127.0.0.1`:

```
--- hosts ---
127.0.0.1	fonts.googleapis.com
127.0.0.1	fonts.gstatic.com
--- curl control (MUST FAIL) ---
curl: (7) Failed to connect to fonts.googleapis.com port 443 after 10 ms: Couldn't connect to server
curl exit=7
```

And, crucially, **the browser honours it too** — Chromium does not bypass `/etc/hosts` with its own
resolver. A page whose `<link rel="stylesheet">` points at the css2 URL produced:

```
[["FAILED","https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap","net::ERR_CONNECTION_REFUSED"]]
```

D-11 A moves from MEDIUM/reasoned to **HIGH/observed**. Exact strings for the ledger: `curl` exit **7**
with `Failed to connect to fonts.googleapis.com port 443`; Chromium `net::ERR_CONNECTION_REFUSED`.

**Recommendation:** record **both** controls in the ledger, not just `curl`. The `curl` control proves
the resolver is poisoned; the browser control proves the *thing that actually takes the screenshots*
respects it. They are different claims and only one of them is what criterion 4 is about.

[VERIFIED: two `docker run` probes in `mcr.microsoft.com/playwright@sha256:6446946a…`, this session]

---

### N-9 — ✅ The D-14 identical-path mount is **verified working**, on this machine, in this image.

Executed:

```bash
docker run --rm --platform linux/amd64 \
  -v "$PWD":"$PWD" -w "$PWD" \
  mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d \
  bash -c 'pwd; uname -m; head -2 /etc/os-release; node -v; ls -d tests/tests/support/preflight.ts'
```

Output:

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
x86_64
PRETTY_NAME="Ubuntu 24.04.3 LTS"
NAME="Ubuntu"
v24.13.0
tests/tests/support/preflight.ts
```

The container's `pwd` is **byte-identical to the host's**, and the repo is readable at that path — so
`TESTS_DIR` (`tests/tests/utils/testsDir.ts:7`, derived from `import.meta.url`) resolves to the same
absolute string inside and out, `global-setup.ts:42`'s `repoRoot` matches, and both preflight clauses
(`preflight.ts:414` status-200 on `/@fs<abs>` and `:440` absolute equality) can pass **with zero
preflight edits**. macOS Docker Desktop shares `/Users` by default, so no Docker settings change is needed.

The environment triple also matches `136-VISUAL-DISCRIMINATION-EVIDENCE.md:24` exactly
(`x86_64`, Ubuntu 24.04.3, node v24.13.0) — so this phase's numbers stay directly comparable to v2.14's.

**Still to be verified by the phase itself:** a *preflight-passing* run (this probe proves the path
identity and the mount; it does not prove the served-app clause, which needs a running host dev server).
D-14 A demands exactly that observation. It is now a formality rather than a risk.

[VERIFIED: `docker run` executed this session]

---

### N-10 — 🟡 `yarn dev` **cannot** be given `--host 0.0.0.0`. Use the workspace script directly.

Criterion 5 requires the dev server bound `--host 0.0.0.0`, and D-136-06-2
(`136-06-SUMMARY.md`, "the visual gate needs a non-loopback bind locally") records the failure mode:
`socat ... connect(... 192.168.65.254:5174): Connection refused`.

Measured: `apps/frontend/vite.config.ts:36-44` declares **no `host`** — only:

```
    server: {
      port: Number(env.FRONTEND_PORT) || 5173,
      …
      strictPort: true
    }
```

So Vite binds `127.0.0.1` by default, and the flag must come from the CLI. But the root `dev` script is
`"dev": "yarn db:start && yarn _dev:concurrent"`, and `_dev:concurrent` is
`"yarn dev:clean && concurrently -n watch,frontend … \"yarn workspace @openvaa/frontend dev\""` — extra
args appended by yarn land on **`concurrently`**, not on `vite`. `yarn dev --host 0.0.0.0` therefore does
**not** do what it looks like it does.

**The correct host-side invocation for this phase:**

```bash
yarn build                                                  # N-7: app-shared dist must be current
yarn db:start                                               # or yarn db:reset / db:reset-with-e2e-data
yarn workspace @openvaa/frontend dev --host 0.0.0.0         # CLI wins over vite.config server.host
```

(`yarn watch:shared` is only needed if source packages will change mid-session; for a capture run a
one-shot `yarn build` is cleaner and removes a moving part.)

**`FRONTEND_PORT` caveat.** It works and is honoured by both Vite (`vite.config.ts:37`, via
`loadEnv(mode, repoRoot, 'FRONTEND_PORT')` at `:17`) and Playwright (`playwright.config.ts:327`,
`global-setup.ts:37`). **But** `tests/tests/utils/supabaseAdminClient.ts:585` and `:628` hardcode the
frontend port by string substitution — `SUPABASE_URL.replace('54321', '5173')` — so an alternate port
leaves those two redirect URLs pointing at 5173. v2.14 ran on 5180 without incident (the visual path
uses `forceRegister` + UI login, not the redirect flow), so this is a *prefer-5173-if-free* note rather
than a blocker. `strictPort: true` (`vite.config.ts:43`) means a busy 5173 fails loudly rather than
drifting, which is the safe direction.

[VERIFIED: apps/frontend/vite.config.ts:17,36-44; root package.json `dev`/`_dev:concurrent`; tests/tests/utils/supabaseAdminClient.ts:59,585,628]

---

### N-11 — 🟡 CI's invocation differs from the local one in a way D-17 already depends on.

`.github/workflows/main.yaml:357-361`, verbatim:

```yaml
      - name: "Start frontend"
        run: yarn workspace @openvaa/frontend dev &

      - name: "Run visual regression tests (blocking)"
        run: PLAYWRIGHT_VISUAL=1 npx playwright test -c ./tests/playwright.config.ts --grep "@visual"
```

Note: **no `--project=visual-regression`** — CI selects by `--grep "@visual"`, and `CI=true` gives
`workers: 1` and `retries: 3` (`playwright.config.ts:307,309`). D-17's "1 final run under CI's literal
invocation (`CI=true`, `--grep \"@visual\"`)" is exactly this. The visual project is
`name: 'visual-regression'`, `testDir: './tests/specs/visual'`, `dependencies: ['data-setup-base', 'auth-setup']`
(`playwright.config.ts:387-390`), which is why a `--grep` run still yields **7** tests (4 captures +
`data-setup-base` + `auth-setup` + `data-teardown-base`) — dependency projects are exempt from `--grep`,
as `136-05-SUMMARY.md` records.

[VERIFIED: .github/workflows/main.yaml:357-361; tests/playwright.config.ts:307,309,387-390]

## Architecture Patterns

### System architecture — what this phase actually wires

```
 HOST (macOS)                                    CONTAINER (linux/amd64, pinned digest)
 ────────────                                    ──────────────────────────────────────
 yarn build  ──► packages/*/dist                 ┌──────────────────────────────────────┐
      │           (N-7: app-shared dist is       │  /etc/hosts  (D-11 --add-host)       │
      │            what the frontend reads)      │    fonts.googleapis.com → 127.0.0.1  │
      ▼                                          │    fonts.gstatic.com    → 127.0.0.1  │
 Vite dev server  ── --host 0.0.0.0 ─────┐       │           │                          │
   :FRONTEND_PORT  (strictPort)          │       │           ▼                          │
      │  serves apps/frontend/static/    │       │  ① curl control  (MUST FAIL, exit 7) │
      │  → /fonts/inter.css + 4 woff2    │       │           │                          │
      ▼                                  │       │           ▼                          │
 Supabase (:54321, :54324)               │       │  ② TCP forwarder (N-3, Node)         │
      │                                  └──host.docker.internal──►  binds ::/0.0.0.0   │
      │                                          │      localhost:$PORT → host:$PORT    │
      │                                          │      localhost:54321 → host:54321    │
      │                                          │           │                          │
      ▼                                          │           ▼                          │
 -v "$PWD":"$PWD" -w "$PWD"  ───────────────────►│  ③ npx playwright test               │
   (D-14 / N-9: identical abs path)              │      │                               │
                                                 │      ▼                               │
                                                 │  globalSetup → assertServedApp        │
                                                 │    (a) liveness on baseURL            │
                                                 │    (b1) GET /@fs<abs>/…/+layout.svelte│
                                                 │         must be 200                   │
                                                 │    (b2) servedModuleRoot ===           │
                                                 │         <abs>/apps/frontend            │
                                                 │      │  ← the M-12 blocker; passes     │
                                                 │      │    ONLY at identical mount      │
                                                 │      ▼                               │
                                                 │  data-setup-base → auth-setup →       │
                                                 │  visual-regression (4 captures)       │
                                                 │      │                               │
                                                 │      ├─ settleFonts (D-10, N-2)       │
                                                 │      ├─ page.on('request') guard (D-12)│
                                                 │      ▼                               │
                                                 │  comparators.js: min(cap, 0.01·area)  │
                                                 │      ▼                               │
                                                 │  __screenshots__/  ◄── -u=all (N-4)   │
                                                 └──────────────────────────────────────┘
                                                              │
                                                              ▼
                                          JSON reporter ──► per-baseline diff counts
                                                              │
                                                              ▼
                                    146-VISUAL-NOISE-LEDGER.md / 146-NEGATIVE-CONTROL.md
```

---

### Pattern 1 — The container recipe, end to end (D-14, D-15)

**What:** the single executable procedure every in-container step in this phase runs through.
**When to use:** every one of the ~20 runs. `tests/scripts/visual-container.sh` is its home.

**The verified invocation skeleton.** Everything below except the forwarder and the Playwright args was
executed this session (N-8, N-9).

```bash
docker run --rm --platform linux/amd64 \
  --add-host host.docker.internal:host-gateway \
  ${EGRESS_BLOCK:+--add-host fonts.googleapis.com:127.0.0.1 --add-host fonts.gstatic.com:127.0.0.1} \
  -v "$PWD":"$PWD" -w "$PWD" \
  -e FRONTEND_PORT -e PLAYWRIGHT_VISUAL=1 \
  mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d \
  bash -c '<in-container entrypoint>'
```

**Element-by-element, and why each is load-bearing:**

| Element | Value | Why |
|---|---|---|
| Image | `mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d` | Pin by **digest**, not tag. The cached image already carries this RepoDigest (N-7… see M-13), so no pull. Same digest as the v2.14 runs → D-07 comparability. |
| Platform | `--platform linux/amd64` | Matches `ubuntu-latest`; `uname -m` → `x86_64` confirmed. |
| Mount | `-v "$PWD":"$PWD" -w "$PWD"` | **D-14 A, the blocker.** Verified: container `pwd` == host `pwd` (N-9). Never `/work`. |
| Host gateway | `--add-host host.docker.internal:host-gateway` | The forwarder's upstream. Present in the v2.14 recipe (`visual-regression.spec.ts:33`). |
| Egress block | `--add-host fonts.googleapis.com:127.0.0.1 --add-host fonts.gstatic.com:127.0.0.1` | **D-11 A.** Verified at curl **and** Chromium level (N-8). Only for the criterion-4 run; a flag, not always on. |
| Port forwarding | Node TCP forwarder, ports `$FRONTEND_PORT`, `54321`, `54324` | **N-3.** `socat` is absent from the image; `baseURL` and `SUPABASE_URL` both hardcode `localhost`. |
| Workers | `--workers=1` | `workers: process.env.CI ? 1 : 6` (`playwright.config.ts:309`); the voter walk does not survive 6-way contention under emulation (`visual-regression.spec.ts:41-42`). |
| Retries | `--retries=0` for the 5 strict runs | **D-17 A** — stricter than CI's 3. The CI-literal 6th run uses `CI=true` and inherits `retries: 3`. |
| Project selection | `--project=visual-regression` (strict runs) / `--grep "@visual"` (CI-literal run) | **D-17 A / N-11.** |
| Env | `PLAYWRIGHT_VISUAL=1` | Gates both `auth-setup` and `visual-regression` (`playwright.config.ts:366,387`). |
| Snapshot mode | *(none)* for measurement · `--update-snapshots=all` for the re-baseline | **N-4.** Bare `-u` = `changed`, which will not re-record a within-tolerance font delta. |
| Reporters | `--reporter=html,json` + `PLAYWRIGHT_JSON_OUTPUT_FILE=…` | In-repo precedent `tests/scripts/e2e-run.sh:394-402`. Gives machine-readable diff counts. |

**The in-container entrypoint, in order (the order is the point):**

1. `uname -m`, `node -v`, `cat /etc/os-release` — provenance for the ledger.
2. **`curl` egress control** — only in egress-block mode; **MUST FAIL**; record exit code and message.
   *(D-11: this runs BEFORE the suite. A green suite behind an unproven block proves nothing.)*
3. Start the TCP forwarder(s) in the background; wait for `localhost:$FRONTEND_PORT` to accept.
4. Run Playwright. The **preflight is the first hop** and will abort with exit 1 if anything above is
   wrong — that is the design, and it is the D-14 observation.
5. Kill the forwarder; propagate Playwright's exit code (not the forwarder's, not `tee`'s — cf.
   `e2e-run.sh`'s `PIPESTATUS[0]` handling at `:406`).

**Host-side prerequisites, in order** (see N-7, N-10):

```bash
yarn build                                            # app-shared dist must reflect the font default
yarn db:reset && yarn db:seed --template e2e/base     # the dataset the baselines depend on
yarn workspace @openvaa/frontend dev --host 0.0.0.0   # NOT `yarn dev --host …` (N-10)
```

**Script shape.** Follow `tests/scripts/e2e-run.sh` verbatim as the house style: `#!/usr/bin/env bash`,
a header block documenting usage/prereqs/**numbered exit codes**, `set -euo pipefail`,
script-location-relative paths, `"${VAR:-default}"` env defaults. That file's docblock (`:1-60`) is the
template; `determinism-batch.sh` is the precedent for looping it (relevant to D-04's n=10 and D-17's
six runs).

**Anti-pattern:** having `visual-container.sh` spawn the host dev server. `e2e-run.sh` deliberately owns
its server, but this script runs *inside* a container against a *host* server it cannot own. Keep the
split: the script asserts the server is reachable and correct (which the preflight does anyway) and
refuses to adopt anything it cannot verify.

---

### Pattern 2 — The measurement-only `maxDiffPixels: 0` configuration (D-04)

**What:** run the four baselines at zero tolerance to read per-baseline noise, **without shipping a
zero-tolerance knob**.

**Options considered:**

| Option | Verdict |
|---|---|
| Env-var gate inside `playwright.config.ts` | **Rejected.** It *ships* the knob. D-04 says "measurement configuration only, never shipped", and this project has a standing allergy to bypass env vars (`global-setup.ts:19-22`). |
| CLI flag | **Impossible.** `npx playwright test --help` exposes no `--max-diff-pixels`; the budget is config-only. |
| Throwaway local edit to `playwright.config.ts`, reverted | **Rejected.** It mutates the file the phase is *also* legitimately editing, so a botched revert silently corrupts the shipped cap — and D-16's `git checkout --` protocol runs in the same window. Highest-risk option. |
| **Uncommitted overlay config file** | ✅ **RECOMMENDED.** |

**The overlay config.** Place it beside the real config so every relative path resolves identically —
`testDir` and `{testDir}` in `snapshotPathTemplate` (`playwright.config.ts:294`) are resolved relative to
the config file's directory, and `TESTS_DIR` (`tests/tests/utils/testsDir.ts:7`) is `import.meta.url`-derived
and unaffected.

```ts
// tests/playwright.noise.config.ts  — UNCOMMITTED, measurement only (phase 146 D-04).
// Delete after the noise runs; its exact contents are quoted verbatim in 146-VISUAL-NOISE-LEDGER.md
// so the measurement is re-derivable without shipping a zero-tolerance knob.
import base from './playwright.config';

export default {
  ...base,
  expect: {
    ...base.expect,
    toHaveScreenshot: {
      ...base.expect?.toHaveScreenshot,
      // threshold STAYS 0.2 — it is the per-pixel colour tolerance, not the budget.
      // Changing it would measure a different comparator than the one that ships.
      maxDiffPixels: 0
    }
  }
};
```

**Three things that are easy to get wrong here:**

1. **Keep `threshold: 0.2`.** It is pixelmatch's per-pixel colour tolerance
   (`comparators.js:82-84`: `threshold: options.threshold ?? 0.2`), not part of the budget. Zeroing it
   would count anti-aliasing jitter the shipped gate ignores, and the measured "noise" would be a number
   about a comparator this repo does not run.
2. **`maxDiffPixels: 0` alone is sufficient.** `Math.min(0, 0.01·area) = 0` (`comparators.js:92`), so
   the ratio need not be touched.
3. **`count > maxDiffPixels`** is strict (`comparators.js:96`), so a genuinely-0 baseline still **passes**
   at zero tolerance and emits no message. That is the M-17 `candidate-preview` case. **A passing test
   means noise = 0** — the ledger must record `0` for it, not "no data". This is the single most likely
   way for the D-04 ledger to come out wrong.

**Reading the counts — use the JSON reporter, not stderr.** Direct answer to the brief's question: **yes,
the JSON reporter is materially more robust.** `node_modules/playwright/types/testReporter.d.ts:292-304`
defines `JSONReportError { message: string; location?: Location }` and
`JSONReportTestResult { … error: TestError | undefined; errors: JSONReportError[]; … }`, so the full
matcher message — including the `NNN pixels (ratio X.XX of all image pixels) are different.` line — is
carried per test, already associated with the **test title and project**. Scraping stdout forces you to
re-associate a bare number with a baseline by proximity, across 10 runs × 4 baselines × 6 runs, which is
exactly the kind of transcription the ledger must not depend on.

In-repo precedent, `tests/scripts/e2e-run.sh:394-402`:

```bash
PW_ARGS+=(--reporter=html,json)
…
    PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_DIR/results.json" \
      PLAYWRIGHT_HTML_OUTPUT_DIR="$RUN_DIR/html" \
      PLAYWRIGHT_HTML_OPEN=never \
```

Extraction (the regex must include **"of all image pixels"** — see M-4's correction):

```js
const r = JSON.parse(fs.readFileSync('results.json','utf8'));
const rows = [];
for (const suite of r.suites) for (const spec of walk(suite)) for (const t of spec.tests)
  for (const res of t.results) for (const e of (res.errors ?? [])) {
    const m = /(\d+) pixels \(ratio [\d.]+ of all image pixels\) are different\./.exec(e.message);
    if (m) rows.push({ project: t.projectName, title: spec.title, count: Number(m[1]) });
  }
```

Also worth capturing per run, straight off the JSON (again per `e2e-run.sh:414-429`):
`config.workers`, `config.projects[].retries`, `stats.expected/unexpected/flaky/skipped/duration` — so
the ledger's "n=10 at `--workers=1 --retries=0`" claim is **observed**, not restated from the invocation.

---

### Pattern 3 — The D-06 height-independence control

**What:** prove that the *same absolute injected damage* fails both a short and a deliberately lengthened
capture of the same route, with **no new committed baseline, no seed change, no fixture change**.

**The comparison, made concrete.** Four captures in one controlled session, two comparisons:

| # | Page state | Role |
|---|---|---|
| A0 | clean, natural height | reference for the short comparison |
| A1 | **damaged**, natural height | candidate for the short comparison |
| B0 | clean, **lengthened** | reference for the long comparison |
| B1 | **damaged**, **lengthened** | candidate for the long comparison |

`diff(A0,A1) = D_short` and `diff(B0,B1) = D_long`. Both carry the *same* damage, so
`D_short ≈ D_long` in absolute pixels — while `area_long > area_short`. Under the old ratio-only budget
the long one passes and the short one fails; under the absolute cap both fail. **That is criterion 3,
stated as a falsifiable measurement.**

**Injecting the damage without touching source.** Do **not** use `git`-level editing of
`MatchScore.svelte` for this control — that is D-07's job and it cannot be toggled per-capture inside one
session. Reproduce the identical visual change with CSS at capture time. `MatchScore.svelte:30` verbatim:

```svelte
  <span class="text-lg font-bold" data-testid="match-score">{t('components.matchScore.score', { score })}</span>
```

`text-lg` → `text-2xl` is a font-size change on `[data-testid="match-score"]`, so:

```ts
await page.addStyleTag({
  content: `[data-testid="match-score"]{ font-size: var(--text-2xl) !important;
            line-height: var(--text-2xl--line-height) !important; }`
});
```

**The tokens are verified present.** `app.css:91` does `  --text-*: initial;` (Tailwind's scale is
cleared), and the design system re-declares its own — verbatim:

```
206:  --text-lg: 1.0625rem;
207:  --text-lg--line-height: 1.21;
210:  --text-2xl: 1.4375rem;
211:  --text-2xl--line-height: 1.21;
```

So the injected damage is a font-size change from **1.0625rem → 1.4375rem** at an unchanged line-height
of 1.21 — i.e. glyph growth with the box metrics preserved, which is exactly the "changes the type scale
of every match score and nothing else" character `136-VISUAL-DISCRIMINATION-EVIDENCE.md:32-34` attributes
to the original injection. Using the literal `1.4375rem` in the injected CSS is equally valid and one
fewer indirection; record which form was used. [VERIFIED: apps/frontend/src/app.css:91,206-207,210-211]

**Lengthening without perturbing above-the-fold layout.** `fullPage: true` captures the document's
scrollable area. `apps/frontend/src/app.css` sets no `overflow` on `html`/`body` (`:261 html {` applies
only `@apply font-base hyphens-auto;`, `:279 body {` only `@apply bg-base-100 text-md;`), so the document
is the scroll container and extending it works. Use an **absolutely positioned** filler so it never
enters flow:

```ts
const grown = await page.evaluate((extraPx) => {
  const before = document.documentElement.scrollHeight;
  const filler = document.createElement('div');
  filler.id = 'vgate-height-filler';
  filler.setAttribute('aria-hidden', 'true');
  Object.assign(filler.style, {
    position: 'absolute', left: '0', width: '1px',
    top: `${before}px`, height: `${extraPx}px`,
    background: 'transparent', pointerEvents: 'none'
  });
  document.body.appendChild(filler);
  return { before, after: document.documentElement.scrollHeight };
}, 3000);
```

**Assert the growth happened** (`grown.after > grown.before`) and **record both numbers in the ledger** —
a control whose lengthening silently no-opped is a control that proves nothing. `position: absolute`
keeps the filler out of the flex/flow of the app shell, so the above-the-fold pixels are byte-identical;
verify that claim empirically by confirming `D_short` and `D_long` are within a few pixels of each other
(they *should* be — that is the whole hypothesis).

**Where the throwaway references live.** Two viable mechanics; the first is recommended.

**(a) Playwright's own comparator via a throwaway snapshot dir — RECOMMENDED.**
Use `toHaveScreenshot` from an overlay config whose `snapshotPathTemplate` points **outside**
`__screenshots__/`, into a directory `.gitignore` already covers. `.gitignore:44` has `tests/e2e-runs/`;
`:33/:36/:37` cover `test-results/`, `playwright-report/`, `playwright-results/`. So:

```ts
snapshotPathTemplate: path.join(TESTS_DIR, '../e2e-runs/146-height-control/{arg}{ext}')
```

Pass 1 (clean page, both variants) with `--update-snapshots=all` records A0/B0; pass 2 (damaged, both
variants) compares and yields both counts and both verdicts. Then repeat pass 2 under the **old** budget
to observe the long capture passing. `tests/tests/specs/visual/__screenshots__/` is never written to —
provable afterwards with `git status --short tests/tests/specs/visual/`, exactly the check
`136-06-SUMMARY.md` used.

*Why this one:* it runs the **identical comparator** the gate runs, so `D_short`/`D_long` are directly
commensurable with the 19,484 / 19,545 px numbers D-07 reuses. That commensurability is the entire
argument for reusing the v2.14 injection in the first place.

**(b) `pixelmatch` + `pngjs` directly — NOT recommended.** Both resolve today
(`node_modules/pixelmatch@7.1.0`, `node_modules/pngjs@7.0.0`) but **neither is declared by this repo** —
`yarn.lock:3319-3321` shows they are hoisted transitive dependencies of `@vitest/browser@4.0.15`.
Importing them from a test file makes the control depend on a hoist that a future dependency bump can
remove, and it computes a *different* number than the gate does (no `threshold`, no Playwright
stabilisation loop). If it is used anyway, they must be added as explicit root devDependencies first —
which is scope this phase does not need.

**The artefact is the ledger.** Record for both comparisons: dimensions, `0.01 × area`, the cap in force,
`D_short` / `D_long`, and the verdict under **both** the old and the new budget. Then delete
`tests/e2e-runs/146-height-control/`.

---

### Pattern 4 — Self-hosting Inter, concretely (D-08, D-09)

**The four files, named.** From `@fontsource/inter@5.3.0`'s `files/` directory, taken **as-is** (D-09 A
forbids re-subsetting tooling in the repo):

| Source file (in the npm tarball) | Bytes | sha256 (first 16) | Subset / weight |
|---|---|---|---|
| `files/inter-latin-400-normal.woff2` | 23,664 | `8909904ab6c872eb` | latin 400 |
| `files/inter-latin-700-normal.woff2` | 24,356 | `6f56409fd3d64bb8` | latin 700 |
| `files/inter-latin-ext-400-normal.woff2` | 35,000 | — | latin-ext 400 |
| `files/inter-latin-ext-700-normal.woff2` | 36,244 | — | latin-ext 700 |

Total ≈ **119 KB**. Plus `package/LICENSE` → committed as `OFL.txt`; its first line, verbatim:
`Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) Inter-Italic[opsz,wght].ttf: Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)`,
followed by `This Font Software is licensed under the SIL Open Font License, Version 1.1.` (93 lines total).

**How to obtain them without adding a dependency** (D-08 A explicitly rejects `@fontsource/inter` as a
dep, because it would bypass `font.url`):

```bash
npm pack @fontsource/inter@5.3.0        # → fontsource-inter-5.3.0.tgz
tar -xzf fontsource-inter-5.3.0.tgz
cp package/files/inter-latin-{,ext-}{400,700}-normal.woff2  apps/frontend/static/fonts/
cp package/LICENSE                                          apps/frontend/static/fonts/OFL.txt
```

**The `@font-face` CSS.** `apps/frontend/static/fonts/inter.css`. Shape is Claude's discretion; the four
faces and their upstream `unicode-range` are not. Per **N-5**, the ranges come from
`package/unicode.json`, *not* from fontsource's per-subset CSS (which omits them). Order latin-ext
before latin so the cascade matches Google's own emission order.

```css
/* Inter — self-hosted (phase 146, VGATE-04/05).
 * Files taken verbatim from the OFL-licensed @fontsource/inter@5.3.0 distribution;
 * unicode-range values from that package's unicode.json, byte-equal to what
 * fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap emits.
 * Licence: SIL OFL 1.1 — see ./OFL.txt.
 * DELIVERY NOTE (phase 146 N-1): Google served a VARIABLE face for the two-weight
 * request; these are the corresponding STATIC instances (byte-identical to Google's
 * own single-weight statics). The re-baseline delta is recorded in 146-VISUAL-NOISE-LEDGER.md. */

/* latin-ext */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(./inter-latin-ext-400-normal.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(./inter-latin-400-normal.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* …the same two blocks again at font-weight: 700, pointing at the -700- files. */
```

Four rules total. `font-display: swap` is mandatory — it is what Google serves (verified in the live
response) and what `settleFonts`'s whole rationale is built around.

**The default change.** `packages/app-shared/src/settings/staticSettings.ts:43`:

```
-    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
+    url: '/fonts/inter.css',
```

`.name` and `.style` are untouched (M-6: dead; deferred).

**Path resolution — verified, no surprises.** `apps/frontend/svelte.config.js` sets **no**
`kit.paths.base` and **no** `kit.files.assets`, so SvelteKit's defaults apply: `static/` is served at the
origin root at **both** `vite dev` and `vite build`/adapter-node. `apps/frontend/static/` currently holds
`favicon.png`, `icons/`, `images/` — adding `fonts/` follows the existing convention. `static/` assets are
**not** processed by the bundler, so no content-hashing and no import-graph involvement; the relative
`url(./inter-latin-400-normal.woff2)` inside `inter.css` resolves against `/fonts/`, giving
`/fonts/inter-latin-400-normal.woff2`. [VERIFIED: apps/frontend/svelte.config.js (full read); `ls apps/frontend/static/`]

**What does *not* change** (D-08 A / D-10 A): `+layout.svelte:221`'s
`{#if fontUrl.indexOf('fonts.googleapis') !== -1}` naturally goes **false** for `/fonts/inter.css`, so the
two preconnects stop being emitted for the default while still firing for an operator who overrides back
to Google. `:225`'s `<link href={fontUrl} rel="stylesheet" />` is unchanged. **Nothing in `+layout.svelte`
is edited.**

**Build ordering (N-7).** `@openvaa/app-shared` is ESM-only and consumed via `dist/`. `yarn build` (or
`yarn build --filter=@openvaa/app-shared`) **must** run before the dev server is started, or the capture
silently uses the old Google URL and every gate passes for the wrong reason. Make this an explicit task
step, not a prerequisite in prose.

**`settleFonts` still passes.** Verified in the container: an `@font-face` with a real vendored woff2 and
`unicode-range: U+0000-00FF` yields `document.fonts.size = 1`, status `loaded`,
`document.fonts.check('1em Inter') = true`. The default probe text for `check()` is a single space
(U+0020), which is inside the `latin` range — so the `unicode-range` D-09 requires does **not** break the
assertion D-10 preserves. [VERIFIED: container probe, this session]

**Risk register for "is it rasterisation-neutral?"** (see N-1 — the honest answer is *measure it*):

| Claim | Status | What would falsify it |
|---|---|---|
| Only weights 400 and 700 are rendered | **HOLDS** (M-7 re-verified at `app.css:93,222-223`) | A `font-medium`/`font-semibold` utility appearing in built CSS |
| No italic face is needed | HOLDS (M-9, not re-counted) | Any `italic` class or `font-style: italic` in `apps/frontend/src` |
| The vendored bytes are the genuine Google-distributed Inter | **VERIFIED** — sha256 match on both weights | — |
| Self-hosted rasterisation equals today's | **UNVERIFIED — and N-1 says probably not exactly** | Any non-zero diff on the two `candidate-preview` baselines, which were *exactly* 0 px in v2.14 |
| Only latin + latin-ext are needed (locales en/fi/sv) | HOLDS by inspection | Any greek/cyrillic/vietnamese glyph in the captured routes — none in en/fi/sv content |

---

### Pattern 5 — The D-12 request-listener guard, and the production-build trace

#### 5a. The permanent guard

**Where it attaches.** The visual spec uses **two different `test` objects** —
`voterTest` from `../../fixtures/voter/voter-journey.fixture` and `candidateTest` (imported as `test as candidateTest`)
from `../../fixtures/candidate/candidate-journey` (`visual-regression.spec.ts:47-48`). A guard installed on
one does not cover the other.

Attaching at **fixture level** would put it in `tests/tests/fixtures/`, which is shared with the whole
default suite — out of this phase's declared scope and a much wider blast radius. Attaching inside each
of the four tests means four copies.

**Recommended:** one `beforeEach` per `describe` block, calling a single shared helper defined next to
`settleFonts` in the same file. Four one-line call sites, one implementation, zero fixture edits, and it
covers every navigation each test makes because `page.on('request')` is installed before the fixture's
first `goto` only if… — and that is the catch:

> **The voter cases receive an already-navigated page.** `answeredVoterPage` is a *fixture-provided*
> page that has already completed a ~20 s walk by the time the test body runs
> (`visual-regression.spec.ts:83`, and `136-05-SUMMARY.md`'s "their walk takes ~20s"). A listener
> installed in the test body cannot observe requests made during the walk.

Two ways to handle this, both acceptable:

1. **Accept the scope and say so.** The guard covers every request from the moment the test body starts —
   including the `selectElectionByName` interaction and any lazy loads. Since the font `<link>` is
   emitted in `<svelte:head>` on **every** SSR response and re-evaluated on client navigation, a
   re-introduced Google URL would be requested again on the results-page interactions. Document the
   boundary in the guard's docblock rather than leaving it implicit.
2. **Assert on `document.fonts` / performance entries instead of live requests** as a belt-and-braces
   second check that is retroactive:
   ```ts
   const thirdParty = await page.evaluate(() =>
     performance.getEntriesByType('resource').map(e => e.name)
       .filter(u => /fonts\.(googleapis|gstatic)\.com|use\.typekit|fonts\.bunny\.net/.test(u)));
   expect(thirdParty, 'third-party font requests observed').toEqual([]);
   ```
   `performance.getEntriesByType('resource')` covers the **whole document lifetime**, including the
   fixture walk's final navigation — closing exactly the hole in option 1. **Recommended as the primary
   assertion**, with `page.on('request')` as the live tripwire for anything that happens after.

**The host list** (Claude's discretion; this is the recommendation):

```ts
const THIRD_PARTY_FONT_HOSTS = /^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|fonts\.bunny\.net|use\.typekit\.net|p\.typekit\.net|cdn\.jsdelivr\.net\/npm\/@fontsource)/;
```

Keep `cloud.umami.is` **out** — M-10, and the CONTEXT explicitly scopes it out.

**Plus the N-2 half.** Extend the same guard to assert the same-origin stylesheet actually arrived:

```ts
const interCss = performance.getEntriesByType('resource').find(e => e.name.includes('/fonts/inter.css'));
// … and, from the Playwright side, that its response status was 200.
```

This is what makes a wrong vendored path fail **by name** instead of as a whole-page diff — the property
the `settleFonts` docblock claims and (N-2) does not deliver. It costs nothing, changes not one byte of
`settleFonts`, and lives entirely inside the surface D-12 already opened.

**Failing loudly:** `expect(...).toEqual([])` with a message naming the offending URLs. Do **not** use a
bare `page.on('request', () => { throw })` — an exception thrown in an event handler outside the
assertion chain is swallowed or surfaces as an unhandled rejection with no test attribution.

#### 5b. The one-off production-build trace

VGATE-05 says *"the production app"*; the suite drives Vite dev. Recorded once, in the ledger:

```bash
yarn build                                   # turbo; includes app-shared → dist (N-7)
node apps/frontend/build/index.js            # adapter-node output (build/index.js verified present)
# → then a small Playwright script that navigates the captured routes with a
#   page.on('request') recorder, dumping every request URL + its host.
```

`apps/frontend/build/` currently contains `client/ data/ env.js handler.js index.js server/ shims.js`
(verified), consistent with `@sveltejs/adapter-node@^5.5.4` (`apps/frontend/package.json:24`). The
adapter-node server reads `PORT`/`ORIGIN` from the environment; pick a port that is not the dev port so
the trace can never accidentally hit a dev server (`strictPort` guards the other direction).

**Record in the ledger:** the full request list, grouped by host, with the explicit note from **N-6** that
`grep fonts.googleapis apps/frontend/build/` still returns hits (the `??` fallback and the preconnect
literals) and that this is *correct*, not a leak. Without that note the next reader will "find a
regression" that is a string.

---

### Pattern 6 — The D-16 run-4 anomaly reproduction protocol

**What is actually known**, from `136-VISUAL-DISCRIMINATION-EVIDENCE.md:83-98` (re-read this session):

- Run 4 was *"the first run after `git checkout --` of the injected file and returned 1 failed / 6 passed."*
- *"**Which test failed was not captured** — the log was not retained for that run."*
- It did not recur across runs 5, 6, 7 (all 7/7).
- Hypothesis: Vite HMR staleness (memory: `project_e2e_hmr_staleness_restart`). Marked, verbatim:
  *"**This hypothesis is UNCONFIRMED.** It was not tested in isolation, and the failing test is unknown."*
- The honest count, verbatim: *"**1 unexplained failure in 5 clean runs** (runs 1, 4, 5, 6, 7)."*

**So: no output survives.** There is nothing to re-read; the protocol must generate new evidence.

**The protocol, precisely enough to be falsifiable.** Bounded at **≤3 attempts** (D-16 A). Each attempt:

| Step | Action | Recorded |
|---|---|---|
| 0 | Confirm the host dev server has been running continuously and note its start time and PID. **Do not restart it at any point within an attempt** — the long-running server *is* the independent variable. | server uptime, PID |
| 1 | `git status --short` → must be clean. | output |
| 2 | Apply the injection: `MatchScore.svelte:30` `text-lg` → `text-2xl`. | `git diff` |
| 3 | Run the visual project in-container, full stdout + JSON captured. **Expect failures** — this run is not the measurement. | exit code, per-test results, JSON |
| 4 | `git checkout -- apps/frontend/src/lib/components/matchScore/MatchScore.svelte` | timestamp |
| 5 | **Immediately** re-run, without restarting the dev server, without any wait. | exit code, **per-test results**, JSON, full stdout |
| 6 | Classify: 7/7 → attempt did not reproduce. Any failure → **reproduced**; the JSON names the test (the thing v2.14 lost). | verdict |

**If it reproduces (any attempt):** the hypothesis is confirmed; the remedy is a documented dev-server
restart step after any source revert, added to `visual-container.sh`'s docblock and `tests/README.md`.
Record the failing test name and its diff count — that is new information no prior record has.

**If all 3 attempts come back 7/7:** record it as **still unexplained**, and the record MUST contain:

1. The exact protocol above, so a future reader can re-run it identically.
2. All three attempts' exit codes and per-test results (both the injected run and the reverted run).
3. The dev server's continuous-uptime evidence for each attempt — because "we restarted it" would
   invalidate the whole control and must be visibly excluded.
4. The statement of **power**: 3 attempts against an event observed once in five runs (~20 %) has a
   ~49 % chance of reproducing it if the rate is really 20 % (1 − 0.8³). So a clean sweep of three is
   **weak** evidence of absence and must be labelled as such.
5. The explicit refusal formula: *"not reproduced in 3 bounded attempts; the Vite-HMR-staleness
   hypothesis remains **UNCONFIRMED**; the count stands at 1 unexplained failure in 5 clean runs plus 3
   non-reproducing attempts."* Never *"did not recur, so presumed gone"* — the reasoning this milestone
   rejected for DEF-135-04 (`136-VISUAL-DISCRIMINATION-EVIDENCE.md:95-96`) and which standing project
   feedback (`feedback_flag_unverified_root_cause`) forbids.

**Interaction with D-17.** The six D-17 runs give the anomaly a *second*, independent chance to appear.
Their per-run exit codes and per-test results must be recorded **including any failures** (D-17 A says so
explicitly), and any failure there feeds the same ledger entry. Under `CLAUDE.md` § E2E Hard Rule a
failure there is a **cardinal failure** that must be diagnosed, not annotated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Reading per-baseline diff counts | A stdout/stderr scraper | `--reporter=json` + `PLAYWRIGHT_JSON_OUTPUT_FILE` (`e2e-run.sh:394-402`) | The message is already associated with test title + project (`testReporter.d.ts:297-304`); scraping re-derives that association by proximity across 240 measurements |
| Comparing the height-control captures | A `pixelmatch` + `pngjs` diff loop | Playwright's own comparator, via a throwaway `snapshotPathTemplate` | Same comparator as the gate → numbers commensurable with the 19,484/19,545 px record; and neither dep is declared by this repo (`yarn.lock:3319-3321`, hoisted from `@vitest/browser`) |
| Blocking font egress | `page.route()` interception, a proxy, or `--network none` | `--add-host <host>:127.0.0.1` | Criterion 4 requires the block at the **runner**; `--network none` severs the host stack the suite needs (D-11 C) |
| Forwarding host ports into the container | `apt-get install socat` on every run, or a derived image | A committed ~20-line Node TCP forwarder | socat is absent from the image (N-3); a derived image changes the digest and breaks D-07 comparability |
| Proving no third-party font request | `grep` over `apps/frontend/build/` | A request/`PerformanceResourceTiming` assertion | N-6: the fallback + preconnect literals survive into the bundle **by design**; a grep returns hits forever |
| Re-capturing baselines | Bare `--update-snapshots` | `--update-snapshots=all` | Bare `-u` = mode `changed`, which skips within-tolerance images (`toMatchSnapshot.js:291-296`) — VGATE-06 says *re-captured* |
| Detecting "Inter did not load" | Trusting `settleFonts` alone | `settleFonts` **plus** a stylesheet-status assertion | N-2: `check()` returns `true` on **zero** faces |
| Re-subsetting the font | `pyftsubset` / `glyphhanger` in-repo | `@fontsource/inter@5.3.0` files verbatim | D-09 A; and the files are byte-identical to Google's own statics (sha256 verified) |

**Key insight:** every hand-rolled option in this table produces a number or a verdict that is *almost*
the one the gate produces. In a phase whose entire output is a threshold derived from measurements, "almost
the same comparator" is the failure mode — it yields a cap that is defensible on paper and wrong in CI.

## Standard Stack

**This phase adds no runtime and no dev dependency.** Everything it needs is already installed, already
pinned, or is a static asset copied in. That is a deliberate property, not an accident: D-08 A rejects
`@fontsource/inter` *as a dependency* precisely so `staticSettings.font.url` stays the customization point.

### Already present — pinned, verified

| Tool | Version | Purpose | Verified how |
|---|---|---|---|
| `@playwright/test` / `playwright-core` | **1.58.2** | The gate, the comparator, the snapshot machinery | `node -e "require('./node_modules/playwright-core/package.json').version"` |
| `mcr.microsoft.com/playwright` | `v1.58.2-noble` @ `sha256:6446946a…d63d` | The CI-matching rasterisation environment | `docker image inspect … {{.RepoDigests}}` — matches `136-VISUAL-DISCRIMINATION-EVIDENCE.md:23` |
| Docker Engine | **29.7.2** | Runs the above | `docker version --format '{{.Server.Version}}'` |
| Node (in-container) | **v24.13.0** | Playwright host + the TCP forwarder (N-3) | `node -v` inside the image |
| Ubuntu (in-container) | **24.04.3 LTS**, `x86_64` | Matches `ubuntu-latest` | `head -2 /etc/os-release`; `uname -m` |
| `curl` (in-container) | `/usr/bin/curl` | The D-11 egress control | `command -v curl` inside the image |

### Vendored as static assets (not dependencies)

| Asset | Source | Version | Licence |
|---|---|---|---|
| 4 × Inter woff2 (400/700 × latin/latin-ext, normal) | `@fontsource/inter` npm tarball, `files/` | **5.3.0** (published 2026-07-19) | SIL OFL 1.1 |
| `OFL.txt` | same tarball, `package/LICENSE` | 5.3.0 | SIL OFL 1.1 |
| `unicode-range` values | same tarball, `package/unicode.json` | 5.3.0 | — |

**Obtain with `npm pack`, not `yarn add`** — see § *Pattern 4*.

### Alternatives considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| `@fontsource/inter` statics | `@fontsource-variable/inter` | Would be **delivery-neutral** vs today's variable Google face (N-1) and could make the re-baseline a near-no-op — but D-09 C rejected variable faces, and the decision is locked. Note it in the record when the delta is measured. |
| Node TCP forwarder | `socat` via `apt-get` | v2.14's implicit approach; works (only the two font names are blackholed) but adds ~15 s/run, network dependence, and re-creates the "documented nowhere" defect M-14 names |
| Node TCP forwarder | `--network host` | Not reliable on macOS Docker Desktop (maps to the Linux VM, not the macOS host) |
| Playwright comparator for D-06 | `pixelmatch@7.1.0` + `pngjs@7.0.0` | Both resolve but are **undeclared** hoists of `@vitest/browser` (`yarn.lock:3319-3321`); and they compute a different number than the gate |
| Overlay config for D-04 | Env-var gate in `playwright.config.ts` | Ships a zero-tolerance knob; contradicts D-04's "never shipped" and this repo's no-bypass posture |

**Installation:** none. The only `package.json`/`yarn.lock` change this phase should make is **zero**.

## Package Legitimacy Audit

Run via `gsd-tools query package-legitimacy check --ecosystem npm`, this session.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---|---|---|---|---|---|---|
| `@fontsource/inter` | npm | published 2026-07-19 | 2,619,221 /wk | `github.com/fontsource/font-files` | **OK** | Approved — used as a **byte source only** (`npm pack`), never added as a dependency |
| `pixelmatch` | npm | published 2026-04-29 | 9,611,412 /wk | `github.com/mapbox/pixelmatch` | **OK** | Not adopted (see § *Don't Hand-Roll*) — undeclared hoist |
| `pngjs` | npm | published 2023-02-20 | 55,816,302 /wk | `github.com/pngjs/pngjs` | **OK** | Not adopted — undeclared hoist |

`postinstall` for all three: `null`. `deprecated`: `false`. Licence for `@fontsource/inter`: `OFL-1.1`
(confirmed via `npm view @fontsource/inter license`), matching D-09 A's OFL requirement.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.
**Ecosystem note:** `@fontsource/inter` was located via the decision doc (D-09 A names it), confirmed on
the npm registry, and its **contents cryptographically cross-checked against Google Fonts' own served
bytes** (sha256 match on both weights) — a stronger provenance check than registry existence, and the
reason this is tagged verified rather than assumed.

## Common Pitfalls

### Pitfall 1 — Recording "no data" where the ledger should record `0`
**What goes wrong:** at `maxDiffPixels: 0` a genuinely-noiseless baseline **passes** and emits no message
(`comparators.js:96` uses strict `count > maxDiffPixels`). A ledger built by harvesting failure messages
records 10 rows for the noisy baselines and 0 rows for the quiet ones.
**Why it happens:** the harvest is failure-driven; absence of a message is indistinguishable from absence
of a run unless you enumerate the expected 4×10 matrix up front.
**How to avoid:** enumerate `{baseline} × {run}` = 40 cells and fill each; a **passing** cell is `0`, not
blank. `136-VISUAL-DISCRIMINATION-EVIDENCE.md:62-63` already records the `candidate-preview` pair as
*"0"*, and M-17 says only that pair has prior data — so ~half the matrix is expected to be zeros.
**Warning sign:** a ledger whose `max(noise)` is derived from fewer than 40 cells.

### Pitfall 2 — Naming a cap value in the plan
**What goes wrong:** the plan says `maxDiffPixels: 500` and the D-04 runs become a formality.
**Why it happens:** it reads like a small detail and unblocks writing the config task.
**How to avoid:** the config task's action is *"set `maxDiffPixels` to the value derived by
`max(noise) × 10`, floored at 200, rounded up, `< 5,000` — from `146-VISUAL-NOISE-LEDGER.md`"*. If
`max(noise) × 10 ≥ 5,000` (i.e. `max(noise) ≥ 500`), **stop and record a finding**; do not widen.
**Warning sign:** a numeral in the plan where the arithmetic should be. *(CONTEXT `<specifics>`: "A plan
that names a cap value up front is working ahead of its evidence.")*

### Pitfall 3 — Re-baselining with a stale `@openvaa/app-shared` build
**What goes wrong:** `staticSettings.ts` is edited, the dev server is not fed a rebuilt `dist/`, and the
re-baseline captures Google-served Inter. Every gate passes; VGATE-04 is false; nobody finds out until CI
runs with egress blocked.
**Why it happens:** N-7 — the frontend resolves `@openvaa/app-shared` to `dist/index.js`, and a container
run does not rebuild anything.
**How to avoid:** `yarn build` as an explicit numbered step before the dev server starts, and a positive
check in the ledger: the capture run's request trace must show `/fonts/inter.css` **200** and zero
`fonts.googleapis.com` entries. That check is the D-12 guard, so it is free.
**Warning sign:** a green egress-blocked run that produced **no** `/fonts/inter.css` request.

### Pitfall 4 — Trusting `settleFonts` to catch a broken font path
**What goes wrong:** the vendored CSS path is wrong, `check('1em Inter')` returns `true` on zero faces
(N-2), and the run fails as an inscrutable whole-page diff — or worse, the *re-baseline* run silently
records fallback-font pixels as the new truth.
**Why it happens:** the docblock says it is covered. It is not, and never was.
**How to avoid:** the N-2 stylesheet-status assertion, carried by the D-12 guard. And on the re-baseline
run specifically, assert `document.fonts.size >= 1` before `--update-snapshots=all` writes anything.
**Warning sign:** `document.fonts.size === 0` anywhere in the run.

### Pitfall 5 — The v2.14 `/work` mount, copied out of the docblock
**What goes wrong:** exit 1 before any spec body, with a message about a *"DIFFERENT checkout"*
(`preflight.ts:441-444`) — which reads like a wrong-server problem, not a mount problem.
**Why it happens:** `visual-regression.spec.ts:34` still says `-v "$PWD":/work -w /work`. It is the first
thing anyone copies.
**How to avoid:** D-15's script is the single source; **the docblock must be corrected in the same phase**
(D-18 A) so the stale recipe cannot be copied again.
**Warning sign:** a preflight failure naming `/work/apps/frontend` as the expected checkout.

### Pitfall 6 — The dev server bound to loopback
**What goes wrong:** connection refused from inside the container while `curl localhost` works fine on the
host. D-136-06-2 records the exact confusing symptom:
`socat ... connect(... 192.168.65.254:5174): Connection refused`.
**Why it happens:** `apps/frontend/vite.config.ts:36-44` declares no `host`, and **`yarn dev --host 0.0.0.0`
does not forward the flag to vite** (N-10).
**How to avoid:** `yarn workspace @openvaa/frontend dev --host 0.0.0.0`, and make
`visual-container.sh` fail with a *named* error mentioning the bind address when the forwarder cannot
connect — not a generic timeout.
**Warning sign:** the forwarder's upstream connect fails while the host serves fine.

### Pitfall 7 — Letting the D-06 control write into `__screenshots__/`
**What goes wrong:** a fifth baseline lands in the committed directory, doubling re-baseline cost forever
— explicitly D-06 C, rejected.
**How to avoid:** the overlay config's `snapshotPathTemplate` points into `tests/e2e-runs/` (gitignored,
`.gitignore:44`); afterwards assert `git status --short tests/tests/specs/visual/` is **empty**, the same
check `136-06-SUMMARY.md` used to prove the gate compared rather than re-recorded.

### Pitfall 8 — Blocking egress before the container has what it needs
**What goes wrong:** if the recipe installs anything over the network (the `apt-get socat` fallback), and
the egress-block flags are applied to that same run, the install still works — **but only because
`--add-host` blackholes exactly two names**. A future maintainer who "hardens" the block to
`--network none` or a broad DNS sink will break the run in a way that looks like a Playwright failure.
**How to avoid:** adopt the Node forwarder (no install), and document in the script *why* the block is
name-scoped.

### Pitfall 9 — Measuring the font delta after the re-baseline
**What goes wrong:** the re-baseline absorbs the variable→static delta (N-1) and the number is
unrecoverable — you would have to revert the font change and re-run to get it back.
**How to avoid:** the ordering is **cap lands → font lands → measure delta (no `-u`) → re-baseline
(`-u=all`)**. Order the tasks so the measurement is *impossible to skip*: it is the run that proves the
font change took effect at all (Pitfall 3).

## Code Examples

Verified patterns, from files read this session.

### The `Math.min` combination rule — the decisive fact for D-01/D-03

```js
// Source: node_modules/playwright-core/lib/server/utils/comparators.js:88-96 (playwright-core@1.58.2)
  const maxDiffPixels1 = options.maxDiffPixels;
  const maxDiffPixels2 = options.maxDiffPixelRatio !== void 0 ? expected.width * expected.height * options.maxDiffPixelRatio : void 0;
  let maxDiffPixels;
  if (maxDiffPixels1 !== void 0 && maxDiffPixels2 !== void 0)
    maxDiffPixels = Math.min(maxDiffPixels1, maxDiffPixels2);
  else
    maxDiffPixels = maxDiffPixels1 ?? maxDiffPixels2 ?? 0;
  const ratio = Math.ceil(count / (expected.width * expected.height) * 100) / 100;
  const pixelsMismatchError = count > maxDiffPixels ? `${count} pixels (ratio ${ratio.toFixed(2)} of all image pixels) are different.` : "";
```

### The budget as it stands today

```ts
// Source: tests/playwright.config.ts:314-320
  /* Default visual comparison thresholds for toHaveScreenshot */
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.01
    }
  },
```

### The preflight's absolute-identity clause — the M-12 blocker, untouchable

```ts
// Source: tests/tests/support/preflight.ts:429,440-444
  const expectedModuleRoot = path.join(repoRoot, FRONTEND_RELATIVE_ROOT);
  …
  if (path.resolve(observed.servedModuleRoot) !== path.resolve(expectedModuleRoot)) {
    fail(
      `the server on port ${port} is rooted at a DIFFERENT checkout — it serves modules from ` +
        `${observed.servedModuleRoot}, but this working tree's frontend root is ${expectedModuleRoot}`
    );
  }
```

```ts
// Source: tests/global-setup.ts:42  (with tests/tests/utils/testsDir.ts:7)
  const repoRoot = path.resolve(TESTS_DIR, '..', '..');
// export const TESTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
```

### The font surface — the only live consumer

```svelte
<!-- Source: apps/frontend/src/routes/+layout.svelte:207-208, 221-225 -->
  const fontUrl =
    staticSettings.font?.url ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
…
  {#if fontUrl.indexOf('fonts.googleapis') !== -1}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  {/if}
  <link href={fontUrl} rel="stylesheet" />
```

```ts
// Source: packages/app-shared/src/settings/staticSettings.ts:41-45
  font: {
    name: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
    style: 'sans'
  },
```

### `settleFonts`, kept verbatim (D-10 A) — and what it actually covers

```ts
// Source: tests/tests/specs/visual/visual-regression.spec.ts:71-75
async function settleFonts(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const interLoaded = await page.evaluate(() => document.fonts.check('1em Inter'));
  expect(interLoaded, 'webfont Inter did not load — baselines were captured with it').toBe(true);
}
```

Measured coverage (N-2, container-observed):
`no @font-face → check() = true (PASSES, blind)` · `src unreachable → check() = false (FAILS)` ·
`src valid → check() = true (PASSES)`.

### The snapshot-update semantics that decide `-u` vs `-u=all`

```js
// Source: node_modules/playwright/lib/matchers/toMatchSnapshot.js:283, 291-299
  expectScreenshotOptions.expected = helper.updateSnapshots === "all" ? void 0 : expected;
  …
  if (!errorMessage) {
    if (helper.updateSnapshots === "all" && actual && compareBuffersOrStrings(actual, expected)) {
      console.log(helper.expectedPath + " is re-generated, writing actual.");
      return writeFiles(actual);
    }
    return helper.handleMatching();          // ← `changed` mode writes NOTHING here
  }
  if (helper.updateSnapshots === "changed" || helper.updateSnapshots === "all") {
    if (actual)
      return writeFiles(actual);
```

### The injected regression D-07 reuses, verbatim

```svelte
<!-- Source: apps/frontend/src/lib/components/matchScore/MatchScore.svelte:30 -->
  <span class="text-lg font-bold" data-testid="match-score">{t('components.matchScore.score', { score })}</span>
```

`text-lg` → `text-2xl`, i.e. `1.0625rem` → `1.4375rem` (`app.css:206,210`), line-height unchanged at
`1.21` (`app.css:207,211`). Recorded damage: 19,484 px desktop (**passed**), 19,545 px mobile (failed).

### The verified container probe (D-11 + D-14, executed this session)

```bash
docker run --rm --platform linux/amd64 \
  --add-host fonts.googleapis.com:127.0.0.1 --add-host fonts.gstatic.com:127.0.0.1 \
  --add-host host.docker.internal:host-gateway \
  -v "$PWD":"$PWD" -w "$PWD" \
  mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d \
  bash -c 'pwd; uname -m; node -v;
           grep -E "fonts\.(googleapis|gstatic)" /etc/hosts;
           curl -sS --max-time 8 "https://fonts.googleapis.com/css2?family=Inter"; echo "curl exit=$?";
           command -v socat || echo "socat NOT installed"'
```

Observed output (abridged):

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
x86_64
v24.13.0
127.0.0.1	fonts.googleapis.com
127.0.0.1	fonts.gstatic.com
curl: (7) Failed to connect to fonts.googleapis.com port 443 after 10 ms: Couldn't connect to server
curl exit=7
socat NOT installed
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Docker Engine | every in-container step | ✓ | 29.7.2 | — (blocking) |
| `mcr.microsoft.com/playwright:v1.58.2-noble` @ `sha256:6446946a…` | the CI-matching rasterisation | ✓ **cached, 2.39 GB, RepoDigest matches** | linux/amd64 | re-pull (anonymous) — but see `136-05-SUMMARY.md`'s credential-helper hazard below |
| `linux/amd64` emulation on this Mac | `--platform linux/amd64` | ✓ | `uname -m` → `x86_64` in-container | — |
| `curl` in-container | D-11 egress control | ✓ | `/usr/bin/curl` | — |
| `node` in-container | Playwright + the N-3 forwarder | ✓ | v24.13.0 | — |
| **`socat` in-container** | v2.14's port-forwarding step | **✗** | — | ✅ **Node TCP forwarder (recommended)**, or `apt-get install -y socat` |
| Supabase CLI / local stack | `data-setup-base`, `auth-setup` | ✓ (project-standard) | — | — (blocking) |
| Egress to npm | `npm pack @fontsource/inter@5.3.0` (once) | ✓ | — | — |
| Egress to `fonts.googleapis.com` | **only** the pre-change baseline comparison | ✓ today; **must become unnecessary** | — | that is the phase |
| Port 5173 free | `strictPort: true` (`vite.config.ts:43`) | ⚠️ unverified | — | `FRONTEND_PORT` (with the `supabaseAdminClient.ts:585,628` caveat, N-10) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** `socat` — replaced by a committed Node TCP forwarder (N-3).

**Recorded host hazard, carried from `136-05-SUMMARY.md` § Issues Encountered:** on this machine Docker's
`desktop` credential helper has previously wedged (`docker-credential-desktop get` never returns), which
blocks `docker pull` before any network activity, and the Docker VM disk has previously filled to 99 %.
Neither blocks *this* phase as long as the image stays cached (it is, at the right digest) — but a
`docker pull` triggered by a mistyped tag could stall the run in a way that looks like a network problem.
`visual-container.sh` should pin by **digest** and verify the image is present locally *before* running,
failing with a named exit code rather than falling through to a pull.

## Validation Architecture

`.planning/config.json` contains no `workflow.nyquist_validation` key → **treated as enabled**.

**A note on what "validation" means here.** This phase's deliverable *is* a test guard. Its requirements
are therefore not validated by writing new tests *about* the code — they are validated by **running the
guard under conditions that make its verdict falsifiable**. The negative controls are the tests. The
sampling rate below is expressed accordingly.

### Test Framework

| Property | Value |
|---|---|
| Framework | `@playwright/test` **1.58.2** (E2E/visual) · `vitest` (unit — not exercised by this phase) |
| Config file | `tests/playwright.config.ts` (`export default defineConfig({…})` at `:274`) |
| Measurement-only overlay | `tests/playwright.noise.config.ts` — **uncommitted**, deleted after D-04 (§ Pattern 2) |
| Quick run command | `PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0` (in-container) |
| Full suite command | `yarn test:e2e` (root `package.json`: `playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe`) |
| CI-literal command | `CI=true PLAYWRIGHT_VISUAL=1 npx playwright test -c ./tests/playwright.config.ts --grep "@visual"` (`main.yaml:361`) |
| Machine-readable output | `--reporter=html,json` + `PLAYWRIGHT_JSON_OUTPUT_FILE` (precedent `e2e-run.sh:394-402`) |
| Test count expected per visual run | **7** (4 captures + `data-setup-base` + `auth-setup` + `data-teardown-base`) |

### Phase Requirements → Validation Map

| Req ID | Behaviour to validate | Type | Automated command / observation | Artefact exists? |
|---|---|---|---|---|
| **VGATE-01** | The v2.14 injection **FAILS `voter-results-desktop`** under the new cap, and still fails `voter-results-mobile` | negative control (catch half) | `visual-container.sh` → visual project, injected tree, new config; expect **2 voter failures** | ❌ new — `146-NEGATIVE-CONTROL.md` half (3) |
| **VGATE-01** | The same injection **PASSES `voter-results-desktop`** under the OLD config, re-observed in the same container | negative control (**blindness half — must land FIRST**) | same, old config, injected tree; expect desktop **pass**, mobile **fail** | ❌ new — halves (1) + (2) |
| **VGATE-02** | Growing a page's height does not raise its own tolerance | dedicated non-baselined control | § Pattern 3 — 4 captures, 2 comparisons, both counts + both verdicts under old **and** new budget | ❌ new — D-06 control run |
| **VGATE-03** | The cap is derived from measured per-baseline noise, re-derivably | measurement (n=10 × 4) | overlay config at `maxDiffPixels: 0`, JSON reporter, **40-cell matrix** | ❌ new — `146-VISUAL-NOISE-LEDGER.md` |
| **VGATE-04** | The visual project completes green with font egress blocked at the runner | end-to-end gate + pre-control | ① `curl` control (**must fail**, exit 7) ② Chromium-level `net::ERR_CONNECTION_REFUSED` control ③ full visual project green | ❌ new — both controls verified feasible (N-8) |
| **VGATE-05** | The production app issues no third-party font request | permanent guard + one-off trace | ① `page.on('request')` / `PerformanceResourceTiming` assertion in the visual spec ② adapter-node build trace | ❌ new — spec guard + ledger entry |
| **VGATE-05** | *(N-2 corollary)* a broken same-origin `/fonts/inter.css` fails **by name** | negative control | point `font.url` at a bogus path, run, expect a **named** failure (not a whole-page diff) | ❌ new — proves the N-2 hole is closed |
| **VGATE-06** | Baselines re-captured in-container; the project passes across consecutive runs | determinism gate | `--update-snapshots=all` once, then **5 × `--workers=1 --retries=0` + 1 × CI-literal**; every exit code + per-test result recorded | ❌ new — D-17 gate |
| **VGATE-06** | The variable→static font delta is recorded, not absorbed | measurement | run with **no `-u`** after the font lands, before the re-baseline; record 4 diff counts | ❌ new — **N-1, the task most likely to be omitted** |
| *(D-16)* | The run-4 anomaly is explained or recorded as still unexplained | bounded reproduction | ≤3 × (inject → run → `git checkout --` → immediate re-run, no server restart) | ❌ new — § Pattern 6 |
| *(D-14)* | The identical-path mount lets the preflight pass, with zero preflight edits | observation | one preflight-passing container run; `E2E PREFLIGHT OK …` on stdout | ❌ new — mount mechanics already verified (N-9) |

### Sampling Rate

- **Per task commit:** `yarn lint:check` + `yarn format:check` (`lint:check` also runs `typecheck` and
  `typecheck:tests`). For test-file edits, `npx playwright test --list` to confirm the suite still
  enumerates (it deliberately skips the preflight — `global-setup.ts:14-17`).
- **Per plan (in-container):** one visual run, `--workers=1 --retries=0`, exit code + per-test results
  recorded.
- **Per wave merge:** the full default suite `yarn test:e2e` — the visual project is opt-in and excluded
  from it, so this specifically guards against the font change perturbing the 134-test default suite
  (`136-05-SUMMARY.md` records `134 passed` as the standing count; re-derive it, do not assume it).
- **Phase gate:** D-17's six runs, **plus** a green `yarn test:e2e`, **plus** `git status --short
  tests/tests/specs/visual/` empty after the final non-updating run — the proof the gate compared rather
  than re-recorded.

### Wave 0 Gaps

Nothing is missing from the test *infrastructure*; the gaps are artefacts and one helper.

- [ ] `tests/scripts/visual-container.sh` — the executable recipe (D-15). Style-mirror `e2e-run.sh`.
- [ ] The Node TCP forwarder (N-3) — beside the script, or inlined in its in-container entrypoint.
- [ ] `tests/playwright.noise.config.ts` — **uncommitted**, quoted verbatim in the ledger, deleted after D-04.
- [ ] A throwaway D-06 control spec + overlay `snapshotPathTemplate` under `tests/e2e-runs/` (gitignored).
- [ ] The D-12 guard helper in `visual-regression.spec.ts`, called from four `beforeEach` blocks.
- [ ] `146-VISUAL-NOISE-LEDGER.md` (40-cell matrix + the font-delta row + the derivation arithmetic).
- [ ] `146-NEGATIVE-CONTROL.md` (four halves + the D-06 control + the D-11 controls + D-16's attempts).

*No framework install is needed; no `package.json` change should be made by this phase.*

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json` → treated as enabled.

### Applicable ASVS categories

| ASVS Category | Applies | Standard control |
|---|---|---|
| V2 Authentication | **no** (unchanged) | `auth.setup.ts` force-registers the base candidate via `SupabaseAdminClient` — pre-existing, untouched |
| V3 Session Management | no | `storageState` handling unchanged |
| V4 Access Control | no | — |
| V5 Input Validation | no | No user input surface is added |
| V6 Cryptography | no | — |
| **V10 Malicious Code** | **yes** | Vendored third-party binary assets (4 × woff2). Controlled by the sha256 cross-check against Google's own served bytes + the `npm pack` provenance + `postinstall: null` |
| **V14 Configuration** | **yes** | A published framework default (`staticSettings.font.url`) changes; and CI egress posture changes |

### Threat patterns for this change

| Pattern | STRIDE | Standard mitigation | Status in this phase |
|---|---|---|---|
| Malicious/substituted font binary | Tampering | Verify bytes against an independent authority | ✅ **sha256 of both weights matches Google's own served statics** (§ N-1). Record both hashes in the phase record so a future reader can re-verify without network. |
| Slopsquatted source package | Tampering | Registry + provenance check | ✅ `@fontsource/inter` **OK** (2.6 M/wk, `github.com/fontsource/font-files`, `postinstall: null`, `OFL-1.1`) |
| Licence non-compliance for redistributed fonts | Legal/compliance | Ship the licence with the bytes | ✅ D-09 A mandates `OFL.txt` (SIL OFL 1.1) beside the woff2 files |
| **Privacy: third-party font host sees every visitor's IP + UA** | Information Disclosure | Self-host | ✅ **this is VGATE-05's substance** — the phase removes an unconsented third-party beacon from every page load of a *voting advice application*, a category where visitor privacy is unusually load-bearing |
| Supply-chain availability inside a blocking gate | Denial of Service | Remove the external dependency | ✅ VGATE-04 |
| Weakening an integrity gate to make a container run work | Tampering | Refuse the bypass | ✅ **D-14 A** — the mount moves, the preflight does not. `global-setup.ts:19-22` states there is no bypass by design; D-14 B was rejected for exactly this reason |
| Test credentials leaking into product code | Information Disclosure | Keep them test-scoped | ✅ unchanged; `136-05-SUMMARY.md` § Security Notes records `TEST_CANDIDATE_*` as referenced only under `tests/` |

**Residual, recorded not fixed (D-13):** `apps/docs/src/app.html:9-11` still contacts
`fonts.googleapis.com`. The privacy win therefore covers the VAA, **not** the docs site. This must appear
in the phase record as known-remaining, with a todo filed — otherwise "self-hosted Inter" reads as a
repo-wide claim it is not. Likewise `cloud.umami.is` (M-10) remains, out of scope by decision.

## Project Constraints (from CLAUDE.md)

| Directive | Bearing on this phase |
|---|---|
| **E2E Hard Rule — failing E2E is a CARDINAL FAILURE** | No plan may complete with a red visual run. **No "known-flaky" exemption** — if any of D-17's six runs fails, it is a defect to diagnose, not to annotate. A **"did not run" test counts as a failure** (relevant: a preflight abort produces zero spec results — that is 7 failures, not 0). |
| **E2E preflight (served-application gate)** | The whole D-14 blocker. `FRONTEND_PORT` is the only legitimate escape hatch and it *moves* the target rather than disabling the check. |
| **Prefer running the whole E2E suite for interim verification** | The wave-merge sampling rate above uses `yarn test:e2e`, not ad-hoc checks. |
| **Never commit sensitive data** | No credentials in the ledgers. Record image digests and hashes, not env values. |
| **Use TypeScript strictly — avoid `any`** | Applies to the D-12 guard helper and the overlay config. `lint:check` runs `typecheck:tests` (`tsc -p tests/tsconfig.json --noEmit`). |
| **Localization — all user-facing strings support multiple locales** | No user-facing strings are added. The font change must not regress fi/sv rendering — which is precisely why `latin-ext` is vendored and why its `unicode-range` must be correct (N-5). |
| **WCAG 2.1 AA** | The D-06 filler is `aria-hidden="true"` and `pointer-events: none`, and exists only inside a throwaway control — it never ships. |
| **`.agents/code-review-checklist.md`** | "The repo documentation markdown files are updated if the changes touch upon those" — D-18's record corrections are the discharge, and there are now **five** stale claims, not four (N-2). |
| **Repo docs updated** | `tests/README.md`, `main.yaml`, the spec docblock — all in D-18's scope. |

## Recommended plan shape (Claude's discretion, subject to the locked ordering)

Not prescriptive on plan count — but the **ordering constraints are hard**, and three of them come from
this research rather than from CONTEXT:

```
Plan 1  ZERO PRODUCT BYTES  (ledger-first, overrides tracer-first per REQUIREMENTS.md:9-13)
        ├─ tests/scripts/visual-container.sh + the Node forwarder      ← test infra, not product
        ├─ D-14 observation: one preflight-PASSING container run, recorded
        ├─ D-11 controls: curl (exit 7) + Chromium (net::ERR_CONNECTION_REFUSED)
        ├─ D-07 halves (1) + (2): OLD config + injection
        │     → voter-results-desktop PASSES  ← the blindness, RE-OBSERVED
        │     → voter-results-mobile  FAILS
        └─ D-04: n=10 × 4 at maxDiffPixels: 0 → the 40-cell matrix → max(noise)

        ⟹ the cap's value is now DERIVABLE and not before.

Plan 2  THE CAP
        ├─ playwright.config.ts: add maxDiffPixels = max(noise)×10, ≥200, <5000, arithmetic in comment
        ├─ re-document maxDiffPixelRatio as the small-baseline floor (cite 3,603 on candidate-preview-mobile)
        ├─ D-07 half (3): NEW config + injection → BOTH voter baselines fail
        └─ D-06 height-independence control (throwaway refs under tests/e2e-runs/)

Plan 3  THE FONT
        ├─ 4 × woff2 + inter.css (unicode-range from unicode.json) + OFL.txt → static/fonts/
        ├─ staticSettings.font.url default → '/fonts/inter.css'
        ├─ yarn build   ← N-7: app-shared dist, or the change is invisible
        ├─ D-12 guard in visual-regression.spec.ts (third-party hosts + /fonts/inter.css 200 — N-2)
        ├─ ★ FONT-DELTA MEASUREMENT: run with NO -u, record 4 diff counts   ← N-1
        └─ negative control: bogus font.url → must fail BY NAME (closes the N-2 hole)

Plan 4  THE RE-BASELINE + THE PROOF
        ├─ --update-snapshots=all  (N-4 — NOT bare -u)
        ├─ D-07 half (4): new config, clean tree → all green
        ├─ D-17: 5 × strict + 1 × CI-literal, every exit code + per-test result recorded
        ├─ D-16: ≤3 bounded run-4 reproduction attempts
        └─ production-build network trace (adapter-node)

Plan 5  RECORDS LAST (Phase-144 ordering; only after the gates are green)
        ├─ tests/README.md:185 — both stale claims (M-15)
        ├─ .github/workflows/main.yaml:318-319 — the font-egress claim (M-16)
        ├─ visual-regression.spec.ts docblock — settleFonts rationale (D-10 + N-2) and the recipe pointer (D-15)
        ├─ ★ the FIFTH stale claim: settleFonts' "fails it as Inter did not load" — disproven (N-2)
        ├─ record apps/docs/src/app.html:9-11 as known-remaining (D-13) + file todo
        └─ file the todo for the 15 dead font-medium/font-semibold classes (D-09)
```

**Parallelism:** Plans 2 and 3 both need Plan 1's container proof; they are *not* safely parallel because
both feed the same re-baseline and the font delta must be measured against the cap already in force
(otherwise "did the pixels move?" and "did the verdict move?" are confounded). Serial 1→2→3→4→5 is the
honest shape. Plan 5 has no dependency on anything but green gates.

## State of the Art

| Old approach | Current approach | When changed | Impact here |
|---|---|---|---|
| Proportional-only diff budget (`maxDiffPixelRatio`) | Absolute cap combined by `Math.min` | Playwright has supported both for years; the combination rule is what makes this safe | D-01; verified at `comparators.js:88-94` |
| Google Fonts serving **static** instances per weight | Google serves a **variable** face when ≥2 weights are requested in one `css2` call | Google Fonts' VF rollout; Inter is `v20` today | **N-1** — the premise D-09's neutrality claim rests on |
| `-u` implies "rewrite everything" | `-u` has modes; bare `-u` = `changed` | Playwright ≥ ~1.49 | **N-4** — the v2.14 prose recipe uses the now-wrong mode for this purpose |
| Fontsource CSS carrying `unicode-range` per subset file | Per-subset CSS omits it; only `index.css` and `unicode.json` carry ranges | fontsource v5 layout | **N-5** — a naive copy is a correctness bug |

**Deprecated / outdated in-repo:**
- `visual-regression.spec.ts:34` — `-v "$PWD":/work -w /work`. **Aborts every run** since Phase 137 (M-12).
- `visual-regression.spec.ts:66-69` — the `settleFonts` rationale. **Never was true** (N-2).
- `tests/README.md:185` — two false claims (M-15).
- `.github/workflows/main.yaml:318-319` — true today, false when VGATE-04 lands (M-16).
- `CLAUDE.md` — "app-shared … Builds to both ESM (frontend) and CommonJS (backend)". **ESM-only** (N-7).
  *Out of this phase's declared scope; noted for a future record-correction pass.*

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | M-8's counts (9 × `font-medium`, 6 × `font-semibold`) and M-9's (0 × `italic`) still hold; not re-tallied this session | Pattern 4 risk register | LOW — the *mechanism* (`app.css:93,222-223`) is re-verified, and it is the mechanism that makes them dead. A new weight utility would have to appear in built CSS to change this. |
| A2 | Node's default `server.listen(port)` dual-stack behaviour is sufficient to replace v2.14's "dual-stack socat" | N-3 | MEDIUM — if the container resolves `localhost` to `::1` only and the forwarder binds v4 only, the preflight fails with a *connection refused* that looks like the D-136-06-2 bind bug. **Mitigation:** the very first container run is the D-14 observation, which fails loudly and immediately if this is wrong; keep `apt-get install -y socat` documented as the fallback. |
| A3 | The D-06 absolutely-positioned filler extends `documentElement.scrollHeight` without perturbing above-the-fold layout on `/results` | Pattern 3 | MEDIUM — verified only that no `overflow` is set on `html`/`body` in `app.css`. **Mitigation:** the recipe already asserts `after > before`, and `D_short ≈ D_long` is an independent cross-check; if they diverge materially the filler perturbed something and the control is void. |
| A4 | Instancing Google's variable Inter at `wght=400`/`700` may or may not rasterise identically to the corresponding static instances | N-1 | **This is the point** — it is explicitly *not* assumed either way, and the font-delta measurement task exists to settle it. Recorded here so the planner does not treat it as settled. |
| A5 | The adapter-node production server is started with `node apps/frontend/build/index.js` and honours `PORT`/`ORIGIN` | Pattern 5b | LOW — `build/index.js` verified present; the exact env contract should be confirmed from `@sveltejs/adapter-node@^5.5.4`'s output when the trace task runs. |
| A6 | Port 5173 is free on the machine that runs this phase | Environment Availability | LOW — `strictPort: true` makes a conflict fail loudly, and `FRONTEND_PORT` is the escape hatch. Note the `supabaseAdminClient.ts:585,628` hardcoded-5173 caveat (N-10). |
| A7 | The default suite's test count is still 134 (`136-05-SUMMARY.md`) | Sampling Rate | LOW — re-derive with `--list` at the wave-merge gate rather than asserting it. |
| A8 | `expect(page).toHaveScreenshot` honours an overlay config's `snapshotPathTemplate` for a spec whose `testDir` is unchanged | Pattern 3 | LOW-MEDIUM — `snapshotPathTemplate` is a top-level config option (`playwright.config.ts:294`) and is documented as such; not executed this session. **Mitigation:** the first D-06 pass writes references — if they land in `__screenshots__/` instead, it is visible in `git status` immediately, before anything is committed. |

## Open Questions

1. **Does the variable→static switch move any pixels, and by how much?**
   - What we know: the delivery mechanism definitively changes (N-1, `fvar`/`gvar` present vs absent);
     the static bytes are Google's own (sha256 match); the two `candidate-preview` baselines were
     *exactly* 0 px across v2.14 runs, giving an unusually clean detector.
   - What's unclear: whether FreeType's VF instancing and static rasterisation of the same design agree
     byte-for-byte at these sizes.
   - Recommendation: **do not resolve this in planning.** Make it a measurement task (Plan 3), with the
     `candidate-preview` pair as the sensitive detector, and record the number in the ledger regardless
     of its size.

2. **Will `max(noise) × 10` fit under 5,000?**
   - What we know: `candidate-preview` noise was 0 px in v2.14 (M-17). The voter pair has **never** been
     measured — that gap is the phase's reason for existing.
   - What's unclear: everything about the voter pair's distribution.
   - Recommendation: the incompatibility threshold is `max(noise) ≥ 500`. If it is reached, **stop and
     record a finding** (D-05 A), and note that the D-01 rationale itself is unaffected — `Math.min`
     still makes the cap monotonically strictness-increasing; only the *chosen number* is in question.

3. **Does the D-12 guard belong at fixture level after all?**
   - What we know: the two `test` objects differ (`visual-regression.spec.ts:47-48`), and the voter
     fixture pre-navigates, so a test-body `page.on('request')` misses the walk.
   - Recommendation: the `PerformanceResourceTiming` read (retroactive, whole-document-lifetime) makes a
     spec-local guard sufficient without touching shared fixtures. If the planner disagrees, moving it to
     the fixtures is a scope expansion CONTEXT does not authorise — escalate rather than absorb.

4. **Should the N-2 finding reopen D-10?**
   - Recommendation: **no.** D-10 A is preserved exactly — `settleFonts` stays verbatim, its docblock is
     rewritten (which D-10 already mandates), and the hole is closed by widening the D-12 guard, which is
     explicitly Claude's discretion. But the docblock rewrite must state the *measured* coverage, not a
     patched-up version of a claim that was never true. Flag this to the operator in the plan summary:
     it is a premise correction, not a decision change.

5. **Is the 5th stale record claim (N-2) in D-18's scope?**
   - What we know: D-18 A enumerates four claims. N-2 is a fifth, discovered after the discussion.
   - Recommendation: fold it into the D-18 record-correction plan. It lives in the very docblock D-18
     already opens, so it costs nothing extra — but it should be **named explicitly** in the plan and in
     the phase record, not slipped in, since it was not one of the four the user reviewed.

## Sources

### Primary (HIGH confidence — read or executed this session)

- `tests/playwright.config.ts:274, 294, 307, 309, 315-320, 327, 366-369, 387-390`
- `tests/global-setup.ts` (full, 53 lines) — esp. `:19-22, 35-37, 42, 50`
- `tests/tests/support/preflight.ts:77, 88, 366-368, 411, 414, 429, 440-444`
- `tests/tests/utils/testsDir.ts:7`
- `tests/tests/specs/visual/visual-regression.spec.ts` (full, 159 lines) — esp. `:24-43, 47-48, 54-75, 91, 110, 131, 154`
- `tests/tests/setup/shared/auth.setup.ts:82-84`
- `tests/tests/utils/supabaseAdminClient.ts:59, 585, 628`
- `tests/tests/specs/perf/performance-budget.spec.ts:138-142` (the in-repo `page.on('request')` precedent)
- `tests/scripts/e2e-run.sh:1-60, 194-205, 328-380, 383-435` (the script-style and JSON-reporter precedent)
- `tests/README.md:5-30, 185`
- `.github/workflows/main.yaml:305-320, 345-374`
- `apps/frontend/src/routes/+layout.svelte:207-208, 221-225`
- `apps/frontend/src/app.css:91, 93, 206-207, 210-211, 222-223, 226-228, 261-264, 279-281`
- `apps/frontend/vite.config.ts:1-46` (esp. `:17, 36-44`)
- `apps/frontend/svelte.config.js` (full)
- `apps/frontend/package.json` (scripts, `:24`)
- `apps/docs/src/app.html:1-14`
- `packages/app-shared/src/settings/staticSettings.ts:41-45`
- `packages/app-shared/package.json` (`exports`), `packages/app-shared/tsup.config.ts`
- `apps/frontend/src/lib/components/matchScore/MatchScore.svelte:30`
- root `package.json` (scripts), `.gitignore:33, 36-37, 44`, `.planning/config.json`
- `node_modules/playwright-core/lib/server/utils/comparators.js:80-100`
- `node_modules/playwright/lib/matchers/toMatchSnapshot.js:270-310`
- `node_modules/playwright/types/testReporter.d.ts:285-315`
- `yarn.lock:3313-3330, 8545-8600`
- `.planning/REQUIREMENTS.md:1-27`
- `.planning/ROADMAP.md` § Phase 146
- `.planning/STATE.md:1-60`
- `.planning/phases/146-…/146-CONTEXT.md`, `146-DISCUSSION-POINTS.md`
- `.planning/milestones/v2.14-phases/136-…/136-VISUAL-DISCRIMINATION-EVIDENCE.md` (full)
- `.planning/milestones/v2.14-phases/136-…/136-05-SUMMARY.md:140-250`
- `.planning/milestones/v2.14-phases/136-…/136-06-SUMMARY.md:150-260`
- `.planning/milestones/v2.14-phases/136-…/deferred-items.md:134-150`
- `CLAUDE.md`, `.agents/code-review-checklist.md:1-30`

### Commands executed this session (HIGH confidence — observed output)

- `docker version` · `docker image inspect mcr.microsoft.com/playwright:v1.58.2-noble --format '…{{.RepoDigests}}…'`
- `docker run … -v "$PWD":"$PWD" -w "$PWD" … bash -c 'pwd; uname -m; node -v; ls -d tests/tests/support/preflight.ts'` (**N-9**)
- `docker run … --add-host fonts.googleapis.com:127.0.0.1 … curl https://fonts.googleapis.com/css2?family=Inter` (**N-8**, exit 7)
- `docker run … node <Chromium probe>` — three `document.fonts.check` cases (**N-2**) and one blocked-`<link>` case (**N-8**)
- `npx playwright test --help` (**N-4**, mode preset)
- `npm view @fontsource/inter version time.modified license repository.url` · `gsd-tools query package-legitimacy check`
- `npm pack @fontsource/inter@5.3.0` + `tar -tzf`/`-xzf` + `grep -c unicode-range` + `unicode.json` read (**N-5**)
- `curl -A <Chrome UA> "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"` and per-weight variants (**N-1**)
- `curl` of the served woff2 + `shasum -a 256` + a WOFF2 table-directory parse (**N-1**)
- PNG IHDR reads over `tests/tests/specs/visual/__screenshots__/` (M-2)
- `grep -rn "fonts.googleapis" apps/frontend/build/` (**N-6**)

### Secondary (MEDIUM confidence)

- Google Fonts `css2` API behaviour (single-weight → static instance, multi-weight → variable face)
  — inferred from the *observed* responses above, not from documentation. The observation is HIGH; the
  generalisation to other families is MEDIUM and not relied upon.

### Tertiary (LOW confidence)

- None relied upon. No claim in this document rests on WebSearch or on unverified training knowledge;
  the items that could not be measured are enumerated in the Assumptions Log.

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Container recipe (D-14, D-15, N-3, N-8, N-9) | **HIGH** | Mount, egress block, image digest, arch, node version and tool inventory all executed and observed in the pinned image this session |
| Sensitivity mechanism (D-01/02/03/05) | **HIGH** | `comparators.js:88-96` read verbatim; ratio budgets recomputed from on-disk PNG headers |
| Noise-measurement mechanics (D-04) | **HIGH** | Failure-message text corrected against source; JSON reporter shape read from type definitions; in-repo precedent quoted |
| Height-independence control (D-06) | **MEDIUM-HIGH** | Design is sound and the design tokens are verified; the filler's non-perturbation (A3) and the overlay `snapshotPathTemplate` (A8) are reasoned, with cheap in-task falsification for both |
| Self-hosting Inter (D-08, D-09) | **HIGH** — with one honest unknown | File identity proven by sha256; `unicode-range` recovered verbatim; path resolution verified from `svelte.config.js`. The variable→static rasterisation delta (A4) is explicitly **unmeasured by design** |
| `settleFonts` coverage (D-10, N-2) | **HIGH** | Three-case truth table measured in the pinned container |
| Egress block (D-11) | **HIGH** | Verified at curl **and** Chromium level |
| VGATE-05 discharge (D-12) | **MEDIUM-HIGH** | The guard's mechanism is sound; the fixture-pre-navigation boundary is identified and mitigated, but not yet executed |
| Run-4 protocol (D-16) | **HIGH** as a protocol | The prior record was re-read in full; it confirms *no output survives*, so the protocol is necessarily generative — and its power is stated rather than assumed |
| Re-baseline mechanics (D-17, N-4) | **HIGH** | `-u` mode semantics read from the installed implementation, not from docs |

**Research date:** 2026-08-25
**Measured at:** HEAD `f857b200e`
**Valid until:** ~2026-09-24 for the in-repo facts (stable; the phase is the only thing about to change
them). **The N-1 Google Fonts observation is volatile** — Google can change what `css2` serves at any
time, and Inter is at `v20` today. If the phase does not start within ~2 weeks, re-fetch the css2
response and re-check whether the two-weight request still returns one shared URL before relying on N-1's
framing. The vendored bytes, once committed, are immune to that drift — which is itself an argument for
the change.

---

*Phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity*
*Research complete: 2026-08-25 — 17/17 measurements re-verified, 11 new findings, 2 of which correct premises the locked decisions were argued from*
