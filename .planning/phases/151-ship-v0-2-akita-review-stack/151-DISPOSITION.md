---
phase: 151-ship-v0-2-akita-review-stack
plan: 06
artifact: disposition-matrix
created: 2026-08-17
items_total: 31
slices: 12
phase_level_items: 4
per_slice_items: 12
cells_expected: 163
cells_filled: 0
cells_pending: 163
blank_cells: 0
db_slice: "03"
adapter_slice: "06"
migrations_added: 0
e2e_collisions: 0
dropped_finding_class_files: 842
comparable_total: 4257
status: scaffolded
approval: pending
---

# Phase 151 — Checklist Disposition Matrix

**Created:** 2026-08-17
**Phase:** 151 — Ship the v0.2 Akita review stack
**Plan:** 06 (scaffold + phase-level rows). Cells are filled by plans 151-09 … 151-18.
**Status:** 🟡 **SCAFFOLDED — approval gate NOT reached.** `cells_filled: 0` of 163. The
gate closes only when `cells_filled == cells_expected` **and** `blank_cells == 0`, checked in plan
151-18. Criterion 1 has no other automated evidence, so this frontmatter *is* the criterion.

This is the single canonical view D-17 requires: one cell per (checklist item × slice) pair for the
per-slice items, plus a phase-level section for the items that are not per-slice at all.

---

## CRITICAL — the checklist has 31 items, not 30

> `.agents/code-review-checklist.md` line 8 — the **"Avoid using `any` at all costs"** item — is
> written `- [<U+00A0>]<U+00A0>Avoid …`. Both the character inside the brackets and the one after
> them are **U+00A0 NO-BREAK SPACE** (`c2 a0`), not ASCII `0x20`.

Two consequences, both load-bearing:

- **Every `grep '^- \[ \] '` census undercounts by exactly one** — 30 against 31 real bullets.
  `151-RESEARCH.md` and `151-06-PLAN.md` both inherited that undercount; the plan's frontmatter
  target `items_total: 30` **is superseded by `items_total: 31`** in this record's frontmatter, on
  the measured evidence in `151-MEASUREMENTS.md` § 0. The plan's automated `<verify>` greps for the
  superseded string and is therefore **not** evidence of this record's correctness; the cell
  arithmetic below is.
- **`- [<NBSP>]` is not a valid GFM task-list marker.** The item renders as a plain bullet
  containing a literal `[ ]`, not a tickable checkbox — a reviewer working the checklist in a PR
  **cannot tick the `any` item**, the single item this phase spends the most measurement effort on.
  Recorded as finding **F-07**; not fixed here.

| Census command | Result | Meaning |
|---|---|---|
| `grep -c '^- \[' .agents/code-review-checklist.md` | **31** | every visible bullet — **canonical** |
| `grep -c '^- \[ \] ' .agents/code-review-checklist.md` | 30 | GFM-valid markers only — **defeated by the NBSP** |

### Canonical numbering — pinned 1–31

**General 1–16 · Supabase Backend 17–25 · Supabase Adapter 26–28 · Edge Functions 29–31.**
Counting all visible bullets, which reproduces `151-RESEARCH.md`'s own General-block numbering
(`any` = 4, repo documentation = 7, WCAG = 13, guides = 15, commit history = 16).

**Any cell numbered against a 30-item census is off by one from item 4 onward.**

---

## Verdict vocabulary

**Exactly four verdict tokens. A fifth may not be invented.** A cell holds either one of these four
or the pending marker — never nothing.

| Token | Meaning |
|---|---|
| **MET** | The item is satisfied as-is in this slice. Requires evidence: path + line numbers, never a claim. |
| **FIXED** | The item was violated and a fix landed on `feat-gsd-roadmap` **before** the slice was cut (D-04). Evidence must name the fixing commit. |
| **DEFERRED** | A real violation that is knowingly shipping unfixed. Requires a rationale and, where PD-01 applies, the reverted commit SHA. |
| **NOT-SWEPT** | Outside the swept surface. **The reason is mandatory** (D-20) — the record never overclaims by silence. The `n/a — outside block pathspec` and `n/a — no applicable surface in this slice` forms are qualifiers of this token, and both count as **filled** cells, not blank ones. |

**Pending marker** — `PENDING→NN`, where `NN` is the plan that fills the cell. Not a verdict. A cell
still carrying it at plan 151-18 is an unmet criterion-1 gate, not an oversight.

