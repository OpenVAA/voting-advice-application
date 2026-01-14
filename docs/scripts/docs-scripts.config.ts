/**
 * Shared configuration for documentation generation scripts
 */
import { join } from 'path';

/**
 * Base directories
 */
export const DOCS_ROOT = process.cwd();
export const REPO_ROOT = join(DOCS_ROOT, '..');
export const FRONTEND_ROOT = join(REPO_ROOT, 'frontend');

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
 * Component directories for extraction
 */
export const COMPONENT_DIRS = [
  {
    dir: join(FRONTEND_ROOT, 'src', 'lib', 'components'),
    name: 'Static Components',
    importPrefix: '$lib/components'
  },
  {
    dir: join(FRONTEND_ROOT, 'src', 'lib', 'dynamic-components'),
    name: 'Dynamic Components',
    importPrefix: '$lib/dynamic-components'
  },
  {
    dir: join(FRONTEND_ROOT, 'src', 'lib', 'candidate', 'components'),
    name: 'Candidate App Components',
    importPrefix: '$candidate/components'
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

/**
 * TypeDoc configuration files
 */
export const TYPEDOC_CONFIG = {
  packages: join(DOCS_ROOT, 'scripts', 'config', 'typedoc.json'),
  frontend: join(DOCS_ROOT, 'scripts', 'config', 'typedoc.frontend.json')
} as const;
