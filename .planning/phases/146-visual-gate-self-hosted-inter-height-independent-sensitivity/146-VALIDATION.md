---
phase: 146
slug: visual-gate-self-hosted-inter-height-independent-sensitivity
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false  # Wave 0 artefacts are created by 146-01
created: 2026-08-25
---

# Phase 146 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `146-RESEARCH.md` § *Validation Architecture* (HEAD `0b808fa89`).

**What "validation" means in this phase.** The deliverable *is* a test guard. Its requirements are not
validated by writing new tests *about* the code — they are validated by **running the guard under
conditions that make its verdict falsifiable**. The negative controls **are** the tests. The sampling
rate below is expressed accordingly.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `@playwright/test` **1.58.2** (E2E/visual) · `vitest` (unit — not exercised by this phase) |
| **Config file** | `tests/playwright.config.ts` (`defineConfig` at `:274`) |
| **Measurement-only overlay** | `tests/playwright.noise.config.ts` — **uncommitted**, quoted verbatim in the ledger, deleted after D-04 |
| **Quick run command** | `PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression --workers=1 --retries=0` (in-container) |
| **Full suite command** | `yarn test:e2e` |
| **CI-literal command** | `CI=true PLAYWRIGHT_VISUAL=1 npx playwright test -c ./tests/playwright.config.ts --grep "@visual"` (`main.yaml:361`) |
| **Machine-readable output** | `--reporter=html,json` + `PLAYWRIGHT_JSON_OUTPUT_FILE` (precedent `e2e-run.sh:394-402`) |
| **Tests per visual run** | **7** (4 captures + `data-setup-base` + `auth-setup` + `data-teardown-base`) — dependency projects are exempt from `--grep` |
| **Estimated runtime** | ~1.2 min per visual run; ~15 min for D-04's n=10 × 4 |

**Hard prerequisite of every capture (N-7):** `yarn build` (or at minimum
`yarn build --filter=@openvaa/app-shared`) must run **before the dev server is (re)started**.
`@openvaa/app-shared` is ESM-only and the frontend resolves it to the built `dist/` — a stale `dist/`
would re-baseline against Google-served Inter and **pass every gate for the wrong reason**.

**Host-side dev server (N-10):** `yarn workspace @openvaa/frontend dev --host 0.0.0.0`.
`yarn dev --host 0.0.0.0` does **not** work — appended args land on `concurrently`, not `vite`.

---

## Sampling Rate

- **After every task commit:** `yarn lint:check` + `yarn format:check` (`lint:check` also runs
  `typecheck` and `typecheck:tests`). For test-file edits, `npx playwright test --list` to confirm the
  suite still enumerates (it deliberately skips the preflight — `global-setup.ts:14-17`).
- **After every plan (in-container):** one visual run at `--workers=1 --retries=0`; exit code **and**
  per-test results recorded.
- **After every plan wave:** `yarn test:e2e` — the visual project is opt-in and excluded from it, so
  this specifically guards against the font change perturbing the default suite. `136-05-SUMMARY.md`
  records `134 passed` as the standing count; **re-derive it, do not assume it**.
- **Phase gate:** D-17's six runs (5 × strict + 1 × CI-literal), **plus** a green `yarn test:e2e`,
  **plus** `git status --short tests/tests/specs/visual/` **empty** after the final non-updating run —
  the proof the gate *compared* rather than *re-recorded*.
- **Max feedback latency:** ~90 s (single in-container visual run).

---

## Per-Task Verification Map

Reconciled against the final **9-plan / 9-wave strictly-serial** structure (plans committed
`512aacc1e` + `7d0a8578f`). The earlier 4-plan map in this file predated the research amendment that
forced serial ordering and has been replaced — a reader consulting this table alone now gets the real
plan/wave mapping.

