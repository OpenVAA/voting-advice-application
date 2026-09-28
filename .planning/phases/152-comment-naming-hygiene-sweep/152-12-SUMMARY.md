---
phase: 152-comment-naming-hygiene-sweep
plan: 12
subsystem: supabase-backend, docs-site
tags: [comment-hygiene, planning-reference-purge, supabase, sql, edge-functions, security-comment]
status: complete

requires:
  - "152-05: the committed residue register and its `152-12` partition list"
  - "152-02: the phase-local instruments (hygiene-codemod.mjs, assert-comment-only-diff.mjs, hygiene-grep-report.sh)"
provides:
  - "apps/supabase/** and apps/docs/** swept of planning references, proven comment-only"
  - "a sixth blind-spot measurement (67%) and a new scanner class: dated walkthrough marker ids"
affects:
  - "152-13 (test-title renames), 152-14 (line breaks), 152-15 (the guard + the cardinal E2E gate)"

tech-stack:
  added: []
  patterns:
    - "Named alternate route for an unsatisfiable gate row: run the SHARED codemod in dry-run over the partition and read `phase-ref-deferred`, rather than transcribing its exclusion"
    - "Flip-test on an ALREADY-COMMITTED sweep, restore with `git checkout HEAD --` (memo item 22)"

key-files:
  created:
    - .planning/phases/152-comment-naming-hygiene-sweep/152-12-SUMMARY.md
  modified:
    - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
    - apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/config.toml
    - apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/03-anon-read.test.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql

key-decisions:
  - "The identity-callback disclosure comment at index.ts:249-251 was left BYTE-IDENTICAL. It carries no planning reference, so there was nothing to strip; protecting it meant not editing it."
  - "The four stage-marker comments and two shell echo banners were left alone, and the `phase-ref` gate row was therefore reported UNSATISFIABLE rather than driven green."
  - "`yarn db:lint:sql` is pre-existing red, flip-tested at the pre-plan commit; the criterion is registered, not restated as met."
  - "Markdown left byte-identical and deferred to the operator (memo item 13). Memo item 12 does not fire in this partition."
  - "16 stale intra-repo SQL file cross-references were found, judged OUT of REVIEW-HYG-02's class, and registered rather than fixed."

requirements-completed: []

coverage:
  - deliverable: "apps/supabase Edge Functions swept, disclosure control intact"
    verification:
      - kind: command
        ref: "node .planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs --range c08dc441a~1..c08dc441a"
        status: pass
      - kind: command
        ref: "git grep -ciE 'never returned|not returned' -- apps/supabase/supabase/functions/identity-callback/index.ts  (returns 4, >= 1)"
        status: pass
      - kind: command
        ref: "git grep -ciE 'disclos' -- apps/supabase/supabase/functions/identity-callback/index.ts  (returns 1, >= 1)"
        status: pass
    human_judgment: false
  - deliverable: "apps/supabase schema, migrations, pgTAP tests and benchmarks swept, every migration byte-stable"
    verification:
      - kind: command
        ref: "node .../assert-comment-only-diff.mjs --range 4be4f7301..2394fea57 (10 compared, 0 violations, 0 allow entries, exit 0)"
        status: pass
      - kind: command
        ref: "git diff 4be4f7301..2394fea57 -- apps/supabase | grep -ciE '^[+-]\\s*(create|alter|drop|grant|revoke|insert|update|delete|select)' == 0"
        status: pass
      - kind: command
        ref: "sqlfluff parse --dialect postgres over all six edited SQL files: 0 unparsable sections each"
        status: pass
    human_judgment: false
  - deliverable: "apps/docs swept"
    verification:
      - kind: command
        ref: "nine-gate-row transcription scoped to apps/docs: 0 on every gate row (milestone-ver 5, report-only)"
        status: pass
    human_judgment: false
  - deliverable: "No planning-phase citation survives in any comment in the partition"
    verification:
      - kind: command
        ref: "hygiene-codemod.mjs dry-run over the partition: phase-ref-deferred 0, spike-ref-deferred 0, artifact-path 0, decision-id-* 0, section-anchor 0, plan-number 0, task-id 0; flip-tested 0->1"
        status: pass
    human_judgment: false
  - deliverable: "pgTAP suite result"
    human_judgment: true
    rationale: "NOT RUN. See § 9 — a meaningful pgTAP run would have required `yarn db:reset` to load the edited migration into the live database, and the plan reserves environment-changing runs to 152-15. No pgTAP coverage is claimed."

metrics:
  duration: "22 min"
  completed: 2026-08-29
  tasks: 3
  files_changed: 10
  commits: 3

actuals:
  tokens: 41000
  tasks: 3
  commits: 3
---

# Phase 152 Plan 12: Supabase Backend & Docs Site Sweep Summary

