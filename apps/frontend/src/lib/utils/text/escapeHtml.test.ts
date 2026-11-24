import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escapeHtml';
import { sanitizeHtml } from '../sanitize';

describe('escapeHtml', () => {
  it('writes each character that markup reads specially as its entity', () => {
    expect(escapeHtml('a<b>&"\'')).toBe('a&lt;b&gt;&amp;&quot;&#39;');
  });

  it('escapes an ampersand that already begins an entity, so the text reads as it was given', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });

  it.each(['someone@example.org', 'Matti Meikäläinen', '', '  spaced  ', 'ÄÖå-+_.!#$%*/=?^`{|}~'])(
    'leaves %j, which holds none of them, unchanged',
    (text) => {
      expect(escapeHtml(text)).toBe(text);
    }
  );

  it('keeps text written into markup as text once the markup is sanitised', () => {
    const typed = '<script>alert(1)</script><img src="x" onerror="alert(1)">\'@example.org';
    const container = document.createElement('div');
    container.innerHTML = sanitizeHtml(`<strong>${escapeHtml(typed)}</strong>`);

    const strong = container.querySelector('strong');
    expect(strong?.textContent).toBe(typed);
    expect(strong?.children).toHaveLength(0);
    expect(container.querySelector('script, img')).toBeNull();
  });
});
