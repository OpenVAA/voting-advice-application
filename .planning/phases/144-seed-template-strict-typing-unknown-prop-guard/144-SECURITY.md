---
phase: 144
slug: seed-template-strict-typing-unknown-prop-guard
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-24
---

# Phase 144 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Register origin:** authored at plan time. All seven PLAN files (`144-01` … `144-07`) carry a
parseable `<threat_model>` block. This audit **verifies mitigations exist** — it does not scan for new
threats. Depth: ASVS level 1 (grep/read verification against the implementation at HEAD `73337217b`);
block on **high**.

**Proportionality.** Four of the seven plans ship **zero runtime bytes** (`144-01`, `144-06`, `144-07`
entirely; `144-02` types and declarations only). The register is therefore dominated by *evidence
integrity* and *working-tree hygiene* threats rather than shipped attack surface. The phase's one
substantive security **benefit** is `144-04`'s Pass 0 guard (V5 Input Validation), which narrows a
pre-existing surface — see T-144-28.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| template author → seed pipeline (Pass 0) | `assertKnownRowProps` is the row-level input-validation boundary; every key on every seeded row crosses it before reaching the RPC | Developer-authored template rows (collection keys, column names, values) |
| Pass 0 → `bulk_import` RPC | Keys not on the derived allow-list are rejected before Postgres sees them; the RPC quotes values but not identifiers | Column identifiers interpolated into generated SQL |
| template author → `validateTemplate` (zod) | Template-level input validation; after D-07 it runs on built-ins too, not only developer-supplied custom templates | Whole template objects and nested fragments |
| TypeScript deny/exclude tables → RPC `skip_columns` | Two files in two languages that must agree; only a parity test can see a divergence | Column-name literals |
| `permittedKeys.ts` → every seed write path | Single authority consulted by `bulkImport`, `linkJoinTables` and Pass 0; an omission is a false positive in every `perm-*` E2E setup project | Allow-list / deny-list key sets |
| `LINK_SENTINELS` → live join-table writes | Declaration became control flow; a wrong table, column or on-conflict string is a runtime failure against a live database | Join-table rows, jsonb scoping columns |
| repository → CI enforcement | `turbo run typecheck` became a blocking gate over every package declaring the task | Merge admission |
| developer working tree → git history | 15 transient injections across the phase (widened tsconfig, deleted zod declarations, deleted fixture arm) and 13 `__probe144*` files; any reaching a commit is a durable weakening | Source files under `packages/dev-seed`, `tests/` |
| seed CLI → local Postgres | Negative-control halves write real rows via the service-role key | `negctl144-`-prefixed seed rows |
| measurement instrument → evidence record | Turborepo's cache sits between the command and the exit code the ledger records; a replayed result is indistinguishable from a fresh one without the verdict line | Ledger rows, gate verdicts |
| ledger → downstream artifacts | `REQUIREMENTS.md`, ROADMAP, the audit and the todos quote `## Final counts`; a wrong number propagates to five documents | Corpus counts, evidence clauses |

---

## Threat Register

**57 numbered threats + `T-144-SC` (declared once per plan, 7 instances). All closed.**

