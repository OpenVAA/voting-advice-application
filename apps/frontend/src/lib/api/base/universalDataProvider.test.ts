/**
 * `UniversalDataProvider` hands on the colour of an election or an entity only after the colour reader has parsed it and adjusted it for contrast.
 */

import { describe, expect, test, vi } from 'vitest';
import { ensureColors } from '$lib/utils/color/ensureColors';
import { UniversalDataProvider } from './universalDataProvider';
import type { AnyEntityVariantData, ElectionData } from '@openvaa/data';
import type { DPDataType } from './dataTypes';

/** What a handed-on colour member is: a hex colour, or the empty string when the stored value was not a colour. */
const HEX_COLOR_OR_EMPTY = /^(#[0-9a-f]{6})?$/;

/** A stored colour that is a hex colour followed by further CSS. */
const STORED_CSS = '#ff0000; background: url(x)';

/** A stored colour with too little contrast on the light background, which the colour reader therefore changes. */
const LOW_CONTRAST = '#ffffff';

/**
 * A provider whose backend returns the rows it was constructed with.
 */
class TestProvider extends UniversalDataProvider {
  constructor(private readonly stored: { elections?: Array<ElectionData>; entities?: Array<AnyEntityVariantData> }) {
    super({ fetch: vi.fn<typeof fetch>() });
  }

  protected _getAppSettings(): Promise<DPDataType['appSettings']> {
    return Promise.resolve({});
  }
  protected _getAppCustomization(): Promise<DPDataType['appCustomization']> {
    return Promise.resolve({});
  }
  protected _getElectionData(): Promise<DPDataType['elections']> {
    return Promise.resolve(this.stored.elections ?? []);
  }
  protected _getConstituencyData(): Promise<DPDataType['constituencies']> {
    return Promise.resolve({ groups: [], constituencies: [] });
  }
  protected _getNominationData(): Promise<DPDataType['nominations']> {
    return Promise.resolve({ nominations: [], entities: [] });
  }
  protected _getEntityData(): Promise<DPDataType['entities']> {
    return Promise.resolve(this.stored.entities ?? []);
  }
  protected _getQuestionData(): Promise<DPDataType['questions']> {
    return Promise.resolve({ categories: [], questions: [] });
  }
}

/**
 * A stored election row.
 * @param color - The row's stored colour, or nothing for a row that stores none.
 */
function storedElection(color?: ElectionData['color']): ElectionData {
  return {
    id: 'election-1',
    name: 'Election',
    constituencyGroupIds: [],
    ...(color === undefined ? {} : { color })
  } as ElectionData;
}

/**
 * A stored organization row.
 * @param color - The row's stored colour.
 */
function storedEntity(color: AnyEntityVariantData['color']): AnyEntityVariantData {
  return { type: 'organization', id: 'organization-1', name: 'Organization', color } as AnyEntityVariantData;
}

describe('UniversalDataProvider.getElectionData', () => {
  test('an election whose stored colour is a hex colour followed by CSS is handed on with no colour and none of the stored text', async () => {
    const provider = new TestProvider({ elections: [storedElection({ normal: STORED_CSS, dark: STORED_CSS })] });

    const [election] = await provider.getElectionData();

    expect(election.color).toEqual({ normal: '', dark: '' });
    expect(JSON.stringify(election)).not.toContain('background');
  });

  test('an unparsable normal colour beside a good dark one loses the normal colour only', async () => {
    const provider = new TestProvider({ elections: [storedElection({ normal: STORED_CSS, dark: '#ffffff' })] });

    const [election] = await provider.getElectionData();

    expect(election.color).toEqual({ normal: '', dark: '#ffffff' });
  });

  test('a valid election colour is handed on adjusted for contrast, as the same colour of an entity is', async () => {
    const provider = new TestProvider({
      elections: [storedElection({ normal: LOW_CONTRAST })],
      entities: [storedEntity({ normal: LOW_CONTRAST })]
    });

    const [election] = await provider.getElectionData();
    const [entity] = await provider.getEntityData();

    expect(election.color).toEqual(ensureColors({ normal: LOW_CONTRAST }));
    expect(election.color).toEqual(entity.color);
    expect(election.color?.normal).not.toBe(LOW_CONTRAST);
    expect(election.color?.normal).toMatch(HEX_COLOR_OR_EMPTY);
    expect(election.color?.dark).toMatch(HEX_COLOR_OR_EMPTY);
    expect(election.color?.normal).not.toBe('');
    expect(election.color?.dark).not.toBe('');
  });

  test('an election that stores no colour is handed on as it is, with no colour member added', async () => {
    const stored = storedElection();
    const provider = new TestProvider({ elections: [stored] });

    const [election] = await provider.getElectionData();

    expect(election).toBe(stored);
    expect('color' in election).toBe(false);
  });

  test('the other members of an election are handed on unchanged', async () => {
    const stored = { ...storedElection({ normal: '#000000' }), shortName: 'E', date: '2026-01-01' } as ElectionData;
    const provider = new TestProvider({ elections: [stored] });

    const [election] = await provider.getElectionData();

    expect(election).toEqual({ ...stored, color: ensureColors({ normal: '#000000' }) });
  });
});