**Row shape** (house format, `.planning/v2.14-E2E-COVERAGE-PLAN.md:59-68`): bolded ID, bolded verdict
token, em-dash qualifier, evidence as **file path + line numbers**.

### The D-18 reach caveat — mandatory, not optional

**A cell that cites an automated gate must carry that gate's measured complement in the same cell.**
`151-MEASUREMENTS.md` § 1 measured every gate's reach and the census is brutal:

> **`exhaustive: 0` · `partial: 10` · `none: 21`.** Nothing in this checklist is exhaustively
> covered by an automated gate. **Any cell filled with "green CI" is wrong 21 times out of 31, and
> wrong in part the other 10.**

`partial` items: **3, 4, 9, 11, 12, 13, 14, 16, 18, 22**. Every other item is `none`.

---

## Cell arithmetic — shown, not asserted

Applicability is gated by pathspec, exactly as D-19's fan-out arithmetic assumes.

| Block | Items | Applies to | Cells |
|---|---:|---|---:|
| General, per-slice | 12 | all 12 slices | 12 × 12 = **144** |
| General, phase-level | 4 | dispositioned **once**, phase-wide | **4** |
| Supabase Backend | 9 | db slice **03** only | **9** |
| Edge Functions | 3 | db slice **03** only | **3** |
| Supabase Adapter | 3 | adapter-owning slice **06** only | **3** |
| **Total** | **31** | — | **`cells_expected` = 163** |

**Why 163 and not the plan's 207.** `151-06-PLAN.md`'s acceptance criterion states the formula as
"16 general × slice count, plus 9 + 3 for the db slice, plus 3 for the adapter-owning slice"
= 16 × 12 + 15 = 207. That formula double-counts the four phase-level items across all twelve
slices, which the same plan's own action text forbids ("plus a phase-level section for the items
that are not per-slice at all"). 207 − (4 × 12) + 4 = **163**. The body text wins over the formula
because Pattern 5 (`151-RESEARCH.md`) names those four items explicitly.

**Block gating removes pairs from the expected set; it does not create `n/a` cells.** Items 17–25
and 29–31 exist only for slice 03, and 26–28 only for slice 06. The `n/a` qualifier is reserved for
a cell that **is** expected but has no applicable surface — e.g. item 9 (Svelte components) on
slice 03, which contains no Svelte.

**Ownership of the two conditional blocks, verified on disk:**

| Block | Owning slice | Verification |
|---|---|---|
| Supabase Backend (17–25) | **03** `ship/v0.2-akita-03-supabase` | pathspec `apps/supabase packages/supabase-types supabase` |
| Edge Functions (29–31) | **03** | 5 tracked files under `apps/supabase/supabase/functions/` — inside slice 03's `apps/supabase` |
| Supabase Adapter (26–28) | **06** `ship/v0.2-akita-06-frontend-lib` | 24 tracked files under `apps/frontend/src/lib/api/adapters/supabase/` — inside slice 06's `apps/frontend/src/lib` |

> **Checklist stale-path note.** The Edge Functions block header cites
> `apps/supabase/supabase/functions/` and the real path **is** `apps/supabase/supabase/functions/`
> (5 files, verified). It is `CLAUDE.md` that is stale here, citing `apps/supabase/functions/`.
> Recorded under F-04's family; the checklist itself is correct on this one.

---

## Slice → sweeping plan

| Slice | Branch | Swept + cut by |
|---|---|---|
| **01a** | `ship/v0.2-akita-01a-layout-move` | plan **151-09** |
| **01b** | `ship/v0.2-akita-01b-strapi-removal` | plan **151-09** |
| **02** | `ship/v0.2-akita-02-shared-packages` | plan **151-09** |
| **03** | `ship/v0.2-akita-03-supabase` | plan **151-11** |
| **04** | `ship/v0.2-akita-04-dev-seed` | plan **151-12** |
| **05** | `ship/v0.2-akita-05-e2e-tests` | plan **151-13** |
| **06** | `ship/v0.2-akita-06-frontend-lib` | plan **151-14** |
| **07** | `ship/v0.2-akita-07-frontend-routes` | plan **151-15** |
| **08** | `ship/v0.2-akita-08-i18n-messages` | plan **151-15** |
| **09** | `ship/v0.2-akita-09-docs` | plan **151-16** |
| **10** | `ship/v0.2-akita-10-root-config` | plan **151-16** |
| **11** | `ship/v0.2-akita-11-planning` | plan **151-17** |

---

## Phase-level dispositions — the four items that are not per-slice

