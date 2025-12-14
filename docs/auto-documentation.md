# Automatic Documentation Generation

This document describes the automatic documentation generation system for OpenVAA.

## Overview

The documentation system automatically generates comprehensive documentation from:

1. **TypeScript code** - Using TypeDoc to extract TSDoc comments
2. **Svelte components** - Extracting `@component` docstrings
3. **Route structure** - Mapping the SvelteKit routes directory
4. **README files** - Integrating README content from directories

## Generated Documentation Structure

```
docs/generated/                  # Auto-generated (gitignored)
├── README.md                    # Main index
├── api/                         # TypeDoc-generated API docs
│   ├── packages/               # Package documentation
│   │   ├── core/
│   │   ├── data/
│   │   ├── matching/
│   │   ├── filters/
│   │   ├── app-shared/
│   │   ├── llm/
│   │   ├── argument-condensation/
│   │   └── question-info/
│   └── frontend/               # Frontend library documentation
│       ├── contexts/
│       ├── utils/
│       └── api/
├── components/                 # Svelte component docs
│   ├── README.md              # Component table of contents
│   ├── components/            # From frontend/src/lib/components
│   ├── candidate/             # From frontend/src/lib/candidate/components
│   └── dynamic-components/    # From frontend/src/lib/dynamic-components
└── routes/                     # Route map
    └── README.md              # Route structure
```

## Quick Start

### Generate All Documentation

```bash
# Install dependencies (if not already done)
yarn install

# Build shared packages (required for TypeDoc)
yarn build:shared

# Generate all documentation
yarn docs:generate
```

The generated documentation will be in `docs/generated/`.

### Generate Specific Sections

```bash
# TypeDoc API documentation only
yarn docs:typedoc

# Svelte component documentation only
yarn docs:components

# Route map only
yarn docs:routes
```

## How It Works

### 1. TypeDoc for API Documentation

**Configuration:** `typedoc.json`

TypeDoc generates markdown documentation from TSDoc comments in TypeScript files. It covers:

- All packages in `packages/*`
- Frontend contexts (`frontend/src/lib/contexts`)
- Frontend utilities (`frontend/src/lib/utils`)
- Frontend API adapters (`frontend/src/lib/api`)

**Features:**
- Generates Mermaid class diagrams
- Links to GitHub source code
- Supports hierarchical navigation
- Excludes test files and private APIs

**Script:** `typedoc` command configured in `typedoc.json`

### 2. Svelte Component Documentation

**Script:** `scripts/extract-component-docs.ts`

This custom script:
1. Finds all `.svelte` files in component directories
2. Extracts the `@component` docstring (markdown format)
3. Links to corresponding `.type.ts` TypeDoc documentation
4. Includes README.md files from component directories
5. Generates a table of contents organized by directory

**Covered directories:**
- `frontend/src/lib/components/`
- `frontend/src/lib/candidate/components/`
- `frontend/src/lib/dynamic-components/`

**Output:** One markdown file per component in `docs/generated/components/`

### 3. Route Map Generation

**Script:** `scripts/generate-route-map.ts`

This script:
1. Traverses the `frontend/src/routes/` directory tree
2. Identifies route types:
   - Standard routes (`/about`)
   - Dynamic routes (`[id]`, `[slug=matcher]`)
   - Layout groups (`(voters)`, `(protected)`)
   - Server endpoints (`+server.ts`)
   - Layouts (`+layout.svelte`)
3. Includes README.md content from route directories
4. Generates a hierarchical tree structure

**Output:** `docs/generated/routes/README.md`

### 4. Main Orchestrator

**Script:** `scripts/generate-docs.ts`

This main script:
1. Runs TypeDoc for packages
2. Runs TypeDoc for frontend libraries
3. Extracts Svelte component documentation
4. Generates route map
5. Creates a comprehensive index with links to all sections

## Writing Documentation

### For TypeScript Code

Use TSDoc comments above exports:

```typescript
/**
 * Calculates the matching score between a voter and a candidate.
 *
 * The score is normalized to a 0-1 range where 1 is a perfect match.
 *
 * @param voter - The voter's answers to questions
 * @param candidate - The candidate's positions on questions
 * @param options - Optional matching algorithm parameters
 * @returns A match score between 0 and 1
 *
 * @example
 * ```typescript
 * const score = calculateMatch(voterAnswers, candidateAnswers, {
 *   metric: 'manhattan'
 * });
 * console.log(`Match: ${score * 100}%`);
 * ```
 *
 * @see {@link MatchOptions} for available options
 * @see {@link VoterAnswers} for the voter answer format
 */
export function calculateMatch(
  voter: VoterAnswers,
  candidate: CandidateAnswers,
  options?: MatchOptions
): number {
  // Implementation
}
```

**TSDoc tags:**
- `@param` - Parameter description
- `@returns` - Return value description
- `@example` - Usage example
- `@see` - Cross-reference to related items
- `@throws` - Exceptions that may be thrown
- `@deprecated` - Mark as deprecated
- `@internal` - Exclude from documentation

### For Svelte Components

Add a `@component` docstring at the top of the `.svelte` file:

