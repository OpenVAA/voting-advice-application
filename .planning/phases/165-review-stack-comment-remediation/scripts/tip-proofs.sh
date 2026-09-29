#!/usr/bin/env bash
#
# tip-proofs.sh -- re-derive, from the working tree at run time, the evidence behind every
# review-comment disposition that needs no code change (split-artifact, already-fixed, wont-fix).
#
# Usage:
#   tip-proofs.sh [-v] [C-<id>|<id>]...
#
#   With no id, every proof runs, in file order. With ids, only those run.
#   -v   Also print each passing proof's detail lines (a failing proof's are always printed).
#   -l   List the proof ids and exit.
#
# Output on stdout: one `C-<id><TAB>PASS|FAIL` line per proof, nothing else. Detail lines go
# to stderr, indented, so a caller counting result lines reads stdout only.
#
# Each `proof_C_<id>` function checks the tip property its disposition depends on -- a file is
# tracked, a caller passes the argument, an alias is registered -- never the text of the review
# comment (D-01). Each runs in its own subshell under `set -e`, so one failing proof cannot abort
# the others. Helpers return explicit statuses: errexit is suspended inside any function called
# from an `||` list, so no helper relies on it.
#
# Proofs that read a file a later plan of phase 165 edits say so in a `LATER PLAN:` comment;
# plan 165-36 re-runs every proof at the final tip (`ledger-check.sh --final`).
#
# Exit codes:
#   0  every proof that ran passed
#   1  at least one proof failed
#   2  usage error (an unknown id, an unknown flag)

set -euo pipefail
set -o pipefail
# No globbing anywhere: route paths such as `[questionId]` are passed unquoted to helpers that take file lists.
set -f

usage() { sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'; }

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SELF="$SCRIPT_DIR/$(basename "${BASH_SOURCE[0]}")"
ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
PHASE_DIR=$(dirname "$SCRIPT_DIR")
ABSENT="$SCRIPT_DIR/assert-absent.sh"
cd "$ROOT"

# The twelve review slices, by head commit. Commit ids, not branch names, so the proofs survive
# the ship branches being deleted after merge. Index N-1 is slice N, PR #875+N.
SLICES=(
  edde88508 # ship/v2.15-01-shared-packages  #876
  5f2ffe900 # ship/v2.15-02-supabase         #877
  390657cf1 # ship/v2.15-03-dev-seed         #878
  81e54584a # ship/v2.15-04-e2e-tests        #879
  41bee4002 # ship/v2.15-05-frontend-lib     #880
  fa320cc33 # ship/v2.15-06-frontend-routes  #881
  2a2cce8ed # ship/v2.15-07-frontend-shell   #882
  23dfc71af # ship/v2.15-08-i18n-messages    #883
  7b5749303 # ship/v2.15-09-docs             #884
  83c941dff # ship/v2.15-10-experimental-pkgs #885
  95eecbc26 # ship/v2.15-11-root-config      #886
  8efd20606 # ship/v2.15-12-planning         #887
)

TMPD=$(mktemp -d "${TMPDIR:-/tmp}/tipproofs165.XXXXXX")
trap 'rm -rf "$TMPD"' EXIT

# ── Helpers ───────────────────────────────────────────────────────────────
# Every helper prints what it established and returns 0, or prints `FAIL: ...` and returns 1.

say() { printf '%s\n' "$*"; }
nope() {
  say "FAIL: $*"
  return 1
}
scratch() { mktemp "$TMPD/s.XXXXXX"; }

# tracked <path>: the path is in the index (literal pathspec, so `[jobId]` and `(voters)` are not globs).
tracked() {
  if git --literal-pathspecs ls-files --error-unmatch -- "$1" > /dev/null 2>&1; then
    say "tracked: $1"
    return 0
  fi
  nope "not tracked: $1"
}

# strip_comments <out> <file>...: the files concatenated, with comments removed. TS/JS/Svelte are
# tokenised so a comment opener inside a string literal (a `/**` glob, a URL) is not a comment and a
# string inside a comment is not code; Svelte also loses HTML comments. SQL loses whole-line `--`
# comments; anything else loses whole-line `#` comments. Regex literals are not tokenised.
JS_STRIP='s{("(?:\\.|[^"\\\n])*"|\x27(?:\\.|[^\x27\\\n])*\x27|`(?:\\.|[^`\\])*`)|//[^\n]*|/\*.*?\*/}{defined $1 ? $1 : ""}gse'
strip_comments() {
  local out=$1 f st
  shift
  : > "$out"
  for f in "$@"; do
    [ -r "$f" ] || { nope "cannot read $f"; return 1; }
    st=0
    case "$f" in
      *.svelte) perl -0777 -pe "s{<!--.*?-->}{}gs; $JS_STRIP" "$f" >> "$out" || st=$? ;;
      *.ts | *.js | *.mjs | *.cjs) perl -0777 -pe "$JS_STRIP" "$f" >> "$out" || st=$? ;;
      *.sql) perl -0777 -pe 's{^[ \t]*--[^\n]*\n}{}gm' "$f" >> "$out" || st=$? ;;
      *) perl -0777 -pe 's{^[ \t]*#[^\n]*\n}{}gm' "$f" >> "$out" || st=$? ;;
    esac
    [ "$st" -eq 0 ] || { nope "perl exited $st stripping $f"; return 1; }
  done
  [ -s "$out" ] || { nope "no code left after stripping comments from: $*"; return 1; }
  return 0
}

# _match <pcre> <file>: 0 when the PCRE (perl, /m) matches the whole file, 1 when not, 2 on error.
_match() {
  local st=0
  PAT="$1" perl -0777 -e 'local $/; my $t = <STDIN>; defined $t or exit 2; exit(($t =~ /$ENV{PAT}/m) ? 0 : 1)' < "$2" || st=$?
  return "$st"
}