Swept `apps/supabase/**` and `apps/docs/**` of planning references across 15 rewrite sites in 10
files — comment bytes only, proven — while leaving the identity-callback disclosure control
byte-identical, the four stage markers untouched, and every Markdown byte unchanged.

**Duration:** 22 min (04:05:56 → 04:27 EEST) · **Tasks:** 3 · **Files changed:** 10

---

## 1. The genuine exception, and why "protect it" turned out to mean "do not touch it"

The plan named one comment in this partition as a live security invariant. Here it is,
`apps/supabase/supabase/functions/identity-callback/index.ts:249-251`.

**Before:**

```
      // Logged, never returned -- see the decryption arm above. The claim-extraction
      // message enumerates which configured claim names were present or missing, which
      // discloses the provider's claim mapping to an unauthenticated caller.
      console.error('[identity-callback] identity claim extraction failed:', e);
```

**After — identical, byte for byte:**

```
      // Logged, never returned -- see the decryption arm above. The claim-extraction
      // message enumerates which configured claim names were present or missing, which
      // discloses the provider's claim mapping to an unauthenticated caller.
      console.error('[identity-callback] identity claim extraction failed:', e);
```

**This is an ASVS V7 (error handling and logging) control expressed as a comment.** It is the
only statement in the tree of *why* the caught error is logged and not returned: the
claim-extraction message enumerates which configured claim names were present or missing, so
returning it hands an unauthenticated caller the provider's claim mapping. It guards the
`console.error` on the very next line and the deliberately-opaque `'Invalid identity claims'`
401 below it. Threat `T-152-02` in this plan's register. Do not read the absence of a diff here
as an oversight — read it as the finding.

**Why there was nothing to strip.** The register said so in advance (§ 7.5(c)): *"It carries no
planning reference at all. It is named here only because the roadmap named it."* Confirmed at
HEAD. The plan's obligation — *"if any citation is stripped from it, the disclosure rationale
survives complete"* — is discharged vacuously, because no citation was there. **Protecting it
therefore meant recognising that the correct edit was none**, and resisting the momentum of a
file-wide pass that had just rewritten four other comments in the same file.

Its two siblings were treated the same way and for the same reason: the decryption arm at
`:204-209` (the fuller statement, naming the `--no-verify-jwt` deployment and the
step-by-step verification oracle) and the verification arm at `:229-231`. Neither carries a
citation; neither was touched. The pinned `jose@v5.9.6` import URL at `:28` was likewise left
alone — it is matched by the report-only `milestone-ver` row precisely because version strings
are genuine.

**Making the exemption legible.** Three things now record it: the Task-1 commit message names
the site and the ASVS reference in its body; this section states the before and after verbatim;
and the acceptance greps are permanent, machine-checkable evidence that both halves of the
rationale are still present —

```
git grep -ciE 'never returned|not returned' -- .../identity-callback/index.ts   -> 4
git grep -ciE 'disclos'                     -- .../identity-callback/index.ts   -> 1
git diff <task-1> -- .../identity-callback/index.ts | grep -c '^[+-]import'     -> 0
```

---

## 2. Both completeness numbers, per REWRITE SITE

Unit: **rewrite site** (one anchored rewrite), per memo item 19. Stated because a per-line count
inflates a multi-line rewrite by its collateral lines, and the phase's closing arithmetic depends
on the units being comparable.

| Route | Sites | (per line would have said) |
|---|---:|---:|
| Matched by the **nine gate rows** | **5** | 14 removed |
| Found only by the **widened scanner** | **7** | 22 removed |
| Found by **neither — by reading** | **3** | 9 removed |
| **Total** | **15** | **45 removed / 42 added** |

**Gate blind spot: 10 of 15 = 67%.** That is the highest reading in the phase. The series is now
**27 / 64 / 54 / 37 / 30 / 67 %** across six measured partitions. It has never been zero, and a
small partition is no protection: this one carried nine queued spans and still hid two thirds of
its work from the gate.

**Note the trap 152-09 warned about, sprung here in its exact form.** The nine gate rows returned
`phase-ref occ 13 / 6 files`, and the register's `152-12` partition is `9 spans across 6 files` —
**the same six files.** Perfect agreement between the gate and the register. Ten of the fifteen
sites were outside both.

### Route 1 — the five sites the gate saw

`config.toml:130` · `claimConfig.ts:38` · `index.ts:271` · `index.ts:278` ·
`10-schema-migrations.test.sql:1`.

### Route 2 — the seven sites only the widened scanner reached

Six of the seven belong to **one class that no memo entry had yet named**, described in § 3.

