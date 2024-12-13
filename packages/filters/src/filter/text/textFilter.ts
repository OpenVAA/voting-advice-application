import { MaybeWrappedEntity } from '@openvaa/core';
import { type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import { Filter, type FilterOptionsBase, type PropertyFilterOptions, type QuestionFilterOptions } from '../base';

/**
 * A base class for filters that search for text.
 */

export class TextFilter<TEntity extends MaybeWrappedEntity> extends Filter<TEntity, string> {
  protected _rules: {
    exclude?: string;
    include?: string;
    caseSensitive?: boolean;
  } = {};

  /**
   * Create a filter for text matching
   * @param options The filter options
   * @param locale The locale is used for case-insensitive matching
   */
  constructor(
    options: Omit<FilterOptionsBase<TEntity>, 'type' | 'multipleValues'> &
      (PropertyFilterOptions | QuestionFilterOptions),
    public locale: string
  ) {
    super({ ...options, type: 'string', multipleValues: false });
  }

  get exclude(): string {
    return this._rules.exclude ?? '';
  }

  get include(): string {
    return this._rules.include ?? '';
  }

  get caseSensitive(): boolean {
    return this._rules.caseSensitive ?? false;
  }

  set exclude(text: string | undefined) {
    this.setRule('exclude', text);
  }

  set include(text: string | undefined) {
    this.setRule('include', text);
  }

  set caseSensitive(value: boolean | undefined) {
    this.setRule('caseSensitive', value);
  }

  testValue(value: MaybeMissing<string>): boolean {
    // Treat missing values as empty strings.
    if (value === MISSING_VALUE) value = '';
    if (this._rules.exclude && this.testText(this._rules.exclude, value as string)) return false;
    if (this._rules.include && !this.testText(this._rules.include, value as string)) return false;
    return true;
  }

  /**
   * Test whether @param rule is found in @param text
   */
  testText(rule: string, text: string): boolean {
    // We do not care about leading and trailing whitespace. Because we use indexOf, we only need to trim the rule
    rule = rule.trim();
    return this._rules.caseSensitive
      ? text.indexOf(rule) !== -1
      : text.toLocaleLowerCase(this.locale).indexOf(rule.toLocaleLowerCase(this.locale)) !== -1;
  }
}
