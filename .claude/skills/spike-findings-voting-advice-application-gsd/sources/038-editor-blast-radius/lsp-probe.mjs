#!/usr/bin/env node
/**
 * Spike 038 — headless `deno lsp` probe.
 *
 * Drives the Deno language server over this repository exactly as an editor would: it sends the
 * editor's `deno.*` settings, opens a fixed set of vanilla TypeScript files and Edge Function
 * files, and records which of them the server publishes diagnostics for. A file the server
 * treats as not Deno-enabled receives no diagnostics at all, which is the measurable form of
 * "Deno does not flag the vanilla TS".
 *
 * usage: DENO=/path/to/deno node lsp-probe.mjs [scenario-name ...]
 *
 * Every scenario creates the `deno.json` files it names, refuses to run if one already exists,
 * and deletes exactly the files it created.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const DENO = process.env.DENO ?? 'deno';
const FN = 'apps/supabase/supabase/functions';
const QUIET_MS = Number(process.env.QUIET_MS ?? 6000);
const MAX_MS = Number(process.env.MAX_MS ?? 90000);

/** Files opened in every scenario. `kind` is what the file is, not what the server decides. */
const FILES = [
  { kind: 'vanilla', path: 'packages/core/src/index.ts' },
  { kind: 'vanilla', path: 'packages/matching/src/index.ts' },
  { kind: 'vanilla', path: 'apps/frontend/src/hooks.server.ts' },
  { kind: 'vanilla', path: 'apps/frontend/src/lib/utils/breakpoints.ts' },
  { kind: 'vanilla', path: 'tests/playwright.config.ts' },
  { kind: 'vanilla', path: 'tests/tests/specs/a11y/a11y-smoke.spec.ts' },
  { kind: 'vanilla', path: 'apps/supabase/vitest.config.ts' },
  { kind: 'function', path: `${FN}/send-email/index.ts` },
  { kind: 'function', path: `${FN}/identity-callback/index.ts` },
  { kind: 'function', path: `${FN}/invite-candidate/entityGrant.ts` },
  { kind: 'fn-test', path: `${FN}/send-email/jwtSegment.test.ts` }
];

const TEST_EXCLUDE = { lock: false, exclude: ['**/*.test.ts'] };
/** `no-import-prefix` (new in Deno 2.9) objects to the pinned inline `npm:` specifiers the functions use on purpose. */
const RECOMMENDED = { ...TEST_EXCLUDE, lint: { rules: { exclude: ['no-import-prefix'] } } };

/**
 * `settings` is the editor's `deno.*` settings object. `enable: null` is what the VS Code
 * extension sends when `deno.enable` is not set anywhere, leaving the decision to the server.
 */
const SCENARIOS = {
  'S0-no-deno-anything': { configs: {}, settings: { enable: null } },
  'S1-root-deno-json': { configs: { 'deno.json': {} }, settings: { enable: null } },
  'S2-deno-enable-true': { configs: {}, settings: { enable: true } },
  'S3-functions-deno-json-only': { configs: { [`${FN}/deno.json`]: TEST_EXCLUDE }, settings: { enable: null } },
  'S4-enablePaths-only': { configs: {}, settings: { enable: null, enablePaths: [FN] } },
  'S5-functions-deno-json+enablePaths': {
    configs: { [`${FN}/deno.json`]: TEST_EXCLUDE },
    settings: { enable: null, enablePaths: [FN] }
  },
  'S6-supabase-deno-json-only': {
    configs: { 'apps/supabase/supabase/deno.json': TEST_EXCLUDE },
    settings: { enable: null }
  },
  'S7-functions-deno-json+enable-false': {
    configs: { [`${FN}/deno.json`]: TEST_EXCLUDE },
    settings: { enable: false }
  },
  'S8-recommended': {
    configs: { [`${FN}/deno.json`]: RECOMMENDED },
    settings: { enable: null, enablePaths: [FN] }
  },
  'S9-functions-deno-json+enable-true': {
    configs: { [`${FN}/deno.json`]: RECOMMENDED },
    settings: { enable: true }
  },
  'S10-enable-true+enablePaths': {
    configs: { [`${FN}/deno.json`]: RECOMMENDED },
    settings: { enable: true, enablePaths: [FN] }
  }
};

