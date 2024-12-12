import { describe, expect, test } from 'vitest';
import {
  DateQuestion,
  formatBooleanAnswer,
  formatDateAnswer,
  formatImageAnswer,
  formatMultipleTextAnswer,
  formatNumberAnswer,
  NumberQuestion
} from '../internal';

describe('formatBooleanAnswer', () => {
  test('Should return "Yes" when the input value is true for the formatBooleanAnswer function', () => {
    expect(formatBooleanAnswer({ value: true })).toBe('Yes');
  });
  test('Should return "No" when the input value is false for the formatBooleanAnswer function', () => {
    expect(formatBooleanAnswer({ value: false })).toBe('No');
  });
});

describe('formatDateAnswer', () => {
  test('Should return the formatted date string using the default format when question.format is undefined', () => {
    const date = new Date(2023, 9, 5); // October 5, 2023
    const question = {} as DateQuestion; // No format provided
    const result = formatDateAnswer({ question, value: date });
    expect(result).toBe('10/5/2023');
  });
  test('Should return the formatted date string using the specified locale and format from question.format', () => {
    const date = new Date(2023, 9, 5); // October 5, 2023
    const question = { format: { year: '2-digit', month: 'long', day: '2-digit' } } as DateQuestion;
    const locale = 'en-US';
    const result = formatDateAnswer({ locale, question, value: date });
    expect(result).toBe('October 05, 23');
  });
});

describe('formatImageAnswer', () => {
  test('Should return an img tag without data-dark-src attribute when urlDark is undefined for formatImageAnswer', () => {
    const image = { url: 'http://example.com/image.jpg', alt: 'Example Image', urlDark: undefined };
    const result = formatImageAnswer({ value: image });
    expect(result).toBe('<img src="http://example.com/image.jpg" alt="Example Image" />');
  });
  test('Should return an img tag with data-dark-src attribute when urlDark is provided for formatImageAnswer', () => {
    const image = {
      url: 'http://example.com/image.jpg',
      alt: 'Example Image',
      urlDark: 'http://example.com/image-dark.jpg'
    };
    const result = formatImageAnswer({ value: image });
    expect(result).toBe(
      '<img src="http://example.com/image.jpg" alt="Example Image" data-dark-src="http://example.com/image-dark.jpg" />'
    );
  });
});

describe('formatMultipleTextAnswer', () => {
  test('Should return "—" when the input array is empty for the formatMultipleTextAnswer function', () => {
    expect(formatMultipleTextAnswer({ value: [], empty: '—' })).toBe('—');
  });
  test('Should return a comma-separated list of trimmed strings when the input array contains multiple non-empty strings', () => {
    const input = ['  apple  ', 'banana', '  cherry '];
    const result = formatMultipleTextAnswer({ value: input, separator: ', ' });
    expect(result).toBe('apple, banana, cherry');
  });
  test('Should apply map function to items', () => {
    const input = ['  apple  ', 'banana', '  cherry '];
    const result = formatMultipleTextAnswer({ value: input, separator: ', ', map: (s) => s + 'x' });
    expect(result).toBe('applex, bananax, cherryx');
  });
});

describe('formatNumberAnswer', () => {
  test('Should return the formatted number string using the specified locale when locale is provided', () => {
    const question = {} as NumberQuestion; // No specific format provided
    const locale = 'de-DE'; // German locale
    const value = 1234567.89;
    const result = formatNumberAnswer({ locale, question, value });
    expect(result).toBe('1.234.567,89');
  });
  test('Should return the formatted number string using the specified format from question.format', () => {
    const question = { format: { style: 'currency', currency: 'USD' } } as NumberQuestion;
    const locale = 'en-US';
    const value = 1234.56;
    const result = formatNumberAnswer({ locale, question, value });
    expect(result).toBe('$1,234.56');
  });
});
