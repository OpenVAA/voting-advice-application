# shellcheck shell=bash
#
# hosted-target.sh -- The one rule for whether the PG* variables and a linked work directory name the same hosted Supabase project. Sourced, never run.
#
# infra/scripts/push-migrations.sh and infra/scripts/check-drift.sh --target linked refuse a wrong target through it before they connect, and the hosted probe's catalog source, assertCatalogTarget of infra/scripts/probe/sources.mjs, holds the same host, user, port and variable rules in JavaScript.
#
# The sourcing script sources scripts/lib/cli.sh first, for `fatal`, and sets REPO_ROOT.

# Refuses, through `fatal` with status 2, a target that is not the linked project <ref>:
#   - the work directory is apps/supabase, the shared local stack's work directory, where a link changes the images that stack starts;
#   - supabase/.temp/project-ref of the work directory is missing or does not hold <ref>;
#   - PGHOSTADDR or PGSERVICE is set, either of which can send a connection to another address than PGHOST;
#   - PGHOST is neither the direct host db.<ref>.supabase.co nor one session pooler host <name>.pooler.supabase.com with a PGUSER ending in .<ref>;
#   - PGPORT is 6543, the transaction pooler, which loses the session's settings between transactions.
# Sets LINKED_CONNECTION to `direct` or `pooler`, the path PGHOST takes.
#
# $1 = the work directory, $2 = the project ref.
assert_linked_project_target() {
  local workdir="$1" ref="$2" ref_file linked_ref="" variable shared_stack
  shared_stack="$(cd "$REPO_ROOT/apps/supabase" 2>/dev/null && pwd -P)" || shared_stack=""
  if [ -n "$shared_stack" ] && [ "$(cd "$workdir" 2>/dev/null && pwd -P)" = "$shared_stack" ]; then
    fatal "the work directory is apps/supabase, the shared local stack's work directory, and a link there changes the images that stack starts; give a linked work directory of its own" 2
  fi
  ref_file="$workdir/supabase/.temp/project-ref"
  if [ ! -f "$ref_file" ]; then
    fatal "the work directory is not linked: it holds no supabase/.temp/project-ref: $workdir" 2
  fi
  IFS= read -r linked_ref <"$ref_file" || true
  if [ "$linked_ref" != "$ref" ]; then
    fatal "the work directory is linked to the project '$linked_ref', not '$ref'" 2
  fi
  for variable in PGHOSTADDR PGSERVICE; do
    if [ -n "${!variable:-}" ]; then
      fatal "$variable is set, which can send a connection to another address than PGHOST, so it may reach another project than $ref" 2
    fi
  done
  case "${PGHOST:-}" in
    "db.$ref.supabase.co")
      LINKED_CONNECTION=direct
      ;;
    *.pooler.supabase.com)
      if ! [[ "$PGHOST" =~ ^[a-z0-9-]+\.pooler\.supabase\.com$ ]]; then
        fatal "PGHOST '$PGHOST' is not one session pooler host, so it may reach another project than $ref" 2
      fi
      case "${PGUSER:-}" in
        *".$ref") ;;
        *) fatal "PGHOST is a session pooler host, and PGUSER '${PGUSER:-}' does not end in .$ref, so it may reach another project" 2 ;;
      esac
      LINKED_CONNECTION=pooler
      ;;
    *)
      fatal "PGHOST '${PGHOST:-}' is neither db.$ref.supabase.co nor a session pooler host, so it may reach another project" 2
      ;;
  esac
  if [ "${PGPORT:-}" = "6543" ]; then
    fatal "PGPORT 6543 is the transaction pooler, which loses the session's settings between transactions; use the session port 5432" 2
  fi
}
