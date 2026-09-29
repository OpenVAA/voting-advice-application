---
phase: 145
slug: default-seed-template-repair
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-24
validated: 2026-08-25
---

# Phase 145 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **Reconstructed from artifacts 2026-08-25.** The file committed at plan time
> (`a00c2d888`) was the unfilled template — every cell was a `{placeholder}`. The map below
> was rebuilt by reading the nine PLAN/SUMMARY pairs and cross-referencing each requirement
> against the tests that actually exist at HEAD, then running them.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vitest` **3.2.4** (root `vitest.workspace.ts` discovers `packages/dev-seed/vitest.config.ts`) |
| **Config file** | `packages/dev-seed/vitest.config.ts` |
| **E2E** | Playwright, `tests/playwright.config.ts`, preflight in `global-setup.ts` |
| **Quick run command** | `yarn workspace @openvaa/dev-seed test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Typecheck gate** | `TURBO_FORCE=true npx turbo run typecheck` (22 tasks) — shipped by Phase 144 D-06 |
| **Cardinal gate** | `yarn test:e2e` (135 tests, `--grep-invert @probe`) |
| **Measured runtime** | dev-seed unit ~10s · full unit suite ~32s (forced, 25 tasks) · typecheck ~16s (forced) · E2E ~15min |

**The integration tier is environment-gated — and both halves of that gate are now closed.**
`default-template.integration.test.ts` is wrapped in `describe.skipIf(!process.env.SUPABASE_URL)`.
CI closes its half with `DEV_SEED_INTEGRATION_REQUIRED: "1"` (`.github/workflows/main.yaml:172`),
which turns a lost wiring into a collection-time throw. The **local** half was closed by this audit
(2026-08-25) — see *Local wiring guard* below. Measured behaviour, all three states:

