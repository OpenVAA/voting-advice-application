---
phase: 160
phase_name: "agent-docs-skills-refresh"
project: "OpenVAA Framework Evolution"
generated: "2026-09-14"
counts:
  decisions: 14
  lessons: 15
  patterns: 16
  surprises: 14
missing_artifacts:
  - "160-UAT.md"
---

# Phase 160 Learnings: agent-docs-skills-refresh

## Decisions

### Package-relative citations are reported as dangling, never suffix-resolved
`audit-skill-links.sh` refuses to resolve a citation like `src/index.ts` (meaning
`packages/filters/src/index.ts`) by suffix. This keeps a 350-line baseline instead of a ~40-line one.

**Rationale:** Suffix resolution would also silently forgive `frontend/src/lib/components/` — one of
`BOUNDARIES.md`'s five moved-under-`apps/` rows, i.e. the exact class the guard was commissioned to
catch. A forgiving guard would have passed the defect it exists to find.
**Source:** 160-01-SUMMARY.md

### Bare filenames resolve by basename; `[`/`]` are not glob metacharacters
A bare `tsconfig.json` is checked by basename-existence anywhere in the tracked tree (a bare filename
names a file KIND far more often than a location); bracketed segments are NOT exempted as globs.

**Rationale:** Root-resolving bare filenames made `package.json` pass only by accident. Exempting
brackets would have blinded the guard to SvelteKit route parameters — including the very citation the
plan repaired.
**Source:** 160-01-SUMMARY.md

### Both new guards land unwired from CI
`audit-skill-links.sh` (Plan 01) and `audit-skill-routing.sh` (Plan 09) ship with no CI job and no
`package.json` script, and each says so in its own header.

**Rationale:** Wiring guards into CI is Phase 163's recorded scope, and `main.yaml`'s
`paths-ignore: "**.md"` would have to move before either could fire on a documentation change.
**Source:** 160-01-SUMMARY.md, 160-09-SUMMARY.md

### The constituency rules are written as product-owner-attributed selection semantics, not model invariants
Both new bullets carry `-- selection semantics, not a model invariant` and no `Source:` path; a
trailing note names the four supporting symbols that do exist.

**Rationale:** A `Source:` line means "read off this file" everywhere else in the document; attaching
one here would assert an enforcement guarantee `@openvaa/data` does not provide. Writing only "not
enforced" would have withheld the machinery an implementer needs. Both halves were written.
**Source:** 160-02-SUMMARY.md

### The re-check note's incident was substituted, not copied
The plan required citing retired schema filenames; re-measured at execution that class was zero, so a
live incident of the same class was measured and used (`schema-reference.md` claiming completeness for
17 tables / 18 files against a live 20 / 25).

**Rationale:** Shipping "0 filenames in 0 places" inside a note whose whole point is "re-check your
listings" would have put a false assertion inside the instrument built to prevent them.
**Source:** 160-03-SUMMARY.md

### Every corpus measurement command excludes the record's own file
`.claude/skills/README.md` measures the corpus with `-not -path '.claude/skills/README.md'`, and says
so in prose.

**Rationale:** Without the exclusion, writing the next paragraph falsifies the recorded number — the
figure would be a snapshot, not a reproducible measurement. With it, the recorded 488,843 reproduces
exactly after three subsequent edits to the file.
**Source:** 160-04-SUMMARY.md

### The one-level routing rule is stated as two separately checkable clauses
Routing depth and description discriminativeness, each with exactly one live violation named and the
Plan 09 check that will score it.

**Rationale:** The plan's must_have said "single"; resolving it explicitly showed the two violations
are different artifacts in different files. An asserted rule that names its instrument can be
disagreed with by measurement rather than by opinion.
**Source:** 160-04-SUMMARY.md

### Both filed todos carry `resolves_phase: null`
Rather than naming Phase 156 or Phase 153 as the owner phase, with an `## Owner` section preserving
the provenance in prose.

**Rationale:** Every candidate owner phase had already executed. A `resolves_phase` naming a finished
phase makes the item read as scheduled work that will never be picked up — the same defect class as a
stale listing.
**Source:** 160-04-SUMMARY.md

### A stale premise is amended in place, with a dated amendment log — never by addendum
Probe-reconciliation row 2 was rewritten in place after Plan 02 disproved it.

**Rationale:** An addendum alone leaves the stale premise readable as the record, so the next reader
can still inherit the false version.
**Source:** 160-04-SUMMARY.md