function runScenario(name, { configs, settings }) {
  return new Promise((resolveRun, rejectRun) => {
    const created = [];
    for (const [rel, body] of Object.entries(configs)) {
      const abs = join(ROOT, rel);
      if (existsSync(abs)) return rejectRun(new Error(`${rel} already exists; remove it before probing`));
      writeFileSync(abs, JSON.stringify(body, null, 2) + '\n');
      created.push(abs);
    }
    const cleanup = () => created.forEach((abs) => rmSync(abs, { force: true }));

    const denoSettings = { lint: true, unstable: [], ...settings };
    const child = spawn(DENO, ['lsp'], { cwd: ROOT, env: { ...process.env, NO_COLOR: '1' } });
    const diagnostics = new Map();
    let buffer = Buffer.alloc(0);
    let nextId = 1;
    let lastActivity = Date.now();
    const pending = new Map();

    const send = (msg) => {
      const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...msg }));
      child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
      child.stdin.write(body);
    };
    const request = (method, params) =>
      new Promise((res) => {
        const id = nextId++;
        pending.set(id, res);
        send({ id, method, params });
      });

    const onMessage = (msg) => {
      if (msg.id !== undefined && msg.method === undefined) return pending.get(msg.id)?.(msg.result ?? msg.error);
      if (msg.method === 'workspace/configuration') {
        // The server asks for one value per item; only the `deno` section carries settings.
        return send({ id: msg.id, result: msg.params.items.map((i) => (i.section === 'deno' ? denoSettings : null)) });
      }
      if (msg.id !== undefined) return send({ id: msg.id, result: null });
      if (msg.method === 'textDocument/publishDiagnostics') {
        lastActivity = Date.now();
        diagnostics.set(msg.params.uri, msg.params.diagnostics);
      }
    };

    child.stdout.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      for (;;) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd < 0) return;
        const length = Number(/Content-Length: (\d+)/i.exec(buffer.subarray(0, headerEnd).toString())[1]);
        if (buffer.length < headerEnd + 4 + length) return;
        onMessage(JSON.parse(buffer.subarray(headerEnd + 4, headerEnd + 4 + length).toString()));
        buffer = buffer.subarray(headerEnd + 4 + length);
      }
    });
    child.stderr.on('data', () => (lastActivity = Date.now()));
    child.on('error', (e) => (cleanup(), rejectRun(e)));

    (async () => {
      const rootUri = pathToFileURL(ROOT).href;
      await request('initialize', {
        processId: process.pid,
        rootUri,
        workspaceFolders: [{ uri: rootUri, name: 'repo' }],
        capabilities: {
          workspace: { configuration: true, workspaceFolders: true },
          textDocument: { publishDiagnostics: {}, synchronization: {} }
        },
        initializationOptions: denoSettings
      });
      send({ method: 'initialized', params: {} });
      for (const { path } of FILES) {
        send({
          method: 'textDocument/didOpen',
          params: {
            textDocument: {
              uri: pathToFileURL(join(ROOT, path)).href,
              languageId: 'typescript',
              version: 1,
              text: readFileSync(join(ROOT, path), 'utf8')
            }
          }
        });
      }
      lastActivity = Date.now();
      const started = Date.now();
      await new Promise((res) => {
        const timer = setInterval(() => {
          if (Date.now() - lastActivity > QUIET_MS || Date.now() - started > MAX_MS) (clearInterval(timer), res());
        }, 250);
      });
      const rows = FILES.map(({ kind, path }) => {
        const list = diagnostics.get(pathToFileURL(join(ROOT, path)).href);
        return {
          kind,
          path,
          published: list !== undefined,
          count: list?.length ?? 0,
          sources: [...new Set((list ?? []).map((d) => d.source))].join(','),
          first: list?.[0] ? `${list[0].code ?? ''} ${String(list[0].message).split('\n')[0].slice(0, 110)}` : ''
        };
      });
      child.kill();
      cleanup();
      resolveRun({ name, settings, configs: Object.keys(configs), rows });
    })().catch((e) => (child.kill(), cleanup(), rejectRun(e)));
  });
}

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(SCENARIOS);
const results = [];
for (const name of names) {
  const result = await runScenario(name, SCENARIOS[name]);
  results.push(result);
  const flagged = (kind) => result.rows.filter((r) => r.kind === kind && r.count > 0).length;
  const total = (kind) => result.rows.filter((r) => r.kind === kind).length;
  console.log(`\n## ${name}`);
  console.log(`settings=${JSON.stringify(result.settings)} deno.json=[${result.configs.join(', ') || 'none'}]`);
  console.log(
    `vanilla flagged ${flagged('vanilla')}/${total('vanilla')} | function flagged ${flagged('function')}/${total('function')} | function test flagged ${flagged('fn-test')}/${total('fn-test')}`
  );
  for (const r of result.rows) {
    console.log(`  ${r.kind.padEnd(8)} ${String(r.count).padStart(3)} ${r.published ? ' ' : '∅'} ${r.path}${r.first ? `  ← [${r.sources}] ${r.first}` : ''}`);
  }
}
if (process.env.JSON_OUT) writeFileSync(process.env.JSON_OUT, JSON.stringify(results, null, 2) + '\n');
