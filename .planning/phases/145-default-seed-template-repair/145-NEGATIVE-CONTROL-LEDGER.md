# Phase 145 — Negative-Control Ledger: the seed defect measured before it is repaired

**Thirty rows, four instruments, one machine — and not one borrowed observation anywhere in the
register.** Every blind half this phase owes is measured **here, in `145-01`, on the untouched tree**,
before the commit that changes behaviour exists. A row whose run did not execute keeps its
placeholder cells and carries **no** outcome — never a confirmed one — because a measurement that did
not run counts as a failure, not a pass (`CLAUDE.md` § E2E Hard Rule, generalised;
`139-VERDICTS.md:5-9`).

**The placeholder word in this register is the single lower-case word `pending`.** It is the only
legal value for a measurement cell whose run has not happened yet, and it is what every one of the
last five cells of every row read at creation. Filling a cell means replacing that word with an
observation this phase made, together with the log path and the HEAD it was taken at.

- **Phase:** 145 (default-seed-template-repair)
- **Requirements:** **TMPL-03 / TMPL-04**
- **Opened by:** `145-01-PLAN.md` (wave 1). **Every row is created here, before the phase's first
  measurement.** The six blind/diagnostic rows are filled by this same plan; the remaining
  twenty-four are filled by plans `145-02` … `145-08`, each plan clearing only its own rows.
- **Corpus:** exactly **30 rows**, asserted in this ledger's own § Completeness table. The register is
  D-06's **two measured pairs** (`P1-RED`/`P1-GREEN`, `P2-RED`/`P2-GREEN`) plus the blindness half the
  milestone's standing acceptance rule demands, the four criterion-3 diagnostics, the app-level probe
  pair, the TMPL-04 strand proof, and the milestone's seven standing gates.
- **Protocol source:** `139-VERDICTS.md` § 3.1 HYGIENE-LOOP, reused through `143-01-PLAN.md` and
  `144-01-PLAN.md`, adapted here for a **four-instrument** register — `vitest`, the PostgREST/`curl`
  role probes, the `@openvaa/dev-seed` seed CLI, and Playwright's `_probes` project — rather than
  144's `tsc`/`vitest`/seed-CLI/turbo set.
- **Baseline for OLD halves:** none inherited, none inheritable. **No cell in this register may be
  filled from a document, from a prior session, or from `145-RESEARCH.md`'s measurement tables.**
  Every row carries its own log path and the HEAD its own half was measured at.
- **Run date:** 2026-08-24.
- **HEAD at ledger creation:** `7e26bfd98` — branch `feat-gsd-roadmap`. **Rows measured before and
  after the fix legitimately carry different HEADs**, because the behaviour-changing commits
  (`145-04`, `145-06`) land *between* the two halves of every pair — the 142.1 D-20 precedent,
  inherited through 143 and 144. Each row records the HEAD its own half was measured at.
- **Machine:** developer Mac, host Node, runs issued from the repository root. macOS 26.5.1 arm64 /
  Darwin 25.5.0 / Node v24.14.1. Local Supabase runs in Docker via the Supabase CLI; the diagnostics
  are issued from the host shell against `http://127.0.0.1:54321`. **No container baseline:** this
  ledger records `vitest`, REST, seed-CLI and Playwright exit codes only, never a visual baseline, so
  the milestone's container rule for baselines does not apply.
- Resolved `$TMPDIR`: `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T` — so every
  `${TMPDIR:-/tmp}/gsd-145/…` log reference below resolves under
  `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-145/`. Recorded for the same reason
  139, 142.1, 143 and 144 recorded theirs: **a log path that cannot be resolved later is not
  evidence.**

