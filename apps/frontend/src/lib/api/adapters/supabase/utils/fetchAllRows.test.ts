import { configureLogger } from '@openvaa/app-shared';
import { describe, expect, it, vi } from 'vitest';
import { fetchAllRows, PROBABLE_ROW_CAP_MESSAGE } from './fetchAllRows';
import type { LogRecord } from '@openvaa/app-shared';

type Row = { id: number };

/**
 * An in-memory table behind a fake page factory, standing in for a PostgREST read.
 *
 * `cap` models a server `max_rows`: a request is answered with at most that many rows whatever range it asked for, which is exactly what PostgREST does with HTTP 200 and no error.
 * @param total - How many rows the fake table holds.
 * @param cap - The per-response row cap the fake server enforces.
 * @returns The `vi.fn` page factory, whose calls record every `(from, to)` pair requested.
 */
function fakeTable(total: number, cap = Number.POSITIVE_INFINITY) {
  const rows: Array<Row> = Array.from({ length: total }, (_, i) => ({ id: i }));
  return vi.fn((from: number, to: number) => {
    const end = Math.min(to + 1, from + cap);
    return Promise.resolve({ data: rows.slice(from, end), error: null });
  });
}

/**
 * Run `read` with the structured logger capturing into an array, then restore the silent default in a `finally`.
 * @param read - The call under test.
 * @returns The call's result and every record emitted while it ran.
 */
async function withCapturedLogs<TResult>(
  read: () => Promise<TResult>
): Promise<{ result: TResult; records: Array<LogRecord> }> {
  const records: Array<LogRecord> = [];
  configureLogger({ level: 'warn', sink: (record) => records.push(record) });
  try {
    const result = await read();
    return { result, records };
  } finally {
    configureLogger({ level: 'silent', sink: undefined });
  }
}

describe('fetchAllRows', () => {
  it('returns a single short page after one request and logs nothing', async () => {
    const fetchPage = fakeTable(3);
    const { result, records } = await withCapturedLogs(() => fetchAllRows(fetchPage, { pageSize: 5, label: 'test' }));
    expect(result).toHaveLength(3);
    expect(fetchPage.mock.calls).toEqual([[0, 4]]);
    expect(records).toEqual([]);
  });

  it('keeps reading after a full page and stops at the empty page when the total is an exact multiple of the page size', async () => {
    const fetchPage = fakeTable(6);
    const { result, records } = await withCapturedLogs(() => fetchAllRows(fetchPage, { pageSize: 3, label: 'test' }));
    expect(result.map((r) => r.id)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(fetchPage.mock.calls).toEqual([
      [0, 2],
      [3, 5],
      [6, 8]
    ]);
    expect(records).toEqual([]);
  });

  // REGRESSION (spike 030, option (c)). A server whose `max_rows` is below the configured page size answers a full request with a short page and HTTP 200. Treating that page as the last one returned 1,000 of 1,510 nominations in spike 026 F1; a multiple-of-1,000 short page must instead trigger a confirming request and one warning.
  it('reads every row past a server cap below the page size and warns exactly once', async () => {
    const fetchPage = fakeTable(2500, 1000);
    const { result, records } = await withCapturedLogs(() =>
      fetchAllRows(fetchPage, { pageSize: 2500, label: 'getEntityData (candidates)' })
    );
    expect(result).toHaveLength(2500);
    expect(new Set(result.map((r) => r.id)).size).toBe(2500);
    expect(records).toHaveLength(1);
    expect(records[0].severityText).toBe('WARN');
    expect(records[0].msg).toBe(PROBABLE_ROW_CAP_MESSAGE);
    expect(records[0].attributes).toEqual({ label: 'getEntityData (candidates)', pageLength: 1000, pageSize: 2500 });
  });

  // REGRESSION (spike 030). Advancing by the page size instead of by the rows received would skip rows 1000..2499 of every capped page silently; the offsets must follow what the server actually returned.
  it('advances each offset by the rows received, never by the page size', async () => {
    const fetchPage = fakeTable(2500, 1000);
    await withCapturedLogs(() => fetchAllRows(fetchPage, { pageSize: 2500, label: 'test' }));
    expect(fetchPage.mock.calls).toEqual([
      [0, 2499],
      [1000, 3499],
      [2000, 4499]
    ]);
  });

  it('returns an empty array after one request when the read has no rows', async () => {
    const fetchPage = fakeTable(0);
    const { result, records } = await withCapturedLogs(() => fetchAllRows(fetchPage, { pageSize: 5, label: 'test' }));
    expect(result).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(records).toEqual([]);
  });

  it('rejects with the label and the server message when the second page fails', async () => {
    const fetchPage = vi.fn((from: number, to: number) =>
      from === 0
        ? Promise.resolve({ data: Array.from({ length: to + 1 }, (_, i) => ({ id: i })), error: null })
        : Promise.resolve({ data: null, error: { message: 'boom' } })
    );
    await expect(fetchAllRows(fetchPage, { pageSize: 3, label: 'getElectionData' })).rejects.toThrow(
      'getElectionData: boom'
    );
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('confirms a total of exactly 1,000 rows with one extra request, returns them all and warns once (the false alarm)', async () => {
    const fetchPage = fakeTable(1000);
    const { result, records } = await withCapturedLogs(() =>
      fetchAllRows(fetchPage, { pageSize: 2500, label: 'test' })
    );
    expect(result).toHaveLength(1000);
    expect(fetchPage.mock.calls).toEqual([
      [0, 2499],
      [1000, 3499]
    ]);
    expect(records).toHaveLength(1);
    expect(records[0].msg).toBe(PROBABLE_ROW_CAP_MESSAGE);
  });

  it('treats a page with null data and no error as an empty page', async () => {
    const fetchPage = vi.fn((_from: number, _to: number) => Promise.resolve({ data: null, error: null }));
    await expect(fetchAllRows<Row>(fetchPage, { pageSize: 5, label: 'test' })).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('rejects a page size that is not a positive integer before issuing any request', async () => {
    const fetchPage = fakeTable(3);
    await expect(fetchAllRows(fetchPage, { pageSize: 0, label: 'test' })).rejects.toThrow(/^test: /);
    await expect(fetchAllRows(fetchPage, { pageSize: 2.5, label: 'test' })).rejects.toThrow(/^test: /);
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