### The `components` description does not open with `Domain expert for the`
The executor followed `.claude/skills/README.md` over its own plan's `read_first`, which had said to
copy `data/SKILL.md`'s grammar exactly.

**Rationale:** 6 of 8 corpus descriptions shared that stem, so it is the part measured to carry no
routing signal. The grammar that matters is `Understands … / Activate when …`.
**Source:** 160-05-SUMMARY.md

### A generated artifact that a guard rejects is fixed in the generator, not the output
Phase 152 had repaired `navigation.config.ts`'s header; the first regeneration undid it and turned
`yarn lint:check` red. The fix went into `generate-navigation-config.ts`.

**Rationale:** Fixing the output again would have re-armed the identical trap for the next
regeneration. Nothing had regenerated since 152, which is why the loop stayed latent.
**Source:** 160-05-SUMMARY.md

### The heading `### Context Destructuring Rule (Svelte 5)` was kept verbatim; only the body moved
A 7-line compressed pointer replaced a 52-line essay under the unchanged heading.

**Rationale:** 39 source comments across 32 files in `apps/frontend/src` cite the rule by that exact
name and name `CLAUDE.md` as where it lives. Renaming the heading would have dangled all 39 while
satisfying every other criterion; repointing 32 files was the expensive alternative.
**Source:** 160-05-SUMMARY.md, 160-06-SUMMARY.md

### The operator overruled the recorded recommendation: `delete-sources-only`, not `delete-whole`
Executed at Plan 07's `checkpoint:decision`, with the argument shift recorded under its own heading in
`.claude/skills/README.md`.

**Rationale:** The recommendation's ground (b) — that the runner-up leaves a rule-violating two-hop
chain — was written before Plan 09 existed, and Plan 09 is chartered to dispose of exactly that
violation. With (b) neutralised, the option preserving unrecoverable content dominated.
**Source:** 160-07-SUMMARY.md

### A hop is a pointer to a corpus Markdown document; `Skill("x")` in the routing section is depth 0
Both definitions were arrived at by measurement and are recorded with their rejected alternatives in
the script header.

**Rationale:** Counting every path citation scored `CLAUDE.md` at 62.0% and
`filters/extension-patterns.md` at 50.5% — two unambiguous content files. Counting `Skill("x")` as a
hop would make `CLAUDE.md → Skill("data") → data/SKILL.md → object-model.md` three hops and condemn
the very shape the rule's own next sentence blesses. That single decision is why six of seven skills
score OK rather than zero of seven.
**Source:** 160-09-SUMMARY.md

---

## Lessons

### `awk '/^## X/,/^## /'` collapses to the heading line — it bit at least six criteria across five plans
In awk a range expression tests the END pattern against the same record the START pattern matched, and
`## X` itself matches `^## `. The range is therefore one line long, always.

**Context:** Four affected criteria became unsatisfiable and one passed vacuously (a false green).
Plans 02, 03, 04, 05, 06, 08 and 09 each hit it independently. The sound forms are
`sed -n '/^## start/,/^## next/p'` and `awk '/^## X/,0'`.
**Source:** 160-02-SUMMARY.md, 160-03-SUMMARY.md, 160-05-SUMMARY.md, 160-06-SUMMARY.md, 160-09-SUMMARY.md

### `grep` in this shell is a function wrapping `ugrep`, which emits no `./` prefix
Every acceptance criterion in Plans 07–09 filtering `.planning/` with `grep -v '^\./\.planning/'` is
therefore vacuous — `.planning/` hits pass straight through.

**Context:** Plan 07's first sweep was contaminated by exactly this and reported dozens of `.planning/`
hits as live code references. `command grep` is the substitution, and it must be used in guard scripts
too: a guard whose verdict depends on which grep the caller exported is not a guard.
**Source:** 160-07-SUMMARY.md, 160-08-SUMMARY.md, 160-09-SUMMARY.md

### `awk '/^targets:/{f=1;next} /^[a-z_]+:/{f=0} f'` never terminates on a frontmatter block
The frontmatter closes with `---`, which matches neither pattern, so the extraction emits the whole
body: 9 reported items and 100+ spurious `NOT A DIRECTORY:` lines.

**Context:** Any awk range over YAML frontmatter must terminate on `/^---$/`. This is a cousin of the
heading-range flaw above, found in a different shape.
**Source:** 160-05-SUMMARY.md

### `head -n -1` is a GNU extension; BSD `head` on macOS rejects it and returns 0
A pipeline built on it returned `0`, which would have read as a passing line-span check.

