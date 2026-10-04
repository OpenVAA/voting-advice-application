#!/usr/bin/env node
// Comment-only equivalence check for quick task 260930-gjv (planning tool, not shipped code).
//
// Usage (run from the repository root, so `typescript` and `svelte/compiler` resolve):
//   node <this file> --rev=<rev> --changed <pathspec> [<pathspec> ...]
//   node <this file> [--rev=<rev>] [--allow-strings] <path> [<path> ...]
//
// --changed   Derive the file list at run time: every file under the pathspecs whose working-tree
//             content differs from <rev> (committed or not). Test files (`*.test.ts`, `*.spec.ts`)
//             are compared with string literals blanked, because their describe/test titles and
//             assertion messages may be reworded on purpose; every other code file is compared
//             strictly. Non-code files (e.g. `.md`) are listed as SKIP. An added, deleted or renamed
//             file is a failure: a comment-only task creates and removes nothing.
//
// Normalisation: `.svelte` files are compiled with `svelte/compiler` (client AND server output, which
// drops HTML and `@component` comments), then every file is parsed with the TypeScript compiler and
// re-printed with `removeComments: true`. Identical output means the edit touched comments only (plus,
// for test files, string-literal text).
//
// Directive comments are NOT covered by this check (the compilers ignore them): `svelte-ignore`,
// `eslint-disable*`, `@ts-expect-error`, `bind: keep`, `reason:` and `svelte-warning: accepted` lines
// must be left untouched; lint, typecheck and `check --fail-on-warnings` are what catch them.
//
// Prints SAME / DIFF / SKIP per path; exits 1 if any path differs or was added/deleted/renamed,
// 2 on a usage error.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.cwd() + '/');
const ts = require('typescript');
const { compile } = require('svelte/compiler');

let rev;
let allowStringsFlag = false;
let changedMode = false;
const operands = [];
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--rev=')) rev = arg.slice('--rev='.length);
  else if (arg === '--allow-strings') allowStringsFlag = true;
  else if (arg === '--changed') changedMode = true;
  else if (arg.startsWith('--')) usage(`unknown flag ${arg}`);
  else operands.push(arg);
}
if (operands.length === 0) usage('no paths or pathspecs given');
if (changedMode && !rev) usage('--changed needs an explicit --rev=<rev>');
rev ??= 'HEAD';

function usage(message) {
  console.error(`comment-only-check: ${message}`);
  process.exit(2);
}

const CODE = /\.(svelte|ts|js|mjs|cjs)$/;
const TEST = /\.(test|spec)\.ts$/;

const blankStrings = (ctx) => (root) => {
  const visit = (node) => {
    if (ts.isStringLiteral(node)) return ts.factory.createStringLiteral('');
    if (ts.isNoSubstitutionTemplateLiteral(node)) return ts.factory.createNoSubstitutionTemplateLiteral('');
    if (ts.isTemplateExpression(node))
      return ts.factory.createTemplateExpression(
        ts.factory.createTemplateHead(''),
        node.templateSpans.map((span, i, all) =>
          ts.factory.createTemplateSpan(
            ts.visitNode(span.expression, visit),
            i === all.length - 1 ? ts.factory.createTemplateTail('') : ts.factory.createTemplateMiddle('')
          )
        )
      );
    return ts.visitEachChild(node, visit, ctx);
  };
  return ts.visitNode(root, visit);
};

const printer = ts.createPrinter({ removeComments: true });

function normalise(source, file, allowStrings) {
  const codes = file.endsWith('.svelte')
    ? ['client', 'server'].map((generate) => compile(source, { generate, filename: file }).js.code)
    : [source];
  return codes
    .map((code) => {
      let sourceFile = ts.createSourceFile('x.ts', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
      if (allowStrings) sourceFile = ts.transform(sourceFile, [blankStrings]).transformed[0];
      return printer.printFile(sourceFile);
    })
    .join('\n//--\n');
}

let entries;
if (changedMode) {
  const out = execFileSync('git', ['diff', '--name-status', '--no-renames', rev, '--', ...operands], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  entries = out
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const [status, file] = row.split('\t');
      return { status, file, allowStrings: TEST.test(file) };
    });
} else {
  entries = operands.map((file) => ({ status: 'M', file, allowStrings: allowStringsFlag }));
}

let failures = 0;
let compared = 0;
for (const { status, file, allowStrings } of entries) {
  if (status !== 'M') {
    console.log(`FAIL (${status === 'A' ? 'added' : status === 'D' ? 'deleted' : status}) ${file}`);
    failures++;
    continue;
  }
  if (!CODE.test(file)) {
    if (changedMode) {
      console.log(`SKIP (not code) ${file}`);
      continue;
    }
    usage(`unsupported file type (not code): ${file}`);
  }
  const before = execFileSync('git', ['show', `${rev}:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const after = fs.readFileSync(file, 'utf8');
  const same = normalise(before, file, allowStrings) === normalise(after, file, allowStrings);
  compared++;
  console.log(`${same ? 'SAME' : 'DIFF'}${allowStrings ? ' (strings blanked)' : ''} ${file}`);
  if (!same) failures++;
}
console.log(`comment-only-check: ${compared} code file(s) compared against ${rev}, ${failures} failing`);
process.exit(failures ? 1 : 0);
