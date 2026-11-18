#!/usr/bin/env node

/**
 * withhold-stack-keys.mjs -- copy the output of a command that starts the local Supabase stack from stdin to stdout, without the stack's keys.
 *
 * Usage:
 *   yarn db:start 2>&1 | node tests/scripts/withhold-stack-keys.mjs > "$RUN_DIR/db-start.log"
 *
 * `supabase start` ends by printing the stack's status: the service URLs together with the API keys, the JWT secret, the storage credentials and the database URL with its password. A run directory is evidence that gets attached to a report or uploaded from CI, so that status must not be written into it. Everything else the command prints -- image pulls, migrations, notices, errors -- is copied through unchanged, because that is what a reader of the log needs when the start fails.
 *
 * Four rules, applied to each line in this order:
 *   1. A line that is a JSON object is the status object: one marker line replaces it.
 *   2. A line that begins with a box-drawing character belongs to the status tables: one marker line replaces each run of them.
 *   3. A line that begins with a label naming a key, a secret, a password or a token, followed by `:` or `=`, is replaced by a marker line. This is the status in its `env`, `yaml`, `toml` and indented-JSON forms.
 *   4. On every line that is left, a JSON web token, a key with the `sb_` prefix and the password of a URL are each replaced by `<withheld>`.
 *
 * Rules 1 and 2 cover the two forms the pinned CLI prints. Rules 3 and 4 are for a form it does not print today.
 *
 * Reading the status of this filter: it exits 0 once stdin ends. A caller reads the starting command's own status from the pipe (`set -o pipefail`, or `${PIPESTATUS[0]}`).
 */

import { createInterface } from 'node:readline';

const STATUS_OBJECT_MARKER = '[withheld: the stack status object, which holds its keys]';
const STATUS_TABLE_MARKER = '[withheld: the stack status tables, which hold its keys]';
const LABELLED_SECRET_MARKER = '[withheld: a line labelled as a key, a secret, a password or a token]';
const WITHHELD = '<withheld>';

/** A line of the status tables: optional indentation, then a character of the Unicode box-drawing block. */
const BOX_LINE = /^\s*[─-╿]/;

/** A label made of word characters, spaces, dots and hyphens that names a secret, then `:` or `=`. */
const SECRET_LABEL = /^\s*["']?[\w .-]*(key|secret|password|token)[\w .-]*["']?\s*[:=]/i;

const JSON_WEB_TOKEN = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const PREFIXED_KEY = /sb_(publishable|secret)_[A-Za-z0-9_-]+/g;
const URL_PASSWORD = /(:\/\/[^\s/:@]+):[^\s/@]+@/g;

/** Whether a line is one JSON object, which is how the CLI prints the status when its output is not a terminal. */
function isJsonObject(line) {
  const text = line.trim();
  if (!text.startsWith('{') || !text.endsWith('}')) return false;
  try {
    const value = JSON.parse(text);
    return typeof value === 'object' && value !== null;
  } catch {
    return false;
  }
}

/**
 * Build the line filter. It carries one bit of state, whether the previous line was part of a status table, so that a table of any length becomes one marker line.
 *
 * @returns A function that takes a line and returns the line to write, or `null` when nothing is written for it.
 */
function createLineFilter() {
  let inStatusTable = false;
  return (line) => {
    if (BOX_LINE.test(line)) {
      if (inStatusTable) return null;
      inStatusTable = true;
      return STATUS_TABLE_MARKER;
    }
    inStatusTable = false;
    if (isJsonObject(line)) return STATUS_OBJECT_MARKER;
    if (SECRET_LABEL.test(line)) return LABELLED_SECRET_MARKER;
    return line
      .replace(JSON_WEB_TOKEN, WITHHELD)
      .replace(PREFIXED_KEY, WITHHELD)
      .replace(URL_PASSWORD, `$1:${WITHHELD}@`);
  };
}

const filterLine = createLineFilter();
const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', (line) => {
  const filtered = filterLine(line);
  if (filtered !== null) process.stdout.write(`${filtered}\n`);
});
