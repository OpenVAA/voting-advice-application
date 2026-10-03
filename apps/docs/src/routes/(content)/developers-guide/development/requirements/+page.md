# Requirements

To run OpenVAA locally you need:

- **Node.js**, in the version range set under `engines` in the root [`package.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/package.json). On a fresh clone, `yarn install` checks it through the `preinstall` script and fails if your Node version is outside that range; `yarn lint:check` checks it again on every run. A Node version manager such as nvm makes switching easy.
- **Yarn**, the version named in the `packageManager` field of the same file. The repository ships that Yarn release itself (`yarnPath` in [`.yarnrc.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.yarnrc.yml)), so any installed `yarn` command hands over to it.
- **A container runtime such as Docker**, installed and running. The Supabase CLI runs the local Supabase services (among them the database, Auth, Storage, the Edge Functions, Studio and the email testing server) as containers.

You do not need to install the Supabase CLI. It is the `supabase` dependency of `@openvaa/supabase`, so `yarn install` brings it, and the root `db:*` scripts run it for you.

For the E2E tests only, you also need the Playwright browsers:

```bash
yarn playwright install
```

The frontend dev server uses the port in `FRONTEND_PORT` (5173 in `.env.example`), and the local Supabase stack uses the fixed ports listed under [Local services](/developers-guide/backend/intro#local-services). Those ports must be free. [Running the development environment](/developers-guide/development/running-the-development-environment) explains how to move the frontend to another port.
