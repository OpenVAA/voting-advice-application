#!/usr/bin/env bash
#
# swap-schema.sh -- Switch between JSONB and relational answer storage schemas
#
# Usage:
#   ./swap-schema.sh jsonb         # Ensure JSONB schema is active (default)
#   ./swap-schema.sh relational    # Switch to relational schema
#   ./swap-schema.sh restore       # Restore JSONB schema from backup
#
# Must be run from apps/supabase/ directory, or will auto-detect via script location.

set -euo pipefail

# Auto-detect workspace directory from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPABASE_DIR="$(cd "$SCRIPT_DIR/../../supabase" && pwd)"
SCHEMA_DIR="$SUPABASE_DIR/schema"
MIGRATION_DIR="$SUPABASE_DIR/migrations"
MIGRATION_FILE="$MIGRATION_DIR/00001_initial_schema.sql"

# Schema file paths
JSONB_FILE="$SCHEMA_DIR/006-answers-jsonb.sql"
JSONB_BACKUP="$SCHEMA_DIR/006-answers-jsonb.sql.bak"
RELATIONAL_SRC="$SCHEMA_DIR/alternatives/answers-relational.sql"
RELATIONAL_FILE="$SCHEMA_DIR/006-answers-relational.sql"

# Concatenation order (per Phase 10 decision: 010-rls.sql comes AFTER 012-auth-hooks.sql)
SCHEMA_FILES=(
  "000-functions.sql"
  "001-tenancy.sql"
  "002-elections.sql"
  "003-entities.sql"
  "004-questions.sql"
  "005-nominations.sql"
  "007-app-settings.sql"
  "008-views.sql"
  "009-indexes.sql"
  "011-auth-tables.sql"
  "012-auth-hooks.sql"
  "010-rls.sql"
  "013-auth-rls.sql"
)

regenerate_migration() {
  echo "Regenerating migration..."
  > "$MIGRATION_FILE"

  for f in "${SCHEMA_FILES[@]}"; do
    local fpath="$SCHEMA_DIR/$f"
    if [[ -f "$fpath" ]]; then
      cat "$fpath" >> "$MIGRATION_FILE"
      echo "" >> "$MIGRATION_FILE"
    fi
  done

  # Add the active 006-* file (either jsonb or relational)
  # We insert it after 005-nominations.sql content. Since we already wrote all
  # files in order, we need to reconstruct with the 006 file in the right spot.
  # Actually, let's rebuild properly with 006 in the correct position.

  > "$MIGRATION_FILE"
  for f in "${SCHEMA_FILES[@]}"; do
    local fpath="$SCHEMA_DIR/$f"
    if [[ -f "$fpath" ]]; then
      cat "$fpath" >> "$MIGRATION_FILE"
      echo "" >> "$MIGRATION_FILE"
    fi

    # After 005-nominations.sql, insert the active 006-* file
    if [[ "$f" == "005-nominations.sql" ]]; then
      if [[ -f "$JSONB_FILE" ]]; then
        cat "$JSONB_FILE" >> "$MIGRATION_FILE"
        echo "" >> "$MIGRATION_FILE"
      elif [[ -f "$RELATIONAL_FILE" ]]; then
        cat "$RELATIONAL_FILE" >> "$MIGRATION_FILE"
        echo "" >> "$MIGRATION_FILE"
      fi
    fi
  done

  echo "Migration regenerated at $MIGRATION_FILE"
}

reset_db() {
  echo "Resetting database..."
  # Run supabase db reset from the supabase project directory
  local workspace_dir
  workspace_dir="$(cd "$SUPABASE_DIR/.." && pwd)"
  (cd "$workspace_dir" && npx supabase db reset)
  echo "Database reset complete."
}

case "${1:-}" in
  jsonb)
    echo "Switching to JSONB schema..."

    if [[ -f "$JSONB_FILE" ]]; then
      echo "JSONB schema already active."
    elif [[ -f "$JSONB_BACKUP" ]]; then
      echo "Restoring JSONB schema from backup..."
      mv "$JSONB_BACKUP" "$JSONB_FILE"
      rm -f "$RELATIONAL_FILE"
    else
      echo "ERROR: No JSONB schema file or backup found."
      echo "Expected: $JSONB_FILE or $JSONB_BACKUP"
      exit 1
    fi

    regenerate_migration
    reset_db
    echo "JSONB schema active."
    ;;

  relational)
    echo "Switching to relational schema..."

    if [[ ! -f "$RELATIONAL_SRC" ]]; then
      echo "ERROR: Relational schema source not found at $RELATIONAL_SRC"
      exit 1
    fi

    # Backup JSONB if present
    if [[ -f "$JSONB_FILE" ]]; then
      cp "$JSONB_FILE" "$JSONB_BACKUP"
      rm "$JSONB_FILE"
      echo "Backed up JSONB schema to $JSONB_BACKUP"
    fi

    # Copy relational schema into place
    cp "$RELATIONAL_SRC" "$RELATIONAL_FILE"
    echo "Relational schema copied to $RELATIONAL_FILE"

    regenerate_migration
    reset_db
    echo "Relational schema active."
    ;;

  restore)
    echo "Restoring JSONB schema..."

    if [[ -f "$JSONB_BACKUP" ]]; then
      mv "$JSONB_BACKUP" "$JSONB_FILE"
      rm -f "$RELATIONAL_FILE"
      echo "JSONB schema restored from backup."
    elif [[ -f "$JSONB_FILE" ]]; then
      rm -f "$RELATIONAL_FILE"
      echo "JSONB schema already in place."
    else
      echo "ERROR: No JSONB backup or schema file found."
      exit 1
    fi

    regenerate_migration
    reset_db
    echo "JSONB schema restored and active."
    ;;

  *)
    echo "Usage: $0 {jsonb|relational|restore}"
    echo ""
    echo "  jsonb        Ensure JSONB answer storage schema (default)"
    echo "  relational   Switch to relational answer storage schema"
    echo "  restore      Restore JSONB schema from backup"
    exit 1
    ;;
esac
