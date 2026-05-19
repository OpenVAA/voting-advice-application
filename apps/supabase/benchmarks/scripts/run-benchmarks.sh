#!/usr/bin/env bash
#
# run-benchmarks.sh -- Orchestrate full JSONB vs relational benchmark suite
#
# Usage:
#   ./run-benchmarks.sh --quick                    # 1K only, 10s runs, both schemas
#   ./run-benchmarks.sh --full                     # 1K/5K/10K, 30s runs, both schemas
#   ./run-benchmarks.sh --scale 5000 --schema jsonb  # Specific scale and schema
#
# Prerequisites:
#   - Supabase local dev stack running (supabase start)
#   - pgbench installed (brew install postgresql@15 or available in PATH)
#   - k6 installed (brew install k6) -- optional, only for HTTP tests
#   - psql installed (comes with postgresql)
#
# The script automatically:
#   1. Swaps schema (JSONB or relational)
#   2. Generates test data at each scale tier
#   3. Runs pgbench benchmarks for all query patterns
#   4. Parses results into JSON
#   5. Runs k6 HTTP tests (--full mode only)
#   6. Restores JSONB schema when done

set -euo pipefail

# Auto-detect paths from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BENCHMARKS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SUPABASE_WORKSPACE="$(cd "$BENCHMARKS_DIR/.." && pwd)"
RESULTS_DIR="$BENCHMARKS_DIR/results"

# Database connection
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-54322}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
DB_URL="postgresql://$DB_USER:postgres@$DB_HOST:$DB_PORT/$DB_NAME"
export PGPASSWORD="${PGPASSWORD:-postgres}"

# Defaults
MODE="quick"
SCHEMAS=("jsonb" "relational")
SCALES=()
DURATION=10
RUN_K6=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --quick)
      MODE="quick"
      DURATION=10
      SCALES=(1000)
      RUN_K6=false
      shift
      ;;
    --full)
      MODE="full"
      DURATION=30
      SCALES=(1000 5000 10000)
      RUN_K6=true
      shift
      ;;
    --scale)
      SCALES=("$2")
      shift 2
      ;;
    --schema)
      case "$2" in
        jsonb) SCHEMAS=("jsonb") ;;
        relational) SCHEMAS=("relational") ;;
        both) SCHEMAS=("jsonb" "relational") ;;
        *) echo "ERROR: --schema must be jsonb, relational, or both"; exit 1 ;;
      esac
      shift 2
      ;;
    --duration)
      DURATION="$2"
      shift 2
      ;;
    --k6)
      RUN_K6=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --quick              1K scale, 10s runs (default)"
      echo "  --full               1K/5K/10K scales, 30s runs, k6 tests"
      echo "  --scale N            Specific candidate scale (e.g., 5000)"
      echo "  --schema S           Schema variant: jsonb, relational, or both (default: both)"
      echo "  --duration N         pgbench run duration in seconds"
      echo "  --k6                 Also run k6 HTTP tests"
      echo "  --help               Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Default scales if not set
