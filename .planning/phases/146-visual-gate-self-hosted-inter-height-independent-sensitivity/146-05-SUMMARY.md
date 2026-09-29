---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: '05'
subsystem: frontend / test-infrastructure
tags: [fonts, privacy, self-hosting, visual-regression, VGATE-04, VGATE-05, OFL]
status: complete
requires:
  - '146-04 — the absolute maxDiffPixels cap in force, so the font delta is measured against a fixed verdict rule'
provides:
  - 'apps/frontend/static/fonts/ — four OFL-licensed Inter woff2 files, OFL.txt, inter.css, README.md'
  - "staticSettings.font.url default '/fonts/inter.css' — the app serves its own typeface from its own origin"
  - 'guardThirdPartyFonts(page) — a standing guard making a wrong same-origin font path fail BY NAME'
affects:
  - 'every page of the frontend (the <link> in +layout.svelte:225 now points same-origin)'
  - 'every downstream VAA operator who does not override staticSettings.font.url'
  - '146-06 (the font-delta measurement now has its at-cap half), 146-07 (re-baseline; and its D-16 step needs re-scoping)'
tech-stack:
  added: []
  patterns:
    - 'vendored third-party asset + verbatim inbound licence beside the bytes (portraits LICENSE.md precedent)'
    - 'module-level async helper taking `page`, called as the last step before capture (settleFonts precedent)'
    - 'retroactive performance.getEntriesByType(resource) read instead of a live page.on(request) listener'
key-files:
  created:
    - apps/frontend/static/fonts/inter-latin-400-normal.woff2
    - apps/frontend/static/fonts/inter-latin-700-normal.woff2
    - apps/frontend/static/fonts/inter-latin-ext-400-normal.woff2
    - apps/frontend/static/fonts/inter-latin-ext-700-normal.woff2
    - apps/frontend/static/fonts/inter.css
    - apps/frontend/static/fonts/OFL.txt
    - apps/frontend/static/fonts/README.md
  modified:
    - packages/app-shared/src/settings/staticSettings.ts
    - tests/tests/specs/visual/visual-regression.spec.ts
    - .planning/phases/146-visual-gate-self-hosted-inter-height-independent-sensitivity/146-NEGATIVE-CONTROL.md
decisions:
  - 'Both latin sha256 digests match Google Fonts own served statics exactly — provenance carried as an offline-re-verifiable fact, not re-argued'
  - 'The guard was proven to FAIL under two deliberate violations, not merely observed passing'
  - 'D-16 as chartered is obsolete — the run-4 anomaly was root-caused and fixed; 146-07 must re-scope, not execute it'
metrics:
  duration: ~46 min
  completed: 2026-08-26
actuals:
  tokens: 27456
  tasks: 3
  commits: 3
---

# Phase 146 Plan 05: Self-Hosted Inter + the D-12 Font Guard Summary

The application now serves its own Inter from its own origin, and a broken same-origin font path fails
by name instead of as an inscrutable whole-page pixel diff.

## What was built

**119 KB of OFL-licensed Inter, cryptographically verified.** `npm pack @fontsource/inter@5.3.0` into a
scratch directory outside the repo, four files copied verbatim, tarball deleted. No dependency added —
`git diff --exit-code package.json yarn.lock` exits 0.

| File | Bytes | sha256 | Provenance |
| --- | ---: | --- | --- |
| `inter-latin-400-normal.woff2` | 23,664 | `8909904ab6c872eb994093482a88a28eca2cd95912d7b6fecd72103b0dc07edc` | **Matches N-1's recorded Google-served static exactly** |
| `inter-latin-700-normal.woff2` | 24,356 | `6f56409fd3d64bb85f7d070bce20749db2d66b6d63cec586cc22d1c761be2491` | **Matches N-1's recorded Google-served static exactly** |
| `inter-latin-ext-400-normal.woff2` | 35,000 | `6744a7f509ebc6ab220a6cd4ea77e898adf014f03d88dcda5d45d8a9feefb4e9` | tarball; no Google comparand recorded |
| `inter-latin-ext-700-normal.woff2` | 36,244 | `143f9504f1377012aa3e39c90c4354ef429cb0494b9ac0e1437f1a81e5412236` | tarball; no Google comparand recorded |

