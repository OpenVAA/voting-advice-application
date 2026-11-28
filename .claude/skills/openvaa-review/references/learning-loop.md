# Learning loop: `/openvaa-review learn`

Reviews are only worth running if each one makes the next PR cleaner **before** it reaches review, so findings should move upstream over time:

1. A mistake caught in human review should next be caught by `.agents/code-review-checklist.md`, which `/openvaa-pr` applies before review.
2. After that, it should be caught by the project skill the author's agent loads while writing the code (`components`, `data`, `matching`, `filters`, `database`), or by a CLAUDE.md invariant.
3. Meanwhile the review itself should get quieter and more accurate as reviewers mark its false positives.

The PR comments are the log. Each review embeds an `openvaa-review-data` JSON block, and reviewers tick feedback boxes in the same comment. Nothing is written to the repo during a review, so concurrent reviews never conflict. Local and plan reviews carry no feedback block and are not harvested.

## 1. Harvest

```bash
python3 .claude/skills/openvaa-review/scripts/harvest.py --out $RUN/harvest.json --limit 60
```

The script prints a per-criterion table with these columns:

- distinct PRs;
- times raised;
- critical count;
- false positives (ticked by a reviewer);
- refuted (killed by the verifier);
- likely addressed (the author changed the cited files after the review).

`harvest.json` also carries the human reviewers' own comments on those PRs.

## 2. Decide, per criterion

| Signal | Action |
| --- | --- |
| Confirmed in **≥3 distinct PRs**, mostly addressed, not already a checklist item | **Promote to the checklist.** |
| **Any `critical`** finding that was addressed and isn't covered by a checklist item | **Promote to the checklist**, even after one occurrence. |
| Already a checklist item (`checklist_rule` set) yet still reaching human review | The item is too vague to apply pre-review. **Sharpen it** with the concrete detection hint the lens used. If it is mechanical, propose an `assert:*` guard or a lint rule instead, and check the guard against the tests lens's `tst-invariant-blocks-change` before adding it. |
| Promoted to the checklist earlier and still recurring | **Promote to the owning skill** (the lens file's *Promote to* line), so the author's own agent avoids the mistake while writing. |
| False-positive rate **≥ 1/3** over ≥3 raises, or refuted ≥3 times | **Calibrate.** Add a one-line "not a finding" note to `.claude/skills/openvaa-review/references/calibration.md` under the lens, with the reason and the count. If the criterion itself is wrong, reword it in the lens file. |
| Human reviewer comments that recur and match no criterion | **New criterion.** Add it to the best-fitting lens file with a slug. If no lens fits, propose a new lens file to the user. |
| `<lens>.other:<slug>` findings that cluster | Give the cluster a real slug in the lens file. |

Distil the principle and don't paste the incident. A checklist item must be applicable by someone who never saw the PR it came from. Follow the checklist's existing style: one `- [ ]` line under the section it belongs to (§ Supabase Backend, § Supabase Adapter, § Edge Functions, or a new section), stating the rule and, where it helps, the reason.

## 3. Apply on a separate branch

Never commit learnings to a branch under review, or to a `ship-review-stack` slice. `origin/main` may not carry `.claude/skills/` yet, so ask the user which branch the learnings start from (usually the current integration branch), then:

```bash
git switch -c docs/openvaa-review-learnings-$(date +%y%m%d) <that branch>
```

- **Checklist.** Add items to the code-review checklist under the section they belong to. The checklist is unnumbered, so findings cite items by section and text.
- **Skills.** Edit the owning skill's SKILL.md or reference file in its own style, keeping it short. A one-line rule with a pointer to the checklist section beats a paragraph. When a skill gains a rule about a directory it does not yet list in `targets:`, add the directory, following the corpus README's § Adding a skill.
- **CLAUDE.md.** Only for a new invariant of the same weight as the existing ones, and only with the user's explicit agreement.
- **This skill.** Update the calibration notes, the lens files and their criteria. If a whole lens has produced nothing useful across many PRs, say so to the user. Removing it is their call.
- Run `yarn format` and check that `git diff --stat` shows only the touched files.

Commit the docs in logical groups (`docs: sharpen the checklist's RLS items`, `docs: calibrate openvaa-review`). Check that no commit is empty (`git rev-parse HEAD^{tree}` differs from `HEAD~1^{tree}`). Then show the user the diff and the evidence table, and ask before pushing or opening a PR: these rules shape how every contributor's agent writes code, so a person approves them.

## 4. Report

Show the per-criterion table, what was promoted where (with the evidence PRs), what was calibrated, and what was left alone and why.

<!-- skill-link-allow: harvest.json -->
<!-- skill-link-allow: origin/main -->
