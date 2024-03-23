import {type MaybeWrapped} from '../../entity';
import {MISSING_VALUE, type MaybeMissing} from '../../missingValue';
import {Filter, type FilterOptions} from '../base';

/**
 * An abstract base class for filters that search for text in a text field.
 */

export abstract class TextFilter<T extends MaybeWrapped> extends Filter<T, string> {
  protected _rules: {
    exclude?: string;
    include?: string;
    caseSensitive?: boolean;
  } = {};

  constructor(
    options: FilterOptions,
    public locale?: string
  ) {
    super(options);
  }

  get exclude() {
    return this._rules.exclude ?? '';
  }

  get include() {
    return this._rules.include ?? '';
  }

  get caseSensitive() {
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

  testValue(value: MaybeMissing<string>) {
    // Treat missing values as empty strings.
    if (value === MISSING_VALUE) value = '';
    if (this._rules.exclude && this.testText(this._rules.exclude, value as string)) return false;
    if (this._rules.include && !this.testText(this._rules.include, value as string)) return false;
    return true;
  }

  /**
   * Test whether @param rule is found in @param text
   */
  testText(rule: string, text: string) {
    return this._rules.caseSensitive
      ? text.indexOf(rule) !== -1
      : text.toLocaleLowerCase(this.locale).indexOf(rule.toLocaleLowerCase(this.locale)) !== -1;
  }
}
