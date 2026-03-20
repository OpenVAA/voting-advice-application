# Running the Development Environment

Make sure that you're using the recommended Node version (see [Requirements](/developers-guide/development/requirements)) by running `node -v`. If needed set the correct version with `nvm use <VERSION>`.

First, install dependencies for all workspaces:

```bash
yarn install
```

To start the development environment (Supabase backend + SvelteKit frontend), in the project's root directory:

- Make a copy of the `.env.example` file and rename the copy as `.env`
- Run `yarn dev`
- If you run into errors, try checking the tips in [Troubleshooting](/developers-guide/troubleshooting).

The `yarn dev` script will start the Supabase backend services and the SvelteKit dev server, and automatically build all the shared packages and start watching them for changes. If these change, they will be rebuilt and the frontend restarted to reflect the changes.

To stop all backend services:

```bash
yarn dev:down
```

To reset the database and re-seed development data:

```bash
yarn dev:reset
```

**When running the project, use the `.env` file in project root. Supabase service configuration is in `apps/supabase/supabase/config.toml`.**

If you want to seed the database with development data, run `yarn dev:reset` which applies all migrations and executes `apps/supabase/supabase/seed.sql`.
