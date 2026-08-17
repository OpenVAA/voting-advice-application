#!/bin/bash
# run-concurrency-scaling.sh
#
# Tests how JSONB and relational voter bulk-read scale under high concurrency.
# Runs at 5K scale with 1, 50, 100, 200, 500, and 1000 concurrent readers.

set -euo pipefail

BENCH_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SUPABASE_DIR="$(cd "$BENCH_DIR/.." && pwd)"
RESULTS_DIR="$BENCH_DIR/results/concurrency"
PG_HOST="127.0.0.1"
PG_PORT="54322"
PG_USER="postgres"
PG_PASS="postgres"
PG_DB="postgres"
DB_URL="postgresql://$PG_USER:$PG_PASS@$PG_HOST:$PG_PORT/$PG_DB"
DURATION="${1:-20}"  # seconds per benchmark
SCALE=5000

CONCURRENCY_LEVELS=(1 50 100 200 500 1000)

mkdir -p "$RESULTS_DIR"
export PGPASSWORD="$PG_PASS"

run_pgbench() {
  local name="$1"
  local script="$2"
  local clients="$3"
  local threads="$4"
  local logprefix="$RESULTS_DIR/$name"

  echo "  Running: $name (c=$clients, T=${DURATION}s)..."

  # Clean up any prior log files for this name
  rm -f "${logprefix}".[0-9]* "${logprefix}".json 2>/dev/null || true

  pgbench -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
    -c "$clients" -j "$threads" -T "$DURATION" \
    --log --log-prefix="$logprefix" \
    -f "$script" "$PG_DB" > "${logprefix}.stdout" 2>&1

  # Parse all log files into combined JSON
  find "$RESULTS_DIR" -name "$(basename "$logprefix").*" -not -name "*.json" -not -name "*.stdout" -print0 2>/dev/null \
    | xargs -0 cat 2>/dev/null \
    | python3 "$BENCH_DIR/scripts/parse-pgbench-log.py" --json > "${logprefix}.json" 2>/dev/null || true

  # Show quick summary
  if [ -f "${logprefix}.json" ]; then
    python3 -c "
import json
d = json.load(open('${logprefix}.json'))
print(f'    avg={d[\"avg_ms\"]:.1f}ms  p50={d[\"p50_ms\"]:.1f}ms  p95={d[\"p95_ms\"]:.1f}ms  p99={d[\"p99_ms\"]:.1f}ms  txn={d[\"transactions\"]}')
" 2>/dev/null || echo "    (parse error)"
  fi
}

threads_for_clients() {
  local c="$1"
  if [ "$c" -le 1 ]; then echo 1
  elif [ "$c" -le 50 ]; then echo 4
  elif [ "$c" -le 200 ]; then echo 8
  else echo 16
  fi
}

echo "============================================"
echo " CONCURRENCY SCALING BENCHMARKS"
echo " Scale: ${SCALE} candidates, Duration: ${DURATION}s"
echo " Concurrency levels: ${CONCURRENCY_LEVELS[*]}"
echo "============================================"
echo ""

# ============================================
# PHASE 1: JSONB Schema
# ============================================
echo "--- PHASE 1: JSONB SCHEMA ---"
echo ""

# Check current schema
HAS_ANSWERS_COL=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'answers' AND table_schema = 'public');" 2>/dev/null)

if [ "$HAS_ANSWERS_COL" != "t" ]; then
  echo "JSONB schema not active, swapping..."
  bash "$BENCH_DIR/scripts/swap-schema.sh" jsonb
fi

# Check if data needs loading
CAND_COUNT=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT count(*) FROM candidates WHERE project_id IN (SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n);" 2>/dev/null)

if [ "$CAND_COUNT" -lt "$SCALE" ]; then
  echo "Generating JSONB data (scale=$SCALE)..."
  psql "$DB_URL" -v "scale=$SCALE" -f "$BENCH_DIR/data/generate-shared-data.sql" -q 2>&1 | tail -2
  psql "$DB_URL" -v "scale=$SCALE" -f "$BENCH_DIR/data/generate-candidates-jsonb.sql" -q 2>&1 | tail -2
fi

CAND_COUNT=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT count(*) FROM candidates;" 2>/dev/null)
echo "Candidates in DB: $CAND_COUNT"
echo ""

for c in "${CONCURRENCY_LEVELS[@]}"; do
  t=$(threads_for_clients "$c")
  run_pgbench "jsonb-${c}c" "$BENCH_DIR/pgbench/voter-bulk-read-jsonb.sql" "$c" "$t"
done

echo ""

# ============================================
# PHASE 2: Relational Schema
# ============================================
echo "--- PHASE 2: RELATIONAL SCHEMA ---"
echo ""

echo "Swapping to relational schema..."
bash "$BENCH_DIR/scripts/swap-schema.sh" relational
echo ""

echo "Generating relational data (scale=$SCALE)..."
psql "$DB_URL" -v "scale=$SCALE" -f "$BENCH_DIR/data/generate-shared-data.sql" -q 2>&1 | tail -2
psql "$DB_URL" -v "scale=$SCALE" -f "$BENCH_DIR/data/generate-candidates-relational.sql" -q 2>&1 | tail -2

CAND_COUNT=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT count(*) FROM candidates;" 2>/dev/null)
echo "Candidates in DB: $CAND_COUNT"
echo ""

for c in "${CONCURRENCY_LEVELS[@]}"; do
  t=$(threads_for_clients "$c")
  run_pgbench "relational-${c}c" "$BENCH_DIR/pgbench/voter-bulk-read-relational.sql" "$c" "$t"
done

echo ""

# ============================================
# PHASE 3: Restore JSONB Schema
# ============================================
echo "--- Restoring JSONB schema ---"
bash "$BENCH_DIR/scripts/swap-schema.sh" restore
echo ""

# ============================================
# RESULTS COMPARISON
# ============================================
echo "============================================"
echo " CONCURRENCY SCALING RESULTS (5K candidates)"
echo "============================================"
echo ""
printf "  %-12s  %10s %10s  %10s %10s  %8s\n" "Concurrency" "JSONB avg" "REL avg" "JSONB p95" "REL p95" "Winner"
printf "  %-12s  %10s %10s  %10s %10s  %8s\n" "-----------" "--------" "-------" "--------" "-------" "------"

for c in "${CONCURRENCY_LEVELS[@]}"; do
  jsonb_f="$RESULTS_DIR/jsonb-${c}c.json"
  rel_f="$RESULTS_DIR/relational-${c}c.json"

  if [ -f "$jsonb_f" ] && [ -f "$rel_f" ]; then
    python3 -c "
import json
j = json.load(open('$jsonb_f'))
r = json.load(open('$rel_f'))
winner = 'JSONB' if j['avg_ms'] < r['avg_ms'] else 'REL'
ratio = max(j['avg_ms'], r['avg_ms']) / max(min(j['avg_ms'], r['avg_ms']), 0.01)
print(f'  {\"${c}c\":12s}  {j[\"avg_ms\"]:9.1f}ms {r[\"avg_ms\"]:9.1f}ms  {j[\"p95_ms\"]:9.1f}ms {r[\"p95_ms\"]:9.1f}ms  {winner} {ratio:.1f}x')
" 2>/dev/null || echo "  ${c}c  (parse error)"
  else
    echo "  ${c}c  (missing results)"
  fi
done

echo ""
echo "Done. Results in: $RESULTS_DIR/"
