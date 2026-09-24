---
phase: 144
phase_name: "seed-template-strict-typing-unknown-prop-guard"
project: "OpenVAA Framework Evolution"
generated: "2026-08-24"
counts:
  decisions: 12
  lessons: 11
  patterns: 10
  surprises: 8
missing_artifacts:
  - "144-UAT.md"
---

# Phase 144 Learnings: Seed-Template Strict Typing + Unknown-Prop Guard

## Decisions

### Template becomes the authoring authority; TemplateSchema stays the runtime authority
`Template` was made hand-written with twelve `FixedRow`-typed per-entity slots, while `TemplateSchema` (zod) remained the runtime authority. A compile-time top-level key-set conformance assertion holds the two together ("Option A").

**Rationale:** Deriving one from the other in either direction would have created a second parallel authority or forced a cast across the schema-to-type seam. The conformance assertion keeps them in agreement without either owning the other.
**Source:** 144-02-SUMMARY.md

### `fixed[]` rows stay LOOSE at the zod layer
`.strict()` was applied to `perEntityFragment` and `TemplateSchema`, but `fixed[]` rows were deliberately left as a loose record, with an in-file comment naming `assertKnownRowProps` as the one row-level authority (D-04).

**Rationale:** The per-collection allow-list is derived; restating it in zod would create the second parallel authority criterion 4 forbids. Exactly one row-level authority.
**Source:** 144-05-SUMMARY.md

### A permitted-key lookup miss THROWS rather than returning an empty set
`permittedKeys` is keyed by the resolved snake_case table name, and an unrecognised collection raises.

**Rationale:** An empty set would make a keying confusion permit *everything* — the guard would silently suppress nothing. The same reasoning drove `144-03`'s derivation helper. Conversely, `deniedKeys` returns empty on a miss so that which message an author sees does not depend on evaluation order.
**Source:** 144-02-SUMMARY.md, 144-04-SUMMARY.md

### `validateTemplate` earns its narrowing instead of casting
`validateTemplate` calls an `asserts parsed is Template` predicate that checks `external_id` on every `fixed[]` row, with a field-path error, rather than casting across the schema-to-type seam.

**Rationale:** Every bridge across that seam is either a cast or an earned narrowing; the phase's own standard forbids cast escapes in the package that owns TMPL-01.
**Source:** 144-02-SUMMARY.md

### Pass 0 guards `Writer.write`'s pre-deletion `data`, not `bulkData`
The runtime unknown-prop guard reads the pre-deletion payload.

**Rationale:** Guarding `bulkData` would leave the phase's headline guard blind to `app_settings`, which all 30 built-in templates emit.
**Source:** 144-04-SUMMARY.md

### `answersByExternalId` is permitted only where it is read
A `NON_COLUMN_FIELD_READERS` map scopes each globally-stripped field to the collections that actually read it (`candidates`, `organizations`); `bulkImport`'s global strip loop is untouched.

**Rationale:** The four-source union admitted the key on every collection, which made the D-08 class-(2) negative control structurally unable to fire. Permission follows the read, not the strip.
**Source:** 144-04-SUMMARY.md

### `linkJoinTables` iterates `LINK_SENTINELS` through a pure `planLinks`
Four hand-written resolution blocks were deleted in favour of a const-driven dispatch with a `never`-typed exhaustiveness arm.

**Rationale:** The array that permits a (collection, key) pair is now the array that resolves it, so "permitted but unhandled" is structurally impossible rather than test-enforced.
**Source:** 144-03-SUMMARY.md, .planning/STATE.md

### `COLLECTION_MAP` / `resolveCollectionName` extracted to a leaf module
Both symbols moved to `template/collectionNames.ts`, which imports nothing local; `permittedKeys.ts` re-exports them.

**Rationale:** `permittedKeys.ts` consumes `LINK_SENTINELS` at module-evaluation time, so importing back the other way closes a real ESM cycle that TDZ-throws on entry through `linkSentinels` — the path every unit spec uses.
**Source:** 144-03-SUMMARY.md

### `.strict()` placed after the `.extend({ latent })` chain link
Both orderings were re-measured as equivalent at zod 4.3.6; the chosen ordering is stated in a comment beside the call.

**Rationale:** The setting lands on the object that actually ships, so no reader has to reason about whether `.extend()` preserved strictness.
**Source:** 144-05-SUMMARY.md

### `accounts` and `projects` modelled for the guard but kept out of `CollectionKey`
Both were modelled against `TablesInsert` in a separate `PASS_THROUGH_COLUMNS` const with a two-directional coverage assertion.

