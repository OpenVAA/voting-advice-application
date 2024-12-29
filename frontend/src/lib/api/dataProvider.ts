import { staticSettings } from '@openvaa/app-shared';
import type { UniversalDataProvider } from './base/universalDataProvider';

let module: Promise<{ dataProvider: UniversalDataProvider }>;

const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/dataProvider');
    break;
  case 'local':
    module = import('./adapters/apiRoute/dataProvider');
    break;
  default:
    throw new Error(`Unsupported data provider: ${type}`);
}

export const dataProvider = module.then((m) => m.dataProvider);