**Decisions discharged by this ledger:** D-02 (the root cause, named from measurement rather than
from the roadmap's three guesses), D-04 (the anon-client guard and the control that proves the client
really is anon), D-06 (the two measured pairs), D-08 (the same-session role-differential RPC check
that makes criterion 1's result diagnostic rather than anecdotal), and the ledger-first ordering that
overrides tracer-first per `.planning/REQUIREMENTS.md:7-13`.

---

## Why this ledger exists — and what it does NOT claim

The reason this defect survived roughly eleven weeks under a green suite is that **no existing check
crosses the RLS boundary**. `packages/dev-seed/tests/templates/default.test.ts` is 27 pure-I/O tests
that assert nothing about visibility, and
`packages/dev-seed/tests/integration/default-template.integration.test.ts` authenticates as
**service_role, which bypasses RLS entirely**. That claim is the whole justification for the new
guard, so it has to be *measured* — a green suite over a dataset the voter app's anon client cannot
read — rather than told as a story. Row `B1-OLD` is that measurement.

**What this ledger does NOT claim — (a) the roadmap's three suggested root causes.** All three were
disproved upstream and are re-stated here as disproved, so that no later reader mistakes this
register's silence for agreement:

1. **"organizations and nominations are not seeded."** They are — 8 organizations and 377 nominations
   were counted in the seeded database (M-1 / M-3).
2. **"the seeded `results.sections` does not contain the candidate entity type."** It does (M-12).
3. **"the template's constants have drifted."** They have not — the constants are already consistent
   UPPER_SNAKE in both templates (M-12). TMPL-04 is re-scoped by D-05 from "constant naming" to the
   `external_id` **idiom**, which is a real divergence and is what `145-06` and `145-07` address.

Those three namings are recorded as disproved **on the strength of the measurements cited beside
them in `145-DISCUSSION-POINTS.md`**, which is the record they belong to. This ledger's own rows are
independent of them and are re-measured here.

**What this ledger does NOT claim — (b) the CI runner half of `CI1`.** CI triggers only on push/PR to
`main`, and this branch is thousands of commits ahead of a stale `origin/main` — the Phase 137
criterion-3 precedent. Row `CI1` records the **source** assertion (that the `ANON_KEY` export step
exists, in the right job, with the right guard) and states plainly that the **runner half is
unobserved**. It must never carry a confirmed outcome on the strength of a grep.

**What this ledger does NOT claim — (c) anything about the database schema or its RLS policies.** The
`anon_select_candidates` policy is correct as written. Relaxing its predicate is the rejected D-02
option C and would make unaccepted-terms candidates publicly visible. No byte under
`apps/supabase/migrations/` is touched anywhere in this phase; `145-01` asserts as an acceptance
criterion that `git status --porcelain -- apps` prints nothing.

---

## Precedent chain

**`145-NEGATIVE-CONTROL-LEDGER.md` → `144-NEGATIVE-CONTROL-LEDGER.md` →
`143-NEGATIVE-CONTROL-LEDGER.md` → `142.1-NEGATIVE-CONTROL-LEDGER.md` →
`142-NEGATIVE-CONTROL-LEDGER.md` → `141-ASSERT10-LEDGER.md` → `138-NEGATIVE-CONTROL.md` →
`137-NEGATIVE-CONTROL.md` → `136-VISUAL-DISCRIMINATION-EVIDENCE.md`.**

- **`144-NEGATIVE-CONTROL-LEDGER.md` is this ledger's template** for the header field set, the
  rows-first ordering rule, the stance language quoted at the top of this file, and the restoration
  blob-hash table. Its own template was `143-NEGATIVE-CONTROL-LEDGER.md`, which is where the
  rows-first rule and the § Completeness self-assertion first took the shape used here.
- **`139-VERDICTS.md` § 3.1 is the protocol source** — the HYGIENE-LOOP (pre-gate clean `git status`,
  record HEAD, run, revert, post-gate clean `git status`) that every measuring plan in this phase runs.

Rows are **not** appended to any earlier ledger. 144's corpus is "exactly 37 rows", 143's is "exactly
19 rows", 142.1's is "exactly 8 pairs" and 142's is "exactly 12 findings"; adding to any of them
would break a count those documents assert about themselves. This ledger asserts **30**.

---

## Restoration blob hashes — the pre-change state of every file this phase edits

Taken with `git hash-object` at ledger creation, at HEAD `7e26bfd98`, before any injection or fix
existed. Any row that restores one of these paths asserts against the value here.

| Path | `git hash-object` at ledger creation |
|---|---|
| `packages/dev-seed/src/templates/defaults/candidates-override.ts` | `0fbac2543e7e4784e73b2e568d6df505f445242e` |
| `packages/dev-seed/src/templates/default.ts` | `0c1eb840586979501841939873ef2dd6fb4968d0` |
| `packages/dev-seed/src/templates/defaults/alliances-override.ts` | `2ac22cd892b4787d3a40ca1394ef6c4d687dfc23` |
| `packages/dev-seed/src/templates/defaults/nominations-override.ts` | `7eee2866efdbace66b15f5a839a4625791780744` |
| `packages/dev-seed/src/supabaseAdminClient.ts` | `9911632010b639bedfdbb154b630c86f314d4513` |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts` | `9e91eaf844f2b9d5af2a209bc5f2483caaea187c` |
| `packages/dev-seed/tests/templates/default.test.ts` | `016b900cd87cef596fb47ec751b23974d8f1591d` |
| `.github/workflows/main.yaml` | `816c9f8446bbe099a324c7c70782b681acbd8b8e` |
| `tests/playwright.config.ts` | `6e9c7ae1d5a2149ff5d9dcc6bd963bf45569154d` |

**⚠ This table records the state at LEDGER CREATION, which is the PRE-FIX state. It is the correct
restore target only for an injection made at a tree where the listed path has not changed since
`7e26bfd98`.** Any injection made **after** a behaviour-changing commit has touched one of these paths
must record **its own restore target** — `git hash-object <path>` taken at the injection HEAD, written
into the injecting row **before** the file is touched — and restore against that, never against the
value here. Restoring against a stale creation-time hash would silently revert the fix the injection
sits on top of (threat `T-145-20`).

**Pair 2 is exactly such a case.** `packages/dev-seed/src/templates/defaults/candidates-override.ts`
was modified by `145-04` (`eab07013f`, the `terms_of_use_accepted` fix) and again, comment-only, by
`643891c6b`. Its blob at `145-05`'s injection HEAD `9ce618f07` is
`4cb334771eaca37df20721222fbb8021150b8048`, **not** the `0fbac2543e7e4784e73b2e568d6df505f445242e`
this table records. That per-injection **restore target** is written into row `P2-RED` and asserted in
row `P2-GREEN`; the table above was not used for it and must not be.

**The two files this phase creates have no pre-change blob** and are therefore tracked by
`git status --porcelain` instead of by a hash comparison: the Playwright probe spec
`tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts` (created by `145-03`) and this
ledger itself (created here). A restore assertion for either of them is an assertion that the file
is *absent* before its creating plan and *present, untracked-free* after it.

---

## Injection register

Nine columns, in this order:
`Row · Site · Injection / instrument · Instrument + command · HEAD · Cache verdict · Exit · Assertion outcome · Outcome`.

**Ordering guarantee (inherited from 144's rows-first rule, from 143's D-13, from 142.1's D-19, from
139): all thirty rows below were written and committed before the phase's first measurement existed.**
Every measurement cell read `pending` at creation — **30 rows × 5 unfilled cells = 150** occurrences.
That ordering is a property of the **commit graph** — `145-01` Task 1's commit precedes every
measurement in this phase and precedes `145-02` entirely — not a claim made in prose about itself.
**Each plan clears only its own rows**, so the placeholder count is a running assertion: 150 at
creation → 130 after Task 2 → **120** at the close of `145-01`, leaving exactly the twenty-four rows
the seven later plans own.

**Cache-verdict rule.** Turbo-mediated rows must show `cache bypass, force executing` in their log and
must be invoked with `TURBO_FORCE=true` as an **environment prefix**; a replayed exit code is a claim
about a *previous* tree, not a measurement. Rows driven directly by `vitest`, `curl`, the seed CLI or
Playwright are not turbo-mediated and record `n/a — vitest`, `n/a — REST`, `n/a — seed CLI` or
`n/a — playwright` in that cell. **That cell is never left blank.**

| Row | Site | Injection / instrument | Instrument + command | HEAD | Cache verdict | Exit | Assertion outcome | Outcome |
|---|---|---|---|---|---|---|---|---|
| B1-OLD | the existing `packages/dev-seed` suite — **the blindness half** the standing acceptance rule demands | none — the untouched tree | vitest · `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… DEV_SEED_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/dev-seed test:unit` → `vt-B1-OLD-1.log` | `71f4104d9` — the Task 2 commit; tree byte-identical to `7e26bfd98` across `packages`, `apps`, `tests`, `.github` and the repo root, so this is the **existing, unmodified** suite | `n/a — vitest` | **0** | **Test Files 48 passed (48) · Tests 552 passed (552) · 0 failed · 0 skipped.** `tests/integration/default-template.integration.test.ts` **executed** — 1 test, 10368 ms — under `DEV_SEED_INTEGRATION_REQUIRED=1` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exported, so the module-scope guard would have thrown rather than skipped had the wiring been lost. A search of the log for that file reported as skipped returns **0** matches. Log `vt-B1-OLD-1.log` | **The green IS the finding, not the health.** Every assertion in this suite authenticates as **service_role, which bypasses RLS entirely**, and the 27 pure-I/O tests in `default.test.ts` assert nothing about visibility — so the suite is structurally incapable of noticing that the dataset it just wrote is unreadable by the voter app. Confirmed in the same session, immediately after this run, against the dataset the suite's own teardown-and-reseed had just produced: anon → 50 rows, key set `["alliance","organization"]`, **`candidate` absent**; service_role → 377 rows, `candidate` 327 (`diag-B1-postrun-1.json`). **This measurement is the evidence for M-11 — the reason the defect survived ~11 weeks under a green suite** |
| B2-OLD | `get_nominations()` as service_role — the privileged read the suite's assertions rest on | none — the untouched tree | REST · `POST {API_URL}/rest/v1/rpc/get_nominations` with the service_role key, empty JSON body → `diag-D2-svc-1.json` | `71f4104d9` — same tree and same session as `B1-OLD`; the payload row was taken at `6bd42c52d`, one commit earlier, on the same untouched tree | `n/a — REST` | **0** — `curl` exit 0, HTTP **200** | `candidate` **present and non-zero: 327**, across 377 rows, alongside `organization` 40 and `alliance` 10. Measured **twice in this session** and identical both times — at the Task 2 database state (`diag-D2-svc-1.json`; payload detail in row `D2-SVC-PRE`) and again after the suite's own teardown-and-reseed (`diag-B1-postrun-1.json`) | **What it proves is a blindness, not a health.** A service-role read is **structurally incapable** of observing this defect: it bypasses RLS, so it returns the candidates whether or not the anon policy would admit them, and it returns the same 327 before and after the suite runs. Every assertion the existing suite makes sits on this side of the boundary — which is precisely why `145-02`'s guard must be built on a second, anon client rather than on this one |
| D1-ANON-PRE | `get_nominations()` as anon — criterion-3 diagnostic, the voter-app path | none — the untouched tree | REST · `POST {API_URL}/rest/v1/rpc/get_nominations` with the anon key, empty JSON body → `diag-D1-anon-1.json` | `6bd42c52d` — the ledger-opening commit; tree byte-identical to `7e26bfd98` across `packages`, `apps`, `tests`, `.github` and the repo root | `n/a — REST` | **0** — `curl` exit 0, HTTP **200** | **50 rows.** Key set, verbatim from the payload: `["alliance","organization"]` — `alliance` 10 · `organization` 40. **The `candidate` key is ABSENT from the result set** — this is not `candidate: 0`; the entity type does not appear at all. Rows with `entity_type == null`: **0**, so the absence is not a mis-reduction of null-typed rows. Log `diag-D1-anon-1.json` | **The defect, observed at the RLS boundary.** The role the voter app actually uses cannot see the seeded candidates at all. Because `get_nominations` drops entity-less rows, the invisibility presents as a **missing key** — and downstream as a missing tab — rather than as an empty candidate list |
| D2-SVC-PRE | `get_nominations()` as service_role — criterion-3 diagnostic, **same session** as `D1-ANON-PRE` | none — the untouched tree | REST · the identical call with the service_role key → `diag-D2-svc-1.json` | `6bd42c52d` — same tree, same session, same database state as `D1-ANON-PRE` | `n/a — REST` | **0** — `curl` exit 0, HTTP **200** | **377 rows.** Key set, verbatim: `["alliance","candidate","organization"]` — `candidate` **327** · `organization` 40 · `alliance` 10. Side by side with `D1-ANON-PRE`: `candidate` **327 → absent**, `organization` **40 → 40**, `alliance` **10 → 10** | **The differential is the evidence, not either half.** One call, one session, one database state; only the role differs. Organizations and alliances survive the role change untouched and candidates vanish entirely — which localises the failure to the `candidates` anon policy rather than to the RPC, the data or the UI |
| D3-COL-PRE | `candidates` column state — criterion-3 diagnostic | none — the untouched tree | REST · `GET {API_URL}/rest/v1/candidates?select=external_id,published,terms_of_use_accepted&external_id=like.seed_*` as service_role → `diag-D3-col-1.json` | `6bd42c52d` — same tree and same database state as `D1-ANON-PRE` / `D2-SVC-PRE` | `n/a — REST` | **0** — `curl` exit 0, HTTP **200** | **327 `seed_`-prefixed rows.** `published = true`: **327** (all of them) · `published = false`: **0** · `terms_of_use_accepted IS NULL`: **327** (all of them) · non-null: **0**. Sampled row, verbatim: `{"external_id":"seed_cand_0026","published":true,"terms_of_use_accepted":null}` | **The root cause rests on measured column state, not on a reading of the override.** The seeded rows satisfy exactly **one** of the anon policy's **three** clauses. `published` is set on every row and `terms_of_use_accepted` on none — the signature of the `PUBLISHABLE_TABLES` auto-default, which stamps the first column and knows nothing about the other two |
| D4-CTRL-PRE | `accounts` role differential — the guard-of-the-guard control every later anon assertion depends on | none — the untouched tree | REST · `GET {API_URL}/rest/v1/accounts?select=id` twice, once anon and once service_role → `diag-D4-ctrl-1.json` | `6bd42c52d` — same tree and same session as the three rows above | `n/a — REST` | **0** — both `curl` invocations exit 0, HTTP **200** on both | anon → **0** rows, payload `[]` · service_role → **1** row, `00000000-0000-0000-0000-000000000001`. The two halves were issued back to back against the same table in the same session | **The control discriminates, so the anon probe above is not vacuous.** The credential labelled anon really is subject to RLS: it is denied a table the service_role key reads. Measured **pre-fix**, and the fix touches `candidates` only, so its invariance across the fix is a fact this phase can assert rather than an assumption `145-02`'s standing guard would have to inherit |
| P1-RED | the new anon `it` in `default-template.integration.test.ts` | pre-fix `candidatesOverride` — the real blind state, so no injection is needed | vitest · `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… DEV_SEED_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/dev-seed test:unit` → `vt-P1-RED-1.log` | `2e5262d4a` — the Task 1 commit. The run was issued on the working tree that was committed verbatim as `2e5262d4a` with no intervening edit; `git hash-object` of the test file equals `2e5262d4a`'s blob for that path (`62b9f0eac777bb1dcea7cd52d54efd3667dfaeae`). `packages/dev-seed/src` was untouched, so the template under test is the **pre-fix** one | `n/a — vitest` | **1** | **Test Files 1 failed / 47 passed (48) · Tests 1 failed / 552 passed (553).** The single failure is the new anon `it`, and its message names the assertion label verbatim: `AssertionError: anon-visible candidate nominations: expected 0 to be greater than 0`. **Both role controls PASSED in the same run** — they are the first two assertions in that `it` and the failure is at the later candidate assertion (`:521`), so execution necessarily evaluated and satisfied `anon accounts rowcount (role control)` and `service_role accounts rowcount (role control)`; a search of every failure-reporting line in the log for `(role control)` returns **0** matches. The `anon-visible organization nominations` assertion also passed — it is the only other assertion in the block and the block reported exactly one failure. Log `vt-P1-RED-1.log` | **RED (catch)** — and red in the declared shape: candidate assertion failing, role controls green, organizations green. The differential is what makes it diagnostic rather than a blanket failure. This is D-06 pair 1's first half, **unrecoverable once `145-04` lands the fix** |
| P1-GREEN | the same anon `it` | none — the fixed tree | vitest · `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… DEV_SEED_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/dev-seed test:unit` → `vt-P1-GREEN-1.log`, against the database `yarn db:reset-with-data` had just rebuilt from the **fixed** template (`seed-fix-1.log`, exit 0, 752 rows across 14 tables, 327 candidates) | `eab07013f` — the `145-04` Task 1 commit. The run was issued on the working tree that was committed verbatim as `eab07013f` with no intervening edit; `git hash-object` of `src/templates/defaults/candidates-override.ts` equals that commit's blob (`c286c684edde37912498e575d67c6508ef03c902`), and `git status --porcelain -- packages apps tests .github package.json turbo.json` printed nothing after the commit. **The instrument is byte-identical to `P1-RED`'s:** `git rev-parse` of `tests/integration/default-template.integration.test.ts` returns `62b9f0eac777bb1dcea7cd52d54efd3667dfaeae` at **both** `2e5262d4a` (the `P1-RED` HEAD) and `eab07013f`, and `git diff 2e5262d4a..HEAD` over that path is empty | `n/a — vitest` | **0** | **Test Files 48 passed (48) · Tests 555 passed (555) · 0 failed · 0 skipped.** `the seeded dataset is readable by the ANON client — the voter app path (TMPL-03)` **PASSED** (32 ms, named verbatim in the corroborating verbose run `vt-P1-GREEN-verbose-1.log`); `tests/integration/default-template.integration.test.ts` reports `✓ … (2 tests) 10995ms`, so both its `it`s executed and a search of the log for that file reported as skipped returns **0** matches. **Both role controls passed in the same run** — `anon accounts rowcount (role control)` and `service_role accounts rowcount (role control)` are the first two assertions inside that `it` and the whole `it` is reported green with zero failures anywhere in the run, so both were evaluated and held; the `anon-visible organization nominations` assertion passed in the same block. Logs `vt-P1-GREEN-1.log` (primary) and `vt-P1-GREEN-verbose-1.log` (same tree, same database, per-test names) | **GREEN** — **D-06 pair 1 is closed.** The assertion observed failing at `2e5262d4a` against the pre-fix override (`expected 0 to be greater than 0`) passes at `eab07013f` against the fixed one, with the instrument proven byte-identical across the two halves by blob hash, not by recollection. Nothing in `packages/dev-seed/tests/` was touched between the halves, so "this check catches this defect" is a two-directional measurement rather than a claim about the future |
| U1-RED | `Test 28` in `default.test.ts` — every emitted candidate row carries `terms_of_use_accepted` | pre-fix `candidatesOverride` — the real blind state | vitest · `yarn workspace @openvaa/dev-seed test:unit` at the pre-fix tree → `vt-U1-RED-1.log` | `418eb1353` — the Task 2 commit. Run issued on the working tree committed verbatim as `418eb1353`; `git hash-object` of `tests/templates/default.test.ts` equals that commit's blob (`1a2db5e2d5f2d8b448c97738969efe751d05c021`). `packages/dev-seed/src` untouched — the **pre-fix** override | `n/a — vitest` | **1** | **Test Files 2 failed / 46 passed (48) · Tests 2 failed / 553 passed (555).** `Test 28: every emitted candidate row carries terms_of_use_accepted (anon-RLS precondition)` **FAILED**, and the observed value is the key's absence, not a wrong value: `AssertionError: expected undefined to be '2025-01-01T00:00:00.000Z'` — Received `undefined` at `default.test.ts:197`. It fails on the **first** of the 327 emitted rows, i.e. the override emits no such key at all. The run's second failure is the `P1-RED` anon guard, expected and recorded separately. Log `vt-U1-RED-1.log` | **RED (catch)** — the fast pure-I/O tier catches the same defect with **no live database**, one instrument and one order of magnitude cheaper than the integration guard. It is an early-warning tier, not a substitute: it asserts what the template emits, never what `anon` can read |
| U1-GREEN | `Test 28` | none — the fixed tree | vitest · the same command at the fixed tree, **same run** as `P1-GREEN` → `vt-P1-GREEN-1.log` | `eab07013f` — the `145-04` Task 1 commit; same run, same tree and same working-tree-identity proof as `P1-GREEN`. **The instrument is byte-identical to `U1-RED`'s:** `git rev-parse` of `tests/templates/default.test.ts` returns `1a2db5e2d5f2d8b448c97738969efe751d05c021` at **both** `418eb1353` (the `U1-RED` HEAD) and `eab07013f`, and `git diff 418eb1353..HEAD` over the whole of `packages/dev-seed/tests` is empty | `n/a — vitest` | **0** | **Test Files 48 passed (48) · Tests 555 passed (555) · 0 failed · 0 skipped.** `Test 28: every emitted candidate row carries terms_of_use_accepted (anon-RLS precondition)` **PASSED** (3 ms, named verbatim in `vt-P1-GREEN-verbose-1.log`); `tests/templates/default.test.ts` reports `✓ … (29 tests)`, the same 29 it carried when `Test 28` failed. The assertion is over the **literal**, so the pass means all 327 emitted rows carry exactly `'2025-01-01T00:00:00.000Z'`, not merely a defined value. Logs `vt-P1-GREEN-1.log`, `vt-P1-GREEN-verbose-1.log` | **GREEN** — the fast pure-I/O tier is now a working early-warning layer: it discriminates the pre-fix override from the fixed one with **no live database**, in 3 ms, against the same file it failed in. Paired with `U1-RED` this is the cheap tier's own two-directional proof, independent of `P1`'s |
| U2 | `Test 29` in `default.test.ts`, cross-template consistency — ⚠ **must-NOT-fire** row | none, in either half | vitest · the same command in both halves → `vt-U1-RED-1.log` (`145-02` half) and `vt-P1-GREEN-1.log` + `vt-P1-GREEN-verbose-1.log` (`145-04` half) | **Both halves recorded.** `418eb1353` — the `145-02` half; same run and same tree as `U1-RED`. `eab07013f` — the `145-04` half; same run and same tree as `P1-GREEN` / `U1-GREEN`. The assertion file is byte-identical at both HEADs (`1a2db5e2d5f2d8b448c97738969efe751d05c021`), and so is `src/templates/e2e/base.ts`, the data this row reads: `git diff 418eb1353..eab07013f -- packages/dev-seed/src/templates/e2e` is empty | `n/a — vitest` | **1** at `418eb1353` — the run's exit, driven by `U1-RED` and `P1-RED`; `Test 29` itself did not contribute to it. **0** at `eab07013f` — the whole suite green | **`Test 29: e2e/base candidate rows use the same terms_of_use_accepted literal (cross-template consistency)` PASSED** (0 ms), reported with `✓` in the same run in which its file-mate `Test 28` failed — so the two are discriminated by the same instrument in one invocation. A search of every failure-reporting line in the log for `Test 29` returns **0** matches. It filters `e2e/base`'s candidate rows to those carrying the key before asserting, so `ca-aa-hidden` and `ca-aa-unregistered` — the two deliberate in-repo omissions — keep it green rather than being "fixed" away. Log `vt-U1-RED-1.log`. **Post-fix half (`145-04`, HEAD `eab07013f`): `Test 29` PASSED again** (0 ms, named verbatim in `vt-P1-GREEN-verbose-1.log`), this time in a run where its file-mate `Test 28` also passed — so the same instrument reports the same verdict for this row while the row beside it flipped RED → GREEN. Logs `vt-P1-GREEN-1.log`, `vt-P1-GREEN-verbose-1.log` | **GREEN at both HEADs — must-NOT-fire, HELD.** The verdict did not move across the fix, which is the whole point: this row constrains `e2e/base`, which this phase does not change, so a colour change in either direction would have meant the assertion is coupled to the fix rather than to the cross-template literal it exists to pin. Its invariance is also the runtime half of the `e2e/base`-preservation check — a global auto-default would have stamped the two deliberately-unaccepted rows and this row would have had to move |
| P2-RED | the new anon `it` — proves the guard asserts anon visibility, not one column's presence | `published: false` injected **alongside** `terms_of_use_accepted` in `candidatesOverride`'s row literal, then re-seeded | seed CLI + vitest · `yarn db:reset-with-data` → `seed-P2-inject-1.log`, then `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… DEV_SEED_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/dev-seed test:unit` → `vt-P2-RED-1.log`. The injected diff is quoted verbatim in § Pair 2 — the injected diff | `9ce618f07` — the `145-05` Task 1 commit. **Restore target for this injection, taken with `git hash-object` on `packages/dev-seed/src/templates/defaults/candidates-override.ts` BEFORE the file was touched: `4cb334771eaca37df20721222fbb8021150b8048`**, equal to `git rev-parse 9ce618f07:<that path>` and recorded here rather than read from § Restoration blob hashes, whose creation-time value for this path (`0fbac2543e7e4784e73b2e568d6df505f445242e`) predates `145-04`'s fix and would revert it (`T-145-20`). `git status --porcelain -- packages apps tests .github` printed nothing immediately before the injection. **The guard is byte-identical to the one `P1-RED` and `P1-GREEN` measured:** `git hash-object packages/dev-seed/tests/integration/default-template.integration.test.ts` = `62b9f0eac777bb1dcea7cd52d54efd3667dfaeae`, the same blob `git rev-parse` returns at `2e5262d4a` and `eab07013f`. Not one assertion, label, client or control moved between the four halves | `n/a — vitest` | **1** | **Test Files 1 failed / 48 passed (49) · Tests 1 failed / 557 passed (558).** The single failure is the anon `it`, and its message names the assertion label verbatim: `AssertionError: anon-visible candidate nominations: expected 0 to be greater than 0`, reported at `default-template.integration.test.ts:521:80`. **Both role controls PASSED in the same run** — `anon accounts rowcount (role control)` is at `:490` and `service_role accounts rowcount (role control)` at `:492`, both strictly earlier than the failing candidate assertion at `:521`, so execution necessarily evaluated and satisfied both before reaching it; a search of every failure-reporting line in the log for `(role control)` returns **0** matches, as does a search of the whole log. **The discriminating fact: `Test 28` — `every emitted candidate row carries terms_of_use_accepted (anon-RLS precondition)` — PASSED in this very run** (exactly one test failed out of 558, and it was the anon `it`), so the column the guard was chosen for is demonstrably present while the guard is red. Corroborated directly against the injected database in the same session: **service_role reads 328 candidate rows, of which the 327 `seed_`-prefixed ones all carry `terms_of_use_accepted` and all carry `published = false`; the anon client reads 0** (the 328th row is `apps/supabase/seed.sql`'s own `external_id: null` row, untouched by the injection). Seed log `seed-P2-inject-1.log` (exit 0, 752 rows / 14 tables, 327 candidates), run log `vt-P2-RED-1.log` | **RED (catch)** — **and this is the row that makes pair 1 mean something.** With `terms_of_use_accepted` present and only anon *visibility* removed, the guard still fails, and fails on the candidate assertion with both role controls green. So what it asserts is the **RLS boundary**, not one column's presence: a future regression that hides candidates by any other route — a policy change, a `published` flip, a role misconfiguration — reds this guard too. Without this half, D-06 pair 1 and `145-04`'s fix would be the same statement written twice |
| P2-GREEN | the same anon `it` | injection reverted, restore proven against **this injection's own restore target** recorded in `P2-RED` — **not** against § Restoration blob hashes, whose creation-time value for this path predates `145-04` | seed CLI + vitest · `git checkout -- packages/dev-seed/src/templates/defaults/candidates-override.ts`, then `yarn db:reset-with-data` → `seed-P2-restore-1.log`, then the same unchanged guard invocation → `vt-P2-GREEN-1.log` | `9ce618f07` — the same commit as `P2-RED`. No commit was made while the injection was live, so both halves of pair 2 sit at one HEAD and the only thing that differed between them is the uncommitted row literal quoted in § Pair 2 — the injected diff | `n/a — vitest` | **0** | **Test Files 49 passed (49) · Tests 558 passed (558) · 0 failed · 0 skipped**, with `tests/integration/default-template.integration.test.ts` reported as `✓ … (2 tests) 10429ms` — so both its `it`s executed rather than skipping under `DEV_SEED_INTEGRATION_REQUIRED=1`. **The three restore proofs, all taken before the re-seed:** (1) `git diff --exit-code -- packages/dev-seed/src/templates/defaults/candidates-override.ts` → **exit 0**; (2) `git hash-object` on that path → **`4cb334771eaca37df20721222fbb8021150b8048`**, byte-equal to the restore target `P2-RED` recorded before the file was touched; (3) `git status --porcelain -- packages apps tests .github` → **printed nothing**. The restored source contains `terms_of_use_accepted` and **0** occurrences of the injected published-false key. The database was re-seeded from the restored template (`seed-P2-restore-1.log`, exit 0, 752 rows / 14 tables, 327 candidates) and re-measured by role: **service_role reads 327 published candidates and anon reads 327** — against the injected run's `327 unpublished / anon 0`. Log `vt-P2-GREEN-1.log` | **GREEN — the restore proof, not a second catch.** The injection left no trace: the blob is back to the value taken **before** it existed, the tree is clean, the database is re-seeded correct, and the diff that produced the red is recorded verbatim in this ledger rather than as a committed fixture, so the measurement is reproducible without a permanently-broken template in the tree. **D-06 pair 2 is closed**, and with it the claim that the `145-02` guard discriminates anon visibility from column presence rests on two measured directions rather than on one |
| A1-RED | Playwright probe `entity tabs include candidates @probe` | pre-fix template seeded into the live database | playwright · `_probes` project, `defaultTemplateResults.probe.spec.ts` — `GSD_145_HALF=before yarn test:e2e:probes defaultTemplateResults` → `pw-A-before-1.log` | `49954257e` — the Task 1 commit. The run was issued on the working tree committed verbatim as `49954257e` with no intervening edit; `git hash-object` of the probe file as run equals that commit's blob for the path (`7b3f5b24eb3509a8a85399117a9825fa1f1276b6`). `packages/dev-seed/src` was untouched and the database held `yarn db:reset-with-data`'s output from this same session (`seed-reset-145-03-1.log`: 327 candidates · 377 nominations · 8 organizations · 2 alliances), so the template under test is the **pre-fix** one. A later commit-only-comment change (`3d386050b`) corrected a docstring claim about which constituency the walk lands on; it altered no assertion, and the blob measured here is the one named above | `n/a — playwright` | **1** | **1 failed / 1 passed (1.4m).** The failure is `entity tabs include candidates @probe`. **Observed tab set, verbatim from the run log: `["Parties","Alliances"]`** — two tabs, and **no candidates tab at all**. The assertion is the shared `expectEntityTabs(['cands', 'orgs', 'alliances'])` fixture method, which fails at its count clause before reaching the per-tab name clauses: `Expected: 3` · `Received: 2`, with `9 × locator resolved to 2 elements` over `getByTestId('voter-results-entity-tabs').getByRole('tab')`. The served application was proven to be this checkout in the same invocation — `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)`, one success line, zero failure lines. Screenshot `${TMPDIR}/gsd-145/app-before-tabs.png` (105,908 bytes) shows the tab bar reading `Parties | Alliances` above the header `8 parties in constituency Pirkanmaa` — Pirkanmaa being D-08's nominated constituency, reached by the shared journey fixture's own first-option pick. Log `pw-A-before-1.log` | **RED (catch)** — criterion 1's recorded absence, produced by an exit code and a screenshot rather than by a recollection. It is also the **app-level mirror of `D1-ANON-PRE`**: the anon RPC's key set `["alliance","organization"]` reappears at the UI as exactly two tabs, because the tab set is `Object.keys(matches[electionId])` and the nomination tree drops a whole leaf when an entity type has zero nominations — so an RLS-invisible entity type presents as a MISSING tab, never as an empty list. This half is **unrecoverable once `145-04` lands the fix**; `145-05` owns `A1-GREEN` |
| A1-GREEN | the same probe test | fixed template seeded into the live database | playwright · `_probes` project, the same `defaultTemplateResults.probe.spec.ts` — `GSD_145_HALF=after yarn test:e2e:probes defaultTemplateResults` → `pw-A-after-1.log`, against the database `yarn db:reset-with-data` had just rebuilt from the **fixed** template (`seed-after-1.log`, exit 0, 752 rows across 14 tables — 327 candidates · 377 nominations · 8 organizations · 2 alliances · 5 constituencies · 26 questions · 327 portraits) | `0d62314f0` — the `145-04.1` closing commit. `git status --porcelain -- packages apps tests .github` printed nothing before the run and after it. **Instrument identity, stated exactly rather than rounded:** `git hash-object` of the probe file as run is `30d2b00c9d2049f5fbd1acfc650d25c8a3c35b99`; `A1-RED` ran `7b3f5b24eb3509a8a85399117a9825fa1f1276b6`. The two differ **only** by the comment-only docstring correction `3d386050b` that `145-03` landed after its own measurement — `git diff 49954257e..HEAD` over that path has **0** changed non-comment lines, and the current blob has been unchanged since `3d386050b`. `tests/playwright.config.ts` is byte-identical across both halves (`git diff 49954257e..HEAD` over it is empty). No assertion, fixture, selector, timeout or tag moved between the halves; only `GSD_145_HALF` differed, and it differs through the environment | `n/a — playwright` | **0** | **2 passed (1.4m) · 0 failed.** `entity tabs include candidates @probe` **PASSED**. **Observed tab set, verbatim from the run log: `["Candidates","Parties","Alliances"]`** — three tabs, candidates first, against `A1-RED`'s two-tab `["Parties","Alliances"]`. The shared `expectEntityTabs(['cands', 'orgs', 'alliances'])` fixture method now satisfies its count clause (`3` vs `A1-RED`'s `Expected: 3 · Received: 2`) and every per-tab name clause. **Observed candidate card count: 48** (`[145-03] observed candidate card count: 48`) — read after `selectEntityTab('cands')`, a tab that did not exist at all in the before half. A search of the whole log for `✘`, `✕` or ` failed` returns **0** matches. The served application was proven to be this checkout in the same invocation — `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)`, one success line, zero failure lines. Screenshot `${TMPDIR}/gsd-145/app-after-tabs.png` (925,576 bytes) shows the tab bar reading `Candidates \| Parties \| Alliances` with **Candidates** selected, above the header `48 candidates in constituency Pirkanmaa` and 48 candidate cards each carrying a match percentage (63% down to 39%) — 48 being D-08's nominated count for Pirkanmaa, reached by the shared journey fixture's own first-option pick rather than by steering. Log `pw-A-after-1.log` | **GREEN** — **criterion 1 is closed in the running app**, by an exit code and a screenshot rather than by a recollection, and the app-level mirror of `P1-GREEN`: the anon RPC key set the before half lacked (`D1-ANON-PRE`'s `["alliance","organization"]`) reappears at the UI as the third tab. ⚠ **This pair straddles TWO behaviour-changing commits, not one** — `eab07013f` (`145-04`, the anon-RLS `terms_of_use_accepted` fix) **and** `9f12a6c94` (`145-04.1`, the number-range emitter fix). The first restored anon visibility; without the second the voter app threw `normalizeCoordinate: Value is out of range` while normalizing candidate answers and this half **VOIDED twice** (`pw-A-after-void-1.log`, `pw-A-after-void-2.log` — 2 failed, both inside the journey walk at `followLinkWhenHrefResolved`, neither clause ever evaluated). A VOID is not a RED and neither log is a measurement; both are kept rather than tidied away. **Do not read this row as evidence that one key did all the work** — `145-08` carries that correction |
| A2-PRE | Playwright probe `parties list is non-empty @probe` — ⚠ **must-NOT-fire** row (D-01: parties already pass at phase start) | pre-fix template seeded | playwright · the same probe invocation, the same run → `pw-A-before-1.log` | `49954257e` — the same commit, the same run, the same session and the same database state as `A1-RED`; blob identity as recorded there | `n/a — playwright` | **1** — the run's exit, driven entirely by `A1-RED`; this test itself passed and contributed nothing to it | **`parties list is non-empty @probe` PASSED.** Observed organization card count, verbatim from the run log: **8** (`[145-03] observed organization card count: 8`). The count is scoped to the organizations section by the shared fixture — it is read after `selectEntityTab('orgs')`, which hard-asserts the section visible — and the assertion is the web-first `expect(cards).not.toHaveCount(0)`. A search of every failure-reporting line in the log for `parties list is non-empty` returns **0** matches. Screenshot `${TMPDIR}/gsd-145/app-before-parties.png` (130,672 bytes), whose header reads `8 parties in constituency Pirkanmaa` above eight named party cards. Log `pw-A-before-1.log` | **GREEN — must-NOT-fire**, and this row is the point. It is the **in-phase measurement disproving the roadmap's _(currently 0)_ parenthetical for parties** (D-01): eight party cards render on the **pre-fix** template, so symptom 1 does not reproduce and the recorded starting state is parties **already passing**, candidates tab failing. Criterion 1 keeps the clause as an assertion; only its recorded polarity changes. **`145-08` carries the record correction** to ROADMAP.md criterion 1, `REQUIREMENTS.md:70` (TMPL-03) and the still-open todo `2026-06-06-fix-broken-default-seed-template.md` (filed under `.planning/todos/`; the literal directory name is spelled out in `145-CONTEXT.md` D-01 rather than here, because this register reserves that lower-case word for its own unfilled cells). ⚠ `145-05` owns `A2-POST` and must observe it GREEN again on the fixed tree — a colour change in either direction would mean the assertion is coupled to the fix rather than to the parties surface it pins |
| A2-POST | the same probe test — ⚠ **must-NOT-fire** row | fixed template seeded | playwright · the same probe invocation, the same run → `pw-A-after-1.log` | `0d62314f0` — the same commit, the same run, the same session and the same database state as `A1-GREEN`; blob identity as recorded there | `n/a — playwright` | **0** — the run's exit; both tests in it passed, so unlike `A2-PRE` this cell is not carried by a sibling failure | **`parties list is non-empty @probe` PASSED.** **Observed organization card count, verbatim from the run log: 8** (`[145-03] observed organization card count: 8`) — **the identical count `A2-PRE` observed on the pre-fix template**. The count is scoped to the organizations section by the shared fixture — read after `selectEntityTab('orgs')`, which hard-asserts the section visible — and the assertion is the web-first `expect(cards).not.toHaveCount(0)`. A search of every failure-reporting line in the log for `parties list is non-empty` returns **0** matches. Screenshot `${TMPDIR}/gsd-145/app-after-parties.png` (194,293 bytes). Log `pw-A-after-1.log` | **GREEN — must-NOT-fire, and it held.** The count did not move in either direction (8 → 8) across **both** behaviour-changing commits (`eab07013f` and `9f12a6c94`), so the assertion is pinned to the parties surface it names rather than coupled to the fix — which is the only thing a must-NOT-fire row can prove and the reason it is measured on both sides instead of asserted once. Taken with `A2-PRE`, this closes criterion 1's first clause as a **two-sided** measurement: parties rendered before the fix and render after it, so the roadmap's _(currently 0)_ parenthetical is disproved by observation at both HEADs rather than at one |
| S1 | `organizations` / `constituencies` row counts by `external_id` idiom | old idiom seeded on a freshly reset database | seed CLI + REST · `yarn db:reset-with-data`, then counts — owned by `145-07` | `8b2b052f9` — the `145-06` closing commit, with a **transient, never-committed** checkout of exactly two files from `ef1834410` live during the seed. Injected blobs: `default.ts` = `0c1eb840586979501841939873ef2dd6fb4968d0`, `alliances-override.ts` = `2ac22cd892b4787d3a40ca1394ef6c4d687dfc23`. **This injection's own restore targets, `git hash-object`-recorded at `8b2b052f9` BEFORE either file was touched:** `default.ts` = `054e32824a75d4afa4a7c98cdb0a20e929c2eb9c`, `alliances-override.ts` = `041912ae8c98ac60f0ae4dd659b002c7f8531524` — **not** § Restoration blob hashes' creation-time values, which `3bf417c83` has since superseded. `candidates-override.ts` was **not** checked out from any commit, and its acceptance-timestamp literal was confirmed present before and after the loop. `git status --porcelain -- packages apps tests .github` printed nothing immediately before the injection | `n/a — seed CLI + REST` — the seed and teardown CLIs are `tsx`-executed straight from source (`packages/dev-seed/package.json`: `"seed": "tsx src/cli/seed.ts"`), so no turbo cache stands between the checked-out blob and the run, and the counts are PostgREST reads | **0** — `yarn db:reset` exit **0** (`reset-S1-1.log`, `Finished supabase db reset on branch main`), then `yarn db:seed:default` exit **0** (`seed-S1-old-1.log`, `Total 752` rows across 14 tables, 327 portraits uploaded). Both count queries returned HTTP **200** (`count-S1-1.json`) | **8 organizations and 5 constituencies at the `seed_` prefix — all 8 and all 5 in the OLD idiom, 0 new, 0 unclassified.** Verbatim from the query: `seed_party_blue`, `seed_party_coast`, `seed_party_green`, `seed_party_people`, `seed_party_red`, `seed_party_rural`, `seed_party_social`, `seed_party_values`; `seed_c_01` … `seed_c_05` | The old idiom's baseline, established on a freshly reset database and taken by query rather than inferred from the template's declared sizes. Matches the projection (8 / 5) stated in advance in `145-07-PLAN.md` § polarity |
| S2 | the same counts | renamed template seeded with **no** intervening reset — the strand made visible | seed CLI + REST · `yarn db:seed --template default`, then counts — owned by `145-07` | `8b2b052f9`, **clean tree** — the injection was reverted with `git checkout HEAD -- <the two paths>` BEFORE this seed ran, and both restored blobs were re-verified equal to the targets recorded in `S1` (`054e32824a75d4afa4a7c98cdb0a20e929c2eb9c` / `041912ae8c98ac60f0ae4dd659b002c7f8531524`); `git status --porcelain -- packages apps tests .github` printed nothing. ⚠ **No `yarn db:reset` ran between `S1` and here** — the second seed deliberately landed on the database `S1` left behind, which is the whole measurement | `n/a — seed CLI + REST` — the seed and teardown CLIs are `tsx`-executed straight from source (`packages/dev-seed/package.json`: `"seed": "tsx src/cli/seed.ts"`), so no turbo cache stands between the checked-out blob and the run, and the counts are PostgREST reads | **0** — `yarn db:seed:default` exit **0** (`seed-S2-new-1.log`, `Total 752` rows created, 327 portraits). Both count queries returned HTTP **200** (`count-S2-1.json`) | **16 organizations (8 OLD + 8 new) and 10 constituencies (5 OLD + 5 new), 0 unclassified** — strictly greater than `S1` in both tables, and the per-idiom split shows that the eight `seed_party_*` and five `seed_c_0*` rows **survived** rather than being matched and replaced. New-idiom rows, verbatim: `seed_org_blue` … `seed_org_values`; `seed_con_01` … `seed_con_05` | ⚠ **The strand, produced on purpose and made visible.** The renamed template did not upsert onto the old rows, because `external_id` is the upsert key and the rename changed it. Matches the projection (16 / 10). Had this read 8 and 5, the identifiers would not actually have changed and the rename would have had to be re-derived |
| S3 | the same counts | `yarn db:seed:teardown` over the strand | seed CLI + REST · teardown, then counts — owned by `145-07` | `8b2b052f9`, clean tree — same session, same database, immediately after `S2`; no reset, no re-seed and no file touched between the two rows | `n/a — seed CLI + REST` — the seed and teardown CLIs are `tsx`-executed straight from source (`packages/dev-seed/package.json`: `"seed": "tsx src/cli/seed.ts"`), so no turbo cache stands between the checked-out blob and the run, and the counts are PostgREST reads | **0** — `yarn db:seed:teardown` exit **0**. Verbatim from `teardown-S3-1.log`: `Teardown complete: 814 rows deleted, 327 storage objects removed.` / `Prefix: seed_`. Both count queries returned HTTP **200** (`count-S3-1.json`) | **0 old-idiom rows AND 0 new-idiom rows, in BOTH tables.** `organizations` total at the `seed_` prefix: **0**. `constituencies` total at the `seed_` prefix: **0**. Unclassified: **0**. The assertion this row carries is that conjunction, not the drop in the total | ✅ **The one durability concern D-05 raised is discharged by measurement.** `runTeardown` filters ten tables on `external_id LIKE 'seed_%'` — read from source: `ALLOWED_TEARDOWN_TABLES` plus `collections[table] = { prefix }`, default prefix `seed_` (`packages/dev-seed/src/cli/teardown.ts`) — and the rename changed only the base names beneath that prefix. Teardown's reach is therefore **independent of the identifier idiom**, so the rename cannot strand rows permanently |
| S4 | the same counts | `yarn db:reset-with-data` after the rename | seed CLI + REST · reset-with-data, then counts — owned by `145-07` | `1c7bdfa6d` — `145-07` Task 1's commit; `git status --porcelain -- packages apps tests .github` printed nothing before the run, and no file was checked out from any commit at any point in this task | `n/a — seed CLI + REST` — `db:reset-with-data` is `db:reset && db:seed:default`, both `tsx`/Supabase-CLI paths with no turbo cache between them and the run; the counts are PostgREST reads | **0** — `yarn db:reset-with-data` exit **0** (`seed-S4-reset-1.log`, `Finished supabase db reset on branch main` then `Total 752` rows across 14 tables, 327 portraits). Both count queries returned HTTP **200** (`count-S4-1.json`) | **8 organizations and 5 constituencies at the `seed_` prefix — 0 in the OLD idiom, all 8 and all 5 in the new idiom, 0 unclassified.** The assertion is two-sided and both sides hold: the totals equal `S1`'s (8 / 5), **and** the old-idiom count is zero. New-idiom rows verbatim: `seed_org_blue`, `seed_org_coast`, `seed_org_green`, `seed_org_people`, `seed_org_red`, `seed_org_rural`, `seed_org_social`, `seed_org_values`; `seed_con_01` … `seed_con_05` | ✅ The end state a developer actually gets: declared sizes, one idiom, **no residue of the old one anywhere**. Matches the projection (8 / 5, all new). The app-level probe re-run against this exact seed passed both clauses — `pw-A-rename-1.log`, exit **0**, tab set `["Candidates","Parties","Alliances"]`, 48 candidate cards, 8 party cards — recorded beneath § Criterion 1 — before and after |
| T1 | the renamed tree's type integrity — zero cast escapes under Phase 144's strict row types | none — the renamed tree | turbo · `TURBO_FORCE=true npx turbo run typecheck` — owned by `145-06` | `3bf417c83` — the `145-06` Task 1 rename commit. `git status --porcelain -- packages apps tests .github` printed nothing before the run | **`@openvaa/dev-seed:typecheck: cache bypass, force executing ded5ac3d2d480aca`**, verbatim from `tc-T1-1.log`, with `Cached: 0 cached, 7 total` and `Tasks: 7 successful, 7 total` on the summary lines. A forced execution, not a replay — the exit below is a claim about THIS tree | **0** | **Four counts, each taken from `packages/dev-seed/src/templates/default.ts` at this HEAD after the rename.** (1) `grep -nwc 'any'` = **0** — the word does not occur in the file at all, so the negative grep is a live sentinel rather than a count a future `any` type could hide inside English prose. It read **2** before this plan, both of them ordinary English (`and any other consumer`, `so any value we write here`) in comments that pre-date phase 145; they were reworded rather than tolerated, and no type annotation changed. (2) `as unknown as` = **0**. (3) `@ts-ignore` / `@ts-expect-error` = **0**. (4) The renamed identifiers are typed by Phase 144's strict per-collection row types with no cast at their site: 5 × `external_id: 'con_0…'` and 8 × `external_id: 'org_…'` in the two `fixed` arrays, each row still checked against its collection's row type. The rename therefore passes the strict types on its own literals rather than around them | **PASS.** The renamed tree typechecks with the turbo cache forced to execute, and carries no cast escape. Corroborated at the same HEAD by the package suite: `vt-rename-1.log`, exit **0**, 49 files / 558 tests, 0 failed, **0 skipped**, the integration file executing its 2 tests against a database rebuilt from the renamed template (`seed-rename-1.log`, exit 0, 752 rows — 8 organizations, 5 constituencies, 2 alliances, 377 nominations, unchanged from the pre-rename seed). The suite's relational assertions on alliance and organization nominations — 30 org-noms with an alliance parent and 10 standalone, wired through `ALLIANCE_MEMBERSHIP`, the one lookup in the package that keys by identifier VALUE — are the clause that would have gone red on a half-finished rename, and they are green |
| CI1 | the `ANON_KEY` export step of the `dev-seed-integration` job — ⚠ **deferred — runner half unobserved** | none — source assertion only | source read · the `Export Supabase connection env` step in `.github/workflows/main.yaml` — owned by `145-02` | `2e5262d4a` — the Task 1 commit, which is where the export lands | `n/a — source assertion` | `n/a` | **Three source facts, each read from the file at this HEAD and each inside the `dev-seed-integration` job's `Export Supabase connection env` step.** (1) The variable is **extracted** from the already-captured `STATUS` with the same shape the two existing variables use: `ANON_KEY="$(printf '%s\n' "$STATUS" · grep '^ANON_KEY=' · cut -d= -f2- · tr -d '\"')"` at `main.yaml:227`. (2) The **`test -n` guard is present with its error string**: `test -n "$ANON_KEY" || { echo "::error::ANON_KEY missing from supabase status"; exit 1; }` at `:230`, beside the two pre-existing guards — exactly one occurrence of that error text in the file. (3) The value is **appended to the job environment**: `echo "SUPABASE_ANON_KEY=$ANON_KEY" >> "$GITHUB_ENV"` at `:233`. No `echo` writes the value to stdout and no `set -x` was added, so the credential does not reach a job log. The job also retains **no `paths-filter`** — 0 occurrences inside its block, and the file's whole-file count is unchanged from its pre-change value of 2 (one real use in `supabase-tests`, one in this job's prose rationale saying there is deliberately none here) | ⚠ **Source assertion confirmed; the RUNNER HALF IS UNOBSERVED AND DEFERRED.** No CI run has executed this step. CI triggers only on push/PR to `main`, and this branch is far ahead of a stale `origin/main` — the same condition Phase 137 carried for its criterion 3. **A grep is not a run**, so this row carries no confirmed pass. It is discharged by this branch's first pull request to `main`; see `## Residue` |
| G1 | the milestone's standing gate 1 — unit | none — the closing tree | turbo · `TURBO_FORCE=true yarn test:unit` — owned by `145-08`, run with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` and `DEV_SEED_INTEGRATION_REQUIRED=1` exported from `supabase status -o env`, so the live-Supabase block **executes** rather than skipping → `g1-unit.log` | `8372d0dff` — the shared closing HEAD. Recorded once before gate 1 and re-read after gate 7, identical at both ends, with `git status --porcelain -- packages apps tests .github` printing nothing at both ends — so the seven rows are one claim about one tree rather than seven claims about seven | **`Cached: 0 cached, 25 total`** — all **25** tasks report `cache bypass, force executing`, **zero** replays. `turbo.json` gives `test:unit` `"cache": false`, and the environment prefix forces its `build` dependencies too | **0** | **`Tasks: 25 successful, 25 total`. 11 workspaces reported tests: 173 test files, 1,821 tests, 0 failed, 0 skipped.** Per workspace — `dev-seed` 49 files / **558** tests · `frontend` 54 / 814 · `data` 47 / 244 · `matching` 5 / 43 · `argument-condensation` 6 / 30 · `llm` 2 / 39 · `app-shared` 3 / 21 · `core` 3 / 8 · `filters` 1 / 22 · `question-info` 2 / 22 · `supabase` 1 / 20. **The live-Supabase block executed rather than skipping:** the log reports `✓ tests/integration/default-template.integration.test.ts (2 tests)`, and a search for that file reported as skipped returns **0** matches — so this phase's own anon guard ran *inside* its own gate instead of silently dropping out of it. Log `g1-unit.log` | **PASS.** The repository's whole unit tier is green at the closing tree, with this phase's anon guard among the tests that executed. ⚠ **This gate is why the closing HEAD is not the one `145-07` left behind:** its first attempt went red, and the red was diagnosed rather than retried — see § Gates |
| G2 | the milestone's standing gate 2 — lint | none — the closing tree | turbo · `TURBO_FORCE=true yarn lint:check` — owned by `145-08` → `g2-lint.log` | `8372d0dff` — the same shared closing HEAD as every other gate row | **`Cached: 0 cached, 11 total`** for the `lint` pass and **`Cached: 0 cached, 22 total`** for the `typecheck` pass the script chains after it — **33** forced verdict lines in total, **zero** cache replays. The **environment prefix** is deliberate and the trailing-argument form is forbidden phase-wide: `turbo.json` gives `lint` no `"cache": false`, so an unforced green would be a claim about a *previous* tree, and yarn appends a trailing `--force` past the `&&` chain where it silently does nothing | **0** | **`Tasks: 11 successful, 11 total`** (lint) then **`Tasks: 22 successful, 22 total`** (typecheck). **0 errors** and **20 warnings**, verbatim across the four reporting blocks: `2 problems (0 errors, 2 warnings)` · `15 problems (0 errors, 15 warnings)` · `1 problem (0 errors, 1 warning)` · `2 problems (0 errors, 2 warnings)`. All twenty are pre-existing — the same count Phase 144's gate 2 recorded — and none is in a file this phase wrote. Log `g2-lint.log` | **PASS.** Zero lint errors across the workspace `lint` tasks, the root `tests` tree and both typecheck passes, with every verdict forced rather than replayed |
| G3 | the milestone's standing gate 3 — format | none — the closing tree | prettier · `yarn format:check` — owned by `145-08` → `g3-format.log` | `8372d0dff` — the same shared closing HEAD as every other gate row | `n/a — prettier`. The script prefixes a `turbo run build --filter=@openvaa/app-shared...` step, but the **verdict-bearing instrument is prettier**, which keeps no cache — so no replay stands between this exit code and this tree | **0** | **`All matched files use Prettier code style!`, twice** — once for the repository root and once for the `@openvaa/docs` workspace the script checks separately. **0** unformatted files: a search of the log for `would reformat` or `code style issues` returns **0** matches. Log `g3-format.log` | **PASS.** Nothing in the tree is unformatted, including the one source file this plan changed, which was put through `prettier --write` before it was committed rather than after the gate complained |
| G4 | the milestone's standing gate 4 — build | none — the closing tree | turbo · `TURBO_FORCE=true yarn build` — owned by `145-08` → `g4-build.log` | `8372d0dff` — the same shared closing HEAD as every other gate row | **`Cached: 0 cached, 14 total`** — all **14** tasks report `cache bypass, force executing`. Forced from the start, deliberately: Phase 144's gate 4 came back `14 cached, 14 total` — every task a replay, i.e. a claim about a *previous* tree — and had to be disclosed and re-taken. That lesson is applied here rather than repeated | **0** | **`Tasks: 14 successful, 14 total`.** Every workspace built from source, in dependency order. Log `g4-build.log` | **PASS.** The whole monorepo builds at the closing tree, from source rather than from cache — so the exit code is a measurement of this tree and not of the one the cache remembers |
| G5 | the milestone's standing gate 5 — frontend typecheck | none — the closing tree | svelte-check · `yarn workspace @openvaa/frontend check` — owned by `145-08` → `g5-svelte-check.log` | `8372d0dff` — the same shared closing HEAD as every other gate row | `n/a — svelte-check`. Not turbo-mediated: the workspace script invokes `svelte-check` directly, so nothing cacheable stands between the verdict and the tree | **0** | **`COMPLETED 2684 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`**, verbatim from the log's final line. Log `g5-svelte-check.log` | **PASS**, and not optional: neither lint nor build type-checks `apps/frontend/src`, and CI runs this check as its own named step — so omitting it would leave the frontend's types unmeasured at exactly the tree this phase is closing over |
| G6 | the milestone's standing gate 6 — repo typecheck | none — the closing tree | turbo · `TURBO_FORCE=true npx turbo run typecheck` — owned by `145-08` → `g6-typecheck.log` | `8372d0dff` — the same shared closing HEAD as every other gate row | **`Cached: 0 cached, 22 total`**, with **22** `cache bypass, force executing` verdict lines — **12** of them `:typecheck:` tasks and the rest their `build` dependencies. The first typecheck verdict reads, verbatim, `@openvaa/dev-tools:typecheck: cache bypass, force executing`. **An execution, not a replay**, which is the whole reason the exit code beside it is a claim about THIS tree | **0** | **`Tasks: 22 successful, 22 total`**, and `grep -c 'error TS'` over the log returns **0**. Log `g6-typecheck.log` | **PASS.** The repo-wide typecheck executes clean — including `packages/dev-seed`, whose renamed `external_id` literals row `T1` measured under Phase 144's strict per-collection row types. `T1` proved the rename typechecks in one package with the cache forced; this row proves nothing elsewhere in the repository regressed to pay for it |
| G7 | the milestone's standing gate 7 — E2E, **last**, after the final revert | none — the closing tree | playwright · `yarn test:e2e` — owned by `145-08`, run **after** `yarn db:reset` (log `g7-dbreset.log`, exit **0**, `Finished supabase db reset on branch main`) and against **exactly one** fresh dev server started by this plan → `g7-e2e.log` | `8372d0dff` — the same shared closing HEAD as every other gate row; `git status --porcelain -- packages apps tests .github` printed nothing immediately before this run and immediately after it | `n/a — playwright` | **0** | **`135 passed (11.5m)` — 0 failed · 0 flaky · 0 skipped · 0 did-not-run.** Each of those four zeros is a **counted search of the log**, not a reading of the summary line: `[1-9][0-9]* failed` → **0** matches · `flaky` → **0** · `skipped` → **0** · `did not run` → **0** · `✘`/`✕` → **0** · `test.skip`/`test.fixme` → **0**. **No test was retried, skipped, or annotated flaky.** The served application was proven to be this checkout by the suite's own preflight, which runs in Playwright's global setup and aborts before any spec body executes: `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)` — **1** success line, **0** `PREFLIGHT FAIL` lines. The suite's own data-setup projects seeded the `e2e/base` fixture dataset onto the reset database. Log `g7-e2e.log` | **PASS — the cardinal gate, and it means what it says.** It ran **last**, on a database reset **after** gate 1 — whose dev-seed integration test writes the demo template into the live database and has **no** post-test teardown — and against one verified dev server on the frontend port. So neither of the two mechanisms that voided a prior phase's gate-7 attempt, a contaminated dataset and a foreign server, is in play here. This is also the runtime half of the **E-03-c** check noted beside `P1-GREEN`: the gate specs that depend on `e2e/base`'s two deliberately-unaccepted candidates staying hidden are green, so this phase's fix did not backdate acceptance across templates |

