#!/usr/bin/env bash
#
# attempt.sh -- Keep scratch state and operator replies in per-attempt files reached through a pointer.
#
# Usage:
#   attempt.sh new   <key>                         start a fresh attempt; prints "<attempt id> <path>"
#   attempt.sh id    <key>                         print the current attempt id
#   attempt.sh path  <key>                         print the path of the current attempt file
#   attempt.sh has   <key> <ERE>                   exit 0 when a line of the current file matches (grep -E)
#   attempt.sh bound <key> <NAME[=value]> [--where k=v]... [k=v]...
#                                                  exit 0 when the last NAME= line (among those carrying every
#                                                  --where field) carries attempt=<current id> and every k=v,
#                                                  each as a whole whitespace-delimited field; with NAME=value
#                                                  the line's first field must equal it
#   attempt.sh field <key> <NAME> <k> [--where k=v]...
#                                                  print the value of field k on the line bound would take
#   attempt.sh put   <key>  < reply                append an operator's reply to the current file, if it is
#                                                  bound to the current attempt and passes the screen
#   attempt.sh --self-test                         run every case in a throwaway directory
#
# Exit codes:
#   0   success (found, bound, stored, self-test passed)
#   1   not found: no pointer, the pointer names no file, no matching line, no bound line, or self-test failed
#   2   put refused: the reply holds no `answer_attempt=<current id>` line, or names another attempt
#   3   put refused: the reply failed the screen (line number and class printed, never the value)
#   64  usage error
#
# The rule it serves. A resume after a checkpoint is the normal path, so second attempts are normal. A
# scratch file appended to across attempts would let a stale line from an earlier attempt satisfy a check,
# or let an operator's answer given for one thing authorise another. So every attempt gets a fresh file,
# named by a UTC timestamp and the short commit id, and `<key>.current` points at it. Checks read only the
# file the pointer names (via `path`, `has`, `bound`, `field`) and fail when the pointer is missing. No
# command deletes or rewrites an earlier attempt file; `new` creates, `put` appends.
#
# Attempt directory: `tmp/183-evidence/` under the repository root, which Git ignores. If it is not
# ignored, `new` falls back to `${TMPDIR:-/tmp}/183-evidence/` and says so. The environment variable
# ATTEMPT_DIR overrides both (the self-test uses a `mktemp -d` directory). An attempt id is
# `<UTC timestamp to the second>.<short HEAD>`; the file is `<key>.<attempt id>.txt`; the pointer is
# `<key>.current`, holding the attempt id. Matching, sorting and number formats run under LC_ALL=C.
#
# `put` is for an operator's reply and nothing else; the executor's own scratch lines are appended to the
# file that `path` names. Its screen applies five rules, in this order, to each line, and reports the first
# hit by line number and class:
#   1 unnamed-line  Every non-empty line is a record line (`OPERATOR_...=` or `PLAN_REVIEWED=`), a named
#                   result line (`s<step>[a-z]_<field>=`, field of a-z 0-9 _ .), an answer line
#                   (`answer_<name>=`) or a note (`note: `). Raw output, JSON, a bare value: refused.
#   2 secret-name   A name followed by `=` or `:` (optional closing quote and spaces before, optional opening
#                   quote after) and a value, where the name's last word is a secret word. Names split at
#                   `_`, `-`, `.` and at lower/digit-to-capital changes; trailing all-digit words are
#                   dropped; case is ignored. Secret words: secret, secrets, password, passwords, passwd,
#                   passphrase, passphrases, pass, pwd, token, tokens, key, keys, credential, credentials,
#                   bearer, authorization. A last word that merely ENDS in one counts too (`apikey`,
#                   `authtoken`), which also refuses harmless names such as `bypass` or `monkey`: this is
#                   intended, and the operator rewords the line. `(sensitive value)`, `null` and an empty
#                   value are not a value; `(known after apply)` is.
#                   The allow-list of names for this rule is EMPTY, on purpose: every named line the plans
#                   ask for uses a field whose last word is not a secret word (a DKIM token is `dkim_cname`,
#                   a state object's key is `state_path`), and harmless names that hold such a word elsewhere
#                   pass without a list because only the last word counts (`BucketKeyEnabled`, `KeyId`,
#                   `password_min_length`, `refresh_token_rotation_enabled`). A name added later is added
#                   here with its reason and a self-test case.
#                   One exemption, ruled by the operator on 2026-10-21 (plan 183-14, attempt 14-2): the
#                   verdict that `evaluate` in `infra/scripts/account-inventory.sh` prints, `assert: PASS: ...`
#                   or `assert: FAIL: ...`, reads its `PASS`/`FAIL` as a name. That one token is not judged
#                   when the WHOLE line is a named result line (`s<step>[a-z]_<field>=`) whose value is exactly
#                   one of the script's seven verdict forms, with a decimal count for each `%d` and, for each
#                   path prefix, `/` or `/<seg>/.../` with segments of A-Z a-z 0-9 _ . - only. Every other name
#                   on the line is judged as before (a field named `s5_password=` still refuses), and so are
#                   rules 3 to 5. Any other text before, after or inside the verdict (`assert: PASS: hunter2`,
#                   a lower-case `pass:`, a trailing `password: ...`, a prefix holding `:`) fails the match and
#                   the line is judged whole. A change to a verdict in that script changes the list here.
#   3 token-shape   With or without a name: an AWS access key id (AKIA/ASIA + 16); a JSON Web Token (parts
#                   joined by dots, the first beginning `eyJ`; one dot is enough); `sbp_`/`sb_secret_` + 10;
#                   `ghp_`/`gho_`/`ghu_`/`ghs_`/`ghr_`/`github_pat_` + 20; a private-key header; a URL with
#                   user information before its host (`<scheme>://...:...@`); a run of 32+ hexadecimal
#                   digits (any case); a run of 32+ base64 characters holding a capital, a lower-case letter
#                   and a digit (the shape of an AWS secret key).
#   4 (exception)   A hexadecimal run passes only as the whole value of a whitespace-delimited `k=v` field
#                   (or of a named result line) whose name's last word is head, green, red, commit or sha
#                   with exactly 40 digits, or sha256 with exactly 64. Case is ignored as in rule 3. A DKIM
#                   token is base32; one whose letters all lie in a-f would be a hexadecimal run and be
#                   refused, and would then be given under a field named for it by a change to this list.
#   5 address       An e-mail address, except: noreply@staging.openvaa.org (the sender the tracked code
#                   names), dmarc_agg@vali.email (the organisation's DMARC report address, already published
#                   in public DNS) and git@github.com (the login name of a Git remote, nobody's mailbox).
#     session       An assumed-role ARN carrying a session name (`assumed-role/<role>/<session>`); the same
#                   text cut after the role name passes.
#
# The screen LOWERS the chance that a secret an operator pasted is stored in a file; it does NOT guarantee
# it. A password given on a named line under a harmless name passes it. The control that counts is the one
# before it: no checkpoint asks for output that can hold a secret, an id of a credential, state content or
# an address.

