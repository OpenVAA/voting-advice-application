# Testing

The project uses `vitest` for unit tests and `Playwright` for E2E testing.

## Unit tests

The unit tests can be run centrally from the repo root. You need to only build the shared dependencies one.

```bash
yarn build:shared
# Run once
yarn test:unit
# or keep running
yarn test:unit:watch
```

## E2E tests

The project uses Playwright for E2E testing. The tests rely on generated data which the local PosgresDB is being seeded with. All of the E2E tests are collected in the [`tests`](/tests) folder.

To run the E2E tests start all the services locally:

```bash
yarn dev
```

... and then:

```bash
yarn playwright install
yarn test:e2e
```

If you encounter any unexpected issues with the E2E tests, make sure to bring down the Docker stack properly to reseed the DB with the original mock data (more on mock data [here](./backend/vaa-strapi/README.md#mock-data)).

To bring down the Docker stack properly (delete all containers, images and named volumes which include backend DB volume with potentially seeded mock data) run:

```bash
yarn dev:down
```
