# OpenVAA agent skills — the recorded corpus decision

> **Reference for a reader of `.claude/skills/` who wants to know why this corpus is shaped the way it is, and for an author about to add a skill.**

This directory holds the agent-facing skill corpus. Its shape is a decision, not an accident: it was measured against a cited threshold, judged, and recorded here rather than in `.planning/`, because `.planning/` is not on `main` and is stripped by the PR-branch tooling — a reader outside this branch would never see it. `packages/README.md` is the repo's precedent for "the decision lives with the corpus it describes"; this file copies its shape.

## The corpus

Measured at commit `e8052177c`, **2026-09-13**, on the working tree — before this phase's deletions land. Every figure below is an exact byte count from the command in its own row; re-run the command to check it rather than trusting the number.

**Every command excludes this file** (`-not -path '.claude/skills/README.md'`). A record whose own bytes are inside the total it reports cannot be re-run to the same number, because writing the next paragraph changes it. The exclusion is what makes these figures reproducible rather than a snapshot.

| Corpus slice | Files | Bytes | Reproducing command |
| --- | ---: | ---: | --- |
| All Markdown under `.claude/skills` | 42 | 488,843 | `find .claude/skills -name '*.md' -not -path '.claude/skills/README.md' \| wc -l` and the same `find` with `-exec cat {} + \| wc -c` |
| — of which the generated `spike-findings-voting-advice-application-gsd` skill | 26 | 288,325 | `find .claude/skills/spike-findings-voting-advice-application-gsd -name '*.md' \| wc -l` and the same `-exec cat {} + \| wc -c` pair |
| Hand-authored remainder | 16 | 200,518 | `find .claude/skills -name '*.md' -not -path '*/spike-findings-voting-advice-application-gsd/*' -not -path '.claude/skills/README.md' -exec cat {} + \| wc -c` |
| `CLAUDE.md` | 1 | 30,555 | `wc -c CLAUDE.md` |

Two derived figures, each labelled as derived and named by its operands:

- **Generated share of the whole corpus: 58.98%** — derived, 288,325 ÷ 488,843.
- **Hand-authored share: 41.02%** — derived, 200,518 ÷ 488,843. The two shares are complements of the same pair of operands, so a re-measurement that moves one moves the other.

**Both sides of this phase's deletions are recorded**, so a reader re-running the commands after the deletion plan lands can tell "the corpus changed as this phase said it would" from "the corpus has drifted since". This phase deleted **one** skill directory and **part of** a second:

- `.claude/skills/architect/` — the whole directory, 1 file, 813 B, its description folded into `CLAUDE.md § Skill Routing`.
- 17 duplicate spike write-ups **inside** `.claude/skills/spike-findings-voting-advice-application-gsd/`, 173,289 B. **The skill itself survives.** The decision checkpoint that gated this chose the recorded runner-up, `delete-sources-only`, over the recommended `delete-whole` — see § Judgement 1 for what was removed, what was kept, and why the recommendation was not followed.

<!-- skill-link-allow: .claude/skills/architect/ -->

The marker above exempts one path in the paragraph before it. `.claude/skills/architect/` is named here precisely *because* it no longer exists — a record of a deletion has to be able to say what it deleted, and the link guard cannot tell that citation apart from a pointer an agent is meant to follow. It is the one citation in this file that is deliberately dangling.

**The projection this table originally carried was unreachable, and is corrected here rather than left standing.** It read "post-deletion (expected) 15 files / 199,705 B", derived by subtracting both deletions from the `e8052177c` figures. But `e8052177c` **predates the commits of the two plans that wrote this file and grew the `components` skill**: after it, `.claude/skills/components/context-reactivity.md` was added (9,097 B) and `.claude/skills/components/SKILL.md` grew from 917 B to 9,504 B. A projection that subtracts from a baseline while additions are still landing against it cannot come true. The measured figures below replace it.

| | Files | Bytes | When |
| --- | ---: | ---: | --- |
| Pre-deletion | 42 | 488,843 | measured at `e8052177c` |
| Pre-deletion, restated | 43 | 506,527 | the same tree plus the two `components` additions above, i.e. what this phase's deletions actually started from |
| Removed: `.claude/skills/architect/` | 1 | 813 | deleted |
| Removed: 17 `sources/*/README.md` duplicate write-ups | 17 | 173,289 | deleted — see § Judgement 1 |
| Post-deletion (measured, not projected) | 25 | 333,557 | measured at the deletion plan's final commit |
| **After the ownership-map and listing re-check plan** | **25** | **336,488** | measured at this plan's final commit — the current figure |

Reproduce the last row with the whole-corpus `find` pair above, its `-not -path '.claude/skills/README.md'` exclusion intact. Any other pair of numbers is drift that postdates this phase, and this record is stale rather than wrong.

**The last two rows differ by 2,931 B, and the difference is named rather than left to be guessed.** The re-check plan added text and removed none: `.claude/skills/BOUNDARIES.md` 11,951 → 14,724 B (+2,773 — eight rows re-homed off the deleted skill, five paths corrected, one row removed, and the runes-era rewrite), `.claude/skills/data/object-model.md` +58 B and `.claude/skills/components/SKILL.md` +100 B (two listing corrections found by the re-check itself). 2,773 + 58 + 100 = 2,931. The file count does not move because nothing was created or deleted.