All four byte sizes equal Pattern 4's table. Both latin digests were compared against `146-RESEARCH.md`
§ N-1 **before** committing; a mismatch on either would have halted the task. All four are recorded in
`apps/frontend/static/fonts/README.md`, so the provenance is re-verifiable **offline** with
`shasum -a 256 *.woff2` and no trust in the npm registry.

**Licence compliance, done properly rather than by file placement.** `OFL.txt` is the tarball's
`package/LICENSE` byte-identical — `cmp` clean, sha256 `3b0a5fca3d17942cde889069889dedbbbd075e9b599968c82a95f4d944e9b345`,
**93 lines**, zero Markdown headings introduced. It carries both things OFL 1.1 § 2 requires of a
redistribution: the upstream copyright notice
(`Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)`) **and** the full licence
text, and it sits in the same directory as the bytes it covers. Two further conditions were checked
rather than assumed: the upstream notice declares **no Reserved Font Name**, so serving the family under
its own name `Inter` is permitted; and the font is redistributed as a component of the application, not
sold on its own (§ 5). `README.md` carries the repo-specific provenance separately, so `OFL.txt` stays
byte-exact.

**`inter.css`** — four `@font-face` rules, `latin-ext` before `latin`, `font-family: 'Inter'` exactly
(matching `app.css:226` and `settleFonts`), `font-display: swap`, woff2-only `src`, and `unicode-range`
values taken from the tarball's `unicode.json` and **verified programmatically byte-equal** to it after
whitespace normalisation. Per N-5 the per-subset CSS files omit the ranges entirely; four rules without
them would have shadowed each other and served basic-Latin glyphs from the wrong file.

**The default change** — `font.url` before and after:

```
- url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
+ url: '/fonts/inter.css',
```

One string. `name: 'Inter'` and `style: 'sans'` untouched; no comment added to a zero-comment file;
`git diff --stat` shows exactly 1 insertion and 1 deletion. `apps/frontend/src/routes/+layout.svelte` is
**byte-identical** (`git diff --exit-code` exits 0) — its `indexOf('fonts.googleapis')` test simply goes
false, which is D-08's prediction observed rather than argued.

**The guard** — `THIRD_PARTY_FONT_HOSTS` plus `guardThirdPartyFonts(page)` at module level, awaited in
exactly four test bodies immediately after `settleFonts(page)`. `settleFonts`' body is unchanged; the
whole diff to that file is **additions only** (`git diff | grep '^-'` returns nothing).

## The served application was observed to have taken the change

This is the part that cannot be inferred from a source edit. `yarn build` ran **first** (14/14 turbo
tasks successful), then the dev server was restarted, then:

| Check | Observed |
| --- | --- |
| `grep -c '/fonts/inter.css' packages/app-shared/dist/index.js` | **1** |
| `grep -c 'css2?family=Inter' packages/app-shared/dist/index.js` | **0** |
| `GET /fonts/inter.css` | **200**, `text/css`, 2,279 B |
| `GET /fonts/inter-latin-{400,700}-normal.woff2` | **200**, 23,664 / 24,356 B |
| `GET /fonts/inter-latin-ext-{400,700}-normal.woff2` | **200**, 35,000 / 36,244 B |
| Served woff2 bytes, sha256 | `8909904ab6c872eb…` — identical to the vendored file and to Google's own static |
| `fonts.googleapis.com` in the served HTML for `/` | **0** |
| `fonts.gstatic.com` preconnects in the served HTML | **0** |
| The stylesheet link actually emitted | `<link href="/fonts/inter.css" rel="stylesheet" …>` |

The Pitfall-3 stale-`dist/` failure mode — every gate green while measuring Google-served Inter — is
therefore closed by observation, not by ordering discipline alone.

## The dev-server restart

D-16's continuous-uptime constraint was void by the time this plan ran, so the restart cost the phase
nothing — but the register's contract is that any identity change is recorded, so it is.

| | |
| --- | --- |
| Old PID | `82314` (wrapper `82313`), started `2026-08-26 10:42:42`, up 4 h 54 m |
| Stopped | `2026-08-26 15:37:32`; port 5173 confirmed free |
| New PID | `98287`, started `2026-08-26 15:37:44` |
| Two further restarts | `98287` → `3733` → **`4037`** — required by the guard's deliberate-fail demo B, which changes `font.url` and therefore needs a rebuild + restart in each direction |
| **Final PID** | **`4037`**, started `2026-08-26 15:57:13`, Vite v6.4.1, `yarn workspace @openvaa/frontend dev --host 0.0.0.0`, **wildcard** bind `node 4037 … TCP *:5173 (LISTEN)` |
| HEAD at final build | `9e21b25b4` tree state — `dist/index.js` carries `/fonts/inter.css`, zero `inter-alt` |
| Sanity | `/` → 200; `/@fs/…/apps/frontend/src/routes/+layout.svelte` → 200 (the clause the preflight tests) |

