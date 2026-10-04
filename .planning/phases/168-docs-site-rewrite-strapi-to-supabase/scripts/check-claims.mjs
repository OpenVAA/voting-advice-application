#!/usr/bin/env node
/**
 * Phase 168 claims checker (phase-local; Node built-ins only).
 *
 *   node check-claims.mjs ledger <168-0N-CLAIMS.md …>
 *     Parses the `## Claims` table of each ledger — columns `# | Page | Kind | Claim | Anchor file | Anchor` — and
 *     verifies every row:
 *       - the anchor file is tracked by git (a file, or a directory holding tracked files);
 *       - the anchor is `-` or one backtick-quoted literal (no `|`, no backtick inside), and
 *         `git grep -q -F -e <anchor> -- <anchor file>` finds it;
 *       - neither the anchor file nor the anchor looks like a line number (`:12` at the end, `#L12`, `line 12`):
 *         content anchors, never line numbers (D-09).
 *     A ledger with no `## Claims` rows fails (fail-closed). Exit 1 lists every failing row by file and `#`.
 *
 *   node check-claims.mjs commands <page.md|page.svelte …>
 *     Extracts every `yarn …` command from fenced code blocks, inline code and `<code>` elements of the pages
 *     (a leading `$ ` prompt and a trailing `# comment` are stripped; segments are split on `&&` and `;`; leading
 *     `VAR=value` assignments are skipped) and resolves each (D-11):
 *       - `yarn workspace <name> <script>`: the tracked package.json whose `name` is <name> has <script> in `scripts`,
 *         or <script> is a Yarn built-in or a binary in that workspace's or the root's node_modules/.bin;
 *       - `yarn run <s>` / `yarn <s>` / bare `yarn`: the root package.json has <s> in `scripts`, or <s> is a Yarn 4
 *         built-in, or a binary in the root node_modules/.bin.
 *     A command whose script or workspace token is a placeholder (`<…>`, `{…}`, `[…]`, `...`) cannot be resolved; it is
 *     listed as skipped, not counted as resolved. Exit 1 lists each unresolved command with its page.
 *
 * Exit codes: 0 all rows / commands pass, 1 failures, 2 usage error.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const YARN_BUILTINS = new Set([
  'install',
  'add',
  'remove',
  'up',
  'why',
  'dlx',
  'exec',
  'workspace',
  'workspaces',
  'npm',
  'set',
  'config',
  'info',
  'dedupe',
  'cache',
  'constraints',
  'explain',
  'node',
  'pack',
  'patch',
  'rebuild',
  'version',
  'bin',
  'init',
  'link',
  'unlink',
  'plugin'
]);

const LINE_NUMBER_PATTERNS = [/:\d+$/, /#L\d+/, /\bline\s*\d+/i];

function git(args, options = {}) {
  return spawnSync('git', ['--literal-pathspecs', ...args], {
    cwd: repoRoot(),
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
    ...options
  });
}

let cachedRoot;
function repoRoot() {
  if (!cachedRoot) {
    const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf-8' });
    if (result.status !== 0) {
      console.error('Not inside a git repository');
      process.exit(2);
    }
    cachedRoot = result.stdout.trim();
  }
  return cachedRoot;
}

function usage(message) {
  console.error(`Usage error: ${message}`);
  console.error('Usage: node check-claims.mjs ledger <claims.md …> | commands <page …>');
  process.exit(2);
}

/** Split a markdown table row on unescaped `|`, dropping the outer empty cells. */
function splitRow(line) {
  const cells = [];
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '\\' && line[i + 1] === '|') {
      current += '|';
      i++;
    } else if (c === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current.trim());
  if (cells[0] === '') cells.shift();
  if (cells[cells.length - 1] === '') cells.pop();
  return cells;
}

function looksLikeLineNumber(value) {
  return LINE_NUMBER_PATTERNS.some((pattern) => pattern.test(value));
}