### Note beside `P1-GREEN` — the **E-03-c** check: `e2e/base`'s in-repo negative control survives the fix

**Confirmed by source read at HEAD `eab07013f`:** `packages/dev-seed/src/templates/e2e/base.ts` still
carries its two deliberately-unaccepted candidate rows — `test-e2e-base-ca-aa-hidden` (`:1076`) and
`test-e2e-base-ca-aa-unregistered` (`:1208`), each marked `terms_of_use_accepted DELIBERATELY absent`
— and neither acquired the column. The file is byte-identical across the fix
(`git diff 418eb1353..eab07013f -- packages/dev-seed/src/templates/e2e` is empty), which is the
structural reason: `145-04` set the key on **one row producer in one template's override**, and did
**not** widen `bulkImport`'s `PUBLISHABLE_TABLES` auto-default, which would have reached both
templates and backdated acceptance for these two rows. The **runtime** half of this check is carried
by the gate-suite specs that depend on those two candidates staying hidden, run at `G7` in `145-08`;
row `U2` above is its unit-level half, GREEN at both HEADs.

### Addendum to `P1-GREEN` / `U1-GREEN` / `U2` — the comment-only correction that followed the measurement

The three rows above cite HEAD `eab07013f`, and that is where their run was issued. A **comment-only**
correction to the same file landed immediately afterwards at `643891c6b` (the rationale block named
the two clock APIs verbatim, which tripped this plan's own acceptance check that the file contains
neither token). The measured commit was **not amended** — the ledger's citation and its blob hash
`c286c684edde37912498e575d67c6508ef03c902` still resolve, per the `145-03` precedent.

