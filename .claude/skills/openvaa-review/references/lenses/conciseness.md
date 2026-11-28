# Lens: Conciseness · ID prefix `CNC`

**Applies when** the PR contains code — every PR except docs-only, tests-only, catalogue-only or planning-only ones. It asks one question about the whole PR: does its size fit its subject, and how could it be smaller?

## List

The size table from `size.json` in the run directory, which the triage script writes. It counts **effective lines**: added and removed lines in reviewable files, excluding tests, comment-only and blank lines, content (message catalogues, Markdown and the docs site, dev-seed template data, assets) and generated files. Show the total (added / removed), the count per class, and the ten largest files, then the effective lines per slice of `map.md`.

## Evaluate (criterion slugs)

- `cnc-size-vs-subject`: from the PR's purpose in `map.md`, state what the subject merits. Sketch the smallest implementation that would deliver it on the existing code — the files it would touch and a line estimate — and where you can, compare it with a past change of similar scope found in `git log`. Then compare the sketch with the effective count. Proportionality is a judgement; there is no fixed ratio. When the PR is more than about 1.5× the sketch, the finding gives the sketch, the gap, and where the gap sits by slice. This finding is never `critical`: size alone never blocks.
- `cnc-cuts`: concrete ways to make the PR smaller, each with an estimated saving in lines: code no requirement asks for; defensive branches the types exclude; near-duplicate blocks; new types restating existing ones; wrapper layers with one caller; hand-rolled logic a utility or package method covers; a feature spread across more files than its siblings use. A cut another lens owns (reuse → complexity-reuse, elevating to the data model → domain-packages, a forked component → components) is not raised here: add it to the tally by its id so the total saving is visible.
- `cnc-split`: the PR bundles separable changes (a refactor plus a feature, two features). Propose the split and the order. A slice of a review stack built by `ship-review-stack` is exempt, because its size is set by its path partition.

## Where to look

`size.json` and `manifest.json` in the run directory; `git log --stat` at `$HEAD_SHA` for comparable past changes.

## Not a finding

Size that comes from tests, docs, catalogues or seed data, or from a migration that has to be explicit. A large PR whose sketch is just as large.

## Promote to

`.agents/code-review-checklist.md` (a sizing note); calibration notes when reviewers mark sketches as too optimistic.

<!-- skill-link-allow: map.md -->
<!-- skill-link-allow: size.json -->
