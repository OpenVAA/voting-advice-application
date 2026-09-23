# Phase 144 — Discussion Points

**Phase**: Seed-Template Strict Typing + Unknown-Prop Guard
**Requirements**: TMPL-01, TMPL-02, ASSERT-04 (F13)
**Domain**: `packages/dev-seed` — make a template row that declares something the pipeline
does not read impossible to author (types) and impossible to run (runtime throw), with the
permitted set derived from `linkJoinTables` rather than maintained beside it.

**How to use this doc**: every item lists its options with a checkbox next to each. One option per
item carries **★ RECOMMENDED**. **Leave everything unchecked to accept every recommendation.** Tick
a box only to *overrule* the recommendation for that item. Add free-text under any item if you want
something neither option covers.

---

## Measurements taken during this discussion

Everything below was measured in this working tree today, not inferred. These are the facts the
options rest on.

| # | Measurement | Result |
|---|---|---|
| M-1 | Does `linkJoinTables` resolve `_elections` on a `questions` row? | **YES** — `supabaseAdminClient.ts:537` `await electionResolve(data.questions, 'questions')`. Landed in `4aeae0ace` (2026-06-01), commit message: *"dev-seed: extend election_ids JSONB scoping to questions (not just categories) via shared `_elections` sentinel resolver."* |
| M-2 | When was the todo that motivates this phase filed? | 2026-05-31 — **one day before** M-1's fix |
| M-3 | Does `packages/dev-seed/src/templates/baseV1.ts` exist? | **NO** — moved to `e2e/base.ts` by `d783e81fc` (Phase 93-02) |
| M-4 | Does top-level `.strict()` reach `perEntityFragment`? | **NO** (probe D). `z.object({candidates: fragment}).strict().safeParse({candidates:{fixed:[…]}})` → `success=true`, `fixed` silently stripped |
| M-5 | Is `latentBlock` already removal-sensitive? | **YES** (probe B). It is already `.strict()`; deleting `dimensions` from it makes `latent.schema.test.ts:39` throw **today** |
| M-6 | Can `latent.schema.test.ts:31` be made failable by removing a schema field? | **NO** — it is `validateTemplate({})`. It declares no field, so no removal can fail it |
| M-7 | Does any gate typecheck `packages/dev-seed`? | **NO**. `turbo.json` declares a `typecheck` task and 11 packages define the script, but **no root script and no CI job runs `turbo run typecheck`**. `yarn lint:check` runs `turbo run lint` + tests eslint + `typecheck:tests` (tests/ tsconfig only) |
| M-8 | Does `packages/dev-seed`'s own `tsc --noEmit` see its `tests/`? | **NO**. `tsconfig.json` has `include: ["src/**/*"]`. A deliberate `const x: number = 'not a number'` in `tests/` → **exit 0** |
| M-9 | Fallout if dev-seed's typecheck is widened to `src` + `tests` + `scripts` | **3 pre-existing errors** — `tests/determinism.test.ts:99`, `tests/latent/latentEmitter.test.ts:122`, `tests/templates/nominations-override.test.ts:83` |
| M-10 | Baseline of a repo-wide `TURBO_FORCE=true turbo run typecheck` | **22/22 tasks successful, 0 errors, 16.8s** — the gate is green today and free to add |
| M-11 | Are built-in templates validated by `validateTemplate`? | **NO**. `resolveTemplate` returns `builtIns[arg]` unvalidated; only `.ts`/`.js`/`.json` **path**-loaded templates get `validateTemplate` |
| M-12 | Are all built-in templates typed? | **YES** — `BUILT_IN_TEMPLATES: Record<string, Template>`, plus `: Template` annotations on `defaultTemplate`, `baseTemplate`, `buildMinimal`'s return, and every `perm-*` |
| M-13 | What is silently dropped today? | (a) every `_`-prefixed key not in `linkJoinTables`' set — `bulkImport` strips on `key.startsWith('_')`; (b) `answersByExternalId` on any collection other than `candidates`/`organizations` — `NON_COLUMN_FIELDS` strips it globally, `importAnswers` reads only those two; (c) `entity_type` on any row — the RPC's own `skip_columns` drops it (`501-bulk-operations.sql:109`). A *non*-underscore unknown key is **not** silent — it reaches Postgres as `column "x" of relation "y" does not exist` |

