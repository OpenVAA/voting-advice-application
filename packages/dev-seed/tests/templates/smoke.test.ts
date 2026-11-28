/**
 * `smoke` template shape tests.
 *
 * The template exists so that an anonymous read of more than 1000 rows can be observed whole on a hosted project, and it is seeded there with the service-role key. These cases hold the properties that make that safe and useful: the row counts, the external id prefix teardown filters on, and the absence of any auth or storage-configuration row.
 *
 * contract: pure I/O. The template is run through the pipeline in memory; no Supabase client is created.
 */

import { describe, expect, it } from 'vitest';
import { runPipeline } from '../../src/pipeline';
import { validateTemplate } from '../../src/template/schema';
import { BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES } from '../../src/templates';
import { smokeTemplate } from '../../src/templates/smoke';

const CANONICAL_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const PREFIX = 'smoke_';

/** The public tables a template may describe; every emitted row must belong to one of them. */
const TEMPLATE_PUBLIC_TABLES = [
  'elections',
  'constituency_groups',
  'constituencies',
  'organizations',
  'alliances',
  'factions',
  'candidates',
  'question_categories',
  'questions',
  'nominations',
  'app_settings',
  'feedback'
];

function emit(): Record<string, Array<Record<string, unknown>>> {
  return runPipeline(smokeTemplate, BUILT_IN_OVERRIDES.smoke ?? {});
}

function nonEmptyTables(output: Record<string, Array<Record<string, unknown>>>): Array<string> {
  return Object.entries(output)
    .filter(([, rows]) => rows.length > 0)
    .map(([table]) => table);
}

describe('smoke template', () => {
  it('is registered as the built-in `smoke` with no overrides', () => {
    expect(BUILT_IN_TEMPLATES.smoke).toBe(smokeTemplate);
    expect(BUILT_IN_OVERRIDES.smoke).toBeUndefined();
  });

  it('passes validateTemplate without throwing', () => {
    expect(() => validateTemplate(smokeTemplate)).not.toThrow();
  });

  it('emits at least 1001 candidates and 1001 nominations, every row in the canonical project', () => {
    const output = emit();
    expect(output.candidates.length).toBeGreaterThanOrEqual(1001);
    expect(output.nominations.length).toBeGreaterThanOrEqual(1001);
    for (const table of nonEmptyTables(output)) {
      for (const row of output[table]) {
        expect(row.project_id, `${table} ${String(row.external_id)}`).toBe(CANONICAL_PROJECT_ID);
      }
    }
  });

  it('prefixes every emitted external id with `smoke_`', () => {
    const output = emit();
    const offenders: Array<string> = [];
    let checked = 0;
    for (const table of nonEmptyTables(output)) {
      for (const row of output[table]) {
        checked++;
        if (typeof row.external_id !== 'string' || !row.external_id.startsWith(PREFIX)) {
          offenders.push(`${table}: ${String(row.external_id)}`);
        }
      }
    }
    expect(checked).toBeGreaterThan(2002);
    expect(offenders).toEqual([]);
  });

  it('emits only template public tables: no auth, account, project or storage_config row', () => {
    const output = emit();
    const tables = nonEmptyTables(output);
    for (const table of tables) {
      expect(TEMPLATE_PUBLIC_TABLES).toContain(table);
    }
    expect(tables).not.toContain('accounts');
    expect(tables).not.toContain('projects');
    expect(tables).not.toContain('storage_config');
    expect(tables.some((table) => table.startsWith('auth'))).toBe(false);
  });

  it('leaves project openness and the project id to the bootstrap', () => {
    expect(smokeTemplate.externalIdPrefix).toBe(PREFIX);
    expect('openForVoters' in smokeTemplate).toBe(false);
    expect('projectId' in smokeTemplate).toBe(false);
  });
});