Full record in `146-NEGATIVE-CONTROL.md` — header bullet (restart history) plus
§ *The `146-05` restart*.

## The guard was proven to fail, not merely to pass

A guard only ever observed passing is indistinguishable from one that cannot fail. Both assertions were
violated deliberately.

| Demo | Injection | Result |
| --- | --- | --- |
| Control (`146-05-guardfail-control`) | none | Guard **passed**; only `toHaveScreenshot` failed, at **856 px** |
| **A** (`146-05-guardfail-3p2`) | `@import` of `fonts.googleapis.com/css2?family=Roboto` prepended to `inter.css`; app stays healthy | Guard **failed naming the URL**: `third-party font requests observed (VGATE-05 requires none): https://fonts.googleapis.com/css2?family=Roboto&display=swap` |
| **B** (`146-05-guardfail-nopath`) | `font.url` → `/fonts/inter-alt.css`, a **real 200-serving copy**, rebuilt + restarted, so real Inter still loads | **`settleFonts` PASSED**; guard **failed by name**: `the same-origin Inter stylesheet /fonts/inter.css was never requested — staticSettings.font.url is not pointing at it` |

Demo B is the N-2 blindness closure demonstrated rather than asserted: the run **reached** the guard
only because `settleFonts` was satisfied by a font loaded from the wrong path.

Two masked attempts are recorded rather than discarded — see § *Deviations*.

## Verification

| Gate | Result |
| --- | --- |
| Task 1 automated verify (7 files, 4 faces, 4 ranges, 4 digests recorded) | **OK** |
| `unicode-range` values byte-equal to `unicode.json`, `latin-ext` first | **OK** (checked programmatically) |
| `git diff --exit-code package.json yarn.lock` | **exit 0** — no dependency added |
| `git check-ignore -v apps/frontend/static/fonts/inter.css` | exit 1 — trackable |
| Task 3 automated verify (signature, 4 call sites, `inter.css` assertion, `settleFonts` intact) | **OK** |
| `grep -c maxDiffPixels` in the spec | **0** |
| `git diff --exit-code -- tests/tests/fixtures/` | **exit 0** |
| `yarn lint:check` (incl. `typecheck:tests`) | **pass** |
| `yarn format:check` | **pass** |
| `yarn test:unit` | **pass** — 569 tests |
| `npx playwright test --list` | **142 tests in 92 files** |
| Visual confirmation run `146-fontdelta-cap` | Guard passed on **all four**; `E2E PREFLIGHT OK` present |
| Baselines untouched | `git status --short tests/tests/specs/visual/__screenshots__/` **empty** |
| **Full E2E suite** (`yarn test:e2e`, after `yarn db:reset`) | **135 passed, 0 failed, exit 0 — cardinal-clean** |

## The at-cap half of the font delta — `146-06` should reuse this run