---

## D-01 — Criterion 1's exemplar is stale, and it contradicts criterion 4

The roadmap's criterion 1 requires `_elections: { external_id: [...] }` **on a `questions` row** to
become a TypeScript error. Per **M-1/M-2**, that sentinel has been a first-class, resolved feature
since 2026-06-01 — the day after the todo was filed. Criterion 4 requires the permitted set to be
*derived from what `linkJoinTables` actually resolves*. `linkJoinTables` resolves this pair. So
criterion 1 and criterion 4 currently ask for opposite things, and criterion 1 as written asks us
to delete a shipped feature.

This is the Phase-143 shape exactly: the roadmap's premise was overtaken by a commit, and the
remedy is to re-scope and correct the record rather than to build to a stale premise.

- [x] **A ★ RECOMMENDED — Re-scope criterion 1, keep its proof shape, substitute a live exemplar.**
      Criterion 4 governs; the permitted set is derived. Criterion 1's *shape* is preserved in full
      (author the row → TS error naming the row type → delete it → typechecks → and the identical
      row is first confirmed to typecheck cleanly under the pre-change types). Only the exemplar
      changes, to a `(collection, sentinel)` pair `linkJoinTables` genuinely never reads:
      **primary `_constituencies` on an `elections` row** (highest authoring plausibility — an
      author who knows `_constituencyGroups` works there will reach for it), **secondary
      `_elections` on a `candidates` row** (same sentinel name as the original defect, adjacent
      collection). `questions._elections` stays legal, and a test asserts it stays legal.
      Correct ROADMAP criterion 1 + the todo, citing `4aeae0ace`.
- [ ] **B — Preserve criterion 1 literally: remove `questions._elections` resolution.**
      Makes criterion 1 true by deleting a working feature that criterion 4 says must be permitted.
- [ ] **C — Build to criterion 1 as written by special-casing `questions._elections` in the types
      only.** Types and runtime would disagree; criterion 4's derivation test would fail by design.

_Also stale and to be corrected in the same pass:_ criterion 5 names **`baseV1`**, which has not
existed since Phase 93 (**M-3**) — it is `e2e/base`. The `Plans: TBD` line and the requirement rows
get the same treatment as Phase 143's record correction.

---

## D-02 — Which layer owns the runtime unknown-prop throw (TMPL-02)

The todo suggests putting the whitelist + throw inside `bulkImport`. `bulkImport` is a thin RPC
wrapper, is subclassed by `tests/tests/utils/supabaseAdminClient.ts`, and cannot be exercised
without Supabase — so a guard living there is hard to unit-test and only fires on the write path.

- [x] **A ★ RECOMMENDED — A pure `assertKnownRowProps(dataset)` module in `packages/dev-seed/src`,
      called once from `Writer.write()` as Pass 0, before `bulkImport`.** Pure (no Supabase import),
      so `yarn test:unit` exercises it directly with no DB; covers built-ins **and**
      `--template ./custom.ts` because every path funnels through the Writer. Throws naming the
      row's `external_id`, the offending key, and the collection. `bulkImport`'s existing silent
      strips stay where they are — the guard runs first, so nothing reaches them unrecognised.
- [ ] **B — Put the throw inside `bulkImport` as the todo suggests.** Unit-testable only with a
      mocked client; the tests/ subclass inherits it, which may be desirable or surprising.
- [ ] **C — Throw from `runPipeline` instead.** Cheapest to test, but misses templates written
      straight to the Writer and runs before `attachSentinels` has added its own `_` keys.

---

## D-03 — Source of truth for the permitted `(collection, key)` set (criterion 4)