**Rationale:** The cardinal-risk rule says a genuine non-zero classification is "resolved by widening the allow-list with a stated reason, never by narrowing the survey" — and keeping them out of `CollectionKey` leaves the twelve `FixedRow` aliases and `Template`'s conformance assertion untouched.
**Source:** 144-04-SUMMARY.md

### The `@ts-expect-error` directives sit inside the object literal
Directives were placed immediately above the offending property rather than above a single-line literal.

**Rationale:** Prettier owns line breaking in this repo; a reformat of a one-line literal would silently detach a directive from its error.
**Source:** 144-06-SUMMARY.md

### A plan criterion resting on a misreading is reported, not obeyed
The plan required the REQUIREMENTS rollup row's count to read 7 (plans); the column header reads `| Phase | Requirements | Count |` and neighbouring rows confirm it counts requirements. The value 3 was left alone and the finding surfaced.

**Rationale:** Record integrity is an architectural call, so it is escalated rather than auto-applied (Rule 4 — reported, not applied).
**Source:** 144-07-SUMMARY.md

---

## Lessons

### An exit code alone is not evidence; a clean `tsc` run produces an empty log
`tsc` prints nothing on success, so the first passing negative-control row produced a zero-byte log — which the plan's own `test -s` acceptance check rejected, for exactly the outcome the row expected.

**Context:** Fixed with an out-of-repo `runrow.sh` wrapper emitting a provenance envelope (row id, cwd, HEAD, ISO timestamps, verbatim command, exit code). The same hole recurred independently in 144-06 (`tc-X-present-tsc-1.log`, 0 bytes).
**Source:** 144-01-SUMMARY.md, 144-06-SUMMARY.md

### A green from an instrument that silently did nothing is indistinguishable from real blindness
`T1-OLD` completed in ~1 s with zero output, and the plan specified no control for the `tsc` instrument.

**Context:** An apparatus control (a deliberate error under `src/`) was added; it exited 2 with `TS2353` and then did double duty as the discriminating half of row `G-OLD`.
**Source:** 144-01-SUMMARY.md

### `externalIdPrefix` is applied to hand-authored `fixed[]` rows, not only generator-emitted ones
`template/types.ts:23` documents the prefix as "prepended to every generator-emitted `external_id`", but every generator prefixes fixed rows too — producing `negctl144-negctl144-el-1`.

**Context:** Caught by measurement before any ledger row was written. Fixtures now author ids unprefixed and state the trap in their own headers.
**Source:** 144-01-SUMMARY.md

### `yarn db:seed:teardown` silently defaults to the `seed_` prefix
`cli/teardown.ts:211` is `const prefix = values.prefix ?? 'seed_'`, so a bare invocation is a no-op for any other fixture prefix — leaving each negative-control half to run against the previous half's rows.

**Context:** Every teardown ran as `yarn db:seed:teardown --prefix negctl144-`, recorded verbatim; filed as ledger residue RES-3.
**Source:** 144-01-SUMMARY.md

### `yarn test:unit` itself repopulates the live local database
Gate 7 came back 8 failed / 79 did not run / 48 passed after a `db:reset` that preceded gate 1, because the dev-seed integration test's teardown runs `beforeAll` only.