**Context:** Zero is a plausible-looking answer for a span check, so the failure mode is a silent false
green rather than an error.
**Source:** 160-06-SUMMARY.md

### `grep -c` returns the number but exits 1 when the count is zero
Read the number; never use the exit status as the gate.

**Context:** Every `grep -c` in the new guards carries `|| true` so a legitimate zero is not confused
with a script error.
**Source:** 160-08-SUMMARY.md, 160-09-SUMMARY.md

### An exit status read through a pipe reports the last stage, not the gate
Caught live in Plan 09's own first argument-contract run, which read `EXIT=0` from `sed` while the
script had exited 1.

**Context:** Every gate in this phase reports `yarn lint:check` status read from `$?` on the command
itself. This repeats a standing project lesson from an earlier phase.
**Source:** 160-09-SUMMARY.md

### awk's `printf` follows the locale — an unguarded run prints `62,0%`
`export LC_ALL=C` inside the script.

**Context:** A percentage a reader cannot paste into a spreadsheet undermines the measurement it is
supposed to communicate.
**Source:** 160-09-SUMMARY.md

### Plan premises go stale between planning and execution, and several were measured false
Five of thirteen re-derived figures in Plan 04 had moved; three of Plan 04's five deviations are its
own stated facts re-measured false; Plan 03's entire cited incident had been repaired upstream.

**Context:** The phase's standing practice — re-derive every path, count and anchor at execution time —
is what caught each one. Transcribing them would have propagated false premises into the artifacts the
phase exists to make trustworthy.
**Source:** 160-01-SUMMARY.md, 160-03-SUMMARY.md, 160-04-SUMMARY.md, 160-05-SUMMARY.md

### Trimming a file invalidates every line anchor pointing into it — and this phase committed that defect itself
`CLAUDE.md:392` and `CLAUDE.md:432` pointed past the end of a file this phase had just cut from 437 to
341 lines.

**Context:** No guard could catch it: the link guard's line-range test only fired on tokens containing
a `/`. Plan 09 closed the class as check 3c, declining rather than guessing when a basename is
ambiguous.
**Source:** 160-08-SUMMARY.md, 160-09-SUMMARY.md

### A falling defect count after a deletion is removal, not repair
The dangling count fell 327 → 212, but only 5 of that 115 was repair; the other 110 was carried by the
deleted copies.

**Context:** The headline number invites exactly the opposite reading, so the subtraction must be made
explicit wherever the figure is reported.
**Source:** 160-07-SUMMARY.md

### A phase's own commits reset `audit-skill-drift.sh`'s per-skill baseline, so its green is not evidence
Five of six skills read `OK (synced as of 2026-09-13)` — the date of this phase's own commits into
those directories.

**Context:** Every plan in the phase disclaimed it explicitly, and the verifier independently confirmed
the disclaimer. The guard's output was recorded as context with its exit code disclaimed.
**Source:** 160-02-SUMMARY.md, 160-08-SUMMARY.md, 160-09-SUMMARY.md, 160-VERIFICATION.md

### `paths-ignore: "**.md"` means a Markdown-only change can break a test but never trigger CI
`main.yaml` carries it on all three trigger forms (push to `main`, push to `ci-evidence/**`, PRs
targeting `main`).

**Context:** Proven, not theorised: Plan 06's reword of two `CLAUDE.md` lines broke
`e2eDocPreconditionGate.test.ts`, which allowlists them by verbatim text — two failures in both
directions of the same guard, caught by the phase's own regression gate and filed as a blind spot.
**Source:** 160-04-SUMMARY.md, commit `1a960b39e`, commit `a0ec9968d`

### A redundancy proof is only as wide as the file glob that produced it
Every byte comparison behind "the `sources/` directory is pure duplication" had counted `*.md` only.

**Context:** `sources/` actually held 76 files / 359,990 B — the 17 write-ups plus 59 non-Markdown
files with zero counterparts anywhere in the tree or in `main`'s history.
**Source:** 160-07-SUMMARY.md

### Two new guards exited 0 when they broke
Neither set `set -euo pipefail`, and both installed a bare cleanup trap — on bash 3.2 (what macOS
ships) the successful `rm` becomes the exit status when the script dies abnormally.

**Context:** Found by the phase's own code-review gate after all nine plans closed. A guard that
reports the same status when broken as when passing is worse than no guard. Fixed red-then-green with
byte-identical real-run output.
**Source:** 160-REVIEW.md, commit `b25d8d26c`