Criterion 4: *"adding a sentinel to the types without handling it in the pipeline fails a test."*
That is only structurally true if `linkJoinTables` **reads** the same declaration the types are
derived from — a parallel list plus a parity test can still drift between the two.

- [x] **A ★ RECOMMENDED — One exported `LINK_SENTINELS` const that `linkJoinTables` itself drives
      its resolution loops from.** Adding a pair to the const without adding handling makes the
      resolver's own dispatch miss, which a test catches; adding handling without listing it is
      impossible because the loop iterates the const. The full permitted set per collection is then
      the union of three derived sources: **(i) DB columns** from `@openvaa/supabase-types`
      `TablesInsert<T>`, **(ii) sentinels** from `LINK_SENTINELS`, **(iii) non-column fields**
      (`answersByExternalId`, candidate `email`, …) from one explicit per-collection const with a
      one-line reason each. The TS row types and the runtime guard both consume this union — one
      declaration, two enforcement layers.
- [ ] **B — Hand-maintained per-collection lists with a parity test against `linkJoinTables`.**
      Simpler to write; the parity test is exactly the "maintained in parallel" shape criterion 4
      rules out.

---

## D-04 — How deep zod strictness goes (criterion 3 / ASSERT-04)

**M-4** measured that `.strict()` is per-object, not deep: putting it only on `TemplateSchema`
leaves `perEntityFragment` permissive, so `template.test.ts:56` ("accepts nested `fixed[]`…")
would *still* pass with `fixed` deleted from the schema — criterion 3 unmet for that site.

- [x] **A ★ RECOMMENDED — `.strict()` on both `TemplateSchema` and `perEntityFragment`; `fixed[]`
      rows stay `z.record(z.string(), z.unknown())` at the zod layer.** Row-level unknown keys are
      the runtime guard's job (D-02/D-03), not zod's, because the allow-list is per-collection and
      derived — duplicating it into zod would create the second parallel source criterion 4
      forbids. One row-level authority.
- [ ] **B — Also generate per-collection strict zod row schemas for `fixed[]`.** Stronger at the
      zod layer; produces two independent row-level authorities to keep in step.

---

## D-05 — The "six accepts field X" tests are not six

The audit names six sites: `template.test.ts:46,56,74` and `latent.schema.test.ts:31,35,39`.
Re-measured (**M-5**, **M-6**):

| Site | Status today | Under criterion 3 |
|---|---|---|
| `template.test.ts:46` (top-level fields) | blind | becomes failable via `.strict()` |
| `template.test.ts:56` (nested `fixed[]`) | blind | becomes failable **only if `perEntityFragment` is strict too** (D-04) |
| `template.test.ts:74` (12 entity slots) | blind | becomes failable via `.strict()` |
| `latent.schema.test.ts:35` (`{latent:{}}`) | blind | becomes failable via `.strict()` |
| `latent.schema.test.ts:39` (dimensions+eigenvalues) | **already failable** — `latentBlock` is already `.strict()` | already green; re-measured, not "fixed" |
| `latent.schema.test.ts:31` (`validateTemplate({})`) | **unfailable by construction** — declares no field | no removal can fail it |

- [x] **A ★ RECOMMENDED — Re-derive the corpus and amend the record.** Report **4 blind → failable**,
      **1 already-failable** (re-measured and recorded as such, not claimed as a fix), and **1
      scoped exception** — `latent.schema.test.ts:31`, `N/A — by construction`, the same disposition
      Phase 142 gave F17. That site is *repaired differently*, by the audit's own suggested fix:
      convert it to the round-trip form `expect(validateTemplate({})).toEqual({})`, the pattern
      already used at `template.test.ts:23-24`. Amend ASSERT-04's wording and the audit's F13 entry
      **in place** (not by addendum) so the "six" figure does not propagate further.
- [ ] **B — Hold the corpus at six and force a field-removal control per site.** Impossible for
      `:31` (**M-6**); would require inventing a field for an empty-object test.