**The rows do not subtract to the total, and that is not an error.** 506,527 − 813 − 173,289 = 332,425, which is 1,132 B short of the measured 333,557. The difference is text this phase *added* to the surviving skill while removing the copies: `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` grew 29,487 → 30,574 B (+1,087, the rewritten § *Source Files*) and its `.claude/skills/spike-findings-voting-advice-application-gsd/references/` grew 85,549 → 85,594 B (+45, five citations repointed from `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` to `.planning/spikes/`). Stated so a reader who checks the arithmetic finds the answer here instead of concluding the record is wrong.

**One caveat that the Markdown-only figures hide, and that matters if you are sizing this corpus.** Every count in this file measures `*.md` only. The spike-findings skill's `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` directory also holds **59 non-Markdown files — 186,701 B** of Svelte harnesses, rune context and store implementations, and one codemod script — which no `find … -name '*.md'` in this file has ever counted. The true on-disk size of `.claude/skills/` is therefore about 523,000 B, not 336,488 B. The Markdown-only convention is kept because it is what every figure here was originally derived with and changing it would silently invalidate the comparisons; the caveat is stated so the number is not mistaken for the whole.

`CLAUDE.md`'s figure moves within this phase by design — it was edited before this measurement and is trimmed after it — which is why the commit anchor above is part of the measurement and not decoration.

### Last verified

**Commit `9837cd9a7`, 2026-09-14** — the routing-conformance plan, which added § *Conformance record* below. Newest first; the previous measurement is kept beneath rather than overwritten, so a reader can tell "the corpus changed as the phase said" from "the corpus has drifted".

| Gate | Result |
| --- | --- |
| `bash .claude/scripts/audit-skill-routing.sh` | `Check A: files classified 27 (index 0, content 27)  sections classified 80 (index 8, too small to classify 7)  routing layers 8  depth-1 destinations 18` / `Check B: descriptions 7  shared stems 1  skills implicated 4` / `Violations: 5` — exit 1 by design. Both failures are filed, not unowned; see § *Conformance record*. |
| `bash .claude/scripts/audit-skill-links.sh` | `Checked: 636  Dangling: 207  Skipped: 191` — exit 1 by design. **Dangling did not move from the 207 the previous plan recorded, and a token-level diff of the dangling set against the inbound set introduces nothing.** `Checked:` rose because this plan wrote new citations, including the ones in § *Conformance record*; this guard, unlike the byte counts above, does not exclude this file. The guard also gained check 3c in this plan — a line-range test for bare-filename citations — which found nothing to repair on this tree, by design. |
| `yarn lint:check` | exit 0, read from `$?` on the command itself and never through a pipe |
| `yarn workspace @openvaa/docs validate:links` | exit 0 — 0 fixed, **0 broken** |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/160-09-phase-gate --no-db-reset` | **155 passed, 0 failed, 0 skipped, 0 flaky, 0 did-not-run**, Playwright exit 0, wrapper exit 0, `preflight-failures 0 / preflight-successes 1`, 0 retries, 6 workers, 10.4m. Run at HEAD `9837cd9a7`; the only change after it is this Markdown record. |
| `bash .claude/scripts/audit-skill-drift.sh` | **Context, never evidence** — `Checked: 6  Drifted: 1  Skipped: 1`. Same caveat as the row below: the guard baselines each skill on the last commit touching its directory, so this phase's commits reset five of the six to clean. The one `DRIFT` is `ship-review-stack` against `.claude/scripts`, which this plan added a file to and which belongs to Phase 153 by `O4`. |

The served-application preflight is confirmed rather than assumed here too: `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)`, and the wrapper spawned its own server on port 5273 against the project id the suite seeds.

---

**Commit `f8e7b4b07`, 2026-09-13.** At that commit the corpus figures above and the judgements below were re-derived rather than carried, and the repository's gates were green:

| Gate | Result |
| --- | --- |
| `bash .claude/scripts/audit-skill-links.sh` | `Checked: 630  Dangling: 207  Skipped: 173` — exit 1 by design, and **zero of the 207 tokens was introduced by this phase**; a token-level diff against the pre-change set is empty. The residue is the corpus's package-relative citation habit, plus the `database` skill's schema filenames, filed as a todo. Unlike the byte counts above, this guard does **not** exclude this file, so writing this very table moved `Checked:` to `631` — the dangling figure, which is the one that matters, did not move. |
| `yarn workspace @openvaa/docs validate:links` | exit 0 — 198 files, 172 internal links, 0 broken |
| `yarn lint:check` | exit 0, read from `$?` on the command itself and never through a pipe |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/160-08-phase-gate --no-db-reset` | **155 passed, 0 failed, 0 skipped, 0 flaky, 0 did-not-run**, Playwright exit 0, wrapper exit 0, `preflight-failures 0 / preflight-successes 1`, 0 retries, 6 workers, 10m 27s |
| `bash .claude/scripts/audit-skill-drift.sh` | **Recorded as context, never as evidence.** `Checked: 6  Drifted: 1  Skipped: 1` — the one drift is `ship-review-stack` against `.claude/scripts`, which belongs to Phase 153 by `O4`. Its exit code cannot certify this phase: the guard baselines each skill on the last commit touching that skill's directory, so a phase's own commits reset its skills to clean whether or not any listing was re-checked. |

The served-application preflight is confirmed rather than assumed: the run's own line reads `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)`, i.e. the served page came from this checkout.

**A date is stated because this file's own closing rule demands it.** A record whose verification date is unknown reads as an assurance it cannot back. If you are reading this well after the date above, re-run the four commands rather than trusting the rows.

## The disclosure threshold