function stripBackticks(value) {
  const m = value.match(/^`([^`]*)`$/);
  return m ? m[1] : value;
}

function isTracked(file) {
  if (git(['ls-files', '--error-unmatch', '--', file], { stdio: ['ignore', 'ignore', 'ignore'] }).status === 0) return true;
  const dir = file.replace(/\/+$/, '');
  const listed = git(['ls-files', '--', `${dir}/`]);
  return listed.status === 0 && listed.stdout.trim().length > 0;
}

function parseClaimsTable(content) {
  const lines = content.split('\n');
  const start = lines.findIndex((l) => /^##\s+Claims\s*$/.test(l));
  if (start === -1) return { error: 'no `## Claims` section' };
  const rows = [];
  let header;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) break;
    if (!line.trim().startsWith('|')) continue;
    const cells = splitRow(line.trim());
    if (!header) {
      header = cells.map((c) => c.toLowerCase());
      continue;
    }
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue;
    rows.push({ cells, lineIndex: i + 1 });
  }
  const expected = ['#', 'page', 'kind', 'claim', 'anchor file', 'anchor'];
  if (!header || expected.some((name, i) => header[i] !== name))
    return { error: `the Claims table header must be: ${expected.join(' | ')}` };
  return { rows };
}

function checkLedger(files) {
  if (files.length === 0) usage('ledger needs at least one claims file');
  const failures = [];
  let checked = 0;
  for (const file of files) {
    let content;
    try {
      content = readFileSync(path.resolve(file), 'utf-8');
    } catch (error) {
      failures.push(`${file}: cannot read (${error.message})`);
      continue;
    }
    const { rows, error } = parseClaimsTable(content);
    if (error) {
      failures.push(`${file}: ${error}`);
      continue;
    }
    if (rows.length === 0) {
      failures.push(`${file}: no claim rows (fail-closed)`);
      continue;
    }
    for (const { cells } of rows) {
      checked++;
      const id = cells[0] ?? '?';
      const fail = (reason) => failures.push(`${file} #${id}: ${reason}`);
      if (cells.length !== 6) {
        fail(`expected 6 cells, found ${cells.length}`);
        continue;
      }
      const anchorFile = stripBackticks(cells[4]);
      const anchorCell = cells[5];
      if (looksLikeLineNumber(anchorFile) || looksLikeLineNumber(anchorCell)) {
        fail(`line-number anchor (${anchorFile} / ${anchorCell}) — content anchors, never line numbers`);
        continue;
      }
      if (!anchorFile || anchorFile === '-') {
        fail('no anchor file');
        continue;
      }
      if (!isTracked(anchorFile)) {
        fail(`anchor file is not tracked: ${anchorFile}`);
        continue;
      }
      if (anchorCell === '-') continue;
      const m = anchorCell.match(/^`([^`|]+)`$/);
      if (!m) {
        fail(`anchor must be \`-\` or one backtick-quoted literal: ${anchorCell}`);
        continue;
      }
      const grep = git(['grep', '-q', '-F', '-e', m[1], '--', anchorFile], { stdio: ['ignore', 'ignore', 'pipe'] });
      if (grep.status === 1) fail(`anchor ${anchorCell} not found in ${anchorFile}`);
      else if (grep.status !== 0) fail(`git grep error (status ${grep.status}): ${grep.stderr}`);
    }
  }
  console.info(`Claim rows checked: ${checked}`);
  if (failures.length > 0) {
    console.info(`\nFAILING ROWS (${failures.length}):`);
    for (const f of failures) console.info(`  ${f}`);
    process.exit(1);
  }
  console.info('All claim rows pass.');
}

/** name → { dir, scripts } for every tracked package.json outside node_modules. */
function loadWorkspaces() {
  const listed = git(['ls-files', '-z']);
  const workspaces = new Map();
  for (const file of listed.stdout.split('\0').filter(Boolean)) {
    if (path.basename(file) !== 'package.json' || file.includes('node_modules/')) continue;
    try {
      const pkg = JSON.parse(readFileSync(path.join(repoRoot(), file), 'utf-8'));
      const dir = path.dirname(file);
      if (dir === '.') workspaces.set('.', { dir, scripts: pkg.scripts ?? {} });
      if (pkg.name && !workspaces.has(pkg.name)) workspaces.set(pkg.name, { dir, scripts: pkg.scripts ?? {} });
    } catch {
      // Not a parseable manifest; ignore
    }
  }
  return workspaces;
}

function hasBin(dir, name) {
  return existsSync(path.join(repoRoot(), dir, 'node_modules', '.bin', name));
}

function isPlaceholder(token) {
  return /[<>{}[\]]/.test(token) || token.includes('...') || token.includes('…');
}

