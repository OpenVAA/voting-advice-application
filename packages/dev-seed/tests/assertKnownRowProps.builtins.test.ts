/**
 * The standing must-NOT-fire control for Pass 0.
 *
 * ## Why this file exists, and why it is a spec rather than a one-off survey
 *
 * Every E2E setup project seeds through `setupFromTemplate` → `Writer.write` → Pass 0. **One false positive in the guard fails every `perm-*` setup project at once**, and CLAUDE.md's E2E Hard Rule then blocks all further work. The false-positive budget is therefore **zero**, and a number measured once in a document decays the moment a template is edited. This spec re-measures it on every `yarn test:unit`.
 *
 * ## It iterates the REGISTRY, never a list of names
 *
 * `BUILT_IN_TEMPLATES` is walked with `Object.keys`. A template registered later is covered without this file being touched. A floor assertion guards the other direction: an empty or truncated registry cannot make the control pass vacuously.
 *
 * ## The four facts a failure reports
 *
 * Template name, collection, the row's `external_id`, and the offending key — so a future red is diagnosable from the failure output alone, without re-running a scratch script.
 *
 * ## ⚠ THE REPOINT
 *
 * This file predates `assertKnownRowProps`, so the classification was first measured against `permittedKeys` directly. The single `CLASSIFY` binding below now names the shipped guard, which is what `Writer.write()` actually runs.
 *
 * The pre-guard classifier is **kept**, not deleted, because the two answer different questions: the guard throws on the first offence and so cannot enumerate, while the classifier enumerates but is a re-implementation of the guard's rules. The last case runs BOTH and requires both to be empty, so neither a guard that quietly stopped checking nor a classifier that drifted away from it can carry this control on its own.
 */

import { describe, expect, it } from 'vitest';
import { assertKnownRowProps } from '../src/assertKnownRowProps';
import { fanOutLocales } from '../src/locales';
import { runPipeline } from '../src/pipeline';
import { resolveCollectionName } from '../src/template/collectionNames';
import { permittedKeys } from '../src/template/permittedKeys';
import { BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES } from '../src/templates';

type Data = Record<string, Array<Record<string, unknown>>>;

/**
 * The one honest deny entry, on exactly the three tables that declare the column. Held locally here; `deniedKeys` in `permittedKeys.ts` is the shipped form, and the repoint below routes this spec through it.
 */
const DENIED_AT_TASK_1: Record<string, ReadonlyArray<string>> = {
  nominations: ['entity_type'],
  question_categories: ['entity_type'],
  questions: ['entity_type']
};

/** One human-readable line per offence, carrying all four diagnostic facts. */
function describeOffense(
  templateName: string,
  collection: string,
  row: Record<string, unknown>,
  index: number,
  key: string,
  kind: string
): string {
  const externalId = String(row.external_id ?? row.externalId ?? `<none> — index ${index}`);
  return `[${kind}] template='${templateName}' collection='${collection}' external_id='${externalId}' key='${key}'`;
}

/**
 * Pre-guard classifier — the same composition, consulted through `permittedKeys` itself rather than reconstructed, so this spec cannot drift from the declaration it is measuring.
 */
function classifyWithPermittedKeys(templateName: string, data: Data): Array<string> {
  const offenses: Array<string> = [];
  for (const [collection, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const table = resolveCollectionName(collection);
    const denied = new Set(DENIED_AT_TASK_1[table] ?? []);
    let permitted: ReadonlySet<string>;
    try {
      permitted = permittedKeys(collection);
    } catch (error) {
      offenses.push(
        `[unmodelled-collection] template='${templateName}' collection='${collection}' ` +
          `external_id='<n/a>' key='<whole collection>' :: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }
    for (const [index, row] of rows.entries()) {
      for (const key of Object.keys(row)) {
        if (denied.has(key)) {
          offenses.push(describeOffense(templateName, collection, row, index, key, 'denied'));
        } else if (!permitted.has(key)) {
          offenses.push(describeOffense(templateName, collection, row, index, key, 'unknown'));
        }
      }
    }
  }
  return offenses;
}

/**
 * Guard-backed classifier — calls the SHIPPED `assertKnownRowProps`, the same function `Writer.write()` invokes as Pass 0.
 *
 * The guard throws on the FIRST offence by design, so this returns at most one entry per template. That is the right trade here: the assertion this spec makes is "zero", and a corpus that has any offence at all has already failed.
 */
function classifyWithAssertKnownRowProps(templateName: string, data: Data): Array<string> {
  try {
    assertKnownRowProps(data);
  } catch (error) {
    return [`[guard] template='${templateName}' :: ${error instanceof Error ? error.message : String(error)}`];
  }
  return [];
}

/**
 * ⚠ **THE REPOINT — one line, and this is it.** This was bound to `classifyWithPermittedKeys` before `assertKnownRowProps` existed. It now names the shipped guard, so this spec measures the thing that actually runs in `Writer.write()` rather than a re-implementation of its rules. The pre-guard classifier is retained directly above as the second, independent witness used by the case that runs both.
 */
const CLASSIFY: (templateName: string, data: Data) => Array<string> = classifyWithAssertKnownRowProps;

const TEMPLATE_NAMES = Object.keys(BUILT_IN_TEMPLATES);

/** Pipeline output per built-in, computed once and shared by the cases below. */
const EMITTED: Array<{ name: string; data: Data }> = TEMPLATE_NAMES.map((name) => {
  const template = BUILT_IN_TEMPLATES[name];
  const rows = runPipeline(template, BUILT_IN_OVERRIDES[name] ?? {});
  return { name, data: fanOutLocales(rows, template, template.seed ?? 42) };
});

describe('Pass 0 must-NOT-fire control — every row every built-in emits (row NC)', () => {
  it('iterates the registry and covers at least the 30 built-ins registered today', () => {
    // A floor, not an equality: registering a 31st template must not turn this spec red, but a registry that shrank to nothing must not let the zero-offence case below pass vacuously.
    expect(TEMPLATE_NAMES.length).toBeGreaterThanOrEqual(30);
    expect(EMITTED).toHaveLength(TEMPLATE_NAMES.length);
  });

  it('classifies a substantial row corpus — the control is not green because nothing was looked at', () => {
    const totalRows = EMITTED.reduce(
      (sum, { data }) => sum + Object.values(data).reduce((n, rows) => n + (Array.isArray(rows) ? rows.length : 0), 0),
      0
    );
    // 1,481 rows measured; the floor leaves room for template growth while still failing loudly if the pipeline stopped emitting.
    expect(totalRows).toBeGreaterThanOrEqual(1000);
  });

  it('emits ZERO offending keys across every row of every registered built-in', () => {
    const offenses: Array<string> = [];
    for (const { name, data } of EMITTED) offenses.push(...CLASSIFY(name, data));
    // Compared as an array of strings so a failure PRINTS the template, the collection, the external_id and the key rather than just a count.
    expect(offenses).toEqual([]);
  });

  it('the SHIPPED guard and the pre-guard classifier agree — zero offences under both', () => {
    // The guard throws on the first offence and therefore cannot enumerate; the Task-1 classifier enumerates but is a re-implementation. Running both and requiring both to be empty means neither a guard that silently stopped checking nor a classifier that drifted from it can carry this control alone.
    const fromClassifier: Array<string> = [];
    const fromGuard: Array<string> = [];
    for (const { name, data } of EMITTED) {
      fromClassifier.push(...classifyWithPermittedKeys(name, data));
      fromGuard.push(...classifyWithAssertKnownRowProps(name, data));
    }
    expect(fromClassifier).toEqual([]);
    expect(fromGuard).toEqual([]);
  });
});