The threshold this corpus was judged against, quoted from the review triage rather than from the papers (`.planning/PRE-SHIP-REVIEW-TRIAGE.md:348`, PR #874):

> disclosure only pays off once the corpus exceeds what the agent can navigate by direct reading … On a single-document scale, a strong harness that greps and reads on its own gets near-zero benefit from a curated index … The crossover comes when the corpus grows past what direct navigation can handle (multi-repo setups, large internal doc collections)

**Neither paper was read directly.** The triage's paraphrase is the only source this record has, and no claim about either paper's methodology is made here beyond the quoted words.

**Verdict: this corpus is below the crossover, and nothing is restructured.** 200,518 B of hand-authored skills across 16 files, in one repository, is navigable by direct reading; the crossover the triage names is multi-repo or large-doc-collection scale, which this is not.

**What would change the verdict — the boundary, not just the side of it.** The verdict flips on either of two conditions, and a reader hitting one should invest in a flat index (and still never go deeper than one level):

- **Structural:** the corpus stops describing a single repository. A multi-repo skill set is the case the triage names explicitly, and it flips the verdict regardless of byte count.
- **Numeric:** roughly an order of magnitude of growth would put the corpus at the crossover. At 199,705 B post-deletion the whole hand-authored corpus is about **49,900 tokens** — derived, 199,705 ÷ 4 on the conventional chars-per-token ratio — which a harness can read end to end in one pass. A corpus near 2,000,000 B (≈ 500,000 tokens, ~150 files) cannot be, and that is where curation starts buying something. The figure to watch is the whole-corpus byte total above; a corpus that has merely doubled has not crossed, and this section should not be rewritten until it has.

Two alternatives were considered and rejected:

- **Restructure into more, smaller skills anyway.** The same finding says this buys nothing below the crossover. Effort spent reorganising the interior is effort not spent on the description layer, where selection actually happens.
- **Hand-flatten the generated `spike-findings` skill.** It is machine-generated by `/gsd-spike --wrap-up`; a hand-flatten is undone by the next wrap-up run. **This objection now stands against the executed outcome, and is recorded rather than resolved.** § Judgement 1 originally disposed of it by deleting the skill; the executed disposition keeps the skill, so its § *Source Files* section is a hand edit to generated content that the next wrap-up run would overwrite. Whatever Plan 09 does to flatten the surviving routing chain inherits the same expiry, and the durable fix is to teach the generator rather than to re-edit the output.

## The routing rule: one level, never two

The forward-looking rule this corpus adopts, quoted from the same triage passage (`.planning/PRE-SHIP-REVIEW-TRIAGE.md:348`):

> A SKILL.md's frontmatter description is the routing layer; the body should either contain the instructions or point directly at concrete resource files (references/api.md, scripts/build.py) — not at a second index inside the skill.

Stated as two clauses, each mechanically checkable:

- **Depth.** A skill's frontmatter `description` is the routing layer. Its body either contains the instructions or points **directly** at concrete resource files — never at a second file whose own body is predominantly pointers and which points onward. The same applies to `CLAUDE.md § Skill Routing`: it reaches content in one hop, never an intermediate "overview" file whose only job is to point somewhere else. (To verify a skill by hand: open its `SKILL.md`, follow each pointer in the body once, and confirm you landed on content rather than on another table of pointers.)
- **Discriminativeness.** A `description` earns its place by saying when to use this skill *rather than its neighbours*. A stem shared across most of the corpus carries no routing signal, because selection happens once at the description layer. (To verify: `for f in .claude/skills/*/SKILL.md; do awk '/^description:/{print FILENAME; print; exit}' "$f"; done` and read the opening clauses side by side.)

**The repo's live violations — one per clause, named rather than counted.** The word "single" would be wrong here: the depth clause has exactly one violation, the discriminativeness clause has exactly one, and they are different artifacts.

**Depth — one violation, the generated spike-findings skill.** The chain, hop by hop, as measured at `e8052177c`:

1. `CLAUDE.md:319` § Skill Routing names the skill and routes to it — hop 1, legitimate. (It was `:432` at `e8052177c`; the section moved when this phase trimmed the file, and the anchor is re-derived here rather than left pointing past the end of a 341-line file.)
2. `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md:149` § *Feature Areas* is a table of 8 rows pointing into `.claude/skills/spike-findings-voting-advice-application-gsd/references/` — hop 2, **a second index**.
3. The same file's `:162` § *Source Files* was a second table pointing into `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` (17 files) — hop 3.

Eight reference files and seventeen source files sat behind those two tables; reaching any of them from `CLAUDE.md` cost three routing decisions where the rule allows one. Every other skill in the tree routes in one hop — `.claude/skills/data/SKILL.md` points straight at `object-model.md` and `extension-patterns.md`, and so on.

**Status after this phase: hop 3 is gone, the violation is live, and the hop-counting above is corrected rather than left standing.** § *Source Files* is no longer an index — it names `.planning/spikes/` in prose and the seventeen duplicate write-ups behind it are deleted (§ Judgement 1). **The earlier wording here — that the violation "is not fixed in place, it is removed with the skill" — was written for the `delete-whole` recommendation and is false of the executed outcome.**

**Two things the instrument changed about the account above, and they are recorded because a record that survives its own measurement unaltered was not measured.** `.claude/scripts/audit-skill-routing.sh` was built to score this rule and it does not reproduce the chain as numbered:

- **Step 1 is not a hop.** This rule's own first sentence is "a skill's frontmatter `description` is the routing layer", so `CLAUDE.md § Skill Routing` naming a skill is the selection event, not a routing decision inside it. Counting it as hop 1 makes `CLAUDE.md → Skill("data") → data/SKILL.md → object-model.md` three hops too — condemning the very shape the sentence after it blesses, and every skill in the tree with it. The auditor counts it as depth 0, which is why six of the seven skills score OK.
- **The violation is real, but it is smaller and differently shaped than "hop 2".** § *Feature Areas* pointing at eight concrete resource files is the allowed shape — a body pointing **directly** at resource files. What actually breaches the rule is that the skill carries a **second** index over the same eight (`SKILL.md:188` § *Production Landing Map*, 26 pointer lines of 36, re-indexing them through `[[wiki-alias]]` links), and that three of the reference files hand the reader another index once they arrive — `.claude/skills/spike-findings-voting-advice-application-gsd/references/migration-inventory-and-order.md:212` § *Related* is 6 pointer lines of 6.

The measured verdict, its anchors, its cost and the reason it is not fixed here are filed at `.planning/todos/pending/2026-09-14-spike-findings-skill-routing-depth.md`. The short reason: both content-preserving flattenings — promoting the 85,594 B of digests into a ~116,000 B `SKILL.md`, or splitting them into eight skills — are structural work, and both are undone by the next `/gsd-spike --wrap-up`, which is the objection this file already records against hand-editing generated content. Until the generator is taught, this corpus asserts a one-level rule while carrying one recorded exception, and a reader is entitled to know that from this file rather than by measuring.

**Discriminativeness — one violation, the shared description stem.** Re-derived on 2026-09-13, after this phase deleted `architect`: **four of the seven** live `SKILL.md` descriptions open with the identical stem `Domain expert for the` — `data`, `database`, `filters`, `matching`. The other three (`components`, `ship-review-stack`, the spike-findings skill) open differently. A stem a majority of the corpus shares is a routing layer that routes nowhere. The discriminative work is in the clause *after* the stem, and it should start sooner.

Two earlier figures for this same count are in circulation and **both are superseded**: six of eight, recorded here at `e8052177c`, counted `architect` (deleted by this phase) and `components` (whose description this phase rewrote, so it no longer carries the stem); five of eight was measured between those two changes. Neither is worth carrying forward — re-run the verification command in the Discriminativeness clause above, which takes a second and cannot go stale.

**Both clauses have an instrument, not just a rule.** `.claude/scripts/audit-skill-routing.sh` landed in this phase alongside `.claude/scripts/audit-skill-links.sh` and `.claude/scripts/audit-skill-drift.sh`, with the same argument, output and exit contract. Its **Check A** scores the depth clause, printing the measured pointer density beside every file and section it classified; its **Check B** scores the discriminativeness clause, flagging an opening stem shared by three or more skills. Both were shown red against a throwaway fixture before being trusted green against the corpus. A rule asserted with no instrument is the exact shape of claim this phase exists to stop shipping — so where this file records a decision, it names the check that scores it, and § *Conformance record* below is that score.

**One deliberate waiver, stated where a reader meets it.** Check A reaches this file in one hop from `CLAUDE.md § Skill Routing` and would classify two of its sections as indexes that point onward. They are not routes: this is a record, and its citations are the evidence for what it records — which is exactly what that entry in `CLAUDE.md` says, "read it before writing a new skill — not to find an existing one". The marker below waives the verdict for this file only. It does not waive the measurement: the auditor still prints this file's densities, so anyone can disagree with the waiver without re-deriving it.

<!-- skill-routing-allow: index -->

### Conformance record

**Measured at commit `9837cd9a7`, 2026-09-14**, by `.claude/scripts/audit-skill-routing.sh` over
the corpus as this phase leaves it — after plan 07's deletions, not before them. Every figure below
carries the command that reproduces it; re-run the command rather than trusting the number.

Whole-corpus run, both checks:

```bash
bash .claude/scripts/audit-skill-routing.sh ; echo "exit=$?"
```

| Skill directory | Check A — routing depth | Check B — description | Reproduce just this one |
| --- | --- | --- | --- |
| `components` | **OK** — 1 destination at depth 1, not an index | **OK** — opens `frontend svelte component work in` | `bash .claude/scripts/audit-skill-routing.sh components` |
| `data` | **OK** — 2 destinations at depth 1, neither an index | **VIOLATION** — shares the stem `domain expert for the openvaa` | `bash .claude/scripts/audit-skill-routing.sh data` |
| `database` | **OK** — 3 destinations at depth 1, none an index | **VIOLATION** — same stem | `bash .claude/scripts/audit-skill-routing.sh database` |
| `filters` | **OK** — 1 destination at depth 1, not an index | **VIOLATION** — same stem | `bash .claude/scripts/audit-skill-routing.sh filters` |
| `matching` | **OK** — 2 destinations at depth 1, neither an index | **VIOLATION** — same stem | `bash .claude/scripts/audit-skill-routing.sh matching` |
| `ship-review-stack` | **OK** — 0 corpus destinations; the body carries its own instructions | **OK** — opens `procedure for taking a large` | `bash .claude/scripts/audit-skill-routing.sh ship-review-stack` |
| `spike-findings-voting-advice-application-gsd` | **VIOLATION** — 2 index sections in the body, plus 4 depth-2 chains through 3 of its reference files | **OK** — opens `implementation blueprint from spike experiments` | `bash .claude/scripts/audit-skill-routing.sh spike-findings-voting-advice-application-gsd` |
| `CLAUDE.md § Skill Routing` (not a directory, but a routing layer) | **OK, by a stated waiver** — its one file destination is this record; see the marker above | n/a — it has no `description` | `bash .claude/scripts/audit-skill-routing.sh CLAUDE.md` |

Six of seven skill directories pass Check A and three of seven pass Check B. Both failures are
filed, neither is fixed here, and each filing carries its `file:line` anchors and what fixing it
would cost: `.planning/todos/pending/2026-09-14-spike-findings-skill-routing-depth.md` and
`.planning/todos/pending/2026-09-14-non-discriminative-skill-descriptions.md`.

**The corpus the verdicts were scored against, with the pre-deletion figures beside them** so the
delta across plan 07 is readable here rather than by diffing two records. Plan 04's row is the
`e8052177c` measurement from § *The corpus* above; this plan's row is re-derived, not copied.

| | Skill directories | `.md` files | Bytes | Reproducing command |
| --- | ---: | ---: | ---: | --- |
| Plan 04, pre-deletion, at `e8052177c` | 8 | 42 | 488,843 | `git ls-tree e8052177c .claude/skills/ \| awk '$2=="tree"' \| wc -l`, and the `find` pair in § *The corpus* |
| **This plan, post-deletion, at `9837cd9a7`** | **7** | **25** | **336,488** | `find .claude/skills -mindepth 1 -maxdepth 1 -type d \| wc -l` · `find .claude/skills -name '*.md' -not -path '.claude/skills/README.md' \| wc -l` · the same `find` with `-exec cat {} + \| wc -c` |
| Delta | −1 | −17 | −152,355 | derived |

The `.md` and byte columns keep this file's standing exclusion of itself
(`-not -path '.claude/skills/README.md'`), which is why writing this very section did not move
them. `CLAUDE.md` at the same commit is **28,038 B across 341 lines** (`wc -c CLAUDE.md`,
`wc -l CLAUDE.md`) — the figure the § *The corpus* table records as 30,555 B predates this phase's
trim, which is what its commit anchor is there to say.

**What would change a verdict — the boundary, not just the side of it.** The one-level rule is a
ceiling, so the useful statement is what a future skill would have to do to breach it:

- **Check A flips to VIOLATION** the moment a `SKILL.md` body grows a **second** table of pointers
  over the same resource files, or the moment a resource file it points at grows a `## Related`
  block linking three or more siblings. Both are how the generated spike skill fails today, and
  both are one edit away for any skill. The audit then names the layer, the section and the onward
  count.
- **Check A stays OK** when a body points at as many concrete resource files as it likes from a
  single place — `database` points at three and passes. Fan-out is not depth.
- **Check B flips to VIOLATION** the moment a third skill opens its `description` with the same two
  or more words as two others. Two sharers are not reported; three are. Adding one skill whose
  description opens `Domain expert for the …` would not change today's verdict, because that stem
  already has four sharers; adding a skill that opens like `components` and `ship-review-stack`
  would not either. A new shared opening is what moves it.

**One thing this record deliberately does not claim.** Check A's **file-level** verdicts are
advisory, not binding. The measured file-level pointer-density distribution over these 27 files runs
from 23.8% to zero in one flat monotone line whose widest gap is 5.5 points, so no file-level
threshold is derivable from it and at 50% no file classifies as an index at all. The binding
verdicts above are the **section-level** ones, and the auditor's own header states the distribution,
the 50% threshold's derivation from the word "predominantly", and a measured sweep showing the one
VIOLATION is reported at every threshold from 25% to 100%. Read it before arguing with a verdict.

**Neither CI nor the drift guard is evidence for anything in this record.** `.github/workflows/main.yaml`
carries `paths-ignore: "**.md"` on every trigger and does not trigger on this branch at all, so an
all-Markdown phase produces no run to cite. And `.claude/scripts/audit-skill-drift.sh` baselines
each skill on the last commit touching that skill's directory, so this phase's own commits reset
those baselines — a green drift run after a phase that edited the skills says only that the phase
edited them. Every figure here was produced locally by the command in its own row.

## Judgements

Four judgements shaped this corpus. Each states its reason, not only its existence, so a future maintainer can re-evaluate it rather than merely inherit it. Every figure below was re-derived at `e8052177c` on 2026-09-13.

### Judgement 1 — the generated `spike-findings-voting-advice-application-gsd` skill: recommended DELETE, executed `delete-sources-only`

> **Status: executed outcome, 2026-09-13.** The recommendation below was **`delete-whole`**. The outcome, chosen by the operator at this phase's decision checkpoint, was the recorded runner-up: **`delete-sources-only`**. The recommendation was not followed, and the reason is recorded under § *Why the outcome differs from the recommendation* below — read it, because a verdict that changed without its argument changing is the thing this section exists to prevent.

**What was actually done, measured at execution:**

- **Removed: the 17 duplicate write-ups** `sources/<spike-id>/README.md`, 173,289 B, after each was re-checked against its `.planning/spikes/` counterpart (13 matched on the punctuation-stripped checksum, 4 — 008, 009, 013, 016 — on the sorted word bag, 0 unmatched; the finding below reproduced exactly).
- **Kept: the 115,036 B of unique synthesis** — `SKILL.md` and the eight `.claude/skills/spike-findings-voting-advice-application-gsd/references/` files — which is the whole point of this disposition.
- **Kept, and NOT anticipated by either the recommendation or the runner-up as written: the 59 non-Markdown files under `.claude/skills/spike-findings-voting-advice-application-gsd/sources/`**, 186,701 B of Svelte harnesses, rune context and store implementations, and one codemod script. Every byte-comparison behind the "`.claude/skills/spike-findings-voting-advice-application-gsd/sources/` is pure duplication" finding covered `*.md` only. Re-checked at execution against `.planning/spikes/`: **0 of the 59 have a counterpart there** — `.planning/spikes/` holds write-ups and essentially nothing else (30 `.md`, 2 `.ts`, 1 `.svelte` across 25 directories). Deleting `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` wholesale, as both the recommendation and the runner-up were written to do, would have destroyed 186,701 B of content with no other copy in the working tree **and no copy in the default branch's history either**, for the same three reasons the git-history basis is rejected below. The one near-miss, `spike-009-store-codemod.mjs`, also exists at `.planning/archive/` but is **not** byte-identical, so it is not a copy.
- **Repointed** five `sources/*/README.md` citations in `.claude/skills/spike-findings-voting-advice-application-gsd/references/` at `.planning/spikes/*/README.md`, and rewrote § *Source Files* in `SKILL.md` to say which half lives where.

**The corpus-wide dangling-citation count fell 327 → 212. Only 5 of that 115 is repair.** 110 of it is the removal of files that were themselves carrying dangling citations — deletion, not hygiene. The 5 are the repointed citations above, which now resolve. Recorded with the subtraction made explicit because the headline number invites exactly the opposite reading.

#### Why the outcome differs from the recommendation

The recommendation rejected `delete-sources-only` on two grounds: **(a)** it does not satisfy the instruction literally, and **(b)** it "leaves a two-hop chain, which still violates the one-level rule this phase asserts."

**Ground (b) was written before Plan 09 of this phase existed.** Plan 09 was added mid-phase and is chartered to score routing depth mechanically and to dispose of the surviving violation, with an explicit prohibition that flattening means **promoting or splitting, never discarding content**. That converts the runner-up's decisive defect from a permanent property of the option into scheduled work. With (b) neutralised, the comparison is between an option that destroys 115,036 B of unrecoverable unique synthesis and one that does not, and only ground (a) — literal compliance with the instruction's wording — argues for the former. The operator resolved that in favour of keeping the content.

The execution finding above strengthens the same conclusion independently: the amount of unrecoverable content at stake was not 115,036 B but **301,737 B**, once the 186,701 B of spike code that no measurement had counted is included.

**What a future maintainer should re-evaluate.** If Plan 09's flattening lands and the routing chain is genuinely one level, this disposition has paid for itself. If Plan 09 does not land, ground (b) revives and the corpus is left carrying the violation this phase asserted a rule against — which is the honest cost of this choice, and the trigger for reopening it.

---

The instruction was to remove the skill if it is not useful to maintain as skills, on the stated basis that it would remain available from git history. The recommendation below was **DELETE**, but the stated basis is false and is rejected below; a delete would have been safe, where it was safe at all, for a different reason.

**The redundancy — measured, with the method.** The skill is three parts:

| Part | Files | Bytes | Share of the skill |
| --- | ---: | ---: | ---: |
| `SKILL.md` | 1 | 29,487 | 10.23% (derived, 29,487 ÷ 288,325) |
| `.claude/skills/spike-findings-voting-advice-application-gsd/references/` | 8 | 85,549 | 29.67% (derived, 85,549 ÷ 288,325) |
| `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` — **Markdown only** | 17 | 173,289 | 60.10% (derived, 173,289 ÷ 288,325) |
| `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` — **the non-Markdown files this table never counted** | 59 | 186,701 | not in the 288,325 denominator at all |

The `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` files — 60.10% of the skill, 35.45% of the whole corpus (derived, 173,289 ÷ 488,843) — are copies of `.planning/spikes/*/README.md` carrying **zero unique wording**. Method, repeatable in two passes: first strip whitespace, table pipes, backticks, quote characters, `*`, `_` and `-` from each pair and compare checksums — **13 of the 17 match**. Then compare the remaining four as sorted bags of alphanumeric words — **all four match**, so the residue is punctuation and layout, not content. The differences that survive the first pass are Prettier reflow in one direction only: `.planning/` is formatter-ignored at `.prettierignore:37`, so the copies were reformatted on the way into the skill while their originals were not.

**The superset.** `.planning/spikes/` holds **25** spike directories; the skill wraps **17** of them (001 through 016, counting `014a` and `014b`). Spikes 017–024 are absent entirely — including `.planning/spikes/024-derived-alias-stable-ref-skip/README.md`, which is the source of the `dataRoot` `#version`-bridge carve-out this very phase relocates into the `components` skill. The skill is therefore not merely redundant: it is an incomplete snapshot that stops one spike short of the most load-bearing finding it would need to carry.

**The cost — what is genuinely lost.** `SKILL.md` (29,487 B) plus `.claude/skills/spike-findings-voting-advice-application-gsd/references/` (85,549 B) is **115,036 B** of synthesised cross-spike digest: the migration inventory and wave order, the consumer-migration codemod, the production landing map. That synthesis exists nowhere in `.planning/spikes/` and leaves the working tree with the skill. A judgement that omits its own cost is a verdict, not an argument; this is the cost, and it is accepted because the digests describe two migrations that have both already landed.

**The preservation basis — and the explicit rejection of the stated one.** Removing the 17 write-up copies is safe because **`.planning/spikes/` stays in the working tree**, is untouched by this phase, is the superset, and is the source they were generated from. It is **not** safe because the content is available from git history, and that basis is rejected here so the next reader inherits the corrected premise rather than the assumed one. The rejection is load-bearing in both directions: it is why removing the duplicates is safe **and** why removing the 59 unique spike-code files under `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` would not have been. Three measurements, all re-derived at execution:

- `git ls-tree -r main --name-only .claude/` returns exactly one path: `.claude/settings.json`. `.claude/skills/` has **never** existed on `main`.
- The skill's add commit `14afb2d80` is **not an ancestor of `main`** — `git merge-base --is-ancestor 14afb2d80 main` exits non-zero.
- The repository **squash-merges**. `main`'s recent merges carry GitHub squash signatures, and this working branch is named **integration/ship-12-squash** precisely because it is being restructured into a stacked PR set.

Together: a skill added and deleted inside a range that reaches `main` as one squashed commit never enters `main`'s history at all. The recovery path would be a pre-squash branch ref, which is not a durable artifact.

**The runner-up disposition — recorded here as the recommendation rejected it, and executed anyway.** As written, it was: delete the `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` directory only (173,289 B), keep `SKILL.md` and the reference files beside it, and repoint § *Source Files* at `.planning/spikes/`. It removes the pure duplication and collapses the routing chain from three hops to two. The recommendation rejected it for two reasons: it does not satisfy the instruction literally, and two hops is still a violation of the rule asserted above — collapsing a chain is not removing it. Keeping 115,036 B of digest for two completed migrations is the cost it asks for in exchange.

**This is the disposition that was executed**, with one correction forced by measurement: its "delete the `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` directory" wording was written from a Markdown-only census and would have destroyed the 59 unique non-Markdown files it never counted. What was executed deletes the 17 duplicate write-ups inside `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` and keeps the directory. See the executed-outcome block at the head of this judgement for the figures and for why ground (b) no longer holds.

### Judgement 2 — `CLAUDE.md` under the ablation finding

The finding, quoted from the review triage (`.planning/PRE-SHIP-REVIEW-TRIAGE.md:362`, PR #874) rather than from the paper, which was not read:

> A 288-run ablation across Claude Code and Codex on real repositories found no measurable correctness gain from persistent context files. … The failure analysis is the useful part: agents don't fail from missing repo knowledge (they recover conventions by reading code), they fail on implementation skill — design choices, pattern selection, exact wiring. Practical takeaway: keep context files lean (build/test commands, hard conventions) and stop expecting correctness from prose; invest instead in task decomposition and verification loops (tests, oracles), which target the real failure mode.

**Decision: trim `CLAUDE.md` to commands and hard conventions, relocate the Svelte-context invariant into the `components` skill, and route to it in one hop.**

**Reasoning.** The finding prescribes a lean context file plus investment in verification — and this phase does both halves, shipping `.claude/scripts/audit-skill-links.sh` as the verification half. But the finding's own failure analysis carves out the class of knowledge it says agents *can* recover: repo conventions, recoverable by reading code. The relocated content is not in that class. A Svelte 5 referential-equality behaviour — a `$derived` alias over an identity-stable accessor silently skipping downstream notification — is not visible in the code that suffers from it; that is why this codebase re-suffered it. So it moves rather than dies, and the move is a relocation with a one-hop pointer left behind, not a deletion.

Two options were rejected: **keep as is**, which satisfies the criterion's "whatever is decided … recorded" but declines the finding outright; and **cut to commands and conventions only, essay deleted**, which discards the destructure-trap and the identity-stable-accessor carve-out — the two defects this codebase has actually re-suffered.

**What was deliberately kept.** A trim naturally loses this half, so it is recorded. All four were confirmed live at `e8052177c` before being listed:

- **The E2E hard rule — "cardinal failure" — and its no-flaky-exemption clause** (`CLAUDE.md:46`). A hard convention, not prose: it defines what "done" means for every task in the repo, and its no-exemption clause is the part a lean file would drop first.
- **The E2E preflight contract and its port escape hatch** (`CLAUDE.md:54`). A behavioural contract of the test harness — what the preflight asserts, and the two working forms of the `FRONTEND_PORT` override. A reader who does not know it reads a preflight abort as a broken suite.
- **The database-only versus full-stack script naming split** (`CLAUDE.md:80`). The `db:*` and `dev:*` prefixes mean something specific, and the block is the commands class the finding says to inline.
- **The accepted-Svelte-warning comment format** (`CLAUDE.md:292`, re-derived 2026-09-13 after this phase's own trim moved it from `:392`). A literal comment syntax an agent must emit exactly; a paraphrase of it is useless.

### Judgement 3 — the component-listing sync mechanism: link plus `targets:`, generation filed

The question was whether the docs' component listing should be maintained, linked or copied into the `components` skill, with a stated preference for automatic sync where straightforward linkage is unavailable. All four mechanisms, costed at `e8052177c`:

- **Link to the generated docs listing.** Mechanically trivial and keeps one source of truth — but the committed listing at `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md` is stale against the live tree. Re-derived with the generator's own multiline pattern (`/<!--\s*@component\s*([\s\S]*?)-->/i`, from `apps/docs/scripts/generate-component-docs.ts`) across its three configured component directories: **104 entries / 103 unique names live** against the listing's own footer figure of **98** and its 97 unique names — **7 live names absent from the listing**, and **1 listed name** (`EntityCardAction`) **no longer live**. A line-oriented grep reports 7 live components and is simply wrong; the docstring opens on the line after the comment marker.
- **Copy the listing into the skill.** Immediately a second stale copy with no guard, contradicting the stated preference for automatic sync, and adding roughly 17 KB to a corpus just concluded to be fine at its current size. **Rejected.**
- **Generate into the skill.** A small addition to the existing generator — it already writes a table of contents — but it must first repair six broken documentation script references, and wiring a generator into CI belongs to another phase. **Filed, not taken**; see the `broken-docs-script-references` entry dated 2026-08-28 under `.planning/todos/pending/`.
- **Populate the skill's drift-guard `targets:`.** The cheapest mechanism that delivers automatic sync in the sense meant: the guard fires when the source changes. **Taken.**

Two constraints on that last mechanism are deliberate choices, not accidents:

- **`targets:` entries must be directories.** `.claude/scripts/audit-skill-drift.sh:79-81` prints `(directory not found)` and skips any target that is not a directory, so a file target leaves the skill scoring clean forever. An inert audit is worse than no audit, because it reads as a passing one.
- **The guard exits non-zero on drift**, so populating `targets:` is a red-by-default posture on the next commit to any component directory. Costed against the skills that already carry targets: over the last 90 days the three component directories saw **13**, **13** and **11** commits, against **6** for `packages/data/src`, **3** for `packages/filters/src`, **2** for `packages/matching/src` and **79** for `apps/supabase`. The marginal noise sits inside the band the corpus already accepts.

**The choice: link plus `targets:`, with generation filed.** This satisfies the stated tiebreak literally — a straightforward linkage *is* available, so it is used, and automatic sync is added on top because it is cheaper than not adding it. The link is paired with a one-time regeneration of the docs listing so the linked list is current when this phase lands.

### Judgement 4 — the phase boundaries

**Skill surface versus tooling assertion — settled by operator decision `O4` (`.planning/v2.15-DISCUSSION-POINTS.md:1051`).** Stated positively in both directions. **This phase keeps** the `targets:` frontmatter *content*, because frontmatter is skill content — in practice exactly one file, `.claude/skills/components/SKILL.md`, a skill this phase rewrites anyway. **This phase keeps nothing else**: not `.claude/scripts/audit-skill-drift.sh` itself, not its portability, not its CI wiring, and not the existing drift in the `data` and `database` skills. **Phase 153 owns all of that** by `O4`: it fixes the script's portability bug, resolves the drift, and records a local `exit 0` as its evidence.

`O4` additionally files the **observed-CI-run half as blocked**, and its reason binds this phase directly. `.github/workflows/main.yaml` triggers on push to `main` or to a `ci-evidence/**` branch, and on pull-request events targeting `main`; the branch **integration/ship-12-squash** matches none of them, so the drift-guard step **cannot run from this branch at all**. The one CI run in which that step ever executed failed, aborting after its banner. And both trigger forms carry `paths-ignore: "**.md"`, so an all-Markdown phase would produce no run even on `main` or on the evidence channel. Together those three facts mean **this phase must neither wait on a CI observation nor claim one** — the same disclaimer this record already carries about the drift guard's exit code, now with the trigger configuration as its reason rather than only the baseline reset.

One more thing `O4` makes explicit, recorded because it had already propagated between agents before anyone measured it: **the claim that the drift guard is *inert* is false.** Five skills declare real target directories, and the script exits non-zero on this tree today — a fresh run at `e8052177c` reports `Checked: 5  Drifted: 1  Skipped: 3` and exits 1. It is not inert; it is red. A reader who meets the inert claim elsewhere should treat this paragraph as the correction.

**The link-integrity checker.** `.claude/scripts/audit-skill-links.sh` lands in this phase because it is a skill-hygiene tool and a sibling of the existing drift guard. Wiring it into CI belongs to **Phase 163**, which owns new CI jobs and is the only phase in this run permitted to edit `.github/workflows/main.yaml`. It therefore lands **unwired by design, not by omission** — so a later reader does not mistake an unwired guard for a forgotten one.

**The cross-skill ownership map.** Updating `.claude/skills/BOUNDARIES.md` is **in scope** for this phase. Deleting a skill without re-homing the rows that name it leaves dangling ownership claims in the one file whose entire purpose is authoritative ownership — the same defect class this phase exists to remove. Re-derived at `e8052177c`: **13 of its 85 lines** need an edit — 8 rows naming the `architect` skill this phase deletes (`:15`, `:19`, `:57`, `:58`, `:59`, `:60`, `:81`, `:83`), 5 rows whose directory paths were moved under `apps/` (`:15`–`:18`, `:21`; `:15` is in both sets), and 1 row asserting Svelte 4 component conventions on a Svelte 5 codebase (`:64`). Four of the thirteen are `components` rows — the skill this phase rewrites anyway. No row names the spike-findings skill, so its deletion needs no edit here.

## Adding a skill

- **The frontmatter `description` is the trigger, and it must be discriminative.** Write it to distinguish this skill from its neighbours, not to summarise the domain. Do not open with `Domain expert for the`; the corpus already has four of those out of seven live skills (re-derived 2026-09-13 — the figure of six predates this phase's deletion of `architect` and its rewrite of `components`) and they do not route.
- **The body points directly at concrete files.** One level. If the skill has grown a table of contents that links to sub-tables of contents, split it into more, smaller skills instead — selection is most reliable at the description layer.
- **`targets:` must be populated with repo-root-relative directories.** `.claude/scripts/audit-skill-drift.sh:79-81` prints `(directory not found)` and `continue`s for any target that is not a directory, so a **file** target is silently skipped and the skill scores clean forever — an inert audit that reads as a passing one. One `  - ` list item per directory; never an inline `[]`.
- **Cite paths repo-relative.** A path that resolves only against the package a skill documents resolves for no reader and no tool. (To verify: `bash .claude/scripts/audit-skill-links.sh <skill-name>` exits 0.)

When you add or retire a skill, update this file in the same commit — a stale list here is worse than no list, because it reads as an assurance.
