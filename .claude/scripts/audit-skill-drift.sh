#!/usr/bin/env bash
# Audit skill drift: checks if source code targets have changed since a skill was last updated.
# Usage: .claude/scripts/audit-skill-drift.sh [skill-name]
# Without arguments, audits all skills.

set -euo pipefail

SKILLS_DIR=".claude/skills"
DRIFTED=0
CHECKED=0
SKIPPED=0

audit_skill() {
  local skill_dir="$1"
  local skill_name
  skill_name=$(basename "$skill_dir")
  local skill_md="$skill_dir/SKILL.md"

  if [[ ! -f "$skill_md" ]]; then
    return
  fi

  # Parse targets from YAML frontmatter
  local targets=()
  local in_targets=false
  local in_frontmatter=false
  while IFS= read -r line; do
    if [[ "$line" == "---" ]]; then
      if $in_frontmatter; then
        break
      fi
      in_frontmatter=true
      continue
    fi
    if $in_frontmatter && [[ "$line" =~ ^targets: ]]; then
      # Check for inline empty array
      if [[ "$line" =~ \[\] ]]; then
        break
      fi
      in_targets=true
      continue
    fi
    if $in_targets; then
      if [[ "$line" =~ ^[[:space:]]+-[[:space:]]+(.*) ]]; then
        targets+=("${BASH_REMATCH[1]}")
      else
        break
      fi
    fi
  done < "$skill_md"

  if [[ ${#targets[@]} -eq 0 ]]; then
    ((SKIPPED++))
    printf "  %-14s  SKIP  (no targets defined)\n" "$skill_name"
    return
  fi

  ((CHECKED++))

  # Last commit touching any file in the skill directory
  local skill_commit
  skill_commit=$(git log -1 --format="%H" -- "$skill_dir/" 2>/dev/null || true)

  if [[ -z "$skill_commit" ]]; then
    printf "  %-14s  SKIP  (skill not yet committed)\n" "$skill_name"
    ((SKIPPED++))
    return
  fi

  local skill_date
  skill_date=$(git log -1 --format="%ci" "$skill_commit" | cut -d' ' -f1)

  # Count commits to target dirs since skill was last updated
  local total_commits=0
  local changed_files=0
  local target_details=""

  for target in "${targets[@]}"; do
    if [[ ! -d "$target" ]]; then
      target_details+="    $target  (directory not found)\n"
      continue
    fi

    local commits
    commits=$(git rev-list "$skill_commit"..HEAD -- "$target" 2>/dev/null | wc -l | tr -d ' ')
    local files
    files=$(git diff --name-only "$skill_commit"..HEAD -- "$target" 2>/dev/null | wc -l | tr -d ' ')

    total_commits=$((total_commits + commits))
    changed_files=$((changed_files + files))

    if [[ "$commits" -gt 0 ]]; then
      target_details+="    $target  ($commits commits, $files files changed)\n"
    fi
  done

  if [[ "$total_commits" -eq 0 ]]; then
    printf "  %-14s  OK    (synced as of %s)\n" "$skill_name" "$skill_date"
  else
    ((DRIFTED++))
    printf "  %-14s  DRIFT  %d commits, %d files since %s\n" "$skill_name" "$total_commits" "$changed_files" "$skill_date"
    printf "$target_details"
  fi
}

echo ""
echo "Skill Drift Audit"
echo "================="
echo ""

if [[ $# -gt 0 ]]; then
  # Audit specific skill
  skill_dir="$SKILLS_DIR/$1"
  if [[ ! -d "$skill_dir" ]]; then
    echo "Skill not found: $1"
    exit 1
  fi
  audit_skill "$skill_dir"
else
  # Audit all skills
  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] && audit_skill "$skill_dir"
  done
fi

echo ""
echo "---"
echo "Checked: $CHECKED  Drifted: $DRIFTED  Skipped: $SKIPPED"

if [[ "$DRIFTED" -gt 0 ]]; then
  echo ""
  echo "Drifted skills may contain outdated information."
  echo "Review target changes and update skill files as needed."
  exit 1
fi
