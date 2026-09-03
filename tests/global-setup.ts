import path from 'path';
import { assertServedApp } from './tests/support/preflight';
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
}