/** Pull the code texts (fenced blocks, inline code, `<code>` elements) out of a page. */
function extractCodeTexts(content) {
  const texts = [];
  const lines = content.split('\n');
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
      else texts.push({ text: line, line: i + 1 });
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      continue;
    }
    for (const m of line.matchAll(/(`+)([^`]+?)\1/g)) texts.push({ text: m[2], line: i + 1 });
    for (const m of line.matchAll(/<code[^>]*>([^<]*)<\/code>/g)) texts.push({ text: m[1], line: i + 1 });
  }
  return texts;
}

function extractYarnCommands(text) {
  const commands = [];
  const stripped = text.replace(/^\s*\$\s+/, '').replace(/\s+#.*$/, '');
  for (let segment of stripped.split(/&&|;/)) {
    segment = segment.trim().replace(/^\$\s+/, '');
    while (/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/.test(segment)) segment = segment.replace(/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/, '');
    if (segment === 'yarn' || segment.startsWith('yarn ')) commands.push(segment);
  }
  return commands;
}

/** @returns `ok`, `skipped` or an unresolved reason */
function resolveCommand(command, workspaces) {
  const tokens = command.split(/\s+/).filter(Boolean);
  const root = workspaces.get('.');
  let i = 1;
  while (tokens[i]?.startsWith('-')) i++; // global flags such as --silent
  const first = tokens[i];
  if (first === undefined) return 'ok'; // bare `yarn` = install
  if (first === 'workspace') {
    const name = tokens[i + 1];
    const script = tokens[i + 2];
    if (!name || !script) return 'incomplete `yarn workspace` command';
    if (isPlaceholder(name) || isPlaceholder(script)) return 'skipped';
    const ws = workspaces.get(name);
    if (!ws) return `no workspace named ${name}`;
    if (script === 'run') {
      const s = tokens[i + 3];
      if (!s) return 'incomplete `yarn workspace … run` command';
      if (isPlaceholder(s)) return 'skipped';
      return s in ws.scripts || hasBin(ws.dir, s) || hasBin('.', s) ? 'ok' : `${name} has no script or binary ${s}`;
    }
    if (script in ws.scripts || YARN_BUILTINS.has(script) || hasBin(ws.dir, script) || hasBin('.', script)) return 'ok';
    return `${name} has no script, built-in or binary ${script}`;
  }
  if (first === 'run') {
    const s = tokens[i + 1];
    if (!s) return 'incomplete `yarn run` command';
    if (isPlaceholder(s)) return 'skipped';
    return s in root.scripts || hasBin('.', s) ? 'ok' : `root has no script or binary ${s}`;
  }
  if (isPlaceholder(first)) return 'skipped';
  if (first in root.scripts || YARN_BUILTINS.has(first) || hasBin('.', first)) return 'ok';
  return `root has no script ${first}, and it is not a Yarn built-in or a root binary`;
}

function checkCommands(pages) {
  if (pages.length === 0) usage('commands needs at least one page');
  const workspaces = loadWorkspaces();
  if (!workspaces.has('.')) {
    console.error('Cannot read the root package.json');
    process.exit(2);
  }
  const unresolved = [];
  const skipped = [];
  let total = 0;
  for (const page of pages) {
    let content;
    try {
      content = readFileSync(path.resolve(page), 'utf-8');
    } catch (error) {
      unresolved.push(`${page}: cannot read (${error.message})`);
      continue;
    }
    for (const { text, line } of extractCodeTexts(content)) {
      for (const command of extractYarnCommands(text)) {
        total++;
        const verdict = resolveCommand(command, workspaces);
        if (verdict === 'ok') continue;
        if (verdict === 'skipped') skipped.push(`${page}:${line}: ${command}`);
        else unresolved.push(`${page}:${line}: \`${command}\` — ${verdict}`);
      }
    }
  }
  console.info(`yarn commands found: ${total} in ${pages.length} page(s)`);
  if (skipped.length > 0) {
    console.info(`\nSKIPPED (placeholder, not resolvable) (${skipped.length}):`);
    for (const s of skipped) console.info(`  ${s}`);
  }
  if (unresolved.length > 0) {
    console.info(`\nUNRESOLVED (${unresolved.length}):`);
    for (const u of unresolved) console.info(`  ${u}`);
    process.exit(1);
  }
  console.info('All yarn commands resolve.');
}

const [mode, ...rest] = process.argv.slice(2);
if (mode === 'ledger') checkLedger(rest);
else if (mode === 'commands') checkCommands(rest);
else usage(`unknown mode ${mode ?? '(none)'}`);
