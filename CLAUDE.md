# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenVAA is a software framework for creating Voting Advice Applications (VAAs). It consists of a monorepo with:
- **Frontend**: SvelteKit application (voters' UI + candidate app)
- **Backend**: Strapi CMS with custom plugins
- **Packages**: Modular libraries for matching algorithms, filters, data handling, and LLM features

**Project Status**: Alpha (actively being refactored for production use)

## Development Setup

### Prerequisites
- Node.js version: **20.18.1** (specified in root package.json - use nvm)
- Yarn **4.6** (required, npm not supported)
- Docker (for full stack development)
- Ports 1337 (backend), 5173 (frontend), 5432 (postgres) must be available

### Quick Start with Docker (Recommended)

```bash
# Install dependencies for all workspaces
yarn install

# Copy environment file
cp .env.example .env

# Build and run development stack (frontend, backend, postgres)
yarn dev

# Stop containers
yarn dev:down
```

**Important**: When using Docker, only modify the `.env` file in the project root, not individual workspace `.env` files.

### Backend Setup
1. After `yarn dev`, navigate to `http://localhost:1337` (may take time to build)
2. Register an admin account in Strapi admin panel
3. With mock data enabled: default admin is `admin@example.com` / `admin`

### Running Components Separately

**Frontend only:**
```bash
# Build dependencies first
yarn workspace @openvaa/app-shared build
# Then run frontend
cd frontend
yarn install
cp .env.example .env
yarn dev
```

**Backend only:**
```bash
# Build dependencies first
yarn workspace @openvaa/app-shared build
# Start postgres
docker compose -f docker-compose.dev.yml up postgres
# Run Strapi
cd backend/vaa-strapi
yarn install
cp .env.example .env
yarn dev
```

## Monorepo Architecture

### Workspace Structure

The project uses Yarn workspaces with shared dependencies:

**Abstract Logic Packages:**
- `@openvaa/core` - Core type definitions for matching
- `@openvaa/data` - Data models and types
- `@openvaa/filters` - Entity filtering logic
- `@openvaa/matching` - Matching algorithms for VAA functionality
- `@openvaa/chatbot` - Chatbot functionality
- `@openvaa/llm-refactor` - LLM integration
- `@openvaa/vector-store` - Vector storage for embeddings
- `@openvaa/file-processing` - Document processing
- `@openvaa/argument-condensation` - Argument summarization
- `@openvaa/question-info` - Question metadata

**Application Packages:**
- `@openvaa/app-shared` - Shared code between frontend and backend (must be built first)
- `@openvaa/frontend` - SvelteKit application
- `@openvaa/strapi` - Strapi backend
- `@openvaa/strapi-admin-tools` - Custom Strapi plugin

**Development:**
- `@openvaa/shared-config` - Shared ESLint/TypeScript configs

### Working with Workspaces

```bash
# Run commands in specific workspace
yarn workspace [module-name] [script-name]

# Example: Build app-shared
yarn workspace @openvaa/app-shared build

# Build all shared packages
yarn build:shared

# Build only app-shared and its dependencies
yarn build:app-shared
```

### Module Dependencies

When adding interdependencies between modules:
1. Add to `package.json` using `workspace:` syntax:
   ```json
   "dependencies": {
     "@openvaa/core": "workspace:^"
   }
   ```
2. Add TypeScript reference in `tsconfig.json`:
   ```json
   "references": [{ "path": "../core/tsconfig.json" }]
   ```

### Hot Reloading

- **Frontend**: Hot reloading enabled by default
- **Backend**: Can be enabled but may slow development
- **Important**: Changes to `@openvaa/app-shared` require rebuilding and restarting Docker containers
- Use `yarn dev:update` to rebuild shared packages and restart frontend container

## Common Commands

### Development
```bash
yarn dev                    # Start full Docker stack
yarn dev:down               # Stop and clean up Docker stack
yarn dev:stop               # Stop without cleanup
yarn dev:attach             # Start with logs attached
yarn dev:update             # Rebuild shared packages and restart frontend container
```

**IMPORTANT**: After modifying any package in `/packages` (e.g., `@openvaa/app-shared`, `@openvaa/matching`, `@openvaa/chatbot`), you MUST run `yarn dev:update` to rebuild the packages and update them in the Docker development environment. Simply restarting containers will NOT pick up package changes. Please do this everytime you have finished a feature addition in the packages directory. 

### Building
```bash
yarn build:shared           # Build all packages in /packages
yarn build:app-shared       # Build app-shared and dependencies
yarn prod                   # Production Docker build
```

### Testing
```bash
yarn test:unit              # Run all unit tests (Vitest)
yarn test:unit:watch        # Watch mode (packages only)
yarn test:e2e               # Run E2E tests (Playwright)
```

### Code Quality
```bash
yarn format                 # Format with Prettier
yarn format:check           # Check formatting
yarn lint:fix               # Fix ESLint issues
yarn lint:check             # Check for ESLint issues
```

### Frontend Specific
```bash
yarn workspace @openvaa/frontend dev          # Start dev server
yarn workspace @openvaa/frontend build        # Build for production
yarn workspace @openvaa/frontend test:unit    # Run frontend unit tests
```

### Backend Specific
```bash
yarn workspace @openvaa/strapi dev            # Start Strapi dev server
yarn workspace @openvaa/strapi build          # Build Strapi
yarn workspace @openvaa/strapi generate:types # Regenerate Strapi types
yarn workspace @openvaa/strapi test:unit      # Run backend unit tests
```

## Architecture & Key Concepts

### Frontend (SvelteKit)

**Technology Stack:**
- Svelte 4 + SvelteKit 2
- Tailwind CSS + DaisyUI
- TypeScript (strict mode)
- Capacitor (for iOS/Android)

**Key Features:**
- **Two Applications**: Voter app and Candidate app (different routes, shared codebase)
- **i18n**: Uses `sveltekit-i18n` with ICU message format
- **Data Adapters**: Abstraction layer supporting multiple backends (Strapi, API routes, static JSON)
- **Matching Algorithm**: Client-side candidate matching using `@openvaa/matching`
- **Component Library**: Reusable Svelte components in `src/lib/components/`

**Important Patterns:**
- Components use `$$restProps` for attribute forwarding
- Type definitions in separate `.type.ts` files
- Each component folder has `index.ts` for clean imports
- File naming: `ComponentName.svelte`, `ComponentName.type.ts`, `ComponentName.test.ts`

### Backend (Strapi)

**Technology Stack:**
- Strapi 5.9
- PostgreSQL database
- AWS S3 for uploads (or LocalStack for dev)
- AWS SES for emails

**Key Features:**
- **Content Types**: Candidates, Parties, Elections, Questions, Nominations, etc.
- **Custom Plugin**: `openvaa-admin-tools` for admin functionality
- **Authentication**: JWT-based for candidates, API tokens for pre-registration
- **Data Seeding**: Automatic loading of default data and mock data generation (dev only)
- **API Permissions**: Custom policies restrict population and enforce security

**Important Patterns:**
- Default data loaded on initialization (question types, app settings, translations)
- Mock data can be seeded for testing (see `GENERATE_MOCK_DATA_ON_INITIALISE` in `.env`)
- All API routes restricted to `find` and `findOne` operations
- Global policies in `src/policies/` enforce access control
- Custom route configs include `restrict-populate` policy

### Matching Algorithm (`@openvaa/matching`)

The core VAA functionality - matches voters with candidates based on question answers.

**Key Concepts:**
- Questions positioned in multidimensional space
- Distance metrics: Manhattan, Euclidean, Directional
- Handles missing values through imputation/bias methods
- Supports question weighting and subcategory matching
- Question types: Ordinal (Likert), Categorical

**Usage Pattern:**
1. Create `MatchableQuestion` objects
2. Create entities implementing `HasAnswers` (voter, candidates)
3. Instantiate `MatchingAlgorithm` with options
4. Call `match()` method → returns ordered `Match` objects

## TypeScript Guidelines

Follow [TypeScript Style Guide](https://mkosir.github.io/typescript-style-guide/) with these specifics:

**Enforced Rules:**
- Use `Array<Foo>` not `Foo[]`
- Type parameters cannot be single letters: `<TBar>` not `<T>`
- Boolean naming conventions optional but preferred

**Function Parameters:**
- Use named/destructured parameters when >1 parameter
- Maintain consistent parameter naming for easy destructuring

**File Organization:**
- `foo.ts` - Implementation
- `foo.type.ts` - Type definitions only
- `foo.test.ts` - Unit tests

## Svelte Component Guidelines

**File Structure:**
```
src/lib/components/myComponent/
├── MyComponent.svelte        # Component implementation
├── MyComponent.type.ts       # Props types
└── index.ts                  # Exports
```

**Component Patterns:**
- Use `$$restProps` for attribute forwarding
- Document with Svelte docstrings before `<script>` block
- Properties with dashes (e.g., `class`, `aria-*`) accessed via `$$props`
- Default classes: use `concatClass` helper from `$lib/utils/components`

**Documentation Requirements:**
- Main purpose of component
- List of slots
- For pages/layouts: Settings and route params affecting behavior

## Testing

**Unit Tests (Vitest):**
- Configuration: `vitest.workspace.ts` (loads all workspace configs)
- Run from root after building shared packages
- Located next to source files: `*.test.ts`

**E2E Tests (Playwright):**
- Located in `/tests` folder
- Requires full Docker stack running with mock data
- Tests rely on seeded database state
- Reset state with `yarn dev:down` before running

## Backend Customizations

### Default Data Loading
On Strapi initialization:
- Question Types (from `src/functions/loadDefaultData.ts`)
- App Settings (from `src/functions/loadDefaultAppSettings.ts`)
- Translation overrides (from `src/functions/loadDynamicTranslations.ts`)
- API permissions (from `src/functions/setDefaultApiPermissions.ts`)

### Mock Data Generation
**Dev only** - controlled by `.env` variables:
```bash
GENERATE_MOCK_DATA_ON_INITIALISE=true   # Seed once when DB empty
GENERATE_MOCK_DATA_ON_RESTART=false     # Regenerate on every restart (destructive!)
```

### Adding New Content Types
1. Add to `CONTENT_API` list in `src/util/api.ts` for public read access
2. Update `src/extensions/users-permissions/strapi-server.ts` for authenticated access
3. Configure route with restrictions:
```typescript
export default factories.createCoreRouter('api::foo.foo', {
  only: ['find', 'findOne'],
  config: {
    find: { policies: ['global::restrict-populate'] },
    findOne: { policies: ['global::restrict-populate'] }
  }
});
```

## Common Issues

### Module Resolution
- **IDE**: Uses TypeScript references (no build needed for cross-imports)
- **Runtime**: Uses NPM resolution (requires building dependee modules)
- **Key Point**: Always build `@openvaa/app-shared` before running frontend/backend

### Docker Issues
- If containers fail, try `yarn dev:down` to clean state
- Hot reloading doesn't work for `@openvaa/app-shared` changes
- Default admin with mock data: `admin@example.com` / `admin`

### Testing Issues
- E2E tests failing: Reset DB with `yarn dev:down` then `yarn dev`
- Unit tests: Must run `yarn build:shared` first

## Git Workflow

### Commit Message Format

**IMPORTANT**: This project uses a strict commit message format. All commits must follow this pattern:

```
<type>[<scope>]: <description>
```

**Format Rules:**
- **All lines must start with lowercase letters** (description and all body lines)
- Description should be concise and explain the change
- Use imperative mood ("add" not "adds" or "added")

**Types:**
- `feat` - New feature or functionality
- `fix` - Bug fix
- `clean` - Code cleanup, refactoring without changing functionality
- `refactor` - Code restructuring that may change behavior
- `test` - Adding or modifying tests
- `docs` - Documentation changes
- `chore` - Build process, dependencies, configs

**Scope:**
Use the package name or feature area affected by the change. Common scopes:
- Package scopes: `arg-cond`, `question-info`, `chatbot`, `matching`, `vector-store`, `file-processing`, `llm-refactor`, `app-shared`, `frontend`, `strapi`, `admin-tools`
- Feature scopes: `admin-ui`, `voter-ui`, `candidate-ui`, `api`, `auth`, `i18n`, `tests`

**Examples:**
```
feat[arg-cond]: add test suite for condensation API
feat[admin-ui]: add page for question info generation
fix[matching]: correct distance calculation for missing values
clean[chatbot]: refactor response formatting logic
test[vector-store]: add integration tests for ChromaDB
docs[README]: update Docker setup instructions
```

### Commit Workflow

**Claude Code will prepare commits for user to finalize** after completing each feature or fix, following these rules:

1. **When to Prepare Commits:**
   - After successfully implementing a feature
   - After fixing a bug
   - After completing a refactoring task
   - After tests pass (if tests were run)
   - When a logical unit of work is complete

2. **When NOT to Commit:**
   - Work in progress (WIP) that isn't functional
   - Code with failing tests
   - Incomplete implementations
   - Breaking changes without resolution

3. **Commit Preparation Process:**
   - Run `git status` to see all changes
   - Stage relevant files with `git add` (never stage secrets, temporary files, or unrelated changes)
   - Run `git diff --staged` to show what will be committed
   - Draft a commit message following the format above with appropriate type and scope
   - Include Claude attribution footer in the commit message
   - **Present the staged changes and draft message as a starting point**
   - **STOP - let user run `git commit` themselves with the message (copy-pasted or modified)**

4. **IMPORTANT:** Never run `git commit`. Always stage files, show the diff, provide a draft message, then stop and let the user commit.

### Git Safety

- Main branch: `main`
- Never force push to main/master
- Never skip hooks unless explicitly needed
- Never commit files that likely contain secrets (`.env`, `credentials.json`, etc.)
- Commit messages should focus on "why" not just "what"

## Important Notes

- **Never** use `GENERATE_MOCK_DATA_ON_RESTART=true` in production
- **Always** build `@openvaa/app-shared` before working on frontend/backend
- **WCAG 2.1 AA Compliance** is required for all frontend components
- **TypeScript strict mode** is enabled - all types must be explicit
- **No emojis** in code unless explicitly requested
- Break long comments naturally, not manually (for line wrapping flexibility)
