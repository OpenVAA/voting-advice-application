import { configureLogger } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseWithPartialPreserve } from './parseOutcome';
import type { LogRecord } from '@openvaa/app-shared';

/**
 * Specification for the adapter's parse outcome — criterion 1, decisions **B1(a)**, **A2** (and its NOTE), **C5(b)**, and the phase requirement **D8**.
 *
 * Every JSONB read at this boundary currently degrades to an empty literal when validation fails, which makes a MALFORMED column and an ABSENT column the same VALUE at every call site. This file specifies the type that ends that: three statuses, `ok` / `absent` / `malformed`, distinguishable without any narrowing helper, so a consumer that does nothing special still sees two different `status` literals. The last case in this file is criterion 1 stated as an assertion — malformed and absent are not equal by value — and it is the one that would go red if a future edit collapsed them again.
 *
 * The four zod-issue cases pin the A2 closure against a zod upgrade. `157.1-RESEARCH.md` § "The A2 hole" measured them against **zod 4.3.6**: an unknown TOP-LEVEL key reports `code: 'unrecognized_keys'` with `path: []` and the offending name on `issue.keys`, while a nested or mistyped member reports the containing object on `path`. The shipped defect is exactly that asymmetry — `String(issue.path[0])` on a top-level issue is the literal string `"undefined"`, no key is dropped, the retry fails identically and the whole column is discarded (fact 3). A zod release that moved the key names off `issues[].keys` would silently reopen the hole with every existing test still green, which is why all four shapes are asserted here rather than only the one the fix reads.
 *
 * The record assertions carry a hard rule from **T-157-17**: issue paths and rejected key NAMES may be logged; the offending VALUE never may. `custom_data` and `answers` blobs are author-supplied content, and copying one into a log record moves it into a sink that was never in scope for it. The `rejectedKeys` field this phase adds is the one new field that reads FROM the offending object, so it gets its own sentinel assertion.
 *
 * FILLED by `157.1-03` (wave 2). The wave-0 scaffold declared every case with vitest's `todo` modifier and stood the module's surface up as a local type shim, because `./parseOutcome` did not exist. Both are gone: the shim is replaced by a real import of the real module, and every case is live. The capture harness below is unchanged from `157.1-01`, copied verbatim from `parseJsonbColumn.test.ts:1-17` — including the `'warn'` threshold, which per research correction **C-4** needs no edit for the C5(b) level promotion, since `error` sits above it.
 */

/**
 * A strict schema mirroring `StoredSettingsSchema`'s shape — a strict object holding a nested strict object.
 * This is the shape research executed the four measured zod-issue cases against; the fixtures below name their keys. It is declared LOCALLY rather than imported from `packages/app-shared`: decision **E3(a)** forbids widening any production schema in this phase, and a spec that imported one would go red for the wrong reason if a later phase widened it. This file pins the helper's behaviour, not a schema's current strictness.
 */
const ProbeSchema = z.strictObject({
  publisherName: z.record(z.string(), z.string()).optional(),
  access: z
    .strictObject({
      candidateApp: z.boolean(),
      underMaintenance: z.boolean()
    })
    .optional()
});

type Probe = z.infer<typeof ProbeSchema>;

const source = { column: 'app_settings.settings', id: 's1' } as const;

let records: Array<LogRecord>;

beforeEach(() => {
  records = [];
  configureLogger({ level: 'warn', sink: (record) => records.push(record) });
});

afterEach(() => {
  configureLogger({ level: 'silent', sink: undefined });
});

describe('parseWithPartialPreserve — the three statuses', () => {
  it('yields the `absent` status and emits no record for a nullish value', () => {
    expect(parseWithPartialPreserve<Probe>(ProbeSchema, null, source)).toEqual({ status: 'absent' });
    expect(parseWithPartialPreserve<Probe>(ProbeSchema, undefined, source)).toEqual({ status: 'absent' });
    expect(records).toHaveLength(0);
  });

  it('yields `ok` with the validated value for a fully valid stored value, and emits no record', () => {
    const stored = { publisherName: { en: 'X' }, access: { candidateApp: true, underMaintenance: false } };

    expect(parseWithPartialPreserve<Probe>(ProbeSchema, stored, source)).toEqual({ status: 'ok', value: stored });
    expect(records).toHaveLength(0);
  });
});

