import rehypeSlug from 'rehype-slug';

/**
 * The mdsvex options shared by the site build (`svelte.config.js`) and the link checker, so the heading ids the checker computes are the ids of the built pages.
 * @type {import('mdsvex').MdsvexOptions}
 */
export const mdsvexOptions = {
  extensions: ['.md', '.svx'],
  rehypePlugins: [rehypeSlug],
  smartypants: true
};