# has_code <pcre> <file>...: the comment-stripped files match.
has_code() {
  local re=$1 t st=0
  shift
  t=$(scratch)
  strip_comments "$t" "$@" || return 1
  _match "$re" "$t" || st=$?
  case "$st" in
    0) say "code matches /$re/ in: $*"; return 0 ;;
    1) nope "no code match for /$re/ in: $*" ;;
    *) nope "perl exited $st matching /$re/" ;;
  esac
}

# lacks_code <pcre> <file>...: the comment-stripped files do not match.
lacks_code() {
  local re=$1 t st=0
  shift
  t=$(scratch)
  strip_comments "$t" "$@" || return 1
  _match "$re" "$t" || st=$?
  case "$st" in
    1) say "no code match for /$re/ in: $*"; return 0 ;;
    0) nope "code matches /$re/ in: $*" ;;
    *) nope "perl exited $st matching /$re/" ;;
  esac
}

# code_value <pcre-with-one-group> <file>...: print the first capture from the comment-stripped files.
code_value() {
  local re=$1 t st=0
  shift
  t=$(scratch)
  strip_comments "$t" "$@" > /dev/null || return 1
  PAT="$re" perl -0777 -e 'local $/; my $t = <STDIN>; if (defined $t && $t =~ /$ENV{PAT}/m) { print "$1\n"; exit 0 } exit 1' < "$t" || st=$?
  return "$st"
}

# absent <pcre> -- <pathspec>...: assert-absent.sh, status read directly (0 absent / 1 match / 2 error).
absent() {
  local re=$1 st=0 out
  out=$(scratch)
  bash "$ABSENT" "$@" > "$out" 2>&1 || st=$?
  case "$st" in
    0) shift 2; say "absent: /$re/ in $*"; return 0 ;;
    1) sed 's/^/  /' "$out"; nope "present: /$re/" ;;
    *) sed 's/^/  /' "$out"; nope "assert-absent.sh exited $st for /$re/" ;;
  esac
}

# is_ancestor <a> <b>: 0 when a is an ancestor of (or equal to) b, 1 when not, 2 on a git error.
is_ancestor() {
  local st=0
  git merge-base --is-ancestor "$1" "$2" 2> /dev/null || st=$?
  case "$st" in
    0 | 1) return "$st" ;;
    *) return 2 ;;
  esac
}

# slice_of <commit>: the first review slice containing the commit, as `#8NN`, or `none`.
slice_of() {
  local i=0 st
  while [ "$i" -lt "${#SLICES[@]}" ]; do
    st=0
    is_ancestor "$1" "${SLICES[$i]}" || st=$?
    if [ "$st" -eq 0 ]; then
      say "#$((876 + i))"
      return 0
    fi
    i=$((i + 1))
  done
  say none
}

# added_in <path>: the slice that first adds the path, as `#8NN`.
added_in() {
  local t c
  t=$(scratch)
  git log --diff-filter=A --format=%H -- "$1" > "$t"
  c=$(tail -n 1 "$t")
  [ -n "$c" ] || { nope "no commit adds $1"; return 1; }
  slice_of "$c"
}

# ls_matching <out> <perl-regex> <pathspec>...: tracked files under the pathspecs whose path matches.
ls_matching() {
  local out=$1 re=$2 t st=0
  shift 2
  t=$(scratch)
  git --literal-pathspecs ls-files -- "$@" > "$t" 2> /dev/null || st=$?
  [ "$st" -eq 0 ] || { nope "git ls-files exited $st for $*"; return 1; }
  RE="$re" perl -ne 'print if /$ENV{RE}/' "$t" > "$out"
  return 0
}

# adapter_files <out>: the Supabase adapter's non-test TypeScript sources. The proofs search the
# whole directory rather than one file, because plan 165-11 moves helpers into sibling files.
adapter_files() {
  ls_matching "$1" '^(?!.*\.test\.ts$).*\.ts$' apps/frontend/src/lib/api/adapters/supabase || return 1
  [ -s "$1" ] || { nope "no adapter sources found"; return 1; }
  return 0
}

# every_call_passes <callee-literal> <arg> <file>...: the comment-stripped files make at least one
# call `<callee-literal>` followed by an object argument, and every such call passes `<arg>: this.projectId`.
every_call_passes() {
  local callee=$1 arg=$2 t st=0 out
  shift 2
  t=$(scratch)
  strip_comments "$t" "$@" || return 1
  out=$(CALLEE="$callee" ARG="$arg" perl -0777 -e '
    local $/; my $t = <STDIN>; my ($n, $bad) = (0, 0);
    while ($t =~ /\Q$ENV{CALLEE}\E\x27(\s*,\s*\{[^}]*\})?/g) {
      $n++; my $a = defined $1 ? $1 : ""; $bad++ unless $a =~ /\b\Q$ENV{ARG}\E:\s*this\.projectId\b/;
    }
    print "$n $bad\n"; exit(($n > 0 && $bad == 0) ? 0 : 1)' < "$t") || st=$?
  case "$st" in
    0) say "every ${callee}' call (${out%% *}) passes $arg: this.projectId"; return 0 ;;
    1) nope "${callee}' calls/without $arg: ${out:-none}" ;;
    *) nope "perl exited $st" ;;
  esac
}

# callback_path: the value of the CandAppAuthCallback route constant.
callback_path() {
  code_value 'CandAppAuthCallback:\s*\x27([^\x27]+)\x27' apps/frontend/src/lib/routes/route.ts
}