`git diff eab07013f..643891c6b -- packages/dev-seed/src/templates/defaults/candidates-override.ts`
contains **0** changed non-comment lines, so the emitted row is byte-identical across it. The suite
was nevertheless re-run at `643891c6b` rather than argued about: `vt-P1-GREEN-2.log`, **exit 0, Test
Files 48 passed (48) · Tests 555 passed (555) · 0 failed · 0 skipped**, with the anon `it` (21 ms),
`Test 28` (4 ms) and `Test 29` (0 ms) all named passing in the verbose output. Both HEADs report the
same verdict for all three rows.

---

## Criterion 1 — before and after

**Four screenshots, two run logs, two exit codes, two HEADs.** Criterion 1 asked that a
`default`-seeded database render, in the running voter app, a non-empty parties list **and** an
entity-tab set that includes candidates. Both halves were taken against the live application through
the warm voter journey, in the same working session, by one instrument.

| Half | HEAD | Run log | Exit | Observed tab set (verbatim) | Candidate cards | Party cards | Screenshots |
|---|---|---|---|---|---|---|---|
| **before** (`A1-RED` / `A2-PRE`) | `49954257e` | `pw-A-before-1.log` | **1** | `["Parties","Alliances"]` — **no candidates tab at all** | **not reachable** — the tab does not exist, so no count can be read | **8** | `app-before-tabs.png` (105,908 B) · `app-before-parties.png` (130,672 B) |
| **after** (`A1-GREEN` / `A2-POST`) | `0d62314f0` | `pw-A-after-1.log` | **0** | `["Candidates","Parties","Alliances"]` | **48** (Pirkanmaa, D-08's nominated count) | **8** | `app-after-tabs.png` (925,576 B) · `app-after-parties.png` (194,293 B) |

All four screenshots are under the resolved `${TMPDIR}/gsd-145/` recorded in this ledger's header, and
all four are outside the repository — they are evidence, never a committed artifact.

**One instrument, run twice.** Both halves were produced by the same spec file at the same path,
`tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts`; only the half name differed, and it
differed through the environment (`GSD_145_HALF`), which is what makes the two screenshot pairs come
out of one unedited source. Stated exactly rather than rounded: the two blobs are
`7b3f5b24eb3509a8a85399117a9825fa1f1276b6` (before) and
`30d2b00c9d2049f5fbd1acfc650d25c8a3c35b99` (after), differing **only** by `145-03`'s comment-only
docstring correction `3d386050b` — `git diff 49954257e..HEAD` over that path has **0** changed
non-comment lines, and `tests/playwright.config.ts` is byte-identical across both halves. No
assertion, fixture, selector, timeout or tag moved. `145-05` changed no byte under `tests/`.

**The spec is excluded from the cardinal gate suite by its tag.** Every test in it is `@probe`-tagged
and the root `test:e2e` script appends `--grep-invert @probe`, so this instrument can assert against a
`default`-seeded database — a dataset the gate suite cannot tolerate — without ever running in the
gate. That exclusion is `145-03`'s design (D-04 rejected a gate-suite spec that seeds `default`
mid-suite) and it is unchanged here.

