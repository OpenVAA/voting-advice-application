/**
 * Self-test fixture for hygiene-changed-files.sh. Every comment below is deliberately dirty, and each layer of the gate must report at least one hit here.
 */

// The resolver follows D-21, recorded in `.planning/phases/162-example/162-08-PLAN.md` and in plan 162-08.
export const resolverMode = 'strict';

// Phase 88 introduced this guard, whose original shape is no longer here.
export function guard(value: number): boolean {
  return value > 0;
}

/**
 * Collapsed example.
 *   run(); // 1. Set up const x = 1;
 * Usage: keygen --kid <id> \ [--alg <name>]
 */
export function run(): void {}

// A literal source escape \u2014 inside a comment trips the repo lint rule.
export const escaped = true;
