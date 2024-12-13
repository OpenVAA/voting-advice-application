import { MaybeWrappedEntity } from '@openvaa/core';

/**
 * A logic operator for combining results from multiple filters.
 */
export const LOGIC_OP = {
  /** Include only items that are present in all results */
  And: 'And',
  /** Include all items that are present in any results */
  Or: 'Or'
};

export type LogicOp = (typeof LOGIC_OP)[keyof typeof LOGIC_OP];

/**
 * Combine the results of multiple filters.
 * @param results An array of results arrays
 * @param logicOperator And or Or logic operator to use in combination. @default LogicOp.And
 * @returns Combined results.
 */
export function combineResults<TEntity extends MaybeWrappedEntity>(
  results: Array<Array<TEntity>>,
  logicOperator = LOGIC_OP.And
): Array<TEntity> {
  if (!results.length) return [];
  if (logicOperator === LOGIC_OP.Or) return [...new Set(results.flat())];
  let out = results[0];
  for (const list of results.slice(1)) {
    out = out.filter((e) => list.includes(e));
    if (!out.length) return [];
  }
  return out;
}
