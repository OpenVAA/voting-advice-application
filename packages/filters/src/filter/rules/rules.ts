import { MISSING_VALUE } from '../../missingValue';
import type { Rule, Rules } from './rules.type';

/**
 * Create a copy of the filter's rules.
 */
export function copyRules<TRule extends Rules>(rules: TRule): TRule {
  const copy: Rules = {};
  for (const k in rules) {
    const v = rules[k];
    if (Array.isArray(v)) {
      copy[k] = [...v];
    } else if (v instanceof Set) {
      copy[k] = new Set(v);
    } else if (typeof v === 'object' && !(v instanceof RegExp) && v !== MISSING_VALUE && v !== null) {
      throw new Error(`Unsupported rule type: ${v.constructor.name}`);
    } else {
      copy[k] = v;
    }
  }
  return copy as TRule;
}

/**
 * Check whether @param rule is empty for purposes of finding out whether a filter is active or not.
 */
export function ruleIsActive(rule: Rule): boolean {
  if (rule == null || rule === '' || rule === false) return false;
  if (Array.isArray(rule)) return rule.length > 0;
  if (rule instanceof Set) return rule.size > 0;
  if (rule instanceof RegExp) return rule.source !== '' && rule.source !== '(?:)';
  return true;
}

/**
 * A simple utility to check whether to rule values are equal.
 * @param a A rule value
 * @param b A rule value
 * @returns true if the rules are equal
 */
export function matchRules(a: Rule, b: Rule): boolean {
  if (a == b) return true;
  // We check for active because undefined and an empty array should be considered equal
  if (!ruleIsActive(a) && !ruleIsActive(b)) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v) => b.includes(v));
  if (a instanceof Set) return b instanceof Set && a.size === b.size && [...a.values()].every((v) => b.has(v));
  if (a instanceof RegExp) return b instanceof RegExp && `${a}` === `${b}`;
  return false;
}
