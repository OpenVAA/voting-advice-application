/**
 * help.ts tests.
 */

import { describe, expect, it } from 'vitest';
import { USAGE } from '../../src/cli/help';

describe('USAGE (CLI-04)', () => {
  it('documents --template flag', () => {
    expect(USAGE).toMatch(/--template <name-or-path>/);
  });

  it('documents --seed flag', () => {
    expect(USAGE).toContain('--seed');
  });

  it('documents --external-id-prefix flag', () => {
    expect(USAGE).toContain('--external-id-prefix');
  });

  /**
   * The line used to end "Teardown filters on this." That is true of the VALUE and false of the FLAG NAME, and the natural reading — carry the same flag over to seed:teardown — was a hard ERR_PARSE_ARGS_UNKNOWN_OPTION whose text named no alternative. The cross-reference must name the flag teardown actually takes, so this pins the half that was ambiguous rather than the whole sentence, which is free to be reworded.
   */
  it('names the flag seed:teardown takes, not just that teardown filters on the value', () => {
    expect(USAGE).toContain('seed:teardown');
    expect(USAGE).toMatch(/seed:teardown, whose flag is --prefix/);
  });

  it('documents --help flag with short form -h', () => {
    expect(USAGE).toMatch(/-h, --help/);
  });

  it('includes a "Built-in templates:" section', () => {
    expect(USAGE).toContain('Built-in templates:');
  });

  it('lists the `default` built-in template', () => {
    expect(USAGE).toMatch(/^\s+default\s+/m);
  });

  it('lists the `e2e/base` built-in template', () => {
    expect(USAGE).toMatch(/^\s+e2e\/base\s+/m);
  });

  it('points to packages/dev-seed/README.md for custom-template authoring', () => {
    expect(USAGE).toContain('packages/dev-seed/README.md');
  });

  it('documents SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars', () => {
    expect(USAGE).toContain('SUPABASE_URL');
    expect(USAGE).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});
