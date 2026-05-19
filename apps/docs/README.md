# OpenVAA Documentation Site

This directory contains the OpenVAA documentation website, which combines auto-generated API documentation with hand-written guides.

## Overview

The documentation system consists of:

1. **Generated Documentation** (`/docs/generated/`) - Auto-generated from source code
   - TypeDoc API references from TypeScript packages
   - Component docs from Svelte `@component` docstrings
   - Route map from SvelteKit routes

2. **Documentation Site** (`/docs/`) - SvelteKit-based static site
   - Hand-written guides and tutorials
   - Automatic navigation
   - CSS-based styling with dark mode support
   - Serves generated documentation

## Architecture

```
docs/
├── scripts/                      # Documentation generation scripts
│   ├── generate-docs.ts         # Main orchestrator
│   ├── generate-component-docs.ts # Svelte component extraction
│   ├── generate-route-map.ts    # Route map generation
│   ├── copy-generated.ts        # Copy docs to static site
│   └── config/
│       ├── typedoc.json         # TypeDoc config for packages
│       └── typedoc.frontend.json # TypeDoc config for frontend
├── src/
│   ├── routes/
│   │   ├── +page.md              # Home page
│   │   ├── +layout.svelte        # Main layout with navigation
│   │   ├── guides/               # Hand-written guides
│   │   │   ├── quick-start/+page.md
│   │   │   ├── development/+page.md
│   │   │   └── architecture/+page.md
│   │   ├── api/                  # API reference pages
│   │   │   ├── packages/+page.md
│   │   │   └── frontend/+page.md
│   │   ├── components/+page.md   # Component docs
│   │   └── routes/+page.md       # Route map
│   ├── lib/
│   │   ├── layouts/
│   │   │   └── MdLayout.svelte   # Markdown layout
│   │   └── components/           # Doc-specific components
│   ├── app.css                   # Global styles
│   └── app.html                  # HTML template
├── generated/                    # Auto-generated docs (gitignored)
├── static/
│   └── generated/                # Copied generated docs
├── build/                        # Built static site
├── package.json
├── svelte.config.js
└── vite.config.js
```

## Development

### Local Development

```bash
# Generate documentation from source
yarn generate:docs

# Start the docs site
yarn dev
```

The site will be available at http://localhost:5173

### Building for Production

```bash
# Generate documentation
yarn generate:docs

# Build the docs site
yarn build

# Preview the built site
yarn preview
```

## Deployment

The documentation is automatically deployed to GitHub Pages via GitHub Actions.

### GitHub Pages Setup

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - No branch selection needed

2. **Workflow** (`.github/workflows/docs.yml`):
   - Triggers on push to `main` branch
   - Generates documentation from source
   - Builds the SvelteKit site
   - Deploys to GitHub Pages

### Manual Deployment

```bash
# Generate and build
yarn generate:docs
cd docs
yarn build

# The static site is in docs/build/
# Deploy these files to any static host
```
