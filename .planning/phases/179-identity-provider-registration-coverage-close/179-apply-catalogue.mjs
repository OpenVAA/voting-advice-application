#!/usr/bin/env node
/**
 * The one writer of the phase's catalogue keys.
 *
 * Reads `179-catalogue-additions.json` beside this file, or the file named by `--list <file>`:
 *   - `createNamespaces`: wrapping keys whose seven files this writer may create;
 *   - `add`: full key -> { locale: string } for all seven locales; each key must not exist yet;
 *   - `reword`: full key -> { locale: string } for the listed locales only; each key must exist;
 *   - `remove`: full keys deleted from every locale's file that holds them (each must be held by
 *     at least one); every other key keeps its place, and a parent left empty is removed with it;
 *   - `removeNamespace`: wrapping keys whose line leaves `project.inlang/settings.json`; their
 *     seven files must already be gone (the writer deletes no file).
 *
 * A key's file is the one whose wrapping key (the file name without `.json`) is the longest
 * prefix of the key. Existing keys keep their order; a new key goes into its sibling list in
 * case-insensitive alphabetical place. Every check runs before any write, so a refusal writes
 * nothing. Files are written as two-space JSON with a final newline; the changed files are
 * printed one per line for a formatter.
 *
 * Usage:
 *   node 179-apply-catalogue.mjs [--list <file>]           write (exit 1 on any refusal, naming the key)
 *   node 179-apply-catalogue.mjs [--list <file>] --check   write nothing; exit 0 only when every listed key
 *                                          holds exactly its listed string in every listed locale, no
 *                                          removed key is in any locale, and the settings and the
 *                                          message folders name no removed namespace
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const MESSAGES = path.join(REPO, 'apps', 'frontend', 'messages');
const INLANG = path.join(REPO, 'apps', 'frontend', 'project.inlang', 'settings.json');
const LOCALES = ['da', 'en', 'et', 'fi', 'fr', 'lb', 'sv'];
const CHECK = process.argv.includes('--check');

const listAt = process.argv.indexOf('--list');
if (listAt !== -1 && !process.argv[listAt + 1]) {
  console.error('--list needs a file');
  process.exit(1);
}
const listFile =
  listAt === -1 ? path.join(HERE, '179-catalogue-additions.json') : path.resolve(process.argv[listAt + 1]);
const spec = JSON.parse(readFileSync(listFile, 'utf8'));
const created = spec.createNamespaces ?? [];
const add = spec.add ?? {};
const reword = spec.reword ?? {};
const remove = spec.remove ?? [];
const removeNamespace = spec.removeNamespace ?? [];

const problems = [];
const refuse = (msg) => problems.push(msg);
const placeholders = (s) => (String(s).match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(',');
const cmp = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' });

/** Wrapping keys per locale: existing files plus the namespaces this writer may create. */
function wrappersOf(locale) {
  const dir = path.join(MESSAGES, locale);
  const names = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -'.json'.length));
  return [...new Set([...names, ...created])];
}

function wrapperFor(key, wrappers) {
  let best = null;
  for (const w of wrappers) {
    if (key.startsWith(w + '.') && (best === null || w.length > best.length)) best = w;
  }
  return best;
}

const files = new Map(); // abs path -> { json, wrapper, changed }
function load(locale, wrapper) {
  const file = path.join(MESSAGES, locale, `${wrapper}.json`);
  if (!files.has(file)) {
    const exists = existsSync(file);
    if (!exists && !created.includes(wrapper)) return null;
    const json = exists ? JSON.parse(readFileSync(file, 'utf8')) : { [wrapper]: {} };
    files.set(file, { json, wrapper, changed: !exists });
  }
  return files.get(file);
}

