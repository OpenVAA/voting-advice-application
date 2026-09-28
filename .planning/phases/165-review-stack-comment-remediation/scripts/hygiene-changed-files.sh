#!/usr/bin/env bash
#
# hygiene-changed-files.sh -- the per-changed-file comment-hygiene gate (165-CONTEXT D-04).
#
# The repo-wide `hygiene-grep-report.sh --assert-clean` is red at the stack tip by measurement
# (165-RESEARCH Pitfall 3), so it cannot be a phase gate. This script runs the same rule set --
# plus the patterns that set misses (Pitfall 4), the maintainer's no-historical-narrative rule and
# the codemod-reflow detectors -- over exactly the files a plan changed.
#
# Usage:
#   hygiene-changed-files.sh --files <path>...        check exactly the named paths
#   hygiene-changed-files.sh [--base <rev>]           check every path changed since <rev>
#   hygiene-changed-files.sh --self-test              run every layer over the committed fixtures
#
#   --files <path>...  The named paths. Each must be an existing regular file. A path under
#                      `.planning/` is a usage error here (it is allowed only in --self-test);
#                      a path under another exempt tree is reported as skipped.
#   --base <rev>       Default `ship/v2.15-12-planning`. The set is `git diff --name-only
#                      --diff-filter=d <rev>` (committed plus staged plus unstaged changes against
#                      <rev>) together with untracked, non-ignored files, so a new file cannot
#                      escape the gate by not having been `git add`ed yet.
#   --check-reads      Also require read-log coverage: every in-scope path's current
#                      `git hash-object` must appear, for that path, in a row of some
#                      `hygiene-reads/*.tsv` (written by record-hygiene-read.sh).
#   --report-only      Print everything, always exit 0.
#   --self-test        Copy each fixture into a throwaway git repository and run all five layers
#                      there. Dirty fixture: every layer must report at least one hit. Clean
#                      fixture: every layer must report zero. Any deviation exits 1.
#
# Scope filter, applied to the derived set and to --files alike: paths under `.planning/`,
# `.claude/`, `.agents/`, `CLAUDE.md` (the D-04 exempt trees), the generated
# `packages/supabase-types/src/database.ts`, and binary files are dropped.
#
# Layers. Each prints a labelled count and every hit as `path:line: text`:
#   1  codemod detector   `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` in its
#                         DRY-RUN mode, once per path under apps/ packages/ tests/. This script
#                         never passes `--apply` (forbidden): it is a detector here, and a
#                         gate that rewrites what it judges proves nothing. Fails on rule hits
#                         and on the residue reasons not-a-comment-span,
#                         unstrippable-section-anchor, ambiguous-reference and
#                         attributive-reference. todo-class, milestone-version and markdown-file
#                         residue is printed as `note:` and does not fail, and so is a `vN.M`
#                         version string outside a comment (the milestone-version rule on code). `[` and `]` in each
#                         path are escaped as `[[]` / `[]]` (globSync reads them as a class,
#                         Pitfall 2). The codemod only scans tracked files, so an untracked path
#                         prints a warning line.
#   2  strip patterns     decision ids, section signs, planning paths, plan numbers, task ids,
#                         bare phase/spike references not preceded by `see `, milestone tags.
#   3  narrative          historical narrative: "no longer", "previously", "was moved", ...
#   4  reflow damage      an inline `//` comment followed by code on a comment line; a comment
#                         line carrying a shell-continuation backslash followed by more text.
#   5  repo lint rule     `scripts/assert-comment-hygiene.mjs` once, repo-wide and read-only;
#                         only violations whose path is in the in-scope set count.
# Layers 2-4 use `git grep --no-index -P` (BSD grep on this host has no -P), which also covers
# untracked files.
#
# Allowlist: every `hygiene-allow/*.tsv` holds rows `path<TAB>exact trimmed line text<TAB>reason`.
# A layer 2-4 hit matching a row exactly prints as `allowed:` and does not fail. A row with an
# empty reason is ignored. See hygiene-allow/README.md. The allowlist is not applied in
# --self-test.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  clean (or --report-only, or --self-test passed)
#   1  residue found (or --self-test expectations not met)
#   2  usage error, tool error, or an empty in-scope set (under --report-only an empty set prints
#      `no changed files in scope` and exits 0)

set -euo pipefail
set -o pipefail

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
cd "$ROOT"

