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
 * Unit tests for the E2E served-application preflight.
 *
 * They live in `tests/utils/` rather than next to the module in `tests/support/` because this directory is the repo's wired-up vitest location — `tests/vitest.config.ts`
 * includes `tests/utils/**\/*.test.ts` only, and `tests/eslint.config.mjs` disables the
 * Playwright test-structure rules for exactly that glob. Run them with:
 *
 *   yarn vitest run --config tests/vitest.config.ts
 *
 * The preflight is exercised against a stub HTTP server rather than a real dev server, which is the point of keeping the assertion in a module that takes its target as an argument: every clause can be driven, including the ones a healthy checkout never reaches.
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
  /**
   * Absolute checkout root the served HTML claims to be rooted at, i.e. what clause (b2) compares against this checkout. Defaults to {@link REPO_ROOT}, which is what a healthy dev server emits; overriding it is how a SIBLING checkout squatting the port is staged.
   */
  moduleRoot?: string;
};

let server: Server | null = null;

function startStub(options: StubOptions): Promise<string> {
  const { title, probeStatus, withModuleRoot = true, moduleRoot = REPO_ROOT } = options;
  const titleTag = title === null ? '' : `<title>${title}</title>`;
  const moduleRef = withModuleRoot
    ? `<script src="/@fs${moduleRoot}/apps/frontend/.svelte-kit/generated/client/app.js"></script>`
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
    // `Valkompass` vs this checkout's sv value `Valkompassen` — the exact shape of the sibling checkout measured squatting the port during scouting.
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
    // `probeStatus: 403` means this fails at clause (b1) and RETURNS BEFORE (b2). That is deliberate and is all this case claims: the extraction on a document with no module root does not crash on the way to the (b1) failure. It is NOT coverage of either (b2) branch — the two cases below are, and they keep the probe at 200 for exactly that reason. Do not "strengthen" this one by matching a (b2) message: it cannot reach one.
    await expect(run(baseURL)).rejects.toThrow(/not this checkout's Vite dev server/);
  });

  /**
   * Clause (b2) — the discriminating half of the guard, and the half a passing probe alone cannot supply: any Vite server whose fs.allow list covers this path answers the probe 200, including a sibling checkout of this same repo. Both branches below are reachable ONLY with `probeStatus: 200`; with a failing probe the assertion returns at (b1) and deleting the branches outright leaves the suite green.
   */
  it('fails closed when the probe returns 200 but the HTML emits no /@fs module root', async () => {
    // The minimal adversary: something answers, and even satisfies the probe, but has no `.svelte-kit` to identify itself with. Absent evidence is a REJECTION here, never a skipped assertion — that inversion is the whole point of the branch.
    const baseURL = await startStub({ title: 'Election Compass', probeStatus: 200, withModuleRoot: false });
    await expect(run(baseURL)).rejects.toThrow(/emitted no absolute \/@fs module root/);
  });

  it('fails when the served module root belongs to a different checkout', async () => {
    // The measured adversary: a sibling checkout of this repo, which passes the probe and (with a matching catalogue) the title clause too. The absolute root it emits is the one thing that cannot collide between checkouts.
    const baseURL = await startStub({
      title: 'Election Compass',
      probeStatus: 200,
      moduleRoot: '/opt/other-checkout'
    });
    await expect(run(baseURL)).rejects.toThrow(/rooted at a DIFFERENT checkout/);
  });
});

/** Drives a guaranteed failure and returns the message the operator would read. */
async function captureFailure(baseURL: string, repoRoot: string = REPO_ROOT): Promise<string> {
  try {
    await assertServedApp({ baseURL, repoRoot, deadlineMs: 2000, pollIntervalMs: 50 });
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error('expected the preflight to fail, but it passed');
}

describe('preflight failure message', () => {
  afterEach(async () => {
    const current = server;
    server = null;
    if (current) await new Promise<void>((resolve) => current.close(() => resolve()));
  });

  it('carries every diagnostic field, in order, with both remedies verbatim', async () => {
    const baseURL = await startStub({ title: 'Election Compass', probeStatus: 403 });
    const message = await captureFailure(baseURL);

    expect(message.split('\n')[0]).toContain('E2E PREFLIGHT FAILED');
    expect(message).toMatch(/reason:[\s\S]*expected port:[\s\S]*expected checkout:[\s\S]*observed:[\s\S]*remedies:/);
    expect(message).toContain(REPO_ROOT);
    expect(message).toContain('FRONTEND_PORT=<port your server is actually on>');
    expect(message).toMatch(/stop the other server occupying port \d+/);
  });

  it('renders complete and correct when lsof cannot be resolved', async () => {
    const baseURL = await startStub({ title: 'Election Compass', probeStatus: 403 });
    const emptyBin = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-nolsof-'));
    const realPath = process.env.PATH;
    process.env.PATH = emptyBin;
    try {
      const message = await captureFailure(baseURL);
      expect(message).toContain('E2E PREFLIGHT FAILED');
      expect(message).toContain('remedies:');
      // The whole section is omitted rather than rendered empty or crashing.
      expect(message).not.toContain('listening process:');
    } finally {
      process.env.PATH = realPath;
      fs.rmSync(emptyBin, { recursive: true, force: true });
    }
  });

  it('never leaks the raw response body', async () => {
    const baseURL = await startStub({ title: 'Election Compass', probeStatus: 403 });
    const message = await captureFailure(baseURL);
    // Only the extracted title and module root cross over from the response.
    expect(message).not.toContain('<html');
    expect(message).not.toContain('<script');
    expect(message).not.toContain('<body');
  });
});
