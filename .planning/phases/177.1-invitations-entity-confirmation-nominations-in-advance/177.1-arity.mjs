#!/usr/bin/env node
// 177.1-arity.mjs — counts the calls of one SQL function in a file and checks each call's number of arguments.
//
// Usage:
//   node 177.1-arity.mjs <file|-> <arity> [--function <name>]
//
//   <file|->           the SQL text to read; `-` reads standard input
//   <arity>            the number of top-level arguments every call must have (a non-negative integer)
//   --function <name>  the function's name, without a schema (default: create_invitations)
//
// The text is walked once. A `--` comment (to the end of its line), a `/* … */` comment and a single-quoted
// literal (a doubled '' inside it is an escaped quote) are skipped, so a name in a comment or in a string — a
// `has_function` argument, a regprocedure literal — is no call. A dollar-quoted body is not skipped: pgTAP
// passes the statements it runs as `$$ … $$`, and a call there is a call. A call is an occurrence of the name
// that no identifier character precedes (a schema qualifier's dot may), followed by optional white space and
// `(`. Its argument list is read to the balancing `)`, skipping comments and literals, and its top-level commas
// are counted: a comma inside a nested `( … )` or `[ … ]` belongs to an inner expression. An empty list is
// zero arguments.
//
// Prints `calls: <n>`, then one line per call whose argument count differs from <arity> (its line number and
// its count) or whose list does not close.
//
// Exit codes: 0 every call has exactly <arity> arguments and there is at least one call; 1 a call with
// another count, a list that does not close, or no call at all; 2 usage error or an unreadable file.

import { readFileSync } from 'node:fs';

function usage(message) {
  if (message) console.error(`177.1-arity.mjs: ${message}`);
  console.error('usage: node 177.1-arity.mjs <file|-> <arity> [--function <name>]');
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length !== 2 && args.length !== 4) usage(args.length ? 'wrong number of arguments' : '');
const [source, arityArg] = args;
let name = 'create_invitations';
if (args.length === 4) {
  if (args[2] !== '--function') usage(`unexpected argument '${args[2]}'`);
  name = args[3];
}
if (!/^\d+$/.test(arityArg)) usage(`<arity> must be a non-negative integer, not '${arityArg}'`);
if (!/^[A-Za-z_][A-Za-z0-9_$]*$/.test(name)) usage(`'${name}' is not a plain SQL function name`);
const arity = Number(arityArg);

let text;
try {
  text = readFileSync(source === '-' ? 0 : source, 'utf8');
} catch (error) {
  usage(`cannot read ${source === '-' ? 'standard input' : source}: ${error.message}`);
}

const isIdentChar = (c) => c !== undefined && /[A-Za-z0-9_$]/.test(c);

/** The index just past a comment or a single-quoted literal that begins at `i`, or `i` when none begins there. */
function skipQuotedOrComment(i) {
  if (text[i] === '-' && text[i + 1] === '-') {
    const end = text.indexOf('\n', i);
    return end === -1 ? text.length : end;
  }
  if (text[i] === '/' && text[i + 1] === '*') {
    const end = text.indexOf('*/', i + 2);
    return end === -1 ? text.length : end + 2;
  }
  if (text[i] === "'") {
    let j = i + 1;
    while (j < text.length) {
      if (text[j] === "'") {
        if (text[j + 1] === "'") j += 2;
        else return j + 1;
      } else j += 1;
    }
    return text.length;
  }
  return i;
}

const lineAt = (index) => text.slice(0, index).split('\n').length;

/** Reads the argument list whose `(` is at `open`: its top-level argument count and the index past its `)`, or null when it does not close. */
function readArguments(open) {
  let depth = 0;
  let commas = 0;
  let sawToken = false;
  let i = open + 1;
  while (i < text.length) {
    const skipped = skipQuotedOrComment(i);
    if (skipped !== i) {
      if (text[i] === "'") sawToken = true;
      i = skipped;
      continue;
    }
    const c = text[i];
    if (c === '(' || c === '[') depth += 1;
    else if (c === ']') depth -= 1;
    else if (c === ')') {
      if (depth === 0) return { count: sawToken ? commas + 1 : 0, end: i + 1 };
      depth -= 1;
    } else if (c === ',' && depth === 0) commas += 1;
    if (!/\s/.test(c)) sawToken = true;
    i += 1;
  }
  return null;
}

let calls = 0;
const offending = [];
let i = 0;
while (i < text.length) {
  const skipped = skipQuotedOrComment(i);
  if (skipped !== i) {
    i = skipped;
    continue;
  }
  if (text.startsWith(name, i) && !isIdentChar(text[i - 1])) {
    let j = i + name.length;
    while (j < text.length && /\s/.test(text[j])) j += 1;
    if (text[j] === '(' && !isIdentChar(text[i + name.length])) {
      calls += 1;
      const list = readArguments(j);
      if (list === null) {
        offending.push(`line ${lineAt(i)}: the argument list does not close`);
        break;
      }
      if (list.count !== arity) offending.push(`line ${lineAt(i)}: ${list.count} argument(s), not ${arity}`);
      i = list.end;
      continue;
    }
  }
  i += 1;
}

console.log(`calls: ${calls}`);
for (const line of offending) console.log(line);
if (calls === 0) console.log(`no call of ${name} was found`);
process.exit(calls > 0 && offending.length === 0 ? 0 : 1);