| Task ID | Plan | Wave | Requirement | Behaviour to validate | Test Type | Automated command / observation | Status |
|---------|------|------|-------------|-----------------------|-----------|----------------------------------|--------|
| 146-01-01 | 01 | 1 | VGATE-04 | `tcp-forward.mjs` relays dual-stack and exits 0 on `SIGTERM` | source + round-trip | `node --check`; observed body echoed through the relay | ⬜ pending |
| 146-01-02 | 01 | 1 | VGATE-03/04 | `visual-container.sh` encodes the recipe digest-pinned, identical-path, egress-flagged | source assertions | `bash -n` exit 0; `--help` prints nine exit codes; unknown flag → exit 2; **no bare `--update-snapshots`** | ⬜ pending |
| 146-01-03 | 01 | 1 | VGATE-03 | Both ledgers opened with 29 rows / 40 cells, **nothing measured** | corpus assertion | 145 placeholder occurrences; no filled cell; no cap numeral; `git status --porcelain -- apps packages tests/tests tests/playwright.config.ts .github package.json yarn.lock` **empty** | ⬜ pending |
| 146-02-01 | 02 | 2 | VGATE-04 | Host stack up: `yarn build` → DB → dev server bound `0.0.0.0` | **operator checkpoint** | `checkpoint:human-action`, `gate="blocking-human"` | ⬜ pending |
| 146-02-02 | 02 | 2 | VGATE-04 | **D-14:** one preflight-**PASSING** container run, with zero preflight edits | observation | `E2E PREFLIGHT OK …` on stdout; recorded as `D14-OBS` | ⬜ pending |
| 146-02-03 | 02 | 2 | VGATE-04 | **D-11:** the egress block is live **before** any suite runs | pre-control | `curl` → exit 7; Chromium → `net::ERR_CONNECTION_REFUSED`; recorded | ⬜ pending |
| 146-03-01 | 03 | 3 | VGATE-01 | **The blindness half, RE-OBSERVED:** old config + injection → desktop **PASSES**, mobile **FAILS** | negative control | `B1-OLD` / `B2-OLD`; citing `136-VISUAL-DISCRIMINATION-EVIDENCE.md` for any cell is **prohibited** | ⬜ pending |
| 146-03-02 | 03 | 3 | VGATE-03 | Per-baseline run-to-run noise, n=10 × 4, at `maxDiffPixels: 0` | measurement | 40-cell matrix; overlay must `--list` **7** tests first (F-146-P1/P2) | ⬜ pending |
| 146-03-03 | 03 | 3 | VGATE-03 | The cap is derived in the open from measured noise | derivation | `max(noise) × 10`, floor 200, **ceiling < 5,000**; `max(noise) ≥ 500` → **stop and record a finding** | ⬜ pending |
| 146-04-01 | 04 | 4 | VGATE-02 | The cap lands; the ratio is re-documented as the small-baseline floor | source assertion | **first product byte** of the phase; arithmetic in the config comment; read back mechanically from the ledger | ⬜ pending |
| 146-04-02 | 04 | 4 | VGATE-01 | **The catch half:** new config + identical injection fails **both** voter baselines | negative control | `C1-NEW` / `C2-NEW` | ⬜ pending |
| 146-04-03 | 04 | 4 | VGATE-02 | Growing a page's height does not raise its own tolerance | dedicated control | same damage, two heights, both budgets; **no new committed baseline**; `git status --short tests/tests/specs/visual/` **empty** | ⬜ pending |
| 146-05-01 | 05 | 5 | VGATE-05 | 4 × woff2 + `inter.css` + `OFL.txt` + provenance README vendored | source + provenance | sha256 identity with Google's statics carried from research; `unicode-range` from `unicode.json` (N-5) | ⬜ pending |
| 146-05-02 | 05 | 5 | VGATE-05 | `font.url` default changed, **`yarn build`**, server restarted, served app observed to have taken it | **operator checkpoint** | N-7: without the rebuild the change is invisible and every gate passes for the wrong reason | ⬜ pending |
| 146-05-03 | 05 | 5 | VGATE-05 | `guardThirdPartyFonts` — zero third-party font **requests** AND a 200 on `/fonts/inter.css` | permanent guard | module-level helper called per test (no `beforeEach` exists); **request** listener, never a string scan (N-6) | ⬜ pending |
| 146-06-01 | 06 | 6 | VGATE-06 | **The font-delta measurement (N-1)** — four counts, no `-u`, **before** the re-baseline | measurement | run through the zero-tolerance overlay so the delta yields **numbers, not just verdicts**; `candidate-preview` pair is the sensitive detector | ⬜ pending |
| 146-06-02 | 06 | 6 | VGATE-05 | **N-2 closure:** a bogus `font.url` must fail **BY NAME**, not as a whole-page diff | negative control | `F2-BOGUS-RED` / `F3-BOGUS-GREEN` | ⬜ pending |
| 146-07-01 | 07 | 7 | VGATE-06 | Re-baseline behind the egress block, then green on a clean tree | determinism | **`--update-snapshots=all`** (never bare `-u`, N-4); `G0-CLEAN` | ⬜ pending |
| 146-07-02 | 07 | 7 | VGATE-06 | The run-4 anomaly is **explained or recorded as still unexplained** | bounded reproduction | ≤3 attempts, no server restart; **"did not recur, so presumed gone" is prohibited**; ~49% power stated; "UNCONFIRMED" wording | ⬜ pending |
| 146-07-03 | 07 | 7 | VGATE-05 | The **production app** issues no third-party font request | one-off trace | adapter-node build trace; `PT1-PRODTRACE` | ⬜ pending |
| 146-08-01 | 08 | 8 | VGATE-04 | Clean DB + fresh dev server for the gate runs | **operator checkpoint** | includes `yarn build` as an explicit step | ⬜ pending |
| 146-08-02 | 08 | 8 | VGATE-04 | Visual project **green with font egress blocked at the runner** | end-to-end gate | `EG1-CURL` must fail first, then `EG2-SUITE` passes | ⬜ pending |
| 146-08-03 | 08 | 8 | VGATE-06 | ≥3 consecutive green runs (5 strict + 1 CI-literal) | determinism gate | `D17-R01…R05` + `D17-CI`; every exit code and per-test result recorded, **including failures** | ⬜ pending |
| 146-08-04 | 08 | 8 | VGATE-06 | Preflight untouched; baselines **compared**, not re-recorded; full suite green; ledger closed | phase gate | `PF1-UNTOUCHED` over the phase commit range; `git status --short tests/tests/specs/visual/` **empty**; `yarn test:e2e` green | ⬜ pending |
| 146-09-01 | 09 | 9 | VGATE-04 | `tests/README.md`'s two stale claims + `main.yaml`'s font-egress comment corrected | record | M-15, M-16 | ⬜ pending |
| 146-09-02 | 09 | 9 | VGATE-05 | Both `visual-regression.spec.ts` docblocks rewritten — **including the FIFTH stale claim** | record | N-2, flagged as **not one of the four the user reviewed** | ⬜ pending |
| 146-09-03 | 09 | 9 | VGATE-04/05 | ROADMAP closed; `apps/docs` recorded known-remaining; three todos filed | record | D-13, D-09 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**The row most likely to be dropped:** `146-06-01`, the **font-delta measurement**. It is the only task
that exists because research disproved a premise (N-1) rather than because a decision asked for it.

