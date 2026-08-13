import fs from 'fs';
import { createServer } from 'http';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import { assertServedApp, PROBE_RELATIVE_PATH } from '../support/preflight';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

/**
 * Unit tests for the E2E served-application preflight (Phase 137).
 *
 * They live in `tests/utils/` rather than next to the module in `tests/support/`
 * because this directory is the repo's wired-up vitest location — `tests/vitest.config.ts`
 * includes `tests/utils/**\/*.test.ts` only, and `tests/eslint.config.mjs` disables the
 * Playwright test-structure rules for exactly that glob. Run them with:
 *
 *   yarn vitest run --config tests/vitest.config.ts
 *
 * The preflight is exercised against a stub HTTP server rather than a real dev
 * server, which is the point of keeping the assertion in a module that takes its
 * target as an argument: every clause can be driven, including the ones a healthy
 * checkout never reaches.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PROBE_ABS_PATH = path.join(REPO_ROOT, PROBE_RELATIVE_PATH);

/** Shape of the application the stub server pretends to be. */
type StubOptions = {
  /** `<title>` to serve at `/`. `null` serves a document with no title element. */
  title: string | null;
  /** Status the `/@fs<abs probe path>` request answers with. */
  probeStatus: number;
  /** Whether the served HTML carries a `/@fs…/.svelte-kit/…` module reference. */
  withModuleRoot?: boolean;
};

let server: Server | null = null;

function startStub(options: StubOptions): Promise<string> {
  const { title, probeStatus, withModuleRoot = true } = options;
  const titleTag = title === null ? '' : `<title>${title}</title>`;
  const moduleRef = withModuleRoot
    ? `<script src="/@fs${REPO_ROOT}/apps/frontend/.svelte-kit/generated/client/app.js"></script>`
    : '';
  const html = `<!doctype html><html><head>${titleTag}${moduleRef}</head><body>ok</body></html>`;

  return new Promise((resolve) => {
    server = createServer((req, res) => {
      if (req.url === `/@fs${PROBE_ABS_PATH}`) {
        res.writeHead(probeStatus, { 'content-type': 'text/javascript' });
        // A real Vite echoes the absolute path back in its HMR preamble.
        res.end(probeStatus === 200 ? `import.meta.hot = __vite__createHotContext("/@fs${PROBE_ABS_PATH}");` : 'nope');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html);
    });
    server.listen(0, () => {
      const { port } = server?.address() as AddressInfo;
      resolve(`http://localhost:${port}`);
    });
  });
}

async function run(baseURL: string, repoRoot: string = REPO_ROOT): Promise<void> {
  await assertServedApp({ baseURL, repoRoot, deadlineMs: 2000, pollIntervalMs: 50 });
}

describe('assertServedApp', () => {
  afterEach(async () => {
    const current = server;
    server = null;
    if (current) await new Promise<void>((resolve) => current.close(() => resolve()));
  });

  it('passes when the probe returns 200 and the title is in the on-disk catalogue', async () => {
    const baseURL = await startStub({ title: 'Election Compass', probeStatus: 200 });
    await expect(run(baseURL)).resolves.toBeUndefined();
  });

  it('fails on a title that is one character off a catalogue value', async () => {
    // `Valkompass` vs this checkout's sv value `Valkompassen` — the exact shape of
    // the sibling checkout measured squatting the port during scouting.
    const baseURL = await startStub({ title: 'Valkompass', probeStatus: 200 });
    await expect(run(baseURL)).rejects.toThrow(/E2E PREFLIGHT FAILED[\s\S]*Valkompass/);
  });

  it('skips the title clause when the served document has no title at all', async () => {
    // Maintenance mode and backend translationOverrides legitimately replace it.
    const baseURL = await startStub({ title: null, probeStatus: 200 });
    await expect(run(baseURL)).resolves.toBeUndefined();
  });

  it('names the broken probe target when it is missing on disk, rather than blaming the server', async () => {
    const baseURL = await startStub({ title: 'Election Compass', probeStatus: 200 });
    const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-'));
    try {
      await expect(run(baseURL, emptyRoot)).rejects.toThrow(/preflight itself|probe target/i);
    } finally {
      fs.rmSync(emptyRoot, { recursive: true, force: true });
    }
  });

  it('does not throw while extracting the module root from HTML that has none', async () => {
    const baseURL = await startStub({ title: 'Election Compass', probeStatus: 403, withModuleRoot: false });
    // Reaches the clause (b) failure — not a crash inside the extraction.
    await expect(run(baseURL)).rejects.toThrow(/not this checkout's Vite dev server/);
  });
});