### `144-01` — negative-control ledger (zero product bytes)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-144-01 | Tampering | `packages/dev-seed/tsconfig.json` transiently widened | high | mitigate | Live only inside one loop iteration; restore proven by `git diff --exit-code` + `git hash-object` vs header blob + `git log` showing no commit on that path. Verified: tree clean at HEAD | closed |
| T-144-02 | Tampering | `schema.ts` — rows `Z1-OLD`…`Z4-OLD` delete live schema declarations | high | mitigate | One deletion live at a time, `git checkout --` per iteration, blob hash asserted at task close. Verified: `schema.ts` intact, 8 `.strict()` calls present | closed |
| T-144-03 | Tampering | Seven `__probe144*` files under `packages/dev-seed` | high | mitigate | Probe name is the marker; `find` asserted separately because `git diff` cannot see untracked files. **Independently re-verified 2026-08-24: `find` in both glob forms → 0 matches** | closed |
| T-144-04 | Repudiation | Turbo cache replay recorded as a fresh measurement (`turbo.json:18-22` gives `typecheck` no `"cache": false`) | high | mitigate | `TURBO_FORCE=true` on every turbo-mediated evidence run; cache verdict is a ledger **column**; `yarn lint:check --force` named and forbidden | closed |
| T-144-05 | Repudiation | A ledger row copying its number from `144-RESEARCH.md` instead of measuring it | high | mitigate | Each task states the prior explicitly and declares disagreement a finding; per-row log path + HEAD; borrowed-observation word asserted at 0 | closed |
| T-144-06 | Tampering | Local Postgres dirtied across negative-control halves | medium | mitigate | `db:reset` before the first half, `db:seed:teardown` between every half; dedicated `externalIdPrefix` per fixture | closed |
| T-144-07 | Tampering | Concurrent dev server / Playwright run picking up a transient injection | medium | mitigate | `<hygiene_loop>` constraint 5 forbids `yarn dev` and any Playwright command for the whole plan; the E2E gate belongs to `144-07`, after the last revert | closed |
| T-144-08 | Information disclosure | Run logs under `$TMPDIR`; seed-CLI logs touch a service-role-authenticated client | low | **accept** | See AR-01 | closed (accepted) |

### `144-02` — `permittedKeys` / `LINK_SENTINELS` derivation

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-144-09 | Tampering | Source (4) omitted or incomplete — 2,955 key occurrences depend on it | **critical** | mitigate | Transcribed from the SQL read at execution time, not from a document; two-directional parity spec fails when the const and the `CASE` block disagree; `parent_nomination` / `candidateExternalId` greps in acceptance criteria | closed |
| T-144-10 | Tampering | Two bare non-underscore sentinel forms omitted — 76 rows depend on them | high | mitigate | Stated non-negotiable with row counts. **Verified in code:** `linkSentinels.ts:176` carries `constituencyGroups` / `constituency_groups`; `:188` carries bare `'constituencies'` | closed |
| T-144-11 | Spoofing | A camelCase alias permitting a key resolving to a column on no table (`organizationId` → `organization_id_nom`, last-wins) | high | mitigate | Camel forms derived mechanically from `FIELD_MAP`, so the collision is admitted nowhere. **Verified:** `organizationId` occurs in `permittedKeys.ts` only inside the explanatory docblock (`:136-138`), never as an admitted key. Filed as residue → `2026-08-23-column-map-organization-id-collision.md` | closed |
| T-144-12 | Tampering | `bulkImport`'s stripping behaviour changed while moving the two consts | high | mitigate | Moved consts required byte-identical; strip loop, `key.startsWith('_')` rule, `candidateExternalId` read and nomination polymorphism branch untouched; `supabaseAdminClient.test.ts` + `writer.test.ts` gate the task | closed |
| T-144-13 | Repudiation | Typecheck row recording a cache replay | high | mitigate | `TURBO_FORCE=true` on every evidence run; `executing` asserted, `0 cached` recorded | closed |
| T-144-14 | Tampering | Committed negctl fixtures turned into type errors by the widened tsconfig | high | mitigate | Fixtures unannotated by construction so excess-property checking has no contextual type; annotating them forbidden; `git diff --exit-code -- packages/dev-seed/tests/fixtures` clean | closed |
| T-144-15 | Repudiation | `Template` doc comment left asserting something the code stopped doing | medium | mitigate | Rewritten in the same edit (same reasoning that makes `resolve-template.ts:16` record target R-6) | closed |
| T-144-16 | Tampering | Three `__probe144*` files during Task 3 | medium | mitigate | Untracked, name-marked, removed in-iteration; `find` asserted separately from `git status`. Re-verified 2026-08-24 | closed |