| State | Before | After |
|---|---|---|
| `SUPABASE_URL` set, instance up | tier runs | tier runs (unchanged) |
| `SUPABASE_URL` set, instance **down** | file **fails** on the first client call (~700ms) | unchanged — a dead instance never passed |
| `SUPABASE_URL` **unset**, Supabase **up** | `2 skipped`, file green, suite exits 0 | **`1 failed`** — the wiring guard reds with an actionable message |
| `SUPABASE_URL` **unset**, Supabase **absent** | `2 skipped`, silent | `1 passed` + a named `console.warn` — the skip is recorded, not merely absent |

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/dev-seed test:unit` (~10s)
- **After every plan wave:** `yarn test:unit` + `TURBO_FORCE=true yarn lint:check`
- **Before `/gsd-verify-work`:** the seven-gate set green at one HEAD
- **Max feedback latency:** ~10 seconds at task granularity

**Gate ordering is load-bearing, not cosmetic.** `yarn test:unit` writes the full default template to
the live database and has **no teardown**, so it must run *before* the reset that precedes the E2E
gate — never between the reset and the suite. Running it in the wrong order is what voided a prior
phase's gate attempt, and `145-08` re-derived the ordering from that hazard rather than from the
script listing.

---

## Per-Task Verification Map

| Req | Behaviour | Test Type | File | Automated Command | Cases | Status |
|---|---|---|---|---|---|---|
| **TMPL-03** | Seeded candidates are readable by an **anon** client — the voter-app path | integration, live DB | `tests/integration/default-template.integration.test.ts` | `yarn workspace @openvaa/dev-seed test:unit` | 3 | ✅ green |
| **TMPL-03** | The anon client really is anon (`accounts` role differential control) | integration, live DB | same file, `:479-492` | same | (in the above) | ✅ green |
| **TMPL-03** | Every emitted candidate row carries `terms_of_use_accepted` — pure I/O early-warning tier | unit, no DB | `tests/templates/default.test.ts` Test 28 | same | 1 | ✅ green |
| **TMPL-03** | `e2e/base` uses the same literal (cross-template consistency) | unit | `tests/templates/default.test.ts` Test 29 | same | 1 | ✅ green |
| **TMPL-03** | Number answers emit inside the question's declared range (`145-04.1`) | unit | `tests/emitters/answers.test.ts` | same | 3 | ✅ green |
| **TMPL-03** | Results page renders parties + candidates tab, in a browser | **manual probe** | `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts` | `GSD_145_HALF=after yarn test:e2e:probes defaultTemplateResults` | 2 | ⚠ manual — see below |
| **TMPL-04** | Organization `external_id`s use the `org_` idiom, not the retired `party_` | unit | `tests/templates/default.test.ts` **Test 30** | `yarn workspace @openvaa/dev-seed test:unit` | 1 | ✅ green — **added 2026-08-25** |
| **TMPL-04** | Constituency `external_id`s use the `con_NN` idiom, not the retired `c_0N` | unit | `tests/templates/default.test.ts` **Test 31** | same | 1 | ✅ green — **added 2026-08-25** |
| **TMPL-04** | Every `ALLIANCE_MEMBERSHIP` party resolves to an emitted organization row, **both directions** | unit | `tests/templates/default.test.ts` **Test 32** | same | 1 | ✅ green — **added 2026-08-25** |
| **TMPL-04** | A partial rename cannot orphan alliance members (relational) | integration, live DB | `default-template.integration.test.ts:397,430` | same | (in the 2) | ✅ green |
| **TMPL-04** | Teardown reaches both idioms after a rename (strand proof) | **manual, DB-backed** | `145-07` four-step procedure | `db:reset` → seed old → seed new → `db:seed:teardown` | — | ⚠ manual — measured once |
| CI wiring | `SUPABASE_ANON_KEY` exported and guarded in the CI job | — | `.github/workflows/main.yaml:203-236` | — | — | ⚠ **deferred** — runner half unobserved (row `CI1`) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ manual/deferred*

**Measured at HEAD, 2026-08-25:** dev-seed unit **49 files / 562 tests, 0 failed, 0 skipped**
(integration tier included and genuinely executed — 9.1s against the live instance). Full unit suite
**25/25 tasks, 0 cached** (forced). Typecheck **22/22, 0 cached** (forced). Lint **22/22, 0 cached**.

---

## Wave 0 Requirements

Existing infrastructure covered all phase requirements — no framework install, no new config.
The three Wave-0-shaped additions this audit made are listed under **Validation Audit** below.

---

## Manual-Only Verifications

| Behaviour | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| Results page renders a non-empty parties list and a candidates tab, against the **`default`** template | TMPL-03 | **Deliberate, per decision D-04.** The gate suite's data-setup projects install `e2e/base`; the probe needs `default`. The two datasets cannot coexist in one run, so D-04 explicitly rejected a gate-suite Playwright spec that seeds `default` mid-suite — shared-database contamination and cardinal-gate risk. The standing guard for the same property is one layer down: the anon-client integration assertion, which is what actually caught the defect class | `yarn db:reset-with-data`, then `GSD_145_HALF=after yarn test:e2e:probes defaultTemplateResults`. Do **not** run `yarn test:unit` between the seed and the probe |
| Teardown reaches both `external_id` idioms after a rename | TMPL-04 | Requires deliberately producing a strand — seed the old idiom, seed the renamed one with **no** intervening reset, then measure teardown. Not expressible as a unit test; needs a live DB and a destructive four-step sequence | `145-07` § Strand proof: reset → seed old → seed new (no reset) → `yarn db:seed:teardown`, counting per idiom at each step |
| CI runner half of the `SUPABASE_ANON_KEY` export | — | Row `CI1` closes **deferred**: the three source facts are confirmed by reading, but the job has never been observed running with the export in place | Discharged by this branch's first pull-request CI run |

---

## Validation Audit 2026-08-25

| Metric | Count |
|--------|-------|
| Requirements audited | 2 (TMPL-03, TMPL-04) + the `145-04.1` insert |
| Gaps found | 3 |
| Resolved | 2 (TMPL-04 — 3 tests added; local skip-gate — 1 guard added) |
| Dispositioned manual-only | 1 (TMPL-03 browser half — per existing decision D-04) |
| Escalated | 0 |

### Gap 1 — TMPL-04's idiom had no standing guard (RESOLVED)

The `party_*` → `org_*` and `c_0N` → `con_NN` rename was verified **once**, by a grep in `145-06`,
and then had nothing pinning it. A later edit could reintroduce the retired idiom and no test would
red. Three cases were added to `packages/dev-seed/tests/templates/default.test.ts`:

- **Test 30** — every organization row matches `/^seed_org_[a-z]+$/` and contains no `party_`
- **Test 31** — every constituency row matches `/^seed_con_\d{2}$/` and is not a retired `seed_c_N`
- **Test 32** — every `ALLIANCE_MEMBERSHIP` entry resolves to an emitted organization row, **and** exactly two parties remain outside both alliances (the reverse direction, so renaming the map without the template also fails)

Test 32 is the load-bearing one. `ALLIANCE_MEMBERSHIP` is the only lookup in the package that keys by
identifier **value** — the matrices all index positionally — so a partial rename produces alliances
with zero members and raises no error anywhere. That is threat `T-145-23`, previously covered only by
the plan's atomic-commit prohibition and by an integration assertion that needs a live database.

**Two-run control (the guard is not vacuous).** `src/templates/default.ts` was transiently injected
with the retired `party_social` idiom: **2 failed / 30 passed** — Tests 30 and 32 both fired, and
Test 31 correctly did *not* (the injection was an organization, not a constituency). Restored with
`git checkout --`; blob `054e32824a75d4afa4a7c98cdb0a20e929c2eb9c` identical to the pre-injection
hash, `git status` clean, re-run **32/32 green**. One injection live at a time, no commit while live.

### Gap 2 — TMPL-03's browser half is outside the gate (MANUAL-ONLY, by prior decision)

Initially recorded as a gap, then **withdrawn on evidence**: the probe's own header documents that
decision **D-04** explicitly rejected a gate-suite spec seeding `default`, and names the anon-client
integration assertion as the standing guard. So the property is guarded — one layer down, at the data
layer, which is where the 11-week defect actually lived and where CI enforces it via
`DEV_SEED_INTEGRATION_REQUIRED=1`. Promoting the probe would overturn a recorded phase decision and
reintroduce the contamination hazard `T-145-12` was written to close. Dispositioned manual-only with
the rationale recorded above rather than "filled".

### Gap 3 — the local skip-gate had no guard (RESOLVED)

Filed after the first pass of this audit, once the mechanism was measured rather than assumed. The
initial reading — "with Supabase down the tier silently skips" — was **wrong**, and measuring it is
what corrected it: `src/cli/seed.ts` calls `process.loadEnvFile()` on the repo-root `.env` at import
time and falls back to `PUBLIC_SUPABASE_URL`, so `SUPABASE_URL` is populated by the barrel import
whether or not the instance is running. A down instance therefore **fails** the file rather than
skipping it (measured against a dead port: `Test Files 1 failed`, ~700ms).

The real hole was narrower and more likely: `SUPABASE_URL` genuinely **unset**, which locally means
**no repo-root `.env` at all** — a fresh clone where `.env.example` has not been copied. There,
`describe.skipIf` dropped the file to `2 skipped`, nothing failed, and `yarn test:unit` exited 0
having never run the anon-RLS guard, the NF-01 budget or the relational assertions. That is a
did-not-run wearing a pass, on the newest contributor's machine.

**Fix.** An always-running `describe` — outside the `skipIf` — resolves the unconfigured case into two
outcomes instead of one:

- **Supabase reachable on `127.0.0.1:54321` but no URL configured** → the guard **fails**, naming what
  did not run and how to fix it. This is a wiring mistake on a machine that *could* have run the tier.
- **Nothing listening** → the guard **passes** and emits a `console.warn`, so a legitimate skip is
  recorded as a named test that ran rather than as an absence in the summary.

The probe short-circuits when `SUPABASE_URL` is set, so the CI integration job does no extra network
work and gains no flake surface.

**Three-branch control, all measured 2026-08-25:**

| Branch | Command | Result |
|---|---|---|
| configured (normal) | `yarn vitest run …integration.test.ts` | **3 passed** |
| Supabase up, URL unset | `SUPABASE_URL='' PUBLIC_SUPABASE_URL='' …` | **1 failed** \| 2 skipped — guard fired with its message |
| Supabase absent | same, probe port transiently repointed to `:1` | **1 passed** \| 2 skipped + the `console.warn` |

The third branch used a transient one-line edit to the port constant, reverted with `sed` rather than
`git checkout --` — the first attempt used `git checkout --` on a file whose guard was still
uncommitted and discarded the work, which is the hazard the phase's own hygiene loop names.

---

### Probe-apparatus reduction (2026-08-25)

Audited all six `_probes` specs for coverage the gate suite does not carry. **Five carried none** —
every fixture each one proved is consumed by at least one gate spec:

| Probe | Fixture it proved | Gate consumer | Verdict |
|---|---|---|---|
| `video` | `expectVideo` | `perm-question-video.spec.ts` | deleted |
| `questionInfo` | `expectInfoMode`, `expectInfoSections` | `perm-interactive-info.spec.ts` | deleted |
| `orgMatching` | `expectOrgMatchScore`, `expectOrgMatchingDisclosure` | `perm-org-matching.spec.ts`, `voter-journey.spec.ts` | deleted |
| `popupNotice` | `createPopupNotice` | `perm-show-feedback-survey.spec.ts` | deleted |
| `numberScale` | `answerNumberScale`, `expectQuestionDisplay`, `expectNumberQuestionDisplay` | `voter-journey.spec.ts` | deleted |
| `defaultTemplateResults` | — | **none — the `default` template is seeded by no gate project** | **kept** |

They were the "fixtures-first" scaffolding: instruments built to prove a reader worked *before* a spec
consumed it. Once the spec exists and consumes the fixture, the gate reds if the reader breaks, and
the probe is a second copy that runs from no command — the same "implied coverage that does not exist"
shape the orphan guard in `playwright.config.ts` was written about after six probe tests sat
unreachable for ~16 phases.

`defaultTemplateResults` survives because its uniqueness is real but *dataset*-shaped: its assertions
are duplicated by `voter-journey.spec.ts`, but no gate project seeds `default`. `PROBE_TEST_MATCH` was
narrowed to it alone; four dangling comment cross-references in live files were repaired
(`perm-question-video`, `perm-interactive-info`, `perm-show-feedback-survey`, `utils/selectElection`).
Gate composition is unchanged: `--list` reports **135 tests in 89 files**, matching `145-08`'s count.

---

## Validation Sign-Off

- [x] All tasks have an automated verify or a documented manual-only disposition
- [x] Sampling continuity: no 3 consecutive tasks without an automated verify
- [x] Wave 0 covered by existing infrastructure
- [x] No watch-mode flags
- [x] Feedback latency < 30s at task granularity (measured ~10s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-25