### Relocating text verbatim can ship an anti-pattern if the source block was already wrong
`CLAUDE.md`'s canonical-pattern code block contained `const dataRoot = $derived(ctx.dataRoot);` — a
line the cited file does not contain and that the carve-out three paragraphs below it prohibits.

**Context:** "Move the text, do not rewrite it" collided with a block that was measurably wrong. The
real eight lines were reproduced instead, with a paragraph drawing attention to what the example does
*not* contain — a strengthening of the prohibition, not an edit to the invariant.
**Source:** 160-05-SUMMARY.md

---

## Patterns

### `skill-link-allow` inline exemption marker
An inline `<!-- skill-link-allow: <token> -->` exempts exactly the token it names, for the file it
appears in.

**When to use:** For irreducible shape noise a path checker cannot classify — a property expression
read as a filename (`data.type`), a placeholder, or a record that must name a path it just deleted.
Never for a package-relative citation that should simply be made repo-relative.
**Source:** 160-01-SUMMARY.md, 160-02-SUMMARY.md, 160-07-SUMMARY.md

### Red-then-green on a real defect is the acceptance evidence for a new guard
A checker only ever observed green is not known to check anything.

**When to use:** Whenever a guard, gate or assertion lands. Prefer a real defect in the tree; where
none exists, a throwaway fixture that is shown red, then made compliant and shown green, then deleted
with `git status --short` proving no fixture path survives.
**Source:** 160-01-SUMMARY.md, 160-09-SUMMARY.md, commit `b25d8d26c`

### Provenance-qualified bullet
`- **<Rule> -- selection semantics, not a model invariant:** <consequence>` — the register for a
product rule living in a code-derived reference, with the enforcement question answered explicitly
(what enforces it; what merely supports it; what guards it at one call site).

**When to use:** When a documented fact cannot be read off a source file. Carry the provenance inline
instead of the `Source: <path>` shape, which asserts the opposite.
**Source:** 160-02-SUMMARY.md

### Scoped-check procedure step
`N. **Check whether X must …** <entry point>` plus `Usually in scope:` / `Usually NOT in scope:`
sub-bullets with re-derived counts.

**When to use:** When a procedure step adds surface to an adjacent package. Never write it as an
unconditional sweep ("update all templates") — a blanket instruction gets ignored rather than followed.
**Source:** 160-03-SUMMARY.md

### Reflexive verification item
The final item of a `## Verification After Extension` list names the skill's own listing files and
carries a dated, re-derived incident as its rationale.

**When to use:** In any extension procedure for a subsystem whose documentation contains listings. The
cost must be measured at authoring time, not asserted.
**Source:** 160-03-SUMMARY.md

### Self-excluding measurement
A record that measures a corpus it lives inside excludes its own path in every command, and says why in
prose.

**When to use:** Any decision record, dashboard or census stored inside the thing it measures.
**Source:** 160-04-SUMMARY.md

### Rule-with-instrument
Where a record asserts a rule, it names the audit check that will score it — one hop, no second index.

**When to use:** Any normative claim in documentation. It converts "do you agree with me" into "run
this and see".
**Source:** 160-04-SUMMARY.md, 160-09-SUMMARY.md

### Re-premised filing
When a planned todo's premise re-measures to zero, the filing records the disproof FIRST, with its
command, then carries the live defect of the same class.

**When to use:** Instead of writing the todo to the plan's stale text, and instead of silently dropping
it. The next reader must not go looking for a defect that does not exist.
**Source:** 160-04-SUMMARY.md

### Anchor discipline
Every path and line range is re-derived at execution time and content-checked
(`sed -n 'NN,MMp' | grep -c '<the thing the citation names>'`), never copied from a plan or a prior
summary.

**When to use:** Every citation written into durable documentation. Existence-checking a path is not
enough — the range must contain what the citation claims.
**Source:** 160-05-SUMMARY.md, 160-08-SUMMARY.md

### Section-preserving rewrite
Kept regions are re-emitted from the original file by line range (`sed -n`) rather than retyped, so
"byte for byte" is a property of the method rather than a claim about care.

**When to use:** Any large trim or restructure of a file with must-keep regions. The commit diff then
cannot touch them.
**Source:** 160-06-SUMMARY.md

### Fix the generator, never the generated output
**When to use:** Whenever a guard rejects a generated artifact. Repairing the output leaves the trap
armed for the next regeneration — which is exactly how the Phase 152 repair survived only until the
first `generate:docs` run in this phase.
**Source:** 160-05-SUMMARY.md

