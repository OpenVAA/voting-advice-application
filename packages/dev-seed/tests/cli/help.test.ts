/**
 * help.ts tests (CLI-04 / D-58-13).
 */

import { describe, expect, it } from 'vitest';
import { USAGE } from '../../src/cli/help';

describe('USAGE (CLI-04 / D-58-13)', () => {
  it('documents --template flag', () => {
    expect(USAGE).toMatch(/--template <name-or-path>/);
  });

  it('documents --seed flag', () => {
    expect(USAGE).toContain('--seed');
  });

  it('documents --external-id-prefix flag', () => {
    expect(USAGE).toContain('--external-id-prefix');
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

  it('lists the `e2e` built-in template', () => {
    expect(USAGE).toMatch(/^\s+e2e\s+/m);
  });

  it('points to packages/dev-seed/README.md for custom-template authoring', () => {
    expect(USAGE).toContain('packages/dev-seed/README.md');
  });

  it('documents SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars', () => {
    expect(USAGE).toContain('SUPABASE_URL');
    expect(USAGE).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});
