#!/usr/bin/env bash
# Fail loudly rather than silently green: without this, a fatal shell error (a syntax
# error, an unset variable, a failed stage in a pipeline) still let this guard reach its
# exit with status 0 -- a guard that passes because it broke. Matches audit-skill-drift.sh.
set -euo pipefail
# Audit skill routing: checks the corpus against the two clauses of the one-level
# routing rule recorded in .claude/skills/README.md.
# Usage: .claude/scripts/audit-skill-routing.sh [skill-name|directory|file]
# Without arguments, audits every *.md under .claude/skills plus CLAUDE.md.
#
# ─────────────────────────────────────────────────────────────────────────────
# SKILL ROUTING-SHAPE GUARD (phase 160, requirements REVIEW-DOC-03/04).
#
# `.claude/skills/README.md` asserts a forward-looking rule — one routing level,
# never two — and states it as two clauses it calls "mechanically checkable".
# Nothing checked them. A rule asserted with no instrument is the exact shape of
# claim phase 160 exists to stop shipping, so this file is that instrument, and
# it is a sibling of `.claude/scripts/audit-skill-links.sh` and
# `.claude/scripts/audit-skill-drift.sh`: same directory, same audience, same
# argument/output/exit contract. Where the link guard asks "does the cited file
# exist?", this one asks "how many routing decisions does an agent make before
# it reaches content, and does the description layer discriminate at all?"
#
# TWO checks, one per clause of the rule:
#
#   Check A — ROUTING DEPTH. A *routing layer* is a `SKILL.md` body or the
#     `## Skill Routing` section of `CLAUDE.md`. A *hop* is a pointer from one
#     corpus Markdown file to another. A routing layer must reach content in one
#     hop; it must not land you on a second index that points onward.
#   Check B — DESCRIPTION DISCRIMINATIVENESS. Selection happens once, at the
#     frontmatter `description`. A literal opening stem shared by three or more
#     skills carries no routing signal, so it is reported with its sharers.
#
# ── What counts as a hop ─────────────────────────────────────────────────────
#
# A pointer to another *Markdown document in this corpus*: a Markdown link, a
# backticked path, a bare path token ending `.md`, a `[[wiki-alias]]` resolving
# to a sibling reference file, or a `Skill("name")` invocation. Targets are
# resolved repo-relative first, then relative to the citing file's directory.
#
# Citations of SOURCE CODE (`.ts`, `.svelte`, `.sql`) are deliberately NOT hops.
# That distinction is load-bearing and was arrived at by measurement, not by
# taste: counting every path citation as a pointer scores
# `filters/extension-patterns.md` at 50.5% and `CLAUDE.md` at 62.0% — two files
# that are unambiguously content — because a procedure naturally names the files
# it operates on. Counting only corpus-document citations separates "this file
# sends you elsewhere" from "this file talks about the code", which is the
# distinction the rule is actually about.
#
# A `Skill("x")` invocation inside `CLAUDE.md § Skill Routing` is the
# DESCRIPTION-LAYER SELECTION, not a routing hop, and is counted as depth 0.
# This follows the rule's own first sentence — "a skill's frontmatter
# description is the routing layer" — and it is why the corpus is not wholesale
# in violation: if `CLAUDE.md → Skill("data") → data/SKILL.md → object-model.md`
# were three hops, then every skill in the tree would breach the rule, including
# the shape the rule explicitly blesses.
#
# ── The threshold, and the distribution that justified it ────────────────────
#
# THRESHOLD = 50% of body lines. A unit — a file, or one heading-delimited
# section — is an INDEX when a MAJORITY of its body lines are pointer lines, and
# CONTENT otherwise. The rule's own wording is "predominantly pointers", and
# "predominantly" means a majority: the number is the word, not a tuned
# constant. Override it with `SKILL_ROUTING_THRESHOLD=<n>` to re-run the
# sensitivity analysis below — never to quiet a verdict, which the escape hatch
# is for and which leaves a record.
#
# It is stated that way because the measured FILE-LEVEL distribution offers no
# defensible alternative. Measured by this script over the 27-file live corpus
# (`.claude/skills/**/*.md` + `CLAUDE.md`) at commit 4d7b8201b, sorted:
#
#     23.8 23.4 17.9 15.5 13.0 13.0 12.4 9.1 5.8 5.2 4.3 3.2 2.8 2.8
#      2.7  2.7  2.2  2.0  2.0  1.9  1.6 1.3 1.1 1.0 0.0 0.0 0.0   (percent)
#
# That is FLAT: a single monotone run from 23.8% to zero whose widest gap is 5.5
# points (23.4 -> 17.9), with no bimodal split and nothing remotely near a
# majority. No file-level threshold can be read off it. **Per flagged assumption
# A9-1 the FILE-level verdicts are therefore ADVISORY, not binding**: at 50% the
# check classifies zero files as indexes and reports that it found nothing,
# which is a true statement about this corpus rather than a check that never ran.
#
# The SECTION-LEVEL measurement is the one that discriminates, and it is also
# the granularity at which `.claude/skills/README.md` states the rule's live
# violation ("§ Feature Areas … is a table of 8 rows … hop 2, a second index").
# Same corpus and commit, sections carrying at least one pointer and at least
# MIN_SECTION_LINES body lines, top of the distribution:
#
#     100.0 100.0 88.9 75.0 72.2 60.0 50.0 50.0 50.0 50.0 | 42.9 40.0 40.0
#      33.3  33.3 33.3 32.1 28.6 25.0 25.0 25.0 25.0 22.2 …
#
# This is NOT cleanly bimodal either — the widest gap, 13.9 points, falls
# *inside* the top cluster (88.9 -> 75.0), not at its edge — and that is stated
# rather than dressed up. What makes the verdict trustworthy is not a gap but
# its INSENSITIVITY, measured one step either side and further:
#
#     SKILL_ROUTING_THRESHOLD      25  35  43  50  60  80  95  100
#     routing layers VIOLATION       2   2   2   2   1   1   1    1
#       the generated spike skill    y   y   y   y   y   y   y    y
#       `CLAUDE.md § Skill Routing`  y   y   y   y   .   .   .    .
#
# The layer that matters is reported at EVERY threshold from 25 to 100, because
# the shape driving it — a one-hop destination whose `## Related` section is 6
# pointer lines out of 6 — sits at 100% and cannot be thresholded away. That
# verdict does not depend on the number at all. The second layer appears only at
# 50% and below, and it is the escape hatch's case rather than a real second
# routing level: `CLAUDE.md § Skill Routing` reaches `.claude/skills/README.md`,
# the corpus record, whose onward citations are evidence for what it records and
# not routes — which is exactly what that entry in `CLAUDE.md` says it is.
# Everywhere else the threshold only changes how many sections are LABELLED
# index in the listing, and the listing prints the density beside each one, so a
# reader can re-judge the label without re-deriving the measurement.
#
# MIN_SECTION_LINES = 3. A section of one or two body lines scores 100% or 50%
# by construction and carries no signal; four `## Reference Files` sections in
# this corpus are exactly that shape. Sections under the floor are printed as
# `unclassified` rather than silently scored.
#
# ── What Check A reports ─────────────────────────────────────────────────────
#
#   A1 (file level, ADVISORY per A9-1) — a routing layer points at a file that
#      is itself an INDEX and that points onward. This is the rule's literal
#      wording. On this corpus it finds nothing, and says so.
#   A2 (section level, BINDING) — two shapes:
#      A2a  a routing layer whose body carries TWO OR MORE index sections, i.e.
#           "a second index inside the skill" in the rule's own words;
#      A2b  a file reached in one hop from a routing layer that carries an index
#           section pointing ONWARD, i.e. the reader lands on content and is
#           handed another index.
#
# Back-edges are not onward hops and are excluded from every chain test: a
# pointer back to `CLAUDE.md`, or back to the `SKILL.md` the chain started at,
# returns the reader rather than advancing them.
#
# ── What Check B reports, and what it cannot ─────────────────────────────────
#
# The frontmatter `description` of every `SKILL.md` is lower-cased, stripped of
# punctuation, and compared word by word from the start. The LONGEST opening
# stem shared by three or more skills is reported with its sharers. A shared
# literal stem is a measurable, arguable signal; a fuzzy similarity score with a
# tuned cut-off produces verdicts nobody can argue with, and is deliberately not
# used here.
#
# Check B is a FLOOR, not a proof of a good selection layer (flagged assumption
# A9-2): it detects the failure mode this corpus actually has, and does not
# detect descriptions that are superficially varied but still non-discriminative.
#
# ── Escape hatch ─────────────────────────────────────────────────────────────
#
# Same shape as the link guard's, on its own line:
#
#     <!-- skill-routing-allow: path/to/target.md -->
#         exempts that one hop: it is not traversed as a route.
#     <!-- skill-routing-allow: index -->
#         exempts the whole file from index classification, at file AND section
#         level, for a file whose pointer density is its purpose.
#
# Use these for a pointer that is a CITATION OF A RECORD rather than a route an
# agent is meant to follow. Never to silence a real second routing level. An
# exempted unit still has its density measured and printed — the marker
# suppresses a verdict, never a measurement, so a reader can always see what was
# waived and disagree with it.
#
# This guard is deliberately NOT wired into CI or into any package.json script.
# Landing it unwired is the recorded scope boundary of phase 160; wiring it is
# phase 163's. `.github/workflows/main.yaml` additionally carries
# `paths-ignore: "**.md"` on every trigger, so an all-Markdown change would not
# fire it even if it were wired.
#
# Exit codes:
#   0 - no binding violation
#   1 - at least one binding violation, or a named argument that matched no
#       skill and no file
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Decimal points, not commas: awk's printf follows the locale, and a figure a
# reader cannot paste into a spreadsheet is a figure this record cannot defend.
export LC_ALL=C

