import type { DateQuestion, Image, NumberQuestion } from '../internal';

/**
 * The locale used by the `Intl`-backed formatters when no `locale` is supplied.
 *
 * This exists so that formatting NEVER falls back to the ambient machine locale. `Intl` treats an `undefined` locale as "use the runtime default", which makes the output a function of the host the code happens to run on: the same `Date` renders `10/5/2023` on a `en-US` machine and `5.10.2023` on a `fi` one. In a server-rendered app that means a user's dates depend on the server's environment rather than on their locale — a latent defect, not merely a test hazard.
 *
 * Callers that care about the rendered locale must pass one explicitly (`DataRoot` threads its own `locale` through to every formatter). This constant only decides what happens when nobody did.
 */
export const DEFAULT_LOCALE = 'en-US';

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
 *
 * @param locale - The locale to format in. Defaults to `DEFAULT_LOCALE` — never to the ambient
 *   machine locale.
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
  return value.toLocaleDateString(locale ?? DEFAULT_LOCALE, format);
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
 *
 * @param locale - The locale to format in. Defaults to `DEFAULT_LOCALE` — never to the ambient
 *   machine locale.
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
  const { format } = new Intl.NumberFormat(locale ?? DEFAULT_LOCALE, question.format ?? undefined);
  return format(value);
}

/**
 * Format a non-missing `string` `Answer.value` for output.
 */
export function formatTextAnswer({ value }: { value: string }): string {
  return value.trim();
}