**Ordering is strictly serial, 01 → 09, and that is deliberate.** The cap and the font both feed the
same re-baseline, and the font delta must be measured against the cap already in force — otherwise
"did the pixels move?" and "did the verdict move?" are confounded. No wave is parallel.

**Plans 01–03 write zero product bytes.** `146-04-01` is the first product byte in the phase. This is
ledger-first ordering, and it **overrides tracer-first** per `REQUIREMENTS.md:9-13`.

---

## Wave 0 Requirements

Nothing is missing from the test *infrastructure*; the gaps are artefacts and one helper.

- [ ] `tests/scripts/visual-container.sh` — the executable recipe (D-15). Style-mirror `e2e-run.sh`.
- [ ] The Node TCP forwarder (N-3) — beside the script, or inlined in its in-container entrypoint.
      (`socat` is **not** installed in the pinned image; `apt-get install -y socat` is the documented
      fallback but mutates the image and costs D-07's digest comparability.)
- [ ] `tests/playwright.noise.config.ts` — **uncommitted**, quoted verbatim in the ledger, deleted after D-04.
- [ ] A throwaway D-06 control spec + overlay `snapshotPathTemplate` under `tests/e2e-runs/` (gitignored)
      — so no reference PNG ever lands in `__screenshots__/`.
- [ ] The D-12 guard helper in `visual-regression.spec.ts`, called from four `beforeEach` blocks.
- [ ] `146-VISUAL-NOISE-LEDGER.md` — the 40-cell matrix, the font-delta row, and the derivation arithmetic.
- [ ] `146-NEGATIVE-CONTROL.md` — the four D-07 halves, the D-06 control, the D-11 controls, D-16's attempts.

*No framework install is needed; **no `package.json` change should be made by this phase**.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The production-build network trace | VGATE-05 | The suite drives the dev server; VGATE-05 names "the production app". A one-off adapter-node trace is the literal discharge | `yarn build` → `node apps/frontend/build/index.js` → load `/results` → capture the request list → record in the ledger. Paired with the **permanent** in-spec request guard so a regression still reddens the build |
| The D-16 anomaly reproduction verdict | *(D-16)* | The outcome is a judgement about an unexplained historical failure, not a pass/fail assertion | ≤3 bounded attempts; if it does **not** reproduce, record **"still unexplained"** with the attempt described — **never** "did not recur, so presumed gone" (the reasoning this milestone rejected for DEF-135-04) |

---

## Validation Sign-Off

- [ ] Every task maps onto a row above, or the row is explicitly marked N/A with a reason
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
- [ ] Wave 0 covers all ❌ artefacts listed above
- [ ] No watch-mode flags
- [ ] Feedback latency < 90 s
- [ ] The blindness half (VGATE-01, plan 01) landed **before** any product byte changed
- [ ] The font-delta measurement (N-1) is present and its number recorded regardless of size
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