SKILLS_DIR=".claude/skills"
ROOT_DOC="CLAUDE.md"
ROUTING_SECTION="## Skill Routing"
THRESHOLD=${SKILL_ROUTING_THRESHOLD:-50}
MIN_SECTION_LINES=3

WORK=$(mktemp -d)
# Capture the status FIRST, then clean up, then re-exit with it. Without the capture, the
# cleanup command becomes the last thing the shell ran, and on bash 3.2 -- which is what
# macOS ships and this script targets -- a successful `rm` becomes the exit status when the
# script dies abnormally (a syntax error, a `set -e` abort). Measured: this guard returned 0
# with a fatal parse error on stderr, i.e. it passed BECAUSE it broke.
trap 'rc=$?; rm -rf "$WORK"; exit $rc' EXIT

CORPUS="$WORK/corpus"
SCAN="$WORK/scan"
EDGES="$WORK/edges"

# Every `grep` below is `command grep`. In this repository `grep` is a shell
# function wrapping `ugrep`, whose output differs (no `./` path prefix), and a
# guard whose verdict depends on which grep the caller happens to have exported
# is not a guard. Verified to behave identically with and without the wrapper.
GREP="command grep"

# ── The corpus, derived from the filesystem ──────────────────────────────────
# No skill name and no skill count is hardcoded anywhere in this file.
{
  find "$SKILLS_DIR" -name '*.md' 2>/dev/null || true
  [[ -f "$ROOT_DOC" ]] && echo "$ROOT_DOC"
} | sed 's#^\./##' | sort > "$CORPUS"

