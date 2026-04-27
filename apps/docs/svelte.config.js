import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md', '.svx'],
      layout: {
        _: './src/lib/layouts/MdLayout.svelte'
      },
      rehypePlugins: [rehypeSlug],
      smartypants: true
    })
  ],
  kit: {
    alias: {
      // Needed for mdsvex imports to work both on the server and client
      './src/lib/*': './src/lib/*'
    },
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: false,
      strict: true
    })
  },
  extensions: ['.svelte', '.svx', '.md']
};

export default config;
