/**
 * The values a hosted project is expected to serve, read from tracked files only. The probe holds no expected value of
 * its own: every value here is read from the file that sets it for the deployment.
 *
 *   ref        `project_ref` of the target root's `terraform.tfvars`, twenty lower-case letters
 *   maxRows    `{ json, pageSize }`: `api.max_rows` of `infra/modules/supabase/hosted-settings.json` and
 *              `dataAdapter.pageSize` of `packages/app-shared/src/settings/staticSettings.ts`
 *
 * The reading rules are the hosted-settings parity guard's: the JSON is parsed whole, `pageSize` is a line read inside
 * the `dataAdapter` block, and a `terraform.tfvars` assignment is a line `name = "value"` with an optional trailing
 * comment. A file that cannot be read, or a value that is missing, written twice or malformed, throws a
 * `ProbeInputError` whose message names the file and the value.
 *
 * This module has no side effect on import.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export const EXPECTED_PATHS = {
  settings: 'infra/modules/supabase/hosted-settings.json',
  staticSettings: 'packages/app-shared/src/settings/staticSettings.ts'
};

const PROJECT_REF = /^[a-z]{20}$/;

/** An input file that cannot be read, or a value in it that is missing or malformed. */
export class ProbeInputError extends Error {
  /**
   * @param file - The file, as displayed: relative to the repository root when inside it.
   * @param what - What is missing or malformed, naming the value.
   */
  constructor(file, what) {
    super(`${file}: ${what}`);
    this.name = 'ProbeInputError';
    this.file = file;
    this.what = what;
  }
}

function display(repoRoot, absolute) {
  const relative = path.relative(repoRoot, absolute);
  return relative.startsWith('..') || path.isAbsolute(relative) ? absolute : relative;
}

function readText(repoRoot, absolute) {
  const file = display(repoRoot, absolute);
  try {
    return { file, text: readFileSync(absolute, 'utf8') };
  } catch (error) {
    throw new ProbeInputError(file, `could not be read (${error.code ?? error.name})`);
  }
}

/**
 * One quoted string assignment of a `terraform.tfvars`, by a line read.
 *
 * @returns The value, or `null` when the file does not assign the name.
 * @throws ProbeInputError when the name is assigned more than once or a line assigning it cannot be read.
 */
export function readTfvarsString(file, text, name) {
  const values = [];
  for (const line of text.split('\n')) {
    if (!new RegExp(`^\\s*${name}\\s*=`).test(line)) continue;
    const m = new RegExp(`^\\s*${name}\\s*=\\s*"([^"\\\\]*)"\\s*(?:#.*)?$`).exec(line);
    if (!m) throw new ProbeInputError(file, `a ${name} line is not a quoted string the line read can read`);
    values.push(m[1]);
  }
  if (values.length > 1) throw new ProbeInputError(file, `${name} is assigned ${values.length} times`);
  return values.length === 1 ? values[0] : null;
}

/**
 * `dataAdapter.pageSize`, read as a line directly inside the `dataAdapter` block.
 *
 * @throws ProbeInputError when the block or the value is missing, unreadable or written twice.
 */
export function readPageSize(file, text) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^\s*dataAdapter\s*:\s*\{/.test(l));
  if (start === -1) throw new ProbeInputError(file, 'no `dataAdapter` block was found, so pageSize is missing');
  let depth = 0;
  const values = [];
  let unreadable = false;
  for (let i = start; i < lines.length; i += 1) {
    const code = lines[i].replace(/\/\/.*$/, '');
    if (i > start && depth === 1 && /^\s*pageSize\s*:/.test(code)) {
      const m = /^\s*pageSize\s*:\s*(\d+)\s*,?\s*$/.exec(code);
      if (m) values.push(Number(m[1]));
      else unreadable = true;
    }
    depth += (code.match(/\{/g) ?? []).length - (code.match(/\}/g) ?? []).length;
    if (depth <= 0) break;
  }
  if (unreadable) throw new ProbeInputError(file, 'a pageSize line is not an integer the line read can read');
  if (values.length === 0) throw new ProbeInputError(file, 'the `dataAdapter` block holds no pageSize');
  if (values.length > 1)
    throw new ProbeInputError(file, `the \`dataAdapter\` block holds pageSize ${values.length} times`);
  return values[0];
}

/**
 * `api.max_rows` of the hosted settings JSON.
 *
 * @throws ProbeInputError when the text is not JSON or the value is not a non-negative integer.
 */
export function readMaxRows(file, text) {
  let settings;
  try {
    settings = JSON.parse(text);
  } catch {
    throw new ProbeInputError(file, 'is not JSON, so api.max_rows cannot be read');
  }
  const api = settings !== null && typeof settings === 'object' ? settings.api : undefined;
  if (api === null || typeof api !== 'object' || !('max_rows' in api))
    throw new ProbeInputError(file, 'holds no api.max_rows');
  if (!Number.isInteger(api.max_rows) || api.max_rows < 0)
    throw new ProbeInputError(file, 'api.max_rows is not a non-negative integer');
  return api.max_rows;
}

/**
 * The expected values for one target root.
 *
 * @param options.repoRoot - The repository root the tracked files are read from. Defaults to this checkout's.
 * @param options.root - The absolute path of the target Terraform root, which holds its `terraform.tfvars`.
 * @returns `{ ref, maxRows: { json, pageSize } }`.
 * @throws ProbeInputError naming the file and the value when an input cannot be read.
 */
export function readExpected({ repoRoot = REPO_ROOT, root }) {
  const tfvars = readText(repoRoot, path.join(root, 'terraform.tfvars'));
  const ref = readTfvarsString(tfvars.file, tfvars.text, 'project_ref');
  if (ref === null) throw new ProbeInputError(tfvars.file, 'assigns no project_ref');
  if (!PROJECT_REF.test(ref)) throw new ProbeInputError(tfvars.file, 'project_ref is not twenty lower-case letters');

  const settings = readText(repoRoot, path.join(repoRoot, EXPECTED_PATHS.settings));
  const staticSettings = readText(repoRoot, path.join(repoRoot, EXPECTED_PATHS.staticSettings));

  return {
    ref,
    maxRows: {
      json: readMaxRows(settings.file, settings.text),
      pageSize: readPageSize(staticSettings.file, staticSettings.text)
    }
  };
}
