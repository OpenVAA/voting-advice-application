#!/usr/bin/env python3
"""
Parse pgbench --log output and compute latency percentiles.

pgbench log format (one line per transaction):
  client_id  transaction_no  time_epoch  time_us  [schedule_lag]

where time_us is the transaction latency in microseconds.

Usage:
  cat pgbench_log.12345 | python3 parse-pgbench-log.py
  python3 parse-pgbench-log.py pgbench_log.12345
  python3 parse-pgbench-log.py --json pgbench_log.12345
"""

import sys
import json
import argparse


def percentile(sorted_data, p):
    """Compute the p-th percentile from sorted data."""
    if not sorted_data:
        return 0
    n = len(sorted_data)
    idx = int(p / 100.0 * n)
    return sorted_data[min(idx, n - 1)]


def parse_pgbench_log(lines):
    """Parse pgbench log lines and return latencies in milliseconds."""
    latencies = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split()
        if len(parts) >= 3:
            try:
                # Column index 2 is the latency in microseconds
                latency_us = int(parts[2])
                latencies.append(latency_us / 1000.0)  # Convert to ms
            except (ValueError, IndexError):
                continue
    return latencies


def compute_stats(latencies):
    """Compute latency statistics from a list of latencies in ms."""
    if not latencies:
        return None

    latencies.sort()
    n = len(latencies)

    return {
        'transactions': n,
        'p50_ms': round(percentile(latencies, 50), 2),
        'p95_ms': round(percentile(latencies, 95), 2),
        'p99_ms': round(percentile(latencies, 99), 2),
        'avg_ms': round(sum(latencies) / n, 2),
        'min_ms': round(min(latencies), 2),
        'max_ms': round(max(latencies), 2),
    }


def format_human(stats):
    """Format stats as human-readable text."""
    lines = [
        f"Transactions: {stats['transactions']}",
        f"p50: {stats['p50_ms']:.2f} ms",
        f"p95: {stats['p95_ms']:.2f} ms",
        f"p99: {stats['p99_ms']:.2f} ms",
        f"avg: {stats['avg_ms']:.2f} ms",
        f"min: {stats['min_ms']:.2f} ms",
        f"max: {stats['max_ms']:.2f} ms",
    ]
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(
        description='Parse pgbench --log output and compute latency percentiles.'
    )
    parser.add_argument(
        'file',
        nargs='?',
        default=None,
        help='pgbench log file (reads from stdin if not provided)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output in JSON format'
    )
    args = parser.parse_args()

    if args.file:
        try:
            with open(args.file, 'r') as f:
                lines = f.readlines()
        except FileNotFoundError:
            print(f"Error: File not found: {args.file}", file=sys.stderr)
            sys.exit(1)
    else:
        lines = sys.stdin.readlines()

    latencies = parse_pgbench_log(lines)

    if not latencies:
        print("No valid data found", file=sys.stderr)
        sys.exit(1)

    stats = compute_stats(latencies)

    if args.json:
        print(json.dumps(stats, indent=2))
    else:
        print(format_human(stats))


if __name__ == '__main__':
    main()
