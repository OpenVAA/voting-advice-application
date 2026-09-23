#!/usr/bin/env bash
# Fail loudly rather than silently green: without this, a fatal shell error (a syntax
# error, an unset variable, a failed stage in a pipeline) still let this guard reach its
# exit with status 0 -- a guard that passes because it broke. Matches audit-skill-drift.sh.
set -euo pipefail
# Audit skill links: checks that backticked repo-relative path citations still resolve.
# Usage: .claude/scripts/audit-skill-links.sh [skill-name|file]
# Without arguments, audits every *.md under .claude/skills plus CLAUDE.md.
#
# ─────────────────────────────────────────────────────────────────────────────
# SKILL LINK/PATH-INTEGRITY GUARD (phase 160, requirement REVIEW-DOC-04).
#
# The incident this file exists for: the agent-facing documentation corpus
# (`CLAUDE.md` + `.claude/skills/**`) cites source files by hand, and nothing
# mechanical ever re-asserted that the cited files still exist. Phase 160's
# research measured four distinct classes of dangling citation, none of them
# caught by any existing gate (measured at HEAD db220cb5f):
#
#   * 15 distinct schema filenames that no longer existed, cited in 51 places
#     across four files of the `database` skill, after the schema was
#     renumbered from a three-digit `0NN-` scheme to a banded scheme.
#   * 1 route-layout path inside `CLAUDE.md`'s Svelte-context section that no
#     longer existed (the route had acquired an optional-parameter segment).
#   * 1 citation whose `path:NN-MM` line range no longer pointed at the text it
#     named (the file grew; the range landed on unrelated code).
#   * 5 directory rows in `.claude/skills/BOUNDARIES.md` naming directories
#     that were moved under `apps/`.
#
# Re-measured when this guard landed: the `0NN-` schema class had since been
# repaired by hand (the skill now cites the banded names, which exist), which
# is the point rather than a reprieve — it was repaired only because a human
# went looking, and nothing stopped it recurring the next morning. The
# route-layout path and the BOUNDARIES.md rows were still live; the first is
# repaired in the same commit as this file, and the five BOUNDARIES.md rows
# were repaired later in the same phase (four repointed under `apps/`, the
# fifth deleted with the retired subsystem it named) -- so that class is now
# closed too, again only because a plan went looking. The drifted line range is real but
# is NOT detectable here: check 2 is one-sided by design, and the cited file is
# long enough that the stale range still lands inside it — that repair needed a
# human read of the cited lines. A NEARBY class that WAS undetectable here has
# since been closed by check 3c below: a bare-filename citation carrying a line
# anchor past the end of its file, which is how this phase's own trim of
# `CLAUDE.md` produced two stale anchors that only a human read caught. The guard's first whole-corpus run reported
# 350 dangling of 672 citations; the large residue is the corpus's
# package-relative citation habit, described at the end of check 4.
#
# A dangling citation in this corpus is not cosmetic: an agent reads these
# files as authoritative instruction and follows the pointer. A pointer into
# nothing costs a search; a pointer into the WRONG lines costs a wrong belief.
#
# This guard imitates its sibling `.claude/scripts/audit-skill-drift.sh` —
# same directory, same audience, same argument/output/exit contract — as that
# file's own convention requires. Where the drift guard asks "has the source
# moved since the skill was written?", this one asks the cheaper and more
# absolute question: "does the thing the skill names exist at all?"
#
# FOUR checks, each a distinct way a citation can go bad:
#
#   Check 1 — EXISTENCE. Every backticked token that looks like a repo-relative
#     path citation (contains a `/`, or ends in a 2-5 character lowercase
#     filename extension) must resolve to an existing file or directory,
#     relative to the repository root.
#   Check 2 — LINE RANGE. A citation of the form `path.ext:NN` or
#     `path.ext:NN-MM` has its suffix stripped for check 1, and additionally
#     fails when the cited file has fewer than NN lines. This is a cheap
#     one-sided test: it catches a range that ran off the end of a shrunken
#     file, and deliberately does NOT try to judge whether the lines still say
#     what the citation claims — that is a human read.
#   Check 3 — BARE FILENAMES. A token carrying no `/` names a file by basename.
#     Two sub-cases, because a bare filename is often a file-KIND reference
#     (`tsconfig.json`, `package.json`) rather than a location:
#       3a. A three-digit-prefixed `.sql` name is resolved against
#           `apps/supabase/supabase/schema/`, because the `database` skill
#           cites the Supabase schema that way throughout. This is where the
#           51-citation class above lives, and the check is positional: the
#           name must exist IN the schema directory.
#       3b. Any other bare filename must match the basename of some tracked
#           file somewhere in the repository. This is deliberately the weakest
#           test in the file — it cannot tell a location from a kind, so it
#           asserts only the thing both readings share: that a file by that
#           name still exists at all. It still catches a renamed-away name,
#           which is the failure mode that produced 3a's 51 citations.
#       3c. LINE RANGE ON A BARE FILENAME. A bare-filename citation may also
#           carry a `:NN` or `:NN-MM` suffix, and until phase 160 plan 09 that
#           suffix got no test at all: check 2 above only fires on a token
#           containing a `/`, so `CLAUDE.md:392` was checked for the existence
#           of *a* file called `CLAUDE.md` and nothing more. That hole is not
#           hypothetical — this very phase trimmed `CLAUDE.md` from 437 lines to
#           341 without re-deriving the anchors pointing into it, and shipped
#           `CLAUDE.md:392` and `CLAUDE.md:432` into `.claude/skills/README.md`.
#           A later plan of the same phase found both by hand. This check closes
#           that class: when the basename resolves to EXACTLY ONE tracked file,
#           the same one-sided range test as check 2 is applied to it. When the
#           basename is ambiguous the range test is skipped rather than guessed
#           — a citation this guard cannot locate is a citation it has nothing
#           to say about, and inventing a target would turn a weak test into a
#           wrong one. Measured when it landed: 13 bare-filename tokens in the
#           corpus carry a line anchor, 12 resolve uniquely and all 12 are in
#           range, so the check adds no new dangling report on the tree it was
#           written against — it is a guard against the next trim, not a repair.
#   Check 4 — DELIBERATE EXEMPTIONS. Tokens that are path-SHAPED but are not
#     repo-relative citations are skipped and counted as skipped, never as
#     dangling: glob and `<placeholder>` patterns, URLs, npm scope specifiers
#     (`@openvaa/core`), multi-word command lines, bare version strings, bare
#     file extensions (`.js`), quoted code literals (`'./filter'`), absolute
#     paths and server routes (`/@fs`), import specifiers (`./x`, `../x`), and
#     build-alias paths (`$lib/...`, and runes such as `$derived.by` that look
#     like one). The last four classes are not rooted at the repository root,
#     so this guard has nothing to say about them.
#
# What this guard deliberately does NOT forgive: a path that resolves only
# relative to the package a skill documents (`src/index.ts` in the `filters`
# skill, meaning `packages/filters/src/index.ts`). Resolving those by suffix
# match would also silently forgive `frontend/src/lib/components/`, one of the
# five moved-under-`apps/` rows in BOUNDARIES.md above — the exact class this
# guard was built to catch. Citations in this corpus are repo-relative.
#
# Escape hatch. A file may exempt one token with an inline HTML comment on its
# own line, in the shape the corpus already uses for accepted warnings:
#
#     <!-- skill-link-allow: path/that/does/not/exist/yet.ts -->
#
# One marker exempts exactly the token it names, for the file it appears in,
# and the exempted token is counted as skipped. Use it for a path that is
# deliberately hypothetical (an illustrative example, a file a later phase
# creates) — never to silence a real dangling citation.
#
# Fenced code blocks are excluded from extraction: their contents are sample
# code and shell transcripts, not citations. Tokens are de-duplicated per file,
# so `Checked:` counts distinct citations per file, not total occurrences.
#
# This guard is deliberately NOT wired into CI or into any package.json script.
# Landing it unwired is the recorded scope boundary of phase 160; wiring it is
# phase 163's.
#
# Exit codes:
#   0 - every citation resolves
#   1 - at least one dangling citation, or a named argument that matched no
#       skill and no file
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SKILLS_DIR=".claude/skills"
SCHEMA_DIR="apps/supabase/supabase/schema"
CHECKED=0
DANGLING=0
SKIPPED=0