# import_resolves <file> <module-suffix>: the file imports at least one relative specifier ending in
# the suffix, and every such specifier resolves to a tracked `.ts` file.
import_resolves() {
  local file=$1 suf=$2 t specs spec dir abs rel n=0
  t=$(scratch)
  specs=$(scratch)
  strip_comments "$t" "$file" || return 1
  SUF="$suf" perl -ne 'while (/from\s+\x27([^\x27]*\Q$ENV{SUF}\E)\x27/g) { print "$1\n" }' "$t" > "$specs"
  while IFS= read -r spec; do
    case "$spec" in
      .*) ;;
      *) nope "$file imports $spec, which is not relative"; return 1 ;;
    esac
    dir=$(dirname "$file")/$(dirname "$spec")
    abs=$(cd "$dir" 2> /dev/null && pwd -P) || { nope "$file: directory of $spec does not exist"; return 1; }
    rel=${abs#"$ROOT"/}/$(basename "$spec").ts
    tracked "$rel" || return 1
    say "$file imports $spec -> $rel"
    n=$((n + 1))
  done < "$specs"
  [ "$n" -gt 0 ] || { nope "$file imports nothing ending in $suf"; return 1; }
  return 0
}

# retired_claim_absent: no frontend product code reads the retired `user_roles` claim key. Test files
# are excluded (they assert the retired key is ignored), and so are comment lines: the pattern skips
# lines opening with `//`, `/*`, `*` or `<!--`, because the surviving mentions are docblocks that
# describe the pre-grants token shape, and a comment reads nothing.
# Test files are excluded with the directory-anchored `:(exclude)<dir>/*.test.ts`. The short form
# `:!*.test.ts` next to a positive pathspec makes `git ls-files` (2.50.1 here) list no file at all,
# which assert-absent.sh correctly refuses as a pathspec error.
retired_claim_absent() {
  absent '^(?!\s*(?://|/\*|\*|<!--)).*\buser_roles\b' -- apps/frontend/src ':(exclude)apps/frontend/src/*.test.ts' || return 1
  local t st=0
  t=$(scratch)
  git grep -h -c -P '\buser_roles\b' -- apps/frontend/src ':(exclude)apps/frontend/src/*.test.ts' > "$t" 2> /dev/null || st=$?
  case "$st" in
    0) say "comment-only mentions excluded: $(awk '{ s += $1 } END { print s + 0 }' "$t")" ;;
    1) say "comment-only mentions excluded: 0" ;;
    *) nope "git grep exited $st counting user_roles mentions"; return 1 ;;
  esac
}

# layouts_alias_registered: `$layouts` resolves in both the Kit/Vite config and the vitest config,
# and its `main` entry exists. LATER PLAN: 165-19, 165-20 and 165-30 edit svelte.config.js, 165-06
# edits vitest.config.ts; the alias entries must survive.
layouts_alias_registered() {
  has_code '\$layouts[\x27"]?\s*:\s*path\.resolve\([^)]*src/lib/layouts[\x27"]\s*\)' apps/frontend/svelte.config.js || return 1
  has_code 'find:\s*[\x27"]\$layouts[\x27"]\s*,\s*replacement:\s*path\.resolve\([^)]*src/lib/layouts[\x27"]\s*\)' apps/frontend/vitest.config.ts || return 1
  tracked apps/frontend/src/lib/layouts/main/index.ts
}

# ── Proofs ────────────────────────────────────────────────────────────────

# C-4080507248: staticSettings pageSize equals PostgREST's [api] max_rows, and that max_rows value arrives after #876.
proof_C_4080507248() {
  local toml=apps/supabase/supabase/config.toml ss=packages/app-shared/src/settings/staticSettings.ts
  local max page t commit st slice
  max=$(awk '/^\[/ { s = $0 } s == "[api]" && /^[ \t]*max_rows[ \t]*=/ { sub(/#.*/, ""); gsub(/[^0-9]/, ""); print; exit }' "$toml")
  [ -n "$max" ] || nope "no max_rows in the [api] section of $toml"
  page=$(code_value 'pageSize:\s*(\d+)' "$ss") || nope "no pageSize in $ss"
  [ "$max" = "$page" ] || nope "staticSettings pageSize $page differs from config.toml [api] max_rows $max"
  say "config.toml [api] max_rows = $max; staticSettings pageSize: $page"
  t=$(scratch)
  git log -1 --format=%H -S "max_rows = $max" -- "$toml" > "$t"
  commit=$(head -n 1 "$t")
  [ -n "$commit" ] || nope "git log -S found no commit that sets max_rows = $max"
  st=0
  is_ancestor "$commit" "${SLICES[0]}" || st=$?
  case "$st" in
    0) nope "max_rows = $max is already set in #876 (by $commit), so this is not a split artifact" ;;
    1) ;;
    *) nope "git merge-base failed for $commit" ;;
  esac
  is_ancestor "$commit" HEAD || nope "$commit is not reachable from HEAD"
  slice=$(slice_of "$commit")
  say "evidence: max_rows = $max set by $(git rev-parse --short=9 "$commit") ($slice), not in #876"
}

