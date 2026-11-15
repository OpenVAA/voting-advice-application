import path from 'path';
import {
  DEPLOYED_GATE_HEADLINE,
  gateFailureMessage,
  gateTargetLine,
  runDeployedGate
} from './tests/utils/deployedTarget';
import { TESTS_DIR } from './tests/utils/testsDir';
import type { FullConfig } from '@playwright/test';

/**
 * Global setup of the deployed smoke entry: runs the deployed-target gate before any spec.
 *
 * A thin adapter. It reads the target off the resolved config rather than recomputing it, derives the repository root, and hands both with the process environment to `runDeployedGate`. It prints each check's line and throws the gate's failure message when a check failed. It creates no client and writes nothing.
 *
 * @param config - The resolved Playwright configuration.
 * @throws When the configuration names no `baseURL`, or when any gate check failed.
 */
export default async function deployedGlobalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (typeof baseURL !== 'string') {
    throw new Error(`${DEPLOYED_GATE_HEADLINE} — the resolved config names no baseURL`);
  }

  // `TESTS_DIR` is `<repo-root>/tests/tests`, so the root is two levels up.
  const repoRoot = path.resolve(TESTS_DIR, '..', '..');

  console.log(gateTargetLine(baseURL));
  const result = await runDeployedGate({ env: process.env, baseURL, repoRoot });
  for (const line of result.lines) console.log(line);

  if (result.failed > 0) throw new Error(gateFailureMessage(result));

  const build = result.checks.find((check) => check.name === 'sha')?.observed ?? '';
  console.log(
    `DEPLOYED SMOKE GATE OK build=${build} ref=${result.dedicated.projectRef} project=${result.dedicated.publicProjectId}`
  );
}
