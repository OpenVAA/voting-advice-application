/* eslint-disable @typescript-eslint/no-require-imports -- require might be needed*/
const { setupStrapi, cleanupStrapi } = require('./helpers/strapi');

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await cleanupStrapi();
});

it('strapi is defined', () => {
  expect(strapi).toBeDefined();
});

require('./election');
require('./user');