# Basenames of every tracked file, for check 3b. Computed once.
BASENAMES_FILE=$(mktemp)
# basename<TAB>path for every tracked file, for check 3c's unique-resolution
# test. Separate from BASENAMES_FILE because that one is de-duplicated, and the
# duplicates are exactly what 3c needs to see in order to decline.
PATHS_BY_NAME=$(mktemp)
# Capture the status FIRST, then clean up, then re-exit with it -- see the same note in
# audit-skill-routing.sh. On bash 3.2 (what macOS ships) a bare cleanup trap lets a
# successful `rm` overwrite the status when the script dies abnormally, so the guard exits 0
# on a fatal error: it passes because it broke.
trap 'rc=$?; rm -f "$BASENAMES_FILE" "$PATHS_BY_NAME"; exit $rc' EXIT
git ls-files 2>/dev/null | sed 's#.*/##' | sort -u > "$BASENAMES_FILE" || true
git ls-files 2>/dev/null | awk -F/ '{ print $NF "\t" $0 }' | sort > "$PATHS_BY_NAME" || true

# A token is path-SHAPED but deliberately not a repo-relative citation.
is_exempt_shape() {
  local token="$1"
  case "$token" in
    *' '*|*$'\t'*) return 0 ;;          # multi-word: a command line, not a path
    *'://'*) return 0 ;;                # URL
    # Glob metacharacter. `[` and `]` are deliberately NOT in this set: in this
    # repository a bracketed segment is almost always a SvelteKit route
    # parameter (`[[electionTab]]`, `[slug]`, `[...rest]`), and exempting those
    # would blind the guard to the frontend's most-cited paths.
    *'*'*|*'?'*|*'{'*|*'}'*) return 0 ;;
    *'<'*|*'>'*) return 0 ;;            # `packages/<name>/` placeholder
    *"'"*|*'"'*) return 0 ;;            # quoted code literal (`'./filter'`), not a citation
    /*) return 0 ;;                     # absolute path or server route (`/@fs`)
    './'*|'../'*) return 0 ;;           # import specifier, relative to a root this guard cannot know
    '$'*) return 0 ;;                   # build alias (`$lib/…`) or rune (`$derived.by`)
  esac
  # bare file extension (`.js`, `.svelte`): a file KIND, not a file. Note this
  # must NOT catch dotted directories (`.claude/skills/…`, `.planning/…`).
  if [[ "$token" =~ ^\.[a-z]{2,5}$ ]]; then
    return 0
  fi
  # npm scope specifier carrying no filename extension (`@openvaa/core`)
  if [[ "$token" == @* ]] && [[ ! "$token" =~ \.[a-z]{2,5}$ ]]; then
    return 0
  fi
  # bare version string (`v2.15`, `1.0.0`)
  if [[ "$token" =~ ^v?[0-9]+(\.[0-9]+)*$ ]]; then
    return 0
  fi
  return 1
}

# A token looks like a repo-relative path citation.
is_path_shaped() {
  local token="$1"
  [[ "$token" == */* ]] && return 0
  [[ "$token" =~ \.[a-z]{2,5}$ ]] && return 0
  return 1
}