### `144-03` — `linkJoinTables` const-driven rewrite

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-144-17 | Tampering | Rewrite silently changing seeded link data (`??` precedence, either normaliser, malformed skip, missing-parent skip, empty-array no-op, rule order) | **critical** | mitigate | Golden capture taken **before** the first edit, diffed after Tasks 1 and 2, any difference a stop; all six named as obligations with a dedicated case each in the 17-case `linkSentinels.test.ts`; full E2E suite in `144-07` as backstop (gate 7 green) | closed |
| T-144-18 | Tampering | `attachSentinels` consuming `rule.keys` changing which elections a category is scoped to | high | mitigate | Both affected paths re-measured at zero in-tree exploitation here rather than cited; golden diff required empty across the change | closed |
| T-144-19 | Tampering | Transcription error in a join-table name, parent/child column or on-conflict string | high | mitigate | **Verified in code:** `refTable` is a literal union (`linkSentinels.ts:130`), so a typo is a compile error, not a runtime 404; `onConflict` strings carried verbatim (`:183`, `:195`); exhaustiveness arm covers a new target kind | closed |
| T-144-20 | Repudiation | Row `DRV-NEW` measured against a different pair than `DRV-OLD` | high | mitigate | Identical pair (`elections` / `_constituencies`) reused; both halves' log paths and HEADs recorded; restore proven three ways (`git diff` 0, blob `012ebdaa…`, clean `git status`) | closed |
| T-144-21 | Repudiation | A tautological derivation spec — expectation computed from the const it polices | high | mitigate | Expectation hand-enumerated and the file states so and why; the two-run control proves the spec non-vacuous (11-vs-10 assertion fired red on injection) | closed |
| T-144-22 | Tampering | Two parallel agents (`144-03` ∥ `144-05`) clobbering the shared ledger | medium | mitigate | Two named rows + one residue heading only; wholesale rewrites forbidden; re-read required immediately before every edit; global count assertions forbidden | closed |
| T-144-23 | Tampering | Transient `LINK_SENTINELS` edit reaching a commit | medium | mitigate | One injection live at a time, reverted in-iteration; empty `git diff`, blob hash and clean `git status` at task close | closed |

### `144-04` — Pass 0 runtime unknown-prop guard (the V5 control)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-144-24 | Denial of service | A Pass 0 false positive failing every E2E setup project | **critical** | mitigate | 30-template classification re-run **before** the guard existed and kept as a registry-iterating standing spec with an apparatus control; `writer.test.ts` fixtures classified separately; full E2E suite green at gate 7 | closed |
| T-144-25 | Denial of service | Deny-list seeded literally from `skip_columns`, rejecting `project_id` on every row | **critical** | mitigate | Disposition fixed per column with reason and measured row count; only `entity_type` denied; four documented non-throwing exclusions; two-directional parity spec vs the SQL array. **Hardened post-review by `6fe28f9c3` (CR-01):** `deriveDeniedKeys` now runs the denied set through the same `camelFormsFor` derivation as the permitted set (`permittedKeys.ts:894`), closing the `entityType` camel-form bypass | closed |
| T-144-26 | Denial of service | Guard requiring `external_id`, reddening ~20 existing fixtures for the wrong reason | high | mitigate | **Verified in code:** `describeRow` (`assertKnownRowProps.ts:59-65`) falls back to the row index and never phrases absence as a complaint; a case asserts the message never says "required"/"missing"; 525 unit tests green with every existing fixture unedited | closed |
| T-144-27 | Tampering | Pass 0 reading `bulkData` and going blind to `app_settings` | high | mitigate | **Verified in code:** `writer.ts:181` calls `assertKnownRowProps(data)` on pre-deletion data; zero occurrences of `assertKnownRowProps(bulkData)`; reason recorded at the call site (`:124`) | closed |
| T-144-28 | Elevation of privilege | Unknown keys reaching the RPC as dynamically interpolated SQL identifiers — `_bulk_upsert_record` quotes values but not keys | high | mitigate (partial — residue transferred) | **Substantive narrowing delivered:** nothing not on the derived allow-list now reaches `bulk_import`. Fixing the RPC's own `quote_ident` handling is out of this phase's fence — see AR-03 and the standing todo | closed (narrowed; residue tracked) |
| T-144-29 | Repudiation | A NEW half measured with a different fixture or invocation than its OLD half | high | mitigate | Fixtures committed by `144-01`, byte-frozen and asserted with `git diff --exit-code`; invocations reused verbatim; each NEW row restates its OLD half | closed |
| T-144-30 | Repudiation | Row `K-NEW`'s green misread as a control that did not fire | high | mitigate | Inversion note + cross-reference to `## ⚠ THE INVERSION`; row additionally records a red-when-injected observation, so the pair is not carried by a green alone | closed |
| T-144-31 | Tampering | Postgres left dirty between halves | medium | mitigate | `db:reset` once before the first NEW half; `db:seed:teardown --prefix negctl144-` between every half and after the last (0 rows remain) | closed |
| T-144-32 | Tampering | Transient `permittedKeys` miss-behaviour edit reaching a commit | medium | mitigate | One injection live at a time, reverted in-iteration, four restore assertions recorded in row `K-NEW` | closed |

