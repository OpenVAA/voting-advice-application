#!/usr/bin/env node
// 177-read-rulings.mjs — the fixed-rule reading of an operator's decision document.
//
// Usage:
//   node 177-read-rulings.mjs <document> <section letters> [--facts <facts file>]
//
//   <document>         the decision document, a Markdown file
//   <section letters>  one capital letter per section to read: `CD` reads the sections whose headings begin
//                      `## C.` and `## D.`
//   --facts <file>     also require that the file records what was read (below)
//
// An item is a `### <letter><number>` heading inside a named section, with everything up to the next heading
// of either level. Its options are the list lines of the form `- [ ] **(a) …`; a line indented under an option
// continues it. Each item gets exactly one outcome, printed as one line:
//
//   <item>: recommended-unticked (<option>)   no box ticked and no NOTE text: the ★ option
//   <item>: recommended-ticked (<option>)     exactly one box ticked, on the ★ option, and no NOTE text
//   <item>: halt — <why>                      anything else, followed by the item verbatim between two marker
//                                             lines
//
// What halts an item: any text after a NOTE marker; text after the options that is not part of one; a box that
// is neither empty nor ticked; an item without exactly one ★ option; more than one box ticked; one box ticked
// on an option that is not the ★ one. An empty NOTE marker with no text is not NOTE text. No ticked option
// other than the ★ one is ever accepted: FALLBACK, the list of items with a second option an executor may
// build, is empty.
//
// With --facts the file must hold the line `## Operator rulings as read` and, below it, for every item read, a
// line that begins with `- ` and the item's printed line.
//
// It reads the two files and nothing else, and it decides nothing an item's own text does not decide.
//
// Exit codes: 0 every item stands at its ★ option (and, with --facts, each is recorded); 1 an item halts, the
// document cannot be read or it holds no item under the named sections; 2 a missing or malformed argument, or
// a facts file that does not record every item.

import { readFileSync } from 'node:fs';

/** The items with a fallback option an executor may build. None: every ticked box off the ★ option halts. */
const FALLBACK = [];

function usage(message) {
  if (message) console.error(`177-read-rulings.mjs: ${message}`);
  console.error('usage: node 177-read-rulings.mjs <document> <section letters> [--facts <facts file>]');
  process.exit(2);
}

const args = process.argv.slice(2);
const doc = args[0];
const letters = args[1];
let facts = '';
if (!doc || doc.startsWith('--')) usage('a <document> is required');
if (!letters || !/^[A-Z]+$/.test(letters)) usage('<section letters> is required: one capital letter per section, for example CD');
for (let i = 2; i < args.length; i += 2) {
  if (args[i] !== '--facts') usage(`unexpected argument '${args[i]}'`);
  if (!args[i + 1]) usage('--facts requires a file');
  facts = args[i + 1];
}

let text;
try {
  text = readFileSync(doc, 'utf8');
} catch {
  console.log('HALT: the decision document cannot be read: ' + doc);
  process.exit(1);
}

// The items of the named sections, each with its lines as written.
const sectionHeading = new RegExp('^## [' + letters + ']\\.');
const items = [];
let sec = false;
let cur = null;
for (const l of text.split('\n')) {
  if (/^## /.test(l)) {
    sec = sectionHeading.test(l);
    cur = null;
    continue;
  }
  if (!sec) continue;
  const h = /^### ([A-Z][0-9]+)( |$)/.exec(l);
  if (h) {
    cur = { id: h[1], lines: [l] };
    items.push(cur);
    continue;
  }
  if (cur) cur.lines.push(l);
}
if (!items.length) {
  console.log('HALT: no item under a heading of section ' + letters.split('').join(' or ') + ' in ' + doc);
  process.exit(1);
}

let halt = 0;
const rec = [];
for (const it of items) {
  const opts = [];
  let o = null;
  let note = '';
  let inNote = false;
  let odd = false;
  let stray = false;
  for (const l of it.lines.slice(1)) {
    const b = /^\s*[-*] \[(.?)\] \*\*\(([a-z])\)/.exec(l);
    if (b) {
      inNote = false;
      o = { letter: b[2], mark: b[1], text: l };
      opts.push(o);
      if (!/^[ xX]$/.test(b[1])) odd = true;
      continue;
    }
    const n = /^\s*(?:>\s*)?(?:[-*]\s+)?\**NOTE\b[*:]*(.*)$/.exec(l);
    if (n) {
      inNote = true;
      o = null;
      note += n[1];
      continue;
    }
    if (/^\s*(---+)?\s*$/.test(l)) {
      o = null;
      continue;
    }
    if (inNote) {
      note += l;
      continue;
    }
    if (o && /^\s+\S/.test(l)) {
      o.text += ' ' + l.trim();
      continue;
    }
    if (opts.length) stray = true;
    o = null;
  }
  const star = opts.filter((x) => x.text.indexOf('★') >= 0);
  const ticked = opts.filter((x) => /[xX]/.test(x.mark));
  let code = 'halt';
  let why = '';
  let letter = '';
  if (note.replace(/[\s*:]/g, '').length > 0) why = 'NOTE text under the item';
  else if (stray) why = 'text after the options that is not part of one';
  else if (odd) why = 'a box that is neither empty nor ticked';
  else if (star.length !== 1) why = 'not exactly one recommended option';
  else if (ticked.length > 1) why = 'more than one box ticked';
  else if (ticked.length === 0) {
    code = 'recommended-unticked';
    letter = star[0].letter;
  } else if (ticked[0] === star[0]) {
    code = 'recommended-ticked';
    letter = star[0].letter;
  } else if (FALLBACK.indexOf(it.id) >= 0 && ticked[0].letter === 'b') {
    code = 'fallback';
    letter = 'b';
  } else why = 'option (' + ticked[0].letter + ') ticked, for which the plans state no fallback an executor may build';
  if (code === 'halt') {
    halt++;
    console.log(it.id + ': halt — ' + why);
    console.log('----- the item, verbatim -----');
    console.log(it.lines.join('\n').replace(/\s+$/, ''));
    console.log('----- end of ' + it.id + ' -----');
  } else {
    console.log(it.id + ': ' + code + ' (' + letter + ')');
  }
  rec.push({ id: it.id, line: '- ' + it.id + ': ' + code + (letter ? ' (' + letter + ')' : '') });
}
if (halt) {
  console.log('HALT: ' + halt + ' item(s) need the orchestrator; nothing is built');
  process.exit(1);
}

if (facts) {
  let f;
  try {
    f = readFileSync(facts, 'utf8').split('\n');
  } catch {
    console.log('the facts file cannot be read: ' + facts);
    process.exit(2);
  }
  const at = f.indexOf('## Operator rulings as read');
  if (at < 0) {
    console.log('no heading: ## Operator rulings as read');
    process.exit(2);
  }
  const miss = rec.filter((r) => !f.slice(at + 1).some((l) => l.indexOf(r.line) === 0));
  if (miss.length) {
    console.log('not recorded as read: ' + miss.map((r) => r.line).join(' | '));
    process.exit(2);
  }
}
