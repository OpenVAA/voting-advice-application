---
phase: 145
slug: default-seed-template-repair
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-24
---

# Phase 145 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Register origin:** authored at plan time. Eight of the nine PLAN files (`145-01` … `145-08`) carry a
parseable `<threat_model>` block; the mid-phase insert `145-04.1` does not — see the coverage gap
noted under `T-145-31` and in the audit trail. This audit **verifies mitigations exist** — it does not
scan for new threats. Depth: ASVS level 1 (grep/read verification against the implementation at HEAD
`80c0263e1`); block on **high**.

**Proportionality.** This phase's subject matter *is* an access-control defect: the default seed
template produced `published` candidate rows that the three-clause `anon_select_candidates` policy
still hid, and the defect survived ~11 weeks under a green suite because every existing check read as
`service_role`, which bypasses RLS entirely. The register is therefore unusually security-dense for a
seed-data phase, and it is dominated by one question: **is the anon predicate satisfied by changing
the data, or by relaxing the policy?** Every mitigation in the `T-145-01` / `T-145-15` / `T-145-16`
cluster exists to force the first answer. The phase's substantive security **benefit** is a standing
anon-client regression guard (V4 Access Control) with a role-differential control of its own — the
repository's first check that reads as `anon` rather than as `service_role`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| voter app (anon) → `candidates` via RLS | `anon_select_candidates` is a **three-clause** predicate (`published = true AND terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()`). This is the boundary the phase's whole defect lives on | Publicly readable candidate rows |
| seed template → anon visibility | Whether a seeded row crosses the boundary above is decided by template **data**, never by policy text. The phase's central prohibition | `published`, `terms_of_use_accepted` column values |
| `bulkImport` `PUBLISHABLE_TABLES` auto-default → every template | A default at this layer reaches **all** templates including `e2e/base`; stamping acceptance here would destroy two deliberate in-repo negative controls (`ca-aa-hidden`, `ca-aa-unregistered`) | `published` column default |
| test harness → database role | `makeReadClient` authenticates as `service_role` (RLS bypassed); `makeAnonClient` as `anon`. A mis-keyed "anon" client reproduces, inside the guard built to prevent it, the exact blindness it closes | JWT role claim |
| CI runner → job log | `supabase status` key material is appended to `$GITHUB_ENV`; an `echo` to stdout or a `set -x` would print a credential into a public job log | Local-instance anon / service-role keys |
| repository → committed key material | The integration test carries two verbatim JWT literals as fallbacks. Only the published local `supabase start` demo keys (`iss: supabase-demo`) are admissible; a hosted-project key would be a live credential leak | JWT literals in tracked source |
| served application → Playwright specs | The global-setup preflight asserts the page under test came from **this** checkout via the `/@fs` path echo, and aborts before any spec body executes. No flag or env var skips it | Merge/gate admission |
| probe project → cardinal E2E gate | The demo template and the gate's `e2e/base` fixture are different datasets; a probe leaking into the gate makes the gate a result about the wrong data | Gate verdict |
| `external_id` (durable upsert key) → `seed_` teardown prefix | Renaming identifier base names is safe only while the `seed_` prefix stays invariant, because `bulk_delete` reaches rows by `LIKE prefix%` | Seeded row lifetimes |
| developer working tree → git history | Four transient injections across `145-05` and `145-07`; any reaching a commit is a durable regression — one of them would have silently reverted `145-04`'s fix | `packages/dev-seed` source |
| ledger → downstream records | `ROADMAP.md` and `REQUIREMENTS.md` evidence clauses quote ledger rows; a whole-file write destroys every entry outside the edit window | Phase/requirement headings, evidence clauses |

---

## Threat Register

**30 numbered threats (`T-145-01` … `T-145-30`, no `T-145-06`) + `T-145-SC` (declared once per plan,
8 instances) + `T-145-31` added retroactively by this audit. All closed.**

Several threats are carried by more than one plan; each appears once below, under the plan that owns
its strongest mitigation, with the co-carrying plans named.