| Site | Form | Why no gate row matches |
|---|---|---|
| `config.toml:134` | `D-01a`, `D-01b`, `D-01c` | letter suffix removes the trailing word boundary `decision-id-bare` needs |
| `claimConfig.test.ts:156` | `CR-03` | two-letter id; `task-id` requires `[A-Z]{3,}` |
| `00002_…rls_guard.sql:7` | `260523-u53 [u53-followup] marker; see SUMMARY` | dated marker + a bare artifact name |
| `302-rls.sql:265` | `260524-l1t D7` | dated marker + a single-letter decision id |
| `503-entity-rpcs.sql:82` | `260524-l1t D7` | as above |
| `00-helpers.test.sql:346` | `260524-l1t D7` | as above |
| `03-anon-read.test.sql:19`, `:92` | `260524-l1t D7` | as above (one site each; counted as two) |

### Route 3 — the three sites found only by reading

Memo item 17's floor, confirmed a second time: these name no artifact, so no id-shaped pattern
can ever reach them.

1. **`claimConfig.test.ts:5`** — `behavior with various payloads (from).` A dangling parenthesis
   with nothing inside it. **Not 152-05 damage**: `git show 4402124ce` shows it was authored that
   way, and the codemod never touched this file (see § 6). Repaired to name the payload shapes
   the suite actually covers.
2. **`claimConfig.test.ts:17`** — `See the collision test … for what that cost:` — a narrative
   back-reference to a past incident, reworded to `for why:`. No id, no number, no artifact name.
3. **`10-schema-migrations.test.sql:3`** — `Verifies all four SCHM requirements + ADMN
   requirements:`. Bare requirement-family prefixes with no `-NN` suffix, so `task-id`'s
   `[A-Z]{3,}-\d{2}` cannot see them. `git grep '\bSCHM\b\|\bADMN\b'` returns this line and
   nothing else in the entire repository, and neither prefix exists in `REQUIREMENTS.md` — they
   named a requirement family that is gone.

**Negative result worth recording:** the **split-across-a-line-break** class (memo items 19 and
23, sighted twice already) does **not** occur in this partition. Scanned two ways over the
comment corpus — an adjacency scan for a comment line ending in a reference-opening word whose
successor begins with a digit, and a direct scan for any comment line ending in
`phase|plan|spike|milestone|decision|task|criterion` — both returned zero.

---

## 3. New scanner class: dated walkthrough marker ids

Contributed for plans 13-15 and for the phase's closing arithmetic, on top of 152-08's four,
152-09's ten and 152-11's three.

**Form:** a six-digit `YYMMDD` date, a hyphen, a short alphanumeric session token, and
optionally a bare decision letter-and-digit immediately after it.

```
260524-l1t D7        260523-u53        260523-u53 [u53-followup]
```

**Regex that finds them:** `\b\d{6}-[a-z0-9]{2,6}\b`

They are the ids of `.planning/quick/` work sessions —
`.planning/quick/260524-l1t-refactor-voter-mega-journey-spec-ts-time/` and
`.planning/quick/260523-u53-implement-all-of-the-deferred-88-nn-test/`. They are planning
references in the fullest sense the criterion means, and **not one of the nine gate rows sees
them**: they open with digits, so every `[A-Z]`-anchored id row misses them; they contain no
`phase`/`plan`/`spike` word; and the trailing `D7` has no hyphen, so both decision-id rows miss
it too. Seven occurrences across six files here — **6 of the 15 sites in this plan, 40% of the
whole partition's work, in one previously-unnamed class.**

Also confirming 152-08's class 3 (letter-suffixed ids): `config.toml:134`'s `D-01a` / `D-01b`
sat two lines below a `see phase 83 D-01c` that the gate *did* see. The gate found the span and
still could not have told you the span was only half swept.

---

## 4. Per-span disposition, every span of seven lines and up

The partition's comment corpus is **3,847 lines over 388 tracked files**, extracted with the
shared classifier from `hygiene-codemod.mjs` (`FAMILY_BY_EXT` + `commentSpans`; no copy was
made). Of those, **130 spans of seven lines or more** were extracted and read end to end. All
130 dispositions, grouped:

| Span group | Count | Disposition | Reason |
|---|---:|---|---|
| `00001_initial_schema.sql` + `schema/*.sql` function and policy headers (`get_localized`, `validate_*`, `has_role`, `can_access_project`, `bulk_import`, `bulk_delete`, `resolve_email_variables`, storage RLS, column grants, external-id immutability) | 61 | **KEEP unchanged** | Contracts, input formats, fallback orders, security modes. They explain the code in front of them and carry no planning reference. |
| `benchmarks/pgbench/*.sql`, `benchmarks/data/*.sql`, `benchmarks/k6/*.js`, `benchmarks/scripts/*.sh` file headers | 21 | **KEEP unchanged** | Usage lines, prerequisites, UUID patterns. Operator documentation. |
| `apps/docs/scripts/**` and `apps/docs/src/lib/**` docblocks and JSDoc | 14 | **KEEP unchanged** | Parameter docs and pipeline step lists. No planning reference — see § 5. |
| `tests/database/0*.test.sql` and `10-*.test.sql` file headers | 11 | **KEEP unchanged** (one rewritten, below) | Scope statements and `Depends on:` footers. |
| `identity-callback/**` docblocks and inline rationale, incl. `index.ts:79-87` (the issuer-check rationale) and `:204-209` / `:229-231` (the sibling disclosure arms) | 8 | **KEEP unchanged** | Live auth and disclosure rationale. `:79-87`'s "omitting it here left the weaker of the two paths publicly callable" is the hazard the check closes, not history. |
| `seed.sql`, `lint-schema.mjs`, `tailwind.config.mjs`, `config.toml` SMTP block, `00-helpers.test.sql` UUID tables | 9 | **KEEP unchanged** | Constants, exit codes, commented-out production config. |
| `run-concurrency-scaling.sh:75/112/138` + `00-helpers.test.sql:20/420` | 5 | **KEEP unchanged — PROTECTED** | Stage markers. See § 7. |
| `claimConfig.ts:25-41` | 1 | **REWRITE** | `identityMatchProp` uniqueness invariant kept; `until Phase 142.1` framing removed; `birthdate` retained as the worked counter-example. |
| `claimConfig.test.ts:1-9` and `:155-171` | 2 | **REWRITE** | Dangling `(from).` repaired; `CR-03` heading restated as what the suite asserts. The 15 lines of collision mechanism below the heading are untouched. |
| `index.ts:268-279` | 1 | **REWRITE** | Two sites. `sub` attributed to `PROVIDER_CONFIGS`; the birthday-collision hazard restated in the conditional. |
| `config.toml:129-136` | 1 | **REWRITE** | imgproxy justified by what breaks without it; `D-01a/b/c` and the `post-fix/smoke-output.txt` path removed; the "test-side workarounds were tried and were insufficient" finding kept, because it stops the next editor repeating them. |
| `00002_…rls_guard.sql:1-18` | 1 | **REWRITE** | Background paragraph restated as the gap itself. Held at exactly four lines — see § 8. |
| `302-rls.sql:265-269`, `503-entity-rpcs.sql:82-87`, `00-helpers.test.sql:345-363`, `03-anon-read.test.sql:19-20` / `:91-99`, `10-schema-migrations.test.sql:1-11` | 6 | **REWRITE** | Markers stripped; every guard rationale, the bare-`now()` hazard and the `plan(59)` composition kept in full. |

Two spans deserve naming because the temptation was to cut them and the answer was no:

- **`00-helpers.test.sql:353-359`** — the `MUST NOT be a bare now()` paragraph, ending
  *"…so candidate_a was invisible to anon and 03-anon-read tests 9 and 13 failed
  deterministically."* Reads as narrative. It is not: it is the measured demonstration that makes
  the MUST NOT credible, and it names no planning artifact. **Kept verbatim.**
- **`00003_authenticated_insert_feedback.sql:1-12`** — *"the role split was an oversight, not a
  security boundary."* A migration header is a historical record by construction, and that
  sentence is exactly what stops a future editor "restoring" the anon-only grant. **Kept
  verbatim**; it carries no citation and was never in scope.

---

## 5. `apps/docs` — swept, and the sweep was empty

Task 3's file set required no edits, and that is a measured result rather than an omission.

- **Nine gate rows scoped to `apps/docs`: 0 on every gate row.** `milestone-ver` reports 5,
  report-only, and all five are genuine document versions (`v1.0` on four Finnish project
  reports, and the `conventionalcommits.org/en/v1.0.0/` URL).
- **Widened scan over the docs comment corpus: 12 hits, all false positives** — `depth-2`
  (route depth in `generate-navigation-config.ts`) and `base-100` / `base-300` (DaisyUI colour
  tokens in `tailwind.config.mjs`). Not one reference-bearing comment.
- **Left alone knowingly, per the committed spelling audit** (`152-SPELLING-AUDIT.md` § 5c, 5e
  and the out-of-scope register): `+page.svelte:143, 189` (`localisable` in rendered
  user-facing copy), `navigation.config.ts:159-160` (`Customized behaviour`, which maps to a
  real directory name), `OpenVAALogo.svelte:13` (`colours` in a usage docstring), and the 11
  `(content)/**/*.md` files. All out of scope by decision D-A6, not by accident.
- `git diff --stat <plan-start>..HEAD -- apps/docs/src/routes/+page.svelte` is **empty**. No
  rendered string changed.

---

## 6. The 152-05 repair-damage scan (memo item 14)