### `144-05` — zod `.strict()` template validation

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-144-33 | Denial of service | `.strict()` + built-in validation rejecting a built-in at seed time | high | mitigate | Every registered built-in measured against the strict schema by a registry-iterating standing spec **at execution HEAD**, not from research; failure declared a stop, never absorbed by loosening; criterion-5 fallout table empty *and measured empty* (row `V-NEW`); E2E backstop green | closed |
| T-144-34 | Tampering | Top-level `.strict()` only, leaving the nested-fragment site blind | high | mitigate | **Verified in code:** 8 `.strict()` calls in `schema.ts` (≥3 required); row `Z2-NEW`'s catch comes from `perEntityFragment.strict()`, not the top level — had only the top level been tightened, `Z2-OLD`'s blindness would have survived the phase | closed |
| T-144-35 | Tampering | Tightening `fixed[]` at the zod layer, creating a second row-level authority that drifts from `LINK_SENTINELS` | high | mitigate | **Verified in code:** the comment at the `fixed` declaration (`schema.ts:49`) names `assertKnownRowProps` as the row-level authority, so the guidance ships in the file rather than only in the plan | closed |
| T-144-36 | Repudiation | Recording `latent.schema.test.ts:39` as a fix this phase delivered when it was already failable | high | mitigate | Row `AF` defined as a re-measurement; its outcome cell must contain `already-failable`; a repair claim is forbidden there; the site is excluded from the four | closed |
| T-144-37 | Repudiation | Propagating the audit's stale six-site figure | high | mitigate | Corpus re-derived at execution HEAD (4 + 3 + 3 = 10, blind count 4); `144-07` wrote the derived counts **in place**; disagreement declared a reportable finding | closed |
| T-144-38 | Repudiation | The false doc comment silently made true | medium | mitigate | `resolve-template.ts` comment annotated with what changed and when, naming the phase and the decision (record target R-6); both greps in acceptance criteria | closed |
| T-144-39 | Tampering | Transient schema edits during the four two-run controls reaching a commit | medium | mitigate | One removal live at a time, `git checkout --` in-iteration, post-gated each time with blob hash `6e575e67…` restored identical every time and a clean `git status` | closed |
| T-144-40 | Tampering | Two parallel agents clobbering the shared ledger | medium | mitigate | Seven named rows only; wholesale rewrites forbidden; re-read before every edit; global count assertions forbidden | closed |