set -euo pipefail
export LC_ALL=C

SELF="${BASH_SOURCE[0]}"
SELF_DIR="$(cd "$(dirname "$SELF")" && pwd)"
REPO_ROOT="$(git -C "$SELF_DIR" rev-parse --show-toplevel)"

usage() {
  sed -n '3,20p' "$SELF" | sed 's/^# \{0,1\}//' >&2
  exit 64
}

# ---------------------------------------------------------------------------------------------------------
# Implementation
# ---------------------------------------------------------------------------------------------------------

die() { echo "attempt.sh: $*" >&2; exit 1; }

check_key() {
  case "$1" in
    '' | *[!A-Za-z0-9._-]* | .*) echo "attempt.sh: bad key '$1'" >&2; exit 64 ;;
  esac
}

# The attempt directory. Only `new` reports the fallback; the other commands resolve it the same way.
attempt_dir() {
  local quiet="${1:-quiet}"
  if [ -n "${ATTEMPT_DIR:-}" ]; then
    printf '%s' "$ATTEMPT_DIR"
  elif git -C "$REPO_ROOT" check-ignore -q tmp/183-evidence/x; then
    printf '%s' "$REPO_ROOT/tmp/183-evidence"
  else
    [ "$quiet" = loud ] && echo "attempt.sh: tmp/183-evidence/ is not ignored by Git; using ${TMPDIR:-/tmp}/183-evidence/ instead" >&2
    printf '%s' "${TMPDIR:-/tmp}/183-evidence"
  fi
}

# Prints the current attempt id; exits 1 when the pointer is missing or names no file.
current_id() {
  local key="$1" dir id
  dir="$(attempt_dir)"
  [ -f "$dir/$key.current" ] || die "no pointer for key '$key'"
  id="$(head -n 1 "$dir/$key.current")"
  case "$id" in
    '' | *[!A-Za-z0-9.]*) die "pointer for key '$key' is malformed" ;;
  esac
  [ -f "$dir/$key.$id.txt" ] || die "pointer for key '$key' names a missing file"
  printf '%s' "$id"
}

cmd_new() {
  local key="$1" dir short id file
  check_key "$key"
  dir="$(attempt_dir loud)"
  mkdir -p "$dir"
  short="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
  while :; do
    id="$(date -u +%Y%m%dT%H%M%SZ).$short"
    file="$dir/$key.$id.txt"
    # noclobber: creation fails if the file exists, so an earlier attempt file is never truncated.
    if (set -C; : >"$file") 2>/dev/null; then
      break
    fi
    sleep 1
  done
  printf '%s\n' "$id" >"$dir/$key.current.tmp.$$"
  mv -f "$dir/$key.current.tmp.$$" "$dir/$key.current"
  printf '%s %s\n' "$id" "$file"
}