### Sensitivity as a table, not an adjective
Report the verdict count at each of seven threshold values so a reader sees the stable band rather
than being told there is one. When a distribution turns out flat, say so and downgrade that level of
the check to advisory rather than reading a threshold off noise.

**When to use:** Any thresholded metric. The 50%-from-"predominantly" derivation plus a 25→100 sweep
showing the binding verdict unchanged is what makes the verdict trustworthy, not the threshold itself.
**Source:** 160-09-SUMMARY.md

### An escape hatch suppresses a verdict, never a measurement
An exempted file still has its density printed, so the waiver can be disagreed with without
re-deriving it.

**When to use:** Any guard with a waiver mechanism. Also: the waiver must be able to express the case
it exists for — the first `skill-routing-allow` marker suppressed only file-level classification while
every binding verdict was section-level.
**Source:** 160-09-SUMMARY.md

### `command grep` plus a poisoned-function proof
The guard calls `command grep` everywhere, and the independence is proven by running under
`grep() { echo POISONED; return 0; }; export -f grep` and showing byte-identical output.

**When to use:** Every guard script. "Does not currently exploit" is not assurance — the sibling
script's bare-`grep` call sites were flagged by code review on exactly that reasoning.
**Source:** 160-09-SUMMARY.md, 160-REVIEW.md

### Per-class row accounting with an explicit union
Report the count in each defect class AND the union, because overlapping classes double-count.

**When to use:** Any table edit spanning multiple defect classes. Line 15 of `BOUNDARIES.md` is both an
orphaned-owner row and a moved-path row, which is how an earlier count reached 14 instead of 13.
**Source:** 160-08-SUMMARY.md

### Superseded figures get a new dated row, never an overwrite
Add a row measured at the new commit and itemise the difference per file.

**When to use:** In any record carrying measurements across time — so a reader can tell "the corpus
changed as the phase said" from "the corpus has drifted". Corollary, measured across this corpus:
anchored figures survive drift, unanchored ones do not.
**Source:** 160-07-SUMMARY.md, 160-08-SUMMARY.md

---

## Surprises

### Seven dangling citations in `CLAUDE.md`, not the one the plan predicted
The plan named the results `+layout.svelte` path; the checker's first run found seven — four
`apps/supabase/**` paths missing their nested `supabase/` segment, the dead `$voter` alias, and a
generic `src/index.ts`.

**Impact:** The tracer worked end to end on its first slice: guard written, defect found, defect fixed,
fix confirmed — before any expansion work. All seven had to be repaired because Task 1's own acceptance
criterion demanded `Dangling: 0`.
**Source:** 160-01-SUMMARY.md

### RESEARCH assumption A2 ("no enforcing code exists") was half-wrong
No code enforces the constituency rules, but four named symbols implement the machinery:
`Election.getApplicableConstituency()` (throws on an ambiguous selection),
`ConstituencyGroup.impliedBy()`, `ConstituencyGroup.getImpliedConstituency()` and
`DataRoot.getCombinedElections()`.

**Impact:** The skill now states both halves. Suppressing the finding to keep the plan's premise intact
would have been the same defect class the phase exists to close.
**Source:** 160-02-SUMMARY.md

### The incident the re-check note was required to cite had already been repaired
All 19 distinct three-digit `.sql` names the `database` skill cites resolve on disk: 0 retired
filenames in 0 places.

**Impact:** A live incident of the same class had to be measured and substituted, and the reconciliation
recorded so the requirement reads as discharged rather than as unmet.
**Source:** 160-03-SUMMARY.md, 160-04-SUMMARY.md

### `main..HEAD` is 991 commits, not the 46 the plan recorded
**Impact:** One of five planning-time figures out of thirteen that had moved, and a reminder that the
integration branch has diverged from `main` by two orders of magnitude more than the planning documents
assumed.
**Source:** 160-04-SUMMARY.md

### The component-listing delta was +7/−1, not the predicted +4/0, and directory churn was 13/13/11, not 2/3/2
Research predicted `MultipleTextInput` among the additions; Phase 159 had replaced that component with
four `parts/*Part` files, so the predicted name never appeared in the listing at all.

**Impact:** Re-deriving rather than trusting is what surfaced the difference. The churn figure also
changed how the drift-guard `targets:` decision reads — three high-churn directories, inside the band
the corpus already accepts for `apps/supabase` (79).
**Source:** 160-04-SUMMARY.md, 160-05-SUMMARY.md