function getPath(obj, parts) {
  let cur = obj;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object' || Array.isArray(cur) || !Object.hasOwn(cur, p)) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Deletes the leaf at `parts`, and every parent the deletion leaves empty; the order of the rest is kept. */
function deletePath(obj, parts) {
  const [head, ...rest] = parts;
  if (rest.length > 0) {
    deletePath(obj[head], rest);
    if (Object.keys(obj[head]).length > 0) return;
  }
  delete obj[head];
}

/** Sets `value` at `parts`, inserting each new key in alphabetical place among its siblings. */
function setPath(obj, parts, value) {
  const [head, ...rest] = parts;
  if (rest.length === 0) {
    if (Object.hasOwn(obj, head)) {
      obj[head] = value;
      return obj;
    }
    return insertSorted(obj, head, value);
  }
  if (Object.hasOwn(obj, head)) {
    obj[head] = setPath(obj[head], rest, value);
    return obj;
  }
  return insertSorted(obj, head, setPath({}, rest, value));
}

function insertSorted(obj, key, value) {
  const out = {};
  let placed = false;
  for (const [k, v] of Object.entries(obj)) {
    if (!placed && cmp(key, k) < 0) {
      out[key] = value;
      placed = true;
    }
    out[k] = v;
  }
  if (!placed) out[key] = value;
  return out;
}

function locate(key, locale) {
  const wrapper = wrapperFor(key, wrappersOf(locale));
  if (!wrapper) return null;
  const entry = load(locale, wrapper);
  if (!entry) return null;
  const parts = key.slice(wrapper.length + 1).split('.');
  return { entry, parts };
}

// Validate.
for (const [key, strings] of Object.entries(add)) {
  const locales = Object.keys(strings).sort();
  if (locales.join(',') !== [...LOCALES].sort().join(',')) refuse(`add ${key}: not exactly the seven locales`);
  const sets = new Set(Object.values(strings).map(placeholders));
  if (sets.size !== 1) refuse(`add ${key}: the locales do not share one placeholder set`);
  for (const locale of LOCALES) {
    const at = locate(key, locale);
    if (!at) {
      refuse(`add ${key}: no namespace file in ${locale}`);
      continue;
    }
    const current = getPath(at.entry.json[at.entry.wrapper], at.parts);
    if (CHECK) {
      if (current !== strings[locale]) refuse(`check ${key}: ${locale} differs`);
    } else if (current !== undefined) {
      refuse(`add ${key}: already exists in ${locale}`);
    }
  }
}
for (const [key, strings] of Object.entries(reword)) {
  for (const [locale, value] of Object.entries(strings)) {
    if (!LOCALES.includes(locale)) {
      refuse(`reword ${key}: unknown locale ${locale}`);
      continue;
    }
    const at = locate(key, locale);
    const current = at ? getPath(at.entry.json[at.entry.wrapper], at.parts) : undefined;
    if (CHECK) {
      if (current !== value) refuse(`check ${key}: ${locale} differs`);
      continue;
    }
    if (typeof current !== 'string') {
      refuse(`reword ${key}: does not exist in ${locale}`);
      continue;
    }
    const enAt = locate(key, 'en');
    const en = enAt ? getPath(enAt.entry.json[enAt.entry.wrapper], enAt.parts) : undefined;
    if (placeholders(value) !== placeholders(en)) refuse(`reword ${key}: ${locale} placeholder set differs from en`);
  }
}

const removals = []; // { entry, parts } per locale that holds a removed key
for (const key of remove) {
  let held = 0;
  for (const locale of LOCALES) {
    const at = locate(key, locale);
    if (!at) continue;
    if (getPath(at.entry.json[at.entry.wrapper], at.parts) === undefined) continue;
    held += 1;
    if (CHECK) refuse(`check ${key}: still in ${locale}`);
    else removals.push(at);
  }
  if (!CHECK && held === 0) refuse(`remove ${key}: held by no locale`);
}
for (const wrapper of removeNamespace) {
  for (const locale of LOCALES) {
    if (existsSync(path.join(MESSAGES, locale, `${wrapper}.json`))) refuse(`removeNamespace ${wrapper}: ${locale} file still exists`);
  }
}

const inlangText = readFileSync(INLANG, 'utf8');
const inlang = JSON.parse(inlangText);
const patterns = inlang['plugin.inlang.messageFormat'].pathPattern;
const wanted = created.map((w) => `./messages/{locale}/${w}.json`).filter((p) => !patterns.includes(p));
if (CHECK && wanted.length > 0) refuse(`check inlang: pathPattern lacks ${wanted.join(', ')}`);
const unwanted = removeNamespace.map((w) => `./messages/{locale}/${w}.json`).filter((p) => patterns.includes(p));
if (CHECK && unwanted.length > 0) refuse(`check inlang: pathPattern still names ${unwanted.join(', ')}`);
if (!CHECK) {
  for (const w of removeNamespace) {
    if (!unwanted.includes(`./messages/{locale}/${w}.json`)) refuse(`removeNamespace ${w}: not in the settings`);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
if (CHECK) {
  console.log(
    `check: ok (${Object.keys(add).length} added keys, ${Object.keys(reword).length} reworded, ${remove.length} removed, ${removeNamespace.length} namespaces removed)`
  );
  process.exit(0);
}

// Write.
for (const [key, strings] of Object.entries(add)) {
  for (const locale of LOCALES) {
    const { entry, parts } = locate(key, locale);
    entry.json[entry.wrapper] = setPath(entry.json[entry.wrapper], parts, strings[locale]);
    entry.changed = true;
  }
}
for (const [key, strings] of Object.entries(reword)) {
  for (const [locale, value] of Object.entries(strings)) {
    const { entry, parts } = locate(key, locale);
    entry.json[entry.wrapper] = setPath(entry.json[entry.wrapper], parts, value);
    entry.changed = true;
  }
}
for (const { entry, parts } of removals) {
  deletePath(entry.json[entry.wrapper], parts);
  entry.changed = true;
}
const written = [];
for (const [file, entry] of files) {
  if (!entry.changed) continue;
  writeFileSync(file, JSON.stringify(entry.json, null, 2) + '\n');
  written.push(path.relative(REPO, file));
}

if (wanted.length > 0) {
  // A line-level insertion keeps the rest of the settings file byte for byte.
  const lines = inlangText.split('\n');
  for (const entry of wanted) {
    const idx = lines.findIndex((l) => {
      const m = l.match(/^\s*"(\.\/messages\/\{locale\}\/contestantApp\.[^"]+)"/);
      return m !== null && cmp(entry, m[1]) < 0;
    });
    if (idx === -1) {
      console.error(`inlang: no place for ${entry}`);
      process.exit(1);
    }
    const indent = lines[idx].match(/^\s*/)[0];
    lines.splice(idx, 0, `${indent}"${entry}",`);
  }
  writeFileSync(INLANG, lines.join('\n'));
  written.push(path.relative(REPO, INLANG));
}

if (unwanted.length > 0) {
  // A line-level removal keeps the rest of the settings file byte for byte.
  const lines = readFileSync(INLANG, 'utf8').split('\n');
  const kept = lines.filter((l) => !unwanted.some((entry) => l.trim() === `"${entry}",`));
  if (lines.length - kept.length !== unwanted.length) {
    console.error(`inlang: could not remove ${unwanted.join(', ')} line by line`);
    process.exit(1);
  }
  writeFileSync(INLANG, kept.join('\n'));
  if (!written.includes(path.relative(REPO, INLANG))) written.push(path.relative(REPO, INLANG));
}

for (const w of written) console.log(w);
