# Phase 143: `svelte/store` Guard — App-Wide Reach + Fallout Triage — Research

**Researched:** 2026-08-22
**Domain:** ESLint 9 flat config (rule composition + REPLACE semantics), `no-restricted-syntax`
AST-selector authoring, Turborepo task caching as an evidence hazard, ESLint-JS-API table-driven
testing under vitest
**Confidence:** HIGH — every finding below is a measurement taken in this session on this tree, not a
recollection. Working tree was restored byte-identical after each mutation (proofs inline).

**Measurement HEAD:** `0e014d6a982a37d77e56df89afe5796d24ef1b57` (`docs(143): discussion resolved —
CONTEXT.md + DISCUSSION-LOG.md`, branch `feat-gsd-roadmap`).

> **HEAD note the planner must carry.** CONTEXT.md and DISCUSSION-POINTS.md were both measured at
> `374af0bf6`. HEAD has since advanced by one commit — `0e014d6a9`, the CONTEXT/LOG docs commit.
> `git diff 374af0bf6 HEAD -- apps/frontend/eslint.config.mjs
> apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` is **empty**, so every product fact in
> CONTEXT.md still holds at the current HEAD. Only the planning docs moved.
> [VERIFIED: measured this session — `git diff` returned no output, `git merge-base --is-ancestor
> 374af0bf6 HEAD` → YES]

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

All 15 discussion items resolved at their ★ RECOMMENDED option; two ⚠ DERIVED consequences recorded.
Copied verbatim in substance from `143-CONTEXT.md` § Implementation Decisions:

- **D-01** — The phase is re-scoped to "prove the reach, close the measured gaps, correct the record".
  Keeps its number and both requirements. Delivers (1) the two-run control at all four SC-1 sites;
  (2) closure of gaps 10 and 11; (3) the standing four-site guard test; (4) ASSERT-09 discharged as a
  measured zero; (5) the record correction. **The title needs rewriting** — part of D-12.
