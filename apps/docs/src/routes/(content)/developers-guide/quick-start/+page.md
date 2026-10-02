# Quick start

This page takes a fresh clone to a running app with demo data. The sequence is `yarn install`, a root `.env`, `yarn dev` and one seed command.

Before you start, install what [Requirements](/developers-guide/development/requirements) lists: Node, Yarn and a container runtime for the local Supabase stack.

## 1. Install the dependencies

```bash
yarn install
```

This installs every workspace. The Supabase CLI comes with it, as a dependency of `@openvaa/supabase`, so there is nothing to install globally.

## 2. Create the root `.env`

Copy the template at the repository root:

```bash
cp .env.example .env
```

The frontend, the seed tool and the test harness all read this one file. Never commit it. [Environment variables](/developers-guide/configuration/environmental-variables) describes every variable in it.

Two groups of values matter for a first run:

- **`PUBLIC_PROJECT_ID`** is already set to `00000000-0000-0000-0000-000000000001`, the default project that `apps/supabase/supabase/seed.sql` creates. Keep it. There is no fallback: if the value is empty or is not a UUID, the Supabase adapter throws when it is constructed, and the error message names the variable and this value.
- **The Supabase keys** are placeholders. Start the local stack and print its settings:

  ```bash
  yarn db:start
  yarn workspace @openvaa/supabase supabase status -o env
  ```

  Copy `ANON_KEY` into both `PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`, and `SERVICE_ROLE_KEY` into `SUPABASE_SERVICE_ROLE_KEY`. The service-role key bypasses row-level security. Only local tooling such as the seed command reads it; the frontend never does.

The identity-provider and Edge Function variables can keep their template values for now. They matter only for bank authentication and email.

## 3. Start the app

```bash
yarn dev
```

`yarn dev` first runs `yarn db:start`. It then clears the frontend's build caches (`.svelte-kit` and the Vite cache) and starts two processes side by side: a watcher that rebuilds the shared packages, and the frontend dev server.

The app is at <http://localhost:5173>. The port comes from `FRONTEND_PORT` in `.env`. The dev server uses `strictPort`, so if the port is taken, `yarn dev` fails instead of moving to another port.

## 4. Load demo data

The default project exists and is open for voters, but it has no elections or questions yet. Load the `default` demo template into it:

```bash
yarn db:seed:default
```

To start from a clean database instead, `yarn db:reset-with-data` resets the database (which runs `seed.sql` again) and then loads the same template. Both commands need `SUPABASE_SERVICE_ROLE_KEY`. [Seed data](/developers-guide/development/seed-data) covers the templates, the other options and the two test users.

## 5. Where to look next

- Supabase Studio, the database admin UI, is at <http://127.0.0.1:54323>.
- The local email testing server, which catches every email the stack sends, is at <http://127.0.0.1:54324>.
- [Running the development environment](/developers-guide/development/running-the-development-environment) explains the other `dev:*` and `db:*` scripts.
- [Architecture](/developers-guide/architecture) shows how the packages and the backend fit together.
- [Pre-registration and invitation](/developers-guide/candidate-app/pre-registration-and-invitation) is the first page on the Candidate app.

If something fails, see [Troubleshooting](/developers-guide/troubleshooting).
