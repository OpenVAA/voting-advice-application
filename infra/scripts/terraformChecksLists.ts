/**
 * The lists `infra/scripts/terraform-checks.sh` holds, read from the script for the tests that check it and the workflows that call it.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The path of `terraform-checks.sh`. */
export const TERRAFORM_CHECKS_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'terraform-checks.sh');

/**
 * The entries of one of the script's top-level arrays, written one bare entry per line.
 * @param name - The array's name, such as `REQUIRED_ROOTS`.
 * @returns Its entries, in order.
 * @throws When the script has no such array, or the array is not written one bare entry per line.
 */
export function terraformChecksArray(name: string): Array<string> {
  const text = readFileSync(TERRAFORM_CHECKS_SCRIPT, 'utf8');
  const body = new RegExp(`^${name}=\\(\\n((?:[ \\t]+\\S+\\n)+)\\)$`, 'm').exec(text)?.[1];
  if (!body) throw new Error(`terraform-checks.sh has no array ${name} written one entry per line`);
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