# C-4080507280: font.url names a same-origin stylesheet that is tracked with every font file it references, and the root layout links it.
proof_C_4080507280() {
  local ss=packages/app-shared/src/settings/staticSettings.ts url css refs ref n=0
  url=$(code_value 'font:\s*\{[^}]*?\burl:\s*\x27([^\x27]+)\x27' "$ss") || nope "no font.url in $ss"
  case "$url" in
    /*) ;;
    *) nope "font.url $url is not a same-origin path" ;;
  esac
  css="apps/frontend/static$url"
  tracked "$css"
  refs=$(scratch)
  perl -ne 'while (/url\(\s*["\x27]?([^)"\x27]+)/g) { print "$1\n" }' "$css" > "$refs"
  while IFS= read -r ref; do
    case "$ref" in
      http* | //*) nope "$css references a remote font: $ref" ;;
    esac
    tracked "$(dirname "$css")/${ref#./}"
    n=$((n + 1))
  done < "$refs"
  [ "$n" -gt 0 ] || nope "$css references no font file"
  has_code 'staticSettings\.font\??\.url' 'apps/frontend/src/routes/+layout.svelte'
  say "evidence: font.url $url is tracked with its $n woff2 files, added in $(added_in "$css")"
}

# C-4080520022: the candidate auth callback route exists at the path the route constant names, and config.toml allowlists that path with and without a locale segment.
proof_C_4080520022() {
  local route='apps/frontend/src/routes/api/candidate/auth/callback/+server.ts' toml=apps/supabase/supabase/config.toml
  local path derived t st=0
  tracked "$route"
  path=$(callback_path) || nope "no CandAppAuthCallback in route.ts"
  derived="/${route#apps/frontend/src/routes/}"
  derived=${derived%/+server.ts}
  [ "$path" = "$derived" ] || nope "CandAppAuthCallback is $path but the route file serves $derived"
  say "CandAppAuthCallback = $path, served by $route"
  t=$(scratch)
  awk '/^\[/ { s = $0 } s == "[auth]" && /^[ \t]*additional_redirect_urls[ \t]*=/ { print; exit }' "$toml" > "$t"
  [ -s "$t" ] || nope "no additional_redirect_urls in the [auth] section of $toml"
  CBP="$path" perl -0777 -e 'local $/; my $t = <STDIN>; my $p = quotemeta($ENV{CBP});
    exit(($t =~ m{"https?://[^"/]+$p"} && $t =~ m{"https?://[^"/]+/\*$p"}) ? 0 : 1)' < "$t" || st=$?
  [ "$st" -eq 0 ] || nope "additional_redirect_urls lacks $path with and without the /* locale segment"
  say "evidence: $path allowlisted bare and under /*; route added in $(added_in "$route")"
}

# C-4080520062 (wont-fix, D-07): no Supabase backend has shipped to main, so no birthdate-keyed account exists to rekey; every provider keys on `sub`.
proof_C_4080520062() {
  local t st=0
  git rev-parse --verify -q 'origin/main^{commit}' > /dev/null || nope "origin/main does not resolve"
  t=$(scratch)
  git ls-tree -r --name-only origin/main -- backend/vaa-strapi > "$t"
  [ -s "$t" ] || nope "origin/main carries no backend/vaa-strapi (the positive control for the check below)"
  git ls-tree -r --name-only origin/main -- apps/supabase > "$t"
  [ ! -s "$t" ] || nope "origin/main carries apps/supabase"
  git cat-file -e origin/main:apps/supabase/supabase/functions/identity-callback 2> /dev/null || st=$?
  [ "$st" -ne 0 ] || nope "origin/main carries the identity-callback function"
  say "origin/main ($(git rev-parse --short=9 origin/main)) holds the Strapi backend and no apps/supabase tree"
  # LATER PLAN: 165-21 and 165-27 edit seed.sql; this sentence of the default-project comment must survive.
  grep -q -F 'no database has been published' apps/supabase/supabase/seed.sql || nope "seed.sql no longer states that no database has been published"
  grep -q -E 'D-07.*C-4080520062.*wont-fix' "$PHASE_DIR/165-CONTEXT.md" || nope "165-CONTEXT.md carries no D-07 wont-fix ruling for C-4080520062"
  say "seed.sql: no database has been published; 165-CONTEXT D-07: no hosted project holds Signicat or Idura users"
  # LATER PLAN: 165-30 renames the provider keys in claimConfig.ts; identityMatchProp stays.
  absent '^(?!\s*(?://|/\*|\*)).*identityMatchProp:\s*[\x27"]birthdate[\x27"]' -- apps/supabase/supabase/functions apps/frontend/src ':(exclude)apps/supabase/supabase/functions/*.test.ts' ':(exclude)apps/frontend/src/*.test.ts'
  has_code 'identityMatchProp:\s*\x27sub\x27' apps/supabase/supabase/functions/identity-callback/claimConfig.ts
  say "evidence: no apps/supabase on origin/main; seed.sql states no database has been published; no provider keys on birthdate"
}

# C-4080520123: the admin writer's send-email invocation carries project_id: this.projectId, the field the Edge Function requires.
proof_C_4080520123() {
  local files
  files=$(scratch)
  adapter_files "$files"
  # LATER PLAN: 165-23 edits supabaseAdminWriter.ts; the invocation must keep passing project_id.
  every_call_passes ".functions.invoke('send-email" project_id $(cat "$files")
  has_code '\bproject_id:\s*string\s*;' apps/supabase/supabase/functions/send-email/index.ts
  say "evidence: sendEmail invokes send-email with project_id: this.projectId"
}

# C-4080520206: no product code reads the retired user_roles claim; the hook writes `grants`, and the login gate and the writer read it through readGrants.
proof_C_4080520206() {
  retired_claim_absent
  # LATER PLAN: 165-08, 165-25 and 165-26 edit 301-auth-functions.sql; the claim key must stay `grants`.
  has_code 'jsonb_set\(\s*claims\s*,\s*\x27\{grants\}\x27' apps/supabase/supabase/schema/301-auth-functions.sql
  # LATER PLAN: 165-06 edits roles.ts; readGrants must keep reading the `grants` key.
  has_code 'function\s+readGrants\([^)]*\)[^{]*\{[^}]*payload\??\.grants\b' apps/frontend/src/lib/auth/roles.ts
  # LATER PLAN: 165-19 edits passwordLogin.ts.
  has_code 'hasAnyGrant\(\s*readGrants\(' apps/frontend/src/lib/auth/passwordLogin.ts
  has_code 'passwordLogin\(\s*\{(?:[^{}]|\{[^{}]*\})*\ballowedGrants:\s*CANDIDATE_GRANTS\b' 'apps/frontend/src/routes/candidate/login/+page.server.ts'
  has_code 'passwordLogin\(\s*\{(?:[^{}]|\{[^{}]*\})*\ballowedGrants:\s*ADMIN_GRANTS\b' 'apps/frontend/src/routes/admin/login/+page.server.ts'
  # LATER PLAN: 165-26 edits supabaseDataWriter.ts.
  has_code '\breadGrants\(' apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  say "evidence: user_roles absent from product code (comments excluded); hook writes grants; logins and the writer read readGrants"
}

# C-4080520279: every get_nominations call in the adapter passes p_project_id: this.projectId, the parameter the RPC requires.
proof_C_4080520279() {
  local files
  files=$(scratch)
  adapter_files "$files"
  # LATER PLAN: 165-11 moves helpers out of supabaseDataProvider.ts, so the whole adapter directory is searched.
  every_call_passes ".rpc('get_nominations" p_project_id $(cat "$files")
  # LATER PLAN: 165-16, 165-25, 165-26 and 165-27 edit 503-entity-rpcs.sql.
  has_code 'FUNCTION\s+public\.get_nominations\s*\(\s*p_project_id\s+uuid\s*,' apps/supabase/supabase/schema/503-entity-rpcs.sql
  say "evidence: get_nominations(p_project_id uuid, ...) and every adapter call passes p_project_id: this.projectId"
}

# C-4080520322 (already-fixed): `c.name` is on the removed side of #877's own get_nominations diff; neither #877 nor the tip selects it, and candidates map first and last name.
proof_C_4080520322() {
  local f=apps/supabase/supabase/schema/503-entity-rpcs.sql before after st
  [ "$(git rev-parse "${SLICES[1]}^")" = "$(git rev-parse "${SLICES[0]}^{commit}")" ] || nope "#877's parent is not #876's head"
  before=$(scratch)
  after=$(scratch)
  git show "${SLICES[0]}:$f" > "$before"
  git show "${SLICES[1]}:$f" > "$after"
  st=0
  _match '\bc\.name\b' "$before" || st=$?
  [ "$st" -eq 0 ] || nope "#876's $f has no c.name, so the comment is not about a removed line"
  st=0
  _match '\bc\.name\b' "$after" || st=$?
  [ "$st" -eq 1 ] || nope "#877's own $f still contains c.name"
  say "c.name: present in #876 (${SLICES[0]}), absent from #877 (${SLICES[1]})"
  # LATER PLAN: 165-16, 165-25, 165-26 and 165-27 edit 503-entity-rpcs.sql.
  absent '\bc\.name\b' -- "$f"
  has_code 'c\.first_name\s+AS\s+entity_first_name' "$f"
  has_code 'c\.last_name\s+AS\s+entity_last_name' "$f"
  say "evidence: c.name removed by #877 itself and absent at the tip; candidates map entity_first_name/entity_last_name"
}

# C-4080520354: every get_candidate_user_data call in the adapter passes p_project_id: this.projectId.
proof_C_4080520354() {
  local files
  files=$(scratch)
  adapter_files "$files"
  # LATER PLAN: 165-26 edits supabaseDataWriter.ts.
  every_call_passes ".rpc('get_candidate_user_data" p_project_id $(cat "$files")
  has_code 'FUNCTION\s+public\.get_candidate_user_data\s*\(\s*p_project_id\s+uuid\s*,' apps/supabase/supabase/schema/503-entity-rpcs.sql
  say "evidence: get_candidate_user_data(p_project_id uuid, ...) and every adapter call passes p_project_id: this.projectId"
}

# C-4080520386: the admin writer calls merge_question_custom_data, which the schema and the generated types define, and nothing names merge_custom_data.
proof_C_4080520386() {
  local files
  files=$(scratch)
  adapter_files "$files"
  # LATER PLAN: 165-23 edits supabaseAdminWriter.ts.
  has_code '\.rpc\(\s*\x27merge_question_custom_data\x27' $(cat "$files")
  absent '\bmerge_custom_data\b' -- apps/frontend/src packages
  has_code 'FUNCTION\s+public\.merge_question_custom_data\s*\(' apps/supabase/supabase/schema/504-admin-rpcs.sql
  has_code '\bmerge_question_custom_data:\s*\{' packages/supabase-types/src/database.ts
  has_code 'hasnt_function\s*\(\s*\x27public\x27\s*,\s*\x27merge_custom_data\x27' apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
  say "evidence: .rpc('merge_question_custom_data') in the adapter; merge_custom_data absent from frontend and packages; pgTAP asserts it is gone"
}

# C-4080520413: every election_type a dev-seed producer writes is a member of the nomination_shape enum, and none writes general or local.
proof_C_4080520413() {
  local enums=apps/supabase/supabase/schema/000-enums.sql members vals files f n st=0
  # LATER PLAN: 165-16 edits 000-enums.sql.
  members=$(scratch)
  strip_comments "$members.sql" "$enums"
  perl -0777 -ne 'if (/CREATE\s+TYPE\s+public\.nomination_shape\s+AS\s+ENUM\s*\(([^)]*)\)/) { my $b = $1; while ($b =~ /\x27([a-z_]+)\x27/g) { print "$1\n" } }' "$members.sql" > "$members"
  [ -s "$members" ] || nope "no nomination_shape enum in $enums"
  say "nomination_shape = $(tr '\n' ' ' < "$members")"
  absent 'election_type:\s*[\x27"](general|local)[\x27"]' -- packages/dev-seed/src tests
  files=$(scratch)
  ls_matching "$files" '^(?!.*\.test\.ts$).*\.ts$' packages/dev-seed/src
  vals=$(scratch)
  : > "$vals"
  while IFS= read -r f; do
    strip_comments "$vals.one" "$f"
    perl -ne 'while (/\belection_type:\s*\x27([^\x27]*)\x27/g) { print "$1\n" }' "$vals.one" >> "$vals"
  done < "$files"
  n=$(wc -l < "$vals" | tr -d ' ')
  [ "$n" -gt 0 ] || nope "no dev-seed producer writes election_type"
  while IFS= read -r f; do
    grep -q -x -F -- "$f" "$members" || nope "a dev-seed producer writes election_type '$f', not a nomination_shape member"
  done < "$vals"
  # LATER PLAN: 165-10 and 165-18 edit ElectionsGenerator.ts and templates/default.ts.
  has_code '\belection_type:\s*\x27[a-z_]+\x27' packages/dev-seed/src/generators/ElectionsGenerator.ts
  has_code '\belection_type:\s*\x27[a-z_]+\x27' packages/dev-seed/src/templates/default.ts
  say "evidence: $n election_type literals across dev-seed, all nomination_shape members; general/local absent"
}

# C-4080520453: `organization` is a non-column key of candidates, so the import strips it before the write.
proof_C_4080520453() {
  # LATER PLAN: 165-10, 165-18 and 165-27 edit permittedKeys.ts.
  has_code 'COLLECTION_NON_COLUMN_LIST\s*=\s*\{[^}]*\bcandidates:\s*\[[^\]]*\x27organization\x27' packages/dev-seed/src/template/permittedKeys.ts
  has_code 'COLLECTION_NON_COLUMNS\b[^=]*=\s*Object\.fromEntries\(\s*Object\.entries\(\s*COLLECTION_NON_COLUMN_LIST\s*\)' packages/dev-seed/src/template/permittedKeys.ts
  has_code 'COLLECTION_NON_COLUMNS\[\s*\w+\s*\]' packages/dev-seed/src/supabaseAdminClient.ts
  say "evidence: COLLECTION_NON_COLUMN_LIST.candidates lists organization, and bulkImport strips COLLECTION_NON_COLUMNS"
}

# C-4080515718: the E2E setup passes the template's openForVoters into writer.write, and the writer applies it when defined.
proof_C_4080515718() {
  has_code 'writer\.write\(\s*rows\s*,\s*prefix\s*,\s*\{\s*openForVoters:\s*template!?\.openForVoters\s*\}\s*\)' tests/tests/setup/shared/setupFromTemplate.ts
  has_code 'if\s*\(\s*options\.openForVoters\s*!==\s*undefined\s*\)' packages/dev-seed/src/writer.ts
  has_code 'setProjectOpenForVoters\(\s*options\.openForVoters\s*\)' packages/dev-seed/src/writer.ts
  has_code 'openForVoters:\s*false\b' packages/dev-seed/src/templates/e2e/perm/perm-closed-project.ts
  say "evidence: setupFromTemplate calls writer.write(rows, prefix, { openForVoters: template.openForVoters })"
}

# C-4080508297: the candidate auth callback route exists, and the emailBucket fixture's default callback path targets it.
proof_C_4080508297() {
  local route='apps/frontend/src/routes/api/candidate/auth/callback/+server.ts' fx=tests/tests/fixtures/shared/emailBucket.fixture.ts
  local path def st=0
  tracked "$route"
  path=$(callback_path) || nope "no CandAppAuthCallback in route.ts"
  def=$(code_value 'callbackPath\s*=\s*\x27([^\x27]+)\x27' "$fx") || nope "no default callbackPath in $fx"
  CBP="$path" DEF="$def" perl -e 'exit(($ENV{DEF} =~ m{^(?:/[a-z]{2}(?:-[A-Za-z]+)?)?\Q$ENV{CBP}\E$}) ? 0 : 1)' || st=$?
  [ "$st" -eq 0 ] || nope "the fixture default $def does not target $path"
  say "evidence: emailBucket default callbackPath $def = locale + CandAppAuthCallback ($path), a tracked route"
}

# C-4080508343: the admin login gates on hasAnyGrant(readGrants(...), ADMIN_GRANTS), the writer's basic user data reads grants, and the test admin is minted with an ADMIN_GRANTS shape.
proof_C_4080508343() {
  retired_claim_absent
  # LATER PLAN: 165-19 edits passwordLogin.ts.
  has_code 'hasAnyGrant\(\s*readGrants\(' apps/frontend/src/lib/auth/passwordLogin.ts
  has_code 'passwordLogin\(\s*\{(?:[^{}]|\{[^{}]*\})*\ballowedGrants:\s*ADMIN_GRANTS\b' 'apps/frontend/src/routes/admin/login/+page.server.ts'
  # LATER PLAN: 165-26 edits supabaseDataWriter.ts.
  has_code 'hasAnyGrant\(\s*\w+\s*,\s*ADMIN_GRANTS\s*\)' apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  # LATER PLAN: 165-06 edits tests/tests/utils/supabaseAdminClient.ts and roles.ts; the typed grant constant must survive.
  has_code 'TEST_ADMIN_GRANT:\s*\(typeof\s+ADMIN_GRANTS\)\[number\]' tests/tests/utils/supabaseAdminClient.ts
  say "evidence: admin login and getBasicUserData gate on readGrants + ADMIN_GRANTS; user_roles absent (comments excluded)"
}

# C-4080508426: the root server load returns the Supabase auth cookies (name and value), so the sb-* cookie name is in the page payload.
proof_C_4080508426() {
  local f='apps/frontend/src/routes/+layout.server.ts'
  # LATER PLAN: 165-19 edits +layout.server.ts; the cookie projection must survive.
  has_code 'startsWith\(\s*SUPABASE_COOKIE_PREFIX\s*\)' "$f"
  has_code '\.map\(\s*\(\s*\{\s*name\s*,\s*value\s*\}\s*\)\s*=>\s*\(\s*\{\s*name\s*,\s*value\s*\}\s*\)\s*\)' "$f"
  has_code 'return\s*\{[^}]*\bsupabaseCookies\b[^}]*\}' "$f"
  has_code 'sentinelPresent:\s*rendered\.includes\(\s*sessionCookieName' tests/tests/specs/admin/admin-access.spec.ts
  say "evidence: +layout.server.ts returns supabaseCookies as { name, value }; the behavioural proof is plan 165-35's full E2E run, recorded by 165-36"
}

# C-4080508462: axeScan.ts imports the Route type from a lib/routes/route module that is tracked and exports it.
proof_C_4080508462() {
  import_resolves tests/tests/utils/axeScan.ts lib/routes/route
  has_code 'export\s+type\s+Route\b' apps/frontend/src/lib/routes/route.ts
  say "evidence: axeScan.ts -> apps/frontend/src/lib/routes/route.ts, added in $(added_in apps/frontend/src/lib/routes/route.ts)"
}

# C-4080508490: buildRoute.ts imports ROUTE and Route from a lib/routes/route module that is tracked and exports both.
proof_C_4080508490() {
  import_resolves tests/tests/utils/buildRoute.ts lib/routes/route
  has_code 'export\s+const\s+ROUTE\b' apps/frontend/src/lib/routes/route.ts
  has_code 'export\s+type\s+Route\b' apps/frontend/src/lib/routes/route.ts
  say "evidence: buildRoute.ts -> apps/frontend/src/lib/routes/route.ts, added in $(added_in apps/frontend/src/lib/routes/route.ts)"
}

# C-4080508533: supabaseAdminClient.ts imports ADMIN_GRANTS from a lib/auth/roles module that is tracked and exports it.
proof_C_4080508533() {
  # LATER PLAN: 165-06 edits roles.ts and must keep the ADMIN_GRANTS export.
  import_resolves tests/tests/utils/supabaseAdminClient.ts lib/auth/roles
  has_code 'export\s+const\s+ADMIN_GRANTS\b' apps/frontend/src/lib/auth/roles.ts
  say "evidence: supabaseAdminClient.ts -> apps/frontend/src/lib/auth/roles.ts (exports ADMIN_GRANTS), added in $(added_in apps/frontend/src/lib/auth/roles.ts)"
}

# C-4080514940: nothing imports a dataWriter singleton; dataWriter.ts exports only the factory, and route importers bind createDataWriter.
proof_C_4080514940() {
  local importers st=0 n
  lacks_code 'export\s+(?:const|let|var)\s+dataWriter\b' apps/frontend/src/lib/api/dataWriter.ts
  has_code 'export\s+function\s+createDataWriter\b' apps/frontend/src/lib/api/dataWriter.ts
  absent '\bdataWriter\s+as\s+dataWriterPromise\b' -- apps/frontend/src
  importers=$(scratch)
  git grep -l -P 'from\s+[\x27"][^\x27"]*\bapi/dataWriter[\x27"]' -- apps/frontend/src/routes > "$importers" 2> /dev/null || st=$?
  case "$st" in
    0) ;;
    1) nope "no route imports the dataWriter module, so the check below would be vacuous" ;;
    *) nope "git grep exited $st" ;;
  esac
  n=$(wc -l < "$importers" | tr -d ' ')
  lacks_code 'import\s*\{[^}]*\bdataWriter\b[^}]*\}\s*from\s*[\x27"][^\x27"]*\bapi/dataWriter[\x27"]' $(cat "$importers")
  say "evidence: dataWriter.ts exports createDataWriter only; the $n route importers bind createDataWriter"
}

# C-4080514990: every PasswordSetter caller under routes passes onValidityChange and binds neither valid nor errorMessage.
proof_C_4080514990() {
  local callers st=0 f t n=0 out
  callers=$(scratch)
  git grep -l -P '<PasswordSetter\b' -- apps/frontend/src/routes > "$callers" 2> /dev/null || st=$?
  [ "$st" -eq 0 ] || nope "no route renders <PasswordSetter (git grep exited $st)"
  # LATER PLAN: 165-29 edits the PasswordSetter component; the callback prop must survive.
  has_code 'onValidityChange\??\s*:' apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts
  lacks_code '\b(?:valid|errorMessage)\s*=\s*\$bindable\(' apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte
  while IFS= read -r f; do
    t=$(scratch)
    strip_comments "$t" "$f"
    st=0
    out=$(perl -0777 -e 'local $/; my $t = <STDIN>; my ($n, $bad) = (0, 0);
      while ($t =~ m{(<PasswordSetter\b.*?(?:/>|</PasswordSetter>))}gs) {
        my $e = $1; $n++; $bad++ unless $e =~ /\bonValidityChange=/ && $e !~ /\bbind:(?:valid|errorMessage)\b/;
      }
      print "$n $bad\n"; exit(($n > 0 && $bad == 0) ? 0 : 1)' < "$t") || st=$?
    [ "$st" -eq 0 ] || nope "$f: <PasswordSetter elements/bad = ${out:-none}"
    say "ok: $f"
    n=$((n + 1))
  done < "$callers"
  say "evidence: all $n PasswordSetter callers pass onValidityChange; none binds valid or errorMessage"
}

# C-4080515025: no currentPassword token survives in the frontend.
proof_C_4080515025() {
  absent '\bcurrentPassword\b' -- apps/frontend/src
  say "evidence: currentPassword absent from apps/frontend/src"
}

# C-4080515081: every admin jobs endpoint imports and calls requireVerifiedAdmin, and none keeps its own getUserData role check.
proof_C_4080515081() {
  local eps f n m=0
  eps=$(scratch)
  ls_matching "$eps" '/\+server\.ts$' apps/frontend/src/routes/api/admin/jobs
  n=$(wc -l < "$eps" | tr -d ' ')
  [ "$n" -gt 0 ] || nope "no admin jobs endpoints found"
  while IFS= read -r f; do
    has_code 'import\s*\{[^}]*\brequireVerifiedAdmin\b[^}]*\}\s*from\s*\x27\$lib/server/admin/requireVerifiedAdmin\x27' "$f"
    has_code '\brequireVerifiedAdmin\(' "$f"
    lacks_code '\bgetUserData\(' "$f"
    m=$((m + 1))
  done < "$eps"
  [ "$m" -eq "$n" ] || nope "$m of $n endpoints use requireVerifiedAdmin"
  has_code '\brequireAdminIdentity\(' apps/frontend/src/lib/server/admin/requireVerifiedAdmin.ts
  has_code '\bsafeGetSession\(' apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
  say "evidence: $m of $n jobs endpoints import and call requireVerifiedAdmin; none calls getUserData"
}

# C-4080515115: the located layout treats an empty id array as absent, and its load test passes.
proof_C_4080515115() {
  local f='apps/frontend/src/routes/(voters)/(located)/+layout.ts' log st=0
  # LATER PLAN: 165-19 edits +layout.ts and layout.load.test.ts; the empty-array guard and the test file name must survive.
  has_code 'Array\.isArray\(\s*\w+\s*\)\s*\|\|\s*\w+\.length\s*>\s*0' "$f"
  tracked 'apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts'
  log=$(scratch)
  yarn workspace @openvaa/frontend test:unit layout.load > "$log" 2>&1 || st=$?
  [ "$st" -eq 0 ] || { tail -n 30 "$log"; nope "vitest layout.load exited $st"; }
  grep -q 'layout.load.test.ts' "$log" || nope "vitest did not run layout.load.test.ts"
  say "vitest: $(grep -E 'Tests +[0-9]+ passed' "$log" | head -n 1 | sed 's/^ *//')"
  say "evidence: hasSelection treats [] as absent; layout.load.test.ts passes"
}

