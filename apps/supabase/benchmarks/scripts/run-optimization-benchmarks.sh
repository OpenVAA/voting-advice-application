#!/bin/bash
# run-optimization-benchmarks.sh
#
# Benchmarks optimized relational read queries and smart JSONB validation trigger.
# Assumes Supabase is running and data is already loaded from the main benchmark run.

set -euo pipefail

BENCH_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS_DIR="$BENCH_DIR/results/optimization"
PG_HOST="127.0.0.1"
PG_PORT="54322"
PG_USER="postgres"
PG_PASS="postgres"
PG_DB="postgres"
DURATION="${1:-30}"  # seconds per benchmark

mkdir -p "$RESULTS_DIR"

export PGPASSWORD="$PG_PASS"

parse_pgbench_log() {
  python3 "$BENCH_DIR/scripts/parse-pgbench-log.py" --json
}

run_pgbench() {
  local name="$1"
  local script="$2"
  local clients="${3:-1}"
  local threads="${4:-1}"
  local logprefix="$RESULTS_DIR/$name"

  echo "  Running: $name (c=$clients, T=${DURATION}s)..."

  pgbench -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
    -c "$clients" -j "$threads" -T "$DURATION" \
    --log --log-prefix="$logprefix" \
    -f "$script" "$PG_DB" > "$logprefix.stdout" 2>&1

  cat "$logprefix".* 2>/dev/null | grep -v "^$" | parse_pgbench_log > "$logprefix.json" 2>/dev/null || true
  echo "  Done: $name"
}

echo "============================================"
echo " OPTIMIZATION BENCHMARKS"
echo "============================================"
echo ""

# Check which schema is active
HAS_ANSWERS_TABLE=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'answers' AND table_schema = 'public');" 2>/dev/null)

HAS_ANSWERS_COLUMN=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'answers' AND table_schema = 'public');" 2>/dev/null)

echo "Schema check: answers table=$HAS_ANSWERS_TABLE, answers column=$HAS_ANSWERS_COLUMN"

# Count data
CANDIDATE_COUNT=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT count(*) FROM candidates;" 2>/dev/null)
echo "Candidates in DB: $CANDIDATE_COUNT"
echo ""

# ============================================
# PART 1: Optimized Relational Reads
# ============================================

if [ "$HAS_ANSWERS_TABLE" = "t" ]; then
  echo "--- PART 1: Optimized Relational Read Queries ---"
  echo ""

  # Baseline: original correlated subquery
  run_pgbench "rel-correlated-1c" "$BENCH_DIR/pgbench/voter-bulk-read-relational.sql" 1 1

  # CTE + GROUP BY
  run_pgbench "rel-cte-1c" "$BENCH_DIR/pgbench/voter-bulk-read-relational-cte.sql" 1 1

  # LATERAL JOIN
  run_pgbench "rel-lateral-1c" "$BENCH_DIR/pgbench/voter-bulk-read-relational-lateral.sql" 1 1

  # Two-query approach
  run_pgbench "rel-two-query-1c" "$BENCH_DIR/pgbench/voter-bulk-read-relational-two-query.sql" 1 1

  echo ""
  echo "--- Relational reads with 50 concurrent clients ---"
  echo ""

  run_pgbench "rel-correlated-50c" "$BENCH_DIR/pgbench/voter-bulk-read-relational.sql" 50 4
  run_pgbench "rel-cte-50c" "$BENCH_DIR/pgbench/voter-bulk-read-relational-cte.sql" 50 4
  run_pgbench "rel-lateral-50c" "$BENCH_DIR/pgbench/voter-bulk-read-relational-lateral.sql" 50 4
  run_pgbench "rel-two-query-50c" "$BENCH_DIR/pgbench/voter-bulk-read-relational-two-query.sql" 50 4

  echo ""
else
  echo "--- PART 1: SKIPPED (no relational answers table) ---"
  echo "Run swap-schema.sh relational first, generate data, then re-run."
  echo ""
fi

# ============================================
# PART 2: Smart JSONB Validation Trigger
# ============================================

if [ "$HAS_ANSWERS_COLUMN" = "t" ]; then
  echo "--- PART 2: JSONB Write with Smart Trigger ---"
  echo ""

  # Baseline: original trigger (write)
  echo "  [Original trigger]"
  run_pgbench "jsonb-write-original-1c" "$BENCH_DIR/pgbench/candidate-write-jsonb.sql" 1 1
  run_pgbench "jsonb-write-original-50c" "$BENCH_DIR/pgbench/candidate-write-jsonb.sql" 50 4

  # Install smart trigger
  echo "  Installing smart JSONB validation trigger..."
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
    -f "$BENCH_DIR/scripts/install-smart-jsonb-trigger.sql" > /dev/null 2>&1
  echo "  Smart trigger installed."

  # Smart trigger benchmarks
  echo "  [Smart trigger]"
  run_pgbench "jsonb-write-smart-1c" "$BENCH_DIR/pgbench/candidate-write-jsonb.sql" 1 1
  run_pgbench "jsonb-write-smart-50c" "$BENCH_DIR/pgbench/candidate-write-jsonb.sql" 50 4

  # Restore original trigger
  echo "  Restoring original JSONB validation trigger..."
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
    -f "$BENCH_DIR/scripts/restore-original-jsonb-trigger.sql" > /dev/null 2>&1
  echo "  Original trigger restored."

  echo ""
else
  echo "--- PART 2: SKIPPED (no JSONB answers column) ---"
  echo ""
fi

# ============================================
# PART 3: Also benchmark JSONB reads for comparison
# ============================================

if [ "$HAS_ANSWERS_COLUMN" = "t" ]; then
  echo "--- PART 3: JSONB Read Baseline (for comparison) ---"
  echo ""
  run_pgbench "jsonb-read-1c" "$BENCH_DIR/pgbench/voter-bulk-read-jsonb.sql" 1 1
  run_pgbench "jsonb-read-50c" "$BENCH_DIR/pgbench/voter-bulk-read-jsonb.sql" 50 4
  echo ""
fi

echo "============================================"
echo " RESULTS SUMMARY"
echo "============================================"
echo ""

for f in "$RESULTS_DIR"/*.json; do
  [ -f "$f" ] || continue
  name=$(basename "$f" .json)
  p50=$(python3 -c "import json; d=json.load(open('$f')); print(f\"{d['p50_ms']:.2f}\")" 2>/dev/null || echo "N/A")
  p95=$(python3 -c "import json; d=json.load(open('$f')); print(f\"{d['p95_ms']:.2f}\")" 2>/dev/null || echo "N/A")
  p99=$(python3 -c "import json; d=json.load(open('$f')); print(f\"{d['p99_ms']:.2f}\")" 2>/dev/null || echo "N/A")
  avg=$(python3 -c "import json; d=json.load(open('$f')); print(f\"{d['avg_ms']:.2f}\")" 2>/dev/null || echo "N/A")
  printf "  %-35s  p50=%7s  p95=%7s  p99=%7s  avg=%7s\n" "$name" "$p50" "$p95" "$p99" "$avg"
done

echo ""
echo "Done. Raw results in: $RESULTS_DIR/"