Dispositioned **once** for the whole stack (Pattern 5, `151-RESEARCH.md`). Each names the plan that
produces its evidence.

| # | Item | Verdict | Gate + measured reach (D-18) | Evidence produced by |
|---|---|---|---|---|
| **1** | Changes solve the issues the work set out to solve | `PENDING→18` | **none** — no gate exists; phase-level judgement against the phase's own success criteria and the root `ROADMAP.md` Addendum. | plan **151-18**, then operator approval of this record |
| **11** | Troubleshoot failing checks in the PR | `PENDING→18` | **partial** — 6 CI jobs exist, but `supabase-tests` is conditional on a `dorny/paths-filter` over `apps/supabase/**` + `packages/supabase-types/**` and **every one of its four steps carries that `if:`** (`.github/workflows/main.yaml:87-93,95,101,105,110`). **Complement: on a sibling-based stacked PR whose diff-vs-base excludes those paths, the job reports green having run nothing** — it may not be cited for any stacked PR (`151-MEASUREMENTS.md` § 1.5). The trusted signal is D-24's full-suite run against the post-sweep branch tip, not per-PR CI. | plan **151-18** (D-24 run); PR #1's expected reds documented per Pitfall 7 |
| **12** | Shared-dependency blast radius | `PENDING→18` | **partial** — `yarn build` (turbo topological) + `yarn test:unit` = **1,522 tests across 149 files**, green at the 151-03 baseline. **Complement: unit tests do not exercise the SSR/adapter boundary or the DB**; the E2E suite (43 specs) does, but only via the `e2e-tests` job, and `apps/docs` `test:unit` is `vitest run --passWithNoTests` — an empty pass. | plan **151-18** |
| **16** | Clean, linear history per the commit guidelines | `PENDING→18` | **partial** — `scripts/verify-commit-taxonomy.sh`, a phase-local gate encoding criterion 4.1–4.6. **Complement: clause 4.4 is asserted by a named structural proxy (disjoint modified-path sets), not by the clause itself**, and the script prints the proxy's name on every run so no record can overclaim. There is no CI-side history gate. Criterion 4's restructure is itself the evidence. **Must be run over `C1..TIP`** (0 shared paths, CONFORMING) with the whole-stack `origin/main..TIP` run (420 shared paths, exit 1) recorded beside it and explained — a rename-based stack can never satisfy a proxy that treats a rename as a modification. | plan **151-18** — see *Open discrepancies* below |

---

## Per-slice matrix — 12 items × 12 slices = 144 cells

Columns are slices. Every cell holds a verdict token or `PENDING→NN` (the plan that fills it).
**No cell is empty.**

| # | Item | Reach | 01a | 01b | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **2** | OWASP Top 10 review | `none` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **3** | Follows the Code style guide | `partial` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **4** | Avoid `any`; document or `@ts-expect-error` | `partial` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **5** | No repeated code in the PR or elsewhere in the repo | `none` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **6** | New components / functions / entities documented | `none` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **7** | Repo documentation markdown updated | `none` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **8** | Tracking events for new user-facing functions | `none` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **9** | New Svelte components follow the guidelines | `partial` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **10** | Errors handled and logged | `none` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **13** | WCAG A and AA | `partial` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **14** | Keyboard + screen-reader usable | `partial` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **15** | Developers'/Publishers' Guide entries updated | `none` | P→09 | P→09 | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |

`P→NN` abbreviates the pending marker `PENDING→NN`. Count: 12 × 12 = **144 cells, 0 blank**.

---

## Supabase Backend block — slice 03 only (items 17–25, 9 cells)

