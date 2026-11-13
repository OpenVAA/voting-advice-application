/**
 * The nomination-shape matrix of the data model, read against the database's statement of it.
 *
 * The editor decides which of an entity's nominations a save may remove from `isNominableInShape`, and `public.set_entity_nominations` decides the same from `public.nomination_shape_rule`. A cell that the two state differently makes the editor leave a nomination out of the set that the database then deletes, or name one the database refuses to write. This spec reads the cells of the SQL function from its schema file as text and asserts the data model against every one of them, so a cell changed on one side alone fails here.
 */

import { allowedParentTypes, ENTITY_TYPE, isNominableInShape, NOMINATION_SHAPE } from '@openvaa/data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import type { EntityType, NominationShape } from '@openvaa/data';

const SCHEMA_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../supabase/supabase/schema/011-validation-functions.sql'
);

/** One cell of the SQL function: `WHEN (p_shape, p_entity_type) = ('<shape>', '<type>') THEN '<rule>'`. */
const CELL_RE = /WHEN \(p_shape, p_entity_type\) = \('([a-z_]+)', '([a-z_]+)'\) THEN '([a-z_]+)'/g;

/** The body of `public.nomination_shape_rule`, from its declaration to the end of its dollar-quoted body. */
function shapeRuleBody(source: string): string {
  const start = source.indexOf('CREATE OR REPLACE FUNCTION public.nomination_shape_rule');
  const end = source.indexOf('$$;', start);
  return start < 0 || end < 0 ? '' : source.slice(start, end);
}

const cells = [...shapeRuleBody(fs.readFileSync(SCHEMA_FILE, 'utf8')).matchAll(CELL_RE)].map(
  ([, shape, entityType, rule]) => ({ shape: shape as NominationShape, entityType: entityType as EntityType, rule })
);

const SHAPES = Object.values(NOMINATION_SHAPE);
const ENTITY_TYPES = Object.values(ENTITY_TYPE);

describe('the nomination-shape matrix of the data model and of the database', () => {
  it('reads one cell of the SQL function for every shape and entity type the data model has', () => {
    expect(cells.map(({ shape, entityType }) => `${shape} ${entityType}`).sort()).toEqual(
      SHAPES.flatMap((shape) => ENTITY_TYPES.map((entityType) => `${shape} ${entityType}`)).sort()
    );
  });

  it('reads only the three answers the function documents', () => {
    expect(cells.every(({ rule }) => ['admitted', 'parent_required', 'refused'].includes(rule))).toBe(true);
  });

  it('admits an entity type in an election exactly where the database does', () => {
    const contradicted = cells.filter(
      ({ shape, entityType, rule }) => isNominableInShape(shape, entityType) !== (rule !== 'refused')
    );

    expect(contradicted).toEqual([]);
  });

  it('requires the parent of a candidate or an organization exactly where the database does', () => {
    const contradicted = cells
      .filter(({ entityType }) => entityType === ENTITY_TYPE.Candidate || entityType === ENTITY_TYPE.Organization)
      .filter(
        ({ shape, entityType, rule }) => allowedParentTypes(shape, entityType).required !== (rule === 'parent_required')
      );

    expect(contradicted).toEqual([]);
  });
});
