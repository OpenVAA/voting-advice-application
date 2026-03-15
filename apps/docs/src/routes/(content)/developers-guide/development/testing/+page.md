# Testing

The project uses `vitest` for unit tests and `Playwright` for E2E testing.

## Unit tests

The unit tests can be run centrally from the repo root. You need to only build the shared dependencies once.

```bash
yarn build
## Run once
yarn test:unit
## or keep running
yarn test:unit:watch
```

## E2E tests

The project uses Playwright for E2E testing. The tests use their own dataset (`tests/tests/data/default-dataset.json`) which is imported via the Admin Tools API before each test run. This means E2E tests do **not** depend on `GENERATE_MOCK_DATA_ON_RESTART` being enabled.

### How it works

The test framework uses a project dependency chain:

1. **data-setup** — Imports the default test dataset via Admin Tools API
2. **auth-setup** — Authenticates as a test candidate and saves `storageState`
3. **Test projects** — Run with the pre-authenticated browser state

The test candidate user is created automatically on Strapi bootstrap (via `ensureDevData`). Its credentials are configurable via `DEV_CANDIDATE_EMAIL` and `DEV_CANDIDATE_PASSWORD` env vars (see [env vars](/developers-guide/configuration/environmental-variables)).

### Running E2E tests

All of the E2E tests are collected in the `/tests` folder. To run the E2E tests start all the services locally:

```bash
yarn dev
```

... and then:

```bash
yarn playwright install
yarn test:e2e
```

If you encounter any unexpected issues with the E2E tests, make sure to bring down the Docker stack properly to reset the database (more on mock data [here](/developers-guide/backend/mock-data-generation)).

To bring down the Docker stack properly (delete all containers, images and named volumes which include backend DB volume) run:

```bash
yarn dev:down
```