cmd_id() {
  check_key "$1"
  current_id "$1"
  echo
}

cmd_path() {
  local id
  check_key "$1"
  id="$(current_id "$1")"
  printf '%s\n' "$(attempt_dir)/$1.$id.txt"
}

cmd_has() {
  local key="$1" pattern="$2" id file rc=0
  check_key "$key"
  id="$(current_id "$key")"
  file="$(attempt_dir)/$key.$id.txt"
  grep -Eq -e "$pattern" -- "$file" || rc=$?
  case "$rc" in
    0 | 1) return "$rc" ;;
    *) echo "attempt.sh: bad pattern" >&2; exit 64 ;;
  esac
}

# Line selection shared by `bound` and `field`: the last line beginning NAME= that carries every --where
# field. Fields are whitespace-delimited and compared as whole strings, so a prefix never matches.
read -r -d '' PERL_BOUND <<'PERL' || true
use strict; use warnings;
my ($mode, $file, $id, $name, @rest) = @ARGV;
my $fk;
if ($mode eq 'field') { $fk = shift @rest; exit 64 unless defined $fk && $fk =~ /^[A-Za-z0-9_.\-]+$/; }
my (@where, @req);
while (@rest) {
  my $a = shift @rest;
  if ($a eq '--where') { my $w = shift @rest; exit 64 unless defined $w && $w =~ /^[^=\s]+=\S*$/; push @where, $w; }
  elsif ($a =~ /^--where=([^=\s]+=\S*)$/) { push @where, $1; }
  elsif ($a =~ /^[^=\s]+=\S*$/ && $mode eq 'bound') { push @req, $a; }
  else { exit 64; }
}
my ($nm, $nv) = $name =~ /^([A-Za-z0-9_.\-]+)=(\S*)$/ ? ($1, $2) : ($name, undef);
exit 64 unless $nm =~ /^[A-Za-z0-9_.\-]+$/;
open(my $fh, '<', $file) or exit 1;
my $last;
while (my $line = <$fh>) {
  $line =~ s/\r?\n\z//;
  next unless index($line, "$nm=") == 0;
  my @f = split ' ', $line;
  my %h = map { $_ => 1 } @f;
  next if grep { !$h{$_} } @where;
  $last = \@f;
}
close $fh;
exit 1 unless $last;
if ($mode eq 'field') {
  for my $f (@$last) {
    if (index($f, "$fk=") == 0) { print substr($f, length($fk) + 1), "\n"; exit 0; }
  }
  exit 1;
}
my %h = map { $_ => 1 } @$last;
exit 1 unless $h{"attempt=$id"};
for my $r (@req) { exit 1 unless $h{$r}; }
if (defined $nv) { exit 1 unless $last->[0] eq "$nm=$nv"; }
exit 0;
PERL

cmd_bound() {
  local key="$1" id
  shift
  check_key "$key"
  id="$(current_id "$key")"
  perl -e "$PERL_BOUND" bound "$(attempt_dir)/$key.$id.txt" "$id" "$@"
}

cmd_field() {
  local key="$1" id
  shift
  check_key "$key"
  id="$(current_id "$key")"
  perl -e "$PERL_BOUND" field "$(attempt_dir)/$key.$id.txt" "$id" "$1" "$2" "${@:3}"
}

# The reply's binding (exit 2) and the screen (exit 3). Reads the reply on standard input. Prints the line
# number and the class of the first hit, never the value.
read -r -d '' PERL_SCREEN <<'PERL' || true
use strict; use warnings;
my $id = shift @ARGV;
my @lines = split /\n/, do { local $/; my $s = <STDIN>; defined $s ? $s : '' };
s/\r\z// for @lines;

# Binding: at least one answer_attempt line, and every one of them names the current attempt.
my $bound = 0;
for my $i (0 .. $#lines) {
  if ($lines[$i] =~ /^answer_attempt=(.*?)\s*$/) {
    if ($1 ne $id) { print STDERR "attempt.sh: put refused: line ", $i + 1, " class=attempt-mismatch\n"; exit 2; }
    $bound = 1;
  }
}
unless ($bound) { print STDERR "attempt.sh: put refused: no answer_attempt line for the current attempt class=attempt-missing\n"; exit 2; }

my @secret = qw(secrets secret passwords password passwd passphrases passphrase pass pwd
                tokens token keys key credentials credential bearer authorization);
my %allowed_address = map { $_ => 1 } qw(noreply@staging.openvaa.org dmarc_agg@vali.email git@github.com);

sub last_word {
  my $n = shift;
  $n =~ s/([a-z0-9])([A-Z])/$1 $2/g;
  my @w = grep { length } split /[\s_.\-]+/, $n;
  pop @w while @w && $w[-1] =~ /^[0-9]+$/;
  return @w ? lc $w[-1] : '';
}
sub is_secret_word {
  my $w = shift;
  for my $s (@secret) { return 1 if length($w) >= length($s) && substr($w, -length($s)) eq $s; }
  return 0;
}

