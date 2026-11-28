import { LocalServerDataProvider } from './localServerDataProvider';

// eslint-disable-next-line no-restricted-syntax -- stateless: no constructor arguments, no configuration step, and its one field is set once from build-time static settings, so no request can leave state behind
export const dataProvider = new LocalServerDataProvider();