**Clean by construction.** `git show --name-only bfcf2dae5 -- apps/supabase apps/docs` returns
**nothing**: the mechanical codemod apply touched **zero files** in this partition, and neither
did its repair pass `f2f0108a1`. There is no 152-05 breakage to find here.

The one broken sentence that *does* exist — `claimConfig.test.ts:5`'s `(from).` — was checked
against its authoring commit `4402124ce` and is byte-identical there. It has been broken since
the file was written. Repaired anyway; recorded here so no one attributes it to the codemod.

---

## 7. The unsatisfiable criterion, its named alternate route, and the flip test

### The criterion that cannot hold

> *"The retargeted occurrence gate, scoped to this plan's file set, reports zero on every gate
> row."*

It cannot, and it **collides with the same plan's own prohibition** (*"No stage-marker comment or
shell echo line that names a numbered stage is rewritten as if it were a citation"*) and its own
acceptance criterion (*"`grep -ciE '^[+-].*(smoke tests|JSONB SCHEMA)'` returns 0"*).

Measured, before and after:

| Scope | `phase-ref` before | after |
|---|---:|---:|
| `apps/supabase` + `apps/docs` | 13 occ / 6 files | **7 occ / 2 files** |

All seven survivors:

| Site | Text | Kind |
|---|---|---|
| `run-concurrency-scaling.sh:75` | `# PHASE 1: JSONB Schema` | comment, protected |
| `run-concurrency-scaling.sh:77` | `echo "--- PHASE 1: JSONB SCHEMA ---"` | **program byte** |
| `run-concurrency-scaling.sh:112` | `# PHASE 2: Relational Schema` | comment, protected |
| `run-concurrency-scaling.sh:114` | `echo "--- PHASE 2: RELATIONAL SCHEMA ---"` | **program byte** |
| `run-concurrency-scaling.sh:138` | `# PHASE 3: Restore JSONB Schema` | comment, protected |
| `00-helpers.test.sql:20` | `-- Phase 1: Create persistent helper functions (outside transaction)` | comment, protected |
| `00-helpers.test.sql:420` | `-- Phase 2: Smoke tests (in a transaction that rolls back)` | comment, protected |

**Why no route reaches zero.** Two of the seven are operator-facing `echo` lines — program bytes
the zero-allow-entry prover forbids editing, which is memo item 4's situation exactly. And the
152-09 precedent of *rewording* `PHASE n` → `STAGE n` (rather than stripping the numeral) does
not rescue it either: it would leave those two `echo` lines red **and** desynchronise each
comment from the banner the script prints on the very next line. Read for what they denote, all
five comments name real stages — the shell script's three benchmark phases (JSONB, relational,
restore), and the pgTAP helper's two structural stages, which its own header at `:12-13`
describes as *"Function definitions are COMMITted … Smoke tests run in a separate BEGIN/ROLLBACK
transaction."* Memo items 7 and 18: do not delete a numeral that carries meaning.

**Registered, not restated as met.** `WINDOWS.md` entry 114.

### The named alternate route

