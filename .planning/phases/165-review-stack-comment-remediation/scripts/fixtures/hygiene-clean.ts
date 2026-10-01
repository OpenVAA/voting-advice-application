/**
 * Self-test fixture for hygiene-changed-files.sh. Every comment below is clean, and each layer of the gate must report zero hits here.
 */

// The resolver keeps strict mode so that a malformed value is rejected at the boundary.
export const resolverMode = 'strict';

// The guard rejects non-positive values; see phase 88 for the design record.
export function guard(value: number): boolean {
  return value > 0;
}

/**
 * Runs the example with its default arguments.
 */
export function run(): void {}

// An em dash — written as the character itself — is fine inside a comment.
export const escaped = true;