- [ ] **C — Widen the corpus to every `.not.toThrow()` in the two files** (adds
      `template.test.ts:23` and `:96`, both also `validateTemplate({})`). Adds two more sites with
      the same `:31` problem.

---

## D-06 — Where criterion 1's "TypeScript error at authoring time" is actually caught

This is the load-bearing one. **M-7/M-8**: nothing typechecks `packages/dev-seed` in any gate, and
its own `tsc --noEmit` cannot even see its `tests/` directory — a deliberate type error there
exits 0. So a tightened `Template` type would be an **IDE-only** error today, and the phase's own
negative-control fixture would be invisible to every gate. **M-10**: a repo-wide
`turbo run typecheck` is **22/22 green in 16.8s** right now, so the gate costs nothing to add.

- [x] **A ★ RECOMMENDED — Close it properly, in two moves.**
      **(i)** Widen `packages/dev-seed/tsconfig.json` to include `tests/**` (and drop/relax
      `rootDir`, which `noEmit` does not need), fixing the **3 measured pre-existing errors**
      (**M-9**) as owned fallout.
      **(ii)** Add `turbo run typecheck` to a root gate (`yarn typecheck`, chained into
      `lint:check`) **and** to the CI `main.yaml` static job — the same move Phase 142.1 made when
      it added `yarn workspace @openvaa/frontend check` on finding that neither lint nor build
      typechecks that tree. A `// @ts-expect-error` fixture in a dev-seed test file then becomes a
      real, gated two-run control: present → green; delete the offending row → the unused
      `@ts-expect-error` turns the gate red.
- [ ] **B — dev-seed only.** Do (i), gate on `yarn workspace @openvaa/dev-seed typecheck` for this
      phase, and file the repo-wide `turbo run typecheck` gap as a standing todo. Smaller blast
      radius; leaves 10 other packages ungated, and the "authoring time" claim narrower than
      TMPL-01's wording.
- [ ] **C — Use `vitest --typecheck` with `expectTypeOf`/`@ts-expect-error` instead of widening
      tsconfig.** Rides the already-gated `test:unit`; adds a vitest typecheck mode and a second
      typecheck configuration to keep in step with the first.

---

## D-07 — Should built-in templates be validated at all?

**M-11**: `resolveTemplate` validates only path-loaded templates; `return builtIns[arg]` skips
`validateTemplate` entirely. So `.strict()` would never fire on `default`, `e2e/base` or any
`perm-*` at seed time — the zod layer only ever guards *custom* templates.

- [x] **A ★ RECOMMENDED — Validate built-ins too** (`return validateTemplate(builtIn)`). Costs
      microseconds per run, makes every entry path traverse the same two layers, and means D-05's
      `.strict()` has runtime reach rather than test-only reach.
- [ ] **B — Leave built-ins unvalidated** and rely on the type layer for them (they are all typed,
      **M-12**). Keeps zod as a custom-template-only concern.

---

## D-08 — Choosing the negative-control fixtures for criterion 2

Criterion 2 needs a property that the **pre-change** seed run accepts and silently drops. **M-13**
gives three distinct silent-drop classes, and they are not equivalent.

- [x] **A ★ RECOMMENDED — Cover two classes, deliberately.**
      **(1)** an unresolved `_`-prefixed sentinel — `_constituencies` on an `elections` row (the
      D-01 exemplar), stripped by `key.startsWith('_')`;
      **(2)** `answersByExternalId` on a `questions` row — *not* `_`-prefixed, stripped globally by
      `NON_COLUMN_FIELDS` while `importAnswers` reads only `candidates`/`organizations`.
      Two classes because a guard built against `_`-prefixed keys alone would pass (1) and stay
      blind to (2). Each is run through a `--template ./custom.ts` load, per criterion 2.
- [ ] **B — One fixture, the `_`-prefixed class only.** Cheaper; leaves the non-underscore silent
      strip unproven.
- [ ] **C — Add a third fixture for `entity_type`** (dropped by the RPC's own `skip_columns`, not
      by dev-seed). Most complete; the drop happens in SQL, so the dev-seed-side guard has to
      encode DB-side knowledge — see D-09.

