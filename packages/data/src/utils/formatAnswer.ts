import { DateQuestion, Image, NumberQuestion } from '../internal';

/**
 * The default format used for `Date` formatting.
 */
export const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
};

/**
 * Format a non-missing `boolean` `Answer.value` for output.
 */
export function formatBooleanAnswer({ value }: { value: boolean }): string {
  return value ? 'Yes' : 'No';
}

/**
 * Format a non-missing `Date` `Answer.value` for output based on `locale` and the `format` property of the `DateQuestion`.
 */
export function formatDateAnswer({
  locale,
  question,
  value
}: {
  locale?: string | null;
  question: DateQuestion;
  value: Date;
}): string {
  const format = question.format ?? DEFAULT_DATE_FORMAT;
  return value.toLocaleDateString(locale ?? undefined, format);
}

/**
 * Format a non-missing `Image` `Answer.value` for output as an `<img>` element.
 */
export function formatImageAnswer({ value }: { value: Image }): string {
  const { url, alt, urlDark } = value;
  return `<img src="${url}" alt="${alt ?? ''}" ${urlDark ? `data-dark-src="${urlDark}" ` : ''}/>`;
}

/**
 * Format a `MISSING_ANSWER` for output.
 */
export function formatMissingAnswer(): string {
  return '—';
}

/**
 * Format a non-missing `Array<string>` `Answer.value` for output.
 */
export function formatMultipleTextAnswer({
  value,
  separator = ', ',
  empty = '—',
  map = (v) => v
}: {
  value: Array<string>;
  separator?: string;
  empty?: string;
  map?: (item: string) => string;
}): string {
  return value.length === 0 ? empty : value.map((v) => map(v.trim())).join(separator);
}

/**
 * Format a non-missing `number` `Answer.value` for output.
 */
export function formatNumberAnswer({
  locale,
  question,
  value
}: {
  locale?: string | null;
  question: NumberQuestion;
  value: number;
}): string {
  const { format } = new Intl.NumberFormat(locale ?? undefined, question.format ?? undefined);
  return format(value);
}

/**
 * Format a non-missing `string` `Answer.value` for output.
 */
export function formatTextAnswer({ value }: { value: string }): string {
  return value.trim();
}