### `144-06` — type-check gate wiring

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-144-41 | Repudiation | Gate wired but never observed catching, leaving TMPL-01's claim unproven | high | mitigate | Row `G-NEW` reproduces `144-01`'s byte-identical probe at the byte-identical path: exit 0 / silent → **exit 2 / named** (`TS2322` naming `tests/__probe144/g.ts`); row `X-NEW` proves the fixture cannot rot | closed |
| T-144-42 | Repudiation | A cached green recorded as a measured green | high | mitigate | `TURBO_FORCE=true` on every evidence run with forced-execution verdicts asserted (22/22 `cache bypass, force executing`); the shipped-gate-unforced / evidence-forced split written into the ledger; `yarn lint:check --force` named and forbidden | closed |
| T-144-43 | Tampering | The fixture silently rotting into a no-op if someone deletes the offending row | high | mitigate | **Verified in code:** `strictRowTypes.type-test.ts` present with 3 `@ts-expect-error` directives; an unused directive is itself a diagnostic (`TS2578`), so deletion turns the gate red — exactly what row `X-NEW` measured (exit 2). Header states the property in prose | closed |
| T-144-44 | Tampering | `lint:check` edited in a way that drops `typecheck:tests`, narrowing the Playwright-tree gate | high | mitigate | **Verified in code:** `package.json:33` — `turbo run lint && eslint … tests && yarn typecheck:tests && yarn typecheck`; `typecheck:tests` (`:35`) still points at `tests/tsconfig.json`, byte-unchanged | closed |
| T-144-45 | Denial of service | The new gate red on an unrelated package, blocking every merge | medium | mitigate | Repo-wide forced typecheck required green before the wiring landed (22/22, 0 cached, 0 `error TS`); `144-02` had already fixed the only package whose widening surfaced errors; whole chain re-run at plan close | closed |
| T-144-46 | Tampering | The fixture executed as a test by vitest, changing its failure semantics | medium | mitigate | **Verified in code:** `-test.ts` suffix (not `.test.ts`) — inside the tsconfig `include`, outside the vitest include glob; absence from the unit run's file list asserted; reason stated in the file header | closed |
| T-144-47 | Tampering | The two transient probes reaching a commit | medium | mitigate | One injection live at a time, reverted in-iteration; `git diff --exit-code` → 0, blob `9085fb0b…` identical to `HEAD:<path>`, probe `find` → no matches, clean `git status` | closed |

### `144-07` — phase close, gates and record correction

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-144-48 | Denial of service | A Pass 0 false positive surfacing only at gate 7 | **critical** | mitigate | The suite was **run**, not argued away; the one red was root-caused to gate order (not the guard) and the fallout survey's zero holds at both HEADs; no retry-to-green and no flaky annotation, per CLAUDE.md's cardinal rule | closed |
| T-144-49 | Repudiation | A gate set taken across two HEADs presented as one | high | mitigate | HEAD recorded once and asserted unchanged after gate 7 and row `Z`; no fix required a commit, so no re-run was needed | closed |
| T-144-50 | Repudiation | A cached green recorded as a measured green in gate 2 or 6 | high | mitigate | Gates 2, 4 and 6 forced; **gate 4's cached run was caught, disclosed and re-taken** — the control demonstrably fired | closed |
| T-144-51 | Repudiation | An empty fallout table indistinguishable from an unrun survey | high | mitigate | Section states template count, row count, unknown-key count, command and HEAD, sourced from **both** rows `F` and `NC`, plus three would-be-fallout classes with dispositions | closed |
| T-144-52 | Repudiation | A stale corpus figure propagating from ASSERT-04 or the audit into a later phase | high | mitigate | Both amended **in place**, not by addendum, with the reason stated; stale-string greps at zero | closed |
| T-144-53 | Repudiation | A checkbox flipped before its gate ran | high | mitigate | Ordering non-negotiable; the flip is the last of three edits in Task 3, preconditioned on gates recorded green; the `142.1-02` revert precedent named in the clauses | closed |
| T-144-54 | Tampering | A probe or transient edit surviving into the closing HEAD | high | mitigate | Row `C` asserts tracked diff, working-tree status, the probe `find` in **both** glob forms, and the restoration blob hashes. **Independently re-verified 2026-08-24 at HEAD `73337217b`** | closed |
| T-144-55 | Repudiation | A record correction that cannot say why it is true | medium | mitigate | `## Record targets` requires, per target, the measured location at the closing HEAD, what was wrong, what it now says, and the commit that makes it true | closed |
| T-144-56 | Tampering | A stale dev server or dirty database making gate 7 a result about another tree | medium | mitigate | `db:reset` and exactly one fresh dev server started and stopped by the plan; preflight confirmed from the run's own output; no pre-existing listener on the port | closed |
| T-144-57 | Repudiation | Findings surfaced by the six plan summaries quietly dropped | medium | mitigate | All six summaries read; every finding tabled with a disposition | closed |

