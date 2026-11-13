/**
 * Shared configuration for documentation generation scripts
 */
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * Base directories, anchored on this file's location so they do not depend on the directory a script is started from
 */
export const DOCS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = join(DOCS_ROOT, '../..');
export const FRONTEND_ROOT = join(REPO_ROOT, 'apps', 'frontend');

/**
 * Generated documentation directory (intermediate output)
 */
export const GENERATED_DIR = join(DOCS_ROOT, 'scripts', '.temp');

/**
 * Target directories in the docs site
 */
export const DOCS_ROUTES_DIR = join(DOCS_ROOT, 'src', 'routes', '(content)');
export const DEVELOPERS_GUIDE_DIR = join(DOCS_ROUTES_DIR, 'developers-guide');

/**
 * Generated output subdirectories
 */
export const GENERATED_OUTPUT = {
  components: join(GENERATED_DIR, 'components'),
  routes: join(GENERATED_DIR, 'routes')
} as const;

/**
 * Target directories for copying generated docs to the site
 */
export const COPY_TARGETS = [
  {
    src: 'components',
    dest: join(DEVELOPERS_GUIDE_DIR, 'frontend', 'components', 'generated'),
    /**
     * The route for links
     */
    route: '/developers-guide/frontend/components/generated'
  },
  {
    src: 'routes',
    dest: join(DEVELOPERS_GUIDE_DIR, 'frontend', 'routing', 'generated'),
    /**
     * The route for links
     */
    route: '/developers-guide/frontend/routing/generated'
  }
] as const;

/**
 * Component directories for extraction. `categorySubdir` is where a directory's pages are written under the generated components route, and so where the table of contents links them.
 */
export const COMPONENT_DIRS = [
  {
    dir: join(FRONTEND_ROOT, 'src', 'lib', 'components'),
    name: 'Static Components',
    importPrefix: '$lib/components',
    categorySubdir: 'components'
  },
  {
    dir: join(FRONTEND_ROOT, 'src', 'lib', 'dynamic-components'),
    name: 'Dynamic Components',
    importPrefix: '$lib/dynamic-components',
    categorySubdir: 'dynamic-components'
  },
  {
    dir: join(FRONTEND_ROOT, 'src', 'lib', 'contestant', 'components'),
    name: 'Contestant App Components',
    importPrefix: '$contestant/components',
    categorySubdir: 'contestant/components'
  }
] as const;

/**
 * Routes directory for route map generation
 */
export const ROUTES_DIR = join(FRONTEND_ROOT, 'src', 'routes');

/**
 * GitHub repository base URL for source links
 */
export const GITHUB_BASE = 'https://github.com/OpenVAA/voting-advice-application/blob/main';