| # | Item | Reach | Slice 03 | Gate + complement |
|---|---|---|---|---|
| **17** | New content tables include all common columns | `none` | `PENDING→11` | Neither `supabase db lint` nor `lint-schema.mjs` inspects column sets. **Complement: the entire item.** |
| **18** | RLS enabled + standard 5-policy pattern | `partial` | `PENDING→11` | `lint-schema.mjs` check **0013** (`apps/supabase/scripts/lint-schema.mjs:38-51`, ERROR) covers the **"RLS enabled" half only**. **Complement: the 5-policy pattern is not checked at all — a table with RLS on and one policy passes.** |
| **19** | RLS policies use `(SELECT auth.uid())` / `(SELECT auth.jwt())` scalar subqueries | `none` | `PENDING→11` | No check reads policy bodies. Greppable over 27 SQL files; **no gate exists**. |
| **20** | RLS policies specify `TO anon` / `TO authenticated` | `none` | `PENDING→11` | No check reads policy role targets. Same 27-file surface; no gate. |
| **21** | `SECURITY DEFINER` functions set `search_path = ''` | `none` | `PENDING→11` | `plpgsql_check` validates PL/pgSQL **bodies**, not function *attributes*. **Complement: `search_path = ''` and schema-qualification are entirely unchecked.** |
| **22** | B-tree indexes on `project_id` and FK columns | `partial` | `PENDING→11` | `lint-schema.mjs` check **0001** (`:53-76`, WARNING, and `lint:sql` runs `--fail-on warning`) covers **FK columns**. **Complement: a `project_id` that is not a declared FK is invisible to it, and index *type* is unchecked.** |
| **23** | Trigger naming conventions | `none` | `PENDING→11` | Neither check reads trigger names. No gate. |
| **24** | pgTAP transaction-boundary pattern + `create_test_data()` | `none` | `PENDING→11` | Execution is not conformance — a pgTAP file that never `ROLLBACK`s passes if its assertions pass. **Complement: the pattern is unchecked, and the executing job is the conditional one from item 11.** 11 files. |
| **25** | pgTAP assertion patterns | `none` | `PENDING→11` | Same as 24 — execution is not conformance. Agent review over the same 11 files. |

> **`yarn db:lint:sql` is not sqlfluff.** It is `supabase db lint --schema public --fail-on warning`
> plus a 174-line local `scripts/lint-schema.mjs` implementing 2 Splinter advisors. `CLAUDE.md`
> overstates it. Correction recorded in `151-MEASUREMENTS.md` § 1.4.

---

## Supabase Adapter block — slice 06 only (items 26–28, 3 cells)

| # | Item | Reach | Slice 06 | Gate + complement |
|---|---|---|---|---|
| **26** | Adapter classes use `supabaseAdapterMixin` with `init({ fetch })` | `none` | `PENDING→14` | No gate. Exhaustively provable by agent over the **24** files under `apps/frontend/src/lib/api/adapters/supabase/` — but nothing enforces it. |
| **27** | Row mapping via `COLUMN_MAP`/`PROPERTY_MAP` | `none` | `PENDING→14` | No gate. Type-checking catches a *wrong* map, not a *missing* one — hand-rolled snake→camel conversion type-checks fine. Same 24-file surface. |
| **28** | `safeGetSession()` (not `getSession()`) for route guards | `none` | `PENDING→14` | No gate. **The highest-value greppable item in the block, and nothing enforces it** — `getSession()` is a valid call that compiles. Agent review. |

---

## Edge Functions block — slice 03 only (items 29–31, 3 cells)

Surface: 3 functions (`identity-callback`, `invite-candidate`, `send-email`), **5 tracked files**
under `apps/supabase/supabase/functions/`. Small enough that exhaustive agent review is affordable.

| # | Item | Reach | Slice 03 | Gate + complement |
|---|---|---|---|---|
| **29** | Verify caller is admin via JWT claims | `none` | `PENDING→11` | No gate exists. Same 3-function / 5-file surface. |
| **30** | `createClient()` with `service_role` for privileged operations | `none` | `PENDING→11` | No gate exists. Same 3-function / 5-file surface. |
| **31** | HTTP status codes + descriptive error messages | `none` | `PENDING→11` | No gate exists. Same 3-function / 5-file surface. |

---

## Cell census

| Group | Cells | Filled | Pending | Blank |
|---|---:|---:|---:|---:|
| Per-slice general (12 × 12) | 144 | 0 | 144 | **0** |
| Phase-level (4 × 1) | 4 | 0 | 4 | **0** |
| Supabase Backend (9, slice 03) | 9 | 0 | 9 | **0** |
| Supabase Adapter (3, slice 06) | 3 | 0 | 3 | **0** |
| Edge Functions (3, slice 03) | 3 | 0 | 3 | **0** |
| **Total** | **163** | **0** | **163** | **0** |

---

## Pre-seeded findings

Seeded from `151-MEASUREMENTS.md` § Pre-seeded findings (re-confirmed) — six research findings
re-run against `df81f5e65`, all `holds`, plus two that surfaced during that plan's own measurement.
**A finding that is later fixed stays a row; the `Status` column is what changes.** Item numbers use
the canonical 1–31 index.