**⚠ The pair straddles two behaviour-changing commits, not one.** `eab07013f` (`145-04`, the anon-RLS
`terms_of_use_accepted` fix) restored anon visibility of the candidate rows; `9f12a6c94` (`145-04.1`,
the number-range emitter fix) stopped the voter app throwing
`normalizeCoordinate: Value is out of range` while normalizing those newly-visible answers. With only
the first in place the after half **VOIDED twice** — `pw-A-after-void-1.log` and
`pw-A-after-void-2.log`, both `2 failed` inside the journey walk at `followLinkWhenHrefResolved`, with
neither of criterion 1's clauses ever evaluated. **A VOID is not a RED**: no assertion executed, so
neither log is a measurement of anything, and both are kept rather than deleted so the distinction is
visible. Any later reading of `A1-GREEN` that attributes the whole colour change to one key is wrong;
`145-08` carries that record correction alongside the `A2-PRE` one.

### Third observation — the same instrument, a third time, against the **renamed** template

`145-07` re-ran the probe unchanged against the post-rename seed, as the app-level regression check on
the identifier change. It is recorded here as a **note beneath the pair**, not as a new register row:
it re-measures an already-closed pair (`A1-GREEN` / `A2-POST`) at a later HEAD rather than opening a
new one, and the register's corpus is asserted at exactly thirty rows.

| Observation | HEAD | Run log | Exit | Observed tab set (verbatim) | Candidate cards | Party cards | Screenshots |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **rename** (post-`3bf417c83`) | `1c7bdfa6d` — `145-07` Task 1's commit; clean tree | `pw-A-rename-1.log` | **0** — `2 passed (1.3m)`, zero failure markers | `["Candidates","Parties","Alliances"]` | **48** | **8** | `app-rename-tabs.png` (925,576 B) · `app-rename-parties.png` (374,280 B) |

**It matches the after half exactly on every measured value** — same tab set, same 48 candidate cards,
same 8 party cards, same exit 0. The database underneath it was the one `S4` had just measured: 8
organizations and 5 constituencies, **all** in the new idiom, zero old-idiom residue.

**The instrument did not move.** `git hash-object` of
`tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts` returns
`30d2b00c9d2049f5fbd1acfc650d25c8a3c35b99` — byte-identical to the blob recorded for the after half.
Only `GSD_145_HALF` differed, and it differs through the environment.

**What this rules out.** Nomination `external_id`s are *interpolated* from the organization and
constituency base values that were renamed —
`` nom_org_${org.external_id}_${constituency.external_id} `` and
`` nom_alliance_${key}_${constituencyExtId} `` — and the entity tabs derive from the nomination tree.
A rename that broke that interpolation would present, once again, as a **missing Candidates tab**, the
exact symptom criterion 1 opened on. It does not.

**One difference, stated rather than smoothed.** `app-rename-tabs.png` is **byte-identical** to
`app-after-tabs.png` (`sha256 5c3acae6…`, both 1280 × 9158). `app-rename-parties.png` is **not**
byte-identical to `app-after-parties.png` — same 1280 × 3466 dimensions, different bytes (374,280 B vs
194,293 B). The difference was **not diagnosed** by this plan; the party-card assertion, which is the
measurement, reads **8** in both runs, and the pixel difference is recorded here as an unexplained
observation rather than dismissed.

---

## Pair 2 — the injected diff

**Why this pair exists.** Pair 1 (`P1-RED` / `P1-GREEN`) shows the anon guard failing when
`terms_of_use_accepted` is absent and passing when it is present. On that evidence alone the guard
could just as well be asserting *that one column is set* — in which case a future regression that
hides candidates by **any other route** would sail past a green check, and the guard and the fix would
be the same statement written twice. Pair 2 removes anon **visibility** while **leaving the column in
place**. A red here is the only available evidence that what the guard asserts is the RLS boundary
rather than a key.

**Why `published: false` is a real regression shape, not a contrivance.** `published` is an admitted
key on the `candidates` collection (`packages/dev-seed/src/template/permittedKeys.ts` — `'published',`
inside the `candidates:` list), so the injection survives the write path's unknown-property guard
rather than throwing. And `bulkImport` **honours an explicit value** —
`if (isPublishable && !('published' in stripped)) { stripped.published = true; }`
(`packages/dev-seed/src/supabaseAdminClient.ts:257-259`) — so an explicit `false` on the row literal
actually reaches the database instead of being overwritten by the publishable auto-default. This is a
diff a template author could plausibly write.

**The injection, verbatim** — one added key on the same emitted row object that carries the
timestamp, at injection HEAD `9ce618f07`. Nothing else moved:

```diff
diff --git a/packages/dev-seed/src/templates/defaults/candidates-override.ts b/packages/dev-seed/src/templates/defaults/candidates-override.ts
index 4cb334771..917e4e64b 100644
--- a/packages/dev-seed/src/templates/defaults/candidates-override.ts
+++ b/packages/dev-seed/src/templates/defaults/candidates-override.ts
@@ -164,7 +164,8 @@ export function candidatesOverride(_fragment: unknown, ctx: Ctx): Array<Record<s
       //    the publishable tables would backdate acceptance for `e2e/base` too,
       //    reaching its `ca-aa-hidden` / `ca-aa-unregistered` rows — two deliberate
       //    in-repo negative controls — and destroying them.
-      terms_of_use_accepted: '2025-01-01T00:00:00.000Z'
+      terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
+      published: false
     };

     // Answer emission via the emitter seam (mirrors CandidatesGenerator.ts:141-149).
```

**Blob hashes across the loop:** `4cb334771eaca37df20721222fbb8021150b8048` before →
`917e4e64b5011446d002402e9e1f84a617a535cf` injected → `4cb334771eaca37df20721222fbb8021150b8048`
restored. The middle value **never reached a commit**: no commit was made while the injection was
live, the loop did not cross a task boundary, and `git status --porcelain -- packages apps tests
.github` printed nothing on both sides of it. The record above is why this measurement is reproducible
**without** a permanently-broken template living in the tree — the rejected alternative was a committed
`tests/fixtures/negctl-*` fixture (`145-RESEARCH.md` § Open Questions item 2, decided against because
pair 2's assertion is about the *guard's* discrimination, not about a template anyone will seed again).

---

## Root cause, named (criterion 3)

**Named from four measurements taken in one session on the untouched tree at HEAD `6bd42c52d`,
against the database `yarn db:reset-with-data` had just built (`seed-reset-1.log`, exit 0, 752 rows
across 14 tables). Every number below is from this session's own payloads; none is copied from
`145-RESEARCH.md` or from `145-DISCUSSION-POINTS.md`.**

**The naming.** The `PUBLISHABLE_TABLES` auto-default in
`packages/dev-seed/src/supabaseAdminClient.ts:176-187` stamps `published = true` on every seeded
`candidates` row that does not already set it, justified in its own comment block by anon RLS being
`USING (published = true)`. That parenthetical is true for `organizations` and **false for
`candidates`**: the `anon_select_candidates` policy is **three clauses** —
`published = true AND terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()`. The
auto-default therefore satisfies **1 of 3**, and `D3-COL-PRE` measures exactly that signature: of the
327 `seed_` candidate rows, **327 are `published = true` and 327 carry `terms_of_use_accepted = null`
— none satisfies clauses two and three.** So the rows exist, they are published, and they are
invisible to `anon`.