---

## D-09 — Columns the DB accepts in the payload but never writes

`entity_type` is a real column on several tables (so it survives any `TablesInsert`-derived
allow-list) yet `_bulk_upsert_record`'s `skip_columns` array discards it, along with `id`,
`created_at`, `updated_at`, `project_id`. A template setting `entity_type` is declaring something
the pipeline does not read — literally TMPL-01's wording — but it is not an *unknown* key.

- [x] **A ★ RECOMMENDED — A small per-collection deny-list beside the allow-list**, seeded with the
      RPC's `skip_columns` and carrying a one-line reason per entry, throwing with the same message
      shape. Keeps "declares something the pipeline does not read" honest at both ends.
- [ ] **B — Out of scope for this phase.** Allow-list only; file the DB-side skip as a standing
      todo. Narrower, and leaves a known silent drop live.

---

## D-10 — Fallout disposition for in-tree templates (criterion 5)

Criterion 5 requires every field an existing template loses to be listed with a reason.

- [x] **A ★ RECOMMENDED — Default disposition is DELETE + record the reason** in a per-field
      fallout table (file, collection, `external_id`, key, why it was never read). Adding pipeline
      support for a dropped field is **out of scope** and gets filed as a todo instead — with one
      exception: if removing a field turns an E2E spec red, that field was being read, the
      classification was wrong, and it stays.
- [ ] **B — Add pipeline support for whatever the tightening surfaces.** Unbounded; this is the
      "budget for fallout" the roadmap warns about turning into a second phase.

---

## Locked constraints (not up for discussion — restated so downstream agents carry them)

- **Standing v2.15 acceptance rule.** Prove the guard fails before claiming it guards — negative
  control run twice, once against the old assertion to demonstrate blindness, once against the new
  one to demonstrate the catch. Both halves measured **in this phase** unless a recorded OLD half
  genuinely exists to cite, with the citation named.
- **CLAUDE.md cardinal rule.** Full `yarn test:e2e` green before the phase can be called done. No
  flaky exemptions, no "cannot plausibly affect it" waiver. Per **M-12** every `perm-*` template is
  typed and seeds from these codepaths, so E2E reach here is real, not theoretical.
- **Gate set for this phase** (the Phase-143 six, plus D-06's addition):
  `yarn test:unit` · `TURBO_FORCE=true yarn lint:check` (turbo caches `lint`; a replayed green is a
  claim about a previous tree, and `yarn lint:check --force` is forbidden — yarn appends the
  argument past the `&&` chain and it silently does nothing) · `yarn format:check` · `yarn build` ·
  `yarn workspace @openvaa/frontend check` · **`turbo run typecheck`** · `yarn test:e2e`.
- **No scope creep into Phase 145.** `TMPL-03`/`TMPL-04` (the `default` template's broken
  parties/candidates output, constant-naming reconciliation) belong to Phase 145. This phase only
  reports what `default` loses to the tightening; it does not repair the dataset.
- **The 2026-05-23 sentinel-fanout todo stays open.** Removing `attachSentinels`' automatic
  fan-out is a separate, template-rewriting change explicitly timed against the
  `jsonb`→`uuid[]` migration. This phase touches `hasDeclaredScope`/`attachSentinels` only so far
  as the derived key set requires.

---

## Deferred ideas (captured, not acted on)

- Repo-wide `turbo run typecheck` in CI is *adopted* by D-06 A, but the 10 packages beyond dev-seed
  whose `tests/` are likewise outside their own tsconfig `include` are **not** audited here — file
  as a standing todo (sibling of Phase 143's D-08 lint-script-scope todo).
- Removing the `attachSentinels` fan-out (2026-05-23 todo) — see locked constraints.
- Per-row M:N join tables replacing the `election_ids` / `constituency_ids` JSONB columns.

---

## Next step

Reply with any boxes you want ticked (or "all recommended"). I'll write `144-CONTEXT.md` from your
answers and commit both files.
