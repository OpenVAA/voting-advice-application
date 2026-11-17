/**
 * The standing census of nomination shapes over the built-in templates.
 *
 * Every registered template is run through the pipeline, and every nomination row it emits is classified against the type of the election it names. The expected number of rows an election's type refuses is zero, so a template that seeds such a row fails here by name rather than at its own import.
 *
 * ## It iterates the registry, never a list of names
 *
 * `BUILT_IN_TEMPLATES` is walked with `Object.keys`, so a template registered later is covered without this file being touched. A floor on the number of templates and a floor on the number of nominations keep an empty registry, or a pipeline that stopped emitting, from passing.
 *
 * ## The classifier is a statement of its own
 *
 * `EXPECTED` writes out what each election type does with a nomination of each entity type. It imports nothing from the application or from the schema files; only the two enums come from the generated database types, so that a member added to either is a compile error here until the matrix names it.
 *
 * ## What a failure reports
 *
 * Template name, collection, the row's `external_id` and the offence.
 */

import { Constants } from '@openvaa/supabase-types';
import { describe, expect, it } from 'vitest';
import { runPipeline } from '../src/pipeline';
import { BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES } from '../src/templates';
import type { Enums } from '@openvaa/supabase-types';

type Row = Record<string, unknown>;
type Data = Record<string, Array<Row>>;
type EntityType = Enums<'entity_type'>;
type Shape = Enums<'nomination_shape'>;

/**
 * What an election's type does with a nomination: `admitted` with or without a parent, `parentRequired` when the row is admitted only with a parent nomination or a requested parent organization, `refused` whatever the row holds.
 */
type Outcome = 'admitted' | 'parentRequired' | 'refused';

const ENTITY_TYPES: ReadonlyArray<EntityType> = Constants.public.Enums.entity_type;
const SHAPES: ReadonlyArray<string> = Constants.public.Enums.nomination_shape;

/** The key of `custom_data` under which a nomination names a parent organization that has no row yet. */
const REQUESTED_PARENT_KEY = 'requestedParentOrganization';

/** The expected outcome for each of the four entity types, in each of the four election types. */
const EXPECTED: Record<Shape, Record<EntityType, Outcome>> = {
  organization_list: {
    candidate: 'parentRequired',
    organization: 'admitted',
    faction: 'admitted',
    alliance: 'admitted'
  },
  organization_list_and_independents: {
    candidate: 'admitted',
    organization: 'admitted',
    faction: 'admitted',
    alliance: 'admitted'
  },
  candidate_only: {
    candidate: 'admitted',
    organization: 'refused',
    faction: 'refused',
    alliance: 'refused'
  },
  organization_only: {
    candidate: 'refused',
    organization: 'admitted',
    faction: 'refused',
    alliance: 'admitted'
  }
};

/** The `external_id` a row gives under a reference key such as `election`, when it gives one. */
function refOf(row: Row, key: string): string | undefined {
  const ref = row[key];
  if (ref === null || typeof ref !== 'object') return undefined;
  const externalId = (ref as Row).external_id;
  return typeof externalId === 'string' && externalId.length > 0 ? externalId : undefined;
}

/** Whether a row names something under `key`, as a reference or as the id column itself. */
function names(row: Row, key: string): boolean {
  const id = row[`${key}_id`];
  return refOf(row, key) !== undefined || (typeof id === 'string' && id.length > 0);
}

/** Whether a nomination row satisfies a required parent. */
function hasParentOrRequestsOne(row: Row): boolean {
  if (names(row, 'parent_nomination')) return true;
  const customData = row.custom_data;
  return customData !== null && typeof customData === 'object' && Object.hasOwn(customData, REQUESTED_PARENT_KEY);
}

function isShape(value: unknown): value is Shape {
  return typeof value === 'string' && SHAPES.includes(value);
}

/** One line per offence, carrying the template, the collection, the row's `external_id` and the offence. */
function describeOffence(templateName: string, collection: string, row: Row, index: number, offence: string): string {
  const externalId = String(row.external_id ?? `<none> — index ${index}`);
  return `template='${templateName}' collection='${collection}' external_id='${externalId}' :: ${offence}`;
}

/** Every election row of a dataset that states no type the generated enum knows. */
function untypedElections(templateName: string, data: Data): Array<string> {
  const offences: Array<string> = [];
  for (const [index, election] of (data.elections ?? []).entries()) {
    if (!isShape(election.election_type)) {
      offences.push(
        describeOffence(
          templateName,
          'elections',
          election,
          index,
          `election_type ${JSON.stringify(election.election_type)} is not one of ${SHAPES.join(', ')}`
        )
      );
    }
  }
  return offences;
}