- **D-02** — The OLD (blind) half is produced by **in-place narrow → measure → restore**. Procedure
  (Phase 141's `141-ASSERT10-LEDGER.md` discipline verbatim): (1) temporarily set
  `eslint.config.mjs:88` back to
  `['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}']`; (2) run the four injections
  through the **real `yarn lint:check`** — not the ESLint API; (3) record all four **GREEN (blind)**
  in the ledger; (4) restore, and **prove the restore** with `git diff --exit-code` on the config
  file. The ledger must record the HEAD and the restore proof or the evidence is worthless. The
  working tree is deliberately broken for the duration of step 2; **no other work may interleave**.
- **D-03** — **3 plans, fully serial**, mirroring 142.1. `143-01`: open
  `143-NEGATIVE-CONTROL-LEDGER.md` with **every row written before the first injection** (the 142.1
  D-19 rule); measure every OLD half on the **untouched tree**; take the full pre-existing-usage
  inventory (D-09) and the out-of-scope measurements (D-07, D-08). `143-02`: land the config change
  (D-05, D-06), the extended guard test (D-04), and the record corrections (D-12, D-12a) together;
  measure every NEW half. `143-03`: gates (D-14, D-15) + reconciliation. Wave 2 is the only one that
  writes product bytes.
- **D-04** — The standing guard test grows to a **table-driven 4 dirs × {`.ts`, `.svelte`} matrix** —
  eight positive cases — plus the existing negative control, plus one dynamic-import probe from D-06,
  **in the same file**. The file's stated correctness invariants (`:20-29`) are load-bearing and must
  survive the rewrite: `filePath` MUST resolve under `apps/frontend/src/**`;
  `new ESLint({ flags: ['v10_config_lookup_from_file'] })` is MANDATORY; filter on
  `ruleId === 'no-restricted-imports'`, never a bare `errorCount` (D-06's probe filters on
  `ruleId === 'no-restricted-syntax'` for the same reason).
- **D-05** ⚠ — The glob widens to `src/**/*.{ts,js,mjs,cjs,svelte}`. `.mjs` and `.cjs` are included
  alongside `.js`. **Required post-change measurement:** re-run `yarn lint:check` and confirm zero
  new violations **as a measurement**, and record it. Do not assume it.
- **D-06** — Dynamic `import('svelte/store')` is closed with a `no-restricted-syntax` entry **in the
  same config block**, selector `ImportExpression[source.value='svelte/store']`, message pointing at
  the same rune guidance as the `paths` entry. Add **one probe to the guard test**. **Mitigation for
  the split:** tie the two rules together with a comment at the config site.
- **D-07** — `svelte/motion` is out of scope; measured, recorded in the ledger, and **filed as a
  todo** for its own small phase.
- **D-08** — Files outside `src/` are out of scope; recorded here and in the ledger, and **filed as a
  todo** for the lint-script scope.
- **D-09** — ASSERT-09 is discharged as a **measured zero with a per-file disposition table**: the
  exact commands, the HEAD they ran at, and a per-file row for every hit, classified *prose* / *test
  fixture* / *real import*, with `file:line`. The four prose mentions are **not** migrated.
- **D-09a** ⚠ DERIVED — The disposition table covers **5 files / 10 lines**, not "five mentions".
  Both greps are re-run at the executing HEAD and **both counts recorded**; if the count differs
  again, the measurement wins and the delta is stated. The strict grep's result discharges ASSERT-09;
  the loose grep's result is the disposition table's input.
- **D-10** — SC-4's independent grep is **one-time and recorded**, not a standing gate. A standing
  grep spec is explicitly rejected.
- **D-11** — The dead `'**/_spikes-*/**'` ignore **stays**; it is recorded as measured-dead. State the
  exclusion list's size before and after, and that the entry currently matches nothing.
- **D-12** ⚠ — All record targets are corrected in-phase, **naming `7c47b35b7` at each**:
  `ROADMAP.md:264`; ROADMAP § Phase 143 SC-1; ROADMAP § Phase 143 SC-2/SC-3;
  `.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` → `completed/`;
  `REQUIREMENTS.md` ASSERT-08/09 (`:62-63`) + status rows (`:153-154`), checkboxes flipped **only
  after the gates run**. Follow Phase 141's correction convention: state plainly that the earlier
  wording was **wrong when written**, and why. **Binding constraint:** the rewritten SC must be
  *harder* to satisfy than the original, not softer; a plan that rewrites an SC must show the
  before/after and argue the direction.
- **D-12a** ⚠ DERIVED — `eslint-store-guard.test.ts` is a **fifth record target**: `:8`'s stripped
  requirement ID must be restored to name ASSERT-08 and the Phase-115 supersession; `:12`'s "lines
  77-84" citation must be corrected or replaced with a stable anchor. The header's
  correctness-invariant block (`:20-29`) is **preserved**.
- **D-13** — Evidence lives in `143-NEGATIVE-CONTROL-LEDGER.md`. Rows written **before** the first
  injection, each carrying **assertion site, command, exit code, and the HEAD it ran at**.
- **D-14** — Five static gates + one full E2E run: `yarn test:unit`, `yarn lint:check`,
  `yarn format:check`, `yarn build`, `yarn workspace @openvaa/frontend check`, `yarn test:e2e`
  **once**. Gate 5 is not optional. Gate 6 runs under CLAUDE.md's cardinal rule.
- **D-15** — The E2E gate follows the standard prereq: `yarn db:reset` + **one fresh dev server** on
  `:5173`, then the single suite run.

### Claude's Discretion

CONTEXT.md § open_questions: *"None. All 15 decisions are resolved at their ★ RECOMMENDED option; the
two re-measurement deltas are settled as D-09a and D-12a. Nothing is left for the planner to decide
about scope or mechanism."*

Discretion is therefore confined to **execution mechanics inside the locked decisions** — exact
injection file names, ledger row ordering, cache-busting technique, the precise vitest matrix
construction. This research prescribes each of those.

### Deferred Ideas (OUT OF SCOPE)

- **`svelte/motion`** (`tweened`, `spring`) — measured, recorded, todo filed (D-07).
- **Files outside `src/`** — `vite.config.ts`, `svelte.config.js`, `vitest.config.ts`,
  `prettier.config.mjs`, `eslint.config.mjs` itself. Recorded, todo filed (D-08).
- The **`tests/` tree** and any non-`apps/frontend/src` workspace.
- **Deleting** the dead `'**/_spikes-*/**'` ignore, or any other exclusion-list edit (D-11).
- Migrating the four prose mentions of `svelte/store` (D-09).
- A **standing grep spec** for SC-4 (D-10).
- A **fixture config** (`overrideConfigFile`) instead of in-place narrowing (D-02).
- **Widening the lint script** beyond `src/` (D-08).

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **ASSERT-08** | *"The `svelte/store` ESLint guard covers the whole `apps/frontend/src/**` tree; a `svelte/store` import in `lib/components`, `lib/utils`, dynamic-components or candidate components fails `yarn lint:check`, proven by injection."* [VERIFIED: `.planning/REQUIREMENTS.md:62`, quoted verbatim] | §§ 1–4: the OLD-half narrow/measure/restore mechanics are **validated end to end this session** (§ 3.1); the NEW half is validated through the real gate (§ 3.2); the four-site × two-extension matrix reach is measured 8/8 FIRES and 12/12 silent for `.js`/`.mjs`/`.cjs` (§ 2.1); the turbo-cache hazard that could silently falsify either half is identified with its exact busting flag (§ 3.3) |
| **ASSERT-09** | *"Any pre-existing `svelte/store` usage surfaced by widening the guard is triaged per site — migrated to runes, or explicitly allowed with a recorded reason."* [VERIFIED: `.planning/REQUIREMENTS.md:63`, quoted verbatim] | § 5: both greps re-run at the executing HEAD with exact commands, counts and per-file dispositions; § 5.2 corrects two CONTEXT.md counts (`_spikes` line number, exclusion-list size) that SC-3 requires the ledger to state accurately |

</phase_requirements>

---

## Summary

Three findings change how this phase must be planned, and one of them is plan-breaking.

**The plan-breaking one: `no-restricted-syntax` is already occupied.** `packages/shared-config/
eslint.config.mjs:79-85` sets `'no-restricted-syntax'` to ban `TSEnumDeclaration`. Because ESLint flat
config **replaces** a rule's option array rather than merging it — the exact trap the frontend config's
own header comment documents for `no-restricted-imports` at `:83-86` — adding D-06's
`ImportExpression` entry to the guard block *deletes the enum ban for every file in
`apps/frontend/src/**`*. Measured both directions this session: a `export enum Color { Red = 'red' }`
file under `src/lib/utils/` errors `no-restricted-syntax` under the current config and lints **clean**
under the naive D-06 patch. There are **zero enums in `apps/frontend/src` today**, so the deletion
produces zero immediate errors and would ship invisibly. The fix is one extra object in the array,
re-included verbatim; validated (§ 1.3). This is not a decision to reopen — D-06 stands exactly as
locked; it is a *completeness* requirement on how D-06's edit is written.

**The evidence-integrity one: `yarn lint:check` is Turborepo-cached.** `turbo.json`'s `lint` task
carries no `"cache": false` (unlike `test:unit`, which explicitly disables it), so a `yarn lint:check`
can print `cache hit, replaying logs` and exit 0 without ESLint running. Measured: at a clean tree
`@openvaa/frontend#lint` is a **cache HIT** at hash `06c4b14151cb0843`. The good news, also measured:
an *untracked* injected source file **does** change the hash (`06c4b14…` → `df59799…`), so the
first-time injections in D-02 genuinely execute. The residual hazard is a repeated identical
`(tree, config)` pair — precisely what a re-run to double-check a GREEN blind half looks like — which
would replay a cached exit 0 and be recorded as a measurement. `TURBO_FORCE=true` converts the HIT to
a MISS at the same hash (measured). Every ledger-bearing `yarn lint:check` in this phase should carry
it, and the ledger should record whether each row's run was `executing` or `replaying`.

**The reassuring one: the locked mechanism works, exactly as specified.** D-06's selector
`ImportExpression[source.value='svelte/store']` fires under **both** parsers — `typescript-eslint` on
`.ts` and `svelte-eslint-parser` inside a `.svelte` `<script lang="ts">` block. D-05's glob widening
produces **zero** new violations on a real, cache-missed `yarn lint:check` run (independently
re-measured, not inherited). The full narrow → measure → restore cycle was executed end to end this
session: injection GREEN (blind, exit 0) under the pre-115 scope, RED (exit 1, naming the file and
`no-restricted-imports`) under the current one, config restored byte-identical
(`git hash-object` → `f6cea0a65cdd8d7cd77d734a17929b35510fe796` before and after). And a
`describe.each` 4×2 matrix spec was written and run: 24/24 matrix assertions green, both dynamic-import
probes red pre-change — the correct pre-change state.

**Primary recommendation:** Write D-06's `no-restricted-syntax` array with **two** entries — the
inherited `TSEnumDeclaration` ban re-included verbatim, then the `ImportExpression` selector — run
`prettier --write` on the config immediately after editing, and prefix every ledger-bearing lint run
with `TURBO_FORCE=true`. Extend D-02's restore proof from `git diff --exit-code` alone to the Phase-141
three-assertion form (`git diff --exit-code` + `git status --porcelain` + `find`), because
`git diff` cannot see an untracked injection file left behind.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Banning the `svelte/store` module (static import form) | Build/lint tooling — `apps/frontend/eslint.config.mjs` `no-restricted-imports` | — | The ban is a source-level authoring constraint; ESLint is the only tier that sees import syntax before bundling |
| Banning the `svelte/store` module (dynamic `import()` form) | Build/lint tooling — same config block, `no-restricted-syntax` | — | `no-restricted-imports` inspects only `ImportDeclaration`; the dynamic form is an `ImportExpression` and needs a selector rule (measured, § 2.2) |
| Proving the ban actually reaches a given path | Test tier — `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (ESLint JS API under vitest) | — | The config states scope; only a run against a real resolved config proves it. Same tier as today, widened per D-04 |
| Proving the ban *did not* reach a path before the change (the blind half) | Evidence tier — `143-NEGATIVE-CONTROL-LEDGER.md`, produced by mutating the real config and running the real gate | Build/lint tooling (transiently mutated) | D-02 locks the real gate as the measurement instrument; the ledger is where the result lives |
| Enforcing the ban in CI | Build/lint tooling — root `yarn lint:check` → `turbo run lint` → `@openvaa/frontend#lint` → `eslint … src/` | Turborepo cache tier | Three hops, and the cache tier is where a false green can enter (§ 3.3) |
| Inherited cross-workspace rules (TS enum ban, deep-relative-`lib` ban) | Build/lint tooling — `packages/shared-config/eslint.config.mjs` | Frontend config, **by verbatim re-inclusion** | Flat config REPLACE semantics mean the frontend block *owns* these for its in-scope files once it names the rule (§ 1.2) |

---

## Standard Stack

### Core

No new packages. This phase changes one config file, one vitest spec, and planning documents.
Everything it needs is already installed.

| Library | Version (installed, measured) | Purpose | Why Standard |
|---------|------|---------|--------------|
| `eslint` | **9.39.2** | The gate itself; the JS API (`ESLint`, `lintText`) is the guard test's instrument | Already the repo's linter; `--flag v10_config_lookup_from_file` already in the lint script |
| `@typescript-eslint/parser` | **8.57.1** | Parses `.ts` in scope; supplies `ImportExpression` / `TSEnumDeclaration` nodes | Already `languageOptions.parser` at `eslint.config.mjs:51` |
| `svelte-eslint-parser` | **1.6.0** | Parses `.svelte` script blocks; the "different parser path" C1 worried about | Already `languageOptions.parser` for `**/*.svelte` at `eslint.config.mjs:65-75` |
| `svelte` | **5.53.12** | Subject of the ban | — |
| `eslint-plugin-svelte` | **3.13.1** | `plugin:svelte/prettier` extension | — |
| `vitest` | **3.2.4** | Runs the guard spec; supplies `describe.each` / `it.each` | Already the frontend's `test:unit` runner |
| `turborepo` | (repo `turbo.json` schema) | Orchestrates `lint` across workspaces — **and caches it** | Already the build system; the cache is the hazard in § 3.3 |

[VERIFIED: read from `node_modules/<pkg>/package.json` `"version"` fields this session]

### Supporting

None required.

### Alternatives Considered

None. CONTEXT.md § open_questions closes mechanism selection; this research prescribes execution
inside the locked choices rather than exploring alternatives.

**Installation:** none.

---

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** Every dependency it exercises is
already present in `yarn.lock` and already exercised by the existing lint and unit-test gates. No
registry lookup, no `[SLOP]`/`[SUS]` triage, and no `checkpoint:human-verify` install gate is owed.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

---

## Architecture Patterns

### System Architecture Diagram

```
                     ┌──────────────────────── EVIDENCE PATH (D-02, one-time) ───────────────────────┐
                     │                                                                               │
   injected .ts/.svelte/.js fixture                                                      143-NEGATIVE-CONTROL-LEDGER.md
   under one of 4 SC-1 dirs                                                              (rows written BEFORE injection)
              │                                                                                      ▲
              │                                                                                      │
              ▼                                                                                      │
   ┌──────────────────────┐   TURBO_FORCE=true    ┌──────────────────┐                                │
   │  yarn lint:check     │──────────────────────▶│  turbo run lint  │                                │
   │  (root package.json) │                       │  (turbo.json)    │                                │
   └──────────┬───────────┘                       └────────┬─────────┘                                │
              │  && (SHORT-CIRCUITS on failure)            │                                          │
              │                                            │ cache HIT? ──▶ replay logs, exit 0 ──── FALSE GREEN RISK
              ▼                                            │ cache MISS ──▶ execute                   │
   eslint … tests  &&  tsc -p tests/tsconfig.json          ▼                                          │
   (never run when turbo fails)              ┌───────────────────────────────┐                        │
                                             │ @openvaa/frontend#lint        │                        │
                                             │ eslint --flag                 │                        │
                                             │   v10_config_lookup_from_file │                        │
                                             │   src/                        │                        │
                                             └───────────────┬───────────────┘                        │
                                                             │ resolves                               │
                                                             ▼                                        │
                          ┌──────────────────────────────────────────────────────────┐                │
                          │ apps/frontend/eslint.config.mjs                          │                │
                          │  [0] ...sharedConfig  ← TSEnumDeclaration ban lives here  │                │
                          │  [1] plugin:svelte/prettier                               │                │
                          │  [2] ignores (16 entries)                                 │                │
                          │  [3] default languageOptions (tsParser)                    │                │
                          │  [4] **/*.svelte → svelte-eslint-parser                    │                │
                          │  [5] GUARD BLOCK  files: src/**/*.{ts,svelte}              │                │
                          │        no-restricted-imports  ← REPLACES [0]'s array       │                │
                          │        no-restricted-syntax   ← WILL REPLACE [0]'s array   │  ◀── § 1.2 TRAP
                          └──────────────────────────────────────────────────────────┘                │
                                                             ▲                                        │
                                                             │ same config, resolved the same way     │
                          ┌──────────────────────────────────┴───────────────────────┐                │
                          │ STANDING PATH (D-04)                                     │                │
                          │ vitest → eslint-store-guard.test.ts                      │                │
                          │   new ESLint({flags:['v10_config_lookup_from_file']})     │────────────────┘
                          │   .lintText(fixture, {filePath: <virtual path under src>})│
                          │   filter messages by ruleId                               │
                          └──────────────────────────────────────────────────────────┘
```

The two paths deliberately converge on the same config file resolved the same way. That convergence
is what makes the standing test a proxy for the real gate — and it is why
`v10_config_lookup_from_file` is mandatory rather than decorative.

### Recommended Project Structure

No new directories. The change surface, exhaustively:

```
apps/frontend/
├── eslint.config.mjs                       # D-05 (line 88 glob) + D-06 (new rule, same block)
└── src/lib/_guards/
    └── eslint-store-guard.test.ts          # D-04 rewrite + D-12a header corrections

.planning/
├── phases/143-…/143-NEGATIVE-CONTROL-LEDGER.md   # D-13, new
├── ROADMAP.md                                     # D-12 targets 1-3
├── REQUIREMENTS.md                                # D-12 target 5
└── todos/{pending → completed}/2026-06-04-…-app-wide.md   # D-12 target 4
```

Anything outside this list is a scope breach per CONTEXT.md § constraints.

### Pattern 1: Verbatim re-inclusion of an inherited rule array

**What:** When a flat-config block names a rule that an earlier block in the same array also names,
the later block's options **replace** the earlier ones entirely. Any inherited entry must be copied in
verbatim or it disappears for every file the later block matches.

**When to use:** Every time this phase touches `no-restricted-imports` or `no-restricted-syntax` in
`apps/frontend/eslint.config.mjs`.

**Already applied once, in-tree, with the reasoning stated:**

```js
// apps/frontend/eslint.config.mjs:83-86  [VERIFIED, quoted verbatim]
  // Flat config REPLACES (does not merge) the `no-restricted-imports` array for in-scope files,
  // so the inherited deep-relative-`lib` `patterns` ban (shared-config/eslint.config.mjs:147-152)
  // is re-included VERBATIM here. Omitting it would silently drop that ban for these
  // files, because the replacement is total rather than additive.
```

**Must be applied a second time, for `no-restricted-syntax`** — see § 1.2. This is the single highest-value
finding in this document.

### Pattern 2: Mutate → measure → restore → prove byte-identical (Phase 141 discipline)

**What:** To measure a blind half whose configuration no longer exists, mutate the real artefact,
run the real gate, restore, and prove the restore mechanically rather than by assertion.

**Phase 141's proof shape, which this phase should adopt in full rather than in part:**

```
git status --porcelain -- tests          → (empty)
git diff --exit-code -- tests/playwright.config.ts → exit 0   (D-15 read-only constraint held)
find tests -name 'zz-scratch*'           → (no matches)
```
[VERIFIED: `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-ASSERT10-LEDGER.md:515-520`, quoted verbatim]

The accompanying rationale, also verbatim from that ledger (`:521-522`):

> *"The `find` is deliberately broader than the `git status` check: `git status` would miss a scratch
> file that had somehow been staged, and `find` would miss nothing under `tests/`. Both are empty."*

**Why this matters here:** D-02 specifies only `git diff --exit-code` on the config file. That proves
the *config* was restored. It **cannot** prove an untracked injection file was removed —
`git diff` does not report untracked paths. See Pitfall 4.

### Pattern 3: Virtual `filePath` with `lintText` for both extensions

**What:** `ESLint#lintText(code, { filePath })` resolves config as if the text lived at `filePath`,
without writing anything. Extension selection (and therefore parser selection) follows `filePath`, so a
`.svelte` virtual path selects `svelte-eslint-parser`. Measured working (§ 4.1).

**When to use:** Every case in D-04's matrix. No file is written; nothing to clean up; no interaction
with prettier, `svelte-check`, or the barrel graph.

### Anti-Patterns to Avoid

- **Asserting on `errorCount` instead of filtering by `ruleId`.** The file's own header already
  forbids it (`:27-29`), and the reason is measured: a `svelte/store` fixture also trips
  `import/newline-after-import`; a double-quoted fixture also trips `quotes`. Both would inflate an
  `errorCount` assertion into a false green.
- **Adding a rule to the guard block without checking whether an ancestor config already sets it.**
  This is the § 1.2 trap. `npx eslint --print-config <file>` is the check; it takes one second.
- **Treating a `yarn lint:check` exit code as a measurement without confirming it executed.** A
  Turborepo `cache hit, replaying logs` line means ESLint did not run (§ 3.3).
- **Recording a NEW-half `yarn lint:check` exit 1 as though the whole chain ran.** The root script is
  `turbo run lint && eslint … tests && yarn typecheck:tests`; a turbo failure short-circuits the
  latter two. The ledger should say so rather than let a reader infer they passed.
- **Deriving the exclusion-list count from the line range.** `:23-40` is 18 *lines* but **16
  *entries*** — two of those lines are comments. SC-3 asks for the list's size to be *stated*; stating
  18 would state it wrongly (§ 5.2).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Banning a dynamic `import()` of a module | A custom ESLint rule, or a regex/grep gate | `no-restricted-syntax` with an `esquery` selector | D-06 locks this, and it is measured working under both parsers (§ 2.1). C3's rejected option — a bespoke rule covering static + dynamic + `require()` — is a maintenance liability for a ban two built-in rules already express |
| Banning `require('svelte/store')` | A third rule | `@typescript-eslint/no-require-imports`, already active and already `error` | Measured: the CommonJS form trips it (§ 2.3). Nothing further is owed |
| Reconstructing the pre-115 config | A hand-written fixture config driven by `overrideConfigFile` | In-place narrow → restore (D-02) | Explicitly decided; the fixture route measures a *reconstruction*, not the config that existed |
| Proving the guard test loads the right config | Manual config-object assembly inside the spec | `new ESLint({ flags: ['v10_config_lookup_from_file'] })` + a `filePath` under `src/` | The flag makes the spec load the same file the gate loads; hand-assembly reintroduces exactly the drift the flag removes |
| Enumerating the eight matrix cases | Eight copy-pasted `it` blocks | `describe.each` over a `flatMap`ped dir × ext product | Validated running this session (§ 4.1); one place to add a fifth directory |
| Formatting the edited config | Hand-matching prettier's output | `npx prettier --write apps/frontend/eslint.config.mjs` after the edit | Measured: a hand-written, plausibly-formatted patch **fails** `prettier --check` (§ 1.4). Gate 3 would catch it late |
| Busting the turbo lint cache | Deleting `.turbo/`, or touching files | `TURBO_FORCE=true` | Measured to flip HIT→MISS at an unchanged hash (§ 3.3) |

**Key insight:** every mechanism this phase needs already exists in the tree and is already wired into
the gate. The phase's difficulty is not construction — it is *not silently removing something else*
while adding one rule, and *not recording a cached result as a measurement*.

---

## Runtime State Inventory

This is not a rename phase, but D-02 deliberately mutates a live config and injects real files into a
tree that a cached build system observes. The "what still holds the old value after the edit?" question
therefore applies, and each category is answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Build-system cache** | **Turborepo caches the `lint` task.** `turbo.json:13-17` declares `"lint": { "dependsOn": ["^lint"], "outputs": [], "inputs": ["$TURBO_DEFAULT$", "eslint.config.*"] }` with **no `"cache": false`** — unlike `test:unit` at `:9-12`, which has it. Measured: `@openvaa/frontend#lint` is a **cache HIT** at hash `06c4b14151cb0843` on the clean tree | Prefix every ledger-bearing run with `TURBO_FORCE=true`; record `executing` vs `replaying` per row |
| **ESLint's own cache** | **None.** `apps/frontend/package.json:10` is `"lint": "eslint --flag v10_config_lookup_from_file src/"` — no `--cache` flag. `find . -maxdepth 3 -name '.eslintcache' -not -path '*/node_modules/*'` → empty | None |
| **Untracked injection files** | The D-02 injections are untracked source files under `apps/frontend/src/**`. Measured: they **do** change the turbo input hash (`06c4b14…` → `df59799…`), so they are not invisible to the cache — but they **are** invisible to `git diff --exit-code` | Restore proof must add `git status --porcelain -- apps/frontend` and a `find` for the probe-name pattern |
| **Barrels / module graph** | **None.** No `index.ts` exists in any of `src/lib/components`, `src/lib/utils`, `src/lib/dynamic-components`, `src/lib/candidate/components` — measured by direct `ls`. An injected file cannot be pulled into the build or type graph by re-export | None |
| **Generated output under `src/`** | 12 paraglide-generated `.js` files under `apps/frontend/src/lib/paraglide/` (measured by `find`), **all untracked** (`git ls-files 'apps/frontend/src/**/*.js'` → 0). Globally ignored at `packages/shared-config/eslint.config.mjs:35` (`'**/src/lib/paraglide/**'`, inside a config object whose only key is `ignores` — a *global* ignore, not a scoped one) | None — this is why D-05's fallout is zero |
| **Secrets / env vars** | None — this phase touches no runtime code path | None |
| **OS-registered state / live services** | None | None |

---

## Common Pitfalls

### Pitfall 1 ⚠ PLAN-BREAKING: Adding `no-restricted-syntax` silently deletes the inherited TS-enum ban

**What goes wrong:** `packages/shared-config/eslint.config.mjs:79-85` already sets the rule:

```js
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        }
      ],
```
[VERIFIED: `packages/shared-config/eslint.config.mjs:79-85`, opened with `Read` this session, quoted verbatim]

D-06 adds a `no-restricted-syntax` entry to the frontend guard block. Flat config replaces the option
array wholesale, so after the naive edit `apps/frontend/src/**` is governed **only** by the
`ImportExpression` selector. The enum ban vanishes across the whole frontend source tree.

**Why it happens:** The frontend config's header comment warns about this trap for
`no-restricted-imports` specifically (`:83-86`), which makes it read like a one-rule caveat. It is a
property of flat config, not of that rule. Nothing in the tree flags the second occurrence.

**Measured, both directions, this session** — fixture
`apps/frontend/src/lib/utils/__gsd_probe_enum__.ts` containing
`export enum Color { Red = 'red', Blue = 'blue' }`:

| Config state | `npx eslint --flag v10_config_lookup_from_file <fixture>` |
|---|---|
| Current tree (no `no-restricted-syntax` in the guard block) | `1:8  error  Use const assertion or a string union type instead  no-restricted-syntax` — **1 problem (1 error)** |
| Naive D-06 patch (guard block sets `no-restricted-syntax` to the `ImportExpression` entry only) | **no output — clean** |

**How to avoid:** write the array with **two** entries, inherited one first:

```js
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        },
        {
          selector: "ImportExpression[source.value='svelte/store']",
          message: 'svelte/store is banned. Use $state/$derived rune handles exposing `current` instead.'
        }
      ]
```

Measured with this corrected form: the enum fixture errors *and* the dynamic-import fixture errors —
`2 problems (2 errors, 0 warnings)`, one `no-restricted-syntax` message each.

**Warning signs:** none naturally occur. `git grep -nE "(export |^\s*)enum [A-Za-z]" -- 'apps/frontend/src'`
returns **nothing** — there are zero enums in the frontend today, so removing the ban produces zero
errors and the loss is undetectable by any gate. That is precisely why it must be caught at authoring
time.

**Recommended plan artefact:** a task-level verification step running
`cd apps/frontend && npx eslint --flag v10_config_lookup_from_file --print-config src/lib/utils/<any-real-file>.ts`
and asserting the printed `no-restricted-syntax` array contains **both** selectors. Also worth a
standing matrix case in the guard spec (an enum fixture asserting `no-restricted-syntax` fires) so the
ban cannot be dropped by a future edit either — this is inside D-04's remit (the spec already owns
"prove the guard block's rules reach `src/**`") and adds no new capability.

### Pitfall 2 ⚠ EVIDENCE-INTEGRITY: A Turborepo cache hit can be recorded as a measurement

**What goes wrong:** `yarn lint:check` → `turbo run lint`. Turbo prints `cache hit, replaying logs
<hash>` and exits 0 without invoking ESLint. A ledger row reading "exit 0 → GREEN (blind)" would be
indistinguishable from a real blind run.

**Why it happens:** `turbo.json`'s `lint` task has no `"cache": false`. The repo's authors *did*
disable caching for `test:unit` (`turbo.json:9-12`), which makes the omission look deliberate rather
than accidental — and it is fine for ordinary development. It is not fine for evidence.

**Measured, this session:**

| Condition | `@openvaa/frontend#lint` hash | cache status |
|---|---|---|
| Clean tree | `06c4b14151cb0843` | **HIT** |
| Clean tree + untracked `src/lib/utils/__gsd_probe_inject__.ts` | `df5979992d6c1a7c` | **MISS** (real run — produced the `no-restricted-imports` error) |
| Clean tree, `TURBO_FORCE=true` | `06c4b14151cb0843` (unchanged) | **MISS** |
| Guard glob widened to `{ts,js,mjs,cjs,svelte}` | `4964ea6aa0485a03` | **MISS** |
| Widened glob + `no-restricted-syntax` added | `6db0e75948ae8c9c` | **MISS** |

**How to avoid:**
1. Prefix every ledger-bearing lint run: `TURBO_FORCE=true yarn lint:check`. Do **not** try
   `yarn lint:check --force` — yarn appends the argument to the end of the whole `&&` chain, so it
   lands on `yarn typecheck:tests`, not on turbo.
2. Record the turbo verdict line (`cache miss, executing <hash>` / `cache hit, replaying logs <hash>`)
   in every ledger row alongside the exit code. A row that cannot show `executing` is not a
   measurement.
3. Note that turbo does **not** cache failed tasks — RED halves always execute. The exposure is
   one-directional: it is the **GREEN blind halves** that can be faked, which is exactly the half
   D-02 exists to produce.

**Warning signs:** a suspiciously fast `Time: 0.1s` on a run that should have taken ~6 s; a
`Cached: N cached, N total` summary line covering the frontend task.

### Pitfall 3: `yarn lint:check` short-circuits, so a RED row's later steps never ran

**What goes wrong:** The root script is
`"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests"`.
When `turbo run lint` exits 1 (every NEW half), the `tests` lint and the `tests` typecheck **do not
run**. A ledger recording only "`yarn lint:check` → exit 1" invites a reader to assume the rest of the
chain passed.

**How to avoid:** state per RED row that steps 2 and 3 of the chain did not execute, and let the
Gate-2 clean run (with no injection present) be the row that covers them. Measured this session: a
clean `yarn lint:check` runs all 11 turbo tasks and both trailing steps to exit 0.

### Pitfall 4: `git diff --exit-code` cannot prove the injections were removed

**What goes wrong:** D-02 step 4 specifies `git diff --exit-code` on the config file as the restore
proof. That is a correct and sufficient proof **for the config**. It is silent about untracked files —
and every injection in this phase is an untracked new file.

**How to avoid:** adopt Phase 141's three-assertion form (§ Pattern 2). Concretely for this phase:

```bash
git diff --exit-code -- apps/frontend/eslint.config.mjs     # config restored
git status --porcelain -- apps/frontend                     # (empty) — no injection survived
find apps/frontend/src -name '__store_guard_inject__*'       # (no matches) — broader than git status
git hash-object apps/frontend/eslint.config.mjs             # == f6cea0a65cdd8d7cd77d734a17929b35510fe796
```

The `git hash-object` line is worth recording explicitly: the pre-change blob hash of
`apps/frontend/eslint.config.mjs` at HEAD `0e014d6a9` is
**`f6cea0a65cdd8d7cd77d734a17929b35510fe796`** [VERIFIED: measured this session, before and after two
mutate/restore cycles — identical both times]. A ledger that names the expected hash makes the restore
falsifiable by a reader who was not present.

### Pitfall 5: An injection fixture that trips unrelated rules muddies the row

**What goes wrong:** The measured collateral rules, per fixture shape:

| Fixture shape | Collateral rules that also fire |
|---|---|
| `import {…} from 'svelte/store';` with **no** blank line after | `import/newline-after-import` |
| `import(\"svelte/store\")` (double quotes) | `quotes` (shared-config enforces `'single'`, `allowTemplateLiterals: false`) |
| `const s = require('svelte/store')` | `@typescript-eslint/no-require-imports` **and** `import/newline-after-import` |
| Arrow-function export | `func-style` — shared-config sets `['error', 'declaration', { allowArrowFunctions: false }]` |

**How to avoid:** use these exact injection bodies, each measured clean of collateral in a real gate
run (§ Code Examples). Single quotes, a blank line after the import, an exported `const` value (not an
arrow function), a `function` declaration for the dynamic form.

**Also:** the exported binding must be *exported*, or `unused-imports/no-unused-vars` fires (the rule
is configured with `varsIgnorePattern: '^_'`). Measured: `export const probe = writable(0);` produced
exactly one message — the `no-restricted-imports` error — and nothing else.

### Pitfall 6: The config edit will fail `prettier --check`

**What goes wrong:** Gate 3 is `yarn format:check` → `prettier --check .`, which covers
`apps/frontend/eslint.config.mjs`. A hand-written, plausibly-formatted D-06 patch **failed** it in this
session (`[warn] apps/frontend/eslint.config.mjs`, exit 1) because prettier's `printWidth` keeps the
`message:` value on one line where a hand-edit wrapped it.

**How to avoid:** run `npx prettier --write apps/frontend/eslint.config.mjs` immediately after the
edit, in the same task. § Code Examples gives the prettier-canonical output so the plan can specify the
target text exactly.

### Pitfall 7: `describe.each` title interpolation quotes string values

**What goes wrong:** `describe.each(cases)('guard reach: src/$dir/__probe__$ext', …)` with an array of
objects renders titles as ``guard reach: src/'lib/utils'/__probe__'.ts'`` — quotes included. Cosmetic,
but it makes the ledger's test-name citations ugly and hard to grep.

**How to avoid:** build the title with a template literal from the destructured values inside a plain
`describe.each(cases)(...)` callback, or use `%s` positional formatting over an array-of-arrays. § Code
Examples uses the array-of-arrays form.

---

## Code Examples

Every block below was executed in this session and its outcome measured. Line numbers cited in
comments are pre-change and **will move**; locate by content.

### 1. The D-05 + D-06 config edit, prettier-canonical

Current line 88 [VERIFIED: `apps/frontend/eslint.config.mjs:88`, opened with `Read`, quoted verbatim]:

```js
    files: ['src/**/*.{ts,svelte}'],
```

becomes:

```js
    files: ['src/**/*.{ts,js,mjs,cjs,svelte}'],
```

and the rules object gains a second rule. This is the **exact prettier-canonical text** — produced by
applying the edit and running `npx prettier --write`, then confirming `prettier --check` reports *"All
matched files use Prettier code style!"*:

```js
      ],
      // Paired with the `no-restricted-imports` `paths` entry above: together they form
      // ONE ban on `svelte/store`. `no-restricted-imports` sees only static
      // `ImportDeclaration` nodes, so the dynamic `import('svelte/store')` form is closed
      // here. Edit both or neither.
      // Flat config REPLACES this array too: the inherited `TSEnumDeclaration` ban
      // (shared-config/eslint.config.mjs:79-85) is re-included VERBATIM below.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        },
        {
          selector: "ImportExpression[source.value='svelte/store']",
          message: 'svelte/store is banned. Use $state/$derived rune handles exposing `current` instead.'
        }
      ]
    }
  }
];
```

Note the trailing comma added to the preceding `]` (closing `no-restricted-imports`). The comment
block discharges D-06's "tie them together with a comment at the config site" mitigation **and**
documents the Pitfall-1 trap for the next reader.

### 2. Injection fixtures (D-02 / D-05 / D-06), measured collateral-free

```ts
// apps/frontend/src/lib/{components,utils,dynamic-components,candidate/components}/__store_guard_inject__.ts
import { writable } from 'svelte/store';

