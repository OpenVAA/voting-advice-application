import { test, expect } from '@playwright/test';
import { locales } from '../frontend/src/lib/i18n/translations';
import path from 'path';
import fs from 'fs';

/**
 * This is a temporary fix to ensure that the backend and frontend translation files match, and will be deprecated when the translations are moved to a shared module. This test could easily be run with `vitest`, but because there are currently no other non-e2e global tests, `playwright` is used.
 */
test.describe('Shared translation files', () => {
  Object.keys(locales).forEach((locale) => {
    test(`Dynamic translations in backend match those in frontend for locale ${locale}`, () => {
      const backend = fs.readFileSync(path.resolve(__dirname, path.join('../backend/vaa-strapi/src/functions/utils/translations', locale, 'dynamic.json'))).toString();
      const frontend = fs.readFileSync(path.resolve(__dirname, path.join('../frontend/src/lib/i18n/translations', locale, 'dynamic.json'))).toString();
      expect(backend).toEqual(frontend);
    })
  });
});