#!/usr/bin/env node
// Proves that each Tailwind class generates a rule in the frontend's production CSS.
//
// Tailwind v4 emits a rule only for class syntax it recognises, so a mistyped utility
// produces no CSS and no error. This reads every compiled client stylesheet, collects
// the class selectors it defines (unescaping CSS identifier escapes), and checks each
// requested class against that set.
//
// Usage (from the repo root, after `yarn workspace @openvaa/frontend build`):
//   node tailwind-classes-present.mjs <class>...
//   node tailwind-classes-present.mjs --from-diff <rev> [<class>...]
//
// --from-diff collects every class token on lines added since <rev> (working tree
// included) in `class="..."`, `class={...}`, `class:<name>` and `cn(...)` strings of
// changed `apps/frontend/src/**/*.svelte` files.
//
// Exit: 0 every class present, 1 any class missing, 2 usage error or no build output.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ASSETS_DIR = 'apps/frontend/.svelte-kit/output/client/_app/immutable/assets';
const SVELTE_PATHSPEC = 'apps/frontend/src/**/*.svelte';

function fail(message) {
  console.error(`tailwind-classes-present: ${message}`);
  process.exit(2);
}

/** A `CSS.escape`-equivalent for class names, used to print the selector a class needs. */
function cssEscape(name) {
  return name.replace(/[:/[\]()%.#,='"&>*+~!@]/g, (ch) => `\\${ch}`).replace(/^(\d)/, '\\3$1 ');
}

/** Every class selector defined in a stylesheet, unescaped to the class name as written in markup. */
function classSelectorsOf(css) {
  const found = new Set();
  const identifier = /\.((?:[A-Za-z0-9_\-\u0080-￿]|\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\[^\n0-9a-fA-F])+)/g;
  for (const match of css.matchAll(identifier)) {
    const name = match[1].replace(/\\([0-9a-fA-F]{1,6})[ \t\n\r\f]?|\\(.)/g, (_, hex, ch) =>
      hex ? String.fromCodePoint(parseInt(hex, 16)) : ch
    );
    found.add(name);
  }
  return found;
}

function readStylesheets(root) {
  const dir = resolve(root, ASSETS_DIR);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    fail(`no build output at ${ASSETS_DIR}; run \`yarn workspace @openvaa/frontend build\` first`);
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
  if (files.length === 0) fail(`no .css files under ${ASSETS_DIR}; run the build first`);
  const selectors = new Set();
  for (const file of files) {
    for (const name of classSelectorsOf(readFileSync(join(dir, file), 'utf8'))) selectors.add(name);
  }
  return { selectors, fileCount: files.length };
}

/** Class tokens inside a class string: whitespace-split, with `{...}` expressions reduced to their string literals. */
function tokensOfClassString(text) {
  const tokens = [];
  const expressions = [];
  const staticPart = text.replace(/\{[^{}]*\}/g, (expr) => {
    expressions.push(expr);
    return ' ';
  });
  tokens.push(...staticPart.split(/\s+/));
  for (const expr of expressions) tokens.push(...literalsOf(expr));
  return tokens;
}

/** Whitespace-split tokens of every quoted string literal (no nested template expressions). */
function literalsOf(code) {
  const tokens = [];
  for (const m of code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`$\n]*)`/g)) {
    tokens.push(...(m[1] ?? m[2] ?? m[3]).split(/\s+/));
  }
  return tokens;
}

function classesFromDiff(root, rev) {
  let diff;
  try {
    diff = execFileSync('git', ['diff', '--unified=0', rev, '--', SVELTE_PATHSPEC], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
  } catch (error) {
    fail(`git diff ${rev} failed: ${error.message}`);
  }
  const tokens = [];
  // Open-paren depth of a `cn(` call that continues onto the next added line.
  let cnDepth = 0;
  for (const line of diff.split('\n')) {
    if (!line.startsWith('+') || line.startsWith('+++')) {
      cnDepth = 0;
      continue;
    }
    const added = line.slice(1);
    if (cnDepth > 0) {
      tokens.push(...literalsOf(added));
      cnDepth = Math.max(0, cnDepth + parenBalance(added));
      continue;
    }
    for (const m of added.matchAll(/\bclass="([^"]*)"/g)) tokens.push(...tokensOfClassString(m[1]));
    for (const m of added.matchAll(/\bclass=\{([^}]*)\}/g)) tokens.push(...literalsOf(m[1]));
    for (const m of added.matchAll(/\bclass:([^\s=>{}]+)/g)) tokens.push(m[1]);
    const cnAt = added.search(/\bcn\(/);
    if (cnAt >= 0) {
      const call = added.slice(cnAt + 2);
      tokens.push(...literalsOf(call));
      cnDepth = Math.max(0, parenBalance(call));
    }
  }
  return tokens;
}

/** Opening minus closing parentheses outside string literals. */
function parenBalance(code) {
  const bare = code.replace(/'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/g, '');
  return (bare.match(/\(/g) ?? []).length - (bare.match(/\)/g) ?? []).length;
}

function isClassToken(token) {
  return token.length > 0 && !/[{}$<>]/.test(token) && !/^[-:'"`]*$/.test(token);
}

const args = process.argv.slice(2);
const requested = [];
let fromDiff;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from-diff') {
    fromDiff = args[++i];
    if (!fromDiff) fail('--from-diff needs a revision');
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log('usage: tailwind-classes-present.mjs [--from-diff <rev>] <class>...');
    process.exit(0);
  } else {
    requested.push(args[i]);
  }
}

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
if (fromDiff) requested.push(...classesFromDiff(root, fromDiff));
const classes = [...new Set(requested.filter(isClassToken))].sort();
if (classes.length === 0) fail('no classes to check');

const { selectors, fileCount } = readStylesheets(root);
let missing = 0;
for (const name of classes) {
  if (/^(group|peer)(\/[\w-]+)?$/.test(name)) {
    // `group` and `peer` mark an element for other classes' variants and generate no rule of their own.
    console.log(`marker   ${name}`);
  } else if (selectors.has(name)) {
    console.log(`present  ${name}`);
  } else {
    missing++;
    console.log(`MISSING  ${name}  (no rule for .${cssEscape(name)})`);
  }
}
console.log(`${classes.length} classes checked against ${fileCount} stylesheets; ${missing} missing`);
process.exit(missing === 0 ? 0 : 1);
