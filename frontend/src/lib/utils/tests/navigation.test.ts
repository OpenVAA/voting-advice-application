import {beforeAll, expect, test} from 'vitest';
import {mockIsPageStore} from './mock-pageStore';
import {getRoute, Route} from '../navigation';

// Mock the $page store which is used by getRoute
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
  expect(getRoute(Route.Home), 'Route with default locale').toEqual(`/${defaultLocale}`);
  const id = '123';
  expect(getRoute({route: Route.Home, id}), 'Route with id').toEqual(`/${defaultLocale}/${id}`);
  const params = {value: 'value=€'};
  expect(getRoute({route: Route.Home, params}), 'Route with params').toEqual(
    `/${defaultLocale}?value=value%3D%E2%82%AC`
  );
  const locale = 'fi';
  expect(getRoute({route: Route.Home, locale}), 'Route with overriden locale').toEqual(
    `/${locale}`
  );
  const subpath = 'help';
  const pathname = `/${defaultLocale}/${subpath}`;
  mockIsPageStore.mockSetPathname(pathname);
  expect(getRoute({locale}), 'Switch locale without route').toEqual(`/${locale}/${subpath}`);
});