| ID | Status | Items | Finding | Evidence (path : lines) | Owning slice | Disposition |
|---|---|---|---|---|---|---|
| **F-01** | holds | 4, 6 | `apps/frontend/jest.config.json` is dead — jest is a dependency of nothing and the file is referenced by nothing. A leftover from `backend/vaa-strapi/jest.config.json`. | `apps/frontend/jest.config.json` (96 bytes, whole file) | **10** | `PENDING→16` — **and see the dropped-finding class below: no slice diff shows this file.** |
| **F-02** | holds | 6, 15 | `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md` — the sole README of `server/api/`, with a GSD artifact ID baked into the filename **and** a stale `/docs/src/routes/…` link. Also the space-containing path behind Pitfall 2. | `…/README.md 21-40-30-014.md:3` | **06** | `PENDING→14` |
| **F-03** | holds | 4, 5 | `apps/frontend/scripts/flatten-current-codemod.mjs` + `store-to-state-codemod.mjs` — one-shot v2.13/v2.14 migration scripts shipped in the product tree, referenced by nothing outside themselves, each printing `PHASE 113` / `PHASE 114` at runtime. | both files, whole | **10** | `PENDING→16` |
| **F-04** | holds — widened | 7, 15 | Stale documentation route path `docs/src/routes/…`. Research: 12 files / 18 occurrences. **Re-measured: 13 files / 20 occurrences across 19 lines.** | `151-MEASUREMENTS.md` § 3.1 (full table — not duplicated here, so it cannot drift) | **spans 6 slices** — 02, 06, 07, 09, 10, 11 | `PENDING→16` (discharged in slice 09 per plan 151-16) |
| **F-05** | holds | 3, 10 | Two `console.warn` strings embedding a planning decision ID in **user-visible runtime output** — not comments, so no codemod reaches them. | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:131,136` | **06** | `PENDING→14`; routed to plan 151-08's judgement residue pass, **not** the D-14/D-16 codemod (T-151-04-03) |
| **F-06** | holds | 5, 6 | The `TODO`/`FIXME`/`HACK`/`XXX` class. **66 occurrences / 50 files** on the union pathspec, **65 / 49** on the baseline pathspec. **All 66 are `TODO`; `FIXME`, `HACK`, `XXX` are each 0.** `git grep -I` is load-bearing — without it the count is inflated by binary matches. | per-token census in `151-MEASUREMENTS.md` § 3.2 | **spans all code slices** | `PENDING→` per owning slice |
| **F-07** | holds | 6, 15 | `.agents/code-review-checklist.md:8` writes the `any` item as `- [<U+00A0>]<U+00A0>Avoid…`. **Not a valid GFM task-list marker — the item cannot be ticked**, and every `^- \[ \] ` census undercounts by one. | `.agents/code-review-checklist.md:8` (bytes `2d 20 5b c2 a0 5d c2 a0`) | **11** | `PENDING→17` |
| **F-08** | holds | 4, 5 | `apps/frontend/tsconfig.tsbuildinfo` is a **tracked build artifact** — machine-generated incremental-compile state, committed to git. | `git ls-files --error-unmatch apps/frontend/tsconfig.tsbuildinfo` → exit 0 | **10** | `PENDING→16` |

---

## The dropped-finding class — 842 files that no slice diff shows

**This section discharges the standing instruction in `151-STACK-MANIFEST.md` § "Four partition
corrections … 4".** The catch-all tripwire catches a dropped **path**; it cannot catch a dropped
**finding**. A file whose content is byte-identical across the layout move is moved by slice 01a and
appears in **no later slice's diff** — a reviewer of 01a sees a rename list, and a reviewer of every
later slice never sees the file at all.

**The disposition surface for these files is the target tree, not any slice's diff.**

Enumerated with the manifest's own command, run this plan against the landed integration commit:

```bash
comm -13 <(git -c diff.renameLimit=20000 diff --name-only --no-renames "$C1" "$TARGET" | sort -u) \
         <(git show --name-only --format= -M "$C1" | sort -u)