**Why it presents as a missing tab rather than an empty list.** `get_nominations` is declared
`SECURITY INVOKER`, so the caller's RLS applies to its `LEFT JOIN`s, and its `WHERE` ends with
`AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL`. Under `anon` the candidate join yields NULL, that
filter removes the rows outright, and the entity type never appears in the result set at all. This is
why `D1-ANON-PRE` records an **absent** `candidate` key — key set `["alliance","organization"]`, 50
rows — while `D2-SVC-PRE`, the identical call one second later with the service_role key, records
`["alliance","candidate","organization"]` with **327** candidates across 377 rows. Downstream,
`nominationAndQuestionState.svelte.ts`'s `if (!nominations.length) return [entityType, undefined]`
drops the whole leaf and the results page derives its tab set from that tree's key set — so an
RLS-invisible entity type surfaces to the user as a **missing Candidates tab**.

**Why the anon half is not vacuous.** `D4-CTRL-PRE` was taken in the same session against the same
database: `accounts` returns **0 rows to anon** and **1 row to service_role**. The credential labelled
anon is genuinely subject to RLS, so `D1-ANON-PRE`'s absence is a policy outcome and not a mis-keyed
client. Without this control the differential would prove nothing.

**This is a `dev-seed` defect, not a schema or RLS defect.** The policy is correct as written, and
`e2e/base` satisfies it by emitting `terms_of_use_accepted` on its candidate rows. Relaxing the
predicate would make unaccepted-terms candidates publicly visible and is the rejected D-02 option C.
No byte under `apps/supabase/migrations/` is touched by this phase.

**Evidence rows, and nothing else:**

- `D1-ANON-PRE` — the anon read of `get_nominations()`: `candidate` key absent.
- `D2-SVC-PRE` — the service_role read of the identical call, same session: `candidate` = 327.
- `D3-COL-PRE` — the `candidates` column state that explains the difference: 327 published, 327 with
  a null `terms_of_use_accepted`.
- `D4-CTRL-PRE` — the `accounts` role control proving the anon credential really is anon: 0 vs 1.

**Carried forward:** `145-04` writes this naming into the in-repo record by correcting the
`PUBLISHABLE_TABLES` comment block so it states the three-clause predicate explicitly, and by emitting
`terms_of_use_accepted` from `candidatesOverride`.

---

## Latent range defect (145-04.1)

**This is a prose section, NOT a register row.** The register's corpus is asserted at **30** and its
§ Completeness arithmetic depends on that number; a corpus that can be extended is no longer a
negative control. The pair recorded below is measured to the same standard as any register row —
red half, green half, byte-identical instrument proven by blob hash — and is recorded here precisely
so the corpus stays closed.

### What the defect was

`defaultRandomValidEmit`'s `number` branch drew every synthetic answer from a hardcoded `0–100`,
**ignoring the range the question itself declares** in `custom_data.min` / `custom_data.max`. The
default template's one number question declares `{ min: 0, max: 10 }`, so 294 of its 327 candidate
answers were outside a range the question calls its own — and `NumberQuestion.isMatchable` reads that
same declaration, so those answers reached `normalizeCoordinate`, which throws on them by design.

The failure surfaced as a voter app that rendered `Loading…` forever past the first answered question.

### Why it was latent until `145-04`

Before `145-04`, anon could not see a single candidate (rows `D1-ANON-PRE` … `D4-CTRL-PRE` above), so
**no candidate number answer was ever normalized in the voter app**. The defect was fully present in
the emitted data the whole time; nothing consumed it. `145-04` did not cause this — it unmasked it, and
that ordering is the whole reason this plan exists between `145-04` and `145-05`.

`145-05`'s first probe run was therefore **VOID, not RED**: the layout threw on render, so neither of
criterion 1's assertions ever executed. A measurement that did not run counts as a failure, not a
pass — which is why it was stopped and this plan inserted rather than the probe re-read charitably.

### The three source facts, at the pre-plan HEAD `3c687b4d4`

| # | Fact | Location at `3c687b4d4` |
|---|---|---|
| 1 | `if (value < min \|\| value > max) throw new Error('Value is out of range');` — correct behaviour; the DATA is what is wrong | `packages/core/src/matching/distance.ts:30` |
| 2 | `row.custom_data = { min: 0, max: 10 };` — the default template's declared range | `packages/dev-seed/src/templates/defaults/questions-override.ts:174` |
| 3 | `return faker.number.int({ min: 0, max: 100 });` — the emitter ignoring it | `packages/dev-seed/src/emitters/answers.ts:85` |

**Record correction.** `145-04.1-PLAN.md` cites fact 2 at `:172`. Measured at that same HEAD it is at
**`:174`**. Facts 1 and 3 are cited correctly. The correction is stated rather than silently adopted.

### Before and after, measured against the live database

| | Answered `seed_q_024` | Outside declared `[0, 10]` | Observed span |
|---|---|---|---|
| **Before** (`145-05`'s aborted session, pre-fix data) | 327 | **294** | 0–100 |
| **After** (`seed-145-04.1-2.log`, then queried) | 327 | **0** | 0–10 |

The after half is `${TMPDIR}/gsd-145/count-range-post-1.json`, taken by SQL against
`postgresql://127.0.0.1:54322` after a clean `yarn db:reset-with-data` (752 rows / 14 tables, 327
candidates, exit 0). The question's UUID (`5d416e3b-5bf3-46d9-8fa0-f957e7104424`) and its declared
bounds were **resolved by query**, never hardcoded — UUIDs are regenerated on every `db:reset`. All
327 answers are JSON `number`s and the distinct set is exactly `0…10`, all eleven values present.

### The pair — red half, green half, one instrument

| Half | HEAD | Exit | Observed |
|---|---|---|---|
| **RED** | `13e1f89b1` | **1** | `84/100` outside `[0, 10]` and `93/100` outside `[3, 6]`, e.g. `37`, observed span `0–100` (`vt-R1-RED-2.log`) |
| **GREEN** | `9f12a6c94` | **0** | 49 files / 558 tests, 0 failed, **0 skipped** (`vt-R1-GREEN-1.log`) |

**Instrument identity, by hash rather than by recollection:**
`git rev-parse 13e1f89b1:packages/dev-seed/tests/emitters/answers.test.ts` and
`git rev-parse 9f12a6c94:…` both resolve to **`ed2895cc99e8860df3d65a97ad380ed28e31274e`**, and
`git diff 13e1f89b1..9f12a6c94 -- packages/dev-seed/tests/emitters/answers.test.ts` is empty.

**Guard-of-the-guard.** The unranged-fallback case passes in the *same* RED run the two ranged cases
fail. Had all three failed, the harness would have been miswired rather than the emitter caught.

**The guard cannot pass for the wrong reason.** Both bounds are read back off the question row rather
than written as literals in the assertion, and two declared ranges are exercised — `[0, 10]` (the
template's) and `[3, 6]` — so a "fix" that merely hardcoded the template's range would still be red.

### The decision, and the two options rejected

The defect was surfaced to the user at a **blocking-human** checkpoint with three options. The user
chose **A**, so the defect *class* is closed rather than the instance patched.

| | Option | Disposition |
|---|---|---|
| **A** | Fix the emitter to read the declared range | **CHOSEN.** Closes the class by construction for every template that uses the emitter, so the next narrow-range number question does not reopen it. |
| **B** | Widen the question's declared range to `{ min: 0, max: 100 }` | **REJECTED.** Fits the question to the bad data. The emitter would still violate the next declaration, and the demo's slider would silently change meaning. |
| **C** | Clamp or post-process emitted answers inside `candidates-override.ts` | **REJECTED.** Hides an emitter bug in a template override, where no reader looking for it would find it, and leaves every other template exposed. |

A fourth, unlisted option — relaxing the `normalizeCoordinate` throw — was never on the table:
throwing on an out-of-range coordinate is correct, and relaxing it converts a loud failure into
silent bad matching. `packages/core/src/matching/distance.ts` is absent from this plan's diff.

The user also chose to land this as its own plan rather than folding it into `145-05`, so `145-05`
keeps its "no product byte changed" contract intact.

### Blast radius — measured, and broader than the plan claimed

The cardinal E2E gate's datasets carry **zero** emitted number answers, so this change cannot perturb
them. Two independent facts, both measured at this HEAD:

1. `templates/e2e/base.ts` is the **only** template under `templates/e2e/` that declares a `number`
   question — two of them, at `:733` (`{ min: 0, max: 80 }`) and `:890` (`{ min: 0, max: 10 }`) — and
   it sets `candidates: { count: 0, fixed: [...] }`, so synthetic emission is suppressed entirely and
   its candidate answers are hand-authored.
2. The 29 `templates/e2e/perm/` templates **do** carry synthetic candidates (`buildMinimal({ candidates: N })`),
   but `grep -rn "type: 'number'" packages/dev-seed/src/templates/e2e/perm/` returns **zero** — they
   compose questions through `shared.ts` / `buildMinimal`, which emit only `singleChoiceOrdinal` and
   `text`. No perm template imports or spreads `base.ts`.

**The plan's framing was narrower than the truth and is corrected here.** It cited only fact 1, which
alone would have left the perm templates unaccounted for — and those *do* run the emitter. Fact 2 is
what actually closes the question for them. `git diff 3c687b4d4..9f12a6c94 -- packages/dev-seed/src/templates/e2e packages/core`
is empty.

Note that `base.ts:890` declares `{ min: 0, max: 10 }` — the identical shape that broke the default
template. It is inert today only because that template emits no synthetic candidate answers. The fix
closes it prospectively.

### Determinism — no stored baseline exists, and this is measured rather than assumed

`packages/dev-seed` contains **zero** snapshot assertions: no `__snapshots__` directory, no `.snap`
file, and `grep -rn "toMatchSnapshot\|toMatchInlineSnapshot\|toMatchFileSnapshot" packages/dev-seed/src packages/dev-seed/tests`
returns **0**. Every determinism assertion in `tests/determinism.test.ts` is **run-vs-run** — two fresh
`runPipeline({ seed: 42 })` calls compared to each other, or seed 42 compared against seed 99 — never
against a recorded corpus of emitted values.

**Consequence: all six determinism tests pass unchanged and nothing was re-recorded.** Stating this
explicitly is the point; a silent green here would leave open whether a baseline had been quietly
refreshed to fit the new emitter. The emitter's fix keeps the draw a **single** `faker.number.int`
call whatever the range, so the number of faker reads per question is unchanged and the pinned-seed
determinism property survives by construction, not by luck.

### `145-04`'s RLS fix survived

The `145-02` anon guard, unchanged, was re-run against the freshly re-seeded data:
`${TMPDIR}/gsd-145/vt-anon-regreen-1.log`, **exit 0**, 2/2 passed, with
`anon accounts rowcount (role control)` and `service_role accounts rowcount (role control)` — the
first two assertions inside that `it` — holding. The range fix did not disturb the visibility fix.

---

## TMPL-04 — the idiom and its divergence

`145-06` closed TMPL-04. The requirement was re-scoped once by D-05 (from "constant naming", which was
measured already-consistent, to the `external_id` idiom) and then narrowed a second time by
measurement: the eleven class-based generators already emit **one** scheme, and the `default` template
agreed with it on five of its seven hand-authored collections. **Two typecodes diverged, not six
idioms.**

**The idiom, as adopted:** `<typecode>_<discriminator>`, snake_case, the typecode taken from the
generator that owns the collection, the discriminator semantic for hand-authored rows and zero-padded
for generated ones.

**The two collections changed**, with their typecodes read from source rather than chosen:

| Collection | Generator typecode | Source of the typecode |
|---|---|---|
| constituencies | `con` | `packages/dev-seed/src/generators/ConstituenciesGenerator.ts:65` |
| organizations | `org` | `packages/dev-seed/src/generators/OrganizationsGenerator.ts:47` |

The five already-conformant collections (elections, constituency_groups, question_categories,
app_settings, alliances) and the generated `cand_NNNN` / `q_NNN` / `nom_*` families were not touched.
The `seed_` prefix was not touched — it is the key `db:seed:teardown` filters on.

**Occurrence counts, measured before and after across all of `packages/dev-seed`:**

| Retired family | Before (HEAD `ef1834410`) | After (HEAD `3bf417c83`) |
|---|---|---|
| the eight organization values | **36** (32 in `src`, 4 in `tests`) | **0** |
| the five constituency values | **16** (16 in `src`, 0 in `tests`) | **0** |

The before-count for the organization family is **36**, not the 32 the plan projected. The projection
counted `src` only; the four occurrences in `tests/integration/default-template.integration.test.ts`
are two comment LINES carrying two mentions each. The measured number is recorded here in preference
to the projection.

**Zero occurrences existed anywhere outside `packages/dev-seed`** — re-measured repo-wide this
session, excluding `node_modules`, `.git` and `.planning`: no Playwright spec, no pgTAP test, no
frontend file and no SQL file references a `default`-template identifier. That is why the rename's
blast radius is one package.

**The rename is atomic.** `ALLIANCE_MEMBERSHIP` in `defaults/alliances-override.ts` is the one lookup
in the package that keys by identifier **value**; the party/constituency matrix and the weights in
`defaults/nominations-override.ts` index **positionally** into `ctx.refs`, which was re-read in full
and confirmed before the edit. A tree in which the template had been renamed and the map had not
would seed alliances with zero members and raise no error at all, so both moved in commit
`3bf417c83`.

**The deliberate divergence from `e2e/base` is documented in the repository, not only here.**
`packages/dev-seed/src/templates/default.ts`'s header docstring carries a `## external_id idiom`
block stating the scheme and listing four numbered divergences: snake_case rather than kebab-case; no
fixture namespace prefix; generator typecodes rather than the fixture's two-letter codes; and the
alliance discriminators' retained uppercase (145-RESEARCH § Open Questions item 3 — leave it, and say
so). The block describes the change in words and **quotes no retired value**, so the zero-occurrence
count above is not defeated by its own documentation.

**What this section does NOT claim.** `external_id` is a durable upsert key and the `LIKE 'seed_%'`
key for teardown. That the unchanged prefix keeps teardown's reach over rows written under the old
idiom is, at this row, an **expectation** — it is discharged by measurement in `145-07`, whose
four-step strand proof (`S1` … `S4`) seeds the old idiom, seeds the new one over it with no
intervening reset, runs teardown, and counts both. `145-07`'s old-idiom half is produced by a
transient checkout of the two renamed files from **`ef1834410`**, the commit immediately preceding
`3bf417c83`, which already contains this phase's behavioural fixes.
## Strand proof

**D-05 rated the `external_id` rename *costly* precisely because `external_id` is a durable upsert
key, and a rename can strand rows on any database that is not reset first. This section is the
measurement that discharges it — not the argument that would have replaced it.** The strand was
produced on purpose, counted per idiom so its survival was visible rather than merely implied by a
total, and then measured against teardown.

**The four-step procedure, exactly as run** — one session, one database, `145-07` Task 1 for steps
1–3 and Task 2 for step 4:

1. `yarn db:reset` → transiently check out **two** files from the pre-rename commit →
   `yarn db:seed:default` → count. (`db:reset-with-data` is *defined* as `db:reset && db:seed:default`;
   it is run decomposed here for one reason only — the old-idiom blobs must land **between** the reset
   and the seed.)
2. `git checkout HEAD --` both files back to the renamed state, assert both blob hashes against the
   restore targets recorded in `S1`, then `yarn db:seed:default` again **with no intervening reset**
   → count.
3. `yarn db:seed:teardown` → count.
4. `yarn db:reset-with-data` → count. *(Task 2.)*

**The blob source: `ef1834410`** — the commit immediately preceding the rename commit `3bf417c83`. It
already carries `145-04`'s anon-RLS fix and `145-04.1`'s number-range fix, which is exactly why
reverting these two files reverts the phase's **naming** change without disturbing its **behavioural**
one. Precisely two paths were checked out from it —
`packages/dev-seed/src/templates/default.ts` and
`packages/dev-seed/src/templates/defaults/alliances-override.ts` (injected blobs
`0c1eb840586979501841939873ef2dd6fb4968d0` and `2ac22cd892b4787d3a40ca1394ef6c4d687dfc23`).
`packages/dev-seed/src/templates/defaults/candidates-override.ts` was **not** touched — prohibited by
`145-07-PLAN.md`, threat `T-145-25` — and its acceptance-timestamp literal
`terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` was confirmed present both before and after the
loop, so `145-04`'s fix survived the injection untouched.

**Restore targets were re-derived at this injection's own HEAD**, per the rule `145-05` added to
§ Restoration blob hashes: `default.ts` = `054e32824a75d4afa4a7c98cdb0a20e929c2eb9c`,
`alliances-override.ts` = `041912ae8c98ac60f0ae4dd659b002c7f8531524`, both `git hash-object`-taken at
`8b2b052f9` **before** the injection. The creation-time values in that table
(`0c1eb840…` / `2ac22cd89…`) are, for these two paths, now identical to the *pre-rename* blobs — i.e.
restoring against the table would have silently reverted `3bf417c83` mid-proof. That is the third
consecutive plan to meet this hazard, and the first at which the table's value coincides with the
injected state rather than the restored one.

**The counts at every step — measured, never inferred.** Every number below came from a PostgREST
query issued against the live local database at that step
(`GET /rest/v1/{organizations,constituencies}?select=external_id&external_id=like.seed_*` with the
service_role key), saved raw as `count-S1-1.json` … `count-S4-1.json`. Old idiom = `seed_party_*` /
`seed_c_0*`; new idiom = `seed_org_*` / `seed_con_*`; a third bucket counted anything matching
neither, and read **0** at every step.

| Step | Row | Database action | `organizations` — old / new / total | `constituencies` — old / new / total | Artifact |
|---|---|---|---|---|---|
| 1 | `S1` | reset, then seed the **old** idiom | **8** / 0 / **8** | **5** / 0 / **5** | `seed-S1-old-1.log` · `count-S1-1.json` |
| 2 | `S2` | seed the **renamed** idiom, ⚠ **no reset** | **8** / **8** / **16** | **5** / **5** / **10** | `seed-S2-new-1.log` · `count-S2-1.json` |
| 3 | `S3` | `yarn db:seed:teardown` | **0** / **0** / **0** | **0** / **0** / **0** | `teardown-S3-1.log` · `count-S3-1.json` |
| 4 | `S4` | `yarn db:reset-with-data` | **0** / **8** / **8** | **0** / **5** / **5** | `seed-S4-reset-1.log` · `count-S4-1.json` |

Every observed count in all four steps equals the projection `145-07-PLAN.md` § polarity stated in
advance. That agreement is reported as an outcome of the run, not as the reason to believe it — the
numbers above are the queries' output, and had they differed, the ledger would carry the observation
and the plan would have stopped.

**What step 3 discharges, in one line.** After a rename, a database carrying **both** idioms is fully
cleared by `yarn db:seed:teardown` — zero rows of **either** idiom remain in either table — because
teardown keys on the `seed_` prefix, which the rename deliberately did not change, and not on the base
names, which it did. Read from source rather than assumed: `runTeardown` builds
`collections[table] = { prefix }` over `ALLOWED_TEARDOWN_TABLES` (ten tables) with a default prefix of
`seed_`, and the `bulk_delete` RPC applies it as a `LIKE prefix%` match on `external_id`
[`packages/dev-seed/src/cli/teardown.ts`].

**One supporting observation, stated with its limit.** The teardown deleted **814** rows, against the
**751** a single seed places in teardown's ten tables (the `Total 752` in the seed log minus the one
`app_settings` row, which teardown does not own — `db:reset`'s job, per `teardown.ts`'s Pitfall #6
note). The **63**-row excess is the old idiom's residue. Of it, **13** rows are measured directly by
`S2` — 8 organizations plus 5 constituencies — and the remaining **50** sit in the other eight
teardown tables and **were not measured per-table by this plan**. The arithmetic is recorded as
consistent with the strand, not as a per-table count.