### Anon RLS boundary — the phase's subject (`145-01`, `145-04`)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-145-01 | Information disclosure | `anon_select_candidates` — relaxing the predicate to make seeded rows visible | **high** | mitigate | The rejected D-02 option C. **Verified at HEAD:** `git diff --name-only` over the whole phase range shows **zero** files under `apps/supabase/migrations/`. The predicate was satisfied by data, not by policy | closed |
| T-145-16 | Information disclosure | The anon read predicate, via `145-04`'s fix | **high** | mitigate | Same boundary, restated at the fix site. **Verified:** the fix is one key on one template's generated rows; no migration byte in the diff. Relaxing the policy would have made genuinely unaccepted-terms candidates publicly readable | closed |
| T-145-15 | Tampering | Extending the `PUBLISHABLE_TABLES` auto-default to stamp acceptance globally | **high** | mitigate | **Verified in code:** the `supabaseAdminClient.ts` diff is **comment-only** — zero changed executable lines; `PUBLISHABLE_TABLES` is byte-unchanged. The added comment carries an explicit `⚠ Do NOT "fix" this by stamping terms_of_use_accepted here` with the reason (it would backdate `e2e/base`'s two negative controls) | closed |
| T-145-04 | Tampering | Backdating terms-of-use acceptance | medium | mitigate | **Verified in code:** `terms_of_use_accepted` is written at exactly one new site — `candidates-override.ts:167`, inside the generated-candidates loop under `${ctx.externalIdPrefix}cand_` with `is_generated: true`, in a wholly fabricated demo template. `e2e/base.ts` and `permittedKeys.ts` are **absent** from the phase diff, so the two deliberately-unaccepted rows (`base.ts:1076`, `:1208`) survive intact | closed |
| T-145-17 | Repudiation | A corrected comment that is itself wrong | low | mitigate | **Verified in code:** the comment quotes the three-clause predicate verbatim from its named authority migration rather than paraphrasing, and closes with a standing caution that the *other* publishable tables' anon predicates were **NOT AUDITED** — declaring the un-audited scope rather than implying completeness | closed |

### Guard integrity — the check must read as `anon` (`145-02`)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-145-09 | Elevation of privilege | Using a service-role key for the "anon" client — the two keys differ by one JWT claim and sit in the same file | **high** | mitigate | **Verified by decoding both literals:** `default-template.integration.test.ts:126` carries `{"iss":"supabase-demo","role":"service_role"}` (used by `makeReadClient`), `:158` carries `{"iss":"supabase-demo","role":"anon"}` (used by `makeAnonClient`). Detection is designed in via `T-145-02` rather than trusted to review | closed |
| T-145-02 | Repudiation (false assurance) | A guard that could pass while authenticating as service_role | **high** | mitigate | **Verified in code:** the `accounts` role differential runs **first, inside the same `it`** (`:479-492`) — anon rowcount asserted `toBe(0)`, service_role asserted `toBeGreaterThan(0)`, both labelled `(role control)`. `accounts` carries no anon SELECT policy, so a genuinely-anon credential must see zero. Also measured as row `D4-CTRL-PRE` in `145-01`, in the same session as `D1`/`D2` | closed |
| T-145-03 | Information disclosure | The anon fallback literal committed to a tracked file | **high** | mitigate | **Verified:** both literals carry `iss: supabase-demo` — the published local `supabase start` demo keys, not hosted-project credentials. The repository already commits the demo service-role key one function above. CI overrides the fallback from the running instance. Ledger records key *names* and role labels only; `0` matches for the JWT prefix in the ledger | closed |
| T-145-07 | Information disclosure | The CI export step printing a credential into a job log | medium | mitigate | **Verified in code:** `.github/workflows/main.yaml` appends to `$GITHUB_ENV` only — no `echo` to stdout; `set -x` appears in the file exactly once, inside the comment that forbids it | closed |
| T-145-08 | Denial of service (false signal) | The CI export silently breaking under a future Supabase CLI (`setup-cli@v1` pins `version: latest`) | medium | mitigate | **Verified in code:** `test -n "$ANON_KEY" \|\| { echo "::error::ANON_KEY missing from supabase status"; exit 1; }`. Converts a wiring loss into a named failure at the export step instead of an empty variable → wrong fallback key → 401 → a red that reads as a seed regression | closed |

### Instrument and harness integrity (`145-03`, `145-05`, `145-06`)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-145-10 | Spoofing | The served application under test (carried by `145-03`, `145-05`, `145-08`) | **high** | mitigate | **Verified in code:** the phase's entire `playwright.config.ts` diff is **one line** (adding the probe to `PROBE_TEST_MATCH`); no `webServer` block added, `globalSetup: './global-setup.ts'` intact at `:292`. Gate 7's preflight was confirmed from the run's own `/@fs` path echo | closed |
| T-145-18 | Repudiation (false assurance) | Tuning the guard to produce the desired colour across its four measured halves (carried by `145-04`, `145-05`, `145-06`) | **high** | mitigate | **Verified by commit archaeology:** no `145-04` or `145-05` commit touches `packages/dev-seed/tests` at all, so the instrument is provably byte-identical across `P1-RED`/`P1-GREEN`/`P2-RED`/`P2-GREEN`; `145-06`'s only touch of the guard file is **comment-only** (zero non-comment lines in the diff) | closed |
| T-145-11 | Tampering (false coverage) | A probe file matching no project — 6 tests were unreachable for ~16 phases this way | medium | mitigate | **Verified in code:** `defaultTemplateResults` is registered in `PROBE_TEST_MATCH` (`playwright.config.ts:17`) and the orphan guard (`:36-50`) **throws** on any unlisted `*.probe.spec.ts`, failing every invocation including `--list` | closed |
| T-145-12 | Denial of service (void gate run) | The probe's `default` dataset contaminating the gate, which asserts against `e2e/base` (carried by `145-03`, `145-08`) | **high** | mitigate | **Verified on both sides:** every probe test is `@probe`-tagged and the root script is `"test:e2e": "playwright test … --grep-invert @probe"` (`package.json:28`); and `145-08` ran `yarn db:reset` plus the suite's own data-setup projects between gate 6 and gate 7 — the protocol Phase 144 required after a contaminated-database void attempt | closed |
| T-145-14 | Repudiation | A screenshot pair whose halves came from different sessions or datasets | medium | mitigate | **Verified in code:** `const HALF = process.env.GSD_145_HALF ?? 'unknown'` (`:88`) is encoded into the screenshot filename; each ledger row records the HEAD its own half was measured at. A mismatched pair is visible in the filenames rather than assumed away | closed |

### Working-tree hygiene — four transient injections (`145-05`, `145-07`)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-145-19 | Tampering | An injection reaching a commit or a push (carried by `145-05`, `145-07`) | **high** | mitigate | One injection live at a time, no commit while live, post-gated every iteration with `git checkout --`, a blob-hash comparison and a clean `git status`; `packages` asserted absent from `145-07`'s commit diff. **Independently re-verified 2026-08-24: `git status --porcelain -- packages apps tests .github` → empty; probe/injection residue `find` → 0 matches** | closed |
| T-145-20 | Tampering | Restoring to the **wrong** target — the ledger's creation-time hash table predates `145-04`, so restoring `candidates-override.ts` against it would have silently reverted the fix | **high** | mitigate | The task recorded its own restore target at the injection HEAD; an explicit prohibition forbids the creation-time table for that file; the ledger carries a note stating the distinction. **Verified at HEAD:** `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` still present at `candidates-override.ts:167` | closed |
| T-145-25 | Tampering | Reverting the fix while reverting the naming, in `145-07`'s old-idiom injection | **high** | mitigate | Only the two files the rename touched may be transiently restored, sourced from the commit immediately preceding the rename — which already carries the fix. Reverting the candidates override forbidden by prohibition; the acceptance-timestamp literal asserted present at task close, and confirmed by this audit at HEAD | closed |
| T-145-23 | Tampering (silent data regression) | The alliance-membership map — the one lookup in the package keyed by identifier **value** while the matrices index positionally; a partial rename yields alliances with zero members and raises no error | **high** | mitigate | **Verified in code:** the rename is **one atomic commit** (`3bf417c83`) touching `default.ts`, `alliances-override.ts` and `nominations-override.ts` together; the map's membership arrays moved from `party_*` to `org_*` in that same commit. Detected additionally by the integration test's alliance and organization nomination relational assertions | closed |
| T-145-24 | Repudiation | A completeness grep passing over its own counter-example — a docstring quoting a retired identifier | medium | mitigate | **Verified at HEAD:** every retired literal counted package-wide including prose — `party_blue`, `party_green`, `party_social`, `party_rural`, `party_people`, `party_red`, `party_coast`, `party_values`, `'c_0` → **0 occurrences each**. The divergence block describes the change in words rather than by naming retired values | closed |

### Data lifetime and the strand proof (`145-06`, `145-07`)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-145-22 | Denial of service (stranded rows) | Renaming a durable upsert key leaving old-idiom rows unreachable by teardown | medium | mitigate | `145-07` **is** the mitigation and it is a measurement, not an argument: the strand was produced deliberately (seed old idiom → seed renamed idiom with no intervening reset → 16 organizations as 8+8, 10 constituencies as 5+5), then teardown measured against it → **0/0 of either idiom**. Mechanism named from source: `runTeardown` keys on the unchanged `seed_` prefix via `bulk_delete`'s `LIKE prefix%`, so its reach is independent of the identifier idiom | closed |
| T-145-26 | Repudiation | Inferring a count instead of querying it | medium | mitigate | Every count taken by PostgREST query against the live database at that step and saved to a JSON artifact (`count-S1-1.json` … `count-S4-1.json`); inferring from the template's declared sizes forbidden by prohibition. Projections are labelled projections; the ledger records observations. The teardown's 814-row total is recorded **with its limit** — 13 of 63 excess rows measured directly, the rest labelled *consistent-with* rather than counted | closed |
| T-145-21 | Denial of service | A database left holding published-false candidates or the strand state (carried by `145-05`, `145-07`) | medium | mitigate | `145-05` step 5 re-seeds after the restore with its log as an acceptance criterion; `145-07` step 4 resets and re-seeds with the probe re-run confirming the end state (`S4`: 0 old / 8 new organizations, 0 old / 5 new constituencies); `145-08` resets again before the cardinal gate | closed |
| T-145-05 | Tampering (identifier injection) | `external_id` values through the bulk upsert | low | **accept** | See AR-01 | closed (accepted) |

### Phase close — evidence and record integrity (`145-08`)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-145-30 | Repudiation | Retrying a red E2E test to green | **high** | mitigate | Forbidden by prohibition and by CLAUDE.md's cardinal rule, which admits no known-flaky exemption and counts a did-not-run as a failure. **The control demonstrably fired:** gate 1's first attempt failed at `145-07`'s closing HEAD, was **disclosed in the ledger rather than deleted**, and was root-caused rather than re-run — "a phase that hides its own failed gate has no standing to publish the green one." Final gate 7: `135 passed · 0 failed · 0 flaky · 0 skipped · 0 did-not-run` | closed |
| T-145-28 | Tampering (record destruction) | A whole-file write to `ROADMAP.md` / `REQUIREMENTS.md` destroying every entry outside the edit window | **high** | mitigate | Forbidden by prohibition; detected by acceptance criteria comparing heading counts against the previous commit. **Measured:** phase-heading count unchanged (17), requirement-heading count unchanged (40), neither file shrank, 0 files outside `.planning/` in the commit | closed |
| T-145-27 | Repudiation (false satisfaction) | Evidence clauses satisfiable by rewriting prose | **high** | mitigate | Each TMPL-03 / TMPL-04 clause cites measured row IDs, artifact filenames or exit codes rather than prose, and the acceptance criteria grep for specific row IDs and a screenshot filename. A clause citing prose can be satisfied by rewriting the prose; one citing a row cannot | closed |
| T-145-29 | Repudiation | Recording an unobserved CI half as confirmed | medium | mitigate | **Verified in the artifact:** row `CI1` closes **DEFERRED**, its runner half named as unobserved, with the discharging event (this branch's first pull) stated in the residue section. Filling it green on the strength of a source grep is named as "the failure this phase's whole method exists to refuse" | closed |

### Cross-cutting

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-145-SC | Tampering | Supply chain — npm/pip/cargo installs (declared once per plan; 8 instances) | low | **accept** | See AR-02. **Verified at HEAD:** `git diff --name-only` over the whole phase range → **zero** changes to any `package.json` or `yarn.lock`. A JWT-decoding package was considered for the role check and **rejected**, keeping the guard dependency-free | closed (accepted) |
| T-145-31 | Denial of service | *(retroactive — added by this audit)* `145-04.1` carries **no `<threat_model>` block**, the one plan of nine without one; its change is the number-answer emitter (`emitters/answers.ts`) | low | mitigate | Reviewed directly since the plan-time register does not cover it. The change **narrows** a value range rather than widening one — number answers now draw inside the question's declared `custom_data.min`/`max` instead of a hardcoded `0`–`100`, so emitted answers can be normalized by `@openvaa/core` rather than throwing. Input is fabricated demo data; no new key, trust boundary, auth path, network endpoint or schema change. A malformed declaration (`min > max`) is deliberately **not** papered over — faker throws and the seed run fails loudly. Determinism preserved (one draw per question whatever the range) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-145-05 | `external_id` values reach `bulk_upsert` as **quoted literals**, not as SQL identifiers. The unquoted-identifier surface is the **key** path, a separate concern already narrowed by Phase 144's Pass 0 guard and filed as milestone residue (`2026-08-23-bulk-upsert-rpc-interpolates-column-identifiers.md`, and Phase 144's AR-03). The rename introduces no new key names, so it does not widen that surface. Severity low; below the `high` block threshold | Phase 145 plan author (`145-06`), disposition `accept` at plan time | 2026-08-24 |
| AR-02 | T-145-SC | No install task exists anywhere in Phase 145; `145-RESEARCH.md` § Package Legitimacy Audit records zero package additions in scope, every library already resolved through the repository's Yarn catalog, and this audit confirms zero `package.json` / `yarn.lock` bytes changed across the phase. Severity low | Phase 145 plan authors (all eight plans carrying a register), disposition `accept` at plan time | 2026-08-24 |
| AR-03 | T-145-04, T-145-13 | Diagnostic payloads, run logs and full-page screenshots written under `${TMPDIR}/gsd-145/` — **outside the repository**, never committed. Contents are counts, entity-type keys and rendered pages of a synthetic `seed_`-prefixed demo dataset with fabricated candidate names. No real personal data exists in the dataset. Severity low | Phase 145 plan authors (`145-01`, `145-03`), disposition `accept` at plan time | 2026-08-24 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-24 | 32 (30 numbered + `T-145-SC` + `T-145-31` retroactive) | 32 | 0 | `/gsd-secure-phase 145` — orchestrator, ASVS L1 verification |

### Audit 2026-08-24 — method and independent checks

Register origin: **authored at plan time** (8 of 9 PLANs carry `<threat_model>`), so this run verified
mitigations rather than scanning for new threats. Short-circuit conditions met
(`threats_open: 0` ∧ `register_authored_at_plan_time: true` ∧ `asvs_level == 1`), so no deeper
L2/L3 boundary-placement or end-to-end trace pass was required.

Attestation coverage in SUMMARY files was **thin**: only `145-02` and `145-07` carry an explicit
`## Threat Flags` section; the other seven attest in body prose or not at all. The register was
therefore checked against the implementation directly rather than accepted on the summaries' word.
Independent re-verification performed at HEAD `80c0263e1`:

| Check | Threats | Result |
|-------|---------|--------|
| Phase-range `git diff --name-only -- apps/supabase/migrations` | T-145-01, 16 | **zero files** — predicate satisfied by data, not policy |
| `supabaseAdminClient.ts` phase diff contains zero changed executable lines | T-145-15 | confirmed — comment-only, `PUBLISHABLE_TABLES` byte-unchanged |
| `terms_of_use_accepted` write sites across `packages/dev-seed/src` | T-145-04 | one new site (`candidates-override.ts:167`), inside the generated loop; `e2e/base.ts` + `permittedKeys.ts` absent from the phase diff |
| Base64url-decoded `role` claim of both committed JWT literals | T-145-03, 09 | `:126` → `service_role`, `:158` → `anon`; both `iss: supabase-demo` (published local demo keys, not hosted) |
| `accounts` role differential present, first, inside the anon `it` | T-145-02 | confirmed, `:479-492`, both control labels present |
| `$GITHUB_ENV`-only append; `set -x` absent outside its prohibiting comment | T-145-07 | confirmed |
| `test -n "$ANON_KEY"` guard with its named error string | T-145-08 | confirmed |
| `webServer` absent from the phase's `playwright.config.ts` diff; `globalSetup` intact | T-145-10 | confirmed — phase diff is one line |
| Probe registered in `PROBE_TEST_MATCH`; orphan guard throws on unlisted files | T-145-11 | confirmed, `:17`, `:36-50` |
| `@probe` tag on every probe test **and** `--grep-invert @probe` in the root gate script | T-145-12 | confirmed both sides, `package.json:28` |
| No `145-04` / `145-05` commit touches `packages/dev-seed/tests`; `145-06`'s touch is comment-only | T-145-18 | confirmed — instrument byte-identical across all four halves |
| Rename landed as one atomic commit covering template **and** membership map | T-145-23 | confirmed, `3bf417c83` |
| Retired identifier occurrences package-wide, prose included (9 literals) | T-145-24 | **0 each** |
| `git status --porcelain -- packages apps tests .github`; injection/probe residue `find` | T-145-19, 20, 25 | empty; 0 matches |
| Acceptance-timestamp literal survives the `145-07` revert cycle | T-145-20, 25 | confirmed at `candidates-override.ts:167` |
| `GSD_145_HALF` encoded into the screenshot filename | T-145-14 | confirmed, `:88` |
| Phase-range diff over any `package.json` / `yarn.lock` | T-145-SC | **zero changes** |

**Interaction with Phase 144.** Phase 145 writes a **new key** across Phase 144's Pass 0 boundary:
`terms_of_use_accepted` on every generated candidate row. It is on the derived allow-list
(`permittedKeys.ts:296`), so it is admitted rather than bypassing the guard — and Phase 145's green
gates (1,821 unit tests, 135 E2E, 0 failed) independently re-confirm Phase 144's `T-144-24` /
`T-144-48` false-positive budget against a template that Phase 144 did not exercise in this shape.
Phase 145 touched neither `permittedKeys.ts` nor `writer.ts`.

**Register coverage gap.** `145-04.1` was inserted mid-phase (`3c687b4d4`) and is the one plan of nine
with no `<threat_model>` block, so its two source files were reviewed directly rather than verified
against a register — recorded above as `T-145-31`. The finding is not that the change is unsafe (it
narrows a range and fails loud), but that a mid-phase insert can enter the code path without a
register entry. Worth a prohibition in the phase-insert workflow.

**Note on register composition.** Unusually for a seed-data phase, the security weight here is real
rather than incidental: `T-145-01` / `T-145-15` / `T-145-16` guard an RLS predicate against being
relaxed for convenience, and `T-145-02` / `T-145-09` guard the new check against the precise blindness
class — reading as `service_role` — that let the original defect survive ~11 weeks under a green
suite. Had `T-145-15` failed, the fix would have silently destroyed two in-repo negative controls in
`e2e/base`; had `T-145-01` failed, unaccepted-terms candidates would be publicly readable in
production.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (AR-01, AR-02, AR-03)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-24