**Context:** Root-caused by measurement (row counts, the `seed_` prefix, `runTeardown`'s single call site, `seed.sql` ruled out by grep), then fixed by re-ordering gates — no source change, so HEAD did not move and gates 1–6 stayed valid.
**Source:** 144-07-SUMMARY.md

### Three enforcement layers can each be correct and still disagree with each other
Four of the code review's nine findings were the same defect class: a key one layer treats as legal and another treats as fatal.

**Context:** The headline (CR-01) was the `entity_type` deny-list being bypassed by its own camelCase form `entityType`, which the codebase's own `resolveFieldName` converts straight back to the denied form. The mid-phase permission split reached the runtime arm of the derivation but not the type arm (WR-01), and the snake-case spelling `answers_by_external_id` that `importAnswers` reads was on neither side (WR-02).
**Source:** 144-REVIEW.md

### Type-layer strictness produces fallout that a plan cannot budget in advance
Making `Template` strict produced 14 unbudgeted diagnostics: `perm-*` row builders and `buildMinimal.ts` locals returned `Record<string, unknown>`, and `as const` on the two app-settings objects yielded readonly nested arrays not assignable to `Json`.

**Context:** Fixed by retyping builders to the `FixedRow` aliases and replacing `as const` with `satisfies Json` (type-level only — emitted values unchanged). This narrowed the excess-property-checking hole the plan had asked only to *declare*.
**Source:** 144-02-SUMMARY.md

### Doc-comment prose can defeat an acceptance grep
Two criteria grep for call sites; a doc comment quoting the call site, or citing a forbidden path, flips the count.

**Context:** Resolved by exporting `SKIP_COLUMNS_SOURCE` and interpolating it (better design anyway — the path is declared once), and by rewording the writer's pass list. Same class recurred in 144-05 (`validateTemplate(builtIn)` quoted verbatim in an annotation made the count 2).
**Source:** 144-04-SUMMARY.md, 144-05-SUMMARY.md

### Module-level consumption of a class puts the consumer in its own temporal dead zone
`DENIED_KEYS` / `NO_DENIED_KEYS` placed above the `PermittedKeySet` class declaration would have thrown a `ReferenceError` at import — the same failure class as 144-03's ESM cycle.

**Context:** Runtime half moved below the class, with a one-line comment at the split explaining the file's ordering.
**Source:** 144-04-SUMMARY.md

### A repo-wide `yarn format` / lint autofix reaches unrelated files carrying pre-existing drift
The same two Playwright files (`mockOidcIssuerEntry.ts`, `candidate-bank-auth-journey.spec.ts`) were touched by both 144-02's format run and 144-04's lint autofix — the latter *deleting* an `eslint-disable-next-line no-console` directive.

**Context:** Reverted with `git checkout --` on those two paths both times; both remain unformatted as they were before.
**Source:** 144-02-SUMMARY.md, 144-04-SUMMARY.md

### A `git commit -m` message containing backticks executes shell commands
Backticked tokens (`` `satisfies Json` ``, `` `as const` ``) were silently dropped from a commit body.

**Context:** Caught by reading the message back; amended via `-F` with a quoted heredoc. No file content was affected.
**Source:** 144-02-SUMMARY.md

---

## Patterns

### Ledger-first ordering — the register is committed before any measurement exists
All 37 register rows and 185 placeholder cells were written in a commit that provably precedes every measurement in the phase, and the falling placeholder count becomes a running assertion.

**When to use:** Any phase whose deliverable is evidence about its own change (negative-control work, guard-authenticity proofs, before/after claims).
**Source:** 144-01-SUMMARY.md

### Evidence-log wrapper with a provenance envelope
Each command's combined output is bracketed with row id, cwd, HEAD, ISO start/finish timestamps, the verbatim command, and the exit code — so a clean, silent run still produces a non-empty, self-describing log.

**When to use:** Whenever a measurement's success case is silent (`tsc`, `prettier --check`, a passing gate).
**Source:** 144-01-SUMMARY.md

### Apparatus control paired with every blindness claim
A byte-identical injection is placed where the instrument *does* see it, proving the green is discriminating rather than vacuous.

**When to use:** Every "the existing tests are blind to X" claim. Applied again to row `K-NEW`, whose green is backed by a red-when-injected observation.
**Source:** 144-01-SUMMARY.md, 144-04-SUMMARY.md

### Restore-and-prove
After a transient injection: `git diff --exit-code` + `git hash-object` against a header blob + a `find` over the probe glob + `git log` showing the edit never reached history.

**When to use:** Any measurement taken under a temporary tree modification.
**Source:** 144-01-SUMMARY.md

### Forced-cache discipline on every evidence-bearing turbo run
`TURBO_FORCE=true` on `lint`, `typecheck` **and** `build`; a replayed exit code is a claim about a previous tree, not a measurement. Cached runs are preserved as disclosure rather than deleted.

**When to use:** Any gate whose exit code is being recorded as evidence. The shipped gate stays unforced (caching is a feature there); only the evidence run forces.
**Source:** 144-07-SUMMARY.md

### Type-only fixture — `*.type-test.ts`
A fixture under `tests/`, type-checked by the package tsconfig, invisible to vitest, carrying a file-header contract that names the gate command and the reach limitation.

**When to use:** Standing negative controls for compile-time guarantees that must run on every gate but never execute as a test.
**Source:** 144-06-SUMMARY.md

### Budget newly-visible call sites by explicit count, never allow-list them
Decomposing `linkJoinTables` surfaced three helpers to the integration test's write-op spy; each got an explicit count assertion derived from the template's own row counts.

**When to use:** Any refactor that splits one instrumented call into several. An N+1 then fails at the pass that owns it instead of hiding behind a single tick.
**Source:** 144-03-SUMMARY.md

### Cite provenance through an exported const
`SKIP_COLUMNS_SOURCE` lets a message name a file the module is forbidden (by an acceptance grep) to mention literally — and declares the path exactly once.

**When to use:** When an error message must cite an authority file that a purity or scoping check forbids naming inline.
**Source:** 144-04-SUMMARY.md

### Preserve discarded measurement iterations under a `-DISCARDED-` name and disclose them
A mis-injection (stale line number, deleted a comment instead of the chain link) was restored, the apparatus re-verified with a `grep -c`, and the discarded log kept rather than deleted.

**When to use:** Every re-run of a measurement. A run that did not execute is still evidence of something.
**Source:** 144-05-SUMMARY.md

### Locate code by identifier and commit hash, never by line number
A stale `supabaseAdminClient.ts:430` citation in a module header was replaced with an identifier-and-commit citation naming `829ccf979`.

**When to use:** Any cross-file citation in a doc comment or header that a refactor can invalidate.
**Source:** 144-03-SUMMARY.md

---

## Surprises

### `tsc` exits 2, not 1, when a run completes with diagnostics
The plan predicted exit 1 in both actions and both acceptance-criteria lists, for both rows.

**Impact:** Recorded as 2 with an explicit correction note rather than writing a number no command produced. The same one-off had already been recorded independently by 144-01 (`X-OLD`, row `P`) and 144-02 (`T1-NEW`, `T2-NEW`) — the plan text under-predicts turbo-propagated `tsc` exit codes by one, consistently.
**Source:** 144-06-SUMMARY.md

### The sentinel pair count is 10, and the research document contradicts itself
Re-derived at execution HEAD as 10, agreeing with CONTEXT B-4 as corrected and with RESEARCH R2.2's own table — but disagreeing with R2.2's headline word "twelve".

**Impact:** Re-derived independently by two plans (144-02 and 144-03) before being relied on; the disagreement is recorded rather than silently reconciled.
**Source:** 144-02-SUMMARY.md, 144-03-SUMMARY.md

### The D-05 corpus census is 4 + 3 + 3 = 10 sites, not the "six" the audit and REQUIREMENTS both claim
Re-deriving the corpus at execution HEAD surfaced four sites the plan's table did not enumerate.

**Impact:** The BLIND count — the number ASSERT-04 actually turns on — is 4. The two TMPL-07 `accepts …` sites were *measured* already-failable (by deleting a declaration on the pre-phase tree and observing both go red) rather than classified by inspection.
**Source:** 144-05-SUMMARY.md

### Fallout composition (4) differs by 76 depending on which reading you take
Removing the three bare sentinel forms from *every* source yields 76 rejections; removing them from the sentinel source only yields 0, because `COLLECTION_NON_COLUMNS` supplies the same two pairs.

**Impact:** Measured both ways rather than picking one, and filed as RES-1: 144-03's derivation test must assert the bare pairs against `LINK_SENTINELS` *specifically*, or the test proves nothing about the const it names.
**Source:** 144-01-SUMMARY.md

### The negative-control fixtures were rejected for reasons unrelated to what they controlled for
The three choice question types require a `choices` array (`103-questions.sql:77-84`), so the first fixture attempts failed at `bulkImport` before reaching the behaviour under test.

**Impact:** Both question fixtures switched to `type: 'text'` with the reason inline. Caught before any ledger row was written against a broken fixture.
**Source:** 144-01-SUMMARY.md

### `git status --porcelain` is never empty during a GSD run
An untracked `.planning/milestone.lock` — the gsd-tools session lock for the run executing the plan — makes a literal `test -z "$(git status --porcelain)"` unsatisfiable.

**Impact:** The assertion was stated against the verbatim output with the lock line quoted and named as a session artefact. Naming the path is stricter than scoping it away, which is what earlier plans in the phase had done.
**Source:** 144-07-SUMMARY.md

### The plan's own ROADMAP instruction and its own acceptance grep contradicted each other
The action said to name the commit that moved the retired template; that commit's subject *contains* the retired identifier, and the verify block required zero occurrences of it in the section.

**Impact:** Resolved by citing the commit by hash and date in the ROADMAP and moving the verbatim subject to the ledger's § Record targets — the stale name survives exactly once, in the record explaining why it is stale.
**Source:** 144-07-SUMMARY.md

### A script outside any `package.json` with `"type": "module"` is transformed as CJS
`tsx` rejected top-level `await` in the fallout-survey script until it was renamed `.mts`.

**Impact:** One failed invocation, stated in the ledger's survey section rather than hidden. Relevant to any future one-off analysis script written under `$TMPDIR`.
**Source:** 144-01-SUMMARY.md
