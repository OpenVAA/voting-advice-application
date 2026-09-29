# Phase 144: Seed-Template Strict Typing + Unknown-Prop Guard - Context

**Gathered:** 2026-08-23
**Status:** Ready for planning
**Source:** `144-DISCUSSION-POINTS.md` (10 decisions, D-01 … D-10). Returned by the operator 2026-08-23
with **all ten ★ RECOMMENDED options ticked, zero overrules, zero free-text edits.**

**Grounding:** every file, line number, probe and command result below was **re-measured at HEAD
`b3ba1621d`** (branch `feat-gsd-roadmap`, 2026-08-23) during context synthesis — not carried over
from the discussion document. Four of that document's § Measurements did **not** survive
re-measurement unchanged; each is recorded as a ⚠ DERIVED decision (**D-06b**, **D-03a**, **D-07a**,
**D-01a**) rather than left for an executor to trip over.

**⚠ AMENDED 2026-08-23 after research (`397fff0b6`).** `144-RESEARCH.md` § Corrections re-measured
this document against HEAD `ee58a4be7` and **nine items did not survive** — four of them substantive
enough to change what gets built. They are corrected **in place below**, not appended, so no stale
premise reaches a planner or executor. The four substantive ones, one line each:

| # | Was | Is |
|---|---|---|
| **C-1** | D-03's allow-list has **three** sources | **Four.** The RPC's per-table **relationship reference map** is a fourth source (**B-4b**). Omitting it throws on **2,955 key occurrences** — every `nominations` row, plus `candidates.organization`, `questions.category`, `constituencies.parent`. A three-source guard fails **every E2E setup project**: cardinal failure |
| **C-2** | B-4's permitted set is **6** `_`-prefixed pairs | **10** — see B-4. ⚠ **This row first read "12", which was wrong**: it carried a research headline that its own enumeration contradicted, and the planner caught it. Re-derived from the source at HEAD `83a375e1c`: **7** `_`-prefixed + **3** bare = **10** distinct `(collection, key)` pairs. The bare forms are used by **76 rows** |
| **C-3** | D-09 seeds the deny-list from `skip_columns` | Seeded literally it **rejects every row in the repo** — `project_id` is emitted on all 1,481. Only `entity_type` is deniable at zero cost |
| **C-4** | D-03a's camel-vs-snake **collection** split | **Does not arise in-tree** — the pipeline is snake_case end to end. The hazard is real but its mechanism is different; the failing test still must exist |

Citation-level corrections (C-5 … C-9) are applied silently below. Full detail, with the measurement
behind each, is at `144-RESEARCH.md` § Corrections to CONTEXT.md.


---

<domain>
## Phase Boundary

**The goal stands, but the roadmap's exemplar for it does not.** Criterion 1 asks that
`_elections: { external_id: [...] }` **on a `questions` row** become a TypeScript error. That
sentinel has been a **first-class, resolved feature since 2026-06-01** — `4aeae0ace` factored the
`_elections` resolver out of the `question_categories` block and called it for **both** tables
(`supabaseAdminClient.ts:542-543` today). The todo that motivates this phase was filed 2026-05-31,
**one day before** the fix. Criterion 4 — "the permitted set is derived from what `linkJoinTables`
actually resolves" — therefore contradicts criterion 1: the resolver genuinely reads this pair, so
criterion 1 as written asks us to delete a shipped feature.

This is the Phase-143 shape exactly: a roadmap premise overtaken by a commit. The remedy is the same
— **re-scope, keep the proof shape, correct the record** (**D-01**).

**In scope:**

- **Per-collection strict row types** for `fixed[]`, derived from a single declaration
  (**D-03**) — TMPL-01.
- **A pure `assertKnownRowProps(dataset)` module** called as **Pass 0** of `Writer.write()`,
  throwing with the row's `external_id`, the offending key and the collection (**D-02**) — TMPL-02.
- **`.strict()` on both `TemplateSchema` and `perEntityFragment`** (**D-04**) — ASSERT-04 / F13.
- **`LINK_SENTINELS` as the one source of truth** that `linkJoinTables` drives its own resolution
  loops from, so a sentinel cannot be permitted without being handled (**D-03**) — criterion 4.
- **Making "TypeScript error at authoring time" a *gated* claim**: widen `packages/dev-seed`'s
  tsconfig to see its own `tests/`, and add `turbo run typecheck` to a root gate and to CI
  (**D-06**). Without this the phase's central claim is IDE-only.
- **Validating built-in templates** (`resolveTemplate` currently returns them unvalidated)
  (**D-07**).
- **Two negative-control fixture classes** for criterion 2, both run through `--template ./custom.ts`
  (**D-08**).