export const probe = writable(0);
```

```svelte
<!-- …/__store_guard_inject__.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';

  const probe = writable(0);
</script>

<p>{$probe}</p>
```

```js
// …/__store_guard_inject__.js   — the D-05 gap probe
import { writable } from 'svelte/store';

export const probe = writable(0);
```

```ts
// …/__store_guard_inject_dyn__.ts   — the D-06 gap probe
export async function load() {
  const m = await import('svelte/store');
  return m;
}
```

### 3. The OLD half (D-02), executed end to end this session

```bash
# 0. record the restoration target
git hash-object apps/frontend/eslint.config.mjs        # f6cea0a65cdd8d7cd77d734a17929b35510fe796

# 1. narrow to the pre-115 scope (line 88)
#    files: ['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}'],

# 2. run the REAL gate with the injection present
TURBO_FORCE=true yarn lint:check                       # → exit 0, "Tasks: 11 successful, 11 total"

# 3. restore + prove
git diff --exit-code -- apps/frontend/eslint.config.mjs   # exit 0
git status --porcelain -- apps/frontend                   # (empty)
git hash-object apps/frontend/eslint.config.mjs           # f6cea0a65cdd8d7cd77d734a17929b35510fe796
```

**Measured result:** with the config narrowed and
`apps/frontend/src/lib/utils/__gsd_probe_inject__.ts` present, `yarn lint:check` exited **0** —
`Tasks: 11 successful, 11 total`. The guard was **blind**. Restore proved byte-identical.

### 4. The NEW half, measured through the real gate

Same injection, current (widened) config:

```
@openvaa/frontend:lint: cache miss, executing df5979992d6c1a7c
@openvaa/frontend:lint: /Users/…/apps/frontend/src/lib/utils/__gsd_probe_inject__.ts
@openvaa/frontend:lint:   1:1  error  'svelte/store' import is restricted from being used. svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead  no-restricted-imports
@openvaa/frontend:lint: ✖ 2 problems (1 error, 1 warning)
 Tasks:    10 successful, 11 total