# C-4080520522: the candidate login page imports $layouts/main, and $layouts is registered in both resolvers.
proof_C_4080520522() {
  has_code 'from\s*[\x27"]\$layouts/main[\x27"]' 'apps/frontend/src/routes/candidate/login/+page.svelte'
  layouts_alias_registered
  say "evidence: \$layouts in svelte.config.js kit.alias and vitest.config.ts; lib/layouts/main/index.ts tracked"
}

# C-4080520561: the register password page imports $layouts/main, and $layouts is registered in both resolvers.
proof_C_4080520561() {
  has_code 'from\s*[\x27"]\$layouts/main[\x27"]' 'apps/frontend/src/routes/candidate/register/password/+page.svelte'
  layouts_alias_registered
  say "evidence: \$layouts in svelte.config.js kit.alias and vitest.config.ts; lib/layouts/main/index.ts tracked"
}

# C-4080502788: the root .env.example defines PUBLIC_PROJECT_ID once, as the project seed.sql creates.
proof_C_4080502788() {
  local id=00000000-0000-0000-0000-000000000001 n
  # LATER PLAN: 165-14, 165-30, 165-34 and 165-36 edit .env.example; the definition must survive.
  tracked .env.example
  n=$(grep -c -E '^PUBLIC_PROJECT_ID=' .env.example || true)
  [ "$n" -eq 1 ] || nope ".env.example defines PUBLIC_PROJECT_ID $n times"
  grep -q -x -F "PUBLIC_PROJECT_ID=$id" .env.example || nope ".env.example PUBLIC_PROJECT_ID is not $id"
  grep -q -F "$id" apps/supabase/supabase/seed.sql || nope "seed.sql does not create project $id"
  say "evidence: root .env.example PUBLIC_PROJECT_ID=$id, the project seed.sql creates"
}

