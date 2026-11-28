#!/usr/bin/env node

/**
 * LINT OF THE PIPELINE WORKFLOWS.
 *
 * Runs actionlint 1.7.12 from its published container, pinned by digest, on the three workflows of the deploy pipeline:
 * `.github/workflows/infra-plan.yml`, `deploy.yml` and `destroy.yml`. The image carries shellcheck, so every `run:`
 * script of the three is checked as well. `main.yaml` is not passed: it carries a finding that is not theirs, and a
 * lint of the pipeline must not go red or green on it.
 *
 * The repository is mounted read-only, so the lint cannot write into the checkout. No package is installed: the one
 * moving part is the image, and its digest names exactly one build of it.
 *
 * Usage:
 *   node scripts/lint-workflows.mjs        # or: yarn lint:workflows
 *
 * Output: actionlint's own, one `file:line:col: message` finding per line, nothing when the three files are clean.
 *
 * Exit codes:
 *   0 - no finding
 *   1 - at least one finding, or a workflow file is missing
 *   2 - docker could not be started, or its daemon failed to run the container (docker's status 125)
 *   otherwise - actionlint's own status
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGE = 'rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667';
const WORKFLOWS = ['.github/workflows/infra-plan.yml', '.github/workflows/deploy.yml', '.github/workflows/destroy.yml'];

const missing = WORKFLOWS.filter((path) => !existsSync(join(REPO_ROOT, path)));
if (missing.length > 0) {
  for (const path of missing) console.error(`lint-workflows: ${path} does not exist`);
  process.exit(1);
}

const result = spawnSync(
  'docker',
  ['run', '--rm', '-v', `${REPO_ROOT}:/repo:ro`, '-w', '/repo', IMAGE, '-no-color', ...WORKFLOWS],
  { stdio: 'inherit' }
);

if (result.error) {
  console.error(`lint-workflows: docker could not be started: ${result.error.message}`);
  process.exit(2);
}
if (result.status === null) {
  console.error(`lint-workflows: docker was ended by ${result.signal}`);
  process.exit(2);
}
if (result.status === 125) {
  console.error('lint-workflows: docker could not run the container');
  process.exit(2);
}
if (result.status === 0) console.error(`lint-workflows: actionlint found nothing in ${WORKFLOWS.length} workflows`);
process.exit(result.status);