Failed:    @openvaa/frontend#lint
```

Exit **1**, naming **the file** and **the rule** — ASSERT-08's wording satisfied literally. Note the
`1 warning`: that is the **pre-existing** `unused-imports/no-unused-vars` warning at
`apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:39` [VERIFIED: measured this
session]. The frontend lint is error-free but not warning-free; ledger rows should count **errors**,
not problems.

### 5. All three closures proven together, real gate, patched config

With the widened glob + the corrected two-entry `no-restricted-syntax`, and three injections present:

```
…/src/lib/components/__gsd_probe_dyn__.ts
  2:19  error  svelte/store is banned. Use $state/$derived rune handles exposing `current` instead  no-restricted-syntax
…/src/lib/dynamic-components/__gsd_probe_dyn__.svelte
  2:13  error  svelte/store is banned. Use $state/$derived rune handles exposing `current` instead  no-restricted-syntax
…/src/lib/utils/__gsd_probe_js__.js
  1:1  error  'svelte/store' import is restricted from being used. …  no-restricted-imports
✖ 4 problems (3 errors, 1 warning)
```

Exit **1**. `.js` static → `no-restricted-imports`. `.ts` dynamic → `no-restricted-syntax`. `.svelte`
dynamic → `no-restricted-syntax`. Both gaps closed, both closures proven through the real gate.

### 6. The D-04 matrix spec — validated shape

Run this session as `apps/frontend/src/lib/_guards/__gsd_tmp_matrix.test.ts` (since removed):
**24 matrix assertions passed** (4 dirs × 2 exts × 3 assertions), and the two dynamic-import probes
**failed** — the correct pre-change state, which is itself the ordering evidence D-03 wants.

```ts
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// MANDATORY: loads the real apps/frontend/eslint.config.mjs, matching
// apps/frontend/package.json:10 exactly. Omitting the flag risks config-resolution drift.
const eslint = new ESLint({ flags: ['v10_config_lookup_from_file'] });