audit_file() {
  local file="$1"
  # Label by path, not basename: a whole-corpus run has 9 files called
  # SKILL.md and 16 called README.md.
  local label="${file#./}"
  label="${label#.claude/skills/}"

  if [[ ! -f "$file" ]]; then
    return
  fi

  # Tokens exempted by an inline marker in this file.
  local allowed=""
  allowed=$(command grep -oE '<!--[[:space:]]*skill-link-allow:[[:space:]]*[^[:space:]]+' "$file" 2>/dev/null \
    | sed -E 's/.*skill-link-allow:[[:space:]]*//' || true)

  # Backticked tokens outside fenced code blocks, de-duplicated.
  local tokens
  tokens=$(awk 'BEGIN { fenced = 0 }
                /^[[:space:]]*```/ { fenced = !fenced; next }
                fenced == 0 { print }' "$file" \
    | command grep -oE '`[^`]+`' 2>/dev/null | tr -d '`' | sort -u || true)

  local file_checked=0
  local file_dangling=0
  local file_skipped=0
  local details=""

  local token path lineno target total unique_path unique_count
  while IFS= read -r token; do
    [[ -z "$token" ]] && continue

    path="$token"
    lineno=""
    if [[ "$token" =~ ^(.+):([0-9]+)(-[0-9]+)?$ ]]; then
      path="${BASH_REMATCH[1]}"
      lineno="${BASH_REMATCH[2]}"
    fi

    is_path_shaped "$path" || continue

    if is_exempt_shape "$path"; then
      file_skipped=$((file_skipped + 1))
      continue
    fi

    if [[ -n "$allowed" ]] && printf '%s\n' "$allowed" | command grep -qxF "$token"; then
      file_skipped=$((file_skipped + 1))
      continue
    fi

    file_checked=$((file_checked + 1))

    target="$path"
    if [[ "$path" != */* ]]; then
      if [[ "$path" =~ ^[0-9]{3}-.+\.sql$ ]]; then
        # Check 3a — positional: the schema is cited by bare filename.
        target="$SCHEMA_DIR/$path"
      else
        # Check 3b — existence by basename anywhere in the tracked tree.
        if command grep -qxF "$path" "$BASENAMES_FILE"; then
          # Check 3c — line range, but only where the basename resolves to
          # exactly one tracked file. Ambiguous names are skipped, not guessed.
          if [[ -n "$lineno" ]]; then
            unique_path=$(awk -F'\t' -v n="$path" '$1 == n { print $2 }' "$PATHS_BY_NAME")
            unique_count=$(printf '%s' "$unique_path" | command grep -c . || true)
            if [[ "$unique_count" -eq 1 && -f "$unique_path" ]]; then
              total=$(wc -l < "$unique_path" | tr -d ' ')
              if [[ "$lineno" -gt "$total" ]]; then
                file_dangling=$((file_dangling + 1))
                details+="    $token  ($unique_path has $total lines)\n"
              fi
            fi
          fi
          continue
        fi
        file_dangling=$((file_dangling + 1))
        details+="    $token  (no file by that name in the repository)\n"
        continue
      fi
    fi

    if [[ ! -e "$target" ]]; then
      file_dangling=$((file_dangling + 1))
      details+="    $token  (no such file: $target)\n"
      continue
    fi

    if [[ -n "$lineno" && -f "$target" ]]; then
      total=$(wc -l < "$target" | tr -d ' ')
      if [[ "$lineno" -gt "$total" ]]; then
        file_dangling=$((file_dangling + 1))
        details+="    $token  (file has $total lines)\n"
      fi
    fi
  done <<< "$tokens"

  CHECKED=$((CHECKED + file_checked))
  DANGLING=$((DANGLING + file_dangling))
  SKIPPED=$((SKIPPED + file_skipped))

  if [[ "$file_dangling" -gt 0 ]]; then
    printf "  %-44s  DANGLING  %d of %d citations\n" "$label" "$file_dangling" "$file_checked"
    printf "$details"
  else
    printf "  %-44s  OK        (%d citations, %d skipped)\n" "$label" "$file_checked" "$file_skipped"
  fi
}

echo ""
echo "Skill Link Audit"
echo "================"
echo ""

if [[ $# -gt 0 ]]; then
  if [[ -d "$SKILLS_DIR/$1" ]]; then
    while IFS= read -r md; do
      audit_file "$md"
    done < <(find "$SKILLS_DIR/$1" -name '*.md' | sort)
  elif [[ -f "$1" ]]; then
    audit_file "$1"
  else
    echo "Skill or file not found: $1"
    exit 1
  fi
else
  while IFS= read -r md; do
    audit_file "$md"
  done < <(find "$SKILLS_DIR" -name '*.md' | sort)
  audit_file "CLAUDE.md"
fi

echo ""
echo "---"
echo "Checked: $CHECKED  Dangling: $DANGLING  Skipped: $SKIPPED"

if [[ "$DANGLING" -gt 0 ]]; then
  echo ""
  echo "Dangling citations point agents at files that do not exist."
  echo "Correct the path, or exempt a deliberately hypothetical one with an"
  echo "inline <!-- skill-link-allow: <token> --> marker naming that token."
  exit 1
fi
