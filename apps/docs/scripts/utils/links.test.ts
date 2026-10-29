import { describe, expect, it } from 'vitest';
import { extractGithubSourceLinks, extractMarkdownLinks, parseStubTarget, replaceLink, resolvePage } from './links';

const REPO = 'https://github.com/OpenVAA/voting-advice-application';

function stub(prerender: string): string {
  return `import { redirect } from '@sveltejs/kit';\n\n${prerender}export function load() {\n  redirect(308, '/guide/new');\n}\n`;
}

describe('resolvePage', () => {
  it('does not resolve an encoded traversal to a file outside the static directory', async () => {
    expect((await resolvePage('/..%2fpackage.json')).kind).toBe('none');
    expect((await resolvePage('/..%5Cpackage.json')).kind).toBe('none');
  });
});

describe('replaceLink', () => {
  it('writes the link text as it is, without reading replacement patterns in it', () => {
    const content = 'See [cost $& more](../a) here.';
    const [link] = extractMarkdownLinks(content);

    expect(replaceLink(content, link, '/guide/a')).toBe('See [cost $& more](/guide/a) here.');
  });

  it('keeps the angle brackets of a link whose URL holds a parenthesis', () => {
    const content = 'See [the (old) page](<../old (page)>) here.';
    const [link] = extractMarkdownLinks(content);

    expect(replaceLink(content, link, '/guide/old (page)')).toBe('See [the (old) page](</guide/old (page)>) here.');
  });
});

describe('extractGithubSourceLinks', () => {
  it('reads a link to the branch root that carries a query or a hash', () => {
    const urls = extractGithubSourceLinks(`[a](${REPO}/blob/main?plain=1) [b](${REPO}/tree/main#readme)`).map(
      (l) => l.url
    );

    expect(urls).toEqual([`${REPO}/blob/main?plain=1`, `${REPO}/tree/main#readme`]);
  });

  it('drops sentence punctuation after a bare URL', () => {
    const urls = extractGithubSourceLinks(`See ${REPO}/blob/main/package.json. Or ${REPO}/tree/main/apps, then.`).map(
      (l) => l.url
    );

    expect(urls).toEqual([`${REPO}/blob/main/package.json`, `${REPO}/tree/main/apps`]);
  });
});

describe('parseStubTarget', () => {
  it('reads the target of a stub that exports prerender = true', () => {
    expect(parseStubTarget(stub('export const prerender = true;\n\n'))).toEqual({ target: '/guide/new' });
  });

  it('refuses a stub that does not export prerender = true, naming the export', () => {
    expect(parseStubTarget(stub(''))).toEqual({ error: expect.stringContaining('export const prerender = true') });
  });

  it('refuses a stub that exports prerender = false', () => {
    expect(parseStubTarget(stub('export const prerender = false;\n\n'))).toEqual({
      error: expect.stringContaining('export const prerender = true')
    });
  });

  it('refuses a stub that exports prerender twice', () => {
    expect(parseStubTarget(stub('export const prerender = true;\nexport const prerender = true;\n\n'))).toEqual({
      error: expect.stringContaining('export const prerender = true')
    });
  });
});