/** Every nomination row of a dataset that the type of its election refuses, or that cannot be classified. */
function refusedNominations(templateName: string, data: Data): Array<string> {
  const shapeByElection = new Map<string, unknown>();
  for (const election of data.elections ?? []) {
    if (typeof election.external_id === 'string') shapeByElection.set(election.external_id, election.election_type);
  }

  const offences: Array<string> = [];
  for (const [index, row] of (data.nominations ?? []).entries()) {
    function report(offence: string): void {
      offences.push(describeOffence(templateName, 'nominations', row, index, offence));
    }

    const nominated = ENTITY_TYPES.filter((type) => names(row, type));
    if (nominated.length !== 1) {
      report(`names ${nominated.length} entities; a nomination names exactly one`);
      continue;
    }
    const entityType = nominated[0];

    const electionRef = refOf(row, 'election');
    if (electionRef === undefined || !shapeByElection.has(electionRef)) {
      report(`its election ${JSON.stringify(electionRef)} is not among the elections the template emits`);
      continue;
    }
    const shape = shapeByElection.get(electionRef);
    if (!isShape(shape)) {
      report(`its election '${electionRef}' states no known type`);
      continue;
    }

    const outcome = EXPECTED[shape][entityType];
    if (outcome === 'refused') {
      report(`a ${entityType} is not nominable in a ${shape} election ('${electionRef}')`);
    } else if (outcome === 'parentRequired' && !hasParentOrRequestsOne(row)) {
      report(
        `a ${entityType} in a ${shape} election ('${electionRef}') has no parent nomination and no ${REQUESTED_PARENT_KEY} key`
      );
    }
  }
  return offences;
}

const TEMPLATE_NAMES = Object.keys(BUILT_IN_TEMPLATES);

/** Pipeline output per built-in, computed once and shared by the cases below. */
const EMITTED: Array<{ name: string; data: Data }> = TEMPLATE_NAMES.map((name) => ({
  name,
  data: runPipeline(BUILT_IN_TEMPLATES[name], BUILT_IN_OVERRIDES[name] ?? {})
}));

describe('nomination-shape census — every nomination every built-in template emits', () => {
  it('iterates the registry and covers at least 30 built-ins', () => {
    // A floor, not an equality: registering another template must not turn this red, and a registry that shrank to nothing must not let the zero-offence cases pass.
    expect(TEMPLATE_NAMES.length).toBeGreaterThanOrEqual(30);
    expect(EMITTED).toHaveLength(TEMPLATE_NAMES.length);
  });

  it('classifies a substantial corpus of elections and nominations', () => {
    function count(collection: string): number {
      return EMITTED.reduce((sum, { data }) => sum + (data[collection]?.length ?? 0), 0);
    }
    expect(count('elections')).toBeGreaterThanOrEqual(TEMPLATE_NAMES.length);
    expect(count('nominations')).toBeGreaterThanOrEqual(500);
  });

  it('every election row states a type the generated enum knows', () => {
    const offences: Array<string> = [];
    for (const { name, data } of EMITTED) offences.push(...untypedElections(name, data));
    expect(offences).toEqual([]);
  });

  it('no built-in template emits a nomination that the type of its election refuses', () => {
    const offences: Array<string> = [];
    for (const { name, data } of EMITTED) offences.push(...refusedNominations(name, data));
    // Compared as an array of lines so a failure prints the template, the collection, the external_id and the offence rather than a count.
    expect(offences).toEqual([]);
  });

  it('the classifier refuses planted rows, one for each way a row can be refused', () => {
    function election(shape: string): Row {
      return { external_id: `el-${shape}`, election_type: shape };
    }
    function nomination(externalId: string, entityType: EntityType, shape: string, extra: Row = {}): Row {
      return {
        external_id: externalId,
        [entityType]: { external_id: `${entityType}-1` },
        election: { external_id: `el-${shape}` },
        ...extra
      };
    }
    const planted: Data = {
      elections: SHAPES.map(election),
      nominations: [
        nomination('list-candidate-alone', 'candidate', 'organization_list'),
        nomination('list-candidate-with-parent', 'candidate', 'organization_list', {
          parent_nomination: { external_id: 'parent' }
        }),
        nomination('list-candidate-requesting-parent', 'candidate', 'organization_list', {
          custom_data: { [REQUESTED_PARENT_KEY]: 'A party with no row' }
        }),
        nomination('independents-candidate-alone', 'candidate', 'organization_list_and_independents'),
        nomination('organizations-only-candidate', 'candidate', 'organization_only'),
        nomination('organizations-only-faction', 'faction', 'organization_only'),
        nomination('organizations-only-alliance', 'alliance', 'organization_only'),
        nomination('candidates-only-candidate', 'candidate', 'candidate_only'),
        nomination('candidates-only-organization', 'organization', 'candidate_only'),
        nomination('candidates-only-alliance', 'alliance', 'candidate_only'),
        nomination('candidates-only-faction', 'faction', 'candidate_only'),
        { external_id: 'names-nobody', election: { external_id: 'el-organization_list' } },
        nomination('unknown-election', 'candidate', 'no-such-type')
      ]
    };
    planted.elections.push({ external_id: 'el-untyped' });

    const refused = refusedNominations('planted', planted).map((line) => /external_id='([^']+)'/.exec(line)?.[1]);
    expect(refused).toEqual([
      'list-candidate-alone',
      'organizations-only-candidate',
      'organizations-only-faction',
      'candidates-only-organization',
      'candidates-only-alliance',
      'candidates-only-faction',
      'names-nobody',
      'unknown-election'
    ]);
    expect(untypedElections('planted', planted)).toHaveLength(1);
  });
});