if [[ ! -s "$CORPUS" ]]; then
  echo "No corpus found: $SKILLS_DIR holds no *.md and $ROOT_DOC is absent." >&2
  exit 1
fi

in_corpus() { $GREP -qxF "$1" "$CORPUS"; }

label() { local l="${1#./}"; echo "${l#"$SKILLS_DIR"/}"; }

# ── Scan every corpus file once ──────────────────────────────────────────────
# Emits TSV records:
#   F <file> <ptr-lines> <body-lines>
#   S <file> <ptr-lines> <body-lines> <heading>
#   H <file> <section-heading> <raw-token>
#   A <file> <allow-token>
scan_one() {
  awk -v FILE="$1" '
    function is_self(tok,   b, f) {
      b = tok; sub(/.*\//, "", b)
      f = FILE; sub(/.*\//, "", f)
      return (b == f)
    }
    function emit(tok) {
      if (tok == "" || is_self(tok)) return 0
      print "H\t" FILE "\t" sec "\t" tok
      return 1
    }
    function harvest(line,   s, tok, n) {
      n = 0
      s = line
      while (match(s, /Skill\("[A-Za-z0-9_.-]+"\)/)) {
        tok = substr(s, RSTART, RLENGTH); n += emit(tok); s = substr(s, RSTART + RLENGTH)
      }
      s = line
      while (match(s, /\[\[[A-Za-z0-9_.-]+\]\]/)) {
        tok = substr(s, RSTART, RLENGTH)
        # A [[name]] is a wiki-style alias ONLY when it stands alone. SvelteKit spells an
        # optional route segment the same way, so results/[[electionTab]]/+layout.svelte
        # would otherwise be harvested as a routing hop and inflate the pointer density of
        # the file -- the number the threshold methodology is derived from. Reject the
        # token when either neighbour is a path separator.
        if (!(RSTART > 1 && substr(s, RSTART - 1, 1) == "/") &&
            substr(s, RSTART + RLENGTH, 1) != "/") {
          n += emit(tok)
        }
        s = substr(s, RSTART + RLENGTH)
      }
      s = line
      # Parentheses and + are load-bearing in the real paths of this repo -- SvelteKit route
      # groups and +page.md. Omitting them truncated
      # apps/docs/src/routes/(content)/.../generated/+page.md to the token page.md, which
      # resolves against nothing and counts as a pointer anyway.
      while (match(s, /[A-Za-z0-9_.$@()+\/-]+\.md/)) {
        tok = substr(s, RSTART, RLENGTH); n += emit(tok); s = substr(s, RSTART + RLENGTH)
      }
      return n
    }
    function flush_section() {
      if (sec != "" && sbody > 0) print "S\t" FILE "\t" sptr "\t" sbody "\t" sec
      sptr = 0; sbody = 0
    }
    BEGIN { fm = 0; fenced = 0; first = 1; sec = "(preamble)"; fptr = 0; fbody = 0; sptr = 0; sbody = 0 }
    {
      if (first && $0 == "---") { fm = 1; first = 0; next }
      first = 0
      if (fm == 1) { if ($0 == "---") fm = 0; next }

      if ($0 ~ /<!--[[:space:]]*skill-routing-allow:/) {
        a = $0
        sub(/.*skill-routing-allow:[[:space:]]*/, "", a)
        sub(/[[:space:]].*$/, "", a)
        print "A\t" FILE "\t" a
        next
      }

      if ($0 ~ /^[[:space:]]*```/) { fenced = !fenced; next }
      if (fenced) next

      if ($0 ~ /^#{1,6}[[:space:]]/) { flush_section(); sec = $0; next }
      if ($0 ~ /^[[:space:]]*$/) next
      # A table separator row (`| --- | ---: |`) is layout, not a body line.
      if ($0 ~ /^[[:space:]]*\|[[:space:]:|-]+\|[[:space:]]*$/) next

      fbody++; sbody++
      if (harvest($0) > 0) { fptr++; sptr++ }
    }
    END { flush_section(); print "F\t" FILE "\t" fptr "\t" fbody }
  ' "$1"
}

: > "$SCAN"
while IFS= read -r f; do scan_one "$f" >> "$SCAN"; done < "$CORPUS"

# ── Resolve hop tokens into corpus edges ─────────────────────────────────────
resolve_token() { # $1 = citing file, $2 = raw token -> prints corpus path or fails
  local from="$1" tok="$2" name alias dir cand skillroot
  case "$tok" in
    'Skill("'*)
      name="${tok#Skill(\"}"; name="${name%\"\)}"
      cand="$SKILLS_DIR/$name/SKILL.md"
      ;;
    '[['*)
      alias="${tok#[[}"; alias="${alias%]]}"
      dir=$(dirname "$from")
      skillroot="$dir"
      [[ "$(basename "$dir")" == "references" ]] && skillroot=$(dirname "$dir")
      for cand in "$dir/$alias.md" "$skillroot/references/$alias.md" "$skillroot/$alias.md"; do
        in_corpus "$cand" && { echo "$cand"; return 0; }
      done
      return 1
      ;;
    *)
      cand="${tok%%#*}"
      ;;
  esac
  [[ -z "$cand" ]] && return 1
  if in_corpus "$cand"; then echo "$cand"; return 0; fi
  dir=$(dirname "$from")
  cand="$dir/${cand#./}"
  cand=$(echo "$cand" | sed 's#^\./##')
  if in_corpus "$cand"; then echo "$cand"; return 0; fi
  return 1
}

# Allow-list lookup: exempted hops are not traversed.
is_allowed() { # $1 = file, $2 = resolved target
  $GREP -qxF "$(printf 'A\t%s\t%s' "$1" "$2")" "$SCAN" 2>/dev/null && return 0
  $GREP -qxF "$(printf 'A\t%s\t%s' "$1" "$(label "$2")")" "$SCAN" 2>/dev/null && return 0
  return 1
}

file_exempt_from_index() { # $1 = file
  $GREP -qxF "$(printf 'A\t%s\tindex' "$1")" "$SCAN" 2>/dev/null
}

# EDGES records: <from>\t<section>\t<to>
: > "$EDGES"
while IFS=$'\t' read -r kind from sec tok; do
  [[ "$kind" == "H" ]] || continue
  to=$(resolve_token "$from" "$tok") || continue
  [[ "$to" == "$from" ]] && continue
  is_allowed "$from" "$to" && continue
  printf '%s\t%s\t%s\n' "$from" "$sec" "$to" >> "$EDGES"
done < <($GREP -E "^H	" "$SCAN" || true)
sort -u -o "$EDGES" "$EDGES"

# ── Scope: optional single target ────────────────────────────────────────────
SCOPE="$WORK/scope"
if [[ $# -gt 0 ]]; then
  arg="${1%/}"
  if [[ -d "$SKILLS_DIR/$arg" ]]; then
    find "$SKILLS_DIR/$arg" -name '*.md' | sed 's#^\./##' | sort > "$SCOPE"
  elif [[ -d "$arg" ]]; then
    find "$arg" -name '*.md' | sed 's#^\./##' | sort > "$SCOPE"
  elif [[ -f "$arg" ]]; then
    echo "${arg#./}" > "$SCOPE"
  else
    echo "Skill, directory or file not found: $1"
    exit 1
  fi
  if [[ ! -s "$SCOPE" ]]; then
    echo "No Markdown files under: $1"
    exit 1
  fi
else
  cp "$CORPUS" "$SCOPE"
fi
in_scope() { $GREP -qxF "$1" "$SCOPE"; }

density() { # $1 = ptr, $2 = body -> percent with one decimal
  awk -v p="$1" -v b="$2" 'BEGIN { if (b == 0) print "0.0"; else printf "%.1f", (p * 100.0) / b }'
}

ge_threshold() { # $1 = percent string
  awk -v d="$1" -v t="$THRESHOLD" 'BEGIN { exit !(d + 0 >= t + 0) }'
}

VIOLATIONS=0
FILES_CLASSIFIED=0
FILES_INDEX=0
SECTIONS_CLASSIFIED=0
SECTIONS_INDEX=0
SECTIONS_TOO_SMALL=0
LAYERS=0
CHAINS=0

echo ""
echo "Skill Routing Audit"
echo "==================="
echo ""
echo "Check A - routing depth (index threshold: ${THRESHOLD}% of body lines; sections need >= ${MIN_SECTION_LINES} body lines)"
echo ""
echo "  Pointer density, per corpus file:"

FILE_INDEX_LIST="$WORK/file-index"
: > "$FILE_INDEX_LIST"
# Classification is computed over the WHOLE corpus even on a scoped run: a chain
# whose intermediate sits outside the named target is still a chain, and a guard
# that forgets it when you narrow the scope reports a clean run for the wrong
# reason. Only the printing and the counts below follow the scope.
while IFS=$'\t' read -r _ f p b; do
  d=$(density "$p" "$b")
  verdict="content"
  if ge_threshold "$d" && ! file_exempt_from_index "$f"; then
    verdict="INDEX"
    echo "$f" >> "$FILE_INDEX_LIST"
    in_scope "$f" && FILES_INDEX=$((FILES_INDEX + 1))
  fi
  in_scope "$f" || continue
  FILES_CLASSIFIED=$((FILES_CLASSIFIED + 1))
  printf "    %6s%%  %4s/%-4s  %-8s  %s\n" "$d" "$p" "$b" "$verdict" "$(label "$f")"
done < <($GREP -E "^F	" "$SCAN" | sort -t"$(printf '\t')" -k2,2)

echo ""
echo "  Pointer density, per section (sections carrying at least one pointer):"

SECTION_INDEX_LIST="$WORK/section-index"
: > "$SECTION_INDEX_LIST"
while IFS=$'\t' read -r _ f p b sec; do
  [[ "$p" -gt 0 ]] || continue
  d=$(density "$p" "$b")
  if [[ "$b" -lt "$MIN_SECTION_LINES" ]]; then
    in_scope "$f" || continue
    SECTIONS_TOO_SMALL=$((SECTIONS_TOO_SMALL + 1))
    printf "    %6s%%  %4s/%-4s  %-12s  %s :: %s\n" "$d" "$p" "$b" "unclassified" "$(label "$f")" "$sec"
    continue
  fi
  verdict="content"
  if ge_threshold "$d" && ! file_exempt_from_index "$f"; then
    verdict="INDEX"
    printf '%s\t%s\n' "$f" "$sec" >> "$SECTION_INDEX_LIST"
    in_scope "$f" && SECTIONS_INDEX=$((SECTIONS_INDEX + 1))
  fi
  in_scope "$f" || continue
  SECTIONS_CLASSIFIED=$((SECTIONS_CLASSIFIED + 1))
  printf "    %6s%%  %4s/%-4s  %-12s  %s :: %s\n" "$d" "$p" "$b" "$verdict" "$(label "$f")" "$sec"
done < <($GREP -E "^S	" "$SCAN" | sort -t"$(printf '\t')" -k2,2)

echo ""
echo "  Routing-layer verdicts:"

# Depth-1 destinations of a routing layer, back-edges excluded.
destinations() { # $1 = layer file, $2 = section filter ("" = whole file)
  local layer="$1" secfilter="$2"
  while IFS=$'\t' read -r from sec to; do
    [[ "$from" == "$layer" ]] || continue
    if [[ -n "$secfilter" ]]; then
      [[ "$sec" == "$secfilter" ]] || continue
      # Inside CLAUDE.md's routing section a Skill() invocation is depth 0.
      [[ "$to" == "$SKILLS_DIR"/*/SKILL.md ]] && continue
    fi
    [[ "$to" == "$ROOT_DOC" ]] && continue
    [[ "$to" == "$layer" ]] && continue
    echo "$to"
  done < "$EDGES" | sort -u
}

onward_hops() { # $1 = file, $2 = layer to treat as a back-edge, $3 = optional section
  local file="$1" layer="$2" secfilter="${3:-}"
  while IFS=$'\t' read -r from sec to; do
    [[ "$from" == "$file" ]] || continue
    [[ -n "$secfilter" && "$sec" != "$secfilter" ]] && continue
    [[ "$to" == "$ROOT_DOC" ]] && continue
    [[ "$to" == "$layer" ]] && continue
    [[ "$to" == "$file" ]] && continue
    echo "$to"
  done < "$EDGES" | sort -u
}

audit_layer() { # $1 = layer file, $2 = section filter, $3 = display name
  local layer="$1" secfilter="$2" name="$3"
  local findings="" dests d onward idx_sections n_idx sec

  LAYERS=$((LAYERS + 1))

  # A2a — two or more index sections inside the routing layer itself.
  if [[ -z "$secfilter" ]]; then
    idx_sections=$($GREP -E "^$(printf '%s' "$layer" | sed 's/[.[\*^$\/]/\\&/g')	" "$SECTION_INDEX_LIST" 2>/dev/null | cut -f2- || true)
    n_idx=0
    [[ -n "$idx_sections" ]] && n_idx=$(printf '%s\n' "$idx_sections" | $GREP -c . || true)
    if [[ "$n_idx" -ge 2 ]]; then
      findings+="      A2a  the routing layer carries $n_idx index sections - a second index inside the skill:\n"
      while IFS= read -r sec; do
        [[ -z "$sec" ]] && continue
        findings+="             $sec\n"
      done <<< "$idx_sections"
    fi
  fi

  dests=$(destinations "$layer" "$secfilter")
  while IFS= read -r d; do
    [[ -z "$d" ]] && continue
    CHAINS=$((CHAINS + 1))
    onward=$(onward_hops "$d" "$layer")
    # A1 — the rule's literal, file-level test (advisory per A9-1).
    if [[ -n "$onward" ]] && $GREP -qxF "$d" "$FILE_INDEX_LIST" 2>/dev/null; then
      findings+="      A1   depth-2 chain: $name -> $(label "$d") (INDEX) -> $(printf '%s' "$onward" | head -3 | tr '\n' ' ')\n"
    fi
    # A2b — a one-hop destination carrying an index section that points onward.
    while IFS=$'\t' read -r sf sec; do
      [[ "$sf" == "$d" ]] || continue
      local sec_onward
      sec_onward=$(onward_hops "$d" "$layer" "$sec")
      [[ -z "$sec_onward" ]] && continue
      findings+="      A2b  depth-2 chain: $name -> $(label "$d") :: $sec (INDEX) -> $(printf '%s' "$sec_onward" | $GREP -c . || true) further file(s)\n"
    done < "$SECTION_INDEX_LIST"
  done <<< "$dests"

  local n_dest=0
  [[ -n "$dests" ]] && n_dest=$(printf '%s\n' "$dests" | $GREP -c . || true)

  if [[ -n "$findings" ]]; then
    VIOLATIONS=$((VIOLATIONS + 1))
    printf "    %-46s  VIOLATION  (%s destination(s) at depth 1)\n" "$name" "$n_dest"
    printf "$findings"
  else
    printf "    %-46s  OK         (%s destination(s) at depth 1, none an index)\n" "$name" "$n_dest"
  fi
}

while IFS= read -r skill_md; do
  in_scope "$skill_md" || continue
  audit_layer "$skill_md" "" "$(label "$(dirname "$skill_md")")"
done < <($GREP -E "/SKILL\.md$" "$CORPUS" | sort)

if in_scope "$ROOT_DOC"; then
  audit_layer "$ROOT_DOC" "$ROUTING_SECTION" "$ROOT_DOC $ROUTING_SECTION"
fi

if [[ ! -s "$FILE_INDEX_LIST" ]]; then
  echo ""
  echo "  A1 found nothing to report: no file in the corpus reaches the ${THRESHOLD}% index threshold,"
  echo "  so no routing layer can point at a file-level index. This is a measured absence,"
  echo "  not an unrun check - the per-file densities above are what it measured."
fi

# ── Check B — description discriminativeness ─────────────────────────────────
echo ""
echo "Check B - description discriminativeness (a stem shared by 3 or more skills carries no routing signal)"
echo ""

DESCS="$WORK/descs"
: > "$DESCS"
while IFS= read -r skill_md; do
  name=$(basename "$(dirname "$skill_md")")
  desc=$(awk '
    BEGIN { fm = 0; grab = 0 }
    NR == 1 && $0 == "---" { fm = 1; next }
    fm == 1 && $0 == "---" { exit }
    fm == 1 {
      if ($0 ~ /^description:[[:space:]]*/) { sub(/^description:[[:space:]]*/, ""); grab = 1; printf "%s ", $0; next }
      if (grab == 1) {
        if ($0 ~ /^[A-Za-z_][A-Za-z0-9_-]*:/) { grab = 0; exit }
        printf "%s ", $0
      }
    }' "$skill_md")
  # Normalise: lower-case, drop quotes and punctuation, squeeze whitespace.
  norm=$(printf '%s' "$desc" \
    | tr '[:upper:]' '[:lower:]' \
    | sed "s/^['\"]//; s/['\"]\$//" \
    | sed 's/[^a-z0-9]\{1,\}/ /g' \
    | sed 's/^ //; s/ $//')
  [[ -z "$norm" ]] && continue
  printf '%s\t%s\n' "$name" "$norm" >> "$DESCS"
done < <($GREP -E "/SKILL\.md$" "$CORPUS" | sort)

DESC_COUNT=$($GREP -c . "$DESCS" || true)

STEMS="$WORK/stems"
: > "$STEMS"
awk -F'\t' -v OFS='\t' '
  { name[NR] = $1; desc[NR] = $2; n = NR }
  END {
    for (k = 8; k >= 2; k--) {
      delete group
      for (i = 1; i <= n; i++) {
        c = split(desc[i], w, " ")
        if (c < k) continue
        s = w[1]
        for (j = 2; j <= k; j++) s = s " " w[j]
        group[s] = group[s] (group[s] == "" ? "" : ", ") name[i]
        count[s]++
      }
      for (s in group) {
        if (count[s] >= 3 && !(s in reported_prefix)) {
          print k, s, group[s]
          # Mark every shorter prefix of this stem as already covered, so the
          # LONGEST shared stem is reported once rather than once per length.
          split(s, ws, " ")
          p = ws[1]
          reported_prefix[p] = 1
          for (j = 2; j <= k; j++) { p = p " " ws[j]; reported_prefix[p] = 1 }
        }
      }
      delete count
    }
  }
' "$DESCS" | sort -u | sort -t"$(printf '\t')" -k1,1nr > "$STEMS"

STEM_COUNT=$($GREP -c . "$STEMS" || true)
IMPLICATED="$WORK/implicated"
: > "$IMPLICATED"
if [[ "$STEM_COUNT" -gt 0 ]]; then
  while IFS=$'\t' read -r k stem sharers; do
    printf '%s\n' "$sharers" | tr ',' '\n' | sed 's/^ *//; s/ *$//' >> "$IMPLICATED"
  done < "$STEMS"
  sort -u -o "$IMPLICATED" "$IMPLICATED"
fi

while IFS=$'\t' read -r name norm; do
  skill_md="$SKILLS_DIR/$name/SKILL.md"
  in_scope "$skill_md" || continue
  if $GREP -qxF "$name" "$IMPLICATED" 2>/dev/null; then
    stem=$($GREP -F "$name" "$STEMS" | head -1 | cut -f2)
    others=$($GREP -F "$name" "$STEMS" | head -1 | cut -f3)
    printf "    %-46s  VIOLATION  shares the opening stem \"%s\" with: %s\n" "$name" "$stem" "$others"
    VIOLATIONS=$((VIOLATIONS + 1))
  else
    printf "    %-46s  OK         opening: \"%s\"\n" "$name" "$(printf '%s' "$norm" | cut -d' ' -f1-5)"
  fi
done < "$DESCS"

echo ""
if [[ "$STEM_COUNT" -gt 0 ]]; then
  echo "  Shared opening stems (3 or more skills), longest first:"
  while IFS=$'\t' read -r k stem sharers; do
    echo "    ${k}-word stem \"$stem\" - $sharers"
  done < "$STEMS"
else
  echo "  No opening stem is shared by 3 or more skills. Measured over $DESC_COUNT description(s)."
fi

IMPLICATED_COUNT=0
[[ -s "$IMPLICATED" ]] && IMPLICATED_COUNT=$($GREP -c . "$IMPLICATED" || true)

echo ""
echo "---"
echo "Check A: files classified $FILES_CLASSIFIED (index $FILES_INDEX, content $((FILES_CLASSIFIED - FILES_INDEX)))  sections classified $SECTIONS_CLASSIFIED (index $SECTIONS_INDEX, too small to classify $SECTIONS_TOO_SMALL)  routing layers $LAYERS  depth-1 destinations $CHAINS"
echo "Check B: descriptions $DESC_COUNT  shared stems $STEM_COUNT  skills implicated $IMPLICATED_COUNT"
echo "Violations: $VIOLATIONS"

if [[ "$VIOLATIONS" -gt 0 ]]; then
  echo ""
  echo "A second routing level costs an agent an extra chance to route wrong before"
  echo "it reaches content; a shared description stem makes the one reliable"
  echo "selection point unreliable. Flatten by PROMOTING the content into the body"
  echo "or SPLITTING the skill - never by deleting the reference files - and sharpen"
  echo "a description to say when to use this skill rather than its neighbours."
  exit 1
fi