// MANDATORY: every probePath must resolve under apps/frontend/src/** or the guard
// block's `files` scope does not apply and the test gives a false PASS.
const SRC = path.resolve(__dirname, '../..'); // → apps/frontend/src

const GUARDED_DIRS = [
  'lib/components',
  'lib/utils',
  'lib/dynamic-components',
  'lib/candidate/components'
] as const;

const STORE_IMPORT = {
  '.ts': "import { writable } from 'svelte/store';\n\nexport const x = writable(0);\n",
  '.svelte':
    '<script lang="ts">\n  import { writable } from \'svelte/store\';\n\n  const x = writable(0);\n</script>\n\n<p>{$x}</p>\n'
} as const;

const CLEAN_RUNE = {
  '.ts': 'export const x = $state(0);\n',
  '.svelte': '<script lang="ts">\n  let x = $state(0);\n</script>\n\n<p>{x}</p>\n'
} as const;

// Array-of-arrays + %s avoids describe.each's quoted-object title rendering (Pitfall 7).
const cases = GUARDED_DIRS.flatMap((dir) =>
  (Object.keys(STORE_IMPORT) as Array<keyof typeof STORE_IMPORT>).map((ext) => [dir, ext] as const)
);

describe.each(cases)('guard reach: src/%s/__store_guard_probe__%s', (dir, ext) => {
  const probePath = path.join(SRC, dir, `__store_guard_probe__${ext}`);

  it('fires no-restricted-imports on a static svelte/store import', async () => {
    const [result] = await eslint.lintText(STORE_IMPORT[ext], { filePath: probePath });
    // MANDATORY: filter by ruleId, never a bare errorCount — the fixture also trips
    // import/newline-after-import.
    expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBeGreaterThan(0);
  });

  it('stays silent on clean rune code (negative control)', async () => {
    const [result] = await eslint.lintText(CLEAN_RUNE[ext], { filePath: probePath });
    expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBe(0);
  });

  // Guards the negative control itself: a parse failure yields a fatal message and
  // could otherwise read as "silent".
  it('parses without a fatal message', async () => {
    const [result] = await eslint.lintText(STORE_IMPORT[ext], { filePath: probePath });
    expect(result.messages.filter((m) => m.fatal)).toEqual([]);
  });
});
```

Plus the D-06 probes (red before the config change, green after — both measured):

```ts
describe('dynamic import() closure (D-06)', () => {
  it('fires no-restricted-syntax on await import(svelte/store) in .ts', async () => {
    const [result] = await eslint.lintText(
      "export async function f() {\n  return await import('svelte/store');\n}\n",
      { filePath: path.join(SRC, 'lib/utils', '__store_guard_probe__.ts') }
    );
    expect(result.messages.filter((m) => m.ruleId === 'no-restricted-syntax').length).toBeGreaterThan(0);
  });

  it('fires no-restricted-syntax on import(svelte/store) in a .svelte script block', async () => {
    const [result] = await eslint.lintText(
      '<script lang="ts">\n  const p = import(\'svelte/store\');\n</script>\n\n<p>{p}</p>\n',
      { filePath: path.join(SRC, 'lib/components', '__store_guard_probe__.svelte') }
    );
    expect(result.messages.filter((m) => m.ruleId === 'no-restricted-syntax').length).toBeGreaterThan(0);
  });
});
```

And the Pitfall-1 regression case, which nothing else in the tree covers:

```ts
it('still enforces the inherited TSEnumDeclaration ban (flat-config REPLACE regression)', async () => {
  const [result] = await eslint.lintText("export enum Color {\n  Red = 'red'\n}\n", {
    filePath: path.join(SRC, 'lib/utils', '__store_guard_probe__.ts')
  });
  const enumBan = result.messages.filter(
    (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('const assertion')
  );
  expect(enumBan.length).toBeGreaterThan(0);
});
```

---

## Detailed Findings

### § 1 — The config edit

#### 1.1 The glob widening (D-05) — fallout independently re-measured as zero

Applied `files: ['src/**/*.{ts,js,mjs,cjs,svelte}']` to the real config and ran the real gate:

```
@openvaa/frontend:lint: cache miss, executing 4964ea6aa0485a03
@openvaa/frontend:lint:   …/candidateContext.svelte.test.ts  39:9  warning  'question' is assigned…
@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)
 Tasks:    11 successful, 11 total
```

**Exit 0. Zero new violations. Zero new `no-restricted-imports` `patterns` hits.** The prediction in
CONTEXT.md B-3/§ "Gap 10's blast radius" is **confirmed by independent re-measurement**, not inherited.

Why it is structurally zero:

- `git ls-files 'apps/frontend/src/**/*.js' 'apps/frontend/src/**/*.mjs' 'apps/frontend/src/**/*.cjs'`
  → **0 tracked files**.
- `find apps/frontend/src -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \)` → **12 files,
  all under `src/lib/paraglide/`**.
- Those 12 are excluded by `'**/src/lib/paraglide/**'` at `packages/shared-config/eslint.config.mjs:35`
  — inside a config object whose only key is `ignores`, i.e. a **global** ignore, applied before any
  `files` matching. [VERIFIED: `packages/shared-config/eslint.config.mjs:20-38`, opened with `Read`]

**`.svelte-kit/` is not a risk:** it sits at `apps/frontend/.svelte-kit`, outside `src/`, and the lint
script's only argument is `src/`. It is additionally listed in the frontend `ignores` at
`eslint.config.mjs:28` (`'.svelte-kit'`). **`eslint.config.mjs` itself is not a risk** for the same
reason — it is outside `src/` (this is D-08's recorded gap, unchanged by the widening).

**Deep-relative-`lib` `patterns` ban on newly-in-scope files:** measured — zero hits, because there are
zero in-scope `.js`/`.mjs`/`.cjs` files to hit.

#### 1.2 ⚠ The `no-restricted-syntax` REPLACE trap — see Pitfall 1

The single finding most likely to cost this phase a re-plan or a silent regression. Measured both
directions; the corrected form is in § Code Examples 1.

`npx eslint --print-config <file>` is the cheap audit. Before the change it prints no
`no-restricted-syntax` key for a frontend `src` file… **because the guard block does not set it and
therefore does not shadow the inherited entry**. After the naive change it prints only the
`ImportExpression` selector. After the corrected change it prints both.

#### 1.3 Rule-splitting mitigation (D-06)

Two rules now carry one ban. The comment block in § Code Examples 1 ties them together *and* names the
REPLACE trap, discharging D-06's stated mitigation with one artefact.

#### 1.4 Prettier

`prettier --check apps/frontend/eslint.config.mjs` **failed** on a hand-formatted patch and **passed**
after `prettier --write`. The canonical text is captured in § Code Examples 1. Run `prettier --write`
in the same task as the edit; do not leave it to Gate 3.

### § 2 — Selector correctness (research priority 1)

#### 2.1 Both parsers, measured

`ImportExpression[source.value='svelte/store']` (added via ESLint-API `overrideConfig`, which merges
additively for a rule the target block does not set — so this probes the selector without touching the
real config):

| Fixture | Virtual path | `no-restricted-syntax` hits |
|---|---|---|
| `await import('svelte/store')` | `src/lib/components/__probe__.ts` (typescript-eslint) | **1 — FIRES** |
| `import('svelte/store').then(…)` | `.ts` | **1 — FIRES** |
| `import("svelte/store")` (double quotes) | `.ts` | **1 — FIRES** (also trips `quotes`) |
| `import('svelte/store', { with: {} })` | `.ts` | **1 — FIRES** |
| `await import('svelte/store')` in `<script lang="ts">` | `src/lib/components/__probe__.svelte` (**svelte-eslint-parser**) | **1 — FIRES** |

Two alternative selectors were probed and behave **identically** on all fixtures:
`ImportExpression[source.type='Literal'][source.value='svelte/store']` and
`ImportExpression > Literal[value='svelte/store']`. **Recommendation: use D-06's locked selector as
written** — it is the shortest, it is what the decision says, and the alternatives buy nothing.

#### 2.2 Measured escapes — state the limitation, do not over-claim

| Escape form | Result | Materiality |
|---|---|---|
| ``import(`svelte/store`)`` (template literal) | **silent** — `source` is a `TemplateLiteral` and has no `.value` | Real but low: shared-config sets `quotes: ['error','single',{ allowTemplateLiterals: false }]`, so a bare template literal here is itself a lint **error** [VERIFIED: `packages/shared-config/eslint.config.mjs:70-77`, opened with `Read`]. Measured: the fixture tripped `quotes`. The escape is therefore **not silently reachable** |
| `const n = 'svelte/store'; import(n)` (variable specifier) | **silent** | Real. No static-analysis rule can close this; a custom rule could not either without dataflow. **Record as residue** |
| `import('svelte/store/index.js')` (subpath) | **silent** under both rules | **Theoretical only** — measured `require.resolve('svelte/store/index.js')` → `ERR_PACKAGE_PATH_NOT_EXPORTED`. Svelte's `exports` map has no subpath under `./store` [VERIFIED: `node_modules/svelte/package.json` `exports` keys enumerated this session: `.`, `./package.json`, `./action`, `./animate`, `./attachments`, `./compiler`, `./easing`, `./elements`, `./internal`, `./internal/client`, `./internal/disclose-version`, `./internal/flags/async`, `./internal/flags/legacy`, `./internal/flags/tracing`, `./internal/server`, `./legacy`, `./motion`, `./reactivity`, `./reactivity/window`, `./server`, `./store`, `./transition`, `./events`]. Any such import fails at build/runtime |
| `vi.importActual('svelte/store')` | **silent** | Vitest-only, test-tree-only. Record as residue |

**Recommended ledger wording:** *"The ban covers the static `import`/`export … from` form and the
dynamic `import()` form with a string-literal specifier. It does not cover a computed specifier
(`import(n)`), which no static rule can close, nor `vi.importActual`. A template-literal specifier is
uncovered by the selector but independently rejected by `quotes`. Subpath specifiers are uncovered but
unresolvable under svelte's `exports` map."* This is honest and falsifiable; a blanket "the ban covers
both import forms" is neither.

#### 2.3 `require('svelte/store')` needs no new rule

Measured: neither ban fires, but `@typescript-eslint/no-require-imports` does (already `error`,
inherited). CommonJS reintroduction is already closed by a different rule. Record it; add nothing.

### § 3 — Narrow → measure → restore mechanics (research priority 2)

#### 3.1 The minimal, safest edit to `eslint.config.mjs:88`

One line. Current text [VERIFIED: `apps/frontend/eslint.config.mjs:88`, quoted verbatim]:

```js
    files: ['src/**/*.{ts,svelte}'],
