import {APP_CONFIG} from '$lib/_config';
import type {DataProvider} from './dataProvider.type';

export let module: Promise<{dataProvider: DataProvider}>;

const {adapter} = APP_CONFIG.dataProvider;

switch (adapter) {
  case 'strapi':
    module = import('./adapters/strapi/provider');
    break;
  case 'local':
    module = import('./adapters/apiRoute/provider');
    break;
  default:
    throw new Error(`Unsupported data provider: ${adapter}`);
}

console.info(`[debug] dataProvider.ts: module loaded with data provider: ${adapter}`);

export const dataProvider = module.then((m) => m.dataProvider);
