#!/usr/bin/env bash
#
# 169-planted-import-rules.sh -- the D-17 planted-violation proof for the four import rules.
#
# Usage: bash .planning/phases/169-dependency-bump-to-latest-safe-versions/169-planted-import-rules.sh <namespace>
#   <namespace> is the plugin key the shared ESLint config registers: `import` (eslint-plugin-import) or
#   `import-x` (eslint-plugin-import-x).
#
# Writes one fixture per rule under packages/core/src/__planted_169__/, lints the directory from the
# packages/core directory with the repository's ESLint binary (node_modules/.bin/eslint; @openvaa/core does not
# declare eslint itself, so `yarn workspace @openvaa/core exec eslint` is "command not found") -- the config it
# resolves is the root eslint.config.mjs, i.e. the shared config -- in JSON form, and requires each fixture's messages to
# include `<namespace>/<its rule>`. The config-lookup flag is passed only when `eslint --version` reports
# major 9 (ESLint 10 makes lookup-from-file the default and rejects the flag). The fixtures are removed again
# (also by an EXIT trap) and `git status --porcelain -- packages/core/src` must be empty afterwards.
#
# Output: one line per rule, `<namespace>/<rule>: fired|MISSING`.
# Exit codes: 0 all four fired and nothing was left behind; 1 a rule was missing, ESLint output was not
# parseable, or a fixture survived; 2 usage error.

set -u

NS="${1:-}"
if [ -z "$NS" ]; then
  echo "169-planted-import-rules.sh: a <namespace> is required (import | import-x)" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

FIX_REL="src/__planted_169__"
FIX_DIR="packages/core/$FIX_REL"
OUT="$(mktemp -t planted169.XXXXXX)"

cleanup() {
  rm -rf "$FIX_DIR"
  rm -f "$OUT"
}
trap cleanup EXIT

if [ -e "$FIX_DIR" ]; then
  echo "169-planted-import-rules.sh: $FIX_DIR already exists -- refusing to overwrite" >&2
  exit 1
fi
mkdir -p "$FIX_DIR"

# first: a statement before an import.
cat > "$FIX_DIR/first.ts" <<'EOF'
export const before = 1;
import { join } from 'node:path';

export const joined = join(String(before));
EOF

# newline-after-import: no blank line between the last import and the next statement.
cat > "$FIX_DIR/newline-after-import.ts" <<'EOF'
import { join } from 'node:path';
export const joined = join('a');
EOF

# no-duplicates: two imports from the same module.
cat > "$FIX_DIR/no-duplicates.ts" <<'EOF'
import { join } from 'node:path';
import { resolve } from 'node:path';

export const joined = join(resolve('a'));
EOF

# consistent-type-specifier-style (prefer-top-level): an inline `type` specifier.
cat > "$FIX_DIR/consistent-type-specifier-style.ts" <<'EOF'
import { type Stats, statSync } from 'node:fs';

export const stats: Stats = statSync('.');
EOF

ESLINT_BIN="$REPO_ROOT/node_modules/.bin/eslint"
if [ ! -x "$ESLINT_BIN" ]; then
  echo "169-planted-import-rules.sh: $ESLINT_BIN is missing -- run yarn install" >&2
  exit 1
fi
ESLINT_VERSION="$(cd packages/core && "$ESLINT_BIN" --version 2>/dev/null)"
ESLINT_MAJOR="$(printf '%s' "$ESLINT_VERSION" | sed -E 's/^v?([0-9]+).*/\1/')"
FLAG_ARGS=()
if [ "$ESLINT_MAJOR" = "9" ]; then
  FLAG_ARGS=(--flag v10_config_lookup_from_file)
fi
echo "eslint: $ESLINT_VERSION (namespace: $NS${FLAG_ARGS[*]:+, ${FLAG_ARGS[*]}})"

# ESLint exits 1 when it reports errors, which every fixture does by design; the JSON is checked instead.
(cd packages/core && "$ESLINT_BIN" ${FLAG_ARGS[@]+"${FLAG_ARGS[@]}"} --format json "$FIX_REL") > "$OUT" 2>/dev/null

RESULT_FILE="$(mktemp -t planted169res.XXXXXX)"
node -e '
const fs = require("node:fs");
const [out, ns] = process.argv.slice(1);
let results;
try {
  results = JSON.parse(fs.readFileSync(out, "utf8"));
} catch (e) {
  console.log("ESLint output was not JSON: " + e.message);
  process.exit(1);
}
const rules = ["first", "newline-after-import", "no-duplicates", "consistent-type-specifier-style"];
let missing = 0;
for (const rule of rules) {
  const file = results.find((r) => r.filePath.endsWith("/" + rule + ".ts"));
  const id = ns + "/" + rule;
  const fired = !!file && file.messages.some((m) => m.ruleId === id);
  if (!fired) missing++;
  console.log(id + ": " + (fired ? "fired" : "MISSING"));
}
process.exit(missing ? 1 : 0);
' "$OUT" "$NS" > "$RESULT_FILE"
STATUS=$?
cat "$RESULT_FILE"
rm -f "$RESULT_FILE"

cleanup
LEFT="$(git status --porcelain -- packages/core/src)"
if [ -n "$LEFT" ]; then
  echo "169-planted-import-rules.sh: packages/core/src is not clean after cleanup:" >&2
  echo "$LEFT" >&2
  exit 1
fi

exit "$STATUS"