### Cross-cutting

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-144-SC | Tampering | Supply chain — npm/pip/cargo installs (declared once per plan; 7 instances) | low | **accept** | See AR-02. **No install task exists in this plan or anywhere in this phase.** Every tool used (`typescript` 5.9.3, `vitest` 3.2.4, `zod` 4.3.6, `tsx`, `turbo`, Supabase CLI, Playwright) is an existing direct dependency. No `package.json` dependency block was touched — only the `scripts` block | closed (accepted) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-144-08 | Run logs under a per-user `$TMPDIR` **outside the repository**, so nothing can be committed by accident. Contents are `tsc` diagnostics, vitest counts, turbo verdicts and seed-CLI summaries — file paths, rule codes and row counts. The service-role key is read from the root `.env` and is never echoed by the CLI. Severity low; below the `high` block threshold | Phase 144 plan author (`144-01`), disposition `accept` at plan time | 2026-08-23 |
| AR-02 | T-144-SC | No install task exists anywhere in Phase 144; no dependency manifest was modified. Every tool is a pre-existing direct dependency already exercised by the shipped build, lint and unit gates. Severity low | Phase 144 plan authors (all seven plans), disposition `accept` at plan time | 2026-08-23 |
| AR-03 | T-144-28 (residue) | `_bulk_upsert_record` interpolates column identifiers **without `quote_ident`** while quoting values (`501-bulk-operations.sql:170`, `:195`). Phase 144 **narrowed** this substantively — Pass 0 rejects any key not on the derived allow-list before the RPC sees it — but did not fix the RPC itself, which is a cross-package change outside this phase's fence. Residual exposure is bounded by the trust model: the path is **service-role-only** and its input is a developer-authored template file executed via `tsx`, i.e. the same trust level as running arbitrary local code. Tracked, not forgotten | Phase 144 (`144-07`), filed as residue RES-14 → `.planning/todos/pending/2026-08-23-bulk-upsert-rpc-interpolates-column-identifiers.md` | 2026-08-23 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-24 | 58 (57 numbered + `T-144-SC`) | 58 | 0 | `/gsd-secure-phase 144` — orchestrator, ASVS L1 verification |
| 2026-08-24 | 58 (57 numbered + `T-144-SC`) | 58 | 0 | `/gsd-secure-phase 144 145` — orchestrator, ASVS L1 re-verification at HEAD `80c0263e1` (post-Phase-145) |

### Audit 2026-08-24 (second run) — re-verification after Phase 145

The first run verified at HEAD `73337217b`. Phase 145 has since landed, and it **writes across this
phase's Pass 0 boundary** — every generated candidate row in the default template now carries a
`terms_of_use_accepted` key that Phase 144's guard did not previously see on that template. This run
re-checked the register's code-resident mitigations at HEAD `80c0263e1`:

| Check | Threats | Result |
|-------|---------|--------|
| `find` for `__probe144*` and `*probe144*`, both glob forms, excluding `node_modules` | T-144-03, 16, 47, 54 | 0 matches |
| `writer.ts` call site is still `assertKnownRowProps(data)` | T-144-27 | confirmed, `:181` |
| `deriveDeniedKeys` still runs the denied set through `camelFormsFor` (CR-01 fix) | T-144-25 | confirmed, `permittedKeys.ts:894` |
| `.strict()` call count in `schema.ts` (≥3 required) | T-144-34 | 8 — unchanged |
| `lint:check` still chains `typecheck:tests` at `tests/tsconfig.json` | T-144-44 | confirmed, `package.json:33,35` |
| Type-only fixture still present under its `-test.ts` suffix | T-144-43, 46 | confirmed |

