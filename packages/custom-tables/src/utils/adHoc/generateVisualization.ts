import { type TableJsonMinimal, type TableJsonWithConfidence } from '../../types';

/**
 * Escape a string for safe HTML rendering.
 * @param param0.value The input string to escape
 * @returns The escaped HTML-safe string
 */
function escapeHtml({ value }: { value: string }): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate a self-contained HTML visualization for the table JSON data.
 * The result is a responsive table with categories as rows and candidates as columns.
 *
 * @param param0.data The parsed JSON data following the `TableJsonData` contract
 * @returns The complete HTML document as a string
 */
export function generateVisualizationHTML({ data }: { data: TableJsonMinimal | TableJsonWithConfidence }): string {
  const candidates: Array<string> = Object.keys(data.candidate_positions ?? {});
  const categories = data.categories ?? [];

  const tableHead = `
    <thead>
      <tr>
        <th class="sticky-col">Theme</th>
        ${candidates.map((c) => `<th>${escapeHtml({ value: c })}</th>`).join('')}
      </tr>
    </thead>`;

  const tableBody = `
    <tbody>
      ${categories
        .map((category) => {
          const categoryLabel = escapeHtml({ value: category.label });
          const categoryDescription = escapeHtml({ value: category.description ?? '' });
          const rowCells = candidates
            .map((candidate) => {
              const raw = (data.candidate_positions as Record<string, Record<string, unknown>> | undefined)?.[
                candidate
              ]?.[category.label];
              let display = '—';
              if (raw && typeof raw === 'object' && 'position' in raw) {
                display = String((raw as { position: string }).position);
              } else if (typeof raw === 'string') {
                display = raw;
              }
              return `<td>${escapeHtml({ value: display })}</td>`;
            })
            .join('');
          return `
            <tr>
              <td class="sticky-col" title="${categoryDescription}">
                <div class="category">
                  <div class="label">${categoryLabel}</div>
                  ${categoryDescription ? `<div class="description">${categoryDescription}</div>` : ''}
                </div>
              </td>
              ${rowCells}
            </tr>`;
        })
        .join('')}
    </tbody>`;

  const reasoning = escapeHtml({ value: data.reasoning ?? '' });

  // Type guard to detect confidence-enhanced format
  function isWithConfidence(value: TableJsonMinimal | TableJsonWithConfidence): value is TableJsonWithConfidence {
    const candidatePositions =
      (value as { candidate_positions?: Record<string, Record<string, unknown>> | undefined }).candidate_positions ??
      {};
    const firstCandidate = Object.keys(candidatePositions)[0];
    const categoriesList = (value as { categories?: Array<{ label: string }> | undefined }).categories ?? [];
    const firstCategory = categoriesList[0]?.label;
    if (!firstCandidate || !firstCategory) return false;
    const cell = candidatePositions?.[firstCandidate]?.[firstCategory];
    return !!cell && typeof cell === 'object' && 'position' in cell && 'confidence' in cell;
  }

  // Build optional evidence table (kept separate to not alter the first table)
  let evidenceSection = '';
  if (isWithConfidence(data)) {
    const evidenceHead = `
      <thead>
        <tr>
          <th class="sticky-col">Evidence</th>
          ${candidates.map((c) => `<th>${escapeHtml({ value: c })}</th>`).join('')}
        </tr>
      </thead>`;

    const evidenceBody = `
      <tbody>
        ${categories
          .map((category) => {
            const categoryLabel = escapeHtml({ value: category.label });
            const categoryDescription = escapeHtml({ value: category.description ?? '' });

            const rowCells = candidates
              .map((candidate) => {
                const entry = data.candidate_positions?.[candidate]?.[category.label];
                if (!entry || typeof entry !== 'object') {
                  return '<td>—</td>';
                }

                const excerpts = Array.isArray(entry.supporting_excerpts)
                  ? entry.supporting_excerpts.map((ex) => `<li>${escapeHtml({ value: String(ex) })}</li>`).join('')
                  : '';

                const confidence: number = typeof entry.confidence === 'number' ? entry.confidence : 0;
                const confidenceLevel = confidence <= 0.3 ? 'low' : confidence < 0.7 ? 'medium' : 'high';

                return `
                  <td>
                    <div class="cell-wrap">
                      ${excerpts ? `<ul class="excerpts">${excerpts}</ul>` : '—'}
                      <span class="confidence-dot ${confidenceLevel}" title="Confidence: ${confidence.toFixed(2)} (${confidenceLevel})"></span>
                    </div>
                  </td>`;
              })
              .join('');

            return `
              <tr>
                <td class="sticky-col" title="${categoryDescription}">
                  <div class="category">
                    <div class="label">${categoryLabel}</div>
                    ${categoryDescription ? `<div class="description">${categoryDescription}</div>` : ''}
                  </div>
                </td>
                ${rowCells}
              </tr>`;
          })
          .join('')}
      </tbody>`;

    evidenceSection = `
      <h2 class="section-title">Supporting excerpts and confidence</h2>
      <div class="table-wrapper">
        <table>
          ${evidenceHead}
          ${evidenceBody}
        </table>
      </div>`;
  }

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Custom Tables Visualization</title>
    <style>
      :root {
        --border: #e5e7eb;
        --bg: #ffffff;
        --bg-alt: #f9fafb;
        --text: #111827;
        --muted: #6b7280;
        --sticky-bg: #f3f4f6;
      }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 0; padding: 16px; color: var(--text); background: var(--bg); }
      header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
      h1 { font-size: 18px; margin: 0; }
      h2.section-title { font-size: 14px; margin: 14px 0 8px; color: var(--muted); font-weight: 600; }
      .controls { display: flex; gap: 8px; }
      button { border: 1px solid var(--border); background: var(--bg); padding: 6px 10px; border-radius: 6px; cursor: pointer; }
      button:hover { background: var(--bg-alt); }
      details { margin-bottom: 12px; }
      summary { cursor: pointer; color: var(--muted); }
      .table-wrapper { overflow: auto; border: 1px solid var(--border); border-radius: 8px; }
      table { border-collapse: separate; border-spacing: 0; width: 100%; }
      thead th { position: sticky; top: 0; background: var(--sticky-bg); z-index: 1; text-align: left; font-weight: 600; }
      th, td { border-bottom: 1px solid var(--border); padding: 8px 10px; vertical-align: top; white-space: nowrap; }
      tbody tr:nth-child(odd) { background: var(--bg-alt); }
      .sticky-col { position: sticky; left: 0; background: var(--sticky-bg); z-index: 2; min-width: 240px; max-width: 480px; }
      .category .label { font-weight: 600; }
      .category .description { color: var(--muted); font-size: 12px; margin-top: 2px; white-space: normal; }
      .cell-wrap { position: relative; padding-right: 18px; }
      .excerpts { margin: 0; padding-left: 16px; white-space: normal; }
      .confidence-dot { position: absolute; right: 4px; bottom: 4px; width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
      .confidence-dot.low { background-color: #ef4444; }
      .confidence-dot.medium { background-color: #f59e0b; }
      .confidence-dot.high { background-color: #10b981; }
      footer { margin-top: 12px; color: var(--muted); font-size: 12px; }
    </style>
    <script>
      function exportTableToCSV() {
        const rows = Array.from(document.querySelectorAll('table tr'));
        const csv = rows.map(row => Array.from(row.querySelectorAll('th,td')).map(cell => {
          // Escape quotes and commas
          const text = cell.innerText.replace(/"/g, '""');
          return '"' + text + '"';
        }).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'table.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    </script>
  </head>
  <body>
    <header>
      <h1>Custom Tables Visualization</h1>
      <div class="controls">
        <button onclick="exportTableToCSV()">Export CSV</button>
        <button onclick="window.print()">Print</button>
      </div>
    </header>
    ${reasoning ? `<details><summary>Reasoning</summary><div style="margin-top:8px; white-space: pre-wrap;">${reasoning}</div></details>` : ''}
    <div class="table-wrapper">
      <table>
        ${tableHead}
        ${tableBody}
      </table>
    </div>
    ${evidenceSection}
    <footer>
      Generated at ${new Date().toLocaleString()}
    </footer>
  </body>
  </html>`;
}
