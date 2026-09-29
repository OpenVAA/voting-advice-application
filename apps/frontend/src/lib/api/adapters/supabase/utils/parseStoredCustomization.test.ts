import { configureLogger } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CUSTOMIZATION_PARSE_FAILURE_MESSAGE } from './parseFailureMessages';
import { parseStoredCustomization } from './parseStoredCustomization';
import type { LogRecord } from '@openvaa/app-shared';

const SECRET = 'value-that-must-not-be-logged';

let records: Array<LogRecord>;

beforeEach(() => {
  records = [];
  configureLogger({ level: 'warn', sink: (record) => records.push(record) });
});

afterEach(() => {
  configureLogger({ level: 'silent', sink: undefined });
});

describe('parseStoredCustomization', () => {
  it('returns the empty customization and emits no record for an absent value', () => {
    expect(parseStoredCustomization(undefined)).toEqual({});
    expect(parseStoredCustomization(null)).toEqual({});
    expect(records).toHaveLength(0);
  });

  it('returns a valid customization as parsed', () => {
    const stored = {
      publisherName: { en: 'Publisher' },
      poster: { path: 'proj/poster.jpg' },
      candidateAppFAQ: [{ question: { en: 'Q' }, answer: { en: 'A' } }]
    };

    expect(parseStoredCustomization(stored)).toEqual(stored);
    expect(records).toHaveLength(0);
  });

  it('keeps the valid member, drops the malformed one and reports without the raw value', () => {
    const result = parseStoredCustomization({
      publisherName: { en: 'Publisher' },
      candidateAppFAQ: [{ question: { en: SECRET } }]
    });

    expect(result).toEqual({ publisherName: { en: 'Publisher' } });
    expect(records).toHaveLength(1);
    expect(records[0].msg).toBe(CUSTOMIZATION_PARSE_FAILURE_MESSAGE);
    expect(records[0].severityText).toBe('ERROR');
    expect(records[0].attributes?.column).toBe('app_settings.customization');
    expect(records[0].attributes?.issues).toEqual(['candidateAppFAQ.0.answer']);
    expect(records[0].attributes?.preserved).toBe(true);
    expect(JSON.stringify(records[0])).not.toContain(SECRET);
  });

  it('falls back to the empty customization when nothing can be preserved', () => {
    expect(parseStoredCustomization('not an object')).toEqual({});
    expect(records).toHaveLength(1);
    expect(records[0].attributes?.preserved).toBe(false);
  });
});
