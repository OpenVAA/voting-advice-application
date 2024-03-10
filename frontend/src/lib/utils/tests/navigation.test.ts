import {beforeAll, expect, test} from 'vitest';
import {get} from 'svelte/store';
import {mockIsPageStore} from './mock-pageStore';
import {getRoute, Route} from '../navigation';

// Mock the $page store which is used by get(getRoute)
beforeAll(() => {
  vi.mock('$app/stores', () => {
    const page = mockIsPageStore;
    page.mockSetLocale('en');
    return {page};
  });
});

test('getRoute', () => {
  const defaultLocale = 'en';
  mockIsPageStore.mockSetLocale(defaultLocale);
  expect(get(getRoute)(Route.Home), 'Route with default locale').toEqual(`/${defaultLocale}`);
  expect(get(getRoute)({route: Route.Home, locale: 'none'}), 'Route with no locale').toEqual('');
  const id = '123';
  expect(get(getRoute)({route: Route.Home, id}), 'Route with id').toEqual(
    `/${defaultLocale}/${id}`
  );
  const params = {value: 'value=€'};
  expect(get(getRoute)({route: Route.Home, params}), 'Route with params').toEqual(
    `/${defaultLocale}?value=value%3D%E2%82%AC`
  );
  const locale = 'fi';
  expect(get(getRoute)({route: Route.Home, locale}), 'Route with overriden locale').toEqual(
    `/${locale}`
  );
  const subpath = 'help';
  const pathname = `/${defaultLocale}/${subpath}`;
  mockIsPageStore.mockSetPathname(pathname);
  expect(get(getRoute)({locale}), 'Switch locale without route').toEqual(`/${locale}/${subpath}`);
  expect(get(getRoute)({locale: 'none'}), 'Get route with no locale').toEqual(`/${subpath}`);
});