Rather than transcribe the exclusion by hand, the property was proved with the **shared
instrument itself** — `hygiene-codemod.mjs` in dry-run over the whole partition, which uses the
same comment-span classifier and its own **exclusion (g) `isAmbiguousPhase`** (source lines
397-412, whose docstring names these very sites: *"`# PHASE 1:` in a benchmark script … `Phase 1:`
/ `Phase 2:` in the pgTAP helper file are the same thing"*).

```
  hits by rule
    artifact-path 0 · section-anchor 0 · plan-number 0
    decision-id-long 0 · decision-id-bare 0 · task-id 0
    phase-ref 0 · spike-ref 0

  residue by reason  (the judgement pass's work queue)
    not-a-comment-span           3      <- 2 echo banners + the jose@v5.9.6 import URL
    markdown-file                0
    milestone-version            0
    todo-class                   0
    unstrippable-section-anchor  0
    ambiguous-reference          5      <- exactly the 5 protected stage-marker comments
    attributive-reference        0
    phase-ref-deferred           0      <- THE PROPERTY
    spike-ref-deferred           0
  arithmetic (hits + residue == total): OK
```

**`phase-ref-deferred 0`** is the claim: no genuine planning-phase citation survives in any
comment in this partition. Every residual occurrence is accounted for by name.

### The flip test

A gate that examines nothing also reports green. One genuine citation —
`-- INJECTED FOR FLIP TEST see phase 142 and D-07 and .planning/x.md`, a phase number well above
exclusion (g)'s threshold and with no trailing colon, so the exclusion cannot fire — was injected
into a comment in `503-entity-rpcs.sql`:

| Route | Clean | Injected |
|---|---|---|
| Nine-gate-row transcription | 1 row failing (`phase-ref`) | **3 rows failing** (`phase-ref` 7→8, `decision-id-bare` 0→1, `planning-path` 0→1) |
| Codemod comment-scoped pass | `phase-ref-deferred 0` | **`phase-ref-deferred 1`**, plus `decision-id-bare 1` and `artifact-path 1` |
| — of which `ambiguous-reference` | 5 | **5, unchanged** |

Both routes go red; the exclusion is not swallowing everything. **Memo item 22 honoured:** the
injection was made on an *already-committed* sweep and undone with `git checkout HEAD --`, never
against uncommitted work. The tree was verified clean afterwards (`git status --short` empty).

### The gate invocation the plan gave does not exist

Memo item 2, confirmed for a seventh time. `hygiene-grep-report.sh -- apps/supabase apps/docs`
exits **2** — the argument loop's `-*)` arm rejects the `--` token, and the script hardcodes
`-- apps/ packages/ tests/` at every one of its nine call sites under a header that says
`SCOPE IS LOAD-BEARING`. The script was **not modified**. The nine rows were transcribed
verbatim — same patterns, same `-I -h -o -P` flags, same `occ`/`files` columns, same verdict rule,
`milestone-ver` still report-only — under a caller-supplied pathspec.

---

## 8. Migrations, pointers, and the schema-push gate

**Every applied migration's non-comment bytes are identical.** Three independent checks:

1. `assert-comment-only-diff.mjs` over the plan range: **10 files compared, 0 violations, 0 allow
   entries, exit 0.**
2. `git diff <plan-start>..<last-refactor> -- apps/supabase | grep -ciE '^[+-]\s*(create|alter|drop|grant|revoke|insert|update|delete|select)'` → **0**.
3. `sqlfluff parse --dialect postgres` over all six edited SQL files → **0 unparsable sections
   each**. Belt and braces against the one way a comment edit *could* break SQL: damaging a `--`
   marker.

**No schema push was run, and the plan's reasoning holds.** The detection gate fires on the
*paths*, not the change. No DDL or DML line differs, so nothing needs pushing and a push would be
a no-op.

**Dangling pointers found and removed (memo item 21, realised).** Three spans pointed at a file
and a fixture that no longer exist anywhere in the code tree: `302-rls.sql:266-267`'s
`CA-AA-Hidden in baseV1.ts:836-849` (a *line-range* pointer, which reads more precise than the
citation beside it), `00002`'s `CA-AA-Hidden (baseV1 dataset)`, and `503-entity-rpcs.sql:86`'s
`CA-AA-Hidden post-anon_select_candidates tightening`. `git ls-files` finds no `baseV1.ts`;
`git grep CA-AA-Hidden` finds it **only** in `.planning/` documents. All three spans were being
rewritten anyway, so the dead pointers went with them and each guard's rationale was restated
against the live policy predicate. `WINDOWS.md` entry 119.

**Pointers INTO the text this plan rewrote** (memo item 21, the other direction). Two `.planning/`
documents quote it:

- `145-RESEARCH.md:972` quotes `00002`'s Background paragraph and cites it as
  `[VERIFIED: same file:4-8]`. **Mitigated rather than left to rot:** the replacement Background
  paragraph was written at *exactly four lines*, so `file:4-8` still lands on the same paragraph.
- `157-RESEARCH.md:813` quotes `503-entity-rpcs.sql`'s comment verbatim, `260524-l1t D7` included.
  A correct snapshot of a pre-sweep state; not repaired.

Neither was edited: `.planning/` is exempt under D-15 and this plan's prohibitions forbid it.
`WINDOWS.md` entry 118.

---

## 9. The verification gates, stated plainly

| Gate | Result |
|---|---|
| `yarn build` | **exit 0** |
| `yarn lint:check` | **exit 0** |
| `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,560 files, 0 violations |
| `assert-comment-only-diff.mjs --range 4be4f7301..2394fea57` | **exit 0** — 10 changed, 10 compared, **0 allow entries**, 0 violations |
| Nine gate rows, `apps/docs` | **0 on every row** |
| Nine gate rows, `apps/supabase` + `apps/docs` | `phase-ref` **7** — unsatisfiable, § 7 |
| Codemod comment-scoped pass over the partition | `phase-ref-deferred` **0**, flip-tested |
| `sqlfluff parse --dialect postgres`, six edited SQL files | **0 unparsable sections** |
| `yarn db:lint:sql` | **NON-ZERO — pre-existing, see below** |
| pgTAP suite | **NOT RUN** |
| Full E2E suite | **NOT RUN** — belongs to 152-15 |

### The prover range, bounded and unbounded (memo item 16)

Bounded at the **last refactor commit**, `2394fea57`, not at `HEAD`: **10 compared, 0 violations,
0 allow entries, exit 0.** Bounding is necessary, not cosmetic — the classifier maps `md` to an
empty comment family and therefore reads every byte of a Markdown file as code, so any range that
includes this SUMMARY's own docs commit reports one violation per `.planning/` file in it. That is
a scoping artefact of the instrument, **not** a non-comment change in the sweep. **No allow entry
was added for any `.planning/` path**, and none ever should be.

**Both numbers, measured — the unbounded one after the docs commit existed:**

| Range | Files changed | Compared | Allow entries | Violations |
|---|---:|---:|---:|---:|
| `4be4f7301..2394fea57` — bounded at the last **refactor** commit | 10 | 10 | **0** | **0** |
| `4be4f7301..HEAD` — including the docs commit | 12 | 12 | **0** | **2** |

The two are, by name, `.planning/WINDOWS.md` (*"a NON-COMMENT byte changed at code-stream offset
35"*) and `.planning/phases/152-comment-naming-hygiene-sweep/152-12-SUMMARY.md` (*"offset 0"*) —
one per `.md` file in the range, exactly the artefact predicted above, and neither of them a byte
of this plan's sweep. Reproduce with either range; the bounded one is the number that means
something.

### `yarn db:lint:sql` — pre-existing red, flip-tested

It exits non-zero on three PL/pgSQL findings: `is_localized_string` *"never read variable
p_key"*, `_bulk_upsert_record` *"unused variable rel_key"*, and `resolve_email_variables`
*"unused parameter p_template_body / p_template_subject"*, with `fail-on` set to `warning`. **Not
one of those functions lives in a file this plan opened.**

Proved rather than asserted: the working tree was restored to the pre-plan commit `4be4f7301`
(safe — the sweep was already committed), `yarn db:lint:sql` re-run, and it produced
**byte-identical findings and the same non-zero exit**; the tree was restored with
`git checkout HEAD --`. Structurally this is what you would expect —
`lint:all` is `supabase db lint` followed by `scripts/lint-schema.mjs`, and **both query the
running local database, not the working tree**, so a comment-only file edit cannot move them in
either direction. Registered as `WINDOWS.md` entry 115.

### pgTAP: not run, and no coverage is claimed

A local Supabase stack *is* up. It was still not run, and the reason is that running it would
have proved nothing: pgTAP executes against the **live database**, which reflects the last
`db reset` and therefore does not contain this plan's edits at all. Making it meaningful would
have required `yarn db:reset` to reload the edited migration — an environment-changing operation
this plan does not own and which 152-15 needs to control for the cardinal gate. **No pgTAP
coverage was obtained by this plan and none is implied.** The SQL parse check in § 8 is what
stands in its place, and it is honestly weaker.

---

## 10. Partition ownership — the seventh confirmation

| Check | Result |
|---|---|
| Files in this plan's diff | **10** |
| Paths outside `apps/supabase` + `apps/docs` | **0** |
| Paths under `apps/frontend/` | **0** |
| `.md` files in the diff | **0** |
| Register-listed files, touched | 5 |
| Register-listed files, deliberately **not** touched | 1 — `run-concurrency-scaling.sh`, all three spans protected |
| **Files never in the register's `152-12` list at all** | **5** |

The five the span-derived queue never listed: `claimConfig.test.ts`, `00002_…rls_guard.sql`,
`302-rls.sql`, `503-entity-rpcs.sql`, `03-anon-read.test.sql`. **Own your whole prefix.**

And the register's own nine spans split unevenly once read: **only four were sweepable.** The
other five are the protected stage markers. `00-helpers.test.sql` is the sharpest illustration —
it was queued for two spans (`:20`, `:420`), **both** of which had to be left alone, and it was
then swept at `:346`, a span the queue never listed.

The ownership rule was applied as the prefix rule the register states (`apps/frontend/` →
`152-11`, then `apps/` → `152-12`). `ls apps/` confirms exactly three entries — `docs`,
`frontend`, `supabase` — so this plan's prefix is `apps/supabase` + `apps/docs` with nothing else
hiding in it.

---

## 11. The two fenced questions

### Memo item 13 — Markdown: **FIRES POSITIVE. Reported, untouched, not settled.**

Second sighting after 152-11. **Every `.md` byte in the partition is identical** (`git diff
--name-only <plan-start>..HEAD | grep -c '\.md$'` → **0**).

- `apps/supabase/benchmarks/README.md:121` — `Key thresholds (from CONTEXT.md):`. A
  planning-artifact filename in Markdown prose, found by the widened sweep and matched by **no**
  gate row and **no** codemod rule.
- The codemod run with `.md` in its glob reports **`markdown-file` residue: 8 rows across 5
  files**, all in `apps/docs` — three `TODO` in generated component docs
  (`EntityListControls`, `EntityCardAction`, `Tabs`) and five `v1.0` in `about/project` and
  `contributing/contribute`, which are genuine publication versions, not milestone tags.

The prover cannot see Markdown comments at all, so **no plan in this phase can prove a Markdown
edit comment-only.** The operator's question stands unchanged: *does the phase sweep Markdown
prose at all, under which plan, and against which prover?* `WINDOWS.md` entry 116.

### Memo item 12 — E2E coverage ids: **does NOT fire here.** Clean negative.

- `git grep CR-03` outside `.planning/` returns **nothing** — it was a PR-review comment id, not a
  coverage id, and it appeared in no run register.
- The `task-id` gate row over the whole partition reads **0**.
- The only `grep` in a blocking CI job (`.github/workflows/main.yaml:370`) selects the `@visual`
  **tag**, not an id. Nothing in `apps/supabase` or `apps/docs` is cited by a merge gate.

Recorded because a negative measured deliberately is worth more than a question left unasked.

---

## Deviations from Plan

### Auto-fixed

**1. [Rule 1 - Bug] Three dangling pointers to a deleted file and a deleted fixture**
- **Found during:** Task 2
- **Issue:** `302-rls.sql:266-267` (`baseV1.ts:836-849`, a line-range pointer), `00002`'s header
  and `503-entity-rpcs.sql:86` all referenced `CA-AA-Hidden` / `baseV1.ts`, which exist nowhere in
  the code tree.
- **Fix:** removed with the citations they sat inside; each guard's rationale restated against the
  live policy predicate.
- **Commit:** `2394fea57` · **Registered:** `WINDOWS.md` 119

**2. [Rule 1 - Bug] A comment sentence broken since the file was authored**
- **Found during:** Task 1
- **Issue:** `claimConfig.test.ts:5` read `behavior with various payloads (from).` — an empty
  parenthesis. Verified against `4402124ce`: broken at authoring, **not** 152-05 damage.
- **Fix:** restated as the payload shapes the suite covers. **Commit:** `c08dc441a`

### Reported, not fixed

**3. [Out of class] 16 stale intra-repo SQL file cross-references.** `Depends on:` / `Provides:`
headers across `apps/supabase` still name `000-functions.sql`, `012-auth-hooks.sql`,
`016-bulk-operations.sql` and 13 others; the tree holds `010-utility-functions.sql`,
`301-auth-functions.sql`, `501-bulk-operations.sql` and so on. These are **code** cross-references,
outside REVIEW-HYG-02's class, and spread across two mirrored copies (`schema/` and
`00001_initial_schema.sql`). Not touched. `WINDOWS.md` entry 117.

**4. Style note.** Where a rewrite would have introduced a new `--`-as-dash into
`config.toml` (whose prior text used a real `—`), the sentence was reworded to use parentheses
instead. D-A5 leaves existing `--` alone; this plan added none.

**Total deviations:** 2 auto-fixed (2 × Rule 1), 2 reported. **Impact:** none on behaviour — the
comment-only prover is exit 0 with zero allow entries across the whole plan range.

---

## Known Stubs

None. This plan wrote no new code path.

---

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema surface was introduced —
the diff contains zero non-comment bytes.

---

## Handoff

Wave 4 is closed. Seven partition plans, `152-06` through `152-12`, have now swept all 641 spans
across 282 files.

**For `152-13`** (test-title renames): memo item 12 does not fire in this partition, so nothing
here constrains the coverage-id decision; and `10-schema-migrations.test.sql`'s pgTAP descriptions
were **not** renamed, per this plan's prohibition — they remain 152-13's.

**For `152-14`** (line breaks): the identity-callback disclosure comment at `index.ts:249-251` is
one of the 19 reviewed sites, and the reviewer asked only for its line breaks to be joined. This
plan deliberately did **not** join them. Its meaning is intact and unabridged; joining is safe,
shortening is not.

**For `152-15`** (the guard and the cardinal gate): `yarn db:lint:sql` is red before this phase
began (entry 115) — do not attribute it to the sweep. `yarn build`, `yarn lint:check` and
`assert-comment-hygiene.mjs` are all green here.

**For the operator:** four items are waiting — the Markdown question (116), the unsatisfiable
`phase-ref` row (114), the pre-existing `db:lint:sql` red (115), and the 16 stale schema-file
pointers (117).

## Self-Check: PASSED

- `.planning/phases/152-comment-naming-hygiene-sweep/152-12-SUMMARY.md` — exists
- `c08dc441a` — found in `git log --oneline --all`
- `2394fea57` — found in `git log --oneline --all`
- All 10 modified files present on disk and in the plan-range diff
- Plan-level `<verification>` re-run: prover exit 0 / 0 allow entries; docs gate 0 on every row;
  disclosure rationale present in both halves; pinned import URL unchanged; stage markers absent
  from the diff; no `.md` and no rendered string edited; partition respected in both directions
