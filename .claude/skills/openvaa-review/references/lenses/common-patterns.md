# Lens: Common patterns · ID prefix `PAT`

**Applies when** the same change shape recurs **3 or more times** in the PR: the same edit applied across many files, a new idiom used at every call site, or a mechanical migration (a codemod, a rename of a prop across components, a context-access rewrite). If nothing recurs, skip the lens entirely.

The purpose is to let the reviewer review the _principle once_ instead of reading forty instances.

## List

For each pattern:

1. A name, and a one-sentence statement of the principle.
2. One representative before/after snippet (≤15 lines), or pseudocode if the instances differ in detail.
3. The instance count and the full list of locations (collapsible).
4. **Outliers**: instances that deviate from the pattern. These are where bugs hide, and the most valuable part of this lens.

## Evaluate (criterion slugs)

- `pat-outlier`: an instance that departs from the pattern without a reason.
- `pat-should-be-abstracted`: the pattern is boilerplate that a helper, a base-component prop or an API change would remove (`G-dry`). Name the helper's signature.
- `pat-incomplete`: the pattern was applied to some but not all eligible sites in the repo. Grep for the old form at `$HEAD_SHA` (`git grep -nP '<old form>' $HEAD_SHA -- apps packages tests`) and give the count left behind.

## Promote to

A recurring pattern the team _wants_ becomes a checklist item or a skill convention; a recurring _wrong_ pattern becomes a checklist item. `.agents/code-review-checklist.md`, plus whichever skill owns the layer (`components`, `data`, `database`).