sub rule1 {
  my $l = shift;
  return 1 if $l =~ /^(?:OPERATOR_[A-Za-z0-9_]+|PLAN_REVIEWED)=/;
  return 1 if $l =~ /^s[0-9]+[a-z]?_[a-z0-9_.]+=/;
  return 1 if $l =~ /^answer_[a-z0-9_.]+=/;
  return 1 if $l =~ /^note: /;
  return 0;
}

# The verdict forms of `evaluate` in infra/scripts/account-inventory.sh, as rule 2's one exemption.
my $IAM_PREFIX = '/(?:[A-Za-z0-9_.\-]+/)*';
my @verdict_forms = (
  'PASS: [0-9]+ IAM users, none with an inline policy',
  "PASS: [0-9]+ roles and users under $IAM_PREFIX, none with an inline policy",
  'FAIL: the(?: (?:user|role))+ list could not be read, so nothing was judged',
  'FAIL: nothing examined: the input holds no complete user or role list',
  "FAIL: nothing examined: no role or user lies under $IAM_PREFIX",
  "FAIL: [0-9]+ of [0-9]+ roles and users under $IAM_PREFIX carry an inline policy or could not be read",
  'FAIL: [0-9]+ of [0-9]+ IAM users carry an inline policy or could not be read',
);
my $verdict_alternation = join '|', @verdict_forms;
my $VERDICT = qr{^(s[0-9]+[a-z]?_[a-z0-9_.]+=assert: )(?:$verdict_alternation)\z};

sub rule2 {
  my $l = shift;
  my $verdict_at = $l =~ $VERDICT ? length($1) : -1;
  while ($l =~ /([A-Za-z0-9_.\-]+)["']?[ \t]*[=:][ \t]*(["']?)/g) {
    my ($name, $q) = ($1, $2);
    next if $-[1] == $verdict_at;
    my $rest = substr($l, pos($l));
    my $empty = $rest =~ /^\s*$/
      || $rest =~ /^\(sensitive value\)/
      || $rest =~ /^null(?![A-Za-z0-9_])/
      || ($q ne '' && substr($rest, 0, 1) eq $q)
      || $rest =~ /^[,;}\]]/;
    next if $empty;
    return 1 if is_secret_word(last_word($name));
  }
  return 0;
}

# Rule 4: spans of hexadecimal values let through by their field name.
sub exempt_spans {
  my $l = shift;
  my %ex;
  while ($l =~ /(\S+)/g) {
    my $f = $1;
    my $start = pos($l) - length($f);
    next unless $f =~ /^([A-Za-z0-9_.\-]+)=([0-9A-Fa-f]+)$/;
    my ($k, $v) = ($1, $2);
    my $w = last_word($k);
    my $ok = (($w =~ /^(?:head|green|red|commit|sha)$/ && length($v) == 40)
              || ($w eq 'sha256' && length($v) == 64));
    $ex{($start + length($k) + 1) . ':' . length($v)} = 1 if $ok;
  }
  return \%ex;
}

