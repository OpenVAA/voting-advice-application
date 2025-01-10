import { staticSettings } from '@openvaa/app-shared';
import type { DataProvider } from '$lib/api/base/dataProvider.type';

let module: Promise<{ dataProvider?: DataProvider<'server'> }>;

const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'local':
    module = import('./adapters/local/dataProvider');
    break;
  default:
    module = Promise.resolve({});
}

export const dataProvider = module.then((m) => m?.dataProvider);
