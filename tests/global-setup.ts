import path from 'path';
import { assertServedApp, FAILURE_HEADLINE } from './tests/support/preflight';
import { resolveE2eProjectId, SupabaseAdminClient } from './tests/utils/supabaseAdminClient';
import { TESTS_DIR } from './tests/utils/testsDir';
import type { FullConfig } from '@playwright/test';

/**
 * PLAYWRIGHT GLOBAL SETUP — the served-application gate.
 *
 * Thin adapter: it reads the target off the resolved config, derives this checkout's root, and hands both to `assertServedApp`. All the logic lives in `tests/support/preflight.ts` so it can be exercised without Playwright.
 *
 * This hook was measured to run on every invocation shape that executes specs — a full run, `--project=X`, `--grep` (including a `--grep` that matches nothing), and `--shard`. It deliberately does NOT run on `--list`, which `tests/README.md` advertises as usable without a dev server; the config-load orphan-probe guard in `playwright.config.ts` covers that path instead.
 *
 * There is no bypass here by design: no environment variable skips the gate and there is no CI early return. `FRONTEND_PORT` is the legitimate escape hatch — it points the suite at the operator's OWN server on another port, which the gate then verifies rather than trusts.
 *
 * Ordering note: when `PLAYWRIGHT_BANK_AUTH` is set, the `webServer` entry (the mock OIDC issuer) starts BEFORE this hook. So a failing preflight in such a run has already spawned that issuer — Playwright tears it down cleanly, no orphan process, no operator action. Expected, not a leak.
 */
/**
 * The attribute the served application publishes its configured project id on, and the placeholder `app.html` declares it with.
 *
 * Both literals are the harness's half of a two-sided contract whose other half is `apps/frontend/src/app.html` plus the `transformPageChunk` in `apps/frontend/src/hooks.server.ts`. An UNSUBSTITUTED placeholder is therefore not an edge case to tolerate: it is the exact signature of a substitution that stopped happening, and reading it as agreement would turn this gate into decoration. {@link assertServedProject} treats it as a mismatch, and so does an absent attribute.
 */
const SERVED_PROJECT_ATTRIBUTE = 'data-project-id';
const SERVED_PROJECT_PLACEHOLDER = '%projectId%';

/** Extracts the served project id, or `null` when the document carries no such attribute at all. */
function extractServedProjectId(html: string): string | null {
  const match = new RegExp(`${SERVED_PROJECT_ATTRIBUTE}="([^"]*)"`).exec(html);
  return match ? match[1].trim().toLowerCase() : null;
}

/**
 * SERVED-PROJECT GATE — asserts the application under test queries the project this suite seeds.
 *
 * Separate from {@link assertServedApp} on purpose, and deliberately AFTER it. That function's contract is the served CHECKOUT, it has its own drift guard in `tests/scripts/e2e-run.sh` keyed to its headline literals, and a run that is against the wrong checkout should be diagnosed as that first — the project it happens to serve is then beside the point.
 *
 * What it prevents: the harness creates and seeds its own project, while a dev server started without an explicit project serves the DEFAULT one. Those two facts are individually correct and jointly produce an application with no elections, no questions and no nominations — every spec then fails on an assertion about missing content, and not one line of the output names the cause. This gate converts that wall of failures into a single abort before any spec body runs.
 *
 * It reuses {@link FAILURE_HEADLINE} rather than minting a second one, so the wrapper's preflight verdict counts this failure too: a run whose served project disagrees with its seeded project is not evidence, in exactly the sense the wrapper already means by that word.
 */
async function assertServedProject(args: { baseURL: string; expectedProjectId: string }): Promise<void> {
  const { baseURL, expectedProjectId } = args;
  const port = new URL(baseURL).port;

  const res = await fetch(baseURL, { redirect: 'follow' });
  const html = await res.text();
  const served = extractServedProjectId(html);

  const reason =
    served === null
      ? `the served document carries no ${SERVED_PROJECT_ATTRIBUTE} attribute, so the project it queries cannot be established`
      : served === SERVED_PROJECT_PLACEHOLDER.toLowerCase()
        ? `the served document still carries the literal ${SERVED_PROJECT_PLACEHOLDER} placeholder, so the server never substituted its configured project id`
        : served === expectedProjectId
          ? null
          : 'the served application queries a different project than this suite seeds';

  if (reason === null) {
    console.log(`E2E SERVED PROJECT OK ${expectedProjectId}`);
    return;
  }

  // Field-by-field, in the same shape the served-checkout failure uses, and front-loaded for the same reason: Playwright appends a code frame and a stack trace immediately after this text, so the remedy has to be inside the block rather than trailing it.
  throw new Error(
    [
      `${FAILURE_HEADLINE} — the server on port ${port} serves a different project than this suite seeds.`,
      `  reason:            ${reason}`,
      `  observed project:  ${served ?? '(attribute absent)'}`,
      `  expected project:  ${expectedProjectId}`,
      `  expected port:     ${port} (${baseURL})`,
      '  remedies:',
      '    - run the suite through `tests/scripts/e2e-run.sh`, which spawns a dev server on the project the suite seeds; or',
      '    - if you are driving your own server, start it with PUBLIC_PROJECT_ID set to the expected project above'
    ].join('\n')
  );
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  // READ the target; never recompute it. A second copy of the `use.baseURL` expression in playwright.config.ts is a second thing that can drift, and drift is the bug class this gate exists to eliminate. The fallback mirrors that expression only so the preflight can never probe the literal string `undefined`; today all projects inherit the single top-level `baseURL`.
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    (process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173');

  // `TESTS_DIR` is `<repo-root>/tests/tests`, so the root is two levels up.
  // Reusing the existing helper rather than adding a second `import.meta.url` derivation keeps one answer to "where am I".
  const repoRoot = path.resolve(TESTS_DIR, '..', '..');

  // 120s in CI is exactly the budget the CI wait loop already granted (60 x 2s), so replacing that loop with this gate is strictly an improvement rather than a tolerance change smuggled into an integrity gate. It is NOT derived from observed CI step timings: the newest workflow run available when this was written was over two weeks stale, and per-step timings that old are not a sound basis for a ceiling. 30s locally is ~6x the measured 5.2s cold start.
  const deadlineMs = process.env.CI ? 120_000 : 30_000;

  await assertServedApp({ baseURL, repoRoot, deadlineMs });

  // ORDERING: the checkout is established above, the project immediately after it, and only then is anything written. Both are questions about the server the specs are about to drive, and both have to be answered before a row exists anywhere.
  await assertServedProject({ baseURL, expectedProjectId: resolveE2eProjectId() });

  // ORDERING: the served-application assertion above runs FIRST and stays first. A run against the wrong checkout has to be reported as that; creating rows before the identity is confirmed would report it as a database problem instead, in a database the run had no business writing to.
  //
  // The client defaults to the project this suite owns, and creating it is idempotent — a second run finds it already there. Nothing deletes it: the per-family `teardown:` projects clear the run's content by external_id prefix, which is what makes back-to-back runs work without a reset.
  await new SupabaseAdminClient().ensureProject();
}
