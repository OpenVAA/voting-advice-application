#!/usr/bin/env bash
#
# scoped-hygiene-gate.sh -- the deterministic half of quick task 260930-gjv (planning tool, not shipped code).
#
# Usage (from anywhere inside the repository):
#   bash <this file> [<pathspec> ...]        default pathspec: apps/ packages/ tests/
#
# POPULATION, derived at run time and never from line numbers: the files PR #888 (the results-redraw
# work) added or modified, i.e. `git diff --name-only --diff-filter=d $BASE...$PR888_HEAD`, and within
# them ONLY the lines that are added relative to the merge base of $BASE and HEAD -- i.e. the lines
# PR #888 wrote plus anything later commits (sibling quick items, this task) wrote on top. Lines that
# were already in those files before PR #888 are out of scope, which is why the repo-wide
# `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh --assert-clean` cannot be this
# task's gate (it is red on ~146 files the task does not own).
#
# The working tree is compared, so uncommitted edits count.
#
# Patterns: the gate rows of hygiene-grep-report.sh (phase/spike references not in the bare
# `see phase N` / `see spike N` form, decision ids, section anchors, `.planning/` paths, plan numbers,
# milestone versions, requirement/task ids) plus the reference forms PR #888 used that those rows miss:
# threat ids (T-NNN-NN), planning document names (NNN-UPPER-CASE.md), old plan ids (Post-NN-NN),
# roadmap criteria ("criterion N"), hyphenated "phase-NNN"/"spike-NNN" and E2E run-artifact paths.
#
# Output: one `path:line: <match>` per hit, then `HITS=<n>`. Exit 0 when clean, 1 when not.

set -euo pipefail

# The fork point of PR #888 from origin/ship/v2.15-13-review-fixes, pinned so a later move of that
# branch cannot shift the population.
BASE_REF="39e471a809501b443d0bd990ee492bc42115665c"
PR888_HEAD="79b4faed97b40e845094f7d4b9e7f988aa0cfd48"

cd "$(git rev-parse --show-toplevel)"

if [ "$#" -gt 0 ]; then SCOPE=("$@"); else SCOPE=(apps/ packages/ tests/); fi

MERGE_BASE="$(git merge-base "$BASE_REF" HEAD)"
POPULATION="$(git diff --name-only --diff-filter=d "$BASE_REF...$PR888_HEAD" -- apps/ packages/ tests/)"

git diff -U0 --no-color "$MERGE_BASE" -- "${SCOPE[@]}" | POPULATION="$POPULATION" perl -ne '
  BEGIN { %in = map { $_ => 1 } grep { length } split /\n/, $ENV{POPULATION}; $n = 0; }
  if (/^\+\+\+ (?:b\/)?(.*)$/) { $f = $1; next; }
  if (/^@@ -\S+ \+(\d+)/) { $line = $1; next; }
  next unless /^\+/;
  my $text = substr($_, 1);
  if ($in{$f}) {
    while ($text =~ /((?i:(?<!see\s)\bphases?[\s-]+\d+)|(?i:(?<!see\s)\bspikes?[\s\/-]\d+)|\bD-\d{2,3}\b|\xC2\xA7|\.planning\/|(?i:\bplans?\s+\d+[-.]\d+)|\bv\d+\.\d+\b|\b[A-Z]{3,}-\d{2}\b|\bT-\d{2,3}(?:\.\d+)?-\d{2}\b|\b\d{2,3}(?:\.\d+)?-[A-Z][A-Z-]*[A-Z]\.md\b|\bPost-\d+-\d+\b|(?i:\bcriteri(?:on|a)\s+\d)|e2e-runs\/)/g) {
      $n++;
      print "$f:$line: $1\n";
    }
  }
  $line++;
  END { print "HITS=$n\n"; exit($n ? 1 : 0); }
'