> ### ⚠ CORRECTED BY `146-06` — read this before the section below
>
> **The 856 px reading below is NOT the font delta, and the conclusion drawn from it ("the
> variable-to-static switch is not rasterisation-neutral") is withdrawn.** `146-06` Task 1 decoded this
> very run's own expected/actual pair: `pixelmatch@threshold 0.2` reproduces **856** over the full
> image, and **0** once a single **48 × 48 portrait tile** (x 373-420, y 178-225) is masked — the two
> sessions seeded a *different photograph* for the same candidate. Every scored pixel of the 856 was
> that tile. It also does not reproduce: the same comparison at HEAD `9cd183379` scores **0 px** at
> zero tolerance in four consecutive runs, and a rasterisation delta between two font deliveries would
> be deterministic.
>
> **What `146-06` measured instead:** `candidate-preview-desktop` **0 px** · `candidate-preview-mobile`
> **0 px** · `voter-results-desktop` **11,615 px** · `voter-results-mobile` **11,601 px** (zero
> tolerance, four runs, no `-u`). Research's falsification criterion was therefore **not met**, and
> D-09 A's neutrality claim **survives measurement**. The `146-fontdelta-cap` run below is preserved
> intact as this plan's evidence; `146-06` took its own at-cap run (`146-fontdelta-cap-146-06`) at
> current HEAD rather than reusing it. Full record:
> `146-VISUAL-NOISE-LEDGER.md` § *Font delta (N-1)* and register row `F1-DELTA-PRE`.

`tests/e2e-runs/146-fontdelta-cap`, shipped config, cap `maxDiffPixels: 200` in force, no
snapshot-update flag, `observed_expected=3 observed_unexpected=4 observed_flaky=0`:

| Baseline | Diff | vs the 200 px cap |
| --- | ---: | ---: |
| `voter-results-desktop` | **16,887 px** | 84× |
| `voter-results-mobile` | **16,878 px** | 84× |
| `candidate-preview-desktop` | **856 px** | 4.3× |
| `candidate-preview-mobile` | **856 px** | 4.3× |

Two readings matter, and neither is this plan's to conclude:

1. **The candidate-preview pair moved.** `136-VISUAL-DISCRIMINATION-EVIDENCE.md` recorded that pair at
   *exactly* 0 px across runs, and N-1 named it the falsification criterion: *"if they move at all, the
   move is the font."* They moved, by 856 px, **identically on both viewports**. The
   variable-to-static switch is **not** rasterisation-neutral. That is the finding `146-06` exists to
   record with numbers.
2. **The voter pair's ~16,880 px is confounded** and must not be read as the font delta. Those two
   baselines are stale for a second, independent reason — they predate the `dbb704bd4` tie-break fix
   — exactly as `C1-NEW` documented. The 856 px figure is the clean signal; the ~16,880 px figures
   are font delta **plus** ordering churn.

The 856 px reproduced **exactly** across three independent runs (`146-fontdelta-cap`,
`146-05-guardfail-control`, and demo A's run before its injection fired), so it is a stable measurement
rather than noise.

## Deviations from Plan

### 1. [Rule 3 — Blocking] Task 2 executed rather than paused at its `checkpoint:human-action` gate

**Found during:** Task 2. **Issue:** the task is typed `checkpoint:human-action` with
`gate="blocking-human"`, on the stated ground that the restart must be operator-performed because
`146-07`'s D-16 control treats continuous uptime as an independent variable. **Resolution:** the
executing prompt explicitly voided that ground (D-16 is obsolete — see below), directed that the restart
be performed and recorded, and asked for the new PID and its build HEAD in the report. The step was
therefore executed in full — `yarn build` first, restart second, served-app verification third — and
recorded to the standard the register requires. Nothing about the checkpoint's *content* was skipped;
only its actor changed.

### 2. [Rule 1 — Bug] The header comment inflated its own verification count

**Found during:** Task 1. **Issue:** the plan's automated check counts `unicode-range` occurrences and
requires exactly 4; the prose in `inter.css`'s header comment contained the literal string, making it 5.
**Fix:** reworded to "subset ranges below come from that package's `unicode.json`". Same for
`cloud.umami.is` in the guard's docblock in Task 3 — the acceptance criterion is that the string appears
**nowhere** in the file, so the docblock now says "the app's analytics host" without naming it.
**Files:** `apps/frontend/static/fonts/inter.css`, `tests/tests/specs/visual/visual-regression.spec.ts`.

### 3. [Rule 2 — Missing verification] Two deliberate-fail demonstrations added beyond the plan

**Found during:** Task 3. **Issue:** the plan's confirmation run only establishes that the guard
**passes**. **Fix:** both assertions were violated deliberately and observed to fail by name (table
above). Two attempts were masked and are recorded rather than discarded, because each is a finding:

- **Importing Google's *Inter*** (rather than Roboto) put a face named `Inter` in the document whose
  `src` then failed — N-2 case **B** — so `settleFonts` fired first and the guard never ran. Isolating
  the guard requires a family the `1em Inter` check cannot see.
- **Deleting `inter.css` from disk** did **not** produce a quiet 404. The request falls through to the
  SvelteKit router, which renders a full SSR error page — **201,586 bytes of `text/html`** whose own
  `<head>` contains another `<link href="/fonts/inter.css">`. Served on every navigation, this timed out
  `auth-setup`'s login at 90 s **twice** (`146-05-guardfail-404`, `-404b`) while control runs either
  side passed — a clean 4-point alternation with the file's presence. So in dev, a wrong vendored path
  is loud but loud in the **wrong place**: it breaks an unrelated setup project instead of saying the
  font stylesheet is missing. That strengthens the case for the guard, and it is why demo B was run
  against a real 200-serving alternative path instead.

### 4. Full E2E suite run beyond the plan's requirements

The plan requires no default-suite run. Since `font.url` is a **product** default affecting every page's
`<link>`, the suite was run as the trusted signal per CLAUDE.md: `yarn db:reset` then `yarn test:e2e` →
**135 passed, 0 failed**.

### 5. VGATE-05 deliberately left `Pending` in REQUIREMENTS.md

The plan's frontmatter lists `requirements: [VGATE-05]`, and the executor's state step would normally
check it off. It was **not** checked off. VGATE-05 reads *"the **production** app issues no third-party
font request"*, and this plan measured the **dev** server. The evidence that discharges it is explicitly
scheduled elsewhere: the production-build trace (`PT1-PRODTRACE`, research Pattern 5b) in `146-07`, and
the egress-blocked run (`EG1-CURL`/`EG2-SUITE`) in `146-08`. Marking it complete here would assert
something unmeasured — the precise failure mode this phase exists to prevent. The change and its
standing guard are landed; the requirement closes when its own evidence exists.

## ⚠ Flag for `146-07`: the D-16 step must be re-scoped, not executed as written

D-16 chartered a bounded (≤ 3 attempt) reproduction of the *"run-4 anomaly"* under **continuous**
dev-server uptime, on the premise that it might be an HMR/uptime phenomenon. **It is not, and it is no
longer unexplained.** Between `146-03` and `146-04` it was root-caused and fixed: the container's
outbound TCP SYN to `host.docker.internal` was intermittently dropped, stalling connections **36–68 s**
in Linux SYN backoff, while `tests/scripts/tcp-forward.mjs` dialled **once with no deadline**. Fixed in
`4066c2f41` (bounded re-dial) and `351981b4f` (the voter fixture now fails at the stalled navigation
rather than swallowing the timeout). See `.planning/debug/answer-surface-wait-timeout.md`.

Consequences:

- Rows `D16-A1` … `D16-A3` describe a **discovery** protocol for a failure that now has a confirmed
  cause and a landed fix. Run as written they would produce three non-reproductions whose meaning is
  already known.
- Continuous uptime is no longer an independent variable of anything, which is why this plan's restarts
  were free.
- `146-07` should either **retire** the step (citing the two fix commits) or **re-scope** it into a
  *regression* check — does the bounded re-dial hold across repeated runs — which is a different
  question with a different pass condition.

This is flagged here and in `146-NEGATIVE-CONTROL.md` rather than left for someone to execute as
written.

## Known Stubs

None.

## Threat Flags

None. The plan's threat register is discharged as written: T-146-01 by the four recomputed digests and
the two latin matches, T-146-02 and T-146-SC by `git diff --exit-code package.json yarn.lock` (exit 0)
and by deleting the tarball and extracted directory, T-146-15 by the verbatim `OFL.txt` with its
copyright notice beside the bytes plus the no-Reserved-Font-Name and not-sold-alone checks, T-146-04 by
an untouched `+layout.svelte` with its `??` fallback and preconnect branch intact, and T-146-16 by the
guard's `/fonts/inter.css` 200 assertion — **demonstrated failing**, not merely present.

## Reversibility

**Costly, as the plan rated it.** `staticSettings.font.url` is a published framework default:
downstream VAA operators who do not override it get self-hosted Inter after this lands, and every
baseline captured from `146-07` onward is captured against it. What keeps it costly rather than one-way
is that `+layout.svelte` was not touched — an operator setting `font.url` back to a
`fonts.googleapis.com` URL gets the preconnects and the Google stylesheet exactly as before.

## Commits

| Task | Commit | What |
| --- | --- | --- |
| 1 | `195ec8244` | `feat(146-05)`: vendor Inter 400/700 latin+latin-ext, OFL.txt, inter.css, README.md |
| 2 | `26060159a` | `feat(146-05)`: point `staticSettings.font.url` at `/fonts/inter.css`; restart recorded |
| 3 | `9e21b25b4` | `test(146-05)`: add `guardThirdPartyFonts` + its two deliberate-fail demonstrations |

## Self-Check: PASSED

All seven vendored files exist on disk, all three task commits resolve in `git log`, and the visual
baselines under `tests/tests/specs/visual/__screenshots__/` are untouched (`git status --short` empty).
