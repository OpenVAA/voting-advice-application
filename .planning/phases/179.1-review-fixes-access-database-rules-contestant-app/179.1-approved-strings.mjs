#!/usr/bin/env node
// 179.1-approved-strings.mjs — compare the catalogues with the strings the round's checkpoint approved.
//
// Usage (from the repository root):
//   node .planning/phases/179.1-review-fixes-access-database-rules-contestant-app/179.1-approved-strings.mjs <catalogue file name>...
//
// Reads every file beside this one whose name is `179.1-<digits>-approved-strings.json` (each plan's approved copy),
// in name order, and joins their entries. It exits 2 when one of those files cannot be parsed, or when two entries
// name the same file, path and locale, because a check that cannot decide refuses. For every entry whose `file` is
// one of the names given (for example `common.json` or `adminApp.login.json`), and for every locale in its `values`,
// it reads apps/frontend/messages/<locale>/<file>, walks the entry's `path`, and requires the value there to equal
// the approved string exactly. It prints one line per mismatch and exits 1 on any; it exits 2 when no entry names a
// given file or when a file cannot be read, because a check that cannot look refuses. Exit 0 prints the number of
// strings compared.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const approvedFiles = fs
  .readdirSync(here)
  .filter((name) => /^179\.1-\d+-approved-strings\.json$/.test(name))
  .sort();
if (approvedFiles.length === 0) {
  console.error(`no 179.1-<n>-approved-strings.json beside ${here}`);
  process.exit(2);
}
const fixture = { entries: [] };
const seen = new Map();
for (const name of approvedFiles) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(here, name), 'utf8'));
  } catch (e) {
    console.error(`cannot parse ${name}: ${e.message}`);
    process.exit(2);
  }
  if (!Array.isArray(parsed?.entries)) {
    console.error(`${name} holds no entries list`);
    process.exit(2);
  }
  for (const entry of parsed.entries) {
    for (const locale of Object.keys(entry.values)) {
      const id = JSON.stringify([entry.file, entry.path, locale]);
      if (seen.has(id)) {
        console.error(`${locale} ${entry.file} ${entry.path.join('.')} is named in ${seen.get(id)} and in ${name}`);
        process.exit(2);
      }
      seen.set(id, name);
    }
    fixture.entries.push(entry);
  }
}
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: 179.1-approved-strings.mjs <catalogue file name>...');
  process.exit(2);
}

let compared = 0;
let mismatches = 0;
for (const file of files) {
  const entries = fixture.entries.filter((entry) => entry.file === file);
  if (entries.length === 0) {
    console.error(`no approved string names ${file}`);
    process.exit(2);
  }
  for (const entry of entries) {
    for (const [locale, approved] of Object.entries(entry.values)) {
      const catalogue = path.join('apps', 'frontend', 'messages', locale, file);
      let value;
      try {
        value = JSON.parse(fs.readFileSync(catalogue, 'utf8'));
      } catch (e) {
        console.error(`cannot read ${catalogue}: ${e.message}`);
        process.exit(2);
      }
      for (const key of entry.path) value = value?.[key];
      compared += 1;
      if (value !== approved) {
        mismatches += 1;
        console.error(`${locale} ${entry.path.join('.')}: ${JSON.stringify(value)} is not the approved ${JSON.stringify(approved)}`);
      }
    }
  }
}
if (mismatches > 0) process.exit(1);
console.log(`approved strings: ${compared} compared, all equal`);