### Regenerating the docs turned `yarn lint:check` red
Phase 152 had repaired `navigation.config.ts`'s three-line header but not `generateTypeScript()` in the
generator that writes it. Nothing had regenerated since, so the loop stayed latent for eight phases.

**Impact:** A guard-defeating loop that would have re-broken lint on every future docs regeneration,
closed at source.
**Source:** 160-05-SUMMARY.md

### The `CLAUDE.md` rule has 39 in-code references across 32 files
Source comments, type-file JSDoc, route components and three test files all cite the Context
Destructuring Rule by name and name `CLAUDE.md` as where it lives.

**Impact:** Turned a one-line "remove the section" task into a relocation constrained by 32 files. The
heading-kept resolution cost nothing outside `files_modified`; repointing 32 files was the alternative.
The carve-out also turned out to be already machine-enforced by
`apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts` (Phase 159, spike 024) — which is
itself one of the 39.
**Source:** 160-05-SUMMARY.md, 160-06-SUMMARY.md

### Three more stale factual claims fell out of the routing rewrite, none of them planned
The Edge Functions were named as *preregister, send-email, admin* (two of three do not exist); `lib/i18n`
was described as `sveltekit-i18n` (the tree uses Paraglide); and "pre-registration via Supabase Edge
Function" named no function (it is `invite-candidate`).

**Impact:** All three were false against the live tree and were found only because the sections carrying
them were being rewritten for another reason.
**Source:** 160-06-SUMMARY.md

### `sources/` held 59 non-Markdown files with no counterpart anywhere
43 `.svelte` harnesses, 15 `.svelte.ts` implementations and 1 codemod script — 186,701 B, zero
counterparts under `.planning/spikes/`, and by the same three git facts no copy in `main`'s history
either.

**Impact:** The single most consequential finding of the phase. Both the recommendation and the runner-up
were worded "delete the `sources/` directory". Had the checkpoint gone to `delete-whole`, the loss would
have been 301,737 B, not the 115,036 B the record quantified.
**Source:** 160-07-SUMMARY.md

### Two line anchors pointing past the end of a 341-line file — committed by this phase
`CLAUDE.md:392` and `CLAUDE.md:432`, produced by this phase trimming the file by 96 lines without
re-deriving the anchors pointing into it.

**Impact:** The exact defect class the phase exists to remove, committed by the phase itself, and
structurally invisible to the guard the phase had just shipped. Found by the reflexive 52-listing
re-check, and closed as check 3c.
**Source:** 160-08-SUMMARY.md

### The corpus record's own hop-by-hop violation account did not survive the instrument built to score it
`.claude/skills/README.md` described a three-hop chain; the checker reproduces a violation in the same
skill but at a different hop count and granularity, and the record's own hop-counting would have
condemned every skill in the tree.

**Impact:** Corrected in place with both reasons. A record that survives its own measurement unaltered
was not measured.
**Source:** 160-09-SUMMARY.md

### The first pointer definition did not discriminate at all
Counting every path citation scored `CLAUDE.md` at 62.0% and `filters/extension-patterns.md` at 50.5% —
above every genuine index in the corpus.

**Impact:** Forced the narrower definition (a hop is a pointer to a corpus Markdown document). Both the
rejected attempt and its measured numbers are recorded in the script's header, because a definition
arrived at by measurement is worth more than one asserted.
**Source:** 160-09-SUMMARY.md

### Both guards this phase shipped returned exit 0 when they were broken
A deliberately broken build of each exited 0 before the fix and 1 after.

**Impact:** Discovered only after all nine plans had closed, by the phase's own code-review gate. The
routing guard additionally miscounted `[[electionTab]]` route segments and truncated `(content)/+page.md`
citations to `page.md` as routing hops — inflating the very densities its threshold methodology was
derived from (sections classified 80 → 77, no verdict changed).
**Source:** 160-REVIEW.md, commit `b25d8d26c`

### A Markdown-only documentation trim broke a unit test
`e2eDocPreconditionGate.test.ts` allowlists two `CLAUDE.md` lines by verbatim text; Plan 06's reword made
both entries match zero occurrences while the new wordings read as unaccounted-for mentions.

**Impact:** Two failures in both directions of the same guard, caught by the phase's own regression gate
and not by CI — which `paths-ignore: "**.md"` prevents from ever firing on such a change. Filed as a
standing blind spot.
**Source:** commit `1a960b39e`, commit `a0ec9968d`