**Cross-phase result — the guard was exercised, not bypassed.** `terms_of_use_accepted` is on the
derived allow-list (`permittedKeys.ts:296`), so the new key is *admitted* rather than routing around
Pass 0. Phase 145 touched neither `permittedKeys.ts` nor `writer.ts`, and its gates ran green (1,821
unit tests, 135 E2E, 0 failed) against a template shape Phase 144 had not exercised — an independent
re-confirmation of the `T-144-24` / `T-144-48` false-positive budget on new evidence.

No mitigation regressed. `threats_open` remains **0**.

### Audit 2026-08-24 — method and independent checks

Register origin: **authored at plan time** (all 7 PLANs carry `<threat_model>`), so this run verified
mitigations rather than scanning for new threats. Short-circuit conditions met
(`threats_open: 0` ∧ `register_authored_at_plan_time: true` ∧ `asvs_level == 1`), so no deeper
L2/L3 boundary-placement or end-to-end trace pass was required.

Attestation coverage in SUMMARY files was **uneven**: `144-01`, `144-02`, `144-04` and `144-07` carry
an explicit `## Threat Flags` section with per-threat dispositions; `144-03`, `144-05` and `144-06`
do not, and their 22 threats are attested only in body prose. Those 22 were therefore checked against
the implementation directly rather than accepted on the summary's word. Independent re-verification
performed at HEAD `73337217b`:

| Check | Threats | Result |
|-------|---------|--------|
| `find` for `__probe144*` and `*probe144*`, both glob forms, excluding `node_modules` | T-144-03, 16, 47, 54 | 0 matches |
| `git status --porcelain -- packages apps tests` | T-144-01, 02, 23, 32, 39, 47 | empty |
| `writer.ts` call site is `assertKnownRowProps(data)`, zero `bulkData` | T-144-27 | confirmed, `:181` |
| `describeRow` index fallback, never phrased as a missing-`external_id` complaint | T-144-26 | confirmed, `assertKnownRowProps.ts:59-65` |
| `deriveDeniedKeys` runs the denied set through `camelFormsFor` | T-144-25 / CR-01 | confirmed, `permittedKeys.ts:894` |
| `organizationId` admitted nowhere (docblock mention only) | T-144-11 | confirmed, `:136-138` |
| Bare sentinel forms present in `LINK_SENTINELS` | T-144-10 | confirmed, `linkSentinels.ts:176`, `:188` |
| `refTable` is a literal union; `onConflict` verbatim | T-144-19 | confirmed, `:130`, `:183`, `:195` |
| `.strict()` call count in `schema.ts` (≥3 required) | T-144-34 | 8 |
| D-04 guard comment names `assertKnownRowProps` at the `fixed` declaration | T-144-35 | confirmed, `schema.ts:49` |
| `lint:check` still chains `typecheck:tests` at `tests/tsconfig.json` | T-144-44 | confirmed, `package.json:33,35` |
| Type-only fixture present, `-test.ts` suffix, `@ts-expect-error` directives | T-144-43, 46 | confirmed, 3 directives |

**Interaction with the code review.** `144-REVIEW.md` raised 1 critical + 8 warnings. CR-01 —
`entityType` bypassing the `entity_type` deny-list via its own camel form — was a **live hole in the
one layer this phase added to close it** (T-144-25 / T-144-28). It was fixed by `6fe28f9c3` before
phase close, along with all eight warnings (`3c8a6b60e` … `df4bec7e6`), and the fix is present at HEAD.
Had it shipped unfixed, T-144-25 would be OPEN at critical severity and this phase would be blocked.

**Note on register composition.** 33 of 58 threats concern evidence integrity or working-tree hygiene
rather than shipped attack surface — a consequence of four plans shipping zero runtime bytes. This is
proportionate for the phase, but it means the register's size is not a proxy for its security weight.
The security-bearing threats are T-144-09 … T-144-12, T-144-17 … T-144-19, T-144-24 … T-144-28 and
T-144-33 … T-144-35.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (AR-01, AR-02, AR-03)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-24
