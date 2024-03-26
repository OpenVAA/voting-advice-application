import type {MaybeWrapped} from '../entity';

/**
 * A logic operator for combining results from multiple filters.
 */
export enum LogicOp {
  /** Include only items that are present in all results */
  And,
  /** Include all items that are present in any results */
  Or
}

/**
 * Combine the results of multiple filters.
 * @param results An array of results arrays
 * @param logicOperator And or Or logic operator to use in combination. @default LogicOp.And
 * @returns Combined results.
 */
export function combineResults<E extends MaybeWrapped>(
  results: E[][],
  logicOperator = LogicOp.And
): E[] {
  if (!results.length) return [];
  if (logicOperator === LogicOp.Or) return Array.from(new Set(results.flat()));
  let out = results[0];
  for (const list of results.slice(1)) {
    out = out.filter((e) => list.includes(e));
    if (!out.length) return [];
  }
  return out;
}