describe('the four measured zod-issue shapes (zod 4.3.6 — pins the A2 closure against an upgrade)', () => {
  // Shape 1. `code: 'unrecognized_keys'`, `path: []`, `keys: ['bogusTop']`. THE HOLE: the key names itself on `keys`, not on `path`, so `String(issue.path[0])` reads the literal string "undefined" and drops nothing.
  it('preserves the valid member when an unknown top-level key is present', () => {
    const outcome = parseWithPartialPreserve<Probe>(ProbeSchema, { publisherName: { en: 'X' }, bogusTop: 1 }, source);

    expect(outcome.status).toBe('malformed');
    expect(outcome.value).toEqual({ publisherName: { en: 'X' } });
    expect(outcome.issues).toEqual([{ path: '', keys: ['bogusTop'] }]);
  });

  // Shape 2. `code: 'unrecognized_keys'`, `path: ['access']` — the containing object, which the shipped `issue.path[0]` read already handles. Asserted anyway so the closure cannot regress into reading ONLY `keys`.
  it('drops the containing member when an unknown key sits at a nested path', () => {
    const outcome = parseWithPartialPreserve<Probe>(
      ProbeSchema,
      { publisherName: { en: 'X' }, access: { candidateApp: true, underMaintenance: false, bogusNested: 1 } },
      source
    );

    expect(outcome.status).toBe('malformed');
    expect(outcome.value).toEqual({ publisherName: { en: 'X' } });
    expect(outcome.issues).toEqual([{ path: 'access', keys: ['bogusNested'] }]);
  });

  // Shape 3. `code: 'invalid_type'`, `path: ['access','candidateApp']` — no `keys` member at all.
  it('drops the containing member when a nested member has the wrong type', () => {
    const outcome = parseWithPartialPreserve<Probe>(
      ProbeSchema,
      { publisherName: { en: 'X' }, access: { candidateApp: 'yes', underMaintenance: false } },
      source
    );

    expect(outcome.status).toBe('malformed');
    expect(outcome.value).toEqual({ publisherName: { en: 'X' } });
    expect(outcome.issues).toEqual([{ path: 'access.candidateApp' }]);
  });

  // Shape 4. Both at once: zod reports TWO issues, the nested one at `path: ['access']` and the top-level one at `path: []`. `keys` is an ARRAY because zod batches every unrecognised key of one object into one issue, so a `keys[0]` read would leave a second unknown key in place — which is why the closure loops. The record assertion is the "one record per failing parse, not one per issue" rule: two issues, one record.
  it('handles a nested and a top-level unrecognized_keys issue reported together', () => {
    const outcome = parseWithPartialPreserve<Probe>(
      ProbeSchema,
      {
        publisherName: { en: 'X' },
        bogusTop: 1,
        alsoBogusTop: 2,
        access: { candidateApp: true, underMaintenance: false, bogusNested: 1 }
      },
      source
    );

    expect(outcome.status).toBe('malformed');
    expect(outcome.value).toEqual({ publisherName: { en: 'X' } });
    expect(outcome.issues).toHaveLength(2);
    expect(outcome.issues?.flatMap((issue) => issue.keys ?? []).sort()).toEqual([
      'alsoBogusTop',
      'bogusNested',
      'bogusTop'
    ]);
    expect(records).toHaveLength(1);
  });
});

describe('the malformed outcome, and what its record may carry', () => {
  // The structural precondition already at `supabaseDataProvider.ts:86`: a non-object has no members to preserve, so there is no survivor. It is STILL not `absent` — that distinction is criterion 1.
  it('yields `malformed` with no survivor for a non-object value, and it is not `absent`', () => {
    const outcome = parseWithPartialPreserve<Probe>(ProbeSchema, 'not an object', source);

    expect(outcome.status).toBe('malformed');
    expect(outcome.value).toBeUndefined();
    // Present-but-undefined, not missing: `value` is declared on the malformed arm so a consumer reads it without narrowing, and the survivor's absence is a value rather than a shape difference.
    expect('value' in outcome).toBe(true);
    expect(outcome).not.toEqual(parseWithPartialPreserve<Probe>(ProbeSchema, null, source));
  });

  // A REQUIRED member with the wrong type: dropping it makes the retry fail too, so the arm is `malformed` with no survivor — still distinguishable from `absent`. `ProbeSchema` cannot express this, because every one of its top-level members is optional and the retry on `{}` would succeed; the case therefore needs a schema that has something to miss.
  it('yields `malformed` with no survivor when dropping the rejected member leaves the retry failing', () => {
    const RequiredProbeSchema = z.strictObject({ slug: z.string() });
    const outcome = parseWithPartialPreserve<z.infer<typeof RequiredProbeSchema>>(
      RequiredProbeSchema,
      { slug: 42 },
      source
    );

    expect(outcome.status).toBe('malformed');
    expect(outcome.value).toBeUndefined();
    expect(records).toHaveLength(1);
    expect(records[0].attributes?.preserved).toBe(false);
  });

  // T-157-06 generalised: one malformed row must not fail the read that contains it, so no input may produce a throw.
  it('never throws, whatever the stored value is', () => {
    for (const raw of [null, undefined, 'x', 42, true, [], [1, 2], {}, { publisherName: 'not an object' }, NaN]) {
      expect(() => parseWithPartialPreserve<Probe>(ProbeSchema, raw, source)).not.toThrow();
    }
  });

  // T-157-17. Paths and rejected key NAMES are loggable; the offending VALUE is not. The `rejectedKeys` field is the one field this phase adds that reads from the offending object, hence its own sentinel assertion.
  it('carries the issue paths and the rejected key names, and never the offending value', () => {
    parseWithPartialPreserve<Probe>(ProbeSchema, { publisherName: { en: 'X' }, secretKey: 'do-not-log-me' }, source);

    expect(records).toHaveLength(1);
    expect(records[0].severityText).toBe('ERROR');
    expect(records[0].attributes?.issues).toEqual(['']);
    expect(records[0].attributes?.rejectedKeys).toEqual(['secretKey']);
    expect(JSON.stringify(records[0])).toContain('secretKey');
    expect(JSON.stringify(records[0])).not.toContain('do-not-log-me');
  });

  // CRITERION 1, stated as an assertion. A degrade-to-empty made these two the same VALUE at every call site; this is the case that goes red if a future edit collapses them again.
  it('makes a malformed outcome unequal by value to an absent one', () => {
    const malformed = parseWithPartialPreserve<Probe>(ProbeSchema, { bogusTop: 1 }, source);
    const absent = parseWithPartialPreserve<Probe>(ProbeSchema, null, source);

    expect(malformed.status).not.toBe(absent.status);
    expect(malformed).not.toEqual(absent);
  });
});
