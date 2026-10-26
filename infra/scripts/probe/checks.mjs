/**
 * The probe's check registry. Each check has a stable name, names the one source it reads, and compares what that source
 * served with the expected values read from tracked files. `run` returns `{ pass: true }` or `{ pass: false, finding }`.
 *
 * A finding is one line of prose an operator can paste into a tracked record, so it passes `pasteSafe`: no `=`, no
 * `@`, no run of 32 or more hexadecimal digits and no secret word directly followed by `:` or `=`. A finding names a
 * served value only when the value is a number; of any other served value it names the JSON type alone.
 *
 * The checks run, and their lines print, in the order of `CHECKS`.
 *
 * This module has no side effect on import.
 */

const SECRET_WORD_LABEL =
  /(?:^|[^A-Za-z])(?:secrets?|password|passwd|pass|pwd|tokens?|keys?|credentials?|bearer|authorization)[:=]/i;

/**
 * Whether one output line may be pasted into a tracked record.
 *
 * @param line - A line the probe prints.
 */
export function pasteSafe(line) {
  return !/[=@]/.test(line) && !/[0-9A-Fa-f]{32,}/.test(line) && !SECRET_WORD_LABEL.test(line);
}

/** The JSON type of a served value, for a finding that must not print the value itself. */
function jsonType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  if (typeof value === 'object') return 'an object';
  if (typeof value === 'string') return 'a string';
  if (typeof value === 'boolean') return 'a boolean';
  return typeof value;
}

/** @type {Array<{ name: string, source: string, run: (expected: object, responses: object) => { pass: true } | { pass: false, finding: string } }>} */
export const CHECKS = [
  {
    name: 'api.max-rows',
    source: 'management',
    run(expected, responses) {
      const { json, pageSize } = expected.maxRows;
      if (json !== pageSize)
        return {
          pass: false,
          finding: `hosted-settings.json sets max_rows ${json} but staticSettings.ts sets pageSize ${pageSize}, so no served value can agree with both`
        };
      const served = responses.management.postgrest.max_rows;
      if (typeof served !== 'number')
        return {
          pass: false,
          finding: `the served max_rows is ${jsonType(served)}, not the number ${json} that hosted-settings.json and pageSize give`
        };
      if (served !== json)
        return {
          pass: false,
          finding: `the served max_rows is ${served}, not the ${json} that hosted-settings.json and pageSize give`
        };
      return { pass: true };
    }
  }
];

const WITHHELD = 'the finding was withheld because it fails the paste screen';

/**
 * Runs every registered check.
 *
 * @returns `[{ name, pass, finding }]` in registry order; `finding` is `null` for a check that passes. A finding that
 *   does not pass `pasteSafe` is replaced by a fixed line that does.
 */
export function runChecks(expected, responses) {
  return CHECKS.map(({ name, run }) => {
    const result = run(expected, responses);
    if (result.pass) return { name, pass: true, finding: null };
    const finding = typeof result.finding === 'string' && pasteSafe(result.finding) ? result.finding : WITHHELD;
    return { name, pass: false, finding };
  });
}