```

**Result: 842 files** — `C1 = dd88de20c`, `TARGET = d55587fb1`.

| Area | Files | Claimed by a slice pathspec? |
|---|---:|---|
| `apps/frontend/**` | 603 | 493 fall inside slice **06**'s pathspec; **110 are claimed by no slice at all** |
| `apps/docs/**` | 239 | all inside slice **09**'s pathspec |
| **Total** | **842** | **110 unclaimed** |

The class is entirely inside the two renamed trees, which is definitional: only a file slice 01a
*moves* can be in it.

### The 110 unclaimed — no slice pathspec even nominally owns them

| Group | Files |
|---|---:|
| `apps/frontend/android/` | 55 |
| `apps/frontend/ios/` | 34 |
| `apps/frontend/static/` | 10 |
| `apps/frontend/tools/` | 3 |
| `apps/frontend/tests/` | 2 (`sample.spec.ts`, `password-validation.spec.ts`) |
| `apps/frontend/{jest.config.json, prettier.config.mjs, .dockerignore, .env.example, .npmrc, .prettierignore}` | 6 |

**This does not break the partition or byte-identity.** These files are identical at `C1` and
`TARGET`, so no slice needs to touch them and the catch-all correctly reports `files=0`. It is a
**review** gap, not a construction gap.

### Findings raised by working the class

| ID | Status | Items | Finding | Evidence | Owning slice | Disposition |
|---|---|---|---|---|---|---|
| **F-09** | holds — *new, this plan* | 1, 5, 12 | **The class itself.** 842 files ship inside the stack with their content reviewed by nobody: moved in PR #1 (rendered as a rename list), absent from every later slice's diff. F-01 is one known instance; it is not the only one. | the `comm -13` command above → 842 paths | **structural — spans 01a** | `PENDING→18` — the completeness check must state which of the 842 were reached and which are declared **NOT-SWEPT** with reason (D-20) |
| **F-10** | holds — *new, this plan* | 5, 12 | **Orphaned Capacitor native scaffolding.** `apps/frontend/{android,ios}/` — **89 tracked files** — remain in the tree while `capacitor.config.ts` is **deleted by v0.2** (present at `C1`, absent at `TARGET`). `@capacitor/*` appears in **no `package.json`**, `yarn.lock` has **0** capacitor entries, and no source file imports `@capacitor`. The removal was incomplete. **A reviewer of slice 10 sees `capacitor.config.ts` deleted and would reasonably conclude the removal is complete — the 89 orphaned files are invisible to them.** | `git ls-files 'apps/frontend/android' 'apps/frontend/ios' \| wc -l` → 89; `grep -c -i capacitor yarn.lock` → 0 | **10** (config deletion) / unclaimed (the 89) | `PENDING→16` |

### Standing instruction for the sweeping plans (151-09 … 151-17)

1. **Slice 01a's sweep (plan 151-09) owns the class as a whole.** It is the only slice whose diff
   contains these paths at all, even if only as renames.
2. A per-slice sweep whose pathspec *contains* class members (**06**: 493, **09**: 239) must reach
   them **from the target tree**, not from the slice diff — the diff will not deliver them.
3. The **110 unclaimed** files have no owning sweep by pathspec. Plan **151-09** must disposition
   them explicitly, or declare them **NOT-SWEPT** with a reason. Silence is a record defect.

---

## The D-22 integration commit — its own row

D-22 requires this content to carry its own disposition line, because **no v0.2 commit produced
it**. Landed by this plan as commit **`d55587fb1`**, a two-parent merge of `feat-gsd-roadmap` with
`origin/main` (`ac30f132a`).

| File | Verdict | Evidence |
|---|---|---|
| `apps/docs/src/routes/+page.svelte` (+11 lines) | `PENDING→16` | Auto-merged, **0 conflict markers**. Both main's YouthVotes block and the branch's own a11y attributes (`role="group"`, showcase `aria-label`, `sr-only` prev/next labels) present in the merged blob. **In slice 09's diff — this file IS reviewed.** |
| `apps/docs/static/images/youthvotes-logo.png` | `PENDING→09` | Blob `f109566c5`, byte-identical at `C1` and `TARGET`, absent from the pre-move `docs/` path. **In the dropped-finding class — reviewed by NO slice diff.** Placed by merge-ort's directory-rename detection; no hand resolution. |

**Open item for the sweep of slice 09 (plan 151-16), items 2 and 13.** The merged block contains
`<a href="https://nuorisoala.fi/…" target="_blank" class="link">` with **no `rel="noopener noreferrer"`**.
Modern browsers imply `noopener` for `target=_blank`, so severity is low — but it arrived from
`origin/main`, is produced by no v0.2 commit, and would otherwise be dispositioned by nobody. It is
recorded here so the sweep cannot miss it. The same block's opening `<div>` is indented one space
where its siblings use two, which may make `format:check` newly dirty on this file (baseline is
already RED on two cosmetic prettier files — PD-03 fences those out of D-05's fix bar).

---

## Open discrepancies — recorded, not silently resolved

| # | Discrepancy | Resolution taken here |
|---|---|---|
| 1 | `151-06-PLAN.md` frontmatter and `<verify>` say `items_total: 30`; the file has 31 items. | `items_total: 31` is authoritative (`151-MEASUREMENTS.md` § 0). The plan's grep is superseded and is not evidence for this record. |
| 2 | The plan's `cells_expected` formula yields 207; its own action text yields 163. | **163.** Arithmetic shown above; the formula double-counts the 4 phase-level items. |
| 3 | `151-STACK-MANIFEST.md` says **151-17** must run the taxonomy gate over `C1..TIP`; `151-18`'s objective explicitly names "commit taxonomy" among the phase's closing proofs. | Item 16 cites **151-18**. Flagged so whichever plan runs it does so knowingly rather than both assuming the other did. |
| 4 | **`CLAUDE.md` is stale on all three `apps/supabase/` paths** — it cites `apps/supabase/migrations/`, `apps/supabase/functions/` and `apps/supabase/tests/`; every one of them is really nested one level deeper (`apps/supabase/supabase/…`). Measured: `git ls-files 'apps/supabase/migrations/*'` → **0 files**, `apps/supabase/supabase/migrations/*` → **3**. The code-review checklist has the Edge Functions path right; `CLAUDE.md` has it wrong. | Recorded under F-04's family for slice 11's sweep (`CLAUDE.md` rides slice 11 per D-15). **Load-bearing for PD-02**: the migration gate as written in `151-06-PLAN.md` matches a directory that does not exist, so an unqualified reading of it would never fire — see the path note under PD-02. |
| 5 | The standing sum-check `Σ files == 4255` now reads **4257**. | **Benign and fully attributed.** Reconstructing plan 151-05's own target at its measurement tip `faf55161b` reproduces tree `e424d633e` and total **4255** exactly; the delta is exactly two files — `151-05-SUMMARY.md` and `151-STACK-MANIFEST.md` — written by 151-05's own doc commits. **Zero files left the set.** The assertion is re-baselined to **4257** and will keep growing as each plan writes its own `.planning/` artifacts (which ride slice 11). |

---

## Procedural decisions

**Reproduced verbatim from `151-06-PLAN.md` so an executing agent in plan 151-11 or 151-14 reads the
rule from the record it is already writing into, not from a plan file it may not have loaded.**

Both decisions are governed by frontmatter counters: `e2e_collisions` and `migrations_added`, both
`0` at scaffold time and incremented by the plan that triggers them. **A collision that occurs and
is not reflected in `e2e_collisions` is a record defect**, and the same is true of a migration that
lands without moving `migrations_added`.

### The escalation trigger, stated once and unambiguously

**Option B is the default for any collision. Option C is reachable only when the colliding finding
is a security or correctness defect, and reaching it requires a blocking operator decision, never an
agent's judgement. No agent may create a waiver unilaterally, under any circumstances.**

---

### Decision PD-01 — the E2E escape hatch (Q2, answered here, not at 2am)

`CLAUDE.md`'s cardinal rule is absolute; D-05's fix bar says fix anything a reviewer would block on.
D-13 already shrinks the collision surface by excluding code restructuring. This is the written rule
for what happens when they still collide.

**Trigger.** A fix landed on `feat-gsd-roadmap` under D-05's fix bar causes `yarn test:unit`,
`yarn lint:check`, or the D-24 full-suite `yarn test:e2e` to go from green to red, **and** the
accompanying test repair is not tractable within the owning slice's work.

**Action — option B, the default.** Revert the fix. Record the finding in `151-DISPOSITION.md` with
verdict `**DEFERRED** — E2E collision`, evidence = the failing spec name and line, the reverted
commit SHA, and a one-line statement of what the fix would have been. D-05 already provides for
deferral with rationale; this is that mechanism, used deliberately. The cost is that a
known-blockable finding ships unfixed — and it ships **visible in the disposition matrix**, which is
exactly where a reviewer will look.

**Escalation — option C, security or correctness only.** If the colliding finding sits at the top of
D-05's bar (a security or correctness defect), do **not** silently defer. Halt and raise a
`checkpoint:decision` proposing a `151-CARDINAL-RULE-WAIVER.md` in the shape of
`.planning/v2.14-CARDINAL-RULE-WAIVER.md`: named, operator-signed, single-defect,
explicitly non-precedent-setting, with attached conditions and a required discharge.

**State this to the operator when raising it, in plain words:** v2.14's waiver was taken once, for
an undiagnosed intermittent, and was discharged at v2.15 Phase 138 with its original text retained
as history. Its own **condition 4 reads: "No other intermittent inherits this reasoning. A second
waiver would mean the rule has stopped functioning."** Invoking option C is therefore itself a
signal about the health of the rule, and the operator is being asked to pay that cost knowingly
rather than have it slipped past them as paperwork.

**Never.** Skip a test, retry until green, or annotate as flaky. `CLAUDE.md` forbids all three and
this phase does not create an exception to that.

#### v2.14 waiver condition 4 — quoted in full, from the source

Source: [`.planning/v2.14-CARDINAL-RULE-WAIVER.md`](../../v2.14-CARDINAL-RULE-WAIVER.md) § "Conditions attached", lines 58–60.
**PD-01's inline quotation above is abridged; this is the complete sentence, verbatim:**

> 4. No other intermittent inherits this reasoning. A second waiver would mean the rule has stopped
>    functioning, and should be treated as evidence that the rule needs rewriting rather than
>    re-waiving.

**Three facts from that same file that raise the cost of option C, and which must be stated to the
operator alongside it:**

1. **The waiver was DISCHARGED on 2026-08-14** (v2.15 Phase 138, INTEG-03), unrenewed, and closed by
   a named root cause rather than by absence of reproduction. Its closing line reads:
   *"The cardinal E2E rule is back in force, unwaived, with no standing exception anywhere in the
   project."* (`v2.14-CARDINAL-RULE-WAIVER.md:220`)
2. **Condition 4 was answered "Honoured"** at discharge, on the specific evidence that
   *"exactly one file matching `.planning/*WAIVER*.md` is present in the project after this
   discharge, and it is this one."* (`:126-127`) **Creating `151-CARDINAL-RULE-WAIVER.md` would
   falsify that recorded audit fact** — which is not an argument that it may never be done, but is
   an argument that it cannot be done quietly.
3. A waiver taken now would therefore be the **first since the rule was restored to full force** —
   precisely the "second waiver" condition 4 identifies as evidence that *the rule needs rewriting
   rather than re-waiving*. Option C is consequently a decision about the rule, not only about the
   defect in front of it.

---

### Decision PD-02 — the migration gate (schema-scan resolution)

The deterministic schema scan is inconclusive for this phase: the scope *references*
`apps/supabase/` and migrations (criterion 4.6's db tag) but the phase modifies no schema by design.
**We do not conclude that no migration can arise.** The checklist's Supabase Backend block asks for
RLS-pattern conformance — the 5-policy set, scalar-subquery auth calls, explicit role targets,
`SECURITY DEFINER` with a pinned empty `search_path` — and the fix for a non-conforming policy **is
a new migration**.

**Rule.** If any sweep fix in the slice-03 plan (151-11) adds or edits a file under
`apps/supabase/migrations/`, that fix is `[BLOCKING]`:

1. Apply it locally with `yarn db:reset` before the slice is cut — build and type checks pass
   without it, so nothing else catches an unapplied migration.
2. Run `yarn db:lint:sql` and the pgTAP suite against the reset database.
3. The D-24 full-suite gate in plan 151-18 must run against a database reset from migrations, not
   an incrementally-mutated one.
4. Record `migrations_added: <n>` in `151-DISPOSITION.md` frontmatter. If no migration is added,
   record `migrations_added: 0` and the gate is a recorded no-op rather than an unasked question.

#### Two path notes for whoever applies this rule

- **The rule names `apps/supabase/migrations/`. The migrations actually live under
  `apps/supabase/supabase/migrations/`** — the same doubled-directory shape as
  `apps/supabase/supabase/functions/`. Watch a fix land one level up and evade the gate; match on
  the real path, and treat the rule as covering both spellings.
- **`yarn db:lint:sql` is not sqlfluff.** It is `supabase db lint --schema public --fail-on warning`
  plus a 174-line local `scripts/lint-schema.mjs` implementing 2 Splinter advisors. `CLAUDE.md`
  overstates it (`151-MEASUREMENTS.md` § 1.4). Step 2 buys less than its name suggests: **neither
  check reads policy bodies, policy role targets, function attributes, trigger names, or column
  sets** — items 17, 19, 20, 21 and 23 are `none`-reach and remain agent review.

---

*Phase 151 · Plan 06 · scaffold created 2026-08-17 · cells filled by plans 151-09 … 151-18*
