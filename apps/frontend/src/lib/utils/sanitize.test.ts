import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('returns an empty string for missing input', () => {
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('keeps ordinary formatting markup', () => {
    const html = '<p>Hello <strong>bold</strong> and <a href="https://example.org/">a link</a></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('removes script elements', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>');
  });

  it('removes inline event handlers', () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('removes javascript: URLs', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('click');
  });

  it('drops SVG and MathML under the html-only profile', () => {
    const result = sanitizeHtml('<svg><circle r="1"></circle></svg><math><mi>x</mi></math><p>kept</p>');
    expect(result).not.toContain('<svg');
    expect(result).not.toContain('<math');
    expect(result).toContain('<p>kept</p>');
  });
});