CODEMOD="$ROOT/.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs"
LINT="$ROOT/scripts/assert-comment-hygiene.mjs"
LINT_LIB="$ROOT/scripts/lib/comment-spans.mjs"
ALLOW_DIR="$SCRIPT_DIR/hygiene-allow"
READS_DIR="$SCRIPT_DIR/hygiene-reads"
FIXTURE_DIR="$SCRIPT_DIR/fixtures"

# The two files assert-comment-hygiene.mjs excludes by name. Its enumeration fails closed when an
# exclusion matches no tracked file, so the self-test's throwaway repository must carry them. If
# the guard's list changes, the self-test's layer 5 reports a tool error rather than a pass.
VENDORED="apps/frontend/static/fonts/inter.css apps/docs/src/lib/layouts/prism-vs.css"

MODE=""
BASE="ship/v2.15-12-planning"
CHECK_READS=0
REPORT_ONLY=0
NAMED=()

die_usage() { echo "hygiene-changed-files.sh: $1" >&2; exit 2; }

set_mode() {
  if [ -n "$MODE" ] && [ "$MODE" != "$1" ]; then die_usage "--$MODE and --$1 are mutually exclusive"; fi
  MODE="$1"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --files)
      set_mode files
      shift
      while [ "$#" -gt 0 ]; do
        case "$1" in --*) break ;; esac
        NAMED+=("$1")
        shift
      done
      ;;
    --base)
      set_mode base
      [ "$#" -ge 2 ] || die_usage "--base needs a revision"
      BASE="$2"
      shift 2
      ;;
    --check-reads) CHECK_READS=1; shift ;;
    --report-only) REPORT_ONLY=1; shift ;;
    --self-test) set_mode self-test; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die_usage "unknown argument: $1" ;;
  esac
done
[ -n "$MODE" ] || MODE=base

for tool in "$CODEMOD" "$LINT" "$LINT_LIB"; do
  [ -r "$tool" ] || { echo "hygiene-changed-files.sh: required tool missing: $tool" >&2; exit 2; }
done

TMP=$(mktemp -d "${TMPDIR:-/tmp}/hyg165.XXXXXX")
trap 'rm -rf "$TMP"' EXIT

# ── Helpers ────────────────────────────────────────────────────────────────

