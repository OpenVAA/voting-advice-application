---
created: 2026-10-02
title: Two tracked 260930-kxi gate-evidence files remain in .planning/quick; their fate is an operator decision
area: planning
severity: follow-up
source: Phase 167 (origin/main vestige cleanup), 167-CONTEXT D-23 NOTE and D-28 residue
files:
  - .planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/gate-evidence/kxi-g-status.txt
  - .planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/gate-evidence/pgtap-summary.txt
---

## Problem

Phase 167 inspected and deleted the untracked `gate-evidence/` directory of quick task 261001-n8y
(D-23). Two files of the same kind, from quick task 260930-kxi, are **tracked** in git and were not
part of that criterion.

## What Phase 167 did

Nothing. On the operator's binding NOTE under 167-E3 ("leave them alone unless you write an
`**EDIT:**` here"; no EDIT was written), Phase 167 left both files untouched:
`git diff --exit-code 8c519ac97 -- <both paths>` exited 0 before and after the deletion of the
261001-n8y directory.

## Decision needed

Whether to keep both files as committed evidence, or remove them in a reviewed commit. Either way,
read them first for env values, as D-23 did for the untracked directory, and record the result as
categories only.