```

D-02's narrowed text [VERIFIED: `143-CONTEXT.md` D-02 step 1, quoted verbatim]:

```js
    files: ['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}'],
```

Executed this session; produced the blind GREEN; restored byte-identical. Two properties make this the
safest possible mutation: it changes **exactly one line**, and its restoration target is a **known blob
hash** (`f6cea0a65cdd8d7cd77d734a17929b35510fe796`) that the ledger can name in advance.

**Recommended executor technique:** `cp` the file to a scratch path outside the repo before mutating,
mutate with a targeted replacement, and restore by `cp` back — not by hand-editing a second time.
Hand-restoring risks a whitespace delta that turns the restore proof red for a reason unrelated to the
evidence. (This is what was done this session; the byte-identity held across two full cycles.)

#### 3.2 Is `git diff --exit-code` a sufficient restore proof?

**For the config file: yes.** Confirmed working — exit 0 on an identical restore, and it is the proof
D-02 names. **For the phase: no**, because it is blind to untracked injection files. See Pitfall 4 for
the three-assertion form to use instead. This is an *addition* to D-02's proof, not a substitution —
D-02's `git diff --exit-code` stays.

#### 3.3 Caching (the answer to "would `yarn lint:check` report a stale verdict?")

**Yes — Turborepo, not ESLint.** Full measurement table in Pitfall 2. The busting flag is
`TURBO_FORCE=true` (measured: HIT → MISS at an unchanged hash). ESLint's own cache is not in play (no
`--cache` flag; no `.eslintcache` on disk). Prettier (Gate 3) is uncached.

**A second, subtler cache interaction the plan should know:** because `turbo.json`'s `lint` inputs
include `"eslint.config.*"` **and** `$TURBO_DEFAULT$`, the narrow and the restore produce *different*
hashes, and the restore's hash is the **pre-narrow** hash — which is already in the cache. So the first
post-restore `yarn lint:check` will be a **cache HIT**. That is harmless (the config is byte-identical,
so the cached result is genuinely correct) but it must not be recorded as a fresh clean-tree
measurement without `TURBO_FORCE=true`.

### § 4 — Table-driven ESLint-API testing (research priority 5)

#### 4.1 Validated shape

Written, run, and removed this session. **24/24 matrix assertions passed**; the two dynamic-import
probes failed pre-change (correct); the existing 2-case spec continued to pass alongside — total
`Tests 2 failed | 26 passed (28)`, runtime **1.73 s** for the whole `_guards` directory.

**How the virtual `.svelte` `filePath` must be constructed** — the question research priority 5 asks:

- The path must end in `.svelte`, and it must resolve **under `apps/frontend/src/`**. Both conditions
  come from the config: `files: ['**/*.svelte']` at `eslint.config.mjs:65` selects
  `svelte-eslint-parser`; the guard block's `files: ['src/**/*.{ts,svelte}']` selects the ban.
- `path.join(path.resolve(__dirname, '../..'), dir, '__store_guard_probe__.svelte')` from
  `src/lib/_guards/` resolves to `apps/frontend/src/<dir>/__store_guard_probe__.svelte`. Measured to
  select the Svelte parser and fire the guard.
- The fixture must carry `<script lang="ts">` (the config's `settings['svelte/typescript'] = true` at
  `eslint.config.mjs:60-62` and `parserOptions.parser: '@typescript-eslint/parser'` at `:73` assume it)
  and should include a template body referencing the binding, so no unused-variable rule fires.
- **No file is written.** `lintText` is text-only; nothing to clean up, no barrel exposure, no prettier
  or `svelte-check` interaction.

#### 4.2 All three D-04 invariants preserved

| Invariant (`eslint-store-guard.test.ts:20-29`) | How the matrix preserves it |
|---|---|
| *"`probePath` MUST resolve under `apps/frontend/src/**`"* | One `SRC` constant derived from `__dirname`; every `probePath` is `path.join(SRC, dir, name)`. Nothing constructs a path by string concatenation |
| *"`new ESLint({ flags: ['v10_config_lookup_from_file'] })` is MANDATORY"* | One module-level `eslint` instance shared by every case — one place to get it right, and cheap (measured: 28 tests in 1.73 s) |
| *"Filter messages by `ruleId === 'no-restricted-imports'` (NOT a bare `errorCount`)"* | Every assertion filters. The D-06 probes filter on `'no-restricted-syntax'`; the Pitfall-1 probe additionally narrows by message content, because both bans now share one `ruleId` |

The third row hides a real subtlety introduced by D-06: **`no-restricted-syntax` will carry two
distinct bans**, so `ruleId` alone no longer identifies *which* ban fired. The dynamic-import probe and
the enum probe must disambiguate by `message` (or by `m.line`/`m.column` against the fixture). Filtering
on `ruleId` alone would let the enum ban satisfy the dynamic-import assertion — a new instance of
exactly the class of false-green the file's header exists to prevent.

#### 4.3 D-12a header corrections, with exact current text

[VERIFIED: `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts`, opened with `Read`, quoted verbatim]

- `:8` — `` * Traceability:.3 (met-via-Phase-115). `` — the dangling `.3`.
- `:12` — `` * earlier (see phase 115, and `apps/frontend/eslint.config.mjs` lines 77-84). This `` —
  the stale line citation. The block is **`:87-110`** today and moves under D-05/D-06.
- `:11` also contains a related staleness worth correcting in the same edit:
  `` * `src/**\/*.{ts,svelte}` and clearing every `svelte/store` import — already landed `` — the glob
  named here becomes wrong the moment D-05 lands.
- `:39` — `describe('svelte/store ESLint guard (RUNES-03 lock-in)', …)` — cites **RUNES-03**, a v2.11
  requirement ID, while `:8` was supposed to cite ASSERT-08. The rewrite should make the two agree.

**Recommendation for `:12`:** drop the line citation in favour of a stable anchor — e.g. *"the guard
block in `apps/frontend/eslint.config.mjs`, the one whose `files` glob is `src/**/*.{ts,js,mjs,cjs,svelte}`"*
— so the citation cannot go stale again. D-12a explicitly permits this ("or drop the line citation in
favour of a stable anchor").

### § 5 — ASSERT-09 discharge inputs (D-09 / D-09a)

#### 5.1 Both greps, re-run at HEAD `0e014d6a982a37d77e56df89afe5796d24ef1b57`

**Strict grep** — `git grep -n "from 'svelte/store'" -- apps packages` → **2 lines, 1 file, 0 real
imports**:

| # | `file:line` | Text | Disposition |
|---|---|---|---|
| 1 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:14` | `` * actually FIRES on a deliberate `import { writable } from 'svelte/store'` (so a `` | **prose** (doc comment) |
| 2 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:42` | `"import { writable } from 'svelte/store';\nexport const x = writable(0);\n",` | **test fixture** (the positive control's lint input, a string literal) |

CONTEXT.md B-4 **confirmed exactly**.

**Loose grep, scoped as CONTEXT.md B-5 scoped it** — `git grep -n "svelte/store" -- apps/frontend/src`
→ **10 lines across 5 files**. B-5/D-09a **confirmed exactly**, including `supabaseDataProvider.test.ts`:

| # | `file:line` | Disposition |
|---|---|---|
| 1-6 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:6,11,14,39,40,42` | prose ×4 (`:6,11,14`, plus `:40`'s test title) / fixture ×1 (`:42`) / describe title ×1 (`:39`) |
| 7 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:17` | **prose** — `// Mock parseAnswers to avoid dependency on svelte/store via $lib/i18n` |
| 8 | `apps/frontend/src/lib/components/video/component-stores.svelte.ts:10` | **prose** — `* Svelte 5 replacement for the old \`svelte/store\` mutable-store primitive).` |
| 9 | `apps/frontend/src/lib/contexts/data/dataContext.type.ts:6` | **prose** — `* (tracks the version counter). The legacy svelte/store DataRoot bridge was` |
| 10 | `apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts:27` | **prose** — `*   3. No \`svelte/store\` imports, no \`Readable<T>\` shim, no \`subscribe\` getter.` |

> ⚠ **Scope qualifier the ledger must state.** The 10/5 counts hold **only** when the grep is scoped to
> `apps/frontend/src`. Widening to `-- apps packages` returns **13 lines across 6 files** — the extra 3
> being `apps/frontend/eslint.config.mjs:77,81,95,97` (4 lines: the guard's own comments and the ban's
> `name`/`message`). Measured this session. Record the grep's **path argument** alongside its count, or
> the count is not reproducible.

#### 5.2 ⚠ Two CONTEXT.md measurements that did **not** survive re-measurement

Both concern **SC-3**, which requires the exclusion list's size to be *stated*. A stated number that is
wrong is worse than silence, and the milestone's own rule about stale counts (`feedback_reverify_amend_missing_list`)
says to amend at the source rather than annexe.

| CONTEXT.md claim | Re-measured at HEAD `0e014d6a9` | Delta |
|---|---|---|
| **B-8**: *"The exclusion list is **18 entries**, `eslint.config.mjs:22-42`"* | **16 entries**, `eslint.config.mjs:22-41` (array literal), entries on lines **23-37 and 40** | **−2 entries.** `:23-40` spans 18 *lines*, two of which (`:38`, `:39`) are the comment `// Frozen Svelte-5 migration spike fixtures (v2.13): kept as regression` / `// tests but intentionally not held to production lint standards.` The "18" is a line count read as an entry count. DISCUSSION-POINTS § A.3 makes the same error |
| **B-9**: *"`'**/_spikes-*/**'` (`:42`) matches nothing"* | The entry is at **`:40`**, not `:42`. It still matches nothing (`find apps -type d -name "_spikes*"` → empty) | Line number **−2**. The *substance* (dead entry) is confirmed |
| **B-3**: *"`paths` … at `:93-100`, `patterns` … at `:101-108`"* | `paths` array is **`:93-99`**; `patterns` array is **`:100-106`**. The guard block `:87-110` and `files` `:88` are **correct** | Off-by-one on the two inner array closes |

[VERIFIED: `apps/frontend/eslint.config.mjs:22-41` and `:87-110`, opened with `Read` this session. The
16 entries, quoted verbatim in order: `'ios/*'`, `'android/*'`, `'**/.DS_Store'`, `'**/node_modules'`,
`'build'`, `'.svelte-kit'`, `'package'`, `'**/.env'`, `'**/.env.*'`, `'!**/.env.example'`,
`'**/pnpm-lock.yaml'`, `'**/package-lock.json'`, `'**/yarn.lock'`, `'src/app.html'`,
`'src/error.html'`, `'**/_spikes-*/**'`.]

**Planner action:** the ledger's SC-3 line must read **"16 entries before, 16 after, 0 additions"**,
and the phase should amend B-8/B-9 at their source in CONTEXT.md rather than only correcting them in
the ledger. This is a third ⚠ DERIVED-class correction, of exactly the shape D-09a and D-12a already
establish, and it is *within* D-11's remit (which requires the size to be stated correctly) rather than
a scope expansion.

#### 5.3 `svelte/motion` (D-07) — measured, for the todo

`git grep -n "svelte/motion" -- apps packages` → **4 lines, 4 files**:

| `file:line` | Import | Status |
|---|---|---|
| `apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte:44` | `import { tweened } from 'svelte/motion';` | **live legacy call site** |
| `apps/frontend/src/lib/components/modal/timed/TimedModal.svelte:55` | `import { tweened } from 'svelte/motion';` | **live legacy call site** |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:5` | `import { Tween } from 'svelte/motion';` | already Svelte-5 class form |
| `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts:2` | `import type { Tween } from 'svelte/motion';` | already Svelte-5 class form |

This is D-07's premise **confirmed with numbers**: a `svelte/motion` ban cannot land green until the
two `tweened` sites migrate to `Tween`. The todo should carry this table — a todo naming the two
blocking call sites is actionable; one saying "file a ban" is not.

#### 5.4 Files outside `src/` (D-08) — measured, for the todo

`apps/frontend/package.json:10` is `"lint": "eslint --flag v10_config_lookup_from_file src/"`
[VERIFIED, opened with `Read`, quoted verbatim]. Everything at `apps/frontend/*` — `vite.config.ts`,
`vitest.config.ts`, `svelte.config.js`, `prettier.config.mjs`, `eslint.config.mjs` — is outside every
lint gate. Confirmed unchanged by D-05's widening (the glob is relative to the config's directory but
the *script argument* is what limits the file set).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eslintrc` cascading configs, where a nested config's rule options **merge** with the parent's | Flat config (`eslint.config.mjs`), where a later block's rule options **replace** the earlier block's entirely | ESLint 9 (flat config default) | The whole of Pitfall 1. The frontend config already documents this once, for `no-restricted-imports`; this phase hits it a second time |
| `svelte/store` (`writable`/`readable`/`derived`) as the reactivity primitive | Runes — `$state` / `$derived` / `$effect` | Svelte 5 | The reason the ban exists. Zero real imports remain (§ 5.1) |
| `tweened` / `spring` from `svelte/motion` | `Tween` / `Spring` classes | Svelte 5 | D-07's out-of-scope seam; 2 live legacy sites remain (§ 5.3) |
| ESLint config resolved from CWD | `--flag v10_config_lookup_from_file` — config resolved from each linted file's directory | ESLint 9 opt-in flag (v10 preview) | Why the flag is mandatory in the guard spec: without it the API resolves a different config than the gate |

**Deprecated/outdated in this phase's neighbourhood:**

- The `_spikes-*` ignore (`eslint.config.mjs:40`): matches nothing since the v2.13 spike fixtures were
  removed. **Retained by D-11**, documented as measured-dead.
- The todo `.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md`: its
  Solution section says *"Expect this to surface existing `svelte/store` usages outside the migrated
  context/route scope — triage each"* [VERIFIED, opened with `Read`, quoted verbatim]. Superseded by
  `7c47b35b7` nine days after filing; surfaced nothing. Moved to `completed/` by D-12.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | `7c47b35b7` is the commit that widened the glob, on 2026-06-13, in Phase 115 | Throughout (D-12 requires naming it at five record targets) | The record correction would name the wrong commit at five sites. **Carried from CONTEXT.md B-2, not independently re-verified this session** — the planner should have the executor run `git show --stat 7c47b35b7` and `git blame -L 88,88 -- apps/frontend/eslint.config.mjs` once, and record the output in the ledger, before writing it into five documents |
| A2 | `yarn test:e2e` currently passes at 135/135 on this branch | Validation Architecture, Gate 6 | Only affects the expected count in the gate row; a mismatch is discovered by the run itself, not by a bad plan. Carried from `REQUIREMENTS.md` ASSERT-11's evidence clause |
| A3 | `yarn test:unit` currently spans 167 files / 1670 tests over 11 workspaces | Validation Architecture | Same as A2 — a count for the ledger row, self-correcting on execution. Carried from `REQUIREMENTS.md` ASSERT-11's evidence clause |
| A4 | The `TURBO_FORCE` environment variable is the supported public interface for bypassing the cache (rather than an internal that could change) | § 3.3, Pitfall 2 | Low: the *behaviour* was measured working at this repo's turbo version this session. If it were ever removed, `turbo run lint --force` remains, invoked directly rather than through `yarn lint:check` |

---

## Open Questions

1. **Should the Pitfall-1 enum regression case become a standing matrix case, or a one-time
   verification?**
   - What we know: D-04's remit is "prove the guard at four directories × two extensions". An enum
     probe is a different ban, not a `svelte/store` reach case.
   - What's unclear: whether adding it counts as scope creep against "zero runtime bytes ship, change
     surface is one config + one spec".
   - **Recommendation: add it.** It lives in the file D-04 is already rewriting, adds no capability
     and no dependency, and it is the *only* mechanism that would catch a future re-occurrence of the
     trap this research found. Frame it in the plan as a completeness requirement on D-06's edit, not
     as a new capability. If the planner judges otherwise, the fallback is a one-time
     `--print-config` assertion recorded in the ledger — weaker, but it at least makes the trap
     visible once.

2. **How should the two `no-restricted-syntax` bans be disambiguated in assertions?**
   - What we know: after D-06 both bans share `ruleId === 'no-restricted-syntax'` (§ 4.2).
   - What's unclear: whether to match on `message` substring or on fixture line/column.
   - **Recommendation: match on `message` substring** (`'svelte/store is banned'` vs
     `'const assertion'`). Line/column matching is brittle against fixture edits; the messages are
     stable strings the config itself owns.

3. **Does CONTEXT.md's B-8/B-9 correction (§ 5.2) need a `143-CONTEXT.md` amendment, or is the ledger
   enough?**
   - What we know: the standing rule (`feedback_reverify_amend_missing_list`) is that a stale count is
     amended at its source, and D-09a explicitly invokes it.
   - **Recommendation: amend CONTEXT.md B-8/B-9 in `143-01`, in the same commit that opens the
     ledger**, and record the delta in the ledger. That is exactly what D-09a did for B-5 and D-12a for
     B-6; a third instance of the same shape needs no new decision.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | v24.14.1 | — |
| `eslint` (JS API + CLI) | the gate; the guard spec | ✓ | 9.39.2 | — |
| `@typescript-eslint/parser` | `.ts` in-scope parsing | ✓ | 8.57.1 | — |
| `svelte-eslint-parser` | `.svelte` in-scope parsing | ✓ | 1.6.0 | — |
| `vitest` | Gate 1, guard spec | ✓ | 3.2.4 | — |
| `turbo` | `yarn lint:check`, `yarn build` | ✓ | per `turbo.json` schema | `TURBO_FORCE=true` for cache bypass |
| `prettier` | Gate 3 | ✓ | via workspace | — |
| `svelte-check` | Gate 5 (`yarn workspace @openvaa/frontend check`) | ✓ | via workspace | — |
| Supabase CLI + Docker | Gate 6 prereq (`yarn db:reset`, D-15) | assumed ✓ (used by every prior v2.15 phase's E2E gate) | — | none — Gate 6 is non-optional under the cardinal rule |
| Playwright browsers | Gate 6 | assumed ✓ | — | `yarn playwright install` |
| Dev server on `:5173` | Gate 6 prereq (D-15) | operator-provided, one fresh instance | — | `FRONTEND_PORT` override per CLAUDE.md |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** none identified.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **vitest 3.2.4** (frontend), orchestrated by `turbo run test:unit` |
| Config file | `apps/frontend/vitest.config.ts` [VERIFIED, opened this session] — `test: { globals: true, environment: 'jsdom' }` |
| Quick run command | `cd apps/frontend && npx vitest run src/lib/_guards/` — **measured 1.73 s** for the whole directory |
| Full suite command | `yarn test:unit` (root: `yarn assert:unit-coverage && turbo run test:unit`; `turbo.json:9-12` sets `"cache": false`, so this is never replayed) |

> **Note for the planner:** `turbo.json` sets `"cache": false` on `test:unit` but **not** on `lint`.
> Gate 1 is therefore always a real run; Gate 2 is not (§ 3.3).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSERT-08 | Static `svelte/store` import in each of the 4 SC-1 dirs, as `.ts`, fires `no-restricted-imports` | unit (ESLint API) | `cd apps/frontend && npx vitest run src/lib/_guards/eslint-store-guard.test.ts` | ✅ file exists — **matrix is Wave 2 (D-04)**; today it covers 1 of 8 |
| ASSERT-08 | Same, as `.svelte` (svelte-eslint-parser path) | unit (ESLint API) | same | ❌ Wave 2 (D-04) |
| ASSERT-08 | Clean rune code stays silent in all 4 dirs × 2 exts (negative control) | unit (ESLint API) | same | ✅ exists at 1 path; ❌ 7 remaining are Wave 2 |
| ASSERT-08 | The **blind half** — the same 4 injections PASS under the reconstructed pre-115 scope | one-time measurement, real gate | `TURBO_FORCE=true yarn lint:check` under the narrowed config, per D-02 | ❌ Wave 1 (`143-01`) — evidence, not a standing test. **Mechanism validated end to end this session** |
| ASSERT-08 | The **catching half** — the same 4 injections FAIL `yarn lint:check` naming file + rule | one-time measurement, real gate | `TURBO_FORCE=true yarn lint:check` under the current/widened config | ❌ Wave 2 (`143-02`). **Validated this session** (§ Code Examples 4) |
| ASSERT-08 (SC-5) | A `.js` file under `src/` importing `svelte/store` fails the gate | unit (ESLint API) + real gate | vitest matrix probe + one real-gate injection | ❌ Wave 2 (D-05). **Validated this session** |
| ASSERT-08 (SC-5) | `await import('svelte/store')` fails the gate, in `.ts` and in `.svelte` | unit (ESLint API) + real gate | vitest probes filtering `no-restricted-syntax` **and** disambiguating by message | ❌ Wave 2 (D-06). **Validated this session** |
| ASSERT-08 (new, § Pitfall 1) | The inherited `TSEnumDeclaration` ban still fires under `src/**` after D-06's edit | unit (ESLint API) | vitest probe filtering `no-restricted-syntax` + `message.includes('const assertion')` | ❌ Wave 2 — **recommended**; see Open Question 1 |
| ASSERT-09 | Every `svelte/store` mention under `apps/frontend/src` carries a disposition | one-time measurement | `git grep -n "svelte/store" -- apps/frontend/src` and `git grep -n "from 'svelte/store'" -- apps packages`, with HEAD recorded | ❌ Wave 1 (`143-01`, D-09/D-09a). **Both re-measured this session — § 5.1**. Standing coverage is D-10's explicit non-goal |

### Sampling Rate

- **Per task commit:** `cd apps/frontend && npx vitest run src/lib/_guards/` (~2 s) — the guard spec is
  the only unit surface this phase changes.
- **Per wave merge:** `yarn test:unit` (root, uncached) + `TURBO_FORCE=true yarn lint:check`.
- **Phase gate (`143-03`, D-14):** all six gates green before `/gsd-verify-work`, under D-15's prereq
  (`yarn db:reset` + one fresh dev server on `:5173`).

| # | Gate | Command | Cached? | Notes |
|---|---|---|---|---|
| 1 | unit | `yarn test:unit` | **no** (`turbo.json:9-12`) | — |
| 2 | lint | `TURBO_FORCE=true yarn lint:check` | **yes by default** — force it | Short-circuits; a red hides steps 2-3 of the chain |
| 3 | format | `yarn format:check` | no | Will flag the config edit unless `prettier --write` ran (Pitfall 6) |
| 4 | build | `yarn build` | turbo-cached, harmless here | — |
| 5 | typecheck | `yarn workspace @openvaa/frontend check` | no | 142.1's non-optional addition |
| 6 | E2E | `yarn test:e2e` **once** | no | Cardinal rule; D-15 prereq |

### Wave 0 Gaps

- [ ] **None — no new test infrastructure is required.** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts`
      already exists, is already discovered by `vitest run`, and already carries the correct apparatus
      (`ESLint` JS API + `v10_config_lookup_from_file`). D-04 widens it in Wave 2; nothing must be
      built before that.
- [ ] **One Wave-1 prerequisite that is not a test file:** `143-NEGATIVE-CONTROL-LEDGER.md` must exist
      with **every row written before the first injection** (D-03 / D-13, the 142.1 D-19 rule). Its row
      schema should extend 141's (`| Row | Branch exercised | Injection site | Exit | Outcome |`
      [VERIFIED: `141-ASSERT10-LEDGER.md:77-78`, quoted verbatim]) with **two columns this research
      makes necessary**: `HEAD` (per row, since D-03 puts a commit between the halves — the 142.1
      precedent) and `turbo verdict` (`executing <hash>` / `replaying <hash>` — § 3.3).

---

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json`, so this section is included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **no** | Phase touches no auth path; zero runtime bytes ship |
| V3 Session Management | **no** | — |
| V4 Access Control | **no** | — |
| V5 Input Validation | **no** | No user input is processed. The "inputs" are lint fixtures under developer control |
| V6 Cryptography | **no** | — |
| V14 Configuration | **yes** | This phase *is* a build-configuration change. Control: the change must not weaken an existing enforced constraint — which is exactly what Pitfall 1 identifies and closes |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Silent weakening of a build-time guard** — adding a rule that replaces an inherited one, removing enforcement for the whole in-scope tree with no error produced | Tampering (integrity of the enforcement surface) | Verbatim re-inclusion of the inherited entry (Pitfall 1) + a standing spec case asserting the inherited ban still fires. Measured this session: the naive edit removes the TS-enum ban across all of `apps/frontend/src` and produces **zero** errors, because zero enums exist |
| **False-green evidence from a cached task** — a ledger row recording a replayed exit code as a fresh measurement | Repudiation (the evidence cannot be trusted or re-derived) | `TURBO_FORCE=true` on every ledger-bearing run + recording turbo's `executing`/`replaying` verdict line per row (§ 3.3) |
| **Guard-scope regression** — a future edit narrowing `files` back, undetected because the standing test probes one path | Tampering | D-04's 4×2 matrix; this is the phase's own stated purpose |
| **Ban bypass via an unguarded specifier form** | Tampering | Enumerated and measured in § 2.2 — closed forms, independently-closed forms (template literal via `quotes`, `require` via `@typescript-eslint/no-require-imports`), theoretically-open-but-unresolvable forms (subpath), and genuinely open forms (computed specifier). Recorded as residue rather than over-claimed |
| **Injection file left behind in the tree** — a deliberately-broken fixture surviving the measurement window | Tampering | Phase 141's three-assertion restore proof (Pitfall 4); `git diff --exit-code` alone is insufficient |

---

## Sources

### Primary (HIGH confidence)

All primary sources are this repository, read this session:

- `apps/frontend/eslint.config.mjs` (full file) — guard block, ignores list, parser blocks
- `packages/shared-config/eslint.config.mjs:20-38`, `:55-110`, `:144-155` — global ignores, the
  `no-restricted-syntax` TSEnumDeclaration ban, `quotes`, `func-style`, the inherited
  `no-restricted-imports` `patterns`
- `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` (full file) — invariants `:20-29`, stale
  citations `:8`, `:11`, `:12`, `:39`
- `apps/frontend/package.json:1-18` — the lint script
- `turbo.json` (full file) — the `lint` task's missing `"cache": false`
- `apps/frontend/vitest.config.ts` — framework config
- `.planning/REQUIREMENTS.md:7-13`, `:62-63`, `:153-154` — the standing acceptance rule, ASSERT-08/09,
  status rows
- `.planning/ROADMAP.md:264`, `:626-640` — the phase line and its four original success criteria
- `.planning/phases/141-…/141-ASSERT10-LEDGER.md:77-88`, `:100-112`, `:505-522` — row schema, restore
  discipline, the three-assertion proof
- `.planning/phases/142.1-…/142.1-NEGATIVE-CONTROL-LEDGER.md:1-70`, `:198-199` — the D-19 rows-first
  rule, per-row HEAD, the nine-column schema
- `.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` (full file)
- `node_modules/{eslint,@typescript-eslint/parser,svelte-eslint-parser,svelte,eslint-plugin-svelte,vitest}/package.json`
  — installed versions
- `node_modules/svelte/package.json` `exports` — subpath resolvability

### Measurements taken this session (HIGH confidence — executed, not cited)

- ESLint JS API selector probe across 3 candidate selectors × 8 `.ts` fixtures × 3 `.svelte` fixtures
- Real-gate `yarn lint:check` runs: clean baseline; with injection under narrowed config (exit 0);
  with injection under current config (exit 1); with widened glob (exit 0, 0 new violations); with
  widened glob + `no-restricted-syntax` (exit 0); with widened glob + rule + 3 injections (exit 1, 3
  errors)
- `turbo run lint --dry=json` hash/cache-status probes: clean, with untracked injection, with
  `TURBO_FORCE=true`, with each config variant
- TS-enum ban presence/absence under naive vs. corrected `no-restricted-syntax` patch
- `npx prettier --check` / `--write` on the patched config
- A full `describe.each` 4×2 matrix spec, written to `apps/frontend/src/lib/_guards/` and run
  (26 passed / 2 failed as designed), then removed
- Both ASSERT-09 greps, at two scopes
- `svelte/motion` grep; `.js`/`.mjs`/`.cjs` tracked vs. on-disk inventory; barrel presence at the four
  SC-1 dirs; enum inventory
- Two full narrow → measure → restore cycles, each proven byte-identical by `git hash-object`

**Working tree at the close of research:** `git status --porcelain` → `?? .planning/milestone.lock`
only (pre-existing, untracked before this session began). `git diff --stat` → empty. Every probe file,
probe directory and config mutation removed.

### Secondary (MEDIUM confidence)

- `143-CONTEXT.md`, `143-DISCUSSION-POINTS.md` — the locked decisions and the prior baseline. Every
  product-fact claim in them was re-measured; three deltas found and reported in § 5.2.

### Tertiary (LOW confidence)

- None. No WebSearch was performed and none was needed: every question this phase raises is answerable
  by running the repo's own tooling against the repo's own tree, which is a stronger source than any
  documentation page.

---

## Metadata

**Confidence breakdown:**

- **Standard stack: HIGH** — no new packages; every version read directly from `node_modules`.
- **Architecture / mechanism: HIGH** — the locked mechanism (narrow → measure → restore; selector;
  glob widening; matrix spec) was executed end to end this session, in this repo, with the real gate.
- **Pitfalls: HIGH** — all seven are measured, most in both directions. Pitfall 1 in particular was
  demonstrated by producing the silent regression and then producing the fix.
- **Record-correction inputs: HIGH for the greps and the exclusion list** (re-measured, three deltas
  found); **MEDIUM for `7c47b35b7`'s provenance** (carried from CONTEXT.md; see Assumption A1 — one
  `git blame` closes it).
- **Gate expectations: MEDIUM** — E2E and unit counts carried from `REQUIREMENTS.md` ASSERT-11's
  evidence clause (A2, A3), self-correcting on execution.

**Research date:** 2026-08-22
**Measured at HEAD:** `0e014d6a982a37d77e56df89afe5796d24ef1b57`
**Valid until:** 2026-09-21 (30 days) — or until `apps/frontend/eslint.config.mjs`,
`packages/shared-config/eslint.config.mjs`, or `turbo.json` changes, whichever comes first. The
Pitfall-1 finding in particular is invalidated the moment shared-config's `no-restricted-syntax` entry
is edited.