- **A per-collection deny-list** for columns the DB accepts but never writes (**D-09**).
- **A per-field fallout table** with DELETE as the default disposition (**D-10**) — criterion 5.
- **Record corrections** at six targets (**D-01**, and the § Record Targets table below).

**Not in scope** (each measured, each recorded, each filed as a todo where it stays open):

- **Repairing the `default` template's dataset.** `TMPL-03`/`TMPL-04` — 0 parties, no candidates tab
  — belong to **Phase 145**. This phase reports what `default` loses to the tightening; it does not
  repair it.
- **Removing the `attachSentinels` fan-out** (the 2026-05-23 todo). It is explicitly timed against
  the `jsonb`→`uuid[]` migration. This phase touches `attachSentinels` / `hasDeclaredScope`
  (`pipeline.ts:227`, `:258`) **only so far as consuming the derived key set requires**.
- **Auditing the other 11 packages whose `tests/` sit outside their own tsconfig `include`.**
  D-06 adopts the repo-wide `turbo run typecheck` gate; the per-package `include` audit is filed as
  a standing todo (sibling of Phase 143's D-08 lint-script-scope todo).
- **Adding pipeline support for any field the tightening surfaces as unread** (**D-10**). Default
  disposition is DELETE + reason. One exception: if removing a field turns an E2E spec red, that
  field *was* being read, the classification was wrong, and it stays.
- **Per-row M:N join tables** replacing the `election_ids` / `constituency_ids` JSONB columns.

</domain>

---

<baseline>
## Re-measured Factual Baseline (HEAD `b3ba1621d`)

No plan re-derives these. Facts **B-6**, **B-9**, **B-12** and **B-15** correct the discussion
document; **B-16** is a defect this synthesis found that the discussion document did not.

| # | Fact | Evidence |
|---|---|---|
| B-1 | `linkJoinTables` **does** resolve `_elections` on a `questions` row | `supabaseAdminClient.ts:543` — `await electionResolve(data.questions …, 'questions')`. Landed `4aeae0ace`, 2026-06-01 |
| B-2 | The motivating todo was filed **2026-05-31** — one day before B-1 | `.planning/todos/pending/2026-05-31-edit-the-seed-utility-to-use-strict-typing-for-the-templates.md` frontmatter |
| B-3 | **`linkJoinTables` has exactly four resolution sites**, spanning 4 collections × 4 sentinel names | **⚠ ranges corrected (C-6):** span is `supabaseAdminClient.ts:387-592`. Sites: elections **`:389-441`** (key reads `:393-398`), constituency_groups **`:443-497`** (key reads `:446-451`), `electionResolve` `:506-543` (exact), `constResolve` **`:550-591`**. Re-measure before citing — this file is edited by this phase |
| B-4 | ⚠ **CORRECTED TWICE (C-2). The permitted set is 10 pairs.** ⚠ *This row said "6" originally and "12" after research; both were wrong. 10 is re-derived from the source at HEAD `83a375e1c` and is the number to use.* **Seven `_`-prefixed:** `elections._constituencyGroups`, `elections._constituency_groups`, `constituency_groups._constituencies`, `question_categories._elections`, `question_categories._constituencies`, `questions._elections`, `questions._constituencies`. **Three bare, non-underscore** — also read by `linkJoinTables`, and used by **76 rows** (41 + 35: every hand-authored election / cg row in `e2e/base` and all 28 `perm-*`): `elections.constituencyGroups`, `elections.constituency_groups` (`:393-398`), `constituency_groups.constituencies` (`:446-451`). **The count is of `(collection, key)` pairs under D-03a's locked canonical keying — the resolved snake_case table name.** The camelCase *collection*-name spellings `linkJoinTables` accepts (`data.constituencyGroups`, `data.questionCategories`) are collection aliases that the canonical keying collapses; counting them as extra pairs is what produced the bad "12" | re-derived: `sed -n 387,592p … | grep -oE '(election\|cg\|row)\.[_a-zA-Z]+' | sort -u` returns exactly 8 distinct row-key expressions, which expand to 10 pairs because `row.*` serves both `question_categories` and `questions`. **Executors: re-derive rather than trust this number, and report disagreement instead of reconciling it** |
| B-4b | ⚠ **NEW (C-1) — a fourth permitted-key source D-03 did not name.** `_bulk_upsert_record` defines a per-table **relationship reference map**: `candidates.organization`; `nominations.{candidate, organization, faction, alliance, election, constituency, parent_nomination}`; `questions.category`; `constituencies.parent` — **10 pairs**. They are resolved external-id references: **not** columns, **not** sentinels, **not** in `COLLECTION_NON_COLUMNS`, and **not stripped** | `apps/supabase/supabase/schema/501-bulk-operations.sql:113-136`, read verbatim. Present on **2,955 key occurrences** across the 30 built-ins' 1,481 rows |
| B-5 | **`elections._constituencies` is never read**, and **`candidates._elections` is never read** — D-01's primary and secondary exemplars both hold | derived from B-3/B-4; `electionResolve`'s own signature is typed `table: 'question_categories' \| 'questions'` (`:508`) |
| B-6 | ⚠ **The discussion document quoted the wrong commit message for `4aeae0ace`.** Its real subject is `feat(data): promote `required` to first-class Question field + wire consumers`, not the dev-seed paraphrase quoted at M-1. **The hash and the substance are correct** — verified by diffing `4aeae0ace` against `4aeae0ace^`, which shows `electionResolve` factored out and called for both tables where the parent called it for `question_categories` only | `git show 4aeae0ace^:…` vs `git show 4aeae0ace:…`; → **D-01a** |
| B-7 | Silent-drop class (a): `key.startsWith('_')` strips **every** `_`-prefixed key | `supabaseAdminClient.ts:180` |
| B-8 | Silent-drop class (b): `NON_COLUMN_FIELDS = new Set(['answersByExternalId'])` strips it on **every** collection, while `importAnswers` reads only `candidates` / `organizations` | `:140`; `:246` |
| B-9 | ⚠ **A per-collection non-column map already exists** — `COLLECTION_NON_COLUMNS` at `:141-146` (`candidates: {email}`, `elections: {constituencyGroups, constituency_groups}`, `constituency_groups: {constituencies}`). It is keyed by the **resolved table name** (post-`resolveCollectionName`), not the template's collection key | `:141-146`, `:178` (`extraStrip`); → **D-03a** |
| B-10 | A **non**-underscore unknown key is **not** silent — it reaches Postgres as `column "x" of relation "y" does not exist` | the RPC path; documented in-tree at `:132-139` |
| B-11 | `Writer.write()` is at `writer.ts:140`; **Pass 1 (`bulkImport`) at `:159-160`**. Pass 0 inserts immediately above it | `writer.ts:140`, `:159` |
| B-12 | ⚠ **`resolveTemplate` returns built-ins unvalidated** (`return builtIn;`, `cli/resolve-template.ts:59`), while path-loaded templates validate at `:88` and `:111`. **The file's own doc comment at `:16` claims the opposite** — *"Every resolved template runs through `validateTemplate()` before return"* — which is false today | measured; → **D-07a** |
| B-13 | **30 built-in templates** are registered, all typed (`Record<string, Template>`, plus `: Template` annotations at every declaration site) | `templates/index.ts:56-126`; `grep ': Template'` |
| B-14 | Only **`e2e/base.ts`** hand-authors sentinels: **6 × `_constituencies`, 2 × `_elections`**, 0 × `_constituencyGroups` (the last is attached at runtime by `attachSentinels`, `pipeline.ts:227-256`). 39 template files, 128 `fixed:` sites | measured |
| B-15 | ⚠ **12 packages define a `typecheck` script**, not 11: `core`, `data`, `matching`, `filters`, `app-shared`, `dev-seed`, `dev-tools`, `llm`, `question-info`, `argument-condensation`, `apps/frontend`, `apps/docs` | `grep -l '"typecheck"' packages/*/package.json apps/*/package.json` |
| B-16 | ⚠ **`turbo.json`'s `typecheck` task has no `"cache": false`** — it is cached exactly like `lint`, and unlike `test:unit` which sets it explicitly | `turbo.json:18-22` vs `:12-15` vs `:9-11`; → **D-06b** |
| B-17 | `TURBO_FORCE=true npx turbo run typecheck` is **22/22 successful, 0 cached, 17.5s** at this HEAD — the gate is green today and free to add | measured 2026-08-23 |
| B-18 | **No root `typecheck` script exists.** `lint:check` = `turbo run lint && eslint … tests && yarn typecheck:tests`, and `typecheck:tests` is `tsc -p tests/tsconfig.json` — the Playwright tree only | root `package.json` |
| B-19 | CI's static job runs `format:check`, `lint:check`, `test:unit`, `yarn workspace @openvaa/frontend check`, frontend `build` — **no `turbo run typecheck`** | `.github/workflows/main.yaml:63-79` |
| B-20 | `packages/dev-seed/tsconfig.json` has `include: ["src/**/*"]` and `rootDir: "./src"`. Its `tests/` and `scripts/` directories (both present) are invisible to `tsc --noEmit`, which exits **0** today | measured; `packages/dev-seed/` contains `scripts/`, `src/`, `tests/` |
| B-21 | Widening that `include` to `src` + `tests` + `scripts` and dropping `rootDir` yields **exactly 3 pre-existing errors** — `tests/determinism.test.ts(99,25)` TS2559, `tests/latent/latentEmitter.test.ts(122,35)` TS2493, `tests/templates/nominations-override.test.ts(83,13)` TS2352. Measured by editing, running, and restoring; `git diff` on the file is empty afterwards | measured 2026-08-23 |
| B-22 | The todo's touch-point citation **`supabaseAdminClient.ts:126` is still correct** (`async bulkImport`), but **`:365` is stale** — `linkJoinTables` is now at **`:387`** — and it names `templates/baseV1.ts`, which has not existed since `d783e81fc` (Phase 93-02) moved it to `e2e/base.ts` | measured |

### Measured zod semantics (probed at zod **4.3.6**, this tree's version)

Run as a scratch ESM module inside `packages/dev-seed`, deleted after measurement.

| Probe | Question | Result | Consequence |
|---|---|---|---|
| A | Does `.strict()` **before** `.extend()` survive the extend? | **YES** — unknown top-level key rejected | Either ordering works; **no hazard**. Recorded so the executor does not guess |
| B | `.extend()` then `.strict()` | **YES** — rejected | ditto |
| C | Does top-level `.strict()` reach `perEntityFragment`? | **NO** — `{candidates: {fixed: […], bogus: 3}}` parses `success=true` and `bogus` is **silently stripped** | **D-04**: `perEntityFragment` must be `.strict()` too, or `template.test.ts:56` stays blind |
| D | Strict fragment + nested unknown | **rejected** | D-04's mechanism works |
| E | Strict fragment — arbitrary key **inside** a `fixed[]` row | **still accepted** | Correct per **D-04**: row-level keys are the runtime guard's job, not zod's. One row-level authority |

### The six "accepts field X" sites, re-measured

Every line number below was verified against the current files.

| Site | Content | Status today | Under criterion 3 |
|---|---|---|---|
| `tests/template.test.ts:46` | `accepts valid top-level fields` | blind | **→ failable** via `TemplateSchema.strict()` |
| `tests/template.test.ts:56` | `accepts nested fixed[]` | blind | **→ failable only if `perEntityFragment` is strict too** (probe C) |
| `tests/template.test.ts:74` | `accepts per-entity fragment for every expected key` | blind | **→ failable** via `.strict()` |
| `tests/template/latent.schema.test.ts:35` | `accepts empty latent block` | blind | **→ failable** via `.strict()` |
| `tests/template/latent.schema.test.ts:39` | `accepts matching dimensions + eigenvalues` | **already failable** — `latentBlock` is already `.strict()` (`schema.ts:64`) | already green; **re-measured, not "fixed"** |
| `tests/template/latent.schema.test.ts:31` | `validateTemplate({})` | **unfailable by construction** — declares no field | **scoped exception**; repaired differently (see **D-05**) |

**The corpus is 4 blind → failable, 1 already-failable, 1 unfailable-by-construction — not "six".**
The round-trip repair form for `:31` already exists in-tree at `template.test.ts:23-24`
(`expect(validateTemplate({})).toEqual({})`).

### Record targets

| # | Target | What is wrong |
|---|---|---|
| R-1 | `.planning/ROADMAP.md` — criterion 1 at **`:666`**, the five criteria at **`:666-670`**, `**Plans**: TBD` at **`:672`** (C-7; `:665` is blank) | Criterion 1's exemplar is stale (B-1/B-2); criterion 5 names **`baseV1`**, gone since Phase 93 (B-22); criterion 3 says "six"; `**Plans**: TBD` |
| R-2 | `.planning/REQUIREMENTS.md:57` | ASSERT-04 says "the six … tests" |
| R-3 | `.planning/REQUIREMENTS.md:149,157,158,179` | status rows + the `144 … | 3` plan-count row |
| R-4 | `.planning/audits/2026-08-11-fake-guard-sweep.md:46` and `:665` | F13 entry says "6 … tests cannot fail" |
| R-5 | `.planning/todos/pending/2026-05-31-edit-the-seed-utility-…md` | `baseV1.ts` (gone), `supabaseAdminClient.ts:365` (now `:387`), and the `questions._elections` premise (fixed by `4aeae0ace`) |
| R-6 | `packages/dev-seed/src/cli/resolve-template.ts:16` | **In-tree doc comment asserts a falsehood** (B-12). **D-07** makes it true; the comment must not be left as the only record that it was ever false |

</baseline>

---

<decisions>
## Implementation Decisions

All 10 discussion items are resolved, every one at its ★ RECOMMENDED option. Every decision below is
**locked** — the planner and executors implement it, they do not re-derive it. The four ⚠ DERIVED
entries are consequences of re-measurement that the checkboxes do not settle; they are recorded here
as decisions rather than left to an executor's improvisation.

### D-01 — Criterion 1 is re-scoped: same proof shape, live exemplar (A ★)

Criterion 4 governs. The permitted set is **derived** (**D-03**), and it includes
`questions._elections` — so that pair stays legal and **a test asserts it stays legal**.

Criterion 1's *shape* is preserved in full:
author the row → **TS error naming the row type** → delete it → typechecks → **and the identical row
is first confirmed to typecheck cleanly under the pre-change types** (the two-run control the
milestone's standing acceptance rule demands).

Only the exemplar changes, to a pair `linkJoinTables` genuinely never reads (**B-5**):

- **Primary: `_constituencies` on an `elections` row.** Highest authoring plausibility — an author
  who knows `_constituencyGroups` works there will reach for it.
- **Secondary: `_elections` on a `candidates` row.** Same sentinel name as the original defect,
  adjacent collection.

ROADMAP criterion 1 and the todo are corrected in-phase, citing `4aeae0ace` (**R-1**, **R-5**).

### D-01a ⚠ DERIVED — Cite `4aeae0ace` by hash **and** by its real subject line

**B-6**: the discussion document attributed a plausible-sounding dev-seed commit message to
`4aeae0ace`. The hash and the substance are right; the quoted message is not. Every artifact that
cites this commit must use its **actual** subject —
``feat(data): promote `required` to first-class Question field + wire consumers`` — and, because
that subject does not mention dev-seed at all, must state **what the commit did to this file**:
factored `electionResolve` out of the `question_categories` block and called it for both tables.
A citation whose quoted message cannot be found by `git log` is the failure mode Phase 143 spent
five record corrections on.

### D-02 — A pure `assertKnownRowProps(dataset)`, called as Pass 0 of `Writer.write()` (A ★)

**Not** inside `bulkImport`. A new pure module under `packages/dev-seed/src` — **no Supabase
import** — so `yarn test:unit` exercises it directly with no DB. It is called once from
`Writer.write()` immediately before Pass 1 (**B-11**, `writer.ts:159`).

This placement covers **built-ins and `--template ./custom.ts` alike**, because every path funnels
through the Writer. It throws naming the row's `external_id`, the offending key, and the
collection. `bulkImport`'s existing silent strips (**B-7**, **B-8**) stay exactly where they are —
the guard runs first, so nothing reaches them unrecognised.

### D-03 — One `LINK_SENTINELS` const that `linkJoinTables` drives its own loops from (A ★)

A parallel list plus a parity test can still drift; criterion 4 rules that shape out. The const is
the thing the resolver **iterates**, so:

- adding a pair to the const without adding handling makes the resolver's dispatch miss — **a test
  catches it**;
- adding handling without listing it is **impossible**, because the loop iterates the const.

The permitted key set per collection is the union of **four derived sources** — ⚠ **amended from
three (C-1); source (4) was missing and its omission is a cardinal failure**:

1. **DB columns** — from `@openvaa/supabase-types` `TablesInsert<T>`;
2. **Sentinels** — from `LINK_SENTINELS` (**B-4** is the set it must encode: **10 pairs**, the 3 bare non-underscore forms included);
3. **Non-column fields** — one explicit per-collection const, one-line reason each;
4. ⚠ **Relationship references** — the `_bulk_upsert_record` RPC's per-table relationship map
   (**B-4b**): `candidates.organization`, the seven `nominations.*` refs, `questions.category`,
   `constituencies.parent`. **10 pairs, 2,955 key occurrences.** These are resolved by the RPC, so
   they are keys the pipeline genuinely *does* read — a guard without source (4) throws on every
   `nominations` row and **fails every E2E setup project**.

Source (4) is derived from the **SQL**, which no TypeScript type reaches. It is therefore the one
source that can silently drift from its origin: the phase must include a check that fails when the
RPC's relationship map and the TS declaration disagree, or state plainly why it cannot and file the
gap. Do not leave the drift undetected and unremarked.

The TS row types **and** the runtime guard both consume this union. One declaration, two enforcement
layers.

### D-03a ⚠ DERIVED, ⚠ PREMISE CORRECTED (C-4) — Source (3) already exists; canonical keying is the resolved table name

**B-9 survived verbatim**: `COLLECTION_NON_COLUMNS` (`supabaseAdminClient.ts:140-145`) is already the
per-collection non-column const D-03 source (3) describes, and `NON_COLUMN_FIELDS` (`:140`) is its
global sibling. They are **not** to be re-invented — they are **moved** to the shared declaration and
imported back by `bulkImport`. (`extraStrip` is assigned at **`:169`** and used at **`:180`**; this
document's original `:178` was the neighbouring `hasCandidateRef` line.)

**⚠ This decision's original hazard statement was wrong, and is replaced rather than patched.** It
claimed Pass 0 sees a camelCase collection key where `COLLECTION_NON_COLUMNS` is keyed snake_case.
**Measured: from every in-tree path they do not differ.** `TemplateSchema` declares its twelve slots
in snake_case only (`schema.ts:117-128`); `TOPO_ORDER` (`pipeline.ts:76-91`) is snake_case only;
`runPipeline` writes `output[table]` for `table of TOPO_ORDER`; `Writer.write(data)` receives that
verbatim. So `resolveCollectionName(k) === k` for every key Pass 0 sees from the CLI and from both
E2E setup paths.

**The real hazard, in two parts — both still requiring the failing test:**

1. **`Writer.write` is a public barrel export** and can be handed an arbitrary map. `linkJoinTables`
   deliberately accommodates camelCase collection keys (`:443`, `:503`). A guard that *rejected*
   those would break a supported shape; a guard that *silently permitted* an unrecognised collection
   would be blind. **Therefore: canonical keying is the resolved snake_case table name, both
   consumers resolve into it, and Pass 0 must THROW on an unrecognised collection** — never skip it.
   A collection the guard does not recognise is the one case where silence is indistinguishable from
   success.
2. **The genuine field-level analogue is `PROPERTY_MAP`'s `organizationId → organization_id_nom`
   collision** (see `144-RESEARCH.md` R1.3), not a collection-level split.

The phase still owes a case that **fails** if the keyings are confused — `144-RESEARCH.md` R3.3
supplies one that genuinely goes red. ⚠ Note that this control is **inverted** relative to the
others in the ledger: its OLD half is a *red*, not a green. Record it with its own inversion note,
per Phase 143 precedent.

### D-04 — `.strict()` on `TemplateSchema` **and** `perEntityFragment`; `fixed[]` rows stay `z.record` (A ★)

Probe C measured that `.strict()` is per-object: top-level alone leaves `template.test.ts:56` blind.
Both objects get it. `fixed[]` rows remain `z.record(z.string(), z.unknown())` at the zod layer —
row-level unknown keys are the **runtime guard's** job (**D-02**/**D-03**), because the allow-list is
per-collection and derived, and duplicating it into zod would create the second parallel authority
criterion 4 forbids. **One row-level authority.**

Probes A and B measured that `.strict()` composes with the existing
`.extend({ latent: latentBlock.optional() })` (`schema.ts:130`) in **either** order.

### D-05 — Re-derive the corpus to 4 + 1 + 1 and amend the record in place (A ★)

Report **4 blind → failable**, **1 already-failable** (`latent.schema.test.ts:39` — re-measured and
recorded as such, **not** claimed as a fix), and **1 scoped exception**:
`latent.schema.test.ts:31`, disposition **`N/A — by construction`**, the same disposition Phase 142
gave F17.

That site is **repaired differently**, by the audit's own suggested fix: convert it to the round-trip
form `expect(validateTemplate({})).toEqual({})` — the pattern already in-tree at
`template.test.ts:23-24`.

ASSERT-04's wording and the audit's F13 entry are amended **in place, not by addendum** (**R-2**,
**R-4**), so the "six" figure does not propagate further. *(Standing feedback: an addendum alone lets
a stale figure propagate false premises into later phases.)*

### D-06 — Make "authoring time" a gated claim, in two moves (A ★)

**This is the load-bearing decision.** Per **B-19**/**B-20**, nothing typechecks `packages/dev-seed`
in any gate, and its own `tsc --noEmit` cannot even see its `tests/`. A tightened `Template` type
would be an **IDE-only** error, and this phase's own negative-control fixture would be invisible to
every gate.

**(i)** Widen `packages/dev-seed/tsconfig.json` `include` to cover `tests/**` and `scripts/**`, and
drop `rootDir` (which `noEmit` does not need), **fixing the 3 measured pre-existing errors**
(**B-21**) as owned fallout.

**(ii)** Add `turbo run typecheck` to a root gate (a new `yarn typecheck`, chained into
`lint:check`) **and** to the CI static job in `main.yaml` — the same move Phase 142.1 made when it
found neither lint nor build typechecked the frontend tree.

A `// @ts-expect-error` fixture in a dev-seed test file then becomes a real, **gated** two-run
control: present → green; delete the offending row → the now-unused `@ts-expect-error` turns the
gate **red**.

### D-06b ⚠ DERIVED — The new `turbo run typecheck` gate is cache-bustable, and must be cache-busted

**B-16**: `turbo.json`'s `typecheck` task carries **no `"cache": false"`**. It is cached exactly like
`lint`. The phase's locked gate set already requires `TURBO_FORCE=true yarn lint:check` for this
reason (a replayed green is a claim about a **previous** tree); the discussion document's gate line
wrote `turbo run typecheck` without that guard, which is inconsistent with its own constraint.

**Every evidence-bearing typecheck run in this phase uses `TURBO_FORCE=true`.** This matters most for
the D-06 two-run control, whose two halves differ by one line in one file: an unforced second run can
replay the first's verdict and manufacture a false green. The **gate as shipped** to `package.json` /
CI need not force (caching there is a feature); the **measurement** always does. Both facts are
stated wherever the gate set is written down.

### D-07 — Built-in templates are validated too (A ★)

`resolveTemplate` returns `builtIns[arg]` unvalidated (**B-12**), so `.strict()` would never fire on
`default`, `e2e/base`, or any of the 28 `perm-*` templates at seed time — the zod layer would guard
**custom templates only**. Change `cli/resolve-template.ts:59` to `return validateTemplate(builtIn);`.
Costs microseconds per run, makes every entry path traverse the same two layers, and gives **D-04**'s
`.strict()` runtime reach rather than test-only reach.

### D-07a ⚠ DERIVED — `resolve-template.ts:16` is a record target, not just a comment

**B-12**: that file's doc comment already asserts *"Every resolved template runs through
`validateTemplate()` before return"* — **false at every HEAD since the built-in branch was added.**
D-07 makes the sentence true. It must **not** be silently left in place as though it had always been
accurate: it is added to the record-target set (**R-6**) and annotated with what changed and when.
Silently making a false record true is how records come to disagree.

### D-08 — Two negative-control fixture classes for criterion 2 (A ★)

Criterion 2 needs a property the **pre-change** seed run accepts and silently drops. Two classes,
deliberately, because a guard built against `_`-prefixed keys alone would pass (1) and stay blind to
(2):

1. **An unresolved `_`-prefixed sentinel** — `_constituencies` on an `elections` row (D-01's primary
   exemplar), stripped by `key.startsWith('_')` (**B-7**);
2. **`answersByExternalId` on a `questions` row** — *not* `_`-prefixed, stripped globally by
   `NON_COLUMN_FIELDS` while `importAnswers` reads only `candidates` / `organizations` (**B-8**).

Each is run through a `--template ./custom.ts` load, per criterion 2.

### D-09 — A per-collection deny-list beside the allow-list (A ★)

`entity_type` is a real column on several tables — so it survives any `TablesInsert`-derived
allow-list — yet `_bulk_upsert_record`'s `skip_columns` discards it, along with `id`, `created_at`,
`updated_at`, `project_id`. A template setting it **is** declaring something the pipeline does not
read (TMPL-01's exact wording), but it is not an *unknown* key.

A small per-collection deny-list, one-line reason per entry, throwing with the same message shape.
Keeps "declares something the pipeline does not read" honest at both ends.

**⚠ CORRECTED (C-3) — the deny-list must NOT be seeded literally from `skip_columns`.** The array is
`ARRAY['id', 'created_at', 'updated_at', 'project_id', 'entity_type']`
(`apps/supabase/supabase/schema/501-bulk-operations.sql:108-111` — note the **doubled `supabase/`**;
`apps/supabase/migrations/` does not exist, C-5). But **every generator emits `project_id` on all
1,481 rows** (`CandidatesGenerator.ts:86,110,143` and siblings), and the RPC drops the payload copy
only to re-supply its own at `:96-97`. Denying it rejects **every row in the repo**, and `id` appears
in two `writer.test.ts` fixtures.

**Only `entity_type` is deniable at zero cost.** The other four go into a documented,
**non-throwing** exclusion table with the reason each is excluded — the record stays honest without
the guard turning red on legitimate rows. **Re-read the SQL at execution time**; do not copy the
line numbers from this document.

### D-10 — DELETE is the default disposition, with a per-field fallout table (A ★)

Criterion 5 requires every field an existing template loses to be listed with a reason. The table
carries **file, collection, `external_id`, key, why it was never read**. Adding pipeline support for
a dropped field is **out of scope** and is filed as a todo instead.

**One exception:** if removing a field turns an E2E spec red, that field **was** being read, the
classification was wrong, and it stays. This is the check that keeps the DELETE default honest.

</decisions>

---

<truth>
## What Must Be TRUE at Phase Close

1. **Criterion 1 (re-scoped, D-01).** `_constituencies` on an `elections` row is a TypeScript error
   naming the row type; deleting it typechecks; **the identical row typechecked cleanly under the
   pre-change types** (both halves measured in-phase). Same for `_elections` on a `candidates` row.
   `questions._elections` is **still legal**, and a test asserts it.
2. **The error is caught by a gate, not only by an IDE** (D-06): `TURBO_FORCE=true turbo run
   typecheck` is red for the offending row and green without it, and the gate is wired into both
   `package.json` and `.github/workflows/main.yaml`.
3. **Criterion 2 (D-08).** Both fixture classes throw with `external_id` + key + collection, via
   `--template ./custom.ts`; **the same two runs before the change complete successfully and
   silently drop the key** — observed both ways.
4. **Criterion 3 / ASSERT-04 (D-04, D-05).** `TemplateSchema` **and** `perEntityFragment` are
   `.strict()`. Each of the **4** blind sites fails when its field is removed from the schema and
   passes when present — both directions observed per site. `latent.schema.test.ts:39` is recorded
   as **already-failable**; `:31` is recorded as **`N/A — by construction`** and converted to the
   round-trip form.
5. **Criterion 4 (D-03).** `LINK_SENTINELS` is what `linkJoinTables` iterates, and encodes **all 10
   pairs** (B-4), the 3 bare forms included — re-derived by the executor, not taken on trust. Adding a pair without handling fails a test — **demonstrated,
   not asserted**. The **D-03a** case is present, goes red when the keyings are confused, and is
   recorded with its **inversion note**. Pass 0 **throws on an unrecognised collection**.
5b. **Source (4) is present** (B-4b). The guard admits all 10 relationship-reference pairs, and the
   drift between the RPC's SQL map and the TS declaration is either checked or its gap is filed.
   **This is the difference between a green E2E suite and a cardinal failure** — verify it early,
   not at the phase-close gate.
6. **Criterion 5 (D-10).** All 30 built-ins (**B-13**) typecheck and seed under the new types; the
   E2E suite is green on `e2e/base`. ⚠ **The fallout table is expected to be EMPTY**: research
   classified every key on all 1,481 rows under the four-source composition and found **0 unknown
   keys**. An empty table is therefore a **discharge, stated with its measurement and the command
   that produced it** — not a blank section, and not evidence the survey was skipped. If the
   executor's own survey finds a non-empty set, that disagreement is itself a finding and must be
   reported, not quietly reconciled.
7. **Built-ins are validated** (D-07), and `resolve-template.ts:16` no longer asserts something
   false (D-07a).
8. **All six record targets are corrected in-phase** (R-1 … R-6), each naming the commit or
   measurement that makes the correction true, and `4aeae0ace` is cited per **D-01a**.
9. **The gate set is green at one HEAD:**
   `yarn test:unit` · `TURBO_FORCE=true yarn lint:check` · `yarn format:check` · `yarn build` ·
   `yarn workspace @openvaa/frontend check` · **`TURBO_FORCE=true turbo run typecheck`** ·
   `yarn test:e2e` (**0 failed / 0 flaky / 0 skipped / 0 "did not run"**).
</truth>

---

<constraints>
## Constraints and Hazards

- **Standing v2.15 acceptance rule.** Prove the guard fails before claiming it guards — negative
  control run twice, once against the old assertion to demonstrate blindness, once against the new
  one to demonstrate the catch. Both halves measured **in this phase** unless a recorded OLD half
  genuinely exists to cite, with the citation named.
- **CLAUDE.md cardinal rule.** Full `yarn test:e2e` green before the phase can be called done. No
  flaky exemptions, no "cannot plausibly affect it" waiver. Per **B-13** all 30 built-ins — every
  `perm-*` included — seed from these codepaths, so E2E reach here is **real, not theoretical**.
- **Turbo caching (D-06b).** `lint` **and** `typecheck` are both cached. Every evidence run uses
  `TURBO_FORCE=true`. `yarn lint:check --force` is **forbidden** — yarn appends the argument past
  the `&&` chain and it silently does nothing.
- **E2E prereq.** One fresh dev server on `:5173` (no Playwright `webServer`; a stale server steals
  the port) and a clean DB (`yarn db:reset`) before the full-suite gate.
- **Restore-and-prove.** Any measurement taken by temporarily editing a tracked file (as **B-21**
  was) must end with the file restored and the restore **proven** — an empty `git diff` on that
  path, recorded.
- **Line numbers drift.** `supabaseAdminClient.ts` is ~600 lines and this phase edits it. Every line
  citation in a produced artifact is **re-measured at the HEAD it is stated for** — Phase 143 lost
  time to exactly this (`:365` → `:387` in the todo is the same failure already in-tree, **B-22**).
- **No scope creep into Phase 145.** This phase reports what `default` loses; it does not repair it.
- **The 2026-05-23 sentinel-fanout todo stays open.**
</constraints>

---

## Deferred Ideas (captured, not acted on)

- The **11 packages beyond dev-seed** whose `tests/` sit outside their own tsconfig `include` are
  not audited here — file as a standing todo (sibling of Phase 143's D-08 lint-script-scope todo).
- Removing the `attachSentinels` fan-out (2026-05-23 todo) — see § Constraints.
- Per-row M:N join tables replacing the `election_ids` / `constituency_ids` JSONB columns.
