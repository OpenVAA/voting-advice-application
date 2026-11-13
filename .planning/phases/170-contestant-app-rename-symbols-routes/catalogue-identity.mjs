#!/usr/bin/env node
// catalogue-identity.mjs — D-19 (i): no message VALUE changed in any locale.
//
// Flattens every locale catalogue at a base revision ("before", read from git objects) and in the
// working tree ("after"), and compares value by value through the key mapping of the rename.
//
// Usage:
//   node catalogue-identity.mjs --base <rev>                       # after = apps/frontend/messages in the working tree
//   node catalogue-identity.mjs --base <rev> --after-root <dir>    # after = <dir>/<locale>/*.json (the negative control)
//
// Prints `<locale>: <n> keys compared` for each of the seven locales.
//
// Exit codes:
//   0  every value identical through the key mapping, in all seven locales
//   1  a changed value, a missing key or a differing key count (each named on stderr)
//   2  usage error

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const MESSAGES = 'apps/frontend/messages';
const LOCALES = ['da', 'en', 'et', 'fi', 'fr', 'lb', 'sv'];

function usage(message) {
  if (message) console.error(`catalogue-identity.mjs: ${message}`);
  console.error('usage: node catalogue-identity.mjs --base <rev> [--after-root <dir>]');
  process.exit(2);
}

const argv = process.argv.slice(2);
let base = '';
let afterRoot = '';
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--base') base = argv[(i += 1)] ?? '';
  else if (argv[i] === '--after-root') afterRoot = argv[(i += 1)] ?? '';
  else usage(`unexpected argument '${argv[i]}'`);
}
if (!base) usage('--base <rev> is required');
// Resolved against the caller's directory before the chdir below.
const afterDir = afterRoot ? path.resolve(afterRoot) : path.join(REPO_ROOT, MESSAGES);
process.chdir(REPO_ROOT);
if (!existsSync(afterDir)) usage(`after root '${afterDir}' does not exist`);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
try {
  git('cat-file', '-e', `${base}^{commit}`);
} catch {
  usage(`'${base}' is not a commit`);
}

/** The key mapping of the rename: the 17 app namespaces and the four app-level groups of `dynamic`. */
const mapKey = (k) => k.replace(/^candidateApp\./, 'contestantApp.').replace(/^dynamic\.candidateApp/, 'dynamic.contestantApp');

const isVariant = (v) => 'declarations' in v || 'selectors' in v || 'match' in v;
function flatten(tree, prefix, out) {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && !isVariant(v)) flatten(v, key, out);
    else out.set(key, JSON.stringify(v)); // byte-level value identity, variants included
  }
  return out;
}

const beforeFiles = git('ls-tree', '-r', '--name-only', base, MESSAGES).split('\n').filter(Boolean);

function loadBefore(locale) {
  const out = new Map();
  for (const f of beforeFiles) {
    if (!f.startsWith(`${MESSAGES}/${locale}/`) || !f.endsWith('.json')) continue;
    flatten(JSON.parse(git('show', `${base}:${f}`)), '', out);
  }
  return out;
}

function loadAfter(locale) {
  const out = new Map();
  const dir = path.join(afterDir, locale);
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.json')) flatten(JSON.parse(readFileSync(path.join(dir, f), 'utf8')), '', out);
  }
  return out;
}

let bad = 0;
for (const locale of LOCALES) {
  const before = loadBefore(locale);
  const after = loadAfter(locale);
  for (const [k, v] of before) {
    const mapped = mapKey(k);
    if (!after.has(mapped)) {
      bad += 1;
      console.error(`${locale} ${k}: key missing after (expected ${mapped})`);
    } else if (after.get(mapped) !== v) {
      bad += 1;
      console.error(`${locale} ${k}: value changed`);
    }
  }
  if (before.size !== after.size) {
    bad += 1;
    console.error(`${locale}: ${before.size} keys before, ${after.size} after`);
  }
  if (before.size === 0) {
    bad += 1;
    console.error(`${locale}: no keys at ${base} — nothing was compared`);
  }
  console.log(`${locale}: ${before.size} keys compared`);
}
console.error(bad ? `catalogue-identity.mjs: ${bad} difference(s)` : 'catalogue-identity.mjs: identical through the key mapping');
process.exit(bad ? 1 : 0);