---

## Strand proof — conclusion

**Step 3 discharged the durability concern D-05 raised.** A database carrying rows written under
*both* identifier idioms was cleared completely by `yarn db:seed:teardown` — zero old-idiom rows and
zero new-idiom rows in both `organizations` and `constituencies`, measured by query — so the rename
cannot leave rows that no supported command can reach.

**Step 4 confirmed the end state a developer actually gets.** After `yarn db:reset-with-data` the
counts are back to the template's declared sizes, 8 organizations and 5 constituencies — equal to
`S1`'s totals — with the old-idiom count at **zero** and nothing unclassified, and the app-level probe
re-run against that seed reproduced the after half exactly: a populated parties list, a Candidates tab
in the entity-tab set, 48 candidate cards.

**The mechanism, named.** Teardown's reach is independent of the identifier idiom because it keys on
the `seed_` prefix, which the rename deliberately left alone, and not on the base names beneath it,
which the rename changed. The prefix is auto-applied to `fixed[]` rows (M-13) and `runTeardown` passes
it to `bulk_delete` as a `LIKE prefix%` match across ten tables. That invariance is what makes
`external_id`'s status as a durable upsert key survivable under renaming — and it is now a measured
fact of this repository rather than a plausible inference about it.

---


---

## Residue

**Opened at ledger creation, filled as this phase runs** — the sequencing hazards, the findings each
plan surfaces, and every disposition that is named rather than closed.

### Sequencing hazard — `yarn test:unit` re-seeds the live database and never tears down

`packages/dev-seed/tests/integration/default-template.integration.test.ts` runs
`runTeardown('seed_', …)` in its `beforeAll` — deleting every `seed_`-prefixed row across ten tables
and draining the candidate portrait folder — and then writes the **full default template** back into
the live local database as part of the test body. There is **no post-test teardown**: the dataset the
run leaves behind is whatever the test wrote, not whatever was there before (the standing todo
`.planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md` names this, and it
is out of scope for TMPL-03/04). The hazard is therefore **asymmetric**: it bites the **pre-fix**
observations only. A post-fix row can always be re-measured by re-seeding the fixed template, but a
pre-fix row measured *after* an intervening suite run is a measurement of a dataset the suite wrote,
at whatever template state the tree then held — and once the fix commit lands, the pre-fix state is
unrecoverable without a revert.

**The order this plan used, recorded so it can be checked against the commit graph rather than
trusted:** (1) `yarn db:reset-with-data` — database-only reset plus the `default` seed
(`seed-reset-1.log`, exit 0, 752 rows across 14 tables); (2) the four criterion-3 diagnostics
`D1-ANON-PRE` / `D2-SVC-PRE` / `D3-COL-PRE` / `D4-CTRL-PRE`, all four issued against that untouched
dataset in one session, committed at `71f4104d9`; (3) **only then** the suite run for `B1-OLD`, whose
own `beforeAll` teardown-and-reseed was allowed to overwrite that dataset because every diagnostic had
already been taken. The post-run confirmation (`diag-B1-postrun-1.json`) re-measured the role
differential against the suite's own output, so `B1-OLD`'s claim rests on the dataset the suite
actually ran green over rather than on the one that preceded it.

**Second observation, `145-02`.** Because `B1-OLD`'s run had already overwritten the dataset, `145-02`
re-ran `yarn db:reset-with-data` before measuring (`seed-reset-145-02-1.log`, exit 0, 752 rows across
14 tables) rather than assuming the current state, exactly as this section prescribes. Its own two
suite runs then each re-seeded again through the integration test's `beforeAll`. Every `145-02` row
therefore rests on a dataset written by the run that recorded it, at a tree whose
`packages/dev-seed/src` is untouched — so the template under test is still the pre-fix one, and that is
asserted per row by a `git hash-object` comparison against the recording commit's blob rather than
assumed.

### Deferred — the CI runner half of `CI1` is unobserved (opened by `145-02`)

`CI1`'s three source facts are confirmed by reading `.github/workflows/main.yaml` at HEAD
`2e5262d4a`: the `ANON_KEY` extraction, the `test -n` guard with its `ANON_KEY missing from supabase
status` error string, and the `SUPABASE_ANON_KEY` append to `$GITHUB_ENV`. **What is NOT observed is
the step actually running on a GitHub runner** — that `supabase status -o env`, on whichever CLI
version `supabase/setup-cli@v1 · version: latest` resolves to there, still emits an `ANON_KEY` line at
all, and that the exported value authenticates the new anon guard against the runner's own instance.

It cannot be observed from here: the workflow triggers only on push/PR to `main`, and
`feat-gsd-roadmap` is far ahead of a stale `origin/main`. This is the identical disposition Phase 137
carried for its criterion 3, and it is named rather than closed because **a grep is not a run** — the
whole stance of this register is that a measurement that did not execute counts as a failure, not a
pass.

**Discharging event: this branch's first pull request to `main`.** At that point the
`dev-seed-integration` job executes the export step, and `CI1`'s outcome cell can be replaced with an
observed one. Assumption `A2` in `145-RESEARCH.md` § Assumptions Log records the same open question
and predicts the failure mode the guard buys: a CLI that no longer emits `ANON_KEY` turns the export
step red **by name**, rather than surfacing downstream as a mis-attributed seed regression.

### What this phase leaves behind — the closing list (`145-08`)

Five things, each named rather than left implicit. **None of them is a silent omission**: every one
was either measured and scoped out, or deliberately not measured and said so.

1. **The CI runner half of `CI1` is unobserved, and the row closes DEFERRED.** Its three source facts
   are confirmed by reading `.github/workflows/main.yaml`; what has *not* been observed is the step
   running on a GitHub runner. **A grep is not a run.** Discharged by this branch's first pull request
   to `main` — see the subsection immediately above. Filling this row green on the strength of a
   source read would be the exact failure this phase spent nine plans refusing to commit.
2. **The other nine publishable tables were NOT audited.** `candidates` is the one instance found
   here. Whether `elections`, `constituency_groups`, `constituencies`, `organizations`, `factions`,
   `alliances`, `question_categories`, `questions` or `nominations` has an anon predicate that the
   write path's `PUBLISHABLE_TABLES` auto-default likewise **under-satisfies** was **not measured**.
   This is the *general* form of the defect this phase fixed one instance of, and it deserves its own
   small phase; answering it inside 145 would have widened it past TMPL-03/04. The rewritten
   `PUBLISHABLE_TABLES` rationale block in `supabaseAdminClient.ts` declares this non-audit in the
   repository itself, so a reader of the code meets the limit rather than only a reader of this
   ledger.
3. **`yarn test:unit` still leaves a full seeded dataset in the live local database.** The dev-seed
   integration test's teardown is **pre-test only, with no post-test counterpart** (§ Sequencing
   hazard above). That is the mechanism that voided a prior phase's gate-7 attempt and the reason
   this plan's gate order puts `yarn db:reset` between gate 6 and gate 7 with **no** unit run after
   it. Out of scope for TMPL-03/04 and already carried by the standing todo
   `.planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md`.
4. **The cold-`/results` dev-server crash is filed, not fixed** — an uncaught
   `Cannot use cookies.set(...) after the response has been generated` from a session-less direct URL
   hit, which takes the whole Vite process down. Standing todo:
   **`.planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md`**, which now
   carries a filing-of-record section recording that it is still unfixed, never touched this phase's
   measured **warm** journey, and did not affect gate 7. It is an `apps/frontend` cookie-lifecycle
   bug with no connection to seed data, and its stated mechanism is an **unconfirmed hypothesis** that
   must be re-tested in isolation before any fix is built on it.
5. **Four `party_*` occurrences survive in `packages/dev-seed`, and they are not a missed rename.**
   `party_vihreat` / `party_kokoomus` in `src/template/types.ts:105-106` and `party_a` / `party_b` in
   `README.md:162-163` are **generic API-documentation examples**, not members of the renamed family
   — each of whose eight retired values measures **0** across the package. Neither file was in
   `145-06`'s scope, and sweeping them here would have widened the rename past what its strand proof
   covers. Recorded as **observed-and-out-of-scope** so a later grep does not read them as residue of
   an unfinished rename.

**One finding of this phase's own gates is NOT residue, because it was fixed here:** the pre-existing
frontend spec whose first assertion paid an ESLint cold start inside vitest's default 5 s budget. It
is disclosed in § Gates with its measurement, and closed in commit `8372d0dff`. Whether any *other*
spec in the repository has the same shape — one-time initialization charged to the first assertion
rather than to a hook — was **not** surveyed, and is the honest generalisation of that finding.

---

## Gates

**All seven gates ran at ONE HEAD — `8372d0dff` — recorded once before gate 1 and re-read after gate
7.** `git rev-parse --short HEAD` returned the same value at both ends and
`git status --porcelain -- packages apps tests .github` printed nothing at both ends, so no source
file was edited and no commit was made between gate 1 and gate 7. The set is a set, not a sequence of
claims about different trees.

Resolved `$TMPDIR` is `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T`, so every log path
below resolves under `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-145/`.

Machine: developer Mac, host Node, no container — Darwin 25.5.0 arm64 / Node v24.14.1, runs issued
from the repository root. Local Supabase up throughout (`yarn db:status` → running).

### The order actually run, and why it is not the order the scripts are listed in

| # | Gate | Command, verbatim | Log | Exit |
|---|---|---|---|---|
| 1 | unit | `TURBO_FORCE=true yarn test:unit`, with `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` / `DEV_SEED_INTEGRATION_REQUIRED=1` exported | `g1-unit.log` | **0** |
| 2 | lint | `TURBO_FORCE=true yarn lint:check` | `g2-lint.log` | **0** |
| 3 | format | `yarn format:check` | `g3-format.log` | **0** |
| 4 | build | `TURBO_FORCE=true yarn build` | `g4-build.log` | **0** |
| 5 | frontend typecheck | `yarn workspace @openvaa/frontend check` | `g5-svelte-check.log` | **0** |
| 6 | repo typecheck | `TURBO_FORCE=true npx turbo run typecheck` | `g6-typecheck.log` | **0** |
| — | **database reset** | `yarn db:reset` | `g7-dbreset.log` | **0** |
| — | **one fresh dev server** | `yarn dev`, then port and identity verified | `devserver-145-08.log` | — |
| 7 | **E2E, cardinal, last** | `yarn test:e2e` | `g7-e2e.log` | **0** |

**The two preconditions between gate 6 and gate 7 are part of the protocol, not hygiene advice.**

