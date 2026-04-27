/**
 * D-58-14 CLI success summary — plain text, stdout, human-readable.
 *
 * Output shape (fixed — not a machine-parseable format):
 *
 *   Applied template: default (built-in)
 *   Seed: 42                                              Elapsed: 6.21s
 *                                                         Portraits uploaded: 100
 *
 *   Table                          Created
 *   ─────────────────────────────── ──────────
 *   elections                      1
 *   ...                            ...
 *   ─────────────────────────────── ──────────
 *   Total                          251
 *
 * Deferred (D-58-14 note): `--output json` mode for CI/machine consumption.
 */

export interface SummaryInput {
  templateName: string;
  seed: number;
  elapsedMs: number;
  portraits: number;
  rowCounts: Record<string, number>;
}

const TABLE_COL_WIDTH = 30;
const COUNT_COL_WIDTH = 10;

export function formatSummary(input: SummaryInput): string {
  const elapsedSec = (input.elapsedMs / 1000).toFixed(2);
  const tables = Object.keys(input.rowCounts).sort();
  const total = tables.reduce((sum, t) => sum + (input.rowCounts[t] ?? 0), 0);

  const lines: Array<string> = [];
  lines.push(`Applied template: ${input.templateName}`);
  lines.push(`Seed: ${input.seed}`.padEnd(54) + `Elapsed: ${elapsedSec}s`);
  lines.push(''.padEnd(54) + `Portraits uploaded: ${input.portraits}`);
  lines.push('');
  lines.push('Table'.padEnd(TABLE_COL_WIDTH) + 'Created'.padStart(COUNT_COL_WIDTH));
  lines.push('─'.repeat(TABLE_COL_WIDTH) + ' ' + '─'.repeat(COUNT_COL_WIDTH));
  for (const t of tables) {
    lines.push(t.padEnd(TABLE_COL_WIDTH) + String(input.rowCounts[t]).padStart(COUNT_COL_WIDTH));
  }
  lines.push('─'.repeat(TABLE_COL_WIDTH) + ' ' + '─'.repeat(COUNT_COL_WIDTH));
  lines.push('Total'.padEnd(TABLE_COL_WIDTH) + String(total).padStart(COUNT_COL_WIDTH));
  lines.push('');
  return lines.join('\n');
}