sub rule3 {
  my $l = shift;
  return 1 if $l =~ /(?:AKIA|ASIA)[A-Z0-9]{16}/;
  return 1 if $l =~ /eyJ[A-Za-z0-9_\-]*\.[A-Za-z0-9_\-]+/;
  return 1 if $l =~ /(?:sbp_|sb_secret_)[A-Za-z0-9_\-]{10,}/;
  return 1 if $l =~ /(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{20,}/;
  return 1 if $l =~ /-----BEGIN[A-Z0-9 ]*PRIVATE KEY/;
  return 1 if $l =~ m{[A-Za-z][A-Za-z0-9+.\-]*://[^/@\s]*:[^/@\s]*@};
  my $ex = exempt_spans($l);
  while ($l =~ /(?<![0-9A-Fa-f])([0-9A-Fa-f]{32,})(?![0-9A-Fa-f])/g) {
    my $start = pos($l) - length($1);
    return 1 unless $ex->{"$start:" . length($1)};
  }
  while ($l =~ m{(?<![A-Za-z0-9+/])([A-Za-z0-9+/]{32,})}g) {
    my $run = $1;
    my $start = pos($l) - length($run);
    next unless $run =~ /[A-Z]/ && $run =~ /[a-z]/ && $run =~ /[0-9]/;
    return 1 unless $ex->{"$start:" . length($run)};
  }
  return 0;
}

sub rule5 {
  my $l = shift;
  while ($l =~ /([A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+)/g) {
    return 'address' unless $allowed_address{lc $1};
  }
  return 'session' if $l =~ m{assumed-role/[^/\s]+/\S};
  return '';
}

for my $i (0 .. $#lines) {
  my $l = $lines[$i];
  next if $l =~ /^\s*$/;
  my $class = '';
  if (!rule1($l)) { $class = 'unnamed-line'; }
  elsif (rule2($l)) { $class = 'secret-name'; }
  elsif (rule3($l)) { $class = 'token-shape'; }
  else { $class = rule5($l); }
  if ($class ne '') { print STDERR "attempt.sh: put refused: line ", $i + 1, " class=$class\n"; exit 3; }
}
exit 0;
PERL

cmd_put() {
  local key="$1" id file reply rc=0
  check_key "$key"
  id="$(current_id "$key")"
  file="$(attempt_dir)/$key.$id.txt"
  reply="$(cat)"
  printf '%s\n' "$reply" | perl -e "$PERL_SCREEN" "$id" || rc=$?
  [ "$rc" -eq 0 ] || exit "$rc"
  printf '%s\n' "$reply" >>"$file"
}

# ---------------------------------------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------------------------------------

ST_FAILS=0

st_report() { # <name> <expected> <got>
  if [ "$2" = "$3" ]; then
    printf 'self-test: PASS %-58s expected=%s got=%s\n' "$1" "$2" "$3"
  else
    printf 'self-test: FAIL %-58s expected=%s got=%s\n' "$1" "$2" "$3"
    ST_FAILS=$((ST_FAILS + 1))
  fi
}

st_status() { # <name> <expected status> <command...>
  local name="$1" want="$2" rc=0
  shift 2
  "$@" >/dev/null 2>&1 || rc=$?
  st_report "$name" "$want" "$rc"
}

st_size() { wc -c <"$1" | tr -d ' '; }

# st_put <name> <expected status> <expected class or -> <reply>
# Checks the exit status, that a refusal leaves the file's size unchanged and prints the class but not the
# refused text, and that a stored reply is found in the file afterwards.
st_put() {
  local name="$1" want="$2" class="$3" reply="$4" file before after rc=0 out
  file="$(bash "$SELF" path st)"
  before="$(st_size "$file")"
  out="$(printf '%s\n' "$reply" | bash "$SELF" put st 2>&1)" || rc=$?
  after="$(st_size "$file")"
  st_report "put: $name" "$want" "$rc"
  if [ "$want" != 0 ]; then
    [ "$before" = "$after" ] && st_report "put: $name (size unchanged)" yes yes \
      || st_report "put: $name (size unchanged)" yes no
    local last
    last="$(printf '%s\n' "$reply" | tail -n 1)"
    case "$out" in
      *"$last"*) st_report "put: $name (value not printed)" yes no ;;
      *) st_report "put: $name (value not printed)" yes yes ;;
    esac
    if [ "$class" != - ]; then
      case "$out" in
        *"class=$class"*) st_report "put: $name (class)" "$class" "$class" ;;
        *) st_report "put: $name (class)" "$class" "$(printf '%s' "$out" | sed -n 's/.*class=\([a-z-]*\).*/\1/p' | head -n 1)" ;;
      esac
    fi
  else
    if grep -qxF -- "$(printf '%s\n' "$reply" | tail -n 1)" "$file"; then
      st_report "put: $name (stored)" yes yes
    else
      st_report "put: $name (stored)" yes no
    fi
  fi
}