1. **The database reset.** Gate 1 is not read-only. `default-template.integration.test.ts` tears down
   the `seed_` prefix in its `beforeAll` and then writes the **full default template** into the live
   local database, with **no** post-test teardown (§ Residue → Sequencing hazard). The E2E suite
   asserts against the `e2e/base` fixture dataset. Running gate 7 on the database gate 1 left behind
   is therefore a **void attempt** — the mechanism by which a prior phase lost a gate-7 run — so
   `yarn db:reset` ran after gate 6 and **no unit run followed it**.
2. **Exactly one fresh dev server for this checkout.** The pre-existing dev stack was stopped before
   gate 1 (also removing its `turbo watch build` contention from the gate runs), and a single fresh
   `yarn dev` was started after the reset. Verified three ways before gate 7 was invoked:
   `lsof -nP -iTCP:5173 -sTCP:LISTEN` reported **one** listener; `curl` returned **200**; and the
   served page echoed **this** working tree's absolute path through Vite's `/@fs` endpoint. The
   suite's own preflight then re-proved it from inside the run
   (`E2E PREFLIGHT OK … verified against …/voting-advice-application-gsd`). A preflight abort would
   have been recorded as a **wiring failure**, never as a suite result.

### ⚠ The first gate-1 attempt was RED, and it is disclosed rather than deleted

The gates were first attempted at `145-07`'s closing HEAD. Gate 1 **failed** there, and the failure is
recorded because a phase that hides its own red gate has no standing to publish the green one.

- **Observed:** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` → `Test timed out in
  5000ms` on the file's **first** `it`, which took **5391 ms**. `Tasks: 23 successful, 25 total`,
  frontend `Test Files 1 failed | 53 passed`, exit **1**.
- **Not retried to green.** An immediately preceding run of the identical command at the identical
  tree had passed 25/25 — so the honest reading was "this spec's verdict tracks machine load", which
  this project's cardinal rule names a **defect to iron out**, never a flake to tolerate.
- **Diagnosed by measurement.** The first `lintText` call in that file pays the one-time cost of
  resolving the real flat config and loading the typescript-eslint parser; every later call is warm.
  Re-measured **in isolation**, three runs: **971 ms · 651 ms · 1047 ms** — comfortably inside the
  budget. Inside the full 54-file suite under concurrent load: **5391 ms**. Same tree, same
  assertion, opposite verdict. The cold start was being charged to an assertion bounded by vitest's
  **default 5000 ms** per-test budget.
- **Fixed at the source, not at the budget.** Commit `8372d0dff` hoists the warm-up into a
  `beforeAll` under an explicit 120 s hook timeout. No assertion, probe path, `ruleId` filter or case
  count moved; all 30 cases still make their own `lintText` call. The first `it` now costs **11 ms**.
- **All seven gates were then re-run from the new HEAD**, which is why every row above cites
  `8372d0dff` and not the commit `145-07` closed on.

The defect was **pre-existing and unrelated to `packages/dev-seed`** — this phase neither introduced
it nor could have caused it. It is fixed here only because it stood between this phase and a
truthful gate 1.

---

## Final counts

**Every number this phase states anywhere is derived ONCE, here, from the register above at the
closing HEAD `8372d0dff`.** `REQUIREMENTS.md`, `ROADMAP.md`, the annotated todo and the plan summaries
**cite this section and do not re-derive**. Phase 143 lost a plan cycle to counts that moved between
measurement and statement; that is the failure this rule exists to prevent.

### The register

| Count | Value |
|---|---|
| **Total register rows** | **30** |
| RED/GREEN pairs | **4** — `P1` (`P1-RED`/`P1-GREEN`) · `U1` (`U1-RED`/`U1-GREEN`) · `P2` (`P2-RED`/`P2-GREEN`) · `A1` (`A1-RED`/`A1-GREEN`) |
| **Measured halves in those pairs** (4 × 2) | **8** |
| **must-NOT-fire rows** | **3** — `U2`, `A2-PRE`, `A2-POST`. **All three HELD**; none moved in either direction across the fix |
| Deferred rows | **1** — `CI1`, source half asserted, **runner half unobserved** |
| Gate rows | **7** — `G1` … `G7`, all exit **0** at one HEAD |
| **Measured in THIS phase** | **30 of 30 — every row.** Not one cell is inherited from another phase |
| **Borrowed observations** | **0.** No cell in this register carries an observation taken by another phase, and no cell carries a baseline this phase did not measure itself |
| **Cache replays admitted as evidence** | **0.** Every turbo-mediated row and gate reports `cache bypass, force executing`; the non-turbo rows record `n/a` plus their instrument, and that cell is never blank |
| **Placeholder cells remaining** | **0** — a checked number, not an assurance: the row-scoped grep at the closing HEAD returns **0** (see § Completeness) |
| VOID attempts disclosed rather than deleted | **2** — `pw-A-after-void-1.log`, `pw-A-after-void-2.log`, both from `A1-GREEN` before `145-04.1` landed. **A VOID is not a RED**, and neither log is a measurement |
| RED gate attempts disclosed rather than deleted | **1** — gate 1's first attempt, at `145-07`'s HEAD. Diagnosed and fixed at the source, never retried to green (§ Gates) |

**Rows per plan**, derived from the commit graph rather than from prose — each plan cleared only its
own rows, so the falling placeholder count is an assertion about history and not a claim this document
makes about itself:

| Plan | Rows cleared | Which | Register placeholder count after |
|---|---|---|---|
| — (creation) | — | all 30 rows pre-written, 5 cells each | **150** |
| `145-01` | **6** | `B1-OLD`, `B2-OLD`, `D1-ANON-PRE`, `D2-SVC-PRE`, `D3-COL-PRE`, `D4-CTRL-PRE` | **120** |
| `145-02` | **4** | `P1-RED`, `U1-RED`, `U2`, `CI1` | **100** |
| `145-03` | **2** | `A1-RED`, `A2-PRE` | **90** |
| `145-04` | **2** | `P1-GREEN`, `U1-GREEN` (and **amends** `U2`'s second half — an amendment, not a clearing) | **80** |
| `145-04.1` | **0** | recorded as the prose section § Latent range defect; **the corpus was deliberately not extended** | **80** |
| `145-05` | **4** | `A1-GREEN`, `A2-POST`, `P2-RED`, `P2-GREEN` | **60** |
| `145-06` | **1** | `T1` | **55** |
| `145-07` | **4** | `S1`, `S2`, `S3`, `S4` | **35** |
| `145-08` | **7** | `G1` … `G7` | **0** |

6 + 4 + 2 + 2 + 0 + 4 + 1 + 4 + 7 = **30**. The count at each row above was read back with
`git show <commit>:<this file>` and the row-scoped placeholder grep, not copied from the plan
summaries.

### Pairs by outcome class

| Class | Count | Pairs |
|---|---|---|
| Standard **blind → catch → fixed** (RED half against the unfixed template, GREEN half against the fixed one, instrument proven identical across the two) | **3** | `P1` (integration tier, anon client) · `U1` (pure-I/O tier, no live database) · `A1` (app-level, the running voter app) |
| **Discrimination** pair — both halves at ONE HEAD, what differs is an uncommitted injection, and the point is *what* the guard asserts rather than *whether* it fires | **1** | **`P2`** — `published: false` injected **alongside** `terms_of_use_accepted`, so the column the guard was chosen for is demonstrably present while the guard is red. Without this pair, `P1` and `145-04`'s fix would be the same statement written twice |
| **Total** | **4** | |

### Non-pair rows

| Row(s) | What they are | Result |
|---|---|---|
| `B1-OLD`, `B2-OLD` | The **blindness** halves the milestone's standing acceptance rule demands | Both **GREEN — and the green IS the finding.** 48/48 files, 552/552 tests, 0 skipped over a dataset the voter app could not read; service_role sees 327 candidates before *and* after the suite runs |
| `D1-ANON-PRE` … `D4-CTRL-PRE` | The four criterion-3 diagnostics, all four in **one session** against **one** database state | The role differential (`candidate` **absent** vs **327**) localises the failure to the `candidates` anon policy; the column state (327 published / **0** accepted) names the auto-default as the mechanism; `D4-CTRL-PRE` proves the anon credential is genuinely subject to RLS, so no later anon assertion is vacuous |
| `U2`, `A2-PRE`, `A2-POST` | **must-NOT-fire** | All **HELD.** `U2` green at both HEADs; `A2-PRE`/`A2-POST` observed the identical **8** party cards on the pre-fix and fixed templates. A colour change in either direction would have meant the assertion was coupled to the fix rather than to the surface it pins |
| `S1` … `S4` | The strand proof — the rename's one durability risk, produced on purpose and then cleared | 8/5 → **16/10** (strand, split 8+8 and 5+5) → **0/0 of BOTH idioms** after teardown → 8/5 all-new after reset. Teardown's reach is **independent of the identifier idiom** because it keys on the `seed_` prefix the rename left alone |
| `T1` | The rename's type integrity — the one row outside the eight classes | **PASS**, forced execution not a replay; `default.ts` carries 0 `as unknown as`, 0 `@ts-ignore`/`@ts-expect-error` and 0 occurrences of the word `any` |
| `CI1` | The CI `ANON_KEY` export | ⚠ **DEFERRED.** Source assertion confirmed; **runner half unobserved.** Carries no confirmed outcome |
| `G1` … `G7` | The milestone's standing seven gates | All **exit 0** at one HEAD `8372d0dff`; gate 7 cardinal and last: **135 passed · 0 failed · 0 flaky · 0 skipped · 0 did-not-run** |

### The seven gates

| # | Gate | Command | Exit | Numbers |
|---|---|---|---|---|
| 1 | unit | `TURBO_FORCE=true yarn test:unit` | **0** | 25/25 tasks · `0 cached, 25 total` · 11 workspaces · 173 files · **1,821** tests · 0 failed · 0 skipped · integration file **executing** (2 tests) |
| 2 | lint | `TURBO_FORCE=true yarn lint:check` | **0** | 0 errors · 20 pre-existing warnings · 33 forced verdicts · 0 replays |
| 3 | format | `yarn format:check` | **0** | 0 unformatted files |
| 4 | build | `TURBO_FORCE=true yarn build` | **0** | 14/14 · `0 cached, 14 total` |
| 5 | frontend typecheck | `yarn workspace @openvaa/frontend check` | **0** | 2,684 files · 0 errors · 0 warnings |
| 6 | repo typecheck | `TURBO_FORCE=true npx turbo run typecheck` | **0** | 22/22 · `0 cached, 22 total` · `grep -c 'error TS'` → 0 |
| 7 | **E2E, cardinal, last** | `yarn test:e2e` | **0** | **135 passed · 0 failed · 0 flaky · 0 skipped · 0 did-not-run**, after `yarn db:reset` (exit 0) and against one preflight-verified fresh dev server |

All seven at **one HEAD, `8372d0dff`**, with the product tree asserted clean before gate 1 and after
gate 7.

---

## Completeness

**This register's corpus is exactly 30 rows.** The count is asserted here, about this document, in
the manner 143 and 144 asserted theirs — a corpus that is not asserted about itself can be quietly
extended, and an extended corpus is no longer a negative control.

30 rows × 5 measurement cells = **150** placeholder occurrences at creation. Each plan clears only its
own rows, so the running count is itself an assertion.

| Class | Count | Rows |
|---|---|---|
| OLD/blind halves | **2** | `B1-OLD`, `B2-OLD` |
| diagnostic rows | **4** | `D1-ANON-PRE`, `D2-SVC-PRE`, `D3-COL-PRE`, `D4-CTRL-PRE` |
| RED halves | **4** | `P1-RED`, `U1-RED`, `P2-RED`, `A1-RED` |
| GREEN halves | **4** | `P1-GREEN`, `U1-GREEN`, `P2-GREEN`, `A1-GREEN` |
| must-NOT-fire rows | **3** | `U2`, `A2-PRE`, `A2-POST` |
| strand-proof rows | **4** | `S1`, `S2`, `S3`, `S4` |
| deferred rows | **1** | `CI1` |
| gate rows | **7** | `G1`, `G2`, `G3`, `G4`, `G5`, `G6`, `G7` |
| **Subtotal, the eight classes** | **29** | |
| **+ the one row outside them** | **+ 1** | `T1` |
| **= total register rows** | **30** | |

2 + 4 + 4 + 4 + 3 + 4 + 1 + 7 = **29**; **29 + 1 = 30**. The arithmetic closes, and it closes against
the register's **actual** row count measured at the closing HEAD by the same anchored pattern the
plans' `<verify>` blocks use:

```
grep -cE '^\| (B1-OLD|B2-OLD|D1-ANON-PRE|D2-SVC-PRE|D3-COL-PRE|D4-CTRL-PRE|P1-RED|P1-GREEN|U1-RED|U1-GREEN|U2|P2-RED|P2-GREEN|A1-RED|A1-GREEN|A2-PRE|A2-POST|S1|S2|S3|S4|T1|CI1|G1|G2|G3|G4|G5|G6|G7) \|' 145-NEGATIVE-CONTROL-LEDGER.md
```

→ **30**. Asserted, not assumed.

**One row sits outside the eight classes above and is counted separately so the arithmetic closes:**
`T1`, the rename type-integrity row owned by `145-06`. It is neither a half of a pair nor a gate — it
is the TMPL-04 rename's own proof that the tree still typechecks with no cast escape. The eight
classes plus `T1` are the 30.

### Every cell is filled, from a run that executed

**The whole-register placeholder count at the closing HEAD is `0`** — the same anchored grep above,
piped through `grep -o` for the placeholder word, returns **zero occurrences across all thirty rows**.
That number is **checked, not asserted**: it fell 150 → 120 → 100 → 90 → 80 → 80 → 60 → 55 → 35 → 0,
and each step was read back out of the commit graph with `git show <commit>:<this file>` rather than
copied from a plan summary (§ Final counts → Rows per plan).

**No row carries an outcome it did not measure.** Concretely, and in the only form that matters:

- **0 borrowed observations.** Every one of the 30 rows was measured inside this phase, each citing
  its own log path and the HEAD its own half was taken at. No baseline is inherited from 139, 143 or
  144 — the header said none was inheritable, and none was used.
- **0 cache replays admitted as evidence.** Every turbo-mediated row and gate reports
  `cache bypass, force executing`; a replayed exit code is a claim about a *previous* tree, and none
  is recorded here as though it were a measurement of this one.
- **1 row is deferred and says so.** `CI1` carries its three confirmed source facts and, in the same
  cell, the plain statement that **the runner half is unobserved**. It is the one row in this register
  that closes without a confirmed outcome, and that is the correct outcome for it — **a grep is not a
  run**.
- **2 VOID attempts and 1 RED gate attempt are disclosed rather than deleted.** A void is not a red
  and a red gate is not a flake; all three are kept with their logs, because a register that hides its
  failed attempts cannot be trusted about its successful ones.

---

*Phase: 145-default-seed-template-repair*
*Opened: 2026-08-24 at HEAD `7e26bfd98`*
*Closed: 2026-08-24 by `145-08` — 30 rows, 0 placeholder cells, 0 borrowed observations, 0 cache replays admitted as evidence; seven gates green at HEAD `8372d0dff`, cardinal E2E gate last: 135 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run. Row `CI1` closes **deferred**.*
