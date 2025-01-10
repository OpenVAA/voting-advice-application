import { MISSING_VALUE } from '../../missingValue';

/**
 * The types of rules are somewhat limited due to functions operating on them to check active status and copying rulesets.
 */
export type Rules = Record<string, Rule>;

/**
 * The types of rules are somewhat limited due to functions operating on them to check active status and copying rulesets.
 */
export type Rule = AtomicRule | Array<AtomicRule> | Set<AtomicRule>;
type AtomicRule = string | number | symbol | boolean | bigint | RegExp | typeof MISSING_VALUE | null | undefined;