st_hex() { # <count> <digit> -> a run of <count> copies of <digit>
  local n="$1" d="$2" s=""
  while [ ${#s} -lt "$n" ]; do s="$s$d"; done
  printf '%s' "$s"
}

self_test() {
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/attempt-self-test.XXXXXX")"
  # shellcheck disable=SC2064
  trap "rm -rf '$dir'" EXIT
  export ATTEMPT_DIR="$dir"

  local H40 H40B H64 H64B H63 ID1 ID2 F1 F2
  H40="$(st_hex 40 a)1"; H40="${H40:0:40}"
  H40B="$(st_hex 40 b)"
  H64="$(st_hex 64 c)"
  H64B="$(st_hex 64 d)"
  H63="$(st_hex 63 e)"

  # --- pointer and binding ------------------------------------------------------------------------------
  st_status "path on a key with no pointer" 1 bash "$SELF" path nokey
  st_status "id on a key with no pointer" 1 bash "$SELF" id nokey
  st_status "has on a key with no pointer" 1 bash "$SELF" has nokey .
  st_status "bound on a key with no pointer" 1 bash "$SELF" bound nokey PLAN_REVIEWED
  printf '%s\n' "20000101T000000Z.0000000" >"$dir/ghost.current"
  st_status "path when the pointer names no file" 1 bash "$SELF" path ghost
  st_status "id when the pointer names no file" 1 bash "$SELF" id ghost

  st_status "new creates a first attempt" 0 bash "$SELF" new k
  ID1="$(bash "$SELF" id k)"
  F1="$(bash "$SELF" path k)"
  printf '%s\n' "ONLY_IN_FIRST=1 attempt=$ID1" >>"$F1"
  st_status "has finds a line in the current file" 0 bash "$SELF" has k '^ONLY_IN_FIRST='
  st_status "new creates a second attempt" 0 bash "$SELF" new k
  ID2="$(bash "$SELF" id k)"
  F2="$(bash "$SELF" path k)"
  [ "$ID1" != "$ID2" ] && st_report "second attempt has another id" yes yes || st_report "second attempt has another id" yes no
  [ -f "$F1" ] && st_report "first attempt file is kept" yes yes || st_report "first attempt file is kept" yes no
  st_status "has does not read the earlier attempt" 1 bash "$SELF" has k '^ONLY_IN_FIRST='

  printf '%s\n' "PLAN_REVIEWED=yes attempt=$ID2 sha256=$H64" >>"$F2"
  st_status "bound: stale approval for another checksum" 1 bash "$SELF" bound k PLAN_REVIEWED "sha256=$H64B"
  st_status "bound: approval for this checksum" 0 bash "$SELF" bound k PLAN_REVIEWED "sha256=$H64"

  printf '%s\n' "OPERATOR_PUSH_CONFIRMED=yes attempt=$ID2 green=$H40 red=$H40B" >>"$F2"
  st_status "bound: push confirmation for other commits" 1 bash "$SELF" bound k OPERATOR_PUSH_CONFIRMED "green=$H40B" "red=$H40"
  st_status "bound: push confirmation for these commits" 0 bash "$SELF" bound k OPERATOR_PUSH_CONFIRMED=yes "green=$H40" "red=$H40B"

  printf '%s\n' "OPERATOR_STALE=yes attempt=$ID1" >>"$F2"
  st_status "bound: line carries an earlier attempt id" 1 bash "$SELF" bound k OPERATOR_STALE
  printf '%s\n' "OPERATOR_STALE=yes attempt=$ID2" >>"$F2"
  st_status "bound: line carries the current attempt id" 0 bash "$SELF" bound k OPERATOR_STALE

  printf '%s\n' "PLAN_REVIEWED=yes attempt=$ID2 sha256=aaab$(st_hex 60 a)" >>"$F2"
  st_status "bound: prefix sha256=aaa of a longer value" 1 bash "$SELF" bound k PLAN_REVIEWED sha256=aaa
  st_status "bound: the whole recorded sha256" 0 bash "$SELF" bound k PLAN_REVIEWED "sha256=aaab$(st_hex 60 a)"
  printf '%s\n' "OPERATOR_REPLY=received attempt=$ID2 head=$H40" >>"$F2"
  st_status "bound: head given as its first seven digits" 1 bash "$SELF" bound k OPERATOR_REPLY "head=${H40:0:7}"
  st_status "bound: head given in full" 0 bash "$SELF" bound k OPERATOR_REPLY "head=$H40"

  printf '%s\n' "OPERATOR_APPLIED=yes attempt=$ID2 sha256=$H64" >>"$F2"
  printf '%s\n' "OPERATOR_APPLIED=error attempt=$ID2 sha256=$H64B" >>"$F2"
  st_status "bound: an earlier yes is overridden by the last line" 1 bash "$SELF" bound k OPERATOR_APPLIED=yes "sha256=$H64"
  st_status "bound: the last line" 0 bash "$SELF" bound k OPERATOR_APPLIED=error "sha256=$H64B"
  local got rc=0
  got="$(bash "$SELF" field k OPERATOR_APPLIED sha256)" || rc=$?
  st_report "field: prints the last line's sha256" "0:$H64B" "$rc:$got"
  st_status "field: no such field" 1 bash "$SELF" field k OPERATOR_APPLIED zone
  st_status "field: no such line" 1 bash "$SELF" field k OPERATOR_NONE sha256

  printf '%s\n' "OPERATOR_DECISION=keep attempt=$ID2 user=alice" >>"$F2"
  printf '%s\n' "OPERATOR_DECISION=drop attempt=$ID2 user=bob" >>"$F2"
  printf '%s\n' "OPERATOR_DECISION=keep attempt=$ID2 user=alice" >>"$F2"
  st_status "bound: --where user=bob" 0 bash "$SELF" bound k OPERATOR_DECISION --where user=bob
  st_status "bound: --where user=bob with its value" 0 bash "$SELF" bound k OPERATOR_DECISION=drop --where user=bob
  st_status "bound: --where user=bo (a prefix)" 1 bash "$SELF" bound k OPERATOR_DECISION --where user=bo

  # --- put: must refuse ---------------------------------------------------------------------------------
  st_status "new creates the put attempt" 0 bash "$SELF" new st
  local SID A
  SID="$(bash "$SELF" id st)"
  A="answer_attempt=$SID"

  st_put "no answer_attempt line" 2 - "s1_x=fine"
  st_put "answer_attempt of an earlier attempt" 2 - "answer_attempt=$ID1
s1_x=fine"

  st_put "rule 1: a bare value" 3 unnamed-line "$A
hunter2"
  st_put "rule 1: a line of JSON" 3 unnamed-line "$A
{\"name\":\"value\",\"count\":1}"
  st_put "rule 1: a Terraform apply line" 3 unnamed-line "$A
aws_iam_access_key.smtp: Creation complete after 1s [id=openvaa-smtp]"

  st_put "rule 2: db_password = hunter2" 3 secret-name "$A
s1_x=db_password = hunter2"
  st_put "rule 2: DB_PASSWORD=\"hunter2\"" 3 secret-name "$A
s1_x=DB_PASSWORD=\"hunter2\""
  st_put "rule 2: password: hunter2" 3 secret-name "$A
s1_x=password: hunter2"
  st_put "rule 2: JSON SecretAccessKey/SessionToken" 3 secret-name "$A
s1_x={\"SecretAccessKey\":\"abc\",\"SessionToken\":\"def\"}"
  st_put "rule 2: smtp_pass=abc" 3 secret-name "$A
s1_x=smtp_pass=abc"
  st_put "rule 2: apikey=abc" 3 secret-name "$A
s1_x=apikey=abc"
  st_put "rule 2: encrypted_secret = (known after apply)" 3 secret-name "$A
s1_x=encrypted_secret = (known after apply)"
  st_put "rule 2: Authorization: Bearer abc" 3 secret-name "$A
s1_x=Authorization: Bearer abc"
  st_put "rule 2: bearer=abc" 3 secret-name "$A
s1_x=bearer=abc"
  st_put "rule 2: db_passwords=a,b" 3 secret-name "$A
s1_x=db_passwords=a,b"
  st_put "rule 2: bypass=1 (refused on purpose)" 3 secret-name "$A
s1_x=bypass=1"
  st_put "rule 2: pass: hunter2 on an inventory line" 3 secret-name "$A
s5b_inv=pass: hunter2"
  st_put "rule 2: assert: PASS: hunter2 (not a verdict form)" 3 secret-name "$A
s5b_inv=assert: PASS: hunter2"
  st_put "rule 2: verdict then password: hunter2" 3 secret-name "$A
s5b_inv=assert: PASS: 2 IAM users, none with an inline policy password: hunter2"
  st_put "rule 2: verdict with a lower-case pass:" 3 secret-name "$A
s5b_inv=assert: pass: 2 IAM users, none with an inline policy"
  st_put "rule 2: verdict under a field named password" 3 secret-name "$A
s5_password=assert: PASS: 2 IAM users, none with an inline policy"
  st_put "rule 2: verdict on an answer line" 3 secret-name "$A
answer_inv=assert: PASS: 2 IAM users, none with an inline policy"
  st_put "rule 2: verdict whose prefix holds pass:" 3 secret-name "$A
s5b_inv=assert: PASS: 2 roles and users under /pass:hunter2/, none with an inline policy"
  st_put "rule 3: verdict holding an access key id as its prefix" 3 token-shape "$A
s5b_inv=assert: FAIL: nothing examined: no role or user lies under /AKIAABCDEFGHIJKLMNOP/"

  st_put "rule 3: AWS access key id" 3 token-shape "$A
s1_value=AKIAABCDEFGHIJKLMNOP"
  st_put "rule 3: AWS access key id in an apply line" 3 token-shape "$A
s1_value=aws_iam_access_key.smtp: Creation complete after 1s [id=AKIAABCDEFGHIJKLMNOP]"
  st_put "rule 3: three-part JWT" 3 token-shape "$A
s1_value=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl"
  st_put "rule 3: sbp_ and forty digits" 3 token-shape "$A
s1_value=sbp_$(st_hex 40 7)"
  st_put "rule 3: sb_secret_ and sixteen letters" 3 token-shape "$A
s1_value=sb_secret_abcdefghijklmnop"
  st_put "rule 3: ghp_ and thirty-six characters" 3 token-shape "$A
s1_value=ghp_abcdefghijklmnopqrstuvwxyz0123456789"
  st_put "rule 3: private-key header" 3 token-shape "$A
s1_value=-----BEGIN RSA PRIVATE KEY-----"
  st_put "rule 3: two-part eyJ string with one dot" 3 token-shape "$A
s1_value=eyJhbGciOiJIUzI1NiJ9.c2ln"
  st_put "rule 3: https URL with user information" 3 token-shape "$A
s1_value=https://user:pass@host.tld/path"
  st_put "rule 3: postgres connection string" 3 token-shape "$A
s1_value=postgres://user:pass@host/db"
  st_put "rule 3: forty base64 characters, no name" 3 token-shape "$A
s1_value=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  st_put "rule 3: sixty-four hex digits under value" 3 token-shape "$A
s1_value=$H64"
  st_put "rule 3: sixty-four hex capitals under value" 3 token-shape "$A
s1_value=$(st_hex 64 C)"
  st_put "rule 3: sixty-three hex digits under sha256" 3 token-shape "$A
s1_sha256=$H63"

  st_put "rule 5: an address at example.org" 3 address "$A
s1_x=ops@example.org"
  st_put "rule 5: an assumed-role ARN with a session" 3 session "$A
s1_x=arn:aws:sts::471112560111:assumed-role/OpenVAAPlan/kalle-session"

  # --- put: must pass -----------------------------------------------------------------------------------
  st_put "pass: plan line with (sensitive value)" 0 - "$A
s3_plan=~ database_password = (sensitive value)"
  st_put "pass: database_password = null" 0 - "$A
s3_plan=database_password = null"
  st_put "pass: BucketKeyEnabled: false" 0 - "$A
s3_x=BucketKeyEnabled: false"
  st_put "pass: auth.password_min_length" 0 - "$A
s3_auth.password_min_length=8"
  st_put "pass: auth.refresh_token_rotation_enabled" 0 - "$A
s3_auth.refresh_token_rotation_enabled=true"
  st_put "pass: auth.hook_custom_access_token_uri" 0 - "$A
s3_auth.hook_custom_access_token_uri=pg-functions://postgres/public/custom_access_token_hook"
  st_put "pass: OPERATOR_REPLY record line" 0 - "$A
OPERATOR_REPLY=received attempt=$SID plan=22 task=1 head=$H40 sha256=$H64"
  st_put "pass: OPERATOR_PUSH_CONFIRMED record line" 0 - "$A
OPERATOR_PUSH_CONFIRMED=yes attempt=$SID green=$H40 red=$H40B"
  st_put "pass: a field ending in sha256, 64 digits" 0 - "$A
s5_plan_sha256=$H64"
  st_put "pass: answer_ref, twenty lower-case letters" 0 - "$A
answer_ref=abcdefghijklmnopqrst"
  st_put "pass: dkim_cname_1, thirty-two base32" 0 - "$A
s4_dkim_cname_1=qwertyuiopasdfghjklzxcvbnm234567"
  st_put "pass: assumed-role ARN with no session" 0 - "$A
s2_role=arn:aws:sts::471112560111:assumed-role/OpenVAAPlan"
  st_put "pass: the two allowed addresses" 0 - "$A
note: sender noreply@staging.openvaa.org, DMARC reports to dmarc_agg@vali.email"
  st_put "pass: push result naming git@github.com" 0 - "$A
s6_push=git@github.com:OpenVAA/voting-advice-application.git"
  st_put "pass: S3 object ARN of the state bucket" 0 - "$A
s2_state_path=arn:aws:s3:::openvaa-tfstate-471112560111/pipeline/staging/aws/terraform.tfstate"
  st_put "pass: verdict PASS, IAM users" 0 - "$A
s5b_inv=assert: PASS: 2 IAM users, none with an inline policy"
  st_put "pass: verdict PASS, roles and users under a prefix" 0 - "$A
s5b_inv=assert: PASS: 3 roles and users under /openvaa/, none with an inline policy"
  st_put "pass: verdict FAIL, offending IAM users" 0 - "$A
s5b_inv=assert: FAIL: 1 of 2 IAM users carry an inline policy or could not be read"
  st_put "pass: verdict FAIL, offending under a prefix" 0 - "$A
s5b_inv=assert: FAIL: 1 of 3 roles and users under /openvaa/ci/ carry an inline policy or could not be read"
  st_put "pass: verdict FAIL, lists not read" 0 - "$A
s5b_inv=assert: FAIL: the user role list could not be read, so nothing was judged"
  st_put "pass: verdict FAIL, no complete list" 0 - "$A
s5b_inv=assert: FAIL: nothing examined: the input holds no complete user or role list"
  st_put "pass: verdict FAIL, nothing under the root prefix" 0 - "$A
s5b_inv=assert: FAIL: nothing examined: no role or user lies under /"

  if [ "$ST_FAILS" -eq 0 ]; then
    echo "self-test: all cases passed"
    return 0
  fi
  echo "self-test: FAIL $ST_FAILS case(s) failed"
  return 1
}

# ---------------------------------------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------------------------------------

[ $# -ge 1 ] || usage
cmd="$1"
shift
case "$cmd" in
  --self-test) self_test ;;
  new) [ $# -eq 1 ] || usage; cmd_new "$1" ;;
  id) [ $# -eq 1 ] || usage; cmd_id "$1" ;;
  path) [ $# -eq 1 ] || usage; cmd_path "$1" ;;
  has) [ $# -eq 2 ] || usage; cmd_has "$1" "$2" ;;
  bound) [ $# -ge 2 ] || usage; cmd_bound "$@" ;;
  field) [ $# -ge 3 ] || usage; cmd_field "$@" ;;
  put) [ $# -eq 1 ] || usage; cmd_put "$1" ;;
  -h | --help) usage ;;
  *) usage ;;
esac