if [[ ${#SCALES[@]} -eq 0 ]]; then
  SCALES=(1000)
fi

# Create results directory
mkdir -p "$RESULTS_DIR"

# Try to get anon key from supabase status
ANON_KEY=""
if command -v npx &>/dev/null; then
  ANON_KEY=$(cd "$SUPABASE_WORKSPACE" && npx supabase status 2>/dev/null | grep "anon key" | awk '{print $NF}' || true)
fi
if [[ -z "$ANON_KEY" ]]; then
  # Fall back to well-known local dev anon key
  ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
fi

# Verify prerequisites
echo "=== Benchmark Configuration ==="
echo "Mode: $MODE"
echo "Schemas: ${SCHEMAS[*]}"
echo "Scales: ${SCALES[*]}"
echo "Duration: ${DURATION}s per benchmark"
echo "k6 tests: $RUN_K6"
echo "DB URL: postgresql://$DB_USER:***@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Check pgbench availability
if ! command -v pgbench &>/dev/null; then
  echo "WARNING: pgbench not found in PATH."
  echo "Install with: brew install postgresql@15"
  echo "Or ensure /opt/homebrew/opt/postgresql@15/bin is in your PATH."
  exit 1
fi

# Check psql availability
if ! command -v psql &>/dev/null; then
  echo "WARNING: psql not found in PATH."
  exit 1
fi

run_pgbench() {
  local variant="$1"
  local scale="$2"
  local pattern="$3"
  local clients="${4:-1}"
  local threads="${5:-1}"
  local script_file="$BENCHMARKS_DIR/pgbench/$pattern-$variant.sql"
  local log_prefix="$RESULTS_DIR/${variant}-${scale}-${pattern}"
  local label="${variant}/${scale}/${pattern} (c=${clients})"

  if [[ "$clients" -gt 1 ]]; then
    log_prefix="${log_prefix}-c${clients}"
    label="${variant}/${scale}/${pattern}-c${clients} (c=${clients})"
  fi

  if [[ ! -f "$script_file" ]]; then
    echo "  SKIP: $script_file not found"
    return
  fi

  echo "  Running: $label"
  pgbench \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -c "$clients" \
    -j "$threads" \
    -T "$DURATION" \
    --log \
    --log-prefix="$log_prefix" \
    -f "$script_file" \
    "$DB_NAME" 2>&1 | tail -5

  # Parse log file(s) into JSON
  local log_files
  log_files=$(ls "${log_prefix}".* 2>/dev/null || true)
  if [[ -n "$log_files" ]]; then
    # Concatenate all log files (pgbench creates one per client)
    cat ${log_prefix}.* | python3 "$BENCHMARKS_DIR/scripts/parse-pgbench-log.py" --json > "${log_prefix}.json" 2>/dev/null || true
    echo "  Results: ${log_prefix}.json"

    # Also show human-readable summary
    cat ${log_prefix}.* | python3 "$BENCHMARKS_DIR/scripts/parse-pgbench-log.py" 2>/dev/null || true
  fi
  echo ""
}

run_k6_test() {
  local variant="$1"
  local scale="$2"

  if ! command -v k6 &>/dev/null; then
    echo "  SKIP: k6 not found in PATH (install with: brew install k6)"
    return
  fi

  echo "  Running k6 voter-bulk-read ($variant, scale=$scale)..."
  k6 run \
    --env "SUPABASE_ANON_KEY=$ANON_KEY" \
    --env "SUPABASE_URL=http://$DB_HOST:54321" \
    "$BENCHMARKS_DIR/k6/voter-bulk-read.js" 2>&1 | tee "$RESULTS_DIR/${variant}-${scale}-k6-voter-read.txt"
  echo ""
}

generate_data() {
  local variant="$1"
  local scale="$2"

  echo "  Generating shared data (scale=$scale)..."
  psql "$DB_URL" -v "scale=$scale" -f "$BENCHMARKS_DIR/data/generate-shared-data.sql" -q 2>&1 | tail -2

  echo "  Generating candidate data ($variant, scale=$scale)..."
  psql "$DB_URL" -v "scale=$scale" -f "$BENCHMARKS_DIR/data/generate-candidates-$variant.sql" -q 2>&1 | tail -2
}

# Track start time
BENCH_START=$(date +%s)

for variant in "${SCHEMAS[@]}"; do
  echo ""
  echo "=============================================="
  echo "  Schema: $variant"
  echo "=============================================="
  echo ""

  # Swap schema
  echo "--- Swapping to $variant schema ---"
  bash "$BENCHMARKS_DIR/scripts/swap-schema.sh" "$variant"
  echo ""

  for scale in "${SCALES[@]}"; do
    echo "--- Scale: $scale candidates per project ---"
    echo ""

    # Generate test data
    generate_data "$variant" "$scale"
    echo ""

    # Run pgbench benchmarks
    echo "--- pgbench benchmarks ($variant, scale=$scale) ---"
    echo ""

    # Voter bulk-read (single client)
    run_pgbench "$variant" "$scale" "voter-bulk-read" 1 1

    # Candidate write (single client)
    run_pgbench "$variant" "$scale" "candidate-write" 1 1

    # Candidate write (100 concurrent)
    run_pgbench "$variant" "$scale" "candidate-write" 100 4

    # Candidate full-save (single client)
    run_pgbench "$variant" "$scale" "candidate-full-save" 1 1

    # Aggregation (single client)
    run_pgbench "$variant" "$scale" "aggregation" 1 1

    # Concurrent reads (100 clients)
    run_pgbench "$variant" "$scale" "voter-bulk-read" 100 4

    # Concurrent reads (500 clients) -- only in full mode
    if [[ "$MODE" == "full" ]]; then
      run_pgbench "$variant" "$scale" "voter-bulk-read" 500 8
    fi

    # k6 HTTP tests -- only in full mode or if --k6 flag set
    if [[ "$RUN_K6" == "true" ]]; then
      run_k6_test "$variant" "$scale"
    fi

    echo ""
  done
done

# Restore JSONB schema
echo ""
echo "--- Restoring JSONB schema ---"
bash "$BENCHMARKS_DIR/scripts/swap-schema.sh" restore
echo ""

BENCH_END=$(date +%s)
BENCH_DURATION=$((BENCH_END - BENCH_START))

echo "=============================================="
echo "  Benchmark Suite Complete"
echo "=============================================="
echo "Duration: ${BENCH_DURATION}s"
echo "Results directory: $RESULTS_DIR"
echo ""
echo "Result files:"
ls -la "$RESULTS_DIR"/*.json 2>/dev/null || echo "  (no JSON results found)"
echo ""
echo "To view a result: python3 $BENCHMARKS_DIR/scripts/parse-pgbench-log.py <logfile>"