```svelte
<!--
@component
A modal dialog component with customizable content and actions.

The modal is rendered in a portal and can be opened/closed programmatically
or by user interaction (ESC key, backdrop click, etc.).

### Properties

- `title` (string): The title displayed in the modal header
- `isOpen` (boolean, optional): Whether the modal is initially open. Default: `false`
- `boxClass` (string, optional): Additional CSS classes for the dialog box

### Slots

- `default`: Main content of the modal
- `actions`: Action buttons displayed at the bottom of the modal

### Events

- `onOpen`: Callback fired when the modal opens
- `onClose`: Callback fired when the modal closes

### Bindable Functions

- `openModal(): void`: Opens the modal programmatically
- `closeModal(): void`: Closes the modal programmatically

### Accessibility

- Uses `<dialog>` element for native modal behavior
- Traps focus within the modal when open
- ESC key closes the modal
- ARIA attributes for screen readers

### Usage

\```svelte
<script lang="ts">
  import { Modal, Button } from '$lib/components';

  let openModal: () => void;
  let closeModal: () => void;
</script>

<Button on:click={openModal}>Open Modal</Button>

<Modal
  bind:openModal
  bind:closeModal
  title="Confirm Action"
  onClose={() => console.log('Modal closed')}>
  <p>Are you sure you want to proceed?</p>

  <div slot="actions" class="flex gap-2">
    <Button on:click={closeModal}>Cancel</Button>
    <Button variant="primary" on:click={() => { doAction(); closeModal(); }}>
      Confirm
    </Button>
  </div>
</Modal>
\```
-->

<script lang="ts">
  // Component implementation
</script>

<!-- Component template -->
```

**Component docstring sections:**
- Brief description (first paragraph)
- Detailed description
- `### Properties` - Component props
- `### Slots` - Available slots
- `### Events` - Events and callbacks
- `### Bindable Functions` - Functions that can be bound
- `### Accessibility` - Accessibility considerations
- `### Usage` - Code examples

### For Routes

Add `README.md` files in route directories:

```markdown
# Admin Routes

Protected routes for application administrators.

## Authentication

All routes require admin authentication. Unauthenticated users are
redirected to `/admin/login`.

## Available Routes

- `/admin` - Dashboard with system overview
- `/admin/jobs` - View and manage background jobs
- `/admin/question-info` - Generate question information with AI
- `/admin/argument-condensation` - Condense candidate arguments

## Permissions

Admin users must have the `admin` role assigned in Strapi.
```

## TypeDoc Configuration

The `typedoc.json` configuration includes:

- **Entry points:** All packages + frontend library folders
- **Plugins:**
  - `typedoc-plugin-markdown` - Markdown output
  - `typedoc-plugin-mermaid` - Class diagram generation
- **Exclusions:** Test files, node_modules, type declaration files
- **Source links:** Links to GitHub source code
- **Navigation:** Categorized by groups

## Troubleshooting

### "Module not found" errors

TypeDoc requires built packages. Run:

```bash
yarn build:shared
yarn docs:generate
```

### Missing component documentation

Ensure your component has a `@component` docstring:

```svelte
<!--
@component
Component description here
-->
```

### TypeDoc warnings

TypeDoc may warn about missing exports or private types. This is usually fine - only exported public APIs are documented.

### Script execution errors

Ensure you have the required dependencies:

```bash
yarn install
```

Scripts require:
- `tsx` - TypeScript execution
- `glob` - File pattern matching
- `typedoc` and plugins - API documentation

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Generate Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: yarn install

      - name: Build packages
        run: yarn build:shared

      - name: Generate documentation
        run: yarn docs:generate

      - name: Upload documentation
        uses: actions/upload-artifact@v3
        with:
          name: documentation
          path: docs/generated/

      # Optional: Deploy to GitHub Pages
      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/generated
```

## Future Enhancements

Planned improvements:

1. **Storybook Integration**
   - Interactive component playground
   - Visual regression testing
   - Component variant exploration

2. **Search Functionality**
   - Full-text search across all documentation
   - Symbol search for APIs
   - Component search

3. **Version Support**
   - Generate docs for different releases
   - Version selector in navigation
   - Changelog integration

4. **Enhanced Diagrams**
   - Architecture diagrams
   - Data flow diagrams
   - Component dependency graphs

5. **Documentation Site**
   - SvelteKit-based documentation website
   - Interactive examples
   - Live code playgrounds

6. **Cross-References**
   - Automatic linking between related items
   - "Used by" and "Uses" sections
   - Import path suggestions

## Contributing

When adding new code:

1. **Add TSDoc comments** to all exported functions, classes, and types
2. **Add `@component` docstrings** to all Svelte components
3. **Include usage examples** in documentation
4. **Add README.md files** to new route sections
5. **Test documentation generation** before committing:
   ```bash
   yarn docs:generate
   ```

## Support

For issues with the documentation system:
- Check the [Troubleshooting](#troubleshooting) section
- Review the [Contributing guide](contributing.md)
- Open an issue on GitHub

---

*Last updated: 2025-12-14*