# ── Runner ────────────────────────────────────────────────────────────────

VERBOSE=0
LIST=0
WANT=()
while [ "$#" -gt 0 ]; do
  case "$1" in
    -v) VERBOSE=1; shift ;;
    -l) LIST=1; shift ;;
    -h | --help) usage; exit 0 ;;
    -*) echo "tip-proofs.sh: unknown flag: $1" >&2; usage >&2; exit 2 ;;
    *) WANT+=("$1"); shift ;;
  esac
done

# Proof ids in file order, read from this file's own function definitions.
ALL=()
while IFS= read -r fn; do ALL+=("${fn#proof_C_}"); done < <(grep -oE '^proof_C_[0-9]+' "$SELF")

if [ "$LIST" -eq 1 ]; then
  for id in "${ALL[@]}"; do say "C-$id"; done
  exit 0
fi

RUN=()
if [ "${#WANT[@]}" -eq 0 ]; then
  RUN=("${ALL[@]}")
else
  for w in "${WANT[@]}"; do
    id=${w#C-}
    case "$id" in
      '' | *[!0-9]*) echo "tip-proofs.sh: not a comment id: $w" >&2; exit 2 ;;
    esac
    if ! declare -F "proof_C_$id" > /dev/null; then
      echo "tip-proofs.sh: no proof for C-$id" >&2
      exit 2
    fi
    RUN+=("$id")
  done
fi

FAILED=0
for id in "${RUN[@]}"; do
  log="$TMPD/C-$id.log"
  set +e
  (
    set -e
    "proof_C_$id"
  ) > "$log" 2>&1
  st=$?
  set -e
  if [ "$st" -eq 0 ]; then
    printf 'C-%s\tPASS\n' "$id"
    [ "$VERBOSE" -eq 0 ] || sed 's/^/    /' "$log" >&2
  else
    printf 'C-%s\tFAIL\n' "$id"
    sed 's/^/    /' "$log" >&2
    FAILED=1
  fi
done

exit "$FAILED"