# Prints the exemption reason for a repo-relative path, or nothing when it is in scope.
exempt_reason() {
  case "$1" in
    .planning/*) echo "exempt tree .planning/" ;;
    .claude/*) echo "exempt tree .claude/" ;;
    .agents/*) echo "exempt tree .agents/" ;;
    CLAUDE.md) echo "exempt file CLAUDE.md" ;;
    packages/supabase-types/src/database.ts) echo "generated file" ;;
    *) : ;;
  esac
}

# Exit 0 when the file is binary. An empty file counts as text.
is_binary() {
  perl -e 'my $f = shift; exit(((-s $f) && -B $f) ? 0 : 1)' "$1"
}

# Escape globSync's character-class brackets in one pass, so substitution order cannot corrupt it.
glob_escape() {
  node -e 'process.stdout.write(process.argv[1].replace(/[[\]]/g, (c) => (c === "[" ? "[[]" : "[]]")))' "$1"
}

# Concatenate every TSV in a directory behind a sentinel line, so awk's NR==FNR idiom still works
# when the directory holds no rows at all.
concat_tsv() {
  local dir="$1" out="$2" f
  echo "#sentinel" > "$out"
  for f in "$dir"/*.tsv; do
    [ -f "$f" ] || continue
    cat "$f" >> "$out"
    echo >> "$out"
  done
}

# ── The five layers ────────────────────────────────────────────────────────
# run_layers <list-file> <label> <apply-allowlist 0|1> <lint-script>
# Runs in the current directory (the repo root, or a self-test repository). Sets L1..L5 and
# TOOL_ERR.
L1=0; L2=0; L3=0; L4=0; L5=0; TOOL_ERR=0

emit_hits() {
  # stdin: lines `F<TAB>text`, `A<TAB>text`, `N<TAB>text`. Prints them; echoes the F count last.
  local kind text n=0
  while IFS=$'\t' read -r kind text; do
    case "$kind" in
      F) echo "    $text"; n=$((n + 1)) ;;
      A) echo "    allowed: $text" ;;
      N) echo "    note: $text" ;;
      *) : ;;
    esac
  done
  echo "__COUNT__ $n"
}

count_of() { sed -n 's/^__COUNT__ //p' "$1"; }
print_hits() { grep -v '^__COUNT__ ' "$1" || true; }

grep_layer() {
  # grep_layer <layer> <id> <pcre> ; uses FILES and ALLOW_FILE; adds to L<layer>.
  local layer="$1" id="$2" pat="$3" st=0 n
  git --literal-pathspecs grep --no-index -I -n -P -e "$pat" -- "${FILES[@]}" > "$TMP/g.out" 2> "$TMP/g.err" || st=$?
  if [ "$st" -gt 1 ]; then
    echo "    TOOL ERROR (layer $layer, $id): git grep exited $st"
    sed 's/^/      /' "$TMP/g.err"
    TOOL_ERR=1
    return 0
  fi
  awk -F '\t' -v id="$id" -v useallow="$APPLY_ALLOW" '
    NR == FNR { if ($0 !~ /^#/ && $3 != "") allow[$1 SUBSEP $2] = 1; next }
    {
      c1 = index($0, ":"); p = substr($0, 1, c1 - 1); rest = substr($0, c1 + 1)
      c2 = index(rest, ":"); ln = substr(rest, 1, c2 - 1); txt = substr(rest, c2 + 1)
      t = txt; gsub(/^[ \t]+|[ \t]+$/, "", t)
      if (useallow == "1" && ((p SUBSEP t) in allow)) printf "A\t%s:%s: [%s] %s\n", p, ln, id, t
      else printf "F\t%s:%s: [%s] %s\n", p, ln, id, t
    }' "$ALLOW_FILE" "$TMP/g.out" | emit_hits > "$TMP/g.hits"
  n=$(count_of "$TMP/g.hits")
  print_hits "$TMP/g.hits"
  case "$layer" in
    2) L2=$((L2 + n)) ;;
    3) L3=$((L3 + n)) ;;
    4) L4=$((L4 + n)) ;;
  esac
}

run_layers() {
  local list="$1" label="$2" lint="$4" f glob st n expected parsed
  APPLY_ALLOW="$3"
  L1=0; L2=0; L3=0; L4=0; L5=0
  FILES=()
  while IFS= read -r f; do FILES+=("$f"); done < "$list"
  ALLOW_FILE="$TMP/allow.tsv"
  if [ "$APPLY_ALLOW" = "1" ]; then concat_tsv "$ALLOW_DIR" "$ALLOW_FILE"; else echo "#sentinel" > "$ALLOW_FILE"; fi

  echo "== $label: ${#FILES[@]} file(s) in scope"

  # Layer 1 -- the codemod, dry-run, as a detector.
  echo "  -- layer 1 (codemod detector)"
  for f in "${FILES[@]}"; do
    case "$f" in
      apps/*|packages/*|tests/*) ;;
      *) echo "    note: $f is outside the codemod's scope (apps/ packages/ tests/); layers 2-5 only"; continue ;;
    esac
    glob=$(glob_escape "$f")
    st=0
    rm -f "$TMP/cm.json"
    node "$CODEMOD" --json-out "$TMP/cm.json" --files "$glob" > "$TMP/cm.out" 2> "$TMP/cm.err" || st=$?
    if [ "$st" -eq 1 ] && grep -q 'No scannable tracked files matched' "$TMP/cm.err"; then
      echo "    WARNING: the codemod did not scan $f (untracked, or an extension it does not classify); layers 2-5 still cover it"
      continue
    fi
    if [ "$st" -ne 0 ] || [ ! -f "$TMP/cm.json" ]; then
      echo "    TOOL ERROR (layer 1): the codemod exited $st on $f"
      sed 's/^/      /' "$TMP/cm.err"
      TOOL_ERR=1
      continue
    fi
    awk -v path="$f" '
      /^    L[0-9]+  / {
        ln = $1; sub(/^L/, "", ln)
        rest = $0; sub(/^    L[0-9]+  /, "", rest)
        if (index(rest, "RESIDUE (") > 0) {
          reason = rest; sub(/^.*RESIDUE \(/, "", reason); sub(/\).*$/, "", reason)
          txt = rest; sub(/^[^)]*\)  /, "", txt)
          if (reason == "todo-class" || reason == "milestone-version" || reason == "markdown-file")
            printf "N\t%s:%s: [residue %s] %s\n", path, ln, reason, txt
          else if (reason == "not-a-comment-span" && txt ~ /^"v[0-9]+\.[0-9]+"$/)
            printf "V\t%s:%s: [residue %s, a version string in code] %s\n", path, ln, reason, txt
          else printf "F\t%s:%s: [residue %s] %s\n", path, ln, reason, txt
        } else if (index(rest, "PROSE-REVIEW") > 0 || index(rest, "degenerate-line") == 1) {
          printf "N\t%s:%s: [%s]\n", path, ln, rest
        } else printf "F\t%s:%s: [%s]\n", path, ln, rest
      }' "$TMP/cm.out" > "$TMP/cm.kinds"
    # A `vN.M` match outside a comment is the codemod's milestone-version rule firing on code (an
    # import URL such as `jose@v5.9.6`), which the detector reports but must not fail on. The codemod
    # checks the span before the rule, so it arrives as not-a-comment-span; count it out of the
    # reconciliation below. Real milestone tags stay caught by layer 2's milestone-tag pattern.
    nv=$(grep -c '^V' "$TMP/cm.kinds" || true)
    sed 's/^V\t/N\t/' "$TMP/cm.kinds" | emit_hits > "$TMP/cm.hits"
    n=$(count_of "$TMP/cm.hits")
    print_hits "$TMP/cm.hits"
    # Reconcile the parsed detail against the codemod's own JSON summary: two independent
    # readings of one run must agree, or the parse has drifted from the codemod's output.
    expected=$(node -e '
      const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf-8"));
      const failing = ["not-a-comment-span", "unstrippable-section-anchor", "ambiguous-reference", "attributive-reference"];
      process.stdout.write(String(s.totalHits + failing.reduce((a, r) => a + (s.byReason[r] || 0), 0)));
    ' "$TMP/cm.json")
    expected=$((expected - nv))
    if [ "$expected" != "$n" ]; then
      echo "    TOOL ERROR (layer 1): parsed $n failing item(s) on $f but the codemod summary says $expected"
      TOOL_ERR=1
    fi
    L1=$((L1 + expected))
  done
  echo "  layer 1 codemod-detector: $L1"

  # Layer 2 -- strip patterns.
  echo "  -- layer 2 (strip patterns)"
  grep_layer 2 decision-id-long '\bD-\d{2,3}-\d{2}\b'
  grep_layer 2 decision-id-bare '\bD-\d{2}\b(?!-\d{2})'
  grep_layer 2 decision-id-alpha '\bD-[A-Z]+-\d+\b'
  grep_layer 2 section-sign '§'
  grep_layer 2 planning-path '\.planning/'
  grep_layer 2 plan-number '(?i)\bplans?\s+\d+[-.]\d+'
  grep_layer 2 plan-id '\b1\d{2}(\.\d+)?-\d{2}\b'
  grep_layer 2 task-id '\b[A-Z]{3,}-\d{2}\b'
  grep_layer 2 threat-id '\bT-\d{3}(\.\d+)?-\d{2}\b'
  grep_layer 2 review-id '\b(CR|WR|IN)-\d{2}\b'
  grep_layer 2 bold-ref '\*\*[A-Z]\d+(\([a-z]\))?\*\*'
  grep_layer 2 phase-ref '(?i)(?<!see\s)\bphases?\s+\d+'
  grep_layer 2 spike-ref '(?i)(?<!see\s)\bspikes?[\s\-/]\d+'
  grep_layer 2 milestone-tag '(?<![\w.])v2\.\d{1,2}(?![\d.])'
  echo "  layer 2 strip-patterns: $L2"

  # Layer 3 -- historical narrative.
  echo "  -- layer 3 (narrative)"
  grep_layer 3 narrative '(?i)\b(no longer|previously|formerly|used to be|was moved|moved (here|out|from)|before this (fix|change|phase|commit)|this (phase|plan|milestone))\b'
  echo "  layer 3 narrative: $L3"

  # Layer 4 -- reflow damage.
  echo "  -- layer 4 (reflow detectors)"
  grep_layer 4 inline-comment-swallows-code '^\s*(\*|//|--|#)\s.*\s//\s.*\b(const|let|import|await|return|export)\b'
  grep_layer 4 continuation-backslash-then-text '^\s*(\*|//|#).*\\\s+\S'
  echo "  layer 4 reflow-detectors: $L4"

  # Layer 5 -- the repo's own comment-hygiene lint rule, filtered to the in-scope set.
  echo "  -- layer 5 (repo lint rule)"
  st=0
  node "$lint" > "$TMP/lint.out" 2> "$TMP/lint.err" || st=$?
  printf '%s\n' "${FILES[@]}" > "$TMP/scope.now"
  awk '
    NR == FNR { inscope[$0] = 1; next }
    {
      line = $0
      if (sub(/^\[ERROR\] [^:]*: /, "", line) == 0) next
      if (match(line, /^[^:]+:[0-9]+: /) == 0) { print "X\t" $0; next }
      head = substr(line, 1, RLENGTH - 2)
      c = index(head, ":"); p = substr(head, 1, c - 1)
      if (p in inscope) print "F\t" line
      else print "O\t" line
    }' "$TMP/scope.now" "$TMP/lint.err" > "$TMP/lint.class"
  parsed=$(grep -c -v '^X' "$TMP/lint.class" || true)
  if grep -q '^X' "$TMP/lint.class" || { [ "$st" -ne 0 ] && [ "$parsed" -eq 0 ]; }; then
    echo "    TOOL ERROR (layer 5): assert-comment-hygiene.mjs exited $st with a message this gate cannot attribute to a file"
    awk -F '\t' '$1 == "X" { print "      " substr($0, 3) }' "$TMP/lint.class"
    sed 's/^/      /' "$TMP/lint.out"
    TOOL_ERR=1
  fi
  L5=$(grep -c '^F' "$TMP/lint.class" || true)
  awk -F '\t' '$1 == "F" { print "    " substr($0, 3) }' "$TMP/lint.class"
  echo "  layer 5 repo-lint-rule: $L5"
}

# ── Self-test ──────────────────────────────────────────────────────────────

self_test_one() {
  # self_test_one <fixture-name> ; runs in a throwaway repository, sets L1..L5 and TOOL_ERR.
  local name="$1" work="$TMP/selftest-$1" v
  mkdir -p "$work/scripts/lib" "$work/tests/hygiene-fixture"
  git -C "$work" init -q
  cp "$LINT" "$work/scripts/assert-comment-hygiene.mjs"
  cp "$LINT_LIB" "$work/scripts/lib/comment-spans.mjs"
  for v in $VENDORED; do
    mkdir -p "$work/$(dirname "$v")"
    cp "$ROOT/$v" "$work/$v"
    git -C "$work" add -- "$v"
  done
  cp "$FIXTURE_DIR/$name" "$work/tests/hygiene-fixture/$name"
  git -C "$work" add -- "tests/hygiene-fixture/$name"
  echo "tests/hygiene-fixture/$name" > "$work/.scope"
  (cd "$work" && run_layers "$work/.scope" "self-test fixture $name" 0 "$work/scripts/assert-comment-hygiene.mjs"
   echo "__L__ $L1 $L2 $L3 $L4 $L5 $TOOL_ERR") > "$TMP/st-$name.out"
  grep -v '^__L__ ' "$TMP/st-$name.out"
  set -- $(sed -n 's/^__L__ //p' "$TMP/st-$name.out")
  L1=$1; L2=$2; L3=$3; L4=$4; L5=$5
  [ "$6" = "0" ] || TOOL_ERR=1
}

if [ "$MODE" = "self-test" ]; then
  FAIL=0
  for fx in hygiene-dirty.ts hygiene-clean.ts; do
    [ -r "$FIXTURE_DIR/$fx" ] || { echo "hygiene-changed-files.sh: fixture missing: $FIXTURE_DIR/$fx" >&2; exit 2; }
  done
  self_test_one hygiene-dirty.ts
  echo "  dirty counts: layer1=$L1 layer2=$L2 layer3=$L3 layer4=$L4 layer5=$L5 (each must be >= 1)"
  for c in "$L1" "$L2" "$L3" "$L4" "$L5"; do [ "$c" -ge 1 ] || FAIL=1; done
  self_test_one hygiene-clean.ts
  echo "  clean counts: layer1=$L1 layer2=$L2 layer3=$L3 layer4=$L4 layer5=$L5 (each must be 0)"
  for c in "$L1" "$L2" "$L3" "$L4" "$L5"; do [ "$c" -eq 0 ] || FAIL=1; done
  if [ "$TOOL_ERR" -ne 0 ]; then echo "SELF-TEST: TOOL ERROR"; exit 2; fi
  if [ "$FAIL" -ne 0 ]; then echo "SELF-TEST: FAILED"; exit 1; fi
  echo "SELF-TEST: PASSED"
  exit 0
fi

# ── Build the in-scope set ─────────────────────────────────────────────────

SCOPE="$TMP/scope.lst"
: > "$SCOPE"

EXEMPT_SKIPPED=0
add_candidate() {
  local p="$1" why
  why=$(exempt_reason "$p")
  if [ -n "$why" ]; then
    EXEMPT_SKIPPED=$((EXEMPT_SKIPPED + 1))
    # The derived set routinely carries dozens of planning files; name them only when asked for.
    [ "$MODE" = "files" ] && echo "skipped: $p ($why)"
    return 0
  fi
  if [ ! -f "$p" ]; then echo "skipped: $p (not a regular file in the working tree)"; return 0; fi
  if is_binary "$p"; then echo "skipped: $p (binary)"; return 0; fi
  grep -qxF -- "$p" "$SCOPE" || echo "$p" >> "$SCOPE"
}

if [ "$MODE" = "files" ]; then
  [ "${#NAMED[@]}" -gt 0 ] || die_usage "--files needs at least one path"
  for p in "${NAMED[@]}"; do
    p="${p#./}"
    case "$p" in "$ROOT"/*) p="${p#"$ROOT"/}" ;; esac
    case "$p" in .planning/*) die_usage "$p is under .planning/; a .planning/ path is allowed only in --self-test" ;; esac
    [ -e "$p" ] || die_usage "no such file: $p"
    [ -f "$p" ] || die_usage "not a regular file: $p"
    add_candidate "$p"
  done
else
  git rev-parse --verify --quiet "${BASE}^{commit}" > /dev/null || die_usage "--base revision does not resolve: $BASE"
  st=0
  git diff --name-only -z --diff-filter=d "$BASE" > "$TMP/diff.z" || st=$?
  [ "$st" -eq 0 ] || { echo "hygiene-changed-files.sh: git diff exited $st" >&2; exit 2; }
  st=0
  git ls-files -z --others --exclude-standard > "$TMP/untracked.z" || st=$?
  [ "$st" -eq 0 ] || { echo "hygiene-changed-files.sh: git ls-files exited $st" >&2; exit 2; }
  while IFS= read -r -d '' p; do add_candidate "$p"; done < "$TMP/diff.z"
  while IFS= read -r -d '' p; do add_candidate "$p"; done < "$TMP/untracked.z"
  echo "skipped: $EXEMPT_SKIPPED path(s) under the exempt trees or generated"
fi

if [ ! -s "$SCOPE" ]; then
  echo "no changed files in scope"
  if [ "$REPORT_ONLY" -eq 1 ]; then exit 0; fi
  echo "hygiene-changed-files.sh: an empty in-scope set proves nothing; exiting 2" >&2
  exit 2
fi

if [ "$MODE" = "files" ]; then LABEL="named files"; else LABEL="changed since $BASE"; fi
run_layers "$SCOPE" "$LABEL" 1 "$LINT"

# ── Read-log coverage ──────────────────────────────────────────────────────
UNREAD=0
if [ "$CHECK_READS" -eq 1 ]; then
  echo "  -- read-log coverage"
  concat_tsv "$READS_DIR" "$TMP/reads.tsv"
  while IFS= read -r p; do
    blob=$(git hash-object -- "$p")
    if awk -F'\t' -v p="$p" -v b="$blob" '$1 == p && $2 == b { found = 1 } END { exit found ? 0 : 1 }' "$TMP/reads.tsv"; then
      :
    else
      echo "    unread: $p (current blob $blob has no read-log row)"
      UNREAD=$((UNREAD + 1))
    fi
  done < "$SCOPE"
  echo "  read-log unread: $UNREAD"
fi

TOTAL=$((L1 + L2 + L3 + L4 + L5 + UNREAD))
echo "== total failing items: $TOTAL (layer1=$L1 layer2=$L2 layer3=$L3 layer4=$L4 layer5=$L5 unread=$UNREAD)"

if [ "$REPORT_ONLY" -eq 1 ]; then
  echo "MODE: report-only (exit 0 regardless)"
  exit 0
fi
if [ "$TOOL_ERR" -ne 0 ]; then
  echo "VERDICT: TOOL ERROR"
  exit 2
fi
if [ "$TOTAL" -gt 0 ]; then
  echo "VERDICT: RESIDUE FOUND"
  exit 1
fi
echo "VERDICT: CLEAN"
exit 0
